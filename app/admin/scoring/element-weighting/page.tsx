'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

interface ElementItem { rank: number; name: string; weight: number; equal: number; delta: number; }
interface DimensionData { name: string; weight: number; elements: number; cvR2: number; alpha: number; n: number; topElements: string[]; items: ElementItem[]; }

// ============================================
// SCORING CONSTANTS (from page_146_)
// ============================================

const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };
const INSUFFICIENT_DATA_THRESHOLD = 0.40;

const D10_EXCLUDED_ITEMS = [
  'Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'
];

const DEFAULT_DIMENSION_WEIGHTS: Record<number, number> = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3,
};

const DEFAULT_COMPOSITE_WEIGHTS = { weightedDim: 90, depth: 0, maturity: 5, breadth: 5 };
const DEFAULT_BLEND_WEIGHTS = {
  d1: { grid: 85, followUp: 15 }, d3: { grid: 85, followUp: 15 },
  d12: { grid: 85, followUp: 15 }, d13: { grid: 85, followUp: 15 },
};

const DIMENSION_NAMES: Record<number, string> = {
  1: 'Medical Leave & Flexibility', 2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability', 4: 'Cancer Support Resources',
  5: 'Workplace Accommodations', 6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement', 8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources', 10: 'Caregiver & Family Support',
  11: 'Prevention & Wellness', 12: 'Continuous Improvement',
  13: 'Communication & Awareness',
};

const DIMENSION_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

// ============================================

function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: POINTS.CURRENTLY_OFFER, isUnsure: false };
      case 3: return { points: POINTS.PLANNING, isUnsure: false };
      case 2: return { points: POINTS.ASSESSING, isUnsure: false };
      case 1: return { points: POINTS.NOT_ABLE, isUnsure: false };
      case 5: return { points: null, isUnsure: true };
      default: return { points: null, isUnsure: false };
    }
  }
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return { points: POINTS.NOT_ABLE, isUnsure: false };
    // Handle both "Unsure" and "Unknown (5)" as unsure responses
    if (s === 'unsure' || s.includes('unsure') || s.includes('unknown')) return { points: null, isUnsure: true };
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || s.includes('use') || s.includes('track') || s.includes('measure')) {
      return { points: POINTS.CURRENTLY_OFFER, isUnsure: false };
    }
    if (s.includes('planning') || s.includes('development')) return { points: POINTS.PLANNING, isUnsure: false };
    if (s.includes('assessing') || s.includes('feasibility')) return { points: POINTS.ASSESSING, isUnsure: false };
    if (s.length > 0) return { points: POINTS.NOT_ABLE, isUnsure: false };
  }
  return { points: null, isUnsure: false };
}

function getGeoMultiplier(geoResponse: string | number | undefined | null): number {
  // Single-country companies (no geo question asked) get 1.0 - question doesn't apply
  // The geo multiplier measures consistency across locations, which requires multiple locations
  if (geoResponse === undefined || geoResponse === null) return 1.0;
  
  if (typeof geoResponse === 'number') {
    switch (geoResponse) {
      case 1: return 0.75;  // Select locations only
      case 2: return 0.90;  // Varies by location
      case 3: return 1.0;   // Consistent globally
      default: return 1.0;  // N/A or unknown
    }
  }
  
  const s = String(geoResponse).toLowerCase();
  if (s.includes('consistent') || s.includes('generally consistent')) return 1.0;
  if (s.includes('vary') || s.includes('varies')) return 0.90;
  if (s.includes('select') || s.includes('only available in select')) return 0.75;
  return 1.0;  // Default to N/A treatment
}

// ============================================
// FOLLOW-UP SCORING FOR WEIGHTED BLEND
// ============================================

function scoreD1PaidLeave(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  // Match actual survey values: "13 or more weeks", "9 to less than 13 weeks", etc.
  if (v.includes('does not apply')) return 0;
  if (v.includes('13 or more') || v.includes('13 weeks or more') || v.includes('13+ weeks') || v.includes('more than 13')) return 100;
  if ((v.includes('9 to') && v.includes('13')) || v.includes('9-13')) return 70;
  if ((v.includes('5 to') && v.includes('9')) || v.includes('5-9')) return 40;
  if ((v.includes('3 to') && v.includes('5')) || v.includes('3-5')) return 20;
  if ((v.includes('1 to') && v.includes('3')) || v.includes('1-3')) return 10;
  return 0;
}

function scoreD1PartTime(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  // Match actual survey values: "26 weeks or more", "13 to less than 26 weeks", "12 to less than 26 weeks", etc.
  if (v.includes('no additional')) return 0;
  if (v.includes('medically necessary') || v.includes('healthcare provider')) return 100;
  if (v.includes('26 weeks or more') || v.includes('26+ weeks') || v.includes('26 or more')) return 80;
  // Handle both "12 to" and "13 to" less than 26 - treat as same tier
  if ((v.includes('12 to') || v.includes('13 to')) && v.includes('26')) return 50;
  if ((v.includes('5 to') && v.includes('12')) || (v.includes('5 to') && v.includes('13'))) return 30;
  if (v.includes('case-by-case')) return 40;
  if (v.includes('4 weeks') || v.includes('up to 4')) return 10;
  return 0;
}

function scoreD3Training(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  // Match actual survey values: "100%", "75 to less than 100%", "10 to less than 25%"
  // IMPORTANT: Check for exact "less than 10%" first (not "less than 100")
  if (v.includes('less than 10%') || v === 'less than 10' || v.includes('less than 10 percent')) return 0;
  if (v === '100%' || v === '100' || v.includes('100% of') || (v.includes('100') && !v.includes('less than'))) return 100;
  if (v.includes('75') && v.includes('100')) return 80;    // "75 to less than 100%"
  if (v.includes('50') && v.includes('75')) return 50;     // "50 to less than 75%"
  if (v.includes('25') && v.includes('50')) return 30;     // "25 to less than 50%"
  if (v.includes('10') && v.includes('25')) return 10;     // "10 to less than 25%"
  return 0;
}

function scoreD12CaseReview(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('systematic')) return 100;
  if (v.includes('ad hoc')) return 50;
  if (v.includes('aggregate') || v.includes('only review aggregate')) return 20;
  return 0;
}

// D12_2: Have individual employee experiences/reviews led to policy changes?
function scoreD12PolicyChanges(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('several') || v.includes('significant') || v.includes('major')) return 100;
  if (v.includes('few') || v.includes('some') || v.includes('minor') || v.includes('adjustments')) return 60;
  if (v === 'no' || v.includes('no change') || v.includes('not yet')) return 20;
  return 0;
}

function scoreD13Communication(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('monthly')) return 100;
  if (v.includes('quarterly')) return 70;
  if (v.includes('twice')) return 40;
  if (v.includes('annually') || v.includes('world cancer day')) return 20;
  if (v.includes('only when asked')) return 0;
  if (v.includes('do not actively') || v.includes('no regular')) return 0;
  return 0;
}

function calculateFollowUpScore(dimNum: number, assessment: Record<string, any>): number | null {
  const dimData = assessment[`dimension${dimNum}_data`];
  
  switch (dimNum) {
    case 1: {
      const d1_1_usa = dimData?.d1_1_usa;
      const d1_1_non_usa = dimData?.d1_1_non_usa;
      const d1_4b = dimData?.d1_4b;
      const scores: number[] = [];
      if (d1_1_usa) scores.push(scoreD1PaidLeave(d1_1_usa));
      if (d1_1_non_usa) scores.push(scoreD1PaidLeave(d1_1_non_usa));
      if (d1_4b) scores.push(scoreD1PartTime(d1_4b));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 3: {
      // Check both key formats: d31 (correct) and d3_1 (legacy migration)
      const d31 = dimData?.d31 ?? dimData?.d3_1;
      return d31 ? scoreD3Training(d31) : null;
    }
    case 12: {
      // D12 uses both D12_1 (case review method) and D12_2 (policy changes) - averaged
      const d12_1 = dimData?.d12_1;
      const d12_2 = dimData?.d12_2;
      const scores: number[] = [];
      if (d12_1) scores.push(scoreD12CaseReview(d12_1));
      if (d12_2) scores.push(scoreD12PolicyChanges(d12_2));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 13: {
      const d13_1 = dimData?.d13_1;
      return d13_1 ? scoreD13Communication(d13_1) : null;
    }
    default:
      return null;
  }
}

// ============================================
// MATURITY & BREADTH SCORING - FIXED
// ============================================

// Maturity = OR1 only - FIXED: Legal minimum = 0 points
function calculateMaturityScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const or1 = currentSupport.or1;
  
  // Handle numeric codes first (from imported data)
  if (or1 === 6 || or1 === '6') return 100; // Comprehensive/Leading-edge
  if (or1 === 5 || or1 === '5') return 80;  // Enhanced/Strong
  if (or1 === 4 || or1 === '4') return 50;  // Moderate
  if (or1 === 3 || or1 === '3') return 20;  // Developing/Basic
  if (or1 === 2 || or1 === '2') return 0;   // Legal minimum only
  if (or1 === 1 || or1 === '1') return 0;   // No formal approach
  
  // Fall back to text matching for survey app entries
  const v = String(or1 || '').toLowerCase();
  if (v.includes('leading-edge') || v.includes('leading edge')) return 100;
  if (v.includes('comprehensive')) return 100;
  if (v.includes('enhanced') || v.includes('strong')) return 80;
  if (v.includes('moderate')) return 50;
  if (v.includes('basic')) return 20;
  if (v.includes('developing')) return 20;
  if (v.includes('legal minimum')) return 0;
  if (v.includes('no formal')) return 0;
  return 0;
}

function calculateBreadthScore(assessment: Record<string, any>): number {
  // Check BOTH current_support_data AND general_benefits_data for cb3 fields
  // Some companies have these in current_support_data, others in general_benefits_data
  const currentSupport = assessment.current_support_data || {};
  const generalBenefits = assessment.general_benefits_data || {};
  
  const scores: number[] = [];
  
  // CB3a: Check both sources, prefer current_support_data if present
  const cb3a = currentSupport.cb3a ?? generalBenefits.cb3a;
  
  // Handle numeric codes first (from imported data)
  if (cb3a === 3 || cb3a === '3') {
    scores.push(100); // Yes, we offer additional support
  } else if (cb3a === 2 || cb3a === '2') {
    scores.push(50); // Currently developing
  } else if (cb3a === 1 || cb3a === '1') {
    scores.push(0); // No additional support
  } else if (cb3a !== undefined && cb3a !== null) {
    // Fall back to text matching for survey app entries
    const v = String(cb3a).toLowerCase();
    if (v.includes('yes') && v.includes('additional support')) {
      scores.push(100);
    } else if (v.includes('developing') || v.includes('currently developing')) {
      scores.push(50);
    } else {
      scores.push(0);
    }
  } else {
    scores.push(0);
  }
  
  // CB3b: Check both sources
  const cb3b = currentSupport.cb3b || generalBenefits.cb3b;
  if (cb3b && Array.isArray(cb3b)) {
    const cb3bScore = Math.min(100, Math.round((cb3b.length / 6) * 100));
    scores.push(cb3bScore);
  } else {
    scores.push(0);
  }
  
  // CB3c: Check both sources
  const cb3c = currentSupport.cb3c || generalBenefits.cb3c;
  if (cb3c && Array.isArray(cb3c)) {
    const cb3cScore = Math.min(100, Math.round((cb3c.length / 13) * 100));
    scores.push(cb3cScore);
  } else {
    scores.push(0);
  }
  
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

interface DimensionScore {
  rawScore: number;
  adjustedScore: number;
  geoMultiplier: number;
  totalItems: number;
  answeredItems: number;
  unsureCount: number;
  unsurePercent: number;
  isInsufficientData: boolean;
  followUpScore: number | null;
  blendedScore: number;
}

function calculateDimensionScore(
  dimNum: number, 
  dimData: Record<string, any> | null, 
  assessment?: Record<string, any>,
  blendWeights?: typeof DEFAULT_BLEND_WEIGHTS
): DimensionScore {
  const result: DimensionScore = {
    rawScore: 0, adjustedScore: 0, geoMultiplier: 1.0, totalItems: 0,
    answeredItems: 0, unsureCount: 0, unsurePercent: 0, isInsufficientData: false,
    followUpScore: null, blendedScore: 0,
  };
  if (!dimData) return result;
  const mainGrid = dimData[`d${dimNum}a`];
  if (!mainGrid || typeof mainGrid !== 'object') return result;
  let earnedPoints = 0;
  
  // Process grid items, excluding D10 items that weren't in original survey
  Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
    // Skip excluded D10 items for Year 1 scoring fairness
    if (dimNum === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) {
      return; // Skip this item entirely
    }
    
    result.totalItems++;
    const { points, isUnsure } = statusToPoints(status);
    if (isUnsure) { result.unsureCount++; result.answeredItems++; }
    else if (points !== null) { result.answeredItems++; earnedPoints += points; }
  });
  
  result.unsurePercent = result.totalItems > 0 ? result.unsureCount / result.totalItems : 0;
  result.isInsufficientData = result.unsurePercent > INSUFFICIENT_DATA_THRESHOLD;
  const maxPoints = result.answeredItems * POINTS.CURRENTLY_OFFER;
  if (maxPoints > 0) result.rawScore = Math.round((earnedPoints / maxPoints) * 100);
  const geoResponse = dimData[`d${dimNum}aa`] || dimData[`D${dimNum}aa`];
  result.geoMultiplier = getGeoMultiplier(geoResponse);
  result.adjustedScore = Math.round(result.rawScore * result.geoMultiplier);
  
  // Apply weighted blend for D1, D3, D12, D13
  if (assessment && [1, 3, 12, 13].includes(dimNum) && blendWeights) {
    result.followUpScore = calculateFollowUpScore(dimNum, assessment);
    if (result.followUpScore !== null) {
      const key = `d${dimNum}` as keyof typeof DEFAULT_BLEND_WEIGHTS;
      const gridPct = blendWeights[key]?.grid ?? 85;
      const followUpPct = blendWeights[key]?.followUp ?? 15;
      result.blendedScore = Math.round((result.adjustedScore * (gridPct / 100)) + (result.followUpScore * (followUpPct / 100)));
    } else {
      result.blendedScore = result.adjustedScore;
    }
  } else {
    result.blendedScore = result.adjustedScore;
  }
  
  return result;
}

interface CompanyScores {
  companyName: string;
  surveyId: string;
  dimensions: Record<number, DimensionScore>;
  unweightedScore: number;
  weightedScore: number;
  insufficientDataCount: number;
  isProvisional: boolean;
  isComplete: boolean;
  isFoundingPartner: boolean;
  isPanel: boolean;
  completedDimCount: number;
  compositeScore: number;
  depthScore: number;
  maturityScore: number;
  breadthScore: number;
  globalFootprint: {
    countryCount: number;
    segment: 'Single' | 'Regional' | 'Global';
    isMultiCountry: boolean;
  };
  dataConfidence: {
    percent: number;
    totalItems: number;
    verifiedItems: number;
    unsureCount: number;
  };
}

function calculateCompanyScores(
  assessment: Record<string, any>, 
  weights: Record<number, number>, 
  compositeWeights: typeof DEFAULT_COMPOSITE_WEIGHTS,
  blendWeights: typeof DEFAULT_BLEND_WEIGHTS
): CompanyScores {
  const dimensions: Record<number, DimensionScore> = {};
  let completedDimCount = 0;
  
  for (let i = 1; i <= 13; i++) {
    const dimData = assessment[`dimension${i}_data`];
    dimensions[i] = calculateDimensionScore(i, dimData, assessment, blendWeights);
    if (dimensions[i].totalItems > 0) completedDimCount++;
  }
  
  const isComplete = completedDimCount === 13;
  const insufficientDataCount = Object.values(dimensions).filter(d => d.isInsufficientData).length;
  const isProvisional = insufficientDataCount >= 4;
  
  const appId = assessment.app_id || assessment.survey_id || '';
  const isFoundingPartner = appId.startsWith('FP-') || assessment.is_founding_partner === true || assessment.payment_method === 'founding_partner';
  const isPanel = appId.startsWith('PANEL-');
  
  let unweightedScore = 0;
  let weightedScore = 0;
  
  if (isComplete) {
    const dimsWithData = Object.values(dimensions).filter(d => d.totalItems > 0);
    unweightedScore = dimsWithData.length > 0
      ? Math.round(dimsWithData.reduce((sum, d) => sum + d.blendedScore, 0) / dimsWithData.length)
      : 0;
    
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      for (let i = 1; i <= 13; i++) {
        const dim = dimensions[i];
        const weight = weights[i] || 0;
        weightedScore += dim.blendedScore * (weight / totalWeight);
      }
    }
    weightedScore = Math.round(weightedScore);
  }
  
  const maturityScore = calculateMaturityScore(assessment);
  const breadthScore = calculateBreadthScore(assessment);
  
  // Extract global footprint from firmographics
  const firmographics = assessment.firmographics_data || {};
  const s9a = firmographics.s9a || ''; // Number of OTHER countries besides HQ
  let countryCount = 1; // Start with 1 (headquarters)
  
  // Parse s9a to get additional country count
  if (typeof s9a === 'string') {
    const s = s9a.toLowerCase();
    if (s.includes('no other countries') || s.includes('headquarters only')) {
      countryCount = 1;
    } else if (s.includes('50 or more') || s.includes('50+')) {
      countryCount = 51; // 50+ other countries + HQ
    } else if (s.includes('20 to 49')) {
      countryCount = 35; // midpoint + HQ
    } else if (s.includes('10 to 19')) {
      countryCount = 15; // midpoint + HQ
    } else if (s.includes('5 to 9')) {
      countryCount = 8; // midpoint + HQ
    } else if (s.includes('3 to 4')) {
      countryCount = 4; // midpoint + HQ
    } else if (s.includes('1 to 2')) {
      countryCount = 2; // midpoint + HQ
    }
  }
  
  // Determine segment
  const segment: 'Single' | 'Regional' | 'Global' = 
    countryCount === 1 ? 'Single' : 
    countryCount <= 10 ? 'Regional' : 'Global';
  
  const globalFootprint = {
    countryCount,
    segment,
    isMultiCountry: countryCount > 1,
  };
  
  // Calculate Data Confidence (% of items not marked "Unsure")
  let totalItems = 0;
  let unsureCount = 0;
  for (let i = 1; i <= 13; i++) {
    totalItems += dimensions[i].totalItems;
    unsureCount += dimensions[i].unsureCount;
  }
  const verifiedItems = totalItems - unsureCount;
  const dataConfidence = {
    percent: totalItems > 0 ? Math.round((verifiedItems / totalItems) * 100) : 0,
    totalItems,
    verifiedItems,
    unsureCount,
  };
  
  const compositeScore = isComplete ? Math.round(
    (weightedScore * (compositeWeights.weightedDim / 100)) +
    (maturityScore * (compositeWeights.maturity / 100)) +
    (breadthScore * (compositeWeights.breadth / 100))
  ) : 0;
  
  return {
    companyName: (assessment.company_name || 'Unknown').replace('Panel Company ', 'Panel Co '),
    surveyId: assessment.app_id || assessment.survey_id || 'N/A',
    dimensions, unweightedScore, weightedScore, insufficientDataCount,
    isProvisional, isComplete, isFoundingPartner, isPanel, completedDimCount,
    compositeScore,
    depthScore: 0,
    maturityScore,
    breadthScore,
    globalFootprint,
    dataConfidence,
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#0284C7';
  if (score >= 40) return '#D97706';
  return '#DC2626';
}

// ============================================
// ELEMENT-WEIGHTED SCORING
// ============================================

function calculateElementWeightedDimensionScore(
  dimNum: number,
  dimData: Record<string, any> | null,
  assessment?: Record<string, any>,
  blendWeights?: typeof DEFAULT_BLEND_WEIGHTS
): { equalScore: number; weightedScore: number; blendedEqual: number; blendedWeighted: number } {
  const result = { equalScore: 0, weightedScore: 0, blendedEqual: 0, blendedWeighted: 0 };
  if (!dimData) return result;
  
  const mainGrid = dimData[`d${dimNum}a`];
  if (!mainGrid || typeof mainGrid !== 'object') return result;
  
  const dimWeights = ELEMENT_WEIGHTS[dimNum] || {};
  let earnedPoints = 0;
  let weightedEarned = 0;
  let weightedMax = 0;
  let answeredItems = 0;
  let unsureCount = 0;
  let totalItems = 0;
  
  Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
    if (dimNum === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) return;
    totalItems++;
    const { points, isUnsure } = statusToPoints(status);
    
    // Find element weight (fuzzy match for slight name differences)
    let elemWeight = dimWeights[itemKey];
    if (elemWeight === undefined) {
      // Try partial match
      const keys = Object.keys(dimWeights);
      const match = keys.find(k => k.startsWith(itemKey.substring(0, 30)) || itemKey.startsWith(k.substring(0, 30)));
      elemWeight = match ? dimWeights[match] : (1 / totalItems); // fallback to equal
    }
    
    if (isUnsure) { 
      unsureCount++; 
      answeredItems++;
      // Unsure = 0 points earned, but counts in denominator
      weightedMax += POINTS.CURRENTLY_OFFER * (elemWeight || 0);
    } else if (points !== null) { 
      answeredItems++; 
      earnedPoints += points;
      weightedEarned += points * (elemWeight || 0);
      weightedMax += POINTS.CURRENTLY_OFFER * (elemWeight || 0);
    }
  });
  
  // Equal-weight raw score (same as page_146_)
  const maxPoints = answeredItems * POINTS.CURRENTLY_OFFER;
  if (maxPoints > 0) result.equalScore = Math.round((earnedPoints / maxPoints) * 100);
  
  // Element-weighted raw score
  if (weightedMax > 0) result.weightedScore = Math.round((weightedEarned / weightedMax) * 100);
  
  // Apply geo multiplier
  const geoResponse = dimData[`d${dimNum}aa`] || dimData[`D${dimNum}aa`];
  const geoMult = getGeoMultiplier(geoResponse);
  result.equalScore = Math.round(result.equalScore * geoMult);
  result.weightedScore = Math.round(result.weightedScore * geoMult);
  
  // Apply follow-up blend for D1, D3, D12, D13
  if (assessment && [1, 3, 12, 13].includes(dimNum) && blendWeights) {
    const followUpScore = calculateFollowUpScore(dimNum, assessment);
    if (followUpScore !== null) {
      const key = `d${dimNum}` as keyof typeof DEFAULT_BLEND_WEIGHTS;
      const gridPct = blendWeights[key]?.grid ?? 85;
      const followUpPct = blendWeights[key]?.followUp ?? 15;
      result.blendedEqual = Math.round((result.equalScore * (gridPct / 100)) + (followUpScore * (followUpPct / 100)));
      result.blendedWeighted = Math.round((result.weightedScore * (gridPct / 100)) + (followUpScore * (followUpPct / 100)));
    } else {
      result.blendedEqual = result.equalScore;
      result.blendedWeighted = result.weightedScore;
    }
  } else {
    result.blendedEqual = result.equalScore;
    result.blendedWeighted = result.weightedScore;
  }
  
  return result;
}

interface CompanyComparison {
  companyName: string;
  surveyId: string;
  isComplete: boolean;
  isPanel: boolean;
  isFoundingPartner: boolean;
  dims: Record<number, { eq: number; wt: number }>;
  eqComposite: number;
  wtComposite: number;
  maturityScore: number;
  breadthScore: number;
}

function calculateCompanyComparison(assessment: Record<string, any>): CompanyComparison {
  // EQUAL-WEIGHT: Use the EXACT same function as page_146_ scoring page
  const eqScores = calculateCompanyScores(assessment, DEFAULT_DIMENSION_WEIGHTS, DEFAULT_COMPOSITE_WEIGHTS, DEFAULT_BLEND_WEIGHTS);
  
  // ELEMENT-WEIGHTED: Calculate weighted dimension scores
  const dims: Record<number, { eq: number; wt: number }> = {};
  for (let i = 1; i <= 13; i++) {
    const dimData = assessment[`dimension${i}_data`];
    const wtResult = calculateElementWeightedDimensionScore(i, dimData, assessment, DEFAULT_BLEND_WEIGHTS);
    // Equal side comes from the original scoring function (guaranteed correct)
    dims[i] = { eq: eqScores.dimensions[i]?.blendedScore || 0, wt: wtResult.blendedWeighted };
  }
  
  // Element-weighted composite: apply dimension weights to weighted dim scores, then 90/5/5
  let wtWeightedDim = 0;
  const totalWeight = Object.values(DEFAULT_DIMENSION_WEIGHTS).reduce((s, w) => s + w, 0);
  if (eqScores.isComplete) {
    for (let i = 1; i <= 13; i++) {
      const w = DEFAULT_DIMENSION_WEIGHTS[i] || 0;
      wtWeightedDim += dims[i].wt * (w / totalWeight);
    }
  }
  const wtComposite = eqScores.isComplete ? Math.round(
    (Math.round(wtWeightedDim) * (DEFAULT_COMPOSITE_WEIGHTS.weightedDim / 100)) +
    (eqScores.maturityScore * (DEFAULT_COMPOSITE_WEIGHTS.maturity / 100)) +
    (eqScores.breadthScore * (DEFAULT_COMPOSITE_WEIGHTS.breadth / 100))
  ) : 0;
  
  return {
    companyName: eqScores.companyName,
    surveyId: eqScores.surveyId,
    isComplete: eqScores.isComplete,
    isPanel: eqScores.isPanel,
    isFoundingPartner: eqScores.isFoundingPartner,
    dims,
    eqComposite: eqScores.compositeScore,  // From original scoring function
    wtComposite,
    maturityScore: eqScores.maturityScore,
    breadthScore: eqScores.breadthScore,
  };
}

// ============================================
// COMBINED SCORING: Element Weights + Unsure Substitution
// ============================================

interface CombinedCompanyResult {
  companyName: string;
  surveyId: string;
  isComplete: boolean;
  isPanel: boolean;
  dims: Record<number, { eq: number; wt: number; unsure: number; combined: number }>;
  eqComposite: number;      // Equal-weight, unsure=0
  wtComposite: number;      // Element-weighted, unsure=0
  unsureComposite: number;  // Equal-weight + unsure substitution
  combinedComposite: number; // Element-weighted + unsure substitution
  maturityScore: number;
  breadthScore: number;
}

function calculateCombinedScore(
  assessment: Record<string, any>,
  populationMeans: Record<number, number>
): CombinedCompanyResult {
  // Get baseline scores
  const eqScores = calculateCompanyScores(assessment, DEFAULT_DIMENSION_WEIGHTS, DEFAULT_COMPOSITE_WEIGHTS, DEFAULT_BLEND_WEIGHTS);

  const dims: Record<number, { eq: number; wt: number; unsure: number; combined: number }> = {};

  for (let i = 1; i <= 13; i++) {
    const dimData = assessment[`dimension${i}_data`];

    // Equal-weight score (from original function)
    const eqScore = eqScores.dimensions[i]?.blendedScore || 0;

    // Element-weighted score (unsure=0)
    const wtResult = calculateElementWeightedDimensionScore(i, dimData, assessment, DEFAULT_BLEND_WEIGHTS);
    const wtScore = wtResult.blendedWeighted;

    // Unsure-only: Equal-weight base + unsure substitution (no element weighting)
    let unsureScore = eqScore;
    if (dimData) {
      const uGrid = dimData[`d${i}a`];
      if (uGrid && typeof uGrid === 'object') {
        let uEarned = 0;
        let uUnsure = 0;
        let uAnswered = 0;
        Object.entries(uGrid).forEach(([key, status]: [string, any]) => {
          if (i === 10 && D10_EXCLUDED_ITEMS.includes(key)) return;
          const { points, isUnsure } = statusToPoints(status);
          if (isUnsure) { uUnsure++; uAnswered++; }
          else if (points !== null) { uEarned += points; uAnswered++; }
        });
        if (uAnswered > 0) {
          const uMax = uAnswered * POINTS.CURRENTLY_OFFER;
          const r = uUnsure / uAnswered;
          const mu = populationMeans[i] || 3.09;
          let uCredit = uUnsure * mu * Math.pow(1 - r, 2);
          const uCap = 0.10 * uMax;
          if (uCredit > uCap) uCredit = uCap;
          unsureScore = Math.round(((uEarned + uCredit) / uMax) * 100);
          // Geo multiplier
          const geoR = dimData[`d${i}aa`] || dimData[`D${i}aa`];
          unsureScore = Math.round(unsureScore * getGeoMultiplier(geoR));
          // Follow-up blend
          if ([1, 3, 12, 13].includes(i)) {
            const fuScore = calculateFollowUpScore(i, assessment);
            if (fuScore !== null) {
              const key2 = `d${i}` as keyof typeof DEFAULT_BLEND_WEIGHTS;
              unsureScore = Math.round((unsureScore * (DEFAULT_BLEND_WEIGHTS[key2]?.grid ?? 85) / 100) + (fuScore * (DEFAULT_BLEND_WEIGHTS[key2]?.followUp ?? 15) / 100));
            }
          }
        }
      }
    }

    // Combined: Element-weighted base + unsure substitution
    // Recalculate with element weights AND unsure credit
    let combinedScore = wtScore;

    if (dimData) {
      const mainGrid = dimData[`d${i}a`];
      if (mainGrid && typeof mainGrid === 'object') {
        const dimWeights = ELEMENT_WEIGHTS[i] || {};
        let weightedEarned = 0;
        let weightedMax = 0;
        let unsureCount = 0;
        let answeredItems = 0;

        Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
          if (i === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) return;
          const { points, isUnsure } = statusToPoints(status);

          // Find element weight
          let elemWeight = dimWeights[itemKey];
          if (elemWeight === undefined) {
            const keys = Object.keys(dimWeights);
            const match = keys.find(k => k.startsWith(itemKey.substring(0, 30)) || itemKey.startsWith(k.substring(0, 30)));
            elemWeight = match ? dimWeights[match] : undefined;
          }
          const w = elemWeight || (1 / Object.keys(mainGrid).length);

          if (isUnsure) {
            unsureCount++;
            answeredItems++;
            weightedMax += POINTS.CURRENTLY_OFFER * w;
          } else if (points !== null) {
            answeredItems++;
            weightedEarned += points * w;
            weightedMax += POINTS.CURRENTLY_OFFER * w;
          }
        });

        if (answeredItems > 0 && weightedMax > 0) {
          // Unsure substitution: (1-r)^2 discount on population mean
          const r = unsureCount / answeredItems;
          const mu = populationMeans[i] || 3.09;
          const v_d = mu * Math.pow(1 - r, 2);

          // For combined, unsure credit uses average element weight
          const avgWeight = answeredItems > 0 ? (weightedMax / (answeredItems * POINTS.CURRENTLY_OFFER)) : (1 / answeredItems);
          let unsureCredit = unsureCount * v_d * avgWeight;

          // Cap at 10% of weighted max
          const cap = 0.10 * weightedMax;
          if (unsureCredit > cap) unsureCredit = cap;

          combinedScore = Math.round(((weightedEarned + unsureCredit) / weightedMax) * 100);

          // Apply geo multiplier
          const geoResponse = dimData[`d${i}aa`] || dimData[`D${i}aa`];
          const geoMult = getGeoMultiplier(geoResponse);
          combinedScore = Math.round(combinedScore * geoMult);

          // Apply follow-up blend
          if ([1, 3, 12, 13].includes(i)) {
            const followUpScore = calculateFollowUpScore(i, assessment);
            if (followUpScore !== null) {
              const key = `d${i}` as keyof typeof DEFAULT_BLEND_WEIGHTS;
              const gridPct = DEFAULT_BLEND_WEIGHTS[key]?.grid ?? 85;
              const followUpPct = DEFAULT_BLEND_WEIGHTS[key]?.followUp ?? 15;
              combinedScore = Math.round((combinedScore * (gridPct / 100)) + (followUpScore * (followUpPct / 100)));
            }
          }
        }
      }
    }

    dims[i] = { eq: eqScore, wt: wtScore, unsure: unsureScore, combined: combinedScore };
  }

  // Composites
  const totalWeight = Object.values(DEFAULT_DIMENSION_WEIGHTS).reduce((s, w) => s + w, 0);

  let wtWeightedDim = 0;
  let unsureWeightedDim = 0;
  let combinedWeightedDim = 0;
  if (eqScores.isComplete && totalWeight > 0) {
    for (let d = 1; d <= 13; d++) {
      const w = DEFAULT_DIMENSION_WEIGHTS[d] || 0;
      wtWeightedDim += dims[d].wt * (w / totalWeight);
      unsureWeightedDim += dims[d].unsure * (w / totalWeight);
      combinedWeightedDim += dims[d].combined * (w / totalWeight);
    }
  }

  const calcComposite = (dimAvg: number) => eqScores.isComplete ? Math.round(
    (Math.round(dimAvg) * (DEFAULT_COMPOSITE_WEIGHTS.weightedDim / 100)) +
    (eqScores.maturityScore * (DEFAULT_COMPOSITE_WEIGHTS.maturity / 100)) +
    (eqScores.breadthScore * (DEFAULT_COMPOSITE_WEIGHTS.breadth / 100))
  ) : 0;

  return {
    companyName: eqScores.companyName,
    surveyId: eqScores.surveyId,
    isComplete: eqScores.isComplete,
    isPanel: eqScores.isPanel,
    dims,
    eqComposite: eqScores.compositeScore,
    wtComposite: calcComposite(wtWeightedDim),
    unsureComposite: calcComposite(unsureWeightedDim),
    combinedComposite: calcComposite(combinedWeightedDim),
    maturityScore: eqScores.maturityScore,
    breadthScore: eqScores.breadthScore,
  };
}


// ============================================
// ELEMENT WEIGHTS — v6.1 (Authoritative)
// ============================================

const ELEMENT_WEIGHTS: Record<number, Record<string, number>> = {
  1: {
    'Emergency leave within 24 hours': 0.151498,
    'Paid micro-breaks for medical-related side effects': 0.145863,
    'Remote work options for on-site employees': 0.136270,
    'Intermittent leave beyond local / legal requirements': 0.120228,
    'Flexible work hours during treatment (e.g., varying start/end times, compressed schedules)': 0.080449,
    'Job protection beyond local / legal requirements': 0.065953,
    'Paid medical leave beyond local / legal requirements': 0.062434,
    'Reduced schedule/part-time with full benefits': 0.061304,
    'PTO accrual during leave': 0.059080,
    'Disability pay top-up (employer adds to disability insurance)': 0.058566,
    'Leave donation bank (employees can donate PTO to colleagues)': 0.058354,
  },
  2: {
    'Accelerated life insurance benefits (partial payout for terminal / critical illness)': 0.172389,
    'Tax/estate planning assistance': 0.134633,
    'Real-time cost estimator tools': 0.074168,
    'Insurance advocacy/pre-authorization support': 0.071963,
    '$0 copay for specialty drugs': 0.055324,
    'Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance': 0.046307,
    'Financial counseling services': 0.044892,
    'Long-term disability covering 60%+ of salary': 0.044791,
    'Paid time off for clinical trial participation': 0.043340,
    'Coverage for clinical trials and experimental treatments not covered by standard health insurance': 0.042387,
    'Short-term disability covering 60%+ of salary': 0.042358,
    'Hardship grants program funded by employer': 0.039505,
    'Guaranteed job protection': 0.038521,
    'Employer-paid disability insurance supplements': 0.037982,
    'Voluntary supplemental illness insurance (with employer contribution)': 0.037766,
    'Set out-of-pocket maximums (for in-network single coverage)': 0.036936,
    'Travel/lodging reimbursement for specialized care beyond insurance coverage': 0.036738,
  },
  3: {
    'Manager peer support / community building': 0.200000,
    'Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams': 0.195800,
    'Empathy/communication skills training': 0.163859,
    'Dedicated manager resource hub': 0.080186,
    'Clear escalation protocol for manager response': 0.070666,
    'Manager evaluations include how well they support impacted employees': 0.063245,
    'Privacy protection and confidentiality management': 0.058366,
    'AI-powered guidance tools': 0.057978,
    'Legal compliance training': 0.055460,
    'Senior leader coaching on supporting impacted employees': 0.054441,
  },
  4: {
    'Physical rehabilitation support': 0.200000,
    'Nutrition coaching': 0.131677,
    'Insurance advocacy/appeals support': 0.102429,
    'Dedicated navigation support to help employees understand benefits and access medical care': 0.086678,
    'Online tools, apps, or portals for health/benefits support': 0.081811,
    'Occupational therapy/vocational rehabilitation': 0.080657,
    'Care coordination concierge': 0.080467,
    'Survivorship planning assistance': 0.080126,
    'Benefits optimization assistance (maximizing coverage, minimizing costs)': 0.078984,
    'Clinical trial matching service': 0.077171,
  },
  5: {
    'Flexible scheduling options': 0.200000,
    'Ergonomic equipment funding': 0.139903,
    'Temporary role redesigns': 0.112514,
    'Rest areas / quiet spaces': 0.112482,
    'Assistive technology catalog': 0.089377,
    'Cognitive / fatigue support tools': 0.067979,
    'Priority parking': 0.065542,
    'Policy accommodations (e.g., dress code flexibility, headphone use)': 0.057743,
    'Remote work capability': 0.053926,
    'Physical workspace modifications': 0.052285,
    'Transportation reimbursement': 0.048250,
  },
  6: {
    'Employee peer support groups (internal employees with shared experience)': 0.200000,
    'Stigma-reduction initiatives': 0.162816,
    'Anonymous benefits navigation tool or website (no login required)': 0.103949,
    'Specialized emotional counseling': 0.074589,
    'Manager training on handling sensitive health information': 0.066403,
    'Strong anti-discrimination policies specific to health conditions': 0.063480,
    'Inclusive communication guidelines': 0.062325,
    'Professional-led support groups (external facilitator/counselor)': 0.059117,
    'Written anti-retaliation policies for health disclosures': 0.056450,
    'Confidential HR channel for health benefits, policies and insurance-related questions': 0.050848,
    'Clear process for confidential health disclosures': 0.050423,
    'Optional open health dialogue forums': 0.049601,
  },
  7: {
    'Peer mentorship program (employees who had similar condition mentoring current employees)': 0.200000,
    'Continued access to training/development': 0.179672,
    'Adjusted performance goals/deliverables during treatment and recovery': 0.100591,
    'Succession planning protections': 0.097304,
    'Optional stay-connected program': 0.096021,
    'Structured reintegration programs': 0.093596,
    'Career coaching for employees managing cancer or other serious health conditions': 0.082895,
    'Professional coach/mentor for employees managing cancer or other serious health conditions': 0.076372,
    'Project continuity protocols': 0.073549,
  },
  8: {
    'Flexibility for medical setbacks': 0.192209,
    'Long-term success tracking': 0.142762,
    'Manager training on supporting team members during treatment/return': 0.137150,
    'Workload adjustments during treatment': 0.091974,
    'Access to occupational therapy/vocational rehabilitation': 0.079713,
    'Buddy/mentor pairing for support': 0.058763,
    'Structured progress reviews': 0.057281,
    'Flexible work arrangements during treatment': 0.054804,
    'Online peer support forums': 0.053836,
    'Phased return-to-work plans': 0.044535,
    'Contingency planning for treatment schedules': 0.044362,
    'Access to specialized work resumption professionals': 0.042611,
  },
  9: {
    'Executive sponsors communicate regularly about workplace support programs': 0.200000,
    'ESG/CSR reporting inclusion': 0.158208,
    'Public success story celebrations': 0.146335,
    'Year-over-year budget growth': 0.096558,
    'Support programs included in investor/stakeholder communications': 0.067685,
    'Compensation tied to support outcomes': 0.060404,
    'Executive accountability metrics': 0.055585,
    'C-suite executive serves as program champion/sponsor': 0.054714,
    'Cross-functional executive steering committee for workplace support programs': 0.054045,
    'Support metrics included in annual report/sustainability reporting': 0.053759,
    'Dedicated budget allocation for serious illness support programs': 0.052707,
  },
  10: {
    'Practical support for managing caregiving and work': 0.131514,
    'Eldercare consultation and referral services': 0.103193,
    'Family navigation support': 0.077622,
    'Caregiver resource navigator/concierge': 0.050702,
    'Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)': 0.048625,
    'Paid caregiver leave with expanded eligibility (beyond local legal requirements)': 0.048618,
    'Unpaid leave job protection beyond local / legal requirements': 0.044999,
    'Flexible work arrangements for caregivers': 0.043468,
    'Emergency dependent care when regular arrangements unavailable': 0.043214,
    'Respite care funding/reimbursement': 0.042846,
    'Paid time off for care coordination appointments': 0.042804,
    'Legal/financial planning assistance for caregivers': 0.042621,
    'Manager training for supervising caregivers': 0.041345,
    'Caregiver peer support groups': 0.041327,
    'Dependent care subsidies': 0.040713,
    'Mental health support specifically for caregivers': 0.040699,
    'Modified job duties during peak caregiving periods': 0.039239,
    'Emergency caregiver funds': 0.038339,
    'Dependent care account matching/contributions': 0.038112,
  },
  11: {
    'Legal protections beyond requirements': 0.165547,
    'Individual health assessments (online or in-person)': 0.145301,
    'Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)': 0.125210,
    'Genetic screening/counseling': 0.117179,
    'Full or partial coverage for annual health screenings/checkups': 0.059233,
    'Regular health education sessions': 0.054959,
    'Paid time off for preventive care appointments': 0.054171,
    'At least 70% coverage for regionally / locally recommended screenings': 0.053351,
    'On-site vaccinations': 0.049866,
    'Workplace safety assessments to minimize health risks': 0.045736,
    'Targeted risk-reduction programs': 0.045514,
    'Risk factor tracking/reporting': 0.044358,
    'Lifestyle coaching programs': 0.039574,
  },
  12: {
    'Regular program enhancements': 0.200000,
    'Employee confidence in employer support': 0.165613,
    'Innovation pilots': 0.154468,
    'External benchmarking': 0.140249,
    'Program utilization analytics': 0.107703,
    'Return-to-work success metrics': 0.086759,
    'Employee satisfaction tracking': 0.074333,
    'Business impact/ROI assessment': 0.070875,
  },
  13: {
    'Family/caregiver communication inclusion': 0.200000,
    'Ability to access program information and resources anonymously': 0.200000,
    'Employee testimonials/success stories': 0.146375,
    'Proactive communication at point of diagnosis disclosure': 0.140715,
    'Multi-channel communication strategy': 0.105234,
    'Dedicated program website or portal': 0.056958,
    'Regular company-wide awareness campaigns (at least quarterly)': 0.050636,
    'New hire orientation coverage': 0.050356,
    'Manager toolkit for cascade communications': 0.049726,
  },
};

const DIMENSIONS: Record<number, DimensionData> = {
  1: {
    name: "Medical Leave & Flexible Work",
    weight: 7,
    elements: 11,
    cvR2: -0.135,
    alpha: 0.3,
    n: 41,
    topElements: [
      "Emergency leave within 24 hours",
      "Paid micro-breaks for medical-related side effects",
      "Remote work options for on-site employees",
    ],
    items: [
      { rank: 1, name: "Emergency leave within 24 hours", weight: 0.151498, equal: 0.090909, delta: 0.060589 },
      { rank: 2, name: "Paid micro-breaks for medical-related side effects", weight: 0.145863, equal: 0.090909, delta: 0.054954 },
      { rank: 3, name: "Remote work options for on-site employees", weight: 0.136270, equal: 0.090909, delta: 0.045361 },
      { rank: 4, name: "Intermittent leave beyond local / legal requirements", weight: 0.120228, equal: 0.090909, delta: 0.029319 },
      { rank: 5, name: "Flexible work hours during treatment (e.g., varying start/end times...", weight: 0.080449, equal: 0.090909, delta: -0.01046 },
      { rank: 6, name: "Job protection beyond local / legal requirements", weight: 0.065953, equal: 0.090909, delta: -0.024956 },
      { rank: 7, name: "Paid medical leave beyond local / legal requirements", weight: 0.062434, equal: 0.090909, delta: -0.028475 },
      { rank: 8, name: "Reduced schedule/part-time with full benefits", weight: 0.061304, equal: 0.090909, delta: -0.029605 },
      { rank: 9, name: "PTO accrual during leave", weight: 0.059080, equal: 0.090909, delta: -0.031829 },
      { rank: 10, name: "Disability pay top-up (employer adds to disability insurance)", weight: 0.058566, equal: 0.090909, delta: -0.032343 },
      { rank: 11, name: "Leave donation bank (employees can donate PTO to colleagues)", weight: 0.058354, equal: 0.090909, delta: -0.032555 },
    ]
  },
  2: {
    name: "Insurance & Financial Protection",
    weight: 11,
    elements: 17,
    cvR2: 0.018,
    alpha: 0.4,
    n: 36,
    topElements: [
      "Accelerated life insurance benefits (partial payou",
      "Tax/estate planning assistance",
      "Real-time cost estimator tools",
    ],
    items: [
      { rank: 1, name: "Accelerated life insurance benefits (partial payout for terminal / ...", weight: 0.172389, equal: 0.058824, delta: 0.113565 },
      { rank: 2, name: "Tax/estate planning assistance", weight: 0.134633, equal: 0.058824, delta: 0.075809 },
      { rank: 3, name: "Real-time cost estimator tools", weight: 0.074168, equal: 0.058824, delta: 0.015344 },
      { rank: 4, name: "Insurance advocacy/pre-authorization support", weight: 0.071963, equal: 0.058824, delta: 0.013139 },
      { rank: 5, name: "$0 copay for specialty drugs", weight: 0.055324, equal: 0.058824, delta: -0.0035 },
      { rank: 6, name: "Coverage for advanced therapies (CAR-T, proton therapy, immunothera...", weight: 0.046307, equal: 0.058824, delta: -0.012517 },
      { rank: 7, name: "Financial counseling services", weight: 0.044892, equal: 0.058824, delta: -0.013932 },
      { rank: 8, name: "Long-term disability covering 60%+ of salary", weight: 0.044791, equal: 0.058824, delta: -0.014033 },
      { rank: 9, name: "Paid time off for clinical trial participation", weight: 0.043340, equal: 0.058824, delta: -0.015484 },
      { rank: 10, name: "Coverage for clinical trials and experimental treatments not covere...", weight: 0.042387, equal: 0.058824, delta: -0.016437 },
      { rank: 11, name: "Short-term disability covering 60%+ of salary", weight: 0.042358, equal: 0.058824, delta: -0.016466 },
      { rank: 12, name: "Hardship grants program funded by employer", weight: 0.039505, equal: 0.058824, delta: -0.019319 },
      { rank: 13, name: "Guaranteed job protection", weight: 0.038521, equal: 0.058824, delta: -0.020303 },
      { rank: 14, name: "Employer-paid disability insurance supplements", weight: 0.037982, equal: 0.058824, delta: -0.020842 },
      { rank: 15, name: "Voluntary supplemental illness insurance (with employer contribution)", weight: 0.037766, equal: 0.058824, delta: -0.021058 },
      { rank: 16, name: "Set out-of-pocket maximums (for in-network single coverage)", weight: 0.036936, equal: 0.058824, delta: -0.021888 },
      { rank: 17, name: "Travel/lodging reimbursement for specialized care beyond insurance ...", weight: 0.036738, equal: 0.058824, delta: -0.022086 },
    ]
  },
  3: {
    name: "Manager Preparedness & Capability",
    weight: 7,
    elements: 10,
    cvR2: 0.156,
    alpha: 0.5,
    n: 38,
    topElements: [
      "Manager peer support / community building",
      "Manager training on supporting employees managing ",
      "Empathy/communication skills training",
    ],
    items: [
      { rank: 1, name: "Manager peer support / community building", weight: 0.200000, equal: 0.1, delta: 0.1 },
      { rank: 2, name: "Manager training on supporting employees managing cancer or other s...", weight: 0.195800, equal: 0.1, delta: 0.0958 },
      { rank: 3, name: "Empathy/communication skills training", weight: 0.163859, equal: 0.1, delta: 0.063859 },
      { rank: 4, name: "Dedicated manager resource hub", weight: 0.080186, equal: 0.1, delta: -0.019814 },
      { rank: 5, name: "Clear escalation protocol for manager response", weight: 0.070666, equal: 0.1, delta: -0.029334 },
      { rank: 6, name: "Manager evaluations include how well they support impacted employees", weight: 0.063245, equal: 0.1, delta: -0.036755 },
      { rank: 7, name: "Privacy protection and confidentiality management", weight: 0.058366, equal: 0.1, delta: -0.041634 },
      { rank: 8, name: "AI-powered guidance tools", weight: 0.057978, equal: 0.1, delta: -0.042022 },
      { rank: 9, name: "Legal compliance training", weight: 0.055460, equal: 0.1, delta: -0.04454 },
      { rank: 10, name: "Senior leader coaching on supporting impacted employees", weight: 0.054441, equal: 0.1, delta: -0.045559 },
    ]
  },
  4: {
    name: "Cancer Support Resources",
    weight: 7,
    elements: 10,
    cvR2: 0.419,
    alpha: 0.5,
    n: 40,
    topElements: [
      "Physical rehabilitation support",
      "Nutrition coaching",
      "Insurance advocacy/appeals support",
    ],
    items: [
      { rank: 1, name: "Physical rehabilitation support", weight: 0.200000, equal: 0.1, delta: 0.1 },
      { rank: 2, name: "Nutrition coaching", weight: 0.131677, equal: 0.1, delta: 0.031677 },
      { rank: 3, name: "Insurance advocacy/appeals support", weight: 0.102429, equal: 0.1, delta: 0.002429 },
      { rank: 4, name: "Dedicated navigation support to help employees understand benefits ...", weight: 0.086678, equal: 0.1, delta: -0.013322 },
      { rank: 5, name: "Online tools, apps, or portals for health/benefits support", weight: 0.081811, equal: 0.1, delta: -0.018189 },
      { rank: 6, name: "Occupational therapy/vocational rehabilitation", weight: 0.080657, equal: 0.1, delta: -0.019343 },
      { rank: 7, name: "Care coordination concierge", weight: 0.080467, equal: 0.1, delta: -0.019533 },
      { rank: 8, name: "Survivorship planning assistance", weight: 0.080126, equal: 0.1, delta: -0.019874 },
      { rank: 9, name: "Benefits optimization assistance (maximizing coverage, minimizing c...", weight: 0.078984, equal: 0.1, delta: -0.021016 },
      { rank: 10, name: "Clinical trial matching service", weight: 0.077171, equal: 0.1, delta: -0.022829 },
    ]
  },
  5: {
    name: "Workplace Accommodations",
    weight: 7,
    elements: 11,
    cvR2: 0.412,
    alpha: 0.5,
    n: 39,
    topElements: [
      "Flexible scheduling options",
      "Ergonomic equipment funding",
      "Temporary role redesigns",
    ],
    items: [
      { rank: 1, name: "Flexible scheduling options", weight: 0.200000, equal: 0.090909, delta: 0.109091 },
      { rank: 2, name: "Ergonomic equipment funding", weight: 0.139903, equal: 0.090909, delta: 0.048994 },
      { rank: 3, name: "Temporary role redesigns", weight: 0.112514, equal: 0.090909, delta: 0.021605 },
      { rank: 4, name: "Rest areas / quiet spaces", weight: 0.112482, equal: 0.090909, delta: 0.021573 },
      { rank: 5, name: "Assistive technology catalog", weight: 0.089377, equal: 0.090909, delta: -0.001532 },
      { rank: 6, name: "Cognitive / fatigue support tools", weight: 0.067979, equal: 0.090909, delta: -0.02293 },
      { rank: 7, name: "Priority parking", weight: 0.065542, equal: 0.090909, delta: -0.025367 },
      { rank: 8, name: "Policy accommodations (e.g., dress code flexibility, headphone use)", weight: 0.057743, equal: 0.090909, delta: -0.033166 },
      { rank: 9, name: "Remote work capability", weight: 0.053926, equal: 0.090909, delta: -0.036983 },
      { rank: 10, name: "Physical workspace modifications", weight: 0.052285, equal: 0.090909, delta: -0.038624 },
      { rank: 11, name: "Transportation reimbursement", weight: 0.048250, equal: 0.090909, delta: -0.042659 },
    ]
  },
  6: {
    name: "Culture & Psychological Safety",
    weight: 10,
    elements: 12,
    cvR2: 0.361,
    alpha: 0.5,
    n: 38,
    topElements: [
      "Employee peer support groups (internal employees w",
      "Stigma-reduction initiatives",
      "Anonymous benefits navigation tool or website (no ",
    ],
    items: [
      { rank: 1, name: "Employee peer support groups (internal employees with shared experi...", weight: 0.200000, equal: 0.083333, delta: 0.116667 },
      { rank: 2, name: "Stigma-reduction initiatives", weight: 0.162816, equal: 0.083333, delta: 0.079483 },
      { rank: 3, name: "Anonymous benefits navigation tool or website (no login required)", weight: 0.103949, equal: 0.083333, delta: 0.020616 },
      { rank: 4, name: "Specialized emotional counseling", weight: 0.074589, equal: 0.083333, delta: -0.008744 },
      { rank: 5, name: "Manager training on handling sensitive health information", weight: 0.066403, equal: 0.083333, delta: -0.01693 },
      { rank: 6, name: "Strong anti-discrimination policies specific to health conditions", weight: 0.063480, equal: 0.083333, delta: -0.019853 },
      { rank: 7, name: "Inclusive communication guidelines", weight: 0.062325, equal: 0.083333, delta: -0.021008 },
      { rank: 8, name: "Professional-led support groups (external facilitator/counselor)", weight: 0.059117, equal: 0.083333, delta: -0.024216 },
      { rank: 9, name: "Written anti-retaliation policies for health disclosures", weight: 0.056450, equal: 0.083333, delta: -0.026883 },
      { rank: 10, name: "Confidential HR channel for health benefits, policies and insurance...", weight: 0.050848, equal: 0.083333, delta: -0.032485 },
      { rank: 11, name: "Clear process for confidential health disclosures", weight: 0.050423, equal: 0.083333, delta: -0.03291 },
      { rank: 12, name: "Optional open health dialogue forums", weight: 0.049601, equal: 0.083333, delta: -0.033732 },
    ]
  },
  7: {
    name: "Career Continuity & Advancement",
    weight: 7,
    elements: 9,
    cvR2: 0.33,
    alpha: 0.5,
    n: 34,
    topElements: [
      "Peer mentorship program (employees who had similar",
      "Continued access to training/development",
      "Adjusted performance goals/deliverables during tre",
    ],
    items: [
      { rank: 1, name: "Peer mentorship program (employees who had similar condition mentor...", weight: 0.200000, equal: 0.111111, delta: 0.088889 },
      { rank: 2, name: "Continued access to training/development", weight: 0.179672, equal: 0.111111, delta: 0.068561 },
      { rank: 3, name: "Adjusted performance goals/deliverables during treatment and recovery", weight: 0.100591, equal: 0.111111, delta: -0.01052 },
      { rank: 4, name: "Succession planning protections", weight: 0.097304, equal: 0.111111, delta: -0.013807 },
      { rank: 5, name: "Optional stay-connected program", weight: 0.096021, equal: 0.111111, delta: -0.01509 },
      { rank: 6, name: "Structured reintegration programs", weight: 0.093596, equal: 0.111111, delta: -0.017515 },
      { rank: 7, name: "Career coaching for employees managing cancer or other serious heal...", weight: 0.082895, equal: 0.111111, delta: -0.028216 },
      { rank: 8, name: "Professional coach/mentor for employees managing cancer or other se...", weight: 0.076372, equal: 0.111111, delta: -0.034739 },
      { rank: 9, name: "Project continuity protocols", weight: 0.073549, equal: 0.111111, delta: -0.037562 },
    ]
  },
  8: {
    name: "Work Continuation & Resumption",
    weight: 7,
    elements: 12,
    cvR2: 0.53,
    alpha: 0.5,
    n: 38,
    topElements: [
      "Flexibility for medical setbacks",
      "Long-term success tracking",
      "Manager training on supporting team members during",
    ],
    items: [
      { rank: 1, name: "Flexibility for medical setbacks", weight: 0.192209, equal: 0.083333, delta: 0.108876 },
      { rank: 2, name: "Long-term success tracking", weight: 0.142762, equal: 0.083333, delta: 0.059429 },
      { rank: 3, name: "Manager training on supporting team members during treatment/return", weight: 0.137150, equal: 0.083333, delta: 0.053817 },
      { rank: 4, name: "Workload adjustments during treatment", weight: 0.091974, equal: 0.083333, delta: 0.008641 },
      { rank: 5, name: "Access to occupational therapy/vocational rehabilitation", weight: 0.079713, equal: 0.083333, delta: -0.00362 },
      { rank: 6, name: "Buddy/mentor pairing for support", weight: 0.058763, equal: 0.083333, delta: -0.02457 },
      { rank: 7, name: "Structured progress reviews", weight: 0.057281, equal: 0.083333, delta: -0.026052 },
      { rank: 8, name: "Flexible work arrangements during treatment", weight: 0.054804, equal: 0.083333, delta: -0.028529 },
      { rank: 9, name: "Online peer support forums", weight: 0.053836, equal: 0.083333, delta: -0.029497 },
      { rank: 10, name: "Phased return-to-work plans", weight: 0.044535, equal: 0.083333, delta: -0.038798 },
      { rank: 11, name: "Contingency planning for treatment schedules", weight: 0.044362, equal: 0.083333, delta: -0.038971 },
      { rank: 12, name: "Access to specialized work resumption professionals", weight: 0.042611, equal: 0.083333, delta: -0.040722 },
    ]
  },
  9: {
    name: "Executive Commitment & Resources",
    weight: 10,
    elements: 11,
    cvR2: 0.136,
    alpha: 0.5,
    n: 34,
    topElements: [
      "Executive sponsors communicate regularly about wor",
      "ESG/CSR reporting inclusion",
      "Public success story celebrations",
    ],
    items: [
      { rank: 1, name: "Executive sponsors communicate regularly about workplace support pr...", weight: 0.200000, equal: 0.090909, delta: 0.109091 },
      { rank: 2, name: "ESG/CSR reporting inclusion", weight: 0.158208, equal: 0.090909, delta: 0.067299 },
      { rank: 3, name: "Public success story celebrations", weight: 0.146335, equal: 0.090909, delta: 0.055426 },
      { rank: 4, name: "Year-over-year budget growth", weight: 0.096558, equal: 0.090909, delta: 0.005649 },
      { rank: 5, name: "Support programs included in investor/stakeholder communications", weight: 0.067685, equal: 0.090909, delta: -0.023224 },
      { rank: 6, name: "Compensation tied to support outcomes", weight: 0.060404, equal: 0.090909, delta: -0.030505 },
      { rank: 7, name: "Executive accountability metrics", weight: 0.055585, equal: 0.090909, delta: -0.035324 },
      { rank: 8, name: "C-suite executive serves as program champion/sponsor", weight: 0.054714, equal: 0.090909, delta: -0.036195 },
      { rank: 9, name: "Cross-functional executive steering committee for workplace support...", weight: 0.054045, equal: 0.090909, delta: -0.036864 },
      { rank: 10, name: "Support metrics included in annual report/sustainability reporting", weight: 0.053759, equal: 0.090909, delta: -0.03715 },
      { rank: 11, name: "Dedicated budget allocation for serious illness support programs", weight: 0.052707, equal: 0.090909, delta: -0.038202 },
    ]
  },
  10: {
    name: "Caregiver & Family Support",
    weight: 7,
    elements: 19,
    cvR2: -0.063,
    alpha: 0.3,
    n: 40,
    topElements: [
      "Practical support for managing caregiving and work",
      "Eldercare consultation and referral services",
      "Family navigation support",
    ],
    items: [
      { rank: 1, name: "Practical support for managing caregiving and work", weight: 0.131514, equal: 0.052632, delta: 0.078882 },
      { rank: 2, name: "Eldercare consultation and referral services", weight: 0.103193, equal: 0.052632, delta: 0.050561 },
      { rank: 3, name: "Family navigation support", weight: 0.077622, equal: 0.052632, delta: 0.02499 },
      { rank: 4, name: "Caregiver resource navigator/concierge", weight: 0.050702, equal: 0.052632, delta: -0.00193 },
      { rank: 5, name: "Expanded caregiver leave eligibility beyond legal definitions (e.g....", weight: 0.048625, equal: 0.052632, delta: -0.004007 },
      { rank: 6, name: "Paid caregiver leave with expanded eligibility (beyond local legal ...", weight: 0.048618, equal: 0.052632, delta: -0.004014 },
      { rank: 7, name: "Unpaid leave job protection beyond local / legal requirements", weight: 0.044999, equal: 0.052632, delta: -0.007633 },
      { rank: 8, name: "Flexible work arrangements for caregivers", weight: 0.043468, equal: 0.052632, delta: -0.009164 },
      { rank: 9, name: "Emergency dependent care when regular arrangements unavailable", weight: 0.043214, equal: 0.052632, delta: -0.009418 },
      { rank: 10, name: "Respite care funding/reimbursement", weight: 0.042846, equal: 0.052632, delta: -0.009786 },
      { rank: 11, name: "Paid time off for care coordination appointments", weight: 0.042804, equal: 0.052632, delta: -0.009828 },
      { rank: 12, name: "Legal/financial planning assistance for caregivers", weight: 0.042621, equal: 0.052632, delta: -0.010011 },
      { rank: 13, name: "Manager training for supervising caregivers", weight: 0.041345, equal: 0.052632, delta: -0.011287 },
      { rank: 14, name: "Caregiver peer support groups", weight: 0.041327, equal: 0.052632, delta: -0.011305 },
      { rank: 15, name: "Dependent care subsidies", weight: 0.040713, equal: 0.052632, delta: -0.011919 },
      { rank: 16, name: "Mental health support specifically for caregivers", weight: 0.040699, equal: 0.052632, delta: -0.011933 },
      { rank: 17, name: "Modified job duties during peak caregiving periods", weight: 0.039239, equal: 0.052632, delta: -0.013393 },
      { rank: 18, name: "Emergency caregiver funds", weight: 0.038339, equal: 0.052632, delta: -0.014293 },
      { rank: 19, name: "Dependent care account matching/contributions", weight: 0.038112, equal: 0.052632, delta: -0.01452 },
    ]
  },
  11: {
    name: "Prevention & Wellness",
    weight: 7,
    elements: 13,
    cvR2: 0.473,
    alpha: 0.5,
    n: 40,
    topElements: [
      "Legal protections beyond requirements",
      "Individual health assessments (online or in-person",
      "Policies to support immuno-compromised colleagues ",
    ],
    items: [
      { rank: 1, name: "Legal protections beyond requirements", weight: 0.165547, equal: 0.076923, delta: 0.088624 },
      { rank: 2, name: "Individual health assessments (online or in-person)", weight: 0.145301, equal: 0.076923, delta: 0.068378 },
      { rank: 3, name: "Policies to support immuno-compromised colleagues (e.g., mask proto...", weight: 0.125210, equal: 0.076923, delta: 0.048287 },
      { rank: 4, name: "Genetic screening/counseling", weight: 0.117179, equal: 0.076923, delta: 0.040256 },
      { rank: 5, name: "Full or partial coverage for annual health screenings/checkups", weight: 0.059233, equal: 0.076923, delta: -0.01769 },
      { rank: 6, name: "Regular health education sessions", weight: 0.054959, equal: 0.076923, delta: -0.021964 },
      { rank: 7, name: "Paid time off for preventive care appointments", weight: 0.054171, equal: 0.076923, delta: -0.022752 },
      { rank: 8, name: "At least 70% coverage for regionally / locally recommended screenings", weight: 0.053351, equal: 0.076923, delta: -0.023572 },
      { rank: 9, name: "On-site vaccinations", weight: 0.049866, equal: 0.076923, delta: -0.027057 },
      { rank: 10, name: "Workplace safety assessments to minimize health risks", weight: 0.045736, equal: 0.076923, delta: -0.031187 },
      { rank: 11, name: "Targeted risk-reduction programs", weight: 0.045514, equal: 0.076923, delta: -0.031409 },
      { rank: 12, name: "Risk factor tracking/reporting", weight: 0.044358, equal: 0.076923, delta: -0.032565 },
      { rank: 13, name: "Lifestyle coaching programs", weight: 0.039574, equal: 0.076923, delta: -0.037349 },
    ]
  },
  12: {
    name: "Continuous Improvement",
    weight: 7,
    elements: 8,
    cvR2: 0.12,
    alpha: 0.5,
    n: 40,
    topElements: [
      "Regular program enhancements",
      "Employee confidence in employer support",
      "Innovation pilots",
    ],
    items: [
      { rank: 1, name: "Regular program enhancements", weight: 0.200000, equal: 0.125, delta: 0.075 },
      { rank: 2, name: "Employee confidence in employer support", weight: 0.165613, equal: 0.125, delta: 0.040613 },
      { rank: 3, name: "Innovation pilots", weight: 0.154468, equal: 0.125, delta: 0.029468 },
      { rank: 4, name: "External benchmarking", weight: 0.140249, equal: 0.125, delta: 0.015249 },
      { rank: 5, name: "Program utilization analytics", weight: 0.107703, equal: 0.125, delta: -0.017297 },
      { rank: 6, name: "Return-to-work success metrics", weight: 0.086759, equal: 0.125, delta: -0.038241 },
      { rank: 7, name: "Employee satisfaction tracking", weight: 0.074333, equal: 0.125, delta: -0.050667 },
      { rank: 8, name: "Business impact/ROI assessment", weight: 0.070875, equal: 0.125, delta: -0.054125 },
    ]
  },
  13: {
    name: "Communication & Awareness",
    weight: 7,
    elements: 9,
    cvR2: 0.642,
    alpha: 0.5,
    n: 40,
    topElements: [
      "Family/caregiver communication inclusion",
      "Ability to access program information and resource",
      "Employee testimonials/success stories",
    ],
    items: [
      { rank: 1, name: "Family/caregiver communication inclusion", weight: 0.200000, equal: 0.111111, delta: 0.088889 },
      { rank: 2, name: "Ability to access program information and resources anonymously", weight: 0.200000, equal: 0.111111, delta: 0.088889 },
      { rank: 3, name: "Employee testimonials/success stories", weight: 0.146375, equal: 0.111111, delta: 0.035264 },
      { rank: 4, name: "Proactive communication at point of diagnosis disclosure", weight: 0.140715, equal: 0.111111, delta: 0.029604 },
      { rank: 5, name: "Multi-channel communication strategy", weight: 0.105234, equal: 0.111111, delta: -0.005877 },
      { rank: 6, name: "Dedicated program website or portal", weight: 0.056958, equal: 0.111111, delta: -0.054153 },
      { rank: 7, name: "Regular company-wide awareness campaigns (at least quarterly)", weight: 0.050636, equal: 0.111111, delta: -0.060475 },
      { rank: 8, name: "New hire orientation coverage", weight: 0.050356, equal: 0.111111, delta: -0.060755 },
      { rank: 9, name: "Manager toolkit for cascade communications", weight: 0.049726, equal: 0.111111, delta: -0.061385 },
    ]
  },
};

// ============================================
// HELPERS & ICONS
// ============================================

function getSig(c: number): { label: string; color: string; bg: string; border: string } {
  if (c < 0) return { label: 'Emerging', color: '#92400E', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (c < 0.10) return { label: 'Developing', color: '#3730A3', bg: 'bg-indigo-50', border: 'border-indigo-200' };
  if (c < 0.30) return { label: 'Moderate', color: '#075985', bg: 'bg-sky-50', border: 'border-sky-200' };
  return { label: 'Strong', color: '#065F46', bg: 'bg-emerald-50', border: 'border-emerald-200' };
}



// getScoreColor defined in scoring functions above

function IconScale() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M3 7l4-4h10l4 4"/><circle cx="7" cy="14" r="3"/><circle cx="17" cy="14" r="3"/><path d="M7 11V7"/><path d="M17 11V7"/></svg>); }
function IconTarget() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>); }
function IconShield() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>); }
function IconChart() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 6-10"/></svg>); }
function IconLayers() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>); }
function IconRefresh() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>); }
function IconGrid() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>); }
function IconTrendUp() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>); }
function IconCheck() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>); }
function IconChevron({ open }: { open: boolean }) { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>); }
function PipelineArrow() { return (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 flex-shrink-0 mx-1"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>); }

// ============================================
// PAGE COMPONENT
// ============================================

// Dimension colors — matches the company report color spectrum
const DIM_COLORS: Record<number, string> = {
  1: '#8B5CF6', 2: '#6366F1', 3: '#3B82F6', 4: '#0EA5E9',
  5: '#14B8A6', 6: '#10B981', 7: '#22C55E', 8: '#84CC16',
  9: '#EAB308', 10: '#F59E0B', 11: '#F97316', 12: '#EF4444', 13: '#EC4899'
};

export default function ElementWeightingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'statistical' | 'weights' | 'scoring' | 'combined'>('overview');
  const [expandedDim, setExpandedDim] = useState<number | null>(null);
  const [offeredPcts, setOfferedPcts] = useState<Record<number, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyComparison[]>([]);
  const [combinedCompanies, setCombinedCompanies] = useState<CombinedCompanyResult[]>([]);
  

  // Load assessments from Supabase
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .order('company_name', { ascending: true });
        if (error) throw error;
        const valid = (data || []).filter(a => {
          for (let i = 1; i <= 13; i++) {
            const dd = a[`dimension${i}_data`];
            if (dd && typeof dd === 'object') {
              const grid = dd[`d${i}a`];
              if (grid && Object.keys(grid).length > 0) return true;
            }
          }
          return false;
        });
        setCompanies(valid.map(a => calculateCompanyComparison(a)));

        // Calculate % Currently Offered for each element
        const pcts: Record<number, Record<string, number>> = {};
        for (let dim = 1; dim <= 13; dim++) {
          const elemCounts: Record<string, { offered: number; answered: number }> = {};
          for (const a of valid) {
            const dimData = a[`dimension${dim}_data`];
            if (!dimData) continue;
            const grid = dimData[`d${dim}a`];
            if (!grid || typeof grid !== 'object') continue;
            Object.entries(grid).forEach(([key, status]: [string, any]) => {
              if (dim === 10 && D10_EXCLUDED_ITEMS.includes(key)) return;
              if (!elemCounts[key]) elemCounts[key] = { offered: 0, answered: 0 };
              const { points, isUnsure } = statusToPoints(status);
              if (isUnsure) {
                elemCounts[key].answered++; // counts in denominator, not numerator
              } else if (points !== null) {
                elemCounts[key].answered++;
                if (points === POINTS.CURRENTLY_OFFER) elemCounts[key].offered++;
              }
            });
          }
          pcts[dim] = {};
          Object.entries(elemCounts).forEach(([key, { offered, answered }]) => {
            pcts[dim][key] = answered > 0 ? Math.round((offered / answered) * 100) : 0;
          });
        }
        setOfferedPcts(pcts);

        // Calculate population means for combined scoring
        const popMeans: Record<number, number> = {};
        for (let dim = 1; dim <= 13; dim++) {
          let totalPts = 0;
          let totalAnswered = 0;
          for (const a of valid) {
            const dimData = a[`dimension${dim}_data`];
            if (!dimData) continue;
            const grid = dimData[`d${dim}a`];
            if (!grid || typeof grid !== 'object') continue;
            Object.entries(grid).forEach(([key, status]: [string, any]) => {
              if (dim === 10 && D10_EXCLUDED_ITEMS.includes(key)) return;
              const { points, isUnsure } = statusToPoints(status);
              if (!isUnsure && points !== null) {
                totalPts += points;
                totalAnswered++;
              }
            });
          }
          popMeans[dim] = totalAnswered > 0 ? totalPts / totalAnswered : 3.09;
        }
        setCombinedCompanies(valid.map(a => calculateCombinedScore(a, popMeans)));
      } catch (err) {
        console.error('Error loading assessments:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCompanies = useMemo(() => {
    let list = companies.filter(c => c.isComplete);
    list = list.filter(c => !c.isPanel);
    return list.sort((a, b) => b.eqComposite - a.eqComposite);
  }, [companies]);

  const benchmark = useMemo(() => {
    if (filteredCompanies.length === 0) return null;
    const dims: Record<number, { eq: number; wt: number }> = {};
    for (let i = 1; i <= 13; i++) {
      const eqs = filteredCompanies.map(c => c.dims[i]?.eq || 0);
      const wts = filteredCompanies.map(c => c.dims[i]?.wt || 0);
      dims[i] = { eq: Math.round(eqs.reduce((a, b) => a + b, 0) / eqs.length), wt: Math.round(wts.reduce((a, b) => a + b, 0) / wts.length) };
    }
    const eqC = Math.round(filteredCompanies.reduce((s, c) => s + c.eqComposite, 0) / filteredCompanies.length);
    const wtC = Math.round(filteredCompanies.reduce((s, c) => s + c.wtComposite, 0) / filteredCompanies.length);
    return { dims, eqC, wtC };
  }, [filteredCompanies]);

  const filteredCombined = useMemo(() => {
    let list = combinedCompanies.filter(c => c.isComplete);
    list = list.filter(c => !c.isPanel);
    return list.sort((a, b) => b.eqComposite - a.eqComposite);
  }, [combinedCompanies]);

  const combinedBenchmark = useMemo(() => {
    if (filteredCombined.length === 0) return null;
    const dims: Record<number, { eq: number; wt: number; unsure: number; combined: number }> = {};
    for (let i = 1; i <= 13; i++) {
      const eqs = filteredCombined.map(c => c.dims[i]?.eq || 0);
      const wts = filteredCombined.map(c => c.dims[i]?.wt || 0);
      const cbs = filteredCombined.map(c => c.dims[i]?.combined || 0);
      dims[i] = {
        eq: Math.round(eqs.reduce((a, b) => a + b, 0) / eqs.length),
        wt: Math.round(wts.reduce((a, b) => a + b, 0) / wts.length),
        combined: Math.round(cbs.reduce((a, b) => a + b, 0) / cbs.length),
      };
    }
    const eqC = Math.round(filteredCombined.reduce((s, c) => s + c.eqComposite, 0) / filteredCombined.length);
    const wtC = Math.round(filteredCombined.reduce((s, c) => s + c.wtComposite, 0) / filteredCombined.length);
    const unC = Math.round(filteredCombined.reduce((s, c) => s + c.unsureComposite, 0) / filteredCombined.length);
    const cbC = Math.round(filteredCombined.reduce((s, c) => s + c.combinedComposite, 0) / filteredCombined.length);
    return { dims, eqC, wtC, unC, cbC };
  }, [filteredCombined]);

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: <IconTarget /> },
    { key: 'statistical' as const, label: 'Statistical Overview', icon: <IconChart /> },
    { key: 'weights' as const, label: 'Element Weights', icon: <IconScale /> },
    { key: 'scoring' as const, label: 'Score Comparison', icon: <IconGrid /> },
    { key: 'combined' as const, label: 'Combined Scoring', icon: <IconLayers /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <style jsx global>{`
        .methodology-page { font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
        .methodology-page h1, .methodology-page h2, .methodology-page h3, .methodology-page h4 { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif; 
          letter-spacing: -0.01em; 
        }
      `}</style>
      <div className="methodology-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-12 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="bg-white rounded-xl p-3 shadow-lg"><img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-10" /></div>
              <div className="border-l border-slate-700 pl-8">
                <p className="text-slate-400 text-xs font-semibold tracking-widest uppercase">Methodology Documentation</p>
                <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">Element Weighting</h1>
                <p className="text-slate-400 mt-0.5">Best Companies for Working with Cancer Index — 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/scoring" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Scoring</Link>
              <Link href="/admin" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-12">
          <div className="flex">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.key ? 'border-violet-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}>
                <span className={activeTab === tab.key ? 'text-violet-600' : 'text-slate-400'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`mx-auto py-10 ${(activeTab === 'scoring' || activeTab === 'combined') ? 'max-w-[1800px] px-6' : 'max-w-7xl px-12'}`}>




        {/* ===== TAB 1: OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Element Weighting: Calibration, Not Reinvention</h2>
              <p className="text-slate-600">A modest, evidence-based refinement to improve differentiation within each dimension</p>
            </div>

            {/* Key Takeaway */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl px-8 py-6 shadow-sm">
              <p className="text-lg text-white leading-relaxed">Not every support element tells us the same thing about an organization. Some are standard practices most companies already provide. Others are rarer commitments that consistently signal deeper, more mature programs. Element weighting gives those stronger signals modestly more influence in the score&mdash;while keeping the Cancer and Careers framework as the anchor.</p>
            </div>

            {/* The Question + Our Answer */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <h3 className="font-bold text-slate-900 text-lg mb-3">What Changed and What Didn&apos;t</h3>
              <p className="text-slate-700 leading-relaxed mb-3">In the original scoring, every element inside a dimension counted equally. We introduced element weighting so that elements which more consistently differentiate stronger overall programs receive modestly higher weight. This is a calibration&mdash;not a rewrite&mdash;and it is designed to be stable and defensible.</p>
              <p className="text-slate-700 leading-relaxed">The 13 dimensions, their relative weights, and the response scale are all unchanged. Element weighting only adjusts how much each item contributes within its own dimension.</p>
            </section>

            {/* Visual Pipeline */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-8 py-5">
                <h3 className="font-bold text-white text-lg">How We Determined the Weights</h3>
                <p className="text-violet-100 mt-1">A six-step process designed to be transparent, reproducible, and conservative</p>
              </div>
              <div className="p-8">
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Start with clean, confirmed data', desc: 'Companies with too many \u201cUnsure\u201d responses in a dimension are excluded from weight estimation for that dimension. Weights are learned only from confirmed answers.', accent: 'bg-slate-600' },
                    { step: '2', title: 'Build a predictive model for each dimension', desc: 'For each of the 13 dimensions, we ask: which elements in this dimension best predict how well a company performs across the other 12? An element earns higher weight only if companies that score well on it also tend to score well everywhere else.', accent: 'bg-violet-500' },
                    { step: '3', title: 'Measure each element\u2019s contribution', desc: 'We temporarily scramble each element\u2019s data one at a time. If the model\u2019s accuracy drops significantly when an element is scrambled, that element is a strong differentiator. If accuracy barely changes, it contributes less signal.', accent: 'bg-violet-500' },
                    { step: '4', title: 'Test stability across 200 rounds', desc: 'We repeat the entire analysis 200 times on different random samples of companies. Elements that consistently appear as important keep their weight. Elements whose importance fluctuates are pulled back toward equal weighting\u2014proportionally, not as a hard cutoff.', accent: 'bg-violet-500' },
                    { step: '5', title: 'Blend with equal weights', desc: 'The final weight for each element is a blend of what the data suggests and what equal weighting would produce. The blend adapts by dimension based on signal strength, so the expert framework always anchors the result.', accent: 'bg-violet-500' },
                    { step: '6', title: 'Cap at 20%', desc: 'No single element can exceed 20% of its dimension\u2019s total weight. Any excess is redistributed proportionally among the remaining elements.', accent: 'bg-slate-600' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-5">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${s.accent} text-white font-bold flex items-center justify-center text-sm shadow-sm`}>{s.step}</div>
                      <div className="pt-1">
                        <p className="font-semibold text-slate-900">{s.title}</p>
                        <p className="text-slate-600 mt-1 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { v: '1\u20133 pts', l: 'Composite Score Shifts', d: 'Typically 1\u20133 points; larger moves are rare.', color: 'from-violet-500 to-violet-600' },
                { v: '2\u20133\u00d7', l: 'Weight Spread', d: 'Typical highest-to-lowest within a dimension.', color: 'from-indigo-500 to-indigo-600' },
                { v: 'Preserved', l: 'Rankings', d: 'Changes occur among closely scored companies.', color: 'from-sky-500 to-sky-600' },
                { v: '3 elements', l: '20% Cap Hit', d: 'Would otherwise dominate their dimension.', color: 'from-emerald-500 to-emerald-600' }
              ].map((m, i) => (
                <div key={i} className="rounded-xl overflow-hidden shadow-sm">
                  <div className={`bg-gradient-to-br ${m.color} px-5 py-4`}>
                    <p className="text-2xl font-bold text-white">{m.v}</p>
                    <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mt-1">{m.l}</p>
                  </div>
                  <div className="bg-white border border-slate-200 border-t-0 px-5 py-3">
                    <p className="text-sm text-slate-600 leading-relaxed">{m.d}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Differentiators Table */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-8 py-5">
                <h3 className="font-bold text-white text-lg">Top Differentiating Elements by Dimension</h3>
                <p className="text-sm text-slate-400 mt-1">Programs that most consistently predict stronger overall performance across the Index</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-64">Dimension</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Top Element</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Second</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Third</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DIMENSION_ORDER.map((d, i) => {
                      const dim = DIMENSIONS[d];
                      const color = DIM_COLORS[d];
                      return (
                        <tr key={d} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-50`}>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: color }}>{d}</span>
                              <span className="text-slate-800 font-semibold text-sm">{dim.name}</span>
                            </span>
                          </td>
                          {dim.items.slice(0, 3).map((item, j) => (
                            <td key={j} className="px-4 py-3.5 text-slate-700 text-sm">
                              {item.name.length > 45 ? item.name.slice(0, 42) + '...' : item.name}
                              <span className="ml-1.5 text-xs font-bold" style={{ color }}>{(item.weight * 100).toFixed(1)}%</span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-t border-violet-100">
                <p className="text-slate-700"><strong className="text-violet-700">Every element contributes.</strong> Lower-weighted elements still matter. Higher-weighted elements tend to be rarer commitments signaling deeper organizational investment.</p>
              </div>
            </section>

            {/* Design Decisions + Future */}
            <section className="bg-slate-50 rounded-xl border border-slate-200 p-8">
              <h3 className="font-bold text-slate-900 text-lg mb-3">Design Decisions and Future Direction</h3>
              <p className="text-slate-700 leading-relaxed mb-3">We avoided approaches that are hard to defend or unstable at small sample sizes: subjective expert weighting, binary recoding that discards maturity progression, raw coefficients that can produce misleading negatives, and hard cutoffs that create cliff effects. Instead, we use stable importance measures, proportional damping, and conservative blending to keep the framework intact.</p>
              <p className="text-slate-700 leading-relaxed">This is a Year 1 calibration. As participation grows, the empirical signal strengthens and weights can become more data-driven while maintaining the same guardrails. Weights are recalibrated annually and published alongside each Index release.</p>
            </section>
          </div>
        )}

        {/* ===== TAB 2: STATISTICAL OVERVIEW ===== */}
        {activeTab === 'statistical' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Statistical Overview</h2>
              <p className="text-slate-600 text-sm">Dimension-level model performance, blend parameters, and pipeline specification</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-5">
              {[
                { v: '152', l: 'Elements', d: 'Across 13 dimensions', color: 'from-violet-600 to-purple-700', icon: <IconLayers /> },
                { v: '13', l: 'Dimensions', d: 'All with adaptive blend', color: 'from-indigo-600 to-blue-700', icon: <IconGrid /> },
                { v: '5-fold', l: 'Cross-Validation', d: 'Out-of-sample R\u00b2', color: 'from-sky-600 to-cyan-700', icon: <IconChart /> },
                { v: '200', l: 'Bootstrap Resamples', d: 'For stability testing', color: 'from-emerald-600 to-teal-700', icon: <IconRefresh /> }
              ].map((c, i) => (
                <div key={i} className={`bg-gradient-to-br ${c.color} rounded-xl p-5 text-white shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60">{c.icon}</span>
                  </div>
                  <p className="text-3xl font-bold">{c.v}</p>
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mt-1">{c.l}</p>
                  <p className="text-xs text-white/60 mt-1">{c.d}</p>
                </div>
              ))}
            </div>

            {/* Scoring Pipeline */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-10 py-6 border-b border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm text-white"><IconLayers /></div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">Scoring Pipeline Integration</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Element weighting applies at Stage 4</p>
                </div>
              </div>
              <div className="px-10 py-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase w-24">Stage</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase w-56">Step</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ['1', 'Element scoring + unsure handling', 'Score confirmed elements (5/3/2/0). Apply (1\u2212r)\u00b2 substitution for Unsure.', false],
                      ['2', 'Geographic multiplier', 'Applied based on multi-country response (\u00d71.0, \u00d70.90, or \u00d70.85).', false],
                      ['3', 'Follow-up blending', 'For D1, D3, D12, D13: blend 85% grid score + 15% follow-up score.', false],
                      ['4', 'Element weighting', 'Apply within-dimension support element weights. Produces weighted dimension scores.', true],
                      ['5', 'Dimension weighting', 'Apply dimension weights to produce weighted dimension score.', false],
                      ['6', 'Composite', 'Composite = (Weighted Dimensions \u00d7 90%) + (Maturity \u00d7 5%) + (Breadth \u00d7 5%).', false]
                    ].map(([stage, step, detail, highlight], i) => (
                      <tr key={i} className={`${highlight ? 'bg-violet-50 border-l-4 border-l-violet-600' : ''}`}>
                        <td className={`py-2.5 px-3 text-xs font-mono ${highlight ? 'text-violet-700 font-bold' : 'text-slate-500'}`}>Stage {stage}</td>
                        <td className={`py-2.5 px-3 ${highlight ? 'text-violet-800 font-semibold' : 'text-slate-800'}`}>{step}</td>
                        <td className={`py-2.5 px-3 text-sm ${highlight ? 'text-violet-700' : 'text-slate-600'}`}>{detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Weight Estimation Pipeline — clean horizontal flow */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-10 py-6 border-b border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm text-white"><IconChart /></div>
                <h3 className="font-bold text-slate-900 text-xl">Weight Estimation Pipeline</h3>
              </div>
              <div className="px-10 py-8">
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[
                    { title: 'Ordinal Encoding', detail: '0 / 2 / 3 / 5', color: 'bg-violet-700' },
                    { title: 'Company Filtering', detail: '226560% observed', color: 'bg-indigo-700' },
                    { title: 'Ridge Regression', detail: '03b1 = 1.0, z-scored', color: 'bg-blue-700' },
                    { title: 'Permutation Importance', detail: '100 repetitions', color: 'bg-sky-700' },
                  ].map((s, i) => (
                    <div key={i} className="relative">
                      <div className={`${s.color} text-white rounded-lg px-4 py-3.5 text-center`}>
                        <p className="text-sm font-bold">{s.title}</p>
                        <p className="text-xs text-white/70 mt-0.5">{s.detail}</p>
                      </div>
                      {i < 3 && (
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                          <PipelineArrow />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center my-2 text-slate-300">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { title: 'Soft Attenuation', detail: 'w 00d7 s(j)^1.5', color: 'bg-amber-700' },
                    { title: 'Adaptive 03b1 Blend', detail: 'Signal → α', color: 'bg-orange-700' },
                    { title: '20% Hard Cap', detail: 'Redistribute excess', color: 'bg-red-700' },
                  ].map((s, i) => (
                    <div key={i} className="relative">
                      <div className={`${s.color} text-white rounded-lg px-4 py-3.5 text-center`}>
                        <p className="text-sm font-bold">{s.title}</p>
                        <p className="text-xs text-white/70 mt-0.5">{s.detail}</p>
                      </div>
                      {i < 3 && (
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                          <PipelineArrow />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Feature Encoding */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-10 py-6 border-b border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shadow-sm text-white"><IconGrid /></div>
                <h3 className="font-bold text-slate-900 text-xl">Feature Encoding</h3>
              </div>
              <div className="px-10 py-6">
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { resp: 'Currently Offer', score: '5', bg: 'bg-emerald-600', desc: 'Full credit' },
                    { resp: 'Planning', score: '3', bg: 'bg-blue-600', desc: 'Active intent' },
                    { resp: 'Assessing', score: '2', bg: 'bg-amber-600', desc: 'Exploring' },
                    { resp: 'Not Offered', score: '0', bg: 'bg-slate-500', desc: 'Confirmed absence' },
                    { resp: 'Unsure', score: '\u2014', bg: 'bg-slate-300', desc: 'Excluded from fit' },
                  ].map((r, i) => (
                    <div key={i} className="text-center">
                      <div className={`${r.bg} text-white rounded-lg py-3 mb-2`}>
                        <p className="text-2xl font-bold">{r.score}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{r.resp}</p>
                      <p className="text-xs text-slate-500">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Adaptive Shrinkage — proper formula + colored cards */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-10 py-6 border-b border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm text-white"><IconScale /></div>
                <h3 className="font-bold text-slate-900 text-xl">Adaptive Shrinkage Toward Equal Weights</h3>
              </div>
              <div className="px-10 py-8">
                {/* Formula — styled properly */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl px-8 py-5 mb-8">
                  <p className="text-white font-mono text-center text-base tracking-wide">
                    w<sub className="text-xs">final</sub>(j)
                    <span className="mx-3">=</span>
                    <span className="font-bold">&alpha;</span>
                    <span className="mx-1">&times;</span>
                    w<sub className="text-xs">empirical</sub>(j)
                    <span className="mx-3">+</span>
                    (1 &minus; <span className="font-bold">&alpha;</span>)
                    <span className="mx-1">&times;</span>
                    w<sub className="text-xs">equal</sub>
                  </p>
                </div>

                {/* Three cards with color fills */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="rounded-xl overflow-hidden border border-amber-200">
                    <div className="bg-amber-50 px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Emerging Signal</span>
                        <span className="text-xl font-bold text-amber-800">&alpha; = 0.30</span>
                      </div>
                      <p className="text-sm font-mono text-amber-700 mb-2">CV R² ≤ 0</p>
                      <p className="text-sm text-amber-800 leading-relaxed">30% empirical, 70% equal. Anchor heavily toward the expert framework while allowing modest differentiation.</p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-indigo-200">
                    <div className="bg-indigo-50 px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Developing Signal</span>
                        <span className="text-xl font-bold text-indigo-800">&alpha; = 0.40</span>
                      </div>
                      <p className="text-sm font-mono text-indigo-700 mb-2">0 &lt; CV R² &lt; 0.05</p>
                      <p className="text-sm text-indigo-800 leading-relaxed">40% empirical, 60% equal. Lean toward equal but allow more differentiation.</p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-emerald-200">
                    <div className="bg-emerald-50 px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Established Signal</span>
                        <span className="text-xl font-bold text-emerald-800">&alpha; = 0.50</span>
                      </div>
                      <p className="text-sm font-mono text-emerald-700 mb-2">CV R² ≥ 0.05</p>
                      <p className="text-sm text-emerald-800 leading-relaxed">50% empirical, 50% equal. Balanced blend of empirical and equal.</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-700">Hard cap: No single element can exceed 20% of its dimension&apos;s total weight. Any excess is redistributed proportionally. Final weights normalize to 1.000 within each dimension.</p>
              </div>
            </section>

            {/* Dimension Results Table — no n column */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-10 py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white"><IconTrendUp /></div>
                <h3 className="font-bold text-white text-xl">Dimension-Level Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-semibold">Dimension</th>
                      <th className="px-4 py-3 text-center font-semibold w-16">Wt</th>
                      <th className="px-4 py-3 text-center font-semibold w-16">Elem</th>
                      <th className="px-4 py-3 text-center font-semibold w-28">Signal</th>
                      <th className="px-4 py-3 text-center font-semibold w-16">&alpha;</th>
                      <th className="px-4 py-3 text-left font-semibold">Top 3 Elements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DIMENSION_ORDER.map((d, i) => {
                      const dim = DIMENSIONS[d];
                      const sig = getSig(dim.cvR2);
                      return (
                        <tr key={d} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-slate-50 transition-colors`}>
                          <td className="px-5 py-3 font-semibold text-slate-800">
                            <span className="inline-flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-lg text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: DIM_COLORS[d] }}>{d}</span>
                              {dim.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700 font-medium">{dim.weight}%</td>
                          <td className="px-4 py-3 text-center text-slate-600">{dim.elements}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sig.bg} border ${sig.border}`} style={{ color: sig.color }}>{sig.label}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">{dim.alpha.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{dim.topElements.join(' \u00b7 ')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-3 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center gap-6 text-xs text-slate-600">
                  <span><strong className="text-slate-700">&alpha;</strong> = empirical share in final blend (1 &minus; &alpha; = equal weight share)</span>
                </div>
              </div>
            </section>

            {/* Alternatives */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-10 py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </div>
                <h3 className="font-bold text-white text-xl">Alternatives Explored and Rejected</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold w-64">Approach</th>
                      <th className="px-6 py-3 text-left font-semibold">Why Rejected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ['Bivariate correlation', 'Treats co-occurring elements independently, giving both full credit for what may be shared capability.'],
                      ['Raw ridge coefficients', 'Can be negative due to multicollinearity. Permutation importance produces only positive weights.'],
                      ['Binary encoding', 'Discards the distinction between Assessing, Planning, and Currently Offer.'],
                      ['Expert judgment', 'Subjective and difficult to defend. No adjudication mechanism.'],
                      ['Hard stability cutoffs', 'Cliff effects. Soft attenuation is more principled.']
                    ].map(([a, w], i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="px-6 py-3 font-semibold text-slate-800">{a}</td>
                        <td className="px-6 py-3 text-slate-700">{w}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ===== TAB 3: ELEMENT WEIGHTS ===== */}
        {activeTab === 'weights' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Element-Level Weights</h2>
              <p className="text-slate-600 text-sm">All 152 support elements across 13 dimensions. Click a dimension to expand.</p>
            </div>

            {DIMENSION_ORDER.map((d) => {
              const dim = DIMENSIONS[d];
              const isExpanded = expandedDim === d;
              const sig = getSig(dim.cvR2);

              return (
                <div key={d} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <button onClick={() => setExpandedDim(isExpanded ? null : d)}
                    className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-5">
                      <span className="w-12 h-12 rounded-xl text-white text-lg font-bold flex items-center justify-center shadow-md" style={{ backgroundColor: DIM_COLORS[d] }}>{d}</span>
                      <div className="text-left">
                        <span className="font-bold text-slate-900">{dim.name}</span>
                        <div className="flex items-center gap-3 mt-0.5 text-xs">
                          <span className="text-slate-600 font-medium">{dim.elements} elements</span>
                          <span className="text-slate-600 font-medium">{dim.weight}% dim wt</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full ${sig.bg} border ${sig.border}`} style={{ color: sig.color }}>
                          </span>
                          <span className="text-slate-600 font-medium">α = {dim.alpha.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-500"><IconChevron open={isExpanded} /></div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                            <th className="pl-6 pr-2 py-2.5 text-left font-semibold w-10">#</th>
                            <th className="px-3 py-2.5 text-left font-semibold">Support Element</th>
                            <th className="px-3 py-2.5 text-right font-semibold w-20 border-r-2 border-slate-600">% Offered</th>
                            <th className="px-3 py-2.5 text-right font-semibold w-24">Weight</th>
                            <th className="px-3 py-2.5 text-right font-semibold w-20">Equal</th>
                            <th className="px-3 py-2.5 text-right font-semibold w-20">vs Equal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dim.items.map((item, i) => (
                            <tr key={item.rank} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="pl-6 pr-2 py-2.5 text-slate-500 text-xs font-medium">{item.rank}</td>
                              <td className="px-3 py-2.5 text-slate-800">{item.name}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums border-r-2 border-slate-200">
                                {(() => {
                                  const dimPcts = offeredPcts[d] || {};
                                  const keys = Object.keys(dimPcts);
                                  const match = keys.find(k => k.startsWith(item.name.substring(0, 30)) || item.name.startsWith(k.substring(0, 30)));
                                  const pct = match ? dimPcts[match] : null;
                                  return pct !== null ? (
                                    <span className={`text-xs font-medium ${pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-slate-500'}`}>{pct}%</span>
                                  ) : <span className="text-slate-300">—</span>;
                                })()}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums"><span className="font-bold text-slate-900">{(item.weight * 100).toFixed(1)}%</span></td>
                              <td className="px-3 py-2.5 text-right text-slate-500 tabular-nums">{(item.equal * 100).toFixed(1)}%</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">
                                <span className={`text-xs font-bold ${item.delta >= 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                                  {item.delta >= 0 ? '+' : ''}{(item.delta * 100).toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 border-t border-slate-200">
                            <td colSpan={2} className="pl-6 pr-3 py-2 text-xs text-slate-700 font-semibold">Dimension Total</td>
                            <td className="px-3 py-2 text-right text-xs text-slate-400 tabular-nums border-r-2 border-slate-200">&mdash;</td>
                            <td className="px-3 py-2 text-right text-xs text-slate-900 font-bold tabular-nums">100.0%</td>
                            <td className="px-3 py-2 text-right text-xs text-slate-600 tabular-nums font-medium">100.0%</td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== TAB 4: SCORE COMPARISON — LIVE FROM SUPABASE ===== */}
        {activeTab === 'scoring' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Score Comparison</h2>
                <p className="text-slate-600 text-sm">Equal-weight vs. element-weighted scores calculated live from assessment data. Only within-dimension element weighting differs.</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 text-slate-500">Loading assessment data...</div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-20 text-slate-500">No complete assessments found.</div>
            ) : (
              <>
                {/* Legend + Stats */}
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white border-2 border-slate-300" />
                    <span className="text-slate-700 text-sm font-medium">Equal Weight</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-600" />
                    <span className="text-slate-700 text-sm font-medium">Element-Weighted</span>
                  </div>
                  <div className="ml-auto flex items-center gap-6">
                    <div>
                      <span className="text-2xl font-bold text-emerald-700">{filteredCompanies.filter(c => c.wtComposite > c.eqComposite).length}</span>
                      <span className="text-sm text-slate-600 ml-1">score higher</span>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-slate-800">
                        {(filteredCompanies.reduce((s, c) => s + Math.abs(c.wtComposite - c.eqComposite), 0) / filteredCompanies.length).toFixed(1)}
                      </span>
                      <span className="text-sm text-slate-600 ml-1">avg shift (pts)</span>
                    </div>
                    <div>
                      <span className="text-lg font-bold text-slate-700">{filteredCompanies.length}</span>
                      <span className="text-sm text-slate-600 ml-1">companies</span>
                    </div>
                  </div>
                </div>

                {/* Score Table — top scrollbar, vertical scroll, frozen header + row labels */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div
                    className="overflow-auto max-h-[78vh]"
                    style={{ overflowX: 'auto', overflowY: 'auto' }}
                    ref={(el) => {
                      if (el) {
                        const existing = el.parentElement?.querySelector('.top-scroll-bar') as HTMLElement;
                        if (!existing) {
                          const topScroll = document.createElement('div');
                          topScroll.className = 'top-scroll-bar';
                          topScroll.style.cssText = 'overflow-x:auto;overflow-y:hidden;height:14px;border-bottom:1px solid #e2e8f0;';
                          const inner = document.createElement('div');
                          inner.style.height = '1px';
                          topScroll.appendChild(inner);
                          el.parentElement?.insertBefore(topScroll, el);
                          topScroll.addEventListener('scroll', () => { el.scrollLeft = topScroll.scrollLeft; });
                          el.addEventListener('scroll', () => { topScroll.scrollLeft = el.scrollLeft; });
                          const obs = new ResizeObserver(() => {
                            const table = el.querySelector('table');
                            if (table) inner.style.width = table.scrollWidth + 'px';
                          });
                          obs.observe(el);
                        }
                      }
                    }}
                  >
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 z-30">
                        <tr className="bg-slate-800 text-white">
                          <th className="sticky left-0 top-0 z-40 bg-slate-800 px-3 py-3 text-left font-bold text-xs border-r border-slate-700 w-36 min-w-[140px]" />
                          <th className="px-2 py-3 text-center font-bold text-xs bg-slate-700 border-r border-slate-600 min-w-[65px]">Benchmark</th>
                          {filteredCompanies.map((c, i) => {
                            const displayName = c.companyName.replace(/ International$/i, '').replace(/ Corporation$/i, '');
                            return (
                            <th key={c.surveyId} className={`px-1 py-3 text-center font-semibold text-xs leading-tight min-w-[60px] ${i % 2 === 0 ? 'bg-slate-700' : 'bg-slate-800'}`}>
                              {displayName.length > 14
                                ? displayName.split(' ').slice(0, 2).map((w, j) => <span key={j} className="block">{w}</span>)
                                : displayName}
                            </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Composite */}
                        <tr className="bg-slate-200 border-y-2 border-slate-400">
                          <td colSpan={2 + filteredCompanies.length} className="px-3 py-1.5 font-bold text-slate-900 uppercase text-xs tracking-wider">Composite Score</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="sticky left-0 z-10 bg-white px-3 py-3 text-slate-800 font-semibold text-sm border-r border-slate-100">Equal</td>
                          <td className="px-2 py-3 text-center font-bold text-slate-800 text-sm bg-slate-50 border-r border-slate-100">{benchmark?.eqC}</td>
                          {filteredCompanies.map((c, i) => (
                            <td key={c.surveyId} className={`px-1 py-3 text-center font-semibold text-slate-800 ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>{c.eqComposite}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-slate-200 bg-emerald-50">
                          <td className="sticky left-0 z-10 bg-emerald-50 px-3 py-3 text-emerald-800 font-bold text-sm border-r border-emerald-100">Weighted</td>
                          <td className="px-2 py-2.5 text-center font-bold bg-emerald-100 border-r border-emerald-100" style={{ color: getScoreColor(benchmark?.wtC || 0) }}>{benchmark?.wtC}</td>
                          {filteredCompanies.map((c, i) => (
                            <td key={c.surveyId} className={`px-1 py-2.5 text-center font-bold ${i % 2 === 0 ? 'bg-emerald-50' : 'bg-emerald-50/50'}`} style={{ color: getScoreColor(c.wtComposite) }}>{c.wtComposite}</td>
                          ))}
                        </tr>
                        <tr className="border-b-2 border-slate-400 bg-slate-100">
                          <td className="sticky left-0 z-10 bg-slate-100 px-3 py-1.5 text-slate-600 text-xs font-bold border-r border-slate-200">Δ</td>
                          <td className="px-2 py-1.5 text-center text-xs font-bold bg-slate-100 border-r border-slate-200">
                            {benchmark && <span className={(benchmark.wtC - benchmark.eqC) >= 0 ? 'text-emerald-700' : 'text-red-700'}>{(benchmark.wtC - benchmark.eqC) >= 0 ? '+' : ''}{benchmark.wtC - benchmark.eqC}</span>}
                          </td>
                          {filteredCompanies.map((c) => {
                            const d = c.wtComposite - c.eqComposite;
                            return (
                              <td key={c.surveyId} className="px-1 py-1.5 text-center text-xs font-bold">
                                <span className={d > 0 ? 'text-emerald-700' : d < 0 ? 'text-red-700' : 'text-slate-400'}>
                                  {d > 0 ? '+' : ''}{d}
                                </span>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Dimension Rows */}
                        {DIMENSION_ORDER.map((dim, idx) => (
                          <React.Fragment key={dim}>
                            <tr className={`${idx === 0 ? '' : 'border-t-2 border-slate-200'} bg-slate-100`}>
                              <td colSpan={2 + filteredCompanies.length} className="px-3 py-1 text-xs font-bold text-slate-800">
                                D{dim}: {DIMENSION_NAMES[dim]} <span className="text-slate-500 font-medium">({DEFAULT_DIMENSION_WEIGHTS[dim]}%)</span>
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="sticky left-0 z-10 bg-white px-3 py-1 text-slate-600 pl-4 text-xs font-medium border-r border-slate-100">Equal</td>
                              <td className="px-2 py-2 text-center text-slate-700 text-sm bg-slate-50/50 border-r border-slate-100">{benchmark?.dims[dim]?.eq}</td>
                              {filteredCompanies.map((c, i) => (
                                <td key={c.surveyId} className={`px-1 py-2 text-center text-slate-700 text-sm ${i % 2 === 0 ? 'bg-slate-50/30' : ''}`}>{c.dims[dim]?.eq}</td>
                              ))}
                            </tr>
                            <tr className="border-b border-slate-100 bg-emerald-50/30">
                              <td className="sticky left-0 z-10 bg-emerald-50/30 px-3 py-1 text-emerald-800 font-semibold pl-4 text-xs border-r border-emerald-100/50">Wt</td>
                              <td className="px-2 py-2 text-center font-semibold text-xs bg-emerald-100/30 border-r border-emerald-100/50" style={{ color: getScoreColor(benchmark?.dims[dim]?.wt || 0) }}>{benchmark?.dims[dim]?.wt}</td>
                              {filteredCompanies.map((c, i) => (
                                <td key={c.surveyId} className={`px-1 py-2 text-center text-xs font-semibold ${i % 2 === 0 ? 'bg-emerald-50/40' : 'bg-emerald-50/20'}`} style={{ color: getScoreColor(c.dims[dim]?.wt || 0) }}>
                                  {c.dims[dim]?.wt}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-b border-slate-200 bg-slate-50/50">
                              <td className="sticky left-0 z-10 bg-slate-50/50 px-3 py-1 text-slate-500 pl-4 text-[10px] font-bold border-r border-slate-100">Δ</td>
                              <td className="px-2 py-1 text-center text-[10px] font-bold bg-slate-50/50 border-r border-slate-100">
                                {benchmark?.dims[dim]?.eq != null && benchmark?.dims[dim]?.wt != null && (
                                  <span className={(benchmark.dims[dim].wt - benchmark.dims[dim].eq) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                    {(benchmark.dims[dim].wt - benchmark.dims[dim].eq) >= 0 ? '+' : ''}{benchmark.dims[dim].wt - benchmark.dims[dim].eq}
                                  </span>
                                )}
                              </td>
                              {filteredCompanies.map((c) => {
                                const eqVal = c.dims[dim]?.eq;
                                const wtVal = c.dims[dim]?.wt;
                                const delta = (eqVal != null && wtVal != null) ? wtVal - eqVal : null;
                                return (
                                  <td key={c.surveyId} className="px-1 py-1 text-center text-[10px] font-bold">
                                    {delta !== null && (
                                      <span className={delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-slate-400'}>
                                        {delta > 0 ? '+' : ''}{delta}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== TAB 5: COMBINED SCORING — Element Weights + Unsure Substitution ===== */}
        {activeTab === 'combined' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Combined Scoring</h2>
              <p className="text-slate-600">Element weighting + unsure substitution applied together. This is what production scoring would look like.</p>
            </div>

            {loading ? (
              <div className="text-center py-20 text-slate-500">Loading assessment data...</div>
            ) : filteredCombined.length === 0 ? (
              <div className="text-center py-20 text-slate-500">No complete assessments found.</div>
            ) : (
              <>
                {/* Legend + Stats */}
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white border-2 border-slate-300" />
                    <span className="text-slate-700 text-sm font-medium">Equal Weight</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-600" />
                    <span className="text-slate-700 text-sm font-medium">Element-Weighted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500" />
                    <span className="text-slate-700 text-sm font-medium">Unsure Sub</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-violet-600" />
                    <span className="text-slate-700 text-sm font-medium">Weighted + Unsure</span>
                  </div>
                  <div className="ml-auto flex items-center gap-6">
                    <div>
                      <span className="text-2xl font-bold text-violet-700">{filteredCombined.filter(c => c.combinedComposite > c.eqComposite).length}</span>
                      <span className="text-sm text-slate-600 ml-1">score higher</span>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-slate-800">
                        {(filteredCombined.reduce((s, c) => s + Math.abs(c.combinedComposite - c.eqComposite), 0) / filteredCombined.length).toFixed(1)}
                      </span>
                      <span className="text-sm text-slate-600 ml-1">avg shift (pts)</span>
                    </div>
                    <div>
                      <span className="text-lg font-bold text-slate-700">{filteredCombined.length}</span>
                      <span className="text-sm text-slate-600 ml-1">companies</span>
                    </div>
                  </div>
                </div>

                {/* Combined Score Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div
                    className="overflow-auto max-h-[78vh]"
                    ref={(el) => {
                      if (el) {
                        const existing = el.parentElement?.querySelector('.top-scroll-bar') as HTMLElement;
                        if (!existing) {
                          const topScroll = document.createElement('div');
                          topScroll.className = 'top-scroll-bar';
                          topScroll.style.cssText = 'overflow-x:auto;overflow-y:hidden;height:14px;border-bottom:1px solid #e2e8f0;';
                          const inner = document.createElement('div');
                          inner.style.height = '1px';
                          topScroll.appendChild(inner);
                          el.parentElement?.insertBefore(topScroll, el);
                          topScroll.addEventListener('scroll', () => { el.scrollLeft = topScroll.scrollLeft; });
                          el.addEventListener('scroll', () => { topScroll.scrollLeft = el.scrollLeft; });
                          const obs = new ResizeObserver(() => {
                            const table = el.querySelector('table');
                            if (table) inner.style.width = table.scrollWidth + 'px';
                          });
                          obs.observe(el);
                        }
                      }
                    }}
                  >
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 z-30">
                        <tr className="bg-slate-800 text-white">
                          <th className="sticky left-0 top-0 z-40 bg-slate-800 px-3 py-3 text-left font-bold text-xs border-r border-slate-700 w-36 min-w-[140px]" />
                          <th className="px-2 py-3 text-center font-bold text-xs bg-slate-700 border-r border-slate-600 min-w-[65px]">Benchmark</th>
                          {filteredCombined.map((c, i) => {
                            const displayName = c.companyName.replace(/ International$/i, '').replace(/ Corporation$/i, '');
                            return (
                            <th key={c.surveyId} className={`px-1 py-3 text-center font-semibold text-xs leading-tight min-w-[60px] ${i % 2 === 0 ? 'bg-slate-700' : 'bg-slate-800'}`}>
                              {displayName.length > 14
                                ? displayName.split(' ').slice(0, 2).map((w, j) => <span key={j} className="block">{w}</span>)
                                : displayName}
                            </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Composite Section */}
                        <tr className="bg-slate-200 border-y-2 border-slate-400">
                          <td colSpan={2 + filteredCombined.length} className="px-3 py-1.5 font-bold text-slate-900 uppercase text-xs tracking-wider">Composite Score</td>
                        </tr>
                        {/* Equal */}
                        <tr className="border-b border-slate-200">
                          <td className="sticky left-0 z-10 bg-white px-3 py-3 text-slate-800 font-semibold text-sm border-r border-slate-100">Equal</td>
                          <td className="px-2 py-3 text-center font-bold text-slate-800 text-sm bg-slate-50 border-r border-slate-100">{combinedBenchmark?.eqC}</td>
                          {filteredCombined.map((c, i) => (
                            <td key={c.surveyId} className={`px-1 py-3 text-center font-semibold text-slate-800 ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>{c.eqComposite}</td>
                          ))}
                        </tr>
                        {/* Element-Weighted */}
                        <tr className="border-b border-slate-200 bg-emerald-50">
                          <td className="sticky left-0 z-10 bg-emerald-50 px-3 py-2.5 text-emerald-800 font-bold text-sm border-r border-emerald-100">Weighted</td>
                          <td className="px-2 py-2.5 text-center font-bold bg-emerald-100 border-r border-emerald-100" style={{ color: getScoreColor(combinedBenchmark?.wtC || 0) }}>{combinedBenchmark?.wtC}</td>
                          {filteredCombined.map((c, i) => (
                            <td key={c.surveyId} className={`px-1 py-2.5 text-center font-bold ${i % 2 === 0 ? 'bg-emerald-50' : 'bg-emerald-50/50'}`} style={{ color: getScoreColor(c.wtComposite) }}>{c.wtComposite}</td>
                          ))}
                        </tr>
                        {/* Unsure Sub */}
                        <tr className="border-b border-slate-200 bg-amber-50">
                          <td className="sticky left-0 z-10 bg-amber-50 px-3 py-2.5 text-amber-800 font-bold text-sm border-r border-amber-100">Unsure Sub</td>
                          <td className="px-2 py-2.5 text-center font-bold bg-amber-100 border-r border-amber-100" style={{ color: getScoreColor(combinedBenchmark?.unC || 0) }}>{combinedBenchmark?.unC}</td>
                          {filteredCombined.map((c, i) => (
                            <td key={c.surveyId} className={`px-1 py-2.5 text-center font-bold ${i % 2 === 0 ? 'bg-amber-50' : 'bg-amber-50/50'}`} style={{ color: getScoreColor(c.unsureComposite) }}>{c.unsureComposite}</td>
                          ))}
                        </tr>
                        {/* Weighted + Unsure */}
                        <tr className="border-b border-slate-200 bg-violet-50">
                          <td className="sticky left-0 z-10 bg-violet-50 px-3 py-2.5 text-violet-800 font-bold text-sm border-r border-violet-100">Wt + Unsure</td>
                          <td className="px-2 py-2.5 text-center font-bold bg-violet-100 border-r border-violet-100" style={{ color: getScoreColor(combinedBenchmark?.cbC || 0) }}>{combinedBenchmark?.cbC}</td>
                          {filteredCombined.map((c, i) => (
                            <td key={c.surveyId} className={`px-1 py-2.5 text-center font-bold ${i % 2 === 0 ? 'bg-violet-50' : 'bg-violet-50/50'}`} style={{ color: getScoreColor(c.combinedComposite) }}>{c.combinedComposite}</td>
                          ))}
                        </tr>
                        {/* Delta: Combined vs Equal */}
                        <tr className="border-b-2 border-slate-400 bg-slate-100">
                          <td className="sticky left-0 z-10 bg-slate-100 px-3 py-1.5 text-slate-600 text-xs font-bold border-r border-slate-200">&Delta; vs Equal</td>
                          <td className="px-2 py-1.5 text-center text-xs font-bold bg-slate-100 border-r border-slate-200">
                            {combinedBenchmark && <span className={(combinedBenchmark.cbC - combinedBenchmark.eqC) >= 0 ? 'text-violet-700' : 'text-red-700'}>{(combinedBenchmark.cbC - combinedBenchmark.eqC) >= 0 ? '+' : ''}{combinedBenchmark.cbC - combinedBenchmark.eqC}</span>}
                          </td>
                          {filteredCombined.map((c) => {
                            const d = c.combinedComposite - c.eqComposite;
                            return (
                              <td key={c.surveyId} className="px-1 py-1.5 text-center text-xs font-bold">
                                <span className={d > 0 ? 'text-violet-700' : d < 0 ? 'text-red-700' : 'text-slate-400'}>
                                  {d > 0 ? '+' : ''}{d}
                                </span>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Dimension Rows */}
                        {DIMENSION_ORDER.map((dim, idx) => (
                          <React.Fragment key={dim}>
                            <tr className={`${idx === 0 ? '' : 'border-t-2 border-slate-200'} bg-slate-100`}>
                              <td colSpan={2 + filteredCombined.length} className="px-3 py-1 text-xs font-bold text-slate-800">
                                D{dim}: {DIMENSION_NAMES[dim]} <span className="text-slate-500 font-medium">({DEFAULT_DIMENSION_WEIGHTS[dim]}%)</span>
                              </td>
                            </tr>
                            {/* Equal */}
                            <tr className="border-b border-slate-100">
                              <td className="sticky left-0 z-10 bg-white px-3 py-1 text-slate-600 pl-4 text-xs font-medium border-r border-slate-100">Equal</td>
                              <td className="px-2 py-2 text-center text-slate-700 text-sm bg-slate-50/50 border-r border-slate-100">{combinedBenchmark?.dims[dim]?.eq}</td>
                              {filteredCombined.map((c, i) => (
                                <td key={c.surveyId} className={`px-1 py-2 text-center text-slate-700 text-sm ${i % 2 === 0 ? 'bg-slate-50/30' : ''}`}>{c.dims[dim]?.eq}</td>
                              ))}
                            </tr>
                            {/* Element-Weighted */}
                            <tr className="border-b border-slate-100 bg-emerald-50/30">
                              <td className="sticky left-0 z-10 bg-emerald-50/30 px-3 py-1 text-emerald-800 font-semibold pl-4 text-xs border-r border-emerald-100/50">Wt</td>
                              <td className="px-2 py-2 text-center font-semibold text-xs bg-emerald-100/30 border-r border-emerald-100/50" style={{ color: getScoreColor(combinedBenchmark?.dims[dim]?.wt || 0) }}>{combinedBenchmark?.dims[dim]?.wt}</td>
                              {filteredCombined.map((c, i) => (
                                <td key={c.surveyId} className={`px-1 py-2 text-center text-xs font-semibold ${i % 2 === 0 ? 'bg-emerald-50/40' : 'bg-emerald-50/20'}`} style={{ color: getScoreColor(c.dims[dim]?.wt || 0) }}>
                                  {c.dims[dim]?.wt}
                                </td>
                              ))}
                            </tr>
                            {/* Unsure Sub */}
                            <tr className="border-b border-slate-100 bg-amber-50/30">
                              <td className="sticky left-0 z-10 bg-amber-50/30 px-3 py-1 text-amber-800 font-semibold pl-4 text-xs border-r border-amber-100/50">Unsure</td>
                              <td className="px-2 py-2 text-center font-semibold text-xs bg-amber-100/30 border-r border-amber-100/50" style={{ color: getScoreColor(combinedBenchmark?.dims[dim]?.unsure || 0) }}>{combinedBenchmark?.dims[dim]?.unsure}</td>
                              {filteredCombined.map((c, i) => (
                                <td key={c.surveyId} className={`px-1 py-2 text-center text-xs font-semibold ${i % 2 === 0 ? 'bg-amber-50/40' : 'bg-amber-50/20'}`} style={{ color: getScoreColor(c.dims[dim]?.unsure || 0) }}>
                                  {c.dims[dim]?.unsure}
                                </td>
                              ))}
                            </tr>
                            {/* Weighted + Unsure */}
                            <tr className="border-b border-slate-100 bg-violet-50/30">
                              <td className="sticky left-0 z-10 bg-violet-50/30 px-3 py-1 text-violet-800 font-semibold pl-4 text-xs border-r border-violet-100/50">Wt+Un</td>
                              <td className="px-2 py-2 text-center font-semibold text-xs bg-violet-100/30 border-r border-violet-100/50" style={{ color: getScoreColor(combinedBenchmark?.dims[dim]?.combined || 0) }}>{combinedBenchmark?.dims[dim]?.combined}</td>
                              {filteredCombined.map((c, i) => (
                                <td key={c.surveyId} className={`px-1 py-2 text-center text-xs font-semibold ${i % 2 === 0 ? 'bg-violet-50/40' : 'bg-violet-50/20'}`} style={{ color: getScoreColor(c.dims[dim]?.combined || 0) }}>
                                  {c.dims[dim]?.combined}
                                </td>
                              ))}
                            </tr>
                            {/* Delta */}
                            <tr className="border-b border-slate-200 bg-slate-50/50">
                              <td className="sticky left-0 z-10 bg-slate-50/50 px-3 py-1 text-slate-500 pl-4 text-[10px] font-bold border-r border-slate-100">&Delta;</td>
                              <td className="px-2 py-1 text-center text-[10px] font-bold bg-slate-50/50 border-r border-slate-100">
                                {combinedBenchmark?.dims[dim]?.eq != null && combinedBenchmark?.dims[dim]?.combined != null && (
                                  <span className={(combinedBenchmark.dims[dim].combined - combinedBenchmark.dims[dim].eq) >= 0 ? 'text-violet-600' : 'text-red-600'}>
                                    {(combinedBenchmark.dims[dim].combined - combinedBenchmark.dims[dim].eq) >= 0 ? '+' : ''}{combinedBenchmark.dims[dim].combined - combinedBenchmark.dims[dim].eq}
                                  </span>
                                )}
                              </td>
                              {filteredCombined.map((c) => {
                                const eqVal = c.dims[dim]?.eq;
                                const cbVal = c.dims[dim]?.combined;
                                const delta = (eqVal != null && cbVal != null) ? cbVal - eqVal : null;
                                return (
                                  <td key={c.surveyId} className="px-1 py-1 text-center text-[10px] font-bold">
                                    {delta !== null && (
                                      <span className={delta > 0 ? 'text-violet-600' : delta < 0 ? 'text-red-600' : 'text-slate-400'}>
                                        {delta > 0 ? '+' : ''}{delta}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
      </div>
    </div>
  );
}

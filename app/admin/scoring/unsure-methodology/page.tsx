'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

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
// UNSURE-ADJUSTED SCORING: (1-r)² + 10% cap
// ============================================

// Number of elements per dimension (for unsure rate calculation)
const DIMENSION_ELEMENT_COUNTS: Record<number, number> = {
  1: 11, 2: 17, 3: 10, 4: 10, 5: 11, 6: 12, 7: 9,
  8: 12, 9: 11, 10: 19, 11: 13, 12: 8, 13: 15,
};

interface UnsureDimensionResult {
  rawScore: number;       // Current method: unsure=0 in denominator
  adjustedScore: number;  // New: (1-r)² substitution + 10% cap
  unsureCount: number;
  totalItems: number;
  unsureRate: number;
  confirmedPts: number;
  maxPts: number;
  unsureCredit: number;   // V_d (the total unsure contribution)
  perUnsureCredit: number; // v_d (per-item credit)
  populationMean: number; // mu_d for this dimension
  capApplied: boolean;
}

function calculateUnsureAdjustedDimensionScore(
  dimNum: number,
  dimData: Record<string, any> | undefined,
  assessment: Record<string, any>,
  blendWeights: typeof DEFAULT_BLEND_WEIGHTS,
  populationMeans: Record<number, number>
): UnsureDimensionResult {
  const result: UnsureDimensionResult = {
    rawScore: 0, adjustedScore: 0, unsureCount: 0, totalItems: 0,
    unsureRate: 0, confirmedPts: 0, maxPts: 0, unsureCredit: 0,
    perUnsureCredit: 0, populationMean: populationMeans[dimNum] || 3.09,
    capApplied: false,
  };

  if (!dimData) return result;
  const mainGrid = dimData[`d${dimNum}a`] || dimData[`D${dimNum}a`];
  if (!mainGrid || typeof mainGrid !== 'object') return result;

  let confirmedPts = 0;
  let unsureCount = 0;
  let answeredItems = 0;
  let totalItems = 0;

  Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
    if (dimNum === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) return;
    totalItems++;
    const { points, isUnsure } = statusToPoints(status);

    if (isUnsure) {
      unsureCount++;
      answeredItems++;
      // Current method: 0 points, counted in denominator
    } else if (points !== null) {
      answeredItems++;
      confirmedPts += points;
    }
  });

  const maxPts = answeredItems * POINTS.CURRENTLY_OFFER;
  result.totalItems = totalItems;
  result.unsureCount = unsureCount;
  result.confirmedPts = confirmedPts;
  result.maxPts = answeredItems * POINTS.CURRENTLY_OFFER;

  // RAW SCORE: current method (unsure = 0, in denominator)
  if (maxPts > 0) {
    result.rawScore = Math.round((confirmedPts / maxPts) * 100);
  }

  // ADJUSTED SCORE: (1-r)² substitution + 10% cap
  // Use answeredItems as denominator to match raw score calculation
  const r = answeredItems > 0 ? unsureCount / answeredItems : 0;
  result.unsureRate = r;
  const mu = populationMeans[dimNum] || 3.09;
  result.populationMean = mu;

  // Per-unsure credit: v_d = mu_d × (1-r)²
  const v_d = mu * Math.pow(1 - r, 2);
  result.perUnsureCredit = v_d;

  // Total unsure contribution: V_d = min(U_d × v_d, 0.10 × MaxPts_d)
  const totalMaxPts = answeredItems * POINTS.CURRENTLY_OFFER;
  let V_d = unsureCount * v_d;
  const cap = 0.10 * totalMaxPts;
  if (V_d > cap) {
    V_d = cap;
    result.capApplied = true;
  }
  result.unsureCredit = V_d;

  // Adjusted dimension score: (ConfirmedPts + V_d) / MaxPts_d × 100
  if (totalMaxPts > 0) {
    result.adjustedScore = Math.round(((confirmedPts + V_d) / totalMaxPts) * 100);
  }

  // Apply geographic multiplier to BOTH scores
  const geoResponse = dimData[`d${dimNum}aa`] || dimData[`D${dimNum}aa`];
  const geoMult = getGeoMultiplier(geoResponse);
  result.rawScore = Math.round(result.rawScore * geoMult);
  result.adjustedScore = Math.round(result.adjustedScore * geoMult);

  // Apply follow-up blending for D1, D3, D12, D13
  const dimKey = `d${dimNum}` as keyof typeof blendWeights;
  if (blendWeights[dimKey]) {
    const followUpScore = calculateFollowUpScore(dimNum, assessment);
    if (followUpScore !== null) {
      const gridPct = blendWeights[dimKey].grid / 100;
      const fuPct = blendWeights[dimKey].followUp / 100;
      result.rawScore = Math.round(result.rawScore * gridPct + followUpScore * fuPct);
      result.adjustedScore = Math.round(result.adjustedScore * gridPct + followUpScore * fuPct);
    }
  }

  return result;
}

// ============================================
// COMPANY-LEVEL UNSURE COMPARISON
// ============================================

interface UnsureCompanyResult {
  companyName: string;
  surveyId: string;
  isComplete: boolean;
  isPanel: boolean;
  isFoundingPartner: boolean;
  dims: Record<number, UnsureDimensionResult>;
  rawComposite: number;     // Current scoring method
  adjustedComposite: number; // With (1-r)² unsure handling
  totalUnsure: number;
  totalItems: number;
  overallUnsurePct: number;
  maxDimUnsurePct: number;
  status: string;
  rankEligible: boolean;
  flags: string;
  maturityScore: number;
  breadthScore: number;
}

function calculateUnsureCompanyResult(
  assessment: Record<string, any>,
  populationMeans: Record<number, number>
): UnsureCompanyResult {
  // Use original scoring for raw composite (guaranteed match with scoring page)
  const rawScores = calculateCompanyScores(assessment, DEFAULT_DIMENSION_WEIGHTS, DEFAULT_COMPOSITE_WEIGHTS, DEFAULT_BLEND_WEIGHTS);

  // Calculate unsure-adjusted dimension scores
  const dims: Record<number, UnsureDimensionResult> = {};
  let totalUnsure = 0;
  let totalItems = 0;
  let maxDimUnsurePct = 0;
  const flagParts: string[] = [];

  for (let i = 1; i <= 13; i++) {
    const dimData = assessment[`dimension${i}_data`];
    dims[i] = calculateUnsureAdjustedDimensionScore(i, dimData, assessment, DEFAULT_BLEND_WEIGHTS, populationMeans);

    // Override rawScore from the original scoring function (guaranteed correct)
    dims[i].rawScore = rawScores.dimensions[i]?.blendedScore || 0;

    totalUnsure += dims[i].unsureCount;
    totalItems += dims[i].totalItems;
    const dimUnsurePct = dims[i].totalItems > 0 ? (dims[i].unsureCount / dims[i].totalItems) * 100 : 0;
    if (dimUnsurePct > maxDimUnsurePct) maxDimUnsurePct = dimUnsurePct;

    // Dimension-level flags
    if (dimUnsurePct > 40) {
      flagParts.push(`D${i} ${Math.round(dimUnsurePct)}%`);
    }
  }

  const overallUnsurePct = totalItems > 0 ? (totalUnsure / totalItems) * 100 : 0;

  // Adjusted composite: dimension-weighted average then 90/5/5
  let adjWeightedDim = 0;
  const totalWeight = Object.values(DEFAULT_DIMENSION_WEIGHTS).reduce((s, w) => s + w, 0);
  if (rawScores.isComplete && totalWeight > 0) {
    for (let i = 1; i <= 13; i++) {
      const w = DEFAULT_DIMENSION_WEIGHTS[i] || 0;
      adjWeightedDim += dims[i].adjustedScore * (w / totalWeight);
    }
  }
  const adjustedComposite = rawScores.isComplete ? Math.round(
    (Math.round(adjWeightedDim) * (DEFAULT_COMPOSITE_WEIGHTS.weightedDim / 100)) +
    (rawScores.maturityScore * (DEFAULT_COMPOSITE_WEIGHTS.maturity / 100)) +
    (rawScores.breadthScore * (DEFAULT_COMPOSITE_WEIGHTS.breadth / 100))
  ) : 0;

  // Determine status
  let status = 'Scored (Confirmed)';
  let rankEligible = true;
  if (overallUnsurePct > 50 || maxDimUnsurePct >= 100) {
    status = 'Scored (Insufficient confirmation)';
    rankEligible = false;
  } else if (overallUnsurePct > 25 || maxDimUnsurePct > 50) {
    status = 'Scored (Provisional - resolution required)';
    rankEligible = false;
  } else if (maxDimUnsurePct > 40) {
    status = 'Scored (Provisional - verify)';
    rankEligible = false;
  }

  const appId = assessment.app_id || assessment.survey_id || '';

  return {
    companyName: rawScores.companyName,
    surveyId: appId,
    isComplete: rawScores.isComplete,
    isPanel: rawScores.isPanel,
    isFoundingPartner: rawScores.isFoundingPartner,
    dims,
    rawComposite: rawScores.compositeScore,
    adjustedComposite,
    totalUnsure,
    totalItems,
    overallUnsurePct,
    maxDimUnsurePct,
    status,
    rankEligible,
    flags: flagParts.length > 0 ? flagParts.join('; ') : '-',
    maturityScore: rawScores.maturityScore,
    breadthScore: rawScores.breadthScore,
  };
}


const DISCOUNT_TABLE = [
  { label: '10% (1 of 10)', oneMinusR: 0.90, squared: 0.81, perItem: 2.50, total: 2.50, pctMax: 5.0 },
  { label: '20% (2 of 10)', oneMinusR: 0.80, squared: 0.64, perItem: 1.98, total: 3.95, pctMax: 7.9 },
  { label: '33% (3 of 10)', oneMinusR: 0.67, squared: 0.45, perItem: 1.39, total: 4.16, pctMax: 8.3 },
  { label: '50% (5 of 10)', oneMinusR: 0.50, squared: 0.25, perItem: 0.77, total: 3.86, pctMax: 7.7 },
  { label: '80% (8 of 10)', oneMinusR: 0.20, squared: 0.04, perItem: 0.12, total: 0.99, pctMax: 2.0 },
  { label: '100% (10 of 10)', oneMinusR: 0.00, squared: 0.00, perItem: 0.00, total: 0.00, pctMax: 0.0 },
];

// ============================================
// HELPERS
// ============================================

function getStatusStyle(status: string): { bg: string; text: string; border: string } {
  if (status.includes('Confirmed')) return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' };
  if (status.includes('verify')) return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
  if (status.includes('resolution')) return { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' };
  return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' };
}

function getUnsureBarColor(pct: number): string {
  if (pct <= 10) return '#059669';
  if (pct <= 25) return '#D97706';
  if (pct <= 50) return '#EA580C';
  return '#DC2626';
}

function getStatusLabel(status: string): string {
  if (status.includes('Confirmed')) return 'Confirmed';
  if (status.includes('verify')) return 'Verify';
  if (status.includes('resolution')) return 'Resolve';
  return 'Excluded';
}

// ============================================
// ICONS
// ============================================

function IconShield() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>); }
function IconTarget() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>); }
function IconChart() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 6-10"/></svg>); }
function IconGrid() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>); }
function IconClipboard() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>); }

// ============================================
// PAGE COMPONENT
// ============================================

export default function UnsureMethodologyPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'impact' | 'alternatives'>('overview');
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<UnsureCompanyResult[]>([]);
  

  // Load assessments from Supabase and compute live scores
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .order('company_name', { ascending: true });
        if (error) throw error;

        const valid = (data || []).filter(a => {
          let dimCount = 0;
          for (let i = 1; i <= 13; i++) {
            const dd = a[`dimension${i}_data`];
            if (dd && typeof dd === 'object') {
              const grid = dd[`d${i}a`];
              if (grid && Object.keys(grid).length > 0) dimCount++;
            }
          }
          return dimCount === 13; // Only complete assessments
        });

        // Step 1: Calculate population means (mu_d) from ALL valid assessments
        const populationMeans: Record<number, number> = {};
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
          populationMeans[dim] = totalAnswered > 0 ? totalPts / totalAnswered : 3.09;
        }

        // Step 2: Calculate unsure-adjusted scores for each company
        setCompanies(valid.map(a => calculateUnsureCompanyResult(a, populationMeans)));
      } catch (err) {
        console.error('Error loading assessments:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCompanies = useMemo(() => {
    let list = companies.filter(c => c.isComplete && !c.isPanel);
    
    return list.sort((a, b) => b.adjustedComposite - a.adjustedComposite);
  }, [companies]);

  const confirmedCount = filteredCompanies.filter(c => c.status.includes('Confirmed')).length;
  const verifyCount = filteredCompanies.filter(c => c.status.includes('verify')).length;
  const resolutionCount = filteredCompanies.filter(c => c.status.includes('resolution')).length;
  const excludedCount = filteredCompanies.filter(c => c.status.includes('Insufficient')).length;

  // Population means for display
  const populationMeans = useMemo(() => {
    const means: Record<number, number> = {};
    for (let i = 1; i <= 13; i++) {
      const vals = filteredCompanies.map(c => c.dims[i]?.populationMean || 0);
      means[i] = vals.length > 0 ? vals[0] : 3.09;
    }
    return means;
  }, [filteredCompanies]);

  // Benchmark: average across filtered companies
  const benchmark = useMemo(() => {
    if (filteredCompanies.length === 0) return null;
    const dims: Record<number, { raw: number; adj: number }> = {};
    for (let i = 1; i <= 13; i++) {
      const raws = filteredCompanies.map(c => c.dims[i]?.rawScore || 0);
      const adjs = filteredCompanies.map(c => c.dims[i]?.adjustedScore || 0);
      dims[i] = {
        raw: Math.round(raws.reduce((a, b) => a + b, 0) / raws.length),
        adj: Math.round(adjs.reduce((a, b) => a + b, 0) / adjs.length),
      };
    }
    const rawC = Math.round(filteredCompanies.reduce((s, c) => s + c.rawComposite, 0) / filteredCompanies.length);
    const adjC = Math.round(filteredCompanies.reduce((s, c) => s + c.adjustedComposite, 0) / filteredCompanies.length);
    return { dims, rawC, adjC };
  }, [filteredCompanies]);

  const DIMENSION_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: <IconTarget /> },
    { key: 'technical' as const, label: 'Technical Methodology', icon: <IconChart /> },
    { key: 'impact' as const, label: 'Company Impact', icon: <IconGrid /> },
    { key: 'alternatives' as const, label: 'Alternatives Explored', icon: <IconClipboard /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-white rounded-lg px-3 py-2"><img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-9" /></div>
              <div className="border-l border-slate-700 pl-6">
                <h1 className="text-lg font-semibold text-white">Unsure Response Handling</h1>
                <p className="text-sm text-slate-400">Best Companies for Working with Cancer Index &mdash; 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/scoring" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Scoring</Link>
              <Link href="/admin/scoring/element-weighting" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Element Weights</Link>
              <Link href="/admin" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.key ? 'border-violet-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}>
                <span className={activeTab === tab.key ? 'text-violet-600' : 'text-slate-400'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-[1400px] mx-auto px-8 py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading assessments from Supabase&hellip;</p>
        </div>
      )}

      {/* Content */}
      {!loading && (
      <div className={`mx-auto py-8 ${activeTab === 'impact' ? 'max-w-[1600px] px-4' : 'max-w-[1400px] px-8'}`}>





        {/* ===== TAB 1: OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Overview</h2>
              <p className="text-slate-600 text-sm">How the Index handles &ldquo;Unsure&rdquo; survey responses fairly and transparently</p>
            </div>

            {/* Bottom Line Callout */}
            <div className="bg-violet-50 border-l-4 border-violet-500 rounded-r-xl px-6 py-3">
              <p className="text-violet-900 text-sm font-medium leading-relaxed"><strong>Bottom line:</strong> We distinguish unverified from not offered, apply steeply discounted partial credit, and cap its contribution&mdash;so a few unknowns are handled fairly while broad uncertainty cannot inflate scores.</p>
            </div>

            {/* Status Cards — colored gradient */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { v: confirmedCount.toString(), l: 'Confirmed', d: 'Final, rank-eligible', color: 'from-emerald-600 to-emerald-700' },
                { v: verifyCount.toString(), l: 'Provisional \u2014 Verify', d: 'Dimensions to confirm', color: 'from-amber-500 to-amber-600' },
                { v: resolutionCount.toString(), l: 'Provisional \u2014 Resolve', d: 'Action items before ranking', color: 'from-orange-500 to-orange-600' },
                { v: excludedCount.toString(), l: 'Excluded', d: 'Insufficient confirmed data', color: 'from-slate-500 to-slate-600' },
              ].map((card, i) => (
                <div key={i} className={`bg-gradient-to-br ${card.color} rounded-xl p-4 text-white shadow-sm`}>
                  <div className="text-3xl font-bold">{card.v}</div>
                  <div className="text-sm font-semibold opacity-95 mt-0.5">{card.l}</div>
                  <div className="text-xs opacity-75 mt-0.5">{card.d}</div>
                </div>
              ))}
            </div>

            {/* Challenge + Two Types — combined row */}
            <div className="grid grid-cols-3 gap-4">
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 col-span-1">
                <h3 className="font-bold text-slate-900 text-sm mb-2">The Challenge</h3>
                <p className="text-slate-600 text-sm leading-relaxed">The Index covers 152 elements across 13 dimensions. Even engaged respondents may not confirm every element&mdash;especially in large organizations. &ldquo;Unsure&rdquo; signals unverified status, not confirmed absence.</p>
              </section>
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 col-span-1">
                <h4 className="font-bold text-emerald-900 text-sm mb-2">Genuine Uncertainty</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">A small number of unknowns scattered across dimensions. The respondent engaged thoroughly but could not confirm everything. Minor data issue, not a quality concern.</p>
              </div>
              <div className="bg-orange-50 rounded-xl border border-orange-200 p-6 col-span-1">
                <h4 className="font-bold text-orange-900 text-sm mb-2">Pervasive Uncertainty</h4>
                <p className="text-xs text-orange-800 leading-relaxed">A high share of unknowns, often concentrated in specific dimensions. The score rests on a narrow confirmed base and must reflect reduced confidence.</p>
              </div>
            </div>

            {/* Resolve Before Scoring — compact dark bar */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl px-6 py-4 text-white">
              <p className="text-sm leading-relaxed"><strong className="text-white">Step 1: Resolve first.</strong> <span className="text-slate-300">Before any adjustment, Cancer and Careers contacts every company with unsures. Companies receive a dimension-organized list with verification guidance. Adjustments apply only after outreach is complete.</span></p>
            </div>

            {/* Our Approach — 5 steps with violet accent */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-4">
                <h3 className="font-bold text-white text-base">Our Approach</h3>
                <p className="text-violet-200 text-xs mt-0.5">Unsure = 0 penalizes honesty. Ignoring unsure inflates scores. Full credit fabricates data. We needed something in between.</p>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { step: '1', text: 'Anchor on the dimension\u2019s confirmed average.' },
                    { step: '2', text: 'Translate that into partial credit for unverified items.' },
                    { step: '3', text: 'Apply a steep discount as uncertainty grows: (1\u2212r)\u00B2.' },
                    { step: '4', text: 'Squared term prevents mid-missingness inflation.' },
                    { step: '5', text: 'Cap total unsure credit at 10% of dimension max.' },
                  ].map((s) => (
                    <div key={s.step} className="bg-violet-50 rounded-lg p-3 border border-violet-100">
                      <div className="w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center mb-2">{s.step}</div>
                      <p className="text-xs text-slate-700 leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* In Practice — compact */}
            <section className="bg-slate-50 rounded-xl border border-slate-200 px-6 py-4">
              <p className="text-slate-700 text-sm leading-relaxed"><strong className="text-slate-900">In practice:</strong> A few unknowns &rarr; minimal adjustment. As uncertainty increases, partial credit declines quickly, and the 10% cap prevents unsure from driving scores. This preserves a fair distinction between unverified and confirmed not offered. The same methodology applies to company scores and benchmarks.</p>
            </section>
          </div>
        )}
        {/* ===== TAB 2: TECHNICAL METHODOLOGY ===== */}
        {activeTab === 'technical' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Technical Methodology</h2>
              <p className="text-slate-600 text-sm">Discounted partial credit using (1&minus;r)&sup2; decay with a 10% structural cap</p>
            </div>

            {/* Formula */}
            <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg overflow-hidden text-white p-8">
              <h3 className="font-bold text-xl mb-6">The Formula</h3>
              <div className="grid grid-cols-3 gap-5">
                <div className="bg-white/10 rounded-lg p-5 border border-white/10">
                  <p className="text-sm text-slate-300 mb-2 font-medium">Per-unsure credit</p>
                  <p className="text-xl font-mono font-bold">v<sub>d</sub> = &mu;<sub>d</sub> &times; (1 &minus; r<sub>d</sub>)&sup2;</p>
                  <p className="text-xs text-slate-400 mt-2">&mu;<sub>d</sub> = dimension population mean, r<sub>d</sub> = unsure rate</p>
                </div>
                <div className="bg-white/10 rounded-lg p-5 border border-white/10">
                  <p className="text-sm text-slate-300 mb-2 font-medium">Total unsure contribution</p>
                  <p className="text-xl font-mono font-bold">V<sub>d</sub> = min( U<sub>d</sub> &times; v<sub>d</sub> , 0.10 &times; Max<sub>d</sub> )</p>
                  <p className="text-xs text-slate-400 mt-2">U<sub>d</sub> = unsure count, capped at 10% of dimension max</p>
                </div>
                <div className="bg-white/10 rounded-lg p-5 border border-white/10">
                  <p className="text-sm text-slate-300 mb-2 font-medium">Dimension score</p>
                  <p className="text-xl font-mono font-bold">Score<sub>d</sub> = (Pts + V<sub>d</sub>) / Max<sub>d</sub></p>
                  <p className="text-xs text-slate-400 mt-2">Pts = confirmed points (5/3/2/0 scale)</p>
                </div>
              </div>
            </section>

            {/* Discount Schedule */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Discount Schedule</h3>
                <p className="text-slate-500 text-sm mt-1">The squared term ensures total credit peaks around r = 33% then declines, avoiding the &ldquo;hump problem&rdquo; that a linear discount creates at r = 50%. Illustrative values use &mu;<sub>d</sub> = 3.09.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-semibold">Unsure Rate</th>
                      <th className="px-5 py-3 text-center font-semibold">(1&minus;r)&sup2;</th>
                      <th className="px-5 py-3 text-center font-semibold">Per-Item Credit</th>
                      <th className="px-5 py-3 text-center font-semibold">Total Contrib</th>
                      <th className="px-5 py-3 text-center font-semibold">% of Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DISCOUNT_TABLE.map((row) => (
                      <tr key={row.label} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-800">{row.label}</td>
                        <td className="px-5 py-3 text-center font-mono font-bold text-slate-900">{row.squared.toFixed(2)}</td>
                        <td className="px-5 py-3 text-center font-mono text-slate-700">{row.perItem.toFixed(2)}</td>
                        <td className="px-5 py-3 text-center font-mono text-slate-700">{row.total.toFixed(2)}</td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-violet-500" style={{ width: `${row.pctMax * 10}%` }} />
                            </div>
                            <span className="font-mono font-bold text-slate-800 w-12 text-right">{row.pctMax.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Worked Example */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Worked Example: Company X, Dimension 3</h3>
              <p className="text-slate-600 mb-5">10 elements. Company confirms 7 (earning 26 pts out of 50 max), says &ldquo;Unsure&rdquo; on 3. Population mean &mu;<sub>3</sub> = 3.12.</p>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 mb-1">Unsure rate (r)</p>
                  <p className="text-xl font-bold text-slate-800 font-mono">0.30</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 mb-1">Per-unsure credit</p>
                  <p className="text-xl font-bold text-slate-800 font-mono">1.53</p>
                  <p className="text-[10px] text-slate-400">3.12 &times; 0.49</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 mb-1">Total unsure credit</p>
                  <p className="text-xl font-bold text-slate-800 font-mono">4.59</p>
                  <p className="text-[10px] text-slate-400">3 &times; 1.53 (under 5.0 cap)</p>
                </div>
                <div className="bg-violet-50 rounded-lg p-4 border border-violet-200 text-center">
                  <p className="text-xs text-violet-600 mb-1">Final score</p>
                  <p className="text-xl font-bold text-violet-800 font-mono">61.2%</p>
                  <p className="text-[10px] text-violet-500">(26 + 4.59) / 50</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-4">Compare: unsure = 0 gives 52.0%. Pure exclusion gives 74.3%. Discounted substitution: 61.2%.</p>
            </section>
          </div>
        )}
        {/* ===== TAB 3: SCORE COMPARISON — LIVE FROM SUPABASE ===== */}
        {activeTab === 'impact' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Score Comparison</h2>
                <p className="text-slate-600 text-sm">Current scores vs. unsure-substituted scores calculated live from assessment data. Substitution applies (1&minus;r)&sup2; discounted partial credit with a 10% dimension cap.</p>
              </div>
            </div>

            {filteredCompanies.length === 0 ? (
              <div className="text-center py-20 text-slate-500">No complete assessments found.</div>
            ) : (
              <>
                {/* Legend + Stats */}
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white border-2 border-slate-300" />
                    <span className="text-slate-700 text-sm font-medium">Current (Unsure = 0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-violet-600" />
                    <span className="text-slate-700 text-sm font-medium">Unsure Substitution</span>
                  </div>
                  <div className="ml-auto flex items-center gap-6">
                    <div>
                      <span className="text-2xl font-bold text-violet-700">{filteredCompanies.filter(c => c.adjustedComposite > c.rawComposite).length}</span>
                      <span className="text-sm text-slate-600 ml-1">score higher</span>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-slate-800">
                        {(filteredCompanies.reduce((s, c) => s + Math.abs(c.adjustedComposite - c.rawComposite), 0) / filteredCompanies.length).toFixed(1)}
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
                        // Duplicate horizontal scrollbar at top
                        const existing = el.parentElement?.querySelector('.top-scroll-bar') as HTMLElement;
                        if (!existing) {
                          const topScroll = document.createElement('div');
                          topScroll.className = 'top-scroll-bar';
                          topScroll.style.cssText = 'overflow-x:auto;overflow-y:hidden;height:14px;border-bottom:1px solid #e2e8f0;';
                          const inner = document.createElement('div');
                          inner.style.height = '1px';
                          topScroll.appendChild(inner);
                          el.parentElement?.insertBefore(topScroll, el);
                          // Sync scrolling
                          topScroll.addEventListener('scroll', () => { el.scrollLeft = topScroll.scrollLeft; });
                          el.addEventListener('scroll', () => { topScroll.scrollLeft = el.scrollLeft; });
                          // Match width after render
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
                            <th key={c.surveyId || c.companyName} className={`px-1 py-3 text-center font-semibold text-xs leading-tight min-w-[60px] ${i % 2 === 0 ? 'bg-slate-700' : 'bg-slate-800'}`}>
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
                          <td className="sticky left-0 z-10 bg-white px-3 py-3 text-slate-800 font-semibold text-sm border-r border-slate-100">Current</td>
                          <td className="px-2 py-3 text-center font-bold text-slate-800 text-sm bg-slate-50 border-r border-slate-100">{benchmark?.rawC}</td>
                          {filteredCompanies.map((c, i) => (
                            <td key={c.surveyId || c.companyName} className={`px-1 py-3 text-center font-semibold text-slate-800 ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>{c.rawComposite}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-slate-200 bg-violet-50">
                          <td className="sticky left-0 z-10 bg-violet-50 px-3 py-3 text-violet-800 font-bold text-sm border-r border-violet-100">Unsure Sub</td>
                          <td className="px-2 py-2.5 text-center font-bold bg-violet-100 border-r border-violet-100" style={{ color: getScoreColor(benchmark?.adjC || 0) }}>{benchmark?.adjC}</td>
                          {filteredCompanies.map((c, i) => (
                            <td key={c.surveyId || c.companyName} className={`px-1 py-2.5 text-center font-bold ${i % 2 === 0 ? 'bg-violet-50' : 'bg-violet-50/50'}`} style={{ color: getScoreColor(c.adjustedComposite) }}>{c.adjustedComposite}</td>
                          ))}
                        </tr>
                        <tr className="border-b-2 border-slate-400 bg-slate-100">
                          <td className="sticky left-0 z-10 bg-slate-100 px-3 py-1.5 text-slate-600 text-xs font-bold border-r border-slate-200">&Delta;</td>
                          <td className="px-2 py-1.5 text-center text-xs font-bold bg-slate-100 border-r border-slate-200">
                            {benchmark && <span className={(benchmark.adjC - benchmark.rawC) >= 0 ? 'text-violet-700' : 'text-red-700'}>{(benchmark.adjC - benchmark.rawC) >= 0 ? '+' : ''}{benchmark.adjC - benchmark.rawC}</span>}
                          </td>
                          {filteredCompanies.map((c) => {
                            const d = c.adjustedComposite - c.rawComposite;
                            return (
                              <td key={c.surveyId || c.companyName} className="px-1 py-1.5 text-center text-xs font-bold">
                                <span className={d > 0 ? 'text-violet-700' : d < 0 ? 'text-red-700' : 'text-slate-400'}>
                                  {d > 0 ? '+' : ''}{d}
                                </span>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Unsure % row */}
                        <tr className="bg-amber-50/50 border-b-2 border-slate-300">
                          <td className="sticky left-0 z-10 bg-amber-50/50 px-3 py-1.5 text-amber-800 text-xs font-bold border-r border-amber-100">Unsure %</td>
                          <td className="px-2 py-1.5 text-center text-xs font-bold bg-amber-50 border-r border-amber-100 text-amber-700">&mdash;</td>
                          {filteredCompanies.map((c) => (
                            <td key={c.surveyId || c.companyName} className="px-1 py-1.5 text-center text-xs font-bold" style={{ color: getUnsureBarColor(c.overallUnsurePct) }}>
                              {c.overallUnsurePct.toFixed(0)}%
                            </td>
                          ))}
                        </tr>

                        {/* Dimension Rows */}
                        {DIMENSION_ORDER.map((dim, idx) => (
                          <React.Fragment key={dim}>
                            <tr className={`${idx === 0 ? '' : 'border-t-2 border-slate-200'} bg-slate-100`}>
                              <td colSpan={2 + filteredCompanies.length} className="px-3 py-1 text-xs font-bold text-slate-800">
                                D{dim}: {DIMENSION_NAMES[dim]}
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="sticky left-0 z-10 bg-white px-3 py-1 text-slate-600 pl-4 text-xs font-medium border-r border-slate-100">Current</td>
                              <td className="px-2 py-2 text-center text-slate-700 text-sm bg-slate-50/50 border-r border-slate-100">{benchmark?.dims[dim]?.raw}</td>
                              {filteredCompanies.map((c, i) => (
                                <td key={c.surveyId || c.companyName} className={`px-1 py-2 text-center text-slate-700 text-sm ${i % 2 === 0 ? 'bg-slate-50/30' : ''}`}>{c.dims[dim]?.rawScore}</td>
                              ))}
                            </tr>
                            <tr className="border-b border-slate-100 bg-violet-50/30">
                              <td className="sticky left-0 z-10 bg-violet-50/30 px-3 py-1 text-violet-800 font-semibold pl-4 text-xs border-r border-violet-100/50">Unsure Sub</td>
                              <td className="px-2 py-2 text-center font-semibold text-xs bg-violet-100/30 border-r border-violet-100/50" style={{ color: getScoreColor(benchmark?.dims[dim]?.adj || 0) }}>{benchmark?.dims[dim]?.adj}</td>
                              {filteredCompanies.map((c, i) => (
                                <td key={c.surveyId || c.companyName} className={`px-1 py-2 text-center text-xs font-semibold ${i % 2 === 0 ? 'bg-violet-50/40' : 'bg-violet-50/20'}`} style={{ color: getScoreColor(c.dims[dim]?.adjustedScore || 0) }}>
                                  {c.dims[dim]?.adjustedScore}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-b border-slate-200 bg-slate-50/50">
                              <td className="sticky left-0 z-10 bg-slate-50/50 px-3 py-0.5 text-slate-500 pl-4 text-[10px] font-bold border-r border-slate-100">&Delta;</td>
                              <td className="px-2 py-0.5 text-center text-[10px] font-bold bg-slate-50/50 border-r border-slate-100">
                                {benchmark && (() => { const dd = (benchmark.dims[dim]?.adj || 0) - (benchmark.dims[dim]?.raw || 0); return <span className={dd > 0 ? 'text-violet-700' : dd < 0 ? 'text-red-700' : 'text-slate-400'}>{dd > 0 ? '+' : ''}{dd}</span>; })()}
                              </td>
                              {filteredCompanies.map((c) => {
                                const dd = (c.dims[dim]?.adjustedScore || 0) - (c.dims[dim]?.rawScore || 0);
                                return (
                                  <td key={c.surveyId || c.companyName} className="px-1 py-0.5 text-center text-[10px] font-bold">
                                    <span className={dd > 0 ? 'text-violet-700' : dd < 0 ? 'text-red-700' : 'text-slate-400'}>
                                      {dd > 0 ? '+' : ''}{dd}
                                    </span>
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

                {/* Score Status Thresholds */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg">Score Status and Rank Eligibility</h3>
                    <p className="text-slate-500 text-sm mt-1">Determined by overall unsure rate and highest single-dimension unsure rate</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                          <th className="px-5 py-3 text-left font-semibold w-64">Status</th>
                          <th className="px-5 py-3 text-left font-semibold">Criteria</th>
                          <th className="px-5 py-3 text-left font-semibold w-48">Rank Eligibility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50"><td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Scored (Confirmed)</span></td><td className="px-5 py-3 text-slate-700">Overall unsure &le; 25% AND max dimension &le; 40%</td><td className="px-5 py-3 text-emerald-700 font-semibold">Eligible</td></tr>
                        <tr className="hover:bg-slate-50"><td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">Provisional &mdash; Verify</span></td><td className="px-5 py-3 text-slate-700">Overall unsure &le; 25% AND max dimension 40&ndash;50%</td><td className="px-5 py-3 text-amber-700 font-semibold">Pending verification</td></tr>
                        <tr className="hover:bg-slate-50"><td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">Provisional &mdash; Resolution</span></td><td className="px-5 py-3 text-slate-700">Overall &le; 25% AND max dim &gt; 50%, OR overall &gt; 25%</td><td className="px-5 py-3 text-orange-700 font-semibold">Pending resolution</td></tr>
                        <tr className="hover:bg-slate-50"><td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">Excluded from Ranking</span></td><td className="px-5 py-3 text-slate-700">Overall &gt; 50% OR any dimension = 100% unsure</td><td className="px-5 py-3 text-red-700 font-semibold">Excluded</td></tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Dimension-Level Flags */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg">Dimension-Level Flags</h3>
                    <p className="text-slate-500 text-sm mt-1">Individual dimensions may be flagged as provisional even when the overall score is confirmed</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                          <th className="px-5 py-3 text-left font-semibold">Dimension Unsure Rate</th>
                          <th className="px-5 py-3 text-center font-semibold">Flag Level</th>
                          <th className="px-5 py-3 text-left font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr><td className="px-5 py-3 text-slate-700">&le; 25%</td><td className="px-5 py-3 text-center text-emerald-700 font-semibold">No flag</td><td className="px-5 py-3 text-slate-700">Dimension scored normally.</td></tr>
                        <tr><td className="px-5 py-3 text-slate-700">&gt; 25&ndash;40%</td><td className="px-5 py-3 text-center text-amber-700 font-semibold">Note</td><td className="px-5 py-3 text-slate-700">Noted in company report. No immediate action required.</td></tr>
                        <tr><td className="px-5 py-3 text-slate-700">&gt; 40&ndash;50%</td><td className="px-5 py-3 text-center text-orange-700 font-semibold">Elevated</td><td className="px-5 py-3 text-slate-700">Company contacted for verification of this specific dimension.</td></tr>
                        <tr><td className="px-5 py-3 text-slate-700">&gt; 50%</td><td className="px-5 py-3 text-center text-red-700 font-semibold">High</td><td className="px-5 py-3 text-slate-700">Resolution required before this dimension&apos;s score can be considered final.</td></tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
        {/* ===== TAB 4: ALTERNATIVES EXPLORED ===== */}
        {activeTab === 'alternatives' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Alternatives Explored</h2>
              <p className="text-slate-600 text-sm">Nine approaches were tested and stress-tested against the full dataset of 43 organizations</p>
            </div>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold w-72">Approach Tested</th>
                      <th className="px-6 py-3 text-left font-semibold">Why We Moved On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { approach: 'Unsure = 0, in denominator', reason: 'Treats \u201cI don\u2019t know\u201d identically to \u201cwe don\u2019t offer this.\u201d Penalizes honest uncertainty.' },
                      { approach: 'Positive point value (e.g., 1pt)', reason: 'Creates a perverse incentive: saying \u201cUnsure\u201d scores better than confirming \u201cNot Offered\u201d (0pts).' },
                      { approach: 'Negative point value (e.g., \u22121pt)', reason: 'Even one unsure penalizes worse than confirming absence. Contradicts the benefit-of-the-doubt principle.' },
                      { approach: 'Pure mean substitution', reason: 'Replaces each unsure with the population average regardless of concentration. Fabricates data, compresses variance.' },
                      { approach: 'Statistical imputation', reason: 'Unstable at n = 43. Difficult to explain at executive and advisory committee venues.' },
                      { approach: 'Exclude from denominator', reason: 'Too generous. A company confirming 1 of 10 elements at full credit would score 100%.' },
                      { approach: 'Flat per-unsure penalty', reason: 'The penalty amount could not be cleanly derived from the data. Under peer review, the constant has no satisfying justification.' },
                      { approach: 'Sliding penalty', reason: 'Improved on flat penalty but still relied on arbitrary constants. Produced implausible scores at certain concentrations.' },
                      { approach: 'Linear discount: \u03bc \u00d7 (1\u2212r)', reason: 'Total credit peaked at r = 50%, meaning companies with half their elements unsure received more credit than those with 25% unsure.' },
                    ].map((item, i) => (
                      <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-slate-100/50`}>
                        <td className="px-6 py-3.5 font-semibold text-slate-800">{item.approach}</td>
                        <td className="px-6 py-3.5 text-slate-700">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Disclosure Language */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Disclosure Language</h3>
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 mb-4">
                <p className="text-sm text-slate-800"><span className="font-bold">Approved:</span> &ldquo;Unsure items receive discounted partial credit using a squared discount function calibrated to the dimension population mean, capped at 10% of the dimension maximum. Provisional scores require verification before final ranking.&rdquo;</p>
              </div>
              <div className="bg-red-50 rounded-lg p-5 border border-red-200">
                <p className="text-sm text-red-800"><span className="font-bold">Do not use:</span> &ldquo;Incentive compatible,&rdquo; &ldquo;no advantage to selecting Unsure,&rdquo; or similar claims. The methodology gives modest partial credit for unsure responses, which means there is a small advantage to saying Unsure over confirming Not Offered. This is a deliberate design choice, not a claim of incentive neutrality.</p>
              </div>
            </section>
          </div>
        )}

      </div>
      )}
    </div>
  );
}

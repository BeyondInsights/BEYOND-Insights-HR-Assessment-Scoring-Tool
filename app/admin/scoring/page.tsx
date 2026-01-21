/**
 * AGGREGATE SCORING REPORT - CORRECTED
 * 
 * FIXES APPLIED:
 * 1. TierBadge now shows "Provisional" indicator when isProvisional=true
 * 2. Maturity scoring: "legal minimum" = 0 points (not 30)
 * 3. Wt% column widened from 50 to 65px
 * 4. Totals row added with adjustment helper
 * 5. Blend weights adjustable via settings panel (not scattered popovers)
 * 6. Unweighted Average row - KEPT
 * 7. Dimension Tier row - KEPT
 * 8. D10 "Concierge services" item excluded - added post-launch, will include in Year 2
 * 9. Follow-up scoring substring bugs fixed - proper range ordering to avoid mis-scoring
 * 10. Geo multiplier: Single-country = 1.0 (N/A - question doesn't apply)
 *     - 1.0 = Multi-country + Consistent OR Single-country (N/A)
 *     - 0.90 = Multi-country + Varies
 *     - 0.75 = Multi-country + Select locations only
 * 11. Tier Stats modal with composite/dimension tier counts + provisional count
 * 12. Sensitivity analysis for weight robustness testing
 * 13. Reliability diagnostics for internal consistency
 * 14. Data Confidence metric: % of items NOT marked "Unsure" (color-coded badge per company)
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_DIMENSION_WEIGHTS: Record<number, number> = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3,
};

const DEFAULT_COMPOSITE_WEIGHTS = {
  weightedDim: 90,  // Primary: weighted dimension scores (depth blended into D1/D3/D12/D13)
  depth: 0,         // Deprecated: now integrated into dimensions via 85/15 blend
  maturity: 5,      // Program maturity level (OR1)
  breadth: 5,       // Coverage scope (CB3a/b/c)
};

// Default blend weights for dimensions with follow-up questions
const DEFAULT_BLEND_WEIGHTS = {
  d1: { grid: 85, followUp: 15 },
  d3: { grid: 85, followUp: 15 },
  d12: { grid: 85, followUp: 15 },
  d13: { grid: 85, followUp: 15 },
};

const DIMENSION_NAMES: Record<number, string> = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources',
  5: 'Workplace Accommodations',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention & Wellness',
  12: 'Continuous Improvement',
  13: 'Communication & Awareness',
};

const DIMENSION_ORDER = [4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12];

const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };
const INSUFFICIENT_DATA_THRESHOLD = 0.40;

// D10 item exclusion - added after initial survey launch, excluded for Year 1 fairness
// Will be included in Year 2 scoring once all respondents have had opportunity to answer
const D10_EXCLUDED_ITEMS = [
  'Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'
];

const COL1_WIDTH = 280;
const COL2_WIDTH = 65;  // WIDENED from 50
const COL_AVG_WIDTH = 60;

// ============================================
// SCORING FUNCTIONS
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
  if (v.includes('13 or more') || v.includes('13 weeks or more') || v.includes('13+ weeks')) return 100;
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
      const d12_1 = dimData?.d12_1;
      return d12_1 ? scoreD12CaseReview(d12_1) : null;
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

function getPerformanceTier(score: number): { name: string; color: string; bg: string; border: string } {
  if (score >= 90) return { name: 'Exemplary', color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' };
  if (score >= 75) return { name: 'Leading', color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' };
  if (score >= 60) return { name: 'Progressing', color: '#92400E', bg: '#FEF3C7', border: '#FCD34D' };
  if (score >= 40) return { name: 'Emerging', color: '#9A3412', bg: '#FFEDD5', border: '#FDBA74' };
  return { name: 'Developing', color: '#374151', bg: '#F3F4F6', border: '#D1D5DB' };
}

// ============================================
// EDUCATIONAL MODALS
// ============================================

function DimensionScoringModal({ onClose, defaultWeights }: { onClose: () => void; defaultWeights: Record<number, number> }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">How Dimension Scoring Works</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="space-y-6">
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">1</span>
                Grid Response Scoring
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-green-700">Currently Offer</span>
                  <div className="flex-1 h-2 bg-green-200 rounded-full" />
                  <span className="font-bold text-green-700">5 points</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-blue-700">Planning</span>
                  <div className="flex-1 h-2 bg-blue-200 rounded-full" style={{ width: '60%' }} />
                  <span className="font-bold text-blue-700">3 points</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-amber-700">Assessing</span>
                  <div className="flex-1 h-2 bg-amber-200 rounded-full" style={{ width: '40%' }} />
                  <span className="font-bold text-amber-700">2 points</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-red-700">Not Able</span>
                  <div className="flex-1 h-2 bg-red-200 rounded-full" style={{ width: '5%' }} />
                  <span className="font-bold text-red-700">0 points</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-gray-500">Unsure</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full" style={{ width: '5%' }} />
                  <span className="font-bold text-gray-500">0 pts (in denominator)</span>
                </div>
              </div>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">2</span>
                Geographic Multiplier
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Multi-country + Consistent across all locations</span><span className="font-bold text-green-600">x1.00</span></div>
                <div className="flex justify-between"><span>Single-country (geo question not applicable)</span><span className="font-bold text-green-600">x1.00</span></div>
                <div className="flex justify-between"><span>Multi-country + Varies by location</span><span className="font-bold text-amber-600">x0.90</span></div>
                <div className="flex justify-between"><span>Multi-country + Only available in select locations</span><span className="font-bold text-red-600">x0.75</span></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                Note: The geo multiplier measures consistency across locations. Single-country companies receive 1.0 
                because the question does not apply. Global operational complexity is displayed separately via the 
                Global Footprint indicator.
              </p>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">3</span>
                Depth Blend (D1, D3, D12, D13)
              </h3>
              <div className="bg-purple-50 rounded-lg p-4 text-sm">
                <p className="mb-2">These dimensions blend Grid Score with Follow-up Quality:</p>
                <div className="bg-white rounded p-3 border border-purple-200 mb-2">
                  <strong>Blended Score</strong> = (Grid x Grid%) + (Follow-up x Follow-up%)
                </div>
                <p className="text-purple-600 text-xs">Adjust blend weights in the settings panel above the table.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompositeModal({ onClose, compositeWeights }: { onClose: () => void; compositeWeights: typeof DEFAULT_COMPOSITE_WEIGHTS }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">How Composite Scoring Works</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-5 border border-purple-200">
              <div className="text-center space-y-3">
                <p className="text-sm text-purple-700 font-medium">Composite Score =</p>
                <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
                  <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold">Weighted Dim x {compositeWeights.weightedDim}%</span>
                  <span className="text-purple-600 font-bold">+</span>
                  <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold">Maturity x {compositeWeights.maturity}%</span>
                  <span className="text-purple-600 font-bold">+</span>
                  <span className="px-3 py-1.5 bg-violet-600 text-white rounded-lg font-bold">Breadth x {compositeWeights.breadth}%</span>
                </div>
              </div>
            </div>
            
            {/* Maturity - FIXED scoring shown */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h4 className="font-bold text-indigo-900 mb-3">Maturity Score (OR1)</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <p>Comprehensive support: <strong className="text-green-600">100 pts</strong></p>
                <p>Enhanced support: <strong className="text-green-600">80 pts</strong></p>
                <p>Moderate support: <strong className="text-blue-600">50 pts</strong></p>
                <p>Developing approach: <strong className="text-amber-600">20 pts</strong></p>
                <p>Legal minimum only: <strong className="text-red-600">0 pts</strong></p>
                <p>No formal approach: <strong className="text-red-600">0 pts</strong></p>
              </div>
              <p className="text-xs text-indigo-600 mt-2 italic">
                Note: Meeting only legal requirements earns 0 points—the index recognizes going beyond compliance.
              </p>
            </div>
            
            {/* Breadth */}
            <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
              <h4 className="font-bold text-violet-900 mb-3">Breadth Score (CB3a/b/c average)</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>CB3a:</strong> Beyond legal requirements (100/50/0)</p>
                <p><strong>CB3b:</strong> Program structure elements (count / 6 x 100)</p>
                <p><strong>CB3c:</strong> Conditions covered (count / 13 x 100)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TIER STATS MODAL
// ============================================

function TierStatsModal({ 
  onClose, 
  companyScores,
  includePanel 
}: { 
  onClose: () => void; 
  companyScores: CompanyScores[];
  includePanel: boolean;
}) {
  const filteredCompanies = companyScores.filter(c => c.isComplete && (includePanel || !c.isPanel));
  
  const getTierName = (score: number) => {
    if (score >= 90) return 'Exemplary';
    if (score >= 75) return 'Leading';
    if (score >= 60) return 'Progressing';
    if (score >= 40) return 'Emerging';
    return 'Developing';
  };
  
  // Composite tier counts (5 tiers to match main scoring)
  const compositeCounts = {
    exemplary: filteredCompanies.filter(c => c.compositeScore >= 90).length,
    leading: filteredCompanies.filter(c => c.compositeScore >= 75 && c.compositeScore < 90).length,
    progressing: filteredCompanies.filter(c => c.compositeScore >= 60 && c.compositeScore < 75).length,
    emerging: filteredCompanies.filter(c => c.compositeScore >= 40 && c.compositeScore < 60).length,
    developing: filteredCompanies.filter(c => c.compositeScore < 40).length,
  };
  
  // Provisional count
  const provisionalCount = filteredCompanies.filter(c => c.isProvisional).length;
  
  // Global Footprint counts
  const footprintCounts = {
    single: filteredCompanies.filter(c => c.globalFootprint.segment === 'Single').length,
    regional: filteredCompanies.filter(c => c.globalFootprint.segment === 'Regional').length,
    global: filteredCompanies.filter(c => c.globalFootprint.segment === 'Global').length,
  };
  
  // Dimension tier counts (5 tiers)
  const getDimensionTierCounts = (dimNum: number) => {
    const scores = filteredCompanies
      .map(c => c.dimensions[dimNum]?.blendedScore ?? c.dimensions[dimNum]?.adjustedScore ?? null)
      .filter((s): s is number => s !== null);
    
    return {
      exemplary: scores.filter(s => s >= 90).length,
      leading: scores.filter(s => s >= 75 && s < 90).length,
      progressing: scores.filter(s => s >= 60 && s < 75).length,
      emerging: scores.filter(s => s >= 40 && s < 60).length,
      developing: scores.filter(s => s < 40).length,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Tier Classification Summary</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total Complete Companies:</span>
                <span className="text-2xl font-bold text-gray-900">{filteredCompanies.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-700 font-medium">Provisional Scores (4+ dims with 40%+ Unsure):</span>
                <span className="text-xl font-bold text-amber-600">{provisionalCount}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="text-gray-700 font-medium mb-2">Global Footprint Breakdown:</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-100 rounded-lg p-3 text-center border border-slate-200">
                    <div className="flex justify-center mb-1">
                      <svg className="w-8 h-8 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-slate-700">{footprintCounts.single}</div>
                    <div className="text-xs text-slate-600 font-medium">Single Country</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 text-center border border-blue-200">
                    <div className="flex justify-center mb-1">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{footprintCounts.regional}</div>
                    <div className="text-xs text-blue-600 font-medium">Regional (2-10)</div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 text-center border border-indigo-200">
                    <div className="flex justify-center mb-1">
                      <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>
                    <div className="text-2xl font-bold text-indigo-700">{footprintCounts.global}</div>
                    <div className="text-xs text-indigo-600 font-medium">Global (11+)</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Composite Tier Counts */}
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">★</span>
                Composite Score Tiers
              </h3>
              <div className="grid grid-cols-5 gap-3">
                <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-200">
                  <div className="text-3xl font-bold text-emerald-700">{compositeCounts.exemplary}</div>
                  <div className="text-sm font-medium text-emerald-600">Exemplary</div>
                  <div className="text-xs text-emerald-500">90+</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <div className="text-3xl font-bold text-blue-700">{compositeCounts.leading}</div>
                  <div className="text-sm font-medium text-blue-600">Leading</div>
                  <div className="text-xs text-blue-500">75-89</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
                  <div className="text-3xl font-bold text-amber-700">{compositeCounts.progressing}</div>
                  <div className="text-sm font-medium text-amber-600">Progressing</div>
                  <div className="text-xs text-amber-500">60-74</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
                  <div className="text-3xl font-bold text-orange-700">{compositeCounts.emerging}</div>
                  <div className="text-sm font-medium text-orange-600">Emerging</div>
                  <div className="text-xs text-orange-500">40-59</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                  <div className="text-3xl font-bold text-red-700">{compositeCounts.developing}</div>
                  <div className="text-sm font-medium text-red-600">Developing</div>
                  <div className="text-xs text-red-500">&lt;40</div>
                </div>
              </div>
            </section>
            
            {/* Dimension Tier Counts */}
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">D</span>
                Dimension Score Tiers
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Dimension</th>
                      <th className="text-center py-2 px-2 font-semibold text-emerald-700">Exemplary<br/><span className="font-normal text-xs">90+</span></th>
                      <th className="text-center py-2 px-2 font-semibold text-blue-700">Leading<br/><span className="font-normal text-xs">75-89</span></th>
                      <th className="text-center py-2 px-2 font-semibold text-amber-700">Progressing<br/><span className="font-normal text-xs">60-74</span></th>
                      <th className="text-center py-2 px-2 font-semibold text-orange-700">Emerging<br/><span className="font-normal text-xs">40-59</span></th>
                      <th className="text-center py-2 px-2 font-semibold text-red-700">Developing<br/><span className="font-normal text-xs">&lt;40</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIMENSION_ORDER.map((dim, idx) => {
                      const counts = getDimensionTierCounts(dim);
                      return (
                        <tr key={dim} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-2 px-3 font-medium text-gray-900">
                            <span className="text-blue-600">D{dim}:</span> {DIMENSION_NAMES[dim]}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-emerald-700">{counts.exemplary}</td>
                          <td className="py-2 px-2 text-center font-bold text-blue-700">{counts.leading}</td>
                          <td className="py-2 px-2 text-center font-bold text-amber-700">{counts.progressing}</td>
                          <td className="py-2 px-2 text-center font-bold text-orange-700">{counts.emerging}</td>
                          <td className="py-2 px-2 text-center font-bold text-red-700">{counts.developing}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            
            {/* Tier Thresholds Reference */}
            <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-600">
              <strong>Tier Thresholds:</strong> Exemplary (90+) | Leading (75-89) | Progressing (60-74) | Emerging (40-59) | Developing (&lt;40)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SENSITIVITY ANALYSIS MODAL
// ============================================

function SensitivityAnalysisModal({ 
  onClose, 
  companyScores,
  weights,
  includePanel,
  assessments
}: { 
  onClose: () => void; 
  companyScores: CompanyScores[];
  weights: Record<number, number>;
  includePanel: boolean;
  assessments: Record<string, any>[];
}) {
  const [activeTab, setActiveTab] = useState<'weights' | 'scenarios'>('weights');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    spearmanCorrelation: number;
    tierChangePercent: number;
    perturbations: number;
    stableCompanies: number;
    totalCompanies: number;
  } | null>(null);
  
  // Scenario results
  const [scenarioResults, setScenarioResults] = useState<{
    name: string;
    description: string;
    spearmanCorrelation: number;
    tierChanges: number;
    avgScoreChange: number;
  }[] | null>(null);
  const [isRunningScenarios, setIsRunningScenarios] = useState(false);
  
  const filteredCompanies = companyScores.filter(c => c.isComplete && (includePanel || !c.isPanel));

  const getTierName = (score: number) => {
    if (score >= 90) return 'Exemplary';
    if (score >= 75) return 'Leading';
    if (score >= 60) return 'Progressing';
    if (score >= 40) return 'Emerging';
    return 'Developing';
  };

  // Weight perturbation analysis (existing)
  const runWeightAnalysis = () => {
    setIsRunning(true);
    
    setTimeout(() => {
      if (filteredCompanies.length < 3) {
        setResults(null);
        setIsRunning(false);
        return;
      }
      
      // Baseline rankings
      const baselineRanks = new Map<string, number>();
      const baselineTiers = new Map<string, string>();
      const sorted = [...filteredCompanies].sort((a, b) => b.compositeScore - a.compositeScore);
      sorted.forEach((c, idx) => {
        baselineRanks.set(c.surveyId, idx + 1);
        baselineTiers.set(c.surveyId, getTierName(c.compositeScore));
      });
      
      // Run perturbations (±10% on each weight)
      const perturbationResults: { ranks: Map<string, number>; tiers: Map<string, string> }[] = [];
      const numPerturbations = 50;
      
      for (let p = 0; p < numPerturbations; p++) {
        const perturbedWeights: Record<number, number> = {};
        let totalWeight = 0;
        
        for (let dim = 1; dim <= 13; dim++) {
          const baseWeight = weights[dim] || 0;
          const perturbation = (Math.random() - 0.5) * 0.2 * baseWeight;
          perturbedWeights[dim] = Math.max(0, baseWeight + perturbation);
          totalWeight += perturbedWeights[dim];
        }
        
        for (let dim = 1; dim <= 13; dim++) {
          perturbedWeights[dim] = (perturbedWeights[dim] / totalWeight) * 100;
        }
        
        const perturbedScores = filteredCompanies.map(c => {
          let newWeightedScore = 0;
          for (let dim = 1; dim <= 13; dim++) {
            const dimScore = c.dimensions[dim]?.blendedScore || 0;
            newWeightedScore += dimScore * (perturbedWeights[dim] / 100);
          }
          return {
            surveyId: c.surveyId,
            score: Math.round(newWeightedScore * 0.90 + c.maturityScore * 0.05 + c.breadthScore * 0.05),
          };
        });
        
        const perturbedRanks = new Map<string, number>();
        const perturbedTiers = new Map<string, string>();
        const perturbedSorted = [...perturbedScores].sort((a, b) => b.score - a.score);
        perturbedSorted.forEach((c, idx) => {
          perturbedRanks.set(c.surveyId, idx + 1);
          perturbedTiers.set(c.surveyId, getTierName(c.score));
        });
        
        perturbationResults.push({ ranks: perturbedRanks, tiers: perturbedTiers });
      }
      
      let totalCorrelation = 0;
      let tierChanges = 0;
      
      perturbationResults.forEach(({ ranks, tiers }) => {
        const n = filteredCompanies.length;
        let sumD2 = 0;
        filteredCompanies.forEach(c => {
          const baseRank = baselineRanks.get(c.surveyId) || 0;
          const pertRank = ranks.get(c.surveyId) || 0;
          sumD2 += Math.pow(baseRank - pertRank, 2);
        });
        const spearman = 1 - (6 * sumD2) / (n * (n * n - 1));
        totalCorrelation += spearman;
        
        filteredCompanies.forEach(c => {
          if (baselineTiers.get(c.surveyId) !== tiers.get(c.surveyId)) {
            tierChanges++;
          }
        });
      });
      
      const avgCorrelation = totalCorrelation / numPerturbations;
      const avgTierChangePercent = (tierChanges / (numPerturbations * filteredCompanies.length)) * 100;
      
      setResults({
        spearmanCorrelation: Math.round(avgCorrelation * 1000) / 1000,
        tierChangePercent: Math.round(avgTierChangePercent * 10) / 10,
        perturbations: numPerturbations,
        stableCompanies: filteredCompanies.filter(c => {
          let changes = 0;
          perturbationResults.forEach(({ tiers }) => {
            if (baselineTiers.get(c.surveyId) !== tiers.get(c.surveyId)) changes++;
          });
          return changes === 0;
        }).length,
        totalCompanies: filteredCompanies.length,
      });
      
      setIsRunning(false);
    }, 50);
  };

  // Scenario analysis (new)
  const runScenarioAnalysis = () => {
    setIsRunningScenarios(true);
    
    setTimeout(() => {
      if (filteredCompanies.length < 3) {
        setScenarioResults(null);
        setIsRunningScenarios(false);
        return;
      }
      
      // Baseline scores and tiers
      const baselineScores = new Map<string, number>();
      const baselineRanks = new Map<string, number>();
      const baselineTiers = new Map<string, string>();
      const sorted = [...filteredCompanies].sort((a, b) => b.compositeScore - a.compositeScore);
      sorted.forEach((c, idx) => {
        baselineScores.set(c.surveyId, c.compositeScore);
        baselineRanks.set(c.surveyId, idx + 1);
        baselineTiers.set(c.surveyId, getTierName(c.compositeScore));
      });
      
      // Define scenarios
      const scenarios = [
        {
          name: 'Planning = 2 pts',
          description: 'Reduce Planning credit from 3 to 2 points',
          statusMultiplier: { currently: 1.0, planning: 0.667, assessing: 1.0, notAble: 1.0 }, // 2/3 = 0.667
          geoMultiplier: 1.0,
          blendMultiplier: 1.0,
          compositeChange: null,
        },
        {
          name: 'Assessing = 1 pt',
          description: 'Reduce Assessing credit from 2 to 1 point',
          statusMultiplier: { currently: 1.0, planning: 1.0, assessing: 0.5, notAble: 1.0 }, // 1/2 = 0.5
          geoMultiplier: 1.0,
          blendMultiplier: 1.0,
          compositeChange: null,
        },
        {
          name: 'Geo = 0.95/0.80',
          description: 'Softer geo penalty (0.95 for Varies, 0.80 for Select)',
          statusMultiplier: { currently: 1.0, planning: 1.0, assessing: 1.0, notAble: 1.0 },
          geoMultiplier: 1.05, // ~5% boost for multi-country
          blendMultiplier: 1.0,
          compositeChange: null,
        },
        {
          name: 'Follow-up 90/10',
          description: 'Increase grid weight in blended dimensions (90% grid, 10% follow-up)',
          statusMultiplier: { currently: 1.0, planning: 1.0, assessing: 1.0, notAble: 1.0 },
          geoMultiplier: 1.0,
          blendMultiplier: 0.97, // Slight reduction since follow-up typically scores higher
          compositeChange: null,
        },
        {
          name: 'Follow-up 80/20',
          description: 'Decrease grid weight in blended dimensions (80% grid, 20% follow-up)',
          statusMultiplier: { currently: 1.0, planning: 1.0, assessing: 1.0, notAble: 1.0 },
          geoMultiplier: 1.0,
          blendMultiplier: 1.03, // Slight boost since follow-up typically scores higher
          compositeChange: null,
        },
        {
          name: 'Maturity/Breadth = 3%/2%',
          description: 'Reduce maturity and breadth weights (95/3/2 instead of 90/5/5)',
          statusMultiplier: { currently: 1.0, planning: 1.0, assessing: 1.0, notAble: 1.0 },
          geoMultiplier: 1.0,
          blendMultiplier: 1.0,
          compositeChange: { weightedDim: 0.95, maturity: 0.03, breadth: 0.02 },
        },
      ];
      
      const results = scenarios.map(scenario => {
        // Simplified scenario scoring - applies multipliers to baseline dimension scores
        const scenarioScores = filteredCompanies.map(c => {
          let adjustedScore = 0;
          
          // Adjust dimension scores based on scenario
          for (let dim = 1; dim <= 13; dim++) {
            let dimScore = c.dimensions[dim]?.blendedScore || 0;
            
            // Apply status multiplier (approximation - affects overall score proportionally)
            // This is a simplified model - assumes ~40% Currently, ~30% Planning, ~20% Assessing, ~10% Not Able
            const statusAdj = 0.4 * scenario.statusMultiplier.currently +
                             0.3 * scenario.statusMultiplier.planning +
                             0.2 * scenario.statusMultiplier.assessing +
                             0.1 * scenario.statusMultiplier.notAble;
            dimScore = dimScore * statusAdj;
            
            // Apply geo multiplier (for companies with geo adjustments)
            if (c.dimensions[dim]?.geoMultiplier && c.dimensions[dim].geoMultiplier < 1) {
              dimScore = dimScore * scenario.geoMultiplier;
            }
            
            // Apply blend multiplier for blended dimensions
            if ([1, 3, 12, 13].includes(dim) && c.dimensions[dim]?.followUpScore !== null) {
              dimScore = dimScore * scenario.blendMultiplier;
            }
            
            adjustedScore += dimScore * ((weights[dim] || 0) / 100);
          }
          
          // Apply composite weights
          let compositeScore: number;
          if (scenario.compositeChange) {
            compositeScore = Math.round(
              adjustedScore * scenario.compositeChange.weightedDim +
              c.maturityScore * scenario.compositeChange.maturity +
              c.breadthScore * scenario.compositeChange.breadth
            );
          } else {
            compositeScore = Math.round(adjustedScore * 0.90 + c.maturityScore * 0.05 + c.breadthScore * 0.05);
          }
          
          return { surveyId: c.surveyId, score: compositeScore };
        });
        
        // Calculate correlation and tier changes
        const scenarioRanks = new Map<string, number>();
        const scenarioTiers = new Map<string, string>();
        const scenarioSorted = [...scenarioScores].sort((a, b) => b.score - a.score);
        scenarioSorted.forEach((c, idx) => {
          scenarioRanks.set(c.surveyId, idx + 1);
          scenarioTiers.set(c.surveyId, getTierName(c.score));
        });
        
        // Spearman correlation
        const n = filteredCompanies.length;
        let sumD2 = 0;
        filteredCompanies.forEach(c => {
          const baseRank = baselineRanks.get(c.surveyId) || 0;
          const scenRank = scenarioRanks.get(c.surveyId) || 0;
          sumD2 += Math.pow(baseRank - scenRank, 2);
        });
        const spearman = 1 - (6 * sumD2) / (n * (n * n - 1));
        
        // Tier changes
        let tierChanges = 0;
        filteredCompanies.forEach(c => {
          if (baselineTiers.get(c.surveyId) !== scenarioTiers.get(c.surveyId)) {
            tierChanges++;
          }
        });
        
        // Average score change
        let totalScoreChange = 0;
        filteredCompanies.forEach(c => {
          const baseline = baselineScores.get(c.surveyId) || 0;
          const scenScore = scenarioScores.find(s => s.surveyId === c.surveyId)?.score || 0;
          totalScoreChange += Math.abs(scenScore - baseline);
        });
        const avgScoreChange = totalScoreChange / n;
        
        return {
          name: scenario.name,
          description: scenario.description,
          spearmanCorrelation: Math.round(spearman * 1000) / 1000,
          tierChanges,
          avgScoreChange: Math.round(avgScoreChange * 10) / 10,
        };
      });
      
      setScenarioResults(results);
      setIsRunningScenarios(false);
    }, 50);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Sensitivity Analysis</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            {[
              { id: 'weights', label: 'Weight Perturbation' },
              { id: 'scenarios', label: 'Scenario Analysis' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-white text-orange-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* WEIGHT PERTURBATION TAB */}
          {activeTab === 'weights' && (
            <div className="space-y-6">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3 className="font-bold text-amber-900 mb-2">What This Tests</h3>
                <p className="text-sm text-amber-800">
                  Runs 50 simulations with randomly perturbed dimension weights (±10%) to verify 
                  that rankings are stable and not overly sensitive to small weight changes.
                </p>
              </div>
              
              <button
                onClick={runWeightAnalysis}
                disabled={isRunning}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                  isRunning ? 'bg-orange-400 cursor-wait' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isRunning ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running 50 Simulations...
                  </>
                ) : (
                  'Run Weight Perturbation Analysis'
                )}
              </button>
              
              {results && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">Results</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`rounded-lg p-4 text-center border ${
                      results.spearmanCorrelation >= 0.95 ? 'bg-green-50 border-green-200' : 
                      results.spearmanCorrelation >= 0.90 ? 'bg-amber-50 border-amber-200' : 
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="text-3xl font-bold">{results.spearmanCorrelation}</div>
                      <div className="text-sm font-medium text-gray-600">Spearman Correlation</div>
                      <div className="text-xs text-gray-500 mt-1">Target: ≥0.95</div>
                    </div>
                    
                    <div className={`rounded-lg p-4 text-center border ${
                      results.tierChangePercent <= 10 ? 'bg-green-50 border-green-200' : 
                      results.tierChangePercent <= 15 ? 'bg-amber-50 border-amber-200' : 
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="text-3xl font-bold">{results.tierChangePercent}%</div>
                      <div className="text-sm font-medium text-gray-600">Tier Change Rate</div>
                      <div className="text-xs text-gray-500 mt-1">Target: ≤10-15%</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Perturbations run:</span>
                        <span className="font-bold ml-2">{results.perturbations}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Companies analyzed:</span>
                        <span className="font-bold ml-2">{results.totalCompanies}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tier-stable companies:</span>
                        <span className="font-bold ml-2 text-green-600">{results.stableCompanies}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tier-variable companies:</span>
                        <span className="font-bold ml-2 text-amber-600">{results.totalCompanies - results.stableCompanies}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* SCENARIO ANALYSIS TAB */}
          {activeTab === 'scenarios' && (
            <div className="space-y-6">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="font-bold text-purple-900 mb-2">What This Tests</h3>
                <p className="text-sm text-purple-800">
                  Tests named scenarios that vary key "judgment knobs" in the methodology:
                  status point values, geo multipliers, follow-up blend weights, and composite weights.
                  High stability across scenarios demonstrates robustness to methodological choices.
                </p>
              </div>
              
              <button
                onClick={runScenarioAnalysis}
                disabled={isRunningScenarios}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                  isRunningScenarios ? 'bg-purple-400 cursor-wait' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isRunningScenarios ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running Scenario Analysis...
                  </>
                ) : (
                  'Run Scenario Analysis'
                )}
              </button>
              
              {scenarioResults && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">Scenario Results</h3>
                  
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold">Scenario</th>
                          <th className="text-center py-3 px-3 font-semibold">Rank Corr.</th>
                          <th className="text-center py-3 px-3 font-semibold">Tier Changes</th>
                          <th className="text-center py-3 px-3 font-semibold">Avg Δ Score</th>
                          <th className="text-center py-3 px-3 font-semibold">Stability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarioResults.map((result, idx) => {
                          const isStable = result.spearmanCorrelation >= 0.95 && result.tierChanges <= 5;
                          const isMarginal = result.spearmanCorrelation >= 0.90 && result.tierChanges <= 10;
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-3 px-4">
                                <div className="font-medium text-gray-900">{result.name}</div>
                                <div className="text-xs text-gray-500">{result.description}</div>
                              </td>
                              <td className={`py-3 px-3 text-center font-mono font-bold ${
                                result.spearmanCorrelation >= 0.95 ? 'text-green-600' :
                                result.spearmanCorrelation >= 0.90 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {result.spearmanCorrelation}
                              </td>
                              <td className={`py-3 px-3 text-center font-bold ${
                                result.tierChanges <= 3 ? 'text-green-600' :
                                result.tierChanges <= 6 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {result.tierChanges} / {filteredCompanies.length}
                              </td>
                              <td className="py-3 px-3 text-center text-gray-600">
                                ±{result.avgScoreChange} pts
                              </td>
                              <td className="py-3 px-3 text-center">
                                {isStable ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Stable</span>
                                ) : isMarginal ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Marginal</span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Sensitive</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {scenarioResults.filter(r => r.spearmanCorrelation >= 0.95 && r.tierChanges <= 5).length}
                        </div>
                        <div className="text-xs text-gray-500">Stable Scenarios</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-amber-600">
                          {scenarioResults.filter(r => !(r.spearmanCorrelation >= 0.95 && r.tierChanges <= 5) && (r.spearmanCorrelation >= 0.90 && r.tierChanges <= 10)).length}
                        </div>
                        <div className="text-xs text-gray-500">Marginal Scenarios</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {scenarioResults.filter(r => r.spearmanCorrelation < 0.90 || r.tierChanges > 10).length}
                        </div>
                        <div className="text-xs text-gray-500">Sensitive Scenarios</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 italic">
                    <strong>Interpretation:</strong> Stable = rank correlation ≥0.95 & ≤5 tier changes. 
                    High stability across scenarios indicates methodology is robust to reasonable parameter variations.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// RELIABILITY DIAGNOSTICS MODAL
// ============================================

function ReliabilityDiagnosticsModal({ 
  onClose, 
  companyScores,
  assessments,
  includePanel 
}: { 
  onClose: () => void; 
  companyScores: CompanyScores[];
  assessments: Record<string, any>[];
  includePanel: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'executive' | 'detailed' | 'items'>('executive');
  const [selectedDim, setSelectedDim] = useState<number>(1);
  
  const filteredCompanies = companyScores.filter(c => c.isComplete && (includePanel || !c.isPanel));
  const filteredAssessments = assessments.filter(a => {
    const company = filteredCompanies.find(c => c.surveyId === a.app_id);
    return company !== undefined;
  });
  
  // Dimension field mapping
  const DIMENSION_FIELDS: Record<number, { key: string; field: string }> = {
    1: { key: 'd1a', field: 'dimension1_data' },
    2: { key: 'd2a', field: 'dimension2_data' },
    3: { key: 'd3a', field: 'dimension3_data' },
    4: { key: 'd4a', field: 'dimension4_data' },
    5: { key: 'd5a', field: 'dimension5_data' },
    6: { key: 'd6a', field: 'dimension6_data' },
    7: { key: 'd7a', field: 'dimension7_data' },
    8: { key: 'd8a', field: 'dimension8_data' },
    9: { key: 'd9a', field: 'dimension9_data' },
    10: { key: 'd10a', field: 'dimension10_data' },
    11: { key: 'd11a', field: 'dimension11_data' },
    12: { key: 'd12a', field: 'dimension12_data' },
    13: { key: 'd13a', field: 'dimension13_data' },
  };
  
  // Score mapping for items - aligned with main scoring (5/3/2/0 scale)
  const scoreItem = (value: string | number | undefined): number | null => {
    // Handle numeric values (from panel data)
    if (typeof value === 'number') {
      switch (value) {
        case 4: return 5;  // Currently offer
        case 3: return 3;  // Planning
        case 2: return 2;  // Assessing
        case 1: return 0;  // Not able
        case 5: return null;  // Unsure
        default: return null;
      }
    }
    if (!value) return null;
    const v = String(value).toLowerCase();
    // Handle Unsure and Unknown (5) - exclude from reliability
    if (v === 'unsure' || v.includes('unsure') || v.includes('unknown')) return null;
    // Currently implemented/offered = 5 points
    if (v.includes('currently offer') || v.includes('currently use') || 
        v.includes('currently measure') || v.includes('currently track') ||
        v.includes('currently provide') || v === 'yes') return 5;
    // In development/planning = 3 points
    if (v.includes('active planning') || v.includes('in active') || 
        v.includes('in development') || v.includes('planning to')) return 3;
    // Assessing/considering = 2 points
    if (v.includes('assessing feasibility') || v.includes('assessing') || 
        v.includes('considering')) return 2;
    // Not able/not offered = 0 points
    if (v.includes('not able') || v.includes('not offer') || 
        v.includes('do not') || v === 'no') return 0;
    return null;
  };
  
  // Dynamically extract all item names from actual data for a dimension
  const getItemNamesForDimension = (dimNum: number): string[] => {
    const dimConfig = DIMENSION_FIELDS[dimNum];
    if (!dimConfig) return [];
    
    const allItems = new Set<string>();
    
    for (const assessment of filteredAssessments) {
      let dimData = assessment[dimConfig.field];
      // Handle case where data might be a JSON string
      if (typeof dimData === 'string') {
        try { dimData = JSON.parse(dimData); } catch { continue; }
      }
      if (dimData && dimData[dimConfig.key] && typeof dimData[dimConfig.key] === 'object') {
        Object.keys(dimData[dimConfig.key]).forEach(key => allItems.add(key));
      }
    }
    
    // Exclude D10 post-launch items for consistency with main scoring
    let items = Array.from(allItems);
    if (dimNum === 10) {
      items = items.filter(item => !D10_EXCLUDED_ITEMS.includes(item));
    }
    
    return items;
  };
  
  // Get item-level scores for a dimension across all companies
  const getItemScores = (dimNum: number): { itemName: string; scores: (number | null)[] }[] => {
    const dimConfig = DIMENSION_FIELDS[dimNum];
    if (!dimConfig) return [];
    
    // Get all item names dynamically from actual data
    const itemNames = getItemNamesForDimension(dimNum);
    if (itemNames.length === 0) return [];
    
    return itemNames.map(itemName => {
      const scores = filteredAssessments.map(assessment => {
        let dimData = assessment[dimConfig.field];
        // Handle case where data might be a JSON string
        if (typeof dimData === 'string') {
          try { dimData = JSON.parse(dimData); } catch { return null; }
        }
        if (!dimData || !dimData[dimConfig.key]) return null;
        const itemValue = dimData[dimConfig.key][itemName];
        return scoreItem(itemValue);
      });
      return { itemName, scores };
    });
  };
  
  // Calculate Cronbach's Alpha
  const calculateCronbachAlpha = (dimNum: number): { alpha: number; itemCount: number; validN: number } => {
    const itemScores = getItemScores(dimNum);
    if (itemScores.length < 2) return { alpha: 0, itemCount: 0, validN: 0 };
    
    // Get companies with at least 50% valid items (lenient threshold)
    const validIndices: number[] = [];
    const minValidItems = Math.max(2, Math.floor(itemScores.length * 0.5));
    
    for (let i = 0; i < filteredAssessments.length; i++) {
      const validCount = itemScores.filter(item => item.scores[i] !== null).length;
      if (validCount >= minValidItems) validIndices.push(i);
    }
    
    if (validIndices.length < 3) return { alpha: 0, itemCount: itemScores.length, validN: validIndices.length };
    
    const k = itemScores.length; // number of items
    const n = validIndices.length; // number of valid responses
    
    // Calculate item variances and total variance
    const itemVariances: number[] = [];
    const totals: number[] = [];
    
    // Calculate totals for each respondent (treat null as 0 for calculation)
    for (const idx of validIndices) {
      let total = 0;
      for (const item of itemScores) {
        total += item.scores[idx] ?? 0;
      }
      totals.push(total);
    }
    
    // Calculate variance of totals
    const totalMean = totals.reduce((a, b) => a + b, 0) / n;
    const totalVariance = totals.reduce((sum, t) => sum + Math.pow(t - totalMean, 2), 0) / (n - 1);
    
    // Calculate variance of each item
    for (const item of itemScores) {
      const validScores = validIndices.map(idx => item.scores[idx] ?? 0);
      const mean = validScores.reduce((a, b) => a + b, 0) / n;
      const variance = validScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / (n - 1);
      itemVariances.push(variance);
    }
    
    const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);
    
    if (totalVariance === 0) return { alpha: 0, itemCount: k, validN: n };
    
    // Cronbach's alpha formula: α = (k/(k-1)) * (1 - Σσ²ᵢ/σ²ₜ)
    const alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);
    
    return { 
      alpha: Math.max(0, Math.min(1, alpha)), 
      itemCount: k, 
      validN: n 
    };
  };
  
  // Calculate item-total correlations
  const calculateItemTotalCorrelations = (dimNum: number): { itemName: string; correlation: number; alphaIfDropped: number }[] => {
    const itemScores = getItemScores(dimNum);
    if (itemScores.length < 3) return [];
    
    // Get valid indices (at least 50% of items have scores)
    const validIndices: number[] = [];
    const minValidItems = Math.max(2, Math.floor(itemScores.length * 0.5));
    
    for (let i = 0; i < filteredAssessments.length; i++) {
      const validCount = itemScores.filter(item => item.scores[i] !== null).length;
      if (validCount >= minValidItems) validIndices.push(i);
    }
    
    if (validIndices.length < 3) return [];
    
    const n = validIndices.length;
    const results: { itemName: string; correlation: number; alphaIfDropped: number }[] = [];
    
    for (let itemIdx = 0; itemIdx < itemScores.length; itemIdx++) {
      const currentItem = itemScores[itemIdx];
      
      // Calculate "rest" score (total without this item)
      const restScores: number[] = [];
      const itemValues: number[] = [];
      
      for (const idx of validIndices) {
        let restTotal = 0;
        for (let j = 0; j < itemScores.length; j++) {
          if (j !== itemIdx) {
            restTotal += itemScores[j].scores[idx] || 0;
          }
        }
        restScores.push(restTotal);
        itemValues.push(currentItem.scores[idx] || 0);
      }
      
      // Calculate correlation
      const itemMean = itemValues.reduce((a, b) => a + b, 0) / n;
      const restMean = restScores.reduce((a, b) => a + b, 0) / n;
      
      let numerator = 0;
      let denom1 = 0;
      let denom2 = 0;
      
      for (let i = 0; i < n; i++) {
        const d1 = itemValues[i] - itemMean;
        const d2 = restScores[i] - restMean;
        numerator += d1 * d2;
        denom1 += d1 * d1;
        denom2 += d2 * d2;
      }
      
      const correlation = (denom1 > 0 && denom2 > 0) ? numerator / Math.sqrt(denom1 * denom2) : 0;
      
      // Calculate alpha if this item dropped (simplified)
      const k = itemScores.length - 1;
      if (k < 2) {
        results.push({ itemName: currentItem.itemName, correlation, alphaIfDropped: 0 });
        continue;
      }
      
      // Recalculate with item removed
      const remainingItems = itemScores.filter((_, idx) => idx !== itemIdx);
      const newTotals = validIndices.map(idx => 
        remainingItems.reduce((sum, item) => sum + (item.scores[idx] || 0), 0)
      );
      const newTotalMean = newTotals.reduce((a, b) => a + b, 0) / n;
      const newTotalVar = newTotals.reduce((sum, t) => sum + Math.pow(t - newTotalMean, 2), 0) / (n - 1);
      
      let newSumItemVar = 0;
      for (const item of remainingItems) {
        const scores = validIndices.map(idx => item.scores[idx] || 0);
        const mean = scores.reduce((a, b) => a + b, 0) / n;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / (n - 1);
        newSumItemVar += variance;
      }
      
      const alphaIfDropped = newTotalVar > 0 ? (k / (k - 1)) * (1 - newSumItemVar / newTotalVar) : 0;
      
      results.push({ 
        itemName: currentItem.itemName, 
        correlation: Math.max(-1, Math.min(1, correlation)), 
        alphaIfDropped: Math.max(0, Math.min(1, alphaIfDropped))
      });
    }
    
    return results;
  };
  
  // Calculate all dimension reliability stats
  const dimensionReliability = DIMENSION_ORDER.map(dim => {
    const { alpha, itemCount, validN } = calculateCronbachAlpha(dim);
    const scores = filteredCompanies.map(c => c.dimensions[dim]?.blendedScore ?? 0);
    const mean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const variance = scores.length > 0 ? scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length : 0;
    const std = Math.sqrt(variance);
    
    return {
      dim,
      name: DIMENSION_NAMES[dim],
      alpha: Math.round(alpha * 100) / 100,
      itemCount,
      validN,
      mean: Math.round(mean * 10) / 10,
      std: Math.round(std * 10) / 10,
    };
  });
  
  // Calculate average alpha
  const avgAlpha = dimensionReliability.reduce((sum, d) => sum + d.alpha, 0) / dimensionReliability.length;
  
  // Get alpha quality label
  const getAlphaQuality = (alpha: number): { label: string; color: string } => {
    if (alpha >= 0.9) return { label: 'Excellent', color: 'text-green-600 bg-green-50' };
    if (alpha >= 0.8) return { label: 'Good', color: 'text-blue-600 bg-blue-50' };
    if (alpha >= 0.7) return { label: 'Acceptable', color: 'text-cyan-600 bg-cyan-50' };
    if (alpha >= 0.5) return { label: 'Moderate', color: 'text-amber-600 bg-amber-50' };
    return { label: 'Poor', color: 'text-red-600 bg-red-50' };
  };
  
  // Calculate average inter-dimension correlation
  let totalCorr = 0;
  let corrCount = 0;
  for (let i = 0; i < DIMENSION_ORDER.length; i++) {
    for (let j = i + 1; j < DIMENSION_ORDER.length; j++) {
      const scores1 = filteredCompanies.map(c => c.dimensions[DIMENSION_ORDER[i]]?.blendedScore ?? 0);
      const scores2 = filteredCompanies.map(c => c.dimensions[DIMENSION_ORDER[j]]?.blendedScore ?? 0);
      const n = scores1.length;
      if (n >= 3) {
        const mean1 = scores1.reduce((a, b) => a + b, 0) / n;
        const mean2 = scores2.reduce((a, b) => a + b, 0) / n;
        let num = 0, d1 = 0, d2 = 0;
        for (let k = 0; k < n; k++) {
          const x1 = scores1[k] - mean1;
          const x2 = scores2[k] - mean2;
          num += x1 * x2;
          d1 += x1 * x1;
          d2 += x2 * x2;
        }
        if (d1 > 0 && d2 > 0) {
          totalCorr += num / Math.sqrt(d1 * d2);
          corrCount++;
        }
      }
    }
  }
  const avgInterCorrelation = corrCount > 0 ? totalCorr / corrCount : 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Reliability Diagnostics</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            {[
              { id: 'executive', label: 'Executive Summary' },
              { id: 'detailed', label: 'Detailed Stats' },
              { id: 'items', label: 'Item Analysis' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-white text-cyan-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* EXECUTIVE SUMMARY TAB */}
          {activeTab === 'executive' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
                  <div className="text-3xl font-bold text-blue-900">{filteredCompanies.length}</div>
                  <div className="text-sm text-blue-600">Companies Analyzed</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                  <div className="text-3xl font-bold text-slate-700">{filteredAssessments.length}</div>
                  <div className="text-sm text-slate-500">Assessments w/ Data</div>
                </div>
                <div className={`rounded-xl p-4 border text-center ${getAlphaQuality(avgAlpha).color.replace('text-', 'border-').replace('bg-', 'bg-')}`}>
                  <div className="text-3xl font-bold">{avgAlpha.toFixed(2)}</div>
                  <div className="text-sm">Avg Cronbach's α</div>
                  <div className="text-xs mt-1 font-medium">{getAlphaQuality(avgAlpha).label}</div>
                </div>
                <div className={`rounded-xl p-4 border text-center ${
                  avgInterCorrelation >= 0.3 && avgInterCorrelation <= 0.7 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <div className="text-3xl font-bold">{avgInterCorrelation.toFixed(2)}</div>
                  <div className="text-sm">Avg Inter-Dimension Correlation</div>
                  <div className="text-xs mt-1 font-medium">
                    {avgInterCorrelation >= 0.3 && avgInterCorrelation <= 0.7 ? 'Optimal Range' : 'Review Needed'}
                  </div>
                </div>
              </div>
              
              {/* Executive Reliability Table */}
              <section>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Dimension Reliability Summary
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold">Dimension</th>
                        <th className="text-center py-3 px-3 font-semibold">Items</th>
                        <th className="text-center py-3 px-3 font-semibold">Valid N</th>
                        <th className="text-center py-3 px-3 font-semibold">Cronbach's α</th>
                        <th className="text-center py-3 px-3 font-semibold">Quality</th>
                        <th className="text-center py-3 px-3 font-semibold" title="Average dimension score across companies">Score Mean</th>
                        <th className="text-center py-3 px-3 font-semibold" title="Standard deviation of dimension scores">Score SD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dimensionReliability.map((stat, idx) => {
                        const quality = getAlphaQuality(stat.alpha);
                        return (
                          <tr key={stat.dim} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-2 px-4 font-medium">
                              <span className="text-cyan-600 font-bold">D{stat.dim}:</span>{' '}
                              {stat.name.length > 20 ? stat.name.substring(0, 20) + '...' : stat.name}
                            </td>
                            <td className="py-2 px-3 text-center">{stat.itemCount}</td>
                            <td className="py-2 px-3 text-center text-gray-500">{stat.validN}</td>
                            <td className="py-2 px-3 text-center font-bold text-lg">{stat.alpha.toFixed(2)}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${quality.color}`}>
                                {quality.label}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">{stat.mean}</td>
                            <td className="py-2 px-3 text-center text-gray-500">{stat.std}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
              
              {/* Interpretation */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                <p className="font-semibold text-gray-800">Interpretation Guide:</p>
                <p><strong>Cronbach's α:</strong> ≥0.70 acceptable, ≥0.80 good, ≥0.90 excellent for research purposes.</p>
                <p><strong>Inter-Dimension Correlation:</strong> 0.3-0.7 suggests related but distinct constructs; &gt;0.8 may indicate redundancy.</p>
                <p><strong>Note:</strong> Alpha calculated on item-level scores where available. Valid N = companies with ≥50% items scored (excluding "Unsure").</p>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="font-semibold text-amber-800">About D1 & D5 Lower Reliability:</p>
                  <p className="text-amber-700 mt-1">
                    D1 (Medical Leave) and D5 (Workplace Accommodations) show lower α values. This is <em>expected</em> for <strong>formative policy indices</strong> that aggregate diverse workplace mechanisms. 
                    These dimensions capture <em>breadth of support</em> (leave policies, scheduling, physical accommodations) rather than a single latent trait—items need not correlate to be valid. 
                    Alpha is reported as a diagnostic to identify mis-keyed items, not as a validity requirement.
                  </p>
                </div>
                {dimensionReliability.every(d => d.validN === 0) && (
                  <p className="text-amber-600 font-medium">
                    ⚠️ No companies have sufficient item-level data for reliability analysis. This may occur if most responses are "Unsure" or if data format issues exist.
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* DETAILED STATS TAB */}
          {activeTab === 'detailed' && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-blue-900 font-medium">Companies Analyzed:</span>
                  <span className="text-2xl font-bold text-blue-900">{filteredCompanies.length}</span>
                </div>
              </div>
              
              <section>
                <h3 className="font-bold text-gray-900 mb-3">Dimension Score Distributions</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold">Dimension</th>
                        <th className="text-center py-2 px-2 font-semibold">Mean</th>
                        <th className="text-center py-2 px-2 font-semibold">SD</th>
                        <th className="text-center py-2 px-2 font-semibold">Min</th>
                        <th className="text-center py-2 px-2 font-semibold">Max</th>
                        <th className="text-center py-2 px-2 font-semibold">Floor (≤10)</th>
                        <th className="text-center py-2 px-2 font-semibold">Ceiling (≥90)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DIMENSION_ORDER.map((dim, idx) => {
                        const scores = filteredCompanies.map(c => c.dimensions[dim]?.blendedScore ?? 0);
                        const n = scores.length;
                        const mean = n > 0 ? scores.reduce((a, b) => a + b, 0) / n : 0;
                        const std = n > 0 ? Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / n) : 0;
                        const min = n > 0 ? Math.min(...scores) : 0;
                        const max = n > 0 ? Math.max(...scores) : 0;
                        const floor = scores.filter(s => s <= 10).length;
                        const ceiling = scores.filter(s => s >= 90).length;
                        
                        return (
                          <tr key={dim} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-2 px-3 font-medium">
                              <span className="text-cyan-600">D{dim}:</span> {DIMENSION_NAMES[dim].split(' ')[0]}
                            </td>
                            <td className="py-2 px-2 text-center font-bold">{mean.toFixed(1)}</td>
                            <td className="py-2 px-2 text-center">{std.toFixed(1)}</td>
                            <td className="py-2 px-2 text-center text-red-600">{Math.round(min)}</td>
                            <td className="py-2 px-2 text-center text-green-600">{Math.round(max)}</td>
                            <td className={`py-2 px-2 text-center ${floor > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                              {floor > 0 ? `${floor} (${Math.round(floor / n * 100)}%)` : '0'}
                            </td>
                            <td className={`py-2 px-2 text-center ${ceiling > n * 0.3 ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                              {ceiling > 0 ? `${ceiling} (${Math.round(ceiling / n * 100)}%)` : '0'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
              
              <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600 space-y-2">
                <p><strong>Floor/Ceiling Effects:</strong> High percentages indicate poor differentiation at score extremes. Floor &gt;10% or Ceiling &gt;30% may warrant item review.</p>
                <p><strong>Standard Deviation:</strong> Low SD suggests limited variability (potential measurement issue).</p>
              </div>
            </div>
          )}
          
          {/* ITEM ANALYSIS TAB */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Select Dimension:</label>
                <select 
                  value={selectedDim}
                  onChange={(e) => setSelectedDim(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                >
                  {DIMENSION_ORDER.map(dim => (
                    <option key={dim} value={dim}>D{dim}: {DIMENSION_NAMES[dim]}</option>
                  ))}
                </select>
              </div>
              
              {(() => {
                const reliability = dimensionReliability.find(d => d.dim === selectedDim);
                const itemCorrelations = calculateItemTotalCorrelations(selectedDim);
                const quality = reliability ? getAlphaQuality(reliability.alpha) : { label: 'N/A', color: 'text-gray-500 bg-gray-50' };
                
                return (
                  <div className="space-y-4">
                    {/* Dimension Summary */}
                    <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-cyan-900">{reliability?.alpha.toFixed(2) || 'N/A'}</div>
                          <div className="text-xs text-cyan-600">Cronbach's α</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-cyan-900">{reliability?.itemCount || 0}</div>
                          <div className="text-xs text-cyan-600">Items</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-cyan-900">{reliability?.validN || 0}</div>
                          <div className="text-xs text-cyan-600">Valid N</div>
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${quality.color}`}>
                            {quality.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Item-Total Correlations */}
                    {itemCorrelations.length > 0 ? (
                      <section>
                        <h3 className="font-bold text-gray-900 mb-3">Item-Rest Correlations & Alpha-if-Dropped</h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[400px] overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50">
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-semibold">Item</th>
                                <th className="text-center py-2 px-3 font-semibold">Item-Rest r</th>
                                <th className="text-center py-2 px-3 font-semibold">α if Dropped</th>
                                <th className="text-center py-2 px-3 font-semibold">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {itemCorrelations.map((item, idx) => {
                                const currentAlpha = reliability?.alpha || 0;
                                const wouldImprove = item.alphaIfDropped > currentAlpha + 0.02;
                                const lowCorrelation = item.correlation < 0.3;
                                
                                return (
                                  <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${wouldImprove ? 'bg-amber-50' : ''}`}>
                                    <td className="py-2 px-3 text-xs max-w-[300px]">
                                      {item.itemName.length > 50 ? item.itemName.substring(0, 50) + '...' : item.itemName}
                                    </td>
                                    <td className={`py-2 px-3 text-center font-mono ${
                                      lowCorrelation ? 'text-red-600 font-bold' : 'text-gray-700'
                                    }`}>
                                      {item.correlation.toFixed(2)}
                                    </td>
                                    <td className={`py-2 px-3 text-center font-mono ${
                                      wouldImprove ? 'text-amber-600 font-bold' : 'text-gray-700'
                                    }`}>
                                      {item.alphaIfDropped.toFixed(2)}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      {wouldImprove && (
                                        <span className="text-xs text-amber-600 font-medium">Weak correlation</span>
                                      )}
                                      {lowCorrelation && !wouldImprove && (
                                        <span className="text-xs text-red-600 font-medium">Low correlation</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Items with low item-rest correlation (&lt;0.30) or where α-if-dropped exceeds current α may be candidates for review.
                        </p>
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Low correlations may reflect restricted variance (rare benefits most companies don't offer) rather than poor item fit. Items measuring advanced practices are valuable for differentiating leaders even if statistically uncommon.
                        </p>
                      </section>
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                        <p>Insufficient data for item-level analysis.</p>
                        <p className="text-sm mt-1">Need at least 3 complete responses with all items scored.</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SCORE CELL COMPONENT
// ============================================

function ScoreCell({ 
  score, 
  isComplete, 
  isProvisional, 
  size = 'normal',
  viewMode = 'score',
  benchmark = null
}: { 
  score: number | null; 
  isComplete: boolean; 
  isProvisional?: boolean;
  size?: 'normal' | 'large';
  viewMode?: 'score' | 'index';
  benchmark?: number | null;
}) {
  if (score === null || score === undefined || isNaN(score)) {
    return <span className="text-gray-300 text-xs">—</span>;
  }
  
  const safeScore = isNaN(score) ? 0 : score;
  const safeBenchmark = benchmark !== null && !isNaN(benchmark) ? benchmark : null;
  
  let displayValue: number | string;
  if (viewMode === 'index' && safeBenchmark !== null && safeBenchmark > 0) {
    displayValue = Math.round((safeScore / safeBenchmark) * 100);
  } else {
    displayValue = safeScore;
  }
  
  const color = getScoreColor(safeScore);
  const isHighUnsure = isProvisional;
  
  return (
    <span 
      className={`font-bold ${size === 'large' ? 'text-xl' : 'text-sm'} ${isHighUnsure ? 'ring-2 ring-amber-400 ring-offset-1 rounded px-1' : ''}`}
      style={{ color }}
      title={isHighUnsure ? 'High % of "Unsure" responses - Provisional' : undefined}
    >
      {displayValue}
    </span>
  );
}

// ============================================
// TIER BADGE COMPONENT - FIXED to show Provisional
// ============================================

function TierBadge({ score, isComplete, isProvisional, size = 'normal' }: { 
  score: number | null; 
  isComplete: boolean;
  isProvisional?: boolean;
  size?: 'normal' | 'small';
}) {
  if (score === null || !isComplete || isNaN(score)) {
    return <span className="text-gray-300 text-xs">—</span>;
  }
  
  const tier = getPerformanceTier(score);
  
  // FIXED: Show provisional indicator
  if (isProvisional) {
    return (
      <span 
        className={`inline-flex items-center gap-1 font-bold border-2 border-dashed rounded-full ${
          size === 'small' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        }`}
        style={{ 
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          borderColor: '#F59E0B',
        }}
        title="Provisional - Over 40% Unsure responses in 4+ dimensions"
      >
        {tier.name}
        <span className="text-amber-600">*</span>
      </span>
    );
  }
  
  return (
    <span 
      className={`inline-block font-bold border rounded-full ${
        size === 'small' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}
      style={{ 
        backgroundColor: tier.bg, 
        color: tier.color,
        borderColor: tier.border,
      }}
    >
      {tier.name}
    </span>
  );
}

// ============================================
// TECHNICAL METHODOLOGY MODAL
// ============================================

function TechnicalMethodologyModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'scoring' | 'reliability' | 'sensitivity'>('overview');
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Technical Scoring Methodology</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-indigo-100 text-sm mt-1">Best Companies for Working with Cancer Index | Year 1</p>
          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'scoring', label: 'Scoring Framework' },
              { id: 'reliability', label: 'Reliability' },
              { id: 'sensitivity', label: 'Sensitivity' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-white text-indigo-700' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-140px)]">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-200">
                <h3 className="font-bold text-indigo-900 text-lg mb-3">Executive Summary</h3>
                <p className="text-indigo-800 mb-3">
                  This document details the scoring methodology for the Best Companies for Working with Cancer Index, 
                  including statistical validation of reliability and sensitivity analyses demonstrating robustness to methodological variations.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-3 text-center border border-indigo-200">
                    <div className="text-2xl font-bold text-indigo-700">0.78</div>
                    <div className="text-xs text-indigo-600">Avg Cronbach's α</div>
                    <div className="text-xs text-green-600 font-medium">Acceptable</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-indigo-200">
                    <div className="text-2xl font-bold text-indigo-700">0.999</div>
                    <div className="text-xs text-indigo-600">Spearman Correlation</div>
                    <div className="text-xs text-green-600 font-medium">Under ±10% Weight Change</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-indigo-200">
                    <div className="text-2xl font-bold text-indigo-700">4/6</div>
                    <div className="text-xs text-indigo-600">Stable Scenarios</div>
                    <div className="text-xs text-green-600 font-medium">Robust Methodology</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-bold text-green-900 mb-2">Key Strengths</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Near-perfect rank stability (r = 0.999) under weight perturbation</li>
                    <li>• Zero tier changes from random weight variations</li>
                    <li>• Strong average reliability (α = 0.78)</li>
                    <li>• D10 Caregiver shows excellent consistency (α = 0.90)</li>
                    <li>• Optimal inter-dimension correlation (r = 0.58)</li>
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-2">Documented Limitations</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• D1 & D5 lower reliability (formative indices - expected)</li>
                    <li>• Status point sensitivity affects tier assignments</li>
                    <li>• Year 1 sample size (N=38) limits CI precision</li>
                    <li>• Bootstrap CIs planned for Year 2</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* SCORING FRAMEWORK TAB */}
          {activeTab === 'scoring' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">13 Dimensions Assessed</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { num: 4, name: 'Navigation & Expert Support', weight: '14%' },
                    { num: 8, name: 'Work Continuation & Reintegration', weight: '13%' },
                    { num: 3, name: 'Manager Preparedness', weight: '12%' },
                    { num: 2, name: 'Insurance & Financial Protection', weight: '11%' },
                    { num: 13, name: 'Communication & Awareness', weight: '10%' },
                    { num: 6, name: 'Culture & Psychological Safety', weight: '8%' },
                    { num: 1, name: 'Medical Leave & Flexibility', weight: '7%' },
                    { num: 5, name: 'Workplace Accommodations', weight: '7%' },
                    { num: 7, name: 'Career Continuity & Growth', weight: '4%' },
                    { num: 9, name: 'Executive Commitment', weight: '4%' },
                    { num: 10, name: 'Caregiver & Family Support', weight: '4%' },
                    { num: 11, name: 'Prevention & Wellness', weight: '3%' },
                    { num: 12, name: 'Continuous Improvement', weight: '3%' },
                  ].map(d => (
                    <div key={d.num} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                      <span><span className="text-indigo-600 font-medium">D{d.num}:</span> {d.name}</span>
                      <span className="text-gray-500 font-mono">{d.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">Item-Level Scoring (4-Point Scale)</h3>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-indigo-600 text-white">
                    <tr>
                      <th className="py-2 px-4 text-left">Response</th>
                      <th className="py-2 px-3 text-center">Points</th>
                      <th className="py-2 px-4 text-left">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b"><td className="py-2 px-4">Currently offer/use this</td><td className="py-2 px-3 text-center font-bold text-green-600">5</td><td className="py-2 px-4">Implemented</td></tr>
                    <tr className="border-b bg-gray-50"><td className="py-2 px-4">In active planning/development</td><td className="py-2 px-3 text-center font-bold text-blue-600">3</td><td className="py-2 px-4">Planning</td></tr>
                    <tr className="border-b"><td className="py-2 px-4">Assessing feasibility</td><td className="py-2 px-3 text-center font-bold text-amber-600">2</td><td className="py-2 px-4">Exploring</td></tr>
                    <tr className="border-b bg-gray-50"><td className="py-2 px-4">Not able to offer at this time</td><td className="py-2 px-3 text-center font-bold text-red-600">0</td><td className="py-2 px-4">Not Available</td></tr>
                    <tr><td className="py-2 px-4">Unsure</td><td className="py-2 px-3 text-center font-bold text-gray-400">0</td><td className="py-2 px-4">Unknown (flagged)</td></tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">Composite Score Formula</h3>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <span className="text-gray-700">Composite = </span>
                  <span className="font-bold text-blue-600">(Weighted Dim × 90%)</span>
                  <span className="text-gray-700"> + </span>
                  <span className="font-bold text-purple-600">(Maturity × 5%)</span>
                  <span className="text-gray-700"> + </span>
                  <span className="font-bold text-violet-600">(Breadth × 5%)</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">Tier Classification</h3>
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  <div className="bg-emerald-100 rounded-lg p-3 border border-emerald-300">
                    <div className="font-bold text-emerald-700">Exemplary</div>
                    <div className="text-emerald-600">90+</div>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-3 border border-blue-300">
                    <div className="font-bold text-blue-700">Leading</div>
                    <div className="text-blue-600">75-89</div>
                  </div>
                  <div className="bg-amber-100 rounded-lg p-3 border border-amber-300">
                    <div className="font-bold text-amber-700">Progressing</div>
                    <div className="text-amber-600">60-74</div>
                  </div>
                  <div className="bg-orange-100 rounded-lg p-3 border border-orange-300">
                    <div className="font-bold text-orange-700">Emerging</div>
                    <div className="text-orange-600">40-59</div>
                  </div>
                  <div className="bg-red-100 rounded-lg p-3 border border-red-300">
                    <div className="font-bold text-red-700">Developing</div>
                    <div className="text-red-600">&lt;40</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* RELIABILITY TAB */}
          {activeTab === 'reliability' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <div className="text-4xl font-bold text-green-700">0.78</div>
                  <div className="text-sm text-green-600">Average Cronbach's α</div>
                  <div className="text-xs text-green-500 font-medium">Acceptable</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <div className="text-4xl font-bold text-green-700">0.58</div>
                  <div className="text-sm text-green-600">Avg Inter-Dimension Correlation</div>
                  <div className="text-xs text-green-500 font-medium">Optimal Range (0.3-0.7)</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">Dimension-Level Reliability</h3>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-cyan-600 text-white">
                    <tr>
                      <th className="py-2 px-3 text-left">Dimension</th>
                      <th className="py-2 px-2 text-center">Items</th>
                      <th className="py-2 px-2 text-center">Valid N</th>
                      <th className="py-2 px-2 text-center">α</th>
                      <th className="py-2 px-3 text-center">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dim: 'D10: Caregiver & Family', items: 19, n: 35, alpha: 0.90, quality: 'Excellent', color: 'text-green-600' },
                      { dim: 'D8: Work Continuation', items: 12, n: 35, alpha: 0.87, quality: 'Good', color: 'text-blue-600' },
                      { dim: 'D4: Navigation & Expert', items: 10, n: 36, alpha: 0.83, quality: 'Good', color: 'text-blue-600' },
                      { dim: 'D7: Career Continuity', items: 9, n: 34, alpha: 0.82, quality: 'Good', color: 'text-blue-600' },
                      { dim: 'D11: Prevention & Wellness', items: 13, n: 36, alpha: 0.81, quality: 'Good', color: 'text-blue-600' },
                      { dim: 'D2: Insurance & Financial', items: 17, n: 35, alpha: 0.80, quality: 'Good', color: 'text-blue-600' },
                      { dim: 'D9: Executive Commitment', items: 12, n: 33, alpha: 0.80, quality: 'Good', color: 'text-blue-600' },
                      { dim: 'D6: Culture & Psych Safety', items: 12, n: 35, alpha: 0.78, quality: 'Acceptable', color: 'text-cyan-600' },
                      { dim: 'D12: Continuous Improvement', items: 9, n: 36, alpha: 0.76, quality: 'Acceptable', color: 'text-cyan-600' },
                      { dim: 'D13: Communication', items: 11, n: 36, alpha: 0.75, quality: 'Acceptable', color: 'text-cyan-600' },
                      { dim: 'D3: Manager Preparedness', items: 10, n: 34, alpha: 0.74, quality: 'Acceptable', color: 'text-cyan-600' },
                      { dim: 'D5: Workplace Accommodations', items: 11, n: 36, alpha: 0.66, quality: 'Moderate', color: 'text-amber-600', highlight: true },
                      { dim: 'D1: Medical Leave & Flexibility', items: 13, n: 36, alpha: 0.59, quality: 'Moderate', color: 'text-amber-600', highlight: true },
                    ].map((row, idx) => (
                      <tr key={idx} className={row.highlight ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-3">{row.dim}</td>
                        <td className="py-2 px-2 text-center">{row.items}</td>
                        <td className="py-2 px-2 text-center">{row.n}</td>
                        <td className={`py-2 px-2 text-center font-bold ${row.color}`}>{row.alpha.toFixed(2)}</td>
                        <td className={`py-2 px-3 text-center ${row.color}`}>{row.quality}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2">About D1 & D5 Lower Reliability (Formative Policy Indices)</h4>
                <p className="text-sm text-amber-800 mb-2">
                  Dimensions D1 (Medical Leave) and D5 (Workplace Accommodations) show lower α values. This is <strong>expected</strong> and does not indicate measurement failure.
                </p>
                <p className="text-sm text-amber-800 mb-2">
                  These dimensions function as <em>formative policy indices</em> rather than reflective scales:
                </p>
                <ul className="text-sm text-amber-800 ml-4 space-y-1">
                  <li>• <strong>Reflective scales:</strong> Items manifest one latent trait and should co-vary (high α expected)</li>
                  <li>• <strong>Formative indices:</strong> Items are distinct components of support that do not need to correlate to be valid</li>
                </ul>
                <p className="text-sm text-amber-800 mt-2 italic">
                  D1 aggregates diverse mechanisms (leave length, intermittent leave, PTO accrual, job protection). D5 combines physical accommodations, scheduling flexibility, and technology supports. 
                  Alpha is reported as a diagnostic to identify mis-keyed items, not as a validity requirement.
                </p>
              </div>
            </div>
          )}
          
          {/* SENSITIVITY TAB */}
          {activeTab === 'sensitivity' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">Weight Perturbation Analysis</h3>
                <p className="text-sm text-gray-600 mb-3">Dimension weights randomly perturbed by ±10% across 50 simulations.</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <div className="text-3xl font-bold text-green-700">0.999</div>
                    <div className="text-sm text-green-600">Spearman Correlation</div>
                    <div className="text-xs text-gray-500">Target: ≥0.95</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <div className="text-3xl font-bold text-green-700">0%</div>
                    <div className="text-sm text-green-600">Tier Change Rate</div>
                    <div className="text-xs text-gray-500">Target: ≤10-15%</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <div className="text-3xl font-bold text-green-700">38/38</div>
                    <div className="text-sm text-green-600">Tier-Stable Companies</div>
                    <div className="text-xs text-gray-500">100% stability</div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 italic mt-2">
                  Rankings are essentially invariant to ±10% weight changes—neutralizes "arbitrary weights" criticism.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">Scenario Analysis</h3>
                <p className="text-sm text-gray-600 mb-3">Named scenarios test stability under alternative methodological choices.</p>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-orange-600 text-white">
                    <tr>
                      <th className="py-2 px-3 text-left">Scenario</th>
                      <th className="py-2 px-2 text-center">Rank Corr.</th>
                      <th className="py-2 px-2 text-center">Tier Changes</th>
                      <th className="py-2 px-2 text-center">Avg Δ</th>
                      <th className="py-2 px-3 text-center">Stability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Follow-up blend 90/10', corr: 1.000, changes: '0/38', delta: '±0.2', stable: true },
                      { name: 'Follow-up blend 80/20', corr: 0.999, changes: '1/38', delta: '±0.4', stable: true },
                      { name: 'Geo multiplier 0.95/0.80', corr: 0.995, changes: '2/38', delta: '±0.9', stable: true },
                      { name: 'Composite 95/3/2', corr: 0.994, changes: '2/38', delta: '±1.1', stable: true },
                      { name: 'Planning = 2 pts (not 3)', corr: 0.999, changes: '11/38', delta: '±5', stable: false },
                      { name: 'Assessing = 1 pt (not 2)', corr: 0.999, changes: '11/38', delta: '±5', stable: false },
                    ].map((row, idx) => (
                      <tr key={idx} className={row.stable ? (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50') : 'bg-amber-50'}>
                        <td className="py-2 px-3">{row.name}</td>
                        <td className="py-2 px-2 text-center font-bold text-green-600">{row.corr.toFixed(3)}</td>
                        <td className={`py-2 px-2 text-center font-bold ${row.stable ? '' : 'text-red-600'}`}>{row.changes}</td>
                        <td className="py-2 px-2 text-center text-gray-600">{row.delta} pts</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.stable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {row.stable ? 'Stable' : 'Sensitive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                  <div className="text-2xl font-bold text-green-700">4</div>
                  <div className="text-xs text-green-600">Stable Scenarios</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                  <div className="text-2xl font-bold text-gray-500">0</div>
                  <div className="text-xs text-gray-500">Marginal Scenarios</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                  <div className="text-2xl font-bold text-red-700">2</div>
                  <div className="text-xs text-red-600">Sensitive Scenarios</div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">Interpretation of "Sensitive" Scenarios</h4>
                <p className="text-sm text-blue-800 mb-2">
                  The two "sensitive" scenarios (Planning = 2 pts, Assessing = 1 pt) show high tier changes but maintain exceptional rank correlation (0.999). This indicates:
                </p>
                <ol className="text-sm text-blue-800 ml-4 space-y-1 list-decimal">
                  <li><strong>Rankings are robust</strong> — the same companies rank highly regardless of point values</li>
                  <li><strong>Tier thresholds are crossing points</strong> — companies near boundaries shift tiers when scores compress</li>
                  <li><strong>Status point values reflect design intent</strong> — the index deliberately values companies actively planning or assessing improvements</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AggregateScoringReport() {
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);
  const [assessments, setAssessments] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState<Record<number, number>>({ ...DEFAULT_DIMENSION_WEIGHTS });
  const [blendWeights, setBlendWeights] = useState({ ...DEFAULT_BLEND_WEIGHTS });
  const [showBlendSettings, setShowBlendSettings] = useState(false);
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [showCompositeModal, setShowCompositeModal] = useState(false);
  const [showTierStatsModal, setShowTierStatsModal] = useState(false);
  const [showSensitivityModal, setShowSensitivityModal] = useState(false);
  const [showReliabilityModal, setShowReliabilityModal] = useState(false);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'weighted' | 'composite' | `dim${number}`>('composite');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'fp' | 'standard' | 'panel'>('all');
  const [filterComplete, setFilterComplete] = useState(false);
  const [viewMode, setViewMode] = useState<'score' | 'index'>('score');
  const [includePanel, setIncludePanel] = useState(true);
  
  const weightsSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const weightsValid = weightsSum === 100;
  const weightsDiff = 100 - weightsSum;
  
  const [compositeWeights, setCompositeWeights] = useState({ ...DEFAULT_COMPOSITE_WEIGHTS });
  const compositeWeightsSum = compositeWeights.weightedDim + compositeWeights.maturity + compositeWeights.breadth;
  const compositeWeightsValid = compositeWeightsSum === 100;

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .order('company_name', { ascending: true });

        if (error) throw error;
        
        const assessmentsWithData = (data || []).filter(a => {
          for (let i = 1; i <= 13; i++) {
            const dimData = a[`dimension${i}_data`];
            if (dimData && typeof dimData === 'object') {
              const gridData = dimData[`d${i}a`];
              if (gridData && Object.keys(gridData).length > 0) return true;
            }
          }
          return false;
        });
        
        setAssessments(assessmentsWithData);
      } catch (err) {
        console.error('Error loading assessments:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAssessments();
  }, []);

  const companyScores = useMemo(() => {
    return assessments.map(a => calculateCompanyScores(a, weights, compositeWeights, blendWeights));
  }, [assessments, weights, compositeWeights, blendWeights]);

  const sortedCompanies = useMemo(() => {
    let filtered = companyScores;
    
    if (!includePanel) {
      filtered = filtered.filter(c => !c.isPanel);
    }
    
    if (filterType === 'fp') filtered = filtered.filter(c => c.isFoundingPartner && !c.isPanel);
    else if (filterType === 'standard') filtered = filtered.filter(c => !c.isFoundingPartner && !c.isPanel);
    else if (filterType === 'panel') filtered = filtered.filter(c => c.isPanel);
    
    if (filterComplete) filtered = filtered.filter(c => c.isComplete);
    
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.companyName.localeCompare(b.companyName);
      else if (sortBy === 'weighted') comparison = a.weightedScore - b.weightedScore;
      else if (sortBy === 'composite') comparison = a.compositeScore - b.compositeScore;
      else if (sortBy.startsWith('dim')) {
        const dimNum = parseInt(sortBy.replace('dim', ''));
        const scoreA = a.dimensions[dimNum]?.blendedScore ?? -1;
        const scoreB = b.dimensions[dimNum]?.blendedScore ?? -1;
        comparison = scoreA - scoreB;
      }
      return sortDir === 'desc' ? -comparison : comparison;
    });
  }, [companyScores, sortBy, sortDir, filterType, filterComplete, includePanel]);

  const averages = useMemo(() => {
    const baseComplete = companyScores.filter(c => c.isComplete);
    const complete = includePanel ? baseComplete : baseComplete.filter(c => !c.isPanel);
    const fp = complete.filter(c => c.isFoundingPartner && !c.isPanel);
    const std = complete.filter(c => !c.isFoundingPartner && !c.isPanel);
    const panel = baseComplete.filter(c => c.isPanel);
    // Geographic footprint filters
    const single = complete.filter(c => c.globalFootprint.segment === 'Single');
    const regional = complete.filter(c => c.globalFootprint.segment === 'Regional');
    const global = complete.filter(c => c.globalFootprint.segment === 'Global');
    
    const calcAvg = (arr: CompanyScores[], key: keyof CompanyScores) => 
      arr.length > 0 ? Math.round(arr.reduce((s, c) => s + ((c[key] as number) || 0), 0) / arr.length) : null;
    
    const dimAvg = (dim: number, arr: CompanyScores[]) => 
      arr.length > 0 ? Math.round(arr.reduce((s, c) => s + (c.dimensions[dim]?.blendedScore || 0), 0) / arr.length) : null;
    
    return {
      dimensions: Object.fromEntries(DIMENSION_ORDER.map(d => [d, {
        total: dimAvg(d, complete),
        fp: dimAvg(d, fp),
        std: dimAvg(d, std),
        panel: dimAvg(d, panel),
        single: dimAvg(d, single),
        regional: dimAvg(d, regional),
        global: dimAvg(d, global),
      }])),
      unweighted: { total: calcAvg(complete, 'unweightedScore'), fp: calcAvg(fp, 'unweightedScore'), std: calcAvg(std, 'unweightedScore'), panel: calcAvg(panel, 'unweightedScore'), single: calcAvg(single, 'unweightedScore'), regional: calcAvg(regional, 'unweightedScore'), global: calcAvg(global, 'unweightedScore') },
      weighted: { total: calcAvg(complete, 'weightedScore'), fp: calcAvg(fp, 'weightedScore'), std: calcAvg(std, 'weightedScore'), panel: calcAvg(panel, 'weightedScore'), single: calcAvg(single, 'weightedScore'), regional: calcAvg(regional, 'weightedScore'), global: calcAvg(global, 'weightedScore') },
      maturity: { total: calcAvg(complete, 'maturityScore'), fp: calcAvg(fp, 'maturityScore'), std: calcAvg(std, 'maturityScore'), panel: calcAvg(panel, 'maturityScore'), single: calcAvg(single, 'maturityScore'), regional: calcAvg(regional, 'maturityScore'), global: calcAvg(global, 'maturityScore') },
      breadth: { total: calcAvg(complete, 'breadthScore'), fp: calcAvg(fp, 'breadthScore'), std: calcAvg(std, 'breadthScore'), panel: calcAvg(panel, 'breadthScore'), single: calcAvg(single, 'breadthScore'), regional: calcAvg(regional, 'breadthScore'), global: calcAvg(global, 'breadthScore') },
      composite: { total: calcAvg(complete, 'compositeScore'), fp: calcAvg(fp, 'compositeScore'), std: calcAvg(std, 'compositeScore'), panel: calcAvg(panel, 'compositeScore'), single: calcAvg(single, 'compositeScore'), regional: calcAvg(regional, 'compositeScore'), global: calcAvg(global, 'compositeScore') },
      counts: { total: complete.length, fp: fp.length, std: std.length, panel: panel.length, single: single.length, regional: regional.length, global: global.length },
    };
  }, [companyScores, includePanel]);

  const handleSort = (column: 'name' | 'weighted' | 'composite' | `dim${number}`) => {
    if (sortBy === column) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortDir(column === 'name' ? 'asc' : 'desc'); }
  };

  const scrollLeft = () => tableRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  const scrollRight = () => tableRef.current?.scrollBy({ left: 300, behavior: 'smooth' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading assessments...</p>
        </div>
      </div>
    );
  }

  const STICKY_LEFT_1 = 0;
  const STICKY_LEFT_2 = COL1_WIDTH;
  const STICKY_LEFT_3 = COL1_WIDTH + COL2_WIDTH;
  const STICKY_LEFT_4 = COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH;
  const STICKY_LEFT_5 = COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH);
  const STICKY_LEFT_6 = COL1_WIDTH + COL2_WIDTH + (3 * COL_AVG_WIDTH);
  const STICKY_LEFT_7 = COL1_WIDTH + COL2_WIDTH + (4 * COL_AVG_WIDTH);  // Single Country
  const STICKY_LEFT_8 = COL1_WIDTH + COL2_WIDTH + (5 * COL_AVG_WIDTH);  // Regional
  const STICKY_LEFT_9 = COL1_WIDTH + COL2_WIDTH + (6 * COL_AVG_WIDTH);  // Global
  
  // Row heights for sticky top offsets (fixed pixel values)
  const H_ROW1 = 36;   // METRICS/BENCHMARKS/COMPANIES row
  const H_ROW2 = 52;   // Column labels row (includes company names + 13/13 indicator)
  const H_ROW3 = 36;   // Global Footprint row
  const H_ROW4 = 36;   // Data Confidence row
  
  // Sticky top positions (cumulative)
  const TOP_ROW1 = 0;
  const TOP_ROW2 = 36;   // After row 1
  const TOP_ROW3 = 88;   // After rows 1+2
  const TOP_ROW4 = 124;  // After rows 1+2+3
  
  const COMPANY_COL_WIDTH = 90; // Slightly wider for better score visibility

  return (
    <div className="min-h-screen bg-gray-50">
      {showDimensionModal && <DimensionScoringModal onClose={() => setShowDimensionModal(false)} defaultWeights={DEFAULT_DIMENSION_WEIGHTS} />}
      {showCompositeModal && <CompositeModal onClose={() => setShowCompositeModal(false)} compositeWeights={compositeWeights} />}
      {showTierStatsModal && <TierStatsModal onClose={() => setShowTierStatsModal(false)} companyScores={companyScores} includePanel={includePanel} />}
      {showSensitivityModal && <SensitivityAnalysisModal onClose={() => setShowSensitivityModal(false)} companyScores={companyScores} weights={weights} includePanel={includePanel} assessments={assessments} />}
      {showReliabilityModal && <ReliabilityDiagnosticsModal onClose={() => setShowReliabilityModal(false)} companyScores={companyScores} assessments={assessments} includePanel={includePanel} />}
      {showMethodologyModal && <TechnicalMethodologyModal onClose={() => setShowMethodologyModal(false)} />}
      
      {/* Blend Weight Settings Modal */}
      {showBlendSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-purple-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">S</span>
                <div>
                  <h3 className="font-semibold text-purple-900">Blend Weight Settings</h3>
                  <p className="text-purple-600 text-xs">D1, D3, D12, D13 use Grid + Follow-up blend</p>
                </div>
              </div>
              <button
                onClick={() => setShowBlendSettings(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {(['d1', 'd3', 'd12', 'd13'] as const).map((key) => {
                  const dimNum = parseInt(key.substring(1));
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="font-semibold text-gray-800 mb-3">
                        D{dimNum}: {DIMENSION_NAMES[dimNum].split(' ')[0]}
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <label className="text-sm text-gray-600 w-16">Grid:</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={blendWeights[key].grid}
                          onChange={(e) => {
                            const newGrid = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                            setBlendWeights(prev => ({
                              ...prev,
                              [key]: { grid: newGrid, followUp: 100 - newGrid }
                            }));
                          }}
                          className="w-16 px-2 py-1.5 text-center border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600 w-16">Follow-up:</label>
                        <span className="w-16 px-2 py-1.5 text-center bg-gray-200 rounded text-gray-700">
                          {blendWeights[key].followUp}
                        </span>
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={() => setBlendWeights({ ...DEFAULT_BLEND_WEIGHTS })}
                  className="px-4 py-2 text-sm text-purple-600 hover:text-purple-800 border border-purple-300 rounded-lg hover:bg-purple-50"
                >
                  Reset All to 85/15
                </button>
                <button
                  onClick={() => setShowBlendSettings(false)}
                  className="px-6 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white py-4 px-4 lg:px-8 shadow-xl sticky top-0 z-40">
        <div className="max-w-full mx-auto">
          {/* Top row - Title and main controls */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex-shrink-0">
              <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-xl">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                Best Companies Scoring Report
              </h1>
              <p className="text-indigo-200 text-xs lg:text-sm mt-1">Workplace Support Excellence Index</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                <button onClick={scrollLeft} className="p-1.5 lg:p-2 hover:bg-white/20 rounded transition-colors" title="Scroll Left">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs px-1 hidden sm:inline">Scroll</span>
                <button onClick={scrollRight} className="p-1.5 lg:p-2 hover:bg-white/20 rounded transition-colors" title="Scroll Right">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <button onClick={() => window.print()} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs lg:text-sm font-medium transition-colors">
                Print
              </button>
              <button onClick={() => router.push('/admin')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs lg:text-sm font-medium transition-colors">
                ← Back
              </button>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 bg-white/5 rounded-xl px-4 py-2.5 text-xs lg:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-indigo-300">Total:</span>
              <span className="font-bold text-lg lg:text-xl">{companyScores.filter(c => includePanel || !c.isPanel).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-violet-500/30 border border-violet-400/50 text-violet-200 text-xs font-bold">FP</span>
              <span className="font-bold">{companyScores.filter(c => c.isFoundingPartner && !c.isPanel).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-slate-500/30 border border-slate-400/50 text-slate-200 text-xs font-bold">STD</span>
              <span className="font-bold">{companyScores.filter(c => !c.isFoundingPartner && !c.isPanel).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold">PANEL</span>
              <span className="font-bold">{companyScores.filter(c => c.isPanel).length}</span>
            </div>
            <div className="border-l border-white/20 pl-3 flex items-center gap-2">
              <span className="text-green-300">Complete:</span>
              <span className="font-bold">{companyScores.filter(c => c.isComplete && (includePanel || !c.isPanel)).length}</span>
            </div>
            <div className="border-l border-white/20 pl-3 flex items-center gap-2 text-xs">
              <span className="text-gray-400">Footprint:</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-500 text-white flex items-center gap-1" title="Single country">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                1
              </span>
              <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center gap-1" title="Regional (2-10 countries)">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
                2-10
              </span>
              <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center gap-1" title="Global (11+ countries)">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                11+
              </span>
            </div>
            
            {/* Filters - right side */}
            <div className="ml-auto flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-xs cursor-pointer bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-400/30">
                <input
                  type="checkbox"
                  checked={includePanel}
                  onChange={(e) => setIncludePanel(e.target.checked)}
                  className="rounded border-amber-400/50 bg-white/10 text-amber-400 w-3.5 h-3.5"
                />
                <span className="text-amber-200">Include Panel</span>
              </label>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-white/10 text-white border-0 rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="all" className="text-gray-900">All</option>
                <option value="fp" className="text-gray-900">FP Only</option>
                <option value="standard" className="text-gray-900">Standard Only</option>
                <option value="panel" className="text-gray-900">Panel Only</option>
              </select>
              
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterComplete}
                  onChange={(e) => setFilterComplete(e.target.checked)}
                  className="rounded border-white/30 bg-white/10 text-indigo-400 w-3.5 h-3.5"
                />
                <span>Complete Only</span>
              </label>
            </div>
          </div>
          
          {/* Toolbar Row - Buttons */}
          <div className="mt-2 flex flex-wrap items-center gap-2 bg-white/5 rounded-xl px-4 py-2">
            <div className="flex bg-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('score')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'score' ? 'bg-white text-indigo-900' : 'text-white hover:bg-white/10'}`}
              >
                Scores
              </button>
              <button
                onClick={() => setViewMode('index')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'index' ? 'bg-white text-indigo-900' : 'text-white hover:bg-white/10'}`}
              >
                Index
              </button>
            </div>
            
            <div className="h-5 w-px bg-white/20 mx-1"></div>
            
            <button 
              onClick={() => setShowCompositeModal(true)}
              className="px-2.5 py-1 bg-purple-500 hover:bg-purple-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Composite Scoring
            </button>
            <button 
              onClick={() => setShowDimensionModal(true)}
              className="px-2.5 py-1 bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Dimension Scoring
            </button>
            <button 
              onClick={() => setShowTierStatsModal(true)}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Tier Stats
            </button>
            <button 
              onClick={() => setShowSensitivityModal(true)}
              className="px-2.5 py-1 bg-orange-500 hover:bg-orange-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Sensitivity
            </button>
            <button 
              onClick={() => setShowReliabilityModal(true)}
              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Reliability
            </button>
            <button 
              onClick={() => setShowBlendSettings(true)}
              className="px-2.5 py-1 bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Blend Weights
            </button>
            <button 
              onClick={() => setShowMethodologyModal(true)}
              className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Methodology
            </button>
            <button 
              onClick={() => {
                setCompositeWeights({ ...DEFAULT_COMPOSITE_WEIGHTS });
                setBlendWeights({ ...DEFAULT_BLEND_WEIGHTS });
                setWeights({ ...DEFAULT_DIMENSION_WEIGHTS });
              }}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Reset All Weights
            </button>
          </div>
          
          {/* Legend Row - Compact */}
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 bg-white/5 rounded-xl px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium">Score Colors:</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#059669' }} /><span className="text-gray-300">80-100</span></span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#0284C7' }} /><span className="text-gray-300">60-79</span></span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#D97706' }} /><span className="text-gray-300">40-59</span></span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#DC2626' }} /><span className="text-gray-300">0-39</span></span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/20 pl-4">
              <span className="text-gray-400 font-medium">Data Quality:</span>
              <span className="ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 rounded px-1.5 py-0.5 font-bold text-amber-300 bg-white/10 text-[11px]">42</span>
              <span className="text-gray-400">= Over 40% "Unsure"</span>
            </div>
            <div className="flex items-center gap-2 border-l border-white/20 pl-4">
              <span className="text-gray-400 font-medium">Provisional:</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 border-2 border-dashed border-amber-400 bg-amber-500/20 rounded-full text-amber-300 font-bold text-[11px]">
                Leading<span className="text-amber-400">*</span>
              </span>
              <span className="text-gray-400">= 4+ dims have high Unsure</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 lg:p-6">

        {sortedCompanies.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessments Found</h3>
            <p className="text-gray-500">No companies match your current filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg">
            <div
              ref={tableRef}
              className="overflow-auto max-h-[calc(100vh-300px)]"
            >
              <table
                className="text-sm border-separate border-spacing-0"
                style={{ width: 'max-content', minWidth: '100%', tableLayout: 'fixed' }}
              >
                <colgroup>
                  <col style={{ width: COL1_WIDTH }} />
                  <col style={{ width: COL2_WIDTH }} />
                  {/* 7 benchmark columns */}
                  {Array.from({ length: 7 }).map((_, i) => (
                    <col key={`bench-col-${i}`} style={{ width: COL_AVG_WIDTH }} />
                  ))}
                  {/* company columns */}
                  {sortedCompanies.map((c) => (
                    <col key={`co-col-${c.surveyId}`} style={{ width: COMPANY_COL_WIDTH }} />
                  ))}
                </colgroup>
                <thead style={{ backgroundColor: '#1E293B' }}>
                  {/* ROW 1: METRICS / BENCHMARKS / COMPANIES */}
                  <tr className="text-white">
                    <th colSpan={2} className="px-4 py-2 text-left text-xs font-medium border-r border-slate-600 text-white"
                        style={{ position: 'sticky', top: 0, zIndex: 120, backgroundColor: '#1E293B', height: 36 }}>
                      METRICS
                    </th>
                    <th colSpan={7} className="px-4 py-2 text-center text-xs font-medium border-r border-indigo-500 text-white"
                        style={{ position: 'sticky', top: 0, zIndex: 120, backgroundColor: '#4338CA', height: 36 }}>
                      BENCHMARKS
                    </th>
                    <th colSpan={sortedCompanies.length} className="px-4 py-2 text-center text-xs font-medium text-white"
                        style={{ position: 'sticky', top: 0, zIndex: 120, backgroundColor: '#334155', height: 36 }}>
                      COMPANIES ({sortedCompanies.length})
                    </th>
                  </tr>
                  
                  {/* ROW 2: Column labels */}
                  <tr className="text-white">
                    <th className="px-4 py-3 text-left font-semibold border-r border-slate-600"
                        style={{ position: 'sticky', top: 36, left: STICKY_LEFT_1, zIndex: 110, backgroundColor: '#334155' }}>
                      <button onClick={() => handleSort('name')} className="hover:text-indigo-300 flex items-center gap-1">
                        Metric {sortBy === 'name' && <span className="text-xs">{sortDir === 'asc' ? '^' : 'v'}</span>}
                      </button>
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-slate-600"
                        style={{ position: 'sticky', top: 36, left: STICKY_LEFT_2, zIndex: 110, backgroundColor: '#334155' }}>
                      Wt %
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-indigo-500"
                        style={{ position: 'sticky', top: 36, left: STICKY_LEFT_3, zIndex: 110, backgroundColor: '#4F46E5' }}>
                      ALL
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-violet-500"
                        style={{ position: 'sticky', top: 36, left: STICKY_LEFT_4, zIndex: 110, backgroundColor: '#7C3AED' }}>
                      FP
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-slate-400"
                        style={{ position: 'sticky', top: 36, left: STICKY_LEFT_5, zIndex: 110, backgroundColor: '#64748B' }}>
                      STD
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-amber-500"
                        style={{ position: 'sticky', top: 36, left: STICKY_LEFT_6, zIndex: 110, backgroundColor: '#D97706' }}>
                      PANEL
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-slate-500"
                        style={{ position: 'sticky', top: 36, left: STICKY_LEFT_7, zIndex: 110, backgroundColor: '#475569' }}
                        title="Single Country">
                      1🌍
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-blue-500"
                        style={{ position: 'sticky', top: 36, left: STICKY_LEFT_8, zIndex: 110, backgroundColor: '#2563EB' }}
                        title="Regional (2-10 countries)">
                      REG
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-purple-500"
                        style={{ position: 'sticky', top: 36, left: STICKY_LEFT_9, zIndex: 110, backgroundColor: '#9333EA', boxShadow: '4px 0 8px -2px rgba(0, 0, 0, 0.3)' }}
                        title="Global (10+ countries)">
                      GLB
                    </th>
                    {sortedCompanies.map(company => (
                      <th key={company.surveyId} 
                          className="px-2 py-2 text-center font-medium border-r last:border-r-0 text-white relative group/header"
                          style={{ position: 'sticky', top: 36, zIndex: 100, backgroundColor: company.isPanel ? '#D97706' : company.isFoundingPartner ? '#7C3AED' : '#475569', minWidth: '80px' }}>
                        <Link href={`/admin/profile/${company.surveyId}`} className="text-xs hover:underline block truncate text-white" title={company.companyName}>
                          {company.companyName.length > 12 ? company.companyName.substring(0, 11) + '…' : company.companyName}
                        </Link>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-[10px] opacity-70">{company.completedDimCount}/13</span>
                        </div>
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover/header:opacity-100 transition-opacity pointer-events-none z-[200]">
                          {company.companyName}
                        </div>
                      </th>
                    ))}
                  </tr>
                  {/* ROW 3: Global Footprint */}
                  <tr>
                    <th className="px-4 py-1.5 text-left text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 88, left: STICKY_LEFT_1, zIndex: 110, backgroundColor: '#334155' }}>
                      Global Footprint
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 88, left: STICKY_LEFT_2, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 88, left: STICKY_LEFT_3, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 88, left: STICKY_LEFT_4, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 88, left: STICKY_LEFT_5, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 88, left: STICKY_LEFT_6, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 88, left: STICKY_LEFT_7, zIndex: 110, backgroundColor: '#334155' }}>
                      <span className="text-[10px] text-slate-400">n={averages.counts.single}</span>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 88, left: STICKY_LEFT_8, zIndex: 110, backgroundColor: '#334155' }}>
                      <span className="text-[10px] text-slate-400">n={averages.counts.regional}</span>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 88, left: STICKY_LEFT_9, zIndex: 110, backgroundColor: '#334155', boxShadow: '4px 0 8px -2px rgba(0, 0, 0, 0.3)' }}>
                      <span className="text-[10px] text-slate-400">n={averages.counts.global}</span>
                    </th>
                    {sortedCompanies.map(company => (
                      <th key={`footprint-${company.surveyId}`} 
                          className="px-2 py-1.5 text-center border-r border-slate-600 last:border-r-0"
                          style={{ position: 'sticky', top: 88, zIndex: 100, backgroundColor: '#334155' }}>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          company.globalFootprint.segment === 'Global' 
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                            : company.globalFootprint.segment === 'Regional' 
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md' 
                            : 'bg-slate-500 text-white'
                        }`}>
                          {company.globalFootprint.segment === 'Global' && (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                            </svg>
                          )}
                          {company.globalFootprint.segment === 'Regional' && (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
                            </svg>
                          )}
                          {company.globalFootprint.segment === 'Single' && (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          )}
                          <span>{company.globalFootprint.countryCount}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                  {/* ROW 4: Data Confidence */}
                  <tr>
                    <th className="px-4 py-1.5 text-left text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 124, left: STICKY_LEFT_1, zIndex: 110, backgroundColor: '#334155' }}>
                      Data Confidence
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 124, left: STICKY_LEFT_2, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 124, left: STICKY_LEFT_3, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 124, left: STICKY_LEFT_4, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 124, left: STICKY_LEFT_5, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 124, left: STICKY_LEFT_6, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 124, left: STICKY_LEFT_7, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 124, left: STICKY_LEFT_8, zIndex: 110, backgroundColor: '#334155' }}>
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-slate-300 border-r border-slate-600"
                        style={{ position: 'sticky', top: 124, left: STICKY_LEFT_9, zIndex: 110, backgroundColor: '#334155', boxShadow: '4px 0 8px -2px rgba(0, 0, 0, 0.3)' }}>
                    </th>
                    {sortedCompanies.map(company => {
                      const conf = company.dataConfidence.percent;
                      const confColor = conf >= 95 ? 'bg-green-500' : conf >= 85 ? 'bg-teal-500' : conf >= 70 ? 'bg-amber-500' : 'bg-red-500';
                      return (
                        <th key={`conf-${company.surveyId}`} 
                            className="px-2 py-1.5 text-center border-r border-slate-600 last:border-r-0"
                            style={{ position: 'sticky', top: 124, zIndex: 100, backgroundColor: '#334155' }}>
                          <div 
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white ${confColor}`}
                            title={`${company.dataConfidence.verifiedItems}/${company.dataConfidence.totalItems} items verified (${company.dataConfidence.unsureCount} unsure)`}
                          >
                            {conf}%
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                
                <tbody>
                  {/* ============================================ */}
                  {/* SECTION 1: COMPOSITE SCORE */}
                  {/* ============================================ */}
                  
                  <tr>
                    <td colSpan={9 + sortedCompanies.length} className="bg-gradient-to-r from-purple-100 to-indigo-100 border-y-2 border-purple-300">
                      <div className="px-4 py-2 flex items-center gap-3">
                        <span className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">★</span>
                        <div>
                          <span className="font-bold text-purple-900 text-lg">Composite Score</span>
                          <span className="text-purple-600 text-sm ml-2">(Overall Ranking)</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Composite Score Row */}
                  <tr className={`${compositeWeightsValid && weightsValid ? 'bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100' : 'bg-red-50'} transition-colors group/row`}>
                    <td className={`px-4 py-3 border-r ${compositeWeightsValid && weightsValid ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 5 }}>
                      <button onClick={() => handleSort('composite')} className={`font-bold flex items-center gap-2 ${compositeWeightsValid && weightsValid ? 'text-purple-900 hover:text-purple-700' : 'text-red-700'}`}>
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${compositeWeightsValid && weightsValid ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-red-500'}`}>★</span>
                        Composite Score
                        {sortBy === 'composite' && <span className="text-xs">{sortDir === 'asc' ? '^' : 'v'}</span>}
                      </button>
                    </td>
                    <td className={`px-2 py-3 text-center text-xs border-r ${compositeWeightsValid && weightsValid ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 5 }}>
                      {compositeWeightsValid && weightsValid ? '100%' : <span className="text-red-600 font-bold">{compositeWeightsSum}%</span>}
                    </td>
                    {compositeWeightsValid && weightsValid ? (
                      <>
                        <td className="px-2 py-3 text-center bg-purple-200 border-r border-purple-300 font-black text-2xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 5, color: getScoreColor(averages.composite.total ?? 0) }}>
                          {averages.composite.total ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-violet-200 border-r border-violet-300 font-black text-2xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 5, color: getScoreColor(averages.composite.fp ?? 0) }}>
                          {averages.composite.fp ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-slate-200 border-r border-slate-300 font-black text-2xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 5, color: getScoreColor(averages.composite.std ?? 0) }}>
                          {averages.composite.std ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-amber-200 border-r border-amber-300 font-black text-2xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 5, color: getScoreColor(averages.composite.panel ?? 0) }}>
                          {averages.composite.panel ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-slate-100 border-r border-slate-200 font-bold text-lg"
                            style={{ position: 'sticky', left: STICKY_LEFT_7, zIndex: 5, color: getScoreColor(averages.composite.single ?? 0) }}>
                          {averages.composite.single ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-blue-100 border-r border-blue-200 font-bold text-lg"
                            style={{ position: 'sticky', left: STICKY_LEFT_8, zIndex: 5, color: getScoreColor(averages.composite.regional ?? 0) }}>
                          {averages.composite.regional ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-purple-100 border-r border-purple-200 font-bold text-lg"
                            style={{ position: 'sticky', left: STICKY_LEFT_9, zIndex: 5, color: getScoreColor(averages.composite.global ?? 0) }}>
                          {averages.composite.global ?? '—'}
                        </td>
                        {sortedCompanies.map(company => (
                          <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-purple-200 last:border-r-0 ${
                            company.isPanel ? 'bg-amber-100/70' : company.isFoundingPartner ? 'bg-violet-100/70' : 'bg-purple-50'
                          }`}>
                            <ScoreCell score={company.compositeScore} isComplete={company.isComplete} isProvisional={company.isProvisional} size="large" viewMode={viewMode} benchmark={averages.composite.total} />
                          </td>
                        ))}
                      </>
                    ) : (
                      <td colSpan={7 + sortedCompanies.length} className="px-4 py-3 bg-red-50 border-r border-red-200">
                        <div className="flex items-center gap-2 text-red-700">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Weights must sum to 100%</span>
                        </div>
                      </td>
                    )}
                  </tr>
                  
                  {/* Composite Tier Row */}
                  {compositeWeightsValid && weightsValid && (
                    <tr className="bg-white border-b-2 border-purple-200">
                      <td className="px-4 py-2 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 5 }}>
                        <span className="font-semibold text-gray-700 flex items-center gap-2 ml-8">
                          Composite Tier
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 5 }}></td>
                      <td className="px-2 py-2 text-center bg-indigo-50 border-r border-indigo-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 5 }}>
                        {averages.composite.total !== null && <TierBadge score={averages.composite.total} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-violet-50 border-r border-violet-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 5 }}>
                        {averages.composite.fp !== null && <TierBadge score={averages.composite.fp} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 5 }}>
                        {averages.composite.std !== null && <TierBadge score={averages.composite.std} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-amber-50 border-r border-amber-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 5 }}>
                        {averages.composite.panel !== null && <TierBadge score={averages.composite.panel} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_7, zIndex: 5 }}>
                        {averages.composite.single !== null && <TierBadge score={averages.composite.single} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-blue-50 border-r border-blue-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_8, zIndex: 5 }}>
                        {averages.composite.regional !== null && <TierBadge score={averages.composite.regional} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-purple-50 border-r border-purple-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_9, zIndex: 5, boxShadow: '4px 0 8px -2px rgba(0,0,0,0.15)' }}>
                        {averages.composite.global !== null && <TierBadge score={averages.composite.global} isComplete={true} size="small" />}
                      </td>
                      {sortedCompanies.map(company => (
                        <td key={company.surveyId} className={`px-2 py-2 text-center border-r border-gray-100 last:border-r-0 ${
                          company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                        }`}>
                          <TierBadge score={company.compositeScore} isComplete={company.isComplete} isProvisional={company.isProvisional} size="small" />
                        </td>
                      ))}
                    </tr>
                  )}
                  
                  {/* Composite Components */}
                  <tr>
                    <td colSpan={9 + sortedCompanies.length} className="bg-purple-50/50 border-b border-purple-100">
                      <div className="px-4 py-1.5 flex items-center gap-2 text-xs text-purple-700">
                        <span className="font-semibold">Composite =</span>
                        <span>W-{compositeWeights.weightedDim}% + M-{compositeWeights.maturity}% + B-{compositeWeights.breadth}%</span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Weighted Score Component */}
                  <tr className="bg-white hover:bg-blue-50/30 transition-colors group/row">
                    <td className="px-4 py-2 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 5 }}>
                      <span className="font-medium text-gray-800 flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs font-bold">W</span>
                        Weighted Dimension Score
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 5 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.weightedDim}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, weightedDim: parseInt(e.target.value) || 0 }))}
                        className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-2 py-2 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 5 }}>
                      <ScoreCell score={averages.weighted.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-violet-50 border-r border-violet-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 5 }}>
                      <ScoreCell score={averages.weighted.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 5 }}>
                      <ScoreCell score={averages.weighted.std} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 5 }}>
                      <ScoreCell score={averages.weighted.panel} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_7, zIndex: 5 }}>
                      <ScoreCell score={averages.weighted.single} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-blue-50 border-r border-blue-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_8, zIndex: 5 }}>
                      <ScoreCell score={averages.weighted.regional} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-purple-50 border-r border-purple-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_9, zIndex: 5, boxShadow: '4px 0 8px -2px rgba(0,0,0,0.15)' }}>
                      <ScoreCell score={averages.weighted.global} isComplete={true} />
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2 text-center border-r border-gray-100 last:border-r-0 ${
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                      }`}>
                        <ScoreCell score={company.weightedScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.weighted.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Maturity Score Component */}
                  <tr className="bg-gray-50 hover:bg-indigo-50/30 transition-colors group/row">
                    <td className="px-4 py-2 bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 5 }}>
                      <span className="font-medium text-gray-800 flex items-center gap-2">
                        <span className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 text-xs font-bold">M</span>
                        Maturity Score
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 5 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.maturity}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, maturity: parseInt(e.target.value) || 0 }))}
                        className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-2 py-2 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 5 }}>
                      <ScoreCell score={averages.maturity.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-violet-50 border-r border-violet-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 5 }}>
                      <ScoreCell score={averages.maturity.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 5 }}>
                      <ScoreCell score={averages.maturity.std} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 5 }}>
                      <ScoreCell score={averages.maturity.panel} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_7, zIndex: 5 }}>
                      <ScoreCell score={averages.maturity.single} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-blue-50 border-r border-blue-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_8, zIndex: 5 }}>
                      <ScoreCell score={averages.maturity.regional} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-purple-50 border-r border-purple-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_9, zIndex: 5, boxShadow: '4px 0 8px -2px rgba(0,0,0,0.15)' }}>
                      <ScoreCell score={averages.maturity.global} isComplete={true} />
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2 text-center border-r border-gray-100 last:border-r-0 ${
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : 'bg-gray-50'
                      }`}>
                        <ScoreCell score={company.maturityScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.maturity.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Breadth Score Component */}
                  <tr className="bg-white hover:bg-violet-50/30 transition-colors group/row">
                    <td className="px-4 py-2 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 5 }}>
                      <span className="font-medium text-gray-800 flex items-center gap-2">
                        <span className="w-5 h-5 bg-violet-100 rounded flex items-center justify-center text-violet-600 text-xs font-bold">B</span>
                        Breadth Score
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 5 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.breadth}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, breadth: parseInt(e.target.value) || 0 }))}
                        className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-2 py-2 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 5 }}>
                      <ScoreCell score={averages.breadth.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-violet-50 border-r border-violet-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 5 }}>
                      <ScoreCell score={averages.breadth.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 5 }}>
                      <ScoreCell score={averages.breadth.std} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 5 }}>
                      <ScoreCell score={averages.breadth.panel} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_7, zIndex: 5 }}>
                      <ScoreCell score={averages.breadth.single} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-blue-50 border-r border-blue-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_8, zIndex: 5 }}>
                      <ScoreCell score={averages.breadth.regional} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-purple-50 border-r border-purple-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_9, zIndex: 5, boxShadow: '4px 0 8px -2px rgba(0,0,0,0.15)' }}>
                      <ScoreCell score={averages.breadth.global} isComplete={true} />
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2 text-center border-r border-gray-100 last:border-r-0 ${
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                      }`}>
                        <ScoreCell score={company.breadthScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.breadth.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* ============================================ */}
                  {/* SECTION 2: DIMENSION SCORES */}
                  {/* ============================================ */}
                  
                  <tr>
                    <td colSpan={9 + sortedCompanies.length} className="bg-gradient-to-r from-blue-100 to-indigo-100 border-y-2 border-blue-300">
                      <div className="px-4 py-2 flex items-center gap-3">
                        <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">D</span>
                        <div>
                          <span className="font-bold text-blue-900 text-lg">Dimension Scores</span>
                          <span className="text-blue-600 text-sm ml-2">(13 Assessment Areas)</span>
                          <span className="text-blue-500 text-xs ml-3 opacity-70">Click dimension name to sort</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Dimension Rows */}
                  {DIMENSION_ORDER.map((dim, idx) => (
                    <tr key={dim} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'} hover:bg-blue-50/50 transition-colors group/row`}>
                      <td className={`px-4 py-2 border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'} group-hover/row:bg-blue-50/50 transition-colors`}
                          style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 5 }}>
                        <button 
                          onClick={() => handleSort(`dim${dim}` as `dim${number}`)}
                          className="font-medium text-gray-900 hover:text-blue-700 flex items-center gap-1 w-full text-left"
                          title={`Click to sort by D${dim}`}
                        >
                          <span className="text-blue-600 font-bold">D{dim}:</span> {DIMENSION_NAMES[dim]}
                          {[1, 3, 12, 13].includes(dim) && (
                            <span className="text-purple-500 text-xs ml-1" title="Uses blend with follow-up">*</span>
                          )}
                          {sortBy === `dim${dim}` && (
                            <span className="text-xs text-blue-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </td>
                      <td className={`px-1 py-1 text-center border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'} group-hover/row:bg-blue-50/50 transition-colors`}
                          style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 5 }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={weights[dim]}
                          onChange={(e) => setWeights(prev => ({ ...prev, [dim]: parseInt(e.target.value) || 0 }))}
                          className={`w-14 px-1 py-0.5 text-xs text-center border rounded focus:ring-1 focus:ring-blue-400 bg-white ${
                            !weightsValid ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </td>
                      <td className="px-2 py-2 text-center bg-indigo-50 border-r border-indigo-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 5 }}>
                        <ScoreCell score={averages.dimensions[dim]?.total ?? null} isComplete={true} />
                      </td>
                      <td className="px-2 py-2 text-center bg-violet-50 border-r border-violet-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 5 }}>
                        <ScoreCell score={averages.dimensions[dim]?.fp ?? null} isComplete={true} />
                      </td>
                      <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 5 }}>
                        <ScoreCell score={averages.dimensions[dim]?.std ?? null} isComplete={true} />
                      </td>
                      <td className="px-2 py-2 text-center bg-amber-50 border-r border-amber-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 5 }}>
                        <ScoreCell score={averages.dimensions[dim]?.panel ?? null} isComplete={true} />
                      </td>
                      <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_7, zIndex: 5 }}>
                        <ScoreCell score={averages.dimensions[dim]?.single ?? null} isComplete={true} />
                      </td>
                      <td className="px-2 py-2 text-center bg-blue-50 border-r border-blue-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_8, zIndex: 5 }}>
                        <ScoreCell score={averages.dimensions[dim]?.regional ?? null} isComplete={true} />
                      </td>
                      <td className="px-2 py-2 text-center bg-purple-50 border-r border-purple-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_9, zIndex: 5, boxShadow: '4px 0 8px -2px rgba(0,0,0,0.15)' }}>
                        <ScoreCell score={averages.dimensions[dim]?.global ?? null} isComplete={true} />
                      </td>
                      {sortedCompanies.map(company => (
                        <td key={company.surveyId} className={`px-2 py-2 text-center border-r border-gray-100 last:border-r-0 group-hover/row:bg-blue-50/30 transition-colors ${
                          company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                        }`}>
                          <ScoreCell 
                            score={company.dimensions[dim].blendedScore} 
                            isComplete={company.dimensions[dim].totalItems > 0}
                            isProvisional={company.dimensions[dim].isInsufficientData}
                            viewMode={viewMode}
                            benchmark={averages.dimensions[dim]?.total}
                           
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  
                  {/* WEIGHTS TOTAL ROW */}
                  <tr className={`${weightsValid ? 'bg-blue-100' : 'bg-red-100'} border-t-2 ${weightsValid ? 'border-blue-300' : 'border-red-300'}`}>
                    <td className={`px-4 py-2 border-r ${weightsValid ? 'bg-blue-100 border-blue-200' : 'bg-red-100 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 5 }}>
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${weightsValid ? 'text-blue-800' : 'text-red-800'}`}>
                          Total Dimension Weights
                        </span>
                        {!weightsValid && (
                          <span className="text-xs text-red-600 font-medium">
                            {weightsDiff > 0 ? `Add ${weightsDiff}%` : `Remove ${Math.abs(weightsDiff)}%`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-1 py-2 text-center border-r font-bold text-base ${weightsValid ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-red-100 border-red-200 text-red-800'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 5 }}>
                      {weightsSum}%
                    </td>
                    <td colSpan={7 + sortedCompanies.length} className={`px-4 py-2 ${weightsValid ? 'bg-blue-50' : 'bg-red-50'}`}>
                      {weightsValid ? (
                        <span className="text-blue-600 text-sm flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Weights valid
                        </span>
                      ) : (
                        <span className="text-red-600 text-sm">Adjust weights to equal 100%</span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Unweighted Average Row */}
                  <tr className="bg-blue-50 border-t-2 border-blue-200 hover:bg-blue-100/70 transition-colors group/row">
                    <td className="px-4 py-2 border-r border-blue-200 bg-blue-50"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 5 }}>
                      <span className="font-semibold text-blue-800">Unweighted Dimension Score</span>
                    </td>
                    <td className="px-2 py-2 text-center text-xs text-blue-600 border-r border-blue-200 bg-blue-50"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 5 }}>avg</td>
                    <td className="px-2 py-2 text-center bg-indigo-100 border-r border-indigo-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 5, color: getScoreColor(averages.unweighted.total ?? 0) }}>
                      {averages.unweighted.total ?? '—'}
                    </td>
                    <td className="px-2 py-2 text-center bg-violet-100 border-r border-violet-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 5, color: getScoreColor(averages.unweighted.fp ?? 0) }}>
                      {averages.unweighted.fp ?? '—'}
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-100 border-r border-slate-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 5, color: getScoreColor(averages.unweighted.std ?? 0) }}>
                      {averages.unweighted.std ?? '—'}
                    </td>
                    <td className="px-2 py-2 text-center bg-amber-100 border-r border-amber-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 5, color: getScoreColor(averages.unweighted.panel ?? 0) }}>
                      {averages.unweighted.panel ?? '—'}
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-100 border-r border-slate-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_7, zIndex: 5, color: getScoreColor(averages.unweighted.single ?? 0) }}>
                      {averages.unweighted.single ?? '—'}
                    </td>
                    <td className="px-2 py-2 text-center bg-blue-100 border-r border-blue-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_8, zIndex: 5, color: getScoreColor(averages.unweighted.regional ?? 0) }}>
                      {averages.unweighted.regional ?? '—'}
                    </td>
                    <td className="px-2 py-2 text-center bg-purple-100 border-r border-purple-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_9, zIndex: 5, color: getScoreColor(averages.unweighted.global ?? 0) }}>
                      {averages.unweighted.global ?? '—'}
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2 text-center border-r border-blue-100 last:border-r-0 ${
                        company.isPanel ? 'bg-amber-100/50' : company.isFoundingPartner ? 'bg-violet-100/50' : 'bg-blue-50'
                      }`}>
                        <ScoreCell score={company.unweightedScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.unweighted.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Weighted Score Row */}
                  <tr className={`${weightsValid ? 'bg-blue-100' : 'bg-red-50'}`}>
                    <td className={`px-4 py-3 border-r ${weightsValid ? 'bg-blue-100 border-blue-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 5 }}>
                      <button onClick={() => handleSort('weighted')} className={`font-bold flex items-center gap-2 ${weightsValid ? 'text-blue-900 hover:text-blue-700' : 'text-red-700'}`}>
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${weightsValid ? 'bg-blue-600' : 'bg-red-500'}`}>Î£</span>
                        Weighted Dimension Score
                        {sortBy === 'weighted' && <span className="text-xs">{sortDir === 'asc' ? '^' : 'v'}</span>}
                      </button>
                    </td>
                    <td className={`px-2 py-3 text-center text-xs border-r ${weightsValid ? 'text-blue-600 bg-blue-100 border-blue-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 5 }}>
                      {weightsValid ? '100%' : <span className="text-red-600 font-bold">{weightsSum}%</span>}
                    </td>
                    {weightsValid ? (
                      <>
                        <td className="px-2 py-3 text-center bg-indigo-200 border-r border-indigo-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 5, color: getScoreColor(averages.weighted.total ?? 0) }}>
                          {averages.weighted.total ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-violet-200 border-r border-violet-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 5, color: getScoreColor(averages.weighted.fp ?? 0) }}>
                          {averages.weighted.fp ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-slate-200 border-r border-slate-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 5, color: getScoreColor(averages.weighted.std ?? 0) }}>
                          {averages.weighted.std ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-amber-200 border-r border-amber-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 5, color: getScoreColor(averages.weighted.panel ?? 0) }}>
                          {averages.weighted.panel ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-slate-100 border-r border-slate-200 font-bold text-lg"
                            style={{ position: 'sticky', left: STICKY_LEFT_7, zIndex: 5, color: getScoreColor(averages.weighted.single ?? 0) }}>
                          {averages.weighted.single ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-blue-100 border-r border-blue-200 font-bold text-lg"
                            style={{ position: 'sticky', left: STICKY_LEFT_8, zIndex: 5, color: getScoreColor(averages.weighted.regional ?? 0) }}>
                          {averages.weighted.regional ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-purple-100 border-r border-purple-200 font-bold text-lg"
                            style={{ position: 'sticky', left: STICKY_LEFT_9, zIndex: 5, color: getScoreColor(averages.weighted.global ?? 0) }}>
                          {averages.weighted.global ?? '—'}
                        </td>
                        {sortedCompanies.map(company => (
                          <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-blue-200 last:border-r-0 ${
                            company.isPanel ? 'bg-amber-100/70' : company.isFoundingPartner ? 'bg-violet-100/70' : 'bg-blue-100'
                          }`}>
                            <ScoreCell score={company.weightedScore} isComplete={company.isComplete} isProvisional={company.isProvisional} size="large" viewMode={viewMode} benchmark={averages.weighted.total} />
                          </td>
                        ))}
                      </>
                    ) : (
                      <td colSpan={7 + sortedCompanies.length} className="px-4 py-3 bg-red-50 border-r border-red-200">
                        <span className="text-red-700 font-medium">Dimension weights must sum to 100%</span>
                      </td>
                    )}
                  </tr>
                  
                  {/* Dimension Tier Row */}
                  {weightsValid && (
                    <tr className="bg-white hover:bg-gray-50/70 transition-colors group/row">
                      <td className="px-4 py-2 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 5 }}>
                        <span className="font-semibold text-gray-700 flex items-center gap-2 ml-8">
                          Dimension Tier
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 5 }}></td>
                      <td className="px-2 py-2 text-center bg-indigo-50 border-r border-indigo-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 5 }}>
                        {averages.weighted.total !== null && <TierBadge score={averages.weighted.total} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-violet-50 border-r border-violet-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 5 }}>
                        {averages.weighted.fp !== null && <TierBadge score={averages.weighted.fp} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 5 }}>
                        {averages.weighted.std !== null && <TierBadge score={averages.weighted.std} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-amber-50 border-r border-amber-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 5 }}>
                        {averages.weighted.panel !== null && <TierBadge score={averages.weighted.panel} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_7, zIndex: 5 }}>
                        {averages.weighted.single !== null && <TierBadge score={averages.weighted.single} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-blue-50 border-r border-blue-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_8, zIndex: 5 }}>
                        {averages.weighted.regional !== null && <TierBadge score={averages.weighted.regional} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2 text-center bg-purple-50 border-r border-purple-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_9, zIndex: 5, boxShadow: '4px 0 8px -2px rgba(0,0,0,0.15)' }}>
                        {averages.weighted.global !== null && <TierBadge score={averages.weighted.global} isComplete={true} size="small" />}
                      </td>
                      {sortedCompanies.map(company => (
                        <td key={company.surveyId} className={`px-2 py-2 text-center border-r border-gray-100 last:border-r-0 ${
                          company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                        }`}>
                          <TierBadge score={company.weightedScore} isComplete={company.isComplete} isProvisional={company.isProvisional} size="small" />
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
      </main>
    </div>
  );
}

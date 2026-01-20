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
 * 10. Geo multiplier: Single-country companies now get 0.90 (same as "varies"), not 1.0
 *     - 1.0 = Multi-country + Consistent (earned top tier)
 *     - 0.90 = Single-country OR Multi-country + Varies
 *     - 0.75 = Multi-country + Select locations only
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
  weightedDim: 90,
  depth: 0,
  maturity: 5,
  breadth: 5,
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
    if (s === 'unsure' || s.includes('unsure')) return { points: null, isUnsure: true };
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
  // Single-country companies (no geo question asked) get 0.90 - same as "varies"
  // They didn't face the challenge of maintaining consistency across borders
  if (geoResponse === undefined || geoResponse === null) return 0.90;
  
  if (typeof geoResponse === 'number') {
    switch (geoResponse) {
      case 1: return 0.75;  // Select locations only
      case 2: return 0.90;  // Varies by location
      case 3: return 1.0;   // Consistent globally
      default: return 0.90;
    }
  }
  
  const s = String(geoResponse).toLowerCase();
  if (s.includes('consistent') || s.includes('generally consistent')) return 1.0;
  if (s.includes('vary') || s.includes('varies')) return 0.90;
  if (s.includes('select') || s.includes('only available in select')) return 0.75;
  return 0.90;  // Default to single-country treatment
}

// ============================================
// FOLLOW-UP SCORING FOR WEIGHTED BLEND
// ============================================

function scoreD1PaidLeave(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  // Order matters: check most specific ranges FIRST to avoid substring matching issues
  if (v.includes('does not apply')) return 0;
  if (v.includes('13 weeks or more') || v.includes('13+ weeks') || (v.includes('13') && v.includes('more'))) return 100;
  if (v.includes('9 to') && v.includes('13')) return 70;   // "9 to less than 13"
  if (v.includes('5 to') && v.includes('9')) return 40;    // "5 to less than 9"  
  if (v.includes('3 to') && v.includes('5')) return 20;    // "3 to less than 5"
  if (v.includes('1 to') && v.includes('3')) return 10;    // "1 to less than 3"
  return 0;
}

function scoreD1PartTime(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  // Order matters: check most specific first
  if (v.includes('no additional')) return 0;
  if (v.includes('medically necessary')) return 100;
  if (v.includes('26 weeks or more') || v.includes('26+ weeks') || (v.includes('26') && v.includes('more'))) return 80;
  if (v.includes('13 to') && v.includes('26')) return 50;  // "13 to less than 26"
  if (v.includes('5 to') && v.includes('13')) return 30;   // "5 to less than 13"
  if (v.includes('case-by-case')) return 40;
  if (v.includes('4 weeks') || v.includes('up to 4')) return 10;
  return 0;
}

function scoreD3Training(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  // Order matters: check ranges before single values
  if (v.includes('less than 10')) return 0;
  if (v === '100%' || v.includes('100% of')) return 100;
  if (v.includes('75%') && v.includes('100%')) return 80;  // "75% to less than 100%"
  if (v.includes('50%') && v.includes('75%')) return 50;   // "50% to less than 75%"
  if (v.includes('25%') && v.includes('50%')) return 30;   // "25% to less than 50%"
  if (v.includes('10%') && v.includes('25%')) return 10;   // "10% to less than 25%"
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
  if (v.includes('do not actively')) return 0;
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
      const d31 = dimData?.d31;
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
  const or1 = currentSupport.or1 || '';
  const v = String(or1).toLowerCase();
  
  if (v.includes('comprehensive')) return 100;
  if (v.includes('enhanced')) return 80;
  if (v.includes('moderate')) return 50;
  if (v.includes('developing')) return 20;
  if (v.includes('legal minimum')) return 0;  // FIXED: Was 30, now 0
  if (v.includes('no formal')) return 0;
  return 0;
}

function calculateBreadthScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const scores: number[] = [];
  
  const cb3a = currentSupport.cb3a || '';
  const v = String(cb3a).toLowerCase();
  if (v.includes('yes') && v.includes('additional support')) {
    scores.push(100);
  } else if (v.includes('developing') || v.includes('currently developing')) {
    scores.push(50);
  } else {
    scores.push(0);
  }
  
  const cb3b = currentSupport.cb3b;
  if (cb3b && Array.isArray(cb3b)) {
    const cb3bScore = Math.min(100, Math.round((cb3b.length / 6) * 100));
    scores.push(cb3bScore);
  } else {
    scores.push(0);
  }
  
  const cb3c = currentSupport.cb3c;
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
  return { name: 'Beginning', color: '#374151', bg: '#F3F4F6', border: '#D1D5DB' };
}

// ============================================
// EDUCATIONAL MODALS
// ============================================

function DimensionScoringModal({ onClose, defaultWeights }: { onClose: () => void; defaultWeights: Record<number, number> }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
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
                <div className="flex justify-between"><span>Multi-country + Varies by location</span><span className="font-bold text-amber-600">x0.90</span></div>
                <div className="flex justify-between"><span>Single-country (geo question not applicable)</span><span className="font-bold text-amber-600">x0.90</span></div>
                <div className="flex justify-between"><span>Multi-country + Only available in select locations</span><span className="font-bold text-red-600">x0.75</span></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                Note: Single-country companies receive the same multiplier as multi-country companies that vary by location. 
                Only multi-country companies demonstrating consistent global policies earn the full 1.0 multiplier.
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
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
    if (score >= 75) return 'Leading';
    if (score >= 60) return 'Progressing';
    if (score >= 40) return 'Emerging';
    return 'Developing';
  };
  
  // Composite tier counts
  const compositeCounts = {
    leading: filteredCompanies.filter(c => c.compositeScore >= 75).length,
    progressing: filteredCompanies.filter(c => c.compositeScore >= 60 && c.compositeScore < 75).length,
    emerging: filteredCompanies.filter(c => c.compositeScore >= 40 && c.compositeScore < 60).length,
    developing: filteredCompanies.filter(c => c.compositeScore < 40).length,
  };
  
  // Provisional count
  const provisionalCount = filteredCompanies.filter(c => c.isProvisional).length;
  
  // Dimension tier counts
  const getDimensionTierCounts = (dimNum: number) => {
    const scores = filteredCompanies
      .map(c => c.dimensions[dimNum]?.blendedScore ?? c.dimensions[dimNum]?.adjustedScore ?? null)
      .filter((s): s is number => s !== null);
    
    return {
      leading: scores.filter(s => s >= 75).length,
      progressing: scores.filter(s => s >= 60 && s < 75).length,
      emerging: scores.filter(s => s >= 40 && s < 60).length,
      developing: scores.filter(s => s < 40).length,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
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
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total Complete Companies:</span>
                <span className="text-2xl font-bold text-gray-900">{filteredCompanies.length}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-amber-700 font-medium">Provisional Scores (4+ dims with 40%+ Unsure):</span>
                <span className="text-xl font-bold text-amber-600">{provisionalCount}</span>
              </div>
            </div>
            
            {/* Composite Tier Counts */}
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">★</span>
                Composite Score Tiers
              </h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <div className="text-3xl font-bold text-blue-700">{compositeCounts.leading}</div>
                  <div className="text-sm font-medium text-blue-600">Leading</div>
                  <div className="text-xs text-blue-500">75+</div>
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
                      <th className="text-center py-2 px-3 font-semibold text-blue-700">Leading<br/><span className="font-normal text-xs">75+</span></th>
                      <th className="text-center py-2 px-3 font-semibold text-amber-700">Progressing<br/><span className="font-normal text-xs">60-74</span></th>
                      <th className="text-center py-2 px-3 font-semibold text-orange-700">Emerging<br/><span className="font-normal text-xs">40-59</span></th>
                      <th className="text-center py-2 px-3 font-semibold text-red-700">Developing<br/><span className="font-normal text-xs">&lt;40</span></th>
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
                          <td className="py-2 px-3 text-center font-bold text-blue-700">{counts.leading}</td>
                          <td className="py-2 px-3 text-center font-bold text-amber-700">{counts.progressing}</td>
                          <td className="py-2 px-3 text-center font-bold text-orange-700">{counts.emerging}</td>
                          <td className="py-2 px-3 text-center font-bold text-red-700">{counts.developing}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            
            {/* Tier Thresholds Reference */}
            <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-600">
              <strong>Tier Thresholds:</strong> Leading (75+) | Progressing (60-74) | Emerging (40-59) | Developing (&lt;40)
            </div>
          </div>
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
  const [sortBy, setSortBy] = useState<'name' | 'weighted' | 'composite'>('composite');
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
      return sortDir === 'desc' ? -comparison : comparison;
    });
  }, [companyScores, sortBy, sortDir, filterType, filterComplete, includePanel]);

  const averages = useMemo(() => {
    const baseComplete = companyScores.filter(c => c.isComplete);
    const complete = includePanel ? baseComplete : baseComplete.filter(c => !c.isPanel);
    const fp = complete.filter(c => c.isFoundingPartner && !c.isPanel);
    const std = complete.filter(c => !c.isFoundingPartner && !c.isPanel);
    const panel = baseComplete.filter(c => c.isPanel);
    
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
      }])),
      unweighted: { total: calcAvg(complete, 'unweightedScore'), fp: calcAvg(fp, 'unweightedScore'), std: calcAvg(std, 'unweightedScore'), panel: calcAvg(panel, 'unweightedScore') },
      weighted: { total: calcAvg(complete, 'weightedScore'), fp: calcAvg(fp, 'weightedScore'), std: calcAvg(std, 'weightedScore'), panel: calcAvg(panel, 'weightedScore') },
      maturity: { total: calcAvg(complete, 'maturityScore'), fp: calcAvg(fp, 'maturityScore'), std: calcAvg(std, 'maturityScore'), panel: calcAvg(panel, 'maturityScore') },
      breadth: { total: calcAvg(complete, 'breadthScore'), fp: calcAvg(fp, 'breadthScore'), std: calcAvg(std, 'breadthScore'), panel: calcAvg(panel, 'breadthScore') },
      composite: { total: calcAvg(complete, 'compositeScore'), fp: calcAvg(fp, 'compositeScore'), std: calcAvg(std, 'compositeScore'), panel: calcAvg(panel, 'compositeScore') },
      counts: { total: complete.length, fp: fp.length, std: std.length, panel: panel.length },
    };
  }, [companyScores, includePanel]);

  const handleSort = (column: 'name' | 'weighted' | 'composite') => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {showDimensionModal && <DimensionScoringModal onClose={() => setShowDimensionModal(false)} defaultWeights={DEFAULT_DIMENSION_WEIGHTS} />}
      {showCompositeModal && <CompositeModal onClose={() => setShowCompositeModal(false)} compositeWeights={compositeWeights} />}
      {showTierStatsModal && <TierStatsModal onClose={() => setShowTierStatsModal(false)} companyScores={companyScores} includePanel={includePanel} />}

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white py-5 px-8 shadow-xl sticky top-0 z-40">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                Best Companies Scoring Report
              </h1>
              <p className="text-indigo-200 text-sm mt-1">Workplace Support Excellence Index</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                <button onClick={scrollLeft} className="p-2 hover:bg-white/20 rounded transition-colors" title="Scroll Left">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs px-2">Scroll</span>
                <button onClick={scrollRight} className="p-2 hover:bg-white/20 rounded transition-colors" title="Scroll Right">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <button onClick={() => window.print()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                Print
              </button>
              <button onClick={() => router.push('/admin')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                ← Back
              </button>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="mt-4 flex items-center justify-between bg-white/5 rounded-xl px-5 py-3">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-indigo-300">Total:</span>
                <span className="font-bold text-xl">{companyScores.filter(c => includePanel || !c.isPanel).length}</span>
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
              <div className="border-l border-white/20 pl-4 flex items-center gap-2">
                <span className="text-green-300">Complete:</span>
                <span className="font-bold">{companyScores.filter(c => c.isComplete && (includePanel || !c.isPanel)).length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-400/30">
                <input
                  type="checkbox"
                  checked={includePanel}
                  onChange={(e) => setIncludePanel(e.target.checked)}
                  className="rounded border-amber-400/50 bg-white/10 text-amber-400"
                />
                <span className="text-amber-200">Include Panel</span>
              </label>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-white/10 text-white border-0 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="all" className="text-gray-900">All</option>
                <option value="fp" className="text-gray-900">FP Only</option>
                <option value="standard" className="text-gray-900">Standard Only</option>
                <option value="panel" className="text-gray-900">Panel Only</option>
              </select>
              
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterComplete}
                  onChange={(e) => setFilterComplete(e.target.checked)}
                  className="rounded border-white/30 bg-white/10 text-indigo-400"
                />
                <span>Complete Only</span>
              </label>
              
              <div className="flex bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('score')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'score' ? 'bg-white text-indigo-900' : 'text-white hover:bg-white/10'}`}
                >
                  Scores
                </button>
                <button
                  onClick={() => setViewMode('index')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'index' ? 'bg-white text-indigo-900' : 'text-white hover:bg-white/10'}`}
                >
                  Index
                </button>
              </div>
              
              {/* Scoring Info & Reset */}
              <div className="border-l border-white/20 pl-4 flex items-center gap-2">
                <button 
                  onClick={() => setShowCompositeModal(true)}
                  className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Composite Scoring
                </button>
                <button 
                  onClick={() => setShowDimensionModal(true)}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Dimension Scoring
                </button>
                <button 
                  onClick={() => setShowTierStatsModal(true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Tier Stats
                </button>
                <button 
                  onClick={() => {
                    setCompositeWeights({ ...DEFAULT_COMPOSITE_WEIGHTS });
                    setBlendWeights({ ...DEFAULT_BLEND_WEIGHTS });
                    setWeights({ ...DEFAULT_DIMENSION_WEIGHTS });
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Reset All Weights
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* BLEND SETTINGS PANEL - Simple, all in one place */}
        <div className="mb-4 bg-purple-50 rounded-xl border border-purple-200 overflow-hidden">
          <button
            onClick={() => setShowBlendSettings(!showBlendSettings)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">S</span>
              <span className="font-semibold text-purple-900">Blend Weight Settings</span>
              <span className="text-purple-600 text-sm">(D1, D3, D12, D13 use Grid + Follow-up blend)</span>
            </div>
            <svg className={`w-5 h-5 text-purple-600 transition-transform ${showBlendSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showBlendSettings && (
            <div className="px-4 pb-4 border-t border-purple-200 bg-white">
              <div className="pt-4 grid grid-cols-4 gap-4">
                {(['d1', 'd3', 'd12', 'd13'] as const).map((key) => {
                  const dimNum = parseInt(key.substring(1));
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="font-semibold text-gray-800 text-sm mb-2">
                        D{dimNum}: {DIMENSION_NAMES[dimNum].split(' ')[0]}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 w-12">Grid:</label>
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
                          className="w-14 px-2 py-1 text-sm text-center border border-gray-300 rounded"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <label className="text-xs text-gray-600 w-12">Follow:</label>
                        <span className="w-14 px-2 py-1 text-sm text-center bg-gray-100 rounded">
                          {blendWeights[key].followUp}
                        </span>
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setBlendWeights({ ...DEFAULT_BLEND_WEIGHTS })}
                  className="px-3 py-1.5 text-xs text-purple-600 hover:text-purple-800 border border-purple-300 rounded hover:bg-purple-50"
                >
                  Reset All to 85/15
                </button>
              </div>
            </div>
          )}
        </div>

        {sortedCompanies.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessments Found</h3>
            <p className="text-gray-500">No companies match your current filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div ref={tableRef} className="overflow-x-auto max-h-[calc(100vh-300px)]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-40">
                  <tr className="bg-slate-800 text-white">
                    <th colSpan={2} className="px-4 py-2 text-left text-xs font-medium border-r border-slate-600"
                        style={{ position: 'sticky', left: 0, zIndex: 45, backgroundColor: '#1E293B' }}>
                      METRICS
                    </th>
                    <th colSpan={4} className="px-4 py-2 text-center text-xs font-medium bg-indigo-700 border-r border-indigo-500">
                      BENCHMARKS
                    </th>
                    <th colSpan={sortedCompanies.length} className="px-4 py-2 text-center text-xs font-medium bg-slate-700">
                      COMPANIES ({sortedCompanies.length})
                    </th>
                  </tr>
                  
                  <tr className="bg-slate-700 text-white">
                    <th className="px-4 py-3 text-left font-semibold border-r border-slate-600"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 45, minWidth: COL1_WIDTH, backgroundColor: '#334155' }}>
                      <button onClick={() => handleSort('name')} className="hover:text-indigo-300 flex items-center gap-1">
                        Metric {sortBy === 'name' && <span className="text-xs">{sortDir === 'asc' ? '^' : 'v'}</span>}
                      </button>
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-slate-600"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 45, width: COL2_WIDTH, backgroundColor: '#334155' }}>
                      Wt %
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-indigo-600 border-r border-indigo-500"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 45, width: COL_AVG_WIDTH, backgroundColor: '#4F46E5' }}>
                      ALL
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-violet-600 border-r border-violet-500"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 45, width: COL_AVG_WIDTH, backgroundColor: '#7C3AED' }}>
                      FP
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-slate-500 border-r border-slate-400"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 45, width: COL_AVG_WIDTH, backgroundColor: '#64748B' }}>
                      STD
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-amber-600 border-r border-amber-500"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 45, width: COL_AVG_WIDTH, backgroundColor: '#D97706' }}>
                      PANEL
                    </th>
                    {sortedCompanies.map(company => (
                      <th key={company.surveyId} 
                          className={`px-3 py-2 text-center font-medium border-r last:border-r-0 ${
                            company.isPanel ? 'bg-amber-600' : company.isFoundingPartner ? 'bg-violet-600' : 'bg-slate-600'
                          }`}
                          style={{ minWidth: 100 }}>
                        <Link href={`/admin/profile/${company.surveyId}`} className="text-xs hover:underline block truncate text-white" title={company.companyName}>
                          {company.companyName.length > 12 ? company.companyName.substring(0, 12) + '...' : company.companyName}
                        </Link>
                        <span className="text-[10px] opacity-70 block">{company.completedDimCount}/13</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                
                <tbody>
                  {/* ============================================ */}
                  {/* SECTION 1: COMPOSITE SCORE */}
                  {/* ============================================ */}
                  
                  <tr>
                    <td colSpan={6 + sortedCompanies.length} className="bg-gradient-to-r from-purple-100 to-indigo-100 border-y-2 border-purple-300">
                      <div className="px-4 py-2.5 flex items-center gap-3">
                        <span className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">★</span>
                        <div>
                          <span className="font-bold text-purple-900 text-lg">Composite Score</span>
                          <span className="text-purple-600 text-sm ml-2">(Overall Ranking)</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Composite Score Row */}
                  <tr className={`${compositeWeightsValid && weightsValid ? 'bg-gradient-to-r from-purple-50 to-indigo-50' : 'bg-red-50'}`}>
                    <td className={`px-4 py-3 border-r ${compositeWeightsValid && weightsValid ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <button onClick={() => handleSort('composite')} className={`font-bold flex items-center gap-2 ${compositeWeightsValid && weightsValid ? 'text-purple-900 hover:text-purple-700' : 'text-red-700'}`}>
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${compositeWeightsValid && weightsValid ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-red-500'}`}>★</span>
                        Composite Score
                        {sortBy === 'composite' && <span className="text-xs">{sortDir === 'asc' ? '^' : 'v'}</span>}
                      </button>
                    </td>
                    <td className={`px-2 py-3 text-center text-xs border-r ${compositeWeightsValid && weightsValid ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      {compositeWeightsValid && weightsValid ? '100%' : <span className="text-red-600 font-bold">{compositeWeightsSum}%</span>}
                    </td>
                    {compositeWeightsValid && weightsValid ? (
                      <>
                        <td className="px-2 py-3 text-center bg-purple-200 border-r border-purple-300 font-black text-2xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10, color: getScoreColor(averages.composite.total ?? 0) }}>
                          {averages.composite.total ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-violet-200 border-r border-violet-300 font-black text-2xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10, color: getScoreColor(averages.composite.fp ?? 0) }}>
                          {averages.composite.fp ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-slate-200 border-r border-slate-300 font-black text-2xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10, color: getScoreColor(averages.composite.std ?? 0) }}>
                          {averages.composite.std ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-amber-200 border-r border-amber-300 font-black text-2xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10, color: getScoreColor(averages.composite.panel ?? 0) }}>
                          {averages.composite.panel ?? '—'}
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
                      <td colSpan={4 + sortedCompanies.length} className="px-4 py-3 bg-red-50 border-r border-red-200">
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
                      <td className="px-4 py-2.5 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                        <span className="font-semibold text-gray-700 flex items-center gap-2 ml-8">
                          Composite Tier
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}></td>
                      <td className="px-2 py-2.5 text-center bg-indigo-50 border-r border-indigo-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                        {averages.composite.total !== null && <TierBadge score={averages.composite.total} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2.5 text-center bg-violet-50 border-r border-violet-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                        {averages.composite.fp !== null && <TierBadge score={averages.composite.fp} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2.5 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                        {averages.composite.std !== null && <TierBadge score={averages.composite.std} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2.5 text-center bg-amber-50 border-r border-amber-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                        {averages.composite.panel !== null && <TierBadge score={averages.composite.panel} isComplete={true} size="small" />}
                      </td>
                      {sortedCompanies.map(company => (
                        <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-gray-100 last:border-r-0 ${
                          company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                        }`}>
                          <TierBadge score={company.compositeScore} isComplete={company.isComplete} isProvisional={company.isProvisional} size="small" />
                        </td>
                      ))}
                    </tr>
                  )}
                  
                  {/* Composite Components */}
                  <tr>
                    <td colSpan={6 + sortedCompanies.length} className="bg-purple-50/50 border-b border-purple-100">
                      <div className="px-4 py-1.5 flex items-center gap-2 text-xs text-purple-700">
                        <span className="font-semibold">Composite =</span>
                        <span>W-{compositeWeights.weightedDim}% + M-{compositeWeights.maturity}% + B-{compositeWeights.breadth}%</span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Weighted Score Component */}
                  <tr className="bg-white">
                    <td className="px-4 py-2 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-800 flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs font-bold">W</span>
                        Weighted Dimension Score
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.weightedDim}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, weightedDim: parseInt(e.target.value) || 0 }))}
                        className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-2 py-2 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                      <ScoreCell score={averages.weighted.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-violet-50 border-r border-violet-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                      <ScoreCell score={averages.weighted.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                      <ScoreCell score={averages.weighted.std} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                      <ScoreCell score={averages.weighted.panel} isComplete={true} />
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
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-800 flex items-center gap-2">
                        <span className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 text-xs font-bold">M</span>
                        Maturity Score
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.maturity}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, maturity: parseInt(e.target.value) || 0 }))}
                        className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-2 py-2 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                      <ScoreCell score={averages.maturity.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-violet-50 border-r border-violet-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                      <ScoreCell score={averages.maturity.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                      <ScoreCell score={averages.maturity.std} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                      <ScoreCell score={averages.maturity.panel} isComplete={true} />
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
                  <tr className="bg-white">
                    <td className="px-4 py-2 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-800 flex items-center gap-2">
                        <span className="w-5 h-5 bg-violet-100 rounded flex items-center justify-center text-violet-600 text-xs font-bold">B</span>
                        Breadth Score
                      </span>
                    </td>
                    <td className="px-1 py-2 text-center bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.breadth}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, breadth: parseInt(e.target.value) || 0 }))}
                        className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-2 py-2 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                      <ScoreCell score={averages.breadth.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-violet-50 border-r border-violet-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                      <ScoreCell score={averages.breadth.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                      <ScoreCell score={averages.breadth.std} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                      <ScoreCell score={averages.breadth.panel} isComplete={true} />
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
                    <td colSpan={6 + sortedCompanies.length} className="bg-blue-50 border-y-2 border-blue-200">
                      <div className="px-4 py-2.5 flex items-center gap-3">
                        <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">D</span>
                        <div>
                          <span className="font-bold text-blue-900 text-lg">Dimension Scores</span>
                          <span className="text-blue-600 text-sm ml-2">(13 Assessment Areas)</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Dimension Rows */}
                  {DIMENSION_ORDER.map((dim, idx) => (
                    <tr key={dim} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className={`px-4 py-2 border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                        <span className="font-medium text-gray-900">
                          <span className="text-blue-600 font-bold">D{dim}:</span> {DIMENSION_NAMES[dim]}
                          {[1, 3, 12, 13].includes(dim) && (
                            <span className="text-purple-500 text-xs ml-1" title="Uses blend with follow-up">*</span>
                          )}
                        </span>
                      </td>
                      <td className={`px-1 py-1 text-center border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
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
                          style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                        <ScoreCell score={averages.dimensions[dim]?.total ?? null} isComplete={true} />
                      </td>
                      <td className="px-2 py-2 text-center bg-violet-50 border-r border-violet-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                        <ScoreCell score={averages.dimensions[dim]?.fp ?? null} isComplete={true} />
                      </td>
                      <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                        <ScoreCell score={averages.dimensions[dim]?.std ?? null} isComplete={true} />
                      </td>
                      <td className="px-2 py-2 text-center bg-amber-50 border-r border-amber-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                        <ScoreCell score={averages.dimensions[dim]?.panel ?? null} isComplete={true} />
                      </td>
                      {sortedCompanies.map(company => (
                        <td key={company.surveyId} className={`px-2 py-2 text-center border-r border-gray-100 last:border-r-0 ${
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
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
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
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      {weightsSum}%
                    </td>
                    <td colSpan={4 + sortedCompanies.length} className={`px-4 py-2 ${weightsValid ? 'bg-blue-50' : 'bg-red-50'}`}>
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
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="px-4 py-2.5 border-r border-blue-200 bg-blue-50"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-semibold text-blue-800">Unweighted Dimension Score</span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-blue-600 border-r border-blue-200 bg-blue-50"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>avg</td>
                    <td className="px-2 py-2.5 text-center bg-indigo-100 border-r border-indigo-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10, color: getScoreColor(averages.unweighted.total ?? 0) }}>
                      {averages.unweighted.total ?? '—'}
                    </td>
                    <td className="px-2 py-2.5 text-center bg-violet-100 border-r border-violet-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10, color: getScoreColor(averages.unweighted.fp ?? 0) }}>
                      {averages.unweighted.fp ?? '—'}
                    </td>
                    <td className="px-2 py-2.5 text-center bg-slate-100 border-r border-slate-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10, color: getScoreColor(averages.unweighted.std ?? 0) }}>
                      {averages.unweighted.std ?? '—'}
                    </td>
                    <td className="px-2 py-2.5 text-center bg-amber-100 border-r border-amber-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10, color: getScoreColor(averages.unweighted.panel ?? 0) }}>
                      {averages.unweighted.panel ?? '—'}
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-blue-100 last:border-r-0 ${
                        company.isPanel ? 'bg-amber-100/50' : company.isFoundingPartner ? 'bg-violet-100/50' : 'bg-blue-50'
                      }`}>
                        <ScoreCell score={company.unweightedScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.unweighted.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Weighted Score Row */}
                  <tr className={`${weightsValid ? 'bg-blue-100' : 'bg-red-50'}`}>
                    <td className={`px-4 py-3 border-r ${weightsValid ? 'bg-blue-100 border-blue-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <button onClick={() => handleSort('weighted')} className={`font-bold flex items-center gap-2 ${weightsValid ? 'text-blue-900 hover:text-blue-700' : 'text-red-700'}`}>
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${weightsValid ? 'bg-blue-600' : 'bg-red-500'}`}>Î£</span>
                        Weighted Dimension Score
                        {sortBy === 'weighted' && <span className="text-xs">{sortDir === 'asc' ? '^' : 'v'}</span>}
                      </button>
                    </td>
                    <td className={`px-2 py-3 text-center text-xs border-r ${weightsValid ? 'text-blue-600 bg-blue-100 border-blue-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      {weightsValid ? '100%' : <span className="text-red-600 font-bold">{weightsSum}%</span>}
                    </td>
                    {weightsValid ? (
                      <>
                        <td className="px-2 py-3 text-center bg-indigo-200 border-r border-indigo-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10, color: getScoreColor(averages.weighted.total ?? 0) }}>
                          {averages.weighted.total ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-violet-200 border-r border-violet-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10, color: getScoreColor(averages.weighted.fp ?? 0) }}>
                          {averages.weighted.fp ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-slate-200 border-r border-slate-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10, color: getScoreColor(averages.weighted.std ?? 0) }}>
                          {averages.weighted.std ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-amber-200 border-r border-amber-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10, color: getScoreColor(averages.weighted.panel ?? 0) }}>
                          {averages.weighted.panel ?? '—'}
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
                      <td colSpan={4 + sortedCompanies.length} className="px-4 py-3 bg-red-50 border-r border-red-200">
                        <span className="text-red-700 font-medium">Dimension weights must sum to 100%</span>
                      </td>
                    )}
                  </tr>
                  
                  {/* Dimension Tier Row */}
                  {weightsValid && (
                    <tr className="bg-white">
                      <td className="px-4 py-2.5 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                        <span className="font-semibold text-gray-700 flex items-center gap-2 ml-8">
                          Dimension Tier
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}></td>
                      <td className="px-2 py-2.5 text-center bg-indigo-50 border-r border-indigo-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                        {averages.weighted.total !== null && <TierBadge score={averages.weighted.total} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2.5 text-center bg-violet-50 border-r border-violet-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                        {averages.weighted.fp !== null && <TierBadge score={averages.weighted.fp} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2.5 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                        {averages.weighted.std !== null && <TierBadge score={averages.weighted.std} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-2.5 text-center bg-amber-50 border-r border-amber-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                        {averages.weighted.panel !== null && <TierBadge score={averages.weighted.panel} isComplete={true} size="small" />}
                      </td>
                      {sortedCompanies.map(company => (
                        <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-gray-100 last:border-r-0 ${
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
        
        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-5">
          <h3 className="font-bold text-gray-900 mb-3">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Score Colors</p>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#059669' }} />
                  <span>80-100</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#0284C7' }} />
                  <span>60-79</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#D97706' }} />
                  <span>40-59</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#DC2626' }} />
                  <span>0-39</span>
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Company Types</p>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded bg-violet-500" />
                  <span>Founding Partner</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded bg-slate-500" />
                  <span>Standard</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  <span>Panel</span>
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Data Quality</p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="ring-2 ring-amber-400 ring-offset-1 rounded px-2 py-0.5 font-bold">42</span>
                <span>= Over 40% "Unsure"</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Provisional Status</p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border-2 border-dashed border-amber-400 bg-amber-50 rounded-full text-amber-700 font-bold">
                  Leading<span className="text-amber-600">*</span>
                </span>
                <span>= 4+ dims have high Unsure</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

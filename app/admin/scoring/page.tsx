/**
 * AGGREGATE SCORING REPORT - UPDATED
 * 
 * Fixes applied:
 * 1. Follow-up blend weights adjustable per dimension (D1, D3, D12, D13)
 * 2. Maturity scoring fixed - "legal minimum" now gets 0 points
 * 3. Wt% column widened + totals row with adjustment helper
 * 4. Clear visual feedback when weights don't sum to 100%
 * 
 * SCORING MODEL:
 * - Dimensions 1, 3, 12, 13 use weighted blend: (user-adjustable) grid + follow-up quality
 * - Maturity = OR1 (Comprehensive=100, Enhanced=80, Moderate=50, Legal min=0, Developing=10, No formal=0)
 * - Breadth = Average of CB3a + CB3b + CB3c
 * - Composite = Weighted Dim × % + Maturity × % + Breadth × %
 */

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_DIMENSION_WEIGHTS: Record<number, number> = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3,
};

// Default blend weights for dimensions with follow-up questions (grid% / followup%)
const DEFAULT_BLEND_WEIGHTS: Record<number, { grid: number; followUp: number }> = {
  1: { grid: 85, followUp: 15 },   // Medical Leave
  3: { grid: 85, followUp: 15 },   // Manager Preparedness
  12: { grid: 85, followUp: 15 },  // Continuous Improvement
  13: { grid: 85, followUp: 15 },  // Communication
};

const DEFAULT_COMPOSITE_WEIGHTS = {
  weightedDim: 95,
  maturity: 3,
  breadth: 2,
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

// Dimensions that have follow-up questions (for blend weight adjustment)
const DIMENSIONS_WITH_FOLLOWUP = [1, 3, 12, 13];

const DIMENSION_ORDER = [4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12];

const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };
const INSUFFICIENT_DATA_THRESHOLD = 0.40;

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
  if (geoResponse === undefined || geoResponse === null) return 1.0;
  
  if (typeof geoResponse === 'number') {
    switch (geoResponse) {
      case 1: return 0.75;
      case 2: return 0.90;
      case 3: return 1.0;
      default: return 1.0;
    }
  }
  
  const s = String(geoResponse).toLowerCase();
  if (s.includes('consistent') || s.includes('generally consistent')) return 1.0;
  if (s.includes('vary') || s.includes('varies')) return 0.90;
  if (s.includes('select') || s.includes('only available in select')) return 0.75;
  return 1.0;
}

// ============================================
// FOLLOW-UP SCORING FOR WEIGHTED BLEND
// ============================================

function scoreD1PaidLeave(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('13') || v.includes('more')) return 100;
  if (v.includes('9') && v.includes('13')) return 70;
  if (v.includes('5') && v.includes('9')) return 40;
  if (v.includes('3') && v.includes('5')) return 20;
  if (v.includes('1') && v.includes('3')) return 10;
  if (v.includes('does not apply')) return 0;
  return 0;
}

function scoreD1PartTime(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('medically necessary')) return 100;
  if (v.includes('26') || (v.includes('26') && v.includes('more'))) return 80;
  if (v.includes('13') && v.includes('26')) return 50;
  if (v.includes('5') && v.includes('13')) return 30;
  if (v.includes('4 weeks') || v.includes('up to 4')) return 10;
  if (v.includes('case-by-case')) return 40;
  if (v.includes('no additional')) return 0;
  return 0;
}

function scoreD3Training(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v === '100%' || v.includes('100%')) return 100;
  if (v.includes('75') && v.includes('100')) return 80;
  if (v.includes('50') && v.includes('75')) return 50;
  if (v.includes('25') && v.includes('50')) return 30;
  if (v.includes('10') && v.includes('25')) return 10;
  if (v.includes('less than 10')) return 0;
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
// MATURITY & BREADTH SCORING (FIXED)
// ============================================

// Maturity = OR1 only - FIXED: Legal minimum now gets 0 points
function calculateMaturityScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const or1 = currentSupport.or1 || '';
  const v = String(or1).toLowerCase();
  
  // FIXED SCORING: Legal minimum = 0 (just meeting legal requirements isn't worthy of points)
  if (v.includes('comprehensive')) return 100;
  if (v.includes('enhanced')) return 80;
  if (v.includes('moderate')) return 50;
  if (v.includes('developing')) return 10;  // Small credit for effort
  if (v.includes('legal minimum')) return 0; // FIXED: Was 30, now 0
  if (v.includes('no formal')) return 0;
  return 0;
}

// Breadth = Average of (CB3a + CB3b + CB3c)
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
  blendWeights?: Record<number, { grid: number; followUp: number }>
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
  Object.values(mainGrid).forEach((status: any) => {
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
  
  // Apply weighted blend for D1, D3, D12, D13 using user-specified blend weights
  if (assessment && DIMENSIONS_WITH_FOLLOWUP.includes(dimNum)) {
    result.followUpScore = calculateFollowUpScore(dimNum, assessment);
    if (result.followUpScore !== null && blendWeights && blendWeights[dimNum]) {
      const gridWeight = blendWeights[dimNum].grid / 100;
      const followUpWeight = blendWeights[dimNum].followUp / 100;
      result.blendedScore = Math.round((result.adjustedScore * gridWeight) + (result.followUpScore * followUpWeight));
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
  maturityScore: number;
  breadthScore: number;
}

function calculateCompanyScores(
  assessment: Record<string, any>, 
  weights: Record<number, number>, 
  compositeWeights: typeof DEFAULT_COMPOSITE_WEIGHTS,
  blendWeights: Record<number, { grid: number; followUp: number }>
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
// COMPONENTS
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
      title={isHighUnsure ? 'High % of "Unsure" responses' : undefined}
    >
      {displayValue}
    </span>
  );
}

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

// Blend weight adjustment popover for dimensions with follow-up questions
function BlendWeightEditor({ 
  dimNum, 
  blendWeights, 
  onUpdate 
}: { 
  dimNum: number;
  blendWeights: { grid: number; followUp: number };
  onUpdate: (grid: number, followUp: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleGridChange = (value: number) => {
    const newGrid = Math.max(0, Math.min(100, value));
    onUpdate(newGrid, 100 - newGrid);
  };
  
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[10px] text-purple-600 hover:text-purple-800 underline decoration-dotted"
        title="Click to adjust grid/follow-up blend"
      >
        {blendWeights.grid}/{blendWeights.followUp}
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-48">
            <div className="text-xs font-medium text-gray-700 mb-2">
              D{dimNum} Blend Weights
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Grid Score:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={blendWeights.grid}
                    onChange={(e) => handleGridChange(parseInt(e.target.value) || 0)}
                    className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Follow-up:</span>
                <div className="flex items-center gap-1">
                  <span className="w-12 px-1 py-0.5 text-xs text-center bg-gray-100 rounded">
                    {blendWeights.followUp}
                  </span>
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => {
                  onUpdate(85, 15);
                }}
                className="text-[10px] text-gray-500 hover:text-gray-700"
              >
                Reset to 85/15
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[10px] text-purple-600 hover:text-purple-800 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// MODALS
// ============================================

function DimensionScoringModal({ onClose }: { onClose: () => void }) {
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
              </div>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">2</span>
                Blended Dimensions (D1, D3, D12, D13)
              </h3>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-purple-800 text-sm mb-2">
                  These dimensions have follow-up quality questions that are blended with the grid score:
                </p>
                <div className="bg-white rounded p-3 text-sm">
                  <strong>Blended Score</strong> = (Grid Score × Grid%) + (Follow-up Score × Follow-up%)
                </div>
                <p className="text-purple-600 text-xs mt-2">
                  Click the blend ratio (e.g., "85/15") in the table to adjust weights.
                </p>
              </div>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">3</span>
                Geographic Multiplier
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Generally consistent across all locations</span><span className="font-bold">×1.00</span></div>
                <div className="flex justify-between"><span>Vary across locations</span><span className="font-bold">×0.90</span></div>
                <div className="flex justify-between"><span>Only available in select locations</span><span className="font-bold">×0.75</span></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompositeScoringModal({ onClose }: { onClose: () => void }) {
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
            <section>
              <h3 className="font-bold text-gray-900 mb-3">Composite Formula</h3>
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-5 border border-purple-200">
                <div className="text-center space-y-3">
                  <p className="text-sm text-purple-700 font-medium">Composite Score =</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
                    <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold">Weighted Dim × 95%</span>
                    <span className="text-purple-600 font-bold">+</span>
                    <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold">Maturity × 3%</span>
                    <span className="text-purple-600 font-bold">+</span>
                    <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold">Breadth × 2%</span>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs font-bold">M</span>
                Maturity Score (OR1)
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Comprehensive (industry-leading support)</span><span className="font-bold text-green-600">100 pts</span></div>
                <div className="flex justify-between"><span>Enhanced (beyond typical requirements)</span><span className="font-bold text-green-600">80 pts</span></div>
                <div className="flex justify-between"><span>Moderate (standard benefit programs)</span><span className="font-bold text-blue-600">50 pts</span></div>
                <div className="flex justify-between"><span>Developing (building support programs)</span><span className="font-bold text-amber-600">10 pts</span></div>
                <div className="flex justify-between"><span className="text-red-700">Legal minimum only</span><span className="font-bold text-red-600">0 pts</span></div>
                <div className="flex justify-between"><span className="text-red-700">No formal programs</span><span className="font-bold text-red-600">0 pts</span></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                Note: Meeting only legal requirements does not earn points—the index recognizes organizations that go beyond compliance.
              </p>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs font-bold">B</span>
                Breadth Score (CB3a/b/c average)
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="text-gray-700">Average of:</p>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• CB3a: Beyond legal requirements (100/50/0)</li>
                  <li>• CB3b: Program structure elements (count-based)</li>
                  <li>• CB3c: Conditions covered (count-based)</li>
                </ul>
              </div>
            </section>
          </div>
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
  const [blendWeights, setBlendWeights] = useState<Record<number, { grid: number; followUp: number }>>({ ...DEFAULT_BLEND_WEIGHTS });
  const [compositeWeights, setCompositeWeights] = useState({ ...DEFAULT_COMPOSITE_WEIGHTS });
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [showCompositeModal, setShowCompositeModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'weighted' | 'composite'>('weighted');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'fp' | 'standard' | 'panel'>('all');
  const [filterComplete, setFilterComplete] = useState(false);
  const [viewMode, setViewMode] = useState<'score' | 'index'>('score');
  const [includePanel, setIncludePanel] = useState(true);
  
  // Weight validation
  const dimWeightsSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const dimWeightsValid = dimWeightsSum === 100;
  const dimWeightsDiff = 100 - dimWeightsSum;
  
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

  const updateBlendWeight = (dimNum: number, grid: number, followUp: number) => {
    setBlendWeights(prev => ({
      ...prev,
      [dimNum]: { grid, followUp }
    }));
  };

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
      {showDimensionModal && <DimensionScoringModal onClose={() => setShowDimensionModal(false)} />}
      {showCompositeModal && <CompositeScoringModal onClose={() => setShowCompositeModal(false)} />}

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
                Print Report
              </button>
              <button onClick={() => router.push('/admin')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                ← Back
              </button>
            </div>
          </div>
          
          {/* Stats & Filters */}
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
                <span className="text-green-300">✔ Complete:</span>
                <span className="font-bold">{companyScores.filter(c => c.isComplete && (includePanel || !c.isPanel)).length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-400/30">
                <input
                  type="checkbox"
                  checked={includePanel}
                  onChange={(e) => setIncludePanel(e.target.checked)}
                  className="rounded border-amber-400/50 bg-white/10 text-amber-400 focus:ring-amber-400/30"
                />
                <span className="text-amber-200">Include Panel Data</span>
              </label>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-white/10 text-white border-0 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-white/30"
              >
                <option value="all" className="text-gray-900">All Companies</option>
                <option value="fp" className="text-gray-900">Founding Partners</option>
                <option value="standard" className="text-gray-900">Standard Only</option>
                <option value="panel" className="text-gray-900">Panel Only</option>
              </select>
              
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterComplete}
                  onChange={(e) => setFilterComplete(e.target.checked)}
                  className="rounded border-white/30 bg-white/10 text-indigo-400 focus:ring-white/30"
                />
                <span>Complete Only</span>
              </label>
              
              <div className="flex bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('score')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'score' ? 'bg-white text-indigo-900' : 'text-white hover:bg-white/10'
                  }`}
                >
                  Scores
                </button>
                <button
                  onClick={() => setViewMode('index')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'index' ? 'bg-white text-indigo-900' : 'text-white hover:bg-white/10'
                  }`}
                  title="Index: 100 = Average"
                >
                  Index
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {sortedCompanies.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessments Found</h3>
            <p className="text-gray-500">No companies match your current filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div ref={tableRef} className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th colSpan={2} className="px-4 py-2 text-left text-xs font-medium border-r border-slate-600"
                        style={{ position: 'sticky', left: 0, zIndex: 30, backgroundColor: '#1E293B' }}>
                      DIMENSIONS
                    </th>
                    <th colSpan={4} className="px-4 py-2 text-center text-xs font-medium bg-indigo-700 border-r border-indigo-500">
                      BENCHMARKS
                    </th>
                    <th colSpan={sortedCompanies.length} className="px-4 py-2 text-center text-xs font-medium bg-slate-700">
                      COMPANIES ({sortedCompanies.length})
                    </th>
                  </tr>
                  
                  <tr className="bg-slate-700 text-white" style={{ position: 'sticky', top: 0, zIndex: 25 }}>
                    <th className="px-4 py-3 text-left font-semibold border-r border-slate-600"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 35, minWidth: COL1_WIDTH, backgroundColor: '#334155' }}>
                      <button onClick={() => handleSort('name')} className="hover:text-indigo-300 flex items-center gap-1">
                        Dimension {sortBy === 'name' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </button>
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-slate-600"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 35, width: COL2_WIDTH, backgroundColor: '#334155' }}>
                      Wt %
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-indigo-600 border-r border-indigo-500"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 35, width: COL_AVG_WIDTH }}>
                      ALL
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-violet-600 border-r border-violet-500"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 35, width: COL_AVG_WIDTH }}>
                      FP
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-slate-500 border-r border-slate-400"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 35, width: COL_AVG_WIDTH }}>
                      STD
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-amber-600 border-r border-amber-500"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 35, width: COL_AVG_WIDTH }}>
                      PANEL
                    </th>
                    {sortedCompanies.map(company => (
                      <th key={company.surveyId} 
                          className={`px-3 py-2 text-center font-medium border-r last:border-r-0 ${
                            company.isPanel ? 'bg-amber-600' : company.isFoundingPartner ? 'bg-violet-600' : 'bg-slate-600'
                          }`}
                          style={{ minWidth: 100 }}>
                        <Link href={`/admin/profile/${company.surveyId}`} className="text-xs hover:underline block truncate text-white" title={company.companyName}>
                          {company.companyName.length > 12 ? company.companyName.substring(0, 12) + '…' : company.companyName}
                        </Link>
                        <span className="text-[10px] opacity-70 block">{company.completedDimCount}/13</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                
                <tbody>
                  {/* SECTION 1: DIMENSION SCORES */}
                  <tr>
                    <td colSpan={6 + sortedCompanies.length} className="bg-blue-50 border-y-2 border-blue-200">
                      <div className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">D</span>
                          <span className="font-bold text-blue-900">Dimension Scores</span>
                          <span className="text-blue-600 text-sm">(Grid + Blended follow-ups)</span>
                        </div>
                        <button 
                          onClick={() => setShowDimensionModal(true)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          How Scoring Works
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Dimension Rows */}
                  {DIMENSION_ORDER.map((dim, idx) => {
                    const hasFollowUp = DIMENSIONS_WITH_FOLLOWUP.includes(dim);
                    return (
                      <tr key={dim} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className={`px-4 py-2.5 border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                            style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              <span className="text-blue-600 font-bold">D{dim}:</span> {DIMENSION_NAMES[dim]}
                            </span>
                            {hasFollowUp && (
                              <BlendWeightEditor
                                dimNum={dim}
                                blendWeights={blendWeights[dim]}
                                onUpdate={(g, f) => updateBlendWeight(dim, g, f)}
                              />
                            )}
                          </div>
                        </td>
                        <td className={`px-1 py-1 text-center border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                            style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weights[dim]}
                            onChange={(e) => setWeights(prev => ({ ...prev, [dim]: parseInt(e.target.value) || 0 }))}
                            className={`w-14 px-1 py-0.5 text-xs text-center border rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white ${
                              !dimWeightsValid ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                        </td>
                        <td className="px-2 py-2.5 text-center bg-indigo-50 border-r border-indigo-100"
                            style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                          <ScoreCell score={averages.dimensions[dim]?.total ?? null} isComplete={true} />
                        </td>
                        <td className="px-2 py-2.5 text-center bg-violet-50 border-r border-violet-100"
                            style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                          <ScoreCell score={averages.dimensions[dim]?.fp ?? null} isComplete={true} />
                        </td>
                        <td className="px-2 py-2.5 text-center bg-slate-50 border-r border-slate-100"
                            style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                          <ScoreCell score={averages.dimensions[dim]?.std ?? null} isComplete={true} />
                        </td>
                        <td className="px-2 py-2.5 text-center bg-amber-50 border-r border-amber-100"
                            style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                          <ScoreCell score={averages.dimensions[dim]?.panel ?? null} isComplete={true} />
                        </td>
                        {sortedCompanies.map(company => (
                          <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-gray-100 last:border-r-0 ${
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
                    );
                  })}
                  
                  {/* WEIGHTS TOTAL ROW */}
                  <tr className={`${dimWeightsValid ? 'bg-blue-100' : 'bg-red-100'} border-t-2 ${dimWeightsValid ? 'border-blue-300' : 'border-red-300'}`}>
                    <td className={`px-4 py-2 border-r ${dimWeightsValid ? 'bg-blue-100 border-blue-200' : 'bg-red-100 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${dimWeightsValid ? 'text-blue-800' : 'text-red-800'}`}>
                          Total Weights
                        </span>
                        {!dimWeightsValid && (
                          <span className="text-xs text-red-600 font-medium">
                            {dimWeightsDiff > 0 ? `Add ${dimWeightsDiff}%` : `Remove ${Math.abs(dimWeightsDiff)}%`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-1 py-2 text-center border-r font-bold ${dimWeightsValid ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-red-100 border-red-200 text-red-800'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <span className={`text-base ${!dimWeightsValid && 'animate-pulse'}`}>
                        {dimWeightsSum}%
                      </span>
                    </td>
                    <td colSpan={4 + sortedCompanies.length} className={`px-4 py-2 ${dimWeightsValid ? 'bg-blue-50' : 'bg-red-50'}`}>
                      {!dimWeightsValid ? (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-red-700 font-medium text-sm">
                            Weights must equal 100% for valid scoring
                          </span>
                          <button
                            onClick={() => setWeights({ ...DEFAULT_DIMENSION_WEIGHTS })}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          >
                            Reset to Defaults
                          </button>
                        </div>
                      ) : (
                        <span className="text-blue-600 text-sm flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Weights valid
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Weighted Average Row */}
                  <tr className="bg-blue-100 border-t border-blue-200">
                    <td className="px-4 py-2.5 border-r border-blue-200 bg-blue-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <button onClick={() => handleSort('weighted')} className="font-bold text-blue-800 flex items-center gap-2 hover:text-blue-600">
                        <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">W</span>
                        Weighted Average
                        {sortBy === 'weighted' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </button>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-blue-600 border-r border-blue-200 bg-blue-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>wtd</td>
                    <td className="px-2 py-2.5 text-center bg-indigo-200 border-r border-indigo-300 font-bold text-lg"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10, color: getScoreColor(averages.weighted.total ?? 0) }}>
                      {averages.weighted.total ?? '—'}
                    </td>
                    <td className="px-2 py-2.5 text-center bg-violet-200 border-r border-violet-300 font-bold text-lg"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10, color: getScoreColor(averages.weighted.fp ?? 0) }}>
                      {averages.weighted.fp ?? '—'}
                    </td>
                    <td className="px-2 py-2.5 text-center bg-slate-200 border-r border-slate-300 font-bold text-lg"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10, color: getScoreColor(averages.weighted.std ?? 0) }}>
                      {averages.weighted.std ?? '—'}
                    </td>
                    <td className="px-2 py-2.5 text-center bg-amber-200 border-r border-amber-300 font-bold text-lg"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10, color: getScoreColor(averages.weighted.panel ?? 0) }}>
                      {averages.weighted.panel ?? '—'}
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-blue-200 last:border-r-0 ${
                        company.isPanel ? 'bg-amber-100/70' : company.isFoundingPartner ? 'bg-violet-100/70' : 'bg-blue-50'
                      }`}>
                        <ScoreCell score={company.weightedScore} isComplete={company.isComplete} size="large" viewMode={viewMode} benchmark={averages.weighted.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* SECTION 2: COMPOSITE FACTORS */}
                  <tr>
                    <td colSpan={6 + sortedCompanies.length} className="bg-purple-50 border-y-2 border-purple-200">
                      <div className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">C</span>
                          <span className="font-bold text-purple-900">Composite Score Factors</span>
                          <span className="text-purple-600 text-sm">(Maturity & Breadth)</span>
                        </div>
                        <button 
                          onClick={() => setShowCompositeModal(true)}
                          className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          How Composite Works
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Maturity Score Row */}
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs font-bold">M</span>
                        Maturity Score
                      </span>
                      <span className="text-gray-500 text-xs ml-7 block">Organizational readiness (OR1)</span>
                    </td>
                    <td className="px-1 py-2.5 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.maturity}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, maturity: parseInt(e.target.value) || 0 }))}
                        className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-400"
                      />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                      <ScoreCell score={averages.maturity.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-violet-50 border-r border-violet-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                      <ScoreCell score={averages.maturity.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                      <ScoreCell score={averages.maturity.std} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                      <ScoreCell score={averages.maturity.panel} isComplete={true} />
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-gray-100 last:border-r-0 ${
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                      }`}>
                        <ScoreCell score={company.maturityScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.maturity.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Breadth Score Row */}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2.5 bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs font-bold">B</span>
                        Breadth Score
                      </span>
                      <span className="text-gray-500 text-xs ml-7 block">Program scope (CB3a/b/c)</span>
                    </td>
                    <td className="px-1 py-2.5 text-center text-xs text-gray-500 bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.breadth}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, breadth: parseInt(e.target.value) || 0 }))}
                        className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-400"
                      />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                      <ScoreCell score={averages.breadth.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-violet-50 border-r border-violet-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                      <ScoreCell score={averages.breadth.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                      <ScoreCell score={averages.breadth.std} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                      <ScoreCell score={averages.breadth.panel} isComplete={true} />
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-gray-100 last:border-r-0 ${
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : 'bg-gray-50'
                      }`}>
                        <ScoreCell score={company.breadthScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.breadth.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Weighted Dim Row (shows the 95% factor) */}
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs font-bold">W</span>
                        Weighted Dimensions
                      </span>
                      <span className="text-gray-500 text-xs ml-7 block">From above section</span>
                    </td>
                    <td className="px-1 py-2.5 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.weightedDim}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, weightedDim: parseInt(e.target.value) || 0 }))}
                        className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-400"
                      />
                    </td>
                    <td colSpan={4 + sortedCompanies.length} className="px-4 py-2.5 text-gray-500 text-xs italic">
                      (Uses Weighted Average scores from Dimension section above)
                    </td>
                  </tr>
                  
                  {/* Composite Weights Total Row */}
                  <tr className={`${compositeWeightsValid ? 'bg-purple-100' : 'bg-red-100'} border-t ${compositeWeightsValid ? 'border-purple-300' : 'border-red-300'}`}>
                    <td className={`px-4 py-2 border-r ${compositeWeightsValid ? 'bg-purple-100 border-purple-200' : 'bg-red-100 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className={`font-semibold ${compositeWeightsValid ? 'text-purple-800' : 'text-red-800'}`}>
                        Composite Weight Total
                      </span>
                    </td>
                    <td className={`px-1 py-2 text-center border-r font-bold ${compositeWeightsValid ? 'bg-purple-100 border-purple-200 text-purple-800' : 'bg-red-100 border-red-200 text-red-800'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <span className={`text-base ${!compositeWeightsValid && 'animate-pulse'}`}>
                        {compositeWeightsSum}%
                      </span>
                    </td>
                    <td colSpan={4 + sortedCompanies.length} className={`px-4 py-2 ${compositeWeightsValid ? 'bg-purple-50' : 'bg-red-50'}`}>
                      {!compositeWeightsValid ? (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-red-700 font-medium text-sm">
                            Weights must equal 100% (currently {compositeWeightsSum}%)
                          </span>
                          <button
                            onClick={() => setCompositeWeights({ ...DEFAULT_COMPOSITE_WEIGHTS })}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          >
                            Reset to Defaults
                          </button>
                        </div>
                      ) : (
                        <span className="text-purple-600 text-sm flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Composite weights valid (W×{compositeWeights.weightedDim}% + M×{compositeWeights.maturity}% + B×{compositeWeights.breadth}%)
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Composite Score Row */}
                  <tr className={`${compositeWeightsValid && dimWeightsValid ? 'bg-gradient-to-r from-purple-100 to-indigo-100' : 'bg-red-50'}`}>
                    <td className={`px-4 py-3 border-r ${compositeWeightsValid && dimWeightsValid ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <button onClick={() => handleSort('composite')} className={`font-bold flex items-center gap-2 ${compositeWeightsValid && dimWeightsValid ? 'text-purple-900 hover:text-purple-700' : 'text-red-700'}`}>
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${compositeWeightsValid && dimWeightsValid ? 'bg-purple-600' : 'bg-red-500'}`}>★</span>
                        Composite Score
                        {sortBy === 'composite' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </button>
                    </td>
                    <td className={`px-2 py-3 text-center text-xs border-r ${compositeWeightsValid && dimWeightsValid ? 'text-purple-600 bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      {compositeWeightsValid && dimWeightsValid ? 'comp' : <span className="text-red-600 font-bold">!</span>}
                    </td>
                    {compositeWeightsValid && dimWeightsValid ? (
                      <>
                        <td className="px-2 py-3 text-center bg-purple-200 border-r border-purple-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10, color: getScoreColor(averages.composite.total ?? 0) }}>
                          {averages.composite.total ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-violet-200 border-r border-violet-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10, color: getScoreColor(averages.composite.fp ?? 0) }}>
                          {averages.composite.fp ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-slate-200 border-r border-slate-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10, color: getScoreColor(averages.composite.std ?? 0) }}>
                          {averages.composite.std ?? '—'}
                        </td>
                        <td className="px-2 py-3 text-center bg-amber-200 border-r border-amber-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10, color: getScoreColor(averages.composite.panel ?? 0) }}>
                          {averages.composite.panel ?? '—'}
                        </td>
                        {sortedCompanies.map(company => (
                          <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-purple-200 last:border-r-0 ${
                            company.isPanel ? 'bg-amber-100/70' : company.isFoundingPartner ? 'bg-violet-100/70' : 'bg-purple-50'
                          }`}>
                            <ScoreCell score={company.compositeScore} isComplete={company.isComplete} size="large" viewMode={viewMode} benchmark={averages.composite.total} />
                          </td>
                        ))}
                      </>
                    ) : (
                      <td colSpan={4 + sortedCompanies.length} className="px-4 py-3 bg-red-50 border-r border-red-200">
                        <div className="flex items-center gap-2 text-red-700">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">
                            {!dimWeightsValid && !compositeWeightsValid 
                              ? `Both weight sets must sum to 100% (Dimension: ${dimWeightsSum}%, Composite: ${compositeWeightsSum}%)`
                              : !dimWeightsValid 
                                ? `Dimension weights must sum to 100% (currently ${dimWeightsSum}%)`
                                : `Composite weights must sum to 100% (currently ${compositeWeightsSum}%)`
                            }
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>
                  
                  {/* Performance Tier Row */}
                  {compositeWeightsValid && dimWeightsValid && (
                    <tr className="bg-white">
                      <td className="px-4 py-3 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                        <span className="font-semibold text-gray-700 flex items-center gap-2">
                          <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded flex items-center justify-center text-white">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-1.17a3 3 0 01-5.66 0H8.83a3 3 0 01-5.66 0H2a2 2 0 110-4h1.17A3 3 0 015 5zm5 8a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-4 1a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </span>
                          Performance Tier
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}></td>
                      <td className="px-2 py-3 text-center bg-indigo-50 border-r border-indigo-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                        {averages.composite.total !== null && <TierBadge score={averages.composite.total} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-3 text-center bg-violet-50 border-r border-violet-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                        {averages.composite.fp !== null && <TierBadge score={averages.composite.fp} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-3 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                        {averages.composite.std !== null && <TierBadge score={averages.composite.std} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-3 text-center bg-amber-50 border-r border-amber-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                        {averages.composite.panel !== null && <TierBadge score={averages.composite.panel} isComplete={true} size="small" />}
                      </td>
                      {sortedCompanies.map(company => (
                        <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-gray-100 last:border-r-0 ${
                          company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                        }`}>
                          <TierBadge score={company.compositeScore} isComplete={company.isComplete} isProvisional={company.isProvisional} size="small" />
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
              <p className="text-sm font-medium text-gray-700 mb-2">Blend Weights</p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="text-purple-600 underline decoration-dotted">85/15</span>
                <span>= Click to adjust grid/follow-up blend</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

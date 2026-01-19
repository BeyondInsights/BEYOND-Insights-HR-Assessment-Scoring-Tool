/**
 * AGGREGATE SCORING REPORT - OPTIMIZED UX
 * 
 * Clean visual hierarchy with two scoring sections:
 * 1. COMPOSITE SCORE (top) -> Composite Score -> Composite Tier -> 4 Components
 * 2. DIMENSION SCORES -> Unweighted -> Weighted -> Dimension Tier
 * 
 * Features:
 * - Composite Score section at top with clear component breakdown
 * - Educational modals with detailed calculation explanations
 * - Default weight reset buttons for both composite and dimension weights
 * - Visual separation between sections
 * - Sticky headers for scrolling
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { calculateEnhancedScore } from '@/lib/enhanced-scoring';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_DIMENSION_WEIGHTS: Record<number, number> = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3,
};

const DEFAULT_COMPOSITE_WEIGHTS = {
  weightedDim: 85,
  depth: 8,
  maturity: 5,
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

const DIMENSION_ORDER = [4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12];

const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };
const INSUFFICIENT_DATA_THRESHOLD = 0.40;

const COL1_WIDTH = 280;
const COL2_WIDTH = 50;
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

interface DimensionScore {
  rawScore: number;
  adjustedScore: number;
  geoMultiplier: number;
  totalItems: number;
  answeredItems: number;
  unsureCount: number;
  unsurePercent: number;
  isInsufficientData: boolean;
}

function calculateDimensionScore(dimNum: number, dimData: Record<string, any> | null): DimensionScore {
  const result: DimensionScore = {
    rawScore: 0, adjustedScore: 0, geoMultiplier: 1.0, totalItems: 0,
    answeredItems: 0, unsureCount: 0, unsurePercent: 0, isInsufficientData: false,
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

function calculateCompanyScores(assessment: Record<string, any>, weights: Record<number, number>): CompanyScores {
  const dimensions: Record<number, DimensionScore> = {};
  let completedDimCount = 0;
  
  for (let i = 1; i <= 13; i++) {
    const dimData = assessment[`dimension${i}_data`];
    dimensions[i] = calculateDimensionScore(i, dimData);
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
      ? Math.round(dimsWithData.reduce((sum, d) => sum + d.adjustedScore, 0) / dimsWithData.length)
      : 0;
    
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      for (let i = 1; i <= 13; i++) {
        const dim = dimensions[i];
        const weight = weights[i] || 0;
        weightedScore += dim.adjustedScore * (weight / totalWeight);
      }
    }
    weightedScore = Math.round(weightedScore);
  }
  
  let enhancedResult = { compositeScore: weightedScore, depthScore: 0, maturityScore: 0, breadthScore: 0 };
  try {
    const enhanced = calculateEnhancedScore(assessment);
    enhancedResult = {
      compositeScore: enhanced.compositeScore ?? weightedScore,
      depthScore: enhanced.depthScore ?? 0,
      maturityScore: enhanced.maturityScore ?? 0,
      breadthScore: enhanced.breadthScore ?? 0,
    };
  } catch (e) {}
  
  return {
    companyName: assessment.company_name || 'Unknown',
    surveyId: assessment.app_id || assessment.survey_id || 'N/A',
    dimensions, unweightedScore, weightedScore, insufficientDataCount,
    isProvisional, isComplete, isFoundingPartner, isPanel, completedDimCount,
    compositeScore: enhancedResult.compositeScore,
    depthScore: enhancedResult.depthScore,
    maturityScore: enhancedResult.maturityScore,
    breadthScore: enhancedResult.breadthScore,
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
                Individual Dimension Scoring
              </h3>
              <p className="text-gray-600 mb-3">Each of the 13 dimensions is scored based on the grid responses (D#a questions):</p>
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
                  <span className="font-bold text-gray-500">Excluded from calculation</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                <strong>Formula:</strong> (Earned Points / Max Possible Points) × 100 = Raw Score
              </p>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">2</span>
                Geographic Multiplier
              </h3>
              <p className="text-gray-600 mb-3">Raw scores are adjusted based on geographic consistency of benefits:</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Generally consistent across all locations</span><span className="font-bold text-green-600">×1.00</span></div>
                <div className="flex justify-between"><span>Vary across locations</span><span className="font-bold text-amber-600">×0.90</span></div>
                <div className="flex justify-between"><span>Only available in select locations</span><span className="font-bold text-red-600">×0.75</span></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                <strong>Formula:</strong> Raw Score × Geographic Multiplier = Adjusted Score
              </p>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">3</span>
                Default Dimension Weights
              </h3>
              <p className="text-gray-600 mb-3">Dimensions are weighted by their importance to workplace support:</p>
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-2 text-xs">
                {DIMENSION_ORDER.map(dim => (
                  <div key={dim} className="flex justify-between">
                    <span className="text-gray-700">D{dim}: {DIMENSION_NAMES[dim].substring(0, 25)}...</span>
                    <span className="font-bold text-blue-600">{defaultWeights[dim]}%</span>
                  </div>
                ))}
              </div>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">4</span>
                Aggregate Scores
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="font-semibold text-gray-800">Unweighted Dimension Score:</p>
                  <p className="text-gray-600 text-sm">Simple average of all 13 dimension adjusted scores</p>
                  <p className="text-xs text-blue-600 mt-1">Formula: Sum of Adjusted Scores ÷ 13</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Weighted Dimension Score:</p>
                  <p className="text-gray-600 text-sm">Each dimension's adjusted score multiplied by its weight, then summed</p>
                  <p className="text-xs text-blue-600 mt-1">Formula: Σ(Adjusted Score × Weight%) = Weighted Score</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompositeScoringModal({ onClose, compositeWeights }: { onClose: () => void; compositeWeights: typeof DEFAULT_COMPOSITE_WEIGHTS }) {
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
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-purple-800 font-medium">
                The Composite Score combines the <strong>Weighted Dimension Score</strong> with three enhancement factors that evaluate the <strong>quality and depth</strong> of support programs.
              </p>
            </div>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3">Composite Score Formula</h3>
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-5 border border-purple-200">
                <div className="text-center space-y-3">
                  <p className="text-sm text-purple-700 font-medium">Composite Score =</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
                    <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold">Weighted Dim × {compositeWeights.weightedDim}%</span>
                    <span className="text-purple-600 font-bold">+</span>
                    <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold">Depth × {compositeWeights.depth}%</span>
                    <span className="text-purple-600 font-bold">+</span>
                    <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold">Maturity × {compositeWeights.maturity}%</span>
                    <span className="text-purple-600 font-bold">+</span>
                    <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold">Breadth × {compositeWeights.breadth}%</span>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3">Component Breakdown</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">W</span>
                    <h4 className="font-bold text-blue-900">Weighted Dimension Score ({compositeWeights.weightedDim}%)</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">The foundation score from the 13 dimension assessments, weighted by importance.</p>
                  <p className="text-xs text-blue-600">Source: Grid responses (D#a questions) across all dimensions</p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">D</span>
                    <h4 className="font-bold text-purple-900">Depth Score ({compositeWeights.depth}%)</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">Evaluates the quality and comprehensiveness of follow-up responses beyond basic grid answers.</p>
                  <p className="text-xs text-purple-600 mb-2">Source: Follow-up questions (D#b, D#c, D#d) that assess program details</p>
                  <div className="text-xs text-gray-600 bg-white/60 rounded p-2">
                    <strong>Measures:</strong> Implementation details, coverage scope, documentation quality, measurement practices
                  </div>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold">M</span>
                    <h4 className="font-bold text-indigo-900">Maturity Score ({compositeWeights.maturity}%)</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">Assesses the organization's current approach and readiness for supporting employees with serious health conditions.</p>
                  <p className="text-xs text-indigo-600 mb-2">Source: General Benefits section and organizational readiness indicators</p>
                  <div className="text-xs text-gray-600 bg-white/60 rounded p-2">
                    <strong>Measures:</strong> Formal programs vs ad-hoc support, dedicated resources, established processes, leadership engagement
                  </div>
                </div>
                
                <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-violet-600 rounded flex items-center justify-center text-white text-xs font-bold">B</span>
                    <h4 className="font-bold text-violet-900">Breadth Score ({compositeWeights.breadth}%)</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">Evaluates the scope and coverage of support across different conditions and employee populations.</p>
                  <p className="text-xs text-violet-600 mb-2">Source: Conditions covered, population segments, benefit availability</p>
                  <div className="text-xs text-gray-600 bg-white/60 rounded p-2">
                    <strong>Measures:</strong> Cancer types covered, family member inclusion, part-time/contract worker coverage, geographic reach
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3">Performance Tiers</h3>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                  <div className="font-bold">Exemplary</div>
                  <div>90-100</div>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                  <div className="font-bold">Leading</div>
                  <div>75-89</div>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                  <div className="font-bold">Progressing</div>
                  <div>60-74</div>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#FFEDD5', color: '#9A3412' }}>
                  <div className="font-bold">Emerging</div>
                  <div>40-59</div>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>
                  <div className="font-bold">Beginning</div>
                  <div>0-39</div>
                </div>
              </div>
            </section>
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
      title={isHighUnsure ? 'High % of "Unsure" responses' : undefined}
    >
      {displayValue}
    </span>
  );
}

// ============================================
// TIER BADGE COMPONENT
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
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [showCompositeModal, setShowCompositeModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'weighted' | 'composite'>('composite');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'fp' | 'standard' | 'panel'>('all');
  const [filterComplete, setFilterComplete] = useState(false);
  const [viewMode, setViewMode] = useState<'score' | 'index'>('score');
  const [includePanel, setIncludePanel] = useState(true);
  
  const weightsSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const weightsValid = weightsSum === 100;
  
  const [compositeWeights, setCompositeWeights] = useState({ ...DEFAULT_COMPOSITE_WEIGHTS });
  const compositeWeightsSum = compositeWeights.weightedDim + compositeWeights.depth + compositeWeights.maturity + compositeWeights.breadth;
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
    return assessments.map(a => calculateCompanyScores(a, weights));
  }, [assessments, weights]);

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
      arr.length > 0 ? Math.round(arr.reduce((s, c) => s + (c.dimensions[dim]?.adjustedScore || 0), 0) / arr.length) : null;
    
    return {
      dimensions: Object.fromEntries(DIMENSION_ORDER.map(d => [d, {
        total: dimAvg(d, complete),
        fp: dimAvg(d, fp),
        std: dimAvg(d, std),
        panel: dimAvg(d, panel),
      }])),
      unweighted: { total: calcAvg(complete, 'unweightedScore'), fp: calcAvg(fp, 'unweightedScore'), std: calcAvg(std, 'unweightedScore'), panel: calcAvg(panel, 'unweightedScore') },
      weighted: { total: calcAvg(complete, 'weightedScore'), fp: calcAvg(fp, 'weightedScore'), std: calcAvg(std, 'weightedScore'), panel: calcAvg(panel, 'weightedScore') },
      depth: { total: calcAvg(complete, 'depthScore'), fp: calcAvg(fp, 'depthScore'), std: calcAvg(std, 'depthScore'), panel: calcAvg(panel, 'depthScore') },
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

  const scrollLeft = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
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
      {/* Modals */}
      {showDimensionModal && <DimensionScoringModal onClose={() => setShowDimensionModal(false)} defaultWeights={DEFAULT_DIMENSION_WEIGHTS} />}
      {showCompositeModal && <CompositeScoringModal onClose={() => setShowCompositeModal(false)} compositeWeights={compositeWeights} />}

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white py-5 px-8 shadow-xl">
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
              <button onClick={() => router.push('/admin')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
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
                <span className="px-2 py-0.5 rounded-full bg-violet-500/30 border border-violet-400/50 text-violet-200 text-xs font-bold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  FP
                </span>
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
                <span className="text-green-400 font-bold">✓</span>
                <span className="text-green-300">Complete:</span>
                <span className="font-bold">{companyScores.filter(c => c.isComplete && (includePanel || !c.isPanel)).length}</span>
              </div>
              <div className="border-l border-white/20 pl-4 flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#059669' }} />
                  <span className="text-white/70">80+</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#0284C7' }} />
                  <span className="text-white/70">60+</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#D97706' }} />
                  <span className="text-white/70">40+</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#DC2626' }} />
                  <span className="text-white/70">&lt;40</span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-400/30">
                <input
                  type="checkbox"
                  checked={includePanel}
                  onChange={(e) => setIncludePanel(e.target.checked)}
                  className="rounded border-amber-400/50 bg-white/10 text-amber-400 focus:ring-amber-400/30"
                />
                <span className="text-amber-200">Include Panel</span>
              </label>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'fp' | 'standard' | 'panel')}
                className="bg-white/10 text-white border-0 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-white/30"
              >
                <option value="all" className="text-gray-900">All Companies</option>
                <option value="fp" className="text-gray-900">Founding Partners</option>
                <option value="standard" className="text-gray-900">Standard Only</option>
                <option value="panel" className="text-gray-900">Panel Only</option>
              </select>
              
              <button
                onClick={() => setFilterComplete(!filterComplete)}
                className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  filterComplete 
                    ? 'bg-green-500/30 border border-green-400/50 text-green-200' 
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
              >
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  filterComplete ? 'bg-green-500 border-green-400' : 'border-white/50 bg-transparent'
                }`}>
                  {filterComplete && <span className="text-white text-xs font-bold">✓</span>}
                </span>
                <span className={filterComplete ? 'text-white font-medium' : ''}>Complete Only</span>
              </button>
              
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
              
              <button 
                onClick={() => setShowDimensionModal(true)}
                className="px-3 py-1.5 bg-blue-500/30 border border-blue-400/50 text-blue-200 text-xs font-medium rounded-lg hover:bg-blue-500/40 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Dimension Scoring
              </button>
              <button 
                onClick={() => setShowCompositeModal(true)}
                className="px-3 py-1.5 bg-purple-500/30 border border-purple-400/50 text-purple-200 text-xs font-medium rounded-lg hover:bg-purple-500/40 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Composite Scoring
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {sortedCompanies.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
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
                      METRICS
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
                        Metric {sortBy === 'name' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </button>
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-slate-600"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 35, width: COL2_WIDTH, backgroundColor: '#334155' }}>
                      Wt%
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-indigo-600 border-r border-indigo-500"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 35, width: COL_AVG_WIDTH }}>
                      ALL
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-violet-600 border-r border-violet-500"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 35, width: COL_AVG_WIDTH }}>
                      <span className="flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        FP
                      </span>
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
                  {/* ============================================ */}
                  {/* SECTION 1: COMPOSITE SCORE (TOP) */}
                  {/* ============================================ */}
                  
                  <tr>
                    <td colSpan={6 + sortedCompanies.length} className="bg-gradient-to-r from-purple-100 to-indigo-100 border-y-2 border-purple-300">
                      <div className="px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">★</span>
                          <div>
                            <span className="font-bold text-purple-900 text-lg">Composite Score</span>
                            <span className="text-purple-600 text-sm ml-2">(Overall Ranking Metric)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setCompositeWeights({ ...DEFAULT_COMPOSITE_WEIGHTS })}
                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Use Default Composite Weights
                          </button>
                          {!compositeWeightsValid && (
                            <span className="text-red-600 text-xs font-medium bg-red-100 px-2 py-1 rounded">
                              Weights = {compositeWeightsSum}% (must be 100%)
                            </span>
                          )}
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
                        {sortBy === 'composite' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
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
                  
                  {/* Composite Components Sub-header */}
                  <tr>
                    <td colSpan={6 + sortedCompanies.length} className="bg-purple-50/50 border-b border-purple-100">
                      <div className="px-4 py-1.5 flex items-center gap-2 text-xs text-purple-700">
                        <span className="font-semibold">Composite Components:</span>
                        <span>W×{compositeWeights.weightedDim}% + D×{compositeWeights.depth}% + M×{compositeWeights.maturity}% + B×{compositeWeights.breadth}%</span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Weighted Dimension Score (Component 1) */}
                  <tr className="bg-white">
                    <td className="px-4 py-2 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs font-bold">W</span>
                        Weighted Dimension Score
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.weightedDim}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, weightedDim: parseInt(e.target.value) || 0 }))}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-400"
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
                  
                  {/* Depth Score (Component 2) */}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs font-bold">D</span>
                        Depth Score
                      </span>
                      <span className="text-gray-500 text-xs ml-7 block">Follow-up quality</span>
                    </td>
                    <td className="px-2 py-2 text-center text-xs text-gray-500 bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.depth}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, depth: parseInt(e.target.value) || 0 }))}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-400"
                      />
                    </td>
                    <td className="px-2 py-2 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                      <ScoreCell score={averages.depth.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-violet-50 border-r border-violet-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                      <ScoreCell score={averages.depth.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                      <ScoreCell score={averages.depth.std} isComplete={true} />
                    </td>
                    <td className="px-2 py-2 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                      <ScoreCell score={averages.depth.panel} isComplete={true} />
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2 text-center border-r border-gray-100 last:border-r-0 ${
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : 'bg-gray-50'
                      }`}>
                        <ScoreCell score={company.depthScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.depth.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Maturity Score (Component 3) */}
                  <tr className="bg-white">
                    <td className="px-4 py-2 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs font-bold">M</span>
                        Maturity Score
                      </span>
                      <span className="text-gray-500 text-xs ml-7 block">Organizational readiness</span>
                    </td>
                    <td className="px-2 py-2 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.maturity}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, maturity: parseInt(e.target.value) || 0 }))}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-400"
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
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                      }`}>
                        <ScoreCell score={company.maturityScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.maturity.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Breadth Score (Component 4) */}
                  <tr className="bg-gray-50 border-b-4 border-gray-300">
                    <td className="px-4 py-2 bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs font-bold">B</span>
                        Breadth Score
                      </span>
                      <span className="text-gray-500 text-xs ml-7 block">Program coverage</span>
                    </td>
                    <td className="px-2 py-2 text-center text-xs text-gray-500 bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={compositeWeights.breadth}
                        onChange={(e) => setCompositeWeights(prev => ({ ...prev, breadth: parseInt(e.target.value) || 0 }))}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-400"
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
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : 'bg-gray-50'
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
                      <div className="px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">D</span>
                          <div>
                            <span className="font-bold text-blue-900 text-lg">Dimension Scores</span>
                            <span className="text-blue-600 text-sm ml-2">(13 Assessment Areas)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setWeights({ ...DEFAULT_DIMENSION_WEIGHTS })}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Use Default Dimension Weights
                          </button>
                          {!weightsValid && (
                            <span className="text-red-600 text-xs font-medium bg-red-100 px-2 py-1 rounded">
                              Weights = {weightsSum}% (must be 100%)
                            </span>
                          )}
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
                          className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
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
                            score={company.dimensions[dim].adjustedScore} 
                            isComplete={company.dimensions[dim].totalItems > 0}
                            isProvisional={company.dimensions[dim].isInsufficientData}
                            viewMode={viewMode}
                            benchmark={averages.dimensions[dim]?.total}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  
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
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${weightsValid ? 'bg-blue-600' : 'bg-red-500'}`}>Σ</span>
                        Weighted Dimension Score
                        {sortBy === 'weighted' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
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
                            <ScoreCell score={company.weightedScore} isComplete={company.isComplete} size="large" viewMode={viewMode} benchmark={averages.weighted.total} />
                          </td>
                        ))}
                      </>
                    ) : (
                      <td colSpan={4 + sortedCompanies.length} className="px-4 py-3 bg-red-50 border-r border-red-200">
                        <div className="flex items-center gap-2 text-red-700">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Dimension weights must sum to 100% (currently {weightsSum}%)</span>
                        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Score Colors</p>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#059669' }} />
                  <span>80-100 (Excellent)</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#0284C7' }} />
                  <span>60-79 (Good)</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#D97706' }} />
                  <span>40-59 (Developing)</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#DC2626' }} />
                  <span>0-39 (Needs Focus)</span>
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Company Types</p>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded bg-violet-500" />
                  <span>Founding Partner (FP)</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded bg-slate-500" />
                  <span>Standard (STD)</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  <span>Panel Data</span>
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Data Quality</p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="ring-2 ring-amber-400 ring-offset-1 rounded px-2 py-0.5 font-bold">42</span>
                <span>= Over 40% "Unsure" responses (data quality note)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

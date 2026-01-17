/**
 * AGGREGATE SCORING REPORT - REDESIGNED
 * 
 * Clean visual hierarchy with two scoring sections:
 * 1. DIMENSION SCORES → Unweighted → Weighted → Performance Tier
 * 2. ENHANCEMENT FACTORS → Enhanced Composite → Enhanced Tier
 * 
 * Features:
 * - Optimal UX with clear section separation
 * - Educational modals explaining calculations
 * - Subtle styling for insufficient data (no warning icons)
 * - Consistent typography and visual polish
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { calculateEnhancedScore } from '@/lib/enhanced-scoring';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_WEIGHTS: Record<number, number> = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3,
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

function getGeoMultiplier(geoResponse: string | undefined | null): number {
  if (!geoResponse) return 1.0;
  const s = geoResponse.toLowerCase();
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
    if (isUnsure) {
      result.unsureCount++;
      result.answeredItems++;
    } else if (points !== null) {
      result.answeredItems++;
      earnedPoints += points;
    }
  });
  
  result.unsurePercent = result.totalItems > 0 ? result.unsureCount / result.totalItems : 0;
  result.isInsufficientData = result.unsurePercent > INSUFFICIENT_DATA_THRESHOLD;
  
  const maxPoints = result.answeredItems * POINTS.CURRENTLY_OFFER;
  if (maxPoints > 0) {
    result.rawScore = Math.round((earnedPoints / maxPoints) * 100);
  }
  
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
  completedDimCount: number;
  enhancedComposite: number;
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
  
  // Enhanced scores
  let enhancedResult = { compositeScore: weightedScore, depthScore: 0, maturityScore: 0, breadthScore: 0 };
  try {
    const enhanced = calculateEnhancedScore(assessment);
    enhancedResult = {
      compositeScore: enhanced.compositeScore,
      depthScore: enhanced.depthScore,
      maturityScore: enhanced.maturityScore,
      breadthScore: enhanced.breadthScore,
    };
  } catch (e) {}
  
  return {
    companyName: assessment.company_name || 'Unknown',
    surveyId: assessment.app_id || assessment.survey_id || 'N/A',
    dimensions, unweightedScore, weightedScore, insufficientDataCount,
    isProvisional, isComplete, isFoundingPartner, completedDimCount,
    enhancedComposite: enhancedResult.compositeScore,
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

function getScoreBg(score: number): string {
  if (score >= 80) return '#ECFDF5';
  if (score >= 60) return '#EFF6FF';
  if (score >= 40) return '#FFFBEB';
  return '#FEF2F2';
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

function DimensionScoringModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">How Dimension & Composite Scores Work</h2>
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
                  <span className="font-bold text-gray-500">0 points</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                <strong>Raw Score</strong> = (Points Earned ÷ Max Possible) × 100
              </p>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">2</span>
                Geographic Coverage Adjustment
              </h3>
              <p className="text-gray-600 mb-3">Scores are adjusted based on global consistency:</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="font-bold text-green-700">1.0×</p>
                  <p className="text-xs text-green-600">Consistent globally</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="font-bold text-amber-700">0.9×</p>
                  <p className="text-xs text-amber-600">Varies by location</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <p className="font-bold text-orange-700">0.75×</p>
                  <p className="text-xs text-orange-600">Select locations only</p>
                </div>
              </div>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">3</span>
                Composite Score Calculation
              </h3>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-indigo-800 mb-3">
                  <strong>Unweighted:</strong> Simple average of all 13 dimension scores
                </p>
                <p className="text-sm text-indigo-800">
                  <strong>Weighted:</strong> Each dimension contributes based on its importance weight:
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between"><span>D4: Navigation</span><span className="font-bold">14%</span></div>
                  <div className="flex justify-between"><span>D8: Work Continuation</span><span className="font-bold">13%</span></div>
                  <div className="flex justify-between"><span>D3: Manager Prep</span><span className="font-bold">12%</span></div>
                  <div className="flex justify-between"><span>D2: Insurance</span><span className="font-bold">11%</span></div>
                  <div className="flex justify-between"><span>D13: Communication</span><span className="font-bold">10%</span></div>
                  <div className="flex justify-between"><span>D6: Culture</span><span className="font-bold">8%</span></div>
                  <div className="flex justify-between"><span>D1: Medical Leave</span><span className="font-bold">7%</span></div>
                  <div className="flex justify-between"><span>D5: Accommodations</span><span className="font-bold">7%</span></div>
                  <div className="flex justify-between text-gray-500"><span>D7, D9, D10</span><span>4% each</span></div>
                  <div className="flex justify-between text-gray-500"><span>D11, D12</span><span>3% each</span></div>
                </div>
              </div>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">4</span>
                Performance Tiers
              </h3>
              <div className="space-y-2">
                {[
                  { name: 'Exemplary', range: '90-100', ...getPerformanceTier(95) },
                  { name: 'Leading', range: '75-89', ...getPerformanceTier(80) },
                  { name: 'Progressing', range: '60-74', ...getPerformanceTier(65) },
                  { name: 'Emerging', range: '40-59', ...getPerformanceTier(50) },
                  { name: 'Beginning', range: '0-39', ...getPerformanceTier(30) },
                ].map(tier => (
                  <div key={tier.name} className="flex items-center gap-3">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-bold border"
                      style={{ backgroundColor: tier.bg, color: tier.color, borderColor: tier.border }}
                    >
                      {tier.name}
                    </span>
                    <span className="text-gray-600 text-sm">{tier.range} points</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnhancedScoringModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">How Enhanced Scoring Works</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-purple-800 font-medium">
                Enhanced scoring goes beyond grid responses to evaluate the <strong>quality and depth</strong> of an organization's support programs.
              </p>
            </div>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">D</span>
                Depth Score (15% weight)
              </h3>
              <p className="text-gray-600 mb-3">Measures the <strong>quality of follow-up responses</strong>:</p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>D1.1: Duration of paid leave beyond legal requirements</li>
                <li>D1.5: Weeks of job protection guaranteed</li>
                <li>D3.1: Percentage of managers trained</li>
                <li>D3.1a: Whether training is mandatory</li>
                <li>D4.1a/b: Navigation providers and services available</li>
                <li>D6.2: Methods for measuring psychological safety</li>
                <li>D11.1: Screenings covered at 70%+</li>
                <li>D12.1: Case review process (systematic vs ad hoc)</li>
                <li>D13.1: Communication frequency</li>
              </ul>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">M</span>
                Maturity Score (10% weight)
              </h3>
              <p className="text-gray-600 mb-3">Evaluates <strong>organizational support maturity</strong>:</p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>OR1: Current approach to support (Comprehensive → No formal approach)</li>
                <li>OR5a: Types of caregiver support provided</li>
                <li>OR6: Methods for monitoring program effectiveness</li>
              </ul>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">B</span>
                Breadth Score (5% weight)
              </h3>
              <p className="text-gray-600 mb-3">Measures <strong>coverage scope and structure</strong>:</p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>CB3a: Support beyond legal requirements</li>
                <li>CB3b: Program structure (coordinated services, formal programs)</li>
                <li>CB3c: Health conditions covered by programs</li>
              </ul>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3">Enhanced Composite Formula</h3>
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-4 border border-purple-200">
                <div className="text-center">
                  <p className="text-sm text-purple-700 mb-2">Enhanced Composite Score =</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-lg font-bold">Dimension × 70%</span>
                    <span className="text-purple-600 font-bold">+</span>
                    <span className="px-3 py-1 bg-purple-500 text-white rounded-lg font-bold">Depth × 15%</span>
                    <span className="text-purple-600 font-bold">+</span>
                    <span className="px-3 py-1 bg-purple-500 text-white rounded-lg font-bold">Maturity × 10%</span>
                    <span className="text-purple-600 font-bold">+</span>
                    <span className="px-3 py-1 bg-purple-500 text-white rounded-lg font-bold">Breadth × 5%</span>
                  </div>
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
  isInsufficientData = false,
  size = 'normal',
  showBg = false,
}: { 
  score: number | null; 
  isComplete: boolean; 
  isInsufficientData?: boolean;
  size?: 'normal' | 'large';
  showBg?: boolean;
}) {
  if (!isComplete) {
    return <span className="text-xs text-gray-400 italic">—</span>;
  }
  if (score === null) {
    return <span className="text-gray-400">—</span>;
  }
  
  const color = getScoreColor(score);
  const bg = showBg ? getScoreBg(score) : 'transparent';
  
  return (
    <span 
      className={`font-bold ${size === 'large' ? 'text-xl' : 'text-base'} ${
        isInsufficientData ? 'ring-2 ring-amber-400 ring-offset-1 rounded px-1' : ''
      }`}
      style={{ color, backgroundColor: bg }}
      title={isInsufficientData ? 'Over 40% responses were "Unsure"' : undefined}
    >
      {score}
    </span>
  );
}

// ============================================
// TIER BADGE COMPONENT  
// ============================================

function TierBadge({ score, isComplete, size = 'normal' }: { score: number; isComplete: boolean; size?: 'normal' | 'small' }) {
  if (!isComplete) {
    return <span className="text-xs text-gray-400 italic">—</span>;
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
  const [assessments, setAssessments] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState<Record<number, number>>({ ...DEFAULT_WEIGHTS });
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'weighted' | 'enhanced'>('weighted');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'fp' | 'standard'>('all');
  const [filterComplete, setFilterComplete] = useState(false);

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
    if (filterType === 'fp') filtered = companyScores.filter(c => c.isFoundingPartner);
    else if (filterType === 'standard') filtered = companyScores.filter(c => !c.isFoundingPartner);
    if (filterComplete) filtered = filtered.filter(c => c.isComplete);
    
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.companyName.localeCompare(b.companyName);
      else if (sortBy === 'weighted') comparison = a.weightedScore - b.weightedScore;
      else if (sortBy === 'enhanced') comparison = a.enhancedComposite - b.enhancedComposite;
      return sortDir === 'desc' ? -comparison : comparison;
    });
  }, [companyScores, sortBy, sortDir, filterType, filterComplete]);

  const averages = useMemo(() => {
    const complete = companyScores.filter(c => c.isComplete);
    const fp = complete.filter(c => c.isFoundingPartner);
    const std = complete.filter(c => !c.isFoundingPartner);
    
    const calcAvg = (arr: CompanyScores[], key: keyof CompanyScores) => 
      arr.length > 0 ? Math.round(arr.reduce((s, c) => s + (c[key] as number), 0) / arr.length) : null;
    
    const dimAvg = (dim: number) => ({
      total: complete.length > 0 ? Math.round(complete.reduce((s, c) => s + c.dimensions[dim].adjustedScore, 0) / complete.length) : null,
      fp: fp.length > 0 ? Math.round(fp.reduce((s, c) => s + c.dimensions[dim].adjustedScore, 0) / fp.length) : null,
      std: std.length > 0 ? Math.round(std.reduce((s, c) => s + c.dimensions[dim].adjustedScore, 0) / std.length) : null,
    });
    
    return {
      dimensions: Object.fromEntries(DIMENSION_ORDER.map(d => [d, dimAvg(d)])),
      unweighted: { total: calcAvg(complete, 'unweightedScore'), fp: calcAvg(fp, 'unweightedScore'), std: calcAvg(std, 'unweightedScore') },
      weighted: { total: calcAvg(complete, 'weightedScore'), fp: calcAvg(fp, 'weightedScore'), std: calcAvg(std, 'weightedScore') },
      depth: { total: calcAvg(complete, 'depthScore'), fp: calcAvg(fp, 'depthScore'), std: calcAvg(std, 'depthScore') },
      maturity: { total: calcAvg(complete, 'maturityScore'), fp: calcAvg(fp, 'maturityScore'), std: calcAvg(std, 'maturityScore') },
      breadth: { total: calcAvg(complete, 'breadthScore'), fp: calcAvg(fp, 'breadthScore'), std: calcAvg(std, 'breadthScore') },
      enhanced: { total: calcAvg(complete, 'enhancedComposite'), fp: calcAvg(fp, 'enhancedComposite'), std: calcAvg(std, 'enhancedComposite') },
      counts: { total: complete.length, fp: fp.length, std: std.length },
    };
  }, [companyScores]);

  const handleSort = (column: 'name' | 'weighted' | 'enhanced') => {
    if (sortBy === column) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortDir(column === 'name' ? 'asc' : 'desc'); }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {showDimensionModal && <DimensionScoringModal onClose={() => setShowDimensionModal(false)} />}
      {showEnhancedModal && <EnhancedScoringModal onClose={() => setShowEnhancedModal(false)} />}

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white py-5 px-8 shadow-xl">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-xl">📊</span>
                Best Companies Scoring Report
              </h1>
              <p className="text-indigo-200 text-sm mt-1">Workplace Support Excellence Index</p>
            </div>
            <div className="flex items-center gap-3">
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
                <span className="font-bold text-xl">{companyScores.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold">⭐ FP</span>
                <span className="font-bold">{companyScores.filter(c => c.isFoundingPartner).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-bold">STD</span>
                <span className="font-bold">{companyScores.filter(c => !c.isFoundingPartner).length}</span>
              </div>
              <div className="border-l border-white/20 pl-4 flex items-center gap-2">
                <span className="text-green-300">✓ Complete:</span>
                <span className="font-bold">{companyScores.filter(c => c.isComplete).length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'fp' | 'standard')}
                className="bg-white/10 text-white border-0 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-white/30"
              >
                <option value="all" className="text-gray-900">All Companies</option>
                <option value="fp" className="text-gray-900">Founding Partners</option>
                <option value="standard" className="text-gray-900">Standard Only</option>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {/* Column Group Headers */}
                  <tr className="bg-slate-800 text-white">
                    <th colSpan={2} className="px-4 py-2 text-left text-xs font-medium border-r border-slate-600"
                        style={{ position: 'sticky', left: 0, zIndex: 30, backgroundColor: '#1E293B' }}>
                      DIMENSIONS
                    </th>
                    <th colSpan={3} className="px-4 py-2 text-center text-xs font-medium bg-indigo-700 border-r border-indigo-500">
                      BENCHMARKS
                    </th>
                    <th colSpan={sortedCompanies.length} className="px-4 py-2 text-center text-xs font-medium bg-slate-700">
                      COMPANIES ({sortedCompanies.length})
                    </th>
                  </tr>
                  
                  {/* Main Header Row */}
                  <tr className="bg-slate-700 text-white">
                    <th className="px-4 py-3 text-left font-semibold border-r border-slate-600"
                        style={{ position: 'sticky', left: 0, zIndex: 30, minWidth: COL1_WIDTH, backgroundColor: '#334155' }}>
                      <button onClick={() => handleSort('name')} className="hover:text-indigo-300 flex items-center gap-1">
                        Dimension {sortBy === 'name' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </button>
                    </th>
                    <th className="px-2 py-3 text-center font-semibold border-r border-slate-600"
                        style={{ position: 'sticky', left: COL1_WIDTH, zIndex: 30, width: COL2_WIDTH, backgroundColor: '#334155' }}>
                      Wt%
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-indigo-600 border-r border-indigo-500"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, zIndex: 30, width: COL_AVG_WIDTH }}>
                      ALL
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-amber-600 border-r border-amber-500"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, zIndex: 30, width: COL_AVG_WIDTH }}>
                      ⭐ FP
                    </th>
                    <th className="px-2 py-3 text-center font-semibold bg-cyan-600 border-r border-cyan-500"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), zIndex: 30, width: COL_AVG_WIDTH }}>
                      STD
                    </th>
                    {sortedCompanies.map(company => (
                      <th key={company.surveyId} 
                          className={`px-3 py-2 text-center font-medium border-r last:border-r-0 ${
                            company.isFoundingPartner ? 'bg-amber-600' : 'bg-cyan-700'
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
                  {/* SECTION 1: DIMENSION SCORES */}
                  {/* ============================================ */}
                  
                  {/* Section Header */}
                  <tr>
                    <td colSpan={5 + sortedCompanies.length} className="bg-blue-50 border-y-2 border-blue-200">
                      <div className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">D</span>
                          <span className="font-bold text-blue-900">Dimension Scores</span>
                          <span className="text-blue-600 text-sm">(Grid-based assessment)</span>
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
                  {DIMENSION_ORDER.map((dim, idx) => (
                    <tr key={dim} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className={`px-4 py-2.5 border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          style={{ position: 'sticky', left: 0, zIndex: 10 }}>
                        <span className="font-medium text-gray-900">
                          <span className="text-blue-600 font-bold">D{dim}:</span> {DIMENSION_NAMES[dim]}
                        </span>
                      </td>
                      <td className={`px-2 py-2.5 text-center text-xs text-gray-500 border-r border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          style={{ position: 'sticky', left: COL1_WIDTH, zIndex: 10 }}>
                        {weights[dim]}%
                      </td>
                      <td className="px-2 py-2.5 text-center bg-indigo-50 border-r border-indigo-100"
                          style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, zIndex: 10 }}>
                        <ScoreCell score={averages.dimensions[dim]?.total ?? null} isComplete={true} />
                      </td>
                      <td className="px-2 py-2.5 text-center bg-amber-50 border-r border-amber-100"
                          style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, zIndex: 10 }}>
                        <ScoreCell score={averages.dimensions[dim]?.fp ?? null} isComplete={true} />
                      </td>
                      <td className="px-2 py-2.5 text-center bg-cyan-50 border-r border-cyan-100"
                          style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), zIndex: 10 }}>
                        <ScoreCell score={averages.dimensions[dim]?.std ?? null} isComplete={true} />
                      </td>
                      {sortedCompanies.map(company => (
                        <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-gray-100 last:border-r-0 ${
                          company.isFoundingPartner ? 'bg-amber-50/30' : ''
                        }`}>
                          <ScoreCell 
                            score={company.dimensions[dim]?.adjustedScore ?? null} 
                            isComplete={company.dimensions[dim]?.totalItems > 0}
                            isInsufficientData={company.dimensions[dim]?.isInsufficientData}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  
                  {/* Unweighted Average Row */}
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="px-4 py-3 bg-gray-100 border-r border-gray-300"
                        style={{ position: 'sticky', left: 0, zIndex: 10 }}>
                      <span className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-6 h-6 bg-gray-500 rounded flex items-center justify-center text-white text-xs">Σ</span>
                        Unweighted Average
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-500 bg-gray-100 border-r border-gray-300"
                        style={{ position: 'sticky', left: COL1_WIDTH, zIndex: 10 }}>avg</td>
                    <td className="px-2 py-3 text-center bg-indigo-100 border-r border-indigo-200 font-bold text-lg"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, zIndex: 10, color: getScoreColor(averages.unweighted.total ?? 0) }}>
                      {averages.unweighted.total ?? '—'}
                    </td>
                    <td className="px-2 py-3 text-center bg-amber-100 border-r border-amber-200 font-bold text-lg"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, zIndex: 10, color: getScoreColor(averages.unweighted.fp ?? 0) }}>
                      {averages.unweighted.fp ?? '—'}
                    </td>
                    <td className="px-2 py-3 text-center bg-cyan-100 border-r border-cyan-200 font-bold text-lg"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), zIndex: 10, color: getScoreColor(averages.unweighted.std ?? 0) }}>
                      {averages.unweighted.std ?? '—'}
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-gray-200 last:border-r-0 ${
                        company.isFoundingPartner ? 'bg-amber-100/50' : 'bg-gray-100'
                      }`}>
                        <ScoreCell score={company.unweightedScore} isComplete={company.isComplete} size="large" />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Weighted Composite Row */}
                  <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                    <td className="px-4 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 border-r border-blue-200"
                        style={{ position: 'sticky', left: 0, zIndex: 10 }}>
                      <button onClick={() => handleSort('weighted')} className="font-bold text-blue-900 flex items-center gap-2 hover:text-blue-700">
                        <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">W</span>
                        Weighted Composite
                        {sortBy === 'weighted' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </button>
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-blue-600 bg-gradient-to-r from-blue-100 to-indigo-100 border-r border-blue-200"
                        style={{ position: 'sticky', left: COL1_WIDTH, zIndex: 10 }}>wgt</td>
                    <td className="px-2 py-3 text-center bg-blue-200 border-r border-blue-300 font-black text-xl"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, zIndex: 10, color: getScoreColor(averages.weighted.total ?? 0) }}>
                      {averages.weighted.total ?? '—'}
                    </td>
                    <td className="px-2 py-3 text-center bg-amber-200 border-r border-amber-300 font-black text-xl"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, zIndex: 10, color: getScoreColor(averages.weighted.fp ?? 0) }}>
                      {averages.weighted.fp ?? '—'}
                    </td>
                    <td className="px-2 py-3 text-center bg-cyan-200 border-r border-cyan-300 font-black text-xl"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), zIndex: 10, color: getScoreColor(averages.weighted.std ?? 0) }}>
                      {averages.weighted.std ?? '—'}
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-blue-200 last:border-r-0 ${
                        company.isFoundingPartner ? 'bg-amber-100/70' : 'bg-blue-50'
                      }`}>
                        <ScoreCell score={company.weightedScore} isComplete={company.isComplete} size="large" />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Performance Tier Row (Weighted) */}
                  <tr className="bg-white border-b-4 border-indigo-300">
                    <td className="px-4 py-3 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: 0, zIndex: 10 }}>
                      <span className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center text-white text-xs">🏆</span>
                        Performance Tier
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: COL1_WIDTH, zIndex: 10 }}></td>
                    <td className="px-2 py-3 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, zIndex: 10 }}>
                      {averages.weighted.total !== null && <TierBadge score={averages.weighted.total} isComplete={true} size="small" />}
                    </td>
                    <td className="px-2 py-3 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, zIndex: 10 }}>
                      {averages.weighted.fp !== null && <TierBadge score={averages.weighted.fp} isComplete={true} size="small" />}
                    </td>
                    <td className="px-2 py-3 text-center bg-cyan-50 border-r border-cyan-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), zIndex: 10 }}>
                      {averages.weighted.std !== null && <TierBadge score={averages.weighted.std} isComplete={true} size="small" />}
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-gray-100 last:border-r-0 ${
                        company.isFoundingPartner ? 'bg-amber-50/30' : ''
                      }`}>
                        <TierBadge score={company.weightedScore} isComplete={company.isComplete} size="small" />
                      </td>
                    ))}
                  </tr>
                  
                  {/* ============================================ */}
                  {/* SECTION 2: ENHANCEMENT FACTORS */}
                  {/* ============================================ */}
                  
                  {/* Section Header */}
                  <tr>
                    <td colSpan={5 + sortedCompanies.length} className="bg-purple-50 border-y-2 border-purple-200">
                      <div className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">+</span>
                          <span className="font-bold text-purple-900">Enhancement Factors</span>
                          <span className="text-purple-600 text-sm">(Beyond grid responses)</span>
                        </div>
                        <button 
                          onClick={() => setShowEnhancedModal(true)}
                          className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          How Enhanced Scoring Works
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Depth Score Row */}
                  <tr className="bg-purple-50/50">
                    <td className="px-4 py-2.5 bg-purple-50/50 border-r border-purple-100"
                        style={{ position: 'sticky', left: 0, zIndex: 10 }}>
                      <span className="font-medium text-purple-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-500 rounded text-white text-xs flex items-center justify-center font-bold">D</span>
                        Depth Score
                        <span className="text-xs text-purple-500 font-normal">(Follow-up quality)</span>
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-purple-500 bg-purple-50/50 border-r border-purple-100"
                        style={{ position: 'sticky', left: COL1_WIDTH, zIndex: 10 }}>15%</td>
                    <td className="px-2 py-2.5 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, zIndex: 10 }}>
                      <ScoreCell score={averages.depth.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, zIndex: 10 }}>
                      <ScoreCell score={averages.depth.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-cyan-50 border-r border-cyan-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), zIndex: 10 }}>
                      <ScoreCell score={averages.depth.std} isComplete={true} />
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-purple-100 last:border-r-0 ${
                        company.isFoundingPartner ? 'bg-amber-50/30' : 'bg-purple-50/30'
                      }`}>
                        <ScoreCell score={company.depthScore} isComplete={company.isComplete} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Maturity Score Row */}
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 bg-white border-r border-purple-100"
                        style={{ position: 'sticky', left: 0, zIndex: 10 }}>
                      <span className="font-medium text-purple-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-500 rounded text-white text-xs flex items-center justify-center font-bold">M</span>
                        Maturity Score
                        <span className="text-xs text-purple-500 font-normal">(Support approach)</span>
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-purple-500 bg-white border-r border-purple-100"
                        style={{ position: 'sticky', left: COL1_WIDTH, zIndex: 10 }}>10%</td>
                    <td className="px-2 py-2.5 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, zIndex: 10 }}>
                      <ScoreCell score={averages.maturity.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, zIndex: 10 }}>
                      <ScoreCell score={averages.maturity.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-cyan-50 border-r border-cyan-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), zIndex: 10 }}>
                      <ScoreCell score={averages.maturity.std} isComplete={true} />
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-purple-100 last:border-r-0 ${
                        company.isFoundingPartner ? 'bg-amber-50/30' : ''
                      }`}>
                        <ScoreCell score={company.maturityScore} isComplete={company.isComplete} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Breadth Score Row */}
                  <tr className="bg-purple-50/50">
                    <td className="px-4 py-2.5 bg-purple-50/50 border-r border-purple-100"
                        style={{ position: 'sticky', left: 0, zIndex: 10 }}>
                      <span className="font-medium text-purple-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-500 rounded text-white text-xs flex items-center justify-center font-bold">B</span>
                        Breadth Score
                        <span className="text-xs text-purple-500 font-normal">(Coverage scope)</span>
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-purple-500 bg-purple-50/50 border-r border-purple-100"
                        style={{ position: 'sticky', left: COL1_WIDTH, zIndex: 10 }}>5%</td>
                    <td className="px-2 py-2.5 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, zIndex: 10 }}>
                      <ScoreCell score={averages.breadth.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, zIndex: 10 }}>
                      <ScoreCell score={averages.breadth.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-cyan-50 border-r border-cyan-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), zIndex: 10 }}>
                      <ScoreCell score={averages.breadth.std} isComplete={true} />
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-purple-100 last:border-r-0 ${
                        company.isFoundingPartner ? 'bg-amber-50/30' : 'bg-purple-50/30'
                      }`}>
                        <ScoreCell score={company.breadthScore} isComplete={company.isComplete} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Enhanced Composite Row */}
                  <tr className="bg-gradient-to-r from-purple-100 to-indigo-100">
                    <td className="px-4 py-3 bg-gradient-to-r from-purple-100 to-indigo-100 border-r border-purple-200"
                        style={{ position: 'sticky', left: 0, zIndex: 10 }}>
                      <button onClick={() => handleSort('enhanced')} className="font-bold text-purple-900 flex items-center gap-2 hover:text-purple-700">
                        <span className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">★</span>
                        Enhanced Composite
                        {sortBy === 'enhanced' && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </button>
                      <span className="text-[10px] text-purple-600 ml-8 block">(Dim 70% + Depth 15% + Maturity 10% + Breadth 5%)</span>
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-purple-600 bg-gradient-to-r from-purple-100 to-indigo-100 border-r border-purple-200"
                        style={{ position: 'sticky', left: COL1_WIDTH, zIndex: 10 }}>enh</td>
                    <td className="px-2 py-3 text-center bg-purple-200 border-r border-purple-300 font-black text-xl"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, zIndex: 10, color: getScoreColor(averages.enhanced.total ?? 0) }}>
                      {averages.enhanced.total ?? '—'}
                    </td>
                    <td className="px-2 py-3 text-center bg-amber-200 border-r border-amber-300 font-black text-xl"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, zIndex: 10, color: getScoreColor(averages.enhanced.fp ?? 0) }}>
                      {averages.enhanced.fp ?? '—'}
                    </td>
                    <td className="px-2 py-3 text-center bg-cyan-200 border-r border-cyan-300 font-black text-xl"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), zIndex: 10, color: getScoreColor(averages.enhanced.std ?? 0) }}>
                      {averages.enhanced.std ?? '—'}
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-purple-200 last:border-r-0 ${
                        company.isFoundingPartner ? 'bg-amber-100/70' : 'bg-purple-50'
                      }`}>
                        <ScoreCell score={company.enhancedComposite} isComplete={company.isComplete} size="large" />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Enhanced Performance Tier Row */}
                  <tr className="bg-white">
                    <td className="px-4 py-3 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: 0, zIndex: 10 }}>
                      <span className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded flex items-center justify-center text-white text-xs">🏆</span>
                        Enhanced Tier
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: COL1_WIDTH, zIndex: 10 }}></td>
                    <td className="px-2 py-3 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH, zIndex: 10 }}>
                      {averages.enhanced.total !== null && <TierBadge score={averages.enhanced.total} isComplete={true} size="small" />}
                    </td>
                    <td className="px-2 py-3 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH, zIndex: 10 }}>
                      {averages.enhanced.fp !== null && <TierBadge score={averages.enhanced.fp} isComplete={true} size="small" />}
                    </td>
                    <td className="px-2 py-3 text-center bg-cyan-50 border-r border-cyan-100"
                        style={{ position: 'sticky', left: COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH), zIndex: 10 }}>
                      {averages.enhanced.std !== null && <TierBadge score={averages.enhanced.std} isComplete={true} size="small" />}
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-gray-100 last:border-r-0 ${
                        company.isFoundingPartner ? 'bg-amber-50/30' : ''
                      }`}>
                        <TierBadge score={company.enhancedComposite} isComplete={company.isComplete} size="small" />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-5">
          <h3 className="font-bold text-gray-900 mb-3">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

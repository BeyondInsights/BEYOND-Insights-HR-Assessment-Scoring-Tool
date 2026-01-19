/**
 * AGGREGATE SCORING REPORT - REDESIGNED
 * 
 * Clean visual hierarchy with two scoring sections:
 * 1. DIMENSION SCORES -> Unweighted -> Weighted ? Performance Tier
 * 2. ENHANCEMENT FACTORS -> Enhanced Composite ? Enhanced Tier
 * 
 * Features:
 * - Optimal UX with clear section separation
 * - Educational modals explaining calculations
 * - Subtle styling for insufficient data (no warning icons)
 * - Consistent typography and visual polish
 * - Panel data benchmark separate from FP/Standard
 * - Option to include/exclude panel data
 * - Sticky company headers for vertical scrolling
 * - Scroll controls at top of page
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

function getGeoMultiplier(geoResponse: string | number | undefined | null): number {
  if (geoResponse === undefined || geoResponse === null) return 1.0;
  
  // Handle numeric values (from panel data)
  if (typeof geoResponse === 'number') {
    switch (geoResponse) {
      case 1: return 0.75;  // Only available in select locations
      case 2: return 0.90;  // Vary across locations
      case 3: return 1.0;   // Generally consistent across all locations
      default: return 1.0;
    }
  }
  
  // Handle string values
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
  isPanel: boolean; // NEW: Track panel data separately
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
  const isPanel = appId.startsWith('PANEL-'); // NEW: Detect panel data
  
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
                  <span className="font-bold text-gray-500">0 pts (in denominator)</span>
                </div>
              </div>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">2</span>
                Geographic Multiplier
              </h3>
              <p className="text-gray-600 mb-3">Scores are adjusted based on geographic consistency:</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Generally consistent across all locations</span><span className="font-bold">?1.00</span></div>
                <div className="flex justify-between"><span>Vary across locations</span><span className="font-bold">?0.90</span></div>
                <div className="flex justify-between"><span>Only available in select locations</span><span className="font-bold">?0.75</span></div>
              </div>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">3</span>
                Composite Scores
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <p className="font-semibold text-gray-800 mb-2">Unweighted Average:</p>
                <p className="text-gray-600 text-sm mb-3">Simple average of all 13 dimension adjusted scores</p>
                <p className="font-semibold text-gray-800 mb-2">Weighted Average:</p>
                <p className="text-gray-600 text-sm">Each dimension's adjusted score multiplied by its weight percentage, then summed</p>
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-purple-800 font-medium">
                Enhanced scoring evaluates the <strong>quality and depth</strong> of support programs beyond the primary dimension grids.
              </p>
            </div>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-3">Enhanced Composite Formula</h3>
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-5 border border-purple-200">
                <div className="text-center space-y-3">
                  <p className="text-sm text-purple-700 font-medium">Enhanced Composite Score =</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
                    <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold">Weighted Dimension Score x 70%</span>
                    <span className="text-purple-600 font-bold">+</span>
                    <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold">Depth x 15%</span>
                    <span className="text-purple-600 font-bold">+</span>
                    <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold">Maturity x 10%</span>
                    <span className="text-purple-600 font-bold">+</span>
                    <span className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold">Breadth x 5%</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">All component scores are normalized to 0-100 scale before weighting</p>
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
    return <span className="text-gray-300 text-xs">?</span>;
  }
  
  // Handle NaN safety
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
    return <span className="text-gray-300 text-xs">-</span>;
  }
  
  const tier = getPerformanceTier(score);
  
  // Provisional styling - amber ring + "Provisional" label
  if (isProvisional) {
    return (
      <span className="inline-flex flex-col items-center" style={{ gap: '4px' }}>
        <span 
          className={`inline-block font-bold border rounded-full ${
            size === 'small' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          }`}
          style={{ 
            backgroundColor: tier.bg, 
            color: tier.color,
            borderColor: tier.border,
            boxShadow: '0 0 0 2px #fbbf24, 0 0 0 4px white',
          }}
          title="Provisional: >40% Unsure responses in 4+ dimensions"
        >
          {tier.name}
        </span>
        <span className="text-[7px] text-amber-700 font-bold uppercase tracking-widest bg-amber-100 px-1.5 py-0.5 rounded-sm border border-amber-300" style={{ letterSpacing: '0.08em' }}>
          Provisional
        </span>
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
  const [weights, setWeights] = useState<Record<number, number>>({ ...DEFAULT_WEIGHTS });
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'weighted' | 'enhanced'>('weighted');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'fp' | 'standard' | 'panel'>('all');
  const [filterComplete, setFilterComplete] = useState(false);
  const [viewMode, setViewMode] = useState<'score' | 'index'>('score');
  const [includePanel, setIncludePanel] = useState(true); // NEW: Panel data toggle
  
  // Dimension weights (D1-D13) - must sum to 100%
  const weightsSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const weightsValid = weightsSum === 100;
  
  // Enhancement weights (Weighted Dim, Depth, Maturity, Breadth) - must sum to 100%
  const [enhancementWeights, setEnhancementWeights] = useState({
    weightedDim: 85,
    depth: 8,
    maturity: 5,
    breadth: 2,
  });
  const enhancementWeightsSum = enhancementWeights.weightedDim + enhancementWeights.depth + enhancementWeights.maturity + enhancementWeights.breadth;
  const enhancementWeightsValid = enhancementWeightsSum === 100;

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
    
    // Apply panel filter
    if (!includePanel) {
      filtered = filtered.filter(c => !c.isPanel);
    }
    
    // Apply type filter
    if (filterType === 'fp') filtered = filtered.filter(c => c.isFoundingPartner && !c.isPanel);
    else if (filterType === 'standard') filtered = filtered.filter(c => !c.isFoundingPartner && !c.isPanel);
    else if (filterType === 'panel') filtered = filtered.filter(c => c.isPanel);
    
    if (filterComplete) filtered = filtered.filter(c => c.isComplete);
    
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.companyName.localeCompare(b.companyName);
      else if (sortBy === 'weighted') comparison = a.weightedScore - b.weightedScore;
      else if (sortBy === 'enhanced') comparison = a.enhancedComposite - b.enhancedComposite;
      return sortDir === 'desc' ? -comparison : comparison;
    });
  }, [companyScores, sortBy, sortDir, filterType, filterComplete, includePanel]);

  // Calculate averages with separate panel benchmark
  const averages = useMemo(() => {
    // Filter based on includePanel setting for total
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
      enhanced: { total: calcAvg(complete, 'enhancedComposite'), fp: calcAvg(fp, 'enhancedComposite'), std: calcAvg(std, 'enhancedComposite'), panel: calcAvg(panel, 'enhancedComposite') },
      counts: { total: complete.length, fp: fp.length, std: std.length, panel: panel.length },
    };
  }, [companyScores, includePanel]);

  const handleSort = (column: 'name' | 'weighted' | 'enhanced') => {
    if (sortBy === column) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortDir(column === 'name' ? 'asc' : 'desc'); }
  };

  // Scroll handlers
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

  // Calculate sticky left positions
  const STICKY_LEFT_1 = 0;
  const STICKY_LEFT_2 = COL1_WIDTH;
  const STICKY_LEFT_3 = COL1_WIDTH + COL2_WIDTH;
  const STICKY_LEFT_4 = COL1_WIDTH + COL2_WIDTH + COL_AVG_WIDTH;
  const STICKY_LEFT_5 = COL1_WIDTH + COL2_WIDTH + (2 * COL_AVG_WIDTH);
  const STICKY_LEFT_6 = COL1_WIDTH + COL2_WIDTH + (3 * COL_AVG_WIDTH);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {showDimensionModal && <DimensionScoringModal onClose={() => setShowDimensionModal(false)} />}
      {showEnhancedModal && <EnhancedScoringModal onClose={() => setShowEnhancedModal(false)} />}

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
              {/* Scroll Controls - MOVED TO TOP */}
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                <button 
                  onClick={scrollLeft}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  title="Scroll Left"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs px-2">Scroll</span>
                <button 
                  onClick={scrollRight}
                  className="p-2 hover:bg-white/20 rounded transition-colors"
                  title="Scroll Right"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <button onClick={() => window.print()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                Print Report
              </button>
              <button onClick={() => router.push('/admin')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                ? Back
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
                <span className="text-green-300">? Complete:</span>
                <span className="font-bold">{companyScores.filter(c => c.isComplete && (includePanel || !c.isPanel)).length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Include Panel Toggle */}
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
                onChange={(e) => setFilterType(e.target.value as 'all' | 'fp' | 'standard' | 'panel')}
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
              
              {/* Score/Index Toggle */}
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
                  title="Index: 100 = Average. Shows performance relative to benchmark."
                >
                  Index
                </button>
              </div>
              
              {/* Weight Status Indicator */}
              {Object.values(weights).reduce((a, b) => a + b, 0) !== 100 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-400/50 rounded-lg">
                  <svg className="w-4 h-4 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-red-200 font-medium">
                    Weights = {Object.values(weights).reduce((a, b) => a + b, 0)}% (must be 100%)
                  </span>
                  <button
                    onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}
                    className="text-xs px-2 py-0.5 bg-red-500/30 hover:bg-red-500/50 rounded text-red-100 ml-1"
                  >
                    Reset
                  </button>
                </div>
              )}
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
            <div ref={tableRef} className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-50">
                  {/* Column Group Headers */}
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
                  
                  {/* Main Header Row - STICKY for vertical scroll */}
                  <tr className="bg-slate-700 text-white" style={{ position: 'sticky', top: 0, zIndex: 25 }}>
                    <th className="px-4 py-3 text-left font-semibold border-r border-slate-600"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 35, minWidth: COL1_WIDTH, backgroundColor: '#334155' }}>
                      <button onClick={() => handleSort('name')} className="hover:text-indigo-300 flex items-center gap-1">
                        Dimension {sortBy === 'name' && <span className="text-xs">{sortDir === 'asc' ? '2191' : '2193'}</span>}
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
                          style={{ minWidth: 100, position: 'sticky', top: 0 }}>
                        <Link href={`/admin/profile/${company.surveyId}`} className="text-xs hover:underline block truncate text-white" title={company.isPanel ? `Panel Co ${company.surveyId.replace('PANEL-', '').replace(/^0+/, '')}` : company.companyName}>
                          {company.isPanel 
                            ? `Panel Co ${company.surveyId.replace('PANEL-', '').replace(/^0+/, '')}`
                            : (company.companyName.length > 12 ? company.companyName.substring(0, 12) + '...' : company.companyName)
                          }
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
                    <td colSpan={6 + sortedCompanies.length} className="bg-blue-50 border-y-2 border-blue-200">
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
                      <span className="font-semibold text-blue-800">Unweighted Average</span>
                      <span className="text-blue-600 text-xs ml-2">(13 dimensions)</span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-blue-600 border-r border-blue-200 bg-blue-50"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>avg</td>
                    <td className="px-2 py-2.5 text-center bg-indigo-100 border-r border-indigo-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10, color: getScoreColor(averages.unweighted.total ?? 0) }}>
                      {averages.unweighted.total ?? '?'}
                    </td>
                    <td className="px-2 py-2.5 text-center bg-violet-100 border-r border-violet-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10, color: getScoreColor(averages.unweighted.fp ?? 0) }}>
                      {averages.unweighted.fp ?? '?'}
                    </td>
                    <td className="px-2 py-2.5 text-center bg-slate-100 border-r border-slate-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10, color: getScoreColor(averages.unweighted.std ?? 0) }}>
                      {averages.unweighted.std ?? '?'}
                    </td>
                    <td className="px-2 py-2.5 text-center bg-amber-100 border-r border-amber-200 font-bold"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10, color: getScoreColor(averages.unweighted.panel ?? 0) }}>
                      {averages.unweighted.panel ?? '?'}
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
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${weightsValid ? 'bg-blue-600' : 'bg-red-500'}`}>?</span>
                        Weighted Score
                        {sortBy === 'weighted' && <span className="text-xs">{sortDir === 'asc' ? '2191' : '2193'}</span>}
                      </button>
                    </td>
                    <td className={`px-2 py-3 text-center text-xs border-r ${weightsValid ? 'text-blue-600 bg-blue-100 border-blue-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      {weightsValid ? (
                        <span className="text-blue-600">100%</span>
                      ) : (
                        <span className="text-red-600 font-bold">{weightsSum}%</span>
                      )}
                    </td>
                    {weightsValid ? (
                      <>
                        <td className="px-2 py-3 text-center bg-indigo-200 border-r border-indigo-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10, color: getScoreColor(averages.weighted.total ?? 0) }}>
                          {averages.weighted.total ?? '?'}
                        </td>
                        <td className="px-2 py-3 text-center bg-violet-200 border-r border-violet-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10, color: getScoreColor(averages.weighted.fp ?? 0) }}>
                          {averages.weighted.fp ?? '?'}
                        </td>
                        <td className="px-2 py-3 text-center bg-slate-200 border-r border-slate-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10, color: getScoreColor(averages.weighted.std ?? 0) }}>
                          {averages.weighted.std ?? '?'}
                        </td>
                        <td className="px-2 py-3 text-center bg-amber-200 border-r border-amber-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10, color: getScoreColor(averages.weighted.panel ?? 0) }}>
                          {averages.weighted.panel ?? '?'}
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
                          <button
                            onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}
                            className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Reset to Defaults
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  
                  {/* Performance Tier Row - only show if weights valid */}
                  {weightsValid && (
                    <tr className="bg-white">
                      <td className="px-4 py-3 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                        <span className="font-semibold text-gray-700 flex items-center gap-2">
                          <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded flex items-center justify-center text-white">
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
                        {averages.weighted.total !== null && <TierBadge score={averages.weighted.total} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-3 text-center bg-violet-50 border-r border-violet-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                        {averages.weighted.fp !== null && <TierBadge score={averages.weighted.fp} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-3 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                        {averages.weighted.std !== null && <TierBadge score={averages.weighted.std} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-3 text-center bg-amber-50 border-r border-amber-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                        {averages.weighted.panel !== null && <TierBadge score={averages.weighted.panel} isComplete={true} size="small" />}
                      </td>
                      {sortedCompanies.map(company => (
                        <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-gray-100 last:border-r-0 ${
                          company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                        }`}>
                          <TierBadge score={company.weightedScore} isComplete={company.isComplete} isProvisional={company.isProvisional} size="small" />
                        </td>
                      ))}
                    </tr>
                  )}
                  
                  {/* ============================================ */}
                  {/* SECTION 2: ENHANCEMENT FACTORS */}
                  {/* ============================================ */}
                  
                  {/* Section Header */}
                  <tr>
                    <td colSpan={6 + sortedCompanies.length} className="bg-purple-50 border-y-2 border-purple-200">
                      <div className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">E</span>
                          <span className="font-bold text-purple-900">Enhancement Factors</span>
                          <span className="text-purple-600 text-sm">(Depth, Maturity, Breadth)</span>
                        </div>
                        <button 
                          onClick={() => setShowEnhancedModal(true)}
                          className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          How Enhancement Works
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Weighted Dimension Score Row (from D1-D13) */}
                  <tr className="bg-blue-50/50">
                    <td className="px-4 py-2.5 bg-blue-50/50 border-r border-purple-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-blue-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">W</span>
                        Weighted Dimension
                      </span>
                      <span className="text-xs text-blue-500 ml-7 block">(From D1-D13 above)</span>
                    </td>
                    <td className="px-2 py-2.5 text-center bg-blue-50/50 border-r border-purple-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={enhancementWeights.weightedDim}
                        onChange={(e) => setEnhancementWeights(prev => ({ ...prev, weightedDim: parseInt(e.target.value) || 0 }))}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-purple-300 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 bg-white"
                      />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                      <ScoreCell score={averages.weighted.total} isComplete={weightsValid} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-violet-50 border-r border-violet-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                      <ScoreCell score={averages.weighted.fp} isComplete={weightsValid} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                      <ScoreCell score={averages.weighted.std} isComplete={weightsValid} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                      <ScoreCell score={averages.weighted.panel} isComplete={weightsValid} />
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-purple-100 last:border-r-0 ${
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : 'bg-blue-50/30'
                      }`}>
                        <ScoreCell score={company.weightedScore} isComplete={company.isComplete && weightsValid} viewMode={viewMode} benchmark={averages.weighted.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Depth Score Row */}
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs font-bold">D</span>
                        Depth Score
                      </span>
                      <span className="text-gray-500 text-xs ml-7 block">Follow-up question quality</span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={enhancementWeights.depth}
                        onChange={(e) => setEnhancementWeights(prev => ({ ...prev, depth: parseInt(e.target.value) || 0 }))}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-400"
                      />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-indigo-50 border-r border-indigo-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                      <ScoreCell score={averages.depth.total} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-violet-50 border-r border-violet-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                      <ScoreCell score={averages.depth.fp} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-slate-50 border-r border-slate-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                      <ScoreCell score={averages.depth.std} isComplete={true} />
                    </td>
                    <td className="px-2 py-2.5 text-center bg-amber-50 border-r border-amber-100"
                        style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                      <ScoreCell score={averages.depth.panel} isComplete={true} />
                    </td>
                    {sortedCompanies.map(company => (
                      <td key={company.surveyId} className={`px-2 py-2.5 text-center border-r border-gray-100 last:border-r-0 ${
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                      }`}>
                        <ScoreCell score={company.depthScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.depth.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Maturity Score Row */}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2.5 bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs font-bold">M</span>
                        Maturity Score
                      </span>
                      <span className="text-gray-500 text-xs ml-7 block">Organizational readiness</span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-gray-500 bg-gray-50 border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={enhancementWeights.maturity}
                        onChange={(e) => setEnhancementWeights(prev => ({ ...prev, maturity: parseInt(e.target.value) || 0 }))}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-400"
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
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : 'bg-gray-50'
                      }`}>
                        <ScoreCell score={company.maturityScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.maturity.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Breadth Score Row */}
                  <tr className="bg-white">
                    <td className="px-4 py-2.5 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs font-bold">B</span>
                        Breadth Score
                      </span>
                      <span className="text-gray-500 text-xs ml-7 block">Program scope & coverage</span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      <input
                        type="number" min="0" max="100"
                        value={enhancementWeights.breadth}
                        onChange={(e) => setEnhancementWeights(prev => ({ ...prev, breadth: parseInt(e.target.value) || 0 }))}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-purple-400"
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
                        company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                      }`}>
                        <ScoreCell score={company.breadthScore} isComplete={company.isComplete} viewMode={viewMode} benchmark={averages.breadth.total} />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Enhanced Composite Row */}
                  <tr className={`${enhancementWeightsValid && weightsValid ? 'bg-gradient-to-r from-purple-100 to-indigo-100' : 'bg-red-50'}`}>
                    <td className={`px-4 py-3 border-r ${enhancementWeightsValid && weightsValid ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                      <button onClick={() => handleSort('enhanced')} className={`font-bold flex items-center gap-2 ${enhancementWeightsValid && weightsValid ? 'text-purple-900 hover:text-purple-700' : 'text-red-700'}`}>
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold ${enhancementWeightsValid && weightsValid ? 'bg-purple-600' : 'bg-red-500'}`}>?</span>
                        Enhanced Composite
                        {sortBy === 'enhanced' && <span className="text-xs">{sortDir === 'asc' ? '2191' : '2193'}</span>}
                      </button>
                      <span className={`text-[10px] ml-8 block ${enhancementWeightsValid && weightsValid ? 'text-purple-600' : 'text-red-600'}`}>
                        (W?{enhancementWeights.weightedDim}% + D?{enhancementWeights.depth}% + M?{enhancementWeights.maturity}% + B?{enhancementWeights.breadth}%)
                      </span>
                    </td>
                    <td className={`px-2 py-3 text-center text-xs border-r ${enhancementWeightsValid && weightsValid ? 'text-purple-600 bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-200' : 'bg-red-50 border-red-200'}`}
                        style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}>
                      {enhancementWeightsValid && weightsValid ? (
                        <span className="text-purple-600">enh</span>
                      ) : (
                        <span className="text-red-600 font-bold">{enhancementWeightsSum}%</span>
                      )}
                    </td>
                    {enhancementWeightsValid && weightsValid ? (
                      <>
                        <td className="px-2 py-3 text-center bg-purple-200 border-r border-purple-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10, color: getScoreColor(averages.enhanced.total ?? 0) }}>
                          {averages.enhanced.total ?? '?'}
                        </td>
                        <td className="px-2 py-3 text-center bg-violet-200 border-r border-violet-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10, color: getScoreColor(averages.enhanced.fp ?? 0) }}>
                          {averages.enhanced.fp ?? '?'}
                        </td>
                        <td className="px-2 py-3 text-center bg-slate-200 border-r border-slate-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10, color: getScoreColor(averages.enhanced.std ?? 0) }}>
                          {averages.enhanced.std ?? '?'}
                        </td>
                        <td className="px-2 py-3 text-center bg-amber-200 border-r border-amber-300 font-black text-xl"
                            style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10, color: getScoreColor(averages.enhanced.panel ?? 0) }}>
                          {averages.enhanced.panel ?? '?'}
                        </td>
                        {sortedCompanies.map(company => (
                          <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-purple-200 last:border-r-0 ${
                            company.isPanel ? 'bg-amber-100/70' : company.isFoundingPartner ? 'bg-violet-100/70' : 'bg-purple-50'
                          }`}>
                            <ScoreCell score={company.enhancedComposite} isComplete={company.isComplete} size="large" viewMode={viewMode} benchmark={averages.enhanced.total} />
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
                            {!weightsValid && !enhancementWeightsValid 
                              ? `Both weight sets must sum to 100% (Dimension: ${weightsSum}%, Enhancement: ${enhancementWeightsSum}%)`
                              : !weightsValid 
                                ? `Dimension weights must sum to 100% (currently ${weightsSum}%)`
                                : `Enhancement weights must sum to 100% (currently ${enhancementWeightsSum}%)`
                            }
                          </span>
                          <button
                            onClick={() => {
                              if (!weightsValid) setWeights({ ...DEFAULT_WEIGHTS });
                              if (!enhancementWeightsValid) setEnhancementWeights({ weightedDim: 85, depth: 8, maturity: 5, breadth: 2 });
                            }}
                            className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Reset Weights
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  
                  {/* Enhanced Performance Tier Row - only show if weights valid */}
                  {enhancementWeightsValid && weightsValid && (
                    <tr className="bg-white">
                      <td className="px-4 py-3 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_1, zIndex: 10 }}>
                        <span className="font-semibold text-gray-700 flex items-center gap-2">
                          <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded flex items-center justify-center text-white">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-1.17a3 3 0 01-5.66 0H8.83a3 3 0 01-5.66 0H2a2 2 0 110-4h1.17A3 3 0 015 5zm5 8a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-4 1a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </span>
                          Enhanced Tier
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-xs text-gray-500 bg-white border-r border-gray-200"
                          style={{ position: 'sticky', left: STICKY_LEFT_2, zIndex: 10 }}></td>
                      <td className="px-2 py-3 text-center bg-indigo-50 border-r border-indigo-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_3, zIndex: 10 }}>
                        {averages.enhanced.total !== null && <TierBadge score={averages.enhanced.total} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-3 text-center bg-violet-50 border-r border-violet-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_4, zIndex: 10 }}>
                        {averages.enhanced.fp !== null && <TierBadge score={averages.enhanced.fp} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-3 text-center bg-slate-50 border-r border-slate-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_5, zIndex: 10 }}>
                        {averages.enhanced.std !== null && <TierBadge score={averages.enhanced.std} isComplete={true} size="small" />}
                      </td>
                      <td className="px-2 py-3 text-center bg-amber-50 border-r border-amber-100"
                          style={{ position: 'sticky', left: STICKY_LEFT_6, zIndex: 10 }}>
                        {averages.enhanced.panel !== null && <TierBadge score={averages.enhanced.panel} isComplete={true} size="small" />}
                      </td>
                      {sortedCompanies.map(company => (
                        <td key={company.surveyId} className={`px-2 py-3 text-center border-r border-gray-100 last:border-r-0 ${
                          company.isPanel ? 'bg-amber-50/30' : company.isFoundingPartner ? 'bg-violet-50/30' : ''
                        }`}>
                          <TierBadge score={company.enhancedComposite} isComplete={company.isComplete} isProvisional={company.isProvisional} size="small" />
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

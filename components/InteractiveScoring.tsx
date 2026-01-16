/**
 * INTERACTIVE SCORING SECTION
 * 
 * Features:
 * - Adjustable dimension weights via sliders
 * - Real-time score updates
 * - Both weighted and unweighted composite scores
 * - Visual tier breakdown
 * - Reset to default weights
 * - Collapsible configuration panel
 * 
 * Add to: app/admin/profile/[surveyId]/page.tsx
 * Location: After the "Executive Summary" section, before "Company & Contact Info"
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';

// ============================================
// DEFAULT DIMENSION WEIGHTS (Total = 100%)
// ============================================
const DEFAULT_WEIGHTS: Record<number, number> = {
  // Tier 1: Highest Impact (50%)
  4: 14,   // D4: Navigation & Expert Resources
  8: 13,   // D8: Return-to-Work Excellence
  3: 12,   // D3: Manager Preparedness & Capability
  2: 11,   // D2: Insurance & Financial Protection
  
  // Tier 2: Critical Enablers (25%)
  13: 10,  // D13: Communication & Awareness
  6: 8,    // D6: Culture & Psychological Safety
  1: 7,    // D1: Medical Leave & Flexibility
  
  // Tier 3: Foundation & Support (25%)
  5: 7,    // D5: Workplace Accommodations
  7: 4,    // D7: Career Continuity
  9: 4,    // D9: Executive Commitment
  10: 4,   // D10: Caregiver & Family
  11: 3,   // D11: Prevention & Wellness
  12: 3,   // D12: Continuous Improvement
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
  11: 'Prevention, Wellness & Legal',
  12: 'Continuous Improvement',
  13: 'Communication & Awareness',
};

const DIMENSION_SHORT_NAMES: Record<number, string> = {
  1: 'Medical Leave',
  2: 'Insurance/Financial',
  3: 'Manager Prep',
  4: 'Navigation',
  5: 'Accommodations',
  6: 'Culture/Safety',
  7: 'Career Continuity',
  8: 'Return-to-Work',
  9: 'Executive',
  10: 'Caregiver',
  11: 'Prevention',
  12: 'Improvement',
  13: 'Communication',
};

const TIER_INFO: Record<number, { tier: number; name: string; color: string; bgColor: string }> = {
  4:  { tier: 1, name: 'Highest Impact', color: '#1A237E', bgColor: '#E8EAF6' },
  8:  { tier: 1, name: 'Highest Impact', color: '#1A237E', bgColor: '#E8EAF6' },
  3:  { tier: 1, name: 'Highest Impact', color: '#1A237E', bgColor: '#E8EAF6' },
  2:  { tier: 1, name: 'Highest Impact', color: '#1A237E', bgColor: '#E8EAF6' },
  13: { tier: 2, name: 'Critical Enablers', color: '#0D47A1', bgColor: '#E3F2FD' },
  6:  { tier: 2, name: 'Critical Enablers', color: '#0D47A1', bgColor: '#E3F2FD' },
  1:  { tier: 2, name: 'Critical Enablers', color: '#0D47A1', bgColor: '#E3F2FD' },
  5:  { tier: 3, name: 'Foundation', color: '#546E7A', bgColor: '#ECEFF1' },
  7:  { tier: 3, name: 'Foundation', color: '#546E7A', bgColor: '#ECEFF1' },
  9:  { tier: 3, name: 'Foundation', color: '#546E7A', bgColor: '#ECEFF1' },
  10: { tier: 3, name: 'Foundation', color: '#546E7A', bgColor: '#ECEFF1' },
  11: { tier: 3, name: 'Foundation', color: '#546E7A', bgColor: '#ECEFF1' },
  12: { tier: 3, name: 'Foundation', color: '#546E7A', bgColor: '#ECEFF1' },
};

// Point values
const POINTS = {
  CURRENTLY_OFFER: 5,
  PLANNING: 3,
  ASSESSING: 2,
  NOT_ABLE: 0,
};

// ============================================
// SCORING FUNCTIONS
// ============================================

function statusToPoints(status: string | number): number | null {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return POINTS.CURRENTLY_OFFER;
      case 3: return POINTS.PLANNING;
      case 2: return POINTS.ASSESSING;
      case 1: return POINTS.NOT_ABLE;
      case 5: return null; // Unsure
      default: return null;
    }
  }
  
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return POINTS.NOT_ABLE;
    if (s === 'unsure' || s.includes('unsure')) return null;
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || 
        s.includes('use') || s.includes('track') || s.includes('measure')) {
      return POINTS.CURRENTLY_OFFER;
    }
    if (s.includes('planning') || s.includes('development')) return POINTS.PLANNING;
    if (s.includes('assessing') || s.includes('feasibility')) return POINTS.ASSESSING;
    if (s.length > 0) return POINTS.NOT_ABLE;
  }
  return null;
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
  dimensionNumber: number;
  rawScore: number;
  geoMultiplier: number;
  adjustedScore: number;
  answeredItems: number;
  currentlyOffer: number;
  planning: number;
  assessing: number;
  notAble: number;
  unsure: number;
  earnedPoints: number;
  maxPoints: number;
}

function calculateDimensionScore(dimNum: number, dimData: Record<string, any> | null): DimensionScore {
  const result: DimensionScore = {
    dimensionNumber: dimNum,
    rawScore: 0,
    geoMultiplier: 1.0,
    adjustedScore: 0,
    answeredItems: 0,
    currentlyOffer: 0,
    planning: 0,
    assessing: 0,
    notAble: 0,
    unsure: 0,
    earnedPoints: 0,
    maxPoints: 0,
  };
  
  if (!dimData) return result;
  
  const mainGrid = dimData[`d${dimNum}a`];
  if (!mainGrid || typeof mainGrid !== 'object') return result;
  
  let earnedPoints = 0;
  let answeredItems = 0;
  
  Object.values(mainGrid).forEach((status: any) => {
    const points = statusToPoints(status);
    
    if (points === null) {
      result.unsure++;
    } else {
      answeredItems++;
      earnedPoints += points;
      
      if (points === POINTS.CURRENTLY_OFFER) result.currentlyOffer++;
      else if (points === POINTS.PLANNING) result.planning++;
      else if (points === POINTS.ASSESSING) result.assessing++;
      else result.notAble++;
    }
  });
  
  result.answeredItems = answeredItems;
  result.earnedPoints = earnedPoints;
  result.maxPoints = answeredItems * POINTS.CURRENTLY_OFFER;
  
  if (result.maxPoints > 0) {
    result.rawScore = Math.round((earnedPoints / result.maxPoints) * 100);
  }
  
  const geoResponse = dimData[`d${dimNum}aa`] || dimData[`D${dimNum}aa`];
  result.geoMultiplier = getGeoMultiplier(geoResponse);
  result.adjustedScore = Math.round(result.rawScore * result.geoMultiplier);
  
  return result;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#2E7D32';
  if (score >= 60) return '#1565C0';
  if (score >= 40) return '#EF6C00';
  return '#C62828';
}

function getPerformanceTier(score: number): { name: string; color: string; bg: string } {
  if (score >= 90) return { name: 'Exemplary', color: '#1B5E20', bg: '#E8F5E9' };
  if (score >= 75) return { name: 'Leading', color: '#0D47A1', bg: '#E3F2FD' };
  if (score >= 60) return { name: 'Progressing', color: '#E65100', bg: '#FFF8E1' };
  if (score >= 40) return { name: 'Emerging', color: '#BF360C', bg: '#FFF3E0' };
  return { name: 'Beginning', color: '#37474F', bg: '#ECEFF1' };
}

// ============================================
// INTERACTIVE SCORING COMPONENT
// ============================================

interface InteractiveScoringProps {
  assessment: Record<string, any>;
}

export default function InteractiveScoring({ assessment }: InteractiveScoringProps) {
  const [weights, setWeights] = useState<Record<number, number>>({ ...DEFAULT_WEIGHTS });
  const [showConfig, setShowConfig] = useState(false);
  
  // Calculate dimension scores (memoized since these don't depend on weights)
  const dimensionScores = useMemo(() => {
    const scores: DimensionScore[] = [];
    for (let i = 1; i <= 13; i++) {
      const dimData = assessment[`dimension${i}_data`];
      scores.push(calculateDimensionScore(i, dimData));
    }
    return scores;
  }, [assessment]);
  
  // Calculate composite scores based on current weights
  const compositeScores = useMemo(() => {
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const normalizedWeights: Record<number, number> = {};
    Object.entries(weights).forEach(([dim, w]) => {
      normalizedWeights[parseInt(dim)] = totalWeight > 0 ? w / totalWeight : 0;
    });
    
    // Weighted score
    let weightedScore = 0;
    dimensionScores.forEach(ds => {
      const weight = normalizedWeights[ds.dimensionNumber] || 0;
      weightedScore += ds.adjustedScore * weight;
    });
    
    // Unweighted average
    const validScores = dimensionScores.filter(ds => ds.answeredItems > 0);
    const unweightedScore = validScores.length > 0
      ? validScores.reduce((sum, ds) => sum + ds.adjustedScore, 0) / validScores.length
      : 0;
    
    // Tier averages
    const tier1Dims = dimensionScores.filter(ds => TIER_INFO[ds.dimensionNumber]?.tier === 1 && ds.answeredItems > 0);
    const tier2Dims = dimensionScores.filter(ds => TIER_INFO[ds.dimensionNumber]?.tier === 2 && ds.answeredItems > 0);
    const tier3Dims = dimensionScores.filter(ds => TIER_INFO[ds.dimensionNumber]?.tier === 3 && ds.answeredItems > 0);
    
    const tier1Avg = tier1Dims.length > 0 ? tier1Dims.reduce((s, d) => s + d.adjustedScore, 0) / tier1Dims.length : 0;
    const tier2Avg = tier2Dims.length > 0 ? tier2Dims.reduce((s, d) => s + d.adjustedScore, 0) / tier2Dims.length : 0;
    const tier3Avg = tier3Dims.length > 0 ? tier3Dims.reduce((s, d) => s + d.adjustedScore, 0) / tier3Dims.length : 0;
    
    // Tier weighted totals
    const tier1Weight = [4, 8, 3, 2].reduce((sum, d) => sum + (weights[d] || 0), 0);
    const tier2Weight = [13, 6, 1].reduce((sum, d) => sum + (weights[d] || 0), 0);
    const tier3Weight = [5, 7, 9, 10, 11, 12].reduce((sum, d) => sum + (weights[d] || 0), 0);
    
    return {
      weighted: Math.round(weightedScore),
      unweighted: Math.round(unweightedScore),
      tier1Avg: Math.round(tier1Avg),
      tier2Avg: Math.round(tier2Avg),
      tier3Avg: Math.round(tier3Avg),
      tier1Weight,
      tier2Weight,
      tier3Weight,
      totalWeight,
    };
  }, [dimensionScores, weights]);
  
  const handleWeightChange = useCallback((dim: number, value: number) => {
    setWeights(prev => ({ ...prev, [dim]: value }));
  }, []);
  
  const resetToDefaults = useCallback(() => {
    setWeights({ ...DEFAULT_WEIGHTS });
  }, []);
  
  const performanceTier = getPerformanceTier(compositeScores.weighted);
  
  // Sort dimensions by tier then weight for display
  const sortedDimensions = useMemo(() => {
    return [...Array(13)].map((_, i) => i + 1).sort((a, b) => {
      const tierA = TIER_INFO[a]?.tier || 3;
      const tierB = TIER_INFO[b]?.tier || 3;
      if (tierA !== tierB) return tierA - tierB;
      return (weights[b] || 0) - (weights[a] || 0);
    });
  }, [weights]);
  
  return (
    <section className="mb-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📊 Assessment Scoring
              </h2>
              <p className="text-indigo-200 text-sm mt-1">Interactive weighted scoring with adjustable dimension weights</p>
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className={`w-4 h-4 transition-transform ${showConfig ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showConfig ? 'Hide Weights' : 'Adjust Weights'}
            </button>
          </div>
        </div>
        
        {/* Composite Score Cards */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Weighted Score */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-xl p-4 text-white text-center shadow-lg">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Weighted Composite</div>
              <div className="text-4xl font-black my-2">{compositeScores.weighted}</div>
              <div className="text-xs opacity-80">of 100 possible</div>
            </div>
            
            {/* Unweighted Score */}
            <div className="bg-white rounded-xl p-4 text-center border-2 border-gray-200">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Unweighted Avg</div>
              <div className="text-4xl font-black my-2" style={{ color: getScoreColor(compositeScores.unweighted) }}>
                {compositeScores.unweighted}
              </div>
              <div className="text-xs text-gray-500">simple avg of 13 dims</div>
            </div>
            
            {/* Performance Tier */}
            <div className="rounded-xl p-4 text-center border-2" style={{ backgroundColor: performanceTier.bg, borderColor: performanceTier.color }}>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: performanceTier.color }}>Performance Tier</div>
              <div className="text-2xl font-black my-2" style={{ color: performanceTier.color }}>
                {performanceTier.name}
              </div>
              <div className="text-xs" style={{ color: performanceTier.color, opacity: 0.8 }}>
                {compositeScores.weighted >= 90 ? '90-100' : compositeScores.weighted >= 75 ? '75-89' : compositeScores.weighted >= 60 ? '60-74' : compositeScores.weighted >= 40 ? '40-59' : '0-39'} pts
              </div>
            </div>
            
            {/* Tier Breakdown */}
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Tier Averages</div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#1A237E' }}>T1 ({compositeScores.tier1Weight}%)</span>
                  <span className="font-bold" style={{ color: getScoreColor(compositeScores.tier1Avg) }}>{compositeScores.tier1Avg}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#0D47A1' }}>T2 ({compositeScores.tier2Weight}%)</span>
                  <span className="font-bold" style={{ color: getScoreColor(compositeScores.tier2Avg) }}>{compositeScores.tier2Avg}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#546E7A' }}>T3 ({compositeScores.tier3Weight}%)</span>
                  <span className="font-bold" style={{ color: getScoreColor(compositeScores.tier3Avg) }}>{compositeScores.tier3Avg}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Weight Configuration Panel (Collapsible) */}
        {showConfig && (
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Dimension Weights</h3>
                <p className="text-sm text-gray-500">
                  Total: <span className={compositeScores.totalWeight === 100 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {compositeScores.totalWeight}%
                  </span>
                  {compositeScores.totalWeight !== 100 && ' (will be normalized)'}
                </p>
              </div>
              <button
                onClick={resetToDefaults}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
            
            {/* Weight Sliders by Tier */}
            <div className="space-y-6">
              {/* Tier 1 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#1A237E' }}></span>
                  <span className="text-sm font-bold" style={{ color: '#1A237E' }}>Tier 1: Highest Impact</span>
                  <span className="text-xs text-gray-500 ml-auto">({compositeScores.tier1Weight}%)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[4, 8, 3, 2].map(dim => {
                    const score = dimensionScores.find(d => d.dimensionNumber === dim);
                    return (
                      <div key={dim} className="bg-indigo-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">D{dim}: {DIMENSION_SHORT_NAMES[dim]}</span>
                          <span className="text-xs font-bold text-indigo-700">{weights[dim]}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="25"
                          value={weights[dim]}
                          onChange={(e) => handleWeightChange(dim, parseInt(e.target.value))}
                          className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Score: <span className="font-bold" style={{ color: getScoreColor(score?.adjustedScore || 0) }}>
                            {score?.answeredItems ? score.adjustedScore : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Tier 2 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#0D47A1' }}></span>
                  <span className="text-sm font-bold" style={{ color: '#0D47A1' }}>Tier 2: Critical Enablers</span>
                  <span className="text-xs text-gray-500 ml-auto">({compositeScores.tier2Weight}%)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[13, 6, 1].map(dim => {
                    const score = dimensionScores.find(d => d.dimensionNumber === dim);
                    return (
                      <div key={dim} className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">D{dim}: {DIMENSION_SHORT_NAMES[dim]}</span>
                          <span className="text-xs font-bold text-blue-700">{weights[dim]}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={weights[dim]}
                          onChange={(e) => handleWeightChange(dim, parseInt(e.target.value))}
                          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Score: <span className="font-bold" style={{ color: getScoreColor(score?.adjustedScore || 0) }}>
                            {score?.answeredItems ? score.adjustedScore : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Tier 3 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: '#546E7A' }}></span>
                  <span className="text-sm font-bold" style={{ color: '#546E7A' }}>Tier 3: Foundation & Support</span>
                  <span className="text-xs text-gray-500 ml-auto">({compositeScores.tier3Weight}%)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[5, 7, 9, 10, 11, 12].map(dim => {
                    const score = dimensionScores.find(d => d.dimensionNumber === dim);
                    return (
                      <div key={dim} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">D{dim}</span>
                          <span className="text-xs font-bold text-gray-600">{weights[dim]}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="15"
                          value={weights[dim]}
                          onChange={(e) => handleWeightChange(dim, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-500"
                        />
                        <div className="text-xs text-gray-500 mt-1 truncate" title={DIMENSION_SHORT_NAMES[dim]}>
                          {DIMENSION_SHORT_NAMES[dim]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Dimension Scores Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-4 py-3 text-left font-semibold">Dimension</th>
                <th className="px-3 py-3 text-center font-semibold w-16">Tier</th>
                <th className="px-3 py-3 text-center font-semibold w-16">Weight</th>
                <th className="px-3 py-3 text-center font-semibold w-16">Raw</th>
                <th className="px-3 py-3 text-center font-semibold w-14">Geo</th>
                <th className="px-3 py-3 text-center font-semibold w-20">Adjusted</th>
                <th className="px-3 py-3 text-center font-semibold w-20">Weighted</th>
                <th className="px-4 py-3 text-center font-semibold">Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {sortedDimensions.map((dimNum, idx) => {
                const ds = dimensionScores.find(d => d.dimensionNumber === dimNum)!;
                const tierInfo = TIER_INFO[dimNum];
                const weight = weights[dimNum] || 0;
                const normalizedWeight = compositeScores.totalWeight > 0 ? weight / compositeScores.totalWeight : 0;
                const weightedContribution = ds.answeredItems > 0 ? (ds.adjustedScore * normalizedWeight).toFixed(1) : '—';
                
                return (
                  <tr key={dimNum} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">D{dimNum}: {DIMENSION_NAMES[dimNum]}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span 
                        className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                        style={{ backgroundColor: tierInfo.bgColor, color: tierInfo.color }}
                      >
                        T{tierInfo.tier}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-600">
                      {weight}%
                    </td>
                    <td className="px-3 py-3 text-center text-gray-500">
                      {ds.answeredItems > 0 ? ds.rawScore : '—'}
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-500">
                      {ds.geoMultiplier < 1 ? `×${ds.geoMultiplier.toFixed(2)}` : '1.0'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-bold text-lg" style={{ color: ds.answeredItems > 0 ? getScoreColor(ds.adjustedScore) : '#BDBDBD' }}>
                        {ds.answeredItems > 0 ? ds.adjustedScore : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold" style={{ color: '#1A237E' }}>
                      {weightedContribution}
                    </td>
                    <td className="px-4 py-3">
                      {ds.answeredItems > 0 ? (
                        <div className="flex gap-2 justify-center text-xs">
                          <span className="text-green-600" title="Currently Offer">✓{ds.currentlyOffer}</span>
                          <span className="text-blue-600" title="Planning">◐{ds.planning}</span>
                          <span className="text-orange-500" title="Assessing">○{ds.assessing}</span>
                          <span className="text-gray-400" title="Not Able">✗{ds.notAble}</span>
                          {ds.unsure > 0 && <span className="text-gray-300" title="Unsure">?{ds.unsure}</span>}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No data</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-indigo-100 font-semibold">
                <td colSpan={5} className="px-4 py-3 text-right text-gray-700">Totals:</td>
                <td className="px-3 py-3 text-center text-lg" style={{ color: getScoreColor(compositeScores.unweighted) }}>
                  {compositeScores.unweighted}
                </td>
                <td className="px-3 py-3 text-center text-lg" style={{ color: '#1A237E' }}>
                  {compositeScores.weighted}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Legend */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div><strong>Points:</strong> Currently Offer=5, Planning=3, Assessing=2, Not Able=0</div>
            <div><strong>Raw:</strong> (Earned / Max) × 100</div>
            <div><strong>Geo:</strong> Consistent=1.0, Varies=0.90, Select=0.75</div>
            <div><strong>Weighted:</strong> Adjusted × Weight%</div>
          </div>
        </div>
      </div>
    </section>
  );
}

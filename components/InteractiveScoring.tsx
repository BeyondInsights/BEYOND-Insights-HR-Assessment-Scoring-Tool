/**
 * SCORING SECTION - Individual Company Page
 * 
 * UPDATED:
 * - Removed "Adjust Weights" feature (moved to aggregate page only)
 * - Added Index to totals row
 * - Clarified breakdown with labels and tooltips
 * - 0s (Not Able) ARE included in denominator
 * - Only "Unsure" is excluded from denominator
 * 
 * Add to: app/admin/profile/[surveyId]/page.tsx
 * Location: After the "Executive Summary" section
 */

'use client';

import React, { useMemo } from 'react';

// ============================================
// SCORING CONSTANTS
// ============================================
const POINTS = {
  CURRENTLY_OFFER: 5,
  PLANNING: 3,
  ASSESSING: 2,
  NOT_ABLE: 0,  // Included in denominator!
  UNSURE: null, // Excluded from denominator
};

// Dimension weights (Total = 100%)
const DIMENSION_WEIGHTS: Record<number, number> = {
  // Tier 1: Highest Impact (50%)
  4: 14,   // D4: Cancer Support Resources
  8: 13,   // D8: Work Continuation & Resumption
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
  4: 'Cancer Support Resources',
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

const TIER_INFO: Record<number, { tier: number; name: string; color: string }> = {
  4: { tier: 1, name: 'Highest Impact', color: '#F97316' },
  8: { tier: 1, name: 'Highest Impact', color: '#F97316' },
  3: { tier: 1, name: 'Highest Impact', color: '#F97316' },
  2: { tier: 1, name: 'Highest Impact', color: '#F97316' },
  13: { tier: 2, name: 'Critical Enablers', color: '#0D47A1' },
  6: { tier: 2, name: 'Critical Enablers', color: '#0D47A1' },
  1: { tier: 2, name: 'Critical Enablers', color: '#0D47A1' },
  5: { tier: 3, name: 'Foundation', color: '#546E7A' },
  7: { tier: 3, name: 'Foundation', color: '#546E7A' },
  9: { tier: 3, name: 'Foundation', color: '#546E7A' },
  10: { tier: 3, name: 'Foundation', color: '#546E7A' },
  11: { tier: 3, name: 'Foundation', color: '#546E7A' },
  12: { tier: 3, name: 'Foundation', color: '#546E7A' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function statusToPoints(status: string | undefined | null): number | null {
  if (!status) return null;
  const s = String(status).toLowerCase().trim();
  
  if (s.includes('currently') || s.includes('offer') || s === 'yes' || s === 'true') {
    return POINTS.CURRENTLY_OFFER;
  }
  if (s.includes('planning') || s.includes('development') || s.includes('active')) {
    return POINTS.PLANNING;
  }
  if (s.includes('assessing') || s.includes('feasibility') || s.includes('exploring')) {
    return POINTS.ASSESSING;
  }
  if (s.includes('not able') || s.includes('unable') || s.includes('no plan') || s === 'no' || s === 'false') {
    return POINTS.NOT_ABLE;
  }
  if (s.includes('unsure') || s.includes('unknown') || s.includes('don\'t know')) {
    return POINTS.UNSURE;
  }
  
  return null; // Unknown status - exclude
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#059669'; // Exemplary - green
  if (score >= 75) return '#2563EB'; // Leading - blue
  if (score >= 60) return '#7C3AED'; // Progressing - purple
  if (score >= 40) return '#F59E0B'; // Emerging - amber
  return '#DC2626'; // Beginning - red
}

function getPerformanceTier(score: number): { name: string; color: string; bgColor: string; range: string } {
  if (score >= 90) return { name: 'Exemplary', color: '#059669', bgColor: '#D1FAE5', range: '90-100 pts' };
  if (score >= 75) return { name: 'Leading', color: '#2563EB', bgColor: '#DBEAFE', range: '75-89 pts' };
  if (score >= 60) return { name: 'Progressing', color: '#7C3AED', bgColor: '#EDE9FE', range: '60-74 pts' };
  if (score >= 40) return { name: 'Emerging', color: '#F59E0B', bgColor: '#FEF3C7', range: '40-59 pts' };
  return { name: 'Beginning', color: '#DC2626', bgColor: '#FEE2E2', range: '0-39 pts' };
}

// ============================================
// TYPES
// ============================================
interface DimensionScore {
  dimensionNumber: number;
  dimensionName: string;
  rawScore: number;
  geoMultiplier: number;
  adjustedScore: number;
  weight: number;
  weightedScore: number;
  tier: number;
  tierColor: string;
  currentlyOffer: number;
  planning: number;
  assessing: number;
  notAble: number;
  unsure: number;
  answeredItems: number;
  totalItems: number;
}

interface ScoringProps {
  assessment: any;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ScoringSection({ assessment }: ScoringProps) {
  
  // Calculate all dimension scores
  const dimensionScores = useMemo(() => {
    const scores: DimensionScore[] = [];
    
    for (let dim = 1; dim <= 13; dim++) {
      const dataKey = `dimension${dim}_data`;
      const dimData = assessment?.[dataKey];
      const tierInfo = TIER_INFO[dim] || { tier: 3, name: 'Foundation', color: '#546E7A' };
      
      const score: DimensionScore = {
        dimensionNumber: dim,
        dimensionName: DIMENSION_NAMES[dim],
        rawScore: 0,
        geoMultiplier: 1.0,
        adjustedScore: 0,
        weight: DIMENSION_WEIGHTS[dim] || 0,
        weightedScore: 0,
        tier: tierInfo.tier,
        tierColor: tierInfo.color,
        currentlyOffer: 0,
        planning: 0,
        assessing: 0,
        notAble: 0,
        unsure: 0,
        answeredItems: 0,
        totalItems: 0,
      };
      
      if (dimData) {
        // Get the main grid (d#a contains the program statuses)
        const mainGrid = dimData[`d${dim}a`];
        
        if (mainGrid && typeof mainGrid === 'object') {
          let earnedPoints = 0;
          let answeredItems = 0;
          
          Object.values(mainGrid).forEach((status: any) => {
            const points = statusToPoints(status);
            score.totalItems++;
            
            if (points === null) {
              // Unsure - count but exclude from denominator
              score.unsure++;
            } else {
              // Include in calculation (including 0-point items)
              answeredItems++;
              earnedPoints += points;
              
              if (points === POINTS.CURRENTLY_OFFER) score.currentlyOffer++;
              else if (points === POINTS.PLANNING) score.planning++;
              else if (points === POINTS.ASSESSING) score.assessing++;
              else if (points === POINTS.NOT_ABLE) score.notAble++;
            }
          });
          
          score.answeredItems = answeredItems;
          
          // Calculate raw score (0-100)
          // Formula: (earnedPoints / maxPossiblePoints) × 100
          // maxPossiblePoints = answeredItems × 5 (max points per item)
          if (answeredItems > 0) {
            const maxPoints = answeredItems * POINTS.CURRENTLY_OFFER;
            score.rawScore = Math.round((earnedPoints / maxPoints) * 100);
          }
          
          // Get geographic multiplier from d#aa
          const geoResponse = dimData[`d${dim}aa`];
          if (geoResponse) {
            const geoStr = String(geoResponse).toLowerCase();
            if (geoStr.includes('consistent') || geoStr.includes('all location')) {
              score.geoMultiplier = 1.0;
            } else if (geoStr.includes('varies') || geoStr.includes('vary')) {
              score.geoMultiplier = 0.90;
            } else if (geoStr.includes('select') || geoStr.includes('only')) {
              score.geoMultiplier = 0.75;
            }
          }
          
          // Calculate adjusted score
          score.adjustedScore = Math.round(score.rawScore * score.geoMultiplier);
          
          // Calculate weighted score
          score.weightedScore = Math.round((score.adjustedScore * score.weight) / 100 * 10) / 10;
        }
      }
      
      scores.push(score);
    }
    
    return scores;
  }, [assessment]);
  
  // Calculate composite scores
  const compositeScores = useMemo(() => {
    // Only include dimensions that have data
    const scoredDimensions = dimensionScores.filter(d => d.answeredItems > 0);
    
    if (scoredDimensions.length === 0) {
      return { weighted: 0, unweighted: 0, tier1Avg: 0, tier2Avg: 0, tier3Avg: 0, index: 0 };
    }
    
    // Weighted composite score
    let weightedScore = 0;
    scoredDimensions.forEach(d => {
      weightedScore += (d.adjustedScore * d.weight) / 100;
    });
    
    // Unweighted average
    const unweightedScore = scoredDimensions.reduce((sum, d) => sum + d.adjustedScore, 0) / scoredDimensions.length;
    
    // Tier averages
    const tier1Dims = scoredDimensions.filter(d => d.tier === 1);
    const tier2Dims = scoredDimensions.filter(d => d.tier === 2);
    const tier3Dims = scoredDimensions.filter(d => d.tier === 3);
    
    const tier1Avg = tier1Dims.length > 0 ? tier1Dims.reduce((s, d) => s + d.adjustedScore, 0) / tier1Dims.length : 0;
    const tier2Avg = tier2Dims.length > 0 ? tier2Dims.reduce((s, d) => s + d.adjustedScore, 0) / tier2Dims.length : 0;
    const tier3Avg = tier3Dims.length > 0 ? tier3Dims.reduce((s, d) => s + d.adjustedScore, 0) / tier3Dims.length : 0;
    
    // Index (relative to benchmark - assuming 74 is benchmark based on screenshot)
    // Index = (Score / Benchmark) × 100
    const BENCHMARK = 74;
    const index = Math.round((weightedScore / BENCHMARK) * 100);
    
    return {
      weighted: Math.round(weightedScore),
      unweighted: Math.round(unweightedScore),
      tier1Avg: Math.round(tier1Avg),
      tier2Avg: Math.round(tier2Avg),
      tier3Avg: Math.round(tier3Avg),
      index,
    };
  }, [dimensionScores]);
  
  const performanceTier = getPerformanceTier(compositeScores.weighted);
  
  // Sort dimensions by tier then weight for display
  const sortedDimensions = useMemo(() => {
    return [...dimensionScores].sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return b.weight - a.weight;
    });
  }, [dimensionScores]);
  
  // Check if we have any data
  const hasData = dimensionScores.some(d => d.answeredItems > 0);
  
  if (!hasData) {
    return (
      <section className="mb-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📊 Assessment Scoring
            </h2>
            <p className="text-indigo-200 text-sm mt-1">Weighted scoring with adjustable dimension weights</p>
          </div>
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No dimension data available for scoring</p>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="mb-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📊 Assessment Scoring
          </h2>
          <p className="text-indigo-200 text-sm mt-1">Weighted scoring across 13 dimensions</p>
        </div>
        
        {/* Score Cards */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Weighted Composite */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 text-white shadow-lg">
              <div className="text-sm font-medium text-indigo-200 uppercase tracking-wide">Weighted Composite</div>
              <div className="text-4xl font-bold mt-1">{compositeScores.weighted}</div>
              <div className="text-sm text-indigo-200 mt-1">of 100 possible</div>
            </div>
            
            {/* Unweighted Average */}
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Unweighted Avg</div>
              <div className="text-4xl font-bold mt-1 text-gray-800">{compositeScores.unweighted}</div>
              <div className="text-sm text-gray-500 mt-1">simple avg of 13 dims</div>
            </div>
            
            {/* Performance Tier */}
            <div className="rounded-xl p-4 border-2 shadow" style={{ backgroundColor: performanceTier.bgColor, borderColor: performanceTier.color }}>
              <div className="text-sm font-medium uppercase tracking-wide" style={{ color: performanceTier.color }}>Performance Tier</div>
              <div className="text-3xl font-bold mt-1" style={{ color: performanceTier.color }}>{performanceTier.name}</div>
              <div className="text-sm mt-1" style={{ color: performanceTier.color }}>{performanceTier.range}</div>
            </div>
            
            {/* Tier Averages */}
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Tier Averages</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600 font-medium">T1 (50%)</span>
                  <span className="font-bold text-orange-700">{compositeScores.tier1Avg}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600 font-medium">T2 (25%)</span>
                  <span className="font-bold text-blue-700">{compositeScores.tier2Avg}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">T3 (25%)</span>
                  <span className="font-bold text-gray-700">{compositeScores.tier3Avg}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dimension Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Dimension</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide w-16">Tier</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide w-16">Weight</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide w-16">Raw</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide w-16">Geo</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide w-20">Adjusted</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide w-20">Weighted</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Breakdown
                  <span className="ml-2 text-gray-400 font-normal normal-case" title="✓=Currently Offer, ●=Planning, ○=Assessing, ✗=Not Able, ?=Unsure">
                    (hover for legend)
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDimensions.map((score, idx) => (
                <tr 
                  key={score.dimensionNumber} 
                  className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                >
                  {/* Dimension Name */}
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      D{score.dimensionNumber}: {score.dimensionName}
                    </span>
                  </td>
                  
                  {/* Tier Badge */}
                  <td className="px-3 py-3 text-center">
                    <span 
                      className="inline-flex items-center justify-center w-8 h-6 text-xs font-bold text-white rounded"
                      style={{ backgroundColor: score.tierColor }}
                    >
                      T{score.tier}
                    </span>
                  </td>
                  
                  {/* Weight */}
                  <td className="px-3 py-3 text-center">
                    <span className="font-semibold text-gray-700">{score.weight}%</span>
                  </td>
                  
                  {/* Raw Score */}
                  <td className="px-3 py-3 text-center">
                    <span className="text-gray-600">{score.answeredItems > 0 ? score.rawScore : '—'}</span>
                  </td>
                  
                  {/* Geo Multiplier */}
                  <td className="px-3 py-3 text-center">
                    <span className={`text-sm ${score.geoMultiplier < 1 ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                      {score.answeredItems > 0 ? score.geoMultiplier.toFixed(1) : '—'}
                    </span>
                  </td>
                  
                  {/* Adjusted Score */}
                  <td className="px-3 py-3 text-center">
                    <span 
                      className="text-lg font-bold"
                      style={{ color: score.answeredItems > 0 ? getScoreColor(score.adjustedScore) : '#9CA3AF' }}
                    >
                      {score.answeredItems > 0 ? score.adjustedScore : '—'}
                    </span>
                  </td>
                  
                  {/* Weighted Score */}
                  <td className="px-3 py-3 text-center">
                    <span className="font-semibold text-indigo-700">
                      {score.answeredItems > 0 ? score.weightedScore.toFixed(1) : '—'}
                    </span>
                  </td>
                  
                  {/* Breakdown with clear labels */}
                  <td className="px-4 py-3">
                    {score.answeredItems > 0 ? (
                      <div className="flex items-center gap-3 text-sm">
                        {/* Currently Offer */}
                        <span className="inline-flex items-center gap-1" title="Currently Offer (5 pts)">
                          <span className="text-green-600 font-bold">✓</span>
                          <span className="font-semibold text-green-700">{score.currentlyOffer}</span>
                        </span>
                        
                        {/* Planning */}
                        <span className="inline-flex items-center gap-1" title="Planning (3 pts)">
                          <span className="text-blue-600 font-bold">●</span>
                          <span className="font-semibold text-blue-700">{score.planning}</span>
                        </span>
                        
                        {/* Assessing */}
                        <span className="inline-flex items-center gap-1" title="Assessing (2 pts)">
                          <span className="text-orange-500 font-bold">○</span>
                          <span className="font-semibold text-orange-600">{score.assessing}</span>
                        </span>
                        
                        {/* Not Able */}
                        <span className="inline-flex items-center gap-1" title="Not Able (0 pts)">
                          <span className="text-red-500 font-bold">✗</span>
                          <span className="font-semibold text-red-600">{score.notAble}</span>
                        </span>
                        
                        {/* Unsure (if any) */}
                        {score.unsure > 0 && (
                          <span className="inline-flex items-center gap-1" title="Unsure (excluded from calculation)">
                            <span className="text-gray-400 font-bold">?</span>
                            <span className="font-semibold text-gray-500">{score.unsure}</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No data</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr className="bg-indigo-50 border-t-2 border-indigo-200 font-bold">
                <td className="px-4 py-4 text-indigo-900">Totals</td>
                <td className="px-3 py-4 text-center">—</td>
                <td className="px-3 py-4 text-center text-indigo-700">100%</td>
                <td className="px-3 py-4 text-center">—</td>
                <td className="px-3 py-4 text-center">—</td>
                <td className="px-3 py-4 text-center">
                  <span className="text-lg" style={{ color: getScoreColor(compositeScores.unweighted) }}>
                    {compositeScores.unweighted}
                  </span>
                </td>
                <td className="px-3 py-4 text-center">
                  <span className="text-lg text-indigo-800">{compositeScores.weighted}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-indigo-700">Index:</span>
                    <span 
                      className={`px-2 py-1 rounded font-bold ${
                        compositeScores.index >= 100 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {compositeScores.index}
                    </span>
                    <span className="text-xs text-gray-500">(100 = benchmark)</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Legend Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t text-sm">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-gray-600 font-medium">Breakdown Legend:</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-green-600 font-bold">✓</span> Currently Offer (5 pts)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="text-blue-600 font-bold">●</span> Planning (3 pts)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="text-orange-500 font-bold">○</span> Assessing (2 pts)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="text-red-500 font-bold">✗</span> Not Able (0 pts)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="text-gray-400 font-bold">?</span> Unsure (excluded)
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <strong>Note:</strong> "Not Able" items (0 points) ARE included in the denominator. Only "Unsure" responses are excluded from scoring calculations.
          </div>
        </div>
      </div>
    </section>
  );
}

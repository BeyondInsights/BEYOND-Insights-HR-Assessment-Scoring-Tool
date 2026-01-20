/**
 * ENHANCED SCORING COMPONENT - FINAL VERSION (Jan 2026)
 * 
 * SCORING MODEL (90/5/5):
 * - WEIGHTED DIMENSION SCORE (95%): Grid responses with depth blended into applicable dimensions
 *   - For D1, D3, D12, D13: Uses 85% grid + 15% depth blend
 *   - For other dimensions: Uses 100% grid score
 * - MATURITY (5%): Current support approach maturity
 * - BREADTH (5%): Coverage scope and conditions
 * 
 * TIER THRESHOLDS:
 * - Exemplary: 90+
 * - Leading: 75-89
 * - Progressing: 60-74
 * - Emerging: 40-59
 * - Developing: <40
 * 
 * Scoring Version: v1.0 (Year 1)
 */

'use client';

import React, { useMemo, useState } from 'react';
import {
  calculateEnhancedScore,
  getScoreColor,
  DIMENSION_NAMES,
  DIMENSION_WEIGHTS,
} from '@/lib/enhanced-scoring';

// ============================================
// CANONICAL WEIGHTS - 95/3/2 MODEL (matches scoring page)
// ============================================
const COMPOSITE_WEIGHTS = {
  weightedDim: 0.95,  // 95% weighted dimension score
  maturity: 0.03,     // 3% maturity
  breadth: 0.02,      // 2% breadth
};

// ============================================
// CANONICAL TIER DEFINITIONS
// ============================================
function getPerformanceTier(score: number, isProvisional: boolean): { name: string; color: string; bg: string; isProvisional: boolean } {
  let tier: { name: string; color: string; bg: string };
  if (score >= 90) tier = { name: 'Exemplary', color: '#065F46', bg: '#D1FAE5' };
  else if (score >= 75) tier = { name: 'Leading', color: '#1E40AF', bg: '#DBEAFE' };
  else if (score >= 60) tier = { name: 'Progressing', color: '#92400E', bg: '#FEF3C7' };
  else if (score >= 40) tier = { name: 'Emerging', color: '#9A3412', bg: '#FFEDD5' };
  else tier = { name: 'Developing', color: '#374151', bg: '#F3F4F6' };
  return { ...tier, isProvisional };
}

interface EnhancedScoringProps {
  assessment: any;
  showDetails?: boolean;
}

// ============================================
// SAFE NUMBER HELPER - PREVENTS NaN DISPLAY
// ============================================
function safeNumber(value: any, fallback: number = 0): number {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  return Number(value);
}

// ============================================
// SCORE CIRCLE COMPONENT
// ============================================

function ScoreCircle({ 
  score, 
  size = 'large',
}: { 
  score: number; 
  size?: 'large' | 'medium' | 'small';
}) {
  const safeScore = safeNumber(score, 0);
  const color = getScoreColor(safeScore);
  
  const dimensions = {
    large: { width: 140, strokeWidth: 10, radius: 58, fontSize: 'text-4xl' },
    medium: { width: 90, strokeWidth: 7, radius: 36, fontSize: 'text-2xl' },
    small: { width: 70, strokeWidth: 6, radius: 27, fontSize: 'text-xl' },
  };
  
  const d = dimensions[size];
  const circumference = 2 * Math.PI * d.radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: d.width, height: d.width }}>
      <svg width={d.width} height={d.width} className="transform -rotate-90">
        <circle
          cx={d.width / 2}
          cy={d.width / 2}
          r={d.radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={d.strokeWidth}
        />
        <circle
          cx={d.width / 2}
          cy={d.width / 2}
          r={d.radius}
          fill="none"
          stroke={color}
          strokeWidth={d.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${d.fontSize} font-bold`} style={{ color }}>{safeScore}</span>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT BAR WITH EXPANDABLE DETAILS
// ============================================

function ComponentBar({ 
  label, 
  score, 
  weight, 
  contribution,
  details,
  isMain = false
}: { 
  label: string; 
  score: number; 
  weight: number;
  contribution: number;
  details?: Record<string, { value: number; maxValue: number; source: string }>;
  isMain?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const safeScore = safeNumber(score, 0);
  const safeContribution = safeNumber(contribution, 0);
  const color = getScoreColor(safeScore);
  const hasDetails = details && Object.keys(details).length > 0;
  
  return (
    <div className={`${isMain ? 'bg-blue-50 rounded-lg p-3 mb-3' : 'py-2'}`}>
      <div 
        className={`flex items-center justify-between ${hasDetails ? 'cursor-pointer hover:bg-gray-50 rounded p-1 -m-1' : ''}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasDetails ? (
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}
          <span className={`font-medium truncate ${isMain ? 'text-blue-900' : 'text-gray-700'}`}>{label}</span>
          <span className="text-xs text-gray-500 flex-shrink-0">({weight}% weight)</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-32 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${safeScore}%`, backgroundColor: color }}
            />
          </div>
          <span className="font-bold text-lg w-10 text-right" style={{ color }}>{safeScore}</span>
          <span className="text-xs text-gray-500 w-16 text-right">+{safeContribution.toFixed(1)} pts</span>
        </div>
      </div>
      
      {expanded && hasDetails && (
        <div className="ml-6 mt-2 space-y-1.5 bg-gray-50 rounded-lg p-3 border border-gray-200">
          {Object.entries(details).map(([key, detail]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 truncate max-w-xs">{detail.source}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${(detail.value / detail.maxValue) * 100}%`, 
                      backgroundColor: getScoreColor((detail.value / detail.maxValue) * 100) 
                    }}
                  />
                </div>
                <span className="text-gray-700 font-medium text-xs w-12 text-right">
                  {Number(detail.value.toFixed(1))}/{detail.maxValue}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN ENHANCED SCORING COMPONENT
// ============================================

export default function EnhancedScoringSection({ assessment, showDetails = true }: EnhancedScoringProps) {
  const [showDimensionDetails, setShowDimensionDetails] = useState(false);
  
  const enhancedScore = useMemo(() => {
    return calculateEnhancedScore(assessment);
  }, [assessment]);
  
  if (enhancedScore.completedDimensions === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-gray-500">No dimension data available for scoring</p>
      </div>
    );
  }
  
  const { 
    baseScore, maturityScore, breadthScore,
    maturityDetails, breadthDetails,
    dimensionScores, completedDimensions, insufficientDataCount, isProvisional
  } = enhancedScore;
  
  // Safe score values
  const safeBaseScore = safeNumber(baseScore, 0);
  const safeMaturityScore = safeNumber(maturityScore, 0);
  const safeBreadthScore = safeNumber(breadthScore, 0);
  
  // Calculate contributions using 90/5/5 weights
  const dimContribution = safeBaseScore * COMPOSITE_WEIGHTS.weightedDim;
  const maturityContribution = safeMaturityScore * COMPOSITE_WEIGHTS.maturity;
  const breadthContribution = safeBreadthScore * COMPOSITE_WEIGHTS.breadth;
  
  // Calculate composite with 90/5/5
  const compositeScore = Math.round(dimContribution + maturityContribution + breadthContribution);
  
  // Get tier using canonical function
  const tier = getPerformanceTier(compositeScore, isProvisional);
  
  return (
    <section className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Assessment Scoring</h2>
          <p className="text-sm text-gray-600">Composite: 95% dimension + 3% maturity + 2% breadth</p>
        </div>
        {tier && (
          <div className="text-right">
            <span 
              className="px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
              style={{ backgroundColor: tier.bg, color: tier.color }}
            >
              {tier.name}{tier.isProvisional && ' *'}
            </span>
            {tier.isProvisional && (
              <p className="text-xs text-amber-600 mt-1">* Provisional</p>
            )}
          </div>
        )}
      </div>
      
      {/* Main Scores Display - Two Columns */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Weighted Dimension Score */}
          <div className="flex flex-col items-center p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
            <p className="text-sm font-bold text-blue-800 mb-1">WEIGHTED DIMENSION SCORE</p>
            <p className="text-xs text-blue-600 mb-4">(Grid + Depth Blend for D1,D3,D12,D13)</p>
            <ScoreCircle score={safeBaseScore} size="large" />
            <p className="text-xs text-gray-500 mt-4">{completedDimensions}/13 dimensions completed</p>
            <p className="text-xs text-blue-600 mt-1 font-medium">95% of Composite</p>
          </div>
          
          {/* Right: Composite Score */}
          <div className="flex flex-col items-center p-5 bg-purple-50 rounded-xl border-2 border-purple-200">
            <p className="text-sm font-bold text-purple-800 mb-1">COMPOSITE SCORE</p>
            <p className="text-xs text-purple-600 mb-4">(Dimension 95% + Maturity 3% + Breadth 2%)</p>
            <ScoreCircle score={compositeScore} size="large" />
            <p className="text-xs text-gray-500 mt-4">Final weighted score</p>
            <p className="text-xs text-purple-600 mt-1 font-medium">Index Ranking Score</p>
          </div>
        </div>
        
        {/* Maturity & Breadth Row */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-4 text-center">Additional Components</p>
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <ScoreCircle score={safeMaturityScore} size="small" />
              <p className="text-sm font-semibold text-gray-700 mt-3">Maturity</p>
              <p className="text-xs text-gray-500 text-center">Support Approach</p>
              <p className="text-xs text-indigo-600 font-medium mt-1">5% weight</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <ScoreCircle score={safeBreadthScore} size="small" />
              <p className="text-sm font-semibold text-gray-700 mt-3">Breadth</p>
              <p className="text-xs text-gray-500 text-center">Coverage Scope</p>
              <p className="text-xs text-indigo-600 font-medium mt-1">5% weight</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Warnings */}
      {isProvisional && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-yellow-800 text-sm font-medium">
            Provisional Classification: {insufficientDataCount} dimensions have &gt;40% "Unsure" responses
          </span>
        </div>
      )}
      
      {/* Score Composition Details */}
      {showDetails && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Score Composition Breakdown</h3>
          
          <ComponentBar 
            label="Weighted Dimension Score" 
            score={safeBaseScore} 
            weight={90}
            contribution={dimContribution}
            isMain={true}
          />
          
          <div className="ml-4 border-l-2 border-gray-200 pl-4">
            <ComponentBar 
              label="Maturity Score" 
              score={safeMaturityScore} 
              weight={3}
              contribution={maturityContribution}
              details={maturityDetails?.details}
            />
            
            <ComponentBar 
              label="Breadth Score" 
              score={safeBreadthScore} 
              weight={2}
              contribution={breadthContribution}
              details={breadthDetails?.details}
            />
          </div>
          
          {/* Total */}
          <div className="mt-4 pt-4 border-t-2 border-purple-200 flex items-center justify-between bg-purple-50 rounded-lg p-4">
            <span className="font-bold text-purple-900 text-lg">Composite Total</span>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold" style={{ color: getScoreColor(compositeScore) }}>
                {compositeScore}
              </span>
              <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded border">
                = {dimContribution.toFixed(1)} + {maturityContribution.toFixed(1)} + {breadthContribution.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Dimension Details Toggle */}
      <div className="mt-4">
        <button
          onClick={() => setShowDimensionDetails(!showDimensionDetails)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${showDimensionDetails ? 'rotate-90' : ''}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showDimensionDetails ? 'Hide' : 'Show'} Dimension Details
        </button>
        
        {showDimensionDetails && (
          <div className="mt-4 bg-white rounded-xl overflow-hidden border border-indigo-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-800 text-white">
                  <th className="px-3 py-2 text-left font-semibold">Dimension</th>
                  <th className="px-2 py-2 text-center font-semibold w-12">Wt%</th>
                  <th className="px-2 py-2 text-center font-semibold w-14">Grid</th>
                  <th className="px-2 py-2 text-center font-semibold w-12">Geo</th>
                  <th className="px-2 py-2 text-center font-semibold w-14">Final</th>
                  <th className="px-3 py-2 text-left font-semibold">Response Breakdown</th>
                  <th className="px-2 py-2 text-center font-semibold w-14">Unsure</th>
                </tr>
              </thead>
              <tbody>
                {[4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12].map((dim) => {
                  const score = dimensionScores[dim];
                  const hasData = score && score.totalItems > 0;
                  const isHighUnsure = score?.isInsufficientData;
                  const weight = DIMENSION_WEIGHTS[dim];
                  const hasDepthBlend = [1, 3, 12, 13].includes(dim);
                  
                  return (
                    <tr key={dim} className={`border-b ${isHighUnsure ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-2 font-medium text-gray-900">
                        D{dim}: {DIMENSION_NAMES[dim]}
                        {hasDepthBlend && (
                          <span className="text-purple-500 text-xs ml-1" title="Uses 85% grid + 15% depth blend">†</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center text-gray-500 text-xs">{weight}%</td>
                      <td className="px-2 py-2 text-center">
                        {hasData ? <span className="text-gray-600">{safeNumber(score.rawScore)}</span> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-2 text-center text-xs">
                        {hasData && score.geoMultiplier < 1 ? (
                          <span className="text-orange-600">{score.geoMultiplier}x</span>
                        ) : hasData ? (
                          <span className="text-gray-400">1.0x</span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {hasData ? (
                          <span className="font-bold" style={{ color: getScoreColor(safeNumber(score.adjustedScore)) }}>
                            {safeNumber(score.adjustedScore)}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        {hasData ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-600 font-medium" title="Currently Offer (5pts)">✓{score.breakdown?.currentlyOffer || 0}</span>
                            <span className="text-blue-600 font-medium" title="Planning (3pts)">●{score.breakdown?.planning || 0}</span>
                            <span className="text-orange-500 font-medium" title="Assessing (2pts)">○{score.breakdown?.assessing || 0}</span>
                            <span className="text-red-500 font-medium" title="Not Able (0pts)">✗{score.breakdown?.notAble || 0}</span>
                            {(score.breakdown?.unsure || 0) > 0 && (
                              <span className="text-gray-400 font-medium" title="Unsure (0pts)">?{score.breakdown.unsure}</span>
                            )}
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {hasData && score.unsureCount > 0 ? (
                          <span className={isHighUnsure ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                            {isHighUnsure && '⚠️'}{Math.round(safeNumber(score.unsurePercent) * 100)}%
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-2 bg-gray-50 text-xs text-gray-500">
              <span className="text-purple-500 font-medium">†</span> Dimensions D1, D3, D12, D13 use 85% grid + 15% depth blend
            </div>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-4 p-3 bg-white/60 rounded-lg text-xs text-gray-600">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-semibold">Scoring Model (v1.0):</span>
          <span><strong className="text-blue-700">Dimension (95%)</strong> = Weighted scores with depth blend on D1,D3,D12,D13</span>
          <span><strong className="text-indigo-600">Maturity (3%)</strong> = Support approach level</span>
          <span><strong className="text-indigo-600">Breadth (2%)</strong> = Coverage scope</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-green-600 font-bold">✓</span> Currently Offer (5pts)
          <span className="text-blue-600 font-bold">●</span> Planning (3pts)
          <span className="text-orange-500 font-bold">○</span> Assessing (2pts)
          <span className="text-red-500 font-bold">✗</span> Not Able (0pts)
          <span className="text-gray-400 font-bold">?</span> Unsure (0pts)
        </div>
        <div className="mt-2 text-gray-500">
          <strong>Tiers:</strong> Exemplary (90+) | Leading (75-89) | Progressing (60-74) | Emerging (40-59) | Developing (&lt;40)
        </div>
      </div>
    </section>
  );
}

/**
 * ENHANCED SCORING COMPONENT
 * Displays comprehensive scoring with all four components:
 * - Base Score (dimension grids)
 * - Depth Score (follow-up questions)
 * - Maturity Score (current support approach)
 * - Breadth Score (conditions & structure)
 */

'use client';

import React, { useMemo, useState } from 'react';
import {
  calculateEnhancedScore,
  getScoreColor,
  DIMENSION_NAMES,
  DIMENSION_WEIGHTS,
  COMPONENT_WEIGHTS,
  type EnhancedScore,
} from '@/lib/enhanced-scoring';

interface EnhancedScoringProps {
  assessment: any;
  showDetails?: boolean;
}

// ============================================
// SCORE RING COMPONENT
// ============================================

function ScoreRing({ score, label, color, size = 100 }: { score: number; label: string; color: string; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
      </div>
      <span className="text-xs text-gray-600 mt-1 text-center font-medium">{label}</span>
    </div>
  );
}

// ============================================
// COMPONENT BREAKDOWN BAR
// ============================================

function ComponentBar({ 
  label, 
  score, 
  weight, 
  contribution,
  details 
}: { 
  label: string; 
  score: number; 
  weight: number;
  contribution: number;
  details?: Record<string, { value: number; maxValue: number; source: string }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = getScoreColor(score);
  
  return (
    <div className="mb-3">
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
        onClick={() => details && Object.keys(details).length > 0 && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {details && Object.keys(details).length > 0 && (
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <span className="font-medium text-gray-800">{label}</span>
          <span className="text-xs text-gray-500">({weight}% weight)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${score}%`, backgroundColor: color }}
            />
          </div>
          <span className="font-bold text-lg w-12 text-right" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-500 w-16 text-right">+{contribution.toFixed(1)} pts</span>
        </div>
      </div>
      
      {expanded && details && Object.keys(details).length > 0 && (
        <div className="ml-6 mt-2 space-y-1 bg-gray-50 rounded-lg p-3">
          {Object.entries(details).map(([key, detail]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{detail.source}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${(detail.value / detail.maxValue) * 100}%`, 
                      backgroundColor: getScoreColor((detail.value / detail.maxValue) * 100) 
                    }}
                  />
                </div>
                <span className="text-gray-700 font-medium w-12 text-right">
                  {detail.value}/{detail.maxValue}
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
    baseScore, depthScore, maturityScore, breadthScore, compositeScore, tier,
    depthDetails, maturityDetails, breadthDetails,
    dimensionScores, completedDimensions, insufficientDataCount, isProvisional
  } = enhancedScore;
  
  // Calculate contributions
  const baseContribution = baseScore * COMPONENT_WEIGHTS.base;
  const depthContribution = depthScore * COMPONENT_WEIGHTS.depth;
  const maturityContribution = maturityScore * COMPONENT_WEIGHTS.maturity;
  const breadthContribution = breadthScore * COMPONENT_WEIGHTS.breadth;
  
  return (
    <section className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Enhanced Assessment Scoring</h2>
          <p className="text-sm text-gray-600">Comprehensive evaluation across 4 scoring dimensions</p>
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
              <p className="text-xs text-amber-600 mt-1">* Provisional classification</p>
            )}
          </div>
        )}
      </div>
      
      {/* Composite Score Display */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-center gap-8">
          {/* Main Composite Score */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <ScoreRing score={compositeScore} label="" color={getScoreColor(compositeScore)} size={140} />
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: getScoreColor(compositeScore) }}>
                  {compositeScore}
                </span>
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-900 mt-2">Composite Score</p>
            <p className="text-xs text-gray-500">{completedDimensions}/13 dimensions completed</p>
          </div>
          
          {/* Component Scores */}
          <div className="grid grid-cols-4 gap-6">
            <div className="relative">
              <ScoreRing score={baseScore} label="Base" color={getScoreColor(baseScore)} size={80} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold" style={{ color: getScoreColor(baseScore) }}>{baseScore}</span>
              </div>
            </div>
            <div className="relative">
              <ScoreRing score={depthScore} label="Depth" color={getScoreColor(depthScore)} size={80} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold" style={{ color: getScoreColor(depthScore) }}>{depthScore}</span>
              </div>
            </div>
            <div className="relative">
              <ScoreRing score={maturityScore} label="Maturity" color={getScoreColor(maturityScore)} size={80} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold" style={{ color: getScoreColor(maturityScore) }}>{maturityScore}</span>
              </div>
            </div>
            <div className="relative">
              <ScoreRing score={breadthScore} label="Breadth" color={getScoreColor(breadthScore)} size={80} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold" style={{ color: getScoreColor(breadthScore) }}>{breadthScore}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Warnings */}
      {isProvisional && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-yellow-800 text-sm font-medium">
            Provisional Classification: {insufficientDataCount} dimensions have &gt;40% "Unsure" responses
          </span>
        </div>
      )}
      
      {/* Component Breakdown */}
      {showDetails && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Score Composition</h3>
          
          <ComponentBar 
            label="Base Score" 
            score={baseScore} 
            weight={70}
            contribution={baseContribution}
          />
          
          <ComponentBar 
            label="Depth Score" 
            score={depthScore} 
            weight={15}
            contribution={depthContribution}
            details={depthDetails.details}
          />
          
          <ComponentBar 
            label="Maturity Score" 
            score={maturityScore} 
            weight={10}
            contribution={maturityContribution}
            details={maturityDetails.details}
          />
          
          <ComponentBar 
            label="Breadth Score" 
            score={breadthScore} 
            weight={5}
            contribution={breadthContribution}
            details={breadthDetails.details}
          />
          
          {/* Total */}
          <div className="mt-4 pt-4 border-t-2 border-indigo-200 flex items-center justify-between">
            <span className="font-bold text-gray-900">Composite Total</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold" style={{ color: getScoreColor(compositeScore) }}>
                {compositeScore}
              </span>
              <span className="text-sm text-gray-500">
                = {baseContribution.toFixed(1)} + {depthContribution.toFixed(1)} + {maturityContribution.toFixed(1)} + {breadthContribution.toFixed(1)}
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
                  <th className="px-2 py-2 text-center font-semibold w-16">Raw</th>
                  <th className="px-2 py-2 text-center font-semibold w-12">Geo</th>
                  <th className="px-2 py-2 text-center font-semibold w-16">Adj</th>
                  <th className="px-3 py-2 text-left font-semibold">Breakdown</th>
                  <th className="px-2 py-2 text-center font-semibold w-16">Unsure</th>
                </tr>
              </thead>
              <tbody>
                {[4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12].map((dim) => {
                  const score = dimensionScores[dim];
                  const hasData = score.totalItems > 0;
                  const isHighUnsure = score.isInsufficientData;
                  const weight = DIMENSION_WEIGHTS[dim];
                  
                  return (
                    <tr key={dim} className={`border-b ${isHighUnsure ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-2 font-medium text-gray-900">
                        D{dim}: {DIMENSION_NAMES[dim]}
                      </td>
                      <td className="px-2 py-2 text-center text-gray-500 text-xs">{weight}%</td>
                      <td className="px-2 py-2 text-center">
                        {hasData ? <span className="text-gray-600">{score.rawScore}</span> : <span className="text-gray-400">—</span>}
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
                          <span className="font-bold" style={{ color: getScoreColor(score.adjustedScore) }}>
                            {score.adjustedScore}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        {hasData ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-600 font-medium" title="Currently Offer (5 pts)">✓{score.breakdown.currentlyOffer}</span>
                            <span className="text-blue-600 font-medium" title="Planning (3 pts)">●{score.breakdown.planning}</span>
                            <span className="text-orange-500 font-medium" title="Assessing (2 pts)">○{score.breakdown.assessing}</span>
                            <span className="text-red-500 font-medium" title="Not Able (0 pts)">✗{score.breakdown.notAble}</span>
                            {score.breakdown.unsure > 0 && (
                              <span className="text-gray-400 font-medium" title="Unsure (0 pts)">?{score.breakdown.unsure}</span>
                            )}
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {hasData && score.unsureCount > 0 ? (
                          <span className={isHighUnsure ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                            {isHighUnsure && '⚠️'}{Math.round(score.unsurePercent * 100)}%
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-4 p-3 bg-white/60 rounded-lg">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <span className="font-semibold">Scoring Model:</span>
          <span><strong>Base (70%)</strong> = Dimension grids</span>
          <span><strong>Depth (15%)</strong> = Follow-up question quality</span>
          <span><strong>Maturity (10%)</strong> = Current support approach</span>
          <span><strong>Breadth (5%)</strong> = Conditions & structure</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span><span className="text-green-600 font-bold">✓</span> Currently Offer (5pts)</span>
          <span><span className="text-blue-600 font-bold">●</span> Planning (3pts)</span>
          <span><span className="text-orange-500 font-bold">○</span> Assessing (2pts)</span>
          <span><span className="text-red-500 font-bold">✗</span> Not Able (0pts)</span>
          <span><span className="text-gray-400 font-bold">?</span> Unsure (0pts)</span>
        </div>
      </div>
    </section>
  );
}

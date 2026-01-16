'use client'

import { useState, useMemo } from 'react'

interface DetailedViewProps {
  assessment: any
  onClose: () => void
}

// ============================================
// BRAND COLORS
// ============================================
const BRAND = {
  orange: '#F37021',
  lightBlue: '#C7EAFB',
  gray: { 900: '#757E84', 700: '#9CA3AF', 500: '#D1D5DB' }
}

// ============================================
// SCORING CONSTANTS
// ============================================
const POINTS = {
  CURRENTLY_OFFER: 5,
  PLANNING: 3,
  ASSESSING: 2,
  NOT_ABLE: 0,   // 0 pts, IN denominator
  UNSURE: 0      // 0 pts, IN denominator (NOT excluded!)
}

const DIMENSION_NAMES: Record<number, string> = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources',
  5: 'Workplace Accommodations & Modifications',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention, Wellness & Legal Compliance',
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness'
}

const DIMENSION_ITEM_COUNTS: Record<number, number> = {
  1: 11, 2: 17, 3: 10, 4: 10, 5: 11, 6: 12, 7: 9, 8: 12, 9: 11, 10: 19, 11: 13, 12: 8, 13: 9
}

// Default weights (sum to 100%)
const DEFAULT_WEIGHTS: Record<number, number> = {
  1: 10, 2: 10, 3: 8, 4: 8, 5: 7, 6: 8, 7: 6, 8: 7, 9: 6, 10: 8, 11: 6, 12: 8, 13: 8
}

// ============================================
// SECTION CONFIGURATION
// ============================================
const sectionNames: Record<string, string> = {
  firmographics_complete: 'Company Firmographics',
  general_benefits_complete: 'General Benefits',
  current_support_complete: 'Current Support Programs',
  dimension1_complete: 'D1: Medical Leave & Flexibility',
  dimension2_complete: 'D2: Insurance & Financial Protection',
  dimension3_complete: 'D3: Manager Preparedness',
  dimension4_complete: 'D4: Navigation & Expert Resources',
  dimension5_complete: 'D5: Workplace Accommodations',
  dimension6_complete: 'D6: Culture & Psychological Safety',
  dimension7_complete: 'D7: Career Continuity',
  dimension8_complete: 'D8: Work Continuation',
  dimension9_complete: 'D9: Executive Commitment',
  dimension10_complete: 'D10: Caregiver & Family Support',
  dimension11_complete: 'D11: Prevention & Wellness',
  dimension12_complete: 'D12: Continuous Improvement',
  dimension13_complete: 'D13: Communication & Awareness',
  cross_dimensional_complete: 'Cross-Dimensional Assessment',
  employee_impact_complete: 'Employee Impact Assessment'
}

// ============================================
// SCORING HELPER FUNCTIONS
// ============================================
function statusToPoints(status: string): { points: number; isUnsure: boolean } {
  if (!status) return { points: 0, isUnsure: false }
  
  const normalized = status.toLowerCase().trim()
  
  // UNSURE = 0 points, but STILL COUNTS in denominator
  if (normalized.includes('unsure') || normalized === '?') {
    return { points: 0, isUnsure: true }
  }
  if (normalized.includes('currently') || normalized.includes('offer') || normalized === 'yes') {
    return { points: POINTS.CURRENTLY_OFFER, isUnsure: false }
  }
  if (normalized.includes('planning') || normalized.includes('development') || normalized.includes('active')) {
    return { points: POINTS.PLANNING, isUnsure: false }
  }
  if (normalized.includes('assessing') || normalized.includes('feasibility')) {
    return { points: POINTS.ASSESSING, isUnsure: false }
  }
  if (normalized.includes('not able') || normalized.includes('foreseeable') || normalized === 'no') {
    return { points: POINTS.NOT_ABLE, isUnsure: false }
  }
  
  return { points: 0, isUnsure: false }
}

interface DimensionScore {
  rawScore: number
  maxPossible: number
  percentage: number
  totalItems: number
  answeredItems: number
  unsureCount: number
  unsurePercent: number
  breakdown: {
    currentlyOffer: number
    planning: number
    assessing: number
    notAble: number
    unsure: number
    noResponse: number
  }
}

function calculateDimensionScore(dimNum: number, assessment: any): DimensionScore {
  const result: DimensionScore = {
    rawScore: 0,
    maxPossible: 0,
    percentage: 0,
    totalItems: 0,
    answeredItems: 0,
    unsureCount: 0,
    unsurePercent: 0,
    breakdown: {
      currentlyOffer: 0,
      planning: 0,
      assessing: 0,
      notAble: 0,
      unsure: 0,
      noResponse: 0
    }
  }
  
  const dimData = assessment[`dimension${dimNum}_data`]
  if (!dimData) return result
  
  const mainGrid = dimData[`d${dimNum}a`]
  if (!mainGrid || typeof mainGrid !== 'object') return result
  
  let earnedPoints = 0
  let itemsInDenominator = 0
  
  Object.values(mainGrid).forEach((status: any) => {
    result.totalItems++
    const { points, isUnsure } = statusToPoints(status)
    
    // ALL responses count in denominator (including Unsure!)
    itemsInDenominator++
    earnedPoints += points
    
    // Track breakdown
    if (isUnsure) {
      result.unsureCount++
      result.breakdown.unsure++
    } else if (points === POINTS.CURRENTLY_OFFER) {
      result.breakdown.currentlyOffer++
    } else if (points === POINTS.PLANNING) {
      result.breakdown.planning++
    } else if (points === POINTS.ASSESSING) {
      result.breakdown.assessing++
    } else if (points === POINTS.NOT_ABLE) {
      result.breakdown.notAble++
    } else {
      result.breakdown.noResponse++
    }
  })
  
  result.answeredItems = itemsInDenominator
  result.rawScore = earnedPoints
  result.maxPossible = itemsInDenominator * POINTS.CURRENTLY_OFFER
  result.percentage = result.maxPossible > 0 ? Math.round((earnedPoints / result.maxPossible) * 100) : 0
  result.unsurePercent = result.totalItems > 0 ? Math.round((result.unsureCount / result.totalItems) * 100) : 0
  
  return result
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function DetailedResponseView({ assessment, onClose }: DetailedViewProps) {
  const [activeSection, setActiveSection] = useState<string>('overview')
  
  // Calculate all dimension scores
  const dimensionScores = useMemo(() => {
    const scores: Record<number, DimensionScore> = {}
    for (let i = 1; i <= 13; i++) {
      scores[i] = calculateDimensionScore(i, assessment)
    }
    return scores
  }, [assessment])
  
  // Calculate composite scores
  const compositeScores = useMemo(() => {
    let totalEarned = 0
    let totalMax = 0
    let weightedSum = 0
    let totalWeight = 0
    let dimensionsCompleted = 0
    
    // Totals for breakdown
    let totalCurrentlyOffer = 0
    let totalPlanning = 0
    let totalAssessing = 0
    let totalNotAble = 0
    let totalUnsure = 0
    
    for (let i = 1; i <= 13; i++) {
      const score = dimensionScores[i]
      if (score.answeredItems > 0) {
        dimensionsCompleted++
        totalEarned += score.rawScore
        totalMax += score.maxPossible
        
        totalCurrentlyOffer += score.breakdown.currentlyOffer
        totalPlanning += score.breakdown.planning
        totalAssessing += score.breakdown.assessing
        totalNotAble += score.breakdown.notAble
        totalUnsure += score.breakdown.unsure
        
        const weight = DEFAULT_WEIGHTS[i]
        weightedSum += (score.percentage / 100) * weight
        totalWeight += weight
      }
    }
    
    const unweighted = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0
    const weighted = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0
    
    // Index: 100 = benchmark (using average of all companies, defaulting to 50 for single company view)
    const benchmark = 50
    const index = benchmark > 0 ? Math.round((unweighted / benchmark) * 100) : 0
    
    return { 
      unweighted, 
      weighted, 
      index,
      dimensionsCompleted,
      totalDimensions: 13,
      totalEarned,
      totalMax,
      breakdown: {
        currentlyOffer: totalCurrentlyOffer,
        planning: totalPlanning,
        assessing: totalAssessing,
        notAble: totalNotAble,
        unsure: totalUnsure
      }
    }
  }, [dimensionScores])
  
  // Get section completion status
  const getSectionStatus = (key: string): 'complete' | 'incomplete' | 'not_started' => {
    const completeKey = key.includes('_complete') ? key : `${key}_complete`
    const dataKey = key.replace('_complete', '_data')
    
    if (assessment[completeKey]) return 'complete'
    
    const data = assessment[dataKey] || assessment[key.replace('_complete', '_data')]
    if (data && Object.keys(data).length > 0) return 'incomplete'
    
    return 'not_started'
  }

  // Format data for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) return value.join(', ') || '—'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  // Render data section
  const renderDataSection = (data: any, title: string) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="text-gray-500 italic py-4">No data recorded for this section</div>
      )
    }
    
    return (
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex border-b border-gray-100 pb-2">
            <div className="w-1/3 text-sm font-medium text-gray-600">{key}</div>
            <div className="w-2/3 text-sm text-gray-900">{formatValue(value)}</div>
          </div>
        ))}
      </div>
    )
  }

  // Performance tier based on unweighted score
  const getPerformanceTier = (score: number): { tier: string; color: string; bgColor: string } => {
    if (score >= 80) return { tier: 'Exceptional', color: 'text-green-700', bgColor: 'bg-green-100' }
    if (score >= 60) return { tier: 'Strong', color: 'text-blue-700', bgColor: 'bg-blue-100' }
    if (score >= 40) return { tier: 'Developing', color: 'text-amber-700', bgColor: 'bg-amber-100' }
    return { tier: 'Emerging', color: 'text-gray-700', bgColor: 'bg-gray-100' }
  }

  const performanceTier = getPerformanceTier(compositeScores.unweighted)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F37021] to-orange-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{assessment.company_name || 'Company Profile'}</h2>
            <p className="text-orange-100 text-sm mt-1">
              Survey ID: {assessment.survey_id} • {assessment.email}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* ============================================ */}
          {/* ASSESSMENT SCORING SECTION */}
          {/* ============================================ */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Assessment Scoring</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${performanceTier.bgColor} ${performanceTier.color}`}>
                {performanceTier.tier}
              </span>
            </div>
            
            {/* Scoring Table */}
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-4 py-3 text-left font-semibold">Dimension</th>
                    <th className="px-3 py-3 text-center font-semibold">Score</th>
                    <th className="px-3 py-3 text-center font-semibold">Items</th>
                    <th className="px-4 py-3 text-left font-semibold">Breakdown</th>
                    <th className="px-3 py-3 text-center font-semibold">Unsure %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dimensionScores).map(([dimNum, score]) => {
                    const dim = parseInt(dimNum)
                    const hasData = score.answeredItems > 0
                    const isHighUnsure = score.unsurePercent > 40
                    
                    return (
                      <tr key={dim} className={`border-b ${isHighUnsure ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">D{dim}: {DIMENSION_NAMES[dim]}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {hasData ? (
                            <span className={`font-bold ${
                              score.percentage >= 80 ? 'text-green-600' :
                              score.percentage >= 60 ? 'text-blue-600' :
                              score.percentage >= 40 ? 'text-amber-600' : 'text-gray-600'
                            }`}>
                              {score.percentage}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600">
                          {hasData ? `${score.rawScore}/${score.maxPossible}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {hasData ? (
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-green-600 font-medium" title="Currently Offer (5 pts)">
                                ✓{score.breakdown.currentlyOffer}
                              </span>
                              <span className="text-blue-600 font-medium" title="Planning (3 pts)">
                                ●{score.breakdown.planning}
                              </span>
                              <span className="text-orange-500 font-medium" title="Assessing (2 pts)">
                                ○{score.breakdown.assessing}
                              </span>
                              <span className="text-red-500 font-medium" title="Not Able (0 pts)">
                                ✗{score.breakdown.notAble}
                              </span>
                              {score.breakdown.unsure > 0 && (
                                <span className="text-gray-400 font-medium" title="Unsure (0 pts)">
                                  ?{score.breakdown.unsure}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {hasData && score.unsurePercent > 0 ? (
                            <span className={`${isHighUnsure ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                              {isHighUnsure && '⚠️ '}{score.unsurePercent}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  
                  {/* TOTALS ROW with INDEX */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td className="px-4 py-4 text-gray-900">TOTAL</td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-lg text-gray-900">{compositeScores.unweighted}%</span>
                        <span className="text-xs text-gray-500 font-normal">unweighted</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center text-gray-700">
                      {compositeScores.totalEarned}/{compositeScores.totalMax}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-600">✓{compositeScores.breakdown.currentlyOffer}</span>
                        <span className="text-blue-600">●{compositeScores.breakdown.planning}</span>
                        <span className="text-orange-500">○{compositeScores.breakdown.assessing}</span>
                        <span className="text-red-500">✗{compositeScores.breakdown.notAble}</span>
                        {compositeScores.breakdown.unsure > 0 && (
                          <span className="text-gray-400">?{compositeScores.breakdown.unsure}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      {/* INDEX SCORE */}
                      <div className="flex flex-col items-center">
                        <span className={`text-lg ${
                          compositeScores.index >= 100 ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          {compositeScores.index}
                        </span>
                        <span className="text-xs text-gray-500 font-normal">Index</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Legend */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="font-semibold text-gray-700">Breakdown Legend:</span>
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
                  <span className="text-gray-400 font-bold">?</span> Unsure (0 pts)
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-600">
                <strong>Note:</strong> All responses including "Unsure" and "Not Able" are included in the denominator. 
                Index score uses 100 as benchmark (average of all participants).
              </p>
            </div>
          </section>

          {/* ============================================ */}
          {/* SECTION COMPLETION STATUS */}
          {/* ============================================ */}
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Section Completion Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(sectionNames).map(([key, name]) => {
                const status = getSectionStatus(key)
                return (
                  <div 
                    key={key}
                    className={`p-3 rounded-lg border-2 ${
                      status === 'complete' ? 'border-green-500 bg-green-50' :
                      status === 'incomplete' ? 'border-amber-500 bg-amber-50' :
                      'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {status === 'complete' && (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {status === 'incomplete' && (
                        <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      )}
                      {status === 'not_started' && (
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-sm font-medium ${
                        status === 'complete' ? 'text-green-800' :
                        status === 'incomplete' ? 'text-amber-800' :
                        'text-gray-500'
                      }`}>
                        {name}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ============================================ */}
          {/* DETAILED DATA SECTIONS */}
          {/* ============================================ */}
          
          {/* Company Info */}
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Company Name</p>
                <p className="font-medium">{assessment.company_name || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{assessment.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Survey ID</p>
                <p className="font-medium font-mono">{assessment.survey_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium">{new Date(assessment.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{new Date(assessment.updated_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className={`font-medium ${assessment.payment_completed ? 'text-green-600' : 'text-amber-600'}`}>
                  {assessment.payment_completed ? '✓ Paid' : 'Pending'}
                </p>
              </div>
            </div>
          </section>

          {/* Firmographics Data */}
          {assessment.firmographics_data && Object.keys(assessment.firmographics_data).length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Firmographics Data</h3>
              {renderDataSection(assessment.firmographics_data, 'Firmographics')}
            </section>
          )}

          {/* General Benefits Data */}
          {assessment.general_benefits_data && Object.keys(assessment.general_benefits_data).length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">General Benefits</h3>
              {renderDataSection(assessment.general_benefits_data, 'General Benefits')}
            </section>
          )}

          {/* Current Support Data */}
          {assessment.current_support_data && Object.keys(assessment.current_support_data).length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Current Support Programs</h3>
              {renderDataSection(assessment.current_support_data, 'Current Support')}
            </section>
          )}

          {/* Dimension Data Sections */}
          {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(dim => {
            const dimData = assessment[`dimension${dim}_data`]
            if (!dimData || Object.keys(dimData).length === 0) return null
            
            return (
              <section key={dim} className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                  D{dim}: {DIMENSION_NAMES[dim]}
                </h3>
                {renderDataSection(dimData, `Dimension ${dim}`)}
              </section>
            )
          })}

          {/* Cross-Dimensional Data */}
          {assessment.cross_dimensional_data && Object.keys(assessment.cross_dimensional_data).length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Cross-Dimensional Assessment</h3>
              {renderDataSection(assessment.cross_dimensional_data, 'Cross-Dimensional')}
            </section>
          )}

          {/* Employee Impact Data */}
          {assessment.employee_impact_data && Object.keys(assessment.employee_impact_data).length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Employee Impact Assessment</h3>
              {renderDataSection(assessment.employee_impact_data, 'Employee Impact')}
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

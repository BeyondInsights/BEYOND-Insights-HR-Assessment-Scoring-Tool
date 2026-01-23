'use client'

import Image from 'next/image'
import { useMemo } from 'react'
import { calculateEnhancedScore } from '@/lib/enhanced-scoring'

interface DetailedViewProps {
  assessment: any
  onClose: () => void
}

const sectionNames: Record<string, string> = {
  firmographics_complete: 'Company Firmographics',
  general_benefits_complete: 'General Benefits',
  current_support_complete: 'Current Support Programs',
  dimension1_complete: 'Medical Leave & Flexibility',
  dimension2_complete: 'Insurance & Financial Protection',
  dimension3_complete: 'Manager Preparedness & Capability',
  dimension4_complete: 'Navigation & Expert Resources',
  dimension5_complete: 'Workplace Accommodations',
  dimension6_complete: 'Culture & Psychological Safety',
  dimension7_complete: 'Career Continuity & Advancement',
  dimension8_complete: 'Work Continuation & Resumption',
  dimension9_complete: 'Executive Commitment & Resources',
  dimension10_complete: 'Caregiver & Family Support',
  dimension11_complete: 'Prevention, Wellness & Legal Compliance',
  dimension12_complete: 'Continuous Improvement & Outcomes',
  dimension13_complete: 'Communication & Awareness',
  cross_dimensional_complete: 'Cross-Dimensional Assessment',
  'employee-impact-assessment_complete': 'Employee Impact Assessment'
}

// ============================================
// SCORING LOGIC - COPIED EXACTLY FROM SCORING PAGE
// ============================================

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
  13: 'Communication & Awareness',
}

// Default weights - same as scoring page
const DEFAULT_WEIGHTS: Record<number, number> = {
  4: 14,   // D4: Navigation
  8: 13,   // D8: Return-to-Work
  3: 12,   // D3: Manager Preparedness
  2: 11,   // D2: Insurance & Financial
  13: 10,  // D13: Communication
  6: 8,    // D6: Culture
  1: 7,    // D1: Medical Leave
  5: 7,    // D5: Accommodations
  7: 4,    // D7: Career Continuity
  9: 4,    // D9: Executive Commitment
  10: 4,   // D10: Caregiver & Family
  11: 3,   // D11: Prevention & Wellness
  12: 3,   // D12: Continuous Improvement
}

const POINTS = {
  CURRENTLY_OFFER: 5,
  PLANNING: 3,
  ASSESSING: 2,
  NOT_ABLE: 0,
}

const INSUFFICIENT_DATA_THRESHOLD = 0.40

// EXACT copy of statusToPoints from scoring page
function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: POINTS.CURRENTLY_OFFER, isUnsure: false }
      case 3: return { points: POINTS.PLANNING, isUnsure: false }
      case 2: return { points: POINTS.ASSESSING, isUnsure: false }
      case 1: return { points: POINTS.NOT_ABLE, isUnsure: false }
      case 5: return { points: null, isUnsure: true }
      default: return { points: null, isUnsure: false }
    }
  }
  
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim()
    if (s.includes('not able')) return { points: POINTS.NOT_ABLE, isUnsure: false }
    if (s === 'unsure' || s.includes('unsure')) return { points: null, isUnsure: true }
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || 
        s.includes('use') || s.includes('track') || s.includes('measure')) {
      return { points: POINTS.CURRENTLY_OFFER, isUnsure: false }
    }
    if (s.includes('planning') || s.includes('development')) return { points: POINTS.PLANNING, isUnsure: false }
    if (s.includes('assessing') || s.includes('feasibility')) return { points: POINTS.ASSESSING, isUnsure: false }
    if (s.length > 0) return { points: POINTS.NOT_ABLE, isUnsure: false }
  }
  return { points: null, isUnsure: false }
}

// EXACT copy of getGeoMultiplier from scoring page - with type safety
function getGeoMultiplier(geoResponse: string | number | undefined | null): number {
  if (!geoResponse) return 1.0
  // Handle numeric geo responses from panel data
  if (typeof geoResponse === 'number') {
    // Panel data might use: 1=Consistent, 2=Vary, 3=Select
    if (geoResponse === 1) return 1.0
    if (geoResponse === 2) return 0.90
    if (geoResponse === 3) return 0.75
    return 1.0
  }
  if (typeof geoResponse !== 'string') return 1.0
  const s = geoResponse.toLowerCase()
  if (s.includes('consistent') || s.includes('generally consistent')) return 1.0
  if (s.includes('vary') || s.includes('varies')) return 0.90
  if (s.includes('select') || s.includes('only available in select')) return 0.75
  return 1.0
}

interface DimensionScore {
  rawScore: number
  adjustedScore: number
  geoMultiplier: number
  totalItems: number
  answeredItems: number
  unsureCount: number
  unsurePercent: number
  isInsufficientData: boolean
  breakdown: {
    currentlyOffer: number
    planning: number
    assessing: number
    notAble: number
    unsure: number
  }
}

// EXACT copy of calculateDimensionScore from scoring page (with breakdown added)
function calculateDimensionScore(dimNum: number, dimData: Record<string, any> | null): DimensionScore {
  const result: DimensionScore = {
    rawScore: 0,
    adjustedScore: 0,
    geoMultiplier: 1.0,
    totalItems: 0,
    answeredItems: 0,
    unsureCount: 0,
    unsurePercent: 0,
    isInsufficientData: false,
    breakdown: {
      currentlyOffer: 0,
      planning: 0,
      assessing: 0,
      notAble: 0,
      unsure: 0
    }
  }
  
  if (!dimData) return result
  
  const mainGrid = dimData[`d${dimNum}a`]
  if (!mainGrid || typeof mainGrid !== 'object') return result
  
  let earnedPoints = 0
  
  Object.values(mainGrid).forEach((status: any) => {
    result.totalItems++
    const { points, isUnsure } = statusToPoints(status)
    
    if (isUnsure) {
      result.unsureCount++
      result.answeredItems++ // Unsure counts in denominator with 0 points
      result.breakdown.unsure++
      // earnedPoints += 0 (implicit)
    } else if (points !== null) {
      result.answeredItems++
      earnedPoints += points
      
      // Track breakdown
      if (points === POINTS.CURRENTLY_OFFER) {
        result.breakdown.currentlyOffer++
      } else if (points === POINTS.PLANNING) {
        result.breakdown.planning++
      } else if (points === POINTS.ASSESSING) {
        result.breakdown.assessing++
      } else {
        result.breakdown.notAble++
      }
    }
  })
  
  result.unsurePercent = result.totalItems > 0 ? result.unsureCount / result.totalItems : 0
  result.isInsufficientData = result.unsurePercent > INSUFFICIENT_DATA_THRESHOLD
  
  // Raw score calculation - EXACT same as scoring page
  const maxPoints = result.answeredItems * POINTS.CURRENTLY_OFFER
  if (maxPoints > 0) {
    result.rawScore = Math.round((earnedPoints / maxPoints) * 100)
  } else {
    result.rawScore = 0
  }
  
  // Apply geo multiplier - EXACT same as scoring page
  const geoResponse = dimData[`d${dimNum}aa`] || dimData[`D${dimNum}aa`]
  result.geoMultiplier = getGeoMultiplier(geoResponse)
  result.adjustedScore = Math.round(result.rawScore * result.geoMultiplier)
  
  return result
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#2E7D32'
  if (score >= 60) return '#1565C0'
  if (score >= 40) return '#EF6C00'
  return '#C62828'
}

function getPerformanceTier(score: number, isProvisional: boolean): { name: string; color: string; bg: string; isProvisional: boolean } {
  let tier: { name: string; color: string; bg: string }
  if (score >= 90) {
    tier = { name: 'Exemplary', color: '#1B5E20', bg: '#E8F5E9' }
  } else if (score >= 75) {
    tier = { name: 'Leading', color: '#0D47A1', bg: '#E3F2FD' }
  } else if (score >= 60) {
    tier = { name: 'Progressing', color: '#E65100', bg: '#FFF8E1' }
  } else if (score >= 40) {
    tier = { name: 'Emerging', color: '#BF360C', bg: '#FFF3E0' }
  } else {
    tier = { name: 'Developing', color: '#37474F', bg: '#ECEFF1' }
  }
  return { ...tier, isProvisional }
}

export default function DetailedResponseView({ assessment, onClose }: DetailedViewProps) {
  const sections = Object.entries(sectionNames).map(([key, name]) => ({
    key,
    name,
    completed: assessment[key as keyof typeof assessment] === true
  }))

  const completedSections = sections.filter(s => s.completed).length
  const totalSections = sections.length
  const completionPercentage = Math.round((completedSections / totalSections) * 100)

  // Get firmographics data
  const firmographics = assessment.firmographics_data || {}

  // Get the survey ID for profile link
  const surveyId = assessment.app_id || assessment.survey_id || ''

  // Open company profile in new tab (admin version)
  const openProfile = () => {
    const profileUrl = `/admin/profile/${surveyId}`
    window.open(profileUrl, '_blank')
  }

  // ============================================
  // CALCULATE DIMENSION SCORES - EXACT SAME LOGIC AS SCORING PAGE
  // ============================================
  const dimensionScores = useMemo(() => {
    const scores: Record<number, DimensionScore> = {}
    for (let i = 1; i <= 13; i++) {
      const dimData = assessment[`dimension${i}_data`]
      scores[i] = calculateDimensionScore(i, dimData)
    }
    return scores
  }, [assessment])

  // Calculate composite scores - EXACT SAME LOGIC AS SCORING PAGE
  const compositeScores = useMemo(() => {
    // Use canonical enhanced-scoring library for consistent scores across all pages
    const enhancedResult = calculateEnhancedScore(assessment)
    
    // Get CB3 individual scores for display
    const currentSupport = assessment.current_support_data || {}
    const generalBenefits = assessment.general_benefits_data || {}
    const cb3aScore = enhancedResult.breadthDetails?.details?.cb3a?.value ?? 0
    const cb3bScore = enhancedResult.breadthDetails?.details?.cb3b?.value ?? 0
    const cb3cScore = enhancedResult.breadthDetails?.details?.cb3c?.value ?? 0
    
    // Calculate breakdown from dimension scores
    let totalCurrentlyOffer = 0
    let totalPlanning = 0
    let totalAssessing = 0
    let totalNotAble = 0
    let totalUnsure = 0
    
    for (let i = 1; i <= 13; i++) {
      const dimScore = enhancedResult.dimensionScores[i]
      if (dimScore?.breakdown) {
        totalCurrentlyOffer += dimScore.breakdown.currentlyOffer || 0
        totalPlanning += dimScore.breakdown.planning || 0
        totalAssessing += dimScore.breakdown.assessing || 0
        totalNotAble += dimScore.breakdown.notAble || 0
        totalUnsure += dimScore.breakdown.unsure || 0
      }
    }
    
    // Map to existing interface
    return {
      unweightedScore: Math.round(
        Object.values(enhancedResult.dimensionScores)
          .filter(d => d.totalItems > 0)
          .reduce((sum, d) => sum + d.adjustedScore, 0) / 
        Math.max(1, Object.values(enhancedResult.dimensionScores).filter(d => d.totalItems > 0).length)
      ),
      weightedScore: enhancedResult.baseScore,
      compositeScore: enhancedResult.compositeScore,
      maturityScore: enhancedResult.maturityScore,
      breadthScore: enhancedResult.breadthScore,
      cb3aScore,
      cb3bScore,
      cb3cScore,
      completedDimCount: enhancedResult.completedDimensions,
      isComplete: enhancedResult.isComplete,
      isProvisional: enhancedResult.isProvisional,
      insufficientDataCount: enhancedResult.insufficientDataCount,
      tier: enhancedResult.tier,
      breakdown: {
        currentlyOffer: totalCurrentlyOffer,
        planning: totalPlanning,
        assessing: totalAssessing,
        notAble: totalNotAble,
        unsure: totalUnsure
      }
    }
  }, [assessment])

  // Check if any dimension has data
  const hasAnyDimensionData = compositeScores.completedDimCount > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with BI Logo */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg p-2">
              <Image 
                src="/BI_LOGO_FINAL.png" 
                alt="Beyond Insights" 
                width={140} 
                height={42}
                className="h-8 w-auto"
              />
            </div>
            <div className="border-l border-white/30 pl-4">
              <p className="text-blue-100 text-sm">Survey ID</p>
              <p className="font-semibold">{surveyId || 'N/A'}</p>
            </div>
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
          
          {/* Company Information Section */}
          <div className="mb-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Company Information</h3>
              {surveyId && (
                <button
                  onClick={openProfile}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Full Profile
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Company Name</p>
                <p className="font-semibold text-gray-900">{assessment.company_name || firmographics.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Industry</p>
                <p className="font-semibold text-gray-900">{firmographics.c2 || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Company Revenue</p>
                <p className="font-semibold text-gray-900">
                  {(firmographics.c4 && !Array.isArray(firmographics.c4) ? firmographics.c4 : null) || firmographics.c5 || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Headquarters</p>
                <p className="font-semibold text-gray-900">{firmographics.s9 || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide"># Countries w/ Presence</p>
                <p className="font-semibold text-gray-900">{firmographics.s9a || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Employees</p>
                <p className="font-semibold text-gray-900">{firmographics.s8 || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Benefits Eligibility</p>
                <p className="font-semibold text-gray-900">{firmographics.c3 || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mb-6 bg-blue-50 rounded-lg p-5 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Contact Person</p>
                <p className="font-semibold text-gray-900">
                  {firmographics.firstName || ''} {firmographics.lastName || ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <p className="font-semibold text-gray-900">{assessment.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Title</p>
                <p className="font-semibold text-gray-900">
                  {(() => {
                    const title = firmographics.title
                    const titleOther = firmographics.titleOther || firmographics.title_other
                    const s5 = firmographics.s5
                    
                    // Handle string title
                    if (typeof title === 'string' && title.toLowerCase() !== 'other') {
                      return title
                    }
                    // Fallback to titleOther if title is "other" or not a string
                    if (typeof titleOther === 'string' && titleOther) {
                      return titleOther
                    }
                    // s5 might be numeric in panel data - display as-is or map code
                    if (typeof s5 === 'number') {
                      const s5Map: Record<number, string> = {
                        1: 'C-level executive',
                        2: 'Executive/Senior VP',
                        3: 'Vice President',
                        4: 'Director',
                        5: 'Senior Manager',
                        6: 'Manager',
                        7: 'HR Generalist',
                        8: 'Benefits Specialist',
                        9: 'HR Specialist',
                        10: 'HR Assistant',
                        11: 'Other'
                      }
                      return s5Map[s5] || `Level ${s5}`
                    }
                    if (typeof s5 === 'string' && s5) {
                      return s5
                    }
                    return 'N/A'
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-sm font-semibold text-green-900 mb-1">Completion Status</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-green-700">{completionPercentage}%</p>
                <p className="text-sm text-green-600">Complete</p>
              </div>
              <p className="text-sm text-green-600 mt-1">
                {completedSections} of {totalSections} sections
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">Timeline</h3>
              <p className="text-sm text-purple-700">
                Started: {new Date(assessment.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-purple-700 mt-1">
                Last Active: {new Date(assessment.updated_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-purple-600 mt-1">
                {assessment.daysInProgress} days in progress
              </p>
            </div>

            {/* User Type Badge */}
            <div className={`rounded-lg p-4 border ${
              assessment.isFoundingPartner 
                ? 'bg-purple-50 border-purple-300' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Participant Type</h3>
              {assessment.isFoundingPartner ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="font-bold text-purple-700">Founding Partner</p>
                    <p className="text-sm text-purple-600">No payment required</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-blue-700">Standard Participant</p>
                  <p className="text-sm text-blue-600">$1,250 fee</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info - Only for Non-Founding Partners */}
          {!assessment.isFoundingPartner && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Payment Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`font-semibold ${assessment.payment_completed ? 'text-green-600' : 'text-red-600'}`}>
                    {assessment.payment_completed ? '✓ Paid' : '✗ Unpaid'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Method</p>
                  <p className="font-semibold text-gray-900">
                    {assessment.payment_method || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-semibold text-gray-900">
                    ${(assessment.payment_amount || 1250).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* ASSESSMENT SCORING SECTION */}
          {/* ============================================ */}
          {hasAnyDimensionData && (
            <div className="mb-6 bg-indigo-50 rounded-lg p-5 border border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Assessment Scoring</h3>
                {compositeScores.tier && (
                  <span 
                    className="px-3 py-1.5 rounded-lg text-sm font-bold"
                    style={{ backgroundColor: compositeScores.tier.bg, color: compositeScores.tier.color }}
                  >
                    {compositeScores.tier.name}
                    {compositeScores.tier.isProvisional && ' *'}
                  </span>
                )}
              </div>
              
              {/* Summary Cards - Top Row: Main Scores */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-3 border-2 border-indigo-300">
                  <p className="text-xs text-indigo-600 uppercase font-semibold">Composite Score</p>
                  <p className="text-3xl font-bold" style={{ color: getScoreColor(compositeScores.compositeScore) }}>
                    {compositeScores.completedDimCount > 0 ? compositeScores.compositeScore : '—'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">90% Dim + 5% Mat + 5% Brd</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <p className="text-xs text-gray-500 uppercase">Weighted Dimension</p>
                  <p className="text-2xl font-bold" style={{ color: getScoreColor(compositeScores.weightedScore) }}>
                    {compositeScores.completedDimCount > 0 ? compositeScores.weightedScore : '—'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <p className="text-xs text-gray-500 uppercase">Dimensions</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {compositeScores.completedDimCount}/13
                  </p>
                </div>
              </div>
              
              {/* Summary Cards - Bottom Row: Maturity & Breadth */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-green-600 uppercase font-medium">Maturity (5%)</p>
                      <p className="text-xl font-bold" style={{ color: getScoreColor(compositeScores.maturityScore) }}>
                        {compositeScores.maturityScore}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">OR1</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-purple-600 uppercase font-medium">Breadth (5%)</p>
                      <p className="text-xl font-bold" style={{ color: getScoreColor(compositeScores.breadthScore) }}>
                        {compositeScores.breadthScore}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">CB3a: {compositeScores.cb3aScore}</span>
                      <span className="text-[10px] text-gray-400 block">CB3b: {compositeScores.cb3bScore}</span>
                      <span className="text-[10px] text-gray-400 block">CB3c: {compositeScores.cb3cScore}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {compositeScores.isProvisional && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-yellow-800 text-sm font-medium">
                    Provisional Classification: {compositeScores.insufficientDataCount} dimensions have &gt;40% "Unsure" responses
                  </span>
                </div>
              )}
              
              {/* Scoring Table */}
              <div className="bg-white rounded-lg overflow-hidden border border-indigo-200">
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
                      const score = dimensionScores[dim]
                      const hasData = score.totalItems > 0
                      const isHighUnsure = score.isInsufficientData
                      const weight = DEFAULT_WEIGHTS[dim]
                      
                      return (
                        <tr key={dim} className={`border-b ${isHighUnsure ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            D{dim}: {DIMENSION_NAMES[dim]}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-500 text-xs">
                            {weight}%
                          </td>
                          <td className="px-2 py-2 text-center">
                            {hasData ? (
                              <span className="text-gray-600">{score.rawScore}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center text-xs">
                            {hasData && score.geoMultiplier < 1 ? (
                              <span className="text-orange-600">{score.geoMultiplier}x</span>
                            ) : hasData ? (
                              <span className="text-gray-400">1.0x</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {hasData ? (
                              <span className={`font-bold`} style={{ color: getScoreColor(score.adjustedScore) }}>
                                {score.adjustedScore}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {hasData ? (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-green-600 font-medium" title="Currently Offer (5 pts)">✓{score.breakdown.currentlyOffer}</span>
                                <span className="text-blue-600 font-medium" title="Planning (3 pts)">◆{score.breakdown.planning}</span>
                                <span className="text-orange-500 font-medium" title="Assessing (2 pts)">○{score.breakdown.assessing}</span>
                                <span className="text-red-500 font-medium" title="Not Able (0 pts)">✗{score.breakdown.notAble}</span>
                                {score.breakdown.unsure > 0 && (
                                  <span className="text-gray-400 font-medium" title="Unsure (0 pts, in denominator)">?{score.breakdown.unsure}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {hasData && score.unsureCount > 0 ? (
                              <span className={isHighUnsure ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                                {isHighUnsure && '⚠️'}{Math.round(score.unsurePercent * 100)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    
                    {/* TOTAL ROW */}
                    <tr className="bg-indigo-100 font-bold border-t-2 border-indigo-300">
                      <td className="px-3 py-3 text-indigo-900">WEIGHTED TOTAL</td>
                      <td className="px-2 py-3 text-center text-indigo-600 text-xs">100%</td>
                      <td className="px-2 py-3 text-center text-indigo-700">
                        {compositeScores.unweightedScore}
                      </td>
                      <td className="px-2 py-3 text-center text-indigo-600 text-xs">—</td>
                      <td className="px-2 py-3 text-center">
                        <span className="text-xl" style={{ color: getScoreColor(compositeScores.weightedScore) }}>
                          {compositeScores.weightedScore}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-600">✓{compositeScores.breakdown.currentlyOffer}</span>
                          <span className="text-blue-600">◆{compositeScores.breakdown.planning}</span>
                          <span className="text-orange-500">○{compositeScores.breakdown.assessing}</span>
                          <span className="text-red-500">✗{compositeScores.breakdown.notAble}</span>
                          {compositeScores.breakdown.unsure > 0 && (
                            <span className="text-gray-400">?{compositeScores.breakdown.unsure}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        {compositeScores.insufficientDataCount > 0 && (
                          <span className="text-amber-600 text-xs">{compositeScores.insufficientDataCount} dims</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <span className="font-semibold">Legend:</span>
                <span><span className="text-green-600 font-bold">✓</span> Currently Offer (5pts)</span>
                <span><span className="text-blue-600 font-bold">◆</span> Planning (3pts)</span>
                <span><span className="text-orange-500 font-bold">○</span> Assessing (2pts)</span>
                <span><span className="text-red-500 font-bold">✗</span> Not Able (0pts)</span>
                <span><span className="text-gray-400 font-bold">?</span> Unsure (0pts, in denominator)</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span><strong>Geo:</strong> Consistent=1.0x, Varies=0.9x, Select=0.75x</span>
                <span>|</span>
                <span><strong>⚠️</strong> = &gt;40% Unsure (Insufficient Data)</span>
              </div>
            </div>
          )}

          {/* Section Completion Status */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Survey Section Status</h3>
            <div className="space-y-2">
              {sections.map(section => (
                <div
                  key={section.key}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    section.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      section.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {section.completed ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">—</span>
                      )}
                    </div>
                    <span className={`font-medium ${
                      section.completed ? 'text-green-900' : 'text-gray-700'
                    }`}>
                      {section.name}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    section.completed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {section.completed ? 'Completed' : 'Incomplete'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-3">
          {surveyId && (
            <button
              onClick={openProfile}
              className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-semibold"
            >
              View Full Profile
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

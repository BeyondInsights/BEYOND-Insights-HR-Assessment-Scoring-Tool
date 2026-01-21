'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

// ============================================
// CONSTANTS & SCORING FUNCTIONS
// ============================================

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
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness'
};

const DEFAULT_DIMENSION_WEIGHTS: Record<number, number> = {
  1: 7, 2: 11, 3: 12, 4: 14, 5: 7, 6: 8, 7: 4, 8: 13, 9: 4, 10: 4, 11: 3, 12: 3, 13: 10
};

const DIMENSION_QUESTION_COUNTS: Record<number, number> = {
  1: 9, 2: 12, 3: 8, 4: 13, 5: 11, 6: 7, 7: 5, 8: 10, 9: 5, 10: 7, 11: 3, 12: 7, 13: 7
};

// Tier assignment
function getTier(score: number): { name: string; color: string; bgColor: string; borderColor: string } {
  if (score >= 90) return { name: 'Exemplary', color: 'text-purple-700', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' };
  if (score >= 75) return { name: 'Leading', color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-300' };
  if (score >= 60) return { name: 'Progressing', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' };
  if (score >= 40) return { name: 'Emerging', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' };
  return { name: 'Developing', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-300' };
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#0284C7';
  if (score >= 40) return '#D97706';
  return '#DC2626';
}

function getIndexStatus(index: number): { label: string; color: string; icon: string } {
  if (index >= 115) return { label: 'Excellent', color: 'text-green-600', icon: '↑↑' };
  if (index >= 105) return { label: 'Above', color: 'text-green-500', icon: '↑' };
  if (index >= 95) return { label: 'At Benchmark', color: 'text-gray-500', icon: '≈' };
  if (index >= 85) return { label: 'Below', color: 'text-amber-500', icon: '↓' };
  return { label: 'Needs Focus', color: 'text-red-500', icon: '↓↓' };
}

// Geo multiplier for multi-country consistency
function getGeoMultiplier(geoResponse: any): number {
  if (!geoResponse) return 1.0;
  const v = String(geoResponse).toLowerCase();
  if (v.includes('only available in select') || v.includes('only in select')) return 0.75;
  if (v.includes('varies by location') || v.includes('varies by')) return 0.90;
  return 1.0; // "Consistent across all" or single-country
}

// Follow-up scoring functions for D1, D3, D12, D13
function scoreD1PaidLeave(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('does not apply')) return 0;
  if (v.includes('13 or more') || v.includes('13+ weeks')) return 100;
  if ((v.includes('9 to') && v.includes('13')) || v.includes('9-13')) return 70;
  if ((v.includes('5 to') && v.includes('9')) || v.includes('5-9')) return 40;
  if ((v.includes('3 to') && v.includes('5')) || v.includes('3-5')) return 20;
  if ((v.includes('1 to') && v.includes('3')) || v.includes('1-3')) return 10;
  return 0;
}

function scoreD3Training(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('less than 10%') || v === 'less than 10') return 0;
  if (v === '100%' || v === '100' || (v.includes('100') && !v.includes('less than'))) return 100;
  if (v.includes('75') && v.includes('100')) return 80;
  if (v.includes('50') && v.includes('75')) return 50;
  if (v.includes('25') && v.includes('50')) return 30;
  if (v.includes('10') && v.includes('25')) return 10;
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

function scoreD12PolicyChanges(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('significant') || v.includes('major')) return 100;
  if (v.includes('some') || v.includes('minor') || v.includes('adjustments')) return 60;
  if (v.includes('no change') || v.includes('not yet') || v.includes('none')) return 20;
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
  if (v.includes('do not actively') || v.includes('no regular')) return 0;
  return 0;
}

function calculateFollowUpScore(dimNum: number, assessment: Record<string, any>): number | null {
  const dimData = assessment[`dimension${dimNum}_data`];
  if (!dimData) return null;
  
  switch (dimNum) {
    case 1: {
      const d1_1_usa = dimData?.d1_1_usa;
      const d1_1_non_usa = dimData?.d1_1_non_usa;
      const scores: number[] = [];
      if (d1_1_usa) scores.push(scoreD1PaidLeave(d1_1_usa));
      if (d1_1_non_usa) scores.push(scoreD1PaidLeave(d1_1_non_usa));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 3: {
      const d31 = dimData?.d31 ?? dimData?.d3_1;
      return d31 ? scoreD3Training(d31) : null;
    }
    case 12: {
      const d12_1 = dimData?.d12_1;
      const d12_2 = dimData?.d12_2;
      const scores: number[] = [];
      if (d12_1) scores.push(scoreD12CaseReview(d12_1));
      if (d12_2) scores.push(scoreD12PolicyChanges(d12_2));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
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
// SCORING FUNCTIONS (same as scoring page)
// ============================================

const GRID_RESPONSE_SCORES: Record<string, number> = {
  'Currently offer': 5,
  'Planning to offer within 12 months': 3,
  'Assessing / Considering': 2,
  'Not able to offer': 0,
  'Unsure': 0
};

function scoreGridResponse(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  
  // Handle numeric codes (from panel data)
  // IMPORTANT: 4 = Currently offer, 3 = Planning, 2 = Assessing, 1 = Not able, 5 = Unsure
  if (typeof value === 'number') {
    switch (value) {
      case 4: return 5;  // Currently offer = 5 points
      case 3: return 3;  // Planning = 3 points
      case 2: return 2;  // Assessing = 2 points
      case 1: return 0;  // Not able = 0 points
      case 5: return 0;  // Unsure = 0 points (treated as no credit)
      default: return null;
    }
  }
  
  // Handle string values
  const strValue = String(value).toLowerCase().trim();
  
  // Check for "Not able" first (before checking for "offer")
  if (strValue.includes('not able')) return 0;
  
  // Check for Unsure/Unknown
  if (strValue === 'unsure' || strValue.includes('unsure') || strValue.includes('unknown')) return 0;
  
  // Currently offer variations
  if (strValue.includes('currently') || strValue.includes('offer') || strValue.includes('provide') || 
      strValue.includes('use') || strValue.includes('track') || strValue.includes('measure')) {
    return 5;
  }
  
  // Planning
  if (strValue.includes('planning') || strValue.includes('development')) return 3;
  
  // Assessing
  if (strValue.includes('assessing') || strValue.includes('feasibility') || strValue.includes('considering')) return 2;
  
  return null;
}

function calculateDimensionGridScore(dimData: Record<string, any>, dimNum: number): { score: number; rawScore: number; geoMultiplier: number; answered: number; total: number; unsureCount: number } | null {
  if (!dimData) {
    console.log(`Dim ${dimNum}: No dimData`);
    return null;
  }
  
  const expectedCount = DIMENSION_QUESTION_COUNTS[dimNum] || 10;
  let earnedPoints = 0;
  let answeredCount = 0;
  let totalItems = 0;
  let unsureCount = 0;
  
  // Match scoring page exactly: look for d1a, d2a, etc.
  const mainGrid = dimData[`d${dimNum}a`];
  
  if (!mainGrid || typeof mainGrid !== 'object') {
    console.log(`Dim ${dimNum}: No mainGrid (d${dimNum}a). Keys available:`, Object.keys(dimData).slice(0, 10));
    return null;
  }
  
  console.log(`Dim ${dimNum}: Found mainGrid with`, Object.keys(mainGrid).length, 'items');
  
  // Process grid items exactly like scoring page
  Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
    totalItems++;
    const result = statusToPoints(status);
    if (result.isUnsure) {
      unsureCount++;
      answeredCount++;
    } else if (result.points !== null) {
      answeredCount++;
      earnedPoints += result.points;
    }
  });
  
  if (answeredCount === 0) {
    console.log(`Dim ${dimNum}: No answered items`);
    return null;
  }
  
  const maxPoints = answeredCount * 5; // 5 = POINTS.CURRENTLY_OFFER
  const rawScore = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
  
  // Get geo multiplier
  const geoResponse = dimData[`d${dimNum}aa`] || dimData[`D${dimNum}aa`];
  const geoMultiplier = getGeoMultiplier(geoResponse);
  const adjustedScore = Math.round(rawScore * geoMultiplier);
  
  console.log(`Dim ${dimNum}: earned=${earnedPoints}, max=${maxPoints}, raw=${rawScore}, adj=${adjustedScore}`);
  
  return {
    score: adjustedScore,
    rawScore,
    geoMultiplier,
    answered: answeredCount,
    total: expectedCount,
    unsureCount
  };
}

// Match scoring page's statusToPoints exactly
function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: 5, isUnsure: false };  // Currently offer
      case 3: return { points: 3, isUnsure: false };  // Planning
      case 2: return { points: 2, isUnsure: false };  // Assessing
      case 1: return { points: 0, isUnsure: false };  // Not able
      case 5: return { points: null, isUnsure: true }; // Unsure
      default: return { points: null, isUnsure: false };
    }
  }
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return { points: 0, isUnsure: false };
    if (s === 'unsure' || s.includes('unsure') || s.includes('unknown')) return { points: null, isUnsure: true };
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || 
        s.includes('use') || s.includes('track') || s.includes('measure')) {
      return { points: 5, isUnsure: false };
    }
    if (s.includes('planning') || s.includes('development')) return { points: 3, isUnsure: false };
    if (s.includes('assessing') || s.includes('feasibility') || s.includes('considering')) return { points: 2, isUnsure: false };
  }
  return { points: null, isUnsure: false };
}

function calculateMaturityScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const or1 = currentSupport.or1;
  
  if (or1 === 6 || or1 === '6') return 100;
  if (or1 === 5 || or1 === '5') return 80;
  if (or1 === 4 || or1 === '4') return 50;
  if (or1 === 3 || or1 === '3') return 20;
  if (or1 === 2 || or1 === '2') return 0;
  if (or1 === 1 || or1 === '1') return 0;
  
  const v = String(or1 || '').toLowerCase();
  if (v.includes('leading-edge') || v.includes('comprehensive')) return 100;
  if (v.includes('enhanced') || v.includes('strong')) return 80;
  if (v.includes('moderate')) return 50;
  if (v.includes('basic') || v.includes('developing')) return 20;
  if (v.includes('legal minimum') || v.includes('no formal')) return 0;
  return 0;
}

function calculateBreadthScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const generalBenefits = assessment.general_benefits_data || {};
  const scores: number[] = [];
  
  const cb3a = currentSupport.cb3a ?? generalBenefits.cb3a;
  if (cb3a !== undefined && cb3a !== null) {
    const v = String(cb3a).toLowerCase();
    if (v.includes('go well beyond') || v.includes('significantly exceed') || cb3a === 3 || cb3a === '3') {
      scores.push(100);
    } else if (v.includes('go somewhat beyond') || v.includes('somewhat exceed') || cb3a === 2 || cb3a === '2') {
      scores.push(50);
    } else {
      scores.push(0);
    }
  }
  
  const cb3b = currentSupport.cb3b ?? generalBenefits.cb3b;
  if (Array.isArray(cb3b)) {
    scores.push(Math.round((cb3b.length / 6) * 100));
  }
  
  const cb3c = currentSupport.cb3c ?? generalBenefits.cb3c;
  if (Array.isArray(cb3c)) {
    scores.push(Math.round((cb3c.length / 13) * 100));
  }
  
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CompanyReportPage() {
  const params = useParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  
  // Handle surveyId - could be string or array
  const surveyId = Array.isArray(params.surveyId) ? params.surveyId[0] : params.surveyId;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [companyScores, setCompanyScores] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('Loading report for surveyId:', surveyId);
        
        // Load company assessment
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('survey_id', surveyId)
          .single();
        
        console.log('Assessment query result:', { assessment, assessmentError });
        
        if (assessmentError) {
          console.error('Assessment error:', assessmentError);
          setError(`Company not found: ${assessmentError.message}`);
          setLoading(false);
          return;
        }
        
        if (!assessment) {
          setError('No assessment data found for this company');
          setLoading(false);
          return;
        }
        
        // Load all assessments for benchmarks
        const { data: allAssessments, error: allError } = await supabase
          .from('assessments')
          .select('*');
        
        if (allError) {
          console.error('All assessments error:', allError);
        }
        
        // Calculate company scores
        const scores = calculateCompanyScores(assessment);
        console.log('Calculated scores:', scores);
        setCompanyScores(scores);
        setCompany(assessment);
        
        // Calculate benchmarks from all assessments
        if (allAssessments) {
          const benchmarkScores = calculateBenchmarks(allAssessments);
          setBenchmarks(benchmarkScores);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(`Failed to load report data: ${err?.message || 'Unknown error'}`);
        setLoading(false);
      }
    }
    
    if (surveyId) {
      loadData();
    } else {
      setError('No survey ID provided');
      setLoading(false);
    }
  }, [surveyId]);

  function calculateCompanyScores(assessment: Record<string, any>) {
    const dimensionScores: Record<number, number | null> = {};
    const followUpScores: Record<number, number | null> = {};
    let weightedSum = 0;
    let weightTotal = 0;
    
    // Default blend weights (85% grid, 15% follow-up)
    const gridPct = 85;
    const followUpPct = 15;
    
    console.log('=== DEBUG: Calculating scores for', assessment.company_name, '===');
    
    for (let dim = 1; dim <= 13; dim++) {
      const dimData = assessment[`dimension${dim}_data`];
      
      // DEBUG: Log the structure of each dimension
      if (dim <= 3) {
        console.log(`Dimension ${dim} data:`, dimData);
        console.log(`Dimension ${dim} keys:`, dimData ? Object.keys(dimData) : 'null');
        if (dimData) {
          console.log(`d${dim}a exists?`, !!dimData[`d${dim}a`]);
          // Also check for alternative key patterns
          const firstKey = Object.keys(dimData)[0];
          console.log(`First key in dim${dim}:`, firstKey, '=', dimData[firstKey]);
        }
      }
      
      const result = calculateDimensionGridScore(dimData, dim);
      console.log(`Dimension ${dim} result:`, result);
      
      if (result && result.score !== null && result.score !== undefined) {
        let finalScore = result.score;
        
        // For D1, D3, D12, D13 - apply blended scoring
        if ([1, 3, 12, 13].includes(dim)) {
          const followUp = calculateFollowUpScore(dim, assessment);
          followUpScores[dim] = followUp;
          
          if (followUp !== null) {
            finalScore = Math.round((result.score * (gridPct / 100)) + (followUp * (followUpPct / 100)));
          }
        }
        
        dimensionScores[dim] = finalScore;
        
        const weight = DEFAULT_DIMENSION_WEIGHTS[dim];
        weightedSum += finalScore * weight;
        weightTotal += weight;
      } else {
        dimensionScores[dim] = null;
      }
    }
    
    console.log('Final dimension scores:', dimensionScores);
    console.log('Weighted sum:', weightedSum, 'Weight total:', weightTotal);
    
    const weightedDimScore = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : null;
    const maturityScore = calculateMaturityScore(assessment);
    const breadthScore = calculateBreadthScore(assessment);
    
    // Composite = 90% weighted + 5% maturity + 5% breadth
    const compositeScore = weightedDimScore !== null 
      ? Math.round(weightedDimScore * 0.9 + maturityScore * 0.05 + breadthScore * 0.05)
      : null;
    
    return {
      compositeScore,
      weightedDimScore,
      maturityScore,
      breadthScore,
      dimensionScores,
      followUpScores,
      tier: compositeScore !== null ? getTier(compositeScore) : null
    };
  }

  function calculateBenchmarks(assessments: any[]) {
    // Filter to complete assessments only (non-panel)
    const complete = assessments.filter(a => {
      let completedDims = 0;
      for (let dim = 1; dim <= 13; dim++) {
        if (a[`dimension${dim}_data`]) completedDims++;
      }
      return completedDims >= 10 && !a.company_name?.includes('Panel Co');
    });
    
    if (complete.length === 0) return null;
    
    const allScores = complete.map(a => calculateCompanyScores(a));
    
    const avg = (arr: (number | null)[]) => {
      const valid = arr.filter(v => v !== null) as number[];
      return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
    };
    
    const dimensionBenchmarks: Record<number, number | null> = {};
    for (let dim = 1; dim <= 13; dim++) {
      dimensionBenchmarks[dim] = avg(allScores.map(s => s.dimensionScores[dim]));
    }
    
    return {
      compositeScore: avg(allScores.map(s => s.compositeScore)),
      weightedDimScore: avg(allScores.map(s => s.weightedDimScore)),
      maturityScore: avg(allScores.map(s => s.maturityScore)),
      breadthScore: avg(allScores.map(s => s.breadthScore)),
      dimensionScores: dimensionBenchmarks,
      companyCount: complete.length
    };
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  if (error || !company || !companyScores) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <p className="text-red-600 text-lg mb-2">{error || 'Unable to generate report'}</p>
          <p className="text-gray-500 text-sm mb-4">Survey ID: {surveyId || 'not provided'}</p>
          <button onClick={() => router.push('/admin/scoring')} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            Go Back to Scoring
          </button>
        </div>
      </div>
    );
  }

  const companyName = company.company_name || 'Company';
  const { compositeScore, weightedDimScore, maturityScore, breadthScore, dimensionScores, tier } = companyScores;

  // Calculate strengths and opportunities
  const dimensionPerformance = Object.entries(dimensionScores)
    .filter(([_, score]) => score !== null)
    .map(([dim, score]) => {
      const dimNum = parseInt(dim);
      const benchmark = benchmarks?.dimensionScores?.[dimNum] ?? 50;
      const index = benchmark > 0 ? Math.round((score as number / benchmark) * 100) : 100;
      return {
        dim: dimNum,
        name: DIMENSION_NAMES[dimNum],
        score: score as number,
        benchmark,
        index,
        weight: DEFAULT_DIMENSION_WEIGHTS[dimNum],
        gap: (score as number) - benchmark
      };
    })
    .sort((a, b) => b.index - a.index);

  const strengths = dimensionPerformance.filter(d => d.index >= 105 || d.score >= 75).slice(0, 5);
  const opportunities = dimensionPerformance.filter(d => d.index < 95 || d.score < 50).sort((a, b) => a.index - b.index).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Action Bar */}
      <div className="no-print bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button 
            onClick={() => router.push('/admin/scoring')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Scoring
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div ref={printRef} className="max-w-5xl mx-auto py-8 px-6">
        
        {/* ============ PAGE 1: EXECUTIVE SUMMARY ============ */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Header with branding */}
          <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg p-2">
                  <Image 
                    src="/best-companies-2026-logo.png" 
                    alt="Best Companies 2026" 
                    width={88} 
                    height={88}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Company Performance Report</h1>
                  <p className="text-orange-100 text-lg mt-1">Best Companies for Working with Cancer Index 2026</p>
                </div>
              </div>
              <div className="text-right text-white">
                <p className="text-sm opacity-80">Report Generated</p>
                <p className="font-semibold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Company Name & Overall Score */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Prepared For</p>
                <h2 className="text-3xl font-bold text-gray-900 mt-1">{companyName}</h2>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Composite Score</p>
                    <p className="text-5xl font-bold" style={{ color: getScoreColor(compositeScore ?? 0) }}>
                      {compositeScore ?? '—'}
                    </p>
                  </div>
                  {tier && (
                    <div className={`px-4 py-2 rounded-xl ${tier.bgColor} ${tier.borderColor} border-2`}>
                      <p className={`text-xl font-bold ${tier.color}`}>{tier.name}</p>
                      <p className="text-xs text-gray-500">Tier</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Benchmark Comparison Summary */}
          {benchmarks && compositeScore !== null && (
            <div className="px-8 py-4 bg-gray-50 border-b border-gray-100">
              <p className="text-gray-700">
                Your composite score of <strong className="text-lg">{compositeScore}</strong> {' '}
                {compositeScore >= (benchmarks.compositeScore ?? 0) ? (
                  <>is <span className="text-green-600 font-semibold">{compositeScore - (benchmarks.compositeScore ?? 0)} points above</span></>
                ) : (
                  <>is <span className="text-amber-600 font-semibold">{(benchmarks.compositeScore ?? 0) - compositeScore} points below</span></>
                )}
                {' '}the benchmark average of {benchmarks.compositeScore}, placing you in the <strong className={tier?.color}>{tier?.name}</strong> tier
                {benchmarks.companyCount && <span className="text-gray-500"> (based on {benchmarks.companyCount} participating companies)</span>}.
              </p>
            </div>
          )}

          {/* Score Dashboard */}
          <div className="px-8 py-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-sm">1</span>
              Score Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Component</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Your Score</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Benchmark</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Index</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Composite Score', score: compositeScore, benchmark: benchmarks?.compositeScore, weight: '100%' },
                    { name: 'Weighted Dimension Score', score: weightedDimScore, benchmark: benchmarks?.weightedDimScore, weight: '90%' },
                    { name: 'Maturity Score', score: maturityScore, benchmark: benchmarks?.maturityScore, weight: '5%' },
                    { name: 'Breadth Score', score: breadthScore, benchmark: benchmarks?.breadthScore, weight: '5%' },
                  ].map((row, idx) => {
                    const index = row.score !== null && row.benchmark ? Math.round((row.score / row.benchmark) * 100) : null;
                    const status = index !== null ? getIndexStatus(index) : null;
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{row.name}</div>
                          <div className="text-xs text-gray-500">Weight: {row.weight}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-2xl font-bold" style={{ color: getScoreColor(row.score ?? 0) }}>
                            {row.score ?? '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 font-medium">
                          {row.benchmark ?? '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {index !== null ? (
                            <span className={`font-bold ${index >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                              {index}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {status && (
                            <span className={`inline-flex items-center gap-1 ${status.color} font-medium`}>
                              {status.icon} {status.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============ PAGE 2: DIMENSION SCORES ============ */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 print-break">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-sm">2</span>
              Dimension Performance
            </h3>
            <p className="text-blue-100 text-sm mt-1">Scores across all 13 assessment areas</p>
          </div>
          
          <div className="px-8 py-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Dimension</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 w-16">Wt%</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 w-20">Score</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 w-20">Bench</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 w-20">Index</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 w-40">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {dimensionPerformance.map((d, idx) => {
                    const status = getIndexStatus(d.index);
                    const dimTier = getTier(d.score);
                    return (
                      <tr key={d.dim} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-bold text-sm">D{d.dim}:</span>
                            <span className="font-medium text-gray-900 text-sm">{d.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-500 text-sm">{d.weight}%</td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-lg font-bold" style={{ color: getScoreColor(d.score) }}>
                            {d.score}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600">{d.benchmark}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`font-bold ${d.index >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                            {d.index}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(d.score, 100)}%`,
                                  backgroundColor: getScoreColor(d.score)
                                }}
                              />
                            </div>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${dimTier.bgColor} ${dimTier.color}`}>
                              {dimTier.name}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============ PAGE 3: STRENGTHS & OPPORTUNITIES ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 print-break">
          {/* Strengths */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-600 to-emerald-600">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Areas of Strength
              </h3>
              <p className="text-green-100 text-sm">Where you excel compared to benchmark</p>
            </div>
            <div className="p-6">
              {strengths.length > 0 ? (
                <div className="space-y-4">
                  {strengths.map((s, idx) => (
                    <div key={s.dim} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">D{s.dim}: {s.name}</p>
                          <span className="text-green-600 font-bold">{s.score}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {s.gap > 0 ? `${s.gap} points above benchmark` : 'At benchmark'} • Index: {s.index}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No significant strengths identified yet.</p>
              )}
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-500 to-orange-500">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Growth Opportunities
              </h3>
              <p className="text-orange-100 text-sm">Areas with highest potential for improvement</p>
            </div>
            <div className="p-6">
              {opportunities.length > 0 ? (
                <div className="space-y-4">
                  {opportunities.map((o, idx) => (
                    <div key={o.dim} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">D{o.dim}: {o.name}</p>
                          <span className="text-amber-600 font-bold">{o.score}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {o.gap < 0 ? `${Math.abs(o.gap)} points below benchmark` : 'At benchmark'} • Index: {o.index}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Great job! No significant gaps identified.</p>
              )}
            </div>
          </div>
        </div>

        {/* ============ PRIORITY ROADMAP ============ */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-indigo-600">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-sm">4</span>
              Priority Focus Areas
            </h3>
            <p className="text-purple-100 text-sm mt-1">Recommended areas for improvement based on your assessment</p>
          </div>
          
          <div className="p-8">
            {opportunities.length > 0 ? (
              <div className="space-y-6">
                {opportunities.slice(0, 3).map((o, idx) => (
                  <div key={o.dim} className="border-l-4 border-purple-400 pl-6 py-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">
                          Priority {idx + 1}: {o.name}
                        </h4>
                        <p className="text-gray-600 mt-1">
                          Current score: <strong>{o.score}</strong> • Benchmark: <strong>{o.benchmark}</strong> • Gap: <strong className="text-amber-600">{o.gap} points</strong>
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTier(o.score).bgColor} ${getTier(o.score).color}`}>
                        {getTier(o.score).name}
                      </span>
                    </div>
                    <div className="mt-3 bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-800">
                        <strong>Why it matters:</strong> This dimension carries a {o.weight}% weight in your overall score. 
                        Improving by {Math.min(10, o.benchmark - o.score + 5)} points could move you closer to the {getTier(Math.min(100, o.score + 10)).name} tier.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-600">Excellent performance! Your scores are at or above benchmark across all dimensions.</p>
              </div>
            )}
          </div>
        </div>

        {/* ============ FOOTER ============ */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image 
                  src="/CAC_Logo.png" 
                  alt="Cancer and Careers" 
                  width={120} 
                  height={40}
                  className="object-contain"
                />
                <div className="border-l border-gray-300 pl-4">
                  <p className="text-sm text-gray-600">Best Companies for Working with Cancer Index</p>
                  <p className="text-xs text-gray-500">© 2026 Cancer and Careers. All rights reserved.</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Survey ID: {surveyId}</p>
                <p>Confidential Report</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

// ============================================
// CONSTANTS
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

// ============================================
// SCORING FUNCTIONS
// ============================================

function getTier(score: number): { name: string; color: string; bgColor: string; textColor: string } {
  if (score >= 90) return { name: 'Exemplary', color: '#7C3AED', bgColor: 'bg-purple-100', textColor: 'text-purple-700' };
  if (score >= 75) return { name: 'Leading', color: '#059669', bgColor: 'bg-green-100', textColor: 'text-green-700' };
  if (score >= 60) return { name: 'Progressing', color: '#0284C7', bgColor: 'bg-blue-100', textColor: 'text-blue-700' };
  if (score >= 40) return { name: 'Emerging', color: '#D97706', bgColor: 'bg-amber-100', textColor: 'text-amber-700' };
  return { name: 'Developing', color: '#DC2626', bgColor: 'bg-red-100', textColor: 'text-red-700' };
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#7C3AED';
  if (score >= 75) return '#059669';
  if (score >= 60) return '#0284C7';
  if (score >= 40) return '#D97706';
  return '#DC2626';
}

function getGeoMultiplier(geoResponse: any): number {
  if (!geoResponse) return 1.0;
  const v = String(geoResponse).toLowerCase();
  if (v.includes('only available in select') || v.includes('only in select')) return 0.75;
  if (v.includes('varies by location') || v.includes('varies by')) return 0.90;
  return 1.0;
}

function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: 5, isUnsure: false };
      case 3: return { points: 3, isUnsure: false };
      case 2: return { points: 2, isUnsure: false };
      case 1: return { points: 0, isUnsure: false };
      case 5: return { points: null, isUnsure: true };
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

function getStatusText(status: string | number): string {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return 'Currently offer';
      case 3: return 'Planning to offer';
      case 2: return 'Assessing';
      case 1: return 'Not able to offer';
      case 5: return 'Unsure';
      default: return 'Unknown';
    }
  }
  return String(status);
}

// Follow-up scoring functions
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
  const surveyId = Array.isArray(params.surveyId) ? params.surveyId[0] : params.surveyId;
  const printRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [companyScores, setCompanyScores] = useState<any>(null);
  const [elementDetails, setElementDetails] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('survey_id', surveyId)
          .single();
        
        if (assessmentError || !assessment) {
          setError(`Company not found: ${assessmentError?.message || 'No data'}`);
          setLoading(false);
          return;
        }
        
        const { data: allAssessments } = await supabase
          .from('assessments')
          .select('*');
        
        const { scores, elements } = calculateCompanyScores(assessment);
        setCompanyScores(scores);
        setElementDetails(elements);
        setCompany(assessment);
        
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
    const elementsByDim: Record<number, any[]> = {};
    let weightedSum = 0;
    let weightTotal = 0;
    
    const gridPct = 85;
    const followUpPct = 15;
    
    for (let dim = 1; dim <= 13; dim++) {
      const dimData = assessment[`dimension${dim}_data`];
      const mainGrid = dimData?.[`d${dim}a`];
      
      if (!mainGrid || typeof mainGrid !== 'object') {
        dimensionScores[dim] = null;
        elementsByDim[dim] = [];
        continue;
      }
      
      let earnedPoints = 0;
      let answeredCount = 0;
      const elements: any[] = [];
      
      Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
        const result = statusToPoints(status);
        if (result.points !== null || result.isUnsure) {
          answeredCount++;
          if (!result.isUnsure && result.points !== null) {
            earnedPoints += result.points;
          }
          elements.push({
            name: itemKey,
            status: getStatusText(status),
            points: result.points ?? 0,
            maxPoints: 5,
            isStrength: result.points === 5,
            isOpportunity: result.points !== null && result.points < 3,
            isUnsure: result.isUnsure
          });
        }
      });
      
      elementsByDim[dim] = elements;
      
      if (answeredCount === 0) {
        dimensionScores[dim] = null;
        continue;
      }
      
      const maxPoints = answeredCount * 5;
      const rawScore = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
      
      const geoResponse = dimData[`d${dim}aa`] || dimData[`D${dim}aa`];
      const geoMultiplier = getGeoMultiplier(geoResponse);
      let finalScore = Math.round(rawScore * geoMultiplier);
      
      if ([1, 3, 12, 13].includes(dim)) {
        const followUp = calculateFollowUpScore(dim, assessment);
        followUpScores[dim] = followUp;
        if (followUp !== null) {
          finalScore = Math.round((finalScore * (gridPct / 100)) + (followUp * (followUpPct / 100)));
        }
      }
      
      dimensionScores[dim] = finalScore;
      
      const weight = DEFAULT_DIMENSION_WEIGHTS[dim];
      weightedSum += finalScore * weight;
      weightTotal += weight;
    }
    
    const weightedDimScore = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : null;
    const maturityScore = calculateMaturityScore(assessment);
    const breadthScore = calculateBreadthScore(assessment);
    
    const compositeScore = weightedDimScore !== null 
      ? Math.round(weightedDimScore * 0.9 + maturityScore * 0.05 + breadthScore * 0.05)
      : null;
    
    return {
      scores: {
        compositeScore,
        weightedDimScore,
        maturityScore,
        breadthScore,
        dimensionScores,
        followUpScores,
        tier: compositeScore !== null ? getTier(compositeScore) : null
      },
      elements: elementsByDim
    };
  }

  function calculateBenchmarks(assessments: any[]) {
    const complete = assessments.filter(a => {
      let completedDims = 0;
      for (let dim = 1; dim <= 13; dim++) {
        if (a[`dimension${dim}_data`]?.[`d${dim}a`]) completedDims++;
      }
      return completedDims >= 10;
    });
    
    if (complete.length === 0) return null;
    
    const allScores = complete.map(a => calculateCompanyScores(a).scores);
    
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  if (error || !company || !companyScores) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  // Analyze dimensions by tier
  const dimensionAnalysis = Object.entries(dimensionScores)
    .filter(([_, score]) => score !== null)
    .map(([dim, score]) => {
      const dimNum = parseInt(dim);
      const dimTier = getTier(score as number);
      const benchmark = benchmarks?.dimensionScores?.[dimNum] ?? 50;
      return {
        dim: dimNum,
        name: DIMENSION_NAMES[dimNum],
        score: score as number,
        tier: dimTier,
        benchmark,
        weight: DEFAULT_DIMENSION_WEIGHTS[dimNum],
        elements: elementDetails?.[dimNum] || []
      };
    })
    .sort((a, b) => b.score - a.score);

  // Count tiers
  const tierCounts = {
    exemplary: dimensionAnalysis.filter(d => d.tier.name === 'Exemplary').length,
    leading: dimensionAnalysis.filter(d => d.tier.name === 'Leading').length,
    progressing: dimensionAnalysis.filter(d => d.tier.name === 'Progressing').length,
    emerging: dimensionAnalysis.filter(d => d.tier.name === 'Emerging').length,
    developing: dimensionAnalysis.filter(d => d.tier.name === 'Developing').length
  };

  // Strengths: Exemplary or Leading dimensions
  const strengthDimensions = dimensionAnalysis.filter(d => d.tier.name === 'Exemplary' || d.tier.name === 'Leading');
  
  // Get top strength elements (Currently offer = 5 points)
  const topStrengthElements: any[] = [];
  strengthDimensions.forEach(d => {
    const strengths = d.elements.filter((e: any) => e.isStrength).slice(0, 3);
    strengths.forEach((e: any) => {
      topStrengthElements.push({ ...e, dimension: d.name, dimNum: d.dim });
    });
  });

  // Opportunities: Below Leading (Progressing, Emerging, Developing)
  const opportunityDimensions = dimensionAnalysis.filter(d => 
    d.tier.name === 'Progressing' || d.tier.name === 'Emerging' || d.tier.name === 'Developing'
  );
  
  // Get top opportunity elements (Not able, Unsure, or Assessing)
  const topOpportunityElements: any[] = [];
  opportunityDimensions.forEach(d => {
    const opportunities = d.elements.filter((e: any) => e.isOpportunity || e.isUnsure).slice(0, 3);
    opportunities.forEach((e: any) => {
      topOpportunityElements.push({ ...e, dimension: d.name, dimNum: d.dim, weight: d.weight });
    });
  });

  // Priority focus: Sort by dimension weight (impact)
  const priorityElements = [...topOpportunityElements]
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-100">
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Action Bar */}
      <div className="no-print bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <button 
            onClick={() => router.push('/admin/scoring')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Scoring
          </button>
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

      <div ref={printRef} className="max-w-5xl mx-auto py-8 px-6">
        
        {/* ============ HEADER ============ */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <Image 
                    src="/best-companies-2026-logo.png" 
                    alt="Best Companies 2026" 
                    width={140} 
                    height={140}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Company Performance Report</h1>
                  <p className="text-orange-100">Best Companies for Working with Cancer Index 2026</p>
                </div>
              </div>
              <div className="text-right text-white">
                <p className="text-sm opacity-80">Report Generated</p>
                <p className="font-semibold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Company Name & Score */}
          <div className="px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Prepared For</p>
                <h2 className="text-3xl font-bold text-gray-900 mt-1">{companyName}</h2>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Composite Score</p>
                  <p className="text-5xl font-bold" style={{ color: tier?.color || '#666' }}>
                    {compositeScore ?? '—'}
                  </p>
                </div>
                {tier && (
                  <div className={`px-4 py-3 rounded-xl ${tier.bgColor} border-2`} style={{ borderColor: tier.color }}>
                    <p className="text-xl font-bold" style={{ color: tier.color }}>{tier.name}</p>
                    <p className="text-xs text-gray-600">Tier</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============ EXECUTIVE SUMMARY ============ */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="px-8 py-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Executive Summary</h3>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">
                <strong>{companyName}</strong> achieved a composite score of <strong style={{ color: tier?.color }}>{compositeScore}</strong>, 
                placing the organization in the <strong style={{ color: tier?.color }}>{tier?.name}</strong> tier for workplace cancer support. 
                {compositeScore && benchmarks?.compositeScore && (
                  compositeScore >= benchmarks.compositeScore 
                    ? ` This score is ${compositeScore - benchmarks.compositeScore} points above the benchmark average of ${benchmarks.compositeScore}.`
                    : ` This score is ${benchmarks.compositeScore - compositeScore} points below the benchmark average of ${benchmarks.compositeScore}.`
                )}
              </p>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                {tierCounts.exemplary > 0 && (
                  <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                    <p className="text-2xl font-bold text-purple-700">{tierCounts.exemplary}</p>
                    <p className="text-xs text-purple-600">Exemplary</p>
                  </div>
                )}
                {tierCounts.leading > 0 && (
                  <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                    <p className="text-2xl font-bold text-green-700">{tierCounts.leading}</p>
                    <p className="text-xs text-green-600">Leading</p>
                  </div>
                )}
                {tierCounts.progressing > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                    <p className="text-2xl font-bold text-blue-700">{tierCounts.progressing}</p>
                    <p className="text-xs text-blue-600">Progressing</p>
                  </div>
                )}
                {tierCounts.emerging > 0 && (
                  <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
                    <p className="text-2xl font-bold text-amber-700">{tierCounts.emerging}</p>
                    <p className="text-xs text-amber-600">Emerging</p>
                  </div>
                )}
                {tierCounts.developing > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                    <p className="text-2xl font-bold text-red-700">{tierCounts.developing}</p>
                    <p className="text-xs text-red-600">Developing</p>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 mt-4 text-sm">
                Of the 13 assessment dimensions, {tierCounts.exemplary + tierCounts.leading} achieved Leading or Exemplary status, 
                while {tierCounts.progressing + tierCounts.emerging + tierCounts.developing} represent opportunities for growth.
              </p>
            </div>
          </div>
        </div>

        {/* ============ SCORE COMPONENTS ============ */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Score Components</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Composite Score', score: compositeScore, weight: '100%', benchmark: benchmarks?.compositeScore },
                { label: 'Weighted Dimension', score: weightedDimScore, weight: '90%', benchmark: benchmarks?.weightedDimScore },
                { label: 'Maturity', score: maturityScore, weight: '5%', benchmark: benchmarks?.maturityScore },
                { label: 'Breadth', score: breadthScore, weight: '5%', benchmark: benchmarks?.breadthScore },
              ].map((item, idx) => {
                const itemTier = item.score !== null ? getTier(item.score) : null;
                return (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                    <p className="text-3xl font-bold" style={{ color: item.score ? getScoreColor(item.score) : '#999' }}>
                      {item.score ?? '—'}
                    </p>
                    {itemTier && (
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${itemTier.bgColor} ${itemTier.textColor}`}>
                        {itemTier.name}
                      </span>
                    )}
                    {item.benchmark && (
                      <p className="text-xs text-gray-400 mt-1">Benchmark: {item.benchmark}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============ DIMENSION PERFORMANCE ============ */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 print-break">
          <div className="px-8 py-4 bg-indigo-600">
            <h3 className="font-bold text-white">Dimension Performance</h3>
            <p className="text-indigo-200 text-sm">Scores across all 13 assessment areas</p>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {dimensionAnalysis.map((d) => (
                <div key={d.dim} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-8 text-right">
                    <span className="text-sm font-bold text-indigo-600">D{d.dim}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{d.name}</p>
                  </div>
                  <div className="w-12 text-center">
                    <span className="text-xs text-gray-500">{d.weight}%</span>
                  </div>
                  <div className="w-16 text-center">
                    <span className="text-lg font-bold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                  </div>
                  <div className="w-24">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(d.score, 100)}%`, backgroundColor: getScoreColor(d.score) }}
                      />
                    </div>
                  </div>
                  <div className="w-24">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${d.tier.bgColor} ${d.tier.textColor}`}>
                      {d.tier.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============ STRENGTHS & OPPORTUNITIES ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-green-600">
              <h3 className="font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Areas of Strength
              </h3>
              <p className="text-green-100 text-sm">{strengthDimensions.length} dimensions at Leading or Exemplary</p>
            </div>
            <div className="p-6">
              {strengthDimensions.length > 0 ? (
                <div className="space-y-4">
                  {strengthDimensions.slice(0, 5).map((d, idx) => (
                    <div key={d.dim} className="border-l-4 border-green-500 pl-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">D{d.dim}: {d.name}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${d.tier.bgColor} ${d.tier.textColor}`}>
                          {d.score} - {d.tier.name}
                        </span>
                      </div>
                      {d.elements.filter((e: any) => e.isStrength).length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p className="text-xs text-green-600 font-medium mb-1">Key strengths:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {d.elements.filter((e: any) => e.isStrength).slice(0, 3).map((e: any, i: number) => (
                              <li key={i} className="text-xs truncate">{e.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No dimensions at Leading or Exemplary level yet.</p>
              )}
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-amber-500">
              <h3 className="font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Growth Opportunities
              </h3>
              <p className="text-amber-100 text-sm">{opportunityDimensions.length} dimensions below Leading tier</p>
            </div>
            <div className="p-6">
              {opportunityDimensions.length > 0 ? (
                <div className="space-y-4">
                  {opportunityDimensions.slice(0, 5).map((d, idx) => (
                    <div key={d.dim} className="border-l-4 border-amber-500 pl-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">D{d.dim}: {d.name}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${d.tier.bgColor} ${d.tier.textColor}`}>
                          {d.score} - {d.tier.name}
                        </span>
                      </div>
                      {d.elements.filter((e: any) => e.isOpportunity || e.isUnsure).length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p className="text-xs text-amber-600 font-medium mb-1">Elements to improve:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {d.elements.filter((e: any) => e.isOpportunity || e.isUnsure).slice(0, 3).map((e: any, i: number) => (
                              <li key={i} className="text-xs truncate">{e.name} ({e.status})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Excellent! All dimensions are at Leading or Exemplary level.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ PRIORITY FOCUS AREAS ============ */}
        {priorityElements.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 print-break">
            <div className="px-8 py-4 bg-purple-600">
              <h3 className="font-bold text-white">Priority Focus Areas</h3>
              <p className="text-purple-200 text-sm">Elements with highest potential impact on score improvement</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {priorityElements.map((e, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
                      <p className="text-xs text-gray-500">D{e.dimNum}: {e.dimension} (Weight: {e.weight}%)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">{e.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ FOOTER ============ */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Image 
                  src="/cancer-careers-logo.png" 
                  alt="Cancer and Careers" 
                  width={150} 
                  height={50}
                  className="object-contain"
                />
                <div className="border-l border-gray-200 pl-6">
                  <p className="text-sm font-medium text-gray-700">Best Companies for Working with Cancer Index</p>
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

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

const DIMENSION_RECOMMENDATIONS: Record<number, { focus: string; actions: string[] }> = {
  1: { 
    focus: 'Paid leave policies directly impact employee financial security during treatment',
    actions: ['Review leave policies against industry benchmarks', 'Consider phased return-to-work programs', 'Evaluate short-term disability coverage adequacy']
  },
  2: { 
    focus: 'Comprehensive insurance reduces financial toxicity—a leading cause of treatment non-adherence',
    actions: ['Audit out-of-pocket maximum exposure', 'Review specialty drug coverage tiers', 'Consider supplemental cancer insurance options']
  },
  3: { 
    focus: 'Managers are often the first point of contact—their response shapes the employee experience',
    actions: ['Implement manager training on sensitive conversations', 'Create manager resource toolkit', 'Establish HR escalation pathways']
  },
  4: { 
    focus: 'Navigation support reduces care fragmentation and improves outcomes',
    actions: ['Partner with oncology navigation services', 'Integrate EAP with cancer-specific resources', 'Provide second opinion services']
  },
  5: { 
    focus: 'Flexible accommodations enable continued productivity during treatment',
    actions: ['Formalize accommodation request process', 'Train managers on interactive dialogue requirements', 'Document successful accommodation patterns']
  },
  6: { 
    focus: 'Psychological safety determines whether employees feel comfortable disclosing and seeking support',
    actions: ['Launch employee resource group', 'Share leadership stories of support', 'Conduct climate surveys on disclosure comfort']
  },
  7: { 
    focus: 'Career protection concerns are a top reason employees hide diagnoses',
    actions: ['Clarify performance evaluation processes during treatment', 'Document promotion pathways post-treatment', 'Address "mommy track" equivalent concerns']
  },
  8: { 
    focus: 'Structured return-to-work programs improve retention and reduce disability duration',
    actions: ['Develop graduated return protocols', 'Assign return-to-work coordinators', 'Create peer support connections']
  },
  9: { 
    focus: 'Visible executive commitment signals organizational priority and enables resource allocation',
    actions: ['Include cancer support in benefits communications', 'Allocate dedicated program budget', 'Establish executive sponsor role']
  },
  10: { 
    focus: 'Caregivers face significant work disruption—supporting them prevents secondary attrition',
    actions: ['Extend flexible work to caregivers', 'Provide caregiver-specific EAP resources', 'Consider backup care services']
  },
  11: { 
    focus: 'Prevention and early detection programs demonstrate investment in long-term employee health',
    actions: ['Promote cancer screening benefits', 'Offer on-site screening events', 'Incentivize preventive care utilization']
  },
  12: { 
    focus: 'Systematic measurement enables continuous improvement and demonstrates ROI',
    actions: ['Track utilization of cancer-related benefits', 'Survey affected employees on experience', 'Benchmark against industry standards']
  },
  13: { 
    focus: 'Awareness drives utilization—employees cannot use benefits they do not know exist',
    actions: ['Include cancer support in onboarding', 'Create dedicated intranet resource page', 'Communicate during open enrollment and cancer awareness months']
  }
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

function getTier(score: number): { name: string; color: string; bgColor: string; textColor: string; borderColor: string } {
  if (score >= 90) return { name: 'Exemplary', color: '#7C3AED', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' };
  if (score >= 75) return { name: 'Leading', color: '#059669', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' };
  if (score >= 60) return { name: 'Progressing', color: '#0284C7', bgColor: 'bg-sky-50', textColor: 'text-sky-700', borderColor: 'border-sky-200' };
  if (score >= 40) return { name: 'Emerging', color: '#D97706', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' };
  return { name: 'Developing', color: '#DC2626', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' };
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

function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean; category: string } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: 5, isUnsure: false, category: 'currently_offer' };
      case 3: return { points: 3, isUnsure: false, category: 'planning' };
      case 2: return { points: 2, isUnsure: false, category: 'assessing' };
      case 1: return { points: 0, isUnsure: false, category: 'not_able' };
      case 5: return { points: null, isUnsure: true, category: 'unsure' };
      default: return { points: null, isUnsure: false, category: 'unknown' };
    }
  }
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return { points: 0, isUnsure: false, category: 'not_able' };
    if (s === 'unsure' || s.includes('unsure') || s.includes('unknown')) return { points: null, isUnsure: true, category: 'unsure' };
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || 
        s.includes('use') || s.includes('track') || s.includes('measure')) {
      return { points: 5, isUnsure: false, category: 'currently_offer' };
    }
    if (s.includes('planning') || s.includes('development')) return { points: 3, isUnsure: false, category: 'planning' };
    if (s.includes('assessing') || s.includes('feasibility') || s.includes('considering')) return { points: 2, isUnsure: false, category: 'assessing' };
  }
  return { points: null, isUnsure: false, category: 'unknown' };
}

function getStatusText(status: string | number): string {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return 'Currently offer';
      case 3: return 'Planning';
      case 2: return 'Assessing';
      case 1: return 'Gap';
      case 5: return 'To clarify';
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
            category: result.category,
            points: result.points ?? 0,
            maxPoints: 5,
            isStrength: result.points === 5,
            isPlanning: result.category === 'planning',
            isAssessing: result.category === 'assessing',
            isGap: result.category === 'not_able',
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
          <p className="mt-4 text-slate-600">Generating report...</p>
        </div>
      </div>
    );
  }

  if (error || !company || !companyScores) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center max-w-md">
          <p className="text-red-600 text-lg mb-2">{error || 'Unable to generate report'}</p>
          <p className="text-slate-500 text-sm mb-4">Survey ID: {surveyId || 'not provided'}</p>
          <button onClick={() => router.push('/admin/scoring')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700">
            Return to Scoring
          </button>
        </div>
      </div>
    );
  }

  const companyName = company.company_name || 'Company';
  const { compositeScore, weightedDimScore, maturityScore, breadthScore, dimensionScores, tier } = companyScores;

  // Analyze dimensions
  const dimensionAnalysis = Object.entries(dimensionScores)
    .filter(([_, score]) => score !== null)
    .map(([dim, score]) => {
      const dimNum = parseInt(dim);
      const dimTier = getTier(score as number);
      const benchmark = benchmarks?.dimensionScores?.[dimNum] ?? 50;
      const elements = elementDetails?.[dimNum] || [];
      return {
        dim: dimNum,
        name: DIMENSION_NAMES[dimNum],
        score: score as number,
        tier: dimTier,
        benchmark,
        weight: DEFAULT_DIMENSION_WEIGHTS[dimNum],
        elements,
        strengths: elements.filter((e: any) => e.isStrength),
        planning: elements.filter((e: any) => e.isPlanning),
        assessing: elements.filter((e: any) => e.isAssessing),
        gaps: elements.filter((e: any) => e.isGap),
        unsure: elements.filter((e: any) => e.isUnsure),
        recommendations: DIMENSION_RECOMMENDATIONS[dimNum]
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

  // Opportunities: Below Leading
  const opportunityDimensions = dimensionAnalysis
    .filter(d => d.tier.name !== 'Exemplary' && d.tier.name !== 'Leading')
    .sort((a, b) => a.score - b.score);

  // Strategic priorities - gaps in high-weight dimensions
  const strategicPriorities = opportunityDimensions
    .flatMap(d => d.gaps.map((g: any) => ({ ...g, dimNum: d.dim, dimName: d.name, weight: d.weight, recommendations: d.recommendations })))
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 8);

  // In-progress items worth highlighting
  const inProgressItems = dimensionAnalysis
    .flatMap(d => [...d.planning.map((p: any) => ({ ...p, dimNum: d.dim, dimName: d.name, type: 'Planning' })),
                   ...d.assessing.map((a: any) => ({ ...a, dimNum: d.dim, dimName: d.name, type: 'Assessing' }))])
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-100">
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Action Bar */}
      <div className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/admin/scoring')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Scoring
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <div ref={printRef} className="max-w-4xl mx-auto py-10 px-8">
        
        {/* ============ HEADER ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-10 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="bg-white rounded-lg p-4">
                  <Image 
                    src="/best-companies-2026-logo.png" 
                    alt="Best Companies 2026" 
                    width={120} 
                    height={120}
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium tracking-wider uppercase">Performance Assessment</p>
                  <h1 className="text-2xl font-semibold text-white mt-1">Best Companies for Working with Cancer</h1>
                  <p className="text-slate-300 mt-1">Index 2026</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Report Date</p>
                <p className="text-white font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className="px-10 py-8 border-b border-slate-100">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Prepared for</p>
                <h2 className="text-3xl font-bold text-slate-900 mt-1">{companyName}</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-slate-500 text-sm">Composite Score</p>
                  <p className="text-5xl font-bold mt-1" style={{ color: tier?.color || '#666' }}>
                    {compositeScore ?? '—'}
                  </p>
                </div>
                {tier && (
                  <div className={`px-5 py-3 rounded-lg ${tier.bgColor} border ${tier.borderColor}`}>
                    <p className="text-lg font-bold" style={{ color: tier.color }}>{tier.name}</p>
                    <p className="text-xs text-slate-500">Performance Tier</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="px-10 py-8 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Executive Summary</h3>
            <p className="text-slate-700 leading-relaxed text-lg">
              {companyName} demonstrates <strong className="font-semibold" style={{ color: tier?.color }}>{tier?.name?.toLowerCase()}</strong> performance 
              in supporting employees managing cancer, with a composite score of <strong>{compositeScore}</strong>
              {benchmarks?.compositeScore && (
                compositeScore && compositeScore >= benchmarks.compositeScore 
                  ? <span className="text-emerald-600"> ({compositeScore - benchmarks.compositeScore} points above benchmark)</span>
                  : <span className="text-amber-600"> ({benchmarks.compositeScore - (compositeScore || 0)} points below benchmark)</span>
              )}.
            </p>
            
            <div className="mt-6 flex items-center gap-8">
              <div className="flex items-center gap-3">
                {tierCounts.exemplary + tierCounts.leading > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-emerald-600">{tierCounts.exemplary + tierCounts.leading}</span>
                    <span className="text-sm text-slate-500">dimensions at<br/>Leading or above</span>
                  </div>
                )}
              </div>
              <div className="h-10 w-px bg-slate-200"></div>
              <div className="flex items-center gap-3">
                {tierCounts.progressing + tierCounts.emerging + tierCounts.developing > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-amber-600">{tierCounts.progressing + tierCounts.emerging + tierCounts.developing}</span>
                    <span className="text-sm text-slate-500">dimensions with<br/>growth opportunity</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============ SCORE COMPONENTS ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Score Composition</h3>
          </div>
          <div className="px-10 py-6">
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Composite', score: compositeScore, weight: '100%', benchmark: benchmarks?.compositeScore },
                { label: 'Dimension Score', score: weightedDimScore, weight: '90%', benchmark: benchmarks?.weightedDimScore },
                { label: 'Program Maturity', score: maturityScore, weight: '5%', benchmark: benchmarks?.maturityScore },
                { label: 'Support Breadth', score: breadthScore, weight: '5%', benchmark: benchmarks?.breadthScore },
              ].map((item, idx) => {
                const itemTier = item.score !== null && item.score !== undefined ? getTier(item.score) : null;
                return (
                  <div key={idx} className="text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: item.score ? getScoreColor(item.score) : '#94a3b8' }}>
                      {item.score ?? '—'}
                    </p>
                    {itemTier && (
                      <p className="text-xs font-medium mt-1" style={{ color: itemTier.color }}>{itemTier.name}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">({item.weight} weight)</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============ DIMENSION PERFORMANCE ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Dimension Performance Overview</h3>
            <p className="text-sm text-slate-500 mt-1">Assessment across 13 support dimensions</p>
          </div>
          <div className="px-10 py-6">
            <div className="space-y-3">
              {dimensionAnalysis.map((d) => (
                <div key={d.dim} className="flex items-center gap-4">
                  <div className="w-6 text-right">
                    <span className="text-xs font-medium text-slate-400">D{d.dim}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{d.name}</p>
                  </div>
                  <div className="w-32">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(d.score, 100)}%`, backgroundColor: getScoreColor(d.score) }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-sm font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                  </div>
                  <div className="w-20">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${d.tier.bgColor} ${d.tier.textColor}`}>
                      {d.tier.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============ STRENGTHS & OPPORTUNITIES ============ */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
              <h3 className="font-semibold text-emerald-800">Areas of Excellence</h3>
              <p className="text-sm text-emerald-600 mt-0.5">{strengthDimensions.length} dimensions performing at Leading or above</p>
            </div>
            <div className="p-6">
              {strengthDimensions.length > 0 ? (
                <div className="space-y-5">
                  {strengthDimensions.slice(0, 5).map((d) => (
                    <div key={d.dim}>
                      <p className="font-medium text-slate-800 text-sm">{d.name}</p>
                      {d.strengths.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {d.strengths.slice(0, 3).map((e: any, i: number) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">✓</span>
                              <span className="line-clamp-1">{e.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No dimensions at Leading or Exemplary level yet.</p>
              )}
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <h3 className="font-semibold text-amber-800">Growth Opportunities</h3>
              <p className="text-sm text-amber-600 mt-0.5">{opportunityDimensions.length} dimensions with improvement potential</p>
            </div>
            <div className="p-6">
              {opportunityDimensions.length > 0 ? (
                <div className="space-y-5">
                  {opportunityDimensions.slice(0, 5).map((d) => (
                    <div key={d.dim}>
                      <p className="font-medium text-slate-800 text-sm">{d.name}</p>
                      {(d.gaps.length > 0 || d.unsure.length > 0) && (
                        <ul className="mt-2 space-y-1">
                          {[...d.gaps, ...d.unsure].slice(0, 3).map((e: any, i: number) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">○</span>
                              <span className="line-clamp-1">{e.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-600 text-sm">Excellent! All dimensions at Leading or above.</p>
              )}
            </div>
          </div>
        </div>

        {/* ============ IN PROGRESS ============ */}
        {inProgressItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-10 py-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Initiatives in Progress</h3>
              <p className="text-sm text-slate-500 mt-1">Programs currently in planning or under consideration</p>
            </div>
            <div className="px-10 py-6">
              <div className="grid grid-cols-2 gap-4">
                {inProgressItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${item.type === 'Planning' ? 'bg-blue-200 text-blue-700' : 'bg-sky-200 text-sky-700'}`}>
                      {item.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 line-clamp-2">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">D{item.dimNum}: {item.dimName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ STRATEGIC RECOMMENDATIONS ============ */}
        {strategicPriorities.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 print-break">
            <div className="px-10 py-5 border-b border-slate-100 bg-slate-800">
              <h3 className="font-semibold text-white">Strategic Recommendations</h3>
              <p className="text-sm text-slate-300 mt-1">Priority actions to enhance the employee experience</p>
            </div>
            <div className="px-10 py-6">
              <p className="text-slate-600 mb-6">
                The following recommendations focus on high-impact opportunities to strengthen support for employees 
                managing cancer diagnoses. Prioritization reflects both the potential to improve overall assessment 
                performance and the direct impact on employee wellbeing.
              </p>
              
              <div className="space-y-6">
                {/* Group by dimension for cleaner presentation */}
                {opportunityDimensions.slice(0, 4).map((d, idx) => (
                  <div key={d.dim} className="border-l-4 border-slate-300 pl-6 py-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{idx + 1}. {d.name}</p>
                        <p className="text-sm text-slate-500 mt-1 italic">{d.recommendations?.focus}</p>
                      </div>
                      <span className="text-xs text-slate-400">Weight: {d.weight}%</span>
                    </div>
                    
                    {d.gaps.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Key Gaps to Address</p>
                        <ul className="space-y-1">
                          {d.gaps.slice(0, 3).map((g: any, i: number) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-slate-400">•</span>
                              <span>{g.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {d.recommendations?.actions && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Suggested Actions</p>
                        <ul className="space-y-1">
                          {d.recommendations.actions.slice(0, 2).map((action: string, i: number) => (
                            <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                              <span className="text-emerald-500">→</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ FOOTER ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-10 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Image 
                  src="/cancer-careers-logo.png" 
                  alt="Cancer and Careers" 
                  width={140} 
                  height={45}
                  className="object-contain"
                />
                <div className="border-l border-slate-200 pl-6">
                  <p className="text-sm font-medium text-slate-700">Best Companies for Working with Cancer Index</p>
                  <p className="text-xs text-slate-400">© 2026 Cancer and Careers. All rights reserved.</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Survey ID: {surveyId}</p>
                <p className="text-xs text-slate-400">Confidential</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

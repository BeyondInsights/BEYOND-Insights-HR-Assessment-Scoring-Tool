'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  SCORING_CONFIG,
  calculateCompanyScores, 
  statusToPoints, 
  getStatusText,
  getGeoMultiplier,
  calculateFollowUpScore,
  calculateMaturityScore,
  calculateBreadthScore,
  getPerformanceTier,
  DEFAULT_DIMENSION_WEIGHTS,
  DEFAULT_COMPOSITE_WEIGHTS,
  DEFAULT_BLEND_WEIGHTS,
  DIMENSION_NAMES
} from '@/lib/scoring-config';
import Image from 'next/image';

// Print styles for page numbers
const printStyles = `
  @media print {
    @page {
      margin: 0.75in;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 10px;
        color: #64748b;
      }
    }
    .print-break { page-break-before: always; }
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

// ============================================
// CONSTANTS
// ============================================

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

const DIMENSION_QUESTION_COUNTS: Record<number, number> = {
  1: 9, 2: 12, 3: 8, 4: 13, 5: 11, 6: 7, 7: 5, 8: 10, 9: 5, 10: 7, 11: 3, 12: 7, 13: 7
};

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function getTier(score: number): { name: string; color: string; bgColor: string; textColor: string; borderColor: string } {
  const tier = getPerformanceTier(score);
  const tierMap: Record<string, { textColor: string; borderColor: string; bgColor: string }> = {
    'Exemplary': { textColor: 'text-emerald-800', borderColor: 'border-emerald-300', bgColor: 'bg-emerald-100' },
    'Leading': { textColor: 'text-blue-800', borderColor: 'border-blue-300', bgColor: 'bg-blue-100' },
    'Progressing': { textColor: 'text-amber-800', borderColor: 'border-amber-300', bgColor: 'bg-amber-100' },
    'Emerging': { textColor: 'text-orange-800', borderColor: 'border-orange-300', bgColor: 'bg-orange-100' },
    'Developing': { textColor: 'text-gray-700', borderColor: 'border-gray-300', bgColor: 'bg-gray-100' },
  };
  const baseName = tier.name.replace('*', '');
  const extra = tierMap[baseName] || tierMap['Developing'];
  return {
    name: tier.name,
    color: tier.color,
    bgColor: extra.bgColor,
    textColor: extra.textColor,
    borderColor: extra.borderColor,
  };
}

function getScoreColor(score: number): string {
  // Match scoring page getScoreColor exactly
  if (score >= 80) return '#059669';  // emerald
  if (score >= 60) return '#0284C7';  // sky
  if (score >= 40) return '#D97706';  // amber
  return '#DC2626';  // red
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
  const [percentileRank, setPercentileRank] = useState<number | null>(null);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);

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
          
          // Calculate percentile ranking - same filter as benchmarks
          const completeAssessments = allAssessments.filter(a => {
            let completedDims = 0;
            for (let dim = 1; dim <= 13; dim++) {
              const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
              if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) {
                completedDims++;
              }
            }
            return completedDims === 13;
          });
          
          const allComposites = completeAssessments
            .map(a => {
              try {
                const { scores: s } = calculateCompanyScores(a);
                return s.compositeScore;
              } catch { return null; }
            })
            .filter(s => s !== null && s !== undefined) as number[];
          
          if (allComposites.length > 0 && scores.compositeScore) {
            const belowCount = allComposites.filter(s => s < scores.compositeScore).length;
            const percentile = Math.round((belowCount / allComposites.length) * 100);
            setPercentileRank(percentile);
            setTotalCompanies(allComposites.length);
          }
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
    // EXACT MATCH to scoring page calculateCompanyScores
    const dimensionScores: Record<number, number | null> = {};
    const followUpScores: Record<number, number | null> = {};
    const elementsByDim: Record<number, any[]> = {};
    const blendedScores: Record<number, number> = {};
    
    // Use shared config blend weights
    const blendWeights = SCORING_CONFIG.blendWeights;
    
    let completedDimCount = 0;
    
    // First pass: calculate all dimension scores
    for (let dim = 1; dim <= 13; dim++) {
      const dimData = assessment[`dimension${dim}_data`];
      const mainGrid = dimData?.[`d${dim}a`];
      
      elementsByDim[dim] = [];
      blendedScores[dim] = 0;
      
      if (!mainGrid || typeof mainGrid !== 'object') {
        dimensionScores[dim] = null;
        continue;
      }
      
      let earnedPoints = 0;
      let totalItems = 0;
      let answeredItems = 0;
      let unsureCount = 0;
      
      Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
        totalItems++;
        const result = statusToPoints(status);
        
        if (result.isUnsure) {
          unsureCount++;
          answeredItems++;
        } else if (result.points !== null) {
          answeredItems++;
          earnedPoints += result.points;
        }
        
        elementsByDim[dim].push({
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
      });
      
      if (totalItems > 0) completedDimCount++;
      
      const maxPoints = answeredItems * 5;
      const rawScore = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
      
      const geoResponse = dimData[`d${dim}aa`] || dimData[`D${dim}aa`];
      const geoMultiplier = getGeoMultiplier(geoResponse);
      const adjustedScore = Math.round(rawScore * geoMultiplier);
      
      // Apply blend for D1, D3, D12, D13
      let blendedScore = adjustedScore;
      if ([1, 3, 12, 13].includes(dim)) {
        const followUp = calculateFollowUpScore(dim, assessment);
        followUpScores[dim] = followUp;
        if (followUp !== null) {
          const key = `d${dim}` as keyof typeof blendWeights;
          const gridPct = blendWeights[key]?.grid ?? 85;
          const followUpPct = blendWeights[key]?.followUp ?? 15;
          blendedScore = Math.round((adjustedScore * (gridPct / 100)) + (followUp * (followUpPct / 100)));
        }
      }
      
      dimensionScores[dim] = blendedScore;
      blendedScores[dim] = blendedScore;
    }
    
    const isComplete = completedDimCount === 13;
    
    let weightedDimScore: number | null = null;
    
    if (isComplete) {
      // EXACT scoring page formula: sum all weights first, then divide
      const totalWeight = Object.values(DEFAULT_DIMENSION_WEIGHTS).reduce((sum, w) => sum + w, 0);
      let weightedScore = 0;
      
      if (totalWeight > 0) {
        for (let i = 1; i <= 13; i++) {
          const weight = DEFAULT_DIMENSION_WEIGHTS[i] || 0;
          weightedScore += blendedScores[i] * (weight / totalWeight);
        }
      }
      weightedDimScore = Math.round(weightedScore);
    }
    
    const maturityScore = calculateMaturityScore(assessment);
    const breadthScore = calculateBreadthScore(assessment);
    
    // Use shared config weights
    const { weightedDim, maturity, breadth } = SCORING_CONFIG.compositeWeights;
    const compositeScore = isComplete && weightedDimScore !== null
      ? Math.round(
          (weightedDimScore * (weightedDim / 100)) +
          (maturityScore * (maturity / 100)) +
          (breadthScore * (breadth / 100))
        )
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
    // Filter for COMPLETE assessments - must have items in ALL 13 dimensions
    // This matches the scoring page's isComplete = completedDimCount === 13
    // where a dimension is counted if totalItems > 0
    const complete = assessments.filter(a => {
      let completedDims = 0;
      for (let dim = 1; dim <= 13; dim++) {
        const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
        // Must be a non-empty object (has at least one item)
        if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) {
          completedDims++;
        }
      }
      return completedDims === 13;
    });
    
    if (complete.length === 0) return null;
    
    const allScores = complete.map(a => {
      try {
        return calculateCompanyScores(a).scores;
      } catch {
        return null;
      }
    }).filter(s => s !== null);
    
    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter(v => v !== null && v !== undefined && !isNaN(v as number)) as number[];
      return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
    };
    
    const dimensionBenchmarks: Record<number, number | null> = {};
    for (let dim = 1; dim <= 13; dim++) {
      dimensionBenchmarks[dim] = avg(allScores.map(s => s?.dimensionScores?.[dim]));
    }
    
    return {
      compositeScore: avg(allScores.map(s => s?.compositeScore)),
      weightedDimScore: avg(allScores.map(s => s?.weightedDimScore)),
      maturityScore: avg(allScores.map(s => s?.maturityScore)),
      breadthScore: avg(allScores.map(s => s?.breadthScore)),
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
  // Check multiple possible locations for contact info
  const firmographics = company.firmographics_data || {};
  
  // The firmographics uses firstName and lastName (not contact_name)
  const firstName = firmographics.firstName || '';
  const lastName = firmographics.lastName || '';
  const contactName = firstName && lastName 
    ? `${firstName} ${lastName}` 
    : (company.contact_name || firmographics.contact_name || '');
    
  // Email might be stored at top level or in firmographics
  const contactEmail = company.contact_email 
    || company.email
    || firmographics.email
    || firmographics.contact_email 
    || '';
  
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

  // Even in strong dimensions, find lowest scoring elements for improvement
  const improvementOppsInStrengths = strengthDimensions
    .flatMap(d => d.elements
      .filter((e: any) => !e.isStrength && !e.isUnsure)
      .map((e: any) => ({ ...e, dimNum: d.dim, dimName: d.name })))
    .slice(0, 4);

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
          @page {
            margin: 0.75in;
            size: letter;
          }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          
          /* Page numbers via CSS counters */
          .print-page-numbers {
            position: fixed;
            bottom: 0.5in;
            right: 0.75in;
            font-size: 10px;
            color: #64748b;
          }
        }
      `}</style>

      {/* Action Bar */}
      <div className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
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

      <div ref={printRef} className="max-w-6xl mx-auto py-10 px-8">
        
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
                {(contactName || contactEmail) && (
                  <div className="mt-2 text-sm text-slate-500">
                    {contactName && <span className="font-medium text-slate-600">{contactName}</span>}
                    {contactName && contactEmail && <span className="mx-2">•</span>}
                    {contactEmail && <span>{contactEmail}</span>}
                  </div>
                )}
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
            
            <div className="mt-6 flex items-center gap-12">
              {tierCounts.exemplary + tierCounts.leading > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-emerald-600">{tierCounts.exemplary + tierCounts.leading}</span>
                  <span className="text-sm text-slate-500">dimensions at<br/>Leading or above</span>
                </div>
              )}
              {tierCounts.exemplary + tierCounts.leading > 0 && (tierCounts.progressing + tierCounts.emerging + tierCounts.developing > 0 || percentileRank !== null) && (
                <div className="h-10 w-px bg-slate-200"></div>
              )}
              {tierCounts.progressing + tierCounts.emerging + tierCounts.developing > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-amber-600">{tierCounts.progressing + tierCounts.emerging + tierCounts.developing}</span>
                  <span className="text-sm text-slate-500">dimensions with<br/>growth opportunity</span>
                </div>
              )}
              {percentileRank !== null && (
                <>
                  {(tierCounts.progressing + tierCounts.emerging + tierCounts.developing > 0 || tierCounts.exemplary + tierCounts.leading > 0) && (
                    <div className="h-10 w-px bg-slate-200"></div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-purple-600">{percentileRank}<sup className="text-lg">th</sup></span>
                    <span className="text-sm text-slate-500">percentile<br/>of {totalCompanies} companies</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ============ AT A GLANCE - KEY FINDINGS ============ */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="px-10 py-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Key Findings at a Glance</h3>
            <div className="grid grid-cols-4 gap-6">
              {/* Strongest Area */}
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider mb-2">Strongest Area</p>
                <p className="text-white font-semibold">{dimensionAnalysis[0]?.name || 'N/A'}</p>
                <p className="text-emerald-300 text-sm mt-1">
                  Score: {dimensionAnalysis[0]?.score} 
                  {dimensionAnalysis[0]?.benchmark && ` (+${dimensionAnalysis[0].score - dimensionAnalysis[0].benchmark} vs benchmark)`}
                </p>
              </div>
              
              {/* Largest Gap */}
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-amber-300 font-medium uppercase tracking-wider mb-2">Priority Focus</p>
                <p className="text-white font-semibold">{dimensionAnalysis[dimensionAnalysis.length - 1]?.name || 'N/A'}</p>
                <p className="text-amber-300 text-sm mt-1">
                  Score: {dimensionAnalysis[dimensionAnalysis.length - 1]?.score}
                  {dimensionAnalysis[dimensionAnalysis.length - 1]?.benchmark && 
                    ` (${dimensionAnalysis[dimensionAnalysis.length - 1].score - dimensionAnalysis[dimensionAnalysis.length - 1].benchmark} vs benchmark)`}
                </p>
              </div>
              
              {/* Above/Below Benchmark */}
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-sky-300 font-medium uppercase tracking-wider mb-2">Benchmark Position</p>
                <p className="text-white font-semibold">
                  {dimensionAnalysis.filter(d => d.score >= d.benchmark).length} of 13 dimensions
                </p>
                <p className="text-sky-300 text-sm mt-1">above benchmark average</p>
              </div>
              
              {/* Quick Win */}
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-purple-300 font-medium uppercase tracking-wider mb-2">Momentum</p>
                <p className="text-white font-semibold">{inProgressItems.length} initiatives</p>
                <p className="text-purple-300 text-sm mt-1">currently in planning or assessment</p>
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
                { label: 'Overall Composite', score: compositeScore, weight: '100%', benchmark: benchmarks?.compositeScore },
                { label: 'Weighted Dimension Score', score: weightedDimScore, weight: `${SCORING_CONFIG.compositeWeights.weightedDim}%`, benchmark: benchmarks?.weightedDimScore },
                { label: 'Program Maturity', score: maturityScore, weight: `${SCORING_CONFIG.compositeWeights.maturity}%`, benchmark: benchmarks?.maturityScore },
                { label: 'Support Breadth', score: breadthScore, weight: `${SCORING_CONFIG.compositeWeights.breadth}%`, benchmark: benchmarks?.breadthScore },
              ].map((item, idx) => {
                const itemTier = item.score !== null && item.score !== undefined ? getTier(item.score) : null;
                const diff = item.score && item.benchmark ? item.score - item.benchmark : null;
                return (
                  <div key={idx} className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{item.label}</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: item.score ? getScoreColor(item.score) : '#94a3b8' }}>
                      {item.score ?? '—'}
                    </p>
                    {itemTier && (
                      <p className="text-xs font-medium mt-1" style={{ color: itemTier.color }}>{itemTier.name}</p>
                    )}
                    {item.benchmark !== null && item.benchmark !== undefined && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-400">
                          Benchmark: <span className="font-medium text-slate-600">{item.benchmark}</span>
                          {diff !== null && (
                            <span className={`ml-1 ${diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              ({diff >= 0 ? '+' : ''}{diff})
                            </span>
                          )}
                        </p>
                      </div>
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
            <p className="text-sm text-slate-500 mt-1">Assessment across 13 support dimensions (sorted by score)</p>
          </div>
          <div className="px-10 py-6">
            {/* Header row */}
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
              <div className="w-8"></div>
              <div className="w-64">Dimension</div>
              <div className="flex-1 text-center">Performance</div>
              <div className="w-14 text-right">Score</div>
              <div className="w-20 text-center">Bench</div>
              <div className="w-20 text-center">Tier</div>
            </div>
            <div className="space-y-3">
              {dimensionAnalysis.map((d) => {
                const diff = d.score - d.benchmark;
                return (
                  <div key={d.dim} className="flex items-center gap-3">
                    <div className="w-8 text-right">
                      <span className="text-xs font-medium text-slate-400">D{d.dim}</span>
                    </div>
                    <div className="w-64">
                      <p className="text-sm text-slate-700">{d.name}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-100 rounded-full overflow-visible relative">
                        {/* Score bar */}
                        <div 
                          className="h-full rounded-full relative"
                          style={{ width: `${Math.min(d.score, 100)}%`, backgroundColor: getScoreColor(d.score) }}
                        />
                        {/* Benchmark marker - triangle indicator */}
                        <div 
                          className="absolute -top-1 flex flex-col items-center"
                          style={{ left: `${Math.min(d.benchmark, 100)}%`, transform: 'translateX(-50%)' }}
                        >
                          <div 
                            className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-14 text-right">
                      <span className="text-sm font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                    </div>
                    <div className="w-20 text-center">
                      <span className="text-xs text-slate-500">{d.benchmark}</span>
                      <span className={`text-xs ml-1 ${diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        ({diff >= 0 ? '+' : ''}{diff})
                      </span>
                    </div>
                    <div className="w-20 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${d.tier.bgColor} ${d.tier.textColor}`}>
                        {d.tier.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-4 text-xs text-slate-400">
              <span>Scores out of 100</span>
              <span className="flex items-center gap-1">
                <span className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-500 inline-block"></span>
                Benchmark
              </span>
            </div>
          </div>
        </div>

        {/* ============ STRATEGIC PRIORITY MATRIX ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Strategic Priority Matrix</h3>
            <p className="text-sm text-slate-500 mt-1">Dimensions plotted by current performance vs. strategic weight</p>
          </div>
          <div className="px-10 py-6">
            {/* Container with space for axis labels */}
            <div className="flex">
              {/* Y-axis label */}
              <div className="flex flex-col items-center justify-center w-12 mr-2">
                <span className="text-[10px] text-slate-400 font-medium">High</span>
                <div className="flex-1 flex items-center">
                  <span className="-rotate-90 whitespace-nowrap text-xs font-semibold text-slate-500 tracking-wide">
                    STRATEGIC WEIGHT
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Low</span>
              </div>
              
              {/* Main chart area */}
              <div className="flex-1">
                <div className="relative" style={{ height: '340px' }}>
                  {/* Quadrant backgrounds with gradient effects */}
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-lg overflow-hidden border border-slate-200">
                    {/* DEVELOP - High weight, Low score */}
                    <div className="bg-gradient-to-br from-amber-100 to-amber-50 border-r border-b border-slate-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-lg font-bold text-amber-600/40">DEVELOP</span>
                          <p className="text-[10px] text-amber-600/40 mt-1">High Priority</p>
                        </div>
                      </div>
                    </div>
                    {/* MAINTAIN - High weight, High score */}
                    <div className="bg-gradient-to-bl from-emerald-100 to-emerald-50 border-b border-slate-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-lg font-bold text-emerald-600/40">MAINTAIN</span>
                          <p className="text-[10px] text-emerald-600/40 mt-1">Protect Strengths</p>
                        </div>
                      </div>
                    </div>
                    {/* MONITOR - Low weight, Low score */}
                    <div className="bg-gradient-to-tr from-slate-100 to-slate-50 border-r border-slate-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-lg font-bold text-slate-400/50">MONITOR</span>
                          <p className="text-[10px] text-slate-400/50 mt-1">Watch & Wait</p>
                        </div>
                      </div>
                    </div>
                    {/* LEVERAGE - Low weight, High score */}
                    <div className="bg-gradient-to-tl from-sky-100 to-sky-50 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-lg font-bold text-sky-600/40">LEVERAGE</span>
                          <p className="text-[10px] text-sky-600/40 mt-1">Quick Wins</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Center crosshairs */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300" style={{ boxShadow: '0 0 4px rgba(0,0,0,0.1)' }}></div>
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300" style={{ boxShadow: '0 0 4px rgba(0,0,0,0.1)' }}></div>
                  
                  {/* Plot dimensions */}
                  {dimensionAnalysis.map((d) => {
                    // X position based on score (0-100 mapped to 5-95% to keep dots in view)
                    const xPos = 5 + (d.score / 100) * 90;
                    // Y position based on weight (inverted, higher weight = higher on chart)
                    const maxWeight = Math.max(...dimensionAnalysis.map(dim => dim.weight));
                    const minWeight = Math.min(...dimensionAnalysis.map(dim => dim.weight));
                    const weightRange = maxWeight - minWeight || 1;
                    const yPos = 92 - (((d.weight - minWeight) / weightRange) * 84);
                    
                    return (
                      <div
                        key={d.dim}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
                        style={{ left: `${xPos}%`, top: `${yPos}%` }}
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg cursor-pointer transition-all duration-200 hover:scale-125 hover:shadow-xl border-2 border-white"
                          style={{ backgroundColor: getScoreColor(d.score) }}
                        >
                          {d.dim}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                          <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                            <p className="font-semibold">{d.name}</p>
                            <p className="text-slate-300 mt-1">Score: {d.score} • Weight: {d.weight}%</p>
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* X-axis labels */}
                <div className="flex justify-between items-center mt-3 px-2">
                  <span className="text-[10px] text-slate-400 font-medium">0</span>
                  <span className="text-xs font-semibold text-slate-500 tracking-wide">CURRENT SCORE</span>
                  <span className="text-[10px] text-slate-400 font-medium">100</span>
                </div>
              </div>
            </div>
            
            {/* Legend - 2 rows, compact */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="grid grid-cols-7 gap-2 text-xs">
                {dimensionAnalysis.map(d => (
                  <div key={d.dim} className="flex items-center gap-1.5">
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0"
                      style={{ backgroundColor: getScoreColor(d.score) }}
                    >
                      {d.dim}
                    </span>
                    <span className="text-slate-600 truncate text-[11px]">{d.name.split('&')[0].trim()}</span>
                  </div>
                ))}
              </div>
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
                  {strengthDimensions.slice(0, 4).map((d) => (
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
                  
                  {/* Items to still enhance in strong dimensions */}
                  {improvementOppsInStrengths.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Still to enhance</p>
                      <ul className="space-y-1">
                        {improvementOppsInStrengths.slice(0, 3).map((e: any, i: number) => (
                          <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                            <span className="text-slate-400 mt-0.5">◦</span>
                            <span className="line-clamp-1">{e.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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

        {/* ============ ACTION ROADMAP - DYNAMIC ============ */}
        {opportunityDimensions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-10 py-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Suggested Action Roadmap</h3>
              <p className="text-sm text-slate-500 mt-1">Phased approach based on your assessment results</p>
            </div>
            <div className="px-10 py-6">
              {(() => {
                // DYNAMIC ROADMAP GENERATION based on actual company data
                
                // Phase 1: Quick Wins - Items in "Assessing" status (close to implementation)
                // Plus easy wins from low-weight dimensions
                const assessingItems = dimensionAnalysis
                  .flatMap(d => d.assessing.map((item: any) => ({
                    text: item.name,
                    dimNum: d.dim,
                    dimName: d.name.split('&')[0].trim()
                  })))
                  .slice(0, 3);
                
                // Add items from lower-weight opportunity dimensions if we need more
                const lowWeightGaps = opportunityDimensions
                  .filter(d => d.weight <= 7)
                  .flatMap(d => d.gaps.slice(0, 1).map((g: any) => ({
                    text: g.name,
                    dimNum: d.dim,
                    dimName: d.name.split('&')[0].trim()
                  })))
                  .slice(0, 3 - assessingItems.length);
                
                const quickWins = [...assessingItems, ...lowWeightGaps].slice(0, 3);
                
                // Phase 2: Foundation - Gaps in HIGH-WEIGHT opportunity dimensions
                const highWeightGaps = opportunityDimensions
                  .filter(d => d.weight >= 10)
                  .flatMap(d => d.gaps.slice(0, 2).map((g: any) => ({
                    text: g.name,
                    dimNum: d.dim,
                    dimName: d.name.split('&')[0].trim(),
                    weight: d.weight
                  })))
                  .sort((a, b) => b.weight - a.weight)
                  .slice(0, 3);
                
                // Phase 3: Excellence - Improvements in STRONG dimensions (move from good to great)
                // Or items in "Planning" status that need continued investment
                const planningItems = dimensionAnalysis
                  .flatMap(d => d.planning.map((item: any) => ({
                    text: item.name,
                    dimNum: d.dim,
                    dimName: d.name.split('&')[0].trim()
                  })))
                  .slice(0, 2);
                
                const strengthImprovements = strengthDimensions
                  .flatMap(d => {
                    const nonStrengthItems = d.elements
                      .filter((e: any) => !e.isStrength && !e.isUnsure && e.category !== 'currently_offer')
                      .slice(0, 1);
                    return nonStrengthItems.map((e: any) => ({
                      text: e.name,
                      dimNum: d.dim,
                      dimName: d.name.split('&')[0].trim()
                    }));
                  })
                  .slice(0, 3 - planningItems.length);
                
                const excellence = [...planningItems, ...strengthImprovements].slice(0, 3);
                
                return (
                  <div className="grid grid-cols-3 gap-6">
                    {/* Phase 1: Quick Wins */}
                    <div className="relative">
                      <div className="absolute -left-3 top-0 bottom-0 w-1 bg-emerald-400 rounded-full"></div>
                      <div className="bg-emerald-50 rounded-lg p-5 border border-emerald-100 h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">1</span>
                          <h4 className="font-semibold text-emerald-800 text-sm">Quick Wins</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Low effort, high visibility</p>
                        {quickWins.length > 0 ? (
                          <ul className="space-y-2 text-xs text-slate-600">
                            {quickWins.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5 flex-shrink-0">●</span>
                                <span className="line-clamp-2">{item.text}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No immediate quick wins identified</p>
                        )}
                        {quickWins.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-emerald-100">
                            Focus: {[...new Set(quickWins.map(q => `D${q.dimNum}`))].join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Phase 2: Foundation Building */}
                    <div className="relative">
                      <div className="absolute -left-3 top-0 bottom-0 w-1 bg-sky-400 rounded-full"></div>
                      <div className="bg-sky-50 rounded-lg p-5 border border-sky-100 h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">2</span>
                          <h4 className="font-semibold text-sky-800 text-sm">Foundation Building</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">High-impact structural changes</p>
                        {highWeightGaps.length > 0 ? (
                          <ul className="space-y-2 text-xs text-slate-600">
                            {highWeightGaps.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-sky-500 mt-0.5 flex-shrink-0">●</span>
                                <span className="line-clamp-2">{item.text}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Strong foundation already in place</p>
                        )}
                        {highWeightGaps.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-sky-100">
                            Focus: {[...new Set(highWeightGaps.map(g => `D${g.dimNum}`))].join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Phase 3: Excellence */}
                    <div className="relative">
                      <div className="absolute -left-3 top-0 bottom-0 w-1 bg-purple-400 rounded-full"></div>
                      <div className="bg-purple-50 rounded-lg p-5 border border-purple-100 h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">3</span>
                          <h4 className="font-semibold text-purple-800 text-sm">Excellence & Culture</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Long-term transformation</p>
                        {excellence.length > 0 ? (
                          <ul className="space-y-2 text-xs text-slate-600">
                            {excellence.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-purple-500 mt-0.5 flex-shrink-0">●</span>
                                <span className="line-clamp-2">{item.text}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Continue current excellence initiatives</p>
                        )}
                        {excellence.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-purple-100">
                            Focus: {[...new Set(excellence.map(e => `D${e.dimNum}`))].join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Progress connector */}
              <div className="flex items-center justify-center mt-6 gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <div className="h-px w-16 bg-slate-200"></div>
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <div className="h-px w-16 bg-slate-200"></div>
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              </div>
            </div>
          </div>
        )}

        {/* ============ HOW CAC CAN HELP ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 print-break">
          <div className="px-10 py-6 bg-gradient-to-r from-purple-700 to-purple-600">
            <h3 className="font-semibold text-white text-lg">How Cancer and Careers Can Help</h3>
            <p className="text-purple-200 text-sm mt-1">Tailored support to enhance the employee experience</p>
          </div>
          <div className="px-10 py-6">
            <p className="text-slate-600 mb-6 leading-relaxed">
              Every organization enters this work from a different place. Cancer and Careers' consulting practice 
              helps organizations understand where they are, identify where they want to be, and build a realistic 
              path to get there—shaped by two decades of frontline experience with employees navigating cancer 
              and the HR teams supporting them.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Manager Training */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 text-sm mb-2">Manager Preparedness & Training</h4>
                <p className="text-xs text-slate-600 mb-2">76% of employees go to their manager first at disclosure—yet only 48% believe their manager has received training.</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Live training sessions with case studies</li>
                  <li>• Manager toolkit & conversation guides</li>
                  <li>• Train-the-trainer programs</li>
                </ul>
              </div>
              
              {/* Navigation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 text-sm mb-2">Navigation & Resource Architecture</h4>
                <p className="text-xs text-slate-600 mb-2">Only 34% of employees know where to find resources. Programs exist but can be difficult to access when needed most.</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Resource audit & gap analysis</li>
                  <li>• Single-entry-point design</li>
                  <li>• Communication strategy</li>
                </ul>
              </div>
              
              {/* Return to Work */}
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <h4 className="font-semibold text-rose-800 text-sm mb-2">Return-to-Work Excellence</h4>
                <p className="text-xs text-slate-600 mb-2">Support ratings drop from 54% during treatment to 22% after—the largest variance in the employee experience.</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Phased return protocols</li>
                  <li>• Check-in cadence design</li>
                  <li>• Career continuity planning</li>
                </ul>
              </div>
              
              {/* Policy Assessment */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-800 text-sm mb-2">Policy & Program Assessment</h4>
                <p className="text-xs text-slate-600 mb-2">Many organizations have policies that look comprehensive on paper but fall short in practice.</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Comprehensive policy review</li>
                  <li>• Implementation audit</li>
                  <li>• Business case development</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Ready to take the next step?</p>
                  <p className="text-xs text-slate-500 mt-1">Contact Cancer and Careers to discuss how we can support your organization's journey.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-700">cancerandcareers.org</p>
                  <p className="text-xs text-slate-500">cacbestcompanies@cew.org</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ METHODOLOGY ============ */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700 text-sm">Assessment Methodology</h3>
          </div>
          <div className="px-10 py-5">
            <div className="grid grid-cols-3 gap-6 text-xs text-slate-600">
              <div>
                <p className="font-medium text-slate-700 mb-2">Scoring Framework</p>
                <p className="leading-relaxed">
                  Organizations are assessed across 13 dimensions of workplace cancer support. Each dimension 
                  receives a weighted score based on current offerings, planned initiatives, and program maturity. 
                  The composite score combines dimension performance ({SCORING_CONFIG.compositeWeights.weightedDim}%), program maturity ({SCORING_CONFIG.compositeWeights.maturity}%), and support breadth ({SCORING_CONFIG.compositeWeights.breadth}%).
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-2">Benchmarking</p>
                <p className="leading-relaxed">
                  Benchmark scores represent the average performance across all {totalCompanies > 0 ? totalCompanies : 'assessed'} organizations 
                  in the Index. Percentile rankings indicate relative positioning within the cohort. 
                  Benchmarks are updated as new organizations complete assessments.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-2">Performance Tiers</p>
                <p className="leading-relaxed">
                  <span className="text-emerald-600 font-medium">Exemplary</span> (90+): Best-in-class performance<br/>
                  <span className="text-blue-600 font-medium">Leading</span> (75-89): Above average<br/>
                  <span className="text-amber-600 font-medium">Progressing</span> (60-74): Meeting expectations<br/>
                  <span className="text-orange-600 font-medium">Emerging</span> (40-59): Developing capabilities<br/>
                  <span className="text-slate-500 font-medium">Developing</span> (&lt;40): Early stage
                </p>
              </div>
            </div>
          </div>
        </div>

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

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
  if (typeof value === 'number') {
    if (value >= 1 && value <= 5) {
      const numericMap: Record<number, number> = { 5: 5, 4: 3, 3: 2, 2: 0, 1: 0 };
      return numericMap[value] ?? null;
    }
    return null;
  }
  const strValue = String(value);
  for (const [key, score] of Object.entries(GRID_RESPONSE_SCORES)) {
    if (strValue.toLowerCase().includes(key.toLowerCase())) return score;
  }
  return null;
}

function calculateDimensionGridScore(dimData: Record<string, any>, dimNum: number): { score: number; answered: number; total: number; unsureCount: number } | null {
  if (!dimData) return null;
  
  const expectedCount = DIMENSION_QUESTION_COUNTS[dimNum] || 10;
  let totalPoints = 0;
  let maxPoints = 0;
  let answeredCount = 0;
  let unsureCount = 0;
  
  const validKeys = Object.keys(dimData).filter(key => {
    if (key.startsWith('d') && key.includes('_')) return false;
    if (key.endsWith('_text') || key.endsWith('_other')) return false;
    if (['id', 'created_at', 'updated_at', 'survey_id', 'completed'].includes(key)) return false;
    return true;
  });

  for (const key of validKeys) {
    const value = dimData[key];
    const score = scoreGridResponse(value);
    
    if (score !== null) {
      answeredCount++;
      maxPoints += 5;
      totalPoints += score;
      
      const strValue = String(value).toLowerCase();
      if (strValue.includes('unsure') || value === 1 || value === '1') {
        unsureCount++;
      }
    }
  }
  
  if (answeredCount === 0 || maxPoints === 0) return null;
  
  const rawScore = (totalPoints / maxPoints) * 100;
  return {
    score: Math.round(rawScore),
    answered: answeredCount,
    total: expectedCount,
    unsureCount
  };
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
  const surveyId = params.surveyId as string;
  const printRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [companyScores, setCompanyScores] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Load company assessment
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('survey_id', surveyId)
          .single();
        
        if (assessmentError || !assessment) {
          setError('Company not found');
          setLoading(false);
          return;
        }
        
        // Load all assessments for benchmarks
        const { data: allAssessments } = await supabase
          .from('assessments')
          .select('*');
        
        // Calculate company scores
        const scores = calculateCompanyScores(assessment);
        setCompanyScores(scores);
        setCompany(assessment);
        
        // Calculate benchmarks from all assessments
        if (allAssessments) {
          const benchmarkScores = calculateBenchmarks(allAssessments);
          setBenchmarks(benchmarkScores);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load report data');
        setLoading(false);
      }
    }
    
    loadData();
  }, [surveyId]);

  function calculateCompanyScores(assessment: Record<string, any>) {
    const dimensionScores: Record<number, number | null> = {};
    let weightedSum = 0;
    let weightTotal = 0;
    
    for (let dim = 1; dim <= 13; dim++) {
      const dimData = assessment[`dimension${dim}_data`];
      const result = calculateDimensionGridScore(dimData, dim);
      dimensionScores[dim] = result?.score ?? null;
      
      if (result?.score !== null) {
        const weight = DEFAULT_DIMENSION_WEIGHTS[dim];
        weightedSum += result.score * weight;
        weightTotal += weight;
      }
    }
    
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
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-red-600 text-lg">{error || 'Unable to generate report'}</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            Go Back
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
                    src="/BestCo_Seal_2026_Color.png" 
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
                              {index}%
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
                            {d.index}%
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
                          {s.gap > 0 ? `${s.gap} points above benchmark` : 'At benchmark'} • Index: {s.index}%
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
                          {o.gap < 0 ? `${Math.abs(o.gap)} points below benchmark` : 'At benchmark'} • Index: {o.index}%
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

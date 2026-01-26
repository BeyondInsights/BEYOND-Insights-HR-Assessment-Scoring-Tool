'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { calculateEnhancedScore } from '@/lib/enhanced-scoring';

// Create Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// CONSTANTS (same as main report)
// ============================================

const DEFAULT_DIMENSION_WEIGHTS: Record<number, number> = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3,
};

const DEFAULT_COMPOSITE_WEIGHTS = { weightedDim: 90, maturity: 5, breadth: 5 };

const DEFAULT_BLEND_WEIGHTS = {
  d1: { grid: 85, followUp: 15 },
  d3: { grid: 85, followUp: 15 },
  d12: { grid: 85, followUp: 15 },
  d13: { grid: 85, followUp: 15 },
};

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
  12: 'Continuous Improvement',
  13: 'Communication & Awareness',
};

const DIMENSION_SHORT_NAMES: Record<number, string> = {
  1: 'Leave & Flexibility', 2: 'Insurance & Financial', 3: 'Manager Preparedness',
  4: 'Navigation', 5: 'Accommodations', 6: 'Culture', 7: 'Career Continuity',
  8: 'Work Continuation', 9: 'Executive Commitment', 10: 'Caregiver Support',
  11: 'Prevention & Wellness', 12: 'Continuous Improvement', 13: 'Communication',
};

const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };

const D10_EXCLUDED_ITEMS = ['Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'];

// ============================================
// PASSWORD PROTECTION COMPONENT
// ============================================

function PasswordScreen({ 
  onAuthenticate, 
  error 
}: { 
  onAuthenticate: (password: string) => void;
  error: string | null;
}) {
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    await onAuthenticate(password);
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with BI Logo */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center p-2">
              <Image 
                src="/BI_LOGO_FINAL.png" 
                alt="BEYOND Insights" 
                width={48} 
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BEYOND Insights</h1>
              <p className="text-slate-300 text-sm">Secure Report Access</p>
            </div>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Protected Report</h2>
            <p className="text-slate-500 mt-2">Enter the password to view this report</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-amber-50/50'
                }`}
                placeholder="••••••"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={checking || !password}
              className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Access Report'
              )}
            </button>
          </form>
          
          <p className="text-center text-xs text-slate-400 mt-6">
            Best Companies for Working with Cancer Index
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function InteractiveReportPage() {
  const params = useParams();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [companyScores, setCompanyScores] = useState<any>(null);
  const [elementDetails, setElementDetails] = useState<any>(null);
  const [percentileRank, setPercentileRank] = useState<number | null>(null);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);
  const [selectedDrillDownDim, setSelectedDrillDownDim] = useState<number | null>(null);
  const [elementBenchmarks, setElementBenchmarks] = useState<Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>>>({});
  
  const printRef = useRef<HTMLDivElement>(null);

  // Authenticate with password
  const handleAuthenticate = async (password: string) => {
    if (!company) {
      setPasswordError('Report not found');
      return;
    }
    
    if (password === company.public_password) {
      setAuthenticated(true);
      setPasswordError(null);
    } else {
      setPasswordError('Incorrect password');
    }
  };

  // Load company data by token
  useEffect(() => {
    async function loadData() {
      if (!token) {
        setError('Invalid report link');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch assessment by public token
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('public_token', token)
          .single();
        
        if (assessmentError || !assessment) {
          setError('Report not found or link has expired');
          setLoading(false);
          return;
        }
        
        setCompany(assessment);
        
        // Calculate scores using enhanced scoring
        const { scores, elements } = calculateCompanyScores(assessment);
        setCompanyScores(scores);
        setElementDetails(elements);
        
        // Fetch all assessments for benchmarking
        const { data: allAssessments } = await supabase.from('assessments').select('*');
        
        if (allAssessments) {
          const benchmarkScores = calculateBenchmarks(allAssessments);
          setBenchmarks(benchmarkScores);
          
          const elemBenchmarks = calculateElementBenchmarks(allAssessments);
          setElementBenchmarks(elemBenchmarks);
          
          // Calculate percentile rank
          const completeAssessments = allAssessments.filter(a => {
            let completedDims = 0;
            for (let dim = 1; dim <= 13; dim++) {
              const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
              if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) completedDims++;
            }
            return completedDims === 13;
          });
          
          const allComposites = completeAssessments.map(a => {
            try { return calculateCompanyScores(a).scores.compositeScore; } catch { return null; }
          }).filter(s => s !== null) as number[];
          
          if (allComposites.length > 0 && scores.compositeScore) {
            const belowCount = allComposites.filter(s => s < scores.compositeScore).length;
            setPercentileRank(Math.round((belowCount / allComposites.length) * 100));
            setTotalCompanies(allComposites.length);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading report:', err);
        setError('Error loading report');
        setLoading(false);
      }
    }
    
    loadData();
  }, [token]);

  // ============================================
  // SCORING FUNCTIONS (same as main report)
  // ============================================
  
  function statusToPoints(rawStatus: any): { points: number; category: string } {
    if (!rawStatus) return { points: POINTS.NOT_ABLE, category: 'not_able' };
    let status = String(rawStatus).toLowerCase().trim();
    if (status.includes('currently') || status === 'yes') return { points: POINTS.CURRENTLY_OFFER, category: 'currently_offer' };
    if (status.includes('planning')) return { points: POINTS.PLANNING, category: 'planning' };
    if (status.includes('assessing') || status.includes('evaluating')) return { points: POINTS.ASSESSING, category: 'assessing' };
    return { points: POINTS.NOT_ABLE, category: 'not_able' };
  }

  function calculateCompanyScores(assessment: any): { scores: any; elements: any } {
    const dimScores: Record<number, number> = {};
    const elements: Record<number, any[]> = {};
    
    for (let dim = 1; dim <= 13; dim++) {
      const dimData = assessment[`dimension${dim}_data`];
      const mainGrid = dimData?.[`d${dim}a`];
      
      if (!mainGrid || typeof mainGrid !== 'object') {
        dimScores[dim] = 0;
        elements[dim] = [];
        continue;
      }
      
      const items = Object.entries(mainGrid).filter(([key]) => {
        if (dim === 10 && D10_EXCLUDED_ITEMS.includes(key)) return false;
        return true;
      });
      
      if (items.length === 0) {
        dimScores[dim] = 0;
        elements[dim] = [];
        continue;
      }
      
      let total = 0;
      const elemList: any[] = [];
      
      items.forEach(([key, val]) => {
        const result = statusToPoints(val);
        total += result.points;
        elemList.push({
          name: key,
          status: val,
          points: result.points,
          isStrength: result.category === 'currently_offer',
          isPlanning: result.category === 'planning',
          isAssessing: result.category === 'assessing',
          isGap: result.category === 'not_able'
        });
      });
      
      const maxPoints = items.length * POINTS.CURRENTLY_OFFER;
      let gridScore = Math.round((total / maxPoints) * 100);
      
      // Apply blend weights for dimensions with follow-up
      const blendKey = `d${dim}` as keyof typeof DEFAULT_BLEND_WEIGHTS;
      if (DEFAULT_BLEND_WEIGHTS[blendKey]) {
        const blend = DEFAULT_BLEND_WEIGHTS[blendKey];
        gridScore = Math.round(gridScore * (blend.grid / 100));
      }
      
      dimScores[dim] = gridScore;
      elements[dim] = elemList;
    }
    
    // Calculate composite score
    let weightedSum = 0;
    let totalWeight = 0;
    for (let dim = 1; dim <= 13; dim++) {
      const weight = DEFAULT_DIMENSION_WEIGHTS[dim] || 0;
      weightedSum += dimScores[dim] * weight;
      totalWeight += weight;
    }
    const weightedDimScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    
    // Simplified composite (using weightedDim as main score)
    const compositeScore = weightedDimScore;
    
    return {
      scores: {
        compositeScore,
        weightedDimScore,
        maturityScore: 0,
        breadthScore: 0,
        dimensionScores: dimScores
      },
      elements
    };
  }

  function calculateBenchmarks(assessments: any[]) {
    const complete = assessments.filter(a => {
      let completedDims = 0;
      for (let dim = 1; dim <= 13; dim++) {
        const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
        if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) completedDims++;
      }
      return completedDims === 13;
    });
    
    if (complete.length === 0) return null;
    
    const allScores = complete.map(a => {
      try { return calculateCompanyScores(a).scores; } catch { return null; }
    }).filter(Boolean);
    
    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter((x): x is number => typeof x === 'number');
      return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
    };
    
    const dimensionBenchmarks: Record<number, number | null> = {};
    for (let dim = 1; dim <= 13; dim++) { 
      dimensionBenchmarks[dim] = avg(allScores.map(s => s?.dimensionScores?.[dim])); 
    }
    
    return { 
      compositeScore: avg(allScores.map(s => s?.compositeScore)), 
      dimensionScores: dimensionBenchmarks, 
      companyCount: complete.length 
    };
  }

  function calculateElementBenchmarks(assessments: any[]) {
    const complete = assessments.filter(a => {
      let completedDims = 0;
      for (let dim = 1; dim <= 13; dim++) {
        const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
        if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) completedDims++;
      }
      return completedDims === 13;
    });
    
    if (complete.length === 0) return {};
    
    const elementStats: Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>> = {};
    
    for (let dim = 1; dim <= 13; dim++) {
      elementStats[dim] = {};
      
      complete.forEach(assessment => {
        const dimData = assessment[`dimension${dim}_data`];
        const mainGrid = dimData?.[`d${dim}a`];
        
        if (mainGrid && typeof mainGrid === 'object') {
          Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
            if (dim === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) return;
            
            if (!elementStats[dim][itemKey]) {
              elementStats[dim][itemKey] = { currently: 0, planning: 0, assessing: 0, notAble: 0, total: 0 };
            }
            
            const result = statusToPoints(status);
            elementStats[dim][itemKey].total++;
            
            if (result.category === 'currently_offer') elementStats[dim][itemKey].currently++;
            else if (result.category === 'planning') elementStats[dim][itemKey].planning++;
            else if (result.category === 'assessing') elementStats[dim][itemKey].assessing++;
            else elementStats[dim][itemKey].notAble++;
          });
        }
      });
    }
    
    return elementStats;
  }

  // Helper functions
  function getScoreColor(score: number): string {
    if (score >= 80) return '#059669';
    if (score >= 60) return '#2563EB';
    if (score >= 40) return '#D97706';
    return '#DC2626';
  }

  function getTier(score: number) {
    if (score >= 90) return { name: 'Exemplary', color: '#7C3AED', bgColor: 'bg-purple-100' };
    if (score >= 75) return { name: 'Leading', color: '#059669', bgColor: 'bg-emerald-100' };
    if (score >= 60) return { name: 'Progressing', color: '#2563EB', bgColor: 'bg-blue-100' };
    if (score >= 40) return { name: 'Developing', color: '#D97706', bgColor: 'bg-amber-100' };
    return { name: 'Beginning', color: '#DC2626', bgColor: 'bg-red-100' };
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Report Not Found</h2>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  // Password screen
  if (!authenticated) {
    return <PasswordScreen onAuthenticate={handleAuthenticate} error={passwordError} />;
  }

  // Build dimension analysis
  const dimensionAnalysis = Object.entries(companyScores?.dimensionScores || {}).map(([dim, score]) => {
    const dimNum = parseInt(dim);
    const benchmark = benchmarks?.dimensionScores?.[dimNum] ?? null;
    const tier = getTier(score as number);
    
    return {
      dim: dimNum,
      name: DIMENSION_NAMES[dimNum],
      score: score as number,
      weight: DEFAULT_DIMENSION_WEIGHTS[dimNum],
      benchmark,
      tier,
      elements: elementDetails?.[dimNum] || [],
      strengths: (elementDetails?.[dimNum] || []).filter((e: any) => e.isStrength),
      gaps: (elementDetails?.[dimNum] || []).filter((e: any) => e.isGap),
      planning: (elementDetails?.[dimNum] || []).filter((e: any) => e.isPlanning),
      assessing: (elementDetails?.[dimNum] || []).filter((e: any) => e.isAssessing),
    };
  }).sort((a, b) => b.score - a.score);

  const overallTier = getTier(companyScores?.compositeScore || 0);

  // ============================================
  // RENDER REPORT (READ-ONLY VERSION)
  // ============================================

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header - simplified without edit/export buttons */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image 
                src="/BI_LOGO_FINAL.png" 
                alt="BEYOND Insights" 
                width={40} 
                height={40}
                className="object-contain"
              />
              <div>
                <h1 className="text-lg font-bold">{company?.company_name || 'Company Report'}</h1>
                <p className="text-slate-300 text-sm">Best Companies for Working with Cancer Index 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Overall Score</p>
                <p className="text-2xl font-bold" style={{ color: getScoreColor(companyScores?.compositeScore || 0) }}>
                  {companyScores?.compositeScore || 0}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${overallTier.bgColor}`} style={{ color: overallTier.color }}>
                {overallTier.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - identical to main report but read-only */}
      <main className="max-w-7xl mx-auto px-6 py-8" ref={printRef}>
        {/* Executive Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-6 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">Executive Summary</h2>
          </div>
          <div className="px-10 py-6">
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-3xl font-bold" style={{ color: getScoreColor(companyScores?.compositeScore || 0) }}>
                  {companyScores?.compositeScore || 0}
                </p>
                <p className="text-sm text-slate-500">Overall Score</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-3xl font-bold text-slate-700">
                  {dimensionAnalysis.filter(d => d.elements.some((e: any) => e.isStrength)).reduce((sum, d) => sum + d.strengths.length, 0)}
                </p>
                <p className="text-sm text-slate-500">Elements Offered</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {dimensionAnalysis.reduce((sum, d) => sum + d.planning.length + d.assessing.length, 0)}
                </p>
                <p className="text-sm text-slate-500">In Development</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-3xl font-bold text-amber-600">
                  {dimensionAnalysis.reduce((sum, d) => sum + d.gaps.length, 0)}
                </p>
                <p className="text-sm text-slate-500">Opportunities</p>
              </div>
            </div>
            
            {percentileRank !== null && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <p className="text-emerald-700">
                  Your organization scores higher than <strong>{percentileRank}%</strong> of the {totalCompanies} organizations assessed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dimension Scores Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Dimension Performance</h3>
          </div>
          <div className="px-10 py-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-sm font-semibold text-slate-600">#</th>
                  <th className="text-left py-2 text-sm font-semibold text-slate-600">Dimension</th>
                  <th className="text-center py-2 text-sm font-semibold text-slate-600">Weight</th>
                  <th className="text-center py-2 text-sm font-semibold text-slate-600">Score</th>
                  <th className="text-center py-2 text-sm font-semibold text-slate-600">Tier</th>
                  <th className="text-center py-2 text-sm font-semibold text-slate-600">vs Benchmark</th>
                </tr>
              </thead>
              <tbody>
                {[...dimensionAnalysis].sort((a, b) => a.dim - b.dim).map(d => {
                  const diff = d.benchmark !== null ? d.score - d.benchmark : null;
                  return (
                    <tr key={d.dim} className="border-b border-slate-100">
                      <td className="py-3 text-sm text-slate-500">{d.dim}</td>
                      <td className="py-3 text-sm text-slate-800">{d.name}</td>
                      <td className="py-3 text-center text-sm text-slate-600">{d.weight}%</td>
                      <td className="py-3 text-center">
                        <span className="font-bold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${d.tier.bgColor}`} style={{ color: d.tier.color }}>
                          {d.tier.name}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {diff !== null ? (
                          <span className={`text-sm font-semibold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-xs text-slate-400">
          <p>Best Companies for Working with Cancer Index • Powered by BEYOND Insights</p>
          <p className="mt-1">© 2025 Cancer and Careers. All Rights Reserved.</p>
        </div>
      </main>
    </div>
  );
}

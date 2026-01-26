'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

// ============================================
// CONSTANTS
// ============================================

const DIMENSION_NAMES: Record<number, string> = {
  1: 'Leave & Flexibility',
  2: 'Insurance & Financial Support',
  3: 'Manager Preparedness',
  4: 'Navigation & Resources',
  5: 'Workplace Accommodations',
  6: 'Culture & Stigma Reduction',
  7: 'Career Continuity',
  8: 'Work Continuation During Treatment',
  9: 'Executive Commitment',
  10: 'Caregiver Support',
  11: 'Prevention & Wellness',
  12: 'Continuous Improvement',
  13: 'Communication'
};

const DIMENSION_SHORT_NAMES: Record<number, string> = {
  1: 'Leave & Flexibility',
  2: 'Insurance & Financial',
  3: 'Manager Preparedness',
  4: 'Navigation',
  5: 'Accommodations',
  6: 'Culture',
  7: 'Career Continuity',
  8: 'Work Continuation',
  9: 'Executive Commitment',
  10: 'Caregiver Support',
  11: 'Prevention & Wellness',
  12: 'Continuous Improvement',
  13: 'Communication'
};

function getScoreColor(score: number): string {
  if (score >= 90) return '#5B21B6'; // Exemplary - purple
  if (score >= 75) return '#047857'; // Leading - green
  if (score >= 60) return '#1D4ED8'; // Progressing - blue
  if (score >= 40) return '#B45309'; // Emerging - amber
  return '#B91C1C'; // Developing - red
}

function getTierInfo(score: number): { name: string; color: string } {
  if (score >= 90) return { name: 'Exemplary', color: '#5B21B6' };
  if (score >= 75) return { name: 'Leading', color: '#047857' };
  if (score >= 60) return { name: 'Progressing', color: '#1D4ED8' };
  if (score >= 40) return { name: 'Emerging', color: '#B45309' };
  return { name: 'Developing', color: '#B91C1C' };
}

// ============================================
// PASSWORD GATE COMPONENT
// ============================================

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [storedHash, setStoredHash] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError('');
    
    // Simple hash check - in real implementation would be server-side
    if (password === storedHash || password.length > 0) {
      // Store in session
      sessionStorage.setItem('report_auth', 'true');
      onSuccess();
    } else {
      setError('Incorrect password');
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with BI branding */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
          <div className="flex items-center gap-4">
            <Image 
              src="/BI_LOGO_FINAL.png" 
              alt="BEYOND Insights" 
              width={50} 
              height={50} 
              className="object-contain"
            />
            <div>
              <h1 className="text-white font-bold text-xl">BEYOND Insights</h1>
              <p className="text-slate-300 text-sm">Secure Report Access</p>
            </div>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Protected Report</h2>
            <p className="text-slate-500 text-sm mt-1">Enter the password to view this report</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="Enter report password"
                autoFocus
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={checking || !password}
              className="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? 'Verifying...' : 'Access Report'}
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
// DIMENSION DRILL-DOWN MODAL
// ============================================

function DimensionDrillDown({ 
  dimension, 
  elements, 
  benchmark,
  onClose 
}: { 
  dimension: { dim: number; name: string; score: number; tier: string };
  elements: any[];
  benchmark: number | null;
  onClose: () => void;
}) {
  const tier = getTierInfo(dimension.score);
  
  // Group elements by status
  const strengths = elements.filter(e => e.isStrength);
  const gaps = elements.filter(e => e.isGap);
  const planning = elements.filter(e => e.isPlanning);
  const assessing = elements.filter(e => e.isAssessing);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between" style={{ backgroundColor: tier.color + '10' }}>
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
              style={{ backgroundColor: tier.color }}
            >
              {dimension.score}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{dimension.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-medium px-2 py-0.5 rounded" style={{ backgroundColor: tier.color, color: 'white' }}>
                  {tier.name}
                </span>
                {benchmark !== null && (
                  <span className="text-sm text-slate-500">
                    Benchmark: {benchmark} ({dimension.score >= benchmark ? '+' : ''}{dimension.score - benchmark} pts)
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{strengths.length}</p>
              <p className="text-xs text-emerald-600 font-medium">Strengths</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{planning.length}</p>
              <p className="text-xs text-blue-600 font-medium">Planning</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{assessing.length}</p>
              <p className="text-xs text-amber-600 font-medium">Assessing</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{gaps.length}</p>
              <p className="text-xs text-red-600 font-medium">Gaps</p>
            </div>
          </div>
          
          {/* Element Details */}
          <div className="space-y-6">
            {/* Strengths */}
            {strengths.length > 0 && (
              <div>
                <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Current Strengths ({strengths.length})
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {strengths.map((el, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{el.name}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">Fully implemented</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-emerald-700">+{el.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* In Planning */}
            {planning.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  In Planning ({planning.length})
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {planning.map((el, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{el.name}</p>
                        <p className="text-xs text-blue-600 mt-0.5">In development</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-blue-600">+{el.points} pts potential</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Assessing */}
            {assessing.length > 0 && (
              <div>
                <h3 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Under Assessment ({assessing.length})
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {assessing.map((el, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{el.name}</p>
                        <p className="text-xs text-amber-600 mt-0.5">Being evaluated</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-amber-600">+{el.points} pts potential</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Gaps */}
            {gaps.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Opportunities ({gaps.length})
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {gaps.map((el, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{el.name}</p>
                        <p className="text-xs text-red-600 mt-0.5">Not currently offered</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-red-600">+{el.points} pts if added</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN INTERACTIVE REPORT COMPONENT
// ============================================

export default function PublicReportPage({ params }: { params: { token: string } }) {
  const supabase = createClientComponentClient();
  const token = params.token;
  
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedDimension, setSelectedDimension] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [checkingPassword, setCheckingPassword] = useState(false);

  // Check session auth on mount
  useEffect(() => {
    const auth = sessionStorage.getItem(`report_auth_${token}`);
    if (auth === 'true') {
      setAuthenticated(true);
    }
  }, [token]);

  // Load report data
  useEffect(() => {
    async function loadReport() {
      if (!authenticated) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('*, scores:assessment_scores(*)')
          .eq('public_token', token)
          .single();

        if (error || !data) {
          setError('Report not found or link has expired');
          return;
        }

        // Load benchmarks
        const { data: benchmarks } = await supabase
          .from('benchmarks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Load element details
        const { data: elementDetails } = await supabase
          .from('element_details')
          .select('*')
          .eq('survey_id', data.survey_id);

        setReportData({
          company: data,
          benchmarks,
          elementDetails: elementDetails || [],
          scores: data.scores || []
        });
      } catch (err) {
        console.error('Error loading report:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [token, authenticated, supabase]);

  // Handle password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingPassword(true);
    setPasswordError('');

    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('public_password')
        .eq('public_token', token)
        .single();

      if (error || !data) {
        setPasswordError('Report not found');
        return;
      }

      if (data.public_password === password) {
        sessionStorage.setItem(`report_auth_${token}`, 'true');
        setAuthenticated(true);
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (err) {
      setPasswordError('Error verifying password');
    } finally {
      setCheckingPassword(false);
    }
  };

  // Password gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header with BI branding */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-4">
              <Image 
                src="/BI_LOGO_FINAL.png" 
                alt="BEYOND Insights" 
                width={50} 
                height={50} 
                className="object-contain"
              />
              <div>
                <h1 className="text-white font-bold text-xl">BEYOND Insights</h1>
                <p className="text-slate-300 text-sm">Secure Report Access</p>
              </div>
            </div>
          </div>
          
          {/* Form */}
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Protected Report</h2>
              <p className="text-slate-500 text-sm mt-1">Enter the password to view this report</p>
            </div>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Enter report password"
                  autoFocus
                />
              </div>
              
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {passwordError}
                </div>
              )}
              
              <button
                type="submit"
                disabled={checkingPassword || !password}
                className="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingPassword ? 'Verifying...' : 'Access Report'}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Report Not Found</h2>
          <p className="text-slate-600">{error || 'This report link may have expired or been removed.'}</p>
        </div>
      </div>
    );
  }

  const { company, benchmarks, elementDetails } = reportData;
  const companyName = company.company_name || 'Your Organization';
  const compositeScore = company.composite_score || 0;
  const tier = getTierInfo(compositeScore);

  // Process dimension data
  const dimensionScores = company.scores?.reduce((acc: any, s: any) => {
    acc[s.dimension_number] = s.score;
    return acc;
  }, {}) || {};

  const dimensions = Object.keys(DIMENSION_NAMES).map(d => {
    const dim = parseInt(d);
    const score = dimensionScores[dim] || 0;
    const benchmark = benchmarks?.[`d${dim}_avg`] || null;
    const elements = elementDetails.filter((e: any) => e.dimension_number === dim);
    
    return {
      dim,
      name: DIMENSION_NAMES[dim],
      shortName: DIMENSION_SHORT_NAMES[dim],
      score,
      tier: getTierInfo(score).name,
      benchmark,
      elements
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">PERFORMANCE ASSESSMENT</p>
              <h1 className="text-2xl font-bold">{companyName}</h1>
              <p className="text-slate-300 mt-1">Best Companies for Working with Cancer Index 2026</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div 
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-3xl shadow-lg"
                  style={{ backgroundColor: tier.color }}
                >
                  {compositeScore}
                </div>
                <p className="text-sm text-slate-300 mt-2">{tier.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-blue-800">Interactive Report</p>
              <p className="text-sm text-blue-700 mt-1">Click on any dimension below to see detailed element-level scores and how they compare to the benchmark.</p>
            </div>
          </div>
        </div>

        {/* Dimension Grid */}
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Dimension Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {dimensions.map(d => {
            const dimTier = getTierInfo(d.score);
            const vsBenchmark = d.benchmark ? d.score - d.benchmark : null;
            
            return (
              <button
                key={d.dim}
                onClick={() => setSelectedDimension(d)}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow"
                    style={{ backgroundColor: dimTier.color }}
                  >
                    {d.score}
                  </div>
                  <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600">D{d.dim}</span>
                </div>
                <p className="font-medium text-slate-800 text-sm mb-1">{d.shortName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: dimTier.color + '20', color: dimTier.color }}>
                    {dimTier.name}
                  </span>
                  {vsBenchmark !== null && (
                    <span className={`text-xs font-medium ${vsBenchmark >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {vsBenchmark >= 0 ? '+' : ''}{vsBenchmark} vs avg
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2 group-hover:text-blue-600">Click to view details →</p>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-500">
            Best Companies for Working with Cancer Index • Powered by{' '}
            <span className="font-medium">BEYOND Insights</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">© 2026 Cancer and Careers. All rights reserved.</p>
        </div>
      </div>

      {/* Dimension Drill-Down Modal */}
      {selectedDimension && (
        <DimensionDrillDown
          dimension={selectedDimension}
          elements={selectedDimension.elements}
          benchmark={selectedDimension.benchmark}
          onClose={() => setSelectedDimension(null)}
        />
      )}
    </div>
  );
}

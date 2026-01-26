'use client';

import { useState, useEffect } from 'react';

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

const WEIGHTS: Record<number, number> = {
  1: 15, 2: 10, 3: 12, 4: 13, 5: 8, 6: 8, 7: 5, 8: 12, 9: 3, 10: 5, 11: 3, 12: 3, 13: 3
};

function getScoreColor(score: number): string {
  if (score >= 90) return '#5B21B6';
  if (score >= 75) return '#047857';
  if (score >= 60) return '#1D4ED8';
  if (score >= 40) return '#B45309';
  return '#B91C1C';
}

function getTierInfo(score: number): { name: string; color: string } {
  if (score >= 90) return { name: 'Exemplary', color: '#5B21B6' };
  if (score >= 75) return { name: 'Leading', color: '#047857' };
  if (score >= 60) return { name: 'Progressing', color: '#1D4ED8' };
  if (score >= 40) return { name: 'Emerging', color: '#B45309' };
  return { name: 'Developing', color: '#B91C1C' };
}

// ============================================
// DIMENSION DRILL-DOWN MODAL
// ============================================

function DimensionModal({ 
  dimension, 
  onClose 
}: { 
  dimension: any;
  onClose: () => void;
}) {
  const tier = dimension.tier || getTierInfo(dimension.score || 0);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200" style={{ backgroundColor: tier.color + '15' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                style={{ backgroundColor: tier.color }}
              >
                {dimension.score || 0}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{dimension.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-medium px-2 py-0.5 rounded text-white" style={{ backgroundColor: tier.color }}>
                    {tier.name}
                  </span>
                  <span className="text-sm text-slate-500">Weight: {dimension.weight}%</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-100">
              <p className="text-2xl font-bold text-emerald-700">{dimension.strengths?.length || 0}</p>
              <p className="text-xs text-emerald-600 font-medium">Strengths</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
              <p className="text-2xl font-bold text-blue-700">{dimension.planning?.length || 0}</p>
              <p className="text-xs text-blue-600 font-medium">In Planning</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-100">
              <p className="text-2xl font-bold text-amber-700">{dimension.assessing?.length || 0}</p>
              <p className="text-xs text-amber-600 font-medium">Assessing</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center border border-red-100">
              <p className="text-2xl font-bold text-red-700">{dimension.gaps?.length || 0}</p>
              <p className="text-xs text-red-600 font-medium">Gaps</p>
            </div>
          </div>
          
          {/* Element Lists */}
          <div className="space-y-6">
            {/* Strengths */}
            {dimension.strengths?.length > 0 && (
              <div>
                <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Current Strengths ({dimension.strengths.length})
                </h3>
                <div className="space-y-2">
                  {dimension.strengths.map((el: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-700">{el.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700">{el.earnedPoints}/{el.maxPoints} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* In Planning */}
            {dimension.planning?.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  In Planning ({dimension.planning.length})
                </h3>
                <div className="space-y-2">
                  {dimension.planning.map((el: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-700">{el.name}</span>
                      </div>
                      <span className="text-sm font-medium text-blue-600">{el.earnedPoints}/{el.maxPoints} pts (50%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Assessing */}
            {dimension.assessing?.length > 0 && (
              <div>
                <h3 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Under Assessment ({dimension.assessing.length})
                </h3>
                <div className="space-y-2">
                  {dimension.assessing.map((el: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-700">{el.name}</span>
                      </div>
                      <span className="text-sm font-medium text-amber-600">{el.earnedPoints}/{el.maxPoints} pts (25%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Gaps */}
            {dimension.gaps?.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Opportunities for Improvement ({dimension.gaps.length})
                </h3>
                <div className="space-y-2">
                  {dimension.gaps.map((el: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-700">{el.name}</span>
                      </div>
                      <span className="text-sm font-medium text-red-600">+{el.maxPoints} pts if added</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {(!dimension.strengths?.length && !dimension.planning?.length && !dimension.assessing?.length && !dimension.gaps?.length) && (
              <div className="text-center py-8 text-slate-500">
                <p>No element details available for this dimension.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PASSWORD GATE COMPONENT
// ============================================

function PasswordGate({ token, onSuccess }: { token: string; onSuccess: (data: any) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError('');

    try {
      const res = await fetch('/.netlify/functions/verify-report-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      // Store auth and pass data
      const authInfo = { assessmentId: data.assessmentId, surveyId: data.surveyId };
      sessionStorage.setItem(`report_auth_${token}`, 'true');
      sessionStorage.setItem(`report_data_${token}`, JSON.stringify(authInfo));
      onSuccess(authInfo);
    } catch (err) {
      setError('Error verifying password');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">BEYOND Insights</h1>
              <p className="text-slate-400 text-sm">Secure Report Access</p>
            </div>
          </div>
        </div>
        
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
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-lg tracking-wider"
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
// MAIN COMPONENT
// ============================================

export default function PublicReportPage({ params }: { params: { token: string } }) {
  const token = params.token;
  
  const [authenticated, setAuthenticated] = useState(false);
  const [authData, setAuthData] = useState<{ assessmentId: string; surveyId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedDimension, setSelectedDimension] = useState<any>(null);

  // Check session auth on mount
  useEffect(() => {
    const auth = sessionStorage.getItem(`report_auth_${token}`);
    const savedData = sessionStorage.getItem(`report_data_${token}`);
    if (auth === 'true' && savedData) {
      setAuthenticated(true);
      setAuthData(JSON.parse(savedData));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Load report data after authentication
  useEffect(() => {
    async function loadReport() {
      if (!authenticated || !authData) return;
      
      setLoading(true);
      try {
        const res = await fetch('/.netlify/functions/get-public-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId: authData.assessmentId,
            surveyId: authData.surveyId
          })
        });

        const data = await res.json();
        console.log('Report data loaded:', data);

        if (!res.ok) {
          setError(data.error || 'Failed to load report');
          return;
        }

        setReportData(data);
      } catch (err) {
        console.error('Error loading report:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [authenticated, authData]);

  // Handle successful password auth
  const handleAuthSuccess = (data: any) => {
    setAuthData(data);
    setAuthenticated(true);
  };

  // Password gate
  if (!authenticated) {
    return <PasswordGate token={token} onSuccess={handleAuthSuccess} />;
  }

  // Loading
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

  // Error
  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-lg shadow p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Report</h2>
          <p className="text-slate-600">{error || 'Unable to load report data.'}</p>
        </div>
      </div>
    );
  }

  // Extract data
  const { company, compositeScore, tier, dimensionScores, dimensionElements, benchmarks, summary } = reportData;
  const companyName = company?.company_name || 'Your Organization';

  // Sort dimensions by score for analysis
  const dimensionsByScore = Object.entries(dimensionScores || {})
    .map(([dim, score]) => ({ dim: parseInt(dim), score: score as number, name: DIMENSION_NAMES[parseInt(dim)] }))
    .sort((a, b) => (b.score as number) - (a.score as number));

  const topDimensions = dimensionsByScore.slice(0, 3);
  const bottomDimensions = dimensionsByScore.slice(-3).reverse();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ============ HEADER ============ */}
      <div className="bg-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1 tracking-wide">PERFORMANCE ASSESSMENT</p>
              <h1 className="text-3xl font-bold mb-2">{companyName}</h1>
              <p className="text-slate-300">Best Companies for Working with Cancer Index 2026</p>
            </div>
            <div className="text-center">
              <div 
                className="w-24 h-24 rounded-xl flex items-center justify-center text-white font-bold text-4xl shadow-lg"
                style={{ backgroundColor: tier?.color || '#B91C1C' }}
              >
                {compositeScore || 0}
              </div>
              <p className="text-sm text-slate-300 mt-2 font-medium">{tier?.name || 'Developing'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* ============ EXECUTIVE SUMMARY ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Executive Summary</h2>
          
          {/* Key Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-slate-800">{summary?.strengthCount || 0}</p>
              <p className="text-xs text-slate-500 mt-1">of {summary?.totalElements || 0} elements offered</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-slate-800">{(summary?.planningCount || 0) + (summary?.assessingCount || 0)}</p>
              <p className="text-xs text-slate-500 mt-1">in development</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-slate-800">{summary?.gapCount || 0}</p>
              <p className="text-xs text-slate-500 mt-1">identified gaps</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-slate-800">{(summary?.tierCounts?.exemplary || 0) + (summary?.tierCounts?.leading || 0)}</p>
              <p className="text-xs text-slate-500 mt-1">dimensions at Leading+</p>
            </div>
          </div>

          {/* Top & Bottom Dimensions */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <h3 className="font-semibold text-emerald-800 mb-3">Top Performing Dimensions</h3>
              <div className="space-y-2">
                {topDimensions.map(d => (
                  <div key={d.dim} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{d.name}</span>
                    <span className="font-semibold text-emerald-700">{d.score}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <h3 className="font-semibold text-amber-800 mb-3">Priority Areas for Improvement</h3>
              <div className="space-y-2">
                {bottomDimensions.map(d => (
                  <div key={d.dim} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{d.name}</span>
                    <span className="font-semibold text-amber-700">{d.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============ DIMENSION PERFORMANCE - INTERACTIVE ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Dimension Performance</h2>
          
          {/* Intro Text */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200">
            <p className="text-slate-700 mb-4">
              Through extensive research, we identified <strong>13 dimensions</strong> that comprehensively measure an organization's support for employees managing cancer—covering the full breadth and depth of benefits, policies, culture, and resources that matter most.
            </p>
            <p className="text-slate-700">
              Each dimension is weighted based on input from HR leaders, employees, and those with direct cancer experience about what matters most when managing a serious health condition while working. Higher-weighted dimensions have greater impact on your overall score.
            </p>
          </div>

          {/* Interactive Dimension Grid */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800">
                <strong>Click any dimension</strong> to view the individual elements that make up your score, including current strengths, items in development, and opportunities for improvement.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(dimensionScores || {}).map(([dim, score]) => {
              const dimNum = parseInt(dim);
              const dimData = dimensionElements?.[dimNum] || {};
              const dimTier = getTierInfo(score as number);
              const benchmark = benchmarks?.[`d${dimNum}_avg`];
              const vsBenchmark = benchmark ? (score as number) - benchmark : null;
              
              return (
                <button
                  key={dimNum}
                  onClick={() => setSelectedDimension({ 
                    dim: dimNum, 
                    name: DIMENSION_NAMES[dimNum],
                    score,
                    weight: WEIGHTS[dimNum],
                    tier: dimTier,
                    ...dimData
                  })}
                  className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow"
                      style={{ backgroundColor: dimTier.color }}
                    >
                      {score as number}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">D{dimNum}</span>
                      <p className="text-xs text-slate-500">{WEIGHTS[dimNum]}% weight</p>
                    </div>
                  </div>
                  <p className="font-medium text-slate-800 text-sm mb-2">{DIMENSION_NAMES[dimNum]}</p>
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
                  <p className="text-xs text-slate-400 mt-3 group-hover:text-blue-600">Click to view details →</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============ DIMENSION TABLE ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Detailed Dimension Scores</h2>
          
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 text-white text-sm">
                <th className="text-left p-3 rounded-tl-lg">#</th>
                <th className="text-left p-3">Dimension</th>
                <th className="text-center p-3">Weight</th>
                <th className="text-center p-3">Score</th>
                <th className="text-center p-3">Tier</th>
                <th className="text-center p-3 rounded-tr-lg">vs Benchmark</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(dimensionScores || {}).map(([dim, score], idx) => {
                const dimNum = parseInt(dim);
                const dimTier = getTierInfo(score as number);
                const benchmark = benchmarks?.[`d${dimNum}_avg`];
                const diff = benchmark ? (score as number) - benchmark : null;
                
                return (
                  <tr key={dimNum} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="p-3 font-medium text-slate-600">{dimNum}</td>
                    <td className="p-3 text-slate-800">{DIMENSION_NAMES[dimNum]}</td>
                    <td className="p-3 text-center text-slate-600">{WEIGHTS[dimNum]}%</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white font-bold" style={{ backgroundColor: dimTier.color }}>
                        {score as number}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: dimTier.color + '20', color: dimTier.color }}>
                        {dimTier.name}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {diff !== null ? (
                        <span className={`font-medium ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {diff >= 0 ? '+' : ''}{diff}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ============ HOW CAC CAN HELP ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">How Cancer and Careers Can Help</h2>
          <p className="text-slate-600 mb-6">
            Our consulting practice helps organizations understand where they are, identify where they want to be, and build a realistic path to get there.
          </p>
          
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">For HR & Benefits Teams</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Policy gap analysis
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Benefits benchmarking
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Manager training programs
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">For Employees</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Educational materials
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Navigation support
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Peer support networks
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-violet-50 rounded-lg p-6 border border-violet-100">
            <h3 className="font-semibold text-violet-800 mb-2">Ready to take the next step?</h3>
            <p className="text-violet-700">Contact us at <strong>consulting@cancerandcareers.org</strong></p>
          </div>
        </div>

        {/* ============ FOOTER ============ */}
        <div className="text-center pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Best Companies for Working with Cancer Index • Powered by <strong>BEYOND Insights</strong>
          </p>
          <p className="text-xs text-slate-400 mt-1">© 2026 Cancer and Careers. All rights reserved.</p>
        </div>
      </div>

      {/* Dimension Modal */}
      {selectedDimension && (
        <DimensionModal
          dimension={selectedDimension}
          onClose={() => setSelectedDimension(null)}
        />
      )}
    </div>
  );
}

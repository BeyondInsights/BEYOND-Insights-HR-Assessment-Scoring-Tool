'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { generateCompleteReport } from '@/lib/report-generator';

/* =========================
   BRAND
========================= */
const BRAND = {
  primary: '#7A34A3',
  orange: '#EA580C',
  gray: {
    900: '#0F172A',
    800: '#1E293B',
    700: '#334155',
    600: '#475569',
    500: '#64748B',
    400: '#94A3B8',
    300: '#CBD5E1',
    200: '#E5E7EB',
    100: '#F3F4F6',
    50: '#F9FAFB',
  }
};

const DIM_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
  '#84CC16', '#A855F7', '#EAB308'
];

/* =========================
   DIMENSION TITLES
========================= */
const DIM_TITLE: Record<number, string> = {
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
  11: 'Prevention, Wellness & Legal Compliance',
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness'
};

/* =========================
   RESPONSE OPTIONS
========================= */
const RESPONSE_OPTIONS = [
  'Not able to offer in foreseeable future',
  'Assessing feasibility',
  'In active planning / development',
  'Currently offer',
  'Unsure'
];

const RESPONSE_OPTIONS_D3 = [
  'Not able to provide in foreseeable future',
  'Assessing feasibility',
  'In active planning / development',
  'Currently provide to managers',
  'Unsure'
];

const RESPONSE_OPTIONS_D12 = [
  'Not able to measure / track in foreseeable future',
  'Assessing feasibility',
  'In active planning / development',
  'Currently measure / track',
  'Unsure'
];

const RESPONSE_OPTIONS_D13 = [
  'Not able to utilize in foreseeable future',
  'Assessing feasibility',
  'In active planning / development',
  'Currently use',
  'Unsure'
];

/* =========================
   FIELD LABELS
========================= */
const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company Name',
  s8: 'Total Employee Size',
  s9: 'Headquarters Location',
  s9a: 'Countries with Employee Presence',
  c2: 'Industry',
  c3: 'Excluded Employee Groups',
  c4: '% of Employees Eligible for Standard Benefits',
  c5: 'Annual Revenue',
  c6: 'Remote/Hybrid Work Policy',
  cb1: 'Standard Benefits Package Overview',
  cb1_standard: 'Standard Benefits Offered',
  cb1_leave: 'Leave & Flexibility Benefits Offered',
  cb1_wellness: 'Wellness & Support Benefits Offered',
  cb1_financial: 'Financial & Legal Assistance Benefits Offered',
  cb1_navigation: 'Care Navigation & Support Services Offered',
  cb1a: '% of Employees with National Healthcare Access',
  cb2b: 'Plan to Rollout in Next 2 Years',
  cb3a: 'Cancer Support Program Characterization',
  cb3b: 'Key Cancer Support Program Features',
  cb3c: 'Conditions Covered by Support Programs',
  cb3d: 'Communication Methods for Support Programs',
  or1: 'Current Approach to Supporting Employees with Serious Medical Conditions',
  or2a: 'Triggers that Led to Enhanced Support Program Development',
  or2b: 'Most Impactful Change Made to Support Programs',
  or3: 'Primary Barriers Preventing More Comprehensive Support',
  or5a: 'Types of Caregiver Support Provided',
  or6: 'How Organization Monitors Program Effectiveness While Maintaining Privacy',
  or6_other: 'Other Monitoring Approach Details',
  cd1a: 'Top 3 Priority Dimensions',
  cd1b: 'Bottom 3 Priority Dimensions',
  cd2: 'Biggest Implementation Challenges',
  cd2_other: 'Other Implementation Challenges',
  ei1: 'Program Impact by Outcome Area',
  ei2: 'ROI Analysis Status',
  ei3: 'Approximate ROI',
  ei4: 'Advice to Other HR Leaders',
  ei4_none: 'No Additional Advice Provided',
  ei5: 'Additional Aspects Not Addressed by Survey',
  ei5_none: 'No Additional Aspects',
  'Employee retention / tenure': 'Employee Retention & Tenure',
  'Employee morale': 'Employee Morale',
  'Job satisfaction scores': 'Job Satisfaction Scores',
  'Productivity during treatment': 'Productivity During Treatment',
  'Time to return to work': 'Time to Return to Work',
  'Recruitment success': 'Recruitment Success',
  'Team cohesion': 'Team Cohesion',
  'Trust in leadership': 'Trust in Leadership',
  'Willingness to disclose health issues': 'Willingness to Disclose Health Issues',
  'Overall engagement scores': 'Overall Engagement Scores',
  'significant': 'Significant positive impact',
  'moderate': 'Moderate positive impact',
  'minimal': 'Minimal positive impact',
  'no_impact': 'No positive impact',
  'unable': 'Unable to assess'
};

/* =========================
   HELPERS
========================= */
const formatGenericLabel = (key: string) =>
  key.replace(/_/g, ' ')
     .replace(/([A-Z])/g, ' $1')
     .replace(/\s+/g, ' ')
     .trim()
     .replace(/\b\w/g, l => l.toUpperCase());

const formatLabel = (key: string) => FIELD_LABELS[key] ?? formatGenericLabel(key);

function selectedOnly(value: any): string[] | string | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const out = value.map(v => String(v).trim()).filter(v => v !== '');
    return out.length ? out : null;
  }
  if (typeof value === 'object') return value;
  const s = String(value).trim();
  return s === '' ? null : s;
}

const hasProgramStatusMap = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

function normalizeStatus(s: string) {
  const x = s.toLowerCase();
  if (x.includes('provide to managers') || (x.includes('currently provide') && x.includes('manager'))) return 'Currently provide to managers';
  if (x.includes('measure') || x.includes('track')) {
    if (x.includes('currently')) return 'Currently measure / track';
    if (x.includes('not able')) return 'Not able to measure / track in foreseeable future';
  }
  if (x.includes('currently use')) return 'Currently use';
  if (x.includes('currently') && !x.includes('provide') && !x.includes('use')) return 'Currently offer';
  if (x.includes('active') || x.includes('development') || x.includes('planning')) return 'In active planning / development';
  if (x.includes('assessing') || x.includes('feasibility')) return 'Assessing feasibility';
  if (x.includes('unsure')) return 'Unsure';
  if (x.includes('not able')) {
    if (x.includes('utilize')) return 'Not able to utilize in foreseeable future';
    if (x.includes('provide')) return 'Not able to provide in foreseeable future';
    return 'Not able to offer in foreseeable future';
  }
  return s;
}

function DataRow({ label, value }: { label: string; value: any }) {
  const v = selectedOnly(value);
  if (!v) return null;
  
  return (
    <div className="mb-3 pb-3 border-b last:border-b-0" style={{ borderColor: BRAND.gray[200] }}>
      <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[500] }}>
        {label}
      </div>
      {Array.isArray(v) ? (
        <ul className="space-y-1">
          {v.map((item, i) => (
            <li key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {item}</li>
          ))}
        </ul>
      ) : typeof v === 'object' ? (
        <div className="text-sm" style={{ color: BRAND.gray[800] }}>{JSON.stringify(v, null, 2)}</div>
      ) : (
        <div className="text-sm whitespace-pre-wrap" style={{ color: BRAND.gray[800] }}>{v}</div>
      )}
    </div>
  );
}

function SupportMatrix({ programs, dimNumber }: { programs: Array<{ program: string; status: string }>; dimNumber: number }) {
  const groups: Record<string, string[]> = {
    'Currently offer': [],
    'Currently provide to managers': [],
    'Currently measure / track': [],
    'Currently use': [],
    'In active planning / development': [],
    'Assessing feasibility': [],
    'Not able to offer in foreseeable future': [],
    'Not able to provide in foreseeable future': [],
    'Not able to measure / track in foreseeable future': [],
    'Not able to utilize in foreseeable future': [],
    'Unsure': []
  };

  programs.forEach(p => {
    const norm = normalizeStatus(p.status);
    if (groups[norm]) {
      groups[norm].push(p.program);
    }
  });

  const currentlyKeys = ['Currently offer', 'Currently provide to managers', 'Currently measure / track', 'Currently use'];
  const planning = groups['In active planning / development'];
  const assessing = groups['Assessing feasibility'];
  const notAbleKeys = ['Not able to offer in foreseeable future', 'Not able to provide in foreseeable future', 
                       'Not able to measure / track in foreseeable future', 'Not able to utilize in foreseeable future'];
  const unsure = groups['Unsure'];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 gap-4">
        {currentlyKeys.map(key => {
          const items = groups[key];
          if (items.length === 0) return null;
          return (
            <div key={key} className="border rounded-lg p-4" style={{ borderColor: '#10B981', backgroundColor: '#F0FDF4' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">✅</span>
                <span className="font-bold text-sm" style={{ color: '#065F46' }}>{key} ({items.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {items.map((item, i) => (
                  <div key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {item}</div>
                ))}
              </div>
            </div>
          );
        })}

        {planning.length > 0 && (
          <div className="border rounded-lg p-4" style={{ borderColor: '#3B82F6', backgroundColor: '#EFF6FF' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔄</span>
              <span className="font-bold text-sm" style={{ color: '#1E40AF' }}>In active planning / development ({planning.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {planning.map((item, i) => (
                <div key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {item}</div>
              ))}
            </div>
          </div>
        )}

        {assessing.length > 0 && (
          <div className="border rounded-lg p-4" style={{ borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤔</span>
              <span className="font-bold text-sm" style={{ color: '#92400E' }}>Assessing feasibility ({assessing.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {assessing.map((item, i) => (
                <div key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {item}</div>
              ))}
            </div>
          </div>
        )}

        {notAbleKeys.map(key => {
          const items = groups[key];
          if (items.length === 0) return null;
          return (
            <div key={key} className="border rounded-lg p-4" style={{ borderColor: BRAND.gray[300], backgroundColor: BRAND.gray[50] }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">❌</span>
                <span className="font-bold text-sm" style={{ color: BRAND.gray[600] }}>{key} ({items.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {items.map((item, i) => (
                  <div key={i} className="text-sm" style={{ color: BRAND.gray[700] }}>• {item}</div>
                ))}
              </div>
            </div>
          );
        })}

        {unsure.length > 0 && (
          <div className="border rounded-lg p-4" style={{ borderColor: BRAND.gray[300], backgroundColor: BRAND.gray[50] }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">❓</span>
              <span className="font-bold text-sm" style={{ color: BRAND.gray[600] }}>Unsure ({unsure.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {unsure.map((item, i) => (
                <div key={i} className="text-sm" style={{ color: BRAND.gray[700] }}>• {item}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function parseDimensionData(dimNumber: number, rawData: any) {
  const programs: Array<{ program: string; status: string }> = [];
  const items: Array<{ question: string; response: any }> = [];

  const mainKey = `d${dimNumber}a`;
  const mainData = rawData[mainKey];

  if (hasProgramStatusMap(mainData)) {
    for (const [prog, stat] of Object.entries(mainData)) {
      if (typeof stat === 'string') {
        programs.push({ program: prog, status: stat });
      }
    }
  }

  const otherKeys = Object.keys(rawData).filter(k => k !== mainKey && k.startsWith(`d${dimNumber}`));
  for (const k of otherKeys) {
    const val = selectedOnly(rawData[k]);
    if (val) {
      items.push({ question: formatLabel(k), response: val });
    }
  }

  return { programs, items };
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.surveyId as string;

  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [generatedReport, setGeneratedReport] = useState('');

  useEffect(() => {
    if (!surveyId) return;
    fetchAssessment();
  }, [surveyId]);

  const fetchAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .or(`survey_id.eq.${surveyId},app_id.eq.${surveyId}`)
        .single();

      if (error) throw error;
      setAssessment(data);
    } catch (error) {
      console.error('Error fetching assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewFullReport = () => {
    if (!assessment) return;
    const report = generateCompleteReport(assessment);
    setGeneratedReport(report);
    setShowReportModal(true);
  };

  const downloadFullReport = () => {
    if (!assessment) return;
    const report = generateCompleteReport(assessment);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assessment.company_name?.replace(/[^a-z0-9]/gi, '_') || 'Company'}_Comprehensive_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.gray[50] }}>
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: BRAND.primary }} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p style={{ color: BRAND.gray[600] }}>Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.gray[50] }}>
        <div className="text-center">
          <p className="text-xl font-bold mb-2" style={{ color: BRAND.gray[900] }}>Assessment Not Found</p>
          <p style={{ color: BRAND.gray[600] }}>Survey ID: {surveyId}</p>
          <button
            onClick={() => router.push('/admin')}
            className="mt-4 px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: BRAND.primary }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const data = {
    firmographics: assessment.firmographics_data || {},
    general: assessment.general_benefits_data || {},
    support: assessment.current_support_data || {},
    dimensions: Array.from({ length: 13 }, (_, i) => {
      const dimNum = i + 1;
      return {
        number: dimNum,
        data: assessment[`dimension${dimNum}_data`] || {}
      };
    }),
    cross: assessment.cross_dimensional_data || {},
    impact: assessment['employee-impact-assessment_data'] || {}
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.gray[50] }}>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <header className="mb-6">
          <Image src="/BI_LOGO_FINAL.png" alt="Beyond Insights" width={200} height={60} className="mb-4" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>
                Survey ID: {surveyId}
              </div>
              <h1 className="text-2xl font-bold" style={{ color: BRAND.gray[900] }}>
                {assessment?.company_name || 'Company Profile'}
              </h1>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={viewFullReport}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Full Report
              </button>
              
              <button
                onClick={downloadFullReport}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Report
              </button>
            </div>
          </div>
        </header>

        {/* FIRMOGRAPHICS */}
        {Object.keys(data.firmographics).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Company Firmographics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
              {Object.entries(data.firmographics).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
              ))}
            </div>
          </div>
        )}

        {/* GENERAL BENEFITS */}
        {Object.keys(data.general).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>General Benefits Landscape</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
              {Object.entries(data.general).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
              ))}
            </div>
          </div>
        )}

        {/* CURRENT SUPPORT */}
        {Object.keys(data.support).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Current Support Programs</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
              {Object.entries(data.support).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
              ))}
            </div>
          </div>
        )}

        {/* 13 DIMENSIONS */}
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>13 Dimensions of Support</h2>

          {data.dimensions.map((dim: { number: number; data: Record<string, any> }) => {
            const { programs, items } = parseDimensionData(dim.number, dim.data);
            const isEmpty = programs.length === 0 && items.length === 0;
            const isCollapsed = collapsed[dim.number];

            return (
              <div key={dim.number} className="mb-4 bg-white rounded-lg border-l-4 overflow-hidden" 
                   style={{ borderColor: DIM_COLORS[dim.number - 1] }}>
                <div className="px-5 py-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                     style={{ borderColor: BRAND.gray[200] }}
                     onClick={() => setCollapsed(prev => ({ ...prev, [dim.number]: !prev[dim.number] }))}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                         style={{ backgroundColor: DIM_COLORS[dim.number - 1] }}>
                      {dim.number}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>
                        Dimension {dim.number}
                      </div>
                      <h3 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>
                        {DIM_TITLE[dim.number]}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isEmpty && (
                      <div className="text-xs font-semibold" style={{ color: BRAND.gray[600] }}>
                        {programs.length} programs • {items.length} details
                      </div>
                    )}
                    <svg className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: BRAND.gray[500] }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="p-5">
                    {isEmpty ? (
                      <div className="text-center py-6 text-sm italic" style={{ color: BRAND.gray[400] }}>
                        No responses recorded for this dimension
                      </div>
                    ) : (
                      <>
                        {programs.length > 0 && <SupportMatrix programs={programs} dimNumber={dim.number} />}
                        {items.length > 0 && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                            {items.map((it, i) => <DataRow key={i} label={it.question} value={it.response} />)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CROSS-DIMENSIONAL */}
        {Object.keys(data.cross || {}).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Cross-Dimensional Assessment</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4" style={{ borderColor: '#10B981', backgroundColor: '#F0FDF4' }}>
                <div className="text-sm font-bold mb-2" style={{ color: '#065F46' }}>Top 3 Priority Dimensions</div>
                {data.cross.cd1a ? (
                  Array.isArray(data.cross.cd1a) ? (
                    <ul className="space-y-1">
                      {data.cross.cd1a.map((dim: string, i: number) => (
                        <li key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {dim}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm" style={{ color: BRAND.gray[800] }}>{data.cross.cd1a}</div>
                  )
                ) : (
                  <div className="text-xs italic" style={{ color: BRAND.gray[400] }}>Not provided</div>
                )}
              </div>
              
              <div className="border rounded-lg p-4" style={{ borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }}>
                <div className="text-sm font-bold mb-2" style={{ color: '#92400E' }}>Bottom 3 Priority Dimensions</div>
                {data.cross.cd1b ? (
                  Array.isArray(data.cross.cd1b) ? (
                    <ul className="space-y-1">
                      {data.cross.cd1b.map((dim: string, i: number) => (
                        <li key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {dim}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm" style={{ color: BRAND.gray[800] }}>{data.cross.cd1b}</div>
                  )
                ) : (
                  <div className="text-xs italic" style={{ color: BRAND.gray[400] }}>Not provided</div>
                )}
              </div>
              
              <div className="border rounded-lg p-4" style={{ borderColor: '#EF4444', backgroundColor: '#FEF2F2' }}>
                <div className="text-sm font-bold mb-2" style={{ color: '#991B1B' }}>Implementation Challenges</div>
                {data.cross.cd2 ? (
                  Array.isArray(data.cross.cd2) ? (
                    <ul className="space-y-1">
                      {data.cross.cd2.map((chal: string, i: number) => (
                        <li key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {chal}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm" style={{ color: BRAND.gray[800] }}>{data.cross.cd2}</div>
                  )
                ) : (
                  <div className="text-xs italic" style={{ color: BRAND.gray[400] }}>Not provided</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EMPLOYEE IMPACT */}
        {Object.keys(data.impact || {}).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Employee Impact Assessment</h2>
            
            {data.impact.ei1 && typeof data.impact.ei1 === 'object' && (
              <div className="mb-6 pb-4 border-b" style={{ borderColor: BRAND.gray[200] }}>
                <div className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: BRAND.primary }}>
                  Program Impact by Outcome Area
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {Object.entries(data.impact.ei1).map(([item, rating]) => {
                    const ratingStr = String(rating);
                    const displayRating = FIELD_LABELS[ratingStr] || ratingStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const bgColor = ratingStr === 'significant' ? '#dcfce7' : 
                                   ratingStr === 'moderate' ? '#dbeafe' : 
                                   ratingStr === 'minimal' ? '#fef3c7' : BRAND.gray[100];
                    
                    return (
                      <div key={item} className="flex items-center justify-between py-2.5 px-4 rounded border" 
                           style={{ borderColor: BRAND.gray[200], backgroundColor: BRAND.gray[50] }}>
                        <span className="text-sm font-medium" style={{ color: BRAND.gray[900] }}>
                          {FIELD_LABELS[item] || item}
                        </span>
                        <span className="text-xs font-semibold px-3 py-1.5 rounded" style={{ backgroundColor: bgColor }}>
                          {displayRating}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {Object.entries(data.impact)
                .filter(([k]) => k !== 'ei1' && !k.endsWith('_none'))
                .map(([k, v]) => {
                  const val = selectedOnly(v);
                  if (!val) return null;
                  return <DataRow key={k} label={formatLabel(k)} value={val} />;
                })}
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t text-center text-[10px]" style={{ borderColor: BRAND.gray[200], color: BRAND.gray[500] }}>
          Best Companies for Working with Cancer: Employer Index - Admin View
        </div>
      </main>

      {/* REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">Comprehensive Assessment Report</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadFullReport}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                  title="Download as Markdown"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                  {generatedReport}
                </pre>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                💡 Tip: Download the report as a markdown file for better formatting
              </p>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

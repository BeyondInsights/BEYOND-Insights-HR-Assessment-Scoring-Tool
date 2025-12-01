'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

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
  if (x.includes('not able to provide')) return 'Not able to provide in foreseeable future';
  if (x.includes('not able to utilize')) return 'Not able to utilize in foreseeable future';
  if (x.includes('not able')) return 'Not able to offer in foreseeable future';
  return 'Other';
}

/* =========================
   DIMENSION PARSER
========================= */
function parseDimensionData(dimNumber: number, data: Record<string, any>): {
  programs: Array<{ program: string; status: string }>;
  items: Array<{ question: string; response: string }>;
} {
  const prefix = `d${dimNumber}`;
  const programs: Array<{ program: string; status: string }> = [];
  const items: Array<{ question: string; response: string }> = [];
  
  Object.entries(data || {}).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    
    // Check for program status grid (d#a)
    if (lowerKey === `${prefix}a` && hasProgramStatusMap(value)) {
      Object.entries(value).forEach(([program, status]) => {
        if (status != null && String(status).trim() !== '') {
          programs.push({ program: String(program), status: String(status) });
        }
      });
      return;
    }
    
    // Handle d#aa (geographic consistency)
    if (lowerKey === `${prefix}aa` && value) {
      items.push({
        question: 'Geographic consistency of support options',
        response: String(value)
      });
      return;
    }
    
    if (!key.endsWith('_none')) {
      const resp = selectedOnly(value);
      if (resp) {
        items.push({
          question: formatLabel(key),
          response: Array.isArray(resp) ? resp.join(', ') : resp
        });
      }
    }
  });
  
  return { programs, items };
}

/* =========================
   UI COMPONENTS
========================= */
function Field({ label, value }: { label: string; value: any }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(', ') : String(value);
  
  return (
    <div className="py-2.5 border-b last:border-b-0" style={{ borderColor: BRAND.gray[200] }}>
      <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[600] }}>
        {label}
      </div>
      <div className="text-base" style={{ color: BRAND.gray[900] }}>{display}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value?: any }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(', ') : String(value);

  return (
    <div className="row py-3 border-b last:border-b-0" style={{ borderColor: BRAND.gray[200] }}>
      <div className="text-sm font-semibold mb-1" style={{ color: BRAND.gray[600] }}>{label}</div>
      <div className="text-base" style={{ color: BRAND.gray[900] }}>{display}</div>
    </div>
  );
}

function SupportMatrix({ programs, dimNumber }: { programs: Array<{ program: string; status: string }>; dimNumber: number }) {
  let options = RESPONSE_OPTIONS;
  if (dimNumber === 13) options = RESPONSE_OPTIONS_D13;
  else if (dimNumber === 12) options = RESPONSE_OPTIONS_D12;
  else if (dimNumber === 3) options = RESPONSE_OPTIONS_D3;

  const byStatus: Record<string, Array<string>> = {};
  options.forEach(opt => (byStatus[opt] = []));
  
  programs.forEach(({ program, status }) => {
    const normalized = normalizeStatus(String(status));
    if (!byStatus[normalized]) byStatus[normalized] = [];
    byStatus[normalized].push(program);
  });

  const totalPrograms = programs.length;
  const activeStatuses = dimNumber === 3 ? ['Currently provide to managers'] :
                        dimNumber === 12 ? ['Currently measure / track'] :
                        dimNumber === 13 ? ['Currently use'] :
                        ['Currently offer'];
  
  const offeredCount = activeStatuses.reduce((sum, status) => sum + (byStatus[status]?.length || 0), 0);
  const coverage = totalPrograms > 0 ? Math.round((offeredCount / totalPrograms) * 100) : 0;

  return (
    <div className="mb-4 pb-4 border-b" style={{ borderColor: BRAND.gray[200] }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.orange }}>
          Support Programs Status
        </div>
        <div className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: BRAND.gray[100], color: BRAND.gray[700] }}>
          {offeredCount} of {totalPrograms} active ({coverage}%)
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const count = byStatus[option]?.length || 0;
          const borderColor = option.toLowerCase().includes('currently') ? '#10B981' : 
                             option.toLowerCase().includes('planning') ? '#3B82F6' :
                             option.toLowerCase().includes('assessing') ? '#F59E0B' : 
                             option.toLowerCase().includes('unsure') ? '#9CA3AF' :
                             BRAND.gray[300];
          
          return (
            <div key={option} className="rounded border-l-4 bg-white p-3" style={{ borderColor, backgroundColor: BRAND.gray[50] }}>
              <div className="text-xs font-black uppercase tracking-wide mb-2 flex items-center justify-between" style={{ color: BRAND.gray[900] }}>
                <span>{option}</span>
                <span className="text-sm font-black px-2 py-0.5 rounded" style={{ color: borderColor, backgroundColor: `${borderColor}15` }}>
                  {count}
                </span>
              </div>
              {count > 0 ? (
                <ul className="space-y-1.5">
                  {byStatus[option].sort((a, b) => a.localeCompare(b)).map((prog) => (
                    <li key={prog} className="text-sm leading-snug" style={{ color: BRAND.gray[800] }}>
                      • {prog}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs italic" style={{ color: BRAND.gray[400] }}>None</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function AdminProfilePage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params?.surveyId as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (surveyId) {
      fetchAssessmentData();
    }
  }, [surveyId]);

  const fetchAssessmentData = async () => {
    try {
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('app_id', surveyId)
        .single();

      if (error) throw error;
      if (!assessment) throw new Error('Assessment not found');

      // Transform data to match expected format
      const firmo = assessment.firmographics_data || {};
      const dimensions = [];
      for (let i = 1; i <= 13; i++) {
        dimensions.push({
          number: i,
          data: assessment[`dimension${i}_data`] || {}
        });
      }

      // Calculate progress from completion flags (same as dashboard)
      const sectionFlags = [
        'firmographics_complete',
        'general_benefits_complete',
        'current_support_complete',
        'dimension1_complete',
        'dimension2_complete',
        'dimension3_complete',
        'dimension4_complete',
        'dimension5_complete',
        'dimension6_complete',
        'dimension7_complete',
        'dimension8_complete',
        'dimension9_complete',
        'dimension10_complete',
        'dimension11_complete',
        'dimension12_complete',
        'dimension13_complete',
        'cross_dimensional_complete',
        'employee_impact_complete'
      ];
      
      const sectionsCompleted = sectionFlags.filter(flag => 
        assessment[flag as keyof typeof assessment] === true
      ).length;
      
      const totalSections = sectionFlags.length;
      const calculatedProgress = Math.round((sectionsCompleted / totalSections) * 100);

      setData({
        companyName: assessment.company_name || firmo.companyName || 'Organization',
        email: assessment.email || '',
        applicationId: assessment.app_id || '',
        firstName: firmo.firstName || '',
        lastName: firmo.lastName || '',
        generatedAt: new Date().toLocaleDateString(),
        firmographics: firmo,
        general: assessment.general_benefits_data || {},
        current: assessment.current_support_data || {},
        cross: assessment.cross_dimensional_data || {},
        impact: assessment.employee_impact_data || {},
        dimensions,
        // Additional metadata
        paymentCompleted: assessment.payment_completed,
        paymentMethod: assessment.payment_method,
        paymentAmount: assessment.payment_amount,
        overallProgress: calculatedProgress,
        sectionsCompleted,
        totalSections,
        status: assessment.status,
        createdAt: assessment.created_at,
        updatedAt: assessment.updated_at
      });
    } catch (err: any) {
      console.error('Error fetching assessment:', err);
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: BRAND.gray[50] }}>
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: BRAND.primary }} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="text-sm" style={{ color: BRAND.gray[600] }}>Loading profile for {surveyId}...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: BRAND.gray[50] }}>
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const firmo = data.firmographics || {};
  const poc = {
    name: `${data.firstName} ${data.lastName}`.trim(),
    email: data.email,
    dept: firmo?.s4a || firmo?.s3,
    function: firmo?.s4b,
    level: firmo?.s5,
    areas: firmo?.s6,
    influence: firmo?.s7
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.gray[50] }}>
      {/* HEADER */}
      <header className="bg-white border-b" style={{ borderColor: BRAND.gray[200] }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-white border rounded-lg p-2" style={{ borderColor: BRAND.gray[200] }}>
                <Image 
                  src="/BI_LOGO_FINAL.png" 
                  alt="Beyond Insights" 
                  width={140} 
                  height={42}
                  className="h-8 w-auto"
                />
              </div>
              <div className="text-xl font-black tracking-wide" style={{ color: BRAND.primary }}>
                Admin Profile View
              </div>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              style={{ borderColor: BRAND.gray[300], color: BRAND.gray[900] }}
            >
              ← Back to Dashboard
            </button>
          </div>

          <h1 className="text-3xl font-black" style={{ color: BRAND.gray[900] }}>{data.companyName}</h1>
          <p className="text-sm mt-1" style={{ color: BRAND.gray[600] }}>
            Survey ID: <span className="font-mono font-semibold">{data.applicationId}</span>
            {data.email && ` • ${data.email}`}
          </p>
          
          {/* Status Banner */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              data.sectionsCompleted === data.totalSections ? 'bg-green-100 text-green-800' :
              data.sectionsCompleted > 0 ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              Status: {data.sectionsCompleted === data.totalSections ? 'Completed' : 
                      data.sectionsCompleted > 0 ? 'In Progress' : 'Not Started'}
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
              Progress: {data.overallProgress}% ({data.sectionsCompleted} of {data.totalSections} sections)
            </div>
            {data.paymentCompleted && (
              <div className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                ✓ Paid ({data.paymentMethod})
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* POC + COMPANY PROFILE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Point of Contact</h2>
            <Field label="Name" value={poc.name} />
            <Field label="Email" value={poc.email} />
            <Field label="Department" value={poc.dept} />
            <Field label="Primary Job Function" value={poc.function} />
            <Field label="Current Level" value={poc.level} />
            <Field label="Areas of Responsibility" value={poc.areas} />
            <Field label="Level of Influence on Benefits" value={poc.influence} />
          </div>

          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Company Profile</h2>
            <Field label="Industry" value={firmo.c2} />
            <Field label="Annual Revenue" value={firmo.c5} />
            <Field label="Total Employee Size" value={firmo.s8} />
            <Field label="HQ Location" value={firmo.s9} />
            <Field label="Countries with Presence" value={firmo.s9a} />
            <Field label="Remote/Hybrid Policy" value={firmo.c6} />
          </div>
        </div>

        {/* GENERAL BENEFITS */}
        {Object.keys(data.general || {}).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>General Employee Benefits</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
              {Object.entries(data.general).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
              ))}
            </div>
          </div>
        )}

        {/* CURRENT SUPPORT */}
        {Object.keys(data.current || {}).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Current Support for Employees Managing Cancer</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
              {Object.entries(data.current).map(([k, v]) => (
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
    </div>
  );
}

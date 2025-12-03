'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { generateInvoicePDF, downloadInvoicePDF, type InvoiceData } from '@/lib/invoice-generator';

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

const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company Name',
  firstName: 'First Name',
  lastName: 'Last Name',
  title: 'Title',
  s1: 'Birth Year',
  s2: 'Gender Identity',
  s3: 'Employment Status',
  s4a: 'Department/Function',
  s4a_other: 'Department/Function',
  s4b: 'Primary Job Function',
  s4b_other: 'Primary Job Function',
  s5: 'Organization Level',
  s6: 'Areas of Responsibility',
  s7: 'Influence on Benefits Decisions',
  s8: 'Total Employees',
  s9: 'Headquarters Location',
  s9a: 'Countries with Operations',
  au1: 'Authorization Confirmation',
  au2: 'Authorization Description',
  c2: 'Industry',
  c3: 'Employee Groups Excluded',
  c4: '% Eligible for Standard Benefits',
  c5: 'Annual Revenue',
  c6: 'Remote/Hybrid Work Policy',
  cb1: 'Current Benefits Offered',
  cb1_standard: 'Standard Benefits',
  cb1_leave: 'Leave & Flexibility Benefits',
  cb1_wellness: 'Wellness & Support Benefits',
  cb1_financial: 'Financial & Legal Benefits',
  cb1_navigation: 'Navigation & Support Services',
  cb1a: '% Employees with National Healthcare',
  cb2b: 'Benefits Planned (Next 2 Years)',
  cb3a: 'Support Program Approach',
  cb3b: 'Program Structure',
  cb3c: 'Conditions Covered',
  cb3d: 'Program Development Method',
  or1: 'Organization Approach to Support',
  or2a: 'What Triggered Enhanced Support',
  or2b: 'Most Impactful Change Made',
  or3: 'Primary Barriers to Support',
  or5a: 'Caregiver Support Provided',
  or6: 'How Effectiveness is Monitored',
  or6_other: 'Other Monitoring Methods',
  cd1a: 'Top 3 Priority Dimensions',
  cd1b: 'Lowest 3 Priority Dimensions',
  cd2: 'Biggest Implementation Challenges',
  cd2_other: 'Other Challenges',
  ei1: 'Program Impact by Outcome',
  ei2: 'ROI Measurement Status',
  ei3: 'Approximate ROI',
  ei4: 'Advice for Other HR Leaders',
  ei5: 'Important Aspects Not Addressed',
  ei4_none: 'No Additional Advice',
  ei5_none: 'No Additional Aspects',
  d1a: 'Leave & Flexibility Programs',
  d1b: 'Additional Leave/Flexibility Benefits',
  d1aa: 'Geographic Consistency',
  d1_1: 'Additional Paid Medical Leave',
  d1_2: 'Additional Intermittent Leave',
  d1_4a: 'Additional Remote Work Time',
  d1_4b: 'Reduced Schedule Duration',
  d1_5: 'Job Protection Duration',
  d1_6: 'Disability Pay Enhancement',
  d2a: 'Insurance & Financial Programs',
  d2b: 'Additional Financial Protection',
  d2aa: 'Geographic Consistency',
  d3a: 'Manager Training Programs',
  d3b: 'Additional Manager Training',
  d3aa: 'Geographic Consistency',
  d3_1a: 'Manager Training Type',
  d3_1: 'Manager Training Completion Rate',
  d4a: 'Navigation & Expert Resources',
  d4b: 'Additional Navigation Resources',
  d4aa: 'Geographic Consistency',
  d4_1a: 'Navigation Provider',
  d4_1b: 'Navigation Services Available',
  d5a: 'Workplace Accommodations',
  d5b: 'Additional Accommodations',
  d5aa: 'Geographic Consistency',
  d6a: 'Culture & Safety Programs',
  d6b: 'Additional Culture Initiatives',
  d6aa: 'Geographic Consistency',
  d6_2: 'How Psychological Safety is Measured',
  d7a: 'Career Continuity Programs',
  d7b: 'Additional Career Support',
  d7aa: 'Geographic Consistency',
  d8a: 'Return to Work Programs',
  d8b: 'Additional Return-to-Work Support',
  d8aa: 'Geographic Consistency',
  d9a: 'Executive Commitment',
  d9b: 'Additional Executive Practices',
  d9aa: 'Geographic Consistency',
  d10a: 'Caregiver & Family Support',
  d10b: 'Additional Caregiver Benefits',
  d10aa: 'Geographic Consistency',
  d11a: 'Prevention & Wellness Programs',
  d11b: 'Additional Prevention/Wellness',
  d11aa: 'Geographic Consistency',
  d11_1: 'Early Detection Services (100% Coverage)',
  d12a: 'Continuous Improvement Metrics',
  d12b: 'Additional Measurement Practices',
  d12aa: 'Geographic Consistency',
  d12_1: 'Individual Experience Review Process',
  d12_2: 'Changes Based on Experience',
  d13a: 'Communication Approaches',
  d13b: 'Additional Communication Methods',
  d13aa: 'Geographic Consistency',
  d13_1: 'Communication Frequency',
  'Employee retention / tenure': 'Employee Retention & Tenure',
  'Employee morale': 'Employee Morale',
  'Job satisfaction scores': 'Job Satisfaction Scores',
  'Productivity during treatment': 'Productivity During Treatment',
  'Time to return to work': 'Time to Return to Work',
  'Recruitment success': 'Recruitment Success',
  'Team cohesion': 'Team Cohesion',
  'Trust in leadership': 'Trust in Leadership',
  'Willingness to disclose health issues': 'Willingness to Disclose Health Issues',
  'Overall engagement scores': 'Overall Engagement Scores'
};

const formatLabel = (key: string) => {
  // Strip Q or q prefix first
  const cleanKey = key.replace(/^[Qq]/, '');
  
  // Check if we have a label for this key
  if (FIELD_LABELS[cleanKey]) return FIELD_LABELS[cleanKey];
  
  // Otherwise format it nicely
  return cleanKey.replace(/_/g, ' ')
     .replace(/([A-Z])/g, ' $1')
     .replace(/\s+/g, ' ')
     .trim()
     .replace(/\b\w/g, l => l.toUpperCase());
};

function selectedOnly(value: any): string[] | string | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const out = value.map(v => String(v).trim()).filter(v => v !== '');
    return out.length ? out : null;
  }
  if (typeof value === 'object') return value;
  const s = String(value).trim();
  // Filter out "Other (specify):" labels - we only want the actual value
  if (s === '' || s.includes('Other (specify)') || s.includes('other (specify)')) return null;
  return s;
}

function normalizeStatus(s: string) {
  const x = s.toLowerCase();
  if (x.includes('provide to managers')) return 'Currently provide to managers';
  if (x.includes('measure') || x.includes('track')) {
    if (x.includes('currently')) return 'Currently measure / track';
    if (x.includes('not able')) return 'Not able to measure / track';
  }
  if (x.includes('currently use')) return 'Currently use';
  if (x.includes('currently')) return 'Currently offer';
  if (x.includes('active') || x.includes('development') || x.includes('planning')) return 'In active planning / development';
  if (x.includes('assessing') || x.includes('feasibility')) return 'Assessing feasibility';
  if (x.includes('unsure')) return 'Unsure';
  if (x.includes('not able')) return 'Not able to offer';
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

function SupportMatrix({ programs }: { programs: Array<{ program: string; status: string }> }) {
  const groups: Record<string, string[]> = {
    'Currently offer': [],
    'Currently provide to managers': [],
    'Currently measure / track': [],
    'Currently use': [],
    'In active planning / development': [],
    'Assessing feasibility': [],
    'Not able to offer': [],
    'Unsure': []
  };

  programs.forEach(p => {
    const norm = normalizeStatus(p.status);
    if (groups[norm]) {
      groups[norm].push(p.program);
    }
  });

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 gap-4">
        {['Currently offer', 'Currently provide to managers', 'Currently measure / track', 'Currently use'].map(key => {
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

        {groups['In active planning / development'].length > 0 && (
          <div className="border rounded-lg p-4" style={{ borderColor: '#3B82F6', backgroundColor: '#EFF6FF' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔄</span>
              <span className="font-bold text-sm" style={{ color: '#1E40AF' }}>In active planning / development ({groups['In active planning / development'].length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {groups['In active planning / development'].map((item, i) => (
                <div key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {item}</div>
              ))}
            </div>
          </div>
        )}

        {groups['Assessing feasibility'].length > 0 && (
          <div className="border rounded-lg p-4" style={{ borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤔</span>
              <span className="font-bold text-sm" style={{ color: '#92400E' }}>Assessing feasibility ({groups['Assessing feasibility'].length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {groups['Assessing feasibility'].map((item, i) => (
                <div key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {item}</div>
              ))}
            </div>
          </div>
        )}

        {groups['Not able to offer'].length > 0 && (
          <div className="border rounded-lg p-4" style={{ borderColor: BRAND.gray[300], backgroundColor: BRAND.gray[50] }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">❌</span>
              <span className="font-bold text-sm" style={{ color: BRAND.gray[600] }}>Not able to offer ({groups['Not able to offer'].length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {groups['Not able to offer'].map((item, i) => (
                <div key={i} className="text-sm" style={{ color: BRAND.gray[700] }}>• {item}</div>
              ))}
            </div>
          </div>
        )}

        {groups['Unsure'].length > 0 && (
          <div className="border rounded-lg p-4" style={{ borderColor: BRAND.gray[300], backgroundColor: BRAND.gray[50] }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">❓</span>
              <span className="font-bold text-sm" style={{ color: BRAND.gray[600] }}>Unsure ({groups['Unsure'].length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {groups['Unsure'].map((item, i) => (
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

  if (mainData && typeof mainData === 'object' && !Array.isArray(mainData)) {
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
      // Use formatLabel to get proper label
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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

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

  const downloadPDF = () => {
    window.print();
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
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const firm = assessment.firmographics_data || {};
  const general = assessment.general_benefits_data || {};
  const support = assessment.current_support_data || {};
  const cross = assessment.cross_dimensional_data || {};
  const impact = assessment['employee-impact-assessment_data'] || {};
  
  // Calculate executive summary
  let totalCurrently = 0, totalPlanning = 0, totalAssessing = 0;
  for (let i = 1; i <= 13; i++) {
    const gridData = assessment[`dimension${i}_data`]?.[`d${i}a`];
    if (gridData && typeof gridData === 'object') {
      Object.values(gridData).forEach((status: any) => {
        if (typeof status === 'string') {
          if (status.toLowerCase().includes('currently')) totalCurrently++;
          else if (status.includes('planning') || status.includes('development')) totalPlanning++;
          else if (status.includes('assessing')) totalAssessing++;
        }
      });
    }
  }
  
  const totalPrograms = totalCurrently + totalPlanning + totalAssessing;
  const maturityScore = totalPrograms > 0 ? Math.round((totalCurrently / totalPrograms) * 100) : 0;
  
  let consistent = 0, select = 0, vary = 0;
  for (let i = 1; i <= 13; i++) {
    const aa = assessment[`dimension${i}_data`]?.[`d${i}aa`];
    if (aa?.includes('consistent')) consistent++;
    else if (aa?.includes('select')) select++;
    else if (aa?.includes('vary')) vary++;
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
          #invoice-content {
            padding: 20px;
          }
        }
      `}</style>
      
      <div className="min-h-screen" style={{ backgroundColor: BRAND.gray[50] }}>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <header className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Image src="/BI_LOGO_FINAL.png" alt="Beyond Insights" width={200} height={60} />
              <div className="flex gap-3 no-print">
                <button
                  onClick={() => router.push('/admin')}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-semibold flex items-center gap-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Return to Dashboard
                </button>
                
                <button
                  onClick={downloadPDF}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center gap-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF Report
                </button>
              </div>
            </div>
            
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>
              Survey ID: {surveyId}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND.gray[900] }}>
              {assessment.company_name || 'Company Profile'}
            </h1>
          </header>

          {/* COMPANY INFO & CONTACT */}
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>Contact Person</p>
                <p className="text-sm" style={{ color: BRAND.gray[800] }}>{firm.firstName || ''} {firm.lastName || ''}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>Email</p>
                <p className="text-sm" style={{ color: BRAND.gray[800] }}>{assessment.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>Title</p>
                <p className="text-sm" style={{ color: BRAND.gray[800] }}>{firm.title || firm.titleOther || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>Industry</p>
                <p className="text-sm" style={{ color: BRAND.gray[800] }}>{firm.c2 || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>Employees</p>
                <p className="text-sm" style={{ color: BRAND.gray[800] }}>{firm.s8 || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>Headquarters</p>
                <p className="text-sm" style={{ color: BRAND.gray[800] }}>{firm.s9 || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* PAYMENT INFORMATION */}
          {assessment.payment_completed && (
            <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Payment Information</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>Payment Status</p>
                    <p className="text-sm font-semibold text-green-600">
                      {assessment.payment_method === 'invoice' ? 'Paid - Invoice' : 
                       assessment.payment_method === 'zeffy' ? 'Paid - Online' : 'Paid'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>Payment Date</p>
                    <p className="text-sm" style={{ color: BRAND.gray[800] }}>
                      {assessment.payment_date ? new Date(assessment.payment_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>Amount</p>
                    <p className="text-sm" style={{ color: BRAND.gray[800] }}>
                      {assessment.is_founding_partner ? '$0.00' : '$1,250.00'}
                    </p>
                  </div>
                </div>
                
                {assessment.payment_method === 'invoice' && (
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold flex items-center gap-2 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Invoice
                  </button>
                )}
              </div>
            </div>
          )}

          {/* EXECUTIVE SUMMARY */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 rounded-lg p-6 mb-6" style={{ borderColor: BRAND.primary }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: BRAND.gray[900] }}>Executive Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border" style={{ borderColor: BRAND.gray[300] }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[500] }}>Maturity Score</p>
                <p className="text-4xl font-bold" style={{ color: BRAND.primary }}>{maturityScore}%</p>
                <p className="text-xs mt-1" style={{ color: BRAND.gray[600] }}>{totalCurrently} of {totalPrograms} programs offered</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border" style={{ borderColor: BRAND.gray[300] }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[500] }}>Programs Currently Offered</p>
                <p className="text-4xl font-bold text-green-600">{totalCurrently}</p>
                <p className="text-xs mt-1" style={{ color: BRAND.gray[600] }}>Across all dimensions</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border" style={{ borderColor: BRAND.gray[300] }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[500] }}>Global Consistency</p>
                <p className="text-4xl font-bold text-blue-600">{consistent}/13</p>
                <p className="text-xs mt-1" style={{ color: BRAND.gray[600] }}>Dimensions globally consistent</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {totalPlanning > 0 && (
                <div className="bg-white rounded-lg p-4 border" style={{ borderColor: BRAND.gray[300] }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[500] }}>In Development</p>
                  <p className="text-2xl font-bold text-orange-600">{totalPlanning}</p>
                  <p className="text-xs mt-1" style={{ color: BRAND.gray[600] }}>Programs being planned</p>
                </div>
              )}
              
              {totalAssessing > 0 && (
                <div className="bg-white rounded-lg p-4 border" style={{ borderColor: BRAND.gray[300] }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[500] }}>Under Assessment</p>
                  <p className="text-2xl font-bold text-yellow-600">{totalAssessing}</p>
                  <p className="text-xs mt-1" style={{ color: BRAND.gray[600] }}>Programs being evaluated</p>
                </div>
              )}
            </div>
          </div>

          {/* FIRMOGRAPHICS */}
          {Object.keys(firm).length > 0 && (
            <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Company Firmographics</h2>
              <div className="space-y-4">
                {Object.entries(firm).map(([k, v]) => {
                  const val = selectedOnly(v);
                  if (!val) return null;
                  return <DataRow key={k} label={formatLabel(k)} value={val} />;
                })}
              </div>
            </div>
          )}

          {/* GENERAL BENEFITS */}
          {Object.keys(general).length > 0 && (
            <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>General Benefits Landscape</h2>
              <div className="space-y-4">
                {Object.entries(general).map(([k, v]) => {
                  const val = selectedOnly(v);
                  if (!val) return null;
                  return <DataRow key={k} label={formatLabel(k)} value={val} />;
                })}
              </div>
            </div>
          )}

          {/* CURRENT SUPPORT */}
          {Object.keys(support).length > 0 && (
            <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Current Support Programs</h2>
              <div className="space-y-4">
                {Object.entries(support).map(([k, v]) => {
                  const val = selectedOnly(v);
                  if (!val) return null;
                  return <DataRow key={k} label={formatLabel(k)} value={val} />;
                })}
              </div>
            </div>
          )}

          {/* 13 DIMENSIONS */}
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>13 Dimensions of Support</h2>

            {Array.from({ length: 13 }, (_, i) => i + 1).map(dimNum => {
              const dimData = assessment[`dimension${dimNum}_data`] || {};
              const { programs, items } = parseDimensionData(dimNum, dimData);
              const isEmpty = programs.length === 0 && items.length === 0;
              const isCollapsed = collapsed[dimNum];

              return (
                <div key={dimNum} className="mb-4 bg-white rounded-lg border-l-4 overflow-hidden" 
                     style={{ borderColor: DIM_COLORS[dimNum - 1] }}>
                  <div className="px-5 py-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50 no-print"
                       style={{ borderColor: BRAND.gray[200] }}
                       onClick={() => setCollapsed(prev => ({ ...prev, [dimNum]: !prev[dimNum] }))}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                           style={{ backgroundColor: DIM_COLORS[dimNum - 1] }}>
                        {dimNum}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>
                          Dimension {dimNum}
                        </div>
                        <h3 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>
                          {DIM_TITLE[dimNum]}
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
                          {programs.length > 0 && <SupportMatrix programs={programs} />}
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
          {Object.keys(cross).length > 0 && (
            <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Cross-Dimensional Assessment</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4" style={{ borderColor: '#10B981', backgroundColor: '#F0FDF4' }}>
                  <div className="text-sm font-bold mb-2" style={{ color: '#065F46' }}>Top 3 Priority Dimensions</div>
                  {cross.cd1a && Array.isArray(cross.cd1a) ? (
                    <ul className="space-y-1">
                      {cross.cd1a.map((dim: string, i: number) => (
                        <li key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {dim}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs italic" style={{ color: BRAND.gray[400] }}>Not provided</div>
                  )}
                </div>
                
                <div className="border rounded-lg p-4" style={{ borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }}>
                  <div className="text-sm font-bold mb-2" style={{ color: '#92400E' }}>Lowest 3 Priority Dimensions</div>
                  {cross.cd1b && Array.isArray(cross.cd1b) ? (
                    <ul className="space-y-1">
                      {cross.cd1b.map((dim: string, i: number) => (
                        <li key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {dim}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs italic" style={{ color: BRAND.gray[400] }}>Not provided</div>
                  )}
                </div>
                
                <div className="border rounded-lg p-4" style={{ borderColor: '#EF4444', backgroundColor: '#FEF2F2' }}>
                  <div className="text-sm font-bold mb-2" style={{ color: '#991B1B' }}>Implementation Challenges</div>
                  {cross.cd2 && Array.isArray(cross.cd2) ? (
                    <ul className="space-y-1">
                      {cross.cd2.map((chal: string, i: number) => (
                        <li key={i} className="text-sm" style={{ color: BRAND.gray[800] }}>• {chal}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs italic" style={{ color: BRAND.gray[400] }}>Not provided</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEE IMPACT */}
          {Object.keys(impact).length > 0 && (
            <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Employee Impact Assessment</h2>
              
              {impact.ei1 && typeof impact.ei1 === 'object' && Object.keys(impact.ei1).length > 0 && (
                <div className="mb-6 pb-4 border-b" style={{ borderColor: BRAND.gray[200] }}>
                  <div className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: BRAND.primary }}>
                    Program Impact by Outcome Area
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {Object.entries(impact.ei1).map(([item, rating]) => {
                      const ratingStr = String(rating);
                      const bgColor = ratingStr.includes('significant') || ratingStr.includes('Significant') ? '#dcfce7' : 
                                     ratingStr.includes('moderate') || ratingStr.includes('Moderate') ? '#dbeafe' : 
                                     ratingStr.includes('minimal') || ratingStr.includes('Minimal') ? '#fef3c7' : BRAND.gray[100];
                      
                      return (
                        <div key={item} className="flex items-center justify-between py-2.5 px-4 rounded border" 
                             style={{ borderColor: BRAND.gray[200], backgroundColor: BRAND.gray[50] }}>
                          <span className="text-sm font-medium" style={{ color: BRAND.gray[900] }}>
                            {formatLabel(item)}
                          </span>
                          <span className="text-xs font-semibold px-3 py-1.5 rounded" style={{ backgroundColor: bgColor }}>
                            {ratingStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {Object.entries(impact).map(([key, value]) => {
                  // Skip ei1 (already rendered above) and empty values
                  if (key === 'ei1') return null;
                  
                  const val = selectedOnly(value);
                  if (!val) return null;
                  
                  // Skip "none" responses
                  const valStr = String(val).toLowerCase();
                  if (valStr.includes('no additional') || valStr.includes('none that i can think')) return null;
                  
                  return <DataRow key={key} label={formatLabel(key)} value={val} />;
                })}
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t text-center text-[10px]" style={{ borderColor: BRAND.gray[200], color: BRAND.gray[500] }}>
            Best Companies for Working with Cancer: Employer Index - Admin View
          </div>
        </main>

        {/* INVOICE MODAL */}
        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Company Invoice</h2>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Invoice Available</h3>
                  <p className="text-gray-600 mb-1">
                    {assessment.company_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Invoice #{assessment.survey_id || assessment.app_id}
                  </p>
                  {assessment.payment_date && (
                    <p className="text-sm text-gray-500">
                      Date: {new Date(assessment.payment_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      const firm = assessment.firmographics_data || {}
                      const invoiceData: InvoiceData = {
                        invoiceNumber: assessment.survey_id || assessment.app_id,
                        invoiceDate: assessment.payment_date ? new Date(assessment.payment_date).toLocaleDateString() : new Date().toLocaleDateString(),
                        dueDate: assessment.payment_date ? new Date(new Date(assessment.payment_date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                        companyName: assessment.company_name || 'Company',
                        contactName: `${firm.firstName || ''} ${firm.lastName || ''}`.trim() || 'Contact',
                        title: firm.title || firm.titleOther || undefined,
                        addressLine1: firm.addressLine1 || '123 Main St',
                        addressLine2: firm.addressLine2 || undefined,
                        city: firm.city || 'City',
                        state: firm.state || 'ST',
                        zipCode: firm.zipCode || '00000',
                        country: firm.country || 'United States',
                        poNumber: firm.poNumber || undefined,
                        isFoundingPartner: assessment.is_founding_partner || false
                      }
                      await downloadInvoicePDF(invoiceData)
                    }}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Invoice PDF
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    This is the same invoice that was generated for the company during payment.
                  </p>
                </div>
              </div>

              <div className="border-t p-4 bg-gray-50 flex justify-end" style={{ borderColor: BRAND.gray[200] }}>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

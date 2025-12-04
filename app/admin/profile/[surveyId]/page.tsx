'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { generateInvoicePDF, downloadInvoicePDF, type InvoiceData } from '@/lib/invoice-generator';

// ============================================
// BRAND COLORS
// ============================================
const BRAND = {
  primary: '#7A34A3',      // Purple
  secondary: '#00A896',    // Teal
  accent: '#FF6B35',       // Orange
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gray: {
    900: '#0F172A',
    800: '#1E293B',
    700: '#334155',
    600: '#475569',
    500: '#64748B',
    400: '#94A3B8',
    300: '#CBD5E1',
    200: '#E2E8F0',
    100: '#F1F5F9',
    50: '#F8FAFC',
  }
};

// Dimension colors - vibrant but professional
const DIM_COLORS = [
  '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D',
  '#16A34A', '#059669', '#0D9488', '#0891B2', '#0284C7',
  '#2563EB', '#4F46E5', '#7C3AED'
];

const DIM_TITLES: Record<number, string> = {
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

// ============================================
// FIELD LABELS - Comprehensive mapping
// ============================================
const FIELD_LABELS: Record<string, string> = {
  // Authorization & Contact
  companyName: 'Company Name',
  firstName: 'First Name',
  lastName: 'Last Name',
  title: 'Title',
  titleOther: 'Title',
  
  // Screener Questions
  s1: 'Birth Year',
  s2: 'Gender Identity',
  s2_other: 'Gender Identity',
  s3: 'Employment Status',
  s4a: 'Department/Function',
  s4a_other: 'Department/Function (Other)',
  s4b: 'Primary Job Function',
  s4b_other: 'Primary Job Function (Other)',
  s5: 'Organization Level',
  s6: 'Areas of Responsibility',
  s7: 'Influence on Benefits Decisions',
  s8: 'Total Employees',
  s9: 'Headquarters Location',
  s9a: 'Countries with Operations',
  
  // Authorization
  au1: 'Authorization Confirmation',
  au2: 'Authorization Description',
  
  // Classification
  c2: 'Industry',
  c3: 'Benefits Eligibility',
  c3a: 'Employee Groups Excluded',
  c4: 'Annual Revenue',
  c5: 'Annual Revenue',
  c6: 'Remote/Hybrid Work Approach',
  
  // General Benefits - CB1 Categories
  cb1: 'Current Benefits',
  cb1_standard: 'Standard Benefits',
  cb1_leave: 'Leave & Flexibility Programs',
  cb1_wellness: 'Wellness & Support Programs',
  cb1_financial: 'Financial & Legal Assistance',
  cb1_navigation: 'Care Navigation & Support',
  cb1a: 'Employees with National Healthcare Access',
  cb2b: 'Benefits Planned for Next 2 Years',
  
  // Current Support - CB3
  cb3a: 'Support Beyond Legal Requirements',
  cb3b: 'Program Structure',
  cb3c: 'Health Conditions Covered',
  cb3d: 'Program Development Method',
  
  // Organization Approach - OR
  or1: 'Current Approach to Support',
  or2a: 'What Triggered Enhanced Support',
  or2b: 'Most Impactful Change Made',
  or3: 'Primary Barriers to Support',
  or5a: 'Caregiver Support Provided',
  or6: 'How Effectiveness is Monitored',
  or6_other: 'Other Monitoring Methods',
  
  // Cross-Dimensional
  cd1a: 'Top Priority Dimensions',
  cd1b: 'Lowest Priority Dimensions',
  cd2: 'Biggest Implementation Challenges',
  cd2_other: 'Other Challenges',
  
  // Employee Impact
  ei1: 'Program Impact by Outcome',
  ei2: 'ROI Measurement Status',
  ei3: 'Approximate ROI',
  ei4: 'Advice for Other HR Leaders',
  ei5: 'Important Aspects Not Addressed',
  
  // Dimension-specific labels
  d1a: 'Medical Leave & Flexibility Programs',
  d1aa: 'Geographic Consistency',
  d1b: 'Additional Medical Leave Benefits',
  d1_1: 'Additional Paid Medical Leave Duration',
  d1_1_usa: 'Additional Paid Leave (USA)',
  d1_1_non_usa: 'Additional Paid Leave (Non-USA)',
  d1_2: 'Additional Intermittent Leave',
  d1_2_usa: 'Intermittent Leave (USA)',
  d1_2_non_usa: 'Intermittent Leave (Non-USA)',
  d1_4a: 'Additional Remote Work Time',
  d1_4a_type: 'Remote Work Duration',
  d1_4b: 'Reduced Schedule Duration',
  d1_5: 'Job Protection Duration',
  d1_5_usa: 'Job Protection (USA)',
  d1_5_non_usa: 'Job Protection (Non-USA)',
  d1_6: 'Disability Pay Enhancement',
  
  d2a: 'Insurance & Financial Programs',
  d2aa: 'Geographic Consistency',
  d2b: 'Additional Insurance Benefits',
  
  d3a: 'Manager Training Programs',
  d3aa: 'Geographic Consistency',
  d3b: 'Additional Manager Initiatives',
  d3_1a: 'Training Requirement',
  d3_1: 'Manager Training Completion Rate',
  
  d4a: 'Navigation & Expert Resources',
  d4aa: 'Geographic Consistency',
  d4b: 'Additional Navigation Resources',
  d4_1a: 'Navigation Provider',
  d4_1b: 'Navigation Services Available',
  
  d5a: 'Workplace Accommodations',
  d5aa: 'Geographic Consistency',
  d5b: 'Additional Accommodations',
  
  d6a: 'Culture & Psychological Safety',
  d6aa: 'Geographic Consistency',
  d6b: 'Additional Culture Supports',
  d6_2: 'How Psychological Safety is Measured',
  
  d7a: 'Career Continuity Programs',
  d7aa: 'Geographic Consistency',
  d7b: 'Additional Career Supports',
  
  d8a: 'Work Continuation Programs',
  d8aa: 'Geographic Consistency',
  d8b: 'Additional Work Resumption Supports',
  
  d9a: 'Executive Commitment',
  d9aa: 'Geographic Consistency',
  d9b: 'Additional Executive Practices',
  
  d10a: 'Caregiver & Family Support',
  d10aa: 'Geographic Consistency',
  d10b: 'Additional Caregiver Benefits',
  
  d11a: 'Prevention & Wellness Programs',
  d11aa: 'Geographic Consistency',
  d11b: 'Additional Prevention Initiatives',
  d11_1: 'Early Detection Services at 100% Coverage',
  
  d12a: 'Continuous Improvement Metrics',
  d12aa: 'Geographic Consistency',
  d12b: 'Additional Measurement Practices',
  d12_1: 'Individual Experience Review Process',
  d12_2: 'Changes from Employee Experiences',
  
  d13a: 'Communication Approaches',
  d13aa: 'Geographic Consistency',
  d13b: 'Additional Communication Methods',
  d13_1: 'Communication Frequency',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getLabel(key: string): string {
  // Clean up the key
  const cleanKey = key.replace(/^[Qq]/, '');
  
  // Check direct mapping
  if (FIELD_LABELS[cleanKey]) return FIELD_LABELS[cleanKey];
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  
  // Format as readable label
  return cleanKey
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Get the "Other" value if it exists
function getOtherValue(data: any, key: string): string | null {
  if (!data) return null;
  
  // Check for _other suffix
  const otherKey = `${key}_other`;
  if (data[otherKey] && typeof data[otherKey] === 'string' && data[otherKey].trim()) {
    return data[otherKey].trim();
  }
  
  // Check for Other key
  const otherKey2 = `${key}Other`;
  if (data[otherKey2] && typeof data[otherKey2] === 'string' && data[otherKey2].trim()) {
    return data[otherKey2].trim();
  }
  
  return null;
}

// Format a value for display, handling "Other" cases
function formatValue(value: any, data?: any, key?: string): string | string[] | null {
  if (value === null || value === undefined) return null;
  
  // Handle arrays
  if (Array.isArray(value)) {
    const formatted = value.map(v => {
      const str = String(v).trim();
      // Replace "Other (specify)" with actual typed value if available
      if (str.toLowerCase().includes('other') && data && key) {
        const otherVal = getOtherValue(data, key);
        if (otherVal) return otherVal;
      }
      return str;
    }).filter(v => v !== '');
    return formatted.length > 0 ? formatted : null;
  }
  
  // Handle objects
  if (typeof value === 'object') {
    return null; // Will be handled separately
  }
  
  // Handle strings
  const str = String(value).trim();
  if (str === '') return null;
  
  // If value is "Other", try to get the actual typed value
  if (str.toLowerCase() === 'other' && data && key) {
    const otherVal = getOtherValue(data, key);
    if (otherVal) return otherVal;
  }
  
  return str;
}

// Normalize status for display
function normalizeStatus(status: string): { text: string; color: string; bg: string } {
  const s = status.toLowerCase();
  
  if (s.includes('currently') || s.includes('offer') || s.includes('provide') || s.includes('use')) {
    return { text: 'Currently Offering', color: '#166534', bg: '#DCFCE7' };
  }
  if (s.includes('planning') || s.includes('development')) {
    return { text: 'In Development', color: '#9A3412', bg: '#FED7AA' };
  }
  if (s.includes('assessing') || s.includes('feasibility')) {
    return { text: 'Under Assessment', color: '#A16207', bg: '#FEF3C7' };
  }
  if (s.includes('not able')) {
    return { text: 'Not Currently Feasible', color: '#991B1B', bg: '#FEE2E2' };
  }
  if (s.includes('unsure')) {
    return { text: 'Undetermined', color: '#6B7280', bg: '#F3F4F6' };
  }
  
  return { text: status, color: BRAND.gray[700], bg: BRAND.gray[100] };
}

// ============================================
// COMPONENTS
// ============================================

function StatCard({ label, value, color = BRAND.primary, subtext }: { 
  label: string; 
  value: string | number; 
  color?: string; 
  subtext?: string 
}) {
  return (
    <div className="bg-white rounded-xl border-2 p-5 text-center shadow-sm" style={{ borderColor: color }}>
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.gray[500] }}>{label}</p>
      <p className="text-4xl font-black" style={{ color }}>{value}</p>
      {subtext && <p className="text-xs mt-1" style={{ color: BRAND.gray[600] }}>{subtext}</p>}
    </div>
  );
}

function InfoCard({ title, children, accent = BRAND.primary }: { 
  title: string; 
  children: React.ReactNode; 
  accent?: string 
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: BRAND.gray[200] }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: BRAND.gray[200], backgroundColor: BRAND.gray[50] }}>
        <h3 className="font-bold text-sm" style={{ color: BRAND.gray[900] }}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DataField({ label, value, fullWidth = false }: { 
  label: string; 
  value: string | string[] | null; 
  fullWidth?: boolean 
}) {
  if (!value) return null;
  
  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[500] }}>
        {label}
      </p>
      {Array.isArray(value) ? (
        <ul className="space-y-1">
          {value.map((v, i) => (
            <li key={i} className="text-sm flex items-start" style={{ color: BRAND.gray[800] }}>
              <span className="mr-2" style={{ color: BRAND.primary }}>•</span>
              {v}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm" style={{ color: BRAND.gray[800] }}>{value}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { text, color, bg } = normalizeStatus(status);
  return (
    <span 
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: bg, color }}
    >
      {text}
    </span>
  );
}

// ============================================
// DIMENSION COMPONENT
// ============================================

function DimensionSection({ 
  dimNum, 
  dimData, 
  color,
  isCollapsed,
  onToggle 
}: { 
  dimNum: number; 
  dimData: any; 
  color: string;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const title = DIM_TITLES[dimNum];
  const mainGridKey = `d${dimNum}a`;
  const mainGrid = dimData?.[mainGridKey] || {};
  
  // Count programs by status
  let currentCount = 0, planningCount = 0, assessingCount = 0;
  Object.values(mainGrid).forEach((status: any) => {
    if (typeof status === 'string') {
      const s = status.toLowerCase();
      if (s.includes('currently') || s.includes('offer') || s.includes('provide')) currentCount++;
      else if (s.includes('planning') || s.includes('development')) planningCount++;
      else if (s.includes('assessing')) assessingCount++;
    }
  });
  
  const totalPrograms = Object.keys(mainGrid).length;
  const hasData = totalPrograms > 0;
  
  // Get follow-up questions
  const followUpItems: Array<{ label: string; value: any }> = [];
  Object.keys(dimData || {}).forEach(key => {
    if (key === mainGridKey) return;
    if (!key.startsWith(`d${dimNum}`)) return;
    
    const value = dimData[key];
    if (!value) return;
    
    // Skip empty strings and null
    if (typeof value === 'string' && !value.trim()) return;
    if (Array.isArray(value) && value.length === 0) return;
    
    // Skip "none" responses
    const strVal = String(value).toLowerCase();
    if (strVal.includes('no other') || strVal.includes('none')) return;
    
    // Get the label and format the value
    const label = getLabel(key);
    const formattedValue = formatValue(value, dimData, key);
    
    if (formattedValue) {
      followUpItems.push({ label, value: formattedValue });
    }
  });

  return (
    <div 
      className="bg-white rounded-xl border overflow-hidden shadow-sm mb-4"
      style={{ borderColor: BRAND.gray[200], borderLeftWidth: '4px', borderLeftColor: color }}
    >
      {/* Header */}
      <div 
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
            style={{ backgroundColor: color }}
          >
            {dimNum}
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: BRAND.gray[900] }}>{title}</h3>
            {hasData && (
              <div className="flex items-center gap-3 mt-1">
                {currentCount > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    {currentCount} Currently Offered
                  </span>
                )}
                {planningCount > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    {planningCount} In Development
                  </span>
                )}
                {assessingCount > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                    {assessingCount} Under Assessment
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <svg 
          className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: BRAND.gray[400] }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: BRAND.gray[100] }}>
          {!hasData ? (
            <div className="text-center py-8">
              <p className="text-sm italic" style={{ color: BRAND.gray[400] }}>
                No responses recorded for this dimension
              </p>
            </div>
          ) : (
            <>
              {/* Program Grid */}
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: BRAND.gray[500] }}>
                  Program Status Overview
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: BRAND.gray[50] }}>
                        <th className="px-4 py-2 text-left text-xs font-bold" style={{ color: BRAND.gray[600] }}>Program / Initiative</th>
                        <th className="px-4 py-2 text-left text-xs font-bold" style={{ color: BRAND.gray[600] }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(mainGrid).map(([program, status], idx) => (
                        <tr 
                          key={idx} 
                          className="border-t"
                          style={{ borderColor: BRAND.gray[100] }}
                        >
                          <td className="px-4 py-3 text-sm" style={{ color: BRAND.gray[800] }}>{program}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={String(status)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Follow-up Questions */}
              {followUpItems.length > 0 && (
                <div className="mt-6 pt-4 border-t" style={{ borderColor: BRAND.gray[100] }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: BRAND.gray[500] }}>
                    Additional Details
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followUpItems.map((item, idx) => (
                      <DataField 
                        key={idx} 
                        label={item.label} 
                        value={item.value}
                        fullWidth={Array.isArray(item.value) && item.value.length > 3}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

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
      
      console.log('📊 Assessment loaded:', {
        company: data?.company_name,
        hasFirmographics: !!data?.firmographics_data,
        hasGeneral: !!data?.general_benefits_data,
        hasDimensions: !!data?.dimension1_data
      });
      
      setAssessment(data);
    } catch (error) {
      console.error('Error fetching assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.gray[50] }}>
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: BRAND.primary }} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p style={{ color: BRAND.gray[600] }}>Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.gray[50] }}>
        <div className="text-center">
          <p className="text-xl font-bold mb-2" style={{ color: BRAND.gray[900] }}>Assessment Not Found</p>
          <p className="mb-4" style={{ color: BRAND.gray[600] }}>Survey ID: {surveyId}</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: BRAND.primary }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Extract data
  const firm = assessment.firmographics_data || {};
  const general = assessment.general_benefits_data || {};
  const support = assessment.current_support_data || {};
  const cross = assessment.cross_dimensional_data || {};
  const impact = assessment.employee_impact_data || assessment['employee-impact-assessment_data'] || {};

  // Get contact info - check multiple possible locations
  const contactName = `${firm.firstName || ''} ${firm.lastName || ''}`.trim() || 'Not provided';
  const contactTitle = firm.title || firm.titleOther || 'Not provided';
  const contactEmail = assessment.email || 'Not provided';

  // Calculate summary stats
  let totalCurrently = 0, totalPlanning = 0, totalAssessing = 0;
  for (let i = 1; i <= 13; i++) {
    const gridData = assessment[`dimension${i}_data`]?.[`d${i}a`];
    if (gridData && typeof gridData === 'object') {
      Object.values(gridData).forEach((status: any) => {
        if (typeof status === 'string') {
          const s = status.toLowerCase();
          if (s.includes('currently') || s.includes('offer') || s.includes('provide')) totalCurrently++;
          else if (s.includes('planning') || s.includes('development')) totalPlanning++;
          else if (s.includes('assessing')) assessingCount++;
        }
      });
    }
  }
  
  const totalPrograms = totalCurrently + totalPlanning + totalAssessing;
  const maturityScore = totalPrograms > 0 ? Math.round((totalCurrently / totalPrograms) * 100) : 0;

  // Geographic consistency
  let consistent = 0;
  for (let i = 1; i <= 13; i++) {
    const aa = assessment[`dimension${i}_data`]?.[`d${i}aa`];
    if (aa?.toLowerCase().includes('consistent')) consistent++;
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
      
      <div className="min-h-screen" style={{ backgroundColor: BRAND.gray[50] }}>
        <main className="max-w-7xl mx-auto px-6 py-8">
          
          {/* HEADER */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <Image src="/BI_LOGO_FINAL.png" alt="Beyond Insights" width={180} height={54} />
              <div className="flex gap-3 no-print">
                <button
                  onClick={() => router.push('/admin')}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm"
                  style={{ backgroundColor: BRAND.success }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>
            
            {/* Company Title Banner */}
            <div 
              className="rounded-2xl p-8 text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, #5B21B6 100%)` }}
            >
              <p className="text-sm font-medium opacity-80 mb-1">Best Companies for Working with Cancer Index</p>
              <h1 className="text-3xl md:text-4xl font-black mb-4">
                {assessment.company_name || 'Company Profile'}
              </h1>
              <div className="flex flex-wrap gap-6 text-sm opacity-90">
                <div>
                  <span className="opacity-70">Survey ID:</span> {surveyId}
                </div>
                <div>
                  <span className="opacity-70">Contact:</span> {contactName}
                </div>
                <div>
                  <span className="opacity-70">Title:</span> {contactTitle}
                </div>
              </div>
            </div>
          </header>

          {/* EXECUTIVE SUMMARY */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: BRAND.gray[900] }}>Executive Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard 
                label="Support Maturity" 
                value={`${maturityScore}%`}
                color={BRAND.primary}
                subtext={`${totalCurrently} of ${totalPrograms} programs active`}
              />
              <StatCard 
                label="Currently Offering" 
                value={totalCurrently}
                color={BRAND.success}
                subtext="Programs in place"
              />
              <StatCard 
                label="In Development" 
                value={totalPlanning}
                color={BRAND.warning}
                subtext="Programs planned"
              />
              <StatCard 
                label="Global Consistency" 
                value={`${consistent}/13`}
                color={BRAND.secondary}
                subtext="Dimensions consistent"
              />
            </div>
          </section>

          {/* COMPANY INFORMATION */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: BRAND.gray[900] }}>Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard title="Contact Details">
                <div className="grid grid-cols-2 gap-4">
                  <DataField label="Contact Person" value={contactName} />
                  <DataField label="Email" value={contactEmail} />
                  <DataField label="Title" value={contactTitle} />
                  <DataField label="Industry" value={formatValue(firm.c2, firm, 'c2') as string} />
                </div>
              </InfoCard>
              <InfoCard title="Organization Profile">
                <div className="grid grid-cols-2 gap-4">
                  <DataField label="Total Employees" value={formatValue(firm.s8, firm, 's8') as string} />
                  <DataField label="Headquarters" value={formatValue(firm.s9, firm, 's9') as string} />
                  <DataField label="Countries of Operation" value={formatValue(firm.s9a, firm, 's9a') as string} />
                  <DataField label="Annual Revenue" value={formatValue(firm.c4 || firm.c5, firm, 'c4') as string} />
                </div>
              </InfoCard>
            </div>
          </section>

          {/* PAYMENT INFO - if invoice selected */}
          {assessment.payment_completed && assessment.payment_method === 'invoice' && (
            <section className="mb-8">
              <div className="bg-white rounded-xl border p-5 flex items-center justify-between" style={{ borderColor: BRAND.gray[200] }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DCFCE7' }}>
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: BRAND.gray[900] }}>Payment: Invoice Selected</p>
                    <p className="text-sm" style={{ color: BRAND.gray[600] }}>
                      Date: {assessment.payment_date ? new Date(assessment.payment_date).toLocaleDateString() : 'N/A'}
                      {assessment.is_founding_partner ? ' • Founding Partner (Fee Waived)' : ' • Amount: $1,250.00'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="px-5 py-2.5 text-white rounded-lg font-medium flex items-center gap-2 no-print"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Invoice
                </button>
              </div>
            </section>
          )}

          {/* CURRENT BENEFITS LANDSCAPE */}
          {Object.keys(general).length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: BRAND.gray[900] }}>Current Benefits Landscape</h2>
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: BRAND.gray[200] }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(general).map(([key, value]) => {
                    const formattedValue = formatValue(value, general, key);
                    if (!formattedValue) return null;
                    return (
                      <DataField 
                        key={key} 
                        label={getLabel(key)} 
                        value={formattedValue}
                        fullWidth={Array.isArray(formattedValue) && formattedValue.length > 5}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* CURRENT SUPPORT PROGRAMS */}
          {Object.keys(support).length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: BRAND.gray[900] }}>Current Support Programs</h2>
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: BRAND.gray[200] }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(support).map(([key, value]) => {
                    const formattedValue = formatValue(value, support, key);
                    if (!formattedValue) return null;
                    return (
                      <DataField 
                        key={key} 
                        label={getLabel(key)} 
                        value={formattedValue}
                        fullWidth={Array.isArray(formattedValue) && formattedValue.length > 5}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* 13 DIMENSIONS */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: BRAND.gray[900] }}>13 Dimensions of Support</h2>
            {Array.from({ length: 13 }, (_, i) => i + 1).map(dimNum => (
              <DimensionSection
                key={dimNum}
                dimNum={dimNum}
                dimData={assessment[`dimension${dimNum}_data`] || {}}
                color={DIM_COLORS[dimNum - 1]}
                isCollapsed={collapsed[dimNum] ?? false}
                onToggle={() => setCollapsed(prev => ({ ...prev, [dimNum]: !prev[dimNum] }))}
              />
            ))}
          </section>

          {/* CROSS-DIMENSIONAL ASSESSMENT */}
          {Object.keys(cross).length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: BRAND.gray[900] }}>Cross-Dimensional Assessment</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cross.cd1a && Array.isArray(cross.cd1a) && (
                  <InfoCard title="Top Priority Dimensions" accent={BRAND.success}>
                    <ul className="space-y-2">
                      {cross.cd1a.map((dim: string, i: number) => (
                        <li key={i} className="flex items-start text-sm" style={{ color: BRAND.gray[800] }}>
                          <span className="mr-2 font-bold text-green-600">{i + 1}.</span>
                          {dim}
                        </li>
                      ))}
                    </ul>
                  </InfoCard>
                )}
                {cross.cd1b && Array.isArray(cross.cd1b) && (
                  <InfoCard title="Lowest Priority Dimensions" accent={BRAND.warning}>
                    <ul className="space-y-2">
                      {cross.cd1b.map((dim: string, i: number) => (
                        <li key={i} className="flex items-start text-sm" style={{ color: BRAND.gray[800] }}>
                          <span className="mr-2 font-bold text-orange-600">{i + 1}.</span>
                          {dim}
                        </li>
                      ))}
                    </ul>
                  </InfoCard>
                )}
                {cross.cd2 && Array.isArray(cross.cd2) && (
                  <InfoCard title="Implementation Challenges" accent={BRAND.error}>
                    <ul className="space-y-2">
                      {cross.cd2.map((chal: string, i: number) => (
                        <li key={i} className="flex items-start text-sm" style={{ color: BRAND.gray[800] }}>
                          <span className="mr-2" style={{ color: BRAND.error }}>•</span>
                          {chal}
                        </li>
                      ))}
                    </ul>
                  </InfoCard>
                )}
              </div>
            </section>
          )}

          {/* EMPLOYEE IMPACT ASSESSMENT */}
          {Object.keys(impact).length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: BRAND.gray[900] }}>Employee Impact Assessment</h2>
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: BRAND.gray[200] }}>
                
                {/* Impact Ratings Grid */}
                {impact.ei1 && typeof impact.ei1 === 'object' && (
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: BRAND.gray[500] }}>
                      Program Impact by Outcome Area
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(impact.ei1).map(([outcome, rating]) => {
                        const ratingStr = String(rating).toLowerCase();
                        let bgColor = BRAND.gray[100];
                        let textColor = BRAND.gray[700];
                        
                        if (ratingStr.includes('significant')) {
                          bgColor = '#DCFCE7'; textColor = '#166534';
                        } else if (ratingStr.includes('moderate')) {
                          bgColor = '#DBEAFE'; textColor = '#1E40AF';
                        } else if (ratingStr.includes('minimal')) {
                          bgColor = '#FEF3C7'; textColor = '#92400E';
                        }
                        
                        return (
                          <div 
                            key={outcome}
                            className="flex items-center justify-between p-3 rounded-lg"
                            style={{ backgroundColor: BRAND.gray[50] }}
                          >
                            <span className="text-sm font-medium" style={{ color: BRAND.gray[800] }}>
                              {getLabel(outcome)}
                            </span>
                            <span 
                              className="text-xs font-semibold px-3 py-1 rounded-full"
                              style={{ backgroundColor: bgColor, color: textColor }}
                            >
                              {String(rating).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Other impact fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(impact).map(([key, value]) => {
                    if (key === 'ei1') return null;
                    const formattedValue = formatValue(value, impact, key);
                    if (!formattedValue) return null;
                    
                    // Skip "none" responses
                    const strVal = String(formattedValue).toLowerCase();
                    if (strVal.includes('no additional') || strVal.includes('none that')) return null;
                    
                    return (
                      <DataField 
                        key={key} 
                        label={getLabel(key)} 
                        value={formattedValue}
                        fullWidth={true}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* FOOTER */}
          <footer className="text-center py-8 border-t" style={{ borderColor: BRAND.gray[200] }}>
            <p className="text-xs" style={{ color: BRAND.gray[500] }}>
              Best Companies for Working with Cancer Index • Company Profile Report
            </p>
            <p className="text-xs mt-1" style={{ color: BRAND.gray[400] }}>
              Generated {new Date().toLocaleDateString()} • Survey ID: {surveyId}
            </p>
          </footer>

        </main>

        {/* INVOICE MODAL */}
        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div 
                className="p-6 text-white"
                style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, #5B21B6 100%)` }}
              >
                <h2 className="text-xl font-bold">Company Invoice</h2>
                <p className="text-sm opacity-80 mt-1">{assessment.company_name}</p>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#F3E8FF' }}
                  >
                    <svg className="w-8 h-8" style={{ color: BRAND.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: BRAND.gray[600] }}>
                    Invoice #{assessment.survey_id || assessment.app_id}
                  </p>
                </div>
                
                <button
                  onClick={async () => {
                    const invoiceData: InvoiceData = {
                      invoiceNumber: assessment.survey_id || assessment.app_id,
                      invoiceDate: assessment.payment_date ? new Date(assessment.payment_date).toLocaleDateString() : new Date().toLocaleDateString(),
                      dueDate: assessment.payment_date ? new Date(new Date(assessment.payment_date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                      companyName: assessment.company_name || 'Company',
                      contactName: contactName !== 'Not provided' ? contactName : 'Contact',
                      title: contactTitle !== 'Not provided' ? contactTitle : undefined,
                      addressLine1: firm.addressLine1 || '(Address not on file)',
                      addressLine2: firm.addressLine2 || undefined,
                      city: firm.city || '',
                      state: firm.state || '',
                      zipCode: firm.zipCode || '',
                      country: firm.country || 'United States',
                      poNumber: firm.poNumber || undefined,
                      isFoundingPartner: assessment.is_founding_partner || false
                    };
                    await downloadInvoicePDF(invoiceData);
                  }}
                  className="w-full py-3 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: BRAND.success }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Invoice PDF
                </button>
              </div>
              
              <div className="px-6 py-4 border-t flex justify-end" style={{ backgroundColor: BRAND.gray[50], borderColor: BRAND.gray[200] }}>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-5 py-2 rounded-lg font-medium"
                  style={{ backgroundColor: BRAND.gray[200], color: BRAND.gray[700] }}
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

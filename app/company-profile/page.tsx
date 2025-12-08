'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

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
  c5: 'Annual Revenue',
  c6: 'Remote/Hybrid Work Policy',
  cb1: 'Standard Benefits Package Overview',
  cb3a: 'Cancer Support Program Characterization',
  cb3b: 'Key Cancer Support Program Features',
  cb3c: 'Conditions Covered by Support Programs',
  or1: 'Current Approach to Supporting Employees',
  or2a: 'Triggers for Enhanced Support',
  or2b: 'Most Impactful Change',
  or3: 'Primary Barriers',
  cd1a: 'Top 3 Priority Dimensions',
  cd1b: 'Bottom 3 Priority Dimensions',
  cd2: 'Implementation Challenges',
  ei1: 'Program Impact by Outcome Area',
  ei2: 'ROI Analysis Status',
  ei3: 'Approximate ROI',
  ei4: 'Advice to Other HR Leaders',
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

function normalizeStatus(s: string | number) {
  // Handle numeric status codes from Founding Partner data
  // 1 = Not able to offer, 2 = Assessing, 3 = Planning, 4 = Currently offer, 5 = Unsure
  const numStatus = typeof s === 'number' ? s : parseInt(String(s));
  if (!isNaN(numStatus)) {
    switch (numStatus) {
      case 4: return 'Currently offer';
      case 3: return 'In active planning / development';
      case 2: return 'Assessing feasibility';
      case 1: return 'Not able to offer in foreseeable future';
      case 5: return 'Unsure';
    }
  }
  
  // Handle text-based statuses
  const x = String(s).toLowerCase();
  if (x.includes('provide to managers')) return 'Currently provide to managers';
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
    
    if (lowerKey === `${prefix}a` && hasProgramStatusMap(value)) {
      Object.entries(value).forEach(([program, status]) => {
        if (status != null && String(status).trim() !== '') {
          programs.push({ program: String(program), status: String(status) });
        }
      });
      return;
    }
    
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
   DOWNLOAD HTML FUNCTION
========================= */
function downloadHTML(data: any) {
  let dimensionsHTML = '';
  
  data.dimensions.forEach((dim: any) => {
    const { programs, items } = parseDimensionData(dim.number, dim.data);
    if (programs.length === 0 && items.length === 0) return;
    
    let options = RESPONSE_OPTIONS;
    if (dim.number === 13) options = RESPONSE_OPTIONS_D13;
    else if (dim.number === 12) options = RESPONSE_OPTIONS_D12;
    else if (dim.number === 3) options = RESPONSE_OPTIONS_D3;
    
    const byStatus: Record<string, Array<string>> = {};
    options.forEach(opt => (byStatus[opt] = []));
    
    programs.forEach(({ program, status }) => {
      const normalized = normalizeStatus(String(status));
      if (!byStatus[normalized]) byStatus[normalized] = [];
      byStatus[normalized].push(program);
    });
    
    const totalPrograms = programs.length;
    const activeStatuses = dim.number === 3 ? ['Currently provide to managers'] :
                          dim.number === 12 ? ['Currently measure / track'] :
                          dim.number === 13 ? ['Currently use'] :
                          ['Currently offer'];
    
    const offeredCount = activeStatuses.reduce((sum, status) => sum + (byStatus[status]?.length || 0), 0);
    const coverage = totalPrograms > 0 ? Math.round((offeredCount / totalPrograms) * 100) : 0;
    
    dimensionsHTML += `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid ${DIM_COLORS[dim.number - 1]};">
        <div style="padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 1rem;">
          <div style="width: 2rem; height: 2rem; border-radius: 50%; background: ${DIM_COLORS[dim.number - 1]}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem;">
            ${dim.number}
          </div>
          <div>
            <div style="font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
              Dimension ${dim.number}
            </div>
            <div style="font-weight: 700; color: #0f172a;">
              ${DIM_TITLE[dim.number]}
            </div>
          </div>
        </div>
        <div style="padding: 1.25rem;">
          ${programs.length > 0 ? `
            <div style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #ea580c;">
                  Support Programs Status
                </div>
                <div style="font-size: 0.75rem; font-weight: 600; background: #f3f4f6; color: #475569; padding: 0.25rem 0.5rem; border-radius: 4px;">
                  ${offeredCount} of ${totalPrograms} active (${coverage}%)
                </div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(${Math.min(options.length, 4)}, 1fr); gap: 0.5rem;">
                ${options.map(option => {
                  const count = byStatus[option]?.length || 0;
                  const borderColor = option.toLowerCase().includes('currently') ? '#10B981' : 
                                     option.toLowerCase().includes('planning') ? '#3B82F6' :
                                     option.toLowerCase().includes('assessing') ? '#F59E0B' : 
                                     option.toLowerCase().includes('unsure') ? '#9CA3AF' :
                                     '#cbd5e1';
                  return `
                    <div style="background: #f9fafb; border-left: 4px solid ${borderColor}; padding: 0.5rem; border-radius: 4px;">
                      <div style="font-size: 0.625rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                        ${option} (${count})
                      </div>
                      ${count > 0 ? 
                        byStatus[option].map(prog => `<div style="font-size: 0.75rem; padding: 0.125rem 0;">• ${prog}</div>`).join('') :
                        '<div style="font-size: 0.75rem; font-style: italic; color: #94a3b8;">None</div>'
                      }
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
          ${items.length > 0 ? `
            <div style="margin-top: 1rem;">
              ${items.map(item => `
                <div style="padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6;">
                  <div style="font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 0.25rem;">
                    ${item.question}
                  </div>
                  <div style="font-size: 0.875rem; color: #0f172a;">
                    ${item.response}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Company Profile - ${data.companyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 2rem; }
    .section { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .section-title { font-size: 1.125rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .field { padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; }
    .field:last-child { border-bottom: none; }
    .field-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.25rem; }
    .field-value { font-size: 1rem; color: #0f172a; }
    @media print { body { padding: 0; } .section { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="color: #7a34a3; font-weight: 800; font-size: 1.5rem;">
          • Company Profile & Assessment Survey Summary •
        </div>
      </div>
      <h1 style="font-size: 2rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">${data.companyName}</h1>
      <div style="color: #64748b; font-size: 0.875rem;">
        ${data.generatedAt}${data.email ? ` • ${data.email}` : ''}
      </div>
      ${data.applicationId ? `
        <div style="color: #64748b; font-size: 0.75rem; margin-top: 0.25rem;">
          Application ID: <span style="font-family: monospace; font-weight: 600;">${data.applicationId}</span>
        </div>
      ` : ''}
    </div>
    
    <div class="grid-2">
      <div class="section">
        <h2 class="section-title">Point of Contact</h2>
        ${Object.entries({
          'Name': `${data.firstName} ${data.lastName}`.trim(),
          'Email': data.email,
          'Department': data.firmographics?.s4a,
          'Function': data.firmographics?.s4b,
          'Level': data.firmographics?.s5
        }).filter(([k,v]) => v).map(([label, value]) => `
          <div class="field">
            <div class="field-label">${label}</div>
            <div class="field-value">${Array.isArray(value) ? value.join(', ') : value}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
        <h2 class="section-title">Company Profile</h2>
        ${Object.entries({
          'Industry': data.firmographics?.c2,
          'Annual Revenue': data.firmographics?.c5,
          'Total Employee Size': data.firmographics?.s8,
          'HQ Location': data.firmographics?.s9,
          'Countries with Presence': data.firmographics?.s9a,
          'Remote/Hybrid Policy': data.firmographics?.c6
        }).filter(([k,v]) => v).map(([label, value]) => `
          <div class="field">
            <div class="field-label">${label}</div>
            <div class="field-value">${Array.isArray(value) ? value.join(', ') : value}</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 1.5rem 0 1rem;">13 Dimensions of Support</h2>
    ${dimensionsHTML}
    
    <div style="text-align: center; padding-top: 2rem; margin-top: 3rem; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 0.75rem;">
      Best Companies for Working with Cancer: Employer Index - Copyright ${new Date().getFullYear()} Cancer and Careers & CEW Foundation
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `company-profile-${data.companyName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
export default function CompanyProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchUserAssessment();
  }, []);

  const fetchUserAssessment = async () => {
    try {
      // ============================================
      // CHECK FOR FOUNDING PARTNER FIRST
      // ============================================
      const surveyId = localStorage.getItem('survey_id') || localStorage.getItem('login_Survey_id') || '';
      const { isFoundingPartner } = await import('@/lib/founding-partners');
      
      if (isFoundingPartner(surveyId)) {
        console.log('Founding Partner detected - loading by app_id:', surveyId);
        
        // Fetch assessment by app_id for FPs
        const { data: assessment, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('app_id', surveyId)
          .single();
        
        if (error) throw error;
        if (!assessment) throw new Error('Assessment not found for FP: ' + surveyId);
        
        // Transform and set data (same as regular user flow below)
        const firmo = assessment.firmographics_data || {};
        const general = assessment.general_benefits_data || {};
        const current = assessment.current_support_data || {};
        const cross = assessment.cross_dimensional_data || {};
        const impact = assessment.employee_impact_data || {};

        const dimensions = [];
        for (let i = 1; i <= 13; i++) {
          dimensions.push({
            number: i,
            data: assessment[`dimension${i}_data`] || {}
          });
        }

        setData({
          companyName: assessment.company_name || firmo.companyName || 'Company',
          email: assessment.email,
          surveyId: assessment.app_id || assessment.survey_id,
          firmo,
          general,
          current,
          dimensions,
          cross,
          impact
        });
        setLoading(false);
        return;
      }
      // ============================================
      
      // REGULAR USERS - Get current user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        router.push('/');
        return;
      }

      console.log('Fetching assessment for:', user.email);

      // Fetch their assessment by EMAIL (more reliable than user_id)
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .single();

      console.log('Assessment result:', assessment, error);

      if (error) throw error;
      if (!assessment) throw new Error('Assessment not found for ' + user.email);

      // Transform data
      const firmo = assessment.firmographics_data || {};
      const dimensions = [];
      for (let i = 1; i <= 13; i++) {
        dimensions.push({
          number: i,
          data: assessment[`dimension${i}_data`] || {}
        });
      }

      setData({
        companyName: assessment.company_name || firmo.companyName || 'Organization',
        email: assessment.email || user.email || '',
        applicationId: assessment.app_id || '',
        firstName: firmo.firstName || '',
        lastName: firmo.lastName || '',
        generatedAt: new Date().toLocaleDateString(),
        firmographics: firmo,
        general: assessment.general_benefits_data || {},
        current: assessment.current_support_data || {},
        cross: assessment.cross_dimensional_data || {},
        impact: assessment.employee_impact_data || {},
        dimensions
      });
    } catch (err: any) {
      console.error('Error fetching assessment:', err);
      setError(err.message || 'Failed to load profile');
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
          <div className="text-sm" style={{ color: BRAND.gray[600] }}>Loading your profile...</div>
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
            onClick={() => router.push('/dashboard')}
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
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <img src="/best-companies-2026-logo.png" alt="Best Companies Award" className="h-24 w-auto" />
          <div className="text-2xl font-black tracking-wide" style={{ color: BRAND.primary }}>
           • Company Profile & Assessment Survey Summary • 
          </div>
          <img src="/cancer-careers-logo.png" alt="Cancer and Careers" className="h-16 w-auto" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-4">
          <h1 className="text-3xl font-black" style={{ color: BRAND.gray[900] }}>{data.companyName}</h1>
          <p className="text-sm mt-1" style={{ color: BRAND.gray[600] }}>
            {data.generatedAt}
            {data.email && ` • ${data.email}`}
            {data.applicationId && (
              <span className="font-mono font-semibold"> • App ID: {data.applicationId}</span>
            )}
          </p>
   
          <div className="mt-4 print:hidden">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-blue-900 font-medium mb-1">📄 Download Option:</p>
              <p className="text-xs text-blue-800">
                Click "Download HTML" to save a clean version of this profile that can be opened in any browser.
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <a href="/dashboard" className="px-4 py-2 text-sm font-semibold border rounded hover:bg-gray-50"
                 style={{ borderColor: BRAND.gray[300], color: BRAND.gray[900] }}>
                ← Back to Dashboard
              </a>
              
              <button 
                onClick={() => downloadHTML(data)} 
                className="px-5 py-2 text-sm font-semibold rounded text-white hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: '#2563eb' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Download HTML
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* POC + COMPANY PROFILE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: BRAND.primary }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-lg font-bold" style={{ color: BRAND.gray[900] }}>Point of Contact</h2>
            </div>
             
            <Field label="Name" value={poc.name} />
            <Field label="Email" value={poc.email} />
            <Field label="Department" value={poc.dept} />
            <Field label="Primary Job Function" value={poc.function} />
            <Field label="Current Level" value={poc.level} />
            <Field label="Areas of Responsibility" value={poc.areas} />
            <Field label="Level of Influence on Benefits" value={poc.influence} />
          </div>

          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: BRAND.primary }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h2 className="text-lg font-bold" style={{ color: BRAND.gray[900] }}>Company Profile</h2>
            </div>
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
          Best Companies for Working with Cancer: Employer Index - Copyright {new Date().getFullYear()} Cancer and Careers & CEW Foundation
        </div>
      </main>
    </div>
  );
}

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
   FIELD LABELS - COMPLETE MAPPING
========================= */
const FIELD_LABELS: Record<string, string> = {
  // Company Info
  companyName: 'Company Name',
  firstName: 'First Name',
  lastName: 'Last Name',
  title: 'Title',
  titleOther: 'Title',
  
  // Screener
  s1: 'Birth Year',
  s2: 'Gender Identity',
  s3: 'Employment Status',
  s4a: 'Department/Function',
  s4b: 'Primary Job Function',
  s5: 'Level in Organization',
  s6: 'Areas of Responsibility',
  s7: 'Influence on Benefits Decisions',
  s8: 'Total Employees',
  s9: 'Headquarters Location',
  s9a: 'Countries with Operations',
  
  // Classification
  c2: 'Industry',
  c3: 'Benefits Eligibility',
  c3a: 'Employee Groups Excluded',
  c4: 'Annual Revenue',
  c5: 'Annual Revenue',
  c6: 'Remote/Hybrid Work Policy',
  
  // General Benefits
  cb1: 'Current Benefits Offered',
  cb1a: 'Employees with National Healthcare Access',
  cb2b: 'Benefits Planned (Next 2 Years)',
  
  // Current Support
  cb3a: 'Support Beyond Legal Requirements',
  cb3b: 'Program Structure',
  cb3c: 'Health Conditions Covered',
  cb3d: 'Program Development Method',
  
  // Organization Approach
  or1: 'Current Approach to Support',
  or2a: 'What Triggered Enhanced Support',
  or2b: 'Most Impactful Change',
  or3: 'Primary Barriers',
  or5a: 'Caregiver Support Types',
  or6: 'Effectiveness Monitoring',
  
  // Cross-Dimensional
  cd1a: 'Top 3 Priority Dimensions',
  cd1b: 'Bottom 3 Priority Dimensions',
  cd2: 'Implementation Challenges',
  
  // Employee Impact
  ei1: 'Program Impact by Outcome Area',
  ei2: 'ROI Analysis Status',
  ei3: 'Approximate ROI',
  ei4: 'Advice for Other HR Leaders',
  ei5: 'Survey Gaps Identified',
  
  // Impact Levels
  'significant': 'Significant positive impact',
  'moderate': 'Moderate positive impact',
  'minimal': 'Minimal positive impact',
  'no_impact': 'No positive impact',
  'unable': 'Unable to assess',
  
  // ============================================
  // DIMENSION FOLLOW-UP QUESTIONS - ALL LABELS
  // ============================================
  
  // Dimension 1 - Medical Leave
  d1aa: 'Geographic Scope',
  d1b: 'Additional Benefits Not Listed',
  d1_1: 'Additional Paid Leave',
  'd1_1_usa': 'Additional Paid Leave (USA)',
  'd1_1_non_usa': 'Additional Paid Leave (Non-USA)',
  d1_2: 'Additional Intermittent Leave',
  'd1_2_usa': 'Intermittent Leave (USA)',
  'd1_2_non_usa': 'Intermittent Leave (Non-USA)',
  d1_4a: 'Remote Work Duration',
  'd1_4a_type': 'Duration Type',
  d1_4b: 'Reduced Schedule with Full Benefits',
  d1_5: 'Job Protection Beyond Legal',
  'd1_5_usa': 'Job Protection (USA)',
  'd1_5_non_usa': 'Job Protection (Non-USA)',
  d1_6: 'Disability Pay Enhancement',
  
  // Dimension 2 - Insurance
  d2aa: 'Geographic Scope',
  d2b: 'Additional Benefits Not Listed',
  
  // Dimension 3 - Manager Training
  d3aa: 'Geographic Scope',
  d3b: 'Additional Initiatives Not Listed',
  d3_1: 'Manager Training Completion Rate',
  d3_1a: 'Training Requirement Type',
  
  // Dimension 4 - Navigation
  d4aa: 'Geographic Scope',
  d4b: 'Additional Resources Not Listed',
  d4_1a: 'Navigation Provider Type',
  d4_1b: 'Navigation Services Available',
  
  // Dimension 5 - Accommodations
  d5aa: 'Geographic Scope',
  d5b: 'Additional Accommodations Not Listed',
  
  // Dimension 6 - Culture
  d6aa: 'Geographic Scope',
  d6b: 'Additional Supports Not Listed',
  d6_2: 'How Psychological Safety is Measured',
  
  // Dimension 7 - Career
  d7aa: 'Geographic Scope',
  d7b: 'Additional Supports Not Listed',
  
  // Dimension 8 - Work Continuation
  d8aa: 'Geographic Scope',
  d8b: 'Additional Supports Not Listed',
  
  // Dimension 9 - Executive
  d9aa: 'Geographic Scope',
  d9b: 'Additional Practices Not Listed',
  
  // Dimension 10 - Caregiver
  d10aa: 'Geographic Scope',
  d10b: 'Additional Benefits Not Listed',
  
  // Dimension 11 - Prevention
  d11aa: 'Geographic Scope',
  d11b: 'Additional Initiatives Not Listed',
  d11_1: 'Early Detection Services at 100% Coverage',
  
  // Dimension 12 - Continuous Improvement
  d12aa: 'Geographic Scope',
  d12b: 'Additional Practices Not Listed',
  d12_1: 'Individual Experience Review Process',
  d12_2: 'Changes from Employee Feedback',
  
  // Dimension 13 - Communication
  d13aa: 'Geographic Scope',
  d13b: 'Additional Methods Not Listed',
  d13_1: 'Communication Frequency',
};

/* =========================
   HELPERS
========================= */
const formatGenericLabel = (key: string) => {
  // Remove dimension prefix patterns like "d1_", "d12_", etc.
  let clean = key.replace(/^d\d+[_]?/i, '');
  
  return clean
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());
};

const formatLabel = (key: string): string => {
  // Normalize key
  const cleanKey = key.replace(/^[Qq]/, '').toLowerCase();
  
  // Direct lookup
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  if (FIELD_LABELS[cleanKey]) return FIELD_LABELS[cleanKey];
  
  // Try with underscores
  const withUnderscores = cleanKey.replace(/([a-z])(\d)/g, '$1_$2');
  if (FIELD_LABELS[withUnderscores]) return FIELD_LABELS[withUnderscores];
  
  // Check all keys for normalized match
  for (const [labelKey, labelValue] of Object.entries(FIELD_LABELS)) {
    if (labelKey.toLowerCase().replace(/_/g, '') === cleanKey.replace(/_/g, '')) {
      return labelValue;
    }
  }
  
  return formatGenericLabel(key);
};

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

/* =========================
   DIMENSION-AWARE STATUS NORMALIZATION
========================= */
function normalizeStatus(s: string | number, dimNumber: number = 0): string {
  // Handle numeric status codes from Founding Partner data
  // 1 = Not able to offer, 2 = Assessing, 3 = Planning, 4 = Currently offer, 5 = Unsure
  const numStatus = typeof s === 'number' ? s : parseInt(String(s));
  
  if (!isNaN(numStatus) && numStatus >= 1 && numStatus <= 5) {
    switch (numStatus) {
      case 4:
        // Dimension-specific "Currently" labels
        if (dimNumber === 3) return 'Currently provide to managers';
        if (dimNumber === 12) return 'Currently measure / track';
        if (dimNumber === 13) return 'Currently use';
        return 'Currently offer';
      case 3: return 'In active planning / development';
      case 2: return 'Assessing feasibility';
      case 1:
        if (dimNumber === 3) return 'Not able to provide in foreseeable future';
        if (dimNumber === 12) return 'Not able to measure / track in foreseeable future';
        if (dimNumber === 13) return 'Not able to utilize in foreseeable future';
        return 'Not able to offer in foreseeable future';
      case 5: return 'Unsure';
    }
  }
  
  // Handle text-based statuses
  const x = String(s).toLowerCase();
  
  // Already dimension-specific
  if (x.includes('provide to managers')) return 'Currently provide to managers';
  if (x.includes('currently measure') || x.includes('currently track')) return 'Currently measure / track';
  if (x.includes('currently use')) return 'Currently use';
  
  // Generic "Currently offer" - APPLY DIMENSION-AWARE CONVERSION
  if (x.includes('currently offer')) {
    if (dimNumber === 3) return 'Currently provide to managers';
    if (dimNumber === 12) return 'Currently measure / track';
    if (dimNumber === 13) return 'Currently use';
    return 'Currently offer';
  }
  
  // Other "currently" variations (without "offer")
  if (x.includes('currently') && !x.includes('provide') && !x.includes('use') && !x.includes('measure') && !x.includes('track')) {
    if (dimNumber === 3) return 'Currently provide to managers';
    if (dimNumber === 12) return 'Currently measure / track';
    if (dimNumber === 13) return 'Currently use';
    return 'Currently offer';
  }
  
  if (x.includes('active') || x.includes('development') || x.includes('planning')) return 'In active planning / development';
  if (x.includes('assessing') || x.includes('feasibility')) return 'Assessing feasibility';
  if (x.includes('unsure')) return 'Unsure';
  
  // "Not able to" variants - dimension-aware
  if (x.includes('not able to measure') || x.includes('not able to track')) return 'Not able to measure / track in foreseeable future';
  if (x.includes('not able to provide')) return 'Not able to provide in foreseeable future';
  if (x.includes('not able to utilize')) return 'Not able to utilize in foreseeable future';
  if (x.includes('not able')) {
    if (dimNumber === 3) return 'Not able to provide in foreseeable future';
    if (dimNumber === 12) return 'Not able to measure / track in foreseeable future';
    if (dimNumber === 13) return 'Not able to utilize in foreseeable future';
    return 'Not able to offer in foreseeable future';
  }
  
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
    
    // Handle the main program status map (d1a, d2a, etc.)
    if (lowerKey === `${prefix}a` && hasProgramStatusMap(value)) {
      Object.entries(value).forEach(([program, status]) => {
        if (status != null && String(status).trim() !== '') {
          // Normalize status with dimension awareness
          const normalizedStatus = normalizeStatus(status, dimNumber);
          programs.push({ program: String(program), status: normalizedStatus });
        }
      });
      return;
    }
    
    // Handle geographic scope (d1aa, d2aa, etc.)
    if (lowerKey === `${prefix}aa` && value) {
      items.push({
        question: 'Geographic Scope',
        response: String(value)
      });
      return;
    }
    
    // EXPLICIT: Handle d#b open-ended follow-up (Additional benefits/supports not listed)
    if (lowerKey === `${prefix}b` && value && typeof value === 'string' && value.trim() !== '') {
      items.push({
        question: formatLabel(key) || 'Additional Items Not Listed',
        response: String(value).trim()
      });
      return;
    }
    
    // Handle other follow-up questions
    if (!key.endsWith('_none') && lowerKey !== `${prefix}a` && lowerKey !== `${prefix}b`) {
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
      // Status is already normalized from parseDimensionData
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(program);
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
              ${items.map(it => `
                <div style="padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6;">
                  <div style="font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 0.25rem;">
                    ${it.question}
                  </div>
                  <div style="font-size: 0.875rem; color: #0f172a;">
                    ${it.response}
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
        ${data.surveyId || ''} • ${data.email || ''}
      </div>
    </div>
    
    <div class="grid-2">
      <div class="section">
        <h2 class="section-title">Point of Contact</h2>
        ${data.firmo?.firstName || data.firmo?.lastName ? `
          <div class="field">
            <div class="field-label">Name</div>
            <div class="field-value">${data.firmo?.firstName || ''} ${data.firmo?.lastName || ''}</div>
          </div>
        ` : ''}
        ${data.firmo?.title ? `
          <div class="field">
            <div class="field-label">Title</div>
            <div class="field-value">${data.firmo?.title}</div>
          </div>
        ` : ''}
        ${data.email ? `
          <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value">${data.email}</div>
          </div>
        ` : ''}
      </div>
      
      <div class="section">
        <h2 class="section-title">Company Profile</h2>
        ${data.firmo?.s8 ? `
          <div class="field">
            <div class="field-label">Total Employees</div>
            <div class="field-value">${data.firmo.s8}</div>
          </div>
        ` : ''}
        ${data.firmo?.s9 ? `
          <div class="field">
            <div class="field-label">Headquarters</div>
            <div class="field-value">${data.firmo.s9}</div>
          </div>
        ` : ''}
        ${data.firmo?.s9a ? `
          <div class="field">
            <div class="field-label">Countries of Operation</div>
            <div class="field-value">${data.firmo.s9a}</div>
          </div>
        ` : ''}
        ${data.firmo?.c2 ? `
          <div class="field">
            <div class="field-label">Industry</div>
            <div class="field-value">${data.firmo.c2}</div>
          </div>
        ` : ''}
        ${data.firmo?.c4 || data.firmo?.c5 ? `
          <div class="field">
            <div class="field-label">Annual Revenue</div>
            <div class="field-value">${data.firmo.c4 || data.firmo.c5}</div>
          </div>
        ` : ''}
        ${data.firmo?.c6 ? `
          <div class="field">
            <div class="field-label">Remote/Hybrid Policy</div>
            <div class="field-value">${data.firmo.c6}</div>
          </div>
        ` : ''}
      </div>
    </div>
    
    <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 1.5rem 0 1rem;">13 Dimensions of Support</h2>
    ${dimensionsHTML}
    
    <div style="text-align: center; padding-top: 2rem; border-top: 1px solid #e5e7eb; margin-top: 2rem; font-size: 0.75rem; color: #64748b;">
      Best Companies for Working with Cancer Index • Company Profile Report<br>
      Generated ${new Date().toLocaleDateString()} • Survey ID: ${data.surveyId || 'N/A'}
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
  
  // Programs already have normalized statuses from parseDimensionData
  programs.forEach(({ program, status }) => {
    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(program);
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
        console.log('Founding Partner detected - loading by survey_id:', surveyId);
        
        // Try BOTH survey_id AND app_id columns for FPs
        let assessment = null;
        
        // First try survey_id
        const { data: bySurveyId } = await supabase
          .from('assessments')
          .select('*')
          .eq('survey_id', surveyId)
          .maybeSingle();
        
        if (bySurveyId) {
          assessment = bySurveyId;
          console.log('Found FP record by survey_id');
        } else {
          // Try app_id as fallback
          const { data: byAppId } = await supabase
            .from('assessments')
            .select('*')
            .eq('app_id', surveyId)
            .maybeSingle();
          
          if (byAppId) {
            assessment = byAppId;
            console.log('Found FP record by app_id');
          }
        }
        
        if (!assessment) {
          console.log('No FP record found for:', surveyId);
          setError('No survey data found yet. Please complete some survey sections first.');
          setLoading(false);
          return;
        }
        
        // Transform and set data
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
          surveyId: assessment.survey_id || assessment.app_id,
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
        .maybeSingle();

      console.log('Assessment result:', assessment, error);

      if (error) throw error;
      if (!assessment) {
        setError('No survey data found. Please complete some survey sections first.');
        setLoading(false);
        return;
      }

      // Transform data
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
        email: user.email,
        surveyId: assessment.app_id || assessment.survey_id,
        firmo,
        general,
        current,
        dimensions,
        cross,
        impact
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.gray[100] }}>
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: BRAND.primary }} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p style={{ color: BRAND.gray[600] }}>Loading your company profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.gray[100] }}>
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.gray[900] }}>Unable to Load Profile</h2>
          <p className="mb-4" style={{ color: BRAND.gray[600] }}>{error || 'No data found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: BRAND.primary }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.gray[100] }}>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* HEADER */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="px-8 py-6" style={{ backgroundColor: BRAND.primary }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Company Profile</p>
                <h1 className="text-3xl font-bold text-white">{data.companyName}</h1>
                <p className="text-white/70 text-sm mt-1">{data.surveyId} • {data.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </button>
                <button
                  onClick={() => downloadHTML(data)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COMPANY INFO */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Contact Information</h2>
            <Field label="Name" value={`${data.firmo?.firstName || ''} ${data.firmo?.lastName || ''}`.trim() || 'N/A'} />
            <Field label="Title" value={data.firmo?.title || data.firmo?.s4b} />
            <Field label="Email" value={data.email} />
            <Field label="Level" value={data.firmo?.s5} />
            <Field label="Benefits Influence" value={data.firmo?.s7} />
          </div>

          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Company Profile</h2>
            <Field label="Industry" value={data.firmo?.c2} />
            <Field label="Total Employees" value={data.firmo?.s8} />
            <Field label="Headquarters" value={data.firmo?.s9} />
            <Field label="Countries of Operation" value={data.firmo?.s9a} />
            <Field label="Annual Revenue" value={data.firmo?.c4 || data.firmo?.c5} />
            <Field label="Remote/Hybrid Policy" value={data.firmo?.c6} />
          </div>
        </div>

        {/* GENERAL BENEFITS */}
        {Object.keys(data.general || {}).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>Benefits Landscape</h2>
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

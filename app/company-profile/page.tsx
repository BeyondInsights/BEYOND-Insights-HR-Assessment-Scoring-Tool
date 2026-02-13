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
  4: 'Cancer Support Resources',
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

  // Sub-field labels for conditional follow-ups
  d1_4a_weeks: 'Additional Remote Work (Weeks)',
  d1_4a_months: 'Additional Remote Work (Months)',
  d1_4a_type: 'Remote Work Duration Type',
  d4_1a_other: 'Navigation Provider (Other)',
  d4_1b_other: 'Navigation Services (Other)',
  d6_2_other: 'Measurement Method (Other)',
  d11_1_screening_other: 'Screening (Other)',
  d11_1_genetic_other: 'Genetic Testing (Other)',
  d11_1_vaccine_other: 'Vaccine Services (Other)',
  // FP-format keys (no underscore)
  d31: 'Manager Training Completion Rate',
  d31a: 'Training Requirement Type',
  d41a: 'Navigation Provider Type',
  d41b: 'Navigation Services Available',
  d41a_other: 'Navigation Provider (Other)',
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
    // Filter out "None of these" - it's a sentinel value, not meaningful data
    const out = value
      .map(v => String(v).trim())
      .filter(v => v !== '' && v !== 'None of these');
    return out.length ? out : null;
  }
  if (typeof value === 'object') return value;
  const s = String(value).trim();
  return s === '' || s === 'None of these' ? null : s;
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

  /* ── helpers ── */
  const h = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const displayVal = (val: any): string => {
    const v = selectedOnly(val);
    if (!v) return '';
    if (Array.isArray(v) && v.length > 1) {
      return v.map(x => `<div style="padding:1px 0;font-size:13px;color:#1e293b">&bull; ${h(x)}</div>`).join('');
    }
    if (Array.isArray(v)) return h(v[0]);
    return h(String(v));
  };

  const fieldRow = (label: string, val: any): string => {
    const d = displayVal(val);
    if (!d) return '';
    return `<tr><td class="fl">${h(label)}</td><td class="fv">${d}</td></tr>`;
  };

  /* ── CONTACT & COMPANY ── */
  const contactRows = [
    data.firmo?.firstName || data.firmo?.lastName ? fieldRow('Name', `${data.firmo?.firstName || ''} ${data.firmo?.lastName || ''}`.trim()) : '',
    fieldRow('Title', data.firmo?.title || data.firmo?.s4b),
    fieldRow('Email', data.email),
    fieldRow('Level', data.firmo?.s5),
    fieldRow('Benefits Influence', data.firmo?.s7),
  ].filter(Boolean).join('');

  const companyRows = [
    fieldRow('Industry', data.firmo?.c2),
    fieldRow('Total Employees', data.firmo?.s8),
    fieldRow('Headquarters', data.firmo?.s9),
    fieldRow('Countries', data.firmo?.s9a),
    fieldRow('Revenue', data.firmo?.c4 || data.firmo?.c5),
    fieldRow('Benefits Eligibility', data.firmo?.c3),
    fieldRow('Remote/Hybrid', data.firmo?.c6),
  ].filter(Boolean).join('');

  /* ── GENERAL BENEFITS ── */
  const genRows = Object.entries(data.general || {})
    .map(([k, v]) => fieldRow(formatLabel(k), v)).filter(Boolean).join('');

  /* ── CURRENT SUPPORT ── */
  const curRows = Object.entries(data.current || {})
    .map(([k, v]) => fieldRow(formatLabel(k), v)).filter(Boolean).join('');

  /* ── 13 DIMENSIONS ── */
  let dimensionsHTML = '';

  data.dimensions.forEach((dim: any) => {
    const { programs, items } = parseDimensionData(dim.number, dim.data);
    if (programs.length === 0 && items.length === 0) return;

    const color = DIM_COLORS[dim.number - 1];

    // Separate geo from other items
    const geoItem = items.find(it => it.question === 'Geographic Scope');
    const otherItems = items.filter(it => it.question !== 'Geographic Scope');

    // Geo banner
    let geoHTML = '';
    if (geoItem) {
      const gl = geoItem.response.toLowerCase();
      const bg = gl.includes('consistent') ? '#f0fdf4' : gl.includes('var') ? '#fffbeb' : gl.includes('select') ? '#fef2f2' : '#f8fafc';
      const fg = gl.includes('consistent') ? '#166534' : gl.includes('var') ? '#92400e' : gl.includes('select') ? '#991b1b' : '#475569';
      geoHTML = `<div class="geo" style="background:${bg}"><span style="font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b">Geographic Scope</span><span style="font-weight:600;color:${fg}">${h(geoItem.response)}</span></div>`;
    }

    // Programs table
    let progsHTML = '';
    if (programs.length > 0) {
      const activeKey = dim.number === 3 ? 'currently provide' : dim.number === 12 ? 'currently measure' : dim.number === 13 ? 'currently use' : 'currently offer';
      const offered = programs.filter(p => p.status.toLowerCase().includes(activeKey)).length;
      const total = programs.length;
      const pct = total > 0 ? Math.round((offered / total) * 100) : 0;

      const rows = programs.map(({ program, status }) => {
        const sl = status.toLowerCase();
        const fg = sl.includes('currently') ? '#166534' : sl.includes('planning') ? '#1e40af' : sl.includes('assessing') ? '#92400e' : sl.includes('not able') ? '#991b1b' : '#6b7280';
        const short = status.replace(/ in foreseeable future/g, '').replace('In active planning / development', 'Planning / Development');
        return `<tr class="status-row"><td>${h(program)}</td><td class="status-label" style="color:${fg}">${h(short)}</td></tr>`;
      }).join('');

      progsHTML = `
        <div style="padding:10px 16px 4px;display:flex;justify-content:space-between;align-items:center">
          <span class="sec-head" style="padding:0;color:#ea580c">Program Status</span>
          <span style="font-size:11px;font-weight:600;color:#475569;background:#f1f5f9;padding:2px 8px;border-radius:4px">${offered} of ${total} active (${pct}%)</span>
        </div>
        <table>${rows}</table>`;
    }

    // Follow-up details
    let followUpHTML = '';
    if (otherItems.length > 0) {
      const rows = otherItems.map(it =>
        `<tr><td class="fl">${h(it.question)}</td><td class="fv">${h(it.response)}</td></tr>`
      ).join('');
      followUpHTML = `<div class="sec-head" style="color:#7c3aed">Follow-Up Details</div><table>${rows}</table>`;
    }

    dimensionsHTML += `
      <div class="card" style="border-left:5px solid ${color}">
        <div style="padding:12px 16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:12px">
          <div style="width:32px;height:32px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex-shrink:0">${dim.number}</div>
          <div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8">Dimension ${dim.number}</div>
            <div style="font-size:14px;font-weight:700;color:#0f172a">${DIM_TITLE[dim.number]}</div>
          </div>
        </div>
        ${geoHTML}
        ${progsHTML}
        ${followUpHTML}
      </div>`;
  });

  /* ── CROSS-DIMENSIONAL ── */
  const cross = data.cross || {};
  const fmtList = (val: any): string => {
    if (!val) return '<em style="color:#94a3b8">Not provided</em>';
    if (Array.isArray(val)) return val.map((v: string) => `<div style="font-size:13px;padding:2px 0">&bull; ${h(v)}</div>`).join('');
    return `<div style="font-size:13px">${h(String(val))}</div>`;
  };
  const crossHTML = Object.keys(cross).length === 0 ? '' : `
    <div class="card">
      <div class="card-head" style="border-left-color:#10b981"><h2>Cross-Dimensional Assessment</h2></div>
      <div style="padding:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
        <div style="border:1px solid #bbf7d0;border-radius:6px;padding:12px;background:#f0fdf4"><div style="font-size:11px;font-weight:700;color:#166534;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em">Top 3 Priorities</div>${fmtList(cross.cd1a)}</div>
        <div style="border:1px solid #fde68a;border-radius:6px;padding:12px;background:#fffbeb"><div style="font-size:11px;font-weight:700;color:#92400e;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em">Bottom 3 Priorities</div>${fmtList(cross.cd1b)}</div>
        <div style="border:1px solid #fecaca;border-radius:6px;padding:12px;background:#fef2f2"><div style="font-size:11px;font-weight:700;color:#991b1b;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em">Challenges</div>${fmtList(cross.cd2)}</div>
      </div>
    </div>`;

  /* ── EMPLOYEE IMPACT ── */
  const impact = data.impact || {};
  let impactInner = '';
  if (impact.ei1 && typeof impact.ei1 === 'object') {
    const rows = Object.entries(impact.ei1).map(([item, rating]) => {
      const r = String(rating);
      const dr = FIELD_LABELS[r] || r.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const fg = r === 'significant' ? '#166534' : r === 'moderate' ? '#1e40af' : r === 'minimal' ? '#92400e' : '#475569';
      return `<tr class="status-row"><td>${h(FIELD_LABELS[item] || item)}</td><td class="status-label" style="color:${fg}">${h(dr)}</td></tr>`;
    }).join('');
    impactInner += `<div class="sec-head" style="color:#7a34a3">Program Impact by Outcome Area</div><table>${rows}</table>`;
  }
  Object.entries(impact).forEach(([k, v]) => {
    if (k !== 'ei1' && k !== 'cd1a' && k !== 'cd1b' && k !== 'cd2' && !k.endsWith('_none')) {
      const row = fieldRow(formatLabel(k), v);
      if (row) impactInner += `<table>${row}</table>`;
    }
  });
  const impactHTML = !impactInner ? '' : `
    <div class="card">
      <div class="card-head" style="border-left-color:#f97316"><h2>Employee Impact Assessment</h2></div>
      ${impactInner}
    </div>`;

  /* ── ASSEMBLE ── */
  const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${h(data.companyName)} — Assessment Summary</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;color:#1e293b;background:#fff;padding:32px 40px}
.wrap{max-width:1000px;margin:0 auto}
h1{font-size:26px;font-weight:800;color:#0f172a;margin-bottom:4px}
h2{font-size:15px;font-weight:700;color:#0f172a;margin:0}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px;overflow:hidden;page-break-inside:avoid}
.card-head{padding:12px 16px;border-bottom:1px solid #e2e8f0;border-left:4px solid #94a3b8}
table{width:100%;border-collapse:collapse}
.fl{padding:8px 16px;font-size:12px;font-weight:600;color:#64748b;vertical-align:top;border-bottom:1px solid #f1f5f9;width:220px}
.fv{padding:8px 16px;font-size:13px;color:#0f172a;border-bottom:1px solid #f1f5f9}
.geo{display:flex;align-items:center;gap:8px;padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:12px}
.sec-head{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:10px 16px 4px}
.status-row td{padding:6px 16px;font-size:13px;border-bottom:1px solid #f1f5f9}
.status-label{font-weight:600;font-size:12px;text-align:right;white-space:nowrap}
@media print{body{padding:16px;font-size:11px} .card{page-break-inside:avoid}}
</style></head><body><div class="wrap">

<div style="border-bottom:3px solid #7a34a3;padding-bottom:16px;margin-bottom:24px">
<div style="text-align:center;margin-bottom:12px"><div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#7a34a3">Best Companies for Working with Cancer</div>
<div style="font-size:11px;color:#94a3b8">2026 Employer Index &mdash; Assessment Summary</div></div>
<h1>${h(data.companyName)}</h1>
<div style="font-size:12px;color:#64748b">${h(data.surveyId || '')} &bull; ${h(data.email || '')}</div></div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
<div class="card"><div class="card-head" style="border-left-color:#7a34a3"><h2>Point of Contact</h2></div><table>${contactRows}</table></div>
<div class="card"><div class="card-head" style="border-left-color:#3b82f6"><h2>Company Profile</h2></div><table>${companyRows}</table></div></div>

${genRows ? `<div class="card"><div class="card-head" style="border-left-color:#6366f1"><h2>Benefits Landscape</h2></div><table>${genRows}</table></div>` : ''}

${curRows ? `<div class="card"><div class="card-head" style="border-left-color:#ec4899"><h2>Current Support for Employees Managing Cancer</h2></div><table>${curRows}</table></div>` : ''}

<div style="margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0"><h2 style="font-size:18px;font-weight:800;color:#0f172a">13 Dimensions of Support</h2></div>
${dimensionsHTML}

${crossHTML}
${impactHTML}

<div style="text-align:center;padding-top:20px;border-top:2px solid #e2e8f0;margin-top:28px">
<div style="font-size:11px;font-weight:600;color:#7a34a3">Best Companies for Working with Cancer Index&trade;</div>
<div style="font-size:10px;color:#94a3b8;margin-top:4px">Company Profile Report &bull; Survey ID: ${h(data.surveyId || 'N/A')}</div>
<div style="font-size:10px;color:#cbd5e1;margin-top:6px">&copy; ${new Date().getFullYear()} Cancer and Careers &amp; CEW Foundation. Confidential.</div>
</div></div></body></html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.companyName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()}-assessment-summary-${new Date().toISOString().split('T')[0]}.html`;
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
      
      // Check localStorage auth flags as backup
      const hasAuthFlag = localStorage.getItem('user_authenticated') === 'true';
      const authCompleted = localStorage.getItem('auth_completed') === 'true';
      const storedSurveyId = localStorage.getItem('survey_id') || localStorage.getItem('login_Survey_id') || '';
      
      if (!user || !user.email) {
        // No Supabase user - check if we have localStorage auth
        if ((hasAuthFlag || authCompleted) && storedSurveyId) {
          console.log('No Supabase user but have localStorage auth - loading by survey_id');
          
          // Try to load by survey_id
          const normalizedId = storedSurveyId.replace(/-/g, '').toUpperCase();
          const { data: assessment } = await supabase
            .from('assessments')
            .select('*')
            .or(`survey_id.eq.${storedSurveyId},app_id.eq.${normalizedId}`)
            .maybeSingle();
          
          if (assessment) {
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
        }
        
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

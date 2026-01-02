'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { generateInvoicePDF, downloadInvoicePDF, type InvoiceData } from '@/lib/invoice-generator';

// ============================================
// EXECUTIVE PROFESSIONAL COLORS
// ============================================
const BRAND = {
  primary: '#1E3A5F',      // Deep Navy Blue
  secondary: '#2D5016',    // Forest Green
  accent: '#8B4513',       // Saddle Brown
  success: '#166534',      // Dark Green
  warning: '#B45309',      // Dark Amber
  error: '#991B1B',        // Dark Red
  info: '#1E40AF',         // Royal Blue
  gray: {
    900: '#111827',
    800: '#1F2937',
    700: '#374151',
    600: '#4B5563',
    500: '#6B7280',
    400: '#9CA3AF',
    300: '#D1D5DB',
    200: '#E5E7EB',
    100: '#F3F4F6',
    50: '#F9FAFB',
  }
};

// Professional status colors - RICH and BOLD
const STATUS_COLORS = {
  current: { bg: '#166534', text: '#FFFFFF' },      // Dark Forest Green
  planning: { bg: '#B45309', text: '#FFFFFF' },     // Rich Amber
  assessing: { bg: '#1E40AF', text: '#FFFFFF' },    // Royal Blue
  notOffered: { bg: '#991B1B', text: '#FFFFFF' },   // Deep Red
  unsure: { bg: '#4B5563', text: '#FFFFFF' },       // Slate Gray
};

// Dimension colors - RICH JEWEL TONES (Professional)
const DIM_COLORS = [
  '#7C2D12', // Deep Rust
  '#854D0E', // Dark Gold
  '#365314', // Dark Olive
  '#166534', // Forest Green
  '#115E59', // Deep Teal
  '#164E63', // Dark Cyan
  '#1E3A8A', // Navy Blue
  '#312E81', // Deep Indigo
  '#581C87', // Deep Purple
  '#831843', // Deep Rose
  '#881337', // Burgundy
  '#7F1D1D', // Dark Red
  '#44403C', // Warm Gray
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
  11: 'Prevention, Wellness & Compliance',
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness'
};

// ============================================
// FIELD LABELS - COMPLETE MAPPING
// ============================================
const FIELD_LABELS: Record<string, string> = {
  // Contact
  companyName: 'Company Name',
  firstName: 'First Name',
  lastName: 'Last Name',
  title: 'Title',
  titleOther: 'Title',
  
  // Screener - Role & Responsibilities
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
  
  // Authorization
  au1: 'Authorization Confirmed',
  au2: 'Authorization Basis',
  
  // Classification
  c2: 'Industry',
  c3: 'Benefits Eligibility',
  c3a: 'Employee Groups Excluded',
  c4: 'Annual Revenue',
  c5: 'Annual Revenue',
  c6: 'Remote/Hybrid Work Policy',
  
  // General Benefits
  cb1: 'Current Benefits Offered',
  cb1a: 'Employees with National Healthcare',
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
  cd1a: 'Top Priority Dimensions',
  cd1b: 'Lowest Priority Dimensions',
  cd2: 'Implementation Challenges',
  
  // Employee Impact
  ei1: 'Program Impact by Area',
  ei2: 'ROI Measurement Status',
  ei3: 'Approximate ROI',
  ei4: 'Advice for Other HR Leaders',
  ei5: 'Survey Gaps Identified',
  
  // ============================================
  // DIMENSION FOLLOW-UP QUESTIONS - PROPER LABELS
  // ============================================
  
  // Dimension 1 - Medical Leave
  d1aa: 'Geographic Availability',
  d1b: 'Additional Benefits Not Listed',
  d1_1: 'Additional Paid Leave (USA)',
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
  d2aa: 'Geographic Availability',
  d2b: 'Additional Benefits Not Listed',
  
  // Dimension 3 - Manager Training
  d3aa: 'Geographic Availability',
  d3b: 'Additional Initiatives Not Listed',
  d3_1: 'Manager Training Completion Rate',
  d3_1a: 'Training Requirement Type',
  
  // Dimension 4 - Navigation
  d4aa: 'Geographic Availability',
  d4b: 'Additional Resources Not Listed',
  d4_1a: 'Navigation Provider Type',
  d4_1b: 'Navigation Services Available',
  
  // Dimension 5 - Accommodations
  d5aa: 'Geographic Availability',
  d5b: 'Additional Accommodations Not Listed',
  
  // Dimension 6 - Culture
  d6aa: 'Geographic Availability',
  d6b: 'Additional Supports Not Listed',
  d6_2: 'How Psychological Safety is Measured',
  
  // Dimension 7 - Career
  d7aa: 'Geographic Availability',
  d7b: 'Additional Supports Not Listed',
  
  // Dimension 8 - Work Continuation
  d8aa: 'Geographic Availability',
  d8b: 'Additional Supports Not Listed',
  
  // Dimension 9 - Executive
  d9aa: 'Geographic Availability',
  d9b: 'Additional Practices Not Listed',
  
  // Dimension 10 - Caregiver
  d10aa: 'Geographic Availability',
  d10b: 'Additional Benefits Not Listed',
  
  // Dimension 11 - Prevention
  d11aa: 'Geographic Availability',
  d11b: 'Additional Initiatives Not Listed',
  d11_1: 'Early Detection Services at 100% Coverage',
  
  // Dimension 12 - Continuous Improvement
  d12aa: 'Geographic Availability',
  d12b: 'Additional Practices Not Listed',
  d12_1: 'Individual Experience Review Process',
  d12_2: 'Changes from Employee Feedback',
  
  // Dimension 13 - Communication
  d13aa: 'Geographic Availability',
  d13b: 'Additional Methods Not Listed',
  d13_1: 'Communication Frequency',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getLabel(key: string): string {
  // Normalize key - remove Q prefix
  let cleanKey = key.replace(/^[Qq]/, '');
  
  // Build a normalized version for matching (lowercase, no underscores)
  const normalizedKey = cleanKey.toLowerCase().replace(/_/g, '');
  
  // Direct lookup first
  if (FIELD_LABELS[cleanKey]) return FIELD_LABELS[cleanKey];
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  
  // Try lowercase version
  if (FIELD_LABELS[cleanKey.toLowerCase()]) return FIELD_LABELS[cleanKey.toLowerCase()];
  
  // Check each field label key for a normalized match
  for (const [labelKey, labelValue] of Object.entries(FIELD_LABELS)) {
    const normalizedLabelKey = labelKey.toLowerCase().replace(/_/g, '');
    if (normalizedLabelKey === normalizedKey) {
      return labelValue;
    }
  }
  
  // Handle dimension follow-up patterns like "d3_1", "d3_1a", "d31", "d31a"
  // Extract dimension number and sub-question
  const dimMatch = cleanKey.match(/^d(\d+)[_]?(\d+)?([a-z])?$/i);
  if (dimMatch) {
    const dimNum = dimMatch[1];
    const subQ = dimMatch[2] || '';
    const subSub = dimMatch[3] || '';
    
    // Try to find in labels with various formats
    const possibleKeys = [
      `d${dimNum}_${subQ}${subSub}`,
      `d${dimNum}_${subQ}_${subSub}`,
      `d${dimNum}${subQ}${subSub}`,
    ].filter(k => k.replace(/_+$/, ''));
    
    for (const pk of possibleKeys) {
      if (FIELD_LABELS[pk]) return FIELD_LABELS[pk];
      if (FIELD_LABELS[pk.toLowerCase()]) return FIELD_LABELS[pk.toLowerCase()];
    }
    
    // Return a generic but readable label based on dimension
    const dimTitles: Record<string, string> = {
      '1': 'Medical Leave',
      '2': 'Insurance',
      '3': 'Manager Training',
      '4': 'Navigation',
      '5': 'Accommodations',
      '6': 'Culture',
      '7': 'Career',
      '8': 'Work Continuation',
      '9': 'Executive',
      '10': 'Caregiver',
      '11': 'Prevention',
      '12': 'Improvement',
      '13': 'Communication',
    };
    
    if (subQ) {
      return `${dimTitles[dimNum] || 'Dimension ' + dimNum} Details`;
    }
  }
  
  // Don't return raw keys like "D3 1" or "d3_1" - make them more readable
  if (/^d\d+[_]?\d*[a-z]?$/i.test(cleanKey)) {
    return 'Additional Details';
  }
  
  // Final fallback - format nicely
  return cleanKey
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Check if value is meaningless (skip these)
function isSkippableValue(value: any, key?: string): boolean {
  if (value === null || value === undefined) return true;
  if (value === '') return true;
  if (value === true || value === false) return true; // Skip booleans like "none: true"
  
  const strVal = String(value).toLowerCase().trim();
  if (strVal === 'true' || strVal === 'false') return true;
  if (strVal === 'none' || strVal === 'n/a') return true;
  
  // Skip "none" checkbox fields
  if (key && (key.toLowerCase().includes('none') || key.toLowerCase().endsWith('_none'))) return true;
  
  return false;
}

// Get the "Other" specify value
function getOtherSpecifyValue(data: any, key: string): string | null {
  if (!data) return null;
  
  // Common patterns for "other" fields
  const otherKeys = [
    `${key}_other`,
    `${key}Other`, 
    `${key}_specify`,
    `${key}Specify`,
    `${key.replace(/_type$/, '')}_other`,
    `${key}other`,
    `other_${key}`,
    `${key.replace(/a$/, '')}_other`, // s4a -> s4_other
    `other`,
  ];
  
  // First try exact patterns
  for (const otherKey of otherKeys) {
    if (data[otherKey] && typeof data[otherKey] === 'string' && data[otherKey].trim()) {
      return data[otherKey].trim();
    }
  }
  
  // Search all keys for ones ending in _other or Other that might be related
  const baseKey = key.replace(/_.*$/, ''); // s4a -> s4
  for (const dataKey of Object.keys(data)) {
    const lowerDataKey = dataKey.toLowerCase();
    if ((lowerDataKey.includes('other') || lowerDataKey.includes('specify')) && 
        (lowerDataKey.startsWith(baseKey.toLowerCase()) || lowerDataKey.startsWith(key.toLowerCase()))) {
      const val = data[dataKey];
      if (val && typeof val === 'string' && val.trim() && val.toLowerCase() !== 'other') {
        return val.trim();
      }
    }
  }
  
  return null;
}

// Format value for display - handles "other" lookups
function formatDisplayValue(value: any, data?: any, key?: string): string | string[] | null {
  if (isSkippableValue(value, key)) return null;
  
  // Handle arrays
  if (Array.isArray(value)) {
    const formatted = value
      .map(v => {
        const str = String(v).trim();
        // Replace "Other (specify)" or just "Other" with actual typed value
        if (str.toLowerCase().includes('other')) {
          const otherVal = data ? getOtherSpecifyValue(data, key || '') : null;
          if (otherVal) return otherVal;  // Return the typed value, NOT "Other: value"
          return null; // Skip if no other value specified
        }
        return str;
      })
      .filter(v => v !== null && v !== '');
    
    return formatted.length > 0 ? formatted as string[] : null;
  }
  
  // Handle string values that are "Other (specify):" or similar
  const strVal = String(value).trim();
  
  // Check for various "other" patterns
  if (strVal.toLowerCase() === 'other' || 
      strVal.toLowerCase().includes('other (specify)') ||
      strVal.toLowerCase() === 'other:' ||
      strVal.toLowerCase().startsWith('other (')) {
    const otherVal = data ? getOtherSpecifyValue(data, key || '') : null;
    if (otherVal) return otherVal;
    return null; // Skip if no other value - don't show "Other (specify):"
  }
  
  return strVal;
}

// Get status styling - VIBRANT colors
// Handles both text statuses AND numeric codes (1-5 from FP bulk data)
function getStatusStyle(status: string | number): { bg: string; text: string; label: string } {
  // Handle numeric status codes from Founding Partner data
  // 1 = Not able to offer, 2 = Assessing, 3 = Planning, 4 = Currently offer, 5 = Unsure
  const numStatus = typeof status === 'number' ? status : parseInt(String(status));
  if (!isNaN(numStatus)) {
    switch (numStatus) {
      case 4: return { ...STATUS_COLORS.current, label: 'Currently Offering' };
      case 3: return { ...STATUS_COLORS.planning, label: 'In Development' };
      case 2: return { ...STATUS_COLORS.assessing, label: 'Assessing' };
      case 1: return { ...STATUS_COLORS.notOffered, label: 'Not Feasible' };
      case 5: return { ...STATUS_COLORS.unsure, label: 'Unsure' };
    }
  }
  
  // Handle text-based statuses (from survey UI)
  const s = String(status).toLowerCase();
  
  // CHECK "NOT ABLE" FIRST - before "offer" check (since "Not able to offer" contains "offer")
  if (s.includes('not able')) {
    return { ...STATUS_COLORS.notOffered, label: 'Not Feasible' };
  }
  if (s.includes('unsure')) {
    return { ...STATUS_COLORS.unsure, label: 'Unsure' };
  }
  if (s.includes('assessing') || s.includes('feasibility')) {
    return { ...STATUS_COLORS.assessing, label: 'Assessing' };
  }
  if (s.includes('planning') || s.includes('development')) {
    return { ...STATUS_COLORS.planning, label: 'In Development' };
  }
  // NOW safe to check for "offer" since "not able" already handled
  if (s.includes('currently') || s.includes('offer') || s.includes('provide') || s.includes('use') || s.includes('track') || s.includes('measure')) {
    return { ...STATUS_COLORS.current, label: 'Currently Offering' };
  }
  
  return { bg: BRAND.gray[400], text: '#FFFFFF', label: String(status) };
}

// ============================================
// COMPONENTS
// ============================================

function StatCard({ label, value, color, icon, subtext }: { 
  label: string; 
  value: string | number; 
  color: string;
  icon?: React.ReactNode;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="p-5 text-center">
        {icon && <div className="mb-2">{icon}</div>}
        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[500] }}>{label}</p>
        <p className="text-4xl font-black" style={{ color }}>{value}</p>
        {subtext && <p className="text-xs mt-1" style={{ color: BRAND.gray[600] }}>{subtext}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, children, color = BRAND.primary }: { 
  title: string; 
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: BRAND.gray[200], backgroundColor: BRAND.gray[50] }}>
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: color }} />
        <h2 className="text-lg font-bold" style={{ color: BRAND.gray[900] }}>{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function DataField({ label, value, fullWidth = false, showNA = false }: { 
  label: string; 
  value: string | string[] | null;
  fullWidth?: boolean;
  showNA?: boolean;
}) {
  // If showNA is true, show "N/A" for null values
  // Otherwise hide the field entirely
  if (!value && !showNA) return null;
  
  const displayValue = value || 'N/A';
  const isNA = !value;
  
  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[500] }}>{label}</p>
      {Array.isArray(displayValue) ? (
        <ul className="space-y-1">
          {displayValue.map((v, i) => (
            <li key={i} className="text-sm flex items-start" style={{ color: BRAND.gray[800] }}>
              <span className="mr-2 text-lg leading-none" style={{ color: BRAND.primary }}>•</span>
              {v}
            </li>
          ))}
        </ul>
      ) : (
        <p className={`text-sm ${isNA ? 'italic' : ''}`} style={{ color: isNA ? BRAND.gray[400] : BRAND.gray[800] }}>
          {displayValue}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = getStatusStyle(status);
  return (
    <span 
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

// Open-End Response Display
function OpenEndResponse({ label, value }: { label: string; value: string | null }) {
  const hasResponse = value && value.trim() && !value.toLowerCase().includes('no other') && value !== 'true';
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.primary }}>
        {label}
      </p>
      {hasResponse ? (
        <p className="text-sm italic" style={{ color: BRAND.gray[700] }}>"{value}"</p>
      ) : (
        <p className="text-sm" style={{ color: BRAND.gray[400] }}>No additional response provided</p>
      )}
    </div>
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
  const openEndKey = `d${dimNum}b`;
  const openEndValue = dimData?.[openEndKey];
  const geoConsistencyKey = `d${dimNum}aa`;
  // Handle case-insensitive lookup for geoConsistency (some data has D2aa, some has d2aa)
  const geoConsistency = dimData?.[geoConsistencyKey] || dimData?.[`D${dimNum}aa`] || dimData?.[geoConsistencyKey.toUpperCase()];
  
  // Count programs by status - handles both numeric (FP) and text (survey) formats
  let currentCount = 0, planningCount = 0, assessingCount = 0, notFeasibleCount = 0;
  Object.values(mainGrid).forEach((status: any) => {
    // Handle numeric status codes (FP data: 1=NotAble, 2=Assessing, 3=Planning, 4=Current, 5=Unsure)
    const numStatus = typeof status === 'number' ? status : parseInt(String(status));
    if (!isNaN(numStatus)) {
      if (numStatus === 4) currentCount++;
      else if (numStatus === 3) planningCount++;
      else if (numStatus === 2) assessingCount++;
      else if (numStatus === 1) notFeasibleCount++;
    } else if (typeof status === 'string') {
      // Handle text-based statuses (from survey UI)
      // CHECK "NOT ABLE" FIRST since "Not able to offer" contains "offer"
      const s = status.toLowerCase();
      if (s.includes('not able')) notFeasibleCount++;
      else if (s.includes('currently') || s.includes('offer') || s.includes('provide') || s.includes('use') || s.includes('track') || s.includes('measure')) currentCount++;
      else if (s.includes('planning') || s.includes('development')) planningCount++;
      else if (s.includes('assessing')) assessingCount++;
    }
  });
  
  const totalPrograms = Object.keys(mainGrid).length;
  const hasData = totalPrograms > 0;
  
  // Get follow-up questions (excluding main grid, open-end, and geo)
  const followUpItems: Array<{ key: string; label: string; value: any }> = [];
  Object.keys(dimData || {}).forEach(key => {
    // Skip main grid, open-end, geo consistency (both cases)
    if (key === mainGridKey || key === openEndKey || key === geoConsistencyKey) return;
    if (key.toLowerCase() === `d${dimNum}aa`) return;  // Handle case-insensitive geo key
    if (!key.toLowerCase().startsWith(`d${dimNum}`)) return;
    
    const value = dimData[key];
    
    // Skip "none" fields that are just true/false
    if (key.toLowerCase().includes('none')) return;
    if (isSkippableValue(value, key)) return;
    
    const label = getLabel(key);
    const formattedValue = formatDisplayValue(value, dimData, key);
    
    if (formattedValue) {
      followUpItems.push({ key, label, value: formattedValue });
    }
  });

  // Format open-end for display
  let openEndDisplay: string | null = null;
  if (openEndValue && typeof openEndValue === 'string' && openEndValue.trim()) {
    const trimmed = openEndValue.trim().toLowerCase();
    if (trimmed !== 'true' && trimmed !== 'false' && !trimmed.includes('no other')) {
      openEndDisplay = openEndValue.trim();
    }
  }

  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden mb-4"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      {/* Header */}
      <div 
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg"
            style={{ backgroundColor: color }}
          >
            {dimNum}
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: BRAND.gray[900] }}>{title}</h3>
            {hasData && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {currentCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: STATUS_COLORS.current.bg }}>
                    {currentCount} Offering
                  </span>
                )}
                {planningCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: STATUS_COLORS.planning.bg }}>
                    {planningCount} Planning
                  </span>
                )}
                {assessingCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: STATUS_COLORS.assessing.bg }}>
                    {assessingCount} Assessing
                  </span>
                )}
                {notFeasibleCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: STATUS_COLORS.notOffered.bg }}>
                    {notFeasibleCount} Not Feasible
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <svg 
          className={`w-6 h-6 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
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
              {/* Geographic Consistency */}
              {geoConsistency && (
                <div className="mt-4 mb-4 p-3 rounded-lg" style={{ backgroundColor: BRAND.gray[50] }}>
                  <span className="text-xs font-bold uppercase" style={{ color: BRAND.gray[500] }}>Geographic Scope: </span>
                  <span className="text-sm font-medium" style={{ color: BRAND.gray[800] }}>{geoConsistency}</span>
                </div>
              )}
              
              {/* Program Grid */}
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: BRAND.gray[500] }}>
                  Program Status ({totalPrograms} items)
                </p>
                <div className="overflow-x-auto rounded-lg border" style={{ borderColor: BRAND.gray[200] }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: BRAND.gray[100] }}>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: BRAND.gray[600] }}>Program / Initiative</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: BRAND.gray[600] }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(mainGrid).map(([program, status], idx) => (
                        <tr 
                          key={idx} 
                          className={idx % 2 === 0 ? 'bg-white' : ''}
                          style={{ backgroundColor: idx % 2 === 0 ? 'white' : BRAND.gray[50] }}
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
                    Follow-Up Details
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

              {/* Open-End Response */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: BRAND.gray[100] }}>
                <OpenEndResponse 
                  label="Additional Comments / Other Programs Not Listed" 
                  value={openEndDisplay}
                />
              </div>
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
  // ============================================
  // NEW: PDF Export state
  // ============================================
  const [exporting, setExporting] = useState(false);

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
        email: data?.email,
        hasFirmographics: !!data?.firmographics_data,
        firmographicsKeys: data?.firmographics_data ? Object.keys(data.firmographics_data) : [],
      });
      
      setAssessment(data);
    } catch (error) {
      console.error('Error fetching assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FULL PDF EXPORT - Using html2pdf with inline hex colors
  // Generates complete 18+ page detailed report
  // ============================================
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      console.log('📄 Starting FULL PDF export...');

      const firm = assessment?.firmographics_data || {};
      const generalBenefits = assessment?.general_benefits_data || {};
      const currentSupport = assessment?.current_support_data || {};
      const crossDim = assessment?.cross_dimensional_data || {};
      const empImpact = assessment?.['employee-impact-assessment_data'] || {};

      // Calculate survey completion for PDF
      const pdfSectionKeys = [
        'firmographics_complete', 'general_benefits_complete', 'current_support_complete',
        'dimension1_complete', 'dimension2_complete', 'dimension3_complete', 'dimension4_complete',
        'dimension5_complete', 'dimension6_complete', 'dimension7_complete', 'dimension8_complete',
        'dimension9_complete', 'dimension10_complete', 'dimension11_complete', 'dimension12_complete',
        'dimension13_complete', 'cross_dimensional_complete', 'employee-impact-assessment_complete'
      ];
      const pdfCompletedSections = pdfSectionKeys.filter(key => assessment?.[key] === true).length;
      const pdfCompletionPct = Math.round((pdfCompletedSections / pdfSectionKeys.length) * 100);
      const pdfIsComplete = assessment?.survey_completed || pdfCompletionPct >= 100;
      const pdfStatusText = pdfIsComplete ? '✓ Completed' : `In Progress (${pdfCompletionPct}%)`;

      // Contact info
      const pdfContactName = [firm.firstName, firm.lastName].filter(Boolean).join(' ') || 'N/A';
      let pdfContactTitle = firm.title || null;
      if (pdfContactTitle && pdfContactTitle.toLowerCase() === 'other') {
        pdfContactTitle = firm.titleOther || firm.title_other || pdfContactTitle;
      }
      // Fallback to s5 (level) for FPs who don't have title
      if (!pdfContactTitle && firm.s5) {
        pdfContactTitle = firm.s5;
      }
      pdfContactTitle = pdfContactTitle || 'N/A';
      const pdfContactEmail = assessment?.email || 'N/A';

      // Status colors (hex only)
      const STATUS = {
        current: { bg: '#166534', text: '#FFFFFF', label: 'Currently Offering' },
        planning: { bg: '#B45309', text: '#FFFFFF', label: 'In Development' },
        assessing: { bg: '#1E40AF', text: '#FFFFFF', label: 'Assessing' },
        notFeasible: { bg: '#991B1B', text: '#FFFFFF', label: 'Not Feasible' },
        unsure: { bg: '#4B5563', text: '#FFFFFF', label: 'Unsure' },
      };

      // Dimension colors
      const PDF_DIM_COLORS = ['#7C2D12', '#854D0E', '#365314', '#166534', '#115E59', '#164E63', '#1E3A8A', '#312E81', '#581C87', '#831843', '#881337', '#7F1D1D', '#44403C'];

      // Helper: Get status style
      const getStatusPDF = (status: any) => {
        const num = typeof status === 'number' ? status : parseInt(String(status));
        if (!isNaN(num)) {
          if (num === 4) return STATUS.current;
          if (num === 3) return STATUS.planning;
          if (num === 2) return STATUS.assessing;
          if (num === 1) return STATUS.notFeasible;
          if (num === 5) return STATUS.unsure;
        }
        const s = String(status).toLowerCase();
        if (s.includes('not able')) return STATUS.notFeasible;
        if (s.includes('unsure')) return STATUS.unsure;
        if (s.includes('assessing')) return STATUS.assessing;
        if (s.includes('planning') || s.includes('development')) return STATUS.planning;
        if (s.includes('currently') || s.includes('offer') || s.includes('provide') || s.includes('use') || s.includes('track') || s.includes('measure')) return STATUS.current;
        return { bg: '#6B7280', text: '#FFFFFF', label: String(status) };
      };

      // ========== BUILD FULL HTML ==========
      let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${assessment?.company_name || 'Company'} - Full Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #1F2937; line-height: 1.4; background: #F9FAFB; max-width: 850px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7C3AED, #5B21B6); color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; position: relative; }
    .header h1 { font-size: 28px; margin: 8px 0; font-weight: 800; }
    .header p { opacity: 0.9; font-size: 12px; }
    .status-badge { position: absolute; right: 25px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; }
    .section { background: white; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .section-header { padding: 14px 20px; border-bottom: 1px solid #E5E7EB; background: #F9FAFB; display: flex; align-items: center; gap: 10px; }
    .section-bar { width: 4px; height: 24px; border-radius: 2px; }
    .section-title { font-size: 16px; font-weight: 700; color: #111827; }
    .section-body { padding: 20px; }
    .stat-grid { display: flex; gap: 12px; margin-bottom: 20px; }
    .stat-box { flex: 1; background: #F9FAFB; border-radius: 10px; padding: 16px; text-align: center; }
    .stat-label { font-size: 9px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .stat-value { font-size: 32px; font-weight: 800; margin: 6px 0; }
    .stat-sub { font-size: 10px; color: #6B7280; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-card { background: #F9FAFB; border-radius: 10px; padding: 16px; }
    .info-card h3 { font-size: 13px; font-weight: 700; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB; color: #111827; }
    .info-row { display: flex; margin-bottom: 8px; }
    .info-label { width: 140px; font-size: 9px; color: #6B7280; text-transform: uppercase; font-weight: 600; }
    .info-value { flex: 1; font-size: 11px; color: #374151; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; margin: 2px 4px 2px 0; }
    .dim-section { background: white; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .dim-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #E5E7EB; }
    .dim-num { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: 800; }
    .dim-title { font-size: 15px; font-weight: 700; color: #111827; }
    .dim-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .dim-body { padding: 20px; }
    .geo-box { background: #F3F4F6; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 11px; }
    .geo-label { font-size: 9px; color: #6B7280; text-transform: uppercase; font-weight: 600; }
    .program-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .program-table th { background: #F3F4F6; padding: 10px 14px; text-align: left; font-size: 9px; text-transform: uppercase; color: #6B7280; font-weight: 600; }
    .program-table td { padding: 12px 14px; border-bottom: 1px solid #E5E7EB; font-size: 11px; }
    .program-table tr:nth-child(even) { background: #F9FAFB; }
    .followup { margin-top: 20px; padding-top: 16px; border-top: 1px solid #E5E7EB; }
    .followup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
    .followup-item label { display: block; font-size: 9px; color: #6B7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
    .followup-item p { font-size: 11px; color: #374151; }
    .openend { background: linear-gradient(135deg, #EDE9FE, #DBEAFE); padding: 14px; border-radius: 8px; margin-top: 16px; }
    .openend-label { font-size: 9px; color: #1E3A5F; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; }
    .openend-text { font-size: 11px; color: #374151; font-style: italic; }
    .warning-box { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 12px 16px; margin: 12px 0; display: flex; align-items: center; gap: 10px; }
    .warning-text { color: #92400E; font-size: 11px; }
    .footer { text-align: center; padding: 20px; border-top: 1px solid #E5E7EB; margin-top: 30px; }
    .footer p { font-size: 10px; color: #6B7280; }
    .check-item { display: flex; align-items: flex-start; gap: 8px; margin: 6px 0; }
    .priority-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .priority-box { padding: 16px; border-radius: 10px; }
    .priority-title { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; }
    .impact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .impact-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #F9FAFB; border-radius: 8px; }
    .impact-label { font-size: 11px; color: #374151; }
    .impact-value { font-size: 10px; padding: 4px 10px; border-radius: 12px; }
    @media print {
      body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .section, .dim-section { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
`;

      // ========== HEADER ==========
      html += `
<div class="header">
  <p style="font-size:11px;margin-bottom:4px;">Best Companies for Working with Cancer Index</p>
  <h1>${assessment?.company_name || 'Company Profile'}</h1>
  <p>Survey ID: ${surveyId} &nbsp;|&nbsp; Contact: ${pdfContactName} &nbsp;|&nbsp; Email: ${pdfContactEmail}</p>
  <div class="status-badge">
    <p style="font-size:10px;opacity:0.8;">Status</p>
    <p style="font-size:14px;font-weight:700;">${pdfStatusText}</p>
  </div>
</div>
`;

      // ========== EXECUTIVE SUMMARY ==========
      html += `
<div class="section">
  <div class="section-header">
    <div class="section-bar" style="background:#1E3A5F;"></div>
    <div class="section-title">Executive Summary</div>
  </div>
  <div class="section-body">
    <div class="stat-grid">
      <div class="stat-box" style="border-top:4px solid #1E3A5F;">
        <div class="stat-label">Support Maturity</div>
        <div class="stat-value" style="color:#1E3A5F;">${maturityScore}%</div>
        <div class="stat-sub">${totalCurrently} of ${totalAnswered} answered</div>
      </div>
      <div class="stat-box" style="border-top:4px solid #166534;">
        <div class="stat-label">Currently Offering</div>
        <div class="stat-value" style="color:#166534;">${totalCurrently}</div>
        <div class="stat-sub">programs in place</div>
      </div>
      <div class="stat-box" style="border-top:4px solid #B45309;">
        <div class="stat-label">In Development</div>
        <div class="stat-value" style="color:#B45309;">${totalPlanning}</div>
        <div class="stat-sub">programs planned</div>
      </div>
      <div class="stat-box" style="border-top:4px solid #2D5016;">
        <div class="stat-label">Global Consistency</div>
        <div class="stat-value" style="color:#2D5016;">${consistentCount}/13</div>
        <div class="stat-sub">dimensions consistent</div>
      </div>
    </div>
    ${totalUnsure > 10 ? `
    <div class="warning-box">
      <span style="color:#D97706;font-size:16px;">⚠️</span>
      <span class="warning-text">${totalUnsure} items marked as "Unsure" - respondent may not have complete visibility into all programs</span>
    </div>
    ` : ''}
  </div>
</div>
`;

      // ========== COMPANY & CONTACT INFO ==========
      const areasOfResp = firm.s6 ? (Array.isArray(firm.s6) ? firm.s6 : [firm.s6]) : [];
      
      html += `
<div class="section">
  <div class="section-body">
    <div class="info-grid">
      <div class="info-card">
        <h3>Company Information</h3>
        <div class="info-row"><span class="info-label">Industry</span><span class="info-value">${firm.c2 || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Total Employees</span><span class="info-value">${firm.s8 || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Headquarters</span><span class="info-value">${firm.s9 || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Countries of Operation</span><span class="info-value">${firm.s9a || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Annual Revenue</span><span class="info-value">${(firm.c4 && !Array.isArray(firm.c4) ? firm.c4 : null) || firm.c5 || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Remote/Hybrid Policy</span><span class="info-value">${firm.c6 || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Benefits Eligibility</span><span class="info-value">${firm.c3 || 'N/A'}</span></div>
        ${firm.c3a && Array.isArray(firm.c3a) && firm.c3a.length > 0 ? `
        <div style="margin-top:8px;">
          <span class="info-label">Employee Groups Excluded</span>
          <ul style="margin-top:4px;padding-left:16px;">
            ${firm.c3a.map((g: string) => `<li style="font-size:10px;color:#374151;margin:2px 0;">• ${g}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
      <div class="info-card">
        <h3>Contact Information</h3>
        <div class="info-row"><span class="info-label">Name</span><span class="info-value">${pdfContactName}</span></div>
        <div class="info-row"><span class="info-label">Title</span><span class="info-value">${pdfContactTitle}</span></div>
        <div class="info-row"><span class="info-label">Email</span><span class="info-value">${pdfContactEmail}</span></div>
        <div class="info-row"><span class="info-label">Department</span><span class="info-value">${firm.s4b || firm.s4a || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Level</span><span class="info-value">${firm.s5 || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Benefits Influence</span><span class="info-value">${firm.s7 || 'N/A'}</span></div>
        ${areasOfResp.length > 0 ? `
        <div style="margin-top:12px;">
          <span class="info-label">Areas of Responsibility</span>
          <ul style="margin-top:6px;padding-left:16px;">
            ${areasOfResp.map((a: string) => `<li style="font-size:10px;color:#374151;margin:3px 0;">• ${a}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    </div>
  </div>
</div>
`;

      // ========== PAYMENT STATUS ==========
      const paymentMethod = assessment?.payment_method || 'N/A';
      const isFP = surveyId?.startsWith('FP-');
      html += `
<div style="background:#ECFDF5;border:1px solid #10B981;border-radius:10px;padding:14px 20px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
  <div style="width:36px;height:36px;background:#D1FAE5;border-radius:50%;display:flex;align-items:center;justify-content:center;">
    <span style="color:#059669;font-size:18px;">✓</span>
  </div>
  <div>
    <p style="font-weight:700;color:#065F46;">Payment: ${isFP ? 'Paid Online (Founding Partner - Fee Waived)' : paymentMethod}</p>
    <p style="font-size:10px;color:#047857;">${assessment?.payment_date ? `Paid on ${new Date(assessment.payment_date).toLocaleDateString()}` : 'Date not recorded'}</p>
  </div>
</div>
`;

      // ========== BENEFITS LANDSCAPE ==========
      const cb1 = generalBenefits?.cb1 || [];
      const cb1Array = Array.isArray(cb1) ? cb1 : [];
      const cb1a = generalBenefits?.cb1a;
      
      if (cb1Array.length > 0) {
        html += `
<div class="section">
  <div class="section-header">
    <div class="section-bar" style="background:#B45309;"></div>
    <div class="section-title">Benefits Landscape</div>
  </div>
  <div class="section-body">
    <p style="font-size:12px;font-weight:700;color:#166534;margin-bottom:12px;">● CURRENTLY OFFERED (${cb1Array.length})</p>
    <div style="background:#F9FAFB;border-radius:8px;padding:16px;">
      ${cb1Array.map((b: string) => `<div class="check-item"><span style="color:#166534;font-size:14px;">✓</span><span style="font-size:11px;color:#374151;">${b}</span></div>`).join('')}
    </div>
    ${cb1a ? `
    <div style="background:#F3F4F6;padding:12px 16px;border-radius:8px;margin-top:16px;">
      <span style="font-size:9px;color:#6B7280;text-transform:uppercase;font-weight:600;">EMPLOYEES WITH NATIONAL HEALTHCARE ACCESS:</span>
      <span style="font-size:13px;font-weight:700;color:#1F2937;margin-left:8px;">${cb1a}%</span>
    </div>
    ` : ''}
  </div>
</div>
`;
      }

      // ========== CURRENT SUPPORT APPROACH ==========
      if (currentSupport && Object.keys(currentSupport).length > 0) {
        html += `
<div class="section">
  <div class="section-header">
    <div class="section-bar" style="background:#581C87;"></div>
    <div class="section-title">Current Support Approach</div>
  </div>
  <div class="section-body">
    ${currentSupport.or1 ? `
    <div style="margin-bottom:16px;">
      <p style="font-size:9px;color:#6B7280;text-transform:uppercase;font-weight:600;">CURRENT APPROACH</p>
      <p style="font-size:12px;color:#1F2937;margin-top:4px;">${currentSupport.or1}</p>
    </div>
    ` : ''}
    ${currentSupport.or6 && Array.isArray(currentSupport.or6) ? `
    <div style="background:#FEF3C7;padding:14px;border-radius:8px;margin-bottom:16px;">
      <p style="font-size:9px;color:#92400E;text-transform:uppercase;font-weight:600;margin-bottom:8px;">EFFECTIVENESS MONITORING</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${currentSupport.or6.map((m: string) => `<span style="background:white;border:1px solid #FCD34D;padding:4px 10px;border-radius:6px;font-size:10px;color:#78350F;">${m}</span>`).join('')}
      </div>
    </div>
    ` : ''}
    ${currentSupport.or5a && Array.isArray(currentSupport.or5a) ? `
    <div>
      <p style="font-size:9px;color:#6B7280;text-transform:uppercase;font-weight:600;margin-bottom:8px;">CAREGIVER SUPPORT TYPES (${currentSupport.or5a.length})</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${currentSupport.or5a.map((s: string) => `<div style="background:#FFF7ED;padding:10px;border-radius:6px;font-size:10px;color:#9A3412;">• ${s}</div>`).join('')}
      </div>
    </div>
    ` : ''}
  </div>
</div>
`;
      }

      // ========== 13 DIMENSIONS ==========
      html += `
<div class="section">
  <div class="section-header">
    <div class="section-bar" style="background:#7C3AED;"></div>
    <div class="section-title">13 Dimensions of Support</div>
  </div>
</div>
`;

      for (let i = 1; i <= 13; i++) {
        const dimData = assessment?.[`dimension${i}_data`] || {};
        const mainGrid = dimData[`d${i}a`] || {};
        // Handle case-insensitive lookup (some data has D2aa, some has d2aa)
        const geoScope = dimData[`d${i}aa`] || dimData[`D${i}aa`];
        const openEnd = dimData[`d${i}b`];
        const color = PDF_DIM_COLORS[i - 1];

        // Count statuses
        let counts = { current: 0, planning: 0, assessing: 0, notFeasible: 0, unsure: 0 };
        Object.values(mainGrid).forEach((status: any) => {
          const st = getStatusPDF(status);
          if (st.label === 'Currently Offering') counts.current++;
          else if (st.label === 'In Development') counts.planning++;
          else if (st.label === 'Assessing') counts.assessing++;
          else if (st.label === 'Not Feasible') counts.notFeasible++;
          else if (st.label === 'Unsure') counts.unsure++;
        });

        const totalItems = Object.keys(mainGrid).length;
        const hasData = totalItems > 0;

        html += `
<div class="dim-section" style="border-left:4px solid ${color};">
  <div class="dim-header">
    <div class="dim-num" style="background:${color};">${i}</div>
    <div>
      <div class="dim-title">${DIM_TITLES[i]}</div>
      ${hasData ? `
      <div class="dim-badges">
        ${counts.current > 0 ? `<span class="badge" style="background:${STATUS.current.bg};color:white;">${counts.current} Offering</span>` : ''}
        ${counts.planning > 0 ? `<span class="badge" style="background:${STATUS.planning.bg};color:white;">${counts.planning} Planning</span>` : ''}
        ${counts.assessing > 0 ? `<span class="badge" style="background:${STATUS.assessing.bg};color:white;">${counts.assessing} Assessing</span>` : ''}
        ${counts.notFeasible > 0 ? `<span class="badge" style="background:${STATUS.notFeasible.bg};color:white;">${counts.notFeasible} Not Feasible</span>` : ''}
        ${counts.unsure > 0 ? `<span class="badge" style="background:${STATUS.unsure.bg};color:white;">${counts.unsure} Unsure</span>` : ''}
      </div>
      ` : ''}
    </div>
  </div>
  <div class="dim-body">
`;

        if (!hasData) {
          html += `<p style="text-align:center;color:#9CA3AF;font-style:italic;padding:20px;">No responses recorded for this dimension</p>`;
        } else {
          // Geographic scope
          if (geoScope) {
            html += `
    <div class="geo-box">
      <span class="geo-label">GEOGRAPHIC SCOPE:</span>
      <span style="margin-left:8px;color:#374151;">${geoScope}</span>
    </div>
`;
          }

          // Program table
          html += `
    <p style="font-size:9px;color:#6B7280;text-transform:uppercase;font-weight:600;margin-bottom:8px;">PROGRAM STATUS (${totalItems} ITEMS)</p>
    <table class="program-table">
      <thead>
        <tr>
          <th>Program / Initiative</th>
          <th style="width:140px;">Status</th>
        </tr>
      </thead>
      <tbody>
`;
          Object.entries(mainGrid).forEach(([program, status]) => {
            const st = getStatusPDF(status);
            html += `
        <tr>
          <td>${program}</td>
          <td><span class="badge" style="background:${st.bg};color:${st.text};">${st.label}</span></td>
        </tr>
`;
          });

          html += `
      </tbody>
    </table>
`;

          // Follow-up details
          const followups: Array<{label: string; value: string}> = [];
          Object.keys(dimData).forEach(key => {
            // Skip main grid, geo scope (both cases), and open-end
            if (key === `d${i}a` || key === `d${i}b`) return;
            if (key.toLowerCase() === `d${i}aa`) return;  // Handle case-insensitive geo key
            if (!key.toLowerCase().startsWith(`d${i}`)) return;
            const val = dimData[key];
            if (!val || val === 'true' || val === 'false' || (typeof val === 'string' && val.toLowerCase().includes('none'))) return;
            
            const label = FIELD_LABELS[key] || key.toUpperCase();
            const formatted = Array.isArray(val) ? val.filter(Boolean).join(', ') : String(val);
            if (formatted && formatted !== 'undefined') {
              followups.push({ label, value: formatted });
            }
          });

          if (followups.length > 0) {
            html += `
    <div class="followup">
      <p style="font-size:9px;color:#6B7280;text-transform:uppercase;font-weight:600;">FOLLOW-UP DETAILS</p>
      <div class="followup-grid">
        ${followups.map(f => `
        <div class="followup-item">
          <label>${f.label}</label>
          <p>${f.value}</p>
        </div>
        `).join('')}
      </div>
    </div>
`;
          }

          // Open-end response
          const hasOpenEnd = openEnd && typeof openEnd === 'string' && openEnd.trim() && !openEnd.toLowerCase().includes('no other') && openEnd !== 'true';
          html += `
    <div class="openend">
      <p class="openend-label">Additional Comments / Other Programs Not Listed</p>
      <p class="openend-text">${hasOpenEnd ? `"${openEnd}"` : 'No additional response provided'}</p>
    </div>
`;
        }

        html += `
  </div>
</div>
`;
      }

      // ========== CROSS-DIMENSIONAL ASSESSMENT ==========
      if (crossDim && Object.keys(crossDim).length > 0) {
        const topPriorities = crossDim.cd1a || [];
        const lowPriorities = crossDim.cd1b || [];
        const challenges = crossDim.cd2 || [];

        html += `
<div class="section">
  <div class="section-header">
    <div class="section-bar" style="background:#059669;"></div>
    <div class="section-title">Cross-Dimensional Assessment</div>
  </div>
  <div class="section-body">
    <div class="priority-grid">
      <div class="priority-box" style="background:#DCFCE7;">
        <p class="priority-title" style="color:#166534;">Top 3 Priorities</p>
        ${Array.isArray(topPriorities) && topPriorities.length > 0 
          ? topPriorities.map((p: string, idx: number) => `<p style="font-size:11px;color:#14532D;margin:6px 0;"><strong>${idx+1}.</strong> ${p}</p>`).join('')
          : '<p style="font-size:11px;color:#6B7280;font-style:italic;">Not specified</p>'
        }
      </div>
      <div class="priority-box" style="background:#FEF9C3;">
        <p class="priority-title" style="color:#A16207;">Lowest Priorities</p>
        ${Array.isArray(lowPriorities) && lowPriorities.length > 0 
          ? lowPriorities.map((p: string, idx: number) => `<p style="font-size:11px;color:#78350F;margin:6px 0;"><strong>${idx+1}.</strong> ${p}</p>`).join('')
          : '<p style="font-size:11px;color:#6B7280;font-style:italic;">Not specified</p>'
        }
      </div>
      <div class="priority-box" style="background:#FEE2E2;">
        <p class="priority-title" style="color:#991B1B;">Biggest Challenges</p>
        ${Array.isArray(challenges) && challenges.length > 0 
          ? challenges.map((c: string) => `<p style="font-size:11px;color:#7F1D1D;margin:6px 0;">• ${c}</p>`).join('')
          : '<p style="font-size:11px;color:#6B7280;font-style:italic;">Not specified</p>'
        }
      </div>
    </div>
  </div>
</div>
`;
      }

      // ========== EMPLOYEE IMPACT ASSESSMENT ==========
      if (empImpact && Object.keys(empImpact).length > 0) {
        const ei1 = empImpact.ei1 || {};
        const ei2 = empImpact.ei2;
        const ei4 = empImpact.ei4;
        const ei5 = empImpact.ei5;

        html += `
<div class="section">
  <div class="section-header">
    <div class="section-bar" style="background:#DC2626;"></div>
    <div class="section-title">Employee Impact Assessment</div>
  </div>
  <div class="section-body">
    ${Object.keys(ei1).length > 0 ? `
    <p style="font-size:9px;color:#6B7280;text-transform:uppercase;font-weight:600;margin-bottom:12px;">PROGRAM IMPACT BY OUTCOME AREA</p>
    <div class="impact-grid">
      ${Object.entries(ei1).map(([area, impact]) => {
        const impactStr = String(impact);
        let impactColor = '#6B7280';
        let impactBg = '#F3F4F6';
        if (impactStr.toLowerCase().includes('significant')) { impactColor = '#166534'; impactBg = '#DCFCE7'; }
        else if (impactStr.toLowerCase().includes('moderate')) { impactColor = '#B45309'; impactBg = '#FEF3C7'; }
        return `
      <div class="impact-row">
        <span class="impact-label">${area}</span>
        <span class="impact-value" style="background:${impactBg};color:${impactColor};">${impactStr}</span>
      </div>
        `;
      }).join('')}
    </div>
    ` : ''}
    ${ei2 ? `
    <div style="margin-top:20px;">
      <p style="font-size:9px;color:#6B7280;text-transform:uppercase;font-weight:600;">ROI MEASUREMENT STATUS</p>
      <p style="font-size:12px;color:#1F2937;margin-top:4px;">${ei2}</p>
    </div>
    ` : ''}
    ${ei4 ? `
    <div class="openend" style="margin-top:16px;">
      <p class="openend-label">Advice for Other HR Leaders (EI4)</p>
      <p class="openend-text">${ei4 && ei4 !== 'true' && !String(ei4).toLowerCase().includes('no additional') ? `"${ei4}"` : 'No additional response provided'}</p>
    </div>
    ` : ''}
    ${ei5 ? `
    <div class="openend" style="margin-top:12px;">
      <p class="openend-label">Survey Gaps / Important Aspects Not Addressed (EI5)</p>
      <p class="openend-text">${ei5 && ei5 !== 'true' && !String(ei5).toLowerCase().includes('none') ? `"${ei5}"` : 'No additional response provided'}</p>
    </div>
    ` : ''}
  </div>
</div>
`;
      }

      // ========== FOOTER ==========
      html += `
<div class="footer">
  <p style="font-weight:600;">Best Companies for Working with Cancer Index • Company Profile Report</p>
  <p style="color:#9CA3AF;margin-top:4px;">Generated ${new Date().toLocaleDateString()} • Survey ID: ${surveyId}</p>
</div>
</body>
</html>
`;

      // ========== OPEN IN NEW WINDOW FOR PRINT ==========
      console.log('📄 Opening report in new window...');
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Auto-trigger print dialog after a short delay
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        alert('Please allow popups to export the PDF report.');
      }
      
      console.log('✅ Report opened - use browser Print > Save as PDF');

    } catch (err: any) {
      console.error('❌ PDF export failed:', err);
      alert(`Failed to export PDF: ${err?.message || 'Unknown error'}`);
    } finally {
      setExporting(false);
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

  // ============================================
  // ALL DATA IS IN firmographics_data (firm)
  // Keys: c2, c3, c4, c5, s1, s2, s4b, s5, s6, s7, s8, s9, s9a, au1, au2
  // ============================================
  
  // CONTACT INFO
  const contactName = [firm.firstName, firm.lastName].filter(Boolean).join(' ') || null;
  // Handle title "Other" case and fallback to s5 (level) for FPs
  let contactTitle = firm.title || null;
  if (contactTitle && contactTitle.toLowerCase() === 'other') {
    contactTitle = firm.titleOther || firm.title_other || contactTitle;
  }
  // If no title, use s5 (level) as fallback - common for Founding Partners
  if (!contactTitle && firm.s5) {
    contactTitle = firm.s5;
  }
  const contactEmail = assessment.email || null;
  
  // ROLE INFO - All from firmographics_data
  // Handle "Other (specify):" cases
  let department = firm.s4b || firm.s4a || null;
  if (department && department.toLowerCase().includes('other')) {
    department = firm.s4b_other || firm.s4a_other || department;
  }
  const level = firm.s5 || null;                     // s5 is "Senior Manager"
  const responsibilities = firm.s6 || null;          // s6 is array of responsibilities
  const influence = firm.s7 || null;                 // s7 is influence level
  
  // COMPANY INFO - All from firmographics_data
  const industry = firm.c2 || null;                  // c2 is "Manufacturing"
  const employees = firm.s8 || null;                 // s8 is "50,000+"
  const headquarters = firm.s9 || null;              // s9 is "Switzerland"
  const countries = firm.s9a || null;                // s9a is "50 or more countries"
  // c4 can be empty array [] which is truthy, so check properly
  const revenue = (firm.c4 && !Array.isArray(firm.c4) ? firm.c4 : null) || firm.c5 || null;
  const remotePolicy = firm.c6 || null;              // c6 is remote policy
  const benefitsEligibility = firm.c3 || null;       // c3 is "Most employees (75-99%)"
  const excludedGroups = firm.c3a || null;           // c3a is employee groups excluded from benefits

  console.log('📊 firmographics_data keys:', Object.keys(firm));
  console.log('📊 Extracted:', { industry, employees, headquarters, countries, revenue, department, level });

  // ============================================
  // CALCULATE SUMMARY STATS - handles both numeric (FP) and text (survey) formats
  // ============================================
  let totalCurrently = 0, totalPlanning = 0, totalAssessing = 0, totalNotFeasible = 0, totalUnsure = 0;
  for (let i = 1; i <= 13; i++) {
    const gridData = assessment[`dimension${i}_data`]?.[`d${i}a`];
    if (gridData && typeof gridData === 'object') {
      Object.values(gridData).forEach((status: any) => {
        // Handle numeric status codes (FP data: 1=NotAble, 2=Assessing, 3=Planning, 4=Current, 5=Unsure)
        const numStatus = typeof status === 'number' ? status : parseInt(String(status));
        if (!isNaN(numStatus)) {
          if (numStatus === 4) totalCurrently++;
          else if (numStatus === 3) totalPlanning++;
          else if (numStatus === 2) totalAssessing++;
          else if (numStatus === 1) totalNotFeasible++;
          else if (numStatus === 5) totalUnsure++;
        } else if (typeof status === 'string') {
          // Handle text-based statuses (from survey UI)
          // CHECK "NOT ABLE" FIRST since "Not able to offer" contains "offer"
          const s = status.toLowerCase();
          if (s.includes('not able')) totalNotFeasible++;
          else if (s === 'unsure') totalUnsure++;
          else if (s.includes('currently') || s.includes('offer') || s.includes('provide') || s.includes('use') || s.includes('track') || s.includes('measure')) totalCurrently++;
          else if (s.includes('planning') || s.includes('development')) totalPlanning++;
          else if (s.includes('assessing')) totalAssessing++;
        }
      });
    }
  }
  
  // Total answered = all responses INCLUDING Unsure
  const totalAnswered = totalCurrently + totalPlanning + totalAssessing + totalNotFeasible + totalUnsure;
  // Total programs = responses excluding Unsure (for "programs in place" count)
  const totalPrograms = totalCurrently + totalPlanning + totalAssessing + totalNotFeasible;
  // Maturity score = Currently offer / Total answered (including Unsure in denominator)
  const maturityScore = totalAnswered > 0 ? Math.round((totalCurrently / totalAnswered) * 100) : 0;

  // Geographic consistency count
  let consistentCount = 0;
  for (let i = 1; i <= 13; i++) {
    // Handle case-insensitive lookup (some data has D2aa, some has d2aa)
    const dimData = assessment[`dimension${i}_data`] || {};
    const aa = dimData[`d${i}aa`] || dimData[`D${i}aa`];
    if (aa && aa.toLowerCase().includes('consistent')) consistentCount++;
  }

  // ============================================
  // CURRENT BENEFITS - Separate by status
  // ============================================
  // ============================================
  // CURRENT BENEFITS - Check multiple possible keys
  // ============================================
  // cb1 might be an array or might be nested under different keys
  let currentBenefits: string[] = [];
  if (general.cb1) {
    if (Array.isArray(general.cb1)) {
      currentBenefits = general.cb1;
    } else if (typeof general.cb1 === 'object') {
      // If it's an object, extract the values
      currentBenefits = Object.values(general.cb1).filter(v => typeof v === 'string') as string[];
    }
  }
  
  // Also check for benefits in various category keys
  const benefitCategories = ['cb1_standard', 'cb1_leave', 'cb1_wellness', 'cb1_financial', 'cb1_navigation'];
  benefitCategories.forEach(cat => {
    if (general[cat] && Array.isArray(general[cat])) {
      currentBenefits = [...currentBenefits, ...general[cat]];
    }
  });
  
  const plannedBenefits = general.cb2b || [];

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: BRAND.gray[100] }}>
        {/* ============================================
            MAIN CONTENT - Add id="profile-content" for PDF export
            ============================================ */}
        <main id="profile-content" className="max-w-7xl mx-auto px-6 py-8">
          
          {/* HEADER */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <Image src="/BI_LOGO_FINAL.png" alt="Beyond Insights" width={180} height={54} />
              <div className="flex gap-3 no-print">
                <button
                  onClick={() => router.push('/admin')}
                  className="px-5 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
                {/* ============================================
                    PDF Export Button - Generates FULL detailed report
                    ============================================ */}
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className={`px-5 py-2.5 text-white rounded-lg font-medium flex items-center gap-2 shadow-md ${
                    exporting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: BRAND.success }}
                >
                  {exporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export Full Report
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Company Banner - KEEP PURPLE since user liked it */}
            <div 
              className="rounded-2xl p-8 text-white shadow-xl"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80 mb-1">Best Companies for Working with Cancer Index</p>
                  <h1 className="text-3xl md:text-4xl font-black mb-4">
                    {assessment.company_name || 'Company Profile'}
                  </h1>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div><span className="opacity-70">Survey ID:</span> <span className="font-medium">{surveyId}</span></div>
                    <div><span className="opacity-70">Contact:</span> <span className="font-medium">{contactName}</span></div>
                    <div><span className="opacity-70">Title:</span> <span className="font-medium">{contactTitle}</span></div>
                    <div><span className="opacity-70">Email:</span> <span className="font-medium">{contactEmail}</span></div>
                  </div>
                </div>
                {/* Status Badge - Calculate from section completion */}
                {(() => {
                  const sectionKeys = [
                    'firmographics_complete', 'general_benefits_complete', 'current_support_complete',
                    'dimension1_complete', 'dimension2_complete', 'dimension3_complete', 'dimension4_complete',
                    'dimension5_complete', 'dimension6_complete', 'dimension7_complete', 'dimension8_complete',
                    'dimension9_complete', 'dimension10_complete', 'dimension11_complete', 'dimension12_complete',
                    'dimension13_complete', 'cross_dimensional_complete', 'employee-impact-assessment_complete'
                  ];
                  const completedSections = sectionKeys.filter(key => assessment[key] === true).length;
                  const completionPct = Math.round((completedSections / sectionKeys.length) * 100);
                  const isComplete = assessment.survey_completed || completionPct >= 100;
                  
                  return (
                    <div className={`backdrop-blur rounded-lg px-4 py-2 text-center ${isComplete ? 'bg-white/20' : 'bg-amber-500/30'}`}>
                      <p className="text-xs opacity-80">Status</p>
                      <p className="font-bold">
                        {isComplete ? '✓ Completed' : `In Progress (${completionPct}%)`}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </header>

          {/* EXECUTIVE SUMMARY */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: BRAND.gray[900] }}>Executive Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                label="Support Maturity" 
                value={`${maturityScore}%`}
                color={BRAND.primary}
                subtext={`${totalCurrently} of ${totalAnswered} answered`}
              />
              <StatCard 
                label="Currently Offering" 
                value={totalCurrently}
                color={STATUS_COLORS.current.bg}
                subtext="programs in place"
              />
              <StatCard 
                label="In Development" 
                value={totalPlanning}
                color={STATUS_COLORS.planning.bg}
                subtext="programs planned"
              />
              <StatCard 
                label="Global Consistency" 
                value={`${consistentCount}/13`}
                color={BRAND.secondary}
                subtext="dimensions consistent"
              />
            </div>
            {totalUnsure > 0 && (
              <p className="text-sm text-amber-600 mt-2">
                ⚠️ {totalUnsure} items marked as "Unsure" - respondent may not have complete visibility into all programs
              </p>
            )}
          </section>

          {/* COMPANY & CONTACT INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Company Information */}
            <SectionCard title="Company Information" color={BRAND.secondary}>
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Industry" value={industry} showNA />
                <DataField label="Total Employees" value={employees} showNA />
                <DataField label="Headquarters" value={headquarters} showNA />
                <DataField label="Countries of Operation" value={countries} showNA />
                <DataField label="Annual Revenue" value={revenue} showNA />
                <DataField label="Remote/Hybrid Policy" value={remotePolicy} showNA />
                <DataField label="Benefits Eligibility" value={benefitsEligibility} showNA />
                <DataField label="Employee Groups Excluded" value={excludedGroups} fullWidth />
              </div>
            </SectionCard>

            {/* Contact Information */}
            <SectionCard title="Contact Information" color={BRAND.accent}>
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Name" value={contactName} showNA />
                <DataField label="Title" value={contactTitle} showNA />
                <DataField label="Email" value={contactEmail} showNA />
                <DataField label="Department" value={department} showNA />
                <DataField label="Level" value={level} showNA />
                <DataField label="Benefits Influence" value={influence} showNA />
                <DataField label="Areas of Responsibility" value={responsibilities} fullWidth />
              </div>
            </SectionCard>
          </div>

          {/* PAYMENT INFO */}
          {assessment.payment_completed && (
            <div className="bg-white rounded-xl shadow-md p-5 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D1FAE5' }}>
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold" style={{ color: BRAND.gray[900] }}>
                    Payment: {assessment.payment_method === 'invoice' ? 'Invoice' : 'Paid Online'}
                    {assessment.is_founding_partner && ' (Founding Partner - Fee Waived)'}
                  </p>
                  <p className="text-sm" style={{ color: BRAND.gray[600] }}>
                    {assessment.payment_date ? new Date(assessment.payment_date).toLocaleDateString() : 'Date not recorded'}
                    {!assessment.is_founding_partner && ' • $1,250.00'}
                  </p>
                </div>
              </div>
              {assessment.payment_method === 'invoice' && (
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="px-5 py-2.5 text-white rounded-lg font-medium flex items-center gap-2 no-print shadow-md"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Invoice
                </button>
              )}
            </div>
          )}

          {/* CURRENT BENEFITS LANDSCAPE */}
          {(currentBenefits.length > 0 || plannedBenefits.length > 0) && (
            <SectionCard title="Benefits Landscape" color={BRAND.info}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Currently Offered */}
                {currentBenefits.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.current.bg }} />
                      <p className="text-sm font-bold uppercase tracking-wide" style={{ color: BRAND.gray[600] }}>
                        Currently Offered ({currentBenefits.length})
                      </p>
                    </div>
                    <ul className="space-y-1 bg-green-50 rounded-lg p-4">
                      {currentBenefits.map((benefit: string, i: number) => (
                        <li key={i} className="text-sm flex items-start" style={{ color: BRAND.gray[800] }}>
                          <span className="mr-2 text-green-600">✓</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Planned Benefits */}
                {plannedBenefits.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.planning.bg }} />
                      <p className="text-sm font-bold uppercase tracking-wide" style={{ color: BRAND.gray[600] }}>
                        Planned for Next 2 Years ({plannedBenefits.length})
                      </p>
                    </div>
                    <ul className="space-y-1 bg-amber-50 rounded-lg p-4">
                      {plannedBenefits.map((benefit: string, i: number) => (
                        <li key={i} className="text-sm flex items-start" style={{ color: BRAND.gray[800] }}>
                          <span className="mr-2 text-amber-600">○</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* National Healthcare % */}
              {general.cb1a && (
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: BRAND.gray[50] }}>
                  <span className="text-xs font-bold uppercase" style={{ color: BRAND.gray[500] }}>
                    Employees with National Healthcare Access:{' '}
                  </span>
                  <span className="text-sm font-medium" style={{ color: BRAND.gray[800] }}>
                    {general.cb1a}%
                  </span>
                </div>
              )}
            </SectionCard>
          )}

          {/* CURRENT SUPPORT APPROACH */}
          {Object.keys(support).length > 0 && (
            <SectionCard title="Current Support Approach" color={BRAND.primary}>
              <div className="space-y-6">
                {/* Top row - Approach and Barriers side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Approach */}
                  {support.or1 && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.primary }}>
                        Current Approach
                      </p>
                      <p className="text-sm font-medium" style={{ color: BRAND.gray[800] }}>
                        {formatDisplayValue(support.or1, support, 'or1')}
                      </p>
                    </div>
                  )}
                  
                  {/* Support Beyond Legal */}
                  {support.cb3a && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <p className="text-xs font-bold uppercase tracking-wide mb-2 text-green-700">
                        Support Beyond Legal Requirements
                      </p>
                      <p className="text-sm font-medium" style={{ color: BRAND.gray[800] }}>
                        {formatDisplayValue(support.cb3a, support, 'cb3a')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary Barriers */}
                {support.or3 && Array.isArray(support.or3) && support.or3.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <p className="text-xs font-bold uppercase tracking-wide mb-3 text-red-700">
                      Primary Barriers
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {support.or3.map((barrier: string, i: number) => (
                        <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {barrier}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Effectiveness Monitoring */}
                {support.or6 && Array.isArray(support.or6) && support.or6.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-xs font-bold uppercase tracking-wide mb-3 text-blue-700">
                      Effectiveness Monitoring
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {support.or6.map((method: string, i: number) => (
                        <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Program Structure */}
                {support.cb3b && Array.isArray(support.cb3b) && support.cb3b.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: BRAND.gray[500] }}>
                      Program Structure
                    </p>
                    <ul className="space-y-1">
                      {support.cb3b.map((item: string, i: number) => (
                        <li key={i} className="text-sm flex items-start" style={{ color: BRAND.gray[800] }}>
                          <span className="mr-2 text-purple-600">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Health Conditions Covered */}
                {support.cb3c && Array.isArray(support.cb3c) && support.cb3c.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: BRAND.gray[500] }}>
                      Health Conditions Covered ({support.cb3c.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {support.cb3c.map((condition: string, i: number) => (
                        <div key={i} className="flex items-center text-sm p-2 bg-gray-50 rounded" style={{ color: BRAND.gray[800] }}>
                          <span className="mr-2 text-green-500">✓</span>
                          {condition}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Program Development Method */}
                {support.cb3d && Array.isArray(support.cb3d) && support.cb3d.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: BRAND.gray[500] }}>
                      Program Development Method
                    </p>
                    <ul className="space-y-1">
                      {support.cb3d.map((method: string, i: number) => (
                        <li key={i} className="text-sm flex items-start" style={{ color: BRAND.gray[800] }}>
                          <span className="mr-2 text-purple-600">•</span>
                          {method}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Caregiver Support Types */}
                {support.or5a && Array.isArray(support.or5a) && support.or5a.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: BRAND.gray[500] }}>
                      Caregiver Support Types ({support.or5a.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {support.or5a.map((type: string, i: number) => (
                        <div key={i} className="flex items-center text-sm p-2 bg-amber-50 rounded border border-amber-100" style={{ color: BRAND.gray[800] }}>
                          <span className="mr-2 text-amber-600">•</span>
                          {type}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* 13 DIMENSIONS */}
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: BRAND.gray[900] }}>
              13 Dimensions of Support
            </h2>
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
            <SectionCard title="Cross-Dimensional Assessment" color={BRAND.accent}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Top Priorities */}
                {cross.cd1a && Array.isArray(cross.cd1a) && cross.cd1a.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs font-bold uppercase mb-3 text-green-700">Top 3 Priorities</p>
                    <ol className="space-y-2">
                      {cross.cd1a.map((dim: string, i: number) => (
                        <li key={i} className="text-sm flex items-start" style={{ color: BRAND.gray[800] }}>
                          <span className="mr-2 font-bold text-green-600">{i + 1}.</span>
                          {dim}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Lowest Priorities */}
                {cross.cd1b && Array.isArray(cross.cd1b) && cross.cd1b.length > 0 && (
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-xs font-bold uppercase mb-3 text-amber-700">Lowest Priorities</p>
                    <ol className="space-y-2">
                      {cross.cd1b.map((dim: string, i: number) => (
                        <li key={i} className="text-sm flex items-start" style={{ color: BRAND.gray[800] }}>
                          <span className="mr-2 font-bold text-amber-600">{i + 1}.</span>
                          {dim}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Challenges */}
                {cross.cd2 && Array.isArray(cross.cd2) && cross.cd2.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-xs font-bold uppercase mb-3 text-red-700">Biggest Challenges</p>
                    <ul className="space-y-2">
                      {cross.cd2.map((chal: string, i: number) => {
                        // Handle "Other" challenges
                        let displayChal = chal;
                        if (chal.toLowerCase().includes('other')) {
                          const otherVal = getOtherSpecifyValue(cross, 'cd2');
                          if (otherVal) displayChal = otherVal;
                          else return null;
                        }
                        return (
                          <li key={i} className="text-sm flex items-start" style={{ color: BRAND.gray[800] }}>
                            <span className="mr-2 text-red-600">•</span>
                            {displayChal}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* EMPLOYEE IMPACT ASSESSMENT */}
          {Object.keys(impact).length > 0 && (
            <SectionCard title="Employee Impact Assessment" color={BRAND.success}>
              {/* Impact Ratings */}
              {impact.ei1 && typeof impact.ei1 === 'object' && (
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: BRAND.gray[500] }}>
                    Program Impact by Outcome Area
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(impact.ei1).map(([outcome, rating]) => {
                      const ratingStr = String(rating).toLowerCase();
                      let bgColor = BRAND.gray[100];
                      let dotColor = BRAND.gray[400];
                      
                      if (ratingStr.includes('significant')) {
                        bgColor = '#D1FAE5'; dotColor = '#10B981';
                      } else if (ratingStr.includes('moderate')) {
                        bgColor = '#DBEAFE'; dotColor = '#3B82F6';
                      } else if (ratingStr.includes('minimal')) {
                        bgColor = '#FEF3C7'; dotColor = '#F59E0B';
                      } else if (ratingStr.includes('no positive')) {
                        bgColor = '#FEE2E2'; dotColor = '#EF4444';
                      }
                      
                      return (
                        <div 
                          key={outcome}
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{ backgroundColor: bgColor }}
                        >
                          <span className="text-sm" style={{ color: BRAND.gray[800] }}>{outcome}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }} />
                            <span className="text-xs font-medium" style={{ color: BRAND.gray[600] }}>
                              {String(rating).replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ROI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {impact.ei2 && (
                  <DataField label="ROI Measurement Status" value={formatDisplayValue(impact.ei2, impact, 'ei2') as string} />
                )}
                {impact.ei3 && (
                  <DataField label="Approximate ROI" value={formatDisplayValue(impact.ei3, impact, 'ei3') as string} />
                )}
              </div>

              {/* Open-End: Advice */}
              <div className="space-y-4">
                <OpenEndResponse 
                  label="Advice for Other HR Leaders (EI4)" 
                  value={
                    impact.ei4 && typeof impact.ei4 === 'string' && impact.ei4.trim() && impact.ei4 !== 'true' 
                      ? impact.ei4 
                      : null
                  }
                />
                <OpenEndResponse 
                  label="Survey Gaps / Important Aspects Not Addressed (EI5)" 
                  value={
                    impact.ei5 && typeof impact.ei5 === 'string' && impact.ei5.trim() && impact.ei5 !== 'true'
                      ? impact.ei5 
                      : null
                  }
                />
              </div>
            </SectionCard>
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
                style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, #4C1D95 100%)` }}
              >
                <h2 className="text-xl font-bold">Invoice</h2>
                <p className="text-sm opacity-80 mt-1">{assessment.company_name}</p>
              </div>
              
              <div className="p-6">
                <button
                  onClick={async () => {
                    const invoiceData: InvoiceData = {
                      invoiceNumber: assessment.survey_id || assessment.app_id,
                      invoiceDate: assessment.payment_date ? new Date(assessment.payment_date).toLocaleDateString() : new Date().toLocaleDateString(),
                      dueDate: assessment.payment_date ? new Date(new Date(assessment.payment_date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                      companyName: assessment.company_name || 'Company',
                      contactName: contactName !== 'Not provided' ? contactName : 'Contact',
                      title: contactTitle !== 'Not provided' ? contactTitle : undefined,
                      addressLine1: firm.addressLine1 || '(Address on file)',
                      addressLine2: firm.addressLine2,
                      city: firm.city || '',
                      state: firm.state || '',
                      zipCode: firm.zipCode || '',
                      country: firm.country || 'United States',
                      poNumber: firm.poNumber,
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
              
              <div className="px-6 py-4 border-t flex justify-end" style={{ backgroundColor: BRAND.gray[50] }}>
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

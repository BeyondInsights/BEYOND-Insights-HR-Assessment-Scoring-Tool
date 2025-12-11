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
  const geoConsistency = dimData?.[geoConsistencyKey];
  
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
    // Skip main grid, open-end, geo consistency
    if (key === mainGridKey || key === openEndKey || key === geoConsistencyKey) return;
    if (!key.startsWith(`d${dimNum}`)) return;
    
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
  // NEW: PDF Export Function using html2pdf.js
  // ============================================
  const handleExportPDF = async () => {
    try {
      setExporting(true);

      // Load html2pdf library dynamically from CDN
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load PDF library'));
          document.head.appendChild(script);
        });
      }

      const html2pdf = (window as any).html2pdf;
      const element = document.getElementById('profile-content');

      if (!element) {
        alert('Content not found');
        return;
      }

      // Clone element to avoid modifying original
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Remove buttons and no-print elements from clone
      clone.querySelectorAll('button, .no-print, [class*="no-print"]').forEach(el => el.remove());
      
      // Expand all collapsed sections in clone for PDF
      clone.querySelectorAll('[style*="display: none"]').forEach(el => {
        (el as HTMLElement).style.display = 'block';
      });

      // PDF options
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${assessment?.company_name?.replace(/[^a-zA-Z0-9]/g, '-') || surveyId}-profile-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          scrollY: -window.scrollY
        },
        jsPDF: {
          unit: 'mm',
          format: 'letter',
          orientation: 'portrait' as const
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy']
        }
      };

      await html2pdf().set(opt).from(clone).save();

    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Please try again.');
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
  // Handle title "Other" case
  let contactTitle = firm.title || null;
  if (contactTitle && contactTitle.toLowerCase() === 'other') {
    contactTitle = firm.titleOther || firm.title_other || contactTitle;
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
    const aa = assessment[`dimension${i}_data`]?.[`d${i}aa`];
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
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
      
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
                    UPDATED: PDF Export Button with loading state
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
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export PDF
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
                {assessment.payment_completed && (
                  <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 text-center">
                    <p className="text-xs opacity-80">Status</p>
                    <p className="font-bold">✓ Completed</p>
                  </div>
                )}
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

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { SCORING_CONFIG, getTierFromScore, getTotalDimensionWeight } from '@/lib/scoring-config';
import Image from 'next/image';

// ============================================
// CUSTOM SVG ICONS (No emojis)
// ============================================

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const ArrowUpIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

const ArrowRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const ChartIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
);

const TargetIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="10" r="8" />
    <circle cx="10" cy="10" r="5" />
    <circle cx="10" cy="10" r="2" />
  </svg>
);

const TrendUpIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
  </svg>
);

const LightbulbIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zm4.657 2.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm3 6v-1h4v1a2 2 0 11-4 0zm4-2c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
  </svg>
);

const AlertIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

// ============================================
// CONSTANTS
// ============================================

const DIMENSION_RECOMMENDATIONS: Record<number, { focus: string; actions: string[] }> = {
  1: { 
    focus: 'Paid leave policies directly impact employee financial security during treatment',
    actions: ['Review leave policies against industry benchmarks', 'Consider phased return to work programs', 'Evaluate short term disability coverage adequacy']
  },
  2: { 
    focus: 'Comprehensive insurance reduces financial toxicity, a leading cause of treatment non adherence',
    actions: ['Audit out of pocket maximum exposure', 'Review specialty drug coverage tiers', 'Consider supplemental cancer insurance options']
  },
  3: { 
    focus: 'Managers are often the first point of contact and their response shapes the employee experience',
    actions: ['Implement manager training on sensitive conversations', 'Create manager resource toolkit', 'Establish HR escalation pathways']
  },
  4: { 
    focus: 'Navigation support reduces care fragmentation and improves outcomes',
    actions: ['Partner with oncology navigation services', 'Integrate EAP with cancer specific resources', 'Provide second opinion services']
  },
  5: { 
    focus: 'Flexible accommodations enable continued productivity during treatment',
    actions: ['Formalize accommodation request process', 'Train managers on interactive dialogue requirements', 'Document successful accommodation patterns']
  },
  6: { 
    focus: 'Psychological safety determines whether employees feel comfortable disclosing and seeking support',
    actions: ['Launch employee resource group', 'Share leadership stories of support', 'Conduct climate surveys on disclosure comfort']
  },
  7: { 
    focus: 'Career protection concerns are a top reason employees hide diagnoses',
    actions: ['Clarify performance evaluation processes during treatment', 'Document promotion pathways post treatment', 'Address equivalent concerns for all employees']
  },
  8: { 
    focus: 'Structured return to work programs improve retention and reduce disability duration',
    actions: ['Develop graduated return protocols', 'Assign return to work coordinators', 'Create peer support connections']
  },
  9: { 
    focus: 'Visible executive commitment signals organizational priority and enables resource allocation',
    actions: ['Include cancer support in benefits communications', 'Allocate dedicated program budget', 'Establish executive sponsor role']
  },
  10: { 
    focus: 'Caregivers face significant work disruption and supporting them prevents secondary attrition',
    actions: ['Extend flexible work to caregivers', 'Provide caregiver specific EAP resources', 'Consider backup care services']
  },
  11: { 
    focus: 'Prevention and early detection programs demonstrate investment in long term employee health',
    actions: ['Promote cancer screening benefits', 'Offer on site screening events', 'Incentivize preventive care utilization']
  },
  12: { 
    focus: 'Systematic measurement enables continuous improvement and demonstrates ROI',
    actions: ['Track utilization of cancer related benefits', 'Survey affected employees on experience', 'Benchmark against industry standards']
  },
  13: { 
    focus: 'Awareness drives utilization because employees cannot use benefits they do not know exist',
    actions: ['Include cancer support in onboarding', 'Create dedicated intranet resource page', 'Communicate during open enrollment and cancer awareness months']
  }
};

const DEFAULT_DIMENSION_WEIGHTS = SCORING_CONFIG.dimensionWeights;
const DIMENSION_NAMES = SCORING_CONFIG.dimensionNames;

const DIMENSION_QUESTION_COUNTS: Record<number, number> = {
  1: 9, 2: 12, 3: 8, 4: 13, 5: 11, 6: 7, 7: 5, 8: 10, 9: 5, 10: 7, 11: 3, 12: 7, 13: 7
};

// ============================================
// SCORING FUNCTIONS
// ============================================

function getTier(score: number): { name: string; color: string; bgColor: string; textColor: string; borderColor: string } {
  const tier = getTierFromScore(score);
  const tierMap: Record<string, { textColor: string; borderColor: string }> = {
    'Exemplary': { textColor: 'text-emerald-800', borderColor: 'border-emerald-300' },
    'Leading': { textColor: 'text-blue-800', borderColor: 'border-blue-300' },
    'Progressing': { textColor: 'text-amber-800', borderColor: 'border-amber-300' },
    'Emerging': { textColor: 'text-orange-800', borderColor: 'border-orange-300' },
    'Developing': { textColor: 'text-gray-700', borderColor: 'border-gray-300' },
  };
  const extra = tierMap[tier.name] || tierMap['Developing'];
  return {
    name: tier.name,
    color: tier.color,
    bgColor: tier.bgColor,
    textColor: extra.textColor,
    borderColor: extra.borderColor,
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#0284C7';
  if (score >= 40) return '#D97706';
  return '#DC2626';
}

function getGeoMultiplier(geoResponse: string | number | undefined | null): number {
  if (geoResponse === undefined || geoResponse === null) return 1.0;
  
  if (typeof geoResponse === 'number') {
    switch (geoResponse) {
      case 1: return 0.75;
      case 2: return 0.90;
      case 3: return 1.0;
      default: return 1.0;
    }
  }
  
  const s = String(geoResponse).toLowerCase();
  if (s.includes('consistent') || s.includes('generally consistent')) return 1.0;
  if (s.includes('vary') || s.includes('varies')) return 0.90;
  if (s.includes('select') || s.includes('only available in select')) return 0.75;
  return 1.0;
}

function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean; category: string } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: 5, isUnsure: false, category: 'currently_offer' };
      case 3: return { points: 3, isUnsure: false, category: 'planning' };
      case 2: return { points: 2, isUnsure: false, category: 'assessing' };
      case 1: return { points: 0, isUnsure: false, category: 'not_able' };
      case 5: return { points: null, isUnsure: true, category: 'unsure' };
      default: return { points: null, isUnsure: false, category: 'unknown' };
    }
  }
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return { points: 0, isUnsure: false, category: 'not_able' };
    if (s === 'unsure' || s.includes('unsure') || s.includes('unknown')) return { points: null, isUnsure: true, category: 'unsure' };
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || 
        s.includes('use') || s.includes('track') || s.includes('measure')) {
      return { points: 5, isUnsure: false, category: 'currently_offer' };
    }
    if (s.includes('planning') || s.includes('development')) return { points: 3, isUnsure: false, category: 'planning' };
    if (s.includes('assessing') || s.includes('feasibility')) return { points: 2, isUnsure: false, category: 'assessing' };
    if (s.length > 0) return { points: 0, isUnsure: false, category: 'not_able' };
  }
  return { points: null, isUnsure: false, category: 'unknown' };
}

function getStatusText(status: string | number): string {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return 'Currently offer';
      case 3: return 'Planning';
      case 2: return 'Assessing';
      case 1: return 'Gap';
      case 5: return 'To clarify';
      default: return 'Unknown';
    }
  }
  return String(status);
}

// Follow up scoring functions
function scoreD1PaidLeave(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('13') || v.includes('more')) return 100;
  if (v.includes('9') && v.includes('13')) return 70;
  if (v.includes('5') && v.includes('9')) return 40;
  if (v.includes('3') && v.includes('5')) return 20;
  if (v.includes('1') && v.includes('3')) return 10;
  if (v.includes('does not apply')) return 0;
  return 0;
}

function scoreD1PartTime(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('medically necessary')) return 100;
  if (v.includes('26') || (v.includes('26') && v.includes('more'))) return 80;
  if (v.includes('13') && v.includes('26')) return 50;
  if (v.includes('5') && v.includes('13')) return 30;
  if (v.includes('4 weeks') || v.includes('up to 4')) return 10;
  if (v.includes('case-by-case')) return 40;
  if (v.includes('no additional')) return 0;
  return 0;
}

function scoreD3Training(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v === '100%' || v.includes('100%')) return 100;
  if (v.includes('mandatory for all')) return 100;
  if (v.includes('mandatory for new')) return 60;
  if (v.includes('voluntary')) return 30;
  if (v.includes('varies')) return 40;
  return 0;
}

function scoreD12CaseReview(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('systematic')) return 100;
  if (v.includes('ad hoc')) return 50;
  if (v.includes('aggregate') || v.includes('only review aggregate')) return 20;
  return 0;
}

function scoreD13Communication(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('monthly')) return 100;
  if (v.includes('quarterly')) return 70;
  if (v.includes('twice')) return 40;
  if (v.includes('annually') || v.includes('world cancer day')) return 20;
  if (v.includes('only when asked')) return 0;
  if (v.includes('do not actively')) return 0;
  return 0;
}

function calculateFollowUpScore(dimNum: number, assessment: Record<string, any>): number | null {
  const dimData = assessment[`dimension${dimNum}_data`];
  
  switch (dimNum) {
    case 1: {
      const d1_1_usa = dimData?.d1_1_usa;
      const d1_1_non_usa = dimData?.d1_1_non_usa;
      const d1_4b = dimData?.d1_4b;
      const scores: number[] = [];
      if (d1_1_usa) scores.push(scoreD1PaidLeave(d1_1_usa));
      if (d1_1_non_usa) scores.push(scoreD1PaidLeave(d1_1_non_usa));
      if (d1_4b) scores.push(scoreD1PartTime(d1_4b));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 3: {
      const d31 = dimData?.d31 ?? dimData?.d3_1;
      return d31 ? scoreD3Training(d31) : null;
    }
    case 12: {
      const d12_1 = dimData?.d12_1;
      const d12_2 = dimData?.d12_2;
      const scores: number[] = [];
      if (d12_1) scores.push(scoreD12CaseReview(d12_1));
      if (d12_2) {
        const v = String(d12_2).toLowerCase();
        if (v.includes('significant') || v.includes('major')) scores.push(100);
        else if (v.includes('some') || v.includes('minor')) scores.push(60);
        else scores.push(20);
      }
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 13: {
      const d13_1 = dimData?.d13_1;
      return d13_1 ? scoreD13Communication(d13_1) : null;
    }
    default:
      return null;
  }
}

function calculateMaturityScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const or1 = currentSupport.or1;
  
  if (or1 === 6 || or1 === '6') return 100;
  if (or1 === 5 || or1 === '5') return 80;
  if (or1 === 4 || or1 === '4') return 50;
  if (or1 === 3 || or1 === '3') return 20;
  if (or1 === 2 || or1 === '2') return 0;
  if (or1 === 1 || or1 === '1') return 0;
  
  const v = String(or1 || '').toLowerCase();
  if (v.includes('leading-edge') || v.includes('leading edge')) return 100;
  if (v.includes('comprehensive')) return 100;
  if (v.includes('enhanced') || v.includes('strong')) return 80;
  if (v.includes('moderate')) return 50;
  if (v.includes('basic')) return 20;
  if (v.includes('developing')) return 20;
  if (v.includes('legal minimum')) return 0;
  if (v.includes('no formal')) return 0;
  return 0;
}

function calculateBreadthScore(assessment: Record<string, any>): number {
  // Check BOTH current_support_data AND general_benefits_data for cb3 fields
  // Some companies have these in current_support_data, others in general_benefits_data
  const currentSupport = assessment.current_support_data || {};
  const generalBenefits = assessment.general_benefits_data || {};
  
  const scores: number[] = [];
  
  // CB3a: Check both sources, prefer current_support_data if present
  const cb3a = currentSupport.cb3a ?? generalBenefits.cb3a;
  
  // Handle numeric codes first (from imported data)
  if (cb3a === 3 || cb3a === '3') {
    scores.push(100); // Yes, we offer additional support
  } else if (cb3a === 2 || cb3a === '2') {
    scores.push(50); // Currently developing
  } else if (cb3a === 1 || cb3a === '1') {
    scores.push(0); // No additional support
  } else if (cb3a !== undefined && cb3a !== null) {
    // Fall back to text matching for survey app entries
    const v = String(cb3a).toLowerCase();
    if (v.includes('yes') && v.includes('additional support')) {
      scores.push(100);
    } else if (v.includes('developing') || v.includes('currently developing')) {
      scores.push(50);
    } else {
      scores.push(0);
    }
  } else {
    scores.push(0);
  }
  
  // CB3b: Check both sources
  const cb3b = currentSupport.cb3b || generalBenefits.cb3b;
  if (cb3b && Array.isArray(cb3b)) {
    const cb3bScore = Math.min(100, Math.round((cb3b.length / 6) * 100));
    scores.push(cb3bScore);
  } else {
    scores.push(0);
  }
  
  // CB3c: Check both sources
  const cb3c = currentSupport.cb3c || generalBenefits.cb3c;
  if (cb3c && Array.isArray(cb3c)) {
    const cb3cScore = Math.min(100, Math.round((cb3c.length / 13) * 100));
    scores.push(cb3cScore);
  } else {
    scores.push(0);
  }
  
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

// ============================================
// STRATEGIC PRIORITY MATRIX COMPONENT
// ============================================

interface MatrixProps {
  dimensionAnalysis: any[];
  getScoreColor: (score: number) => string;
}

function StrategicPriorityMatrix({ dimensionAnalysis, getScoreColor }: MatrixProps) {
  const maxWeight = Math.max(...dimensionAnalysis.map(d => d.weight));
  const minWeight = Math.min(...dimensionAnalysis.map(d => d.weight));
  const weightRange = maxWeight - minWeight || 1;
  
  // Calculate quadrant thresholds
  const scoreThreshold = 60; // Midpoint for score
  const weightThreshold = (maxWeight + minWeight) / 2;
  
  return (
    <div className="px-6 py-8">
      <div className="relative" style={{ height: '480px' }}>
        {/* SVG-based chart for professional appearance - WIDER */}
        <svg className="w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
          {/* Definitions */}
          <defs>
            {/* Gradients for quadrants */}
            <linearGradient id="developGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="maintainGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D1FAE5" />
              <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="monitorGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="leverageGrad" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#DBEAFE" />
              <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.3" />
            </linearGradient>
            
            {/* Drop shadow for circles */}
            <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25"/>
            </filter>
          </defs>
          
          {/* Chart background and quadrants - WIDER */}
          <g transform="translate(70, 20)">
            {/* Quadrant backgrounds */}
            <rect x="0" y="0" width="330" height="190" fill="url(#developGrad)" rx="6" />
            <rect x="330" y="0" width="330" height="190" fill="url(#maintainGrad)" rx="6" />
            <rect x="0" y="190" width="330" height="190" fill="url(#monitorGrad)" rx="6" />
            <rect x="330" y="190" width="330" height="190" fill="url(#leverageGrad)" rx="6" />
            
            {/* Grid lines */}
            <g stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.6">
              {/* Vertical gridlines */}
              <line x1="165" y1="0" x2="165" y2="380" />
              <line x1="495" y1="0" x2="495" y2="380" />
              {/* Horizontal gridlines */}
              <line x1="0" y1="95" x2="660" y2="95" />
              <line x1="0" y1="285" x2="660" y2="285" />
            </g>
            
            {/* Center axis lines */}
            <line x1="330" y1="0" x2="330" y2="380" stroke="#94A3B8" strokeWidth="2" />
            <line x1="0" y1="190" x2="660" y2="190" stroke="#94A3B8" strokeWidth="2" />
            
            {/* Outer border */}
            <rect x="0" y="0" width="660" height="380" fill="none" stroke="#CBD5E1" strokeWidth="2" rx="6" />
            
            {/* Quadrant labels */}
            <g className="text-sm font-semibold" opacity="0.3">
              <text x="165" y="95" textAnchor="middle" fill="#D97706" fontSize="22" fontWeight="700">DEVELOP</text>
              <text x="165" y="120" textAnchor="middle" fill="#D97706" fontSize="13">High Priority</text>
              
              <text x="495" y="95" textAnchor="middle" fill="#059669" fontSize="22" fontWeight="700">MAINTAIN</text>
              <text x="495" y="120" textAnchor="middle" fill="#059669" fontSize="13">Protect Strengths</text>
              
              <text x="165" y="285" textAnchor="middle" fill="#64748B" fontSize="22" fontWeight="700">MONITOR</text>
              <text x="165" y="310" textAnchor="middle" fill="#64748B" fontSize="13">Watch and Wait</text>
              
              <text x="495" y="285" textAnchor="middle" fill="#0284C7" fontSize="22" fontWeight="700">LEVERAGE</text>
              <text x="495" y="310" textAnchor="middle" fill="#0284C7" fontSize="13">Quick Wins</text>
            </g>
            
            {/* Data points */}
            {dimensionAnalysis.map((d) => {
              const xPos = (d.score / 100) * 660;
              const yPos = 380 - (((d.weight - minWeight) / weightRange) * 380);
              
              return (
                <g key={d.dim} transform={`translate(${xPos}, ${yPos})`}>
                  {/* Outer ring */}
                  <circle r="26" fill="white" filter="url(#dropShadow)" />
                  {/* Inner circle */}
                  <circle r="22" fill={getScoreColor(d.score)} />
                  {/* Dimension number */}
                  <text 
                    textAnchor="middle" 
                    dominantBaseline="central" 
                    fill="white" 
                    fontSize="14" 
                    fontWeight="700"
                  >
                    D{d.dim}
                  </text>
                </g>
              );
            })}
            
            {/* X-axis ticks and labels */}
            <g transform="translate(0, 380)">
              <line x1="0" y1="0" x2="660" y2="0" stroke="#94A3B8" strokeWidth="2" />
              {[0, 25, 50, 75, 100].map((val, i) => (
                <g key={val} transform={`translate(${val * 6.6}, 0)`}>
                  <line y1="0" y2="8" stroke="#94A3B8" strokeWidth="2" />
                  <text y="24" textAnchor="middle" fill="#64748B" fontSize="13">{val}</text>
                </g>
              ))}
              <text x="330" y="48" textAnchor="middle" fill="#475569" fontSize="14" fontWeight="600">
                CURRENT PERFORMANCE
              </text>
            </g>
          </g>
          
          {/* Y-axis */}
          <g transform="translate(70, 20)">
            <line x1="0" y1="0" x2="0" y2="380" stroke="#94A3B8" strokeWidth="2" />
            {/* Y-axis ticks */}
            <g>
              <line x1="-8" y1="0" x2="0" y2="0" stroke="#94A3B8" strokeWidth="2" />
              <text x="-12" y="5" textAnchor="end" fill="#64748B" fontSize="13">{maxWeight}%</text>
              
              <line x1="-8" y1="190" x2="0" y2="190" stroke="#94A3B8" strokeWidth="2" />
              <text x="-12" y="195" textAnchor="end" fill="#64748B" fontSize="13">{Math.round(weightThreshold)}%</text>
              
              <line x1="-8" y1="380" x2="0" y2="380" stroke="#94A3B8" strokeWidth="2" />
              <text x="-12" y="385" textAnchor="end" fill="#64748B" fontSize="13">{minWeight}%</text>
            </g>
            
            {/* Y-axis label */}
            <text 
              transform="rotate(-90)" 
              x="-190" 
              y="-50" 
              textAnchor="middle" 
              fill="#475569" 
              fontSize="14" 
              fontWeight="600"
            >
              STRATEGIC WEIGHT
            </text>
          </g>
        </svg>
      </div>
      
      {/* Legend - Larger */}
      <div className="mt-8 pt-5 border-t border-slate-200">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {dimensionAnalysis.map(d => (
            <div key={d.dim} className="flex items-center gap-3">
              <span 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ backgroundColor: getScoreColor(d.score) }}
              >
                D{d.dim}
              </span>
              <span className="text-sm text-slate-600">{d.name.split('&')[0].trim()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CompanyReportPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = Array.isArray(params.surveyId) ? params.surveyId[0] : params.surveyId;
  const printRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [companyScores, setCompanyScores] = useState<any>(null);
  const [elementDetails, setElementDetails] = useState<any>(null);
  const [percentileRank, setPercentileRank] = useState<number | null>(null);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('survey_id', surveyId)
          .single();
        
        if (assessmentError || !assessment) {
          setError(`Company not found: ${assessmentError?.message || 'No data'}`);
          setLoading(false);
          return;
        }
        
        const { data: allAssessments } = await supabase
          .from('assessments')
          .select('*');
        
        const { scores, elements } = calculateCompanyScores(assessment);
        setCompanyScores(scores);
        setElementDetails(elements);
        setCompany(assessment);
        
        if (allAssessments) {
          const benchmarkScores = calculateBenchmarks(allAssessments);
          setBenchmarks(benchmarkScores);
          
          const completeAssessments = allAssessments.filter(a => {
            let completedDims = 0;
            for (let dim = 1; dim <= 13; dim++) {
              const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
              if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) {
                completedDims++;
              }
            }
            return completedDims === 13;
          });
          
          const allComposites = completeAssessments
            .map(a => {
              try {
                const { scores: s } = calculateCompanyScores(a);
                return s.compositeScore;
              } catch { return null; }
            })
            .filter(s => s !== null && s !== undefined) as number[];
          
          if (allComposites.length > 0 && scores.compositeScore) {
            const belowCount = allComposites.filter(s => s < scores.compositeScore).length;
            const percentile = Math.round((belowCount / allComposites.length) * 100);
            setPercentileRank(percentile);
            setTotalCompanies(allComposites.length);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading report data:', err);
        setError('Failed to load report data');
        setLoading(false);
      }
    }
    
    if (surveyId) {
      loadData();
    } else {
      setError('No survey ID provided');
      setLoading(false);
    }
  }, [surveyId]);

  function calculateCompanyScores(assessment: Record<string, any>) {
    const dimensionScores: Record<number, number | null> = {};
    const followUpScores: Record<number, number | null> = {};
    const elementsByDim: Record<number, any[]> = {};
    const blendedScores: Record<number, number> = {};
    
    const blendWeights = SCORING_CONFIG.blendWeights;
    
    let completedDimCount = 0;
    
    for (let dim = 1; dim <= 13; dim++) {
      const dimData = assessment[`dimension${dim}_data`];
      const mainGrid = dimData?.[`d${dim}a`];
      
      elementsByDim[dim] = [];
      blendedScores[dim] = 0;
      
      if (!mainGrid || typeof mainGrid !== 'object') {
        dimensionScores[dim] = null;
        continue;
      }
      
      let earnedPoints = 0;
      let totalItems = 0;
      let answeredItems = 0;
      let unsureCount = 0;
      
      Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
        totalItems++;
        const result = statusToPoints(status);
        
        if (result.isUnsure) {
          unsureCount++;
          answeredItems++;
        } else if (result.points !== null) {
          answeredItems++;
          earnedPoints += result.points;
        }
        
        elementsByDim[dim].push({
          name: itemKey,
          status: getStatusText(status),
          category: result.category,
          points: result.points ?? 0,
          maxPoints: 5,
          isStrength: result.points === 5,
          isPlanning: result.category === 'planning',
          isAssessing: result.category === 'assessing',
          isGap: result.category === 'not_able',
          isUnsure: result.isUnsure
        });
      });
      
      if (totalItems > 0) completedDimCount++;
      
      const maxPoints = answeredItems * 5;
      const rawScore = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
      
      const geoResponse = dimData[`d${dim}aa`] || dimData[`D${dim}aa`];
      const geoMultiplier = getGeoMultiplier(geoResponse);
      const adjustedScore = Math.round(rawScore * geoMultiplier);
      
      let blendedScore = adjustedScore;
      if ([1, 3, 12, 13].includes(dim)) {
        const followUp = calculateFollowUpScore(dim, assessment);
        followUpScores[dim] = followUp;
        if (followUp !== null) {
          const key = `d${dim}` as keyof typeof blendWeights;
          const gridPct = blendWeights[key]?.grid ?? 85;
          const followUpPct = blendWeights[key]?.followUp ?? 15;
          blendedScore = Math.round((adjustedScore * (gridPct / 100)) + (followUp * (followUpPct / 100)));
        }
      }
      
      dimensionScores[dim] = blendedScore;
      blendedScores[dim] = blendedScore;
    }
    
    const isComplete = completedDimCount === 13;
    
    let weightedDimScore: number | null = null;
    
    if (isComplete) {
      const totalWeight = Object.values(DEFAULT_DIMENSION_WEIGHTS).reduce((sum, w) => sum + w, 0);
      let weightedScore = 0;
      
      if (totalWeight > 0) {
        for (let i = 1; i <= 13; i++) {
          const weight = DEFAULT_DIMENSION_WEIGHTS[i] || 0;
          weightedScore += blendedScores[i] * (weight / totalWeight);
        }
      }
      weightedDimScore = Math.round(weightedScore);
    }
    
    const maturityScore = calculateMaturityScore(assessment);
    const breadthScore = calculateBreadthScore(assessment);
    
    const { weightedDim, maturity, breadth } = SCORING_CONFIG.compositeWeights;
    const compositeScore = isComplete && weightedDimScore !== null
      ? Math.round(
          (weightedDimScore * (weightedDim / 100)) +
          (maturityScore * (maturity / 100)) +
          (breadthScore * (breadth / 100))
        )
      : null;
    
    return {
      scores: {
        compositeScore,
        weightedDimScore,
        maturityScore,
        breadthScore,
        dimensionScores,
        followUpScores,
        tier: compositeScore !== null ? getTier(compositeScore) : null
      },
      elements: elementsByDim
    };
  }

  function calculateBenchmarks(assessments: any[]) {
    const complete = assessments.filter(a => {
      let completedDims = 0;
      for (let dim = 1; dim <= 13; dim++) {
        const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
        if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) {
          completedDims++;
        }
      }
      return completedDims === 13;
    });
    
    if (complete.length === 0) return null;
    
    const allScores = complete.map(a => {
      try {
        return calculateCompanyScores(a).scores;
      } catch {
        return null;
      }
    }).filter(s => s !== null);
    
    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter(v => v !== null && v !== undefined && !isNaN(v as number)) as number[];
      return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
    };
    
    const dimensionBenchmarks: Record<number, number | null> = {};
    for (let dim = 1; dim <= 13; dim++) {
      dimensionBenchmarks[dim] = avg(allScores.map(s => s?.dimensionScores?.[dim]));
    }
    
    return {
      compositeScore: avg(allScores.map(s => s?.compositeScore)),
      weightedDimScore: avg(allScores.map(s => s?.weightedDimScore)),
      maturityScore: avg(allScores.map(s => s?.maturityScore)),
      breadthScore: avg(allScores.map(s => s?.breadthScore)),
      dimensionScores: dimensionBenchmarks,
      companyCount: complete.length
    };
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
          <p className="mt-4 text-slate-600">Generating report...</p>
        </div>
      </div>
    );
  }

  if (error || !company || !companyScores) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center max-w-md">
          <p className="text-red-600 text-lg mb-2">{error || 'Unable to generate report'}</p>
          <p className="text-slate-500 text-sm mb-4">Survey ID: {surveyId || 'not provided'}</p>
          <button onClick={() => router.push('/admin/scoring')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700">
            Return to Scoring
          </button>
        </div>
      </div>
    );
  }

  const companyName = company.company_name || 'Company';
  const firmographics = company.firmographics_data || {};
  
  const firstName = firmographics.firstName || '';
  const lastName = firmographics.lastName || '';
  const contactName = firstName && lastName 
    ? `${firstName} ${lastName}` 
    : (firstName || lastName || firmographics.contact_name || '');
  const contactEmail = firmographics.email || firmographics.contact_email || '';
  
  const { compositeScore, weightedDimScore, maturityScore, breadthScore, dimensionScores, tier } = companyScores;
  
  // Calculate element statistics
  const allElements = Object.values(elementDetails || {}).flat() as any[];
  const totalElements = allElements.length;
  const currentlyOffering = allElements.filter(e => e.isStrength).length;
  const planningItems = allElements.filter(e => e.isPlanning).length;
  const assessingItems = allElements.filter(e => e.isAssessing).length;
  const gapItems = allElements.filter(e => e.isGap).length;
  const unsureItems = allElements.filter(e => e.isUnsure).length;
  
  // Calculate tier distance
  const tierThresholds = [
    { name: 'Exemplary', min: 90 },
    { name: 'Leading', min: 75 },
    { name: 'Progressing', min: 60 },
    { name: 'Emerging', min: 40 },
    { name: 'Developing', min: 0 }
  ];
  
  const nextTierUp = tierThresholds.find(t => t.min > (compositeScore || 0));
  const pointsToNextTier = nextTierUp ? nextTierUp.min - (compositeScore || 0) : null;
  
  // Build dimension analysis
  const dimensionAnalysis = Object.entries(dimensionScores)
    .map(([dim, score]) => {
      const dimNum = parseInt(dim);
      const elements = elementDetails?.[dimNum] || [];
      const benchmark = benchmarks?.dimensionScores?.[dimNum] ?? 0;
      
      return {
        dim: dimNum,
        name: DIMENSION_NAMES[dimNum] || `Dimension ${dimNum}`,
        score: score ?? 0,
        benchmark,
        weight: DEFAULT_DIMENSION_WEIGHTS[dimNum] || 0,
        tier: getTier(score ?? 0),
        elements,
        strengths: elements.filter((e: any) => e.isStrength),
        planning: elements.filter((e: any) => e.isPlanning),
        assessing: elements.filter((e: any) => e.isAssessing),
        gaps: elements.filter((e: any) => e.isGap),
        unsure: elements.filter((e: any) => e.isUnsure),
        recommendations: DIMENSION_RECOMMENDATIONS[dimNum]
      };
    })
    .sort((a, b) => b.score - a.score);
  
  // Count tiers
  const tierCounts = {
    exemplary: dimensionAnalysis.filter(d => d.tier.name === 'Exemplary').length,
    leading: dimensionAnalysis.filter(d => d.tier.name === 'Leading').length,
    progressing: dimensionAnalysis.filter(d => d.tier.name === 'Progressing').length,
    emerging: dimensionAnalysis.filter(d => d.tier.name === 'Emerging').length,
    developing: dimensionAnalysis.filter(d => d.tier.name === 'Developing').length,
  };
  
  // Get top and bottom performers
  const topDimension = dimensionAnalysis[0];
  const bottomDimension = dimensionAnalysis[dimensionAnalysis.length - 1];
  
  // Strength and opportunity dimensions
  const strengthDimensions = dimensionAnalysis.filter(d => d.tier.name === 'Exemplary' || d.tier.name === 'Leading');
  const opportunityDimensions = dimensionAnalysis
    .filter(d => d.tier.name !== 'Exemplary' && d.tier.name !== 'Leading')
    .sort((a, b) => a.score - b.score);

  // Quick wins: items in Assessing or Planning status
  const quickWinOpportunities = dimensionAnalysis
    .flatMap(d => [
      ...d.assessing.map((item: any) => ({ 
        ...item, 
        dimNum: d.dim, 
        dimName: d.name,
        type: 'Assessing',
        potentialPoints: 3 // Moving from 2 to 5
      })),
      ...d.planning.map((item: any) => ({ 
        ...item, 
        dimNum: d.dim, 
        dimName: d.name,
        type: 'Planning',
        potentialPoints: 2 // Moving from 3 to 5
      }))
    ])
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-100">
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.75in;
            size: letter;
          }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Action Bar */}
      <div className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/admin/scoring')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Scoring
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <div ref={printRef} className="max-w-6xl mx-auto py-10 px-8">
        
        {/* ============ HEADER ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-10 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="bg-white rounded-lg p-4">
                  <Image 
                    src="/best-companies-2026-logo.png" 
                    alt="Best Companies 2026" 
                    width={120} 
                    height={120}
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium tracking-wider uppercase">Performance Assessment</p>
                  <h1 className="text-2xl font-semibold text-white mt-1">Best Companies for Working with Cancer</h1>
                  <p className="text-slate-300 mt-1">Index 2026</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Report Date</p>
                <p className="text-white font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className="px-10 py-8 border-b border-slate-100">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Prepared for</p>
                <h2 className="text-3xl font-bold text-slate-900 mt-1">{companyName}</h2>
                {(contactName || contactEmail) && (
                  <div className="mt-2 text-sm text-slate-500">
                    {contactName && <span className="font-medium text-slate-600">{contactName}</span>}
                    {contactName && contactEmail && <span className="mx-2">|</span>}
                    {contactEmail && <span>{contactEmail}</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-slate-500 text-sm">Composite Score</p>
                  <p className="text-5xl font-bold mt-1" style={{ color: tier?.color || '#666' }}>
                    {compositeScore ?? '—'}
                  </p>
                </div>
                {tier && (
                  <div className={`px-5 py-3 rounded-lg ${tier.bgColor} border ${tier.borderColor}`}>
                    <p className="text-lg font-bold" style={{ color: tier.color }}>{tier.name}</p>
                    <p className="text-xs text-slate-500">Performance Tier</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ENHANCED Executive Summary */}
          <div className="px-10 py-8 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Executive Summary</h3>
            <p className="text-slate-700 leading-relaxed text-lg">
              {companyName} demonstrates <strong className="font-semibold" style={{ color: tier?.color }}>{tier?.name?.toLowerCase()}</strong> performance 
              in supporting employees managing cancer, with a composite score of <strong>{compositeScore}</strong>
              {percentileRank !== null && (
                <span>, placing in the <strong className="text-purple-700">{percentileRank}th percentile</strong> among {totalCompanies} assessed organizations</span>
              )}.
              {topDimension && bottomDimension && (
                <span> Your strongest dimension is <strong className="text-emerald-700">{topDimension.name}</strong> ({topDimension.score}), 
                while <strong className="text-amber-700">{bottomDimension.name}</strong> ({bottomDimension.score}) represents your greatest opportunity for growth.</span>
              )}
            </p>
            
            {/* Tier Distance Alert */}
            {pointsToNextTier && nextTierUp && pointsToNextTier <= 10 && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-3">
                <TrendUpIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-800">
                    {pointsToNextTier} points from {nextTierUp.name} tier
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Targeted improvements in {opportunityDimensions[0]?.name} and {opportunityDimensions[1]?.name} could elevate your overall standing.
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-6 grid grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-emerald-600">{currentlyOffering}</p>
                <p className="text-sm text-slate-500 mt-1">of {totalElements} elements currently offered</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-blue-600">{planningItems + assessingItems}</p>
                <p className="text-sm text-slate-500 mt-1">initiatives in planning or under assessment</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-amber-600">{gapItems}</p>
                <p className="text-sm text-slate-500 mt-1">identified gaps for consideration</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-purple-600">{tierCounts.exemplary + tierCounts.leading}</p>
                <p className="text-sm text-slate-500 mt-1">dimensions at Leading or above</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ KEY FINDINGS AT A GLANCE ============ */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="px-10 py-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Key Findings at a Glance</h3>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider mb-2">Strongest Area</p>
                <p className="text-white font-semibold">{topDimension?.name || 'N/A'}</p>
                <p className="text-emerald-300 text-sm mt-1">
                  Score: {topDimension?.score} 
                  {topDimension?.benchmark && topDimension.score > topDimension.benchmark && 
                    ` (+${topDimension.score - topDimension.benchmark} vs benchmark)`}
                </p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-amber-300 font-medium uppercase tracking-wider mb-2">Priority Focus</p>
                <p className="text-white font-semibold">{bottomDimension?.name || 'N/A'}</p>
                <p className="text-amber-300 text-sm mt-1">
                  Score: {bottomDimension?.score}
                  {bottomDimension?.benchmark && 
                    ` (${bottomDimension.score - bottomDimension.benchmark} vs benchmark)`}
                </p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-blue-300 font-medium uppercase tracking-wider mb-2">In Development</p>
                <p className="text-white font-semibold">{planningItems + assessingItems} initiatives</p>
                <p className="text-blue-300 text-sm mt-1">
                  {planningItems} planning, {assessingItems} assessing
                </p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-purple-300 font-medium uppercase tracking-wider mb-2">Tier Distribution</p>
                <p className="text-white font-semibold">{tierCounts.exemplary + tierCounts.leading} / 13 Leading+</p>
                <p className="text-purple-300 text-sm mt-1">
                  {tierCounts.exemplary} Exemplary, {tierCounts.leading} Leading
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ SCORE COMPOSITION ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Score Composition</h3>
            <p className="text-sm text-slate-500 mt-1">How your composite score is calculated</p>
          </div>
          <div className="px-10 py-6">
            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'Composite Score', score: compositeScore, weight: null, benchmark: benchmarks?.compositeScore, isTotal: true },
                { label: 'Weighted Dimension Score', score: weightedDimScore, weight: `${SCORING_CONFIG.compositeWeights.weightedDim}%`, benchmark: benchmarks?.weightedDimScore },
                { label: 'Program Maturity', score: maturityScore, weight: `${SCORING_CONFIG.compositeWeights.maturity}%`, benchmark: benchmarks?.maturityScore },
                { label: 'Support Breadth', score: breadthScore, weight: `${SCORING_CONFIG.compositeWeights.breadth}%`, benchmark: benchmarks?.breadthScore },
              ].map((item, idx) => (
                <div key={idx} className={`text-center ${item.isTotal ? 'bg-slate-50 rounded-lg p-4 border-2 border-slate-200' : ''}`}>
                  <p className="text-4xl font-bold" style={{ color: getScoreColor(item.score ?? 0) }}>
                    {item.score ?? '—'}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">{item.label}</p>
                  {item.weight && <p className="text-xs text-slate-400">Weight: {item.weight}</p>}
                  {item.benchmark !== null && item.benchmark !== undefined && (
                    <p className="text-xs text-slate-400 mt-1">
                      Benchmark: {item.benchmark}
                      <span className={`ml-1 ${(item.score ?? 0) >= item.benchmark ? 'text-emerald-600' : 'text-amber-600'}`}>
                        ({(item.score ?? 0) >= item.benchmark ? '+' : ''}{(item.score ?? 0) - item.benchmark})
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============ DIMENSION PERFORMANCE ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-lg">Dimension Performance Overview</h3>
            <p className="text-sm text-slate-500 mt-1">Detailed scores across all 13 assessment dimensions</p>
          </div>
          <div className="px-10 py-6">
            {/* Header row */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="w-10 text-center">#</div>
              <div className="flex-1">Dimension</div>
              <div className="w-12 text-center">Wt%</div>
              <div className="w-72 text-center">Score</div>
              <div className="w-16 text-right">Score</div>
              <div className="w-24 text-center">vs Bench</div>
              <div className="w-24 text-center">Tier</div>
            </div>
            
            {/* Dimension rows - sorted by weight */}
            {[...dimensionAnalysis]
              .sort((a, b) => b.weight - a.weight)
              .map((d, idx) => {
                const diff = d.benchmark ? d.score - d.benchmark : 0;
                return (
                  <div key={d.dim} className={`flex items-center gap-4 py-4 ${idx < dimensionAnalysis.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="w-10 text-center">
                      <span 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: getScoreColor(d.score) }}
                      >
                        {d.dim}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-700">{d.name}</span>
                    </div>
                    <div className="w-12 text-center text-sm text-slate-500 font-medium">{d.weight}%</div>
                    <div className="w-72">
                      <div className="relative h-5 bg-slate-100 rounded-full">
                        <div 
                          className="absolute left-0 top-0 h-full rounded-full transition-all"
                          style={{ 
                            width: `${d.score}%`, 
                            backgroundColor: getScoreColor(d.score) 
                          }}
                        />
                        {/* Benchmark triangle indicator - positioned OUTSIDE overflow container */}
                        {d.benchmark && (
                          <div 
                            className="absolute flex flex-col items-center z-10"
                            style={{ left: `${Math.min(d.benchmark, 100)}%`, top: '-10px', transform: 'translateX(-50%)' }}
                          >
                            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent border-t-slate-600 drop-shadow-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-base font-bold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                    </div>
                    <div className="w-24 text-center">
                      <span className="text-sm text-slate-500">{d.benchmark ?? '—'}</span>
                      {d.benchmark && (
                        <span className={`text-sm ml-1 font-medium ${diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          ({diff >= 0 ? '+' : ''}{diff})
                        </span>
                      )}
                    </div>
                    <div className="w-24 text-center">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${d.tier.bgColor} ${d.tier.textColor}`}>
                        {d.tier.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            
            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-6 text-sm text-slate-500">
              <span>Scores out of 100</span>
              <span className="flex items-center gap-2">
                <span className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent border-t-slate-600 inline-block"></span>
                Benchmark
              </span>
            </div>
          </div>
        </div>

        {/* ============ STRATEGIC PRIORITY MATRIX ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Strategic Priority Matrix</h3>
            <p className="text-sm text-slate-500 mt-1">Dimensions plotted by current performance versus strategic weight</p>
          </div>
          <StrategicPriorityMatrix 
            dimensionAnalysis={dimensionAnalysis} 
            getScoreColor={getScoreColor} 
          />
        </div>

        {/* ============ QUICK WINS SECTION ============ */}
        {quickWinOpportunities.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-10 py-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <LightbulbIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-900 text-lg">Quick Win Opportunities</h3>
                  <p className="text-sm text-emerald-700 mt-1">Initiatives already in progress that could accelerate score improvement</p>
                </div>
              </div>
            </div>
            <div className="px-10 py-8">
              <p className="text-slate-600 mb-8 text-base leading-relaxed">
                The following items are currently in planning or assessment phases. Converting these to active programs 
                represents the fastest path to improving your composite score, as the organizational groundwork is already underway.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {quickWinOpportunities.slice(0, 8).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${
                      item.type === 'Planning' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-teal-100 text-teal-700 border border-teal-200'
                    }`}>
                      {item.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium leading-snug">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <span className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px]">D{item.dimNum}</span>
                        <span className="text-slate-400">{item.dimName}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ STRENGTHS & OPPORTUNITIES ============ */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
              <CheckIcon className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-semibold text-emerald-800">Areas of Excellence</h3>
                <p className="text-sm text-emerald-600 mt-0.5">{strengthDimensions.length} dimensions performing at Leading or above</p>
              </div>
            </div>
            <div className="p-6">
              {strengthDimensions.length > 0 ? (
                <div className="space-y-5">
                  {strengthDimensions.slice(0, 4).map((d) => (
                    <div key={d.dim}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-800 text-sm">{d.name}</p>
                        <span className="text-xs font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                      </div>
                      {d.strengths.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {d.strengths.slice(0, 3).map((e: any, i: number) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                              <CheckIcon className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{e.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No dimensions at Leading or Exemplary level yet. Focus on building foundational capabilities first.</p>
              )}
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
              <TrendUpIcon className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">Growth Opportunities</h3>
                <p className="text-sm text-amber-600 mt-0.5">{opportunityDimensions.length} dimensions with improvement potential</p>
              </div>
            </div>
            <div className="p-6">
              {opportunityDimensions.length > 0 ? (
                <div className="space-y-5">
                  {opportunityDimensions.slice(0, 5).map((d) => (
                    <div key={d.dim}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-800 text-sm">{d.name}</p>
                        <span className="text-xs font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                      </div>
                      {(d.gaps.length > 0 || d.unsure.length > 0) && (
                        <ul className="mt-2 space-y-1">
                          {[...d.gaps, ...d.unsure].slice(0, 3).map((e: any, i: number) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>
                              <span className="line-clamp-1">{e.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-600 text-sm">All dimensions at Leading or above. Focus on maintaining excellence and exploring innovation opportunities.</p>
              )}
            </div>
          </div>
        </div>

        {/* ============ STRATEGIC RECOMMENDATIONS ============ */}
        {opportunityDimensions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 print-break">
            <div className="px-10 py-5 border-b border-slate-100 bg-slate-800">
              <h3 className="font-semibold text-white">Strategic Recommendations</h3>
              <p className="text-sm text-slate-300 mt-1">Priority actions to enhance the employee experience</p>
            </div>
            <div className="px-10 py-6">
              <p className="text-slate-600 mb-6">
                The following recommendations focus on high impact opportunities to strengthen support for employees 
                managing cancer diagnoses. Prioritization reflects both the potential to improve overall assessment 
                performance and the direct impact on employee wellbeing.
              </p>
              
              <div className="space-y-6">
                {opportunityDimensions.slice(0, 4).map((d, idx) => (
                  <div key={d.dim} className="border-l-4 pl-6 py-2" style={{ borderColor: getScoreColor(d.score) }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{idx + 1}. {d.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{d.recommendations?.focus}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className="text-lg font-bold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                        <p className="text-xs text-slate-400">Weight: {d.weight}%</p>
                      </div>
                    </div>
                    
                    {d.gaps.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Key Gaps to Address</p>
                        <ul className="space-y-1">
                          {d.gaps.slice(0, 3).map((g: any, i: number) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0"></span>
                              <span>{g.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {d.recommendations?.actions && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Suggested Actions</p>
                        <ul className="space-y-1">
                          {d.recommendations.actions.slice(0, 2).map((action: string, i: number) => (
                            <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                              <ArrowRightIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ ACTION ROADMAP ============ */}
        {opportunityDimensions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-10 py-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Suggested Action Roadmap</h3>
              <p className="text-sm text-slate-500 mt-1">Phased approach based on your assessment results</p>
            </div>
            <div className="px-10 py-6">
              {(() => {
                const assessingItemsList = dimensionAnalysis
                  .flatMap(d => d.assessing.map((item: any) => ({
                    text: item.name,
                    dimNum: d.dim,
                    dimName: d.name.split('&')[0].trim()
                  })))
                  .slice(0, 3);
                
                const lowWeightGaps = opportunityDimensions
                  .filter(d => d.weight <= 7)
                  .flatMap(d => d.gaps.slice(0, 1).map((g: any) => ({
                    text: g.name,
                    dimNum: d.dim,
                    dimName: d.name.split('&')[0].trim()
                  })))
                  .slice(0, 3 - assessingItemsList.length);
                
                const quickWins = [...assessingItemsList, ...lowWeightGaps].slice(0, 3);
                
                const highWeightGaps = opportunityDimensions
                  .filter(d => d.weight >= 10)
                  .flatMap(d => d.gaps.slice(0, 2).map((g: any) => ({
                    text: g.name,
                    dimNum: d.dim,
                    dimName: d.name.split('&')[0].trim(),
                    weight: d.weight
                  })))
                  .sort((a, b) => b.weight - a.weight)
                  .slice(0, 3);
                
                const planningItemsList = dimensionAnalysis
                  .flatMap(d => d.planning.map((item: any) => ({
                    text: item.name,
                    dimNum: d.dim,
                    dimName: d.name.split('&')[0].trim()
                  })))
                  .slice(0, 2);
                
                const strengthImprovements = strengthDimensions
                  .flatMap(d => {
                    const nonStrengthItems = d.elements
                      .filter((e: any) => !e.isStrength && !e.isUnsure && e.category !== 'currently_offer')
                      .slice(0, 1);
                    return nonStrengthItems.map((e: any) => ({
                      text: e.name,
                      dimNum: d.dim,
                      dimName: d.name.split('&')[0].trim()
                    }));
                  })
                  .slice(0, 3 - planningItemsList.length);
                
                const excellence = [...planningItemsList, ...strengthImprovements].slice(0, 3);
                
                return (
                  <div className="grid grid-cols-3 gap-6">
                    {/* Phase 1 */}
                    <div className="relative">
                      <div className="absolute -left-3 top-0 bottom-0 w-1 bg-emerald-400 rounded-full"></div>
                      <div className="bg-emerald-50 rounded-lg p-5 border border-emerald-100 h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">1</span>
                          <h4 className="font-semibold text-emerald-800 text-sm">Quick Wins</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Low effort, high visibility</p>
                        {quickWins.length > 0 ? (
                          <ul className="space-y-2 text-xs text-slate-600">
                            {quickWins.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                                <span className="line-clamp-2">{item.text}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400">No immediate quick wins identified</p>
                        )}
                        {quickWins.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-emerald-100">
                            Focus: {[...new Set(quickWins.map(q => `D${q.dimNum}`))].join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Phase 2 */}
                    <div className="relative">
                      <div className="absolute -left-3 top-0 bottom-0 w-1 bg-sky-400 rounded-full"></div>
                      <div className="bg-sky-50 rounded-lg p-5 border border-sky-100 h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">2</span>
                          <h4 className="font-semibold text-sky-800 text-sm">Foundation Building</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">High impact structural changes</p>
                        {highWeightGaps.length > 0 ? (
                          <ul className="space-y-2 text-xs text-slate-600">
                            {highWeightGaps.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></span>
                                <span className="line-clamp-2">{item.text}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400">Strong foundation already in place</p>
                        )}
                        {highWeightGaps.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-sky-100">
                            Focus: {[...new Set(highWeightGaps.map(g => `D${g.dimNum}`))].join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Phase 3 */}
                    <div className="relative">
                      <div className="absolute -left-3 top-0 bottom-0 w-1 bg-purple-400 rounded-full"></div>
                      <div className="bg-purple-50 rounded-lg p-5 border border-purple-100 h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">3</span>
                          <h4 className="font-semibold text-purple-800 text-sm">Excellence and Culture</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">Long term transformation</p>
                        {excellence.length > 0 ? (
                          <ul className="space-y-2 text-xs text-slate-600">
                            {excellence.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></span>
                                <span className="line-clamp-2">{item.text}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400">Continue current excellence initiatives</p>
                        )}
                        {excellence.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-purple-100">
                            Focus: {[...new Set(excellence.map(e => `D${e.dimNum}`))].join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Progress connector */}
              <div className="flex items-center justify-center mt-6 gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <div className="h-px w-16 bg-slate-200"></div>
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <div className="h-px w-16 bg-slate-200"></div>
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              </div>
            </div>
          </div>
        )}

        {/* ============ HOW CAC CAN HELP ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 print-break">
          <div className="px-10 py-6 bg-gradient-to-r from-purple-700 to-purple-600">
            <h3 className="font-semibold text-white text-lg">How Cancer and Careers Can Help</h3>
            <p className="text-purple-200 text-sm mt-1">Tailored support to enhance the employee experience</p>
          </div>
          <div className="px-10 py-6">
            <p className="text-slate-600 mb-6 leading-relaxed">
              Every organization enters this work from a different place. Cancer and Careers consulting practice 
              helps organizations understand where they are, identify where they want to be, and build a realistic 
              path to get there, shaped by two decades of frontline experience with employees navigating cancer 
              and the HR teams supporting them.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 text-sm mb-2">Manager Preparedness and Training</h4>
                <p className="text-xs text-slate-600 mb-2">76% of employees go to their manager first at disclosure, yet only 48% believe their manager has received training.</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5"></span>
                    Live training sessions with case studies
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5"></span>
                    Manager toolkit and conversation guides
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5"></span>
                    Train the trainer programs
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 text-sm mb-2">Navigation and Resource Architecture</h4>
                <p className="text-xs text-slate-600 mb-2">Only 34% of employees know where to find resources. Programs exist but can be difficult to access when needed most.</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5"></span>
                    Resource audit and gap analysis
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5"></span>
                    Single entry point design
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5"></span>
                    Communication strategy
                  </li>
                </ul>
              </div>
              
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <h4 className="font-semibold text-rose-800 text-sm mb-2">Return to Work Excellence</h4>
                <p className="text-xs text-slate-600 mb-2">Support ratings drop from 54% during treatment to 22% after, the largest variance in the employee experience.</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5"></span>
                    Phased return protocols
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5"></span>
                    Check in cadence design
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5"></span>
                    Career continuity planning
                  </li>
                </ul>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-800 text-sm mb-2">Policy and Program Assessment</h4>
                <p className="text-xs text-slate-600 mb-2">Many organizations have policies that look comprehensive on paper but fall short in practice.</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5"></span>
                    Comprehensive policy review
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5"></span>
                    Implementation audit
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5"></span>
                    Business case development
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Ready to take the next step?</p>
                  <p className="text-xs text-slate-500 mt-1">Contact Cancer and Careers to discuss how we can support your organization.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-700">cancerandcareers.org</p>
                  <p className="text-xs text-slate-500">cacbestcompanies@cew.org</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ METHODOLOGY ============ */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700 text-sm">Assessment Methodology</h3>
          </div>
          <div className="px-10 py-5">
            <div className="grid grid-cols-3 gap-6 text-xs text-slate-600">
              <div>
                <p className="font-medium text-slate-700 mb-2">Scoring Framework</p>
                <p className="leading-relaxed">
                  Organizations are assessed across 13 dimensions of workplace cancer support. Each dimension 
                  receives a weighted score based on current offerings, planned initiatives, and program maturity. 
                  The composite score combines dimension performance ({SCORING_CONFIG.compositeWeights.weightedDim}%), program maturity ({SCORING_CONFIG.compositeWeights.maturity}%), and support breadth ({SCORING_CONFIG.compositeWeights.breadth}%).
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-2">Benchmarking</p>
                <p className="leading-relaxed">
                  Benchmark scores represent the average performance across all {totalCompanies > 0 ? totalCompanies : 'assessed'} organizations 
                  in the Index. Percentile rankings indicate relative positioning within the cohort. 
                  Benchmarks are updated as new organizations complete assessments.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-2">Performance Tiers</p>
                <p className="leading-relaxed">
                  <span className="text-emerald-600 font-medium">Exemplary</span> (90+): Best in class performance<br/>
                  <span className="text-blue-600 font-medium">Leading</span> (75 to 89): Above average<br/>
                  <span className="text-amber-600 font-medium">Progressing</span> (60 to 74): Meeting expectations<br/>
                  <span className="text-orange-600 font-medium">Emerging</span> (40 to 59): Developing capabilities<br/>
                  <span className="text-slate-500 font-medium">Developing</span> (below 40): Early stage
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ FOOTER ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-10 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Image 
                  src="/cancer-careers-logo.png" 
                  alt="Cancer and Careers" 
                  width={140} 
                  height={45}
                  className="object-contain"
                />
                <div className="border-l border-slate-200 pl-6">
                  <p className="text-sm font-medium text-slate-700">Best Companies for Working with Cancer Index</p>
                  <p className="text-xs text-slate-400">2026 Cancer and Careers. All rights reserved.</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Survey ID: {surveyId}</p>
                <p className="text-xs text-slate-400">Confidential</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

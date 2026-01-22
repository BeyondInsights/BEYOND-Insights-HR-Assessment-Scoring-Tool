'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_DIMENSION_WEIGHTS: Record<number, number> = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3,
};

const DEFAULT_COMPOSITE_WEIGHTS = { weightedDim: 90, maturity: 5, breadth: 5 };

const DEFAULT_BLEND_WEIGHTS = {
  d1: { grid: 85, followUp: 15 },
  d3: { grid: 85, followUp: 15 },
  d12: { grid: 85, followUp: 15 },
  d13: { grid: 85, followUp: 15 },
};

const DIMENSION_NAMES: Record<number, string> = {
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
  11: 'Prevention & Wellness',
  12: 'Continuous Improvement',
  13: 'Communication & Awareness',
};

const DIMENSION_SHORT_NAMES: Record<number, string> = {
  1: 'Leave & Flexibility', 2: 'Insurance & Financial', 3: 'Manager Preparedness',
  4: 'Navigation', 5: 'Accommodations', 6: 'Culture', 7: 'Career Continuity',
  8: 'Work Continuation', 9: 'Executive Commitment', 10: 'Caregiver Support',
  11: 'Prevention & Wellness', 12: 'Continuous Improvement', 13: 'Communication',
};

const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };

const D10_EXCLUDED_ITEMS = ['Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'];

// ============================================
// STRATEGIC INSIGHTS FOR EACH DIMENSION
// ============================================

const DIMENSION_STRATEGIC_INSIGHTS: Record<number, { insight: string; cacHelp: string }> = {
  1: {
    insight: "Leave policies form the foundation of cancer support. Without adequate time away from work, employees cannot focus on treatment and recovery. Gaps here create impossible choices between health and livelihood.",
    cacHelp: "Cancer and Careers can benchmark your leave policies against industry leaders, identify cost-effective enhancements, and help communicate existing benefits more effectively to increase utilization."
  },
  2: {
    insight: "Financial toxicity is a leading cause of treatment non-adherence. Comprehensive insurance and financial protection directly impacts whether employees can afford to get well and return to full productivity.",
    cacHelp: "Our team can conduct a benefits gap analysis, evaluate supplemental coverage options, and design financial wellness programs specifically for employees facing serious illness."
  },
  3: {
    insight: "Managers are the front line of support - they determine whether policies translate to lived experience. Without proper training, even excellent policies fail at the point of delivery.",
    cacHelp: "Cancer and Careers offers manager training programs with real-world scenarios, conversation guides, and ongoing coaching to build confidence in supporting team members through health challenges."
  },
  4: {
    insight: "Navigation is the multiplier - it determines whether employees can actually access the benefits you've invested in. Without clear pathways, benefits go unused and employees struggle alone.",
    cacHelp: "We specialize in designing single-entry-point navigation systems, resource mapping, and communication strategies that maximize utilization of existing benefits investments."
  },
  5: {
    insight: "Accommodations enable continued productivity during treatment. Flexibility in where, when, and how work gets done can mean the difference between retention and costly turnover.",
    cacHelp: "Cancer and Careers can audit your accommodation practices, benchmark against best practices, and train HR teams on effective, compliant accommodation conversations."
  },
  6: {
    insight: "Culture determines whether employees feel safe disclosing health challenges. Without psychological safety, employees hide struggles until crisis point, missing early intervention opportunities.",
    cacHelp: "Our culture assessment tools identify barriers to disclosure, and our programs help build environments where employees feel supported in bringing their whole selves to work."
  },
  7: {
    insight: "Career continuity fears cause talented employees to hide diagnoses or leave prematurely. Protecting professional trajectory during treatment builds loyalty and preserves institutional knowledge.",
    cacHelp: "Cancer and Careers can help design career protection policies, re-onboarding programs, and communication strategies that reassure employees their futures are secure."
  },
  8: {
    insight: "Return-to-work is where support programs prove their value. A structured, supportive transition back to work protects the investment in treatment and ensures sustainable recovery.",
    cacHelp: "We offer return-to-work protocol design, including phased re-entry templates, check-in cadences, and success metrics that reduce relapse and improve retention."
  },
  9: {
    insight: "Executive commitment signals organizational priority. Without visible leadership engagement, cancer support remains an HR initiative rather than a business imperative.",
    cacHelp: "Cancer and Careers can help craft executive messaging, integrate cancer support into ESG reporting, and build the business case for board-level engagement."
  },
  10: {
    insight: "Caregivers face dual burden - supporting loved ones while maintaining work performance. Without specific support, you lose productive employees who never received a diagnosis themselves.",
    cacHelp: "Our caregiver support program design includes assessment of unique needs, policy recommendations, and peer support structures for employees in caregiving roles."
  },
  11: {
    insight: "Prevention and early detection reduce long-term costs and improve outcomes. Investing in wellness creates healthier employees and catches issues before they become crises.",
    cacHelp: "Cancer and Careers can evaluate your prevention offerings, recommend evidence-based additions, and help communicate screening and wellness benefits effectively."
  },
  12: {
    insight: "Continuous improvement transforms support from static policy to living practice. Organizations that learn from each case build increasingly effective support systems over time.",
    cacHelp: "We can help establish feedback mechanisms, case review processes, and benchmarking practices that drive ongoing enhancement of your support programs."
  },
  13: {
    insight: "Communication determines whether employees know help exists. Even comprehensive programs fail if employees don't know about them or feel uncomfortable seeking them out.",
    cacHelp: "Cancer and Careers specializes in communication strategy, including messaging frameworks, channel optimization, and campaigns that drive awareness and utilization."
  }
};

// ============================================
// SCORING FUNCTIONS
// ============================================

function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean; category: string } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: POINTS.CURRENTLY_OFFER, isUnsure: false, category: 'currently_offer' };
      case 3: return { points: POINTS.PLANNING, isUnsure: false, category: 'planning' };
      case 2: return { points: POINTS.ASSESSING, isUnsure: false, category: 'assessing' };
      case 1: return { points: POINTS.NOT_ABLE, isUnsure: false, category: 'not_able' };
      case 5: return { points: null, isUnsure: true, category: 'unsure' };
      default: return { points: null, isUnsure: false, category: 'unknown' };
    }
  }
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return { points: POINTS.NOT_ABLE, isUnsure: false, category: 'not_able' };
    if (s === 'unsure' || s.includes('unsure') || s.includes('unknown')) return { points: null, isUnsure: true, category: 'unsure' };
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || s.includes('use') || s.includes('track') || s.includes('measure')) {
      return { points: POINTS.CURRENTLY_OFFER, isUnsure: false, category: 'currently_offer' };
    }
    if (s.includes('planning') || s.includes('development')) return { points: POINTS.PLANNING, isUnsure: false, category: 'planning' };
    if (s.includes('assessing') || s.includes('feasibility')) return { points: POINTS.ASSESSING, isUnsure: false, category: 'assessing' };
    if (s.length > 0) return { points: POINTS.NOT_ABLE, isUnsure: false, category: 'not_able' };
  }
  return { points: null, isUnsure: false, category: 'unknown' };
}

function getGeoMultiplier(geoResponse: string | number | undefined | null): number {
  if (geoResponse === undefined || geoResponse === null) return 1.0;
  if (typeof geoResponse === 'number') {
    switch (geoResponse) { case 1: return 0.75; case 2: return 0.90; case 3: return 1.0; default: return 1.0; }
  }
  const s = String(geoResponse).toLowerCase();
  if (s.includes('consistent') || s.includes('generally consistent')) return 1.0;
  if (s.includes('vary') || s.includes('varies')) return 0.90;
  if (s.includes('select') || s.includes('only available in select')) return 0.75;
  return 1.0;
}

function getStatusText(status: string | number): string {
  if (typeof status === 'number') {
    switch (status) { case 4: return 'Currently offer'; case 3: return 'Planning'; case 2: return 'Assessing'; case 1: return 'Gap'; case 5: return 'To clarify'; default: return 'Unknown'; }
  }
  return String(status);
}

function scoreD1PaidLeave(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('does not apply')) return 0;
  if (v.includes('13 or more') || v.includes('13 weeks or more') || v.includes('13+ weeks')) return 100;
  if ((v.includes('9 to') && v.includes('13')) || v.includes('9-13')) return 70;
  if ((v.includes('5 to') && v.includes('9')) || v.includes('5-9')) return 40;
  if ((v.includes('3 to') && v.includes('5')) || v.includes('3-5')) return 20;
  if ((v.includes('1 to') && v.includes('3')) || v.includes('1-3')) return 10;
  return 0;
}

function scoreD1PartTime(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('no additional')) return 0;
  if (v.includes('medically necessary') || v.includes('healthcare provider')) return 100;
  if (v.includes('26 weeks or more') || v.includes('26+ weeks') || v.includes('26 or more')) return 80;
  if ((v.includes('12 to') || v.includes('13 to')) && v.includes('26')) return 50;
  if ((v.includes('5 to') && v.includes('12')) || (v.includes('5 to') && v.includes('13'))) return 30;
  if (v.includes('case-by-case')) return 40;
  if (v.includes('4 weeks') || v.includes('up to 4')) return 10;
  return 0;
}

function scoreD3Training(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('less than 10%') || v === 'less than 10' || v.includes('less than 10 percent')) return 0;
  if (v === '100%' || v === '100' || v.includes('100% of') || (v.includes('100') && !v.includes('less than'))) return 100;
  if (v.includes('75') && v.includes('100')) return 80;
  if (v.includes('50') && v.includes('75')) return 50;
  if (v.includes('25') && v.includes('50')) return 30;
  if (v.includes('10') && v.includes('25')) return 10;
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

function scoreD12PolicyChanges(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('significant') || v.includes('major')) return 100;
  if (v.includes('some') || v.includes('minor') || v.includes('adjustments')) return 60;
  if (v.includes('no change') || v.includes('not yet') || v.includes('none')) return 20;
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
  if (v.includes('do not actively') || v.includes('no regular')) return 0;
  return 0;
}

function calculateFollowUpScore(dimNum: number, assessment: Record<string, any>): number | null {
  const dimData = assessment[`dimension${dimNum}_data`];
  switch (dimNum) {
    case 1: {
      const d1_1_usa = dimData?.d1_1_usa; const d1_1_non_usa = dimData?.d1_1_non_usa; const d1_4b = dimData?.d1_4b;
      const scores: number[] = [];
      if (d1_1_usa) scores.push(scoreD1PaidLeave(d1_1_usa));
      if (d1_1_non_usa) scores.push(scoreD1PaidLeave(d1_1_non_usa));
      if (d1_4b) scores.push(scoreD1PartTime(d1_4b));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 3: { const d31 = dimData?.d31 ?? dimData?.d3_1; return d31 ? scoreD3Training(d31) : null; }
    case 12: {
      const d12_1 = dimData?.d12_1; const d12_2 = dimData?.d12_2;
      const scores: number[] = [];
      if (d12_1) scores.push(scoreD12CaseReview(d12_1));
      if (d12_2) scores.push(scoreD12PolicyChanges(d12_2));
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    }
    case 13: { const d13_1 = dimData?.d13_1; return d13_1 ? scoreD13Communication(d13_1) : null; }
    default: return null;
  }
}

function calculateMaturityScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const or1 = currentSupport.or1;
  if (or1 === 6 || or1 === '6') return 100; if (or1 === 5 || or1 === '5') return 80;
  if (or1 === 4 || or1 === '4') return 50; if (or1 === 3 || or1 === '3') return 20;
  if (or1 === 2 || or1 === '2') return 0; if (or1 === 1 || or1 === '1') return 0;
  const v = String(or1 || '').toLowerCase();
  if (v.includes('leading-edge') || v.includes('leading edge')) return 100;
  if (v.includes('comprehensive')) return 100; if (v.includes('enhanced') || v.includes('strong')) return 80;
  if (v.includes('moderate')) return 50; if (v.includes('basic')) return 20; if (v.includes('developing')) return 20;
  if (v.includes('legal minimum')) return 0; if (v.includes('no formal')) return 0;
  return 0;
}

function calculateBreadthScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const generalBenefits = assessment.general_benefits_data || {};
  const scores: number[] = [];
  const cb3a = currentSupport.cb3a ?? generalBenefits.cb3a;
  if (cb3a === 3 || cb3a === '3') { scores.push(100); }
  else if (cb3a === 2 || cb3a === '2') { scores.push(50); }
  else if (cb3a === 1 || cb3a === '1') { scores.push(0); }
  else if (cb3a !== undefined && cb3a !== null) {
    const v = String(cb3a).toLowerCase();
    if (v.includes('yes') && v.includes('additional support')) { scores.push(100); }
    else if (v.includes('developing') || v.includes('currently developing')) { scores.push(50); }
    else { scores.push(0); }
  } else { scores.push(0); }
  const cb3b = currentSupport.cb3b || generalBenefits.cb3b;
  if (cb3b && Array.isArray(cb3b)) { scores.push(Math.min(100, Math.round((cb3b.length / 6) * 100))); } else { scores.push(0); }
  const cb3c = currentSupport.cb3c || generalBenefits.cb3c;
  if (cb3c && Array.isArray(cb3c)) { scores.push(Math.min(100, Math.round((cb3c.length / 13) * 100))); } else { scores.push(0); }
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

// ============================================
// UI HELPERS
// ============================================

function getTier(score: number): { name: string; color: string; bgColor: string; textColor: string; borderColor: string } {
  if (score >= 90) return { name: 'Exemplary', color: '#7C3AED', bgColor: 'bg-purple-50', textColor: 'text-purple-800', borderColor: 'border-purple-200' };
  if (score >= 75) return { name: 'Leading', color: '#059669', bgColor: 'bg-emerald-50', textColor: 'text-emerald-800', borderColor: 'border-emerald-200' };
  if (score >= 60) return { name: 'Progressing', color: '#0284C7', bgColor: 'bg-blue-50', textColor: 'text-blue-800', borderColor: 'border-blue-200' };
  if (score >= 40) return { name: 'Emerging', color: '#D97706', bgColor: 'bg-amber-50', textColor: 'text-amber-800', borderColor: 'border-amber-200' };
  return { name: 'Developing', color: '#DC2626', bgColor: 'bg-red-50', textColor: 'text-red-800', borderColor: 'border-red-200' };
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#7C3AED'; if (score >= 75) return '#059669'; if (score >= 60) return '#0284C7';
  if (score >= 40) return '#D97706'; return '#DC2626';
}

// ============================================
// ICONS
// ============================================

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
);

const ArrowRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
);

const TrendUpIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
);

const AlertIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
);

const LightbulbIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zm4.657 2.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm3 6v-1h4v1a2 2 0 11-4 0zm4-2c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" /></svg>
);

// ============================================
// STRATEGIC PRIORITY MATRIX - PROFESSIONAL
// ============================================
function StrategicPriorityMatrix({ dimensionAnalysis, getScoreColor }: { dimensionAnalysis: any[]; getScoreColor: (score: number) => string }) {
  // Fixed Y-axis: 0 to 20%
  const MAX_WEIGHT = 20;
  
  // Much wider chart
  const PADDING = 40;
  const CHART_WIDTH = 1000;
  const CHART_HEIGHT = 500;
  const PLOT_WIDTH = CHART_WIDTH - (PADDING * 2);
  const PLOT_HEIGHT = CHART_HEIGHT - (PADDING * 2);
  
  return (
    <div className="px-4 py-6">
      <div className="relative w-full" style={{ height: '600px' }}>
        <svg className="w-full h-full" viewBox={`0 0 ${CHART_WIDTH + 60} ${CHART_HEIGHT + 60}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="dropShadowNew" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15"/>
            </filter>
          </defs>
          
          <g transform="translate(45, 15)">
            {/* Quadrant backgrounds - cleaner, more professional colors */}
            <rect x={PADDING} y={PADDING} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEF9E7" /> {/* Develop - soft warm yellow */}
            <rect x={PADDING + PLOT_WIDTH/2} y={PADDING} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#E8F8F5" /> {/* Maintain - soft teal */}
            <rect x={PADDING} y={PADDING + PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#F4F6F7" /> {/* Monitor - light gray */}
            <rect x={PADDING + PLOT_WIDTH/2} y={PADDING + PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#EBF5FB" /> {/* Leverage - soft blue */}
            
            {/* Border */}
            <rect x={PADDING} y={PADDING} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="none" stroke="#D5D8DC" strokeWidth="1" />
            
            {/* Center lines */}
            <line x1={PADDING + PLOT_WIDTH/2} y1={PADDING} x2={PADDING + PLOT_WIDTH/2} y2={PADDING + PLOT_HEIGHT} stroke="#BDC3C7" strokeWidth="1.5" strokeDasharray="6,4" />
            <line x1={PADDING} y1={PADDING + PLOT_HEIGHT/2} x2={PADDING + PLOT_WIDTH} y2={PADDING + PLOT_HEIGHT/2} stroke="#BDC3C7" strokeWidth="1.5" strokeDasharray="6,4" />
            
            {/* Quadrant labels */}
            <g opacity="0.6">
              <text x={PADDING + PLOT_WIDTH/4} y={PADDING + PLOT_HEIGHT/4 - 8} textAnchor="middle" fill="#9A7B4F" fontSize="16" fontWeight="600">DEVELOP</text>
              <text x={PADDING + PLOT_WIDTH/4} y={PADDING + PLOT_HEIGHT/4 + 12} textAnchor="middle" fill="#9A7B4F" fontSize="11">High Priority</text>
              
              <text x={PADDING + PLOT_WIDTH*3/4} y={PADDING + PLOT_HEIGHT/4 - 8} textAnchor="middle" fill="#1E8449" fontSize="16" fontWeight="600">MAINTAIN</text>
              <text x={PADDING + PLOT_WIDTH*3/4} y={PADDING + PLOT_HEIGHT/4 + 12} textAnchor="middle" fill="#1E8449" fontSize="11">Protect Strengths</text>
              
              <text x={PADDING + PLOT_WIDTH/4} y={PADDING + PLOT_HEIGHT*3/4 - 8} textAnchor="middle" fill="#707B7C" fontSize="16" fontWeight="600">MONITOR</text>
              <text x={PADDING + PLOT_WIDTH/4} y={PADDING + PLOT_HEIGHT*3/4 + 12} textAnchor="middle" fill="#707B7C" fontSize="11">Lower Priority</text>
              
              <text x={PADDING + PLOT_WIDTH*3/4} y={PADDING + PLOT_HEIGHT*3/4 - 8} textAnchor="middle" fill="#2471A3" fontSize="16" fontWeight="600">LEVERAGE</text>
              <text x={PADDING + PLOT_WIDTH*3/4} y={PADDING + PLOT_HEIGHT*3/4 + 12} textAnchor="middle" fill="#2471A3" fontSize="11">Quick Wins</text>
            </g>
            
            {/* Data points */}
            {dimensionAnalysis.map((d) => {
              const xPos = PADDING + (d.score / 100) * PLOT_WIDTH;
              const yPos = PADDING + PLOT_HEIGHT - ((d.weight / MAX_WEIGHT) * PLOT_HEIGHT);
              
              return (
                <g key={d.dim} transform={`translate(${xPos}, ${yPos})`}>
                  <circle r="24" fill="white" filter="url(#dropShadowNew)" />
                  <circle r="20" fill={getScoreColor(d.score)} />
                  <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12" fontWeight="700">
                    D{d.dim}
                  </text>
                </g>
              );
            })}
            
            {/* X-axis */}
            <g transform={`translate(0, ${PADDING + PLOT_HEIGHT})`}>
              {[0, 25, 50, 75, 100].map((val) => (
                <g key={val} transform={`translate(${PADDING + (val / 100) * PLOT_WIDTH}, 0)`}>
                  <line y1="0" y2="6" stroke="#7F8C8D" strokeWidth="1" />
                  <text y="22" textAnchor="middle" fill="#5D6D7E" fontSize="12">{val}</text>
                </g>
              ))}
              <text x={PADDING + PLOT_WIDTH/2} y="46" textAnchor="middle" fill="#34495E" fontSize="13" fontWeight="500">
                PERFORMANCE SCORE
              </text>
            </g>
            
            {/* Y-axis - Fixed 0 to 20% */}
            <g transform={`translate(${PADDING}, 0)`}>
              <line x1="0" y1={PADDING} x2="0" y2={PADDING + PLOT_HEIGHT} stroke="#7F8C8D" strokeWidth="1" />
              {[0, 5, 10, 15, 20].map((val) => {
                const yPos = PADDING + PLOT_HEIGHT - ((val / MAX_WEIGHT) * PLOT_HEIGHT);
                return (
                  <g key={val}>
                    <line x1="-6" y1={yPos} x2="0" y2={yPos} stroke="#7F8C8D" strokeWidth="1" />
                    <text x="-10" y={yPos + 4} textAnchor="end" fill="#5D6D7E" fontSize="12">{val}%</text>
                  </g>
                );
              })}
              
              <text transform="rotate(-90)" x={-(PADDING + PLOT_HEIGHT/2)} y="-32" textAnchor="middle" fill="#34495E" fontSize="13" fontWeight="500">
                STRATEGIC WEIGHT
              </text>
            </g>
          </g>
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-2 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-7 gap-x-3 gap-y-2">
          {[...dimensionAnalysis].sort((a, b) => a.dim - b.dim).map(d => (
            <div key={d.dim} className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: getScoreColor(d.score) }}>
                {d.dim}
              </span>
              <span className="text-xs text-slate-600 truncate">{DIMENSION_SHORT_NAMES[d.dim]}</span>
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
    // CRITICAL: Reset ALL state when surveyId changes to prevent data contamination
    setLoading(true);
    setError(null);
    setCompany(null);
    setBenchmarks(null);
    setCompanyScores(null);
    setElementDetails(null);
    setPercentileRank(null);
    setTotalCompanies(0);
    
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
        
        const { data: allAssessments } = await supabase.from('assessments').select('*');
        
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
              if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) completedDims++;
            }
            return completedDims === 13;
          });
          
          const allComposites = completeAssessments.map(a => {
            try { return calculateCompanyScores(a).scores.compositeScore; } catch { return null; }
          }).filter(s => s !== null) as number[];
          
          if (allComposites.length > 0 && scores.compositeScore) {
            const belowCount = allComposites.filter(s => s < scores.compositeScore).length;
            setPercentileRank(Math.round((belowCount / allComposites.length) * 100));
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
    
    if (surveyId) loadData();
    else { setError('No survey ID provided'); setLoading(false); }
  }, [surveyId]);

  function calculateCompanyScores(assessment: Record<string, any>) {
    const dimensionScores: Record<number, number | null> = {};
    const followUpScores: Record<number, number | null> = {};
    const elementsByDim: Record<number, any[]> = {};
    const blendedScores: Record<number, number> = {};
    
    let completedDimCount = 0;
    
    for (let dim = 1; dim <= 13; dim++) {
      const dimData = assessment[`dimension${dim}_data`];
      const mainGrid = dimData?.[`d${dim}a`];
      
      elementsByDim[dim] = [];
      blendedScores[dim] = 0;
      
      if (!mainGrid || typeof mainGrid !== 'object') { dimensionScores[dim] = null; continue; }
      
      let earnedPoints = 0; let totalItems = 0; let answeredItems = 0;
      
      Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
        if (dim === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) return;
        totalItems++;
        const result = statusToPoints(status);
        if (result.isUnsure) { answeredItems++; }
        else if (result.points !== null) { answeredItems++; earnedPoints += result.points; }
        
        elementsByDim[dim].push({
          name: itemKey, status: getStatusText(status), category: result.category,
          points: result.points ?? 0, maxPoints: 5, isStrength: result.points === 5,
          isPlanning: result.category === 'planning', isAssessing: result.category === 'assessing',
          isGap: result.category === 'not_able', isUnsure: result.isUnsure
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
          const key = `d${dim}` as keyof typeof DEFAULT_BLEND_WEIGHTS;
          const gridPct = DEFAULT_BLEND_WEIGHTS[key]?.grid ?? 85;
          const followUpPct = DEFAULT_BLEND_WEIGHTS[key]?.followUp ?? 15;
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
    
    const compositeScore = isComplete && weightedDimScore !== null
      ? Math.round((weightedDimScore * (DEFAULT_COMPOSITE_WEIGHTS.weightedDim / 100)) + (maturityScore * (DEFAULT_COMPOSITE_WEIGHTS.maturity / 100)) + (breadthScore * (DEFAULT_COMPOSITE_WEIGHTS.breadth / 100)))
      : null;
    
    return { scores: { compositeScore, weightedDimScore, maturityScore, breadthScore, dimensionScores, followUpScores, tier: compositeScore !== null ? getTier(compositeScore) : null }, elements: elementsByDim };
  }

  function calculateBenchmarks(assessments: any[]) {
    const complete = assessments.filter(a => {
      let completedDims = 0;
      for (let dim = 1; dim <= 13; dim++) {
        const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
        if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) completedDims++;
      }
      return completedDims === 13;
    });
    if (complete.length === 0) return null;
    const allScores = complete.map(a => { try { return calculateCompanyScores(a).scores; } catch { return null; } }).filter(s => s !== null);
    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter(v => v !== null && v !== undefined && !isNaN(v as number)) as number[];
      return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
    };
    const dimensionBenchmarks: Record<number, number | null> = {};
    for (let dim = 1; dim <= 13; dim++) { dimensionBenchmarks[dim] = avg(allScores.map(s => s?.dimensionScores?.[dim])); }
    return { compositeScore: avg(allScores.map(s => s?.compositeScore)), weightedDimScore: avg(allScores.map(s => s?.weightedDimScore)), maturityScore: avg(allScores.map(s => s?.maturityScore)), breadthScore: avg(allScores.map(s => s?.breadthScore)), dimensionScores: dimensionBenchmarks, companyCount: complete.length };
  }

  function handlePrint() { window.print(); }

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
          <button onClick={() => router.push('/admin/scoring')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700">Return to Scoring</button>
        </div>
      </div>
    );
  }

  const companyName = company.company_name || 'Company';
  const firmographics = company.firmographics_data || {};
  const firstName = firmographics.firstName || '';
  const lastName = firmographics.lastName || '';
  const contactName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || firmographics.contact_name || '');
  const contactEmail = firmographics.email || firmographics.contact_email || '';
  
  const { compositeScore, weightedDimScore, maturityScore, breadthScore, dimensionScores, tier } = companyScores;
  
  const dimensionAnalysis = Object.entries(dimensionScores)
    .map(([dim, score]) => {
      const dimNum = parseInt(dim);
      const elements = elementDetails?.[dimNum] || [];
      const benchmark = benchmarks?.dimensionScores?.[dimNum] ?? null;
      return {
        dim: dimNum, name: DIMENSION_NAMES[dimNum] || `Dimension ${dimNum}`, score: score ?? 0,
        benchmark, weight: DEFAULT_DIMENSION_WEIGHTS[dimNum] || 0, tier: getTier(score ?? 0), elements,
        strengths: elements.filter((e: any) => e.isStrength), planning: elements.filter((e: any) => e.isPlanning),
        assessing: elements.filter((e: any) => e.isAssessing), gaps: elements.filter((e: any) => e.isGap),
        unsure: elements.filter((e: any) => e.isUnsure),
      };
    })
    .sort((a, b) => b.score - a.score);
  
  const allElements = Object.values(elementDetails || {}).flat() as any[];
  const totalElements = allElements.length;
  const currentlyOffering = allElements.filter(e => e.isStrength).length;
  const planningItems = allElements.filter(e => e.isPlanning).length;
  const assessingItems = allElements.filter(e => e.isAssessing).length;
  const gapItems = allElements.filter(e => e.isGap).length;
  
  const tierCounts = {
    exemplary: dimensionAnalysis.filter(d => d.tier.name === 'Exemplary').length,
    leading: dimensionAnalysis.filter(d => d.tier.name === 'Leading').length,
    progressing: dimensionAnalysis.filter(d => d.tier.name === 'Progressing').length,
    emerging: dimensionAnalysis.filter(d => d.tier.name === 'Emerging').length,
    developing: dimensionAnalysis.filter(d => d.tier.name === 'Developing').length,
  };
  
  const topDimension = dimensionAnalysis[0];
  const bottomDimension = dimensionAnalysis[dimensionAnalysis.length - 1];
  const strengthDimensions = dimensionAnalysis.filter(d => d.tier.name === 'Exemplary' || d.tier.name === 'Leading');
  const allDimensionsByScore = [...dimensionAnalysis].sort((a, b) => a.score - b.score);
  
  // Initiatives in progress - all planning/assessing items
  const quickWinOpportunities = dimensionAnalysis
    .flatMap(d => [
      ...d.assessing.map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, type: 'Assessing' })),
      ...d.planning.map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, type: 'Planning' }))
    ])
    .slice(0, 8);
  
  // For roadmap - quick wins are assessing/planning items from low-weight dims
  const quickWinItems = dimensionAnalysis
    .flatMap(d => [...d.assessing, ...d.planning].map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, weight: d.weight })))
    .sort((a, b) => a.weight - b.weight)
    .slice(0, 4);
  
  // Foundation items - gaps from high-weight dims
  const foundationItems = allDimensionsByScore
    .filter(d => d.weight >= 10)
    .flatMap(d => d.gaps.slice(0, 2).map((g: any) => ({ ...g, dimNum: d.dim, dimName: d.name, weight: d.weight })))
    .slice(0, 4);
  
  // Excellence items - strengthen already strong dims
  const excellenceItems = strengthDimensions
    .flatMap(d => d.planning.slice(0, 1).map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name })))
    .slice(0, 4);

  // Tier thresholds for next tier calculation
  const tierThresholds = [{ name: 'Exemplary', min: 90 }, { name: 'Leading', min: 75 }, { name: 'Progressing', min: 60 }, { name: 'Emerging', min: 40 }, { name: 'Developing', min: 0 }];
  const nextTierUp = tierThresholds.find(t => t.min > (compositeScore || 0));
  const pointsToNextTier = nextTierUp ? nextTierUp.min - (compositeScore || 0) : null;

  return (
    <div className="min-h-screen bg-slate-100">
      <style jsx global>{`
        @media print { @page { margin: 0.75in; size: letter; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none !important; } .print-break { page-break-before: always; } }
      `}</style>

      {/* Action Bar */}
      <div className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/admin/scoring')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Scoring
          </button>
          <button onClick={handlePrint} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
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
                  <Image src="/best-companies-2026-logo.png" alt="Best Companies 2026" width={120} height={120} className="object-contain" />
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
                  <p className="text-5xl font-bold mt-1" style={{ color: tier?.color || '#666' }}>{compositeScore ?? '—'}</p>
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

          {/* Executive Summary */}
          <div className="px-10 py-8 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Executive Summary</h3>
            <p className="text-slate-700 leading-relaxed text-lg">
              {companyName} demonstrates <strong className="font-semibold" style={{ color: tier?.color }}>{tier?.name?.toLowerCase()}</strong> performance 
              in supporting employees managing cancer, with a composite score of <strong>{compositeScore}</strong>
              {percentileRank !== null && totalCompanies > 1 && (
                <span>, placing in the <strong className="text-purple-700">{percentileRank}th percentile</strong> among assessed organizations</span>
              )}.
              {topDimension && bottomDimension && (
                <span> Your strongest dimension is <strong className="text-emerald-700">{topDimension.name}</strong> ({topDimension.score}), 
                while <strong className="text-amber-700">{bottomDimension.name}</strong> ({bottomDimension.score}) represents your greatest opportunity for growth.</span>
              )}
            </p>
            
            {pointsToNextTier && nextTierUp && pointsToNextTier <= 15 && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-3">
                <TrendUpIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-800">{pointsToNextTier} points from {nextTierUp.name} tier</p>
                  <p className="text-xs text-purple-600 mt-1">Targeted improvements in {allDimensionsByScore[0]?.name} could elevate your overall standing.</p>
                </div>
              </div>
            )}
            
            <div className="mt-6 grid grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-emerald-600">{currentlyOffering}</p>
                <p className="text-sm text-slate-500 mt-1">of {totalElements} elements offered</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-blue-600">{planningItems + assessingItems}</p>
                <p className="text-sm text-slate-500 mt-1">initiatives in development</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-amber-600">{gapItems}</p>
                <p className="text-sm text-slate-500 mt-1">identified gaps</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-purple-600">{tierCounts.exemplary + tierCounts.leading}</p>
                <p className="text-sm text-slate-500 mt-1">dimensions at Leading+</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ KEY FINDINGS ============ */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="px-10 py-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Key Findings at a Glance</h3>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider mb-2">Strongest Area</p>
                <p className="text-white font-semibold">{topDimension?.name || 'N/A'}</p>
                <p className="text-emerald-300 text-sm mt-1">Score: {topDimension?.score}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-amber-300 font-medium uppercase tracking-wider mb-2">Priority Focus</p>
                <p className="text-white font-semibold">{bottomDimension?.name || 'N/A'}</p>
                <p className="text-amber-300 text-sm mt-1">Score: {bottomDimension?.score}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-blue-300 font-medium uppercase tracking-wider mb-2">In Development</p>
                <p className="text-white font-semibold">{planningItems + assessingItems} initiatives</p>
                <p className="text-blue-300 text-sm mt-1">{planningItems} planning, {assessingItems} assessing</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-purple-300 font-medium uppercase tracking-wider mb-2">Tier Distribution</p>
                <p className="text-white font-semibold">{tierCounts.exemplary + tierCounts.leading} / 13 Leading+</p>
                <p className="text-purple-300 text-sm mt-1">{tierCounts.exemplary} Exemplary, {tierCounts.leading} Leading</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ SCORE COMPOSITION ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Score Composition</h3>
          </div>
          <div className="px-10 py-6">
            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'Composite Score', score: compositeScore, weight: null, benchmark: benchmarks?.compositeScore, isTotal: true },
                { label: 'Weighted Dimension Score', score: weightedDimScore, weight: `${DEFAULT_COMPOSITE_WEIGHTS.weightedDim}%`, benchmark: benchmarks?.weightedDimScore },
                { label: 'Program Maturity', score: maturityScore, weight: `${DEFAULT_COMPOSITE_WEIGHTS.maturity}%`, benchmark: benchmarks?.maturityScore },
                { label: 'Support Breadth', score: breadthScore, weight: `${DEFAULT_COMPOSITE_WEIGHTS.breadth}%`, benchmark: benchmarks?.breadthScore },
              ].map((item, idx) => (
                <div key={idx} className={`text-center ${item.isTotal ? 'bg-slate-50 rounded-lg p-4 border-2 border-slate-200' : ''}`}>
                  <p className="text-4xl font-bold" style={{ color: getScoreColor(item.score ?? 0) }}>{item.score ?? '—'}</p>
                  <p className="text-sm text-slate-600 mt-2">{item.label}</p>
                  {item.weight && <p className="text-xs text-slate-400">Weight: {item.weight}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============ DIMENSION PERFORMANCE ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Dimension Performance Overview</h3>
          </div>
          <div className="px-10 py-6">
            <div className="flex items-center gap-4 pb-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="w-8 text-center">#</div>
              <div className="flex-1">Dimension</div>
              <div className="w-10 text-center">Wt%</div>
              <div className="w-64 text-center">Score</div>
              <div className="w-14 text-right">Score</div>
              <div className="w-20 text-center">vs Bench</div>
              <div className="w-20 text-center">Tier</div>
            </div>
            
            {[...dimensionAnalysis].sort((a, b) => b.weight - a.weight).map((d, idx) => {
              const diff = d.benchmark !== null ? d.score - d.benchmark : 0;
              return (
                <div key={d.dim} className={`flex items-center gap-4 py-3 ${idx < dimensionAnalysis.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="w-8 text-center">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: getScoreColor(d.score) }}>{d.dim}</span>
                  </div>
                  <div className="flex-1"><span className="text-sm font-medium text-slate-700">{d.name}</span></div>
                  <div className="w-10 text-center text-xs text-slate-500">{d.weight}%</div>
                  <div className="w-64">
                    <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{ width: `${d.score}%`, backgroundColor: getScoreColor(d.score) }} />
                      {d.benchmark !== null && (
                        <div className="absolute -top-1 flex flex-col items-center" style={{ left: `${Math.min(d.benchmark, 100)}%`, transform: 'translateX(-50%)' }}>
                          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-14 text-right"><span className="text-sm font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span></div>
                  <div className="w-20 text-center">
                    {d.benchmark !== null ? (
                      <>
                        <span className="text-xs text-slate-500">{d.benchmark}</span>
                        <span className={`text-xs ml-1 ${diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>({diff >= 0 ? '+' : ''}{diff})</span>
                      </>
                    ) : <span className="text-xs text-slate-400">—</span>}
                  </div>
                  <div className="w-20 text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${d.tier.bgColor} ${d.tier.textColor}`}>{d.tier.name}</span>
                  </div>
                </div>
              );
            })}
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-4 text-xs text-slate-400">
              <span>Scores out of 100</span>
              <span className="flex items-center gap-1">
                <span className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-500 inline-block"></span>
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
          <StrategicPriorityMatrix dimensionAnalysis={dimensionAnalysis} getScoreColor={getScoreColor} />
        </div>

        {/* ============ AREAS OF EXCELLENCE & GROWTH ============ */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
              <CheckIcon className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-semibold text-emerald-800">Areas of Excellence</h3>
                <p className="text-sm text-emerald-600 mt-0.5">{strengthDimensions.length} dimensions at Leading or above</p>
              </div>
            </div>
            <div className="p-6">
              {strengthDimensions.length > 0 ? (
                <div className="space-y-4">
                  {strengthDimensions.slice(0, 4).map((d) => (
                    <div key={d.dim}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-800 text-sm">{d.name}</p>
                        <span className="text-xs font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                      </div>
                      {d.strengths.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {d.strengths.slice(0, 2).map((e: any, i: number) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
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
                <p className="text-slate-500 text-sm">Focus on building foundational capabilities to reach Leading tier.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
              <TrendUpIcon className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">Growth Opportunities</h3>
                <p className="text-sm text-amber-600 mt-0.5">Dimensions with improvement potential</p>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {allDimensionsByScore.slice(0, 4).map((d) => (
                  <div key={d.dim}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800 text-sm">{d.name}</p>
                      <span className="text-xs font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                    </div>
                    {d.gaps.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {d.gaps.slice(0, 2).map((e: any, i: number) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>
                            <span className="line-clamp-1">{e.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============ INITIATIVES IN PROGRESS ============ */}
        {quickWinOpportunities.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-10 py-5 border-b border-slate-100 bg-blue-50">
              <div className="flex items-center gap-3">
                <LightbulbIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Initiatives In Progress</h3>
                  <p className="text-sm text-blue-700 mt-0.5">Programs currently in planning or under consideration</p>
                </div>
              </div>
            </div>
            <div className="px-10 py-6">
              <p className="text-slate-600 mb-6">
                The following items are currently in planning or assessment phases. Converting these to active programs 
                represents the fastest path to improving your composite score, as the organizational groundwork is already underway.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {quickWinOpportunities.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className={`text-xs font-medium px-2 py-1 rounded flex-shrink-0 ${item.type === 'Planning' ? 'bg-blue-100 text-blue-700' : 'bg-sky-100 text-sky-700'}`}>{item.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-1">D{item.dimNum}: {item.dimName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ STRATEGIC RECOMMENDATIONS - MCKINSEY STYLE ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 print-break">
          <div className="px-10 py-6 bg-slate-800">
            <h3 className="font-semibold text-white text-lg">Strategic Recommendations</h3>
            <p className="text-slate-300 text-sm mt-1">Detailed analysis and action plans for priority dimensions</p>
          </div>
          
          <div className="divide-y divide-slate-200">
            {allDimensionsByScore.slice(0, 4).map((d, idx) => {
              const insight = DIMENSION_STRATEGIC_INSIGHTS[d.dim];
              return (
                <div key={d.dim} className="px-10 py-8">
                  {/* Dimension Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: getScoreColor(d.score) }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-slate-900">{d.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${d.tier.bgColor} ${d.tier.textColor}`}>{d.tier.name}</span>
                        <span className="text-sm text-slate-500">Score: {d.score} | Weight: {d.weight}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Current State Assessment */}
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* Gaps */}
                    <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertIcon className="w-4 h-4 text-red-600" />
                        <h5 className="font-semibold text-red-800 text-sm">Gaps ({d.gaps.length})</h5>
                      </div>
                      {d.gaps.length > 0 ? (
                        <ul className="space-y-1.5">
                          {d.gaps.slice(0, 4).map((g: any, i: number) => (
                            <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                              <span className="line-clamp-2">{g.name}</span>
                            </li>
                          ))}
                          {d.gaps.length > 4 && <li className="text-xs text-slate-400 ml-2.5">+{d.gaps.length - 4} more</li>}
                        </ul>
                      ) : <p className="text-xs text-slate-500">No critical gaps identified</p>}
                    </div>
                    
                    {/* In Progress */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowRightIcon className="w-4 h-4 text-blue-600" />
                        <h5 className="font-semibold text-blue-800 text-sm">In Progress ({d.planning.length + d.assessing.length})</h5>
                      </div>
                      {(d.planning.length > 0 || d.assessing.length > 0) ? (
                        <ul className="space-y-1.5">
                          {[...d.planning.slice(0, 2), ...d.assessing.slice(0, 2)].slice(0, 4).map((item: any, i: number) => (
                            <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                              <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${item.isPlanning ? 'bg-blue-100 text-blue-700' : 'bg-sky-100 text-sky-700'}`}>
                                {item.isPlanning ? 'P' : 'A'}
                              </span>
                              <span className="line-clamp-2">{item.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-xs text-slate-500">No initiatives currently in progress</p>}
                    </div>
                    
                    {/* Strengths */}
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckIcon className="w-4 h-4 text-emerald-600" />
                        <h5 className="font-semibold text-emerald-800 text-sm">Strengths ({d.strengths.length})</h5>
                      </div>
                      {d.strengths.length > 0 ? (
                        <ul className="space-y-1.5">
                          {d.strengths.slice(0, 4).map((s: any, i: number) => (
                            <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                              <span className="line-clamp-2">{s.name}</span>
                            </li>
                          ))}
                          {d.strengths.length > 4 && <li className="text-xs text-slate-400 ml-2.5">+{d.strengths.length - 4} more</li>}
                        </ul>
                      ) : <p className="text-xs text-slate-500">Building toward first strengths</p>}
                    </div>
                  </div>
                  
                  {/* Strategic Insight & CAC Help */}
                  {insight && (
                    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-semibold text-slate-800 text-sm mb-2">Strategic Insight</h5>
                          <p className="text-sm text-slate-600 leading-relaxed">{insight.insight}</p>
                        </div>
                        <div className="border-l border-slate-200 pl-6">
                          <h5 className="font-semibold text-purple-800 text-sm mb-2">How Cancer and Careers Can Help</h5>
                          <p className="text-sm text-slate-600 leading-relaxed">{insight.cacHelp}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ============ IMPLEMENTATION ROADMAP ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-6 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Implementation Roadmap</h3>
            <p className="text-sm text-slate-500 mt-1">Phased approach to strengthen your cancer support ecosystem</p>
          </div>
          <div className="px-10 py-8">
            <div className="grid grid-cols-3 gap-8">
              {/* Phase 1: Quick Wins */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-700 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Quick Wins</h4>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100 min-h-[180px]">
                  <p className="text-xs text-emerald-700 font-medium mb-3">Accelerate items already in progress</p>
                  {quickWinItems.length > 0 ? (
                    <ul className="space-y-2">
                      {quickWinItems.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-700">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-slate-500 block">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Begin with communication and manager awareness initiatives</p>
                  )}
                </div>
              </div>
              
              {/* Phase 2: Foundation */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-700 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Foundation Building</h4>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 min-h-[180px]">
                  <p className="text-xs text-blue-700 font-medium mb-3">Address high-weight dimension gaps</p>
                  {foundationItems.length > 0 ? (
                    <ul className="space-y-2">
                      {foundationItems.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-700">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-slate-500 block">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Foundation already strong - focus on refinement</p>
                  )}
                </div>
              </div>
              
              {/* Phase 3: Excellence */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-700 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Excellence & Culture</h4>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 min-h-[180px]">
                  <p className="text-xs text-purple-700 font-medium mb-3">Elevate strengths to industry-leading</p>
                  {excellenceItems.length > 0 ? (
                    <ul className="space-y-2">
                      {excellenceItems.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-700">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-slate-500 block">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Expand manager training and cultural initiatives</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ HOW CAC CAN HELP ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 print-break">
          <div className="px-10 py-6 bg-gradient-to-r from-purple-700 to-purple-600">
            <h3 className="font-semibold text-white text-lg">How Cancer and Careers Can Help</h3>
            <p className="text-purple-200 text-sm mt-1">Tailored support to enhance your employee experience</p>
          </div>
          <div className="px-10 py-6">
            <p className="text-slate-600 mb-6 leading-relaxed">
              Every organization enters this work from a different place. Cancer and Careers consulting practice 
              helps organizations understand where they are, identify where they want to be, and build a realistic 
              path to get there—shaped by two decades of frontline experience with employees navigating cancer 
              and the HR teams supporting them.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 text-sm mb-2">Manager Preparedness & Training</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5"></span>Live training sessions with case studies</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5"></span>Manager toolkit and conversation guides</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5"></span>Train the trainer programs</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 text-sm mb-2">Navigation & Resource Architecture</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5"></span>Resource audit and gap analysis</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5"></span>Single entry point design</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5"></span>Communication strategy</li>
                </ul>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <h4 className="font-semibold text-rose-800 text-sm mb-2">Return to Work Excellence</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5"></span>Phased return protocols</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5"></span>Check-in cadence design</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5"></span>Career continuity planning</li>
                </ul>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-800 text-sm mb-2">Policy & Program Assessment</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5"></span>Comprehensive policy review</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5"></span>Implementation audit</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5"></span>Business case development</li>
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
                <p className="leading-relaxed">Organizations are assessed across 13 dimensions of workplace cancer support. The composite score combines dimension performance (90%), program maturity (5%), and support breadth (5%).</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-2">Benchmarking</p>
                <p className="leading-relaxed">Benchmark scores represent average performance across all Index participants. Percentile rankings indicate relative positioning within the cohort.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-2">Performance Tiers</p>
                <p className="leading-relaxed">
                  <span className="text-purple-600 font-medium">Exemplary</span> (90+) · 
                  <span className="text-emerald-600 font-medium"> Leading</span> (75-89) · 
                  <span className="text-blue-600 font-medium"> Progressing</span> (60-74) · 
                  <span className="text-amber-600 font-medium"> Emerging</span> (40-59) · 
                  <span className="text-red-600 font-medium"> Developing</span> (&lt;40)
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
                <Image src="/cancer-careers-logo.png" alt="Cancer and Careers" width={140} height={45} className="object-contain" />
                <div className="border-l border-slate-200 pl-6">
                  <p className="text-sm font-medium text-slate-700">Best Companies for Working with Cancer Index</p>
                  <p className="text-xs text-slate-400">© 2026 Cancer and Careers. All rights reserved.</p>
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

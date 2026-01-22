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
// UI HELPERS - MUTED PROFESSIONAL PALETTE
// ============================================

function getTier(score: number): { name: string; color: string; bgColor: string; textColor: string; borderColor: string } {
  if (score >= 90) return { name: 'Exemplary', color: '#5B21B6', bgColor: 'bg-violet-50', textColor: 'text-violet-900', borderColor: 'border-violet-200' };
  if (score >= 75) return { name: 'Leading', color: '#047857', bgColor: 'bg-emerald-50', textColor: 'text-emerald-900', borderColor: 'border-emerald-200' };
  if (score >= 60) return { name: 'Progressing', color: '#1D4ED8', bgColor: 'bg-blue-50', textColor: 'text-blue-900', borderColor: 'border-blue-200' };
  if (score >= 40) return { name: 'Emerging', color: '#B45309', bgColor: 'bg-amber-50', textColor: 'text-amber-900', borderColor: 'border-amber-200' };
  return { name: 'Developing', color: '#B91C1C', bgColor: 'bg-red-50', textColor: 'text-red-900', borderColor: 'border-red-200' };
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#5B21B6'; if (score >= 75) return '#047857'; if (score >= 60) return '#1D4ED8';
  if (score >= 40) return '#B45309'; return '#B91C1C';
}

// ============================================
// ICONS - MINIMAL
// ============================================

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
);

const TrendUpIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
);

// ============================================
// STRATEGIC PRIORITY MATRIX - CLEAN WITH LABEL BARS
// ============================================

function StrategicPriorityMatrix({ dimensionAnalysis, getScoreColor }: { dimensionAnalysis: any[]; getScoreColor: (score: number) => string }) {
  const [hoveredDim, setHoveredDim] = useState<number | null>(null);
  const MAX_WEIGHT = 15;
  
  const CHART_WIDTH = 900;
  const CHART_HEIGHT = 380;
  const LABEL_HEIGHT = 24;
  const MARGIN = { top: LABEL_HEIGHT + 10, right: 20, bottom: LABEL_HEIGHT + 45, left: 60 };
  const PLOT_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const PLOT_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  
  const hoveredData = hoveredDim !== null ? dimensionAnalysis.find(d => d.dim === hoveredDim) : null;
  
  return (
    <div className="px-4 py-4">
      <div className="relative w-full" style={{ height: '500px' }}>
        <svg className="w-full" style={{ height: '440px' }} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15"/>
            </filter>
          </defs>
          
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {/* TOP LABEL BARS - above the chart */}
            <rect x={0} y={-LABEL_HEIGHT - 4} width={PLOT_WIDTH/2 - 2} height={LABEL_HEIGHT} rx="4" fill="#FEE2E2" />
            <text x={PLOT_WIDTH/4} y={-LABEL_HEIGHT/2 - 4 + 1} textAnchor="middle" dominantBaseline="middle" fill="#991B1B" fontSize="10" fontWeight="600" fontFamily="system-ui">PRIORITY GAPS</text>
            
            <rect x={PLOT_WIDTH/2 + 2} y={-LABEL_HEIGHT - 4} width={PLOT_WIDTH/2 - 2} height={LABEL_HEIGHT} rx="4" fill="#D1FAE5" />
            <text x={PLOT_WIDTH * 3/4} y={-LABEL_HEIGHT/2 - 4 + 1} textAnchor="middle" dominantBaseline="middle" fill="#065F46" fontSize="10" fontWeight="600" fontFamily="system-ui">CORE STRENGTHS</text>
            
            {/* Quadrant backgrounds - clean white/light gray */}
            <rect x={0} y={0} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            <rect x={PLOT_WIDTH/2} y={0} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            <rect x={0} y={PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            <rect x={PLOT_WIDTH/2} y={PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            
            {/* Grid lines */}
            <line x1={0} y1={PLOT_HEIGHT/2} x2={PLOT_WIDTH} y2={PLOT_HEIGHT/2} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={PLOT_WIDTH/2} y1={0} x2={PLOT_WIDTH/2} y2={PLOT_HEIGHT} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Border */}
            <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="none" stroke="#D1D5DB" strokeWidth="1" />
            
            {/* Data points */}
            {dimensionAnalysis.map((d) => {
              const xPos = (d.score / 100) * PLOT_WIDTH;
              const yPos = PLOT_HEIGHT - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_HEIGHT);
              const isHovered = hoveredDim === d.dim;
              
              return (
                <g 
                  key={d.dim} 
                  transform={`translate(${xPos}, ${yPos})`}
                  onMouseEnter={() => setHoveredDim(d.dim)}
                  onMouseLeave={() => setHoveredDim(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r={isHovered ? 22 : 18} fill="white" filter="url(#dropShadow)" style={{ transition: 'all 0.15s ease' }} />
                  <circle r={isHovered ? 18 : 15} fill={getScoreColor(d.score)} style={{ transition: 'all 0.15s ease' }} />
                  <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">
                    D{d.dim}
                  </text>
                </g>
              );
            })}
            
            {/* BOTTOM LABEL BARS - below the chart */}
            <rect x={0} y={PLOT_HEIGHT + 4} width={PLOT_WIDTH/2 - 2} height={LABEL_HEIGHT} rx="4" fill="#F3F4F6" />
            <text x={PLOT_WIDTH/4} y={PLOT_HEIGHT + 4 + LABEL_HEIGHT/2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#4B5563" fontSize="10" fontWeight="600" fontFamily="system-ui">MONITOR</text>
            
            <rect x={PLOT_WIDTH/2 + 2} y={PLOT_HEIGHT + 4} width={PLOT_WIDTH/2 - 2} height={LABEL_HEIGHT} rx="4" fill="#DBEAFE" />
            <text x={PLOT_WIDTH * 3/4} y={PLOT_HEIGHT + 4 + LABEL_HEIGHT/2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#1E40AF" fontSize="10" fontWeight="600" fontFamily="system-ui">LEVERAGE</text>
            
            {/* X-axis */}
            <g transform={`translate(0, ${PLOT_HEIGHT + LABEL_HEIGHT + 8})`}>
              {[0, 25, 50, 75, 100].map((val) => (
                <g key={val} transform={`translate(${(val / 100) * PLOT_WIDTH}, 0)`}>
                  <line y1="0" y2="4" stroke="#9CA3AF" strokeWidth="1" />
                  <text y="16" textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="system-ui">{val}</text>
                </g>
              ))}
              <text x={PLOT_WIDTH/2} y="34" textAnchor="middle" fill="#374151" fontSize="11" fontWeight="600" fontFamily="system-ui">
                PERFORMANCE SCORE →
              </text>
            </g>
            
            {/* Y-axis */}
            <g>
              {[0, 5, 10, 15].map((val) => {
                const yPos = PLOT_HEIGHT - ((val / MAX_WEIGHT) * PLOT_HEIGHT);
                return (
                  <g key={val}>
                    <line x1="-4" y1={yPos} x2="0" y2={yPos} stroke="#9CA3AF" strokeWidth="1" />
                    <text x="-8" y={yPos + 3} textAnchor="end" fill="#6B7280" fontSize="10" fontFamily="system-ui">{val}%</text>
                  </g>
                );
              })}
            </g>
            
            {/* Y-axis label */}
            <text transform="rotate(-90)" x={-PLOT_HEIGHT/2} y="-45" textAnchor="middle" fill="#374151" fontSize="11" fontWeight="600" fontFamily="system-ui">
              ↑ STRATEGIC IMPORTANCE
            </text>
          </g>
        </svg>
        
        {/* Hover tooltip card */}
        {hoveredData && (
          <div className="absolute top-2 right-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-56 z-20">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md" style={{ backgroundColor: getScoreColor(hoveredData.score) }}>
                D{hoveredData.dim}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm leading-tight">{hoveredData.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-slate-500 text-xs font-medium">Score</p>
                <p className="font-bold text-lg" style={{ color: getScoreColor(hoveredData.score) }}>{hoveredData.score}</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-slate-500 text-xs font-medium">Weight</p>
                <p className="font-bold text-lg text-slate-700">{hoveredData.weight}%</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${hoveredData.tier.bgColor}`} style={{ color: hoveredData.tier.color }}>{hoveredData.tier.name}</span>
            </div>
          </div>
        )}
        
        {/* Legend - below chart */}
        <div className="mt-1 pt-3 border-t border-slate-200">
          <div className="grid grid-cols-7 gap-x-2 gap-y-1.5">
            {[...dimensionAnalysis].sort((a, b) => a.dim - b.dim).map(d => (
              <div 
                key={d.dim} 
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${hoveredDim === d.dim ? 'bg-slate-200 shadow-sm' : 'hover:bg-slate-100'}`}
                onMouseEnter={() => setHoveredDim(d.dim)}
                onMouseLeave={() => setHoveredDim(null)}
              >
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 shadow-sm" style={{ backgroundColor: getScoreColor(d.score) }}>
                  {d.dim}
                </span>
                <span className="text-xs text-slate-700 truncate font-medium">{DIMENSION_SHORT_NAMES[d.dim]}</span>
              </div>
            ))}
          </div>
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
  const [exporting, setExporting] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [companyScores, setCompanyScores] = useState<any>(null);
  const [elementDetails, setElementDetails] = useState<any>(null);
  const [percentileRank, setPercentileRank] = useState<number | null>(null);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);

  useEffect(() => {
    // CRITICAL: Reset ALL state when surveyId changes
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

  async function handleExportPDF() {
    setExporting(true);
    
    try {
      // Dynamically load html2pdf.js
      if (typeof window !== 'undefined' && !(window as any).html2pdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve, reject) => { 
          script.onload = resolve; 
          script.onerror = reject;
        });
      }
      
      const element = printRef.current;
      if (!element) {
        setExporting(false);
        return;
      }
      
      const opt = {
        margin: [0.4, 0.4, 0.4, 0.4],
        filename: `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Cancer_Support_Report.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true,
          logging: false,
          windowWidth: 1200
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.pdf-break-before',
          after: '.pdf-break-after',
          avoid: '.pdf-no-break'
        }
      };
      
      await (window as any).html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
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
          <button onClick={() => router.push('/admin/scoring')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700">Return to Scoring</button>
        </div>
      </div>
    );
  }

  const { compositeScore, weightedDimScore, maturityScore, breadthScore, dimensionScores, tier } = companyScores;
  const companyName = company.firmographics_data?.company_name || company.company_name || 'Unknown Company';
  const contactName = company.firmographics_data?.primary_contact_name || '';
  const contactEmail = company.firmographics_data?.primary_contact_email || '';
  
  const dimensionAnalysis = Object.entries(dimensionScores)
    .map(([dim, score]) => {
      const dimNum = parseInt(dim);
      const elements = elementDetails?.[dimNum] || [];
      return {
        dim: dimNum,
        name: DIMENSION_NAMES[dimNum],
        score: score ?? 0,
        weight: DEFAULT_DIMENSION_WEIGHTS[dimNum] || 0,
        weightPct: Math.round((DEFAULT_DIMENSION_WEIGHTS[dimNum] || 0) / Object.values(DEFAULT_DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0) * 100),
        tier: getTier(score ?? 0),
        benchmark: benchmarks?.dimensionScores?.[dimNum] ?? null,
        elements,
        strengths: elements.filter((e: any) => e.isStrength),
        planning: elements.filter((e: any) => e.isPlanning),
        assessing: elements.filter((e: any) => e.isAssessing),
        gaps: elements.filter((e: any) => e.isGap),
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
  
  // Initiatives in progress
  const quickWinOpportunities = dimensionAnalysis
    .flatMap(d => [
      ...d.assessing.map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, type: 'Assessing' })),
      ...d.planning.map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, type: 'Planning' }))
    ])
    .slice(0, 8);
  
  // Roadmap items
  const quickWinItems = dimensionAnalysis
    .flatMap(d => [...d.assessing, ...d.planning].map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, weight: d.weight })))
    .sort((a, b) => a.weight - b.weight)
    .slice(0, 5);
  
  const foundationItems = allDimensionsByScore
    .filter(d => d.weight >= 10)
    .flatMap(d => d.gaps.slice(0, 2).map((g: any) => ({ ...g, dimNum: d.dim, dimName: d.name, weight: d.weight })))
    .slice(0, 5);
  
  // Excellence items: remaining gaps in lower-weight dimensions (things to address in 12+ months)
  const excellenceItems = [...dimensionAnalysis]
    .sort((a, b) => a.weight - b.weight) // Lower weight first
    .flatMap(d => d.gaps.slice(0, 2).map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, weight: d.weight })))
    .slice(0, 5);

  const tierThresholds = [{ name: 'Exemplary', min: 90 }, { name: 'Leading', min: 75 }, { name: 'Progressing', min: 60 }, { name: 'Emerging', min: 40 }, { name: 'Developing', min: 0 }];
  const nextTierUp = tierThresholds.find(t => t.min > (compositeScore || 0));
  const pointsToNextTier = nextTierUp ? nextTierUp.min - (compositeScore || 0) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        @media print { 
          @page { margin: 0.5in; size: letter; } 
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } 
          .no-print { display: none !important; } 
          .pdf-break-before { page-break-before: always; }
          .pdf-no-break { page-break-inside: avoid; }
        }
        /* PDF export specific styles */
        .pdf-export-mode .dimension-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      {/* Action Bar */}
      <div className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/admin/scoring')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Scoring
          </button>
          <button 
            onClick={handleExportPDF} 
            disabled={exporting}
            className={`px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              exporting 
                ? 'bg-slate-400 text-slate-200 cursor-wait' 
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            {exporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div ref={printRef} className="max-w-6xl mx-auto py-10 px-8">
        
        {/* ============ HEADER ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
          <div className="bg-slate-800 px-10 py-8">
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
                <span>, placing in the <strong style={{ color: '#5B21B6' }}>{percentileRank}th percentile</strong> among assessed organizations</span>
              )}.
              {topDimension && bottomDimension && (
                <span> Your strongest dimension is <strong style={{ color: '#047857' }}>{topDimension.name}</strong> ({topDimension.score}), 
                while <strong style={{ color: '#B45309' }}>{bottomDimension.name}</strong> ({bottomDimension.score}) represents your greatest opportunity for growth.</span>
              )}
            </p>
            
            {pointsToNextTier && nextTierUp && pointsToNextTier <= 15 && (
              <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-lg flex items-start gap-3">
                <TrendUpIcon className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-violet-800">{pointsToNextTier} points from {nextTierUp.name} tier</p>
                  <p className="text-xs text-violet-600 mt-1">Targeted improvements in {allDimensionsByScore[0]?.name} could elevate your overall standing.</p>
                </div>
              </div>
            )}
            
            <div className="mt-6 grid grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-slate-800">{currentlyOffering}</p>
                <p className="text-sm text-slate-500 mt-1">of {totalElements} elements offered</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-slate-800">{planningItems + assessingItems}</p>
                <p className="text-sm text-slate-500 mt-1">initiatives in development</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-slate-800">{gapItems}</p>
                <p className="text-sm text-slate-500 mt-1">identified gaps</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-slate-800">{tierCounts.exemplary + tierCounts.leading}</p>
                <p className="text-sm text-slate-500 mt-1">dimensions at Leading+</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ KEY FINDINGS ============ */}
        <div className="bg-slate-800 rounded-lg shadow-sm overflow-hidden mb-8 pdf-no-break">
          <div className="px-10 py-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Key Findings at a Glance</h3>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Strongest Area</p>
                <p className="text-white font-semibold">{topDimension?.name || 'N/A'}</p>
                <p className="text-slate-300 text-sm mt-1">Score: {topDimension?.score}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Growth Opportunity</p>
                <p className="text-white font-semibold">{bottomDimension?.name || 'N/A'}</p>
                <p className="text-slate-300 text-sm mt-1">Score: {bottomDimension?.score}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">In Progress</p>
                <p className="text-white font-semibold">{planningItems + assessingItems} items</p>
                <p className="text-slate-300 text-sm mt-1">{planningItems} planning, {assessingItems} assessing</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Tier Distribution</p>
                <p className="text-white font-semibold">{tierCounts.exemplary + tierCounts.leading} / 13 Leading+</p>
                <p className="text-slate-300 text-sm mt-1">{tierCounts.exemplary} Exemplary, {tierCounts.leading} Leading</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ SCORE COMPOSITION ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Score Composition</h3>
          </div>
          <div className="px-10 py-6">
            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'Composite Score', score: compositeScore, weight: null, isTotal: true },
                { label: 'Weighted Dimension Score', score: weightedDimScore, weight: `${DEFAULT_COMPOSITE_WEIGHTS.weightedDim}%` },
                { label: 'Program Maturity', score: maturityScore, weight: `${DEFAULT_COMPOSITE_WEIGHTS.maturity}%` },
                { label: 'Support Breadth', score: breadthScore, weight: `${DEFAULT_COMPOSITE_WEIGHTS.breadth}%` },
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

        {/* ============ DIMENSION PERFORMANCE - FIXED LAYOUT FOR PDF ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
          <div className="px-8 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Dimension Performance Overview</h3>
          </div>
          <div className="px-8 py-6">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="pb-3 text-center w-12">#</th>
                  <th className="pb-3 text-left">Dimension</th>
                  <th className="pb-3 text-center w-14">Wt%</th>
                  <th className="pb-3 text-center w-40">Score</th>
                  <th className="pb-3 text-right w-14">Score</th>
                  <th className="pb-3 text-center w-24">vs Bench</th>
                  <th className="pb-3 text-center w-24">Tier</th>
                </tr>
              </thead>
              <tbody>
                {[...dimensionAnalysis].sort((a, b) => b.weight - a.weight).map((d, idx) => {
                  const diff = d.benchmark !== null ? d.score - d.benchmark : 0;
                  return (
                    <tr key={d.dim} className={idx < dimensionAnalysis.length - 1 ? 'border-b border-slate-100' : ''}>
                      <td className="py-2.5 text-center">
                        <span className="w-7 h-7 rounded-full inline-flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: getScoreColor(d.score) }}>{d.dim}</span>
                      </td>
                      <td className="py-2.5 text-left">
                        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{d.name}</span>
                      </td>
                      <td className="py-2.5 text-center text-xs text-slate-500">{d.weight}%</td>
                      <td className="py-2.5">
                        <div className="relative h-5">
                          {d.benchmark !== null && (
                            <div className="absolute" style={{ left: `${Math.min(d.benchmark, 100)}%`, top: '0', transform: 'translateX(-50%)' }}>
                              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-slate-500" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 top-1.5 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${d.score}%`, backgroundColor: getScoreColor(d.score) }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="text-sm font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                      </td>
                      <td className="py-2.5 text-center">
                        {d.benchmark !== null ? (
                          <>
                            <span className="text-xs text-slate-500">{d.benchmark}</span>
                            <span className={`text-xs ml-1 ${diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>({diff >= 0 ? '+' : ''}{diff})</span>
                          </>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${d.tier.bgColor} ${d.tier.textColor}`}>{d.tier.name}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-4 text-xs text-slate-400">
              <span>Scores out of 100</span>
              <span className="flex items-center gap-1">
                <span className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-slate-500 inline-block"></span>
                Benchmark
              </span>
            </div>
          </div>
        </div>

        {/* ============ STRATEGIC PRIORITY MATRIX ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-break-before pdf-no-break">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Strategic Priority Matrix</h3>
            <p className="text-sm text-slate-500 mt-1">Dimensions plotted by current performance versus strategic weight. Hover over any dimension for details.</p>
          </div>
          <StrategicPriorityMatrix dimensionAnalysis={dimensionAnalysis} getScoreColor={getScoreColor} />
        </div>

        {/* ============ AREAS OF EXCELLENCE & GROWTH - WITH COLORED HEADERS ============ */}
        <div className="grid grid-cols-2 gap-6 mb-8 pdf-no-break">
          {/* Areas of Excellence */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-700">
              <h3 className="font-semibold text-white">Areas of Excellence</h3>
              <p className="text-emerald-200 text-sm">{strengthDimensions.length} dimensions at Leading or above</p>
            </div>
            <div className="divide-y divide-slate-100">
              {strengthDimensions.length > 0 ? (
                strengthDimensions.slice(0, 5).map((d) => (
                  <div key={d.dim} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-800">{d.name}</p>
                      <span className="text-sm font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                    </div>
                    <ul className="space-y-1">
                      {d.strengths.slice(0, 3).map((e: any, i: number) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{e.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <p className="text-slate-500">Focus on building foundational capabilities to reach Leading tier.</p>
                </div>
              )}
            </div>
          </div>

          {/* Growth Opportunities */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-amber-600">
              <h3 className="font-semibold text-white">Growth Opportunities</h3>
              <p className="text-amber-100 text-sm">Dimensions with improvement potential</p>
            </div>
            <div className="divide-y divide-slate-100">
              {allDimensionsByScore.slice(0, 5).map((d) => (
                <div key={d.dim} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-800">{d.name}</p>
                    <span className="text-sm font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                  </div>
                  <ul className="space-y-1">
                    {d.gaps.slice(0, 3).map((e: any, i: number) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0"></span>
                        <span>{e.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============ INITIATIVES IN PROGRESS ============ */}
        {quickWinOpportunities.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
            <div className="px-10 py-5 bg-blue-700">
              <h3 className="font-semibold text-white">Initiatives In Progress</h3>
              <p className="text-blue-200 text-sm mt-0.5">Programs currently in planning or under consideration</p>
            </div>
            <div className="px-10 py-6">
              <p className="text-slate-600 mb-6">
                Converting these items to active programs represents the fastest path to improving your composite score.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {quickWinOpportunities.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className={`text-xs font-medium px-2 py-1 rounded flex-shrink-0 ${item.type === 'Planning' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>{item.type}</span>
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

        {/* ============ STRATEGIC RECOMMENDATIONS - CONSISTENT HEADERS ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-break-before">
          <div className="px-10 py-6 bg-slate-800">
            <h3 className="font-semibold text-white text-lg">Strategic Recommendations</h3>
            <p className="text-slate-400 text-sm mt-1">Detailed analysis and action plans for priority dimensions</p>
          </div>
          
          <div className="divide-y-4 divide-slate-100">
            {allDimensionsByScore.slice(0, 4).map((d, idx) => {
              const insight = DIMENSION_STRATEGIC_INSIGHTS[d.dim];
              // Use tier color for the accent, consistent dark header for all
              const tierColor = getScoreColor(d.score);
              
              return (
                <div key={d.dim} className="border-l-4 pdf-no-break" style={{ borderLeftColor: tierColor }}>
                  {/* Dimension Header - Consistent dark slate for all */}
                  <div className="px-10 py-4 bg-slate-700 border-b border-slate-600">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-md" style={{ backgroundColor: tierColor }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-white">{d.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className={`text-sm font-medium px-3 py-1 rounded ${d.tier.bgColor}`} style={{ color: d.tier.color }}>{d.tier.name}</span>
                          <span className="text-sm text-slate-300">Score: <strong className="text-white">{d.score}</strong></span>
                          <span className="text-sm text-slate-300">Weight: <strong className="text-white">{d.weight}%</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-10 py-6">
                    {/* Current State - 3 columns */}
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      {/* Gaps */}
                      <div className="border border-red-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                          <h5 className="font-semibold text-red-800 text-sm">Gaps ({d.gaps.length})</h5>
                        </div>
                        <div className="p-4 bg-white">
                          {d.gaps.length > 0 ? (
                            <ul className="space-y-2">
                              {d.gaps.map((g: any, i: number) => (
                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></span>
                                  <span>{g.name}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-slate-400 italic">No critical gaps</p>}
                        </div>
                      </div>
                      
                      {/* In Progress */}
                      <div className="border border-blue-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                          <h5 className="font-semibold text-blue-800 text-sm">In Progress ({d.planning.length + d.assessing.length})</h5>
                        </div>
                        <div className="p-4 bg-white">
                          {(d.planning.length > 0 || d.assessing.length > 0) ? (
                            <ul className="space-y-2">
                              {[...d.planning, ...d.assessing].map((item: any, i: number) => (
                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                                  <span>{item.name}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-slate-400 italic">No initiatives in progress</p>}
                        </div>
                      </div>
                      
                      {/* Strengths */}
                      <div className="border border-emerald-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200">
                          <h5 className="font-semibold text-emerald-800 text-sm">Strengths ({d.strengths.length})</h5>
                        </div>
                        <div className="p-4 bg-white">
                          {d.strengths.length > 0 ? (
                            <ul className="space-y-2">
                              {d.strengths.map((s: any, i: number) => (
                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></span>
                                  <span>{s.name}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-slate-400 italic">Building toward first strengths</p>}
                        </div>
                      </div>
                    </div>
                    
                    {/* Strategic Insight & CAC Help */}
                    {insight && (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="border border-slate-200 rounded-lg p-5 bg-white">
                          <h5 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">Strategic Insight</h5>
                          <p className="text-sm text-slate-600 leading-relaxed">{insight.insight}</p>
                        </div>
                        <div className="border border-violet-200 rounded-lg p-5 bg-violet-50">
                          <h5 className="font-semibold text-violet-800 mb-3 text-sm uppercase tracking-wide">How Cancer and Careers Can Help</h5>
                          <p className="text-sm text-slate-600 leading-relaxed">{insight.cacHelp}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============ IMPLEMENTATION ROADMAP ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-break-before pdf-no-break">
          <div className="px-10 py-6 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Implementation Roadmap</h3>
            <p className="text-sm text-slate-500 mt-1">Phased approach to strengthen your cancer support ecosystem</p>
          </div>
          <div className="px-10 py-8">
            <div className="grid grid-cols-3 gap-6">
              {/* Phase 1 */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">1</span>
                    <div>
                      <h4 className="font-semibold text-white">Quick Wins</h4>
                      <p className="text-slate-400 text-xs">Immediate impact</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-4">Accelerate items already in progress</p>
                  {quickWinItems.length > 0 ? (
                    <ul className="space-y-3">
                      {quickWinItems.map((item, idx) => (
                        <li key={idx} className="text-sm">
                          <p className="text-slate-700">{item.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Begin with communication and manager awareness initiatives</p>
                  )}
                </div>
              </div>
              
              {/* Phase 2 */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-700 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">2</span>
                    <div>
                      <h4 className="font-semibold text-white">Foundation Building</h4>
                      <p className="text-slate-400 text-xs">6-12 months</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-4">Address high-weight dimension gaps</p>
                  {foundationItems.length > 0 ? (
                    <ul className="space-y-3">
                      {foundationItems.map((item, idx) => (
                        <li key={idx} className="text-sm">
                          <p className="text-slate-700">{item.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Focus on navigation and insurance resources</p>
                  )}
                </div>
              </div>
              
              {/* Phase 3 */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-600 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">3</span>
                    <div>
                      <h4 className="font-semibold text-white">Long-Term Enhancement</h4>
                      <p className="text-slate-400 text-xs">12+ months</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-4">Address remaining lower-priority gaps</p>
                  {excellenceItems.length > 0 ? (
                    <ul className="space-y-3">
                      {excellenceItems.map((item, idx) => (
                        <li key={idx} className="text-sm">
                          <p className="text-slate-700">{item.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Continue expanding strengths and monitoring program effectiveness</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ HOW CAC CAN HELP ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
          <div className="px-10 py-6 bg-slate-800">
            <h3 className="font-semibold text-white text-lg">How Cancer and Careers Can Help</h3>
            <p className="text-slate-400 text-sm mt-1">Tailored support to enhance your employee experience</p>
          </div>
          <div className="px-10 py-6">
            <p className="text-slate-600 mb-6 leading-relaxed">
              Every organization enters this work from a different place. Cancer and Careers consulting practice 
              helps organizations understand where they are, identify where they want to be, and build a realistic 
              path to get there—shaped by two decades of frontline experience with employees navigating cancer 
              and the HR teams supporting them.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-slate-200 rounded-lg p-5">
                <h4 className="font-semibold text-slate-800 text-sm mb-3">Manager Preparedness & Training</h4>
                <ul className="text-sm text-slate-600 space-y-1.5">
                  <li>• Live training sessions with case studies</li>
                  <li>• Manager toolkit and conversation guides</li>
                  <li>• Train the trainer programs</li>
                </ul>
              </div>
              <div className="border border-slate-200 rounded-lg p-5">
                <h4 className="font-semibold text-slate-800 text-sm mb-3">Navigation & Resource Architecture</h4>
                <ul className="text-sm text-slate-600 space-y-1.5">
                  <li>• Resource audit and gap analysis</li>
                  <li>• Single entry point design</li>
                  <li>• Communication strategy</li>
                </ul>
              </div>
              <div className="border border-slate-200 rounded-lg p-5">
                <h4 className="font-semibold text-slate-800 text-sm mb-3">Return to Work Excellence</h4>
                <ul className="text-sm text-slate-600 space-y-1.5">
                  <li>• Phased return protocols</li>
                  <li>• Check-in cadence design</li>
                  <li>• Career continuity planning</li>
                </ul>
              </div>
              <div className="border border-slate-200 rounded-lg p-5">
                <h4 className="font-semibold text-slate-800 text-sm mb-3">Policy & Program Assessment</h4>
                <ul className="text-sm text-slate-600 space-y-1.5">
                  <li>• Comprehensive policy review</li>
                  <li>• Implementation audit</li>
                  <li>• Business case development</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-700">Ready to take the next step?</p>
                  <p className="text-sm text-slate-500 mt-1">Contact Cancer and Careers to discuss how we can support your organization.</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-700">cancerandcareers.org</p>
                  <p className="text-sm text-slate-500">cacbestcompanies@cew.org</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ METHODOLOGY ============ */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-8 pdf-no-break">
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
                <p className="leading-relaxed">Benchmark scores represent average performance across all organizations in the Index. Percentile rankings indicate relative positioning within the cohort.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-2">Performance Tiers</p>
                <p className="leading-relaxed">
                  <span style={{ color: '#5B21B6' }} className="font-medium">Exemplary</span> (90+) · 
                  <span style={{ color: '#047857' }} className="font-medium"> Leading</span> (75-89) · 
                  <span style={{ color: '#1D4ED8' }} className="font-medium"> Progressing</span> (60-74) · 
                  <span style={{ color: '#B45309' }} className="font-medium"> Emerging</span> (40-59) · 
                  <span style={{ color: '#B91C1C' }} className="font-medium"> Developing</span> (&lt;40)
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

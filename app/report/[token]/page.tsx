'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { calculateEnhancedScore } from '@/lib/enhanced-scoring';

// Create Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
// DYNAMIC TAILORED ANALYSIS FUNCTIONS
// ============================================

// Generate tier-adaptive insights based on actual performance
// Get top evidence items for a dimension (best strength, biggest gap, in-flight item)
function getTopEvidence(
  dimNum: number,
  strengths: any[],
  gaps: any[],
  planning: any[],
  elementBenchmarks: Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>>
): { 
  topStrength: { name: string; benchPct: number } | null;
  biggestGap: { name: string; benchPct: number } | null;
  inFlight: { name: string; benchPct: number } | null;
} {
  const benchmarks = elementBenchmarks[dimNum] || {};
  
  // Find top strength - prefer one where fewer peers offer it (more differentiating)
  let topStrength = null;
  if (strengths.length > 0) {
    const strengthsWithBench = strengths.map(s => {
      const bench = benchmarks[s.name] || { currently: 0, total: 1 };
      const pct = Math.round((bench.currently / (bench.total || 1)) * 100);
      return { name: s.name, benchPct: pct };
    }).sort((a, b) => a.benchPct - b.benchPct); // Sort by lowest peer % first (most differentiating)
    topStrength = strengthsWithBench[0];
  }
  
  // Find biggest gap - prefer one where most peers offer it (biggest competitive gap)
  let biggestGap = null;
  if (gaps.length > 0) {
    const gapsWithBench = gaps.map(g => {
      const bench = benchmarks[g.name] || { currently: 0, total: 1 };
      const pct = Math.round((bench.currently / (bench.total || 1)) * 100);
      return { name: g.name, benchPct: pct };
    }).sort((a, b) => b.benchPct - a.benchPct); // Sort by highest peer % first (biggest gap)
    biggestGap = gapsWithBench[0];
  }
  
  // Find in-flight item - prefer one where most peers already offer (fast path to catch up)
  let inFlight = null;
  if (planning.length > 0) {
    const planningWithBench = planning.map(p => {
      const bench = benchmarks[p.name] || { currently: 0, total: 1 };
      const pct = Math.round((bench.currently / (bench.total || 1)) * 100);
      return { name: p.name, benchPct: pct };
    }).sort((a, b) => b.benchPct - a.benchPct); // Sort by highest peer % (most valuable to complete)
    inFlight = planningWithBench[0];
  }
  
  return { topStrength, biggestGap, inFlight };
}

// Get 2-step roadmap for a dimension
function getTwoStepRoadmap(
  dimNum: number,
  gaps: any[],
  planning: any[],
  assessing: any[],
  elementBenchmarks: Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>>
): { quickWin: { name: string; reason: string } | null; strategicLift: { name: string; reason: string } | null } {
  const benchmarks = elementBenchmarks[dimNum] || {};
  
  // Quick win: Pick from planning (already committed) or highest-prevalence gap (easy to justify)
  let quickWin = null;
  if (planning.length > 0) {
    // Best quick win is something already in planning
    const bench = benchmarks[planning[0].name] || { currently: 0, total: 1 };
    const pct = Math.round((bench.currently / (bench.total || 1)) * 100);
    quickWin = { 
      name: planning[0].name, 
      reason: `Already in development; ${pct}% of peers offer this` 
    };
  } else if (gaps.length > 0) {
    // Find gap with highest peer adoption (easiest to justify)
    const gapsWithBench = gaps.map(g => {
      const bench = benchmarks[g.name] || { currently: 0, total: 1 };
      return { ...g, pct: Math.round((bench.currently / (bench.total || 1)) * 100) };
    }).sort((a, b) => b.pct - a.pct);
    if (gapsWithBench[0].pct > 30) {
      quickWin = { 
        name: gapsWithBench[0].name, 
        reason: `${gapsWithBench[0].pct}% of peers already offer this` 
      };
    }
  }
  
  // Strategic lift: Pick the gap with highest peer adoption that isn't the quick win
  let strategicLift = null;
  const allNonOffered = [...gaps, ...assessing].filter(g => g.name !== quickWin?.name);
  if (allNonOffered.length > 0) {
    const withBench = allNonOffered.map(g => {
      const bench = benchmarks[g.name] || { currently: 0, total: 1 };
      return { ...g, pct: Math.round((bench.currently / (bench.total || 1)) * 100) };
    }).sort((a, b) => b.pct - a.pct);
    strategicLift = { 
      name: withBench[0].name, 
      reason: `${withBench[0].pct}% of peers offer this—closing this gap strengthens competitive position` 
    };
  }
  
  return { quickWin, strategicLift };
}

function getDynamicInsight(dimNum: number, score: number, tierName: string, benchmark: number | null, gaps: any[], strengths: any[], planning: any[]): { insight: string; cacHelp: string } {
  const benchDiff = benchmark !== null ? score - benchmark : 0;
  const isAboveBenchmark = benchDiff > 0;
  const gapCount = gaps.length;
  const strengthCount = strengths.length;
  const planningCount = planning.length;
  
  // Dimension-specific context with tailored CAC offerings
  const dimContext: Record<number, { 
    focus: string; 
    risk: string; 
    opportunity: string; 
    quickWin: string;
    cacPrograms: { exemplary: string; leading: string; progressing: string; emerging: string; developing: string };
  }> = {
    1: { 
      focus: 'leave policies and flexibility', 
      risk: 'employees choosing between health and job', 
      opportunity: 'industry-leading time-off benefits', 
      quickWin: 'phased return-to-work options',
      cacPrograms: {
        exemplary: 'Document your leave policies as a best-practice case study. We can facilitate peer learning sessions where you share your approach with other Index participants.',
        leading: 'Our Leave Policy Enhancement workshop can identify the specific gaps preventing Exemplary status, with templates for policy language and implementation guides.',
        progressing: 'CAC\'s Leave Policy Benchmarking service compares your policies against industry leaders, identifying specific enhancements like extended leave duration or job protection guarantees.',
        emerging: 'Our Medical Leave Foundation program provides turnkey policy templates, legal compliance guidance, and manager training for leave administration.',
        developing: 'Urgent: CAC\'s Leave Policy Accelerator builds comprehensive, compliant leave policies in 60 days, including FMLA+ enhancements and accommodation frameworks.'
      }
    },
    2: { 
      focus: 'insurance and financial protection', 
      risk: 'financial toxicity derailing treatment', 
      opportunity: 'comprehensive coverage removing barriers', 
      quickWin: 'employee assistance fund or gap insurance',
      cacPrograms: {
        exemplary: 'Showcase your financial protection programs through CAC\'s Best Practices Library. We can connect you with benefits consultants seeking model programs to replicate.',
        leading: 'Our Benefits Gap Analysis identifies specific coverage enhancements—like cancer-specific riders or out-of-pocket maximums—that would achieve Exemplary status.',
        progressing: 'CAC\'s Financial Protection Assessment evaluates your insurance, disability, and supplemental coverage against cancer-specific needs, with vendor recommendations.',
        emerging: 'Our Financial Wellness for Serious Illness program designs hardship funds, premium assistance, and navigation support to reduce financial barriers to care.',
        developing: 'Critical: CAC\'s Emergency Benefits Review can identify immediate coverage gaps and design interim financial support while longer-term solutions are developed.'
      }
    },
    3: { 
      focus: 'manager preparedness', 
      risk: 'policy-to-practice gaps at the front line', 
      opportunity: 'confident, trained managers', 
      quickWin: 'conversation guide and scenario training',
      cacPrograms: {
        exemplary: 'Your manager training could become a CAC-certified program. We can help scale your approach across business units and document for external recognition.',
        leading: 'Our Advanced Manager Certification adds specialized modules on complex scenarios—recurrence, terminal diagnosis, grief—to achieve comprehensive preparedness.',
        progressing: 'CAC\'s Manager Essentials Training provides 4-hour workshops with role-play scenarios, conversation scripts, and ongoing coaching support.',
        emerging: 'Our Manager Quick-Start Kit includes conversation guides, FAQ documents, and 90-minute awareness training to build baseline confidence.',
        developing: 'Urgent: CAC\'s Manager Emergency Toolkit provides immediate resources—scripts, escalation paths, HR support protocols—while comprehensive training is developed.'
      }
    },
    4: { 
      focus: 'navigation and expert resources', 
      risk: 'underutilized benefits investments', 
      opportunity: 'single-entry-point access', 
      quickWin: 'centralized resource hub or concierge',
      cacPrograms: {
        exemplary: 'Partner with CAC to offer your navigation model as a benchmark for other organizations. We can facilitate knowledge-sharing with Index participants.',
        leading: 'Our Navigation Enhancement service adds specialized resources—clinical trial matching, second opinion coordination—to achieve comprehensive support.',
        progressing: 'CAC\'s Resource Hub Design creates a centralized portal mapping all your benefits, vendors, and support resources with clear access pathways.',
        emerging: 'Our Navigation Foundation program implements a single point of contact model with trained navigators who connect employees to appropriate resources.',
        developing: 'Critical: CAC\'s Navigation Quick-Start creates an immediate resource guide and trained HR liaison while comprehensive navigation is built.'
      }
    },
    5: { 
      focus: 'workplace accommodations', 
      risk: 'preventable turnover during treatment', 
      opportunity: 'flexibility that retains talent', 
      quickWin: 'remote work and schedule flexibility policies',
      cacPrograms: {
        exemplary: 'Document your accommodation practices for CAC\'s Accommodation Best Practices guide. We can facilitate sessions sharing your interactive process approach.',
        leading: 'Our Accommodation Excellence program addresses edge cases—cognitive impacts, fatigue management, role modifications—for comprehensive flexibility.',
        progressing: 'CAC\'s Accommodation Framework Training teaches HR and managers the interactive process, with templates for common cancer-related accommodations.',
        emerging: 'Our Flexibility Foundation program designs remote work, schedule modification, and workload adjustment policies specific to treatment needs.',
        developing: 'Urgent: CAC\'s Accommodation Emergency Protocol creates immediate flexibility options while comprehensive policies are developed.'
      }
    },
    6: { 
      focus: 'culture and psychological safety', 
      risk: 'hidden struggles until crisis point', 
      opportunity: 'early disclosure and intervention', 
      quickWin: 'leadership storytelling and visible commitment',
      cacPrograms: {
        exemplary: 'Your culture of openness is a model for others. CAC can help document and share your approach through speaking opportunities and case studies.',
        leading: 'Our Culture Enhancement workshop addresses subtle barriers to disclosure, including peer support networks and ally training programs.',
        progressing: 'CAC\'s Psychological Safety Assessment identifies disclosure barriers through confidential surveys and focus groups, with targeted interventions.',
        emerging: 'Our Culture Foundation program implements leadership visibility, storytelling campaigns, and anti-stigma training to build trust.',
        developing: 'Critical: CAC\'s Culture Quick-Start includes executive messaging, basic awareness training, and visible support commitments as foundation.'
      }
    },
    7: { 
      focus: 'career continuity', 
      risk: 'losing talent to fear of career damage', 
      opportunity: 'loyalty through protected trajectories', 
      quickWin: 'explicit promotion protection policy',
      cacPrograms: {
        exemplary: 'Your career protection model could inform CAC\'s policy recommendations. We can facilitate peer learning on maintaining career momentum during treatment.',
        leading: 'Our Career Assurance program adds re-entry coaching, skill maintenance support, and explicit promotion pathway protection.',
        progressing: 'CAC\'s Career Continuity Framework designs policies protecting performance reviews, promotion eligibility, and professional development during treatment.',
        emerging: 'Our Career Protection Foundation creates explicit policies ensuring medical leave doesn\'t impact career trajectory, with manager guidance.',
        developing: 'Urgent: CAC\'s Career Safety Net establishes immediate protections against career penalty while comprehensive policies are developed.'
      }
    },
    8: { 
      focus: 'return-to-work support', 
      risk: 'failed transitions after treatment', 
      opportunity: 'sustainable recovery and full productivity', 
      quickWin: 'structured 90-day re-entry protocol',
      cacPrograms: {
        exemplary: 'Your RTW program is a model. CAC can help document your protocols for our Best Practices Library and facilitate peer learning sessions.',
        leading: 'Our RTW Excellence program adds specialized components—cognitive rehabilitation, stamina building, peer mentoring—for comprehensive re-entry.',
        progressing: 'CAC\'s Return-to-Work Protocol Design creates phased re-entry templates, check-in schedules, and adjustment frameworks for sustainable transitions.',
        emerging: 'Our RTW Foundation program implements basic phased return, temporary accommodations, and manager check-in protocols.',
        developing: 'Urgent: CAC\'s RTW Quick-Start provides immediate guidance for current cases while comprehensive protocols are developed.'
      }
    },
    9: { 
      focus: 'executive commitment', 
      risk: 'cancer support seen as HR-only', 
      opportunity: 'business-integrated health strategy', 
      quickWin: 'executive sponsor and visible commitment',
      cacPrograms: {
        exemplary: 'Connect your executives with CAC\'s Leadership Council for peer networking and industry visibility as champions of workplace cancer support.',
        leading: 'Our Executive Engagement program develops board-level metrics, ESG integration, and external recognition strategies.',
        progressing: 'CAC\'s Executive Briefing provides business case development, peer benchmarking data, and talking points for leadership engagement.',
        emerging: 'Our Leadership Foundation program identifies an executive sponsor, develops initial messaging, and creates visibility opportunities.',
        developing: 'Critical: CAC\'s Executive Quick-Brief provides immediate business case and ROI data to secure leadership attention and resources.'
      }
    },
    10: { 
      focus: 'caregiver support', 
      risk: 'losing productive employees who are caregivers', 
      opportunity: 'holistic family support', 
      quickWin: 'caregiver leave and flexible scheduling',
      cacPrograms: {
        exemplary: 'Your caregiver support is a differentiator. CAC can document your approach for our Caregiver Support Guide and connect you with recognition opportunities.',
        leading: 'Our Caregiver Excellence program adds specialized resources—backup care, support groups, navigation—for comprehensive family support.',
        progressing: 'CAC\'s Caregiver Support Framework designs leave policies, flexibility options, and resource connections specific to caregiving needs.',
        emerging: 'Our Caregiver Foundation program creates basic leave provisions, flexible scheduling, and EAP integration for caregiver support.',
        developing: 'Urgent: CAC\'s Caregiver Quick-Start provides immediate flexibility guidelines while comprehensive support programs are developed.'
      }
    },
    11: { 
      focus: 'prevention and wellness', 
      risk: 'late detection and higher costs', 
      opportunity: 'proactive health culture', 
      quickWin: 'on-site screening events and incentives',
      cacPrograms: {
        exemplary: 'Your prevention programs model early detection best practices. CAC can facilitate peer learning on driving screening participation.',
        leading: 'Our Prevention Excellence program adds genetic risk assessment, personalized screening protocols, and survivorship wellness.',
        progressing: 'CAC\'s Prevention Framework designs comprehensive screening campaigns, incentive structures, and awareness programming.',
        emerging: 'Our Wellness Foundation program implements basic cancer awareness, screening promotion, and risk reduction education.',
        developing: 'Critical: CAC\'s Prevention Quick-Start launches immediate screening awareness campaigns while comprehensive programs are built.'
      }
    },
    12: { 
      focus: 'continuous improvement', 
      risk: 'static policies that don\'t evolve', 
      opportunity: 'learning organization', 
      quickWin: 'annual program review and employee feedback',
      cacPrograms: {
        exemplary: 'Your continuous improvement practices could inform CAC\'s assessment methodology. We welcome partnership on evolving best practice standards.',
        leading: 'Our CI Excellence program adds case review protocols, outcome tracking, and systematic policy refinement processes.',
        progressing: 'CAC\'s Continuous Improvement Framework designs feedback mechanisms, annual review cycles, and benchmarking practices.',
        emerging: 'Our CI Foundation program implements basic feedback collection, annual policy review, and metric tracking.',
        developing: 'Critical: CAC\'s CI Quick-Start establishes immediate feedback channels while systematic improvement processes are developed.'
      }
    },
    13: { 
      focus: 'communication and awareness', 
      risk: 'excellent programs nobody knows about', 
      opportunity: 'high utilization rates', 
      quickWin: 'benefits awareness campaign at open enrollment',
      cacPrograms: {
        exemplary: 'Your communication approach drives strong utilization. CAC can document your strategies for our Communications Best Practices guide.',
        leading: 'Our Communication Excellence program adds targeted outreach, utilization tracking, and personalized benefit recommendations.',
        progressing: 'CAC\'s Communication Framework designs multi-channel awareness campaigns, manager talking points, and benefit navigation guides.',
        emerging: 'Our Communication Foundation program creates basic benefit summaries, intranet content, and open enrollment messaging.',
        developing: 'Urgent: CAC\'s Communication Quick-Start launches immediate awareness campaigns for critical benefits while comprehensive strategy develops.'
      }
    },
  };
  
  const ctx = dimContext[dimNum] || { 
    focus: 'this area', 
    risk: 'gaps in support', 
    opportunity: 'improved outcomes', 
    quickWin: 'targeted improvements',
    cacPrograms: { exemplary: '', leading: '', progressing: '', emerging: '', developing: '' }
  };
  
  let insight = '';
  let cacHelp = '';
  
  // Get the appropriate CAC program based on tier
  const tierKey = tierName.toLowerCase() as 'exemplary' | 'leading' | 'progressing' | 'emerging' | 'developing';
  const cacProgram = ctx.cacPrograms[tierKey] || ctx.cacPrograms.progressing;
  
  // Tier-based insight generation with specific data
  if (tierName === 'Exemplary') {
    insight = `Your ${ctx.focus} represents best-in-class performance at ${score} points. ${strengthCount > 0 ? `With ${strengthCount} elements fully implemented, you've` : 'You\'ve'} established a foundation others aspire to. ${isAboveBenchmark && benchmark !== null ? `At ${benchDiff} points above the peer average of ${benchmark}, this demonstrates exceptional commitment to employee support.` : ''} Focus on maintaining this standard and codifying your practices for organizational knowledge transfer.`;
    cacHelp = cacProgram;
  } else if (tierName === 'Leading') {
    insight = `Strong foundation in ${ctx.focus} at ${score} points positions you well. ${isAboveBenchmark && benchmark !== null ? `Scoring ${benchDiff} points above the ${benchmark} benchmark demonstrates genuine commitment.` : benchmark !== null ? `Reaching the ${benchmark} benchmark is within reach.` : ''} ${gapCount > 0 ? `Addressing ${gapCount} remaining gap${gapCount > 1 ? 's' : ''} would move you toward Exemplary status—consider starting with ${ctx.quickWin}.` : 'Minor refinements separate you from Exemplary tier.'}`;
    cacHelp = cacProgram;
  } else if (tierName === 'Progressing') {
    insight = `Solid progress in ${ctx.focus} at ${score} points, with clear room to grow. ${gapCount > 0 ? `${gapCount} improvement opportunit${gapCount > 1 ? 'ies' : 'y'} represent${gapCount === 1 ? 's' : ''} your path forward.` : ''} ${!isAboveBenchmark && benchmark !== null ? `Closing the ${Math.abs(benchDiff)}-point gap to the ${benchmark} peer benchmark should be a near-term priority.` : ''} Quick win to consider: ${ctx.quickWin}.`;
    cacHelp = cacProgram;
  } else if (tierName === 'Emerging') {
    insight = `${ctx.focus.charAt(0).toUpperCase() + ctx.focus.slice(1)} at ${score} points needs attention to avoid ${ctx.risk}. ${gapCount > 0 ? `With ${gapCount} gaps identified, focused investment here could significantly improve employee experience and reduce organizational risk.` : ''} ${!isAboveBenchmark && benchmark !== null ? `The ${Math.abs(benchDiff)}-point gap to the ${benchmark} peer average indicates this is an area where competitors may have an advantage.` : ''} Recommended quick win: ${ctx.quickWin}.`;
    cacHelp = cacProgram;
  } else {
    insight = `Critical gap in ${ctx.focus} at ${score} points creates risk of ${ctx.risk}. ${gapCount > 0 ? `${gapCount} missing elements represent significant exposure.` : ''} ${!isAboveBenchmark && benchmark !== null ? `The ${Math.abs(benchDiff)}-point gap below the ${benchmark} peer average signals this as a priority area.` : ''} Employees facing health challenges may feel unsupported here, leading to disengagement, extended leave, or departure. Immediate action: implement ${ctx.quickWin}.`;
    cacHelp = cacProgram;
  }
  
  return { insight, cacHelp };
}

// Generate benchmark comparison narrative
function getBenchmarkNarrative(score: number, benchmark: number | null, dimName: string): string {
  if (benchmark === null) return '';
  const diff = score - benchmark;
  if (diff > 25) return `Exceptional performance at ${diff} points above the peer average—this represents a genuine organizational strength and commitment to employee wellbeing.`;
  if (diff > 15) return `Well above the ${benchmark} peer average by ${diff} points, indicating mature, established practices that employees likely recognize and value.`;
  if (diff > 5) return `Above benchmark by ${diff} points (peer avg: ${benchmark}), demonstrating strong commitment with opportunities to strengthen further.`;
  if (diff > 0) return `Slightly above the ${benchmark} peer average—a good foundation to build on for differentiation.`;
  if (diff === 0) return `Matching the peer average of ${benchmark}—an opportunity to differentiate through targeted improvements.`;
  if (diff > -10) return `${Math.abs(diff)} points below the ${benchmark} peer benchmark—targeted improvements can close this gap within 6-12 months.`;
  if (diff > -20) return `Notable gap of ${Math.abs(diff)} points below the ${benchmark} peer average warrants focused strategic attention.`;
  return `Currently ${Math.abs(diff)} points below the peer average (${benchmark})—this is a priority area where focused improvements will meaningfully strengthen your employee support.`;
}

// Identify meaningful cross-dimension patterns
function getCrossDimensionPatterns(dimAnalysis: any[]): { pattern: string; implication: string; recommendation: string }[] {
  const patterns: { pattern: string; implication: string; recommendation: string }[] = [];
  
  const findDim = (num: number) => dimAnalysis.find(d => d.dim === num);
  const culture = findDim(6);
  const manager = findDim(3);
  const navigation = findDim(4);
  const communication = findDim(13);
  const leave = findDim(1);
  const returnToWork = findDim(8);
  const insurance = findDim(2);
  const executive = findDim(9);
  const continuous = findDim(12);
  const accommodations = findDim(5);
  const career = findDim(7);
  
  // Pattern: Strong culture but weak manager training
  if (culture && manager && culture.score >= 70 && manager.score < 55) {
    patterns.push({
      pattern: `Strong Culture (${culture.score}) paired with lower Manager Preparedness (${manager.score})`,
      implication: 'Employees likely feel safe disclosing health challenges, but managers may lack confidence and tools to respond effectively. This creates risk of inconsistent support experiences.',
      recommendation: 'Prioritize manager training with conversation guides and scenario practice. Your positive culture means managers want to help—give them the skills to do so effectively.'
    });
  }
  
  // Pattern: Good benefits but poor navigation  
  if (insurance && navigation && insurance.score >= 65 && navigation.score < 50) {
    patterns.push({
      pattern: `Strong Insurance Benefits (${insurance.score}) with weaker Navigation (${navigation.score})`,
      implication: 'You\'ve invested in comprehensive benefits, but employees may struggle to find and access them when needed. Benefits utilization is likely below potential, reducing ROI.',
      recommendation: 'Implement a navigation solution—single entry point, benefits concierge, or resource hub. This maximizes return on your existing benefits investment.'
    });
  }
  
  // Pattern: Low communication with strong programs
  if (communication && communication.score < 50) {
    const strongDims = dimAnalysis.filter(d => d.score >= 70 && d.dim !== 13);
    if (strongDims.length >= 2) {
      patterns.push({
        pattern: `${strongDims.length} dimensions at Leading+ level but Communication at only ${communication.score}`,
        implication: `You have strong programs in ${strongDims.slice(0, 2).map(d => d.name).join(' and ')}, but low awareness may be limiting utilization. Employees may not know these resources exist when they need them.`,
        recommendation: 'Launch targeted awareness campaigns highlighting your strongest offerings. This is a quick win—you already have the programs, just need visibility.'
      });
    }
  }
  
  // Pattern: Strong leave but weak return-to-work
  if (leave && returnToWork && leave.score >= 65 && returnToWork.score < 50) {
    patterns.push({
      pattern: `Good Leave Policies (${leave.score}) but weaker Return-to-Work Support (${returnToWork.score})`,
      implication: 'Employees get the time they need for treatment, but may struggle with the transition back. This risks losing the investment made during leave through failed re-entry.',
      recommendation: 'Implement structured return-to-work protocols: phased re-entry schedules, regular check-ins, and temporary accommodation plans. Protect your leave investment.'
    });
  }
  
  // Pattern: Accommodations strong but career weak
  if (accommodations && career && accommodations.score >= 65 && career.score < 50) {
    patterns.push({
      pattern: `Good Accommodations (${accommodations.score}) but lower Career Continuity (${career.score})`,
      implication: 'Employees can adjust their work during treatment, but may fear long-term career impact. This can lead to hidden diagnoses or premature departures despite good day-to-day support.',
      recommendation: 'Add explicit career protection policies—promotion eligibility during medical leave, transparent communication about performance expectations, and success stories of career progression post-diagnosis.'
    });
  }
  
  // Pattern: Low executive commitment with other gaps
  if (executive && executive.score < 45) {
    const avgOtherScore = dimAnalysis.filter(d => d.dim !== 9).reduce((sum, d) => sum + d.score, 0) / 12;
    if (avgOtherScore < 65) {
      patterns.push({
        pattern: `Low Executive Commitment (${executive.score}) correlating with program gaps`,
        implication: 'Without visible leadership engagement, cancer support operates as an isolated HR initiative rather than organizational priority. This limits resources and cross-functional coordination.',
        recommendation: 'Build the executive business case connecting cancer support to retention metrics, productivity data, and employer brand. Identify an executive sponsor to champion the program.'
      });
    }
  }
  
  // Pattern: Consistently strong performance
  const avgScore = dimAnalysis.reduce((sum, d) => sum + d.score, 0) / dimAnalysis.length;
  const lowestDim = [...dimAnalysis].sort((a, b) => a.score - b.score)[0];
  if (avgScore >= 72 && lowestDim.score >= 50) {
    patterns.push({
      pattern: `Consistently strong performance across dimensions (${Math.round(avgScore)} average)`,
      implication: 'Your comprehensive, balanced approach to cancer support is a genuine organizational differentiator. This positions you well for employer brand recognition and talent attraction.',
      recommendation: `Leverage this strong foundation to build thought leadership in workplace cancer support. Focus refinement on ${lowestDim.name} (${lowestDim.score}) to achieve full excellence across all dimensions.`
    });
  }
  
  // Pattern: High gaps with low continuous improvement
  if (continuous && continuous.score < 45) {
    const totalGaps = dimAnalysis.reduce((sum, d) => sum + d.gaps.length, 0);
    if (totalGaps > 25) {
      patterns.push({
        pattern: `${totalGaps} total gaps with limited Continuous Improvement infrastructure (${continuous.score})`,
        implication: 'Significant improvement opportunities exist, but without systematic review processes, progress may be slow and lessons from individual cases are lost.',
        recommendation: 'Establish quarterly program reviews, employee feedback mechanisms, and case documentation practices. This creates the infrastructure to drive and sustain improvements.'
      });
    }
  }
  
  return patterns.slice(0, 3); // Return top 3 most relevant
}

// Calculate impact-ranked improvement priorities
function getImpactRankings(dimAnalysis: any[], compositeScore: number): { dimName: string; dimNum: number; currentScore: number; tier: string; potentialGain: number; effort: string; recommendation: string; recommendations: string[]; topGap: string }[] {
  return dimAnalysis
    .map(d => {
      // Calculate potential composite score impact
      const improvementPotential = Math.min(100 - d.score, 20); // Max 20 point improvement realistic
      const weightedImpact = (improvementPotential * d.weight) / 100 * 0.9; // 90% dimension weight factor
      const potentialGain = Math.round(weightedImpact * 10) / 10;
      
      // Determine effort based on gap count, current score, and planning items
      let effort = 'Medium';
      let effortScore = 2;
      if (d.gaps.length > 6 || d.score < 35) { effort = 'High'; effortScore = 1; }
      else if (d.gaps.length <= 2 && d.score >= 55) { effort = 'Low'; effortScore = 3; }
      else if (d.planning.length >= 2) { effort = 'Low'; effortScore = 3; } // Already have momentum
      
      // Generate up to 3 specific recommendations based on their data
      const recommendations: string[] = [];
      
      // First recommendation: Planning items (highest priority - already in progress)
      if (d.planning.length > 0) {
        recommendations.push(`Accelerate ${d.planning.length} in-progress initiative${d.planning.length > 1 ? 's' : ''} for quickest impact`);
      }
      
      // Second recommendation: Top gaps to address
      if (d.gaps.length > 0 && d.gaps[0]?.name) {
        recommendations.push(`Implement: ${d.gaps[0].name}`);
        if (d.gaps.length > 1 && d.gaps[1]?.name && recommendations.length < 3) {
          recommendations.push(`Add: ${d.gaps[1].name}`);
        }
      }
      
      // Third recommendation: Assessing items to move forward
      if (d.assessing.length > 0 && recommendations.length < 3) {
        recommendations.push(`Move ${d.assessing.length} item${d.assessing.length > 1 ? 's' : ''} from assessment to planning`);
      }
      
      // Fallback if no other recommendations
      if (recommendations.length === 0) {
        recommendations.push('Optimize and document existing programs');
      }
      
      const topGap = d.gaps[0]?.name || d.needsAttention[0]?.name || 'No specific gaps identified';
      
      return {
        dimName: d.name,
        dimNum: d.dim,
        currentScore: d.score,
        tier: d.tier.name,
        potentialGain,
        effort,
        effortScore,
        recommendation: recommendations[0], // Keep for backward compatibility
        recommendations: recommendations.slice(0, 3), // Up to 3
        topGap
      };
    })
    .sort((a, b) => {
      // Prioritize: high impact + low effort = best ROI
      const aROI = a.potentialGain * a.effortScore;
      const bROI = b.potentialGain * b.effortScore;
      return bROI - aROI;
    })
    .map(({ effortScore, ...rest }) => rest) // Remove effortScore from output
    .slice(0, 5);
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
  const containerRef = useRef<HTMLDivElement>(null);
  const MAX_WEIGHT = 15;
  
  const CHART_WIDTH = 900;
  const CHART_HEIGHT = 420;
  const LABEL_HEIGHT = 24;
  const MARGIN = { top: LABEL_HEIGHT + 10, right: 20, bottom: LABEL_HEIGHT + 55, left: 60 };
  const PLOT_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const PLOT_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  
  const hoveredData = hoveredDim !== null ? dimensionAnalysis.find(d => d.dim === hoveredDim) : null;
  
  // Calculate bubble positions as percentages for HTML overlay
  const getBubblePosition = (d: any) => {
    const xPercent = (MARGIN.left + (d.score / 100) * PLOT_WIDTH) / CHART_WIDTH * 100;
    const yPercent = (MARGIN.top + (PLOT_HEIGHT - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_HEIGHT))) / CHART_HEIGHT * 100;
    return { xPercent, yPercent };
  };
  
  // Calculate tooltip position based on bubble location
  const getTooltipStyle = () => {
    if (!hoveredData) return { top: '8px', right: '8px', opacity: 0 };
    
    const { xPercent, yPercent } = getBubblePosition(hoveredData);
    const tooltipWidth = 224;
    const tooltipHeight = 160;
    
    const isRightEdge = xPercent > 65;
    const isLeftEdge = xPercent < 25;
    const isTopEdge = yPercent < 35;
    const isBottomEdge = yPercent > 65;
    
    let top: string;
    let left: string;
    
    if (isRightEdge) {
      left = `calc(${xPercent}% - ${tooltipWidth + 50}px)`;
    } else {
      left = `calc(${xPercent}% + 30px)`;
    }
    
    if (isTopEdge) {
      top = `calc(${yPercent}% + 30px)`;
    } else if (isBottomEdge) {
      top = `calc(${yPercent}% - ${tooltipHeight + 30}px)`;
    } else {
      top = `calc(${yPercent}% - ${tooltipHeight/2}px)`;
    }
    
    return { top, left, right: 'auto', opacity: 1 };
  };
  
  return (
    <div className="px-4 py-4">
      <div ref={containerRef} className="relative w-full" style={{ height: '580px' }}>
        {/* SVG Chart - visual only, no interactivity */}
        <svg className="w-full" style={{ height: '490px' }} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15"/>
            </filter>
          </defs>
          
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {/* TOP LABEL BARS */}
            <rect x={0} y={-LABEL_HEIGHT - 4} width={PLOT_WIDTH/2 - 2} height={LABEL_HEIGHT} rx="4" fill="#FEE2E2" />
            <text x={PLOT_WIDTH/4} y={-LABEL_HEIGHT/2 - 4 + 1} textAnchor="middle" dominantBaseline="middle" fill="#991B1B" fontSize="10" fontWeight="600" fontFamily="system-ui">PRIORITY GAPS</text>
            
            <rect x={PLOT_WIDTH/2 + 2} y={-LABEL_HEIGHT - 4} width={PLOT_WIDTH/2 - 2} height={LABEL_HEIGHT} rx="4" fill="#D1FAE5" />
            <text x={PLOT_WIDTH * 3/4} y={-LABEL_HEIGHT/2 - 4 + 1} textAnchor="middle" dominantBaseline="middle" fill="#065F46" fontSize="10" fontWeight="600" fontFamily="system-ui">CORE STRENGTHS</text>
            
            {/* Quadrant backgrounds */}
            <rect x={0} y={0} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            <rect x={PLOT_WIDTH/2} y={0} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            <rect x={0} y={PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            <rect x={PLOT_WIDTH/2} y={PLOT_HEIGHT/2} width={PLOT_WIDTH/2} height={PLOT_HEIGHT/2} fill="#FEFEFE" />
            
            {/* Grid lines */}
            <line x1={0} y1={PLOT_HEIGHT/2} x2={PLOT_WIDTH} y2={PLOT_HEIGHT/2} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={PLOT_WIDTH/2} y1={0} x2={PLOT_WIDTH/2} y2={PLOT_HEIGHT} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Border */}
            <rect x={0} y={0} width={PLOT_WIDTH} height={PLOT_HEIGHT} fill="none" stroke="#D1D5DB" strokeWidth="1" />
            
            {/* BOTTOM LABEL BARS */}
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
            
            {/* Data points - visual only */}
            {dimensionAnalysis.map((d) => {
              const xPos = (d.score / 100) * PLOT_WIDTH;
              const yPos = PLOT_HEIGHT - ((Math.min(d.weight, MAX_WEIGHT) / MAX_WEIGHT) * PLOT_HEIGHT);
              const isHovered = hoveredDim === d.dim;
              
              return (
                <g key={d.dim} transform={`translate(${xPos}, ${yPos})`}>
                  <circle r={isHovered ? 22 : 18} fill="white" filter="url(#dropShadow)" style={{ transition: 'all 0.15s ease' }} />
                  <circle r={isHovered ? 18 : 15} fill={getScoreColor(d.score)} style={{ transition: 'all 0.15s ease' }} />
                  <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">
                    D{d.dim}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        
        {/* HTML Overlay for hover detection - positioned over SVG */}
        <div className="absolute inset-0" style={{ height: '490px' }}>
          {dimensionAnalysis.map((d) => {
            const { xPercent, yPercent } = getBubblePosition(d);
            return (
              <div
                key={d.dim}
                className="absolute rounded-full cursor-pointer"
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  width: '44px',
                  height: '44px',
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseEnter={() => setHoveredDim(d.dim)}
                onMouseLeave={() => setHoveredDim(null)}
              />
            );
          })}
        </div>
        
        {/* Tooltip */}
        {hoveredData && (
          <div 
            className="absolute bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-56 z-30 pointer-events-none transition-opacity duration-150"
            style={getTooltipStyle()}
          >
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
        
        {/* Legend */}
        <div className="mt-3 pt-4 border-t border-slate-200 px-2">
          <div className="flex justify-center gap-x-3 gap-y-1">
            {/* First row: dimensions 1-7 */}
            {[...dimensionAnalysis].filter(d => d.dim <= 7).sort((a, b) => a.dim - b.dim).map(d => (
              <div 
                key={d.dim} 
                className={`flex items-center gap-1 px-1.5 py-1 rounded transition-all cursor-pointer ${hoveredDim === d.dim ? 'bg-slate-200 ring-1 ring-slate-400' : 'hover:bg-slate-100'}`}
                onMouseEnter={() => setHoveredDim(d.dim)}
                onMouseLeave={() => setHoveredDim(null)}
              >
                <span className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: getScoreColor(d.score) }}>
                  {d.dim}
                </span>
                <span className="text-[11px] text-slate-700 font-medium whitespace-nowrap">{DIMENSION_SHORT_NAMES[d.dim]}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-x-3 gap-y-1 mt-1">
            {/* Second row: dimensions 8-13 */}
            {[...dimensionAnalysis].filter(d => d.dim > 7).sort((a, b) => a.dim - b.dim).map(d => (
              <div 
                key={d.dim} 
                className={`flex items-center gap-1 px-1.5 py-1 rounded transition-all cursor-pointer ${hoveredDim === d.dim ? 'bg-slate-200 ring-1 ring-slate-400' : 'hover:bg-slate-100'}`}
                onMouseEnter={() => setHoveredDim(d.dim)}
                onMouseLeave={() => setHoveredDim(null)}
              >
                <span className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: getScoreColor(d.score) }}>
                  {d.dim}
                </span>
                <span className="text-[11px] text-slate-700 font-medium whitespace-nowrap">{DIMENSION_SHORT_NAMES[d.dim]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DIMENSION DRILL DOWN COMPONENT
// ============================================

interface DrillDownProps {
  dimensionAnalysis: any[];
  selectedDim: number | null;
  setSelectedDim: (dim: number | null) => void;
  elementBenchmarks: Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>>;
  getScoreColor: (score: number) => string;
  benchmarkCompanyCount: number;
  customObservations?: Record<string, string>;
  setCustomObservations?: (obs: Record<string, string>) => void;
  isEditing?: boolean;
}

function DimensionDrillDown({ dimensionAnalysis, selectedDim, setSelectedDim, elementBenchmarks, getScoreColor, benchmarkCompanyCount, customObservations = {}, setCustomObservations, isEditing = false }: DrillDownProps) {
  const sortedDims = [...dimensionAnalysis].sort((a, b) => a.dim - b.dim);
  const selectedData = selectedDim ? sortedDims.find(d => d.dim === selectedDim) : null;
  const elemBench = selectedDim ? elementBenchmarks[selectedDim] || {} : {};

  const STATUS = {
    currently: { bg: '#10B981', light: '#ECFDF5', text: '#065F46', label: 'Offering' },
    planning: { bg: '#3B82F6', light: '#EFF6FF', text: '#1E40AF', label: 'Planning' },
    assessing: { bg: '#F59E0B', light: '#FFFBEB', text: '#92400E', label: 'Assessing' },
    notAble: { bg: '#EF4444', light: '#FEF2F2', text: '#991B1B', label: 'Not Able' }
  };

  const getStatusInfo = (elem: any) => {
    if (elem.isStrength) return { key: 'currently', ...STATUS.currently };
    if (elem.isPlanning) return { key: 'planning', ...STATUS.planning };
    if (elem.isAssessing) return { key: 'assessing', ...STATUS.assessing };
    return { key: 'notAble', ...STATUS.notAble };
  };

  const getDefaultObservation = (elem: any, bench: any) => {
    const total = bench.total || 1;
    const pctCurrently = Math.round((bench.currently / total) * 100);
    const pctPlanning = Math.round((bench.planning / total) * 100);
    const pctAssessing = Math.round((bench.assessing / total) * 100);
    const statusInfo = getStatusInfo(elem);
    
    // Varied phrasing based on status - avoids repetitive "X% further along"
    if (statusInfo.key === 'currently') {
      // Rotate between phrasings for strengths
      if (pctCurrently < 30) return `Differentiator: Only ${pctCurrently}% of peers offer this`;
      if (pctCurrently < 50) return `You're ahead of ${100 - pctCurrently}% of benchmark companies here`;
      if (pctCurrently < 70) return `Solid: ${pctCurrently}% of peers also offer this`;
      return `Table stakes: ${pctCurrently}% of peers offer this`;
    }
    if (statusInfo.key === 'planning') {
      // In planning cohort
      if (pctCurrently > 50) return `${pctCurrently}% already offer; completing this closes a competitive gap`;
      return `You're among the ${pctPlanning}% in planning; ${pctCurrently}% already offer`;
    }
    if (statusInfo.key === 'assessing') {
      // Assessing feasibility
      const aheadPct = pctCurrently + pctPlanning;
      if (aheadPct > 60) return `Decision point: ${aheadPct}% are further along (${pctCurrently}% offer, ${pctPlanning}% planning)`;
      return `Common inflection point: ${pctAssessing}% also assessing; ${pctCurrently}% already offer`;
    }
    // Gap / Not able
    const exploringPct = pctCurrently + pctPlanning + pctAssessing;
    if (pctCurrently > 50) return `Competitive gap: ${pctCurrently}% of peers offer this`;
    if (exploringPct > 60) return `${exploringPct}% are at least exploring this (${pctCurrently}% offer)`;
    return `Emerging area: ${pctCurrently}% currently offer`;
  };

  return (
    <div className="ppt-break mb-8 pdf-no-break">
      {/* Section Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Dimension Deep Dive</h3>
        <p className="text-slate-500 mt-1">Click any dimension to explore element-level details and benchmark comparisons</p>
      </div>
      
      {/* Dimension Rows - Clean Horizontal Layout */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        {sortedDims.map((d, idx) => {
          const isSelected = selectedDim === d.dim;
          const diff = d.benchmark !== null ? d.score - d.benchmark : null;
          const isLast = idx === sortedDims.length - 1;
          
          return (
            <div key={d.dim}>
              <button
                onClick={() => setSelectedDim(isSelected ? null : d.dim)}
                className={`w-full text-left transition-all duration-200 ${
                  isSelected 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-white hover:bg-slate-50'
                } ${!isLast && !isSelected ? 'border-b border-slate-100' : ''}`}
              >
                <div className="flex items-center px-6 py-4">
                  {/* Dimension Number Badge */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: isSelected ? '#6366F1' : d.tier.color }}
                  >
                    {d.dim}
                  </div>
                  
                  {/* Full Dimension Name */}
                  <div className="ml-4 flex-1 min-w-0">
                    <p className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {d.name}
                    </p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      Weight: {d.weight}%
                    </p>
                  </div>
                  
                  {/* Score Bar */}
                  <div className="w-48 mx-6 hidden md:block">
                    <div className={`h-2 rounded-full overflow-hidden ${isSelected ? 'bg-slate-600' : 'bg-slate-100'}`}>
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${d.score}%`, 
                          backgroundColor: isSelected ? '#A5B4FC' : d.tier.color 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="text-right w-16 shrink-0">
                    <p className={`text-2xl font-bold ${isSelected ? 'text-white' : ''}`} style={{ color: isSelected ? undefined : getScoreColor(d.score) }}>
                      {d.score}
                    </p>
                  </div>
                  
                  {/* Benchmark Diff */}
                  <div className="w-16 text-center shrink-0">
                    {diff !== null && (
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${
                        isSelected 
                          ? (diff > 0 ? 'text-emerald-300' : diff < 0 ? 'text-red-300' : 'text-slate-400')
                          : (diff > 0 ? 'text-emerald-600 bg-emerald-50' : diff < 0 ? 'text-red-500 bg-red-50' : 'text-slate-500 bg-slate-50')
                      }`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </div>
                  
                  {/* Tier Badge */}
                  <div className="w-24 text-center shrink-0">
                    <span 
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : ''
                      }`}
                      style={isSelected ? {} : { backgroundColor: `${d.tier.color}15`, color: d.tier.color }}
                    >
                      {d.tier.name}
                    </span>
                  </div>
                  
                  {/* Expand Icon */}
                  <div className={`w-8 shrink-0 flex justify-center transition-transform duration-200 ${isSelected ? 'rotate-180' : ''}`}>
                    <svg className={`w-5 h-5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>
              
              {/* Expanded Element Details - Inline */}
              {isSelected && selectedData && (
                <div className="bg-slate-50 border-t border-slate-200">
                  <div className="px-6 py-5">
                    {/* Quick Stats */}
                    <div className="flex items-center gap-6 mb-5 text-sm">
                      <span className="text-slate-600">
                        <strong className="text-emerald-600">{selectedData.strengths.length}</strong> currently offering
                      </span>
                      <span className="text-slate-600">
                        <strong className="text-blue-600">{selectedData.planningItems?.length || 0}</strong> in planning
                      </span>
                      <span className="text-slate-600">
                        <strong className="text-amber-600">{selectedData.assessingItems?.length || 0}</strong> assessing
                      </span>
                      <span className="text-slate-600">
                        <strong className="text-red-500">{selectedData.needsAttention.length}</strong> gaps
                      </span>
                    </div>
                    
                    {/* Element Table */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          {/* Two-row header for clarity */}
                          <tr className="bg-slate-100 border-b border-slate-200">
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider align-bottom">Element</th>
                            <th rowSpan={2} className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-28 align-bottom bg-slate-200 border-l-2 border-r-2 border-slate-300">Your Status</th>
                            <th colSpan={4} className="px-4 py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-300 bg-slate-50">Benchmark Distribution</th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider align-bottom">Insight</th>
                          </tr>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider w-24 border-l border-slate-200" style={{ color: STATUS.currently.bg }}>Offering</th>
                            <th className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider w-24" style={{ color: STATUS.planning.bg }}>Planning</th>
                            <th className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider w-24" style={{ color: STATUS.assessing.bg }}>Assessing</th>
                            <th className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider w-24" style={{ color: STATUS.notAble.bg }}>Not Able</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedData.elements.map((elem: any, idx: number) => {
                            const bench = elemBench[elem.name] || { currently: 0, planning: 0, assessing: 0, notAble: 0, total: 1 };
                            const total = bench.total || 1;
                            const statusInfo = getStatusInfo(elem);
                            const obsKey = `${selectedDim}-${idx}`;
                            const defaultObs = getDefaultObservation(elem, bench);
                            
                            return (
                              <tr key={idx} className={idx < selectedData.elements.length - 1 ? 'border-b border-slate-100' : ''}>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-slate-700">{elem.name}</span>
                                </td>
                                <td className="px-4 py-3 text-center bg-slate-50 border-l-2 border-r-2 border-slate-200">
                                  <span 
                                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                                    style={{ backgroundColor: statusInfo.light, color: statusInfo.text }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusInfo.bg }} />
                                    {statusInfo.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center border-l border-slate-100">
                                  <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                    statusInfo.key === 'currently' ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-slate-50'
                                  }`} style={{ color: STATUS.currently.bg }}>
                                    {Math.round((bench.currently / total) * 100)}%
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                    statusInfo.key === 'planning' ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-slate-50'
                                  }`} style={{ color: STATUS.planning.bg }}>
                                    {Math.round((bench.planning / total) * 100)}%
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                    statusInfo.key === 'assessing' ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-slate-50'
                                  }`} style={{ color: STATUS.assessing.bg }}>
                                    {Math.round((bench.assessing / total) * 100)}%
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className={`inline-flex items-center justify-center w-14 h-8 rounded-lg text-sm font-bold ${
                                    statusInfo.key === 'notAble' ? 'bg-red-100 ring-2 ring-red-500' : 'bg-slate-50'
                                  }`} style={{ color: STATUS.notAble.bg }}>
                                    {Math.round((bench.notAble / total) * 100)}%
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={customObservations[obsKey] ?? defaultObs}
                                      onChange={(e) => setCustomObservations?.({ ...customObservations, [obsKey]: e.target.value })}
                                      className="w-full text-xs text-slate-600 bg-amber-50 border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                    />
                                  ) : (
                                    <span className="text-xs text-slate-500">{customObservations[obsKey] || defaultObs}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Benchmark note */}
                    <p className="text-xs text-slate-400 mt-3 text-right">
                      Benchmark based on all participating companies
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================

export default function InteractiveReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const exportMode = searchParams?.get('export') === '1';
  const mode = (searchParams?.get('mode') || '').toLowerCase();
  const orientation = searchParams?.get('orientation') || 'portrait';
  const isLandscape = orientation === 'landscape';
  const isPdf = exportMode && mode === 'pdf';
  const isPpt = exportMode && (mode === 'ppt' || mode === 'pptslides');
  const isPptReport = exportMode && mode === 'pptreport';
  const isLandscapePdf = exportMode && mode === 'landscapepdf';

  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const printRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  
  // Password protection state
  const [authenticated, setAuthenticated] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(true);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [companyScores, setCompanyScores] = useState<any>(null);
  const [elementDetails, setElementDetails] = useState<any>(null);
  const [percentileRank, setPercentileRank] = useState<number | null>(null);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);
  
  // Edit Mode State
  const editMode = false; // Interactive mode - no editing
  const [customInsights, setCustomInsights] = useState<Record<number, { insight: string; cacHelp: string }>>({});
  const [customExecutiveSummary, setCustomExecutiveSummary] = useState<string>('');
  const [customPatterns, setCustomPatterns] = useState<{ pattern: string; implication: string; recommendation: string }[]>([]);
  const [customRecommendations, setCustomRecommendations] = useState<Record<number, string>>({}); // dimNum -> custom recommendation
  const [customCrossRecommendations, setCustomCrossRecommendations] = useState<Record<number, string>>({}); // pattern index -> custom recommendation
  const [customRoadmap, setCustomRoadmap] = useState<{
    phase1?: { items: string[]; useCustom: boolean };
    phase2?: { items: string[]; useCustom: boolean };
    phase3?: { items: string[]; useCustom: boolean };
  }>({});
  const [customCacHelp, setCustomCacHelp] = useState<{
    item1?: { title: string; bullets: string[] };
    item2?: { title: string; bullets: string[] };
    item3?: { title: string; bullets: string[] };
    item4?: { title: string; bullets: string[] };
  }>({});
  const [customRoadmapTimeframes, setCustomRoadmapTimeframes] = useState<{
    phase1?: string;
    phase2?: string;
    phase3?: string;
  }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [selectedDrillDownDim, setSelectedDrillDownDim] = useState<number | null>(null);
  const [elementBenchmarks, setElementBenchmarks] = useState<Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>>>({});
  const [customObservations, setCustomObservations] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  
  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };
  
  // Helper to update custom insight for a dimension
  const updateCustomInsight = (dimNum: number, field: 'insight' | 'cacHelp', value: string) => {
    setCustomInsights(prev => ({
      ...prev,
      [dimNum]: {
        ...prev[dimNum],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  // Helper to update custom recommendation for a dimension
  const updateCustomRecommendation = (dimNum: number, value: string) => {
    setCustomRecommendations(prev => ({
      ...prev,
      [dimNum]: value
    }));
    setHasUnsavedChanges(true);
  };
  
  // Helper to update custom cross-dimension recommendation
  const updateCustomCrossRecommendation = (patternIdx: number, value: string) => {
    setCustomCrossRecommendations(prev => ({
      ...prev,
      [patternIdx]: value
    }));
    setHasUnsavedChanges(true);
  };
  
  // Helper to update custom roadmap phase
  const updateCustomRoadmap = (phase: 'phase1' | 'phase2' | 'phase3', items: string[], useCustom: boolean) => {
    setCustomRoadmap(prev => ({
      ...prev,
      [phase]: { items, useCustom }
    }));
    setHasUnsavedChanges(true);
  };
  
  // Get effective insight (custom or generated)
  const getEffectiveInsight = (dimNum: number, generatedInsight: { insight: string; cacHelp: string }) => {
    const custom = customInsights[dimNum];
    return {
      insight: custom?.insight || generatedInsight.insight,
      cacHelp: custom?.cacHelp || generatedInsight.cacHelp
    };
  };
  
  // Save edits to database
  const saveEdits = async () => {
    if (!company?.id) return;
    setSavingEdits(true);
    try {
      const { error } = await supabase
        .from('assessments')
        .update({
          report_customizations: JSON.stringify({
            customInsights,
            customExecutiveSummary,
            customPatterns,
            customRecommendations,
            customCrossRecommendations,
            customRoadmap,
            customCacHelp,
            customRoadmapTimeframes,
            lastEditedAt: new Date().toISOString()
          })
        })
        .eq('id', company.id);
      
      if (error) throw error;
      setHasUnsavedChanges(false);
      showToast('Customizations saved successfully!', 'success');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save customizations', 'error');
    } finally {
      setSavingEdits(false);
    }
  };
  
  // Reset edits to generated defaults
  const resetEdits = () => {
    if (confirm('Reset all customizations to auto-generated content?')) {
      setCustomInsights({});
      setCustomExecutiveSummary('');
      setCustomPatterns([]);
      setCustomRecommendations({});
      setCustomCrossRecommendations({});
      setCustomRoadmap({});
      setHasUnsavedChanges(true);
    }
  };
  
  // Load saved customizations when company loads
  useEffect(() => {
    if (company?.report_customizations) {
      try {
        const saved = typeof company.report_customizations === 'string' 
          ? JSON.parse(company.report_customizations)
          : company.report_customizations;
        if (saved.customInsights) setCustomInsights(saved.customInsights);
        if (saved.customExecutiveSummary) setCustomExecutiveSummary(saved.customExecutiveSummary);
        if (saved.customPatterns) setCustomPatterns(saved.customPatterns);
        if (saved.customRecommendations) setCustomRecommendations(saved.customRecommendations);
        if (saved.customCrossRecommendations) setCustomCrossRecommendations(saved.customCrossRecommendations);
        if (saved.customRoadmap) setCustomRoadmap(saved.customRoadmap);
        if (saved.customCacHelp) setCustomCacHelp(saved.customCacHelp);
        if (saved.customRoadmapTimeframes) setCustomRoadmapTimeframes(saved.customRoadmapTimeframes);
      } catch (e) {
        console.error('Error loading customizations:', e);
      }
    }
  }, [company]);

  useEffect(() => {
    // CRITICAL: Reset ALL state when token changes
    setLoading(true);
    setError(null);
    setCompany(null);
    setBenchmarks(null);
    setCompanyScores(null);
    setElementDetails(null);
    setPercentileRank(null);
    setTotalCompanies(0);
    setAuthenticated(false);
    
    async function loadData() {
      try {
        if (!token) {
          setError('Invalid report link');
          setLoading(false);
          return;
        }
        
        // Step 1: Check if token exists and get metadata (NO password returned)
        const response = await fetch(`/.netlify/functions/get-assessment-by-token?token=${encodeURIComponent(token)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error fetching assessment:', response.status, errorData);
          setError(errorData.error || 'Report not found or link has expired');
          setLoading(false);
          return;
        }
        
        const metadata = await response.json();
        
        if (!metadata.found) {
          setError('Report not found or link has expired');
          setLoading(false);
          return;
        }
        
        // Store minimal metadata for password screen
        setCompany({ 
          company_name: metadata.companyName,
          survey_id: metadata.surveyId,
          passwordRequired: metadata.passwordRequired 
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading report data:', err);
        setError('Failed to load report data');
        setLoading(false);
      }
    }
    
    if (token) loadData();
    else { setError('No report token provided'); setLoading(false); }
  }, [token]);
  
  // Handle password authentication - NOW VERIFIES SERVER-SIDE
  const handleAuthenticate = async () => {
    if (!token || !passwordInput) return;
    
    setPasswordError(null);
    setLoading(true);
    
    try {
      // Step 2: Verify password SERVER-SIDE (password never sent to client)
      const verifyResponse = await fetch('/.netlify/functions/verify-report-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: passwordInput }),
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}));
        if (verifyResponse.status === 401) {
          setPasswordError('Incorrect password');
        } else {
          setPasswordError(errorData.error || 'Verification failed');
        }
        setLoading(false);
        return;
      }
      
      const { assessmentId, surveyId, companyName } = await verifyResponse.json();
      
      // Step 3: Fetch full report data using assessmentId
      const reportResponse = await fetch('/.netlify/functions/get-public-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId, surveyId }),
      });
      
      if (!reportResponse.ok) {
        const errorData = await reportResponse.json().catch(() => ({}));
        setError(errorData.error || 'Failed to load report');
        setLoading(false);
        return;
      }
      
      const reportData = await reportResponse.json();
      
      // Set full company data
      setCompany(reportData.assessment);
      
      // Calculate scores
      const { scores, elements } = calculateCompanyScores(reportData.assessment);
      setCompanyScores(scores);
      setElementDetails(elements);
      
      // Process benchmarks if available
      if (reportData.allAssessments) {
        const benchmarkScores = calculateBenchmarks(reportData.allAssessments);
        setBenchmarks(benchmarkScores);
        
        const elemBenchmarks = calculateElementBenchmarks(reportData.allAssessments);
        setElementBenchmarks(elemBenchmarks);
        
        const completeAssessments = reportData.allAssessments.filter((a: any) => {
          let completedDims = 0;
          for (let dim = 1; dim <= 13; dim++) {
            const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
            if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) completedDims++;
          }
          return completedDims === 13;
        });
        
        const allComposites = completeAssessments.map((a: any) => {
          try { return calculateCompanyScores(a).scores.compositeScore; } catch { return null; }
        }).filter((s: any) => s !== null) as number[];
        
        if (allComposites.length > 0 && scores.compositeScore) {
          const belowCount = allComposites.filter(s => s < scores.compositeScore).length;
          setPercentileRank(Math.round((belowCount / allComposites.length) * 100));
          setTotalCompanies(allComposites.length);
        }
      }
      
      setAuthenticated(true);
      setLoading(false);
      
    } catch (err) {
      console.error('Error during authentication:', err);
      setPasswordError('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

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
        
        // Track if this item is NOT currently offered (anything less than full points)
        const isNotOffered = result.category !== 'currently_offer';
        
        elementsByDim[dim].push({
          name: itemKey, status: getStatusText(status), category: result.category,
          points: result.points ?? 0, maxPoints: 5, isStrength: result.points === 5,
          isPlanning: result.category === 'planning', isAssessing: result.category === 'assessing',
          isGap: result.category === 'not_able' || result.category === 'unknown', 
          isUnsure: result.isUnsure,
          isNotOffered: isNotOffered
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
    
    // Use canonical enhanced-scoring library for composite score to ensure consistency
    // across all pages (scoring page, profile page, report page)
    const enhancedResult = calculateEnhancedScore(assessment);
    const compositeScore = enhancedResult.isComplete ? enhancedResult.compositeScore : null;
    const maturityScore = enhancedResult.maturityScore;
    const breadthScore = enhancedResult.breadthScore;
    
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

  // Calculate element-level benchmark distributions for drill-down
  function calculateElementBenchmarks(assessments: any[]) {
    const complete = assessments.filter(a => {
      let completedDims = 0;
      for (let dim = 1; dim <= 13; dim++) {
        const mainGrid = a[`dimension${dim}_data`]?.[`d${dim}a`];
        if (mainGrid && typeof mainGrid === 'object' && Object.keys(mainGrid).length > 0) completedDims++;
      }
      return completedDims === 13;
    });
    
    if (complete.length === 0) return {};
    
    const elementStats: Record<number, Record<string, { currently: number; planning: number; assessing: number; notAble: number; total: number }>> = {};
    
    for (let dim = 1; dim <= 13; dim++) {
      elementStats[dim] = {};
      
      complete.forEach(assessment => {
        const dimData = assessment[`dimension${dim}_data`];
        const mainGrid = dimData?.[`d${dim}a`];
        
        if (mainGrid && typeof mainGrid === 'object') {
          Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
            if (dim === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) return;
            
            if (!elementStats[dim][itemKey]) {
              elementStats[dim][itemKey] = { currently: 0, planning: 0, assessing: 0, notAble: 0, total: 0 };
            }
            
            const result = statusToPoints(status);
            elementStats[dim][itemKey].total++;
            
            if (result.category === 'currently_offer') elementStats[dim][itemKey].currently++;
            else if (result.category === 'planning') elementStats[dim][itemKey].planning++;
            else if (result.category === 'assessing') elementStats[dim][itemKey].assessing++;
            else elementStats[dim][itemKey].notAble++;
          });
        }
      });
    }
    
    return elementStats;
  }

  // ============================================
  // EXPORT HELPERS
  // ============================================
  async function waitForFonts() {
    if ((document as any).fonts?.ready) {
      await (document as any).fonts.ready;
    }
  }

  async function waitForImages(root: HTMLElement) {
    const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }));
  }


  function handleBack() {
    if (typeof window !== 'undefined') window.history.back();
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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center max-w-md">
          <p className="text-red-600 text-lg mb-2">{error}</p>
          <p className="text-slate-500 text-sm">Report link may be invalid or expired</p>
        </div>
      </div>
    );
  }

  // Password protection screen - show when we have company metadata but not authenticated
  if (!authenticated && company) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)' }}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image 
              src="/BI_LOGO_FINAL.png" 
              alt="BEYOND Insights" 
              width={180} 
              height={60}
              className="object-contain"
            />
          </div>
          
          {/* Lock Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Your 2026 Index Report</h1>
            <p className="text-slate-500 mt-1">Best Companies for Working with Cancer</p>
          </div>
          
          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleAuthenticate(); }}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                  passwordError ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'
                }`}
                placeholder="Enter password"
                autoFocus
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {passwordError}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!passwordInput}
              className="w-full py-3 text-base font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ 
                background: passwordInput ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#e2e8f0',
                color: passwordInput ? '#fff' : '#94a3b8'
              }}
            >
              Access Report
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              Password provided by your organization administrator
            </p>
          </div>
        </div>
      </div>
    );
  }

  // After authentication, check we have the data to render the report
  if (!companyScores || !company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center max-w-md">
          <p className="text-red-600 text-lg mb-2">Unable to load report data</p>
          <p className="text-slate-500 text-sm">Please try refreshing the page</p>
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
        // All items that aren't currently offered (strengths)
        needsAttention: elements.filter((e: any) => !e.isStrength && !e.isPlanning),
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
  
  // Initiatives in progress - sorted: Planning first, then Assessing
  const quickWinOpportunities = dimensionAnalysis
    .flatMap(d => [
      ...d.planning.map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, type: 'Planning', sortOrder: 1 })),
      ...d.assessing.map((item: any) => ({ ...item, dimNum: d.dim, dimName: d.name, type: 'Assessing', sortOrder: 2 }))
    ])
    .sort((a, b) => a.sortOrder - b.sortOrder)
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

  // Order from lowest to highest so .find() returns the immediate next tier up
  const tierThresholds = [{ name: 'Emerging', min: 40 }, { name: 'Progressing', min: 60 }, { name: 'Leading', min: 75 }, { name: 'Exemplary', min: 90 }];
  const nextTierUp = tierThresholds.find(t => t.min > (compositeScore || 0));
  const pointsToNextTier = nextTierUp ? nextTierUp.min - (compositeScore || 0) : null;

  return (
    <div 
      className={`min-h-screen bg-gray-50 ${exportMode ? 'export-mode' : ''} ${isPdf ? 'pdf-export-mode' : ''} ${isPpt ? 'ppt-export-mode' : ''} ${isPptReport ? 'ppt-report-mode' : ''} ${isLandscapePdf ? 'landscape-pdf-mode' : ''} ${isLandscape ? 'landscape-mode' : ''}`}
      style={isLandscape ? { width: '100%', maxWidth: 'none', minWidth: '1200px' } : undefined}
    >
      <style jsx global>{`
        @media print { 
          @page { margin: 0.4in; size: letter; } 
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          } 
          .no-print { display: none !important; } 
          .pdf-break-before { page-break-before: always; break-before: page; }
          .pdf-break-after { page-break-after: always; break-after: page; }
          .pdf-no-break { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important;
          }
          
          /* Force backgrounds to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        
        /* Landscape print mode */
        .landscape-mode {
          --page-width: 11in;
        }
        @media print {
          .landscape-mode {
            @page { size: letter landscape !important; }
          }
        }
        
        /* Browserless PDF capture mode */
        /* PPT report capture mode: render the full report as a 1280px canvas for scrolling screenshots */
        .ppt-report-mode {
          background: #ffffff !important;
        }
        .ppt-report-mode .bg-gray-50 {
          background: #ffffff !important;
        }
        .ppt-report-mode #report-root {
          width: 1280px !important;
          max-width: 1280px !important;
          margin: 0 auto !important;
          padding: 20px !important;
        }

        /* Landscape PDF mode - AGGRESSIVE full width */
        .landscape-mode * {
          max-width: 100% !important;
        }
        .landscape-mode,
        .landscape-mode body,
        .landscape-mode > div,
        .landscape-mode #report-root {
          max-width: none !important;
          width: 100% !important;
          min-width: 1200px !important;
          margin: 0 !important;
        }
        .landscape-mode #report-root {
          padding: 20px 30px !important;
          min-width: 1200px !important;
        }
        .landscape-mode .max-w-6xl,
        .landscape-mode .max-w-4xl,
        .landscape-mode .max-w-3xl,
        .landscape-mode .max-w-2xl,
        .landscape-mode .max-w-xl,
        .landscape-mode [class*="max-w-"] {
          max-width: none !important;
          width: 100% !important;
          min-width: 1100px !important;
        }
        /* Make ALL containers full width */
        .landscape-mode .rounded-lg,
        .landscape-mode .bg-white,
        .landscape-mode .bg-slate-800,
        .landscape-mode .bg-slate-50,
        .landscape-mode .shadow-sm {
          width: 100% !important;
          max-width: none !important;
        }
        /* Expand grids */
        .landscape-mode .grid {
          width: 100% !important;
          gap: 24px !important;
        }
        /* SVG charts - critical for matrix */
        .landscape-mode svg {
          max-width: 100% !important;
          width: 100% !important;
          height: auto !important;
        }
        /* Text should wrap properly */
        .landscape-mode p,
        .landscape-mode span,
        .landscape-mode div {
          white-space: normal !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        /* Fix the callout boxes */
        .landscape-mode .bg-purple-50,
        .landscape-mode .bg-emerald-50,
        .landscape-mode .bg-amber-50,
        .landscape-mode .bg-violet-50 {
          max-width: none !important;
          width: auto !important;
        }
        /* Ensure flex containers expand */
        .landscape-mode .flex {
          width: 100% !important;
        }
        .landscape-mode .mx-auto {
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        .bg-gray-50 {
          background-color: #f9fafb !important;
        }
        
        /* Force all content sections to avoid page breaks */
        .rounded-lg {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Matrix Legend Table - ensure full width and no truncation */
        .matrix-legend-table {
          width: 100% !important;
          table-layout: auto !important;
        }
        .matrix-legend-table td {
          white-space: nowrap !important;
          overflow: visible !important;
          padding: 4px 8px !important;
        }
        .matrix-legend-table span {
          white-space: nowrap !important;
          overflow: visible !important;
        }
        
        /* Export mode specific - ensure table renders correctly */
        .export-mode .matrix-legend-table,
        .pdf-export-mode .matrix-legend-table {
          width: 100% !important;
        }
        .export-mode .matrix-legend-table td,
        .pdf-export-mode .matrix-legend-table td {
          white-space: nowrap !important;
          overflow: visible !important;
        }
        
        /* Export mode: PDF + PPT - fixes scroll containers, stickies, filters */
        .export-mode * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .export-mode .no-print { display: none !important; }
        
        /* Kill sticky/fixed during capture */
        .export-mode .sticky,
        .export-mode [class*="sticky"] {
          position: static !important;
        }
        
        /* Expand scroll containers so html2canvas captures full content */
        .export-mode [class*="overflow-y-auto"],
        .export-mode [class*="overflow-auto"],
        .export-mode [class*="max-h-"] {
          overflow: visible !important;
          max-height: none !important;
        }
        
        /* SVG filters can cause odd clipping/blur */
        .export-mode svg filter { display: none !important; }
        
        /* Fix for html2canvas - it can't parse oklch colors from Tailwind v4 */
        .ppt-slide, .ppt-slide * {
          --tw-bg-opacity: 1 !important;
          --tw-text-opacity: 1 !important;
        }
        .ppt-slides-container * {
          color: inherit;
          background-color: inherit;
        }
        

        /* Hide PPT slide DOM in PDF exports and in pptreport capture */
        .pdf-export-mode .ppt-slides-container,
        .pdf-export-mode .ppt-slide,
        .ppt-report-mode .ppt-slides-container,
        .ppt-report-mode .ppt-slide {
          display: none !important;
        }
        
        /* LANDSCAPE PDF MODE - Shows PPT slides as PDF pages */
        .landscape-pdf-mode {
          background: white !important;
        }
        .landscape-pdf-mode .no-print,
        .landscape-pdf-mode #report-root {
          display: none !important;
          visibility: hidden !important;
        }
        .landscape-pdf-mode .ppt-slides-container {
          display: block !important;
          position: static !important;
          left: auto !important;
          visibility: visible !important;
          width: 100% !important;
        }
        .landscape-pdf-mode .ppt-slide {
          display: block !important;
          position: static !important;
          left: auto !important;
          visibility: visible !important;
          width: 1280px !important;
          height: 720px !important;
          margin: 0 auto !important;
          page-break-after: always !important;
          break-after: page !important;
          box-sizing: border-box !important;
          background: white !important;
        }
        .landscape-pdf-mode .ppt-slide:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        
        /* PPT slide sections - hidden by default, shown for capture */
        .ppt-slide {
          width: 1280px;
          height: 720px;
          background: white;
          padding: 40px;
          box-sizing: border-box;
          position: absolute;
          left: -9999px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .ppt-slide * {
          text-decoration: none !important;
        }
        .ppt-export-mode .ppt-slide {
          position: relative;
          left: 0;
          margin-bottom: 20px;
        }
        .ppt-slides-container {
          position: absolute;
          left: -9999px;
        }
        .ppt-export-mode .ppt-slides-container {
          position: relative;
          left: 0;
        }
      `}</style>

      {/* Welcome Overlay */}
      {showWelcomeOverlay && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-xl p-3">
                  <Image 
                    src="/cancer-careers-logo.png" 
                    alt="Cancer and Careers" 
                    width={120} 
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Welcome to Your 2026 Index Report</h1>
                  <p className="text-slate-300 text-sm mt-1">Best Companies for Working with Cancer</p>
                </div>
              </div>
            </div>
            
            {/* Letter Content */}
            <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
              {/* Thank You Section */}
              <div className="mb-6">
                <p className="text-slate-700 leading-relaxed mb-4">
                  Dear {company?.firmographics_data?.company_name || company?.company_name || 'Partner'},
                </p>
                <p className="text-slate-700 leading-relaxed mb-4">
                  <strong>Thank you</strong> for participating in the 2026 Best Companies for Working with Cancer Index. By completing this assessment, you've demonstrated a genuine commitment to supporting employees managing cancer—and that makes you a pioneer in workplace cancer support.
                </p>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Too often, employees facing a cancer diagnosis feel unseen and unsupported at work. Your willingness to examine your policies, programs, and culture sends a powerful message: <em>you matter, and we're here for you.</em>
                </p>
              </div>

              {/* About Your Report */}
              <div className="bg-slate-50 rounded-xl p-5 mb-6">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  About Your Report
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  This interactive report provides a comprehensive view of your organization's cancer support ecosystem across <strong>13 dimensions</strong>—from leave policies and insurance coverage to manager preparedness and workplace culture.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Each dimension is weighted based on extensive research with HR leaders, employees managing cancer, and general employee populations to ensure the Index reflects what matters most to those directly affected.
                </p>
              </div>

              {/* How to Use */}
              <div className="bg-indigo-50 rounded-xl p-5 mb-6">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  How to Use Your Report
                </h3>
                <ul className="text-slate-600 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">1.</span>
                    <span><strong>Start with the Executive Summary</strong> for your overall score and key findings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">2.</span>
                    <span><strong>Explore the Performance Matrix</strong> to see how you compare across all 13 dimensions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">3.</span>
                    <span><strong>Click any dimension</strong> to drill down into element-level details and benchmarks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">4.</span>
                    <span><strong>Review the Roadmap</strong> for prioritized recommendations based on your results</span>
                  </li>
                </ul>
              </div>

              {/* CAC Partnership */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 mb-6 border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Partner with Cancer and Careers
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed mb-3">
                  Your report is just the beginning. Our consulting team can help you identify which elements to prioritize, develop implementation strategies, and create meaningful change for employees managing cancer.
                </p>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Whether you have questions about your results or want to explore how we can work together, we're here to help. Reach out to us at <a href="mailto:cacbestcompanies@cew.org" className="text-purple-700 font-medium hover:underline">cacbestcompanies@cew.org</a>.
                </p>
              </div>

              {/* Signature */}
              <div className="border-t border-slate-200 pt-5">
                <p className="text-slate-700 leading-relaxed mb-3">
                  With gratitude for your leadership and commitment,
                </p>
                <div className="mb-3">
                  <Image 
                    src="/rebecca-signature.png" 
                    alt="Rebecca V. Nellis signature" 
                    width={180} 
                    height={60}
                    className="object-contain"
                  />
                </div>
                <div className="mb-6">
                  <p className="font-semibold text-slate-800">Rebecca V. Nellis</p>
                  <p className="text-sm text-slate-500">Executive Director, Cancer and Careers</p>
                </div>
              </div>

              {/* View Report Button - at bottom of scrollable content */}
              <button
                onClick={() => setShowWelcomeOverlay(false)}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>View Your Report</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Interactive Header - No edit/export buttons */}
      <div className="no-print bg-gradient-to-r from-slate-800 to-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="bg-white rounded-lg p-2">
              <Image 
                src="/cancer-careers-logo.png" 
                alt="Cancer and Careers" 
                width={100} 
                height={36}
                className="object-contain"
              />
            </div>
            <div className="border-l border-slate-600 pl-5">
              <h1 className="font-semibold text-lg">{company?.firmographics_data?.company_name || company?.company_name || 'Company Report'}</h1>
              <p className="text-slate-400 text-sm">Best Companies for Working with Cancer Index 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400">Overall Score</p>
              <p className="text-3xl font-bold" style={{ color: getScoreColor(compositeScore || 0) }}>
                {compositeScore || 0}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-bold ${tier?.bgColor || 'bg-slate-100'}`} style={{ color: tier?.color }}>
              {tier?.name}
            </span>
          </div>
        </div>
      </div>

      <div 
        ref={printRef} 
        id="report-root" 
        className={`py-10 ${isLandscape ? 'w-full px-8' : 'max-w-6xl mx-auto px-8'}`}
        style={isLandscape ? { width: '100%', maxWidth: 'none', minWidth: '1200px', margin: 0, padding: '20px 30px' } : undefined}
      >
        
        {/* ============ HEADER ============ */}
        <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
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
                <h2 className="text-3xl font-bold text-slate-900 mt-1" data-export="company-name">{companyName}</h2>
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
                  <p className="text-5xl font-bold mt-1" style={{ color: tier?.color || '#666' }} data-export="composite-score">{compositeScore ?? '—'}</p>
                </div>
                {tier && (
                  <div className={`px-5 py-3 rounded-lg ${tier.bgColor} border ${tier.borderColor}`}>
                    <p className="text-lg font-bold" style={{ color: tier.color }} data-export="tier-name">{tier.name}</p>
                    <p className="text-xs text-slate-500">Performance Tier</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="px-10 py-8 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Executive Summary</h3>
            <p className="text-slate-700 leading-relaxed text-lg" data-export="executive-summary-text">
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
            
            {/* Always show tier progress message */}
            {(() => {
              // Get top 3 lowest-scoring dimensions for recommendations
              const topGrowthDims = allDimensionsByScore.slice(0, 3).map(d => d.name);
              const dimList = topGrowthDims.length === 3 
                ? `${topGrowthDims[0]}, ${topGrowthDims[1]}, or ${topGrowthDims[2]}`
                : topGrowthDims.length === 2
                ? `${topGrowthDims[0]} or ${topGrowthDims[1]}`
                : topGrowthDims[0];
              
              return (
                <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-lg flex items-start gap-3">
                  <TrendUpIcon className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    {nextTierUp && pointsToNextTier ? (
                      <>
                        <p className="text-sm font-semibold text-violet-800">
                          {pointsToNextTier} points from {nextTierUp.name} tier
                          {nextTierUp.name !== 'Exemplary' && (
                            <span className="text-violet-600 font-normal"> · {90 - (compositeScore || 0)} points from Exemplary</span>
                          )}
                        </p>
                        <p className="text-xs text-violet-600 mt-1">Targeted improvements in {dimList} could elevate your overall standing.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-violet-800">Exemplary tier achieved</p>
                        <p className="text-xs text-violet-600 mt-1">Continue strengthening {dimList} to maintain your leadership position.</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
            
            <div className="mt-6 grid grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-slate-800" data-export="metric-currently-offering">{currentlyOffering}</p>
                <p className="text-sm text-slate-500 mt-1">of {totalElements} elements offered</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-slate-800" data-export="metric-in-development">{planningItems + assessingItems}</p>
                <p className="text-sm text-slate-500 mt-1">initiatives in development</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-slate-800" data-export="metric-gaps">{gapItems}</p>
                <p className="text-sm text-slate-500 mt-1">identified gaps</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-slate-800" data-export="metric-leading-plus">{tierCounts.exemplary + tierCounts.leading} <span className="text-lg font-normal text-slate-400">of 13 dimensions</span></p>
                <p className="text-sm text-slate-500 mt-1">at Leading+</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ KEY FINDINGS ============ */}
        <div className="ppt-break bg-slate-800 rounded-lg shadow-sm overflow-hidden mb-8 pdf-no-break">
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

        {/* ============ DIMENSION PERFORMANCE - COMPACT FOR PPT ============ */}
        <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
          <div className="px-8 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Dimension Performance Overview</h3>
          </div>
          <div className="px-8 py-5">
            <table className="w-full" id="dimension-performance-table" data-export="dimension-performance-table">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="pb-2.5 text-center w-9">#</th>
                  <th className="pb-2.5 text-left w-64">Dimension</th>
                  <th className="pb-2.5 text-center w-12">Wt%</th>
                  <th className="pb-2.5 text-center">Score</th>
                  <th className="pb-2.5 text-right w-12"></th>
                  <th className="pb-2.5 text-center w-16">Bench</th>
                  <th className="pb-2.5 text-center w-24">Tier</th>
                </tr>
              </thead>
              <tbody>
                {[...dimensionAnalysis].sort((a, b) => b.weight - a.weight).map((d, idx) => {
                  const diff = d.benchmark !== null ? d.score - d.benchmark : 0;
                  return (
                    <tr key={d.dim} className={idx < dimensionAnalysis.length - 1 ? 'border-b border-slate-100' : ''}>
                      <td className="py-2 text-center">
                        <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: getScoreColor(d.score) }}>{d.dim}</span>
                      </td>
                      <td className="py-2 text-left">
                        <span className="text-sm font-medium text-slate-700">{d.name}</span>
                      </td>
                      <td className="py-2 text-center text-xs text-slate-500">{d.weight}%</td>
                      <td className="py-2 px-2">
                        <div className="relative h-4">
                          {d.benchmark !== null && (
                            <div className="absolute" style={{ left: `${Math.min(d.benchmark, 100)}%`, top: '0', transform: 'translateX(-50%)' }}>
                              <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-500" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 top-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${d.score}%`, backgroundColor: getScoreColor(d.score) }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <span className="text-sm font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                      </td>
                      <td className="py-2 text-center">
                        {d.benchmark !== null ? (
                          <span className={`text-xs ${diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{diff >= 0 ? '+' : ''}{diff}</span>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="py-2 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${d.tier.bgColor} ${d.tier.textColor}`}>{d.tier.name}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-4 text-xs text-slate-400">
              <span>Scores out of 100</span>
              <span className="flex items-center gap-1">
                <span className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-500 inline-block"></span>
                Benchmark
              </span>
            </div>
          </div>
        </div>

        {/* ============ STRATEGIC PRIORITY MATRIX ============ */}
        <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 mb-8 pdf-break-before pdf-no-break">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Strategic Priority Matrix</h3>
            <p className="text-sm text-slate-500 mt-1">Dimensions plotted by current performance versus strategic weight. Hover over any dimension for details.</p>
          </div>
          <div ref={matrixRef} id="export-matrix">
            <StrategicPriorityMatrix dimensionAnalysis={dimensionAnalysis} getScoreColor={getScoreColor} />
          </div>
        </div>

        {/* ============ DIMENSION DRILL DOWN ============ */}
        <DimensionDrillDown 
          dimensionAnalysis={dimensionAnalysis}
          selectedDim={selectedDrillDownDim}
          setSelectedDim={setSelectedDrillDownDim}
          elementBenchmarks={elementBenchmarks}
          getScoreColor={getScoreColor}
          benchmarkCompanyCount={benchmarks?.companyCount || 0}
          customObservations={customObservations}
          setCustomObservations={setCustomObservations}
          isEditing={editMode}
        />

        {/* ============ CROSS-DIMENSION INSIGHTS ============ */}
        {(() => {
          const patterns = getCrossDimensionPatterns(dimensionAnalysis);
          if (patterns.length === 0) return null;
          return (
            <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
              <div className="px-10 py-5 bg-indigo-700">
                <h3 className="font-semibold text-white text-lg">Cross-Dimension Insights</h3>
                <p className="text-indigo-200 text-sm">Patterns identified across your assessment that reveal strategic opportunities</p>
              </div>
              <div className="px-10 py-6 space-y-6">
                {patterns.map((p, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                      <p className="font-semibold text-slate-800">{p.pattern}</p>
                    </div>
                    <div className="px-5 py-4 grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">What This Means</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{p.implication}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                          Recommended Action
                          {editMode && <span className="ml-2 text-amber-600 font-normal normal-case">(editable)</span>}
                        </p>
                        {editMode ? (
                          <div className="flex flex-col gap-1">
                            <textarea
                              value={customCrossRecommendations[idx] ?? p.recommendation}
                              onChange={(e) => updateCustomCrossRecommendation(idx, e.target.value)}
                              className="w-full text-sm text-slate-600 leading-relaxed bg-amber-50 border border-amber-300 rounded px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                              placeholder="Enter custom recommendation..."
                            />
                            {customCrossRecommendations[idx] && (
                              <button 
                                onClick={() => updateCustomCrossRecommendation(idx, '')}
                                className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 self-start"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 leading-relaxed">{customCrossRecommendations[idx] || p.recommendation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ============ IMPACT-RANKED PRIORITIES ============ */}
        {(() => {
          const rankings = getImpactRankings(dimensionAnalysis, compositeScore || 0);
          return (
            <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
              <div className="px-10 py-5 bg-cyan-700">
                <h3 className="font-semibold text-white text-lg">Impact-Ranked Improvement Priorities</h3>
                <p className="text-cyan-200 text-sm">Dimensions ranked by potential composite score impact relative to implementation effort</p>
              </div>
              <div className="px-10 py-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="pb-3 text-left w-20">Priority</th>
                      <th className="pb-3 text-left">Dimension</th>
                      <th className="pb-3 text-center w-28">Current</th>
                      <th className="pb-3 text-center w-24">Impact</th>
                      <th className="pb-3 text-center w-24">Effort</th>
                      <th className="pb-3 text-left">
                        Recommended Actions
                        {editMode && <span className="ml-2 text-amber-600 font-normal normal-case">(editable)</span>}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((r, idx) => (
                      <tr key={r.dimNum} className={idx < rankings.length - 1 ? 'border-b border-slate-100' : ''}>
                        <td className="py-4">
                          <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-white text-sm font-bold ${
                            idx === 0 ? 'bg-cyan-600' : idx === 1 ? 'bg-cyan-500' : 'bg-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-4">
                          <p className="font-medium text-slate-800">{r.dimName}</p>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-xl" style={{ color: getScoreColor(r.currentScore) }}>{r.currentScore}</span>
                            <span className="text-xs text-slate-400 mt-0.5">{r.tier}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-semibold text-emerald-600">+{r.potentialGain}</span>
                            <span className="text-xs text-slate-400">pts</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`text-xs font-medium px-3 py-1.5 rounded ${
                            r.effort === 'Low' ? 'bg-emerald-50 text-emerald-700' :
                            r.effort === 'Medium' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>{r.effort}</span>
                        </td>
                        <td className="py-4">
                          {editMode ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                value={customRecommendations[r.dimNum] ?? r.recommendations.join(' • ')}
                                onChange={(e) => updateCustomRecommendation(r.dimNum, e.target.value)}
                                className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                placeholder="Enter custom recommendations..."
                              />
                              {customRecommendations[r.dimNum] && (
                                <button 
                                  onClick={() => updateCustomRecommendation(r.dimNum, '')}
                                  className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 self-start"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Reset
                                </button>
                              )}
                            </div>
                          ) : (
                            <ul className="text-sm text-slate-600 space-y-1">
                              {(customRecommendations[r.dimNum] ? customRecommendations[r.dimNum].split(' • ') : r.recommendations).map((rec: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-cyan-600 mt-0.5">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-slate-400 mt-4 italic">Impact calculated based on dimension weight and improvement potential. Effort assessed based on current gaps and in-progress initiatives.</p>
              </div>
            </div>
          );
        })()}

        {/* ============ AREAS OF EXCELLENCE ============ */}
        <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
          <div className="px-10 py-5 bg-emerald-700">
            <h3 className="font-semibold text-white text-lg">Areas of Excellence</h3>
            <p className="text-emerald-200 text-sm">{strengthDimensions.length} dimensions at Leading or above</p>
          </div>
          <div className="px-10 py-6">
            {strengthDimensions.length > 0 ? (
              <div className="grid grid-cols-2 gap-6">
                {strengthDimensions.slice(0, 6).map((d) => (
                  <div key={d.dim} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-slate-800">{d.name}</p>
                      <span className="text-lg font-bold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {d.strengths.slice(0, 3).map((e: any, i: number) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{e.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">Focus on building foundational capabilities to reach Leading tier.</p>
              </div>
            )}
          </div>
        </div>

        {/* ============ GROWTH OPPORTUNITIES ============ */}
        <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
          <div className="px-10 py-5 bg-amber-600">
            <h3 className="font-semibold text-white text-lg">Growth Opportunities</h3>
            <p className="text-amber-100 text-sm">Dimensions with improvement potential</p>
          </div>
          <div className="px-10 py-6">
            <div className="grid grid-cols-2 gap-6">
              {allDimensionsByScore.slice(0, 6).map((d) => (
                <div key={d.dim} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-slate-800">{d.name}</p>
                    <span className="text-lg font-bold" style={{ color: getScoreColor(d.score) }}>{d.score}</span>
                  </div>
                  {d.needsAttention.length > 0 ? (
                    <ul className="space-y-1.5">
                      {d.needsAttention.slice(0, 3).map((e: any, i: number) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${e.isGap ? 'bg-red-400' : e.isUnsure ? 'bg-slate-400' : 'bg-amber-400'}`}></span>
                          <span>{e.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Focus on completing planned initiatives</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ============ INITIATIVES IN PROGRESS ============ */}
        {quickWinOpportunities.length > 0 && (
          <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
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

        {/* ============ STRATEGIC RECOMMENDATIONS - TRANSITION SLIDE ============ */}
        <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-break-before" id="appendix-start" data-export="appendix-start">
          <div className="px-10 py-8 bg-slate-800">
            <h3 className="font-semibold text-white text-2xl">Strategic Recommendations</h3>
            <p className="text-slate-400 mt-2">Detailed analysis and action plans for your priority dimensions</p>
          </div>
          <div className="px-10 py-8">
            <p className="text-slate-600 leading-relaxed mb-6">
              The following pages provide in-depth analysis for your <strong>{allDimensionsByScore.slice(0, 4).length} priority dimensions</strong>—those 
              with the greatest opportunity for improvement. Each dimension includes:
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold">!</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Improvement Opportunities</p>
                  <p className="text-sm text-slate-500 mt-1">Specific gaps and areas needing attention, with status indicators</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">→</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">In Development</p>
                  <p className="text-sm text-slate-500 mt-1">Initiatives already in planning that can be accelerated</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Current Strengths</p>
                  <p className="text-sm text-slate-500 mt-1">Elements you're already offering that form your foundation</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-600 font-bold">★</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Tailored Insights & CAC Support</p>
                  <p className="text-sm text-slate-500 mt-1">Custom analysis and how Cancer and Careers can help</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-6 italic">
              Priority dimensions: {allDimensionsByScore.slice(0, 4).map(d => d.name).join(' • ')}
            </p>
          </div>
        </div>
        
        {/* ============ STRATEGIC RECOMMENDATIONS - DIMENSION CARDS ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="divide-y-4 divide-slate-100">
            {allDimensionsByScore.slice(0, 4).map((d, idx) => {
              // Generate dynamic insight based on actual performance
              const dynamicInsight = getDynamicInsight(d.dim, d.score, d.tier.name, d.benchmark, d.gaps, d.strengths, d.planning);
              const benchmarkNarrative = getBenchmarkNarrative(d.score, d.benchmark, d.name);
              // Get evidence items and roadmap
              const evidence = getTopEvidence(d.dim, d.strengths, d.gaps, d.planning, elementBenchmarks);
              const roadmap = getTwoStepRoadmap(d.dim, d.gaps, d.planning, d.assessing || [], elementBenchmarks);
              // Use tier color for the accent, consistent dark header for all
              const tierColor = getScoreColor(d.score);
              
              return (
                <div key={d.dim} className={`ppt-break border-l-4 pdf-no-break`} style={{ borderLeftColor: tierColor }}>
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
                          {d.benchmark !== null && (
                            <span className="text-sm text-slate-300">Benchmark: <strong className="text-white">{d.benchmark}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Benchmark Narrative */}
                  {benchmarkNarrative && (
                    <div className="px-10 py-3 bg-slate-100 border-b border-slate-200">
                      <p className="text-sm text-slate-600">{benchmarkNarrative}</p>
                    </div>
                  )}
                  
                  <div className="px-10 py-6">
                    {/* Current State - 3 columns */}
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      {/* Improvement Opportunities - includes gaps, assessing, unsure, and any other non-offered items */}
                      <div className="border border-red-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                          <h5 className="font-semibold text-red-800 text-sm">Improvement Opportunities ({d.needsAttention.length})</h5>
                        </div>
                        <div className="p-4 bg-white">
                          {d.needsAttention.length > 0 ? (
                            <ul className="space-y-2">
                              {d.needsAttention.slice(0, 6).map((item: any, i: number) => (
                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                                    item.isGap ? 'bg-red-500' : item.isAssessing ? 'bg-amber-400' : item.isUnsure ? 'bg-slate-400' : 'bg-red-400'
                                  }`}></span>
                                  <span>
                                    {item.name}
                                    <span className={`text-xs ml-1 ${
                                      item.isGap ? 'text-red-500' : item.isAssessing ? 'text-amber-600' : item.isUnsure ? 'text-slate-500' : 'text-red-400'
                                    }`}>
                                      ({item.isGap ? 'not offered' : item.isAssessing ? 'assessing' : item.isUnsure ? 'to clarify' : 'gap'})
                                    </span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-slate-400 italic">No improvement opportunities identified</p>}
                        </div>
                      </div>
                      
                      {/* In Progress - Planning only */}
                      <div className="border border-blue-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                          <h5 className="font-semibold text-blue-800 text-sm">In Development ({d.planning.length})</h5>
                        </div>
                        <div className="p-4 bg-white">
                          {d.planning.length > 0 ? (
                            <ul className="space-y-2">
                              {d.planning.slice(0, 6).map((item: any, i: number) => (
                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                                  <span>{item.name}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-sm text-slate-400 italic">No initiatives in planning</p>}
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
                              {d.strengths.slice(0, 6).map((s: any, i: number) => (
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
                    
                    {/* Strategic Insight & CAC Help - Now Dynamic & Editable */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left Column: Evidence + Insight */}
                      <div className="space-y-4">
                        {/* Evidence Bullets - NEW */}
                        {(evidence.topStrength || evidence.biggestGap || evidence.inFlight) && (
                          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                            <h5 className="font-semibold text-slate-700 mb-3 text-xs uppercase tracking-wide">Key Evidence</h5>
                            <div className="space-y-2">
                              {evidence.topStrength && (
                                <div className="flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-emerald-600 text-xs">✓</span>
                                  </span>
                                  <p className="text-sm text-slate-700">
                                    <span className="font-medium">Strength:</span> You offer <span className="font-semibold text-emerald-700">{evidence.topStrength.name}</span>
                                    <span className="text-slate-500"> (only {evidence.topStrength.benchPct}% of peers do)</span>
                                  </p>
                                </div>
                              )}
                              {evidence.biggestGap && (
                                <div className="flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-red-600 text-xs">✗</span>
                                  </span>
                                  <p className="text-sm text-slate-700">
                                    <span className="font-medium">Gap:</span> Not offering <span className="font-semibold text-red-700">{evidence.biggestGap.name}</span>
                                    <span className="text-slate-500"> ({evidence.biggestGap.benchPct}% of peers do)</span>
                                  </p>
                                </div>
                              )}
                              {evidence.inFlight && (
                                <div className="flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-blue-600 text-xs">○</span>
                                  </span>
                                  <p className="text-sm text-slate-700">
                                    <span className="font-medium">In Progress:</span> Planning <span className="font-semibold text-blue-700">{evidence.inFlight.name}</span>
                                    <span className="text-slate-500"> ({evidence.inFlight.benchPct}% of peers offer)</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Strategic Insight */}
                        <div className={`border rounded-lg p-5 ${editMode ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                          <h5 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                            Tailored Strategic Insight
                            {editMode && <span className="text-xs font-normal text-amber-600">(click to edit)</span>}
                          </h5>
                          {editMode ? (
                            <textarea
                              value={customInsights[d.dim]?.insight ?? dynamicInsight.insight}
                              onChange={(e) => updateCustomInsight(d.dim, 'insight', e.target.value)}
                              className="w-full text-sm text-slate-600 leading-relaxed bg-white border border-amber-200 rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                              placeholder="Enter custom strategic insight..."
                            />
                          ) : (
                            <p className="text-sm text-slate-600 leading-relaxed">{customInsights[d.dim]?.insight || dynamicInsight.insight}</p>
                          )}
                          {editMode && customInsights[d.dim]?.insight && (
                            <button 
                              onClick={() => updateCustomInsight(d.dim, 'insight', '')}
                              className="mt-2 text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Reset to auto-generated
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Right Column: Roadmap + CAC Help */}
                      <div className="space-y-4">
                        {/* 2-Step Roadmap - NEW */}
                        {(roadmap.quickWin || roadmap.strategicLift) && (
                          <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                            <h5 className="font-semibold text-indigo-800 mb-3 text-xs uppercase tracking-wide">Recommended Roadmap</h5>
                            <div className="space-y-3">
                              {roadmap.quickWin && (
                                <div className="bg-white rounded-lg p-3 border border-indigo-100">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">QUICK WIN</span>
                                    <span className="text-xs text-slate-500">0-60 days</span>
                                  </div>
                                  <p className="text-sm font-medium text-slate-800">{roadmap.quickWin.name}</p>
                                  <p className="text-xs text-slate-500 mt-1">{roadmap.quickWin.reason}</p>
                                </div>
                              )}
                              {roadmap.strategicLift && (
                                <div className="bg-white rounded-lg p-3 border border-indigo-100">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">STRATEGIC</span>
                                    <span className="text-xs text-slate-500">60-180 days</span>
                                  </div>
                                  <p className="text-sm font-medium text-slate-800">{roadmap.strategicLift.name}</p>
                                  <p className="text-xs text-slate-500 mt-1">{roadmap.strategicLift.reason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* CAC Help */}
                        <div className={`border rounded-lg p-5 ${editMode ? 'border-amber-300 bg-amber-50' : 'border-violet-200 bg-violet-50'}`}>
                          <h5 className="font-semibold text-violet-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                            How Cancer and Careers Can Help
                            {editMode && <span className="text-xs font-normal text-amber-600">(click to edit)</span>}
                          </h5>
                          {editMode ? (
                            <textarea
                              value={customInsights[d.dim]?.cacHelp ?? dynamicInsight.cacHelp}
                              onChange={(e) => updateCustomInsight(d.dim, 'cacHelp', e.target.value)}
                              className="w-full text-sm text-slate-600 leading-relaxed bg-white border border-amber-200 rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                              placeholder="Enter custom CAC help text..."
                            />
                          ) : (
                            <p className="text-sm text-slate-600 leading-relaxed">{customInsights[d.dim]?.cacHelp || dynamicInsight.cacHelp}</p>
                          )}
                          {editMode && customInsights[d.dim]?.cacHelp && (
                            <button 
                              onClick={() => updateCustomInsight(d.dim, 'cacHelp', '')}
                              className="mt-2 text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Reset to auto-generated
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============ IMPLEMENTATION ROADMAP ============ */}
        <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-break-before pdf-no-break">
          <div className="px-10 py-6 bg-slate-800">
            <h3 className="font-semibold text-white text-lg">Implementation Roadmap</h3>
            <p className="text-slate-400 text-sm mt-1">Your phased approach to strengthen workplace cancer support</p>
          </div>
          <div className="px-10 py-8">
            <div className="grid grid-cols-3 gap-6">
              {/* Phase 1 */}
              <div className="border-2 border-emerald-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-emerald-600 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 font-bold text-lg shadow-md">1</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">Quick Wins</h4>
                      {editMode ? (
                        <input
                          type="text"
                          value={customRoadmapTimeframes.phase1 || '0-3 months'}
                          onChange={(e) => { setCustomRoadmapTimeframes(prev => ({ ...prev, phase1: e.target.value })); setHasUnsavedChanges(true); }}
                          className="text-xs bg-emerald-500 text-white border border-emerald-400 rounded px-2 py-0.5 w-24 focus:outline-none"
                        />
                      ) : (
                        <p className="text-emerald-100 text-xs">{customRoadmapTimeframes.phase1 || '0-3 months'}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-emerald-50/50">
                  <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide mb-4">
                    Accelerate items already in progress
                  </p>
                  {editMode && <p className="text-xs text-amber-600 mb-2">(editable)</p>}
                  {editMode ? (
                    <div className="space-y-2">
                      <textarea
                        value={customRoadmap.phase1?.useCustom 
                          ? customRoadmap.phase1.items.join('\n') 
                          : quickWinItems.map(item => item.name).join('\n')}
                        onChange={(e) => updateCustomRoadmap('phase1', e.target.value.split('\n').filter(s => s.trim()), true)}
                        className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-300 rounded px-3 py-2 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                        placeholder="Enter items, one per line..."
                      />
                      {customRoadmap.phase1?.useCustom && (
                        <button 
                          onClick={() => { setCustomRoadmap(prev => ({ ...prev, phase1: undefined })); setHasUnsavedChanges(true); }}
                          className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset to auto-generated
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {(customRoadmap.phase1?.useCustom ? customRoadmap.phase1.items : quickWinItems.map(i => i.name)).length > 0 ? (
                        <ul className="space-y-3">
                          {(customRoadmap.phase1?.useCustom 
                            ? customRoadmap.phase1.items.map((name, idx) => ({ name, dimNum: null }))
                            : quickWinItems
                          ).map((item, idx) => (
                            <li key={idx} className="text-sm">
                              <p className="text-slate-700">{item.name}</p>
                              {item.dimNum && <p className="text-xs text-slate-400 mt-0.5">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</p>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Begin with communication and manager awareness initiatives</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Phase 2 */}
              <div className="border-2 border-blue-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-blue-600 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-lg shadow-md">2</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">Foundation Building</h4>
                      {editMode ? (
                        <input
                          type="text"
                          value={customRoadmapTimeframes.phase2 || '3-12 months'}
                          onChange={(e) => { setCustomRoadmapTimeframes(prev => ({ ...prev, phase2: e.target.value })); setHasUnsavedChanges(true); }}
                          className="text-xs bg-blue-500 text-white border border-blue-400 rounded px-2 py-0.5 w-24 focus:outline-none"
                        />
                      ) : (
                        <p className="text-blue-100 text-xs">{customRoadmapTimeframes.phase2 || '3-12 months'}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-blue-50/50">
                  <p className="text-xs text-blue-700 font-medium uppercase tracking-wide mb-4">
                    Address high-weight dimension gaps
                  </p>
                  {editMode && <p className="text-xs text-amber-600 mb-2">(editable)</p>}
                  {editMode ? (
                    <div className="space-y-2">
                      <textarea
                        value={customRoadmap.phase2?.useCustom 
                          ? customRoadmap.phase2.items.join('\n') 
                          : foundationItems.map(item => item.name).join('\n')}
                        onChange={(e) => updateCustomRoadmap('phase2', e.target.value.split('\n').filter(s => s.trim()), true)}
                        className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-300 rounded px-3 py-2 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                        placeholder="Enter items, one per line..."
                      />
                      {customRoadmap.phase2?.useCustom && (
                        <button 
                          onClick={() => { setCustomRoadmap(prev => ({ ...prev, phase2: undefined })); setHasUnsavedChanges(true); }}
                          className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset to auto-generated
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {(customRoadmap.phase2?.useCustom ? customRoadmap.phase2.items : foundationItems.map(i => i.name)).length > 0 ? (
                        <ul className="space-y-3">
                          {(customRoadmap.phase2?.useCustom 
                            ? customRoadmap.phase2.items.map((name, idx) => ({ name, dimNum: null }))
                            : foundationItems
                          ).map((item, idx) => (
                            <li key={idx} className="text-sm">
                              <p className="text-slate-700">{item.name}</p>
                              {item.dimNum && <p className="text-xs text-slate-400 mt-0.5">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</p>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Focus on navigation and insurance resources</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Phase 3 */}
              <div className="border-2 border-violet-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-violet-600 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-violet-600 font-bold text-lg shadow-md">3</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">Long-Term Enhancement</h4>
                      {editMode ? (
                        <input
                          type="text"
                          value={customRoadmapTimeframes.phase3 || '12+ months'}
                          onChange={(e) => { setCustomRoadmapTimeframes(prev => ({ ...prev, phase3: e.target.value })); setHasUnsavedChanges(true); }}
                          className="text-xs bg-violet-500 text-white border border-violet-400 rounded px-2 py-0.5 w-24 focus:outline-none"
                        />
                      ) : (
                        <p className="text-violet-100 text-xs">{customRoadmapTimeframes.phase3 || '12+ months'}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-violet-50/50">
                  <p className="text-xs text-violet-700 font-medium uppercase tracking-wide mb-4">
                    Achieve excellence across all dimensions
                  </p>
                  {editMode && <p className="text-xs text-amber-600 mb-2">(editable)</p>}
                  {editMode ? (
                    <div className="space-y-2">
                      <textarea
                        value={customRoadmap.phase3?.useCustom 
                          ? customRoadmap.phase3.items.join('\n') 
                          : excellenceItems.map(item => item.name).join('\n')}
                        onChange={(e) => updateCustomRoadmap('phase3', e.target.value.split('\n').filter(s => s.trim()), true)}
                        className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-300 rounded px-3 py-2 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                        placeholder="Enter items, one per line..."
                      />
                      {customRoadmap.phase3?.useCustom && (
                        <button 
                          onClick={() => { setCustomRoadmap(prev => ({ ...prev, phase3: undefined })); setHasUnsavedChanges(true); }}
                          className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset to auto-generated
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {(customRoadmap.phase3?.useCustom ? customRoadmap.phase3.items : excellenceItems.map(i => i.name)).length > 0 ? (
                        <ul className="space-y-3">
                          {(customRoadmap.phase3?.useCustom 
                            ? customRoadmap.phase3.items.map((name, idx) => ({ name, dimNum: null }))
                            : excellenceItems
                          ).map((item, idx) => (
                            <li key={idx} className="text-sm">
                              <p className="text-slate-700">{item.name}</p>
                              {item.dimNum && <p className="text-xs text-slate-400 mt-0.5">D{item.dimNum}: {DIMENSION_SHORT_NAMES[item.dimNum]}</p>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Continue expanding strengths and monitoring program effectiveness</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ HOW CAC CAN HELP ============ */}
        <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-no-break">
          <div className="px-10 py-6 bg-gradient-to-r from-[#F37021] to-[#FF8C42]">
            <div className="flex items-center gap-6">
              <div className="bg-white rounded-xl p-3 shadow-lg flex-shrink-0">
                <Image src="/cancer-careers-logo.png" alt="Cancer and Careers" width={120} height={120} className="object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-white text-2xl">How Cancer and Careers Can Help</h3>
                <p className="text-orange-100 text-sm mt-2">Tailored support to enhance your employee experience</p>
              </div>
            </div>
          </div>
          <div className="px-10 py-6">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-5 border border-orange-200 mb-6">
              <p className="text-slate-700 leading-relaxed">
                Every organization enters this work from a different place. Cancer and Careers consulting practice 
                helps organizations understand where they are, identify where they want to be, and build a realistic 
                path to get there—shaped by <strong>two decades of frontline experience</strong> with employees navigating cancer 
                and the HR teams supporting them.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { key: 'item1', num: 1, defaultTitle: 'Manager Preparedness & Training', defaultBullets: ['Live training sessions with case studies', 'Manager toolkit and conversation guides', 'Train the trainer programs'] },
                { key: 'item2', num: 2, defaultTitle: 'Navigation & Resource Architecture', defaultBullets: ['Resource audit and gap analysis', 'Single entry point design', 'Communication strategy'] },
                { key: 'item3', num: 3, defaultTitle: 'Return to Work Excellence', defaultBullets: ['Phased return protocols', 'Check-in cadence design', 'Career continuity planning'] },
                { key: 'item4', num: 4, defaultTitle: 'Policy & Program Assessment', defaultBullets: ['Comprehensive policy review', 'Implementation audit', 'Business case development'] },
              ].map(item => {
                const custom = customCacHelp[item.key as keyof typeof customCacHelp];
                const title = custom?.title || item.defaultTitle;
                const bullets = custom?.bullets || item.defaultBullets;
                return (
                  <div key={item.key} className="border-l-4 border-[#F37021] bg-slate-50 rounded-r-lg p-5">
                    {editMode ? (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-6 h-6 rounded-full bg-[#F37021] text-white text-xs flex items-center justify-center flex-shrink-0">{item.num}</span>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                              setCustomCacHelp(prev => ({
                                ...prev,
                                [item.key]: { title: e.target.value, bullets: bullets }
                              }));
                              setHasUnsavedChanges(true);
                            }}
                            className="flex-1 font-semibold text-slate-800 text-sm bg-amber-50 border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                        <textarea
                          value={bullets.join('\n')}
                          onChange={(e) => {
                            setCustomCacHelp(prev => ({
                              ...prev,
                              [item.key]: { title: title, bullets: e.target.value.split('\n') }
                            }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-300 rounded px-2 py-1 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-amber-400"
                          placeholder="One bullet per line..."
                        />
                      </>
                    ) : (
                      <>
                        <h4 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#F37021] text-white text-xs flex items-center justify-center">{item.num}</span>
                          {title}
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-1.5">
                          {bullets.map((b, i) => <li key={i}>• {b}</li>)}
                        </ul>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="bg-gradient-to-r from-[#F37021] to-[#FF8C42] rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white text-lg">Ready to take the next step?</p>
                  <p className="text-orange-100 mt-1">Contact Cancer and Careers to discuss how we can support your organization.</p>
                </div>
                <div className="text-right bg-white rounded-lg px-5 py-3">
                  <p className="font-semibold text-[#F37021]">cancerandcareers.org</p>
                  <p className="text-sm text-slate-600">cacbestcompanies@cew.org</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ METHODOLOGY & FOOTER ============ */}
        <div className="ppt-break bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-0 pdf-no-break" id="appendix-end" data-export="appendix-end">
          <div className="px-10 py-5 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700 text-sm">Assessment Methodology</h3>
          </div>
          <div className="px-10 py-5">
            <div className="grid grid-cols-4 gap-6 text-xs text-slate-600">
              <div>
                <p className="font-medium text-slate-700 mb-2">Scoring Framework</p>
                <p className="leading-relaxed">Organizations are assessed across 13 dimensions of workplace cancer support. The composite score combines dimension performance (90%), program maturity (5%), and support breadth (5%).</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-2">Dimension Weights</p>
                <p className="leading-relaxed">Each dimension carries a specific weight reflecting its relative importance. Weights were derived from extensive research with HR leaders, employees managing cancer, and general employee populations to ensure the Index prioritizes what matters most to those directly affected.</p>
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
          
          {/* Footer integrated */}
          <div className="px-10 py-4 border-t border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-slate-700">Best Companies for Working with Cancer Index</p>
                <p className="text-xs text-slate-400">© 2026 Cancer and Careers. All rights reserved.</p>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Powered by:</span>
                  <Image 
                    src="/BI_LOGO_FINAL.png" 
                    alt="BEYOND Insights" 
                    width={80} 
                    height={24}
                    className="object-contain"
                  />
                </div>
                <p className="text-xs text-slate-400">Survey ID: {company?.survey_id || token}</p>
                <p className="text-xs text-slate-400">Confidential</p>
              </div>
            </div>
          </div>
        </div>

        



      </div>

{/* ============ PPT SLIDE SECTIONS (hidden, captured for export) ============ */}
      <div className="ppt-slides-container">
        {/* SLIDE 1: Title */}
        <div id="ppt-slide-1" className="ppt-slide" style={{ background: '#1E293B', color: 'white', padding: '60px' }}>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '8px' }}>PERFORMANCE ASSESSMENT</p>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>Best Companies for Working with Cancer</h1>
          <p style={{ fontSize: '16px', color: '#CBD5E1', marginBottom: '60px' }}>Index 2026</p>
          <h2 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '40px' }}>{companyName}</h2>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ background: getScoreColor(compositeScore || 0), padding: '20px 30px', borderRadius: '8px', textAlign: 'center' as const }}>
              <p style={{ fontSize: '48px', fontWeight: 'bold' }}>{compositeScore || 0}</p>
              <p style={{ fontSize: '12px' }}>Score</p>
            </div>
            <div style={{ background: '#374151', padding: '12px 24px', borderRadius: '6px' }}>
              <p style={{ fontSize: '18px', fontWeight: 600 }}>{tier?.name}</p>
            </div>
          </div>
          <p style={{ position: 'absolute' as const, bottom: '40px', left: '60px', fontSize: '12px', color: '#64748B' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* SLIDE 2: Executive Summary */}
        <div id="ppt-slide-2" className="ppt-slide">
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1E293B', marginBottom: '30px' }}>Executive Summary</h2>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
            <div style={{ flex: 1, background: '#F1F5F9', padding: '20px', borderRadius: '8px', textAlign: 'center' as const }}>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1E293B', textDecoration: 'none' }}>{currentlyOffering}</p>
              <p style={{ fontSize: '11px', color: '#64748B', textDecoration: 'none' }}>of {totalElements} elements offered</p>
            </div>
            <div style={{ flex: 1, background: '#F1F5F9', padding: '20px', borderRadius: '8px', textAlign: 'center' as const }}>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1E293B', textDecoration: 'none' }}>{planningItems + assessingItems}</p>
              <p style={{ fontSize: '11px', color: '#64748B', textDecoration: 'none' }}>in development</p>
            </div>
            <div style={{ flex: 1, background: '#F1F5F9', padding: '20px', borderRadius: '8px', textAlign: 'center' as const }}>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1E293B', textDecoration: 'none' }}>{gapItems}</p>
              <p style={{ fontSize: '11px', color: '#64748B', textDecoration: 'none' }}>identified gaps</p>
            </div>
            <div style={{ flex: 1, background: '#F1F5F9', padding: '20px', borderRadius: '8px', textAlign: 'center' as const }}>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1E293B', textDecoration: 'none' }}>{tierCounts.exemplary + tierCounts.leading}</p>
              <p style={{ fontSize: '11px', color: '#64748B', textDecoration: 'none' }}>at Leading+</p>
            </div>
          </div>
          <div style={{ background: '#EDE9FE', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#5B21B6', textDecoration: 'none' }}>
              {nextTierUp && pointsToNextTier 
                ? `${pointsToNextTier} points from ${nextTierUp.name}${nextTierUp.name !== 'Exemplary' ? ` · ${90 - (compositeScore || 0)} points from Exemplary` : ''}`
                : 'Exemplary tier achieved'}
            </p>
            <p style={{ fontSize: '12px', color: '#7C3AED', marginTop: '4px', textDecoration: 'none' }}>
              Focus areas: {allDimensionsByScore.slice(0, 3).map(d => d.name).join(', ')}
            </p>
          </div>
        </div>

        {/* SLIDE 3: Dimension Performance */}
        <div id="ppt-slide-3" className="ppt-slide">
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1E293B', marginBottom: '20px' }}>Dimension Performance</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#1E293B', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', width: '50px' }}>#</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Dimension</th>
                <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>Weight</th>
                <th style={{ padding: '10px', textAlign: 'center', width: '70px' }}>Score</th>
                <th style={{ padding: '10px', textAlign: 'left', width: '100px' }}>Tier</th>
              </tr>
            </thead>
            <tbody>
              {[...dimensionAnalysis].sort((a, b) => b.weight - a.weight).map((d, i) => (
                <tr key={d.dim} style={{ background: i % 2 === 0 ? '#F8FAFC' : 'white' }}>
                  <td style={{ padding: '8px 10px', color: '#64748B', textDecoration: 'none' }}>D{d.dim}</td>
                  <td style={{ padding: '8px 10px', color: '#1E293B', textDecoration: 'none' }}>{d.name}</td>
                  <td style={{ padding: '8px 10px', color: '#64748B', textAlign: 'center', textDecoration: 'none' }}>{d.weight}%</td>
                  <td style={{ padding: '8px 10px', color: getScoreColor(d.score), fontWeight: 'bold', textAlign: 'center', textDecoration: 'none' }}>{d.score}</td>
                  <td style={{ padding: '8px 10px', color: '#64748B', textDecoration: 'none' }}>{d.tier.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SLIDE 4: Matrix - Static version to avoid oklch color parsing issues */}
        <div id="ppt-slide-4" className="ppt-slide">
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1E293B', marginBottom: '10px', textDecoration: 'none' }}>Strategic Priority Matrix</h2>
          <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '20px', textDecoration: 'none' }}>Performance vs Strategic Weight</p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '15px', marginTop: '20px' }}>
            <div style={{ flex: '1 1 45%', background: '#FEE2E2', padding: '20px', borderRadius: '8px', minHeight: '180px' }}>
              <p style={{ fontWeight: 'bold', color: '#991B1B', marginBottom: '10px', textDecoration: 'none' }}>PRIORITY GAPS</p>
              <p style={{ fontSize: '11px', color: '#7F1D1D', textDecoration: 'none' }}>High weight, lower performance - focus here first</p>
              {dimensionAnalysis.filter(d => d.weight >= 7 && d.score < 70).slice(0, 3).map(d => (
                <p key={d.dim} style={{ fontSize: '12px', color: '#1E293B', marginTop: '8px', textDecoration: 'none' }}>• {d.name} ({d.score})</p>
              ))}
            </div>
            <div style={{ flex: '1 1 45%', background: '#D1FAE5', padding: '20px', borderRadius: '8px', minHeight: '180px' }}>
              <p style={{ fontWeight: 'bold', color: '#065F46', marginBottom: '10px', textDecoration: 'none' }}>CORE STRENGTHS</p>
              <p style={{ fontSize: '11px', color: '#047857', textDecoration: 'none' }}>High weight, strong performance - maintain these</p>
              {dimensionAnalysis.filter(d => d.weight >= 7 && d.score >= 70).slice(0, 3).map(d => (
                <p key={d.dim} style={{ fontSize: '12px', color: '#1E293B', marginTop: '8px', textDecoration: 'none' }}>• {d.name} ({d.score})</p>
              ))}
            </div>
            <div style={{ flex: '1 1 45%', background: '#FEF3C7', padding: '20px', borderRadius: '8px', minHeight: '180px' }}>
              <p style={{ fontWeight: 'bold', color: '#92400E', marginBottom: '10px', textDecoration: 'none' }}>SECONDARY GAPS</p>
              <p style={{ fontSize: '11px', color: '#B45309', textDecoration: 'none' }}>Lower weight, needs improvement</p>
              {dimensionAnalysis.filter(d => d.weight < 7 && d.score < 70).slice(0, 3).map(d => (
                <p key={d.dim} style={{ fontSize: '12px', color: '#1E293B', marginTop: '8px', textDecoration: 'none' }}>• {d.name} ({d.score})</p>
              ))}
            </div>
            <div style={{ flex: '1 1 45%', background: '#DBEAFE', padding: '20px', borderRadius: '8px', minHeight: '180px' }}>
              <p style={{ fontWeight: 'bold', color: '#1E40AF', marginBottom: '10px', textDecoration: 'none' }}>MAINTAIN</p>
              <p style={{ fontSize: '11px', color: '#1D4ED8', textDecoration: 'none' }}>Lower weight, performing well</p>
              {dimensionAnalysis.filter(d => d.weight < 7 && d.score >= 70).slice(0, 3).map(d => (
                <p key={d.dim} style={{ fontSize: '12px', color: '#1E293B', marginTop: '8px', textDecoration: 'none' }}>• {d.name} ({d.score})</p>
              ))}
            </div>
          </div>
        </div>

        {/* SLIDE 5: Strengths & Opportunities */}
        <div id="ppt-slide-5" className="ppt-slide">
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1E293B', marginBottom: '20px', textDecoration: 'none' }}>Strengths & Opportunities</h2>
          <div style={{ display: 'flex', gap: '30px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ background: '#059669', color: 'white', padding: '12px 20px', borderRadius: '6px 6px 0 0', fontWeight: 600, textDecoration: 'none' }}>Areas of Excellence</div>
              <div style={{ border: '1px solid #E2E8F0', borderTop: 'none', padding: '15px', borderRadius: '0 0 6px 6px', minHeight: '350px' }}>
                {strengthDimensions.slice(0, 4).map(d => (
                  <div key={d.dim} style={{ marginBottom: '12px' }}>
                    <p style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px', textDecoration: 'none' }}>{d.name} ({d.score})</p>
                    {d.strengths.slice(0, 2).map((s: any, i: number) => (
                      <p key={i} style={{ fontSize: '11px', color: '#64748B', marginLeft: '10px', textDecoration: 'none' }}>✓ {s.name}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ background: '#D97706', color: 'white', padding: '12px 20px', borderRadius: '6px 6px 0 0', fontWeight: 600, textDecoration: 'none' }}>Improvement Opportunities</div>
              <div style={{ border: '1px solid #E2E8F0', borderTop: 'none', padding: '15px', borderRadius: '0 0 6px 6px', minHeight: '350px' }}>
                {allDimensionsByScore.slice(0, 4).map(d => (
                  <div key={d.dim} style={{ marginBottom: '12px' }}>
                    <p style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px', textDecoration: 'none' }}>{d.name} ({d.score})</p>
                    {d.needsAttention.slice(0, 2).map((g: any, i: number) => (
                      <p key={i} style={{ fontSize: '11px', color: '#64748B', marginLeft: '10px', textDecoration: 'none' }}>• {g.name}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 6: Roadmap */}
        <div id="ppt-slide-6" className="ppt-slide">
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1E293B', marginBottom: '20px', textDecoration: 'none' }}>Implementation Roadmap</h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ background: '#1E293B', color: 'white', padding: '15px', borderRadius: '6px 6px 0 0', textAlign: 'center' as const }}>
                <p style={{ fontWeight: 600, fontSize: '16px', textDecoration: 'none' }}>Quick Wins</p>
                <p style={{ fontSize: '11px', color: '#CBD5E1', textDecoration: 'none' }}>Immediate</p>
              </div>
              <div style={{ background: '#F1F5F9', padding: '15px', borderRadius: '0 0 6px 6px', minHeight: '300px' }}>
                {quickWinItems.slice(0, 5).map((item: any, i: number) => (
                  <p key={i} style={{ fontSize: '11px', color: '#1E293B', marginBottom: '8px', textDecoration: 'none' }}>• {item.name}</p>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ background: '#475569', color: 'white', padding: '15px', borderRadius: '6px 6px 0 0', textAlign: 'center' as const }}>
                <p style={{ fontWeight: 600, fontSize: '16px', textDecoration: 'none' }}>Foundation</p>
                <p style={{ fontSize: '11px', color: '#CBD5E1', textDecoration: 'none' }}>6-12 months</p>
              </div>
              <div style={{ background: '#F1F5F9', padding: '15px', borderRadius: '0 0 6px 6px', minHeight: '300px' }}>
                {foundationItems.slice(0, 5).map((item: any, i: number) => (
                  <p key={i} style={{ fontSize: '11px', color: '#1E293B', marginBottom: '8px', textDecoration: 'none' }}>• {item.name}</p>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ background: '#64748B', color: 'white', padding: '15px', borderRadius: '6px 6px 0 0', textAlign: 'center' as const }}>
                <p style={{ fontWeight: 600, fontSize: '16px', textDecoration: 'none' }}>Long-Term</p>
                <p style={{ fontSize: '11px', color: '#CBD5E1', textDecoration: 'none' }}>12+ months</p>
              </div>
              <div style={{ background: '#F1F5F9', padding: '15px', borderRadius: '0 0 6px 6px', minHeight: '300px' }}>
                {excellenceItems.slice(0, 5).map((item: any, i: number) => (
                  <p key={i} style={{ fontSize: '11px', color: '#1E293B', marginBottom: '8px', textDecoration: 'none' }}>• {item.name}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 7: How CAC Can Help */}
        <div id="ppt-slide-7" className="ppt-slide" style={{ padding: 0 }}>
          <div style={{ background: '#1E293B', padding: '30px 40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>How Cancer and Careers Can Help</h2>
          </div>
          <div style={{ padding: '30px 40px' }}>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '30px' }}>
              Our consulting practice helps organizations understand where they are, identify where they want to be, and build a realistic path to get there.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
              <div>
                <p style={{ fontWeight: 600, color: '#1E293B', fontSize: '16px', marginBottom: '12px' }}>For HR & Benefits Teams</p>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>✓ Policy gap analysis</p>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>✓ Benefits benchmarking</p>
                <p style={{ fontSize: '13px', color: '#64748B' }}>✓ Manager training programs</p>
              </div>
              <div>
                <p style={{ fontWeight: 600, color: '#1E293B', fontSize: '16px', marginBottom: '12px' }}>For Employees</p>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>✓ Educational materials</p>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>✓ Navigation support</p>
                <p style={{ fontSize: '13px', color: '#64748B' }}>✓ Peer support networks</p>
              </div>
            </div>
            <div style={{ background: '#F5F3FF', padding: '20px', borderRadius: '8px' }}>
              <p style={{ fontWeight: 600, color: '#5B21B6', fontSize: '16px' }}>Ready to take the next step?</p>
              <p style={{ fontSize: '13px', color: '#7C3AED' }}>Contact: consulting@cancerandcareers.org</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

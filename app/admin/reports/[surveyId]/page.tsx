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
        developing: 'Urgent: CAC\'s Leave Policy Accelerator builds compliant, competitive leave policies in 60 days, including FMLA+ enhancements and accommodation frameworks.'
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
    insight = `Your ${ctx.focus} represents best-in-class performance at ${score} points. ${strengthCount > 0 ? `With ${strengthCount} elements fully implemented, you've` : 'You\'ve'} established a foundation others aspire to. ${isAboveBenchmark && benchmark !== null ? `At ${benchDiff} points above the peer average of ${benchmark}, this is a genuine competitive differentiator.` : ''} Focus on maintaining this standard and codifying your practices for organizational knowledge transfer.`;
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
  if (diff > 25) return `Significantly outperforming peers by ${diff} points—this represents a genuine organizational strength and potential competitive advantage in talent attraction.`;
  if (diff > 15) return `Well above the ${benchmark} peer average by ${diff} points, indicating mature, established practices that employees likely recognize and value.`;
  if (diff > 5) return `Above benchmark by ${diff} points (peer avg: ${benchmark}), showing solid foundation with room to extend your lead.`;
  if (diff > 0) return `Slightly above the ${benchmark} peer average—a good foundation to build on for differentiation.`;
  if (diff === 0) return `Matching the peer average of ${benchmark}—an opportunity to differentiate through targeted improvements.`;
  if (diff > -10) return `${Math.abs(diff)} points below the ${benchmark} peer benchmark—targeted improvements can close this gap within 6-12 months.`;
  if (diff > -20) return `Notable gap of ${Math.abs(diff)} points below the ${benchmark} peer average warrants focused strategic attention.`;
  return `Significant ${Math.abs(diff)}-point gap below peers (avg: ${benchmark}) requires prioritization to reduce competitive disadvantage.`;
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
      recommendation: `Consider pursuing Best Companies certification to formalize recognition. Focus refinement on ${lowestDim.name} (${lowestDim.score}) to achieve full excellence across all dimensions.`
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
function getImpactRankings(dimAnalysis: any[], compositeScore: number): { dimName: string; dimNum: number; currentScore: number; tier: string; potentialGain: number; effort: string; recommendation: string; topGap: string }[] {
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
      
      // Generate specific recommendation based on their data
      let recommendation = '';
      if (d.planning.length > 0) {
        recommendation = `Accelerate ${d.planning.length} in-progress initiative${d.planning.length > 1 ? 's' : ''} for quickest impact`;
      } else if (d.gaps.length > 0 && d.gaps[0]?.name) {
        recommendation = `Start with: ${d.gaps[0].name}`;
      } else if (d.assessing.length > 0) {
        recommendation = `Move ${d.assessing.length} item${d.assessing.length > 1 ? 's' : ''} from assessment to planning`;
      } else {
        recommendation = `Optimize and document existing programs`;
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
        recommendation,
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
  const MAX_WEIGHT = 15;
  
  const CHART_WIDTH = 900;
  const CHART_HEIGHT = 420;
  const LABEL_HEIGHT = 24;
  const MARGIN = { top: LABEL_HEIGHT + 10, right: 20, bottom: LABEL_HEIGHT + 55, left: 60 };
  const PLOT_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const PLOT_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  
  const hoveredData = hoveredDim !== null ? dimensionAnalysis.find(d => d.dim === hoveredDim) : null;
  
  return (
    <div className="px-4 py-4">
      <div className="relative w-full" style={{ height: '580px' }}>
        <svg className="w-full" style={{ height: '490px' }} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
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
        <div className="mt-3 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
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
                <span className="text-xs text-slate-700 whitespace-nowrap font-medium">{DIMENSION_SHORT_NAMES[d.dim]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// BENCHMARK COMPARISON CHART
// ============================================

const COMPANY_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#84CC16', // lime
  '#6366F1', // indigo
  '#F97316', // orange
  '#14B8A6', // teal
  '#A855F7', // purple
  '#22C55E', // green
];

function BenchmarkComparisonChart({ 
  companies, 
  benchmarks, 
  dimensionWeights,
  onClose 
}: { 
  companies: { name: string; surveyId: string; dimensionScores: Record<number, number>; compositeScore: number; isCurrentCompany: boolean }[];
  benchmarks: Record<number, number | null>;
  dimensionWeights: Record<number, number>;
  onClose: () => void;
}) {
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  const [hoveredDim, setHoveredDim] = useState<number | null>(null);
  
  // Sort dimensions by weight (descending)
  const sortedDimensions = Object.entries(dimensionWeights)
    .map(([dim, weight]) => ({ dim: parseInt(dim), weight }))
    .sort((a, b) => b.weight - a.weight);
  
  const CHART_WIDTH = 1000;
  const ROW_HEIGHT = 36;
  const HEADER_HEIGHT = 50;
  const LEGEND_HEIGHT = 80;
  const MARGIN = { left: 200, right: 80 };
  const SCORE_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const CHART_HEIGHT = HEADER_HEIGHT + (sortedDimensions.length * ROW_HEIGHT) + LEGEND_HEIGHT + 20;
  
  const DIM_NAMES: Record<number, string> = {
    1: 'Medical Leave & Flexibility', 2: 'Insurance & Financial', 3: 'Manager Preparedness',
    4: 'Navigation & Resources', 5: 'Workplace Accommodations', 6: 'Culture & Safety',
    7: 'Career Continuity', 8: 'Work Continuation', 9: 'Executive Commitment',
    10: 'Caregiver Support', 11: 'Prevention & Wellness', 12: 'Continuous Improvement', 13: 'Communication'
  };
  
  // Assign colors to companies
  const companyColors = companies.reduce((acc, c, idx) => {
    acc[c.surveyId] = c.isCurrentCompany ? '#1E40AF' : COMPANY_COLORS[idx % COMPANY_COLORS.length];
    return acc;
  }, {} as Record<string, string>);
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Benchmark Comparison</h2>
            <p className="text-sm text-slate-500 mt-1">{companies.length} companies • 13 dimensions • Sorted by weight</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <svg 
            width="100%" 
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} 
            preserveAspectRatio="xMidYMid meet"
            className="overflow-visible"
          >
            {/* Header row */}
            <g transform={`translate(0, 0)`}>
              <text x={MARGIN.left - 10} y={HEADER_HEIGHT / 2} textAnchor="end" dominantBaseline="middle" 
                    fill="#64748B" fontSize="11" fontWeight="600">DIMENSION (WEIGHT)</text>
              
              {/* Score axis labels */}
              {[0, 25, 50, 75, 100].map(val => (
                <g key={val} transform={`translate(${MARGIN.left + (val / 100) * SCORE_WIDTH}, 0)`}>
                  <text y={HEADER_HEIGHT / 2} textAnchor="middle" dominantBaseline="middle"
                        fill="#94A3B8" fontSize="10">{val}</text>
                </g>
              ))}
            </g>
            
            {/* Dimension rows */}
            {sortedDimensions.map((d, rowIdx) => {
              const y = HEADER_HEIGHT + (rowIdx * ROW_HEIGHT);
              const benchmark = benchmarks[d.dim];
              const isHovered = hoveredDim === d.dim;
              
              return (
                <g key={d.dim} transform={`translate(0, ${y})`}
                   onMouseEnter={() => setHoveredDim(d.dim)}
                   onMouseLeave={() => setHoveredDim(null)}>
                  {/* Row background */}
                  <rect x={0} y={0} width={CHART_WIDTH} height={ROW_HEIGHT} 
                        fill={isHovered ? '#F8FAFC' : rowIdx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'} />
                  
                  {/* Dimension label */}
                  <text x={MARGIN.left - 10} y={ROW_HEIGHT / 2} textAnchor="end" dominantBaseline="middle"
                        fill="#334155" fontSize="11" fontWeight="500">
                    {DIM_NAMES[d.dim]} ({d.weight}%)
                  </text>
                  
                  {/* Score track background */}
                  <rect x={MARGIN.left} y={ROW_HEIGHT / 2 - 4} width={SCORE_WIDTH} height={8} 
                        fill="#E2E8F0" rx="4" />
                  
                  {/* Vertical grid lines */}
                  {[25, 50, 75].map(val => (
                    <line key={val} x1={MARGIN.left + (val / 100) * SCORE_WIDTH} y1={4} 
                          x2={MARGIN.left + (val / 100) * SCORE_WIDTH} y2={ROW_HEIGHT - 4}
                          stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2 2" />
                  ))}
                  
                  {/* Benchmark line */}
                  {benchmark !== null && (
                    <g transform={`translate(${MARGIN.left + (benchmark / 100) * SCORE_WIDTH}, 0)`}>
                      <line y1={4} y2={ROW_HEIGHT - 4} stroke="#F97316" strokeWidth="2" />
                      <polygon points="-5,4 5,4 0,10" fill="#F97316" />
                    </g>
                  )}
                  
                  {/* Company dots */}
                  {companies.map((company, cIdx) => {
                    const score = company.dimensionScores[d.dim];
                    if (score === undefined || score === null) return null;
                    
                    const xPos = MARGIN.left + (score / 100) * SCORE_WIDTH;
                    const isCompanyHovered = hoveredCompany === company.surveyId;
                    const isCurrent = company.isCurrentCompany;
                    
                    return (
                      <g key={company.surveyId} 
                         transform={`translate(${xPos}, ${ROW_HEIGHT / 2})`}
                         onMouseEnter={() => setHoveredCompany(company.surveyId)}
                         onMouseLeave={() => setHoveredCompany(null)}
                         style={{ cursor: 'pointer' }}>
                        <circle 
                          r={isCompanyHovered || isCurrent ? 8 : 6} 
                          fill={companyColors[company.surveyId]}
                          stroke={isCurrent ? '#1E3A8A' : 'white'}
                          strokeWidth={isCurrent ? 3 : 2}
                          style={{ transition: 'all 0.15s ease' }}
                        />
                        {isCompanyHovered && (
                          <g transform="translate(0, -20)">
                            <rect x={-40} y={-12} width={80} height={20} rx="4" fill="#1E293B" />
                            <text textAnchor="middle" y={2} fill="white" fontSize="10" fontWeight="500">
                              {company.name.length > 12 ? company.name.slice(0, 10) + '...' : company.name}: {score}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
            
            {/* Legend */}
            <g transform={`translate(${MARGIN.left}, ${HEADER_HEIGHT + sortedDimensions.length * ROW_HEIGHT + 20})`}>
              <text y={0} fill="#64748B" fontSize="11" fontWeight="600">LEGEND</text>
              
              {/* Benchmark indicator */}
              <g transform="translate(0, 20)">
                <line x1={0} y1={0} x2={0} y2={16} stroke="#F97316" strokeWidth="2" />
                <polygon points="-4,0 4,0 0,5" fill="#F97316" />
                <text x={12} y={12} fill="#64748B" fontSize="10">Benchmark Average</text>
              </g>
              
              {/* Company dots */}
              <g transform="translate(150, 15)">
                {companies.slice(0, 8).map((company, idx) => (
                  <g key={company.surveyId} transform={`translate(${(idx % 4) * 200}, ${Math.floor(idx / 4) * 22})`}>
                    <circle cx={6} cy={6} r={company.isCurrentCompany ? 7 : 5} 
                            fill={companyColors[company.surveyId]}
                            stroke={company.isCurrentCompany ? '#1E3A8A' : 'white'}
                            strokeWidth={company.isCurrentCompany ? 2 : 1} />
                    <text x={18} y={10} fill="#475569" fontSize="10" fontWeight={company.isCurrentCompany ? '600' : '400'}>
                      {company.name.length > 20 ? company.name.slice(0, 18) + '...' : company.name}
                      {company.isCurrentCompany && ' (current)'}
                    </text>
                  </g>
                ))}
                {companies.length > 8 && (
                  <text x={0} y={66} fill="#94A3B8" fontSize="10">+{companies.length - 8} more companies</text>
                )}
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ExportReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const exportMode = searchParams?.get('export') === '1';
  const mode = (searchParams?.get('mode') || '').toLowerCase();
  const isPdf = exportMode && mode === 'pdf';
  const isPpt = exportMode && (mode === 'ppt' || mode === 'pptslides');
  const isPptReport = exportMode && mode === 'pptreport';

  const surveyId = Array.isArray(params.surveyId) ? params.surveyId[0] : params.surveyId;
  const printRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [companyScores, setCompanyScores] = useState<any>(null);
  const [elementDetails, setElementDetails] = useState<any>(null);
  const [percentileRank, setPercentileRank] = useState<number | null>(null);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);
  const [showBenchmarkChart, setShowBenchmarkChart] = useState(false);
  const [allCompanyScores, setAllCompanyScores] = useState<{
    name: string;
    surveyId: string;
    dimensionScores: Record<number, number>;
    compositeScore: number;
    isCurrentCompany: boolean;
  }[]>([]);
  
  // Edit Mode State
  const [editMode, setEditMode] = useState(false);
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
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
      } catch (e) {
        console.error('Error loading customizations:', e);
      }
    }
  }, [company]);

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
        // Normalize survey ID for flexible matching
        const normalizedId = surveyId.replace(/-/g, '').toUpperCase();
        const fpFormat = surveyId.startsWith('FP-') ? surveyId : 
                        surveyId.toUpperCase().startsWith('FPHR') ? 
                        `FP-HR-${surveyId.replace(/^FPHR/i, '')}` : surveyId;
        
        // Try multiple formats: exact, normalized, FP format, and app_id
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .or(`survey_id.eq.${surveyId},survey_id.eq.${normalizedId},survey_id.eq.${fpFormat},app_id.eq.${surveyId},app_id.eq.${normalizedId}`)
          .limit(1)
          .maybeSingle();
        
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
          
          // Build company comparison data (excluding Panel companies from display)
          const companyData: typeof allCompanyScores = [];
          for (const a of completeAssessments) {
            const isPanel = (a.survey_id || '').startsWith('PANEL-') || (a.app_id || '').startsWith('PANEL-');
            if (isPanel) continue; // Exclude Panel from visualization
            
            try {
              const { scores } = calculateCompanyScores(a);
              if (scores.compositeScore !== null) {
                companyData.push({
                  name: a.company_name || a.survey_id || 'Unknown',
                  surveyId: a.survey_id,
                  dimensionScores: scores.dimensionScores || {},
                  compositeScore: scores.compositeScore,
                  isCurrentCompany: a.survey_id === assessment.survey_id
                });
              }
            } catch { /* skip invalid */ }
          }
          setAllCompanyScores(companyData.sort((a, b) => b.compositeScore - a.compositeScore));
          
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


  // ============================================
  // SERVER EXPORT BUTTONS (Netlify Functions)
  // ============================================
  function handleServerExportPDF() {
    const url = `/.netlify/functions/export-pdf?surveyId=${encodeURIComponent(String(surveyId || ''))}`;
    window.open(url, '_blank');
  }

  function handleServerExportPPT() {
    const url = `/.netlify/functions/export-pptx?surveyId=${encodeURIComponent(String(surveyId || ''))}`;
    window.open(url, '_blank');
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

  if (error || !company || !companyScores) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center max-w-md">
          <p className="text-red-600 text-lg mb-2">{error || 'Unable to generate report'}</p>
          <p className="text-slate-500 text-sm">Survey ID: {surveyId || 'not provided'}</p>
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

  // Order from lowest to highest so .find() returns the immediate next tier up
  const tierThresholds = [{ name: 'Emerging', min: 40 }, { name: 'Progressing', min: 60 }, { name: 'Leading', min: 75 }, { name: 'Exemplary', min: 90 }];
  const nextTierUp = tierThresholds.find(t => t.min > (compositeScore || 0));
  const pointsToNextTier = nextTierUp ? nextTierUp.min - (compositeScore || 0) : null;

  return (
    <div className={`min-h-screen bg-gray-50 ${exportMode ? 'export-mode' : ''} ${isPdf ? 'pdf-export-mode' : ''} ${isPpt ? 'ppt-export-mode' : ''} ${isPptReport ? 'ppt-report-mode' : ''}`}>
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

        .bg-gray-50 {
          background-color: #f9fafb !important;
        }
        
        /* Force all content sections to avoid page breaks */
        .rounded-lg {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Strategic Priority Matrix - ensure legend is not truncated */
        .matrix-legend {
          flex-wrap: wrap !important;
        }
        .matrix-legend span {
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
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



      {/* Action Bar */}
      <div className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-3">
            {/* Edit Mode Toggle */}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                editMode 
                  ? 'bg-amber-100 text-amber-800 border-2 border-amber-400' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent'
              }`}
              title={editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {editMode ? 'Editing' : 'Edit'}
            </button>
            
            {/* Save/Reset buttons - only show in edit mode */}
            {editMode && (
              <>
                <button
                  onClick={saveEdits}
                  disabled={savingEdits || !hasUnsavedChanges}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                    hasUnsavedChanges 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Save customizations"
                >
                  {savingEdits ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Save
                </button>
                <button
                  onClick={resetEdits}
                  className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-2"
                  title="Reset to auto-generated content"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </>
            )}
            
            <div className="w-px h-8 bg-slate-200" />
            
            {/* Benchmark Comparison Button */}
            <button
              onClick={() => setShowBenchmarkChart(true)}
              className="px-4 py-2 rounded-lg font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center gap-2"
              title="Compare all companies against benchmarks"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare All
            </button>
            
            <div className="w-px h-8 bg-slate-200" />
            
            <button
              onClick={handleServerExportPPT}
              className="px-5 py-2 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white"
              title="Export PowerPoint"
            >
              Export PowerPoint
            </button>
            <button
              onClick={handleServerExportPDF}
              className="px-5 py-2 rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-white"
              title="Export PDF"
            >
              Export PDF
            </button>
          </div>
        </div>
        
        {/* Edit Mode Banner */}
        {editMode && (
          <div className="bg-amber-50 border-t border-amber-200 px-8 py-3">
            <div className="max-w-6xl mx-auto flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-amber-800">
                <strong>Edit Mode:</strong> Edit strategic insights and recommended actions. Changes are saved to the database and will appear in exported reports.
                {hasUnsavedChanges && <span className="ml-2 text-amber-600 font-medium">• Unsaved changes</span>}
              </p>
            </div>
          </div>
        )}
      </div>

      <div ref={printRef} id="report-root" className="max-w-6xl mx-auto py-10 px-8">
        
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
                <p className="text-3xl font-bold text-slate-800" data-export="metric-leading-plus">{tierCounts.exemplary + tierCounts.leading}</p>
                <p className="text-sm text-slate-500 mt-1">dimensions at Leading+</p>
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
                        Recommended Action
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
                                value={customRecommendations[r.dimNum] ?? r.recommendation}
                                onChange={(e) => updateCustomRecommendation(r.dimNum, e.target.value)}
                                className="w-full text-sm text-slate-600 bg-amber-50 border border-amber-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                placeholder="Enter custom recommendation..."
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
                            <p className="text-sm text-slate-600">{customRecommendations[r.dimNum] || r.recommendation}</p>
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
                      <p className="text-sm text-slate-600 italic">{benchmarkNarrative}</p>
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
              );
            })}
          </div>
        </div>

        {/* ============ IMPLEMENTATION ROADMAP ============ */}
        <div className="ppt-break bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 pdf-break-before pdf-no-break">
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
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-4">
                    Accelerate items already in progress
                    {editMode && <span className="ml-2 text-amber-600 normal-case">(editable)</span>}
                  </p>
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
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-4">
                    Address high-weight dimension gaps
                    {editMode && <span className="ml-2 text-amber-600 normal-case">(editable)</span>}
                  </p>
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
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-4">
                    Address remaining lower-priority gaps
                    {editMode && <span className="ml-2 text-amber-600 normal-case">(editable)</span>}
                  </p>
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

        {/* ============ METHODOLOGY & FOOTER ============ */}
        <div className="ppt-break bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-0 pdf-no-break" id="appendix-end" data-export="appendix-end">
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
          
          {/* Footer integrated */}
          <div className="px-10 py-4 border-t border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-slate-700">Best Companies for Working with Cancer Index</p>
                <p className="text-xs text-slate-400">© 2026 Cancer and Careers. All rights reserved.</p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <p className="text-xs text-slate-400">Survey ID: {surveyId}</p>
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

      {/* Benchmark Comparison Chart Modal */}
      {showBenchmarkChart && benchmarks && (
        <BenchmarkComparisonChart
          companies={allCompanyScores}
          benchmarks={benchmarks.dimensionScores || {}}
          dimensionWeights={DEFAULT_DIMENSION_WEIGHTS}
          onClose={() => setShowBenchmarkChart(false)}
        />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border ${
            toast.type === 'success' 
              ? 'bg-white border-green-200' 
              : 'bg-white border-red-200'
          }`}>
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 p-1">
              <Image src="/BI_LOGO_FINAL.png" alt="BEYOND Insights" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <p className={`font-semibold text-sm ${
                toast.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {toast.type === 'success' ? 'Success' : 'Error'}
              </p>
              <p className="text-sm text-slate-600">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="ml-2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

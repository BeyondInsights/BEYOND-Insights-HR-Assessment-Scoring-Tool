'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

// ============================================
// CONSTANTS - EXACT COPY FROM SCORING PAGE
// ============================================

const DEFAULT_DIMENSION_WEIGHTS: Record<number, number> = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3,
};

const DEFAULT_COMPOSITE_WEIGHTS = {
  weightedDim: 90,
  maturity: 5,
  breadth: 5,
};

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
  1: 'Leave & Flexibility',
  2: 'Insurance & Financial',
  3: 'Manager Preparedness',
  4: 'Navigation',
  5: 'Accommodations',
  6: 'Culture',
  7: 'Career Continuity',
  8: 'Work Continuation',
  9: 'Executive Commitment',
  10: 'Caregiver Support',
  11: 'Prevention & Wellness',
  12: 'Continuous Improvement',
  13: 'Communication',
};

const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };

const D10_EXCLUDED_ITEMS = [
  'Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'
];

// ============================================
// SCORING FUNCTIONS - EXACT COPY FROM SCORING PAGE
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

// Follow-up scoring functions
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
      if (d12_2) scores.push(scoreD12PolicyChanges(d12_2));
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
  const currentSupport = assessment.current_support_data || {};
  const generalBenefits = assessment.general_benefits_data || {};
  
  const scores: number[] = [];
  
  const cb3a = currentSupport.cb3a ?? generalBenefits.cb3a;
  
  if (cb3a === 3 || cb3a === '3') {
    scores.push(100);
  } else if (cb3a === 2 || cb3a === '2') {
    scores.push(50);
  } else if (cb3a === 1 || cb3a === '1') {
    scores.push(0);
  } else if (cb3a !== undefined && cb3a !== null) {
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
  
  const cb3b = currentSupport.cb3b || generalBenefits.cb3b;
  if (cb3b && Array.isArray(cb3b)) {
    const cb3bScore = Math.min(100, Math.round((cb3b.length / 6) * 100));
    scores.push(cb3bScore);
  } else {
    scores.push(0);
  }
  
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
// STRATEGIC INSIGHT GENERATION ENGINE
// This is where McKinsey-level analysis happens
// ============================================

interface DimensionAnalysis {
  dim: number;
  name: string;
  shortName: string;
  score: number;
  weight: number;
  benchmark: number;
  tier: { name: string; color: string; bgColor: string; textColor: string; borderColor: string };
  elements: any[];
  strengths: any[];
  planning: any[];
  assessing: any[];
  gaps: any[];
  unsure: any[];
  unsureRate: number; // % of items marked unsure
  gapRate: number; // % of items marked gap
}

interface StrategicPattern {
  type: 'strength_gap_mismatch' | 'visibility_blind_spot' | 'access_barrier' | 'investment_underutilization' | 'foundation_missing' | 'quick_win_available';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  insight: string;
  affectedDimensions: number[];
  cacRecommendation: string;
}

function generateStrategicPatterns(dimensionAnalysis: DimensionAnalysis[], companyName: string): StrategicPattern[] {
  const patterns: StrategicPattern[] = [];
  
  const sorted = [...dimensionAnalysis].sort((a, b) => b.score - a.score);
  const strongest = sorted.slice(0, 3);
  const weakest = sorted.slice(-3).reverse();
  
  // Get high-weight dimensions (strategic importance)
  const highWeightDims = dimensionAnalysis.filter(d => d.weight >= 10); // D4, D8, D3, D2, D13
  const highWeightWeak = highWeightDims.filter(d => d.score < 50);
  
  // Pattern 1: High-weight dimensions that are weak (CRITICAL)
  if (highWeightWeak.length > 0) {
    const dims = highWeightWeak.map(d => d.dim);
    const dimNames = highWeightWeak.map(d => d.shortName).join(', ');
    const totalWeight = highWeightWeak.reduce((sum, d) => sum + d.weight, 0);
    
    patterns.push({
      type: 'foundation_missing',
      severity: 'critical',
      title: 'Strategic Foundation Gaps',
      insight: `${companyName}'s weakest scores are in dimensions that carry ${totalWeight}% of the total assessment weight: ${dimNames}. These are not peripheral concerns—they represent the core infrastructure of workplace cancer support. Until these foundations are addressed, investments in other areas will yield diminished returns.`,
      affectedDimensions: dims,
      cacRecommendation: `Cancer and Careers recommends prioritizing ${highWeightWeak[0]?.shortName || 'foundational dimensions'} as the first phase of your improvement roadmap. Our consultants can conduct a rapid diagnostic to identify the specific gaps preventing progress and design an implementation plan that builds these critical capabilities.`
    });
  }
  
  // Pattern 2: High "Unsure" rate indicates visibility blind spot
  const highUnsureDims = dimensionAnalysis.filter(d => d.unsureRate >= 40);
  if (highUnsureDims.length > 0) {
    const dims = highUnsureDims.map(d => d.dim);
    const dimNames = highUnsureDims.map(d => `${d.shortName} (${Math.round(d.unsureRate)}% unsure)`).join(', ');
    
    patterns.push({
      type: 'visibility_blind_spot',
      severity: 'high',
      title: 'Organizational Visibility Gap',
      insight: `High "Unsure" response rates in ${dimNames} reveal a critical visibility gap. This typically indicates one of three scenarios: programs exist but leadership lacks awareness; program ownership is fragmented across departments; or there's a disconnect between policy documentation and actual practice. This uncertainty itself creates risk—employees may not know what support is available, and the organization cannot measure what it cannot see.`,
      affectedDimensions: dims,
      cacRecommendation: `Cancer and Careers can help ${companyName} conduct a program audit to map existing resources, clarify ownership, and identify communication gaps. Our experience shows that many organizations discover they have more support infrastructure than they realized—the challenge is making it visible and accessible.`
    });
  }
  
  // Pattern 3: Strong policies but weak access (D1/D2 strong but D4 weak)
  const d1Score = dimensionAnalysis.find(d => d.dim === 1)?.score || 0;
  const d2Score = dimensionAnalysis.find(d => d.dim === 2)?.score || 0;
  const d4Score = dimensionAnalysis.find(d => d.dim === 4)?.score || 0;
  
  if ((d1Score >= 50 || d2Score >= 50) && d4Score < 40) {
    patterns.push({
      type: 'access_barrier',
      severity: 'high',
      title: 'Benefits Access Barrier',
      insight: `${companyName} has invested in ${d1Score >= 50 ? 'leave policies' : ''}${d1Score >= 50 && d2Score >= 50 ? ' and ' : ''}${d2Score >= 50 ? 'financial protection' : ''}, but your Navigation & Expert Resources score of ${d4Score} suggests employees may struggle to access these benefits. Research consistently shows that benefit utilization rates are directly tied to navigation support. Your current investment in policies may be underperforming simply because employees don't know how to use them.`,
      affectedDimensions: [4, ...(d1Score >= 50 ? [1] : []), ...(d2Score >= 50 ? [2] : [])],
      cacRecommendation: `Cancer and Careers can help design a single-entry-point navigation model that maximizes utilization of your existing benefits investment. Our approach includes resource mapping, communication strategy, and—where appropriate—connecting you with navigation service providers.`
    });
  }
  
  // Pattern 4: Manager training gap with strong policies
  const d3Score = dimensionAnalysis.find(d => d.dim === 3)?.score || 0;
  const d8Score = dimensionAnalysis.find(d => d.dim === 8)?.score || 0;
  
  if (d3Score < 40 && (d1Score >= 50 || d8Score >= 50)) {
    patterns.push({
      type: 'investment_underutilization',
      severity: 'high',
      title: 'Manager Capability Gap',
      insight: `${companyName} has strong ${d1Score >= 50 ? 'leave policies' : ''}${d1Score >= 50 && d8Score >= 50 ? ' and ' : ''}${d8Score >= 50 ? 'return-to-work programs' : ''}, but a Manager Preparedness score of ${d3Score} means front-line managers may lack the confidence and skills to have supportive conversations with affected employees. Managers are the primary interface between employees and organizational support—their preparedness directly determines whether policies translate into positive employee experiences.`,
      affectedDimensions: [3, ...(d1Score >= 50 ? [1] : []), ...(d8Score >= 50 ? [8] : [])],
      cacRecommendation: `Cancer and Careers' signature manager training program equips managers with conversation frameworks, scenario-based learning, and practical toolkits. Organizations that complete our training report significant improvements in manager confidence and employee satisfaction with support.`
    });
  }
  
  // Pattern 5: Quick wins available (planning/assessing items in high-weight dimensions)
  const quickWinDims = dimensionAnalysis.filter(d => 
    d.weight >= 8 && (d.planning.length > 0 || d.assessing.length > 0)
  );
  
  if (quickWinDims.length > 0) {
    const totalInProgress = quickWinDims.reduce((sum, d) => sum + d.planning.length + d.assessing.length, 0);
    const dimNames = quickWinDims.map(d => d.shortName).slice(0, 3).join(', ');
    
    patterns.push({
      type: 'quick_win_available',
      severity: 'medium',
      title: 'Conversion Opportunities',
      insight: `${companyName} has ${totalInProgress} initiatives currently in planning or assessment phases across ${dimNames}. Converting these to active programs represents the fastest path to score improvement—the organizational groundwork and stakeholder buy-in already exist. Each converted initiative could add 2-3 points per item to the affected dimension score.`,
      affectedDimensions: quickWinDims.map(d => d.dim),
      cacRecommendation: `Cancer and Careers can help accelerate implementation of in-progress initiatives by providing implementation playbooks, vendor evaluation support, and change management guidance.`
    });
  }
  
  // Pattern 6: Culture and Communication alignment
  const d6Score = dimensionAnalysis.find(d => d.dim === 6)?.score || 0;
  const d13Score = dimensionAnalysis.find(d => d.dim === 13)?.score || 0;
  
  if (d6Score < 50 && d13Score < 50) {
    patterns.push({
      type: 'strength_gap_mismatch',
      severity: 'medium',
      title: 'Cultural Foundation Gap',
      insight: `Both Culture & Psychological Safety (${d6Score}) and Communication & Awareness (${d13Score}) score below 50, indicating a foundational challenge. Employees may not feel safe disclosing a cancer diagnosis, and even when they do, they may not know what support is available. This creates a compounding effect where organizational resources remain underutilized and employees navigate their journey alone.`,
      affectedDimensions: [6, 13],
      cacRecommendation: `Cancer and Careers can help ${companyName} develop a stigma-reduction initiative combined with a communication strategy that normalizes seeking support. Our approach includes leadership messaging, employee resource group guidance, and awareness campaign frameworks.`
    });
  }
  
  return patterns.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// Generate the executive narrative based on patterns
function generateExecutiveNarrative(
  companyName: string,
  compositeScore: number,
  tier: any,
  dimensionAnalysis: DimensionAnalysis[],
  patterns: StrategicPattern[]
): string {
  const sorted = [...dimensionAnalysis].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  
  const highUnsureCount = dimensionAnalysis.filter(d => d.unsureRate >= 40).length;
  const criticalPatterns = patterns.filter(p => p.severity === 'critical');
  
  let narrative = `${companyName} achieves a composite score of ${compositeScore}, placing the organization in the ${tier?.name || 'Emerging'} performance tier. `;
  
  // Add strength acknowledgment
  if (strongest && strongest.score >= 60) {
    narrative += `The organization demonstrates notable capability in ${strongest.name} (${strongest.score}), `;
    if (strongest.strengths.length > 0) {
      narrative += `with established programs including ${strongest.strengths.slice(0, 2).map((s: any) => s.name.toLowerCase()).join(' and ')}. `;
    }
  }
  
  // Add critical gap callout
  if (weakest && weakest.score < 40) {
    narrative += `However, ${weakest.name} represents a significant opportunity for improvement at ${weakest.score}. `;
  }
  
  // Add visibility concern if applicable
  if (highUnsureCount >= 2) {
    narrative += `A notable finding is the high proportion of "Unsure" responses across ${highUnsureCount} dimensions, suggesting potential gaps in organizational visibility into existing programs. `;
  }
  
  // Add strategic framing
  if (criticalPatterns.length > 0) {
    narrative += `The assessment identifies ${criticalPatterns.length} critical strategic ${criticalPatterns.length === 1 ? 'issue' : 'issues'} requiring immediate attention. `;
  }
  
  return narrative;
}

// Generate CAC help section tailored to the company's specific gaps
function generateTailoredCACHelp(patterns: StrategicPattern[], weakestDims: DimensionAnalysis[]): { title: string; services: string[]; color: string }[] {
  const cacHelp: { title: string; services: string[]; color: string }[] = [];
  
  // Map specific dimension gaps to CAC service offerings
  const dimServiceMap: Record<number, { title: string; services: string[]; color: string }> = {
    1: {
      title: 'Leave Policy Enhancement',
      services: ['Leave policy benchmarking analysis', 'Flexibility framework design', 'FMLA+ enhancement strategies'],
      color: 'emerald'
    },
    2: {
      title: 'Financial Protection Advisory',
      services: ['Benefits gap analysis', 'Supplemental coverage recommendations', 'Financial wellness integration planning'],
      color: 'blue'
    },
    3: {
      title: 'Manager Training & Development',
      services: ['Live training with case studies', 'Manager conversation toolkit', 'Train-the-trainer certification'],
      color: 'amber'
    },
    4: {
      title: 'Navigation Architecture Design',
      services: ['Resource audit and mapping', 'Single entry point design', 'Vendor evaluation support'],
      color: 'purple'
    },
    5: {
      title: 'Accommodations Framework',
      services: ['Accommodation workflow design', 'Interactive process guidance', 'Technology accommodation planning'],
      color: 'teal'
    },
    6: {
      title: 'Culture & Stigma Reduction',
      services: ['Psychological safety assessment', 'Stigma reduction initiative design', 'ERG development support'],
      color: 'indigo'
    },
    7: {
      title: 'Career Continuity Planning',
      services: ['Career protection frameworks', 'Performance review guidance', 'Advancement pathway design'],
      color: 'sky'
    },
    8: {
      title: 'Return-to-Work Excellence',
      services: ['Phased return protocols', 'Check-in cadence design', 'Reintegration planning'],
      color: 'rose'
    },
    9: {
      title: 'Executive Engagement',
      services: ['Leadership briefing materials', 'Business case development', 'Sponsor engagement strategy'],
      color: 'slate'
    },
    10: {
      title: 'Caregiver Support Programs',
      services: ['Caregiver resource mapping', 'Flexible work arrangement guidance', 'Support group facilitation'],
      color: 'pink'
    },
    13: {
      title: 'Communication Strategy',
      services: ['Awareness campaign design', 'Resource communication planning', 'Leadership messaging frameworks'],
      color: 'orange'
    }
  };
  
  // Add services for the weakest dimensions
  weakestDims.slice(0, 4).forEach(dim => {
    const service = dimServiceMap[dim.dim];
    if (service) {
      cacHelp.push(service);
    }
  });
  
  return cacHelp;
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
  if (score >= 90) return '#7C3AED';
  if (score >= 75) return '#059669';
  if (score >= 60) return '#0284C7';
  if (score >= 40) return '#D97706';
  return '#DC2626';
}

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const AlertIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const LightbulbIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zm4.657 2.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm3 6v-1h4v1a2 2 0 11-4 0zm4-2c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
  </svg>
);

// ============================================
// STRATEGIC PRIORITY MATRIX
// ============================================

function StrategicPriorityMatrix({ dimensionAnalysis, getScoreColor }: { dimensionAnalysis: DimensionAnalysis[]; getScoreColor: (score: number) => string }) {
  const maxWeight = Math.max(...dimensionAnalysis.map(d => d.weight));
  const minWeight = Math.min(...dimensionAnalysis.map(d => d.weight));
  const weightRange = maxWeight - minWeight || 1;
  const weightThreshold = (maxWeight + minWeight) / 2;
  
  return (
    <div className="px-10 py-8">
      <div className="relative" style={{ height: '520px' }}>
        <svg className="w-full h-full" viewBox="0 0 900 480" preserveAspectRatio="xMidYMid meet">
          <defs>
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
            <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25"/>
            </filter>
          </defs>
          
          <g transform="translate(70, 20)">
            <rect x="0" y="0" width="360" height="195" fill="url(#developGrad)" rx="6" />
            <rect x="360" y="0" width="360" height="195" fill="url(#maintainGrad)" rx="6" />
            <rect x="0" y="195" width="360" height="195" fill="url(#monitorGrad)" rx="6" />
            <rect x="360" y="195" width="360" height="195" fill="url(#leverageGrad)" rx="6" />
            
            <g stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.6">
              <line x1="180" y1="0" x2="180" y2="390" />
              <line x1="540" y1="0" x2="540" y2="390" />
              <line x1="0" y1="97.5" x2="720" y2="97.5" />
              <line x1="0" y1="292.5" x2="720" y2="292.5" />
            </g>
            
            <line x1="360" y1="0" x2="360" y2="390" stroke="#94A3B8" strokeWidth="2" />
            <line x1="0" y1="195" x2="720" y2="195" stroke="#94A3B8" strokeWidth="2" />
            
            <rect x="0" y="0" width="720" height="390" fill="none" stroke="#CBD5E1" strokeWidth="2" rx="6" />
            
            <g opacity="0.3">
              <text x="180" y="90" textAnchor="middle" fill="#B45309" fontSize="20" fontWeight="700">DEVELOP</text>
              <text x="180" y="112" textAnchor="middle" fill="#B45309" fontSize="12">High Priority Gaps</text>
              
              <text x="540" y="90" textAnchor="middle" fill="#047857" fontSize="20" fontWeight="700">MAINTAIN</text>
              <text x="540" y="112" textAnchor="middle" fill="#047857" fontSize="12">Protect Strengths</text>
              
              <text x="180" y="285" textAnchor="middle" fill="#64748B" fontSize="20" fontWeight="700">MONITOR</text>
              <text x="180" y="307" textAnchor="middle" fill="#64748B" fontSize="12">Lower Priority</text>
              
              <text x="540" y="285" textAnchor="middle" fill="#0369A1" fontSize="20" fontWeight="700">LEVERAGE</text>
              <text x="540" y="307" textAnchor="middle" fill="#0369A1" fontSize="12">Quick Wins</text>
            </g>
            
            {dimensionAnalysis.map((d) => {
              const xPos = (d.score / 100) * 720;
              const yPos = 390 - (((d.weight - minWeight) / weightRange) * 390);
              
              return (
                <g key={d.dim} transform={`translate(${xPos}, ${yPos})`}>
                  <circle r="24" fill="white" filter="url(#dropShadow)" />
                  <circle r="20" fill={getScoreColor(d.score)} />
                  <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="13" fontWeight="700">
                    D{d.dim}
                  </text>
                </g>
              );
            })}
            
            <g transform="translate(0, 390)">
              <line x1="0" y1="0" x2="720" y2="0" stroke="#94A3B8" strokeWidth="2" />
              {[0, 25, 50, 75, 100].map((val) => (
                <g key={val} transform={`translate(${val * 7.2}, 0)`}>
                  <line y1="0" y2="8" stroke="#94A3B8" strokeWidth="2" />
                  <text y="24" textAnchor="middle" fill="#64748B" fontSize="12" fontWeight="500">{val}</text>
                </g>
              ))}
              <text x="360" y="48" textAnchor="middle" fill="#475569" fontSize="13" fontWeight="600">
                CURRENT PERFORMANCE SCORE
              </text>
            </g>
          </g>
          
          <g transform="translate(70, 20)">
            <line x1="0" y1="0" x2="0" y2="390" stroke="#94A3B8" strokeWidth="2" />
            <g>
              <line x1="-8" y1="0" x2="0" y2="0" stroke="#94A3B8" strokeWidth="2" />
              <text x="-12" y="5" textAnchor="end" fill="#64748B" fontSize="12" fontWeight="500">{maxWeight}%</text>
              
              <line x1="-8" y1="195" x2="0" y2="195" stroke="#94A3B8" strokeWidth="2" />
              <text x="-12" y="200" textAnchor="end" fill="#64748B" fontSize="12" fontWeight="500">{Math.round(weightThreshold)}%</text>
              
              <line x1="-8" y1="390" x2="0" y2="390" stroke="#94A3B8" strokeWidth="2" />
              <text x="-12" y="395" textAnchor="end" fill="#64748B" fontSize="12" fontWeight="500">{minWeight}%</text>
            </g>
            
            <text transform="rotate(-90)" x="-195" y="-45" textAnchor="middle" fill="#475569" fontSize="13" fontWeight="600">
              STRATEGIC WEIGHT
            </text>
          </g>
        </svg>
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-4 gap-3">
          {[...dimensionAnalysis].sort((a, b) => a.dim - b.dim).map(d => (
            <div key={d.dim} className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: getScoreColor(d.score) }}>
                D{d.dim}
              </span>
              <span className="text-sm text-slate-600 truncate">{d.shortName}</span>
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
  const [dimensionAnalysis, setDimensionAnalysis] = useState<DimensionAnalysis[]>([]);
  const [strategicPatterns, setStrategicPatterns] = useState<StrategicPattern[]>([]);
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
        
        const { data: allAssessments } = await supabase.from('assessments').select('*');
        
        const { scores, analysis } = calculateCompanyScores(assessment);
        setCompanyScores(scores);
        setDimensionAnalysis(analysis);
        setCompany(assessment);
        
        // Generate strategic patterns
        const patterns = generateStrategicPatterns(analysis, assessment.company_name || 'Company');
        setStrategicPatterns(patterns);
        
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
    const blendedScores: Record<number, number> = {};
    const analysis: DimensionAnalysis[] = [];
    
    let completedDimCount = 0;
    
    for (let dim = 1; dim <= 13; dim++) {
      const dimData = assessment[`dimension${dim}_data`];
      const mainGrid = dimData?.[`d${dim}a`];
      
      const elements: any[] = [];
      blendedScores[dim] = 0;
      
      if (!mainGrid || typeof mainGrid !== 'object') {
        dimensionScores[dim] = null;
        analysis.push({
          dim,
          name: DIMENSION_NAMES[dim] || `Dimension ${dim}`,
          shortName: DIMENSION_SHORT_NAMES[dim] || `D${dim}`,
          score: 0,
          weight: DEFAULT_DIMENSION_WEIGHTS[dim] || 0,
          benchmark: 0,
          tier: getTier(0),
          elements: [],
          strengths: [],
          planning: [],
          assessing: [],
          gaps: [],
          unsure: [],
          unsureRate: 0,
          gapRate: 0,
        });
        continue;
      }
      
      let earnedPoints = 0;
      let totalItems = 0;
      let answeredItems = 0;
      let unsureCount = 0;
      let gapCount = 0;
      
      const strengths: any[] = [];
      const planning: any[] = [];
      const assessing: any[] = [];
      const gaps: any[] = [];
      const unsure: any[] = [];
      
      Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
        if (dim === 10 && D10_EXCLUDED_ITEMS.includes(itemKey)) return;
        
        totalItems++;
        const result = statusToPoints(status);
        
        const element = {
          name: itemKey,
          status: getStatusText(status),
          category: result.category,
          points: result.points ?? 0,
          maxPoints: 5,
        };
        
        elements.push(element);
        
        if (result.isUnsure) {
          answeredItems++;
          unsureCount++;
          unsure.push(element);
        } else if (result.points !== null) {
          answeredItems++;
          earnedPoints += result.points;
          
          if (result.category === 'currently_offer') strengths.push(element);
          else if (result.category === 'planning') planning.push(element);
          else if (result.category === 'assessing') assessing.push(element);
          else if (result.category === 'not_able') {
            gaps.push(element);
            gapCount++;
          }
        }
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
      
      analysis.push({
        dim,
        name: DIMENSION_NAMES[dim] || `Dimension ${dim}`,
        shortName: DIMENSION_SHORT_NAMES[dim] || `D${dim}`,
        score: blendedScore,
        weight: DEFAULT_DIMENSION_WEIGHTS[dim] || 0,
        benchmark: 0,
        tier: getTier(blendedScore),
        elements,
        strengths,
        planning,
        assessing,
        gaps,
        unsure,
        unsureRate: totalItems > 0 ? (unsureCount / totalItems) * 100 : 0,
        gapRate: totalItems > 0 ? (gapCount / totalItems) * 100 : 0,
      });
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
      ? Math.round(
          (weightedDimScore * (DEFAULT_COMPOSITE_WEIGHTS.weightedDim / 100)) +
          (maturityScore * (DEFAULT_COMPOSITE_WEIGHTS.maturity / 100)) +
          (breadthScore * (DEFAULT_COMPOSITE_WEIGHTS.breadth / 100))
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
      analysis: analysis.sort((a, b) => b.score - a.score)
    };
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

  function handlePrint() { window.print(); }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
          <p className="mt-4 text-slate-600">Generating strategic report...</p>
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
  
  // Statistics
  const allElements = dimensionAnalysis.flatMap(d => d.elements);
  const totalElements = allElements.length;
  const currentlyOffering = dimensionAnalysis.reduce((sum, d) => sum + d.strengths.length, 0);
  const planningItems = dimensionAnalysis.reduce((sum, d) => sum + d.planning.length, 0);
  const assessingItems = dimensionAnalysis.reduce((sum, d) => sum + d.assessing.length, 0);
  const gapItems = dimensionAnalysis.reduce((sum, d) => sum + d.gaps.length, 0);
  
  const strengthDimensions = dimensionAnalysis.filter(d => d.tier.name === 'Exemplary' || d.tier.name === 'Leading');
  const opportunityDimensions = [...dimensionAnalysis].filter(d => d.tier.name !== 'Exemplary' && d.tier.name !== 'Leading').sort((a, b) => a.score - b.score);
  
  // Generate executive narrative
  const executiveNarrative = generateExecutiveNarrative(companyName, compositeScore || 0, tier, dimensionAnalysis, strategicPatterns);
  
  // Generate tailored CAC help
  const tailoredCACHelp = generateTailoredCACHelp(strategicPatterns, opportunityDimensions);

  return (
    <div className="min-h-screen bg-slate-100">
      <style jsx global>{`
        @media print {
          @page { margin: 0.75in; size: letter; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
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
                  <p className="text-slate-400 text-sm font-medium tracking-wider uppercase">Strategic Assessment</p>
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

          {/* STRATEGIC EXECUTIVE SUMMARY - The McKinsey narrative */}
          <div className="px-10 py-8 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Strategic Assessment</h3>
            <p className="text-slate-700 leading-relaxed text-lg">
              {executiveNarrative}
            </p>
            
            <div className="mt-6 grid grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-emerald-600">{currentlyOffering}</p>
                <p className="text-sm text-slate-500 mt-1">of {totalElements} elements currently offered</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-blue-600">{planningItems + assessingItems}</p>
                <p className="text-sm text-slate-500 mt-1">initiatives in pipeline</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-amber-600">{gapItems}</p>
                <p className="text-sm text-slate-500 mt-1">identified gaps</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-3xl font-bold text-purple-600">{strengthDimensions.length}</p>
                <p className="text-sm text-slate-500 mt-1">dimensions at Leading+</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ STRATEGIC PATTERNS - The McKinsey insights ============ */}
        {strategicPatterns.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-10 py-6 bg-gradient-to-r from-slate-800 to-slate-700">
              <h3 className="font-semibold text-white text-lg">Strategic Analysis</h3>
              <p className="text-slate-300 text-sm mt-1">Key patterns and insights from your assessment data</p>
            </div>
            <div className="px-10 py-6 space-y-8">
              {strategicPatterns.map((pattern, idx) => (
                <div key={idx} className={`border-l-4 pl-6 py-2 ${
                  pattern.severity === 'critical' ? 'border-red-500' :
                  pattern.severity === 'high' ? 'border-amber-500' : 'border-blue-500'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {pattern.severity === 'critical' && <AlertIcon className="w-5 h-5 text-red-500" />}
                    {pattern.severity === 'high' && <AlertIcon className="w-5 h-5 text-amber-500" />}
                    {pattern.severity === 'medium' && <LightbulbIcon className="w-5 h-5 text-blue-500" />}
                    <h4 className="font-semibold text-slate-800">{pattern.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      pattern.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      pattern.severity === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {pattern.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-4">{pattern.insight}</p>
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <p className="text-sm text-purple-800 font-medium mb-1">How Cancer and Careers Can Help</p>
                    <p className="text-sm text-purple-700">{pattern.cacRecommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ DIMENSION PERFORMANCE ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-10 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Dimension Performance Overview</h3>
            <p className="text-sm text-slate-500 mt-1">Detailed scores across all 13 assessment dimensions</p>
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
              const benchmark = benchmarks?.dimensionScores?.[d.dim] ?? 0;
              const diff = benchmark ? d.score - benchmark : 0;
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
                      {benchmark > 0 && (
                        <div className="absolute -top-1 flex flex-col items-center" style={{ left: `${Math.min(benchmark, 100)}%`, transform: 'translateX(-50%)' }}>
                          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-14 text-right"><span className="text-sm font-semibold" style={{ color: getScoreColor(d.score) }}>{d.score}</span></div>
                  <div className="w-20 text-center">
                    <span className="text-xs text-slate-500">{benchmark || '—'}</span>
                    {benchmark > 0 && <span className={`text-xs ml-1 ${diff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>({diff >= 0 ? '+' : ''}{diff})</span>}
                  </div>
                  <div className="w-20 text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${d.tier.bgColor} ${d.tier.textColor}`}>{d.tier.name}</span>
                  </div>
                </div>
              );
            })}
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

        {/* ============ TAILORED CAC SERVICES ============ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8 print-break">
          <div className="px-10 py-6 bg-gradient-to-r from-purple-700 to-purple-600">
            <h3 className="font-semibold text-white text-lg">How Cancer and Careers Can Help {companyName}</h3>
            <p className="text-purple-200 text-sm mt-1">Tailored services based on your specific assessment results</p>
          </div>
          <div className="px-10 py-6">
            <p className="text-slate-600 mb-6 leading-relaxed">
              Based on {companyName}'s assessment results, Cancer and Careers recommends focusing on the following service areas to maximize impact on your workplace cancer support capabilities.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {tailoredCACHelp.map((service, idx) => (
                <div key={idx} className={`bg-${service.color}-50 border border-${service.color}-200 rounded-lg p-4`}>
                  <h4 className={`font-semibold text-${service.color}-800 text-sm mb-2`}>{service.title}</h4>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {service.services.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`w-1 h-1 rounded-full bg-${service.color}-400 mt-1.5`}></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Ready to take the next step?</p>
                  <p className="text-xs text-slate-500 mt-1">Contact Cancer and Careers to discuss a customized engagement.</p>
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
                  The composite score combines dimension performance ({DEFAULT_COMPOSITE_WEIGHTS.weightedDim}%), program maturity ({DEFAULT_COMPOSITE_WEIGHTS.maturity}%), and support breadth ({DEFAULT_COMPOSITE_WEIGHTS.breadth}%).
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-2">Benchmarking</p>
                <p className="leading-relaxed">
                  Benchmark scores represent the average performance across {totalCompanies > 0 ? totalCompanies : 'all'} organizations 
                  in the Index. Percentile rankings indicate relative positioning within the cohort. 
                  Benchmarks are updated as new organizations complete assessments.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-2">Performance Tiers</p>
                <p className="leading-relaxed">
                  <span className="text-purple-600 font-medium">Exemplary</span> (90+): Best in class<br/>
                  <span className="text-emerald-600 font-medium">Leading</span> (75-89): Above average<br/>
                  <span className="text-blue-600 font-medium">Progressing</span> (60-74): Meeting expectations<br/>
                  <span className="text-amber-600 font-medium">Emerging</span> (40-59): Developing<br/>
                  <span className="text-red-600 font-medium">Developing</span> (&lt;40): Early stage
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

/**
 * SHARED SCORING CALCULATIONS
 * Used by both scoring page and report page
 * Single source of truth for all scoring logic
 */

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_DIMENSION_WEIGHTS: Record<number, number> = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3,
};

export const DEFAULT_COMPOSITE_WEIGHTS = {
  weightedDim: 90,
  depth: 0,
  maturity: 5,
  breadth: 5,
};

export const DEFAULT_BLEND_WEIGHTS = {
  d1: { grid: 85, followUp: 15 },
  d3: { grid: 85, followUp: 15 },
  d12: { grid: 85, followUp: 15 },
  d13: { grid: 85, followUp: 15 },
};

export const DIMENSION_NAMES: Record<number, string> = {
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

const POINTS = { CURRENTLY_OFFER: 5, PLANNING: 3, ASSESSING: 2, NOT_ABLE: 0 };
const INSUFFICIENT_DATA_THRESHOLD = 0.40;

const D10_EXCLUDED_ITEMS = [
  'Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean; category: string } {
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

export function getGeoMultiplier(geoResponse: string | number | undefined | null): number {
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

export function getStatusText(status: string | number): string {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return 'Currently offer';
      case 3: return 'Planning';
      case 2: return 'Assessing';
      case 1: return 'Not able';
      case 5: return 'Unsure';
      default: return 'Unknown';
    }
  }
  return String(status);
}

// ============================================
// FOLLOW-UP SCORING FUNCTIONS
// ============================================

export function scoreD1PaidLeave(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('13 or more') || v.includes('13+ weeks') || v.includes('13 weeks or more')) return 100;
  if (v.includes('9 to') || v.includes('9-12') || v.includes('9 to less than 13')) return 80;
  if (v.includes('5 to') || v.includes('5-8') || v.includes('5 to less than 9')) return 60;
  if (v.includes('3 to') || v.includes('3-4') || v.includes('3 to less than 5')) return 40;
  if (v.includes('1 to') || v.includes('1-2') || v.includes('1 to less than 3')) return 20;
  if (v.includes('does not apply')) return 0;
  return 0;
}

export function scoreD1PartTime(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('as long as') || v.includes('medically necessary') || v.includes('healthcare provider')) return 100;
  if (v.includes('26 weeks') || v.includes('26+') || v.includes('6 months')) return 80;
  if (v.includes('13 to') || v.includes('12 to') || v.includes('13-25') || v.includes('12-25')) return 60;
  if (v.includes('5 to') || v.includes('5-12')) return 40;
  if (v.includes('up to 4') || v.includes('1-4')) return 20;
  if (v.includes('case-by-case')) return 50;
  if (v.includes('no additional')) return 0;
  return 0;
}

export function scoreD3Training(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('mandatory for all')) return 100;
  if (v.includes('mandatory for new')) return 60;
  if (v.includes('voluntary')) return 30;
  if (v.includes('varies')) return 40;
  return 0;
}

export function scoreD12CaseReview(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('systematic')) return 100;
  if (v.includes('ad hoc')) return 50;
  if (v.includes('aggregate') || v.includes('only review aggregate')) return 20;
  return 0;
}

export function scoreD12PolicyChanges(value: string | undefined): number {
  if (!value) return 0;
  const v = String(value).toLowerCase();
  if (v.includes('significant') || v.includes('major')) return 100;
  if (v.includes('some') || v.includes('minor') || v.includes('adjustments')) return 60;
  if (v.includes('no change') || v.includes('not yet') || v.includes('none')) return 20;
  return 0;
}

export function scoreD13Communication(value: string | undefined): number {
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

export function calculateFollowUpScore(dimNum: number, assessment: Record<string, any>): number | null {
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

// ============================================
// MATURITY & BREADTH SCORING
// ============================================

export function calculateMaturityScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const or1 = currentSupport.or1;
  
  // Handle numeric codes first (from imported data)
  if (or1 === 6 || or1 === '6') return 100;
  if (or1 === 5 || or1 === '5') return 80;
  if (or1 === 4 || or1 === '4') return 50;
  if (or1 === 3 || or1 === '3') return 20;
  if (or1 === 2 || or1 === '2') return 0;
  if (or1 === 1 || or1 === '1') return 0;
  
  // Fall back to text matching
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

export function calculateBreadthScore(assessment: Record<string, any>): number {
  const currentSupport = assessment.current_support_data || {};
  const generalBenefits = assessment.general_benefits_data || {};
  
  const scores: number[] = [];
  
  // CB3a: Check both sources
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
// DIMENSION SCORING
// ============================================

export interface DimensionScore {
  rawScore: number;
  adjustedScore: number;
  geoMultiplier: number;
  totalItems: number;
  answeredItems: number;
  unsureCount: number;
  unsurePercent: number;
  isInsufficientData: boolean;
  followUpScore: number | null;
  blendedScore: number;
}

export function calculateDimensionScore(
  dimNum: number, 
  dimData: Record<string, any> | null, 
  assessment?: Record<string, any>,
  blendWeights?: typeof DEFAULT_BLEND_WEIGHTS
): DimensionScore {
  const result: DimensionScore = {
    rawScore: 0,
    adjustedScore: 0,
    geoMultiplier: 1.0,
    totalItems: 0,
    answeredItems: 0,
    unsureCount: 0,
    unsurePercent: 0,
    isInsufficientData: false,
    followUpScore: null,
    blendedScore: 0,
  };
  
  if (!dimData) return result;
  
  const mainGrid = dimData[`d${dimNum}a`];
  if (!mainGrid || typeof mainGrid !== 'object') return result;
  
  let earnedPoints = 0;
  let totalItems = 0;
  let answeredItems = 0;
  let unsureCount = 0;
  
  Object.entries(mainGrid).forEach(([itemKey, status]: [string, any]) => {
    // D10 exclusion
    if (dimNum === 10 && D10_EXCLUDED_ITEMS.some(excluded => itemKey.includes(excluded))) {
      return;
    }
    
    totalItems++;
    const pts = statusToPoints(status);
    
    if (pts.isUnsure) {
      unsureCount++;
      answeredItems++;
    } else if (pts.points !== null) {
      answeredItems++;
      earnedPoints += pts.points;
    }
  });
  
  result.totalItems = totalItems;
  result.answeredItems = answeredItems;
  result.unsureCount = unsureCount;
  result.unsurePercent = totalItems > 0 ? Math.round((unsureCount / totalItems) * 100) : 0;
  result.isInsufficientData = totalItems > 0 && (unsureCount / totalItems) >= INSUFFICIENT_DATA_THRESHOLD;
  
  const maxPoints = answeredItems * 5;
  result.rawScore = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
  
  const geoResponse = dimData[`d${dimNum}aa`] || dimData[`D${dimNum}aa`];
  result.geoMultiplier = getGeoMultiplier(geoResponse);
  result.adjustedScore = Math.round(result.rawScore * result.geoMultiplier);
  
  // Apply blend for D1, D3, D12, D13
  let blendedScore = result.adjustedScore;
  if ([1, 3, 12, 13].includes(dimNum) && assessment) {
    const followUp = calculateFollowUpScore(dimNum, assessment);
    result.followUpScore = followUp;
    if (followUp !== null) {
      const weights = blendWeights || DEFAULT_BLEND_WEIGHTS;
      const key = `d${dimNum}` as keyof typeof weights;
      const gridPct = weights[key]?.grid ?? 85;
      const followUpPct = weights[key]?.followUp ?? 15;
      blendedScore = Math.round((result.adjustedScore * (gridPct / 100)) + (followUp * (followUpPct / 100)));
    }
  }
  result.blendedScore = blendedScore;
  
  return result;
}

// ============================================
// COMPANY SCORES - MAIN FUNCTION
// ============================================

export interface CompanyScores {
  compositeScore: number | null;
  weightedDimScore: number;
  unweightedAvg: number;
  maturityScore: number;
  breadthScore: number;
  dimensions: Record<number, DimensionScore>;
  isComplete: boolean;
  completedDimCount: number;
  isProvisional: boolean;
  tier: { name: string; color: string; bg: string; border: string };
}

export function calculateCompanyScores(
  assessment: Record<string, any>, 
  weights: Record<number, number> = DEFAULT_DIMENSION_WEIGHTS,
  compositeWeights: typeof DEFAULT_COMPOSITE_WEIGHTS = DEFAULT_COMPOSITE_WEIGHTS,
  blendWeights: typeof DEFAULT_BLEND_WEIGHTS = DEFAULT_BLEND_WEIGHTS
): CompanyScores {
  const dimensions: Record<number, DimensionScore> = {};
  let completedDimCount = 0;
  
  for (let i = 1; i <= 13; i++) {
    const dimData = assessment[`dimension${i}_data`];
    dimensions[i] = calculateDimensionScore(i, dimData, assessment, blendWeights);
    if (dimensions[i].totalItems > 0) completedDimCount++;
  }
  
  const isComplete = completedDimCount === 13;
  const insufficientDataCount = Object.values(dimensions).filter(d => d.isInsufficientData).length;
  const isProvisional = insufficientDataCount >= 4;
  
  let unweightedScore = 0;
  let weightedScore = 0;
  
  if (isComplete) {
    const dimsWithData = Object.values(dimensions).filter(d => d.totalItems > 0);
    unweightedScore = dimsWithData.length > 0
      ? Math.round(dimsWithData.reduce((sum, d) => sum + d.blendedScore, 0) / dimsWithData.length)
      : 0;
    
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      for (let i = 1; i <= 13; i++) {
        const dim = dimensions[i];
        const weight = weights[i] || 0;
        weightedScore += dim.blendedScore * (weight / totalWeight);
      }
    }
    weightedScore = Math.round(weightedScore);
  }
  
  const maturityScore = calculateMaturityScore(assessment);
  const breadthScore = calculateBreadthScore(assessment);
  
  const compositeScore = isComplete ? Math.round(
    (weightedScore * (compositeWeights.weightedDim / 100)) +
    (maturityScore * (compositeWeights.maturity / 100)) +
    (breadthScore * (compositeWeights.breadth / 100))
  ) : null;
  
  const tier = getPerformanceTier(compositeScore || 0, isProvisional);
  
  return {
    compositeScore,
    weightedDimScore: weightedScore,
    unweightedAvg: unweightedScore,
    maturityScore,
    breadthScore,
    dimensions,
    isComplete,
    completedDimCount,
    isProvisional,
    tier,
  };
}

export function getPerformanceTier(score: number, isProvisional: boolean = false): { name: string; color: string; bg: string; border: string } {
  const baseTier = score >= 90 ? { name: 'Exemplary', color: '#7C3AED', bg: 'bg-purple-100', border: 'border-purple-300' } :
                   score >= 75 ? { name: 'Leading', color: '#059669', bg: 'bg-green-100', border: 'border-green-300' } :
                   score >= 60 ? { name: 'Progressing', color: '#0284C7', bg: 'bg-blue-100', border: 'border-blue-300' } :
                   score >= 40 ? { name: 'Emerging', color: '#D97706', bg: 'bg-amber-100', border: 'border-amber-300' } :
                                 { name: 'Developing', color: '#DC2626', bg: 'bg-red-100', border: 'border-red-300' };
  
  if (isProvisional) {
    return { ...baseTier, name: `${baseTier.name}*` };
  }
  return baseTier;
}

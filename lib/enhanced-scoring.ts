/**
 * ENHANCED SCORING TOOL
 * Best Companies for Working with Cancer Index
 * 
 * This scoring model goes beyond the basic grid responses to incorporate:
 * - Base Score: Main D#a grid items (70% weight)
 * - Depth Score: Follow-up question quality (15% weight)
 * - Maturity Score: Current support approach & monitoring (10% weight)
 * - Breadth Score: Conditions covered & program structure (5% weight)
 * 
 * Total Composite = (Base × 0.70) + (Depth × 0.15) + (Maturity × 0.10) + (Breadth × 0.05)
 */

// ============================================
// CONSTANTS & WEIGHTS
// ============================================

// Dimension weights for base score (sum = 100)
export const DIMENSION_WEIGHTS: Record<number, number> = {
  4: 14,   // Navigation & Expert Resources
  8: 13,   // Work Continuation & Resumption  
  3: 12,   // Manager Preparedness
  2: 11,   // Insurance & Financial
  13: 10,  // Communication & Awareness
  6: 8,    // Culture & Psychological Safety
  1: 7,    // Medical Leave & Flexibility
  5: 7,    // Workplace Accommodations
  7: 4,    // Career Continuity
  9: 4,    // Executive Commitment
  10: 4,   // Caregiver & Family
  11: 3,   // Prevention & Wellness
  12: 3,   // Continuous Improvement
};

// Component weights for composite score
export const COMPONENT_WEIGHTS = {
  base: 0.70,
  depth: 0.15,
  maturity: 0.10,
  breadth: 0.05,
};

// Point values for main grid items
export const GRID_POINTS = {
  CURRENTLY_OFFER: 5,
  PLANNING: 3,
  ASSESSING: 2,
  NOT_ABLE: 0,
  UNSURE: 0, // Counted in denominator with 0 points
};

// ============================================
// DIMENSION NAMES
// ============================================

export const DIMENSION_NAMES: Record<number, string> = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources',
  5: 'Workplace Accommodations & Modifications',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention, Wellness & Legal Compliance',
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness',
};

// ============================================
// DEPTH SCORING CONFIGURATIONS
// ============================================

/**
 * Depth scoring for follow-up questions
 * Higher values = more comprehensive offering
 */
export const DEPTH_SCORING = {
  // D1: Medical Leave Follow-ups
  d1_1: { // Paid leave duration (USA)
    '1 to less than 3 weeks': 1,
    '3 to less than 5 weeks': 2,
    '5 to less than 9 weeks': 3,
    '9 to less than 13 weeks': 4,
    '13 or more weeks': 5,
    'Does not apply': 0,
  },
  d1_2: { // Intermittent leave (USA)
    'No additional leave': 0,
    '1 to 4 additional weeks': 1,
    '5 to 11 additional weeks': 2,
    '12 to 23 additional weeks': 3,
    '24 or more additional weeks': 4,
    'Unlimited based on medical need': 5,
    'Does not apply': 0,
  },
  d1_4a: { // Remote work duration
    'Up to 3 months': 1,
    '4-6 months': 2,
    '7-12 months': 3,
    'More than 12 months': 4,
    'As long as requested by healthcare provider': 5,
    'As long as medically necessary': 5,
    'Unlimited with medical certification': 5,
    'Case-by-case basis': 3,
    'No additional remote work beyond legal requirements': 0,
  },
  d1_4b: { // Part-time with full benefits
    'Up to 4 weeks': 1,
    '5 to less than 13 weeks': 2,
    '13 to less than 26 weeks': 3,
    '26 weeks or more': 4,
    'As long as requested by healthcare provider': 5,
    'As long as medically necessary': 5,
    'Case-by-case basis': 3,
    'No additional time beyond legal requirements': 0,
  },
  d1_5: { // Job protection duration (USA)
    '1 to less than 4 weeks': 1,
    '4 to less than 12 weeks': 2,
    '12 to less than 26 weeks': 3,
    '26 to less than 52 weeks': 4,
    '52 weeks or more': 5,
    'Does not apply': 0,
  },
  
  // D3: Manager Training Follow-ups
  d3_1a: { // Training mandatory vs voluntary
    'Mandatory for all managers': 5,
    'Mandatory for new managers only': 3,
    'Voluntary': 1,
    'Varies by training type': 2,
  },
  d3_1: { // % of managers trained
    'Less than 10%': 1,
    '10 to less than 25%': 2,
    '25 to less than 50%': 3,
    '50 to less than 75%': 4,
    '75 to less than 100%': 4.5,
    '100%': 5,
    'Unsure': 0,
    'Do not track this information': 0,
    'Not able to provide this information': 0,
  },
  
  // D4: Navigation Follow-ups (count-based)
  d4_1a: { // Who provides navigation - points per selection
    pointsPerSelection: 1,
    maxPoints: 5,
    bonusOptions: {
      'Credentialed internal staff dedicated to employee navigation (e.g. nurse, social worker, etc.)': 2, // Bonus for internal staff
    }
  },
  d4_1b: { // Services available - points per selection
    pointsPerSelection: 0.625, // 8 options × 0.625 = 5 max
    maxPoints: 5,
  },
  
  // D6: Culture Follow-ups (count-based)
  d6_2: { // How psychological safety is measured
    pointsPerSelection: 1,
    maxPoints: 5,
    penaltyOptions: {
      "Don't formally measure": -5, // If selected, score = 0
    }
  },
  
  // D11: Prevention Follow-ups (count-based)
  d11_1: { // Screenings covered at 70%+
    pointsPerSelection: 0.2, // Many options, cap at 5
    maxPoints: 5,
  },
  
  // D12: Continuous Improvement Follow-ups
  d12_1: { // Case review process
    'Yes, using a systematic case review process': 5,
    'Yes, using ad hoc case reviews': 3,
    'No, we only review aggregate metrics': 1,
    'Regular case review meetings': 5,
    'Ad hoc reviews as needed': 3,
    'Third-party vendor manages reviews': 4,
    'Manager-led reviews': 3,
    "We don't review individual cases": 0,
    'Other approach': 2,
  },
  d12_2: { // Have changes been made based on employee experiences
    'Yes, several changes implemented': 5,
    'Yes, a few changes implemented': 3,
    'No': 0,
  },
  
  // D13: Communication Follow-ups
  d13_1: { // Communication frequency
    'Weekly': 5,
    'Monthly': 5,
    'Monthly or more often': 5,
    'Quarterly': 4,
    'Semi-annually': 3,
    'Twice per year': 3,
    'Annually': 2,
    'Annually (typically during enrollment or on World Cancer Day)': 2,
    'Only during benefits enrollment': 1,
    'Only when asked/reactive only': 0.5,
    'Only when asked': 0.5,
    "We don't actively communicate": 0,
    'No regular communication schedule': 0.5,
  },
};

// ============================================
// MATURITY SCORING CONFIGURATIONS
// ============================================

export const MATURITY_SCORING = {
  // OR1: Current approach level
  or1: {
    'No formal approach: Handle case-by-case': 0,
    'No formal approach - handled case by case': 0,
    'Developing approach: Currently building our programs': 1,
    'Developing approach': 1,
    'Legal minimum only: Meet legal requirements only (FMLA, ADA)': 2,
    'Legal minimum only': 2,
    'Moderate support: Some programs beyond legal requirements': 3,
    'Moderate support': 3,
    'Enhanced support: Meaningful programs beyond legal minimums': 4,
    'Enhanced support': 4,
    'Comprehensive support: Extensive programs well beyond legal requirements': 5,
    'Comprehensive support': 5,
    // Also handle schema options
    'No formal approach - handled case by case': 0,
    'Manager discretion with HR guidance': 1,
    'Standardized process with some flexibility': 2,
    'Formal program with defined benefits': 3,
    'Comprehensive integrated support system': 5,
  },
  
  // OR5a: Caregiver support types (count-based)
  or5a: {
    pointsPerSelection: 0.35, // ~14 options, cap at 5
    maxPoints: 5,
    penaltyOptions: {
      'Not able to provide caregiver support at this time': -5, // If selected, score = 0
    }
  },
  
  // OR6: Effectiveness monitoring (count-based)
  or6: {
    pointsPerSelection: 0.5, // ~10 options, cap at 5
    maxPoints: 5,
    penaltyOptions: {
      "We don't currently measure": -5,
      'No systematic monitoring': -5,
    }
  },
};

// ============================================
// BREADTH SCORING CONFIGURATIONS
// ============================================

export const BREADTH_SCORING = {
  // CB3a: Beyond legal requirements
  cb3a: {
    'Yes, we offer additional support beyond legal requirements': 5,
    'Currently developing enhanced support offerings': 3,
    'At this time, we primarily focus on meeting legal compliance requirements': 1,
    'Not yet, but actively exploring options': 2,
    // Also handle schema options
    'No specific program - standard benefits only': 0,
    'Basic support through existing benefits': 1,
    'Enhanced support with some specialized resources': 3,
    'Comprehensive program with dedicated resources': 4,
    'Leading-edge program with innovative solutions': 5,
  },
  
  // CB3b: Program structure (count-based with bonuses)
  cb3b: {
    pointsPerSelection: 0.7, // ~7 options
    maxPoints: 5,
    bonusOptions: {
      'Comprehensive framework that integrates multiple support elements': 2,
      'Coordinated support services - single point of contact for multiple resources (e.g., nurse navigation, case management)': 1.5,
      'Internally developed formal program with a specific name': 1,
    }
  },
  
  // CB3c: Conditions covered (count-based)
  cb3c: {
    pointsPerSelection: 0.4, // ~12 options
    maxPoints: 5,
    bonusOptions: {
      'All serious medical conditions': 2, // Bonus for comprehensive coverage
    }
  },
};

// ============================================
// TYPE DEFINITIONS
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
  breakdown: {
    currentlyOffer: number;
    planning: number;
    assessing: number;
    notAble: number;
    unsure: number;
  };
}

export interface DepthScore {
  total: number;
  maxPossible: number;
  percentage: number;
  details: Record<string, { value: number; maxValue: number; source: string }>;
}

export interface MaturityScore {
  total: number;
  maxPossible: number;
  percentage: number;
  details: Record<string, { value: number; maxValue: number; source: string }>;
}

export interface BreadthScore {
  total: number;
  maxPossible: number;
  percentage: number;
  details: Record<string, { value: number; maxValue: number; source: string }>;
}

export interface EnhancedScore {
  // Component scores (0-100 scale)
  baseScore: number;
  depthScore: number;
  maturityScore: number;
  breadthScore: number;
  
  // Composite score (weighted combination)
  compositeScore: number;
  
  // Performance tier
  tier: {
    name: string;
    color: string;
    bg: string;
    isProvisional: boolean;
  };
  
  // Detailed breakdowns
  dimensionScores: Record<number, DimensionScore>;
  depthDetails: DepthScore;
  maturityDetails: MaturityScore;
  breadthDetails: BreadthScore;
  
  // Metadata
  completedDimensions: number;
  insufficientDataCount: number;
  isComplete: boolean;
  isProvisional: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: GRID_POINTS.CURRENTLY_OFFER, isUnsure: false };
      case 3: return { points: GRID_POINTS.PLANNING, isUnsure: false };
      case 2: return { points: GRID_POINTS.ASSESSING, isUnsure: false };
      case 1: return { points: GRID_POINTS.NOT_ABLE, isUnsure: false };
      case 5: return { points: null, isUnsure: true };
      default: return { points: null, isUnsure: false };
    }
  }
  
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return { points: GRID_POINTS.NOT_ABLE, isUnsure: false };
    if (s === 'unsure' || s.includes('unsure')) return { points: null, isUnsure: true };
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || 
        s.includes('use') || s.includes('track') || s.includes('measure')) {
      return { points: GRID_POINTS.CURRENTLY_OFFER, isUnsure: false };
    }
    if (s.includes('planning') || s.includes('development')) return { points: GRID_POINTS.PLANNING, isUnsure: false };
    if (s.includes('assessing') || s.includes('feasibility')) return { points: GRID_POINTS.ASSESSING, isUnsure: false };
    if (s.length > 0) return { points: GRID_POINTS.NOT_ABLE, isUnsure: false };
  }
  return { points: null, isUnsure: false };
}

function getGeoMultiplier(geoResponse: string | undefined | null): number {
  if (!geoResponse) return 1.0;
  const s = geoResponse.toLowerCase();
  if (s.includes('consistent') || s.includes('generally consistent')) return 1.0;
  if (s.includes('vary') || s.includes('varies')) return 0.90;
  if (s.includes('select') || s.includes('only available in select')) return 0.75;
  return 1.0;
}

function getPerformanceTier(score: number, isProvisional: boolean): { name: string; color: string; bg: string; isProvisional: boolean } {
  let tier: { name: string; color: string; bg: string };
  if (score >= 90) tier = { name: 'Exemplary', color: '#1B5E20', bg: '#E8F5E9' };
  else if (score >= 75) tier = { name: 'Leading', color: '#0D47A1', bg: '#E3F2FD' };
  else if (score >= 60) tier = { name: 'Progressing', color: '#E65100', bg: '#FFF8E1' };
  else if (score >= 40) tier = { name: 'Emerging', color: '#BF360C', bg: '#FFF3E0' };
  else tier = { name: 'Beginning', color: '#37474F', bg: '#ECEFF1' };
  return { ...tier, isProvisional };
}

// ============================================
// BASE SCORE CALCULATION (Existing Method)
// ============================================

function calculateDimensionScore(dimNum: number, dimData: Record<string, any> | null): DimensionScore {
  const result: DimensionScore = {
    rawScore: 0,
    adjustedScore: 0,
    geoMultiplier: 1.0,
    totalItems: 0,
    answeredItems: 0,
    unsureCount: 0,
    unsurePercent: 0,
    isInsufficientData: false,
    breakdown: { currentlyOffer: 0, planning: 0, assessing: 0, notAble: 0, unsure: 0 }
  };
  
  if (!dimData) return result;
  
  const mainGrid = dimData[`d${dimNum}a`];
  if (!mainGrid || typeof mainGrid !== 'object') return result;
  
  let earnedPoints = 0;
  
  Object.values(mainGrid).forEach((status: any) => {
    result.totalItems++;
    const { points, isUnsure } = statusToPoints(status);
    
    if (isUnsure) {
      result.unsureCount++;
      result.answeredItems++;
      result.breakdown.unsure++;
    } else if (points !== null) {
      result.answeredItems++;
      earnedPoints += points;
      
      if (points === GRID_POINTS.CURRENTLY_OFFER) result.breakdown.currentlyOffer++;
      else if (points === GRID_POINTS.PLANNING) result.breakdown.planning++;
      else if (points === GRID_POINTS.ASSESSING) result.breakdown.assessing++;
      else result.breakdown.notAble++;
    }
  });
  
  result.unsurePercent = result.totalItems > 0 ? result.unsureCount / result.totalItems : 0;
  result.isInsufficientData = result.unsurePercent > 0.40;
  
  const maxPoints = result.answeredItems * GRID_POINTS.CURRENTLY_OFFER;
  if (maxPoints > 0) {
    result.rawScore = Math.round((earnedPoints / maxPoints) * 100);
  }
  
  const geoResponse = dimData[`d${dimNum}aa`] || dimData[`D${dimNum}aa`];
  result.geoMultiplier = getGeoMultiplier(geoResponse);
  result.adjustedScore = Math.round(result.rawScore * result.geoMultiplier);
  
  return result;
}

function calculateBaseScore(assessment: any): { score: number; dimensionScores: Record<number, DimensionScore>; completedDimCount: number; insufficientDataCount: number } {
  const dimensionScores: Record<number, DimensionScore> = {};
  let completedDimCount = 0;
  let insufficientDataCount = 0;
  
  for (let i = 1; i <= 13; i++) {
    const dimData = assessment[`dimension${i}_data`];
    dimensionScores[i] = calculateDimensionScore(i, dimData);
    if (dimensionScores[i].totalItems > 0) completedDimCount++;
    if (dimensionScores[i].isInsufficientData) insufficientDataCount++;
  }
  
  if (completedDimCount === 0) {
    return { score: 0, dimensionScores, completedDimCount, insufficientDataCount };
  }
  
  // Weighted score calculation
  const totalWeight = Object.values(DIMENSION_WEIGHTS).reduce((sum, w) => sum + w, 0);
  let weightedScore = 0;
  
  for (let i = 1; i <= 13; i++) {
    const dim = dimensionScores[i];
    const weight = DIMENSION_WEIGHTS[i] || 0;
    weightedScore += dim.adjustedScore * (weight / totalWeight);
  }
  
  return { 
    score: Math.round(weightedScore), 
    dimensionScores, 
    completedDimCount, 
    insufficientDataCount 
  };
}

// ============================================
// DEPTH SCORE CALCULATION (NEW)
// ============================================

function scoreSelectFollowUp(value: string | undefined, scoringMap: Record<string, number>): number {
  if (!value) return 0;
  return scoringMap[value] ?? 0;
}

function scoreCountBasedFollowUp(
  values: string[] | undefined, 
  config: { pointsPerSelection: number; maxPoints: number; bonusOptions?: Record<string, number>; penaltyOptions?: Record<string, number> }
): number {
  if (!values || !Array.isArray(values) || values.length === 0) return 0;
  
  // Check for penalty options first
  if (config.penaltyOptions) {
    for (const [option, penalty] of Object.entries(config.penaltyOptions)) {
      if (values.includes(option)) return 0; // Penalty resets score to 0
    }
  }
  
  let score = values.length * config.pointsPerSelection;
  
  // Add bonuses for specific high-value options
  if (config.bonusOptions) {
    for (const [option, bonus] of Object.entries(config.bonusOptions)) {
      if (values.includes(option)) score += bonus;
    }
  }
  
  return Math.min(score, config.maxPoints);
}

function calculateDepthScore(assessment: any): DepthScore {
  const details: Record<string, { value: number; maxValue: number; source: string }> = {};
  let totalPoints = 0;
  let maxPossible = 0;
  
  // D1 Follow-ups
  const d1Data = assessment.dimension1_data || {};
  
  // D1.1 - Paid leave duration (USA)
  const d1_1_usa = d1Data.d1_1_usa || d1Data.d1_1;
  if (d1_1_usa) {
    const score = scoreSelectFollowUp(d1_1_usa, DEPTH_SCORING.d1_1);
    details['d1_1'] = { value: score, maxValue: 5, source: `Paid leave: ${d1_1_usa}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D1.2 - Intermittent leave
  const d1_2_usa = d1Data.d1_2_usa || d1Data.d1_2;
  if (d1_2_usa) {
    const score = scoreSelectFollowUp(d1_2_usa, DEPTH_SCORING.d1_2);
    details['d1_2'] = { value: score, maxValue: 5, source: `Intermittent leave: ${d1_2_usa}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D1.4a - Remote work
  const d1_4a = d1Data.d1_4a;
  if (d1_4a) {
    const score = scoreSelectFollowUp(d1_4a, DEPTH_SCORING.d1_4a);
    details['d1_4a'] = { value: score, maxValue: 5, source: `Remote work: ${d1_4a}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D1.4b - Part-time with benefits
  const d1_4b = d1Data.d1_4b;
  if (d1_4b) {
    const score = scoreSelectFollowUp(d1_4b, DEPTH_SCORING.d1_4b);
    details['d1_4b'] = { value: score, maxValue: 5, source: `Part-time benefits: ${d1_4b}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D1.5 - Job protection
  const d1_5_usa = d1Data.d1_5_usa || d1Data.d1_5;
  if (d1_5_usa) {
    const score = scoreSelectFollowUp(d1_5_usa, DEPTH_SCORING.d1_5);
    details['d1_5'] = { value: score, maxValue: 5, source: `Job protection: ${d1_5_usa}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D3 Follow-ups
  const d3Data = assessment.dimension3_data || {};
  
  // D3.1a - Training mandatory
  const d3_1a = d3Data.d3_1a;
  if (d3_1a) {
    const score = scoreSelectFollowUp(d3_1a, DEPTH_SCORING.d3_1a);
    details['d3_1a'] = { value: score, maxValue: 5, source: `Training policy: ${d3_1a}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D3.1 - % managers trained
  const d3_1 = d3Data.d3_1;
  if (d3_1) {
    const score = scoreSelectFollowUp(d3_1, DEPTH_SCORING.d3_1);
    details['d3_1'] = { value: score, maxValue: 5, source: `Managers trained: ${d3_1}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D4 Follow-ups
  const d4Data = assessment.dimension4_data || {};
  
  // D4.1a - Who provides navigation
  const d4_1a = d4Data.d4_1a;
  if (d4_1a && Array.isArray(d4_1a)) {
    const score = scoreCountBasedFollowUp(d4_1a, DEPTH_SCORING.d4_1a as any);
    details['d4_1a'] = { value: score, maxValue: 5, source: `Navigation providers: ${d4_1a.length} selected` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D4.1b - Navigation services
  const d4_1b = d4Data.d4_1b;
  if (d4_1b && Array.isArray(d4_1b)) {
    const score = scoreCountBasedFollowUp(d4_1b, DEPTH_SCORING.d4_1b as any);
    details['d4_1b'] = { value: score, maxValue: 5, source: `Navigation services: ${d4_1b.length} selected` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D6 Follow-ups
  const d6Data = assessment.dimension6_data || {};
  
  // D6.2 - How psychological safety measured
  const d6_2 = d6Data.d6_2;
  if (d6_2 && Array.isArray(d6_2)) {
    const score = scoreCountBasedFollowUp(d6_2, DEPTH_SCORING.d6_2 as any);
    details['d6_2'] = { value: score, maxValue: 5, source: `Safety measurement: ${d6_2.length} methods` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D11 Follow-ups
  const d11Data = assessment.dimension11_data || {};
  
  // D11.1 - Screenings covered
  const d11_1 = d11Data.d11_1;
  if (d11_1 && Array.isArray(d11_1)) {
    const score = scoreCountBasedFollowUp(d11_1, DEPTH_SCORING.d11_1 as any);
    details['d11_1'] = { value: score, maxValue: 5, source: `Screenings covered: ${d11_1.length} types` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D12 Follow-ups
  const d12Data = assessment.dimension12_data || {};
  
  // D12.1 - Case review process
  const d12_1 = d12Data.d12_1;
  if (d12_1) {
    const score = scoreSelectFollowUp(d12_1, DEPTH_SCORING.d12_1);
    details['d12_1'] = { value: score, maxValue: 5, source: `Case review: ${d12_1}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D12.2 - Changes implemented
  const d12_2 = d12Data.d12_2;
  if (d12_2) {
    const score = scoreSelectFollowUp(d12_2, DEPTH_SCORING.d12_2);
    details['d12_2'] = { value: score, maxValue: 5, source: `Changes made: ${d12_2}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // D13 Follow-ups
  const d13Data = assessment.dimension13_data || {};
  
  // D13.1 - Communication frequency
  const d13_1 = d13Data.d13_1;
  if (d13_1) {
    const score = scoreSelectFollowUp(d13_1, DEPTH_SCORING.d13_1);
    details['d13_1'] = { value: score, maxValue: 5, source: `Comm frequency: ${d13_1}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // Calculate percentage (0-100)
  const answeredQuestions = Object.keys(details).length;
  const adjustedMaxPossible = answeredQuestions * 5; // Only count answered questions
  const percentage = adjustedMaxPossible > 0 ? Math.round((totalPoints / adjustedMaxPossible) * 100) : 0;
  
  return {
    total: totalPoints,
    maxPossible: adjustedMaxPossible,
    percentage,
    details,
  };
}

// ============================================
// MATURITY SCORE CALCULATION (NEW)
// ============================================

function calculateMaturityScore(assessment: any): MaturityScore {
  const details: Record<string, { value: number; maxValue: number; source: string }> = {};
  let totalPoints = 0;
  let maxPossible = 0;
  
  const currentSupportData = assessment.current_support_data || {};
  
  // OR1 - Current approach level
  const or1 = currentSupportData.or1;
  if (or1) {
    const score = scoreSelectFollowUp(or1, MATURITY_SCORING.or1);
    details['or1'] = { value: score, maxValue: 5, source: `Approach: ${or1}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // OR5a - Caregiver support types
  const or5a = currentSupportData.or5a;
  if (or5a && Array.isArray(or5a)) {
    const score = scoreCountBasedFollowUp(or5a, MATURITY_SCORING.or5a as any);
    details['or5a'] = { value: score, maxValue: 5, source: `Caregiver supports: ${or5a.length} types` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // OR6 - Effectiveness monitoring
  const or6 = currentSupportData.or6;
  if (or6 && Array.isArray(or6)) {
    const score = scoreCountBasedFollowUp(or6, MATURITY_SCORING.or6 as any);
    details['or6'] = { value: score, maxValue: 5, source: `Monitoring methods: ${or6.length} used` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // OR2a - Triggers for enhanced support (bonus indicator)
  const or2a = currentSupportData.or2a;
  if (or2a && Array.isArray(or2a) && or2a.length > 0) {
    const score = Math.min(or2a.length * 0.5, 5); // 0.5 per trigger, max 5
    details['or2a'] = { value: score, maxValue: 5, source: `Triggers: ${or2a.length} identified` };
    totalPoints += score;
    maxPossible += 5;
  }
  
  // Calculate percentage
  const answeredQuestions = Object.keys(details).length;
  const adjustedMaxPossible = answeredQuestions * 5;
  const percentage = adjustedMaxPossible > 0 ? Math.round((totalPoints / adjustedMaxPossible) * 100) : 0;
  
  return {
    total: totalPoints,
    maxPossible: adjustedMaxPossible,
    percentage,
    details,
  };
}

// ============================================
// BREADTH SCORE CALCULATION (NEW)
// ============================================

function calculateBreadthScore(assessment: any): BreadthScore {
  const details: Record<string, { value: number; maxValue: number; source: string }> = {};
  let totalPoints = 0;
  let maxPossible = 0;
  
  const currentSupportData = assessment.current_support_data || {};
  const generalBenefitsData = assessment.general_benefits_data || {};
  
  // CB3a - Beyond legal requirements
  const cb3a = currentSupportData.cb3a || generalBenefitsData.cb3a;
  if (cb3a) {
    const score = scoreSelectFollowUp(cb3a, BREADTH_SCORING.cb3a);
    details['cb3a'] = { value: score, maxValue: 5, source: `Beyond legal: ${cb3a}` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // CB3b - Program structure
  const cb3b = currentSupportData.cb3b || generalBenefitsData.cb3b;
  if (cb3b && Array.isArray(cb3b)) {
    const score = scoreCountBasedFollowUp(cb3b, BREADTH_SCORING.cb3b as any);
    details['cb3b'] = { value: score, maxValue: 5, source: `Program structure: ${cb3b.length} elements` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // CB3c - Conditions covered
  const cb3c = currentSupportData.cb3c || generalBenefitsData.cb3c;
  if (cb3c && Array.isArray(cb3c)) {
    const score = scoreCountBasedFollowUp(cb3c, BREADTH_SCORING.cb3c as any);
    details['cb3c'] = { value: score, maxValue: 5, source: `Conditions: ${cb3c.length} covered` };
    totalPoints += score;
  }
  maxPossible += 5;
  
  // Calculate percentage
  const answeredQuestions = Object.keys(details).length;
  const adjustedMaxPossible = answeredQuestions * 5;
  const percentage = adjustedMaxPossible > 0 ? Math.round((totalPoints / adjustedMaxPossible) * 100) : 0;
  
  return {
    total: totalPoints,
    maxPossible: adjustedMaxPossible,
    percentage,
    details,
  };
}

// ============================================
// MAIN ENHANCED SCORING FUNCTION
// ============================================

export function calculateEnhancedScore(assessment: any): EnhancedScore {
  // Calculate all components
  const baseResult = calculateBaseScore(assessment);
  const depthDetails = calculateDepthScore(assessment);
  const maturityDetails = calculateMaturityScore(assessment);
  const breadthDetails = calculateBreadthScore(assessment);
  
  // Component scores (0-100)
  const baseScore = baseResult.score;
  const depthScore = depthDetails.percentage;
  const maturityScore = maturityDetails.percentage;
  const breadthScore = breadthDetails.percentage;
  
  // Composite score (weighted)
  const compositeScore = Math.round(
    (baseScore * COMPONENT_WEIGHTS.base) +
    (depthScore * COMPONENT_WEIGHTS.depth) +
    (maturityScore * COMPONENT_WEIGHTS.maturity) +
    (breadthScore * COMPONENT_WEIGHTS.breadth)
  );
  
  // Determine if provisional
  const isProvisional = baseResult.insufficientDataCount >= 4;
  
  // Get performance tier
  const tier = getPerformanceTier(compositeScore, isProvisional);
  
  return {
    baseScore,
    depthScore,
    maturityScore,
    breadthScore,
    compositeScore,
    tier,
    dimensionScores: baseResult.dimensionScores,
    depthDetails,
    maturityDetails,
    breadthDetails,
    completedDimensions: baseResult.completedDimCount,
    insufficientDataCount: baseResult.insufficientDataCount,
    isComplete: baseResult.completedDimCount === 13,
    isProvisional,
  };
}

// ============================================
// SCORE COLOR HELPER
// ============================================

export function getScoreColor(score: number): string {
  if (score >= 80) return '#2E7D32'; // Green
  if (score >= 60) return '#1565C0'; // Blue
  if (score >= 40) return '#EF6C00'; // Orange
  return '#C62828'; // Red
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default calculateEnhancedScore;

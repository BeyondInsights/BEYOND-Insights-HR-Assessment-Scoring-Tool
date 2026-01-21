// Shared scoring configuration used by both scoring page and report generation
// Location: lib/scoring-config.ts

export const SCORING_CONFIG = {
  // Dimension weights (must sum to 100)
  dimensionWeights: {
    1: 7,   // Medical Leave & Flexibility
    2: 11,  // Insurance & Financial Protection
    3: 12,  // Manager Preparedness & Capability
    4: 14,  // Navigation & Expert Resources
    5: 7,   // Workplace Accommodations
    6: 8,   // Culture & Psychological Safety
    7: 4,   // Career Continuity & Advancement
    8: 13,  // Work Continuation & Resumption
    9: 4,   // Executive Commitment & Resources
    10: 4,  // Caregiver & Family Support
    11: 3,  // Prevention & Wellness
    12: 3,  // Continuous Improvement & Outcomes
    13: 10, // Communication & Awareness
  } as Record<number, number>,

  // Composite score weights (must sum to 100)
  compositeWeights: {
    weightedDim: 90,
    maturity: 5,
    breadth: 5,
  },

  // Blend weights for follow-up questions (D1, D3, D12, D13)
  blendWeights: {
    d1: { grid: 85, followUp: 15 },
    d3: { grid: 85, followUp: 15 },
    d12: { grid: 85, followUp: 15 },
    d13: { grid: 85, followUp: 15 },
  },

  // Point values for response statuses
  points: {
    CURRENTLY_OFFER: 5,
    PLANNING: 3,
    ASSESSING: 2,
    NOT_ABLE: 0,
  },

  // Threshold for insufficient data (40% unsure responses)
  insufficientDataThreshold: 0.40,

  // Performance tier definitions
  tiers: {
    exemplary: { min: 90, name: 'Exemplary', color: '#065F46', bgColor: 'bg-emerald-100' },
    leading: { min: 75, name: 'Leading', color: '#1E40AF', bgColor: 'bg-blue-100' },
    progressing: { min: 60, name: 'Progressing', color: '#92400E', bgColor: 'bg-amber-100' },
    emerging: { min: 40, name: 'Emerging', color: '#9A3412', bgColor: 'bg-orange-100' },
    developing: { min: 0, name: 'Developing', color: '#374151', bgColor: 'bg-gray-100' },
  },

  // Dimension names for display
  dimensionNames: {
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
  } as Record<number, string>,
};

// Helper to get total dimension weight
export function getTotalDimensionWeight(): number {
  return Object.values(SCORING_CONFIG.dimensionWeights).reduce((sum, w) => sum + w, 0);
}

// Helper to get tier from score
export function getTierFromScore(score: number): typeof SCORING_CONFIG.tiers.exemplary {
  if (score >= 90) return SCORING_CONFIG.tiers.exemplary;
  if (score >= 75) return SCORING_CONFIG.tiers.leading;
  if (score >= 60) return SCORING_CONFIG.tiers.progressing;
  if (score >= 40) return SCORING_CONFIG.tiers.emerging;
  return SCORING_CONFIG.tiers.developing;
}

export default SCORING_CONFIG;

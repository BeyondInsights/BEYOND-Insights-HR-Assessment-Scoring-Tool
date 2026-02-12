'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// ============================================
// SUPABASE CLIENT
// ============================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// CONSTANTS - Dimension Weights (matches enhanced-scoring.ts)
// ============================================
const DIMENSION_WEIGHTS: Record<number, number> = {
  4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3
};
const DIMENSION_ORDER = [4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12];
const DIMENSION_NAMES: Record<number, string> = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Cancer Support Resources',
  5: 'Workplace Accommodations',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention & Wellness',
  12: 'Continuous Improvement',
  13: 'Communication & Awareness'
};

// Grid point values
const GRID_POINTS = { OFFER: 5, PLAN: 3, ASSESS: 2, NOT: 0 };

// D10 exclusion - element to exclude from scoring
const D10_EXCLUDED_ELEMENTS = [
  'Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'
];

// ============================================
// DIMENSION METADATA (from calibration analysis)
// ============================================
const DIM_META: Record<number, { cvR2: number; alpha: number; n: number; elems: number }> = {
  1: { cvR2: -0.135, alpha: 0.3, n: 41, elems: 13 },
  2: { cvR2: 0.018, alpha: 0.4, n: 36, elems: 17 },
  3: { cvR2: 0.156, alpha: 0.5, n: 38, elems: 10 },
  4: { cvR2: 0.419, alpha: 0.5, n: 40, elems: 10 },
  5: { cvR2: 0.412, alpha: 0.5, n: 39, elems: 11 },
  6: { cvR2: 0.361, alpha: 0.5, n: 38, elems: 12 },
  7: { cvR2: 0.33, alpha: 0.5, n: 34, elems: 9 },
  8: { cvR2: 0.53, alpha: 0.5, n: 38, elems: 12 },
  9: { cvR2: 0.136, alpha: 0.5, n: 34, elems: 12 },
  10: { cvR2: -0.063, alpha: 0.3, n: 40, elems: 20 },
  11: { cvR2: 0.473, alpha: 0.5, n: 40, elems: 13 },
  12: { cvR2: 0.12, alpha: 0.5, n: 40, elems: 9 },
  13: { cvR2: 0.642, alpha: 0.5, n: 40, elems: 11 }
};

// ============================================
// ELEMENT WEIGHTS BY DIMENSION
// Structure: { e: element text, w: adjusted weight, eq: equal weight, s: stability }
// ============================================
const ELEMENT_WEIGHTS: Record<number, Array<{ e: string; w: number; eq: number; s: number }>> = {
  1: [
    { e: 'Emergency leave within 24 hours', w: 0.1431, eq: 0.0769, s: 0.92 },
    { e: 'Remote work options for on-site employees', w: 0.1287, eq: 0.0769, s: 0.925 },
    { e: 'Intermittent leave beyond local / legal requirements', w: 0.1136, eq: 0.0769, s: 0.835 },
    { e: 'Paid micro-breaks for side effects', w: 0.0818, eq: 0.0769, s: 0.76 },
    { e: 'Flexible work hours during treatment (e.g., varying start/end times, compressed schedules)', w: 0.076, eq: 0.0769, s: 0.715 },
    { e: 'Job protection beyond local / legal requirements', w: 0.0623, eq: 0.0769, s: 0.48 },
    { e: 'Paid medical leave beyond local / legal requirements', w: 0.059, eq: 0.0769, s: 0.395 },
    { e: 'Reduced schedule/part-time with full benefits', w: 0.0579, eq: 0.0769, s: 0.425 },
    { e: 'Paid micro-breaks for medical-related side effects', w: 0.056, eq: 0.0769, s: 0.36 },
    { e: 'PTO accrual during leave', w: 0.0558, eq: 0.0769, s: 0.335 },
    { e: 'Full salary (100%) continuation during cancer-related short-term disability leave', w: 0.0553, eq: 0.0769, s: 0.295 },
    { e: 'Disability pay top-up (employer adds to disability insurance)', w: 0.0553, eq: 0.0769, s: 0.285 },
    { e: 'Leave donation bank (employees can donate PTO to colleagues)', w: 0.0551, eq: 0.0769, s: 0.27 }
  ],
  2: [
    { e: 'Accelerated life insurance benefits (partial payout for terminal / critical illness)', w: 0.1724, eq: 0.0588, s: 0.96 },
    { e: 'Tax/estate planning assistance', w: 0.1346, eq: 0.0588, s: 0.91 },
    { e: 'Real-time cost estimator tools', w: 0.0742, eq: 0.0588, s: 0.825 },
    { e: 'Insurance advocacy/pre-authorization support', w: 0.072, eq: 0.0588, s: 0.78 },
    { e: '$0 copay for specialty drugs', w: 0.0553, eq: 0.0588, s: 0.62 },
    { e: 'Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance', w: 0.0463, eq: 0.0588, s: 0.515 },
    { e: 'Financial counseling services', w: 0.0449, eq: 0.0588, s: 0.485 },
    { e: 'Long-term disability covering 60%+ of salary', w: 0.0448, eq: 0.0588, s: 0.525 },
    { e: 'Paid time off for clinical trial participation', w: 0.0433, eq: 0.0588, s: 0.505 },
    { e: 'Coverage for clinical trials and experimental treatments not covered by standard health insurance', w: 0.0424, eq: 0.0588, s: 0.485 },
    { e: 'Short-term disability covering 60%+ of salary', w: 0.0424, eq: 0.0588, s: 0.45 },
    { e: 'Hardship grants program funded by employer', w: 0.0395, eq: 0.0588, s: 0.395 },
    { e: 'Guaranteed job protection', w: 0.0385, eq: 0.0588, s: 0.36 },
    { e: 'Employer-paid disability insurance supplements', w: 0.038, eq: 0.0588, s: 0.325 },
    { e: 'Voluntary supplemental illness insurance (with employer contribution)', w: 0.0378, eq: 0.0588, s: 0.34 },
    { e: 'Set out-of-pocket maximums (for in-network single coverage)', w: 0.0369, eq: 0.0588, s: 0.26 },
    { e: 'Travel/lodging reimbursement for specialized care beyond insurance coverage', w: 0.0367, eq: 0.0588, s: 0.26 }
  ],
  3: [
    { e: 'Manager peer support / community building', w: 0.2, eq: 0.1, s: 0.9 },
    { e: 'Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams', w: 0.1958, eq: 0.1, s: 0.865 },
    { e: 'Empathy/communication skills training', w: 0.1639, eq: 0.1, s: 0.775 },
    { e: 'Dedicated manager resource hub', w: 0.0802, eq: 0.1, s: 0.505 },
    { e: 'Clear escalation protocol for manager response', w: 0.0707, eq: 0.1, s: 0.46 },
    { e: 'Manager evaluations include how well they support impacted employees', w: 0.0632, eq: 0.1, s: 0.37 },
    { e: 'Privacy protection and confidentiality management', w: 0.0584, eq: 0.1, s: 0.325 },
    { e: 'AI-powered guidance tools', w: 0.058, eq: 0.1, s: 0.33 },
    { e: 'Legal compliance training', w: 0.0555, eq: 0.1, s: 0.235 },
    { e: 'Senior leader coaching on supporting impacted employees', w: 0.0544, eq: 0.1, s: 0.235 }
  ],
  4: [
    { e: 'Physical rehabilitation support', w: 0.2001, eq: 0.1, s: 0.98 },
    { e: 'Nutrition coaching', w: 0.1317, eq: 0.1, s: 0.73 },
    { e: 'Insurance advocacy/appeals support', w: 0.1024, eq: 0.1, s: 0.625 },
    { e: 'Dedicated navigation support to help employees understand benefits and access medical care', w: 0.0867, eq: 0.1, s: 0.475 },
    { e: 'Online tools, apps, or portals for health/benefits support', w: 0.0818, eq: 0.1, s: 0.42 },
    { e: 'Occupational therapy/vocational rehabilitation', w: 0.0806, eq: 0.1, s: 0.37 },
    { e: 'Care coordination concierge', w: 0.0805, eq: 0.1, s: 0.38 },
    { e: 'Survivorship planning assistance', w: 0.0801, eq: 0.1, s: 0.385 },
    { e: 'Benefits optimization assistance (maximizing coverage, minimizing costs)', w: 0.079, eq: 0.1, s: 0.35 },
    { e: 'Clinical trial matching service', w: 0.0772, eq: 0.1, s: 0.285 }
  ],
  5: [
    { e: 'Flexible scheduling options', w: 0.2, eq: 0.0909, s: 0.84 },
    { e: 'Ergonomic equipment funding', w: 0.1399, eq: 0.0909, s: 0.79 },
    { e: 'Temporary role redesigns', w: 0.1125, eq: 0.0909, s: 0.71 },
    { e: 'Rest areas / quiet spaces', w: 0.1125, eq: 0.0909, s: 0.72 },
    { e: 'Assistive technology catalog', w: 0.0894, eq: 0.0909, s: 0.63 },
    { e: 'Cognitive / fatigue support tools', w: 0.068, eq: 0.0909, s: 0.49 },
    { e: 'Priority parking', w: 0.0655, eq: 0.0909, s: 0.52 },
    { e: 'Policy accommodations (e.g., dress code flexibility, headphone use)', w: 0.0577, eq: 0.0909, s: 0.44 },
    { e: 'Remote work capability', w: 0.0539, eq: 0.0909, s: 0.325 },
    { e: 'Physical workspace modifications', w: 0.0523, eq: 0.0909, s: 0.3 },
    { e: 'Transportation reimbursement', w: 0.0482, eq: 0.0909, s: 0.235 }
  ],
  6: [
    { e: 'Employee peer support groups (internal employees with shared experience)', w: 0.2, eq: 0.0833, s: 0.985 },
    { e: 'Stigma-reduction initiatives', w: 0.1628, eq: 0.0833, s: 0.77 },
    { e: 'Anonymous benefits navigation tool or website (no login required)', w: 0.1039, eq: 0.0833, s: 0.745 },
    { e: 'Specialized emotional counseling', w: 0.0746, eq: 0.0833, s: 0.505 },
    { e: 'Manager training on handling sensitive health information', w: 0.0664, eq: 0.0833, s: 0.47 },
    { e: 'Strong anti-discrimination policies specific to health conditions', w: 0.0635, eq: 0.0833, s: 0.47 },
    { e: 'Inclusive communication guidelines', w: 0.0623, eq: 0.0833, s: 0.435 },
    { e: 'Professional-led support groups (external facilitator/counselor)', w: 0.0591, eq: 0.0833, s: 0.45 },
    { e: 'Written anti-retaliation policies for health disclosures', w: 0.0564, eq: 0.0833, s: 0.37 },
    { e: 'Confidential HR channel for health benefits, policies and insurance-related questions', w: 0.0508, eq: 0.0833, s: 0.305 },
    { e: 'Clear process for confidential health disclosures', w: 0.0504, eq: 0.0833, s: 0.245 },
    { e: 'Optional open health dialogue forums', w: 0.0496, eq: 0.0833, s: 0.25 }
  ],
  7: [
    { e: 'Peer mentorship program (employees who had similar condition mentoring current employees)', w: 0.2001, eq: 0.1111, s: 0.985 },
    { e: 'Continued access to training/development', w: 0.1797, eq: 0.1111, s: 0.87 },
    { e: 'Adjusted performance goals/deliverables during treatment and recovery', w: 0.1006, eq: 0.1111, s: 0.59 },
    { e: 'Succession planning protections', w: 0.0973, eq: 0.1111, s: 0.56 },
    { e: 'Optional stay-connected program', w: 0.096, eq: 0.1111, s: 0.52 },
    { e: 'Structured reintegration programs', w: 0.0936, eq: 0.1111, s: 0.51 },
    { e: 'Career coaching for employees managing cancer or other serious health conditions', w: 0.0829, eq: 0.1111, s: 0.43 },
    { e: 'Professional coach/mentor for employees managing cancer or other serious health conditions', w: 0.0764, eq: 0.1111, s: 0.325 },
    { e: 'Project continuity protocols', w: 0.0735, eq: 0.1111, s: 0.21 }
  ],
  8: [
    { e: 'Flexibility for medical setbacks', w: 0.1922, eq: 0.0833, s: 0.83 },
    { e: 'Long-term success tracking', w: 0.1428, eq: 0.0833, s: 0.88 },
    { e: 'Manager training on supporting team members during treatment/return', w: 0.1371, eq: 0.0833, s: 0.815 },
    { e: 'Workload adjustments during treatment', w: 0.092, eq: 0.0833, s: 0.635 },
    { e: 'Access to occupational therapy/vocational rehabilitation', w: 0.0797, eq: 0.0833, s: 0.63 },
    { e: 'Buddy/mentor pairing for support', w: 0.0588, eq: 0.0833, s: 0.475 },
    { e: 'Structured progress reviews', w: 0.0573, eq: 0.0833, s: 0.385 },
    { e: 'Flexible work arrangements during treatment', w: 0.0548, eq: 0.0833, s: 0.395 },
    { e: 'Online peer support forums', w: 0.0538, eq: 0.0833, s: 0.415 },
    { e: 'Phased return-to-work plans', w: 0.0445, eq: 0.0833, s: 0.195 },
    { e: 'Contingency planning for treatment schedules', w: 0.0444, eq: 0.0833, s: 0.21 },
    { e: 'Access to specialized work resumption professionals', w: 0.0426, eq: 0.0833, s: 0.135 }
  ],
  9: [
    { e: 'Executive sponsors communicate regularly about workplace support programs', w: 0.2001, eq: 0.0833, s: 0.97 },
    { e: 'ESG/CSR reporting inclusion', w: 0.143, eq: 0.0833, s: 0.72 },
    { e: 'Public success story celebrations', w: 0.1323, eq: 0.0833, s: 0.76 },
    { e: 'Year-over-year budget growth', w: 0.0873, eq: 0.0833, s: 0.645 },
    { e: 'Executive-led town halls focused on health benefits and employee support', w: 0.0767, eq: 0.0833, s: 0.59 },
    { e: 'Support programs included in investor/stakeholder communications', w: 0.0612, eq: 0.0833, s: 0.435 },
    { e: 'Compensation tied to support outcomes', w: 0.0546, eq: 0.0833, s: 0.43 },
    { e: 'Executive accountability metrics', w: 0.0503, eq: 0.0833, s: 0.315 },
    { e: 'C-suite executive serves as program champion/sponsor', w: 0.0495, eq: 0.0833, s: 0.3 },
    { e: 'Cross-functional executive steering committee for workplace support programs', w: 0.0489, eq: 0.0833, s: 0.295 },
    { e: 'Support metrics included in annual report/sustainability reporting', w: 0.0486, eq: 0.0833, s: 0.275 },
    { e: 'Dedicated budget allocation for serious illness support programs', w: 0.0477, eq: 0.0833, s: 0.265 }
  ],
  10: [
    { e: 'Practical support for managing caregiving and work', w: 0.1259, eq: 0.05, s: 0.92 },
    { e: 'Eldercare consultation and referral services', w: 0.0988, eq: 0.05, s: 0.81 },
    { e: 'Family navigation support', w: 0.0743, eq: 0.05, s: 0.775 },
    { e: 'Caregiver resource navigator/concierge', w: 0.0485, eq: 0.05, s: 0.565 },
    { e: 'Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)', w: 0.0465, eq: 0.05, s: 0.56 },
    { e: 'Paid caregiver leave with expanded eligibility (beyond local legal requirements)', w: 0.0465, eq: 0.05, s: 0.545 },
    { e: 'Unpaid leave job protection beyond local / legal requirements', w: 0.0431, eq: 0.05, s: 0.48 },
    { e: 'Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)', w: 0.043, eq: 0.05, s: 0.505 },
    { e: 'Flexible work arrangements for caregivers', w: 0.0416, eq: 0.05, s: 0.455 },
    { e: 'Emergency dependent care when regular arrangements unavailable', w: 0.0414, eq: 0.05, s: 0.48 },
    { e: 'Respite care funding/reimbursement', w: 0.041, eq: 0.05, s: 0.465 },
    { e: 'Paid time off for care coordination appointments', w: 0.041, eq: 0.05, s: 0.44 },
    { e: 'Legal/financial planning assistance for caregivers', w: 0.0408, eq: 0.05, s: 0.455 },
    { e: 'Manager training for supervising caregivers', w: 0.0396, eq: 0.05, s: 0.44 },
    { e: 'Caregiver peer support groups', w: 0.0396, eq: 0.05, s: 0.42 },
    { e: 'Dependent care subsidies', w: 0.039, eq: 0.05, s: 0.42 },
    { e: 'Mental health support specifically for caregivers', w: 0.0389, eq: 0.05, s: 0.4 },
    { e: 'Modified job duties during peak caregiving periods', w: 0.0376, eq: 0.05, s: 0.32 },
    { e: 'Emergency caregiver funds', w: 0.0367, eq: 0.05, s: 0.285 },
    { e: 'Dependent care account matching/contributions', w: 0.0365, eq: 0.05, s: 0.26 }
  ],
  11: [
    { e: 'Legal protections beyond requirements', w: 0.1655, eq: 0.0769, s: 0.96 },
    { e: 'Individual health assessments (online or in-person)', w: 0.1453, eq: 0.0769, s: 0.855 },
    { e: 'Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)', w: 0.1252, eq: 0.0769, s: 0.81 },
    { e: 'Genetic screening/counseling', w: 0.1172, eq: 0.0769, s: 0.83 },
    { e: 'Full or partial coverage for annual health screenings/checkups', w: 0.0592, eq: 0.0769, s: 0.51 },
    { e: 'Regular health education sessions', w: 0.055, eq: 0.0769, s: 0.465 },
    { e: 'Paid time off for preventive care appointments', w: 0.0542, eq: 0.0769, s: 0.515 },
    { e: 'At least 70% coverage for regionally / locally recommended screenings', w: 0.0534, eq: 0.0769, s: 0.435 },
    { e: 'On-site vaccinations', w: 0.0499, eq: 0.0769, s: 0.4 },
    { e: 'Workplace safety assessments to minimize health risks', w: 0.0457, eq: 0.0769, s: 0.39 },
    { e: 'Targeted risk-reduction programs', w: 0.0455, eq: 0.0769, s: 0.355 },
    { e: 'Risk factor tracking/reporting', w: 0.0444, eq: 0.0769, s: 0.315 },
    { e: 'Lifestyle coaching programs', w: 0.0396, eq: 0.0769, s: 0.16 }
  ],
  12: [
    { e: 'Regular program enhancements', w: 0.2, eq: 0.1111, s: 0.9 },
    { e: 'Employee confidence in employer support', w: 0.1522, eq: 0.1111, s: 0.735 },
    { e: 'Innovation pilots', w: 0.1419, eq: 0.1111, s: 0.765 },
    { e: 'External benchmarking', w: 0.1289, eq: 0.1111, s: 0.745 },
    { e: 'Program utilization analytics', w: 0.099, eq: 0.1111, s: 0.55 },
    { e: 'Return-to-work success metrics', w: 0.0797, eq: 0.1111, s: 0.465 },
    { e: 'Employee satisfaction tracking', w: 0.0683, eq: 0.1111, s: 0.35 },
    { e: 'Business impact/ROI assessment', w: 0.0651, eq: 0.1111, s: 0.25 },
    { e: 'Measure screening campaign ROI (e.g. participation rates, inquiries about access, etc.)', w: 0.0649, eq: 0.1111, s: 0.24 }
  ],
  13: [
    { e: 'Family/caregiver communication inclusion', w: 0.2001, eq: 0.0909, s: 0.97 },
    { e: 'Employee testimonials/success stories', w: 0.1368, eq: 0.0909, s: 0.855 },
    { e: 'Proactive communication at point of diagnosis disclosure', w: 0.1315, eq: 0.0909, s: 0.915 },
    { e: 'Multi-channel communication strategy', w: 0.0984, eq: 0.0909, s: 0.685 },
    { e: 'Anonymous information access options', w: 0.0981, eq: 0.0909, s: 0.84 },
    { e: 'Ability to access program information and resources anonymously', w: 0.0947, eq: 0.0909, s: 0.805 },
    { e: 'Dedicated program website or portal', w: 0.0532, eq: 0.0909, s: 0.38 },
    { e: 'Regular company-wide awareness campaigns (at least quarterly)', w: 0.0473, eq: 0.0909, s: 0.185 },
    { e: 'New hire orientation coverage', w: 0.0471, eq: 0.0909, s: 0.17 },
    { e: 'Manager toolkit for cascade communications', w: 0.0465, eq: 0.0909, s: 0.115 },
    { e: 'Cancer awareness month campaigns with resources', w: 0.0462, eq: 0.0909, s: 0.08 }
  ]
};

// ============================================
// HELPER: Normalize element text for matching
// ============================================
function normalizeElementText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Build lookup map for faster matching
function buildElementLookup(dim: number): Map<string, { w: number; eq: number; s: number }> {
  const lookup = new Map();
  const weights = ELEMENT_WEIGHTS[dim] || [];
  for (const w of weights) {
    lookup.set(normalizeElementText(w.e), { w: w.w, eq: w.eq, s: w.s });
  }
  return lookup;
}

// ============================================
// SCORING FUNCTIONS
// ============================================

function statusToPoints(status: string | number): { points: number | null; isUnsure: boolean } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: GRID_POINTS.OFFER, isUnsure: false };
      case 3: return { points: GRID_POINTS.PLAN, isUnsure: false };
      case 2: return { points: GRID_POINTS.ASSESS, isUnsure: false };
      case 1: return { points: GRID_POINTS.NOT, isUnsure: false };
      case 5: return { points: null, isUnsure: true };
      default: return { points: null, isUnsure: false };
    }
  }
  
  const s = String(status).toLowerCase().trim();
  
  // Check in order of specificity to avoid false matches
  if (s.includes('not able') || s.includes('not currently') || s.includes('do not')) {
    return { points: GRID_POINTS.NOT, isUnsure: false };
  }
  if (s === 'unsure' || s.includes('unsure') || s.includes('unknown') || s.includes("don't know")) {
    return { points: null, isUnsure: true };
  }
  if (s.includes('assessing') || s.includes('feasibility')) {
    return { points: GRID_POINTS.ASSESS, isUnsure: false };
  }
  if (s.includes('planning') || s.includes('development') || s.includes('in progress')) {
    return { points: GRID_POINTS.PLAN, isUnsure: false };
  }
  if (s.includes('currently offer') || s.includes('currently provide') || s.includes('we offer') || s.includes('we provide') || s.includes('we measure') || s.includes('we use')) {
    return { points: GRID_POINTS.OFFER, isUnsure: false };
  }
  
  // If it has content but doesn't match, treat as not offered
  if (s.length > 0) return { points: GRID_POINTS.NOT, isUnsure: false };
  
  return { points: null, isUnsure: false };
}

function getGeoMultiplier(geoResponse: any): number {
  if (!geoResponse) return 1.0;
  const s = String(geoResponse).toLowerCase();
  if (s.includes('select locations') || s.includes('some locations')) return 0.75;
  if (s.includes('varies') || s.includes('different')) return 0.90;
  return 1.0;
}

function calculateFollowUpScore(dim: number, assessment: Record<string, any>): number | null {
  const dimData = assessment[`dimension${dim}_data`];
  if (!dimData) return null;
  
  const scores: number[] = [];
  
  const addScore = (value: string | undefined, scoreFn: (s: string) => number) => {
    if (value) scores.push(scoreFn(value));
  };
  
  if (dim === 1) {
    addScore(dimData.d1_1_usa || dimData.d1_1, (s) => {
      const l = s.toLowerCase();
      if (l.includes('100%')) return 100;
      if (l.includes('80') || l.includes('75')) return 80;
      if (l.includes('60') || l.includes('50')) return 50;
      if (l.includes('legal') || l.includes('minimum')) return 0;
      return 30;
    });
    addScore(dimData.d1_2, (s) => {
      const l = s.toLowerCase();
      if (l.includes('full benefits')) return 100;
      if (l.includes('prorated')) return 60;
      if (l.includes('no benefits')) return 30;
      return 0;
    });
  } else if (dim === 3) {
    addScore(dimData.d3_1, (s) => {
      const l = s.toLowerCase();
      if (l.includes('required') || l.includes('mandatory')) return 100;
      if (l.includes('available') || l.includes('optional')) return 60;
      if (l.includes('planning')) return 30;
      return 0;
    });
  } else if (dim === 12) {
    addScore(dimData.d12_1, (s) => {
      const l = s.toLowerCase();
      if (l.includes('quarterly') || l.includes('regular')) return 100;
      if (l.includes('annual')) return 60;
      if (l.includes('ad hoc')) return 30;
      return 0;
    });
    addScore(dimData.d12_2, (s) => {
      const l = s.toLowerCase();
      if (l.includes('regularly') || l.includes('systematic')) return 100;
      if (l.includes('occasionally')) return 50;
      return 0;
    });
  } else if (dim === 13) {
    addScore(dimData.d13_1, (s) => {
      const l = s.toLowerCase();
      if (l.includes('proactive') || l.includes('at diagnosis')) return 100;
      if (l.includes('upon request')) return 50;
      if (l.includes('general')) return 30;
      return 0;
    });
  }
  
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
}

function calculateMaturity(assessment: Record<string, any>): number {
  const s = (assessment.current_support_data?.or1 || '').toLowerCase();
  if (s.includes('comprehensive') || s.includes('well-established')) return 100;
  if (s.includes('enhanced') || s.includes('developed')) return 80;
  if (s.includes('moderate') || s.includes('growing')) return 50;
  if (s.includes('developing') || s.includes('early') || s.includes('beginning')) return 20;
  return 0;
}

function calculateBreadth(assessment: Record<string, any>): number {
  const cs = assessment.current_support_data;
  if (!cs) return 0;
  
  let score = 0, count = 0;
  for (const field of ['cb3a', 'cb3b', 'cb3c']) {
    const v = cs[field];
    if (v) {
      count++;
      const s = String(v).toLowerCase();
      if (s.includes('beyond') || s.includes('exceed') || s.includes('above') || s.includes('comprehensive')) {
        score += 100;
      } else if (s.includes('meet') || s.includes('comply') || s.includes('standard')) {
        score += 50;
      } else if (s.includes('below') || s.includes('minimum') || s.includes('none') || s.includes('not')) {
        score += 0;
      } else {
        score += 25;
      }
    }
  }
  return count > 0 ? Math.round(score / count) : 0;
}

// ============================================
// DIMENSION SCORING RESULT
// ============================================
interface DimensionResult {
  equalWeightedScore: number;
  elementWeightedScore: number;
  unsureCount: number;
  totalElements: number;
  matchedElements: number;
  unmatchedElements: string[];
}

function scoreDimension(dim: number, assessment: Record<string, any>): DimensionResult {
  const result: DimensionResult = {
    equalWeightedScore: 0,
    elementWeightedScore: 0,
    unsureCount: 0,
    totalElements: 0,
    matchedElements: 0,
    unmatchedElements: []
  };
  
  const dimData = assessment[`dimension${dim}_data`];
  if (!dimData) return result;
  
  const grid = dimData[`d${dim}a`];
  if (!grid || typeof grid !== 'object') return result;
  
  const elementLookup = buildElementLookup(dim);
  
  let earnedPoints = 0;
  let answeredCount = 0;
  const elementScores: Array<{ key: string; points: number; weight: number }> = [];
  
  Object.entries(grid).forEach(([key, value]: [string, any]) => {
    // D10 exclusion check
    if (dim === 10 && D10_EXCLUDED_ELEMENTS.some(ex => normalizeElementText(ex) === normalizeElementText(key))) {
      return;
    }
    
    result.totalElements++;
    const { points, isUnsure } = statusToPoints(value);
    
    if (isUnsure) {
      result.unsureCount++;
      answeredCount++; // Include unsure in denominator (conservative approach)
    } else if (points !== null) {
      answeredCount++;
      earnedPoints += points;
      
      // Try to find matching weight
      const normalizedKey = normalizeElementText(key);
      const weightInfo = elementLookup.get(normalizedKey);
      
      if (weightInfo) {
        result.matchedElements++;
        elementScores.push({ key, points, weight: weightInfo.w });
      } else {
        result.unmatchedElements.push(key);
        // Fall back to equal weight
        const equalWeight = 1 / (ELEMENT_WEIGHTS[dim]?.length || result.totalElements);
        elementScores.push({ key, points, weight: equalWeight });
      }
    }
  });
  
  // Calculate equal-weighted score
  const maxPoints = answeredCount * GRID_POINTS.OFFER;
  const equalRaw = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
  
  // Calculate element-weighted score
  let weightedRaw = equalRaw;
  if (elementScores.length > 0) {
    let weightedSum = 0;
    let weightTotal = 0;
    
    for (const es of elementScores) {
      weightedSum += (es.points / GRID_POINTS.OFFER) * es.weight;
      weightTotal += es.weight;
    }
    
    // Include unsure elements in weight total (they contribute 0 points but count)
    Object.entries(grid).forEach(([key, value]: [string, any]) => {
      if (dim === 10 && D10_EXCLUDED_ELEMENTS.some(ex => normalizeElementText(ex) === normalizeElementText(key))) {
        return;
      }
      const { isUnsure } = statusToPoints(value);
      if (isUnsure) {
        const normalizedKey = normalizeElementText(key);
        const weightInfo = elementLookup.get(normalizedKey);
        weightTotal += weightInfo ? weightInfo.w : (1 / (ELEMENT_WEIGHTS[dim]?.length || result.totalElements));
      }
    });
    
    if (weightTotal > 0) {
      weightedRaw = Math.round((weightedSum / weightTotal) * 100);
    }
  }
  
  // Apply geo multiplier
  const geo = getGeoMultiplier(dimData[`d${dim}aa`] || dimData[`D${dim}aa`]);
  const equalAfterGeo = Math.round(equalRaw * geo);
  const weightedAfterGeo = Math.round(weightedRaw * geo);
  
  // Apply follow-up blending for D1, D3, D12, D13
  if ([1, 3, 12, 13].includes(dim)) {
    const followUp = calculateFollowUpScore(dim, assessment);
    if (followUp !== null) {
      result.equalWeightedScore = Math.round(equalAfterGeo * 0.85 + followUp * 0.15);
      result.elementWeightedScore = Math.round(weightedAfterGeo * 0.85 + followUp * 0.15);
    } else {
      result.equalWeightedScore = equalAfterGeo;
      result.elementWeightedScore = weightedAfterGeo;
    }
  } else {
    result.equalWeightedScore = equalAfterGeo;
    result.elementWeightedScore = weightedAfterGeo;
  }
  
  return result;
}

// ============================================
// COMPANY SCORING RESULT
// ============================================
interface CompanyResult {
  name: string;
  surveyId: string;
  isPanel: boolean;
  isComplete: boolean;
  dimensions: Record<number, DimensionResult>;
  equalWeightedComposite: number;
  elementWeightedComposite: number;
  maturity: number;
  breadth: number;
  unsurePercentage: number;
  matchRate: number;
}

function scoreCompany(assessment: Record<string, any>): CompanyResult {
  const id = assessment.app_id || assessment.survey_id || '';
  const isPanel = id.startsWith('PANEL-');
  
  const dimensions: Record<number, DimensionResult> = {};
  let completeDimensions = 0;
  let totalUnsure = 0;
  let totalElements = 0;
  let totalMatched = 0;
  
  for (let d = 1; d <= 13; d++) {
    dimensions[d] = scoreDimension(d, assessment);
    if (dimensions[d].totalElements > 0) completeDimensions++;
    totalUnsure += dimensions[d].unsureCount;
    totalElements += dimensions[d].totalElements;
    totalMatched += dimensions[d].matchedElements;
  }
  
  const isComplete = completeDimensions === 13;
  const maturity = calculateMaturity(assessment);
  const breadth = calculateBreadth(assessment);
  
  // Calculate composite scores
  let equalWeightedDim = 0;
  let elementWeightedDim = 0;
  
  if (isComplete) {
    const totalWeight = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
    for (let d = 1; d <= 13; d++) {
      const dimWeight = (DIMENSION_WEIGHTS[d] || 0) / totalWeight;
      equalWeightedDim += dimensions[d].equalWeightedScore * dimWeight;
      elementWeightedDim += dimensions[d].elementWeightedScore * dimWeight;
    }
  }
  
  const equalWeightedComposite = isComplete ? Math.round(equalWeightedDim * 0.90 + maturity * 0.05 + breadth * 0.05) : 0;
  const elementWeightedComposite = isComplete ? Math.round(elementWeightedDim * 0.90 + maturity * 0.05 + breadth * 0.05) : 0;
  
  return {
    name: assessment.company_name || assessment.firmographics_data?.company_name || id || 'Unknown',
    surveyId: assessment.survey_id || id,
    isPanel,
    isComplete,
    dimensions,
    equalWeightedComposite,
    elementWeightedComposite,
    maturity,
    breadth,
    unsurePercentage: totalElements > 0 ? totalUnsure / totalElements : 0,
    matchRate: totalElements > 0 ? totalMatched / totalElements : 0
  };
}

// ============================================
// UI HELPER COMPONENTS
// ============================================

function getScoreColor(score: number): string {
  if (score >= 90) return '#7C3AED'; // Exemplary - purple
  if (score >= 75) return '#059669'; // Leading - green
  if (score >= 60) return '#2563EB'; // Progressing - blue
  if (score >= 40) return '#D97706'; // Emerging - amber
  return '#DC2626'; // Developing - red
}

function formatDelta(v: number): string {
  return (v >= 0 ? '+' : '') + v;
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ElementWeightingPage() {
  const [activeTab, setActiveTab] = useState<'methodology' | 'comparison'>('methodology');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDimension, setExpandedDimension] = useState<number | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [benchmarkMode, setBenchmarkMode] = useState<'all' | 'index'>('all');

  useEffect(() => {
    (async () => {
      // Optimized query - only fetch needed fields
      const { data: assessments } = await supabase
        .from('assessments')
        .select(`
          id, app_id, survey_id, company_name,
          firmographics_data,
          current_support_data,
          dimension1_data, dimension2_data, dimension3_data, dimension4_data,
          dimension5_data, dimension6_data, dimension7_data, dimension8_data,
          dimension9_data, dimension10_data, dimension11_data, dimension12_data, dimension13_data,
          dimension1_complete, dimension2_complete, dimension3_complete, dimension4_complete,
          dimension5_complete, dimension6_complete, dimension7_complete, dimension8_complete,
          dimension9_complete, dimension10_complete, dimension11_complete, dimension12_complete, dimension13_complete
        `)
        .order('company_name');
      
      if (assessments) setData(assessments);
      setLoading(false);
    })();
  }, []);

  const results = useMemo(() => {
    if (!data.length) return { companies: [] as CompanyResult[], benchmark: null as CompanyResult | null };
    
    // Filter out test accounts and incomplete data
    const all = data
      .filter((a: any) => {
        const id = a.app_id || a.survey_id || '';
        return !id.startsWith('TEST') && a.dimension1_data;
      })
      .map(scoreCompany);
    
    const complete = all.filter(c => c.isComplete);
    const benchmarkPool = benchmarkMode === 'index' ? complete.filter(c => !c.isPanel) : complete;
    const indexCompanies = complete.filter(c => !c.isPanel).sort((a, b) => b.elementWeightedComposite - a.elementWeightedComposite);
    
    // Calculate benchmark
    let benchmark: CompanyResult | null = null;
    if (benchmarkPool.length > 0) {
      const avgEqual = Math.round(benchmarkPool.reduce((s, c) => s + c.equalWeightedComposite, 0) / benchmarkPool.length);
      const avgWeighted = Math.round(benchmarkPool.reduce((s, c) => s + c.elementWeightedComposite, 0) / benchmarkPool.length);
      
      const benchDims: Record<number, DimensionResult> = {};
      for (let d = 1; d <= 13; d++) {
        const dimResults = benchmarkPool.filter(c => c.dimensions[d]?.totalElements > 0);
        if (dimResults.length > 0) {
          benchDims[d] = {
            equalWeightedScore: Math.round(dimResults.reduce((s, c) => s + c.dimensions[d].equalWeightedScore, 0) / dimResults.length),
            elementWeightedScore: Math.round(dimResults.reduce((s, c) => s + c.dimensions[d].elementWeightedScore, 0) / dimResults.length),
            unsureCount: 0,
            totalElements: 0,
            matchedElements: 0,
            unmatchedElements: []
          };
        } else {
          benchDims[d] = { equalWeightedScore: 0, elementWeightedScore: 0, unsureCount: 0, totalElements: 0, matchedElements: 0, unmatchedElements: [] };
        }
      }
      
      benchmark = {
        name: 'Benchmark',
        surveyId: 'BENCHMARK',
        isPanel: false,
        isComplete: true,
        dimensions: benchDims,
        equalWeightedComposite: avgEqual,
        elementWeightedComposite: avgWeighted,
        maturity: 0,
        breadth: 0,
        unsurePercentage: 0,
        matchRate: benchmarkPool.reduce((s, c) => s + c.matchRate, 0) / benchmarkPool.length
      };
    }
    
    return { companies: indexCompanies, benchmark };
  }, [data, benchmarkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Loading assessment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - matches company report style */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-10" />
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <h1 className="text-xl font-semibold text-slate-800">Element Weighting Analysis</h1>
                <p className="text-sm text-slate-500 mt-0.5">Scoring Calibration Methodology & Impact Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/admin/scoring" 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Aggregate Scoring
              </Link>
              <Link 
                href="/admin" 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex gap-1">
            {([
              { key: 'methodology', label: 'Methodology' },
              { key: 'comparison', label: 'Score Comparison & Element Weights' }
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-slate-800 text-slate-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {activeTab === 'methodology' ? (
          <MethodologyTab showTechnical={showTechnical} setShowTechnical={setShowTechnical} />
        ) : (
          <ComparisonTab 
            companies={results.companies} 
            benchmark={results.benchmark}
            expandedDimension={expandedDimension}
            setExpandedDimension={setExpandedDimension}
            benchmarkMode={benchmarkMode}
            setBenchmarkMode={setBenchmarkMode}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// METHODOLOGY TAB
// ============================================

function MethodologyTab({ showTechnical, setShowTechnical }: { showTechnical: boolean; setShowTechnical: (v: boolean) => void }) {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Executive Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-semibold text-slate-900">What We Did and Why</h2>
          <p className="text-sm text-slate-500 mt-1">Element weighting calibration for the Best Companies Index</p>
        </div>
        <div className="px-8 py-6 space-y-6 text-sm text-slate-700 leading-relaxed">
          <p>
            <span className="font-semibold text-slate-900">Not all survey elements carry equal weight in differentiating program quality.</span>{' '}
            Some elements represent table-stakes practices that most organizations offer. Others are rarer commitments that signal 
            a genuinely mature, comprehensive program. The goal of element weighting is to let the scoring reflect that distinction, 
            without overreacting to sample-specific patterns or undermining the conceptual framework that underpins the Index.
          </p>
          
          <div className="border-l-4 border-slate-300 pl-5 py-3 bg-slate-50 rounded-r-lg">
            <p className="text-slate-600 italic">
              "We kept the CAC framework intact. We used the full maturity scale for each element, identified which items 
              most consistently differentiate stronger programs using only high-quality responses, and then blended those 
              findings back toward equal weighting so that we calibrate the scoring rather than overhaul it."
            </p>
          </div>

          <h3 className="text-base font-semibold text-slate-800 pt-2">The approach, step by step</h3>
          
          <div className="space-y-5">
            <Step n={1} title="Start with the existing framework" body="The 13 dimensions, the element response options (Not Offered, Assessing, Planning, Currently Offer), and the dimension weights all remain unchanged. Element weighting adjusts how much each item contributes within its dimension. Nothing else in the scoring pipeline is altered." />
            <Step n={2} title="Use the full response scale, not a binary shortcut" body="Each element is scored on its full four-level scale: Not Offered (0), Assessing (2), Planning (3), Currently Offer (5). Collapsing responses to a simple yes/no would discard the progression signal that the survey was designed to capture." />
            <Step n={3} title="Only learn weights from companies with sufficient confirmed data" body="If a company reported Unsure on more than 40% of elements in a given dimension, that company is excluded from weight estimation for that dimension. This prevents the model from learning patterns in incomplete or uncertain data. Excluded companies still receive scored reports using the final weights." />
            <Step n={4} title="Define importance to avoid circularity" body="An element's importance is measured by how well it predicts overall program strength outside its own dimension. For each dimension, the outcome variable is the average score across the other 12 dimensions. No element is rewarded simply for being part of the score it is predicting." />
            <Step n={5} title="Use a conservative modeling method designed for small samples" body="The model uses ridge regression, a standard statistical technique that prevents any single element from receiving an extreme weight due to chance correlations. Ridge is purpose-built for situations where the number of predictors is large relative to the number of observations." />
            <Step n={6} title="Measure importance through prediction impact, not raw coefficients" body="Rather than using model coefficients directly (which can be negative), we measure each element's importance by asking: if we temporarily scramble this element's data, how much does our ability to predict overall program strength drop? Elements that cause a larger drop when scrambled are stronger differentiators. This produces non-negative, intuitive importance scores." />
            <Step n={7} title="Test stability through bootstrapping" body="The importance calculation is repeated 200 times on different resamples of companies. Elements that consistently appear as important across resamples receive full weight. Elements whose importance fluctuates are dampened proportionally. This protects against any single company driving an element's weight." />
            <Step n={8} title="Blend toward equal weights so the result is a calibration, not a rewrite" body="The final weight for each element blends the empirical importance (50%) with equal weighting (50%). No single element can exceed 20% of its dimension's total weight. The result is modest differentiation grounded in observed data, with the CAC conceptual framework as the anchor. As participation grows in future years, the empirical share can increase." />
          </div>

          <h3 className="text-base font-semibold text-slate-800 pt-4">What the calibration produces</h3>
          <p>
            Across all scored companies, element weighting shifts composite scores by approximately 1 to 3 points. 
            Within each dimension, the highest-weighted element is typically 2 to 3 times the lowest. Rankings are 
            largely preserved, with modest reordering among companies with similar scores. This is the expected 
            behavior of a well-calibrated adjustment: meaningful differentiation without disruption.
          </p>
        </div>
      </div>

      {/* Technical Methodology Collapsible */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button 
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full px-8 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Full Statistical Methodology</h2>
            <p className="text-sm text-slate-500 mt-1">Technical specification for peer review and validation</p>
          </div>
          <svg 
            className={`w-5 h-5 text-slate-400 transition-transform ${showTechnical ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showTechnical && <TechnicalSection />}
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
        {n}
      </div>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="text-slate-600 mt-1">{body}</p>
      </div>
    </div>
  );
}

function TechnicalSection() {
  return (
    <div className="px-8 py-6 space-y-6 text-sm text-slate-700 leading-relaxed border-t border-slate-100">
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">1. Overview</h3>
        <p>Within each of the 13 assessment dimensions, element weights calibrate scoring so that elements more predictive of overall program strength receive modestly higher weight. The model operates on 159 elements across 13 dimensions (152 original plus 7 sub-elements introduced in 2026 for D1, D9, D10, D12, and D13), fit on n = 43 companies (22 index participants and 21 HR panel respondents).</p>
      </div>
      
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">2. Feature encoding</h3>
        <p>Each element is scored on its full ordinal scale: Currently Offer = 5, Planning = 3, Assessing = 2, Not Offered = 0. Unsure responses are treated as missing for model fitting. This preserves the full response granularity rather than collapsing to binary.</p>
      </div>
      
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">3. Company and element filtering</h3>
        <p>For each dimension, companies with fewer than 60% observed (non-Unsure) elements are excluded from model fitting. Elements with greater than 90% identical responses or fewer than 70% observed values are dropped and receive floor weight. In v6.1, zero elements were dropped.</p>
      </div>
      
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">4. Ridge regression with leave-one-out outcome</h3>
        <p>For each dimension d, the outcome variable is the leave-one-out composite: the mean of all dimension scores excluding dimension d. This eliminates circularity. Predictors are standardized (z-scored) ordinal element scores. Remaining missing values filled with column median. Ridge regularization (alpha = 1.0) distributes weight among correlated elements.</p>
      </div>
      
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">5. Permutation importance</h3>
        <p>Ridge coefficients are not used as weights directly because they can be negative due to multicollinearity. Instead, for each element, values are shuffled and the resulting R-squared drop is measured. This drop is non-negative by construction. Each element is permuted 100 times.</p>
      </div>
      
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">6. Bootstrap stability</h3>
        <p>200 bootstrap resamples of companies. In each, the ridge model is refit and permutation importances recomputed. Stability = fraction of bootstraps where importance exceeds zero. Soft attenuation: weight multiplied by stability to the power of 1.5.</p>
      </div>
      
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">7. Adaptive shrinkage</h3>
        <p className="mb-3">Cross-validated R-squared (5-fold) determines shrinkage per dimension. Negative CV R²: 30% empirical / 70% equal. Weak signal (0 to 0.10): 40% / 60%. Moderate to strong: 50% / 50%.</p>
        <div className="overflow-x-auto">
          <table className="text-xs border border-slate-200 rounded-lg w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-medium text-slate-500">Dim</th>
                <th className="px-3 py-2 text-left font-medium text-slate-500">Name</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">Elements</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">CV R²</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">α used</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">n</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">Dim Wt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DIMENSION_ORDER.map(d => {
                const m = DIM_META[d];
                return (
                  <tr key={d} className={m.cvR2 < 0 ? 'bg-amber-50/50' : ''}>
                    <td className="px-3 py-1.5 font-medium text-slate-700">D{d}</td>
                    <td className="px-3 py-1.5 text-slate-600">{DIMENSION_NAMES[d]}</td>
                    <td className="px-3 py-1.5 text-center">{m.elems}</td>
                    <td className={`px-3 py-1.5 text-center ${m.cvR2 < 0 ? 'text-amber-700 font-medium' : m.cvR2 > 0.3 ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>
                      {m.cvR2.toFixed(3)}
                    </td>
                    <td className="px-3 py-1.5 text-center">{m.alpha}</td>
                    <td className="px-3 py-1.5 text-center">{m.n}</td>
                    <td className="px-3 py-1.5 text-center">{DIMENSION_WEIGHTS[d]}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">8. Hard cap and normalization</h3>
        <p>No single element can exceed 20% of its dimension's total weight. Excess redistributed proportionally. Final weights normalize to 1.000 within each dimension.</p>
      </div>
      
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">9. Recalibration roadmap</h3>
        <p>At n = 43, equal weights remain the dominant anchor. At n = 75+, consider 60% empirical. At n = 100+, consider 70%. Recalibrate annually.</p>
      </div>
      
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">10. Why not simpler alternatives?</h3>
        <p className="mb-2"><span className="font-medium text-slate-800">Bivariate correlation:</span> Treats co-occurring elements independently, double-counting shared capability. Ridge distributes weight among correlated elements.</p>
        <p className="mb-2"><span className="font-medium text-slate-800">Raw ridge coefficients:</span> Can be negative. Permutation importance is non-negative by construction.</p>
        <p><span className="font-medium text-slate-800">Binary encoding:</span> Discards distinction between Assessing, Planning, and Currently Offer. Full ordinal scale yields stronger fit in 12 of 13 dimensions.</p>
      </div>
    </div>
  );
}

// ============================================
// COMPARISON TAB
// ============================================

function ComparisonTab({ 
  companies, 
  benchmark,
  expandedDimension,
  setExpandedDimension,
  benchmarkMode,
  setBenchmarkMode
}: { 
  companies: CompanyResult[];
  benchmark: CompanyResult | null;
  expandedDimension: number | null;
  setExpandedDimension: (d: number | null) => void;
  benchmarkMode: 'all' | 'index';
  setBenchmarkMode: (m: 'all' | 'index') => void;
}) {
  if (!benchmark || companies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <p className="text-slate-500">No completed assessments found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Benchmark Mode Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">Benchmark Population</p>
          <p className="text-xs text-slate-500 mt-0.5">Choose which companies to include in benchmark calculations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setBenchmarkMode('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              benchmarkMode === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Complete (Index + Panel)
          </button>
          <button
            onClick={() => setBenchmarkMode('index')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              benchmarkMode === 'index'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Index Companies Only
          </button>
        </div>
      </div>

      {/* Match Rate Warning */}
      {benchmark.matchRate < 0.9 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Element Matching Warning</p>
              <p className="text-xs text-amber-700 mt-1">
                Only {Math.round(benchmark.matchRate * 100)}% of grid elements matched weight table entries. 
                Unmatched elements fall back to equal weighting. This may indicate a mismatch between grid keys and weight table labels.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Score Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-semibold text-slate-900">Score Comparison: Equal Weight vs. Element-Weighted</h2>
          <p className="text-sm text-slate-500 mt-1">All pipeline components (dimension weights, geo multiplier, follow-up blending, maturity, breadth) are identical. The only difference is element weighting within dimensions.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="sticky left-0 bg-slate-50 z-10 px-4 py-3 text-left font-medium text-slate-500 min-w-[180px]">Metric</th>
                <th className="px-4 py-3 text-center font-medium text-slate-500 min-w-[90px] border-l border-slate-200 bg-slate-100">Benchmark</th>
                {companies.slice(0, 12).map(c => (
                  <th key={c.surveyId} className="px-3 py-3 text-center font-medium text-slate-600 min-w-[90px]">
                    <div className="truncate max-w-[90px]" title={c.name}>{c.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Composite Score Section */}
              <tr className="bg-slate-800">
                <td colSpan={2 + Math.min(companies.length, 12)} className="px-4 py-2.5 font-semibold text-xs text-white uppercase tracking-wider">
                  Composite Score
                </td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="sticky left-0 bg-white z-10 px-4 py-2.5 text-slate-600 font-medium">Equal Weight</td>
                <td className="px-4 py-2.5 text-center font-semibold text-slate-700 border-l border-slate-200 bg-slate-50">{benchmark.equalWeightedComposite}</td>
                {companies.slice(0, 12).map(c => (
                  <td key={c.surveyId} className="px-3 py-2.5 text-center text-slate-600">{c.equalWeightedComposite}</td>
                ))}
              </tr>
              <tr className="border-b border-slate-100 bg-emerald-50/40 hover:bg-emerald-50/60">
                <td className="sticky left-0 bg-emerald-50/40 z-10 px-4 py-2.5 text-emerald-800 font-medium">Element-Weighted</td>
                <td className="px-4 py-2.5 text-center font-semibold text-emerald-700 border-l border-slate-200 bg-emerald-50/60">{benchmark.elementWeightedComposite}</td>
                {companies.slice(0, 12).map(c => (
                  <td key={c.surveyId} className="px-3 py-2.5 text-center text-emerald-700 font-medium">{c.elementWeightedComposite}</td>
                ))}
              </tr>
              <tr className="border-b border-slate-200">
                <td className="sticky left-0 bg-white z-10 px-4 py-2.5 text-slate-500">Delta</td>
                <td className="px-4 py-2.5 text-center text-slate-500 border-l border-slate-200 bg-slate-50">
                  {formatDelta(benchmark.elementWeightedComposite - benchmark.equalWeightedComposite)}
                </td>
                {companies.slice(0, 12).map(c => {
                  const delta = c.elementWeightedComposite - c.equalWeightedComposite;
                  return (
                    <td key={c.surveyId} className="px-3 py-2.5 text-center">
                      <span className={delta >= 0 ? 'text-emerald-600' : 'text-amber-600'}>{formatDelta(delta)}</span>
                    </td>
                  );
                })}
              </tr>

              {/* Dimension Sections */}
              {DIMENSION_ORDER.map(d => (
                <React.Fragment key={d}>
                  <tr className="bg-slate-100 border-t border-slate-200">
                    <td colSpan={2 + Math.min(companies.length, 12)} className="px-4 py-2.5 font-semibold text-xs text-slate-700">
                      D{d}: {DIMENSION_NAMES[d]} <span className="font-normal text-slate-400 ml-2">({DIMENSION_WEIGHTS[d]}%)</span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="sticky left-0 bg-white z-10 px-4 py-2 text-slate-600 pl-8">Equal</td>
                    <td className="px-4 py-2 text-center text-slate-600 border-l border-slate-200 bg-slate-50">
                      {benchmark.dimensions[d]?.equalWeightedScore ?? '—'}
                    </td>
                    {companies.slice(0, 12).map(c => (
                      <td key={c.surveyId} className="px-3 py-2 text-center text-slate-600">
                        {c.dimensions[d]?.equalWeightedScore ?? '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-100 bg-emerald-50/30 hover:bg-emerald-50/50">
                    <td className="sticky left-0 bg-emerald-50/30 z-10 px-4 py-2 text-emerald-700 pl-8">Weighted</td>
                    <td className="px-4 py-2 text-center text-emerald-700 border-l border-slate-200 bg-emerald-50/40">
                      {benchmark.dimensions[d]?.elementWeightedScore ?? '—'}
                    </td>
                    {companies.slice(0, 12).map(c => (
                      <td key={c.surveyId} className="px-3 py-2 text-center text-emerald-700">
                        {c.dimensions[d]?.elementWeightedScore ?? '—'}
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Element Weights by Dimension */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-semibold text-slate-900">Element Weights by Dimension</h2>
          <p className="text-sm text-slate-500 mt-1">Click a dimension to expand element-level detail</p>
        </div>
        
        <div className="divide-y divide-slate-100">
          {DIMENSION_ORDER.map(d => {
            const meta = DIM_META[d];
            const weights = ELEMENT_WEIGHTS[d] || [];
            const isOpen = expandedDimension === d;
            
            return (
              <div key={d}>
                <button
                  onClick={() => setExpandedDimension(isOpen ? null : d)}
                  className="w-full px-8 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="w-7 h-7 rounded-full bg-slate-700 text-white text-xs font-semibold flex items-center justify-center">{d}</span>
                    <span className="text-sm font-medium text-slate-700">{DIMENSION_NAMES[d]}</span>
                    <span className="text-xs text-slate-400">{meta.elems} elements</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${meta.cvR2 < 0 ? 'bg-amber-100 text-amber-700' : meta.cvR2 > 0.3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      CV R² = {meta.cvR2.toFixed(3)}
                    </span>
                    <span className="text-xs text-slate-400">α = {meta.alpha}</span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isOpen && (
                  <div className="px-8 pb-6">
                    <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-3 py-2.5 text-left font-medium text-slate-500 w-8">#</th>
                          <th className="px-3 py-2.5 text-left font-medium text-slate-500">Element</th>
                          <th className="px-3 py-2.5 text-center font-medium text-slate-500 w-20">Equal Wt</th>
                          <th className="px-3 py-2.5 text-center font-medium text-slate-500 w-20">Adj. Wt</th>
                          <th className="px-3 py-2.5 text-center font-medium text-slate-500 w-20">Delta</th>
                          <th className="px-3 py-2.5 text-center font-medium text-slate-500 w-28">Stability</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {weights.map((w, i) => {
                          const delta = w.w - w.eq;
                          const isCapped = w.w >= 0.195;
                          return (
                            <tr key={i} className={isCapped ? 'bg-purple-50/40' : delta < 0 ? 'bg-slate-50/50' : ''}>
                              <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                              <td className="px-3 py-2 text-slate-700">{w.e}</td>
                              <td className="px-3 py-2 text-center text-slate-500">{(w.eq * 100).toFixed(1)}%</td>
                              <td className={`px-3 py-2 text-center font-medium ${isCapped ? 'text-purple-700' : 'text-slate-700'}`}>
                                {(w.w * 100).toFixed(1)}%
                                {isCapped && <span className="ml-1 text-purple-400" title="Capped at 20%">⚡</span>}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={delta >= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                                  {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all"
                                      style={{ 
                                        width: `${w.s * 100}%`,
                                        backgroundColor: w.s >= 0.7 ? '#059669' : w.s >= 0.5 ? '#d97706' : '#dc2626'
                                      }}
                                    />
                                  </div>
                                  <span className="text-slate-500 w-8">{Math.round(w.s * 100)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

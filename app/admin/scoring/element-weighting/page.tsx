'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// ============================================================
// ADMIN: Element Weighting Analysis (v6.1)
// Tabs:
// 1) Executive Overview (layman, HR/Exec audience)
// 2) Statistical Overview (technical spec + diagnostics)
// 3) Element Weights (equal vs adjusted + stability)
// 4) Scoring Impact (benchmark + company headers)
// ============================================================

// Supabase (read-only; ensure RLS restricts this page to admins)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Dimension weights (Index model)
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

// Grid points (ordinal scale)
const GRID_POINTS = { OFFER: 5, PLAN: 3, ASSESS: 2, NOT: 0 };

// Exclude this D10 element from scoring (per design decision)
const D10_EXCLUDED_ELEMENTS = [
  'Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'
];

// Dimension meta (from the calibration workbook)
const DIM_META: Record<number, { cvR2: number; alpha: number; n: number; elems: number }> = {
  1: { cvR2: -0.131, alpha: 0.3, n: 41, elems: 13 },
  2: { cvR2: 0.022, alpha: 0.4, n: 36, elems: 17 },
  3: { cvR2: 0.167, alpha: 0.5, n: 38, elems: 10 },
  4: { cvR2: 0.413, alpha: 0.5, n: 40, elems: 10 },
  5: { cvR2: 0.453, alpha: 0.5, n: 39, elems: 11 },
  6: { cvR2: 0.361, alpha: 0.5, n: 38, elems: 12 },
  7: { cvR2: 0.33, alpha: 0.5, n: 34, elems: 9 },
  8: { cvR2: 0.53, alpha: 0.5, n: 38, elems: 12 },
  9: { cvR2: 0.136, alpha: 0.5, n: 34, elems: 12 },
  10: { cvR2: 0.025, alpha: 0.4, n: 40, elems: 20 },
  11: { cvR2: 0.376, alpha: 0.5, n: 40, elems: 13 },
  12: { cvR2: 0.131, alpha: 0.5, n: 40, elems: 9 },
  13: { cvR2: 0.644, alpha: 0.5, n: 40, elems: 11 }
};

// FINAL element weights v6.1 (adjusted, capped, normalized within each dimension)
const ELEMENT_WEIGHTS: Record<number, Array<{ e: string; w: number; eq: number; s: number }>> = {
  1: [
    { e: "Emergency leave within 24 hours", w: 0.160744, eq: 0.076923, s: 1.0000 },
    { e: "Remote work options for on-site employees", w: 0.122696, eq: 0.076923, s: 1.0000 },
    { e: "Intermittent leave beyond local / legal requirements", w: 0.105572, eq: 0.076923, s: 0.9900 },
    { e: "Paid micro-breaks for side effects", w: 0.091662, eq: 0.076923, s: 0.9950 },
    { e: "Flexible work hours during treatment (e.g., varying start/end times, compressed schedules)", w: 0.088447, eq: 0.076923, s: 0.9950 },
    { e: "Job protection beyond local / legal requirements", w: 0.066177, eq: 0.076923, s: 0.9650 },
    { e: "Paid medical leave beyond local / legal requirements", w: 0.058219, eq: 0.076923, s: 0.9700 },
    { e: "Reduced schedule/part-time with full benefits", w: 0.056838, eq: 0.076923, s: 0.9700 },
    { e: "Disability pay top-up (employer adds to disability insurance)", w: 0.051819, eq: 0.076923, s: 0.9700 },
    { e: "Full salary (100%) continuation during cancer-related short-term disability leave", w: 0.051720, eq: 0.076923, s: 0.9650 },
    { e: "PTO accrual during leave", w: 0.049594, eq: 0.076923, s: 0.9800 },
    { e: "Leave donation bank (employees can donate PTO to colleagues)", w: 0.048417, eq: 0.076923, s: 0.9400 },
    { e: "Paid micro-breaks for medical-related side effects", w: 0.048096, eq: 0.076923, s: 0.9500 }
  ],
  2: [
    { e: "Accelerated life insurance benefits (partial payout for terminal / critical illness)", w: 0.154645, eq: 0.058824, s: 1.0000 },
    { e: "Tax/estate planning assistance", w: 0.118162, eq: 0.058824, s: 0.9950 },
    { e: "Real-time cost estimator tools", w: 0.073349, eq: 0.058824, s: 0.9850 },
    { e: "Insurance advocacy/pre-authorization support", w: 0.072306, eq: 0.058824, s: 1.0000 },
    { e: "$0 copay for specialty drugs", w: 0.056197, eq: 0.058824, s: 0.9950 },
    { e: "Short-term disability covering 60%+ of salary", w: 0.055313, eq: 0.058824, s: 0.9900 },
    { e: "Long-term disability covering 60%+ of salary", w: 0.048299, eq: 0.058824, s: 0.9900 },
    { e: "Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance", w: 0.046940, eq: 0.058824, s: 0.9950 },
    { e: "Financial counseling services", w: 0.046897, eq: 0.058824, s: 0.9650 },
    { e: "Paid time off for clinical trial participation", w: 0.043348, eq: 0.058824, s: 0.9800 },
    { e: "Coverage for clinical trials and experimental treatments not covered by standard health insurance", w: 0.043113, eq: 0.058824, s: 0.9750 },
    { e: "Employer-paid disability insurance supplements", w: 0.042410, eq: 0.058824, s: 0.9800 },
    { e: "Guaranteed job protection", w: 0.040960, eq: 0.058824, s: 0.9900 },
    { e: "Travel/lodging reimbursement for specialized care beyond insurance coverage", w: 0.039906, eq: 0.058824, s: 0.9850 },
    { e: "Hardship grants program funded by employer", w: 0.039768, eq: 0.058824, s: 0.9750 },
    { e: "Voluntary supplemental illness insurance (with employer contribution)", w: 0.039559, eq: 0.058824, s: 0.9750 },
    { e: "Set out-of-pocket maximums (for in-network single coverage)", w: 0.038828, eq: 0.058824, s: 0.9750 }
  ],
  3: [
    { e: "Manager peer support / community building", w: 0.174725, eq: 0.100000, s: 1.0000 },
    { e: "Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams", w: 0.154583, eq: 0.100000, s: 1.0000 },
    { e: "Empathy/communication skills training", w: 0.140133, eq: 0.100000, s: 0.9950 },
    { e: "Dedicated manager resource hub", w: 0.099820, eq: 0.100000, s: 0.9950 },
    { e: "Manager evaluations include how well they support impacted employees", w: 0.080495, eq: 0.100000, s: 0.9650 },
    { e: "Clear escalation protocol for manager response", w: 0.077347, eq: 0.100000, s: 0.9750 },
    { e: "Legal compliance training", w: 0.071002, eq: 0.100000, s: 0.9700 },
    { e: "AI-powered guidance tools", w: 0.069294, eq: 0.100000, s: 0.9700 },
    { e: "Privacy protection and confidentiality management", w: 0.067211, eq: 0.100000, s: 0.9800 },
    { e: "Senior leader coaching on supporting impacted employees", w: 0.065389, eq: 0.100000, s: 0.9600 }
  ],
  4: [
    { e: "Physical rehabilitation support", w: 0.200073, eq: 0.100000, s: 1.0000 },
    { e: "Nutrition coaching", w: 0.133196, eq: 0.100000, s: 1.0000 },
    { e: "Insurance advocacy/appeals support", w: 0.102184, eq: 0.100000, s: 0.9650 },
    { e: "Dedicated navigation support to help employees understand benefits and access medical care", w: 0.089426, eq: 0.100000, s: 0.9750 },
    { e: "Online tools, apps, or portals for health/benefits support", w: 0.087604, eq: 0.100000, s: 0.9650 },
    { e: "Occupational therapy/vocational rehabilitation", w: 0.081315, eq: 0.100000, s: 0.9450 },
    { e: "Care coordination concierge", w: 0.078595, eq: 0.100000, s: 0.9500 },
    { e: "Survivorship planning assistance", w: 0.077310, eq: 0.100000, s: 0.9400 },
    { e: "Benefits optimization assistance (maximizing coverage, minimizing costs)", w: 0.076675, eq: 0.100000, s: 0.9450 },
    { e: "Clinical trial matching service", w: 0.073622, eq: 0.100000, s: 0.9550 }
  ],
  5: [
    { e: "Flexible scheduling options", w: 0.134067, eq: 0.090909, s: 0.9800 },
    { e: "Ergonomic equipment funding", w: 0.126183, eq: 0.090909, s: 1.0000 },
    { e: "Rest areas / quiet spaces", w: 0.115475, eq: 0.090909, s: 0.9950 },
    { e: "Temporary role redesigns", w: 0.109129, eq: 0.090909, s: 0.9900 },
    { e: "Assistive technology catalog", w: 0.108836, eq: 0.090909, s: 0.9900 },
    { e: "Priority parking", w: 0.079852, eq: 0.090909, s: 0.9750 },
    { e: "Cognitive / fatigue support tools", w: 0.074978, eq: 0.090909, s: 0.9900 },
    { e: "Policy accommodations (e.g., dress code flexibility, headphone use)", w: 0.070501, eq: 0.090909, s: 0.9800 },
    { e: "Remote work capability", w: 0.064075, eq: 0.090909, s: 0.9800 },
    { e: "Transportation reimbursement", w: 0.059231, eq: 0.090909, s: 0.9650 },
    { e: "Physical workspace modifications", w: 0.057672, eq: 0.090909, s: 0.9600 }
  ],
  6: [
    { e: "Employee peer support groups (internal employees with shared experience)", w: 0.193109, eq: 0.083333, s: 1.0000 },
    { e: "Stigma-reduction initiatives", w: 0.130256, eq: 0.083333, s: 0.9900 },
    { e: "Anonymous benefits navigation tool or website (no login required)", w: 0.090308, eq: 0.083333, s: 0.9950 },
    { e: "Specialized emotional counseling", w: 0.079909, eq: 0.083333, s: 0.9650 },
    { e: "Inclusive communication guidelines", w: 0.071169, eq: 0.083333, s: 0.9500 },
    { e: "Manager training on handling sensitive health information", w: 0.070972, eq: 0.083333, s: 0.9750 },
    { e: "Professional-led support groups (external facilitator/counselor)", w: 0.066748, eq: 0.083333, s: 0.9900 },
    { e: "Written anti-retaliation policies for health disclosures", w: 0.065130, eq: 0.083333, s: 0.9750 },
    { e: "Strong anti-discrimination policies specific to health conditions", w: 0.063864, eq: 0.083333, s: 0.9900 },
    { e: "Clear process for confidential health disclosures", w: 0.059082, eq: 0.083333, s: 0.9850 },
    { e: "Confidential HR channel for health benefits, policies and insurance-related questions", w: 0.057287, eq: 0.083333, s: 0.9950 },
    { e: "Optional open health dialogue forums", w: 0.052165, eq: 0.083333, s: 0.9600 }
  ],
  7: [
    { e: "Peer mentorship program (employees who had similar condition mentoring current employees)", w: 0.200033, eq: 0.111111, s: 0.9900 },
    { e: "Continued access to training/development", w: 0.143486, eq: 0.111111, s: 0.9950 },
    { e: "Adjusted performance goals/deliverables during treatment and recovery", w: 0.105850, eq: 0.111111, s: 0.9850 },
    { e: "Succession planning protections", w: 0.104257, eq: 0.111111, s: 0.9950 },
    { e: "Structured reintegration programs", w: 0.101907, eq: 0.111111, s: 0.9850 },
    { e: "Optional stay-connected program", w: 0.101429, eq: 0.111111, s: 0.9750 },
    { e: "Career coaching for employees managing cancer or other serious health conditions", w: 0.084242, eq: 0.111111, s: 0.9800 },
    { e: "Professional coach/mentor for employees managing cancer or other serious health conditions", w: 0.081518, eq: 0.111111, s: 0.9650 },
    { e: "Project continuity protocols", w: 0.077280, eq: 0.111111, s: 0.9650 }
  ],
  8: [
    { e: "Flexibility for medical setbacks", w: 0.154687, eq: 0.083333, s: 0.9950 },
    { e: "Manager training on supporting team members during treatment/return", w: 0.124079, eq: 0.083333, s: 1.0000 },
    { e: "Long-term success tracking", w: 0.102334, eq: 0.083333, s: 1.0000 },
    { e: "Workload adjustments during treatment", w: 0.089721, eq: 0.083333, s: 0.9900 },
    { e: "Access to occupational therapy/vocational rehabilitation", w: 0.081946, eq: 0.083333, s: 1.0000 },
    { e: "Structured progress reviews", w: 0.072191, eq: 0.083333, s: 0.9600 },
    { e: "Buddy/mentor pairing for support", w: 0.069346, eq: 0.083333, s: 0.9750 },
    { e: "Flexible work arrangements during treatment", w: 0.068431, eq: 0.083333, s: 0.9800 },
    { e: "Online peer support forums", w: 0.068325, eq: 0.083333, s: 0.9950 },
    { e: "Phased return-to-work plans", w: 0.059020, eq: 0.083333, s: 0.9650 },
    { e: "Contingency planning for treatment schedules", w: 0.056143, eq: 0.083333, s: 0.9750 },
    { e: "Access to specialized work resumption professionals", w: 0.053777, eq: 0.083333, s: 0.9650 }
  ],
  9: [
    { e: "Executive sponsors communicate regularly about workplace support programs", w: 0.177838, eq: 0.083333, s: 1.0000 },
    { e: "ESG/CSR reporting inclusion", w: 0.122962, eq: 0.083333, s: 0.9900 },
    { e: "Public success story celebrations", w: 0.101589, eq: 0.083333, s: 0.9950 },
    { e: "Executive-led town halls focused on health benefits and employee support", w: 0.078106, eq: 0.083333, s: 0.9850 },
    { e: "Year-over-year budget growth", w: 0.077801, eq: 0.083333, s: 0.9750 },
    { e: "Support programs included in investor/stakeholder communications", w: 0.076953, eq: 0.083333, s: 0.9650 },
    { e: "Compensation tied to support outcomes", w: 0.067727, eq: 0.083333, s: 0.9900 },
    { e: "C-suite executive serves as program champion/sponsor", w: 0.063951, eq: 0.083333, s: 0.9900 },
    { e: "Cross-functional executive steering committee for workplace support programs", w: 0.060213, eq: 0.083333, s: 0.9550 },
    { e: "Support metrics included in annual report/sustainability reporting", w: 0.058149, eq: 0.083333, s: 0.9800 },
    { e: "Executive accountability metrics", w: 0.057550, eq: 0.083333, s: 0.9700 },
    { e: "Dedicated budget allocation for serious illness support programs", w: 0.057162, eq: 0.083333, s: 0.9850 }
  ],
  10: [
    { e: "Practical support for managing caregiving and work", w: 0.114708, eq: 0.050000, s: 0.9950 },
    { e: "Family navigation support", w: 0.080451, eq: 0.050000, s: 0.9950 },
    { e: "Eldercare consultation and referral services", w: 0.080031, eq: 0.050000, s: 0.9900 },
    { e: "Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)", w: 0.057402, eq: 0.050000, s: 1.0000 },
    { e: "Caregiver resource navigator/concierge", w: 0.052119, eq: 0.050000, s: 0.9900 },
    { e: "Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)", w: 0.048148, eq: 0.050000, s: 0.9750 },
    { e: "Paid caregiver leave with expanded eligibility (beyond local legal requirements)", w: 0.046638, eq: 0.050000, s: 0.9700 },
    { e: "Flexible work arrangements for caregivers", w: 0.045747, eq: 0.050000, s: 0.9750 },
    { e: "Paid time off for care coordination appointments", w: 0.043873, eq: 0.050000, s: 0.9900 },
    { e: "Respite care funding/reimbursement", w: 0.043040, eq: 0.050000, s: 0.9800 },
    { e: "Emergency dependent care when regular arrangements unavailable", w: 0.042999, eq: 0.050000, s: 0.9650 },
    { e: "Unpaid leave job protection beyond local / legal requirements", w: 0.042978, eq: 0.050000, s: 0.9850 },
    { e: "Legal/financial planning assistance for caregivers", w: 0.041332, eq: 0.050000, s: 1.0000 },
    { e: "Mental health support specifically for caregivers", w: 0.041290, eq: 0.050000, s: 0.9700 },
    { e: "Manager training for supervising caregivers", w: 0.039363, eq: 0.050000, s: 0.9750 },
    { e: "Dependent care account matching/contributions", w: 0.038215, eq: 0.050000, s: 0.9850 },
    { e: "Caregiver peer support groups", w: 0.037140, eq: 0.050000, s: 0.9900 },
    { e: "Dependent care subsidies", w: 0.034974, eq: 0.050000, s: 0.9750 },
    { e: "Emergency caregiver funds", w: 0.034931, eq: 0.050000, s: 0.9900 },
    { e: "Modified job duties during peak caregiving periods", w: 0.034619, eq: 0.050000, s: 0.9600 }
  ],
  11: [
    { e: "Legal protections beyond requirements", w: 0.115400, eq: 0.076923, s: 1.0000 },
    { e: "Individual health assessments (online or in-person)", w: 0.112016, eq: 0.076923, s: 0.9950 },
    { e: "Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)", w: 0.104588, eq: 0.076923, s: 1.0000 },
    { e: "Genetic screening/counseling", w: 0.096957, eq: 0.076923, s: 0.9950 },
    { e: "At least 70% coverage for regionally / locally recommended screenings", w: 0.072063, eq: 0.076923, s: 0.9950 },
    { e: "Full or partial coverage for annual health screenings/checkups", w: 0.070034, eq: 0.076923, s: 1.0000 },
    { e: "On-site vaccinations", w: 0.069652, eq: 0.076923, s: 0.9900 },
    { e: "Risk factor tracking/reporting", w: 0.066010, eq: 0.076923, s: 0.9950 },
    { e: "Regular health education sessions", w: 0.063478, eq: 0.076923, s: 0.9850 },
    { e: "Targeted risk-reduction programs", w: 0.061622, eq: 0.076923, s: 0.9900 },
    { e: "Paid time off for preventive care appointments", w: 0.061405, eq: 0.076923, s: 1.0000 },
    { e: "Workplace safety assessments to minimize health risks", w: 0.054855, eq: 0.076923, s: 0.9800 },
    { e: "Lifestyle coaching programs", w: 0.051920, eq: 0.076923, s: 0.9650 }
  ],
  12: [
    { e: "Regular program enhancements", w: 0.200034, eq: 0.111111, s: 0.9850 },
    { e: "Employee confidence in employer support", w: 0.145168, eq: 0.111111, s: 0.9900 },
    { e: "Innovation pilots", w: 0.111299, eq: 0.111111, s: 0.9950 },
    { e: "External benchmarking", w: 0.111196, eq: 0.111111, s: 0.9800 },
    { e: "Return-to-work success metrics", w: 0.101878, eq: 0.111111, s: 0.9750 },
    { e: "Program utilization analytics", w: 0.100793, eq: 0.111111, s: 0.9800 },
    { e: "Measure screening campaign ROI (e.g. participation rates, inquiries about access, etc.)", w: 0.077227, eq: 0.111111, s: 0.9450 },
    { e: "Business impact/ROI assessment", w: 0.076737, eq: 0.111111, s: 0.9600 },
    { e: "Employee satisfaction tracking", w: 0.075667, eq: 0.111111, s: 0.9550 }
  ],
  13: [
    { e: "Family/caregiver communication inclusion", w: 0.176781, eq: 0.090909, s: 1.0000 },
    { e: "Employee testimonials/success stories", w: 0.120722, eq: 0.090909, s: 1.0000 },
    { e: "Proactive communication at point of diagnosis disclosure", w: 0.114617, eq: 0.090909, s: 1.0000 },
    { e: "Anonymous information access options", w: 0.107793, eq: 0.090909, s: 0.9950 },
    { e: "Multi-channel communication strategy", w: 0.104833, eq: 0.090909, s: 0.9850 },
    { e: "Ability to access program information and resources anonymously", w: 0.076920, eq: 0.090909, s: 0.9900 },
    { e: "Dedicated program website or portal", w: 0.072307, eq: 0.090909, s: 0.9850 },
    { e: "New hire orientation coverage", w: 0.058091, eq: 0.090909, s: 0.9800 },
    { e: "Regular company-wide awareness campaigns (at least quarterly)", w: 0.056844, eq: 0.090909, s: 0.9450 },
    { e: "Manager toolkit for cascade communications", w: 0.056627, eq: 0.090909, s: 0.9700 },
    { e: "Cancer awareness month campaigns with resources", w: 0.054464, eq: 0.090909, s: 0.9650 }
  ]
};

// ---------- Helpers: element text normalization for robust matching ----------
function normalizeElementText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .trim();
}

function buildElementLookup(dim: number): Map<string, { e: string; w: number; eq: number; s: number }> {
  const m = new Map<string, { e: string; w: number; eq: number; s: number }>();
  (ELEMENT_WEIGHTS[dim] || []).forEach((it) => {
    m.set(normalizeElementText(it.e), it);
  });
  return m;
}

// ---------- Scoring helpers ----------
function statusToPoints(status: any): { points: number | null; isUnsure: boolean } {
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
  const s = String(status || '').toLowerCase().trim();
  if (!s) return { points: null, isUnsure: false };
  if (s.includes('not able')) return { points: GRID_POINTS.NOT, isUnsure: false };
  if (s.includes('unsure') || s.includes('unknown')) return { points: null, isUnsure: true };
  if (s.includes('planning') || s.includes('in development')) return { points: GRID_POINTS.PLAN, isUnsure: false };
  if (s.includes('assessing') || s.includes('feasibility')) return { points: GRID_POINTS.ASSESS, isUnsure: false };
  if (s.includes('currently offer') || s.includes('currently provide') || s.includes('currently') || s.includes('offer') || s.includes('provide')) return { points: GRID_POINTS.OFFER, isUnsure: false };
  return { points: GRID_POINTS.NOT, isUnsure: false };
}

function geoMultiplier(v: any): number {
  const s = String(v || '').toLowerCase();
  if (!s) return 1.0;
  if (s.includes('select locations')) return 0.75;
  if (s.includes('varies')) return 0.90;
  return 1.0;
}

function calcFollowUp(dim: number, a: any): number | null {
  const d = a?.[`dimension${dim}_data`];
  if (!d) return null;
  const sc: number[] = [];
  const add = (v: any, fn: (s: string) => number) => { if (v) sc.push(fn(String(v))); };
  if (dim === 1) {
    add(d.d1_1_usa || d.d1_1, (s) => {
      const l = s.toLowerCase();
      if (l.includes('100%')) return 100;
      if (l.includes('80') || l.includes('75')) return 80;
      if (l.includes('60') || l.includes('50')) return 50;
      if (l.includes('legal') || l.includes('minimum')) return 0;
      return 30;
    });
    add(d.d1_2, (s) => {
      const l = s.toLowerCase();
      if (l.includes('full benefits')) return 100;
      if (l.includes('prorated')) return 60;
      if (l.includes('no benefits')) return 30;
      return 0;
    });
  } else if (dim === 3) {
    add(d.d3_1, (s) => {
      const l = s.toLowerCase();
      if (l.includes('required') || l.includes('mandatory')) return 100;
      if (l.includes('available') || l.includes('optional')) return 60;
      if (l.includes('planning')) return 30;
      return 0;
    });
  } else if (dim === 12) {
    add(d.d12_1, (s) => {
      const l = s.toLowerCase();
      if (l.includes('quarterly') || l.includes('regular')) return 100;
      if (l.includes('annual')) return 60;
      if (l.includes('ad hoc')) return 30;
      return 0;
    });
    add(d.d12_2, (s) => {
      const l = s.toLowerCase();
      if (l.includes('regularly') || l.includes('systematic')) return 100;
      if (l.includes('occasionally')) return 50;
      return 0;
    });
  } else if (dim === 13) {
    add(d.d13_1, (s) => {
      const l = s.toLowerCase();
      if (l.includes('proactive') || l.includes('at diagnosis')) return 100;
      if (l.includes('upon request')) return 50;
      if (l.includes('general')) return 30;
      return 0;
    });
  }
  if (!sc.length) return null;
  return Math.round(sc.reduce((x, y) => x + y, 0) / sc.length);
}

function maturityScore(a: any): number {
  const s = String(a?.current_support_data?.or1 || '').toLowerCase();
  if (s.includes('comprehensive') || s.includes('well-established')) return 100;
  if (s.includes('enhanced') || s.includes('developed')) return 80;
  if (s.includes('moderate') || s.includes('growing')) return 50;
  if (s.includes('developing') || s.includes('early') || s.includes('beginning')) return 20;
  return 0;
}

function breadthScore(a: any): number {
  const cs = a?.current_support_data;
  if (!cs) return 0;
  let sc = 0, ct = 0;
  for (const f of ['cb3a','cb3b','cb3c']) {
    const v = cs[f];
    if (!v) continue;
    ct++;
    const s = String(v).toLowerCase();
    sc += (s.includes('beyond') || s.includes('exceed') || s.includes('above') || s.includes('comprehensive')) ? 100
        : (s.includes('meet') || s.includes('comply') || s.includes('standard')) ? 50
        : (s.includes('below') || s.includes('minimum') || s.includes('none') || s.includes('not')) ? 0
        : 25;
  }
  return ct ? Math.round(sc / ct) : 0;
}

type DimResult = { eq: number; wt: number; unsure: number; total: number; matchRate: number; };

function scoreDimension(dim: number, a: any): DimResult {
  const dd = a?.[`dimension${dim}_data`];
  const grid = dd?.[`d${dim}a`];
  const out: DimResult = { eq: 0, wt: 0, unsure: 0, total: 0, matchRate: 0 };
  if (!grid || typeof grid !== 'object') return out;

  const lookup = buildElementLookup(dim);
  let earned = 0;
  let answered = 0;
  let wNumer = 0;
  let wDenom = 0;

  let matched = 0;
  let considered = 0;

  for (const [rawKey, rawVal] of Object.entries(grid as Record<string, any>)) {
    const key = String(rawKey);

    if (dim === 10) {
      const isExcluded = D10_EXCLUDED_ELEMENTS.some(ex => normalizeElementText(ex) === normalizeElementText(key));
      if (isExcluded) continue;
    }

    out.total++;
    const { points, isUnsure } = statusToPoints(rawVal);

    const normKey = normalizeElementText(key);
    const we = lookup.get(normKey);
    const w = we ? we.w : 0;

    considered++;
    if (we) matched++;

    if (isUnsure) {
      out.unsure++;
      answered++;
      wDenom += w;
      continue;
    }
    if (points === null) continue;

    answered++;
    earned += points;
    wNumer += (points / GRID_POINTS.OFFER) * w;
    wDenom += w;
  }

  out.matchRate = considered ? matched / considered : 0;

  const maxPts = answered * GRID_POINTS.OFFER;
  const eqRaw = maxPts ? Math.round((earned / maxPts) * 100) : 0;
  const wtRaw = wDenom ? Math.round((wNumer / wDenom) * 100) : eqRaw;

  const geo = geoMultiplier(dd?.[`d${dim}aa`] || dd?.[`D${dim}aa`]);
  const eqGeo = Math.round(eqRaw * geo);
  const wtGeo = Math.round(wtRaw * geo);

  if ([1,3,12,13].includes(dim)) {
    const fu = calcFollowUp(dim, a);
    out.eq = fu !== null ? Math.round(eqGeo * 0.85 + fu * 0.15) : eqGeo;
    out.wt = fu !== null ? Math.round(wtGeo * 0.85 + fu * 0.15) : wtGeo;
  } else {
    out.eq = eqGeo;
    out.wt = wtGeo;
  }

  return out;
}

type CompanyResult = {
  name: string;
  id: string;
  isPanel: boolean;
  complete13: boolean;
  dims: Record<number, DimResult>;
  eqComposite: number;
  wtComposite: number;
  maturity: number;
  breadth: number;
  unsurePct: number;
  matchRateAvg: number;
};

function scoreCompany(a: any): CompanyResult {
  const id = String(a.app_id || a.survey_id || '');
  const isPanel = id.startsWith('PANEL-');

  const dims: Record<number, DimResult> = {};
  let nd = 0;
  for (let d = 1; d <= 13; d++) {
    dims[d] = scoreDimension(d, a);
    if (dims[d].total > 0) nd++;
  }
  const complete13 = nd === 13;

  const maturity = maturityScore(a);
  const breadth = breadthScore(a);

  let eqWD = 0;
  let wtWD = 0;
  if (complete13) {
    const totW = Object.values(DIMENSION_WEIGHTS).reduce((x, y) => x + y, 0);
    for (let d = 1; d <= 13; d++) {
      const dw = (DIMENSION_WEIGHTS[d] || 0) / totW;
      eqWD += dims[d].eq * dw;
      wtWD += dims[d].wt * dw;
    }
  }
  const eqComposite = complete13 ? Math.round(eqWD * 0.90 + maturity * 0.05 + breadth * 0.05) : 0;
  const wtComposite = complete13 ? Math.round(wtWD * 0.90 + maturity * 0.05 + breadth * 0.05) : 0;

  let tI = 0, tU = 0, mr = 0, mrc = 0;
  for (let d = 1; d <= 13; d++) {
    tI += dims[d].total;
    tU += dims[d].unsure;
    if (dims[d].matchRate > 0) { mr += dims[d].matchRate; mrc++; }
  }

  return {
    name: a.company_name || id || 'Unknown',
    id: a.survey_id || id,
    isPanel,
    complete13,
    dims,
    eqComposite,
    wtComposite,
    maturity,
    breadth,
    unsurePct: tI ? tU / tI : 0,
    matchRateAvg: mrc ? mr / mrc : 0
  };
}

function fmtDelta(v: number): string {
  const s = v >= 0 ? '+' : '';
  return `${s}${v}`;
}

type TabKey = 'exec' | 'stats' | 'weights' | 'scoring';

export default function ElementWeightsAdminPage() {
  const [tab, setTab] = useState<TabKey>('exec');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDim, setOpenDim] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: rows, error } = await supabase
        .from('assessments')
        .select('company_name, survey_id, app_id, dimension1_data, dimension2_data, dimension3_data, dimension4_data, dimension5_data, dimension6_data, dimension7_data, dimension8_data, dimension9_data, dimension10_data, dimension11_data, dimension12_data, dimension13_data, current_support_data')
        .order('company_name');

      if (!error && rows) setData(rows);
      setLoading(false);
    })();
  }, []);

  const results = useMemo(() => {
    const all = data
      .filter((a: any) => {
        const id = String(a.app_id || a.survey_id || '');
        return id && !id.startsWith('TEST') && a.dimension1_data;
      })
      .map(scoreCompany);

    const complete = all.filter(r => r.complete13);
    const indexOnly = complete.filter(r => !r.isPanel).sort((a, b) => b.wtComposite - a.wtComposite);

    const bench: CompanyResult | null = complete.length ? {
      name: 'Benchmark',
      id: 'BENCH',
      isPanel: false,
      complete13: true,
      dims: {} as any,
      eqComposite: Math.round(complete.reduce((s, c) => s + c.eqComposite, 0) / complete.length),
      wtComposite: Math.round(complete.reduce((s, c) => s + c.wtComposite, 0) / complete.length),
      maturity: 0,
      breadth: 0,
      unsurePct: 0,
      matchRateAvg: complete.reduce((s, c) => s + c.matchRateAvg, 0) / complete.length
    } : null;

    if (bench) {
      for (let d = 1; d <= 13; d++) {
        const dr = complete.filter(c => c.dims[d]?.total > 0);
        const eq = dr.length ? Math.round(dr.reduce((s, c) => s + c.dims[d].eq, 0) / dr.length) : 0;
        const wt = dr.length ? Math.round(dr.reduce((s, c) => s + c.dims[d].wt, 0) / dr.length) : 0;
        const mr = dr.length ? dr.reduce((s, c) => s + c.dims[d].matchRate, 0) / dr.length : 0;
        (bench.dims as any)[d] = { eq, wt, unsure: 0, total: 0, matchRate: mr };
      }
    }

    return { indexOnly, bench };
  }, [data]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-500">Loading…</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-10" />
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Element Weighting</h1>
              <p className="text-xs text-slate-500">Executive view • statistical detail • weights • scoring impact</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/scoring" className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition">Aggregate Scoring</Link>
            <Link href="/admin" className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition">Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 flex gap-1">
          {(['exec','stats','weights','scoring'] as TabKey[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                tab===t ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t==='exec' ? 'Executive Overview' : t==='stats' ? 'Statistical Overview' : t==='weights' ? 'Element Weights' : 'Scoring Impact'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {tab === 'exec' && <ExecutiveOverview />}
        {tab === 'stats' && <StatOverview />}
        {tab === 'weights' && <WeightsTab openDim={openDim} setOpenDim={setOpenDim} />}
        {tab === 'scoring' && <ScoringImpactTab cos={results.indexOnly} bench={results.bench} />}
      </div>
    </div>
  );
}

// TAB 1
function ExecutiveOverview() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Executive Overview</h2>
          <p className="text-sm text-slate-500 mt-1">How element weighting improves discrimination while preserving the CAC framework</p>
        </div>
        <div className="px-8 py-6 text-sm text-slate-700 leading-relaxed space-y-4">
          <p><span className="font-semibold text-slate-900">Objective.</span> Element weighting is a calibration layer that helps the Index differentiate between “table‑stakes” practices and practices that signal a more mature, comprehensive support program. The underlying Index structure (13 dimensions, response scale, and dimension weights) remains unchanged.</p>
          <p><span className="font-semibold text-slate-900">What changes.</span> Within each dimension, elements that more consistently distinguish stronger overall programs receive modestly higher weight; elements that do not reliably differentiate remain closer to equal weight. The intent is not to re‑write the rubric, but to improve signal where the data supports it.</p>
          <div className="border-l-2 border-slate-300 pl-5 py-3 bg-slate-50 rounded-r-lg">
            <p className="text-slate-600 italic">“We keep the CAC framework intact, quantify which elements differentiate stronger programs, and blend back toward equal weighting to ensure the result is stable, fair, and review‑proof.”</p>
          </div>
          <p><span className="font-semibold text-slate-900">What to expect.</span> This calibration produces modest shifts (typically 1–3 points in composite score) and preserves rank ordering for most organizations, while improving differentiation among companies clustered near the same overall score.</p>
        </div>
      </div>
    </div>
  );
}

// TAB 2
function StatOverview() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Statistical Overview</h2>
          <p className="text-sm text-slate-500 mt-1">v6.1: ordinal encoding • ridge • permutation importance • bootstrap attenuation • adaptive shrinkage</p>
        </div>
        <div className="px-8 py-6 space-y-4 text-sm text-slate-700 leading-relaxed">
          <ul className="list-disc ml-5 space-y-2">
            <li><span className="font-medium text-slate-900">Feature encoding:</span> full ordinal scale (0/2/3/5); unsure treated as missing for fitting.</li>
            <li><span className="font-medium text-slate-900">Outcome (anti‑circular):</span> leave‑one‑out composite: mean of the other 12 dimensions.</li>
            <li><span className="font-medium text-slate-900">Model:</span> ridge regression on standardized predictors; missing values filled with column median.</li>
            <li><span className="font-medium text-slate-900">Importance:</span> permutation importance (drop in cross‑validated R²).</li>
            <li><span className="font-medium text-slate-900">Stability:</span> 200 bootstrap resamples; attenuation via stability^1.5.</li>
            <li><span className="font-medium text-slate-900">Shrinkage + cap:</span> α per dimension (below) and 20% hard cap per element.</li>
          </ul>

          <div className="overflow-x-auto">
            <table className="text-xs border border-slate-200 rounded w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left font-medium text-slate-500">Dim</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500">Name</th>
                  <th className="px-3 py-2 text-center font-medium text-slate-500">Elements</th>
                  <th className="px-3 py-2 text-center font-medium text-slate-500">CV R²</th>
                  <th className="px-3 py-2 text-center font-medium text-slate-500">α</th>
                  <th className="px-3 py-2 text-center font-medium text-slate-500">n</th>
                  <th className="px-3 py-2 text-center font-medium text-slate-500">Dim Wt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DIMENSION_ORDER.map(d => {
                  const m = DIM_META[d];
                  return (
                    <tr key={d} className={m.cvR2 < 0 ? 'bg-amber-50/50' : ''}>
                      <td className="px-3 py-2 font-medium text-slate-700">D{d}</td>
                      <td className="px-3 py-2 text-slate-600">{DIMENSION_NAMES[d]}</td>
                      <td className="px-3 py-2 text-center">{m.elems}</td>
                      <td className={`px-3 py-2 text-center ${
                        m.cvR2 < 0 ? 'text-amber-700 font-medium' : m.cvR2 > 0.3 ? 'text-emerald-700 font-medium' : 'text-slate-600'
                      }`}>{m.cvR2.toFixed(3)}</td>
                      <td className="px-3 py-2 text-center">{m.alpha.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{m.n}</td>
                      <td className="px-3 py-2 text-center">{DIMENSION_WEIGHTS[d]}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// TAB 3
function WeightsTab({ openDim, setOpenDim }: { openDim: number | null; setOpenDim: (d: number | null) => void }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-8 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Element Weights by Dimension</h2>
        <p className="text-sm text-slate-500 mt-1">Equal vs adjusted weights, deltas, and stability</p>
      </div>
      <div className="divide-y divide-slate-100">
        {DIMENSION_ORDER.map(d => {
          const meta = DIM_META[d];
          const ws = (ELEMENT_WEIGHTS[d] || []).slice().sort((a,b)=>b.w-a.w);
          const open = openDim === d;
          return (
            <div key={d}>
              <button onClick={() => setOpenDim(open ? null : d)} className="w-full px-8 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-semibold flex items-center justify-center">{d}</span>
                  <span className="text-sm font-medium text-slate-700">{DIMENSION_NAMES[d]}</span>
                  <span className="text-xs text-slate-400">{meta.elems} elements</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    meta.cvR2<0 ? 'bg-amber-100 text-amber-700' : meta.cvR2>0.3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>CV R²={meta.cvR2.toFixed(3)}</span>
                  <span className="text-xs text-slate-400">α={meta.alpha.toFixed(2)}</span>
                  <span className="text-xs text-slate-400">DimWt={DIMENSION_WEIGHTS[d]}%</span>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open && (
                <div className="px-8 pb-4">
                  <table className="w-full text-xs border border-slate-200 rounded overflow-hidden">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-3 py-2 text-left font-medium text-slate-500 w-8">#</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-500">Element</th>
                        <th className="px-3 py-2 text-center font-medium text-slate-500 w-20">Equal</th>
                        <th className="px-3 py-2 text-center font-medium text-slate-500 w-24">Adjusted</th>
                        <th className="px-3 py-2 text-center font-medium text-slate-500 w-20">Δ</th>
                        <th className="px-3 py-2 text-center font-medium text-slate-500 w-24">Stability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ws.map((w, i) => {
                        const delta = w.w - w.eq;
                        const capped = w.w >= 0.195;
                        return (
                          <tr key={i} className={capped ? 'bg-purple-50/30' : delta < 0 ? 'bg-slate-50/50' : ''}>
                            <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                            <td className="px-3 py-1.5 text-slate-700">{w.e}</td>
                            <td className="px-3 py-1.5 text-center text-slate-500">{(w.eq * 100).toFixed(1)}%</td>
                            <td className={`px-3 py-1.5 text-center font-medium ${capped ? 'text-purple-700' : 'text-slate-700'}`}>{(w.w * 100).toFixed(1)}%</td>
                            <td className="px-3 py-1.5 text-center"><span className={delta >= 0 ? 'text-emerald-600' : 'text-amber-600'}>{delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}</span></td>
                            <td className="px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${Math.round(w.s * 100)}%`, backgroundColor: w.s >= 0.7 ? '#059669' : w.s >= 0.5 ? '#d97706' : '#dc2626' }} />
                                </div>
                                <span className="text-slate-500">{Math.round(w.s * 100)}%</span>
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
  );
}

// TAB 4
function ScoringImpactTab({ cos, bench }: { cos: CompanyResult[]; bench: CompanyResult | null }) {
  if (!bench || !cos.length) return <p className="text-slate-500 text-sm">No completed assessments found.</p>;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-8 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Score Comparison: Equal vs Element‑Weighted</h2>
          <p className="text-sm text-slate-500 mt-1">All other pipeline components are identical. Only element weights within dimensions differ.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="sticky left-0 bg-slate-50 z-10 px-4 py-2.5 text-left font-medium text-slate-500 min-w-[180px]">Metric</th>
                <th className="px-3 py-2.5 text-center font-medium text-slate-500 min-w-[90px] border-l border-slate-200 bg-slate-100">Benchmark</th>
                {cos.map(c => (
                  <th key={c.id} className="px-3 py-2.5 text-center font-medium text-slate-600 min-w-[110px]">
                    <div className="truncate max-w-[110px]" title={c.name}>{c.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-800 text-white"><td colSpan={2 + cos.length} className="px-4 py-2 font-semibold text-xs uppercase tracking-wider">Composite</td></tr>
              <tr className="border-b border-slate-100">
                <td className="sticky left-0 bg-white z-10 px-4 py-2 text-slate-600 font-medium">Equal</td>
                <td className="px-3 py-2 text-center font-semibold text-slate-700 border-l border-slate-200 bg-slate-50">{bench.eqComposite}</td>
                {cos.map(c => <td key={c.id} className="px-3 py-2 text-center text-slate-600">{c.eqComposite}</td>)}
              </tr>
              <tr className="border-b border-slate-100 bg-emerald-50/30">
                <td className="sticky left-0 bg-emerald-50/30 z-10 px-4 py-2 text-emerald-800 font-medium">Weighted</td>
                <td className="px-3 py-2 text-center font-semibold text-emerald-700 border-l border-slate-200 bg-emerald-50/50">{bench.wtComposite}</td>
                {cos.map(c => <td key={c.id} className="px-3 py-2 text-center text-emerald-700 font-medium">{c.wtComposite}</td>)}
              </tr>
              <tr className="border-b border-slate-200">
                <td className="sticky left-0 bg-white z-10 px-4 py-2 text-slate-500">Δ</td>
                <td className="px-3 py-2 text-center text-slate-500 border-l border-slate-200 bg-slate-50">{fmtDelta(bench.wtComposite - bench.eqComposite)}</td>
                {cos.map(c => {
                  const d = c.wtComposite - c.eqComposite;
                  return <td key={c.id} className="px-3 py-2 text-center"><span className={d >= 0 ? 'text-emerald-600' : 'text-amber-600'}>{fmtDelta(d)}</span></td>;
                })}
              </tr>

              <tr className="bg-slate-800 text-white"><td colSpan={2 + cos.length} className="px-4 py-2 font-semibold text-xs uppercase tracking-wider">Diagnostics</td></tr>
              <tr className="border-b border-slate-100">
                <td className="sticky left-0 bg-white z-10 px-4 py-2 text-slate-600 font-medium">Avg Weight Match Rate</td>
                <td className="px-3 py-2 text-center text-slate-700 border-l border-slate-200 bg-slate-50">{Math.round(bench.matchRateAvg * 100)}%</td>
                {cos.map(c => <td key={c.id} className="px-3 py-2 text-center text-slate-600">{Math.round(c.matchRateAvg * 100)}%</td>)}
              </tr>

              {DIMENSION_ORDER.map(d => (
                <React.Fragment key={d}>
                  <tr className="bg-slate-100 border-t border-slate-200">
                    <td colSpan={2 + cos.length} className="px-4 py-2 font-semibold text-xs text-slate-700">
                      D{d}: {DIMENSION_NAMES[d]} <span className="font-normal text-slate-400 ml-2">({DIMENSION_WEIGHTS[d]}%)</span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="sticky left-0 bg-white z-10 px-4 py-1.5 text-slate-600 pl-8">Equal</td>
                    <td className="px-3 py-1.5 text-center text-slate-600 border-l border-slate-200 bg-slate-50">{(bench.dims as any)[d]?.eq ?? '-'}</td>
                    {cos.map(c => <td key={c.id} className="px-3 py-1.5 text-center text-slate-600">{c.dims[d]?.eq ?? '-'}</td>)}
                  </tr>
                  <tr className="border-b border-slate-100 bg-emerald-50/20">
                    <td className="sticky left-0 bg-emerald-50/20 z-10 px-4 py-1.5 text-emerald-700 pl-8">Weighted</td>
                    <td className="px-3 py-1.5 text-center text-emerald-700 border-l border-slate-200 bg-emerald-50/30">{(bench.dims as any)[d]?.wt ?? '-'}</td>
                    {cos.map(c => <td key={c.id} className="px-3 py-1.5 text-center text-emerald-700">{c.dims[d]?.wt ?? '-'}</td>)}
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="sticky left-0 bg-white z-10 px-4 py-1.5 text-slate-500 pl-8">Match%</td>
                    <td className="px-3 py-1.5 text-center text-slate-500 border-l border-slate-200 bg-slate-50">{Math.round(((bench.dims as any)[d]?.matchRate ?? 0) * 100)}%</td>
                    {cos.map(c => <td key={c.id} className="px-3 py-1.5 text-center text-slate-500">{Math.round((c.dims[d]?.matchRate ?? 0) * 100)}%</td>)}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

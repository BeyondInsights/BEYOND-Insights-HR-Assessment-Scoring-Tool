'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

// Constants
const DW: Record<number, number> = { 4: 14, 8: 13, 3: 12, 2: 11, 13: 10, 6: 8, 1: 7, 5: 7, 7: 4, 9: 4, 10: 4, 11: 3, 12: 3 };
const DO = [4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12];
const DN: Record<number, string> = {
  1: 'Medical Leave & Flexibility', 2: 'Insurance & Financial Protection', 3: 'Manager Preparedness & Capability',
  4: 'Cancer Support Resources', 5: 'Workplace Accommodations', 6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement', 8: 'Work Continuation & Resumption', 9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support', 11: 'Prevention & Wellness', 12: 'Continuous Improvement', 13: 'Communication & Awareness'
};
const PTS = { OFFER: 5, PLAN: 3, ASSESS: 2, NOT: 0 };
const D10X = ['Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)'];

const DM: Record<number, { cvR2: number; alpha: number; n: number; elems: number }> = {
  1: { cvR2: -0.135, alpha: 0.3, n: 41, elems: 13 }, 2: { cvR2: 0.018, alpha: 0.4, n: 36, elems: 17 },
  3: { cvR2: 0.156, alpha: 0.5, n: 38, elems: 10 }, 4: { cvR2: 0.419, alpha: 0.5, n: 40, elems: 10 },
  5: { cvR2: 0.412, alpha: 0.5, n: 39, elems: 11 }, 6: { cvR2: 0.361, alpha: 0.5, n: 38, elems: 12 },
  7: { cvR2: 0.33, alpha: 0.5, n: 34, elems: 9 }, 8: { cvR2: 0.53, alpha: 0.5, n: 38, elems: 12 },
  9: { cvR2: 0.136, alpha: 0.5, n: 34, elems: 12 }, 10: { cvR2: -0.063, alpha: 0.3, n: 40, elems: 20 },
  11: { cvR2: 0.473, alpha: 0.5, n: 40, elems: 13 }, 12: { cvR2: 0.12, alpha: 0.5, n: 40, elems: 9 },
  13: { cvR2: 0.642, alpha: 0.5, n: 40, elems: 11 }
};

const EW: Record<number, Array<{ e: string; w: number; eq: number; s: number }>> = {
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
    { e: '\$0 copay for specialty drugs', w: 0.0553, eq: 0.0588, s: 0.62 },
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

// Scoring helpers
function norm(t: string): string { return t.toLowerCase().trim().replace(/\s+/g, ' '); }
function buildLookup(d: number): Map<string, { w: number; eq: number; s: number }> {
  const m = new Map();
  for (const i of EW[d] || []) m.set(norm(i.e), { w: i.w, eq: i.eq, s: i.s });
  return m;
}

function stp(status: string | number): { points: number | null; isUnsure: boolean } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: PTS.OFFER, isUnsure: false };
      case 3: return { points: PTS.PLAN, isUnsure: false };
      case 2: return { points: PTS.ASSESS, isUnsure: false };
      case 1: return { points: PTS.NOT, isUnsure: false };
      case 5: return { points: null, isUnsure: true };
      default: return { points: null, isUnsure: false };
    }
  }
  const s = String(status).toLowerCase().trim();
  if (s.includes('not able') || s.includes('not currently') || s.includes('do not')) return { points: PTS.NOT, isUnsure: false };
  if (s === 'unsure' || s.includes('unsure') || s.includes('unknown')) return { points: null, isUnsure: true };
  if (s.includes('assessing') || s.includes('feasibility')) return { points: PTS.ASSESS, isUnsure: false };
  if (s.includes('planning') || s.includes('development')) return { points: PTS.PLAN, isUnsure: false };
  if (s.includes('currently offer') || s.includes('currently provide') || s.includes('we offer')) return { points: PTS.OFFER, isUnsure: false };
  if (s.length > 0) return { points: PTS.NOT, isUnsure: false };
  return { points: null, isUnsure: false };
}

function getGeo(g: any): number {
  if (!g) return 1.0;
  const s = String(g).toLowerCase();
  return s.includes('select locations') ? 0.75 : s.includes('varies') ? 0.90 : 1.0;
}

function calcFU(dim: number, a: Record<string, any>): number | null {
  const d = a[`dimension${dim}_data`]; if (!d) return null;
  const sc: number[] = [];
  const add = (v: string | undefined, fn: (s: string) => number) => { if (v) sc.push(fn(v)); };
  if (dim === 1) add(d.d1_1_usa || d.d1_1, s => { const l = s.toLowerCase(); return l.includes('100%') ? 100 : l.includes('80') || l.includes('75') ? 80 : l.includes('60') || l.includes('50') ? 50 : l.includes('legal') ? 0 : 30; });
  else if (dim === 3) add(d.d3_1, s => { const l = s.toLowerCase(); return l.includes('required') || l.includes('mandatory') ? 100 : l.includes('available') ? 60 : l.includes('planning') ? 30 : 0; });
  else if (dim === 12) { add(d.d12_1, s => { const l = s.toLowerCase(); return l.includes('quarterly') || l.includes('regular') ? 100 : l.includes('annual') ? 60 : l.includes('ad hoc') ? 30 : 0; }); add(d.d12_2, s => { const l = s.toLowerCase(); return l.includes('regularly') || l.includes('systematic') ? 100 : l.includes('occasionally') ? 50 : 0; }); }
  else if (dim === 13) add(d.d13_1, s => { const l = s.toLowerCase(); return l.includes('proactive') || l.includes('at diagnosis') ? 100 : l.includes('upon request') ? 50 : l.includes('general') ? 30 : 0; });
  return sc.length > 0 ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : null;
}

function calcMat(a: Record<string, any>): number {
  const s = (a.current_support_data?.or1 || '').toLowerCase();
  if (s.includes('comprehensive') || s.includes('well-established')) return 100;
  if (s.includes('enhanced') || s.includes('developed')) return 80;
  if (s.includes('moderate') || s.includes('growing')) return 50;
  if (s.includes('developing') || s.includes('early')) return 20;
  return 0;
}

function calcBrd(a: Record<string, any>): number {
  const cs = a.current_support_data; if (!cs) return 0;
  let sc = 0, ct = 0;
  for (const f of ['cb3a', 'cb3b', 'cb3c']) { const v = cs[f]; if (v) { ct++; const s = String(v).toLowerCase(); sc += s.includes('beyond') || s.includes('exceed') ? 100 : s.includes('meet') || s.includes('comply') ? 50 : 0; } }
  return ct > 0 ? Math.round(sc / ct) : 0;
}

interface DR { eqB: number; wtB: number; uns: number; tot: number; matched: number; unmatched: string[] }

function scoreDim(dim: number, a: Record<string, any>): DR {
  const r: DR = { eqB: 0, wtB: 0, uns: 0, tot: 0, matched: 0, unmatched: [] };
  const dd = a[`dimension${dim}_data`]; if (!dd) return r;
  const grid = dd[`d${dim}a`]; if (!grid || typeof grid !== 'object') return r;
  const lookup = buildLookup(dim);
  let earned = 0, answered = 0;
  const es: Array<{ k: string; p: number; w: number }> = [];
  
  Object.entries(grid).forEach(([k, v]: [string, any]) => {
    if (dim === 10 && D10X.some(ex => norm(ex) === norm(k))) return;
    r.tot++;
    const { points, isUnsure } = stp(v);
    if (isUnsure) { r.uns++; answered++; }
    else if (points !== null) {
      answered++; earned += points;
      const wInfo = lookup.get(norm(k));
      if (wInfo) { r.matched++; es.push({ k, p: points, w: wInfo.w }); }
      else { r.unmatched.push(k); es.push({ k, p: points, w: 1 / r.tot }); }
    }
  });
  
  const maxP = answered * PTS.OFFER;
  const eqRaw = maxP > 0 ? Math.round((earned / maxP) * 100) : 0;
  let wtRaw = eqRaw;
  if (es.length > 0) {
    let wS = 0, wT = 0;
    for (const e of es) { wS += (e.p / PTS.OFFER) * e.w; wT += e.w; }
    Object.entries(grid).forEach(([k, v]: [string, any]) => {
      if (dim === 10 && D10X.some(ex => norm(ex) === norm(k))) return;
      const { isUnsure } = stp(v);
      if (isUnsure) { const wInfo = lookup.get(norm(k)); wT += wInfo ? wInfo.w : (1 / r.tot); }
    });
    if (wT > 0) wtRaw = Math.round((wS / wT) * 100);
  }
  
  const geo = getGeo(dd[`d${dim}aa`]);
  const eqA = Math.round(eqRaw * geo), wtA = Math.round(wtRaw * geo);
  if ([1, 3, 12, 13].includes(dim)) {
    const fu = calcFU(dim, a);
    r.eqB = fu !== null ? Math.round(eqA * 0.85 + fu * 0.15) : eqA;
    r.wtB = fu !== null ? Math.round(wtA * 0.85 + fu * 0.15) : wtA;
  } else { r.eqB = eqA; r.wtB = wtA; }
  return r;
}

interface CR { name: string; sid: string; isPanel: boolean; ok: boolean; dims: Record<number, DR>; eqC: number; wtC: number; mat: number; brd: number; matchPct: number; unsPct: number }

function scoreCo(a: Record<string, any>): CR {
  const id = a.app_id || a.survey_id || '';
  const isP = id.startsWith('PANEL-');
  const dims: Record<number, DR> = {};
  let nd = 0, tI = 0, tU = 0, tM = 0;
  for (let d = 1; d <= 13; d++) { dims[d] = scoreDim(d, a); if (dims[d].tot > 0) nd++; tI += dims[d].tot; tU += dims[d].uns; tM += dims[d].matched; }
  const ok = nd === 13;
  const mat = calcMat(a), brd = calcBrd(a);
  let eqWD = 0, wtWD = 0;
  if (ok) { const totW = Object.values(DW).reduce((a, b) => a + b, 0); for (let d = 1; d <= 13; d++) { const dw = (DW[d] || 0) / totW; eqWD += dims[d].eqB * dw; wtWD += dims[d].wtB * dw; } }
  const eqC = ok ? Math.round(eqWD * 0.90 + mat * 0.05 + brd * 0.05) : 0;
  const wtC = ok ? Math.round(wtWD * 0.90 + mat * 0.05 + brd * 0.05) : 0;
  return { name: a.company_name || a.firmographics_data?.company_name || id || 'Unknown', sid: a.survey_id || id, isPanel: isP, ok, dims, eqC, wtC, mat, brd, matchPct: tI > 0 ? tM / tI : 0, unsPct: tI > 0 ? tU / tI : 0 };
}

export default function ElementWeightingPage() {
  const [tab, setTab] = useState<'method' | 'compare'>('method');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expDim, setExpDim] = useState<number | null>(null);
  const [showTech, setShowTech] = useState(false);
  const [benchMode, setBenchMode] = useState<'all' | 'index'>('all');

  useEffect(() => {
    (async () => {
      const { data: d } = await supabase.from('assessments').select('id, app_id, survey_id, company_name, firmographics_data, current_support_data, dimension1_data, dimension2_data, dimension3_data, dimension4_data, dimension5_data, dimension6_data, dimension7_data, dimension8_data, dimension9_data, dimension10_data, dimension11_data, dimension12_data, dimension13_data').order('company_name');
      if (d) setData(d);
      setLoading(false);
    })();
  }, []);

  const results = useMemo(() => {
    if (!data.length) return { cos: [] as CR[], bench: null as CR | null };
    const all = data.filter((a: any) => { const id = a.app_id || a.survey_id || ''; return !id.startsWith('TEST') && a.dimension1_data; }).map(scoreCo);
    const complete = all.filter(c => c.ok);
    const pool = benchMode === 'index' ? complete.filter(c => !c.isPanel) : complete;
    const index = complete.filter(c => !c.isPanel).sort((a, b) => b.wtC - a.wtC);
    let bench: CR | null = null;
    if (pool.length > 0) {
      const avgDims: Record<number, DR> = {};
      for (let d = 1; d <= 13; d++) { const dr = pool.filter(c => c.dims[d]?.tot > 0); avgDims[d] = { eqB: dr.length > 0 ? Math.round(dr.reduce((s, c) => s + c.dims[d].eqB, 0) / dr.length) : 0, wtB: dr.length > 0 ? Math.round(dr.reduce((s, c) => s + c.dims[d].wtB, 0) / dr.length) : 0, uns: 0, tot: 0, matched: 0, unmatched: [] }; }
      bench = { name: 'Benchmark', sid: 'BENCH', isPanel: false, ok: true, dims: avgDims, eqC: Math.round(pool.reduce((s, c) => s + c.eqC, 0) / pool.length), wtC: Math.round(pool.reduce((s, c) => s + c.wtC, 0) / pool.length), mat: 0, brd: 0, matchPct: pool.reduce((s, c) => s + c.matchPct, 0) / pool.length, unsPct: 0 };
    }
    return { cos: index, bench };
  }, [data, benchMode]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-3 border-slate-300 border-t-violet-600 rounded-full animate-spin"></div></div>;

  const { cos, bench } = results;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header - matches company report */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-10 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-14" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Scoring Calibration</p>
                <h1 className="text-3xl font-bold text-white mt-2">Element Weighting Analysis</h1>
                <p className="text-slate-300 mt-1">Best Companies for Working with Cancer Index 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/scoring" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors border border-white/20">Aggregate Scoring</Link>
              <Link href="/admin" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors border border-white/20">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex">
            {[{ k: 'method' as const, l: 'Methodology' }, { k: 'compare' as const, l: 'Score Comparison' }].map(t => (
              <button key={t.k} onClick={() => setTab(t.k)} className={`px-8 py-4 text-sm font-semibold border-b-2 transition-colors ${tab === t.k ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-10 py-10">
        {tab === 'method' ? (
          <div className="max-w-4xl space-y-8">
            {/* Main Card */}
            <div className="bg-gradient-to-br from-violet-50/80 via-white to-slate-50 border border-violet-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-violet-500 rounded-full"></span>
                  What We Did and Why
                </h2>
                <p className="text-slate-700 leading-relaxed mb-6">
                  <strong className="text-slate-900">Not all survey elements carry equal weight in differentiating program quality.</strong> Some elements represent table-stakes practices that most organizations offer. Others are rarer commitments that signal a genuinely mature, comprehensive program. Element weighting lets the scoring reflect that distinction without overreacting to sample-specific patterns or undermining the conceptual framework.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
                  <p className="text-slate-600 italic leading-relaxed">"We kept the CAC framework intact. We used the full maturity scale for each element, identified which items most consistently differentiate stronger programs using only high-quality responses, and then blended those findings back toward equal weighting so that we calibrate the scoring rather than overhaul it."</p>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-violet-500 rounded-full"></span>
                  The approach, step by step
                </h3>
                <div className="space-y-4">
                  {[
                    { n: 1, t: 'Start with the existing framework', b: 'The 13 dimensions, the element response options (Not Offered, Assessing, Planning, Currently Offer), and the dimension weights all remain unchanged. Element weighting adjusts how much each item contributes within its dimension.' },
                    { n: 2, t: 'Use the full response scale, not a binary shortcut', b: 'Each element is scored on its full four-level scale: Not Offered (0), Assessing (2), Planning (3), Currently Offer (5). Collapsing responses to yes/no would discard the progression signal.' },
                    { n: 3, t: 'Only learn weights from companies with sufficient confirmed data', b: 'If a company reported Unsure on more than 40% of elements in a given dimension, that company is excluded from weight estimation for that dimension.' },
                    { n: 4, t: 'Define importance to avoid circularity', b: "An element's importance is measured by how well it predicts overall program strength outside its own dimension. No element is rewarded simply for being part of the score it is predicting." },
                    { n: 5, t: 'Use ridge regression for small samples', b: 'Ridge regression prevents any single element from receiving an extreme weight due to chance correlations. It is purpose-built for situations where the number of predictors is large relative to observations.' },
                    { n: 6, t: 'Measure importance through prediction impact', b: "For each element, values are shuffled and the resulting R-squared drop is measured. Elements that cause a larger drop when scrambled are stronger differentiators." },
                    { n: 7, t: 'Test stability through bootstrapping', b: 'The importance calculation is repeated 200 times on different resamples of companies. Elements that consistently appear as important across resamples receive full weight.' },
                    { n: 8, t: 'Blend toward equal weights', b: "The final weight blends empirical importance (50%) with equal weighting (50%). No single element can exceed 20% of its dimension's total weight." }
                  ].map(s => (
                    <div key={s.n} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center">{s.n}</div>
                      <div><p className="font-semibold text-slate-800">{s.t}</p><p className="text-slate-600 mt-1">{s.b}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-8 py-5 bg-gradient-to-r from-violet-700 to-purple-700">
                <p className="text-violet-100 text-sm leading-relaxed">
                  <strong className="text-white">Result:</strong> Across all scored companies, element weighting shifts composite scores by approximately 1 to 3 points. Within each dimension, the highest-weighted element is typically 2 to 3 times the lowest. Rankings are largely preserved, with modest reordering among companies with similar scores.
                </p>
              </div>
            </div>

            {/* Technical Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <button onClick={() => setShowTech(!showTech)} className="w-full px-8 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Full Statistical Methodology</h3>
                  <p className="text-slate-500 mt-0.5">Technical specification for peer review and validation</p>
                </div>
                <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform ${showTech ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>
              {showTech && (
                <div className="px-8 py-6 border-t border-slate-200 space-y-5 text-sm text-slate-700">
                  <div><h4 className="font-bold text-slate-900 mb-2">1. Overview</h4><p>Within each of the 13 assessment dimensions, element weights calibrate scoring so that elements more predictive of overall program strength receive modestly higher weight. The model operates on 159 elements across 13 dimensions, fit on n = 43 companies.</p></div>
                  <div><h4 className="font-bold text-slate-900 mb-2">2. Feature encoding</h4><p>Each element is scored on its full ordinal scale: Currently Offer = 5, Planning = 3, Assessing = 2, Not Offered = 0. Unsure responses are treated as missing for model fitting.</p></div>
                  <div><h4 className="font-bold text-slate-900 mb-2">3. Adaptive shrinkage by dimension</h4>
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                        <thead><tr className="bg-slate-100"><th className="px-3 py-2 text-left font-semibold text-slate-700">Dim</th><th className="px-3 py-2 text-left font-semibold text-slate-700">Name</th><th className="px-3 py-2 text-center font-semibold text-slate-700">Elems</th><th className="px-3 py-2 text-center font-semibold text-slate-700">CV R²</th><th className="px-3 py-2 text-center font-semibold text-slate-700">α</th><th className="px-3 py-2 text-center font-semibold text-slate-700">n</th><th className="px-3 py-2 text-center font-semibold text-slate-700">Wt</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">{DO.map(d => { const m = DM[d]; return (<tr key={d} className={m.cvR2 < 0 ? 'bg-amber-50' : ''}><td className="px-3 py-1.5 font-medium">D{d}</td><td className="px-3 py-1.5 text-slate-600">{DN[d]}</td><td className="px-3 py-1.5 text-center">{m.elems}</td><td className={`px-3 py-1.5 text-center font-medium ${m.cvR2 < 0 ? 'text-amber-700' : m.cvR2 > 0.3 ? 'text-emerald-700' : 'text-slate-600'}`}>{m.cvR2.toFixed(3)}</td><td className="px-3 py-1.5 text-center">{m.alpha}</td><td className="px-3 py-1.5 text-center">{m.n}</td><td className="px-3 py-1.5 text-center font-medium">{DW[d]}%</td></tr>); })}</tbody>
                      </table>
                    </div>
                  </div>
                  <div><h4 className="font-bold text-slate-900 mb-2">4. Hard cap and normalization</h4><p>No single element can exceed 20% of its dimension's total weight. Excess redistributed proportionally. Final weights normalize to 1.000 within each dimension.</p></div>
                  <div><h4 className="font-bold text-slate-900 mb-2">5. Recalibration roadmap</h4><p>At n = 43, equal weights remain the dominant anchor. At n = 75+, consider 60% empirical. At n = 100+, consider 70%. Recalibrate annually.</p></div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
              <div><p className="font-semibold text-slate-800">Benchmark Population</p><p className="text-sm text-slate-500">Select which companies to include</p></div>
              <div className="flex gap-2">
                <button onClick={() => setBenchMode('all')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${benchMode === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All Complete</button>
                <button onClick={() => setBenchMode('index')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${benchMode === 'index' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Index Only</button>
              </div>
            </div>

            {/* Match Rate Warning */}
            {bench && bench.matchPct < 0.9 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4">
                <p className="font-semibold text-amber-800">Element Match Rate: {Math.round(bench.matchPct * 100)}%</p>
                <p className="text-sm text-amber-700 mt-1">Some grid elements did not match the weight table entries. Unmatched elements fall back to equal weighting.</p>
              </div>
            )}

            {/* Score Table */}
            {bench && cos.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-violet-700 to-purple-700 px-8 py-5">
                  <h2 className="text-lg font-bold text-white">Score Comparison: Equal Weight vs. Element-Weighted</h2>
                  <p className="text-violet-200 text-sm mt-1">All pipeline components are identical. The only difference is element weighting within dimensions.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      <th className="sticky left-0 bg-slate-50 z-10 px-4 py-3 text-left font-semibold text-slate-600 min-w-[160px]">Metric</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-600 min-w-[80px] border-l border-slate-200 bg-violet-50">Benchmark</th>
                      {cos.slice(0, 10).map(c => <th key={c.sid} className="px-3 py-3 text-center font-medium text-slate-700 min-w-[80px]"><div className="truncate max-w-[80px]" title={c.name}>{c.name}</div></th>)}
                    </tr></thead>
                    <tbody>
                      <tr className="bg-slate-800"><td colSpan={2 + Math.min(cos.length, 10)} className="px-4 py-2 font-bold text-xs text-white uppercase tracking-wider">Composite Score</td></tr>
                      <tr className="border-b border-slate-100"><td className="sticky left-0 bg-white z-10 px-4 py-2 text-slate-600 font-medium">Equal Weight</td><td className="px-4 py-2 text-center font-semibold text-slate-700 border-l border-slate-200 bg-violet-50">{bench.eqC}</td>{cos.slice(0, 10).map(c => <td key={c.sid} className="px-3 py-2 text-center text-slate-600">{c.eqC}</td>)}</tr>
                      <tr className="border-b border-slate-100 bg-emerald-50/50"><td className="sticky left-0 bg-emerald-50/50 z-10 px-4 py-2 text-emerald-800 font-medium">Element-Weighted</td><td className="px-4 py-2 text-center font-bold text-emerald-700 border-l border-slate-200 bg-emerald-100/50">{bench.wtC}</td>{cos.slice(0, 10).map(c => <td key={c.sid} className="px-3 py-2 text-center text-emerald-700 font-semibold">{c.wtC}</td>)}</tr>
                      <tr className="border-b border-slate-200"><td className="sticky left-0 bg-white z-10 px-4 py-2 text-slate-500">Delta</td><td className="px-4 py-2 text-center text-slate-500 border-l border-slate-200 bg-violet-50">{(bench.wtC - bench.eqC >= 0 ? '+' : '') + (bench.wtC - bench.eqC)}</td>{cos.slice(0, 10).map(c => { const d = c.wtC - c.eqC; return <td key={c.sid} className="px-3 py-2 text-center"><span className={d >= 0 ? 'text-emerald-600' : 'text-amber-600'}>{(d >= 0 ? '+' : '') + d}</span></td>; })}</tr>
                      {DO.map(d => (
                        <React.Fragment key={d}>
                          <tr className="bg-slate-100 border-t border-slate-200"><td colSpan={2 + Math.min(cos.length, 10)} className="px-4 py-2 font-semibold text-xs text-slate-700">D{d}: {DN[d]} <span className="font-normal text-slate-400 ml-2">({DW[d]}%)</span></td></tr>
                          <tr className="border-b border-slate-100"><td className="sticky left-0 bg-white z-10 px-4 py-2 text-slate-600 pl-8">Equal</td><td className="px-4 py-2 text-center text-slate-600 border-l border-slate-200 bg-violet-50">{bench.dims[d]?.eqB ?? '-'}</td>{cos.slice(0, 10).map(c => <td key={c.sid} className="px-3 py-2 text-center text-slate-600">{c.dims[d]?.eqB ?? '-'}</td>)}</tr>
                          <tr className="border-b border-slate-100 bg-emerald-50/30"><td className="sticky left-0 bg-emerald-50/30 z-10 px-4 py-2 text-emerald-700 pl-8">Weighted</td><td className="px-4 py-2 text-center text-emerald-700 border-l border-slate-200 bg-emerald-50/50">{bench.dims[d]?.wtB ?? '-'}</td>{cos.slice(0, 10).map(c => <td key={c.sid} className="px-3 py-2 text-center text-emerald-700">{c.dims[d]?.wtB ?? '-'}</td>)}</tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Element Weights by Dimension */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-800">Element Weights by Dimension</h2><p className="text-slate-500 mt-0.5">Click a dimension to expand element-level detail</p></div>
              <div className="divide-y divide-slate-100">
                {DO.map(d => {
                  const m = DM[d]; const ws = EW[d] || []; const open = expDim === d;
                  return (
                    <div key={d}>
                      <button onClick={() => setExpDim(open ? null : d)} className="w-full px-8 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="w-8 h-8 rounded-full bg-slate-700 text-white text-sm font-bold flex items-center justify-center">{d}</span>
                          <span className="font-medium text-slate-700">{DN[d]}</span>
                          <span className="text-sm text-slate-400">{m.elems} elements</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${m.cvR2 < 0 ? 'bg-amber-100 text-amber-700' : m.cvR2 > 0.3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>CV R² = {m.cvR2.toFixed(3)}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center transition-transform ${open ? 'rotate-180' : ''}`}><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></div>
                      </button>
                      {open && (
                        <div className="px-8 pb-6">
                          <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                            <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-3 py-2.5 text-left font-semibold text-slate-600 w-8">#</th><th className="px-3 py-2.5 text-left font-semibold text-slate-600">Element</th><th className="px-3 py-2.5 text-center font-semibold text-slate-600 w-20">Equal Wt</th><th className="px-3 py-2.5 text-center font-semibold text-slate-600 w-20">Adj. Wt</th><th className="px-3 py-2.5 text-center font-semibold text-slate-600 w-20">Delta</th><th className="px-3 py-2.5 text-center font-semibold text-slate-600 w-28">Stability</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                              {ws.map((w, i) => {
                                const delta = w.w - w.eq; const cap = w.w >= 0.195;
                                return (
                                  <tr key={i} className={cap ? 'bg-violet-50/40' : delta < 0 ? 'bg-slate-50/50' : ''}>
                                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                                    <td className="px-3 py-2 text-slate-700">{w.e}</td>
                                    <td className="px-3 py-2 text-center text-slate-500">{(w.eq * 100).toFixed(1)}%</td>
                                    <td className={`px-3 py-2 text-center font-medium ${cap ? 'text-violet-700' : 'text-slate-700'}`}>{(w.w * 100).toFixed(1)}%{cap && <span className="ml-1 text-violet-400" title="Capped at 20%">*</span>}</td>
                                    <td className="px-3 py-2 text-center"><span className={delta >= 0 ? 'text-emerald-600' : 'text-amber-600'}>{delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}</span></td>
                                    <td className="px-3 py-2 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${w.s * 100}%`, backgroundColor: w.s >= 0.7 ? '#059669' : w.s >= 0.5 ? '#d97706' : '#dc2626' }} /></div>
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
        )}
      </div>
    </div>
  );
}

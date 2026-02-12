'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ============================================
// DATA FROM EXCEL FILE - Element_Weighting_Final_v6_1.xlsx
// ============================================

const DIMENSION_ORDER = [4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12];

const DIMENSIONS: Record<number, {
  name: string;
  weight: number;
  elements: number;
  cvR2: number;
  alpha: number;
  n: number;
  topElements: string[];
  items: Array<{ rank: number; name: string; weight: number; equal: number; delta: number; stability: number }>;
}> = {
  1: {
    name: 'Medical Leave & Flexible Work',
    weight: 7,
    elements: 13,
    cvR2: -0.135,
    alpha: 0.3,
    n: 41,
    topElements: ['Emergency leave within 24 hours', 'Remote work options for on-site employees', 'Intermittent leave beyond legal requirements'],
    items: [
      { rank: 1, name: 'Emergency leave within 24 hours', weight: 0.143, equal: 0.077, delta: 0.066, stability: 0.92 },
      { rank: 2, name: 'Remote work options for on-site employees', weight: 0.129, equal: 0.077, delta: 0.052, stability: 0.93 },
      { rank: 3, name: 'Intermittent leave beyond local/legal requirements', weight: 0.114, equal: 0.077, delta: 0.037, stability: 0.84 },
      { rank: 4, name: 'Paid micro-breaks for side effects', weight: 0.082, equal: 0.077, delta: 0.005, stability: 0.76 },
      { rank: 5, name: 'Flexible work hours during treatment', weight: 0.076, equal: 0.077, delta: -0.001, stability: 0.72 },
      { rank: 6, name: 'Job protection beyond local/legal requirements', weight: 0.062, equal: 0.077, delta: -0.015, stability: 0.48 },
      { rank: 7, name: 'Paid medical leave beyond local/legal requirements', weight: 0.059, equal: 0.077, delta: -0.018, stability: 0.40 },
      { rank: 8, name: 'Reduced schedule/part-time with full benefits', weight: 0.058, equal: 0.077, delta: -0.019, stability: 0.43 },
      { rank: 9, name: 'Paid micro-breaks for medical-related side effects', weight: 0.056, equal: 0.077, delta: -0.021, stability: 0.36 },
      { rank: 10, name: 'PTO accrual during leave', weight: 0.056, equal: 0.077, delta: -0.021, stability: 0.34 },
      { rank: 11, name: 'Full salary continuation during STD leave', weight: 0.055, equal: 0.077, delta: -0.022, stability: 0.30 },
      { rank: 12, name: 'Disability pay top-up', weight: 0.055, equal: 0.077, delta: -0.022, stability: 0.29 },
      { rank: 13, name: 'Leave donation bank', weight: 0.055, equal: 0.077, delta: -0.022, stability: 0.27 }
    ]
  },
  2: {
    name: 'Insurance & Financial Protection',
    weight: 11,
    elements: 17,
    cvR2: 0.018,
    alpha: 0.4,
    n: 36,
    topElements: ['Accelerated life insurance benefits', 'Tax/estate planning assistance', 'Real-time cost estimator tools'],
    items: [
      { rank: 1, name: 'Accelerated life insurance benefits', weight: 0.172, equal: 0.059, delta: 0.114, stability: 0.96 },
      { rank: 2, name: 'Tax/estate planning assistance', weight: 0.135, equal: 0.059, delta: 0.076, stability: 0.91 },
      { rank: 3, name: 'Real-time cost estimator tools', weight: 0.074, equal: 0.059, delta: 0.015, stability: 0.83 },
      { rank: 4, name: 'Insurance advocacy/pre-authorization support', weight: 0.072, equal: 0.059, delta: 0.013, stability: 0.78 },
      { rank: 5, name: '$0 copay for specialty drugs', weight: 0.055, equal: 0.059, delta: -0.003, stability: 0.62 },
      { rank: 6, name: 'Coverage for advanced therapies', weight: 0.046, equal: 0.059, delta: -0.013, stability: 0.52 },
      { rank: 7, name: 'Financial counseling services', weight: 0.045, equal: 0.059, delta: -0.014, stability: 0.49 },
      { rank: 8, name: 'Long-term disability covering 60%+', weight: 0.045, equal: 0.059, delta: -0.014, stability: 0.53 },
      { rank: 9, name: 'Paid time off for clinical trials', weight: 0.043, equal: 0.059, delta: -0.015, stability: 0.51 },
      { rank: 10, name: 'Coverage for clinical trials', weight: 0.042, equal: 0.059, delta: -0.016, stability: 0.49 },
      { rank: 11, name: 'Short-term disability covering 60%+', weight: 0.042, equal: 0.059, delta: -0.016, stability: 0.45 },
      { rank: 12, name: 'Hardship grants program', weight: 0.040, equal: 0.059, delta: -0.019, stability: 0.40 },
      { rank: 13, name: 'Guaranteed job protection', weight: 0.039, equal: 0.059, delta: -0.020, stability: 0.36 },
      { rank: 14, name: 'Employer-paid disability supplements', weight: 0.038, equal: 0.059, delta: -0.021, stability: 0.33 },
      { rank: 15, name: 'Voluntary supplemental illness insurance', weight: 0.038, equal: 0.059, delta: -0.021, stability: 0.34 },
      { rank: 16, name: 'Set out-of-pocket maximums', weight: 0.037, equal: 0.059, delta: -0.022, stability: 0.26 },
      { rank: 17, name: 'Travel/lodging reimbursement', weight: 0.037, equal: 0.059, delta: -0.022, stability: 0.26 }
    ]
  },
  3: {
    name: 'Manager Preparedness',
    weight: 12,
    elements: 10,
    cvR2: 0.156,
    alpha: 0.5,
    n: 38,
    topElements: ['Manager peer support/community building', 'Manager training on supporting employees', 'Empathy/communication skills training'],
    items: [
      { rank: 1, name: 'Manager peer support/community building', weight: 0.200, equal: 0.100, delta: 0.100, stability: 0.90 },
      { rank: 2, name: 'Manager training on supporting employees', weight: 0.196, equal: 0.100, delta: 0.096, stability: 0.87 },
      { rank: 3, name: 'Empathy/communication skills training', weight: 0.164, equal: 0.100, delta: 0.064, stability: 0.78 },
      { rank: 4, name: 'Dedicated manager resource hub', weight: 0.080, equal: 0.100, delta: -0.020, stability: 0.51 },
      { rank: 5, name: 'Clear escalation protocol', weight: 0.071, equal: 0.100, delta: -0.029, stability: 0.46 },
      { rank: 6, name: 'Manager evaluations include support metrics', weight: 0.063, equal: 0.100, delta: -0.037, stability: 0.37 },
      { rank: 7, name: 'Privacy protection/confidentiality management', weight: 0.058, equal: 0.100, delta: -0.042, stability: 0.33 },
      { rank: 8, name: 'AI-powered guidance tools', weight: 0.058, equal: 0.100, delta: -0.042, stability: 0.33 },
      { rank: 9, name: 'Legal compliance training', weight: 0.055, equal: 0.100, delta: -0.045, stability: 0.24 },
      { rank: 10, name: 'Senior leader coaching', weight: 0.054, equal: 0.100, delta: -0.046, stability: 0.24 }
    ]
  },
  4: {
    name: 'Treatment & Navigation',
    weight: 14,
    elements: 10,
    cvR2: 0.419,
    alpha: 0.5,
    n: 40,
    topElements: ['Physical rehabilitation support', 'Nutrition coaching', 'Insurance advocacy/appeals support'],
    items: [
      { rank: 1, name: 'Physical rehabilitation support', weight: 0.200, equal: 0.100, delta: 0.100, stability: 0.98 },
      { rank: 2, name: 'Nutrition coaching', weight: 0.132, equal: 0.100, delta: 0.032, stability: 0.73 },
      { rank: 3, name: 'Insurance advocacy/appeals support', weight: 0.102, equal: 0.100, delta: 0.002, stability: 0.63 },
      { rank: 4, name: 'Dedicated navigation support', weight: 0.087, equal: 0.100, delta: -0.013, stability: 0.48 },
      { rank: 5, name: 'Online tools/apps/portals', weight: 0.082, equal: 0.100, delta: -0.018, stability: 0.42 },
      { rank: 6, name: 'Occupational therapy/vocational rehab', weight: 0.081, equal: 0.100, delta: -0.019, stability: 0.37 },
      { rank: 7, name: 'Care coordination concierge', weight: 0.080, equal: 0.100, delta: -0.020, stability: 0.38 },
      { rank: 8, name: 'Survivorship planning assistance', weight: 0.080, equal: 0.100, delta: -0.020, stability: 0.39 },
      { rank: 9, name: 'Benefits optimization assistance', weight: 0.079, equal: 0.100, delta: -0.021, stability: 0.35 },
      { rank: 10, name: 'Clinical trial matching service', weight: 0.077, equal: 0.100, delta: -0.023, stability: 0.29 }
    ]
  },
  5: {
    name: 'Workplace Accommodations',
    weight: 7,
    elements: 11,
    cvR2: 0.412,
    alpha: 0.5,
    n: 39,
    topElements: ['Flexible scheduling options', 'Ergonomic equipment funding', 'Temporary role redesigns'],
    items: [
      { rank: 1, name: 'Flexible scheduling options', weight: 0.200, equal: 0.091, delta: 0.109, stability: 0.84 },
      { rank: 2, name: 'Ergonomic equipment funding', weight: 0.140, equal: 0.091, delta: 0.049, stability: 0.79 },
      { rank: 3, name: 'Temporary role redesigns', weight: 0.113, equal: 0.091, delta: 0.022, stability: 0.71 },
      { rank: 4, name: 'Rest areas/quiet spaces', weight: 0.112, equal: 0.091, delta: 0.022, stability: 0.72 },
      { rank: 5, name: 'Assistive technology catalog', weight: 0.089, equal: 0.091, delta: -0.002, stability: 0.63 },
      { rank: 6, name: 'Cognitive/fatigue support tools', weight: 0.068, equal: 0.091, delta: -0.023, stability: 0.49 },
      { rank: 7, name: 'Priority parking', weight: 0.066, equal: 0.091, delta: -0.025, stability: 0.52 },
      { rank: 8, name: 'Policy accommodations', weight: 0.058, equal: 0.091, delta: -0.033, stability: 0.44 },
      { rank: 9, name: 'Remote work capability', weight: 0.054, equal: 0.091, delta: -0.037, stability: 0.33 },
      { rank: 10, name: 'Physical workspace modifications', weight: 0.052, equal: 0.091, delta: -0.039, stability: 0.30 },
      { rank: 11, name: 'Transportation reimbursement', weight: 0.048, equal: 0.091, delta: -0.043, stability: 0.24 }
    ]
  },
  6: {
    name: 'Culture & Psychological Safety',
    weight: 8,
    elements: 12,
    cvR2: 0.361,
    alpha: 0.5,
    n: 38,
    topElements: ['Employee peer support groups', 'Stigma-reduction initiatives', 'Anonymous benefits navigation'],
    items: [
      { rank: 1, name: 'Employee peer support groups', weight: 0.200, equal: 0.083, delta: 0.117, stability: 0.99 },
      { rank: 2, name: 'Stigma-reduction initiatives', weight: 0.163, equal: 0.083, delta: 0.079, stability: 0.77 },
      { rank: 3, name: 'Anonymous benefits navigation', weight: 0.104, equal: 0.083, delta: 0.021, stability: 0.75 },
      { rank: 4, name: 'Specialized emotional counseling', weight: 0.075, equal: 0.083, delta: -0.009, stability: 0.51 },
      { rank: 5, name: 'Manager training on sensitive info', weight: 0.066, equal: 0.083, delta: -0.017, stability: 0.47 },
      { rank: 6, name: 'Anti-discrimination policies', weight: 0.063, equal: 0.083, delta: -0.020, stability: 0.47 },
      { rank: 7, name: 'Inclusive communication guidelines', weight: 0.062, equal: 0.083, delta: -0.021, stability: 0.44 },
      { rank: 8, name: 'Professional-led support groups', weight: 0.059, equal: 0.083, delta: -0.024, stability: 0.45 },
      { rank: 9, name: 'Anti-retaliation policies', weight: 0.056, equal: 0.083, delta: -0.027, stability: 0.37 },
      { rank: 10, name: 'Confidential HR channel', weight: 0.051, equal: 0.083, delta: -0.032, stability: 0.31 },
      { rank: 11, name: 'Confidential disclosure process', weight: 0.050, equal: 0.083, delta: -0.033, stability: 0.25 },
      { rank: 12, name: 'Open health dialogue forums', weight: 0.050, equal: 0.083, delta: -0.034, stability: 0.25 }
    ]
  },
  7: {
    name: 'Career Continuity & Advancement',
    weight: 4,
    elements: 9,
    cvR2: 0.330,
    alpha: 0.5,
    n: 34,
    topElements: ['Peer mentorship program', 'Continued access to training', 'Adjusted performance goals'],
    items: [
      { rank: 1, name: 'Peer mentorship program', weight: 0.200, equal: 0.111, delta: 0.089, stability: 0.99 },
      { rank: 2, name: 'Continued access to training', weight: 0.180, equal: 0.111, delta: 0.069, stability: 0.87 },
      { rank: 3, name: 'Adjusted performance goals', weight: 0.101, equal: 0.111, delta: -0.011, stability: 0.59 },
      { rank: 4, name: 'Succession planning protections', weight: 0.097, equal: 0.111, delta: -0.014, stability: 0.56 },
      { rank: 5, name: 'Optional stay-connected program', weight: 0.096, equal: 0.111, delta: -0.015, stability: 0.52 },
      { rank: 6, name: 'Structured reintegration programs', weight: 0.094, equal: 0.111, delta: -0.018, stability: 0.51 },
      { rank: 7, name: 'Career coaching', weight: 0.083, equal: 0.111, delta: -0.028, stability: 0.43 },
      { rank: 8, name: 'Professional coach/mentor', weight: 0.076, equal: 0.111, delta: -0.035, stability: 0.33 },
      { rank: 9, name: 'Project continuity protocols', weight: 0.074, equal: 0.111, delta: -0.038, stability: 0.21 }
    ]
  },
  8: {
    name: 'Work Continuation & Resumption',
    weight: 13,
    elements: 12,
    cvR2: 0.530,
    alpha: 0.5,
    n: 38,
    topElements: ['Flexibility for medical setbacks', 'Long-term success tracking', 'Manager training for treatment/return'],
    items: [
      { rank: 1, name: 'Flexibility for medical setbacks', weight: 0.192, equal: 0.083, delta: 0.109, stability: 0.83 },
      { rank: 2, name: 'Long-term success tracking', weight: 0.143, equal: 0.083, delta: 0.059, stability: 0.88 },
      { rank: 3, name: 'Manager training for treatment/return', weight: 0.137, equal: 0.083, delta: 0.054, stability: 0.82 },
      { rank: 4, name: 'Workload adjustments during treatment', weight: 0.092, equal: 0.083, delta: 0.009, stability: 0.64 },
      { rank: 5, name: 'Access to occupational therapy', weight: 0.080, equal: 0.083, delta: -0.004, stability: 0.63 },
      { rank: 6, name: 'Buddy/mentor pairing', weight: 0.059, equal: 0.083, delta: -0.025, stability: 0.48 },
      { rank: 7, name: 'Structured progress reviews', weight: 0.057, equal: 0.083, delta: -0.026, stability: 0.39 },
      { rank: 8, name: 'Flexible work during treatment', weight: 0.055, equal: 0.083, delta: -0.029, stability: 0.40 },
      { rank: 9, name: 'Online peer support forums', weight: 0.054, equal: 0.083, delta: -0.030, stability: 0.42 },
      { rank: 10, name: 'Phased return-to-work plans', weight: 0.045, equal: 0.083, delta: -0.039, stability: 0.20 },
      { rank: 11, name: 'Contingency planning for treatment', weight: 0.044, equal: 0.083, delta: -0.039, stability: 0.21 },
      { rank: 12, name: 'Specialized work resumption professionals', weight: 0.043, equal: 0.083, delta: -0.041, stability: 0.14 }
    ]
  },
  9: {
    name: 'Executive Commitment & Resources',
    weight: 4,
    elements: 12,
    cvR2: 0.136,
    alpha: 0.5,
    n: 34,
    topElements: ['Executive sponsors communicate regularly', 'ESG/CSR reporting inclusion', 'Public success story celebrations'],
    items: [
      { rank: 1, name: 'Executive sponsors communicate regularly', weight: 0.200, equal: 0.083, delta: 0.117, stability: 0.97 },
      { rank: 2, name: 'ESG/CSR reporting inclusion', weight: 0.143, equal: 0.083, delta: 0.060, stability: 0.72 },
      { rank: 3, name: 'Public success story celebrations', weight: 0.132, equal: 0.083, delta: 0.049, stability: 0.76 },
      { rank: 4, name: 'Year-over-year budget growth', weight: 0.087, equal: 0.083, delta: 0.004, stability: 0.65 },
      { rank: 5, name: 'Executive-led town halls', weight: 0.077, equal: 0.083, delta: -0.007, stability: 0.59 },
      { rank: 6, name: 'Investor/stakeholder communications', weight: 0.061, equal: 0.083, delta: -0.022, stability: 0.44 },
      { rank: 7, name: 'Compensation tied to outcomes', weight: 0.055, equal: 0.083, delta: -0.029, stability: 0.43 },
      { rank: 8, name: 'Executive accountability metrics', weight: 0.050, equal: 0.083, delta: -0.033, stability: 0.32 },
      { rank: 9, name: 'C-suite champion/sponsor', weight: 0.049, equal: 0.083, delta: -0.034, stability: 0.30 },
      { rank: 10, name: 'Cross-functional steering committee', weight: 0.049, equal: 0.083, delta: -0.034, stability: 0.30 },
      { rank: 11, name: 'Metrics in annual report', weight: 0.049, equal: 0.083, delta: -0.035, stability: 0.28 },
      { rank: 12, name: 'Dedicated budget allocation', weight: 0.048, equal: 0.083, delta: -0.036, stability: 0.27 }
    ]
  },
  10: {
    name: 'Caregiver & Family Support',
    weight: 4,
    elements: 20,
    cvR2: -0.063,
    alpha: 0.3,
    n: 40,
    topElements: ['Practical caregiving/work support', 'Eldercare consultation/referral', 'Family navigation support'],
    items: [
      { rank: 1, name: 'Practical caregiving/work support', weight: 0.126, equal: 0.050, delta: 0.076, stability: 0.92 },
      { rank: 2, name: 'Eldercare consultation/referral', weight: 0.099, equal: 0.050, delta: 0.049, stability: 0.81 },
      { rank: 3, name: 'Family navigation support', weight: 0.074, equal: 0.050, delta: 0.024, stability: 0.78 },
      { rank: 4, name: 'Caregiver resource navigator', weight: 0.049, equal: 0.050, delta: -0.001, stability: 0.57 },
      { rank: 5, name: 'Expanded caregiver leave eligibility', weight: 0.047, equal: 0.050, delta: -0.003, stability: 0.56 },
      { rank: 6, name: 'Paid caregiver leave', weight: 0.047, equal: 0.050, delta: -0.003, stability: 0.55 },
      { rank: 7, name: 'Unpaid leave job protection', weight: 0.043, equal: 0.050, delta: -0.007, stability: 0.48 },
      { rank: 8, name: 'Caregiving logistics concierge', weight: 0.043, equal: 0.050, delta: -0.007, stability: 0.51 },
      { rank: 9, name: 'Flexible work for caregivers', weight: 0.042, equal: 0.050, delta: -0.008, stability: 0.46 },
      { rank: 10, name: 'Emergency dependent care', weight: 0.041, equal: 0.050, delta: -0.009, stability: 0.48 },
      { rank: 11, name: 'Respite care funding', weight: 0.041, equal: 0.050, delta: -0.009, stability: 0.47 },
      { rank: 12, name: 'PTO for care coordination', weight: 0.041, equal: 0.050, delta: -0.009, stability: 0.44 },
      { rank: 13, name: 'Legal/financial planning for caregivers', weight: 0.041, equal: 0.050, delta: -0.009, stability: 0.46 },
      { rank: 14, name: 'Manager training for caregivers', weight: 0.040, equal: 0.050, delta: -0.010, stability: 0.44 },
      { rank: 15, name: 'Caregiver peer support groups', weight: 0.040, equal: 0.050, delta: -0.010, stability: 0.42 },
      { rank: 16, name: 'Dependent care subsidies', weight: 0.039, equal: 0.050, delta: -0.011, stability: 0.42 },
      { rank: 17, name: 'Caregiver mental health support', weight: 0.039, equal: 0.050, delta: -0.011, stability: 0.40 },
      { rank: 18, name: 'Modified job duties for caregivers', weight: 0.038, equal: 0.050, delta: -0.012, stability: 0.32 },
      { rank: 19, name: 'Emergency caregiver funds', weight: 0.037, equal: 0.050, delta: -0.013, stability: 0.29 },
      { rank: 20, name: 'Dependent care account matching', weight: 0.036, equal: 0.050, delta: -0.014, stability: 0.26 }
    ]
  },
  11: {
    name: 'Prevention & Wellness',
    weight: 3,
    elements: 13,
    cvR2: 0.473,
    alpha: 0.5,
    n: 40,
    topElements: ['Legal protections beyond requirements', 'Individual health assessments', 'Immuno-compromised colleague policies'],
    items: [
      { rank: 1, name: 'Legal protections beyond requirements', weight: 0.166, equal: 0.077, delta: 0.089, stability: 0.96 },
      { rank: 2, name: 'Individual health assessments', weight: 0.145, equal: 0.077, delta: 0.068, stability: 0.86 },
      { rank: 3, name: 'Immuno-compromised colleague policies', weight: 0.125, equal: 0.077, delta: 0.048, stability: 0.81 },
      { rank: 4, name: 'Genetic screening/counseling', weight: 0.117, equal: 0.077, delta: 0.040, stability: 0.83 },
      { rank: 5, name: 'Annual health screening coverage', weight: 0.059, equal: 0.077, delta: -0.018, stability: 0.51 },
      { rank: 6, name: 'Regular health education sessions', weight: 0.055, equal: 0.077, delta: -0.022, stability: 0.47 },
      { rank: 7, name: 'PTO for preventive care', weight: 0.054, equal: 0.077, delta: -0.023, stability: 0.52 },
      { rank: 8, name: 'Coverage for recommended screenings', weight: 0.053, equal: 0.077, delta: -0.024, stability: 0.44 },
      { rank: 9, name: 'On-site vaccinations', weight: 0.050, equal: 0.077, delta: -0.027, stability: 0.40 },
      { rank: 10, name: 'Workplace safety assessments', weight: 0.046, equal: 0.077, delta: -0.031, stability: 0.39 },
      { rank: 11, name: 'Targeted risk-reduction programs', weight: 0.046, equal: 0.077, delta: -0.031, stability: 0.36 },
      { rank: 12, name: 'Risk factor tracking/reporting', weight: 0.044, equal: 0.077, delta: -0.033, stability: 0.32 },
      { rank: 13, name: 'Lifestyle coaching programs', weight: 0.040, equal: 0.077, delta: -0.037, stability: 0.16 }
    ]
  },
  12: {
    name: 'Continuous Improvement',
    weight: 3,
    elements: 9,
    cvR2: 0.120,
    alpha: 0.5,
    n: 40,
    topElements: ['Regular program enhancements', 'Employee confidence in support', 'Innovation pilots'],
    items: [
      { rank: 1, name: 'Regular program enhancements', weight: 0.200, equal: 0.111, delta: 0.089, stability: 0.90 },
      { rank: 2, name: 'Employee confidence in support', weight: 0.152, equal: 0.111, delta: 0.041, stability: 0.74 },
      { rank: 3, name: 'Innovation pilots', weight: 0.142, equal: 0.111, delta: 0.031, stability: 0.77 },
      { rank: 4, name: 'External benchmarking', weight: 0.129, equal: 0.111, delta: 0.018, stability: 0.75 },
      { rank: 5, name: 'Program utilization analytics', weight: 0.099, equal: 0.111, delta: -0.012, stability: 0.55 },
      { rank: 6, name: 'Return-to-work success metrics', weight: 0.080, equal: 0.111, delta: -0.031, stability: 0.47 },
      { rank: 7, name: 'Employee satisfaction tracking', weight: 0.068, equal: 0.111, delta: -0.043, stability: 0.35 },
      { rank: 8, name: 'Business impact/ROI assessment', weight: 0.065, equal: 0.111, delta: -0.046, stability: 0.25 },
      { rank: 9, name: 'Screening campaign ROI', weight: 0.065, equal: 0.111, delta: -0.046, stability: 0.24 }
    ]
  },
  13: {
    name: 'Communication & Awareness',
    weight: 10,
    elements: 11,
    cvR2: 0.642,
    alpha: 0.5,
    n: 40,
    topElements: ['Family/caregiver communication inclusion', 'Employee testimonials/success stories', 'Proactive diagnosis disclosure communication'],
    items: [
      { rank: 1, name: 'Family/caregiver communication inclusion', weight: 0.200, equal: 0.091, delta: 0.109, stability: 0.97 },
      { rank: 2, name: 'Employee testimonials/success stories', weight: 0.137, equal: 0.091, delta: 0.046, stability: 0.86 },
      { rank: 3, name: 'Proactive diagnosis disclosure communication', weight: 0.132, equal: 0.091, delta: 0.041, stability: 0.92 },
      { rank: 4, name: 'Multi-channel communication strategy', weight: 0.098, equal: 0.091, delta: 0.007, stability: 0.69 },
      { rank: 5, name: 'Anonymous information access', weight: 0.098, equal: 0.091, delta: 0.007, stability: 0.84 },
      { rank: 6, name: 'Anonymous program resource access', weight: 0.095, equal: 0.091, delta: 0.004, stability: 0.81 },
      { rank: 7, name: 'Dedicated program website/portal', weight: 0.053, equal: 0.091, delta: -0.038, stability: 0.38 },
      { rank: 8, name: 'Company-wide awareness campaigns', weight: 0.047, equal: 0.091, delta: -0.044, stability: 0.19 },
      { rank: 9, name: 'New hire orientation coverage', weight: 0.047, equal: 0.091, delta: -0.044, stability: 0.17 },
      { rank: 10, name: 'Manager toolkit for communications', weight: 0.046, equal: 0.091, delta: -0.044, stability: 0.12 },
      { rank: 11, name: 'Cancer awareness month campaigns', weight: 0.046, equal: 0.091, delta: -0.045, stability: 0.08 }
    ]
  }
};

// Score comparison data - converted to percentages for display
const COMPANIES = ['Merck', 'Best Buy', 'Google (Alphabet)', 'Blood Cancer United', 'Sanofi', 'Pfizer', 'Publicis', 'AbbVie', 'Memorial Sloan Kettering', 'Marriott International', 'Haymarket', 'Lloyds Bank (Group)', 'Nestlé', 'Stellantis', 'Citi', 'Maven Search Corp', 'ICBC-AXA Life', 'Renault Group', 'Schneider Electric', 'Ford Otosan', "L'Oréal", 'Inspire Brands'];

const SCORES: Record<string, { eqC: number; wtC: number; dims: Record<number, { eq: number; wt: number }> }> = {
  'Benchmark': { eqC: 71, wtC: 72, dims: { 1: { eq: 74, wt: 78 }, 2: { eq: 60, wt: 62 }, 3: { eq: 66, wt: 68 }, 4: { eq: 73, wt: 75 }, 5: { eq: 85, wt: 88 }, 6: { eq: 83, wt: 84 }, 7: { eq: 55, wt: 57 }, 8: { eq: 81, wt: 81 }, 9: { eq: 55, wt: 60 }, 10: { eq: 60, wt: 62 }, 11: { eq: 79, wt: 76 }, 12: { eq: 68, wt: 70 }, 13: { eq: 81, wt: 81 } } },
  'Merck': { eqC: 86, wtC: 90, dims: { 1: { eq: 82, wt: 87 }, 2: { eq: 85, wt: 90 }, 3: { eq: 76, wt: 85 }, 4: { eq: 93, wt: 95 }, 5: { eq: 91, wt: 95 }, 6: { eq: 100, wt: 100 }, 7: { eq: 80, wt: 84 }, 8: { eq: 82, wt: 84 }, 9: { eq: 67, wt: 73 }, 10: { eq: 82, wt: 86 }, 11: { eq: 100, wt: 100 }, 12: { eq: 73, wt: 78 }, 13: { eq: 93, wt: 97 } } },
  'Best Buy': { eqC: 85, wtC: 88, dims: { 1: { eq: 90, wt: 92 }, 2: { eq: 72, wt: 80 }, 3: { eq: 73, wt: 80 }, 4: { eq: 88, wt: 91 }, 5: { eq: 91, wt: 95 }, 6: { eq: 95, wt: 93 }, 7: { eq: 100, wt: 100 }, 8: { eq: 82, wt: 83 }, 9: { eq: 44, wt: 52 }, 10: { eq: 82, wt: 86 }, 11: { eq: 90, wt: 92 }, 12: { eq: 100, wt: 100 }, 13: { eq: 100, wt: 100 } } },
  'Google (Alphabet)': { eqC: 85, wtC: 88, dims: { 1: { eq: 100, wt: 100 }, 2: { eq: 59, wt: 59 }, 3: { eq: 100, wt: 100 }, 4: { eq: 84, wt: 87 }, 5: { eq: 100, wt: 100 }, 6: { eq: 100, wt: 100 }, 7: { eq: 100, wt: 100 }, 8: { eq: 80, wt: 87 }, 9: { eq: 86, wt: 90 }, 10: { eq: 76, wt: 82 }, 11: { eq: 100, wt: 100 }, 12: { eq: 93, wt: 95 }, 13: { eq: 65, wt: 70 } } },
  'Blood Cancer United': { eqC: 86, wtC: 87, dims: { 1: { eq: 90, wt: 93 }, 2: { eq: 75, wt: 82 }, 3: { eq: 80, wt: 87 }, 4: { eq: 96, wt: 97 }, 5: { eq: 91, wt: 94 }, 6: { eq: 86, wt: 88 }, 7: { eq: 0, wt: 0 }, 8: { eq: 100, wt: 100 }, 9: { eq: 100, wt: 100 }, 10: { eq: 73, wt: 72 }, 11: { eq: 60, wt: 52 }, 12: { eq: 100, wt: 100 }, 13: { eq: 100, wt: 100 } } },
  'Sanofi': { eqC: 81, wtC: 86, dims: { 1: { eq: 100, wt: 100 }, 2: { eq: 100, wt: 100 }, 3: { eq: 74, wt: 86 }, 4: { eq: 80, wt: 85 }, 5: { eq: 95, wt: 94 }, 6: { eq: 89, wt: 92 }, 7: { eq: 67, wt: 75 }, 8: { eq: 82, wt: 79 }, 9: { eq: 40, wt: 57 }, 10: { eq: 76, wt: 81 }, 11: { eq: 96, wt: 92 }, 12: { eq: 33, wt: 43 }, 13: { eq: 78, wt: 88 } } },
  'Pfizer': { eqC: 82, wtC: 85, dims: { 1: { eq: 73, wt: 81 }, 2: { eq: 87, wt: 88 }, 3: { eq: 60, wt: 74 }, 4: { eq: 100, wt: 100 }, 5: { eq: 73, wt: 77 }, 6: { eq: 92, wt: 95 }, 7: { eq: 33, wt: 39 }, 8: { eq: 83, wt: 81 }, 9: { eq: 70, wt: 78 }, 10: { eq: 74, wt: 79 }, 11: { eq: 92, wt: 83 }, 12: { eq: 86, wt: 92 }, 13: { eq: 100, wt: 100 } } },
  'Publicis': { eqC: 82, wtC: 84, dims: { 1: { eq: 82, wt: 87 }, 2: { eq: 91, wt: 94 }, 3: { eq: 64, wt: 62 }, 4: { eq: 80, wt: 84 }, 5: { eq: 76, wt: 83 }, 6: { eq: 92, wt: 95 }, 7: { eq: 73, wt: 78 }, 8: { eq: 95, wt: 91 }, 9: { eq: 73, wt: 80 }, 10: { eq: 58, wt: 65 }, 11: { eq: 72, wt: 76 }, 12: { eq: 71, wt: 76 }, 13: { eq: 100, wt: 100 } } },
  'AbbVie': { eqC: 78, wtC: 82, dims: { 1: { eq: 83, wt: 88 }, 2: { eq: 64, wt: 71 }, 3: { eq: 74, wt: 76 }, 4: { eq: 94, wt: 95 }, 5: { eq: 85, wt: 90 }, 6: { eq: 82, wt: 85 }, 7: { eq: 67, wt: 67 }, 8: { eq: 65, wt: 71 }, 9: { eq: 38, wt: 49 }, 10: { eq: 81, wt: 80 }, 11: { eq: 91, wt: 94 }, 12: { eq: 76, wt: 80 }, 13: { eq: 100, wt: 100 } } },
  'Memorial Sloan Kettering': { eqC: 80, wtC: 81, dims: { 1: { eq: 70, wt: 72 }, 2: { eq: 88, wt: 92 }, 3: { eq: 68, wt: 73 }, 4: { eq: 100, wt: 100 }, 5: { eq: 73, wt: 81 }, 6: { eq: 83, wt: 75 }, 7: { eq: 33, wt: 38 }, 8: { eq: 92, wt: 95 }, 9: { eq: 49, wt: 53 }, 10: { eq: 63, wt: 70 }, 11: { eq: 100, wt: 100 }, 12: { eq: 65, wt: 54 }, 13: { eq: 84, wt: 78 } } },
  'Marriott International': { eqC: 79, wtC: 80, dims: { 1: { eq: 75, wt: 81 }, 2: { eq: 64, wt: 67 }, 3: { eq: 73, wt: 66 }, 4: { eq: 100, wt: 100 }, 5: { eq: 100, wt: 100 }, 6: { eq: 73, wt: 75 }, 7: { eq: 73, wt: 72 }, 8: { eq: 84, wt: 84 }, 9: { eq: 63, wt: 69 }, 10: { eq: 44, wt: 45 }, 11: { eq: 91, wt: 94 }, 12: { eq: 70, wt: 68 }, 13: { eq: 83, wt: 90 } } },
  'Haymarket': { eqC: 76, wtC: 79, dims: { 1: { eq: 91, wt: 94 }, 2: { eq: 61, wt: 66 }, 3: { eq: 84, wt: 79 }, 4: { eq: 60, wt: 66 }, 5: { eq: 91, wt: 95 }, 6: { eq: 85, wt: 84 }, 7: { eq: 85, wt: 90 }, 8: { eq: 85, wt: 86 }, 9: { eq: 64, wt: 70 }, 10: { eq: 58, wt: 60 }, 11: { eq: 63, wt: 70 }, 12: { eq: 50, wt: 53 }, 13: { eq: 87, wt: 89 } } },
  'Lloyds Bank (Group)': { eqC: 76, wtC: 78, dims: { 1: { eq: 82, wt: 87 }, 2: { eq: 44, wt: 36 }, 3: { eq: 88, wt: 93 }, 4: { eq: 75, wt: 81 }, 5: { eq: 91, wt: 95 }, 6: { eq: 83, wt: 88 }, 7: { eq: 71, wt: 77 }, 8: { eq: 95, wt: 91 }, 9: { eq: 53, wt: 59 }, 10: { eq: 55, wt: 60 }, 11: { eq: 68, wt: 70 }, 12: { eq: 45, wt: 51 }, 13: { eq: 87, wt: 88 } } },
  'Nestlé': { eqC: 73, wtC: 76, dims: { 1: { eq: 90, wt: 90 }, 2: { eq: 65, wt: 64 }, 3: { eq: 66, wt: 76 }, 4: { eq: 42, wt: 47 }, 5: { eq: 86, wt: 92 }, 6: { eq: 93, wt: 93 }, 7: { eq: 76, wt: 77 }, 8: { eq: 95, wt: 97 }, 9: { eq: 54, wt: 63 }, 10: { eq: 49, wt: 47 }, 11: { eq: 92, wt: 95 }, 12: { eq: 49, wt: 54 }, 13: { eq: 85, wt: 86 } } },
  'Stellantis': { eqC: 69, wtC: 73, dims: { 1: { eq: 73, wt: 81 }, 2: { eq: 69, wt: 78 }, 3: { eq: 56, wt: 69 }, 4: { eq: 50, wt: 48 }, 5: { eq: 91, wt: 91 }, 6: { eq: 91, wt: 95 }, 7: { eq: 40, wt: 45 }, 8: { eq: 64, wt: 69 }, 9: { eq: 78, wt: 85 }, 10: { eq: 50, wt: 54 }, 11: { eq: 92, wt: 88 }, 12: { eq: 100, wt: 100 }, 13: { eq: 82, wt: 82 } } },
  'Citi': { eqC: 72, wtC: 73, dims: { 1: { eq: 31, wt: 36 }, 2: { eq: 65, wt: 76 }, 3: { eq: 55, wt: 49 }, 4: { eq: 80, wt: 84 }, 5: { eq: 100, wt: 100 }, 6: { eq: 100, wt: 100 }, 7: { eq: 0, wt: 0 }, 8: { eq: 100, wt: 100 }, 9: { eq: 0, wt: 0 }, 10: { eq: 71, wt: 72 }, 11: { eq: 91, wt: 80 }, 12: { eq: 88, wt: 85 }, 13: { eq: 89, wt: 84 } } },
  'Maven Search Corp': { eqC: 69, wtC: 69, dims: { 1: { eq: 100, wt: 100 }, 2: { eq: 54, wt: 61 }, 3: { eq: 60, wt: 61 }, 4: { eq: 72, wt: 74 }, 5: { eq: 73, wt: 78 }, 6: { eq: 58, wt: 52 }, 7: { eq: 82, wt: 86 }, 8: { eq: 82, wt: 80 }, 9: { eq: 55, wt: 61 }, 10: { eq: 67, wt: 66 }, 11: { eq: 58, wt: 58 }, 12: { eq: 53, wt: 54 }, 13: { eq: 64, wt: 61 } } },
  'ICBC-AXA Life': { eqC: 69, wtC: 69, dims: { 1: { eq: 100, wt: 100 }, 2: { eq: 0, wt: 0 }, 3: { eq: 0, wt: 0 }, 4: { eq: 100, wt: 100 }, 5: { eq: 100, wt: 100 }, 6: { eq: 100, wt: 100 }, 7: { eq: 0, wt: 0 }, 8: { eq: 100, wt: 100 }, 9: { eq: 0, wt: 0 }, 10: { eq: 100, wt: 100 }, 11: { eq: 100, wt: 100 }, 12: { eq: 100, wt: 100 }, 13: { eq: 100, wt: 100 } } },
  'Renault Group': { eqC: 71, wtC: 69, dims: { 1: { eq: 60, wt: 65 }, 2: { eq: 38, wt: 30 }, 3: { eq: 83, wt: 68 }, 4: { eq: 78, wt: 82 }, 5: { eq: 100, wt: 100 }, 6: { eq: 84, wt: 91 }, 7: { eq: 58, wt: 56 }, 8: { eq: 63, wt: 63 }, 9: { eq: 83, wt: 78 }, 10: { eq: 21, wt: 26 }, 11: { eq: 75, wt: 61 }, 12: { eq: 78, wt: 85 }, 13: { eq: 90, wt: 78 } } },
  'Schneider Electric': { eqC: 62, wtC: 60, dims: { 1: { eq: 30, wt: 29 }, 2: { eq: 41, wt: 32 }, 3: { eq: 58, wt: 58 }, 4: { eq: 60, wt: 59 }, 5: { eq: 93, wt: 93 }, 6: { eq: 90, wt: 88 }, 7: { eq: 50, wt: 48 }, 8: { eq: 60, wt: 60 }, 9: { eq: 84, wt: 83 }, 10: { eq: 38, wt: 40 }, 11: { eq: 49, wt: 31 }, 12: { eq: 60, wt: 71 }, 13: { eq: 86, wt: 83 } } },
  'Ford Otosan': { eqC: 55, wtC: 56, dims: { 1: { eq: 67, wt: 73 }, 2: { eq: 60, wt: 58 }, 3: { eq: 40, wt: 43 }, 4: { eq: 22, wt: 23 }, 5: { eq: 76, wt: 78 }, 6: { eq: 33, wt: 35 }, 7: { eq: 68, wt: 69 }, 8: { eq: 73, wt: 73 }, 9: { eq: 80, wt: 84 }, 10: { eq: 51, wt: 48 }, 11: { eq: 85, wt: 83 }, 12: { eq: 58, wt: 54 }, 13: { eq: 66, wt: 66 } } },
  "L'Oréal": { eqC: 47, wtC: 47, dims: { 1: { eq: 36, wt: 37 }, 2: { eq: 6, wt: 4 }, 3: { eq: 100, wt: 100 }, 4: { eq: 10, wt: 9 }, 5: { eq: 27, wt: 37 }, 6: { eq: 100, wt: 100 }, 7: { eq: 51, wt: 51 }, 8: { eq: 87, wt: 82 }, 9: { eq: 27, wt: 32 }, 10: { eq: 26, wt: 22 }, 11: { eq: 38, wt: 35 }, 12: { eq: 20, wt: 18 }, 13: { eq: 33, wt: 37 } } },
  'Inspire Brands': { eqC: 26, wtC: 24, dims: { 1: { eq: 33, wt: 35 }, 2: { eq: 35, wt: 34 }, 3: { eq: 10, wt: 7 }, 4: { eq: 50, wt: 48 }, 5: { eq: 64, wt: 68 }, 6: { eq: 17, wt: 13 }, 7: { eq: 0, wt: 0 }, 8: { eq: 25, wt: 19 }, 9: { eq: 8, wt: 5 }, 10: { eq: 20, wt: 16 }, 11: { eq: 31, wt: 19 }, 12: { eq: 22, wt: 23 }, 13: { eq: 0, wt: 0 } } }
};

export default function ElementWeightingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'methodology' | 'dimensions' | 'comparison'>('overview');
  const [expandedDim, setExpandedDim] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-10" />
              <div className="border-l border-slate-700 pl-6">
                <h1 className="text-lg font-semibold text-white">Element Weighting Analysis</h1>
                <p className="text-sm text-slate-400">Best Companies for Working with Cancer Index 2026</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/scoring" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Aggregate Scoring</Link>
              <Link href="/admin" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex">
            {[
              { key: 'overview' as const, label: 'Overview' },
              { key: 'methodology' as const, label: 'Statistical Methodology' },
              { key: 'dimensions' as const, label: 'Element Weights' },
              { key: 'comparison' as const, label: 'Score Comparison' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-violet-600 text-violet-700'
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
      <div className={`mx-auto py-8 ${activeTab === 'comparison' ? 'max-w-none px-4' : 'max-w-5xl px-8'}`}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* The Question */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">The Question</h2>
              <p className="text-slate-600 leading-relaxed">
                The Index assesses workplace cancer support across 13 dimensions, with each dimension containing between 9 and 20 individual program elements. In the first version of scoring, every element within a dimension counted equally. Offering a clinical trial matching service counted the same as offering an employee assistance program.
              </p>
              <p className="text-slate-600 leading-relaxed mt-3">
                That is a reasonable starting point, but it does not reflect reality. Some elements are table-stakes practices that most organizations already provide. Others are rarer commitments that distinguish genuinely mature programs from the rest. <strong className="text-slate-800">The question is whether the scoring should reflect that distinction.</strong>
              </p>
            </section>

            {/* Our Answer */}
            <section className="bg-violet-50 border border-violet-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-violet-900 mb-3">Our Answer</h2>
              <p className="text-violet-800 leading-relaxed">
                <strong>Yes, but carefully.</strong> We adjusted element weights within each dimension so that programs which more consistently distinguish stronger overall performers receive modestly higher weight. We did this using the data itself, not subjective judgment, and we blended the results back toward equal weighting to ensure the adjustment <em>calibrates</em> the scoring rather than rewrites it.
              </p>
              <p className="text-violet-700 mt-3 text-sm">
                The Cancer and Careers framework remains intact. The 13 dimensions, their relative weights, and the response scale are all unchanged. Element weighting adjusts only how much each item contributes within its own dimension.
              </p>
            </section>

            {/* How We Did It */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">How We Did It</h2>
              <div className="grid gap-3">
                {[
                  { step: 1, title: 'Start with the existing framework', desc: 'All 13 dimensions, response options, and dimension weights remain unchanged.' },
                  { step: 2, title: 'Use the full response scale', desc: 'Elements scored on full 4-level scale (Not Offered → Currently Offer), not collapsed to binary.' },
                  { step: 3, title: 'Learn weights only from quality data', desc: 'Companies with >40% Unsure responses in a dimension excluded from weight estimation.' },
                  { step: 4, title: 'Define importance to avoid circularity', desc: 'Element importance measured by prediction of overall strength outside its own dimension.' },
                  { step: 5, title: 'Test stability through bootstrapping', desc: '200 resamples ensure weights are stable, not driven by individual companies.' },
                  { step: 6, title: 'Blend toward equal weights', desc: 'Final weights blend empirical findings with equal weighting. No element exceeds 20% cap.' }
                ].map(item => (
                  <div key={item.step} className="flex gap-4 items-start">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                    <div>
                      <span className="font-semibold text-slate-800">{item.title}:</span>
                      <span className="text-slate-600 ml-1">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* What the Calibration Produces */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">What the Calibration Produces</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 text-center">
                  <p className="text-3xl font-bold text-violet-600">1–3 pts</p>
                  <p className="text-sm text-slate-600 mt-1">Typical composite score shift</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-5 text-center">
                  <p className="text-3xl font-bold text-violet-600">2–3×</p>
                  <p className="text-sm text-slate-600 mt-1">Weight ratio (high vs low element)</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-5 text-center">
                  <p className="text-3xl font-bold text-violet-600">Preserved</p>
                  <p className="text-sm text-slate-600 mt-1">Rankings largely maintained</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-4">This is the expected behavior of a well-calibrated adjustment: meaningful differentiation without disruption.</p>
            </section>

            {/* Top Differentiating Elements */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Top Differentiating Elements by Dimension</h2>
              <p className="text-slate-500 text-sm mb-4">The three highest-weighted elements in each dimension. These are the programs that most consistently predict stronger overall performance.</p>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-2 text-left font-semibold text-slate-600 w-48">Dimension</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">Top 3 Elements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DIMENSION_ORDER.map(d => (
                      <tr key={d} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-700">D{d}: {DIMENSIONS[d].name}</td>
                        <td className="px-4 py-2 text-slate-600">{DIMENSIONS[d].topElements.join(' · ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-slate-500 text-sm mt-3 italic">Note: Every element contributes to scores. Lower-weighted elements still matter. These are illustrative of the calibration, not the full picture.</p>
            </section>
          </div>
        )}

        {/* METHODOLOGY TAB */}
        {activeTab === 'methodology' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">1. Overview</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Within each of the 13 assessment dimensions, element weights calibrate scoring so that elements more predictive of overall program strength receive modestly higher weight. The model operates on 159 elements across 13 dimensions (152 original plus 7 sub-elements), fit on n=43 companies (22 index participants + 21 HR panel respondents).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">2. Feature Encoding</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Each element is scored on its full ordinal scale: Currently Offer = 5, Planning = 3, Assessing = 2, Not Offered = 0. Unsure responses are treated as missing for model fitting. This preserves the full response granularity rather than collapsing to binary.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">3. Company & Element Filtering</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                <strong>Company rule:</strong> For each dimension, companies with &lt;60% observed (non-Unsure) elements are excluded from model fitting. Excluded companies still receive scores.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mt-2">
                <strong>Element rule:</strong> Elements with &gt;90% identical responses or &lt;70% observed values are dropped. In v6.1, zero elements were dropped.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">4. Ridge Regression with Leave-One-Out Outcome</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                For each dimension d, the outcome variable is the leave-one-out composite: mean of all dimension scores excluding dimension d (avoids circularity). Predictors are ordinal element scores, z-scored before fitting. Ridge regularization (α=1.0) distributes weight among correlated elements.
              </p>
              <p className="text-slate-500 text-sm mt-2">Note: Ridge coefficients are not used directly as weights (can be negative). Instead, permutation importance is computed.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">5. Permutation Importance</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                For each element j: <code className="bg-slate-100 px-1 rounded">I(j) = max(0, R²_base − R²_permuted(j))</code>. Each element is permuted 100 times for stable estimates. Importance is non-negative by construction.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">6. Bootstrap Stability & Soft Attenuation</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                200 bootstrap resamples of companies. Stability s(j) = fraction of bootstraps where element j's importance exceeds zero. Soft attenuation: <code className="bg-slate-100 px-1 rounded">w_attenuated(j) = I(j) × s(j)^1.5</code>. Elements with high stability retain full weight; unstable elements are dampened.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">7. Adaptive Shrinkage Toward Equal Weights</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Final weight: <code className="bg-slate-100 px-1 rounded">w_final(j) = α × w_empirical(j) + (1−α) × w_equal</code>
              </p>
              <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200">CV R² Range</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200">α (Empirical Share)</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="px-3 py-2 text-amber-700">CV R² ≤ 0</td><td className="px-3 py-2">0.30</td><td className="px-3 py-2 text-slate-500">No reliable signal</td></tr>
                  <tr><td className="px-3 py-2">0 &lt; CV R² &lt; 0.05</td><td className="px-3 py-2">0.40</td><td className="px-3 py-2 text-slate-500">Marginal signal</td></tr>
                  <tr><td className="px-3 py-2 text-emerald-700">CV R² ≥ 0.05</td><td className="px-3 py-2">0.50</td><td className="px-3 py-2 text-slate-500">Meaningful signal</td></tr>
                </tbody>
              </table>
              <p className="text-slate-500 text-sm mt-2">Hard cap: No element exceeds 20% of its dimension's total weight.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-2">8. Dimension-Level Results</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200">Dim</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200">Name</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-600 border-b border-slate-200">Wt</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-600 border-b border-slate-200">CV R²</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-600 border-b border-slate-200">α</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-600 border-b border-slate-200">n</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DIMENSION_ORDER.map(d => {
                      const dim = DIMENSIONS[d];
                      return (
                        <tr key={d} className={dim.cvR2 < 0 ? 'bg-amber-50/50' : dim.cvR2 > 0.3 ? 'bg-emerald-50/50' : ''}>
                          <td className="px-3 py-2 font-medium">D{d}</td>
                          <td className="px-3 py-2">{dim.name}</td>
                          <td className="px-3 py-2 text-center">{dim.weight}%</td>
                          <td className={`px-3 py-2 text-center ${dim.cvR2 < 0 ? 'text-amber-700' : dim.cvR2 > 0.3 ? 'text-emerald-700' : ''}`}>{dim.cvR2.toFixed(3)}</td>
                          <td className="px-3 py-2 text-center">{dim.alpha}</td>
                          <td className="px-3 py-2 text-center">{dim.n}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* DIMENSIONS TAB */}
        {activeTab === 'dimensions' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-4">Click a dimension to expand element-level weights. Elements ranked by adjusted weight.</p>
            {DIMENSION_ORDER.map(d => {
              const dim = DIMENSIONS[d];
              const isExpanded = expandedDim === d;
              return (
                <div key={d} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedDim(isExpanded ? null : d)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded bg-slate-800 text-white text-sm font-bold flex items-center justify-center">{d}</span>
                      <div className="text-left">
                        <span className="font-medium text-slate-800">{dim.name}</span>
                        <span className="text-slate-400 text-sm ml-3">{dim.elements} elements · {dim.weight}% weight · CV R²={dim.cvR2.toFixed(2)}</span>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500">
                            <th className="px-4 py-2 text-left font-medium w-8">#</th>
                            <th className="px-4 py-2 text-left font-medium">Element</th>
                            <th className="px-4 py-2 text-right font-medium w-20">Equal</th>
                            <th className="px-4 py-2 text-right font-medium w-20">Adjusted</th>
                            <th className="px-4 py-2 text-right font-medium w-20">Δ</th>
                            <th className="px-4 py-2 text-right font-medium w-24">Stability</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dim.items.map(item => (
                            <tr key={item.rank} className={item.weight >= 0.195 ? 'bg-violet-50/50' : ''}>
                              <td className="px-4 py-2 text-slate-400">{item.rank}</td>
                              <td className="px-4 py-2 text-slate-700">{item.name}</td>
                              <td className="px-4 py-2 text-right text-slate-500">{(item.equal * 100).toFixed(1)}%</td>
                              <td className={`px-4 py-2 text-right font-medium ${item.weight >= 0.195 ? 'text-violet-700' : 'text-slate-700'}`}>{(item.weight * 100).toFixed(1)}%</td>
                              <td className="px-4 py-2 text-right">
                                <span className={item.delta >= 0 ? 'text-emerald-600' : 'text-amber-600'}>{item.delta >= 0 ? '+' : ''}{(item.delta * 100).toFixed(1)}</span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${item.stability * 100}%`, backgroundColor: item.stability >= 0.7 ? '#059669' : item.stability >= 0.4 ? '#d97706' : '#dc2626' }} />
                                  </div>
                                  <span className="text-slate-400 text-xs w-8">{Math.round(item.stability * 100)}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* COMPARISON TAB */}
        {activeTab === 'comparison' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Score Comparison: Equal Weight vs. Element-Weighted</h2>
                <p className="text-sm text-slate-500">All pipeline components identical except element weighting within dimensions.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="sticky left-0 z-20 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600 min-w-[160px]"></th>
                      <th className="px-2 py-2 text-center font-bold text-violet-700 min-w-[60px] bg-violet-50">Benchmark</th>
                      {COMPANIES.map(c => (
                        <th key={c} className="px-2 py-2 text-center font-medium text-slate-600 min-w-[55px] whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Composite */}
                    <tr className="bg-slate-100 border-y border-slate-200">
                      <td colSpan={2 + COMPANIES.length} className="px-3 py-1 font-bold text-slate-700 uppercase text-[10px] tracking-wide">Composite</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="sticky left-0 z-10 bg-white px-3 py-1 text-slate-600">Equal</td>
                      <td className="px-2 py-1 text-center font-semibold bg-violet-50/50">{SCORES.Benchmark.eqC}</td>
                      {COMPANIES.map(c => <td key={c} className="px-2 py-1 text-center text-slate-600">{SCORES[c]?.eqC}</td>)}
                    </tr>
                    <tr className="bg-emerald-50/30 hover:bg-emerald-50/50">
                      <td className="sticky left-0 z-10 bg-emerald-50/30 px-3 py-1 text-emerald-700 font-medium">Weighted</td>
                      <td className="px-2 py-1 text-center font-bold text-emerald-700 bg-emerald-100/50">{SCORES.Benchmark.wtC}</td>
                      {COMPANIES.map(c => <td key={c} className="px-2 py-1 text-center text-emerald-700 font-semibold">{SCORES[c]?.wtC}</td>)}
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="sticky left-0 z-10 bg-white px-3 py-1 text-slate-400 text-[10px]">Δ</td>
                      <td className="px-2 py-1 text-center text-[10px] bg-violet-50/30">
                        <span className="text-emerald-600">+{SCORES.Benchmark.wtC - SCORES.Benchmark.eqC}</span>
                      </td>
                      {COMPANIES.map(c => {
                        const d = (SCORES[c]?.wtC || 0) - (SCORES[c]?.eqC || 0);
                        return <td key={c} className="px-2 py-1 text-center text-[10px]"><span className={d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-500' : 'text-slate-400'}>{d > 0 ? '+' : ''}{d}</span></td>;
                      })}
                    </tr>

                    {/* Dimensions */}
                    {DIMENSION_ORDER.map(dim => (
                      <React.Fragment key={dim}>
                        <tr className="bg-slate-50 border-t border-slate-100">
                          <td colSpan={2 + COMPANIES.length} className="px-3 py-1 text-[10px] font-semibold text-slate-500">D{dim}: {DIMENSIONS[dim].name} ({DIMENSIONS[dim].weight}%)</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="sticky left-0 z-10 bg-white px-3 py-1 text-slate-500 pl-5">Equal</td>
                          <td className="px-2 py-1 text-center text-slate-500 bg-violet-50/30">{SCORES.Benchmark.dims[dim]?.eq}</td>
                          {COMPANIES.map(c => <td key={c} className="px-2 py-1 text-center text-slate-500">{SCORES[c]?.dims[dim]?.eq}</td>)}
                        </tr>
                        <tr className="bg-emerald-50/20 hover:bg-emerald-50/30">
                          <td className="sticky left-0 z-10 bg-emerald-50/20 px-3 py-1 text-emerald-600 pl-5">Weighted</td>
                          <td className="px-2 py-1 text-center text-emerald-600 font-medium bg-emerald-100/30">{SCORES.Benchmark.dims[dim]?.wt}</td>
                          {COMPANIES.map(c => <td key={c} className="px-2 py-1 text-center text-emerald-600">{SCORES[c]?.dims[dim]?.wt}</td>)}
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-4 text-sm">
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
                <span className="text-xl font-bold text-emerald-600">+73%</span>
                <span className="text-slate-500 ml-2">companies with higher weighted score</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
                <span className="text-xl font-bold text-violet-600">2.1</span>
                <span className="text-slate-500 ml-2">avg shift (pts)</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
                <span className="text-xl font-bold text-slate-700">5</span>
                <span className="text-slate-500 ml-2">max shift</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

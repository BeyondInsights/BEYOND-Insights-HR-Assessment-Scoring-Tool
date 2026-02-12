'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
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
  items: Array<{ rank: number; name: string; weight: number; equal: number; delta: number; stability: number }>;
}> = {
  1: {
    name: 'Medical Leave & Flexible Work',
    weight: 7,
    elements: 13,
    cvR2: -0.135,
    alpha: 0.3,
    n: 41,
    items: [
      { rank: 1, name: 'Emergency leave within 24 hours', weight: 0.1431, equal: 0.0769, delta: 0.0662, stability: 0.92 },
      { rank: 2, name: 'Remote work options for on-site employees', weight: 0.1287, equal: 0.0769, delta: 0.0518, stability: 0.925 },
      { rank: 3, name: 'Intermittent leave beyond local / legal requirements', weight: 0.1136, equal: 0.0769, delta: 0.0367, stability: 0.835 },
      { rank: 4, name: 'Paid micro-breaks for side effects', weight: 0.0818, equal: 0.0769, delta: 0.0049, stability: 0.76 },
      { rank: 5, name: 'Flexible work hours during treatment', weight: 0.0760, equal: 0.0769, delta: -0.0009, stability: 0.715 },
      { rank: 6, name: 'Job protection beyond local / legal requirements', weight: 0.0623, equal: 0.0769, delta: -0.0146, stability: 0.48 },
      { rank: 7, name: 'Paid medical leave beyond local / legal requirements', weight: 0.0590, equal: 0.0769, delta: -0.0179, stability: 0.395 },
      { rank: 8, name: 'Reduced schedule/part-time with full benefits', weight: 0.0579, equal: 0.0769, delta: -0.0190, stability: 0.425 },
      { rank: 9, name: 'Paid micro-breaks for medical-related side effects', weight: 0.0560, equal: 0.0769, delta: -0.0209, stability: 0.36 },
      { rank: 10, name: 'PTO accrual during leave', weight: 0.0558, equal: 0.0769, delta: -0.0211, stability: 0.335 },
      { rank: 11, name: 'Full salary (100%) continuation during cancer-related short-term disability leave', weight: 0.0553, equal: 0.0769, delta: -0.0216, stability: 0.295 },
      { rank: 12, name: 'Disability pay top-up (employer adds to disability insurance)', weight: 0.0553, equal: 0.0769, delta: -0.0216, stability: 0.285 },
      { rank: 13, name: 'Leave donation bank (employees can donate PTO to colleagues)', weight: 0.0551, equal: 0.0769, delta: -0.0218, stability: 0.27 }
    ]
  },
  2: {
    name: 'Insurance & Financial Protection',
    weight: 11,
    elements: 17,
    cvR2: 0.018,
    alpha: 0.4,
    n: 36,
    items: [
      { rank: 1, name: 'Accelerated life insurance benefits (partial payout for terminal / critical illness)', weight: 0.1724, equal: 0.0588, delta: 0.1136, stability: 0.96 },
      { rank: 2, name: 'Tax/estate planning assistance', weight: 0.1346, equal: 0.0588, delta: 0.0758, stability: 0.91 },
      { rank: 3, name: 'Real-time cost estimator tools', weight: 0.0742, equal: 0.0588, delta: 0.0153, stability: 0.825 },
      { rank: 4, name: 'Insurance advocacy/pre-authorization support', weight: 0.0720, equal: 0.0588, delta: 0.0131, stability: 0.78 },
      { rank: 5, name: '$0 copay for specialty drugs', weight: 0.0553, equal: 0.0588, delta: -0.0035, stability: 0.62 },
      { rank: 6, name: 'Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy)', weight: 0.0463, equal: 0.0588, delta: -0.0125, stability: 0.515 },
      { rank: 7, name: 'Financial counseling services', weight: 0.0449, equal: 0.0588, delta: -0.0139, stability: 0.485 },
      { rank: 8, name: 'Long-term disability covering 60%+ of salary', weight: 0.0448, equal: 0.0588, delta: -0.0140, stability: 0.525 },
      { rank: 9, name: 'Paid time off for clinical trial participation', weight: 0.0433, equal: 0.0588, delta: -0.0155, stability: 0.505 },
      { rank: 10, name: 'Coverage for clinical trials and experimental treatments', weight: 0.0424, equal: 0.0588, delta: -0.0164, stability: 0.485 },
      { rank: 11, name: 'Short-term disability covering 60%+ of salary', weight: 0.0424, equal: 0.0588, delta: -0.0165, stability: 0.45 },
      { rank: 12, name: 'Hardship grants program funded by employer', weight: 0.0395, equal: 0.0588, delta: -0.0193, stability: 0.395 },
      { rank: 13, name: 'Guaranteed job protection', weight: 0.0385, equal: 0.0588, delta: -0.0203, stability: 0.36 },
      { rank: 14, name: 'Employer-paid disability insurance supplements', weight: 0.0380, equal: 0.0588, delta: -0.0208, stability: 0.325 },
      { rank: 15, name: 'Voluntary supplemental illness insurance (with employer contribution)', weight: 0.0378, equal: 0.0588, delta: -0.0211, stability: 0.34 },
      { rank: 16, name: 'Set out-of-pocket maximums (for in-network single coverage)', weight: 0.0369, equal: 0.0588, delta: -0.0219, stability: 0.26 },
      { rank: 17, name: 'Travel/lodging reimbursement for specialized care', weight: 0.0367, equal: 0.0588, delta: -0.0221, stability: 0.26 }
    ]
  },
  3: {
    name: 'Manager Preparedness',
    weight: 12,
    elements: 10,
    cvR2: 0.156,
    alpha: 0.5,
    n: 38,
    items: [
      { rank: 1, name: 'Manager peer support / community building', weight: 0.2000, equal: 0.1000, delta: 0.1000, stability: 0.90 },
      { rank: 2, name: 'Manager training on supporting employees managing cancer or serious health conditions', weight: 0.1958, equal: 0.1000, delta: 0.0958, stability: 0.865 },
      { rank: 3, name: 'Empathy/communication skills training', weight: 0.1639, equal: 0.1000, delta: 0.0639, stability: 0.775 },
      { rank: 4, name: 'Dedicated manager resource hub', weight: 0.0802, equal: 0.1000, delta: -0.0198, stability: 0.505 },
      { rank: 5, name: 'Clear escalation protocol for manager response', weight: 0.0707, equal: 0.1000, delta: -0.0293, stability: 0.46 },
      { rank: 6, name: 'Manager evaluations include how well they support impacted employees', weight: 0.0632, equal: 0.1000, delta: -0.0368, stability: 0.37 },
      { rank: 7, name: 'Privacy protection and confidentiality management', weight: 0.0584, equal: 0.1000, delta: -0.0416, stability: 0.325 },
      { rank: 8, name: 'AI-powered guidance tools', weight: 0.0580, equal: 0.1000, delta: -0.0420, stability: 0.33 },
      { rank: 9, name: 'Legal compliance training', weight: 0.0555, equal: 0.1000, delta: -0.0445, stability: 0.235 },
      { rank: 10, name: 'Senior leader coaching on supporting impacted employees', weight: 0.0544, equal: 0.1000, delta: -0.0456, stability: 0.235 }
    ]
  },
  4: {
    name: 'Treatment & Navigation',
    weight: 14,
    elements: 10,
    cvR2: 0.419,
    alpha: 0.5,
    n: 40,
    items: [
      { rank: 1, name: 'Physical rehabilitation support', weight: 0.2001, equal: 0.1000, delta: 0.1001, stability: 0.98 },
      { rank: 2, name: 'Nutrition coaching', weight: 0.1317, equal: 0.1000, delta: 0.0317, stability: 0.73 },
      { rank: 3, name: 'Insurance advocacy/appeals support', weight: 0.1024, equal: 0.1000, delta: 0.0024, stability: 0.625 },
      { rank: 4, name: 'Dedicated navigation support to help employees understand benefits', weight: 0.0867, equal: 0.1000, delta: -0.0133, stability: 0.475 },
      { rank: 5, name: 'Online tools, apps, or portals for health/benefits support', weight: 0.0818, equal: 0.1000, delta: -0.0182, stability: 0.42 },
      { rank: 6, name: 'Occupational therapy/vocational rehabilitation', weight: 0.0806, equal: 0.1000, delta: -0.0194, stability: 0.37 },
      { rank: 7, name: 'Care coordination concierge', weight: 0.0805, equal: 0.1000, delta: -0.0195, stability: 0.38 },
      { rank: 8, name: 'Survivorship planning assistance', weight: 0.0801, equal: 0.1000, delta: -0.0199, stability: 0.385 },
      { rank: 9, name: 'Benefits optimization assistance', weight: 0.0790, equal: 0.1000, delta: -0.0210, stability: 0.35 },
      { rank: 10, name: 'Clinical trial matching service', weight: 0.0772, equal: 0.1000, delta: -0.0228, stability: 0.285 }
    ]
  },
  5: {
    name: 'Workplace Accommodations',
    weight: 7,
    elements: 11,
    cvR2: 0.412,
    alpha: 0.5,
    n: 39,
    items: [
      { rank: 1, name: 'Flexible scheduling options', weight: 0.2000, equal: 0.0909, delta: 0.1091, stability: 0.84 },
      { rank: 2, name: 'Ergonomic equipment funding', weight: 0.1399, equal: 0.0909, delta: 0.0490, stability: 0.79 },
      { rank: 3, name: 'Temporary role redesigns', weight: 0.1125, equal: 0.0909, delta: 0.0216, stability: 0.71 },
      { rank: 4, name: 'Rest areas / quiet spaces', weight: 0.1125, equal: 0.0909, delta: 0.0216, stability: 0.72 },
      { rank: 5, name: 'Assistive technology catalog', weight: 0.0894, equal: 0.0909, delta: -0.0015, stability: 0.63 },
      { rank: 6, name: 'Cognitive / fatigue support tools', weight: 0.0680, equal: 0.0909, delta: -0.0229, stability: 0.49 },
      { rank: 7, name: 'Priority parking', weight: 0.0655, equal: 0.0909, delta: -0.0254, stability: 0.52 },
      { rank: 8, name: 'Policy accommodations (dress code flexibility, headphone use)', weight: 0.0577, equal: 0.0909, delta: -0.0332, stability: 0.44 },
      { rank: 9, name: 'Remote work capability', weight: 0.0539, equal: 0.0909, delta: -0.0370, stability: 0.325 },
      { rank: 10, name: 'Physical workspace modifications', weight: 0.0523, equal: 0.0909, delta: -0.0386, stability: 0.30 },
      { rank: 11, name: 'Transportation reimbursement', weight: 0.0482, equal: 0.0909, delta: -0.0427, stability: 0.235 }
    ]
  },
  6: {
    name: 'Culture & Stigma',
    weight: 8,
    elements: 12,
    cvR2: 0.361,
    alpha: 0.5,
    n: 38,
    items: [
      { rank: 1, name: 'Employee peer support groups (internal employees with shared experience)', weight: 0.2000, equal: 0.0833, delta: 0.1167, stability: 0.985 },
      { rank: 2, name: 'Stigma-reduction initiatives', weight: 0.1628, equal: 0.0833, delta: 0.0795, stability: 0.77 },
      { rank: 3, name: 'Anonymous benefits navigation tool or website', weight: 0.1039, equal: 0.0833, delta: 0.0206, stability: 0.745 },
      { rank: 4, name: 'Specialized emotional counseling', weight: 0.0746, equal: 0.0833, delta: -0.0087, stability: 0.505 },
      { rank: 5, name: 'Manager training on handling sensitive health information', weight: 0.0664, equal: 0.0833, delta: -0.0169, stability: 0.47 },
      { rank: 6, name: 'Strong anti-discrimination policies specific to health conditions', weight: 0.0635, equal: 0.0833, delta: -0.0199, stability: 0.47 },
      { rank: 7, name: 'Inclusive communication guidelines', weight: 0.0623, equal: 0.0833, delta: -0.0210, stability: 0.435 },
      { rank: 8, name: 'Professional-led support groups (external facilitator)', weight: 0.0591, equal: 0.0833, delta: -0.0242, stability: 0.45 },
      { rank: 9, name: 'Written anti-retaliation policies for health disclosures', weight: 0.0564, equal: 0.0833, delta: -0.0269, stability: 0.37 },
      { rank: 10, name: 'Confidential HR channel for health-related questions', weight: 0.0508, equal: 0.0833, delta: -0.0325, stability: 0.305 },
      { rank: 11, name: 'Clear process for confidential health disclosures', weight: 0.0504, equal: 0.0833, delta: -0.0329, stability: 0.245 },
      { rank: 12, name: 'Optional open health dialogue forums', weight: 0.0496, equal: 0.0833, delta: -0.0337, stability: 0.25 }
    ]
  },
  7: {
    name: 'Career Continuity',
    weight: 4,
    elements: 9,
    cvR2: 0.330,
    alpha: 0.5,
    n: 34,
    items: [
      { rank: 1, name: 'Peer mentorship program', weight: 0.2001, equal: 0.1111, delta: 0.0890, stability: 0.985 },
      { rank: 2, name: 'Continued access to training/development', weight: 0.1797, equal: 0.1111, delta: 0.0685, stability: 0.87 },
      { rank: 3, name: 'Adjusted performance goals during treatment and recovery', weight: 0.1006, equal: 0.1111, delta: -0.0105, stability: 0.59 },
      { rank: 4, name: 'Succession planning protections', weight: 0.0973, equal: 0.1111, delta: -0.0138, stability: 0.56 },
      { rank: 5, name: 'Optional stay-connected program', weight: 0.0960, equal: 0.1111, delta: -0.0151, stability: 0.52 },
      { rank: 6, name: 'Structured reintegration programs', weight: 0.0936, equal: 0.1111, delta: -0.0175, stability: 0.51 },
      { rank: 7, name: 'Career coaching for employees managing cancer', weight: 0.0829, equal: 0.1111, delta: -0.0282, stability: 0.43 },
      { rank: 8, name: 'Professional coach/mentor for employees managing cancer', weight: 0.0764, equal: 0.1111, delta: -0.0347, stability: 0.325 },
      { rank: 9, name: 'Project continuity protocols', weight: 0.0735, equal: 0.1111, delta: -0.0376, stability: 0.21 }
    ]
  },
  8: {
    name: 'Treatment Support & Reintegration',
    weight: 13,
    elements: 12,
    cvR2: 0.530,
    alpha: 0.5,
    n: 38,
    items: [
      { rank: 1, name: 'Flexibility for medical setbacks', weight: 0.1922, equal: 0.0833, delta: 0.1089, stability: 0.83 },
      { rank: 2, name: 'Long-term success tracking', weight: 0.1428, equal: 0.0833, delta: 0.0594, stability: 0.88 },
      { rank: 3, name: 'Manager training on supporting team members during treatment/return', weight: 0.1371, equal: 0.0833, delta: 0.0538, stability: 0.815 },
      { rank: 4, name: 'Workload adjustments during treatment', weight: 0.0920, equal: 0.0833, delta: 0.0086, stability: 0.635 },
      { rank: 5, name: 'Access to occupational therapy/vocational rehabilitation', weight: 0.0797, equal: 0.0833, delta: -0.0036, stability: 0.63 },
      { rank: 6, name: 'Buddy/mentor pairing for support', weight: 0.0588, equal: 0.0833, delta: -0.0246, stability: 0.475 },
      { rank: 7, name: 'Structured progress reviews', weight: 0.0573, equal: 0.0833, delta: -0.0261, stability: 0.385 },
      { rank: 8, name: 'Flexible work arrangements during treatment', weight: 0.0548, equal: 0.0833, delta: -0.0285, stability: 0.395 },
      { rank: 9, name: 'Online peer support forums', weight: 0.0538, equal: 0.0833, delta: -0.0295, stability: 0.415 },
      { rank: 10, name: 'Phased return-to-work plans', weight: 0.0445, equal: 0.0833, delta: -0.0388, stability: 0.195 },
      { rank: 11, name: 'Contingency planning for treatment schedules', weight: 0.0444, equal: 0.0833, delta: -0.0390, stability: 0.21 },
      { rank: 12, name: 'Access to specialized work resumption professionals', weight: 0.0426, equal: 0.0833, delta: -0.0407, stability: 0.135 }
    ]
  },
  9: {
    name: 'Leadership & Accountability',
    weight: 4,
    elements: 12,
    cvR2: 0.136,
    alpha: 0.5,
    n: 34,
    items: [
      { rank: 1, name: 'Executive sponsors communicate regularly about support programs', weight: 0.2001, equal: 0.0833, delta: 0.1167, stability: 0.97 },
      { rank: 2, name: 'ESG/CSR reporting inclusion', weight: 0.1430, equal: 0.0833, delta: 0.0597, stability: 0.72 },
      { rank: 3, name: 'Public success story celebrations', weight: 0.1323, equal: 0.0833, delta: 0.0490, stability: 0.76 },
      { rank: 4, name: 'Year-over-year budget growth', weight: 0.0873, equal: 0.0833, delta: 0.0040, stability: 0.645 },
      { rank: 5, name: 'Executive-led town halls focused on health benefits', weight: 0.0767, equal: 0.0833, delta: -0.0067, stability: 0.59 },
      { rank: 6, name: 'Support programs in investor/stakeholder communications', weight: 0.0612, equal: 0.0833, delta: -0.0221, stability: 0.435 },
      { rank: 7, name: 'Compensation tied to support outcomes', weight: 0.0546, equal: 0.0833, delta: -0.0287, stability: 0.43 },
      { rank: 8, name: 'Executive accountability metrics', weight: 0.0503, equal: 0.0833, delta: -0.0331, stability: 0.315 },
      { rank: 9, name: 'C-suite executive serves as program champion/sponsor', weight: 0.0495, equal: 0.0833, delta: -0.0339, stability: 0.30 },
      { rank: 10, name: 'Cross-functional executive steering committee', weight: 0.0489, equal: 0.0833, delta: -0.0345, stability: 0.295 },
      { rank: 11, name: 'Support metrics in annual report/sustainability reporting', weight: 0.0486, equal: 0.0833, delta: -0.0347, stability: 0.275 },
      { rank: 12, name: 'Dedicated budget allocation for serious illness support', weight: 0.0477, equal: 0.0833, delta: -0.0357, stability: 0.265 }
    ]
  },
  10: {
    name: 'Caregiver Support',
    weight: 4,
    elements: 20,
    cvR2: -0.063,
    alpha: 0.3,
    n: 40,
    items: [
      { rank: 1, name: 'Practical support for managing caregiving and work', weight: 0.1259, equal: 0.0500, delta: 0.0759, stability: 0.92 },
      { rank: 2, name: 'Eldercare consultation and referral services', weight: 0.0988, equal: 0.0500, delta: 0.0488, stability: 0.81 },
      { rank: 3, name: 'Family navigation support', weight: 0.0743, equal: 0.0500, delta: 0.0243, stability: 0.775 },
      { rank: 4, name: 'Caregiver resource navigator/concierge', weight: 0.0485, equal: 0.0500, delta: -0.0015, stability: 0.565 },
      { rank: 5, name: 'Expanded caregiver leave eligibility beyond legal definitions', weight: 0.0465, equal: 0.0500, delta: -0.0035, stability: 0.56 },
      { rank: 6, name: 'Paid caregiver leave with expanded eligibility', weight: 0.0465, equal: 0.0500, delta: -0.0035, stability: 0.545 },
      { rank: 7, name: 'Unpaid leave job protection beyond legal requirements', weight: 0.0431, equal: 0.0500, delta: -0.0069, stability: 0.48 },
      { rank: 8, name: 'Concierge services for caregiving logistics', weight: 0.0430, equal: 0.0500, delta: -0.0070, stability: 0.505 },
      { rank: 9, name: 'Flexible work arrangements for caregivers', weight: 0.0416, equal: 0.0500, delta: -0.0084, stability: 0.455 },
      { rank: 10, name: 'Emergency dependent care when regular arrangements unavailable', weight: 0.0414, equal: 0.0500, delta: -0.0086, stability: 0.48 },
      { rank: 11, name: 'Respite care funding/reimbursement', weight: 0.0410, equal: 0.0500, delta: -0.0090, stability: 0.465 },
      { rank: 12, name: 'Paid time off for care coordination appointments', weight: 0.0410, equal: 0.0500, delta: -0.0090, stability: 0.44 },
      { rank: 13, name: 'Legal/financial planning assistance for caregivers', weight: 0.0408, equal: 0.0500, delta: -0.0092, stability: 0.455 },
      { rank: 14, name: 'Manager training for supervising caregivers', weight: 0.0396, equal: 0.0500, delta: -0.0104, stability: 0.44 },
      { rank: 15, name: 'Caregiver peer support groups', weight: 0.0396, equal: 0.0500, delta: -0.0104, stability: 0.42 },
      { rank: 16, name: 'Dependent care subsidies', weight: 0.0390, equal: 0.0500, delta: -0.0110, stability: 0.42 },
      { rank: 17, name: 'Mental health support specifically for caregivers', weight: 0.0389, equal: 0.0500, delta: -0.0111, stability: 0.40 },
      { rank: 18, name: 'Modified job duties during peak caregiving periods', weight: 0.0376, equal: 0.0500, delta: -0.0124, stability: 0.32 },
      { rank: 19, name: 'Emergency caregiver funds', weight: 0.0367, equal: 0.0500, delta: -0.0133, stability: 0.285 },
      { rank: 20, name: 'Dependent care account matching/contributions', weight: 0.0365, equal: 0.0500, delta: -0.0135, stability: 0.26 }
    ]
  },
  11: {
    name: 'Prevention & Early Detection',
    weight: 3,
    elements: 13,
    cvR2: 0.473,
    alpha: 0.5,
    n: 40,
    items: [
      { rank: 1, name: 'Legal protections beyond requirements', weight: 0.1655, equal: 0.0769, delta: 0.0886, stability: 0.96 },
      { rank: 2, name: 'Individual health assessments (online or in-person)', weight: 0.1453, equal: 0.0769, delta: 0.0684, stability: 0.855 },
      { rank: 3, name: 'Policies to support immuno-compromised colleagues', weight: 0.1252, equal: 0.0769, delta: 0.0483, stability: 0.81 },
      { rank: 4, name: 'Genetic screening/counseling', weight: 0.1172, equal: 0.0769, delta: 0.0403, stability: 0.83 },
      { rank: 5, name: 'Full or partial coverage for annual health screenings', weight: 0.0592, equal: 0.0769, delta: -0.0177, stability: 0.51 },
      { rank: 6, name: 'Regular health education sessions', weight: 0.0550, equal: 0.0769, delta: -0.0220, stability: 0.465 },
      { rank: 7, name: 'Paid time off for preventive care appointments', weight: 0.0542, equal: 0.0769, delta: -0.0228, stability: 0.515 },
      { rank: 8, name: 'At least 70% coverage for recommended screenings', weight: 0.0534, equal: 0.0769, delta: -0.0236, stability: 0.435 },
      { rank: 9, name: 'On-site vaccinations', weight: 0.0499, equal: 0.0769, delta: -0.0271, stability: 0.40 },
      { rank: 10, name: 'Workplace safety assessments to minimize health risks', weight: 0.0457, equal: 0.0769, delta: -0.0312, stability: 0.39 },
      { rank: 11, name: 'Targeted risk-reduction programs', weight: 0.0455, equal: 0.0769, delta: -0.0314, stability: 0.355 },
      { rank: 12, name: 'Risk factor tracking/reporting', weight: 0.0444, equal: 0.0769, delta: -0.0326, stability: 0.315 },
      { rank: 13, name: 'Lifestyle coaching programs', weight: 0.0396, equal: 0.0769, delta: -0.0374, stability: 0.16 }
    ]
  },
  12: {
    name: 'Measurement & Outcomes',
    weight: 3,
    elements: 9,
    cvR2: 0.120,
    alpha: 0.5,
    n: 40,
    items: [
      { rank: 1, name: 'Regular program enhancements', weight: 0.2000, equal: 0.1111, delta: 0.0889, stability: 0.90 },
      { rank: 2, name: 'Employee confidence in employer support', weight: 0.1522, equal: 0.1111, delta: 0.0411, stability: 0.735 },
      { rank: 3, name: 'Innovation pilots', weight: 0.1419, equal: 0.1111, delta: 0.0308, stability: 0.765 },
      { rank: 4, name: 'External benchmarking', weight: 0.1289, equal: 0.1111, delta: 0.0177, stability: 0.745 },
      { rank: 5, name: 'Program utilization analytics', weight: 0.0990, equal: 0.1111, delta: -0.0122, stability: 0.55 },
      { rank: 6, name: 'Return-to-work success metrics', weight: 0.0797, equal: 0.1111, delta: -0.0314, stability: 0.465 },
      { rank: 7, name: 'Employee satisfaction tracking', weight: 0.0683, equal: 0.1111, delta: -0.0428, stability: 0.35 },
      { rank: 8, name: 'Business impact/ROI assessment', weight: 0.0651, equal: 0.1111, delta: -0.0460, stability: 0.25 },
      { rank: 9, name: 'Measure screening campaign ROI', weight: 0.0649, equal: 0.1111, delta: -0.0462, stability: 0.24 }
    ]
  },
  13: {
    name: 'Communication & Awareness',
    weight: 10,
    elements: 11,
    cvR2: 0.642,
    alpha: 0.5,
    n: 40,
    items: [
      { rank: 1, name: 'Family/caregiver communication inclusion', weight: 0.2001, equal: 0.0909, delta: 0.1092, stability: 0.97 },
      { rank: 2, name: 'Employee testimonials/success stories', weight: 0.1368, equal: 0.0909, delta: 0.0459, stability: 0.855 },
      { rank: 3, name: 'Proactive communication at point of diagnosis disclosure', weight: 0.1315, equal: 0.0909, delta: 0.0406, stability: 0.915 },
      { rank: 4, name: 'Multi-channel communication strategy', weight: 0.0984, equal: 0.0909, delta: 0.0075, stability: 0.685 },
      { rank: 5, name: 'Anonymous information access options', weight: 0.0981, equal: 0.0909, delta: 0.0072, stability: 0.84 },
      { rank: 6, name: 'Ability to access program information anonymously', weight: 0.0947, equal: 0.0909, delta: 0.0038, stability: 0.805 },
      { rank: 7, name: 'Dedicated program website or portal', weight: 0.0532, equal: 0.0909, delta: -0.0377, stability: 0.38 },
      { rank: 8, name: 'Regular company-wide awareness campaigns', weight: 0.0473, equal: 0.0909, delta: -0.0436, stability: 0.185 },
      { rank: 9, name: 'New hire orientation coverage', weight: 0.0471, equal: 0.0909, delta: -0.0438, stability: 0.17 },
      { rank: 10, name: 'Manager toolkit for cascade communications', weight: 0.0465, equal: 0.0909, delta: -0.0444, stability: 0.115 },
      { rank: 11, name: 'Cancer awareness month campaigns with resources', weight: 0.0462, equal: 0.0909, delta: -0.0447, stability: 0.08 }
    ]
  }
};

// Score comparison data from Excel
const SCORE_COMPARISON = [
  { name: 'Merck', eqC: 86, wtC: 90 },
  { name: 'Best Buy', eqC: 85, wtC: 88 },
  { name: 'Google (Alphabet)', eqC: 85, wtC: 88 },
  { name: 'Blood Cancer United', eqC: 86, wtC: 87 },
  { name: 'Sanofi', eqC: 81, wtC: 86 },
  { name: 'Pfizer', eqC: 82, wtC: 85 },
  { name: 'Publicis', eqC: 82, wtC: 84 },
  { name: 'AbbVie', eqC: 78, wtC: 82 },
  { name: 'Memorial Sloan Kettering', eqC: 80, wtC: 81 },
  { name: 'Marriott International', eqC: 79, wtC: 80 },
  { name: 'Haymarket', eqC: 76, wtC: 79 },
  { name: 'Lloyds Bank (Group)', eqC: 76, wtC: 78 },
  { name: 'Nestlé', eqC: 73, wtC: 76 },
  { name: 'Stellantis', eqC: 69, wtC: 73 },
  { name: 'Citi', eqC: 72, wtC: 73 },
  { name: 'Maven Search Corporation', eqC: 69, wtC: 69 },
  { name: 'ICBC-AXA Life', eqC: 69, wtC: 69 },
  { name: 'Renault Group', eqC: 71, wtC: 69 },
  { name: 'Schneider Electric', eqC: 62, wtC: 60 },
  { name: 'Ford Otosan', eqC: 55, wtC: 56 },
  { name: "L'Oréal", eqC: 47, wtC: 47 },
  { name: 'Inspire Brands', eqC: 26, wtC: 24 }
];

const BENCHMARK = { eqC: 71, wtC: 72 };

export default function ElementWeightingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'methodology' | 'dimensions' | 'comparison'>('overview');
  const [expandedDim, setExpandedDim] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ============ HERO HEADER - Matches Company Report ============ */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-12 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-10">
              <div className="bg-white rounded-xl p-5 shadow-lg">
                <img src="/best-companies-2026-logo.png" alt="Best Companies 2026" className="h-24 object-contain" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Scoring Methodology</p>
                <h1 className="text-3xl font-bold text-white mt-2">Element Weighting Analysis</h1>
                <p className="text-slate-300 mt-1 text-lg">Best Companies for Working with Cancer Index 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/scoring" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors border border-white/20">
                Aggregate Scoring
              </Link>
              <Link href="/admin" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors border border-white/20">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============ TAB NAVIGATION ============ */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-12">
          <div className="flex gap-1">
            {[
              { key: 'overview' as const, label: 'Overview' },
              { key: 'methodology' as const, label: 'Statistical Methodology' },
              { key: 'dimensions' as const, label: 'Dimension Weights' },
              { key: 'comparison' as const, label: 'Score Comparison' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="max-w-7xl mx-auto px-12 py-10">
        
        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Hero Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-br from-violet-50 via-white to-slate-50 p-10">
                <div className="flex items-start gap-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">What We Did and Why</h2>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      <strong className="text-slate-900">Not all survey elements carry equal weight in differentiating program quality.</strong> Some elements represent table-stakes practices that most organizations offer. Others are rarer commitments that signal a genuinely mature, comprehensive program. Element weighting lets the scoring reflect that distinction without overreacting to sample-specific patterns or undermining the conceptual framework.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Quote Block */}
              <div className="px-10 py-6 bg-slate-50 border-t border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="w-1 h-full bg-violet-400 rounded-full flex-shrink-0"></div>
                  <p className="text-slate-600 italic leading-relaxed">
                    "We kept the CAC framework intact. We used the full maturity scale for each element, identified which items most consistently differentiate stronger programs using only high-quality responses, and then blended those findings back toward equal weighting so that we calibrate the scoring rather than overhaul it."
                  </p>
                </div>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-4 gap-6">
              {[
                { value: '159', label: 'Elements Weighted', sublabel: '13 dimensions' },
                { value: 'n=43', label: 'Companies Analyzed', sublabel: '22 index + 21 panel' },
                { value: '1-3 pts', label: 'Score Impact', sublabel: 'Typical shift' },
                { value: '2-3×', label: 'Weight Ratio', sublabel: 'High vs low within dim' }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <p className="text-3xl font-bold text-violet-600">{stat.value}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{stat.label}</p>
                  <p className="text-xs text-slate-500">{stat.sublabel}</p>
                </div>
              ))}
            </div>

            {/* The Approach */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-10 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-xl font-bold text-slate-900">The Approach, Step by Step</h3>
              </div>
              <div className="p-10">
                <div className="space-y-6">
                  {[
                    { num: 1, title: 'Start with the existing framework', desc: 'The 13 dimensions, the element response options (Not Offered, Assessing, Planning, Currently Offer), and the dimension weights all remain unchanged. Element weighting adjusts how much each item contributes within its dimension.' },
                    { num: 2, title: 'Use the full response scale, not a binary shortcut', desc: 'Each element is scored on its full four-level scale: Not Offered (0), Assessing (2), Planning (3), Currently Offer (5). Collapsing responses to yes/no would discard the progression signal.' },
                    { num: 3, title: 'Only learn weights from companies with sufficient confirmed data', desc: 'If a company reported Unsure on more than 40% of elements in a given dimension, that company is excluded from weight estimation for that dimension.' },
                    { num: 4, title: 'Define importance to avoid circularity', desc: "An element's importance is measured by how well it predicts overall program strength outside its own dimension. No element is rewarded simply for being part of the score it is predicting." },
                    { num: 5, title: 'Use ridge regression for small samples', desc: 'Ridge regression prevents any single element from receiving an extreme weight due to chance correlations. It is purpose-built for situations where the number of predictors is large relative to observations.' },
                    { num: 6, title: 'Measure importance through prediction impact', desc: "For each element, values are shuffled and the resulting R-squared drop is measured. Elements that cause a larger drop when scrambled are stronger differentiators." },
                    { num: 7, title: 'Test stability through bootstrapping', desc: 'The importance calculation is repeated 200 times on different resamples of companies. Elements that consistently appear as important across resamples receive full weight.' },
                    { num: 8, title: 'Blend toward equal weights', desc: "The final weight blends empirical importance (50%) with equal weighting (50%). No single element can exceed 20% of its dimension's total weight." }
                  ].map(step => (
                    <div key={step.num} className="flex gap-5">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-white text-sm font-bold flex items-center justify-center shadow-md">
                        {step.num}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-slate-900">{step.title}</p>
                        <p className="text-slate-600 mt-1 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Result Footer */}
              <div className="px-10 py-6 bg-gradient-to-r from-violet-700 to-purple-700">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-violet-100">
                    <strong className="text-white">Result:</strong> Across all scored companies, element weighting shifts composite scores by approximately 1 to 3 points. Within each dimension, the highest-weighted element is typically 2 to 3 times the lowest. Rankings are largely preserved, with modest reordering among companies with similar scores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ METHODOLOGY TAB ============ */}
        {activeTab === 'methodology' && (
          <div className="space-y-8">
            {/* Section Cards */}
            {[
              {
                title: '1. Overview',
                content: 'Within each of the 13 assessment dimensions, element weights calibrate scoring so that elements more predictive of overall program strength receive modestly higher weight. The model operates on 159 elements across 13 dimensions (152 original plus 7 sub-elements introduced in 2026 for D1, D9, D10, D12, and D13), fit on n = 43 companies (22 index participants and 21 HR panel respondents).'
              },
              {
                title: '2. Feature Encoding',
                content: 'Each element is scored on its full ordinal scale: Currently Offer = 5, Planning = 3, Assessing = 2, Not Offered = 0. Unsure responses are treated as missing for model fitting. This preserves the full response granularity rather than collapsing to a binary indicator.'
              },
              {
                title: '3. Company and Element Filtering',
                content: 'Company inclusion rule: For each dimension, companies with fewer than 60% observed (non-Unsure) elements are excluded from model fitting. This prevents excessive Unsure responses from distorting weight estimation. Excluded companies still receive scores using the final weights.\n\nElement inclusion rule: Elements with greater than 90% identical responses or fewer than 70% observed values are dropped and receive floor weight. In v6.1, zero elements were dropped.'
              },
              {
                title: '4. Ridge Regression with Leave-One-Out Outcome',
                content: 'For each dimension d, the outcome variable is the leave-one-out composite: the mean of all dimension scores excluding dimension d. This eliminates circularity. Predictors are the ordinal element scores, standardized (z-scored) before fitting. Ridge regularization (α = 1.0) distributes weight among correlated elements rather than concentrating it.\n\nKey: Ridge coefficients are not used as weights directly because they can be negative due to multicollinearity. Instead, permutation importance is computed.'
              },
              {
                title: '5. Permutation Importance',
                content: 'For each element j, importance is measured as: I(j) = max( 0, R²_base − R²_permuted(j) )\n\nWhere R²_base is the model R² with all elements intact and R²_permuted(j) is the model R² after shuffling element j across companies. Each element is permuted 100 times for stable estimates. Importance is non-negative by construction.'
              },
              {
                title: '6. Bootstrap Stability and Soft Attenuation',
                content: '200 bootstrap resamples of companies are drawn. In each, the ridge model is refit and permutation importances recomputed. The stability metric s(j) is the fraction of bootstraps where element j\'s importance exceeds zero.\n\nSoft attenuation: w_attenuated(j) = I(j) × s(j) ^ 1.5\n\nElements with high stability retain their full empirical weight. Elements with low stability are dampened continuously.'
              }
            ].map((section, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                </div>
                <div className="p-8">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{section.content}</p>
                </div>
              </div>
            ))}

            {/* Adaptive Shrinkage Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-lg font-bold text-slate-900">7. Adaptive Shrinkage Toward Equal Weights</h3>
              </div>
              <div className="p-8">
                <p className="text-slate-700 mb-6">The final weight blends empirical importance with equal weighting: <code className="bg-slate-100 px-2 py-1 rounded text-sm">w_final(j) = α × w_empirical(j) + (1 − α) × w_equal</code></p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200">CV R² Range</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200">α (Empirical Share)</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200">Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-amber-700">CV R² ≤ 0</td>
                      <td className="px-4 py-3">α = 0.30 (30% empirical / 70% equal)</td>
                      <td className="px-4 py-3 text-slate-600">No reliable signal. Anchor heavily toward equal weights.</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-700">0 &lt; CV R² &lt; 0.05</td>
                      <td className="px-4 py-3">α = 0.40 (40% empirical / 60% equal)</td>
                      <td className="px-4 py-3 text-slate-600">Marginal signal. Lean toward equal but allow some differentiation.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-emerald-700">CV R² ≥ 0.05</td>
                      <td className="px-4 py-3">α = 0.50 (50% empirical / 50% equal)</td>
                      <td className="px-4 py-3 text-slate-600">Meaningful signal. Balanced blend of empirical and equal.</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-slate-600 mt-4 text-sm">Hard cap: No single element can exceed 20% of its dimension's total weight. Any excess is redistributed proportionally.</p>
              </div>
            </div>

            {/* Dimension Results Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-lg font-bold text-slate-900">8. Dimension-Level Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200">Dim</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200">Name</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Wt</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">CV R²</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">α</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">n</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200">Top Element</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIMENSION_ORDER.map(d => {
                      const dim = DIMENSIONS[d];
                      const topItem = dim.items[0];
                      return (
                        <tr key={d} className={`border-b border-slate-100 ${dim.cvR2 < 0 ? 'bg-amber-50/50' : dim.cvR2 > 0.3 ? 'bg-emerald-50/30' : ''}`}>
                          <td className="px-4 py-3 font-medium">D{d}</td>
                          <td className="px-4 py-3">{dim.name}</td>
                          <td className="px-4 py-3 text-center font-semibold">{dim.weight}%</td>
                          <td className={`px-4 py-3 text-center font-medium ${dim.cvR2 < 0 ? 'text-amber-700' : dim.cvR2 > 0.3 ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {dim.cvR2.toFixed(3)}
                          </td>
                          <td className="px-4 py-3 text-center">{dim.alpha}</td>
                          <td className="px-4 py-3 text-center">{dim.n}</td>
                          <td className="px-4 py-3 text-slate-600 truncate max-w-xs">{topItem.name} ({(topItem.weight * 100).toFixed(1)}%)</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recalibration Roadmap */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-lg font-bold text-slate-900">9. Scalability and Recalibration Roadmap</h3>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { milestone: 'Current (n ≈ 43)', action: 'Year 1 preliminary. Adaptive α keeps equal weights dominant where signal is weak.' },
                    { milestone: 'At n = 75+', action: 'Re-run analysis. Consider shifting low-signal dimensions to α = 0.50, others to 0.60.' },
                    { milestone: 'At n = 100+', action: 'Full recalibration. Consider α = 0.70 for high-signal dimensions.' },
                    { milestone: 'Annually', action: 'Recalibrate using latest year\'s data. Publish weight updates with each index release.' }
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <p className="font-semibold text-violet-700">{item.milestone}</p>
                      <p className="text-sm text-slate-600 mt-1">{item.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ DIMENSIONS TAB ============ */}
        {activeTab === 'dimensions' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
              <p className="text-slate-600">Click any dimension to view element-level weights. Elements are ranked by adjusted weight. <span className="text-violet-600 font-medium">Purple highlight</span> indicates elements at the 20% cap.</p>
            </div>
            
            {DIMENSION_ORDER.map(d => {
              const dim = DIMENSIONS[d];
              const isExpanded = expandedDim === d;
              
              return (
                <div key={d} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedDim(isExpanded ? null : d)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-white font-bold flex items-center justify-center shadow-md">
                        {d}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{dim.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-slate-500">{dim.elements} elements</span>
                          <span className="font-medium text-violet-600">{dim.weight}% dimension weight</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            dim.cvR2 < 0 ? 'bg-amber-100 text-amber-700' : 
                            dim.cvR2 > 0.3 ? 'bg-emerald-100 text-emerald-700' : 
                            'bg-slate-100 text-slate-600'
                          }`}>
                            CV R² = {dim.cvR2.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-slate-100">
                      <table className="w-full text-sm mt-4">
                        <thead>
                          <tr className="bg-slate-50 rounded-lg">
                            <th className="px-4 py-3 text-left font-semibold text-slate-600 w-12">#</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Element</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-600 w-24">Equal Wt</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-600 w-24">Adj. Wt</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-600 w-24">Delta</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-600 w-32">Stability</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dim.items.map((item, i) => {
                            const isCapped = item.weight >= 0.195;
                            return (
                              <tr key={i} className={`border-b border-slate-100 ${isCapped ? 'bg-violet-50/50' : item.delta < 0 ? 'bg-slate-50/30' : ''}`}>
                                <td className="px-4 py-3 text-slate-400">{item.rank}</td>
                                <td className="px-4 py-3 text-slate-700">{item.name}</td>
                                <td className="px-4 py-3 text-center text-slate-500">{(item.equal * 100).toFixed(1)}%</td>
                                <td className={`px-4 py-3 text-center font-medium ${isCapped ? 'text-violet-700' : 'text-slate-700'}`}>
                                  {(item.weight * 100).toFixed(1)}%
                                  {isCapped && <span className="text-violet-400 ml-1">*</span>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={item.delta >= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                                    {item.delta >= 0 ? '+' : ''}{(item.delta * 100).toFixed(1)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${item.stability * 100}%`,
                                          backgroundColor: item.stability >= 0.7 ? '#059669' : item.stability >= 0.5 ? '#d97706' : '#dc2626'
                                        }}
                                      />
                                    </div>
                                    <span className="text-slate-500 text-xs w-8">{Math.round(item.stability * 100)}%</span>
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
        )}

        {/* ============ COMPARISON TAB ============ */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-6 bg-gradient-to-r from-violet-700 to-purple-700">
                <h2 className="text-xl font-bold text-white">Score Comparison: Equal Weight vs. Element-Weighted</h2>
                <p className="text-violet-200 mt-1">All pipeline components (dimension weights, geo multiplier, follow-up blend, maturity, breadth) are identical. The only difference is element weighting within each dimension.</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="sticky left-0 bg-slate-50 z-10 px-6 py-4 text-left font-semibold text-slate-700 min-w-[200px]">Company</th>
                      <th className="px-4 py-4 text-center font-semibold text-slate-700 w-24">Equal Wt</th>
                      <th className="px-4 py-4 text-center font-semibold text-emerald-700 bg-emerald-50 w-24">Weighted</th>
                      <th className="px-4 py-4 text-center font-semibold text-slate-700 w-24">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-violet-50 border-b-2 border-violet-200">
                      <td className="sticky left-0 bg-violet-50 z-10 px-6 py-4 font-bold text-violet-700">Benchmark (All Complete)</td>
                      <td className="px-4 py-4 text-center font-semibold">{BENCHMARK.eqC}</td>
                      <td className="px-4 py-4 text-center font-bold text-emerald-700 bg-emerald-100/50">{BENCHMARK.wtC}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={BENCHMARK.wtC - BENCHMARK.eqC >= 0 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                          {BENCHMARK.wtC - BENCHMARK.eqC >= 0 ? '+' : ''}{BENCHMARK.wtC - BENCHMARK.eqC}
                        </span>
                      </td>
                    </tr>
                    {SCORE_COMPARISON.map((company, i) => {
                      const delta = company.wtC - company.eqC;
                      return (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="sticky left-0 bg-white hover:bg-slate-50 z-10 px-6 py-3 font-medium text-slate-700">{company.name}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{company.eqC}</td>
                          <td className="px-4 py-3 text-center font-semibold text-emerald-700 bg-emerald-50/30">{company.wtC}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={delta >= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                              {delta >= 0 ? '+' : ''}{delta}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <p className="text-3xl font-bold text-emerald-600">+{Math.round(SCORE_COMPARISON.filter(c => c.wtC > c.eqC).length / SCORE_COMPARISON.length * 100)}%</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">Companies with Higher Weighted Score</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <p className="text-3xl font-bold text-violet-600">{Math.round(SCORE_COMPARISON.reduce((sum, c) => sum + Math.abs(c.wtC - c.eqC), 0) / SCORE_COMPARISON.length * 10) / 10}</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">Average Score Shift (pts)</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <p className="text-3xl font-bold text-slate-700">{Math.max(...SCORE_COMPARISON.map(c => Math.abs(c.wtC - c.eqC)))}</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">Maximum Score Shift (pts)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

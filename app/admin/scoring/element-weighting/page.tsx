'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ElementItem { rank: number; name: string; weight: number; equal: number; delta: number; stability: number; }
interface DimensionData { name: string; weight: number; elements: number; cvR2: number; alpha: number; n: number; topElements: string[]; items: ElementItem[]; }

const DIMENSION_ORDER = [4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12];

const DIMENSIONS: Record<number, DimensionData> = {
  1: {
    name: 'Medical Leave & Flexible Work',
    weight: 7,
    elements: 13,
    cvR2: -0.131,
    alpha: 0.3,
    n: 41,
    topElements: ["Emergency leave within 24 hours", "Remote work options for on-site employees", "Intermittent leave beyond local / legal requirements"],
    items: [
      { rank: 1, name: 'Emergency leave within 24 hours', weight: 0.160744, equal: 0.076923, delta: 0.083821, stability: 1.0 },
      { rank: 2, name: 'Remote work options for on-site employees', weight: 0.122696, equal: 0.076923, delta: 0.045773, stability: 1.0 },
      { rank: 3, name: 'Intermittent leave beyond local / legal requirements', weight: 0.105572, equal: 0.076923, delta: 0.028649, stability: 0.99 },
      { rank: 4, name: 'Paid micro-breaks for side effects', weight: 0.091662, equal: 0.076923, delta: 0.014739, stability: 0.995 },
      { rank: 5, name: 'Flexible work hours during treatment (e.g., varying start/end ...', weight: 0.088447, equal: 0.076923, delta: 0.011524, stability: 0.995 },
      { rank: 6, name: 'Job protection beyond local / legal requirements', weight: 0.066177, equal: 0.076923, delta: -0.010746, stability: 0.965 },
      { rank: 7, name: 'Paid medical leave beyond local / legal requirements', weight: 0.058219, equal: 0.076923, delta: -0.018704, stability: 0.97 },
      { rank: 8, name: 'Reduced schedule/part-time with full benefits', weight: 0.056838, equal: 0.076923, delta: -0.020085, stability: 0.97 },
      { rank: 9, name: 'Disability pay top-up (employer adds to disability insurance)', weight: 0.051819, equal: 0.076923, delta: -0.025104, stability: 0.97 },
      { rank: 10, name: 'Full salary (100%) continuation during cancer-related short-te...', weight: 0.051720, equal: 0.076923, delta: -0.025203, stability: 0.965 },
      { rank: 11, name: 'PTO accrual during leave', weight: 0.049594, equal: 0.076923, delta: -0.027329, stability: 0.98 },
      { rank: 12, name: 'Leave donation bank (employees can donate PTO to colleagues)', weight: 0.048417, equal: 0.076923, delta: -0.028506, stability: 0.94 },
      { rank: 13, name: 'Paid micro-breaks for medical-related side effects', weight: 0.048096, equal: 0.076923, delta: -0.028828, stability: 0.95 }
    ]
  },
  2: {
    name: 'Insurance & Financial Protection',
    weight: 11,
    elements: 17,
    cvR2: 0.018,
    alpha: 0.4,
    n: 36,
    topElements: ["Accelerated life insurance benefits", "Tax/estate planning assistance", "Real-time cost estimator tools"],
    items: [
      { rank: 1, name: 'Accelerated life insurance benefits (partial payout for termin...', weight: 0.154645, equal: 0.058824, delta: 0.095821, stability: 1.0 },
      { rank: 2, name: 'Tax/estate planning assistance', weight: 0.118162, equal: 0.058824, delta: 0.059339, stability: 0.995 },
      { rank: 3, name: 'Real-time cost estimator tools', weight: 0.073349, equal: 0.058824, delta: 0.014526, stability: 0.985 },
      { rank: 4, name: 'Insurance advocacy/pre-authorization support', weight: 0.072306, equal: 0.058824, delta: 0.013483, stability: 1.0 },
      { rank: 5, name: '$0 copay for specialty drugs', weight: 0.056197, equal: 0.058824, delta: -0.002626, stability: 0.995 },
      { rank: 6, name: 'Short-term disability covering 60%+ of salary', weight: 0.055313, equal: 0.058824, delta: -0.003510, stability: 0.99 },
      { rank: 7, name: 'Long-term disability covering 60%+ of salary', weight: 0.048299, equal: 0.058824, delta: -0.010525, stability: 0.99 },
      { rank: 8, name: 'Coverage for advanced therapies (CAR-T, proton therapy, immuno...', weight: 0.046940, equal: 0.058824, delta: -0.011884, stability: 0.995 },
      { rank: 9, name: 'Financial counseling services', weight: 0.046897, equal: 0.058824, delta: -0.011926, stability: 0.965 },
      { rank: 10, name: 'Paid time off for clinical trial participation', weight: 0.043348, equal: 0.058824, delta: -0.015476, stability: 0.98 },
      { rank: 11, name: 'Coverage for clinical trials and experimental treatments not c...', weight: 0.043113, equal: 0.058824, delta: -0.015710, stability: 0.975 },
      { rank: 12, name: 'Employer-paid disability insurance supplements', weight: 0.042410, equal: 0.058824, delta: -0.016413, stability: 0.98 },
      { rank: 13, name: 'Guaranteed job protection', weight: 0.040960, equal: 0.058824, delta: -0.017863, stability: 0.99 },
      { rank: 14, name: 'Travel/lodging reimbursement for specialized care beyond insur...', weight: 0.039906, equal: 0.058824, delta: -0.018917, stability: 0.985 },
      { rank: 15, name: 'Hardship grants program funded by employer', weight: 0.039768, equal: 0.058824, delta: -0.019056, stability: 0.975 },
      { rank: 16, name: 'Voluntary supplemental illness insurance (with employer contri...', weight: 0.039559, equal: 0.058824, delta: -0.019264, stability: 0.975 },
      { rank: 17, name: 'Set out-of-pocket maximums (for in-network single coverage)', weight: 0.038828, equal: 0.058824, delta: -0.019996, stability: 0.975 }
    ]
  },
  3: {
    name: 'Manager Preparedness',
    weight: 12,
    elements: 10,
    cvR2: 0.156,
    alpha: 0.5,
    n: 38,
    topElements: ["Manager peer support / community building", "Manager training on supporting employees managing cance", "Empathy/communication skills training"],
    items: [
      { rank: 1, name: 'Manager peer support / community building', weight: 0.174725, equal: 0.100000, delta: 0.074725, stability: 1.0 },
      { rank: 2, name: 'Manager training on supporting employees managing cancer or ot...', weight: 0.154583, equal: 0.100000, delta: 0.054583, stability: 1.0 },
      { rank: 3, name: 'Empathy/communication skills training', weight: 0.140133, equal: 0.100000, delta: 0.040133, stability: 0.995 },
      { rank: 4, name: 'Dedicated manager resource hub', weight: 0.099820, equal: 0.100000, delta: -0.000180, stability: 0.995 },
      { rank: 5, name: 'Manager evaluations include how well they support impacted emp...', weight: 0.080495, equal: 0.100000, delta: -0.019505, stability: 0.965 },
      { rank: 6, name: 'Clear escalation protocol for manager response', weight: 0.077347, equal: 0.100000, delta: -0.022653, stability: 0.975 },
      { rank: 7, name: 'Legal compliance training', weight: 0.071002, equal: 0.100000, delta: -0.028998, stability: 0.97 },
      { rank: 8, name: 'AI-powered guidance tools', weight: 0.069294, equal: 0.100000, delta: -0.030706, stability: 0.97 },
      { rank: 9, name: 'Privacy protection and confidentiality management', weight: 0.067211, equal: 0.100000, delta: -0.032789, stability: 0.98 },
      { rank: 10, name: 'Senior leader coaching on supporting impacted employees', weight: 0.065389, equal: 0.100000, delta: -0.034611, stability: 0.96 }
    ]
  },
  4: {
    name: 'Treatment & Navigation',
    weight: 14,
    elements: 10,
    cvR2: 0.419,
    alpha: 0.5,
    n: 40,
    topElements: ["Physical rehabilitation support", "Nutrition coaching", "Insurance advocacy/appeals support"],
    items: [
      { rank: 1, name: 'Physical rehabilitation support', weight: 0.200073, equal: 0.100000, delta: 0.100073, stability: 1.0 },
      { rank: 2, name: 'Nutrition coaching', weight: 0.133196, equal: 0.100000, delta: 0.033196, stability: 1.0 },
      { rank: 3, name: 'Insurance advocacy/appeals support', weight: 0.102184, equal: 0.100000, delta: 0.002184, stability: 0.965 },
      { rank: 4, name: 'Dedicated navigation support to help employees understand bene...', weight: 0.089426, equal: 0.100000, delta: -0.010574, stability: 0.975 },
      { rank: 5, name: 'Online tools, apps, or portals for health/benefits support', weight: 0.087604, equal: 0.100000, delta: -0.012396, stability: 0.965 },
      { rank: 6, name: 'Occupational therapy/vocational rehabilitation', weight: 0.081315, equal: 0.100000, delta: -0.018685, stability: 0.945 },
      { rank: 7, name: 'Care coordination concierge', weight: 0.078595, equal: 0.100000, delta: -0.021405, stability: 0.95 },
      { rank: 8, name: 'Survivorship planning assistance', weight: 0.077310, equal: 0.100000, delta: -0.022690, stability: 0.94 },
      { rank: 9, name: 'Benefits optimization assistance (maximizing coverage, minimiz...', weight: 0.076675, equal: 0.100000, delta: -0.023325, stability: 0.945 },
      { rank: 10, name: 'Clinical trial matching service', weight: 0.073622, equal: 0.100000, delta: -0.026378, stability: 0.955 }
    ]
  },
  5: {
    name: 'Workplace Accommodations',
    weight: 7,
    elements: 11,
    cvR2: 0.412,
    alpha: 0.5,
    n: 39,
    topElements: ["Flexible scheduling options", "Ergonomic equipment funding", "Rest areas / quiet spaces"],
    items: [
      { rank: 1, name: 'Flexible scheduling options', weight: 0.134067, equal: 0.090909, delta: 0.043158, stability: 0.98 },
      { rank: 2, name: 'Ergonomic equipment funding', weight: 0.126183, equal: 0.090909, delta: 0.035274, stability: 1.0 },
      { rank: 3, name: 'Rest areas / quiet spaces', weight: 0.115475, equal: 0.090909, delta: 0.024566, stability: 0.995 },
      { rank: 4, name: 'Temporary role redesigns', weight: 0.109129, equal: 0.090909, delta: 0.018220, stability: 0.99 },
      { rank: 5, name: 'Assistive technology catalog', weight: 0.108836, equal: 0.090909, delta: 0.017927, stability: 0.99 },
      { rank: 6, name: 'Priority parking', weight: 0.079852, equal: 0.090909, delta: -0.011057, stability: 0.975 },
      { rank: 7, name: 'Cognitive / fatigue support tools', weight: 0.074978, equal: 0.090909, delta: -0.015931, stability: 0.99 },
      { rank: 8, name: 'Policy accommodations (e.g., dress code flexibility, headphone...', weight: 0.070501, equal: 0.090909, delta: -0.020408, stability: 0.98 },
      { rank: 9, name: 'Remote work capability', weight: 0.064075, equal: 0.090909, delta: -0.026834, stability: 0.98 },
      { rank: 10, name: 'Transportation reimbursement', weight: 0.059231, equal: 0.090909, delta: -0.031678, stability: 0.965 },
      { rank: 11, name: 'Physical workspace modifications', weight: 0.057672, equal: 0.090909, delta: -0.033237, stability: 0.96 }
    ]
  },
  6: {
    name: 'Culture & Stigma',
    weight: 8,
    elements: 12,
    cvR2: 0.361,
    alpha: 0.5,
    n: 38,
    topElements: ["Employee peer support groups", "Stigma-reduction initiatives", "Anonymous benefits navigation tool or website"],
    items: [
      { rank: 1, name: 'Employee peer support groups (internal employees with shared e...', weight: 0.193109, equal: 0.083333, delta: 0.109775, stability: 1.0 },
      { rank: 2, name: 'Stigma-reduction initiatives', weight: 0.130256, equal: 0.083333, delta: 0.046922, stability: 0.99 },
      { rank: 3, name: 'Anonymous benefits navigation tool or website (no login required)', weight: 0.090308, equal: 0.083333, delta: 0.006975, stability: 0.995 },
      { rank: 4, name: 'Specialized emotional counseling', weight: 0.079909, equal: 0.083333, delta: -0.003424, stability: 0.965 },
      { rank: 5, name: 'Inclusive communication guidelines', weight: 0.071169, equal: 0.083333, delta: -0.012164, stability: 0.95 },
      { rank: 6, name: 'Manager training on handling sensitive health information', weight: 0.070972, equal: 0.083333, delta: -0.012361, stability: 0.975 },
      { rank: 7, name: 'Professional-led support groups (external facilitator/counselor)', weight: 0.066748, equal: 0.083333, delta: -0.016585, stability: 0.99 },
      { rank: 8, name: 'Written anti-retaliation policies for health disclosures', weight: 0.065130, equal: 0.083333, delta: -0.018204, stability: 0.975 },
      { rank: 9, name: 'Strong anti-discrimination policies specific to health conditions', weight: 0.063864, equal: 0.083333, delta: -0.019470, stability: 0.99 },
      { rank: 10, name: 'Clear process for confidential health disclosures', weight: 0.059082, equal: 0.083333, delta: -0.024251, stability: 0.985 },
      { rank: 11, name: 'Confidential HR channel for health benefits, policies and insu...', weight: 0.057287, equal: 0.083333, delta: -0.026046, stability: 0.995 },
      { rank: 12, name: 'Optional open health dialogue forums', weight: 0.052165, equal: 0.083333, delta: -0.031168, stability: 0.96 }
    ]
  },
  7: {
    name: 'Career Continuity',
    weight: 4,
    elements: 9,
    cvR2: 0.33,
    alpha: 0.5,
    n: 34,
    topElements: ["Peer mentorship program", "Continued access to training/development", "Adjusted performance goals/deliverables during treatmen"],
    items: [
      { rank: 1, name: 'Peer mentorship program (employees who had similar condition m...', weight: 0.200033, equal: 0.111111, delta: 0.088922, stability: 0.99 },
      { rank: 2, name: 'Continued access to training/development', weight: 0.143486, equal: 0.111111, delta: 0.032374, stability: 0.995 },
      { rank: 3, name: 'Adjusted performance goals/deliverables during treatment and r...', weight: 0.105850, equal: 0.111111, delta: -0.005261, stability: 0.985 },
      { rank: 4, name: 'Succession planning protections', weight: 0.104257, equal: 0.111111, delta: -0.006854, stability: 0.995 },
      { rank: 5, name: 'Structured reintegration programs', weight: 0.101907, equal: 0.111111, delta: -0.009205, stability: 0.985 },
      { rank: 6, name: 'Optional stay-connected program', weight: 0.101429, equal: 0.111111, delta: -0.009682, stability: 0.975 },
      { rank: 7, name: 'Career coaching for employees managing cancer or other serious...', weight: 0.084242, equal: 0.111111, delta: -0.026869, stability: 0.98 },
      { rank: 8, name: 'Professional coach/mentor for employees managing cancer or oth...', weight: 0.081518, equal: 0.111111, delta: -0.029594, stability: 0.965 },
      { rank: 9, name: 'Project continuity protocols', weight: 0.077280, equal: 0.111111, delta: -0.033831, stability: 0.965 }
    ]
  },
  8: {
    name: 'Treatment Support & Reintegration',
    weight: 13,
    elements: 12,
    cvR2: 0.53,
    alpha: 0.5,
    n: 38,
    topElements: ["Flexibility for medical setbacks", "Manager training on supporting team members during trea", "Long-term success tracking"],
    items: [
      { rank: 1, name: 'Flexibility for medical setbacks', weight: 0.154687, equal: 0.083333, delta: 0.071354, stability: 0.995 },
      { rank: 2, name: 'Manager training on supporting team members during treatment/r...', weight: 0.124079, equal: 0.083333, delta: 0.040746, stability: 1.0 },
      { rank: 3, name: 'Long-term success tracking', weight: 0.102334, equal: 0.083333, delta: 0.019000, stability: 1.0 },
      { rank: 4, name: 'Workload adjustments during treatment', weight: 0.089721, equal: 0.083333, delta: 0.006388, stability: 0.99 },
      { rank: 5, name: 'Access to occupational therapy/vocational rehabilitation', weight: 0.081946, equal: 0.083333, delta: -0.001388, stability: 1.0 },
      { rank: 6, name: 'Structured progress reviews', weight: 0.072191, equal: 0.083333, delta: -0.011142, stability: 0.96 },
      { rank: 7, name: 'Buddy/mentor pairing for support', weight: 0.069346, equal: 0.083333, delta: -0.013988, stability: 0.975 },
      { rank: 8, name: 'Flexible work arrangements during treatment', weight: 0.068431, equal: 0.083333, delta: -0.014902, stability: 0.98 },
      { rank: 9, name: 'Online peer support forums', weight: 0.068325, equal: 0.083333, delta: -0.015008, stability: 0.995 },
      { rank: 10, name: 'Phased return-to-work plans', weight: 0.059020, equal: 0.083333, delta: -0.024314, stability: 0.965 },
      { rank: 11, name: 'Contingency planning for treatment schedules', weight: 0.056143, equal: 0.083333, delta: -0.027190, stability: 0.975 },
      { rank: 12, name: 'Access to specialized work resumption professionals', weight: 0.053777, equal: 0.083333, delta: -0.029556, stability: 0.965 }
    ]
  },
  9: {
    name: 'Leadership & Accountability',
    weight: 4,
    elements: 12,
    cvR2: 0.136,
    alpha: 0.5,
    n: 34,
    topElements: ["Executive sponsors communicate regularly about workplac", "ESG/CSR reporting inclusion", "Public success story celebrations"],
    items: [
      { rank: 1, name: 'Executive sponsors communicate regularly about workplace suppo...', weight: 0.177838, equal: 0.083333, delta: 0.094505, stability: 1.0 },
      { rank: 2, name: 'ESG/CSR reporting inclusion', weight: 0.122962, equal: 0.083333, delta: 0.039629, stability: 0.99 },
      { rank: 3, name: 'Public success story celebrations', weight: 0.101589, equal: 0.083333, delta: 0.018256, stability: 0.995 },
      { rank: 4, name: 'Executive-led town halls focused on health benefits and employ...', weight: 0.078106, equal: 0.083333, delta: -0.005227, stability: 0.985 },
      { rank: 5, name: 'Year-over-year budget growth', weight: 0.077801, equal: 0.083333, delta: -0.005532, stability: 0.975 },
      { rank: 6, name: 'Support programs included in investor/stakeholder communications', weight: 0.076953, equal: 0.083333, delta: -0.006380, stability: 0.965 },
      { rank: 7, name: 'Compensation tied to support outcomes', weight: 0.067727, equal: 0.083333, delta: -0.015606, stability: 0.99 },
      { rank: 8, name: 'C-suite executive serves as program champion/sponsor', weight: 0.063951, equal: 0.083333, delta: -0.019383, stability: 0.99 },
      { rank: 9, name: 'Cross-functional executive steering committee for workplace su...', weight: 0.060213, equal: 0.083333, delta: -0.023121, stability: 0.955 },
      { rank: 10, name: 'Support metrics included in annual report/sustainability repor...', weight: 0.058149, equal: 0.083333, delta: -0.025185, stability: 0.98 },
      { rank: 11, name: 'Executive accountability metrics', weight: 0.057550, equal: 0.083333, delta: -0.025784, stability: 0.97 },
      { rank: 12, name: 'Dedicated budget allocation for serious illness support programs', weight: 0.057162, equal: 0.083333, delta: -0.026172, stability: 0.985 }
    ]
  },
  10: {
    name: 'Caregiver Support',
    weight: 4,
    elements: 20,
    cvR2: -0.063,
    alpha: 0.3,
    n: 40,
    topElements: ["Practical support for managing caregiving and work", "Family navigation support", "Eldercare consultation and referral services"],
    items: [
      { rank: 1, name: 'Practical support for managing caregiving and work', weight: 0.114708, equal: 0.050000, delta: 0.064708, stability: 0.995 },
      { rank: 2, name: 'Family navigation support', weight: 0.080451, equal: 0.050000, delta: 0.030451, stability: 0.995 },
      { rank: 3, name: 'Eldercare consultation and referral services', weight: 0.080031, equal: 0.050000, delta: 0.030031, stability: 0.99 },
      { rank: 4, name: 'Expanded caregiver leave eligibility beyond legal definitions ...', weight: 0.057402, equal: 0.050000, delta: 0.007402, stability: 1.0 },
      { rank: 5, name: 'Caregiver resource navigator/concierge', weight: 0.052119, equal: 0.050000, delta: 0.002119, stability: 0.99 },
      { rank: 6, name: 'Concierge services to coordinate caregiving logistics (e.g., s...', weight: 0.048148, equal: 0.050000, delta: -0.001852, stability: 0.975 },
      { rank: 7, name: 'Paid caregiver leave with expanded eligibility (beyond local l...', weight: 0.046638, equal: 0.050000, delta: -0.003362, stability: 0.97 },
      { rank: 8, name: 'Flexible work arrangements for caregivers', weight: 0.045747, equal: 0.050000, delta: -0.004253, stability: 0.975 },
      { rank: 9, name: 'Paid time off for care coordination appointments', weight: 0.043873, equal: 0.050000, delta: -0.006127, stability: 0.99 },
      { rank: 10, name: 'Respite care funding/reimbursement', weight: 0.043040, equal: 0.050000, delta: -0.006960, stability: 0.98 },
      { rank: 11, name: 'Emergency dependent care when regular arrangements unavailable', weight: 0.042999, equal: 0.050000, delta: -0.007001, stability: 0.965 },
      { rank: 12, name: 'Unpaid leave job protection beyond local / legal requirements', weight: 0.042978, equal: 0.050000, delta: -0.007022, stability: 0.985 },
      { rank: 13, name: 'Legal/financial planning assistance for caregivers', weight: 0.041332, equal: 0.050000, delta: -0.008668, stability: 1.0 },
      { rank: 14, name: 'Mental health support specifically for caregivers', weight: 0.041290, equal: 0.050000, delta: -0.008710, stability: 0.97 },
      { rank: 15, name: 'Manager training for supervising caregivers', weight: 0.039363, equal: 0.050000, delta: -0.010637, stability: 0.975 },
      { rank: 16, name: 'Dependent care account matching/contributions', weight: 0.038215, equal: 0.050000, delta: -0.011785, stability: 0.985 },
      { rank: 17, name: 'Caregiver peer support groups', weight: 0.037140, equal: 0.050000, delta: -0.012860, stability: 0.99 },
      { rank: 18, name: 'Dependent care subsidies', weight: 0.034974, equal: 0.050000, delta: -0.015026, stability: 0.975 },
      { rank: 19, name: 'Emergency caregiver funds', weight: 0.034931, equal: 0.050000, delta: -0.015069, stability: 0.99 },
      { rank: 20, name: 'Modified job duties during peak caregiving periods', weight: 0.034619, equal: 0.050000, delta: -0.015381, stability: 0.96 }
    ]
  },
  11: {
    name: 'Prevention & Early Detection',
    weight: 3,
    elements: 13,
    cvR2: 0.473,
    alpha: 0.5,
    n: 40,
    topElements: ["Legal protections beyond requirements", "Individual health assessments", "Policies to support immuno-compromised colleagues"],
    items: [
      { rank: 1, name: 'Legal protections beyond requirements', weight: 0.115400, equal: 0.076923, delta: 0.038477, stability: 1.0 },
      { rank: 2, name: 'Individual health assessments (online or in-person)', weight: 0.112016, equal: 0.076923, delta: 0.035093, stability: 0.995 },
      { rank: 3, name: 'Policies to support immuno-compromised colleagues (e.g., mask ...', weight: 0.104588, equal: 0.076923, delta: 0.027665, stability: 1.0 },
      { rank: 4, name: 'Genetic screening/counseling', weight: 0.096957, equal: 0.076923, delta: 0.020034, stability: 0.995 },
      { rank: 5, name: 'At least 70% coverage for regionally / locally recommended scr...', weight: 0.072063, equal: 0.076923, delta: -0.004860, stability: 0.995 },
      { rank: 6, name: 'Full or partial coverage for annual health screenings/checkups', weight: 0.070034, equal: 0.076923, delta: -0.006889, stability: 1.0 },
      { rank: 7, name: 'On-site vaccinations', weight: 0.069652, equal: 0.076923, delta: -0.007271, stability: 0.99 },
      { rank: 8, name: 'Risk factor tracking/reporting', weight: 0.066010, equal: 0.076923, delta: -0.010913, stability: 0.995 },
      { rank: 9, name: 'Regular health education sessions', weight: 0.063478, equal: 0.076923, delta: -0.013445, stability: 0.985 },
      { rank: 10, name: 'Targeted risk-reduction programs', weight: 0.061622, equal: 0.076923, delta: -0.015301, stability: 0.99 },
      { rank: 11, name: 'Paid time off for preventive care appointments', weight: 0.061405, equal: 0.076923, delta: -0.015518, stability: 1.0 },
      { rank: 12, name: 'Workplace safety assessments to minimize health risks', weight: 0.054855, equal: 0.076923, delta: -0.022068, stability: 0.98 },
      { rank: 13, name: 'Lifestyle coaching programs', weight: 0.051920, equal: 0.076923, delta: -0.025003, stability: 0.965 }
    ]
  },
  12: {
    name: 'Measurement & Outcomes',
    weight: 3,
    elements: 9,
    cvR2: 0.12,
    alpha: 0.5,
    n: 40,
    topElements: ["Regular program enhancements", "Employee confidence in employer support", "Innovation pilots"],
    items: [
      { rank: 1, name: 'Regular program enhancements', weight: 0.200034, equal: 0.111111, delta: 0.088923, stability: 0.985 },
      { rank: 2, name: 'Employee confidence in employer support', weight: 0.145168, equal: 0.111111, delta: 0.034057, stability: 0.99 },
      { rank: 3, name: 'Innovation pilots', weight: 0.111299, equal: 0.111111, delta: 0.000188, stability: 0.995 },
      { rank: 4, name: 'External benchmarking', weight: 0.111196, equal: 0.111111, delta: 0.000085, stability: 0.98 },
      { rank: 5, name: 'Return-to-work success metrics', weight: 0.101878, equal: 0.111111, delta: -0.009233, stability: 0.975 },
      { rank: 6, name: 'Program utilization analytics', weight: 0.100793, equal: 0.111111, delta: -0.010318, stability: 0.98 },
      { rank: 7, name: 'Measure screening campaign ROI (e.g. participation rates, inqu...', weight: 0.077227, equal: 0.111111, delta: -0.033884, stability: 0.945 },
      { rank: 8, name: 'Business impact/ROI assessment', weight: 0.076737, equal: 0.111111, delta: -0.034374, stability: 0.96 },
      { rank: 9, name: 'Employee satisfaction tracking', weight: 0.075667, equal: 0.111111, delta: -0.035444, stability: 0.955 }
    ]
  },
  13: {
    name: 'Communication & Awareness',
    weight: 10,
    elements: 11,
    cvR2: 0.642,
    alpha: 0.5,
    n: 40,
    topElements: ["Family/caregiver communication inclusion", "Employee testimonials/success stories", "Proactive communication at point of diagnosis disclosur"],
    items: [
      { rank: 1, name: 'Family/caregiver communication inclusion', weight: 0.176781, equal: 0.090909, delta: 0.085872, stability: 1.0 },
      { rank: 2, name: 'Employee testimonials/success stories', weight: 0.120722, equal: 0.090909, delta: 0.029813, stability: 1.0 },
      { rank: 3, name: 'Proactive communication at point of diagnosis disclosure', weight: 0.114617, equal: 0.090909, delta: 0.023708, stability: 1.0 },
      { rank: 4, name: 'Anonymous information access options', weight: 0.107793, equal: 0.090909, delta: 0.016884, stability: 0.995 },
      { rank: 5, name: 'Multi-channel communication strategy', weight: 0.104833, equal: 0.090909, delta: 0.013924, stability: 0.985 },
      { rank: 6, name: 'Ability to access program information and resources anonymously', weight: 0.076920, equal: 0.090909, delta: -0.013989, stability: 0.99 },
      { rank: 7, name: 'Dedicated program website or portal', weight: 0.072307, equal: 0.090909, delta: -0.018602, stability: 0.985 },
      { rank: 8, name: 'New hire orientation coverage', weight: 0.058091, equal: 0.090909, delta: -0.032818, stability: 0.98 },
      { rank: 9, name: 'Regular company-wide awareness campaigns (at least quarterly)', weight: 0.056844, equal: 0.090909, delta: -0.034065, stability: 0.945 },
      { rank: 10, name: 'Manager toolkit for cascade communications', weight: 0.056627, equal: 0.090909, delta: -0.034282, stability: 0.97 },
      { rank: 11, name: 'Cancer awareness month campaigns with resources', weight: 0.054464, equal: 0.090909, delta: -0.036445, stability: 0.965 }
    ]
  }
};

const COMPANIES = ['Best Buy','Publicis','Google','Pfizer','Schneider Electric','Ultragenyx','The Hartford','AARP','Ford Otosan',"L'Oréal",'Inspire Brands'];
type SE = { eqC: number; wtC: number; dims: Record<number, { eq: number; wt: number }> };
const SCORES: Record<string, SE> = {
  Benchmark: { eqC: 49, wtC: 50, dims: { 1:{eq:48,wt:51},2:{eq:42,wt:40},3:{eq:50,wt:51},4:{eq:46,wt:47},5:{eq:65,wt:69},6:{eq:50,wt:52},7:{eq:41,wt:43},8:{eq:55,wt:52},9:{eq:38,wt:40},10:{eq:31,wt:28},11:{eq:48,wt:47},12:{eq:38,wt:38},13:{eq:43,wt:45} } },
  'Best Buy': { eqC: 69, wtC: 72, dims: { 1:{eq:90,wt:93},2:{eq:53,wt:57},3:{eq:100,wt:100},4:{eq:100,wt:100},5:{eq:100,wt:100},6:{eq:100,wt:100},7:{eq:100,wt:100},8:{eq:100,wt:100},9:{eq:50,wt:54},10:{eq:33,wt:28},11:{eq:38,wt:38},12:{eq:44,wt:45},13:{eq:50,wt:50} } },
  Publicis: { eqC: 61, wtC: 63, dims: { 1:{eq:87,wt:90},2:{eq:82,wt:86},3:{eq:80,wt:83},4:{eq:26,wt:28},5:{eq:73,wt:76},6:{eq:100,wt:100},7:{eq:56,wt:58},8:{eq:67,wt:67},9:{eq:67,wt:72},10:{eq:22,wt:19},11:{eq:46,wt:44},12:{eq:22,wt:18},13:{eq:70,wt:73} } },
  Google: { eqC: 56, wtC: 57, dims: { 1:{eq:69,wt:76},2:{eq:53,wt:57},3:{eq:40,wt:43},4:{eq:66,wt:63},5:{eq:91,wt:92},6:{eq:50,wt:54},7:{eq:56,wt:56},8:{eq:67,wt:64},9:{eq:83,wt:86},10:{eq:26,wt:22},11:{eq:54,wt:52},12:{eq:33,wt:34},13:{eq:60,wt:60} } },
  Pfizer: { eqC: 63, wtC: 65, dims: { 1:{eq:62,wt:62},2:{eq:59,wt:66},3:{eq:80,wt:76},4:{eq:100,wt:100},5:{eq:91,wt:91},6:{eq:83,wt:85},7:{eq:89,wt:91},8:{eq:87,wt:88},9:{eq:50,wt:51},10:{eq:29,wt:26},11:{eq:77,wt:78},12:{eq:44,wt:46},13:{eq:60,wt:63} } },
  'Schneider Electric': { eqC: 51, wtC: 54, dims: { 1:{eq:36,wt:39},2:{eq:47,wt:51},3:{eq:30,wt:28},4:{eq:50,wt:54},5:{eq:64,wt:68},6:{eq:67,wt:72},7:{eq:33,wt:35},8:{eq:73,wt:74},9:{eq:58,wt:62},10:{eq:49,wt:49},11:{eq:77,wt:77},12:{eq:44,wt:48},13:{eq:50,wt:52} } },
  Ultragenyx: { eqC: 52, wtC: 53, dims: { 1:{eq:64,wt:72},2:{eq:59,wt:60},3:{eq:50,wt:54},4:{eq:42,wt:44},5:{eq:82,wt:81},6:{eq:33,wt:35},7:{eq:44,wt:48},8:{eq:60,wt:59},9:{eq:33,wt:36},10:{eq:38,wt:36},11:{eq:62,wt:62},12:{eq:56,wt:56},13:{eq:60,wt:61} } },
  'The Hartford': { eqC: 47, wtC: 48, dims: { 1:{eq:54,wt:57},2:{eq:35,wt:31},3:{eq:40,wt:37},4:{eq:50,wt:52},5:{eq:36,wt:41},6:{eq:42,wt:44},7:{eq:44,wt:46},8:{eq:47,wt:45},9:{eq:42,wt:44},10:{eq:34,wt:32},11:{eq:38,wt:37},12:{eq:33,wt:34},13:{eq:40,wt:42} } },
  AARP: { eqC: 38, wtC: 36, dims: { 1:{eq:62,wt:64},2:{eq:6,wt:4},3:{eq:60,wt:57},4:{eq:34,wt:30},5:{eq:55,wt:57},6:{eq:58,wt:56},7:{eq:22,wt:18},8:{eq:33,wt:29},9:{eq:0,wt:0},10:{eq:32,wt:28},11:{eq:31,wt:28},12:{eq:33,wt:34},13:{eq:30,wt:28} } },
  'Ford Otosan': { eqC: 55, wtC: 56, dims: { 1:{eq:67,wt:73},2:{eq:60,wt:58},3:{eq:40,wt:43},4:{eq:22,wt:23},5:{eq:76,wt:78},6:{eq:33,wt:35},7:{eq:68,wt:69},8:{eq:73,wt:73},9:{eq:80,wt:84},10:{eq:51,wt:48},11:{eq:85,wt:83},12:{eq:58,wt:54},13:{eq:66,wt:66} } },
  "L'Oréal": { eqC: 47, wtC: 47, dims: { 1:{eq:36,wt:37},2:{eq:6,wt:4},3:{eq:100,wt:100},4:{eq:10,wt:9},5:{eq:27,wt:37},6:{eq:100,wt:100},7:{eq:51,wt:51},8:{eq:87,wt:82},9:{eq:27,wt:32},10:{eq:26,wt:22},11:{eq:38,wt:35},12:{eq:20,wt:18},13:{eq:33,wt:37} } },
  'Inspire Brands': { eqC: 26, wtC: 24, dims: { 1:{eq:33,wt:35},2:{eq:35,wt:34},3:{eq:10,wt:7},4:{eq:50,wt:48},5:{eq:64,wt:68},6:{eq:17,wt:13},7:{eq:0,wt:0},8:{eq:25,wt:19},9:{eq:8,wt:5},10:{eq:20,wt:16},11:{eq:31,wt:19},12:{eq:22,wt:23},13:{eq:0,wt:0} } }
};

function getSig(c: number): { label: string; color: string; bg: string; border: string } {
  if (c < 0) return { label: 'Emerging', color: '#B45309', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (c < 0.10) return { label: 'Developing', color: '#4338CA', bg: 'bg-indigo-50', border: 'border-indigo-200' };
  if (c < 0.30) return { label: 'Moderate', color: '#0369A1', bg: 'bg-sky-50', border: 'border-sky-200' };
  return { label: 'Strong', color: '#047857', bg: 'bg-emerald-50', border: 'border-emerald-200' };
}

function stabColor(s: number): string { return s >= 0.99 ? '#047857' : s >= 0.97 ? '#059669' : s >= 0.95 ? '#10B981' : '#6B7280'; }

export default function ElementWeightingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'statistical' | 'weights' | 'scoring'>('overview');
  const [expandedDim, setExpandedDim] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-10" />
              <div className="border-l border-slate-700 pl-6">
                <h1 className="text-lg font-semibold text-white">Element Weighting</h1>
                <p className="text-sm text-slate-400">Best Companies for Working with Cancer Index — 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1.5 rounded-full">v6.1 — n = 43</span>
              <Link href="/admin/scoring" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Scoring</Link>
              <Link href="/admin" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex">
            {([['overview','Executive Overview'],['statistical','Statistical Overview'],['weights','Element Weights'],['scoring','Score Comparison']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className={`mx-auto py-8 ${activeTab === 'scoring' ? 'max-w-none px-4' : 'max-w-5xl px-8'}`}>

        {/* ===== TAB 1: EXECUTIVE OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div><h2 className="text-2xl font-bold text-slate-900 mb-2">Why Weight Support Elements?</h2><p className="text-slate-500 text-sm">A data-driven calibration of the Cancer and Careers assessment framework</p></div>

            {/* The Question */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100"><h3 className="font-semibold text-slate-900">The Question</h3></div>
              <div className="px-8 py-6 text-slate-600 leading-relaxed space-y-4">
                <p>The Index assesses workplace cancer support across 13 dimensions, each containing between 9 and 20 individual support elements. In the initial scoring, every element within a dimension counted equally — offering a clinical trial matching service counted the same as an employee assistance program.</p>
                <p>That is a defensible starting point. But it does not reflect the reality that some elements are foundational practices most organizations already provide, while others represent rare commitments that distinguish genuinely mature programs from the rest. The question is whether the scoring should reflect that distinction.</p>
              </div>
            </section>

            {/* Our Answer */}
            <section className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="px-8 py-6">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Our Approach</p>
                <p className="text-white text-lg leading-relaxed"><strong>Yes, but conservatively.</strong> We calibrated element weights within each dimension so that programs which more consistently distinguish stronger overall performers receive modestly higher weight — using the data itself, not subjective judgment — and blended the results back toward equal weighting.</p>
              </div>
              <div className="px-8 py-4 bg-slate-900/50 border-t border-slate-700">
                <p className="text-slate-400 text-sm">The Cancer and Careers framework remains intact. The 13 dimensions, their relative weights, and the four-level response scale are all unchanged. Element weighting adjusts only how much each item contributes within its own dimension.</p>
              </div>
            </section>

            {/* 8 Steps */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100"><h3 className="font-semibold text-slate-900">The Methodology in Eight Steps</h3><p className="text-sm text-slate-500 mt-0.5">A transparent, reproducible process designed to withstand peer review</p></div>
              <div className="px-8 py-6"><div className="space-y-5">
                {[
                  ['Preserved the full response scale','Elements scored across four levels (Currently Offer, Planning, Assessing, Not Offered), not collapsed to binary. The ordinal scale captures program maturity that a yes/no cannot.'],
                  ['Used only clean data','Companies with more than 40% Unsure responses in a dimension were excluded from weight estimation for that dimension. Those companies still receive scored reports using the final weights.'],
                  ['Predicted overall program strength','For each dimension, we asked: which elements best predict a company\u2019s composite score across the other 12 dimensions? This avoids the circularity of predicting a dimension\u2019s own score from its own components.'],
                  ['Measured importance by disruption','If scrambling an element\u2019s data across companies causes the model\u2019s predictive accuracy to drop, that element matters. Larger drops indicate stronger differentiators. This method produces only positive weights.'],
                  ['Tested stability through resampling','200 bootstrap resamples of companies. Elements that consistently appeared as important received their full weight. Elements whose importance fluctuated were dampened proportionally \u2014 no hard cutoffs.'],
                  ['Blended toward equal weights','Final weights combine empirical importance with equal weighting. The blend adapts by dimension based on signal strength, ensuring that even where evidence is strong, the expert framework still anchors the result.'],
                  ['Capped the maximum at 20%','No element can exceed 20% of its dimension\u2019s total weight regardless of what the data suggests. Any excess is redistributed proportionally among remaining elements.'],
                  ['Validated through cross-validation','Five-fold cross-validation measures each dimension\u2019s out-of-sample predictive power, determining how much empirical signal to trust in the final blend.']
                ].map(([t, d], i) => (
                  <div key={i} className="flex gap-5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-sm font-semibold flex items-center justify-center">{i+1}</div>
                    <div className="pt-0.5"><p className="font-medium text-slate-800">{t}</p><p className="text-sm text-slate-500 mt-1 leading-relaxed">{d}</p></div>
                  </div>
                ))}
              </div></div>
            </section>

            {/* Impact Summary */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100"><h3 className="font-semibold text-slate-900">What the Calibration Produces</h3></div>
              <div className="px-8 py-6">
                <div className="grid grid-cols-3 gap-5">
                  <div className="text-center p-5 bg-slate-50 rounded-lg border border-slate-200"><p className="text-3xl font-bold text-slate-700">1\u20133 pts</p><p className="text-xs text-slate-500 mt-2 uppercase tracking-wider">Typical score shift</p></div>
                  <div className="text-center p-5 bg-slate-50 rounded-lg border border-slate-200"><p className="text-3xl font-bold text-slate-700">2\u20133\u00d7</p><p className="text-xs text-slate-500 mt-2 uppercase tracking-wider">High vs low element ratio</p></div>
                  <div className="text-center p-5 bg-slate-50 rounded-lg border border-slate-200"><p className="text-3xl font-bold text-slate-700">Preserved</p><p className="text-xs text-slate-500 mt-2 uppercase tracking-wider">Rankings maintained</p></div>
                </div>
                <div className="mt-5 p-4 bg-slate-800 rounded-lg"><p className="text-slate-300 text-sm text-center">This is the expected behavior of a well-calibrated adjustment: <span className="text-white font-medium">meaningful differentiation without disruption.</span></p></div>
              </div>
            </section>

            {/* Top Differentiators */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100"><h3 className="font-semibold text-slate-900">Top Differentiating Elements</h3><p className="text-sm text-slate-500 mt-0.5">The three highest-weighted elements in each dimension</p></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="bg-slate-800 text-white text-xs uppercase tracking-wider"><th className="px-6 py-3 text-left font-medium w-52">Dimension</th><th className="px-4 py-3 text-left font-medium">#1</th><th className="px-4 py-3 text-left font-medium">#2</th><th className="px-4 py-3 text-left font-medium">#3</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{DIMENSION_ORDER.map((d, i) => { const dim = DIMENSIONS[d]; return (
                  <tr key={d} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}><td className="px-6 py-3"><span className="text-xs text-slate-400 font-medium">D{d}</span><span className="ml-2 text-slate-700 font-medium">{dim.name}</span></td>
                  {dim.items.slice(0, 3).map((item, j) => (<td key={j} className="px-4 py-3 text-slate-600"><span>{item.name}</span><span className="ml-2 text-xs text-slate-400">{(item.weight * 100).toFixed(1)}%</span></td>))}</tr>); })}
                </tbody></table>
              </div>
              <div className="px-8 py-3 bg-slate-50 border-t border-slate-100"><p className="text-xs text-slate-500">Every element contributes. Lower-weighted elements still matter. These are illustrative of the calibration, not the full picture.</p></div>
            </section>

            {/* Key Principles */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100"><h3 className="font-semibold text-slate-900">Key Principles</h3></div>
              <div className="px-8 py-6"><div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {[['Framework comes first','Dimensions, their relative weights, and element definitions are unchanged.'],['Calibration, not reinvention','Score shifts of 1\u20133 points confirm the adjustment is proportionate.'],['Data-driven, not opinion-driven','Every weight traces to observed patterns across participating organizations.'],['Conservative by design','The blend always includes a substantial equal-weight component. The 20% cap provides an additional safety net.'],['All elements contribute','No element is removed or zeroed out. Weighting adjusts relative emphasis, not inclusion.'],['Transparent and reproducible','The methodology can be independently replicated.']].map(([t, d], i) => (
                  <div key={i} className="flex gap-3"><div className="w-1 bg-slate-200 rounded-full flex-shrink-0 mt-1" style={{height:'16px'}}></div><div><p className="font-medium text-slate-800 text-sm">{t}</p><p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{d}</p></div></div>
                ))}
              </div></div>
            </section>
          </div>
        )}

        {/* ===== TAB 2: STATISTICAL OVERVIEW ===== */}
        {activeTab === 'statistical' && (
          <div className="space-y-8">
            <div><h2 className="text-2xl font-bold text-slate-900 mb-2">Statistical Overview</h2><p className="text-slate-500 text-sm">Dimension-level model performance, blend ratios, and sample coverage</p></div>

            <div className="grid grid-cols-4 gap-4">
              {[['159','Elements'],['43','Companies'],['13','Dimensions'],['3','Elements at 20% cap']].map(([v,l]) => (
                <div key={l} className="bg-white rounded-lg border border-slate-200 p-5"><p className="text-3xl font-bold text-slate-800">{v}</p><p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{l}</p></div>
              ))}
            </div>

            {/* Pipeline */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100"><h3 className="font-semibold text-slate-900">Pipeline</h3></div>
              <div className="px-8 py-5"><div className="flex items-center gap-3 text-xs flex-wrap">
                {['Ordinal
0/2/3/5','Ridge
\u03b1=1.0','Permutation
Importance','Bootstrap
Stability','Soft
Attenuation','Adaptive \u03b1
Shrinkage','20% Cap'].map((s, i) => (
                  <React.Fragment key={i}>{i > 0 && <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}<div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-center text-slate-600 whitespace-pre-line leading-tight min-w-[80px]">{s}</div></React.Fragment>
                ))}
              </div></div>
            </section>

            {/* Dimension Results Table */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100"><h3 className="font-semibold text-slate-900">Dimension-Level Results</h3><p className="text-sm text-slate-500 mt-0.5">Cross-validated R\u00b2 determines how much the empirical signal is trusted in each dimension</p></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">Dimension</th><th className="px-4 py-3 text-center font-medium w-14">Wt</th><th className="px-4 py-3 text-center font-medium w-14">Elem</th><th className="px-4 py-3 text-center font-medium w-10">n</th><th className="px-4 py-3 text-center font-medium w-24">CV R\u00b2</th><th className="px-4 py-3 text-center font-medium w-20">Signal</th><th className="px-4 py-3 text-center font-medium w-12">\u03b1</th><th className="px-4 py-3 text-left font-medium">Top 3</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{DIMENSION_ORDER.map((d, i) => { const dim = DIMENSIONS[d]; const sig = getSig(dim.cvR2); return (
                  <tr key={d} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-5 py-3 font-medium text-slate-700"><span className="text-slate-400 text-xs mr-1.5">D{d}</span>{dim.name}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{dim.weight}%</td>
                    <td className="px-4 py-3 text-center text-slate-500">{dim.elements}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{dim.n}</td>
                    <td className="px-4 py-3 text-center"><span className={`font-mono font-medium ${dim.cvR2 < 0 ? 'text-amber-700' : dim.cvR2 >= 0.30 ? 'text-emerald-700' : 'text-slate-600'}`}>{dim.cvR2 >= 0 ? '+' : ''}{dim.cvR2.toFixed(3)}</span></td>
                    <td className="px-4 py-3 text-center"><span className={`text-xs font-medium px-2 py-0.5 rounded ${sig.bg} border ${sig.border}`} style={{color:sig.color}}>{sig.label}</span></td>
                    <td className="px-4 py-3 text-center font-medium text-slate-600">{dim.alpha.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{dim.topElements.join(' \u00b7 ')}</td>
                  </tr>); })}
                </tbody></table>
              </div>
              <div className="px-8 py-3 bg-slate-50 border-t border-slate-100"><div className="flex items-center gap-6 text-xs text-slate-400"><span><strong className="text-slate-500">CV R\u00b2</strong> = 5-fold cross-validated R\u00b2</span><span><strong className="text-slate-500">\u03b1</strong> = empirical share in final blend</span><span><strong className="text-slate-500">n</strong> = companies meeting 60% threshold</span></div></div>
            </section>

            {/* Shrinkage tiers */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100"><h3 className="font-semibold text-slate-900">Adaptive Shrinkage Toward Equal Weights</h3></div>
              <div className="px-8 py-5"><div className="grid grid-cols-3 gap-4">
                {[['CV R\u00b2 < 0','\u03b1 = 0.30','Emerging Signal','30% empirical, 70% equal. Anchor heavily toward framework.','amber'],['0 \u2264 CV R\u00b2 < 0.10','\u03b1 = 0.40','Developing Signal','40% empirical, 60% equal. Allow modest differentiation.','indigo'],['CV R\u00b2 \u2265 0.10','\u03b1 = 0.50','Established Signal','50% empirical, 50% equal. Balanced blend.','emerald']].map(([range, alpha, label, desc, color], i) => (
                  <div key={i} className="p-5 rounded-lg border border-slate-200 bg-slate-50"><div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span><span className="text-lg font-bold text-slate-700">{alpha}</span></div><p className="text-xs text-slate-500 font-mono mb-2">{range}</p><p className="text-xs text-slate-600 leading-relaxed">{desc}</p></div>
                ))}
              </div></div>
            </section>
          </div>
        )}

        {/* ===== TAB 3: ELEMENT WEIGHTS ===== */}
        {activeTab === 'weights' && (
          <div className="space-y-6">
            <div><h2 className="text-2xl font-bold text-slate-900 mb-2">Element-Level Weights</h2><p className="text-slate-500 text-sm">All 159 elements across 13 dimensions. Click a dimension to expand.</p></div>

            {DIMENSION_ORDER.map(d => { const dim = DIMENSIONS[d]; const isExpanded = expandedDim === d; const sig = getSig(dim.cvR2); const caps = dim.items.filter(it => it.weight >= 0.199).length; return (
              <div key={d} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <button onClick={() => setExpandedDim(isExpanded ? null : d)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="w-9 h-9 rounded-lg bg-slate-800 text-white text-sm font-semibold flex items-center justify-center">{d}</span>
                    <div className="text-left"><span className="font-semibold text-slate-800">{dim.name}</span>
                      <div className="flex items-center gap-3 mt-0.5 text-xs"><span className="text-slate-400">{dim.elements} elements</span><span className="text-slate-400">{dim.weight}% dim wt</span><span className={`font-medium px-1.5 py-0.5 rounded ${sig.bg}`} style={{color:sig.color}}>CV R\u00b2 = {dim.cvR2 >= 0 ? '+' : ''}{dim.cvR2.toFixed(3)}</span><span className="text-slate-400">\u03b1 = {dim.alpha.toFixed(2)}</span>{caps > 0 && <span className="text-amber-600 font-medium">{caps} at cap</span>}</div>
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}><svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-200"><table className="w-full text-sm"><thead><tr className="bg-slate-800 text-white text-xs uppercase tracking-wider"><th className="pl-6 pr-2 py-2.5 text-left font-medium w-10">#</th><th className="px-3 py-2.5 text-left font-medium">Element</th><th className="px-3 py-2.5 text-right font-medium w-20">Equal</th><th className="px-3 py-2.5 text-right font-medium w-24">Adjusted</th><th className="px-3 py-2.5 text-right font-medium w-16">\u0394</th><th className="px-3 py-2.5 text-center font-medium w-32">Stability</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{dim.items.map((item, i) => { const cap = item.weight >= 0.199; return (
                    <tr key={item.rank} className={`${cap ? 'bg-amber-50/50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="pl-6 pr-2 py-2.5 text-slate-400 text-xs">{item.rank}</td>
                      <td className="px-3 py-2.5 text-slate-700">{item.name}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400 tabular-nums">{(item.equal * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-right tabular-nums"><span className={`font-semibold ${cap ? 'text-amber-700' : 'text-slate-700'}`}>{(item.weight * 100).toFixed(1)}%</span>{cap && <span className="ml-1 text-xs text-amber-500">cap</span>}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums"><span className={`text-xs font-medium ${item.delta >= 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{item.delta >= 0 ? '+' : ''}{(item.delta * 100).toFixed(1)}</span></td>
                      <td className="px-3 py-2.5"><div className="flex items-center justify-center gap-2"><div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${item.stability*100}%`,backgroundColor:stabColor(item.stability)}} /></div><span className="text-xs text-slate-400 w-10 text-right tabular-nums">{(item.stability*100).toFixed(0)}%</span></div></td>
                    </tr>); })}
                  </tbody>
                  <tfoot><tr className="bg-slate-50 border-t border-slate-200"><td colSpan={2} className="pl-6 pr-3 py-2 text-xs text-slate-500 font-medium">Total</td><td className="px-3 py-2 text-right text-xs text-slate-500 tabular-nums">100.0%</td><td className="px-3 py-2 text-right text-xs text-slate-500 font-medium tabular-nums">100.0%</td><td colSpan={2}></td></tr></tfoot>
                  </table></div>
                )}
              </div>
            ); })}
          </div>
        )}

        {/* ===== TAB 4: SCORE COMPARISON ===== */}
        {activeTab === 'scoring' && (
          <div className="space-y-6">
            <div className="max-w-5xl"><h2 className="text-2xl font-bold text-slate-900 mb-2">Score Comparison</h2><p className="text-slate-500 text-sm">Equal-weight vs. element-weighted scores. All pipeline components identical — only difference is within-dimension element weighting.</p></div>

            <div className="grid grid-cols-3 gap-4 max-w-3xl">
              <div className="bg-white rounded-lg border border-slate-200 p-4"><p className="text-2xl font-bold text-emerald-600">73%</p><p className="text-xs text-slate-500 mt-1">Companies with higher weighted score</p></div>
              <div className="bg-white rounded-lg border border-slate-200 p-4"><p className="text-2xl font-bold text-slate-700">2.1 pts</p><p className="text-xs text-slate-500 mt-1">Average score shift</p></div>
              <div className="bg-white rounded-lg border border-slate-200 p-4"><p className="text-2xl font-bold text-slate-700">5 pts</p><p className="text-xs text-slate-500 mt-1">Maximum shift observed</p></div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden"><div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead><tr className="bg-slate-800 text-white">
                  <th className="sticky left-0 z-20 bg-slate-800 px-4 py-3 text-left font-medium w-[180px] min-w-[180px] border-r border-slate-700"></th>
                  <th className="px-2 py-3 text-center font-medium w-[60px] min-w-[60px] bg-slate-700 border-r border-slate-600">Bench</th>
                  {COMPANIES.map((c, i) => (<th key={c} className={`px-1 py-3 text-center font-medium w-[60px] min-w-[60px] text-[10px] leading-tight ${i % 2 === 0 ? 'bg-slate-700' : 'bg-slate-800'}`}>{c}</th>))}
                </tr></thead>
                <tbody>
                  <tr className="bg-slate-100 border-y border-slate-300"><td colSpan={2 + COMPANIES.length} className="px-4 py-2 font-bold text-slate-800 uppercase text-[10px] tracking-wider">Composite Score</td></tr>
                  <tr className="border-b border-slate-100">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 text-slate-500 font-medium border-r border-slate-100">Equal Weight</td>
                    <td className="px-2 py-2 text-center font-medium text-slate-600 bg-slate-50 border-r border-slate-100">{SCORES.Benchmark.eqC}</td>
                    {COMPANIES.map((c, i) => <td key={c} className={`px-2 py-2 text-center text-slate-500 ${i % 2 === 0 ? 'bg-slate-50/30' : ''}`}>{SCORES[c]?.eqC}</td>)}
                  </tr>
                  <tr className="border-b border-slate-200 bg-emerald-50/50">
                    <td className="sticky left-0 z-10 bg-emerald-50/50 px-4 py-2 text-emerald-700 font-semibold border-r border-emerald-100">Element-Weighted</td>
                    <td className="px-2 py-2 text-center font-bold text-emerald-700 bg-emerald-50 border-r border-emerald-100">{SCORES.Benchmark.wtC}</td>
                    {COMPANIES.map((c, i) => <td key={c} className={`px-2 py-2 text-center font-semibold text-emerald-700 ${i % 2 === 0 ? 'bg-emerald-50/30' : ''}`}>{SCORES[c]?.wtC}</td>)}
                  </tr>
                  <tr className="border-b-2 border-slate-300 bg-slate-50">
                    <td className="sticky left-0 z-10 bg-slate-50 px-4 py-1.5 text-slate-400 text-[10px] border-r border-slate-200">{'\u0394'}</td>
                    <td className="px-2 py-1.5 text-center text-[10px] font-medium bg-slate-50/50 border-r border-slate-200"><span className="text-emerald-600">+{SCORES.Benchmark.wtC - SCORES.Benchmark.eqC}</span></td>
                    {COMPANIES.map(c => { const dd = (SCORES[c]?.wtC || 0) - (SCORES[c]?.eqC || 0); return <td key={c} className="px-2 py-1.5 text-center text-[10px] font-medium"><span className={dd > 0 ? 'text-emerald-600' : dd < 0 ? 'text-red-500' : 'text-slate-400'}>{dd > 0 ? '+' : ''}{dd}</span></td>; })}
                  </tr>

                  {DIMENSION_ORDER.map((dim, idx) => (
                    <React.Fragment key={dim}>
                      <tr className={`${idx === 0 ? '' : 'border-t border-slate-200'} bg-slate-100`}>
                        <td colSpan={2 + COMPANIES.length} className="px-4 py-1.5 text-[10px] font-semibold text-slate-600">
                            <span className="text-slate-800">D{dim}:</span> {DIMENSIONS[dim].name} <span className="text-slate-400 font-normal">({DIMENSIONS[dim].weight}%)</span>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-50">
                          <td className="sticky left-0 z-10 bg-white px-4 py-1.5 text-slate-400 pl-6 text-[10px] border-r border-slate-100">Equal</td>
                          <td className="px-2 py-1.5 text-center text-slate-400 bg-slate-50/30 border-r border-slate-100">{SCORES.Benchmark.dims[dim]?.eq}</td>
                          {COMPANIES.map((c, i) => <td key={c} className={`px-2 py-1.5 text-center text-slate-400 ${i % 2 === 0 ? 'bg-slate-50/20' : ''}`}>{SCORES[c]?.dims[dim]?.eq}</td>)}
                        </tr>
                        <tr className="border-b border-slate-100 bg-emerald-50/20">
                          <td className="sticky left-0 z-10 bg-emerald-50/20 px-4 py-1.5 text-emerald-600 font-medium pl-6 text-[10px] border-r border-emerald-100/50">Weighted</td>
                          <td className="px-2 py-1.5 text-center font-medium text-emerald-600 bg-emerald-50/30 border-r border-emerald-100/50">{SCORES.Benchmark.dims[dim]?.wt}</td>
                          {COMPANIES.map((c, i) => <td key={c} className={`px-2 py-1.5 text-center text-emerald-600 ${i % 2 === 0 ? 'bg-emerald-50/20' : ''}`}>{SCORES[c]?.dims[dim]?.wt}</td>)}
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

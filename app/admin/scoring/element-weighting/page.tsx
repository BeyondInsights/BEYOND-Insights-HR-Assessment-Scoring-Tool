'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface ElementItem {
  rank: number;
  name: string;
  weight: number;
  equal: number;
  delta: number;
  stability: number;
}

interface DimensionData {
  name: string;
  weight: number;
  elements: number;
  cvR2: number;
  alpha: number;
  n: number;
  topElements: string[];
  items: ElementItem[];
}

// ============================================
// DATA — Element_Weights_v6_1 (Authoritative)
// ============================================

const DIMENSION_ORDER = [4, 8, 3, 2, 13, 6, 1, 5, 7, 9, 10, 11, 12];

const DIMENSIONS: Record<number, DimensionData> = {
  1: {
    name: "Medical Leave & Flexible Work",
    weight: 7,
    elements: 13,
    cvR2: -0.131,
    alpha: 0.3,
    n: 41,
    topElements: [
      "Emergency leave within 24 hours",
      "Remote work options for on-site employees",
      "Intermittent leave beyond local / legal requirements"
    ],
    items: [
      {
        rank: 1,
        name: "Emergency leave within 24 hours",
        weight: 0.160744,
        equal: 0.076923,
        delta: 0.083821,
        stability: 1.0
      },
      {
        rank: 2,
        name: "Remote work options for on-site employees",
        weight: 0.122696,
        equal: 0.076923,
        delta: 0.045773,
        stability: 1.0
      },
      {
        rank: 3,
        name: "Intermittent leave beyond local / legal requirements",
        weight: 0.105572,
        equal: 0.076923,
        delta: 0.028649,
        stability: 0.99
      },
      {
        rank: 4,
        name: "Paid micro-breaks for side effects",
        weight: 0.091662,
        equal: 0.076923,
        delta: 0.014739,
        stability: 0.995
      },
      {
        rank: 5,
        name: "Flexible work hours during treatment (e.g., varying start/end times...",
        weight: 0.088447,
        equal: 0.076923,
        delta: 0.011524,
        stability: 0.995
      },
      {
        rank: 6,
        name: "Job protection beyond local / legal requirements",
        weight: 0.066177,
        equal: 0.076923,
        delta: -0.010746,
        stability: 0.965
      },
      {
        rank: 7,
        name: "Paid medical leave beyond local / legal requirements",
        weight: 0.058219,
        equal: 0.076923,
        delta: -0.018704,
        stability: 0.97
      },
      {
        rank: 8,
        name: "Reduced schedule/part-time with full benefits",
        weight: 0.056838,
        equal: 0.076923,
        delta: -0.020085,
        stability: 0.97
      },
      {
        rank: 9,
        name: "Disability pay top-up (employer adds to disability insurance)",
        weight: 0.051819,
        equal: 0.076923,
        delta: -0.025104,
        stability: 0.97
      },
      {
        rank: 10,
        name: "Full salary (100%) continuation during cancer-related short-term di...",
        weight: 0.05172,
        equal: 0.076923,
        delta: -0.025203,
        stability: 0.965
      },
      {
        rank: 11,
        name: "PTO accrual during leave",
        weight: 0.049594,
        equal: 0.076923,
        delta: -0.027329,
        stability: 0.98
      },
      {
        rank: 12,
        name: "Leave donation bank (employees can donate PTO to colleagues)",
        weight: 0.048417,
        equal: 0.076923,
        delta: -0.028506,
        stability: 0.94
      },
      {
        rank: 13,
        name: "Paid micro-breaks for medical-related side effects",
        weight: 0.048096,
        equal: 0.076923,
        delta: -0.028828,
        stability: 0.95
      }
    ]
  },
  2: {
    name: "Insurance & Financial Protection",
    weight: 11,
    elements: 17,
    cvR2: 0.018,
    alpha: 0.4,
    n: 36,
    topElements: [
      "Accelerated life insurance benefits",
      "Tax/estate planning assistance",
      "Real-time cost estimator tools"
    ],
    items: [
      {
        rank: 1,
        name: "Accelerated life insurance benefits (partial payout for terminal / ...",
        weight: 0.154645,
        equal: 0.058824,
        delta: 0.095821,
        stability: 1.0
      },
      {
        rank: 2,
        name: "Tax/estate planning assistance",
        weight: 0.118162,
        equal: 0.058824,
        delta: 0.059339,
        stability: 0.995
      },
      {
        rank: 3,
        name: "Real-time cost estimator tools",
        weight: 0.073349,
        equal: 0.058824,
        delta: 0.014526,
        stability: 0.985
      },
      {
        rank: 4,
        name: "Insurance advocacy/pre-authorization support",
        weight: 0.072306,
        equal: 0.058824,
        delta: 0.013483,
        stability: 1.0
      },
      {
        rank: 5,
        name: "$0 copay for specialty drugs",
        weight: 0.056197,
        equal: 0.058824,
        delta: -0.002626,
        stability: 0.995
      },
      {
        rank: 6,
        name: "Short-term disability covering 60%+ of salary",
        weight: 0.055313,
        equal: 0.058824,
        delta: -0.00351,
        stability: 0.99
      },
      {
        rank: 7,
        name: "Long-term disability covering 60%+ of salary",
        weight: 0.048299,
        equal: 0.058824,
        delta: -0.010525,
        stability: 0.99
      },
      {
        rank: 8,
        name: "Coverage for advanced therapies (CAR-T, proton therapy, immunothera...",
        weight: 0.04694,
        equal: 0.058824,
        delta: -0.011884,
        stability: 0.995
      },
      {
        rank: 9,
        name: "Financial counseling services",
        weight: 0.046897,
        equal: 0.058824,
        delta: -0.011926,
        stability: 0.965
      },
      {
        rank: 10,
        name: "Paid time off for clinical trial participation",
        weight: 0.043348,
        equal: 0.058824,
        delta: -0.015476,
        stability: 0.98
      },
      {
        rank: 11,
        name: "Coverage for clinical trials and experimental treatments not covere...",
        weight: 0.043113,
        equal: 0.058824,
        delta: -0.01571,
        stability: 0.975
      },
      {
        rank: 12,
        name: "Employer-paid disability insurance supplements",
        weight: 0.04241,
        equal: 0.058824,
        delta: -0.016413,
        stability: 0.98
      },
      {
        rank: 13,
        name: "Guaranteed job protection",
        weight: 0.04096,
        equal: 0.058824,
        delta: -0.017863,
        stability: 0.99
      },
      {
        rank: 14,
        name: "Travel/lodging reimbursement for specialized care beyond insurance ...",
        weight: 0.039906,
        equal: 0.058824,
        delta: -0.018917,
        stability: 0.985
      },
      {
        rank: 15,
        name: "Hardship grants program funded by employer",
        weight: 0.039768,
        equal: 0.058824,
        delta: -0.019056,
        stability: 0.975
      },
      {
        rank: 16,
        name: "Voluntary supplemental illness insurance (with employer contribution)",
        weight: 0.039559,
        equal: 0.058824,
        delta: -0.019264,
        stability: 0.975
      },
      {
        rank: 17,
        name: "Set out-of-pocket maximums (for in-network single coverage)",
        weight: 0.038828,
        equal: 0.058824,
        delta: -0.019996,
        stability: 0.975
      }
    ]
  },
  3: {
    name: "Manager Preparedness",
    weight: 12,
    elements: 10,
    cvR2: 0.156,
    alpha: 0.5,
    n: 38,
    topElements: [
      "Manager peer support / community building",
      "Manager training on supporting employees managing cance",
      "Empathy/communication skills training"
    ],
    items: [
      {
        rank: 1,
        name: "Manager peer support / community building",
        weight: 0.174725,
        equal: 0.1,
        delta: 0.074725,
        stability: 1.0
      },
      {
        rank: 2,
        name: "Manager training on supporting employees managing cancer or other s...",
        weight: 0.154583,
        equal: 0.1,
        delta: 0.054583,
        stability: 1.0
      },
      {
        rank: 3,
        name: "Empathy/communication skills training",
        weight: 0.140133,
        equal: 0.1,
        delta: 0.040133,
        stability: 0.995
      },
      {
        rank: 4,
        name: "Dedicated manager resource hub",
        weight: 0.09982,
        equal: 0.1,
        delta: -0.00018,
        stability: 0.995
      },
      {
        rank: 5,
        name: "Manager evaluations include how well they support impacted employees",
        weight: 0.080495,
        equal: 0.1,
        delta: -0.019505,
        stability: 0.965
      },
      {
        rank: 6,
        name: "Clear escalation protocol for manager response",
        weight: 0.077347,
        equal: 0.1,
        delta: -0.022653,
        stability: 0.975
      },
      {
        rank: 7,
        name: "Legal compliance training",
        weight: 0.071002,
        equal: 0.1,
        delta: -0.028998,
        stability: 0.97
      },
      {
        rank: 8,
        name: "AI-powered guidance tools",
        weight: 0.069294,
        equal: 0.1,
        delta: -0.030706,
        stability: 0.97
      },
      {
        rank: 9,
        name: "Privacy protection and confidentiality management",
        weight: 0.067211,
        equal: 0.1,
        delta: -0.032789,
        stability: 0.98
      },
      {
        rank: 10,
        name: "Senior leader coaching on supporting impacted employees",
        weight: 0.065389,
        equal: 0.1,
        delta: -0.034611,
        stability: 0.96
      }
    ]
  },
  4: {
    name: "Treatment & Navigation",
    weight: 14,
    elements: 10,
    cvR2: 0.419,
    alpha: 0.5,
    n: 40,
    topElements: [
      "Physical rehabilitation support",
      "Nutrition coaching",
      "Insurance advocacy/appeals support"
    ],
    items: [
      {
        rank: 1,
        name: "Physical rehabilitation support",
        weight: 0.200073,
        equal: 0.1,
        delta: 0.100073,
        stability: 1.0
      },
      {
        rank: 2,
        name: "Nutrition coaching",
        weight: 0.133196,
        equal: 0.1,
        delta: 0.033196,
        stability: 1.0
      },
      {
        rank: 3,
        name: "Insurance advocacy/appeals support",
        weight: 0.102184,
        equal: 0.1,
        delta: 0.002184,
        stability: 0.965
      },
      {
        rank: 4,
        name: "Dedicated navigation support to help employees understand benefits ...",
        weight: 0.089426,
        equal: 0.1,
        delta: -0.010574,
        stability: 0.975
      },
      {
        rank: 5,
        name: "Online tools, apps, or portals for health/benefits support",
        weight: 0.087604,
        equal: 0.1,
        delta: -0.012396,
        stability: 0.965
      },
      {
        rank: 6,
        name: "Occupational therapy/vocational rehabilitation",
        weight: 0.081315,
        equal: 0.1,
        delta: -0.018685,
        stability: 0.945
      },
      {
        rank: 7,
        name: "Care coordination concierge",
        weight: 0.078595,
        equal: 0.1,
        delta: -0.021405,
        stability: 0.95
      },
      {
        rank: 8,
        name: "Survivorship planning assistance",
        weight: 0.07731,
        equal: 0.1,
        delta: -0.02269,
        stability: 0.94
      },
      {
        rank: 9,
        name: "Benefits optimization assistance (maximizing coverage, minimizing c...",
        weight: 0.076675,
        equal: 0.1,
        delta: -0.023325,
        stability: 0.945
      },
      {
        rank: 10,
        name: "Clinical trial matching service",
        weight: 0.073622,
        equal: 0.1,
        delta: -0.026378,
        stability: 0.955
      }
    ]
  },
  5: {
    name: "Workplace Accommodations",
    weight: 7,
    elements: 11,
    cvR2: 0.412,
    alpha: 0.5,
    n: 39,
    topElements: [
      "Flexible scheduling options",
      "Ergonomic equipment funding",
      "Rest areas / quiet spaces"
    ],
    items: [
      {
        rank: 1,
        name: "Flexible scheduling options",
        weight: 0.134067,
        equal: 0.090909,
        delta: 0.043158,
        stability: 0.98
      },
      {
        rank: 2,
        name: "Ergonomic equipment funding",
        weight: 0.126183,
        equal: 0.090909,
        delta: 0.035274,
        stability: 1.0
      },
      {
        rank: 3,
        name: "Rest areas / quiet spaces",
        weight: 0.115475,
        equal: 0.090909,
        delta: 0.024566,
        stability: 0.995
      },
      {
        rank: 4,
        name: "Temporary role redesigns",
        weight: 0.109129,
        equal: 0.090909,
        delta: 0.01822,
        stability: 0.99
      },
      {
        rank: 5,
        name: "Assistive technology catalog",
        weight: 0.108836,
        equal: 0.090909,
        delta: 0.017927,
        stability: 0.99
      },
      {
        rank: 6,
        name: "Priority parking",
        weight: 0.079852,
        equal: 0.090909,
        delta: -0.011057,
        stability: 0.975
      },
      {
        rank: 7,
        name: "Cognitive / fatigue support tools",
        weight: 0.074978,
        equal: 0.090909,
        delta: -0.015931,
        stability: 0.99
      },
      {
        rank: 8,
        name: "Policy accommodations (e.g., dress code flexibility, headphone use)",
        weight: 0.070501,
        equal: 0.090909,
        delta: -0.020408,
        stability: 0.98
      },
      {
        rank: 9,
        name: "Remote work capability",
        weight: 0.064075,
        equal: 0.090909,
        delta: -0.026834,
        stability: 0.98
      },
      {
        rank: 10,
        name: "Transportation reimbursement",
        weight: 0.059231,
        equal: 0.090909,
        delta: -0.031678,
        stability: 0.965
      },
      {
        rank: 11,
        name: "Physical workspace modifications",
        weight: 0.057672,
        equal: 0.090909,
        delta: -0.033237,
        stability: 0.96
      }
    ]
  },
  6: {
    name: "Culture & Stigma",
    weight: 8,
    elements: 12,
    cvR2: 0.361,
    alpha: 0.5,
    n: 38,
    topElements: [
      "Employee peer support groups",
      "Stigma-reduction initiatives",
      "Anonymous benefits navigation tool or website"
    ],
    items: [
      {
        rank: 1,
        name: "Employee peer support groups (internal employees with shared experi...",
        weight: 0.193109,
        equal: 0.083333,
        delta: 0.109775,
        stability: 1.0
      },
      {
        rank: 2,
        name: "Stigma-reduction initiatives",
        weight: 0.130256,
        equal: 0.083333,
        delta: 0.046922,
        stability: 0.99
      },
      {
        rank: 3,
        name: "Anonymous benefits navigation tool or website (no login required)",
        weight: 0.090308,
        equal: 0.083333,
        delta: 0.006975,
        stability: 0.995
      },
      {
        rank: 4,
        name: "Specialized emotional counseling",
        weight: 0.079909,
        equal: 0.083333,
        delta: -0.003424,
        stability: 0.965
      },
      {
        rank: 5,
        name: "Inclusive communication guidelines",
        weight: 0.071169,
        equal: 0.083333,
        delta: -0.012164,
        stability: 0.95
      },
      {
        rank: 6,
        name: "Manager training on handling sensitive health information",
        weight: 0.070972,
        equal: 0.083333,
        delta: -0.012361,
        stability: 0.975
      },
      {
        rank: 7,
        name: "Professional-led support groups (external facilitator/counselor)",
        weight: 0.066748,
        equal: 0.083333,
        delta: -0.016585,
        stability: 0.99
      },
      {
        rank: 8,
        name: "Written anti-retaliation policies for health disclosures",
        weight: 0.06513,
        equal: 0.083333,
        delta: -0.018204,
        stability: 0.975
      },
      {
        rank: 9,
        name: "Strong anti-discrimination policies specific to health conditions",
        weight: 0.063864,
        equal: 0.083333,
        delta: -0.01947,
        stability: 0.99
      },
      {
        rank: 10,
        name: "Clear process for confidential health disclosures",
        weight: 0.059082,
        equal: 0.083333,
        delta: -0.024251,
        stability: 0.985
      },
      {
        rank: 11,
        name: "Confidential HR channel for health benefits, policies and insurance...",
        weight: 0.057287,
        equal: 0.083333,
        delta: -0.026046,
        stability: 0.995
      },
      {
        rank: 12,
        name: "Optional open health dialogue forums",
        weight: 0.052165,
        equal: 0.083333,
        delta: -0.031168,
        stability: 0.96
      }
    ]
  },
  7: {
    name: "Career Continuity",
    weight: 4,
    elements: 9,
    cvR2: 0.33,
    alpha: 0.5,
    n: 34,
    topElements: [
      "Peer mentorship program",
      "Continued access to training/development",
      "Adjusted performance goals/deliverables during treatmen"
    ],
    items: [
      {
        rank: 1,
        name: "Peer mentorship program (employees who had similar condition mentor...",
        weight: 0.200033,
        equal: 0.111111,
        delta: 0.088922,
        stability: 0.99
      },
      {
        rank: 2,
        name: "Continued access to training/development",
        weight: 0.143486,
        equal: 0.111111,
        delta: 0.032374,
        stability: 0.995
      },
      {
        rank: 3,
        name: "Adjusted performance goals/deliverables during treatment and recovery",
        weight: 0.10585,
        equal: 0.111111,
        delta: -0.005261,
        stability: 0.985
      },
      {
        rank: 4,
        name: "Succession planning protections",
        weight: 0.104257,
        equal: 0.111111,
        delta: -0.006854,
        stability: 0.995
      },
      {
        rank: 5,
        name: "Structured reintegration programs",
        weight: 0.101907,
        equal: 0.111111,
        delta: -0.009205,
        stability: 0.985
      },
      {
        rank: 6,
        name: "Optional stay-connected program",
        weight: 0.101429,
        equal: 0.111111,
        delta: -0.009682,
        stability: 0.975
      },
      {
        rank: 7,
        name: "Career coaching for employees managing cancer or other serious heal...",
        weight: 0.084242,
        equal: 0.111111,
        delta: -0.026869,
        stability: 0.98
      },
      {
        rank: 8,
        name: "Professional coach/mentor for employees managing cancer or other se...",
        weight: 0.081518,
        equal: 0.111111,
        delta: -0.029594,
        stability: 0.965
      },
      {
        rank: 9,
        name: "Project continuity protocols",
        weight: 0.07728,
        equal: 0.111111,
        delta: -0.033831,
        stability: 0.965
      }
    ]
  },
  8: {
    name: "Treatment Support & Reintegration",
    weight: 13,
    elements: 12,
    cvR2: 0.53,
    alpha: 0.5,
    n: 38,
    topElements: [
      "Flexibility for medical setbacks",
      "Manager training on supporting team members during trea",
      "Long-term success tracking"
    ],
    items: [
      {
        rank: 1,
        name: "Flexibility for medical setbacks",
        weight: 0.154687,
        equal: 0.083333,
        delta: 0.071354,
        stability: 0.995
      },
      {
        rank: 2,
        name: "Manager training on supporting team members during treatment/return",
        weight: 0.124079,
        equal: 0.083333,
        delta: 0.040746,
        stability: 1.0
      },
      {
        rank: 3,
        name: "Long-term success tracking",
        weight: 0.102334,
        equal: 0.083333,
        delta: 0.019,
        stability: 1.0
      },
      {
        rank: 4,
        name: "Workload adjustments during treatment",
        weight: 0.089721,
        equal: 0.083333,
        delta: 0.006388,
        stability: 0.99
      },
      {
        rank: 5,
        name: "Access to occupational therapy/vocational rehabilitation",
        weight: 0.081946,
        equal: 0.083333,
        delta: -0.001388,
        stability: 1.0
      },
      {
        rank: 6,
        name: "Structured progress reviews",
        weight: 0.072191,
        equal: 0.083333,
        delta: -0.011142,
        stability: 0.96
      },
      {
        rank: 7,
        name: "Buddy/mentor pairing for support",
        weight: 0.069346,
        equal: 0.083333,
        delta: -0.013988,
        stability: 0.975
      },
      {
        rank: 8,
        name: "Flexible work arrangements during treatment",
        weight: 0.068431,
        equal: 0.083333,
        delta: -0.014902,
        stability: 0.98
      },
      {
        rank: 9,
        name: "Online peer support forums",
        weight: 0.068325,
        equal: 0.083333,
        delta: -0.015008,
        stability: 0.995
      },
      {
        rank: 10,
        name: "Phased return-to-work plans",
        weight: 0.05902,
        equal: 0.083333,
        delta: -0.024314,
        stability: 0.965
      },
      {
        rank: 11,
        name: "Contingency planning for treatment schedules",
        weight: 0.056143,
        equal: 0.083333,
        delta: -0.02719,
        stability: 0.975
      },
      {
        rank: 12,
        name: "Access to specialized work resumption professionals",
        weight: 0.053777,
        equal: 0.083333,
        delta: -0.029556,
        stability: 0.965
      }
    ]
  },
  9: {
    name: "Leadership & Accountability",
    weight: 4,
    elements: 12,
    cvR2: 0.136,
    alpha: 0.5,
    n: 34,
    topElements: [
      "Executive sponsors communicate regularly about workplac",
      "ESG/CSR reporting inclusion",
      "Public success story celebrations"
    ],
    items: [
      {
        rank: 1,
        name: "Executive sponsors communicate regularly about workplace support pr...",
        weight: 0.177838,
        equal: 0.083333,
        delta: 0.094505,
        stability: 1.0
      },
      {
        rank: 2,
        name: "ESG/CSR reporting inclusion",
        weight: 0.122962,
        equal: 0.083333,
        delta: 0.039629,
        stability: 0.99
      },
      {
        rank: 3,
        name: "Public success story celebrations",
        weight: 0.101589,
        equal: 0.083333,
        delta: 0.018256,
        stability: 0.995
      },
      {
        rank: 4,
        name: "Executive-led town halls focused on health benefits and employee su...",
        weight: 0.078106,
        equal: 0.083333,
        delta: -0.005227,
        stability: 0.985
      },
      {
        rank: 5,
        name: "Year-over-year budget growth",
        weight: 0.077801,
        equal: 0.083333,
        delta: -0.005532,
        stability: 0.975
      },
      {
        rank: 6,
        name: "Support programs included in investor/stakeholder communications",
        weight: 0.076953,
        equal: 0.083333,
        delta: -0.00638,
        stability: 0.965
      },
      {
        rank: 7,
        name: "Compensation tied to support outcomes",
        weight: 0.067727,
        equal: 0.083333,
        delta: -0.015606,
        stability: 0.99
      },
      {
        rank: 8,
        name: "C-suite executive serves as program champion/sponsor",
        weight: 0.063951,
        equal: 0.083333,
        delta: -0.019383,
        stability: 0.99
      },
      {
        rank: 9,
        name: "Cross-functional executive steering committee for workplace support...",
        weight: 0.060213,
        equal: 0.083333,
        delta: -0.023121,
        stability: 0.955
      },
      {
        rank: 10,
        name: "Support metrics included in annual report/sustainability reporting",
        weight: 0.058149,
        equal: 0.083333,
        delta: -0.025185,
        stability: 0.98
      },
      {
        rank: 11,
        name: "Executive accountability metrics",
        weight: 0.05755,
        equal: 0.083333,
        delta: -0.025784,
        stability: 0.97
      },
      {
        rank: 12,
        name: "Dedicated budget allocation for serious illness support programs",
        weight: 0.057162,
        equal: 0.083333,
        delta: -0.026172,
        stability: 0.985
      }
    ]
  },
  10: {
    name: "Caregiver Support",
    weight: 4,
    elements: 20,
    cvR2: -0.063,
    alpha: 0.3,
    n: 40,
    topElements: [
      "Practical support for managing caregiving and work",
      "Family navigation support",
      "Eldercare consultation and referral services"
    ],
    items: [
      {
        rank: 1,
        name: "Practical support for managing caregiving and work",
        weight: 0.114708,
        equal: 0.05,
        delta: 0.064708,
        stability: 0.995
      },
      {
        rank: 2,
        name: "Family navigation support",
        weight: 0.080451,
        equal: 0.05,
        delta: 0.030451,
        stability: 0.995
      },
      {
        rank: 3,
        name: "Eldercare consultation and referral services",
        weight: 0.080031,
        equal: 0.05,
        delta: 0.030031,
        stability: 0.99
      },
      {
        rank: 4,
        name: "Expanded caregiver leave eligibility beyond legal definitions (e.g....",
        weight: 0.057402,
        equal: 0.05,
        delta: 0.007402,
        stability: 1.0
      },
      {
        rank: 5,
        name: "Caregiver resource navigator/concierge",
        weight: 0.052119,
        equal: 0.05,
        delta: 0.002119,
        stability: 0.99
      },
      {
        rank: 6,
        name: "Concierge services to coordinate caregiving logistics (e.g., schedu...",
        weight: 0.048148,
        equal: 0.05,
        delta: -0.001852,
        stability: 0.975
      },
      {
        rank: 7,
        name: "Paid caregiver leave with expanded eligibility (beyond local legal ...",
        weight: 0.046638,
        equal: 0.05,
        delta: -0.003362,
        stability: 0.97
      },
      {
        rank: 8,
        name: "Flexible work arrangements for caregivers",
        weight: 0.045747,
        equal: 0.05,
        delta: -0.004253,
        stability: 0.975
      },
      {
        rank: 9,
        name: "Paid time off for care coordination appointments",
        weight: 0.043873,
        equal: 0.05,
        delta: -0.006127,
        stability: 0.99
      },
      {
        rank: 10,
        name: "Respite care funding/reimbursement",
        weight: 0.04304,
        equal: 0.05,
        delta: -0.00696,
        stability: 0.98
      },
      {
        rank: 11,
        name: "Emergency dependent care when regular arrangements unavailable",
        weight: 0.042999,
        equal: 0.05,
        delta: -0.007001,
        stability: 0.965
      },
      {
        rank: 12,
        name: "Unpaid leave job protection beyond local / legal requirements",
        weight: 0.042978,
        equal: 0.05,
        delta: -0.007022,
        stability: 0.985
      },
      {
        rank: 13,
        name: "Legal/financial planning assistance for caregivers",
        weight: 0.041332,
        equal: 0.05,
        delta: -0.008668,
        stability: 1.0
      },
      {
        rank: 14,
        name: "Mental health support specifically for caregivers",
        weight: 0.04129,
        equal: 0.05,
        delta: -0.00871,
        stability: 0.97
      },
      {
        rank: 15,
        name: "Manager training for supervising caregivers",
        weight: 0.039363,
        equal: 0.05,
        delta: -0.010637,
        stability: 0.975
      },
      {
        rank: 16,
        name: "Dependent care account matching/contributions",
        weight: 0.038215,
        equal: 0.05,
        delta: -0.011785,
        stability: 0.985
      },
      {
        rank: 17,
        name: "Caregiver peer support groups",
        weight: 0.03714,
        equal: 0.05,
        delta: -0.01286,
        stability: 0.99
      },
      {
        rank: 18,
        name: "Dependent care subsidies",
        weight: 0.034974,
        equal: 0.05,
        delta: -0.015026,
        stability: 0.975
      },
      {
        rank: 19,
        name: "Emergency caregiver funds",
        weight: 0.034931,
        equal: 0.05,
        delta: -0.015069,
        stability: 0.99
      },
      {
        rank: 20,
        name: "Modified job duties during peak caregiving periods",
        weight: 0.034619,
        equal: 0.05,
        delta: -0.015381,
        stability: 0.96
      }
    ]
  },
  11: {
    name: "Prevention & Early Detection",
    weight: 3,
    elements: 13,
    cvR2: 0.473,
    alpha: 0.5,
    n: 40,
    topElements: [
      "Legal protections beyond requirements",
      "Individual health assessments",
      "Policies to support immuno-compromised colleagues"
    ],
    items: [
      {
        rank: 1,
        name: "Legal protections beyond requirements",
        weight: 0.1154,
        equal: 0.076923,
        delta: 0.038477,
        stability: 1.0
      },
      {
        rank: 2,
        name: "Individual health assessments (online or in-person)",
        weight: 0.112016,
        equal: 0.076923,
        delta: 0.035093,
        stability: 0.995
      },
      {
        rank: 3,
        name: "Policies to support immuno-compromised colleagues (e.g., mask proto...",
        weight: 0.104588,
        equal: 0.076923,
        delta: 0.027665,
        stability: 1.0
      },
      {
        rank: 4,
        name: "Genetic screening/counseling",
        weight: 0.096957,
        equal: 0.076923,
        delta: 0.020034,
        stability: 0.995
      },
      {
        rank: 5,
        name: "At least 70% coverage for regionally / locally recommended screenings",
        weight: 0.072063,
        equal: 0.076923,
        delta: -0.00486,
        stability: 0.995
      },
      {
        rank: 6,
        name: "Full or partial coverage for annual health screenings/checkups",
        weight: 0.070034,
        equal: 0.076923,
        delta: -0.006889,
        stability: 1.0
      },
      {
        rank: 7,
        name: "On-site vaccinations",
        weight: 0.069652,
        equal: 0.076923,
        delta: -0.007271,
        stability: 0.99
      },
      {
        rank: 8,
        name: "Risk factor tracking/reporting",
        weight: 0.06601,
        equal: 0.076923,
        delta: -0.010913,
        stability: 0.995
      },
      {
        rank: 9,
        name: "Regular health education sessions",
        weight: 0.063478,
        equal: 0.076923,
        delta: -0.013445,
        stability: 0.985
      },
      {
        rank: 10,
        name: "Targeted risk-reduction programs",
        weight: 0.061622,
        equal: 0.076923,
        delta: -0.015301,
        stability: 0.99
      },
      {
        rank: 11,
        name: "Paid time off for preventive care appointments",
        weight: 0.061405,
        equal: 0.076923,
        delta: -0.015518,
        stability: 1.0
      },
      {
        rank: 12,
        name: "Workplace safety assessments to minimize health risks",
        weight: 0.054855,
        equal: 0.076923,
        delta: -0.022068,
        stability: 0.98
      },
      {
        rank: 13,
        name: "Lifestyle coaching programs",
        weight: 0.05192,
        equal: 0.076923,
        delta: -0.025003,
        stability: 0.965
      }
    ]
  },
  12: {
    name: "Measurement & Outcomes",
    weight: 3,
    elements: 9,
    cvR2: 0.12,
    alpha: 0.5,
    n: 40,
    topElements: [
      "Regular program enhancements",
      "Employee confidence in employer support",
      "Innovation pilots"
    ],
    items: [
      {
        rank: 1,
        name: "Regular program enhancements",
        weight: 0.200034,
        equal: 0.111111,
        delta: 0.088923,
        stability: 0.985
      },
      {
        rank: 2,
        name: "Employee confidence in employer support",
        weight: 0.145168,
        equal: 0.111111,
        delta: 0.034057,
        stability: 0.99
      },
      {
        rank: 3,
        name: "Innovation pilots",
        weight: 0.111299,
        equal: 0.111111,
        delta: 0.000188,
        stability: 0.995
      },
      {
        rank: 4,
        name: "External benchmarking",
        weight: 0.111196,
        equal: 0.111111,
        delta: 8.5e-05,
        stability: 0.98
      },
      {
        rank: 5,
        name: "Return-to-work success metrics",
        weight: 0.101878,
        equal: 0.111111,
        delta: -0.009233,
        stability: 0.975
      },
      {
        rank: 6,
        name: "Program utilization analytics",
        weight: 0.100793,
        equal: 0.111111,
        delta: -0.010318,
        stability: 0.98
      },
      {
        rank: 7,
        name: "Measure screening campaign ROI (e.g. participation rates, inquiries...",
        weight: 0.077227,
        equal: 0.111111,
        delta: -0.033884,
        stability: 0.945
      },
      {
        rank: 8,
        name: "Business impact/ROI assessment",
        weight: 0.076737,
        equal: 0.111111,
        delta: -0.034374,
        stability: 0.96
      },
      {
        rank: 9,
        name: "Employee satisfaction tracking",
        weight: 0.075667,
        equal: 0.111111,
        delta: -0.035444,
        stability: 0.955
      }
    ]
  },
  13: {
    name: "Communication & Awareness",
    weight: 10,
    elements: 11,
    cvR2: 0.642,
    alpha: 0.5,
    n: 40,
    topElements: [
      "Family/caregiver communication inclusion",
      "Employee testimonials/success stories",
      "Proactive communication at point of diagnosis disclosur"
    ],
    items: [
      {
        rank: 1,
        name: "Family/caregiver communication inclusion",
        weight: 0.176781,
        equal: 0.090909,
        delta: 0.085872,
        stability: 1.0
      },
      {
        rank: 2,
        name: "Employee testimonials/success stories",
        weight: 0.120722,
        equal: 0.090909,
        delta: 0.029813,
        stability: 1.0
      },
      {
        rank: 3,
        name: "Proactive communication at point of diagnosis disclosure",
        weight: 0.114617,
        equal: 0.090909,
        delta: 0.023708,
        stability: 1.0
      },
      {
        rank: 4,
        name: "Anonymous information access options",
        weight: 0.107793,
        equal: 0.090909,
        delta: 0.016884,
        stability: 0.995
      },
      {
        rank: 5,
        name: "Multi-channel communication strategy",
        weight: 0.104833,
        equal: 0.090909,
        delta: 0.013924,
        stability: 0.985
      },
      {
        rank: 6,
        name: "Ability to access program information and resources anonymously",
        weight: 0.07692,
        equal: 0.090909,
        delta: -0.013989,
        stability: 0.99
      },
      {
        rank: 7,
        name: "Dedicated program website or portal",
        weight: 0.072307,
        equal: 0.090909,
        delta: -0.018602,
        stability: 0.985
      },
      {
        rank: 8,
        name: "New hire orientation coverage",
        weight: 0.058091,
        equal: 0.090909,
        delta: -0.032818,
        stability: 0.98
      },
      {
        rank: 9,
        name: "Regular company-wide awareness campaigns (at least quarterly)",
        weight: 0.056844,
        equal: 0.090909,
        delta: -0.034065,
        stability: 0.945
      },
      {
        rank: 10,
        name: "Manager toolkit for cascade communications",
        weight: 0.056627,
        equal: 0.090909,
        delta: -0.034282,
        stability: 0.97
      },
      {
        rank: 11,
        name: "Cancer awareness month campaigns with resources",
        weight: 0.054464,
        equal: 0.090909,
        delta: -0.036445,
        stability: 0.965
      }
    ]
  }
};

// ============================================
// SCORE COMPARISON DATA
// ============================================

const COMPANIES = [
  'Best Buy', 'Publicis', 'Google', 'Pfizer', 'Schneider Electric',
  'Ultragenyx', 'The Hartford', 'AARP', 'Ford Otosan', "L'Oréal", 'Inspire Brands'
];

type ScoreEntry = { eqC: number; wtC: number; dims: Record<number, { eq: number; wt: number }> };

const SCORES: Record<string, ScoreEntry> = {
  Benchmark: { eqC: 49, wtC: 50, dims: { 1: { eq: 48, wt: 51 }, 2: { eq: 42, wt: 40 }, 3: { eq: 50, wt: 51 }, 4: { eq: 46, wt: 47 }, 5: { eq: 65, wt: 69 }, 6: { eq: 50, wt: 52 }, 7: { eq: 41, wt: 43 }, 8: { eq: 55, wt: 52 }, 9: { eq: 38, wt: 40 }, 10: { eq: 31, wt: 28 }, 11: { eq: 48, wt: 47 }, 12: { eq: 38, wt: 38 }, 13: { eq: 43, wt: 45 } } },
  'Best Buy': { eqC: 69, wtC: 72, dims: { 1: { eq: 90, wt: 93 }, 2: { eq: 53, wt: 57 }, 3: { eq: 100, wt: 100 }, 4: { eq: 100, wt: 100 }, 5: { eq: 100, wt: 100 }, 6: { eq: 100, wt: 100 }, 7: { eq: 100, wt: 100 }, 8: { eq: 100, wt: 100 }, 9: { eq: 50, wt: 54 }, 10: { eq: 33, wt: 28 }, 11: { eq: 38, wt: 38 }, 12: { eq: 44, wt: 45 }, 13: { eq: 50, wt: 50 } } },
  Publicis: { eqC: 61, wtC: 63, dims: { 1: { eq: 87, wt: 90 }, 2: { eq: 82, wt: 86 }, 3: { eq: 80, wt: 83 }, 4: { eq: 26, wt: 28 }, 5: { eq: 73, wt: 76 }, 6: { eq: 100, wt: 100 }, 7: { eq: 56, wt: 58 }, 8: { eq: 67, wt: 67 }, 9: { eq: 67, wt: 72 }, 10: { eq: 22, wt: 19 }, 11: { eq: 46, wt: 44 }, 12: { eq: 22, wt: 18 }, 13: { eq: 70, wt: 73 } } },
  Google: { eqC: 56, wtC: 57, dims: { 1: { eq: 69, wt: 76 }, 2: { eq: 53, wt: 57 }, 3: { eq: 40, wt: 43 }, 4: { eq: 66, wt: 63 }, 5: { eq: 91, wt: 92 }, 6: { eq: 50, wt: 54 }, 7: { eq: 56, wt: 56 }, 8: { eq: 67, wt: 64 }, 9: { eq: 83, wt: 86 }, 10: { eq: 26, wt: 22 }, 11: { eq: 54, wt: 52 }, 12: { eq: 33, wt: 34 }, 13: { eq: 60, wt: 60 } } },
  Pfizer: { eqC: 63, wtC: 65, dims: { 1: { eq: 62, wt: 62 }, 2: { eq: 59, wt: 66 }, 3: { eq: 80, wt: 76 }, 4: { eq: 100, wt: 100 }, 5: { eq: 91, wt: 91 }, 6: { eq: 83, wt: 85 }, 7: { eq: 89, wt: 91 }, 8: { eq: 87, wt: 88 }, 9: { eq: 50, wt: 51 }, 10: { eq: 29, wt: 26 }, 11: { eq: 77, wt: 78 }, 12: { eq: 44, wt: 46 }, 13: { eq: 60, wt: 63 } } },
  'Schneider Electric': { eqC: 51, wtC: 54, dims: { 1: { eq: 36, wt: 39 }, 2: { eq: 47, wt: 51 }, 3: { eq: 30, wt: 28 }, 4: { eq: 50, wt: 54 }, 5: { eq: 64, wt: 68 }, 6: { eq: 67, wt: 72 }, 7: { eq: 33, wt: 35 }, 8: { eq: 73, wt: 74 }, 9: { eq: 58, wt: 62 }, 10: { eq: 49, wt: 49 }, 11: { eq: 77, wt: 77 }, 12: { eq: 44, wt: 48 }, 13: { eq: 50, wt: 52 } } },
  Ultragenyx: { eqC: 52, wtC: 53, dims: { 1: { eq: 64, wt: 72 }, 2: { eq: 59, wt: 60 }, 3: { eq: 50, wt: 54 }, 4: { eq: 42, wt: 44 }, 5: { eq: 82, wt: 81 }, 6: { eq: 33, wt: 35 }, 7: { eq: 44, wt: 48 }, 8: { eq: 60, wt: 59 }, 9: { eq: 33, wt: 36 }, 10: { eq: 38, wt: 36 }, 11: { eq: 62, wt: 62 }, 12: { eq: 56, wt: 56 }, 13: { eq: 60, wt: 61 } } },
  'The Hartford': { eqC: 47, wtC: 48, dims: { 1: { eq: 54, wt: 57 }, 2: { eq: 35, wt: 31 }, 3: { eq: 40, wt: 37 }, 4: { eq: 50, wt: 52 }, 5: { eq: 36, wt: 41 }, 6: { eq: 42, wt: 44 }, 7: { eq: 44, wt: 46 }, 8: { eq: 47, wt: 45 }, 9: { eq: 42, wt: 44 }, 10: { eq: 34, wt: 32 }, 11: { eq: 38, wt: 37 }, 12: { eq: 33, wt: 34 }, 13: { eq: 40, wt: 42 } } },
  AARP: { eqC: 38, wtC: 36, dims: { 1: { eq: 62, wt: 64 }, 2: { eq: 6, wt: 4 }, 3: { eq: 60, wt: 57 }, 4: { eq: 34, wt: 30 }, 5: { eq: 55, wt: 57 }, 6: { eq: 58, wt: 56 }, 7: { eq: 22, wt: 18 }, 8: { eq: 33, wt: 29 }, 9: { eq: 0, wt: 0 }, 10: { eq: 32, wt: 28 }, 11: { eq: 31, wt: 28 }, 12: { eq: 33, wt: 34 }, 13: { eq: 30, wt: 28 } } },
  'Ford Otosan': { eqC: 55, wtC: 56, dims: { 1: { eq: 67, wt: 73 }, 2: { eq: 60, wt: 58 }, 3: { eq: 40, wt: 43 }, 4: { eq: 22, wt: 23 }, 5: { eq: 76, wt: 78 }, 6: { eq: 33, wt: 35 }, 7: { eq: 68, wt: 69 }, 8: { eq: 73, wt: 73 }, 9: { eq: 80, wt: 84 }, 10: { eq: 51, wt: 48 }, 11: { eq: 85, wt: 83 }, 12: { eq: 58, wt: 54 }, 13: { eq: 66, wt: 66 } } },
  "L'Oréal": { eqC: 47, wtC: 47, dims: { 1: { eq: 36, wt: 37 }, 2: { eq: 6, wt: 4 }, 3: { eq: 100, wt: 100 }, 4: { eq: 10, wt: 9 }, 5: { eq: 27, wt: 37 }, 6: { eq: 100, wt: 100 }, 7: { eq: 51, wt: 51 }, 8: { eq: 87, wt: 82 }, 9: { eq: 27, wt: 32 }, 10: { eq: 26, wt: 22 }, 11: { eq: 38, wt: 35 }, 12: { eq: 20, wt: 18 }, 13: { eq: 33, wt: 37 } } },
  'Inspire Brands': { eqC: 26, wtC: 24, dims: { 1: { eq: 33, wt: 35 }, 2: { eq: 35, wt: 34 }, 3: { eq: 10, wt: 7 }, 4: { eq: 50, wt: 48 }, 5: { eq: 64, wt: 68 }, 6: { eq: 17, wt: 13 }, 7: { eq: 0, wt: 0 }, 8: { eq: 25, wt: 19 }, 9: { eq: 8, wt: 5 }, 10: { eq: 20, wt: 16 }, 11: { eq: 31, wt: 19 }, 12: { eq: 22, wt: 23 }, 13: { eq: 0, wt: 0 } } }
};

// ============================================
// HELPERS
// ============================================

function getSig(c: number): { label: string; color: string; bg: string; border: string } {
  if (c < 0) return { label: 'Emerging', color: '#B45309', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (c < 0.10) return { label: 'Developing', color: '#4338CA', bg: 'bg-indigo-50', border: 'border-indigo-200' };
  if (c < 0.30) return { label: 'Moderate', color: '#0369A1', bg: 'bg-sky-50', border: 'border-sky-200' };
  return { label: 'Strong', color: '#047857', bg: 'bg-emerald-50', border: 'border-emerald-200' };
}

function stabColor(s: number): string {
  if (s >= 0.99) return '#047857';
  if (s >= 0.97) return '#059669';
  if (s >= 0.95) return '#10B981';
  return '#6B7280';
}

// ============================================
// PAGE COMPONENT
// ============================================

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
            {([
              { key: 'overview' as const, label: 'Executive Overview' },
              { key: 'statistical' as const, label: 'Statistical Overview' },
              { key: 'weights' as const, label: 'Element Weights' },
              { key: 'scoring' as const, label: 'Score Comparison' },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-slate-800 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`mx-auto py-8 ${activeTab === 'scoring' ? 'max-w-none px-4' : 'max-w-5xl px-8'}`}>

        {/* ============================================================== */}
        {/* TAB 1: EXECUTIVE OVERVIEW                                       */}
        {/* Content sourced from Element_Weighting_Executive_Overview_v6_1   */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Page Title */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Why Weight Support Elements?</h2>
              <p className="text-slate-500 text-sm">A data-driven calibration of the Cancer and Careers assessment framework</p>
            </div>

            {/* ---- The Question ---- */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">The Question</h3>
              </div>
              <div className="px-8 py-6 text-slate-600 leading-relaxed space-y-4">
                <p>
                  The Index assesses workplace cancer support across 13 dimensions, with each dimension containing between 9 and 20 individual support elements. In the first version of the scoring, every element within a dimension counted equally. Offering a clinical trial matching service counted the same as offering an employee assistance program.
                </p>
                <p>
                  That is a reasonable starting point, but it does not reflect reality. Some elements are table-stakes practices that most organizations already provide. Others are rarer commitments that distinguish genuinely mature programs from the rest. The question is whether the scoring should reflect that distinction.
                </p>
              </div>
            </section>

            {/* ---- Our Answer ---- */}
            <section className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="px-8 py-6">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Our Answer</p>
                <p className="text-white text-lg leading-relaxed">
                  <strong>Yes, but carefully.</strong> We adjusted element weights within each dimension so that programs which more consistently distinguish stronger overall performers receive modestly higher weight. We did this using the data itself, not subjective judgment, and we blended the results back toward equal weighting to ensure the adjustment <em className="text-slate-300">calibrates</em> the scoring rather than rewrites it.
                </p>
              </div>
              <div className="px-8 py-4 bg-slate-900/50 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  The Cancer and Careers framework remains intact. The 13 dimensions, their relative weights, and the response scale are all unchanged. Element weighting adjusts only how much each item contributes within its own dimension.
                </p>
              </div>
            </section>

            {/* ---- How We Did It (8 Steps) ---- */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">How We Did It</h3>
                <p className="text-sm text-slate-500 mt-0.5">A transparent, reproducible process designed to withstand peer review</p>
              </div>
              <div className="px-8 py-6">
                <div className="space-y-6">
                  {[
                    {
                      n: 1,
                      t: 'Preserved the full response scale',
                      d: 'Each element is scored on four levels: Currently Offer, Planning, Assessing, and Not Offered. Collapsing this to a binary would discard the progression signal the survey was designed to capture.'
                    },
                    {
                      n: 2,
                      t: 'Used only clean data',
                      d: 'If a company reported "Unsure" on a significant proportion of elements in a dimension, that company was excluded from weight estimation for that dimension. This prevents the analysis from learning patterns in incomplete data. Those companies still receive scored reports using the final weights.'
                    },
                    {
                      n: 3,
                      t: 'Built a model that predicts overall program strength',
                      d: 'For each dimension, we asked: which elements in this dimension best predict a company\u2019s composite score across all the other 12 dimensions? Elements that predict overall strength are the true differentiators. They signal depth and maturity that extends beyond a single area.'
                    },
                    {
                      n: 4,
                      t: 'Avoided circularity by design',
                      d: 'We deliberately did not predict the dimension\u2019s own score. If we had, the model would reward elements simply for being part of the formula, not for predicting anything meaningful. By looking outward to the composite, an element earns higher weight only if companies that score well on it also tend to score well everywhere else.'
                    },
                    {
                      n: 5,
                      t: 'Measured each element\u2019s contribution by disruption',
                      d: 'If we temporarily scramble an element\u2019s data across companies, how much does the model\u2019s ability to predict composite strength decline? Elements that cause a larger decline when scrambled are stronger differentiators. This approach produces importance scores that are always positive and intuitive to interpret.'
                    },
                    {
                      n: 6,
                      t: 'Tested stability through resampling',
                      d: 'The analysis was repeated 200 times on different random samples of companies. Elements that consistently appeared as important across all samples received their full weight. Elements whose importance fluctuated were dampened proportionally. This protects against any single company driving an element\u2019s weight.'
                    },
                    {
                      n: 7,
                      t: 'Blended the results back toward equal weights',
                      d: 'The final weight for each element is a blend of what the data suggests and what equal weighting would produce. This ensures that even where the empirical signal is strong, the expert framework still anchors the result. As participation grows in future years, the empirical share can increase.'
                    },
                    {
                      n: 8,
                      t: 'Capped the maximum weight',
                      d: 'No single element can exceed 20% of its dimension\u2019s total weight, regardless of what the data suggests. Any excess is redistributed proportionally among the other elements. This prevents any one program from dominating a dimension\u2019s score.'
                    }
                  ].map((step) => (
                    <div key={step.n} className="flex gap-5">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-sm font-semibold flex items-center justify-center mt-0.5">
                        {step.n}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{step.t}</p>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{step.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ---- What the Calibration Produces ---- */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">What the Calibration Produces</h3>
                <p className="text-sm text-slate-500 mt-0.5">The adjustment is deliberately modest</p>
              </div>
              <div className="px-8 py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  {[
                    { v: '1\u20133 pts', l: 'Composite score shifts', d: 'Most companies move by fewer than 3 points.' },
                    { v: '2\u20133\u00d7', l: 'Weight spread', d: 'Highest-weighted element is typically 2\u20133\u00d7 the lowest. Meaningful differentiation, but no element dominates.' },
                    { v: 'Preserved', l: 'Rankings', d: 'Rankings are largely preserved. Where reordering occurs, it is among companies with similar scores.' },
                    { v: '3 elements', l: '20% cap hit', d: 'The data would have given them even higher weight. The cap redistributes that excess to maintain balance.' }
                  ].map((m, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-2xl font-bold text-slate-700">{m.v}</p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{m.l}</p>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{m.d}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-slate-300 text-sm text-center">This is the expected behavior of a well-calibrated adjustment: <span className="text-white font-medium">meaningful differentiation without disruption.</span> The assessment framework remains the foundation. The weighting rewards genuine program depth.</p>
                </div>
              </div>
            </section>

            {/* ---- How the Blend Adapts ---- */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">How the Blend Adapts</h3>
              </div>
              <div className="px-8 py-6 text-slate-600 leading-relaxed space-y-4">
                <p>
                  The blend between data-driven weights and equal weights adapts by dimension based on the strength of the empirical signal. In dimensions where the data clearly identifies which elements differentiate stronger programs, the blend leans more toward the empirical finding. Where the signal is emerging, the blend anchors more heavily toward the expert framework.
                </p>
                <p>
                  This is a Year 1 calibration. The adaptive blend is conservative by design. As participation grows, the empirical signal strengthens across all dimensions, and the blend can shift further toward data-driven weights. The bootstrapping and stability testing described in Step 6 ensure that the blend is appropriate for the current level of evidence in each dimension.
                </p>
                <p>
                  No dimension is excluded. The same methodology is applied across all 13 dimensions, with the blend adapting to the strength of evidence in each dimension.
                </p>
              </div>
            </section>

            {/* ---- Top Differentiating Elements ---- */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Top Differentiating Elements by Dimension</h3>
                <p className="text-sm text-slate-500 mt-0.5">Programs that most consistently predict stronger overall performance across the Index</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-medium w-52">Dimension</th>
                      <th className="px-4 py-3 text-left font-medium">Top Element</th>
                      <th className="px-4 py-3 text-left font-medium">Second</th>
                      <th className="px-4 py-3 text-left font-medium">Third</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DIMENSION_ORDER.map((d, i) => {
                      const dim = DIMENSIONS[d];
                      return (
                        <tr key={d} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-6 py-3">
                            <span className="text-xs text-slate-400 font-medium">D{d}</span>
                            <span className="ml-2 text-slate-700 font-medium">{dim.name}</span>
                          </td>
                          {dim.items.slice(0, 3).map((item, j) => (
                            <td key={j} className="px-4 py-3 text-slate-600">
                              <span>{item.name.length > 45 ? item.name.slice(0, 42) + '...' : item.name}</span>
                              <span className="ml-1.5 text-xs text-slate-400">{(item.weight * 100).toFixed(1)}%</span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-600">Important:</strong> These are illustrative of the calibration, not the full picture. Every element in every dimension contributes to the score. Lower-weighted elements still matter. A dimension score reflects the complete set of programs, not just the top three.
                </p>
                <p className="text-xs text-slate-500">
                  The elements that receive higher weight are not necessarily the most commonly offered. In fact, rarer commitments tend to be stronger differentiators because they signal a deeper level of organizational investment. Conversely, table-stakes programs that most organizations already offer tend to receive lower weight because they do not help distinguish between companies.
                </p>
              </div>
            </section>

            {/* ---- What We Chose Not to Do ---- */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">What We Chose Not to Do</h3>
                <p className="text-sm text-slate-500 mt-0.5">Several simpler approaches were considered and rejected</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-medium w-56">Alternative</th>
                      <th className="px-6 py-3 text-left font-medium">Why We Moved On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ['Expert judgment weighting', 'Subjective and difficult to defend. Different experts produce different weights, with no way to adjudicate.'],
                      ['Simple yes/no encoding', 'Discards the distinction between Assessing, Planning, and Currently Offer. The full response scale captures progression that a binary cannot.'],
                      ['Raw model outputs as weights', 'Some outputs are negative due to overlapping elements. We used permutation importance, which produces only positive weights.'],
                      ['Treating co-occurring elements independently', 'If two programs tend to be offered together, a simple approach gives both full credit for what may be a shared underlying capability. Our approach distributes weight among related elements rather than double-counting.'],
                      ['Dropping low-stability elements', 'Hard cutoffs create cliff effects. Instead, we dampen unstable elements proportionally. Every element still contributes.']
                    ].map(([alt, why], i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-6 py-3 font-medium text-slate-700">{alt}</td>
                        <td className="px-6 py-3 text-slate-600">{why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ---- How This Evolves ---- */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">How This Evolves</h3>
              </div>
              <div className="px-8 py-6 text-slate-600 leading-relaxed space-y-4">
                <p>
                  This is a Year 1 calibration. The methodology is designed to scale naturally as participation grows. With more organizations completing the assessment each year, the empirical signal strengthens across all dimensions, the stability of element weights increases, and the blend can shift further toward data-driven weights with greater confidence.
                </p>
                <p>
                  Weights are recalibrated annually using the latest data and published alongside each Index release. This ensures the scoring evolves with the evidence base while maintaining full transparency for participating organizations and stakeholders.
                </p>
              </div>
              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-200">
                    {[
                      ['Current (Year 1)', 'Adaptive \u03b1 keeps equal weights substantial. Conservative by design.'],
                      ['At 75+ organizations', 'Re-run analysis. Consider shifting blend further toward empirical.'],
                      ['At 100+ organizations', 'Full recalibration with high confidence across all dimensions.'],
                      ['Annually', 'Recalibrate using latest data. Publish updated weights with each Index.']
                    ].map(([milestone, action], i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 font-medium text-slate-600 w-48">{milestone}</td>
                        <td className="py-2 text-slate-500">{action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ---- Key Principles ---- */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Key Principles</h3>
              </div>
              <div className="px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  {[
                    ['The framework comes first.', 'The Cancer and Careers framework defines the 13 dimensions and their relative weights. Element weighting operates within that framework. Dimensions are not reweighted. Elements are not moved between dimensions.'],
                    ['Calibration, not reinvention.', 'The goal is to improve scoring accuracy within each dimension, not to overhaul the assessment. Score shifts of 1 to 3 points confirm that the adjustment is proportionate.'],
                    ['Data-driven, not opinion-driven.', 'Weights are derived from observed patterns across participating organizations, not from expert panels or subjective judgment. Every weight traces to the data.'],
                    ['Conservative by design.', 'The blend always includes a substantial equal-weight component. The 20% cap provides an additional safety net. The approach is deliberately modest for Year 1.'],
                    ['All elements contribute.', 'No element is removed or zeroed out. Lower-weighted elements still contribute to the dimension score. The weighting adjusts relative emphasis, not inclusion.'],
                    ['Every dimension uses the same method.', 'No dimension is excluded. The same methodology is applied across all 13 dimensions, with the blend adapting to the strength of evidence.'],
                    ['Transparent and reproducible.', 'The methodology is fully documented and can be independently replicated. A detailed technical specification is available for peer review and Advisory Committee vetting.']
                  ].map(([principle, detail], i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1 bg-slate-200 rounded-full flex-shrink-0 mt-1" style={{ height: '16px' }} />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{principle}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: STATISTICAL OVERVIEW                                     */}
        {/* Content sourced from Element_Weighting_Methodology_v6_1         */}
        {/* ============================================================== */}
        {activeTab === 'statistical' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Statistical Overview</h2>
              <p className="text-slate-500 text-sm">Dimension-level model performance, blend ratios, and sample coverage</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { v: '159', l: 'Total Elements', d: '152 original + 7 sub-elements' },
                { v: '43', l: 'Companies', d: '22 index + 21 HR panel' },
                { v: '13', l: 'Dimensions', d: 'All included with adaptive blend' },
                { v: '3', l: 'Elements at 20% Cap', d: 'D4, D7, D12' }
              ].map((c, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-5">
                  <p className="text-3xl font-bold text-slate-800">{c.v}</p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{c.l}</p>
                  <p className="text-xs text-slate-400 mt-1">{c.d}</p>
                </div>
              ))}
            </div>

            {/* Pipeline */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Scoring Pipeline Integration</h3>
                <p className="text-sm text-slate-500 mt-0.5">Element weighting applies at Stage 4 of the full scoring pipeline</p>
              </div>
              <div className="px-8 py-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase w-24">Stage</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase w-48">Step</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ['Stage 1', 'Element scoring + unsure handling', 'Score confirmed elements (5/3/2/0). Apply (1\u2212r)\u00b2 substitution for Unsure.'],
                      ['Stage 2', 'Geographic multiplier', 'Applied based on multi-country response (\u00d71.0, \u00d70.90, or \u00d70.85).'],
                      ['Stage 3', 'Follow-up blending', 'For D1, D3, D12, D13: blend 85% grid score + 15% follow-up score.'],
                      ['Stage 4', 'Element weighting', 'Apply within-dimension element weights (this document). Produces weighted dimension scores.'],
                      ['Stage 5', 'Dimension weighting', 'Apply dimension weights to produce weighted dimension score.'],
                      ['Stage 6', 'Composite', 'Composite = (Weighted Dimensions \u00d7 90%) + (Maturity \u00d7 5%) + (Breadth \u00d7 5%).']
                    ].map(([stage, step, detail], i) => (
                      <tr key={i} className={`${i === 3 ? 'bg-slate-50 font-medium' : ''}`}>
                        <td className="py-2.5 px-3 text-xs text-slate-400 font-mono">{stage}</td>
                        <td className={`py-2.5 px-3 ${i === 3 ? 'text-slate-800' : 'text-slate-700'}`}>{step}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-xs">{detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Methodology Pipeline Steps */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Weight Estimation Pipeline</h3>
              </div>
              <div className="px-8 py-5">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {[
                    'Ordinal Encoding\n(0 / 2 / 3 / 5)',
                    'Company Filter\n(\u226560% observed)',
                    'Ridge \u03b1 = 1.0\n(z-scored)',
                    'Permutation\nImportance\n(100 reps)',
                    'Bootstrap\nStability\n(200 reps)',
                    'Soft Attenuation\ns(j)^1.5',
                    'Adaptive \u03b1\nBlend',
                    '20% Hard\nCap'
                  ].map((s, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-center text-slate-600 whitespace-pre-line leading-tight min-w-[85px]">
                        {s}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </section>

            {/* Feature Encoding */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Feature Encoding</h3>
              </div>
              <div className="px-8 py-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase w-40">Response</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-slate-400 uppercase w-20">Score</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ['Currently Offer', '5', 'Confirmed, full credit', 'text-emerald-600'],
                      ['Planning', '3', 'Active intent to implement', 'text-blue-600'],
                      ['Assessing', '2', 'Exploring feasibility', 'text-amber-600'],
                      ['Not Offered', '0', 'Confirmed absence', 'text-slate-500'],
                      ['Unsure', 'Missing', 'Excluded from model fitting', 'text-slate-400']
                    ].map(([resp, score, rationale, color], i) => (
                      <tr key={i} className={i % 2 !== 0 ? 'bg-slate-50/50' : ''}>
                        <td className={`py-2.5 px-3 font-medium ${color}`}>{resp}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">{score}</td>
                        <td className="py-2.5 px-3 text-slate-500">{rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Adaptive Shrinkage */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Adaptive Shrinkage Toward Equal Weights</h3>
                <p className="text-sm text-slate-500 mt-0.5">w_final(j) = \u03b1 \u00d7 w_empirical(j) + (1 \u2212 \u03b1) \u00d7 w_equal</p>
              </div>
              <div className="px-8 py-5">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { range: 'CV R\u00b2 < 0', alpha: '\u03b1 = 0.30', label: 'Emerging Signal', desc: '30% empirical, 70% equal. Anchor heavily toward framework while allowing modest differentiation.', color: 'amber' },
                    { range: '0 \u2264 CV R\u00b2 < 0.10', alpha: '\u03b1 = 0.40', label: 'Developing Signal', desc: '40% empirical, 60% equal. Lean toward equal but allow more differentiation.', color: 'indigo' },
                    { range: 'CV R\u00b2 \u2265 0.10', alpha: '\u03b1 = 0.50', label: 'Established Signal', desc: '50% empirical, 50% equal. Balanced blend of empirical and equal.', color: 'emerald' }
                  ].map((tier, i) => (
                    <div key={i} className="p-5 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{tier.label}</span>
                        <span className="text-lg font-bold text-slate-700">{tier.alpha}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mb-2">{tier.range}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{tier.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4">Hard cap: No single element can exceed 20% of its dimension&apos;s total weight. Any excess is redistributed proportionally. Final weights normalize to sum to 1.000 within each dimension.</p>
              </div>
            </section>

            {/* Dimension-Level Results Table */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Dimension-Level Results</h3>
                <p className="text-sm text-slate-500 mt-0.5">The same methodology is applied to all 13 dimensions. No dimension is excluded; the blend ratio adapts to the strength of evidence.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-medium">Dimension</th>
                      <th className="px-4 py-3 text-center font-medium w-14">Wt</th>
                      <th className="px-4 py-3 text-center font-medium w-14">Elem</th>
                      <th className="px-4 py-3 text-center font-medium w-10">n</th>
                      <th className="px-4 py-3 text-center font-medium w-24">CV R²</th>
                      <th className="px-4 py-3 text-center font-medium w-20">Signal</th>
                      <th className="px-4 py-3 text-center font-medium w-12">α</th>
                      <th className="px-4 py-3 text-left font-medium">Top 3 Elements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DIMENSION_ORDER.map((d, i) => {
                      const dim = DIMENSIONS[d];
                      const sig = getSig(dim.cvR2);
                      return (
                        <tr key={d} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-5 py-3 font-medium text-slate-700">
                            <span className="text-slate-400 text-xs mr-1.5">D{d}</span>{dim.name}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500">{dim.weight}%</td>
                          <td className="px-4 py-3 text-center text-slate-500">{dim.elements}</td>
                          <td className="px-4 py-3 text-center text-slate-500">{dim.n}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-mono font-medium ${dim.cvR2 < 0 ? 'text-amber-700' : dim.cvR2 >= 0.30 ? 'text-emerald-700' : 'text-slate-600'}`}>
                              {dim.cvR2 >= 0 ? '+' : ''}{dim.cvR2.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${sig.bg} border ${sig.border}`} style={{ color: sig.color }}>{sig.label}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-slate-600">{dim.alpha.toFixed(2)}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{dim.topElements.join(' · ')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-3 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center gap-6 text-xs text-slate-400">
                  <span><strong className="text-slate-500">CV R²</strong> = 5-fold cross-validated R² (out-of-sample predictive power)</span>
                  <span><strong className="text-slate-500">α</strong> = empirical share in final blend (1 − α = equal weight share)</span>
                  <span><strong className="text-slate-500">n</strong> = companies meeting 60% coverage threshold</span>
                </div>
              </div>
            </section>

            {/* Alternatives Explored */}
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Alternatives Explored and Rejected</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-medium w-56">Approach</th>
                      <th className="px-6 py-3 text-left font-medium">Why Rejected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ['Bivariate correlation', 'Treats co-occurring elements independently, giving both full credit for what may be shared capability.'],
                      ['Raw ridge coefficients as weights', 'Can be negative due to multicollinearity. Permutation importance produces only positive weights.'],
                      ['Binary encoding (yes/no)', 'Discards the distinction between Assessing, Planning, and Currently Offer. Ordinal scale captures progression.'],
                      ['Expert judgment weighting', 'Subjective and difficult to defend. Different experts produce different weights with no adjudication mechanism.'],
                      ['Hard stability cutoffs', 'Forcing elements below a threshold to equal weight creates cliff effects. Soft attenuation is more principled.']
                    ].map(([approach, why], i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-6 py-3 font-medium text-slate-700">{approach}</td>
                        <td className="px-6 py-3 text-slate-500">{why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: ELEMENT WEIGHTS                                          */}
        {/* All 159 elements from Element_Weights_v6_1_Tidy.json            */}
        {/* ============================================================== */}
        {activeTab === 'weights' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Element-Level Weights</h2>
              <p className="text-slate-500 text-sm">All 159 support elements across 13 dimensions with final weights, equal-weight baseline, bootstrap stability, and deviation from equal. Elements ranked by final weight. All weights sum to 100% within each dimension.</p>
            </div>

            {DIMENSION_ORDER.map((d) => {
              const dim = DIMENSIONS[d];
              const isExpanded = expandedDim === d;
              const sig = getSig(dim.cvR2);
              const capCount = dim.items.filter((it) => it.weight >= 0.199).length;

              return (
                <div key={d} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedDim(isExpanded ? null : d)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-9 h-9 rounded-lg bg-slate-800 text-white text-sm font-semibold flex items-center justify-center">
                        {d}
                      </span>
                      <div className="text-left">
                        <span className="font-semibold text-slate-800">{dim.name}</span>
                        <div className="flex items-center gap-3 mt-0.5 text-xs">
                          <span className="text-slate-400">{dim.elements} elements</span>
                          <span className="text-slate-400">{dim.weight}% dim wt</span>
                          <span className={`font-medium px-1.5 py-0.5 rounded ${sig.bg}`} style={{ color: sig.color }}>
                            CV R² = {dim.cvR2 >= 0 ? '+' : ''}{dim.cvR2.toFixed(3)}
                          </span>
                          <span className="text-slate-400">α = {dim.alpha.toFixed(2)}</span>
                          {capCount > 0 && (
                            <span className="text-amber-600 font-medium">{capCount} at cap</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                            <th className="pl-6 pr-2 py-2.5 text-left font-medium w-10">#</th>
                            <th className="px-3 py-2.5 text-left font-medium">Support Element</th>
                            <th className="px-3 py-2.5 text-right font-medium w-20">Equal</th>
                            <th className="px-3 py-2.5 text-right font-medium w-24">Weight</th>
                            <th className="px-3 py-2.5 text-right font-medium w-20">vs Equal</th>
                            <th className="px-3 py-2.5 text-center font-medium w-32">Stability</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dim.items.map((item, i) => {
                            const isCapped = item.weight >= 0.199;
                            return (
                              <tr key={item.rank} className={isCapped ? 'bg-amber-50/50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                <td className="pl-6 pr-2 py-2.5 text-slate-400 text-xs">{item.rank}</td>
                                <td className="px-3 py-2.5 text-slate-700">{item.name}</td>
                                <td className="px-3 py-2.5 text-right text-slate-400 tabular-nums">{(item.equal * 100).toFixed(1)}%</td>
                                <td className="px-3 py-2.5 text-right tabular-nums">
                                  <span className={`font-semibold ${isCapped ? 'text-amber-700' : 'text-slate-700'}`}>
                                    {(item.weight * 100).toFixed(1)}%
                                  </span>
                                  {isCapped && <span className="ml-1 text-xs text-amber-500">cap</span>}
                                </td>
                                <td className="px-3 py-2.5 text-right tabular-nums">
                                  <span className={`text-xs font-medium ${item.delta >= 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {item.delta >= 0 ? '+' : ''}{(item.delta * 100).toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${item.stability * 100}%`,
                                          backgroundColor: stabColor(item.stability)
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-slate-400 w-10 text-right tabular-nums">
                                      {(item.stability * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 border-t border-slate-200">
                            <td colSpan={2} className="pl-6 pr-3 py-2 text-xs text-slate-500 font-medium">Dimension Total</td>
                            <td className="px-3 py-2 text-right text-xs text-slate-500 tabular-nums">100.0%</td>
                            <td className="px-3 py-2 text-right text-xs text-slate-500 font-medium tabular-nums">100.0%</td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: SCORE COMPARISON                                         */}
        {/* Benchmark + company scores: equal vs element-weighted            */}
        {/* ============================================================== */}
        {activeTab === 'scoring' && (
          <div className="space-y-6">
            <div className="max-w-5xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Score Comparison: Equal Weight vs. Element-Weighted</h2>
              <p className="text-slate-500 text-sm">All pipeline components identical. Only difference is element weighting within each dimension.</p>
            </div>

            {/* Legend */}
            <div className="flex gap-6 max-w-5xl">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white border border-slate-300" />
                <span className="text-slate-500 text-sm">Equal Weight Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
                <span className="text-slate-500 text-sm">Element-Weighted Score</span>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-2xl font-bold text-emerald-600">73%</p>
                <p className="text-xs text-slate-500 mt-1">Companies with higher weighted score</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-2xl font-bold text-slate-700">2.1 pts</p>
                <p className="text-xs text-slate-500 mt-1">Average score shift</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-2xl font-bold text-slate-700">5 pts</p>
                <p className="text-xs text-slate-500 mt-1">Maximum shift observed</p>
              </div>
            </div>

            {/* Score Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="sticky left-0 z-20 bg-slate-800 px-4 py-3 text-left font-semibold w-[180px] min-w-[180px] max-w-[180px] border-r border-slate-700" />
                      <th className="px-2 py-3 text-center font-semibold w-[60px] min-w-[60px] max-w-[60px] bg-slate-700 border-r border-slate-600">Bench</th>
                      {COMPANIES.map((c, i) => (
                        <th key={c} className={`px-1 py-3 text-center font-medium w-[60px] min-w-[60px] max-w-[60px] text-[10px] leading-tight ${i % 2 === 0 ? 'bg-slate-700' : 'bg-slate-800'}`}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Composite Section */}
                    <tr className="bg-slate-100 border-y border-slate-300">
                      <td colSpan={2 + COMPANIES.length} className="px-4 py-2 font-bold text-slate-800 uppercase text-[10px] tracking-wider">Composite Score</td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="sticky left-0 z-10 bg-white px-4 py-2 text-slate-600 font-medium border-r border-slate-100">Equal Weight</td>
                      <td className="px-3 py-2 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-100">{SCORES.Benchmark.eqC}</td>
                      {COMPANIES.map((c, i) => (
                        <td key={c} className={`px-2 py-2 text-center text-slate-600 ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>{SCORES[c]?.eqC}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-200 bg-emerald-50 hover:bg-emerald-100/50">
                      <td className="sticky left-0 z-10 bg-emerald-50 px-4 py-2 text-emerald-700 font-semibold border-r border-emerald-100">Element-Weighted</td>
                      <td className="px-3 py-2 text-center font-bold text-emerald-700 bg-emerald-100 border-r border-emerald-100">{SCORES.Benchmark.wtC}</td>
                      {COMPANIES.map((c, i) => (
                        <td key={c} className={`px-2 py-2 text-center font-semibold text-emerald-700 ${i % 2 === 0 ? 'bg-emerald-50' : 'bg-emerald-50/50'}`}>{SCORES[c]?.wtC}</td>
                      ))}
                    </tr>
                    <tr className="border-b-2 border-slate-300 bg-slate-50">
                      <td className="sticky left-0 z-10 bg-slate-50 px-4 py-1.5 text-slate-500 text-[10px] border-r border-slate-200">Δ (Weighted − Equal)</td>
                      <td className="px-3 py-1.5 text-center text-[10px] font-semibold bg-slate-50/50 border-r border-slate-200">
                        <span className="text-emerald-600">+{SCORES.Benchmark.wtC - SCORES.Benchmark.eqC}</span>
                      </td>
                      {COMPANIES.map((c) => {
                        const delta = (SCORES[c]?.wtC || 0) - (SCORES[c]?.eqC || 0);
                        return (
                          <td key={c} className="px-2 py-1.5 text-center text-[10px] font-semibold">
                            <span className={delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-slate-400'}>
                              {delta > 0 ? '+' : ''}{delta}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Dimension Rows */}
                    {DIMENSION_ORDER.map((dim, idx) => (
                      <React.Fragment key={dim}>
                        <tr className={`${idx === 0 ? '' : 'border-t border-slate-200'} bg-slate-100`}>
                          <td colSpan={2 + COMPANIES.length} className="px-4 py-1.5 text-[10px] font-semibold text-slate-600">
                            <span className="text-slate-800">D{dim}:</span> {DIMENSIONS[dim].name} <span className="text-slate-400 font-normal">({DIMENSIONS[dim].weight}%)</span>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="sticky left-0 z-10 bg-white px-4 py-1.5 text-slate-500 pl-6 text-[10px] border-r border-slate-100">Equal</td>
                          <td className="px-3 py-1.5 text-center text-slate-500 bg-slate-50/30 border-r border-slate-100">{SCORES.Benchmark.dims[dim]?.eq}</td>
                          {COMPANIES.map((c, i) => (
                            <td key={c} className={`px-2 py-1.5 text-center text-slate-500 ${i % 2 === 0 ? 'bg-slate-50/30' : ''}`}>{SCORES[c]?.dims[dim]?.eq}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-slate-100 bg-emerald-50/30 hover:bg-emerald-50/50">
                          <td className="sticky left-0 z-10 bg-emerald-50/30 px-4 py-1.5 text-emerald-600 font-medium pl-6 text-[10px] border-r border-emerald-100/50">Weighted</td>
                          <td className="px-3 py-1.5 text-center font-medium text-emerald-600 bg-emerald-100/30 border-r border-emerald-100/50">{SCORES.Benchmark.dims[dim]?.wt}</td>
                          {COMPANIES.map((c, i) => (
                            <td key={c} className={`px-2 py-1.5 text-center text-emerald-600 ${i % 2 === 0 ? 'bg-emerald-50/40' : 'bg-emerald-50/20'}`}>{SCORES[c]?.dims[dim]?.wt}</td>
                          ))}
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

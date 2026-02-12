'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ElementItem { rank: number; name: string; weight: number; equal: number; delta: number; stability: number; }
interface DimensionData { name: string; weight: number; elements: number; cvR2: number; alpha: number; n: number; topElements: string[]; items: ElementItem[]; }

const DIMENSION_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

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

const COMPANIES = [
  'Best Buy', 'Publicis', 'Google', 'Pfizer', 'Schneider Electric',
  'Ultragenyx', 'The Hartford', 'AARP', 'Ford Otosan', "L'Oréal", 'Inspire Brands'
];

type ScoreEntry = { eqC: number; wtC: number; dims: Record<number, { eq: number; wt: number }> };

const SCORES: Record<string, ScoreEntry> = {
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

function getScoreColor(score: number): string {
  if (score >= 80) return '#047857';
  if (score >= 60) return '#059669';
  if (score >= 40) return '#0369A1';
  if (score >= 20) return '#B45309';
  return '#DC2626';
}

// Custom SVG Icons
function IconScale() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="M3 7l4-4h10l4 4" /><circle cx="7" cy="14" r="3" /><circle cx="17" cy="14" r="3" /><path d="M7 11V7" /><path d="M17 11V7" /></svg>);
}
function IconTarget() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>);
}
function IconShield() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>);
}
function IconChart() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 6-10" /></svg>);
}
function IconLayers() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>);
}
function IconRefresh() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>);
}
function IconGrid() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>);
}
function IconTrendUp() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>);
}
function IconCheck() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>);
}
function IconChevron({ open }: { open: boolean }) {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>);
}
function IconArrowRight() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>);
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function ElementWeightingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'statistical' | 'weights' | 'scoring'>('overview');
  const [expandedDim, setExpandedDim] = useState<number | null>(null);

  const tabs = [
    { key: 'overview' as const, label: 'Executive Overview', icon: <IconTarget /> },
    { key: 'statistical' as const, label: 'Statistical Overview', icon: <IconChart /> },
    { key: 'weights' as const, label: 'Element Weights', icon: <IconScale /> },
    { key: 'scoring' as const, label: 'Score Comparison', icon: <IconGrid /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header — logo on white pill */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-white rounded-lg px-3 py-2">
                <img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-9" />
              </div>
              <div className="border-l border-slate-700 pl-6">
                <h1 className="text-lg font-semibold text-white">Element Weighting</h1>
                <p className="text-sm text-slate-400">Best Companies for Working with Cancer Index — 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/scoring" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Scoring</Link>
              <Link href="/admin" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar — bold, dark, with icons */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-violet-600 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className={activeTab === tab.key ? 'text-violet-600' : 'text-slate-400'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content — wider at max-w-[1400px] */}
      <div className={`mx-auto py-8 ${activeTab === 'scoring' ? 'max-w-[1600px] px-6' : 'max-w-[1400px] px-8'}`}>

        {/* ===== TAB 1: EXECUTIVE OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Why Weight Support Elements?</h2>
              <p className="text-slate-600 text-sm">A data-driven calibration of the Cancer and Careers assessment framework</p>
            </div>

            {/* The Question */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><IconTarget /></span>
                <h3 className="font-bold text-slate-900 text-lg">The Question</h3>
              </div>
              <div className="px-8 py-6 text-slate-700 leading-relaxed space-y-4">
                <p>The Index assesses workplace cancer support across 13 dimensions, with each dimension containing between 9 and 20 individual support elements. In the first version of the scoring, every element within a dimension counted equally. Offering a clinical trial matching service counted the same as offering an employee assistance program.</p>
                <p>That is a reasonable starting point, but it does not reflect reality. Some elements are table-stakes practices that most organizations already provide. Others are rarer commitments that distinguish genuinely mature programs from the rest. The question is whether the scoring should reflect that distinction.</p>
              </div>
            </section>

            {/* Our Answer */}
            <section className="bg-gradient-to-br from-violet-700 to-violet-900 rounded-xl shadow-lg overflow-hidden">
              <div className="px-8 py-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center"><IconCheck /></span>
                  <p className="text-xs font-bold text-violet-200 uppercase tracking-wider">Our Answer</p>
                </div>
                <p className="text-white text-lg leading-relaxed">
                  <strong>Yes, but carefully.</strong> We adjusted element weights within each dimension so that programs which more consistently distinguish stronger overall performers receive modestly higher weight. We did this using the data itself, not subjective judgment, and we blended the results back toward equal weighting to ensure the adjustment <em className="text-violet-200">calibrates</em> the scoring rather than rewrites it.
                </p>
              </div>
              <div className="px-8 py-4 bg-black/20 border-t border-white/10">
                <p className="text-violet-200 text-sm">The Cancer and Careers framework remains intact. The 13 dimensions, their relative weights, and the response scale are all unchanged. Element weighting adjusts only how much each item contributes within its own dimension.</p>
              </div>
            </section>

            {/* How We Did It (8 Steps) */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center"><IconLayers /></span>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">How We Did It</h3>
                  <p className="text-sm text-slate-600 mt-0.5">A transparent, reproducible process designed to withstand peer review</p>
                </div>
              </div>
              <div className="px-8 py-6">
                <div className="space-y-5">
                  {[
                    { t: 'Preserved the full response scale', d: 'Each element is scored on four levels: Currently Offer, Planning, Assessing, and Not Offered. Collapsing this to a binary would discard the progression signal the survey was designed to capture.' },
                    { t: 'Used only clean data', d: 'If a company reported \u201cUnsure\u201d on a significant proportion of elements in a dimension, that company was excluded from weight estimation for that dimension. This prevents the analysis from learning patterns in incomplete data. Those companies still receive scored reports using the final weights.' },
                    { t: 'Built a model that predicts overall program strength', d: 'For each dimension, we asked: which elements in this dimension best predict a company\u2019s composite score across all the other 12 dimensions? Elements that predict overall strength are the true differentiators. They signal depth and maturity that extends beyond a single area.' },
                    { t: 'Avoided circularity by design', d: 'We deliberately did not predict the dimension\u2019s own score. If we had, the model would reward elements simply for being part of the formula, not for predicting anything meaningful. By looking outward to the composite, an element earns higher weight only if companies that score well on it also tend to score well everywhere else.' },
                    { t: 'Measured each element\u2019s contribution by disruption', d: 'If we temporarily scramble an element\u2019s data across companies, how much does the model\u2019s ability to predict composite strength decline? Elements that cause a larger decline when scrambled are stronger differentiators. This approach produces importance scores that are always positive and intuitive to interpret.' },
                    { t: 'Tested stability through resampling', d: 'The analysis was repeated 200 times on different random samples of companies. Elements that consistently appeared as important across all samples received their full weight. Elements whose importance fluctuated were dampened proportionally. This protects against any single company driving an element\u2019s weight.' },
                    { t: 'Blended the results back toward equal weights', d: 'The final weight for each element is a blend of what the data suggests and what equal weighting would produce. This ensures that even where the empirical signal is strong, the expert framework still anchors the result. As participation grows in future years, the empirical share can increase.' },
                    { t: 'Capped the maximum weight', d: 'No single element can exceed 20% of its dimension\u2019s total weight, regardless of what the data suggests. Any excess is redistributed proportionally among the other elements. This prevents any one program from dominating a dimension\u2019s score.' }
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-violet-700 text-white text-sm font-bold flex items-center justify-center shadow-sm">{i + 1}</div>
                      <div className="pt-1">
                        <p className="font-semibold text-slate-900">{step.t}</p>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{step.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* What the Calibration Produces */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><IconTrendUp /></span>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">What the Calibration Produces</h3>
                  <p className="text-sm text-slate-600 mt-0.5">The adjustment is deliberately modest</p>
                </div>
              </div>
              <div className="px-8 py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  {[
                    { v: '1\u20133 pts', l: 'Composite Score Shifts', d: 'Most companies move by fewer than 3 points.', color: 'from-violet-500 to-violet-600' },
                    { v: '2\u20133\u00d7', l: 'Weight Spread', d: 'Highest-weighted element vs lowest within a dimension.', color: 'from-blue-500 to-blue-600' },
                    { v: 'Preserved', l: 'Rankings', d: 'Where reordering occurs, it is among companies with similar scores.', color: 'from-emerald-500 to-emerald-600' },
                    { v: '3 elements', l: '20% Cap Hit', d: 'The data would have given them even higher weight.', color: 'from-amber-500 to-amber-600' }
                  ].map((m, i) => (
                    <div key={i} className="rounded-xl overflow-hidden shadow-sm">
                      <div className={`bg-gradient-to-br ${m.color} px-5 py-4`}>
                        <p className="text-2xl font-bold text-white">{m.v}</p>
                        <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mt-1">{m.l}</p>
                      </div>
                      <div className="bg-white border border-slate-200 border-t-0 px-5 py-3">
                        <p className="text-xs text-slate-600 leading-relaxed">{m.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-slate-200 text-sm text-center">This is the expected behavior of a well-calibrated adjustment: <span className="text-white font-semibold">meaningful differentiation without disruption.</span></p>
                </div>
              </div>
            </section>

            {/* How the Blend Adapts */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><IconRefresh /></span>
                <h3 className="font-bold text-slate-900 text-lg">How the Blend Adapts</h3>
              </div>
              <div className="px-8 py-6 text-slate-700 leading-relaxed space-y-4">
                <p>The blend between data-driven weights and equal weights adapts by dimension based on the strength of the empirical signal. In dimensions where the data clearly identifies which elements differentiate stronger programs, the blend leans more toward the empirical finding. Where the signal is emerging, the blend anchors more heavily toward the expert framework.</p>
                <p>This is a Year 1 calibration. The adaptive blend is conservative by design. As participation grows, the empirical signal strengthens across all dimensions, and the blend can shift further toward data-driven weights.</p>
                <p>No dimension is excluded. The same methodology is applied across all 13 dimensions, with the blend adapting to the strength of evidence in each.</p>
              </div>
            </section>

            {/* Top Differentiators Table */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><IconScale /></span>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Top Differentiating Elements by Dimension</h3>
                  <p className="text-sm text-slate-600 mt-0.5">Programs that most consistently predict stronger overall performance across the Index</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold w-56">Dimension</th>
                      <th className="px-4 py-3 text-left font-semibold">Top Element</th>
                      <th className="px-4 py-3 text-left font-semibold">Second</th>
                      <th className="px-4 py-3 text-left font-semibold">Third</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DIMENSION_ORDER.map((d, i) => {
                      const dim = DIMENSIONS[d];
                      return (
                        <tr key={d} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-violet-50/40 transition-colors`}>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-6 h-6 rounded bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">{d}</span>
                              <span className="text-slate-800 font-medium">{dim.name}</span>
                            </span>
                          </td>
                          {dim.items.slice(0, 3).map((item, j) => (
                            <td key={j} className="px-4 py-3 text-slate-700">
                              {item.name.length > 45 ? item.name.slice(0, 42) + '...' : item.name}
                              <span className="ml-1.5 text-xs font-semibold text-violet-600">{(item.weight * 100).toFixed(1)}%</span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 space-y-2">
                <p className="text-xs text-slate-600"><strong className="text-slate-700">Important:</strong> Every element contributes to the score. Lower-weighted elements still matter. The elements that receive higher weight tend to be rarer commitments that signal deeper organizational investment.</p>
              </div>
            </section>

            {/* What We Chose Not to Do */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </span>
                <h3 className="font-bold text-slate-900 text-lg">What We Chose Not to Do</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold w-56">Alternative</th>
                      <th className="px-6 py-3 text-left font-semibold">Why We Moved On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ['Expert judgment weighting', 'Subjective and difficult to defend. Different experts produce different weights, with no way to adjudicate.'],
                      ['Simple yes/no encoding', 'Discards the distinction between Assessing, Planning, and Currently Offer. The ordinal scale captures progression that a binary cannot.'],
                      ['Raw model outputs as weights', 'Some outputs are negative due to overlapping elements. We used permutation importance, which produces only positive weights.'],
                      ['Treating co-occurring elements independently', 'If two programs tend to be offered together, a simple approach gives both full credit for what may be a shared underlying capability. Our approach distributes weight among related elements.'],
                      ['Dropping low-stability elements', 'Hard cutoffs create cliff effects. Instead, we dampen unstable elements proportionally. Every element still contributes.']
                    ].map(([alt, why], i) => (
                      <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-slate-50 transition-colors`}>
                        <td className="px-6 py-3 font-semibold text-slate-800">{alt}</td>
                        <td className="px-6 py-3 text-slate-700">{why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* How This Evolves */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center"><IconRefresh /></span>
                <h3 className="font-bold text-slate-900 text-lg">How This Evolves</h3>
              </div>
              <div className="px-8 py-6 text-slate-700 leading-relaxed space-y-4">
                <p>This is a Year 1 calibration. The methodology is designed to scale naturally as participation grows. With more organizations completing the assessment each year, the empirical signal strengthens across all dimensions, the stability of element weights increases, and the blend can shift further toward data-driven weights with greater confidence.</p>
                <p>Weights are recalibrated annually using the latest data and published alongside each Index release.</p>
              </div>
              <div className="px-8 py-4 bg-slate-50 border-t border-slate-200">
                <div className="grid grid-cols-4 gap-4 text-xs">
                  {[
                    { m: 'Year 1 (Current)', a: 'Conservative blend. Equal weights substantial.', color: 'bg-violet-600' },
                    { m: '75+ Organizations', a: 'Re-run analysis. Consider increasing empirical share.', color: 'bg-blue-600' },
                    { m: '100+ Organizations', a: 'Full recalibration with high confidence.', color: 'bg-emerald-600' },
                    { m: 'Annually', a: 'Recalibrate and publish updated weights.', color: 'bg-slate-600' }
                  ].map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <div className={`w-1.5 rounded-full ${s.color} flex-shrink-0`} />
                      <div>
                        <p className="font-semibold text-slate-800">{s.m}</p>
                        <p className="text-slate-600 mt-0.5">{s.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Key Principles */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><IconShield /></span>
                <h3 className="font-bold text-slate-900 text-lg">Key Principles</h3>
              </div>
              <div className="px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { t: 'The framework comes first.', d: 'Dimensions are not reweighted. Elements are not moved between dimensions. The Cancer and Careers framework is the foundation.' },
                    { t: 'Calibration, not reinvention.', d: 'Score shifts of 1\u20133 points confirm the adjustment is proportionate to the evidence.' },
                    { t: 'Data-driven, not opinion-driven.', d: 'Every weight traces to observed patterns across participating organizations.' },
                    { t: 'Conservative by design.', d: 'Substantial equal-weight component in every blend. 20% cap provides an additional safety net.' },
                    { t: 'All elements contribute.', d: 'No element is removed or zeroed out. The weighting adjusts relative emphasis, not inclusion.' },
                    { t: 'Every dimension uses the same method.', d: 'The blend adapts to signal strength, but the process is identical across all 13 dimensions.' },
                    { t: 'Transparent and reproducible.', d: 'Fully documented methodology. Available for peer review and Advisory Committee vetting.' }
                  ].map((p, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0"><IconCheck /></span>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{p.t}</p>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{p.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ===== TAB 2: STATISTICAL OVERVIEW ===== */}
        {activeTab === 'statistical' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Statistical Overview</h2>
              <p className="text-slate-600 text-sm">Dimension-level model performance, blend parameters, and pipeline specification</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { v: '159', l: 'Elements', d: 'Across 13 dimensions', color: 'from-violet-500 to-violet-600', icon: <IconLayers /> },
                { v: '13', l: 'Dimensions', d: 'All with adaptive blend', color: 'from-blue-500 to-blue-600', icon: <IconGrid /> },
                { v: '5-fold', l: 'Cross-Validation', d: 'Out-of-sample R\u00b2', color: 'from-emerald-500 to-emerald-600', icon: <IconChart /> },
                { v: '200', l: 'Bootstrap Resamples', d: 'For stability testing', color: 'from-amber-500 to-amber-600', icon: <IconRefresh /> }
              ].map((c, i) => (
                <div key={i} className={`bg-gradient-to-br ${c.color} rounded-xl p-5 text-white shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60">{c.icon}</span>
                  </div>
                  <p className="text-3xl font-bold">{c.v}</p>
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mt-1">{c.l}</p>
                  <p className="text-xs text-white/60 mt-1">{c.d}</p>
                </div>
              ))}
            </div>

            {/* Scoring Pipeline */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><IconLayers /></span>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Scoring Pipeline Integration</h3>
                  <p className="text-sm text-slate-600 mt-0.5">Element weighting applies at Stage 4</p>
                </div>
              </div>
              <div className="px-8 py-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase w-24">Stage</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase w-56">Step</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ['1', 'Element scoring + unsure handling', 'Score confirmed elements (5/3/2/0). Apply (1\u2212r)\u00b2 substitution for Unsure.', false],
                      ['2', 'Geographic multiplier', 'Applied based on multi-country response (\u00d71.0, \u00d70.90, or \u00d70.85).', false],
                      ['3', 'Follow-up blending', 'For D1, D3, D12, D13: blend 85% grid score + 15% follow-up score.', false],
                      ['4', 'Element weighting', 'Apply within-dimension support element weights. Produces weighted dimension scores.', true],
                      ['5', 'Dimension weighting', 'Apply dimension weights to produce weighted dimension score.', false],
                      ['6', 'Composite', 'Composite = (Weighted Dimensions \u00d7 90%) + (Maturity \u00d7 5%) + (Breadth \u00d7 5%).', false]
                    ].map(([stage, step, detail, highlight], i) => (
                      <tr key={i} className={`${highlight ? 'bg-violet-50 border-l-4 border-l-violet-600' : ''}`}>
                        <td className={`py-2.5 px-3 text-xs font-mono ${highlight ? 'text-violet-700 font-bold' : 'text-slate-500'}`}>Stage {stage}</td>
                        <td className={`py-2.5 px-3 ${highlight ? 'text-violet-800 font-semibold' : 'text-slate-800'}`}>{step}</td>
                        <td className={`py-2.5 px-3 text-sm ${highlight ? 'text-violet-700' : 'text-slate-600'}`}>{detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Weight Estimation Pipeline — clean horizontal flow */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><IconChart /></span>
                <h3 className="font-bold text-slate-900 text-lg">Weight Estimation Pipeline</h3>
              </div>
              <div className="px-8 py-6">
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[
                    { title: 'Ordinal Encoding', detail: '0 / 2 / 3 / 5', color: 'bg-slate-700' },
                    { title: 'Company Filtering', detail: '\u226560% observed', color: 'bg-slate-700' },
                    { title: 'Ridge Regression', detail: '\u03b1 = 1.0, z-scored', color: 'bg-slate-700' },
                    { title: 'Permutation Importance', detail: '100 repetitions', color: 'bg-violet-700' },
                  ].map((s, i) => (
                    <div key={i} className="relative">
                      <div className={`${s.color} text-white rounded-lg px-4 py-3 text-center`}>
                        <p className="text-xs font-bold">{s.title}</p>
                        <p className="text-[10px] text-white/70 mt-0.5">{s.detail}</p>
                      </div>
                      {i < 3 && (
                        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 text-slate-400">
                          <IconArrowRight />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { title: 'Bootstrap Stability', detail: '200 resamples', color: 'bg-violet-700' },
                    { title: 'Soft Attenuation', detail: 'w \u00d7 s(j)^1.5', color: 'bg-blue-700' },
                    { title: 'Adaptive \u03b1 Blend', detail: 'CV R\u00b2 \u2192 \u03b1', color: 'bg-blue-700' },
                    { title: '20% Hard Cap', detail: 'Redistribute excess', color: 'bg-emerald-700' },
                  ].map((s, i) => (
                    <div key={i} className="relative">
                      <div className={`${s.color} text-white rounded-lg px-4 py-3 text-center`}>
                        <p className="text-xs font-bold">{s.title}</p>
                        <p className="text-[10px] text-white/70 mt-0.5">{s.detail}</p>
                      </div>
                      {i < 3 && (
                        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 text-slate-400">
                          <IconArrowRight />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Feature Encoding */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><IconGrid /></span>
                <h3 className="font-bold text-slate-900 text-lg">Feature Encoding</h3>
              </div>
              <div className="px-8 py-5">
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { resp: 'Currently Offer', score: '5', bg: 'bg-emerald-600', desc: 'Full credit' },
                    { resp: 'Planning', score: '3', bg: 'bg-blue-600', desc: 'Active intent' },
                    { resp: 'Assessing', score: '2', bg: 'bg-amber-600', desc: 'Exploring' },
                    { resp: 'Not Offered', score: '0', bg: 'bg-slate-500', desc: 'Confirmed absence' },
                    { resp: 'Unsure', score: '\u2014', bg: 'bg-slate-300', desc: 'Excluded from fit' },
                  ].map((r, i) => (
                    <div key={i} className="text-center">
                      <div className={`${r.bg} text-white rounded-lg py-3 mb-2`}>
                        <p className="text-2xl font-bold">{r.score}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{r.resp}</p>
                      <p className="text-xs text-slate-500">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Adaptive Shrinkage — proper formula + colored cards */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center"><IconScale /></span>
                <h3 className="font-bold text-slate-900 text-lg">Adaptive Shrinkage Toward Equal Weights</h3>
              </div>
              <div className="px-8 py-6">
                {/* Formula — styled properly */}
                <div className="bg-slate-800 rounded-lg px-6 py-4 mb-6">
                  <p className="text-white font-mono text-center text-base">
                    <span className="text-violet-300">w</span><sub className="text-violet-400 text-xs">final</sub><span className="text-slate-400">(j)</span>
                    <span className="text-slate-500 mx-2">=</span>
                    <span className="text-amber-300 font-bold">\u03b1</span>
                    <span className="text-slate-500 mx-1">\u00d7</span>
                    <span className="text-violet-300">w</span><sub className="text-violet-400 text-xs">empirical</sub><span className="text-slate-400">(j)</span>
                    <span className="text-slate-500 mx-2">+</span>
                    <span className="text-slate-400">(1 \u2212 </span><span className="text-amber-300 font-bold">\u03b1</span><span className="text-slate-400">)</span>
                    <span className="text-slate-500 mx-1">\u00d7</span>
                    <span className="text-violet-300">w</span><sub className="text-violet-400 text-xs">equal</sub>
                  </p>
                </div>

                {/* Three cards with color fills */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="rounded-xl overflow-hidden border border-amber-200">
                    <div className="bg-amber-50 px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Emerging Signal</span>
                        <span className="text-xl font-bold text-amber-800">\u03b1 = 0.30</span>
                      </div>
                      <p className="text-sm font-mono text-amber-700 mb-2">CV R\u00b2 &lt; 0</p>
                      <p className="text-sm text-amber-800 leading-relaxed">30% empirical, 70% equal. Anchor heavily toward the expert framework while allowing modest differentiation.</p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-indigo-200">
                    <div className="bg-indigo-50 px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Developing Signal</span>
                        <span className="text-xl font-bold text-indigo-800">\u03b1 = 0.40</span>
                      </div>
                      <p className="text-sm font-mono text-indigo-700 mb-2">0 \u2264 CV R\u00b2 &lt; 0.10</p>
                      <p className="text-sm text-indigo-800 leading-relaxed">40% empirical, 60% equal. Lean toward equal but allow more differentiation.</p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-emerald-200">
                    <div className="bg-emerald-50 px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Established Signal</span>
                        <span className="text-xl font-bold text-emerald-800">\u03b1 = 0.50</span>
                      </div>
                      <p className="text-sm font-mono text-emerald-700 mb-2">CV R\u00b2 \u2265 0.10</p>
                      <p className="text-sm text-emerald-800 leading-relaxed">50% empirical, 50% equal. Balanced blend of empirical and equal.</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-700">Hard cap: No single element can exceed 20% of its dimension&apos;s total weight. Any excess is redistributed proportionally. Final weights normalize to 1.000 within each dimension.</p>
              </div>
            </section>

            {/* Dimension Results Table — no n column */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><IconTrendUp /></span>
                <h3 className="font-bold text-slate-900 text-lg">Dimension-Level Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-semibold">Dimension</th>
                      <th className="px-4 py-3 text-center font-semibold w-16">Wt</th>
                      <th className="px-4 py-3 text-center font-semibold w-16">Elem</th>
                      <th className="px-4 py-3 text-center font-semibold w-24">CV R\u00b2</th>
                      <th className="px-4 py-3 text-center font-semibold w-24">Signal</th>
                      <th className="px-4 py-3 text-center font-semibold w-14">\u03b1</th>
                      <th className="px-4 py-3 text-left font-semibold">Top 3 Elements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DIMENSION_ORDER.map((d, i) => {
                      const dim = DIMENSIONS[d];
                      const sig = getSig(dim.cvR2);
                      return (
                        <tr key={d} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-violet-50/30 transition-colors`}>
                          <td className="px-5 py-3 font-semibold text-slate-800">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-6 h-6 rounded bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">{d}</span>
                              {dim.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700 font-medium">{dim.weight}%</td>
                          <td className="px-4 py-3 text-center text-slate-600">{dim.elements}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-mono font-bold ${dim.cvR2 < 0 ? 'text-amber-700' : dim.cvR2 >= 0.30 ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {dim.cvR2 >= 0 ? '+' : ''}{dim.cvR2.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sig.bg} border ${sig.border}`} style={{ color: sig.color }}>{sig.label}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">{dim.alpha.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{dim.topElements.join(' \u00b7 ')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-3 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center gap-6 text-xs text-slate-600">
                  <span><strong className="text-slate-700">CV R\u00b2</strong> = 5-fold cross-validated R\u00b2 (out-of-sample predictive power)</span>
                  <span><strong className="text-slate-700">\u03b1</strong> = empirical share in final blend (1 \u2212 \u03b1 = equal weight share)</span>
                </div>
              </div>
            </section>

            {/* Alternatives */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Alternatives Explored and Rejected</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold w-64">Approach</th>
                      <th className="px-6 py-3 text-left font-semibold">Why Rejected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ['Bivariate correlation', 'Treats co-occurring elements independently, giving both full credit for what may be shared capability.'],
                      ['Raw ridge coefficients', 'Can be negative due to multicollinearity. Permutation importance produces only positive weights.'],
                      ['Binary encoding', 'Discards the distinction between Assessing, Planning, and Currently Offer.'],
                      ['Expert judgment', 'Subjective and difficult to defend. No adjudication mechanism.'],
                      ['Hard stability cutoffs', 'Cliff effects. Soft attenuation is more principled.']
                    ].map(([a, w], i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="px-6 py-3 font-semibold text-slate-800">{a}</td>
                        <td className="px-6 py-3 text-slate-700">{w}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ===== TAB 3: ELEMENT WEIGHTS ===== */}
        {activeTab === 'weights' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Element-Level Weights</h2>
              <p className="text-slate-600 text-sm">All 159 support elements across 13 dimensions. Click a dimension to expand.</p>
            </div>

            {DIMENSION_ORDER.map((d) => {
              const dim = DIMENSIONS[d];
              const isExpanded = expandedDim === d;
              const sig = getSig(dim.cvR2);

              return (
                <div key={d} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedDim(isExpanded ? null : d)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white text-sm font-bold flex items-center justify-center shadow-sm">{d}</span>
                      <div className="text-left">
                        <span className="font-bold text-slate-900">{dim.name}</span>
                        <div className="flex items-center gap-3 mt-0.5 text-xs">
                          <span className="text-slate-600 font-medium">{dim.elements} elements</span>
                          <span className="text-slate-600 font-medium">{dim.weight}% dim wt</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full ${sig.bg} border ${sig.border}`} style={{ color: sig.color }}>
                            CV R\u00b2 = {dim.cvR2 >= 0 ? '+' : ''}{dim.cvR2.toFixed(3)}
                          </span>
                          <span className="text-slate-600 font-medium">\u03b1 = {dim.alpha.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-500"><IconChevron open={isExpanded} /></div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                            <th className="pl-6 pr-2 py-2.5 text-left font-semibold w-10">#</th>
                            <th className="px-3 py-2.5 text-left font-semibold">Support Element</th>
                            <th className="px-3 py-2.5 text-right font-semibold w-20">Equal</th>
                            <th className="px-3 py-2.5 text-right font-semibold w-24">Weight</th>
                            <th className="px-3 py-2.5 text-right font-semibold w-20">vs Equal</th>
                            <th className="px-3 py-2.5 text-center font-semibold w-32">Stability</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dim.items.map((item, i) => (
                            <tr key={item.rank} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="pl-6 pr-2 py-2.5 text-slate-500 text-xs font-medium">{item.rank}</td>
                              <td className="px-3 py-2.5 text-slate-800">{item.name}</td>
                              <td className="px-3 py-2.5 text-right text-slate-500 tabular-nums">{(item.equal * 100).toFixed(1)}%</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">
                                <span className="font-bold text-slate-900">{(item.weight * 100).toFixed(1)}%</span>
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums">
                                <span className={`text-xs font-bold ${item.delta >= 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {item.delta >= 0 ? '+' : ''}{(item.delta * 100).toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${item.stability * 100}%`, backgroundColor: stabColor(item.stability) }} />
                                  </div>
                                  <span className="text-xs text-slate-600 w-10 text-right tabular-nums font-medium">{(item.stability * 100).toFixed(0)}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 border-t border-slate-200">
                            <td colSpan={2} className="pl-6 pr-3 py-2 text-xs text-slate-600 font-semibold">Dimension Total</td>
                            <td className="px-3 py-2 text-right text-xs text-slate-600 tabular-nums font-medium">100.0%</td>
                            <td className="px-3 py-2 text-right text-xs text-slate-800 font-bold tabular-nums">100.0%</td>
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

        {/* ===== TAB 4: SCORE COMPARISON ===== */}
        {activeTab === 'scoring' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Score Comparison</h2>
              <p className="text-slate-600 text-sm">Equal-weight vs. element-weighted scores. All pipeline components identical — only difference is within-dimension element weighting.</p>
            </div>

            {/* Legend + Stats */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white border-2 border-slate-300" />
                <span className="text-slate-700 text-sm font-medium">Equal Weight</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <span className="text-slate-700 text-sm font-medium">Element-Weighted</span>
              </div>
              <div className="ml-auto flex items-center gap-6">
                <div>
                  <span className="text-2xl font-bold text-emerald-600">73%</span>
                  <span className="text-sm text-slate-600 ml-2">score higher with weighting</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-slate-800">2.1 pts</span>
                  <span className="text-sm text-slate-600 ml-2">avg shift</span>
                </div>
              </div>
            </div>

            {/* Score Table — tight columns, readable font, color */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '140px' }} />
                    <col style={{ width: '52px' }} />
                    {COMPANIES.map((_, i) => (
                      <col key={i} style={{ width: '52px' }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="sticky left-0 z-20 bg-slate-800 px-3 py-3 text-left font-semibold text-xs border-r border-slate-700" />
                      <th className="px-1 py-3 text-center font-bold text-[10px] leading-tight bg-slate-700 border-r border-slate-600">Bench</th>
                      {COMPANIES.map((c, i) => (
                        <th key={c} className={`px-1 py-3 text-center font-semibold text-[10px] leading-tight ${i % 2 === 0 ? 'bg-slate-700' : 'bg-slate-800'}`}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Composite Section */}
                    <tr className="bg-slate-100 border-y-2 border-slate-300">
                      <td colSpan={2 + COMPANIES.length} className="px-3 py-2 font-bold text-slate-800 uppercase text-xs tracking-wider">Composite Score</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="sticky left-0 z-10 bg-white px-3 py-2.5 text-slate-700 font-semibold text-xs border-r border-slate-100">Equal Weight</td>
                      <td className="px-1 py-2.5 text-center font-bold text-slate-800 bg-slate-50 border-r border-slate-100">{SCORES.Benchmark.eqC}</td>
                      {COMPANIES.map((c, i) => (
                        <td key={c} className={`px-1 py-2.5 text-center font-medium text-slate-700 ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>{SCORES[c]?.eqC}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-200 bg-emerald-50">
                      <td className="sticky left-0 z-10 bg-emerald-50 px-3 py-2.5 text-emerald-800 font-bold text-xs border-r border-emerald-100">Element-Weighted</td>
                      <td className="px-1 py-2.5 text-center font-bold text-emerald-700 bg-emerald-100 border-r border-emerald-100">{SCORES.Benchmark.wtC}</td>
                      {COMPANIES.map((c, i) => (
                        <td key={c} className={`px-1 py-2.5 text-center font-bold ${i % 2 === 0 ? 'bg-emerald-50' : 'bg-emerald-50/50'}`} style={{ color: getScoreColor(SCORES[c]?.wtC || 0) }}>{SCORES[c]?.wtC}</td>
                      ))}
                    </tr>
                    <tr className="border-b-2 border-slate-300 bg-slate-50">
                      <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1.5 text-slate-600 text-xs font-semibold border-r border-slate-200">{'\u0394'}</td>
                      <td className="px-1 py-1.5 text-center text-xs font-bold bg-slate-100 border-r border-slate-200">
                        <span className="text-emerald-600">+{SCORES.Benchmark.wtC - SCORES.Benchmark.eqC}</span>
                      </td>
                      {COMPANIES.map((c) => {
                        const delta = (SCORES[c]?.wtC || 0) - (SCORES[c]?.eqC || 0);
                        return (
                          <td key={c} className="px-1 py-1.5 text-center text-xs font-bold">
                            <span className={delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-slate-400'}>
                              {delta > 0 ? '+' : ''}{delta}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Dimension Rows */}
                    {DIMENSION_ORDER.map((dim, idx) => (
                      <React.Fragment key={dim}>
                        <tr className={`${idx === 0 ? '' : 'border-t-2 border-slate-200'} bg-slate-100`}>
                          <td colSpan={2 + COMPANIES.length} className="px-3 py-1.5 text-xs font-bold text-slate-700">
                            <span className="text-slate-900">D{dim}</span> {DIMENSIONS[dim].name} <span className="text-slate-500 font-medium">({DIMENSIONS[dim].weight}%)</span>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-slate-600 pl-5 text-xs font-medium border-r border-slate-100">Equal</td>
                          <td className="px-1 py-1.5 text-center text-slate-600 text-xs bg-slate-50/50 border-r border-slate-100">{SCORES.Benchmark.dims[dim]?.eq}</td>
                          {COMPANIES.map((c, i) => (
                            <td key={c} className={`px-1 py-1.5 text-center text-slate-600 text-xs ${i % 2 === 0 ? 'bg-slate-50/30' : ''}`}>{SCORES[c]?.dims[dim]?.eq}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-slate-100 bg-emerald-50/40">
                          <td className="sticky left-0 z-10 bg-emerald-50/40 px-3 py-1.5 text-emerald-700 font-semibold pl-5 text-xs border-r border-emerald-100/50">Weighted</td>
                          <td className="px-1 py-1.5 text-center font-semibold text-emerald-700 text-xs bg-emerald-100/40 border-r border-emerald-100/50">{SCORES.Benchmark.dims[dim]?.wt}</td>
                          {COMPANIES.map((c, i) => (
                            <td key={c} className={`px-1 py-1.5 text-center text-xs font-semibold ${i % 2 === 0 ? 'bg-emerald-50/50' : 'bg-emerald-50/20'}`} style={{ color: getScoreColor(SCORES[c]?.dims[dim]?.wt || 0) }}>
                              {SCORES[c]?.dims[dim]?.wt}
                            </td>
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

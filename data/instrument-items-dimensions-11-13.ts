// data/instrument-items-dimensions-11-13.ts
// Dimensions 11-13 (Final Dimensions) - Complete Data Dictionary
// Dashboard Dimensions Section: D11 through D13

export interface InstrumentItem {
  id: string;
  section: string;
  text: string;
  route: string;
  type: 'text' | 'select' | 'multi-select' | 'likert-4' | 'likert-5' | 'textarea';
  fieldName?: string;
  weight?: number;
  required?: boolean;
  conditional?: boolean;
  exclusive?: boolean;
  randomize?: boolean;
  multiCountryFollowUp?: boolean;
}

// ============================================
// DIMENSION 11: PREVENTION, WELLNESS & LEGAL COMPLIANCE
// Route: /survey/dimensions/11
// ============================================

const D11_INTRO: InstrumentItem = {
  id: "D11.intro",
  section: "D11",
  text: "PREVENTION, WELLNESS & LEGAL COMPLIANCE - Proactive health programs, legal protections beyond minimums, and workplace safety measures.",
  route: "/survey/dimensions/11",
  type: "text",
  fieldName: "d11_intro"
};

// D11.a - Main grid items (13 items)
const D11A_ITEMS: InstrumentItem[] = [
  {
    id: "D11.a1",
    section: "D11",
    text: "At least 70% coverage for regionally / locally recommended screenings",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true,
    multiCountryFollowUp: true,
    conditional: true // Triggers D11.1
  },
  {
    id: "D11.a2",
    section: "D11",
    text: "Full or partial coverage for annual health screenings/checkups",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  },
  {
    id: "D11.a3",
    section: "D11",
    text: "Targeted risk-reduction programs",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  },
  {
    id: "D11.a4",
    section: "D11",
    text: "Paid time off for preventive care appointments",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  },
  {
    id: "D11.a5",
    section: "D11",
    text: "Legal protections beyond requirements",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  },
  {
    id: "D11.a6",
    section: "D11",
    text: "Workplace safety assessments to minimize health risks",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  },
  {
    id: "D11.a7",
    section: "D11",
    text: "Regular health education sessions",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  },
  {
    id: "D11.a8",
    section: "D11",
    text: "Individual health assessments (online or in-person)",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  },
  {
    id: "D11.a9",
    section: "D11",
    text: "Genetic screening/counseling",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  },
  {
    id: "D11.a10",
    section: "D11",
    text: "On-site vaccinations",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  },
  {
    id: "D11.a11",
    section: "D11",
    text: "Lifestyle coaching programs",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  },
  {
    id: "D11.a12",
    section: "D11",
    text: "Risk factor tracking/reporting",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  },
  {
    id: "D11.a13",
    section: "D11",
    text: "Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)",
    route: "/survey/dimensions/11",
    type: "likert-4",
    fieldName: "d11a",
    randomize: true
  }
];

// D11.aa - Multi-country follow-up (conditional)
const D11AA_ITEM: InstrumentItem = {
  id: "D11.aa",
  section: "D11",
  text: "Are the Prevention, Wellness & Legal Compliance support options your organization currently offers...?",
  route: "/survey/dimensions/11",
  type: "select",
  fieldName: "d11aa",
  conditional: true,
  required: false
};

// D11.1 - Preventive care services covered at 100% (conditional, multi-select)
const D11_1_ITEMS: InstrumentItem[] = [
  {
    id: "D11.1",
    section: "D11",
    text: "Which early detection and preventive care services are covered for employees at 100% based on regional / locally recommended screenings?",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1",
    conditional: true, // Only if D11.a1 = "Currently offer"
    randomize: true
  },
  // SCREENINGS
  {
    id: "D11.1.1",
    section: "D11",
    text: "Cervical cancer screening (Pap smear/HPV test)",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.2",
    section: "D11",
    text: "Colonoscopy (colorectal cancer)",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.3",
    section: "D11",
    text: "Dense breast tissue screening (ultrasound/MRI)",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.4",
    section: "D11",
    text: "Gastric / stomach cancer screening",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.5",
    section: "D11",
    text: "H. pylori testing",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.6",
    section: "D11",
    text: "Liver cancer screening (AFP test + ultrasound)",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.7",
    section: "D11",
    text: "Lung cancer screening (low-dose CT for high risk)",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.8",
    section: "D11",
    text: "Mammograms (breast cancer)",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.9",
    section: "D11",
    text: "Oral cancer screening",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.10",
    section: "D11",
    text: "Prostate cancer screening (PSA test)",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.11",
    section: "D11",
    text: "Skin cancer screening/full body exam",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.12",
    section: "D11",
    text: "Tuberculosis screening",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.13",
    section: "D11",
    text: "Other screening (specify):",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  // GENETIC TESTING & COUNSELING
  {
    id: "D11.1.14",
    section: "D11",
    text: "BRCA testing (breast/ovarian cancer risk)",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.15",
    section: "D11",
    text: "Lynch syndrome testing (colorectal cancer risk)",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.16",
    section: "D11",
    text: "Multi-gene panel testing",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.17",
    section: "D11",
    text: "Genetic counseling services",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.18",
    section: "D11",
    text: "Other genetic testing (specify):",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  // PREVENTIVE VACCINES
  {
    id: "D11.1.19",
    section: "D11",
    text: "HPV vaccines (cervical cancer prevention)",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.20",
    section: "D11",
    text: "Hepatitis B vaccines (liver cancer prevention)",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.21",
    section: "D11",
    text: "COVID-19 vaccines",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.22",
    section: "D11",
    text: "Influenza vaccines",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.23",
    section: "D11",
    text: "Pneumonia vaccines",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.24",
    section: "D11",
    text: "Shingles vaccines",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  },
  {
    id: "D11.1.25",
    section: "D11",
    text: "Other preventive vaccines (specify):",
    route: "/survey/dimensions/11",
    type: "multi-select",
    fieldName: "d11_1"
  }
];

// D11.b - Open-ended follow-up
const D11B_ITEM: InstrumentItem = {
  id: "D11.b",
  section: "D11",
  text: "What other prevention or wellness initiatives does your organization offer that weren't listed?",
  route: "/survey/dimensions/11",
  type: "textarea",
  fieldName: "d11b",
  required: false
};

// ============================================
// DIMENSION 12: CONTINUOUS IMPROVEMENT & OUTCOMES
// Route: /survey/dimensions/12
// ============================================

const D12_INTRO: InstrumentItem = {
  id: "D12.intro",
  section: "D12",
  text: "CONTINUOUS IMPROVEMENT & OUTCOMES - Systematic measurement, feedback integration, and program evolution based on outcomes.",
  route: "/survey/dimensions/12",
  type: "text",
  fieldName: "d12_intro"
};

// D12.a - Main grid items (8 items)
const D12A_ITEMS: InstrumentItem[] = [
  {
    id: "D12.a1",
    section: "D12",
    text: "Return-to-work success metrics",
    route: "/survey/dimensions/12",
    type: "likert-4",
    fieldName: "d12a",
    randomize: true,
    multiCountryFollowUp: true
  },
  {
    id: "D12.a2",
    section: "D12",
    text: "Employee satisfaction tracking",
    route: "/survey/dimensions/12",
    type: "likert-4",
    fieldName: "d12a",
    randomize: true
  },
  {
    id: "D12.a3",
    section: "D12",
    text: "Business impact/ROI assessment",
    route: "/survey/dimensions/12",
    type: "likert-4",
    fieldName: "d12a",
    randomize: true
  },
  {
    id: "D12.a4",
    section: "D12",
    text: "Regular program enhancements",
    route: "/survey/dimensions/12",
    type: "likert-4",
    fieldName: "d12a",
    randomize: true
  },
  {
    id: "D12.a5",
    section: "D12",
    text: "External benchmarking",
    route: "/survey/dimensions/12",
    type: "likert-4",
    fieldName: "d12a",
    randomize: true
  },
  {
    id: "D12.a6",
    section: "D12",
    text: "Innovation pilots",
    route: "/survey/dimensions/12",
    type: "likert-4",
    fieldName: "d12a",
    randomize: true
  },
  {
    id: "D12.a7",
    section: "D12",
    text: "Employee confidence in employer support",
    route: "/survey/dimensions/12",
    type: "likert-4",
    fieldName: "d12a",
    randomize: true
  },
  {
    id: "D12.a8",
    section: "D12",
    text: "Program utilization analytics",
    route: "/survey/dimensions/12",
    type: "likert-4",
    fieldName: "d12a",
    randomize: true
  }
];

// D12.aa - Multi-country follow-up (conditional)
const D12AA_ITEM: InstrumentItem = {
  id: "D12.aa",
  section: "D12",
  text: "Are the Continuous Improvement measurements your organization currently measures / tracks...?",
  route: "/survey/dimensions/12",
  type: "select",
  fieldName: "d12aa",
  conditional: true,
  required: false
};

// D12.1 - Individual case reviews (conditional)
const D12_1_ITEMS: InstrumentItem[] = [
  {
    id: "D12.1",
    section: "D12",
    text: "Do you review individual employee experiences (not just aggregate data) to identify potential improvements to your programs for employees managing cancer or other serious health conditions?",
    route: "/survey/dimensions/12",
    type: "select",
    fieldName: "d12_1",
    conditional: true, // Only if any D12.a = "Currently measure/track"
    required: true
  },
  {
    id: "D12.1.1",
    section: "D12",
    text: "Yes, using a systematic case review process",
    route: "/survey/dimensions/12",
    type: "select",
    fieldName: "d12_1"
  },
  {
    id: "D12.1.2",
    section: "D12",
    text: "Yes, using ad hoc case reviews",
    route: "/survey/dimensions/12",
    type: "select",
    fieldName: "d12_1"
  },
  {
    id: "D12.1.3",
    section: "D12",
    text: "No, we only review aggregate metrics",
    route: "/survey/dimensions/12",
    type: "select",
    fieldName: "d12_1"
  }
];

// D12.2 - Changes implemented (conditional)
const D12_2_ITEMS: InstrumentItem[] = [
  {
    id: "D12.2",
    section: "D12",
    text: "Over the past 2 years, have individual employee experiences led to specific changes to your programs for employees managing cancer or other serious health conditions?",
    route: "/survey/dimensions/12",
    type: "select",
    fieldName: "d12_2",
    conditional: true, // Only if any D12.a = "Currently measure/track"
    required: true
  },
  {
    id: "D12.2.1",
    section: "D12",
    text: "Yes, several changes implemented",
    route: "/survey/dimensions/12",
    type: "select",
    fieldName: "d12_2"
  },
  {
    id: "D12.2.2",
    section: "D12",
    text: "Yes, a few changes implemented",
    route: "/survey/dimensions/12",
    type: "select",
    fieldName: "d12_2"
  },
  {
    id: "D12.2.3",
    section: "D12",
    text: "No",
    route: "/survey/dimensions/12",
    type: "select",
    fieldName: "d12_2"
  }
];

// D12.b - Open-ended follow-up
const D12B_ITEM: InstrumentItem = {
  id: "D12.b",
  section: "D12",
  text: "What other measurement or continuous improvement practices does your organization use when considering workplace support programs for employees managing cancer or other serious health conditions?",
  route: "/survey/dimensions/12",
  type: "textarea",
  fieldName: "d12b",
  required: false
};

// ============================================
// DIMENSION 13: COMMUNICATION & AWARENESS
// Route: /survey/dimensions/13
// ============================================

const D13_INTRO: InstrumentItem = {
  id: "D13.intro",
  section: "D13",
  text: "COMMUNICATION & AWARENESS - How organizations inform, educate, and engage employees about available workplace support programs for those managing cancer or other serious health conditions.",
  route: "/survey/dimensions/13",
  type: "text",
  fieldName: "d13_intro"
};

// D13.a - Main grid items (9 items) - NOTE: Has 5 response options including "Unsure"
const D13A_ITEMS: InstrumentItem[] = [
  {
    id: "D13.a1",
    section: "D13",
    text: "Proactive communication at point of diagnosis disclosure",
    route: "/survey/dimensions/13",
    type: "likert-5", // Special: includes "Unsure" option
    fieldName: "d13a",
    randomize: true,
    multiCountryFollowUp: true
  },
  {
    id: "D13.a2",
    section: "D13",
    text: "Dedicated program website or portal",
    route: "/survey/dimensions/13",
    type: "likert-5",
    fieldName: "d13a",
    randomize: true
  },
  {
    id: "D13.a3",
    section: "D13",
    text: "Regular company-wide awareness campaigns (at least quarterly)",
    route: "/survey/dimensions/13",
    type: "likert-5",
    fieldName: "d13a",
    randomize: true
  },
  {
    id: "D13.a4",
    section: "D13",
    text: "New hire orientation coverage",
    route: "/survey/dimensions/13",
    type: "likert-5",
    fieldName: "d13a",
    randomize: true
  },
  {
    id: "D13.a5",
    section: "D13",
    text: "Manager toolkit for cascade communications",
    route: "/survey/dimensions/13",
    type: "likert-5",
    fieldName: "d13a",
    randomize: true
  },
  {
    id: "D13.a6",
    section: "D13",
    text: "Employee testimonials/success stories",
    route: "/survey/dimensions/13",
    type: "likert-5",
    fieldName: "d13a",
    randomize: true
  },
  {
    id: "D13.a7",
    section: "D13",
    text: "Multi-channel communication strategy",
    route: "/survey/dimensions/13",
    type: "likert-5",
    fieldName: "d13a",
    randomize: true
  },
  {
    id: "D13.a8",
    section: "D13",
    text: "Family/caregiver communication inclusion",
    route: "/survey/dimensions/13",
    type: "likert-5",
    fieldName: "d13a",
    randomize: true
  },
  {
    id: "D13.a9",
    section: "D13",
    text: "Anonymous information access options",
    route: "/survey/dimensions/13",
    type: "likert-5",
    fieldName: "d13a",
    randomize: true
  }
];

// D13.aa - Multi-country follow-up (conditional)
const D13AA_ITEM: InstrumentItem = {
  id: "D13.aa",
  section: "D13",
  text: "Are the Communication & Awareness approaches your organization currently uses...?",
  route: "/survey/dimensions/13",
  type: "select",
  fieldName: "d13aa",
  conditional: true,
  required: false
};

// D13.b - Open-ended follow-up
const D13B_ITEM: InstrumentItem = {
  id: "D13.b",
  section: "D13",
  text: "What other communication or awareness approaches does your organization use that weren't listed?",
  route: "/survey/dimensions/13",
  type: "textarea",
  fieldName: "d13b",
  required: false
};

// D13.1 - Communication frequency (required)
const D13_1_ITEMS: InstrumentItem[] = [
  {
    id: "D13.1",
    section: "D13",
    text: "How frequently does your organization communicate about workplace support programs for employees managing cancer or other serious health conditions?",
    route: "/survey/dimensions/13",
    type: "select",
    fieldName: "d13_1",
    required: true
  },
  {
    id: "D13.1.1",
    section: "D13",
    text: "Monthly or more often",
    route: "/survey/dimensions/13",
    type: "select",
    fieldName: "d13_1"
  },
  {
    id: "D13.1.2",
    section: "D13",
    text: "Quarterly",
    route: "/survey/dimensions/13",
    type: "select",
    fieldName: "d13_1"
  },
  {
    id: "D13.1.3",
    section: "D13",
    text: "Twice per year",
    route: "/survey/dimensions/13",
    type: "select",
    fieldName: "d13_1"
  },
  {
    id: "D13.1.4",
    section: "D13",
    text: "Annually (typically during enrollment or on World Cancer Day)",
    route: "/survey/dimensions/13",
    type: "select",
    fieldName: "d13_1"
  },
  {
    id: "D13.1.5",
    section: "D13",
    text: "Only when asked/reactive only",
    route: "/survey/dimensions/13",
    type: "select",
    fieldName: "d13_1"
  },
  {
    id: "D13.1.6",
    section: "D13",
    text: "No regular communication schedule",
    route: "/survey/dimensions/13",
    type: "select",
    fieldName: "d13_1"
  }
];

// ============================================
// COMBINED EXPORTS
// ============================================

export const D11_ITEMS = [
  D11_INTRO,
  ...D11A_ITEMS,
  D11AA_ITEM,
  ...D11_1_ITEMS,
  D11B_ITEM
];

export const D12_ITEMS = [
  D12_INTRO,
  ...D12A_ITEMS,
  D12AA_ITEM,
  ...D12_1_ITEMS,
  ...D12_2_ITEMS,
  D12B_ITEM
];

export const D13_ITEMS = [
  D13_INTRO,
  ...D13A_ITEMS,
  D13AA_ITEM,
  D13B_ITEM,
  ...D13_1_ITEMS
];

// All items for dimensions 11-13
export const ALL_DIMENSIONS_11_13_ITEMS = [
  ...D11_ITEMS,
  ...D12_ITEMS,
  ...D13_ITEMS
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getItemsBySection(section: string): InstrumentItem[] {
  return ALL_DIMENSIONS_11_13_ITEMS.filter(item => item.section === section);
}

export function getItemsByRoute(route: string): InstrumentItem[] {
  return ALL_DIMENSIONS_11_13_ITEMS.filter(item => item.route === route);
}

export function getItemsByFieldName(fieldName: string): InstrumentItem[] {
  return ALL_DIMENSIONS_11_13_ITEMS.filter(item => item.fieldName === fieldName);
}

// ============================================
// SUMMARY STATISTICS
// ============================================

export const DIMENSION_11_SUMMARY = {
  id: "D11",
  title: "Prevention, Wellness & Legal Compliance",
  totalItems: D11_ITEMS.length,
  gridItems: 13,
  conditionalItems: 27, // D11.1 has 25 preventive services + D11.aa + D11.b
  route: "/survey/dimensions/11",
  storageKey: "dimension11_data",
  completionFlag: "dimension11_complete"
};

export const DIMENSION_12_SUMMARY = {
  id: "D12",
  title: "Continuous Improvement & Outcomes",
  totalItems: D12_ITEMS.length,
  gridItems: 8,
  conditionalItems: 8, // D12.aa + D12.1 (3 options) + D12.2 (3 options) + D12.b
  route: "/survey/dimensions/12",
  storageKey: "dimension12_data",
  completionFlag: "dimension12_complete"
};

export const DIMENSION_13_SUMMARY = {
  id: "D13",
  title: "Communication & Awareness",
  totalItems: D13_ITEMS.length,
  gridItems: 9,
  conditionalItems: 9, // D13.aa + D13.b + D13.1 (7 options)
  route: "/survey/dimensions/13",
  storageKey: "dimension13_data",
  completionFlag: "dimension13_complete"
};

export const DIMENSIONS_11_13_SUMMARY = {
  totalDimensions: 3,
  totalItems: ALL_DIMENSIONS_11_13_ITEMS.length,
  dimensions: [
    DIMENSION_11_SUMMARY,
    DIMENSION_12_SUMMARY,
    DIMENSION_13_SUMMARY
  ]
};

// ============================================
// RESPONSE OPTIONS
// ============================================

export const LIKERT_4_OPTIONS = [
  "Not able to offer in foreseeable future",
  "Assessing feasibility",
  "In active planning / development",
  "Currently offer"
];

export const LIKERT_5_OPTIONS_D13 = [
  "Not able to utilize in foreseeable future",
  "Assessing feasibility",
  "In active planning / development",
  "Currently use",
  "Unsure"
];

export const MULTI_COUNTRY_OPTIONS = [
  "Only available in select locations",
  "Vary across locations",
  "Generally consistent across all locations"
];

// ============================================
// NOTES
// ============================================

/*
SPECIAL CONSIDERATIONS:

D11 - Prevention & Wellness:
- Has largest conditional follow-up (D11.1) with 25 preventive care items
- Organized into 3 categories: Screenings, Genetic Testing, Vaccines
- Each category has "Other (specify)" option

D12 - Continuous Improvement:
- Uses "Currently measure/track" instead of "Currently offer"
- Two sequential conditional questions (D12.1 and D12.2)
- Focuses on measurement and feedback loops

D13 - Communication:
- UNIQUE: Uses 5-point scale with "Unsure" option
- D13.1 (frequency) is REQUIRED (not conditional)
- Uses "Currently use" instead of "Currently offer"
- Focused on awareness and information dissemination
*/

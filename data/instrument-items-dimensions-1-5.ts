// data/instrument-items-dimensions-1-5.ts
// Dimensions 1-5 - Complete Data Dictionary
// Dashboard: 13 Dimensions of Support (First 5)

export interface InstrumentItem {
  id: string;
  section: string;
  text: string;
  route: string;
  type: 'text' | 'select' | 'multi-select' | 'likert-4' | 'textarea';
  fieldName?: string;
  weight?: number;
  required?: boolean;
  conditional?: boolean;
  gridItem?: boolean; // Part of likert grid
}

// Standard Likert-4 response options for all dimension grids
const LIKERT_4_OPTIONS = [
  "Currently offer",
  "Plan to offer within the next 12 months",
  "Assessing feasibility",
  "Not able to offer in foreseeable future"
];

// ============================================
// DIMENSION 1: MEDICAL LEAVE & FLEXIBILITY
// Route: /survey/dimensions/1
// ============================================

const D1_ITEMS: InstrumentItem[] = [
  {
    id: "D1.intro",
    section: "D1",
    text: "MEDICAL LEAVE & FLEXIBILITY - Time off policies and schedule adaptations that enable employees to receive treatment without sacrificing job security or income.",
    route: "/survey/dimensions/1",
    type: "likert-4",
  },
  {
    id: "D1.note",
    section: "D1",
    text: "We recognize that implementation may vary based on country/jurisdiction-specific laws and regulations.",
    route: "/survey/dimensions/1",
    type: "likert-4",
  },
  
  // Main Grid Items
  {
    id: "D1.a1",
    section: "D1",
    text: "Paid medical leave beyond local / legal requirements",
    route: "/survey/dimensions/1",
    type: "likert-4",
    fieldName: "d1a",
    gridItem: true,
  },
  {
    id: "D1.a2",
    section: "D1",
    text: "Intermittent leave beyond local / legal requirements",
    route: "/survey/dimensions/1",
    type: "likert-4",
    fieldName: "d1a",
    gridItem: true,
  },
  {
    id: "D1.a3",
    section: "D1",
    text: "Flexible work hours during treatment (e.g., varying start/end times, compressed schedules)",
    route: "/survey/dimensions/1",
    type: "likert-4",
    fieldName: "d1a",
    gridItem: true,
  },
  {
    id: "D1.a4",
    section: "D1",
    text: "Remote work options with full benefits",
    route: "/survey/dimensions/1",
    type: "likert-4",
    fieldName: "d1a",
    gridItem: true,
  },
  {
    id: "D1.a5",
    section: "D1",
    text: "Job protection beyond local / legal requirements",
    route: "/survey/dimensions/1",
    type: "likert-4",
    fieldName: "d1a",
    gridItem: true,
  },
  {
    id: "D1.a6",
    section: "D1",
    text: "Leave donation bank (employees can donate PTO to colleagues)",
    route: "/survey/dimensions/1",
    type: "likert-4",
    fieldName: "d1a",
    gridItem: true,
  },
  {
    id: "D1.a7",
    section: "D1",
    text: "Disability pay top-up (employer adds to disability insurance)",
    route: "/survey/dimensions/1",
    type: "likert-4",
    fieldName: "d1a",
    gridItem: true,
  },
  
  // Follow-up questions (conditional)
  {
    id: "D1.1",
    section: "D1",
    text: "How many additional weeks of paid medical leave does your organization provide beyond legal requirements?",
    route: "/survey/dimensions/1",
    type: "text",
    fieldName: "d1_1",
    conditional: true,
  },
  {
    id: "D1.2",
    section: "D1",
    text: "What are the parameters for intermittent leave?",
    route: "/survey/dimensions/1",
    type: "multi-select",
    fieldName: "d1_2",
    conditional: true,
  },
  {
    id: "D1.3",
    section: "D1",
    text: "Are flexible work hours available during treatment?",
    route: "/survey/dimensions/1",
    type: "select",
    fieldName: "d1_3",
    conditional: true,
  },
  {
    id: "D1.4",
    section: "D1",
    text: "Are remote work options available with full benefits during treatment?",
    route: "/survey/dimensions/1",
    type: "select",
    fieldName: "d1_4",
    conditional: true,
  },
  {
    id: "D1.5",
    section: "D1",
    text: "How long is job protection guaranteed beyond legal requirements?",
    route: "/survey/dimensions/1",
    type: "text",
    fieldName: "d1_5",
    conditional: true,
  },
  {
    id: "D1.6",
    section: "D1",
    text: "What percentage does the employer add to disability insurance?",
    route: "/survey/dimensions/1",
    type: "text",
    fieldName: "d1_6",
    conditional: true,
  },
];

// ============================================
// DIMENSION 2: INSURANCE & FINANCIAL PROTECTION
// Route: /survey/dimensions/2
// ============================================

const D2_ITEMS: InstrumentItem[] = [
  {
    id: "D2.intro",
    section: "D2",
    text: "INSURANCE & FINANCIAL PROTECTION - Financial protections that prevent economic hardship during treatment, including comprehensive coverage and expense assistance.",
    route: "/survey/dimensions/2",
    type: "likert-4",
  },
  {
    id: "D2.note",
    section: "D2",
    text: "We recognize that implementation may vary based on country/jurisdiction-specific laws and regulations.",
    route: "/survey/dimensions/2",
    type: "likert-4",
  },
  
  // Main Grid Items
  {
    id: "D2.a1",
    section: "D2",
    text: "Coverage for clinical trials and experimental treatments not covered by standard health insurance",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a2",
    section: "D2",
    text: "Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a3",
    section: "D2",
    text: "Paid time off for clinical trial participation",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a4",
    section: "D2",
    text: "Set out-of-pocket maximums (for in-network single coverage)",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a5",
    section: "D2",
    text: "Travel/lodging reimbursement for specialized care beyond insurance coverage",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a6",
    section: "D2",
    text: "Financial counseling services",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a7",
    section: "D2",
    text: "Voluntary supplemental illness insurance (with employer contribution)",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a8",
    section: "D2",
    text: "Real-time cost estimator tools",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a9",
    section: "D2",
    text: "Insurance advocacy/pre-authorization support",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a10",
    section: "D2",
    text: "$0 copay for specialty drugs",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a11",
    section: "D2",
    text: "Hardship grants program funded by employer",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a12",
    section: "D2",
    text: "Tax/estate planning assistance",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a13",
    section: "D2",
    text: "Short-term disability covering 60%+ of salary",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a14",
    section: "D2",
    text: "Long-term disability covering 60%+ of salary",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a15",
    section: "D2",
    text: "Employer-paid disability insurance supplements",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a16",
    section: "D2",
    text: "Guaranteed job protection",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a17",
    section: "D2",
    text: "Accelerated life insurance benefits (partial payout for terminal / critical illness)",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  {
    id: "D2.a18",
    section: "D2",
    text: "Health benefits continuation at employee rates during leave",
    route: "/survey/dimensions/2",
    type: "likert-4",
    fieldName: "d2a",
    gridItem: true,
  },
  
  // Follow-up questions (conditional)
  {
    id: "D2.1",
    section: "D2",
    text: "Which advanced treatments are covered?",
    route: "/survey/dimensions/2",
    type: "multi-select",
    fieldName: "d2_1",
    conditional: true,
  },
  {
    id: "D2.5",
    section: "D2",
    text: "During medical leave, how do health insurance premiums work?",
    route: "/survey/dimensions/2",
    type: "select",
    fieldName: "d2_5",
    conditional: true,
  },
  {
    id: "D2.6",
    section: "D2",
    text: "Who provides financial counseling?",
    route: "/survey/dimensions/2",
    type: "multi-select",
    fieldName: "d2_6",
    conditional: true,
  },
];

// ============================================
// DIMENSION 3: MANAGER PREPAREDNESS & CAPABILITY
// Route: /survey/dimensions/3
// ============================================

const D3_ITEMS: InstrumentItem[] = [
  {
    id: "D3.intro",
    section: "D3",
    text: "MANAGER PREPAREDNESS & CAPABILITY - Training and resources that equip managers to support employees managing cancer or other serious health conditions.",
    route: "/survey/dimensions/3",
    type: "likert-4",
  },
  {
    id: "D3.note",
    section: "D3",
    text: "We recognize that implementation may vary based on country/jurisdiction-specific laws and regulations.",
    route: "/survey/dimensions/3",
    type: "likert-4",
  },
  
  // Main Grid Items
  {
    id: "D3.a1",
    section: "D3",
    text: "Manager training on supporting employees with serious medical conditions and their teams",
    route: "/survey/dimensions/3",
    type: "likert-4",
    fieldName: "d3a",
    gridItem: true,
  },
  {
    id: "D3.a2",
    section: "D3",
    text: "Clear escalation protocol for manager response",
    route: "/survey/dimensions/3",
    type: "likert-4",
    fieldName: "d3a",
    gridItem: true,
  },
  {
    id: "D3.a3",
    section: "D3",
    text: "Senior leader coaching on supporting impacted employees",
    route: "/survey/dimensions/3",
    type: "likert-4",
    fieldName: "d3a",
    gridItem: true,
  },
  {
    id: "D3.a4",
    section: "D3",
    text: "Manager evaluations include how well they support impacted employees",
    route: "/survey/dimensions/3",
    type: "likert-4",
    fieldName: "d3a",
    gridItem: true,
  },
  {
    id: "D3.a5",
    section: "D3",
    text: "Manager peer support / community building",
    route: "/survey/dimensions/3",
    type: "likert-4",
    fieldName: "d3a",
    gridItem: true,
  },
  
  // Follow-up questions (conditional)
  {
    id: "D3.1",
    section: "D3",
    text: "Is manager training required or optional?",
    route: "/survey/dimensions/3",
    type: "select",
    fieldName: "d3_1",
    conditional: true,
  },
  {
    id: "D3.1_options",
    section: "D3",
    text: "Training format options: Required for all managers, Required for managers with affected employees, Optional but encouraged, Available upon request",
    route: "/survey/dimensions/3",
    type: "select",
    fieldName: "d3_1",
    conditional: true,
  },
];

// ============================================
// DIMENSION 4: NAVIGATION & EXPERT RESOURCES
// Route: /survey/dimensions/4
// ============================================

const D4_ITEMS: InstrumentItem[] = [
  {
    id: "D4.intro",
    section: "D4",
    text: "NAVIGATION & EXPERT RESOURCES - Resources that help employees understand benefits, access treatment, and receive expert support.",
    route: "/survey/dimensions/4",
    type: "likert-4",
  },
  {
    id: "D4.note",
    section: "D4",
    text: "We recognize that implementation may vary based on country/jurisdiction-specific laws and regulations.",
    route: "/survey/dimensions/4",
    type: "likert-4",
  },
  
  // Main Grid Items
  {
    id: "D4.a1",
    section: "D4",
    text: "Dedicated navigation support to help employees understand benefits and access medical care",
    route: "/survey/dimensions/4",
    type: "likert-4",
    fieldName: "d4a",
    gridItem: true,
  },
  {
    id: "D4.a2",
    section: "D4",
    text: "Benefits optimization assistance (maximizing coverage, minimizing costs)",
    route: "/survey/dimensions/4",
    type: "likert-4",
    fieldName: "d4a",
    gridItem: true,
  },
  {
    id: "D4.a3",
    section: "D4",
    text: "Online tools, apps, or portals for health/benefits support",
    route: "/survey/dimensions/4",
    type: "likert-4",
    fieldName: "d4a",
    gridItem: true,
  },
  {
    id: "D4.a4",
    section: "D4",
    text: "Second opinion services or facilitation",
    route: "/survey/dimensions/4",
    type: "likert-4",
    fieldName: "d4a",
    gridItem: true,
  },
  {
    id: "D4.a5",
    section: "D4",
    text: "Care coordination for complex conditions",
    route: "/survey/dimensions/4",
    type: "likert-4",
    fieldName: "d4a",
    gridItem: true,
  },
  {
    id: "D4.a6",
    section: "D4",
    text: "Specialized treatment center networks",
    route: "/survey/dimensions/4",
    type: "likert-4",
    fieldName: "d4a",
    gridItem: true,
  },
  {
    id: "D4.a7",
    section: "D4",
    text: "Travel support for specialized care",
    route: "/survey/dimensions/4",
    type: "likert-4",
    fieldName: "d4a",
    gridItem: true,
  },
  {
    id: "D4.a8",
    section: "D4",
    text: "Clinical guidance and navigation",
    route: "/survey/dimensions/4",
    type: "likert-4",
    fieldName: "d4a",
    gridItem: true,
  },
  {
    id: "D4.a9",
    section: "D4",
    text: "Medication access and affordability programs",
    route: "/survey/dimensions/4",
    type: "likert-4",
    fieldName: "d4a",
    gridItem: true,
  },
  
  // Follow-up questions (conditional)
  {
    id: "D4.1a",
    section: "D4",
    text: "Who provides navigation support? (Select ALL that apply)",
    route: "/survey/dimensions/4",
    type: "multi-select",
    fieldName: "d4_1a",
    conditional: true,
  },
  {
    id: "D4.1a_options",
    section: "D4",
    text: "Options: Credentialed internal staff, External vendor/service, Through health insurance carrier, Through specialized medical provider, Partnership with specialized health organization, Other",
    route: "/survey/dimensions/4",
    type: "multi-select",
    fieldName: "d4_1a",
    conditional: true,
  },
  {
    id: "D4.1b",
    section: "D4",
    text: "Which services are available through navigation support? (Select ALL that apply)",
    route: "/survey/dimensions/4",
    type: "multi-select",
    fieldName: "d4_1b",
    conditional: true,
  },
  {
    id: "D4.1b_options",
    section: "D4",
    text: "Options: Clinical guidance, Insurance navigation, Mental health support, Caregiver resources, Financial planning, Return-to-work planning, Treatment decision support/second opinion, Company-sponsored peer support networks, Other",
    route: "/survey/dimensions/4",
    type: "multi-select",
    fieldName: "d4_1b",
    conditional: true,
  },
];

// ============================================
// DIMENSION 5: WORKPLACE ACCOMMODATIONS
// Route: /survey/dimensions/5
// ============================================

const D5_ITEMS: InstrumentItem[] = [
  {
    id: "D5.intro",
    section: "D5",
    text: "WORKPLACE ACCOMMODATIONS & MODIFICATIONS - Workplace changes that enable continued productivity during and after treatment.",
    route: "/survey/dimensions/5",
    type: "likert-4",
  },
  {
    id: "D5.note",
    section: "D5",
    text: "We recognize that implementation may vary based on country/jurisdiction-specific laws and regulations.",
    route: "/survey/dimensions/5",
    type: "likert-4",
  },
  
  // Main Grid Items
  {
    id: "D5.a1",
    section: "D5",
    text: "Physical workspace modifications",
    route: "/survey/dimensions/5",
    type: "likert-4",
    fieldName: "d5a",
    gridItem: true,
  },
  {
    id: "D5.a2",
    section: "D5",
    text: "Cognitive / fatigue support tools",
    route: "/survey/dimensions/5",
    type: "likert-4",
    fieldName: "d5a",
    gridItem: true,
  },
  {
    id: "D5.a3",
    section: "D5",
    text: "Ergonomic equipment funding",
    route: "/survey/dimensions/5",
    type: "likert-4",
    fieldName: "d5a",
    gridItem: true,
  },
  {
    id: "D5.a4",
    section: "D5",
    text: "Flexible scheduling options",
    route: "/survey/dimensions/5",
    type: "likert-4",
    fieldName: "d5a",
    gridItem: true,
  },
  {
    id: "D5.a5",
    section: "D5",
    text: "Remote work capability",
    route: "/survey/dimensions/5",
    type: "likert-4",
    fieldName: "d5a",
    gridItem: true,
  },
  {
    id: "D5.a6",
    section: "D5",
    text: "Rest areas / quiet spaces",
    route: "/survey/dimensions/5",
    type: "likert-4",
    fieldName: "d5a",
    gridItem: true,
  },
  {
    id: "D5.a7",
    section: "D5",
    text: "Priority parking",
    route: "/survey/dimensions/5",
    type: "likert-4",
    fieldName: "d5a",
    gridItem: true,
  },
  {
    id: "D5.a8",
    section: "D5",
    text: "Temporary role redesigns",
    route: "/survey/dimensions/5",
    type: "likert-4",
    fieldName: "d5a",
    gridItem: true,
  },
  {
    id: "D5.a9",
    section: "D5",
    text: "Assistive technology catalog",
    route: "/survey/dimensions/5",
    type: "likert-4",
    fieldName: "d5a",
    gridItem: true,
  },
  {
    id: "D5.a10",
    section: "D5",
    text: "Transportation reimbursement",
    route: "/survey/dimensions/5",
    type: "likert-4",
    fieldName: "d5a",
    gridItem: true,
  },
  {
    id: "D5.a11",
    section: "D5",
    text: "Policy accommodations (e.g., dress code flexibility, headphone use)",
    route: "/survey/dimensions/5",
    type: "likert-4",
    fieldName: "d5a",
    gridItem: true,
  },
  
  // Follow-up questions (conditional)
  {
    id: "D5.1",
    section: "D5",
    text: "What types of physical workspace modifications are available?",
    route: "/survey/dimensions/5",
    type: "multi-select",
    fieldName: "d5_1",
    conditional: true,
  },
  {
    id: "D5.2",
    section: "D5",
    text: "How are workspace modification requests processed?",
    route: "/survey/dimensions/5",
    type: "select",
    fieldName: "d5_2",
    conditional: true,
  },
];

// ============================================
// MULTI-COUNTRY FOLLOW-UP (All Dimensions)
// ============================================

const MULTI_COUNTRY_ITEMS: InstrumentItem[] = [
  {
    id: "D_AA.question",
    section: "MULTI_COUNTRY",
    text: "Are the support options your organization currently offers...? (Select ONE)",
    route: "/survey/dimensions/*",
    type: "select",
    fieldName: "d_aa",
    conditional: true,
  },
  {
    id: "D_AA.1",
    section: "MULTI_COUNTRY",
    text: "Only available in select locations",
    route: "/survey/dimensions/*",
    type: "select",
    fieldName: "d_aa",
  },
  {
    id: "D_AA.2",
    section: "MULTI_COUNTRY",
    text: "Vary across locations",
    route: "/survey/dimensions/*",
    type: "select",
    fieldName: "d_aa",
  },
  {
    id: "D_AA.3",
    section: "MULTI_COUNTRY",
    text: "Generally consistent across all locations",
    route: "/survey/dimensions/*",
    type: "select",
    fieldName: "d_aa",
  },
];

// Open-ended follow-up for all dimensions
const OPEN_ENDED_ITEMS: InstrumentItem[] = [
  {
    id: "D_B.question",
    section: "OPEN_ENDED",
    text: "What other [dimension name] benefits does your organization offer that weren't listed? (Please be as specific and detailed as possible)",
    route: "/survey/dimensions/*",
    type: "textarea",
    fieldName: "d_b",
  },
  {
    id: "D_B.checkbox",
    section: "OPEN_ENDED",
    text: "[ ] No other benefits",
    route: "/survey/dimensions/*",
    type: "select",
    fieldName: "d_b_none",
  },
];

// ============================================
// MASTER EXPORTS
// ============================================

export const DIMENSION_1_ITEMS = D1_ITEMS;
export const DIMENSION_2_ITEMS = D2_ITEMS;
export const DIMENSION_3_ITEMS = D3_ITEMS;
export const DIMENSION_4_ITEMS = D4_ITEMS;
export const DIMENSION_5_ITEMS = D5_ITEMS;

export const ALL_DIMENSIONS_1_5_ITEMS = [
  ...D1_ITEMS,
  ...D2_ITEMS,
  ...D3_ITEMS,
  ...D4_ITEMS,
  ...D5_ITEMS,
  ...MULTI_COUNTRY_ITEMS,
  ...OPEN_ENDED_ITEMS,
];

// Lookup functions
export function getDimensionItemById(id: string): InstrumentItem | undefined {
  return ALL_DIMENSIONS_1_5_ITEMS.find(item => item.id === id);
}

export function getDimensionItemsBySection(section: string): InstrumentItem[] {
  return ALL_DIMENSIONS_1_5_ITEMS.filter(item => item.section === section);
}

export function getDimensionItemsByRoute(route: string): InstrumentItem[] {
  return ALL_DIMENSIONS_1_5_ITEMS.filter(item => item.route === route);
}

export function getDimensionGridItems(dimension: string): InstrumentItem[] {
  return ALL_DIMENSIONS_1_5_ITEMS.filter(item => item.section === dimension && item.gridItem === true);
}

// Summary stats
export const DIMENSIONS_1_5_SUMMARY = {
  dimension1: {
    name: "Medical Leave & Flexibility",
    totalItems: D1_ITEMS.length,
    gridItems: D1_ITEMS.filter(i => i.gridItem).length,
    route: '/survey/dimensions/1',
    storageKey: 'dimension1_data',
    completionFlag: 'dimension1_complete',
  },
  dimension2: {
    name: "Insurance & Financial Protection",
    totalItems: D2_ITEMS.length,
    gridItems: D2_ITEMS.filter(i => i.gridItem).length,
    route: '/survey/dimensions/2',
    storageKey: 'dimension2_data',
    completionFlag: 'dimension2_complete',
  },
  dimension3: {
    name: "Manager Preparedness & Capability",
    totalItems: D3_ITEMS.length,
    gridItems: D3_ITEMS.filter(i => i.gridItem).length,
    route: '/survey/dimensions/3',
    storageKey: 'dimension3_data',
    completionFlag: 'dimension3_complete',
  },
  dimension4: {
    name: "Navigation & Expert Resources",
    totalItems: D4_ITEMS.length,
    gridItems: D4_ITEMS.filter(i => i.gridItem).length,
    route: '/survey/dimensions/4',
    storageKey: 'dimension4_data',
    completionFlag: 'dimension4_complete',
  },
  dimension5: {
    name: "Workplace Accommodations",
    totalItems: D5_ITEMS.length,
    gridItems: D5_ITEMS.filter(i => i.gridItem).length,
    route: '/survey/dimensions/5',
    storageKey: 'dimension5_data',
    completionFlag: 'dimension5_complete',
  },
};

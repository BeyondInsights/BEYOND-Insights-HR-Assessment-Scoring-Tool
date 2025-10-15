// data/instrument-items-dimensions-6-10.ts
// Dimensions 6-10 - Complete Data Dictionary
// Dashboard Dimensions Section: D6 through D10

export interface InstrumentItem {
  id: string;
  section: string;
  text: string;
  route: string;
  type: 'text' | 'select' | 'multi-select' | 'likert-4' | 'likert-5' | 'textarea';
  fieldName?: string; // localStorage key
  weight?: number;
  required?: boolean;
  conditional?: boolean; // Triggers based on other response
  exclusive?: boolean; // Mutually exclusive with other options
  randomize?: boolean; // Should be shuffled/randomized
  multiCountryFollowUp?: boolean; // Has D#.aa follow-up question
}

// ============================================
// DIMENSION 6: CULTURE & PSYCHOLOGICAL SAFETY
// Route: /survey/dimensions/6
// ============================================

const D6_INTRO: InstrumentItem = {
  id: "D6.intro",
  section: "D6",
  text: "CULTURE & PSYCHOLOGICAL SAFETY - The environment for employees to feel safe discussing medical conditions, protected from discrimination, and supported without judgment.",
  route: "/survey/dimensions/6",
  type: "text",
  fieldName: "d6_intro"
};

// D6.a - Main grid items (12 items)
const D6A_ITEMS: InstrumentItem[] = [
  {
    id: "D6.a1",
    section: "D6",
    text: "Strong anti-discrimination policies specific to health conditions",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true,
    multiCountryFollowUp: true
  },
  {
    id: "D6.a2",
    section: "D6",
    text: "Clear process for confidential health disclosures",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true
  },
  {
    id: "D6.a3",
    section: "D6",
    text: "Manager training on handling sensitive health information",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true
  },
  {
    id: "D6.a4",
    section: "D6",
    text: "Written anti-retaliation policies for health disclosures",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true
  },
  {
    id: "D6.a5",
    section: "D6",
    text: "Employee peer support groups (internal employees with shared experience)",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true,
    conditional: true // Triggers D6.1
  },
  {
    id: "D6.a6",
    section: "D6",
    text: "Professional-led support groups (external facilitator/counselor)",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true
  },
  {
    id: "D6.a7",
    section: "D6",
    text: "Stigma-reduction initiatives",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true
  },
  {
    id: "D6.a8",
    section: "D6",
    text: "Specialized emotional counseling",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true
  },
  {
    id: "D6.a9",
    section: "D6",
    text: "Optional open health dialogue forums",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true
  },
  {
    id: "D6.a10",
    section: "D6",
    text: "Inclusive communication guidelines",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true
  },
  {
    id: "D6.a11",
    section: "D6",
    text: "Confidential HR channel for health benefits, policies and insurance-related questions",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true
  },
  {
    id: "D6.a12",
    section: "D6",
    text: "Anonymous benefits navigation tool or website (no login required)",
    route: "/survey/dimensions/6",
    type: "likert-4",
    fieldName: "d6a",
    randomize: true
  }
];

// D6.aa - Multi-country follow-up (conditional)
const D6AA_ITEM: InstrumentItem = {
  id: "D6.aa",
  section: "D6",
  text: "Are the Culture & Psychological Safety support options your organization currently offers...?",
  route: "/survey/dimensions/6",
  type: "select",
  fieldName: "d6aa",
  conditional: true, // Only if S9A != "No other countries" AND at least one item offered
  required: false
};

// D6.b - Open-ended follow-up
const D6B_ITEM: InstrumentItem = {
  id: "D6.b",
  section: "D6",
  text: "What other culture and psychological safety supports does your organization offer that weren't listed?",
  route: "/survey/dimensions/6",
  type: "textarea",
  fieldName: "d6b",
  required: false
};

// D6.2 - Measuring psychological safety (conditional)
const D6_2_ITEMS: InstrumentItem[] = [
  {
    id: "D6.2",
    section: "D6",
    text: "How do you measure psychological safety for employees managing cancer or other serious health conditions?",
    route: "/survey/dimensions/6",
    type: "multi-select",
    fieldName: "d6_2",
    conditional: true, // Only if any D6.a = "Currently offer"
    randomize: true
  },
  {
    id: "D6.2.1",
    section: "D6",
    text: "Regular pulse surveys",
    route: "/survey/dimensions/6",
    type: "multi-select",
    fieldName: "d6_2"
  },
  {
    id: "D6.2.2",
    section: "D6",
    text: "Focus groups",
    route: "/survey/dimensions/6",
    type: "multi-select",
    fieldName: "d6_2"
  },
  {
    id: "D6.2.3",
    section: "D6",
    text: "Exit interview data",
    route: "/survey/dimensions/6",
    type: "multi-select",
    fieldName: "d6_2"
  },
  {
    id: "D6.2.4",
    section: "D6",
    text: "Manager feedback",
    route: "/survey/dimensions/6",
    type: "multi-select",
    fieldName: "d6_2"
  },
  {
    id: "D6.2.5",
    section: "D6",
    text: "One-on-One discussion with employee",
    route: "/survey/dimensions/6",
    type: "multi-select",
    fieldName: "d6_2"
  },
  {
    id: "D6.2.6",
    section: "D6",
    text: "Some other way (specify)",
    route: "/survey/dimensions/6",
    type: "multi-select",
    fieldName: "d6_2"
  },
  {
    id: "D6.2.7",
    section: "D6",
    text: "Don't formally measure",
    route: "/survey/dimensions/6",
    type: "multi-select",
    fieldName: "d6_2",
    exclusive: true
  }
];

// ============================================
// DIMENSION 7: CAREER CONTINUITY & ADVANCEMENT
// Route: /survey/dimensions/7
// ============================================

const D7_INTRO: InstrumentItem = {
  id: "D7.intro",
  section: "D7",
  text: "CAREER CONTINUITY & ADVANCEMENT - Protections for career advancement opportunities and professional development during and after treatment.",
  route: "/survey/dimensions/7",
  type: "text",
  fieldName: "d7_intro"
};

// D7.a - Main grid items (9 items)
const D7A_ITEMS: InstrumentItem[] = [
  {
    id: "D7.a1",
    section: "D7",
    text: "Continued access to training/development",
    route: "/survey/dimensions/7",
    type: "likert-4",
    fieldName: "d7a",
    randomize: true,
    multiCountryFollowUp: true
  },
  {
    id: "D7.a2",
    section: "D7",
    text: "Structured reintegration programs",
    route: "/survey/dimensions/7",
    type: "likert-4",
    fieldName: "d7a",
    randomize: true
  },
  {
    id: "D7.a3",
    section: "D7",
    text: "Peer mentorship program (employees who had similar condition mentoring current employees)",
    route: "/survey/dimensions/7",
    type: "likert-4",
    fieldName: "d7a",
    randomize: true
  },
  {
    id: "D7.a4",
    section: "D7",
    text: "Professional coach/mentor for employees managing cancer or other serious health conditions",
    route: "/survey/dimensions/7",
    type: "likert-4",
    fieldName: "d7a",
    randomize: true
  },
  {
    id: "D7.a5",
    section: "D7",
    text: "Adjusted performance goals/deliverables during treatment and recovery",
    route: "/survey/dimensions/7",
    type: "likert-4",
    fieldName: "d7a",
    randomize: true
  },
  {
    id: "D7.a6",
    section: "D7",
    text: "Career coaching for employees managing cancer or other serious health conditions",
    route: "/survey/dimensions/7",
    type: "likert-4",
    fieldName: "d7a",
    randomize: true
  },
  {
    id: "D7.a7",
    section: "D7",
    text: "Succession planning protections",
    route: "/survey/dimensions/7",
    type: "likert-4",
    fieldName: "d7a",
    randomize: true
  },
  {
    id: "D7.a8",
    section: "D7",
    text: "Project continuity protocols",
    route: "/survey/dimensions/7",
    type: "likert-4",
    fieldName: "d7a",
    randomize: true
  },
  {
    id: "D7.a9",
    section: "D7",
    text: "Optional stay-connected program",
    route: "/survey/dimensions/7",
    type: "likert-4",
    fieldName: "d7a",
    randomize: true
  }
];

// D7.aa - Multi-country follow-up (conditional)
const D7AA_ITEM: InstrumentItem = {
  id: "D7.aa",
  section: "D7",
  text: "Are the Career Continuity & Advancement support options your organization currently offers...?",
  route: "/survey/dimensions/7",
  type: "select",
  fieldName: "d7aa",
  conditional: true,
  required: false
};

// D7.b - Open-ended follow-up
const D7B_ITEM: InstrumentItem = {
  id: "D7.b",
  section: "D7",
  text: "What other career continuity and advancement supports does your organization offer employees managing cancer or other serious health conditions that weren't listed?",
  route: "/survey/dimensions/7",
  type: "textarea",
  fieldName: "d7b",
  required: false
};

// ============================================
// DIMENSION 8: WORK CONTINUATION & RESUMPTION
// Route: /survey/dimensions/8
// ============================================

const D8_INTRO: InstrumentItem = {
  id: "D8.intro",
  section: "D8",
  text: "WORK CONTINUATION & RESUMPTION - Structured, supportive processes for helping employees: Continue working during treatment and recovery, Resume work after medical leave, Manage ongoing treatment needs while working, Navigate the physical and cognitive impacts of treatment.",
  route: "/survey/dimensions/8",
  type: "text",
  fieldName: "d8_intro"
};

// D8.a - Main grid items (12 items)
const D8A_ITEMS: InstrumentItem[] = [
  {
    id: "D8.a1",
    section: "D8",
    text: "Flexible work arrangements during treatment",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true,
    multiCountryFollowUp: true
  },
  {
    id: "D8.a2",
    section: "D8",
    text: "Phased return-to-work plans",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true
  },
  {
    id: "D8.a3",
    section: "D8",
    text: "Workload adjustments during treatment",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true
  },
  {
    id: "D8.a4",
    section: "D8",
    text: "Flexibility for medical setbacks",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true
  },
  {
    id: "D8.a5",
    section: "D8",
    text: "Buddy/mentor pairing for support",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true
  },
  {
    id: "D8.a6",
    section: "D8",
    text: "Structured progress reviews",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true
  },
  {
    id: "D8.a7",
    section: "D8",
    text: "Contingency planning for treatment schedules",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true
  },
  {
    id: "D8.a8",
    section: "D8",
    text: "Long-term success tracking",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true
  },
  {
    id: "D8.a9",
    section: "D8",
    text: "Access to occupational therapy/vocational rehabilitation",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true
  },
  {
    id: "D8.a10",
    section: "D8",
    text: "Online peer support forums",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true
  },
  {
    id: "D8.a11",
    section: "D8",
    text: "Access to specialized work resumption professionals",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true
  },
  {
    id: "D8.a12",
    section: "D8",
    text: "Manager training on supporting team members during treatment/return",
    route: "/survey/dimensions/8",
    type: "likert-4",
    fieldName: "d8a",
    randomize: true
  }
];

// D8.aa - Multi-country follow-up (conditional)
const D8AA_ITEM: InstrumentItem = {
  id: "D8.aa",
  section: "D8",
  text: "Are the Work Continuation & Resumption support options your organization currently offers...?",
  route: "/survey/dimensions/8",
  type: "select",
  fieldName: "d8aa",
  conditional: true,
  required: false
};

// D8.b - Open-ended follow-up
const D8B_ITEM: InstrumentItem = {
  id: "D8.b",
  section: "D8",
  text: "What other work continuation or resumption supports does your organization offer at any location that weren't listed?",
  route: "/survey/dimensions/8",
  type: "textarea",
  fieldName: "d8b",
  required: false
};

// ============================================
// DIMENSION 9: EXECUTIVE COMMITMENT & RESOURCES
// Route: /survey/dimensions/9
// ============================================

const D9_INTRO: InstrumentItem = {
  id: "D9.intro",
  section: "D9",
  text: "EXECUTIVE COMMITMENT & RESOURCES - Visible executive engagement and resource allocation for employee workplace support programs.",
  route: "/survey/dimensions/9",
  type: "text",
  fieldName: "d9_intro"
};

// D9.a - Main grid items (11 items)
const D9A_ITEMS: InstrumentItem[] = [
  {
    id: "D9.a1",
    section: "D9",
    text: "Executive accountability metrics",
    route: "/survey/dimensions/9",
    type: "likert-4",
    fieldName: "d9a",
    randomize: true,
    multiCountryFollowUp: true,
    conditional: true // Triggers D9.3
  },
  {
    id: "D9.a2",
    section: "D9",
    text: "Public success story celebrations",
    route: "/survey/dimensions/9",
    type: "likert-4",
    fieldName: "d9a",
    randomize: true
  },
  {
    id: "D9.a3",
    section: "D9",
    text: "Compensation tied to support outcomes",
    route: "/survey/dimensions/9",
    type: "likert-4",
    fieldName: "d9a",
    randomize: true
  },
  {
    id: "D9.a4",
    section: "D9",
    text: "ESG/CSR reporting inclusion",
    route: "/survey/dimensions/9",
    type: "likert-4",
    fieldName: "d9a",
    randomize: true
  },
  {
    id: "D9.a5",
    section: "D9",
    text: "Year-over-year budget growth",
    route: "/survey/dimensions/9",
    type: "likert-4",
    fieldName: "d9a",
    randomize: true
  },
  {
    id: "D9.a6",
    section: "D9",
    text: "Executive sponsors communicate regularly about workplace support programs",
    route: "/survey/dimensions/9",
    type: "likert-4",
    fieldName: "d9a",
    randomize: true
  },
  {
    id: "D9.a7",
    section: "D9",
    text: "Dedicated budget allocation for serious illness support programs",
    route: "/survey/dimensions/9",
    type: "likert-4",
    fieldName: "d9a",
    randomize: true,
    conditional: true // Triggers D9.2
  },
  {
    id: "D9.a8",
    section: "D9",
    text: "C-suite executive serves as program champion/sponsor",
    route: "/survey/dimensions/9",
    type: "likert-4",
    fieldName: "d9a",
    randomize: true
  },
  {
    id: "D9.a9",
    section: "D9",
    text: "Support programs included in investor/stakeholder communications",
    route: "/survey/dimensions/9",
    type: "likert-4",
    fieldName: "d9a",
    randomize: true
  },
  {
    id: "D9.a10",
    section: "D9",
    text: "Cross-functional executive steering committee for workplace support programs",
    route: "/survey/dimensions/9",
    type: "likert-4",
    fieldName: "d9a",
    randomize: true
  },
  {
    id: "D9.a11",
    section: "D9",
    text: "Support metrics included in annual report/sustainability reporting",
    route: "/survey/dimensions/9",
    type: "likert-4",
    fieldName: "d9a",
    randomize: true
  }
];

// D9.aa - Multi-country follow-up (conditional)
const D9AA_ITEM: InstrumentItem = {
  id: "D9.aa",
  section: "D9",
  text: "Are the Executive Commitment & Resources your organization currently offers...?",
  route: "/survey/dimensions/9",
  type: "select",
  fieldName: "d9aa",
  conditional: true,
  required: false
};

// D9.2 - Budget allocation (conditional)
const D9_2_ITEMS: InstrumentItem[] = [
  {
    id: "D9.2",
    section: "D9",
    text: "How is the budget for workplace support programs allocated?",
    route: "/survey/dimensions/9",
    type: "select",
    fieldName: "d9_2",
    conditional: true, // Only if D9.a7 = "Currently offer"
    required: true
  },
  {
    id: "D9.2.1",
    section: "D9",
    text: "Part of general benefits budget (not separately tracked)",
    route: "/survey/dimensions/9",
    type: "select",
    fieldName: "d9_2"
  },
  {
    id: "D9.2.2",
    section: "D9",
    text: "Dedicated line item in HR / Benefits budget",
    route: "/survey/dimensions/9",
    type: "select",
    fieldName: "d9_2"
  },
  {
    id: "D9.2.3",
    section: "D9",
    text: "Separate budget outside HR (e.g., CSR, DEI)",
    route: "/survey/dimensions/9",
    type: "select",
    fieldName: "d9_2"
  },
  {
    id: "D9.2.4",
    section: "D9",
    text: "Distributed across multiple departments",
    route: "/survey/dimensions/9",
    type: "select",
    fieldName: "d9_2"
  },
  {
    id: "D9.2.5",
    section: "D9",
    text: "Not able to provide this information",
    route: "/survey/dimensions/9",
    type: "select",
    fieldName: "d9_2"
  }
];

// D9.3 - Executive accountability metrics (conditional)
const D9_3_ITEMS: InstrumentItem[] = [
  {
    id: "D9.3",
    section: "D9",
    text: "Which metrics are included in executive accountability?",
    route: "/survey/dimensions/9",
    type: "multi-select",
    fieldName: "d9_3",
    conditional: true, // Only if D9.a1 = "Currently offer"
    required: true,
    randomize: true
  },
  {
    id: "D9.3.1",
    section: "D9",
    text: "Retention of employees with serious medical conditions",
    route: "/survey/dimensions/9",
    type: "multi-select",
    fieldName: "d9_3"
  },
  {
    id: "D9.3.2",
    section: "D9",
    text: "Manager effectiveness in supporting impacted employees",
    route: "/survey/dimensions/9",
    type: "multi-select",
    fieldName: "d9_3"
  },
  {
    id: "D9.3.3",
    section: "D9",
    text: "Employee satisfaction with workplace support programs",
    route: "/survey/dimensions/9",
    type: "multi-select",
    fieldName: "d9_3"
  },
  {
    id: "D9.3.4",
    section: "D9",
    text: "DEI metrics related to medical conditions",
    route: "/survey/dimensions/9",
    type: "multi-select",
    fieldName: "d9_3"
  },
  {
    id: "D9.3.5",
    section: "D9",
    text: "None - workplace support metrics not included in executive evaluations",
    route: "/survey/dimensions/9",
    type: "multi-select",
    fieldName: "d9_3",
    exclusive: true
  }
];

// D9.b - Open-ended follow-up
const D9B_ITEM: InstrumentItem = {
  id: "D9.b",
  section: "D9",
  text: "What other executive commitment or resource allocation practices does your organization have for workplace support programs that weren't listed?",
  route: "/survey/dimensions/9",
  type: "textarea",
  fieldName: "d9b",
  required: false
};

// ============================================
// DIMENSION 10: CAREGIVER & FAMILY SUPPORT
// Route: /survey/dimensions/10
// ============================================

const D10_INTRO: InstrumentItem = {
  id: "D10.intro",
  section: "D10",
  text: "CAREGIVER & FAMILY SUPPORT - Support for employees who are caregivers for family members managing cancer or other serious health conditions through flexible arrangements and dedicated resources.",
  route: "/survey/dimensions/10",
  type: "text",
  fieldName: "d10_intro"
};

// D10.a - Main grid items (19 items)
const D10A_ITEMS: InstrumentItem[] = [
  {
    id: "D10.a1",
    section: "D10",
    text: "Paid caregiver leave with expanded eligibility (beyond local legal requirements)",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true,
    multiCountryFollowUp: true,
    conditional: true // Triggers D10.1
  },
  {
    id: "D10.a2",
    section: "D10",
    text: "Flexible work arrangements for caregivers",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a3",
    section: "D10",
    text: "Dependent care subsidies",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a4",
    section: "D10",
    text: "Emergency caregiver funds",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a5",
    section: "D10",
    text: "Dependent care account matching/contributions",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a6",
    section: "D10",
    text: "Family navigation support",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a7",
    section: "D10",
    text: "Caregiver peer support groups",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a8",
    section: "D10",
    text: "Mental health support specifically for caregivers",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a9",
    section: "D10",
    text: "Manager training for supervising caregivers",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a10",
    section: "D10",
    text: "Practical support for managing caregiving and work",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a11",
    section: "D10",
    text: "Emergency dependent care when regular arrangements unavailable",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a12",
    section: "D10",
    text: "Respite care funding/reimbursement",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a13",
    section: "D10",
    text: "Caregiver resource navigator/concierge",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a14",
    section: "D10",
    text: "Legal/financial planning assistance for caregivers",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a15",
    section: "D10",
    text: "Modified job duties during peak caregiving periods",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a16",
    section: "D10",
    text: "Unpaid leave job protection beyond local / legal requirements",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a17",
    section: "D10",
    text: "Eldercare consultation and referral services",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a18",
    section: "D10",
    text: "Paid time off for care coordination appointments",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  },
  {
    id: "D10.a19",
    section: "D10",
    text: "Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)",
    route: "/survey/dimensions/10",
    type: "likert-4",
    fieldName: "d10a",
    randomize: true
  }
];

// D10.aa - Multi-country follow-up (conditional)
const D10AA_ITEM: InstrumentItem = {
  id: "D10.aa",
  section: "D10",
  text: "Are the Caregiver & Family Support options your organization currently offers...?",
  route: "/survey/dimensions/10",
  type: "select",
  fieldName: "d10aa",
  conditional: true,
  required: false
};

// D10.1 - Paid caregiver leave details (conditional)
const D10_1_ITEMS: InstrumentItem[] = [
  {
    id: "D10.1",
    section: "D10",
    text: "How many days of paid caregiver leave are typically available per year (beyond local/legal requirements)?",
    route: "/survey/dimensions/10",
    type: "select",
    fieldName: "d10_1",
    conditional: true, // Only if D10.a1 = "Currently offer"
    required: true
  },
  {
    id: "D10.1.1",
    section: "D10",
    text: "1 to 5 days per year",
    route: "/survey/dimensions/10",
    type: "select",
    fieldName: "d10_1"
  },
  {
    id: "D10.1.2",
    section: "D10",
    text: "6 to 10 days per year",
    route: "/survey/dimensions/10",
    type: "select",
    fieldName: "d10_1"
  },
  {
    id: "D10.1.3",
    section: "D10",
    text: "11 to 20 days per year",
    route: "/survey/dimensions/10",
    type: "select",
    fieldName: "d10_1"
  },
  {
    id: "D10.1.4",
    section: "D10",
    text: "More than 20 days per year",
    route: "/survey/dimensions/10",
    type: "select",
    fieldName: "d10_1"
  },
  {
    id: "D10.1.5",
    section: "D10",
    text: "Varies by country/jurisdiction",
    route: "/survey/dimensions/10",
    type: "select",
    fieldName: "d10_1"
  },
  {
    id: "D10.1.6",
    section: "D10",
    text: "Not able to provide this information",
    route: "/survey/dimensions/10",
    type: "select",
    fieldName: "d10_1"
  }
];

// D10.b - Open-ended follow-up
const D10B_ITEM: InstrumentItem = {
  id: "D10.b",
  section: "D10",
  text: "What other caregiver & family support benefits does your organization offer that weren't listed?",
  route: "/survey/dimensions/10",
  type: "textarea",
  fieldName: "d10b",
  required: false
};

// ============================================
// COMBINED EXPORTS
// ============================================

export const D6_ITEMS = [
  D6_INTRO,
  ...D6A_ITEMS,
  D6AA_ITEM,
  D6B_ITEM,
  ...D6_2_ITEMS
];

export const D7_ITEMS = [
  D7_INTRO,
  ...D7A_ITEMS,
  D7AA_ITEM,
  D7B_ITEM
];

export const D8_ITEMS = [
  D8_INTRO,
  ...D8A_ITEMS,
  D8AA_ITEM,
  D8B_ITEM
];

export const D9_ITEMS = [
  D9_INTRO,
  ...D9A_ITEMS,
  D9AA_ITEM,
  ...D9_2_ITEMS,
  ...D9_3_ITEMS,
  D9B_ITEM
];

export const D10_ITEMS = [
  D10_INTRO,
  ...D10A_ITEMS,
  D10AA_ITEM,
  ...D10_1_ITEMS,
  D10B_ITEM
];

// All items for dimensions 6-10
export const ALL_DIMENSIONS_6_10_ITEMS = [
  ...D6_ITEMS,
  ...D7_ITEMS,
  ...D8_ITEMS,
  ...D9_ITEMS,
  ...D10_ITEMS
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getItemsBySection(section: string): InstrumentItem[] {
  return ALL_DIMENSIONS_6_10_ITEMS.filter(item => item.section === section);
}

export function getItemsByRoute(route: string): InstrumentItem[] {
  return ALL_DIMENSIONS_6_10_ITEMS.filter(item => item.route === route);
}

export function getItemsByFieldName(fieldName: string): InstrumentItem[] {
  return ALL_DIMENSIONS_6_10_ITEMS.filter(item => item.fieldName === fieldName);
}

// ============================================
// SUMMARY STATISTICS
// ============================================

export const DIMENSION_6_SUMMARY = {
  id: "D6",
  title: "Culture & Psychological Safety",
  totalItems: D6_ITEMS.length,
  gridItems: 12,
  conditionalItems: 8, // D6.2 has 7 options + D6.aa
  route: "/survey/dimensions/6",
  storageKey: "dimension6_data",
  completionFlag: "dimension6_complete"
};

export const DIMENSION_7_SUMMARY = {
  id: "D7",
  title: "Career Continuity & Advancement",
  totalItems: D7_ITEMS.length,
  gridItems: 9,
  conditionalItems: 2, // D7.aa + D7.b
  route: "/survey/dimensions/7",
  storageKey: "dimension7_data",
  completionFlag: "dimension7_complete"
};

export const DIMENSION_8_SUMMARY = {
  id: "D8",
  title: "Work Continuation & Resumption",
  totalItems: D8_ITEMS.length,
  gridItems: 12,
  conditionalItems: 2, // D8.aa + D8.b
  route: "/survey/dimensions/8",
  storageKey: "dimension8_data",
  completionFlag: "dimension8_complete"
};

export const DIMENSION_9_SUMMARY = {
  id: "D9",
  title: "Executive Commitment & Resources",
  totalItems: D9_ITEMS.length,
  gridItems: 11,
  conditionalItems: 12, // D9.aa + D9.2 (5 options) + D9.3 (5 options) + D9.b
  route: "/survey/dimensions/9",
  storageKey: "dimension9_data",
  completionFlag: "dimension9_complete"
};

export const DIMENSION_10_SUMMARY = {
  id: "D10",
  title: "Caregiver & Family Support",
  totalItems: D10_ITEMS.length,
  gridItems: 19,
  conditionalItems: 8, // D10.aa + D10.1 (6 options) + D10.b
  route: "/survey/dimensions/10",
  storageKey: "dimension10_data",
  completionFlag: "dimension10_complete"
};

export const DIMENSIONS_6_10_SUMMARY = {
  totalDimensions: 5,
  totalItems: ALL_DIMENSIONS_6_10_ITEMS.length,
  dimensions: [
    DIMENSION_6_SUMMARY,
    DIMENSION_7_SUMMARY,
    DIMENSION_8_SUMMARY,
    DIMENSION_9_SUMMARY,
    DIMENSION_10_SUMMARY
  ]
};

// ============================================
// RESPONSE OPTIONS (Shared across dimensions)
// ============================================

export const LIKERT_4_OPTIONS = [
  "Not able to offer in foreseeable future",
  "Assessing feasibility",
  "In active planning / development",
  "Currently offer"
];

export const MULTI_COUNTRY_OPTIONS = [
  "Only available in select locations",
  "Vary across locations",
  "Generally consistent across all locations"
];

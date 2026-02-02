// data/instrument-items-advanced-assessments.ts
// Advanced Assessments: Employee Impact + Cross-Dimensional
// These sections unlock AFTER all 13 dimensions are completed

export interface InstrumentItem {
  id: string;
  section: string;
  text: string;
  route: string;
  type: 'text' | 'select' | 'multi-select' | 'likert-4' | 'likert-5' | 'likert-6' | 'textarea';
  fieldName?: string;
  weight?: number;
  required?: boolean;
  conditional?: boolean;
  exclusive?: boolean;
  randomize?: boolean;
  locked?: boolean; // Requires completion of other sections
}

// ============================================
// EMPLOYEE IMPACT ASSESSMENT
// Route: /survey/employee-impact-assessment
// Locked until: All 13 dimensions complete
// ============================================

const EI_INTRO: InstrumentItem = {
  id: "EI.intro",
  section: "EI",
  text: "EMPLOYEE IMPACT ASSESSMENT - Evaluate the measurable outcomes and return on investment of your workplace support programs.",
  route: "/survey/employee-impact-assessment",
  type: "text",
  fieldName: "ei_intro",
  locked: true
};

// EI1 - Positive outcomes (10 outcomes, 5-point scale)
const EI1_ITEMS: InstrumentItem[] = [
  {
    id: "EI1",
    section: "EI1",
    text: "To what extent has your organization seen positive outcomes in the following areas as a result of your workplace support programs for employees managing cancer or other serious health conditions?",
    route: "/survey/employee-impact-assessment",
    type: "likert-5",
    fieldName: "ei1",
    randomize: true,
    required: true,
    locked: true
  },
  {
    id: "EI1.1",
    section: "EI1",
    text: "Employee retention/tenure",
    route: "/survey/employee-impact-assessment",
    type: "likert-5",
    fieldName: "ei1"
  },
  {
    id: "EI1.2",
    section: "EI1",
    text: "Employee morale",
    route: "/survey/employee-impact-assessment",
    type: "likert-5",
    fieldName: "ei1"
  },
  {
    id: "EI1.3",
    section: "EI1",
    text: "Job satisfaction scores",
    route: "/survey/employee-impact-assessment",
    type: "likert-5",
    fieldName: "ei1"
  },
  {
    id: "EI1.4",
    section: "EI1",
    text: "Productivity during treatment",
    route: "/survey/employee-impact-assessment",
    type: "likert-5",
    fieldName: "ei1"
  },
  {
    id: "EI1.5",
    section: "EI1",
    text: "Time to return to work",
    route: "/survey/employee-impact-assessment",
    type: "likert-5",
    fieldName: "ei1"
  },
  {
    id: "EI1.6",
    section: "EI1",
    text: "Recruitment success",
    route: "/survey/employee-impact-assessment",
    type: "likert-5",
    fieldName: "ei1"
  },
  {
    id: "EI1.7",
    section: "EI1",
    text: "Team cohesion",
    route: "/survey/employee-impact-assessment",
    type: "likert-5",
    fieldName: "ei1"
  },
  {
    id: "EI1.8",
    section: "EI1",
    text: "Trust in leadership",
    route: "/survey/employee-impact-assessment",
    type: "likert-5",
    fieldName: "ei1"
  },
  {
    id: "EI1.9",
    section: "EI1",
    text: "Willingness to disclose health issues",
    route: "/survey/employee-impact-assessment",
    type: "likert-5",
    fieldName: "ei1"
  },
  {
    id: "EI1.10",
    section: "EI1",
    text: "Overall engagement scores",
    route: "/survey/employee-impact-assessment",
    type: "likert-5",
    fieldName: "ei1"
  }
];

// EI2 - ROI measurement status (5 options)
const EI2_ITEMS: InstrumentItem[] = [
  {
    id: "EI2",
    section: "EI2",
    text: "Have you measured the ROI of your workplace support programs for employees managing cancer or other serious health conditions?",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei2",
    required: true,
    locked: true
  },
  {
    id: "EI2.1",
    section: "EI2",
    text: "Yes, comprehensive ROI analysis completed",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei2",
    conditional: true // Triggers EI3
  },
  {
    id: "EI2.2",
    section: "EI2",
    text: "Yes, basic ROI analysis completed",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei2",
    conditional: true // Triggers EI3
  },
  {
    id: "EI2.3",
    section: "EI2",
    text: "Currently conducting ROI analysis",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei2"
  },
  {
    id: "EI2.4",
    section: "EI2",
    text: "Planning to measure ROI",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei2"
  },
  {
    id: "EI2.5",
    section: "EI2",
    text: "No plans to measure ROI",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei2"
  }
];

// EI3 - ROI results (6 ranges, conditional)
const EI3_ITEMS: InstrumentItem[] = [
  {
    id: "EI3",
    section: "EI3",
    text: "What was the approximate ROI of your workplace support programs?",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei3",
    conditional: true, // Only if EI2 = comprehensive or basic analysis
    required: true,
    locked: true
  },
  {
    id: "EI3.1",
    section: "EI3",
    text: "Negative ROI (costs exceed benefits by more than 100%)",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei3"
  },
  {
    id: "EI3.2",
    section: "EI3",
    text: "Break-even (costs and benefits are roughly equal)",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei3"
  },
  {
    id: "EI3.3",
    section: "EI3",
    text: "1.1 - 2.0x ROI (benefits are 10-100% more than costs)",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei3"
  },
  {
    id: "EI3.4",
    section: "EI3",
    text: "2.1 - 3.0x ROI (benefits are 2-3 times the costs)",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei3"
  },
  {
    id: "EI3.5",
    section: "EI3",
    text: "3.1 - 5.0x ROI (benefits are 3-5 times the costs)",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei3"
  },
  {
    id: "EI3.6",
    section: "EI3",
    text: "Greater than 5.0x ROI (benefits exceed 5 times the costs)",
    route: "/survey/employee-impact-assessment",
    type: "select",
    fieldName: "ei3"
  }
];

// EI4 - Advice for other HR leaders (open-ended, 50% of users see this)
const EI4_ITEM: InstrumentItem = {
  id: "EI4",
  section: "EI4",
  text: "Based on learnings from implementation of your programs and policies, what advice would you give to other HR leaders who want to improve support for employees managing cancer or other serious health conditions?",
  route: "/survey/employee-impact-assessment",
  type: "textarea",
  fieldName: "ei4",
  required: false,
  locked: true
};

// EI5 - Missing survey aspects + other conditions (open-ended + multi-select, 50% see this)
const EI5_ITEMS: InstrumentItem[] = [
  {
    id: "EI5.intro",
    section: "EI5",
    text: "Are there any important aspects of supporting employees managing cancer or other serious health conditions that this survey did not address?",
    route: "/survey/employee-impact-assessment",
    type: "textarea",
    fieldName: "ei5_intro",
    required: false,
    locked: true
  },
  {
    id: "EI5",
    section: "EI5",
    text: "Throughout this survey, we've asked about support for employees managing cancer. Does your organization's program extend to other serious medical conditions? Which other serious medical conditions does your program address?",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5",
    randomize: true,
    required: false,
    locked: true
  },
  {
    id: "EI5.1",
    section: "EI5",
    text: "Heart disease (including heart attack, heart failure)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.2",
    section: "EI5",
    text: "Kidney disease (including dialysis, kidney failure)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.3",
    section: "EI5",
    text: "Major surgery recovery (planned or emergency)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.4",
    section: "EI5",
    text: "Mental health crises (requiring extended leave)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.5",
    section: "EI5",
    text: "Respiratory conditions (e.g., COPD, cystic fibrosis)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.6",
    section: "EI5",
    text: "Autoimmune disorders (e.g., MS, lupus, rheumatoid arthritis)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.7",
    section: "EI5",
    text: "Musculoskeletal conditions (chronic or acute)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.8",
    section: "EI5",
    text: "Neurological conditions (e.g., epilepsy, brain injury)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.9",
    section: "EI5",
    text: "Chronic conditions (e.g., ALS, Parkinson's, Crohn's)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.10",
    section: "EI5",
    text: "Stroke recovery",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.11",
    section: "EI5",
    text: "Liver disease (including cirrhosis, hepatitis)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.12",
    section: "EI5",
    text: "Diabetes complications requiring intensive treatment",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.13",
    section: "EI5",
    text: "Organ transplant (pre- and post-transplant)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.14",
    section: "EI5",
    text: "Blood disorders (e.g., sickle cell, hemophilia)",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.15",
    section: "EI5",
    text: "Other condition meeting severity/duration criteria (specify):",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5"
  },
  {
    id: "EI5.16",
    section: "EI5",
    text: "No - program is specific to cancer only",
    route: "/survey/employee-impact-assessment",
    type: "multi-select",
    fieldName: "ei5",
    exclusive: true
  }
];

// ============================================
// CROSS-DIMENSIONAL ASSESSMENT
// Route: /survey/cross-dimensional-assessment
// Locked until: All 13 dimensions complete
// ============================================

const CD_INTRO: InstrumentItem = {
  id: "CD.intro",
  section: "CD",
  text: "CROSS-DIMENSIONAL ASSESSMENT - Prioritize dimensions and identify challenges across your entire workplace support ecosystem.",
  route: "/survey/cross-dimensional-assessment",
  type: "text",
  fieldName: "cd_intro",
  locked: true
};

// CD1a - Top 3 dimensions for best outcomes (select exactly 3)
const CD1A_ITEMS: InstrumentItem[] = [
  {
    id: "CD1a",
    section: "CD1a",
    text: "Which THREE dimensions would provide the best outcomes if you were to enhance them from their current state?",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a",
    randomize: true,
    required: true,
    locked: true
  },
  {
    id: "CD1a.1",
    section: "CD1a",
    text: "Medical Leave & Flexibility",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.2",
    section: "CD1a",
    text: "Insurance & Financial Protection",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.3",
    section: "CD1a",
    text: "Manager Preparedness & Capability",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.4",
    section: "CD1a",
    text: "Cancer Support Resources",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.5",
    section: "CD1a",
    text: "Workplace Accommodations",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.6",
    section: "CD1a",
    text: "Culture & Psychological Safety",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.7",
    section: "CD1a",
    text: "Career Continuity & Advancement",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.8",
    section: "CD1a",
    text: "Return-to-Work Excellence",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.9",
    section: "CD1a",
    text: "Executive Commitment & Resources",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.10",
    section: "CD1a",
    text: "Caregiver & Family Support",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.11",
    section: "CD1a",
    text: "Prevention, Wellness & Legal Compliance",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.12",
    section: "CD1a",
    text: "Continuous Improvement & Outcomes",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  },
  {
    id: "CD1a.13",
    section: "CD1a",
    text: "Communication & Awareness",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1a"
  }
];

// CD1b - Lowest 3 priority dimensions (select exactly 3 from dimensions NOT selected in CD1a)
const CD1B_ITEMS: InstrumentItem[] = [
  {
    id: "CD1b",
    section: "CD1b",
    text: "Which THREE areas are the lowest priority for your organization?",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd1b",
    conditional: true, // Only shows dimensions NOT selected in CD1a
    required: true,
    locked: true
  }
  // Note: Options are dynamically filtered based on CD1a selections
];

// CD2 - Biggest challenges (select up to 3)
const CD2_ITEMS: InstrumentItem[] = [
  {
    id: "CD2",
    section: "CD2",
    text: "What are the biggest challenges your organization faces in supporting employees managing cancer or other serious health conditions?",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2",
    randomize: true,
    required: true,
    locked: true
  },
  {
    id: "CD2.1",
    section: "CD2",
    text: "Budget/resource constraints",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.2",
    section: "CD2",
    text: "Lack of executive support",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.3",
    section: "CD2",
    text: "Complex/varying legal requirements across markets",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.4",
    section: "CD2",
    text: "Manager capability/training gaps",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.5",
    section: "CD2",
    text: "Employee privacy concerns",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.6",
    section: "CD2",
    text: "Difficulty measuring program effectiveness",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.7",
    section: "CD2",
    text: "Low employee awareness of available programs",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.8",
    section: "CD2",
    text: "Administrative complexity",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.9",
    section: "CD2",
    text: "Inconsistent application across the organization",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.10",
    section: "CD2",
    text: "Cultural stigma around medical conditions",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.11",
    section: "CD2",
    text: "Integration with existing HR systems",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.12",
    section: "CD2",
    text: "Competing organizational priorities",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.13",
    section: "CD2",
    text: "Limited expertise in workplace support programs",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.14",
    section: "CD2",
    text: "Global consistency challenges",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  },
  {
    id: "CD2.15",
    section: "CD2",
    text: "Other (please specify):",
    route: "/survey/cross-dimensional-assessment",
    type: "multi-select",
    fieldName: "cd2"
  }
];

// ============================================
// COMBINED EXPORTS
// ============================================

export const EMPLOYEE_IMPACT_ITEMS = [
  EI_INTRO,
  ...EI1_ITEMS,
  ...EI2_ITEMS,
  ...EI3_ITEMS,
  EI4_ITEM,
  ...EI5_ITEMS
];

export const CROSS_DIMENSIONAL_ITEMS = [
  CD_INTRO,
  ...CD1A_ITEMS,
  ...CD1B_ITEMS,
  ...CD2_ITEMS
];

export const ALL_ADVANCED_ASSESSMENT_ITEMS = [
  ...EMPLOYEE_IMPACT_ITEMS,
  ...CROSS_DIMENSIONAL_ITEMS
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getItemsBySection(section: string): InstrumentItem[] {
  return ALL_ADVANCED_ASSESSMENT_ITEMS.filter(item => item.section === section);
}

export function getItemsByRoute(route: string): InstrumentItem[] {
  return ALL_ADVANCED_ASSESSMENT_ITEMS.filter(item => item.route === route);
}

export function getItemsByFieldName(fieldName: string): InstrumentItem[] {
  return ALL_ADVANCED_ASSESSMENT_ITEMS.filter(item => item.fieldName === fieldName);
}

// ============================================
// SUMMARY STATISTICS
// ============================================

export const EMPLOYEE_IMPACT_SUMMARY = {
  id: "EI",
  title: "Employee Impact Assessment",
  totalItems: EMPLOYEE_IMPACT_ITEMS.length,
  sections: {
    ei1: { title: "Positive Outcomes", items: 10, type: "5-point grid" },
    ei2: { title: "ROI Status", items: 5, type: "single-select" },
    ei3: { title: "ROI Results", items: 6, type: "single-select (conditional)" },
    ei4: { title: "Advice to HR Leaders", items: 1, type: "open-ended (50% sample)" },
    ei5: { title: "Missing Aspects + Other Conditions", items: 16, type: "open-ended + multi-select (50% sample)" }
  },
  route: "/survey/employee-impact-assessment",
  storageKey: "employee_impact_data",
  completionFlag: "employee_impact_complete",
  locked: true,
  unlockRequirement: "All 13 dimensions completed"
};

export const CROSS_DIMENSIONAL_SUMMARY = {
  id: "CD",
  title: "Cross-Dimensional Assessment",
  totalItems: CROSS_DIMENSIONAL_ITEMS.length,
  sections: {
    cd1a: { title: "Best Outcomes (Top 3)", items: 13, type: "multi-select (exactly 3)" },
    cd1b: { title: "Lowest Priority (Bottom 3)", items: "varies", type: "multi-select from unselected (exactly 3)" },
    cd2: { title: "Biggest Challenges", items: 15, type: "multi-select (up to 3)" }
  },
  route: "/survey/cross-dimensional-assessment",
  storageKey: "cross_dimensional_data",
  completionFlag: "cross_dimensional_complete",
  locked: true,
  unlockRequirement: "All 13 dimensions completed"
};

export const ADVANCED_ASSESSMENTS_SUMMARY = {
  totalSections: 2,
  totalItems: ALL_ADVANCED_ASSESSMENT_ITEMS.length,
  sections: [
    EMPLOYEE_IMPACT_SUMMARY,
    CROSS_DIMENSIONAL_SUMMARY
  ],
  unlockRequirement: "All 13 dimensions must be completed (100%)",
  order: ["Employee Impact Assessment", "Cross-Dimensional Assessment"]
};

// ============================================
// RESPONSE OPTIONS
// ============================================

export const EI1_LIKERT_5_OPTIONS = [
  "No positive impact",
  "Minimal positive impact",
  "Moderate positive impact",
  "Significant positive impact",
  "Unable to assess"
];

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION_RULES = {
  CD1A: {
    minSelections: 3,
    maxSelections: 3,
    errorMessage: "Please select exactly 3 dimensions"
  },
  CD1B: {
    minSelections: 3,
    maxSelections: 3,
    errorMessage: "Please select exactly 3 dimensions",
    note: "Only dimensions NOT selected in CD1a are available"
  },
  CD2: {
    minSelections: 0,
    maxSelections: 3,
    errorMessage: "Please select up to 3 challenges"
  },
  EI4_EI5_SPLIT: {
    note: "50% of respondents see EI4, 50% see EI5",
    implementation: "Random assignment at section start"
  }
};

// ============================================
// NOTES
// ============================================

/*
IMPLEMENTATION NOTES:

1. LOCKED SECTIONS:
   - Both sections are locked until all 13 dimensions are 100% complete
   - Dashboard should show these with a lock icon and "Complete all dimensions to unlock"

2. CD1A/CD1B DEPENDENCY:
   - CD1b options are dynamically filtered based on CD1a selections
   - If user selected ["Medical Leave", "Culture", "Executive Commitment"] in CD1a,
     CD1b should only show the remaining 10 dimensions

3. EI4 vs EI5 SPLIT:
   - 50% of users see EI4 (advice question)
   - 50% of users see EI5 (missing aspects + other conditions)
   - Random assignment should be stable (same user always sees same question)

4. SELECTION LIMITS:
   - CD1a: Exactly 3 selections required
   - CD1b: Exactly 3 selections required (from remaining 10)
   - CD2: Up to 3 selections

5. CONDITIONAL LOGIC:
   - EI3 only shows if EI2 = "comprehensive" or "basic" ROI analysis
   - Skip EI3 if EI2 = "currently conducting", "planning", or "no plans"

6. OTHER (SPECIFY) FIELDS:
   - CD2 has "Other (specify):" option that triggers text input
   - EI5 has "Other condition (specify):" option that triggers text input
*/

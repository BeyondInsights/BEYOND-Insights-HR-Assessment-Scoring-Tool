// data/instrument-items-general-current.ts
// General Benefits + Current Support Sections - Complete Data Dictionary
// Dashboard Core Sections #2 and #3

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
}

// ============================================
// PART A: GENERAL EMPLOYEE BENEFITS
// Route: /survey/general-benefits
// ============================================

// ============================================
// SECTION CB1: Current Benefits Provided
// ============================================
const CB1_ITEMS: InstrumentItem[] = [
  {
    id: "CB1.intro",
    section: "CB1",
    text: "Now, we'd like to understand the types of benefits and programs your organization currently offers employees. Please indicate which of the following your organization provides:",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_intro",
  },
  
  // STANDARD BENEFITS
  {
    id: "CB1.1a",
    section: "CB1",
    text: "Health insurance (Employer-provided or supplemental to national coverage)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_standard",
  },
  {
    id: "CB1.1b",
    section: "CB1",
    text: "Dental insurance (Employer-provided or supplemental to national coverage)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_standard",
  },
  {
    id: "CB1.1c",
    section: "CB1",
    text: "Vision insurance (Employer-provided or supplemental to national coverage)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_standard",
  },
  {
    id: "CB1.1d",
    section: "CB1",
    text: "Life insurance",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_standard",
  },
  {
    id: "CB1.1e",
    section: "CB1",
    text: "Short-term disability (or temporary incapacity benefits)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_standard",
  },
  {
    id: "CB1.1f",
    section: "CB1",
    text: "Long-term disability (or income protection)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_standard",
  },
  {
    id: "CB1.1g",
    section: "CB1",
    text: "Paid time off (PTO/vacation)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_standard",
  },
  {
    id: "CB1.1h",
    section: "CB1",
    text: "Sick days (separate from PTO and legally mandated sick leave)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_standard",
  },
  {
    id: "CB1.1i",
    section: "CB1",
    text: "None of these",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_standard",
    exclusive: true,
  },
  
  // LEAVE & FLEXIBILITY PROGRAMS
  {
    id: "CB1.2a",
    section: "CB1",
    text: "Paid family/medical leave beyond legal requirements",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_leave",
  },
  {
    id: "CB1.2b",
    section: "CB1",
    text: "Flexible work schedules",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_leave",
  },
  {
    id: "CB1.2c",
    section: "CB1",
    text: "Remote work options",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_leave",
  },
  {
    id: "CB1.2d",
    section: "CB1",
    text: "Job sharing programs",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_leave",
  },
  {
    id: "CB1.2e",
    section: "CB1",
    text: "Phased retirement",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_leave",
  },
  {
    id: "CB1.2f",
    section: "CB1",
    text: "Sabbatical programs",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_leave",
  },
  {
    id: "CB1.2g",
    section: "CB1",
    text: "Dedicated caregiver leave (separate from family leave)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_leave",
  },
  {
    id: "CB1.2h",
    section: "CB1",
    text: "None of these",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_leave",
    exclusive: true,
  },
  
  // WELLNESS & SUPPORT PROGRAMS
  {
    id: "CB1.3a",
    section: "CB1",
    text: "Employee assistance program (EAP)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_wellness",
  },
  {
    id: "CB1.3b",
    section: "CB1",
    text: "Physical wellness programs (fitness, nutrition, ergonomics)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_wellness",
  },
  {
    id: "CB1.3c",
    section: "CB1",
    text: "Mental wellness programs (stress management, mindfulness, resilience)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_wellness",
  },
  {
    id: "CB1.3d",
    section: "CB1",
    text: "On-site health services",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_wellness",
  },
  {
    id: "CB1.3e",
    section: "CB1",
    text: "Mental health resources (therapy, counseling)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_wellness",
  },
  {
    id: "CB1.3f",
    section: "CB1",
    text: "Caregiving support resources",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_wellness",
  },
  {
    id: "CB1.3g",
    section: "CB1",
    text: "Tailored support programs for employees managing cancer or other serious health conditions",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_wellness",
  },
  {
    id: "CB1.3h",
    section: "CB1",
    text: "None of these",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_wellness",
    exclusive: true,
  },
  
  // FINANCIAL & LEGAL ASSISTANCE
  {
    id: "CB1.4a",
    section: "CB1",
    text: "Financial counseling/planning",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_financial",
  },
  {
    id: "CB1.4b",
    section: "CB1",
    text: "Student loan assistance",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_financial",
  },
  {
    id: "CB1.4c",
    section: "CB1",
    text: "Identity theft protection",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_financial",
  },
  {
    id: "CB1.4d",
    section: "CB1",
    text: "Legal assistance/services (will preparation, family law, medical directives)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_financial",
  },
  {
    id: "CB1.4e",
    section: "CB1",
    text: "None of these",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_financial",
    exclusive: true,
  },
  
  // CARE NAVIGATION & SUPPORT SERVICES
  {
    id: "CB1.5a",
    section: "CB1",
    text: "Care coordination for complex conditions",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_navigation",
  },
  {
    id: "CB1.5b",
    section: "CB1",
    text: "Second opinion services or facilitation",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_navigation",
  },
  {
    id: "CB1.5c",
    section: "CB1",
    text: "Specialized treatment center networks",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_navigation",
  },
  {
    id: "CB1.5d",
    section: "CB1",
    text: "Travel support for specialized care",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_navigation",
  },
  {
    id: "CB1.5e",
    section: "CB1",
    text: "Clinical guidance and navigation",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_navigation",
  },
  {
    id: "CB1.5f",
    section: "CB1",
    text: "Medication access and affordability programs",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_navigation",
  },
  {
    id: "CB1.5g",
    section: "CB1",
    text: "None of these",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb1_navigation",
    exclusive: true,
  },
];

// ============================================
// SECTION CB1a: Healthcare Access (National Systems)
// ============================================
const CB1A_ITEMS: InstrumentItem[] = [
  {
    id: "CB1a.1",
    section: "CB1a",
    text: "What percentage of your employees have access to healthcare through national or government systems (rather than employer-provided insurance)?",
    route: "/survey/general-benefits",
    type: "text",
    fieldName: "cb1a",
    required: true,
  },
];

// ============================================
// SECTION CB2: Benefits Package Characterization
// ============================================
const CB2_ITEMS: InstrumentItem[] = [
  {
    id: "CB2.1",
    section: "CB2",
    text: "How would you characterize your overall benefits package compared to others in your industry?",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb2",
    required: true,
  },
  {
    id: "CB2.1a",
    section: "CB2",
    text: "Leading Edge: We offer best-in-class comprehensive support that others benchmark against",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb2",
  },
  {
    id: "CB2.1b",
    section: "CB2",
    text: "Above Standard: We provide meaningful benefits that exceed industry norms",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb2",
  },
  {
    id: "CB2.1c",
    section: "CB2",
    text: "Industry Standard: We match typical offerings without significant differentiation",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb2",
  },
  {
    id: "CB2.1d",
    section: "CB2",
    text: "Basic Plus: We offer some benefits beyond legal requirements but have substantial gaps",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb2",
  },
  {
    id: "CB2.1e",
    section: "CB2",
    text: "Compliance-Focused: We cover the bare minimum required by law",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb2",
  },
];

// ============================================
// SECTION CB2b: Future Program Rollout Plans
// ============================================
const CB2B_ITEMS: InstrumentItem[] = [
  {
    id: "CB2b.1",
    section: "CB2b",
    text: "Over the next 2 years, which, if any of the following programs does your organization plan to roll out?",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb2b",
  },
  {
    id: "CB2b.2",
    section: "CB2b",
    text: "[INSERT PROGRAMS NOT SELECTED IN CB1]",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb2b",
  },
  {
    id: "CB2b.3",
    section: "CB2b",
    text: "Other (specify):",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb2b",
    conditional: true,
  },
  {
    id: "CB2b.4",
    section: "CB2b",
    text: "None of these",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb2b",
    exclusive: true,
  },
  {
    id: "CB2b.5",
    section: "CB2b",
    text: "Other program specification",
    route: "/survey/general-benefits",
    type: "text",
    fieldName: "cb2b_other",
    conditional: true,
  },
];

// ============================================
// SECTION CB3: Serious Medical Conditions Covered
// ============================================
const CB3_ITEMS: InstrumentItem[] = [
  {
    id: "CB3.1",
    section: "CB3",
    text: "Which serious health conditions does your program address? (Select ALL that apply)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1a",
    section: "CB3",
    text: "Cancer (any form)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1b",
    section: "CB3",
    text: "Heart disease (including heart attack, heart failure)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1c",
    section: "CB3",
    text: "Kidney disease (including dialysis, kidney failure)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1d",
    section: "CB3",
    text: "Major surgery recovery (planned or emergency)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1e",
    section: "CB3",
    text: "Mental health crises (requiring extended leave)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1f",
    section: "CB3",
    text: "Respiratory conditions (e.g., COPD, cystic fibrosis)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1g",
    section: "CB3",
    text: "Musculoskeletal conditions (chronic or acute)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1h",
    section: "CB3",
    text: "Neurological conditions (e.g., epilepsy, brain injury)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1i",
    section: "CB3",
    text: "Chronic conditions (e.g., MS, ALS, Parkinson's, Crohn's, lupus, rheumatoid arthritis)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1j",
    section: "CB3",
    text: "Autoimmune disorders (e.g., MS, lupus, rheumatoid arthritis)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1k",
    section: "CB3",
    text: "HIV / AIDS",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1l",
    section: "CB3",
    text: "Organ transplant (pre and post)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1m",
    section: "CB3",
    text: "Stroke",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
  },
  {
    id: "CB3.1n",
    section: "CB3",
    text: "Some other condition meeting severity/duration criteria (specify)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3",
    conditional: true,
  },
  {
    id: "CB3.2",
    section: "CB3",
    text: "Other condition specification",
    route: "/survey/general-benefits",
    type: "text",
    fieldName: "cb3_other",
    conditional: true,
  },
];

// ============================================
// SECTION CB3a: Support Beyond Legal Requirements
// ============================================
const CB3A_ITEMS: InstrumentItem[] = [
  {
    id: "CB3a.1",
    section: "CB3a",
    text: "Does your organization offer any support beyond legal requirements for employees managing cancer or other serious health conditions?",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb3a",
    required: true,
  },
  {
    id: "CB3a.1a",
    section: "CB3a",
    text: "Yes, we offer additional support beyond legal requirements",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb3a",
  },
  {
    id: "CB3a.1b",
    section: "CB3a",
    text: "Currently developing enhanced support offerings",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb3a",
  },
  {
    id: "CB3a.1c",
    section: "CB3a",
    text: "At this time, we primarily focus on meeting legal compliance requirements",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb3a",
  },
  {
    id: "CB3a.1d",
    section: "CB3a",
    text: "Not yet, but actively exploring options",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb3a",
  },
];

// ============================================
// SECTION CB3b: Program Structure
// ============================================
const CB3B_ITEMS: InstrumentItem[] = [
  {
    id: "CB3b.1",
    section: "CB3b",
    text: "Which of the following best describes how these support programs are structured for employees managing cancer or other serious health conditions?",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3b",
  },
  {
    id: "CB3b.1a",
    section: "CB3b",
    text: "Individual benefits or policies (e.g., extended leave, flexible work options)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3b",
  },
  {
    id: "CB3b.1b",
    section: "CB3b",
    text: "Coordinated support services - single point of contact for multiple resources (e.g., nurse navigation, case management)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3b",
  },
  {
    id: "CB3b.1c",
    section: "CB3b",
    text: "Internally developed formal program with a specific name (e.g., \"We Care at Work\")",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3b",
  },
  {
    id: "CB3b.1d",
    section: "CB3b",
    text: "Participation in external initiatives, certifications, or pledges (e.g., Working with Cancer pledge, CEO Cancer Gold Standard)",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3b",
  },
  {
    id: "CB3b.1e",
    section: "CB3b",
    text: "Comprehensive framework that integrates multiple support elements",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3b",
  },
  {
    id: "CB3b.1f",
    section: "CB3b",
    text: "Ad hoc/case-by-case support as needs arise",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3b",
  },
  {
    id: "CB3b.1g",
    section: "CB3b",
    text: "Other (specify):",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3b",
    conditional: true,
  },
  {
    id: "CB3b.2",
    section: "CB3b",
    text: "Other structure specification",
    route: "/survey/general-benefits",
    type: "text",
    fieldName: "cb3b_other",
    conditional: true,
  },
];

// ============================================
// SECTION CB3c: When Support Began (NOT USED IN APP)
// ============================================
const CB3C_ITEMS: InstrumentItem[] = [
  {
    id: "CB3c.note",
    section: "CB3c",
    text: "CB3c section not implemented in current app version",
    route: "/survey/general-benefits",
    type: "select",
    fieldName: "cb3c",
  },
];

// ============================================
// SECTION CB3d: How Programs Were Developed
// ============================================
const CB3D_ITEMS: InstrumentItem[] = [
  {
    id: "CB3d.1",
    section: "CB3d",
    text: "How were the workplace support programs for employees managing cancer or other serious health conditions primarily developed?",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3d",
  },
  {
    id: "CB3d.1a",
    section: "CB3d",
    text: "Internally by HR team",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3d",
  },
  {
    id: "CB3d.1b",
    section: "CB3d",
    text: "With assistance from benefits broker",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3d",
  },
  {
    id: "CB3d.1c",
    section: "CB3d",
    text: "With specialized consultant support",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3d",
  },
  {
    id: "CB3d.1d",
    section: "CB3d",
    text: "Adopted from parent / acquiring company",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3d",
  },
  {
    id: "CB3d.1e",
    section: "CB3d",
    text: "Benchmarked from peer companies",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3d",
  },
  {
    id: "CB3d.1f",
    section: "CB3d",
    text: "Employee / union driven",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3d",
  },
  {
    id: "CB3d.1g",
    section: "CB3d",
    text: "Some other way (specify):",
    route: "/survey/general-benefits",
    type: "multi-select",
    fieldName: "cb3d",
    conditional: true,
  },
  {
    id: "CB3d.2",
    section: "CB3d",
    text: "Other development method specification",
    route: "/survey/general-benefits",
    type: "text",
    fieldName: "cb3d_other",
    conditional: true,
  },
];

// ============================================
// PART B: CURRENT SUPPORT FOR EMPLOYEES MANAGING CANCER
// Route: /survey/current-support
// ============================================

// ============================================
// SECTION OR1: Current Approach
// ============================================
const OR1_ITEMS: InstrumentItem[] = [
  {
    id: "OR1.1",
    section: "CS",
    text: "Which best describes your organization's current approach to supporting employees managing cancer or other serious health conditions?",
    route: "/survey/current-support",
    type: "select",
    fieldName: "or1",
    required: true,
  },
  {
    id: "OR1.1a",
    section: "CS",
    text: "<strong>No formal approach</strong> – handle situations as they arise",
    route: "/survey/current-support",
    type: "select",
    fieldName: "or1",
  },
  {
    id: "OR1.1b",
    section: "CS",
    text: "<strong>Developing approach</strong> – currently building programs and policies",
    route: "/survey/current-support",
    type: "select",
    fieldName: "or1",
  },
  {
    id: "OR1.1c",
    section: "CS",
    text: "<strong>Basic support</strong> – legal minimums plus some informal flexibility",
    route: "/survey/current-support",
    type: "select",
    fieldName: "or1",
  },
  {
    id: "OR1.1d",
    section: "CS",
    text: "<strong>Moderate support</strong> – coordinated resources with clear processes",
    route: "/survey/current-support",
    type: "select",
    fieldName: "or1",
  },
  {
    id: "OR1.1e",
    section: "CS",
    text: "<strong>Strong support</strong> – integrated framework addressing multiple needs",
    route: "/survey/current-support",
    type: "select",
    fieldName: "or1",
  },
  {
    id: "OR1.1f",
    section: "CS",
    text: "<strong>Leading-edge support</strong> – comprehensive, innovative programs",
    route: "/survey/current-support",
    type: "select",
    fieldName: "or1",
  },
];

// ============================================
// SECTION OR2a: What Triggered Support
// ============================================
const OR2A_ITEMS: InstrumentItem[] = [
  {
    id: "OR2a.1",
    section: "CS",
    text: "What triggered your organization to develop support beyond basic legal requirements? (Select ALL that apply)",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
  },
  {
    id: "OR2a.1a",
    section: "CS",
    text: "Employee(s) diagnosed with serious medical condition",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
  },
  {
    id: "OR2a.1b",
    section: "CS",
    text: "Leadership personal experience or commitment",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
  },
  {
    id: "OR2a.1c",
    section: "CS",
    text: "Employee feedback / requests",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
  },
  {
    id: "OR2a.1d",
    section: "CS",
    text: "Retention / recruitment challenges",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
  },
  {
    id: "OR2a.1e",
    section: "CS",
    text: "Productivity / business continuity concerns",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
  },
  {
    id: "OR2a.1f",
    section: "CS",
    text: "DEI / ESG commitments",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
  },
  {
    id: "OR2a.1g",
    section: "CS",
    text: "Industry best practices / peer pressure",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
  },
  {
    id: "OR2a.1h",
    section: "CS",
    text: "Legal / compliance evolution",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
  },
  {
    id: "OR2a.1i",
    section: "CS",
    text: "Union negotiations",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
  },
  {
    id: "OR2a.1j",
    section: "CS",
    text: "Parent company directive",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
  },
  {
    id: "OR2a.1k",
    section: "CS",
    text: "Other (specify):",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or2a",
    conditional: true,
  },
  {
    id: "OR2a.2",
    section: "CS",
    text: "Other trigger specification",
    route: "/survey/current-support",
    type: "text",
    fieldName: "or2a_other",
    conditional: true,
  },
];

// ============================================
// SECTION OR2b: Most Impactful Change
// ============================================
const OR2B_ITEMS: InstrumentItem[] = [
  {
    id: "OR2b.1",
    section: "CS",
    text: "What has been the single most impactful change your organization has made to support employees managing cancer or other serious health conditions? (Please be as specific and detailed as possible)",
    route: "/survey/current-support",
    type: "textarea",
    fieldName: "or2b",
    required: true,
  },
];

// ============================================
// SECTION OR3: Barriers to Support
// ============================================
const OR3_ITEMS: InstrumentItem[] = [
  {
    id: "OR3.1",
    section: "CS",
    text: "What are the primary barriers preventing more comprehensive support for employees managing cancer or other serious health conditions? (Select ALL that apply)",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1a",
    section: "CS",
    text: "Budget constraints",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1b",
    section: "CS",
    text: "Limited HR bandwidth",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1c",
    section: "CS",
    text: "Lack of expertise / knowledge",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1d",
    section: "CS",
    text: "Competing priorities",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1e",
    section: "CS",
    text: "Small employee population",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1f",
    section: "CS",
    text: "Geographic / jurisdictional complexity",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1g",
    section: "CS",
    text: "Privacy / legal concerns",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1h",
    section: "CS",
    text: "Leadership buy-in",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1i",
    section: "CS",
    text: "Unclear ROI / business case",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1j",
    section: "CS",
    text: "Fear of setting precedent",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1k",
    section: "CS",
    text: "Equity concerns across conditions",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
  },
  {
    id: "OR3.1l",
    section: "CS",
    text: "Other (specify):",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or3",
    conditional: true,
  },
  {
    id: "OR3.2",
    section: "CS",
    text: "Other barrier specification",
    route: "/survey/current-support",
    type: "text",
    fieldName: "or3_other",
    conditional: true,
  },
];

// ============================================
// SECTION OR4: Critical Conditions (NOT USED IN APP)
// ============================================
const OR4_ITEMS: InstrumentItem[] = [
  {
    id: "OR4.note",
    section: "CS",
    text: "OR4 section not implemented in current app version",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or4",
  },
];

// ============================================
// SECTION OR5a: Caregiver Support
// ============================================
const OR5A_ITEMS: InstrumentItem[] = [
  {
    id: "OR5a.1",
    section: "CS",
    text: "What types of caregiver support does your organization provide for employees caring for someone with a serious medical condition? (Select ALL that apply)",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
  },
  {
    id: "OR5a.1a",
    section: "CS",
    text: "Flexible work arrangements",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
  },
  {
    id: "OR5a.1b",
    section: "CS",
    text: "Caregiver leave (paid)",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
  },
  {
    id: "OR5a.1c",
    section: "CS",
    text: "Caregiver leave (unpaid)",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
  },
  {
    id: "OR5a.1d",
    section: "CS",
    text: "Employee assistance program (EAP) with caregiver resources",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
  },
  {
    id: "OR5a.1e",
    section: "CS",
    text: "Caregiver support groups",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
  },
  {
    id: "OR5a.1f",
    section: "CS",
    text: "Backup care services",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
  },
  {
    id: "OR5a.1g",
    section: "CS",
    text: "Financial assistance / subsidies",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
  },
  {
    id: "OR5a.1h",
    section: "CS",
    text: "Resource referrals",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
  },
  {
    id: "OR5a.1i",
    section: "CS",
    text: "Manager training on supporting caregivers",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
  },
  {
    id: "OR5a.1j",
    section: "CS",
    text: "Other (specify):",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
    conditional: true,
  },
  {
    id: "OR5a.1k",
    section: "CS",
    text: "Not able to provide caregiver support at this time",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or5a",
    exclusive: true,
  },
  {
    id: "OR5a.2",
    section: "CS",
    text: "Other support specification",
    route: "/survey/current-support",
    type: "text",
    fieldName: "or5a_other",
    conditional: true,
  },
];

// ============================================
// SECTION OR6: Monitoring Effectiveness
// ============================================
const OR6_ITEMS: InstrumentItem[] = [
  {
    id: "OR6.1",
    section: "CS",
    text: "How does your organization monitor the effectiveness of its workplace support programs while maintaining employee privacy? (Select ALL that apply)",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or6",
  },
  {
    id: "OR6.1a",
    section: "CS",
    text: "Aggregate metrics and analytics only",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or6",
  },
  {
    id: "OR6.1b",
    section: "CS",
    text: "De-identified case tracking",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or6",
  },
  {
    id: "OR6.1c",
    section: "CS",
    text: "General program utilization data",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or6",
  },
  {
    id: "OR6.1d",
    section: "CS",
    text: "Voluntary employee feedback / surveys",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or6",
  },
  {
    id: "OR6.1e",
    section: "CS",
    text: "Some other approach (specify)",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or6",
    conditional: true,
  },
  {
    id: "OR6.1f",
    section: "CS",
    text: "No systematic monitoring",
    route: "/survey/current-support",
    type: "multi-select",
    fieldName: "or6",
  },
  {
    id: "OR6.2",
    section: "CS",
    text: "Other monitoring approach specification",
    route: "/survey/current-support",
    type: "text",
    fieldName: "or6_other",
    conditional: true,
  },
];

// ============================================
// MASTER EXPORTS
// ============================================

export const GENERAL_BENEFITS_ITEMS = [
  ...CB1_ITEMS,
  ...CB1A_ITEMS,
  ...CB2_ITEMS,
  ...CB2B_ITEMS,
  ...CB3_ITEMS,
  ...CB3A_ITEMS,
  ...CB3B_ITEMS,
  ...CB3C_ITEMS,
  ...CB3D_ITEMS,
];

export const CURRENT_SUPPORT_ITEMS = [
  ...OR1_ITEMS,
  ...OR2A_ITEMS,
  ...OR2B_ITEMS,
  ...OR3_ITEMS,
  ...OR4_ITEMS,
  ...OR5A_ITEMS,
  ...OR6_ITEMS,
];

export const ALL_GENERAL_CURRENT_ITEMS = [
  ...GENERAL_BENEFITS_ITEMS,
  ...CURRENT_SUPPORT_ITEMS,
];

// Lookup functions
export function getItemById(id: string): InstrumentItem | undefined {
  return ALL_GENERAL_CURRENT_ITEMS.find(item => item.id === id);
}

export function getItemsBySection(section: string): InstrumentItem[] {
  return ALL_GENERAL_CURRENT_ITEMS.filter(item => item.section === section);
}

export function getItemsByRoute(route: string): InstrumentItem[] {
  return ALL_GENERAL_CURRENT_ITEMS.filter(item => item.route === route);
}

export function getItemsByFieldName(fieldName: string): InstrumentItem[] {
  return ALL_GENERAL_CURRENT_ITEMS.filter(item => item.fieldName === fieldName);
}

// Summary stats
export const GENERAL_BENEFITS_SUMMARY = {
  totalItems: GENERAL_BENEFITS_ITEMS.length,
  sections: ['CB1', 'CB1a', 'CB2', 'CB2b', 'CB3', 'CB3a', 'CB3b', 'CB3c', 'CB3d'],
  route: '/survey/general-benefits',
  storageKey: 'general-benefits_data',
  completionFlag: 'general_benefits_complete',
};

export const CURRENT_SUPPORT_SUMMARY = {
  totalItems: CURRENT_SUPPORT_ITEMS.length,
  sections: ['CS', 'OR1', 'OR2a', 'OR2b', 'OR3', 'OR4', 'OR5a', 'OR6'],
  route: '/survey/current-support',
  storageKey: 'current-support_data',
  completionFlag: 'current_support_complete',
};

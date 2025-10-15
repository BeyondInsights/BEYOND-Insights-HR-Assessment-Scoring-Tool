// data/instrument-items-company-profile.ts
// Company Profile (Firmographics) Section - Complete Data Dictionary
// Organized as appears on Dashboard: CORE SECTION #1

export interface InstrumentItem {
  id: string;
  section: string;
  text: string;
  route: string;
  type: 'text' | 'select' | 'multi-select' | 'likert-4' | 'likert-5';
  fieldName?: string; // localStorage key
  weight?: number;
  required?: boolean;
  conditional?: boolean; // Triggers based on other response
  exclusive?: boolean; // Mutually exclusive with other options
}

// ============================================
// SECTION S1: Birth Year
// ============================================
const S1_ITEMS: InstrumentItem[] = [
  {
    id: "S1.1",
    section: "S1",
    text: "In what year were you born?",
    route: "/survey/firmographics",
    type: "text",
    fieldName: "s1",
    required: true,
  },
];

// ============================================
// SECTION S2: Gender Identity
// ============================================
const S2_ITEMS: InstrumentItem[] = [
  {
    id: "S2.1",
    section: "S2",
    text: "How do you currently identify?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s2",
    required: true,
  },
  {
    id: "S2.1a",
    section: "S2",
    text: "Male",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s2",
  },
  {
    id: "S2.1b",
    section: "S2",
    text: "Female",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s2",
  },
  {
    id: "S2.1c",
    section: "S2",
    text: "Non-binary",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s2",
  },
  {
    id: "S2.1d",
    section: "S2",
    text: "Prefer to self-describe (specify)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s2",
    conditional: true, // Triggers s2_other text field
  },
  {
    id: "S2.1e",
    section: "S2",
    text: "Prefer not to say",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s2",
  },
  {
    id: "S2.2",
    section: "S2",
    text: "Self-describe specification",
    route: "/survey/firmographics",
    type: "text",
    fieldName: "s2_other",
    conditional: true,
  },
];

// ============================================
// SECTION S3: Employment Status (Screener)
// ============================================
const S3_ITEMS: InstrumentItem[] = [
  {
    id: "S3.1",
    section: "S3",
    text: "Are you currently employed?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s3",
    required: true,
  },
];

// ============================================
// SECTION S4a: Department/Function
// ============================================
const S4A_ITEMS: InstrumentItem[] = [
  {
    id: "S4a.1",
    section: "S4a",
    text: "Which department or function do you currently work in?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4a",
    required: true,
  },
  {
    id: "S4a.1a",
    section: "S4a",
    text: "Human Resources",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4a",
  },
  {
    id: "S4a.1b",
    section: "S4a",
    text: "Benefits Administration",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4a",
  },
  {
    id: "S4a.1c",
    section: "S4a",
    text: "Total Rewards / Compensation",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4a",
  },
  {
    id: "S4a.1d",
    section: "S4a",
    text: "Health & Wellness",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4a",
  },
  {
    id: "S4a.1e",
    section: "S4a",
    text: "Employee Relations",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4a",
  },
  {
    id: "S4a.1f",
    section: "S4a",
    text: "Diversity, Equity & Inclusion (DEI)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4a",
  },
  {
    id: "S4a.1g",
    section: "S4a",
    text: "Legal / Compliance",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4a",
  },
  {
    id: "S4a.1h",
    section: "S4a",
    text: "Finance",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4a",
  },
  {
    id: "S4a.1i",
    section: "S4a",
    text: "Operations",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4a",
  },
  {
    id: "S4a.1j",
    section: "S4a",
    text: "Other (specify):",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4a",
    conditional: true, // Triggers s4a_other text field
  },
  {
    id: "S4a.2",
    section: "S4a",
    text: "Other department specification",
    route: "/survey/firmographics",
    type: "text",
    fieldName: "s4a_other",
    conditional: true,
  },
];

// ============================================
// SECTION S4b: Primary Job Function
// ============================================
const S4B_ITEMS: InstrumentItem[] = [
  {
    id: "S4b.1",
    section: "S4b",
    text: "Which best describes your primary job function?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
    required: true,
  },
  {
    id: "S4b.1a",
    section: "S4b",
    text: "VP / SVP / EVP / C-Suite",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
  },
  {
    id: "S4b.1b",
    section: "S4b",
    text: "Director",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
  },
  {
    id: "S4b.1c",
    section: "S4b",
    text: "Senior Manager",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
  },
  {
    id: "S4b.1d",
    section: "S4b",
    text: "Manager",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
  },
  {
    id: "S4b.1e",
    section: "S4b",
    text: "Benefits Manager / Administrator",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
  },
  {
    id: "S4b.1f",
    section: "S4b",
    text: "HR Business Partner",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
  },
  {
    id: "S4b.1g",
    section: "S4b",
    text: "HR Generalist",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
  },
  {
    id: "S4b.1h",
    section: "S4b",
    text: "Specialist / Coordinator",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
  },
  {
    id: "S4b.1i",
    section: "S4b",
    text: "Analyst",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
  },
  {
    id: "S4b.1j",
    section: "S4b",
    text: "Consultant (Internal or External)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
  },
  {
    id: "S4b.1k",
    section: "S4b",
    text: "Some other function (specify):",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s4b",
    conditional: true, // Triggers s4b_other text field
  },
  {
    id: "S4b.2",
    section: "S4b",
    text: "Other function specification",
    route: "/survey/firmographics",
    type: "text",
    fieldName: "s4b_other",
    conditional: true,
  },
];

// ============================================
// SECTION S5: Current Level
// ============================================
const S5_ITEMS: InstrumentItem[] = [
  {
    id: "S5.1",
    section: "S5",
    text: "What is your current level within the organization?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
    required: true,
  },
  {
    id: "S5.1a",
    section: "S5",
    text: "C-Suite (CEO, CFO, CHRO, etc.)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
  },
  {
    id: "S5.1b",
    section: "S5",
    text: "SVP / EVP",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
  },
  {
    id: "S5.1c",
    section: "S5",
    text: "VP",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
  },
  {
    id: "S5.1d",
    section: "S5",
    text: "Senior Director",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
  },
  {
    id: "S5.1e",
    section: "S5",
    text: "Director",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
  },
  {
    id: "S5.1f",
    section: "S5",
    text: "Senior Manager",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
  },
  {
    id: "S5.1g",
    section: "S5",
    text: "Manager",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
  },
  {
    id: "S5.1h",
    section: "S5",
    text: "Individual Contributor - Senior Level",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
  },
  {
    id: "S5.1i",
    section: "S5",
    text: "Individual Contributor - Mid Level",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
  },
  {
    id: "S5.1j",
    section: "S5",
    text: "Individual Contributor - Entry Level",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
  },
  {
    id: "S5.1k",
    section: "S5",
    text: "Some other level (specify):",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s5",
    conditional: true, // Triggers s5_other text field
  },
  {
    id: "S5.2",
    section: "S5",
    text: "Other level specification",
    route: "/survey/firmographics",
    type: "text",
    fieldName: "s5_other",
    conditional: true,
  },
];

// ============================================
// SECTION S6: Areas of Responsibility
// ============================================
const S6_ITEMS: InstrumentItem[] = [
  {
    id: "S6.1",
    section: "S6",
    text: "Which areas fall under your responsibility or influence? (Select all that apply)",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
    required: true,
  },
  {
    id: "S6.1a",
    section: "S6",
    text: "Employee benefits strategy",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
  },
  {
    id: "S6.1b",
    section: "S6",
    text: "Benefits plan design",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
  },
  {
    id: "S6.1c",
    section: "S6",
    text: "Benefits administration",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
  },
  {
    id: "S6.1d",
    section: "S6",
    text: "Vendor management",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
  },
  {
    id: "S6.1e",
    section: "S6",
    text: "Leave & disability programs",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
  },
  {
    id: "S6.1f",
    section: "S6",
    text: "Health & wellness programs",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
  },
  {
    id: "S6.1g",
    section: "S6",
    text: "Employee assistance programs (EAP)",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
  },
  {
    id: "S6.1h",
    section: "S6",
    text: "Workplace accommodations",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
  },
  {
    id: "S6.1i",
    section: "S6",
    text: "Return-to-work programs",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
  },
  {
    id: "S6.1j",
    section: "S6",
    text: "Budget / financial decisions for benefits",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
  },
  {
    id: "S6.1k",
    section: "S6",
    text: "None of these",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "s6",
    exclusive: true, // Mutually exclusive with all other options
  },
];

// ============================================
// SECTION S7: Influence on Benefits Decisions
// ============================================
const S7_ITEMS: InstrumentItem[] = [
  {
    id: "S7.1",
    section: "S7",
    text: "How much influence do you have on employee benefits decisions?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s7",
    required: true,
  },
  {
    id: "S7.1a",
    section: "S7",
    text: "Final decision-maker",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s7",
  },
  {
    id: "S7.1b",
    section: "S7",
    text: "Strong influence - recommendations are usually implemented",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s7",
  },
  {
    id: "S7.1c",
    section: "S7",
    text: "Moderate influence - input is considered",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s7",
  },
  {
    id: "S7.1d",
    section: "S7",
    text: "Limited influence - provide information but decisions made by others",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s7",
  },
  {
    id: "S7.1e",
    section: "S7",
    text: "No influence - not involved in benefits decisions",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s7",
  },
];

// ============================================
// SECTION S8: Organization Size
// ============================================
const S8_ITEMS: InstrumentItem[] = [
  {
    id: "S8.1",
    section: "S8",
    text: "Approximately how many total employees work at your organization (all locations)?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s8",
    required: true,
  },
  {
    id: "S8.1a",
    section: "S8",
    text: "100-249",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s8",
  },
  {
    id: "S8.1b",
    section: "S8",
    text: "250-499",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s8",
  },
  {
    id: "S8.1c",
    section: "S8",
    text: "500-999",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s8",
  },
  {
    id: "S8.1d",
    section: "S8",
    text: "1,000-2,499",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s8",
  },
  {
    id: "S8.1e",
    section: "S8",
    text: "2,500-4,999",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s8",
  },
  {
    id: "S8.1f",
    section: "S8",
    text: "5,000-9,999",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s8",
  },
  {
    id: "S8.1g",
    section: "S8",
    text: "10,000-24,999",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s8",
  },
  {
    id: "S8.1h",
    section: "S8",
    text: "25,000-49,999",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s8",
  },
  {
    id: "S8.1i",
    section: "S8",
    text: "50,000 or more",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s8",
  },
];

// ============================================
// SECTION S9: HQ Country & Global Presence
// ============================================
const S9_ITEMS: InstrumentItem[] = [
  {
    id: "S9.1",
    section: "S9",
    text: "In which country is your organization's headquarters located?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9",
    required: true,
  },
  {
    id: "S9.1a",
    section: "S9",
    text: "United States",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9",
  },
  {
    id: "S9.1b",
    section: "S9",
    text: "United Kingdom",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9",
  },
  {
    id: "S9.1c",
    section: "S9",
    text: "Canada",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9",
  },
  {
    id: "S9.1d",
    section: "S9",
    text: "[... ~200 other countries listed in app ...]",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9",
  },
  {
    id: "S9.1z",
    section: "S9",
    text: "Other (specify):",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9",
    conditional: true, // Triggers s9_other text field
  },
  {
    id: "S9.2",
    section: "S9",
    text: "Other country specification",
    route: "/survey/firmographics",
    type: "text",
    fieldName: "s9_other",
    conditional: true,
  },
];

// ============================================
// SECTION S9a: Number of Other Countries
// ============================================
const S9A_ITEMS: InstrumentItem[] = [
  {
    id: "S9a.1",
    section: "S9a",
    text: "Approximately how many other countries does your organization have offices in?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9a",
    required: true,
  },
  {
    id: "S9a.1a",
    section: "S9a",
    text: "No other countries - headquarters only",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9a",
  },
  {
    id: "S9a.1b",
    section: "S9a",
    text: "1-2 other countries",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9a",
  },
  {
    id: "S9a.1c",
    section: "S9a",
    text: "3-5 other countries",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9a",
  },
  {
    id: "S9a.1d",
    section: "S9a",
    text: "6-10 other countries",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9a",
  },
  {
    id: "S9a.1e",
    section: "S9a",
    text: "11-20 other countries",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9a",
  },
  {
    id: "S9a.1f",
    section: "S9a",
    text: "21-50 other countries",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9a",
  },
  {
    id: "S9a.1g",
    section: "S9a",
    text: "More than 50 countries",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "s9a",
  },
];

// ============================================
// SECTION C2/CLASSIFICATION: Industry
// ============================================
const C2_ITEMS: InstrumentItem[] = [
  {
    id: "C2.1",
    section: "CLASSIFICATION",
    text: "Which best describes your organization's industry?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
    required: true,
  },
  // HEALTHCARE & LIFE SCIENCES
  {
    id: "C2.1a",
    section: "CLASSIFICATION",
    text: "Healthcare Providers (Hospitals, Clinics, Medical Groups)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.1b",
    section: "CLASSIFICATION",
    text: "Life Sciences & Pharmaceuticals",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.1c",
    section: "CLASSIFICATION",
    text: "Medical Devices & Equipment",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.1d",
    section: "CLASSIFICATION",
    text: "Biotechnology",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  // FINANCIAL SERVICES
  {
    id: "C2.2a",
    section: "CLASSIFICATION",
    text: "Banking & Financial Services",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.2b",
    section: "CLASSIFICATION",
    text: "Insurance",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.2c",
    section: "CLASSIFICATION",
    text: "Investment Management & Private Equity",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  // TECHNOLOGY
  {
    id: "C2.3a",
    section: "CLASSIFICATION",
    text: "Technology Hardware & Equipment",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.3b",
    section: "CLASSIFICATION",
    text: "Software & IT Services",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.3c",
    section: "CLASSIFICATION",
    text: "Telecommunications",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  // PROFESSIONAL SERVICES
  {
    id: "C2.4a",
    section: "CLASSIFICATION",
    text: "Professional & Business Services (Legal, Consulting, Accounting, Marketing)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.4b",
    section: "CLASSIFICATION",
    text: "Scientific & Technical Services (Engineering, R&D, Architecture, Labs)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  // CONSUMER & RETAIL
  {
    id: "C2.5a",
    section: "CLASSIFICATION",
    text: "Retail & E-commerce",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.5b",
    section: "CLASSIFICATION",
    text: "Consumer Products & Services",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.5c",
    section: "CLASSIFICATION",
    text: "Hospitality & Tourism (Hotels, Restaurants, Travel)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  // INDUSTRIAL & MANUFACTURING
  {
    id: "C2.6a",
    section: "CLASSIFICATION",
    text: "Manufacturing (General)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.6b",
    section: "CLASSIFICATION",
    text: "Automotive & Transportation Equipment",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.6c",
    section: "CLASSIFICATION",
    text: "Aerospace & Defense",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.6d",
    section: "CLASSIFICATION",
    text: "Construction & Engineering",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  // ENERGY & UTILITIES
  {
    id: "C2.7a",
    section: "CLASSIFICATION",
    text: "Energy & Utilities",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.7b",
    section: "CLASSIFICATION",
    text: "Mining, Quarrying, and Oil and Gas Extraction",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  // EDUCATION & GOVERNMENT
  {
    id: "C2.8a",
    section: "CLASSIFICATION",
    text: "Education (K-12, Higher Education, EdTech)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.8b",
    section: "CLASSIFICATION",
    text: "Government & Public Administration",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.8c",
    section: "CLASSIFICATION",
    text: "Non-Profit Organizations",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  // OTHER SECTORS
  {
    id: "C2.9a",
    section: "CLASSIFICATION",
    text: "Real Estate and Rental and Leasing",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.9b",
    section: "CLASSIFICATION",
    text: "Transportation & Logistics",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.9c",
    section: "CLASSIFICATION",
    text: "Media & Publishing (TV, Radio, Digital, News, Streaming)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.9d",
    section: "CLASSIFICATION",
    text: "Entertainment & Arts",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.9e",
    section: "CLASSIFICATION",
    text: "Agriculture, Forestry, Fishing",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
  },
  {
    id: "C2.9z",
    section: "CLASSIFICATION",
    text: "Other industry / Services (specify)",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c2",
    conditional: true, // Triggers c2_other text field
  },
  {
    id: "C2.2",
    section: "CLASSIFICATION",
    text: "Other industry specification",
    route: "/survey/firmographics",
    type: "text",
    fieldName: "c2_other",
    conditional: true,
  },
];

// ============================================
// SECTION C3: Benefits Eligibility
// ============================================
const C3_ITEMS: InstrumentItem[] = [
  {
    id: "C3.1",
    section: "CLASSIFICATION",
    text: "Approximately what percentage of your workforce is eligible for standard employee benefits (health insurance, paid leave, etc.)?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c3",
    required: true,
  },
  {
    id: "C3.1a",
    section: "CLASSIFICATION",
    text: "0-24%",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c3",
  },
  {
    id: "C3.1b",
    section: "CLASSIFICATION",
    text: "25-49%",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c3",
  },
  {
    id: "C3.1c",
    section: "CLASSIFICATION",
    text: "50-74%",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c3",
  },
  {
    id: "C3.1d",
    section: "CLASSIFICATION",
    text: "75-89%",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c3",
  },
  {
    id: "C3.1e",
    section: "CLASSIFICATION",
    text: "90-100%",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c3",
  },
];

// ============================================
// SECTION C4 (C3a): Groups Excluded from Benefits
// ============================================
const C4_ITEMS: InstrumentItem[] = [
  {
    id: "C4.1",
    section: "CLASSIFICATION",
    text: "Which employee groups are typically EXCLUDED from workplace support benefits? (Select all that apply)",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "c4",
    required: true,
  },
  {
    id: "C4.1a",
    section: "CLASSIFICATION",
    text: "Part-time employees",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "c4",
  },
  {
    id: "C4.1b",
    section: "CLASSIFICATION",
    text: "Temporary employees",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "c4",
  },
  {
    id: "C4.1c",
    section: "CLASSIFICATION",
    text: "Contract workers / Freelancers",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "c4",
  },
  {
    id: "C4.1d",
    section: "CLASSIFICATION",
    text: "Seasonal employees",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "c4",
  },
  {
    id: "C4.1e",
    section: "CLASSIFICATION",
    text: "Interns",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "c4",
  },
  {
    id: "C4.1f",
    section: "CLASSIFICATION",
    text: "Union employees (covered under separate agreements)",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "c4",
  },
  {
    id: "C4.1g",
    section: "CLASSIFICATION",
    text: "International employees",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "c4",
  },
  {
    id: "C4.1h",
    section: "CLASSIFICATION",
    text: "Executives (covered under separate plans)",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "c4",
  },
  {
    id: "C4.1i",
    section: "CLASSIFICATION",
    text: "Other (specify):",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "c4",
    conditional: true, // Triggers c4_other text field
  },
  {
    id: "C4.1j",
    section: "CLASSIFICATION",
    text: "None - all employees eligible",
    route: "/survey/firmographics",
    type: "multi-select",
    fieldName: "c4",
    exclusive: true, // Mutually exclusive with all other options
  },
  {
    id: "C4.2",
    section: "CLASSIFICATION",
    text: "Other excluded groups specification",
    route: "/survey/firmographics",
    type: "text",
    fieldName: "c4_other",
    conditional: true,
  },
];

// ============================================
// SECTION C5: Annual Revenue
// ============================================
const C5_ITEMS: InstrumentItem[] = [
  {
    id: "C5.1",
    section: "CLASSIFICATION",
    text: "What is your organization's approximate annual revenue?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c5",
    required: true,
  },
  {
    id: "C5.1a",
    section: "CLASSIFICATION",
    text: "Less than $10 million",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c5",
  },
  {
    id: "C5.1b",
    section: "CLASSIFICATION",
    text: "$10 million - $49 million",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c5",
  },
  {
    id: "C5.1c",
    section: "CLASSIFICATION",
    text: "$50 million - $99 million",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c5",
  },
  {
    id: "C5.1d",
    section: "CLASSIFICATION",
    text: "$100 million - $499 million",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c5",
  },
  {
    id: "C5.1e",
    section: "CLASSIFICATION",
    text: "$500 million - $999 million",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c5",
  },
  {
    id: "C5.1f",
    section: "CLASSIFICATION",
    text: "$1 billion - $4.9 billion",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c5",
  },
  {
    id: "C5.1g",
    section: "CLASSIFICATION",
    text: "$5 billion - $9.9 billion",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c5",
  },
  {
    id: "C5.1h",
    section: "CLASSIFICATION",
    text: "$10 billion or more",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c5",
  },
  {
    id: "C5.1i",
    section: "CLASSIFICATION",
    text: "Prefer not to say",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c5",
  },
];

// ============================================
// SECTION C6: Remote/Hybrid Work Policy
// ============================================
const C6_ITEMS: InstrumentItem[] = [
  {
    id: "C6.1",
    section: "CLASSIFICATION",
    text: "Which best describes your organization's approach to remote/hybrid work?",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c6",
    required: true,
  },
  {
    id: "C6.1a",
    section: "CLASSIFICATION",
    text: "Fully flexible - Most roles can be remote/hybrid by employee choice",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c6",
  },
  {
    id: "C6.1b",
    section: "CLASSIFICATION",
    text: "Selectively flexible - Many roles eligible based on job requirements",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c6",
  },
  {
    id: "C6.1c",
    section: "CLASSIFICATION",
    text: "Limited flexibility - Some roles eligible but most require on-site presence",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c6",
  },
  {
    id: "C6.1d",
    section: "CLASSIFICATION",
    text: "Minimal flexibility - Very few roles eligible for remote/hybrid",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c6",
  },
  {
    id: "C6.1e",
    section: "CLASSIFICATION",
    text: "No flexibility - All employees required on-site",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c6",
  },
  {
    id: "C6.1z",
    section: "CLASSIFICATION",
    text: "Other arrangement (specify):",
    route: "/survey/firmographics",
    type: "select",
    fieldName: "c6",
    conditional: true, // Triggers c6_other text field
  },
  {
    id: "C6.2",
    section: "CLASSIFICATION",
    text: "Other arrangement specification",
    route: "/survey/firmographics",
    type: "text",
    fieldName: "c6_other",
    conditional: true,
  },
];

// ============================================
// MASTER EXPORT - COMPANY PROFILE
// ============================================
export const COMPANY_PROFILE_ITEMS = [
  ...S1_ITEMS,
  ...S2_ITEMS,
  ...S3_ITEMS,
  ...S4A_ITEMS,
  ...S4B_ITEMS,
  ...S5_ITEMS,
  ...S6_ITEMS,
  ...S7_ITEMS,
  ...S8_ITEMS,
  ...S9_ITEMS,
  ...S9A_ITEMS,
  ...C2_ITEMS,
  ...C3_ITEMS,
  ...C4_ITEMS,
  ...C5_ITEMS,
  ...C6_ITEMS,
];

// Lookup functions
export function getCompanyProfileItemById(id: string): InstrumentItem | undefined {
  return COMPANY_PROFILE_ITEMS.find(item => item.id === id);
}

export function getCompanyProfileItemsBySection(section: string): InstrumentItem[] {
  return COMPANY_PROFILE_ITEMS.filter(item => item.section === section);
}

export function getCompanyProfileItemsByFieldName(fieldName: string): InstrumentItem[] {
  return COMPANY_PROFILE_ITEMS.filter(item => item.fieldName === fieldName);
}

// Summary stats
export const COMPANY_PROFILE_SUMMARY = {
  totalItems: COMPANY_PROFILE_ITEMS.length,
  totalQuestions: COMPANY_PROFILE_ITEMS.filter(item => item.required).length,
  sections: ['S1', 'S2', 'S3', 'S4a', 'S4b', 'S5', 'S6', 'S7', 'S8', 'S9', 'S9a', 'CLASSIFICATION'],
  route: '/survey/firmographics',
  storageKey: 'firmographics_data',
  completionFlag: 'firmographics_complete',
};

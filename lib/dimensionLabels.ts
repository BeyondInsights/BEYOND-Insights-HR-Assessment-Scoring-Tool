// Complete Label Mappings for Company Profile Export
// Add this to your Company Profile page to fix ALL dimension labels

// ============================================
// DIMENSION 1: MEDICAL LEAVE & FLEXIBILITY
// ============================================
const D1_QUESTIONS: Record<string, string> = {
  // D1.a Grid Items (11 programs)
  "Paid medical leave beyond local / legal requirements": "Paid medical leave beyond local/legal requirements",
  "Intermittent leave beyond local / legal requirements": "Intermittent leave beyond local/legal requirements",
  "Flexible work hours during treatment (e.g., varying start/end times, compressed schedules)": "Flexible work hours during treatment",
  "Remote work options for on-site employees": "Remote work options for on-site employees",
  "Reduced schedule/part-time with full benefits": "Reduced schedule/part-time with full benefits",
  "Job protection beyond local / legal requirements": "Job protection beyond local/legal requirements",
  "Emergency leave within 24 hours": "Emergency leave within 24 hours",
  "Leave donation bank (employees can donate PTO to colleagues)": "Leave donation bank",
  "Disability pay top-up (employer adds to disability insurance)": "Disability pay top-up",
  "PTO accrual during leave": "PTO accrual during leave",
  "Paid micro-breaks for medical-related side effects": "Paid micro-breaks for side effects",
  
  // D1.aa Multi-Country Question
  "d1aa": "Geographic consistency of support options",
  
  // D1.b Open-Ended
  "d1b": "Additional medical leave & flexibility benefits",
  "d1b_none": "No additional benefits",
  
  // D1.1 - Paid Medical Leave Duration
  "d1_1_usa": "Paid medical leave duration (USA)",
  "d1_1_non_usa": "Paid medical leave duration (Non-USA)",
  
  // D1.2 - Intermittent Leave
  "d1_2_usa": "Intermittent leave duration (USA)",
  "d1_2_non_usa": "Intermittent leave duration (Non-USA)",
  
  // D1.4a - Remote Work
  "d1_4a": "Remote work availability details",
  "d1_4a_weeks": "Remote work duration (weeks)",
  "d1_4a_months": "Remote work duration (months)",
  "d1_4a_type": "Remote work availability type",
  
  // D1.4b - Reduced Schedule
  "d1_4b": "Reduced schedule details",
  
  // D1.5 - Job Protection
  "d1_5_usa": "Job protection duration (USA)",
  "d1_5_non_usa": "Job protection duration (Non-USA)",
  
  // D1.6 - Disability Enhancement
  "d1_6": "Disability benefit enhancements"
};

// ============================================
// DIMENSION 2: INSURANCE & FINANCIAL PROTECTION
// ============================================
const D2_QUESTIONS: Record<string, string> = {
  // D2.a Grid Items (17 programs)
  "Coverage for clinical trials and experimental treatments not covered by standard health insurance": "Clinical trials coverage",
  "Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance": "Advanced therapies coverage",
  "Paid time off for clinical trial participation": "PTO for clinical trials",
  "Set out-of-pocket maximums (for in-network single coverage)": "Out-of-pocket maximums",
  "Travel/lodging reimbursement for specialized care beyond insurance coverage": "Travel/lodging reimbursement",
  "Financial counseling services": "Financial counseling",
  "Voluntary supplemental illness insurance (with employer contribution)": "Supplemental illness insurance",
  "Real-time cost estimator tools": "Cost estimator tools",
  "Insurance advocacy/pre-authorization support": "Insurance advocacy",
  "$0 copay for specialty drugs": "$0 specialty drug copays",
  "Hardship grants program funded by employer": "Hardship grants",
  "Tax/estate planning assistance": "Tax/estate planning",
  "Short-term disability covering 60%+ of salary": "Short-term disability (60%+)",
  "Long-term disability covering 60%+ of salary": "Long-term disability (60%+)",
  "Employer-paid disability insurance supplements": "Disability insurance supplements",
  "Guaranteed job protection": "Guaranteed job protection",
  "Accelerated life insurance benefits (partial payout for terminal / critical illness)": "Accelerated life insurance",
  
  // D2.aa Multi-Country
  "d2aa": "Geographic consistency of support options",
  
  // D2.b Open-Ended
  "d2b": "Additional insurance & financial benefits",
  "d2b_none": "No additional benefits"
};

// ============================================
// DIMENSION 3: MANAGER PREPAREDNESS & CAPABILITY
// ============================================
const D3_QUESTIONS: Record<string, string> = {
  // D3.a Grid Items (10 programs)
  "Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams": "Manager training on supporting impacted employees",
  "Clear escalation protocol for manager response": "Clear escalation protocol",
  "Dedicated manager resource hub": "Dedicated manager resource hub",
  "Empathy/communication skills training": "Empathy/communication training",
  "Legal compliance training": "Legal compliance training",
  "Senior leader coaching on supporting impacted employees": "Senior leader coaching",
  "Manager evaluations include how well they support impacted employees": "Manager evaluations include support metrics",
  "Manager peer support / community building": "Manager peer support",
  "AI-powered guidance tools": "AI-powered guidance tools",
  "Privacy protection and confidentiality management": "Privacy & confidentiality management",
  
  // D3.aa Multi-Country
  "d3aa": "Geographic consistency of support options",
  
  // D3.b Open-Ended
  "d3b": "Additional manager preparedness initiatives",
  "d3b_none": "No additional initiatives",
  
  // D3.1a - Training Requirements
  "d3_1a": "Manager training requirement level",
  
  // D3.1 - Training Completion
  "d3_1": "Manager training completion rate (past 2 years)"
};

// ============================================
// DIMENSION 4: NAVIGATION & EXPERT RESOURCES
// ============================================
const D4_QUESTIONS: Record<string, string> = {
  // D4.a Grid Items (10 programs)
  "Dedicated navigation support to help employees understand benefits and access medical care": "Dedicated navigation support",
  "Benefits optimization assistance (maximizing coverage, minimizing costs)": "Benefits optimization",
  "Insurance advocacy/appeals support": "Insurance advocacy",
  "Clinical trial matching service": "Clinical trial matching",
  "Care coordination concierge": "Care coordination concierge",
  "Online tools, apps, or portals for health/benefits support": "Online health/benefits tools",
  "Survivorship planning assistance": "Survivorship planning",
  "Nutrition coaching": "Nutrition coaching",
  "Physical rehabilitation support": "Physical rehabilitation",
  "Occupational therapy/vocational rehabilitation": "Occupational therapy",
  
  // D4.aa Multi-Country
  "d4aa": "Geographic consistency of support options",
  
  // D4.b Open-Ended
  "d4b": "Additional navigation & expert resources",
  "d4b_none": "No additional resources",
  
  // D4.1a - Navigator Provider
  "d4_1a": "Navigation support provider(s)",
  
  // D4.1b - Navigator Services
  "d4_1b": "Services available through navigation support"
};

// ============================================
// DIMENSION 5: WORKPLACE ACCOMMODATIONS
// ============================================
const D5_QUESTIONS: Record<string, string> = {
  // D5.a Grid Items (11 programs)
  "Physical workspace modifications": "Physical workspace modifications",
  "Cognitive / fatigue support tools": "Cognitive/fatigue support tools",
  "Ergonomic equipment funding": "Ergonomic equipment funding",
  "Flexible scheduling options": "Flexible scheduling",
  "Remote work capability": "Remote work capability",
  "Rest areas / quiet spaces": "Rest areas/quiet spaces",
  "Priority parking": "Priority parking",
  "Temporary role redesigns": "Temporary role redesigns",
  "Assistive technology catalog": "Assistive technology",
  "Transportation reimbursement": "Transportation reimbursement",
  "Policy accommodations (e.g., dress code flexibility, headphone use)": "Policy accommodations",
  
  // D5.aa Multi-Country
  "d5aa": "Geographic consistency of support options",
  
  // D5.b Open-Ended
  "d5b": "Additional workplace accommodations",
  "d5b_none": "No additional accommodations"
};

// ============================================
// DIMENSION 6: CULTURE & PSYCHOLOGICAL SAFETY
// ============================================
const D6_QUESTIONS: Record<string, string> = {
  // D6.a Grid Items (12 programs)
  "Strong anti-discrimination policies specific to health conditions": "Anti-discrimination policies",
  "Clear process for confidential health disclosures": "Confidential disclosure process",
  "Manager training on handling sensitive health information": "Manager training on health information",
  "Written anti-retaliation policies for health disclosures": "Anti-retaliation policies",
  "Employee peer support groups (internal employees with shared experience)": "Employee peer support groups",
  "Professional-led support groups (external facilitator/counselor)": "Professional-led support groups",
  "Stigma-reduction initiatives": "Stigma-reduction initiatives",
  "Specialized emotional counseling": "Specialized emotional counseling",
  "Optional open health dialogue forums": "Open health dialogue forums",
  "Inclusive communication guidelines": "Inclusive communication guidelines",
  "Confidential HR channel for health benefits, policies and insurance-related questions": "Confidential HR channel",
  "Anonymous benefits navigation tool or website (no login required)": "Anonymous benefits navigation",
  
  // D6.aa Multi-Country
  "d6aa": "Geographic consistency of support options",
  
  // D6.b Open-Ended
  "d6b": "Additional culture & psychological safety supports",
  "d6b_none": "No additional supports",
  
  // D6.2 - Measurement Approach
  "d6_2": "Psychological safety measurement approach"
};

// ============================================
// DIMENSION 7: CAREER CONTINUITY & ADVANCEMENT
// ============================================
const D7_QUESTIONS: Record<string, string> = {
  // D7.a Grid Items (9 programs)
  "Continued access to training/development": "Continued training/development access",
  "Structured reintegration programs": "Structured reintegration programs",
  "Peer mentorship program (employees who had similar condition mentoring current employees)": "Peer mentorship program",
  "Professional coach/mentor for employees managing cancer or other serious health conditions": "Professional coach/mentor",
  "Adjusted performance goals/deliverables during treatment and recovery": "Adjusted performance goals",
  "Career coaching for employees managing cancer or other serious health conditions": "Career coaching",
  "Succession planning protections": "Succession planning protections",
  "Project continuity protocols": "Project continuity protocols",
  "Optional stay-connected program": "Stay-connected program",
  
  // D7.aa Multi-Country
  "d7aa": "Geographic consistency of support options",
  
  // D7.b Open-Ended
  "d7b": "Additional career continuity supports",
  "d7b_none": "No additional supports"
};

// ============================================
// DIMENSION 8: WORK CONTINUATION & RESUMPTION
// ============================================
const D8_QUESTIONS: Record<string, string> = {
  // D8.a Grid Items (12 programs)
  "Flexible work arrangements during treatment": "Flexible work during treatment",
  "Phased return-to-work plans": "Phased return-to-work plans",
  "Workload adjustments during treatment": "Workload adjustments",
  "Flexibility for medical setbacks": "Flexibility for medical setbacks",
  "Buddy/mentor pairing for support": "Buddy/mentor pairing",
  "Structured progress reviews": "Structured progress reviews",
  "Contingency planning for treatment schedules": "Contingency planning",
  "Long-term success tracking": "Long-term success tracking",
  "Access to occupational therapy/vocational rehabilitation": "Occupational therapy access",
  "Online peer support forums": "Online peer support forums",
  "Access to specialized work resumption professionals": "Work resumption professionals",
  "Manager training on supporting team members during treatment/return": "Manager training on treatment/return support",
  
  // D8.aa Multi-Country
  "d8aa": "Geographic consistency of support options",
  
  // D8.b Open-Ended
  "d8b": "Additional work continuation/resumption supports",
  "d8b_none": "No additional supports"
};

// ============================================
// DIMENSION 9: EXECUTIVE COMMITMENT & RESOURCES
// ============================================
const D9_QUESTIONS: Record<string, string> = {
  // D9.a Grid Items (11 programs)
  "Executive accountability metrics": "Executive accountability metrics",
  "Public success story celebrations": "Public success story celebrations",
  "Compensation tied to support outcomes": "Compensation tied to support outcomes",
  "ESG/CSR reporting inclusion": "ESG/CSR reporting inclusion",
  "Year-over-year budget growth": "Year-over-year budget growth",
  "Executive sponsors communicate regularly about workplace support programs": "Executive sponsor communications",
  "Dedicated budget allocation for serious illness support programs": "Dedicated budget allocation",
  "C-suite executive serves as program champion/sponsor": "C-suite program champion",
  "Support programs included in investor/stakeholder communications": "Investor/stakeholder communications",
  "Cross-functional executive steering committee for workplace support programs": "Executive steering committee",
  "Support metrics included in annual report/sustainability reporting": "Annual report/sustainability metrics",
  
  // D9.aa Multi-Country
  "d9aa": "Geographic consistency of support options",
  
  // D9.b Open-Ended
  "d9b": "Additional executive commitment practices",
  "d9b_none": "No additional practices"
};

// ============================================
// DIMENSION 10: CAREGIVER & FAMILY SUPPORT
// ============================================
const D10_QUESTIONS: Record<string, string> = {
  // D10.a Grid Items (19 programs)
  "Paid caregiver leave with expanded eligibility (beyond local legal requirements)": "Paid caregiver leave (expanded)",
  "Flexible work arrangements for caregivers": "Flexible work for caregivers",
  "Dependent care subsidies": "Dependent care subsidies",
  "Emergency caregiver funds": "Emergency caregiver funds",
  "Dependent care account matching/contributions": "Dependent care account matching",
  "Family navigation support": "Family navigation support",
  "Caregiver peer support groups": "Caregiver peer support groups",
  "Mental health support specifically for caregivers": "Mental health support for caregivers",
  "Manager training for supervising caregivers": "Manager training for supervising caregivers",
  "Practical support for managing caregiving and work": "Practical caregiving/work support",
  "Emergency dependent care when regular arrangements unavailable": "Emergency dependent care",
  "Respite care funding/reimbursement": "Respite care funding",
  "Caregiver resource navigator/concierge": "Caregiver resource navigator",
  "Legal/financial planning assistance for caregivers": "Legal/financial planning for caregivers",
  "Modified job duties during peak caregiving periods": "Modified job duties for caregivers",
  "Unpaid leave job protection beyond local / legal requirements": "Unpaid leave job protection (expanded)",
  "Eldercare consultation and referral services": "Eldercare consultation",
  "Paid time off for care coordination appointments": "PTO for care coordination",
  "Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)": "Expanded caregiver leave eligibility",
  
  // D10.aa Multi-Country
  "d10aa": "Geographic consistency of support options",
  
  // D10.b Open-Ended
  "d10b": "Additional caregiver & family support",
  "d10b_none": "No additional support",
  
  // D10.1 - Paid Caregiver Leave Duration
  "d10_1": "Paid caregiver leave duration (beyond legal requirements)"
};

// ============================================
// DIMENSION 11: PREVENTION, WELLNESS & LEGAL
// ============================================
const D11_QUESTIONS: Record<string, string> = {
  // D11.a Grid Items (13 programs)
  "At least 70% coverage for regionally / locally recommended screenings": "70%+ coverage for recommended screenings",
  "Full or partial coverage for annual health screenings/checkups": "Annual health screening coverage",
  "Targeted risk-reduction programs": "Risk-reduction programs",
  "Paid time off for preventive care appointments": "PTO for preventive care",
  "Legal protections beyond requirements": "Legal protections (beyond requirements)",
  "Workplace safety assessments to minimize health risks": "Workplace safety assessments",
  "Regular health education sessions": "Health education sessions",
  "Individual health assessments (online or in-person)": "Individual health assessments",
  "Genetic screening/counseling": "Genetic screening/counseling",
  "On-site vaccinations": "On-site vaccinations",
  "Lifestyle coaching programs": "Lifestyle coaching",
  "Risk factor tracking/reporting": "Risk factor tracking",
  "Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)": "Policies for immuno-compromised colleagues",
  
  // D11.aa Multi-Country
  "d11aa": "Geographic consistency of support options",
  
  // D11.b Open-Ended
  "d11b": "Additional prevention/wellness initiatives",
  "d11b_none": "No additional initiatives",
  
  // D11.1 - Preventive Services at 100%
  "d11_1": "Early detection & preventive services covered at 100%"
};

// ============================================
// DIMENSION 12: CONTINUOUS IMPROVEMENT
// ============================================
const D12_QUESTIONS: Record<string, string> = {
  // D12.a Grid Items (8 programs)
  "Return-to-work success metrics": "Return-to-work success metrics",
  "Employee satisfaction tracking": "Employee satisfaction tracking",
  "Business impact/ROI assessment": "Business impact/ROI assessment",
  "Regular program enhancements": "Regular program enhancements",
  "External benchmarking": "External benchmarking",
  "Innovation pilots": "Innovation pilots",
  "Employee confidence in employer support": "Employee confidence tracking",
  "Program utilization analytics": "Program utilization analytics",
  
  // D12.aa Multi-Country
  "d12aa": "Geographic consistency of measurement",
  
  // D12.b Open-Ended
  "d12b": "Additional measurement/improvement practices",
  "d12b_none": "No additional practices",
  
  // D12.1 - Case Review Process
  "d12_1": "Individual case review approach",
  
  // D12.2 - Changes Implemented
  "d12_2": "Changes implemented based on employee experiences"
};

// ============================================
// DIMENSION 13: COMMUNICATION & AWARENESS
// ============================================
const D13_QUESTIONS: Record<string, string> = {
  // D13.a Grid Items (9 programs)
  "Proactive communication at point of diagnosis disclosure": "Proactive communication at diagnosis",
  "Dedicated program website or portal": "Dedicated program website/portal",
  "Regular company-wide awareness campaigns (at least quarterly)": "Regular awareness campaigns (quarterly+)",
  "New hire orientation coverage": "New hire orientation coverage",
  "Manager toolkit for cascade communications": "Manager communication toolkit",
  "Employee testimonials/success stories": "Employee testimonials",
  "Multi-channel communication strategy": "Multi-channel strategy",
  "Family/caregiver communication inclusion": "Family/caregiver communications",
  "Anonymous information access options": "Anonymous information access",
  
  // D13.aa Multi-Country
  "d13aa": "Geographic consistency of approach",
  
  // D13.b Open-Ended
  "d13b": "Additional communication/awareness approaches",
  "d13b_none": "No additional approaches",
  
  // D13.1 - Communication Frequency
  "d13_1": "Communication frequency about support programs"
};

// ============================================
// MASTER LOOKUP FUNCTION
// ============================================
const ALL_DIMENSION_QUESTIONS: Record<string, Record<string, string>> = {
  d1: D1_QUESTIONS,
  d2: D2_QUESTIONS,
  d3: D3_QUESTIONS,
  d4: D4_QUESTIONS,
  d5: D5_QUESTIONS,
  d6: D6_QUESTIONS,
  d7: D7_QUESTIONS,
  d8: D8_QUESTIONS,
  d9: D9_QUESTIONS,
  d10: D10_QUESTIONS,
  d11: D11_QUESTIONS,
  d12: D12_QUESTIONS,
  d13: D13_QUESTIONS
};

/**
 * Get human-readable label for any dimension question
 * @param dimNumber - Dimension number (1-13)
 * @param fieldKey - The localStorage key (e.g., "d1_1_usa", "d2aa")
 * @returns Human-readable label
 */
export function getQuestionLabel(dimNumber: number, fieldKey: string): string {
  const dimKey = `d${dimNumber}`;
  const questions = ALL_DIMENSION_QUESTIONS[dimKey];
  
  // Try exact match first
  if (questions && questions[fieldKey]) {
    return questions[fieldKey];
  }
  
  // Fallback: format the key nicely
  return fieldKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Usa/g, 'USA')
    .replace(/Non Usa/g, 'Non-USA');
}

/**
 * Use this in your Company Profile page's parseDimensionData function
 */
export function parseDimensionData(
  dimNumber: number,
  data: Record<string, any>
): { programs: Array<any>; items: Array<{ question: string; response: string }> } {
  const programs: Array<any> = [];
  const items: Array<{ question: string; response: string }> = [];
  
  Object.entries(data).forEach(([key, value]) => {
    // Handle grid fields (d1a, d2a, etc.) - these go into PROGRAMS
    if (key.match(/^d\d+a$/) && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([questionText, response]) => {
        if (response && typeof response === 'string') {
          programs.push({ question: questionText, response: response });
        }
      });
      return;
    }
    
    // Skip _none fields
    if (key.endsWith('_none')) return;
    
    // Handle all other fields - these go into ITEMS
    if (key.match(/^d\d+/)) {
      const label = getQuestionLabel(dimNumber, key);
      
      // Handle array responses
      if (Array.isArray(value)) {
        if (value.length > 0) {
          items.push({
            question: label,
            response: value.join(', ')
          });
        }
      }
      // Handle string/number responses
      else if (value && typeof value !== 'object') {
        items.push({
          question: label,
          response: String(value)
        });
      }
    }
  });
  
  return { programs, items };
}

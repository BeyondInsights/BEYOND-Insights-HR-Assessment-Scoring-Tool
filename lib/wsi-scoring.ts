// ============================================
// WSI SCORING — Shared Constants & Functions
// Extracted from admin report for use by both
// the report page and the scoring/aggregate page
// ============================================

export const ELEMENT_MATURITY_LEVEL: Record<string, string> = {
  "$0 copay for specialty drugs": "advanced",
  "AI-powered guidance tools": "advanced",
  "Ability to access program information and resources anonymously": "core",
  "Accelerated life insurance benefits (partial payout for terminal / critical illness)": "enhanced",
  "Access to specialized work resumption professionals": "advanced",
  "Adjusted performance goals/deliverables during treatment and recovery": "enhanced",
  "Anonymous benefits navigation tool or website (no login required)": "enhanced",
  "Assistive technology catalog": "advanced",
  "At least 70% coverage for regionally / locally recommended screenings": "enhanced",
  "Benefits optimization assistance (maximizing coverage, minimizing costs)": "enhanced",
  "Buddy/mentor pairing for support": "enhanced",
  "Business impact/ROI assessment": "enhanced",
  "C-suite executive serves as program champion/sponsor": "enhanced",
  "Care coordination concierge": "enhanced",
  "Career coaching for employees managing cancer or other serious health conditions": "advanced",
  "Caregiver peer support groups": "enhanced",
  "Caregiver concierge/navigator services (e.g., coordinating logistics, scheduling, transportation, home care)": "enhanced",
  "Clear escalation protocol for manager response": "enhanced",
  "Clear process for confidential health disclosures": "core",
  "Clinical trial matching service": "advanced",
  "Cognitive / fatigue support tools": "enhanced",
  "Compensation tied to support outcomes": "advanced",
  "Confidential HR channel for health benefits, policies and insurance-related questions": "core",
  "Contingency planning for treatment schedules": "enhanced",
  "Continued access to training/development": "core",
  "Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance": "advanced",
  "Coverage for clinical trials and experimental treatments not covered by standard health insurance": "advanced",
  "Cross-functional executive steering committee for workplace support programs": "enhanced",
  "Dedicated budget allocation for serious illness support programs": "enhanced",
  "Dedicated manager resource hub": "enhanced",
  "Dedicated navigation support to help employees understand benefits and access medical care": "core",
  "Dedicated program website or portal": "enhanced",
  "Dependent care account matching/contributions": "advanced",
  "Dependent care subsidies": "advanced",
  "Disability pay top-up (employer adds to disability insurance)": "advanced",
  "ESG/CSR reporting inclusion": "enhanced",
  "Eldercare consultation and referral services": "enhanced",
  "Emergency caregiver funds": "advanced",
  "Emergency dependent care when regular arrangements unavailable": "enhanced",
  "Emergency leave within 24 hours": "core",
  "Empathy/communication skills training": "core",
  "Employee confidence in employer support": "core",
  "Employee peer support groups (internal employees with shared experience)": "core",
  "Employee satisfaction tracking": "enhanced",
  "Employee testimonials/success stories": "core",
  "Employer-paid disability insurance supplements": "enhanced",
  "Ergonomic equipment funding": "core",
  "Executive accountability metrics": "advanced",
  "Executive sponsors communicate regularly about workplace support programs": "enhanced",
  "Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)": "enhanced",
  "External benchmarking": "enhanced",
  "Family navigation support": "enhanced",
  "Family/caregiver communication inclusion": "enhanced",
  "Financial counseling services": "enhanced",
  "Flexibility for medical setbacks": "core",
  "Flexible scheduling options": "core",
  "Flexible work arrangements during treatment": "core",
  "Flexible work arrangements for caregivers": "core",
  "Flexible work hours during treatment (e.g., varying start/end times, compressed schedules)": "core",
  "Full or partial coverage for annual health screenings/checkups": "core",
  "Genetic screening/counseling": "advanced",
  "Guaranteed job protection": "core",
  "Hardship grants program funded by employer": "advanced",
  "Inclusive communication guidelines": "core",
  "Individual health assessments (online or in-person)": "core",
  "Innovation pilots": "advanced",
  "Insurance advocacy/appeals support": "enhanced",
  "Insurance advocacy/pre-authorization support": "core",
  "Intermittent leave beyond local / legal requirements": "enhanced",
  "Job protection beyond local / legal requirements": "core",
  "Leave donation bank (employees can donate PTO to colleagues)": "enhanced",
  "Legal compliance training": "core",
  "Legal protections beyond requirements": "enhanced",
  "Legal/financial planning assistance for caregivers": "enhanced",
  "Lifestyle coaching programs": "enhanced",
  "Long-term disability covering 60%+ of salary": "core",
  "Long-term success tracking": "advanced",
  "Manager evaluations include how well they support impacted employees": "advanced",
  "Manager peer support / community building": "enhanced",
  "Manager toolkit for cascade communications": "enhanced",
  "Manager training for supervising caregivers": "advanced",
  "Manager training on handling sensitive health information": "enhanced",
  "Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams": "enhanced",
  "Manager training on supporting team members during treatment/return": "enhanced",
  "Mental health support specifically for caregivers": "core",
  "Modified job duties during peak caregiving periods": "enhanced",
  "Multi-channel communication strategy": "core",
  "New hire orientation coverage": "enhanced",
  "Nutrition coaching": "enhanced",
  "Occupational therapy/vocational rehabilitation": "enhanced",
  "On-site vaccinations": "core",
  "Online peer support forums": "enhanced",
  "Online tools, apps, or portals for health/benefits support": "core",
  "Optional open health dialogue forums": "advanced",
  "Optional stay-connected program": "advanced",
  "PTO accrual during leave": "enhanced",
  "Paid caregiver leave with expanded eligibility (beyond local legal requirements)": "enhanced",
  "Paid medical leave beyond local / legal requirements": "core",
  "Paid micro-breaks for medical-related side effects": "advanced",
  "Paid time off for care coordination appointments": "core",
  "Paid time off for clinical trial participation": "enhanced",
  "Paid time off for preventive care appointments": "core",
  "Phased return-to-work plans": "core",
  "Physical rehabilitation support": "enhanced",
  "Physical workspace modifications": "core",
  "Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)": "enhanced",
  "Policy accommodations (e.g., dress code flexibility, headphone use)": "core",
  "Practical support for managing caregiving and work": "enhanced",
  "Priority parking": "core",
  "Privacy protection and confidentiality management": "core",
  "Proactive communication at point of diagnosis disclosure": "enhanced",
  "Professional coach/mentor for employees managing cancer or other serious health conditions": "enhanced",
  "Professional-led support groups (external facilitator/counselor)": "enhanced",
  "Program utilization analytics": "enhanced",
  "Project continuity protocols": "advanced",
  "Public success story celebrations": "advanced",
  "Real-time cost estimator tools": "enhanced",
  "Reduced schedule/part-time with full benefits": "enhanced",
  "Regular company-wide awareness campaigns (at least quarterly)": "enhanced",
  "Regular health education sessions": "enhanced",
  "Regular program enhancements": "enhanced",
  "Remote work capability": "core",
  "Remote work options for on-site employees": "core",
  "Respite care funding/reimbursement": "advanced",
  "Rest areas / quiet spaces": "core",
  "Return-to-work success metrics": "advanced",
  "Risk factor tracking/reporting": "enhanced",
  "Senior leader coaching on supporting impacted employees": "enhanced",
  "Set out-of-pocket maximums (for in-network single coverage)": "enhanced",
  "Short-term disability covering 60%+ of salary": "core",
  "Specialized emotional counseling": "enhanced",
  "Stigma-reduction initiatives": "enhanced",
  "Strong anti-discrimination policies specific to health conditions": "core",
  "Structured progress reviews": "enhanced",
  "Structured reintegration programs": "enhanced",
  "Succession planning protections": "enhanced",
  "Support metrics included in annual report/sustainability reporting": "enhanced",
  "Support programs included in investor/stakeholder communications": "enhanced",
  "Survivorship planning assistance": "advanced",
  "Targeted risk-reduction programs": "advanced",
  "Tax/estate planning assistance": "enhanced",
  "Temporary role redesigns": "enhanced",
  "Transportation reimbursement": "advanced",
  "Travel/lodging reimbursement for specialized care beyond insurance coverage": "advanced",
  "Unpaid leave job protection beyond local / legal requirements": "enhanced",
  "Voluntary supplemental illness insurance (with employer contribution)": "enhanced",
  "Workload adjustments during treatment": "core",
  "Workplace safety assessments to minimize health risks": "core",
  "Written anti-retaliation policies for health disclosures": "core",
  "Year-over-year budget growth": "enhanced",
};

// Per-tier population means (μ) for unsure substitution — from confirmed responses
// Values on 0-5 scale. credit = μ × confirm_rate² (capped at 10% of dim max)
export const TIER_MEANS: Record<number, Record<string, number>> = {
  1: { core: 3.92, enhanced: 2.85, advanced: 2.27 },
  2: { core: 3.95, enhanced: 2.89, advanced: 1.99 },
  3: { core: 4.05, enhanced: 3.12, advanced: 2.13 },
  4: { core: 4.19, enhanced: 3.12, advanced: 1.96 },
  5: { core: 4.21, enhanced: 3.27, advanced: 2.36 },
  6: { core: 4.11, enhanced: 3.37, advanced: 2.47 },
  7: { core: 3.72, enhanced: 2.85, advanced: 2.13 },
  8: { core: 3.98, enhanced: 2.95, advanced: 2.19 },
  9: { core: 0.00, enhanced: 2.96, advanced: 1.91 },
  10: { core: 3.77, enhanced: 2.71, advanced: 1.67 },
  11: { core: 3.85, enhanced: 3.15, advanced: 2.49 },
  12: { core: 3.74, enhanced: 3.16, advanced: 2.59 },
  13: { core: 3.75, enhanced: 3.44, advanced: 0.00 },
};

// Element within-dimension weights for WSI — v6.1 (ridge + permutation importance + adaptive shrinkage)
// Key = element name, value = [dimension_number, within_dim_weight]
// Within each dimension, weights sum to 1.0
export const ELEMENT_DIM_WEIGHTS: Record<string, [number, number]> = {
  "Emergency leave within 24 hours": [1, 0.143114],
  "Remote work options for on-site employees": [1, 0.128729],
  "Intermittent leave beyond local / legal requirements": [1, 0.113574],
  "Paid micro-breaks for side effects": [1, 0.081779],
  "Flexible work hours during treatment (e.g., varying start/end times, compressed schedules)": [1, 0.075997],
  "Job protection beyond local / legal requirements": [1, 0.062303],
  "Paid medical leave beyond local / legal requirements": [1, 0.058979],
  "Reduced schedule/part-time with full benefits": [1, 0.057912],
  "Paid micro-breaks for medical-related side effects": [1, 0.056012],
  "PTO accrual during leave": [1, 0.055810],
  "Full salary (100%) continuation during cancer-related short-term disability leave": [1, 0.055342],
  "Disability pay top-up (employer adds to disability insurance)": [1, 0.055325],
  "Leave donation bank (employees can donate PTO to colleagues)": [1, 0.055124],
  "Accelerated life insurance benefits (partial payout for terminal / critical illness)": [2, 0.172389],
  "Tax/estate planning assistance": [2, 0.134633],
  "Real-time cost estimator tools": [2, 0.074168],
  "Insurance advocacy/pre-authorization support": [2, 0.071963],
  "$0 copay for specialty drugs": [2, 0.055324],
  "Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance": [2, 0.046307],
  "Financial counseling services": [2, 0.044892],
  "Long-term disability covering 60%+ of salary": [2, 0.044791],
  "Paid time off for clinical trial participation": [2, 0.043340],
  "Coverage for clinical trials and experimental treatments not covered by standard health insurance": [2, 0.042387],
  "Short-term disability covering 60%+ of salary": [2, 0.042358],
  "Hardship grants program funded by employer": [2, 0.039505],
  "Guaranteed job protection": [2, 0.038521],
  "Employer-paid disability insurance supplements": [2, 0.037982],
  "Voluntary supplemental illness insurance (with employer contribution)": [2, 0.037766],
  "Set out-of-pocket maximums (for in-network single coverage)": [2, 0.036936],
  "Travel/lodging reimbursement for specialized care beyond insurance coverage": [2, 0.036738],
  "Manager peer support / community building": [3, 0.200023],
  "Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams": [3, 0.195794],
  "Empathy/communication skills training": [3, 0.163854],
  "Dedicated manager resource hub": [3, 0.080184],
  "Clear escalation protocol for manager response": [3, 0.070664],
  "Manager evaluations include how well they support impacted employees": [3, 0.063243],
  "Privacy protection and confidentiality management": [3, 0.058364],
  "AI-powered guidance tools": [3, 0.057976],
  "Legal compliance training": [3, 0.055458],
  "Senior leader coaching on supporting impacted employees": [3, 0.054440],
  "Physical rehabilitation support": [4, 0.200125],
  "Nutrition coaching": [4, 0.131656],
  "Insurance advocacy/appeals support": [4, 0.102413],
  "Dedicated navigation support to help employees understand benefits and access medical care": [4, 0.086665],
  "Online tools, apps, or portals for health/benefits support": [4, 0.081798],
  "Occupational therapy/vocational rehabilitation": [4, 0.080645],
  "Care coordination concierge": [4, 0.080454],
  "Survivorship planning assistance": [4, 0.080114],
  "Benefits optimization assistance (maximizing coverage, minimizing costs)": [4, 0.078971],
  "Clinical trial matching service": [4, 0.077159],
  "Flexible scheduling options": [5, 0.200035],
  "Ergonomic equipment funding": [5, 0.139896],
  "Temporary role redesigns": [5, 0.112509],
  "Rest areas / quiet spaces": [5, 0.112477],
  "Assistive technology catalog": [5, 0.089373],
  "Cognitive / fatigue support tools": [5, 0.067977],
  "Priority parking": [5, 0.065539],
  "Policy accommodations (e.g., dress code flexibility, headphone use)": [5, 0.057740],
  "Remote work capability": [5, 0.053923],
  "Physical workspace modifications": [5, 0.052283],
  "Transportation reimbursement": [5, 0.048248],
  "Employee peer support groups (internal employees with shared experience)": [6, 0.200031],
  "Stigma-reduction initiatives": [6, 0.162809],
  "Anonymous benefits navigation tool or website (no login required)": [6, 0.103945],
  "Specialized emotional counseling": [6, 0.074586],
  "Manager training on handling sensitive health information": [6, 0.066401],
  "Strong anti-discrimination policies specific to health conditions": [6, 0.063477],
  "Inclusive communication guidelines": [6, 0.062323],
  "Professional-led support groups (external facilitator/counselor)": [6, 0.059115],
  "Written anti-retaliation policies for health disclosures": [6, 0.056448],
  "Confidential HR channel for health benefits, policies and insurance-related questions": [6, 0.050846],
  "Clear process for confidential health disclosures": [6, 0.050421],
  "Optional open health dialogue forums": [6, 0.049599],
  "Continued access to training/development": [7, 0.179655],
  "Adjusted performance goals/deliverables during treatment and recovery": [7, 0.100582],
  "Succession planning protections": [7, 0.097295],
  "Optional stay-connected program": [7, 0.096012],
  "Structured reintegration programs": [7, 0.093588],
  "Career coaching for employees managing cancer or other serious health conditions": [7, 0.082887],
  "Professional coach/mentor for employees managing cancer or other serious health conditions": [7, 0.076365],
  "Project continuity protocols": [7, 0.073542],
  "Flexibility for medical setbacks": [8, 0.192209],
  "Long-term success tracking": [8, 0.142762],
  "Manager training on supporting team members during treatment/return": [8, 0.137150],
  "Workload adjustments during treatment": [8, 0.091974],
  "Buddy/mentor pairing for support": [8, 0.058763],
  "Structured progress reviews": [8, 0.057281],
  "Flexible work arrangements during treatment": [8, 0.054804],
  "Online peer support forums": [8, 0.053836],
  "Phased return-to-work plans": [8, 0.044535],
  "Contingency planning for treatment schedules": [8, 0.044362],
  "Access to specialized work resumption professionals": [8, 0.042611],
  "Executive sponsors communicate regularly about workplace support programs": [9, 0.200065],
  "ESG/CSR reporting inclusion": [9, 0.143032],
  "Public success story celebrations": [9, 0.132297],
  "Year-over-year budget growth": [9, 0.087296],
  "Executive-led town halls focused on health benefits and employee support": [9, 0.076675],
  "Support programs included in investor/stakeholder communications": [9, 0.061193],
  "Compensation tied to support outcomes": [9, 0.054609],
  "Executive accountability metrics": [9, 0.050253],
  "C-suite executive serves as program champion/sponsor": [9, 0.049465],
  "Cross-functional executive steering committee for workplace support programs": [9, 0.048861],
  "Support metrics included in annual report/sustainability reporting": [9, 0.048602],
  "Dedicated budget allocation for serious illness support programs": [9, 0.047651],
  "Practical support for managing caregiving and work": [10, 0.125861],
  "Eldercare consultation and referral services": [10, 0.098757],
  "Family navigation support": [10, 0.074286],
  "Caregiver concierge/navigator services (e.g., coordinating logistics, scheduling, transportation, home care)": [10, 0.091506],
  "Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)": [10, 0.046535],
  "Paid caregiver leave with expanded eligibility (beyond local legal requirements)": [10, 0.046529],
  "Unpaid leave job protection beyond local / legal requirements": [10, 0.043064],
  "Flexible work arrangements for caregivers": [10, 0.041600],
  "Emergency dependent care when regular arrangements unavailable": [10, 0.041356],
  "Respite care funding/reimbursement": [10, 0.041004],
  "Paid time off for care coordination appointments": [10, 0.040964],
  "Legal/financial planning assistance for caregivers": [10, 0.040789],
  "Manager training for supervising caregivers": [10, 0.039568],
  "Caregiver peer support groups": [10, 0.039551],
  "Dependent care subsidies": [10, 0.038963],
  "Mental health support specifically for caregivers": [10, 0.038949],
  "Modified job duties during peak caregiving periods": [10, 0.037552],
  "Emergency caregiver funds": [10, 0.036692],
  "Dependent care account matching/contributions": [10, 0.036474],
  "Legal protections beyond requirements": [11, 0.165547],
  "Individual health assessments (online or in-person)": [11, 0.145301],
  "Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)": [11, 0.125210],
  "Genetic screening/counseling": [11, 0.117179],
  "Full or partial coverage for annual health screenings/checkups": [11, 0.059233],
  "Regular health education sessions": [11, 0.054959],
  "Paid time off for preventive care appointments": [11, 0.054171],
  "At least 70% coverage for regionally / locally recommended screenings": [11, 0.053351],
  "On-site vaccinations": [11, 0.049866],
  "Workplace safety assessments to minimize health risks": [11, 0.045736],
  "Targeted risk-reduction programs": [11, 0.045514],
  "Risk factor tracking/reporting": [11, 0.044358],
  "Lifestyle coaching programs": [11, 0.039574],
  "Regular program enhancements": [12, 0.200028],
  "Employee confidence in employer support": [12, 0.152164],
  "Innovation pilots": [12, 0.141923],
  "External benchmarking": [12, 0.128859],
  "Program utilization analytics": [12, 0.098957],
  "Return-to-work success metrics": [12, 0.079713],
  "Employee satisfaction tracking": [12, 0.068297],
  "Business impact/ROI assessment": [12, 0.065119],
  "Measure screening campaign ROI (e.g. participation rates, inquiries about access, etc.)": [12, 0.064940],
  "Family/caregiver communication inclusion": [13, 0.200081],
  "Employee testimonials/success stories": [13, 0.136827],
  "Proactive communication at point of diagnosis disclosure": [13, 0.131536],
  "Multi-channel communication strategy": [13, 0.098369],
  "Anonymous information access options": [13, 0.098095],
  "Ability to access program information and resources anonymously": [13, 0.094749],
  "Dedicated program website or portal": [13, 0.053243],
  "Regular company-wide awareness campaigns (at least quarterly)": [13, 0.047333],
  "New hire orientation coverage": [13, 0.047072],
  "Manager toolkit for cascade communications": [13, 0.046482],
  "Cancer awareness month campaigns with resources": [13, 0.046213],
};

export function getElementLevel(elementName: string): string {
  return ELEMENT_MATURITY_LEVEL[elementName] || 'enhanced';
}

// Parse element status (string or numeric) to 0-5 point value
function parseStatus(status: any): { points: number; isUnsure: boolean } {
  if (typeof status === 'number') {
    switch (status) {
      case 4: return { points: 5, isUnsure: false };
      case 3: return { points: 3, isUnsure: false };
      case 2: return { points: 2, isUnsure: false };
      case 1: return { points: 0, isUnsure: false };
      case 5: return { points: 0, isUnsure: true };
      default: return { points: 0, isUnsure: false };
    }
  }
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s.includes('not able')) return { points: 0, isUnsure: false };
    if (s === 'unsure' || s.includes('unsure') || s.includes('unknown')) return { points: 0, isUnsure: true };
    if (s.includes('currently') || s.includes('offer') || s.includes('provide') || s.includes('use') || s.includes('track') || s.includes('measure')) {
      return { points: 5, isUnsure: false };
    }
    if (s.includes('planning') || s.includes('development')) return { points: 3, isUnsure: false };
    if (s.includes('assessing') || s.includes('feasibility')) return { points: 2, isUnsure: false };
    if (s.length > 0) return { points: 0, isUnsure: false };
  }
  return { points: 0, isUnsure: false };
}

/**
 * Calculate element-weighted dimension score with unsure substitution.
 * This is the canonical WSI scoring methodology — both the report page
 * and the aggregate scoring page must use this function to stay in sync.
 *
 * Steps:
 *  1. Parse each grid entry to determine points (0-5) or unsure flag
 *  2. Compute per-dimension confirm rate (confirmed / total)
 *  3. For confirmed elements: earned = points x element_weight
 *  4. For unsure elements: earned = tier_mean x confirm_rate^2 x element_weight
 *  5. Score = (total_earned / total_max) x 100, rounded
 */
export function calculateElementWeightedDimScore(
  dimNum: number,
  gridData: Record<string, any>,
  excludedItems?: string[]
): { score: number; confirmRate: number; unsureCount: number; totalItems: number } {
  // First pass: parse statuses and count confirm rate
  let totalItems = 0;
  let unsureCount = 0;
  const entries: { name: string; points: number; isUnsure: boolean }[] = [];

  Object.entries(gridData).forEach(([name, status]) => {
    if (excludedItems?.includes(name)) return;
    totalItems++;
    const parsed = parseStatus(status);
    if (parsed.isUnsure) unsureCount++;
    entries.push({ name, ...parsed });
  });

  if (totalItems === 0) return { score: 0, confirmRate: 1, unsureCount: 0, totalItems: 0 };

  const confirmRate = (totalItems - unsureCount) / totalItems;

  // Second pass: element-weighted scoring with unsure substitution
  let wEarned = 0, wMax = 0;
  entries.forEach(e => {
    const ew = ELEMENT_DIM_WEIGHTS[e.name];
    const elemWt = ew ? ew[1] : (1 / totalItems);
    if (e.isUnsure) {
      const level = getElementLevel(e.name);
      const mu = TIER_MEANS[dimNum]?.[level] || 0;
      wEarned += (mu * confirmRate * confirmRate) * elemWt;
      wMax += 5 * elemWt;
    } else {
      wEarned += e.points * elemWt;
      wMax += 5 * elemWt;
    }
  });

  return {
    score: wMax > 0 ? Math.round((wEarned / wMax) * 100) : 0,
    confirmRate,
    unsureCount,
    totalItems,
  };
}

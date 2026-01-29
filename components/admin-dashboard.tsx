'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { isFoundingPartner } from '@/lib/founding-partners'
import DetailedResponseView from './detailed-response-view'
import { generateInvoicePDF, downloadInvoicePDF, type InvoiceData } from '@/lib/invoice-generator'

interface Assessment {
  id: string
  user_id: string
  email: string
  survey_id: string
  app_id?: string  // Panel records use app_id = 'PANEL-XXX'
  company_name: string | null
  created_at: string
  updated_at: string
  payment_completed: boolean
  payment_method: string | null
  payment_date?: string
  payment_amount?: number
  auth_completed: boolean
  letter_viewed: boolean
  firmographics_data: any
  general_benefits_data: any
  current_support_data: any
  dimension1_data: any
  dimension2_data: any
  dimension3_data: any
  dimension4_data: any
  dimension5_data: any
  dimension6_data: any
  dimension7_data: any
  dimension8_data: any
  dimension9_data: any
  dimension10_data: any
  dimension11_data: any
  dimension12_data: any
  dimension13_data: any
  cross_dimensional_data: any
  employee_impact_data: any
  employee_survey_opt_in: boolean | null
  firmographics_complete: boolean
  general_benefits_complete: boolean
  current_support_complete: boolean
  dimension1_complete: boolean
  dimension2_complete: boolean
  dimension3_complete: boolean
  dimension4_complete: boolean
  dimension5_complete: boolean
  dimension6_complete: boolean
  dimension7_complete: boolean
  dimension8_complete: boolean
  dimension9_complete: boolean
  dimension10_complete: boolean
  dimension11_complete: boolean
  dimension12_complete: boolean
  dimension13_complete: boolean
  cross_dimensional_complete: boolean
  employee_impact_complete: boolean
}

interface ProcessedAssessment extends Assessment {
  isFoundingPartner: boolean
  isPanel: boolean
  status: string
  completionPercentage: number
  sectionsCompleted: number
  totalSections: number
  daysInProgress: number
}

// ============================================
// DIMENSION CONFIGURATION - ALL 13 DIMENSIONS WITH FULL ITEM TEXT
// ============================================
const DIMENSION_CONFIG = {
  d1: {
    name: 'Medical Leave & Flexibility',
    dataKey: 'dimension1_data',
    gridField: 'd1a',
    items: [
      'Paid medical leave beyond local / legal requirements',
      'Intermittent leave beyond local / legal requirements',
      'Flexible work hours during treatment (e.g., varying start/end times, compressed schedules)',
      'Remote work options for on-site employees',
      'Reduced schedule/part-time with full benefits',
      'Job protection beyond local / legal requirements',
      'Emergency leave within 24 hours',
      'Leave donation bank (employees can donate PTO to colleagues)',
      'Disability pay top-up (employer adds to disability insurance)',
      'PTO accrual during leave',
      'Paid micro-breaks for side effects'
    ]
  },
  d2: {
    name: 'Insurance & Financial Protection',
    dataKey: 'dimension2_data',
    gridField: 'd2a',
    items: [
      'Coverage for clinical trials and experimental treatments not covered by standard health insurance',
      'Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance',
      'Paid time off for clinical trial participation',
      'Set out-of-pocket maximums (for in-network single coverage)',
      'Travel/lodging reimbursement for specialized care beyond insurance coverage',
      'Financial counseling services',
      'Voluntary supplemental illness insurance (with employer contribution)',
      'Real-time cost estimator tools',
      'Insurance advocacy/pre-authorization support',
      '$0 copay for specialty drugs',
      'Hardship grants program funded by employer',
      'Tax/estate planning assistance',
      'Short-term disability covering 60%+ of salary',
      'Long-term disability covering 60%+ of salary',
      'Employer-paid disability insurance supplements',
      'Guaranteed job protection',
      'Accelerated life insurance benefits (partial payout for terminal / critical illness)'
    ]
  },
  d3: {
    name: 'Manager Preparedness & Capability',
    dataKey: 'dimension3_data',
    gridField: 'd3a',
    items: [
      'Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams',
      'Clear escalation protocol for manager response',
      'Dedicated manager resource hub',
      'Empathy/communication skills training',
      'Legal compliance training',
      'Senior leader coaching on supporting impacted employees',
      'Manager evaluations include how well they support impacted employees',
      'Manager peer support / community building',
      'AI-powered guidance tools',
      'Privacy protection and confidentiality management'
    ]
  },
  d4: {
    name: 'Navigation & Expert Resources',
    dataKey: 'dimension4_data',
    gridField: 'd4a',
    items: [
      'Dedicated navigation support to help employees understand benefits and access medical care',
      'Benefits optimization assistance (maximizing coverage, minimizing costs)',
      'Insurance advocacy/appeals support',
      'Clinical trial matching service',
      'Care coordination concierge',
      'Online tools, apps, or portals for health/benefits support',
      'Survivorship planning assistance',
      'Nutrition coaching',
      'Physical rehabilitation support',
      'Occupational therapy/vocational rehabilitation'
    ]
  },
  d5: {
    name: 'Workplace Accommodations & Modifications',
    dataKey: 'dimension5_data',
    gridField: 'd5a',
    items: [
      'Physical workspace modifications',
      'Cognitive / fatigue support tools',
      'Ergonomic equipment funding',
      'Flexible scheduling options',
      'Remote work capability',
      'Rest areas / quiet spaces',
      'Priority parking',
      'Temporary role redesigns',
      'Assistive technology catalog',
      'Transportation reimbursement',
      'Policy accommodations (e.g., dress code flexibility, headphone use)'
    ]
  },
  d6: {
    name: 'Culture & Psychological Safety',
    dataKey: 'dimension6_data',
    gridField: 'd6a',
    items: [
      'Strong anti-discrimination policies specific to health conditions',
      'Clear process for confidential health disclosures',
      'Manager training on handling sensitive health information',
      'Written anti-retaliation policies for health disclosures',
      'Employee peer support groups (internal employees with shared experience)',
      'Professional-led support groups (external facilitator/counselor)',
      'Stigma-reduction initiatives',
      'Specialized emotional counseling',
      'Optional open health dialogue forums',
      'Inclusive communication guidelines',
      'Confidential HR channel for health benefits, policies and insurance-related questions',
      'Anonymous benefits navigation tool or website (no login required)'
    ]
  },
  d7: {
    name: 'Career Continuity & Advancement',
    dataKey: 'dimension7_data',
    gridField: 'd7a',
    items: [
      'Continued access to training/development',
      'Structured reintegration programs',
      'Peer mentorship program (employees who had similar condition mentoring current employees)',
      'Professional coach/mentor for employees managing cancer or other serious health conditions',
      'Adjusted performance goals/deliverables during treatment and recovery',
      'Career coaching for employees managing cancer or other serious health conditions',
      'Succession planning protections',
      'Project continuity protocols',
      'Optional stay-connected program'
    ]
  },
  d8: {
    name: 'Work Continuation & Resumption',
    dataKey: 'dimension8_data',
    gridField: 'd8a',
    items: [
      'Flexible work arrangements during treatment',
      'Phased return-to-work plans',
      'Workload adjustments during treatment',
      'Flexibility for medical setbacks',
      'Buddy/mentor pairing for support',
      'Structured progress reviews',
      'Contingency planning for treatment schedules',
      'Long-term success tracking',
      'Access to occupational therapy/vocational rehabilitation',
      'Online peer support forums',
      'Access to specialized work resumption professionals',
      'Manager training on supporting team members during treatment/return'
    ]
  },
  d9: {
    name: 'Executive Commitment & Resources',
    dataKey: 'dimension9_data',
    gridField: 'd9a',
    items: [
      'Executive accountability metrics',
      'Public success story celebrations',
      'Compensation tied to support outcomes',
      'ESG/CSR reporting inclusion',
      'Year-over-year budget growth',
      'Executive sponsors communicate regularly about workplace support programs',
      'Dedicated budget allocation for serious illness support programs',
      'C-suite executive serves as program champion/sponsor',
      'Support programs included in investor/stakeholder communications',
      'Cross-functional executive steering committee for workplace support programs',
      'Support metrics included in annual report/sustainability reporting'
    ]
  },
  d10: {
    name: 'Caregiver & Family Support',
    dataKey: 'dimension10_data',
    gridField: 'd10a',
    items: [
      'Paid caregiver leave with expanded eligibility (beyond local legal requirements)',
      'Flexible work arrangements for caregivers',
      'Dependent care subsidies',
      'Emergency caregiver funds',
      'Dependent care account matching/contributions',
      'Family navigation support',
      'Caregiver peer support groups',
      'Mental health support specifically for caregivers',
      'Manager training for supervising caregivers',
      'Practical support for managing caregiving and work',
      'Emergency dependent care when regular arrangements unavailable',
      'Respite care funding/reimbursement',
      'Caregiver resource navigator/concierge',
      'Legal/financial planning assistance for caregivers',
      'Modified job duties during peak caregiving periods',
      'Unpaid leave job protection beyond local / legal requirements',
      'Eldercare consultation and referral services',
      'Paid time off for care coordination appointments',
      'Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)'
    ]
  },
  d11: {
    name: 'Prevention, Wellness & Legal Compliance',
    dataKey: 'dimension11_data',
    gridField: 'd11a',
    items: [
      'At least 70% coverage for regionally / locally recommended screenings',
      'Full or partial coverage for annual health screenings/checkups',
      'Targeted risk-reduction programs',
      'Paid time off for preventive care appointments',
      'Legal protections beyond requirements',
      'Workplace safety assessments to minimize health risks',
      'Regular health education sessions',
      'Individual health assessments (online or in-person)',
      'Genetic screening/counseling',
      'On-site vaccinations',
      'Lifestyle coaching programs',
      'Risk factor tracking/reporting',
      'Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)'
    ]
  },
  d12: {
    name: 'Continuous Improvement & Outcomes',
    dataKey: 'dimension12_data',
    gridField: 'd12a',
    items: [
      'Return-to-work success metrics',
      'Employee satisfaction tracking',
      'Business impact/ROI assessment',
      'Regular program enhancements',
      'External benchmarking',
      'Innovation pilots',
      'Employee confidence in employer support',
      'Program utilization analytics'
    ]
  },
  d13: {
    name: 'Communication & Awareness',
    dataKey: 'dimension13_data',
    gridField: 'd13a',
    items: [
      'Proactive communication at point of diagnosis disclosure',
      'Dedicated program website or portal',
      'Regular company-wide awareness campaigns (at least quarterly)',
      'New hire orientation coverage',
      'Manager toolkit for cascade communications',
      'Employee testimonials/success stories',
      'Multi-channel communication strategy',
      'Family/caregiver communication inclusion',
      'Ability to access program information and resources anonymously',
      'Cancer awareness month campaigns with resources *'
    ],
    footnote: '* Added after original Founding Partner survey - FP responses will show as "No Response"'
  }
}

// ============================================
// GENERAL BENEFITS CB1 OPTIONS - FULL TEXT
// ============================================
const CB1_OPTIONS = {
  standardBenefits: [
    'Health insurance (Employer-provided or supplemental to national coverage)',
    'Dental insurance (Employer-provided or supplemental to national coverage)',
    'Vision insurance (Employer-provided or supplemental to national coverage)',
    'Life insurance',
    'Short-term disability (or temporary incapacity benefits)',
    'Long-term disability (or income protection)',
    'Paid time off (PTO/vacation)',
    'Sick days (separate from PTO and legally mandated sick leave)'
  ],
  leaveFlexibility: [
    'Paid family/medical leave beyond legal requirements',
    'Flexible work schedules',
    'Remote work options',
    'Job sharing programs',
    'Phased retirement',
    'Sabbatical programs',
    'Dedicated caregiver leave (separate from family leave)'
  ],
  wellnessSupport: [
    'Employee assistance program (EAP)',
    'Physical wellness programs (fitness, nutrition, ergonomics)',
    'Mental wellness programs (stress management, mindfulness, resilience)',
    'On-site health services',
    'Mental health resources (therapy, counseling)',
    'Caregiving support resources',
    'Tailored support programs for employees managing cancer or other serious health conditions'
  ],
  financialLegal: [
    'Financial counseling/planning',
    'Student loan assistance',
    'Identity theft protection',
    'Legal assistance/services (will preparation, family law, medical directives)'
  ],
  careNavigation: [
    'Care coordination for complex conditions',
    'Second opinion services or facilitation',
    'Specialized treatment center networks',
    'Travel support for specialized care',
    'Clinical guidance and navigation',
    'Medication access and affordability programs'
  ]
}

// ============================================
// CURRENT SUPPORT OPTIONS - FULL TEXT
// ============================================
const CURRENT_SUPPORT_OPTIONS = {
  cb3a: [
    'Yes, we offer additional support beyond legal requirements',
    'Currently developing enhanced support offerings',
    'Not yet, but actively exploring options',
    'At this time, we primarily focus on meeting legal compliance requirements'
  ],
  cb3b: [
    'Individual benefits or policies (e.g., extended leave, flexible work options)',
    'Coordinated support services - single point of contact for multiple resources (e.g., nurse navigation, case management)',
    'Internally developed formal program with a specific name (e.g., "We Care at Work")',
    'Participation in external initiatives, certifications, or pledges (e.g., Working with Cancer pledge, CEO Cancer Gold Standard)',
    'Comprehensive framework that integrates multiple support elements',
    'Ad hoc/case-by-case support as needs arise',
    'Other (specify)'
  ],
  cb3c: [
    'Autoimmune disorders (e.g., MS, lupus, rheumatoid arthritis)',
    'Cancer (any form)',
    'Chronic conditions (e.g., MS, ALS, Parkinson\'s, Crohn\'s, lupus, rheumatoid arthritis)',
    'Heart disease (including heart attack, heart failure)',
    'HIV / AIDS',
    'Kidney disease (including dialysis, kidney failure)',
    'Major surgery recovery (planned or emergency)',
    'Mental health crises (requiring extended leave)',
    'Musculoskeletal conditions (chronic or acute)',
    'Neurological conditions (e.g., epilepsy, brain injury)',
    'Organ transplant (pre and post)',
    'Respiratory conditions (e.g., COPD, cystic fibrosis)',
    'Stroke',
    'Some other condition meeting severity/duration criteria (specify)'
  ],
  cb3d: [
    'Internally by HR team',
    'With assistance from benefits broker',
    'With specialized consultant support',
    'Adopted from parent/acquiring company',
    'Benchmarked from peer companies',
    'Employee/union driven',
    'Some other way (specify)'
  ],
  or1: [
    'No formal approach: Handle case-by-case',
    'Developing approach: Currently building programs and policies',
    'Legal minimum only: Meet legal requirements only (FMLA, ADA)',
    'Moderate support: Some programs beyond legal requirements',
    'Enhanced support: Meaningful programs beyond legal minimums',
    'Comprehensive support: Extensive programs well beyond legal requirements',
    'Leading-edge support: Extensive, innovative programs'
  ],
  or2a: [
    'Employee(s) diagnosed with cancer or other serious health conditions highlighted gaps',
    'Leadership personal experience with cancer',
    'Keep up with industry standards and peer company practices',
    'Employee survey feedback',
    'Recruitment/retention goals or challenges',
    'Legal case or compliance issue',
    'Union negotiations',
    'ESG/corporate responsibility commitments',
    'Inspired by Working with Cancer Initiative or similar programs',
    'Health trend data',
    'Our company mission',
    'Our purpose',
    'Supporting Cancer and other serious health conditions is a business priority.',
    'Other (specify)'
  ],
  or3: [
    'Budget/resource constraints',
    'Lack of executive support',
    'Small number of cases doesn\'t justify investment',
    'Small employee population',
    'Concerns about setting precedent',
    'Limited HR and/or Benefits team bandwidth',
    'Lack of expertise/knowledge',
    'Other priorities take precedence',
    'Concerns about fairness across conditions',
    'Uncertainty about ROI',
    'Data privacy concerns (HIPAA, GDPR, other regulations)',
    'Complex/varying legal requirements across markets',
    'Global consistency challenges',
    'Some other reason (specify)'
  ],
  or5a: [
    'Flexible work schedules',
    'Flexible work arrangements',
    'Remote work options',
    'Paid caregiver leave',
    'Caregiver leave (paid)',
    'Unpaid leave with job protection',
    'Caregiver leave (unpaid)',
    'Employee assistance program (EAP) counseling',
    'Caregiver support groups',
    'Referrals to eldercare/dependent care resources',
    'Financial assistance or subsidies',
    'Respite care coverage',
    'Modified job duties/reduced workload',
    'Manager training on supporting caregivers',
    'Emergency dependent care when regular arrangements unavailable',
    'Legal/financial planning resources',
    'Concierge caregiving support through Wellthy',
    'Concierge caregiving support through a 3rd party provider (e.g., Wellthy, Cleo, Bright Horizons, Maven, etc.)',
    'Some other support (specify)',
    'Not able to provide caregiver support at this time'
  ],
  or6: [
    'Aggregate metrics and analytics only',
    'De-identified case tracking',
    'General program utilization data',
    'Voluntary employee feedback/surveys',
    'Some other approach (specify)',
    'No systematic monitoring'
  ]
}

// ============================================
// CROSS-DIMENSIONAL OPTIONS - FULL TEXT
// ============================================
const CROSS_DIMENSIONAL_OPTIONS = {
  dimensions: [
    'Medical Leave & Flexibility',
    'Insurance & Financial Protection',
    'Manager Preparedness & Capability',
    'Navigation & Expert Resources',
    'Workplace Accommodations',
    'Culture & Psychological Safety',
    'Career Continuity & Advancement',
    'Return-to-Work Excellence',
    'Executive Commitment & Resources',
    'Caregiver & Family Support',
    'Prevention, Wellness & Legal Compliance',
    'Continuous Improvement & Outcomes',
    'Communication & Awareness'
  ],
  cd2Challenges: [
    'Budget/resource constraints',
    'Lack of executive support',
    'Complex/varying legal requirements across markets',
    'Manager capability/training gaps',
    'Employee privacy concerns',
    'Difficulty measuring program effectiveness',
    'Low employee awareness of available programs',
    'Administrative complexity',
    'Inconsistent application across the organization',
    'Cultural stigma around medical conditions',
    'Integration with existing HR systems',
    'Competing organizational priorities',
    'Limited expertise in workplace support programs',
    'Global consistency challenges',
    'Other (please specify)'
  ]
}

// ============================================
// EMPLOYEE IMPACT OPTIONS - FULL TEXT
// ============================================
const EMPLOYEE_IMPACT_OPTIONS = {
  ei1Areas: [
    'Employee retention/tenure',
    'Employee morale',
    'Job satisfaction scores',
    'Productivity during treatment',
    'Time to return to work',
    'Recruitment success',
    'Team cohesion',
    'Trust in leadership',
    'Willingness to disclose health issues',
    'Overall engagement scores'
  ],
  ei1Responses: [
    'No positive impact',
    'Minimal positive impact',
    'Moderate positive impact',
    'Significant positive impact',
    'Unable to assess'
  ],
  ei2: [
    'Yes, comprehensive ROI analysis completed',
    'Yes, basic ROI analysis completed',
    'Currently conducting ROI analysis',
    'Planning to measure ROI',
    'No plans to measure ROI'
  ],
  ei3: [
    'Negative ROI (costs exceed benefits by more than 100%)',
    'Break-even (costs and benefits are roughly equal)',
    '1.1 - 2.0x ROI (benefits are 10-100% more than costs)',
    '2.1 - 3.0x ROI (benefits are 2-3 times the costs)',
    '3.1 - 5.0x ROI (benefits are 3-5 times the costs)',
    'Greater than 5.0x ROI (benefits exceed 5 times the costs)'
  ]
}

// ============================================
// FIRMOGRAPHICS OPTIONS - EXACT VALUES FROM DATABASE
// ============================================
const FIRMOGRAPHICS_OPTIONS = {
  s5Level: [
    'C-level executive (CHRO, CPO)',
    'Executive/Senior Vice President',
    'Vice President',
    'Director',
    'Senior Manager',
    'Manager',
    'HR Generalist',
    'Benefits Specialist / Coordinator',
    'HR Specialist / Coordinator',
    'HR Assistant / Administrative',
    'Other'
  ],
  s4bFunction: [
    'Human Resources',
    'Benefits / Compensation',
    'People & Culture',
    'Talent Management',
    'Some other function (specify):',
    'Some other function (specify)',
    'Other'
  ],
  s7Influence: [
    'Primary decision maker',
    'Part of decision-making team',
    'Make recommendations that are usually adopted',
    'Provide input but limited influence',
    'No influence'
  ],
  s8Size: [
    'Fewer than 100',
    '100-249',
    '250-499',
    '500-999',
    '1,000-2,499',
    '2,500-4,999',
    '5,000-9,999',
    '10,000-24,999',
    '25,000-49,999',
    '50,000+'
  ],
  c2Industry: [
    'Agriculture, Forestry, Fishing and Hunting',
    'Construction',
    'Manufacturing',
    'Mining, Quarrying, and Oil and Gas Extraction',
    'Retail Trade',
    'Transportation and Warehousing',
    'Utilities',
    'Wholesale Trade',
    'Accommodation and Food Services',
    'Arts, Entertainment, and Recreation',
    'Educational Services',
    'Finance and Insurance',
    'Healthcare, Pharmaceuticals & Life Sciences',
    'Hospitality & Tourism',
    'Media & Publishing',
    'Media & Publishing (TV, Radio, Digital, News, Streaming)',
    'Professional & Business Services',
    'Professional & Business Services (Legal, Consulting, Accounting, Marketing)',
    'Real Estate and Rental and Leasing',
    'Scientific & Technical Services (Engineering, R&D, Architecture, Labs)',
    'IT Services & Technology Consulting',
    'Software & Technology Products',
    'Social Media & Digital Platforms',
    'Telecommunications & Internet Services',
    'Government / Public Administration',
    'Non-profit / NGO',
    'Non-profit/NGO',
    'Consumer Products / Cosmetics',
    'Other industry / Services (specify)'
  ],
  c4Revenue: [
    'Less than $10 million',
    '$10 million - $49.9 million',
    '$10-49 million',
    '$50-99 million',
    '$50 million - $99.9 million',
    '$100-499 million',
    '$100 million - $249.9 million',
    '$100 million - $499.9 million',
    '$250 million - $499.9 million',
    '$500-999 million',
    '$500 million - $999.9 million',
    '$1 billion - $4.9 billion',
    '$5 billion - $9.9 billion',
    '$10 billion or more',
    'Not applicable (non-profit/government)',
    'Prefer not to disclose',
    'Not provided'
  ],
  s9Country: [
    'United States',
    'Canada',
    'Mexico',
    'Brazil',
    'Argentina',
    'Chile',
    'Colombia',
    'Other Latin American / Caribbean country',
    'United Kingdom',
    'Germany',
    'France',
    'Netherlands',
    'Switzerland',
    'Italy',
    'Spain',
    'Sweden',
    'Other European country',
    'United Arab Emirates',
    'Saudi Arabia',
    'Israel',
    'South Africa',
    'Nigeria',
    'Kenya',
    'Egypt',
    'Other Middle Eastern country',
    'Other African country',
    'China',
    'Japan',
    'India',
    'Singapore',
    'Australia',
    'South Korea',
    'Other Asia Pacific country'
  ],
  s9aCountryPresence: [
    'No other countries - headquarters only',
    '1 to 2 other countries',
    '3 to 4 other countries',
    '5 to 9 other countries',
    '10 to 19 other countries',
    '20 to 49 other countries',
    '50 or more countries'
  ],
  c6RemoteWork: [
    'Fully flexible - Most roles can be remote/hybrid by employee choice',
    'Fully flexible - Most roles can be remote / hybrid by employee choice',
    'Selectively flexible - Many roles eligible based on job requirements',
    'Limited flexibility - Some roles eligible but most require on-site presence',
    'Minimal flexibility - Very few roles eligible for remote/hybrid',
    'No flexibility - All employees required on-site',
    'Varies significantly by location/business unit'
  ],
  c3BenefitsEligibility: [
    'All employees (100%)',
    'Most employees (75-99%)',
    'Many employees (50-74%)',
    'Some employees (25-49%)',
    'Few employees (<25%)',
    'Varies significantly by location'
  ],
  c3aExcludedGroups: [
    'Part-time employees',
    'Contract/temporary workers',
    'Contract / temporary workers',
    'Employees in certain countries/regions',
    'Employees below certain tenure',
    'Certain job levels/categories',
    'None - all employees eligible',
    'Some other employee group (specify)'
  ]
}

// ============================================
// ORDINAL OPTIONS - Keep in natural order, don't rank
// ============================================
const ORDINAL_OPTIONS = {
  // Company size
  s8Size: [
    'Fewer than 100',
    '100-249',
    '250-499',
    '500-999',
    '1,000-2,499',
    '2,500-4,999',
    '5,000-9,999',
    '10,000-24,999',
    '25,000-49,999',
    '50,000+'
  ],
  // Country presence
  s9aCountryPresence: [
    'No other countries - headquarters only',
    '1 to 2 other countries',
    '3 to 4 other countries',
    '5 to 9 other countries',
    '10 to 19 other countries',
    '20 to 49 other countries',
    '50 or more countries'
  ],
  // Revenue
  c4Revenue: [
    'Less than $10 million',
    '$10 million - $49.9 million',
    '$10-49 million',
    '$50-99 million',
    '$50 million - $99.9 million',
    '$100-499 million',
    '$100 million - $249.9 million',
    '$250 million - $499.9 million',
    '$500-999 million',
    '$500 million - $999.9 million',
    '$1 billion - $4.9 billion',
    '$5 billion - $9.9 billion',
    '$10 billion or more',
    'Not applicable (non-profit/government)',
    'Prefer not to disclose'
  ],
  // Job level (hierarchical)
  s5Level: [
    'C-level executive (CHRO, CPO)',
    'Executive/Senior Vice President',
    'Vice President',
    'Director',
    'Senior Manager',
    'Manager',
    'HR Generalist',
    'Benefits Specialist / Coordinator',
    'HR Specialist / Coordinator',
    'HR Assistant / Administrative',
    'Other'
  ],
  // Influence (hierarchical)
  s7Influence: [
    'Primary decision maker',
    'Part of decision-making team',
    'Make recommendations that are usually adopted',
    'Provide input but limited influence',
    'No influence'
  ],
  // Leave duration options (various)
  paidLeaveDuration: [
    '1 to less than 3 weeks',
    '3 to less than 5 weeks',
    '5 to less than 9 weeks',
    '9 to less than 13 weeks',
    '13 or more weeks',
    'Does not apply'
  ],
  intermittentLeaveDuration: [
    'No additional leave',
    '1 to 4 additional weeks',
    '5 to 11 additional weeks',
    '12 to 23 additional weeks',
    '24 or more additional weeks',
    'Unlimited based on medical need',
    'Does not apply'
  ],
  jobProtectionDuration: [
    '1 to less than 4 weeks',
    '4 to less than 12 weeks',
    '12 to less than 26 weeks',
    '26 to less than 52 weeks',
    '52 weeks or more',
    'Does not apply'
  ],
  partTimeDuration: [
    'Up to 4 weeks',
    '5 to less than 13 weeks',
    '13 to less than 26 weeks',
    '26 weeks or more',
    'As long as requested by healthcare provider',
    'As long as medically necessary',
    'Case-by-case basis',
    'No additional time beyond legal requirements'
  ],
  // Manager training completion
  trainingCompletion: [
    'Less than 10%',
    '10 to less than 25%',
    '25 to less than 50%',
    '50 to less than 75%',
    '75 to less than 100%',
    '100%',
    'Unsure',
    'Do not track this information',
    'Not able to provide this information'
  ],
  // Communication frequency
  communicationFrequency: [
    'Monthly or more often',
    'Quarterly',
    'Twice per year',
    'Annually (typically during enrollment or on World Cancer Day)',
    'Only when asked/reactive only',
    'No regular communication schedule'
  ],
  // CB3a: Support beyond legal requirements
  cb3a: [
    'Yes, we offer additional support beyond legal requirements',
    'Currently developing enhanced support offerings',
    'Not yet, but actively exploring options',
    'At this time, we primarily focus on meeting legal compliance requirements'
  ],
  // OR1: Current approach (ordinal from least to most comprehensive)
  or1: [
    'No formal approach: Handle case-by-case',
    'Developing approach: Currently building programs and policies',
    'Legal minimum only: Meet legal requirements only (FMLA, ADA)',
    'Moderate support: Some programs beyond legal requirements',
    'Enhanced support: Meaningful programs beyond legal minimums',
    'Comprehensive support: Extensive programs well beyond legal requirements',
    'Leading-edge support: Extensive, innovative programs'
  ]
}

// ============================================
// DIMENSION FOLLOW-UP OPTIONS
// ============================================
const DIMENSION_FOLLOWUPS = {
  d1: {
    d1aa: ['Generally consistent across all locations', 'Vary across locations', 'Only available in select locations'],
    d1_1: ORDINAL_OPTIONS.paidLeaveDuration,
    d1_2: ORDINAL_OPTIONS.intermittentLeaveDuration,
    d1_4b: ORDINAL_OPTIONS.partTimeDuration,
    d1_5: ORDINAL_OPTIONS.jobProtectionDuration,
    d1_6: [
      'Enhance short-term disability (higher % of salary)',
      'Enhance long-term disability (higher % of salary)',
      'Extend duration of benefits',
      'Reduce/waive waiting periods',
      'No enhancement - same as standard',
      'Not applicable - government disability only'
    ]
  },
  d3: {
    d3_1a: ['Mandatory for all managers', 'Mandatory for new managers only', 'Voluntary', 'Varies by training type'],
    d3_1: ORDINAL_OPTIONS.trainingCompletion
  },
  d4: {
    d4_1a: [
      'Credentialed internal staff dedicated to employee navigation',
      'External vendor / service (contracted)',
      'Through health insurance carrier',
      'Through specialized medical provider',
      'Partnership with specialized health organization',
      'Other approach'
    ],
    d4_1b: [
      'Clinical guidance from a licensed medical/healthcare professional',
      'Insurance navigation',
      'Mental health support',
      'Caregiver resources',
      'Financial planning',
      'Return-to-work planning',
      'Treatment decision support / second opinion',
      'Company-sponsored peer support networks',
      'Some other service'
    ]
  },
  d6: {
    d6_2: [
      'Regular pulse surveys',
      'Focus groups',
      'Exit interview data',
      'Manager feedback',
      'One-on-One discussion with employee',
      'Some other way',
      "Don't formally measure"
    ]
  },
  d11: {
    d11_1: [
      'Cervical cancer screening (Pap smear/HPV test)',
      'Colonoscopy (colorectal cancer)',
      'Dense breast tissue screening (ultrasound/MRI)',
      'Gastric / stomach cancer screening',
      'H. pylori testing',
      'Liver cancer screening (AFP test + ultrasound)',
      'Lung cancer screening (low-dose CT for high risk)',
      'Mammograms (breast cancer)',
      'Oral cancer screening',
      'Prostate cancer screening (PSA test)',
      'Skin cancer screening/full body exam',
      'Tuberculosis screening',
      'Other screening',
      'BRCA testing (breast/ovarian cancer risk)',
      'Lynch syndrome testing (colorectal cancer risk)',
      'Multi-gene panel testing',
      'Genetic counseling services',
      'Other genetic testing',
      'HPV vaccines (cervical cancer prevention)',
      'Hepatitis B vaccines (liver cancer prevention)',
      'COVID-19 vaccines',
      'Influenza vaccines',
      'Pneumonia vaccines',
      'Shingles vaccines',
      'Other preventive vaccines'
    ]
  },
  d12: {
    d12_1: [
      'Yes, using a systematic case review process',
      'Yes, using ad hoc case reviews',
      'No, we only review aggregate metrics'
    ],
    d12_2: [
      'Yes, several changes implemented',
      'Yes, a few changes implemented',
      'No'
    ]
  },
  d13: {
    d13_1: ORDINAL_OPTIONS.communicationFrequency
  }
}

// ============================================
// ANALYTICS HELPER FUNCTIONS
// ============================================
function parseJsonField(data: any, field: string): string {
  if (!data) return 'Not provided'
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    const value = parsed[field]
    if (value === null || value === undefined) return 'Not provided'
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  } catch {
    return 'Not provided'
  }
}

function parseJsonArray(data: any, field: string): string[] {
  if (!data) return []
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    const value = parsed[field]
    if (Array.isArray(value)) {
      return value.map(v => typeof v === 'string' ? v : String(v))
    }
    return []
  } catch {
    return []
  }
}

function getGridData(data: any, gridField: string): Record<string, string> {
  if (!data) return {}
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    if (!parsed || typeof parsed !== 'object') return {}
    
    // Try multiple field name variations (d1a, D1a, d1A)
    let grid = parsed[gridField]
    if (!grid) {
      // Try uppercase variation
      const upperField = gridField.charAt(0).toUpperCase() + gridField.slice(1)
      grid = parsed[upperField]
    }
    if (!grid) {
      // Try all uppercase
      grid = parsed[gridField.toUpperCase()]
    }
    
    if (!grid || typeof grid !== 'object' || Array.isArray(grid)) return {}
    
    // Ensure all values are strings
    const result: Record<string, string> = {}
    Object.entries(grid).forEach(([key, value]) => {
      result[key] = typeof value === 'string' ? value : String(value || '')
    })
    return result
  } catch (e) {
    console.error('getGridData error:', e, 'data:', data, 'gridField:', gridField)
    return {}
  }
}

// Get CB1 values - handles both FP format (cb1) and Standard/App format (cb1_standard, cb1_leave, etc.)
function getCb1Values(data: any): string[] {
  if (!data) return []
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    if (!parsed || typeof parsed !== 'object') return []
    
    // FP format: single cb1 array
    if (Array.isArray(parsed.cb1) && parsed.cb1.length > 0) {
      return parsed.cb1.map((v: any) => typeof v === 'string' ? v : String(v))
    }
    
    // Standard/App format: split into cb1_standard, cb1_leave, cb1_wellness, cb1_financial, cb1_navigation
    const splitFields = ['cb1_standard', 'cb1_leave', 'cb1_wellness', 'cb1_financial', 'cb1_navigation']
    const combined: string[] = []
    
    splitFields.forEach(field => {
      const arr = parsed[field]
      if (Array.isArray(arr)) {
        arr.forEach((v: any) => {
          const str = typeof v === 'string' ? v : String(v)
          if (str && !combined.includes(str)) {
            combined.push(str)
          }
        })
      }
    })
    
    return combined
  } catch {
    return []
  }
}

// Count CB1 multi-select with support for both formats
function countCb1MultiSelect(assessments: ProcessedAssessment[], options: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  options.forEach(opt => counts[opt] = 0)
  counts['No response'] = 0
  
  // Pre-normalize all options for faster matching
  const normalizedOptions = options.map(opt => ({
    original: opt,
    normalized: normalizeForMatch(opt)
  }))
  
  assessments.forEach(a => {
    const values = getCb1Values(a.general_benefits_data)
    
    if (values.length === 0) {
      counts['No response']++
      return
    }
    
    values.forEach(v => {
      const vNorm = normalizeForMatch(String(v))
      
      // Try exact match first (normalized)
      let matched = normalizedOptions.find(o => o.normalized === vNorm)
      
      // If no exact match, try partial match
      if (!matched) {
        matched = normalizedOptions.find(o => 
          vNorm.includes(o.normalized.slice(0, 25)) ||
          o.normalized.includes(vNorm.slice(0, 25))
        )
      }
      
      if (matched) {
        counts[matched.original]++
      }
    })
  })
  
  return counts
}

// Normalize text for comparison - handles space/slash variations
function normalizeForMatch(text: string): string {
  return String(text)
    .toLowerCase()
    .replace(/_/g, ' ')         // convert underscores to spaces (app stores "no_impact" but we expect "no positive impact")
    .replace(/\s*\/\s*/g, '/')  // normalize spaces around slashes
    .replace(/\s+/g, ' ')       // normalize multiple spaces
    .replace(/['']/g, "'")      // normalize quotes
    .trim()
}

function countResponses(assessments: ProcessedAssessment[], dataKey: string, field: string, options: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  options.forEach(opt => counts[opt] = 0)
  counts['Other'] = 0
  counts['No response'] = 0
  
  // Pre-normalize all options for faster matching
  const normalizedOptions = options.map(opt => ({
    original: opt,
    normalized: normalizeForMatch(opt)
  }))
  
  assessments.forEach(a => {
    const value = parseJsonField((a as any)[dataKey], field)
    // Treat 'Not provided', empty, null, 'NOT SET' as no response
    if (!value || value === 'Not provided' || value === 'NOT SET' || value === 'null' || value === 'undefined') {
      counts['No response']++
    } else {
      const valueNorm = normalizeForMatch(value)
      
      // Try exact match first (normalized)
      let matched = normalizedOptions.find(o => o.normalized === valueNorm)
      
      // If no exact match, try partial match
      if (!matched) {
        matched = normalizedOptions.find(o => 
          valueNorm.includes(o.normalized.slice(0, 25)) ||
          o.normalized.includes(valueNorm.slice(0, 25))
        )
      }
      
      if (matched) {
        counts[matched.original]++
      } else {
        counts['Other']++
      }
    }
  })
  
  return counts
}

// Count C3a with conditional logic: if c3 = "All employees (100%)" and c3a is empty, auto-fill as "None - all employees eligible"
function countC3aWithCondition(assessments: ProcessedAssessment[], options: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  options.forEach(opt => counts[opt] = 0)
  counts['No response'] = 0
  
  // Pre-normalize all options for faster matching
  const normalizedOptions = options.map(opt => ({
    original: opt,
    normalized: normalizeForMatch(opt)
  }))
  
  assessments.forEach(a => {
    const firmData = typeof a.firmographics_data === 'string' 
      ? JSON.parse(a.firmographics_data || '{}') 
      : (a.firmographics_data || {})
    
    const c3Value = firmData.c3 || ''
    const c3aNorm = normalizeForMatch(c3Value)
    const isAllEmployees = c3aNorm.includes('all') && c3aNorm.includes('100')
    
    // Get c3a values
    let c3aValues: string[] = []
    if (Array.isArray(firmData.c3a) && firmData.c3a.length > 0) {
      c3aValues = firmData.c3a.map((v: any) => typeof v === 'string' ? v : String(v))
    }
    
    // If c3a is empty but c3 = "All employees (100%)", auto-fill as "None - all employees eligible"
    if (c3aValues.length === 0) {
      if (isAllEmployees) {
        // Find the "None - all employees eligible" option
        const noneOption = options.find(o => normalizeForMatch(o).includes('none') && normalizeForMatch(o).includes('all employees eligible'))
        if (noneOption) {
          counts[noneOption]++
        } else {
          // Fallback to first option that contains "None"
          const fallback = options.find(o => normalizeForMatch(o).includes('none'))
          if (fallback) {
            counts[fallback]++
          } else {
            counts['No response']++
          }
        }
      } else {
        // c3 is not "All employees" but c3a is empty - this is a genuine no response
        counts['No response']++
      }
      return
    }
    
    // Count actual c3a values
    c3aValues.forEach(v => {
      const vNorm = normalizeForMatch(String(v))
      
      // Try exact match first (normalized)
      let matched = normalizedOptions.find(o => o.normalized === vNorm)
      
      // If no exact match, try partial match
      if (!matched) {
        matched = normalizedOptions.find(o => 
          vNorm.includes(o.normalized.slice(0, 25)) ||
          o.normalized.includes(vNorm.slice(0, 25))
        )
      }
      
      // Special case: "Other" value should match "Some other employee group"
      if (!matched && (vNorm === 'other' || vNorm.includes('other employee'))) {
        matched = normalizedOptions.find(o => o.normalized.includes('other employee group'))
      }
      
      if (matched) {
        counts[matched.original]++
      }
    })
  })
  
  return counts
}

function countMultiSelect(assessments: ProcessedAssessment[], dataKey: string, field: string, options: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  options.forEach(opt => counts[opt] = 0)
  counts['No response'] = 0
  
  // Pre-normalize all options for faster matching
  const normalizedOptions = options.map(opt => ({
    original: opt,
    normalized: normalizeForMatch(opt)
  }))
  
  assessments.forEach(a => {
    const values = parseJsonArray((a as any)[dataKey], field)
    
    if (values.length === 0) {
      counts['No response']++
      return
    }
    
    values.forEach(v => {
      const vNorm = normalizeForMatch(String(v))
      
      // Try exact match first (normalized)
      let matched = normalizedOptions.find(o => o.normalized === vNorm)
      
      // If no exact match, try partial match
      if (!matched) {
        matched = normalizedOptions.find(o => 
          vNorm.includes(o.normalized.slice(0, 25)) ||
          o.normalized.includes(vNorm.slice(0, 25))
        )
      }
      
      if (matched) {
        counts[matched.original]++
      }
    })
  })
  
  return counts
}

function countDimensionResponses(assessments: ProcessedAssessment[], config: typeof DIMENSION_CONFIG.d1): Record<string, Record<string, number>> {
  const results: Record<string, Record<string, number>> = {}
  
  const responseOptions = [
    'Currently offer',
    'In active planning / development',
    'Assessing feasibility',
    'Not able to offer in foreseeable future',
    'Unsure',
    'No response'
  ]
  
  // Aliases for response options (e.g., "Currently use" → "Currently offer")
  const responseAliases: Record<string, string> = {
    // "Currently offer" variants (lowercase normalized)
    'currently use': 'Currently offer',
    'currently utilize': 'Currently offer',
    'currently measure / track': 'Currently offer',
    'currently measure/track': 'Currently offer',
    'currently provide to managers': 'Currently offer',
    'currently provide': 'Currently offer',
    'currently track': 'Currently offer',
    'currently offer': 'Currently offer',  // Explicit lowercase match
    // "In active planning / development" variants
    'in active planning / development': 'In active planning / development',
    'in active planning/development': 'In active planning / development',
    'planning': 'In active planning / development',
    'in planning': 'In active planning / development',
    'in development': 'In active planning / development',
    // "Assessing feasibility" variants
    'assessing feasibility': 'Assessing feasibility',
    'assessing': 'Assessing feasibility',
    // "Not able to offer" variants
    'not able to offer': 'Not able to offer in foreseeable future',
    'not able': 'Not able to offer in foreseeable future',
    'not able to offer in foreseeable future': 'Not able to offer in foreseeable future',
    'not able to measure / track in foreseeable future': 'Not able to offer in foreseeable future',
    'not able to measure/track in foreseeable future': 'Not able to offer in foreseeable future',
    'not able to provide in foreseeable future': 'Not able to offer in foreseeable future',
    'not able to utilize in foreseeable future': 'Not able to offer in foreseeable future',
    'not able to track in foreseeable future': 'Not able to offer in foreseeable future',
    // Unknown/Unsure variants
    'unknown (5)': 'Unsure',
    'unknown': 'Unsure',
    'unsure': 'Unsure'
  }
  
  // Pre-normalize response options
  const normalizedResponseOpts = responseOptions.map(r => ({
    original: r,
    normalized: normalizeForMatch(r)
  }))
  
  config.items.forEach(item => {
    results[item] = {}
    responseOptions.forEach(r => results[item][r] = 0)
  })
  
  assessments.forEach(a => {
    const gridData = getGridData((a as any)[config.dataKey], config.gridField)
    
    config.items.forEach(item => {
      // Strip asterisk from item for data lookup (asterisk is for display only)
      const lookupKey = item.replace(/ \*$/, '')
      
      // Try exact match first
      let response = gridData[item] || gridData[lookupKey]
      
      // If no exact match, try case-insensitive match
      if (!response) {
        const lowerLookup = lookupKey.toLowerCase()
        for (const [key, value] of Object.entries(gridData)) {
          if (key.toLowerCase() === lowerLookup) {
            response = value
            break
          }
        }
      }
      
      // If still no match, try partial match (first 40 chars)
      if (!response) {
        const partialLookup = lookupKey.slice(0, 40).toLowerCase()
        for (const [key, value] of Object.entries(gridData)) {
          if (key.toLowerCase().startsWith(partialLookup)) {
            response = value
            break
          }
        }
      }
      
      if (!response) {
        results[item]['No response']++
      } else {
        const responseNorm = normalizeForMatch(String(response))
        
        // Check aliases first (e.g., "Currently use" → "Currently offer")
        const aliasMatch = responseAliases[responseNorm]
        if (aliasMatch) {
          results[item][aliasMatch]++
        } else {
          // Find matching response option
          let matched = normalizedResponseOpts.find(o => o.normalized === responseNorm)
          if (!matched) {
            matched = normalizedResponseOpts.find(o => 
              responseNorm.includes(o.normalized.slice(0, 15)) ||
              o.normalized.includes(responseNorm.slice(0, 15))
            )
          }
          
          if (matched) {
            results[item][matched.original]++
          } else {
            results[item]['No response']++
          }
        }
      }
    })
  })
  
  return results
}

// ============================================
// ANALYTICS SUB-COMPONENTS
// ============================================
function StatCard({ label, value, color = 'gray' }: { label: string; value: number | string; color?: string }) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-900',
    purple: 'bg-purple-100 text-purple-900',
    blue: 'bg-blue-100 text-blue-900',
    green: 'bg-green-100 text-green-900',
    orange: 'bg-orange-100 text-orange-900'
  }
  
  return (
    <div className={`rounded-xl p-4 ${colorClasses[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  )
}

function AnalyticsProgressBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700 truncate mr-2">{label}</span>
        <span className="text-gray-500 whitespace-nowrap">{value}/{total} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-orange-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function DataTable({ 
  title, 
  data, 
  total, 
  isMultiSelect = false,
  orderedOptions = null,  // If provided, display in this order instead of ranking
  excludeNoResponse = false,  // For conditional questions where "No response" means "not asked"
  filterNote = ''  // Notation for conditional questions (e.g., "Asked if OR1 = No formal approach")
}: { 
  title: string
  data: Record<string, number>
  total: number
  isMultiSelect?: boolean
  orderedOptions?: string[] | null
  excludeNoResponse?: boolean
  filterNote?: string
}) {
  // If orderedOptions provided, use that order; otherwise sort by count (ranked)
  let displayItems: [string, number][]
  
  if (orderedOptions) {
    // Use the natural order from orderedOptions
    displayItems = orderedOptions
      .filter(opt => data[opt] !== undefined)
      .map(opt => [opt, data[opt] || 0] as [string, number])
    
    // Add any items in data that weren't in orderedOptions
    Object.entries(data)
      .filter(([key]) => !orderedOptions.includes(key) && key !== 'No response' && key !== 'Other')
      .forEach(([key, count]) => displayItems.push([key, count]))
  } else {
    // Sort by count (ranked)
    displayItems = Object.entries(data)
      .filter(([key]) => key !== 'No response' && key !== 'Other')
      .sort((a, b) => b[1] - a[1])
  }
  
  const noResponseCount = data['No response'] || 0
  const otherCount = data['Other'] || 0
  
  // Calculate actual respondents (exclude "No response" from percentage denominator)
  const actualRespondents = total - noResponseCount
  const pctBase = actualRespondents > 0 ? actualRespondents : total
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b">
        <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
        {isMultiSelect && (
          <p className="text-xs text-gray-500">Multi-select - percentages may exceed 100%</p>
        )}
        {filterNote && (
          <p className="text-xs text-blue-600 italic">Filter: {filterNote}</p>
        )}
        {noResponseCount > 0 && !excludeNoResponse && (
          <p className="text-xs text-gray-400">Percentages based on {actualRespondents} respondents (excludes {noResponseCount} no response)</p>
        )}
      </div>
      <div className="p-3 space-y-2">
        {displayItems.map(([key, count]) => {
          const pct = pctBase > 0 ? Math.round((count / pctBase) * 100) : 0
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="flex-1 text-xs text-gray-700" title={key}>{key}</div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                <div 
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="w-20 text-right flex-shrink-0">
                <span className="font-bold text-gray-800 text-sm">{count}</span>
                <span className="text-gray-500 text-xs ml-1">({pct}%)</span>
              </div>
            </div>
          )
        })}
        {otherCount > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t">
            <div className="flex-1 text-xs text-gray-500">Other</div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
              <div 
                className="h-full bg-gray-400 rounded-full"
                style={{ width: `${Math.min(Math.round((otherCount / pctBase) * 100), 100)}%` }}
              />
            </div>
            <div className="w-20 text-right flex-shrink-0">
              <span className="font-bold text-gray-500 text-sm">{otherCount}</span>
              <span className="text-gray-400 text-xs ml-1">({pctBase > 0 ? Math.round((otherCount / pctBase) * 100) : 0}%)</span>
            </div>
          </div>
        )}
        {!excludeNoResponse && noResponseCount > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t">
            <div className="flex-1 text-xs text-gray-400">No response</div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
              <div 
                className="h-full bg-gray-300 rounded-full"
                style={{ width: `${Math.min(Math.round((noResponseCount / total) * 100), 100)}%` }}
              />
            </div>
            <div className="w-20 text-right flex-shrink-0">
              <span className="font-bold text-gray-400 text-sm">{noResponseCount}</span>
              <span className="text-gray-300 text-xs ml-1">({total > 0 ? Math.round((noResponseCount / total) * 100) : 0}%)</span>
            </div>
          </div>
        )}
        {displayItems.length === 0 && noResponseCount === 0 && (
          <p className="text-gray-400 text-xs">No data</p>
        )}
      </div>
    </div>
  )
}

// Alias for consistency
const DataTableFull = DataTable

function CellWithPct({ count, total, color }: { count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const colorClasses: Record<string, string> = {
    green: 'text-green-700',
    blue: 'text-blue-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700',
    purple: 'text-purple-700',
    gray: 'text-gray-500'
  }
  
  return (
    <td className={`text-center p-3 ${colorClasses[color]}`}>
      <span className="font-bold">{count}</span>
      <span className="text-xs ml-1">({pct}%)</span>
    </td>
  )
}

// ============================================
// ANALYTICS SECTIONS
// ============================================
function OverviewSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalCount = assessments.length
  const fpCount = assessments.filter(a => a.isFoundingPartner).length
  const regularCount = totalCount - fpCount
  const completedCount = assessments.filter(a => a.completionPercentage >= 100).length
  const inProgressCount = assessments.filter(a => a.completionPercentage > 0 && a.completionPercentage < 100).length
  const notStartedCount = assessments.filter(a => a.completionPercentage === 0).length
  // Only count non-FP users who paid (FPs don't pay through normal flow)
  const paidNonFpCount = assessments.filter(a => !a.isFoundingPartner && a.payment_completed).length
  // Revenue = FPs (sponsored) + Paid non-FPs
  const totalRevenue = (fpCount + paidNonFpCount) * 1250
  
  const dimensionNames = Object.values(DIMENSION_CONFIG).map(d => d.name)
  
  const sectionCompletion = {
    firmographics: assessments.filter(a => a.firmographics_complete).length,
    generalBenefits: assessments.filter(a => a.general_benefits_complete).length,
    currentSupport: assessments.filter(a => a.current_support_complete).length,
    dimensions: [
      assessments.filter(a => a.dimension1_complete).length,
      assessments.filter(a => a.dimension2_complete).length,
      assessments.filter(a => a.dimension3_complete).length,
      assessments.filter(a => a.dimension4_complete).length,
      assessments.filter(a => a.dimension5_complete).length,
      assessments.filter(a => a.dimension6_complete).length,
      assessments.filter(a => a.dimension7_complete).length,
      assessments.filter(a => a.dimension8_complete).length,
      assessments.filter(a => a.dimension9_complete).length,
      assessments.filter(a => a.dimension10_complete).length,
      assessments.filter(a => a.dimension11_complete).length,
      assessments.filter(a => a.dimension12_complete).length,
      assessments.filter(a => a.dimension13_complete).length,
    ],
    crossDimensional: assessments.filter(a => a.cross_dimensional_complete).length,
    employeeImpact: assessments.filter(a => a.employee_impact_complete).length
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Assessments" value={totalCount} />
        <StatCard label="Founding Partners" value={fpCount} color="purple" />
        <StatCard label="Regular Users" value={regularCount} color="blue" />
        <StatCard label="Completed (100%)" value={completedCount} color="green" />
        <StatCard label="In Progress" value={inProgressCount} color="orange" />
        <StatCard label="Not Started" value={notStartedCount} color="gray" />
        <StatCard label="Paid (Non-FP)" value={paidNonFpCount} color="green" />
        <StatCard label="Revenue Collected" value={`$${totalRevenue.toLocaleString()}`} color="green" />
      </div>
      
      {/* Section Completion */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Section Completion Rates</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Core Sections</h4>
            <AnalyticsProgressBar label="Firmographics" value={sectionCompletion.firmographics} total={totalCount} />
            <AnalyticsProgressBar label="General Benefits" value={sectionCompletion.generalBenefits} total={totalCount} />
            <AnalyticsProgressBar label="Current Support" value={sectionCompletion.currentSupport} total={totalCount} />
            <AnalyticsProgressBar label="Cross-Dimensional" value={sectionCompletion.crossDimensional} total={totalCount} />
            <AnalyticsProgressBar label="Employee Impact" value={sectionCompletion.employeeImpact} total={totalCount} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">13 Dimensions</h4>
            <div className="pr-2">
              {dimensionNames.map((name, idx) => (
                <AnalyticsProgressBar 
                  key={idx}
                  label={`D${idx + 1}: ${name}`} 
                  value={sectionCompletion.dimensions[idx]} 
                  total={totalCount}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FirmographicsSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalRespondents = assessments.length
  
  const industryData = countResponses(assessments, 'firmographics_data', 'c2', FIRMOGRAPHICS_OPTIONS.c2Industry)
  const sizeData = countResponses(assessments, 'firmographics_data', 's8', ORDINAL_OPTIONS.s8Size)
  
  // Revenue: Check both c4 (Excel import) and c5 (app version) fields
  const revenueData: Record<string, number> = {}
  ORDINAL_OPTIONS.c4Revenue.forEach(opt => revenueData[opt] = 0)
  revenueData['No response'] = 0
  
  assessments.forEach(a => {
    const firm = typeof a.firmographics_data === 'string' 
      ? JSON.parse(a.firmographics_data || '{}') 
      : (a.firmographics_data || {})
    
    // Try c4 first, then c5
    // Skip c4 if it's an array (corrupted data - should be string), null, empty, or 'Not provided'
    let value = firm.c4
    if (!value || value === 'Not provided' || Array.isArray(value)) {
      value = firm.c5
    }
    
    if (!value || value === 'Not provided' || Array.isArray(value)) {
      revenueData['No response']++
    } else {
      const valueStr = String(value)
      const valueNorm = normalizeForMatch(valueStr)
      const matched = ORDINAL_OPTIONS.c4Revenue.find(opt => 
        normalizeForMatch(opt) === valueNorm || 
        valueNorm.includes(normalizeForMatch(opt).slice(0, 15))
      )
      if (matched) {
        revenueData[matched]++
      } else {
        revenueData['No response']++
      }
    }
  })
  
  const levelData = countResponses(assessments, 'firmographics_data', 's5', ORDINAL_OPTIONS.s5Level)
  const functionData = countResponses(assessments, 'firmographics_data', 's4b', FIRMOGRAPHICS_OPTIONS.s4bFunction)
  const influenceData = countResponses(assessments, 'firmographics_data', 's7', ORDINAL_OPTIONS.s7Influence)
  const countryData = countResponses(assessments, 'firmographics_data', 's9', FIRMOGRAPHICS_OPTIONS.s9Country)
  const countryPresenceData = countResponses(assessments, 'firmographics_data', 's9a', ORDINAL_OPTIONS.s9aCountryPresence)
  const remoteData = countResponses(assessments, 'firmographics_data', 'c6', FIRMOGRAPHICS_OPTIONS.c6RemoteWork)
  const benefitsEligibilityData = countResponses(assessments, 'firmographics_data', 'c3', FIRMOGRAPHICS_OPTIONS.c3BenefitsEligibility)
  // C3a: Use conditional logic - if c3 = "All employees (100%)" and c3a is empty, auto-fill as "None - all employees eligible"
  const excludedGroupsData = countC3aWithCondition(assessments, FIRMOGRAPHICS_OPTIONS.c3aExcludedGroups)
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3">
          <h3 className="text-white font-bold">Firmographics / Company Profile</h3>
          <p className="text-purple-200 text-xs">{totalRespondents} respondents</p>
        </div>
        
        <div className="p-5 grid md:grid-cols-2 gap-6">
          <DataTable title="C2: Industry" data={industryData} total={totalRespondents} />
          <DataTable title="S8: Company Size (Total Employees)" data={sizeData} total={totalRespondents} orderedOptions={ORDINAL_OPTIONS.s8Size} />
          <DataTable title="C4: Annual Revenue" data={revenueData} total={totalRespondents} orderedOptions={ORDINAL_OPTIONS.c4Revenue} />
          <DataTable title="S5: Respondent Level" data={levelData} total={totalRespondents} orderedOptions={ORDINAL_OPTIONS.s5Level} />
          <DataTable title="S4b: Primary Job Function" data={functionData} total={totalRespondents} />
          <DataTable title="S7: Benefits Decision Influence" data={influenceData} total={totalRespondents} orderedOptions={ORDINAL_OPTIONS.s7Influence} />
          <DataTable title="S9: HQ Country" data={countryData} total={totalRespondents} />
          <DataTable title="S9a: International Presence" data={countryPresenceData} total={totalRespondents} orderedOptions={ORDINAL_OPTIONS.s9aCountryPresence} />
          <DataTable title="C3: Benefits Eligibility %" data={benefitsEligibilityData} total={totalRespondents} />
          <DataTable title="C3a: Employee Groups Excluded from Benefits" data={excludedGroupsData} total={totalRespondents} isMultiSelect />
          <DataTable title="C6: Remote/Hybrid Work Policy" data={remoteData} total={totalRespondents} />
        </div>
      </div>
    </div>
  )
}

function GeneralBenefitsSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalRespondents = assessments.length
  
  // CB1: Use combined function that handles both FP format (cb1) and Standard format (cb1_standard, cb1_leave, etc.)
  const standardBenefits = countCb1MultiSelect(assessments, CB1_OPTIONS.standardBenefits)
  const leaveFlexibility = countCb1MultiSelect(assessments, CB1_OPTIONS.leaveFlexibility)
  const wellnessSupport = countCb1MultiSelect(assessments, CB1_OPTIONS.wellnessSupport)
  const financialLegal = countCb1MultiSelect(assessments, CB1_OPTIONS.financialLegal)
  const careNavigation = countCb1MultiSelect(assessments, CB1_OPTIONS.careNavigation)
  
  // CB2b - Programs planned for next 2 years (uses same options as CB1)
  const allCb1Options = [
    ...CB1_OPTIONS.standardBenefits,
    ...CB1_OPTIONS.leaveFlexibility,
    ...CB1_OPTIONS.wellnessSupport,
    ...CB1_OPTIONS.financialLegal,
    ...CB1_OPTIONS.careNavigation,
    'None of these'
  ]
  const cb2bData = countMultiSelect(assessments, 'general_benefits_data', 'cb2b', allCb1Options)
  
  // Count how many respondents have CB2b data
  let cb2bRespondents = 0
  assessments.forEach(a => {
    const arr = parseJsonArray(a.general_benefits_data, 'cb2b')
    if (arr.length > 0) cb2bRespondents++
  })
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
          <h3 className="text-white font-bold">General Benefits (CB1)</h3>
          <p className="text-blue-200 text-xs">{totalRespondents} respondents - Multi-select: counts show # selecting each option</p>
        </div>
        
        <div className="p-5 space-y-6">
          <DataTable title="Standard Benefits" data={standardBenefits} total={totalRespondents} isMultiSelect />
          <DataTable title="Leave & Flexibility Programs" data={leaveFlexibility} total={totalRespondents} isMultiSelect />
          <DataTable title="Wellness & Support Programs" data={wellnessSupport} total={totalRespondents} isMultiSelect />
          <DataTable title="Financial & Legal Assistance" data={financialLegal} total={totalRespondents} isMultiSelect />
          <DataTable title="Care Navigation & Support Services" data={careNavigation} total={totalRespondents} isMultiSelect />
        </div>
      </div>
      
      {/* CB2b - Programs Planned */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3">
          <h3 className="text-white font-bold">CB2b: Programs Planned to Roll Out (Next 2 Years)</h3>
          <p className="text-indigo-200 text-xs">{cb2bRespondents} respondents with data - Multi-select</p>
        </div>
        
        <div className="p-5">
          {cb2bRespondents > 0 ? (
            <DataTable 
              title="Programs Planned for Rollout" 
              data={cb2bData} 
              total={cb2bRespondents} 
              isMultiSelect 
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
              No respondents have CB2b data
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CurrentSupportSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalRespondents = assessments.length
  
  // cb3a is in general_benefits_data for most respondents, current_support_data for some
  const cb3aCounts: Record<string, number> = {}
  CURRENT_SUPPORT_OPTIONS.cb3a.forEach(opt => cb3aCounts[opt] = 0)
  cb3aCounts['No response'] = 0
  
  // Track who answered CB3A = "Yes" for conditional questions
  let cb3aYesCount = 0
  
  assessments.forEach(a => {
    // Try general_benefits_data first, then current_support_data
    let value = parseJsonField(a.general_benefits_data, 'cb3a')
    if (value === 'Not provided') {
      value = parseJsonField(a.current_support_data, 'cb3a')
    }
    if (value === 'Not provided' || !value) {
      cb3aCounts['No response']++
    } else {
      const valueNorm = normalizeForMatch(value)
      const matched = CURRENT_SUPPORT_OPTIONS.cb3a.find(opt => 
        normalizeForMatch(opt) === valueNorm || 
        valueNorm.includes(normalizeForMatch(opt).slice(0, 25))
      )
      if (matched) {
        cb3aCounts[matched]++
        if (matched.includes('Yes')) cb3aYesCount++
      } else {
        cb3aCounts['No response']++
      }
    }
  })
  
  // CB3B/CB3C/CB3D are CONDITIONAL - only asked if CB3A = "Yes"
  // Only count respondents who actually have data for these fields
  const cb3bCounts: Record<string, number> = {}
  const cb3cCounts: Record<string, number> = {}
  const cb3dCounts: Record<string, number> = {}
  CURRENT_SUPPORT_OPTIONS.cb3b.forEach(opt => cb3bCounts[opt] = 0)
  CURRENT_SUPPORT_OPTIONS.cb3c.forEach(opt => cb3cCounts[opt] = 0)
  CURRENT_SUPPORT_OPTIONS.cb3d.forEach(opt => cb3dCounts[opt] = 0)
  
  let cb3bRespondents = 0
  let cb3cRespondents = 0
  let cb3dRespondents = 0
  
  assessments.forEach(a => {
    const cb3bValues = parseJsonArray(a.current_support_data, 'cb3b')
    const cb3cValues = parseJsonArray(a.current_support_data, 'cb3c')
    const cb3dValues = parseJsonArray(a.current_support_data, 'cb3d')
    
    if (cb3bValues.length > 0) {
      cb3bRespondents++
      cb3bValues.forEach(v => {
        const vNorm = normalizeForMatch(String(v))
        const matched = CURRENT_SUPPORT_OPTIONS.cb3b.find(opt => 
          normalizeForMatch(opt) === vNorm || vNorm.includes(normalizeForMatch(opt).slice(0, 25))
        )
        if (matched) cb3bCounts[matched]++
      })
    }
    
    if (cb3cValues.length > 0) {
      cb3cRespondents++
      cb3cValues.forEach(v => {
        const vNorm = normalizeForMatch(String(v))
        const matched = CURRENT_SUPPORT_OPTIONS.cb3c.find(opt => 
          normalizeForMatch(opt) === vNorm || vNorm.includes(normalizeForMatch(opt).slice(0, 25))
        )
        if (matched) cb3cCounts[matched]++
      })
    }
    
    if (cb3dValues.length > 0) {
      cb3dRespondents++
      cb3dValues.forEach(v => {
        const vNorm = normalizeForMatch(String(v))
        const matched = CURRENT_SUPPORT_OPTIONS.cb3d.find(opt => 
          normalizeForMatch(opt) === vNorm || vNorm.includes(normalizeForMatch(opt).slice(0, 25))
        )
        if (matched) cb3dCounts[matched]++
      })
    }
  })
  
  const or1Data = countResponses(assessments, 'current_support_data', 'or1', CURRENT_SUPPORT_OPTIONS.or1)
  const or2aData = countMultiSelect(assessments, 'current_support_data', 'or2a', CURRENT_SUPPORT_OPTIONS.or2a)
  const or3Data = countMultiSelect(assessments, 'current_support_data', 'or3', CURRENT_SUPPORT_OPTIONS.or3)
  const or5aData = countMultiSelect(assessments, 'current_support_data', 'or5a', CURRENT_SUPPORT_OPTIONS.or5a)
  const or6Data = countMultiSelect(assessments, 'current_support_data', 'or6', CURRENT_SUPPORT_OPTIONS.or6)
  
  // Count OR1 respondents (those who have data)
  const or1Respondents = totalRespondents - (or1Data['No response'] || 0)
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3">
          <h3 className="text-white font-bold">Current Support Landscape</h3>
          <p className="text-teal-200 text-xs">{totalRespondents} total respondents</p>
        </div>
        
        <div className="p-5 space-y-6">
          <DataTable title="CB3a: Support Beyond Legal Requirements" data={cb3aCounts} total={totalRespondents} orderedOptions={ORDINAL_OPTIONS.cb3a} />
          
          {/* Conditional questions - only show respondents who were asked */}
          {cb3bRespondents > 0 && (
              <DataTable title={`CB3b: How Programs Are Structured (n=${cb3bRespondents})`} data={cb3bCounts} total={cb3bRespondents} isMultiSelect filterNote="Asked if CB3a = Yes or Currently developing" />
          )}
          {cb3cRespondents > 0 && (
            <DataTable title={`CB3c: Health Conditions Addressed (n=${cb3cRespondents})`} data={cb3cCounts} total={cb3cRespondents} isMultiSelect filterNote="Asked if CB3a = Yes or Currently developing" />
          )}
          {cb3dRespondents > 0 && (
            <DataTable title={`CB3d: How Programs Were Developed (n=${cb3dRespondents})`} data={cb3dCounts} total={cb3dRespondents} isMultiSelect filterNote="Asked if CB3a = Yes or Currently developing" />
          )}
          
          <DataTable title={`OR1: Current Approach to Supporting Employees (n=${or1Respondents})`} data={or1Data} total={or1Respondents} orderedOptions={ORDINAL_OPTIONS.or1} />
          <DataTable title="OR2a: Triggers for Developing Support" data={or2aData} total={totalRespondents} isMultiSelect filterNote="Asked if OR1 = Moderate/Enhanced/Comprehensive support" />
          <DataTable title="OR3: Primary Barriers to Comprehensive Support" data={or3Data} total={totalRespondents} isMultiSelect filterNote="Asked if OR1 = No formal approach, Developing, or Legal minimum only" />
          <DataTable title="OR5a: Caregiver Support Types" data={or5aData} total={totalRespondents} isMultiSelect />
          <DataTable title="OR6: Monitoring Effectiveness" data={or6Data} total={totalRespondents} isMultiSelect />
        </div>
      </div>
    </div>
  )
}

function DimensionSection({ 
  dimKey, 
  config, 
  assessments 
}: { 
  dimKey: string
  config: typeof DIMENSION_CONFIG.d1
  assessments: ProcessedAssessment[] 
}) {
  const totalRespondents = assessments.length
  const dimensionData = countDimensionResponses(assessments, config)
  const dimNum = dimKey.replace('d', '')
  
  // Helper to count responses from multiple field variants without double-counting
  const countWithVariants = (dataKey: string, fields: string[], options: string[], isMulti = false) => {
    const counts: Record<string, number> = {}
    options.forEach(opt => counts[opt] = 0)
    if (!isMulti) counts['Other'] = 0
    
    let respondentCount = 0
    
    assessments.forEach(a => {
      const data = (a as any)[dataKey]
      let foundValue = false
      
      // Check all field variants
      for (const field of fields) {
        if (isMulti) {
          const values = parseJsonArray(data, field)
          if (values.length > 0) {
            foundValue = true
            values.forEach(v => {
              const vNorm = normalizeForMatch(String(v))
              const matched = options.find(opt => 
                normalizeForMatch(opt) === vNorm || vNorm.includes(normalizeForMatch(opt).slice(0, 25))
              )
              if (matched) counts[matched]++
            })
            break // Found in this variant, don't check others
          }
        } else {
          const value = parseJsonField(data, field)
          if (value && value !== 'Not provided') {
            foundValue = true
            const valueNorm = normalizeForMatch(value)
            const matched = options.find(opt => 
              normalizeForMatch(opt) === valueNorm || valueNorm.includes(normalizeForMatch(opt).slice(0, 25))
            )
            if (matched) counts[matched]++
            else counts['Other']++
            break // Found in this variant, don't check others
          }
        }
      }
      
      if (foundValue) respondentCount++
    })
    
    counts['No response'] = totalRespondents - respondentCount
    return { counts, respondentCount }
  }
  
  // Get follow-up data based on dimension
  const followupData: Record<string, { counts: Record<string, number>, respondentCount: number }> = {}
  
  if (dimKey === 'd1') {
    followupData['d1aa'] = countWithVariants('dimension1_data', ['d1aa', 'D1aa'], 
      ['Generally consistent across all locations', 'Vary across locations', 'Only available in select locations'])
    followupData['d1_1_usa'] = countWithVariants('dimension1_data', ['d1_1_usa'], ORDINAL_OPTIONS.paidLeaveDuration)
    followupData['d1_1_non_usa'] = countWithVariants('dimension1_data', ['d1_1_non_usa'], ORDINAL_OPTIONS.paidLeaveDuration)
    followupData['d1_2_usa'] = countWithVariants('dimension1_data', ['d1_2_usa'], ORDINAL_OPTIONS.intermittentLeaveDuration)
    followupData['d1_2_non_usa'] = countWithVariants('dimension1_data', ['d1_2_non_usa'], ORDINAL_OPTIONS.intermittentLeaveDuration)
    followupData['d1_4b'] = countWithVariants('dimension1_data', ['d1_4b'], ORDINAL_OPTIONS.partTimeDuration)
    followupData['d1_5_usa'] = countWithVariants('dimension1_data', ['d1_5_usa'], ORDINAL_OPTIONS.jobProtectionDuration)
    followupData['d1_5_non_usa'] = countWithVariants('dimension1_data', ['d1_5_non_usa'], ORDINAL_OPTIONS.jobProtectionDuration)
    followupData['d1_6'] = countWithVariants('dimension1_data', ['d1_6'], DIMENSION_FOLLOWUPS.d1.d1_6, true)
  } else if (dimKey === 'd3') {
    followupData['d3_1a'] = countWithVariants('dimension3_data', ['d3_1a', 'd31a', 'D3_1a'], DIMENSION_FOLLOWUPS.d3.d3_1a)
    followupData['d3_1'] = countWithVariants('dimension3_data', ['d3_1', 'd31', 'D3_1'], ORDINAL_OPTIONS.trainingCompletion)
  } else if (dimKey === 'd4') {
    followupData['d4_1a'] = countWithVariants('dimension4_data', ['d4_1a', 'd41a', 'D4_1a'], DIMENSION_FOLLOWUPS.d4.d4_1a, true)
    followupData['d4_1b'] = countWithVariants('dimension4_data', ['d4_1b', 'd41b', 'D4_1b'], DIMENSION_FOLLOWUPS.d4.d4_1b, true)
  } else if (dimKey === 'd6') {
    followupData['d6_2'] = countWithVariants('dimension6_data', ['d6_2', 'd62', 'D6_2'], DIMENSION_FOLLOWUPS.d6.d6_2, true)
  } else if (dimKey === 'd11') {
    followupData['d11_1'] = countWithVariants('dimension11_data', ['d11_1', 'd111', 'D11_1'], DIMENSION_FOLLOWUPS.d11.d11_1, true)
  } else if (dimKey === 'd12') {
    followupData['d12_1'] = countWithVariants('dimension12_data', ['d12_1', 'd121', 'D12_1'], DIMENSION_FOLLOWUPS.d12.d12_1)
    followupData['d12_2'] = countWithVariants('dimension12_data', ['d12_2', 'd122', 'D12_2'], DIMENSION_FOLLOWUPS.d12.d12_2)
  } else if (dimKey === 'd13') {
    followupData['d13_1'] = countWithVariants('dimension13_data', ['d13_1', 'd131', 'D13_1'], ORDINAL_OPTIONS.communicationFrequency)
  }
  
  // Geographic consistency for all dimensions (dXaa) - check multiple variants
  const geoConsistencyOptions = ['Generally consistent across all locations', 'Vary across locations', 'Only available in select locations']
  const geoResult = countWithVariants(config.dataKey, [`d${dimNum}aa`, `D${dimNum}aa`, `d${dimNum}_aa`], geoConsistencyOptions)
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-3">
          <h3 className="text-white font-bold">
            Dimension {dimNum}: {config.name}
          </h3>
          <p className="text-orange-200 text-xs">{totalRespondents} respondents</p>
        </div>
        
        {/* Main Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700 w-1/3">Program/Item</th>
                <th className="text-center p-3 font-semibold text-green-700 w-1/9">Currently Offer</th>
                <th className="text-center p-3 font-semibold text-blue-700 w-1/9">Planning/Dev</th>
                <th className="text-center p-3 font-semibold text-yellow-700 w-1/9">Assessing</th>
                <th className="text-center p-3 font-semibold text-red-700 w-1/9">Not Able</th>
                <th className="text-center p-3 font-semibold text-purple-700 w-1/9">Unsure</th>
                <th className="text-center p-3 font-semibold text-gray-500 w-1/9">No Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {config.items.map((item, idx) => {
                const data = dimensionData[item]
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 text-gray-800">{item}</td>
                    <CellWithPct count={data['Currently offer']} total={totalRespondents} color="green" />
                    <CellWithPct count={data['In active planning / development']} total={totalRespondents} color="blue" />
                    <CellWithPct count={data['Assessing feasibility']} total={totalRespondents} color="yellow" />
                    <CellWithPct count={data['Not able to offer in foreseeable future']} total={totalRespondents} color="red" />
                    <CellWithPct count={data['Unsure']} total={totalRespondents} color="purple" />
                    <CellWithPct count={data['No response']} total={totalRespondents} color="gray" />
                  </tr>
                )
              })}
            </tbody>
          </table>
          {/* Footnote if present */}
          {(config as any).footnote && (
            <p className="text-xs text-gray-500 italic mt-2 px-3">{(config as any).footnote}</p>
          )}
        </div>
        
        {/* Follow-up Questions */}
        <div className="p-5 border-t border-gray-200 space-y-4">
          <h4 className="font-semibold text-gray-800">Follow-up Questions</h4>
          
          {/* Geographic Consistency - only for multi-country orgs */}
          {geoResult.respondentCount > 0 && (
            <DataTable 
              title={`D${dimNum}.aa: Geographic Consistency (n=${geoResult.respondentCount})`} 
              data={geoResult.counts} 
              total={geoResult.respondentCount}
              excludeNoResponse
            />
          )}
          {geoResult.respondentCount === 0 && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
              D{dimNum}.aa: No respondents answered geographic consistency question (only asked for multi-country operations)
            </div>
          )}
          
          {/* D1 Follow-ups */}
          {dimKey === 'd1' && (
            <div className="grid md:grid-cols-2 gap-4">
              {followupData['d1_1_usa']?.respondentCount > 0 && (
                <DataTable 
                  title={`D1.1: Additional Paid Medical Leave - USA (n=${followupData['d1_1_usa'].respondentCount})`}
                  data={followupData['d1_1_usa'].counts} 
                  total={followupData['d1_1_usa'].respondentCount}
                  orderedOptions={ORDINAL_OPTIONS.paidLeaveDuration}
                  excludeNoResponse
                  filterNote="Asked if D1.a = Currently offer Paid medical leave"
                />
              )}
              {followupData['d1_1_non_usa']?.respondentCount > 0 && (
                <DataTable 
                  title={`D1.1: Additional Paid Medical Leave - Non-USA (n=${followupData['d1_1_non_usa'].respondentCount})`}
                  data={followupData['d1_1_non_usa'].counts} 
                  total={followupData['d1_1_non_usa'].respondentCount}
                  orderedOptions={ORDINAL_OPTIONS.paidLeaveDuration}
                  excludeNoResponse
                  filterNote="Asked if D1.a = Currently offer Paid medical leave"
                />
              )}
              {followupData['d1_2_usa']?.respondentCount > 0 && (
                <DataTable 
                  title={`D1.2: Additional Intermittent Leave - USA (n=${followupData['d1_2_usa'].respondentCount})`}
                  data={followupData['d1_2_usa'].counts} 
                  total={followupData['d1_2_usa'].respondentCount}
                  orderedOptions={ORDINAL_OPTIONS.intermittentLeaveDuration}
                  excludeNoResponse
                  filterNote="Asked if D1.a = Currently offer Intermittent leave"
                />
              )}
              {followupData['d1_2_non_usa']?.respondentCount > 0 && (
                <DataTable 
                  title={`D1.2: Additional Intermittent Leave - Non-USA (n=${followupData['d1_2_non_usa'].respondentCount})`}
                  data={followupData['d1_2_non_usa'].counts} 
                  total={followupData['d1_2_non_usa'].respondentCount}
                  orderedOptions={ORDINAL_OPTIONS.intermittentLeaveDuration}
                  excludeNoResponse
                  filterNote="Asked if D1.a = Currently offer Intermittent leave"
                />
              )}
              {followupData['d1_4b']?.respondentCount > 0 && (
                <DataTable 
                  title={`D1.4b: Part-Time with Full Benefits Duration (n=${followupData['d1_4b'].respondentCount})`}
                  data={followupData['d1_4b'].counts} 
                  total={followupData['d1_4b'].respondentCount}
                  orderedOptions={ORDINAL_OPTIONS.partTimeDuration}
                  excludeNoResponse
                  filterNote="Asked if D1.a = Currently offer Reduced schedule/part-time"
                />
              )}
              {followupData['d1_5_usa']?.respondentCount > 0 && (
                <DataTable 
                  title={`D1.5: Job Protection Beyond Legal - USA (n=${followupData['d1_5_usa'].respondentCount})`}
                  data={followupData['d1_5_usa'].counts} 
                  total={followupData['d1_5_usa'].respondentCount}
                  orderedOptions={ORDINAL_OPTIONS.jobProtectionDuration}
                  excludeNoResponse
                  filterNote="Asked if D1.a = Currently offer Job protection"
                />
              )}
              {followupData['d1_5_non_usa']?.respondentCount > 0 && (
                <DataTable 
                  title={`D1.5: Job Protection Beyond Legal - Non-USA (n=${followupData['d1_5_non_usa'].respondentCount})`}
                  data={followupData['d1_5_non_usa'].counts} 
                  total={followupData['d1_5_non_usa'].respondentCount}
                  orderedOptions={ORDINAL_OPTIONS.jobProtectionDuration}
                  excludeNoResponse
                  filterNote="Asked if D1.a = Currently offer Job protection"
                />
              )}
              {followupData['d1_6']?.respondentCount > 0 && (
                <DataTable 
                  title={`D1.6: Disability Pay Enhancement (n=${followupData['d1_6'].respondentCount})`}
                  data={followupData['d1_6'].counts} 
                  total={followupData['d1_6'].respondentCount}
                  isMultiSelect
                  excludeNoResponse
                  filterNote="Asked if D1.a = Currently offer Disability pay top-up"
                />
              )}
            </div>
          )}
          
          {/* D3 Follow-ups */}
          {dimKey === 'd3' && (
            <div className="grid md:grid-cols-2 gap-4">
              {followupData['d3_1a']?.respondentCount > 0 && (
                <DataTable 
                  title={`D3.1a: Is Manager Training Mandatory? (n=${followupData['d3_1a'].respondentCount})`}
                  data={followupData['d3_1a'].counts} 
                  total={followupData['d3_1a'].respondentCount}
                  excludeNoResponse
                  filterNote="Asked if any training selected in D3.a"
                />
              )}
              {followupData['d3_1']?.respondentCount > 0 && (
                <DataTable 
                  title={`D3.1: Manager Training Completion Rate (n=${followupData['d3_1'].respondentCount})`}
                  data={followupData['d3_1'].counts} 
                  total={followupData['d3_1'].respondentCount}
                  orderedOptions={ORDINAL_OPTIONS.trainingCompletion}
                  excludeNoResponse
                  filterNote="Asked if any training selected in D3.a"
                />
              )}
            </div>
          )}
          
          {/* D4 Follow-ups */}
          {dimKey === 'd4' && (
            <div className="grid md:grid-cols-2 gap-4">
              {followupData['d4_1a']?.respondentCount > 0 && (
                <DataTable 
                  title={`D4.1a: Who Provides Navigation Support? (n=${followupData['d4_1a'].respondentCount})`}
                  data={followupData['d4_1a'].counts} 
                  total={followupData['d4_1a'].respondentCount}
                  isMultiSelect
                  excludeNoResponse
                  filterNote="Asked if D4.a = Currently offer Navigation support"
                />
              )}
              {followupData['d4_1b']?.respondentCount > 0 && (
                <DataTable 
                  title={`D4.1b: Navigation Services Available (n=${followupData['d4_1b'].respondentCount})`}
                  data={followupData['d4_1b'].counts} 
                  total={followupData['d4_1b'].respondentCount}
                  isMultiSelect
                  excludeNoResponse
                  filterNote="Asked if D4.a = Currently offer Navigation support"
                />
              )}
            </div>
          )}
          
          {/* D6 Follow-ups */}
          {dimKey === 'd6' && followupData['d6_2']?.respondentCount > 0 && (
            <DataTable 
              title={`D6.2: How Do You Measure Psychological Safety? (n=${followupData['d6_2'].respondentCount})`}
              data={followupData['d6_2'].counts} 
              total={followupData['d6_2'].respondentCount}
              isMultiSelect
              excludeNoResponse
              filterNote="Asked if any culture initiative selected in D6.a"
            />
          )}
          {dimKey === 'd6' && (!followupData['d6_2'] || followupData['d6_2'].respondentCount === 0) && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
              D6.2: No respondents answered this follow-up question
            </div>
          )}
          
          {/* D11 Follow-ups - Screening Services */}
          {dimKey === 'd11' && followupData['d11_1']?.respondentCount > 0 && (
            <DataTable 
              title={`D11.1: Screening/Preventive Services Covered at 100% (n=${followupData['d11_1'].respondentCount})`}
              data={followupData['d11_1'].counts} 
              total={followupData['d11_1'].respondentCount}
              isMultiSelect
              excludeNoResponse
              filterNote="Asked if D11.a = Currently offer 70%+ coverage for screenings"
            />
          )}
          {dimKey === 'd11' && (!followupData['d11_1'] || followupData['d11_1'].respondentCount === 0) && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
              D11.1: No respondents answered this follow-up question (asked only if 70%+ coverage selected)
            </div>
          )}
          
          {/* D12 Follow-ups - Continuous Improvement */}
          {dimKey === 'd12' && (
            <div className="grid md:grid-cols-2 gap-4">
              {followupData['d12_1']?.respondentCount > 0 && (
                <DataTable 
                  title={`D12.1: Review Individual Employee Experiences? (n=${followupData['d12_1'].respondentCount})`}
                  data={followupData['d12_1'].counts} 
                  total={followupData['d12_1'].respondentCount}
                  excludeNoResponse
                  filterNote="Asked if any metric tracked in D12.a"
                />
              )}
              {followupData['d12_2']?.respondentCount > 0 && (
                <DataTable 
                  title={`D12.2: Have Experiences Led to Changes? (n=${followupData['d12_2'].respondentCount})`}
                  data={followupData['d12_2'].counts} 
                  total={followupData['d12_2'].respondentCount}
                  excludeNoResponse
                  filterNote="Asked if any metric tracked in D12.a"
                />
              )}
              {(!followupData['d12_1'] || followupData['d12_1'].respondentCount === 0) && 
               (!followupData['d12_2'] || followupData['d12_2'].respondentCount === 0) && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500 md:col-span-2">
                  D12.1-2: No respondents answered these follow-up questions (asked only if metrics tracked)
                </div>
              )}
            </div>
          )}
          
          {/* D13 Follow-ups */}
          {dimKey === 'd13' && followupData['d13_1']?.respondentCount > 0 && (
            <DataTable 
              title={`D13.1: Communication Frequency (n=${followupData['d13_1'].respondentCount})`}
              data={followupData['d13_1'].counts} 
              total={followupData['d13_1'].respondentCount}
              orderedOptions={ORDINAL_OPTIONS.communicationFrequency}
              excludeNoResponse
            />
          )}
          {dimKey === 'd13' && (!followupData['d13_1'] || followupData['d13_1'].respondentCount === 0) && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
              D13.1: No respondents answered this follow-up question
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CrossDimensionalSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalRespondents = assessments.length
  
  // CD data can be in cross_dimensional_data or employee_impact_data
  // Count cd1a from both sources
  const cd1aCounts: Record<string, number> = {}
  CROSS_DIMENSIONAL_OPTIONS.dimensions.forEach(d => cd1aCounts[d] = 0)
  
  const cd1bCounts: Record<string, number> = {}
  CROSS_DIMENSIONAL_OPTIONS.dimensions.forEach(d => cd1bCounts[d] = 0)
  
  const cd2Counts: Record<string, number> = {}
  CROSS_DIMENSIONAL_OPTIONS.cd2Challenges.forEach(c => cd2Counts[c] = 0)
  
  assessments.forEach(a => {
    // Try cross_dimensional_data first, then employee_impact_data
    let cd1aValues = parseJsonArray(a.cross_dimensional_data, 'cd1a')
    if (cd1aValues.length === 0) {
      cd1aValues = parseJsonArray(a.employee_impact_data, 'cd1a')
    }
    cd1aValues.forEach(v => {
      const vStr = String(v)
      if (cd1aCounts[vStr] !== undefined) {
        cd1aCounts[vStr]++
      } else {
        // Partial match
        const matched = CROSS_DIMENSIONAL_OPTIONS.dimensions.find(d => 
          vStr.toLowerCase().includes(d.toLowerCase().slice(0, 15)) ||
          d.toLowerCase().includes(vStr.toLowerCase().slice(0, 15))
        )
        if (matched) cd1aCounts[matched]++
      }
    })
    
    let cd1bValues = parseJsonArray(a.cross_dimensional_data, 'cd1b')
    if (cd1bValues.length === 0) {
      cd1bValues = parseJsonArray(a.employee_impact_data, 'cd1b')
    }
    cd1bValues.forEach(v => {
      const vStr = String(v)
      if (cd1bCounts[vStr] !== undefined) {
        cd1bCounts[vStr]++
      } else {
        const matched = CROSS_DIMENSIONAL_OPTIONS.dimensions.find(d => 
          vStr.toLowerCase().includes(d.toLowerCase().slice(0, 15)) ||
          d.toLowerCase().includes(vStr.toLowerCase().slice(0, 15))
        )
        if (matched) cd1bCounts[matched]++
      }
    })
    
    let cd2Values = parseJsonArray(a.cross_dimensional_data, 'cd2')
    if (cd2Values.length === 0) {
      cd2Values = parseJsonArray(a.employee_impact_data, 'cd2')
    }
    cd2Values.forEach(v => {
      const vStr = String(v)
      if (cd2Counts[vStr] !== undefined) {
        cd2Counts[vStr]++
      } else {
        const matched = CROSS_DIMENSIONAL_OPTIONS.cd2Challenges.find(c => 
          vStr.toLowerCase().includes(c.toLowerCase().slice(0, 15)) ||
          c.toLowerCase().includes(vStr.toLowerCase().slice(0, 15))
        )
        if (matched) cd2Counts[matched]++
      }
    })
  })
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3">
          <h3 className="text-white font-bold">Cross-Dimensional Assessment</h3>
          <p className="text-indigo-200 text-xs">{totalRespondents} respondents</p>
        </div>
        
        <div className="p-5 space-y-6">
          <DataTable title="CD1a: TOP 3 Dimensions for Best Outcomes (Select 3)" data={cd1aCounts} total={totalRespondents} isMultiSelect />
          <DataTable title="CD1b: BOTTOM 3 Dimensions / Lowest Priority (Select 3)" data={cd1bCounts} total={totalRespondents} isMultiSelect />
          <DataTable title="CD2: Biggest Challenges (Select up to 3)" data={cd2Counts} total={totalRespondents} isMultiSelect />
        </div>
      </div>
    </div>
  )
}

function EmployeeImpactSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalRespondents = assessments.length
  
  // EI data is in employee_impact_data (or cross_dimensional_data as fallback)
  const ei2Data = countResponses(assessments, 'employee_impact_data', 'ei2', EMPLOYEE_IMPACT_OPTIONS.ei2)
  const ei3Data = countResponses(assessments, 'employee_impact_data', 'ei3', EMPLOYEE_IMPACT_OPTIONS.ei3)
  
  // EI1 is a grid stored as 'ei1' in employee_impact_data
  const ei1Data: Record<string, Record<string, number>> = {}
  EMPLOYEE_IMPACT_OPTIONS.ei1Areas.forEach(area => {
    ei1Data[area] = {}
    EMPLOYEE_IMPACT_OPTIONS.ei1Responses.forEach(resp => ei1Data[area][resp] = 0)
    ei1Data[area]['No response'] = 0
  })
  
  assessments.forEach(a => {
    // Try employee_impact_data first, then cross_dimensional_data as fallback
    let gridData = getGridData(a.employee_impact_data, 'ei1')
    if (Object.keys(gridData).length === 0) {
      gridData = getGridData(a.cross_dimensional_data, 'ei1')
    }
    
    // Normalize gridData keys for matching (handles "Employee retention / tenure" vs "Employee retention/tenure")
    const normalizedGridData: Record<string, string> = {}
    Object.entries(gridData).forEach(([key, value]) => {
      normalizedGridData[normalizeForMatch(key)] = value
    })
    
    EMPLOYEE_IMPACT_OPTIONS.ei1Areas.forEach(area => {
      // Use normalized area name to look up response
      const areaNorm = normalizeForMatch(area)
      const response = normalizedGridData[areaNorm]
      
      if (!response) {
        ei1Data[area]['No response']++
      } else {
        // Normalize response to handle abbreviated values (e.g., "minimal" -> "Minimal positive impact")
        const responseNorm = normalizeForMatch(response)
        
        // Find matching response option
        const matchedResp = EMPLOYEE_IMPACT_OPTIONS.ei1Responses.find(r => {
          const rNorm = normalizeForMatch(r)
          return rNorm === responseNorm || 
                 rNorm.includes(responseNorm) || 
                 responseNorm.includes(rNorm.split(' ')[0]) // Match first word (e.g., "minimal" matches "minimal positive impact")
        })
        
        if (matchedResp && ei1Data[area][matchedResp] !== undefined) {
          ei1Data[area][matchedResp]++
        } else {
          ei1Data[area]['No response']++
        }
      }
    })
  })
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3">
          <h3 className="text-white font-bold">Employee Impact Assessment</h3>
          <p className="text-emerald-200 text-xs">{totalRespondents} respondents</p>
        </div>
        
        <div className="p-5 space-y-6">
          {/* EI1 Grid Table */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-3">EI1: Positive Outcomes from Support Programs</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">Outcome Area</th>
                    {EMPLOYEE_IMPACT_OPTIONS.ei1Responses.map(resp => (
                      <th key={resp} className="text-center p-2 font-semibold text-gray-700 text-xs">{resp}</th>
                    ))}
                    <th className="text-center p-2 font-semibold text-gray-500 text-xs">No Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {EMPLOYEE_IMPACT_OPTIONS.ei1Areas.map((area, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 text-gray-800">{area}</td>
                      {EMPLOYEE_IMPACT_OPTIONS.ei1Responses.map(resp => {
                        const count = ei1Data[area][resp]
                        const pct = totalRespondents > 0 ? Math.round((count / totalRespondents) * 100) : 0
                        return (
                          <td key={resp} className="text-center p-2">
                            <span className="font-bold">{count}</span>
                            <span className="text-xs text-gray-500 ml-1">({pct}%)</span>
                          </td>
                        )
                      })}
                      <td className="text-center p-2 text-gray-500">
                        <span className="font-bold">{ei1Data[area]['No response']}</span>
                        <span className="text-xs ml-1">({totalRespondents > 0 ? Math.round((ei1Data[area]['No response'] / totalRespondents) * 100) : 0}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <DataTableFull title="EI2: Have You Measured ROI?" data={ei2Data} total={totalRespondents} />
          <DataTableFull title="EI3: Approximate ROI Level" data={ei3Data} total={totalRespondents} orderedOptions={[
            'Negative ROI (costs exceed benefits by more than 100%)',
            'Break-even (costs and benefits are roughly equal)',
            '1.1 - 2.0x ROI (benefits are 10-100% more than costs)',
            '2.1 - 3.0x ROI (benefits are 2-3 times the costs)',
            '3.1 - 5.0x ROI (benefits are 3-5 times the costs)',
            'Greater than 5.0x ROI (benefits exceed 5 times the costs)'
          ]} filterNote="Asked if EI2 = Yes (comprehensive or basic ROI analysis completed)" />
        </div>
      </div>
    </div>
  )
}

// ============================================
// VERBATIM COMMENTS TAB COMPONENT
// ============================================
const VERBATIM_QUESTIONS = [
  { 
    id: 'or2b', 
    name: 'OR2b: Most Impactful Change',
    description: 'What has been the single most impactful change your organization has made?',
    dataKey: 'current_support_data',
    field: 'or2b'
  },
  { 
    id: 'ei4', 
    name: 'EI4: Advice to HR Leaders',
    description: 'What advice would you give to other HR leaders?',
    dataKey: 'cross_dimensional_data',
    field: 'ei4'
  },
  { 
    id: 'ei5', 
    name: 'EI5: Aspects Not Addressed',
    description: 'Are there important aspects this survey did not address?',
    dataKey: 'employee-impact-assessment_data',
    field: 'ei5'
  },
  { id: 'd1b', name: 'D1b: Medical Leave & Flexibility - Other', dataKey: 'dimension1_data', field: 'd1b' },
  { id: 'd2b', name: 'D2b: Insurance & Financial Protection - Other', dataKey: 'dimension2_data', field: 'd2b' },
  { id: 'd3b', name: 'D3b: Manager Preparedness - Other', dataKey: 'dimension3_data', field: 'd3b' },
  { id: 'd4b', name: 'D4b: Navigation & Expert Resources - Other', dataKey: 'dimension4_data', field: 'd4b' },
  { id: 'd5b', name: 'D5b: Workplace Accommodations - Other', dataKey: 'dimension5_data', field: 'd5b' },
  { id: 'd6b', name: 'D6b: Culture & Psychological Safety - Other', dataKey: 'dimension6_data', field: 'd6b' },
  { id: 'd7b', name: 'D7b: Career Continuity - Other', dataKey: 'dimension7_data', field: 'd7b' },
  { id: 'd8b', name: 'D8b: Work Continuation & Resumption - Other', dataKey: 'dimension8_data', field: 'd8b' },
  { id: 'd9b', name: 'D9b: Executive Commitment - Other', dataKey: 'dimension9_data', field: 'd9b' },
  { id: 'd10b', name: 'D10b: Caregiver & Family Support - Other', dataKey: 'dimension10_data', field: 'd10b' },
  { id: 'd11b', name: 'D11b: Prevention & Wellness - Other', dataKey: 'dimension11_data', field: 'd11b' },
  { id: 'd12b', name: 'D12b: Continuous Improvement - Other', dataKey: 'dimension12_data', field: 'd12b' },
  { id: 'd13b', name: 'D13b: Communication & Awareness - Other', dataKey: 'dimension13_data', field: 'd13b' },
]

function VerbatimCommentsTab({ assessments }: { assessments: ProcessedAssessment[] }) {
  const [selectedQuestion, setSelectedQuestion] = useState<string>('or2b')
  
  // Get comments for selected question
  const getComments = () => {
    const question = VERBATIM_QUESTIONS.find(q => q.id === selectedQuestion)
    if (!question) return []
    
    const comments: { text: string; companyType: string; companyName: string }[] = []
    
    assessments.forEach(a => {
      const data = (a as any)[question.dataKey]
      if (!data) return
      
      let parsed: any = {}
      try {
        parsed = typeof data === 'string' ? JSON.parse(data) : data
      } catch {
        return
      }
      
      // Try different field variations
      const fieldVariations = [question.field, question.field.toUpperCase(), question.field.replace('b', '_b')]
      let value = ''
      for (const f of fieldVariations) {
        if (parsed[f]) {
          value = String(parsed[f])
          break
        }
      }
      
      // Skip empty, "none", checkbox responses, etc.
      if (!value || 
          value.toLowerCase() === 'none' || 
          value.toLowerCase() === 'n/a' ||
          value.toLowerCase() === 'na' ||
          value === 'true' ||
          value === 'false' ||
          value.length < 5) {
        return
      }
      
      comments.push({
        text: value,
        companyType: a.isPanel ? 'Panel' : a.isFoundingPartner ? 'Founding Partner' : 'Standard',
        companyName: a.company_name || 'Unknown'
      })
    })
    
    // Sort: Founding Partner first, Standard second, Panel last
    return comments.sort((a, b) => {
      const order = { 'Founding Partner': 0, 'Standard': 1, 'Panel': 2 }
      return (order[a.companyType as keyof typeof order] || 1) - (order[b.companyType as keyof typeof order] || 1)
    })
  }
  
  const comments = getComments()
  const selectedQuestionData = VERBATIM_QUESTIONS.find(q => q.id === selectedQuestion)
  
  // Group questions
  const keyQuestions = VERBATIM_QUESTIONS.slice(0, 3)
  const dimensionQuestions = VERBATIM_QUESTIONS.slice(3)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">Verbatim Comments</h2>
          <p className="text-sm text-gray-600">
            Open-ended responses from survey participants
          </p>
        </div>
        
        {/* Question Selection */}
        <div className="space-y-4">
          {/* Key Questions */}
          <div className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Open-Ended Questions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {keyQuestions.map(q => {
                const count = assessments.filter(a => {
                  const data = (a as any)[q.dataKey]
                  if (!data) return false
                  try {
                    const parsed = typeof data === 'string' ? JSON.parse(data) : data
                    const val = parsed[q.field] || parsed[q.field.toUpperCase()]
                    return val && String(val).length > 5 && !['none', 'n/a', 'na', 'true', 'false'].includes(String(val).toLowerCase())
                  } catch { return false }
                }).length
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestion(q.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      selectedQuestion === q.id
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {q.name} ({count})
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Dimension Questions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dimension "Other" Responses</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {dimensionQuestions.map(q => {
                const count = assessments.filter(a => {
                  const data = (a as any)[q.dataKey]
                  if (!data) return false
                  try {
                    const parsed = typeof data === 'string' ? JSON.parse(data) : data
                    const val = parsed[q.field] || parsed[q.field.toUpperCase()]
                    return val && String(val).length > 5 && !['none', 'n/a', 'na', 'true', 'false'].includes(String(val).toLowerCase())
                  } catch { return false }
                }).length
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestion(q.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      selectedQuestion === q.id
                        ? 'bg-orange-500 text-white shadow-sm'
                        : count > 0
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    {q.id.toUpperCase()} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Comments Display */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
          <h3 className="text-lg font-bold text-white">{selectedQuestionData?.name}</h3>
          {selectedQuestionData?.description && (
            <p className="text-sm text-orange-100 mt-1">{selectedQuestionData.description}</p>
          )}
          <p className="text-sm text-orange-200 mt-2">{comments.length} response{comments.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {comments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No responses for this question</p>
            </div>
          ) : (
            comments.map((comment, idx) => (
              <div key={idx} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                    comment.companyType === 'Panel' ? 'bg-amber-600' : comment.companyType === 'Founding Partner' ? 'bg-purple-600' : 'bg-blue-600'
                  }`}>
                    {comment.companyName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 whitespace-pre-wrap">{comment.text}</p>
                    <p className="mt-2 text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        comment.companyType === 'Panel' 
                          ? 'bg-amber-100 text-amber-800' 
                          : comment.companyType === 'Founding Partner' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {comment.companyType}
                      </span>
                      <span className="ml-2 font-medium text-gray-700">{comment.companyName}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// ANALYTICS TAB COMPONENT
// ============================================
function AnalyticsTab({ assessments }: { assessments: ProcessedAssessment[] }) {
  const [completedOnly, setCompletedOnly] = useState(false)
  const [typeFilter, setTypeFilter] = useState({ fp: true, standard: true, panel: true })
  const [activeSection, setActiveSection] = useState<string>('overview')
  
  const filteredAssessments = assessments.filter(a => {
    // Completion filter
    if (completedOnly && a.completionPercentage < 100) return false
    // Type filter
    const matchesType =
      (a.isFoundingPartner && !a.isPanel && typeFilter.fp) ||
      (!a.isFoundingPartner && !a.isPanel && typeFilter.standard) ||
      (a.isPanel && typeFilter.panel)
    return matchesType
  })
  
  const totalRespondents = filteredAssessments.length
  
  // Count by type for display
  const fpCount = assessments.filter(a => a.isFoundingPartner && !a.isPanel).length
  const standardCount = assessments.filter(a => !a.isFoundingPartner && !a.isPanel).length
  const panelCount = assessments.filter(a => a.isPanel).length
  
  // Grouped sections
  const foundationSections = [
    { id: 'overview', name: 'Overview' },
    { id: 'firmographics', name: 'Firmographics' },
    { id: 'general-benefits', name: 'General Benefits (CB1)' },
    { id: 'current-support', name: 'Current Support' },
  ]
  
  const dimensionSections = Object.entries(DIMENSION_CONFIG).map(([key, config]) => ({
    id: key,
    name: `D${key.slice(1)}: ${config.name}`
  }))
  
  const outcomeSections = [
    { id: 'cross-dimensional', name: 'Cross-Dimensional' },
    { id: 'employee-impact', name: 'Employee Impact' }
  ]
  
  const SectionButton = ({ section }: { section: { id: string, name: string } }) => (
    <button
      onClick={() => setActiveSection(section.id)}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
        activeSection === section.id
          ? 'bg-orange-500 text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {section.name}
    </button>
  )
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Aggregate Data Tables</h2>
            <p className="text-sm text-gray-600">
              Full response distributions for all survey questions ({totalRespondents} respondents)
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company Types</label>
              <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-3 py-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={typeFilter.fp}
                    onChange={() => setTypeFilter(prev => ({ ...prev, fp: !prev.fp }))}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs text-gray-700">FP ({fpCount})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={typeFilter.standard}
                    onChange={() => setTypeFilter(prev => ({ ...prev, standard: !prev.standard }))}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">Standard ({standardCount})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={typeFilter.panel}
                    onChange={() => setTypeFilter(prev => ({ ...prev, panel: !prev.panel }))}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs text-gray-700">Panel ({panelCount})</span>
                </label>
              </div>
            </div>
            {/* Completion Filter */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={completedOnly}
              onChange={(e) => setCompletedOnly(e.target.checked)}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Completed surveys only</span>
          </label>
          </div>
        </div>
        
        {/* Section Navigation - Organized */}
        <div className="space-y-4">
          {/* Survey Foundation */}
          <div className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Survey Foundation</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {foundationSections.map(section => (
                <SectionButton key={section.id} section={section} />
              ))}
            </div>
          </div>
          
          {/* 13 Dimensions */}
          <div className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">13 Dimensions of Support</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {dimensionSections.map(section => (
                <SectionButton key={section.id} section={section} />
              ))}
            </div>
          </div>
          
          {/* Assessment & Outcomes */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assessment & Outcomes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {outcomeSections.map(section => (
                <SectionButton key={section.id} section={section} />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      {activeSection === 'overview' && (
        <OverviewSection assessments={filteredAssessments} />
      )}
      
      {activeSection === 'firmographics' && (
        <FirmographicsSection assessments={filteredAssessments} />
      )}
      
      {activeSection === 'general-benefits' && (
        <GeneralBenefitsSection assessments={filteredAssessments} />
      )}
      
      {activeSection === 'current-support' && (
        <CurrentSupportSection assessments={filteredAssessments} />
      )}
      
      {activeSection.startsWith('d') && DIMENSION_CONFIG[activeSection as keyof typeof DIMENSION_CONFIG] && (
        <DimensionSection
          dimKey={activeSection}
          config={DIMENSION_CONFIG[activeSection as keyof typeof DIMENSION_CONFIG]}
          assessments={filteredAssessments}
        />
      )}
      
      {activeSection === 'cross-dimensional' && (
        <CrossDimensionalSection assessments={filteredAssessments} />
      )}
      
      {activeSection === 'employee-impact' && (
        <EmployeeImpactSection assessments={filteredAssessments} />
      )}
    </div>
  )
}

// ============================================
// MAIN ADMIN DASHBOARD COMPONENT - ORIGINAL CODE PRESERVED
// ============================================
export default function AdminDashboard() {
  const [assessments, setAssessments] = useState<ProcessedAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState({ fp: true, standard: true, panel: true })
  const [selectedAssessment, setSelectedAssessment] = useState<ProcessedAssessment | null>(null)
  const [activeTab, setActiveTab] = useState<'responses' | 'analytics' | 'verbatim'>('responses')
  
  // Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceAssessment, setInvoiceAssessment] = useState<ProcessedAssessment | null>(null)

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      // Direct Supabase query (requires "Anon can read all assessments" policy)
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const processed = (data || []).map((assessment: Assessment) => {
        const isFP = isFoundingPartner(assessment.survey_id)
        // Check BOTH survey_id AND app_id for Panel detection (Panel records may have app_id = 'PANEL-XXX')
        const isPanel = (assessment.survey_id || '').startsWith('PANEL-') || (assessment.app_id || '').startsWith('PANEL-')
        
        // 🐛 DEBUG: Log FP check results
        if (assessment.company_name?.toLowerCase().includes('merck') || 
            assessment.company_name?.toLowerCase().includes('google') ||
            assessment.company_name?.toLowerCase().includes('pfizer') ||
            assessment.company_name?.toLowerCase().includes('maven')) {
          console.log('🔍 FP Check:', {
            company: assessment.company_name,
            surveyId: assessment.survey_id,
            isFoundingPartner: isFP,
            paymentMethod: assessment.payment_method
          })
        }
        
        const completionFlags = [
          assessment.auth_completed,
          assessment.firmographics_complete,
          assessment.general_benefits_complete,
          assessment.current_support_complete,
          assessment.dimension1_complete,
          assessment.dimension2_complete,
          assessment.dimension3_complete,
          assessment.dimension4_complete,
          assessment.dimension5_complete,
          assessment.dimension6_complete,
          assessment.dimension7_complete,
          assessment.dimension8_complete,
          assessment.dimension9_complete,
          assessment.dimension10_complete,
          assessment.dimension11_complete,
          assessment.dimension12_complete,
          assessment.dimension13_complete,
          assessment.cross_dimensional_complete,
          assessment.employee_impact_complete,
        ]
        const sectionsCompleted = completionFlags.filter(Boolean).length
        const totalSections = 19
        const completionPercentage = Math.round((sectionsCompleted / totalSections) * 100)
        
        let status = 'Not Started'
        if (completionPercentage >= 100) status = 'Completed'
        else if (completionPercentage > 0) status = 'In Progress'

        const daysInProgress = Math.floor(
          (new Date().getTime() - new Date(assessment.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        return {
          ...assessment,
          isFoundingPartner: isFP,
          isPanel: isPanel,
          status,
          completionPercentage,
          sectionsCompleted,
          totalSections,
          daysInProgress,
        }
      })

      setAssessments(processed)
    } catch (error) {
      console.error('Error fetching assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle invoice viewing
  const handleViewInvoice = async (assessment: ProcessedAssessment) => {
    setInvoiceAssessment(assessment)
    setShowInvoiceModal(true)
  }

  // Handle invoice download
  const handleDownloadInvoice = async () => {
    if (!invoiceAssessment) return

    const firm = invoiceAssessment.firmographics_data || {}
    
    const invoiceData: InvoiceData = {
      invoiceNumber: invoiceAssessment.survey_id || invoiceAssessment.id,
      invoiceDate: invoiceAssessment.payment_date 
        ? new Date(invoiceAssessment.payment_date).toLocaleDateString('en-US')
        : new Date(invoiceAssessment.created_at).toLocaleDateString('en-US'),
      dueDate: invoiceAssessment.payment_date 
        ? new Date(new Date(invoiceAssessment.payment_date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US')
        : new Date(new Date(invoiceAssessment.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
      companyName: invoiceAssessment.company_name || firm.companyName || 'Company',
      contactName: `${firm.firstName || ''} ${firm.lastName || ''}`.trim() || 'Contact',
      title: firm.title || firm.titleOther || undefined,
      addressLine1: firm.addressLine1 || '123 Main St',
      addressLine2: firm.addressLine2 || undefined,
      city: firm.city || 'City',
      state: firm.state || 'ST',
      zipCode: firm.zipCode || '00000',
      country: firm.country || 'United States',
      poNumber: firm.poNumber || undefined,
      isFoundingPartner: isFoundingPartner(invoiceAssessment.survey_id || '')
    }

    await downloadInvoicePDF(invoiceData)
  }

  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch =
      !searchTerm ||
      a.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.survey_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.app_id?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && a.status === 'Completed') ||
      (statusFilter === 'in-progress' && a.status === 'In Progress') ||
      (statusFilter === 'not-started' && a.status === 'Not Started')

    const matchesType =
      (a.isFoundingPartner && !a.isPanel && typeFilter.fp) ||
      (!a.isFoundingPartner && !a.isPanel && typeFilter.standard) ||
      (a.isPanel && typeFilter.panel)

   return matchesSearch && matchesStatus && matchesType
  }).sort((a, b) => {
    // Sort: FP first, then Standard, then Panel at end
    if (a.isPanel && !b.isPanel) return 1;
    if (!a.isPanel && b.isPanel) return -1;
    // Within same category, sort by updated_at (most recent first)
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  })

  const stats = {
    foundingStarted: assessments.filter((a) => a.isFoundingPartner && !a.isPanel).length,
    foundingCompleted: assessments.filter((a) => a.isFoundingPartner && !a.isPanel && a.completionPercentage >= 100).length,
    standardStarted: assessments.filter((a) => !a.isFoundingPartner && !a.isPanel).length,
    standardCompleted: assessments.filter((a) => !a.isFoundingPartner && !a.isPanel && a.completionPercentage >= 100).length,
    panelStarted: assessments.filter((a) => a.isPanel).length,
    panelCompleted: assessments.filter((a) => a.isPanel && a.completionPercentage >= 100).length,
    totalRevenue: assessments.reduce((sum, a) => {
      if (a.isPanel) return sum // Panel doesn't contribute to revenue
      if (a.isFoundingPartner) return sum + 1250
      if (a.payment_completed) return sum + 1250
      return sum
    }, 0),
    paidSurveys: assessments.filter((a) => !a.isFoundingPartner && !a.isPanel && a.payment_completed).length,
    fpSponsored: assessments.filter((a) => a.isFoundingPartner && !a.isPanel).length,
    avgCompletion: Math.round(
      assessments.reduce((sum, a) => sum + a.completionPercentage, 0) / (assessments.length || 1)
    ),
    avgDays: Math.round(
      assessments.filter((a) => a.completionPercentage >= 100)
        .reduce((sum, a) => sum + a.daysInProgress, 0) /
        (assessments.filter((a) => a.completionPercentage >= 100).length || 1)
    ),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 text-sm">Loading assessment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-12 brightness-0 invert" />
              <div className="h-10 w-px bg-slate-600"></div>
              <div>
                <h1 className="text-xl font-bold text-white">Survey Administration Dashboard</h1>
                <p className="text-sm text-slate-400">Best Companies for Working with Cancer Initiative • 2026</p>
              </div>
            </div>
            <a
              href="/admin/scoring"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg hover:from-cyan-600 hover:to-cyan-700 transition-all flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Best Companies Scoring
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Founding Partners</p>
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.foundingStarted}</p>
            <p className="text-sm text-slate-500 mt-1">{stats.foundingCompleted} completed</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Standard Participants</p>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.standardStarted}</p>
            <p className="text-sm text-slate-500 mt-1">{stats.standardCompleted} completed</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Panel Data</p>
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.panelStarted}</p>
            <p className="text-sm text-slate-500 mt-1">{stats.panelCompleted} completed</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Revenue</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">${(stats.totalRevenue / 1000).toFixed(1)}K</p>
            <p className="text-sm text-slate-500 mt-1">{stats.paidSurveys} paid • {stats.fpSponsored} FP sponsored</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg Completion</p>
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats.avgCompletion}%</p>
            <p className="text-sm text-slate-500 mt-1">Avg {stats.avgDays} days to complete</p>
          </div>
        </div>

        {/* TAB TOGGLE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('responses')}
              className={`flex-1 py-3.5 text-center font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${
                activeTab === 'responses'
                  ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Company Profiles ({filteredAssessments.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-3.5 text-center font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${
                activeTab === 'analytics'
                  ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Aggregate Summaries
            </button>
            <button
              onClick={() => setActiveTab('verbatim')}
              className={`flex-1 py-3.5 text-center font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${
                activeTab === 'verbatim'
                  ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Verbatim Comments
            </button>
          </div>
        </div>

        {/* RESPONSES TAB - ORIGINAL CODE */}
        {activeTab === 'responses' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">SEARCH</label>
                  <input
                    type="text"
                    placeholder="Company, name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">STATUS</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="not-started">Not Started</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">COMPANY TYPES</label>
                  <div className="flex items-center gap-4 bg-white border border-gray-300 rounded-lg px-3 py-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={typeFilter.fp}
                        onChange={() => setTypeFilter(prev => ({ ...prev, fp: !prev.fp }))}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="flex items-center gap-1.5 text-sm text-gray-700">
                        <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span>
                        FP
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={typeFilter.standard}
                        onChange={() => setTypeFilter(prev => ({ ...prev, standard: !prev.standard }))}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex items-center gap-1.5 text-sm text-gray-700">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
                        Standard
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={typeFilter.panel}
                        onChange={() => setTypeFilter(prev => ({ ...prev, panel: !prev.panel }))}
                        className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="flex items-center gap-1.5 text-sm text-gray-700">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                        Panel
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredAssessments.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{assessments.length}</span> responses
                </p>
                <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">
                  Export to Excel
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Started</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Last Updated</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-slate-50/50 transition">
                      {/* Company */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                            assessment.isPanel ? 'bg-amber-600' : assessment.isFoundingPartner ? 'bg-purple-600' : 'bg-blue-600'
                          }`}>
                            {(assessment.company_name || 'NA').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{assessment.company_name || 'N/A'}</p>
                            <p className="text-xs text-gray-600 truncate">
                              {assessment.firmographics_data?.firstName} {assessment.firmographics_data?.lastName}
                              {(assessment.firmographics_data?.title || assessment.firmographics_data?.s5) && (
                                <span className="text-gray-400"> • {assessment.firmographics_data?.title || assessment.firmographics_data?.s5}</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{assessment.email}</p>
                            <p className="text-xs text-gray-400 font-mono truncate">{assessment.survey_id || assessment.app_id || 'No ID'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        {assessment.isPanel ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Panel
                          </span>
                        ) : assessment.isFoundingPartner ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Founding
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Standard
                          </span>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        {assessment.isPanel ? (
                          <span className="text-xs font-medium text-amber-700">Panel</span>
                        ) : assessment.isFoundingPartner ? (
                          <span className="text-xs font-medium text-purple-700">FP Comp</span>
                        ) : assessment.payment_completed ? (
                          <span className="text-xs font-medium text-green-700">
                            Paid - {assessment.payment_method || 'invoice'}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-red-700">Unpaid</span>
                        )}
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-3">
                        <div className="w-48">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold ${
                              assessment.status === 'Completed' ? 'text-green-700' :
                              assessment.status === 'In Progress' ? 'text-blue-700' : 'text-gray-500'
                            }`}>
                              {assessment.status}
                            </span>
                            <span className="text-xs font-semibold text-gray-700">{assessment.completionPercentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                assessment.completionPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                              }`}
                              style={{ width: `${assessment.completionPercentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{assessment.sectionsCompleted}/{assessment.totalSections} sections</p>
                        </div>
                      </td>

                      {/* Started */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-900">
                            {new Date(assessment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500">{assessment.daysInProgress}d ago</p>
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-900">
                            {new Date(assessment.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(assessment.updated_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            onClick={() => setSelectedAssessment(assessment)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition w-full"
                          >
                            View Details
                          </button>
                          
                          {assessment.payment_completed && assessment.payment_method === 'invoice' && (
                            <button
                              onClick={() => handleViewInvoice(assessment)}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition w-full flex items-center justify-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAssessments.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No responses found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <AnalyticsTab assessments={assessments} />
        )}

        {/* VERBATIM COMMENTS TAB */}
        {activeTab === 'verbatim' && (
          <VerbatimCommentsTab assessments={assessments} />
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedAssessment && (
        <DetailedResponseView
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}

      {/* INVOICE MODAL */}
      {showInvoiceModal && invoiceAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Company Invoice</h2>
              <button
                onClick={() => {
                  setShowInvoiceModal(false)
                  setInvoiceAssessment(null)
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Invoice Available</h3>
                <p className="text-gray-600 mb-1">
                  {invoiceAssessment.company_name}
                </p>
                <p className="text-sm text-gray-500">
                  Invoice #{invoiceAssessment.survey_id || invoiceAssessment.id}
                </p>
                {invoiceAssessment.payment_date && (
                  <p className="text-sm text-gray-500">
                    Date: {new Date(invoiceAssessment.payment_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadInvoice}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Invoice PDF
                </button>

                <p className="text-center text-sm text-gray-500">
                  This is the official invoice that was generated during payment.
                </p>
              </div>
            </div>

            <div className="border-t p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setShowInvoiceModal(false)
                  setInvoiceAssessment(null)
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

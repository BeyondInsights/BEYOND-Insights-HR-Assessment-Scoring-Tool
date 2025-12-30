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
    gridField: 'd1aGrid',
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
    gridField: 'd2aGrid',
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
    gridField: 'd3aGrid',
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
    gridField: 'd4aGrid',
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
    gridField: 'd5aGrid',
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
    gridField: 'd6aGrid',
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
    gridField: 'd7aGrid',
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
    gridField: 'd8aGrid',
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
    gridField: 'd9aGrid',
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
    gridField: 'd10aGrid',
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
    gridField: 'd11aGrid',
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
    gridField: 'd12aGrid',
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
    gridField: 'd13aGrid',
    items: [
      'Proactive communication at point of diagnosis disclosure',
      'Dedicated program website or portal',
      'Regular company-wide awareness campaigns (at least quarterly)',
      'New hire orientation coverage',
      'Manager toolkit for cascade communications',
      'Employee testimonials/success stories',
      'Multi-channel communication strategy',
      'Family/caregiver communication inclusion',
      'Anonymous information access options'
    ]
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
    'At this time, we primarily focus on meeting legal compliance requirements',
    'Not yet, but actively exploring options'
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
    'Developing approach: Currently building our programs',
    'Legal minimum only: Meet legal requirements only (FMLA, ADA)',
    'Moderate support: Some programs beyond legal requirements',
    'Enhanced support: Meaningful programs beyond legal minimums',
    'Comprehensive support: Extensive programs well beyond legal requirements'
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
    'Other (specify)'
  ],
  or3: [
    'Budget constraints',
    'Lack of executive support',
    'Small number of cases doesn\'t justify investment',
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
    'Remote work options',
    'Paid caregiver leave',
    'Unpaid leave with job protection',
    'Employee assistance program (EAP) counseling',
    'Caregiver support groups',
    'Referrals to eldercare/dependent care resources',
    'Financial assistance or subsidies',
    'Respite care coverage',
    'Modified job duties/reduced workload',
    'Manager training on supporting caregivers',
    'Emergency dependent care when regular arrangements unavailable',
    'Legal/financial planning resources',
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
// FIRMOGRAPHICS OPTIONS - FULL TEXT
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
    'Media & Publishing (TV, Radio, Digital, News, Streaming)',
    'Professional & Business Services (Legal, Consulting, Accounting, Marketing)',
    'Real Estate and Rental and Leasing',
    'Scientific & Technical Services (Engineering, R&D, Architecture, Labs)',
    'IT Services & Technology Consulting',
    'Software & Technology Products',
    'Social Media & Digital Platforms',
    'Telecommunications & Internet Services',
    'Government / Public Administration',
    'Non-profit/NGO',
    'Other industry / Services (specify)'
  ],
  c4Revenue: [
    'Less than $10 million',
    '$10-49 million',
    '$50-99 million',
    '$100-499 million',
    '$500-999 million',
    '$1 billion or more',
    'Not applicable (non-profit/government)'
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
  c6RemoteWork: [
    'Fully flexible - Most roles can be remote/hybrid by employee choice',
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
    'Employees in certain countries/regions',
    'Employees below certain tenure',
    'Certain job levels/categories',
    'None - all employees eligible',
    'Some other employee group (specify)'
  ]
}

// ============================================
// ANALYTICS HELPER FUNCTIONS
// ============================================
function parseJsonField(data: any, field: string): string {
  if (!data) return 'Not provided'
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return parsed[field] || 'Not provided'
  } catch {
    return 'Not provided'
  }
}

function parseJsonArray(data: any, field: string): string[] {
  if (!data) return []
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return Array.isArray(parsed[field]) ? parsed[field] : []
  } catch {
    return []
  }
}

function getGridData(data: any, gridField: string): Record<string, string> {
  if (!data) return {}
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    const grid = parsed[gridField]
    return typeof grid === 'object' && grid !== null ? grid : {}
  } catch {
    return {}
  }
}

function countResponses(assessments: ProcessedAssessment[], dataKey: string, field: string, options: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  options.forEach(opt => counts[opt] = 0)
  counts['Other'] = 0
  counts['No response'] = 0
  
  assessments.forEach(a => {
    const value = parseJsonField((a as any)[dataKey], field)
    if (value === 'Not provided' || !value) {
      counts['No response']++
    } else if (counts[value] !== undefined) {
      counts[value]++
    } else {
      // Try partial match
      const matchedOpt = options.find(opt => 
        value.toLowerCase().includes(opt.toLowerCase().slice(0, 20)) ||
        opt.toLowerCase().includes(value.toLowerCase().slice(0, 20))
      )
      if (matchedOpt) {
        counts[matchedOpt]++
      } else {
        counts['Other']++
      }
    }
  })
  
  return counts
}

function countMultiSelect(assessments: ProcessedAssessment[], dataKey: string, field: string, options: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  options.forEach(opt => counts[opt] = 0)
  
  assessments.forEach(a => {
    const values = parseJsonArray((a as any)[dataKey], field)
    values.forEach(v => {
      if (counts[v] !== undefined) {
        counts[v]++
      } else {
        // Try partial match
        const matchedOpt = options.find(opt => 
          v.toLowerCase().includes(opt.toLowerCase().slice(0, 20)) ||
          opt.toLowerCase().includes(v.toLowerCase().slice(0, 20))
        )
        if (matchedOpt) {
          counts[matchedOpt]++
        }
      }
    })
  })
  
  return counts
}

function countDimensionResponses(assessments: ProcessedAssessment[], config: typeof DIMENSION_CONFIG.d1): Record<string, Record<string, number>> {
  const results: Record<string, Record<string, number>> = {}
  
  config.items.forEach(item => {
    results[item] = {
      'Currently offer': 0,
      'In active planning / development': 0,
      'Assessing feasibility': 0,
      'Not able to offer in foreseeable future': 0,
      'Unsure': 0,
      'No response': 0
    }
  })
  
  assessments.forEach(a => {
    const gridData = getGridData((a as any)[config.dataKey], config.gridField)
    
    config.items.forEach(item => {
      const response = gridData[item]
      if (!response) {
        results[item]['No response']++
      } else if (results[item][response] !== undefined) {
        results[item][response]++
      } else {
        // Try partial match for response
        const matchedResponse = Object.keys(results[item]).find(r => 
          response.toLowerCase().includes(r.toLowerCase().slice(0, 15))
        )
        if (matchedResponse) {
          results[item][matchedResponse]++
        } else {
          results[item]['No response']++
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
  isMultiSelect = false 
}: { 
  title: string
  data: Record<string, number>
  total: number
  isMultiSelect?: boolean 
}) {
  const sorted = Object.entries(data)
    .filter(([key]) => key !== 'No response' && key !== 'Other')
    .sort((a, b) => b[1] - a[1])
  
  const noResponseCount = data['No response'] || 0
  const otherCount = data['Other'] || 0
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b">
        <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
        {isMultiSelect && (
          <p className="text-xs text-gray-500">Multi-select - percentages may exceed 100%</p>
        )}
      </div>
      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
        {sorted.map(([key, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="flex-1 text-xs text-gray-700 truncate" title={key}>{key}</div>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="w-16 text-right">
                <span className="font-bold text-gray-800 text-sm">{count}</span>
                <span className="text-gray-500 text-xs ml-1">({pct}%)</span>
              </div>
            </div>
          )
        })}
        {otherCount > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t">
            <div className="flex-1 text-xs text-gray-500 truncate">Other</div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gray-400 rounded-full"
                style={{ width: `${Math.min(Math.round((otherCount / total) * 100), 100)}%` }}
              />
            </div>
            <div className="w-16 text-right">
              <span className="font-bold text-gray-500 text-sm">{otherCount}</span>
              <span className="text-gray-400 text-xs ml-1">({total > 0 ? Math.round((otherCount / total) * 100) : 0}%)</span>
            </div>
          </div>
        )}
        {noResponseCount > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t">
            <div className="flex-1 text-xs text-gray-400 truncate">No response</div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gray-300 rounded-full"
                style={{ width: `${Math.min(Math.round((noResponseCount / total) * 100), 100)}%` }}
              />
            </div>
            <div className="w-16 text-right">
              <span className="font-bold text-gray-400 text-sm">{noResponseCount}</span>
              <span className="text-gray-300 text-xs ml-1">({total > 0 ? Math.round((noResponseCount / total) * 100) : 0}%)</span>
            </div>
          </div>
        )}
        {sorted.length === 0 && noResponseCount === 0 && (
          <p className="text-gray-400 text-xs">No data</p>
        )}
      </div>
    </div>
  )
}

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
  const paidCount = assessments.filter(a => a.payment_completed).length
  
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
        <StatCard label="Payment Completed" value={paidCount} color="green" />
        <StatCard label="Revenue Collected" value={`$${((paidCount + fpCount) * 1250).toLocaleString()}`} color="green" />
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
            <div className="max-h-64 overflow-y-auto pr-2">
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
  const sizeData = countResponses(assessments, 'firmographics_data', 's8', FIRMOGRAPHICS_OPTIONS.s8Size)
  const revenueData = countResponses(assessments, 'firmographics_data', 'c4', FIRMOGRAPHICS_OPTIONS.c4Revenue)
  const levelData = countResponses(assessments, 'firmographics_data', 's5', FIRMOGRAPHICS_OPTIONS.s5Level)
  const functionData = countResponses(assessments, 'firmographics_data', 's4b', FIRMOGRAPHICS_OPTIONS.s4bFunction)
  const influenceData = countResponses(assessments, 'firmographics_data', 's7', FIRMOGRAPHICS_OPTIONS.s7Influence)
  const countryData = countResponses(assessments, 'firmographics_data', 's9', FIRMOGRAPHICS_OPTIONS.s9Country)
  const remoteData = countResponses(assessments, 'firmographics_data', 'c6', FIRMOGRAPHICS_OPTIONS.c6RemoteWork)
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3">
          <h3 className="text-white font-bold">Firmographics / Company Profile</h3>
          <p className="text-purple-200 text-xs">{totalRespondents} respondents</p>
        </div>
        
        <div className="p-5 grid md:grid-cols-2 gap-6">
          <DataTable title="Industry (C2)" data={industryData} total={totalRespondents} />
          <DataTable title="Company Size (S8)" data={sizeData} total={totalRespondents} />
          <DataTable title="Annual Revenue (C4)" data={revenueData} total={totalRespondents} />
          <DataTable title="Respondent Level (S5)" data={levelData} total={totalRespondents} />
          <DataTable title="Primary Function (S4b)" data={functionData} total={totalRespondents} />
          <DataTable title="Benefits Influence (S7)" data={influenceData} total={totalRespondents} />
          <DataTable title="HQ Country (S9)" data={countryData} total={totalRespondents} />
          <DataTable title="Remote/Hybrid Work (C6)" data={remoteData} total={totalRespondents} />
        </div>
      </div>
    </div>
  )
}

function GeneralBenefitsSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalRespondents = assessments.length
  
  const standardBenefits = countMultiSelect(assessments, 'general_benefits_data', 'cb1', CB1_OPTIONS.standardBenefits)
  const leaveFlexibility = countMultiSelect(assessments, 'general_benefits_data', 'cb1', CB1_OPTIONS.leaveFlexibility)
  const wellnessSupport = countMultiSelect(assessments, 'general_benefits_data', 'cb1', CB1_OPTIONS.wellnessSupport)
  const financialLegal = countMultiSelect(assessments, 'general_benefits_data', 'cb1', CB1_OPTIONS.financialLegal)
  const careNavigation = countMultiSelect(assessments, 'general_benefits_data', 'cb1', CB1_OPTIONS.careNavigation)
  
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
    </div>
  )
}

function CurrentSupportSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalRespondents = assessments.length
  
  const cb3aData = countResponses(assessments, 'current_support_data', 'cb3a', CURRENT_SUPPORT_OPTIONS.cb3a)
  const cb3bData = countMultiSelect(assessments, 'current_support_data', 'cb3b', CURRENT_SUPPORT_OPTIONS.cb3b)
  const cb3cData = countMultiSelect(assessments, 'current_support_data', 'cb3c', CURRENT_SUPPORT_OPTIONS.cb3c)
  const cb3dData = countMultiSelect(assessments, 'current_support_data', 'cb3d', CURRENT_SUPPORT_OPTIONS.cb3d)
  const or1Data = countResponses(assessments, 'current_support_data', 'or1', CURRENT_SUPPORT_OPTIONS.or1)
  const or2aData = countMultiSelect(assessments, 'current_support_data', 'or2a', CURRENT_SUPPORT_OPTIONS.or2a)
  const or3Data = countMultiSelect(assessments, 'current_support_data', 'or3', CURRENT_SUPPORT_OPTIONS.or3)
  const or5aData = countMultiSelect(assessments, 'current_support_data', 'or5a', CURRENT_SUPPORT_OPTIONS.or5a)
  const or6Data = countMultiSelect(assessments, 'current_support_data', 'or6', CURRENT_SUPPORT_OPTIONS.or6)
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3">
          <h3 className="text-white font-bold">Current Support Landscape</h3>
          <p className="text-teal-200 text-xs">{totalRespondents} respondents</p>
        </div>
        
        <div className="p-5 space-y-6">
          <DataTable title="CB3a: Support Beyond Legal Requirements" data={cb3aData} total={totalRespondents} />
          <DataTable title="CB3b: How Programs Are Structured" data={cb3bData} total={totalRespondents} isMultiSelect />
          <DataTable title="CB3c: Health Conditions Addressed" data={cb3cData} total={totalRespondents} isMultiSelect />
          <DataTable title="CB3d: How Programs Were Developed" data={cb3dData} total={totalRespondents} isMultiSelect />
          <DataTable title="OR1: Current Approach to Supporting Employees" data={or1Data} total={totalRespondents} />
          <DataTable title="OR2a: Triggers for Developing Support" data={or2aData} total={totalRespondents} isMultiSelect />
          <DataTable title="OR3: Primary Barriers to Comprehensive Support" data={or3Data} total={totalRespondents} isMultiSelect />
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
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-3">
          <h3 className="text-white font-bold">
            {dimKey.toUpperCase().replace('D', 'Dimension ')}: {config.name}
          </h3>
          <p className="text-orange-200 text-xs">{totalRespondents} respondents</p>
        </div>
        
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
        </div>
      </div>
    </div>
  )
}

function CrossDimensionalSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalRespondents = assessments.length
  
  const cd1aData = countMultiSelect(assessments, 'cross_dimensional_data', 'cd1a', CROSS_DIMENSIONAL_OPTIONS.dimensions)
  const cd1bData = countMultiSelect(assessments, 'cross_dimensional_data', 'cd1b', CROSS_DIMENSIONAL_OPTIONS.dimensions)
  const cd2Data = countMultiSelect(assessments, 'cross_dimensional_data', 'cd2', CROSS_DIMENSIONAL_OPTIONS.cd2Challenges)
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3">
          <h3 className="text-white font-bold">Cross-Dimensional Assessment</h3>
          <p className="text-indigo-200 text-xs">{totalRespondents} respondents</p>
        </div>
        
        <div className="p-5 space-y-6">
          <DataTable title="CD1a: TOP 3 Dimensions for Best Outcomes" data={cd1aData} total={totalRespondents} isMultiSelect />
          <DataTable title="CD1b: BOTTOM 3 Dimensions (Lowest Priority)" data={cd1bData} total={totalRespondents} isMultiSelect />
          <DataTable title="CD2: Biggest Challenges (Top 3)" data={cd2Data} total={totalRespondents} isMultiSelect />
        </div>
      </div>
    </div>
  )
}

function EmployeeImpactSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalRespondents = assessments.length
  
  const ei2Data = countResponses(assessments, 'employee_impact_data', 'ei2', EMPLOYEE_IMPACT_OPTIONS.ei2)
  const ei3Data = countResponses(assessments, 'employee_impact_data', 'ei3', EMPLOYEE_IMPACT_OPTIONS.ei3)
  
  // EI1 is a grid - need special handling
  const ei1Data: Record<string, Record<string, number>> = {}
  EMPLOYEE_IMPACT_OPTIONS.ei1Areas.forEach(area => {
    ei1Data[area] = {}
    EMPLOYEE_IMPACT_OPTIONS.ei1Responses.forEach(resp => ei1Data[area][resp] = 0)
    ei1Data[area]['No response'] = 0
  })
  
  assessments.forEach(a => {
    const gridData = getGridData(a.employee_impact_data, 'ei1Grid')
    EMPLOYEE_IMPACT_OPTIONS.ei1Areas.forEach(area => {
      const response = gridData[area]
      if (!response) {
        ei1Data[area]['No response']++
      } else if (ei1Data[area][response] !== undefined) {
        ei1Data[area][response]++
      } else {
        ei1Data[area]['No response']++
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
          
          <DataTable title="EI2: Have You Measured ROI?" data={ei2Data} total={totalRespondents} />
          <DataTable title="EI3: Approximate ROI Level" data={ei3Data} total={totalRespondents} />
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
  const [activeSection, setActiveSection] = useState<string>('overview')
  
  const filteredAssessments = completedOnly 
    ? assessments.filter(a => a.completionPercentage >= 100)
    : assessments
  
  const totalRespondents = filteredAssessments.length
  
  const sections = [
    { id: 'overview', name: 'Overview' },
    { id: 'firmographics', name: 'Firmographics' },
    { id: 'general-benefits', name: 'General Benefits (CB1)' },
    { id: 'current-support', name: 'Current Support' },
    ...Object.entries(DIMENSION_CONFIG).map(([key, config]) => ({
      id: key,
      name: `D${key.slice(1)}: ${config.name}`
    })),
    { id: 'cross-dimensional', name: 'Cross-Dimensional' },
    { id: 'employee-impact', name: 'Employee Impact' }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Aggregate Data Tables</h2>
            <p className="text-sm text-gray-600">
              Full response distributions for all survey questions ({totalRespondents} respondents)
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={completedOnly}
              onChange={(e) => setCompletedOnly(e.target.checked)}
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Completed surveys only (100%)</span>
          </label>
        </div>
        
        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {section.name}
            </button>
          ))}
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
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedAssessment, setSelectedAssessment] = useState<ProcessedAssessment | null>(null)
  const [activeTab, setActiveTab] = useState<'responses' | 'analytics'>('responses')
  
  // Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceAssessment, setInvoiceAssessment] = useState<ProcessedAssessment | null>(null)

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const processed = (data || []).map((assessment: Assessment) => {
        const isFP = isFoundingPartner(assessment.survey_id)
        
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
      a.survey_id?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && a.status === 'Completed') ||
      (statusFilter === 'in-progress' && a.status === 'In Progress') ||
      (statusFilter === 'not-started' && a.status === 'Not Started')

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'founding' && a.isFoundingPartner) ||
      (typeFilter === 'standard' && !a.isFoundingPartner)

    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    foundingStarted: assessments.filter((a) => a.isFoundingPartner).length,
    foundingCompleted: assessments.filter((a) => a.isFoundingPartner && a.completionPercentage >= 100).length,
    standardStarted: assessments.filter((a) => !a.isFoundingPartner).length,
    standardCompleted: assessments.filter((a) => !a.isFoundingPartner && a.completionPercentage >= 100).length,
    totalRevenue: assessments.reduce((sum, a) => {
      if (a.isFoundingPartner) return sum + 1250
      if (a.payment_completed) return sum + 1250
      return sum
    }, 0),
    paidSurveys: assessments.filter((a) => !a.isFoundingPartner && a.payment_completed).length,
    fpSponsored: assessments.filter((a) => a.isFoundingPartner).length,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-10" />
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Survey Administration Dashboard</h1>
              <p className="text-sm text-gray-600">Best Companies for Working with Cancer Initiative - 2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Founding Partners</p>
              <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.foundingStarted}</p>
            <p className="text-sm opacity-90">{stats.foundingCompleted} completed</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Standard Participants</p>
              <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.standardStarted}</p>
            <p className="text-sm opacity-90">{stats.standardCompleted} completed</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Total Revenue</p>
              <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-3xl font-bold mb-1">${(stats.totalRevenue / 1000).toFixed(1)}K</p>
            <p className="text-sm opacity-90">{stats.paidSurveys} paid • {stats.fpSponsored} FP sponsored</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Avg Completion</p>
              <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.avgCompletion}%</p>
            <p className="text-sm opacity-90">Avg {stats.avgDays} days to complete</p>
          </div>
        </div>

        {/* TAB TOGGLE */}
        <div className="bg-white rounded-xl shadow mb-6 overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('responses')}
              className={`flex-1 py-4 text-center font-semibold transition-colors ${
                activeTab === 'responses'
                  ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📋 Responses ({filteredAssessments.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-4 text-center font-semibold transition-colors ${
                activeTab === 'analytics'
                  ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📊 Analytics (Full Data Tables)
            </button>
          </div>
        </div>

        {/* RESPONSES TAB - ORIGINAL CODE */}
        {activeTab === 'responses' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SEARCH</label>
                  <input
                    type="text"
                    placeholder="Company, name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">STATUS</label>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">TYPE</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="founding">Founding Partners</option>
                    <option value="standard">Standard Participants</option>
                  </select>
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
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Started</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAssessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-gray-50 transition">
                      {/* Company */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                            assessment.isFoundingPartner ? 'bg-purple-600' : 'bg-blue-600'
                          }`}>
                            {(assessment.company_name || 'NA').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{assessment.company_name || 'N/A'}</p>
                            <p className="text-xs text-gray-600 truncate">{assessment.firmographics_data?.firstName} {assessment.firmographics_data?.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{assessment.email}</p>
                            <p className="text-xs text-gray-400 font-mono truncate">{assessment.survey_id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        {assessment.isFoundingPartner ? (
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
                        {assessment.isFoundingPartner ? (
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

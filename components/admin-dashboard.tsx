'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { isFoundingPartner } from '@/lib/founding-partners'
import DetailedResponseView from './detailed-response-view'
import { generateInvoicePDF, downloadInvoicePDF, type InvoiceData } from '@/lib/invoice-generator'

// ============================================
// TYPE DEFINITIONS
// ============================================
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
  is_multi_country?: boolean
  overall_progress: number
  firmographics_complete: boolean
  firmographics_data: any
  general_benefits_complete: boolean
  general_benefits_data: any
  current_support_complete: boolean
  current_support_data: any
  dimension1_complete: boolean
  dimension1_data: any
  dimension2_complete: boolean
  dimension2_data: any
  dimension3_complete: boolean
  dimension3_data: any
  dimension4_complete: boolean
  dimension4_data: any
  dimension5_complete: boolean
  dimension5_data: any
  dimension6_complete: boolean
  dimension6_data: any
  dimension7_complete: boolean
  dimension7_data: any
  dimension8_complete: boolean
  dimension8_data: any
  dimension9_complete: boolean
  dimension9_data: any
  dimension10_complete: boolean
  dimension10_data: any
  dimension11_complete: boolean
  dimension11_data: any
  dimension12_complete: boolean
  dimension12_data: any
  dimension13_complete: boolean
  dimension13_data: any
  cross_dimensional_complete: boolean
  cross_dimensional_data: any
  employee_impact_complete: boolean
  employee_impact_data: any
  status: string
}

interface ProcessedAssessment extends Assessment {
  isFoundingPartner: boolean
  displayName: string
}

// ============================================
// DIMENSION CONFIGURATION - ALL 13 DIMENSIONS
// ============================================
const DIMENSION_CONFIG = {
  d1: {
    name: 'Medical Leave & Flexibility',
    dataKey: 'dimension1_data',
    gridField: 'd1aGrid',
    items: [
      'Paid medical leave beyond local / legal requirements',
      'Intermittent leave beyond local / legal requirements',
      'Flexible work hours during treatment',
      'Remote work options for on-site employees',
      'Reduced schedule/part-time with full benefits',
      'Job protection beyond local / legal requirements',
      'Emergency leave within 24 hours',
      'Leave donation bank',
      'Disability pay top-up',
      'PTO accrual during leave',
      'Paid micro-breaks for side effects'
    ]
  },
  d2: {
    name: 'Insurance & Financial Protection',
    dataKey: 'dimension2_data',
    gridField: 'd2aGrid',
    items: [
      'Coverage for clinical trials and experimental treatments',
      'Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy)',
      'Paid time off for clinical trial participation',
      'Set out-of-pocket maximums',
      'Travel/lodging reimbursement for specialized care',
      'Financial counseling services',
      'Voluntary supplemental illness insurance',
      'Real-time cost estimator tools',
      'Insurance advocacy/pre-authorization support',
      '$0 copay for specialty drugs',
      'Hardship grants program funded by employer',
      'Tax/estate planning assistance',
      'Short-term disability covering 60%+ of salary',
      'Long-term disability covering 60%+ of salary',
      'Employer-paid disability insurance supplements',
      'Guaranteed job protection',
      'Accelerated life insurance benefits'
    ]
  },
  d3: {
    name: 'Manager Preparedness & Capability',
    dataKey: 'dimension3_data',
    gridField: 'd3aGrid',
    items: [
      'Manager training on supporting employees managing serious health conditions',
      'Clear escalation protocol for manager response',
      'Dedicated manager resource hub',
      'Empathy/communication skills training',
      'Legal compliance training',
      'Senior leader coaching on supporting impacted employees',
      'Manager evaluations include support quality',
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
      'Dedicated navigation support',
      'Benefits optimization assistance',
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
      'Policy accommodations (dress code, headphone use)'
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
      'Employee peer support groups',
      'Professional-led support groups',
      'Stigma-reduction initiatives',
      'Specialized emotional counseling',
      'Optional open health dialogue forums',
      'Inclusive communication guidelines',
      'Confidential HR channel for health benefits questions',
      'Anonymous benefits navigation tool or website'
    ]
  },
  d7: {
    name: 'Career Continuity & Advancement',
    dataKey: 'dimension7_data',
    gridField: 'd7aGrid',
    items: [
      'Continued access to training/development',
      'Structured reintegration programs',
      'Peer mentorship program',
      'Professional coach/mentor',
      'Adjusted performance goals/deliverables',
      'Career coaching',
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
      'Executive sponsors communicate regularly',
      'Dedicated budget allocation',
      'C-suite executive serves as program champion/sponsor',
      'Support programs included in investor communications',
      'Cross-functional executive steering committee',
      'Support metrics included in annual report'
    ]
  },
  d10: {
    name: 'Caregiver & Family Support',
    dataKey: 'dimension10_data',
    gridField: 'd10aGrid',
    items: [
      'Paid caregiver leave with expanded eligibility',
      'Flexible work arrangements for caregivers',
      'Dependent care subsidies',
      'Emergency caregiver funds',
      'Dependent care account matching/contributions',
      'Family navigation support',
      'Caregiver peer support groups',
      'Mental health support specifically for caregivers',
      'Manager training for supervising caregivers',
      'Practical support for managing caregiving and work',
      'Emergency dependent care',
      'Respite care funding/reimbursement',
      'Caregiver resource navigator/concierge',
      'Legal/financial planning assistance for caregivers',
      'Modified job duties during peak caregiving periods',
      'Unpaid leave job protection beyond legal requirements',
      'Eldercare consultation and referral services',
      'Paid time off for care coordination appointments',
      'Expanded caregiver leave eligibility'
    ]
  },
  d11: {
    name: 'Prevention, Wellness & Legal Compliance',
    dataKey: 'dimension11_data',
    gridField: 'd11aGrid',
    items: [
      'At least 70% coverage for recommended screenings',
      'Full or partial coverage for annual health screenings',
      'Targeted risk-reduction programs',
      'Paid time off for preventive care appointments',
      'Legal protections beyond requirements',
      'Workplace safety assessments',
      'Regular health education sessions',
      'Individual health assessments',
      'Genetic screening/counseling',
      'On-site vaccinations',
      'Lifestyle coaching programs',
      'Risk factor tracking/reporting',
      'Policies to support immuno-compromised colleagues'
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
      'Regular company-wide awareness campaigns',
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
// GENERAL BENEFITS CB1 OPTIONS
// ============================================
const CB1_OPTIONS = {
  standardBenefits: [
    'Health insurance',
    'Dental insurance',
    'Vision insurance',
    'Life insurance',
    'Short-term disability',
    'Long-term disability',
    'Paid time off (PTO/vacation)',
    'Sick days'
  ],
  leaveFlexibility: [
    'Paid family/medical leave beyond legal requirements',
    'Flexible work schedules',
    'Remote work options',
    'Job sharing programs',
    'Phased retirement',
    'Sabbatical programs',
    'Dedicated caregiver leave'
  ],
  wellnessSupport: [
    'Employee assistance program (EAP)',
    'Physical wellness programs',
    'Mental wellness programs',
    'On-site health services',
    'Mental health resources',
    'Caregiving support resources',
    'Tailored support programs for serious health conditions'
  ],
  financialLegal: [
    'Financial counseling/planning',
    'Student loan assistance',
    'Identity theft protection',
    'Legal assistance/services'
  ],
  careNavigation: [
    'Care coordination for complex conditions',
    'Second opinion services',
    'Specialized treatment center networks',
    'Travel support for specialized care',
    'Clinical guidance and navigation',
    'Medication access and affordability programs'
  ]
}

// ============================================
// CURRENT SUPPORT OPTIONS
// ============================================
const CURRENT_SUPPORT_OPTIONS = {
  cb3a: [
    'Yes, we offer additional support beyond legal requirements',
    'Currently developing enhanced support offerings',
    'At this time, we primarily focus on meeting legal compliance requirements',
    'Not yet, but actively exploring options'
  ],
  cb3b: [
    'Individual benefits or policies',
    'Coordinated support services - single point of contact',
    'Internally developed formal program',
    'Participation in external initiatives, certifications, or pledges',
    'Comprehensive framework that integrates multiple support elements',
    'Ad hoc/case-by-case support as needs arise',
    'Other'
  ],
  cb3c: [
    'Autoimmune disorders',
    'Cancer (any form)',
    'Chronic conditions',
    'Heart disease',
    'HIV / AIDS',
    'Kidney disease',
    'Major surgery recovery',
    'Mental health crises',
    'Musculoskeletal conditions',
    'Neurological conditions',
    'Organ transplant',
    'Respiratory conditions',
    'Stroke',
    'Other'
  ],
  or1: [
    'No formal approach: Handle case-by-case',
    'Developing approach: Currently building our programs',
    'Legal minimum only: Meet legal requirements only',
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
    'Other'
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
    'Data privacy concerns',
    'Complex/varying legal requirements across markets',
    'Global consistency challenges',
    'Other'
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
    'Emergency dependent care',
    'Legal/financial planning resources',
    'Other',
    'Not able to provide caregiver support at this time'
  ],
  or6: [
    'Aggregate metrics and analytics only',
    'De-identified case tracking',
    'General program utilization data',
    'Voluntary employee feedback/surveys',
    'Other',
    'No systematic monitoring'
  ]
}

// ============================================
// CROSS-DIMENSIONAL OPTIONS
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
    'Other'
  ]
}

// ============================================
// EMPLOYEE IMPACT OPTIONS
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
    'Negative ROI',
    'Break-even',
    '1.1 - 2.0x ROI',
    '2.1 - 3.0x ROI',
    '3.1 - 5.0x ROI',
    'Greater than 5.0x ROI'
  ]
}

// ============================================
// FIRMOGRAPHICS OPTIONS
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
    // Traditional
    'Agriculture, Forestry, Fishing and Hunting',
    'Construction',
    'Manufacturing',
    'Mining, Quarrying, and Oil and Gas Extraction',
    'Retail Trade',
    'Transportation and Warehousing',
    'Utilities',
    'Wholesale Trade',
    // Service
    'Accommodation and Food Services',
    'Arts, Entertainment, and Recreation',
    'Educational Services',
    'Finance and Insurance',
    'Healthcare, Pharmaceuticals & Life Sciences',
    'Hospitality & Tourism',
    'Media & Publishing',
    'Professional & Business Services',
    'Real Estate and Rental and Leasing',
    'Scientific & Technical Services',
    // Tech
    'IT Services & Technology Consulting',
    'Software & Technology Products',
    'Social Media & Digital Platforms',
    'Telecommunications & Internet Services',
    // Other
    'Government / Public Administration',
    'Non-profit/NGO',
    'Other'
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
    'United Kingdom',
    'Germany',
    'France',
    'Canada',
    'Australia',
    'Other'
  ],
  c6RemoteWork: [
    'Fully flexible',
    'Selectively flexible',
    'Limited flexibility',
    'Minimal flexibility',
    'No flexibility',
    'Varies significantly by location'
  ]
}

// ============================================
// RESPONSE SCALE OPTIONS
// ============================================
const RESPONSE_SCALE = [
  'Currently offer',
  'In active planning / development',
  'Assessing feasibility',
  'Not able to offer in foreseeable future',
  'Unsure',
  'No response'
]

// ============================================
// HELPER FUNCTIONS
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
    const value = parseJsonField(a[dataKey as keyof ProcessedAssessment], field)
    if (value === 'Not provided' || !value) {
      counts['No response']++
    } else if (counts[value] !== undefined) {
      counts[value]++
    } else {
      counts['Other']++
    }
  })
  
  return counts
}

function countMultiSelect(assessments: ProcessedAssessment[], dataKey: string, field: string, options: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  options.forEach(opt => counts[opt] = 0)
  
  assessments.forEach(a => {
    const values = parseJsonArray(a[dataKey as keyof ProcessedAssessment], field)
    values.forEach(v => {
      if (counts[v] !== undefined) {
        counts[v]++
      } else {
        // Check for partial match
        const matchedOpt = options.find(opt => v.toLowerCase().includes(opt.toLowerCase().slice(0, 20)))
        if (matchedOpt) counts[matchedOpt]++
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
    const gridData = getGridData(a[config.dataKey as keyof ProcessedAssessment], config.gridField)
    
    config.items.forEach(item => {
      const response = gridData[item]
      if (!response) {
        results[item]['No response']++
      } else if (results[item][response] !== undefined) {
        results[item][response]++
      } else {
        // Try to match partial
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
// ANALYTICS TAB COMPONENT
// ============================================
interface AnalyticsTabProps {
  assessments: ProcessedAssessment[]
}

function AnalyticsTab({ assessments }: AnalyticsTabProps) {
  const [completedOnly, setCompletedOnly] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('overview')
  
  const filteredAssessments = completedOnly 
    ? assessments.filter(a => a.overall_progress >= 90)
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
            <span className="text-sm text-gray-700">Completed surveys only (90%+)</span>
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
// OVERVIEW SECTION
// ============================================
function OverviewSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalCount = assessments.length
  const fpCount = assessments.filter(a => a.isFoundingPartner).length
  const regularCount = totalCount - fpCount
  const completedCount = assessments.filter(a => a.overall_progress >= 90).length
  const inProgressCount = assessments.filter(a => a.overall_progress > 0 && a.overall_progress < 90).length
  const notStartedCount = assessments.filter(a => a.overall_progress === 0).length
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
        <StatCard label="Completed (90%+)" value={completedCount} color="green" />
        <StatCard label="In Progress" value={inProgressCount} color="orange" />
        <StatCard label="Not Started" value={notStartedCount} color="gray" />
        <StatCard label="Payment Completed" value={paidCount} color="green" />
        <StatCard label="Revenue Collected" value={`$${(paidCount * 1250).toLocaleString()}`} color="green" />
      </div>
      
      {/* Section Completion */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Section Completion Rates</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Core Sections</h4>
            <ProgressBar label="Firmographics" value={sectionCompletion.firmographics} total={totalCount} />
            <ProgressBar label="General Benefits" value={sectionCompletion.generalBenefits} total={totalCount} />
            <ProgressBar label="Current Support" value={sectionCompletion.currentSupport} total={totalCount} />
            <ProgressBar label="Cross-Dimensional" value={sectionCompletion.crossDimensional} total={totalCount} />
            <ProgressBar label="Employee Impact" value={sectionCompletion.employeeImpact} total={totalCount} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">13 Dimensions</h4>
            <div className="max-h-64 overflow-y-auto pr-2">
              {dimensionNames.map((name, idx) => (
                <ProgressBar 
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

function ProgressBar({ label, value, total }: { label: string; value: number; total: number }) {
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

// ============================================
// FIRMOGRAPHICS SECTION
// ============================================
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

// ============================================
// GENERAL BENEFITS SECTION
// ============================================
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

// ============================================
// CURRENT SUPPORT SECTION
// ============================================
function CurrentSupportSection({ assessments }: { assessments: ProcessedAssessment[] }) {
  const totalRespondents = assessments.length
  
  const cb3aData = countResponses(assessments, 'current_support_data', 'cb3a', CURRENT_SUPPORT_OPTIONS.cb3a)
  const cb3bData = countMultiSelect(assessments, 'current_support_data', 'cb3b', CURRENT_SUPPORT_OPTIONS.cb3b)
  const cb3cData = countMultiSelect(assessments, 'current_support_data', 'cb3c', CURRENT_SUPPORT_OPTIONS.cb3c)
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

// ============================================
// DIMENSION SECTION
// ============================================
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
// CROSS-DIMENSIONAL SECTION
// ============================================
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

// ============================================
// EMPLOYEE IMPACT SECTION
// ============================================
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
// REUSABLE DATA TABLE COMPONENT
// ============================================
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

// ============================================
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================
export default function AdminDashboard() {
  const [assessments, setAssessments] = useState<ProcessedAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'responses' | 'analytics'>('responses')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'in-progress' | 'not-started'>('all')
  const [filterType, setFilterType] = useState<'all' | 'fp' | 'regular'>('all')
  const [selectedAssessment, setSelectedAssessment] = useState<ProcessedAssessment | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceAssessment, setInvoiceAssessment] = useState<ProcessedAssessment | null>(null)
  
  const fetchAssessments = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      
      const processed: ProcessedAssessment[] = (data || []).map(a => ({
        ...a,
        isFoundingPartner: isFoundingPartner(a.survey_id || ''),
        displayName: a.company_name || a.email || 'Unknown'
      }))
      
      setAssessments(processed)
    } catch (error) {
      console.error('Error fetching assessments:', error)
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])
  
  const filteredAssessments = assessments.filter(a => {
    // Search filter
    const searchMatch = 
      a.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.survey_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    let statusMatch = true
    if (filterStatus === 'complete') statusMatch = a.overall_progress >= 90
    else if (filterStatus === 'in-progress') statusMatch = a.overall_progress > 0 && a.overall_progress < 90
    else if (filterStatus === 'not-started') statusMatch = a.overall_progress === 0
    
    // Type filter
    let typeMatch = true
    if (filterType === 'fp') typeMatch = a.isFoundingPartner
    else if (filterType === 'regular') typeMatch = !a.isFoundingPartner
    
    return searchMatch && statusMatch && typeMatch
  })
  
  // Stats
  const totalCount = assessments.length
  const fpCount = assessments.filter(a => a.isFoundingPartner).length
  const completedCount = assessments.filter(a => a.overall_progress >= 90).length
  const paidCount = assessments.filter(a => a.payment_completed).length
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-900">Loading assessments...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Best Companies for Working with Cancer Survey Management</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
            <p className="text-sm text-gray-600">Total Assessments</p>
          </div>
          <div className="bg-purple-50 rounded-xl shadow-sm p-5 border border-purple-200">
            <p className="text-3xl font-bold text-purple-900">{fpCount}</p>
            <p className="text-sm text-purple-700">Founding Partners</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-5 border border-green-200">
            <p className="text-3xl font-bold text-green-900">{completedCount}</p>
            <p className="text-sm text-green-700">Completed (90%+)</p>
          </div>
          <div className="bg-orange-50 rounded-xl shadow-sm p-5 border border-orange-200">
            <p className="text-3xl font-bold text-orange-900">${(paidCount * 1250).toLocaleString()}</p>
            <p className="text-sm text-orange-700">Revenue ({paidCount} paid)</p>
          </div>
        </div>
        
        {/* Tab Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
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
          
          {/* Responses Tab Content */}
          {activeTab === 'responses' && (
            <div className="p-5">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search company, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="complete">Completed (90%+)</option>
                  <option value="in-progress">In Progress</option>
                  <option value="not-started">Not Started</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Types</option>
                  <option value="fp">Founding Partners</option>
                  <option value="regular">Regular Users</option>
                </select>
                <button
                  onClick={fetchAssessments}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  🔄 Refresh
                </button>
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-700">Company</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Type</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Progress</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Payment</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Updated</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAssessments.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{a.displayName}</div>
                          <div className="text-xs text-gray-500">{a.email}</div>
                          <div className="text-xs text-gray-400">{a.survey_id}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            a.isFoundingPartner 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {a.isFoundingPartner ? 'FP' : 'Regular'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  a.overall_progress >= 90 ? 'bg-green-500' 
                                  : a.overall_progress > 0 ? 'bg-orange-500' 
                                  : 'bg-gray-300'
                                }`}
                                style={{ width: `${a.overall_progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{a.overall_progress}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            a.payment_completed 
                              ? 'bg-green-100 text-green-800' 
                              : a.isFoundingPartner
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {a.payment_completed ? 'Paid' : a.isFoundingPartner ? 'FP Exempt' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-gray-600">
                          {new Date(a.updated_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedAssessment(a)}
                              className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-xs font-medium"
                            >
                              View Details
                            </button>
                            {!a.isFoundingPartner && !a.payment_completed && (
                              <button
                                onClick={() => {
                                  setInvoiceAssessment(a)
                                  setShowInvoiceModal(true)
                                }}
                                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs font-medium"
                              >
                                Invoice
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAssessments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No assessments found matching your filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <div className="p-5">
              <AnalyticsTab assessments={assessments} />
            </div>
          )}
        </div>
      </div>
      
      {/* Detail View Modal */}
      {selectedAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{selectedAssessment.displayName}</h2>
              <button
                onClick={() => setSelectedAssessment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <DetailedResponseView assessment={selectedAssessment} />
            </div>
          </div>
        </div>
      )}
      
      {/* Invoice Modal */}
      {showInvoiceModal && invoiceAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="border-b p-4">
              <h2 className="text-xl font-bold text-gray-900">Generate Invoice</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Generate invoice for <strong>{invoiceAssessment.displayName}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Invoice generation logic here
                    setShowInvoiceModal(false)
                    setInvoiceAssessment(null)
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
                >
                  Generate PDF
                </button>
                <button
                  onClick={() => {
                    setShowInvoiceModal(false)
                    setInvoiceAssessment(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

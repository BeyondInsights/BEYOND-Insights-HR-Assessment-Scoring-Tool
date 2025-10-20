export const d1Schema = {
  d1a: {
    type: 'grid',
    label: 'Medical Leave & Flexibility Programs',
    statusOptions: [
      'Currently offer',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to offer in foreseeable future'
    ],
    programs: [
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
      'Paid micro-breaks for medical-related side effects'
    ]
  },
  d1aa: {
    type: 'select',
    label: 'Geographic Availability',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d1b: {
    type: 'textarea',
    label: 'Additional medical leave & flexibility benefits not listed',
    hasNone: true
  },
  d1_1: {
    type: 'select',
    label: 'Paid medical leave duration',
    condition: 'offersProgram:Paid medical leave beyond local / legal requirements',
    options: [
      'Less than 2 weeks',
      '2-3 weeks',
      '4-7 weeks',
      '8-11 weeks',
      '12-15 weeks',
      '16-23 weeks',
      '24+ weeks'
    ]
  },
  d1_2: {
    type: 'select',
    label: 'Intermittent leave availability',
    condition: 'offersProgram:Intermittent leave beyond local / legal requirements',
    options: [
      'Up to 4 weeks per year',
      '5-8 weeks per year',
      '9-12 weeks per year',
      'More than 12 weeks per year',
      'No specific limit'
    ]
  },
  d1_4a: {
    type: 'select',
    label: 'Remote work availability',
    condition: 'offersProgram:Remote work options for on-site employees',
    options: [
      'Up to 3 months',
      '4-6 months',
      '7-12 months',
      'More than 12 months',
      'No specific limit - based on medical need'
    ]
  },
  d1_6: {
    type: 'multiselect',
    label: 'Disability benefit enhancements',
    condition: 'hasDisabilityInsurance',
    options: [
      'Enhance short-term disability (higher % of salary)',
      'Enhance long-term disability (higher % of salary)',
      'Extend duration of benefits',
      'Reduce/waive waiting periods',
      'No enhancement - same as standard',
      'Not applicable - government disability only'
    ]
  }
}

export const d12Schema = {
  d12a: {
    type: 'grid',
    label: 'Continuous Improvement & Outcomes Measurement',
    statusOptions: [
      'Currently measure / track',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to measure / track in foreseeable future'
    ],
    programs: [
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
  d12aa: {
    type: 'select',
    label: 'Geographic Consistency of Measurement',
    condition: 'multiCountry',
    options: [
      'Only measured/tracked in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d12b: {
    type: 'textarea',
    label: 'Additional measurement/improvement practices not listed',
    hasNone: true
  },
  d12_1: {
    type: 'select',
    label: 'How do you review individual employee cases?',
    options: [
      'Regular case review meetings',
      'Ad hoc reviews as needed',
      'Third-party vendor manages reviews',
      'Manager-led reviews',
      'We don\'t review individual cases',
      'Other approach'
    ],
    hasOther: true
  },
  d12_2: {
    type: 'textarea',
    label: 'What changes have you implemented based on employee experiences with serious medical conditions?',
    maxLength: 500
  }
}

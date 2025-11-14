export const d13Schema = {
  d13a: {
    type: 'grid',
    label: 'Communication & Awareness Programs',
    statusOptions: [
      'Currently use',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to utilize in foreseeable future',
      'Unsure'
    ],
    programs: [
      'Proactive communication at point of diagnosis disclosure',
      'Dedicated program website or portal',
      'Regular company-wide awareness campaigns (at least quarterly)',
      'New hire orientation coverage',
      'Manager toolkit for cascade communications',
      'Employee testimonials/success stories',
      'Multi-channel communication strategy',
      'Family/caregiver communication inclusion',
      'Anonymous information access options',
      'Cancer awareness month campaigns with resources and survivor stories'
    ]
  },
  d13aa: {
    type: 'select',
    label: 'Geographic Consistency of Approach',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d13b: {
    type: 'textarea',
    label: 'Additional communication/awareness approaches not listed',
    hasNone: true
  },
  d13_1: {
    type: 'select',
    label: 'How frequently does your organization communicate about support programs?',
    options: [
      'Weekly',
      'Monthly',
      'Quarterly',
      'Semi-annually',
      'Annually',
      'Only during benefits enrollment',
      'Only when asked',
      'We don\'t actively communicate'
    ]
  }
}

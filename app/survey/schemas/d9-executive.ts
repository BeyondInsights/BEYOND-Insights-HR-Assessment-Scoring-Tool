export const d9Schema = {
  d9a: {
    type: 'grid',
    label: 'Executive Commitment & Resources Programs',
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
  'Paid micro-breaks for medical-related side effects',
  'Full salary (100%) continuation during cancer-related short-term disability leave'
]
  },
  d9aa: {
    type: 'select',
    label: 'Geographic Availability',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d9b: {
    type: 'textarea',
    label: 'Additional executive commitment practices not listed',
    hasNone: true
  }
}

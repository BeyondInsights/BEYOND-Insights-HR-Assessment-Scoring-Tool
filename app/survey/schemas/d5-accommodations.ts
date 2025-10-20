export const d5Schema = {
  d5a: {
    type: 'grid',
    label: 'Workplace Accommodations Programs',
    statusOptions: [
      'Currently offer',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to offer in foreseeable future'
    ],
    programs: [
      'Physical workspace modifications',
      'Cognitive/fatigue support tools',
      'Ergonomic equipment funding',
      'Flexible scheduling options',
      'Remote work capability',
      'Rest areas/quiet spaces',
      'Priority parking',
      'Temporary role redesigns',
      'Assistive technology catalog',
      'Transportation reimbursement',
      'Policy accommodations (e.g., dress code flexibility, headphone use)'
    ]
  },
  d5aa: {
    type: 'select',
    label: 'Geographic Availability',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d5b: {
    type: 'textarea',
    label: 'Additional workplace accommodations not listed',
    hasNone: true
  }
}

export const d8Schema = {
  d8a: {
    type: 'grid',
    label: 'Work Continuation & Resumption Programs',
    statusOptions: [
      'Currently offer',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to offer in foreseeable future'
    ],
    programs: [
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
  d8aa: {
    type: 'select',
    label: 'Geographic Availability',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d8b: {
    type: 'textarea',
    label: 'Additional work continuation/resumption supports not listed',
    hasNone: true
  }
}

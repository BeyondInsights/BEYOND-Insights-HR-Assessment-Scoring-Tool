export const d7Schema = {
  d7a: {
    type: 'grid',
    label: 'Career Continuity & Advancement Programs',
    statusOptions: [
      'Currently offer',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to offer in foreseeable future'
    ],
    programs: [
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
  d7aa: {
    type: 'select',
    label: 'Geographic Availability',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d7b: {
    type: 'textarea',
    label: 'Additional career continuity supports not listed',
    hasNone: true
  }
}

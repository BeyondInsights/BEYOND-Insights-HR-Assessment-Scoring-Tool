export const d3Schema = {
  d3a: {
    type: 'grid',
    label: 'Manager Preparedness & Capability Programs',
    statusOptions: [
      'Currently provide to managers',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to provide in foreseeable future'
    ],
    programs: [
      'Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams',
      'Clear escalation protocol for manager response',
      'Dedicated manager resource hub',
      'Empathy/communication skills training',
      'Legal compliance training',
      'Senior leader coaching on supporting impacted employees',
      'Manager evaluations include how well they support impacted employees',
      'Manager peer support/community building',
      'AI-powered guidance tools',
      'Privacy protection and confidentiality management'
    ]
  },
  d3aa: {
    type: 'select',
    label: 'Geographic Availability',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d3b: {
    type: 'textarea',
    label: 'Additional manager preparedness initiatives not listed',
    hasNone: true
  },
  d3_1a: {
    type: 'select',
    label: 'Is manager training mandatory or voluntary?',
    condition: 'hasManagerTraining',
    options: [
      'Mandatory for all managers',
      'Mandatory for new managers only',
      'Voluntary',
      'Varies by training type'
    ]
  },
  d3_1: {
    type: 'select',
    label: 'Percentage of managers who completed training (past 2 years)',
    condition: 'hasManagerTraining',
    options: [
      'Less than 10%',
      '10 to less than 25%',
      '25 to less than 50%',
      '50 to less than 75%',
      '75 to less than 100%',
      '100%',
      'Unsure',
      'Do not track this information',
      'Not able to provide this information'
    ]
  }
}

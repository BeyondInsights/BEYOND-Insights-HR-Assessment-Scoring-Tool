export const d4Schema = {
  d4a: {
    type: 'grid',
    label: 'Cancer Support Resources Programs',
    statusOptions: [
      'Currently offer',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to offer in foreseeable future'
    ],
    programs: [
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
  d4aa: {
    type: 'select',
    label: 'Geographic Availability',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d4b: {
    type: 'textarea',
    label: 'Additional cancer support resources not listed',
    hasNone: true
  },
  d4_1a: {
    type: 'multiselect',
    label: 'Who provides navigation support?',
    condition: 'offersProgram:Dedicated navigation support',
    options: [
      'Credentialed internal staff dedicated to employee navigation (e.g. nurse, social worker, etc.)',
      'External vendor / service (contracted)',
      'Through health insurance carrier',
      'Through specialized medical provider',
      'Partnership with specialized health organization',
      'Other approach'
    ],
    hasOther: true
  },
  d4_1b: {
    type: 'multiselect',
    label: 'Services available through navigation support',
    condition: 'offersProgram:Dedicated navigation support',
    options: [
      'Clinical guidance from a licensed medical/healthcare professional',
      'Insurance navigation',
      'Mental health support',
      'Caregiver resources',
      'Financial planning',
      'Return-to-work planning',
      'Treatment decision support / second opinion',
      'Company-sponsored peer support networks',
      'Some other service'
    ],
    hasOther: true
  }
}

export const d10Schema = {
  d10a: {
    type: 'grid',
    label: 'Caregiver & Family Support Programs',
    statusOptions: [
      'Currently offer',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to offer in foreseeable future'
    ],
    programs: [
      'Paid caregiver leave with expanded eligibility (beyond local legal requirements)',
      'Flexible work arrangements for caregivers',
      'Dependent care subsidies',
      'Emergency caregiver funds',
      'Dependent care account matching/contributions',
      'Family navigation support',
      'Caregiver peer support groups',
      'Mental health support specifically for caregivers',
      'Manager training for supervising caregivers',
      'Practical support for managing caregiving and work',
      'Emergency dependent care when regular arrangements unavailable',
      'Respite care funding/reimbursement',
      'Caregiver resource navigator/concierge',
      'Legal/financial planning assistance for caregivers',
      'Modified job duties during peak caregiving periods',
      'Unpaid leave job protection beyond local / legal requirements',
      'Eldercare consultation and referral services',
      'Paid time off for care coordination appointments',
      'Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)'
    ]
  },
  d10aa: {
    type: 'select',
    label: 'Geographic Availability',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d10b: {
    type: 'textarea',
    label: 'Additional caregiver & family support not listed',
    hasNone: true
  }
}

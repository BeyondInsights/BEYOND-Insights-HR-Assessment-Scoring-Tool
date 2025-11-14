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
  "Executive accountability metrics",
  "Public success story celebrations",
  "Compensation tied to support outcomes",
  "ESG/CSR reporting inclusion",
  "Year-over-year budget growth",
  "Executive sponsors communicate regularly about workplace support programs",
  "Dedicated budget allocation for serious illness support programs",
  "C-suite executive serves as program champion/sponsor",
  "Support programs included in investor/stakeholder communications",
  "Cross-functional executive steering committee for workplace support programs",
  "Support metrics included in annual report/sustainability reporting",
  "Executive-led town halls focused on health benefits and employee support"
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

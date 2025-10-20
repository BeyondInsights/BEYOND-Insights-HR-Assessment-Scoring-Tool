export const d2Schema = {
  d2a: {
    type: 'grid',
    label: 'Insurance & Financial Protection Programs',
    statusOptions: [
      'Currently offer',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to offer in foreseeable future'
    ],
    programs: [
      'Coverage for clinical trials and experimental treatments not covered by standard health insurance',
      'Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance',
      'Paid time off for clinical trial participation',
      'Set out-of-pocket maximums (for in-network single coverage)',
      'Travel/lodging reimbursement for specialized care beyond insurance coverage',
      'Financial counseling services',
      'Voluntary supplemental illness insurance (with employer contribution)',
      'Real-time cost estimator tools',
      'Insurance advocacy/pre-authorization support',
      '$0 copay for specialty drugs',
      'Hardship grants program funded by employer',
      'Tax/estate planning assistance',
      'Short-term disability covering 60%+ of salary',
      'Long-term disability covering 60%+ of salary',
      'Employer-paid disability insurance supplements',
      'Guaranteed job protection',
      'Accelerated life insurance benefits (partial payout for terminal/critical illness)'
    ]
  },
  d2aa: {
    type: 'select',
    label: 'Geographic Availability',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d2b: {
    type: 'textarea',
    label: 'Additional insurance & financial protection benefits not listed',
    hasNone: true
  }
}

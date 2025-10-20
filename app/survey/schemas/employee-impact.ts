export const employeeImpactSchema = {
  ei1: {
    type: 'grid',
    label: 'Program Impact by Outcome Area',
    responseType: 'impact',
    responseOptions: [
      'Significant positive impact',
      'Moderate positive impact',
      'Minimal positive impact',
      'No positive impact',
      'Unable to assess'
    ],
    items: [
      'Employee retention/tenure',
      'Employee morale',
      'Job satisfaction scores',
      'Productivity during treatment',
      'Time to return to work',
      'Recruitment success',
      'Team cohesion',
      'Trust in leadership',
      'Willingness to disclose health issues',
      'Overall engagement scores'
    ]
  },
  ei2: {
    type: 'select',
    label: 'Have you conducted ROI analysis on your support programs?',
    options: [
      'Yes, comprehensive ROI analysis completed',
      'Yes, basic ROI analysis completed',
      'Currently conducting ROI analysis',
      'Planning to measure ROI',
      'No plans to measure ROI'
    ]
  },
  ei3: {
    type: 'select',
    label: 'Approximate ROI of support programs',
    condition: 'hasROI',
    options: [
      'Negative ROI (costs exceed benefits)',
      'Break-even (costs and benefits roughly equal)',
      '1.1-2.0x ROI (benefits 10-100% more than costs)',
      '2.1-3.0x ROI (benefits 2-3x the costs)',
      '3.1-5.0x ROI (benefits 3-5x the costs)',
      '>5.0x ROI (benefits exceed 5x the costs)',
      'Unsure/Unable to quantify'
    ]
  },
  ei4: {
    type: 'textarea',
    label: 'What advice would you give other HR leaders about supporting employees with serious medical conditions?',
    maxLength: 1000,
    hasNone: true
  },
  ei5: {
    type: 'textarea',
    label: 'Are there important aspects of supporting employees not addressed in this survey?',
    maxLength: 500,
    hasNone: true
  }
}

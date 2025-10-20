export const currentSupportSchema = {
  cb3a: {
    type: 'select',
    label: 'How would you characterize your current cancer support program?',
    options: [
      'No specific program - standard benefits only',
      'Basic support through existing benefits',
      'Enhanced support with some specialized resources',
      'Comprehensive program with dedicated resources',
      'Leading-edge program with innovative solutions'
    ]
  },
  cb3b: {
    type: 'multiselect',
    label: 'Key Features of Current Cancer Support Program',
    options: [
      'Extended medical leave',
      'Flexible work arrangements',
      'Navigation/case management',
      'Financial assistance',
      'Emotional/mental health support',
      'Caregiver support',
      'Return-to-work programs',
      'Manager training',
      'Peer support groups',
      'Second opinion services',
      'Clinical trial support',
      'Travel/lodging assistance',
      'Legal/estate planning',
      'None of the above'
    ]
  },
  cb3c: {
    type: 'multiselect',
    label: 'Which conditions are covered by your support programs?',
    options: [
      'Cancer',
      'Heart disease',
      'Stroke',
      'Diabetes',
      'Mental health conditions',
      'Neurological conditions (MS, ALS, Parkinsons)',
      'Kidney disease',
      'Liver disease',
      'Lung disease',
      'Autoimmune conditions',
      'Rare diseases',
      'Long COVID',
      'All serious medical conditions',
      'Other'
    ],
    hasOther: true
  },
  cb3d: {
    type: 'multiselect',
    label: 'How are support programs communicated to employees?',
    options: [
      'Benefits enrollment materials',
      'Employee intranet/portal',
      'Email communications',
      'Manager communications',
      'Town halls/all-hands meetings',
      'New hire orientation',
      'Posters/digital signage',
      'Benefits app',
      'Not actively communicated'
    ]
  },
  or1: {
    type: 'select',
    label: 'Current Approach to Supporting Employees with Serious Medical Conditions',
    options: [
      'No formal approach - handled case by case',
      'Manager discretion with HR guidance',
      'Standardized process with some flexibility',
      'Formal program with defined benefits',
      'Comprehensive integrated support system'
    ]
  },
  or2a: {
    type: 'multiselect',
    label: 'What triggered development of enhanced support programs?',
    options: [
      'Employee diagnosed with cancer',
      'Leadership personal experience',
      'Employee feedback/surveys',
      'Competitive benchmarking',
      'DEI initiatives',
      'Retention concerns',
      'Productivity impacts',
      'Healthcare cost management',
      'Regulatory requirements',
      'Union negotiations',
      'Other'
    ],
    hasOther: true
  },
  or2b: {
    type: 'text',
    label: 'Most impactful change made to support programs',
    maxLength: 500
  },
  or3: {
    type: 'multiselect',
    label: 'Primary barriers to more comprehensive support',
    options: [
      'Budget constraints',
      'Limited HR resources',
      'Competing priorities',
      'Lack of executive support',
      'Complexity of implementation',
      'Geographic/regulatory variations',
      'Lack of expertise',
      'Concern about precedent/fairness',
      'Low perceived need',
      'Privacy/legal concerns',
      'Other'
    ],
    hasOther: true
  },
  or5a: {
    type: 'multiselect',
    label: 'Types of caregiver support provided',
    options: [
      'Paid caregiver leave',
      'Flexible work for caregivers',
      'Caregiver resource center',
      'Support groups',
      'Backup care services',
      'Elder care resources',
      'Legal/financial planning',
      'EAP for caregivers',
      'Manager training on caregiver support',
      'No specific caregiver support'
    ]
  },
  or6: {
    type: 'multiselect',
    label: 'How do you monitor program effectiveness while maintaining privacy?',
    options: [
      'Anonymous surveys',
      'Aggregate utilization data',
      'Focus groups',
      'Exit interviews',
      'Manager feedback',
      'Third-party program evaluation',
      'Return-to-work metrics',
      'Retention analysis',
      'Productivity metrics',
      'Healthcare cost analysis',
      'We don\'t currently measure',
      'Other'
    ],
    hasOther: true
  }
}

export const d6Schema = {
  d6a: {
    type: 'grid',
    label: 'Culture & Psychological Safety Programs',
    statusOptions: [
      'Currently offer',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to offer in foreseeable future'
    ],
    programs: [
      'Strong anti-discrimination policies specific to health conditions',
      'Clear process for confidential health disclosures',
      'Manager training on handling sensitive health information',
      'Written anti-retaliation policies for health disclosures',
      'Employee peer support groups (internal employees with shared experience)',
      'Professional-led support groups (external facilitator/counselor)',
      'Stigma-reduction initiatives',
      'Specialized emotional counseling',
      'Optional open health dialogue forums',
      'Inclusive communication guidelines',
      'Confidential HR channel for health benefits, policies and insurance-related questions',
      'Anonymous benefits navigation tool or website (no login required)'
    ]
  },
  d6aa: {
    type: 'select',
    label: 'Geographic Availability',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d6b: {
    type: 'textarea',
    label: 'Additional culture & psychological safety supports not listed',
    hasNone: true
  },
  d6_2: {
    type: 'multiselect',
    label: 'How do you measure psychological safety?',
    options: [
      'Employee surveys',
      'Focus groups',
      'Exit interviews',
      'Manager assessments',
      'HR metrics (complaints, disclosures)',
      'Utilization rates of support programs',
      'Return-to-work success rates',
      'We don\'t currently measure',
      'Other'
    ],
    hasOther: true
  }
}

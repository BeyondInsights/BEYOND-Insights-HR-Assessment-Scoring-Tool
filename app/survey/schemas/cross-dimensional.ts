export const crossDimensionalSchema = {
  cd1a: {
    type: 'multiselect',
    label: 'Select your TOP 3 priority dimensions for best outcomes',
    options: [
      'D1: Medical Leave & Flexibility',
      'D2: Insurance & Financial Protection',
      'D3: Manager Preparedness & Capability',
      'D4: Cancer Support Resources',
      'D5: Workplace Accommodations',
      'D6: Culture & Psychological Safety',
      'D7: Career Continuity & Advancement',
      'D8: Work Continuation & Resumption',
      'D9: Executive Commitment & Resources',
      'D10: Caregiver & Family Support',
      'D11: Prevention, Wellness & Legal Compliance',
      'D12: Continuous Improvement & Outcomes',
      'D13: Communication & Awareness'
    ],
    maxSelections: 3,
    minSelections: 3
  },
  cd1b: {
    type: 'multiselect',
    label: 'Select your BOTTOM 3 dimensions (lowest priority)',
    options: [
      'D1: Medical Leave & Flexibility',
      'D2: Insurance & Financial Protection',
      'D3: Manager Preparedness & Capability',
      'D4: Cancer Support Resources',
      'D5: Workplace Accommodations',
      'D6: Culture & Psychological Safety',
      'D7: Career Continuity & Advancement',
      'D8: Work Continuation & Resumption',
      'D9: Executive Commitment & Resources',
      'D10: Caregiver & Family Support',
      'D11: Prevention, Wellness & Legal Compliance',
      'D12: Continuous Improvement & Outcomes',
      'D13: Communication & Awareness'
    ],
    maxSelections: 3,
    minSelections: 3
  },
  cd2: {
    type: 'multiselect',
    label: 'What are your biggest implementation challenges?',
    options: [
      'Budget constraints',
      'Limited HR resources',
      'Competing priorities',
      'Lack of executive support',
      'Complexity of implementation',
      'Geographic/regulatory variations',
      'Lack of expertise/knowledge',
      'Concern about precedent/fairness',
      'Low perceived need',
      'Privacy/legal concerns',
      'Technology/systems limitations',
      'Change management',
      'Manager resistance',
      'Employee awareness/utilization',
      'Other'
    ],
    hasOther: true
  }
}

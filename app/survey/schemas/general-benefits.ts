export const generalBenefitsSchema = {
  cb1_standard: {
    type: 'multiselect',
    label: 'Standard Benefits Currently Offered',
    category: 'Standard Benefits',
    options: [
      'Medical/health insurance',
      'Dental insurance',
      'Vision insurance',
      'Prescription drug coverage',
      'Mental health coverage',
      'Life insurance',
      'Accidental death & dismemberment',
      'Short-term disability',
      'Long-term disability'
    ]
  },
  cb1_leave: {
    type: 'multiselect',
    label: 'Leave & Flexibility Benefits',
    category: 'Leave & Time Off',
    options: [
      'Paid time off (PTO/vacation)',
      'Sick leave',
      'Personal days',
      'Bereavement leave',
      'Parental leave',
      'Family/medical leave',
      'Sabbatical options',
      'Flexible work arrangements',
      'Remote work options'
    ]
  },
  cb1_wellness: {
    type: 'multiselect',
    label: 'Wellness & Support Programs',
    category: 'Wellness',
    options: [
      'Employee assistance program (EAP)',
      'Wellness programs',
      'Preventive care coverage',
      'Health screenings',
      'Vaccination programs',
      'Gym membership/fitness benefits',
      'Nutrition programs',
      'Smoking cessation',
      'Stress management'
    ]
  },
  cb1_financial: {
    type: 'multiselect',
    label: 'Financial & Legal Benefits',
    category: 'Financial',
    options: [
      '401(k) or retirement plan',
      'Employer retirement contributions',
      'Financial planning services',
      'Legal insurance/services',
      'Identity theft protection',
      'Employee stock purchase plan',
      'Tuition reimbursement',
      'Student loan assistance'
    ]
  },
  cb1a: {
    type: 'select',
    label: 'Percentage of Employees with National Healthcare Access',
    options: [
      'Less than 25%',
      '25-49%',
      '50-74%',
      '75-99%',
      '100%',
      'Not applicable'
    ]
  },
  cb2b: {
    type: 'select',
    label: 'Plans to Roll Out Enhanced Support in Next 2 Years',
    options: [
      'Yes',
      'No',
      'Under consideration'
    ]
  }
}

export const d11Schema = {
  d11a: {
    type: 'grid',
    label: 'Prevention, Wellness & Legal Compliance Programs',
    statusOptions: [
      'Currently offer',
      'In active planning / development',
      'Assessing feasibility',
      'Not able to offer in foreseeable future'
    ],
    programs: [
      'At least 70% coverage for regionally / locally recommended screenings',
      'Full or partial coverage for annual health screenings/checkups',
      'Targeted risk-reduction programs',
      'Paid time off for preventive care appointments',
      'Legal protections beyond requirements',
      'Workplace safety assessments to minimize health risks',
      'Regular health education sessions',
      'Individual health assessments (online or in-person)',
      'Genetic screening/counseling',
      'On-site vaccinations',
      'Lifestyle coaching programs',
      'Risk factor tracking/reporting',
      'Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)'
    ]
  },
  d11aa: {
    type: 'select',
    label: 'Geographic Availability',
    condition: 'multiCountry',
    options: [
      'Only available in select locations',
      'Vary across locations',
      'Generally consistent across all locations'
    ]
  },
  d11b: {
    type: 'textarea',
    label: 'Additional prevention/wellness initiatives not listed',
    hasNone: true
  },
  d11_1: {
    type: 'multiselect',
    label: 'Early detection & preventive services covered at 70% or more',
    condition: 'offersProgram:At least 70% coverage for regionally / locally recommended screenings',
    categories: {
      'Screenings': [
        'Cervical cancer screening (Pap smear/HPV test)',
        'Colonoscopy (colorectal cancer)',
        'Dense breast tissue screening (ultrasound/MRI)',
        'Gastric / stomach cancer screening',
        'H. pylori testing',
        'Liver cancer screening (AFP test + ultrasound)',
        'Lung cancer screening (low-dose CT for high risk)',
        'Mammograms (breast cancer)',
        'Oral cancer screening',
        'Prostate cancer screening (PSA test)',
        'Skin cancer screening/full body exam',
        'Tuberculosis screening',
        'Other screening'
      ],
      'Genetic Testing & Counseling': [
        'BRCA testing (breast/ovarian cancer risk)',
        'Lynch syndrome testing (colorectal cancer risk)',
        'Multi-gene panel testing',
        'Genetic counseling services',
        'Other genetic testing'
      ],
      'Preventive Vaccines': [
        'HPV vaccines (cervical cancer prevention)',
        'Hepatitis B vaccines (liver cancer prevention)',
        'COVID-19 vaccines',
        'Influenza vaccines',
        'Pneumonia vaccines',
        'Shingles vaccines',
        'Other preventive vaccines'
      ]
    },
    hasOther: true
  }
}

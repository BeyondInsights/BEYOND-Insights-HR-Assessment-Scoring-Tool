export const firmographicsSchema = {
  s1: {
    type: 'text',
    label: 'First Name',
    required: true
  },
  s2: {
    type: 'text',
    label: 'Last Name',
    required: true
  },
  s3: {
    type: 'text',
    label: 'Job Title',
    required: true
  },
  s4a: {
    type: 'select',
    label: 'Primary Department',
    options: [
      'Human Resources',
      'Benefits/Compensation',
      'People & Culture',
      'Talent Management',
      'Total Rewards',
      'Operations',
      'Finance',
      'Legal',
      'Other'
    ],
    hasOther: true,
    required: true
  },
  s4b: {
    type: 'select',
    label: 'Primary Job Function',
    options: [
      'Benefits Design & Administration',
      'Compensation & Rewards',
      'HR Business Partner',
      'HR Operations',
      'People Analytics',
      'Talent Acquisition',
      'Learning & Development',
      'Diversity, Equity & Inclusion',
      'Employee Relations',
      'Other'
    ],
    hasOther: true,
    required: true
  },
  s5: {
    type: 'select',
    label: 'Current Level',
    options: [
      'C-Suite/Executive',
      'Senior Vice President',
      'Vice President',
      'Director',
      'Senior Manager',
      'Manager',
      'Individual Contributor',
      'Other'
    ],
    required: true
  },
  s6: {
    type: 'multiselect',
    label: 'Areas of Responsibility',
    options: [
      'Benefits strategy',
      'Benefits administration',
      'Leave management',
      'Disability/accommodation management',
      'Wellness programs',
      'Employee assistance programs',
      'Compensation',
      'HR policy',
      'Other'
    ],
    hasOther: true,
    required: true
  },
  s7: {
    type: 'select',
    label: 'Level of Influence on Benefits Decisions',
    options: [
      'Final decision maker',
      'Significant influence/recommender',
      'Some influence/contributor',
      'Limited influence',
      'No influence'
    ],
    required: true
  },
  s8: {
    type: 'select',
    label: 'Total Global Employee Size',
    options: [
      'Under 500',
      '500-999',
      '1,000-4,999',
      '5,000-9,999',
      '10,000-24,999',
      '25,000-49,999',
      '50,000-99,999',
      '100,000+'
    ],
    required: true
  },
  s9: {
    type: 'select',
    label: 'Headquarters Location (Country)',
    options: [
      'United States',
      'Canada',
      'United Kingdom',
      'Germany',
      'France',
      'Netherlands',
      'Switzerland',
      'Sweden',
      'Australia',
      'New Zealand',
      'Japan',
      'Singapore',
      'Hong Kong',
      'China',
      'India',
      'Brazil',
      'Mexico',
      // Add more countries as needed
      'Other'
    ],
    hasOther: true,
    required: true
  },
  s9a: {
    type: 'select',
    label: 'Number of Countries with Employee Presence',
    options: [
      'No other countries - headquarters only',
      '2-5 countries',
      '6-10 countries',
      '11-25 countries',
      '26-50 countries',
      '51-100 countries',
      'More than 100 countries'
    ],
    required: true
  }
}

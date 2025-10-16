// /data/descriptor-map.ts
// Short human descriptors for items (id → label). Anything not listed is auto-shortened.

export const SHORT_LABELS: Record<string, string> = {
  // ===== Firmographics & Classification =====
  companyName: 'Company Name',
  s3: 'Department',
  s4: 'Primary Job Function',
  s5: 'Current Level',
  s6: 'Areas of Responsibility',
  s7: 'Benefits Influence',
  s8: 'Employee Size',
  s9: 'Headquarters',
  s9a: 'Countries with Employees',
  c1: 'Legal Name',
  c2: 'Industry',
  c3: 'Excluded Employee Groups',
  c4: 'Annual Revenue',
  c5: 'Healthcare Access',
  c6: 'Remote/Hybrid Policy',
  c7: 'Union/Works Council',
  hq: 'Headquarters',

  // ===== General Benefits (examples – extend as needed) =====
  'CB1.1': 'Health Insurance (Medical)',
  'CB1.2': 'Dental',
  'CB1.3': 'Vision',
  'CB1.4': 'EAP',
  'CB2.1': 'STD (Paid)',
  'CB2.2': 'LTD',
  'CB2.3': 'Leave Beyond Statutory',
  'CB3.1': 'Travel/Lodging for Care',
  'CB3.2': 'Clinical Trials Support',
  'CB3.3': 'Second Opinion/Expert Review',

  // ===== Current Support / OR (examples) =====
  CS1: 'Global Policy Availability',
  CS2: 'Regional Variations',
  CS3: 'Documentation/Guides',

  // ===== Cross-Dimensional (examples) =====
  CD1a: 'Cross-Dept Coordination',
  CD1b: 'Navigation Ownership',
  CD2: 'Measurement Approach',

  // ===== Employee Impact (examples) =====
  EI1: 'Retention Impact',
  EI2: 'Absence Impact',
  EI3: 'Performance Impact',
  EI5: 'Return-to-Work Quality',

  // ===== Dimension examples (add any exact wordings you want) =====
  D2_TRAVEL: 'Travel/Lodging Coverage',
  D2_TRIALS: 'Clinical Trials Coverage',
  D2_OOP_MAX: 'OOP Maximums',
  D2_DISABILITY: 'Disability %',
  D3_TRAINING: 'Manager Training',
  D3_TALK_TRACKS: 'Talk Tracks/Guides',
};

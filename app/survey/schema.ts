// app/survey/schema.ts

/* ===== Brand ===== */
export const BRAND = {
  primary: '#6B2C91',
  orange: '#EA580C',
  gray: { 900:'#0F172A', 700:'#334155', 600:'#475569', 500:'#64748B', 400:'#94A3B8', 300:'#CBD5E1', 200:'#E5E7EB', 100:'#F3F4F6', 50:'#F9FAFB' }
};

/* Distinct accent colors for the 13 dimension badges */
export const DIM_COLORS: string[] = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
  '#84CC16', '#A855F7', '#EAB308'
];

/* ===== Global scale legends (from instrument) ===== */
export const SCALE_DX = [
  'Not able to offer in foreseeable future',
  'Assessing feasibility',
  'In active planning / development',
  'Currently offer',
];

export const SCALE_D13 = [
  'Not able to utilize in foreseeable future',
  'Assessing feasibility',
  'In active planning / development',
  'Currently use',
  'Unsure',
];

/* ===== Types ===== */
export type Q = {
  id: string;
  label: string;
  required?: boolean;
  conditional?: string;
  type: 'single'|'multi'|'text'|'scale';
  options?: string[];
  note?: string;
};

export type Section = { id: string; title: string; questions: Q[] };

export type DimBlock = {
  number: number;
  title: string;
  intro: string;                 // dimension definition/lead-in
  questionText: string;          // the D#.a prompt line
  scale: string[];               // the per-dimension scale legend
  supportOptions: string[];      // rows (shown ONCE)
  followUps: Q[];
};

/* ===== Sections ===== */
export const FIRMOGRAPHICS: Section = {
  id: 'firmographics',
  title: 'Company Profile',
  questions: [
    { id:'company_name', label:'Company Name', required:true, type:'text' },
    { id:'industry', label:'Industry', required:true, type:'single', options:['Manufacturing','Technology','Healthcare','Financial Services','Retail','Other (specify)'] },
    { id:'revenue', label:'Annual Revenue (USD)', type:'single', options:['< $50M','$50M–$250M','$250M–$1B','$1B–$5B','$5B+'] },
    { id:'size', label:'Total Employee Size (global)', required:true, type:'single', options:['1–99','100–499','500–4,999','5,000–24,999','25,000+'] },
    { id:'hq', label:'Headquarters (City, Country)', type:'text' },
    { id:'countries', label:'Countries with Employee Presence', type:'text', note:'List primary countries or count' },
    { id:'remote_policy', label:'Remote/Hybrid Work Policy', type:'single', options:['On-site','Hybrid','Remote-eligible','Role-dependent'] },
    // POC
    { id:'poc_name', label:'Point of Contact — Name', required:true, type:'text' },
    { id:'poc_email', label:'Point of Contact — Email', required:true, type:'text' },
    { id:'poc_dept', label:'Point of Contact — Department / Function', type:'text' },
    { id:'poc_level', label:'Point of Contact — Level', type:'single', options:['Coordinator / Specialist','Manager','Director','VP / SVP','C-suite'] },
  ],
};

export const GENERAL_BENEFITS: Section = {
  id: 'general_benefits',
  title: 'General Employee Benefits',
  questions: [
    { id:'nh_access', label:'% of Employees with National / Government Healthcare Access', type:'single', options:['0%','1–24%','25–49%','50–74%','75–99%','100%'] },
    { id:'eligible_std', label:'% of Employees Eligible for Standard Benefits', required:true, type:'single', options:['< 25%','25–49%','50–74%','75–89%','90%+'] },
    { id:'std_benefits', label:'Standard Benefits Package', type:'multi', options:['Medical','Dental','Vision','EAP','Life/AD&D','Retirement','Legal','Other (specify)'] },
    { id:'leave_flex', label:'Leave & Flexibility Programs', type:'multi', options:['Paid medical leave beyond legal minimums','Intermittent leave','Reduced schedule/part-time w/ benefits','Remote work options for on-site roles','Shift / schedule modifications','Phased return-to-work','Other (specify)'] },
    { id:'wellness_support', label:'Wellness & Support Programs', type:'multi', options:['Mental health counseling','Peer support groups','Health coaching','On-site/virtual fitness','Financial wellness','Other (specify)'] },
    { id:'financial_legal', label:'Financial & Legal Assistance', type:'multi', options:['Financial counseling','Hardship grants','Legal assistance','Cost-estimator tools','Other (specify)'] },
    { id:'navigation_support', label:'Care Navigation & Support', type:'multi', options:['Benefits navigator / care coordinator','Cancer-specific navigation','Second-opinion services','Clinical trial matching','Other (specify)'] },
    { id:'planned', label:'Planned Enhancements (Next 24 Months)', type:'text' },
  ],
};

export const CURRENT_SUPPORT: Section = {
  id: 'current_support',
  title: 'Current Support for Employees Managing Cancer (EMCs)',
  questions: [
    { id:'program_status', label:'Status of Cancer Support Offerings', type:'single', options:['Comprehensive','In development','Early assessment','Not offered'] },
    { id:'approach', label:'Current Approach to Supporting EMCs', type:'text' },
    { id:'exclusions', label:'Employee Groups Excluded from Support', type:'multi', options:['Contractors','Part-time','Hourly','Temporary','Union-excluded','None'] },
    { id:'triggers', label:'Triggers for Developing Programs', type:'multi', options:['Employee request','Leadership directive','Benchmarking gap','Cost trend','Legal/compliance','Other (specify)'] },
    { id:'impactful_change', label:'Most Impactful Change Made', type:'text' },
    { id:'barriers', label:'Barriers to Development', type:'multi', options:['Budget','Bandwidth','Lack of executive support','Vendor uncertainty','Global consistency','Other (specify)'] },
    { id:'caregiver', label:'Caregiver Support Features', type:'multi', options:['Caregiver leave','Flexible scheduling','Backup care','Support groups','Counseling for family','Other (specify)'] },
    { id:'monitoring', label:'How Program Effectiveness is Monitored', type:'multi', options:['Satisfaction surveys','Utilization analytics','RTW metrics','Cost/outcomes tracking','Benchmarking','Other (specify)'] },
  ],
};

/* ===== Dimension content: official wording, description, scale, rows, follow-ups ===== */
const intro = {
  1: 'Time off policies and schedule adaptations that enable employees to receive treatment without sacrificing job security or income.',
  2: 'Financial protections that prevent economic hardship during treatment, including comprehensive coverage and expense assistance.',
  3: 'Training and resources that equip managers to support employees managing cancer or other serious health conditions.',
  4: 'Professionals providing healthcare coordination and guidance, including benefits understanding and access to expert support.',
  5: 'Workplace changes enabling continued productivity during/after treatment (physical modifications, scheduling, tech).',
  6: 'Environment where employees feel safe, protected from discrimination, and supported without judgment.',
  7: 'Protections for advancement and development during and after treatment.',
  8: 'Structured, supportive processes to continue/resume work during/after treatment and manage ongoing needs.',
  9: 'Visible executive engagement and resourcing for workplace support programs.',
  10: 'Support for employees who are caregivers through flexible arrangements and dedicated resources.',
  11: 'Proactive health programs, legal protections beyond minimums, and workplace safety measures.',
  12: 'Systematic measurement, feedback integration, and program evolution based on outcomes.',
  13: 'How organizations inform, educate, and engage employees about workplace support programs.',
};

const question = {
  1: 'Please indicate the status of each support option within your organization (select ONE per option).',
  2: 'Please indicate the status of each support option within your organization (select ONE per option).',
  3: 'Please indicate the status of each support option for managers (select ONE per option).',
  4: 'Please indicate the status of each support option within your organization (select ONE per option).',
  5: 'Please indicate the status of each workplace accommodation (select ONE per option).',
  6: 'Please indicate the status of each culture/safety option (select ONE per option).',
  7: 'Please indicate the status of each career continuity/advancement option (select ONE per option).',
  8: 'Please indicate the status of each work continuation/resumption option (select ONE per option).',
  9: 'Please indicate the current status of each executive commitment element (select ONE per element).',
  10: 'Please indicate the current status of each caregiver support benefit (select ONE per benefit).',
  11: 'Please indicate the current status of each prevention/wellness element (select ONE per element).',
  12: 'Please indicate the current status of each measurement/outcome element (select ONE per element).',
  13: 'Please indicate the current status of each communication approach (select ONE per approach).',
};

export const DIM_SUPPORT: Record<number,string[]> = {
  1: [
    'Paid medical leave beyond local / legal requirements',
    'Intermittent leave beyond local /  legal requirements',
    'Flexible work hours during treatment (e.g., varying start / end times, compressed schedules)',
    'Remote work options for on-site employees',
    'Reduced schedule/part-time with full benefits',
    'Job protection beyond local / legal requirements',
    'Emergency leave within 24 hours',
    'Leave donation bank (employees can donate PTO to colleagues)',
    'Disability pay top-up (employer adds to disability insurance)',
    'PTO accrual during leave',
    'Paid micro-breaks for side effects',
  ],
  2: [
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
    'Accelerated life insurance benefits (partial payout for terminal / critical illness)',
  ],
  3: [
    'Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams',
    'Clear escalation protocol for manager response',
    'Dedicated manager resource hub',
    'Empathy/communication skills training',
    'Legal compliance training',
    'Senior leader coaching on supporting impacted employees',
    'Manager evaluations include how well they support impacted employees',
    'Manager peer support / community building',
    'AI-powered guidance tools',
    'Privacy protection and confidentiality management',
  ],
  4: [
    'Dedicated navigation support to help employees understand benefits and access medical care',
    'Benefits optimization assistance (maximizing coverage, minimizing costs)',
    'Insurance advocacy/appeals support',
    'Clinical trial matching service',
    'Care coordination concierge',
    'Online tools, apps, or portals for health/benefits support',
    'Survivorship planning assistance',
    'Nutrition coaching',
    'Physical rehabilitation support',
    'Occupational therapy/vocational rehabilitation',
  ],
  5: [
    'Physical workspace modifications',
    'Cognitive / fatigue support tools',
    'Ergonomic equipment funding',
    'Flexible scheduling options',
    'Remote work capability',
    'Rest areas / quiet spaces',
    'Priority parking',
    'Temporary role redesigns',
    'Assistive technology catalog',
    'Transportation reimbursement',
    'Policy accommodations (e.g., dress code flexibility, headphone use)',
  ],
  6: [
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
    'Anonymous benefits navigation tool or website (no login required)',
  ],
  7: [
    'Continued access to training/development',
    'Structured reintegration programs',
    'Peer mentorship program (employees who had similar condition mentoring current employees)',
    'Professional coach/mentor for employees managing cancer or other serious health conditions',
    'Adjusted performance goals/deliverables during treatment and recovery',
    'Career coaching for employees managing cancer or other serious health conditions',
    'Succession planning protections',
    'Project continuity protocols',
    'Optional stay-connected program',
  ],
  8: [
    'Flexible work arrangements during treatment',
    'Phased return-to-work plans',
    'Workload adjustments during treatment',
    'Flexibility for medical setbacks',
    'Buddy/mentor pairing for support',
    'Structured progress reviews',
    'Contingency planning for treatment schedules',
    'Long-term success tracking',
    'Access to occupational therapy/vocational rehabilitation',
    'Online peer support forums',
    'Access to specialized work resumption professionals',
    'Manager training on supporting team members during treatment/return',
  ],
  9: [
    'Executive accountability metrics',
    'Public success story celebrations',
    'Compensation tied to support outcomes',
    'ESG/CSR reporting inclusion',
    'Year-over-year budget growth',
    'Executive sponsors communicate regularly about workplace support programs',
    'Dedicated budget allocation for serious illness support programs',
    'C-suite executive serves as program champion/sponsor',
    'Support programs included in investor/stakeholder communications',
    'Cross-functional executive steering committee for workplace support programs',
    'Support metrics included in annual report/sustainability reporting',
  ],
  10: [
    'Paid caregiver leave with expanded eligibility (beyond local legal requirements)',
    'Flexible work arrangements for caregivers',
    'Dependent care subsidies',
    'Emergency caregiver funds',
    'Dependent care account matching/contributions',
    'Family navigation support',
    'Caregiver peer support groups',
    'Mental health support specifically for caregivers',
    'Manager training for supervising caregivers',
    'Practical support for managing caregiving and work',
    'Emergency dependent care when regular arrangements unavailable',
    'Respite care funding/reimbursement',
    'Caregiver resource navigator/concierge',
    'Legal/financial planning assistance for caregivers',
    'Modified job duties during peak caregiving periods',
    'Unpaid leave job protection beyond local / legal requirements',
    'Eldercare consultation and referral services',
    'Paid time off for care coordination appointments',
    'Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)',
  ],
  11: [
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
    'Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)',
  ],
  12: [
    'Return-to-work success metrics',
    'Employee satisfaction tracking',
    'Business impact/ROI assessment',
    'Regular program enhancements',
    'External benchmarking',
    'Innovation pilots',
    'Employee confidence in employer support',
    'Program utilization analytics',
  ],
  13: [
    'Proactive communication at point of diagnosis disclosure',
    'Dedicated program website or portal',
    'Regular company-wide awareness campaigns (at least quarterly)',
    'New hire orientation coverage',
    'Manager toolkit for cascade communications',
    'Employee testimonials/success stories',
    'Multi-channel communication strategy',
    'Family/caregiver communication inclusion',
    'Anonymous information access options',
  ],
};

/* Follow-ups pulled from instrument (short set here; extend as needed) */
export const DIM_FOLLOWUPS: Record<number, Q[]> = {
  1: [
    { id:'d1_1', label:'Beyond legally required leave, how much additional paid medical leave do you provide (USA / Non-USA)?', type:'text' },
    { id:'d1_4a', label:'Additional remote work time for on-site roles (beyond policy/legal)', type:'text' },
    { id:'d1_4b', label:'Duration allowed for reduced schedule with full benefits', type:'text' },
    { id:'d1_5', label:'Guaranteed job protection (weeks beyond legal)', type:'text' },
  ],
  2: [
    { id:'d2_1', label:'Additional insurance coverage details', type:'text' },
    { id:'d2_2', label:'How financial protection effectiveness is measured', type:'text' },
    { id:'d2_5', label:'Health insurance premium handling during medical leave', type:'text' },
    { id:'d2_6', label:'Financial counseling provider', type:'text' },
  ],
  3: [
    { id:'d3_1a', label:'Is manager training mandatory / recommended / optional?', type:'single', options:['Mandatory','Recommended','Optional','Varies'] },
    { id:'d3_1',  label:'% managers completed training (past 2 years)', type:'single', options:['<10%','10–24%','25–49%','50–74%','75–99%','100%','Unsure','Do not track'] },
  ],
  4: [{ id:'d4_1', label:'Who provides navigation support (internal, vendor, carrier, provider, partner)?', type:'multi', options:['Internal credentialed staff','External vendor','Through carrier','Specialized medical provider','Partner org','Other'] }],
  5: [],
  6: [{ id:'d6_2', label:'How do you measure psychological safety?', type:'multi', options:['Pulse surveys','Focus groups','Exit interview data','Manager feedback','1:1 discussions','Other','Don’t measure'] }],
  7: [], 8: [], 9: [],
  10: [{ id:'d10_1', label:'Caregiver program eligibility details', type:'text' }],
  11: [{ id:'d11_1', label:'Which preventive services covered at 100%? (screenings, vaccines, genetic testing)', type:'text' }],
  12: [
    { id:'d12_1', label:'Data sources used to measure effectiveness', type:'multi', options:['Surveys','Utilization data','Cost/outcomes','Benchmarks','Vendor reports','Other'] },
    { id:'d12_2', label:'How employee feedback is incorporated', type:'text' },
  ],
  13: [{ id:'d13_1', label:'Frequency of awareness campaigns', type:'single', options:['Monthly','Quarterly','Bi-annually','Annually','Ad-hoc'] }],
};

/* Compose final dimension blocks with official wording + scale */
export const DIMENSIONS: DimBlock[] = Array.from({length:13}, (_,i) => {
  const n = i+1;
  return {
    number: n,
    title: [
      'Medical Leave & Flexibility','Insurance & Financial Protection','Manager Preparedness & Capability',
      'Navigation & Expert Resources','Workplace Accommodations','Culture & Psychological Safety',
      'Career Continuity & Advancement','Return-to-Work Excellence','Executive Commitment & Resources',
      'Caregiver & Family Support','Prevention, Wellness & Legal Compliance','Continuous Improvement & Outcomes',
      'Communication & Awareness'
    ][i],
    intro: intro[n],
    questionText: question[n],
    scale: n===13 ? SCALE_D13 : SCALE_DX,
    supportOptions: (DIM_SUPPORT[n] || []),
    followUps: (DIM_FOLLOWUPS[n] || []),
  };
});

/* Cross-Dim + EI sections */
export const CROSS_DIM: Section = {
  id: 'cross_dim',
  title: 'Cross-Dimensional Assessment',
  questions: [
    { id:'cd1a', label:'Top 3 Dimensions (Best Outcomes)', type:'multi' },
    { id:'cd1b', label:'Bottom 3 Dimensions (Lowest Priority)', type:'multi' },
    { id:'cd2',  label:'Implementation Challenges', type:'multi', options:['Budget/resource constraints','Lack of executive support','Complex/varying legal requirements','Manager capability/training gaps','Employee privacy concerns','Difficulty measuring effectiveness','Low employee awareness','Administrative complexity','Inconsistent application','Cultural stigma','Integration with HR systems','Competing priorities','Limited expertise','Global consistency','Other (specify)'] },
  ],
};

export const EI: Section = {
  id: 'ei',
  title: 'Employee Impact (EI) Assessment',
  questions: [
    { id:'ei1',  label:'Positive outcomes observed as a result of workplace support programs', type:'scale', options:['No positive impact','Minimal positive impact','Moderate positive impact','Significant positive impact','Unable to assess'] },
    { id:'ei1a', label:'Impact on Absenteeism', type:'scale', options:['Worse','Slightly worse','No change','Slightly better','Much better'] },
    { id:'ei1b', label:'Impact on Job Performance', type:'scale', options:['Worse','Slightly worse','No change','Slightly better','Much better'] },
    { id:'ei1c', label:'Impact on Healthcare Costs', type:'scale', options:['Increases','Slightly increases','No change','Slightly decreases','Decreases'] },
    { id:'ei2',  label:'ROI Analysis Status', type:'single', options:['Yes — comprehensive','Yes — basic','In progress','Planned','No plans'] },
    { id:'ei3',  label:'Approximate ROI (if measured)', type:'single', options:['Negative ROI','Break-even','1.1–2.0x','2.1–3.0x','3.1–5.0x','> 5.0x'] },
    { id:'ei4',  label:'Advice to other HR leaders (open-ended)', type:'text' },
    { id:'ei5',  label:'Other important aspects not addressed (open-ended)', type:'text' },
  ],
};

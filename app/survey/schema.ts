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

/* ===== Scale legends used in the app ===== */
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
  id: string;                        // app key (e.g., c2, cb1a, or2b, ei3)
  label: string;                     // on-screen wording
  type: 'single'|'multi'|'scale'|'open'; // EXACT response style used in app
  options?: string[];                // for single/multi/scale when applicable
  required?: boolean;
  conditional?: string;
  note?: string;
};

export type Section = { id: string; title: string; questions: Q[] };

export type DimBlock = {
  number: number;
  title: string;
  intro: string;                 // 1–2 line dimension description
  questionText: string;          // D#.a prompt line
  scale: string[];               // legend (DX vs D13)
  supportOptions: string[];      // the list to be rated (shown ONCE)
  followUps: Q[];                // only app follow-ups
};

/* ===== Company Profile (only app keys) ===== */
export const FIRMOGRAPHICS: Section = {
  id: 'firmographics',
  title: 'Company Profile',
  questions: [
    { id:'companyName', label:'Company Name', type:'open', required:true },
    { id:'c2',          label:'Industry',      type:'single', required:true,
      options:['Manufacturing','Technology','Healthcare','Financial Services','Retail','Other (specify)'] },
    { id:'c5',          label:'Annual Revenue (USD)', type:'single',
      options:['< $50M','$50M–$250M','$250M–$1B','$1B–$5B','$5B+'] },
    { id:'s8',          label:'Total Employee Size (global)', type:'single', required:true,
      options:['1–99','100–499','500–4,999','5,000–24,999','25,000+'] },
    { id:'s9',          label:'Headquarters Location', type:'open' },
    { id:'s9a',         label:'Countries with Employee Presence', type:'open', note:'List primary countries or count' },
    { id:'c6',          label:'Remote/Hybrid Work Policy', type:'single',
      options:['On-site','Hybrid','Remote-eligible','Role-dependent'] },
  ],
};

/* ===== General Employee Benefits (only app keys) ===== */
export const GENERAL_BENEFITS: Section = {
  id: 'general_benefits',
  title: 'General Employee Benefits',
  questions: [
    { id:'cb1a',          label:'% of Employees with National / Government Healthcare Access', type:'single',
      options:['0%','1–24%','25–49%','50–74%','75–99%','100%'] },
    { id:'c4',            label:'% of Employees Eligible for Standard Benefits', type:'single',
      options:['< 25%','25–49%','50–74%','75–89%','90%+'] },
    { id:'cb1_standard',  label:'Standard Benefits Package', type:'multi',
      options:['Medical','Dental','Vision','EAP','Life/AD&D','Retirement','Legal','Other (specify)'] },
    { id:'cb1_leave',     label:'Leave & Flexibility Programs', type:'multi',
      options:['Paid medical leave beyond legal minimums','Intermittent leave','Reduced schedule/part-time with benefits','Remote work options (on-site roles)','Shift / schedule modifications','Phased return-to-work','Other (specify)'] },
    { id:'cb1_wellness',  label:'Wellness & Support Programs', type:'multi',
      options:['Mental health counseling','Peer support groups','Health coaching','On-site/virtual fitness','Financial wellness','Other (specify)'] },
    { id:'cb1_financial', label:'Financial & Legal Assistance', type:'multi',
      options:['Financial counseling','Hardship grants','Legal assistance','Cost-estimator tools','Other (specify)'] },
    { id:'cb1_navigation',label:'Care Navigation & Support', type:'multi',
      options:['Benefits navigator / care coordinator','Cancer-specific navigation','Second-opinion services','Clinical trial matching','Other (specify)'] },
    { id:'cb4',           label:'Planned Enhancements (Next 24 Months)', type:'open' },
  ],
};

/* ===== Current Support for EMCs (only app keys) ===== */
export const CURRENT_SUPPORT: Section = {
  id: 'current_support',
  title: 'Current Support for Employees Managing Cancer (EMCs)',
  questions: [
    { id:'cb3a', label:'Cancer Support Program Characterization', type:'single',
      options:['Comprehensive','In development','Early assessment','Not offered'] },
    { id:'or1',  label:'Current Approach to Supporting EMCs', type:'open' },
    { id:'c3',   label:'% of Employees Excluded from Support', type:'single',
      options:['0%','1–4%','5–9%','10–24%','25%+','Unsure'] },
    { id:'c4',   label:'Employee Groups Excluded from Support', type:'multi',
      options:['Contractors','Part-time','Hourly','Temporary','Union-excluded','None','Other (specify)'] },
    { id:'or2a', label:'Triggers for Developing Programs', type:'multi',
      options:['Employee request','Leadership directive','Benchmarking gap','Cost trend','Legal/compliance','Other (specify)'] },
    { id:'or2b', label:'Most Impactful Change Made', type:'open' },
    { id:'or3',  label:'Available Support Resources', type:'multi',
      options:['Counseling','Peer groups','Financial support','Navigator','Vendor programs','Other (specify)'] },
    { id:'or4',  label:'Barriers to Enhanced Support', type:'multi',
      options:['Budget','Bandwidth','Lack of executive sponsor','Vendor uncertainty','Global consistency','Other (specify)'] },
    { id:'or5a', label:'Caregiver Program Features', type:'multi',
      options:['Caregiver leave','Flexible scheduling','Backup care','Support groups','Counseling for family','Other (specify)'] },
    { id:'or6',  label:'How Program Effectiveness is Monitored', type:'multi',
      options:['Satisfaction surveys','Utilization analytics','RTW metrics','Cost/outcomes tracking','Benchmarking','Other (specify)'] },
  ],
};

/* ===== Dimension descriptions and prompts (from your app copy) ===== */
const INTRO: Record<number,string> = {
  1:'Time off and flexibility enabling treatment without risking job or income.',
  2:'Financial protections preventing hardship during treatment.',
  3:'Manager capability and resources to support employees.',
  4:'Navigation and expert resources to coordinate care/benefits.',
  5:'Practical accommodations to keep work feasible.',
  6:'Culture that protects, includes, and reduces stigma.',
  7:'Career continuity and advancement protections.',
  8:'Return-to-work structures and support.',
  9:'Executive commitment and resourcing.',
  10:'Caregiver and family support.',
  11:'Prevention, wellness, and legal compliance.',
  12:'Continuous improvement and outcomes.',
  13:'Communication and awareness of support.',
};

const PROMPT: Record<number,string> = {
  1:'For each option below, select ONE status.',
  2:'For each option below, select ONE status.',
  3:'For each option below, select ONE status.',
  4:'For each option below, select ONE status.',
  5:'For each option below, select ONE status.',
  6:'For each option below, select ONE status.',
  7:'For each option below, select ONE status.',
  8:'For each option below, select ONE status.',
  9:'For each option below, select ONE status.',
  10:'For each option below, select ONE status.',
  11:'For each option below, select ONE status.',
  12:'For each option below, select ONE status.',
  13:'For each option below, select ONE status.',
};

/* ===== Dimension support options (from app) ===== */
export const DIM_SUPPORT: Record<number,string[]> = {
  1: [ 'Paid medical leave beyond local / legal requirements','Intermittent leave beyond local / legal requirements','Flexible work hours during treatment (e.g., varying start / end times, compressed schedules)','Remote work options for on-site employees','Reduced schedule / part-time with full benefits','Job protection beyond local / legal requirements','Emergency leave within 24 hours','Leave donation bank (employees can donate PTO to colleagues)','Disability pay top-up (employer adds to disability insurance)','PTO accrual during leave','Paid micro-breaks for medical-related side effects' ],
  2: [ 'Coverage for clinical trials and experimental treatments not covered by standard health insurance','Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance','Paid time off for clinical trial participation','Set out-of-pocket maximums (for in-network single coverage)','Travel / lodging reimbursement for specialized care beyond insurance coverage','Financial counseling services','Voluntary supplemental illness insurance (with employer contribution)','Real-time cost estimator tools','Insurance advocacy / pre-authorization support','$0 copay for specialty drugs','Hardship grants program funded by employer','Tax / estate planning assistance','Short-term disability covering 60%+ of salary','Long-term disability covering 60%+ of salary','Employer-paid disability insurance supplements','Guaranteed job protection','Accelerated life insurance benefits (partial payout for terminal / critical illness)' ],
  3: [ 'Manager training on supporting employees managing cancer or other serious health conditions / illnesses and their teams','Clear escalation protocol for manager response','Dedicated manager resource hub','Empathy / communication skills training','Legal compliance training','Senior leader coaching on supporting impacted employees','Manager evaluations include how well they support impacted employees','Manager peer support / community building','AI-powered guidance tools','Privacy protection and confidentiality management' ],
  4: [ 'Dedicated benefits navigator / care coordinator','Cancer-specific navigation services','Legal / regulatory guidance','Second opinion services','Clinical trial matching services','Fertility preservation guidance','Survivorship care planning','Palliative care guidance','End-of-life planning support','Specialist network access facilitation' ],
  5: [ 'Ergonomic workspace modifications','Assistive technology / equipment','Modified job duties (temporary or permanent)','Transportation accommodations','Flexible bathroom / rest break policies','Private space for medical needs','Modified dress code for medical devices','Service animal accommodations','Parking accommodations' ],
  6: [ 'Strong anti-discrimination policies specific to health conditions','Clear process for confidential health disclosures','Manager training on handling sensitive health information','Written anti-retaliation policies for health disclosures','Employee peer support groups (internal employees with shared experience)','Professional-led support groups (external facilitator / counselor)','Stigma-reduction initiatives','Specialized emotional counseling','Optional open health dialogue forums','Inclusive communication guidelines','Confidential HR channel for health benefits, policies and insurance-related questions','Anonymous benefits navigation tool or website (no login required)' ],
  7: [ 'Career development plans maintained during treatment','Promotion eligibility protection during leave','Skills training during recovery','Mentorship programs for impacted employees','Leadership opportunities for cancer survivors','Internal mobility priority','Performance evaluation adjustments','Succession planning transparency','Executive sponsorship programs' ],
  8: [ 'Work-from-home during treatment (for on-site roles)','Reduced schedule with benefits protection','Modified duties during treatment','Structured re-onboarding process','Graduated return-to-work schedules','Manager check-ins / stay-in-touch programs','Peer mentoring for returning employees','Skills refresher programs','Modified performance expectations during transition','Job protection during recovery','Temporary role modifications','Extended accommodation period post-return' ],
  9: [ 'Visible executive leadership on health equity','Dedicated budget for workplace support programs','Executive accountability for program outcomes','Board-level reporting on health support initiatives','Cross-functional workplace support committee','Regular employee listening sessions','Transparent program evaluation metrics' ],
  10:[ 'Caregiver leave (beyond FMLA / legal requirements)','Flexible scheduling for caregiving responsibilities','Backup care services','Caregiver support groups','Counseling services for family members','Financial planning for caregivers','Caregiver resource navigation','Bereavement support beyond standard policy','Family communication resources' ],
  11:[ 'At least 70% coverage for regionally / locally recommended screenings','Full or partial coverage for annual health screenings / checkups','Targeted risk-reduction programs','Paid time off for preventive care appointments','Legal protections beyond requirements','Workplace safety assessments to minimize health risks','Regular health education sessions','Individual health assessments (online or in-person)','Genetic screening / counseling','On-site vaccinations','Lifestyle coaching programs','Risk factor tracking / reporting','Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)' ],
  12:[ 'Return-to-work success metrics','Employee satisfaction tracking','Business impact / ROI assessment','Regular program enhancements','External benchmarking','Innovation pilots','Employee confidence in employer support','Program utilization analytics' ],
  13:[ 'Proactive communication at point of diagnosis disclosure','Dedicated program website or portal','Regular company-wide awareness campaigns (at least quarterly)','New hire orientation coverage','Manager toolkit for cascade communications','Employee testimonials / success stories','Multi-channel communication strategy','Family / caregiver communication inclusion','Anonymous information access options' ],
};

/* ===== Follow-ups (only app follow-ups; mark open where applicable) ===== */
export const DIM_FOLLOWUPS: Record<number, Q[]> = {
  1: [
    { id:'d1_1',  label:'Additional paid medical leave beyond legal minimums (weeks)', type:'open' },
    { id:'d1_4a', label:'Additional remote work time for on-site roles (beyond policy/legal)', type:'open' },
    { id:'d1_4b', label:'Duration allowed for reduced schedule with full benefits', type:'open' },
    { id:'d1_5',  label:'Guaranteed job protection (weeks beyond legal)', type:'open' },
  ],
  2: [
    { id:'d2_1', label:'Additional insurance coverage details', type:'open' },
    { id:'d2_2', label:'How financial protection effectiveness is measured', type:'open' },
    { id:'d2_5', label:'Health insurance premium handling during medical leave', type:'open' },
    { id:'d2_6', label:'Financial counseling provider', type:'open' },
  ],
  3: [
    { id:'d3_1a', label:'Manager training requirement', type:'single', options:['Mandatory','Recommended','Optional','Varies'] },
    { id:'d3_1',  label:'% of managers who completed training (past 2 years)', type:'single',
      options:['<10%','10–24%','25–49%','50–74%','75–99%','100%','Unsure','Do not track'] },
  ],
  4: [{ id:'d4_1', label:'Navigation provider type', type:'single', options:['Internal HR/Benefits','Third-party vendor','Hybrid','Carrier','Provider','Other'] }],
  5: [],
  6: [{ id:'d6_2', label:'How culture effectiveness is measured', type:'multi', options:['Pulse surveys','Focus groups','Exit interviews','Manager feedback','1:1 discussions','Other','Don’t measure'] }],
  7: [], 8: [], 9: [],
  10:[{ id:'d10_1', label:'Caregiver program eligibility details', type:'open' }],
  11:[{ id:'d11_1', label:'Specific preventive services covered at 100%', type:'open' }],
  12:[
    { id:'d12_1', label:'Data sources used to measure effectiveness', type:'multi', options:['Surveys','Utilization data','Cost/outcomes','Benchmarks','Vendor reports','Other'] },
    { id:'d12_2', label:'How employee feedback is incorporated', type:'open' },
  ],
  13:[{ id:'d13_1', label:'Frequency of awareness campaigns', type:'single', options:['Monthly','Quarterly','Bi-annually','Annually','Ad-hoc'] }],
};

/* ===== Compose dimension blocks ===== */
export const DIMENSIONS: DimBlock[] = Array.from({length:13}, (_,i) => {
  const n=i+1;
  return {
    number: n,
    title: [
      'Medical Leave & Flexibility','Insurance & Financial Protection','Manager Preparedness & Capability',
      'Navigation & Expert Resources','Workplace Accommodations','Culture & Psychological Safety',
      'Career Continuity & Advancement','Return-to-Work Excellence','Executive Commitment & Resources',
      'Caregiver & Family Support','Prevention, Wellness & Legal Compliance','Continuous Improvement & Outcomes',
      'Communication & Awareness'
    ][i],
    intro: INTRO[n],
    questionText: PROMPT[n],
    scale: n===13 ? SCALE_D13 : SCALE_DX,
    supportOptions: DIM_SUPPORT[n] || [],
    followUps: DIM_FOLLOWUPS[n] || [],
  };
});

/* ===== Cross-Dim & EI (only app keys) ===== */
export const CROSS_DIM: Section = {
  id: 'cross_dim',
  title: 'Cross-Dimensional Assessment',
  questions: [
    { id:'cd1a', label:'Top 3 Dimensions (Best Outcomes)', type:'multi' },
    { id:'cd1b', label:'Bottom 3 Dimensions (Lowest Priority)', type:'multi' },
    { id:'cd2',  label:'Implementation Challenges', type:'multi',
      options:['Budget/resource constraints','Lack of executive support','Complex legal requirements','Manager capability gaps','Privacy concerns','Measuring effectiveness','Low awareness','Admin complexity','Inconsistent application','Cultural stigma','HRIS integration','Competing priorities','Limited expertise','Global consistency','Other (specify)'] },
    { id:'cd2_other', label:'Implementation Challenges — Other (specify)', type:'open' },
  ],
};

export const EI: Section = {
  id: 'ei',
  title: 'Employee Impact (EI) Assessment',
  questions: [
    { id:'ei1',  label:'Impact on Employee Retention', type:'scale', options:['Very negative','Negative','Neutral','Positive','Very positive'] },
    { id:'ei1a', label:'Impact on Absenteeism', type:'scale', options:['Worse','Slightly worse','No change','Slightly better','Much better'] },
    { id:'ei1b', label:'Impact on Job Performance', type:'scale', options:['Worse','Slightly worse','No change','Slightly better','Much better'] },
    { id:'ei1c', label:'Impact on Healthcare Costs', type:'scale', options:['Increases','Slightly increases','No change','Slightly decreases','Decreases'] },
    { id:'ei2',  label:'ROI Analysis Status', type:'single', options:['Completed','In progress','Planned','Not planned'] },
    { id:'ei3',  label:'ROI Analysis Results (if completed)', type:'open' },
    { id:'ei4',  label:'Advice to Other HR Leaders', type:'open' },
    { id:'ei5',  label:'Other Serious Health Conditions Covered', type:'open' },
  ],
};

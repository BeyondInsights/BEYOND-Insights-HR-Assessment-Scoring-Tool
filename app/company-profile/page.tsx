'use client';

import React, { useEffect, useState } from 'react';

/* =========================
   BRAND
========================= */
const BRAND = {
  // Slightly brighter than #6B2C91 (optional tweak)
  primary: '#7A34A3',
  gray: {
    900: '#0F172A',
    700: '#334155',
    600: '#475569',
    500: '#64748B',
    400: '#94A3B8',
    300: '#CBD5E1',
    200: '#E5E7EB',
    bg:  '#F9FAFB',
    white: '#FFFFFF',
  }
};

/* =========================
   DIMENSION TITLES
========================= */
const DIM_TITLE: Record<number, string> = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources',
  5: 'Workplace Accommodations',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Return-to-Work Excellence',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention, Wellness & Legal Compliance',
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness',
};

/* =========================
   COMPLETE QUESTION MAPS
   (your maps, preserved)
========================= */

// D1
const D1_QUESTIONS: Record<string, string> = {
  "Paid medical leave beyond local / legal requirements": "Paid medical leave beyond local / legal requirements",
  "Intermittent leave beyond local / legal requirements": "Intermittent leave beyond local / legal requirements",
  "Remote work options for on-site employees": "Remote work options for on-site employees",
  "Reduced schedule / part-time with full benefits": "Reduced schedule / part-time with full benefits",
  "Job protection beyond local / legal requirements": "Job protection beyond local / legal requirements",
  "Phased return-to-work programs": "Phased return-to-work programs",
  "Leave donation programs": "Leave donation programs",
  "Extended leave (12+ months)": "Extended leave (12+ months)",
  "Temporary reassignment to less demanding role": "Temporary reassignment to less demanding role",
  "Shift / schedule modifications": "Shift / schedule modifications",
  'd1_1': 'Paid medical leave duration',
  'd1_2': 'Intermittent leave details',
  'd1_4a': 'Remote work availability details',
  'd1_4b': 'Reduced schedule details',
  'd1_5': 'Job protection duration',
  'd1_6': 'Additional leave details',
  'd1aa': 'Geographic consistency',
  'd1b': 'Additional medical leave/flexibility benefits'
};

// D2
const D2_QUESTIONS: Record<string, string> = {
  "Set out-of-pocket maximums (for in-network single coverage)": "Set out-of-pocket maximums (for in-network single coverage)",
  "Travel / lodging reimbursement for specialized care beyond insurance coverage": "Travel / lodging reimbursement for specialized care beyond insurance coverage",
  "Insurance advocacy / pre-authorization support": "Insurance advocacy / pre-authorization support",
  "Long-term disability covering 60%+ of salary": "Long-term disability covering 60%+ of salary",
  "Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance": "Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance",
  "Voluntary supplemental illness insurance (with employer contribution)": "Voluntary supplemental illness insurance (with employer contribution)",
  "Paid time off for clinical trial participation": "Paid time off for clinical trial participation",
  "Guaranteed job protection": "Guaranteed job protection",
  "Employer-paid disability insurance supplements": "Employer-paid disability insurance supplements",
  "Real-time cost estimator tools": "Real-time cost estimator tools",
  "Accelerated life insurance benefits (partial payout for terminal / critical illness)": "Accelerated life insurance benefits (partial payout for terminal / critical illness)",
  "Hardship grants program funded by employer": "Hardship grants program funded by employer",
  "Financial counseling services": "Financial counseling services",
  "$0 copay for specialty drugs": "$0 copay for specialty drugs",
  "Short-term disability covering 60%+ of salary": "Short-term disability covering 60%+ of salary",
  "Coverage for clinical trials and experimental treatments not covered by standard health insurance": "Coverage for clinical trials and experimental treatments not covered by standard health insurance",
  "Tax / estate planning assistance": "Tax / estate planning assistance",
  'd2_1': 'Additional insurance coverage details',
  'd2_2': 'How financial protection effectiveness is measured',
  'd2_5': 'Health insurance premium handling during medical leave',
  'd2_6': 'Who provides financial counseling',
  'd2aa': 'Geographic consistency',
  'd2b': 'Additional insurance/financial protection benefits'
};

// D3
const D3_QUESTIONS: Record<string, string> = {
  "Manager training on supporting employees managing cancer or other serious health conditions / illnesses and their teams": "Manager training on supporting employees managing cancer or other serious health conditions / illnesses and their teams",
  "Clear escalation protocol for manager response": "Clear escalation protocol for manager response",
  "Dedicated manager resource hub": "Dedicated manager resource hub",
  "Empathy / communication skills training": "Empathy / communication skills training",
  "Legal compliance training": "Legal compliance training",
  "Senior leader coaching on supporting impacted employees": "Senior leader coaching on supporting impacted employees",
  "Manager evaluations include how well they support impacted employees": "Manager evaluations include how well they support impacted employees",
  "Manager peer support / community building": "Manager peer support / community building",
  "AI-powered guidance tools": "AI-powered guidance tools",
  "Privacy protection and confidentiality management": "Privacy protection and confidentiality management",
  'd3_1a': 'Manager training requirement type (mandatory vs. optional)',
  'd3_1': 'Percentage of managers who completed training (past 2 years)',
  'd3aa': 'Geographic consistency',
  'd3b': 'Additional manager preparedness initiatives'
};

// D4
const D4_QUESTIONS: Record<string, string> = {
  "Dedicated benefits navigator / care coordinator": "Dedicated benefits navigator / care coordinator",
  "Cancer-specific navigation services": "Cancer-specific navigation services",
  "Legal / regulatory guidance": "Legal / regulatory guidance",
  "Second opinion services": "Second opinion services",
  "Clinical trial matching services": "Clinical trial matching services",
  "Fertility preservation guidance": "Fertility preservation guidance",
  "Survivorship care planning": "Survivorship care planning",
  "Palliative care guidance": "Palliative care guidance",
  "End-of-life planning support": "End-of-life planning support",
  "Specialist network access facilitation": "Specialist network access facilitation",
  'd4_1': 'Navigation services provider type',
  'd4_1a': 'Internal vs. external navigation support',
  'd4_1b': 'Additional navigation service details',
  'd4aa': 'Geographic consistency',
  'd4b': 'Additional navigation/expert resources'
};

// D5
const D5_QUESTIONS: Record<string, string> = {
  "Ergonomic workspace modifications": "Ergonomic workspace modifications",
  "Assistive technology / equipment": "Assistive technology / equipment",
  "Modified job duties (temporary or permanent)": "Modified job duties (temporary or permanent)",
  "Transportation accommodations": "Transportation accommodations",
  "Flexible bathroom / rest break policies": "Flexible bathroom / rest break policies",
  "Private space for medical needs": "Private space for medical needs",
  "Modified dress code for medical devices": "Modified dress code for medical devices",
  "Service animal accommodations": "Service animal accommodations",
  "Parking accommodations": "Parking accommodations",
  'd5aa': 'Geographic consistency',
  'd5b': 'Additional workplace accommodations'
};

// D6
const D6_QUESTIONS: Record<string, string> = {
  "Strong anti-discrimination policies specific to health conditions": "Strong anti-discrimination policies specific to health conditions",
  "Clear process for confidential health disclosures": "Clear process for confidential health disclosures",
  "Manager training on handling sensitive health information": "Manager training on handling sensitive health information",
  "Written anti-retaliation policies for health disclosures": "Written anti-retaliation policies for health disclosures",
  "Employee peer support groups (internal employees with shared experience)": "Employee peer support groups (internal employees with shared experience)",
  "Professional-led support groups (external facilitator / counselor)": "Professional-led support groups (external facilitator / counselor)",
  "Stigma-reduction initiatives": "Stigma-reduction initiatives",
  "Specialized emotional counseling": "Specialized emotional counseling",
  "Optional open health dialogue forums": "Optional open health dialogue forums",
  "Inclusive communication guidelines": "Inclusive communication guidelines",
  "Confidential HR channel for health benefits, policies and insurance-related questions": "Confidential HR channel for health benefits, policies and insurance-related questions",
  "Anonymous benefits navigation tool or website (no login required)": "Anonymous benefits navigation tool or website (no login required)",
  'd6_1': 'Types of peer support networks available',
  'd6_2': 'How effectiveness of culture initiatives is measured',
  'd6aa': 'Geographic consistency',
  'd6b': 'Additional culture/psychological safety initiatives'
};

// D7
const D7_QUESTIONS: Record<string, string> = {
  "Career development plans maintained during treatment": "Career development plans maintained during treatment",
  "Promotion eligibility protection during leave": "Promotion eligibility protection during leave",
  "Skills training during recovery": "Skills training during recovery",
  "Mentorship programs for impacted employees": "Mentorship programs for impacted employees",
  "Leadership opportunities for cancer survivors": "Leadership opportunities for cancer survivors",
  "Internal mobility priority": "Internal mobility priority",
  "Performance evaluation adjustments": "Performance evaluation adjustments",
  "Succession planning transparency": "Succession planning transparency",
  "Executive sponsorship programs": "Executive sponsorship programs",
  'd7aa': 'Geographic consistency',
  'd7b': 'Additional career continuity/advancement programs'
};

// D8
const D8_QUESTIONS: Record<string, string> = {
  "Work-from-home during treatment (for on-site roles)": "Work-from-home during treatment (for on-site roles)",
  "Reduced schedule with benefits protection": "Reduced schedule with benefits protection",
  "Modified duties during treatment": "Modified duties during treatment",
  "Structured re-onboarding process": "Structured re-onboarding process",
  "Graduated return-to-work schedules": "Graduated return-to-work schedules",
  "Manager check-ins / stay-in-touch programs": "Manager check-ins / stay-in-touch programs",
  "Peer mentoring for returning employees": "Peer mentoring for returning employees",
  "Skills refresher programs": "Skills refresher programs",
  "Modified performance expectations during transition": "Modified performance expectations during transition",
  "Job protection during recovery": "Job protection during recovery",
  "Temporary role modifications": "Temporary role modifications",
  "Extended accommodation period post-return": "Extended accommodation period post-return",
  'd8aa': 'Geographic consistency',
  'd8b': 'Additional return-to-work programs'
};

// D9
const D9_QUESTIONS: Record<string, string> = {
  "Visible executive leadership on health equity": "Visible executive leadership on health equity",
  "Dedicated budget for workplace support programs": "Dedicated budget for workplace support programs",
  "Executive accountability for program outcomes": "Executive accountability for program outcomes",
  "Board-level reporting on health support initiatives": "Board-level reporting on health support initiatives",
  "Cross-functional workplace support committee": "Cross-functional workplace support committee",
  "Regular employee listening sessions": "Regular employee listening sessions",
  "Transparent program evaluation metrics": "Transparent program evaluation metrics",
  'd9_2': 'Budget allocation details',
  'd9_3': 'Executive accountability mechanisms',
  'd9aa': 'Geographic consistency',
  'd9b': 'Additional executive commitment initiatives'
};

// D10
const D10_QUESTIONS: Record<string, string> = {
  "Caregiver leave (beyond FMLA / legal requirements)": "Caregiver leave (beyond FMLA / legal requirements)",
  "Flexible scheduling for caregiving responsibilities": "Flexible scheduling for caregiving responsibilities",
  "Backup care services": "Backup care services",
  "Caregiver support groups": "Caregiver support groups",
  "Counseling services for family members": "Counseling services for family members",
  "Financial planning for caregivers": "Financial planning for caregivers",
  "Caregiver resource navigation": "Caregiver resource navigation",
  "Bereavement support beyond standard policy": "Bereavement support beyond standard policy",
  "Family communication resources": "Family communication resources",
  'd10_1': 'Caregiver program eligibility details',
  'd10aa': 'Geographic consistency',
  'd10b': 'Additional caregiver/family support programs'
};

// D11
const D11_QUESTIONS: Record<string, string> = {
  "Cancer screening programs": "Cancer screening programs",
  "Genetic testing / counseling": "Genetic testing / counseling",
  "Smoking cessation programs": "Smoking cessation programs",
  "Wellness incentives": "Wellness incentives",
  "Health risk assessments": "Health risk assessments",
  "Nutrition counseling": "Nutrition counseling",
  "Fitness programs / gym access": "Fitness programs / gym access",
  "Mental health support": "Mental health support",
  "Preventive care campaigns": "Preventive care campaigns",
  'd11_1': 'Specific preventive care services offered (screenings, genetic testing, vaccines)',
  'd11aa': 'Geographic consistency',
  'd11b': 'Additional prevention/wellness programs'
};

// D12
const D12_QUESTIONS: Record<string, string> = {
  "Return-to-work success metrics": "Return-to-work success metrics",
  "Employee satisfaction tracking": "Employee satisfaction tracking",
  "Business impact/ROI assessment": "Business impact/ROI assessment",
  "Regular program enhancements": "Regular program enhancements",
  "External benchmarking": "External benchmarking",
  "Innovation pilots": "Innovation pilots",
  "Employee confidence in employer support": "Employee confidence in employer support",
  "Program utilization analytics": "Program utilization analytics",
  'd12_1': 'Data sources used for measuring program effectiveness',
  'd12_2': 'How employee feedback is incorporated into program improvements',
  'd12aa': 'Geographic consistency',
  'd12b': 'Additional measurement/tracking approaches'
};

// D13
const D13_QUESTIONS: Record<string, string> = {
  "Proactive communication at point of diagnosis disclosure": "Proactive communication at point of diagnosis disclosure",
  "Dedicated program website or portal": "Dedicated program website or portal",
  "Regular company-wide awareness campaigns (at least quarterly)": "Regular company-wide awareness campaigns (at least quarterly)",
  "New hire orientation coverage": "New hire orientation coverage",
  "Manager toolkit for cascade communications": "Manager toolkit for cascade communications",
  "Employee testimonials/success stories": "Employee testimonials/success stories",
  "Multi-channel communication strategy": "Multi-channel communication strategy",
  "Family/caregiver communication inclusion": "Family/caregiver communication inclusion",
  "Anonymous information access options": "Anonymous information access options",
  'd13_1': 'Frequency of awareness campaigns about workplace support programs',
  'd13aa': 'Geographic consistency',
  'd13b': 'Additional communication/awareness approaches'
};

const ALL_DIMENSION_QUESTIONS: Record<string, Record<string, string>> = {
  d1: D1_QUESTIONS, d2: D2_QUESTIONS, d3: D3_QUESTIONS, d4: D4_QUESTIONS, d5: D5_QUESTIONS,
  d6: D6_QUESTIONS, d7: D7_QUESTIONS, d8: D8_QUESTIONS, d9: D9_QUESTIONS, d10: D10_QUESTIONS,
  d11: D11_QUESTIONS, d12: D12_QUESTIONS, d13: D13_QUESTIONS
};

/* =========================
   FIELD LABELS (your map)
========================= */
const FIELD_LABELS: Record<string, string> = {
  // Firmographics (NO POC s3-s7, NO GENDER s2)
  companyName: 'Company Name',
  s8: 'Total Employee Size',
  s9: 'Headquarters Location',
  s9a: 'Countries with Employee Presence',
  c2: 'Industry',
  c3: 'Excluded Employee Groups',
  c4: '% of Employees Eligible for Standard Benefits',
  c5: 'Annual Revenue',
  c6: 'Remote/Hybrid Work Policy',

  // General Benefits
  cb1: 'Standard Benefits Offered',
  cb1a: '% of Employees with National Healthcare Access',
  cb1_standard: 'Standard Benefits Package',
  cb1_leave: 'Leave & Flexibility Programs',
  cb1_wellness: 'Wellness & Support Programs',
  cb1_financial: 'Financial & Legal Assistance Programs',
  cb1_navigation: 'Care Navigation & Support Services',
  cb2: 'Leave & Flexibility Programs',
  cb2a: 'Leave Programs Status',
  cb2b: 'Wellness & Support Programs Status',
  cb3: 'Financial & Legal Assistance Programs',
  cb3a: 'Cancer Support Program Characterization',
  cb3b: 'Key Cancer Support Program Features',
  cb3c: 'Conditions Covered by Support Programs',
  cb3d: 'Communication Methods for Support Programs',
  cb4: 'Planned Benefits Enhancements',

  // Current Support
  cs1: 'Current Support Approach',
  or1: 'Current Support Level',
  or2a: 'Triggers that Led to Program Development',
  or2b: 'Most Impactful Change Made',
  or3: 'Available Support Resources',
  or4: 'Barriers to Enhanced Support',
  or5a: 'Key Program Features',
  or6: 'Monitoring & Evaluation Approach',

  // Cross-Dimensional Assessment
  cd1a: 'Top 3 Dimensions for Best Outcomes',
  cd1b: 'Bottom 3 Dimensions (Lowest Priority)',
  cd2: 'Biggest Implementation Challenges',

  // Employee Impact Assessment
  ei1: 'Impact on Employee Retention',
  ei1a: 'Impact on Reducing Absenteeism',
  ei1b: 'Impact on Maintaining Job Performance',
  ei1c: 'Impact on Healthcare Cost Management',
  ei1d: 'Impact on Employee Morale',
  ei1e: 'Impact on Reputation as Employer of Choice',
  ei1f: 'Impact on Productivity During Treatment',
  ei1g: 'Impact on Manager Confidence in Supporting Employees',
  ei1h: 'Impact on Quality of Return-to-Work Experience',
  ei1i: 'Impact on Reducing Family/Caregiver Stress',
  ei2: 'ROI Analysis Status',
  ei3: 'ROI Analysis Results',
  ei4: 'Advice to Other HR Leaders',
  ei5: 'Other Serious Health Conditions Covered Beyond Cancer'
};

/* =========================
   HELPERS
========================= */
const tryJSON = (raw: string | null) => { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } };

const loadMany = (keys: string[]) => {
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') return obj;
    } catch {}
  }
  return {};
};

const humanize = (key: string) =>
  key.replace(/^d\d+[a-z]?_?/, '')
     .replace(/_/g, ' ')
     .replace(/\b\w/g, (m) => m.toUpperCase())
     .trim();

const formatGenericLabel = (key: string) =>
  key.replace(/_/g, ' ')
     .replace(/([A-Z])/g, ' $1')
     .replace(/\s+/g, ' ')
     .trim()
     .replace(/\b\w/g, l => l.toUpperCase());

const formatLabel = (key: string) => FIELD_LABELS[key] ?? formatGenericLabel(key);

function getQuestionLabel(dimNumber: number, fieldKey: string): string {
  const dimKey = `d${dimNumber}`;
  const dimQuestions = ALL_DIMENSION_QUESTIONS[dimKey];
  if (dimQuestions && dimQuestions[fieldKey]) return dimQuestions[fieldKey];
  if (FIELD_LABELS[fieldKey]) return FIELD_LABELS[fieldKey];
  return formatGenericLabel(fieldKey);
}

function selectedOnly(value: any): string[] | string | null {
  if (value == null) return null;

  if (Array.isArray(value)) {
    const out = value.map(v => String(v).trim()).filter(v => v !== '');
    return out.length ? out : null;
  }
  if (typeof value === 'object') return value; // let caller decide (used for grids)

  // keep "No", "0", "N/A"
  const s = String(value).trim();
  return s === '' ? null : s;
}

const hasProgramStatusMap = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

/* =========================
   SUPPORT MATRIX HELPERS
========================= */
function normalizeStatus(s: string) {
  const x = s.toLowerCase();
  if (x.includes('currently')) return 'Currently offer';
  if (x.includes('active') || x.includes('development') || x.includes('planning')) return 'In active planning';
  if (x.includes('assessing') || x.includes('feasibility')) return 'Assessing feasibility';
  if (x === 'no' || x.includes('not offered') || x.includes('do not')) return 'Not offered';
  return 'Other';
}

const STATUS_BUCKETS = [
  'Currently offer',
  'In active planning',
  'Assessing feasibility',
  'Not offered',
  'Other',
];

function pillColors(bucket: string) {
  switch (bucket) {
    case 'Currently offer':       return { bg: '#dcfce7', fg: '#065f46' };
    case 'In active planning':    return { bg: '#dbeafe', fg: '#1e40af' };
    case 'Assessing feasibility': return { bg: '#fef3c7', fg: '#92400e' };
    case 'Not offered':           return { bg: '#f3f4f6', fg: '#4b5563' };
    default:                      return { bg: '#eef2ff', fg: '#3730a3' };
  }
}

/* =========================
   DIMENSION PARSER (STRICT)
========================= */
function parseDimensionData(
  dimNumber: number,
  data: Record<string, any>
): {
  programs: Array<{ program: string; status: string }>;
  items: Array<{ question: string; response: string }>;
} {
  const prefix = `d${dimNumber}`;
  const programs: Array<{ program: string; status: string }> = [];
  const items: Array<{ question: string; response: string }> = [];

  Object.entries(data || {}).forEach(([key, value]) => {
    // accept only this dimension’s keys
    const isThisDim = key === `${prefix}a` || key.startsWith(`${prefix}_`) || key === prefix;
    if (!isThisDim) return;

    // grid (program -> status)
    if (key === `${prefix}a` && hasProgramStatusMap(value)) {
      Object.entries(value).forEach(([program, status]) => {
        if (status != null && String(status).trim() !== '') {
          programs.push({ program: String(program), status: String(status) });
        }
      });
      return;
    }

    // merge "Other (specify)"
    if (Array.isArray(value) && value.some(v => /other|specify/i.test(String(v)))) {
      const otherText = (data as any)[`${key}_other`];
      if (otherText) value = [...value, `Other: ${otherText}`];
    }

    if (!key.endsWith('_none')) {
      const resp = selectedOnly(value);
      if (resp) {
        items.push({
          question: getQuestionLabel(dimNumber, key),
          response: Array.isArray(resp) ? resp.join(', ') : resp
        });
      }
    }
  });

  programs.sort((a, b) => a.program.localeCompare(b.program));
  items.sort((a, b) => a.question.localeCompare(b.question));
  return { programs, items };
}

/* =========================
   UI COMPONENTS
========================= */

function Section({
  title,
  badge,
  placeholderWhenEmpty,
  children,
}: {
  title: string;
  badge?: string;
  placeholderWhenEmpty?: string | boolean;
  children?: React.ReactNode;
}) {
  const isEmpty = !children || placeholderWhenEmpty === true;
  return (
    <section className="mb-6 bg-white rounded-lg border p-6" style={{ borderColor: BRAND.gray[200] }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>{title}</h2>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-white"
                style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}>
            {badge}
          </span>
        )}
      </div>
      {isEmpty && typeof placeholderWhenEmpty === 'string'
        ? <div className="text-sm italic" style={{ color: BRAND.gray[400] }}>{placeholderWhenEmpty}</div>
        : children}
    </section>
  );
}

function TwoColObject({ obj }: { obj: Record<string, any> }) {
  const entries = Object.entries(obj || {}).sort(([a],[b]) => a.localeCompare(b));
  const half = Math.ceil(entries.length / 2);
  const left = entries.slice(0, half);
  const right = entries.slice(half);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
      <div>
        {left.map(([k,v]) => <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />)}
      </div>
      <div>
        {right.map(([k,v]) => <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />)}
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value?: any }) {
  const display =
    value == null || (Array.isArray(value) && value.length === 0)
      ? '—'
      : Array.isArray(value) ? value.join(', ')
      : String(value);

  return (
    <div className="row flex py-2 border-b last:border-b-0" style={{ borderColor: BRAND.gray[200] }}>
      <div className="w-1/3 pr-4">
        <span className="text-sm font-medium" style={{ color: BRAND.gray[600] }}>{label}</span>
      </div>
      <div className="w-2/3 text-left">
        <span className="text-sm" style={{ color: BRAND.gray[900] }}>{display}</span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const { bg, fg } = pillColors(normalizeStatus(status));
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
          style={{ backgroundColor: bg, color: fg }}>
      {status}
    </span>
  );
}

function SupportMatrix({ programs }: { programs: Array<{ program: string; status: string }> }) {
  const byBucket: Record<string, Array<string>> = {};
  STATUS_BUCKETS.forEach(b => (byBucket[b] = []));
  programs.forEach(({ program, status }) => {
    const bucket = normalizeStatus(String(status));
    if (!byBucket[bucket]) byBucket[bucket] = [];
    byBucket[bucket].push(program);
  });
  const nonEmpty = STATUS_BUCKETS.filter(b => (byBucket[b] && byBucket[b].length > 0));

  if (nonEmpty.length === 0) return null;

  return (
    <div className="mb-4 pb-3 border-b" style={{ borderColor: BRAND.gray[200] }}>
      <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: '#EA580C' }}>
        Support Offerings (Program Status)
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(nonEmpty.length, 4)}, minmax(0, 1fr))` }}>
        {nonEmpty.map((bucket) => {
          const { bg, fg } = pillColors(bucket);
          return (
            <div key={bucket} className="bg-white rounded border p-3" style={{ borderColor: BRAND.gray[200] }}>
              <div className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2"
                   style={{ backgroundColor: bg, color: fg }}>
                {bucket}
              </div>
              <ul className="space-y-1">
                {byBucket[bucket].sort((a, b) => a.localeCompare(b)).map((prog) => (
                  <li key={prog} className="text-[13px]" style={{ color: BRAND.gray[700] }}>
                    {prog}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   MAIN
========================= */
export default function CompanyProfileFixed() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // tolerant loaders (avoid blanks from historical key names)
    const firmo = loadMany(['firmographics_data', 'firmographics']);
    const gen   = loadMany(['general-benefits_data', 'general_benefits_data', 'generalBenefits']);
    const cur   = loadMany(['current-support_data', 'current_support_data', 'currentSupport']);
    const cross = loadMany(['cross_dimensional_data', 'cross-dimensional_data', 'crossDimensional']);
    const impact= loadMany(['employee_impact_data', 'ei_assessment_data', 'ei_data', 'employeeImpact']);

    const dimensions: Array<{ number: number; data: Record<string, any> }> = [];
    for (let i = 1; i <= 13; i++) {
      const raw = loadMany([
        `dimension${i}_data`, `dimension_${i}_data`,
        `dim${i}_data`, `dim_${i}_data`,
        `dimension${i}`, `dim${i}`
      ]);
      dimensions.push({ number: i, data: raw });
    }

    const companyName =
      localStorage.getItem('login_company_name') ||
      firmo.companyName || firmo.company_name || 'Organization';

    const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email') || '';
    const firstName = localStorage.getItem('login_first_name') || '';
    const lastName  = localStorage.getItem('login_last_name')  || '';

    setData({
      companyName, email, firstName, lastName,
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      firmographics: firmo, general: gen, current: cur, cross, impact,
      dimensions
    });
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: BRAND.gray.bg }}>
        <div className="text-sm" style={{ color: BRAND.gray[600] }}>Loading profile…</div>
      </div>
    );
  }

  const firmo = data.firmographics || {};
  const gen   = data.general || {};
  const cur   = data.current || {};
  const cd    = data.cross || {};
  const ei    = data.impact || {};

  // Filter out POC fields + gender from firmographics
  const firmoFiltered = Object.fromEntries(
    Object.entries(firmo).filter(([k]) => !['s1','s2','s3','s4a','s4b','s5','s6','s7'].includes(k))
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.gray.bg }}>
      {/* Header — slim + lighter */}
      <header className="bg-white border-b" style={{ borderColor: BRAND.gray[200] }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <img src="/best-companies-2026-logo.png" alt="Best Companies Award" className="h-12 w-auto" />
          <div className="text-xl font-black tracking-wide" style={{ color: BRAND.primary }}>
            BEYOND Insights
          </div>
          <img src="/cancer-careers-logo.png" alt="Cancer and Careers" className="h-10 w-auto" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-4">
          <h1 className="text-2xl font-black" style={{ color: BRAND.gray[900] }}>{data.companyName}</h1>
          <p className="text-xs" style={{ color: BRAND.gray[600] }}>
            Company Profile &amp; Survey Summary • Generated {data.generatedAt}
            {data.email ? ` • ${data.email}` : ''}
          </p>
          <div className="mt-2 flex items-center gap-2 print:hidden">
            <a href="/dashboard" className="px-3 py-1.5 text-xs font-semibold border rounded"
               style={{ borderColor: BRAND.gray[200], color: BRAND.gray[900] }}>
              ← Dashboard
            </a>
            <button onClick={() => window.print()} className="px-3 py-1.5 text-xs font-semibold rounded text-white"
                    style={{ backgroundColor: BRAND.primary }}>
              Print PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* POC */}
        <Section title="Point of Contact">
          <DataRow label="Name" value={`${data.firstName} ${data.lastName}`.trim() || null} />
          <DataRow label="Email" value={data.email} />
          <DataRow label="Department" value={firmo?.s4a || firmo?.s3} />
          <DataRow label="Primary Job Function" value={firmo?.s4b} />
          <DataRow label="Current Level" value={firmo?.s5} />
          <DataRow label="Areas of Responsibility" value={selectedOnly(firmo?.s6)} />
          <DataRow label="Level of Influence on Benefits" value={firmo?.s7} />
        </Section>

        {/* Firmographics */}
        <Section
          title="Company Profile & Firmographics (Full)"
          placeholderWhenEmpty={Object.keys(firmoFiltered).length === 0 ? '(No data recorded)' : false}
        >
          <TwoColObject obj={firmoFiltered} />
        </Section>

        {/* General Benefits */}
        <Section
          title="General Employee Benefits"
          placeholderWhenEmpty={Object.keys(gen).length === 0 ? '(No data recorded)' : false}
        >
          <TwoColObject obj={gen} />
        </Section>

        {/* Current Support */}
        <Section
          title="Current Support for Employees Managing Cancer"
          placeholderWhenEmpty={Object.keys(cur).length === 0 ? '(No data recorded)' : false}
        >
          <TwoColObject obj={cur} />
        </Section>

        {/* 13 Dimensions */}
        <div className="flex items-baseline justify-between mb-3 mt-8">
          <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>
            13 Dimensions of Support
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-white"
                style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}>
            D13 uses 5-point scale (includes Unsure/NA)
          </span>
        </div>

        {data.dimensions.map((dim: { number: number; data: Record<string, any> }) => {
          const { programs, items } = parseDimensionData(dim.number, dim.data);
          const half = Math.ceil(items.length / 2);
          const left = items.slice(0, half);
          const right = items.slice(half);

          return (
            <Section
              key={dim.number}
              title={`Dimension ${dim.number}: ${DIM_TITLE[dim.number]}`}
              badge={dim.number === 13 ? '5-point' : undefined}
              placeholderWhenEmpty={(programs.length + items.length) === 0 ? '(No responses recorded)' : false}
            >
              {/* Support offerings FIRST as matrix */}
              {programs.length > 0 && <SupportMatrix programs={programs} />}

              {/* Follow-ups */}
              {items.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                  <div>{left.map((it, i) => <DataRow key={i} label={it.question} value={it.response} />)}</div>
                  <div>{right.map((it, i) => <DataRow key={i} label={it.question} value={it.response} />)}</div>
                </div>
              )}
            </Section>
          );
        })}

        {/* Cross-Dimensional */}
        <Section
          title="Cross-Dimensional Assessment"
          placeholderWhenEmpty={Object.keys(cd).length === 0 ? '(No data recorded)' : false}
        >
          <div className="space-y-2">
            {Object.entries(cd || {}).sort(([a],[b])=>a.localeCompare(b)).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </div>
        </Section>

        {/* Employee Impact */}
        <Section
          title="Employee Impact Assessment"
          placeholderWhenEmpty={Object.keys(ei).length === 0 ? '(No data recorded)' : false}
        >
          <div className="space-y-2">
            {Object.entries(ei || {}).sort(([a],[b])=>a.localeCompare(b)).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center text-xs"
             style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}>
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers &amp; CEW Foundation • All responses
          collected and analyzed by BEYOND Insights, LLC
        </div>
      </main>

      {/* Print */}
      <style jsx>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          html, body { font-size: 12px; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          section, .row { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

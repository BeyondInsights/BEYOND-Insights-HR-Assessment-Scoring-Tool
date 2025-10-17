'use client';

import React, { useEffect, useState } from 'react';

/* =========================
   BRAND
========================= */
const BRAND = {
  primary: '#7A34A3',
  orange: '#EA580C',
  gray: {
    900: '#0F172A',
    800: '#1E293B',
    700: '#334155',
    600: '#475569',
    500: '#64748B',
    400: '#94A3B8',
    300: '#CBD5E1',
    200: '#E5E7EB',
    100: '#F3F4F6',
    50: '#F9FAFB',
  }
};

const DIM_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
  '#84CC16', '#A855F7', '#EAB308'
];

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
   ALL RESPONSE OPTIONS (for support matrix)
========================= */
const RESPONSE_OPTIONS = [
  'Currently offer',
  'In active planning / development',
  'Assessing feasibility',
  'Not able to offer in foreseeable future'
];

const RESPONSE_OPTIONS_D13 = [
  'Currently use',
  'In active planning / development',
  'Assessing feasibility',
  'Not able to utilize in foreseeable future',
  'Unsure'
];

/* =========================
   COMPLETE QUESTION MAPS
========================= */

const D1_QUESTIONS: Record<string, string> = {
  "Paid medical leave beyond local / legal requirements": "Paid medical leave beyond local/legal requirements",
  "Intermittent leave beyond local / legal requirements": "Intermittent leave beyond local/legal requirements",
  "Flexible work hours during treatment (e.g., varying start / end times, compressed schedules)": "Flexible work hours during treatment",
  "Remote work options for on-site employees": "Remote work options for on-site employees",
  "Reduced schedule / part-time with full benefits": "Reduced schedule/part-time with full benefits",
  "Job protection beyond local / legal requirements": "Job protection beyond local/legal requirements",
  "Emergency leave within 24 hours": "Emergency leave within 24 hours",
  "Leave donation bank (employees can donate PTO to colleagues)": "Leave donation bank",
  "Disability pay top-up (employer adds to disability insurance)": "Disability pay top-up",
  "PTO accrual during leave": "PTO accrual during leave",
  "Paid micro-breaks for medical-related side effects": "Paid micro-breaks for medical side effects",
  'd1_1': 'Paid medical leave duration',
  'd1_2': 'Intermittent leave details',
  'd1_4a': 'Remote work availability details',
  'd1_4b': 'Reduced schedule details',
  'd1_5': 'Job protection duration',
  'd1_6': 'Additional leave details',
  'd1aa': 'Geographic consistency across locations',
  'd1b': 'Additional medical leave/flexibility benefits not listed'
};

const D2_QUESTIONS: Record<string, string> = {
  "Coverage for clinical trials and experimental treatments not covered by standard health insurance": "Coverage for clinical trials/experimental treatments",
  "Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance": "Coverage for advanced therapies (CAR-T, proton, immunotherapy)",
  "Paid time off for clinical trial participation": "Paid time off for clinical trial participation",
  "Set out-of-pocket maximums (for in-network single coverage)": "Set out-of-pocket maximums",
  "Travel / lodging reimbursement for specialized care beyond insurance coverage": "Travel/lodging reimbursement for specialized care",
  "Financial counseling services": "Financial counseling services",
  "Voluntary supplemental illness insurance (with employer contribution)": "Voluntary supplemental illness insurance (w/ employer contribution)",
  "Real-time cost estimator tools": "Real-time cost estimator tools",
  "Insurance advocacy / pre-authorization support": "Insurance advocacy/pre-authorization support",
  "$0 copay for specialty drugs": "$0 copay for specialty drugs",
  "Hardship grants program funded by employer": "Hardship grants program (employer-funded)",
  "Tax / estate planning assistance": "Tax/estate planning assistance",
  "Short-term disability covering 60%+ of salary": "Short-term disability covering 60%+ of salary",
  "Long-term disability covering 60%+ of salary": "Long-term disability covering 60%+ of salary",
  "Employer-paid disability insurance supplements": "Employer-paid disability insurance supplements",
  "Guaranteed job protection": "Guaranteed job protection",
  "Accelerated life insurance benefits (partial payout for terminal / critical illness)": "Accelerated life insurance benefits",
  'd2_1': 'Additional insurance coverage details',
  'd2_2': 'How financial protection effectiveness is measured',
  'd2_5': 'Health insurance premium handling during medical leave',
  'd2_6': 'Who provides financial counseling services',
  'd2aa': 'Geographic consistency across locations',
  'd2b': 'Additional insurance/financial protection benefits not listed'
};

const D3_QUESTIONS: Record<string, string> = {
  "Manager training on supporting employees managing cancer or other serious health conditions / illnesses and their teams": "Manager training on supporting employees with serious health conditions",
  "Clear escalation protocol for manager response": "Clear escalation protocol for manager response",
  "Dedicated manager resource hub": "Dedicated manager resource hub",
  "Empathy / communication skills training": "Empathy/communication skills training",
  "Legal compliance training": "Legal compliance training",
  "Senior leader coaching on supporting impacted employees": "Senior leader coaching on supporting impacted employees",
  "Manager evaluations include how well they support impacted employees": "Manager evaluations include support of impacted employees",
  "Manager peer support / community building": "Manager peer support/community building",
  "AI-powered guidance tools": "AI-powered guidance tools",
  "Privacy protection and confidentiality management": "Privacy protection and confidentiality management",
  'd3_1a': 'Manager training requirement type (mandatory vs. optional)',
  'd3_1': 'Percentage of managers who completed training in past 2 years',
  'd3aa': 'Geographic consistency across locations',
  'd3b': 'Additional manager preparedness initiatives not listed'
};

const D4_QUESTIONS: Record<string, string> = {
  "Dedicated benefits navigator / care coordinator": "Dedicated benefits navigator/care coordinator",
  "Cancer-specific navigation services": "Cancer-specific navigation services",
  "Legal / regulatory guidance": "Legal/regulatory guidance",
  "Second opinion services": "Second opinion services",
  "Clinical trial matching services": "Clinical trial matching services",
  "Fertility preservation guidance": "Fertility preservation guidance",
  "Survivorship care planning": "Survivorship care planning",
  "Palliative care guidance": "Palliative care guidance",
  "End-of-life planning support": "End-of-life planning support",
  "Specialist network access facilitation": "Specialist network access facilitation",
  'd4_1': 'Navigation services provider type',
  'd4_1a': 'Internal vs. external navigation support model',
  'd4_1b': 'Additional navigation service details',
  'd4aa': 'Geographic consistency across locations',
  'd4b': 'Additional navigation/expert resources not listed'
};

const D5_QUESTIONS: Record<string, string> = {
  "Ergonomic workspace modifications": "Ergonomic workspace modifications",
  "Assistive technology / equipment": "Assistive technology/equipment",
  "Modified job duties (temporary or permanent)": "Modified job duties (temporary or permanent)",
  "Transportation accommodations": "Transportation accommodations",
  "Flexible bathroom / rest break policies": "Flexible bathroom/rest break policies",
  "Private space for medical needs": "Private space for medical needs",
  "Modified dress code for medical devices": "Modified dress code for medical devices",
  "Service animal accommodations": "Service animal accommodations",
  "Parking accommodations": "Parking accommodations",
  'd5aa': 'Geographic consistency across locations',
  'd5b': 'Additional workplace accommodations not listed'
};

const D6_QUESTIONS: Record<string, string> = {
  "Strong anti-discrimination policies specific to health conditions": "Strong anti-discrimination policies (health-specific)",
  "Clear process for confidential health disclosures": "Clear process for confidential health disclosures",
  "Manager training on handling sensitive health information": "Manager training on handling sensitive health information",
  "Written anti-retaliation policies for health disclosures": "Written anti-retaliation policies for health disclosures",
  "Employee peer support groups (internal employees with shared experience)": "Employee peer support groups (internal)",
  "Professional-led support groups (external facilitator / counselor)": "Professional-led support groups (external facilitator)",
  "Stigma-reduction initiatives": "Stigma-reduction initiatives",
  "Specialized emotional counseling": "Specialized emotional counseling",
  "Optional open health dialogue forums": "Optional open health dialogue forums",
  "Inclusive communication guidelines": "Inclusive communication guidelines",
  "Confidential HR channel for health benefits, policies and insurance-related questions": "Confidential HR channel for benefits/policy questions",
  "Anonymous benefits navigation tool or website (no login required)": "Anonymous benefits navigation tool/website",
  'd6_1': 'Types of peer support networks available',
  'd6_2': 'How effectiveness of culture initiatives is measured',
  'd6aa': 'Geographic consistency across locations',
  'd6b': 'Additional culture/psychological safety initiatives not listed'
};

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
  'd7aa': 'Geographic consistency across locations',
  'd7b': 'Additional career continuity/advancement programs not listed'
};

const D8_QUESTIONS: Record<string, string> = {
  "Work-from-home during treatment (for on-site roles)": "Work-from-home during treatment (for on-site roles)",
  "Reduced schedule with benefits protection": "Reduced schedule with benefits protection",
  "Modified duties during treatment": "Modified duties during treatment",
  "Structured re-onboarding process": "Structured re-onboarding process",
  "Graduated return-to-work schedules": "Graduated return-to-work schedules",
  "Manager check-ins / stay-in-touch programs": "Manager check-ins/stay-in-touch programs",
  "Peer mentoring for returning employees": "Peer mentoring for returning employees",
  "Skills refresher programs": "Skills refresher programs",
  "Modified performance expectations during transition": "Modified performance expectations during transition",
  "Job protection during recovery": "Job protection during recovery",
  "Temporary role modifications": "Temporary role modifications",
  "Extended accommodation period post-return": "Extended accommodation period post-return",
  'd8aa': 'Geographic consistency across locations',
  'd8b': 'Additional return-to-work programs not listed'
};

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
  'd9aa': 'Geographic consistency across locations',
  'd9b': 'Additional executive commitment initiatives not listed'
};

const D10_QUESTIONS: Record<string, string> = {
  "Caregiver leave (beyond FMLA / legal requirements)": "Caregiver leave (beyond FMLA/legal requirements)",
  "Flexible scheduling for caregiving responsibilities": "Flexible scheduling for caregiving responsibilities",
  "Backup care services": "Backup care services",
  "Caregiver support groups": "Caregiver support groups",
  "Counseling services for family members": "Counseling services for family members",
  "Financial planning for caregivers": "Financial planning for caregivers",
  "Caregiver resource navigation": "Caregiver resource navigation",
  "Bereavement support beyond standard policy": "Bereavement support beyond standard policy",
  "Family communication resources": "Family communication resources",
  'd10_1': 'Caregiver program eligibility details',
  'd10aa': 'Geographic consistency across locations',
  'd10b': 'Additional caregiver/family support programs not listed'
};

const D11_QUESTIONS: Record<string, string> = {
  "At least 70% coverage for regionally / locally recommended screenings": "At least 70% coverage for recommended screenings",
  "Full or partial coverage for annual health screenings / checkups": "Coverage for annual health screenings/checkups",
  "Targeted risk-reduction programs": "Targeted risk-reduction programs",
  "Paid time off for preventive care appointments": "Paid time off for preventive care appointments",
  "Legal protections beyond requirements": "Legal protections beyond requirements",
  "Workplace safety assessments to minimize health risks": "Workplace safety assessments",
  "Regular health education sessions": "Regular health education sessions",
  "Individual health assessments (online or in-person)": "Individual health assessments",
  "Genetic screening / counseling": "Genetic screening/counseling",
  "On-site vaccinations": "On-site vaccinations",
  "Lifestyle coaching programs": "Lifestyle coaching programs",
  "Risk factor tracking / reporting": "Risk factor tracking/reporting",
  "Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)": "Policies to support immuno-compromised colleagues",
  'd11_1': 'Specific preventive care services offered (screenings, genetic testing, vaccines)',
  'd11aa': 'Geographic consistency across locations',
  'd11b': 'Additional prevention/wellness programs not listed'
};

const D12_QUESTIONS: Record<string, string> = {
  "Return-to-work success metrics": "Return-to-work success metrics",
  "Employee satisfaction tracking": "Employee satisfaction tracking",
  "Business impact / ROI assessment": "Business impact/ROI assessment",
  "Regular program enhancements": "Regular program enhancements",
  "External benchmarking": "External benchmarking",
  "Innovation pilots": "Innovation pilots",
  "Employee confidence in employer support": "Employee confidence in employer support",
  "Program utilization analytics": "Program utilization analytics",
  'd12_1': 'Data sources used for measuring program effectiveness',
  'd12_2': 'How employee feedback is incorporated into program improvements',
  'd12aa': 'Geographic consistency across locations',
  'd12b': 'Additional measurement/tracking approaches not listed'
};

const D13_QUESTIONS: Record<string, string> = {
  "Proactive communication at point of diagnosis disclosure": "Proactive communication at point of diagnosis disclosure",
  "Dedicated program website or portal": "Dedicated program website or portal",
  "Regular company-wide awareness campaigns (at least quarterly)": "Regular company-wide awareness campaigns (≥ quarterly)",
  "New hire orientation coverage": "New hire orientation coverage",
  "Manager toolkit for cascade communications": "Manager toolkit for cascade communications",
  "Employee testimonials / success stories": "Employee testimonials/success stories",
  "Multi-channel communication strategy": "Multi-channel communication strategy",
  "Family / caregiver communication inclusion": "Family/caregiver communication inclusion",
  "Anonymous information access options": "Anonymous information access options",
  'd13_1': 'Frequency of awareness campaigns about workplace support programs',
  'd13aa': 'Geographic consistency across locations',
  'd13b': 'Additional communication/awareness approaches not listed'
};

const ALL_DIMENSION_QUESTIONS: Record<string, Record<string, string>> = {
  d1: D1_QUESTIONS, d2: D2_QUESTIONS, d3: D3_QUESTIONS, d4: D4_QUESTIONS, d5: D5_QUESTIONS,
  d6: D6_QUESTIONS, d7: D7_QUESTIONS, d8: D8_QUESTIONS, d9: D9_QUESTIONS, d10: D10_QUESTIONS,
  d11: D11_QUESTIONS, d12: D12_QUESTIONS, d13: D13_QUESTIONS
};

/* =========================
   FIELD LABELS
========================= */
const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company Name',
  s8: 'Total Employee Size',
  s9: 'Headquarters Location',
  s9a: 'Countries with Employee Presence',
  c2: 'Industry',
  c3: 'Excluded Employee Groups',
  c4: '% of Employees Eligible for Standard Benefits',
  c5: 'Annual Revenue',
  c6: 'Remote/Hybrid Work Policy',
  
  cb1: 'Standard Benefits Offered',
  cb1a: '% of Employees with National Healthcare Access',
  cb2: 'Leave & Flexibility Programs Status',
  cb3a: 'Cancer Support Program Characterization',
  cb3b: 'Key Cancer Support Program Features',
  cb3c: 'Conditions Covered by Support Programs',
  cb3d: 'Communication Methods for Support Programs',
  
  or1: 'Current Support Level',
  or2a: 'Triggers that Led to Program Development',
  or2b: 'Most Impactful Change Made',
  or3: 'Available Support Resources',
  or5a: 'Key Program Features',
  or6: 'Monitoring & Evaluation Approach',
  
  cd1a: 'Top 3 Dimensions for Best Outcomes',
  cd1b: 'Bottom 3 Dimensions (Lowest Priority)',
  cd2: 'Biggest Implementation Challenges',
  cd2_other: 'Other Implementation Challenges',
  
  ei2: 'ROI Analysis Status',
  ei3: 'ROI Analysis Results',
  ei4: 'Advice to Other HR Leaders',
  ei5: 'Other Serious Health Conditions Covered Beyond Cancer'
};

/* =========================
   HELPERS
========================= */
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
  if (typeof value === 'object') return value;
  const s = String(value).trim();
  return s === '' ? null : s;
}

const hasProgramStatusMap = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

function normalizeStatus(s: string) {
  const x = s.toLowerCase();
  if (x.includes('currently')) return x.includes('use') ? 'Currently use' : 'Currently offer';
  if (x.includes('active') || x.includes('development') || x.includes('planning')) return 'In active planning / development';
  if (x.includes('assessing') || x.includes('feasibility')) return 'Assessing feasibility';
  if (x.includes('unsure')) return 'Unsure';
  if (x.includes('not able')) return x.includes('utilize') ? 'Not able to utilize in foreseeable future' : 'Not able to offer in foreseeable future';
  return 'Other';
}

/* =========================
   DIMENSION PARSER
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
    const isThisDim = key === `${prefix}a` || key.startsWith(`${prefix}_`) || key === prefix;
    if (!isThisDim) return;

    if (key === `${prefix}a` && hasProgramStatusMap(value)) {
      Object.entries(value).forEach(([program, status]) => {
        if (status != null && String(status).trim() !== '') {
          programs.push({ program: String(program), status: String(status) });
        }
      });
      return;
    }

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

  return { programs, items };
}

/* =========================
   UI COMPONENTS
========================= */

function Field({ label, value }: { label: string; value: any }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(', ') : String(value);
  
  return (
    <div className="py-2 border-b last:border-b-0" style={{ borderColor: BRAND.gray[200] }}>
      <div className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: BRAND.gray[600] }}>
        {label}
      </div>
      <div className="text-sm" style={{ color: BRAND.gray[900] }}>{display}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value?: any }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(', ') : String(value);

  return (
    <div className="row py-2.5 border-b last:border-b-0" style={{ borderColor: BRAND.gray[200] }}>
      <div className="text-xs font-semibold mb-0.5" style={{ color: BRAND.gray[600] }}>{label}</div>
      <div className="text-sm" style={{ color: BRAND.gray[900] }}>{display}</div>
    </div>
  );
}

function SupportMatrix({ programs, dimNumber }: { programs: Array<{ program: string; status: string }>; dimNumber: number }) {
  const options = dimNumber === 13 ? RESPONSE_OPTIONS_D13 : RESPONSE_OPTIONS;
  const byStatus: Record<string, Array<string>> = {};
  options.forEach(opt => (byStatus[opt] = []));
  
  programs.forEach(({ program, status }) => {
    const normalized = normalizeStatus(String(status));
    if (!byStatus[normalized]) byStatus[normalized] = [];
    byStatus[normalized].push(program);
  });

  const totalPrograms = programs.length;
  const offeredCount = byStatus['Currently offer']?.length || byStatus['Currently use']?.length || 0;
  const coverage = totalPrograms > 0 ? Math.round((offeredCount / totalPrograms) * 100) : 0;

  return (
    <div className="mb-4 pb-4 border-b" style={{ borderColor: BRAND.gray[200] }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.orange }}>
          Support Programs Status
        </div>
        <div className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: BRAND.gray[100], color: BRAND.gray[700] }}>
          {offeredCount} of {totalPrograms} active ({coverage}%)
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const count = byStatus[option]?.length || 0;
          const bgColor = option.toLowerCase().includes('currently') ? BRAND.gray[50] : BRAND.gray[50];
          const borderColor = option.toLowerCase().includes('currently') ? '#10B981' : 
                             option.toLowerCase().includes('planning') ? '#3B82F6' :
                             option.toLowerCase().includes('assessing') ? '#F59E0B' : BRAND.gray[300];
          
          return (
            <div key={option} className="rounded border-l-4 bg-white p-3" style={{ borderColor, backgroundColor: bgColor }}>
              <div className="text-[10px] font-bold uppercase tracking-wide mb-2 flex items-center justify-between" style={{ color: BRAND.gray[700] }}>
                <span>{option}</span>
                <span className="text-xs font-black" style={{ color: borderColor }}>({count})</span>
              </div>
              {count > 0 ? (
                <ul className="space-y-1.5">
                  {byStatus[option].sort((a, b) => a.localeCompare(b)).map((prog) => (
                    <li key={prog} className="text-[12px] leading-snug" style={{ color: BRAND.gray[800] }}>
                      • {prog}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[11px] italic" style={{ color: BRAND.gray[400] }}>None</div>
              )}
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
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  useEffect(() => {
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
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: BRAND.gray[50] }}>
        <div className="text-sm" style={{ color: BRAND.gray[600] }}>Loading profile…</div>
      </div>
    );
  }

  const firmo = data.firmographics || {};
  const firmoFiltered = Object.fromEntries(
    Object.entries(firmo).filter(([k]) => !['s1','s2','s3','s4a','s4b','s5','s6','s7'].includes(k))
  );

  const poc = {
    name: `${data.firstName} ${data.lastName}`.trim(),
    email: data.email,
    dept: firmo?.s4a || firmo?.s3,
    function: firmo?.s4b,
    level: firmo?.s5,
    areas: firmo?.s6,
    influence: firmo?.s7
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.gray[50] }}>
      {/* HEADER */}
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
            Company Profile &amp; Survey Summary • {data.generatedAt}
            {data.email && ` • ${data.email}`}
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

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* POC + COMPANY PROFILE SIDE BY SIDE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>Point of Contact</h2>
            <Field label="Name" value={poc.name} />
            <Field label="Email" value={poc.email} />
            <Field label="Department" value={poc.dept} />
            <Field label="Primary Job Function" value={poc.function} />
            <Field label="Current Level" value={poc.level} />
            <Field label="Areas of Responsibility" value={poc.areas} />
            <Field label="Level of Influence on Benefits" value={poc.influence} />
          </div>

          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>Company Profile</h2>
            <Field label="Company Name" value={firmo.companyName} />
            <Field label="Industry" value={firmo.c2} />
            <Field label="Annual Revenue" value={firmo.c5} />
            <Field label="Total Employee Size" value={firmo.s8} />
            <Field label="HQ Location" value={firmo.s9} />
            <Field label="Countries with Presence" value={firmo.s9a} />
            <Field label="Remote/Hybrid Policy" value={firmo.c6} />
          </div>
        </div>

        {/* GENERAL BENEFITS */}
        {Object.keys(data.general || {}).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>General Employee Benefits</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
              <div>
                {Object.entries(data.general).slice(0, Math.ceil(Object.keys(data.general).length / 2)).map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
              </div>
              <div>
                {Object.entries(data.general).slice(Math.ceil(Object.keys(data.general).length / 2)).map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CURRENT SUPPORT */}
        {Object.keys(data.current || {}).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>Current Support for Employees Managing Cancer</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
              <div>
                {Object.entries(data.current).slice(0, Math.ceil(Object.keys(data.current).length / 2)).map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
              </div>
              <div>
                {Object.entries(data.current).slice(Math.ceil(Object.keys(data.current).length / 2)).map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 13 DIMENSIONS */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: BRAND.gray[900] }}>13 Dimensions of Support</h2>
            <span className="text-[10px] font-semibold px-2 py-1 rounded border" style={{ borderColor: BRAND.gray[300], color: BRAND.gray[700] }}>
              D13 uses 5-point scale
            </span>
          </div>

          {data.dimensions.map((dim: { number: number; data: Record<string, any> }) => {
            const { programs, items } = parseDimensionData(dim.number, dim.data);
            const isEmpty = programs.length === 0 && items.length === 0;
            const isCollapsed = collapsed[dim.number];
            const third = Math.ceil(items.length / 3);

            return (
              <div key={dim.number} className="mb-4 bg-white rounded-lg border-l-4 overflow-hidden" 
                   style={{ borderColor: DIM_COLORS[dim.number - 1] }}>
                <div className="px-5 py-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                     style={{ borderColor: BRAND.gray[200] }}
                     onClick={() => setCollapsed(prev => ({ ...prev, [dim.number]: !prev[dim.number] }))}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                         style={{ backgroundColor: DIM_COLORS[dim.number - 1] }}>
                      {dim.number}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: BRAND.gray[500] }}>
                        Dimension {dim.number}
                      </div>
                      <h3 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>
                        {DIM_TITLE[dim.number]}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isEmpty && (
                      <div className="text-xs font-semibold" style={{ color: BRAND.gray[600] }}>
                        {programs.length} programs • {items.length} details
                      </div>
                    )}
                    <svg className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: BRAND.gray[500] }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="p-5">
                    {isEmpty ? (
                      <div className="text-center py-6 text-sm italic" style={{ color: BRAND.gray[400] }}>
                        No responses recorded for this dimension
                      </div>
                    ) : (
                      <>
                        {programs.length > 0 && <SupportMatrix programs={programs} dimNumber={dim.number} />}
                        {items.length > 0 && (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8">
                            <div>{items.slice(0, third).map((it, i) => <DataRow key={i} label={it.question} value={it.response} />)}</div>
                            <div>{items.slice(third, third * 2).map((it, i) => <DataRow key={i} label={it.question} value={it.response} />)}</div>
                            <div>{items.slice(third * 2).map((it, i) => <DataRow key={i} label={it.question} value={it.response} />)}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CROSS-DIMENSIONAL */}
        {Object.keys(data.cross || {}).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>Cross-Dimensional Assessment</h2>
            {Object.entries(data.cross).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </div>
        )}

        {/* EMPLOYEE IMPACT */}
        {Object.keys(data.impact || {}).length > 0 && (
          <div className="bg-white border rounded-lg p-5 mb-6" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>Employee Impact Assessment</h2>
            {Object.entries(data.impact).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </div>
        )}

        <div className="mt-8 pt-4 border-t text-center text-[10px]" style={{ borderColor: BRAND.gray[200], color: BRAND.gray[500] }}>
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers &amp; CEW Foundation
        </div>
      </main>

      <style jsx>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          html, body { font-size: 11px; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          section, .row { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

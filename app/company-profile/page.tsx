'use client';

import React, { useEffect, useState } from 'react';

// ============================================
// BRAND COLORS
// ============================================
const BRAND = {
  primary: '#6B2C91',
  gray: {
    900: '#0F172A', 700: '#334155', 600: '#475569',
    400: '#94A3B8', 300: '#CBD5E1', 200: '#E5E7EB',
    bg: '#F9FAFB'
  }
};

// ============================================
// DIMENSION TITLES
// ============================================
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
  13: 'Communication & Awareness'
};

// ============================================
// COMPLETE DIMENSION QUESTION MAPPINGS
// ============================================

// D1 - Medical Leave & Flexibility
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

// D2 - Insurance & Financial Protection
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

// D3 - Manager Preparedness & Capability
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

// D4 - Navigation & Expert Resources
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

// D5 - Workplace Accommodations
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

// D6 - Culture & Psychological Safety
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

// D7 - Career Continuity & Advancement
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

// D8 - Return-to-Work Excellence
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

// D9 - Executive Commitment & Resources
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

// D10 - Caregiver & Family Support
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

// D11 - Prevention, Wellness & Legal Compliance
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

// D12 - Continuous Improvement & Outcomes
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

// D13 - Communication & Awareness
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

// Combine all dimension questions
const ALL_DIMENSION_QUESTIONS: Record<string, Record<string, string>> = {
  d1: D1_QUESTIONS,
  d2: D2_QUESTIONS,
  d3: D3_QUESTIONS,
  d4: D4_QUESTIONS,
  d5: D5_QUESTIONS,
  d6: D6_QUESTIONS,
  d7: D7_QUESTIONS,
  d8: D8_QUESTIONS,
  d9: D9_QUESTIONS,
  d10: D10_QUESTIONS,
  d11: D11_QUESTIONS,
  d12: D12_QUESTIONS,
  d13: D13_QUESTIONS
};

// ============================================
// FIELD LABELS - COMPREHENSIVE
// ============================================
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

  // Employee Impact Assessment - COMPLETE
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

// ============================================
// HELPER FUNCTIONS
// ============================================

function getQuestionLabel(dimNumber: number, fieldKey: string): string {
  const dimKey = `d${dimNumber}`;
  const dimQuestions = ALL_DIMENSION_QUESTIONS[dimKey];
  
  if (dimQuestions && dimQuestions[fieldKey]) {
    return dimQuestions[fieldKey];
  }
  
  if (FIELD_LABELS[fieldKey]) {
    return FIELD_LABELS[fieldKey];
  }
  
  return formatGenericLabel(fieldKey);
}

function formatGenericLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return formatGenericLabel(key);
}

function selectedOnly(value: any): string[] | string | null {
  if (value == null || value === '') return null;

  if (Array.isArray(value)) {
    const filtered = value.map(String).map(s => s.trim()).filter(Boolean);
    return filtered.length ? filtered : null;
  }

  if (typeof value === 'object') {
    const selected = Object.keys(value).filter(k => {
      const v = value[k];
      if (v === true || v === 'selected' || v === 'checked') return true;
      if (typeof v === 'string' && v.trim() && v.toLowerCase() !== 'no') return true;
      return false;
    });
    return selected.length ? selected : null;
  }

  const str = String(value).trim();
  return str ? str : null;
}

function sectionEmpty(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return true;
  return Object.keys(obj).length === 0;
}

function hasAnySelected(obj: Record<string, any>): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return Object.values(obj).some(v => selectedOnly(v) != null);
}

// ============================================
// PARSE DIMENSION DATA
// ============================================
function parseDimensionData(
  dimNumber: number,
  data: Record<string, any>
): Array<{ question: string; response: string }> {
  const result: Array<{ question: string; response: string }> = [];

  // Process ALL fields in the dimension data
  Object.entries(data).forEach(([key, value]) => {
    // Handle grid fields (d1a, d2a, d3a, etc.)
    if (key.match(/^d\d+a$/) && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([questionText, response]) => {
        if (response && typeof response === 'string') {
          result.push({
            question: questionText,
            response: response
          });
        }
      });
    }
    // Handle follow-up questions (everything else)
    else if (key.match(/^d\d+/) && !key.endsWith('_none')) {
      const resp = selectedOnly(value);
      if (resp) {
        result.push({
          question: getQuestionLabel(dimNumber, key),
          response: Array.isArray(resp) ? resp.join(', ') : resp
        });
      }
    }
  });

  return result;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function CompanyProfile() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const gen = JSON.parse(localStorage.getItem('general-benefits_data') || localStorage.getItem('general_benefits_data') || '{}');
    const cur = JSON.parse(localStorage.getItem('current-support_data') || localStorage.getItem('current_support_data') || '{}');
    const cross = JSON.parse(localStorage.getItem('cross_dimensional_data') || '{}');
    const impact = JSON.parse(localStorage.getItem('employee_impact_data') || '{}');

    const dims: any[] = [];
    for (let i = 1; i <= 13; i++) {
      const raw = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      if (Object.keys(raw).length > 0) {
        dims.push({ number: i, data: raw });
      }
    }

    const companyName =
      localStorage.getItem('login_company_name') ||
      firmo.companyName ||
      firmo.company_name ||
      firmo.s8 ||
      'Organization';
    const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email') || '';
    const firstName = localStorage.getItem('login_first_name') || '';
    const lastName = localStorage.getItem('login_last_name') || '';

    setData({
      companyName,
      email,
      firstName,
      lastName,
      generatedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      firmographics: firmo,
      general: gen,
      current: cur,
      cross,
      impact,
      dimensions: dims
    });

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: BRAND.gray.bg }}>
        <div className="text-sm" style={{ color: BRAND.gray[600] }}>
          Loading profile...
        </div>
      </div>
    );
  }

  const firmo = data.firmographics || {};
  const gen = data.general || {};
  const cur = data.current || {};
  const cd = data.cross || {};
  const ei = data.impact || {};

  // Filter out POC fields (s3, s4a, s4b, s5, s6, s7) and gender (s2)
  const firmoFiltered = Object.fromEntries(
    Object.entries(firmo).filter(([k]) => !['s1', 's2', 's3', 's4a', 's4b', 's5', 's6', 's7'].includes(k))
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.gray.bg }}>
      {/* Header with Logos */}
      <div className="bg-white border-b" style={{ borderColor: BRAND.gray[200] }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-28" />
            <div className="flex-1 flex justify-center">
              <img
                src="/best-companies-2026-logo.png"
                alt="Best Companies for Working with Cancer Award"
                className="h-16 sm:h-20 lg:h-24 w-auto drop-shadow-md"
              />
            </div>
            <div className="flex justify-end">
              <img
                src="/cancer-careers-logo.png"
                alt="Cancer and Careers"
                className="h-10 sm:h-14 lg:h-16 w-auto"
              />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-5xl font-black mb-2" style={{ color: BRAND.primary }}>
              {data.companyName}
            </h1>
            <p className="text-base" style={{ color: BRAND.gray[600] }}>
              Company Profile & Survey Summary
            </p>
            <p className="text-sm mt-1" style={{ color: BRAND.gray[600] }}>
              Generated: {data.generatedAt}
              {data.email ? ` • ${data.email}` : ''}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
              <a
                href="/dashboard"
                className="px-3 py-1.5 text-sm font-semibold border rounded"
                style={{ borderColor: BRAND.gray[200], color: BRAND.gray[900] }}
              >
                Back to Dashboard
              </a>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-sm font-semibold rounded text-white"
                style={{ backgroundColor: BRAND.primary }}
              >
                Print PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* Point of Contact - SEPARATE SECTION */}
        <Section title="Point of Contact">
          <DataRow label="Name" value={`${data.firstName} ${data.lastName}`.trim() || null} />
          <DataRow label="Email" value={data.email} />
          <DataRow label="Department" value={firmo?.s4a || firmo?.s3} />
          <DataRow label="Primary Job Function" value={firmo?.s4b} />
          <DataRow label="Current Level" value={firmo?.s5} />
          <DataRow label="Areas of Responsibility" value={selectedOnly(firmo?.s6)} />
          <DataRow label="Level of Influence on Benefits" value={firmo?.s7} />
        </Section>

        {/* Company Profile & Firmographics - NO POC, NO GENDER */}
        <Section
          title="Company Profile & Firmographics (Full)"
          placeholderWhenEmpty={sectionEmpty(firmoFiltered) ? '(No data recorded)' : false}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(firmoFiltered)
                .slice(0, Math.ceil(Object.keys(firmoFiltered).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
            </div>
            <div>
              {Object.entries(firmoFiltered)
                .slice(Math.ceil(Object.keys(firmoFiltered).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
            </div>
          </div>
        </Section>

        {/* General Employee Benefits */}
        <Section
          title="General Employee Benefits"
          placeholderWhenEmpty={sectionEmpty(gen) ? '(No data recorded)' : false}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(gen)
                .slice(0, Math.ceil(Object.keys(gen).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
            </div>
            <div>
              {Object.entries(gen)
                .slice(Math.ceil(Object.keys(gen).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
            </div>
          </div>
        </Section>

        {/* Current Support for Employees Managing Cancer */}
        <Section
          title="Current Support for Employees Managing Cancer"
          placeholderWhenEmpty={sectionEmpty(cur) ? '(No data recorded)' : false}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(cur)
                .slice(0, Math.ceil(Object.keys(cur).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
            </div>
            <div>
              {Object.entries(cur)
                .slice(Math.ceil(Object.keys(cur).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
            </div>
          </div>
        </Section>

        {/* 13 Dimensions of Support - EACH SUPPORT OPTION LISTED SEPARATELY */}
        <div className="flex items-baseline justify-between mb-3 mt-8">
          <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>
            13 Dimensions of Support
          </h2>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded border bg-white"
            style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}
          >
            D13 uses 5-point scale (includes Unsure/NA)
          </span>
        </div>

        {data.dimensions.map((dim: { number: number; data: Record<string, any> }) => {
          const qaItems = parseDimensionData(dim.number, dim.data);
          const half = Math.ceil(qaItems.length / 2);
          const left = qaItems.slice(0, half);
          const right = qaItems.slice(half);

          return (
            <Section
              key={dim.number}
              title={`Dimension ${dim.number}: ${DIM_TITLE[dim.number]}`}
              badge={dim.number === 13 ? '5-point' : undefined}
              placeholderWhenEmpty={qaItems.length === 0 ? '(No responses recorded)' : false}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                <div>
                  {left.map((item, idx) => (
                    <DataRow key={idx} label={item.question} value={item.response} />
                  ))}
                </div>
                <div>
                  {right.map((item, idx) => (
                    <DataRow key={idx} label={item.question} value={item.response} />
                  ))}
                </div>
              </div>
            </Section>
          );
        })}

        {/* Cross-Dimensional Assessment */}
        <Section
          title="Cross-Dimensional Assessment"
          placeholderWhenEmpty={sectionEmpty(cd) ? '(No data recorded)' : false}
        >
          <div className="space-y-2">
            {Object.entries(cd || {}).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </div>
        </Section>

        {/* Employee Impact Assessment */}
        <Section
          title="Employee Impact Assessment"
          placeholderWhenEmpty={sectionEmpty(ei) ? '(No data recorded)' : false}
        >
          <div className="space-y-2">
            {Object.entries(ei || {}).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div
          className="mt-10 pt-6 border-t text-center text-xs"
          style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}
        >
          Best Companies for Working with Cancer: Employer Index • ©{' '}
          {new Date().getFullYear()} Cancer and Careers & CEW Foundation • All responses
          collected and analyzed by BEYOND Insights, LLC
        </div>
      </main>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          section {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================
// SECTION COMPONENT
// ============================================
interface SectionProps {
  title: string;
  badge?: string;
  placeholderWhenEmpty?: string | boolean;
  children: React.ReactNode;
}

function Section({ title, badge, placeholderWhenEmpty, children }: SectionProps) {
  const isEmpty = React.Children.count(children) === 0 || placeholderWhenEmpty === true;

  return (
    <section className="mb-6 bg-white rounded-lg border p-6" style={{ borderColor: BRAND.gray[200] }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>
          {title}
        </h2>
        {badge && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded border bg-white"
            style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}
          >
            {badge}
          </span>
        )}
      </div>
      {isEmpty && typeof placeholderWhenEmpty === 'string' ? (
        <div className="text-sm italic" style={{ color: BRAND.gray[400] }}>
          {placeholderWhenEmpty}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

// ============================================
// DATA ROW COMPONENT
// ============================================
interface DataRowProps {
  label: string;
  value?: string | string[] | null;
}

function DataRow({ label, value }: DataRowProps) {
  // CRITICAL: Hide row if no value - NO DASHES
  if (!value) return null;

  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <div className="flex py-2 border-b last:border-b-0" style={{ borderColor: BRAND.gray[200] }}>
      {/* Label column - EXACTLY 1/3 width */}
      <div className="w-1/3 pr-4">
        <span className="text-sm font-medium" style={{ color: BRAND.gray[600] }}>
          {label}
        </span>
      </div>

      {/* Value column - EXACTLY 2/3 width, LEFT-ALIGNED */}
      <div className="w-2/3 text-left">
        <span className="text-sm" style={{ color: BRAND.gray[900] }}>
          {displayValue}
        </span>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';

// ============================================
// PROFESSIONAL COLOR PALETTE
// ============================================
const COLORS = {
  brand: {
    purple: '#6B2C91',
    purpleLight: '#8B4DB3',
    purpleBg: '#F5EDFF',
  },
  sections: {
    firmographics: { main: '#6B2C91', light: '#F5EDFF', border: '#D4B5E8' },
    benefits: { main: '#00A896', light: '#E6F9F7', border: '#99E6DD' },
    support: { main: '#FF6B35', light: '#FFF0EC', border: '#FFD4C4' },
    dimensions: { main: '#4F46E5', light: '#EEF2FF', border: '#C7D2FE' },
    crossDim: { main: '#10B981', light: '#D1FAE5', border: '#6EE7B7' },
    impact: { main: '#3B82F6', light: '#DBEAFE', border: '#93C5FD' },
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#64748B',
    light: '#94A3B8',
  },
  ui: {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    borderDark: '#CBD5E1',
  }
};

// ============================================
// SVG ICONS (NO EMOJIS)
// ============================================
const Icons = {
  User: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Building: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Briefcase: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Heart: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
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

// Dimension color scheme
const DIM_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
  '#84CC16', '#A855F7', '#EAB308'
];

// ============================================
// COMPLETE DIMENSION QUESTION MAPPINGS
// ALL 13 DIMENSIONS - EVERY SINGLE QUESTION
// ============================================

// D1 - Medical Leave & Flexibility (10 items + 4 follow-ups)
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
  'd1_1': 'Paid medical leave duration beyond legal requirements',
  'd1_2': 'Intermittent leave policy details',
  'd1_4a': 'Remote work availability for on-site roles',
  'd1_4b': 'Reduced schedule with full benefits details',
  'd1_5': 'Job protection duration beyond legal requirements',
  'd1_6': 'Additional leave program details',
  'd1aa': 'Geographic consistency across locations',
  'd1b': 'Additional medical leave/flexibility benefits not listed'
};

// D2 - Insurance & Financial Protection (17 items + 6 follow-ups)
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
  'd2_6': 'Who provides financial counseling services',
  'd2aa': 'Geographic consistency across locations',
  'd2b': 'Additional insurance/financial protection benefits not listed'
};

// D3 - Manager Preparedness & Capability (10 items + 4 follow-ups)
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
  'd3_1': 'Percentage of managers who completed training in past 2 years',
  'd3aa': 'Geographic consistency across locations',
  'd3b': 'Additional manager preparedness initiatives not listed'
};

// D4 - Navigation & Expert Resources (10 items + 4 follow-ups)
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
  'd4_1a': 'Internal vs. external navigation support model',
  'd4_1b': 'Additional navigation service details',
  'd4aa': 'Geographic consistency across locations',
  'd4b': 'Additional navigation/expert resources not listed'
};

// D5 - Workplace Accommodations (9 items + 2 follow-ups)
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
  'd5aa': 'Geographic consistency across locations',
  'd5b': 'Additional workplace accommodations not listed'
};

// D6 - Culture & Psychological Safety (12 items + 4 follow-ups)
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
  'd6aa': 'Geographic consistency across locations',
  'd6b': 'Additional culture/psychological safety initiatives not listed'
};

// D7 - Career Continuity & Advancement (9 items + 2 follow-ups)
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

// D8 - Return-to-Work Excellence (12 items + 2 follow-ups)
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
  'd8aa': 'Geographic consistency across locations',
  'd8b': 'Additional return-to-work programs not listed'
};

// D9 - Executive Commitment & Resources (7 items + 4 follow-ups)
const D9_QUESTIONS: Record<string, string> = {
  "Visible executive leadership on health equity": "Visible executive leadership on health equity",
  "Dedicated budget for workplace support programs": "Dedicated budget for workplace support programs",
  "Executive accountability for program outcomes": "Executive accountability for program outcomes",
  "Board-level reporting on health support initiatives": "Board-level reporting on health support initiatives",
  "Cross-functional workplace support committee": "Cross-functional workplace support committee",
  "Regular employee listening sessions": "Regular employee listening sessions",
  "Transparent program evaluation metrics": "Transparent program evaluation metrics",
  'd9_2': 'Budget allocation details for workplace support programs',
  'd9_3': 'Executive accountability mechanisms and metrics',
  'd9aa': 'Geographic consistency across locations',
  'd9b': 'Additional executive commitment initiatives not listed'
};

// D10 - Caregiver & Family Support (9 items + 3 follow-ups)
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
  'd10_1': 'Caregiver program eligibility and details',
  'd10aa': 'Geographic consistency across locations',
  'd10b': 'Additional caregiver/family support programs not listed'
};

// D11 - Prevention, Wellness & Legal Compliance (9 items + 3 follow-ups)
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
  'd11aa': 'Geographic consistency across locations',
  'd11b': 'Additional prevention/wellness programs not listed'
};

// D12 - Continuous Improvement & Outcomes (8 items + 4 follow-ups)
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
  'd12aa': 'Geographic consistency across locations',
  'd12b': 'Additional measurement/tracking approaches not listed'
};

// D13 - Communication & Awareness (9 items + 3 follow-ups)
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
  'd13aa': 'Geographic consistency across locations',
  'd13b': 'Additional communication/awareness approaches not listed'
};

// Combine all dimension questions into one lookup
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
// COMPREHENSIVE FIELD LABELS
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

  // General Benefits - Complete
  cb1: 'Standard Benefits Offered',
  cb1a: '% of Employees with National Healthcare Access',
  cb1_standard: 'Standard Benefits Package',
  cb1_leave: 'Leave & Flexibility Programs',
  cb1_wellness: 'Wellness & Support Programs',
  cb1_financial: 'Financial & Legal Assistance Programs',
  cb1_navigation: 'Care Navigation & Support Services',
  cb2: 'Leave & Flexibility Programs Status',
  cb2a: 'Leave Programs Availability',
  cb2b: 'Wellness & Support Programs Availability',
  cb3: 'Financial & Legal Assistance Programs Status',
  cb3a: 'Cancer Support Program Characterization',
  cb3b: 'Key Cancer Support Program Features',
  cb3c: 'Serious Health Conditions Covered by Support Programs',
  cb3d: 'Communication Methods for Support Programs',
  cb4: 'Planned Benefits Enhancements',

  // Current Support - Complete
  cs1: 'Current Support Approach',
  or1: 'Current Level of Support for Employees Managing Cancer',
  or2a: 'Triggers that Led to Development of Support Programs',
  or2b: 'Most Impactful Change Made to Support Programs',
  or3: 'Available Support Resources and Barriers',
  or4: 'Barriers to Enhanced Support',
  or5a: 'Key Program Features for Cancer Support',
  or6: 'Monitoring & Evaluation Approach for Programs',

  // Cross-Dimensional Assessment
  cd1a: 'Top 3 Dimensions for Best Outcomes if Enhanced',
  cd1b: 'Bottom 3 Dimensions (Lowest Priority)',
  cd2: 'Biggest Implementation Challenges for Workplace Support Programs',

  // Employee Impact Assessment - Complete (10 items)
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
  ei2: 'ROI Analysis Status for Workplace Support Programs',
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

function parseDimensionData(
  dimNumber: number,
  data: Record<string, any>
): Array<{ question: string; response: string }> {
  const result: Array<{ question: string; response: string }> = [];

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
    // Handle follow-up questions
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
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: COLORS.ui.bg }}>
        <div className="text-lg font-medium" style={{ color: COLORS.text.secondary }}>
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
  const firmoFiltered = Object.fromEntries(
    Object.entries(firmo).filter(([k]) => !['s1', 's2', 's3', 's4a', 's4b', 's5', 's6', 's7'].includes(k))
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.ui.bg }}>
      {/* PROFESSIONAL HEADER */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${COLORS.brand.purple} 0%, ${COLORS.brand.purpleLight} 100%)`
        }}
      >
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="w-32" />
            <img
              src="/best-companies-2026-logo.png"
              alt="Award"
              className="h-24 lg:h-32 w-auto drop-shadow-2xl"
            />
            <img
              src="/cancer-careers-logo.png"
              alt="CAC"
              className="h-16 lg:h-20 w-auto"
            />
          </div>
          <div className="text-center text-white">
            <h1 className="text-6xl lg:text-7xl font-black mb-4 drop-shadow-lg">
              {data.companyName}
            </h1>
            <p className="text-2xl font-light opacity-90 mb-2">Workplace Support Profile</p>
            <p className="text-lg opacity-75">Generated: {data.generatedAt}</p>
            <div className="mt-8 flex items-center justify-center gap-4 print:hidden">
              <a
                href="/dashboard"
                className="px-6 py-3 bg-white text-purple-700 rounded-lg font-bold shadow-lg hover:shadow-xl transition-shadow"
              >
                ← Dashboard
              </a>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-white/20 backdrop-blur text-white rounded-lg font-bold border-2 border-white/50 hover:bg-white/30 transition-colors"
              >
                Print PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* POINT OF CONTACT */}
        <ProfileCard title="Point of Contact" icon={<Icons.User />} color={COLORS.sections.firmographics}>
          <DataRow label="Name" value={`${data.firstName} ${data.lastName}`.trim() || null} />
          <DataRow label="Email" value={data.email} />
          <DataRow label="Department" value={firmo?.s4a || firmo?.s3} />
          <DataRow label="Primary Job Function" value={firmo?.s4b} />
          <DataRow label="Current Level" value={firmo?.s5} />
          <DataRow label="Areas of Responsibility" value={selectedOnly(firmo?.s6)} />
          <DataRow label="Level of Influence" value={firmo?.s7} />
        </ProfileCard>

        {/* FIRMOGRAPHICS */}
        <ProfileCard
          title="Company Profile & Firmographics"
          icon={<Icons.Building />}
          color={COLORS.sections.firmographics}
          isEmpty={sectionEmpty(firmoFiltered)}
        >
          <TwoColumnLayout>
            {Object.entries(firmoFiltered).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </TwoColumnLayout>
        </ProfileCard>

        {/* GENERAL BENEFITS */}
        <ProfileCard
          title="General Employee Benefits"
          icon={<Icons.Briefcase />}
          color={COLORS.sections.benefits}
          isEmpty={sectionEmpty(gen)}
        >
          <TwoColumnLayout>
            {Object.entries(gen).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </TwoColumnLayout>
        </ProfileCard>

        {/* CURRENT SUPPORT */}
        <ProfileCard
          title="Current Support for Employees Managing Cancer"
          icon={<Icons.Heart />}
          color={COLORS.sections.support}
          isEmpty={sectionEmpty(cur)}
        >
          <TwoColumnLayout>
            {Object.entries(cur).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </TwoColumnLayout>
        </ProfileCard>

        {/* 13 DIMENSIONS */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black" style={{ color: COLORS.text.primary }}>
              13 Dimensions of Support
            </h2>
            <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
              D13 uses 5-point scale
            </span>
          </div>
          {data.dimensions.map((dim: { number: number; data: Record<string, any> }) => {
            const qaItems = parseDimensionData(dim.number, dim.data);
            return (
              <DimensionCard
                key={dim.number}
                number={dim.number}
                title={DIM_TITLE[dim.number]}
                color={DIM_COLORS[dim.number - 1]}
                isEmpty={qaItems.length === 0}
              >
                <TwoColumnLayout>
                  {qaItems.map((item, idx) => (
                    <DataRow key={idx} label={item.question} value={item.response} />
                  ))}
                </TwoColumnLayout>
              </DimensionCard>
            );
          })}
        </div>

        {/* CROSS-DIMENSIONAL */}
        <ProfileCard
          title="Cross-Dimensional Assessment"
          icon={<Icons.Refresh />}
          color={COLORS.sections.crossDim}
          isEmpty={sectionEmpty(cd)}
        >
          {Object.entries(cd || {}).map(([k, v]) => (
            <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
          ))}
        </ProfileCard>

        {/* EMPLOYEE IMPACT */}
        <ProfileCard
          title="Employee Impact Assessment"
          icon={<Icons.Chart />}
          color={COLORS.sections.impact}
          isEmpty={sectionEmpty(ei)}
        >
          {Object.entries(ei || {}).map(([k, v]) => (
            <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
          ))}
        </ProfileCard>

        {/* FOOTER */}
        <div
          className="mt-16 pt-8 border-t-2 text-center text-sm"
          style={{ borderColor: COLORS.ui.borderDark, color: COLORS.text.muted }}
        >
          <p className="font-semibold mb-2">
            Best Companies for Working with Cancer: Employer Index
          </p>
          <p>© {new Date().getFullYear()} Cancer and Careers & CEW Foundation</p>
          <p className="mt-1">All responses collected and analyzed by BEYOND Insights, LLC</p>
        </div>
      </main>

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
        }
      `}</style>
    </div>
  );
}

// ============================================
// PROFILE CARD COMPONENT
// ============================================
interface ProfileCardProps {
  title: string;
  icon: React.ReactNode;
  color: { main: string; light: string; border: string };
  isEmpty?: boolean;
  children: React.ReactNode;
}

function ProfileCard({ title, icon, color, isEmpty, children }: ProfileCardProps) {
  return (
    <div
      className="mb-8 rounded-xl overflow-hidden shadow-lg border-2 print:break-inside-avoid"
      style={{ borderColor: color.border, backgroundColor: COLORS.ui.cardBg }}
    >
      <div
        className="flex items-center gap-3 px-8 py-5 border-b-4"
        style={{ backgroundColor: color.light, borderColor: color.main }}
      >
        <div style={{ color: color.main }}>{icon}</div>
        <h2 className="text-2xl font-black" style={{ color: COLORS.text.primary }}>
          {title}
        </h2>
      </div>
      <div className="p-8">
        {isEmpty ? (
          <p className="text-center italic py-8" style={{ color: COLORS.text.light }}>
            (No data recorded)
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ============================================
// DIMENSION CARD COMPONENT
// ============================================
interface DimensionCardProps {
  number: number;
  title: string;
  color: string;
  isEmpty: boolean;
  children: React.ReactNode;
}

function DimensionCard({ number, title, color, isEmpty, children }: DimensionCardProps) {
  return (
    <div
      className="mb-6 rounded-xl overflow-hidden shadow-lg border-l-8 print:break-inside-avoid"
      style={{ borderColor: color, backgroundColor: COLORS.ui.cardBg }}
    >
      <div className="flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-gray-50 to-white">
        <div
          className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg"
          style={{ backgroundColor: color }}
        >
          {number}
        </div>
        <div>
          <div
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: COLORS.text.muted }}
          >
            Dimension {number}
          </div>
          <h3 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>
            {title}
          </h3>
        </div>
      </div>
      <div className="p-8">
        {isEmpty ? (
          <p className="text-center italic py-4" style={{ color: COLORS.text.light }}>
            (No responses recorded)
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ============================================
// TWO COLUMN LAYOUT
// ============================================
function TwoColumnLayout({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  const half = Math.ceil(items.length / 2);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-1">
      <div>{items.slice(0, half)}</div>
      <div>{items.slice(half)}</div>
    </div>
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
  if (!value) return null;
  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <div
      className="py-3 border-b last:border-b-0 hover:bg-gray-50/50 transition-colors"
      style={{ borderColor: COLORS.ui.border }}
    >
      <div
        className="text-xs font-bold uppercase tracking-wide mb-1"
        style={{ color: COLORS.text.muted }}
      >
        {label}
      </div>
      <div className="text-base" style={{ color: COLORS.text.primary }}>
        {displayValue}
      </div>
    </div>
  );
}

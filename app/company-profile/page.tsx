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
// COMPREHENSIVE DIMENSION QUESTIONS
// ============================================
const ALL_DIM_QUESTIONS: Record<string, Record<string, string>> = {
  d1: {
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
    'd1aa': 'Geographic consistency',
    'd1b': 'Additional benefits'
  },
  d2: {
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
    'd2_1': 'Additional insurance details',
    'd2_2': 'Effectiveness measurement',
    'd2aa': 'Geographic consistency',
    'd2b': 'Additional benefits'
  },
  d3: {
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
    'd3_1a': 'Training requirement type',
    'd3_1': 'Training completion rate',
    'd3aa': 'Geographic consistency',
    'd3b': 'Additional initiatives'
  },
  // Add remaining dimensions similarly...
  d4: { 'd4aa': 'Geographic consistency', 'd4b': 'Additional resources' },
  d5: { 'd5aa': 'Geographic consistency', 'd5b': 'Additional accommodations' },
  d6: { 'd6_1': 'Peer support types', 'd6_2': 'Effectiveness measurement', 'd6aa': 'Geographic consistency', 'd6b': 'Additional initiatives' },
  d7: { 'd7aa': 'Geographic consistency', 'd7b': 'Additional programs' },
  d8: { 'd8aa': 'Geographic consistency', 'd8b': 'Additional programs' },
  d9: { 'd9aa': 'Geographic consistency', 'd9b': 'Additional initiatives' },
  d10: { 'd10aa': 'Geographic consistency', 'd10b': 'Additional support' },
  d11: { 'd11_1': 'Preventive care services', 'd11aa': 'Geographic consistency', 'd11b': 'Additional programs' },
  d12: { 'd12_1': 'Data sources', 'd12_2': 'Feedback incorporation', 'd12aa': 'Geographic consistency', 'd12b': 'Additional approaches' },
  d13: { 'd13_1': 'Campaign frequency', 'd13aa': 'Geographic consistency', 'd13b': 'Additional approaches' }
};

// ============================================
// FIELD LABELS
// ============================================
const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company Name', s8: 'Total Employee Size', s9: 'Headquarters Location',
  s9a: 'Countries with Employee Presence', c2: 'Industry',
  c3: 'Excluded Employee Groups', c4: '% Eligible for Standard Benefits',
  c5: 'Annual Revenue', c6: 'Remote/Hybrid Policy',
  cb1: 'Standard Benefits', cb1a: '% with National Healthcare Access',
  cb2: 'Leave & Flexibility Programs', cb3: 'Financial & Legal Assistance',
  cb3a: 'Program Characterization', cb3b: 'Key Features',
  cb3c: 'Conditions Covered', cb3d: 'Communication Methods',
  or1: 'Current Approach', or2a: 'Development Triggers', or2b: 'Most Impactful Change',
  or3: 'Support Resources', or5a: 'Program Features', or6: 'Monitoring & Evaluation',
  cd1a: 'Top 3 Dimensions for Best Outcomes',
  cd1b: 'Bottom 3 Dimensions (Lowest Priority)',
  cd2: 'Biggest Implementation Challenges',
  ei1: 'Employee Retention', ei1a: 'Reducing Absenteeism', ei1b: 'Maintaining Performance',
  ei1c: 'Healthcare Cost Management', ei1d: 'Employee Morale', ei1e: 'Employer Reputation',
  ei1f: 'Productivity During Treatment', ei1g: 'Manager Confidence',
  ei1h: 'Return-to-Work Quality', ei1i: 'Family/Caregiver Stress',
  ei2: 'ROI Analysis Status', ei3: 'ROI Results', ei4: 'Advice to HR Leaders',
  ei5: 'Other Conditions Covered'
};

function getQuestionLabel(dimNumber: number, fieldKey: string): string {
  const dimKey = `d${dimNumber}`;
  const dimQuestions = ALL_DIM_QUESTIONS[dimKey];
  if (dimQuestions && dimQuestions[fieldKey]) return dimQuestions[fieldKey];
  if (FIELD_LABELS[fieldKey]) return FIELD_LABELS[fieldKey];
  return fieldKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, l => l.toUpperCase());
}

function formatLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, l => l.toUpperCase());
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

function parseDimensionData(dimNumber: number, data: Record<string, any>): Array<{ question: string; response: string }> {
  const result: Array<{ question: string; response: string }> = [];
  Object.entries(data).forEach(([key, value]) => {
    if (key.match(/^d\d+a$/) && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([questionText, response]) => {
        if (response && typeof response === 'string') {
          result.push({ question: questionText, response: response });
        }
      });
    } else if (key.match(/^d\d+/) && !key.endsWith('_none')) {
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

    const companyName = localStorage.getItem('login_company_name') || firmo.companyName || firmo.company_name || 'Organization';
    const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email') || '';
    const firstName = localStorage.getItem('login_first_name') || '';
    const lastName = localStorage.getItem('login_last_name') || '';

    setData({
      companyName, email, firstName, lastName,
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      firmographics: firmo, general: gen, current: cur, cross, impact, dimensions: dims
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: COLORS.ui.bg }}>
        <div className="text-lg font-medium" style={{ color: COLORS.text.secondary }}>Loading profile...</div>
      </div>
    );
  }

  const firmo = data.firmographics || {};
  const gen = data.general || {};
  const cur = data.current || {};
  const cd = data.cross || {};
  const ei = data.impact || {};
  const firmoFiltered = Object.fromEntries(Object.entries(firmo).filter(([k]) => !['s1', 's2', 's3', 's4a', 's4b', 's5', 's6', 's7'].includes(k)));

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.ui.bg }}>
      {/* PROFESSIONAL HEADER */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.brand.purple} 0%, ${COLORS.brand.purpleLight} 100%)` }}>
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="w-32" />
            <img src="/best-companies-2026-logo.png" alt="Award" className="h-24 lg:h-32 w-auto drop-shadow-2xl" />
            <img src="/cancer-careers-logo.png" alt="CAC" className="h-16 lg:h-20 w-auto" />
          </div>
          <div className="text-center text-white">
            <h1 className="text-6xl lg:text-7xl font-black mb-4 drop-shadow-lg">{data.companyName}</h1>
            <p className="text-2xl font-light opacity-90 mb-2">Workplace Support Profile</p>
            <p className="text-lg opacity-75">Generated: {data.generatedAt}</p>
            <div className="mt-8 flex items-center justify-center gap-4 print:hidden">
              <a href="/dashboard" className="px-6 py-3 bg-white text-purple-700 rounded-lg font-bold shadow-lg hover:shadow-xl transition-shadow">
                ← Dashboard
              </a>
              <button onClick={() => window.print()} className="px-6 py-3 bg-white/20 backdrop-blur text-white rounded-lg font-bold border-2 border-white/50 hover:bg-white/30 transition-colors">
                Print PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* POINT OF CONTACT */}
        <ProfileCard
          title="Point of Contact"
          icon="👤"
          color={COLORS.sections.firmographics}
        >
          <DataRow label="Name" value={`${data.firstName} ${data.lastName}`.trim() || null} />
          <DataRow label="Email" value={data.email} />
          <DataRow label="Department" value={firmo?.s4a || firmo?.s3} />
          <DataRow label="Primary Job Function" value={firmo?.s4b} />
          <DataRow label="Current Level" value={firmo?.s5} />
          <DataRow label="Areas of Responsibility" value={selectedOnly(firmo?.s6)} />
          <DataRow label="Level of Influence" value={firmo?.s7} />
        </ProfileCard>

        {/* FIRMOGRAPHICS */}
        <ProfileCard title="Company Profile & Firmographics" icon="🏢" color={COLORS.sections.firmographics} isEmpty={sectionEmpty(firmoFiltered)}>
          <TwoColumnLayout>
            {Object.entries(firmoFiltered).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </TwoColumnLayout>
        </ProfileCard>

        {/* GENERAL BENEFITS */}
        <ProfileCard title="General Employee Benefits" icon="💼" color={COLORS.sections.benefits} isEmpty={sectionEmpty(gen)}>
          <TwoColumnLayout>
            {Object.entries(gen).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </TwoColumnLayout>
        </ProfileCard>

        {/* CURRENT SUPPORT */}
        <ProfileCard title="Current Support for Employees Managing Cancer" icon="🎗️" color={COLORS.sections.support} isEmpty={sectionEmpty(cur)}>
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
        <ProfileCard title="Cross-Dimensional Assessment" icon="🔄" color={COLORS.sections.crossDim} isEmpty={sectionEmpty(cd)}>
          {Object.entries(cd || {}).map(([k, v]) => (
            <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
          ))}
        </ProfileCard>

        {/* EMPLOYEE IMPACT */}
        <ProfileCard title="Employee Impact Assessment" icon="📊" color={COLORS.sections.impact} isEmpty={sectionEmpty(ei)}>
          {Object.entries(ei || {}).map(([k, v]) => (
            <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
          ))}
        </ProfileCard>

        {/* FOOTER */}
        <div className="mt-16 pt-8 border-t-2 text-center text-sm" style={{ borderColor: COLORS.ui.borderDark, color: COLORS.text.muted }}>
          <p className="font-semibold mb-2">Best Companies for Working with Cancer: Employer Index</p>
          <p>© {new Date().getFullYear()} Cancer and Careers & CEW Foundation</p>
          <p className="mt-1">All responses collected and analyzed by BEYOND Insights, LLC</p>
        </div>
      </main>

      <style jsx>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
  icon: string;
  color: { main: string; light: string; border: string };
  isEmpty?: boolean;
  children: React.ReactNode;
}

function ProfileCard({ title, icon, color, isEmpty, children }: ProfileCardProps) {
  return (
    <div className="mb-8 rounded-xl overflow-hidden shadow-lg border-2 print:break-inside-avoid" style={{ borderColor: color.border, backgroundColor: COLORS.ui.cardBg }}>
      <div className="flex items-center gap-3 px-8 py-5 border-b-4" style={{ backgroundColor: color.light, borderColor: color.main }}>
        <span className="text-3xl">{icon}</span>
        <h2 className="text-2xl font-black" style={{ color: COLORS.text.primary }}>{title}</h2>
      </div>
      <div className="p-8">
        {isEmpty ? (
          <p className="text-center italic py-8" style={{ color: COLORS.text.light }}>
            (No data recorded)
          </p>
        ) : children}
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
    <div className="mb-6 rounded-xl overflow-hidden shadow-lg border-l-8 print:break-inside-avoid" style={{ borderColor: color, backgroundColor: COLORS.ui.cardBg }}>
      <div className="flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg" style={{ backgroundColor: color }}>
          {number}
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: COLORS.text.muted }}>Dimension {number}</div>
          <h3 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>{title}</h3>
        </div>
      </div>
      <div className="p-8">
        {isEmpty ? (
          <p className="text-center italic py-4" style={{ color: COLORS.text.light }}>
            (No responses recorded)
          </p>
        ) : children}
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
    <div className="py-3 border-b last:border-b-0 hover:bg-gray-50/50 transition-colors" style={{ borderColor: COLORS.ui.border }}>
      <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: COLORS.text.muted }}>
        {label}
      </div>
      <div className="text-base" style={{ color: COLORS.text.primary }}>
        {displayValue}
      </div>
    </div>
  );
}

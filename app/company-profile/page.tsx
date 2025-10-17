'use client';

import React, { useEffect, useState } from 'react';

const BRAND = {
  primary: '#6B2C91',
  gray: { 900: '#0F172A', 700: '#334155', 600: '#475569', 400: '#94A3B8', 300: '#CBD5E1', 200: '#E5E7EB', bg: '#F9FAFB' }
};

const DIM_TITLE: Record<number, string> = {
  1: 'Medical Leave & Flexibility', 2: 'Insurance & Financial Protection', 3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources', 5: 'Workplace Accommodations', 6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement', 8: 'Return-to-Work Excellence', 9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support', 11: 'Prevention, Wellness & Legal Compliance', 12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness'
};

// COMPREHENSIVE QUESTION LABELS FOR NON-GRID FIELDS
const FIELD_LABELS: Record<string, string> = {
  // Dimension follow-up questions
  'd1aa': 'Multi-country consistency for Medical Leave & Flexibility',
  'd1b': 'Additional medical leave/flexibility benefits not listed',
  'd2aa': 'Multi-country consistency for Insurance & Financial Protection',
  'd2b': 'Additional insurance/financial protection benefits not listed',
  'd2_1': 'Additional insurance coverage details',
  'd2_2': 'How financial protection effectiveness is measured',
  'd2_5': 'Health insurance premium handling during medical leave',
  'd2_6': 'Who provides financial counseling',
  'd3aa': 'Multi-country consistency for Manager Preparedness programs',
  'd3b': 'Additional manager preparedness initiatives not listed',
  'd3_1a': 'Manager training requirement type',
  'd3_1': 'Percentage of managers who completed training (past 2 years)',
  'd4aa': 'Multi-country consistency for Navigation & Expert Resources',
  'd4b': 'Additional navigation/expert resources not listed',
  'd5aa': 'Multi-country consistency for Workplace Accommodations',
  'd5b': 'Additional workplace accommodations not listed',
  'd6aa': 'Multi-country consistency for Culture & Psychological Safety',
  'd6b': 'Additional culture/safety initiatives not listed',
  'd6_1': 'Types of peer support networks available',
  'd6_2': 'Effectiveness measurement for culture initiatives',
  'd7aa': 'Multi-country consistency for Career Continuity & Advancement',
  'd7b': 'Additional career continuity/advancement programs not listed',
  'd8aa': 'Multi-country consistency for Return-to-Work Excellence',
  'd8b': 'Additional return-to-work programs not listed',
  'd9aa': 'Multi-country consistency for Executive Commitment',
  'd9b': 'Additional executive commitment initiatives not listed',
  'd10aa': 'Multi-country consistency for Caregiver & Family Support',
  'd10b': 'Additional caregiver/family support programs not listed',
  'd11aa': 'Multi-country consistency for Prevention & Wellness',
  'd11b': 'Additional prevention/wellness programs not listed',
  'd11_1': 'Specific preventive care services offered',
  'd12aa': 'Multi-country consistency for Continuous Improvement',
  'd12b': 'Additional measurement/tracking approaches not listed',
  'd12_1': 'Data sources used for measuring program effectiveness',
  'd12_2': 'How feedback is incorporated into improvements',
  'd13aa': 'Multi-country consistency for Communication & Awareness',
  'd13b': 'Additional communication/awareness approaches not listed',
  'd13_1': 'Frequency of awareness campaigns',
  
  // Firmographics (NO POC, NO GENDER)
  companyName: 'Company Name', s8: 'Total Employee Size', s9: 'Headquarters Location', s9a: 'Countries with Employee Presence',
  c2: 'Industry', c3: 'Excluded Employee Groups', c4: '% of Employees Eligible for Standard Benefits',
  c5: 'Annual Revenue', c6: 'Remote/Hybrid Work Policy',

  // General Benefits
  cb1: 'Standard Benefits Offered', cb1a: '% of Employees with National Healthcare Access',
  cb2: 'Leave & Flexibility Programs', cb2b: 'Wellness & Support Programs', cb3: 'Financial & Legal Assistance',
  cb3a: 'Program Characterization', cb3b: 'Key Program Features', cb3c: 'Conditions Covered', cb3d: 'Communication Methods',

  // Current Support
  or1: 'Current Support Approach', or2a: 'Development Triggers', or2b: 'Most Impactful Change',
  or3: 'Available Support Resources', or5a: 'Program Features', or6: 'Monitoring & Evaluation',

  // Cross-Dimensional
  cd1a: 'Top 3 Dimensions for Best Outcomes', cd1b: 'Bottom 3 Dimensions (Lowest Priority)', cd2: 'Biggest Implementation Challenges',

  // Employee Impact - ALL FIELDS
  ei1: 'Impact on Employee Retention', ei1a: 'Impact on Reducing Absenteeism', ei1b: 'Impact on Maintaining Performance',
  ei1c: 'Impact on Healthcare Cost Management', ei1d: 'Impact on Employee Morale', ei1e: 'Impact on Reputation as Employer of Choice',
  ei1f: 'Impact on Productivity During Treatment', ei1g: 'Impact on Manager Confidence', ei1h: 'Impact on Quality of Return-to-Work',
  ei1i: 'Impact on Family/Caregiver Stress', ei2: 'ROI Analysis Status', ei3: 'ROI Analysis Results',
  ei4: 'Advice to HR Leaders', ei5: 'Conditions Beyond Cancer Covered'
};

function formatLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/\s+/g, ' ').trim().replace(/\b\w/g, l => l.toUpperCase());
}

function selectedOnly(value: any): string[] | string | null {
  if (value == null) return null;
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

// PARSE DIMENSION DATA - EACH SUPPORT OPTION GETS ITS OWN ROW
function parseDimensionData(dimNumber: number, data: Record<string, any>): Array<{question: string; response: string}> {
  const result: Array<{question: string; response: string}> = [];
  
  // Find the main grid field (d1a, d2a, d3a, etc.)
  const gridFieldName = `d${dimNumber}a`;
  
  // If grid field exists and is an object, each key is a support option question
  if (data[gridFieldName] && typeof data[gridFieldName] === 'object') {
    Object.entries(data[gridFieldName]).forEach(([questionText, response]) => {
      if (response) {
        result.push({
          question: questionText,  // The ACTUAL question text
          response: String(response)
        });
      }
    });
  }
  
  // Handle all other fields (dXaa, dXb, dX_1, dX_1a, etc.)
  Object.entries(data).forEach(([key, value]) => {
    // Skip the main grid field (already processed)
    if (key === gridFieldName) return;
    
    const question = FIELD_LABELS[key] || formatLabel(key);
    const response = selectedOnly(value);
    
    if (response) {
      result.push({
        question,
        response: Array.isArray(response) ? response.join(', ') : response
      });
    }
  });
  
  return result;
}

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

    const companyName = localStorage.getItem('login_company_name') || firmo.companyName || firmo.company_name || firmo.s8 || 'Organization';
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
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: BRAND.gray.bg }}>
        <div className="text-sm" style={{ color: BRAND.gray[600] }}>Loading profile...</div>
      </div>
    );
  }

  const firmo = data.firmographics || {};
  const gen = data.general || {};
  const cur = data.current || {};
  const cd = data.cross || {};
  const ei = data.impact || {};
  const dimEmpty = '(No responses recorded for this dimension)';

  // Filter out POC fields and gender from firmographics
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
              <img src="/best-companies-2026-logo.png" alt="Best Companies Award" className="h-16 sm:h-20 lg:h-24 w-auto drop-shadow-md" />
            </div>
            <div className="flex justify-end">
              <img src="/cancer-careers-logo.png" alt="Cancer and Careers" className="h-10 sm:h-14 lg:h-16 w-auto" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-5xl font-black mb-2" style={{ color: BRAND.primary }}>{data.companyName}</h1>
            <p className="text-base" style={{ color: BRAND.gray[600] }}>Company Profile & Survey Summary</p>
            <p className="text-sm mt-1" style={{ color: BRAND.gray[600] }}>
              Generated: {data.generatedAt}{data.email ? ` • ${data.email}` : ''}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
              <a href="/dashboard" className="px-3 py-1.5 text-sm font-semibold border rounded" style={{ borderColor: BRAND.gray[200], color: BRAND.gray[900] }}>
                Back to Dashboard
              </a>
              <button onClick={() => window.print()} className="px-3 py-1.5 text-sm font-semibold rounded text-white" style={{ backgroundColor: BRAND.primary }}>
                Print PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* Point of Contact - SEPARATE */}
        <Section title="Point of Contact">
          <DataRow label="Name" value={`${data.firstName} ${data.lastName}`.trim() || null} />
          <DataRow label="Email" value={data.email} />
          <DataRow label="Department" value={firmo?.s4a || firmo?.s3} />
          <DataRow label="Primary Job Function" value={firmo?.s4b} />
          <DataRow label="Current Level" value={firmo?.s5} />
          <DataRow label="Areas of Responsibility" value={selectedOnly(firmo?.s6)} />
          <DataRow label="Level of Influence on Benefits" value={firmo?.s7} />
        </Section>

        {/* Company Profile - NO POC, NO GENDER */}
        <Section title="Company Profile & Firmographics (Full)" placeholderWhenEmpty={sectionEmpty(firmoFiltered)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(firmoFiltered).slice(0, Math.ceil(Object.keys(firmoFiltered).length / 2)).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
              ))}
            </div>
            <div>
              {Object.entries(firmoFiltered).slice(Math.ceil(Object.keys(firmoFiltered).length / 2)).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
              ))}
            </div>
          </div>
        </Section>

        {/* General Benefits */}
        <Section title="General Employee Benefits" placeholderWhenEmpty={sectionEmpty(gen)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(gen).slice(0, Math.ceil(Object.keys(gen).length / 2)).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
              ))}
            </div>
            <div>
              {Object.entries(gen).slice(Math.ceil(Object.keys(gen).length / 2)).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
              ))}
            </div>
          </div>
        </Section>

        {/* Current Support */}
        <Section title="Current Support for Employees Managing Cancer" placeholderWhenEmpty={sectionEmpty(cur)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(cur).slice(0, Math.ceil(Object.keys(cur).length / 2)).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
              ))}
            </div>
            <div>
              {Object.entries(cur).slice(Math.ceil(Object.keys(cur).length / 2)).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
              ))}
            </div>
          </div>
        </Section>

        {/* 13 Dimensions - EACH SUPPORT OPTION LISTED SEPARATELY */}
        <div className="flex items-baseline justify-between mb-3 mt-8">
          <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>13 Dimensions of Support</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-white" style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}>
            D13 uses 5-point scale (includes Unsure/NA)
          </span>
        </div>

        {data.dimensions.map((dim: { number: number; data: Record<string, any> }) => {
          const qaItems = parseDimensionData(dim.number, dim.data);
          const half = Math.ceil(qaItems.length / 2);
          const left = qaItems.slice(0, half);
          const right = qaItems.slice(half);
          const isEmpty = qaItems.length === 0;

          return (
            <Section
              key={dim.number}
              title={`Dimension ${dim.number}: ${DIM_TITLE[dim.number]}`}
              badge={dim.number === 13 ? '5-point' : undefined}
              placeholderWhenEmpty={isEmpty ? dimEmpty : false}
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
        <Section title="Cross-Dimensional Assessment" placeholderWhenEmpty={sectionEmpty(cd)}>
          <div className="space-y-2">
            {Object.entries(cd || {}).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </div>
        </Section>

        {/* Employee Impact Assessment - GUARANTEED TO SHOW */}
        <Section title="Employee Impact Assessment" placeholderWhenEmpty={sectionEmpty(ei)}>
          <div className="space-y-2">
            {Object.entries(ei || {}).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center text-xs" style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}>
          Best Companies for Working with Cancer: Employer Index •
          © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
          All responses collected and analyzed by BEYOND Insights, LLC
        </div>
      </main>

      <style jsx>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          section { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

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
        <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>{title}</h2>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-white" style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}>
            {badge}
          </span>
        )}
      </div>
      {isEmpty && typeof placeholderWhenEmpty === 'string' ? (
        <div className="text-sm italic" style={{ color: BRAND.gray[400] }}>{placeholderWhenEmpty}</div>
      ) : (
        children
      )}
    </section>
  );
}

interface DataRowProps {
  label: string;
  value?: string | string[] | null;
}

function DataRow({ label, value }: DataRowProps) {
  if (!value) return null;
  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <div className="flex py-2 border-b last:border-b-0" style={{ borderColor: BRAND.gray[200] }}>
      <div className="w-1/3 pr-4">
        <span className="text-sm font-medium" style={{ color: BRAND.gray[600] }}>{label}</span>
      </div>
      <div className="w-2/3 text-left">
        <span className="text-sm" style={{ color: BRAND.gray[900] }}>{displayValue}</span>
      </div>
    </div>
  );
}

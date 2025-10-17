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
// COMPREHENSIVE FIELD LABELS
// ============================================
const LABELS: Record<string, string> = {
  // Firmographics / Classification
  companyName: 'Company Name', s2: 'Gender Identity', s3: 'Department',
  s4a: 'Primary Department', s4b: 'Primary Job Function', s5: 'Current Level',
  s6: 'Areas of Responsibility', s7: 'Level of Influence on Benefits',
  s8: 'Total Employee Size', s9: 'Headquarters Location',
  s9a: 'Countries with Employee Presence',
  c2: 'Industry', c3: 'Excluded Employee Groups', c4: 'Eligibility for Standard Benefits',
  c5: 'Annual Revenue', c6: 'Remote/Hybrid Work Policy',

  // General Benefits - WITH CB1A!
  cb1: 'Standard Benefits Offered',
  cb1a: 'Program Status',  // THIS WAS MISSING!
  cb2: 'Leave & Flexibility Programs',
  cb2b: 'Wellness & Support Programs',
  cb3: 'Financial & Legal Assistance Programs',
  cb3a: 'Program Characterization',
  cb3b: 'Key Program Features',
  cb3c: 'Conditions Covered',
  cb3d: 'Communication Methods',

  // Current Support
  or1: 'Current Support Approach',
  or2a: 'Development Triggers',
  or2b: 'Most Impactful Change',
  or3: 'Available Support Resources',
  or5a: 'Program Features',
  or6: 'Monitoring & Evaluation Approach',

  // Cross-Dimensional Assessment
  cd1a: 'Top 3 Dimensions for Best Outcomes',
  cd1b: 'Bottom 3 Dimensions (Lowest Priority)',
  cd2: 'Biggest Implementation Challenges',

  // Employee Impact Assessment - ALL OF THEM!
  ei1: 'Impact on Employee Retention',
  ei1a: 'Impact on Reducing Absenteeism',
  ei1b: 'Impact on Maintaining Performance',
  ei1c: 'Impact on Healthcare Cost Management',
  ei1d: 'Impact on Employee Morale',
  ei1e: 'Impact on Reputation as Employer of Choice',
  ei1f: 'Impact on Productivity During Treatment',
  ei1g: 'Impact on Manager Confidence',
  ei1h: 'Impact on Quality of Return-to-Work',
  ei1i: 'Impact on Family/Caregiver Stress',
  ei2: 'ROI Analysis Status',
  ei3: 'ROI Analysis Results',
  ei4: 'Advice to HR Leaders',
  ei5: 'Conditions Beyond Cancer Covered'
};

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatLabel(key: string): string {
  if (LABELS[key]) return LABELS[key];
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());
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

function hasAnySelected(obj: Record<string, any>): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return Object.values(obj).some(v => selectedOnly(v) != null);
}

function sectionEmpty(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return true;
  return Object.keys(obj).length === 0;
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

    const companyName = localStorage.getItem('login_company_name') ||
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
                alt="Best Companies for Working with Cancer Award Logo"
                className="h-16 sm:h-20 lg:h-24 w-auto drop-shadow-md"
              />
            </div>
            <div className="flex justify-end">
              <img
                src="/cancer-careers-logo.png"
                alt="Cancer and Careers Logo"
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
              Generated: {data.generatedAt}{data.email ? ` • ${data.email}` : ''}
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
        {/* Point of Contact */}
        <Section title="Point of Contact">
          <DataRow label="Name" value={`${data.firstName} ${data.lastName}`.trim() || null} />
          <DataRow label="Email" value={data.email} />
          <DataRow label="Department" value={firmo?.s4a || firmo?.s3} />
          <DataRow label="Primary Job Function" value={firmo?.s4b} />
          <DataRow label="Current Level" value={firmo?.s5} />
          <DataRow label="Areas of Responsibility" value={selectedOnly(firmo?.s6)} />
          <DataRow label="Level of Influence on Benefits" value={firmo?.s7} />
        </Section>

        {/* Company Profile & Firmographics (Full) */}
        <Section
          title="Company Profile & Firmographics (Full)"
          placeholderWhenEmpty={sectionEmpty(firmo)}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(firmo || {})
                .filter(([k]) => k !== 's1')
                .slice(0, Math.ceil(Object.keys(firmo || {}).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
            </div>
            <div>
              {Object.entries(firmo || {})
                .filter(([k]) => k !== 's1')
                .slice(Math.ceil(Object.keys(firmo || {}).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                ))}
            </div>
          </div>
        </Section>

        {/* General Employee Benefits */}
        <Section
          title="General Employee Benefits"
          placeholderWhenEmpty={sectionEmpty(gen)}
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
          placeholderWhenEmpty={sectionEmpty(cur)}
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

        {/* 13 Dimensions of Support - Header */}
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

        {/* EACH DIMENSION RENDERS IN ITS OWN SECTION */}
        {data.dimensions.map((dim: { number: number; data: Record<string, any> }) => {
          const entries = Object.entries(dim.data || {});
          const left = entries.slice(0, Math.ceil(entries.length / 2));
          const right = entries.slice(Math.ceil(entries.length / 2));
          const isEmpty = !hasAnySelected(dim.data);

          return (
            <Section
              key={dim.number}
              title={`Dimension ${dim.number}: ${DIM_TITLE[dim.number]}`}
              badge={dim.number === 13 ? '5-point' : undefined}
              placeholderWhenEmpty={isEmpty ? dimEmpty : false}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                <div>
                  {left.map(([k, v]) => (
                    <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                  ))}
                </div>
                <div>
                  {right.map(([k, v]) => (
                    <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
                  ))}
                </div>
              </div>
            </Section>
          );
        })}

        {/* Cross-Dimensional Assessment */}
        <Section
          title="Cross-Dimensional Assessment"
          placeholderWhenEmpty={sectionEmpty(cd)}
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
          placeholderWhenEmpty={sectionEmpty(ei)}
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
          Best Companies for Working with Cancer: Employer Index •
          © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
          All responses collected and analyzed by BEYOND Insights, LLC
        </div>
      </main>

      {/* Print Styles */}
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
// DATA ROW COMPONENT - FIXED W/ UNIFORM COLUMNS
// ============================================
interface DataRowProps {
  label: string;
  value?: string | string[] | null;
}

function DataRow({ label, value }: DataRowProps) {
  // CRITICAL: Hide row if no value - NO DASHES!
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

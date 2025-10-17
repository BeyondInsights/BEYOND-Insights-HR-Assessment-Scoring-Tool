'use client';

import React, { useEffect, useState } from 'react';

/* =========================
   BRAND
========================= */
const BRAND = {
  primary: '#6B2C91',
  gray: {
    900: '#0F172A', 700: '#334155', 600: '#475569',
    400: '#94A3B8', 300: '#CBD5E1', 200: '#E5E7EB',
    bg: '#F9FAFB'
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
  13: 'Communication & Awareness'
};

/* =========================
   COMPLETE QUESTION MAPS (yours)
========================= */
// — keep your full D1..D13 maps exactly as provided —
const D1_QUESTIONS: Record<string, string> = { /* ... your D1 map ... */ };
const D2_QUESTIONS: Record<string, string> = { /* ... your D2 map ... */ };
const D3_QUESTIONS: Record<string, string> = { /* ... your D3 map ... */ };
const D4_QUESTIONS: Record<string, string> = { /* ... your D4 map ... */ };
const D5_QUESTIONS: Record<string, string> = { /* ... your D5 map ... */ };
const D6_QUESTIONS: Record<string, string> = { /* ... your D6 map ... */ };
const D7_QUESTIONS: Record<string, string> = { /* ... your D7 map ... */ };
const D8_QUESTIONS: Record<string, string> = { /* ... your D8 map ... */ };
const D9_QUESTIONS: Record<string, string> = { /* ... your D9 map ... */ };
const D10_QUESTIONS: Record<string, string> = { /* ... your D10 map ... */ };
const D11_QUESTIONS: Record<string, string> = { /* ... your D11 map ... */ };
const D12_QUESTIONS: Record<string, string> = { /* ... your D12 map ... */ };
const D13_QUESTIONS: Record<string, string> = { /* ... your D13 map ... */ };

const ALL_DIMENSION_QUESTIONS: Record<string, Record<string, string>> = {
  d1: D1_QUESTIONS, d2: D2_QUESTIONS, d3: D3_QUESTIONS, d4: D4_QUESTIONS, d5: D5_QUESTIONS,
  d6: D6_QUESTIONS, d7: D7_QUESTIONS, d8: D8_QUESTIONS, d9: D9_QUESTIONS, d10: D10_QUESTIONS,
  d11: D11_QUESTIONS, d12: D12_QUESTIONS, d13: D13_QUESTIONS
};

/* =========================
   FIELD LABELS (yours)
========================= */
const FIELD_LABELS: Record<string, string> = {
  // — keep your FIELD_LABELS exactly as provided —
};

/* =========================
   HELPERS
========================= */
const tryJSON = (raw: string | null) => { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } };

const loadMany = (keys: string[]) => {
  for (const k of keys) {
    const v = tryJSON(localStorage.getItem(k));
    if (v && typeof v === 'object' && Object.keys(v).length) return v;
  }
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (raw != null) return tryJSON(raw);
  }
  return {};
};

const humanize = (key: string) =>
  key.replace(/^d\d+[a-z]?_?/, '')
     .replace(/_/g, ' ')
     .replace(/\b\w/g, (m) => m.toUpperCase())
     .trim();

const formatGenericLabel = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());

const formatLabel = (key: string) => FIELD_LABELS[key] ?? formatGenericLabel(key);

const selectedOnly = (value: any): string[] | string | null => {
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
};

const sectionEmpty = (obj: any) => !obj || typeof obj !== 'object' || Object.keys(obj).length === 0;

const hasProgramStatusMap = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

/* label finder (dim-first, then global, then humanize) */
function getQuestionLabel(dimNumber: number, fieldKey: string): string {
  const dimKey = `d${dimNumber}`;
  const dimQuestions = ALL_DIMENSION_QUESTIONS[dimKey];
  if (dimQuestions && dimQuestions[fieldKey]) return dimQuestions[fieldKey];
  if (FIELD_LABELS[fieldKey]) return FIELD_LABELS[fieldKey];
  return formatGenericLabel(fieldKey);
}

/* =========================
   CRITICAL: strict dimension parsing
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

  Object.entries(data).forEach(([key, value]) => {
    // accept only this dimension's keys (avoid D2/D3 bleed)
    const isThisDimField = key.startsWith(prefix) || key === `${prefix}a`;

    if (!isThisDimField) return;

    // 1) grid: d{n}a as object => treat as Support Offerings (program -> status)
    if (key === `${prefix}a` && hasProgramStatusMap(value)) {
      Object.entries(value).forEach(([program, status]) => {
        if (status != null && String(status).trim() !== '') {
          programs.push({ program, status: String(status) });
        }
      });
      return;
    }

    // 2) merge "Other (specify)" if present
    if (Array.isArray(value) && value.some((s) => /other|specify/i.test(String(s)))) {
      const otherText = data[`${key}_other`];
      if (otherText) value = [...value, `Other: ${otherText}`];
    }

    // 3) normal follow-ups
    if (key.match(/^d\d+/) && !key.endsWith('_none')) {
      const resp = selectedOnly(value);
      if (resp) {
        items.push({
          question: getQuestionLabel(dimNumber, key),
          response: Array.isArray(resp) ? resp.join(', ') : resp
        });
      }
    }
  });

  // stable order
  programs.sort((a, b) => a.program.localeCompare(b.program));
  items.sort((a, b) => a.question.localeCompare(b.question));

  return { programs, items };
}

/* =========================
   MAIN
========================= */
export default function CompanyProfile() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // tolerant loaders (avoid blanks)
    const firmo = loadMany(['firmographics_data', 'firmographics']);
    const gen   = loadMany(['general-benefits_data', 'general_benefits_data', 'generalBenefits']);
    const cur   = loadMany(['current-support_data', 'current_support_data', 'currentSupport']);
    const cross = loadMany(['cross_dimensional_data', 'cross-dimensional_data', 'crossDimensional']);
    const impact= loadMany(['employee_impact_data', 'ei_assessment_data', 'ei_data', 'employeeImpact']);

    const dims: any[] = [];
    for (let i = 1; i <= 13; i++) {
      const raw = loadMany([`dimension${i}_data`, `dimension_${i}_data`, `dim${i}_data`, `dim_${i}_data`, `dimension${i}`, `dim${i}`]);
      dims.push({ number: i, data: raw });
    }

    const companyName =
      localStorage.getItem('login_company_name') ||
      firmo.companyName || firmo.company_name || 'Organization';

    const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email') || '';
    const firstName = localStorage.getItem('login_first_name') || '';
    const lastName = localStorage.getItem('login_last_name') || '';

    setData({
      companyName, email, firstName, lastName,
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      firmographics: firmo, general: gen, current: cur, cross, impact, dimensions: dims
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
  const gen = data.general || {};
  const cur = data.current || {};
  const cd = data.cross || {};
  const ei = data.impact || {};

  // Filter out POC fields + gender from firmographics
  const firmoFiltered = Object.fromEntries(
    Object.entries(firmo).filter(([k]) => !['s1','s2','s3','s4a','s4b','s5','s6','s7'].includes(k))
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.gray.bg }}>
      {/* Header (light) */}
      <div className="bg-white border-b" style={{ borderColor: BRAND.gray[200] }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-28" />
            <div className="flex-1 flex justify-center">
              <img src="/best-companies-2026-logo.png" alt="Best Companies for Working with Cancer Award"
                   className="h-16 sm:h-20 lg:h-24 w-auto" />
            </div>
            <div className="flex justify-end">
              <img src="/cancer-careers-logo.png" alt="Cancer and Careers" className="h-10 sm:h-14 lg:h-16 w-auto" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-5xl font-black mb-2" style={{ color: BRAND.primary }}>{data.companyName}</h1>
            <p className="text-base" style={{ color: BRAND.gray[600] }}>Company Profile &amp; Survey Summary</p>
            <p className="text-sm mt-1" style={{ color: BRAND.gray[600] }}>
              Generated: {data.generatedAt}{data.email ? ` • ${data.email}` : ''}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
              <a href="/dashboard" className="px-3 py-1.5 text-sm font-semibold border rounded"
                 style={{ borderColor: BRAND.gray[200], color: BRAND.gray[900] }}>Back to Dashboard</a>
              <button onClick={() => window.print()} className="px-3 py-1.5 text-sm font-semibold rounded text-white"
                      style={{ backgroundColor: BRAND.primary }}>Print PDF</button>
            </div>
          </div>
        </div>
      </div>

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
        <Section title="Company Profile & Firmographics (Full)" placeholderWhenEmpty={sectionEmpty(firmoFiltered) ? '(No data recorded)' : false}>
          <TwoColObject obj={firmoFiltered} />
        </Section>

        {/* General Benefits */}
        <Section title="General Employee Benefits" placeholderWhenEmpty={sectionEmpty(gen) ? '(No data recorded)' : false}>
          <TwoColObject obj={gen} />
        </Section>

        {/* Current Support */}
        <Section title="Current Support for Employees Managing Cancer" placeholderWhenEmpty={sectionEmpty(cur) ? '(No data recorded)' : false}>
          <TwoColObject obj={cur} />
        </Section>

        {/* Dimensions */}
        <div className="flex items-baseline justify-between mb-3 mt-8">
          <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>13 Dimensions of Support</h2>
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
            <Section key={dim.number} title={`Dimension ${dim.number}: ${DIM_TITLE[dim.number]}`}
                     badge={dim.number === 13 ? '5-point' : undefined}
                     placeholderWhenEmpty={(programs.length + items.length) === 0 ? '(No responses recorded)' : false}>

              {/* Support offerings FIRST */}
              {programs.length > 0 && (
                <div className="mb-4 pb-3 border-b" style={{ borderColor: BRAND.gray[200] }}>
                  <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: '#EA580C' }}>
                    Support Offerings (Program Status)
                  </div>
                  <div className="space-y-2">
                    {programs.map(({ program, status }) => (
                      <div key={program} className="flex items-center justify-between gap-4 py-2 px-3 rounded hover:bg-slate-50">
                        <span className="text-[13px]" style={{ color: BRAND.gray[700] }}>{program}</span>
                        <StatusPill status={status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other items */}
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
        <Section title="Cross-Dimensional Assessment" placeholderWhenEmpty={sectionEmpty(cd) ? '(No data recorded)' : false}>
          <div className="space-y-2">
            {Object.entries(cd || {}).sort(([a],[b])=>a.localeCompare(b)).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />
            ))}
          </div>
        </Section>

        {/* Employee Impact */}
        <Section title="Employee Impact Assessment" placeholderWhenEmpty={sectionEmpty(ei) ? '(No data recorded)' : false}>
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
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          section { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

/* =========================
   REUSABLE SECTIONS
========================= */
interface SectionProps {
  title: string;
  badge?: string;
  placeholderWhenEmpty?: string | boolean;
  children?: React.ReactNode;
}
function Section({ title, badge, placeholderWhenEmpty, children }: SectionProps) {
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
      <div>{left.map(([k,v]) => <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />)}</div>
      <div>{right.map(([k,v]) => <DataRow key={k} label={formatLabel(k)} value={selectedOnly(v)} />)}</div>
    </div>
  );
}

interface DataRowProps { label: string; value?: string | string[] | null; }
function DataRow({ label, value }: DataRowProps) {
  if (!value) return null; // hide empty (no dashes)
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

function StatusPill({ status }: { status: string }) {
  const s = String(status);
  let bg = '#EEF2FF', fg = '#3730A3';
  if (/Currently offer/i.test(s)) { bg = '#DCFCE7'; fg = '#065F46'; }
  else if (/active planning|development/i.test(s)) { bg = '#DBEAFE'; fg = '#1E40AF'; }
  else if (/Assessing feasibility/i.test(s)) { bg = '#FEF3C7'; fg = '#92400E'; }
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
          style={{ backgroundColor: bg, color: fg }}>
      {s}
    </span>
  );
}

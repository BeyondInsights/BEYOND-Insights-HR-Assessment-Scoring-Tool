'use client';

import React, { useEffect, useState } from 'react';

/* =========================
   BRAND
========================= */
const BRAND = {
  primary: '#6B2C91',
  gray: {
    900: '#0F172A', 700: '#334155', 600: '#475569',
    500: '#64748B', 400: '#94A3B8', 300: '#CBD5E1',
    200: '#E5E7EB', bg: '#F9FAFB', white: '#FFFFFF',
  },
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
   QUESTION MAPS (keep adding as needed)
========================= */
// D1…D13 maps trimmed for brevity; keep yours here. Important: make sure D2 keys are correct.
const D2_QUESTIONS: Record<string,string> = {
  d2aa:'Multi-country consistency',
  d2_1:'Additional insurance coverage details',
  d2_1a:'Supplemental coverage — details',
  d2_1b:'Critical illness coverage — details',
  d2_2:'How financial protection effectiveness is measured',
  d2_3:'Out-of-pocket support (co-pays, deductibles)',
  d2_4:'Short/long-term disability — policy notes',
  d2_5:'Health insurance premium handling during medical leave',
  d2_6:'Financial counseling provider',
  d2b:'Additional insurance/financial protection benefits',
};
const ALL_DIM_Q: Record<number, Record<string,string>> = {
  2: D2_QUESTIONS,
  // add other dim maps as you finalize wordings
};

/* =========================
   FIELD LABELS (global)
========================= */
const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company Name',
  s8: 'Total Employee Size',
  s9: 'Headquarters Location',
  s9a:'Countries with Employee Presence',
  c2: 'Industry',
  c3: 'Excluded Employee Groups',
  c4: '% Eligible for Standard Benefits',
  c5: 'Annual Revenue',
  c6: 'Remote/Hybrid Work Policy',
  cb1a:'% with National Healthcare Access',
  cb1_standard:'Standard Benefits Package',
  cb1_leave:'Leave & Flexibility Programs',
  cb1_wellness:'Wellness & Support Programs',
  cb1_financial:'Financial & Legal Assistance',
  cb1_navigation:'Care Navigation & Support',
  cb4:'Planned Enhancements (Next 2 Years)',
  cb3a:'Cancer Support Program Characterization',
  or1:'Current Support Level',
  or2a:'Triggers for Program Development',
  or2b:'Most Impactful Change',
  or3:'Available Support Resources',
  or4:'Barriers to Enhanced Support',
  or5a:'Caregiver Program Features',
  or6:'How Effectiveness is Monitored',
  cd1a:'Top 3 Dimensions (Outcomes)',
  cd1b:'Bottom 3 Dimensions (Priority)',
  cd2:'Biggest Implementation Challenges',
  // EI
  ei1:'Impact on Employee Retention',
  ei1a:'Impact on Absenteeism',
  ei1b:'Impact on Job Performance',
  ei1c:'Impact on Healthcare Costs',
  ei1d:'Impact on Morale',
  ei1e:'Impact on Employer Reputation',
  ei1f:'Impact on Productivity During Treatment',
  ei1g:'Impact on Manager Confidence',
  ei1h:'Impact on Return-to-Work Quality',
  ei1i:'Impact on Family/Caregiver Stress',
  ei2:'ROI Analysis Status',
  ei3:'ROI Analysis Results',
  ei4:'Advice to Other HR Leaders',
  ei5:'Other Serious Health Conditions Covered',
};

/* =========================
   HELPERS
========================= */
const tryJSON = (raw: string | null) => { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } };

const loadMany = (keys: string[]) => {
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try { const obj = JSON.parse(raw); if (obj && typeof obj === 'object') return obj; } catch {}
  }
  return {};
};

const humanize = (key: string) =>
  key.replace(/^d\d+[a-z]?_?/, '')
     .replace(/_/g, ' ')
     .replace(/\b\w/g, (m) => m.toUpperCase())
     .trim();

const labelFor = (dim: number, key: string) =>
  (ALL_DIM_Q[dim]?.[key]) ?? FIELD_LABELS[key] ?? humanize(key);

const selectedOnly = (value: any): string[] | string | null => {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const out = value.map(v => String(v).trim()).filter(Boolean);
    return out.length ? out : null;
  }
  if (typeof value === 'object') return value; // grid objects handled upstream
  const s = String(value).trim();
  return s === '' ? null : s; // keep "No", 0, N/A
};

const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

/* =========================
   SUPPORT MATRIX (NO PILLS)
========================= */
const STATUS_BUCKETS = [
  'Currently offer',
  'In active planning / development',
  'Assessing feasibility',
  'Not offered',
  'Other / Unspecified',
];

function normalizeStatus(s: string) {
  const x = s.toLowerCase();
  if (x.includes('currently')) return 'Currently offer';
  if (x.includes('active') || x.includes('development') || x.includes('planning')) return 'In active planning / development';
  if (x.includes('assessing') || x.includes('feasibility')) return 'Assessing feasibility';
  if (x === 'no' || x.includes('not offered') || x.includes('do not')) return 'Not offered';
  return 'Other / Unspecified';
}

function SupportMatrix({ programs }: { programs: Array<{ program: string; status: string }> }) {
  const byBucket: Record<string,string[]> = {};
  STATUS_BUCKETS.forEach(b => byBucket[b] = []);
  programs.forEach(({ program, status }) => {
    const bucket = normalizeStatus(String(status));
    byBucket[bucket].push(program);
  });
  return (
    <div className="mb-4">
      <div className="grid gap-4"
           style={{ gridTemplateColumns: `repeat(${STATUS_BUCKETS.length}, minmax(0, 1fr))` }}>
        {STATUS_BUCKETS.map(bucket => (
          <div key={bucket} className="bg-white rounded border p-3" style={{ borderColor: BRAND.gray[200] }}>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.gray[600] }}>
              {bucket}
            </div>
            {byBucket[bucket].length > 0 ? (
              <ul className="space-y-1">
                {byBucket[bucket].sort((a,b)=>a.localeCompare(b)).map(item => (
                  <li key={item} className="text-[13px]" style={{ color: BRAND.gray[700] }}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="text-[12px] italic" style={{ color: BRAND.gray[400] }}>No items selected</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   PARSE DIMENSION (STRICT + CUSTOM NOTES)
========================= */
function parseDimension(
  dimNumber: number,
  raw: Record<string, any>
) {
  const prefix = `d${dimNumber}`;
  const programs: Array<{ program: string; status: string }> = [];
  const items: Array<{ label: string; value: string }> = [];
  const notes: string[] = [];

  Object.entries(raw || {}).forEach(([key, val]) => {
    const isThisDim = (key === `${prefix}a`) || key.startsWith(`${prefix}_`) || key === prefix;
    if (!isThisDim) return;

    // grid program→status
    if (key === `${prefix}a` && isObj(val)) {
      Object.entries(val).forEach(([prog, status]) => {
        const s = String(status ?? '').trim();
        if (s !== '') programs.push({ program: String(prog), status: s });
      });
      return;
    }

    // merge "other" text into arrays
    if (Array.isArray(val) && val.some(v => /other|specify/i.test(String(v)))) {
      const otherText = raw[`${key}_other`] ?? raw[`${key}_text`];
      if (otherText) val = [...val, `Other: ${otherText}`];
    }

    // capture custom free text buckets
    if (/_other_text$|_custom$|_notes$/i.test(key)) {
      const s = String(val ?? '').trim();
      if (s) notes.push(s);
      return;
    }

    if (!key.endsWith('_none')) {
      const resp = selectedOnly(val);
      if (resp) {
        items.push({
          label: labelFor(dimNumber, key),
          value: Array.isArray(resp) ? resp.join(', ') : resp,
        });
      }
    }
  });

  // stable order
  programs.sort((a,b)=>a.program.localeCompare(b.program));
  items.sort((a,b)=>a.label.localeCompare(b.label));

  return { programs, items, notes };
}

/* =========================
   SECTIONS / ROWS
========================= */
function Section({
  title, children, right,
  placeholderWhenEmpty,
}: {
  title: string; children?: React.ReactNode; right?: React.ReactNode;
  placeholderWhenEmpty?: string | boolean;
}) {
  const isEmpty = !children || placeholderWhenEmpty === true;
  return (
    <section className="mb-6 bg-white rounded-lg border p-6" style={{ borderColor: BRAND.gray[200] }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>{title}</h2>
        {right}
      </div>
      {isEmpty && typeof placeholderWhenEmpty === 'string'
        ? <div className="text-sm italic" style={{ color: BRAND.gray[400] }}>{placeholderWhenEmpty}</div>
        : children}
    </section>
  );
}

function Row({ label, value }: { label: string; value?: any }) {
  const display =
    value == null || (Array.isArray(value) && value.length === 0)
      ? '—'
      : Array.isArray(value) ? value.join(', ') : String(value);
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

function TwoColObject({ obj }: { obj: Record<string, any> }) {
  const entries = Object.entries(obj || {}).sort(([a],[b])=>a.localeCompare(b));
  const half = Math.ceil(entries.length/2);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
      <div>{entries.slice(0,half).map(([k,v])=> <Row key={k} label={FIELD_LABELS[k] ?? humanize(k)} value={selectedOnly(v)} />)}</div>
      <div>{entries.slice(half).map(([k,v])=> <Row key={k} label={FIELD_LABELS[k] ?? humanize(k)} value={selectedOnly(v)} />)}</div>
    </div>
  );
}

/* =========================
   MAIN
========================= */
export default function CompanyProfileFixed() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // tolerant loaders
    const firmo = loadMany(['firmographics_data','firmographics']);
    const gen   = loadMany(['general-benefits_data','general_benefits_data','generalBenefits']);
    const cur   = loadMany(['current-support_data','current_support_data','currentSupport']);
    const cross = loadMany(['cross_dimensional_data','cross-dimensional_data','crossDimensional']);
    const impact= loadMany(['employee_impact_data','ei_assessment_data','ei_data','employeeImpact','employee_impact']);

    const dimensions: Array<{ number:number; data:Record<string,any> }> = [];
    for (let i=1;i<=13;i++){
      const raw = loadMany([`dimension${i}_data`,`dimension_${i}_data`,`dim${i}_data`,`dim_${i}_data`,`dimension${i}`,`dim${i}`]);
      dimensions.push({ number:i, data:raw });
    }

    const companyName =
      localStorage.getItem('login_company_name') ||
      firmo.companyName || firmo.company_name || 'Organization';

    setData({
      companyName,
      email: localStorage.getItem('auth_email') || localStorage.getItem('login_email') || '',
      firstName: localStorage.getItem('login_first_name') || '',
      lastName:  localStorage.getItem('login_last_name')  || '',
      generatedAt: new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),
      firmo, gen, cur, cross, impact, dimensions
    });
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: BRAND.gray.bg }}>
        <div className="text-sm" style={{ color: BRAND.gray[600] }}>Loading…</div>
      </div>
    );
  }

  const { firmo, gen, cur, cross: cd, impact: ei } = data;

  // POC fields
  const poc = {
    name: `${data.firstName} ${data.lastName}`.trim() || null,
    email: data.email || null,
    dept:  firmo?.s4a || firmo?.s3 || null,
    func:  firmo?.s4b || null,
    level: firmo?.s5 || null,
    resp:  selectedOnly(firmo?.s6),
    infl:  firmo?.s7 || null,
  };

  // firmographics without POC/gender
  const firmoFiltered = Object.fromEntries(
    Object.entries(firmo||{}).filter(([k]) => !['s1','s2','s3','s4a','s4b','s5','s6','s7'].includes(k))
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.gray.bg }}>
      {/* Slim header — company name ONCE */}
      <header className="bg-white border-b" style={{ borderColor: BRAND.gray[200] }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <img src="/best-companies-2026-logo.png" alt="Best Companies Award" className="h-12 w-auto" />
          <div className="text-xl font-black tracking-wide" style={{ color: BRAND.primary }}>BEYOND Insights</div>
          <img src="/cancer-careers-logo.png" alt="Cancer and Careers" className="h-10 w-auto" />
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-3">
          <p className="text-xs" style={{ color: BRAND.gray[600] }}>
            Company Profile &amp; Survey Summary • Generated {data.generatedAt}{data.email ? ` • ${data.email}` : ''}
          </p>
          <div className="mt-2 flex items-center gap-2 print:hidden">
            <a href="/dashboard" className="px-3 py-1.5 text-xs font-semibold border rounded"
               style={{ borderColor: BRAND.gray[200], color: BRAND.gray[900] }}>← Dashboard</a>
            <button onClick={()=>window.print()} className="px-3 py-1.5 text-xs font-semibold rounded text-white"
                    style={{ backgroundColor: BRAND.primary }}>Print PDF</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* POC + Company Profile side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Point of Contact">
            <Row label="Name" value={poc.name} />
            <Row label="Email" value={poc.email} />
            <Row label="Department" value={poc.dept} />
            <Row label="Primary Job Function" value={poc.func} />
            <Row label="Current Level" value={poc.level} />
            <Row label="Areas of Responsibility" value={poc.resp} />
            <Row label="Influence on Benefits" value={poc.infl} />
          </Section>

          <Section title="Company Profile">
            <Row label="Company Name" value={data.companyName} />
            <TwoColObject obj={firmoFiltered} />
          </Section>
        </div>

        {/* General Benefits */}
        <Section title="General Employee Benefits"
                 placeholderWhenEmpty={Object.keys(data.gen||{}).length===0 ? '(No data recorded)' : false}>
          <TwoColObject obj={gen||{}} />
        </Section>

        {/* Current Support */}
        <Section title="Current Support for Employees Managing Cancer"
                 placeholderWhenEmpty={Object.keys(data.cur||{}).length===0 ? '(No data recorded)' : false}>
          <TwoColObject obj={cur||{}} />
        </Section>

        {/* 13 Dimensions */}
        <div className="flex items-baseline justify-between mb-3 mt-8">
          <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>13 Dimensions of Support</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-white"
                style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}>
            D13 uses 5-point scale (includes Unsure/NA)
          </span>
        </div>

        {data.dimensions.map((dim:{number:number; data:Record<string,any>})=>{
          const { programs, items, notes } = parseDimension(dim.number, dim.data);
          const half = Math.ceil(items.length/2);
          return (
            <Section key={dim.number}
                     title={`Dimension ${dim.number}: ${DIM_TITLE[dim.number]}`}
                     placeholderWhenEmpty={(programs.length+items.length+notes.length)===0 ? '(No responses recorded)' : false}
                     right={dim.number===13 ? <span className="text-[11px]" style={{color:BRAND.gray[500]}}>5-point</span> : null}
            >
              {/* Support options matrix — all buckets visible even if empty */}
              <SupportMatrix programs={programs} />

              {/* Follow-ups */}
              {items.length>0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                  <div>{items.slice(0,half).map((it,i)=><Row key={i} label={it.label} value={it.value} />)}</div>
                  <div>{items.slice(half).map((it,i)=><Row key={i} label={it.label} value={it.value} />)}</div>
                </div>
              )}

              {/* Custom notes / free text */}
              {notes.length>0 && (
                <div className="mt-4 pt-3 border-t" style={{ borderColor: BRAND.gray[200] }}>
                  <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.gray[600] }}>
                    Custom Notes
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {notes.map((n,i)=><li key={i} className="text-sm" style={{ color: BRAND.gray[900] }}>{n}</li>)}
                  </ul>
                </div>
              )}
            </Section>
          );
        })}

        {/* Cross-Dimensional */}
        <Section title="Cross-Dimensional Assessment"
                 placeholderWhenEmpty={Object.keys(cd||{}).length===0 ? '(No data recorded)' : false}>
          <div className="space-y-2">
            {Object.entries(cd||{}).sort(([a],[b])=>a.localeCompare(b))
              .map(([k,v])=> <Row key={k} label={FIELD_LABELS[k] ?? humanize(k)} value={selectedOnly(v)} />)}
          </div>
        </Section>

        {/* Employee Impact — ALWAYS SHOWN */}
        <Section title="Employee Impact (EI) Assessment"
                 placeholderWhenEmpty={Object.keys(ei||{}).length===0 ? '(No data recorded)' : false}>
          <div className="space-y-2">
            {Object.entries(ei||{}).sort(([a],[b])=>a.localeCompare(b))
              .map(([k,v])=> <Row key={k} label={FIELD_LABELS[k] ?? humanize(k)} value={selectedOnly(v)} />)}
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center text-xs"
             style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}>
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers &amp; CEW Foundation • All responses collected and analyzed by BEYOND Insights, LLC
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

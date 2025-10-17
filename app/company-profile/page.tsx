'use client';

import React, { useEffect, useState } from 'react';

/* =========================
   TITLES
========================= */
const DIM_TITLES: Record<number, string> = {
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
   LABEL MAPS (namespaced)
   - Add keys as needed. These prevent D2/D3 crossing.
========================= */
const D1: Record<string, string> = {
  d1aa: 'Multi-country consistency',
  d1_1: 'Additional paid medical leave (USA) — weeks',
  d1_1b: 'Additional paid medical leave (Non-USA) — weeks',
  d1_2: 'How medical leave effectiveness is measured',
  d1_4a: 'Remote work time allowed during treatment',
  d1_4b: 'Part-time / reduced schedule — duration',
  d1_5_usa: 'Job protection guarantee (USA) — duration',
  d1_5_non_usa: 'Job protection guarantee (Non-USA) — duration',
  d1_6: 'Disability benefit enhancements offered',
};

const D2: Record<string, string> = {
  d2aa: 'Multi-country consistency',
  d2_1: 'Additional insurance coverage details',
  d2_1a: 'Supplemental coverage — details',
  d2_1b: 'Critical illness coverage — details',
  d2_2: 'How financial protection effectiveness is measured',
  d2_3: 'Out-of-pocket support (co-pays, deductibles)',
  d2_4: 'Short/long-term disability — policy notes',
  d2_5: 'Health insurance premiums during leave — handling',
  d2_6: 'Financial counseling provider',
};

const D3: Record<string, string> = {
  d3aa: 'Multi-country consistency',
  d3_1: 'Manager training — required / recommended',
  d3_1a: 'Manager training — frequency / cadence',
  d3_2: 'Manager training — completion rate',
  d3_3: 'Manager resources — toolkits / job aids',
};

const DIM_LABELS: Record<number, Record<string, string>> = {
  1: D1,
  2: D2,
  3: D3,
  // extend similarly for D4..D13 as your key set grows
};

/* =========================
   HELPERS
========================= */
const tryJSON = (raw: string | null) => {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};

const getFirst = (...vals: any[]) => vals.find(v => v != null && v !== '') ?? null;

const loadMany = (keys: string[]) => {
  for (const k of keys) {
    const v = tryJSON(localStorage.getItem(k));
    if (v && typeof v === 'object' && Object.keys(v).length) return v;
  }
  // allow empty object if key exists but empty
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (raw) return tryJSON(raw);
  }
  return {};
};

// dimension key patterns we’ve seen across versions
const dimKeyCandidates = (i: number) => ([
  `dimension${i}_data`,
  `dimension_${i}_data`,
  `dim${i}_data`,
  `dim_${i}_data`,
  `dimension${i}`,
  `dim${i}`,
]);

const humanize = (key: string) =>
  key.replace(/^d\d+[a-z]?_?/, '')
     .replace(/_/g, ' ')
     .replace(/\b\w/g, (m) => m.toUpperCase())
     .trim();

const formatVal = (v: any) => {
  if (v == null || v === '') return '—';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
};

const labelFor = (dim: number, key: string) => {
  const map = DIM_LABELS[dim];
  if (map && map[key]) return map[key];
  if (/aa$/i.test(key)) return 'Multi-country consistency';
  if (/other$/i.test(key)) return 'Other (specify)';
  return humanize(key);
};

const isProgramStatusMap = (v: any) =>
  v && typeof v === 'object' && !Array.isArray(v);

/* =========================
   UI SUBCOMPONENTS
========================= */
const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-5">
    <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
  </div>
);

const DataRow = ({ label, value }: { label: string; value: any }) => (
  <div className="px-3 py-2 rounded hover:bg-slate-50">
    <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase mb-1">{label}</div>
    <div className="text-sm text-slate-900">{formatVal(value)}</div>
  </div>
);

const StatusPill = ({ status }: { status: string }) => {
  const s = String(status);
  let bg = '#eef2ff', fg = '#3730a3';
  if (/Currently offer/i.test(s)) { bg = '#dcfce7'; fg = '#065f46'; }
  else if (/active planning|development/i.test(s)) { bg = '#dbeafe'; fg = '#1e40af'; }
  else if (/Assessing feasibility/i.test(s)) { bg = '#fef3c7'; fg = '#92400e'; }
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
          style={{ backgroundColor: bg, color: fg }}>
      {s}
    </span>
  );
};

/* =========================
   MAIN
========================= */
export default function CompanyProfilePage() {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    // core sections (try multiple historical keys to avoid blanks)
    const firmo = loadMany(['firmographics_data', 'firmographics']);
    const general = loadMany(['general-benefits_data', 'general_benefits_data', 'generalBenefits']);
    const current = loadMany(['current-support_data', 'current_support_data', 'currentSupport']);
    const cross = loadMany(['cross_dimensional_data', 'cross-dimensional_data', 'crossDimensional']);
    const impact = loadMany(['employee_impact_data', 'ei_assessment_data', 'ei_data', 'employeeImpact']);

    // load dimensions 1..13, tolerant to key naming
    const dimensions = Array.from({ length: 13 }, (_, idx) => {
      const n = idx + 1;
      const raw = loadMany(dimKeyCandidates(n));
      return { number: n, name: DIM_TITLES[n], data: raw && typeof raw === 'object' ? raw : {} };
    });

    const companyName = getFirst(
      localStorage.getItem('login_company_name'),
      firmo?.companyName,
      'Organization'
    );

    setState({
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      companyName,
      email: getFirst(localStorage.getItem('login_email')),
      firstName: getFirst(localStorage.getItem('login_first_name')),
      lastName: getFirst(localStorage.getItem('login_last_name')),
      title: getFirst(localStorage.getItem('login_title'), firmo?.s5),
      firmo, general, current, cross, impact, dimensions,
    });
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-sm text-slate-600">Loading…</div>
      </div>
    );
  }

  // Derived summaries (light touch)
  const poc = {
    name: `${state.firstName ?? ''} ${state.lastName ?? ''}`.trim() || null,
    email: state.email ?? null,
    department: state.firmo?.s4a ?? null,
    jobFunction: state.firmo?.s4b ?? null,
    title: state.title ?? null,
    responsibilities: state.firmo?.s6 ?? null,
    influence: state.firmo?.s7 ?? null,
  };

  const company = {
    name: state.companyName,
    industry: state.firmo?.c2 ?? null,
    revenue: state.firmo?.c5 ?? null,
    size: state.firmo?.s8 ?? null,
    hq: state.firmo?.s9 ?? null,
    countries: state.firmo?.s9a ?? null,
  };

  const benefits = {
    nationalHealthcare: state.general?.cb1a ?? null,
    eligibility: state.general?.c3 ?? state.firmo?.c3 ?? null,
    standard: state.general?.cb1_standard ?? null,
    leave: state.general?.cb1_leave ?? null,
    wellness: state.general?.cb1_wellness ?? null,
    financial: state.general?.cb1_financial ?? null,
    navigation: state.general?.cb1_navigation ?? null,
    planned: state.general?.cb4 ?? null,
    remote: state.firmo?.c6 ?? null,
  };

  const support = {
    status: state.current?.cb3a ?? null,
    approach: state.current?.or1 ?? null,
    excluded: getFirst(state.current?.c4, state.firmo?.c4),
    excludedPercent: getFirst(state.current?.c3, state.firmo?.c3),
    triggers: state.current?.or2a ?? null,
    impactfulChange: state.current?.or2b ?? null,
    barriers: state.current?.or3 ?? null,
    caregiver: state.current?.or5a ?? null,
    monitoring: state.current?.or6 ?? null,
  };

  const downloadPDF = () => window.print();

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header – lighter, clean, logos intact */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src="/best-companies-2026-logo.png" alt="Best Companies Award" className="h-12 w-auto" />
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-slate-900 font-black tracking-wide">BEYOND Insights</div>
          </div>
          <img src="/cancer-careers-logo.png" alt="Cancer and Careers" className="h-8 w-auto" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-6">
          <h1 className="text-3xl font-black text-slate-900">{state.companyName}</h1>
          <p className="text-sm text-slate-600">
            Company Profile &amp; Survey Summary • Generated {state.generatedAt}
            {state.email ? <span className="ml-2">• {state.email}</span> : null}
          </p>
          <div className="mt-3 flex items-center gap-3 print:hidden">
            <a href="/dashboard"
               className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50">
              ← Back to Dashboard
            </a>
            <button onClick={downloadPDF}
                    className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-violet-600 hover:bg-violet-700">
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Company / POC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <SectionHeader title="Company Profile" />
            <div className="space-y-1">
              <DataRow label="Company Name" value={company.name} />
              <DataRow label="Industry" value={company.industry} />
              <DataRow label="Annual Revenue" value={company.revenue} />
              <DataRow label="Employee Size" value={company.size} />
              <DataRow label="HQ Location" value={company.hq} />
              <DataRow label="# of Countries with Presence" value={company.countries} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <SectionHeader title="Point of Contact" />
            <div className="space-y-1">
              <DataRow label="Name" value={poc.name} />
              <DataRow label="Email Address" value={poc.email} />
              <DataRow label="Department" value={poc.department} />
              <DataRow label="Primary Job Function" value={poc.jobFunction} />
              <DataRow label="Title / Level" value={poc.title} />
              <DataRow label="Responsibility / Influence" value={poc.responsibilities} />
              <DataRow label="Level of Influence re: Workplace Support" value={poc.influence} />
            </div>
          </div>
        </div>

        {/* Benefits & Current Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <SectionHeader title="General Benefits Landscape" />
            <div className="space-y-1">
              <DataRow label="% Employees with National Healthcare" value={benefits.nationalHealthcare} />
              <DataRow label="% Employees Eligible for Standard Benefits" value={benefits.eligibility} />
              <div className="pt-3 pb-1">
                <div className="text-[11px] font-bold uppercase tracking-wide text-orange-600">Types of Benefits Offered</div>
              </div>
              <DataRow label="Standard Benefits" value={benefits.standard} />
              <DataRow label="Leave & Flexibility Programs" value={benefits.leave} />
              <DataRow label="Wellness & Support Programs" value={benefits.wellness} />
              <DataRow label="Financial & Legal Assistance" value={benefits.financial} />
              <DataRow label="Care Navigation & Support" value={benefits.navigation} />
              <DataRow label="Programs Planned (Next 2 Years)" value={benefits.planned} />
              <DataRow label="Remote / Hybrid Work Approach" value={benefits.remote} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <SectionHeader title="Current Support for EMCs" />
            <div className="space-y-1">
              <DataRow label="Status of Support Offerings" value={support.status} />
              <DataRow label="Current Approach to Supporting EMCs" value={support.approach} />
              <DataRow label="% of Employees Excluded" value={support.excludedPercent} />
              <DataRow label="Employee Groups Excluded" value={support.excluded} />
              <DataRow label="Triggers for Developing Programs" value={support.triggers} />
              {support.impactfulChange && <DataRow label="Most Impactful Change" value={support.impactfulChange} />}
              {support.barriers && <DataRow label="Barriers to Development" value={support.barriers} />}
              <DataRow label="Caregiver Support Programs" value={support.caregiver} />
              <DataRow label="How Effectiveness is Monitored" value={support.monitoring} />
            </div>
          </div>
        </div>

        {/* 13 Dimensions */}
        <div className="mb-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900">13 Dimensions of Support</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {state.dimensions.map((dim: any) => {
              const raw = dim.data || {};
              // stable order
              const entries = Object.entries(raw).sort(([a], [b]) => a.localeCompare(b));

              // separate program/status maps from simple fields
              const programBlocks: Array<[string, any]> = [];
              const fieldRows: Array<[string, any]> = [];

              entries.forEach(([k, v]) => {
                if (isProgramStatusMap(v)) programBlocks.push([k, v]);
                else fieldRows.push([k, v]);
              });

              // move “Other text” into arrays when relevant
              const normalize = ([k, v]: [string, any]) => {
                if (Array.isArray(v) && v.some((s) => /other|specify/i.test(String(s)))) {
                  const otherText = raw[`${k}_other`];
                  if (otherText) return [k, [...v, `Other: ${otherText}`]];
                }
                return [k, v];
              };

              return (
                <section key={dim.number} className="bg-white border border-violet-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold bg-violet-600">
                      {dim.number}
                    </div>
                    <h3 className="text-base font-bold text-violet-800">{dim.name}</h3>
                  </div>

                  {/* Support Offering grid FIRST if present */}
                  {programBlocks.length > 0 && (
                    <div className="mb-4 pb-4 border-b border-slate-200">
                      <div className="text-[11px] font-bold uppercase tracking-wide mb-2 text-orange-600">
                        Support Offerings (Program Status)
                      </div>
                      <div className="space-y-2">
                        {programBlocks.map(([k, v]) => {
                          const items = Object.entries(v as Record<string, string>);
                          return (
                            <div key={k} className="space-y-2">
                              {items.map(([program, status]) => (
                                <div key={program} className="flex items-center justify-between gap-4 py-2 px-3 rounded hover:bg-slate-50">
                                  <span className="text-[13px] text-slate-700">{program}</span>
                                  <StatusPill status={String(status)} />
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Remaining fields */}
                  {fieldRows.length === 0 ? (
                    programBlocks.length === 0 ? (
                      <div className="text-sm text-slate-500 italic">No responses recorded.</div>
                    ) : null
                  ) : (
                    <div className="space-y-1">
                      {fieldRows.map((pair) => {
                        const [k, v] = normalize(pair as [string, any]);
                        const label = labelFor(dim.number, k);
                        return <DataRow key={k} label={label} value={v} />;
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        {/* Additional Assessments */}
        {(Object.keys(state.cross || {}).length > 0 ||
          Object.keys(state.impact || {}).length > 0) && (
          <div className="mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.keys(state.cross || {}).length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SectionHeader title="Cross-Dimensional Assessment" />
                  <div className="space-y-1">
                    {Object.entries(state.cross).map(([k, v]) => (
                      <DataRow key={k} label={humanize(k)} value={v} />
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(state.impact || {}).length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SectionHeader title="Employee Impact (EI) Assessment" />
                  <div className="space-y-1">
                    {Object.entries(state.impact).map(([k, v]) => (
                      <DataRow key={k} label={humanize(k)} value={v} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Print */}
      <style jsx>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

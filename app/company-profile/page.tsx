'use client';

import React, { useEffect, useState } from 'react';

/* ===== Dimension Titles (unchanged) ===== */
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

/* ===== Label maps (simple, human-readable labels) =====
   Add to these maps anytime we learn more keys. Fallback will humanize unknowns. */
const LABELS_D1: Record<string, string> = {
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

const LABELS_D2: Record<string, string> = {
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

const LABELS_D3: Record<string, string> = {
  d3aa: 'Multi-country consistency',
  d3_1: 'Manager training — required / recommended',
  d3_1a: 'Manager training — frequency / cadence',
  d3_2: 'Manager training — completion rate',
  d3_3: 'Manager resources — toolkits / job aids',
};

const DIM_LABEL_MAP: Record<number, Record<string, string>> = {
  1: LABELS_D1,
  2: LABELS_D2,
  3: LABELS_D3,
};

/* ===== Utilities ===== */
const formatArray = (arr: any) => {
  if (arr == null) return null;
  if (Array.isArray(arr)) return arr.join(', ');
  return String(arr);
};

const cleanKeyToLabel = (rawKey: string) => {
  // Remove d#_ prefixes, underscores → spaces, Title Case
  return rawKey
    .replace(/^d\d+[a-z]?_?/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
};

function getLabelForKey(dimNumber: number, key: string) {
  const map = DIM_LABEL_MAP[dimNumber] || {};
  if (map[key]) return map[key];

  // Generic patterns used elsewhere
  if (/aa$/i.test(key)) return 'Multi-country consistency';
  if (/other$/i.test(key)) return 'Other (specify)';

  return cleanKeyToLabel(key);
}

/* ===== Simple, consistent section bits ===== */
const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
  </div>
);

const DataRow = ({ label, value }: { label: string; value: any }) => {
  const displayValue = value ?? '—';
  return (
    <div className="rounded-lg px-4 py-3 -mx-4 hover:bg-gray-50 transition-colors">
      <div className="text-xs font-semibold mb-1.5 uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900">{displayValue}</div>
    </div>
  );
};

export default function CompanyProfile() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  /* ===== Load all stored pieces and assemble ===== */
  useEffect(() => {
    const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const general =
      JSON.parse(localStorage.getItem('general-benefits_data') || '{}') ||
      JSON.parse(localStorage.getItem('general_benefits_data') || '{}');
    const current =
      JSON.parse(localStorage.getItem('current-support_data') || '{}') ||
      JSON.parse(localStorage.getItem('current_support_data') || '{}');
    const cross = JSON.parse(localStorage.getItem('cross_dimensional_data') || '{}');
    const impact = JSON.parse(localStorage.getItem('employee_impact_data') || '{}');

    // Collect each dimension as its own card (prevents “grouping together” visually)
    const dims: any[] = [];
    for (let i = 1; i <= 13; i++) {
      const raw = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      dims.push({
        number: i,
        name: DIM_TITLES[i],
        data: raw && typeof raw === 'object' ? raw : {},
      });
    }

    const companyName =
      localStorage.getItem('login_company_name') || firmo.companyName || 'Organization';
    const email = localStorage.getItem('login_email') || '';
    const firstName = localStorage.getItem('login_first_name') || '';
    const lastName = localStorage.getItem('login_last_name') || '';
    const title = localStorage.getItem('login_title') || '';

    setData({
      companyName,
      email,
      firstName,
      lastName,
      title,
      generatedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      firmographics: firmo || {},
      general: general || {},
      current: current || {},
      cross: cross || {},
      impact: impact || {},
      dimensions: dims,
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    );
  }

  /* ===== Readables ===== */
  const firmo = data.firmographics || {};
  const gen = data.general || {};
  const cur = data.current || {};

  const poc = {
    name: `${data.firstName} ${data.lastName}`.trim() || null,
    email: data.email || null,
    department: firmo?.s4a || null,
    jobFunction: firmo?.s4b || null,
    title: data.title || firmo?.s5 || null,
    responsibilities: formatArray(firmo?.s6),
    influence: firmo?.s7 || null,
  };

  const company = {
    name: data.companyName,
    industry: firmo?.c2 || null,
    revenue: firmo?.c5 || null,
    size: firmo?.s8 || null,
    hq: firmo?.s9 || null,
    countries: firmo?.s9a || null,
  };

  const benefits = {
    nationalHealthcare: gen?.cb1a || null,
    eligibility: gen?.c3 || firmo?.c3 || null,
    standard: formatArray(gen?.cb1_standard),
    leave: formatArray(gen?.cb1_leave),
    wellness: formatArray(gen?.cb1_wellness),
    financial: formatArray(gen?.cb1_financial),
    navigation: formatArray(gen?.cb1_navigation),
    planned: formatArray(gen?.cb4),
    remote: firmo?.c6 || null,
  };

  const support = {
    status: cur?.cb3a || null,
    approach: cur?.or1 || null,
    excluded: (cur?.c4 || firmo?.c4) ? formatArray(cur?.c4 || firmo?.c4) : null,
    excludedPercent: cur?.c3 || firmo?.c3 || null,
    triggers: formatArray(cur?.or2a),
    impactfulChange: cur?.or2b || null,
    barriers: formatArray(cur?.or3),
    caregiver: formatArray(cur?.or5a),
    monitoring: formatArray(cur?.or6),
  };

  /* ===== Export helpers ===== */
  const downloadPDF = () => window.print();

  const downloadTXT = () => {
    let txt = `${data.companyName}\nCompany Profile & Survey Summary\nGenerated: ${data.generatedAt}\n\n`;

    txt += `===== COMPANY PROFILE =====\n`;
    txt += `Co. Name: ${company.name || '—'}\n`;
    txt += `Industry: ${company.industry || '—'}\n`;
    txt += `Annual Revenue: ${company.revenue || '—'}\n`;
    txt += `Employee Size: ${company.size || '—'}\n`;
    txt += `HQ Location: ${company.hq || '—'}\n`;
    txt += `# of Countries w. Presence: ${company.countries || '—'}\n\n`;

    txt += `===== POC PROFILE =====\n`;
    txt += `Name: ${poc.name || '—'}\n`;
    txt += `Email Address: ${poc.email || '—'}\n`;
    txt += `Department: ${poc.department || '—'}\n`;
    txt += `Primary Job Function: ${poc.jobFunction || '—'}\n`;
    txt += `Title / Level: ${poc.title || '—'}\n`;
    txt += `Responsibility / Influence: ${poc.responsibilities || '—'}\n`;
    txt += `Level of influence re: workplace support: ${poc.influence || '—'}\n\n`;

    txt += `===== GENERAL BENEFITS LANDSCAPE =====\n`;
    txt += `% of Emp w/ access to national healthcare: ${benefits.nationalHealthcare || '—'}\n`;
    txt += `% of Emp eligible for Standard Benefits: ${benefits.eligibility || '—'}\n`;
    txt += `Standard Benefits offered: ${benefits.standard || '—'}\n`;
    txt += `Leave & flexibility programs: ${benefits.leave || '—'}\n`;
    txt += `Wellness & support programs: ${benefits.wellness || '—'}\n`;
    txt += `Financial & legal assistance programs: ${benefits.financial || '—'}\n`;
    txt += `Care navigation & support services: ${benefits.navigation || '—'}\n`;
    txt += `Programs plan to rollout over N2Y: ${benefits.planned || '—'}\n`;
    txt += `Approach to remote / hybrid work: ${benefits.remote || '—'}\n\n`;

    txt += `===== CURRENT SUPPORT FOR EMCs =====\n`;
    txt += `Status of Support Offerings: ${support.status || '—'}\n`;
    txt += `Current approach to supporting EMCs: ${support.approach || '—'}\n`;
    txt += `% of Emp excluded from workplace support benefits: ${support.excludedPercent || '—'}\n`;
    txt += `Emp Groups excluded from workplace support benefits: ${support.excluded || '—'}\n`;
    txt += `Triggers for developing programs: ${support.triggers || '—'}\n`;
    if (support.impactfulChange) txt += `Most impactful change: ${support.impactfulChange}\n`;
    if (support.barriers) txt += `Barriers to development: ${support.barriers}\n`;
    txt += `Primary caregiver support programs offered: ${support.caregiver || '—'}\n`;
    txt += `How monitor effectiveness of workplace support program: ${support.monitoring || '—'}\n\n`;

    txt += `===== 13 DIMENSIONS OF SUPPORT =====\n\n`;
    (data.dimensions || []).forEach((dim: any) => {
      const entries = Object.entries(dim.data || {});
      txt += `--- Dimension ${dim.number}: ${dim.name} ---\n`;
      if (entries.length === 0) {
        txt += `No responses recorded.\n\n`;
        return;
      }

      // Sort keys for stable order
      entries
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([key, value]: [string, any]) => {
          // Merge "Other" text if present
          let v = value;
          if (Array.isArray(v) && v.some((s) => /other|specify/i.test(s))) {
            const otherText = (dim.data || {})[`${key}_other`];
            if (otherText) v = [...v, `Other: ${otherText}`];
          }

          const label = getLabelForKey(dim.number, key);
          txt += `${label}: ${formatArray(v) || '—'}\n`;
        });
      txt += `\n`;
    });

    if (Object.keys(data.cross || {}).length > 0) {
      txt += `===== CROSS-DIMENSIONAL ASSESSMENT =====\n`;
      Object.entries(data.cross).forEach(([key, value]: [string, any]) => {
        txt += `${key.toUpperCase()}: ${formatArray(value) || '—'}\n`;
      });
      txt += `\n`;
    }

    if (Object.keys(data.impact || {}).length > 0) {
      txt += `===== EMPLOYEE IMPACT ASSESSMENT =====\n`;
      Object.entries(data.impact).forEach(([key, value]: [string, any]) => {
        txt += `${key.toUpperCase()}: ${formatArray(value) || '—'}\n`;
      });
      txt += `\n`;
    }

    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.companyName}_profile_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* Header */}
      <div className="border-b border-gray-200 bg-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between gap-6">
            <img
              src="/best-companies-2026-logo.png"
              alt="Best Companies Award"
              className="h-24"
            />
            <img
              src="/cancer-careers-logo.png"
              alt="Cancer and Careers"
              className="h-16 brightness-0 invert"
            />
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-4xl font-black text-white">{data.companyName}</h1>
            <p className="text-base text-gray-300 mt-1">Company Profile &amp; Survey Summary</p>
            <p className="text-xs text-gray-400 mt-1">
              Generated: {data.generatedAt}
              {data.email && <span className="ml-2">• {data.email}</span>}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3 print:hidden">
              <a
                href="/dashboard"
                className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-white/40 text-white bg-white/10 hover:bg-white/20 transition"
              >
                ← Back to Dashboard
              </a>
              <button
                onClick={downloadPDF}
                className="px-6 py-2.5 text-sm font-semibold rounded-lg text-white bg-violet-600 hover:bg-violet-700 transition"
              >
                Download PDF
              </button>
              <button
                onClick={downloadTXT}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-orange-500 hover:bg-orange-600 transition"
              >
                Download TXT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Company & POC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-xl p-8 shadow border border-gray-100">
            <SectionHeader title="Company Profile" />
            <div className="space-y-1">
              <DataRow label="Company Name" value={company.name} />
              <DataRow label="Industry" value={company.industry} />
              <DataRow label="Annual Revenue" value={company.revenue} />
              <DataRow label="Employee Size" value={company.size} />
              <DataRow label="HQ Location" value={company.hq} />
              <DataRow label="# of Countries w. Presence" value={company.countries} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow border border-gray-100">
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

        {/* Benefits & Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-xl p-8 shadow border border-gray-100">
            <SectionHeader title="General Benefits Landscape" />
            <div className="space-y-1">
              <DataRow label="% of Employees with National Healthcare" value={benefits.nationalHealthcare} />
              <DataRow label="% of Employees Eligible for Standard Benefits" value={benefits.eligibility} />

              <div className="pt-4 pb-1">
                <div className="text-xs font-bold uppercase tracking-wide text-orange-600">
                  Types of Benefits Offered
                </div>
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

          <div className="bg-white rounded-xl p-8 shadow border border-gray-100">
            <SectionHeader title="Current Support for EMCs" />
            <div className="space-y-1">
              <DataRow label="Status of Support Offerings" value={support.status} />
              <DataRow label="Current Approach to Supporting EMCs" value={support.approach} />
              <DataRow label="% of Employees Excluded" value={support.excludedPercent} />
              <DataRow label="Employee Groups Excluded" value={support.excluded} />
              <DataRow label="Triggers for Developing Programs" value={support.triggers} />
              {support.impactfulChange && (
                <DataRow label="Most Impactful Change" value={support.impactfulChange} />
              )}
              {support.barriers && (
                <DataRow label="Barriers to Development" value={support.barriers} />
              )}
              <DataRow label="Caregiver Support Programs" value={support.caregiver} />
              <DataRow label="How Effectiveness is Monitored" value={support.monitoring} />
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">13 Dimensions of Support</h2>
            <p className="text-gray-600">Comprehensive assessment across all dimensions</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {(data.dimensions || []).map((dim: any) => {
              const dimData = dim.data || {};
              const entries = Object.entries(dimData);

              // Sort keys for stable presentation
              const sorted = entries.sort(([a], [b]) => a.localeCompare(b));

              return (
                <section
                  key={dim.number}
                  className="bg-white rounded-xl p-8 shadow border-2 border-violet-200"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg bg-violet-600">
                      {dim.number}
                    </div>
                    <h3 className="text-lg font-bold text-violet-800 flex-1">{dim.name}</h3>
                  </div>

                  {sorted.length === 0 ? (
                    <div className="text-sm text-gray-500 italic">No responses recorded.</div>
                  ) : (
                    <div className="space-y-1">
                      {sorted.map(([key, value]: [string, any]) => {
                        // Merge “Other” text if applicable
                        let displayValue = value;
                        if (Array.isArray(value) && value.some((v: string) => /other|specify/i.test(v))) {
                          const otherText = (dimData as any)[`${key}_other`];
                          if (otherText) displayValue = [...value, `Other: ${otherText}`];
                        }

                        // If the value is a dictionary of program:status, show as chips
                        if (
                          typeof displayValue === 'object' &&
                          displayValue !== null &&
                          !Array.isArray(displayValue)
                        ) {
                          const items = Object.entries(displayValue);
                          return (
                            <div key={key} className="mb-4 pb-4 border-b border-gray-200">
                              <div className="text-xs font-bold uppercase tracking-wide mb-2 text-orange-600">
                                Programs &amp; Offerings
                              </div>
                              <div className="space-y-2">
                                {items.map(([item, status]) => (
                                  <div
                                    key={item}
                                    className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg hover:bg-gray-50"
                                  >
                                    <span className="text-xs font-medium text-gray-600 flex-1">
                                      {item}
                                    </span>
                                    <span
                                      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                                      style={{
                                        backgroundColor:
                                          status === 'Currently offer'
                                            ? '#d1fae5'
                                            : status === 'In active planning / development'
                                            ? '#dbeafe'
                                            : status === 'Assessing feasibility'
                                            ? '#fef3c7'
                                            : '#f3f4f6',
                                        color:
                                          status === 'Currently offer'
                                            ? '#065f46'
                                            : status === 'In active planning / development'
                                            ? '#1e40af'
                                            : status === 'Assessing feasibility'
                                            ? '#92400e'
                                            : '#4b5563',
                                      }}
                                    >
                                      {String(status)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        const label = getLabelForKey(dim.number, key);
                        return <DataRow key={key} label={label} value={formatArray(displayValue)} />;
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        {/* Additional Assessments */}
        {(Object.keys(data.cross || {}).length > 0 ||
          Object.keys(data.impact || {}).length > 0) && (
          <div className="mb-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">Additional Assessments</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Object.keys(data.cross || {}).length > 0 && (
                <div className="bg-white rounded-xl p-8 shadow border border-gray-100">
                  <SectionHeader title="Cross-Dimensional" />
                  <div className="space-y-1">
                    {Object.entries(data.cross).map(([key, value]: [string, any]) => (
                      <DataRow key={key} label={key.toUpperCase()} value={formatArray(value)} />
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(data.impact || {}).length > 0 && (
                <div className="bg-white rounded-xl p-8 shadow border border-gray-100">
                  <SectionHeader title="Employee Impact" />
                  <div className="space-y-1">
                    {Object.entries(data.impact).map(([key, value]: [string, any]) => (
                      <DataRow key={key} label={key.toUpperCase()} value={formatArray(value)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

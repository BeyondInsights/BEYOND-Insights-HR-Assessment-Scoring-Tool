'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ================== CAC Palette (match app) ================== */
const BRAND = {
  purple: '#6B2C91',
  purpleDark: '#4F1F6A',
  teal: '#14B8A6',
  orange: '#F97316',
  gray900: '#0F172A',
  gray700: '#334155',
  gray600: '#475569',
  gray300: '#CBD5E1',
  gray200: '#E5E7EB',
  gray100: '#F1F5F9',
  bg: '#F9FAFB',
};

/* ================== Custom SVG Icons (no emojis) ================== */
const Bar = ({ className = '', color = BRAND.purple }) => (
  <svg className={className} viewBox="0 0 24 4" aria-hidden="true">
    <rect x="0" y="0" width="24" height="4" rx="2" fill={color} />
  </svg>
);

/* ================== Human Labels (firmographics/classification) ==================
   Extend/adjust to match every S*, C* you have in your instrument maps.
   These override cryptic keys like S8 → “Employee Size”. */
const F_LABEL: Record<string, string> = {
  companyName: 'Company Name',
  s2: 'Gender (Respondent)',         // if present and you *want* it; remove if not
  s3: 'Department',
  s4: 'Primary Job Function',
  s5: 'Current Level',
  s6: 'Areas of Responsibility',
  s7: 'Influence on Benefits',
  s8: 'Employee Size',
  s9: 'Headquarters',
  s9a: 'Countries with Employees',
  c1: 'Company Legal Name',
  c2: 'Industry',
  c3: 'Excluded Employee Groups',
  c4: 'Annual Revenue',
  c5: 'Healthcare Access',
  c6: 'Remote/Hybrid Policy',
  c7: 'Union/Works Council Presence',
  hq: 'Headquarters',
  department: 'Department',
  title: 'Title',
};

/* ================== Dimension Names ================== */
const DIM_NAME: Record<number, string> = {
  1:'Medical Leave & Flexibility',
  2:'Insurance & Financial Protection',
  3:'Manager Preparedness & Capability',
  4:'Navigation & Expert Resources',
  5:'Workplace Accommodations',
  6:'Culture & Psychological Safety',
  7:'Career Continuity & Advancement',
  8:'Work Continuation & Resumption',
  9:'Executive Commitment & Resources',
  10:'Caregiver & Family Support',
  11:'Prevention, Wellness & Legal Compliance',
  12:'Continuous Improvement & Outcomes',
  13:'Communication & Awareness', // D13 intentionally 5-pt incl. Unsure/NA
};

/* ================== Helpers ================== */
const titleize = (s: string) =>
  s.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\s+/g, ' ')
   .trim().replace(/^./, m => m.toUpperCase());

const labelFor = (k: string) => F_LABEL[k] || titleize(k);

const isHidden = (k: string) => {
  const l = k.toLowerCase();
  return l === 's1' || l.includes('birth') || l.includes('age'); // never show age/birth
};

const isScalar = (v: any) => ['string', 'number', 'boolean'].includes(typeof v) || v == null;

/* ================== Row component (tight, dashboard-like) ================== */
function Row({ label, value, accent = BRAND.purple }: { label: string; value: any; accent?: string }) {
  if (value === undefined || value === null || value === '') return null;

  return (
    <div className="grid grid-cols-12 gap-3 py-2">
      <div className="col-span-5 md:col-span-4 lg:col-span-3 flex items-center">
        <Bar className="w-6 h-1 mr-2" color={accent} />
        <span className="text-[13px] font-semibold text-slate-700">{label}</span>
      </div>
      <div className="col-span-7 md:col-span-8 lg:col-span-9 text-[13px] text-slate-900">
        {Array.isArray(value)
          ? (
            <div className="flex flex-wrap gap-1.5">
              {value.map((v, i) => (
                <span key={i} className="px-2.5 py-0.5 rounded-full border text-[12px] bg-white text-slate-800 border-slate-300">
                  {String(v)}
                </span>
              ))}
            </div>
          )
          : (typeof value === 'object'
              ? (
                <div className="space-y-1">
                  {Object.entries(value).map(([kk, vv]) => (
                    vv ? (
                      <div key={kk} className="flex items-center justify-between gap-3 border-b last:border-b-0 border-slate-100 py-1">
                        <span className="text-[12px] text-slate-600">{kk}</span>
                        <span className="px-2 py-0.5 rounded-full border text-[12px] bg-purple-50 text-purple-800 border-purple-200">
                          {String(vv)}
                        </span>
                      </div>
                    ) : null
                  ))}
                </div>
              )
              : <span>{String(value)}</span>
            )
        }
      </div>
    </div>
  );
}

/* ================== Section shell ================== */
function Section({
  title,
  children,
  accent = BRAND.purple,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
  badge?: string;
}) {
  return (
    <section className="border rounded-xl bg-white">
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: BRAND.gray200 }}>
        <h3 className="text-sm font-bold" style={{ color: BRAND.gray900 }}>{title}</h3>
        {badge && (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white" style={{ borderColor: BRAND.gray300, color: BRAND.gray700 }}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

/* ================== Page ================== */
export default function CompanyProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load all stored responses
  useEffect(() => {
    const firmographics = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const general = JSON.parse(localStorage.getItem('general-benefits_data') || '{}');
    const current = JSON.parse(localStorage.getItem('current-support_data') || '{}');

    const dimensions: Array<{ number: number; data: any }> = [];
    for (let i = 1; i <= 13; i++) {
      const d = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      if (Object.keys(d).length) dimensions.push({ number: i, data: d });
    }

    const cross = JSON.parse(localStorage.getItem('cross-dimensional_data') || '{}');
    const impact = JSON.parse(localStorage.getItem('employee-impact_data') || '{}');
    const accountEmail = localStorage.getItem('auth_email') || '';

    // HR POC (collect everything except age/birth)
    const hrPOC = {
      name: [firmographics?.contactFirst, firmographics?.contactLast].filter(Boolean).join(' ')
            || firmographics?.contactName || firmographics?.hr_name || '',
      title: firmographics?.contactTitle || firmographics?.hr_title || firmographics?.title || '',
      department: firmographics?.s3 || firmographics?.department || '',
      email: firmographics?.contactEmail || firmographics?.hr_email || accountEmail || '',
      phone: firmographics?.contactPhone || firmographics?.hr_phone || firmographics?.phone || '',
      location: firmographics?.hq || firmographics?.s9 || '',
    };

    setProfile({
      companyName: firmographics.companyName || firmographics.s8 || 'Your Organization',
      firmographics,
      general,
      current,
      dimensions,
      cross,
      impact,
      hrPOC,
      generatedAt: new Date().toLocaleDateString(),
      accountEmail,
    });
    setLoading(false);
  }, []);

  const firmoPairs = useMemo(
    () =>
      Object.entries(profile?.firmographics || {})
        .filter(([k, v]) => v && !isHidden(k)),
    [profile]
  );

  const printPDF = () => window.print();

  const downloadJSON = () => {
    const data = { ...profile, generatedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `${profile.companyName.replace(/\s+/g, '_')}_Company_Profile.json`,
    });
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadTXT = () => {
    const p = profile;
    let out = `COMPANY PROFILE — ${p.companyName}\nGenerated: ${new Date().toLocaleString()}\n\n`;
    out += `ORGANIZATION SNAPSHOT\n`;
    firmoPairs.forEach(([k, v]) => (out += `${labelFor(k)}: ${Array.isArray(v) ? v.join(', ') : String(v)}\n`));
    out += `\nHR POINT OF CONTACT\n`;
    ['name', 'title', 'department', 'email', 'phone', 'location'].forEach((k) => p.hrPOC?.[k] && (out += `${titleize(k)}: ${p.hrPOC[k]}\n`));
    const blob = new Blob([out], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `${p.companyName.replace(/\s+/g, '_')}_Company_Profile.txt`,
    });
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: BRAND.bg }}>
        <div className="text-slate-600 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BRAND.bg }}>
      {/* ===== Header with your logos ===== */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="w-28" /> {/* spacer for balance */}
            <div className="flex-1 flex justify-center">
              <img
                src="/best-companies-2026-logo.png"
                alt="Best Companies for Working with Cancer Award Logo"
                className="h-14 sm:h-20 lg:h-24 w-auto drop-shadow-md"
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

          <div className="mt-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: BRAND.purple }}>
              {profile.companyName}
            </h1>
            <p className="text-sm text-slate-600">Company Profile & Survey Summary</p>
            <p className="text-xs text-slate-500 mt-1">
              Generated: {profile.generatedAt}{profile.accountEmail ? ` • ${profile.accountEmail}` : ''}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 print:hidden">
            <button onClick={() => router.push('/dashboard')} className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50 text-slate-800">Back to Dashboard</button>
            <button onClick={printPDF} className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50 text-slate-800">Download PDF</button>
            <button onClick={downloadTXT} className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50 text-slate-800">Download .TXT</button>
            <button onClick={downloadJSON} className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50 text-slate-800">Download .JSON</button>
          </div>
        </div>
      </div>

      {/* ===== Top Stats + HR POC ===== */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Headquarters" value={profile.firmographics?.s9 || profile.firmographics?.hq || '—'} />
            <Stat label="Industry" value={profile.firmographics?.c2 || '—'} />
            <Stat label="Employee Size" value={profile.firmographics?.s8 || '—'} />
            <Stat label="Global Footprint" value={profile.firmographics?.s9a || '—'} />
          </div>
          <div className="border rounded-xl bg-white p-4">
            <div className="text-xs font-semibold text-slate-600 mb-2">HR Point of Contact</div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900">{profile.hrPOC?.name || '—'}</div>
              <div className="text-sm text-slate-800">{profile.hrPOC?.title || '—'}</div>
              <div className="text-sm text-slate-800">{profile.hrPOC?.department || '—'}</div>
              <div className="text-sm text-slate-800">{profile.hrPOC?.email || '—'}</div>
              <div className="text-sm text-slate-800">{profile.hrPOC?.phone || '—'}</div>
              <div className="text-sm text-slate-800">{profile.hrPOC?.location || '—'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Dashboard-style two-column sections ===== */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Company Profile (Firmographics & Classification)" accent={BRAND.purple}>
            {firmoPairs.length ? (
              <div className="divide-y divide-slate-100">
                {firmoPairs.map(([k, v]) => (
                  <Row key={k} label={labelFor(k)} value={v} accent={BRAND.purple} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No data provided.</div>
            )}
          </Section>

          <Section title="General Benefits" accent={BRAND.teal}>
            {Object.keys(profile.general || {}).length ? (
              <div className="divide-y divide-slate-100">
                {Object.entries(profile.general).map(([k, v]) => (
                  <Row key={k} label={labelFor(k)} value={v} accent={BRAND.teal} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No data provided.</div>
            )}
          </Section>

          <Section title="Current Support" accent={BRAND.orange}>
            {Object.keys(profile.current || {}).length ? (
              <div className="divide-y divide-slate-100">
                {Object.entries(profile.current).map(([k, v]) => (
                  <Row key={k} label={labelFor(k)} value={v} accent={BRAND.orange} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No data provided.</div>
            )}
          </Section>

          <Section title="Cross-Dimensional Assessment" accent={BRAND.teal}>
            {Object.keys(profile.cross || {}).length ? (
              <div className="divide-y divide-slate-100">
                {Object.entries(profile.cross).map(([k, v]) => (
                  <Row key={k} label={labelFor(k)} value={v} accent={BRAND.teal} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No data provided.</div>
            )}
          </Section>

          <Section title="Employee Impact Assessment" accent={BRAND.orange}>
            {Object.keys(profile.impact || {}).length ? (
              <div className="divide-y divide-slate-100">
                {Object.entries(profile.impact).map(([k, v]) => (
                  <Row key={k} label={labelFor(k)} value={v} accent={BRAND.orange} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No data provided.</div>
            )}
          </Section>
        </div>

        {/* ===== 13 Dimensions ===== */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-base font-bold text-slate-900">13 Dimensions of Support</h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white" style={{ borderColor: BRAND.gray300, color: BRAND.gray700 }}>
              D13 uses 5-point scale (includes Unsure/NA)
            </span>
          </div>

          <div className="space-y-5">
            {profile.dimensions?.map(({ number, data }: any) => (
              <Section
                key={number}
                title={`Dimension ${number}: ${DIM_NAME[number] || ''}`}
                accent={BRAND.purple}
              >
                {/* For each question answered under a dimension, show label:value */}
                <div className="divide-y divide-slate-100">
                  {Object.entries(data).map(([k, v]) => (
                    <Row key={k} label={labelFor(k)} value={v} accent={BRAND.purple} />
                  ))}
                </div>
              </Section>
            ))}
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer className="text-center text-xs text-slate-600 mt-10 pb-10 border-t pt-4">
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
          All responses collected and analyzed by BEYOND Insights, LLC
        </footer>
      </main>

      {/* ===== Print CSS (letter, color exact) ===== */}
      <style jsx>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          section { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

/* ================== Small Stat Tile ================== */
function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border rounded-xl px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value || '—'}</div>
    </div>
  );
}

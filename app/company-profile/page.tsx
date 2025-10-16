'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Brand palette (match app) */
const COLORS = {
  purple: '#6B2C91',
  teal:   '#00A896',
  orange: '#FF6B35',
  gray900:'#111827',
  gray600:'#6B7280',
  gray200:'#E5E7EB',
  bg:     '#F9FAFB'
};

/** Human labels for firmographics & classification */
const FIRMOGRAPHIC_LABELS: Record<string, string> = {
  companyName: 'Company Name',
  s3: 'Department',
  s4: 'Primary Job Function',
  s5: 'Current Level',
  s6: 'Areas of Responsibility',
  s7: 'Influence on Benefits',
  s8: 'Employee Size',
  s9: 'Headquarters',
  s9a: 'Countries with Employees',
  c2: 'Industry',
  c3: 'Excluded Employee Groups',
  c4: 'Annual Revenue',
  c5: 'Healthcare Access',
  c6: 'Remote/Hybrid Policy',
  hq: 'Headquarters',          // fallback
  department: 'Department',    // fallback
  title: 'Title'               // fallback
};

/** Dimension names */
const DIM = {
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
  13:'Communication & Awareness' // D13 is special (5-pt + Unsure/NA)
};

const titleize = (s: string) =>
  s.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\s+/g, ' ')
   .trim().replace(/^./, m => m.toUpperCase());

const hideFirmo = (k: string) => {
  const l = k.toLowerCase();
  return l === 's1' || l.includes('birth') || l.includes('age'); // never show birth/age
};

const looksScale = (v: string) =>
  /(currently|offer|plan|not applicable|unsure|reactive|eligible)/i.test(v);

const pill = (v: string) => {
  const t = v.toLowerCase();
  let cls = 'bg-purple-50 text-purple-800 border border-purple-200';
  if (t.includes('currently offer') || t.includes('currently use')) cls = 'bg-green-50 text-green-800 border border-green-200';
  else if (t.includes('offer to eligible') || t.includes('offer in at least one')) cls = 'bg-blue-50 text-blue-800 border border-blue-200';
  else if (t.includes('plan to offer') || t.includes('active planning')) cls = 'bg-amber-50 text-amber-800 border border-amber-200';
  else if (t.includes('do not plan') || t.includes('not able')) cls = 'bg-gray-100 text-gray-800 border border-gray-300';
  else if (t.includes('not applicable') || t.includes('unsure')) cls = 'bg-gray-50 text-gray-600 border border-gray-200';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{v}</span>;
};

function labelFor(key: string) {
  return FIRMOGRAPHIC_LABELS[key] || titleize(key);
}

function RowTight({ label, value }:{label: string; value: any}) {
  if (value === undefined || value === null || value === '') return null;
  const vStr = Array.isArray(value) ? value.filter(Boolean).join(', ') : String(value);
  return (
    <div className="grid grid-cols-12 gap-3 py-1.5 border-b last:border-b-0 border-gray-100">
      <div className="col-span-5 text-sm font-medium text-gray-700">{label}</div>
      <div className="col-span-7 text-sm text-gray-900">
        {looksScale(vStr) ? pill(vStr) : vStr}
      </div>
    </div>
  );
}

function TwoColBlock({ title, children }:{title:string; children:React.ReactNode}) {
  return (
    <section className="border rounded-xl bg-white">
      <div className="px-5 py-3 border-b bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function DimTable({ data }:{data: Record<string, any>}) {
  const rows = Object.entries(data || {}).filter(([,v]) => v);
  if (!rows.length) return <div className="text-sm text-gray-500">No data provided.</div>;
  return (
    <div className="divide-y divide-gray-100">
      {rows.map(([k, v]) => {
        if (Array.isArray(v)) {
          return <RowTight key={k} label={titleize(k)} value={v.join(', ')} />;
        }
        if (typeof v === 'object') {
          // render object as stacked sub-rows with pills
          const entries = Object.entries(v as Record<string, string>).filter(([,x]) => x);
          return (
            <div key={k} className="py-2">
              <div className="text-sm font-medium text-gray-700 mb-1">{titleize(k)}</div>
              <div className="space-y-1">
                {entries.map(([kk, vv]) => (
                  <div key={kk} className="flex items-start justify-between text-sm">
                    <span className="text-gray-700">{kk}</span>
                    <span className="ml-3">{pill(String(vv))}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return <RowTight key={k} label={titleize(k)} value={String(v)} />;
      })}
    </div>
  );
}

export default function CompanyProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firmographics = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const general = JSON.parse(localStorage.getItem('general-benefits_data') || '{}');
    const current = JSON.parse(localStorage.getItem('current-support_data') || '{}');

    const dims: Array<{ number: number; data: any }> = [];
    for (let i = 1; i <= 13; i++) {
      const d = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      if (Object.keys(d).length) dims.push({ number: i, data: d });
    }

    const cross = JSON.parse(localStorage.getItem('cross-dimensional_data') || '{}');
    const impact = JSON.parse(localStorage.getItem('employee-impact_data') || '{}');
    const email = localStorage.getItem('auth_email') || '';

    // HR POC (never age/birth)
    const hr = {
      name: [firmographics?.contactFirst, firmographics?.contactLast].filter(Boolean).join(' ')
            || firmographics?.contactName || firmographics?.hr_name || '',
      title: firmographics?.contactTitle || firmographics?.hr_title || firmographics?.title || '',
      department: firmographics?.s3 || firmographics?.department || '',
      email: firmographics?.contactEmail || firmographics?.hr_email || email || '',
      phone: firmographics?.contactPhone || firmographics?.hr_phone || firmographics?.phone || '',
      location: firmographics?.hq || firmographics?.s9 || ''
    };

    setProfile({
      companyName: firmographics.companyName || firmographics.s8 || 'Your Organization',
      email,
      firmographics,
      general,
      current,
      dimensions: dims,
      cross,
      impact,
      hrPOC: hr,
      generatedAt: new Date().toLocaleDateString()
    });
    setLoading(false);
  }, []);

  const firmoPairs = useMemo(() => {
    const entries = Object.entries(profile?.firmographics || {})
      .filter(([k, v]) => v && !hideFirmo(k));
    return entries;
  }, [profile]);

  const printPDF = () => window.print();
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url, download: `${profile.companyName.replace(/\s+/g,'_')}_Company_Profile.json`
    });
    a.click(); URL.revokeObjectURL(url);
  };
  const downloadTXT = () => {
    const p = profile;
    let out = `COMPANY PROFILE — ${p.companyName}\nGenerated: ${new Date().toLocaleString()}\n\n`;
    out += `ORGANIZATION SNAPSHOT\n`;
    firmoPairs.forEach(([k,v]) => { out += `${labelFor(k)}: ${Array.isArray(v)? v.join(', '): v}\n`; });
    out += `\nHR POINT OF CONTACT\n`;
    ['name','title','department','email','phone','location'].forEach(k => p.hrPOC?.[k] && (out += `${titleize(k)}: ${p.hrPOC[k]}\n`));
    const blob = new Blob([out], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url, download: `${p.companyName.replace(/\s+/g,'_')}_Company_Profile.txt`
    });
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="text-gray-600 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg }}>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Left spacer to balance center/right */}
            <div className="w-28" />
            {/* Center: Award logo */}
            <div className="flex-1 flex justify-center">
              <img
                src="/best-companies-2026-logo.png"
                alt="Best Companies for Working with Cancer Award Logo"
                className="h-14 sm:h-20 lg:h-24 w-auto drop-shadow-md"
              />
            </div>
            {/* Right: CAC logo */}
            <div className="flex justify-end">
              <img
                src="/cancer-careers-logo.png"
                alt="Cancer and Careers Logo"
                className="h-10 sm:h-14 lg:h-16 w-auto"
              />
            </div>
          </div>

          <div className="mt-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: COLORS.purple }}>
              {profile.companyName}
            </h1>
            <p className="text-sm text-gray-600">Comprehensive Workplace Support Profile</p>
            <p className="text-xs text-gray-500 mt-1">
              Generated: {profile.generatedAt}{profile.email ? ` • ${profile.email}` : ''}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 print:hidden">
            <button onClick={()=>router.push('/dashboard')} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-gray-800">
              Back to Dashboard
            </button>
            <button onClick={printPDF} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-gray-800">
              Download PDF
            </button>
            <button onClick={downloadTXT} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-gray-800">
              Download .TXT
            </button>
            <button onClick={downloadJSON} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-gray-800">
              Download .JSON
            </button>
          </div>
        </div>
      </div>

      {/* Top Stat band + HR POC */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <section className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Headquarters" value={profile.firmographics?.s9 || profile.firmographics?.hq || '—'} />
            <Stat label="Industry" value={profile.firmographics?.c2 || '—'} />
            <Stat label="Employee Size" value={profile.firmographics?.s8 || '—'} />
            <Stat label="Global Footprint" value={profile.firmographics?.s9a || '—'} />
          </section>
          <section className="border rounded-xl bg-white p-4">
            <div className="text-xs font-semibold text-gray-600 mb-2">HR Point of Contact</div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-900">{profile.hrPOC?.name || '—'}</div>
              <div className="text-sm text-gray-800">{profile.hrPOC?.title || '—'}</div>
              <div className="text-sm text-gray-800">{profile.hrPOC?.department || '—'}</div>
              <div className="text-sm text-gray-800">{profile.hrPOC?.email || '—'}</div>
              <div className="text-sm text-gray-800">{profile.hrPOC?.phone || '—'}</div>
              <div className="text-sm text-gray-800">{profile.hrPOC?.location || '—'}</div>
            </div>
          </section>
        </div>
      </section>

      {/* Two-column content */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TwoColBlock title="Organization Snapshot">
            {firmoPairs.length
              ? (
                <div className="divide-y divide-gray-100">
                  {firmoPairs.map(([k, v]) => (
                    <RowTight key={k} label={labelFor(k)} value={v} />
                  ))}
                </div>
              )
              : <div className="text-sm text-gray-500">No data provided.</div>
            }
          </TwoColBlock>

          <TwoColBlock title="General Employee Benefits">
            {Object.keys(profile.general || {}).length
              ? (
                <div className="divide-y divide-gray-100">
                  {Object.entries(profile.general).map(([k, v]) => (
                    <RowTight key={k} label={labelFor(k)} value={v} />
                  ))}
                </div>
              )
              : <div className="text-sm text-gray-500">No data provided.</div>
            }
          </TwoColBlock>

          <TwoColBlock title="Current Support for Employees Managing Cancer">
            {Object.keys(profile.current || {}).length
              ? (
                <div className="divide-y divide-gray-100">
                  {Object.entries(profile.current).map(([k, v]) => (
                    <RowTight key={k} label={labelFor(k)} value={v} />
                  ))}
                </div>
              )
              : <div className="text-sm text-gray-500">No data provided.</div>
            }
          </TwoColBlock>

          <TwoColBlock title="Cross-Dimensional Assessment">
            {Object.keys(profile.cross || {}).length
              ? (
                <div className="divide-y divide-gray-100">
                  {Object.entries(profile.cross).map(([k, v]) => (
                    <RowTight key={k} label={labelFor(k)} value={v} />
                  ))}
                </div>
              )
              : <div className="text-sm text-gray-500">No data provided.</div>
            }
          </TwoColBlock>

          <TwoColBlock title="Employee Impact Assessment">
            {Object.keys(profile.impact || {}).length
              ? (
                <div className="divide-y divide-gray-100">
                  {Object.entries(profile.impact).map(([k, v]) => (
                    <RowTight key={k} label={labelFor(k)} value={v} />
                  ))}
                </div>
              )
              : <div className="text-sm text-gray-500">No data provided.</div>
            }
          </TwoColBlock>
        </div>

        {/* Dimensions */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-base font-bold text-gray-900">13 Dimensions of Support</h2>
            <span className="text-[11px] text-gray-600 border rounded px-2 py-0.5">
              D13 uses 5-point scale (incl. Unsure/NA)
            </span>
          </div>
          <div className="space-y-5">
            {profile.dimensions?.map(({ number, data }: any) => (
              <TwoColBlock key={number} title={`Dimension ${number}: ${DIM[number as 1] || ''}`}>
                <DimTable data={data} />
              </TwoColBlock>
            ))}
          </div>
        </section>

        <footer className="text-center text-xs text-gray-600 mt-10 pb-10 border-t pt-4">
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
          All responses collected and analyzed by BEYOND Insights, LLC
        </footer>
      </main>

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

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border rounded-xl px-3 py-2">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value || '—'}</div>
    </div>
  );
}

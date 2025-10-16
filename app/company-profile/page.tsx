'use client';

import React, { useEffect, useMemo, useState } from 'react';

/* ===== Professional palette - grayscale + single accent ===== */
const BRAND = {
  primary: '#6B2C91',
  gray: {
    900:'#0F172A', 700:'#334155', 600:'#475569',
    400:'#94A3B8', 300:'#CBD5E1', 200:'#E5E7EB',
    bg:'#F9FAFB'
  },
};

/* ===== Dimension names ===== */
const DIM_TITLE: Record<number,string> = {
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
  13:'Communication & Awareness',
};

/* ===== Field labels (short descriptors) ===== */
const LABELS: Record<string, string> = {
  // Firmographics / Classification
  companyName:'Company Name', s2:'Gender', s3:'Department',
  s4a:'Primary Job Function', s4b:'Other Function', s5:'Current Level',
  s6:'Areas of Responsibility', s7:'Benefits Influence', s8:'Employee Size',
  s9:'Headquarters', s9a:'Countries with Employees',
  c2:'Industry', c3:'Excluded Employee Groups', c4:'Annual Revenue',
  c5:'Healthcare Access', c6:'Remote/Hybrid Policy',

  // General / Current examples (others auto-formatted)
  cb3a:'Program Characterization', cb3b:'Key Benefits', cb3c:'Conditions Covered', cb3d:'Communication Methods',
  or1:'Current Approach', or2a:'Development Triggers', or2b:'Most Impactful Change',
  or3:'Support Resources', or5a:'Program Features', or6:'Monitoring Approach',

  // Cross-Dimensional / Impact examples
  cd1a:'Top 3 Dimensions', cd1b:'Bottom 3 Dimensions', cd2:'Implementation Challenges',
  ei1:'Retention Impact', ei2:'Absence Impact', ei3:'Performance Impact', ei5:'Return-to-Work Quality',
};

/* ===== Helpers ===== */
const looksScale = (v:string) =>
  /(currently|offer|plan|eligible|not applicable|unsure|reactive)/i.test(v);

function formatLabel(key: string): string {
  if (LABELS[key]) return LABELS[key];
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());
}

/** Return only what was selected:
 *  - arrays: non-empty items
 *  - objects: keys where value is "selected" (true/yes/selected/checked/non-empty string not equal 'no')
 *  - strings/numbers: the value itself (trimmed)
 */
function selectedOnly(value: any): string[] | string | null {
  if (value == null) return null;

  if (Array.isArray(value)) {
    const filtered = value.map(String).map(s => s.trim()).filter(Boolean);
    return filtered.length ? filtered : null;
  }

  if (typeof value === 'object') {
    const picks = Object.entries(value)
      .filter(([, v]) => {
        if (v === true) return true;
        if (typeof v === 'number') return true;
        if (typeof v === 'string') {
          const s = v.trim().toLowerCase();
          if (!s) return false;
          if (['yes','selected','checked','true'].includes(s)) return true;
          if (['no','false','none','not selected'].includes(s)) return false;
          return true; // Likert/status chosen text
        }
        return false;
      })
      .map(([k]) => k);
    return picks.length ? picks : null;
  }

  const s = String(value).trim();
  return s || null;
}

const hasAnySelected = (obj: Record<string, any>) =>
  Object.values(obj || {}).some(v => {
    const s = selectedOnly(v);
    return s && (Array.isArray(s) ? s.length > 0 : s.trim().length > 0);
  });

/* ===== Chips ===== */
function Chips({items}:{items:string[]}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((v,i)=>(
        <span key={i} className="px-2 py-0.5 rounded border text-xs bg-white"
              style={{borderColor:BRAND.gray[300], color:BRAND.gray[900]}}>
          {v}
        </span>
      ))}
    </div>
  );
}

/* ===== Single row ===== */
function DataRow({ label, selected }:{label:string; selected:string | string[] | null}) {
  const pill = (txt: string) => (
    <span className="px-2 py-0.5 rounded-full border text-xs bg-gray-50"
          style={{color:BRAND.primary, borderColor:BRAND.gray[300]}}>
      {txt}
    </span>
  );

  return (
    <div className="py-2 border-b last:border-b-0 flex items-start gap-3"
         style={{borderColor:BRAND.gray[200]}}>
      <div className="w-56 shrink-0">
        <span className="text-xs font-semibold" style={{color:BRAND.gray[600]}}>
          {label}
        </span>
      </div>
      <div className="text-xs flex-1" style={{color:BRAND.gray[900]}}>
        {selected == null
          ? <span>—</span>
          : Array.isArray(selected)
              ? (selected.length ? <Chips items={selected}/> : <span>—</span>)
              : (looksScale(selected) ? pill(selected) : <span>{selected}</span>)}
      </div>
    </div>
  );
}

/* ===== Section ===== */
function Section({
  title, children, badge, placeholderWhenEmpty,
}:{
  title:string;
  children:React.ReactNode;
  badge?:string;
  placeholderWhenEmpty?: boolean; // if true, show "No selections" when everything inside is null
}) {
  // Detect if section has anything rendered by scanning children rows.
  // We’ll rely on a simple flag passed in where needed.
  return (
    <section className="mb-6 rounded-lg border overflow-hidden" style={{borderColor:BRAND.gray[300]}}>
      <div className="px-6 py-3 flex items-center justify-between bg-white border-b"
           style={{borderColor:BRAND.gray[300]}}>
        <h2 className="text-base font-bold" style={{color:BRAND.gray[900]}}>{title}</h2>
        {badge &&
          <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-gray-50"
                style={{borderColor:BRAND.gray[300], color:BRAND.gray[700]}}>
            {badge}
          </span>
        }
      </div>
      <div className="p-6 bg-white">
        {children}
        {placeholderWhenEmpty && (
          <div className="text-xs text-slate-500 mt-1">No selections</div>
        )}
      </div>
    </section>
  );
}

/* ===== Page ===== */
export default function CompanyProfile() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const general = JSON.parse(localStorage.getItem('general-benefits_data') || '{}');
    const current = JSON.parse(localStorage.getItem('current-support_data') || '{}');
    const cross = JSON.parse(localStorage.getItem('cross-dimensional_data') || '{}');
    const impact = JSON.parse(localStorage.getItem('employee-impact_data') || '{}');

    const dims: Array<{ number: number; data: Record<string, any> }> = [];
    for (let i = 1; i <= 13; i++) {
      const raw = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      dims.push({ number: i, data: raw || {} }); // include all dims; we render placeholders when empty
    }

    setData({
      companyName: firmo.companyName || firmo.company_name || firmo.s8 || 'Organization',
      email: localStorage.getItem('auth_email') || '',
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      firmographics: firmo,
      general,
      current,
      cross,
      impact,
      dimensions: dims,
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{backgroundColor:BRAND.gray.bg}}>
        <div className="text-sm" style={{color:BRAND.gray[600]}}>Loading…</div>
      </div>
    );
  }

  /* --- Convenience --- */
  const firmo = data.firmographics || {};
  const gen = data.general || {};
  const cur = data.current || {};
  const cd  = data.cross || {};
  const ei  = data.impact || {};

  /* --- POC fields (separate section) --- */
  const poc = {
    name: [firmo?.contactFirst, firmo?.contactLast].filter(Boolean).join(' ') || firmo?.contactName || firmo?.hr_name || null,
    email: firmo?.contactEmail || data.email || null,
    title: firmo?.contactTitle || firmo?.hr_title || firmo?.s5 || null,
    department: firmo?.s3 || firmo?.department || null,
    phone: firmo?.contactPhone || firmo?.hr_phone || firmo?.phone || null,
    location: firmo?.hq || firmo?.s9 || null,
  };

  const Stat = ({ label, value }:{label:string; value:any}) => (
    <div className="bg-white border rounded-lg px-3 py-2" style={{borderColor:BRAND.gray[200]}}>
      <div className="text-xs" style={{color:BRAND.gray[600]}}>{label}</div>
      <div className="text-sm font-semibold" style={{color:BRAND.gray[900]}}>{value || '—'}</div>
    </div>
  );

  /* Determine if a section has any selected rows (for placeholder switch) */
  const sectionEmpty = (obj:Record<string,any>) => !hasAnySelected(obj);

  return (
    <div className="min-h-screen" style={{backgroundColor:BRAND.gray.bg}}>
      {/* Header */}
      <div className="bg-white border-b" style={{borderColor:BRAND.gray[200]}}>
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
              <img src="/cancer-careers-logo.png" alt="Cancer and Careers Logo" className="h-10 sm:h-14 lg:h-16 w-auto" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-5xl font-black mb-2" style={{color:BRAND.primary}}>
              {data.companyName}
            </h1>
            <p className="text-base" style={{color:BRAND.gray[600]}}>Company Profile &amp; Survey Summary</p>
            <p className="text-sm mt-1" style={{color:BRAND.gray[600]}}>
              Generated: {data.generatedAt}{data.email ? ` • ${data.email}` : ''}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
              <a href="/dashboard" className="px-3 py-1.5 text-sm font-semibold border rounded"
                 style={{borderColor:BRAND.gray[200], color:BRAND.gray[900]}}>
                Back to Dashboard
              </a>
              <button onClick={()=>window.print()}
                      className="px-3 py-1.5 text-sm font-semibold rounded text-white"
                      style={{backgroundColor:BRAND.primary}}>
                Print PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POC (separate) + Company Overview tiles */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* POC Details */}
          <div className="bg-white border rounded-lg p-6" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-lg font-bold mb-4" style={{color:BRAND.gray[900]}}>Point of Contact Details</h2>
            <div className="space-y-3">
              <DataRow label="Name"       selected={selectedOnly(poc.name)} />
              <DataRow label="Email"      selected={selectedOnly(poc.email)} />
              <DataRow label="Title"      selected={selectedOnly(poc.title)} />
              <DataRow label="Department" selected={selectedOnly(poc.department)} />
              <DataRow label="Phone"      selected={selectedOnly(poc.phone)} />
              <DataRow label="Location"   selected={selectedOnly(poc.location)} />
            </div>
          </div>

          {/* Company Profile (Topline) */}
          <div className="bg-white border rounded-lg p-6" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-lg font-bold mb-4" style={{color:BRAND.gray[900]}}>Company Profile (Topline)</h2>
            <div className="space-y-3">
              <DataRow label="Headquarters"    selected={selectedOnly(firmo?.s9 || firmo?.hq)} />
              <DataRow label="Industry"        selected={selectedOnly(firmo?.c2)} />
              <DataRow label="Employee Size"   selected={selectedOnly(firmo?.s8)} />
              <DataRow label="Global Footprint"selected={selectedOnly(firmo?.s9a)} />
              <DataRow label="Annual Revenue"  selected={selectedOnly(firmo?.c4)} />
            </div>
          </div>
        </div>
      </section>

      {/* Company Profile (full firmographics/classification) */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        <Section
          title="Company Profile & Firmographics (Full)"
          placeholderWhenEmpty={sectionEmpty(firmo)}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(firmo || {})
                .filter(([k]) => k !== 's1') // exclude birth year
                .slice(0, Math.ceil(Object.keys(firmo || {}).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
                ))}
            </div>
            <div>
              {Object.entries(firmo || {})
                .filter(([k]) => k !== 's1')
                .slice(Math.ceil(Object.keys(firmo || {}).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
                ))}
            </div>
          </div>
        </Section>

        {/* General Benefits */}
        <Section
          title="General Employee Benefits"
          placeholderWhenEmpty={sectionEmpty(gen)}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(gen)
                .slice(0, Math.ceil(Object.keys(gen).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
                ))}
            </div>
            <div>
              {Object.entries(gen)
                .slice(Math.ceil(Object.keys(gen).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
                ))}
            </div>
          </div>
        </Section>

        {/* Current Support */}
        <Section
          title="Current Support for Employees Managing Cancer"
          placeholderWhenEmpty={sectionEmpty(cur)}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(cur)
                .slice(0, Math.ceil(Object.keys(cur).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
                ))}
            </div>
            <div>
              {Object.entries(cur)
                .slice(Math.ceil(Object.keys(cur).length / 2))
                .map(([k, v]) => (
                  <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
                ))}
            </div>
          </div>
        </Section>

        {/* 13 Dimensions of Support */}
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-base font-bold" style={{color:BRAND.gray[900]}}>13 Dimensions of Support</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-white"
                style={{borderColor:BRAND.gray[200], color:BRAND.gray[700]}}>
            D13 uses 5-point scale
          </span>
        </div>

        {data.dimensions.map((dim: { number: number; data: Record<string, any> }) => {
          const entries = Object.entries(dim.data || {});
          const left = entries.slice(0, Math.ceil(entries.length / 2));
          const right = entries.slice(Math.ceil(entries.length / 2));

          // Determine if the dimension has any selected rows
          const dimEmpty = !hasAnySelected(dim.data);

          return (
            <Section
              key={dim.number}
              title={`Dimension ${dim.number}: ${DIM_TITLE[dim.number]}`}
              badge={dim.number === 13 ? '5-point' : undefined}
              placeholderWhenEmpty={dimEmpty}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                <div>
                  {left.map(([k, v]) => (
                    <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
                  ))}
                </div>
                <div>
                  {right.map(([k, v]) => (
                    <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
                  ))}
                </div>
              </div>
            </Section>
          );
        })}

        {/* Cross-Dimensional */}
        <Section
          title="Cross-Dimensional Assessment"
          placeholderWhenEmpty={sectionEmpty(cd)}
        >
          <div className="space-y-2">
            {Object.entries(cd || {}).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
            ))}
          </div>
        </Section>

        {/* Employee Impact */}
        <Section
          title="Employee Impact Assessment"
          placeholderWhenEmpty={sectionEmpty(ei)}
        >
          <div className="space-y-2">
            {Object.entries(ei || {}).map(([k, v]) => (
              <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center text-xs"
             style={{borderColor:BRAND.gray[200], color:BRAND.gray[700]}}>
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers &amp; CEW Foundation •
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

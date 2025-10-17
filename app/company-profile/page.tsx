'use client';

import React, { useEffect, useState } from 'react';

const BRAND = {
  primary: '#6B2C91',
  gray: {
    900:'#0F172A', 700:'#334155', 600:'#475569',
    400:'#94A3B8', 300:'#CBD5E1', 200:'#E5E7EB',
    bg:'#F9FAFB'
  },
};

const DIM_TITLE: Record<number,string> = {
  1:'Medical Leave & Flexibility',
  2:'Insurance & Financial Protection',
  3:'Manager Preparedness & Capability',
  4:'Navigation & Expert Resources',
  5:'Workplace Accommodations',
  6:'Culture & Psychological Safety',
  7:'Career Continuity & Advancement',
  8:'Return-to-Work Excellence',
  9:'Executive Commitment & Resources',
  10:'Caregiver & Family Support',
  11:'Prevention, Wellness & Legal Compliance',
  12:'Continuous Improvement & Outcomes',
  13:'Communication & Awareness',
};

const LABELS: Record<string, string> = {
  companyName:'Company Name', s2:'Gender', s3:'Department',
  s4a:'Primary Job Function', s4b:'Other Function', s5:'Current Level',
  s6:'Areas of Responsibility', s7:'Benefits Influence', s8:'Employee Size',
  s9:'Headquarters', s9a:'Countries with Employees',
  c2:'Industry', c3:'Excluded Employee Groups', c4:'Annual Revenue',
  c5:'Healthcare Access', c6:'Remote/Hybrid Policy',
  cb3a:'Program Characterization', cb3b:'Key Benefits', cb3c:'Conditions Covered', cb3d:'Communication Methods',
  or1:'Current Approach', or2a:'Development Triggers', or2b:'Most Impactful Change',
  or3:'Support Resources', or5a:'Program Features', or6:'Monitoring Approach',
  cd1a:'Top 3 Dimensions', cd1b:'Bottom 3 Dimensions', cd2:'Implementation Challenges',
  ei1:'Retention Impact', ei2:'Absence Impact', ei3:'Performance Impact', ei5:'Return-to-Work Quality',
};

function formatLabel(key: string): string {
  if (LABELS[key]) return LABELS[key];
  
  // Better formatting for dimension keys
  if (key.match(/^d\d+a$/)) return 'Program Status';
  if (key.match(/^d\d+aa$/)) return 'Multi-Country Consistency';
  if (key.match(/^d\d+_1$/)) return 'Additional Details';
  if (key.match(/^d\d+b$/)) return 'Other Initiatives';
  
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
    const selected = Object.entries(value)
      .filter(([, v]) => {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'string') {
          const lower = v.toLowerCase().trim();
          return lower === 'yes' || lower === 'selected' || lower === 'checked' ||
                 (lower.length > 0 && lower !== 'no');
        }
        return false;
      })
      .map(([k]) => k);
    return selected.length ? selected : null;
  }

  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

function hasAnySelected(obj: Record<string,any>): boolean {
  return Object.values(obj).some(v => selectedOnly(v) != null);
}

function Chips({items}:{items:string[]}) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((it,i) => (
        <span key={i} className="inline-block px-2 py-0.5 rounded text-xs font-medium"
              style={{backgroundColor:BRAND.gray[200], color:BRAND.gray[900]}}>
          {it}
        </span>
      ))}
    </div>
  );
}

function pill(status:string){
  const colors:{[k:string]:string}={
    'Currently offer':'#059669',
    'In active planning / development':'#0284c7',
    'Assessing feasibility':'#d97706',
    'Currently measure / track':'#059669',
    'Currently use':'#059669'
  };
  const bgs:{[k:string]:string}={
    'Currently offer':'#d1fae5',
    'In active planning / development':'#e0f2fe',
    'Assessing feasibility':'#fef3c7',
    'Currently measure / track':'#d1fae5',
    'Currently use':'#d1fae5'
  };
  const c = colors[status] || BRAND.gray[600];
  const bg= bgs[status] || BRAND.gray[100];
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
          style={{color:c, backgroundColor:bg}}>
      {status}
    </span>
  );
}

function DataRow({label, selected}:{label:string; selected:string[]|string|null}) {
  if (selected == null) return null;
  
  const looksScale = (v:string) =>
    /(currently|offer|plan|measure|track|use|eligible|not applicable|unsure|reactive)/i.test(v);
  
  return (
    <div className="flex py-1.5 border-b last:border-0" style={{borderColor:BRAND.gray[200]}}>
      <div className="w-64 pr-4 flex-shrink-0">
        <span className="text-xs font-medium" style={{color:BRAND.gray[600]}}>{label}:</span>
      </div>
      <div className="flex-1 text-xs" style={{color:BRAND.gray[900]}}>
        {Array.isArray(selected)
          ? <Chips items={selected}/>
          : (looksScale(selected) ? pill(selected) : <span>{selected}</span>)}
      </div>
    </div>
  );
}

function Section({
  title, children, badge, placeholderWhenEmpty,
}:{
  title:string;
  children:React.ReactNode;
  badge?:string;
  placeholderWhenEmpty?: boolean;
}) {
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
      // ONLY ADD IF HAS DATA
      if (Object.keys(raw).length > 0) {
        dims.push({ number: i, data: raw });
      }
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

  const firmo = data.firmographics || {};
  const gen = data.general || {};
  const cur = data.current || {};
  const cd  = data.cross || {};
  const ei  = data.impact || {};

  const poc = {
    name: [firmo?.contactFirst, firmo?.contactLast].filter(Boolean).join(' ') || firmo?.contactName || firmo?.hr_name || null,
    email: firmo?.contactEmail || data.email || null,
    title: firmo?.contactTitle || firmo?.hr_title || firmo?.s5 || null,
    department: firmo?.s3 || firmo?.department || null,
    phone: firmo?.contactPhone || firmo?.hr_phone || firmo?.phone || null,
    location: firmo?.hq || firmo?.s9 || null,
  };

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
                src="/beyond-insights-logo.png"
                alt="Beyond Insights"
                className="h-20 w-auto"
                style={{objectFit:'contain'}}
              />
            </div>
            <div className="flex justify-end">
              <img 
                src="/cac-logo.png" 
                alt="Cancer and Careers" 
                className="h-16 w-auto"
                style={{objectFit:'contain'}}
              />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-5xl font-black mb-2" style={{color:BRAND.primary}}>
              {data.companyName}
            </h1>
            <p className="text-base" style={{color:BRAND.gray[600]}}>Company Profile & Survey Summary</p>
            <p className="text-sm mt-1" style={{color:BRAND.gray[600]}}>
              Generated: {data.generatedAt}{data.email ? ` • ${data.email}` : ''}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
              <a href="/dashboard" className="px-3 py-1.5 text-sm font-semibold border rounded hover:bg-gray-50"
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

      {/* POC + Company */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-6" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-lg font-bold mb-4" style={{color:BRAND.gray[900]}}>Point of Contact</h2>
            <div className="space-y-3">
              <DataRow label="Name" selected={selectedOnly(poc.name)} />
              <DataRow label="Email" selected={selectedOnly(poc.email)} />
              <DataRow label="Title" selected={selectedOnly(poc.title)} />
              <DataRow label="Department" selected={selectedOnly(poc.department)} />
              <DataRow label="Phone" selected={selectedOnly(poc.phone)} />
              <DataRow label="Location" selected={selectedOnly(poc.location)} />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-lg font-bold mb-4" style={{color:BRAND.gray[900]}}>Company Profile (Topline)</h2>
            <div className="space-y-3">
              <DataRow label="Headquarters" selected={selectedOnly(firmo?.s9 || firmo?.hq)} />
              <DataRow label="Industry" selected={selectedOnly(firmo?.c2)} />
              <DataRow label="Employee Size" selected={selectedOnly(firmo?.s8)} />
              <DataRow label="Global Footprint" selected={selectedOnly(firmo?.s9a)} />
              <DataRow label="Annual Revenue" selected={selectedOnly(firmo?.c4)} />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* Full Firmographics */}
        <Section title="Company Profile & Firmographics (Full)" placeholderWhenEmpty={sectionEmpty(firmo)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(firmo || {})
                .filter(([k]) => k !== 's1')
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
        <Section title="General Employee Benefits" placeholderWhenEmpty={sectionEmpty(gen)}>
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
        <Section title="Current Support for Employees Managing Cancer" placeholderWhenEmpty={sectionEmpty(cur)}>
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

        {/* 13 Dimensions - EACH GETS ITS OWN SECTION */}
        {data.dimensions.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-4" style={{color:BRAND.gray[900]}}>
              13 Dimensions of Support
            </h2>
            {data.dimensions.map((dim: { number: number; data: Record<string, any> }) => {
              const entries = Object.entries(dim.data || {});
              if (entries.length === 0) return null;
              
              const left = entries.slice(0, Math.ceil(entries.length / 2));
              const right = entries.slice(Math.ceil(entries.length / 2));

              return (
                <Section
                  key={dim.number}
                  title={`Dimension ${dim.number}: ${DIM_TITLE[dim.number]}`}
                  badge={dim.number === 13 ? 'Uses 5-point scale' : undefined}
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
          </div>
        )}

        {/* Cross-Dimensional */}
        {Object.keys(cd).length > 0 && (
          <Section title="Cross-Dimensional Assessment">
            <div className="space-y-2">
              {Object.entries(cd).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
              ))}
            </div>
          </Section>
        )}

        {/* Employee Impact */}
        {Object.keys(ei).length > 0 && (
          <Section title="Employee Impact Assessment">
            <div className="space-y-2">
              {Object.entries(ei).map(([k, v]) => (
                <DataRow key={k} label={formatLabel(k)} selected={selectedOnly(v)} />
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center text-xs"
             style={{borderColor:BRAND.gray[200], color:BRAND.gray[700]}}>
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
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

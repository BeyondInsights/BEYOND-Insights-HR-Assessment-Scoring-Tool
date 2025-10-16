'use client';

import React, { useEffect, useState } from 'react';

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

/* ===== Field labels ===== */
const LABELS: Record<string, string> = {
  companyName:'Company Name', s1:'Birth Year', s2:'Gender', s3:'Department', 
  s4a:'Primary Job Function', s4b:'Other Function', s5:'Current Level',
  s6:'Areas of Responsibility', s7:'Benefits Influence', s8:'Employee Size', 
  s9:'Headquarters', s9a:'Countries with Employees', 
  c2:'Industry', c3:'Excluded Employee Groups', c4:'Annual Revenue', 
  c5:'Healthcare Access', c6:'Remote/Hybrid Policy',
  cb3a:'Program Characterization', cb3b:'Key Benefits', cb3c:'Conditions Covered', 
  cb3d:'Communication Methods',
  or1:'Current Approach', or2a:'Development Triggers', or2b:'Most Impactful Change',
  or3:'Support Resources', or5a:'Program Features', or6:'Monitoring Approach',
  cd1a:'Top 3 Dimensions', cd1b:'Bottom 3 Dimensions', cd2:'Implementation Challenges',
};

/* ===== Helpers ===== */
const looksScale = (v:string) =>
  /(currently|offer|plan|eligible|not applicable|unsure|reactive)/i.test(v);

function formatLabel(key: string): string {
  if (LABELS[key]) return LABELS[key];
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

function formatValue(value: any): string | string[] | null {
  if (value == null || value === '') return null;
  if (Array.isArray(value)) {
    const filtered = value.filter(v => v && v !== '');
    return filtered.length > 0 ? filtered : null;
  }
  if (typeof value === 'object') {
    const selected = Object.entries(value)
      .filter(([k, v]) => v === true || v === 'selected' || v === 'yes')
      .map(([k]) => k);
    return selected.length > 0 ? selected : null;
  }
  return String(value).trim() || null;
}

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
function DataRow({ label, value }:{label:string; value:string | string[] | null}) {
  if (!value) return null;
  
  return (
    <div className="py-2 border-b last:border-b-0 flex items-start gap-3"
         style={{borderColor:BRAND.gray[200]}}>
      <div className="w-48 shrink-0">
        <span className="text-xs font-semibold" style={{color:BRAND.gray[600]}}>
          {label}
        </span>
      </div>
      <div className="text-xs flex-1" style={{color:BRAND.gray[900]}}>
        {Array.isArray(value) ? (
          <Chips items={value} />
        ) : looksScale(value) ? (
          <span className="px-2 py-0.5 rounded-full border text-xs bg-gray-50"
                style={{color:BRAND.primary, borderColor:BRAND.gray[300]}}>
            {value}
          </span>
        ) : (
          <span>{value}</span>
        )}
      </div>
    </div>
  );
}

/* ===== Section ===== */
function Section({title, children, badge, isEmpty}:{
  title:string; 
  children:React.ReactNode; 
  badge?:string;
  isEmpty?:boolean;
}) {
  if (isEmpty) return null;
  
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
    
    const dimensions = [];
    for (let i = 1; i <= 13; i++) {
      const dim = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      if (Object.keys(dim).length > 0) {
        dimensions.push({ number: i, data: dim });
      }
    }

    setData({
      companyName: firmo.companyName || firmo.company_name || firmo.s8 || 'Organization',
      email: localStorage.getItem('auth_email') || '',
      generatedAt: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }),
      firmographics: firmo,
      general,
      current,
      cross,
      impact,
      dimensions
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

  const hasData = (obj: any) => Object.keys(obj || {}).length > 0;

  const Tile = ({ label, value }:{label:string; value:any}) => (
    <div className="bg-white border rounded-lg px-3 py-2" style={{borderColor:BRAND.gray[200]}}>
      <div className="text-xs" style={{color:BRAND.gray[600]}}>{label}</div>
      <div className="text-sm font-semibold" style={{color:BRAND.gray[900]}}>
        {value || '—'}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{backgroundColor:BRAND.gray.bg}}>
      {/* Header */}
      <div className="bg-white border-b" style={{borderColor:BRAND.gray[200]}}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-5xl font-black mb-2" style={{color:BRAND.primary}}>
              {data.companyName}
            </h1>
            <p className="text-base" style={{color:BRAND.gray[600]}}>
              Company Profile & Survey Summary
            </p>
            <p className="text-sm mt-1" style={{color:BRAND.gray[600]}}>
              Generated: {data.generatedAt}{data.email ? ` • ${data.email}` : ''}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
              <button onClick={() => window.location.href = '/dashboard'}
                      className="px-3 py-1.5 text-sm font-semibold border rounded"
                      style={{borderColor:BRAND.gray[200], color:BRAND.gray[900]}}>
                Back to Dashboard
              </button>
              <button onClick={() => window.print()}
                      className="px-3 py-1.5 text-sm font-semibold rounded text-white"
                      style={{backgroundColor:BRAND.primary}}>
                Print PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HR Contact & Company Overview */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: HR Point of Contact */}
          <div className="bg-white border rounded-lg p-6" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-lg font-bold mb-4" style={{color:BRAND.gray[900]}}>
              HR Point of Contact
            </h2>
            <div className="space-y-3">
              <DataRow label="Name" value={formatValue(
                [data.firmographics?.contactFirst, data.firmographics?.contactLast].filter(Boolean).join(' ') ||
                data.firmographics?.contactName ||
                data.firmographics?.hr_name
              )} />
              <DataRow label="Title" value={formatValue(
                data.firmographics?.contactTitle || 
                data.firmographics?.hr_title ||
                data.firmographics?.s5
              )} />
              <DataRow label="Department" value={formatValue(data.firmographics?.s3)} />
              <DataRow label="Email" value={formatValue(
                data.firmographics?.contactEmail || 
                data.email
              )} />
              <DataRow label="Phone" value={formatValue(data.firmographics?.contactPhone)} />
            </div>
          </div>

          {/* Right: Company Profile */}
          <div className="bg-white border rounded-lg p-6" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-lg font-bold mb-4" style={{color:BRAND.gray[900]}}>
              Company Profile
            </h2>
            <div className="space-y-3">
              <DataRow label="Headquarters" value={formatValue(data.firmographics?.s9 || data.firmographics?.hq)} />
              <DataRow label="Industry" value={formatValue(data.firmographics?.c2)} />
              <DataRow label="Employee Size" value={formatValue(data.firmographics?.s8)} />
              <DataRow label="Global Footprint" value={formatValue(data.firmographics?.s9a)} />
              <DataRow label="Annual Revenue" value={formatValue(data.firmographics?.c4)} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        
        {/* Firmographics */}
        <Section title="Company Profile & Firmographics" isEmpty={!hasData(data.firmographics)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(data.firmographics || {})
                .filter(([k]) => !['s1'].includes(k)) // exclude birth year
                .slice(0, Math.ceil(Object.keys(data.firmographics || {}).length / 2))
                .map(([key, value]) => (
                  <DataRow key={key} label={formatLabel(key)} value={formatValue(value)} />
                ))}
            </div>
            <div>
              {Object.entries(data.firmographics || {})
                .filter(([k]) => !['s1'].includes(k))
                .slice(Math.ceil(Object.keys(data.firmographics || {}).length / 2))
                .map(([key, value]) => (
                  <DataRow key={key} label={formatLabel(key)} value={formatValue(value)} />
                ))}
            </div>
          </div>
        </Section>

        {/* General Benefits */}
        <Section title="General Employee Benefits" isEmpty={!hasData(data.general)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(data.general || {})
                .slice(0, Math.ceil(Object.keys(data.general || {}).length / 2))
                .map(([key, value]) => (
                  <DataRow key={key} label={formatLabel(key)} value={formatValue(value)} />
                ))}
            </div>
            <div>
              {Object.entries(data.general || {})
                .slice(Math.ceil(Object.keys(data.general || {}).length / 2))
                .map(([key, value]) => (
                  <DataRow key={key} label={formatLabel(key)} value={formatValue(value)} />
                ))}
            </div>
          </div>
        </Section>

        {/* Current Support */}
        <Section title="Current Support for Employees Managing Cancer" isEmpty={!hasData(data.current)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
            <div>
              {Object.entries(data.current || {})
                .slice(0, Math.ceil(Object.keys(data.current || {}).length / 2))
                .map(([key, value]) => (
                  <DataRow key={key} label={formatLabel(key)} value={formatValue(value)} />
                ))}
            </div>
            <div>
              {Object.entries(data.current || {})
                .slice(Math.ceil(Object.keys(data.current || {}).length / 2))
                .map(([key, value]) => (
                  <DataRow key={key} label={formatLabel(key)} value={formatValue(value)} />
                ))}
            </div>
          </div>
        </Section>

        {/* 13 Dimensions */}
        {data.dimensions && data.dimensions.length > 0 && (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-base font-bold" style={{color:BRAND.gray[900]}}>
                13 Dimensions of Support
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-white"
                    style={{borderColor:BRAND.gray[200], color:BRAND.gray[700]}}>
                D13 uses 5-point scale
              </span>
            </div>

            {data.dimensions.map((dim: any) => (
              <Section 
                key={dim.number}
                title={`Dimension ${dim.number}: ${DIM_TITLE[dim.number]}`}
                badge={dim.number === 13 ? '5-point' : undefined}
                isEmpty={!hasData(dim.data)}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                  <div>
                    {Object.entries(dim.data || {})
                      .slice(0, Math.ceil(Object.keys(dim.data || {}).length / 2))
                      .map(([key, value]) => (
                        <DataRow key={key} label={formatLabel(key)} value={formatValue(value)} />
                      ))}
                  </div>
                  <div>
                    {Object.entries(dim.data || {})
                      .slice(Math.ceil(Object.keys(dim.data || {}).length / 2))
                      .map(([key, value]) => (
                        <DataRow key={key} label={formatLabel(key)} value={formatValue(value)} />
                      ))}
                  </div>
                </div>
              </Section>
            ))}
          </>
        )}

        {/* Cross-Dimensional */}
        <Section title="Cross-Dimensional Assessment" isEmpty={!hasData(data.cross)}>
          <div className="space-y-2">
            {Object.entries(data.cross || {}).map(([key, value]) => (
              <DataRow key={key} label={formatLabel(key)} value={formatValue(value)} />
            ))}
          </div>
        </Section>

        {/* Employee Impact */}
        <Section title="Employee Impact Assessment" isEmpty={!hasData(data.impact)}>
          <div className="space-y-2">
            {Object.entries(data.impact || {}).map(([key, value]) => (
              <DataRow key={key} label={formatLabel(key)} value={formatValue(value)} />
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center text-xs"
             style={{borderColor:BRAND.gray[200], color:BRAND.gray[700]}}>
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
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

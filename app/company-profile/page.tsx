'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { INSTRUMENT_ITEMS, type InstrumentItem } from '../../data/instrument-items';

/* ===== Brand palette ===== */
const BRAND = {
  purple: '#6B2C91',
  teal:   '#14B8A6',
  orange: '#F97316',
  gray900:'#0F172A',
  gray700:'#334155',
  gray600:'#475569',
  gray300:'#CBD5E1',
  gray200:'#E5E7EB',
  gray100:'#F1F5F9',
  bg:     '#F9FAFB',
};

/* ===== Dimension Names (for section titles only) ===== */
const DIM_NAME: Record<number,string> = {
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
  13:'Communication & Awareness', // D13 = 5-pt incl. Unsure/NA
};

/* ===== Custom inline SVG (no emojis) ===== */
const Bar = ({ className='', color=BRAND.purple }) => (
  <svg className={className} viewBox="0 0 24 4" aria-hidden="true">
    <rect width="24" height="4" rx="2" fill={color} />
  </svg>
);

/* ===== Utilities ===== */
const titleize = (s:string) =>
  s.replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/\s+/g,' ')
   .trim().replace(/^./, m => m.toUpperCase());

const looksScale = (v:string) =>
  /(currently|offer|plan|eligible|not applicable|unsure|reactive)/i.test(v);

/* firmographic items we never show */
const hideKey = (k:string) => {
  const l = k.toLowerCase();
  return l === 's1' || l.includes('birth') || l.includes('age');
};

/* ===== Label resolver: prefer instrument text; fallback to titleized key ===== */
function labelForId(id: string): string {
  const item = INSTRUMENT_ITEMS[id];
  return item?.text?.trim() || titleize(id);
}

/* For objects whose keys aren’t item IDs, fallback to titleized key */
function labelForAnyKey(k: string): string {
  return labelForId(k) !== titleize(k) ? labelForId(k) : titleize(k);
}

/* ===== Data sources: how localStorage is organized in your app ===== */
const LS_KEYS = {
  firmo: 'firmographics_data',
  general: 'general-benefits_data',
  current: 'current-support_data',
  cross: 'cross-dimensional_data',
  impact: 'employee-impact_data',
  dim: (i:number) => `dimension${i}_data`,
};

/* ===== Section filters (from master map) ===== */
function itemsBySectionPrefix(prefix: string) {
  return Object.values(INSTRUMENT_ITEMS).filter(i => i.section?.toUpperCase().startsWith(prefix.toUpperCase()));
}
function itemsByRoute(route: string) {
  return Object.values(INSTRUMENT_ITEMS).filter(i => i.route === route);
}
function itemsForDimension(n:number) {
  return Object.values(INSTRUMENT_ITEMS).filter(i => i.section?.toUpperCase() === `D${n}`);
}

/* ===== Row (compact, 2-col) ===== */
function Row({
  label, value, accent=BRAND.purple,
}: { label: string; value: any; accent?: string }) {
  const display = value === undefined || value === null || value === '' ? '—'
                 : Array.isArray(value) ? value.join(', ')
                 : typeof value === 'object' ? null
                 : String(value);

  return (
    <div className="grid grid-cols-12 gap-3 py-2">
      <div className="col-span-5 md:col-span-4 lg:col-span-3 flex items-center">
        <Bar className="w-6 h-1 mr-2" color={accent} />
        <span className="text-[13px] font-semibold text-slate-700">{label}</span>
      </div>
      <div className="col-span-7 md:col-span-8 lg:col-span-9 text-[13px] text-slate-900">
        {display !== null ? (
          looksScale(display) ? (
            <span className="px-2.5 py-0.5 rounded-full border text-[12px] bg-purple-50 text-purple-800 border-purple-200">
              {display}
            </span>
          ) : (
            <span>{display}</span>
          )
        ) : (
          <div className="space-y-1">
            {Object.entries(value as Record<string,any>).map(([kk,vv])=>(
              <div key={kk} className="flex items-center justify-between gap-3 border-b last:border-b-0 border-slate-100 py-1">
                <span className="text-[12px] text-slate-600">{kk}</span>
                <span className="px-2 py-0.5 rounded-full border text-[12px] bg-purple-50 text-purple-800 border-purple-200">
                  {String(vv)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Section shell ===== */
function Section({
  title, children, accent=BRAND.purple, badge,
}: { title:string; children:React.ReactNode; accent?:string; badge?:string }) {
  return (
    <section className="border rounded-xl bg-white">
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: BRAND.gray200 }}>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {badge && (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white"
                style={{ borderColor: BRAND.gray300, color: BRAND.gray700 }}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ===== Main Page ===== */
export default function CompanyProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // raw section data as stored by app
  const [firmo, setFirmo] = useState<Record<string, any>>({});
  const [general, setGeneral] = useState<Record<string, any>>({});
  const [current, setCurrent] = useState<Record<string, any>>({});
  const [cross, setCross] = useState<Record<string, any>>({});
  const [impact, setImpact] = useState<Record<string, any>>({});
  const [dims, setDims] = useState<Array<{number:number; data:Record<string,any>}>>([]);
  const [companyName, setCompanyName] = useState<string>('Your Organization');
  const [accountEmail, setAccountEmail] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');

  useEffect(() => {
    const f = JSON.parse(localStorage.getItem(LS_KEYS.firmo) || '{}');
    const g = JSON.parse(localStorage.getItem(LS_KEYS.general) || '{}');
    const c = JSON.parse(localStorage.getItem(LS_KEYS.current) || '{}');
    const x = JSON.parse(localStorage.getItem(LS_KEYS.cross) || '{}');
    const e = JSON.parse(localStorage.getItem(LS_KEYS.impact) || '{}');

    const d: Array<{number:number; data:Record<string,any>}> = [];
    for (let i=1;i<=13;i++){
      const raw = JSON.parse(localStorage.getItem(LS_KEYS.dim(i)) || '{}');
      d.push({ number: i, data: raw || {} }); // include even if empty so all questions appear
    }

    setFirmo(f);
    setGeneral(g);
    setCurrent(c);
    setCross(x);
    setImpact(e);
    setDims(d);

    const email = localStorage.getItem('auth_email') || '';
    setAccountEmail(email);
    setCompanyName(f.companyName || f.s8 || 'Your Organization');
    setGeneratedAt(new Date().toLocaleDateString());
    setLoading(false);
  }, []);

  /* ===== Helpers to render EVERY question (answered or not) =====
     We take the master INSTRUMENT_ITEMS and, per section, list all items in order.
     For each item, we pull the answer from the matching data blob; if missing, show "—".
  */
  type SectionSpec = { title: string; accent: string; items: InstrumentItem[]; source: Record<string,any> };

  // Build Firmographics/Classification list
  const firmoItems = useMemo(()=>{
    const sItems = itemsBySectionPrefix('S');
    const classItems = itemsBySectionPrefix('CLASS');
    return [...sItems, ...classItems];
  },[]);

  const generalItems = useMemo(()=> itemsByRoute('/survey/general-benefits'), []);
  const currentItems = useMemo(()=> {
    // Accept both CS.* and OR* → route is /survey/current-support
    const cs = itemsByRoute('/survey/current-support');
    return cs;
  },[]);
  const crossItems = useMemo(()=> itemsByRoute('/survey/cross-dimensional-assessment'),[]);
  const impactItems = useMemo(()=> itemsByRoute('/survey/employee-impact-assessment'),[]);

  // Resolve value for an item id from a data blob; fallback to key search if needed.
  function valueFrom(source: Record<string,any>, item: InstrumentItem): any {
    // primary: keyed by id
    if (item.id in source) return source[item.id];
    // fallback: try a direct key (some pages store shorter keys)
    if (item.section in source) return source[item.section];
    // try a loose match on label text
    const text = (item.text || '').toLowerCase();
    const hit = Object.entries(source).find(([k]) => k.toLowerCase() === text || k.toLowerCase() === item.id.toLowerCase());
    if (hit) return hit[1];
    return undefined;
  }

  // Rows for a whole section (EVERY question appears, answered or not)
  function renderRows(items: InstrumentItem[], source: Record<string,any>, accent: string) {
    return (
      <div className="divide-y divide-slate-100">
        {items.map((it) => (
          <Row key={it.id} label={it.text || it.id} value={valueFrom(source, it)} accent={accent} />
        ))}
      </div>
    );
  }

  // HR POC (from firmographics; exclude age/birth)
  const hrPOC = useMemo(() => {
    const name = [firmo?.contactFirst, firmo?.contactLast].filter(Boolean).join(' ')
      || firmo?.contactName || firmo?.hr_name || '';
    const title = firmo?.contactTitle || firmo?.hr_title || firmo?.title || '';
    const department = firmo?.s3 || firmo?.department || '';
    const email = firmo?.contactEmail || firmo?.hr_email || accountEmail || '';
    const phone = firmo?.contactPhone || firmo?.hr_phone || firmo?.phone || '';
    const location = firmo?.hq || firmo?.s9 || '';
    return { name, title, department, email, phone, location };
  }, [firmo, accountEmail]);

  const printPDF = () => window.print();

  const downloadJSON = () => {
    const bundle = {
      meta: { companyName, accountEmail, generatedAt },
      firmographics: firmo, general, current, cross, impact, dimensions: dims,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url, download: `${companyName.replace(/\s+/g,'_')}_Company_Profile.json`,
    });
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadTXT = () => {
    let out = `COMPANY PROFILE — ${companyName}\nGenerated: ${new Date().toLocaleString()}\n\n`;
    const pushRows = (title:string, items:InstrumentItem[], source:Record<string,any>)=>{
      out += `${title}\n`;
      items.forEach(it=>{
        const v = valueFrom(source, it);
        const disp = v === undefined || v === null || v === '' ? '—'
                    : Array.isArray(v) ? v.join(', ')
                    : typeof v === 'object' ? JSON.stringify(v) : String(v);
        out += `  • ${it.text}: ${disp}\n`;
      });
      out += '\n';
    };
    pushRows('Company Profile (Firmographics & Classification)', firmoItems, firmo);
    pushRows('General Benefits', generalItems, general);
    pushRows('Current Support', currentItems, current);
    pushRows('Cross-Dimensional Assessment', crossItems, cross);
    pushRows('Employee Impact Assessment', impactItems, impact);
    dims.forEach(({number, data})=>{
      const dItems = itemsForDimension(number);
      out += `Dimension ${number}: ${DIM_NAME[number]}\n`;
      dItems.forEach(it=>{
        const v = valueFrom(data, it);
        const disp = v === undefined || v === null || v === '' ? '—'
                    : Array.isArray(v) ? v.join(', ')
                    : typeof v === 'object' ? JSON.stringify(v) : String(v);
        out += `  • ${it.text}: ${disp}\n`;
      });
      out += '\n';
    });
    const blob = new Blob([out], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url, download: `${companyName.replace(/\s+/g,'_')}_Company_Profile.txt`,
    });
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: BRAND.bg }}>
        <div className="text-slate-600 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BRAND.bg }}>
      {/* Header w/ your logos */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="w-28" />
            <div className="flex-1 flex justify-center">
              <img src="/best-companies-2026-logo.png" alt="Best Companies Award" className="h-14 sm:h-20 lg:h-24 w-auto drop-shadow-md" />
            </div>
            <div className="flex justify-end">
              <img src="/cancer-careers-logo.png" alt="Cancer and Careers" className="h-10 sm:h-14 lg:h-16 w-auto" />
            </div>
          </div>

          <div className="mt-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: BRAND.purple }}>
              {companyName}
            </h1>
            <p className="text-sm text-slate-600">Company Profile & Survey Summary</p>
            <p className="text-xs text-slate-500 mt-1">
              Generated: {generatedAt}{accountEmail ? ` • ${accountEmail}` : ''}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 print:hidden">
            <button onClick={()=>router.push('/dashboard')} className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50 text-slate-800">Back to Dashboard</button>
            <button onClick={printPDF} className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50 text-slate-800">Download PDF</button>
            <button onClick={downloadTXT} className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50 text-slate-800">Download .TXT</button>
            <button onClick={downloadJSON} className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50 text-slate-800">Download .JSON</button>
          </div>
        </div>
      </div>

      {/* Top stats + HRPOC */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Headquarters" value={firmo?.s9 || firmo?.hq || '—'} />
            <Stat label="Industry" value={firmo?.c2 || '—'} />
            <Stat label="Employee Size" value={firmo?.s8 || '—'} />
            <Stat label="Global Footprint" value={firmo?.s9a || '—'} />
          </div>
          <div className="border rounded-xl bg-white p-4">
            <div className="text-xs font-semibold text-slate-600 mb-2">HR Point of Contact</div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900">{([firmo?.contactFirst, firmo?.contactLast].filter(Boolean).join(' ') || firmo?.contactName || firmo?.hr_name || '—')}</div>
              <div className="text-sm text-slate-800">{firmo?.contactTitle || firmo?.hr_title || firmo?.title || '—'}</div>
              <div className="text-sm text-slate-800">{firmo?.s3 || firmo?.department || '—'}</div>
              <div className="text-sm text-slate-800">{firmo?.contactEmail || firmo?.hr_email || accountEmail || '—'}</div>
              <div className="text-sm text-slate-800">{firmo?.contactPhone || firmo?.hr_phone || firmo?.phone || '—'}</div>
              <div className="text-sm text-slate-800">{firmo?.hq || firmo?.s9 || '—'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-column: Firmo/Classification + General/Current/Cross/Impact */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Company Profile (Firmographics & Classification)" accent={BRAND.purple}>
            {renderRows(firmoItems, firmo, BRAND.purple)}
          </Section>

          <Section title="General Benefits" accent={BRAND.teal}>
            {renderRows(generalItems, general, BRAND.teal)}
          </Section>

          <Section title="Current Support" accent={BRAND.orange}>
            {renderRows(currentItems, current, BRAND.orange)}
          </Section>

          <Section title="Cross-Dimensional Assessment" accent={BRAND.teal}>
            {renderRows(crossItems, cross, BRAND.teal)}
          </Section>

          <Section title="Employee Impact Assessment" accent={BRAND.orange}>
            {renderRows(impactItems, impact, BRAND.orange)}
          </Section>
        </div>

        {/* Dimensions */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-base font-bold text-slate-900">13 Dimensions of Support</h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white"
                  style={{ borderColor: BRAND.gray300, color: BRAND.gray700 }}>
              D13 uses 5-point scale (includes Unsure/NA)
            </span>
          </div>

          <div className="space-y-5">
            {dims.map(({number, data}) => (
              <Section key={number} title={`Dimension ${number}: ${DIM_NAME[number] || ''}`} accent={BRAND.purple}>
                {renderRows(itemsForDimension(number), data, BRAND.purple)}
              </Section>
            ))}
          </div>
        </section>

        <footer className="text-center text-xs text-slate-600 mt-10 pb-10 border-t pt-4">
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
          All responses collected and analyzed by BEYOND Insights, LLC
        </footer>
      </main>

      {/* Print */}
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

/* ===== Stat tile ===== */
function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border rounded-xl px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{(value ?? '—') || '—'}</div>
    </div>
  );
}

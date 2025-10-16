'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  INSTRUMENT_ITEMS,
  type InstrumentItem,
  getItemsByRoute,
} from '../../data/instrument-items';

/* ===================== CAC Palette ===================== */
const BRAND = {
  purple: '#6B2C91',
  purpleDark: '#4F1F6A',
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

/* =============== Dimension Names (section titles) =============== */
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
  13:'Communication & Awareness', // D13 = 5-pt incl. Unsure/NA
};

/* ===================== Custom SVG (no emojis) ===================== */
const Bar = ({ className='', color=BRAND.purple }) => (
  <svg className={className} viewBox="0 0 24 4" aria-hidden="true">
    <rect width="24" height="4" rx="2" fill={color} />
  </svg>
);

/* ===================== Utilities ===================== */
const titleize = (s: string) =>
  s.replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/\s+/g,' ')
   .trim().replace(/^./, m => m.toUpperCase());

const looksScale = (v: string) =>
  /(currently|offer|plan|eligible|not applicable|unsure|reactive)/i.test(v);

/* firmographic items we never show */
const hideKey = (k:string) => {
  const l = k.toLowerCase();
  return l === 's1' || l.includes('birth') || l.includes('age');
};

/* Split items evenly for two-column layout */
function splitEven<T>(arr: T[]) {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
}

/* =============== Pull items by logical sections =============== */
function itemsFirmoAndClass(): InstrumentItem[] {
  const out: InstrumentItem[] = [];
  Object.values(INSTRUMENT_ITEMS).forEach(it => {
    const s = (it.section || '').toUpperCase();
    if (s.startsWith('S') || s.startsWith('CLASS')) out.push(it);
  });
  // stable sort by section+id
  return out.sort((a,b)=> (a.section+a.id).localeCompare(b.section+b.id));
}
function itemsForDimension(n:number): InstrumentItem[] {
  return Object.values(INSTRUMENT_ITEMS)
    .filter(i => (i.section || '').toUpperCase() === `D${n}`)
    .sort((a,b)=> (a.id).localeCompare(b.id));
}

/* ===================== Compact Row ===================== */
function Row({
  label, value, accent=BRAND.purple,
}: { label: string; value: any; accent?: string }) {
  const display =
    value === undefined || value === null || value === '' ? '—'
    : Array.isArray(value) ? value.join(', ')
    : typeof value === 'object' ? null
    : String(value);

  return (
    <div className="grid grid-cols-12 items-start gap-3 py-1.5">
      <div className="col-span-5 md:col-span-4 lg:col-span-5 flex items-center min-w-0">
        <Bar className="w-5 h-1 mr-2 shrink-0" color={accent} />
        <span className="text-[13px] font-semibold text-slate-700 truncate">{label}</span>
      </div>
      <div className="col-span-7 md:col-span-8 lg:col-span-7 text-[13px] text-slate-900 min-w-0">
        {display !== null ? (
          looksScale(display) ? (
            <span className="px-2.5 py-0.5 rounded-full border text-[12px] bg-purple-50 text-purple-800 border-purple-200 break-words">
              {display}
            </span>
          ) : (
            <span className="break-words">{display}</span>
          )
        ) : (
          <div className="space-y-1">
            {Object.entries(value as Record<string, any>).map(([k, vv]) =>
              vv ? (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-slate-600 truncate">{k}</span>
                  <span className="px-2 py-0.5 rounded-full border text-[12px] bg-purple-50 text-purple-800 border-purple-200">
                    {String(vv)}
                  </span>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== Section Shell ===================== */
function Section({
  title, children, badge,
}: { title: string; children: React.ReactNode; badge?: string }) {
  return (
    <section className="rounded-xl border bg-white">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {badge && (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white text-slate-700">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">
        {/* two-column on lg, one-column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
          {children}
        </div>
      </div>
    </section>
  );
}

/* ===================== Page ===================== */
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

  /* Load everything */
  useEffect(() => {
    const f = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const g = JSON.parse(localStorage.getItem('general-benefits_data') || '{}');
    const c = JSON.parse(localStorage.getItem('current-support_data') || '{}');
    const x = JSON.parse(localStorage.getItem('cross-dimensional_data') || '{}');
    const e = JSON.parse(localStorage.getItem('employee-impact_data') || '{}');

    const d: Array<{number:number; data:Record<string,any>}> = [];
    for (let i=1;i<=13;i++){
      const raw = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      // include all dims so ALL questions appear, even if unanswered
      d.push({ number:i, data: raw || {} });
    }

    setFirmo(f); setGeneral(g); setCurrent(c); setCross(x); setImpact(e); setDims(d);

    const email = localStorage.getItem('auth_email') || '';
    setAccountEmail(email);
    setCompanyName(f.companyName || f.s8 || 'Your Organization');
    setGeneratedAt(new Date().toLocaleDateString());
    setLoading(false);
  }, []);

  /* ---------- Master label lookup: always use instrument text ---------- */
  function labelForItem(it: InstrumentItem) {
    return it?.text?.trim() || titleize(it?.id || '');
  }

  /* Resolve a value for an item from a given source object */
  function valueFrom(source: Record<string, any>, item: InstrumentItem): any {
    // try by id
    if (item.id in source) return source[item.id];
    // try exact text key
    const t = (item.text || '').toLowerCase();
    const byText = Object.entries(source).find(([k]) => k.toLowerCase() === t);
    if (byText) return byText[1];
    // try simple id fallback (some pages store short ids)
    const alt = Object.entries(source).find(([k]) => k.toLowerCase() === item.id.toLowerCase());
    if (alt) return alt[1];
    // not found
    return '';
  }

  /* ---------- Build item lists from master map (EVERY question) ---------- */
  const firmoItems = useMemo(() => itemsFirmoAndClass()
    .filter(it => !hideKey(it.id)), []);

  const generalItems = useMemo(
    () => getItemsByRoute('/survey/general-benefits').sort((a,b)=>a.id.localeCompare(b.id)),
    []
  );
  const currentItems = useMemo(
    () => getItemsByRoute('/survey/current-support').sort((a,b)=>a.id.localeCompare(b.id)),
    []
  );
  const crossItems = useMemo(
    () => getItemsByRoute('/survey/cross-dimensional-assessment').sort((a,b)=>a.id.localeCompare(b.id)),
    []
  );
  const impactItems = useMemo(
    () => getItemsByRoute('/survey/employee-impact-assessment').sort((a,b)=>a.id.localeCompare(b.id)),
    []
  );

  /* ---------- Split lists for two-column render ---------- */
  const [firmoL, firmoR]     = useMemo(()=>splitEven(firmoItems),       [firmoItems]);
  const [generalL, generalR] = useMemo(()=>splitEven(generalItems),     [generalItems]);
  const [currentL, currentR] = useMemo(()=>splitEven(currentItems),     [currentItems]);
  const [crossL, crossR]     = useMemo(()=>splitEven(crossItems),       [crossItems]);
  const [impactL, impactR]   = useMemo(()=>splitEven(impactItems),      [impactItems]);

  /* ---------- HR POC (collect everything except age/birth) ---------- */
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

  /* ---------- Actions ---------- */
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
        out += `  • ${labelForItem(it)}: ${disp}\n`;
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
        out += `  • ${labelForItem(it)}: ${disp}\n`;
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
    <div className="min-h-screen bg-[rgb(249,250,251)]">
      {/* ===== Header with your logos ===== */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="w-28" />
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

      {/* ===== Top Stats + HR POC ===== */}
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
              <div className="text-sm font-semibold text-slate-900">{hrPOC.name || '—'}</div>
              <div className="text-sm text-slate-800">{hrPOC.title || '—'}</div>
              <div className="text-sm text-slate-800">{hrPOC.department || '—'}</div>
              <div className="text-sm text-slate-800">{hrPOC.email || '—'}</div>
              <div className="text-sm text-slate-800">{hrPOC.phone || '—'}</div>
              <div className="text-sm text-slate-800">{hrPOC.location || '—'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Two-column sections (EVERY question + response) ===== */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Company Profile (Firmographics & Classification)">
            <div className="divide-y divide-slate-100">
              {firmoL.map(it => (
                <Row key={it.id} label={labelForItem(it)} value={valueFrom(firmo, it)} accent={BRAND.purple} />
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {firmoR.map(it => (
                <Row key={it.id} label={labelForItem(it)} value={valueFrom(firmo, it)} accent={BRAND.purple} />
              ))}
            </div>
          </Section>

          <Section title="General Benefits">
            <div className="divide-y divide-slate-100">
              {generalL.map(it => (
                <Row key={it.id} label={labelForItem(it)} value={valueFrom(general, it)} accent={BRAND.teal} />
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {generalR.map(it => (
                <Row key={it.id} label={labelForItem(it)} value={valueFrom(general, it)} accent={BRAND.teal} />
              ))}
            </div>
          </Section>

          <Section title="Current Support">
            <div className="divide-y divide-slate-100">
              {currentL.map(it => (
                <Row key={it.id} label={labelForItem(it)} value={valueFrom(current, it)} accent={BRAND.orange} />
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {currentR.map(it => (
                <Row key={it.id} label={labelForItem(it)} value={valueFrom(current, it)} accent={BRAND.orange} />
              ))}
            </div>
          </Section>

          <Section title="Cross-Dimensional Assessment">
            <div className="divide-y divide-slate-100">
              {crossL.map(it => (
                <Row key={it.id} label={labelForItem(it)} value={valueFrom(cross, it)} accent={BRAND.teal} />
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {crossR.map(it => (
                <Row key={it.id} label={labelForItem(it)} value={valueFrom(cross, it)} accent={BRAND.teal} />
              ))}
            </div>
          </Section>

          <Section title="Employee Impact Assessment">
            <div className="divide-y divide-slate-100">
              {impactL.map(it => (
                <Row key={it.id} label={labelForItem(it)} value={valueFrom(impact, it)} accent={BRAND.orange} />
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {impactR.map(it => (
                <Row key={it.id} label={labelForItem(it)} value={valueFrom(impact, it)} accent={BRAND.orange} />
              ))}
            </div>
          </Section>
        </div>

        {/* ===== 13 Dimensions ===== */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-base font-bold text-slate-900">13 Dimensions of Support</h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white">
              D13 uses 5-point scale (includes Unsure/NA)
            </span>
          </div>

          <div className="space-y-5">
            {dims.map(({number, data}) => {
              const dItems = itemsForDimension(number);
              const [dL, dR] = splitEven(dItems);
              return (
                <Section
                  key={number}
                  title={`Dimension ${number}: ${DIM_NAME[number] || ''}`}
                >
                  <div className="divide-y divide-slate-100">
                    {dL.map(it => (
                      <Row key={it.id} label={labelForItem(it)} value={valueFrom(data, it)} accent={BRAND.purple} />
                    ))}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {dR.map(it => (
                      <Row key={it.id} label={labelForItem(it)} value={valueFrom(data, it)} accent={BRAND.purple} />
                    ))}
                  </div>
                </Section>
              );
            })}
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer className="text-center text-xs text-slate-600 mt-10 pb-10 border-t pt-4">
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
          All responses collected and analyzed by BEYOND Insights, LLC
        </footer>
      </main>

      {/* ===== Print CSS ===== */}
      <style jsx>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, section { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

/* ===================== Stat tile ===================== */
function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border rounded-xl px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{(value ?? '—') || '—'}</div>
    </div>
  );
}

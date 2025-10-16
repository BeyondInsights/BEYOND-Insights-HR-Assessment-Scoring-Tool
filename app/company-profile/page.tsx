'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  INSTRUMENT_ITEMS,
  type InstrumentItem,
  getItemsByRoute,
} from '../../data/instrument-items'; // master map

/* ================== CAC Brand Colors ================== */
const COLORS = {
  purple: { primary: '#6B2C91', light: '#8B4DB3', bg: '#F5EDFF', border: '#D4B5E8' },
  teal:   { primary: '#00A896', light: '#33BDAD', bg: '#E6F9F7', border: '#99E6DD' },
  orange: { primary: '#FF6B35', light: '#FF8C65', bg: '#FFF0EC', border: '#FFD4C4' },
  gray:   { dark: '#2D3748', medium: '#4A5568', light: '#CBD5E0', bg: '#F7FAFC' }
};

/* ============== Dimension Names (for section titles) ============== */
const DIM_NAMES: Record<number,string> = {
  1:'Medical Leave & Flexibility', 2:'Insurance & Financial Protection', 3:'Manager Preparedness & Capability',
  4:'Navigation & Expert Resources', 5:'Workplace Accommodations', 6:'Culture & Psychological Safety',
  7:'Career Continuity & Advancement', 8:'Work Continuation & Resumption', 9:'Executive Commitment & Resources',
  10:'Caregiver & Family Support', 11:'Prevention, Wellness & Legal Compliance', 12:'Continuous Improvement & Outcomes',
  13:'Communication & Awareness' // D13 = 5-pt incl. Unsure/NA
};

/* ================== Small custom SVG (no emojis) ================== */
const AccentBar = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 4" className="w-6 h-1"><rect width="24" height="4" rx="2" fill={color}/></svg>
);

/* ================== Utilities ================== */
const looksScale = (v:string) =>
  /(currently|offer|plan|eligible|not applicable|unsure|reactive)/i.test(v);

const hideFirmoKey = (k:string) => {
  const l = k.toLowerCase();
  return l === 's1' || l.includes('birth') || l.includes('age');
};

function splitEven<T>(arr: T[]) {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
}

function itemsFirmoAndClass(): InstrumentItem[] {
  const out: InstrumentItem[] = [];
  Object.values(INSTRUMENT_ITEMS).forEach(it => {
    const s = (it.section || '').toUpperCase();
    if (s.startsWith('S') || s.startsWith('CLASS')) out.push(it);
  });
  return out.sort((a,b)=> (a.section+a.id).localeCompare(b.section+b.id));
}

function itemsForDimension(n:number): InstrumentItem[] {
  return Object.values(INSTRUMENT_ITEMS)
    .filter(i => (i.section || '').toUpperCase() === `D${n}`)
    .sort((a,b)=> a.id.localeCompare(b.id));
}

/* ================== Section Shell (matches attached style) ================== */
function Section({
  title, tone, children, badge,
}: {
  title: string;
  tone: typeof COLORS.purple;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="mb-6 rounded-xl border-2 overflow-hidden" style={{borderColor: tone.border}}>
      <div className="px-6 py-3 flex items-center justify-between" style={{backgroundColor: tone.primary}}>
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
        {badge && (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white"
                style={{ borderColor: '#E5E7EB', color: '#334155' }}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-6 bg-white">
        {/* two-column on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ================== Tight Row (label:left + ":" , value right) ================== */
function DataRow({
  label, value, color,
}: {
  label: string;
  value: any;
  color: string;
}) {
  const display =
    value === undefined || value === null || value === '' ? '—'
    : Array.isArray(value) ? value.join(', ')
    : typeof value === 'object' ? null
    : String(value);

  return (
    <div className="py-1.5 border-b last:border-b-0 flex items-start gap-3" style={{borderColor: COLORS.gray.light}}>
      <div className="shrink-0 flex items-center min-w-[10rem]">
        <AccentBar color={color} />
        <span className="ml-2 text-sm font-semibold" style={{color: COLORS.gray.medium}}>
          {label}:
        </span>
      </div>
      <div className="text-sm text-right grow" style={{color: COLORS.gray.dark}}>
        {display !== null ? (
          looksScale(display) ? (
            <span className="px-2.5 py-0.5 rounded-full border text-[12px]"
                  style={{ backgroundColor: COLORS.purple.bg, color: COLORS.purple.primary, borderColor: COLORS.purple.border }}>
              {display}
            </span>
          ) : (
            <span className="break-words">{display}</span>
          )
        ) : (
          <div className="space-y-1">
            {Object.entries(value as Record<string, any>).map(([k, vv]) => (
              vv ? (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-[12px]" style={{color: COLORS.gray.medium}}>{k}</span>
                  <span className="px-2 py-0.5 rounded-full border text-[12px]"
                        style={{ backgroundColor: COLORS.purple.bg, color: COLORS.purple.primary, borderColor: COLORS.purple.border }}>
                    {String(vv)}
                  </span>
                </div>
              ) : null
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================== Page ================== */
export default function CompanyProfile() {
  const router = useRouter();

  const [firmo, setFirmo]     = useState<Record<string, any>>({});
  const [general, setGeneral] = useState<Record<string, any>>({});
  const [current, setCurrent] = useState<Record<string, any>>({});
  const [cross, setCross]     = useState<Record<string, any>>({});
  const [impact, setImpact]   = useState<Record<string, any>>({});
  const [dims, setDims]       = useState<Array<{number:number; data:Record<string,any>}>>([]);

  const [companyName, setCompanyName]   = useState<string>('Your Organization');
  const [accountEmail, setAccountEmail] = useState<string>('');
  const [generatedAt, setGeneratedAt]   = useState<string>('');
  const [loading, setLoading]           = useState(true);

  /* Load everything from localStorage (NO MOCKS) */
  useEffect(()=>{
    const f = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const g = JSON.parse(localStorage.getItem('general-benefits_data') || '{}');
    const c = JSON.parse(localStorage.getItem('current-support_data') || '{}');
    const x = JSON.parse(localStorage.getItem('cross-dimensional_data') || '{}');
    const e = JSON.parse(localStorage.getItem('employee-impact_data') || '{}');

    const d: Array<{number:number; data:Record<string,any>}> = [];
    for (let i=1;i<=13;i++){
      const raw = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      d.push({ number:i, data: raw || {} }); // include all dims (so all questions appear)
    }

    setFirmo(f); setGeneral(g); setCurrent(c); setCross(x); setImpact(e); setDims(d);

    const email = localStorage.getItem('auth_email') || '';
    setAccountEmail(email);
    setCompanyName(f.companyName || f.s8 || 'Your Organization');
    setGeneratedAt(new Date().toLocaleDateString());
    setLoading(false);
  },[]);

  /* ---------- Build the “every question” lists from master map ---------- */
  const firmoItems   = useMemo(()=> itemsFirmoAndClass().filter(it => !hideFirmoKey(it.id)), []);
  const generalItems = useMemo(()=> getItemsByRoute('/survey/general-benefits').sort((a,b)=>a.id.localeCompare(b.id)), []);
  const currentItems = useMemo(()=> getItemsByRoute('/survey/current-support').sort((a,b)=>a.id.localeCompare(b.id)), []);
  const crossItems   = useMemo(()=> getItemsByRoute('/survey/cross-dimensional-assessment').sort((a,b)=>a.id.localeCompare(b.id)), []);
  const impactItems  = useMemo(()=> getItemsByRoute('/survey/employee-impact-assessment').sort((a,b)=>a.id.localeCompare(b.id)), []);

  const [firmoL, firmoR]     = useMemo(()=> splitEven(firmoItems),   [firmoItems]);
  const [generalL, generalR] = useMemo(()=> splitEven(generalItems), [generalItems]);
  const [currentL, currentR] = useMemo(()=> splitEven(currentItems), [currentItems]);
  const [crossL, crossR]     = useMemo(()=> splitEven(crossItems),   [crossItems]);
  const [impactL, impactR]   = useMemo(()=> splitEven(impactItems),  [impactItems]);

  function valueFrom(source: Record<string,any>, it: InstrumentItem): any {
    if (it.id in source) return source[it.id];
    const t = (it.text || '').toLowerCase();
    const hit = Object.entries(source).find(([k]) => k.toLowerCase() === t || k.toLowerCase() === it.id.toLowerCase());
    return hit ? hit[1] : '';
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{backgroundColor: COLORS.gray.bg}}>
        <div className="text-sm" style={{color: COLORS.gray.medium}}>Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: COLORS.gray.bg}}>
      {/* ===== Header with your logos (center award, right CAC) ===== */}
      <div className="bg-white border-b" style={{borderColor: COLORS.gray.light}}>
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
              <img
                src="/cancer-careers-logo.png"
                alt="Cancer and Careers Logo"
                className="h-10 sm:h-14 lg:h-16 w-auto"
              />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-black mb-1" style={{color: COLORS.purple.primary}}>
              {companyName}
            </h1>
            <p className="text-base" style={{color: COLORS.gray.medium}}>Company Profile & Survey Summary</p>
            <p className="text-sm mt-1" style={{color: COLORS.gray.medium}}>
              Generated: {generatedAt}{accountEmail ? ` • ${accountEmail}` : ''}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
              <button onClick={()=>router.push('/dashboard')} className="px-3 py-1.5 text-sm font-semibold border rounded" style={{borderColor: COLORS.gray.light, color: COLORS.gray.dark}}>
                Back to Dashboard
              </button>
              <button onClick={()=>window.print()} className="px-3 py-1.5 text-sm font-semibold rounded text-white" style={{backgroundColor: COLORS.purple.primary}}>
                Print PDF
              </button>
              <button
                onClick={()=>{
                  const blob = new Blob([JSON.stringify({ firmographics: firmo, general, current, cross, impact, dimensions: dims }, null, 2)], {type:'application/json'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `${companyName.replace(/\s+/g,'_')}_Profile.json`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 text-sm font-semibold border rounded"
                style={{borderColor: COLORS.gray.light, color: COLORS.gray.dark}}
              >
                Download JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Top Stats + HR POC ===== */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Tile label="Headquarters" value={firmo?.s9 || firmo?.hq || '—'} />
            <Tile label="Industry" value={firmo?.c2 || '—'} />
            <Tile label="Employee Size" value={firmo?.s8 || '—'} />
            <Tile label="Global Footprint" value={firmo?.s9a || '—'} />
          </div>
          <div className="border rounded-xl bg-white p-4" style={{borderColor: COLORS.gray.light}}>
            <div className="text-xs font-semibold mb-2" style={{color: COLORS.gray.medium}}>HR Point of Contact</div>
            <div className="space-y-1">
              <div className="text-sm font-semibold" style={{color: COLORS.gray.dark}}>
                {([firmo?.contactFirst, firmo?.contactLast].filter(Boolean).join(' ') || firmo?.contactName || firmo?.hr_name || '—')}
              </div>
              <div className="text-sm" style={{color: COLORS.gray.dark}}>{firmo?.contactTitle || firmo?.hr_title || firmo?.title || '—'}</div>
              <div className="text-sm" style={{color: COLORS.gray.dark}}>{firmo?.s3 || firmo?.department || '—'}</div>
              <div className="text-sm" style={{color: COLORS.gray.dark}}>{firmo?.contactEmail || firmo?.hr_email || accountEmail || '—'}</div>
              <div className="text-sm" style={{color: COLORS.gray.dark}}>{firmo?.contactPhone || firmo?.hr_phone || firmo?.phone || '—'}</div>
              <div className="text-sm" style={{color: COLORS.gray.dark}}>{firmo?.hq || firmo?.s9 || '—'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Company Profile / General / Current / Cross / Impact ===== */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* Company Profile (Firmographics & Classification) */}
        <Section title="Company Profile (Firmographics & Classification)" tone={COLORS.purple}>
          <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
            {firmoL.map(it=>(
              <DataRow key={it.id} label={it.text} value={valueFrom(firmo, it)} color={COLORS.purple.primary}/>
            ))}
          </div>
          <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
            {firmoR.map(it=>(
              <DataRow key={it.id} label={it.text} value={valueFrom(firmo, it)} color={COLORS.purple.primary}/>
            ))}
          </div>
        </Section>

        {/* General Benefits */}
        <Section title="General Employee Benefits" tone={COLORS.teal}>
          <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
            {generalL.map(it=>(
              <DataRow key={it.id} label={it.text} value={valueFrom(general, it)} color={COLORS.teal.primary}/>
            ))}
          </div>
          <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
            {generalR.map(it=>(
              <DataRow key={it.id} label={it.text} value={valueFrom(general, it)} color={COLORS.teal.primary}/>
            ))}
          </div>
        </Section>

        {/* Current Support */}
        <Section title="Current Support for Employees Managing Cancer" tone={COLORS.orange}>
          <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
            {currentL.map(it=>(
              <DataRow key={it.id} label={it.text} value={valueFrom(current, it)} color={COLORS.orange.primary}/>
            ))}
          </div>
          <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
            {currentR.map(it=>(
              <DataRow key={it.id} label={it.text} value={valueFrom(current, it)} color={COLORS.orange.primary}/>
            ))}
          </div>
        </Section>

        {/* Cross-Dimensional */}
        <Section title="Cross-Dimensional Assessment" tone={COLORS.purple}>
          <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
            {crossL.map(it=>(
              <DataRow key={it.id} label={it.text} value={valueFrom(cross, it)} color={COLORS.purple.primary}/>
            ))}
          </div>
          <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
            {crossR.map(it=>(
              <DataRow key={it.id} label={it.text} value={valueFrom(cross, it)} color={COLORS.purple.primary}/>
            ))}
          </div>
        </Section>

        {/* Employee Impact */}
        <Section title="Employee Impact Assessment" tone={COLORS.orange}>
          <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
            {impactL.map(it=>(
              <DataRow key={it.id} label={it.text} value={valueFrom(impact, it)} color={COLORS.orange.primary}/>
            ))}
          </div>
          <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
            {impactR.map(it=>(
              <DataRow key={it.id} label={it.text} value={valueFrom(impact, it)} color={COLORS.orange.primary}/>
            ))}
          </div>
        </Section>

        {/* 13 Dimensions */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold" style={{color: COLORS.gray.dark}}>13 Dimensions of Support</h2>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white"
                style={{ borderColor: COLORS.gray.light, color: COLORS.gray.medium }}>
            D13 uses 5-point scale (includes Unsure/NA)
          </span>
        </div>

        {dims.map(({number, data})=>{
          const dItems = itemsForDimension(number);
          const [dL, dR] = splitEven(dItems);
          return (
            <Section
              key={number}
              title={`Dimension ${number}: ${DIM_NAMES[number]}`}
              tone={COLORS.purple}
              badge={number===13 ? '5-point scale' : undefined}
            >
              <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
                {dL.map(it=>(
                  <DataRow key={it.id} label={it.text} value={valueFrom(data, it)} color={COLORS.purple.primary}/>
                ))}
              </div>
              <div className="divide-y" style={{borderColor: COLORS.gray.light}}>
                {dR.map(it=>(
                  <DataRow key={it.id} label={it.text} value={valueFrom(data, it)} color={COLORS.purple.primary}/>
                ))}
              </div>
            </Section>
          );
        })}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center text-xs"
             style={{borderColor: COLORS.gray.light, color: COLORS.gray.medium}}>
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
          All responses collected and analyzed by BEYOND Insights, LLC
        </div>
      </main>

      {/* Print CSS */}
      <style jsx>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          section { break-inside: avoid; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ================== Small Stat Tile ================== */
function Tile({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border rounded-xl px-3 py-2" style={{borderColor: COLORS.gray.light}}>
      <div className="text-[11px]" style={{color: COLORS.gray.medium}}>{label}</div>
      <div className="text-sm font-semibold" style={{color: COLORS.gray.dark}}>{(value ?? '—') || '—'}</div>
    </div>
  );
}

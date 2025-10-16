'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  INSTRUMENT_ITEMS,
  type InstrumentItem,
  getItemsByRoute,
} from '../../data/instrument-items';
import { SHORT_LABELS } from '../../data/descriptor-map';

/* ===================== CAC Palette ===================== */
const COLORS = {
  purple: { primary: '#6B2C91', bg: '#F5EDFF', border: '#D4B5E8' },
  teal:   { primary: '#14B8A6', bg: '#E6F9F7', border: '#99E6DD' },
  orange: { primary: '#F97316', bg: '#FFF0EC', border: '#FFD4C4' },
  gray:   { 900: '#0F172A', 700: '#334155', 600: '#475569', 300: '#CBD5E1', 200: '#E5E7EB', bg: '#F9FAFB' },
};

/* =============== Dimension Names (titles only) =============== */
const DIM_NAME: Record<number, string> = {
  1:'Medical Leave & Flexibility',
  2:'Insurance & Financial Protection',
  3:'Manager Preparedness & Capability',
  4:'Navigation & Expert Resources',
  5:'Workplace Accommodations & Modifications',
  6:'Culture & Psychological Safety',
  7:'Career Continuity & Advancement',
  8:'Work Continuation & Resumption',
  9:'Executive Commitment & Resources',
  10:'Caregiver & Family Support',
  11:'Prevention, Wellness & Legal Compliance',
  12:'Continuous Improvement & Outcomes',
  13:'Communication & Awareness', // D13 is 5-pt incl. Unsure/NA
};

/* ===================== Inline SVG (no emojis) ===================== */
const AccentBar = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 4" className="w-6 h-1"><rect width="24" height="4" rx="2" fill={color}/></svg>
);

/* ===================== Helpers ===================== */
const hideFirmoKey = (k: string) => {
  const l = k.toLowerCase();
  return l === 's1' || l.includes('birth') || l.includes('age'); // never show age/birth
};
const looksScale = (v: string) => /(currently|offer|plan|eligible|not applicable|unsure|reactive)/i.test(v);

function splitEven<T>(arr: T[]) { const m = Math.ceil(arr.length / 2); return [arr.slice(0, m), arr.slice(m)]; }

function itemsFirmoClass(): InstrumentItem[] {
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

/* Short descriptor: explicit map → auto-shorten question → id */
function autoShorten(text: string): string {
  if (!text) return '';
  let s = text
    .replace(/\[[^\]]*\]/g, '')       // remove [ASK IF], etc
    .replace(/\([^)]*\)/g, '')        // remove (notes)
    .split(/[?•:\n]/)[0].trim();      // first clause
  s = s
    .replace(/^please (indicate|select)\s+/i, '')
    .replace(/^does your (company|organization)\s+/i, '')
    .replace(/^what is your (company|organization)[’']?s?\s+/i, '')
    .replace(/^to what extent\s+/i, '')
    .replace(/^how (well|much|often)\s+/i, '')
    .replace(/\s+status$/i, '')
    .replace(/\s+availability$/i, '');
  s = s
    .replace(/\bshort[-\s]?term disability\b/i, 'STD')
    .replace(/\blong[-\s]?term disability\b/i, 'LTD')
    .replace(/\bemployee assistance program\b/i, 'EAP')
    .replace(/\bclinical trials?\b/i, 'Clinical Trials');
  const words = s.split(/\s+/);
  if (words.length > 8) s = words.slice(0, 8).join(' ');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
function descriptorFor(it: InstrumentItem): string {
  if (SHORT_LABELS[it.id]) return SHORT_LABELS[it.id];
  if (it.text) return autoShorten(it.text);
  return it.id;
}

/* ===================== Tight Row ===================== */
function DataRow({ label, value, color }: { label: string; value: any; color: string }) {
  const display =
    value === undefined || value === null || value === '' ? '—'
    : Array.isArray(value) ? value.join(', ')
    : typeof value === 'object' ? null
    : String(value);

  return (
    <div className="py-1.5 border-b last:border-b-0 flex items-start gap-3" style={{ borderColor: COLORS.gray[200] }}>
      <div className="shrink-0 flex items-center min-w-[12rem]">
        <AccentBar color={color} />
        <span className="ml-2 text-sm font-semibold" style={{ color: COLORS.gray[600] }}>
          {label}:
        </span>
      </div>
      <div className="text-sm text-right grow" style={{ color: COLORS.gray[900] }}>
        {display !== null ? (
          looksScale(display)
            ? <span className="px-2.5 py-0.5 rounded-full border text-[12px]" style={{ backgroundColor: COLORS.purple.bg, color: COLORS.purple.primary, borderColor: COLORS.purple.border }}>{display}</span>
            : <span className="break-words">{display}</span>
        ) : (
          <div className="space-y-1">
            {Object.entries(value as Record<string, any>).map(([k, vv]) =>
              vv ? (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-[12px]" style={{ color: COLORS.gray[600] }}>{k}</span>
                  <span className="px-2 py-0.5 rounded-full border text-[12px]" style={{ backgroundColor: COLORS.purple.bg, color: COLORS.purple.primary, borderColor: COLORS.purple.border }}>
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
  title, tone, children, badge,
}: {
  title: string;
  tone: { primary: string; bg: string; border: string };
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="mb-6 rounded-xl border-2 overflow-hidden" style={{ borderColor: tone.border }}>
      <div className="px-6 py-3 flex items-center justify-between" style={{ backgroundColor: tone.primary }}>
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
        {badge && (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white" style={{ borderColor: COLORS.gray[200], color: COLORS.gray[700] }}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-6 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ===================== Page ===================== */
export default function CompanyProfile() {
  const router = useRouter();

  const [firmo, setFirmo]     = useState<Record<string, any>>({});
  const [general, setGeneral] = useState<Record<string, any>>({});
  const [current, setCurrent] = useState<Record<string, any>>({});
  const [cross, setCross]     = useState<Record<string, any>>({});
  const [impact, setImpact]   = useState<Record<string, any>>({});
  const [dims, setDims]       = useState<Array<{ number: number; data: Record<string, any> }>>([]);

  const [companyName, setCompanyName]   = useState<string>('Your Organization');
  const [accountEmail, setAccountEmail] = useState<string>('');
  const [generatedAt, setGeneratedAt]   = useState<string>('');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const f = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const g = JSON.parse(localStorage.getItem('general-benefits_data') || '{}');
    const c = JSON.parse(localStorage.getItem('current-support_data') || '{}');
    const x = JSON.parse(localStorage.getItem('cross-dimensional_data') || '{}');
    const e = JSON.parse(localStorage.getItem('employee-impact_data') || '{}');

    const d: Array<{ number: number; data: Record<string, any> }> = [];
    for (let i = 1; i <= 13; i++) {
      const raw = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      d.push({ number: i, data: raw || {} }); // include all dims (show every question even if unanswered)
    }

    setFirmo(f); setGeneral(g); setCurrent(c); setCross(x); setImpact(e); setDims(d);

    const email = localStorage.getItem('auth_email') || '';
    setAccountEmail(email);
    setCompanyName(f.companyName || f.s8 || 'Your Organization');
    setGeneratedAt(new Date().toLocaleDateString());
    setLoading(false);
  }, []);

  // Section item lists (from instrument — ensures EVERY question appears)
  const firmoItems   = useMemo(() => itemsFirmoClass().filter(it => !hideFirmoKey(it.id)), []);
  const generalItems = useMemo(() => getItemsByRoute('/survey/general-benefits').sort((a,b)=>a.id.localeCompare(b.id)), []);
  const currentItems = useMemo(() => getItemsByRoute('/survey/current-support').sort((a,b)=>a.id.localeCompare(b.id)), []);
  const crossItems   = useMemo(() => getItemsByRoute('/survey/cross-dimensional-assessment').sort((a,b)=>a.id.localeCompare(b.id)), []);
  const impactItems  = useMemo(() => getItemsByRoute('/survey/employee-impact-assessment').sort((a,b)=>a.id.localeCompare(b.id)), []);

  const [firmoL, firmoR]     = useMemo(()=> splitEven(firmoItems),   [firmoItems]);
  const [generalL, generalR] = useMemo(()=> splitEven(generalItems), [generalItems]);
  const [currentL, currentR] = useMemo(()=> splitEven(currentItems), [currentItems]);
  const [crossL, crossR]     = useMemo(()=> splitEven(crossItems),   [crossItems]);
  const [impactL, impactR]   = useMemo(()=> splitEven(impactItems),  [impactItems]);

  function valueFrom(source: Record<string, any>, it: InstrumentItem): any {
    if (it.id in source) return source[it.id];
    const t = (it.text || '').toLowerCase();
    const hit = Object.entries(source).find(([k]) => k.toLowerCase() === t || k.toLowerCase() === it.id.toLowerCase());
    return hit ? hit[1] : '';
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: COLORS.gray.bg }}>
        <div className="text-sm" style={{ color: COLORS.gray[600] }}>Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.gray.bg }}>
      {/* Header with your logos */}
      <div className="bg-white border-b" style={{ borderColor: COLORS.gray[200] }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-28" />
            <div className="flex-1 flex justify-center">
              <img src="/best-companies-2026-logo.png" alt="Best Companies for Working with Cancer Award Logo" className="h-16 sm:h-20 lg:h-24 w-auto drop-shadow-md" />
            </div>
            <div className="flex justify-end">
              <img src="/cancer-careers-logo.png" alt="Cancer and Careers Logo" className="h-10 sm:h-14 lg:h-16 w-auto" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-black mb-1" style={{ color: COLORS.purple.primary }}>{companyName}</h1>
            <p className="text-base" style={{ color: COLORS.gray[600] }}>Company Profile & Survey Summary</p>
            <p className="text-sm mt-1" style={{ color: COLORS.gray[600] }}>
              Generated: {generatedAt}{accountEmail ? ` • ${accountEmail}` : ''}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
              <button onClick={()=>router.push('/dashboard')} className="px-3 py-1.5 text-sm font-semibold border rounded" style={{ borderColor: COLORS.gray[200], color: COLORS.gray[900] }}>
                Back to Dashboard
              </button>
              <button onClick={()=>window.print()} className="px-3 py-1.5 text-sm font-semibold rounded text-white" style={{ backgroundColor: COLORS.purple.primary }}>
                Print PDF
              </button>
              <button
                onClick={()=>{
                  const blob = new Blob([JSON.stringify({ firmographics: firmo, general, current, cross, impact, dimensions: dims }, null, 2)], {type:'application/json'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `${companyName.replace(/\s+/g,'_')}_Profile.json`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 text-sm font-semibold border rounded"
                style={{ borderColor: COLORS.gray[200], color: COLORS.gray[900] }}
              >
                Download JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Stats + HR POC */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Tile label="Headquarters"    value={firmo?.s9 || firmo?.hq || '—'} />
            <Tile label="Industry"         value={firmo?.c2 || '—'} />
            <Tile label="Employee Size"    value={firmo?.s8 || '—'} />
            <Tile label="Global Footprint" value={firmo?.s9a || '—'} />
          </div>
          <div className="border rounded-xl bg-white p-4" style={{ borderColor: COLORS.gray[200] }}>
            <div className="text-xs font-semibold mb-2" style={{ color: COLORS.gray[600] }}>HR Point of Contact</div>
            <div className="space-y-1">
              <div className="text-sm font-semibold" style={{ color: COLORS.gray[900] }}>
                {([firmo?.contactFirst, firmo?.contactLast].filter(Boolean).join(' ') || firmo?.contactName || firmo?.hr_name || '—')}
              </div>
              <div className="text-sm" style={{ color: COLORS.gray[900] }}>{firmo?.contactTitle || firmo?.hr_title || firmo?.title || '—'}</div>
              <div className="text-sm" style={{ color: COLORS.gray[900] }}>{firmo?.s3 || firmo?.department || '—'}</div>
              <div className="text-sm" style={{ color: COLORS.gray[900] }}>{firmo?.contactEmail || firmo?.hr_email || accountEmail || '—'}</div>
              <div className="text-sm" style={{ color: COLORS.gray[900] }}>{firmo?.contactPhone || firmo?.hr_phone || firmo?.phone || '—'}</div>
              <div className="text-sm" style={{ color: COLORS.gray[900] }}>{firmo?.hq || firmo?.s9 || '—'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* Company Profile (Firmographics & Classification) */}
        <Section title="Company Profile (Firmographics & Classification)" tone={COLORS.purple}>
          <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
            {firmoL.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(firmo, it)} color={COLORS.purple.primary} />)}
          </div>
          <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
            {firmoR.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(firmo, it)} color={COLORS.purple.primary} />)}
          </div>
        </Section>

        {/* General Benefits */}
        <Section title="General Employee Benefits" tone={COLORS.teal}>
          <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
            {generalL.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(general, it)} color={COLORS.teal.primary} />)}
          </div>
          <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
            {generalR.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(general, it)} color={COLORS.teal.primary} />)}
          </div>
        </Section>

        {/* Current Support */}
        <Section title="Current Support for Employees Managing Cancer" tone={COLORS.orange}>
          <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
            {currentL.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(current, it)} color={COLORS.orange.primary} />)}
          </div>
          <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
            {currentR.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(current, it)} color={COLORS.orange.primary} />)}
          </div>
        </Section>

        {/* Cross-Dimensional */}
        <Section title="Cross-Dimensional Assessment" tone={COLORS.purple}>
          <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
            {crossL.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(cross, it)} color={COLORS.purple.primary} />)}
          </div>
          <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
            {crossR.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(cross, it)} color={COLORS.purple.primary} />)}
          </div>
        </Section>

        {/* Employee Impact */}
        <Section title="Employee Impact Assessment" tone={COLORS.orange}>
          <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
            {impactL.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(impact, it)} color={COLORS.orange.primary} />)}
          </div>
          <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
            {impactR.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(impact, it)} color={COLORS.orange.primary} />)}
          </div>
        </Section>

        {/* 13 Dimensions */}
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-base font-bold" style={{ color: COLORS.gray[900] }}>13 Dimensions of Support</h2>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white" style={{ borderColor: COLORS.gray[200], color: COLORS.gray[700] }}>
            D13 uses 5-point scale (includes Unsure/NA)
          </span>
        </div>

        {dims.map(({ number, data }) => {
          const dItems = itemsForDimension(number);
          const [dL, dR] = splitEven(dItems);
          return (
            <Section key={number} title={`Dimension ${number}: ${DIM_NAME[number]}`} tone={COLORS.purple} badge={number === 13 ? '5-point' : undefined}>
              <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
                {dL.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(data, it)} color={COLORS.purple.primary} />)}
              </div>
              <div className="divide-y" style={{ borderColor: COLORS.gray[200] }}>
                {dR.map(it => <DataRow key={it.id} label={descriptorFor(it)} value={valueFrom(data, it)} color={COLORS.purple.primary} />)}
              </div>
            </Section>
          );
        })}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center text-xs" style={{ borderColor: COLORS.gray[200], color: COLORS.gray[700] }}>
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
          All responses collected and analyzed by BEYOND Insights, LLC
        </div>
      </main>

      {/* Print */}
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

/* ===================== Stat Tile ===================== */
function Tile({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border rounded-xl px-3 py-2" style={{ borderColor: COLORS.gray[200] }}>
      <div className="text-[11px]" style={{ color: COLORS.gray[600] }}>{label}</div>
      <div className="text-sm font-semibold" style={{ color: COLORS.gray[900] }}>{(value ?? '—') || '—'}</div>
    </div>
  );
}

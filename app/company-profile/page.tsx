'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  INSTRUMENT_ITEMS,
  type InstrumentItem,
  getItemsByRoute,
} from '../../data/instrument-items';

/* ===== CAC palette ===== */
const BRAND = {
  purple: { primary: '#6B2C91', bg: '#F5EDFF', border: '#D4B5E8' },
  teal:   { primary: '#14B8A6', bg: '#E6F9F7', border: '#99E6DD' },
  orange: { primary: '#F97316', bg: '#FFF0EC', border: '#FFD4C4' },
  gray:   { 900:'#0F172A', 700:'#334155', 600:'#475569', 400:'#94A3B8', 300:'#CBD5E1', 200:'#E5E7EB', bg:'#F9FAFB' },
};

/* ===== Short descriptor overrides (add anything you want locked) ===== */
const SHORT: Record<string, string> = {
  companyName:'Company Name', s3:'Department', s4:'Primary Job Function', s5:'Current Level',
  s6:'Areas of Responsibility', s7:'Benefits Influence', s8:'Employee Size', s9:'Headquarters',
  s9a:'Countries with Employees', c1:'Legal Name', c2:'Industry', c3:'Excluded Employee Groups',
  c4:'Annual Revenue', c5:'Healthcare Access', c6:'Remote/Hybrid Policy', c7:'Union/Works Council', hq:'Headquarters',
  'CB1.1':'Health Insurance (Medical)', 'CB1.2':'Dental', 'CB1.3':'Vision', 'CB1.4':'EAP',
  'CB2.1':'STD (Paid)', 'CB2.2':'LTD',
  'CB3.1':'Travel/Lodging for Care', 'CB3.2':'Clinical Trials Support',
  CS1:'Global Policy', CS2:'Regional Variations', CS3:'Documentation',
  CD1a:'Cross-Dept Coordination', CD1b:'Navigation Ownership', CD2:'Measurement Approach',
  EI1:'Retention Impact', EI2:'Absence Impact', EI3:'Performance Impact', EI5:'Return-to-Work Quality',
};

/* ===== Dimension names for titles ===== */
const DIM_TITLE: Record<number,string> = {
  1:'Medical Leave & Flexibility', 2:'Insurance & Financial Protection', 3:'Manager Preparedness & Capability',
  4:'Navigation & Expert Resources', 5:'Workplace Accommodations', 6:'Culture & Psychological Safety',
  7:'Career Continuity & Advancement', 8:'Work Continuation & Resumption', 9:'Executive Commitment & Resources',
  10:'Caregiver & Family Support', 11:'Prevention, Wellness & Legal Compliance',
  12:'Continuous Improvement & Outcomes', 13:'Communication & Awareness', // D13 special 5-pt
};

/* ===== Tiny inline SVG (no emojis) ===== */
const Accent = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 4" className="w-5 h-1"><rect width="24" height="4" rx="2" fill={color}/></svg>
);

/* ===== Helpers ===== */
const hideFirmoKey = (k:string) => {
  const l = k.toLowerCase();
  return l === 's1' || l.includes('birth') || l.includes('age'); // never show age/birth
};
const looksScale = (v:string) =>
  /(currently|offer|plan|eligible|not applicable|unsure|reactive)/i.test(v);

/* shorten long questions into short descriptors if not in SHORT map */
function autoShort(text:string){
  if (!text) return '';
  let s=text
    .replace(/\[[^\]]*\]/g,'').replace(/\([^)]*\)/g,'')
    .split(/[?•:\n]/)[0].trim();
  s=s.replace(/^please (indicate|select)\s+/i,'')
     .replace(/^does your (company|organization)\s+/i,'')
     .replace(/^what is your (company|organization)[’']?s?\s+/i,'')
     .replace(/^to what extent\s+/i,'')
     .replace(/^how (well|much|often)\s+/i,'')
     .replace(/\bshort[-\s]?term disability\b/gi,'STD')
     .replace(/\blong[-\s]?term disability\b/gi,'LTD')
     .replace(/\bemployee assistance program\b/gi,'EAP')
     .replace(/\bclinical trials?\b/gi,'Clinical Trials');
  const w=s.split(/\s+/); if (w.length>8) s=w.slice(0,8).join(' ');
  return s ? s.charAt(0).toUpperCase()+s.slice(1) : '';
}
const labelFor = (it:InstrumentItem) => SHORT[it.id] || autoShort(it.text) || it.id;

/* ===== “Only selected” logic ===== */
function isSelectedVal(val:any){
  if (val === true) return true;
  if (typeof val==='number') return true;
  if (typeof val==='string'){
    const s = val.trim().toLowerCase();
    if (!s) return false;
    if (['yes','selected','checked','true'].includes(s)) return true;
    if (['no','false','none','not selected'].includes(s)) return false;
    return true; // Likert/status strings (we want the chosen text)
  }
  return false;
}
function pickSelected(value:any): string[] | string | null {
  if (value == null) return null;
  if (Array.isArray(value)){
    const out = value.map(v=>String(v)).filter(v=>v.trim().length);
    return out.length ? out : null;
  }
  if (typeof value==='object'){
    const keys = Object.entries(value).filter(([,v])=>isSelectedVal(v)).map(([k])=>k);
    return keys.length ? keys : null;
  }
  const s=String(value).trim();
  return s ? s : null;
}

/* ===== Build lists from instrument ===== */
function firmoItems(): InstrumentItem[] {
  const out: InstrumentItem[] = [];
  Object.values(INSTRUMENT_ITEMS).forEach(it=>{
    const s=(it.section||'').toUpperCase();
    if ((s.startsWith('S') || s.startsWith('CLASS')) && !hideFirmoKey(it.id)) out.push(it);
  });
  return out.sort((a,b)=>(a.section+a.id).localeCompare(b.section+b.id));
}
function dimItems(n:number){return Object.values(INSTRUMENT_ITEMS).filter(i=>(i.section||'').toUpperCase()===`D${n}`).sort((a,b)=>a.id.localeCompare(b.id));}

/* ===== Chips (selected multi) ===== */
function Chips({items}:{items:string[]}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((v,i)=>(
        <span key={i} className="px-2 py-0.5 rounded border text-[12px] bg-white"
              style={{borderColor:BRAND.gray[300], color:BRAND.gray[900]}}>
          {v}
        </span>
      ))}
    </div>
  );
}

/* ===== Single row (descriptor + selected value) ===== */
function Row({ label, selected, color }:{label:string; selected:string[]|string|null; color:string}){
  return (
    <div className="py-1.5 border-b last:border-b-0 flex items-start gap-3"
         style={{borderColor:BRAND.gray[200]}}>
      <div className="shrink-0 flex items-center gap-2" style={{width:'16rem', maxWidth:'45%'}}>
        <Accent color={color}/><span className="text-[13px] font-semibold" style={{color:BRAND.gray[600]}}>{label}:</span>
      </div>
      <div className="text-[13px] grow text-left" style={{color:BRAND.gray[900], wordBreak:'break-word', hyphens:'auto'}}>
        {selected == null
          ? <span>—</span>
          : Array.isArray(selected)
              ? (selected.length ? <Chips items={selected}/> : <span>—</span>)
              : (looksScale(selected)
                  ? <span className="px-2.5 py-0.5 rounded-full border text-[12px]"
                          style={{backgroundColor:BRAND.purple.bg, color:BRAND.purple.primary, borderColor:BRAND.purple.border}}>
                      {selected}
                    </span>
                  : <span>{selected}</span>
                )
        }
      </div>
    </div>
  );
}

/* ===== Section shell ===== */
function Section({
  title, tone, children, badge,
}:{title:string; tone:{primary:string; bg:string; border:string}; children:React.ReactNode; badge?:string;}){
  return (
    <section className="mb-6 rounded-xl border-2 overflow-hidden" style={{borderColor:tone.border}}>
      <div className="px-6 py-3 flex items-center justify-between" style={{backgroundColor:tone.primary}}>
        <h2 className="text-base sm:text-lg font-bold text-white">{title}</h2>
        {badge && <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white"
                         style={{borderColor:BRAND.gray[200], color:BRAND.gray[700]}}>{badge}</span>}
      </div>
      <div className="p-6 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">{children}</div>
      </div>
    </section>
  );
}

/* ===== Balance columns by what will actually render (selected-only) ===== */
function balanceBySelected(items: InstrumentItem[], source: Record<string,any>) {
  const left: InstrumentItem[] = [];
  const right: InstrumentItem[] = [];
  let l=0, r=0;
  for (const it of items){
    const sel = pickSelected( valueFrom(source, it) );
    if (sel==null) continue; // skip rows w/ nothing selected
    if (l<=r){ left.push(it); l++; } else { right.push(it); r++; }
  }
  return {left, right};
}

/* value resolver: id → value, or by stored key matching text/id */
function valueFrom(source:Record<string,any>, it:InstrumentItem){
  if (it.id in source) return source[it.id];
  const t=(it.text||'').toLowerCase();
  const hit = Object.entries(source).find(([k]) => k.toLowerCase()===t || k.toLowerCase()===it.id.toLowerCase());
  return hit ? hit[1] : null;
}

/* ===== Page ===== */
export default function CompanyProfile(){
  const router = useRouter();

  const [firmo, setFirmo]     = useState<Record<string,any>>({});
  const [general, setGeneral] = useState<Record<string,any>>({});
  const [current, setCurrent] = useState<Record<string,any>>({});
  const [cross, setCross]     = useState<Record<string,any>>({});
  const [impact, setImpact]   = useState<Record<string,any>>({});
  const [dims, setDims]       = useState<Array<{number:number; data:Record<string,any>}>>([]);

  const [companyName, setCompanyName]   = useState('Your Organization');
  const [accountEmail, setAccountEmail] = useState('');
  const [generatedAt, setGeneratedAt]   = useState('');
  const [loading, setLoading]           = useState(true);

  useEffect(()=>{
    const f = JSON.parse(localStorage.getItem('firmographics_data')||'{}');
    const g = JSON.parse(localStorage.getItem('general-benefits_data')||'{}');
    const c = JSON.parse(localStorage.getItem('current-support_data')||'{}');
    const x = JSON.parse(localStorage.getItem('cross-dimensional_data')||'{}');
    const e = JSON.parse(localStorage.getItem('employee-impact_data')||'{}');

    const d:Array<{number:number; data:Record<string,any>}> = [];
    for (let i=1;i<=13;i++){
      const raw = JSON.parse(localStorage.getItem(`dimension${i}_data`)||'{}');
      d.push({ number:i, data: raw || {} });
    }

    setFirmo(f); setGeneral(g); setCurrent(c); setCross(x); setImpact(e); setDims(d);

    const email = localStorage.getItem('auth_email') || '';
    setAccountEmail(email);
    setCompanyName(f.companyName || f.s8 || 'Your Organization');
    setGeneratedAt(new Date().toLocaleDateString());
    setLoading(false);
  },[]);

  // instrument-driven lists
  const firmoAll   = useMemo(()=> firmoItems(), []);
  const generalAll = useMemo(()=> getItemsByRoute('/survey/general-benefits').sort((a,b)=>a.id.localeCompare(b.id)), []);
  const currentAll = useMemo(()=> getItemsByRoute('/survey/current-support').sort((a,b)=>a.id.localeCompare(b.id)), []);
  const crossAll   = useMemo(()=> getItemsByRoute('/survey/cross-dimensional-assessment').sort((a,b)=>a.id.localeCompare(b.id)), []);
  const impactAll  = useMemo(()=> getItemsByRoute('/survey/employee-impact-assessment').sort((a,b)=>a.id.localeCompare(b.id)), []);

  // balanced, selected-only columns
  const firmoCols   = useMemo(()=> balanceBySelected(firmoAll,   firmo),   [firmoAll, firmo]);
  const generalCols = useMemo(()=> balanceBySelected(generalAll, general), [generalAll, general]);
  const currentCols = useMemo(()=> balanceBySelected(currentAll, current), [currentAll, current]);
  const crossCols   = useMemo(()=> balanceBySelected(crossAll,   cross),   [crossAll, cross]);
  const impactCols  = useMemo(()=> balanceBySelected(impactAll,  impact),  [impactAll, impact]);

  if (loading){
    return (
      <div className="min-h-screen grid place-items-center" style={{backgroundColor:BRAND.gray.bg}}>
        <div className="text-sm" style={{color:BRAND.gray[600]}}>Loading…</div>
      </div>
    );
  }

  // helper: render section (auto-hide if no rows selected)
  const renderSection = (
    title:string,
    tone:{primary:string; bg:string; border:string},
    cols:{left:InstrumentItem[]; right:InstrumentItem[]},
    source:Record<string,any>,
    badge?:string
  )=>{
    const count = cols.left.length + cols.right.length;
    if (count===0) return null; // hide empty section entirely
    return (
      <Section title={title} tone={tone} badge={badge}>
        <div className="divide-y" style={{borderColor:BRAND.gray[200]}}>
          {cols.left.map(it=>(
            <Row key={it.id}
                 label={labelFor(it)}
                 selected={pickSelected( valueFrom(source,it) )}
                 color={tone.primary}/>
          ))}
        </div>
        <div className="divide-y" style={{borderColor:BRAND.gray[200]}}>
          {cols.right.map(it=>(
            <Row key={it.id}
                 label={labelFor(it)}
                 selected={pickSelected( valueFrom(source,it) )}
                 color={tone.primary}/>
          ))}
        </div>
      </Section>
    );
  };

  return (
    <div className="min-h-screen" style={{backgroundColor:BRAND.gray.bg}}>
      {/* header w/ your logos */}
      <div className="bg-white border-b" style={{borderColor:BRAND.gray[200]}}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-28" />
            <div className="flex-1 flex justify-center">
              <img src="/best-companies-2026-logo.png" alt="Best Companies Award"
                   className="h-16 sm:h-20 lg:h-24 w-auto drop-shadow-md"/>
            </div>
            <div className="flex justify-end">
              <img src="/cancer-careers-logo.png" alt="Cancer and Careers"
                   className="h-10 sm:h-14 lg:h-16 w-auto"/>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-black mb-1" style={{color:BRAND.purple.primary}}>
              {companyName}
            </h1>
            <p className="text-base" style={{color:BRAND.gray[600]}}>Company Profile & Survey Summary</p>
            <p className="text-sm mt-1" style={{color:BRAND.gray[600]}}>
              Generated: {generatedAt}{accountEmail ? ` • ${accountEmail}` : ''}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
              <button onClick={()=>router.push('/dashboard')}
                      className="px-3 py-1.5 text-sm font-semibold border rounded"
                      style={{borderColor:BRAND.gray[200], color:BRAND.gray[900]}}>
                Back to Dashboard
              </button>
              <button onClick={()=>window.print()}
                      className="px-3 py-1.5 text-sm font-semibold rounded text-white"
                      style={{backgroundColor:BRAND.purple.primary}}>
                Print PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* top stats + HR POC */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Tile label="Headquarters" value={firmo?.s9 || firmo?.hq || '—'} />
            <Tile label="Industry" value={firmo?.c2 || '—'} />
            <Tile label="Employee Size" value={firmo?.s8 || '—'} />
            <Tile label="Global Footprint" value={firmo?.s9a || '—'} />
          </div>
          <div className="border rounded-xl bg-white p-4" style={{borderColor:BRAND.gray[200]}}>
            <div className="text-xs font-semibold mb-2" style={{color:BRAND.gray[600]}}>HR Point of Contact</div>
            <div className="space-y-1 text-sm" style={{color:BRAND.gray[900]}}>
              <div className="font-semibold">
                {([firmo?.contactFirst, firmo?.contactLast].filter(Boolean).join(' ') || firmo?.contactName || firmo?.hr_name || '—')}
              </div>
              <div>{firmo?.contactTitle || firmo?.hr_title || firmo?.title || '—'}</div>
              <div>{firmo?.s3 || firmo?.department || '—'}</div>
              <div>{firmo?.contactEmail || firmo?.hr_email || '—'}</div>
              <div>{firmo?.contactPhone || firmo?.hr_phone || firmo?.phone || '—'}</div>
              <div>{firmo?.hq || firmo?.s9 || '—'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* sections (auto-hide if empty) */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        {renderSection('Company Profile (Firmographics & Classification)', BRAND.purple, firmoCols, firmo)}
        {renderSection('General Employee Benefits', BRAND.teal, generalCols, general)}
        {renderSection('Current Support for Employees Managing Cancer', BRAND.orange, currentCols, current)}
        {renderSection('Cross-Dimensional Assessment', BRAND.purple, crossCols, cross)}
        {renderSection('Employee Impact Assessment', BRAND.orange, impactCols, impact)}

        {/* 13 Dimensions */}
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-base font-bold" style={{color:BRAND.gray[900]}}>13 Dimensions of Support</h2>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-white"
                style={{borderColor:BRAND.gray[200], color:BRAND.gray[700]}}>
            D13 uses 5-point scale (includes Unsure/NA)
          </span>
        </div>

        {dims.map(({number, data})=>{
          const cols = balanceBySelected(dimItems(number), data);
          return renderSection(
            `Dimension ${number}: ${DIM_TITLE[number]}`,
            BRAND.purple,
            cols,
            data,
            number===13 ? '5-point' : undefined
          );
        })}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center text-xs"
             style={{borderColor:BRAND.gray[200], color:BRAND.gray[700]}}>
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
        }
      `}</style>
    </div>
  );
}

/* ===== stat tile ===== */
function Stat({ label, value }:{label:string; value:any}){
  return (
    <div className="bg-white border rounded-xl px-3 py-2" style={{borderColor:BRAND.gray[200]}}>
      <div className="text-[11px]" style={{color:BRAND.gray[600]}}>{label}</div>
      <div className="text-sm font-semibold" style={{color:BRAND.gray[900]}}>{(value ?? '—') || '—'}</div>
    </div>
  );
}
const Tile = Stat;

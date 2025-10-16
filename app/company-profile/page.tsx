'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ========== Palette ========== */
const C = {
  purple: '#6B2C91',
  gray900: '#0F172A',
  gray700: '#334155',
  gray600: '#475569',
  gray500: '#64748B',
  gray200: '#E2E8F0',
  gray100: '#F1F5F9',
  white: '#FFFFFF',
};

/* ========== Inline SVG (custom only) ========== */
const CACLogo = ({ className='' }) => (
  <svg className={className} viewBox="0 0 200 36" aria-label="Cancer and Careers" fill="none">
    <rect width="200" height="36" rx="6" fill={C.purple} />
    <text x="12" y="24" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="14" fill="white">
      Cancer and Careers
    </text>
  </svg>
);
const CACMark = ({ className='' }) => (
  <svg className={className} viewBox="0 0 56 56" aria-label="Employer Index" fill="none">
    <circle cx="28" cy="28" r="26" stroke={C.purple} strokeWidth="2" fill={C.white}/>
    <path d="M16 31c4-7 9-10 12-10s8 3 12 10" stroke={C.purple} strokeWidth="2"/>
    <circle cx="28" cy="24" r="3.6" fill={C.purple}/>
    <text x="28" y="48" textAnchor="middle" fontFamily="Inter, system-ui" fontWeight="700" fontSize="7" fill={C.gray900}>
      EMPLOYER INDEX
    </text>
  </svg>
);

/* Icons */
const Back = (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke={C.gray700} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const Printer = (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke={C.gray700} strokeWidth="1.6"><path d="M6 9V3h12v6"/><rect x="6" y="13" width="12" height="8" rx="1.5"/><path d="M6 13h12"/></svg>;
const Download = (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke={C.gray700} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/></svg>;

/* ========== Helpers ========== */
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
  13:'Communication & Awareness', // D13 special 5-pt
};

const titleize = (s:string) =>
  s.replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/\s+/g,' ')
   .trim().replace(/^./,m=>m.toUpperCase());

const hideFirmo = (k:string) => {
  const l = k.toLowerCase();
  return l==='s1' || l.includes('birth') || l.includes('age');
};

const pill = (v:string) => {
  const t = v.toLowerCase();
  const base = 'px-2 py-0.5 rounded-full border text-[11px] font-medium';
  if (t.includes('currently offer') || t.includes('currently use')) return `${base} border-green-300 text-green-800 bg-green-50`;
  if (t.includes('offer to eligible') || t.includes('offer in at least one')) return `${base} border-blue-300 text-blue-800 bg-blue-50`;
  if (t.includes('plan to offer') || t.includes('active planning')) return `${base} border-amber-300 text-amber-800 bg-amber-50`;
  if (t.includes('do not plan') || t.includes('not able')) return `${base} border-gray-300 text-gray-700 bg-gray-100`;
  if (t.includes('not applicable') || t.includes('unsure')) return `${base} border-gray-200 text-gray-600 bg-white`;
  return `${base} border-purple-300 text-purple-800 bg-purple-50`;
};

/* ========== Small blocks ========== */
const KVP = ({label, value}:{label:string; value:any}) => {
  if (value===undefined || value===null || value==='') return null;
  return (
    <div className="grid grid-cols-5 gap-3 py-1.5 border-b border-slate-200 last:border-0">
      <div className="col-span-2 text-[12px] font-semibold text-slate-600">{label}</div>
      <div className="col-span-3 text-[13px] text-slate-900 leading-5">
        {Array.isArray(value)
          ? <div className="flex flex-wrap gap-1.5">{value.map((v,i)=><span key={i} className="px-2 py-0.5 rounded border bg-slate-50 text-slate-800 text-[11px]">{String(v)}</span>)}</div>
          : String(value)}
      </div>
    </div>
  );
};

const DimTable = ({data}:{data:Record<string,any>}) => {
  const rows = Object.entries(data||{}).filter(([,v])=>v);
  if (!rows.length) return null;
  return (
    <table className="w-full text-sm border border-slate-200 rounded overflow-hidden">
      <tbody>
        {rows.map(([k,v],i)=>(
          <tr key={k} className={i%2 ? 'bg-slate-50' : 'bg-white'}>
            <td className="w-[58%] px-3 py-2 text-slate-800 align-top">{titleize(k)}</td>
            <td className="px-3 py-2 text-right">
              {Array.isArray(v) ? (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {v.map((x,ix)=>(<span key={ix} className="px-2 py-0.5 rounded border bg-white text-slate-800 text-[11px]">{String(x)}</span>))}
                </div>
              ) : (typeof v==='object'
                    ? (<div className="flex flex-col items-end gap-1">
                        {Object.entries(v).map(([kk,vv])=>(
                          <div key={kk} className="flex items-center gap-2"><span className="text-[12px] text-slate-600">{kk}</span><span className={pill(String(vv))}>{String(vv)}</span></div>
                        ))}
                       </div>)
                    : (/currently|offer|plan|applicable|unsure|reactive/i.test(String(v))
                        ? <span className={pill(String(v))}>{String(v)}</span>
                        : <span className="text-slate-900">{String(v)}</span>)
                )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/* ========== Page ========== */
export default function CompanyProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const firmographics = JSON.parse(localStorage.getItem('firmographics_data')||'{}');
    const general = JSON.parse(localStorage.getItem('general-benefits_data')||'{}');
    const current = JSON.parse(localStorage.getItem('current-support_data')||'{}');
    const dims: Array<{number:number, data:any}> = [];
    for (let i=1;i<=13;i++){
      const d = JSON.parse(localStorage.getItem(`dimension${i}_data`)||'{}');
      if (Object.keys(d).length) dims.push({ number:i, data:d });
    }
    const cross = JSON.parse(localStorage.getItem('cross-dimensional_data')||'{}');
    const impact = JSON.parse(localStorage.getItem('employee-impact_data')||'{}');

    const email = localStorage.getItem('auth_email')||'';
    const hr = {
      name: [firmographics?.contactFirst, firmographics?.contactLast].filter(Boolean).join(' ')
            || firmographics?.contactName || firmographics?.hr_name || '',
      title: firmographics?.contactTitle || firmographics?.hr_title || firmographics?.title || '',
      department: firmographics?.s3 || firmographics?.department || '',
      email: firmographics?.contactEmail || firmographics?.hr_email || email || '',
      phone: firmographics?.contactPhone || firmographics?.hr_phone || firmographics?.phone || '',
      location: firmographics?.hq || firmographics?.s9 || '',
    };

    setProfile({
      companyName: firmographics.companyName || firmographics.s8 || 'Your Organization',
      email,
      firmographics,
      general,
      current,
      dimensions: dims,
      crossDimensional: cross,
      employeeImpact: impact,
      hrPOC: hr,
      generatedAt: new Date().toLocaleDateString(),
    });
    setLoading(false);
  },[]);

  const firmo = useMemo(()=>Object.entries(profile?.firmographics||{})
      .filter(([k,v])=>v && !hideFirmo(k)),[profile]);

  const printPDF = ()=>window.print();

  const downloadTXT = ()=>{
    const p = profile;
    let out = `COMPANY PROFILE — ${p.companyName}\nGenerated: ${new Date().toLocaleString()}\n\n${'='.repeat(90)}\n\n`;
    out += `ORGANIZATION SNAPSHOT\n${'-'.repeat(90)}\n`;
    firmo.forEach(([k,v])=> out += `${titleize(k)}: ${Array.isArray(v)? v.join(', ') : String(v)}\n`);
    out += `\nHR POINT OF CONTACT\n${'-'.repeat(90)}\n`;
    ['name','title','department','email','phone','location'].forEach(k=>p.hrPOC?.[k] && (out += `${titleize(k)}: ${p.hrPOC[k]}\n`));
    const blob = new Blob([out], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href:url, download:`${p.companyName.replace(/\s+/g,'_')}_Company_Profile.txt` });
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadJSON = ()=>{
    const blob = new Blob([JSON.stringify(profile,null,2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href:url, download:`${profile.companyName.replace(/\s+/g,'_')}_Company_Profile.json` });
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading || !profile){
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="text-slate-600 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Action bar (hidden in print) */}
      <div className="print:hidden border-b">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={()=>router.push('/dashboard')} className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900">
            <Back className="w-5 h-5"/><span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={printPDF} className="inline-flex items-center gap-2 px-3 py-2 rounded border hover:bg-slate-50">
              <Printer className="w-5 h-5"/><span className="font-semibold">Download PDF</span>
            </button>
            <button onClick={downloadTXT} className="inline-flex items-center gap-2 px-3 py-2 rounded border hover:bg-slate-50">
              <Download className="w-5 h-5"/><span className="font-semibold">.TXT</span>
            </button>
            <button onClick={downloadJSON} className="inline-flex items-center gap-2 px-3 py-2 rounded border hover:bg-slate-50">
              <Download className="w-5 h-5"/><span className="font-semibold">.JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-6 print:py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight">{profile.companyName}</h1>
            <div className="text-[12px] text-slate-600 mt-1">Comprehensive Workplace Support Profile</div>
            <div className="text-[11px] text-slate-500 mt-1">Generated: {profile.generatedAt}{profile.email ? ` · Account: ${profile.email}` : ''}</div>
          </div>
          <div className="flex items-center gap-3">
            <CACLogo className="h-8 w-auto"/>
            <CACMark className="h-8 w-auto"/>
          </div>
        </div>
      </header>

      {/* Stats + HR POC */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stats */}
          <div className="md:col-span-2 border rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Headquarters" value={profile.firmographics?.s9 || profile.firmographics?.hq || '—'} />
              <Stat label="Industry" value={profile.firmographics?.c2 || '—'} />
              <Stat label="Employees" value={profile.firmographics?.s8 || '—'} />
              <Stat label="Global Footprint" value={profile.firmographics?.s9a || '—'} />
            </div>
          </div>
          {/* HR POC */}
          <div className="border rounded-lg p-4">
            <div className="text-[12px] font-semibold text-slate-600 mb-2">HR Point of Contact</div>
            <div className="space-y-1.5 text-[13px]">
              <div className="font-medium">{profile.hrPOC?.name || '—'}</div>
              <div className="text-slate-700">{profile.hrPOC?.title || '—'}</div>
              <div className="text-slate-700">{profile.hrPOC?.department || '—'}</div>
              <div className="text-slate-700">{profile.hrPOC?.email || '—'}</div>
              <div className="text-slate-700">{profile.hrPOC?.phone || '—'}</div>
              <div className="text-slate-700">{profile.hrPOC?.location || '—'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-column body */}
      <main className="max-w-6xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Firmographics + Benefits */}
          <div className="space-y-6">
            <Card title="Organization Snapshot">
              {firmo.length ? firmo.map(([k,v])=><KVP key={k} label={titleize(k)} value={v}/>) : <Empty />}
            </Card>
            <Card title="General Employee Benefits">
              {Object.keys(profile.general||{}).length
                ? Object.entries(profile.general).map(([k,v])=><KVP key={k} label={titleize(k)} value={v}/>)
                : <Empty />}
            </Card>
          </div>

          {/* Right: Current Support + Assessments */}
          <div className="space-y-6">
            <Card title="Current Support for Employees Managing Cancer">
              {Object.keys(profile.current||{}).length
                ? Object.entries(profile.current).map(([k,v])=><KVP key={k} label={titleize(k)} value={v}/>)
                : <Empty />}
            </Card>
            <Card title="Cross-Dimensional Assessment">
              {Object.keys(profile.crossDimensional||{}).length
                ? Object.entries(profile.crossDimensional).map(([k,v])=><KVP key={k} label={titleize(k)} value={v}/>)
                : <Empty />}
            </Card>
            <Card title="Employee Impact Assessment">
              {Object.keys(profile.employeeImpact||{}).length
                ? Object.entries(profile.employeeImpact).map(([k,v])=><KVP key={k} label={titleize(k)} value={v}/>)
                : <Empty />}
            </Card>
          </div>
        </div>

        {/* Dimensions */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[16px] font-bold text-slate-900">13 Dimensions of Support</h2>
            <span className="text-[11px] text-slate-600 border rounded px-2 py-0.5">
              D13 uses 5-point scale (includes Unsure/NA)
            </span>
          </div>
          <div className="space-y-5">
            {profile.dimensions?.map(({number, data}:any)=>(
              <Card key={number} title={`Dimension ${number}: ${DIM_NAME[number]}`}>
                <DimTable data={data}/>
              </Card>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-600 mt-10 pb-10 border-t pt-4">
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
          All responses collected and analyzed by BEYOND Insights, LLC
        </footer>
      </main>

      {/* Print */}
      <style jsx>{`
        :global(html){ font-size: 14px; }
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display:none !important; }
          header, section, main, .border, .rounded { break-inside: avoid; }
          table { page-break-inside: auto; }
        }
      `}</style>
    </div>
  );
}

/* ===== small components ===== */
function Card({title, children}:{title:string; children:React.ReactNode}){
  return (
    <div className="border rounded-lg">
      <div className="px-4 py-2 border-b bg-slate-50">
        <h3 className="text-[13px] font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
function Stat({label, value}:{label:string; value:any}){
  return (
    <div className="bg-white border rounded-lg px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-[13px] font-semibold text-slate-900">{value || '—'}</div>
    </div>
  );
}
function Empty(){ return <div className="text-[12px] text-slate-500">No data provided.</div>; }

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ------------------ Brand & Palette ------------------ */
const COLORS = {
  purple: '#6B2C91',
  purpleDark: '#4f1f6a',
  orange: '#F97316',
  teal: '#14B8A6',
  gray900: '#111827',
  gray600: '#4B5563',
  bg: '#F9FAFB',
};

/* ------------------ Inline SVG (custom only) ------------------ */
const CACLogo = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 200 44" aria-label="Cancer and Careers" fill="none">
    <rect width="200" height="44" rx="8" fill={COLORS.purple} />
    <text x="14" y="28" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="16" fill="white">
      Cancer and Careers
    </text>
  </svg>
);
const CACAwardMark = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 60 60" aria-label="Employer Index Mark" fill="none">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="60" y2="60">
        <stop offset="0" stopColor="#F59E0B" />
        <stop offset="1" stopColor={COLORS.orange} />
      </linearGradient>
    </defs>
    <circle cx="30" cy="30" r="28" stroke="url(#g)" strokeWidth="2.5" fill="white" />
    <path d="M18 33c3.5-6.5 9-10 12-10s8.5 3.5 12 10" stroke={COLORS.purple} strokeWidth="2.2" />
    <circle cx="30" cy="26" r="4.2" fill={COLORS.purple} />
    <text x="30" y="50" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="7" fill={COLORS.gray900}>
      EMPLOYER INDEX
    </text>
  </svg>
);
const Icon = {
  Back: (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>,
  Print: (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 9V3h12v6"/><rect x="6" y="13" width="12" height="8" rx="1.5"/><path d="M6 13h12"/></svg>,
  Download: (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/></svg>,
  Building: (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>,
  User: (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M3 16c2.2-2.5 5.8-2.5 8 0"/><path d="M14 9h5M14 12h5M14 15h3"/></svg>,
  Briefcase: (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M7 7V6a2 2 0 012-2h6a2 2 0 012 2v1"/><path d="M3 12h18"/></svg>,
  Shield: (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 3l7 4v5c0 4.97-3 9-7 9s-7-4.03-7-9V7l7-4z"/></svg>,
  Grid: (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>,
  Link: (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11 5"/><path d="M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 107.07 7.07L13 19"/></svg>,
  People: (p:{className?:string}) => <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="10" r="3"/><path d="M2 20c0-3.3137 2.6863-6 6-6"/><circle cx="17" cy="10" r="3"/><path d="M16 14c3.3137 0 6 2.6863 6 6"/></svg>,
};

/* ------------------ Helpers ------------------ */
const DIM_NAMES: Record<number, string> = {
  1:'Medical Leave & Flexibility', 2:'Insurance & Financial Protection', 3:'Manager Preparedness & Capability',
  4:'Navigation & Expert Resources', 5:'Workplace Accommodations', 6:'Culture & Psychological Safety',
  7:'Career Continuity & Advancement', 8:'Work Continuation & Resumption', 9:'Executive Commitment & Resources',
  10:'Caregiver & Family Support', 11:'Prevention, Wellness & Legal Compliance', 12:'Continuous Improvement & Outcomes',
  13:'Communication & Awareness', // D13 special scale
};

const tcap = (s:string) => s
  .replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/\s+/g,' ').trim()
  .replace(/^./, m => m.toUpperCase());

const hideFirmo = (k:string) => {
  const l = k.toLowerCase();
  return l==='s1' || l.includes('birth') || l.includes('age');
};

const statusPill = (v:string) => {
  const val = v.toLowerCase();
  let cls = 'bg-purple-50 text-purple-800 border border-purple-200';
  if (val.includes('currently offer') || val.includes('currently use')) cls = 'bg-green-50 text-green-800 border border-green-200';
  else if (val.includes('offer to eligible') || val.includes('offer in at least one')) cls = 'bg-blue-50 text-blue-800 border-blue-200';
  else if (val.includes('plan to offer') || val.includes('in active planning')) cls = 'bg-yellow-50 text-yellow-800 border-yellow-200';
  else if (val.includes('do not plan') || val.includes('not able')) cls = 'bg-gray-100 text-gray-800 border-gray-200';
  else if (val.includes('not applicable') || val.includes('unsure')) cls = 'bg-gray-50 text-gray-600 border-gray-200';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{v}</span>;
};

const asChips = (arr:any[]) => (
  <div className="flex flex-wrap gap-1.5">
    {arr.map((v,i)=>(<span key={i} className="px-2.5 py-0.5 rounded-full text-xs border bg-gray-50 text-gray-800 border-gray-200">{String(v)}</span>))}
  </div>
);

/* Converts a response object like { "Policy A": "Currently offer", ... } into a neat list */
const objectToList = (obj:Record<string,string>) => {
  const entries = Object.entries(obj || {});
  if (!entries.length) return null;
  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
      {entries.map(([k,v])=>(
        <li key={k} className="flex items-start justify-between gap-4 px-4 py-2">
          <span className="text-gray-800">{k}</span>
          <span className="shrink-0">{statusPill(String(v))}</span>
        </li>
      ))}
    </ul>
  );
};

/* ------------------ Reusable Blocks ------------------ */
function Section({
  title, icon, color, children, badge,
}: { title:string; icon:React.ReactNode; color:string; children:React.ReactNode; badge?:string }) {
  return (
    <section className="mb-8 print:break-inside-avoid">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: `${color}15`, color }}>{icon}</div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        {badge && <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-300 text-gray-700 bg-white">{badge}</span>}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">{children}</div>
    </section>
  );
}

function Row({ label, value }:{label:string; value:any}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start justify-between border-b last:border-b-0 border-gray-100 py-2">
      <span className="text-sm font-semibold text-gray-600">{label}</span>
      <div className="text-gray-900 text-sm max-w-[60ch] text-right whitespace-pre-wrap">
        {Array.isArray(value) ? asChips(value) : String(value)}
      </div>
    </div>
  );
}

/* ------------------ Page ------------------ */
export default function CompanyProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dimNames = DIM_NAMES;

  useEffect(() => {
    const firmographics = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const general = JSON.parse(localStorage.getItem('general-benefits_data') || '{}');
    const current = JSON.parse(localStorage.getItem('current-support_data') || '{}');

    const dimensions: Array<{ number:number; data:any }> = [];
    for (let i=1;i<=13;i++){
      const d = JSON.parse(localStorage.getItem(`dimension${i}_data`)||'{}');
      if (Object.keys(d).length) dimensions.push({ number:i, data:d });
    }

    const crossDimensional = JSON.parse(localStorage.getItem('cross-dimensional_data') || '{}');
    const employeeImpact = JSON.parse(localStorage.getItem('employee-impact_data') || '{}');
    const email = localStorage.getItem('auth_email') || '';

    // derive HR POC (no age/birth)
    const hr = {
      name: [firmographics?.contactFirst, firmographics?.contactLast].filter(Boolean).join(' ') || firmographics?.contactName || firmographics?.hr_name || '',
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
      dimensions,
      crossDimensional,
      employeeImpact,
      hrPOC: hr,
      generatedAt: new Date().toLocaleDateString(),
    });
    setLoading(false);
  }, []);

  const firmoPairs = useMemo(()=>{
    const e = Object.entries(profile?.firmographics || {})
      .filter(([k,v]) => v && !hideFirmo(k));
    return e;
  },[profile]);

  const handlePrintPDF = () => window.print();

  const handleDownloadTXT = () => {
    const { companyName, firmographics, general, current, dimensions, crossDimensional, employeeImpact, hrPOC } = profile;
    let out = `COMPANY PROFILE — ${companyName}\nGenerated: ${new Date().toLocaleString()}\n\n${'='.repeat(90)}\n\n`;
    out += 'ORGANIZATION SNAPSHOT\n' + '-'.repeat(90) + '\n';
    firmoPairs.forEach(([k,v])=> { out += `${tcap(k)}: ${Array.isArray(v) ? v.join(', ') : String(v)}\n`; });
    out += '\nHR POINT OF CONTACT\n' + '-'.repeat(90) + '\n';
    ['name','title','department','email','phone','location'].forEach(k => { if (hrPOC?.[k]) out += `${tcap(k)}: ${hrPOC[k]}\n`; });
    out += '\nGENERAL BENEFITS\n' + '-'.repeat(90) + '\n';
    Object.entries(general||{}).forEach(([k,v])=> v && (out += `${tcap(k)}: ${Array.isArray(v)? v.join(', '): String(v)}\n`));
    out += '\nCURRENT SUPPORT\n' + '-'.repeat(90) + '\n';
    Object.entries(current||{}).forEach(([k,v])=> v && (out += `${tcap(k)}: ${Array.isArray(v)? v.join(', '): String(v)}\n`));
    dimensions.forEach(({number,data}:any)=>{
      out += `\nDIMENSION ${number}: ${dimNames[number]}\n` + '-'.repeat(90) + '\n';
      Object.entries(data||{}).forEach(([k,v])=>{
        if (!v) return;
        if (typeof v === 'object' && !Array.isArray(v)) {
          out += `${tcap(k)}:\n`;
          Object.entries(v).forEach(([kk,vv])=> out += `  - ${kk}: ${vv}\n`);
        } else {
          out += `${tcap(k)}: ${Array.isArray(v)? v.join(', '): String(v)}\n`;
        }
      });
    });
    const blob = new Blob([out], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href:url, download:`${profile.companyName.replace(/\s+/g,'_')}_Company_Profile.txt` });
    a.click(); URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href:url, download:`${profile.companyName.replace(/\s+/g,'_')}_Company_Profile.json` });
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[--tw-ring-color]" style={{ ['--tw-ring-color' as any]: COLORS.purple }} />
          <p className="mt-4 text-gray-600 text-base">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg }}>
      {/* Action bar (hidden on print) */}
      <div className="print:hidden bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={()=>router.push('/dashboard')} className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <Icon.Back className="w-5 h-5" /><span className="font-medium">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handlePrintPDF} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50">
              <Icon.Print className="w-5 h-5" /><span className="font-semibold">Download PDF</span>
            </button>
            <button onClick={handleDownloadTXT} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50">
              <Icon.Download className="w-5 h-5" /><span className="font-semibold">.TXT</span>
            </button>
            <button onClick={handleDownloadJSON} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50">
              <Icon.Download className="w-5 h-5" /><span className="font-semibold">.JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r text-white py-8 print:py-6" style={{ backgroundImage: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.purpleDark})` }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{profile.companyName}</h1>
              <p className="text-sm opacity-90 mt-1">Comprehensive Workplace Support Profile</p>
              <p className="text-xs opacity-80 mt-1">Generated: {profile.generatedAt}</p>
              {profile.email && <p className="text-xs opacity-80 mt-1">Account Email: {profile.email}</p>}
            </div>
            <div className="flex items-center gap-4">
              <CACLogo className="h-10 md:h-12 w-auto" />
              <CACAwardMark className="h-10 md:h-12 w-auto" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 print:py-6">
        {/* Organization Snapshot */}
        <Section title="Organization Snapshot" icon={<Icon.Building className="w-5 h-5"/>} color={COLORS.purple}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {firmoPairs.map(([k,v]) => (<Row key={k} label={tcap(k)} value={v} />))}
          </div>
        </Section>

        {/* HR POC */}
        <Section title="HR Point of Contact" icon={<Icon.User className="w-5 h-5"/>} color={COLORS.teal}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Row label="Name" value={profile.hrPOC?.name} />
            <Row label="Title" value={profile.hrPOC?.title} />
            <Row label="Department" value={profile.hrPOC?.department} />
            <Row label="Email" value={profile.hrPOC?.email} />
            <Row label="Phone" value={profile.hrPOC?.phone} />
            <Row label="Location" value={profile.hrPOC?.location} />
          </div>
        </Section>

        {/* General Benefits */}
        {!!Object.keys(profile.general||{}).length && (
          <Section title="General Employee Benefits" icon={<Icon.Briefcase className="w-5 h-5"/>} color={COLORS.teal}>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(profile.general).map(([k,v]) => (
                <Row key={k} label={tcap(k)} value={Array.isArray(v) ? v : String(v)} />
              ))}
            </div>
          </Section>
        )}

        {/* Current Support */}
        {!!Object.keys(profile.current||{}).length && (
          <Section title="Current Support for Employees Managing Cancer" icon={<Icon.Shield className="w-5 h-5"/>} color={COLORS.orange}>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(profile.current).map(([k,v]) => (
                <Row key={k} label={tcap(k)} value={Array.isArray(v) ? v : String(v)} />
              ))}
            </div>
          </Section>
        )}

        {/* Dimensions */}
        {profile.dimensions?.map(({number, data}:any) => (
          <Section
            key={number}
            title={`Dimension ${number}: ${dimNames[number]||''}`}
            icon={<Icon.Grid className="w-5 h-5" />}
            color={COLORS.purple}
            badge={number===13 ? 'D13 uses 5-point (incl. Unsure/NA)' : undefined}
          >
            <div className="space-y-4">
              {Object.entries(data).map(([k,v])=>{
                if (!v) return null;
                // objects (like D1a, D2a…) -> bulleted list with pills
                if (typeof v === 'object' && !Array.isArray(v)) {
                  return (
                    <div key={k} className="mb-4">
                      <div className="text-sm font-semibold text-gray-700 mb-2">{tcap(k)}</div>
                      {objectToList(v as Record<string,string>)}
                    </div>
                  );
                }
                // arrays -> chips
                if (Array.isArray(v)) return (
                  <div key={k} className="mb-2">
                    <div className="text-sm font-semibold text-gray-700 mb-1">{tcap(k)}</div>
                    {asChips(v)}
                  </div>
                );
                // strings -> status pill if looks like scale
                const vs = String(v);
                const looksScale = /(currently|offer|plan|not applicable|unsure|reactive)/i.test(vs);
                return (
                  <div key={k} className="flex items-start justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-800 pr-4">{tcap(k)}</span>
                    <span className="shrink-0">{looksScale ? statusPill(vs) : vs}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        ))}

        {/* Cross-Dimensional */}
        {!!Object.keys(profile.crossDimensional||{}).length && (
          <Section title="Cross-Dimensional Assessment" icon={<Icon.Link className="w-5 h-5"/>} color={COLORS.teal}>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(profile.crossDimensional).map(([k,v])=> (<Row key={k} label={tcap(k)} value={v} />))}
            </div>
          </Section>
        )}

        {/* Employee Impact */}
        {!!Object.keys(profile.employeeImpact||{}).length && (
          <Section title="Employee Impact Assessment" icon={<Icon.People className="w-5 h-5"/>} color={COLORS.orange}>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(profile.employeeImpact).map(([k,v])=> (<Row key={k} label={tcap(k)} value={v} />))}
            </div>
          </Section>
        )}

        <footer className="mt-10 pt-6 border-t text-center text-sm text-gray-600">
          <p className="font-semibold">Best Companies for Working with Cancer: Employer Index</p>
          <p className="mt-1">© {new Date().getFullYear()} Cancer and Careers &amp; CEW Foundation</p>
          <p className="mt-1 text-xs">All responses collected and analyzed by BEYOND Insights, LLC</p>
        </footer>
      </main>

      <style jsx>{`
        @media print {
          @page { margin: 0.6in; size: letter; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          section { break-inside: avoid; }
          .border { border-color: #E5E7EB !important; }
        }
      `}</style>
    </div>
  );
}

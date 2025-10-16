'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const COLORS = {
  purple: '#6B2C91',
  orange: '#F97316',
  teal:   '#14B8A6',
  gray:   { dark: '#111827', medium: '#6B7280', light: '#E5E7EB', bg: '#F9FAFB' },
};

/* =========================
   CAC Brand Marks (inline SVG)
   ========================= */
const CACLogo = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 180 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Cancer and Careers">
    <rect x="0" y="0" width="180" height="44" rx="8" fill={COLORS.purple} />
    <text x="14" y="28" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="16" fill="white">
      Cancer and Careers
    </text>
  </svg>
);

const CACAwardMark = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="CAC Employer Index">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="60" y2="60">
        <stop offset="0" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#F97316" />
      </linearGradient>
    </defs>
    <circle cx="30" cy="30" r="28" stroke="url(#g)" strokeWidth="2.5" fill="white" />
    <path d="M18 33c3.5-6.5 9-10 12-10s8.5 3.5 12 10" stroke={COLORS.purple} strokeWidth="2.2" fill="none" />
    <circle cx="30" cy="26" r="4.2" fill={COLORS.purple} />
    <text x="30" y="50" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="7" fill={COLORS.gray.dark}>
      EMPLOYER INDEX
    </text>
  </svg>
);

/* =============== Icons (custom SVG) =============== */
const IconBack = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const IconPrint = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M6 9V3h12v6" /><rect x="6" y="13" width="12" height="8" rx="1.5" /><path d="M6 13h12" />
  </svg>
);
const IconDownload = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
  </svg>
);
const IconBuilding = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
  </svg>
);
const IconUserCard = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="11" r="2.5" />
    <path d="M3 16c2.2-2.5 5.8-2.5 8 0" />
    <path d="M14 9h5M14 12h5M14 15h3" />
  </svg>
);
const IconBriefcase = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="3" y="7" width="18" height="12" rx="2" />
    <path d="M7 7V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" />
    <path d="M3 12h18" />
  </svg>
);
const IconShield = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M12 3l7 4v5c0 4.97-3 9-7 9s-7-4.03-7-9V7l7-4z" />
  </svg>
);
const IconGrid = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </svg>
);
const IconLink = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 5" />
    <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 19" />
  </svg>
);
const IconPeople = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="8" cy="10" r="3" />
    <path d="M2 20c0-3.3137 2.6863-6 6-6" />
    <circle cx="17" cy="10" r="3" />
    <path d="M16 14c3.3137 0 6 2.6863 6 6" />
  </svg>
);

/* ========================= Utilities ========================= */
const dimensionNames: Record<number, string> = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources',
  5: 'Workplace Accommodations',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention, Wellness & Legal Compliance',
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness', // D13 intentionally 5-pt (Unsure/NA)
};

function titleize(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^./, (m) => m.toUpperCase());
}

function isHiddenFirmoField(k: string) {
  const lower = k.toLowerCase();
  return lower === 's1' || lower.includes('birth') || lower.includes('age');
}

function pillForLikert(value: string) {
  const v = value.toLowerCase();
  let cls = 'bg-purple-50 text-purple-800 border border-purple-200';
  if (v.includes('offer consistently') || v.includes('currently offer')) cls = 'bg-green-50 text-green-800 border border-green-200';
  else if (v.includes('offer in at least one') || v.includes('offer to eligible')) cls = 'bg-blue-50 text-blue-800 border border-blue-200';
  else if (v.includes('plan to offer')) cls = 'bg-yellow-50 text-yellow-800 border border-yellow-200';
  else if (v.includes('do not plan')) cls = 'bg-gray-100 text-gray-800 border border-gray-200';
  else if (v.includes('not applicable') || v.includes('unsure')) cls = 'bg-gray-50 text-gray-600 border border-gray-200';
  return <span className={`px-3 py-1 rounded-full text-sm font-medium ${cls}`}>{value}</span>;
}

/* ========================= Small Components ========================= */
function Section({
  title, icon, color, children, badge,
}: {
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode; badge?: string;
}) {
  return (
    <section className="mb-8 print:break-inside-avoid">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: color + '15', color }}>{icon}</div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        {badge && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-300 text-gray-700 bg-white">
            {badge}
          </span>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">{children}</div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: any }) {
  if (Array.isArray(value)) {
    return (
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-600 mb-1">{label}</div>
        <div className="flex flex-wrap gap-2">
          {value.map((v, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-sm border bg-gray-50 text-gray-800 border-gray-200">
              {String(v)}
            </span>
          ))}
        </div>
      </div>
    );
  }
  const display = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  return (
    <div className="mb-4">
      <div className="text-sm font-semibold text-gray-600 mb-1">{label}</div>
      <div className="text-gray-900 whitespace-pre-wrap">{display}</div>
    </div>
  );
}

/* ========================= Page ========================= */
export default function CompanyProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // map HR POC from firmographics (common keys; adjust to your exact schema)
  const deriveHRPOC = (firmo: any, accountEmail: string) => {
    const name =
      [firmo?.contactFirst, firmo?.contactLast].filter(Boolean).join(' ') ||
      firmo?.contactName || firmo?.hr_name || '';
    const title = firmo?.contactTitle || firmo?.hr_title || firmo?.title || '';
    const email = firmo?.contactEmail || firmo?.hr_email || accountEmail || '';
    const phone = firmo?.contactPhone || firmo?.hr_phone || firmo?.phone || '';
    const department = firmo?.s3 || firmo?.department || '';
    return { name, title, email, phone, department };
  };

  useEffect(() => {
    const firmographics = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const general = JSON.parse(localStorage.getItem('general-benefits_data') || '{}');
    const current = JSON.parse(localStorage.getItem('current-support_data') || '{}');

    const dimensions: Array<{ number: number; data: any }> = [];
    for (let i = 1; i <= 13; i++) {
      const dimData = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      if (Object.keys(dimData).length > 0) dimensions.push({ number: i, data: dimData });
    }

    const crossDimensional = JSON.parse(localStorage.getItem('cross-dimensional_data') || '{}');
    const employeeImpact = JSON.parse(localStorage.getItem('employee-impact_data') || '{}');
    const authEmail = localStorage.getItem('auth_email') || '';

    setProfile({
      companyName: firmographics.companyName || firmographics.s8 || 'Your Organization',
      email: authEmail,
      hrPOC: deriveHRPOC(firmographics, authEmail),
      firmographics,
      general,
      current,
      dimensions,
      crossDimensional,
      employeeImpact,
    });
    setLoading(false);
  }, []);

  const printToPDF = () => window.print();

  const downloadTxt = () => {
    const { companyName, firmographics, general, current, dimensions, crossDimensional, employeeImpact, hrPOC } = profile;
    let out = `COMPANY PROFILE — ${companyName}\nGenerated: ${new Date().toLocaleString()}\n\n`;
    out += '='.repeat(90) + '\n\n';

    out += 'ORGANIZATION PROFILE\n' + '-'.repeat(90) + '\n';
    Object.entries(firmographics).forEach(([k, v]) => {
      if (!v || isHiddenFirmoField(k)) return;
      out += `${titleize(k)}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}\n`;
    });
    out += '\n';

    out += 'HR POINT OF CONTACT\n' + '-'.repeat(90) + '\n';
    ['name', 'title', 'department', 'email', 'phone'].forEach((k) => {
      const val = hrPOC?.[k as keyof typeof hrPOC];
      if (val) out += `${titleize(k)}: ${val}\n`;
    });
    out += '\n';

    if (Object.keys(general || {}).length) {
      out += 'GENERAL BENEFITS\n' + '-'.repeat(90) + '\n';
      Object.entries(general).forEach(([k, v]) => v && (out += `${titleize(k)}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}\n`));
      out += '\n';
    }

    if (Object.keys(current || {}).length) {
      out += 'CURRENT SUPPORT\n' + '-'.repeat(90) + '\n';
      Object.entries(current).forEach(([k, v]) => v && (out += `${titleize(k)}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}\n`));
      out += '\n';
    }

    dimensions.forEach(({ number, data }: any) => {
      out += `DIMENSION ${number}: ${dimensionNames[number]}\n` + '-'.repeat(90) + '\n';
      Object.entries(data).forEach(([k, v]) => v && (out += `${titleize(k)}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}\n`));
      out += '\n';
    });

    const blob = new Blob([out], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `${companyName.replace(/\s+/g, '_')}_Company_Profile.txt`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const data = { ...profile, generatedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `${profile.companyName.replace(/\s+/g, '_')}_Company_Profile.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const firmoPairs = useMemo(() => {
    const entries = Object.entries(profile?.firmographics || {}).filter(
      ([k, v]) => v && !isHiddenFirmoField(k)
    );
    return entries;
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[--tw-ring-color]" style={{ ['--tw-ring-color' as any]: COLORS.purple }} />
          <p className="mt-4 text-gray-600 text-base">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(249,250,251)]">
      {/* Action Bar (hidden on print) */}
      <div className="print:hidden bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={() => router.push('/dashboard')} className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <IconBack className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={printToPDF} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50">
              <IconPrint className="w-5 h-5" />
              <span className="font-semibold">Download PDF</span>
            </button>
            <button onClick={downloadTxt} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50">
              <IconDownload className="w-5 h-5" />
              <span className="font-semibold">Download .TXT</span>
            </button>
            <button onClick={downloadJson} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50">
              <IconDownload className="w-5 h-5" />
              <span className="font-semibold">Download .JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header with CAC branding */}
      <header className="bg-gradient-to-r from-[#6B2C91] to-[#4f1f6a] text-white py-10 print:py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{profile.companyName}</h1>
              <p className="text-sm opacity-90 mt-1">Comprehensive Workplace Support Profile</p>
              <p className="text-xs opacity-80 mt-1">Generated: {new Date().toLocaleDateString()}</p>
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
        <Section title="Organization Snapshot" icon={<IconBuilding className="w-5 h-5" />} color={COLORS.purple}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {firmoPairs.map(([k, v]) => (
              <DetailItem key={k} label={titleize(k)} value={v} />
            ))}
          </div>
        </Section>

        {/* HR Point of Contact (all details except age) */}
        <Section title="HR Point of Contact" icon={<IconUserCard className="w-5 h-5" />} color={COLORS.teal}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.hrPOC?.name && <DetailItem label="Name" value={profile.hrPOC.name} />}
            {profile.hrPOC?.title && <DetailItem label="Title" value={profile.hrPOC.title} />}
            {profile.hrPOC?.department && <DetailItem label="Department" value={profile.hrPOC.department} />}
            {profile.hrPOC?.email && <DetailItem label="Email" value={profile.hrPOC.email} />}
            {profile.hrPOC?.phone && <DetailItem label="Phone" value={profile.hrPOC.phone} />}
          </div>
        </Section>

        {/* General Benefits */}
        {!!Object.keys(profile.general || {}).length && (
          <Section title="General Employee Benefits" icon={<IconBriefcase className="w-5 h-5" />} color={COLORS.teal}>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(profile.general).map(([k, v]) => (v ? <DetailItem key={k} label={titleize(k)} value={v} /> : null))}
            </div>
          </Section>
        )}

        {/* Current Support */}
        {!!Object.keys(profile.current || {}).length && (
          <Section title="Current Support for Employees Managing Cancer" icon={<IconShield className="w-5 h-5" />} color={COLORS.orange}>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(profile.current).map(([k, v]) => (v ? <DetailItem key={k} label={titleize(k)} value={v} /> : null))}
            </div>
          </Section>
        )}

        {/* Dimensions */}
        {profile.dimensions?.map((dim: any) => (
          <Section
            key={dim.number}
            title={`Dimension ${dim.number}: ${dimensionNames[dim.number] || ''}`}
            icon={<IconGrid className="w-5 h-5" />}
            color={COLORS.purple}
            badge={dim.number === 13 ? 'D13 uses 5-point scale (Incl. Unsure/NA)' : undefined}
          >
            <div className="space-y-4">
              {Object.entries(dim.data).map(([k, v]) => {
                if (!v) return null;
                if (Array.isArray(v)) return <DetailItem key={k} label={titleize(k)} value={v} />;
                if (typeof v === 'string') {
                  return (
                    <div key={k} className="flex items-start justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-800 pr-4">{titleize(k)}</span>
                      <span>{pillForLikert(v)}</span>
                    </div>
                  );
                }
                return <DetailItem key={k} label={titleize(k)} value={v} />;
              })}
            </div>
          </Section>
        ))}

        {/* Cross-Dimensional */}
        {!!Object.keys(profile.crossDimensional || {}).length && (
          <Section title="Cross-Dimensional Assessment" icon={<IconLink className="w-5 h-5" />} color={COLORS.teal}>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(profile.crossDimensional).map(([k, v]) => (v ? <DetailItem key={k} label={titleize(k)} value={v} /> : null))}
            </div>
          </Section>
        )}

        {/* Employee Impact */}
        {!!Object.keys(profile.employeeImpact || {}).length && (
          <Section title="Employee Impact Assessment" icon={<IconPeople className="w-5 h-5" />} color={COLORS.orange}>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(profile.employeeImpact).map(([k, v]) => (v ? <DetailItem key={k} label={titleize(k)} value={v} /> : null))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center text-sm text-gray-600">
          <p className="font-semibold">Best Companies for Working with Cancer: Employer Index</p>
          <p className="mt-1">© {new Date().getFullYear()} Cancer and Careers &amp; CEW Foundation</p>
          <p className="mt-1 text-xs">All responses collected and analyzed by BEYOND Insights, LLC</p>
        </div>
      </main>

      <style jsx>{`
        @media print {
          @page { margin: 0.6in; size: letter; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          section { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

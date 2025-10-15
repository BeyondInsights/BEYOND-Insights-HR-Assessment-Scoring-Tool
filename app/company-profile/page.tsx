'use client'
import React, { useEffect, useState } from 'react'

// CAC Brand Colors
const COLORS = {
  purple: { primary: '#6B2C91', light: '#8B4DB3', bg: '#F3E8FF', border: '#D8B4FE' },
  orange: { primary: '#F97316', light: '#FB923C', bg: '#FFF4ED', border: '#FED7AA' },
  teal: { primary: '#14B8A6', light: '#2DD4BF', bg: '#F0FDFA', border: '#99F6E4' },
  gray: { dark: '#1F2937', medium: '#6B7280', light: '#D1D5DB', bg: '#F9FAFB' }
};

// SVG Icons
const Icons = {
  Building: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
    </svg>
  ),
  Heart: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Shield: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  TrendUp: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Award: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  Print: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Download: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
};

const CACLogo = () => (
  <div className="flex items-center justify-center gap-3 mb-4">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="8" fill={COLORS.purple.primary}/>
      <path d="M24 12c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="white"/>
      <circle cx="24" cy="24" r="4" fill={COLORS.teal.primary}/>
    </svg>
    <div className="text-white">
      <div className="font-bold text-lg">Cancer and Careers</div>
      <div className="text-sm opacity-90">Best Companies for Working with Cancer</div>
    </div>
  </div>
);

export default function CompanyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const dimensionNames = {
    1: "Medical Leave & Flexibility",
    2: "Insurance & Financial Protection",
    3: "Manager Preparedness & Capability",
    4: "Navigation & Expert Resources",
    5: "Workplace Accommodations",
    6: "Culture & Psychological Safety",
    7: "Career Continuity & Advancement",
    8: "Return-to-Work Excellence",
    9: "Executive Commitment & Resources",
    10: "Caregiver & Family Support",
    11: "Prevention, Wellness & Legal Compliance",
    12: "Continuous Improvement & Outcomes",
    13: "Communication & Awareness"
  };

  useEffect(() => {
    const firmographics = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const general = JSON.parse(localStorage.getItem('general-benefits_data') || '{}');
    const current = JSON.parse(localStorage.getItem('current-support_data') || '{}');
    
    const dimensions = [];
    for (let i = 1; i <= 13; i++) {
      const dimData = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      if (Object.keys(dimData).length > 0) {
        dimensions.push({ number: i, data: dimData });
      }
    }

    const crossDimensional = JSON.parse(localStorage.getItem('cross-dimensional_data') || '{}');
    const employeeImpact = JSON.parse(localStorage.getItem('employee-impact_data') || '{}');

    setProfile({
      companyName: firmographics.companyName || 'Your Organization',
      firmographics,
      general,
      current,
      dimensions,
      crossDimensional,
      employeeImpact,
      email: localStorage.getItem('auth_email') || ''
    });
    setLoading(false);
  }, []);

  const handlePrint = () => window.print();

  const handleDownload = () => {
    let report = `COMPANY PROFILE REPORT\n${profile.companyName}\nGenerated: ${new Date().toLocaleDateString()}\n\n${'='.repeat(60)}\n\n`;
    report += `ORGANIZATION PROFILE\n${'-'.repeat(60)}\n`;
    Object.entries(profile.firmographics).forEach(([key, value]) => {
      if (value && key !== 'companyName') report += `${key}: ${JSON.stringify(value)}\n`;
    });
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.companyName.replace(/\s+/g, '_')}_Profile.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: COLORS.gray.bg}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{borderColor: COLORS.purple.primary}}></div>
          <p className="mt-4" style={{color: COLORS.gray.medium}}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: COLORS.gray.bg}}>
      {/* Header - Hidden when printing */}
      <div className="print:hidden bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{color: COLORS.purple.primary}}>
              <Icons.Building />
            </div>
            <h1 className="text-2xl font-bold" style={{color: COLORS.gray.dark}}>Company Profile</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 rounded-lg transition-all hover:shadow-md"
              style={{borderColor: COLORS.gray.light, color: COLORS.gray.dark}}
            >
              <Icons.Print />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all hover:shadow-lg"
              style={{backgroundColor: COLORS.purple.primary}}
            >
              <Icons.Download />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block bg-white p-8 border-b-2" style={{borderColor: COLORS.purple.primary}}>
        <div className="text-center mb-4">
          <CACLogo />
        </div>
        <h1 className="text-3xl font-bold text-center mb-2" style={{color: COLORS.gray.dark}}>{profile.companyName}</h1>
        <p className="text-lg text-center" style={{color: COLORS.gray.medium}}>Workplace Support Profile</p>
        <p className="text-sm text-center mt-2" style={{color: COLORS.gray.medium}}>Generated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 print:py-4">
        {/* Company Header Card */}
        <div className="rounded-xl shadow-lg p-8 mb-8 text-white print:shadow-none" 
             style={{background: `linear-gradient(135deg, ${COLORS.purple.primary} 0%, ${COLORS.purple.light} 100%)`}}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">{profile.companyName}</h2>
              <p className="text-purple-100 text-lg">Best Companies for Working with Cancer Assessment</p>
              {profile.email && <p className="text-purple-100 text-sm mt-2">Contact: {profile.email}</p>}
            </div>
            <div className="print:hidden" style={{color: 'rgba(255,255,255,0.5)'}}>
              <Icons.Award />
            </div>
          </div>
        </div>

        {/* Organization Profile */}
        <ProfileSection icon={<Icons.Building />} title="Organization Profile" color={COLORS.purple}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.firmographics.s8 && <DataItem label="Organization Size" value={profile.firmographics.s8} />}
            {profile.firmographics.s9 && <DataItem label="Headquarters Location" value={profile.firmographics.s9} />}
            {profile.firmographics.s9a && <DataItem label="Countries with Operations" value={profile.firmographics.s9a} />}
            {profile.firmographics.c2 && <DataItem label="Industry" value={profile.firmographics.c2} />}
            {profile.firmographics.c4 && <DataItem label="Annual Revenue" value={profile.firmographics.c4} />}
            {profile.firmographics.c6 && <DataItem label="Remote/Hybrid Policy" value={profile.firmographics.c6} />}
          </div>
        </ProfileSection>

        {/* General Benefits */}
        {Object.keys(profile.general).length > 0 && (
          <ProfileSection icon={<Icons.Heart />} title="General Employee Benefits" color={COLORS.teal}>
            {profile.general.gb1 && Array.isArray(profile.general.gb1) && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2" style={{color: COLORS.gray.dark}}>Current Benefits:</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.general.gb1.map((benefit, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-sm"
                          style={{backgroundColor: COLORS.teal.bg, color: COLORS.teal.primary}}>
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.general.gb2 && <DataItem label="Benefits Package Characterization" value={profile.general.gb2} />}
            {profile.general.cb3 && Array.isArray(profile.general.cb3) && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2" style={{color: COLORS.gray.dark}}>Conditions Supported:</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.general.cb3.map((condition, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-sm"
                          style={{backgroundColor: COLORS.purple.bg, color: COLORS.purple.primary}}>
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </ProfileSection>
        )}

        {/* Current Support */}
        {Object.keys(profile.current).length > 0 && (
          <ProfileSection icon={<Icons.Shield />} title="Current Support for Employees Managing Cancer" color={COLORS.orange}>
            {profile.current.or1 && (
              <div className="mb-4 p-4 rounded-lg" style={{backgroundColor: COLORS.orange.bg}}>
                <h4 className="font-semibold mb-2" style={{color: COLORS.gray.dark}}>Support Level:</h4>
                <p style={{color: COLORS.gray.dark}} dangerouslySetInnerHTML={{ __html: profile.current.or1 }} />
              </div>
            )}
            {profile.current.or2a && Array.isArray(profile.current.or2a) && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2" style={{color: COLORS.gray.dark}}>Triggers for Support Development:</h4>
                <ul className="list-disc list-inside space-y-1" style={{color: COLORS.gray.medium}}>
                  {profile.current.or2a.map((trigger, idx) => <li key={idx}>{trigger}</li>)}
                </ul>
              </div>
            )}
            {profile.current.or2b && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2" style={{color: COLORS.gray.dark}}>Most Impactful Change:</h4>
                <p className="italic" style={{color: COLORS.gray.medium}}>{profile.current.or2b}</p>
              </div>
            )}
          </ProfileSection>
        )}

        {/* Dimensions */}
        {profile.dimensions.length > 0 && (
          <ProfileSection icon={<Icons.TrendUp />} title="13 Dimensions of Support" color={COLORS.purple}>
            <div className="space-y-4">
              {profile.dimensions.map(dim => (
                <div key={dim.number} className="pl-4 py-2" style={{borderLeft: `4px solid ${COLORS.purple.primary}`}}>
                  <h4 className="font-bold mb-1" style={{color: COLORS.gray.dark}}>
                    Dimension {dim.number}: {dimensionNames[dim.number]}
                  </h4>
                  <p className="text-sm" style={{color: COLORS.gray.medium}}>
                    {Object.keys(dim.data).length} items completed
                  </p>
                </div>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* Additional Modules */}
        {(Object.keys(profile.crossDimensional).length > 0 || Object.keys(profile.employeeImpact).length > 0) && (
          <ProfileSection icon={<Icons.Award />} title="Additional Assessment Modules" color={COLORS.teal}>
            <div className="space-y-4">
              {Object.keys(profile.crossDimensional).length > 0 && (
                <div className="pl-4 py-2" style={{borderLeft: `4px solid ${COLORS.teal.primary}`}}>
                  <h4 className="font-bold mb-1" style={{color: COLORS.gray.dark}}>Cross-Dimensional Assessment</h4>
                  <p className="text-sm" style={{color: COLORS.gray.medium}}>
                    {Object.keys(profile.crossDimensional).length} items completed
                  </p>
                </div>
              )}
              {Object.keys(profile.employeeImpact).length > 0 && (
                <div className="pl-4 py-2" style={{borderLeft: `4px solid ${COLORS.teal.primary}`}}>
                  <h4 className="font-bold mb-1" style={{color: COLORS.gray.dark}}>Employee-Impact Assessment</h4>
                  <p className="text-sm" style={{color: COLORS.gray.medium}}>
                    {Object.keys(profile.employeeImpact).length} items completed
                  </p>
                </div>
              )}
            </div>
          </ProfileSection>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm print:mt-12" style={{color: COLORS.gray.medium}}>
          <p>Generated from Best Companies for Working with Cancer: Employer Index</p>
          <p className="mt-1">© {new Date().getFullYear()} Cancer and Careers & CEW Foundation</p>
        </div>
      </div>

      <style jsx>{`
        @media print {
          @page { margin: 0.5in; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

function ProfileSection({ icon, title, color, children }) {
  return (
    <div className="border-2 rounded-xl p-6 mb-6 print:break-inside-avoid"
         style={{backgroundColor: color.bg, borderColor: color.border}}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg" style={{backgroundColor: 'white', color: color.primary}}>
          {icon}
        </div>
        <h3 className="text-xl font-bold" style={{color: COLORS.gray.dark}}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DataItem({ label, value }) {
  if (!value) return null;
  const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
  return (
    <div className="mb-3">
      <dt className="text-sm font-semibold mb-1" style={{color: COLORS.gray.medium}}>{label}</dt>
      <dd className="text-base" style={{color: COLORS.gray.dark}}>{displayValue}</dd>
    </div>
  );
}

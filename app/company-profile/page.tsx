'use client';

import React, { useEffect, useState } from 'react';

const BRAND = {
  primary: '#6B2C91',
  orange: '#F97316',
  gray: { 900: '#0F172A', 700: '#334155', 600: '#475569', 400: '#94A3B8', 300: '#CBD5E1', 200: '#E5E7EB', bg: '#F9FAFB' },
};

const DIM_TITLES: Record<number, string> = {
  1: 'Medical Leave & Flexibility', 2: 'Insurance & Financial Protection', 3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources', 5: 'Workplace Accommodations', 6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement', 8: 'Return-to-Work Excellence', 9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support', 11: 'Prevention, Wellness & Legal Compliance',
  12: 'Continuous Improvement & Outcomes', 13: 'Communication & Awareness',
};

const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const GridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const TrendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

export default function CompanyProfile() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    const gen = JSON.parse(localStorage.getItem('general-benefits_data') || localStorage.getItem('general_benefits_data') || '{}');
    const cur = JSON.parse(localStorage.getItem('current-support_data') || localStorage.getItem('current_support_data') || '{}');
    const cross = JSON.parse(localStorage.getItem('cross_dimensional_data') || '{}');
    const impact = JSON.parse(localStorage.getItem('employee_impact_data') || '{}');

    const dims: any[] = [];
    for (let i = 1; i <= 13; i++) {
      const raw = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      if (Object.keys(raw).length > 0) {
        dims.push({ number: i, name: DIM_TITLES[i], data: raw });
      }
    }

    const companyName = localStorage.getItem('login_company_name') || firmo.companyName || firmo.company_name || firmo.s8 || 'Organization';
    const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email') || '';
    const firstName = localStorage.getItem('login_first_name') || '';
    const lastName = localStorage.getItem('login_last_name') || '';

    setData({ companyName, email, firstName, lastName,
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      firmographics: firmo, general: gen, current: cur, cross, impact, dimensions: dims,
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: BRAND.gray.bg }}>
        <div className="text-sm" style={{ color: BRAND.gray[600] }}>Loading…</div>
      </div>
    );
  }

  const firmo = data.firmographics || {};
  const gen = data.general || {};
  const cur = data.current || {};

  const formatArray = (val: any) => {
    if (!val) return null;
    if (Array.isArray(val)) return val.filter(Boolean).join(', ') || null;
    if (typeof val === 'object') return Object.keys(val).filter(k => val[k]).join(', ') || null;
    return val;
  };

  const poc = {
    name: `${data.firstName} ${data.lastName}`.trim() || null,
    email: data.email || null,
    department: firmo?.s4a || firmo?.s3 || null,
    jobFunction: firmo?.s4b || null,
    title: firmo?.s5 || null,
    responsibilities: formatArray(firmo?.s6),
    influence: firmo?.s7 || null,
  };

  const company = { name: data.companyName, industry: firmo?.c2 || null, revenue: firmo?.c5 || null,
    size: firmo?.s8 || null, hq: firmo?.s9 || null, countries: firmo?.s9a || null, };

  const benefits = { nationalHealthcare: gen?.cb1a || null, eligibility: gen?.c3 || firmo?.c3 || null,
    standard: formatArray(gen?.cb1_standard), leave: formatArray(gen?.cb1_leave), wellness: formatArray(gen?.cb1_wellness),
    financial: formatArray(gen?.cb1_financial), navigation: formatArray(gen?.cb1_navigation), planned: formatArray(gen?.cb4), remote: firmo?.c6 || null, };

  const support = { status: cur?.cb3a || null, approach: cur?.or1 || null, excluded: formatArray(cur?.c4 || firmo?.c4),
    excludedPercent: cur?.c3 || firmo?.c3 || null, triggers: formatArray(cur?.or2a), impactfulChange: cur?.or2b || null,
    barriers: formatArray(cur?.or3), caregiver: formatArray(cur?.or5a), monitoring: formatArray(cur?.or6), };

  const Field = ({ label, value }: { label: string; value: any }) => {
    if (!value) return null;
    return (
      <div className="flex py-1.5 border-b last:border-0" style={{ borderColor: BRAND.gray[200] }}>
        <div className="w-40 pr-3 flex-shrink-0"><span className="text-xs font-semibold" style={{ color: BRAND.gray[600] }}>{label}:</span></div>
        <div className="flex-1"><span className="text-sm" style={{ color: BRAND.gray[900] }}>{value}</span></div>
      </div>
    );
  };

  const getLabel = (field: string, num: number): string => {
    if (field === `d${num}aa`) return 'Multi-country';
    if (field === `d${num}b`) return 'Additional comments';
    if (num === 1) {
      if (field === 'd1_1') return 'Paid leave weeks (USA)';
      if (field === 'd1_1b') return 'Paid leave weeks (Non-USA)';
      if (field === 'd1_2') return 'How measured';
    }
    if (num === 2) {
      if (field === 'd2_1') return 'Insurance coverage';
      if (field === 'd2_2') return 'How measured';
      if (field === 'd2_5') return 'Premium handling';
      if (field === 'd2_6') return 'Counseling provider';
    }
    if (num === 3) {
      if (field === 'd3_1') return 'Training requirement';
      if (field === 'd3_2') return 'Completion rate';
    }
    return field.replace(/_/g, ' ').replace(/^d\d+[a-z]?_?/, '');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.gray.bg }}>
      <div className="bg-white border-b" style={{ borderColor: BRAND.gray[200] }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-28" />
            <div className="flex-1 flex justify-center">
              <img src="/best-companies-2026-logo.png" alt="Award" className="h-20 w-auto" />
            </div>
            <div className="flex justify-end">
              <img src="/cancer-careers-logo.png" alt="CAC" className="h-16 w-auto" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-black mb-2" style={{ color: BRAND.primary }}>{data.companyName}</h1>
            <p className="text-base" style={{ color: BRAND.gray[600] }}>Company Profile & Survey Summary</p>
            <p className="text-sm mt-1" style={{ color: BRAND.gray[600] }}>Generated: {data.generatedAt}{data.email && ` • ${data.email}`}</p>
            <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
              <a href="/dashboard" className="px-4 py-2 text-sm font-semibold border rounded" style={{ borderColor: BRAND.gray[200], color: BRAND.gray[900] }}>Back to Dashboard</a>
              <button onClick={() => window.print()} className="px-4 py-2 text-sm font-semibold rounded text-white" style={{ backgroundColor: BRAND.primary }}>Print PDF</button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white border-2 rounded-lg p-4" style={{ borderColor: BRAND.primary, borderLeftWidth: '6px' }}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ color: BRAND.primary }}><BuildingIcon /></div>
              <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>Company Profile</h2>
            </div>
            <div><Field label="Company Name" value={company.name} /><Field label="Industry" value={company.industry} /><Field label="Revenue" value={company.revenue} /><Field label="Size" value={company.size} /><Field label="HQ" value={company.hq} /><Field label="Countries" value={company.countries} /></div>
          </div>

          <div className="bg-white border-2 rounded-lg p-4" style={{ borderColor: BRAND.orange, borderLeftWidth: '6px' }}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ color: BRAND.orange }}><UserIcon /></div>
              <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>Point of Contact</h2>
            </div>
            <div><Field label="Name" value={poc.name} /><Field label="Email" value={poc.email} /><Field label="Department" value={poc.department} /><Field label="Function" value={poc.jobFunction} /><Field label="Title" value={poc.title} /><Field label="Responsibilities" value={poc.responsibilities} /><Field label="Influence" value={poc.influence} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white border-2 rounded-lg p-4" style={{ borderColor: '#0D9488', borderLeftWidth: '6px' }}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ color: '#0D9488' }}><GridIcon /></div>
              <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>General Benefits</h2>
            </div>
            <div><Field label="National Healthcare %" value={benefits.nationalHealthcare} /><Field label="Eligibility %" value={benefits.eligibility} /><Field label="Standard" value={benefits.standard} /><Field label="Leave" value={benefits.leave} /><Field label="Wellness" value={benefits.wellness} /><Field label="Financial" value={benefits.financial} /><Field label="Navigation" value={benefits.navigation} /><Field label="Planned" value={benefits.planned} /><Field label="Remote Policy" value={benefits.remote} /></div>
          </div>

          <div className="bg-white border-2 rounded-lg p-4" style={{ borderColor: '#F59E0B', borderLeftWidth: '6px' }}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ color: '#F59E0B' }}><TrendIcon /></div>
              <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>Cancer Support</h2>
            </div>
            <div><Field label="Status" value={support.status} /><Field label="Approach" value={support.approach} /><Field label="% Excluded" value={support.excludedPercent} /><Field label="Excluded Groups" value={support.excluded} /><Field label="Triggers" value={support.triggers} /><Field label="Impactful Change" value={support.impactfulChange} /><Field label="Barriers" value={support.barriers} /><Field label="Caregiver" value={support.caregiver} /><Field label="Monitoring" value={support.monitoring} /></div>
          </div>
        </div>

        {data.dimensions && data.dimensions.length > 0 && (
          <div className="mb-4">
            <div className="text-center mb-4 p-4 rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.orange} 100%)` }}>
              <h2 className="text-3xl font-bold text-white">13 Dimensions of Support</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.dimensions.map((dim: any) => {
                const colors = ['#6B2C91', '#F97316', '#0D9488', '#F59E0B', '#10B981', '#3B82F6'];
                const color = colors[(dim.number - 1) % colors.length];
                return (
                  <div key={dim.number} className="bg-white border-2 rounded-lg overflow-hidden" style={{ borderColor: color }}>
                    <div className="px-4 py-3" style={{ backgroundColor: color }}>
                      <h3 className="text-base font-bold text-white">Dimension {dim.number}: {dim.name}</h3>
                    </div>
                    <div className="p-4">
                      {Object.entries(dim.data).map(([field, value]: [string, any]) => {
                        if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) return null;
                        if (field.match(/^d\d+_?b$/i) && !value) return null;

                        if (value && typeof value === 'object' && !Array.isArray(value)) {
                          return (
                            <div key={field} className="mb-2">
                              <div className="text-xs font-bold mb-1 uppercase" style={{ color: BRAND.gray[700] }}>Assessment:</div>
                              {Object.entries(value).map(([k, v]: [string, any]) => {
                                if (!v) return null;
                                return (
                                  <div key={k} className="flex py-1 border-b last:border-0 text-xs" style={{ borderColor: BRAND.gray[200] }}>
                                    <div className="w-1/2 pr-2" style={{ color: BRAND.gray[700] }}>{k}</div>
                                    <div className="w-1/2" style={{ color: BRAND.gray[900] }}>{v}</div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        const label = getLabel(field, dim.number);
                        const val = formatArray(value);
                        if (!val) return null;

                        return (
                          <div key={field} className="flex py-1 border-b last:border-0" style={{ borderColor: BRAND.gray[200] }}>
                            <div className="w-1/3 pr-2 text-xs font-semibold" style={{ color: BRAND.gray[600] }}>{label}:</div>
                            <div className="w-2/3 text-xs" style={{ color: BRAND.gray[900] }}>{val}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(Object.keys(data.cross || {}).length > 0 || Object.keys(data.impact || {}).length > 0) && (
          <div className="mb-4">
            <div className="text-center mb-4 p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)' }}>
              <h2 className="text-2xl font-bold text-white">Additional Assessments</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.keys(data.cross || {}).length > 0 && (
                <div className="bg-white border-2 rounded-lg overflow-hidden" style={{ borderColor: '#10B981' }}>
                  <div className="px-4 py-3" style={{ backgroundColor: '#10B981' }}>
                    <h3 className="text-base font-bold text-white">Cross-Dimensional</h3>
                  </div>
                  <div className="p-4">
                    {Object.entries(data.cross).map(([k, v]: [string, any]) => {
                      const val = formatArray(v);
                      if (!val) return null;
                      let label = k === 'cd1a' ? 'Top 3 Dimensions' : k === 'cd1b' ? 'Bottom 3' : k === 'cd2' ? 'Challenges' : k.toUpperCase();
                      return (
                        <div key={k} className="flex py-1 border-b last:border-0" style={{ borderColor: BRAND.gray[200] }}>
                          <div className="w-1/3 pr-2 text-xs font-semibold" style={{ color: BRAND.gray[600] }}>{label}:</div>
                          <div className="w-2/3 text-xs" style={{ color: BRAND.gray[900] }}>{val}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {Object.keys(data.impact || {}).length > 0 && (
                <div className="bg-white border-2 rounded-lg overflow-hidden" style={{ borderColor: '#3B82F6' }}>
                  <div className="px-4 py-3" style={{ backgroundColor: '#3B82F6' }}>
                    <h3 className="text-base font-bold text-white">Employee Impact</h3>
                  </div>
                  <div className="p-4">
                    {Object.entries(data.impact).map(([k, v]: [string, any]) => {
                      const val = formatArray(v);
                      if (!val) return null;
                      let label = k === 'ei1' ? 'Impact Grid' : k === 'ei2' ? 'ROI Status' : k === 'ei4' ? 'Advice' : k === 'ei5' ? 'Other Conditions' : k.toUpperCase();
                      return (
                        <div key={k} className="flex py-1 border-b last:border-0" style={{ borderColor: BRAND.gray[200] }}>
                          <div className="w-1/3 pr-2 text-xs font-semibold" style={{ color: BRAND.gray[600] }}>{label}:</div>
                          <div className="w-2/3 text-xs" style={{ color: BRAND.gray[900] }}>{val}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t text-center text-xs" style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}>
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers & CEW Foundation
        </div>
      </main>

      <style jsx>{`@media print { @page { size: letter; margin: 0.5in; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
    </div>
  );
}

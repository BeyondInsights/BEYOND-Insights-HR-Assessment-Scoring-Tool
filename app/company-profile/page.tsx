'use client';

import React, { useEffect, useState } from 'react';

const BRAND = {
  primary: '#6B2C91',
  orange: '#F97316',
  gray: {
    900: '#0F172A', 700: '#334155', 600: '#475569',
    400: '#94A3B8', 300: '#CBD5E1', 200: '#E5E7EB',
    bg: '#F9FAFB'
  },
};

const DIM_TITLES: Record<number, string> = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources',
  5: 'Workplace Accommodations',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Return-to-Work Excellence',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention, Wellness & Legal Compliance',
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness',
};

// Custom SVG Icons
const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const GridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
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
    const general = JSON.parse(localStorage.getItem('general-benefits_data') || localStorage.getItem('general_benefits_data') || '{}');
    const current = JSON.parse(localStorage.getItem('current-support_data') || localStorage.getItem('current_support_data') || '{}');
    const cross = JSON.parse(localStorage.getItem('cross_dimensional_data') || '{}');
    const impact = JSON.parse(localStorage.getItem('employee_impact_data') || '{}');

    const dims: any[] = [];
    for (let i = 1; i <= 13; i++) {
      const raw = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}');
      dims.push({ number: i, name: DIM_TITLES[i], data: raw || {} });
    }

    const companyName = firmo.companyName || firmo.company_name || 'Organization';
    const email = localStorage.getItem('auth_email') || '';
    const firstName = localStorage.getItem('login_first_name') || '';
    const lastName = localStorage.getItem('login_last_name') || '';

    setData({
      companyName,
      email,
      firstName,
      lastName,
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      firmographics: firmo,
      general,
      current,
      cross,
      impact,
      dimensions: dims,
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
    if (Array.isArray(val)) return val.filter(Boolean).join(', ');
    if (val && typeof val === 'object') return Object.keys(val).filter(k => val[k]).join(', ');
    return val || null;
  };

  // POC data
  const poc = {
    name: `${data.firstName} ${data.lastName}`.trim() || null,
    email: data.email || null,
    department: firmo?.s4a || firmo?.s3 || null,
    jobFunction: firmo?.s4b || null,
    title: firmo?.s5 || null,
    responsibilities: formatArray(firmo?.s6),
    influence: firmo?.s7 || null,
  };

  // Company data  
  const company = {
    name: data.companyName,
    industry: firmo?.c2 || null,
    revenue: firmo?.c5 || null,
    size: firmo?.s8 || null,
    hq: firmo?.s9 || null,
    countries: firmo?.s9a || null,
  };

  // Benefits data
  const benefits = {
    nationalHealthcare: gen?.cb1a || null,
    eligibility: gen?.c3 || firmo?.c3 || null,
    standard: formatArray(gen?.cb1_standard),
    leave: formatArray(gen?.cb1_leave),
    wellness: formatArray(gen?.cb1_wellness),
    financial: formatArray(gen?.cb1_financial),
    navigation: formatArray(gen?.cb1_navigation),
    planned: formatArray(gen?.cb4),
    remote: firmo?.c6 || null,
  };

  // Current support data
  const support = {
    status: cur?.cb3a || null,
    approach: cur?.or1 || null,
    excluded: formatArray(cur?.c4 || firmo?.c4),
    excludedPercent: cur?.c3 || firmo?.c3 || null,
    triggers: formatArray(cur?.or2a),
    impactfulChange: cur?.or2b || null,
    barriers: formatArray(cur?.or3),
    caregiver: formatArray(cur?.or5a),
    monitoring: formatArray(cur?.or6),
  };

  const Field = ({ label, value }: { label: string; value: any }) => {
    const displayValue = value || '—';
    return (
      <div className="flex py-2 border-b last:border-0" style={{ borderColor: BRAND.gray[200] }}>
        <div className="w-48 pr-4 flex-shrink-0">
          <span className="text-xs font-semibold" style={{ color: BRAND.gray[600] }}>{label}:</span>
        </div>
        <div className="flex-1">
          <span className="text-sm" style={{ color: BRAND.gray[900] }}>{displayValue}</span>
        </div>
      </div>
    );
  };

  // Get READABLE labels for dimension fields
  const getDimensionFieldLabel = (field: string, dimNumber: number): string => {
    // Handle multi-country consistency
    if (field === `d${dimNumber}aa`) return 'Multi-country consistency';
    
    // Handle open-ended fields
    if (field === `d${dimNumber}b`) return 'Additional practices/comments';
    
    // Dimension-specific labels
    if (dimNumber === 1) {
      if (field === 'd1_1') return 'Additional paid medical leave weeks (USA)';
      if (field === 'd1_1b') return 'Additional paid medical leave weeks (Non-USA)';
      if (field === 'd1_2') return 'How effectiveness is measured';
      if (field === 'd1_4a') return 'Additional remote work time during treatment';
      if (field === 'd1_4b') return 'Duration of part-time/reduced schedule';
      if (field === 'd1_5_usa') return 'Job protection guarantee (USA)';
      if (field === 'd1_5_non_usa') return 'Job protection guarantee (Non-USA)';
      if (field === 'd1_6') return 'Disability benefit enhancements';
    }
    
    if (dimNumber === 2) {
      if (field === 'd2_1') return 'Additional insurance coverage details';
      if (field === 'd2_2') return 'How financial protection is measured';
      if (field === 'd2_5') return 'Health insurance premium handling during leave';
      if (field === 'd2_6') return 'Financial counseling provider';
    }
    
    if (dimNumber === 3) {
      if (field === 'd3_1') return 'Manager training requirement type';
      if (field === 'd3_2') return 'Manager training completion rate';
    }
    
    // Generic cleanup for other fields
    return field.replace(/_/g, ' ').replace(/^d\d+[a-z]?_?/, '').replace(/\b\w/g, l => l.toUpperCase()) || field;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.gray.bg }}>
      {/* HEADER - WHITE BG, LOGOS UNCHANGED */}
      <div className="bg-white border-b" style={{ borderColor: BRAND.gray[200] }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-28" />
            <div className="flex-1 flex justify-center">
              <img
                src="/best-companies-2026-logo.png"
                alt="Best Companies for Working with Cancer Award Logo"
                className="h-20 w-auto drop-shadow-md"
              />
            </div>
            <div className="flex justify-end">
              <img
                src="/cancer-careers-logo.png"
                alt="Cancer and Careers Logo"
                className="h-16 w-auto"
              />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-5xl font-black mb-2" style={{ color: BRAND.primary }}>
              {data.companyName}
            </h1>
            <p className="text-base" style={{ color: BRAND.gray[600] }}>
              Company Profile & Survey Summary
            </p>
            <p className="text-sm mt-1" style={{ color: BRAND.gray[600] }}>
              Generated: {data.generatedAt}
              {data.email && ` • ${data.email}`}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
              <a
                href="/dashboard"
                className="px-4 py-2 text-sm font-semibold border rounded"
                style={{ borderColor: BRAND.gray[200], color: BRAND.gray[900] }}
              >
                Back to Dashboard
              </a>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-semibold rounded text-white"
                style={{ backgroundColor: BRAND.primary }}
              >
                Print PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* ROW 1: Company + POC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white border-2 rounded-lg p-5" style={{ borderColor: BRAND.primary, borderLeftWidth: '6px' }}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ color: BRAND.primary }}><BuildingIcon /></div>
              <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>Company Profile</h2>
            </div>
            <div className="space-y-0">
              <Field label="Company Name" value={company.name} />
              <Field label="Industry" value={company.industry} />
              <Field label="Annual Revenue" value={company.revenue} />
              <Field label="Employee Size" value={company.size} />
              <Field label="HQ Location" value={company.hq} />
              <Field label="Countries w. Presence" value={company.countries} />
            </div>
          </div>

          <div className="bg-white border-2 rounded-lg p-5" style={{ borderColor: BRAND.orange, borderLeftWidth: '6px' }}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ color: BRAND.orange }}><UserIcon /></div>
              <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>Point of Contact</h2>
            </div>
            <div className="space-y-0">
              <Field label="Name" value={poc.name} />
              <Field label="Email" value={poc.email} />
              <Field label="Department" value={poc.department} />
              <Field label="Job Function" value={poc.jobFunction} />
              <Field label="Title/Level" value={poc.title} />
              <Field label="Responsibilities" value={poc.responsibilities} />
              <Field label="Influence Level" value={poc.influence} />
            </div>
          </div>
        </div>

        {/* ROW 2: Benefits + Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white border-2 rounded-lg p-5" style={{ borderColor: '#0D9488', borderLeftWidth: '6px' }}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ color: '#0D9488' }}><GridIcon /></div>
              <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>General Benefits</h2>
            </div>
            <div className="space-y-0">
              <Field label="% w/ National Healthcare" value={benefits.nationalHealthcare} />
              <Field label="% Eligible for Benefits" value={benefits.eligibility} />
              <Field label="Standard Benefits" value={benefits.standard} />
              <Field label="Leave Programs" value={benefits.leave} />
              <Field label="Wellness Programs" value={benefits.wellness} />
              <Field label="Financial Assistance" value={benefits.financial} />
              <Field label="Navigation Services" value={benefits.navigation} />
              <Field label="Planned Programs" value={benefits.planned} />
              <Field label="Remote/Hybrid Policy" value={benefits.remote} />
            </div>
          </div>

          <div className="bg-white border-2 rounded-lg p-5" style={{ borderColor: '#F59E0B', borderLeftWidth: '6px' }}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ color: '#F59E0B' }}><TrendIcon /></div>
              <h2 className="text-base font-bold" style={{ color: BRAND.gray[900] }}>Current Cancer Support</h2>
            </div>
            <div className="space-y-0">
              <Field label="Program Status" value={support.status} />
              <Field label="Support Approach" value={support.approach} />
              <Field label="% Excluded" value={support.excludedPercent} />
              <Field label="Excluded Groups" value={support.excluded} />
              <Field label="Development Triggers" value={support.triggers} />
              <Field label="Most Impactful Change" value={support.impactfulChange} />
              <Field label="Implementation Barriers" value={support.barriers} />
              <Field label="Caregiver Support" value={support.caregiver} />
              <Field label="Monitoring Approach" value={support.monitoring} />
            </div>
          </div>
        </div>

        {/* DIMENSIONS - 2 PER ROW WITH COLOR */}
        {data.dimensions && data.dimensions.length > 0 && (
          <div className="mb-4">
            <div className="text-center mb-4 p-4 rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.orange} 100%)` }}>
              <h2 className="text-2xl font-bold text-white">13 Dimensions of Support</h2>
              <p className="text-white text-sm mt-1 opacity-90">Comprehensive workplace support assessment</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.dimensions.map((dim: any) => {
                const dimData = dim.data || {};
                const hasData = Object.keys(dimData).length > 0;
                if (!hasData) return null;

                // Color rotation
                const colors = ['#6B2C91', '#F97316', '#0D9488', '#F59E0B', '#10B981', '#3B82F6'];
                const color = colors[(dim.number - 1) % colors.length];

                return (
                  <div key={dim.number} className="bg-white border-2 rounded-lg overflow-hidden" style={{ borderColor: color }}>
                    <div className="px-4 py-3" style={{ backgroundColor: color }}>
                      <h3 className="text-sm font-bold text-white">
                        Dimension {dim.number}: {dim.name}
                      </h3>
                    </div>
                    <div className="p-4">
                      {Object.entries(dimData).map(([field, value]: [string, any]) => {
                        // Skip open-ended "_b" fields with no content
                        if (field.match(/^d\d+_?b$/i) && !value) return null;

                        // Handle nested objects (main assessment items)
                        if (value && typeof value === 'object' && !Array.isArray(value)) {
                          return (
                            <div key={field} className="mb-3">
                              <div className="text-xs font-bold mb-2 uppercase" style={{ color: BRAND.gray[700] }}>
                                Main Assessment:
                              </div>
                              {Object.entries(value).map(([itemKey, itemValue]: [string, any]) => (
                                <div key={itemKey} className="flex py-1.5 border-b last:border-0" style={{ borderColor: BRAND.gray[200] }}>
                                  <div className="flex-1 text-xs" style={{ color: BRAND.gray[700] }}>{itemKey}</div>
                                  <div className="text-xs font-semibold" style={{ color: BRAND.gray[900] }}>{itemValue || '—'}</div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        // Regular fields with READABLE LABELS
                        const fieldLabel = getDimensionFieldLabel(field, dim.number);
                        const displayValue = formatArray(value);

                        return (
                          <div key={field} className="flex py-1.5 border-b last:border-0" style={{ borderColor: BRAND.gray[200] }}>
                            <div className="w-40 pr-2 flex-shrink-0 text-xs font-semibold" style={{ color: BRAND.gray[600] }}>
                              {fieldLabel}:
                            </div>
                            <div className="flex-1 text-xs" style={{ color: BRAND.gray[900] }}>
                              {displayValue || '—'}
                            </div>
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

        {/* ADDITIONAL ASSESSMENTS - WITH COLOR AND ICONS */}
        {(Object.keys(data.cross || {}).length > 0 || Object.keys(data.impact || {}).length > 0) && (
          <div className="mb-4">
            <div className="text-center mb-4 p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)' }}>
              <h2 className="text-xl font-bold text-white">Additional Assessments</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.keys(data.cross || {}).length > 0 && (
                <div className="bg-white border-2 rounded-lg overflow-hidden" style={{ borderColor: '#10B981' }}>
                  <div className="px-4 py-3" style={{ backgroundColor: '#10B981' }}>
                    <h3 className="text-sm font-bold text-white">Cross-Dimensional Assessment</h3>
                  </div>
                  <div className="p-4">
                    {Object.entries(data.cross).map(([key, value]: [string, any]) => {
                      const label = key.toUpperCase().replace(/_/g, ' ').replace(/CD/g, '');
                      return (
                        <div key={key} className="flex py-1.5 border-b last:border-0" style={{ borderColor: BRAND.gray[200] }}>
                          <div className="w-32 pr-2 flex-shrink-0 text-xs font-semibold" style={{ color: BRAND.gray[600] }}>
                            {label}:
                          </div>
                          <div className="flex-1 text-xs" style={{ color: BRAND.gray[900] }}>
                            {formatArray(value) || '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {Object.keys(data.impact || {}).length > 0 && (
                <div className="bg-white border-2 rounded-lg overflow-hidden" style={{ borderColor: '#3B82F6' }}>
                  <div className="px-4 py-3" style={{ backgroundColor: '#3B82F6' }}>
                    <h3 className="text-sm font-bold text-white">Employee Impact Assessment</h3>
                  </div>
                  <div className="p-4">
                    {Object.entries(data.impact).map(([key, value]: [string, any]) => {
                      const label = key.toUpperCase().replace(/_/g, ' ').replace(/EI/g, '');
                      return (
                        <div key={key} className="flex py-1.5 border-b last:border-0" style={{ borderColor: BRAND.gray[200] }}>
                          <div className="w-32 pr-2 flex-shrink-0 text-xs font-semibold" style={{ color: BRAND.gray[600] }}>
                            {label}:
                          </div>
                          <div className="flex-1 text-xs" style={{ color: BRAND.gray[900] }}>
                            {formatArray(value) || '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t text-center text-xs" style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}>
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()} Cancer and Careers & CEW Foundation •
          All responses collected and analyzed by BEYOND Insights, LLC
        </div>
      </main>

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

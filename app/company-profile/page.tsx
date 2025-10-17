'use client';

import React, { useEffect, useState } from 'react';

const BRAND = {
  primary: '#6B2C91',
  gray: {
    900: '#0F172A',
    700: '#334155',
    600: '#475569',
    400: '#94A3B8',
    300: '#CBD5E1',
    200: '#E5E7EB',
    bg: '#F9FAFB',
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

    const companyName = firmo.companyName || firmo.company_name || firmo.s8 || 'Organization';
    const email = localStorage.getItem('auth_email') || '';

    setData({
      companyName,
      email,
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
  const cd = data.cross || {};
  const ei = data.impact || {};

  // Format helpers
  const formatArray = (val: any) => {
    if (Array.isArray(val)) return val.filter(Boolean).join(', ');
    if (val && typeof val === 'object') return Object.keys(val).filter(k => val[k]).join(', ');
    return val || '—';
  };

  const selectedOnly = (val: any) => formatArray(val);

  // POC fields
  const poc = {
    name: [firmo?.contactFirst, firmo?.contactLast].filter(Boolean).join(' ') || firmo?.contactName || null,
    email: firmo?.contactEmail || data.email || null,
    title: firmo?.contactTitle || firmo?.s5 || null,
    department: firmo?.s3 || null,
    phone: firmo?.contactPhone || null,
    location: firmo?.hq || firmo?.s9 || null,
  };

  // Company fields
  const company = {
    name: data.companyName,
    industry: firmo?.c2 || null,
    revenue: firmo?.c5 || null,
    size: firmo?.s8 || null,
    hq: firmo?.s9 || null,
    countries: firmo?.s9a || null,
  };

  const Field = ({ label, value }: { label: string; value: any }) => {
    const displayValue = value || '—';
    return (
      <div className="flex py-2 border-b last:border-0" style={{ borderColor: BRAND.gray[200] }}>
        <div className="w-48 pr-4 flex-shrink-0">
          <span className="text-xs font-medium" style={{ color: BRAND.gray[600] }}>{label}:</span>
        </div>
        <div className="flex-1">
          <span className="text-sm" style={{ color: BRAND.gray[900] }}>{displayValue}</span>
        </div>
      </div>
    );
  };

  const DataRow = ({ label, selected }: { label: string; selected: any }) => (
    <div className="flex py-2 border-b last:border-0" style={{ borderColor: BRAND.gray[200] }}>
      <div className="w-64 pr-4 flex-shrink-0">
        <span className="text-xs font-medium" style={{ color: BRAND.gray[600] }}>{label}:</span>
      </div>
      <div className="flex-1">
        <span className="text-sm" style={{ color: BRAND.gray[900] }}>{selected || '—'}</span>
      </div>
    </div>
  );

  // Get readable field labels for dimension questions
  const getDimensionFieldLabel = (field: string, dimNumber: number): string => {
    // Handle different field patterns
    if (field.startsWith(`d${dimNumber}a`)) {
      // Extract the actual question key from the nested object
      return field; // Will be handled by the nested object display
    }
    if (field === `d${dimNumber}aa`) return 'Multi-country consistency';
    if (field === `d${dimNumber}b`) return 'Additional comments/practices';
    if (field === `d${dimNumber}_1`) return 'Follow-up question 1';
    if (field === `d${dimNumber}_2`) return 'Follow-up question 2';
    
    // Default: make it readable
    return field.replace(/_/g, ' ').replace(/d\d+/g, '').trim() || field;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.gray.bg }}>
      {/* HEADER - CLEAN WHITE BACKGROUND (NO DARK FILL TO PROTECT LOGOS) */}
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
              {/* CAC LOGO - ORIGINAL COLORS, NO CHANGES */}
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
        {/* ROW 1: Company Profile + POC Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>
              Company Profile
            </h2>
            <div className="space-y-0">
              <Field label="Company Name" value={company.name} />
              <Field label="Industry" value={company.industry} />
              <Field label="Annual Revenue" value={company.revenue} />
              <Field label="Employee Size" value={company.size} />
              <Field label="HQ Location" value={company.hq} />
              <Field label="Countries w. Presence" value={company.countries} />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>
              Point of Contact
            </h2>
            <div className="space-y-0">
              <Field label="Name" value={poc.name} />
              <Field label="Email" value={poc.email} />
              <Field label="Title" value={poc.title} />
              <Field label="Department" value={poc.department} />
              <Field label="Phone" value={poc.phone} />
              <Field label="Location" value={poc.location} />
            </div>
          </div>
        </div>

        {/* ROW 2: General Benefits + Current Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>
              General Benefits Landscape
            </h2>
            <div className="space-y-0">
              <Field label="% w/ National Healthcare" value={gen?.cb1a} />
              <Field label="% Eligible for Standard Benefits" value={gen?.c3 || firmo?.c3} />
              <Field label="Standard Benefits" value={selectedOnly(gen?.cb1_standard)} />
              <Field label="Leave Programs" value={selectedOnly(gen?.cb1_leave)} />
              <Field label="Wellness Programs" value={selectedOnly(gen?.cb1_wellness)} />
              <Field label="Financial Assistance" value={selectedOnly(gen?.cb1_financial)} />
              <Field label="Navigation Services" value={selectedOnly(gen?.cb1_navigation)} />
              <Field label="Planned Benefits" value={selectedOnly(gen?.cb4)} />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
            <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>
              Current Support for Cancer
            </h2>
            <div className="space-y-0">
              <Field label="Program Status" value={cur?.cb3a} />
              <Field label="Support Approach" value={cur?.or1} />
              <Field label="Excluded Groups %" value={cur?.c3 || firmo?.c3} />
              <Field label="Excluded Groups" value={selectedOnly(cur?.c4 || firmo?.c4)} />
              <Field label="What Triggers Support" value={selectedOnly(cur?.or2a)} />
              <Field label="Most Impactful Change" value={cur?.or2b} />
              <Field label="Implementation Barriers" value={selectedOnly(cur?.or3)} />
              <Field label="Caregiver Support" value={selectedOnly(cur?.or5a)} />
              <Field label="Monitoring Approach" value={selectedOnly(cur?.or6)} />
            </div>
          </div>
        </div>

        {/* DIMENSIONS - PROFESSIONAL TABLE-STYLE LAYOUT */}
        {data.dimensions.length > 0 && (
          <div className="mb-4">
            <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: BRAND.gray[900] }}>
                13 Dimensions of Support
              </h2>

              {data.dimensions.map((dim: any) => {
                // Skip if dimension has no data
                if (!dim.data || Object.keys(dim.data).length === 0) return null;

                return (
                  <div key={dim.number} className="mb-6 last:mb-0">
                    <div
                      className="px-4 py-2 mb-2 rounded font-bold text-sm"
                      style={{ backgroundColor: BRAND.primary, color: 'white' }}
                    >
                      Dimension {dim.number}: {dim.name}
                    </div>

                    <div className="pl-4 space-y-0">
                      {Object.entries(dim.data).map(([field, value]: [string, any]) => {
                        // Handle nested objects (like d1a, d2a, etc.)
                        if (value && typeof value === 'object' && !Array.isArray(value)) {
                          return (
                            <div key={field} className="mb-2">
                              <div
                                className="text-xs font-semibold uppercase py-1"
                                style={{ color: BRAND.gray[700] }}
                              >
                                Main Assessment Items:
                              </div>
                              {Object.entries(value).map(([itemKey, itemValue]: [string, any]) => (
                                <DataRow
                                  key={itemKey}
                                  label={itemKey}
                                  selected={formatArray(itemValue)}
                                />
                              ))}
                            </div>
                          );
                        }

                        // Regular fields
                        const fieldLabel = getDimensionFieldLabel(field, dim.number);
                        return (
                          <DataRow
                            key={field}
                            label={fieldLabel}
                            selected={formatArray(value)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cross-Dimensional Assessment */}
        {Object.keys(cd).length > 0 && (
          <div className="mb-4">
            <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
              <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>
                Cross-Dimensional Assessment
              </h2>
              <div className="space-y-0">
                {Object.entries(cd).map(([key, value]: [string, any]) => (
                  <DataRow
                    key={key}
                    label={key.toUpperCase().replace(/_/g, ' ')}
                    selected={formatArray(value)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Employee Impact Assessment */}
        {Object.keys(ei).length > 0 && (
          <div className="mb-4">
            <div className="bg-white border rounded-lg p-5" style={{ borderColor: BRAND.gray[200] }}>
              <h2 className="text-base font-bold mb-3" style={{ color: BRAND.gray[900] }}>
                Employee Impact Assessment
              </h2>
              <div className="space-y-0">
                {Object.entries(ei).map(([key, value]: [string, any]) => (
                  <DataRow
                    key={key}
                    label={key.toUpperCase().replace(/_/g, ' ')}
                    selected={formatArray(value)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-6 pt-4 border-t text-center text-xs"
          style={{ borderColor: BRAND.gray[200], color: BRAND.gray[700] }}
        >
          Best Companies for Working with Cancer: Employer Index • © {new Date().getFullYear()}{' '}
          Cancer and Careers & CEW Foundation • All responses collected and analyzed by BEYOND
          Insights, LLC
        </div>
      </main>

      <style jsx>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          section {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

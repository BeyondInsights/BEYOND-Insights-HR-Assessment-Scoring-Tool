'use client';

import React, { useEffect, useState } from 'react';

const BRAND = {
  primary: '#6B2C91',
  gray: {
    900:'#0F172A', 700:'#334155', 600:'#475569',
    400:'#94A3B8', 300:'#CBD5E1', 200:'#E5E7EB',
    bg:'#F9FAFB'
  },
};

export default function CompanyProfile() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
    // Try both storage keys for general benefits
    const general = JSON.parse(localStorage.getItem('general-benefits_data') || localStorage.getItem('general_benefits_data') || '{}');
    const current = JSON.parse(localStorage.getItem('current-support_data') || localStorage.getItem('current_support_data') || '{}');
    
    // Load dimensions 1-6
    const dim1 = JSON.parse(localStorage.getItem('dimension1_data') || '{}');
    const dim2 = JSON.parse(localStorage.getItem('dimension2_data') || '{}');
    const dim3 = JSON.parse(localStorage.getItem('dimension3_data') || '{}');
    const dim4 = JSON.parse(localStorage.getItem('dimension4_data') || '{}');
    const dim5 = JSON.parse(localStorage.getItem('dimension5_data') || '{}');
    const dim6 = JSON.parse(localStorage.getItem('dimension6_data') || '{}');

    // Get from authorization page storage
    const companyName = localStorage.getItem('login_company_name') || firmo.companyName || 'Organization';
    const email = localStorage.getItem('login_email') || '';
    const firstName = localStorage.getItem('login_first_name') || '';
    const lastName = localStorage.getItem('login_last_name') || '';
    const title = localStorage.getItem('login_title') || '';

    setData({
      companyName,
      email,
      firstName,
      lastName,
      title,
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      firmographics: firmo,
      general,
      current,
      dimensions: [
        { number: 1, name: 'Medical Leave & Flexibility', data: dim1 },
        { number: 2, name: 'Insurance & Financial Protection', data: dim2 },
        { number: 3, name: 'Manager Preparedness & Capability', data: dim3 },
        { number: 4, name: 'Navigation & Expert Resources', data: dim4 },
        { number: 5, name: 'Workplace Accommodations', data: dim5 },
        { number: 6, name: 'Culture & Psychological Safety', data: dim6 },
      ]
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{backgroundColor:BRAND.gray.bg}}>
        <div className="text-sm" style={{color:BRAND.gray[600]}}>Loading…</div>
      </div>
    );
  }

  const firmo = data.firmographics || {};
  const gen = data.general || {};
  const cur = data.current || {};

  // Helper to format arrays into comma-separated strings
  const formatArray = (arr: any) => {
    if (!arr) return null;
    if (Array.isArray(arr)) return arr.join(', ');
    return String(arr);
  };

  // POC data - pulled from authorization page AND firmographics
  const poc = {
    name: `${data.firstName} ${data.lastName}`.trim() || null,
    email: data.email || null,
    department: firmo?.s3 || null,
    jobFunction: firmo?.s4a || firmo?.s4b || null,
    title: data.title || firmo?.s5 || null,
    responsibilities: formatArray(firmo?.s6),
    influence: firmo?.s7 || null,
  };

  // Company data
  const company = {
    name: data.companyName,
    industry: firmo?.c2 || null,
    revenue: firmo?.c5 || null,  // c5 is revenue, NOT c4
    size: firmo?.s8 || null,
    hq: firmo?.s9 || null,
    countries: firmo?.s9a || null,
  };

  // General benefits data - ALL THE ACTUAL FIELDS
  const benefits = {
    nationalHealthcare: gen?.cb1a || null,  // % access to national healthcare
    eligibility: gen?.c3 || firmo?.c3 || null,  // % eligible for standard benefits
    // Show each category with the ACTUAL data stored
    standard: formatArray(gen?.cb1_standard),
    leave: formatArray(gen?.cb1_leave),
    wellness: formatArray(gen?.cb1_wellness),
    financial: formatArray(gen?.cb1_financial),
    navigation: formatArray(gen?.cb1_navigation),
    planned: formatArray(gen?.cb4),
    remote: firmo?.c6 || null,
  };

  // Current support data - ALL THE ACTUAL FIELDS
  const support = {
    status: cur?.cb3a || null,
    approach: cur?.or1 || null,
    excluded: cur?.c3 || firmo?.c3 ? `${cur?.c3 || firmo?.c3}${cur?.c4 || firmo?.c4 ? ' - ' + formatArray(cur.c4 || firmo.c4) : ''}` : null,
    triggers: formatArray(cur?.or2a),
    impactfulChange: cur?.or2b || null,
    barriers: formatArray(cur?.or3),
    caregiver: formatArray(cur?.or5a),
    monitoring: formatArray(cur?.or6),
  };

  const Field = ({ label, value }: {label:string; value:any}) => {
    // ALWAYS SHOW THE FIELD - use — for empty
    const displayValue = value || '—';
    return (
      <div className="flex py-1.5 border-b last:border-0" style={{borderColor:BRAND.gray[200]}}>
        <div className="w-2/5 pr-3">
          <span className="text-xs font-medium" style={{color:BRAND.gray[600]}}>{label}:</span>
        </div>
        <div className="w-3/5">
          <span className="text-xs" style={{color:BRAND.gray[900]}}>{displayValue}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{backgroundColor:BRAND.gray.bg}}>
      {/* HEADER */}
      <div className="bg-white border-b" style={{borderColor:BRAND.gray[200]}}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Centered award logo */}
          <div className="flex justify-center mb-4">
            <img
              src="/best-companies-2026-logo.png"
              alt="Best Companies for Working with Cancer Award"
              className="h-16 w-auto drop-shadow-sm"
            />
          </div>

          {/* Company name */}
          <div className="text-center">
            <h1 className="text-4xl font-black mb-1" style={{color:BRAND.primary}}>
              {data.companyName}
            </h1>
            <p className="text-sm" style={{color:BRAND.gray[600]}}>
              Company Profile & Survey Summary
            </p>
            <p className="text-xs mt-1" style={{color:BRAND.gray[600]}}>
              Generated: {data.generatedAt}
              {data.email && <span className="ml-1">• {data.email}</span>}
            </p>

            {/* Action buttons */}
            <div className="mt-3 flex items-center justify-center gap-2 print:hidden">
              <a href="/dashboard" 
                 className="px-3 py-1.5 text-xs font-medium border rounded"
                 style={{borderColor:BRAND.gray[300], color:BRAND.gray[700]}}>
                ← Dashboard
              </a>
              <button onClick={()=>window.print()}
                      className="px-3 py-1.5 text-xs font-medium rounded text-white"
                      style={{backgroundColor:BRAND.primary}}>
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
          
          {/* Company Profile */}
          <div className="bg-white border rounded-md p-4" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-base font-bold mb-3" style={{color:BRAND.gray[900]}}>
              Company Profile
            </h2>
            <div className="space-y-0">
              <Field label="Co. Name" value={company.name} />
              <Field label="Industry" value={company.industry} />
              <Field label="Annual Revenue" value={company.revenue} />
              <Field label="Employee Size" value={company.size} />
              <Field label="HQ Location" value={company.hq} />
              <Field label="# of Countries w. Presence" value={company.countries} />
            </div>
          </div>

          {/* POC Profile */}
          <div className="bg-white border rounded-md p-4" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-base font-bold mb-3" style={{color:BRAND.gray[900]}}>
              POC Profile
            </h2>
            <div className="space-y-0">
              <Field label="Name" value={poc.name} />
              <Field label="Email Address" value={poc.email} />
              <Field label="Department" value={poc.department} />
              <Field label="Primary Job Function" value={poc.jobFunction} />
              <Field label="Title / Level" value={poc.title} />
              <Field label="Responsibility / Influence" value={poc.responsibilities} />
              <Field label="Level of influence re: workplace support" value={poc.influence} />
            </div>
          </div>
        </div>

        {/* ROW 2: General Benefits + Current Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          
          {/* General Benefits Landscape */}
          <div className="bg-white border rounded-md p-4" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-base font-bold mb-3" style={{color:BRAND.gray[900]}}>
              General Benefits Landscape
            </h2>
            <div className="space-y-0">
              <Field label="% of Emp w/ access to national healthcare" value={benefits.nationalHealthcare} />
              <Field label="% of Emp eligible for Standard Benefits" value={benefits.eligibility} />
              
              <div className="py-1.5 border-b" style={{borderColor:BRAND.gray[200]}}>
                <div className="text-xs font-bold mb-1" style={{color:BRAND.gray[900]}}>Types of Benefits offered:</div>
              </div>
              <Field label="Standard Benefits offered" value={benefits.standard || '—'} />
              <Field label="Leave & flexibility programs" value={benefits.leave || '—'} />
              <Field label="Wellness & support programs" value={benefits.wellness || '—'} />
              <Field label="Financial & legal assistance programs" value={benefits.financial || '—'} />
              <Field label="Care navigation & support services" value={benefits.navigation || '—'} />
              
              <Field label="Programs plan to rollout over N2Y" value={benefits.planned} />
              <Field label="Approach to remote / hybrid work" value={benefits.remote} />
            </div>
          </div>

          {/* Current Support */}
          <div className="bg-white border rounded-md p-4" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-base font-bold mb-3" style={{color:BRAND.gray[900]}}>
              Current Support for EMCs
            </h2>
            <div className="space-y-0">
              <Field label="Status of Support Offerings" value={support.status || '—'} />
              <Field label="Current approach to supporting EMCs" value={support.approach || '—'} />
              <Field label="Emp Grps excluded from workplace support benefits" value={support.excluded || '—'} />
              <Field label="Triggers for developing programs" value={support.triggers || '—'} />
              {support.impactfulChange && (
                <Field label="Most impactful change" value={support.impactfulChange} />
              )}
              {support.barriers && (
                <Field label="Barriers to development" value={support.barriers} />
              )}
              <Field label="Primary caregiver support programs offered" value={support.caregiver || '—'} />
              <Field label="How monitor effectiveness of workplace support program" value={support.monitoring || '—'} />
            </div>
          </div>
        </div>

        {/* DIMENSIONS */}
        {data.dimensions && data.dimensions.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-3" style={{color:BRAND.gray[900]}}>
              13 Dimensions of Support
            </h2>
            
            {data.dimensions.map((dim: any) => {
              const dimData = dim.data || {};
              const hasData = Object.keys(dimData).length > 0;
              
              if (!hasData) return null;
              
              // Filter out open-ended text fields (d#b, d#_b, etc.)
              const filteredData = Object.entries(dimData).filter(([key]) => {
                // Skip open-ended fields like d2b, d4b, d5b, d1b, d2_b, etc.
                if (key.match(/^d\d+_?b$/i)) return false;
                if (key.match(/^d\d+_?b_/i)) return false; // Also skip d2b_none, etc.
                return true;
              });
              
              if (filteredData.length === 0) return null;
              
              return (
                <div key={dim.number} className="bg-white border rounded-md p-4 mb-3" style={{borderColor:BRAND.gray[200]}}>
                  <h3 className="text-sm font-bold mb-2" style={{color:BRAND.primary}}>
                    Dimension {dim.number}: {dim.name}
                  </h3>
                  <div className="space-y-0">
                    {filteredData.map(([key, value]: [string, any]) => {
                      if (typeof value === 'object' && value !== null) {
                        // Handle nested objects (like d1a, d2a, d3a grids)
                        return (
                          <div key={key} className="py-1.5 border-b" style={{borderColor:BRAND.gray[200]}}>
                            <div className="text-xs font-semibold mb-1" style={{color:BRAND.gray[600]}}>
                              {key.toUpperCase()}:
                            </div>
                            <div className="pl-3 space-y-0.5">
                              {Object.entries(value).map(([item, status]: [string, any]) => (
                                <div key={item} className="flex justify-between text-xs">
                                  <span style={{color:BRAND.gray[700]}}>{item}</span>
                                  <span style={{color:BRAND.gray[900]}} className="font-medium">{status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      } else {
                        // Handle simple key-value pairs
                        return <Field key={key} label={key} value={value || '—'} />;
                      }
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

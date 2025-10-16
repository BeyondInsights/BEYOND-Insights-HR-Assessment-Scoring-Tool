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
    const general = JSON.parse(localStorage.getItem('general-benefits_data') || '{}');
    const current = JSON.parse(localStorage.getItem('current-support_data') || '{}');

    setData({
      companyName: firmo.companyName || firmo.s8 || 'Organization',
      email: localStorage.getItem('auth_email') || '',
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      firmographics: firmo,
      general,
      current,
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

  // POC data
  const poc = {
    name: [firmo?.contactFirst, firmo?.contactLast].filter(Boolean).join(' ') || firmo?.contactName || firmo?.s2 || null,
    email: firmo?.contactEmail || data.email || null,
    department: firmo?.s3 || null,
    jobFunction: firmo?.s4a || firmo?.s4b || null,
    title: firmo?.s5 || null,
    influence: firmo?.s7 || null,
  };

  // Company data
  const company = {
    name: data.companyName,
    industry: firmo?.c2 || null,
    revenue: firmo?.c4 || firmo?.c5 || null,
    size: firmo?.s8 || null,
    hq: firmo?.s9 || null,
    countries: firmo?.s9a || null,
  };

  // General benefits data
  const benefits = {
    nationalHealthcare: firmo?.c5 || null,
    eligibility: firmo?.c3 || null,
    standardBenefits: formatArray(gen?.cb1_standard),
    leaveFlex: formatArray(gen?.cb1_leave),
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
    excluded: firmo?.c3 ? `${firmo.c3}${firmo?.c4 ? ' - ' + formatArray(firmo.c4) : ''}` : null,
    triggers: formatArray(cur?.or2a),
    caregiver: formatArray(cur?.or5a),
    monitoring: formatArray(cur?.or6),
  };

  const Field = ({ label, value }: {label:string; value:any}) => {
    if (!value || value === 'null') return null;
    return (
      <div className="flex py-1.5 border-b last:border-0" style={{borderColor:BRAND.gray[200]}}>
        <div className="w-2/5 pr-3">
          <span className="text-xs font-medium" style={{color:BRAND.gray[600]}}>{label}:</span>
        </div>
        <div className="w-3/5">
          <span className="text-xs" style={{color:BRAND.gray[900]}}>{value}</span>
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
              <Field label="Level of influence re: workplace support" value={poc.influence} />
            </div>
          </div>
        </div>

        {/* ROW 2: General Benefits + Current Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* General Benefits Landscape */}
          <div className="bg-white border rounded-md p-4" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-base font-bold mb-3" style={{color:BRAND.gray[900]}}>
              General Benefits Landscape
            </h2>
            <div className="space-y-0">
              <Field label="% of Emp w/ access to national healthcare" value={benefits.nationalHealthcare} />
              <Field label="% of Emp eligible for Standard Benefits" value={benefits.eligibility} />
              {benefits.standardBenefits && (
                <Field label="Standard Benefits offered" value={benefits.standardBenefits} />
              )}
              {benefits.leaveFlex && (
                <Field label="Leave & flexibility programs" value={benefits.leaveFlex} />
              )}
              {benefits.wellness && (
                <Field label="Wellness & support programs" value={benefits.wellness} />
              )}
              {benefits.financial && (
                <Field label="Financial & legal assistance programs" value={benefits.financial} />
              )}
              {benefits.navigation && (
                <Field label="Care navigation & support services" value={benefits.navigation} />
              )}
              {benefits.planned && (
                <Field label="Programs plan to rollout over N2Y" value={benefits.planned} />
              )}
              <Field label="Approach to remote / hybrid work" value={benefits.remote} />
            </div>
          </div>

          {/* Current Support */}
          <div className="bg-white border rounded-md p-4" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-base font-bold mb-3" style={{color:BRAND.gray[900]}}>
              Current Support for EMCs
            </h2>
            <div className="space-y-0">
              <Field label="Status of Support Offerings" value={support.status} />
              <Field label="Current approach to supporting EMCs" value={support.approach} />
              {support.excluded && (
                <Field label="Emp Grps excluded from workplace support benefits" value={support.excluded} />
              )}
              {support.triggers && (
                <Field label="Triggers for developing programs" value={support.triggers} />
              )}
              {support.caregiver && (
                <Field label="Primary caregiver support programs offered" value={support.caregiver} />
              )}
              {support.monitoring && (
                <Field label="How monitor effectiveness" value={support.monitoring} />
              )}
            </div>
          </div>
        </div>

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

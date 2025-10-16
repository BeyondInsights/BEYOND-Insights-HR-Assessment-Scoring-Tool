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
      cross,
      impact,
      dimensions: dims,
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

  const formatArray = (arr: any) => {
    if (!arr) return null;
    if (Array.isArray(arr)) return arr.join(', ');
    return String(arr);
  };

  const getDimensionFieldLabel = (key: string): string => {
    if (key.includes('aa')) return 'Multi-country consistency';
    if (key.includes('_1') && !key.includes('_1b')) return 'Additional weeks offered (USA market)';
    if (key.includes('_1b')) return 'Additional weeks offered (Non-USA markets)';
    if (key.includes('_2')) return 'How effectiveness is measured';
    if (key.includes('_4a')) return 'Additional remote work time allowed';
    if (key.includes('_4b')) return 'Part-time/reduced schedule duration';
    if (key.includes('_5_usa')) return 'Job protection guarantee (USA)';
    if (key.includes('_5_non_usa')) return 'Job protection guarantee (Non-USA)';
    if (key.includes('_6')) return 'Disability benefit enhancements';
    return key.replace(/_/g, ' ').toUpperCase();
  };

  const poc = {
    name: `${data.firstName} ${data.lastName}`.trim() || null,
    email: data.email || null,
    department: firmo?.s3 || null,
    jobFunction: firmo?.s4a || firmo?.s4b || null,
    title: data.title || firmo?.s5 || null,
    responsibilities: formatArray(firmo?.s6),
    influence: firmo?.s7 || null,
  };

  const company = {
    name: data.companyName,
    industry: firmo?.c2 || null,
    revenue: firmo?.c5 || null,
    size: firmo?.s8 || null,
    hq: firmo?.s9 || null,
    countries: firmo?.s9a || null,
  };

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
    const displayValue = value || '—';
    return (
      <div className="flex py-1.5 border-b last:border-0" style={{borderColor:BRAND.gray[200]}}>
        <div className="w-80 pr-4 flex-shrink-0">
          <span className="text-xs font-medium" style={{color:BRAND.gray[600]}}>{label}</span>
        </div>
        <div className="flex-1 text-left">
          <span className="text-xs" style={{color:BRAND.gray[900]}}>{displayValue}</span>
        </div>
      </div>
    );
  };

  const downloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen" style={{backgroundColor:BRAND.gray.bg}}>
      <div className="bg-white border-b" style={{borderColor:BRAND.gray[200]}}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-center mb-4">
            <img
              src="/best-companies-2026-logo.png"
              alt="Best Companies for Working with Cancer Award"
              className="h-16 w-auto drop-shadow-sm"
            />
          </div>

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

            <div className="mt-3 flex items-center justify-center gap-2 print:hidden">
              <a href="/dashboard" 
                 className="px-3 py-1.5 text-xs font-medium border rounded"
                 style={{borderColor:BRAND.gray[300], color:BRAND.gray[700]}}>
                ← Dashboard
              </a>
              <button onClick={downloadPDF}
                      className="px-3 py-1.5 text-xs font-medium rounded text-white"
                      style={{backgroundColor:BRAND.primary}}>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          
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
              <Field label="Standard Benefits offered" value={benefits.standard} />
              <Field label="Leave & flexibility programs" value={benefits.leave} />
              <Field label="Wellness & support programs" value={benefits.wellness} />
              <Field label="Financial & legal assistance programs" value={benefits.financial} />
              <Field label="Care navigation & support services" value={benefits.navigation} />
              
              <Field label="Programs plan to rollout over N2Y" value={benefits.planned} />
              <Field label="Approach to remote / hybrid work" value={benefits.remote} />
            </div>
          </div>

          <div className="bg-white border rounded-md p-4" style={{borderColor:BRAND.gray[200]}}>
            <h2 className="text-base font-bold mb-3" style={{color:BRAND.gray[900]}}>
              Current Support for EMCs
            </h2>
            <div className="space-y-0">
              <Field label="Status of Support Offerings" value={support.status} />
              <Field label="Current approach to supporting EMCs" value={support.approach} />
              <Field label="Emp Grps excluded from workplace support benefits" value={support.excluded} />
              <Field label="Triggers for developing programs" value={support.triggers} />
              {support.impactfulChange && (
                <Field label="Most impactful change" value={support.impactfulChange} />
              )}
              {support.barriers && (
                <Field label="Barriers to development" value={support.barriers} />
              )}
              <Field label="Primary caregiver support programs offered" value={support.caregiver} />
              <Field label="How monitor effectiveness of workplace support program" value={support.monitoring} />
            </div>
          </div>
        </div>

        {data.dimensions && data.dimensions.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-3" style={{color:BRAND.gray[900]}}>
              13 Dimensions of Support
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.dimensions.map((dim: any) => {
                const dimData = dim.data || {};
                const hasData = Object.keys(dimData).length > 0;
                
                if (!hasData) return null;
                
                const filteredData = Object.entries(dimData).filter(([key]) => {
                  if (key.match(/^d\d+_?b$/i)) return false;
                  if (key.match(/^d\d+_?b_/i)) return false;
                  return true;
                });
                
                if (filteredData.length === 0) return null;
                
                return (
                  <div key={dim.number} className="bg-white border rounded-md p-4" style={{borderColor:BRAND.gray[200]}}>
                    <h3 className="text-sm font-bold mb-3" style={{color:BRAND.primary}}>
                      Dimension {dim.number}: {dim.name}
                    </h3>
                    <div className="space-y-0">
                      {filteredData.map(([key, value]: [string, any]) => {
                        if (typeof value === 'object' && value !== null) {
                          const entries = Object.entries(value);
                          return (
                            <div key={key} className="mb-2">
                              <div className="text-xs font-semibold mb-1 pb-1 border-b" style={{color:BRAND.gray[700], borderColor:BRAND.gray[300]}}>
                                Programs & Offerings
                              </div>
                              <div className="space-y-1">
                                {entries.map(([item, status]: [string, any]) => (
                                  <div key={item} className="py-1 text-xs">
                                    <div className="flex items-start gap-2">
                                      <span className="flex-1" style={{color:BRAND.gray[700]}}>{item}</span>
                                      <span className="px-2 py-0.5 rounded text-xs whitespace-nowrap flex-shrink-0" 
                                            style={{
                                              color: status === 'Currently offer' ? '#059669' : 
                                                     status === 'In active planning / development' ? '#0284c7' :
                                                     status === 'Assessing feasibility' ? '#d97706' : BRAND.gray[600],
                                              backgroundColor: status === 'Currently offer' ? '#d1fae5' : 
                                                               status === 'In active planning / development' ? '#e0f2fe' :
                                                               status === 'Assessing feasibility' ? '#fef3c7' : BRAND.gray[100],
                                              fontWeight: 500
                                            }}>
                                        {status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } else {
                          const label = getDimensionFieldLabel(key);
                          return <Field key={key} label={label} value={value} />;
                        }
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(Object.keys(data.cross || {}).length > 0 || Object.keys(data.impact || {}).length > 0) && (
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-3" style={{color:BRAND.gray[900]}}>
              Assessment Sections
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.keys(data.cross || {}).length > 0 && (
                <div className="bg-white border rounded-md p-4" style={{borderColor:BRAND.gray[200]}}>
                  <h3 className="text-sm font-bold mb-3" style={{color:BRAND.primary}}>
                    Cross-Dimensional Assessment
                  </h3>
                  <div className="space-y-0">
                    {Object.entries(data.cross).map(([key, value]: [string, any]) => (
                      <Field key={key} label={key.toUpperCase()} value={formatArray(value)} />
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(data.impact || {}).length > 0 && (
                <div className="bg-white border rounded-md p-4" style={{borderColor:BRAND.gray[200]}}>
                  <h3 className="text-sm font-bold mb-3" style={{color:BRAND.primary}}>
                    Employee Impact Assessment
                  </h3>
                  <div className="space-y-0">
                    {Object.entries(data.impact).map(([key, value]: [string, any]) => (
                      <Field key={key} label={key.toUpperCase()} value={formatArray(value)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

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

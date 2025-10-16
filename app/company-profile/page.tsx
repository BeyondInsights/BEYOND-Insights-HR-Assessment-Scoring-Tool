'use client';

import React, { useEffect, useState } from 'react';

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
      <div className="min-h-screen grid place-items-center" style={{backgroundColor: '#f8f9fa'}}>
        <div className="text-sm text-gray-600">Loading…</div>
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
    return key.replace(/_/g, ' ').replace(/^d\d+[a-z]?_?/, '').toUpperCase();
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

  const DataRow = ({ label, value }: {label:string; value:any}) => {
    const displayValue = value || '—';
    return (
      <div className="py-3 border-b" style={{borderColor: '#e5e7eb'}}>
        <div className="text-xs font-medium mb-1" style={{color: '#6b7280'}}>{label}</div>
        <div className="text-sm" style={{color: '#1f2937'}}>{displayValue}</div>
      </div>
    );
  };

  const downloadPDF = () => {
    window.print();
  };

  const downloadTXT = () => {
    let txtContent = `${data.companyName}\nCompany Profile & Survey Summary\nGenerated: ${data.generatedAt}\n\n`;
    
    txtContent += `COMPANY PROFILE\n`;
    txtContent += `Co. Name: ${company.name || '—'}\n`;
    txtContent += `Industry: ${company.industry || '—'}\n`;
    txtContent += `Annual Revenue: ${company.revenue || '—'}\n`;
    txtContent += `Employee Size: ${company.size || '—'}\n`;
    txtContent += `HQ Location: ${company.hq || '—'}\n`;
    txtContent += `# of Countries w. Presence: ${company.countries || '—'}\n\n`;
    
    txtContent += `POC PROFILE\n`;
    txtContent += `Name: ${poc.name || '—'}\n`;
    txtContent += `Email Address: ${poc.email || '—'}\n`;
    txtContent += `Department: ${poc.department || '—'}\n`;
    txtContent += `Primary Job Function: ${poc.jobFunction || '—'}\n`;
    txtContent += `Title / Level: ${poc.title || '—'}\n`;
    txtContent += `Responsibility / Influence: ${poc.responsibilities || '—'}\n`;
    txtContent += `Level of influence re: workplace support: ${poc.influence || '—'}\n\n`;

    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.companyName}_profile_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: '#f8f9fa'}}>
      {/* Header */}
      <div className="bg-white border-b" style={{borderColor: '#e5e7eb'}}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-32"></div>
            <img
              src="/best-companies-2026-logo.png"
              alt="Best Companies Award"
              className="h-16"
            />
            <img
              src="/cancer-careers-logo.png"
              alt="Cancer and Careers"
              className="h-12"
            />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold mb-1" style={{color: '#1f2937'}}>
              {data.companyName}
            </h1>
            <p className="text-sm" style={{color: '#6b7280'}}>
              Company Profile & Survey Summary
            </p>
            <p className="text-xs mt-1" style={{color: '#9ca3af'}}>
              Generated: {data.generatedAt}
              {data.email && <span className="ml-1">• {data.email}</span>}
            </p>

            <div className="mt-4 flex items-center justify-center gap-3 print:hidden">
              <a 
                href="/dashboard" 
                className="px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all"
                style={{
                  borderColor: '#d1d5db',
                  color: '#374151',
                  backgroundColor: 'white'
                }}
              >
                Back to Dashboard
              </a>
              <button 
                onClick={downloadPDF}
                className="px-6 py-2 text-sm font-semibold rounded-lg text-white transition-all"
                style={{
                  background: 'linear-gradient(to right, #7c3aed, #a855f7)'
                }}
              >
                Review Your Company Profile
              </button>
              <button 
                onClick={downloadTXT}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all"
                style={{
                  background: 'linear-gradient(to right, #f97316, #fb923c)'
                }}
              >
                Download TXT
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Company Profile + POC Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          <div className="bg-white rounded-lg p-6" style={{border: '1px solid #e5e7eb'}}>
            <h2 className="text-base font-bold mb-4" style={{color: '#1f2937'}}>
              Company Profile
            </h2>
            <div>
              <DataRow label="Co. Name" value={company.name} />
              <DataRow label="Industry" value={company.industry} />
              <DataRow label="Annual Revenue" value={company.revenue} />
              <DataRow label="Employee Size" value={company.size} />
              <DataRow label="HQ Location" value={company.hq} />
              <DataRow label="# of Countries w. Presence" value={company.countries} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6" style={{border: '1px solid #e5e7eb'}}>
            <h2 className="text-base font-bold mb-4" style={{color: '#1f2937'}}>
              POC Profile
            </h2>
            <div>
              <DataRow label="Name" value={poc.name} />
              <DataRow label="Email Address" value={poc.email} />
              <DataRow label="Department" value={poc.department} />
              <DataRow label="Primary Job Function" value={poc.jobFunction} />
              <DataRow label="Title / Level" value={poc.title} />
              <DataRow label="Responsibility / Influence" value={poc.responsibilities} />
              <DataRow label="Level of influence re: workplace support" value={poc.influence} />
            </div>
          </div>
        </div>

        {/* General Benefits + Current Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          <div className="bg-white rounded-lg p-6" style={{border: '1px solid #e5e7eb'}}>
            <h2 className="text-base font-bold mb-4" style={{color: '#1f2937'}}>
              General Benefits Landscape
            </h2>
            <div>
              <DataRow label="% of Emp w/ access to national healthcare" value={benefits.nationalHealthcare} />
              <DataRow label="% of Emp eligible for Standard Benefits" value={benefits.eligibility} />
              
              <div className="py-3 border-b" style={{borderColor: '#e5e7eb'}}>
                <div className="text-xs font-bold" style={{color: '#1f2937'}}>Types of Benefits offered:</div>
              </div>
              <DataRow label="Standard Benefits offered" value={benefits.standard} />
              <DataRow label="Leave & flexibility programs" value={benefits.leave} />
              <DataRow label="Wellness & support programs" value={benefits.wellness} />
              <DataRow label="Financial & legal assistance programs" value={benefits.financial} />
              <DataRow label="Care navigation & support services" value={benefits.navigation} />
              
              <DataRow label="Programs plan to rollout over N2Y" value={benefits.planned} />
              <DataRow label="Approach to remote / hybrid work" value={benefits.remote} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6" style={{border: '1px solid #e5e7eb'}}>
            <h2 className="text-base font-bold mb-4" style={{color: '#1f2937'}}>
              Current Support for EMCs
            </h2>
            <div>
              <DataRow label="Status of Support Offerings" value={support.status} />
              <DataRow label="Current approach to supporting EMCs" value={support.approach} />
              <DataRow label="Emp Grps excluded from workplace support benefits" value={support.excluded} />
              <DataRow label="Triggers for developing programs" value={support.triggers} />
              {support.impactfulChange && (
                <DataRow label="Most impactful change" value={support.impactfulChange} />
              )}
              {support.barriers && (
                <DataRow label="Barriers to development" value={support.barriers} />
              )}
              <DataRow label="Primary caregiver support programs offered" value={support.caregiver} />
              <DataRow label="How monitor effectiveness of workplace support program" value={support.monitoring} />
            </div>
          </div>
        </div>

        {/* 13 Dimensions */}
        {data.dimensions && data.dimensions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4" style={{color: '#1f2937'}}>
              13 Dimensions of Support
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <div key={dim.number} className="bg-white rounded-lg p-6" style={{border: '1px solid #e5e7eb'}}>
                    <h3 className="text-base font-bold mb-4" style={{color: '#7c3aed'}}>
                      Dimension {dim.number}: {dim.name}
                    </h3>
                    <div>
                      {filteredData.map(([key, value]: [string, any]) => {
                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                          const entries = Object.entries(value);
                          return (
                            <div key={key} className="mb-3">
                              <div className="text-xs font-bold mb-2 pb-2" style={{color: '#1f2937', borderBottom: '1px solid #e5e7eb'}}>
                                Programs & Offerings
                              </div>
                              <div>
                                {entries.map(([item, status]: [string, any]) => (
                                  <div key={item} className="flex items-center justify-between py-3 border-b" style={{borderColor: '#e5e7eb'}}>
                                    <div className="text-xs font-medium flex-1 pr-4" style={{color: '#6b7280'}}>{item}</div>
                                    <span 
                                      className="inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                                      style={{
                                        backgroundColor: status === 'Currently offer' ? '#d1fae5' : 
                                                        status === 'In active planning / development' ? '#dbeafe' :
                                                        status === 'Assessing feasibility' ? '#fef3c7' : '#f3f4f6',
                                        color: status === 'Currently offer' ? '#065f46' : 
                                              status === 'In active planning / development' ? '#1e40af' :
                                              status === 'Assessing feasibility' ? '#92400e' : '#4b5563'
                                      }}
                                    >
                                      {status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } else {
                          const label = getDimensionFieldLabel(key);
                          let displayValue = value;
                          
                          if (Array.isArray(value) && value.some((v: string) => v.includes('Other') || v.includes('specify'))) {
                            const otherKey = key + '_other';
                            const otherText = dimData[otherKey];
                            if (otherText) {
                              displayValue = [...value, `Other: ${otherText}`];
                            }
                          }
                          
                          return <DataRow key={key} label={label} value={formatArray(displayValue)} />;
                        }
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Assessment Sections */}
        {(Object.keys(data.cross || {}).length > 0 || Object.keys(data.impact || {}).length > 0) && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4" style={{color: '#1f2937'}}>
              Assessment Sections
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.keys(data.cross || {}).length > 0 && (
                <div className="bg-white rounded-lg p-6" style={{border: '1px solid #e5e7eb'}}>
                  <h3 className="text-base font-bold mb-4" style={{color: '#7c3aed'}}>
                    Cross-Dimensional Assessment
                  </h3>
                  <div>
                    {Object.entries(data.cross).map(([key, value]: [string, any]) => (
                      <DataRow key={key} label={key.toUpperCase()} value={formatArray(value)} />
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(data.impact || {}).length > 0 && (
                <div className="bg-white rounded-lg p-6" style={{border: '1px solid #e5e7eb'}}>
                  <h3 className="text-base font-bold mb-4" style={{color: '#7c3aed'}}>
                    Employee Impact Assessment
                  </h3>
                  <div>
                    {Object.entries(data.impact).map(([key, value]: [string, any]) => (
                      <DataRow key={key} label={key.toUpperCase()} value={formatArray(value)} />
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

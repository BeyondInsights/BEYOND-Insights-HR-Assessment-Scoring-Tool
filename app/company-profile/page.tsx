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
      if (Object.keys(raw).length > 0) {
        dims.push({ number: i, name: DIM_TITLES[i], data: raw || {} });
      }
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

  const getDimensionFieldLabel = (key: string, dimNumber: number): string => {
    // Dimension 1 specific
    if (dimNumber === 1) {
      if (key === 'd1aa') return 'Multi-country consistency';
      if (key === 'd1_1') return 'Additional weeks of paid medical leave (USA)';
      if (key === 'd1_1b') return 'Additional weeks of paid medical leave (Non-USA)';
      if (key === 'd1_2') return 'How medical leave effectiveness is measured';
      if (key === 'd1_4a') return 'Additional remote work time allowed during treatment';
      if (key === 'd1_4b') return 'Duration of part-time/reduced schedule options';
      if (key === 'd1_5_usa') return 'Job protection guarantee duration (USA)';
      if (key === 'd1_5_non_usa') return 'Job protection guarantee duration (Non-USA)';
      if (key === 'd1_6') return 'Disability benefit enhancements offered';
    }
    
    // Dimension 2 specific
    if (dimNumber === 2) {
      if (key === 'd2aa') return 'Multi-country consistency';
      if (key === 'd2_1') return 'Additional insurance coverage details';
      if (key === 'd2_2') return 'How financial protection effectiveness is measured';
      if (key === 'd2_5') return 'Health insurance premium handling during leave';
      if (key === 'd2_6') return 'Financial counseling provider';
    }
    
    // Dimension 3 specific
    if (dimNumber === 3) {
      if (key === 'd3aa') return 'Multi-country consistency';
      if (key === 'd3_1') return 'Manager training requirement type';
      if (key === 'd3_2') return 'Manager training completion rate';
    }
    
    // Generic patterns for other dimensions
    if (key.includes('aa')) return 'Multi-country consistency';
    
    // Fallback - clean up key
    return key.replace(/_/g, ' ').replace(/^d\d+[a-z]?_?/, '').replace(/\b\w/g, l => l.toUpperCase());
  };

  const poc = {
    name: `${data.firstName} ${data.lastName}`.trim() || null,
    email: data.email || null,
    department: firmo?.s4a || null,
    jobFunction: firmo?.s4b || null,
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
    excluded: (cur?.c4 || firmo?.c4) ? formatArray(cur?.c4 || firmo?.c4) : null,
    excludedPercent: cur?.c3 || firmo?.c3 || null,
    triggers: formatArray(cur?.or2a),
    impactfulChange: cur?.or2b || null,
    barriers: formatArray(cur?.or3),
    caregiver: formatArray(cur?.or5a),
    monitoring: formatArray(cur?.or6),
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <h2 className="text-2xl font-bold" style={{ color: '#1f2937' }}>{title}</h2>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, #e5e7eb, transparent)' }}></div>
    </div>
  );

  const DataRow = ({ label, value }: {label:string; value:any}) => {
    const displayValue = value || '—';
    return (
      <div className="group hover:bg-gray-50 transition-colors rounded-lg px-4 py-3 -mx-4">
        <div className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{color: '#6b7280'}}>{label}</div>
        <div className="text-sm font-medium" style={{color: '#1f2937'}}>{displayValue}</div>
      </div>
    );
  };

  const downloadPDF = () => {
    window.print();
  };

  const downloadTXT = () => {
    let txtContent = `${data.companyName}\nCompany Profile & Survey Summary\nGenerated: ${data.generatedAt}\n\n`;
    
    txtContent += `===== COMPANY PROFILE =====\n`;
    txtContent += `Co. Name: ${company.name || '—'}\n`;
    txtContent += `Industry: ${company.industry || '—'}\n`;
    txtContent += `Annual Revenue: ${company.revenue || '—'}\n`;
    txtContent += `Employee Size: ${company.size || '—'}\n`;
    txtContent += `HQ Location: ${company.hq || '—'}\n`;
    txtContent += `# of Countries w. Presence: ${company.countries || '—'}\n\n`;
    
    txtContent += `===== POC PROFILE =====\n`;
    txtContent += `Name: ${poc.name || '—'}\n`;
    txtContent += `Email Address: ${poc.email || '—'}\n`;
    txtContent += `Department: ${poc.department || '—'}\n`;
    txtContent += `Primary Job Function: ${poc.jobFunction || '—'}\n`;
    txtContent += `Title / Level: ${poc.title || '—'}\n`;
    txtContent += `Responsibility / Influence: ${poc.responsibilities || '—'}\n`;
    txtContent += `Level of influence re: workplace support: ${poc.influence || '—'}\n\n`;

    txtContent += `===== GENERAL BENEFITS LANDSCAPE =====\n`;
    txtContent += `% of Emp w/ access to national healthcare: ${benefits.nationalHealthcare || '—'}\n`;
    txtContent += `% of Emp eligible for Standard Benefits: ${benefits.eligibility || '—'}\n`;
    txtContent += `Standard Benefits offered: ${benefits.standard || '—'}\n`;
    txtContent += `Leave & flexibility programs: ${benefits.leave || '—'}\n`;
    txtContent += `Wellness & support programs: ${benefits.wellness || '—'}\n`;
    txtContent += `Financial & legal assistance programs: ${benefits.financial || '—'}\n`;
    txtContent += `Care navigation & support services: ${benefits.navigation || '—'}\n`;
    txtContent += `Programs plan to rollout over N2Y: ${benefits.planned || '—'}\n`;
    txtContent += `Approach to remote / hybrid work: ${benefits.remote || '—'}\n\n`;

    txtContent += `===== CURRENT SUPPORT FOR EMCs =====\n`;
    txtContent += `Status of Support Offerings: ${support.status || '—'}\n`;
    txtContent += `Current approach to supporting EMCs: ${support.approach || '—'}\n`;
    txtContent += `% of Emp excluded from workplace support benefits: ${support.excludedPercent || '—'}\n`;
    txtContent += `Emp Groups excluded from workplace support benefits: ${support.excluded || '—'}\n`;
    txtContent += `Triggers for developing programs: ${support.triggers || '—'}\n`;
    if (support.impactfulChange) txtContent += `Most impactful change: ${support.impactfulChange}\n`;
    if (support.barriers) txtContent += `Barriers to development: ${support.barriers}\n`;
    txtContent += `Primary caregiver support programs offered: ${support.caregiver || '—'}\n`;
    txtContent += `How monitor effectiveness of workplace support program: ${support.monitoring || '—'}\n\n`;

    if (data.dimensions && data.dimensions.length > 0) {
      txtContent += `===== 13 DIMENSIONS OF SUPPORT =====\n\n`;
      data.dimensions.forEach((dim: any) => {
        const dimData = dim.data || {};
        if (Object.keys(dimData).length > 0) {
          txtContent += `--- Dimension ${dim.number}: ${dim.name} ---\n`;
          Object.entries(dimData).forEach(([key, value]) => {
            if (!key.match(/^d\d+_?b$/i) && !key.match(/^d\d+_?b_/i)) {
              const label = getDimensionFieldLabel(key, dim.number);
              txtContent += `${label}: ${formatArray(value) || '—'}\n`;
            }
          });
          txtContent += `\n`;
        }
      });
    }

    if (Object.keys(data.cross || {}).length > 0) {
      txtContent += `===== CROSS-DIMENSIONAL ASSESSMENT =====\n`;
      Object.entries(data.cross).forEach(([key, value]: [string, any]) => {
        txtContent += `${key.toUpperCase()}: ${formatArray(value) || '—'}\n`;
      });
      txtContent += `\n`;
    }

    if (Object.keys(data.impact || {}).length > 0) {
      txtContent += `===== EMPLOYEE IMPACT ASSESSMENT =====\n`;
      Object.entries(data.impact).forEach(([key, value]: [string, any]) => {
        txtContent += `${key.toUpperCase()}: ${formatArray(value) || '—'}\n`;
      });
      txtContent += `\n`;
    }

    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.companyName}_profile_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)'}}>
      
      {/* Hero Header */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderBottom: '4px solid #f97316'
      }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
        
        <div className="max-w-7xl mx-auto px-6 py-12 relative">
          <div className="flex items-center justify-between mb-8">
            <img
              src="/best-companies-2026-logo.png"
              alt="Best Companies Award"
              className="h-32 drop-shadow-2xl"
            />
            <img
              src="/cancer-careers-logo.png"
              alt="Cancer and Careers"
              className="h-24 brightness-0 invert"
            />
          </div>

          <div className="text-center">
            <h1 className="text-5xl font-black mb-3 text-white drop-shadow-lg">
              {data.companyName}
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Company Profile & Survey Summary
            </p>
            <p className="text-sm text-gray-400">
              Generated: {data.generatedAt}
              {data.email && <span className="ml-2">• {data.email}</span>}
            </p>

            <div className="mt-8 flex items-center justify-center gap-4 print:hidden">
              <a 
                href="/dashboard" 
                className="px-6 py-3 text-sm font-bold rounded-lg border-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{
                  borderColor: '#ffffff',
                  color: '#ffffff',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                ← Back to Dashboard
              </a>
              <button 
                onClick={downloadPDF}
                className="px-8 py-3 text-sm font-bold rounded-lg text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                }}
              >
                <svg className="inline-block w-4 h-4 mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Download PDF
              </button>
              <button 
                onClick={downloadTXT}
                className="px-6 py-3 text-sm font-bold rounded-lg text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
                }}
              >
                <svg className="inline-block w-4 h-4 mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download TXT
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Company & POC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
            <SectionHeader title="Company Profile" />
            <div className="space-y-1">
              <DataRow label="Company Name" value={company.name} />
              <DataRow label="Industry" value={company.industry} />
              <DataRow label="Annual Revenue" value={company.revenue} />
              <DataRow label="Employee Size" value={company.size} />
              <DataRow label="HQ Location" value={company.hq} />
              <DataRow label="# of Countries w. Presence" value={company.countries} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
            <SectionHeader title="Point of Contact" />
            <div className="space-y-1">
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

        {/* Benefits & Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
            <SectionHeader title="General Benefits Landscape" />
            <div className="space-y-1">
              <DataRow label="% of Emp w/ access to national healthcare" value={benefits.nationalHealthcare} />
              <DataRow label="% of Emp eligible for Standard Benefits" value={benefits.eligibility} />
              
              <div className="pt-4 pb-2">
                <div className="text-xs font-bold uppercase tracking-wide" style={{color: '#f97316'}}>Types of Benefits Offered</div>
              </div>
              
              <DataRow label="Standard Benefits" value={benefits.standard} />
              <DataRow label="Leave & Flexibility Programs" value={benefits.leave} />
              <DataRow label="Wellness & Support Programs" value={benefits.wellness} />
              <DataRow label="Financial & Legal Assistance" value={benefits.financial} />
              <DataRow label="Care Navigation & Support" value={benefits.navigation} />
              <DataRow label="Programs Planned (Next 2 Years)" value={benefits.planned} />
              <DataRow label="Remote / Hybrid Work Approach" value={benefits.remote} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
            <SectionHeader title="Current Support for EMCs" />
            <div className="space-y-1">
              <DataRow label="Status of Support Offerings" value={support.status} />
              <DataRow label="Current Approach to Supporting EMCs" value={support.approach} />
              <DataRow label="% of Employees Excluded" value={support.excludedPercent} />
              <DataRow label="Employee Groups Excluded" value={support.excluded} />
              <DataRow label="Triggers for Developing Programs" value={support.triggers} />
              {support.impactfulChange && (
                <DataRow label="Most Impactful Change" value={support.impactfulChange} />
              )}
              {support.barriers && (
                <DataRow label="Barriers to Development" value={support.barriers} />
              )}
              <DataRow label="Caregiver Support Programs" value={support.caregiver} />
              <DataRow label="How Effectiveness is Monitored" value={support.monitoring} />
            </div>
          </div>
        </div>

        {/* 13 Dimensions */}
        {data.dimensions && data.dimensions.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black mb-3" style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #f97316 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                13 Dimensions of Support
              </h2>
              <p className="text-gray-600">Comprehensive assessment across all dimensions</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {data.dimensions.map((dim: any) => {
                const dimData = dim.data || {};
                
                const filteredData = Object.entries(dimData).filter(([key]) => {
                  if (key.match(/^d\d+_?b$/i)) return false;
                  if (key.match(/^d\d+_?b_/i)) return false;
                  return true;
                });
                
                if (filteredData.length === 0) return null;
                
                return (
                  <div key={dim.number} className="bg-white rounded-2xl p-8 shadow-xl border-2 hover:shadow-2xl transition-all" style={{borderColor: '#7c3aed'}}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'}}>
                        {dim.number}
                      </div>
                      <h3 className="text-lg font-bold flex-1" style={{color: '#7c3aed'}}>
                        {dim.name}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {filteredData.map(([key, value]: [string, any]) => {
                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                          const entries = Object.entries(value);
                          return (
                            <div key={key} className="mb-4 pb-4 border-b border-gray-200">
                              <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{color: '#f97316'}}>
                                Programs & Offerings
                              </div>
                              <div className="space-y-2">
                                {entries.map(([item, status]: [string, any]) => (
                                  <div key={item} className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span className="text-xs font-medium flex-1" style={{color: '#4b5563'}}>{item}</span>
                                    <span 
                                      className="inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
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
                          const label = getDimensionFieldLabel(key, dim.number);
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
          <div className="mb-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-2" style={{color: '#1f2937'}}>
                Additional Assessments
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Object.keys(data.cross || {}).length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                  <SectionHeader title="Cross-Dimensional" />
                  <div className="space-y-1">
                    {Object.entries(data.cross).map(([key, value]: [string, any]) => (
                      <DataRow key={key} label={key.toUpperCase()} value={formatArray(value)} />
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(data.impact || {}).length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                  <SectionHeader title="Employee Impact" />
                  <div className="space-y-1">
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

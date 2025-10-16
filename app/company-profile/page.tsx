"use client";

import React, { useState, useEffect } from 'react';

// CAC Brand Colors (Official)
const COLORS = {
  purple: { primary: '#6B2C91', light: '#8B4DB3', bg: '#F5EDFF', border: '#D4B5E8' },
  teal: { primary: '#00A896', light: '#33BDAD', bg: '#E6F9F7', border: '#99E6DD' },
  orange: { primary: '#FF6B35', bg: '#FFF0EC', border: '#FFD4C4' },
  gray: { dark: '#2D3748', medium: '#4A5568', light: '#CBD5E0', bg: '#F7FAFC' }
};

// Custom SVG Icons
const IconCheckCircle = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={COLORS.teal.primary} strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconAlertCircle = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const CompleteSurveyReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    loadAllSurveyData();
  }, []);

  const loadAllSurveyData = () => {
    try {
      // Load all survey sections from localStorage
      const firmographics = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
      const generalBenefits = JSON.parse(localStorage.getItem('general_benefits_data') || '{}');
      const currentSupport = JSON.parse(localStorage.getItem('current_support_data') || '{}');
      
      // Load all 13 dimensions
      const dimensions = [];
      for (let i = 1; i <= 13; i++) {
        const dimData = JSON.parse(localStorage.getItem(`dimension_${i}_data`) || '{}');
        dimensions.push({
          number: i,
          name: getDimensionName(i),
          data: dimData
        });
      }

      // Load advanced assessments
      const employeeImpact = JSON.parse(localStorage.getItem('employee_impact_data') || '{}');
      const crossDimensional = JSON.parse(localStorage.getItem('cross_dimensional_data') || '{}');

      // Get email from auth
      const email = localStorage.getItem('auth_email') || '';

      // Extract company name and contact info
      const companyName = firmographics.companyName || 
                         firmographics.s1_company || 
                         'Company Assessment Report';

      const contactName = [firmographics.contactFirst, firmographics.contactLast]
                         .filter(Boolean).join(' ') || 
                         firmographics.contactName || 
                         firmographics.hr_name || '';

      const report = {
        companyName,
        contactName,
        email,
        generatedDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        sections: {
          firmographics,
          generalBenefits,
          currentSupport,
          dimensions,
          employeeImpact,
          crossDimensional
        }
      };

      setReportData(report);
      calculateOverallProgress(report);
      setLoading(false);
    } catch (error) {
      console.error('Error loading survey data:', error);
      setLoading(false);
    }
  };

  const getDimensionName = (num) => {
    const names = [
      'Medical Leave & Disability',
      'Financial Burden & Coverage',
      'Culture & Manager Support',
      'Organizational Commitment',
      'Flexibility & Remote Work',
      'Mental Health Support',
      'Return to Work Support',
      'Caregiver Support',
      'Specialized Services',
      'Technology & Tools',
      'Prevention & Wellness',
      'Continuous Improvement',
      'Communication & Awareness'
    ];
    return names[num - 1] || `Dimension ${num}`;
  };

  const calculateOverallProgress = (data) => {
    const sections = [
      { name: 'firmographics', weight: 1 },
      { name: 'generalBenefits', weight: 1 },
      { name: 'currentSupport', weight: 1 },
      ...Array.from({ length: 13 }, (_, i) => ({ name: `dimension_${i + 1}`, weight: 2 })),
      { name: 'employeeImpact', weight: 1 },
      { name: 'crossDimensional', weight: 1 }
    ];

    let totalWeight = 0;
    let completedWeight = 0;

    sections.forEach(section => {
      totalWeight += section.weight;
      let sectionData;
      
      if (section.name.startsWith('dimension_')) {
        const dimIndex = parseInt(section.name.split('_')[1]) - 1;
        sectionData = data.sections.dimensions[dimIndex]?.data || {};
      } else {
        sectionData = data.sections[section.name] || {};
      }

      const keys = Object.keys(sectionData).filter(k => sectionData[k] && sectionData[k] !== '');
      if (keys.length > 0) {
        completedWeight += section.weight;
      }
    });

    setOverallProgress(Math.round((completedWeight / totalWeight) * 100));
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    if (!reportData) return;

    let text = `COMPLETE ASSESSMENT REPORT
${reportData.companyName}
Best Companies for Working with Cancer: Employer Index
Generated: ${reportData.generatedDate}

${'='.repeat(100)}

PRIMARY CONTACT
${'-'.repeat(100)}
Name: ${reportData.contactName}
Email: ${reportData.email}

COMPANY PROFILE
${'-'.repeat(100)}
`;

    const firmo = reportData.sections.firmographics;
    const fields = [
      ['Company Name', reportData.companyName],
      ['Contact Title', firmo.contactTitle || firmo.hr_title],
      ['Contact Phone', firmo.contactPhone || firmo.hr_phone],
      ['Department', firmo.s3 || firmo.department],
      ['Job Function', firmo.s4a],
      ['Primary Job Function', firmo.s4b],
      ['Current Level', firmo.s5],
      ['Areas of Responsibility', firmo.s6],
      ['Influence on Benefits', firmo.s7],
      ['Employee Size', firmo.s8],
      ['Headquarters', firmo.s9 || firmo.hq],
      ['Countries Present', firmo.s9a],
      ['Industry', firmo.c2],
      ['Annual Revenue', firmo.c4],
      ['Benefits Eligibility %', firmo.c5],
      ['Excluded Employee Groups', firmo.c3],
      ['Remote/Hybrid Policy', firmo.c6]
    ];

    fields.forEach(([label, value]) => {
      if (value && value !== '' && value !== '—') {
        const displayValue = Array.isArray(value) ? value.join(', ') : value;
        text += `${label}: ${displayValue}\n`;
      }
    });

    text += formatSectionForExport('\nGENERAL EMPLOYEE BENEFITS', reportData.sections.generalBenefits);
    text += formatSectionForExport('\nCURRENT SUPPORT PROGRAMS', reportData.sections.currentSupport);
    
    reportData.sections.dimensions.forEach((dim, idx) => {
      text += formatSectionForExport(`\nDIMENSION ${idx + 1}: ${dim.name.toUpperCase()}`, dim.data);
    });
    
    text += formatSectionForExport('\nEMPLOYEE IMPACT ASSESSMENT', reportData.sections.employeeImpact);
    text += formatSectionForExport('\nCROSS-DIMENSIONAL ASSESSMENT', reportData.sections.crossDimensional);

    text += `\n${'='.repeat(100)}\n`;
    text += `© ${new Date().getFullYear()} CEW Foundation / Cancer and Careers\n`;
    text += `Confidential - For Internal Use Only\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.companyName.replace(/\s+/g, '_')}_Assessment_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSectionForExport = (title, data) => {
    let text = `\n${title}\n${'-'.repeat(100)}\n`;
    
    if (!data || Object.keys(data).length === 0) {
      text += 'No data available\n';
      return text;
    }

    Object.entries(data).forEach(([key, value]) => {
      if (value && value !== '' && value !== '—') {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const formattedValue = Array.isArray(value) ? value.join(', ') : 
                              typeof value === 'object' ? JSON.stringify(value) : value;
        text += `${formattedKey}: ${formattedValue}\n`;
      }
    });

    return text + '\n';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.gray.bg }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" 
               style={{ borderColor: COLORS.purple.primary }}></div>
          <p className="mt-4 text-gray-600">Loading complete assessment...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.gray.bg }}>
        <div className="text-center max-w-md">
          <IconAlertCircle className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.gray.dark }}>No Assessment Data Found</h2>
          <p className="text-gray-600">Please complete the assessment surveys to generate your report.</p>
        </div>
      </div>
    );
  }

  const firmo = reportData.sections.firmographics;
  const general = reportData.sections.generalBenefits;
  const support = reportData.sections.currentSupport;

  const DataField = ({ label, value, highlight = false }) => {
    if (!value || value === '' || value === '—') return null;
    
    const displayValue = Array.isArray(value) ? value.join(', ') : 
                        typeof value === 'object' ? JSON.stringify(value) : value;
    
    return (
      <div className={`grid grid-cols-3 gap-4 py-3 border-b ${highlight ? 'bg-purple-50' : ''}`} 
           style={{ borderColor: COLORS.gray.light }}>
        <dt className="font-semibold col-span-1" style={{ color: COLORS.gray.dark }}>{label}</dt>
        <dd className="col-span-2" style={{ color: COLORS.gray.medium }}>{displayValue}</dd>
      </div>
    );
  };

  const SectionCard = ({ title, children, color, hasData }) => (
    <div className="bg-white rounded-lg shadow-md border-2 mb-6 overflow-hidden print:shadow-none print:break-inside-avoid"
         style={{ borderColor: color.border }}>
      <div className="px-6 py-4 flex items-center justify-between" 
           style={{ backgroundColor: color.primary }}>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        {hasData ? <IconCheckCircle className="w-6 h-6" /> : <IconAlertCircle className="w-6 h-6" />}
      </div>
      <div className="p-6">
        {hasData ? children : (
          <p className="text-gray-500 italic">No data submitted for this section</p>
        )}
      </div>
    </div>
  );

  const hasGeneralData = Object.keys(general).filter(k => general[k] && general[k] !== '').length > 0;
  const hasSupportData = Object.keys(support).filter(k => support[k] && support[k] !== '').length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.gray.bg }}>
      {/* Header - Screen Only */}
      <div className="print:hidden bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <img src="/best-companies-2026-logo.png" 
                 alt="Best Companies Award Logo" 
                 className="h-16 sm:h-20 lg:h-24 w-auto drop-shadow-md" />
            
            <div className="flex-1 text-center px-8">
              <h1 className="text-3xl font-bold mb-1" style={{ color: COLORS.purple.primary }}>
                Company Assessment Report
              </h1>
              <p className="text-sm" style={{ color: COLORS.gray.medium }}>
                Best Companies for Working with Cancer Index
              </p>
            </div>
            
            <img src="/cancer-careers-logo.png" 
                 alt="Cancer and Careers Logo" 
                 className="h-10 sm:h-14 lg:h-16 w-auto" />
          </div>
          
          <div className="flex justify-end gap-2">
            <button onClick={handlePrint}
                    className="px-6 py-2 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                    style={{ borderColor: COLORS.gray.light, color: COLORS.gray.dark }}>
              Print Report
            </button>
            <button onClick={handleDownload}
                    className="px-6 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
                    style={{ backgroundColor: COLORS.purple.primary }}>
              Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block bg-white p-8 border-b-4" style={{ borderColor: COLORS.purple.primary }}>
        <div className="flex items-start justify-between mb-6">
          <img src="/best-companies-2026-logo.png" alt="Award" className="h-24 w-auto" />
          
          <div className="flex-1 text-center px-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.gray.dark }}>
              {reportData.companyName}
            </h1>
            <p className="text-2xl font-semibold mb-1" style={{ color: COLORS.purple.primary }}>
              Complete Assessment Report
            </p>
            <p className="text-lg" style={{ color: COLORS.gray.medium }}>
              Best Companies for Working with Cancer: Employer Index
            </p>
            <p className="text-sm mt-4" style={{ color: COLORS.gray.medium }}>
              Generated: {reportData.generatedDate}
            </p>
          </div>
          
          <img src="/cancer-careers-logo.png" alt="CAC" className="h-20 w-auto" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 print:py-4">
        {/* Hero Stats */}
        <div className="rounded-xl shadow-lg p-8 mb-8 text-white print:shadow-none relative overflow-hidden" 
             style={{ background: `linear-gradient(135deg, ${COLORS.purple.primary} 0%, ${COLORS.purple.light} 100%)` }}>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{reportData.companyName}</h2>
              <p className="text-purple-100 text-lg mb-1">Workplace Cancer Support Assessment</p>
              <p className="text-sm text-purple-100">{reportData.contactName} • {reportData.email}</p>
            </div>
            <div className="text-center bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-5xl font-bold mb-2">{overallProgress}%</div>
              <p className="text-purple-100 font-semibold">Complete</p>
            </div>
          </div>
        </div>

        {/* Primary Contact & Company Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <SectionCard title="Primary Contact Information" color={COLORS.purple} hasData={true}>
            <DataField label="Name" value={reportData.contactName} highlight />
            <DataField label="Email" value={reportData.email} highlight />
            <DataField label="Title" value={firmo.contactTitle || firmo.hr_title} />
            <DataField label="Phone" value={firmo.contactPhone || firmo.hr_phone} />
            <DataField label="Department" value={firmo.s3 || firmo.department} />
            <DataField label="Job Function" value={firmo.s4a} />
            <DataField label="Primary Function" value={firmo.s4b} />
            <DataField label="Current Level" value={firmo.s5} />
          </SectionCard>

          <SectionCard title="Company Overview" color={COLORS.teal} hasData={true}>
            <DataField label="Company Name" value={reportData.companyName} highlight />
            <DataField label="Industry" value={firmo.c2} highlight />
            <DataField label="Employee Size" value={firmo.s8} highlight />
            <DataField label="Annual Revenue" value={firmo.c4} />
            <DataField label="Headquarters" value={firmo.s9 || firmo.hq} />
            <DataField label="Global Presence" value={firmo.s9a} />
          </SectionCard>
        </div>

        {/* Workforce & Policies */}
        <SectionCard title="Workforce & Policies" color={COLORS.orange} hasData={true}>
          <div className="grid md:grid-cols-2 gap-x-8">
            <div>
              <DataField label="Benefits Eligibility %" value={firmo.c5} highlight />
              <DataField label="Excluded Groups" value={firmo.c3} />
              <DataField label="Remote/Hybrid Policy" value={firmo.c6} />
              <DataField label="Remote Policy Details" value={firmo.c6_other} />
            </div>
            <div>
              <DataField label="Areas of Responsibility" value={firmo.s6} />
              <DataField label="Influence on Benefits" value={firmo.s7} highlight />
              <DataField label="Level Specification" value={firmo.s5_other} />
              <DataField label="Other Job Function" value={firmo.s4b_other} />
            </div>
          </div>
        </SectionCard>

        {/* General Employee Benefits */}
        <SectionCard title="General Employee Benefits" color={COLORS.teal} hasData={hasGeneralData}>
          {Object.entries(general)
            .filter(([k, v]) => v && v !== '' && v !== '—')
            .map(([key, value]) => (
              <DataField 
                key={key} 
                label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                value={value} 
              />
            ))}
        </SectionCard>

        {/* Current Support Programs */}
        <SectionCard title="Current Support Programs" color={COLORS.orange} hasData={hasSupportData}>
          {Object.entries(support)
            .filter(([k, v]) => v && v !== '' && v !== '—')
            .map(([key, value]) => (
              <DataField 
                key={key} 
                label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                value={value} 
              />
            ))}
        </SectionCard>

        {/* 13 Dimensions - ENHANCED DISPLAY */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.orange.primary }}>
            13 Support Dimensions
          </h2>
          {reportData.sections.dimensions.map((dim, idx) => {
            const dimData = dim.data;
            const hasDimData = Object.keys(dimData).filter(k => dimData[k] && dimData[k] !== '').length > 0;
            
            // Separate grid items from other questions
            const gridItems = {};
            const customQuestions = {};
            const multiCountry = {};
            const openEnded = {};
            
            Object.entries(dimData).forEach(([key, value]) => {
              if (key.startsWith('d' + (idx + 1) + 'a') || key.match(/^d\d+[a-z]$/i)) {
                // Grid item responses (likert-4)
                if (typeof value === 'object' && !Array.isArray(value)) {
                  Object.entries(value).forEach(([item, response]) => {
                    gridItems[item] = response;
                  });
                } else {
                  gridItems[key] = value;
                }
              } else if (key.includes('_aa') || key.includes('d_aa')) {
                multiCountry[key] = value;
              } else if (key.includes('_b') || key.includes('other')) {
                openEnded[key] = value;
              } else {
                customQuestions[key] = value;
              }
            });

            return (
              <SectionCard 
                key={idx}
                title={`D${dim.number}: ${dim.name}`}
                color={COLORS.orange}
                hasData={hasDimData}
              >
                {/* Grid Items - Support Options */}
                {Object.keys(gridItems).length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-lg mb-3 pb-2 border-b-2" 
                        style={{ color: COLORS.orange.primary, borderColor: COLORS.orange.border }}>
                      Support Options & Status
                    </h4>
                    {Object.entries(gridItems).map(([item, response]) => (
                      <div key={item} className="grid grid-cols-3 gap-4 py-2 border-b" 
                           style={{ borderColor: COLORS.gray.light }}>
                        <dt className="font-semibold col-span-2" style={{ color: COLORS.gray.dark }}>
                          {item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </dt>
                        <dd className="col-span-1 text-right">
                          <span className="px-3 py-1 rounded-full text-sm font-medium"
                                style={{ 
                                  backgroundColor: response === 'Currently offer' ? COLORS.teal.bg : 
                                                  response === 'Plan to offer within the next 12 months' ? COLORS.orange.bg :
                                                  response === 'Assessing feasibility' ? '#FEF3C7' : '#FEE2E2',
                                  color: response === 'Currently offer' ? COLORS.teal.primary : 
                                        response === 'Plan to offer within the next 12 months' ? COLORS.orange.primary :
                                        response === 'Assessing feasibility' ? '#92400E' : '#991B1B'
                                }}>
                            {response}
                          </span>
                        </dd>
                      </div>
                    ))}
                  </div>
                )}

                {/* Multi-Country Implementation */}
                {Object.keys(multiCountry).length > 0 && (
                  <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: COLORS.teal.bg }}>
                    <h4 className="font-bold mb-2" style={{ color: COLORS.teal.primary }}>
                      Multi-Country Implementation
                    </h4>
                    {Object.entries(multiCountry).map(([key, value]) => (
                      <DataField key={key} 
                                label="Support Options Are" 
                                value={value} />
                    ))}
                  </div>
                )}

                {/* Custom Follow-up Questions */}
                {Object.keys(customQuestions).length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-lg mb-3 pb-2 border-b-2" 
                        style={{ color: COLORS.purple.primary, borderColor: COLORS.purple.border }}>
                      Additional Details
                    </h4>
                    {Object.entries(customQuestions).map(([key, value]) => (
                      <DataField key={key} 
                                label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                                value={value} />
                    ))}
                  </div>
                )}

                {/* Open-Ended Responses */}
                {Object.keys(openEnded).length > 0 && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: COLORS.purple.bg }}>
                    <h4 className="font-bold mb-2" style={{ color: COLORS.purple.primary }}>
                      Other Benefits Offered
                    </h4>
                    {Object.entries(openEnded).map(([key, value]) => (
                      <div key={key} className="mt-2">
                        <p className="text-sm font-medium" style={{ color: COLORS.gray.dark }}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            );
          })}
        </div>

        {/* Advanced Assessments */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.purple.primary }}>
            Advanced Assessments
          </h2>
          
          <SectionCard 
            title="Employee Impact Assessment" 
            color={COLORS.purple}
            hasData={Object.keys(reportData.sections.employeeImpact).length > 0}
          >
            {Object.entries(reportData.sections.employeeImpact)
              .filter(([k, v]) => v && v !== '' && v !== '—')
              .map(([key, value]) => (
                <DataField 
                  key={key} 
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                  value={value} 
                />
              ))}
          </SectionCard>

          <SectionCard 
            title="Cross-Dimensional Assessment" 
            color={COLORS.teal}
            hasData={Object.keys(reportData.sections.crossDimensional).length > 0}
          >
            {Object.entries(reportData.sections.crossDimensional)
              .filter(([k, v]) => v && v !== '' && v !== '—')
              .map(([key, value]) => (
                <DataField 
                  key={key} 
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                  value={value} 
                />
              ))}
          </SectionCard>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 text-center" style={{ borderColor: COLORS.purple.border }}>
          <div className="flex items-center justify-center gap-8 mb-4">
            <img src="/cancer-careers-logo.png" alt="CAC" className="h-12 w-auto" />
            <div className="h-12 w-px" style={{ backgroundColor: COLORS.gray.light }}></div>
            <img src="/best-companies-2026-logo.png" alt="Award" className="h-16 w-auto" />
          </div>
          <p className="text-lg font-semibold" style={{ color: COLORS.gray.dark }}>
            Best Companies for Working with Cancer: Employer Index
          </p>
          <p className="text-sm mt-2" style={{ color: COLORS.gray.medium }}>
            © {new Date().getFullYear()} CEW Foundation / Cancer and Careers. All rights reserved.
          </p>
          <p className="text-xs mt-2" style={{ color: COLORS.gray.medium }}>
            Confidential - For Internal Use Only by {reportData.companyName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompleteSurveyReport;

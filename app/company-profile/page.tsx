import React, { useState, useEffect } from 'react';
import { Building2, Users, Heart, TrendingUp, Target, Award, FileText, Download, Printer, CheckCircle2, AlertCircle } from 'lucide-react';

// CAC Brand Colors (Official)
const COLORS = {
  purple: { 
    primary: '#6B2C91', 
    light: '#8B4DB3', 
    dark: '#5B21B6',
    bg: '#F5EDFF',
    border: '#D4B5E8'
  },
  teal: {
    primary: '#00A896',
    light: '#33BDAD',
    bg: '#E6F9F7',
    border: '#99E6DD'
  },
  orange: {
    primary: '#FF6B35',
    light: '#FCD34D',
    bg: '#FFF0EC',
    border: '#FFD4C4'
  },
  gray: { 
    dark: '#2D3748', 
    medium: '#4A5568', 
    light: '#CBD5E0', 
    bg: '#F7FAFC' 
  }
};

// CAC Logo Component
const CACLogo = () => (
  <div className="flex items-center justify-center gap-3 mb-4">
    <svg width="180" height="60" viewBox="0 0 180 60" className="drop-shadow-lg">
      <rect x="10" y="15" width="30" height="30" rx="5" fill="#6B2C91"/>
      <circle cx="25" cy="30" r="8" fill="#00A896"/>
      <text x="50" y="35" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#6B2C91">
        CANCER AND CAREERS
      </text>
      <text x="50" y="48" fontFamily="Arial, sans-serif" fontSize="10" fill="#4A5568">
        CEW Foundation
      </text>
    </svg>
  </div>
);

// Best Companies Award Badge
const AwardBadge = ({ size = 'large' }) => {
  const dimensions = size === 'large' ? { w: 120, h: 140 } : { w: 80, h: 93 };
  
  return (
    <div className="flex flex-col items-center">
      <svg width={dimensions.w} height={dimensions.h} viewBox="0 0 120 140" className="drop-shadow-xl">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B4DB3" />
            <stop offset="100%" stopColor="#6B2C91" />
          </linearGradient>
        </defs>
        
        <path d="M 40 90 L 35 140 L 50 120 L 40 90 Z" fill="url(#purpleGradient)" opacity="0.9"/>
        <path d="M 80 90 L 85 140 L 70 120 L 80 90 Z" fill="url(#purpleGradient)" opacity="0.9"/>
        
        <circle cx="60" cy="55" r="45" fill="url(#goldGradient)" stroke="#CC8800" strokeWidth="2"/>
        <circle cx="60" cy="55" r="38" fill="white" stroke="#FFD700" strokeWidth="2"/>
        
        <path d="M 60 20 L 63 30 L 73 30 L 65 36 L 68 46 L 60 40 L 52 46 L 55 36 L 47 30 L 57 30 Z" 
              fill="#6B2C91"/>
        
        <text x="60" y="60" textAnchor="middle" fontFamily="Arial" fontSize="9" fontWeight="bold" fill="#6B2C91">
          BEST
        </text>
        <text x="60" y="72" textAnchor="middle" fontFamily="Arial" fontSize="9" fontWeight="bold" fill="#6B2C91">
          COMPANIES
        </text>
        <text x="60" y="84" textAnchor="middle" fontFamily="Arial" fontSize="7" fill="#4A5568">
          2026
        </text>
      </svg>
      {size === 'large' && (
        <p className="text-center text-xs mt-2 font-semibold" style={{ color: COLORS.purple.primary }}>
          Working with Cancer
        </p>
      )}
    </div>
  );
};

const CompleteSurveyReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    loadAllSurveyData();
  }, []);

  const loadAllSurveyData = () => {
    try {
      const firmographics = JSON.parse(localStorage.getItem('firmographics_data') || '{}');
      const generalBenefits = JSON.parse(localStorage.getItem('general_benefits_data') || '{}');
      const currentSupport = JSON.parse(localStorage.getItem('current_support_data') || '{}');
      
      const dimensions = [];
      for (let i = 1; i <= 13; i++) {
        const dimData = JSON.parse(localStorage.getItem(`dimension_${i}_data`) || '{}');
        dimensions.push({
          number: i,
          name: getDimensionName(i),
          data: dimData
        });
      }

      const employeeImpact = JSON.parse(localStorage.getItem('employee_impact_data') || '{}');
      const crossDimensional = JSON.parse(localStorage.getItem('cross_dimensional_data') || '{}');

      const companyName = firmographics.companyName || 
                         firmographics.s1_company || 
                         'Company Assessment Report';

      const report = {
        companyName,
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

OVERALL COMPLETION: ${overallProgress}%

`;

    text += formatSectionForExport('COMPANY PROFILE (FIRMOGRAPHICS)', reportData.sections.firmographics);
    text += formatSectionForExport('GENERAL EMPLOYEE BENEFITS', reportData.sections.generalBenefits);
    text += formatSectionForExport('CURRENT SUPPORT PROGRAMS', reportData.sections.currentSupport);
    
    reportData.sections.dimensions.forEach((dim, idx) => {
      text += formatSectionForExport(`DIMENSION ${idx + 1}: ${dim.name.toUpperCase()}`, dim.data);
    });
    
    text += formatSectionForExport('EMPLOYEE IMPACT ASSESSMENT', reportData.sections.employeeImpact);
    text += formatSectionForExport('CROSS-DIMENSIONAL ASSESSMENT', reportData.sections.crossDimensional);

    text += `\n${'='.repeat(100)}\n`;
    text += `© ${new Date().getFullYear()} CEW Foundation / Cancer and Careers\n`;
    text += `Confidential - For Internal Use Only\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.companyName.replace(/\s+/g, '_')}_Complete_Assessment_${new Date().toISOString().split('T')[0]}.txt`;
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
        const formattedValue = typeof value === 'object' ? JSON.stringify(value) : value;
        text += `${formattedKey}: ${formattedValue}\n`;
      }
    });

    return text + '\n';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading complete assessment...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Assessment Data Found</h2>
          <p className="text-gray-600">Please complete the assessment surveys to generate your report.</p>
        </div>
      </div>
    );
  }

  const SectionCard = ({ title, icon: Icon, data, color, children }) => {
    const hasData = data && Object.keys(data).filter(k => data[k] && data[k] !== '').length > 0;
    
    return (
      <div className="bg-white rounded-lg shadow-md border-2 mb-6 overflow-hidden print:shadow-none print:break-inside-avoid"
           style={{ borderColor: color.border || COLORS.gray.light }}>
        <div className="p-4" style={{ 
          backgroundColor: color.bg || `${color}15`, 
          borderBottom: `3px solid ${color.primary || color}` 
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white">
                <Icon className="w-6 h-6" style={{ color: color.primary || color }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            {hasData ? (
              <CheckCircle2 className="w-6 h-6" style={{ color: COLORS.teal.primary }} />
            ) : (
              <AlertCircle className="w-6 h-6 text-orange-400" />
            )}
          </div>
        </div>
        <div className="p-6">
          {hasData ? children : (
            <p className="text-gray-500 italic">No data submitted for this section</p>
          )}
        </div>
      </div>
    );
  };

  const DataField = ({ label, value, highlight = false }) => {
    if (!value || value === '' || value === '—') return null;
    
    return (
      <div className={`py-3 border-b border-gray-100 ${highlight ? 'bg-purple-50 -mx-4 px-4' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <span className="text-sm text-gray-900 sm:text-right max-w-xl">
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
             typeof value === 'object' ? JSON.stringify(value) : value}
          </span>
        </div>
      </div>
    );
  };

  const renderFirmographics = () => {
    const data = reportData.sections.firmographics;
    return (
      <>
        <DataField label="Company Name" value={reportData.companyName} highlight />
        <DataField label="Primary Contact" value={[data.contactFirst, data.contactLast].filter(Boolean).join(' ') || data.contactName} />
        <DataField label="Contact Title" value={data.contactTitle} />
        <DataField label="Contact Email" value={data.contactEmail} highlight />
        <DataField label="Contact Phone" value={data.contactPhone} />
        <DataField label="Department" value={data.s3 || data.department} />
        <DataField label="Employee Size" value={data.s8} highlight />
        <DataField label="Headquarters" value={data.s9 || data.hq} />
        <DataField label="Global Footprint" value={data.s9a} />
        <DataField label="Industry" value={data.c2} highlight />
        <DataField label="Annual Revenue" value={data.c4} />
        <DataField label="Benefits Eligibility %" value={data.c5} highlight />
        <DataField label="Excluded Employee Groups" value={data.c3} />
        <DataField label="Remote/Hybrid Policy" value={data.c6} />
        <DataField label="Birth Year" value={data.s1} />
        <DataField label="Gender Identity" value={data.s2} />
        <DataField label="Job Function" value={data.s4a} />
        <DataField label="Current Level" value={data.s5} />
        <DataField label="Areas of Responsibility" value={data.s6} />
        <DataField label="Influence on Benefits" value={data.s7} />
      </>
    );
  };

  const renderGeneralData = (data) => {
    return Object.entries(data)
      .filter(([key, value]) => value && value !== '')
      .map(([key, value]) => (
        <DataField 
          key={key} 
          label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
          value={value} 
        />
      ));
  };

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="print:hidden bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="w-24">
              <AwardBadge size="small" />
            </div>
            
            <div className="flex-1 flex items-center justify-center gap-3">
              <FileText className="w-8 h-8" style={{ color: COLORS.purple.primary }} />
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Complete Assessment Report</h1>
                <p className="text-sm text-gray-500">All Survey Responses</p>
              </div>
            </div>
            
            <div className="w-24">
              <svg width="80" height="28" viewBox="0 0 180 60">
                <rect x="10" y="15" width="30" height="30" rx="5" fill="#6B2C91"/>
                <circle cx="25" cy="30" r="8" fill="#00A896"/>
                <text x="50" y="35" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="#6B2C91">C&C</text>
              </svg>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 rounded-lg hover:bg-gray-50"
              style={{ borderColor: COLORS.gray.light }}
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90"
              style={{ backgroundColor: COLORS.purple.primary }}
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="hidden print:block bg-white p-8 border-b-4 mb-6" style={{ borderColor: COLORS.purple.primary }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <AwardBadge size="large" />
          </div>
          
          <div className="flex-1 text-center px-8">
            <CACLogo />
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
          
          <div className="opacity-20">
            <AwardBadge size="large" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 print:py-4">
        <div className="rounded-xl shadow-lg p-8 mb-8 text-white print:shadow-none relative overflow-hidden" 
             style={{ background: `linear-gradient(135deg, ${COLORS.purple.primary} 0%, ${COLORS.purple.light} 100%)` }}>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{reportData.companyName}</h2>
              <p className="text-purple-100 text-lg">Workplace Cancer Support Assessment</p>
              <div className="mt-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span className="text-sm font-semibold">Best Companies for Working with Cancer Index</span>
              </div>
            </div>
            <div className="text-center bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-5xl font-bold mb-2">{overallProgress}%</div>
              <p className="text-purple-100 font-semibold">Complete</p>
            </div>
          </div>
          <div className="absolute right-8 bottom-4 opacity-10">
            <Award className="w-32 h-32" />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-7 h-7 text-purple-600" />
            Core Assessment Sections
          </h2>

          <SectionCard 
            title="Company Profile (Firmographics)" 
            icon={Building2}
            data={reportData.sections.firmographics}
            color={COLORS.purple}
          >
            {renderFirmographics()}
          </SectionCard>

          <SectionCard 
            title="General Employee Benefits" 
            icon={Heart}
            data={reportData.sections.generalBenefits}
            color={COLORS.teal}
          >
            {renderGeneralData(reportData.sections.generalBenefits)}
          </SectionCard>

          <SectionCard 
            title="Current Support Programs" 
            icon={Users}
            data={reportData.sections.currentSupport}
            color={COLORS.orange}
          >
            {renderGeneralData(reportData.sections.currentSupport)}
          </SectionCard>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-7 h-7 text-orange-500" />
            13 Support Dimensions
          </h2>

          {reportData.sections.dimensions.map((dim, idx) => (
            <SectionCard 
              key={idx}
              title={`D${dim.number}: ${dim.name}`}
              icon={Target}
              data={dim.data}
              color={COLORS.orange}
            >
              {renderGeneralData(dim.data)}
            </SectionCard>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-purple-600" />
            Advanced Assessments
          </h2>

          <SectionCard 
            title="Employee Impact Assessment" 
            icon={TrendingUp}
            data={reportData.sections.employeeImpact}
            color={COLORS.purple}
          >
            {renderGeneralData(reportData.sections.employeeImpact)}
          </SectionCard>

          <SectionCard 
            title="Cross-Dimensional Assessment" 
            icon={Target}
            data={reportData.sections.crossDimensional}
            color={COLORS.teal}
          >
            {renderGeneralData(reportData.sections.crossDimensional)}
          </SectionCard>
        </div>

        <div className="mt-12 pt-6 border-t-2 text-center" style={{ borderColor: COLORS.purple.border }}>
          <div className="flex items-center justify-center gap-8 mb-4">
            <CACLogo />
            <div className="h-12 w-px" style={{ backgroundColor: COLORS.gray.light }}></div>
            <AwardBadge size="small" />
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

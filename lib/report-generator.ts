/**
 * COMPREHENSIVE ASSESSMENT REPORT GENERATOR
 * Generates complete reports with all 19 sections including detailed executive summary
 * 
 * INSTALL TO: /lib/report-generator.ts
 */

// ========================================
// SECTION 1: FIRMOGRAPHICS
// ========================================

function generateFirmographicsSection(data: any): string {
  if (!data) return '';
  
  let output = `## SECTION 1: COMPANY FIRMOGRAPHICS\n\n`;
  
  if (data.companyName) output += `**Company Name:** ${data.companyName}\n\n`;
  if (data.firstName || data.lastName) {
    output += `**Contact Person:** ${data.firstName || ''} ${data.lastName || ''}\n\n`;
  }
  if (data.title) output += `**Title:** ${data.title}\n\n`;
  if (data.s8) output += `**Total Employees:** ${data.s8}\n\n`;
  if (data.s9) output += `**Headquarters:** ${data.s9}\n\n`;
  if (data.s9a) output += `**Countries with Presence:** ${data.s9a}\n\n`;
  if (data.c2) output += `**Industry:** ${data.c2}\n\n`;
  if (data.c4) output += `**Annual Revenue:** ${data.c4}\n\n`;
  
  // Authorization
  if (data.au1) {
    output += `\n**Authorization Status:** ${data.au1}\n\n`;
    if (data.au2 && Array.isArray(data.au2)) {
      output += `**Authorization Details:**\n`;
      data.au2.forEach((item: string) => {
        output += `- ${item}\n`;
      });
      output += `\n`;
    }
  }
  
  output += `---\n\n`;
  return output;
}

// ========================================
// SECTION 2: GENERAL BENEFITS
// ========================================

function generateGeneralBenefitsSection(data: any): string {
  if (!data) return '';
  
  let output = `## SECTION 2: GENERAL BENEFITS LANDSCAPE\n\n`;
  
  if (data.cb1 && Array.isArray(data.cb1) && data.cb1.length > 0) {
    output += `### Current Benefits Offered\n`;
    data.cb1.forEach((benefit: string) => {
      output += `- ${benefit}\n`;
    });
    output += `\n`;
  }
  
  if (data.cb1a) {
    output += `**Employees with National Healthcare Access:** ${data.cb1a}%\n\n`;
  }
  
  if (data.cb2b && Array.isArray(data.cb2b) && data.cb2b.length > 0) {
    output += `### Benefits Planned for Next 2 Years\n`;
    data.cb2b.forEach((benefit: string) => {
      output += `- ${benefit}\n`;
    });
    output += `\n`;
  }
  
  output += `---\n\n`;
  return output;
}

// ========================================
// SECTION 3: CURRENT SUPPORT
// ========================================

function generateCurrentSupportSection(data: any): string {
  if (!data) return '';
  
  let output = `## SECTION 3: CURRENT SUPPORT PROGRAMS\n\n`;
  
  if (data.or1) {
    output += `**Organization's Approach:** ${data.or1}\n\n`;
  }
  
  if (data.or2a && Array.isArray(data.or2a) && data.or2a.length > 0) {
    output += `### What Triggered Development of Enhanced Support\n`;
    data.or2a.forEach((trigger: string) => {
      output += `- ${trigger}\n`;
    });
    output += `\n`;
  }
  
  if (data.or2b) {
    output += `### Most Impactful Change Made\n${data.or2b}\n\n`;
  }
  
  if (data.or3 && Array.isArray(data.or3) && data.or3.length > 0) {
    output += `### Barriers to Comprehensive Support\n`;
    data.or3.forEach((barrier: string) => {
      output += `- ${barrier}\n`;
    });
    output += `\n`;
  }
  
  if (data.or5a && Array.isArray(data.or5a) && data.or5a.length > 0) {
    output += `### Caregiver Support Provided\n`;
    data.or5a.forEach((support: string) => {
      output += `- ${support}\n`;
    });
    output += `\n`;
  }
  
  if (data.or6 && Array.isArray(data.or6) && data.or6.length > 0) {
    output += `### How Organization Monitors Effectiveness\n`;
    data.or6.forEach((method: string) => {
      output += `- ${method}\n`;
    });
    output += `\n`;
  }
  
  output += `---\n\n`;
  return output;
}

// ========================================
// DIMENSIONS 1-13
// ========================================

const DIMENSION_NAMES: Record<number, string> = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources',
  5: 'Workplace Accommodations',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention, Wellness & Legal Compliance',
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness'
};

function formatMainGrid(gridData: any): string {
  if (!gridData || typeof gridData !== 'object') return '';
  
  const groups: Record<string, string[]> = {
    'Currently offer': [],
    'Currently provide to managers': [],
    'Currently measure / track': [],
    'Currently use': [],
    'In active planning / development': [],
    'Assessing feasibility': [],
    'Not able to offer in foreseeable future': [],
    'Not able to provide in foreseeable future': [],
    'Not able to measure / track in foreseeable future': [],
    'Not able to utilize in foreseeable future': [],
    'Unsure': []
  };
  
  Object.entries(gridData).forEach(([program, status]) => {
    if (typeof status === 'string') {
      // Normalize to match group keys
      if (status.startsWith('Currently')) {
        if (status.includes('provide to managers')) {
          groups['Currently provide to managers'].push(program);
        } else if (status.includes('measure') || status.includes('track')) {
          groups['Currently measure / track'].push(program);
        } else if (status.includes('use')) {
          groups['Currently use'].push(program);
        } else {
          groups['Currently offer'].push(program);
        }
      } else if (groups[status]) {
        groups[status].push(program);
      }
    }
  });
  
  let output = '';
  
  // Currently categories
  const currentlyKeys = ['Currently offer', 'Currently provide to managers', 'Currently measure / track', 'Currently use'];
  currentlyKeys.forEach(key => {
    if (groups[key].length > 0) {
      output += `\n**✅ ${key}** (${groups[key].length} items)\n`;
      groups[key].forEach(item => output += `  • ${item}\n`);
    }
  });
  
  // In development
  if (groups['In active planning / development'].length > 0) {
    output += `\n**🔄 In active planning / development** (${groups['In active planning / development'].length} items)\n`;
    groups['In active planning / development'].forEach(item => output += `  • ${item}\n`);
  }
  
  // Assessing
  if (groups['Assessing feasibility'].length > 0) {
    output += `\n**🤔 Assessing feasibility** (${groups['Assessing feasibility'].length} items)\n`;
    groups['Assessing feasibility'].forEach(item => output += `  • ${item}\n`);
  }
  
  // Not able
  const notAbleKeys = ['Not able to offer in foreseeable future', 'Not able to provide in foreseeable future', 
                       'Not able to measure / track in foreseeable future', 'Not able to utilize in foreseeable future'];
  notAbleKeys.forEach(key => {
    if (groups[key].length > 0) {
      output += `\n**❌ ${key}** (${groups[key].length} items)\n`;
      groups[key].forEach(item => output += `  • ${item}\n`);
    }
  });
  
  // Unsure
  if (groups['Unsure'].length > 0) {
    output += `\n**❓ Unsure** (${groups['Unsure'].length} items)\n`;
    groups['Unsure'].forEach(item => output += `  • ${item}\n`);
  }
  
  return output;
}

function generateDimensionSection(dimNum: number, data: any): string {
  if (!data) return '';
  
  let output = `## DIMENSION ${dimNum}: ${DIMENSION_NAMES[dimNum]}\n\n`;
  
  const gridData = data[`d${dimNum}a`];
  if (gridData) {
    output += `### Primary Programs Offered\n`;
    output += formatMainGrid(gridData);
    output += `\n`;
  }
  
  // Follow-up details
  const aa = data[`d${dimNum}aa`];
  if (aa || Object.keys(data).some(k => k.startsWith(`d${dimNum}`) && k !== `d${dimNum}a` && k !== `d${dimNum}aa`)) {
    output += `\n### Follow-Up Details\n\n`;
    
    if (aa) {
      output += `**Geographic Implementation:** ${aa}\n\n`;
    }
    
    // Dimension-specific follow-ups
    switch (dimNum) {
      case 1:
        if (data.d1_1_usa || data.d1_1_non_usa) {
          output += `**Additional Paid Medical Leave:**\n`;
          if (data.d1_1_usa) output += `- USA (beyond FMLA): ${data.d1_1_usa}\n`;
          if (data.d1_1_non_usa) output += `- Outside USA (beyond statutory): ${data.d1_1_non_usa}\n`;
          output += `\n`;
        }
        if (data.d1_2_usa || data.d1_2_non_usa) {
          output += `**Additional Intermittent Leave:**\n`;
          if (data.d1_2_usa) output += `- USA: ${data.d1_2_usa}\n`;
          if (data.d1_2_non_usa) output += `- Outside USA: ${data.d1_2_non_usa}\n`;
          output += `\n`;
        }
        if (data.d1_4a_type) {
          output += `**Additional Remote Work:** ${data.d1_4a_type}`;
          if (data.d1_4a_weeks) output += ` (${data.d1_4a_weeks} weeks)`;
          if (data.d1_4a_months) output += ` (${data.d1_4a_months} months)`;
          output += `\n\n`;
        }
        if (data.d1_4b) {
          output += `**Reduced Schedule Duration:** ${data.d1_4b}\n\n`;
        }
        if (data.d1_5_usa || data.d1_5_non_usa) {
          output += `**Job Protection Beyond Legal Requirements:**\n`;
          if (data.d1_5_usa) output += `- USA: ${data.d1_5_usa}\n`;
          if (data.d1_5_non_usa) output += `- Outside USA: ${data.d1_5_non_usa}\n`;
          output += `\n`;
        }
        if (data.d1_6 && Array.isArray(data.d1_6)) {
          output += `**Disability Enhancements:** ${data.d1_6.join(', ')}\n\n`;
        }
        if (data.d1b) output += `**Additional Context:** ${data.d1b}\n\n`;
        break;
        
      case 3:
        if (data.d31a) output += `**Training Approach:** ${data.d31a}\n\n`;
        if (data.d31) output += `**Manager Completion Rate (past 2 years):** ${data.d31}\n\n`;
        if (data.d3b) output += `**Additional Context:** ${data.d3b}\n\n`;
        break;
        
      case 4:
        if (data.d41a && Array.isArray(data.d41a)) {
          output += `**Navigation Providers:** ${data.d41a.join(', ')}`;
          if (data.d41a_other) output += ` (${data.d41a_other})`;
          output += `\n\n`;
        }
        if (data.d41b && Array.isArray(data.d41b)) {
          output += `**Services Available:**\n`;
          data.d41b.forEach((svc: string) => output += `- ${svc}\n`);
          if (data.d41b_other) output += `- ${data.d41b_other}\n`;
          output += `\n`;
        }
        if (data.d4b) output += `**Additional Context:** ${data.d4b}\n\n`;
        break;
    }
  }
  
  output += `---\n\n`;
  return output;
}

// ========================================
// SECTION 17: CROSS-DIMENSIONAL
// ========================================

function generateCrossDimensionalSection(data: any): string {
  if (!data) return '';
  
  let output = `## SECTION 17: CROSS-DIMENSIONAL ASSESSMENT\n\n`;
  
  if (data.cd1a && Array.isArray(data.cd1a) && data.cd1a.length > 0) {
    output += `### Top 3 Priority Dimensions for Enhancement\n`;
    data.cd1a.forEach((dim: string) => output += `- ${dim}\n`);
    output += `\n`;
  }
  
  if (data.cd1b && Array.isArray(data.cd1b) && data.cd1b.length > 0) {
    output += `### Lowest Priority Dimensions\n`;
    data.cd1b.forEach((dim: string) => output += `- ${dim}\n`);
    output += `\n`;
  }
  
  if (data.cd2 && Array.isArray(data.cd2) && data.cd2.length > 0) {
    output += `### Biggest Implementation Challenges\n`;
    data.cd2.forEach((challenge: string) => output += `- ${challenge}\n`);
    output += `\n`;
  }
  
  output += `---\n\n`;
  return output;
}

// ========================================
// SECTION 18: EMPLOYEE IMPACT
// ========================================

function generateEmployeeImpactSection(data: any): string {
  if (!data) return '';
  
  let output = `## SECTION 18: EMPLOYEE IMPACT ASSESSMENT\n\n`;
  
  if (data.ei1 && typeof data.ei1 === 'object') {
    output += `### Positive Outcomes Observed\n`;
    Object.entries(data.ei1).forEach(([outcome, impact]) => {
      output += `- **${outcome}:** ${impact}\n`;
    });
    output += `\n`;
  }
  
  if (data.ei2) {
    output += `**ROI Measurement Status:** ${data.ei2}\n\n`;
  }
  
  if (data.ei3) {
    output += `**Approximate ROI:** ${data.ei3}\n\n`;
  }
  
  if (data.ei4 && data.ei4 !== 'No additional advice') {
    output += `### Advice for Other HR Leaders\n${data.ei4}\n\n`;
  }
  
  if (data.ei5 && data.ei5 !== 'None that I can think of') {
    output += `### Important Aspects Not Addressed by Survey\n${data.ei5}\n\n`;
  }
  
  output += `---\n\n`;
  return output;
}

// ========================================
// SECTION 19: COMPREHENSIVE EXECUTIVE SUMMARY
// ========================================

function generateExecutiveSummary(assessment: any): string {
  let output = `## EXECUTIVE SUMMARY\n\n`;
  
  // Company Overview
  const firm = assessment.firmographics_data;
  if (firm) {
    output += `### Company Profile\n`;
    if (firm.companyName) output += `**Company:** ${firm.companyName}\n`;
    if (firm.c2) output += `**Industry:** ${firm.c2}\n`;
    if (firm.s8) output += `**Size:** ${firm.s8} employees\n`;
    if (firm.s9) output += `**Headquarters:** ${firm.s9}\n`;
    if (firm.s9a) output += `**Global Presence:** ${firm.s9a}\n`;
    if (firm.c4) output += `**Revenue:** ${firm.c4}\n`;
    output += `\n`;
  }
  
  // Program Maturity Analysis
  let totalCurrently = 0, totalPlanning = 0, totalAssessing = 0, totalNotAble = 0;
  for (let i = 1; i <= 13; i++) {
    const gridData = assessment[`dimension${i}_data`]?.[`d${i}a`];
    if (gridData && typeof gridData === 'object') {
      Object.values(gridData).forEach(status => {
        if (typeof status === 'string') {
          if (status.startsWith('Currently')) totalCurrently++;
          else if (status === 'In active planning / development') totalPlanning++;
          else if (status === 'Assessing feasibility') totalAssessing++;
          else if (status.startsWith('Not able')) totalNotAble++;
        }
      });
    }
  }
  
  const totalPrograms = totalCurrently + totalPlanning + totalAssessing + totalNotAble;
  const maturityScore = totalPrograms > 0 ? Math.round((totalCurrently / totalPrograms) * 100) : 0;
  
  output += `### Program Maturity\n`;
  output += `**Overall Maturity Score:** ${maturityScore}% (${totalCurrently} of ${totalPrograms} programs currently offered)\n\n`;
  output += `**Program Status:**\n`;
  output += `- ✅ Currently Offering: ${totalCurrently} programs across all dimensions\n`;
  if (totalPlanning > 0) output += `- 🔄 In Development: ${totalPlanning} programs\n`;
  if (totalAssessing > 0) output += `- 🤔 Under Assessment: ${totalAssessing} programs\n`;
  if (totalNotAble > 0) output += `- ❌ Not Currently Feasible: ${totalNotAble} programs\n`;
  output += `\n`;
  
  // Geographic Scope
  let consistent = 0, select = 0, vary = 0, notReported = 0;
  for (let i = 1; i <= 13; i++) {
    const aa = assessment[`dimension${i}_data`]?.[`d${i}aa`];
    if (aa === 'Generally consistent across all locations') consistent++;
    else if (aa === 'Only available in select locations') select++;
    else if (aa === 'Vary across locations') vary++;
    else if (!aa) notReported++;
  }
  
  output += `### Geographic Implementation Scope\n`;
  if (consistent > 0) output += `- 🌎 **Globally Consistent:** ${consistent} of 13 dimensions\n`;
  if (select > 0) output += `- 📍 **Select Locations:** ${select} of 13 dimensions\n`;
  if (vary > 0) output += `- 🔀 **Varies by Location:** ${vary} of 13 dimensions\n`;
  if (notReported > 0) output += `- ❓ **Not Reported:** ${notReported} of 13 dimensions\n`;
  output += `\n`;
  
  // Strategic Priorities
  const cross = assessment.cross_dimensional_data;
  if (cross) {
    if (cross.cd1a && Array.isArray(cross.cd1a) && cross.cd1a.length > 0) {
      output += `### Strategic Priorities\n`;
      output += `**Top Enhancement Opportunities:**\n`;
      cross.cd1a.forEach((dim: string) => output += `- ${dim}\n`);
      output += `\n`;
    }
    
    if (cross.cd2 && Array.isArray(cross.cd2) && cross.cd2.length > 0) {
      output += `**Key Implementation Challenges:**\n`;
      cross.cd2.slice(0, 3).forEach((challenge: string) => output += `- ${challenge}\n`);
      output += `\n`;
    }
  }
  
  // Impact & ROI
  const impact = assessment['employee-impact-assessment_data'];
  if (impact) {
    output += `### Impact Assessment\n`;
    
    if (impact.ei2) {
      output += `**ROI Analysis:** ${impact.ei2}\n`;
    }
    if (impact.ei3) {
      output += `**ROI Result:** ${impact.ei3}\n`;
    }
    
    // Count significant impacts
    if (impact.ei1 && typeof impact.ei1 === 'object') {
      const significant = Object.values(impact.ei1).filter((v: any) => v === 'significant' || v === 'Significant positive impact').length;
      const moderate = Object.values(impact.ei1).filter((v: any) => v === 'moderate' || v === 'Moderate positive impact').length;
      output += `**Outcome Areas with Significant Impact:** ${significant} of ${Object.keys(impact.ei1).length}\n`;
      output += `**Outcome Areas with Moderate Impact:** ${moderate} of ${Object.keys(impact.ei1).length}\n`;
    }
    output += `\n`;
  }
  
  // Organization Maturity Level
  output += `### Overall Program Maturity Assessment\n`;
  if (maturityScore >= 80) {
    output += `**Level: LEADING** - This organization demonstrates comprehensive support programs across dimensions with ${maturityScore}% of potential programs currently offered. Strong foundation for supporting employees managing serious health conditions.\n`;
  } else if (maturityScore >= 60) {
    output += `**Level: ESTABLISHED** - This organization has substantial support programs in place (${maturityScore}% maturity) with clear opportunities for enhancement in priority dimensions.\n`;
  } else if (maturityScore >= 40) {
    output += `**Level: DEVELOPING** - This organization is building support capabilities (${maturityScore}% maturity) with ${totalPlanning} programs in development and clear strategic priorities identified.\n`;
  } else if (maturityScore >= 20) {
    output += `**Level: EMERGING** - This organization is in early stages of program development (${maturityScore}% maturity) with foundation programs in place and opportunities for expansion.\n`;
  } else {
    output += `**Level: FOUNDATIONAL** - This organization is beginning its journey in workplace support programs with ${totalCurrently} programs currently offered.\n`;
  }
  
  output += `\n---\n`;
  output += `*Confidential - For benchmarking and internal use only*\n`;
  
  return output;
}

// ========================================
// MAIN REPORT GENERATOR
// ========================================

export function generateCompleteReport(assessment: any): string {
  let report = `# COMPREHENSIVE ASSESSMENT REPORT\n\n`;
  report += `## ${assessment.company_name || 'Company Assessment'}\n\n`;
  report += `**Survey ID:** ${assessment.survey_id || assessment.app_id || 'N/A'}\n`;
  report += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
  report += `---\n\n`;
  
  // Section 1: Firmographics
  report += generateFirmographicsSection(assessment.firmographics_data);
  
  // Section 2: General Benefits
  report += generateGeneralBenefitsSection(assessment.general_benefits_data);
  
  // Section 3: Current Support
  report += generateCurrentSupportSection(assessment.current_support_data);
  
  // Sections 4-16: Dimensions 1-13
  for (let i = 1; i <= 13; i++) {
    const dimData = assessment[`dimension${i}_data`];
    if (dimData && Object.keys(dimData).length > 0) {
      report += generateDimensionSection(i, dimData);
    }
  }
  
  // Section 17: Cross-Dimensional
  report += generateCrossDimensionalSection(assessment.cross_dimensional_data);
  
  // Section 18: Employee Impact
  report += generateEmployeeImpactSection(assessment['employee-impact-assessment_data']);
  
  // Section 19: Executive Summary
  report += generateExecutiveSummary(assessment);
  
  return report;
}

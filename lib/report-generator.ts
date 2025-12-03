/**
 * COMPLETE DIMENSION REPORT GENERATOR
 * Includes ALL sections: Firmographics, General Benefits, Current Support, 
 * 13 Dimensions, Cross-Dimensional, Employee Impact, Executive Summary
 */

const DIMENSION_NAMES: Record<number, string> = {
  1: "Medical Leave & Flexibility",
  2: "Insurance & Financial Protection",
  3: "Manager Preparedness & Capability",
  4: "Navigation & Expert Resources",
  5: "Workplace Accommodations & Modifications",
  6: "Culture & Psychological Safety",
  7: "Career Continuity & Advancement",
  8: "Work Continuation & Resumption",
  9: "Executive Commitment & Resources",
  10: "Caregiver & Family Support",
  11: "Prevention, Wellness & Legal Compliance",
  12: "Continuous Improvement & Outcomes",
  13: "Communication & Awareness",
};

const STATUS_ORDER = [
  "Currently offer",
  "Currently measure / track",
  "Currently use",
  "Currently provide to managers",
  "In active planning / development",
  "Assessing feasibility",
  "Not able to offer in foreseeable future",
  "Not able to measure / track in foreseeable future",
  "Not able to utilize in foreseeable future",
  "Not able to provide in foreseeable future",
  "Unsure"
];

const STATUS_ICONS: Record<string, string> = {
  "Currently offer": "✅",
  "Currently measure / track": "✅",
  "Currently use": "✅",
  "Currently provide to managers": "✅",
  "In active planning / development": "🔄",
  "Assessing feasibility": "🤔",
  "Not able to offer in foreseeable future": "❌",
  "Not able to measure / track in foreseeable future": "❌",
  "Not able to utilize in foreseeable future": "❌",
  "Not able to provide in foreseeable future": "❌",
  "Unsure": "❓"
};

// ========================================
// SECTION 1: FIRMOGRAPHICS
// ========================================
function generateFirmographicsSection(data: any): string {
  if (!data || Object.keys(data).length === 0) return '';
  
  let output = `\n## SECTION 1: COMPANY FIRMOGRAPHICS\n\n`;
  
  if (data.companyName) output += `**Company Name:** ${data.companyName}\n`;
  if (data.firstName && data.lastName) {
    output += `**Contact:** ${data.firstName} ${data.lastName}\n`;
  }
  if (data.title) output += `**Title:** ${data.title}\n`;
  
  // Authorization
  if (data.au1) output += `**Authorized to Complete Survey:** ${data.au1}\n`;
  if (data.au2 && Array.isArray(data.au2)) {
    output += `**Authorization Details:**\n`;
    data.au2.forEach(item => output += `  • ${item}\n`);
  }
  
  output += `\n---\n`;
  return output;
}

// ========================================
// SECTION 2: GENERAL BENEFITS
// ========================================
function generateGeneralBenefitsSection(data: any): string {
  if (!data || Object.keys(data).length === 0) return '';
  
  let output = `\n## SECTION 2: GENERAL BENEFITS LANDSCAPE\n\n`;
  
  // Current benefits (cb1)
  if (data.cb1 && Array.isArray(data.cb1) && data.cb1.length > 0) {
    output += `### Current Benefits Offered\n`;
    data.cb1.forEach(benefit => output += `• ${benefit}\n`);
    output += `\n`;
  }
  
  // Planned benefits (cb2b)
  if (data.cb2b && Array.isArray(data.cb2b) && data.cb2b.length > 0) {
    output += `### Benefits Planned for Next 2 Years\n`;
    data.cb2b.forEach(benefit => output += `• ${benefit}\n`);
    output += `\n`;
  }
  
  output += `---\n`;
  return output;
}

// ========================================
// SECTION 3: CURRENT SUPPORT
// ========================================
function generateCurrentSupportSection(data: any): string {
  if (!data || Object.keys(data).length === 0) return '';
  
  let output = `\n## SECTION 3: CURRENT SUPPORT PROGRAMS\n\n`;
  
  // Organization approach (or1)
  if (data.or1) {
    output += `**Organization's Current Approach:**\n${data.or1}\n\n`;
  }
  
  // What triggered development (or2a)
  if (data.or2a && Array.isArray(data.or2a) && data.or2a.length > 0) {
    output += `**What Triggered Enhanced Support:**\n`;
    data.or2a.forEach(trigger => output += `• ${trigger}\n`);
    output += `\n`;
  }
  
  // Most impactful change (or2b)
  if (data.or2b) {
    output += `**Most Impactful Change:**\n> "${data.or2b}"\n\n`;
  }
  
  // Barriers (or3)
  if (data.or3 && Array.isArray(data.or3) && data.or3.length > 0) {
    output += `**Barriers to More Comprehensive Support:**\n`;
    data.or3.forEach(barrier => output += `• ${barrier}\n`);
    output += `\n`;
  }
  
  // Caregiver support (or5a)
  if (data.or5a && Array.isArray(data.or5a) && data.or5a.length > 0) {
    output += `**Caregiver Support Provided:**\n`;
    data.or5a.forEach(support => output += `• ${support}\n`);
    output += `\n`;
  }
  
  // Monitoring effectiveness (or6)
  if (data.or6 && Array.isArray(data.or6) && data.or6.length > 0) {
    output += `**How Effectiveness is Monitored:**\n`;
    data.or6.forEach(method => output += `• ${method}\n`);
    output += `\n`;
  }
  
  output += `---\n`;
  return output;
}

// ========================================
// DIMENSIONS (Main Grid Helper)
// ========================================
function formatMainGrid(dimNum: number, gridData: any, dimName: string): string {
  if (!gridData || typeof gridData !== 'object') return '';
  
  let output = `### Primary Programs Offered\n`;
  
  const byStatus: Record<string, string[]> = {};
  Object.entries(gridData).forEach(([item, status]) => {
    if (typeof status === 'string' && STATUS_ORDER.includes(status)) {
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(item);
    }
  });
  
  let hasItems = false;
  STATUS_ORDER.forEach(status => {
    if (byStatus[status] && byStatus[status].length > 0) {
      hasItems = true;
      const icon = STATUS_ICONS[status] || '•';
      output += `**${icon} ${status}** (${byStatus[status].length} item${byStatus[status].length > 1 ? 's' : ''})\n`;
      byStatus[status].forEach(item => output += `  • ${item}\n`);
      output += `\n`;
    }
  });
  
  if (!hasItems) output += `*No responses recorded*\n\n`;
  
  output += `---\n\n`;
  return output;
}

// ========================================
// DIMENSION FOLLOW-UPS
// ========================================
function formatRemoteWork(data: any): string {
  const type = data.d1_4a_type;
  if (type === 'weeks' && data.d1_4a_weeks) return `Up to ${data.d1_4a_weeks} weeks`;
  if (type === 'months' && data.d1_4a_months) return `Up to ${data.d1_4a_months} months`;
  if (type === 'provider_requested') return 'As long as requested by healthcare provider';
  if (type === 'medically_necessary') return 'As long as medically necessary';
  if (type === 'unlimited') return 'Unlimited with medical certification';
  if (type === 'case_by_case') return 'Case-by-case basis';
  if (type === 'no_additional') return 'No additional remote work beyond legal requirements';
  return 'Not specified';
}

function generateDimensionSection(dimNum: number, data: any): string {
  let output = `\n## DIMENSION ${dimNum}: ${DIMENSION_NAMES[dimNum]}\n\n`;
  
  const mainGridKey = `d${dimNum}a`;
  if (data[mainGridKey]) {
    output += formatMainGrid(dimNum, data[mainGridKey], DIMENSION_NAMES[dimNum]);
  }
  
  const hasFollowups = Object.keys(data).some(key => key !== mainGridKey && !key.startsWith(`${mainGridKey}.`));
  
  if (hasFollowups) {
    output += `### Follow-Up Details\n\n`;
    
    const aaKey = `d${dimNum}aa`;
    if (data[aaKey]) {
      output += `**Geographic Implementation:** ${data[aaKey]}\n\n`;
    }
    
    // Dimension-specific follow-ups
    if (dimNum === 1) {
      if (data.d1_1_usa || data.d1_1_non_usa) {
        output += `**Additional Paid Medical Leave:**\n`;
        if (data.d1_1_usa) output += `• USA (beyond FMLA): ${data.d1_1_usa}\n`;
        if (data.d1_1_non_usa) output += `• Outside USA: ${data.d1_1_non_usa}\n`;
        output += `\n`;
      }
      
      if (data.d1_2_usa || data.d1_2_non_usa) {
        output += `**Additional Intermittent Leave:**\n`;
        if (data.d1_2_usa) output += `• USA: ${data.d1_2_usa}\n`;
        if (data.d1_2_non_usa) output += `• Outside USA: ${data.d1_2_non_usa}\n`;
        output += `\n`;
      }
      
      if (data.d1_4a_type) output += `**Remote Work Options:** ${formatRemoteWork(data)}\n\n`;
      if (data.d1_4b) output += `**Reduced Schedule Duration:** ${data.d1_4b}\n\n`;
      
      if (data.d1_5_usa || data.d1_5_non_usa) {
        output += `**Job Protection Guarantee:**\n`;
        if (data.d1_5_usa) output += `• USA: ${data.d1_5_usa}\n`;
        if (data.d1_5_non_usa) output += `• Outside USA: ${data.d1_5_non_usa}\n`;
        output += `\n`;
      }
      
      if (data.d1_6 && Array.isArray(data.d1_6) && data.d1_6.length > 0) {
        output += `**Disability Pay Enhancements:**\n`;
        data.d1_6.forEach(item => output += `• ${item}\n`);
        output += `\n`;
      }
      
      if (data.d1b && data.d1b.trim()) output += `**Additional Context:**\n> "${data.d1b}"\n\n`;
    }
    
    if (dimNum === 3) {
      if (data.d31a) output += `**Training Approach:** ${data.d31a}\n`;
      if (data.d31) output += `**Training Completion:** ${data.d31}\n`;
      if (data.d31a || data.d31) output += `\n`;
      if (data.d3b && data.d3b.trim()) output += `**Additional Context:**\n> "${data.d3b}"\n\n`;
    }
    
    if (dimNum === 4) {
      if (data.d41a && Array.isArray(data.d41a) && data.d41a.length > 0) {
        output += `**Navigation Providers:**\n`;
        data.d41a.forEach(item => output += `• ${item}\n`);
        if (data.d41a_other) output += `  *(${data.d41a_other})*\n`;
        output += `\n`;
      }
      
      if (data.d41b && Array.isArray(data.d41b) && data.d41b.length > 0) {
        output += `**Available Services:**\n`;
        data.d41b.forEach(item => output += `• ${item}\n`);
        if (data.d41b_other) output += `  *(${data.d41b_other})*\n`;
        output += `\n`;
      }
      
      if (data.d4b && data.d4b.trim()) output += `**Additional Context:**\n> "${data.d4b}"\n\n`;
    }
  }
  
  output += `---\n`;
  return output;
}

// ========================================
// SECTION 17: CROSS-DIMENSIONAL
// ========================================
function generateCrossDimensionalSection(data: any): string {
  if (!data || Object.keys(data).length === 0) return '';
  
  let output = `\n## SECTION 17: CROSS-DIMENSIONAL ASSESSMENT\n\n`;
  
  if (data.cd1a && Array.isArray(data.cd1a) && data.cd1a.length > 0) {
    output += `**Top 3 Dimensions for Enhancement (Best Outcomes):**\n`;
    data.cd1a.forEach((dim, idx) => output += `${idx + 1}. ${dim}\n`);
    output += `\n`;
  }
  
  if (data.cd1b && Array.isArray(data.cd1b) && data.cd1b.length > 0) {
    output += `**Lowest Priority Dimensions:**\n`;
    data.cd1b.forEach(dim => output += `• ${dim}\n`);
    output += `\n`;
  }
  
  if (data.cd2 && Array.isArray(data.cd2) && data.cd2.length > 0) {
    output += `**Biggest Challenges:**\n`;
    data.cd2.forEach(challenge => output += `• ${challenge}\n`);
    output += `\n`;
  }
  
  output += `---\n`;
  return output;
}

// ========================================
// SECTION 18: EMPLOYEE IMPACT
// ========================================
function generateEmployeeImpactSection(data: any): string {
  if (!data || Object.keys(data).length === 0) return '';
  
  let output = `\n## SECTION 18: EMPLOYEE IMPACT ASSESSMENT\n\n`;
  
  if (data.ei1 && typeof data.ei1 === 'object') {
    output += `**Positive Outcomes Observed:**\n`;
    Object.entries(data.ei1).forEach(([outcome, impact]) => {
      output += `• ${outcome}: **${impact}**\n`;
    });
    output += `\n`;
  }
  
  if (data.ei2) output += `**ROI Measurement Status:** ${data.ei2}\n\n`;
  if (data.ei3) output += `**Approximate ROI:** ${data.ei3}\n\n`;
  
  if (data.ei4 && data.ei4.trim()) {
    output += `**Advice for Other HR Leaders:**\n> "${data.ei4}"\n\n`;
  }
  
  if (data.ei5 && data.ei5.trim()) {
    output += `**Important Aspects Not Addressed in Survey:**\n> "${data.ei5}"\n\n`;
  }
  
  output += `---\n`;
  return output;
}

// ========================================
// EXECUTIVE SUMMARY
// ========================================
function generateExecutiveSummary(assessment: any): string {
  let output = `\n## EXECUTIVE SUMMARY\n\n`;
  
  // Count program offerings
  let totalCurrently = 0, totalPlanning = 0, totalAssessing = 0;
  for (let i = 1; i <= 13; i++) {
    const gridData = assessment[`dimension${i}_data`]?.[`d${i}a`];
    if (gridData && typeof gridData === 'object') {
      Object.values(gridData).forEach(status => {
        if (typeof status === 'string') {
          if (status.startsWith('Currently')) totalCurrently++;
          if (status === 'In active planning / development') totalPlanning++;
          if (status === 'Assessing feasibility') totalAssessing++;
        }
      });
    }
  }
  
  output += `### Program Offerings Overview\n`;
  output += `- **Currently Offering:** ${totalCurrently} programs across all dimensions\n`;
  if (totalPlanning > 0) output += `- **In Development:** ${totalPlanning} programs\n`;
  if (totalAssessing > 0) output += `- **Under Assessment:** ${totalAssessing} programs\n`;
  
  // Geographic scope
  let consistent = 0, select = 0, vary = 0;
  for (let i = 1; i <= 13; i++) {
    const aa = assessment[`dimension${i}_data`]?.[`d${i}aa`];
    if (aa === 'Generally consistent across all locations') consistent++;
    if (aa === 'Only available in select locations') select++;
    if (aa === 'Vary across locations') vary++;
  }
  
  output += `\n### Geographic Implementation\n`;
  if (consistent > 0) output += `- **Globally Consistent:** ${consistent} of 13 dimensions\n`;
  if (select > 0) output += `- **Select Locations:** ${select} of 13 dimensions\n`;
  if (vary > 0) output += `- **Varies by Location:** ${vary} of 13 dimensions\n`;
  
  output += `\n---\n`;
  return output;
}

// ========================================
// MAIN REPORT GENERATOR
// ========================================
export function generateCompleteReport(assessment: any): string {
  const { survey_id, company_name } = assessment;
  
  let report = `# COMPREHENSIVE ASSESSMENT REPORT\n`;
  report += `## ${company_name}\n`;
  report += `**Survey ID:** ${survey_id}\n`;
  report += `**Generated:** ${new Date().toLocaleDateString('en-US', { 
    month: 'long', day: 'numeric', year: 'numeric' 
  })}\n\n`;
  report += `This report includes all survey sections with detailed responses.\n\n`;
  report += `---\n`;
  
  // Section 1: Firmographics
  const firmographics = assessment.firmographics_data;
  if (firmographics) {
    report += generateFirmographicsSection(firmographics);
  }
  
  // Section 2: General Benefits
  const generalBenefits = assessment.general_benefits_data;
  if (generalBenefits) {
    report += generateGeneralBenefitsSection(generalBenefits);
  }
  
  // Section 3: Current Support
  const currentSupport = assessment.current_support_data;
  if (currentSupport) {
    report += generateCurrentSupportSection(currentSupport);
  }
  
  // Sections 4-16: Dimensions 1-13
  for (let i = 1; i <= 13; i++) {
    const dimKey = `dimension${i}_data`;
    const dimData = assessment[dimKey];
    if (dimData && Object.keys(dimData).length > 0) {
      report += generateDimensionSection(i, dimData);
    }
  }
  
  // Section 17: Cross-Dimensional
  const crossDim = assessment['cross_dimensional_data'];
  if (crossDim) {
    report += generateCrossDimensionalSection(crossDim);
  }
  
  // Section 18: Employee Impact
  const empImpact = assessment['employee-impact-assessment_data'];
  if (empImpact) {
    report += generateEmployeeImpactSection(empImpact);
  }
  
  // Executive Summary
  report += generateExecutiveSummary(assessment);
  
  report += `*Confidential - For benchmarking and internal use only*\n`;
  
  return report;
}

/**
 * DIMENSION REPORT GENERATOR LIBRARY
 * 
 * Location: /lib/report-generator.ts
 * Generates comprehensive dimension reports with main grid + follow-ups
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

const MAIN_GRID_QUESTIONS: Record<number, string> = {
  1: "Which Medical Leave & Flexibility programs does your organization provide?",
  2: "Which Insurance & Financial Protection benefits does your organization provide?",
  3: "Which Manager Preparedness & Capability programs does your organization provide?",
  4: "Which Navigation & Expert Resources does your organization provide?",
  5: "Which Workplace Accommodations & Modifications does your organization provide?",
  6: "Which Culture & Psychological Safety programs does your organization provide?",
  7: "Which Career Continuity & Advancement programs does your organization provide?",
  8: "Which Work Continuation & Resumption programs does your organization provide?",
  9: "Which Executive Commitment & Resources does your organization provide?",
  10: "Which Caregiver & Family Support programs does your organization provide?",
  11: "Which Prevention, Wellness & Legal Compliance programs does your organization provide?",
  12: "Which Continuous Improvement & Outcomes programs does your organization measure/track?",
  13: "Which Communication & Awareness approaches does your organization use?",
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

function formatMainGrid(dimNum: number, gridData: any): string {
  if (!gridData || typeof gridData !== 'object') return '';
  
  let output = `### Primary Programs Offered\n`;
  output += `*${MAIN_GRID_QUESTIONS[dimNum]}*\n\n`;
  
  // Group items by status
  const byStatus: Record<string, string[]> = {};
  Object.entries(gridData).forEach(([item, status]) => {
    if (typeof status === 'string' && STATUS_ORDER.includes(status)) {
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(item);
    }
  });
  
  // Display in status order
  let hasItems = false;
  STATUS_ORDER.forEach(status => {
    if (byStatus[status] && byStatus[status].length > 0) {
      hasItems = true;
      const icon = STATUS_ICONS[status] || '•';
      output += `**${icon} ${status}** (${byStatus[status].length} item${byStatus[status].length > 1 ? 's' : ''})\n`;
      byStatus[status].forEach(item => {
        output += `  • ${item}\n`;
      });
      output += `\n`;
    }
  });
  
  if (!hasItems) {
    output += `*No responses recorded*\n\n`;
  }
  
  output += `---\n\n`;
  return output;
}

function formatRemoteWork(data: any): string {
  const type = data.d1_4a_type;
  
  if (type === 'weeks' && data.d1_4a_weeks) return `Up to ${data.d1_4a_weeks} weeks`;
  if (type === 'months' && data.d1_4a_months) return `Up to ${data.d1_4a_months} months`;
  if (type === 'weeks_outside' && data.d1_4a_weeks) return `Up to ${data.d1_4a_weeks} weeks (outside USA)`;
  if (type === 'provider_requested') return 'As long as requested by healthcare provider';
  if (type === 'medically_necessary') return 'As long as medically necessary';
  if (type === 'unlimited') return 'Unlimited with medical certification';
  if (type === 'case_by_case') return 'Case-by-case basis';
  if (type === 'no_additional') return 'No additional remote work beyond legal requirements';
  
  return 'Not specified';
}

function generateDimensionSection(dimNum: number, data: any): string {
  let output = `\n## DIMENSION ${dimNum}: ${DIMENSION_NAMES[dimNum]}\n\n`;
  
  // FIRST: Show main grid data
  const mainGridKey = `d${dimNum}a`;
  if (data[mainGridKey]) {
    output += formatMainGrid(dimNum, data[mainGridKey]);
  }
  
  // SECOND: Check for follow-up data
  const hasFollowups = Object.keys(data).some(key => 
    key !== mainGridKey && !key.startsWith(`${mainGridKey}.`)
  );
  
  if (hasFollowups) {
    output += `### Follow-Up Details\n\n`;
    
    // Geographic consistency
    const aaKey = `d${dimNum}aa`;
    if (data[aaKey]) {
      output += `**Geographic Implementation**\n${data[aaKey]}\n\n`;
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
      
      if (data.d1_4a_type) {
        output += `**Remote Work Options:** ${formatRemoteWork(data)}\n\n`;
      }
      
      if (data.d1_4b) {
        output += `**Reduced Schedule Duration:** ${data.d1_4b}\n\n`;
      }
      
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
      
      if (data.d1b && data.d1b.trim()) {
        output += `**Additional Context:**\n> "${data.d1b}"\n\n`;
      }
    }
    
    if (dimNum === 2 && data.d2b && data.d2b.trim()) {
      output += `**Additional Context:**\n> "${data.d2b}"\n\n`;
    }
    
    if (dimNum === 3) {
      if (data.d31a) output += `**Training Approach:** ${data.d31a}\n`;
      if (data.d31) output += `**Training Completion:** ${data.d31}\n`;
      if (data.d31a || data.d31) output += `\n`;
      if (data.d3b && data.d3b.trim()) {
        output += `**Additional Context:**\n> "${data.d3b}"\n\n`;
      }
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
      
      if (data.d4b && data.d4b.trim()) {
        output += `**Additional Context:**\n> "${data.d4b}"\n\n`;
      }
    }
  }
  
  output += `---\n`;
  return output;
}

export function generateCompleteReport(assessment: any): string {
  const { survey_id, company_name } = assessment;
  
  let report = `# COMPREHENSIVE DIMENSION REPORT\n`;
  report += `## ${company_name}\n`;
  report += `**Survey ID:** ${survey_id}\n`;
  report += `**Generated:** ${new Date().toLocaleDateString('en-US', { 
    month: 'long', day: 'numeric', year: 'numeric' 
  })}\n\n`;
  report += `This report includes both primary program offerings and detailed follow-up responses.\n\n`;
  report += `---\n`;
  
  // Generate sections for each dimension
  for (let i = 1; i <= 13; i++) {
    const dimKey = `dimension${i}_data`;
    const dimData = assessment[dimKey];
    
    if (dimData && Object.keys(dimData).length > 0) {
      report += generateDimensionSection(i, dimData);
    }
  }
  
  // Executive Summary
  report += `\n## EXECUTIVE SUMMARY\n\n`;
  
  // Count offerings by status
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
  
  report += `### Program Offerings Overview\n`;
  report += `- **Currently Offering:** ${totalCurrently} programs across all dimensions\n`;
  if (totalPlanning > 0) report += `- **In Development:** ${totalPlanning} programs\n`;
  if (totalAssessing > 0) report += `- **Under Assessment:** ${totalAssessing} programs\n`;
  
  // Geographic scope
  let consistent = 0, select = 0, vary = 0;
  for (let i = 1; i <= 13; i++) {
    const aa = assessment[`dimension${i}_data`]?.[`d${i}aa`];
    if (aa === 'Generally consistent across all locations') consistent++;
    if (aa === 'Only available in select locations') select++;
    if (aa === 'Vary across locations') vary++;
  }
  
  report += `\n### Geographic Implementation\n`;
  if (consistent > 0) report += `- **Globally Consistent:** ${consistent} of 13 dimensions\n`;
  if (select > 0) report += `- **Select Locations:** ${select} of 13 dimensions\n`;
  if (vary > 0) report += `- **Varies by Location:** ${vary} of 13 dimensions\n`;
  
  report += `\n---\n`;
  report += `*Confidential - For benchmarking and internal use only*\n`;
  
  return report;
}

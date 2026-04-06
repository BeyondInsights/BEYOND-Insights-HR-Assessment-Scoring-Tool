const fs = require('fs');

const rows = [
  ['D1', 'Medical Leave & Flexibility', 1, 'Paid medical leave beyond local / legal requirements', ''],
  ['D1', 'Medical Leave & Flexibility', 2, 'Intermittent leave beyond local / legal requirements', ''],
  ['D1', 'Medical Leave & Flexibility', 3, 'Flexible work hours during treatment (e.g., varying start/end times, compressed schedules)', ''],
  ['D1', 'Medical Leave & Flexibility', 4, 'Remote work options for on-site employees', ''],
  ['D1', 'Medical Leave & Flexibility', 5, 'Reduced schedule/part-time with full benefits', ''],
  ['D1', 'Medical Leave & Flexibility', 6, 'Job protection beyond local / legal requirements', ''],
  ['D1', 'Medical Leave & Flexibility', 7, 'Emergency leave within 24 hours', ''],
  ['D1', 'Medical Leave & Flexibility', 8, 'Leave donation bank (employees can donate PTO to colleagues)', ''],
  ['D1', 'Medical Leave & Flexibility', 9, 'Disability pay top-up (employer adds to disability insurance)', ''],
  ['D1', 'Medical Leave & Flexibility', 10, 'PTO accrual during leave', ''],
  ['D1', 'Medical Leave & Flexibility', 11, 'Paid micro-breaks for medical-related side effects', ''],
  ['D1', 'Medical Leave & Flexibility', 12, 'Full salary (100%) continuation during cancer-related short-term disability leave', ''],
  ['D1', 'Medical Leave & Flexibility', 13, 'Guaranteed full salary and health insurance continuation for a defined period', 'NEW'],
  ['D1', 'Medical Leave & Flexibility', 14, 'Guaranteed job protection for a defined period', 'NEW'],
  ['D2', 'Insurance & Financial Protection', 1, 'Coverage for clinical trials and experimental treatments not covered by standard health insurance', ''],
  ['D2', 'Insurance & Financial Protection', 2, 'Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance', ''],
  ['D2', 'Insurance & Financial Protection', 3, 'Paid time off for clinical trial participation', ''],
  ['D2', 'Insurance & Financial Protection', 4, 'Set out-of-pocket maximums (for in-network single coverage)', ''],
  ['D2', 'Insurance & Financial Protection', 5, 'Travel/lodging reimbursement for specialized care beyond insurance coverage', ''],
  ['D2', 'Insurance & Financial Protection', 6, 'Financial counseling services', ''],
  ['D2', 'Insurance & Financial Protection', 7, 'Voluntary supplemental illness insurance (with employer contribution)', ''],
  ['D2', 'Insurance & Financial Protection', 8, 'Real-time cost estimator tools', ''],
  ['D2', 'Insurance & Financial Protection', 9, 'Insurance advocacy/pre-authorization support', ''],
  ['D2', 'Insurance & Financial Protection', 10, '$0 copay for specialty drugs', ''],
  ['D2', 'Insurance & Financial Protection', 11, 'Hardship grants program funded by employer', ''],
  ['D2', 'Insurance & Financial Protection', 12, 'Tax/estate planning assistance', ''],
  ['D2', 'Insurance & Financial Protection', 13, 'Short-term disability covering 60%+ of salary', ''],
  ['D2', 'Insurance & Financial Protection', 14, 'Long-term disability covering 60%+ of salary', ''],
  ['D2', 'Insurance & Financial Protection', 15, 'Employer-paid disability insurance supplements', ''],
  ['D2', 'Insurance & Financial Protection', 16, 'Guaranteed job protection', ''],
  ['D2', 'Insurance & Financial Protection', 17, 'Accelerated life insurance benefits (partial payout for terminal / critical illness)', ''],
  ['D3', 'Manager Preparedness & Capability', 1, 'Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams', ''],
  ['D3', 'Manager Preparedness & Capability', 2, 'Clear escalation protocol for manager response', ''],
  ['D3', 'Manager Preparedness & Capability', 3, 'Dedicated manager resource hub', ''],
  ['D3', 'Manager Preparedness & Capability', 4, 'Empathy/communication skills training', ''],
  ['D3', 'Manager Preparedness & Capability', 5, 'Legal compliance training', ''],
  ['D3', 'Manager Preparedness & Capability', 6, 'Senior leader coaching on supporting impacted employees', ''],
  ['D3', 'Manager Preparedness & Capability', 7, 'Manager evaluations include how well they support impacted employees', ''],
  ['D3', 'Manager Preparedness & Capability', 8, 'Manager peer support / community building', ''],
  ['D3', 'Manager Preparedness & Capability', 9, 'AI-powered guidance tools', ''],
  ['D3', 'Manager Preparedness & Capability', 10, 'Privacy protection and confidentiality management', ''],
  ['D4', 'Specialized Resources', 1, 'Dedicated navigation support to help employees understand benefits and access medical care', ''],
  ['D4', 'Specialized Resources', 2, 'Benefits optimization assistance (maximizing coverage, minimizing costs)', ''],
  ['D4', 'Specialized Resources', 3, 'Insurance advocacy/appeals support', ''],
  ['D4', 'Specialized Resources', 4, 'Clinical trial matching service', ''],
  ['D4', 'Specialized Resources', 5, 'Care coordination concierge', ''],
  ['D4', 'Specialized Resources', 6, 'Online tools, apps, or portals for health/benefits support', ''],
  ['D4', 'Specialized Resources', 7, 'Survivorship planning assistance', ''],
  ['D4', 'Specialized Resources', 8, 'Physical rehabilitation support', ''],
  ['D4', 'Specialized Resources', 9, 'Occupational therapy/vocational rehabilitation', ''],
  ['D4', 'Specialized Resources', '-', 'Nutrition coaching', 'REMOVED'],
  ['D5', 'Workplace Accommodations & Modifications', 1, 'Physical workspace modifications', ''],
  ['D5', 'Workplace Accommodations & Modifications', 2, 'Cognitive / fatigue support tools', ''],
  ['D5', 'Workplace Accommodations & Modifications', 3, 'Ergonomic equipment funding', ''],
  ['D5', 'Workplace Accommodations & Modifications', 4, 'Rest areas / quiet spaces', ''],
  ['D5', 'Workplace Accommodations & Modifications', 6, 'Temporary role redesigns', ''],
  ['D5', 'Workplace Accommodations & Modifications', 7, 'Assistive technology catalog', ''],
  ['D5', 'Workplace Accommodations & Modifications', 8, 'Transportation reimbursement', ''],
  ['D5', 'Workplace Accommodations & Modifications', 9, 'Policy accommodations (e.g., dress code flexibility, headphone use)', ''],
  ['D5', 'Workplace Accommodations & Modifications', '-', 'Priority parking', 'REMOVED'],
  ['D5', 'Workplace Accommodations & Modifications', '-', 'Remote work capability', 'REMOVED (duplicate of D1)'],
  ['D5', 'Workplace Accommodations & Modifications', '-', 'Flexible scheduling options', 'REMOVED (similar to D8)'],
  ['D6', 'Culture & Psychological Safety', 1, 'Strong anti-discrimination policies specific to health conditions', ''],
  ['D6', 'Culture & Psychological Safety', 2, 'Clear process for confidential health disclosures', ''],
  ['D6', 'Culture & Psychological Safety', 3, 'Manager training on handling sensitive health information', ''],
  ['D6', 'Culture & Psychological Safety', 4, 'Written anti-retaliation policies for health disclosures', ''],
  ['D6', 'Culture & Psychological Safety', 5, 'Employee peer support groups (internal employees with shared experience)', ''],
  ['D6', 'Culture & Psychological Safety', 6, 'Professional-led support groups (external facilitator/counselor)', ''],
  ['D6', 'Culture & Psychological Safety', 7, 'Stigma-reduction initiatives', ''],
  ['D6', 'Culture & Psychological Safety', 8, 'Specialized emotional counseling', ''],
  ['D6', 'Culture & Psychological Safety', 9, 'Optional open health dialogue forums', ''],
  ['D6', 'Culture & Psychological Safety', 10, 'Inclusive communication guidelines', ''],
  ['D6', 'Culture & Psychological Safety', 11, 'Confidential HR channel for health benefits, policies and insurance-related questions', ''],
  ['D6', 'Culture & Psychological Safety', 12, 'Anonymous benefits navigation tool or website (no login required)', ''],
  ['D7', 'Career Continuity & Advancement', 1, 'Continued access to training/development', ''],
  ['D7', 'Career Continuity & Advancement', 2, 'Structured reintegration programs', ''],
  ['D7', 'Career Continuity & Advancement', 3, 'Peer mentorship program (employees who had similar condition mentoring current employees)', ''],
  ['D7', 'Career Continuity & Advancement', 4, 'Professional coach/mentor for employees managing cancer or other serious health conditions', ''],
  ['D7', 'Career Continuity & Advancement', 5, 'Adjusted performance goals/deliverables during treatment and recovery', ''],
  ['D7', 'Career Continuity & Advancement', 6, 'Career coaching for employees managing cancer or other serious health conditions', ''],
  ['D7', 'Career Continuity & Advancement', 7, 'Succession planning protections', ''],
  ['D7', 'Career Continuity & Advancement', 8, 'Project continuity protocols', ''],
  ['D7', 'Career Continuity & Advancement', 9, 'Optional stay-connected program', ''],
  ['D8', 'Work Continuation & Resumption', 1, 'Flexible work arrangements during treatment', ''],
  ['D8', 'Work Continuation & Resumption', 2, 'Phased return-to-work plans', ''],
  ['D8', 'Work Continuation & Resumption', 3, 'Workload adjustments during treatment', ''],
  ['D8', 'Work Continuation & Resumption', 4, 'Flexibility for medical setbacks', ''],
  ['D8', 'Work Continuation & Resumption', 5, 'Buddy/mentor pairing for support', ''],
  ['D8', 'Work Continuation & Resumption', 6, 'Structured progress reviews', ''],
  ['D8', 'Work Continuation & Resumption', 7, 'Contingency planning for treatment schedules', ''],
  ['D8', 'Work Continuation & Resumption', 8, 'Long-term success tracking', ''],
  ['D8', 'Work Continuation & Resumption', 9, 'Access to occupational therapy/vocational rehabilitation', ''],
  ['D8', 'Work Continuation & Resumption', 10, 'Online peer support forums', ''],
  ['D8', 'Work Continuation & Resumption', 11, 'Access to specialized work resumption professionals', ''],
  ['D8', 'Work Continuation & Resumption', 12, 'Manager training on supporting team members during treatment/return', ''],
  ['D9', 'Executive Commitment & Resources', 1, 'Executive accountability metrics', ''],
  ['D9', 'Executive Commitment & Resources', 2, 'Public success story celebrations', ''],
  ['D9', 'Executive Commitment & Resources', 3, 'Compensation tied to support outcomes', ''],
  ['D9', 'Executive Commitment & Resources', 4, 'ESG/CSR reporting inclusion', ''],
  ['D9', 'Executive Commitment & Resources', 5, 'Year-over-year budget growth', ''],
  ['D9', 'Executive Commitment & Resources', 6, 'Executive sponsors communicate regularly about workplace support programs', ''],
  ['D9', 'Executive Commitment & Resources', 7, 'Dedicated budget allocation for serious illness support programs', ''],
  ['D9', 'Executive Commitment & Resources', 8, 'C-suite executive serves as program champion/sponsor', ''],
  ['D9', 'Executive Commitment & Resources', 9, 'Support programs included in investor/stakeholder communications', ''],
  ['D9', 'Executive Commitment & Resources', 10, 'Cross-functional executive steering committee for workplace support programs', ''],
  ['D9', 'Executive Commitment & Resources', 11, 'Support metrics included in annual report/sustainability reporting', ''],
  ['D9', 'Executive Commitment & Resources', 12, 'Executive-led town halls focused on health benefits and employee support', ''],
  ['D10', 'Caregiver & Family Support', 1, 'Paid caregiver leave with expanded eligibility (beyond local legal requirements)', ''],
  ['D10', 'Caregiver & Family Support', 2, 'Flexible work arrangements for caregivers', ''],
  ['D10', 'Caregiver & Family Support', 3, 'Dependent care subsidies', ''],
  ['D10', 'Caregiver & Family Support', 4, 'Emergency caregiver funds', ''],
  ['D10', 'Caregiver & Family Support', 5, 'Dependent care account matching/contributions', ''],
  ['D10', 'Caregiver & Family Support', 6, 'Family navigation support', ''],
  ['D10', 'Caregiver & Family Support', 7, 'Caregiver peer support groups', ''],
  ['D10', 'Caregiver & Family Support', 8, 'Mental health support specifically for caregivers', ''],
  ['D10', 'Caregiver & Family Support', 9, 'Manager training for supervising caregivers', ''],
  ['D10', 'Caregiver & Family Support', 10, 'Practical support for managing caregiving and work', ''],
  ['D10', 'Caregiver & Family Support', 11, 'Emergency dependent care when regular arrangements unavailable', ''],
  ['D10', 'Caregiver & Family Support', 12, 'Respite care funding/reimbursement', ''],
  ['D10', 'Caregiver & Family Support', 13, 'Caregiver resource navigator/concierge', ''],
  ['D10', 'Caregiver & Family Support', 14, 'Legal/financial planning assistance for caregivers', ''],
  ['D10', 'Caregiver & Family Support', 15, 'Modified job duties during peak caregiving periods', ''],
  ['D10', 'Caregiver & Family Support', 16, 'Unpaid leave job protection beyond local / legal requirements', ''],
  ['D10', 'Caregiver & Family Support', 17, 'Eldercare consultation and referral services', ''],
  ['D10', 'Caregiver & Family Support', 18, 'Paid time off for care coordination appointments', ''],
  ['D10', 'Caregiver & Family Support', 19, 'Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)', ''],
  ['D10', 'Caregiver & Family Support', 20, 'Concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 1, 'At least 70% coverage for regionally / locally recommended screenings', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 2, 'Full or partial coverage for annual health screenings/checkups', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 3, 'Targeted risk-reduction programs', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 4, 'Paid time off for preventive care appointments', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 5, 'Legal protections beyond requirements', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 6, 'Workplace safety assessments to minimize health risks', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 7, 'Regular health education sessions', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 8, 'Individual health assessments (online or in-person)', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 9, 'Genetic screening/counseling', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 10, 'On-site vaccinations', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 11, 'Lifestyle coaching programs', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 12, 'Risk factor tracking/reporting', ''],
  ['D11', 'Prevention, Wellness & Legal Compliance', 13, 'Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)', ''],
  ['D12', 'Continuous Improvement & Outcomes', 1, 'Return-to-work success metrics', ''],
  ['D12', 'Continuous Improvement & Outcomes', 2, 'Employee satisfaction tracking', ''],
  ['D12', 'Continuous Improvement & Outcomes', 3, 'Business impact/ROI assessment', ''],
  ['D12', 'Continuous Improvement & Outcomes', 4, 'Regular program enhancements', ''],
  ['D12', 'Continuous Improvement & Outcomes', 5, 'External benchmarking', ''],
  ['D12', 'Continuous Improvement & Outcomes', 6, 'Innovation pilots', ''],
  ['D12', 'Continuous Improvement & Outcomes', 7, 'Employee confidence in employer support', ''],
  ['D12', 'Continuous Improvement & Outcomes', 8, 'Program utilization analytics', ''],
  ['D12', 'Continuous Improvement & Outcomes', 9, 'Measure screening campaign ROI (e.g., participation rates, inquiries about access, etc.)', ''],
  ['D13', 'Communication & Awareness', 1, 'Proactive communication at point of diagnosis disclosure', ''],
  ['D13', 'Communication & Awareness', 2, 'Dedicated program website or portal', ''],
  ['D13', 'Communication & Awareness', 3, 'Regular company-wide awareness campaigns (at least quarterly)', ''],
  ['D13', 'Communication & Awareness', 4, 'New hire orientation coverage', ''],
  ['D13', 'Communication & Awareness', 5, 'Manager toolkit for cascade communications', ''],
  ['D13', 'Communication & Awareness', 6, 'Employee testimonials/success stories', ''],
  ['D13', 'Communication & Awareness', 7, 'Multi-channel communication strategy', ''],
  ['D13', 'Communication & Awareness', 8, 'Family/caregiver communication inclusion', ''],
  ['D13', 'Communication & Awareness', 9, 'Ability to access program information and resources anonymously', ''],
  ['D13', 'Communication & Awareness', 10, 'Cancer awareness month campaigns with resources', ''],
];

const mappings = [
  ['Currently offer / Implemented / Measuring and reporting / Currently use', 'In Place', '5', 'Direct equivalent - program exists and is active'],
  ['Plan to offer within 12 months / In active planning / Planning measurement', 'In Development', '3', 'Both indicate committed plans with allocated resources'],
  ['Assessing feasibility / Measuring (early)', 'Under Review', '2', 'Both indicate active evaluation without firm commitment'],
  ['(No old equivalent)', 'Open to Exploring [NEW]', 'TBD (recommend 1)', 'New option - no 2026 responses map here. Rewards openness without implying active evaluation'],
  ['Not able to offer / Not in place / Not measured / Not able to utilize', 'Not Planned', '0', 'Both indicate a considered decision not to proceed'],
  ['Unsure (all dimensions)', 'Unsure (currently hidden)', 'TBD (was 0)', 'Hidden for launch - needs scoring decision before re-enabling'],
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
<x:ExcelWorksheet><x:Name>Elements</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
<x:ExcelWorksheet><x:Name>Scale Mapping</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head><body>`;

// Sheet 1: Elements
html += `<table border="1" cellpadding="5" style="border-collapse:collapse;font-family:Calibri;font-size:11pt;">`;
html += `<tr style="background:#1B3A5C;color:white;font-weight:bold;"><td>Dimension</td><td>Dimension Name</td><td>#</td><td>Element</td><td>Status</td><td style="width:300px;">Rebecca Notes / Edits</td></tr>`;
rows.forEach(r => {
  const isNew = r[4] === 'NEW';
  const isRemoved = String(r[4]).startsWith('REMOVED');
  const bg = isNew ? ' style="background:#DCFCE7;"' : isRemoved ? ' style="background:#FEE2E2;color:#991B1B;text-decoration:line-through;"' : '';
  const tdStyle = isRemoved ? '' : '';
  html += `<tr${bg}><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${r[2]}</td><td>${esc(r[3])}</td><td>${r[4]}</td><td></td></tr>`;
});
html += `</table>`;

// Page break between sheets
html += `<br style="page-break-before:always">`;

// Sheet 2: Scale Mapping
html += `<table border="1" cellpadding="5" style="border-collapse:collapse;font-family:Calibri;font-size:11pt;">`;
html += `<tr style="background:#1B3A5C;color:white;font-weight:bold;font-size:14pt;"><td colspan="4">Response Scale Mapping: 2026 to 2027</td></tr>`;
html += `<tr style="background:#374151;color:white;font-weight:bold;"><td>Old Response (2026)</td><td>Maps To (2027)</td><td>Points</td><td>Rationale</td></tr>`;
mappings.forEach(m => {
  const bg = m[1].includes('NEW') ? ' style="background:#FFF7ED;"' : '';
  html += `<tr${bg}><td>${esc(m[0])}</td><td>${esc(m[1])}</td><td>${esc(m[2])}</td><td>${esc(m[3])}</td></tr>`;
});
html += `</table>`;

// Duplicate elements note
html += `<br/><br/>`;
html += `<table border="1" cellpadding="5" style="border-collapse:collapse;font-family:Calibri;font-size:11pt;">`;
html += `<tr style="background:#1B3A5C;color:white;font-weight:bold;font-size:12pt;"><td colspan="3">Flexible Work Elements (Kept - Different Contexts)</td></tr>`;
html += `<tr style="background:#374151;color:white;font-weight:bold;"><td>Element</td><td>Dimension</td><td>Context</td></tr>`;
html += `<tr><td>Flexible work hours during treatment</td><td>D1 - Medical Leave &amp; Flexibility</td><td>Hours/scheduling during active treatment</td></tr>`;
html += `<tr style="background:#FEE2E2;text-decoration:line-through;"><td>Flexible scheduling options</td><td>D5 - Workplace Accommodations</td><td>Removed — similar to D8 flexible work arrangements</td></tr>`;
html += `<tr><td>Flexible work arrangements during treatment</td><td>D8 - Work Continuation &amp; Resumption</td><td>Arrangements for continuing/resuming work</td></tr>`;
html += `<tr><td>Flexible work arrangements for caregivers</td><td>D10 - Caregiver &amp; Family Support</td><td>Caregiver-specific flexibility</td></tr>`;
html += `</table>`;

// Change summary
html += `<br style="page-break-before:always">`;
html += `<table border="1" cellpadding="5" style="border-collapse:collapse;font-family:Calibri;font-size:11pt;">`;
html += `<tr style="background:#1B3A5C;color:white;font-weight:bold;font-size:14pt;"><td colspan="3">2027 Change Summary</td></tr>`;

html += `<tr style="background:#059669;color:white;font-weight:bold;"><td colspan="3">NEW Elements Added</td></tr>`;
html += `<tr style="background:#374151;color:white;font-weight:bold;"><td>Dimension</td><td>Element</td><td>Details</td></tr>`;
html += `<tr style="background:#DCFCE7;"><td>D1</td><td>Guaranteed full salary and health insurance continuation for a defined period</td><td>With conditional follow-up question on duration (up to 3 months through no defined limit)</td></tr>`;
html += `<tr style="background:#DCFCE7;"><td>D1</td><td>Guaranteed job protection for a defined period</td><td>With conditional follow-up question on duration (same scale as above)</td></tr>`;

html += `<tr style="background:#DC2626;color:white;font-weight:bold;"><td colspan="3">Elements REMOVED</td></tr>`;
html += `<tr style="background:#374151;color:white;font-weight:bold;"><td>Dimension</td><td>Element</td><td>Reason</td></tr>`;
html += `<tr style="background:#FEE2E2;"><td>D4</td><td>Nutrition coaching</td><td>Removed per client request</td></tr>`;
html += `<tr style="background:#FEE2E2;"><td>D5</td><td>Priority parking</td><td>Removed per client request</td></tr>`;
html += `<tr style="background:#FEE2E2;"><td>D5</td><td>Remote work capability</td><td>Duplicate of D1 "Remote work options for on-site employees"</td></tr>`;
html += `<tr style="background:#FEE2E2;"><td>D5</td><td>Flexible scheduling options</td><td>Similar to D8 "Flexible work arrangements during treatment"</td></tr>`;

html += `<tr style="background:#2563EB;color:white;font-weight:bold;"><td colspan="3">Response Scale Changes (2026 → 2027)</td></tr>`;
html += `<tr style="background:#374151;color:white;font-weight:bold;"><td>Change</td><td>Details</td><td>Status</td></tr>`;
html += `<tr><td>Unified to 6 options</td><td>In Place, In Development, Under Review, Open to Exploring (new), Not Planned, Unsure</td><td>Active (Unsure hidden for launch)</td></tr>`;
html += `<tr><td>"Open to Exploring" added</td><td>New option - rewards openness without implying active evaluation</td><td>Active</td></tr>`;
html += `<tr><td>"Unsure" hidden</td><td>Hidden for launch pending scoring decision with Rebecca</td><td>Temporarily hidden</td></tr>`;

html += `<tr style="background:#7C3AED;color:white;font-weight:bold;"><td colspan="3">Other Updates</td></tr>`;
html += `<tr style="background:#374151;color:white;font-weight:bold;"><td>Area</td><td>Change</td><td>Details</td></tr>`;
html += `<tr><td>Landing page</td><td>New headline</td><td>"The 2027 Survey is Now Open"</td></tr>`;
html += `<tr><td>Completion email</td><td>Updated timeline</td><td>Survey close: Oct 1, 2026 | Index: Jan 2027 | Reports: Feb 2027</td></tr>`;
html += `<tr><td>Completion email</td><td>Employee survey wording</td><td>"optional employee survey, $500"</td></tr>`;
html += `<tr><td>Invoice email</td><td>Year references</td><td>Updated from 2026 to 2027</td></tr>`;
html += `<tr><td>D1 wording</td><td>Clarified insurance type</td><td>"health insurance" (not just "insurance") per Rebecca</td></tr>`;
html += `</table>`;

html += `</body></html>`;

fs.writeFileSync('C:/Users/JohnB/Downloads/CAC-Elements-and-Scale-Mapping.xls', html);
console.log('Created: C:/Users/JohnB/Downloads/CAC-Elements-and-Scale-Mapping.xls');

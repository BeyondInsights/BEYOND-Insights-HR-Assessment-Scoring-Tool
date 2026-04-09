/**
 * ROLLOVER SCRIPT: 2026 → 2027
 *
 * Creates new survey_year=2027 rows for all eligible 2026 completions.
 * - Remaps response scale from 2026 labels to 2027 labels
 * - Filters dimension grid items to current 2027 instrument only
 * - Copies firmographics, company info, payment status, contact info
 * - Resets completion flags and survey_submitted
 * - Preserves same survey_id/app_id so existing CAC codes still work
 *
 * USAGE:
 *   DRY RUN (default):
 *     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/rollover-to-2027.js
 *
 *   LIVE RUN:
 *     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/rollover-to-2027.js --live
 *
 * The script will show what it would do before executing.
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const IS_LIVE = process.argv.includes('--live')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ============================================
// 2026 → 2027 RESPONSE SCALE MAPPING
// ============================================
const SCALE_MAP = {
  // 2026 scale values (case-insensitive matching below)
  'currently offer': 'In Place',
  'currently use': 'In Place',
  'currently utilize': 'In Place',
  'currently measure / track': 'In Place',
  'currently measure/track': 'In Place',
  'currently provide to managers': 'In Place',
  'currently provide': 'In Place',
  'currently track': 'In Place',
  'in active planning / development': 'In Development',
  'in active planning/development': 'In Development',
  'planning': 'In Development',
  'in planning': 'In Development',
  'assessing feasibility': 'Under Review',
  'assessing': 'Under Review',
  'not able to offer': 'Not Planned',
  'not able': 'Not Planned',
  'not able to offer in foreseeable future': 'Not Planned',
  'not able to measure / track in foreseeable future': 'Not Planned',
  'not able to measure/track in foreseeable future': 'Not Planned',
  'not able to provide in foreseeable future': 'Not Planned',
  'not able to utilize in foreseeable future': 'Not Planned',
  'not able to track in foreseeable future': 'Not Planned',
  'unknown (5)': 'Unsure',
  'unknown': 'Unsure',
  'unsure': 'Unsure',
  // 2027 values pass through as-is
  'in place': 'In Place',
  'in development': 'In Development',
  'under review': 'Under Review',
  'open to exploring': 'Open to Exploring',
  'not planned': 'Not Planned',
}

function remapResponse(value) {
  if (!value || typeof value !== 'string') return value
  const mapped = SCALE_MAP[value.toLowerCase().trim()]
  return mapped || value // pass through if no mapping found
}

// ============================================
// 2027 INSTRUMENT ITEMS (canonical grid items per dimension)
// Only items in this list will be carried forward.
// ============================================
const INSTRUMENT_2027 = {
  d1a: [
    'Paid medical leave beyond local / legal requirements',
    'Intermittent leave beyond local / legal requirements',
    'Flexible work hours during treatment (e.g., varying start/end times, compressed schedules)',
    'Remote work options for on-site employees',
    'Reduced schedule/part-time with full benefits',
    'Job protection beyond local / legal requirements',
    'Emergency leave within 24 hours',
    'Leave donation bank (employees can donate PTO to colleagues)',
    'Disability pay top-up (employer adds to disability insurance)',
    'PTO accrual during leave',
    'Paid micro-breaks for medical-related side effects',
    'Full salary (100%) continuation during cancer-related short-term disability leave',
    'Full salary and health insurance continuation, beyond legal requirements',
  ],
  d2a: [
    'Coverage for clinical trials and experimental treatments not covered by standard health insurance',
    'Coverage for advanced therapies (CAR-T, proton therapy, immunotherapy) not covered by standard health insurance',
    'Paid time off for clinical trial participation',
    'Set out-of-pocket maximums (for in-network single coverage)',
    'Travel/lodging reimbursement for specialized care beyond insurance coverage',
    'Financial counseling services',
    'Voluntary supplemental illness insurance (with employer contribution)',
    'Real-time cost estimator tools',
    '$0 copay for specialty drugs',
    'Hardship grants program funded by employer',
    'Tax/estate planning assistance',
    'Short-term disability covering 60%+ of salary',
    'Long-term disability covering 60%+ of salary',
    'Employer-paid disability insurance supplements',
    'Accelerated life insurance benefits (partial payout for terminal / critical illness)',
  ],
  d3a: [
    'Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams',
    'Clear escalation protocol for manager response',
    'Dedicated manager resource hub',
    'Empathy/communication skills training',
    'Legal compliance training',
    'Senior leader coaching on supporting impacted employees',
    'Manager evaluations include how well they support impacted employees',
    'Manager peer support / community building',
    'AI-powered guidance tools',
    'Privacy protection and confidentiality management',
  ],
  d4a: [
    'Dedicated navigation support to help employees understand benefits and access medical care',
    'Benefits optimization assistance (maximizing coverage, minimizing costs)',
    'Insurance advocacy/appeals support',
    'Clinical trial matching service',
    'Care coordination concierge',
    'Online tools, apps, or portals for health/benefits support',
    'Survivorship planning assistance',
    'Physical rehabilitation support',
    'Occupational therapy/vocational rehabilitation',
  ],
  d5a: [
    'Physical workspace modifications',
    'Cognitive / fatigue support tools',
    'Ergonomic equipment funding',
    'Rest areas / quiet spaces',
    'Temporary role redesigns',
    'Assistive technology catalog',
    'Transportation reimbursement',
    'Policy accommodations (e.g., dress code flexibility, headphone use)',
  ],
  d6a: [
    'Strong anti-discrimination policies specific to health conditions',
    'Clear process for confidential health disclosures',
    'Manager training on handling sensitive health information',
    'Written anti-retaliation policies for health disclosures',
    'Employee peer support groups (internal employees with shared experience)',
    'Professional-led support groups (external facilitator/counselor)',
    'Stigma-reduction initiatives',
    'Specialized emotional counseling',
    'Optional open health dialogue forums',
    'Inclusive communication guidelines',
    'Confidential HR channel for health benefits, policies and insurance-related questions',
    'Anonymous benefits navigation tool or website (no login required)',
  ],
  d7a: [
    'Continued access to training/development',
    'Structured reintegration programs',
    'Professional coach/mentor for employees managing cancer or other serious health conditions',
    'Adjusted performance goals/deliverables during treatment and recovery',
    'Career coaching for employees managing cancer or other serious health conditions',
    'Succession planning protections',
    'Project continuity protocols',
    'Optional stay-connected program',
  ],
  d8a: [
    'Phased return-to-work plans',
    'Workload adjustments during treatment',
    'Flexibility for medical setbacks',
    'Buddy/mentor pairing for support',
    'Structured progress reviews',
    'Contingency planning for treatment schedules',
    'Long-term success tracking',
    'Online peer support forums',
    'Access to specialized work resumption professionals',
    'Manager training on supporting team members during treatment/return',
  ],
  d9a: [
    'Executive accountability metrics',
    'Public success story celebrations',
    'Compensation tied to support outcomes',
    'ESG/CSR reporting inclusion',
    'Year-over-year budget growth',
    'Executive sponsors communicate regularly about workplace support programs',
    'Dedicated budget allocation for serious illness support programs',
    'C-suite executive serves as program champion/sponsor',
    'Support programs included in investor/stakeholder communications',
    'Cross-functional executive steering committee for workplace support programs',
    'Support metrics included in annual report/sustainability reporting',
    'Executive-led town halls focused on health benefits and employee support',
  ],
  d10a: [
    'Paid caregiver leave with expanded eligibility (beyond local legal requirements)',
    'Flexible work arrangements for caregivers',
    'Dependent care subsidies',
    'Emergency caregiver funds',
    'Dependent care account matching/contributions',
    'Family navigation support',
    'Caregiver peer support groups',
    'Mental health support specifically for caregivers',
    'Manager training for supervising caregivers',
    'Practical support for managing caregiving and work',
    'Emergency dependent care when regular arrangements unavailable',
    'Respite care funding/reimbursement',
    'Caregiver concierge/navigator services (e.g., coordinating logistics, scheduling, transportation, home care)',
    'Legal/financial planning assistance for caregivers',
    'Modified job duties during peak caregiving periods',
    'Unpaid leave job protection beyond local / legal requirements',
    'Eldercare consultation and referral services',
    'Paid time off for care coordination appointments',
    'Expanded caregiver leave eligibility beyond legal definitions (e.g., siblings, in-laws, chosen family)',
  ],
  d11a: [
    'At least 70% coverage for regionally / locally recommended screenings',
    'Full or partial coverage for annual health screenings/checkups',
    'Targeted risk-reduction programs',
    'Paid time off for preventive care appointments',
    'Legal protections beyond requirements',
    'Workplace safety assessments to minimize health risks',
    'Regular health education sessions',
    'Individual health assessments (online or in-person)',
    'Genetic screening/counseling',
    'On-site vaccinations',
    'Lifestyle coaching programs',
    'Risk factor tracking/reporting',
    'Policies to support immuno-compromised colleagues (e.g., mask protocols, ventilation)',
  ],
  d12a: [
    'Return-to-work success metrics',
    'Employee satisfaction tracking',
    'Business impact/ROI assessment',
    'Regular program enhancements',
    'External benchmarking',
    'Innovation pilots',
    'Employee confidence in employer support',
    'Program utilization analytics',
    'Measure screening campaign ROI (e.g. participation rates, inquiries about access, etc.)',
  ],
  d13a: [
    'Proactive communication at point of diagnosis disclosure',
    'Dedicated program website or portal',
    'Regular company-wide awareness campaigns (at least quarterly)',
    'New hire orientation coverage',
    'Manager toolkit for cascade communications',
    'Employee testimonials/success stories',
    'Multi-channel communication strategy',
    'Family/caregiver communication inclusion',
    'Ability to access program information and resources anonymously',
    'Cancer awareness month campaigns with resources',
  ],
}

// Known 2026 item text that maps to a differently-worded 2027 item
// Format: { '2026 text (lowercase)': '2027 canonical text' }
const ITEM_TEXT_REMAP = {
  // D3 manager training was reworded
  'manager training on supporting employees with serious medical conditions and their teams':
    'Manager training on supporting employees managing cancer or other serious health conditions/illnesses and their teams',
  // D10 caregiver concierge was merged from two items
  'caregiver resource navigator/concierge':
    'Caregiver concierge/navigator services (e.g., coordinating logistics, scheduling, transportation, home care)',
  'concierge services to coordinate caregiving logistics (e.g., scheduling, transportation, home care)':
    'Caregiver concierge/navigator services (e.g., coordinating logistics, scheduling, transportation, home care)',
  // D2 had "Health benefits continuation at employee rates during leave" which was removed
  // D1 element 13 was renamed
  'guaranteed full salary and health insurance continuation for a defined period':
    'Full salary and health insurance continuation, beyond legal requirements',
  'guaranteed job protection for a defined period':
    'Job protection beyond local / legal requirements',
}

// Build lookup sets for fast matching (lowercase → canonical)
const INSTRUMENT_LOOKUP = {}
for (const [gridKey, items] of Object.entries(INSTRUMENT_2027)) {
  const lookup = {}
  for (const item of items) {
    lookup[item.toLowerCase()] = item
  }
  INSTRUMENT_LOOKUP[gridKey] = lookup
}

/**
 * Remap a single grid object: filter to 2027 items + remap response values
 */
function remapGrid(gridKey, gridData) {
  if (!gridData || typeof gridData !== 'object') return gridData

  const lookup = INSTRUMENT_LOOKUP[gridKey]
  if (!lookup) return gridData // not a grid key, pass through

  const remapped = {}
  let kept = 0, dropped = 0, textRemapped = 0

  for (const [itemText, responseValue] of Object.entries(gridData)) {
    const lowerText = itemText.toLowerCase().trim()

    // Check for item text remap first
    if (ITEM_TEXT_REMAP[lowerText]) {
      const newText = ITEM_TEXT_REMAP[lowerText]
      if (lookup[newText.toLowerCase()]) {
        remapped[newText] = remapResponse(responseValue)
        textRemapped++
        continue
      }
    }

    // Check if item exists in 2027 instrument (exact match)
    if (lookup[lowerText]) {
      const canonicalText = lookup[lowerText]
      remapped[canonicalText] = remapResponse(responseValue)
      kept++
    } else {
      dropped++
    }
  }

  return { data: remapped, stats: { kept, dropped, textRemapped } }
}

// Grid keys for all 13 dimensions
const GRID_KEYS = ['d1a', 'd2a', 'd3a', 'd4a', 'd5a', 'd6a', 'd7a', 'd8a', 'd9a', 'd10a', 'd11a', 'd12a', 'd13a']

// Section data columns
const SECTION_COLUMNS = [
  'firmographics_data', 'firmographics_complete',
  'general_benefits_data', 'general_benefits_complete',
  'current_support_data', 'current_support_complete',
  'dimension1_data', 'dimension1_complete',
  'dimension2_data', 'dimension2_complete',
  'dimension3_data', 'dimension3_complete',
  'dimension4_data', 'dimension4_complete',
  'dimension5_data', 'dimension5_complete',
  'dimension6_data', 'dimension6_complete',
  'dimension7_data', 'dimension7_complete',
  'dimension8_data', 'dimension8_complete',
  'dimension9_data', 'dimension9_complete',
  'dimension10_data', 'dimension10_complete',
  'dimension11_data', 'dimension11_complete',
  'dimension12_data', 'dimension12_complete',
  'dimension13_data', 'dimension13_complete',
  'cross_dimensional_data', 'cross_dimensional_complete',
  'employee_impact_data', 'employee_impact_complete',
]

/**
 * Transform a 2026 assessment row into a 2027 row
 */
function transformAssessment(row) {
  const newRow = {
    // Identity — same survey_id/app_id so existing CAC codes work
    survey_id: row.survey_id,
    app_id: row.app_id,
    user_id: row.user_id,
    email: row.email,
    company_name: row.company_name,

    // New survey year
    survey_year: 2027,

    // Payment — carry forward (FPs and returning companies don't pay again)
    payment_completed: true,
    payment_method: row.is_founding_partner ? 'founding_partner' : 'returning',
    payment_date: row.payment_date || new Date().toISOString(),

    // Auth — carry forward
    auth_completed: row.auth_completed || false,
    is_founding_partner: row.is_founding_partner || false,

    // Reset submission state
    survey_submitted: false,
    employee_survey_opt_in: null,
    employee_survey_opt_in_date: null,

    // Copy firmographics as-is (company profile doesn't change)
    firmographics_data: row.firmographics_data,
    firmographics_complete: row.firmographics_complete || false,

    // Copy general benefits as-is
    general_benefits_data: row.general_benefits_data,
    general_benefits_complete: false, // reset — they should review

    // Copy current support as-is
    current_support_data: row.current_support_data,
    current_support_complete: false, // reset

    // Copy cross-dimensional as-is
    cross_dimensional_data: row.cross_dimensional_data,
    cross_dimensional_complete: false, // reset

    // Copy employee impact as-is
    employee_impact_data: row.employee_impact_data,
    employee_impact_complete: false, // reset

    // Metadata
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Process each dimension's grid data
  const allStats = {}
  for (let d = 1; d <= 13; d++) {
    const dataKey = `dimension${d}_data`
    const completeKey = `dimension${d}_complete`
    const gridKey = `d${d}a`

    const dimData = row[dataKey]
    if (!dimData || typeof dimData !== 'object') {
      newRow[dataKey] = null
      newRow[completeKey] = false
      continue
    }

    // Clone the dimension data
    const newDimData = { ...dimData }

    // Remap the grid portion
    if (dimData[gridKey]) {
      const result = remapGrid(gridKey, dimData[gridKey])
      newDimData[gridKey] = result.data
      allStats[`D${d}`] = result.stats
    }

    // Remap any multi-country field responses too (d#aa values are select, not grid — pass through)
    // Follow-up fields (d#_1, d#_2, etc.) are non-grid — pass through as-is

    newRow[dataKey] = newDimData
    newRow[completeKey] = false // reset — they may have new items to answer
  }

  return { newRow, stats: allStats }
}

async function main() {
  console.log('='.repeat(60))
  console.log(`ROLLOVER SCRIPT: 2026 → 2027 ${IS_LIVE ? '*** LIVE RUN ***' : '(DRY RUN)'}`)
  console.log('='.repeat(60))

  // Step 1: Fetch all 2026 assessments (excluding Panel Companies)
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('*')
    .or('survey_year.eq.2026,survey_year.is.null')
    .order('company_name', { ascending: true })

  if (error) {
    console.error('ERROR fetching assessments:', error)
    process.exit(1)
  }

  console.log(`\nFound ${assessments.length} total 2026 assessments`)

  // Filter out Panel Companies
  const eligible = assessments.filter(a => {
    const name = (a.company_name || '').toLowerCase()
    return !name.startsWith('panel company')
  })

  const panelCount = assessments.length - eligible.length
  console.log(`Excluding ${panelCount} Panel Company records`)
  console.log(`Eligible for rollover: ${eligible.length}\n`)

  // Step 2: Check for existing 2027 rows (to avoid duplicates)
  const { data: existing2027 } = await supabase
    .from('assessments')
    .select('survey_id, app_id')
    .eq('survey_year', 2027)

  const existing2027Ids = new Set()
  if (existing2027) {
    for (const row of existing2027) {
      if (row.survey_id) existing2027Ids.add(row.survey_id)
      if (row.app_id) existing2027Ids.add(row.app_id)
    }
  }

  // Step 3: Transform and insert
  let created = 0, skipped = 0, errors = 0

  for (const row of eligible) {
    const id = row.survey_id || row.app_id
    const company = row.company_name || '(unnamed)'
    const isFP = row.is_founding_partner ? ' [FP]' : ''

    // Skip if 2027 row already exists
    if (existing2027Ids.has(row.survey_id) || existing2027Ids.has(row.app_id)) {
      console.log(`  SKIP (already has 2027 row): ${company}${isFP} — ${id}`)
      skipped++
      continue
    }

    const { newRow, stats } = transformAssessment(row)

    // Summary of grid changes
    const gridSummary = Object.entries(stats)
      .map(([dim, s]) => `${dim}: ${s.kept} kept, ${s.dropped} dropped, ${s.textRemapped} remapped`)
      .join('; ')

    console.log(`  ${IS_LIVE ? 'CREATE' : 'WOULD CREATE'}: ${company}${isFP} — ${id}`)
    if (gridSummary) {
      console.log(`    Grid changes: ${gridSummary}`)
    }

    if (IS_LIVE) {
      const { error: insertError } = await supabase
        .from('assessments')
        .insert(newRow)

      if (insertError) {
        console.error(`    ERROR inserting: ${insertError.message}`)
        errors++
      } else {
        created++
      }
    } else {
      created++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`SUMMARY ${IS_LIVE ? '(LIVE)' : '(DRY RUN)'}:`)
  console.log(`  ${IS_LIVE ? 'Created' : 'Would create'}: ${created}`)
  console.log(`  Skipped (already exist): ${skipped}`)
  console.log(`  Panel excluded: ${panelCount}`)
  if (errors > 0) console.log(`  Errors: ${errors}`)
  console.log('='.repeat(60))

  if (!IS_LIVE && created > 0) {
    console.log('\nRe-run with --live to execute:')
    console.log('  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/rollover-to-2027.js --live')
  }
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})

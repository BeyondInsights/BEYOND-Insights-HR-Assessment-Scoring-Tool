// Founding Partner Survey IDs - Pre-generated for partners with waived fees
// These IDs bypass payment processing and show "Founding Partner - Fee Waived" on dashboard
// THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL FP CODES AND COMPANY NAMES

// Map of FP codes to company names (empty string = unassigned)
export const FP_COMPANY_MAP: Record<string, string> = {
  'FP-HR-410734': 'Google (Alphabet)',
  'FP-HR-554736': 'Haymarket',
  'FP-HR-267233': 'ICBC-AXA Life',
  'FP-HR-602569': 'Lloyds Bank (Group)',
  'FP-HR-708691': 'Memorial Sloan Kettering',  // UPDATED from "Memorial"
  'FP-HR-982631': 'Merck',
  'FP-HR-405810': 'Nestlé',
  'FP-HR-532408': 'Pfizer',
  'FP-HR-087371': 'Publicis',
  'FP-HR-740095': 'Sanofi',
  'FP-HR-316326': 'Stellantis',
  'FP-HR-385190': "L'Oréal",
  'FP-HR-394644': 'Ford Motor',
  'FP-HR-847263': 'Citi',
  'FP-HR-519842': 'Haleon',
  'FP-HR-376491': 'Mars',
  'FP-HR-628157': 'Renault',
  'FP-HR-493582': 'Cancer@Work',
  'FP-748923': '',
  'FP-392847': 'Best Buy',
  'FP-856201': '',
  'FP-203948': 'Inspire Brands',
  'FP-674531': '',
  'FP-945872': '',
  'FP-128463': '',
  'FP-537219': '',
  'FP-891456': '',
  'FP-264790': '',
  'FP-718354': '',
  'FP-403682': '',
  'FP-956127': '',
  'FP-182745': '',
  'FP-630298': '',
  'FP-874163': '',
  'FP-295740': '',
  'FP-741856': '',
  'FP-508231': '',
  'FP-367924': '',
  'FP-923415': '',
  'FP-641078': '',
  'FP-189537': '',
  'FP-754209': '',
  'FP-432861': '',
  'FP-908574': '',
  'FP-265143': '',
  'FP-796382': '',
  'FP-413697': '',
  'FP-857024': '',
  'FP-172589': '',
  'FP-639458': '',
  'FP-984216': '',
  'FP-325847': '',
  'FP-561093': '',
  'FP-847632': '',
  'FP-219745': '',
  'FP-421967': '',
  'FP-573841': 'Schneider Electric',  // UPDATED from "Snyder Electronics"
  'FP-692014': '',
  'TEST-FP-001': 'Test Company (Internal Review)',
  'TEST-FP-002': 'Test Company (Client Review)',
  'TEST-FP-003': 'Test Company 3',
  'TEST-LOREAL-001': "L'Oréal (Test 1)",
  'TEST-LOREAL-002': "L'Oréal (Test 2)",
  'TEST-LOREAL-003': "L'Oréal (Test 3)",
}; 
  // Array of all valid FP IDs (derived from the map keys)
export const FOUNDING_PARTNER_IDS = Object.keys(FP_COMPANY_MAP);

/**
 * Check if a Survey ID is a Founding Partner ID with waived fee
 * Handles both formats: FP-HR-XXXXXX and FPHRXXXXXX
 */
export function isFoundingPartner(surveyId: string): boolean {
  if (!surveyId) return false;
  
  // Direct match first
  if (FOUNDING_PARTNER_IDS.includes(surveyId)) return true;
  
  // Try normalized format: FPHRXXXXXX -> FP-HR-XXXXXX
  if (surveyId.toUpperCase().startsWith('FPHR') && !surveyId.includes('-')) {
    const numPart = surveyId.replace(/^FPHR/i, '');
    const fpFormat = `FP-HR-${numPart}`;
    if (FOUNDING_PARTNER_IDS.includes(fpFormat)) return true;
  }
  
  // Try denormalized: FP-HR-XXXXXX -> FPHRXXXXXX
  if (surveyId.startsWith('FP-HR-')) {
    const normalized = surveyId.replace('FP-HR-', 'FPHR');
    if (FOUNDING_PARTNER_IDS.includes(normalized)) return true;
  }
  
  return false;
}

/**
 * Get company name for a Founding Partner ID
 * Returns the company name or 'Founding Partner' if not assigned
 * Handles both formats: FP-HR-XXXXXX and FPHRXXXXXX
 */
export function getFPCompanyName(surveyId: string): string {
  if (!surveyId) return 'Founding Partner';
  
  // Direct match first
  if (FP_COMPANY_MAP[surveyId]) return FP_COMPANY_MAP[surveyId];
  
  // Try normalized format: FPHRXXXXXX -> FP-HR-XXXXXX
  if (surveyId.toUpperCase().startsWith('FPHR') && !surveyId.includes('-')) {
    const numPart = surveyId.replace(/^FPHR/i, '');
    const fpFormat = `FP-HR-${numPart}`;
    if (FP_COMPANY_MAP[fpFormat]) return FP_COMPANY_MAP[fpFormat];
  }
  
  // Try denormalized: FP-HR-XXXXXX -> FPHRXXXXXX  
  if (surveyId.startsWith('FP-HR-')) {
    const normalized = surveyId.replace('FP-HR-', 'FPHR');
    if (FP_COMPANY_MAP[normalized]) return FP_COMPANY_MAP[normalized];
  }
  
  return 'Founding Partner';
}

/**
 * Get payment status message for Founding Partners
 */
export function getFoundingPartnerMessage(): string {
  return 'Founding Partner - Fee Waived';
}

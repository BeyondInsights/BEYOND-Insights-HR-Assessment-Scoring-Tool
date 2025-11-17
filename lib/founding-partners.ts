// Founding Partner Survey IDs - Pre-generated for partners with waived fees
// These IDs bypass payment processing and show "Founding Partner - Fee Waived" on dashboard
export const FOUNDING_PARTNER_IDS = [
  'FP-748923',
  'FP-392847',
  'FP-856201',
  'FP-203948',
  'FP-674531',
  'FP-945872',
  'FP-128463',
  'FP-537219',
  'FP-891456',
  'FP-264790',
  'FP-718354',
  'FP-403682',
  'FP-956127',
  'FP-182745',
  'FP-630298',
  'FP-874163',
  'FP-295740',
  'FP-741856',
  'FP-508231',
  'FP-367924',
  'FP-923415',
  'FP-641078',
  'FP-189537',
  'FP-754209',
  'FP-432861',
  'FP-908574',
  'FP-265143',
  'FP-796382',
  'FP-413697',
  'FP-857024',
  'FP-172589',
  'FP-639458',
  'FP-984216',
  'FP-325847',
  'FP-561093',
  'FP-847632',
  'FP-219745'  // ✅ NEW - 37th Founding Partner ID
];

/**
 * Check if a Survey ID is a Founding Partner ID with waived fee
 */
export function isFoundingPartner(surveyId: string): boolean {
  return FOUNDING_PARTNER_IDS.includes(surveyId);
}

/**
 * Get payment status message for Founding Partners
 */
export function getFoundingPartnerMessage(): string {
  return 'Founding Partner - Fee Waived';
}

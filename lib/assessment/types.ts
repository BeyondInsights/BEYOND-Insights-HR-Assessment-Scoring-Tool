/**
 * ASSESSMENT TYPES & FIELD DEFINITIONS
 * =====================================
 * SINGLE SOURCE OF TRUTH - All field lists come from here
 * 
 * To add a new field:
 * 1. Add to AssessmentRecord interface
 * 2. Add to appropriate FIELDS array below
 * 3. That's it - loader/saver/hydrator all use these arrays
 */

// ============================================
// MASTER TYPE DEFINITION
// ============================================

export interface AssessmentRecord {
  // Identity
  id?: string;
  user_id?: string;
  survey_id?: string;
  app_id?: string;
  email?: string;
  
  // Company Info
  company_name?: string;
  is_founding_partner?: boolean;
  
  // Authorization Data
  firmographics_data?: Record<string, any>;
  auth_completed?: boolean;
  
  // Payment
  payment_completed?: boolean;
  payment_method?: string;
  payment_amount?: number;
  payment_date?: string;
  
  // Invoice
  invoice_data?: Record<string, any>;
  invoice_number?: string;
  
  // Survey Data
  general_benefits_data?: Record<string, any>;
  current_support_data?: Record<string, any>;
  cross_dimensional_data?: Record<string, any>;
  employee_impact_data?: Record<string, any>;
  dimension1_data?: Record<string, any>;
  dimension2_data?: Record<string, any>;
  dimension3_data?: Record<string, any>;
  dimension4_data?: Record<string, any>;
  dimension5_data?: Record<string, any>;
  dimension6_data?: Record<string, any>;
  dimension7_data?: Record<string, any>;
  dimension8_data?: Record<string, any>;
  dimension9_data?: Record<string, any>;
  dimension10_data?: Record<string, any>;
  dimension11_data?: Record<string, any>;
  dimension12_data?: Record<string, any>;
  dimension13_data?: Record<string, any>;
  
  // Completion Flags
  firmographics_complete?: boolean;
  general_benefits_complete?: boolean;
  current_support_complete?: boolean;
  cross_dimensional_complete?: boolean;
  employee_impact_complete?: boolean;
  dimension1_complete?: boolean;
  dimension2_complete?: boolean;
  dimension3_complete?: boolean;
  dimension4_complete?: boolean;
  dimension5_complete?: boolean;
  dimension6_complete?: boolean;
  dimension7_complete?: boolean;
  dimension8_complete?: boolean;
  dimension9_complete?: boolean;
  dimension10_complete?: boolean;
  dimension11_complete?: boolean;
  dimension12_complete?: boolean;
  dimension13_complete?: boolean;
  
  // Submission Status
  survey_submitted?: boolean;
  submitted_at?: string;
  employee_survey_opt_in?: boolean | null;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  version?: number;
  last_update_source?: string;
  last_update_client_id?: string;
}

// ============================================
// FIELD ARRAYS - Used by loader/saver/hydrator
// ============================================

/** Survey data fields (JSON objects stored in localStorage and Supabase) */
export const DATA_FIELDS = [
  'firmographics_data',
  'general_benefits_data',
  'current_support_data',
  'cross_dimensional_data',
  'employee_impact_data',
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
] as const;

/** Completion flag fields (booleans) */
export const COMPLETION_FLAGS = [
  'auth_completed',
  'firmographics_complete',
  'general_benefits_complete',
  'current_support_complete',
  'cross_dimensional_complete',
  'employee_impact_complete',
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
] as const;

/** Payment-related fields */
export const PAYMENT_FIELDS = [
  'payment_completed',
  'payment_method',
  'payment_amount',
  'payment_date'
] as const;

/** Invoice-related fields */
export const INVOICE_FIELDS = [
  'invoice_data',
  'invoice_number'
] as const;

/** Submission status fields */
export const SUBMISSION_FIELDS = [
  'survey_submitted',
  'submitted_at',
  'employee_survey_opt_in'
] as const;

/** Identity fields (read-only from client perspective) */
export const IDENTITY_FIELDS = [
  'id',
  'user_id',
  'survey_id',
  'app_id',
  'email',
  'company_name',
  'is_founding_partner'
] as const;

/** Fields that should NEVER be sent in update payloads */
export const FORBIDDEN_UPDATE_FIELDS = new Set([
  'id',
  'created_at',
  'version',
  'last_update_source',
  'last_update_client_id',
  'last_snapshot_hash'
]);

// ============================================
// LOCALSTORAGE KEY MAPPINGS
// ============================================

/** Maps localStorage keys to Supabase column names (where they differ) */
export const LOCAL_TO_DB_KEY_MAP: Record<string, string> = {
  'employee-impact-assessment_data': 'employee_impact_data',
  'employee-impact-assessment_complete': 'employee_impact_complete',
  'login_company_name': 'company_name',
  'login_email': 'email',
  'auth_email': 'email',
  'login_first_name': 'firmographics_data.firstName',
  'login_last_name': 'firmographics_data.lastName',
  'login_title': 'firmographics_data.title',
  'survey_fully_submitted': 'survey_submitted',
  'assessment_completion_shown': 'survey_submitted'
};

/** Maps Supabase column names to localStorage keys (where they differ) */
export const DB_TO_LOCAL_KEY_MAP: Record<string, string> = {
  'employee_impact_data': 'employee-impact-assessment_data',
  'employee_impact_complete': 'employee-impact-assessment_complete'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Normalize survey ID (remove dashes, uppercase) */
export function normalizeSurveyId(id: string | null | undefined): string {
  if (!id) return '';
  return id.replace(/-/g, '').toUpperCase();
}

/** Get all data field names */
export function getAllDataFields(): string[] {
  return [...DATA_FIELDS];
}

/** Get all completion flag names */
export function getAllCompletionFlags(): string[] {
  return [...COMPLETION_FLAGS];
}

/** Check if a field is forbidden in updates */
export function isForbiddenField(field: string): boolean {
  return FORBIDDEN_UPDATE_FIELDS.has(field);
}

/** Get the localStorage key for a Supabase field */
export function getLocalStorageKey(dbField: string): string {
  return DB_TO_LOCAL_KEY_MAP[dbField] || dbField;
}

/** Get the Supabase field for a localStorage key */
export function getSupabaseField(localKey: string): string {
  return LOCAL_TO_DB_KEY_MAP[localKey] || localKey;
}

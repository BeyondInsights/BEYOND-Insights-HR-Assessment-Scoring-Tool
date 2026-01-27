/**
 * ASSESSMENT RECORD - SINGLE SOURCE OF TRUTH
 * 
 * This file defines:
 * 1. The complete AssessmentRecord type
 * 2. ALL field lists (data, completion flags, metadata)
 * 3. ONE loader function
 * 4. ONE hydrator function (server → localStorage)
 * 5. ONE collector function (localStorage → record)
 * 6. ONE persister function
 * 
 * ALL other code paths MUST use these functions.
 * Adding a field? Add it here ONCE and it propagates everywhere.
 */

import { supabase } from '@/lib/supabase/client'

// ============================================
// TYPE DEFINITION
// ============================================

export interface AssessmentRecord {
  // Identity
  id?: string
  user_id?: string | null
  survey_id?: string | null
  app_id?: string | null
  
  // User info
  email?: string | null
  company_name?: string | null
  
  // Payment
  payment_completed?: boolean
  payment_method?: string | null
  payment_amount?: number | null
  payment_date?: string | null
  is_founding_partner?: boolean
  
  // Invoice
  invoice_data?: any
  invoice_number?: string | null
  
  // Survey data - JSON blobs
  firmographics_data?: any
  general_benefits_data?: any
  current_support_data?: any
  cross_dimensional_data?: any
  employee_impact_data?: any
  dimension1_data?: any
  dimension2_data?: any
  dimension3_data?: any
  dimension4_data?: any
  dimension5_data?: any
  dimension6_data?: any
  dimension7_data?: any
  dimension8_data?: any
  dimension9_data?: any
  dimension10_data?: any
  dimension11_data?: any
  dimension12_data?: any
  dimension13_data?: any
  
  // Completion flags
  auth_completed?: boolean
  firmographics_complete?: boolean
  general_benefits_complete?: boolean
  current_support_complete?: boolean
  cross_dimensional_complete?: boolean
  employee_impact_complete?: boolean
  dimension1_complete?: boolean
  dimension2_complete?: boolean
  dimension3_complete?: boolean
  dimension4_complete?: boolean
  dimension5_complete?: boolean
  dimension6_complete?: boolean
  dimension7_complete?: boolean
  dimension8_complete?: boolean
  dimension9_complete?: boolean
  dimension10_complete?: boolean
  dimension11_complete?: boolean
  dimension12_complete?: boolean
  dimension13_complete?: boolean
  
  // Submission
  survey_submitted?: boolean
  submitted_at?: string | null
  employee_survey_opt_in?: boolean | null
  
  // Versioning
  version?: number
  created_at?: string
  updated_at?: string
}

// ============================================
// FIELD LISTS - SINGLE SOURCE OF TRUTH
// ============================================

/** All JSON data fields that store survey answers */
export const DATA_FIELDS = [
  'firmographics_data',
  'general_benefits_data',
  'current_support_data',
  'cross_dimensional_data',
  'employee_impact_data',
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
] as const

/** All boolean completion flags */
export const COMPLETION_FLAGS = [
  'auth_completed',
  'firmographics_complete',
  'general_benefits_complete',
  'current_support_complete',
  'cross_dimensional_complete',
  'employee_impact_complete',
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
] as const

/** Metadata fields that need special handling */
export const METADATA_FIELDS = [
  'company_name',
  'email',
  'payment_completed',
  'payment_method',
  'payment_amount',
  'payment_date',
  'invoice_data',
  'invoice_number',
  'survey_submitted',
  'submitted_at',
  'employee_survey_opt_in',
  'is_founding_partner'
] as const

/** Fields that should NEVER be sent in updates (managed by DB) */
export const FORBIDDEN_UPDATE_FIELDS = new Set([
  'id',
  'survey_id', 
  'app_id',
  'user_id',
  'version',
  'created_at',
  'updated_at',
  'last_update_source',
  'last_update_client_id',
  'last_snapshot_hash'
])

/** Mapping from localStorage keys to DB keys (where they differ) */
export const LOCAL_TO_DB_KEY_MAP: Record<string, string> = {
  'employee-impact-assessment_data': 'employee_impact_data',
  'employee-impact-assessment_complete': 'employee_impact_complete',
  'login_company_name': 'company_name',
  'auth_email': 'email',
  'login_email': 'email'
}

/** Mapping from DB keys to localStorage keys (where they differ) */
export const DB_TO_LOCAL_KEY_MAP: Record<string, string> = {
  'employee_impact_data': 'employee-impact-assessment_data',
  'employee_impact_complete': 'employee-impact-assessment_complete'
}

// ============================================
// IDENTITY TYPES
// ============================================

export interface AssessmentIdentity {
  userId?: string | null
  surveyId?: string | null
  appId?: string | null
}

// ============================================
// LOADER - ONE FUNCTION TO LOAD FROM SUPABASE
// ============================================

/**
 * Load assessment record from Supabase
 * Tries: user_id → survey_id → app_id (normalized)
 */
export async function loadAssessment(identity: AssessmentIdentity): Promise<AssessmentRecord | null> {
  const { userId, surveyId, appId } = identity
  
  if (!userId && !surveyId && !appId) {
    console.warn('[loadAssessment] No identity provided')
    return null
  }
  
  try {
    let query = supabase.from('assessments').select('*')
    
    // Build OR query for all possible identities
    const conditions: string[] = []
    if (userId) conditions.push(`user_id.eq.${userId}`)
    if (surveyId) {
      conditions.push(`survey_id.eq.${surveyId}`)
      const normalized = surveyId.replace(/-/g, '').toUpperCase()
      if (normalized !== surveyId) {
        conditions.push(`survey_id.eq.${normalized}`)
      }
    }
    if (appId) {
      conditions.push(`app_id.eq.${appId}`)
      const normalized = appId.replace(/-/g, '').toUpperCase()
      if (normalized !== appId) {
        conditions.push(`app_id.eq.${normalized}`)
      }
    }
    
    const { data, error } = await query.or(conditions.join(',')).maybeSingle()
    
    if (error) {
      console.error('[loadAssessment] Error:', error)
      return null
    }
    
    if (!data) {
      console.log('[loadAssessment] No record found')
      return null
    }
    
    console.log('[loadAssessment] ✅ Loaded record')
    return data as AssessmentRecord
    
  } catch (err) {
    console.error('[loadAssessment] Exception:', err)
    return null
  }
}

// ============================================
// HYDRATOR - POPULATE LOCALSTORAGE FROM RECORD
// ============================================

/**
 * Hydrate localStorage from an AssessmentRecord
 * This is the ONLY function that should write loaded data to localStorage
 */
export function hydrateClientFromRecord(record: AssessmentRecord): void {
  if (!record) return
  
  console.log('[hydrateClientFromRecord] Hydrating localStorage...')
  
  // === DATA FIELDS ===
  for (const field of DATA_FIELDS) {
    const value = record[field as keyof AssessmentRecord]
    const localKey = DB_TO_LOCAL_KEY_MAP[field] || field
    
    if (value && typeof value === 'object' && Object.keys(value).length > 0) {
      localStorage.setItem(localKey, JSON.stringify(value))
      console.log(`  ✓ ${localKey}`)
    }
  }
  
  // === COMPLETION FLAGS ===
  for (const field of COMPLETION_FLAGS) {
    const value = record[field as keyof AssessmentRecord]
    const localKey = DB_TO_LOCAL_KEY_MAP[field] || field
    
    // EXPLICIT: set true OR remove if false
    if (value === true) {
      localStorage.setItem(localKey, 'true')
    } else {
      localStorage.removeItem(localKey)
    }
  }
  
  // === METADATA ===
  if (record.company_name) {
    localStorage.setItem('login_company_name', record.company_name)
  }
  
  if (record.email) {
    localStorage.setItem('auth_email', record.email)
    localStorage.setItem('login_email', record.email)
  }
  
  if (record.payment_completed) {
    localStorage.setItem('payment_completed', 'true')
  } else {
    localStorage.removeItem('payment_completed')
  }
  
  if (record.payment_method) {
    localStorage.setItem('payment_method', record.payment_method)
  }
  
  if (record.payment_date) {
    localStorage.setItem('payment_date', record.payment_date)
  }
  
  // Invoice data
  if (record.invoice_data) {
    localStorage.setItem('invoice_data', JSON.stringify(record.invoice_data))
  }
  if (record.invoice_number) {
    localStorage.setItem('current_invoice_number', record.invoice_number)
  }
  
  // Submission status
  if (record.survey_submitted) {
    localStorage.setItem('survey_fully_submitted', 'true')
    localStorage.setItem('assessment_completion_shown', 'true')
  }
  
  // Employee survey opt-in (can be true, false, or null)
  if (record.employee_survey_opt_in !== null && record.employee_survey_opt_in !== undefined) {
    localStorage.setItem('employee_survey_opt_in', String(record.employee_survey_opt_in))
  }
  
  // First/last name from firmographics
  if (record.firmographics_data) {
    const firmo = record.firmographics_data
    if (firmo.firstName) localStorage.setItem('login_first_name', firmo.firstName)
    if (firmo.lastName) localStorage.setItem('login_last_name', firmo.lastName)
    if (firmo.title) localStorage.setItem('login_title', firmo.title)
    if (firmo.companyName && !record.company_name) {
      localStorage.setItem('login_company_name', firmo.companyName)
    }
  }
  
  // Survey ID
  if (record.survey_id) {
    localStorage.setItem('survey_id', record.survey_id)
    localStorage.setItem('login_Survey_id', record.survey_id)
  } else if (record.app_id) {
    localStorage.setItem('survey_id', record.app_id)
    localStorage.setItem('login_Survey_id', record.app_id)
  }
  
  // Version for optimistic locking
  if (record.version) {
    localStorage.setItem('assessment_version', String(record.version))
  }
  
  console.log('[hydrateClientFromRecord] ✅ Complete')
}

// ============================================
// COLLECTOR - GATHER LOCALSTORAGE INTO RECORD
// ============================================

/**
 * Collect localStorage data into an AssessmentRecord
 * This is the ONLY function that should gather data for sync
 */
export function collectClientRecord(): Partial<AssessmentRecord> {
  const record: Partial<AssessmentRecord> = {}
  let fieldCount = 0
  
  // === DATA FIELDS ===
  for (const field of DATA_FIELDS) {
    const localKey = DB_TO_LOCAL_KEY_MAP[field] || field
    // Check both the DB key and local key (for backwards compat)
    const value = localStorage.getItem(localKey) || localStorage.getItem(field)
    
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (parsed && Object.keys(parsed).length > 0) {
          const dbKey = LOCAL_TO_DB_KEY_MAP[localKey] || field
          ;(record as any)[dbKey] = parsed
          fieldCount++
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }
  }
  
  // === COMPLETION FLAGS ===
  for (const field of COMPLETION_FLAGS) {
    const localKey = DB_TO_LOCAL_KEY_MAP[field] || field
    const value = localStorage.getItem(localKey) || localStorage.getItem(field)
    
    if (value === 'true') {
      const dbKey = LOCAL_TO_DB_KEY_MAP[localKey] || field
      ;(record as any)[dbKey] = true
      fieldCount++
    }
  }
  
  // === METADATA ===
  
  // Company name - extract from firmographics if present
  if (record.firmographics_data?.companyName) {
    record.company_name = record.firmographics_data.companyName
  } else {
    const companyName = localStorage.getItem('login_company_name') || localStorage.getItem('company_name')
    if (companyName) record.company_name = companyName
  }
  
  // Email
  const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email')
  if (email) record.email = email.toLowerCase().trim()
  
  // Payment
  if (localStorage.getItem('payment_completed') === 'true') {
    record.payment_completed = true
  }
  const paymentMethod = localStorage.getItem('payment_method')
  if (paymentMethod) record.payment_method = paymentMethod
  
  const paymentDate = localStorage.getItem('payment_date')
  if (paymentDate) record.payment_date = paymentDate
  
  // Invoice
  const invoiceData = localStorage.getItem('invoice_data')
  if (invoiceData) {
    try {
      record.invoice_data = JSON.parse(invoiceData)
    } catch (e) {}
  }
  const invoiceNumber = localStorage.getItem('current_invoice_number')
  if (invoiceNumber) record.invoice_number = invoiceNumber
  
  // Submission
  if (localStorage.getItem('survey_fully_submitted') === 'true') {
    record.survey_submitted = true
  }
  
  const optIn = localStorage.getItem('employee_survey_opt_in')
  if (optIn !== null) {
    record.employee_survey_opt_in = optIn === 'true'
  }
  
  // First/last name into firmographics
  const firstName = localStorage.getItem('login_first_name')
  const lastName = localStorage.getItem('login_last_name')
  const title = localStorage.getItem('login_title')
  
  if (firstName || lastName || title) {
    if (!record.firmographics_data) record.firmographics_data = {}
    if (firstName) record.firmographics_data.firstName = firstName
    if (lastName) record.firmographics_data.lastName = lastName
    if (title) record.firmographics_data.title = title
  }
  
  console.log(`[collectClientRecord] Collected ${fieldCount} fields`)
  return record
}

// ============================================
// PERSISTER - SAVE TO SUPABASE
// ============================================

export interface PersistOptions {
  source?: string
  expectedVersion?: number
  clientId?: string
}

/**
 * Persist a record to Supabase
 * Handles version checking and forbidden field stripping
 */
export async function persistRecord(
  identity: AssessmentIdentity,
  record: Partial<AssessmentRecord>,
  options: PersistOptions = {}
): Promise<{ success: boolean; newVersion?: number; error?: string }> {
  
  const { source = 'client', expectedVersion, clientId } = options
  
  // Strip forbidden fields
  const safeRecord: Partial<AssessmentRecord> = {}
  for (const [key, value] of Object.entries(record)) {
    if (!FORBIDDEN_UPDATE_FIELDS.has(key)) {
      ;(safeRecord as any)[key] = value
    }
  }
  
  // Add metadata
  safeRecord.updated_at = new Date().toISOString()
  
  try {
    // Build the sync payload for Netlify function
    const payload = {
      survey_id: identity.surveyId,
      user_id: identity.userId,
      data: safeRecord,
      source,
      expectedVersion,
      client_id: clientId,
      fallbackSurveyId: identity.surveyId,
      fallbackAppId: identity.appId
    }
    
    const response = await fetch('/.netlify/functions/sync-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('[persistRecord] ✅ Saved, new version:', result.newVersion)
      if (result.newVersion) {
        localStorage.setItem('assessment_version', String(result.newVersion))
      }
      return { success: true, newVersion: result.newVersion }
    } else {
      console.error('[persistRecord] Failed:', result.error)
      return { success: false, error: result.error }
    }
    
  } catch (err: any) {
    console.error('[persistRecord] Exception:', err)
    return { success: false, error: err.message }
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Load and hydrate in one call
 */
export async function loadAndHydrate(identity: AssessmentIdentity): Promise<boolean> {
  const record = await loadAssessment(identity)
  if (record) {
    hydrateClientFromRecord(record)
    return true
  }
  return false
}

/**
 * Collect and persist in one call
 */
export async function collectAndPersist(
  identity: AssessmentIdentity,
  options: PersistOptions = {}
): Promise<{ success: boolean; error?: string }> {
  const record = collectClientRecord()
  
  if (Object.keys(record).length === 0) {
    return { success: true } // Nothing to save
  }
  
  // Get expected version from localStorage
  const versionStr = localStorage.getItem('assessment_version')
  const expectedVersion = versionStr ? parseInt(versionStr, 10) : undefined
  
  return persistRecord(identity, record, { ...options, expectedVersion })
}

/**
 * Get current identity from localStorage
 */
export function getCurrentIdentity(): AssessmentIdentity {
  return {
    surveyId: localStorage.getItem('survey_id') || localStorage.getItem('login_Survey_id') || undefined,
    appId: localStorage.getItem('survey_id')?.replace(/-/g, '').toUpperCase() || undefined
  }
}

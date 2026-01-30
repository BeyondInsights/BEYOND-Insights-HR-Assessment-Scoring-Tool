/**
 * LOAD DATA FROM SUPABASE v6 - With namespaced versions + metadata reconciliation
 * 
 * FIXES APPLIED:
 * 1. GLOBAL GUARDRAIL: Only write DB→localStorage if localStorage is EMPTY
 * 2. For rescue users: calls rescue gate first, then DB-only mode
 * 3. Stores assessment_version after loading from DB
 * 4. REMOVED direct user_id linking - now handled atomically via autosync
 * 5. Hydration guard prevents DB→localStorage writes from triggering dirty/sync
 * 6. Namespaced assessment_version by idKey (prevents cross-record contamination)
 * 7. Metadata reconciliation even when localStorage has data
 * 8. app_id lookup tries both raw and normalized
 */

import { supabase } from './client'
import { runRescueGate } from './rescue-gate'
import { startHydration, endHydration } from './auto-data-sync'

// Survey IDs that need rescue / DB-first mode
const RESCUE_SURVEY_IDS = [
  'CAC25120273411EF',  // Janet - Blood Cancer United
]

// ============================================
// ID KEY HELPERS (for namespacing)
// ============================================

function getIdKey(surveyId?: string): string {
  const sid = surveyId || localStorage.getItem('survey_id') || ''
  const appId = localStorage.getItem('app_id') || ''
  return sid || appId || 'unknown'
}

function versionKey(surveyId?: string): string {
  return `assessment_version_${getIdKey(surveyId)}`
}

function getStoredVersion(surveyId?: string): number {
  const idKey = getIdKey(surveyId)
  // Try namespaced key first, fall back to legacy
  let stored = localStorage.getItem(`assessment_version_${idKey}`)
  if (!stored) {
    stored = localStorage.getItem('assessment_version')
  }
  return stored ? Number(stored) : 0
}

function setStoredVersion(version: number, surveyId?: string): void {
  const idKey = getIdKey(surveyId)
  localStorage.setItem(`assessment_version_${idKey}`, String(version))
  // Also set legacy for backwards compatibility
  localStorage.setItem('assessment_version', String(version))
}

// ============================================
// SURVEY KEYS (for clearing stale data)
// ============================================

const SURVEY_DATA_KEYS = [
  'firmographics_data', 'general_benefits_data', 'current_support_data',
  'cross_dimensional_data', 'employee-impact-assessment_data',
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
]

const SURVEY_COMPLETE_KEYS = [
  'firmographics_complete', 'general_benefits_complete', 'current_support_complete',
  'cross_dimensional_complete', 'employee-impact-assessment_complete',
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
]

// ============================================
// CHECK IF LOCALSTORAGE IDENTITY MATCHES CURRENT SURVEY
// ============================================

function localIdentityMatches(surveyId: string): boolean {
  const storedSurveyId = localStorage.getItem('survey_id') || ''
  const storedAppId = localStorage.getItem('app_id') || ''
  
  // If no stored identity, assume match (new user)
  if (!storedSurveyId && !storedAppId) return true
  
  const raw = surveyId
  const normalized = surveyId.replace(/-/g, '').toUpperCase()
  
  return (
    storedSurveyId === raw ||
    storedAppId === raw ||
    storedAppId === normalized ||
    storedSurveyId === normalized
  )
}

// ============================================
// CLEAR STALE SURVEY DATA (when switching accounts)
// ============================================

function clearStaleSurveyData(): void {
  startHydration()
  try {
    // Clear data keys
    SURVEY_DATA_KEYS.forEach(k => localStorage.removeItem(k))
    // Clear completion flags
    SURVEY_COMPLETE_KEYS.forEach(k => localStorage.removeItem(k))
    // Clear identity keys
    localStorage.removeItem('survey_id')
    localStorage.removeItem('app_id')
    localStorage.removeItem('assessment_version')
    localStorage.removeItem('auth_completed')
    console.log('[LOAD] Cleared stale survey data from localStorage')
  } finally {
    endHydration()
  }
}

// ============================================
// CHECK IF LOCALSTORAGE HAS DATA
// ============================================

function localStorageHasData(): boolean {
  for (const key of SURVEY_DATA_KEYS) {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (parsed && Object.keys(parsed).length > 0) {
          return true
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }
  return false
}

// ============================================
// COLLECT LOCALSTORAGE DATA
// ============================================

function collectLocalStorageData(): Record<string, any> {
  const data: Record<string, any> = {}
  
  for (const key of SURVEY_DATA_KEYS) {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (parsed && Object.keys(parsed).length > 0) {
          const dbKey = key === 'employee-impact-assessment_data' ? 'employee_impact_data' : key
          data[dbKey] = parsed
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
  
  return data
}

// ============================================
// WRITE DB DATA TO LOCALSTORAGE
// ============================================

function writeToLocalStorage(dbRow: Record<string, any>): void {
  // START HYDRATION - prevents auto-sync from marking these writes as "dirty"
  startHydration()
  
  try {
    const dataKeyMap: Record<string, string> = {
      'firmographics_data': 'firmographics_data',
      'general_benefits_data': 'general_benefits_data',
      'current_support_data': 'current_support_data',
      'cross_dimensional_data': 'cross_dimensional_data',
      'employee_impact_data': 'employee-impact-assessment_data',
    }
    
    for (let i = 1; i <= 13; i++) {
      dataKeyMap[`dimension${i}_data`] = `dimension${i}_data`
    }
    
    for (const [dbKey, localKey] of Object.entries(dataKeyMap)) {
      if (dbRow[dbKey] && typeof dbRow[dbKey] === 'object' && Object.keys(dbRow[dbKey]).length > 0) {
        localStorage.setItem(localKey, JSON.stringify(dbRow[dbKey]))
      }
    }
    
    // Store metadata
    if (dbRow.company_name) {
      localStorage.setItem('login_company_name', dbRow.company_name)
      localStorage.setItem('company_name', dbRow.company_name)
    }
    if (dbRow.survey_id) {
      localStorage.setItem('survey_id', dbRow.survey_id)
    }
    if (dbRow.app_id) {
      localStorage.setItem('app_id', dbRow.app_id)
    }
    
    // Store version for future syncs (namespaced)
    if (dbRow.version) {
      setStoredVersion(dbRow.version, dbRow.survey_id)
    }
    
    // ============================================
    // COMPLETION FLAGS - Must load these to prevent re-asking questions!
    // ============================================
    
    // Auth completed flag
    if (dbRow.auth_completed) {
      localStorage.setItem('auth_completed', 'true')
    } else {
      localStorage.removeItem('auth_completed')
    }
    
    // Section completion flags
    if (dbRow.firmographics_complete) localStorage.setItem('firmographics_complete', 'true')
    if (dbRow.general_benefits_complete) localStorage.setItem('general_benefits_complete', 'true')
    if (dbRow.current_support_complete) localStorage.setItem('current_support_complete', 'true')
    if (dbRow.cross_dimensional_complete) localStorage.setItem('cross_dimensional_complete', 'true')
    if (dbRow.employee_impact_complete) localStorage.setItem('employee-impact-assessment_complete', 'true')
    
    // Dimension completion flags
    for (let i = 1; i <= 13; i++) {
      if (dbRow[`dimension${i}_complete`]) {
        localStorage.setItem(`dimension${i}_complete`, 'true')
      }
    }
    
    // Payment info
    if (dbRow.payment_completed) localStorage.setItem('payment_completed', 'true')
    if (dbRow.payment_method) localStorage.setItem('payment_method', dbRow.payment_method)
    
    // ============================================
    // EMPLOYEE SURVEY OPT-IN - Critical to prevent re-asking!
    // ============================================
    if (dbRow.employee_survey_opt_in !== null && dbRow.employee_survey_opt_in !== undefined) {
      localStorage.setItem('employee_survey_opt_in', String(dbRow.employee_survey_opt_in))
    }
    
    // Survey submission status - if submitted, don't show completion page again
    if (dbRow.survey_submitted) {
      localStorage.setItem('survey_fully_submitted', 'true')
      localStorage.setItem('assessment_completion_shown', 'true')
    }
    
    // ============================================
    // INVOICE DATA - so View Invoice works after returning
    // ============================================
    if (dbRow.invoice_data) {
      localStorage.setItem('invoice_data', JSON.stringify(dbRow.invoice_data))
    }
    if (dbRow.invoice_number) {
      localStorage.setItem('current_invoice_number', dbRow.invoice_number)
    }
    
    // ============================================
    // FIRST NAME, LAST NAME, TITLE from firmographics
    // ============================================
    if (dbRow.firmographics_data) {
      const firmo = dbRow.firmographics_data
      if (firmo.firstName) localStorage.setItem('login_first_name', firmo.firstName)
      if (firmo.lastName) localStorage.setItem('login_last_name', firmo.lastName)
      if (firmo.title) localStorage.setItem('login_title', firmo.title)
    }
  } finally {
    // END HYDRATION - re-enable dirty tracking
    endHydration()
  }
}

// ============================================
// WRITE METADATA ONLY (for when localStorage has data but needs identity/version reconciliation)
// ============================================

function writeMetadataToLocalStorage(dbRow: Record<string, any>): void {
  startHydration()
  try {
    // Identity keys
    if (dbRow.company_name) {
      localStorage.setItem('login_company_name', dbRow.company_name)
      localStorage.setItem('company_name', dbRow.company_name)
    }
    if (dbRow.survey_id) {
      localStorage.setItem('survey_id', dbRow.survey_id)
    }
    if (dbRow.app_id) {
      localStorage.setItem('app_id', dbRow.app_id)
    }
    
    // Version (namespaced)
    if (dbRow.version) {
      setStoredVersion(dbRow.version, dbRow.survey_id)
    }
    
    // Check if user has dirty (unsynced) changes - if not, we can clear stale flags
    const idKey = getIdKey(dbRow.survey_id)
    const dirtyData = localStorage.getItem(`dirty_${idKey}`)
    const isDirty = dirtyData && dirtyData !== '0' && dirtyData !== ''
    
    // Auth/completion status (important for routing)
    if (dbRow.auth_completed) {
      localStorage.setItem('auth_completed', 'true')
    } else if (!isDirty) {
      // Only clear if not dirty (avoid wiping in-progress work)
      localStorage.removeItem('auth_completed')
    }
    
    // Payment info
    if (dbRow.payment_completed) localStorage.setItem('payment_completed', 'true')
    if (dbRow.payment_method) localStorage.setItem('payment_method', dbRow.payment_method)
    
    // Employee survey opt-in
    if (dbRow.employee_survey_opt_in !== null && dbRow.employee_survey_opt_in !== undefined) {
      localStorage.setItem('employee_survey_opt_in', String(dbRow.employee_survey_opt_in))
    }
    
    // Survey submission status
    if (dbRow.survey_submitted) {
      localStorage.setItem('survey_fully_submitted', 'true')
      localStorage.setItem('assessment_completion_shown', 'true')
    } else if (!isDirty) {
      // Only clear if not dirty
      localStorage.removeItem('survey_fully_submitted')
      localStorage.removeItem('assessment_completion_shown')
    }
    
    // Invoice data
    if (dbRow.invoice_data) {
      localStorage.setItem('invoice_data', JSON.stringify(dbRow.invoice_data))
    } else if (!isDirty) {
      localStorage.removeItem('invoice_data')
    }
    if (dbRow.invoice_number) {
      localStorage.setItem('current_invoice_number', dbRow.invoice_number)
    } else if (!isDirty) {
      localStorage.removeItem('current_invoice_number')
    }
    
    console.log('[LOAD] Metadata reconciled from DB (isDirty:', isDirty, ')')
  } finally {
    endHydration()
  }
}

// ============================================
// FETCH FROM DATABASE
// ============================================

async function fetchFromDatabase(
  surveyId: string,
  userId?: string
): Promise<Record<string, any> | null> {
  let dbRow = null
  
  // Strategy 1: user_id
  if (userId) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (!error && data) {
      dbRow = data
      console.log('[LOAD] Found record via user_id')
    }
  }
  
  // Strategy 2: survey_id
  if (!dbRow && surveyId) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('survey_id', surveyId)
      .single()
    
    if (!error && data) {
      dbRow = data
      console.log('[LOAD] Found record via survey_id')
    }
  }
  
  // Strategy 3: app_id - try BOTH raw and normalized (FP IDs have hyphens)
  if (!dbRow && surveyId) {
    const raw = surveyId
    const normalized = surveyId.replace(/-/g, '').toUpperCase()
    
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .or(`app_id.eq.${raw},app_id.eq.${normalized}`)
      .maybeSingle()
    
    if (!error && data) {
      dbRow = data
      console.log('[LOAD] Found record via app_id (raw or normalized)')
    }
  }
  
  return dbRow
}

// ============================================
// MAIN LOAD FUNCTION
// ============================================

export async function loadDataFromSupabase(
  surveyId: string,
  userId?: string
): Promise<{ success: boolean; data: Record<string, any> | null; source: string }> {
  
  console.log('[LOAD] Starting load for survey_id:', surveyId, 'user_id:', userId || 'none')
  
  // ============================================
  // RESCUE GATE - For targeted users ONLY
  // ============================================
  if (RESCUE_SURVEY_IDS.includes(surveyId)) {
    console.log('[LOAD] Running rescue gate for:', surveyId)
    
    await runRescueGate(surveyId)
    
    // After rescue, ALWAYS load from DB (ignore localStorage)
    console.log('[LOAD] Rescue complete - loading from DB only')
    
    const dbRow = await fetchFromDatabase(surveyId, userId)
    if (!dbRow) {
      return { success: false, data: null, source: 'none' }
    }
    
    // Store version (namespaced)
    if (dbRow.version) {
      setStoredVersion(dbRow.version, surveyId)
    }
    
    return { success: true, data: dbRow, source: 'database' }
  }
  
  // ============================================
  // GLOBAL GUARDRAIL: Check if localStorage has data
  // ============================================
  const hasLocalData = localStorageHasData()
  
  // ============================================
  // IDENTITY GUARD: If localStorage has data for DIFFERENT survey, clear it
  // This prevents "wrong profile" bugs when testing multiple accounts
  // ============================================
  if (hasLocalData && !localIdentityMatches(surveyId)) {
    console.warn('[LOAD] localStorage data belongs to different survey/app_id. Clearing stale data.')
    clearStaleSurveyData()
    // Re-check after clearing
    const stillHasData = localStorageHasData()
    if (!stillHasData) {
      // Cleared successfully, fall through to DB load
      console.log('[LOAD] Stale data cleared, will load from DB')
    }
  }
  
  // Re-check hasLocalData after potential clearing
  const hasValidLocalData = localStorageHasData() && localIdentityMatches(surveyId)
  
  if (hasValidLocalData) {
    // localStorage has data FOR THIS SURVEY - DO NOT overwrite it from DB
    console.log('[LOAD] localStorage has valid data for this survey - using localStorage')
    
    // ALWAYS fetch DB to reconcile metadata (identity, version, flags)
    // This fixes stale survey_id/app_id/company_name issues
    try {
      const dbRow = await fetchFromDatabase(surveyId, userId)
      if (dbRow) {
        writeMetadataToLocalStorage(dbRow)
      }
    } catch (e) {
      console.warn('[LOAD] Could not fetch metadata from DB:', e)
    }
    
    const localData = collectLocalStorageData()
    return { success: true, data: localData, source: 'localStorage' }
  }
  
  // ============================================
  // localStorage is EMPTY - safe to load from DB
  // ============================================
  console.log('[LOAD] localStorage is empty - fetching from database')
  
  try {
    const dbRow = await fetchFromDatabase(surveyId, userId)
    
    if (!dbRow) {
      console.log('[LOAD] No database record found')
      return { success: false, data: null, source: 'none' }
    }
    
    // SAFE to write to localStorage because it was empty
    writeToLocalStorage(dbRow)
    console.log('[LOAD] Loaded from database and wrote to localStorage')
    
    return { success: true, data: dbRow, source: 'database' }
    
  } catch (error) {
    console.error('[LOAD] Error:', error)
    return { success: false, data: null, source: 'error' }
  }
}

/**
 * Hydrate form state from loaded data
 */
export function hydrateFormFromData(
  data: Record<string, any>,
  setFormState: (state: Record<string, any>) => void
): void {
  if (!data) return
  
  const formState: Record<string, any> = {}
  
  const answerFields = [
    'firmographics_data', 'general_benefits_data', 'current_support_data',
    'cross_dimensional_data', 'employee_impact_data',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
  ]
  
  for (const field of answerFields) {
    if (data[field]) {
      formState[field] = data[field]
    }
  }
  
  setFormState(formState)
}

// Alias for backwards compatibility
export const loadUserDataFromSupabase = loadDataFromSupabase;

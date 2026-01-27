/**
 * LOAD DATA FROM SUPABASE v4 - Final fixes per ChatGPT review
 * 
 * FIXES APPLIED:
 * 1. GLOBAL GUARDRAIL: Only write DB→localStorage if localStorage is EMPTY
 * 2. For rescue users: calls rescue gate first, then DB-only mode
 * 3. Stores assessment_version after loading from DB
 * 4. REMOVED direct user_id linking - now handled atomically via autosync
 */

import { supabase } from './client'
import { runRescueGate } from './rescue-gate-v3'

// Survey IDs that need rescue / DB-first mode
const RESCUE_SURVEY_IDS = [
  'CAC25120273411EF',  // Janet - Blood Cancer United
]

// ============================================
// CHECK IF LOCALSTORAGE HAS DATA
// ============================================

function localStorageHasData(): boolean {
  const dataKeys = [
    'firmographics_data', 'general_benefits_data', 'current_support_data',
    'cross_dimensional_data', 'employee-impact-assessment_data',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
  ]
  
  for (const key of dataKeys) {
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
  
  const dataKeys = [
    'firmographics_data', 'general_benefits_data', 'current_support_data',
    'cross_dimensional_data', 'employee-impact-assessment_data',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
  ]
  
  for (const key of dataKeys) {
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
  
  // Store version for future syncs
  if (dbRow.version) {
    localStorage.setItem('assessment_version', String(dbRow.version))
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
      // NOTE: user_id linking will happen atomically via next autosync
    }
  }
  
  // Strategy 3: app_id
  if (!dbRow && surveyId) {
    const normalizedAppId = surveyId.replace(/-/g, '').toUpperCase()
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('app_id', normalizedAppId)
      .single()
    
    if (!error && data) {
      dbRow = data
      console.log('[LOAD] Found record via app_id')
      // NOTE: user_id linking will happen atomically via next autosync
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
    
    // Store version but DO NOT write data to localStorage
    if (dbRow.version) {
      localStorage.setItem('assessment_version', String(dbRow.version))
    }
    
    return { success: true, data: dbRow, source: 'database' }
  }
  
  // ============================================
  // GLOBAL GUARDRAIL: Check if localStorage has data
  // ============================================
  const hasLocalData = localStorageHasData()
  
  if (hasLocalData) {
    // localStorage has data - DO NOT overwrite it from DB
    console.log('[LOAD] localStorage has data - using localStorage (not overwriting)')
    
    // But ensure we have assessment_version
    const storedVersion = localStorage.getItem('assessment_version')
    if (!storedVersion) {
      console.log('[LOAD] No stored version - fetching version from DB...')
      try {
        const dbRow = await fetchFromDatabase(surveyId, userId)
        if (dbRow?.version) {
          localStorage.setItem('assessment_version', String(dbRow.version))
          console.log('[LOAD] Fetched and stored version:', dbRow.version)
        }
      } catch (e) {
        console.warn('[LOAD] Could not fetch version from DB')
      }
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

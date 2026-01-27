/**
 * RESCUE GATE v2 - Fixed per ChatGPT review
 * 
 * FIXES APPLIED:
 * 1. Uses stableStringify + sha256Hex for correct hashing
 * 2. Uses localStorage-based cross-tab lock with TTL
 * 3. Generates tab ID once and stores in sessionStorage
 * 4. Calls Netlify function for writes (consistent with autosync)
 */

import { supabase } from './client'
import { stableStringify } from './stable-stringify'
import { sha256Hex } from './sha256-hex'
import { getOrCreateTabId, acquireRescueLock, refreshRescueLock, releaseRescueLock } from './tab-lock'

// ============================================
// CONFIGURATION
// ============================================

// Survey IDs to rescue (hard-scoped for Phase 1 safety)
const RESCUE_SURVEY_IDS = [
  'CAC25120273411EF',  // Janet - Blood Cancer United
]

// Lock key now includes survey_id for future multi-user support
function getRescueLockKey(surveyId: string): string {
  return `rescue_gate_lock_${surveyId}`
}
const RESCUE_LOCK_TTL = 30000 // 30 seconds

// ============================================
// CANONICAL ANSWER EXTRACTION
// ============================================

/**
 * Extract canonical answer fields for comparison
 * Only includes user-entered answer data, not server metadata
 */
function extractCanonicalAnswers(data: Record<string, any>): Record<string, any> {
  const answerFields = [
    'dimension1_data', 'dimension2_data', 'dimension3_data', 'dimension4_data',
    'dimension5_data', 'dimension6_data', 'dimension7_data', 'dimension8_data',
    'dimension9_data', 'dimension10_data', 'dimension11_data', 'dimension12_data',
    'dimension13_data', 'cross_dimensional_data', 'employee_impact_data',
    'firmographics_data', 'general_benefits_data', 'current_support_data'
  ]
  
  const canonical: Record<string, any> = {}
  for (const field of answerFields) {
    if (data[field] && typeof data[field] === 'object' && Object.keys(data[field]).length > 0) {
      canonical[field] = data[field]
    }
  }
  return canonical
}

/**
 * Hash canonical answers using stable stringify + SHA-256
 */
async function hashCanonicalAnswers(answersObj: unknown): Promise<string> {
  const stable = stableStringify(answersObj, { dropNull: true })
  return sha256Hex(stable)
}

// ============================================
// LOCALSTORAGE DATA COLLECTION
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
        console.warn(`[RESCUE] Could not parse ${key}`)
      }
    }
  }
  
  // Collect completion flags
  const completeKeys = [
    'firmographics_complete', 'general_benefits_complete', 'current_support_complete',
    'cross_dimensional_complete', 'employee-impact-assessment_complete',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
  ]
  
  for (const key of completeKeys) {
    const value = localStorage.getItem(key)
    if (value === 'true') {
      const dbKey = key === 'employee-impact-assessment_complete' ? 'employee_impact_complete' : key
      data[dbKey] = true
    }
  }
  
  return data
}

// ============================================
// NETLIFY FUNCTION CALL FOR RESCUE WRITE
// ============================================

interface RescueWriteResult {
  success: boolean
  newVersion?: number
  snapshotHash?: string
  error?: string
}

async function writeRescueViaNetlify(
  surveyId: string,
  data: Record<string, any>,
  expectedVersion: number,
  clientId: string
): Promise<RescueWriteResult> {
  try {
    // Get authenticated user - REQUIRED for rescue write
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData?.session
    
    const userId = session?.user?.id
    const accessToken = session?.access_token
    
    if (!userId || !accessToken) {
      console.error('[RESCUE] Not authenticated - cannot write')
      return { success: false, error: 'Not authenticated for rescue write' }
    }
    
    const response = await fetch('/.netlify/functions/sync-assessment', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        survey_id: surveyId,
        fallbackSurveyId: surveyId,
        fallbackAppId: surveyId,
        user_id: userId,
        accessToken,
        data,
        userType: 'regular',
        source: 'rescue',
        client_id: clientId,
        expectedVersion
      })
    })
    
    const result = await response.json()
    
    if (response.status === 409) {
      return { success: false, error: 'Version conflict' }
    }
    
    if (!response.ok || result.rowsAffected === 0) {
      return { success: false, error: result.error || 'No rows updated' }
    }
    
    return {
      success: true,
      newVersion: result.newVersion,
      snapshotHash: result.snapshotHash
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ============================================
// MAIN RESCUE FUNCTION
// ============================================

export async function runRescueGate(surveyId: string): Promise<boolean> {
  // Only run for targeted survey IDs (Phase 1)
  if (!RESCUE_SURVEY_IDS.includes(surveyId)) {
    return true
  }
  
  // Check if rescue already done this session
  if (sessionStorage.getItem('rescue_done') === '1') {
    console.log('[RESCUE] Already completed this session')
    return true
  }
  
  // Get stable tab ID
  const tabId = getOrCreateTabId()
  
  // Try to acquire cross-tab lock
  if (!acquireRescueLock(getRescueLockKey(surveyId), tabId, RESCUE_LOCK_TTL)) {
    console.warn('[RESCUE] Another tab is handling rescue, this tab will be read-only')
    sessionStorage.setItem('rescue_readonly', '1')
    return true
  }
  
  console.log('[RESCUE] Lock acquired, starting rescue for:', surveyId)
  
  // Set up periodic lock refresh
  const refreshInterval = setInterval(() => {
    refreshRescueLock(getRescueLockKey(surveyId), tabId)
  }, 10000)
  
  try {
    // Step 1: Read localStorage data FIRST
    const localData = collectLocalStorageData()
    const localHasData = Object.keys(localData).length > 0
    
    if (!localHasData) {
      console.log('[RESCUE] No localStorage data found, nothing to rescue')
      sessionStorage.setItem('rescue_done', '1')
      return true
    }
    
    console.log('[RESCUE] Found localStorage data:', Object.keys(localData).length, 'fields')
    
    // Step 2: Fetch DB row (do NOT write to localStorage!)
    // Include normalized app_id for bulletproof matching
    const normalizedAppId = surveyId.replace(/-/g, '').toUpperCase()
    
    const { data: dbRows, error: fetchError } = await supabase
      .from('assessments')
      .select('*')
      .or(`survey_id.eq.${surveyId},app_id.eq.${surveyId},app_id.eq.${normalizedAppId}`)
      .limit(1)
    
    if (fetchError) {
      console.error('[RESCUE] Failed to fetch DB row:', fetchError.message)
      sessionStorage.setItem('rescue_done', '1')
      return false
    }
    
    const dbRow = dbRows?.[0]
    if (!dbRow) {
      console.log('[RESCUE] No DB record found for survey_id:', surveyId)
      sessionStorage.setItem('rescue_done', '1')
      return true
    }
    
    console.log('[RESCUE] Found DB record, version:', dbRow.version, 'updated_at:', dbRow.updated_at)
    
    // Step 3: Compare hashes using CORRECT implementation
    const localCanonical = extractCanonicalAnswers(localData)
    const dbCanonical = extractCanonicalAnswers(dbRow)
    
    const localHash = await hashCanonicalAnswers(localCanonical)
    const dbHash = await hashCanonicalAnswers(dbCanonical)
    
    console.log('[RESCUE] Local hash:', localHash)
    console.log('[RESCUE] DB hash:', dbHash)
    
    if (localHash === dbHash) {
      console.log('[RESCUE] Hashes match - no rescue needed')
      sessionStorage.setItem('rescue_done', '1')
      return true
    }
    
    // Step 4: Hashes differ - prompt user
    console.log('[RESCUE] ⚠️ HASHES DIFFER - localStorage has different data than DB!')
    
    const shouldRestore = window.confirm(
      'We found unsaved changes from a previous session.\n\n' +
      'Would you like to restore them?\n\n' +
      'Click OK to restore your changes, or Cancel to use the saved version.'
    )
    
    if (!shouldRestore) {
      console.log('[RESCUE] User declined restore - proceeding with DB data')
      sessionStorage.setItem('rescue_done', '1')
      return true
    }
    
    // Step 5: User confirmed - write via Netlify function
    console.log('[RESCUE] User confirmed restore - writing via Netlify function...')
    
    const expectedVersion = dbRow.version || 1
    
    const result = await writeRescueViaNetlify(
      surveyId,
      localData,
      expectedVersion,
      tabId
    )
    
    if (!result.success) {
      console.error('[RESCUE] Write failed:', result.error)
      alert('Failed to restore your changes. Please try refreshing the page.')
      return false
    }
    
    console.log('[RESCUE] ✅ Rescue successful!')
    console.log('[RESCUE] New version:', result.newVersion)
    console.log('[RESCUE] Snapshot hash:', result.snapshotHash)
    
    // Store the new version for future syncs
    if (result.newVersion) {
      localStorage.setItem('assessment_version', String(result.newVersion))
    }
    
    sessionStorage.setItem('rescue_done', '1')
    return true
    
  } catch (error) {
    console.error('[RESCUE] Exception during rescue:', error)
    sessionStorage.setItem('rescue_done', '1')
    return false
  } finally {
    // Always clean up
    clearInterval(refreshInterval)
    releaseRescueLock(getRescueLockKey(surveyId), tabId)
  }
}

/**
 * Check if rescue is done (for other modules to check)
 */
export function isRescueDone(): boolean {
  return sessionStorage.getItem('rescue_done') === '1'
}

/**
 * Check if this tab is read-only due to another tab handling rescue
 */
export function isRescueReadOnly(): boolean {
  return sessionStorage.getItem('rescue_readonly') === '1'
}

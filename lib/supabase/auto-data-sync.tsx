/**
 * AUTO DATA SYNC - BULLETPROOF VERSION WITH CONTAMINATION PROTECTION
 * 
 * FEATURES:
 * 1. Uses Netlify function as primary sync (service role, bypasses RLS)
 * 2. Falls back to direct Supabase if Netlify function fails
 * 3. sendBeacon to Netlify function for reliable page-close sync
 * 4. Dirty queue with retries for failed syncs
 * 5. Stable hash for change detection
 * 6. All existing business logic preserved
 * 7. SECURITY: Sends accessToken for regular authenticated users
 * 8. Cached userId/token for reliable unload sync
 * 9. Server owns updated_at (client doesn't set it)
 * 10. *** CONTAMINATION PROTECTION: Verifies company_name matches survey_id ***
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'

// ============================================
// CONSTANTS
// ============================================
const PENDING_OPS_KEY = 'pending_sync_ops'
const RETRY_INTERVAL_MS = 15000 // 15 seconds
const MAX_RETRIES = 5

// ============================================
// GET EXPECTED COMPANY NAME
// Uses founding-partners.ts as single source of truth
// ============================================

// Normalize survey_id for comparison
function normalizeId(id: string): string {
  return (id || '').replace(/-/g, '').toUpperCase()
}

// Get expected company name for a survey_id (async to allow dynamic import)
async function getExpectedCompanyNameAsync(surveyId: string): Promise<string | null> {
  if (!surveyId) return null
  
  // For FP-style IDs, use founding-partners.ts as source of truth
  if (surveyId.toUpperCase().startsWith('FP')) {
    try {
      const { getFPCompanyName, isFoundingPartner } = await import('@/lib/founding-partners')
      if (isFoundingPartner(surveyId)) {
        const companyName = getFPCompanyName(surveyId)
        // getFPCompanyName returns 'Founding Partner' for unassigned codes
        return companyName !== 'Founding Partner' ? companyName : null
      }
    } catch (e) {
      console.warn('[AutoSync] Could not load founding-partners module')
    }
    return null
  }
  
  // For standard app_id format (CAC...)
  // These don't have a fixed mapping, so we can't validate by company name
  // Instead, we rely on survey_id matching
  return null
}

// ============================================
// CONTAMINATION CHECK
// Returns true if data appears valid for the survey_id
// Returns false if there's a company mismatch (contamination detected)
// *** IMPORTANT: This blocks sync but does NOT clear localStorage ***
// ============================================
async function checkForContamination(surveyId: string): Promise<{ isClean: boolean; reason?: string }> {
  if (!surveyId) {
    return { isClean: true } // No survey_id, nothing to check
  }
  
  // Get firmographics data from localStorage
  const firmographicsStr = localStorage.getItem('firmographics_data')
  if (!firmographicsStr) {
    return { isClean: true } // No firmographics data, nothing to contaminate
  }
  
  let firmographics: any
  try {
    firmographics = JSON.parse(firmographicsStr)
  } catch {
    return { isClean: true } // Can't parse, treat as clean
  }
  
  // Get company name from firmographics
  const dataCompanyName = firmographics?.companyName || 
                          localStorage.getItem('login_company_name') || ''
  
  if (!dataCompanyName) {
    return { isClean: true } // No company name in data, can't validate
  }
  
  // Get expected company name for this survey_id
  const expectedCompanyName = await getExpectedCompanyNameAsync(surveyId)
  
  if (!expectedCompanyName) {
    // For non-FP surveys (CAC...), check against the stored survey_id
    // If survey_id changed but company_name didn't update, that's suspicious
    const storedSurveyId = localStorage.getItem('survey_id') || ''
    
    // If the survey IDs don't match what we're trying to sync to, that's contamination
    if (storedSurveyId && normalizeId(storedSurveyId) !== normalizeId(surveyId)) {
      return { 
        isClean: false, 
        reason: `Survey ID mismatch: localStorage has ${storedSurveyId}, trying to sync to ${surveyId}` 
      }
    }
    
    return { isClean: true }
  }
  
  // Normalize company names for comparison - handles Unicode apostrophes, accents, etc.
  const normalizeCompanyName = (name: string): string => {
    return (name || '')
      .toLowerCase()
      .normalize('NFD')  // Decompose accented characters (é → e + ́)
      .replace(/[\u0300-\u036f]/g, '')  // Remove accent marks
      .replace(/[''`']/g, "'")  // Normalize all apostrophe types
      .replace(/[^a-z0-9]/g, '')  // Keep only alphanumeric
      .trim()
  }
  
  const normalizedDataCompany = normalizeCompanyName(dataCompanyName)
  const normalizedExpectedCompany = normalizeCompanyName(expectedCompanyName)
  
  console.log(`[AutoSync] Company check: data="${dataCompanyName}" (${normalizedDataCompany}), expected="${expectedCompanyName}" (${normalizedExpectedCompany})`)
  
  // Check for match (exact or substring after normalization)
  const isMatch = normalizedDataCompany === normalizedExpectedCompany ||
                  normalizedDataCompany.includes(normalizedExpectedCompany) ||
                  normalizedExpectedCompany.includes(normalizedDataCompany)
  
  if (!isMatch) {
    return { 
      isClean: false, 
      reason: `Company mismatch: data has "${dataCompanyName}" (${normalizedDataCompany}), expected "${expectedCompanyName}" (${normalizedExpectedCompany}) for survey ${surveyId}` 
    }
  }
  
  return { isClean: true }
}

// ============================================
// LOG CONTAMINATION (NO CLEARING)
// *** CRITICAL: This LOGS the issue but does NOT clear data ***
// *** Clearing data was causing the L'Oreal 0% bug ***
// ============================================
function logContaminationDetected(reason: string): void {
  console.error(`🚨 CONTAMINATION DETECTED: ${reason}`)
  console.warn('⚠️ Sync blocked to prevent data corruption. User should re-login.')
  
  // Dispatch event so UI can respond (e.g., show warning)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('contamination-detected', { 
      detail: { reason, timestamp: Date.now() } 
    }))
  }
}

// ============================================
// CACHED AUTH STATE (for reliable unload access)
// Module-level so syncWithBeacon can access without async
// ============================================
let cachedUserId: string | null = null
let cachedAccessToken: string | null = null

// ============================================
// COMP'D USERS - Same list as in login page
// ============================================
const COMPD_USER_IDS = [
  'CAC26010292641OB',  // Best Buy - Melanie Moriarty
]

function isCompdUser(surveyId: string): boolean {
  const normalized = surveyId?.replace(/-/g, '').toUpperCase() || ''
  return COMPD_USER_IDS.some(id => id.replace(/-/g, '').toUpperCase() === normalized)
}

// ============================================
// SYNC INDICATOR - Dispatch events for UI
// ============================================
function dispatchSyncEvent(status: 'start' | 'success' | 'error', message?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sync-status', { 
      detail: { status, message, timestamp: Date.now() } 
    }))
  }
}

// ============================================
// PENDING OPERATIONS QUEUE
// ============================================
interface PendingOp {
  surveyId: string
  data: Record<string, any>
  timestamp: number
  retryCount: number
  userType: 'compd' | 'fp' | 'sharedFp' | 'regular'
  accessToken?: string
}

function getPendingOps(): PendingOp[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(PENDING_OPS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function savePendingOps(ops: PendingOp[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(ops))
  } catch (e) {
    console.error('[AutoSync] Failed to save pending ops:', e)
  }
}

function addPendingOp(surveyId: string, data: Record<string, any>, userType: PendingOp['userType'], accessToken?: string): void {
  const ops = getPendingOps()
  const existingIdx = ops.findIndex(op => op.surveyId === surveyId)
  const newOp: PendingOp = {
    surveyId,
    data,
    timestamp: Date.now(),
    retryCount: 0,
    userType,
    accessToken,
  }
  if (existingIdx >= 0) {
    ops[existingIdx] = newOp
  } else {
    ops.push(newOp)
  }
  savePendingOps(ops)
}

function removePendingOp(surveyId: string): void {
  const ops = getPendingOps().filter(op => op.surveyId !== surveyId)
  savePendingOps(ops)
}

function incrementRetryCount(surveyId: string): void {
  const ops = getPendingOps()
  const op = ops.find(o => o.surveyId === surveyId)
  if (op) {
    op.retryCount++
    savePendingOps(ops)
  }
}

// ============================================
// COLLECT SURVEY DATA
// ============================================
function collectAllSurveyData(): { data: Record<string, any>, hasData: boolean } {
  const updateData: Record<string, any> = {}
  
  const dataKeys = [
    'firmographics_data',
    'general_benefits_data',
    'current_support_data',
    'cross_dimensional_data',
    'employee-impact-assessment_data',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
  ]
  
  const completeKeyMap: Record<string, string> = {
    'firmographics_complete': 'firmographics_complete',
    'auth_completed': 'auth_completed',
    'general_benefits_complete': 'general_benefits_complete',
    'current_support_complete': 'current_support_complete',
    'cross_dimensional_complete': 'cross_dimensional_complete',
    'employee-impact-assessment_complete': 'employee_impact_complete',
  }
  
  for (let i = 1; i <= 13; i++) {
    completeKeyMap[`dimension${i}_complete`] = `dimension${i}_complete`
  }
  
  let itemCount = 0
  
  dataKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (parsed && Object.keys(parsed).length > 0) {
          const dbKey = key === 'employee-impact-assessment_data' ? 'employee_impact_data' : key
          updateData[dbKey] = parsed
          itemCount++
        }
      } catch (e) {
        // Skip unparseable data
      }
    }
  })
  
  Object.entries(completeKeyMap).forEach(([localKey, dbKey]) => {
    const value = localStorage.getItem(localKey)
    if (value === 'true') {
      updateData[dbKey] = true
      itemCount++
    }
  })
  
  // NOTE: Do NOT set updated_at here - server owns that field
  
  return { data: updateData, hasData: itemCount > 0 }
}

// ============================================
// STABLE HASH FOR CHANGE DETECTION
// ============================================
let lastSyncedDataHash: string = ''

function getStableHash(data: Record<string, any>): string {
  const sortObject = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sortObject)
    }
    if (obj && typeof obj === 'object') {
      return Object.keys(obj).sort().reduce((acc: any, key) => {
        acc[key] = sortObject(obj[key])
        return acc
      }, {})
    }
    return obj
  }
  return JSON.stringify(sortObject(data))
}

function hasDataChanged(newData: Record<string, any>): boolean {
  const newHash = getStableHash(newData)
  if (newHash === lastSyncedDataHash) {
    return false
  }
  lastSyncedDataHash = newHash
  return true
}

// ============================================
// NETLIFY FUNCTION SYNC (PRIMARY)
// ============================================
async function syncViaNetlifyFunction(surveyId: string, data: Record<string, any>, accessToken?: string): Promise<boolean> {
  try {
    const payload: Record<string, any> = { 
      surveyId, 
      data, 
      timestamp: Date.now()  // Used for stale overwrite protection
    }
    
    // Include accessToken if provided (required for regular users)
    if (accessToken) {
      payload.accessToken = accessToken
    }
    
    const response = await fetch('/.netlify/functions/sync-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      
      // 409 = stale data OR company mismatch - don't retry
      if (response.status === 409) {
        console.warn('[AutoSync] Sync rejected (stale or mismatch):', error)
        return true // Consider it "success" - we don't want to retry bad data
      }
      
      console.error('[AutoSync] Netlify function error:', error)
      return false
    }
    
    const result = await response.json()
    console.log('✅ AUTO-SYNC: Synced via Netlify function:', result.surveyId, result.action)
    return true
  } catch (e) {
    console.error('[AutoSync] Netlify function failed:', e)
    return false
  }
}

// ============================================
// CHECK FOUNDING PARTNER
// ============================================
async function checkIsFoundingPartner(surveyId: string): Promise<boolean> {
  if (!surveyId) return false
  if (surveyId.startsWith('FP-')) return true
  
  try {
    const { isFoundingPartner } = await import('@/lib/founding-partners')
    return isFoundingPartner(surveyId)
  } catch {
    return surveyId.startsWith('FP-')
  }
}

// ============================================
// SYNC COMP'D USER
// ============================================
async function syncCompdUserToSupabase(surveyId: string): Promise<boolean> {
  const normalized = surveyId?.replace(/-/g, '').toUpperCase() || ''
  console.log('🎫 AUTO-SYNC: Syncing comp\'d user:', normalized)
  
  // *** CONTAMINATION CHECK ***
  const contamCheck = await checkForContamination(normalized)
  if (!contamCheck.isClean) {
    logContaminationDetected(contamCheck.reason!)
    return false
  }
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData || !hasDataChanged(updateData)) {
    return true
  }
  
  // Try Netlify function first (no accessToken needed for comp'd users)
  if (await syncViaNetlifyFunction(normalized, updateData)) {
    removePendingOp(normalized)
    return true
  }
  
  // Fallback to direct Supabase
  try {
    const { error } = await supabase
      .from('assessments')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('app_id', normalized)
    
    if (error) {
      console.error('❌ AUTO-SYNC: Comp\'d user sync failed:', error.message)
      addPendingOp(normalized, updateData, 'compd')
      return false
    }
    
    console.log('✅ AUTO-SYNC: Comp\'d user sync successful!')
    removePendingOp(normalized)
    return true
  } catch (error) {
    console.error('❌ AUTO-SYNC: Exception:', error)
    addPendingOp(normalized, updateData, 'compd')
    return false
  }
}

// ============================================
// SYNC FP WITH CONTAMINATION CHECK
// ============================================
async function syncFPToSupabase(surveyId: string): Promise<boolean> {
  console.log('🏢 AUTO-SYNC: Syncing FP data for:', surveyId)
  
  // *** CONTAMINATION CHECK - THIS IS THE CRITICAL FIX ***
  const contamCheck = await checkForContamination(surveyId)
  if (!contamCheck.isClean) {
    logContaminationDetected(contamCheck.reason!)
    return false
  }
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData) {
    return true
  }
  
  if (!hasDataChanged(updateData)) {
    console.log('⏭️ AUTO-SYNC: Data unchanged')
    return true
  }
  
  // Try Netlify function first (no accessToken needed for FP)
  if (await syncViaNetlifyFunction(surveyId, updateData)) {
    removePendingOp(surveyId)
    return true
  }
  
  // Fallback to direct Supabase
  try {
    const { data: updateResult, error: updateError } = await supabase
      .from('assessments')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('survey_id', surveyId)
      .select('id')
    
    if (updateError) {
      console.error('❌ AUTO-SYNC: Update failed:', updateError.message)
      addPendingOp(surveyId, updateData, 'fp')
      return false
    }
    
    if (!updateResult || updateResult.length === 0) {
      console.log('🔄 AUTO-SYNC: No existing record, creating...')
      const { error: insertError } = await supabase
        .from('assessments')
        .insert({
          survey_id: surveyId,
          app_id: surveyId,
          is_founding_partner: true,
          payment_completed: true,
          payment_method: 'FP Comp',
          payment_amount: 1250.00,
          ...updateData,
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error('❌ AUTO-SYNC: Insert failed:', insertError.message)
        addPendingOp(surveyId, updateData, 'fp')
        return false
      }
    }
    
    console.log('✅ AUTO-SYNC: FP sync successful!')
    removePendingOp(surveyId)
    return true
  } catch (error) {
    console.error('❌ AUTO-SYNC: Exception:', error)
    addPendingOp(surveyId, updateData, 'fp')
    return false
  }
}

// ============================================
// SYNC REGULAR USER - SENDS ACCESS TOKEN
// ============================================
async function syncRegularUserToSupabase(): Promise<boolean> {
  // Get current session for auth token
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session
  
  if (!session?.user) {
    return true // No user, nothing to sync
  }
  
  const userId = session.user.id
  const accessToken = session.access_token
  
  // Update cached values for unload sync
  cachedUserId = userId
  cachedAccessToken = accessToken
  
  console.log('👤 AUTO-SYNC: Syncing regular user...')
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData || !hasDataChanged(updateData)) {
    return true
  }
  
  // Try Netlify function first WITH ACCESS TOKEN
  if (await syncViaNetlifyFunction(userId, updateData, accessToken)) {
    removePendingOp(userId)
    return true
  }
  
  // Fallback to direct Supabase (RLS will validate)
  const { error } = await supabase
    .from('assessments')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  
  if (error) {
    console.error('❌ AUTO-SYNC: Regular user sync failed:', error.message)
    addPendingOp(userId, updateData, 'regular', accessToken)
    return false
  }
  
  console.log('✅ AUTO-SYNC: Regular user sync successful!')
  removePendingOp(userId)
  return true
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================
async function syncToSupabase(): Promise<boolean> {
  const surveyId = localStorage.getItem('survey_id') || ''
  
  // Early exit if no survey_id
  if (!surveyId) {
    // Check if there's a regular user session
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session?.user) {
      return await syncRegularUserToSupabase()
    }
    return true
  }
  
  dispatchSyncEvent('start')
  
  try {
    // Comp'd users
    if (isCompdUser(surveyId)) {
      const result = await syncCompdUserToSupabase(surveyId)
      dispatchSyncEvent(result ? 'success' : 'error')
      return result
    }
    
    // Shared FP
    try {
      const { isSharedFP, saveSharedFPData } = await import('./fp-shared-storage')
      if (isSharedFP(surveyId)) {
        const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email')
        await saveSharedFPData(surveyId, email || undefined)
        dispatchSyncEvent('success')
        return true
      }
    } catch (e) {}
    
    // Regular FP
    const isFP = await checkIsFoundingPartner(surveyId)
    if (isFP) {
      const result = await syncFPToSupabase(surveyId)
      dispatchSyncEvent(result ? 'success' : 'error')
      return result
    }
    
    // Regular user
    const result = await syncRegularUserToSupabase()
    dispatchSyncEvent(result ? 'success' : 'error')
    return result
    
  } catch (error) {
    console.error('❌ AUTO-SYNC: Exception:', error)
    dispatchSyncEvent('error', 'Sync failed')
    return false
  }
}

// ============================================
// PROCESS PENDING OPERATIONS
// ============================================
async function processPendingOps(): Promise<void> {
  const ops = getPendingOps()
  if (ops.length === 0) return
  
  console.log(`🔄 AUTO-SYNC: Processing ${ops.length} pending operations`)
  
  for (const op of ops) {
    if (op.retryCount >= MAX_RETRIES) {
      console.warn(`⚠️ AUTO-SYNC: Max retries exceeded for ${op.surveyId}, removing from queue`)
      removePendingOp(op.surveyId)
      continue
    }
    
    // *** CONTAMINATION CHECK before retrying ***
    const contamCheck = await checkForContamination(op.surveyId)
    if (!contamCheck.isClean) {
      console.warn(`⚠️ AUTO-SYNC: Contamination detected for pending op ${op.surveyId}, removing`)
      removePendingOp(op.surveyId)
      continue
    }
    
    // For regular users, we need a fresh token (old one may have expired)
    let accessToken = op.accessToken
    if (op.userType === 'regular') {
      const { data: sessionData } = await supabase.auth.getSession()
      accessToken = sessionData?.session?.access_token
      if (!accessToken) {
        console.warn(`⚠️ AUTO-SYNC: No valid session for regular user ${op.surveyId}, skipping`)
        continue
      }
    }
    
    // Try Netlify function
    const success = await syncViaNetlifyFunction(op.surveyId, op.data, accessToken)
    
    if (success) {
      removePendingOp(op.surveyId)
      console.log(`✅ AUTO-SYNC: Pending op succeeded for ${op.surveyId}`)
    } else {
      incrementRetryCount(op.surveyId)
      console.warn(`⚠️ AUTO-SYNC: Retry ${op.retryCount + 1}/${MAX_RETRIES} for ${op.surveyId}`)
    }
  }
}

// ============================================
// BEACON SYNC FOR PAGE CLOSE
// Uses cached userId if no survey_id (for regular users)
// *** ALSO RESPECTS DISABLED PATHS ***
// ============================================
function syncWithBeacon(): void {
  // *** CRITICAL: Check if current page is in disabled paths ***
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    if (isAutoSyncDisabled(currentPath)) {
      console.log('👋 AUTO-SYNC: Beacon skipped - on disabled path:', currentPath)
      return
    }
  }
  
  // Get surveyId - try localStorage first, then cached userId for regular users
  let surveyId = localStorage.getItem('survey_id') || ''
  let accessToken: string | null = null
  
  // If no survey_id in localStorage, use cached userId (regular authenticated user)
  if (!surveyId && cachedUserId) {
    surveyId = cachedUserId
    accessToken = cachedAccessToken
  }
  
  if (!surveyId) return
  
  // *** SIMPLE CONTAMINATION CHECK for beacon (sync only, no async imports) ***
  // Just check if localStorage survey_id matches what we're trying to sync
  const storedSurveyId = localStorage.getItem('survey_id') || ''
  if (storedSurveyId && normalizeId(storedSurveyId) !== normalizeId(surveyId)) {
    console.error('🚨 BEACON: Survey ID mismatch, NOT syncing')
    return // Don't sync - let server-side check handle it
  }
  
  const { data: updateData, hasData } = collectAllSurveyData()
  if (!hasData) return
  
  // Build payload - server will set updated_at
  const payload: Record<string, any> = { 
    surveyId, 
    data: updateData, 
    timestamp: Date.now() 
  }
  
  // Include accessToken for regular users (UUID format)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(surveyId)
  if (isUUID && accessToken) {
    payload.accessToken = accessToken
  }
  
  const payloadStr = JSON.stringify(payload)
  
  // Try sendBeacon to Netlify function (most reliable for unload)
  const beaconSent = navigator.sendBeacon(
    '/.netlify/functions/sync-assessment',
    new Blob([payloadStr], { type: 'application/json' })
  )
  
  if (beaconSent) {
    console.log('👋 AUTO-SYNC: Beacon sent to Netlify function')
    return
  }
  
  // Fallback: keepalive fetch to Netlify function
  fetch('/.netlify/functions/sync-assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payloadStr,
    keepalive: true,
  }).catch(() => {
    // Last resort: direct to Supabase with keepalive (only works for FP/comp'd)
    if (!isUUID) {
      // FP uses survey_id, comp'd uses app_id (normalized)
      const isFP = surveyId.startsWith('FP-')
      const column = isFP ? 'survey_id' : 'app_id'
      const value = isFP ? surveyId : surveyId.replace(/-/g, '').toUpperCase()
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/assessments?${column}=eq.${value}`
      fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ ...updateData, updated_at: new Date().toISOString() }),
        keepalive: true,
      }).catch(() => {
        // Add to pending queue for next load
        const userType = isFP ? 'fp' : 'compd'
        addPendingOp(surveyId, updateData, userType as any)
      })
    } else {
      // Regular user - add to pending queue
      addPendingOp(surveyId, updateData, 'regular', accessToken || undefined)
    }
  })
}

// ============================================
// FORCE SYNC - EXPORTED
// ============================================
export async function forceSyncNow(): Promise<boolean> {
  console.log('⚡ FORCE SYNC TRIGGERED')
  lastSyncedDataHash = ''
  return await syncToSupabase()
}

// ============================================
// PATHS WHERE AUTO-SYNC IS DISABLED
// These are read-only pages - admin viewing data, NOT editing
// ============================================
const DISABLED_PATHS = [
  '/admin',           // All admin pages
  '/report/',         // Interactive report pages (read-only)
  '/scoring',         // Scoring page
]

function isAutoSyncDisabled(pathname: string): boolean {
  if (!pathname) return true
  
  // Check if current path starts with any disabled path
  for (const disabledPath of DISABLED_PATHS) {
    if (pathname.startsWith(disabledPath)) {
      return true
    }
  }
  return false
}

// ============================================
// COMPONENT
// ============================================
export default function AutoDataSync() {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  const syncInProgress = useRef(false)
  const pendingSync = useRef<NodeJS.Timeout | null>(null)
  const retryInterval = useRef<NodeJS.Timeout | null>(null)
  
  const doSync = useCallback(async (reason: string) => {
    // *** CRITICAL: NEVER sync on admin/report pages ***
    if (isAutoSyncDisabled(pathname || '')) {
      // Don't even log - just silently skip
      return
    }
    
    if (syncInProgress.current) {
      return
    }
    
    syncInProgress.current = true
    console.log(`🔄 AUTO-SYNC: ${reason}`)
    
    try {
      await syncToSupabase()
    } finally {
      syncInProgress.current = false
    }
  }, [pathname])
  
  // IMMEDIATE sync on mount + setup auth state listener
  useEffect(() => {
    doSync('Initial page load')
    setTimeout(() => doSync('Delayed check'), 1000)
    
    // Process any pending ops from previous session
    setTimeout(() => processPendingOps(), 2000)
    
    // Listen for auth state changes to keep cached values updated
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        cachedUserId = session.user.id
        cachedAccessToken = session.access_token
      } else {
        cachedUserId = null
        cachedAccessToken = null
      }
    })
    
    // Initialize cached values from current session
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData?.session?.user) {
        cachedUserId = sessionData.session.user.id
        cachedAccessToken = sessionData.session.access_token
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [doSync])
  
  // Sync on route change
  useEffect(() => {
    if (pathname !== lastPath.current) {
      const prevPath = lastPath.current
      lastPath.current = pathname
      
      if (prevPath !== '') {
        doSync(`Route: ${prevPath} → ${pathname}`)
      }
    }
  }, [pathname, doSync])
  
  // INTERCEPT localStorage writes
  useEffect(() => {
    const originalSetItem = localStorage.setItem.bind(localStorage)
    
    localStorage.setItem = (key: string, value: string) => {
      originalSetItem(key, value)
      
      if (key.includes('_data') || key.includes('_complete')) {
        console.log(`📝 AUTO-SYNC: localStorage write: ${key}`)
        
        if (pendingSync.current) {
          clearTimeout(pendingSync.current)
        }
        
        pendingSync.current = setTimeout(() => {
          doSync(`localStorage write: ${key}`)
        }, 250)
      }
    }
    
    return () => {
      localStorage.setItem = originalSetItem
      if (pendingSync.current) {
        clearTimeout(pendingSync.current)
      }
    }
  }, [doSync])
  
  // Periodic sync every 10 seconds + retry pending ops every 15 seconds
  useEffect(() => {
    const syncInterval = setInterval(() => {
      doSync('Periodic (10s)')
    }, 10000)
    
    retryInterval.current = setInterval(() => {
      processPendingOps()
    }, RETRY_INTERVAL_MS)
    
    return () => {
      clearInterval(syncInterval)
      if (retryInterval.current) clearInterval(retryInterval.current)
    }
  }, [doSync])
  
  // Sync on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        doSync('Tab became visible')
        processPendingOps()
      } else {
        doSync('Tab hidden - sync before leaving')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [doSync])
  
  // RELIABLE sync on page close
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('👋 AUTO-SYNC: Page closing - reliable sync')
      syncWithBeacon()
    }
    
    const handlePageHide = () => {
      console.log('👋 AUTO-SYNC: Page hide - reliable sync')
      syncWithBeacon()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [])
  
  // Expose utilities globally for debugging
  useEffect(() => {
    (window as any).forceSyncNow = forceSyncNow;
    (window as any).checkPendingOps = () => {
      const ops = getPendingOps()
      console.log('[AutoSync] Pending operations:', ops)
      return ops
    }
    (window as any).getCachedAuth = () => {
      console.log('[AutoSync] Cached auth:', { userId: cachedUserId, hasToken: !!cachedAccessToken })
      return { userId: cachedUserId, hasToken: !!cachedAccessToken }
    }
    (window as any).checkContamination = async () => {
      const surveyId = localStorage.getItem('survey_id') || ''
      const result = await checkForContamination(surveyId)
      console.log('[AutoSync] Contamination check:', result)
      return result
    }
  }, [])
  
  return null
}

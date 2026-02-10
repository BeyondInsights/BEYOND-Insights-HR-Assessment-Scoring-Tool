/**
 * AUTO DATA SYNC v5.6 - WITH RECOVERY MODE
 * 
 * FIXES APPLIED:
 * 1. Namespaced assessment_version by idKey (prevents cross-survey conflicts)
 * 2. Hydration guard for localStorage patch (prevents false dirty on DB→local writes)
 * 3. TTL auto-heal verifies DB version before clearing
 * 4. Patch guard to prevent double-patching
 * 5. EXPORTED isDirty() - was missing, causing SyncStatusIndicator to crash
 * 6. Recovery mode for AbbVie (FP-421967)
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'
import { stableStringify } from './stable-stringify'
import { getOrCreateTabId } from './tab-lock'

// ============================================
// CONFIGURATION
// ============================================

const COMPD_USER_IDS = [
  'CAC26010292641OB',
]

const DB_FIRST_SURVEY_IDS = [
  'CAC25120273411EF',
]

// Recovery mode - capture localStorage for these surveys before syncing
const RECOVERY_MODE_SURVEYS = [
  'FP-421967',  // AbbVie - Lesli Marasco
]

function isCompdUser(surveyId: string): boolean {
  const normalized = surveyId?.replace(/-/g, '').toUpperCase() || ''
  return COMPD_USER_IDS.some(id => id.replace(/-/g, '').toUpperCase() === normalized)
}

function isRecoveryModeSurvey(surveyId: string): boolean {
  return RECOVERY_MODE_SURVEYS.includes(surveyId)
}

// ============================================
// RECOVERY CAPTURE (for data loss incidents)
// ============================================

async function captureLocalStorageForRecovery(surveyId: string): Promise<void> {
  if (!isRecoveryModeSurvey(surveyId)) return
  
  // Only capture once per session
  const captureKey = `recovery_captured_${surveyId}`
  if (sessionStorage.getItem(captureKey)) return
  
  console.log('🔴 RECOVERY MODE: Capturing localStorage for', surveyId)
  
  // Whitelist of keys to capture (avoid auth tokens, sensitive data)
  const keysToCapture = [
    'firmographics_data', 'general_benefits_data', 'current_support_data',
    'cross_dimensional_data', 'employee-impact-assessment_data',
    ...Array.from({ length: 13 }, (_, i) => `dimension${i + 1}_data`),
    'auth_completed', 'firmographics_complete', 'general_benefits_complete',
    'current_support_complete', 'cross_dimensional_complete', 'employee-impact-assessment_complete',
    ...Array.from({ length: 13 }, (_, i) => `dimension${i + 1}_complete`),
    'survey_id', 'app_id', 'assessment_version', 'company_name', 'login_company_name',
    'auth_email', 'login_email', 'login_first_name', 'login_last_name', 'login_title'
  ]
  
  const localStorageData: Record<string, any> = {}
  keysToCapture.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      localStorageData[key] = value
    }
  })
  
  try {
    const response = await fetch('/.netlify/functions/recovery-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        survey_id: surveyId,
        captured_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        localStorage_data: localStorageData
      })
    })
    
    if (response.ok) {
      sessionStorage.setItem(captureKey, '1')
      console.log('✅ RECOVERY MODE: localStorage captured successfully')
    } else {
      console.error('❌ RECOVERY MODE: Capture failed', await response.text())
    }
  } catch (e) {
    console.error('❌ RECOVERY MODE: Capture error', e)
  }
}

// ============================================
// ID KEY HELPER (used for all namespacing)
// ============================================

function getIdKey(): string {
  const surveyId = localStorage.getItem('survey_id') || '';
  const appId = localStorage.getItem('app_id') || '';
  // Fallback chain: survey_id → app_id → 'unknown'
  return surveyId || appId || 'unknown';
}

// ============================================
// VERSION TRACKING (namespaced by idKey)
// ============================================

function isKnownIdKey(idKey: string): boolean {
  return !!idKey && idKey !== 'unknown';
}

function getStoredVersion(): number {
  const idKey = getIdKey();
  
  // If we don't know the id yet, ONLY read legacy (avoid poisoning with *_unknown)
  if (!isKnownIdKey(idKey)) {
    const legacy = localStorage.getItem('assessment_version');
    return legacy ? Number(legacy) : 0;
  }
  
  // Try namespaced key first, fall back to legacy
  let stored = localStorage.getItem(`assessment_version_${idKey}`);
  if (!stored) {
    // Migration: check legacy key
    stored = localStorage.getItem('assessment_version');
    if (stored) {
      // Migrate to namespaced
      localStorage.setItem(`assessment_version_${idKey}`, stored);
      console.log(`🔄 Migrated assessment_version to namespaced key for ${idKey}`);
    }
  }
  return stored ? Number(stored) : 0;
}

function setStoredVersion(version: number): void {
  const idKey = getIdKey();
  // Always keep legacy during transition
  localStorage.setItem('assessment_version', String(version));
  // Only set namespaced if we know idKey (avoid *_unknown)
  if (isKnownIdKey(idKey)) {
    localStorage.setItem(`assessment_version_${idKey}`, String(version));
  }
}

// ============================================
// HYDRATION GUARD (prevents false dirty during DB→localStorage writes)
// ============================================

export function startHydration(): void {
  sessionStorage.setItem('ls_hydrating', '1');
}

export function endHydration(): void {
  sessionStorage.removeItem('ls_hydrating');
}

function isHydrating(): boolean {
  return sessionStorage.getItem('ls_hydrating') === '1';
}

// ============================================
// CONFLICT STATE (namespaced by survey/app ID with TTL auto-heal)
// ============================================

const CONFLICT_TTL_MS = 5 * 60 * 1000;  // 5 minutes TTL for conflict flags

function safeIdKey(): string {
  const idKey = getIdKey();
  return isKnownIdKey(idKey) ? idKey : 'legacy';
}

function getConflictKey(): string {
  const idKey = safeIdKey();
  return idKey === 'legacy' ? 'version_conflict' : `version_conflict_${idKey}`;
}

function getDirtyKey(): string {
  const idKey = safeIdKey();
  return idKey === 'legacy' ? 'dirty' : `dirty_${idKey}`;
}

// Mark local data as dirty (unsynced changes exist)
export function markDirty(reason?: string): void {
  const data = JSON.stringify({ ts: Date.now(), reason: reason || 'user_edit' })
  const key = getDirtyKey()
  localStorage.setItem(key, data)

  // Migration safety: always also mark legacy 'dirty'
  // (prevents edge cases when idKey becomes known mid-session)
  if (key !== 'dirty') {
    localStorage.setItem('dirty', data)
  }
}

// Clear dirty flag (after successful sync)
export function clearDirty(): void {
  localStorage.removeItem(getDirtyKey());
  localStorage.removeItem('dirty'); // migration safety
}

// Check if there are unsynced local changes
export function isDirty(): boolean {
  const data = localStorage.getItem(getDirtyKey()) || localStorage.getItem('dirty');
  if (!data) return false;
  if (data === '1') return true;
  try {
    const parsed = JSON.parse(data);
    return !!parsed.ts;
  } catch {
    return data === '1';
  }
}

function setConflictFlag(): void {
  const key = getConflictKey()
  const conflictData = JSON.stringify({ ts: Date.now(), id: getIdKey() })

  sessionStorage.setItem(key, conflictData)

  // Always set legacy flag for any UI that reads it directly
  sessionStorage.setItem('version_conflict', '1')

  window.dispatchEvent(new CustomEvent('sync-conflict', {
    detail: { message: 'A newer version exists on the server' }
  }))
}

function clearConflictFlag(): void {
  const key = getConflictKey();
  sessionStorage.removeItem(key);
  // Also clear legacy non-namespaced flag if exists
  sessionStorage.removeItem('version_conflict');
}

// Async conflict resolution - verifies DB version before clearing
// Call this from UI "Reload from server" button
export async function resolveConflictFromServer(): Promise<boolean> {
  const surveyId = localStorage.getItem('survey_id') || '';
  const appId = localStorage.getItem('app_id') || '';
  
  if (!surveyId && !appId) {
    console.error('[resolveConflict] No survey_id or app_id');
    return false;
  }
  
  try {
    // Fetch current DB version
    const matchField = surveyId ? 'survey_id' : 'app_id';
    const matchValue = surveyId || appId;
    
    const { data, error } = await supabase
      .from('assessments')
      .select('version')
      .eq(matchField, matchValue)
      .single();
    
    if (error || !data) {
      console.error('[resolveConflict] Failed to fetch DB version:', error);
      return false;
    }
    
    const dbVersion = data.version || 1;
    
    // Update local version to match DB
    setStoredVersion(dbVersion);
    
    // Clear dirty flag (discarding local changes)
    clearDirty();
    
    // Clear conflict flag
    clearConflictFlag();
    
    console.log(`✅ [resolveConflict] Resolved - local version set to ${dbVersion}, dirty cleared`);
    
    // Dispatch event for UI to react
    window.dispatchEvent(new CustomEvent('sync-conflict-resolved'));
    
    return true;
  } catch (e) {
    console.error('[resolveConflict] Error:', e);
    return false;
  }
}

export function hasConflict(): boolean {
  const key = getConflictKey();
  const conflictData = sessionStorage.getItem(key);
  
  // Also check legacy non-namespaced flag
  const legacyConflict = sessionStorage.getItem('version_conflict') === '1';
  
  if (!conflictData && !legacyConflict) {
    return false;
  }
  
  // Check TTL - but DON'T auto-heal if there are dirty (unsynced) changes
  if (conflictData) {
    try {
      const parsed = JSON.parse(conflictData);
      if (Date.now() - parsed.ts > CONFLICT_TTL_MS) {
        // Only auto-heal if no dirty changes - prevents pushing stale data
        if (isDirty()) {
          console.log('⚠️ AUTO-HEAL: Conflict expired but dirty changes exist - keeping conflict');
          return true;
        }
        console.log('🔄 AUTO-HEAL: Conflict flag expired, clearing...');
        clearConflictFlag();
        return false;
      }
    } catch {
      // Invalid data, clear it (but only if not dirty)
      if (!isDirty()) {
        clearConflictFlag();
        return false;
      }
    }
  }
  
  // Legacy flag without TTL - clear it after first check to migrate (if not dirty)
  if (legacyConflict && !conflictData) {
    if (!isDirty()) {
      console.log('🔄 AUTO-HEAL: Clearing legacy conflict flag');
      sessionStorage.removeItem('version_conflict');
      return false;
    }
  }
  
  return true;
}

// ============================================
// RESCUE CHECK
// ============================================

function isRescueDone(): boolean {
  return sessionStorage.getItem('rescue_done') === '1'
}

function isRescueReadOnly(): boolean {
  return sessionStorage.getItem('rescue_readonly') === '1'
}

// ============================================
// DATA COLLECTION
// ============================================

function collectAllSurveyData(): { data: Record<string, any>, hasData: boolean } {
  const updateData: Record<string, any> = {}
  
  const dataKeys = [
    'firmographics_data', 'general_benefits_data', 'current_support_data',
    'cross_dimensional_data', 'employee-impact-assessment_data',
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
      } catch (e) {}
    }
  })
  
  Object.entries(completeKeyMap).forEach(([localKey, dbKey]) => {
    const value = localStorage.getItem(localKey)
    if (value === 'true') {
      updateData[dbKey] = true
      itemCount++
    }
  })
  
  // ============================================
  // EXTRACT COMPANY NAME FROM FIRMOGRAPHICS
  // ============================================
  if (updateData.firmographics_data?.companyName) {
    updateData.company_name = updateData.firmographics_data.companyName
  } else {
    // Fallback: check localStorage directly
    const companyName = localStorage.getItem('login_company_name') || localStorage.getItem('company_name')
    if (companyName) {
      updateData.company_name = companyName
    }
  }
  
  // Also extract email if available
  const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email')
  if (email) {
    updateData.email = email.toLowerCase().trim()
  }
  
  // ============================================
  // PAYMENT DATA
  // ============================================
  if (localStorage.getItem('payment_completed') === 'true') {
    updateData.payment_completed = true
  }
  const paymentMethod = localStorage.getItem('payment_method')
  if (paymentMethod) {
    updateData.payment_method = paymentMethod
  }
  const paymentDate = localStorage.getItem('payment_date')
  if (paymentDate) {
    updateData.payment_date = paymentDate
  }
  
  // ============================================
  // FIRST NAME, LAST NAME, TITLE
  // ============================================
  const firstName = localStorage.getItem('login_first_name')
  const lastName = localStorage.getItem('login_last_name')
  const title = localStorage.getItem('login_title')
  
  // These go into firmographics_data if it exists, or we add them
  if (firstName || lastName || title) {
    if (!updateData.firmographics_data) {
      updateData.firmographics_data = {}
    }
    if (firstName) updateData.firmographics_data.firstName = firstName
    if (lastName) updateData.firmographics_data.lastName = lastName
    if (title) updateData.firmographics_data.title = title
  }
  
  return { data: updateData, hasData: itemCount > 0 }
}

// ============================================
// STABLE HASH FOR CHANGE DETECTION
// ============================================

let lastSyncedDataHash: string = ''
let pendingDataHash: string = ''  // Track hash being synced

function getStableDataHash(data: Record<string, any>): string {
  return stableStringify(data, { dropNull: true })
}

function hasDataChanged(newData: Record<string, any>): boolean {
  const newHash = getStableDataHash(newData)
  if (newHash === lastSyncedDataHash) {
    console.log('⏭️ AUTO-SYNC: Skipping - no data changes since last successful sync')
    return false
  }
  // Store pending hash - will be committed on successful sync
  pendingDataHash = newHash
  return true
}

function commitSyncedHash(): void {
  if (pendingDataHash) {
    lastSyncedDataHash = pendingDataHash
    pendingDataHash = ''
  }
}

// ============================================
// FETCH VERSION FROM DB (for missing version case)
// ============================================

async function fetchCurrentVersionFromDB(surveyId: string, userId?: string): Promise<number | null> {
  try {
    let query = supabase.from('assessments').select('version')
    
    if (userId) {
      const { data } = await query.eq('user_id', userId).single()
      if (data?.version) return data.version
    }
    
    if (surveyId) {
      const { data } = await supabase.from('assessments').select('version').eq('survey_id', surveyId).single()
      if (data?.version) return data.version
      
      const normalized = surveyId.replace(/-/g, '').toUpperCase()
      const { data: appData } = await supabase.from('assessments').select('version').eq('app_id', normalized).single()
      if (appData?.version) return appData.version
    }
    
    return null
  } catch {
    return null
  }
}

// ============================================
// NETLIFY SYNC
// ============================================

interface SyncResponse {
  success: boolean
  rowsAffected?: number
  newVersion?: number
  matchedVia?: string
  snapshotHash?: string
  error?: string
  missingExpected?: boolean
  currentVersion?: number
  conflict?: boolean
  actualVersion?: number
  expectedVersion?: number
}

async function syncViaNetlifyFunction(
  userId: string,
  data: Record<string, any>,
  accessToken: string,
  userType: 'regular' | 'fp' | 'compd' = 'regular',
  surveyId?: string,
  retryCount: number = 0
): Promise<SyncResponse> {
  // Prevent infinite retry loops
  const MAX_RETRIES = 2;
  
  try {
    const clientId = getOrCreateTabId('sync_client_id')
    let expectedVersion = getStoredVersion()
    
    // If no stored version, fetch from DB first
    if (!expectedVersion || expectedVersion <= 0) {
      console.log('[AUTO-SYNC] No stored version, fetching from DB...')
      const dbVersion = await fetchCurrentVersionFromDB(surveyId || '', userId)
      if (dbVersion) {
        expectedVersion = dbVersion
        setStoredVersion(dbVersion)
        console.log('[AUTO-SYNC] Fetched version from DB:', dbVersion)
      }
    }
    
    // If still no version, we have a problem - but let server handle it
    if (!expectedVersion || expectedVersion <= 0) {
      console.warn('[AUTO-SYNC] No version available - server will reject')
    }
    
    const payload: Record<string, any> = {
      user_id: userId,
      data,
      userType,
      accessToken,
      source: 'autosync',
      client_id: clientId,
      expectedVersion: expectedVersion > 0 ? expectedVersion : undefined
    }
    
    if (surveyId) {
      payload.survey_id = surveyId
      payload.fallbackSurveyId = surveyId
      payload.fallbackAppId = surveyId
    }
    
    console.log('[AUTO-SYNC] Sending:', {
      userType,
      survey_id: surveyId,
      expectedVersion,
      dataFields: Object.keys(data).length
    })
    
    const response = await fetch('/.netlify/functions/sync-assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken ? `Bearer ${accessToken}` : ''
      },
      body: JSON.stringify(payload)
    })
    
    const result: SyncResponse = await response.json()
    
    // Handle 400 - missing expectedVersion
    if (response.status === 400 && result.missingExpected) {
      console.warn('⚠️ AUTO-SYNC: Missing expectedVersion, fetching from DB...')
      if (result.currentVersion) {
        setStoredVersion(result.currentVersion)
        // Retry once with correct version
        return syncViaNetlifyFunction(userId, data, accessToken, userType, surveyId)
      }
      return { success: false, error: 'Could not determine version' }
    }
    
    // Handle 409 - version conflict
    if (response.status === 409) {
      console.error('❌ AUTO-SYNC: VERSION CONFLICT!')
      console.error('   Expected:', result.expectedVersion)
      console.error('   Actual:', result.actualVersion)
      
      // CRITICAL: Update localStorage to the ACTUAL version from DB
      // This way, next sync attempt uses the correct version
      if (result.actualVersion) {
        setStoredVersion(result.actualVersion)
        console.log('🔄 AUTO-SYNC: Updated localStorage version to:', result.actualVersion)
        
        // Retry with correct version (but limit retries to prevent infinite loop)
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 AUTO-SYNC: Retrying with correct version (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
          return syncViaNetlifyFunction(userId, data, accessToken, userType, surveyId, retryCount + 1)
        }
      }
      
      // Only set conflict flag if we can't auto-recover after retries
      console.error('❌ AUTO-SYNC: Max retries exceeded, setting conflict flag')
      setConflictFlag()
      return { success: false, error: 'Version conflict', conflict: true }
    }
    
    if (!response.ok) {
      console.error('❌ AUTO-SYNC: Error:', result.error)
      return { success: false, error: result.error }
    }
    
    if (result.rowsAffected === 0) {
      console.warn('⚠️ AUTO-SYNC: 0 rows affected')
      return { success: false, rowsAffected: 0, error: 'No rows updated' }
    }
    
    // SUCCESS - store new version, clear conflict and dirty flag
    // Handle case where newVersion might be missing
    if (result.success !== false && (result.rowsAffected || 0) > 0) {
      const newVersion = result.newVersion ?? result.actualVersion ?? (expectedVersion ? expectedVersion + 1 : undefined)
      if (newVersion) {
        setStoredVersion(newVersion)
      }
      clearConflictFlag()
      clearDirty()  // Local changes are now synced
      commitSyncedHash()  // Mark this data as successfully synced
      console.log('✅ AUTO-SYNC: Success, new version:', newVersion || 'unknown')
    }
    
    return result
    
  } catch (error) {
    console.error('❌ AUTO-SYNC: Exception:', error)
    return { success: false, error: String(error) }
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
// SYNC BY USER TYPE
// ============================================

async function syncCompdUserToSupabase(surveyId: string): Promise<boolean> {
  const normalized = surveyId?.replace(/-/g, '').toUpperCase() || ''
  console.log('🎫 AUTO-SYNC: Syncing comp\'d user:', normalized)
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData || !hasDataChanged(updateData)) {
    return true
  }
  
  const result = await syncViaNetlifyFunction('', updateData, '', 'compd', normalized)
  return result.success && (result.rowsAffected || 0) > 0
}

async function syncFPToSupabase(surveyId: string): Promise<boolean> {
  console.log('🏢 AUTO-SYNC: Syncing FP:', surveyId)
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData || !hasDataChanged(updateData)) {
    return true
  }
  
  const result = await syncViaNetlifyFunction('', updateData, '', 'fp', surveyId)
  return result.success && (result.rowsAffected || 0) > 0
}

async function syncRegularUserToSupabase(): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session
  
  const surveyId = localStorage.getItem('survey_id') || ''
  
  // ============================================
  // FIX: If no session but have survey_id, sync via survey_id
  // This handles returning users who logged in with email + survey_id
  // ============================================
  if (!session?.user) {
    if (surveyId) {
      console.log('👤 AUTO-SYNC: No session, using survey_id fallback:', surveyId)
      
      const { data: updateData, hasData } = collectAllSurveyData()
      
      if (!hasData || !hasDataChanged(updateData)) {
        return true
      }
      
      // Use 'compd' type which syncs by app_id/survey_id
      const result = await syncViaNetlifyFunction('', updateData, '', 'compd', surveyId)
      return result.success && (result.rowsAffected || 0) > 0
    }
    console.log('⏸️ AUTO-SYNC: No session and no survey_id - skipping')
    return true
  }
  
  const userId = session.user.id
  const accessToken = session.access_token
  
  console.log('👤 AUTO-SYNC: Syncing regular user...')
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData || !hasDataChanged(updateData)) {
    return true
  }
  
  const result = await syncViaNetlifyFunction(
    userId,
    updateData,
    accessToken,
    'regular',
    surveyId
  )
  
  return result.success && (result.rowsAffected || 0) > 0
}

// ============================================
// MAIN SYNC
// ============================================

async function syncToSupabase(): Promise<boolean> {
  const surveyId = localStorage.getItem('survey_id') || ''
  
  // RECOVERY MODE: Capture localStorage before any sync (for data loss incidents)
  await captureLocalStorageForRecovery(surveyId)
  
  // Don't sync if there's an unresolved conflict
  if (hasConflict()) {
    console.log('⏸️ AUTO-SYNC: BLOCKED - Unresolved version conflict')
    return false
  }
  
  // RESCUE GATE CHECK
  if (DB_FIRST_SURVEY_IDS.includes(surveyId)) {
    if (!isRescueDone()) {
      console.log('⏸️ AUTO-SYNC: BLOCKED - Rescue not complete')
      return true
    }
    if (isRescueReadOnly()) {
      console.log('⏸️ AUTO-SYNC: BLOCKED - Read-only tab')
      return true
    }
  }
  
  console.log('🔄 AUTO-SYNC: Starting... Survey ID:', surveyId || 'none')
  
  if (isCompdUser(surveyId)) {
    return await syncCompdUserToSupabase(surveyId)
  }
  
  try {
    const { isSharedFP, saveSharedFPData } = await import('./fp-shared-storage')
    if (isSharedFP(surveyId)) {
      const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email')
      await saveSharedFPData(surveyId, email || undefined)
      return true
    }
  } catch (e) {}
  
  const isFP = await checkIsFoundingPartner(surveyId)
  if (isFP) {
    return await syncFPToSupabase(surveyId)
  }
  
  return await syncRegularUserToSupabase()
}

// ============================================
// EXPORTS
// ============================================

export async function forceSyncNow(): Promise<boolean> {
  console.log('⚡ FORCE SYNC TRIGGERED')
  return await syncToSupabase()
}

// ============================================
// COMPONENT
// ============================================

export default function AutoDataSync() {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  const syncInProgress = useRef(false)
  const initialSyncDone = useRef(false)
  
  // Whitelist of keys that actually get synced - prevents dirty getting stuck on non-survey keys
  const SYNC_KEYS = new Set([
    'firmographics_data', 'general_benefits_data', 'current_support_data', 
    'cross_dimensional_data', 'employee-impact-assessment_data',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`),
    'auth_completed', 'firmographics_complete', 'general_benefits_complete', 
    'current_support_complete', 'cross_dimensional_complete', 'employee-impact-assessment_complete',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
  ])
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doSync = useCallback(async (reason: string) => {
    if (syncInProgress.current) return
    if (hasConflict()) {
      console.log('⏸️ AUTO-SYNC: Skipping - conflict unresolved')
      return
    }
    
    // Only sync if there are dirty changes (prevents unnecessary version bumps)
    if (!isDirty()) {
      console.log('⏭️ AUTO-SYNC: Skipping - no dirty changes')
      return
    }
    
    // Pre-check: if data hash hasn't actually changed, clear dirty and skip
    // This handles the case where user toggles a value then toggles it back
    const { data: currentData, hasData } = collectAllSurveyData()
    if (hasData) {
      const currentHash = getStableDataHash(currentData)
      if (currentHash === lastSyncedDataHash) {
        console.log('⏭️ AUTO-SYNC: Data unchanged from last sync, clearing dirty')
        clearDirty()
        return
      }
    }
    
    syncInProgress.current = true
    console.log(`🔄 AUTO-SYNC: ${reason}`)
    
    try {
      await syncToSupabase()
    } finally {
      syncInProgress.current = false
    }
  }, [])
  
  // RECOVERY CAPTURE ON MOUNT - runs immediately for recovery mode surveys
  // This is INDEPENDENT of sync - captures localStorage even if no edits/dirty
  useEffect(() => {
    const surveyId = localStorage.getItem('survey_id') || ''
    if (isRecoveryModeSurvey(surveyId)) {
      console.log('🔴 RECOVERY MODE: Capturing on mount for', surveyId)
      captureLocalStorageForRecovery(surveyId).catch(() => {})
    }
  }, [])
  
  // Initial sync with delay - only if dirty
  useEffect(() => {
    if (!initialSyncDone.current) {
      initialSyncDone.current = true
      setTimeout(() => {
        if (isDirty()) {
          doSync('Initial page load')
        }
      }, 3000)
    }
  }, [doSync])
  
  // Route change sync - only if dirty
  useEffect(() => {
    if (pathname !== lastPath.current) {
      const prevPath = lastPath.current
      lastPath.current = pathname
      if (prevPath !== '' && isDirty()) {
        doSync(`Route: ${prevPath} → ${pathname}`)
      }
    }
  }, [pathname, doSync])
  
  // Intercept localStorage writes - DUAL PATCH (prototype + instance)
  // Some browsers route localStorage.setItem directly, bypassing Storage.prototype
  useEffect(() => {
    // Prevent double-patching
    if ((window as any).__LS_PATCHED) {
      console.log('⚠️ localStorage already patched, skipping');
      return;
    }
    (window as any).__LS_PATCHED = true;
    
    let syncTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const scheduleSync = (key: string) => {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => doSync(`localStorage write: ${key}`), 500);
    };
    
    // Wrap function to add dirty tracking
    const wrapSetItem = (originalFn: (this: Storage, key: string, value: string) => void, source: string) => {
      return function (this: Storage, key: string, value: string) {
        // Mark dirty BEFORE attempting storage write (in case setItem throws)
        if (!isHydrating() && SYNC_KEYS.has(key)) {
          markDirty(`localStorage write (${source}): ${key}`);
          scheduleSync(key);
        }
        try {
          // IMPORTANT: call with the actual storage instance as `this`
          return originalFn.call(this, key, value);
        } catch (e) {
          console.error(`❌ localStorage.setItem failed (${source}) for key=${key}`, e);
          // keep dirty flag; do not throw
          return;
        }
      };
    };
    
    // Store originals (unbound!)
    const originalProtoSetItem = Storage.prototype.setItem;
    const originalInstanceSetItem = localStorage.setItem; // may be native/bound in some browsers
    
    // Wrap patching in try/catch - some browsers restrict modifying localStorage.setItem
    try {
      // 1) Patch Storage.prototype.setItem (catches Storage.prototype.setItem.call(localStorage,...))
      Storage.prototype.setItem = wrapSetItem(originalProtoSetItem, 'proto');
      
      // 2) Patch localStorage.setItem directly (catches direct localStorage.setItem(...))
      localStorage.setItem = wrapSetItem(function (this: Storage, key: string, value: string) {
        return originalInstanceSetItem.call(this, key, value);
      }, 'instance') as any;
      
      console.log('✅ Dual localStorage patch installed (proto + instance)');
    } catch (e) {
      console.error('❌ Failed to patch localStorage.setItem (browser restriction)', e);
    }
    
    return () => {
      // Restore originals
      try {
        Storage.prototype.setItem = originalProtoSetItem;
        localStorage.setItem = originalInstanceSetItem as any;
      } catch (e) {
        // ignore restore errors
      }
      (window as any).__LS_PATCHED = false;
      if (syncTimeout) clearTimeout(syncTimeout);
    };
  }, [doSync]);
  
  // Periodic sync - only if dirty
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasConflict() && isDirty()) {
        doSync('Periodic (15s)')
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [doSync])
  
  // Visibility change - only if dirty
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !hasConflict() && isDirty()) {
        doSync('Tab became visible')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [doSync])
  
  // Before unload - WARNING ONLY, don't rely on async sync during unload
  // Before unload: DO NOT attempt async sync (unreliable). Warn only.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasConflict() && isDirty()) {
        // Show browser warning prompt - do NOT try to sync (it's unreliable)
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  return null
}

/**
 * AUTO DATA SYNC v5 - Per ChatGPT final review
 * 
 * FIXES APPLIED:
 * 1. Namespaced assessment_version by idKey (prevents cross-survey conflicts)
 * 2. Hydration guard for localStorage patch (prevents false dirty on DB→local writes)
 * 3. TTL auto-heal verifies DB version before clearing
 * 4. Patch guard to prevent double-patching
 *
 * CRITICAL HOTFIX (Feb 9):
 * - Fix "dirty key drift" where dirty was written under dirty_unknown before survey_id/app_id existed,
 *   then later checks looked under dirty_<realId> and skipped syncing entirely.
 *   Now we always write a global 'dirty' key + a namespaced dirty key when available.
 * 
 * + EXPORTED isDirty() for SyncStatusIndicator
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

function isCompdUser(surveyId: string): boolean {
  const normalized = surveyId?.replace(/-/g, '').toUpperCase() || ''
  return COMPD_USER_IDS.some(id => id.replace(/-/g, '').toUpperCase() === normalized)
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

function getVersionKey(): string {
  return `assessment_version_${getIdKey()}`;
}

function getStoredVersion(): number {
  const idKey = getIdKey();
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
  localStorage.setItem(`assessment_version_${idKey}`, String(version));
  // Also set legacy for backwards compatibility during transition
  localStorage.setItem('assessment_version', String(version));
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

function getConflictKey(): string {
  return `version_conflict_${getIdKey()}`;
}

/**
 * CRITICAL HOTFIX:
 * Dirty must be stable even when survey_id/app_id isn't available yet.
 * We use:
 * - global key: 'dirty' (always set)
 * - namespaced key: `dirty_${idKey}` when idKey is known
 * - legacy: 'dirty_unknown' (cleared for safety)
 */
function getDirtyKey(): string {
  const idKey = getIdKey();
  // If we don't have a stable id yet, fall back to a global dirty key.
  return idKey && idKey !== 'unknown' ? `dirty_${idKey}` : 'dirty';
}

// Mark local data as dirty (unsynced changes exist)
export function markDirty(reason?: string): void {
  const data = JSON.stringify({ ts: Date.now(), reason: reason || 'user_edit' });

  // Always set a global dirty key so we never lose dirty state when idKey changes mid-session.
  localStorage.setItem('dirty', data);

  // Also set the namespaced key when available.
  const idKey = getIdKey();
  if (idKey && idKey !== 'unknown') {
    localStorage.setItem(`dirty_${idKey}`, data);
  } else {
    // Maintain legacy bad-state key so older sessions can still be detected/cleared.
    localStorage.setItem('dirty_unknown', data);
  }
}

// Clear dirty flag (after successful sync)
export function clearDirty(): void {
  // Clear both global + namespaced (covers transitions)
  localStorage.removeItem('dirty');
  localStorage.removeItem('dirty_unknown');
  localStorage.removeItem(getDirtyKey());
  localStorage.removeItem(`dirty_${getIdKey()}`);
}

// Check if there are unsynced local changes - EXPORTED for SyncStatusIndicator
export function isDirty(): boolean {
  // Global dirty key wins (covers idKey drift)
  const global = localStorage.getItem('dirty');
  if (global) return true;

  // Namespaced dirty (current idKey)
  const data = localStorage.getItem(`dirty_${getIdKey()}`) || localStorage.getItem(getDirtyKey());
  if (!data) {
    // Legacy bad-state key
    return !!localStorage.getItem('dirty_unknown');
  }

  // Handle both old format ('1') and new format (JSON)
  if (data === '1') return true;
  try {
    const parsed = JSON.parse(data);
    return !!parsed.ts;
  } catch {
    return data === '1';
  }
}

function setConflictFlag(): void {
  const key = getConflictKey();
  const conflictData = JSON.stringify({
    ts: Date.now(),
    id: getIdKey()
  });
  sessionStorage.setItem(key, conflictData);
  // Dispatch event for UI to react
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

function hasDataChanged(newData: Record<string, any>): string | false {
  const newHash = getStableDataHash(newData)
  if (newHash === lastSyncedDataHash) {
    console.log('⏭️ AUTO-SYNC: Skipping - no data changes since last successful sync')
    return false
  }
  pendingDataHash = newHash
  return newHash
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
}

async function syncViaNetlifyFunction(
  userId: string,
  data: Record<string, any>,
  accessToken: string,
  userType: 'regular' | 'fp' | 'compd' = 'regular',
  surveyId?: string,
  retryCount: number = 0
): Promise<SyncResponse> {
  const MAX_RETRIES = 2;
  
  try {
    const clientId = getOrCreateTabId('sync_client_id')
    let expectedVersion = getStoredVersion()
    
    if (!expectedVersion || expectedVersion <= 0) {
      console.log('[AUTO-SYNC] No stored version, fetching from DB...')
      const dbVersion = await fetchCurrentVersionFromDB(surveyId || '', userId)
      if (dbVersion) {
        expectedVersion = dbVersion
        setStoredVersion(dbVersion)
        console.log('[AUTO-SYNC] Fetched version from DB:', dbVersion)
      }
    }
    
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
    
    if (response.status === 400 && result.missingExpected) {
      console.warn('⚠️ AUTO-SYNC: Missing expectedVersion, fetching from DB...')
      if (result.currentVersion) {
        setStoredVersion(result.currentVersion)
        return syncViaNetlifyFunction(userId, data, accessToken, userType, surveyId)
      }
      return { success: false, error: 'Could not determine version' }
    }
    
    if (response.status === 409) {
      console.error('❌ AUTO-SYNC: VERSION CONFLICT!')
      console.error('   Expected:', expectedVersion)
      console.error('   Actual:', result.actualVersion)
      
      if (result.actualVersion) {
        setStoredVersion(result.actualVersion)
        console.log('🔄 AUTO-SYNC: Updated localStorage version to:', result.actualVersion)
        
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 AUTO-SYNC: Retrying with correct version (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
          return syncViaNetlifyFunction(userId, data, accessToken, userType, surveyId, retryCount + 1)
        }
      }
      
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
    
    if (result.newVersion) {
      setStoredVersion(result.newVersion)
      clearConflictFlag()
      clearDirty()
      commitSyncedHash()
      console.log('✅ AUTO-SYNC: Success, new version:', result.newVersion)
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
  
  if (!hasData) {
    return true
  }
  
  const hash = hasDataChanged(updateData)
  if (!hash) return true
  
  const result = await syncViaNetlifyFunction('', updateData, '', 'compd', normalized)
  return result.success && (result.rowsAffected || 0) > 0
}

async function syncFPToSupabase(surveyId: string): Promise<boolean> {
  console.log('🏢 AUTO-SYNC: Syncing FP:', surveyId)
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData) {
    return true
  }
  
  const hash = hasDataChanged(updateData)
  if (!hash) return true
  
  const result = await syncViaNetlifyFunction('', updateData, '', 'fp', surveyId)
  return result.success && (result.rowsAffected || 0) > 0
}

async function syncRegularUserToSupabase(): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session
  
  const surveyId = localStorage.getItem('survey_id') || ''
  
  if (!session?.user) {
    if (surveyId) {
      console.log('👤 AUTO-SYNC: No session, using survey_id fallback:', surveyId)
      
      const { data: updateData, hasData } = collectAllSurveyData()
      
      if (!hasData) return true
      
      const hash = hasDataChanged(updateData)
      if (!hash) return true
      
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
  
  if (!hasData) return true
  
  const hash = hasDataChanged(updateData)
  if (!hash) return true
  
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
  
  if (hasConflict()) {
    console.log('⏸️ AUTO-SYNC: BLOCKED - Unresolved version conflict')
    return false
  }
  
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
  
  const doSync = useCallback(async (reason: string) => {
    if (syncInProgress.current) return
    if (hasConflict()) {
      console.log('⏸️ AUTO-SYNC: Skipping - conflict unresolved')
      return
    }
    
    if (!isDirty()) {
      console.log('⏭️ AUTO-SYNC: Skipping - no dirty changes')
      return
    }
    
    syncInProgress.current = true
    console.log(`🔄 AUTO-SYNC: ${reason}`)
    
    try {
      await syncToSupabase()
    } finally {
      syncInProgress.current = false
    }
  }, [])
  
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
  
  useEffect(() => {
    if (pathname !== lastPath.current) {
      const prevPath = lastPath.current
      lastPath.current = pathname
      if (prevPath !== '' && isDirty()) {
        doSync(`Route: ${prevPath} → ${pathname}`)
      }
    }
  }, [pathname, doSync])
  
  useEffect(() => {
    if ((window as any).__LS_PATCHED) {
      console.log('⚠️ localStorage already patched, skipping');
      return;
    }
    (window as any).__LS_PATCHED = true;
    
    const originalSetItem = localStorage.setItem.bind(localStorage)
    let syncTimeout: ReturnType<typeof setTimeout> | null = null
    
    localStorage.setItem = (key: string, value: string) => {
      originalSetItem(key, value)
      
      if (isHydrating()) {
        return;
      }
      
      if (SYNC_KEYS.has(key)) {
        markDirty(`localStorage write: ${key}`)
        
        if (syncTimeout) clearTimeout(syncTimeout)
        syncTimeout = setTimeout(() => doSync(`localStorage write: ${key}`), 500)
      }
    }
    
    return () => {
      localStorage.setItem = originalSetItem
      ;(window as any).__LS_PATCHED = false;
      if (syncTimeout) clearTimeout(syncTimeout)
    }
  }, [doSync])
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasConflict() && isDirty()) {
        doSync('Periodic (15s)')
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [doSync])
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !hasConflict() && isDirty()) {
        doSync('Tab became visible')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [doSync])
  
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!hasConflict()) {
        syncToSupabase()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  return null
}

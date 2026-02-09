/**
 * AUTO DATA SYNC v7 - With Recovery Mode + Safety Fixes + TS Fixes
 * 
 * FIXES APPLIED:
 * 1. Namespaced assessment_version by idKey (prevents cross-survey conflicts)
 * 2. Hydration guard for localStorage patch (prevents false dirty on DB→local writes)
 * 3. TTL auto-heal clears expired conflict flags (only if not dirty)
 * 4. Patch guard to prevent double-patching
 * 5. 409 conflict: NO auto-retry (prevents overwriting newer server data)
 * 6. forceSyncNow: gated by isDirty() and hasConflict()
 * 7. beforeunload: gated by isDirty() and hasConflict()
 * 8. Recovery mode for specific surveys (captures localStorage before sync)
 * 9. Normalized getIdKey() to prevent namespace drift (FP-421967 vs FP421967)
 * 10. Removed dead retryCount/MAX_RETRIES code
 * 11. Completion flags accept '1' as well as 'true' (legacy compatibility)
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

// Normalize IDs to prevent namespace drift (FP-421967 vs FP421967 vs fp-421967)
function normalizeId(id: string): string {
  return (id || '').replace(/-/g, '').trim().toUpperCase();
}

function getIdKey(): string {
  const surveyId = normalizeId(localStorage.getItem('survey_id') || '');
  const appId = normalizeId(localStorage.getItem('app_id') || '');
  // Fallback chain: survey_id → app_id → 'UNKNOWN'
  return surveyId || appId || 'UNKNOWN';
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

function getDirtyKey(): string {
  return `dirty_${getIdKey()}`;
}

// Mark local data as dirty (unsynced changes exist)
export function markDirty(reason?: string): void {
  const data = JSON.stringify({ ts: Date.now(), reason: reason || 'user_edit' });
  localStorage.setItem(getDirtyKey(), data);
}

// Clear dirty flag (after successful sync)
export function clearDirty(): void {
  localStorage.removeItem(getDirtyKey());
}

// Check if there are unsynced local changes
function isDirty(): boolean {
  const data = localStorage.getItem(getDirtyKey());
  if (!data) return false;
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
    // Accept both 'true' and '1' as complete (legacy compatibility)
    if (value === 'true' || value === '1') {
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
}

async function syncViaNetlifyFunction(
  userId: string,
  data: Record<string, any>,
  accessToken: string,
  userType: 'regular' | 'fp' | 'compd' = 'regular',
  surveyId?: string
): Promise<SyncResponse> {
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
    // CRITICAL: Do NOT retry - this can overwrite newer server data
    // Just capture the actual version, set conflict flag, and STOP
    if (response.status === 409) {
      console.error('❌ AUTO-SYNC: VERSION CONFLICT!')
      console.error('   Expected (local):', expectedVersion)
      console.error('   Actual (server):', result.actualVersion)
      
      // Store the actual DB version for reference (but don't retry!)
      if (result.actualVersion) {
        console.log('📝 AUTO-SYNC: DB version is:', result.actualVersion)
        // Do NOT call setStoredVersion here - that would enable retry to overwrite
      }
      
      // Set conflict flag - user must explicitly resolve
      setConflictFlag()
      console.error('🛑 AUTO-SYNC: Conflict flag set - sync blocked until resolved')
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
    if (result.newVersion) {
      setStoredVersion(result.newVersion)
      clearConflictFlag()
      clearDirty()  // Local changes are now synced
      commitSyncedHash()  // Mark this data as successfully synced
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
  
  // Don't sync if conflict exists
  if (hasConflict()) {
    console.log('⏸️ FORCE SYNC: Blocked - unresolved conflict')
    return false
  }
  
  // Don't sync if nothing changed
  if (!isDirty()) {
    console.log('⏭️ FORCE SYNC: Skipped - no dirty changes')
    return true
  }
  
  return await syncToSupabase()
}

// ============================================
// RECOVERY MODE - Captures localStorage before any sync for specified surveys
// Uses pattern-based whitelist to avoid capturing auth tokens
// Sends to Netlify function (service role) to bypass RLS
// ============================================

const RECOVERY_MODE_SURVEYS = ['FP-421967'];

// Pattern-based whitelist for localStorage keys
function isRecoveryWhitelisted(key: string): boolean {
  // Dimension data and completion flags (1-13)
  if (/^dimension(1[0-3]|[1-9])_(data|complete)$/.test(key)) return true;
  
  // Other survey sections - handle both hyphen and underscore variants
  if (/^(firmographics|general_benefits|current_support|cross_dimensional)_(data|complete)$/.test(key)) return true;
  if (/^employee[-_]impact[-_]assessment_(data|complete)$/.test(key)) return true;
  // Also catch the DB-style key name
  if (/^employee_impact_(data|complete)$/.test(key)) return true;
  
  // Versioning and sync state
  if (key.startsWith('assessment_version')) return true;
  if (key.startsWith('dirty_')) return true;
  if (key.startsWith('version_conflict')) return true;
  
  // Identity keys needed for matching (but NOT auth tokens)
  if (['survey_id', 'app_id', 'company_name', 'login_company_name'].includes(key)) return true;
  
  // Auth completion flag (not the token)
  if (key === 'auth_completed') return true;
  
  // ============================================
  // INSURANCE KEYS - Maturity/Status/Override/Timestamps
  // ============================================
  
  // Maturity / status / eligibility
  if (key.startsWith('maturity_')) return true;
  if (key.startsWith('status_')) return true;
  if (key.startsWith('eligibility_')) return true;
  if (key.startsWith('opt_in')) return true;
  if (key.startsWith('company_status')) return true;
  if (key.startsWith('confirm_')) return true;
  if (key.startsWith('provisional_')) return true;
  
  // Notes / comments / rationales
  if (key.includes('_notes')) return true;
  if (key.includes('_comment')) return true;
  if (key.includes('_rationale')) return true;
  
  // Override / lock keys
  if (key.startsWith('override_')) return true;
  if (key.startsWith('lock_')) return true;
  if (key.startsWith('score_override')) return true;
  
  // Timestamps / provenance
  if (key.startsWith('last_saved_')) return true;
  if (key.startsWith('last_synced_')) return true;
  if (key === 'updated_at_local') return true;
  
  // Progress tracking
  if (key.includes('_progress')) return true;
  if (key === 'overall_progress') return true;
  if (key === 'last_section_visited') return true;
  
  // ============================================
  // EXPLICIT EXCLUSIONS - Auth tokens, Supabase internals
  // ============================================
  if (key.startsWith('sb-')) return false;
  if (key.includes('access_token') || key.includes('refresh_token')) return false;
  if (key.includes('supabase')) return false;
  
  return false;
}

async function runRecoveryMode(surveyId: string): Promise<void> {
  if (!RECOVERY_MODE_SURVEYS.includes(surveyId)) return;
  
  // Only run once per session
  const recoveryKey = `recovery_captured_${surveyId}`;
  if (sessionStorage.getItem(recoveryKey)) return;
  sessionStorage.setItem(recoveryKey, '1');
  
  console.log('🚨🚨🚨 RECOVERY MODE ACTIVATED FOR:', surveyId);
  
  // Collect ONLY whitelisted localStorage keys
  const recoveryData: Record<string, string> = {};
  const skippedKeys: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      if (isRecoveryWhitelisted(key)) {
        recoveryData[key] = localStorage.getItem(key) || '';
      } else {
        skippedKeys.push(key);
      }
    }
  }
  
  // Log to console for immediate visibility
  console.log('📦 RECOVERY MODE - Whitelisted localStorage data:');
  console.log(JSON.stringify(recoveryData, null, 2));
  console.log('📦 RECOVERY MODE - Skipped keys (not whitelisted):', skippedKeys);
  
  // Log what dimension data we found
  const dimensionKeys = Object.keys(recoveryData).filter(k => k.startsWith('dimension'));
  console.log('📦 RECOVERY MODE - Dimension keys found:', dimensionKeys);
  
  // Send to Netlify function (bypasses RLS via service role)
  try {
    // Get current auth token if available (for JWT verification)
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Include auth token if available for extra verification
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch('/.netlify/functions/recovery-capture', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        survey_id: surveyId,
        captured_at: new Date().toISOString(),
        localStorage_data: recoveryData,
        user_agent: navigator.userAgent
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ RECOVERY MODE - Data captured to server:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ RECOVERY MODE - Server returned:', response.status, errorText);
    }
  } catch (e) {
    console.error('❌ RECOVERY MODE - Network error, data is in console above:', e);
  }
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
    
    // Only sync if there are dirty changes (prevents unnecessary version bumps)
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
  
  // Initial sync with delay - only if dirty
  useEffect(() => {
    if (!initialSyncDone.current) {
      initialSyncDone.current = true
      
      const surveyId = localStorage.getItem('survey_id') || '';
      
      // 🚨 RECOVERY MODE - Await capture, then force sync
      if (RECOVERY_MODE_SURVEYS.includes(surveyId)) {
        (async () => {
          // Step 1: Capture localStorage FIRST
          await runRecoveryMode(surveyId);
          
          // Step 2: Force sync even if not dirty (but respect conflict flag)
          if (!hasConflict()) {
            console.log('🚨 RECOVERY MODE - Forcing sync regardless of dirty flag');
            await syncToSupabase();
            console.log('🚨 RECOVERY MODE - Forced sync complete');
          } else {
            console.log('🚨 RECOVERY MODE - Conflict exists, skipping forced sync (will use recovery-apply)');
          }
        })();
      } else {
        // Normal flow - only sync if dirty
        setTimeout(() => {
          if (isDirty()) {
            doSync('Initial page load')
          }
        }, 3000)
      }
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
  
  // Intercept localStorage writes - with hydration guard and patch-once protection
  useEffect(() => {
    // Prevent double-patching
    if ((window as any).__LS_PATCHED) {
      console.log('⚠️ localStorage already patched, skipping');
      return;
    }
    (window as any).__LS_PATCHED = true;
    
    const originalSetItem = localStorage.setItem.bind(localStorage)
    let syncTimeout: ReturnType<typeof setTimeout> | null = null
    
    localStorage.setItem = (key: string, value: string) => {
      originalSetItem(key, value)
      
      // Skip dirty tracking and sync during hydration (DB→localStorage writes)
      if (isHydrating()) {
        return;
      }
      
      // Only mark dirty for keys we actually sync (whitelist)
      if (SYNC_KEYS.has(key)) {
        // Mark as dirty - we have unsynced local changes
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
  
  // Before unload - only sync if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!hasConflict() && isDirty()) {
        syncToSupabase()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  return null
}

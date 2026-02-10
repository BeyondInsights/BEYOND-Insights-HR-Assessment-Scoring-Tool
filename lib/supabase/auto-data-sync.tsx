/**
 * AUTO DATA SYNC v5 - Stabilized
 *
 * Key fixes included:
 * - Dirty key drift fix: always sets global `dirty` + namespaced `dirty_<idKey>` when available
 * - Exported isDirty() for SyncStatusIndicator
 * - NO-OP GUARD for redundant writes (prev === value)
 * - beforeunload gated by isDirty()
 * - CRITICAL: patch Storage.prototype.setItem (NOT localStorage.setItem) so it works in browsers where
 *   localStorage.setItem is non-writable / non-configurable.
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

const COMPD_USER_IDS = ['CAC26010292641OB']
const DB_FIRST_SURVEY_IDS = ['CAC25120273411EF']

function isCompdUser(surveyId: string): boolean {
  const normalized = surveyId?.replace(/-/g, '').toUpperCase() || ''
  return COMPD_USER_IDS.some((id) => id.replace(/-/g, '').toUpperCase() === normalized)
}

// ============================================
// ID KEY HELPER (used for all namespacing)
// ============================================

function getIdKey(): string {
  const surveyId = localStorage.getItem('survey_id') || ''
  const appId = localStorage.getItem('app_id') || ''
  return surveyId || appId || 'unknown'
}

// ============================================
// VERSION TRACKING (namespaced by idKey)
// ============================================

function getStoredVersion(): number {
  const idKey = getIdKey()
  let stored = localStorage.getItem(`assessment_version_${idKey}`)
  if (!stored) {
    stored = localStorage.getItem('assessment_version')
    if (stored) {
      localStorage.setItem(`assessment_version_${idKey}`, stored)
      console.log(`🔄 Migrated assessment_version to namespaced key for ${idKey}`)
    }
  }
  return stored ? Number(stored) : 0
}

function setStoredVersion(version: number): void {
  const idKey = getIdKey()
  localStorage.setItem(`assessment_version_${idKey}`, String(version))
  localStorage.setItem('assessment_version', String(version))
}

// ============================================
// HYDRATION GUARD (prevents false dirty during DB→localStorage writes)
// ============================================

export function startHydration(): void {
  sessionStorage.setItem('ls_hydrating', '1')
}

export function endHydration(): void {
  sessionStorage.removeItem('ls_hydrating')
}

function isHydrating(): boolean {
  return sessionStorage.getItem('ls_hydrating') === '1'
}

// ============================================
// CONFLICT STATE
// ============================================

const CONFLICT_TTL_MS = 5 * 60 * 1000

function getConflictKey(): string {
  return `version_conflict_${getIdKey()}`
}

/**
 * Dirty keys:
 * - global key: 'dirty' (always set)
 * - namespaced key: `dirty_${idKey}` when idKey is known
 * - legacy: 'dirty_unknown'
 */
function getDirtyKey(): string {
  const idKey = getIdKey()
  return idKey && idKey !== 'unknown' ? `dirty_${idKey}` : 'dirty'
}

export function markDirty(reason?: string): void {
  const data = JSON.stringify({ ts: Date.now(), reason: reason || 'user_edit' })
  localStorage.setItem('dirty', data)

  const idKey = getIdKey()
  if (idKey && idKey !== 'unknown') {
    localStorage.setItem(`dirty_${idKey}`, data)
  } else {
    localStorage.setItem('dirty_unknown', data)
  }
}

export function clearDirty(): void {
  localStorage.removeItem('dirty')
  localStorage.removeItem('dirty_unknown')
  localStorage.removeItem(getDirtyKey())
  localStorage.removeItem(`dirty_${getIdKey()}`)
}

// EXPORTED for SyncStatusIndicator
export function isDirty(): boolean {
  const global = localStorage.getItem('dirty')
  if (global) return true

  const data = localStorage.getItem(`dirty_${getIdKey()}`) || localStorage.getItem(getDirtyKey())
  if (!data) return !!localStorage.getItem('dirty_unknown')

  if (data === '1') return true
  try {
    const parsed = JSON.parse(data)
    return !!parsed.ts
  } catch {
    return data === '1'
  }
}

function setConflictFlag(): void {
  const key = getConflictKey()
  const conflictData = JSON.stringify({ ts: Date.now(), id: getIdKey() })
  sessionStorage.setItem(key, conflictData)

  window.dispatchEvent(
    new CustomEvent('sync-conflict', { detail: { message: 'A newer version exists on the server' } })
  )
}

function clearConflictFlag(): void {
  sessionStorage.removeItem(getConflictKey())
  sessionStorage.removeItem('version_conflict')
}

export async function resolveConflictFromServer(): Promise<boolean> {
  const surveyId = localStorage.getItem('survey_id') || ''
  const appId = localStorage.getItem('app_id') || ''
  if (!surveyId && !appId) return false

  try {
    const matchField = surveyId ? 'survey_id' : 'app_id'
    const matchValue = surveyId || appId

    const { data, error } = await supabase
      .from('assessments')
      .select('version')
      .eq(matchField, matchValue)
      .single()

    if (error || !data) return false

    setStoredVersion(data.version || 1)
    clearDirty()
    clearConflictFlag()

    window.dispatchEvent(new CustomEvent('sync-conflict-resolved'))
    return true
  } catch {
    return false
  }
}

export function hasConflict(): boolean {
  const key = getConflictKey()
  const conflictData = sessionStorage.getItem(key)
  const legacyConflict = sessionStorage.getItem('version_conflict') === '1'

  if (!conflictData && !legacyConflict) return false

  if (conflictData) {
    try {
      const parsed = JSON.parse(conflictData)
      if (Date.now() - parsed.ts > CONFLICT_TTL_MS) {
        if (isDirty()) return true
        clearConflictFlag()
        return false
      }
    } catch {
      if (!isDirty()) {
        clearConflictFlag()
        return false
      }
    }
  }

  if (legacyConflict && !conflictData) {
    if (!isDirty()) {
      sessionStorage.removeItem('version_conflict')
      return false
    }
  }

  return true
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

function collectAllSurveyData(): { data: Record<string, any>; hasData: boolean } {
  const updateData: Record<string, any> = {}

  const dataKeys = [
    'firmographics_data',
    'general_benefits_data',
    'current_support_data',
    'cross_dimensional_data',
    'employee-impact-assessment_data',
    ...Array.from({ length: 13 }, (_, i) => `dimension${i + 1}_data`),
  ]

  const completeKeyMap: Record<string, string> = {
    firmographics_complete: 'firmographics_complete',
    auth_completed: 'auth_completed',
    general_benefits_complete: 'general_benefits_complete',
    current_support_complete: 'current_support_complete',
    cross_dimensional_complete: 'cross_dimensional_complete',
    'employee-impact-assessment_complete': 'employee_impact_complete',
  }

  for (let i = 1; i <= 13; i++) completeKeyMap[`dimension${i}_complete`] = `dimension${i}_complete`

  let itemCount = 0

  dataKeys.forEach((key) => {
    const value = localStorage.getItem(key)
    if (!value) return
    try {
      const parsed = JSON.parse(value)
      if (parsed && Object.keys(parsed).length > 0) {
        const dbKey = key === 'employee-impact-assessment_data' ? 'employee_impact_data' : key
        updateData[dbKey] = parsed
        itemCount++
      }
    } catch {}
  })

  Object.entries(completeKeyMap).forEach(([localKey, dbKey]) => {
    const value = localStorage.getItem(localKey)
    if (value === 'true') {
      updateData[dbKey] = true
      itemCount++
    }
  })

  if (updateData.firmographics_data?.companyName) {
    updateData.company_name = updateData.firmographics_data.companyName
  } else {
    const companyName = localStorage.getItem('login_company_name') || localStorage.getItem('company_name')
    if (companyName) updateData.company_name = companyName
  }

  const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email')
  if (email) updateData.email = email.toLowerCase().trim()

  return { data: updateData, hasData: itemCount > 0 }
}

// ============================================
// HASH FOR CHANGE DETECTION
// ============================================

let lastSyncedDataHash = ''
let pendingDataHash = ''

function getStableDataHash(data: Record<string, any>): string {
  return stableStringify(data, { dropNull: true })
}

function hasDataChanged(newData: Record<string, any>): string | false {
  const newHash = getStableDataHash(newData)
  if (newHash === lastSyncedDataHash) return false
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
  const MAX_RETRIES = 2

  try {
    const clientId = getOrCreateTabId('sync_client_id')
    let expectedVersion = getStoredVersion()

    if (!expectedVersion || expectedVersion <= 0) {
      const dbVersion = await fetchCurrentVersionFromDB(surveyId || '', userId)
      if (dbVersion) {
        expectedVersion = dbVersion
        setStoredVersion(dbVersion)
      }
    }

    const payload: Record<string, any> = {
      user_id: userId,
      data,
      userType,
      accessToken,
      source: 'autosync',
      client_id: clientId,
      expectedVersion: expectedVersion > 0 ? expectedVersion : undefined,
    }

    if (surveyId) {
      payload.survey_id = surveyId
      payload.fallbackSurveyId = surveyId
      payload.fallbackAppId = surveyId
    }

    const response = await fetch('/.netlify/functions/sync-assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken ? `Bearer ${accessToken}` : '',
      },
      body: JSON.stringify(payload),
    })

    const result: SyncResponse = await response.json()

    if (response.status === 400 && result.missingExpected) {
      if (result.currentVersion) {
        setStoredVersion(result.currentVersion)
        return syncViaNetlifyFunction(userId, data, accessToken, userType, surveyId)
      }
      return { success: false, error: 'Could not determine version' }
    }

    if (response.status === 409) {
      if (result.actualVersion) {
        setStoredVersion(result.actualVersion)
        if (retryCount < MAX_RETRIES) {
          return syncViaNetlifyFunction(userId, data, accessToken, userType, surveyId, retryCount + 1)
        }
      }
      setConflictFlag()
      return { success: false, error: 'Version conflict', conflict: true }
    }

    if (!response.ok) return { success: false, error: result.error }

    if (result.rowsAffected === 0) return { success: false, rowsAffected: 0, error: 'No rows updated' }

    if (result.newVersion) {
      setStoredVersion(result.newVersion)
      clearConflictFlag()
      clearDirty()
      commitSyncedHash()
    }

    return result
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

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

async function syncCompdUserToSupabase(surveyId: string): Promise<boolean> {
  const normalized = surveyId?.replace(/-/g, '').toUpperCase() || ''
  const { data: updateData, hasData } = collectAllSurveyData()
  if (!hasData) return true
  const hash = hasDataChanged(updateData)
  if (!hash) return true
  const result = await syncViaNetlifyFunction('', updateData, '', 'compd', normalized)
  return result.success && (result.rowsAffected || 0) > 0
}

async function syncFPToSupabase(surveyId: string): Promise<boolean> {
  const { data: updateData, hasData } = collectAllSurveyData()
  if (!hasData) return true
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
      const { data: updateData, hasData } = collectAllSurveyData()
      if (!hasData) return true
      const hash = hasDataChanged(updateData)
      if (!hash) return true
      const result = await syncViaNetlifyFunction('', updateData, '', 'compd', surveyId)
      return result.success && (result.rowsAffected || 0) > 0
    }
    return true
  }

  const userId = session.user.id
  const accessToken = session.access_token
  const { data: updateData, hasData } = collectAllSurveyData()
  if (!hasData) return true
  const hash = hasDataChanged(updateData)
  if (!hash) return true

  const result = await syncViaNetlifyFunction(userId, updateData, accessToken, 'regular', surveyId)
  return result.success && (result.rowsAffected || 0) > 0
}

async function syncToSupabase(): Promise<boolean> {
  const surveyId = localStorage.getItem('survey_id') || ''
  if (hasConflict()) return false

  if (DB_FIRST_SURVEY_IDS.includes(surveyId)) {
    if (!isRescueDone()) return true
    if (isRescueReadOnly()) return true
  }

  if (isCompdUser(surveyId)) return await syncCompdUserToSupabase(surveyId)

  const isFP = await checkIsFoundingPartner(surveyId)
  if (isFP) return await syncFPToSupabase(surveyId)

  return await syncRegularUserToSupabase()
}

export async function forceSyncNow(): Promise<boolean> {
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

  const SYNC_KEYS = new Set([
    'firmographics_data',
    'general_benefits_data',
    'current_support_data',
    'cross_dimensional_data',
    'employee-impact-assessment_data',
    ...Array.from({ length: 13 }, (_, i) => `dimension${i + 1}_data`),
    'auth_completed',
    'firmographics_complete',
    'general_benefits_complete',
    'current_support_complete',
    'cross_dimensional_complete',
    'employee-impact-assessment_complete',
    ...Array.from({ length: 13 }, (_, i) => `dimension${i + 1}_complete`),
  ])

  const doSync = useCallback(async (reason: string) => {
    if (syncInProgress.current) return
    if (hasConflict()) return
    if (!isDirty()) return

    syncInProgress.current = true
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
        if (isDirty()) doSync('Initial page load')
      }, 3000)
    }
  }, [doSync])

  useEffect(() => {
    if (pathname !== lastPath.current) {
      const prevPath = lastPath.current
      lastPath.current = pathname
      if (prevPath !== '' && isDirty()) doSync(`Route: ${prevPath} → ${pathname}`)
    }
  }, [pathname, doSync])

  // ✅ Prototype-level intercept (works even when localStorage.setItem is non-writable)
  useEffect(() => {
    const w = window as any
    if (w.__LS_PATCHED) return
    w.__LS_PATCHED = true

    const proto = Storage.prototype as any
    const originalProtoSetItem = proto.setItem

    // If already patched by us, skip
    if ((originalProtoSetItem as any).__AUTO_SYNC_PATCHED) return

    proto.setItem = function (key: string, value: string) {
      try {
        // NO-OP GUARD
        const prev = this.getItem(key)
        if (prev === value) return

        originalProtoSetItem.call(this, key, value)

        if (isHydrating()) return

        if (SYNC_KEYS.has(key)) {
          markDirty(`localStorage write: ${key}`)
          setTimeout(() => doSync(`localStorage write: ${key}`), 0)
        }
      } catch {
        // If anything goes wrong, fall back to original behavior
        originalProtoSetItem.call(this, key, value)
      }
    }

    ;(proto.setItem as any).__AUTO_SYNC_PATCHED = true

    return () => {
      // Restore original on unmount
      try {
        proto.setItem = originalProtoSetItem
      } catch {}
      w.__LS_PATCHED = false
    }
  }, [doSync])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasConflict() && isDirty()) doSync('Periodic (15s)')
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

  // ✅ beforeunload gated by isDirty()
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

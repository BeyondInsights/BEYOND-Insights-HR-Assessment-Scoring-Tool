/**
 * AUTO DATA SYNC v4 - Final fixes per ChatGPT review
 * 
 * FIXES APPLIED:
 * 1. Handles 409 (version conflict) - sets flag, dispatches event for UI
 * 2. Handles 400 (missing expectedVersion) - fetches version from DB first
 * 3. Ensures assessment_version exists before syncing
 * 4. Dispatches custom events for UI to show conflict banner
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
// VERSION TRACKING
// ============================================

function getStoredVersion(): number {
  const stored = localStorage.getItem('assessment_version')
  return stored ? Number(stored) : 0
}

function setStoredVersion(version: number): void {
  localStorage.setItem('assessment_version', String(version))
}

// ============================================
// CONFLICT STATE
// ============================================

function setConflictFlag(): void {
  sessionStorage.setItem('version_conflict', '1')
  // Dispatch event for UI to react
  window.dispatchEvent(new CustomEvent('sync-conflict', { 
    detail: { message: 'A newer version exists on the server' }
  }))
}

function clearConflictFlag(): void {
  sessionStorage.removeItem('version_conflict')
}

export function hasConflict(): boolean {
  return sessionStorage.getItem('version_conflict') === '1'
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
  
  return { data: updateData, hasData: itemCount > 0 }
}

// ============================================
// STABLE HASH FOR CHANGE DETECTION
// ============================================

let lastSyncedDataHash: string = ''

function getStableDataHash(data: Record<string, any>): string {
  return stableStringify(data, { dropNull: true })
}

function hasDataChanged(newData: Record<string, any>): boolean {
  const newHash = getStableDataHash(newData)
  if (newHash === lastSyncedDataHash) {
    return false
  }
  lastSyncedDataHash = newHash
  return true
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
    if (response.status === 409) {
      console.error('❌ AUTO-SYNC: VERSION CONFLICT!')
      console.error('   Expected:', result.expectedVersion)
      console.error('   Actual:', result.actualVersion)
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
    
    // SUCCESS - store new version, clear conflict
    if (result.newVersion) {
      setStoredVersion(result.newVersion)
      clearConflictFlag()
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
  
  if (!session?.user) {
    return true
  }
  
  const userId = session.user.id
  const accessToken = session.access_token
  const surveyId = localStorage.getItem('survey_id') || ''
  
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
  return await syncToSupabase()
}

/**
 * Clear conflict and reload from server
 * Call this when user clicks "Reload from server" button
 */
export async function resolveConflictFromServer(): Promise<boolean> {
  console.log('🔄 Resolving conflict - reloading from server...')
  
  const surveyId = localStorage.getItem('survey_id') || ''
  
  // Clear local answer data
  const dataKeys = [
    'firmographics_data', 'general_benefits_data', 'current_support_data',
    'cross_dimensional_data', 'employee-impact-assessment_data',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
  ]
  dataKeys.forEach(key => localStorage.removeItem(key))
  
  // Clear conflict flag
  clearConflictFlag()
  
  // Clear version so load will fetch fresh
  localStorage.removeItem('assessment_version')
  
  // Dispatch event for UI to reload
  window.dispatchEvent(new CustomEvent('sync-conflict-resolved'))
  
  // Force page reload to fetch fresh data
  window.location.reload()
  
  return true
}

// ============================================
// COMPONENT
// ============================================

export default function AutoDataSync() {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  const syncInProgress = useRef(false)
  const initialSyncDone = useRef(false)
  
  const doSync = useCallback(async (reason: string) => {
    if (syncInProgress.current) return
    if (hasConflict()) {
      console.log('⏸️ AUTO-SYNC: Skipping - conflict unresolved')
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
  
  // Initial sync with delay
  useEffect(() => {
    if (!initialSyncDone.current) {
      initialSyncDone.current = true
      setTimeout(() => doSync('Initial page load'), 3000)
    }
  }, [doSync])
  
  // Route change sync
  useEffect(() => {
    if (pathname !== lastPath.current) {
      const prevPath = lastPath.current
      lastPath.current = pathname
      if (prevPath !== '') {
        doSync(`Route: ${prevPath} → ${pathname}`)
      }
    }
  }, [pathname, doSync])
  
  // Intercept localStorage writes
  useEffect(() => {
    const originalSetItem = localStorage.setItem.bind(localStorage)
    let syncTimeout: ReturnType<typeof setTimeout> | null = null
    
    localStorage.setItem = (key: string, value: string) => {
      originalSetItem(key, value)
      
      if (key.includes('_data') || key.includes('_complete')) {
        if (syncTimeout) clearTimeout(syncTimeout)
        syncTimeout = setTimeout(() => doSync(`localStorage write: ${key}`), 500)
      }
    }
    
    return () => {
      localStorage.setItem = originalSetItem
      if (syncTimeout) clearTimeout(syncTimeout)
    }
  }, [doSync])
  
  // Periodic sync
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasConflict()) {
        doSync('Periodic (15s)')
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [doSync])
  
  // Visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !hasConflict()) {
        doSync('Tab became visible')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [doSync])
  
  // Before unload
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

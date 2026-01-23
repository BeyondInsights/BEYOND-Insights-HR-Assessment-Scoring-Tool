/**
 * AUTO DATA SYNC - BULLETPROOF VERSION
 * 
 * FEATURES:
 * 1. Uses Netlify function as primary sync (service role, bypasses RLS)
 * 2. Falls back to direct Supabase if Netlify function fails
 * 3. sendBeacon to Netlify function for reliable page-close sync
 * 4. Dirty queue with retries for failed syncs
 * 5. Stable hash for change detection
 * 6. All existing business logic preserved (comp'd users, FP contamination check, shared FP, etc.)
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

function addPendingOp(surveyId: string, data: Record<string, any>, userType: PendingOp['userType']): void {
  const ops = getPendingOps()
  const existingIdx = ops.findIndex(op => op.surveyId === surveyId)
  const newOp: PendingOp = {
    surveyId,
    data,
    timestamp: Date.now(),
    retryCount: 0,
    userType,
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
async function syncViaNetlifyFunction(surveyId: string, data: Record<string, any>): Promise<boolean> {
  try {
    const response = await fetch('/.netlify/functions/sync-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surveyId, data, timestamp: Date.now() }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[AutoSync] Netlify function error:', error)
      return false
    }
    
    const result = await response.json()
    console.log('✅ AUTO-SYNC: Synced via Netlify function:', result.surveyId)
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
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData || !hasDataChanged(updateData)) {
    return true
  }
  
  updateData.updated_at = new Date().toISOString()
  
  // Try Netlify function first
  if (await syncViaNetlifyFunction(normalized, updateData)) {
    removePendingOp(normalized)
    return true
  }
  
  // Fallback to direct Supabase
  try {
    const { error } = await supabase
      .from('assessments')
      .update(updateData)
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
  
  // Contamination check
  try {
    const { getFPCompanyName } = await import('@/lib/founding-partners')
    const expectedCompany = getFPCompanyName(surveyId)
    
    const firmographicsRaw = localStorage.getItem('firmographics_data')
    if (firmographicsRaw) {
      try {
        const firmographics = JSON.parse(firmographicsRaw)
        const localCompany = firmographics.companyName || ''
        
        if (localCompany && expectedCompany && localCompany !== expectedCompany && localCompany !== 'Founding Partner') {
          console.error('🚨 AUTO-SYNC: BLOCKING SYNC - Company mismatch!')
          console.error(`   Expected: "${expectedCompany}", Found: "${localCompany}"`)
          
          const keysToClear = [
            'firmographics_data', 'general_benefits_data', 'current_support_data',
            'cross_dimensional_data', 'employee-impact-assessment_data',
            ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`),
            'firmographics_complete', 'general_benefits_complete', 'current_support_complete',
            'cross_dimensional_complete', 'employee-impact-assessment_complete',
            ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
          ]
          keysToClear.forEach(key => localStorage.removeItem(key))
          return false
        }
      } catch (e) {}
    }
  } catch (e) {}
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData) {
    return true
  }
  
  if (!hasDataChanged(updateData)) {
    console.log('⏭️ AUTO-SYNC: Data unchanged')
    return true
  }
  
  updateData.updated_at = new Date().toISOString()
  
  // Try Netlify function first
  if (await syncViaNetlifyFunction(surveyId, updateData)) {
    removePendingOp(surveyId)
    return true
  }
  
  // Fallback to direct Supabase
  try {
    const { data: updateResult, error: updateError } = await supabase
      .from('assessments')
      .update(updateData)
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
          ...updateData
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
// SYNC REGULAR USER
// ============================================
async function syncRegularUserToSupabase(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return true
  }
  
  console.log('👤 AUTO-SYNC: Syncing regular user...')
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData || !hasDataChanged(updateData)) {
    return true
  }
  
  updateData.updated_at = new Date().toISOString()
  
  // Try Netlify function first (using user.id as surveyId)
  if (await syncViaNetlifyFunction(user.id, updateData)) {
    removePendingOp(user.id)
    return true
  }
  
  // Fallback to direct Supabase
  const { error } = await supabase
    .from('assessments')
    .update(updateData)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('❌ AUTO-SYNC: Regular user sync failed:', error.message)
    addPendingOp(user.id, updateData, 'regular')
    return false
  }
  
  console.log('✅ AUTO-SYNC: Regular user sync successful!')
  removePendingOp(user.id)
  return true
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================
async function syncToSupabase(): Promise<boolean> {
  const surveyId = localStorage.getItem('survey_id') || ''
  
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
    
    // Try Netlify function
    const success = await syncViaNetlifyFunction(op.surveyId, op.data)
    
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
// ============================================
function syncWithBeacon(): void {
  const surveyId = localStorage.getItem('survey_id') || ''
  if (!surveyId) return
  
  const { data: updateData, hasData } = collectAllSurveyData()
  if (!hasData) return
  
  updateData.updated_at = new Date().toISOString()
  
  const payload = JSON.stringify({ surveyId, data: updateData, timestamp: Date.now() })
  
  // Try sendBeacon to Netlify function (most reliable for unload)
  const beaconSent = navigator.sendBeacon(
    '/.netlify/functions/sync-assessment',
    new Blob([payload], { type: 'application/json' })
  )
  
  if (beaconSent) {
    console.log('👋 AUTO-SYNC: Beacon sent to Netlify function')
    return
  }
  
  // Fallback: keepalive fetch to Netlify function
  fetch('/.netlify/functions/sync-assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Last resort: direct to Supabase with keepalive
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/assessments?survey_id=eq.${surveyId}`
    fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updateData),
      keepalive: true,
    }).catch(() => {
      // If all else fails, add to pending queue for next load
      addPendingOp(surveyId, updateData, 'fp')
    })
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
// COMPONENT
// ============================================
export default function AutoDataSync() {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  const syncInProgress = useRef(false)
  const pendingSync = useRef<NodeJS.Timeout | null>(null)
  const retryInterval = useRef<NodeJS.Timeout | null>(null)
  
  const doSync = useCallback(async (reason: string) => {
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
  }, [])
  
  // IMMEDIATE sync on mount
  useEffect(() => {
    doSync('Initial page load')
    setTimeout(() => doSync('Delayed check'), 1000)
    
    // Process any pending ops from previous session
    setTimeout(() => processPendingOps(), 2000)
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
  }, [])
  
  return null
}

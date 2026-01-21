/**
 * AUTO DATA SYNC - FIXED VERSION
 * 
 * Handles:
 * - Founding Partners (by survey_id)
 * - Shared FPs (by survey_id to fp_shared_assessments)
 * - Comp'd Users (by app_id to assessments - no Supabase auth)
 * - Regular Users (by user_id)
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'

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

/**
 * Collect all survey data from localStorage
 * Returns both the data and a hash to detect changes
 */
function collectAllSurveyData(): { data: Record<string, any>, hasData: boolean } {
  const updateData: Record<string, any> = {}
  
  console.log('🔍 AUTO-SYNC: Scanning localStorage...')
  
  // Data keys
  const dataKeys = [
    'firmographics_data',
    'general_benefits_data',
    'current_support_data',
    'cross_dimensional_data',
    'employee-impact-assessment_data',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
  ]
  
  // Completion flags - map to Supabase column names
  const completeKeyMap: Record<string, string> = {
    'firmographics_complete': 'firmographics_complete',
    'auth_completed': 'auth_completed',
    'general_benefits_complete': 'general_benefits_complete',
    'current_support_complete': 'current_support_complete',
    'cross_dimensional_complete': 'cross_dimensional_complete',
    'employee-impact-assessment_complete': 'employee_impact_complete',
  }
  
  // Add dimension complete flags
  for (let i = 1; i <= 13; i++) {
    completeKeyMap[`dimension${i}_complete`] = `dimension${i}_complete`
  }
  
  let itemCount = 0
  
  // Collect data
  dataKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (parsed && Object.keys(parsed).length > 0) {
          // Map employee-impact-assessment_data to employee_impact_data for Supabase
          const dbKey = key === 'employee-impact-assessment_data' ? 'employee_impact_data' : key
          updateData[dbKey] = parsed
          itemCount++
          console.log(`  ✓ ${key}: ${Object.keys(parsed).length} fields`)
        }
      } catch (e) {
        console.warn(`  ⚠ Could not parse ${key}`)
      }
    }
  })
  
  // Collect completion flags
  Object.entries(completeKeyMap).forEach(([localKey, dbKey]) => {
    const value = localStorage.getItem(localKey)
    if (value === 'true') {
      updateData[dbKey] = true
      itemCount++
    }
  })
  
  
  console.log(`📊 AUTO-SYNC: Collected ${itemCount} items to sync`)
  
  return { data: updateData, hasData: itemCount > 0 }
}

// Track last synced data hash to avoid unnecessary updates
let lastSyncedDataHash: string = ''

function getDataHash(data: Record<string, any>): string {
  return JSON.stringify(data)
}

function hasDataChanged(newData: Record<string, any>): boolean {
  const newHash = getDataHash(newData)
  if (newHash === lastSyncedDataHash) {
    return false
  }
  lastSyncedDataHash = newHash
  return true
}

/**
 * Check if this is a Founding Partner
 */
async function checkIsFoundingPartner(surveyId: string): Promise<boolean> {
  if (!surveyId) return false
  
  // Check for FP prefix patterns
  if (surveyId.startsWith('FP-')) return true
  
  // Try importing the module
  try {
    const { isFoundingPartner } = await import('@/lib/founding-partners')
    return isFoundingPartner(surveyId)
  } catch {
    return surveyId.startsWith('FP-')
  }
}

/**
 * Sync Comp'd User data to Supabase (by app_id)
 */
async function syncCompdUserToSupabase(surveyId: string): Promise<boolean> {
  const normalized = surveyId?.replace(/-/g, '').toUpperCase() || ''
  console.log('🎫 AUTO-SYNC: Syncing comp\'d user data for:', normalized)
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData) {
    console.log('⏭️ AUTO-SYNC: No data to sync')
    return true
  }
  
  // Only update if data has actually changed
  if (!hasDataChanged(updateData)) {
    console.log('⏭️ AUTO-SYNC: Data unchanged, skipping sync')
    return true
  }
  
  // Only set updated_at when data has actually changed
  updateData.updated_at = new Date().toISOString()
  
  try {
    const { data: updateResult, error: updateError } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('app_id', normalized)
      .select('id')
    
    if (updateError) {
      console.error('❌ AUTO-SYNC: Comp\'d user sync failed:', updateError.message)
      return false
    }
    
    if (!updateResult || updateResult.length === 0) {
      console.warn('⚠️ AUTO-SYNC: No rows updated for comp\'d user - record may not exist')
      return false
    }
    
    console.log('✅ AUTO-SYNC: Comp\'d user sync successful!')
    return true
    
  } catch (error) {
    console.error('❌ AUTO-SYNC: Exception during comp\'d user sync:', error)
    return false
  }
}

/**
 * Sync FP data to Supabase - WITH VERIFICATION
 */
async function syncFPToSupabase(surveyId: string): Promise<boolean> {
  console.log('🏢 AUTO-SYNC: Syncing FP data for:', surveyId)
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData) {
    console.log('⏭️ AUTO-SYNC: No data to sync')
    return true
  }
  
  // Only update if data has actually changed
  if (!hasDataChanged(updateData)) {
    console.log('⏭️ AUTO-SYNC: Data unchanged, skipping sync')
    return true
  }
  
  // Only set updated_at when data has actually changed
  updateData.updated_at = new Date().toISOString()
  
  try {
    // First, try UPDATE
    const { data: updateResult, error: updateError } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('survey_id', surveyId)
      .select('id')
    
    if (updateError) {
      console.error('❌ AUTO-SYNC: Update failed:', updateError.message)
      
      // Fallback: Try UPSERT
      console.log('🔄 AUTO-SYNC: Trying upsert fallback...')
      const { error: upsertError } = await supabase
        .from('assessments')
        .upsert({
          survey_id: surveyId,
          app_id: surveyId,
          is_founding_partner: true,
          ...updateData
        }, {
          onConflict: 'survey_id'
        })
      
      if (upsertError) {
        console.error('❌ AUTO-SYNC: Upsert also failed:', upsertError.message)
        return false
      }
      
      console.log('✅ AUTO-SYNC: Upsert succeeded!')
      return true
    }
    
    // Check if update actually affected rows
    if (!updateResult || updateResult.length === 0) {
      console.warn('⚠️ AUTO-SYNC: Update returned no rows - record may not exist')
      
      // Try to create the record
      console.log('🔄 AUTO-SYNC: Creating new FP record...')
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
        // Record might already exist, try update one more time
        console.log('🔄 AUTO-SYNC: Insert failed, final update attempt...')
        const { error: finalError } = await supabase
          .from('assessments')
          .update(updateData)
          .eq('survey_id', surveyId)
        
        if (finalError) {
          console.error('❌ AUTO-SYNC: All attempts failed:', finalError.message)
          return false
        }
      }
      
      console.log('✅ AUTO-SYNC: Record created/updated!')
      return true
    }
    
    console.log('✅ AUTO-SYNC: FP sync successful! Updated', updateResult.length, 'row(s)')
    return true
    
  } catch (error) {
    console.error('❌ AUTO-SYNC: Exception during FP sync:', error)
    return false
  }
}

/**
 * Sync regular user data to Supabase
 */
async function syncRegularUserToSupabase(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log('⏭️ AUTO-SYNC: No authenticated user - skipping')
    return true
  }
  
  console.log('👤 AUTO-SYNC: Syncing regular user data...')
  
  const { data: updateData, hasData } = collectAllSurveyData()
  
  if (!hasData) {
    console.log('⏭️ AUTO-SYNC: No data to sync')
    return true
  }
  
  // Only update if data has actually changed
  if (!hasDataChanged(updateData)) {
    console.log('⏭️ AUTO-SYNC: Data unchanged, skipping sync')
    return true
  }
  
  // Only set updated_at when data has actually changed
  updateData.updated_at = new Date().toISOString()
  
  const { error } = await supabase
    .from('assessments')
    .update(updateData)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('❌ AUTO-SYNC: Regular user sync failed:', error.message)
    return false
  }
  
  console.log('✅ AUTO-SYNC: Regular user sync successful!')
  return true
}

/**
 * Main sync function
 */
async function syncToSupabase(force: boolean = false): Promise<boolean> {
  const surveyId = localStorage.getItem('survey_id') || ''
  
  console.log('🔄 AUTO-SYNC: Starting sync...', force ? '(FORCED)' : '', 'Survey ID:', surveyId || 'none')
  
  // ============================================
  // CHECK FOR COMP'D USERS FIRST
  // ============================================
  if (isCompdUser(surveyId)) {
    console.log('🎫 AUTO-SYNC: Comp\'d user detected')
    return await syncCompdUserToSupabase(surveyId)
  }
  // ============================================
  
  // Check for Shared FP
  try {
    const { isSharedFP, saveSharedFPData } = await import('./fp-shared-storage')
    if (isSharedFP(surveyId)) {
      console.log('🏪 AUTO-SYNC: Shared FP - syncing to fp_shared_assessments')
      const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email')
      await saveSharedFPData(surveyId, email || undefined)
      return true
    }
  } catch (e) {
    // Module not found, continue
  }
  
  // Check for regular FP
  const isFP = await checkIsFoundingPartner(surveyId)
  
  if (isFP) {
    return await syncFPToSupabase(surveyId)
  }
  
  // Regular user
  return await syncRegularUserToSupabase()
}

/**
 * Force sync - call this manually when needed
 */
export async function forceSyncNow(): Promise<boolean> {
  console.log('⚡ FORCE SYNC TRIGGERED')
  return await syncToSupabase(true)
}

/**
 * Auto Data Sync Component
 */
export default function AutoDataSync() {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  const syncInProgress = useRef(false)
  const initialSyncDone = useRef(false)
  
  const doSync = useCallback(async (reason: string) => {
    if (syncInProgress.current) {
      console.log('⏸️ AUTO-SYNC: Sync already in progress, skipping')
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
    if (!initialSyncDone.current) {
      initialSyncDone.current = true
      console.log('🚀 AUTO-SYNC: Immediate sync on mount')
      doSync('Initial page load - immediate')
      
      // Also sync again after a moment in case localStorage wasn't ready
      setTimeout(() => {
        doSync('Initial page load - delayed check')
      }, 2000)
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
      
      // FORCE sync on critical pages
      const criticalPages = ['/dashboard', '/company-profile', '/submit', '/review']
      if (criticalPages.some(p => pathname.includes(p))) {
        console.log('📍 AUTO-SYNC: Critical page detected - forcing sync')
        setTimeout(() => doSync('Critical page sync'), 500)
      }
    }
  }, [pathname, doSync])
  
  // INTERCEPT localStorage writes - sync immediately on any survey data change
  useEffect(() => {
    const originalSetItem = localStorage.setItem.bind(localStorage)
    let syncTimeout: ReturnType<typeof setTimeout> | null = null
    
    localStorage.setItem = (key: string, value: string) => {
      // Call original first
      originalSetItem(key, value)
      
      // If it's survey data, debounce and sync immediately
      if (key.includes('_data') || key.includes('_complete')) {
        console.log(`📝 AUTO-SYNC: localStorage write detected: ${key}`)
        
        // Debounce to avoid hammering Supabase on rapid changes
        if (syncTimeout) clearTimeout(syncTimeout)
        syncTimeout = setTimeout(() => {
          doSync(`localStorage write: ${key}`)
        }, 500)
      }
    }
    
    console.log('🔌 AUTO-SYNC: localStorage intercept installed')
    
    return () => {
      localStorage.setItem = originalSetItem
      if (syncTimeout) clearTimeout(syncTimeout)
    }
  }, [doSync])
  
  // Periodic sync every 15 seconds
  useEffect(() => {
    console.log('⏰ AUTO-SYNC: Initialized - syncing every 15 seconds')
    
    const interval = setInterval(() => {
      doSync('Periodic (15s)')
    }, 15000)
    
    return () => clearInterval(interval)
  }, [doSync])
  
  // Sync on visibility change (tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        doSync('Tab became visible')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [doSync])
  
  // Sync before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('👋 AUTO-SYNC: Page closing - final sync')
      syncToSupabase()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  return null
}

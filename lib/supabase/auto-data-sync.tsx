/**
 * AUTO DATA SYNC - Syncs ALL localStorage to Supabase automatically
 * 
 * FIXED: Maps localStorage keys to correct Supabase column names
 * - employee-impact-assessment_data -> employee_impact_data
 * - employee-impact-assessment_complete -> employee_impact_complete
 */

'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'

// Map localStorage keys to Supabase column names
const KEY_MAP: Record<string, string> = {
  'employee-impact-assessment_data': 'employee_impact_data',
  'employee-impact-assessment_complete': 'employee_impact_complete',
}

/**
 * Collect all survey data from localStorage
 */
function collectAllSurveyData() {
  const updateData: Record<string, any> = {}
  
  console.log('[AUTO-SYNC] Scanning localStorage for survey data...')
  
  // List of all data keys we need to sync (localStorage key names)
  const dataKeys = [
    'firmographics_data',
    'general_benefits_data',
    'current_support_data',
    'cross_dimensional_data',
    'employee-impact-assessment_data',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
  ]
  
  // List of all completion flags (localStorage key names)
  const completeKeys = [
    'firmographics_complete',
    'auth_completed',
    'general_benefits_complete',
    'current_support_complete',
    'cross_dimensional_complete',
    'employee-impact-assessment_complete',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
  ]
  
  // Collect data
  dataKeys.forEach(localKey => {
    const value = localStorage.getItem(localKey)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (Object.keys(parsed).length > 0) {
          // Map localStorage key to Supabase column name if needed
          const dbKey = KEY_MAP[localKey] || localKey
          updateData[dbKey] = parsed
          console.log(`  [AUTO-SYNC] Found ${localKey} -> ${dbKey}: ${Object.keys(parsed).length} fields`)
        }
      } catch (e) {
        console.warn(`  [AUTO-SYNC] Could not parse ${localKey}`)
      }
    }
  })
  
  // Collect completion flags
  completeKeys.forEach(localKey => {
    const value = localStorage.getItem(localKey)
    if (value === 'true') {
      // Map localStorage key to Supabase column name if needed
      const dbKey = KEY_MAP[localKey] || localKey
      updateData[dbKey] = true
      console.log(`  [AUTO-SYNC] Found ${localKey} -> ${dbKey}: true`)
    }
  })
  
  // Also collect company_name if present
  const companyName = localStorage.getItem('login_company_name')
  if (companyName) {
    updateData.company_name = companyName
    console.log(`  [AUTO-SYNC] Found company_name:`, companyName)
  }
  
  return updateData
}

/**
 * Sync all localStorage data to Supabase
 */
async function syncToSupabase() {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[AUTO-SYNC] No Supabase user - skipping sync')
      return
    }
    
    // Check if this is a Founding Partner (skip Supabase for them)
    const surveyId = localStorage.getItem('survey_id') || ''
    try {
      const { isFoundingPartner } = await import('@/lib/founding-partners')
      if (isFoundingPartner(surveyId)) {
        console.log('[AUTO-SYNC] Founding Partner - skipping Supabase sync')
        return
      }
    } catch (e) {
      // Founding partners module not found, continue
    }
    
    // Collect all data
    const updateData = collectAllSurveyData()
    
    if (Object.keys(updateData).length === 0) {
      console.log('[AUTO-SYNC] No data to sync')
      return
    }
    
    console.log(`[AUTO-SYNC] Syncing ${Object.keys(updateData).length} items to Supabase...`)
    
    // Add timestamp
    updateData.updated_at = new Date().toISOString()
    
    // Update Supabase
    const { error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('[AUTO-SYNC] Sync error:', error.message)
    } else {
      console.log('[AUTO-SYNC] ✅ Sync successful!')
    }
  } catch (error) {
    console.error('[AUTO-SYNC] Sync failed:', error)
  }
}

/**
 * Auto Data Sync Component
 * Add to root layout to enable automatic syncing
 */
export default function AutoDataSync() {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  const syncInProgress = useRef(false)
  
  // Sync when navigating between pages
  useEffect(() => {
    if (pathname !== lastPath.current && lastPath.current !== '') {
      console.log('[AUTO-SYNC] Route changed - triggering sync')
      if (!syncInProgress.current) {
        syncInProgress.current = true
        syncToSupabase().finally(() => {
          syncInProgress.current = false
        })
      }
    }
    lastPath.current = pathname
  }, [pathname])
  
  // Sync every 30 seconds
  useEffect(() => {
    console.log('[AUTO-SYNC] Initialized - will sync every 30 seconds')
    const interval = setInterval(() => {
      console.log('[AUTO-SYNC] Periodic sync triggered')
      if (!syncInProgress.current) {
        syncInProgress.current = true
        syncToSupabase().finally(() => {
          syncInProgress.current = false
        })
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Sync before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('[AUTO-SYNC] Page closing - final sync')
      // Use sendBeacon for more reliable sync on page close
      const data = collectAllSurveyData()
      if (Object.keys(data).length > 0) {
        // Fallback to regular sync
        syncToSupabase()
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  return null
}

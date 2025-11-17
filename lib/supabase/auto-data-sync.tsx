'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'

/**
 * Collect all survey data from localStorage
 */
function collectAllSurveyData() {
  const updateData: Record<string, any> = {}
  
  console.log('[AUTO-SYNC] Scanning localStorage for survey data...')
  
  // List of all data keys we need to sync
  const dataKeys = [
    'firmographics_data',
    'general_benefits_data',
    'current_support_data',
    'cross_dimensional_data',
    'employee-impact-assessment_data',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
  ]
  
  // List of all completion flags
  const completeKeys = [
    'firmographics_complete',
    'auth_completed',
    'general_benefits_complete',
    'current_support_complete',
    'cross_dimensional_complete',
    'employee-impact-assessment_complete',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
  ]
  
  // Collect data - ONLY if it exists in localStorage
  dataKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (Object.keys(parsed).length > 0) {
          updateData[key] = parsed
          console.log(`[AUTO-SYNC] Found ${key}: ${Object.keys(parsed).length} fields`)
        }
      } catch (e) {
        console.warn(`[AUTO-SYNC] Could not parse ${key}`)
      }
    }
  })
  
  // Collect completion flags - ONLY if localStorage explicitly says 'true'
  completeKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value === 'true') {
      updateData[key] = true
      console.log(`[AUTO-SYNC] Found ${key}: true`)
    }
  })
  
  // Also collect company_name if present
  const companyName = localStorage.getItem('login_company_name')
  if (companyName) {
    updateData.company_name = companyName
    console.log(`[AUTO-SYNC] Found company_name: ${companyName}`)
  }
  
  return updateData
}

/**
 * Sync all localStorage data to Supabase
 */
async function syncToSupabase() {
  try {
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
    
    // Add timestamp
    updateData.updated_at = new Date().toISOString()
    
    // ============================================
    // CRITICAL FIX: Support both bypass flags AND Supabase sessions
    // ============================================
    
    // Option 1: Try Supabase session first (returning users)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      console.log(`[AUTO-SYNC] Syncing ${Object.keys(updateData).length} items via Supabase session...`)
      
      const { error } = await supabase
        .from('assessments')
        .update(updateData)
        .eq('user_id', user.id)
      
      if (error) {
        console.error('[AUTO-SYNC] Sync error:', error.message)
      } else {
        console.log('[AUTO-SYNC] Sync successful!')
      }
      return
    }
    
    // Option 2: Use app_id lookup (new users with bypass flags)
    const appId = localStorage.getItem('login_Survey_id') || localStorage.getItem('survey_id')
    
    if (appId) {
      console.log(`[AUTO-SYNC] No session - syncing ${Object.keys(updateData).length} items via app_id: ${appId}`)
      
      const cleanAppId = appId.replace(/-/g, '')
      
      const { error } = await supabase
        .from('assessments')
        .update(updateData)
        .eq('app_id', cleanAppId)
      
      if (error) {
        console.error('[AUTO-SYNC] Sync error:', error.message)
      } else {
        console.log('[AUTO-SYNC] Sync successful via app_id!')
      }
      return
    }
    
    // No way to identify user
    console.warn('[AUTO-SYNC] Cannot sync - no Supabase user and no app_id found')
    
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
    console.log('[AUTO-SYNC] Auto-sync initialized - will sync every 30 seconds')
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
      const data = collectAllSurveyData()
      if (Object.keys(data).length > 0) {
        syncToSupabase()
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  return null
}

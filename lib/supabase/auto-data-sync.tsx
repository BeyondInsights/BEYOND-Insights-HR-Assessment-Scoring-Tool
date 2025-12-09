/**
 * AUTO DATA SYNC - Syncs ALL localStorage to Supabase automatically
 * 
 * This component monitors localStorage and automatically syncs survey data to Supabase.
 * NO CHANGES to survey pages required - it works with existing localStorage keys.
 * 
 * UPDATED: Now handles shared FP storage for Best Buy (FP-392847)
 */

'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'
import { isSharedFP, saveSharedFPData } from './fp-shared-storage'

/**
 * Collect all survey data from localStorage
 */
function collectAllSurveyData() {
  const updateData: Record<string, any> = {}
  
  console.log('🔍 Scanning localStorage for survey data...')
  
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
  
  // Collect data
  dataKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (Object.keys(parsed).length > 0) {
          updateData[key] = parsed
          console.log(`  ✓ Found ${key}:`, Object.keys(parsed).length, 'fields')
        }
      } catch (e) {
        console.warn(`  ⚠ Could not parse ${key}`)
      }
    }
  })
  
  // Collect completion flags
  completeKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value === 'true') {
      updateData[key] = true
      console.log(`  ✓ Found ${key}: true`)
    }
  })
  
  // Also collect company_name if present
  const companyName = localStorage.getItem('login_company_name')
  if (companyName) {
    updateData.company_name = companyName
    console.log(`  ✓ Found company_name:`, companyName)
  }
  
  return updateData
}

/**
 * Sync all localStorage data to Supabase
 */
async function syncToSupabase() {
  try {
    // ============================================
    // CHECK FOR SHARED FP FIRST (Best Buy)
    // ============================================
    const surveyId = localStorage.getItem('survey_id') || ''
    
    if (isSharedFP(surveyId)) {
      console.log('🏪 Shared FP detected - syncing to fp_shared_assessments')
      const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email')
      await saveSharedFPData(surveyId, email || undefined)
      return
    }
    // ============================================
    
    // Check if this is a regular Founding Partner (skip Supabase for them)
    try {
      const { isFoundingPartner } = await import('@/lib/founding-partners')
      if (isFoundingPartner(surveyId)) {
        console.log('⏭️ Regular Founding Partner - skipping Supabase sync')
        return
      }
    } catch (e) {
      // Founding partners module not found, continue
    }
    
    // Check if user is authenticated with Supabase
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('⏭️ No Supabase user - skipping sync')
      return
    }
    
    // Collect all data
    const updateData = collectAllSurveyData()
    
    if (Object.keys(updateData).length === 0) {
      console.log('⏭️ No data to sync')
      return
    }
    
    console.log(`💾 Syncing ${Object.keys(updateData).length} items to Supabase...`)
    
    // Add timestamp
    updateData.updated_at = new Date().toISOString()
    
    // Update Supabase
    const { error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('❌ Sync error:', error.message)
    } else {
      console.log('✅ Sync successful!')
    }
  } catch (error) {
    console.error('❌ Sync failed:', error)
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
      console.log('📍 Route changed - triggering sync')
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
    console.log('⏰ Auto-sync initialized - will sync every 30 seconds')
    const interval = setInterval(() => {
      console.log('⏰ Periodic sync triggered')
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
      console.log('👋 Page closing - final sync')
      syncToSupabase()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  return null
}

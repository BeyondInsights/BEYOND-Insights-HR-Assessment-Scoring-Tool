/**
 * AUTO DATA SYNC - Syncs ALL localStorage to Supabase automatically
 * 
 * This component monitors localStorage and automatically syncs survey data to Supabase.
 * NO CHANGES to survey pages required - it works with existing localStorage keys.
 * 
 * FIXED: Now syncs ALL Founding Partners to Supabase (not just shared ones)
 */

'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'

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
    const surveyId = localStorage.getItem('survey_id') || ''
    
    if (!surveyId) {
      console.log('⏭️ No survey_id in localStorage - skipping sync')
      return
    }
    
    // Collect all data
    const updateData = collectAllSurveyData()
    
    if (Object.keys(updateData).length === 0) {
      console.log('⏭️ No data to sync')
      return
    }
    
    // Add timestamp
    updateData.updated_at = new Date().toISOString()
    
    // ============================================
    // CHECK IF FOUNDING PARTNER
    // ============================================
    let isFP = false
    try {
      const { isFoundingPartner } = await import('@/lib/founding-partners')
      isFP = isFoundingPartner(surveyId)
    } catch (e) {
      // Module not found, continue
    }
    
    if (isFP) {
      // ============================================
      // FOUNDING PARTNER - Sync by survey_id
      // ============================================
      console.log(`💾 FP Sync: ${Object.keys(updateData).length} items to assessments (survey_id: ${surveyId})...`)
      
      const { error } = await supabase
        .from('assessments')
        .update(updateData)
        .eq('survey_id', surveyId)
      
      if (error) {
        console.error('❌ FP Sync error:', error.message)
      } else {
        console.log('✅ FP Sync successful!')
      }
    } else {
      // ============================================
      // REGULAR USER - Sync by user_id
      // ============================================
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('⏭️ No Supabase user - skipping sync')
        return
      }
      
      console.log(`💾 Syncing ${Object.keys(updateData).length} items to Supabase (user_id)...`)
      
      const { error } = await supabase
        .from('assessments')
        .update(updateData)
        .eq('user_id', user.id)
      
      if (error) {
        console.error('❌ Sync error:', error.message)
      } else {
        console.log('✅ Sync successful!')
      }
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

/**
 * AUTO DATA SYNC - Syncs ALL localStorage to Supabase automatically
 * 
 * This component monitors localStorage and automatically syncs survey data to Supabase.
 * NO CHANGES to survey pages required - it works with existing localStorage keys.
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
  
  console.log('ðŸ” Scanning localStorage for survey data...')
  
  // List of all data keys we need to sync
  const dataKeys = [
    'firmographics_data',
    'general_benefits_data',
    'current_support_data',
    'cross_dimensional_data',
    'employee_impact_data',  // ✅ FIXED: Match Supabase column name
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
  ]
  
  // List of all completion flags
  const completeKeys = [
    'firmographics_complete',
    'auth_completed',
    'general_benefits_complete',
    'current_support_complete',
    'cross_dimensional_complete',
    'employee_impact_complete',  // ✅ FIXED: Match Supabase column name
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
          console.log(`  Ã¢Å“â€¦ Found ${key}:`, Object.keys(parsed).length, 'fields')
        }
      } catch (e) {
        console.warn(`  Ã¢ï¿½Å¡ Could not parse ${key}`)
      }
    }
  })
  
  // Collect completion flags
  completeKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value === 'true') {
      updateData[key] = true
      console.log(`  Ã¢Å“â€¦ Found ${key}: true`)
    }
  })
  
  // Also collect company_name if present
  const companyName = localStorage.getItem('login_company_name')
  if (companyName) {
    updateData.company_name = companyName
    console.log(`  Ã¢Å“â€¦ Found company_name:`, companyName)
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
      console.log('Ã¢ï¿½Â­Ã¯Â¸ï¿½ No Supabase user - skipping sync')
      return
    }
    
    // Check if this is a Founding Partner (skip Supabase for them)
    const surveyId = localStorage.getItem('survey_id') || ''
    try {
      const { isFoundingPartner } = await import('@/lib/founding-partners')
      if (isFoundingPartner(surveyId)) {
        console.log('Ã¢ï¿½Â­Ã¯Â¸ï¿½ Founding Partner - skipping Supabase sync')
        return
      }
    } catch (e) {
      // Founding partners module not found, continue
    }
    
    // Collect all data
    const updateData = collectAllSurveyData()
    
    if (Object.keys(updateData).length === 0) {
      console.log('Ã¢ï¿½Â­Ã¯Â¸ï¿½ No data to sync')
      return
    }
    
    console.log(`Ã°Å¸'Â¾ Syncing ${Object.keys(updateData).length} items to Supabase...`)
    
    // Add timestamp
    updateData.updated_at = new Date().toISOString()
    
    // Update Supabase
    const { error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Ã¢ï¿½Å’ Sync error:', error.message)
    } else {
      console.log('Ã¢Å“â€¦ Sync successful!')
    }
  } catch (error) {
    console.error('Ã¢ï¿½Å’ Sync failed:', error)
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
      console.log('Ã°Å¸"ï¿½ Route changed - triggering sync')
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
    console.log('â° Auto-sync initialized - will sync every 30 seconds')
    const interval = setInterval(() => {
      console.log('â° Periodic sync triggered')
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
      console.log('Ã°Å¸'â€¹ Page closing - final sync')
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


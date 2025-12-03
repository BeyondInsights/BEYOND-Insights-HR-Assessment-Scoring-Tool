/**
 * AUTO DATA SYNC - TEMPORARILY DISABLED
 * 
 * This is a placeholder that does nothing.
 * Uncomment the code below to re-enable syncing.
 */

'use client'

export default function AutoDataSync() {
  // DISABLED - Not syncing anything
  return null
}

/*
// ORIGINAL CODE - COMMENTED OUT
'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'

function collectAllSurveyData() {
  const updateData: Record<string, any> = {}
  
  console.log('Scanning localStorage for survey data...')
  
  const dataKeys = [
    'firmographics_data',
    'general_benefits_data',
    'current_support_data',
    'cross_dimensional_data',
    'employee_impact_data',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
  ]
  
  const completeKeys = [
    'firmographics_complete',
    'auth_completed',
    'general_benefits_complete',
    'current_support_complete',
    'cross_dimensional_complete',
    'employee_impact_complete',
    ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
  ]
  
  dataKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (Object.keys(parsed).length > 0) {
          updateData[key] = parsed
          console.log(`  Found ${key}:`, Object.keys(parsed).length, 'fields')
        }
      } catch (e) {
        console.warn(`  Could not parse ${key}`)
      }
    }
  })
  
  completeKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value === 'true') {
      updateData[key] = true
      console.log(`  Found ${key}: true`)
    }
  })
  
  const companyName = localStorage.getItem('login_company_name')
  if (companyName) {
    updateData.company_name = companyName
    console.log(`  Found company_name:`, companyName)
  }
  
  return updateData
}

async function syncToSupabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No Supabase user - skipping sync')
      return
    }
    
    const surveyId = localStorage.getItem('survey_id') || ''
    try {
      const { isFoundingPartner } = await import('@/lib/founding-partners')
      if (isFoundingPartner(surveyId)) {
        console.log('Founding Partner - skipping Supabase sync')
        return
      }
    } catch (e) {
      // Founding partners module not found, continue
    }
    
    const updateData = collectAllSurveyData()
    
    if (Object.keys(updateData).length === 0) {
      console.log('No data to sync')
      return
    }
    
    console.log(`Syncing ${Object.keys(updateData).length} items to Supabase...`)
    
    updateData.updated_at = new Date().toISOString()
    
    const { error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Sync error:', error.message)
    } else {
      console.log('Sync successful!')
    }
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

export default function AutoDataSync() {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  const syncInProgress = useRef(false)
  
  useEffect(() => {
    if (pathname !== lastPath.current && lastPath.current !== '') {
      console.log('Route changed - triggering sync')
      if (!syncInProgress.current) {
        syncInProgress.current = true
        syncToSupabase().finally(() => {
          syncInProgress.current = false
        })
      }
    }
    lastPath.current = pathname
  }, [pathname])
  
  useEffect(() => {
    console.log('Auto-sync initialized - will sync every 30 seconds')
    const interval = setInterval(() => {
      console.log('Periodic sync triggered')
      if (!syncInProgress.current) {
        syncInProgress.current = true
        syncToSupabase().finally(() => {
          syncInProgress.current = false
        })
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('Page closing - final sync')
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
*/

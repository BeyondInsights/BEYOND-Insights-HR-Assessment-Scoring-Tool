/**
 * AUTO DATA SYNC - Syncs localStorage to Supabase automatically
 * FIXED: Now MERGES data instead of replacing, won't overwrite complete data with incomplete
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
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  })
  
  // Collect completion flags
  completeKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value === 'true') {
      updateData[key] = true
    }
  })
  
  // Also collect company_name if present
  const companyName = localStorage.getItem('login_company_name')
  if (companyName) {
    updateData.company_name = companyName
  }
  
  return updateData
}

/**
 * Sync localStorage data to Supabase - MERGES instead of replacing
 */
async function syncToSupabase() {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return
    }
    
    // Check if this is a Founding Partner (skip Supabase for them)
    const surveyId = localStorage.getItem('survey_id') || ''
    try {
      const { isFoundingPartner } = await import('@/lib/founding-partners')
      if (isFoundingPartner(surveyId)) {
        return
      }
    } catch (e) {
      // Founding partners module not found, continue
    }
    
    // Collect all data from localStorage
    const localData = collectAllSurveyData()
    
    if (Object.keys(localData).length === 0) {
      return
    }
    
    // FETCH EXISTING DATA FROM DATABASE FIRST
    const { data: existing, error: fetchError } = await supabase
      .from('assessments')
      .select('firmographics_data, general_benefits_data, current_support_data, cross_dimensional_data, employee_impact_data')
      .eq('user_id', user.id)
      .single()
    
    if (fetchError) {
      console.error('Fetch error:', fetchError.message)
      return
    }
    
    // SMART MERGE: Only update if localStorage has MORE data
    const updateData: Record<string, any> = {}
    
    // For each data key, check if we should update
    const dataKeys = ['firmographics_data', 'general_benefits_data', 'current_support_data', 'cross_dimensional_data']
    
    for (const key of dataKeys) {
      const localValue = localData[key]
      const dbValue = existing?.[key]
      
      if (localValue) {
        const localKeyCount = Object.keys(localValue).length
        const dbKeyCount = dbValue ? Object.keys(dbValue).length : 0
        
        // ONLY update if localStorage has MORE fields than database
        // This prevents overwriting complete data with incomplete data
        if (localKeyCount > dbKeyCount) {
          // MERGE: Keep database data, add localStorage data on top
          updateData[key] = { ...dbValue, ...localValue }
          console.log(`📝 Merging ${key}: DB has ${dbKeyCount} keys, localStorage has ${localKeyCount} keys`)
        } else if (dbKeyCount === 0) {
          // Database is empty, use localStorage
          updateData[key] = localValue
        }
        // If database has more or equal fields, DON'T overwrite
      }
    }
    
    // Dimension data - same logic
    for (let i = 1; i <= 13; i++) {
      const key = `dimension${i}_data`
      const localValue = localData[key]
      
      if (localValue && Object.keys(localValue).length > 0) {
        updateData[key] = localValue
      }
    }
    
    // Completion flags - only set to true, never to false
    const completeKeys = [
      'firmographics_complete', 'auth_completed', 'general_benefits_complete',
      'current_support_complete', 'cross_dimensional_complete', 'employee-impact-assessment_complete',
      ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
    ]
    
    for (const key of completeKeys) {
      if (localData[key] === true) {
        updateData[key] = true
      }
    }
    
    // Company name
    if (localData.company_name) {
      updateData.company_name = localData.company_name
    }
    
    if (Object.keys(updateData).length === 0) {
      return
    }
    
    // Add timestamp
    updateData.updated_at = new Date().toISOString()
    
    // Update Supabase
    const { error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Sync error:', error.message)
    }
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

/**
 * Auto Data Sync Component
 */
export default function AutoDataSync() {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  const syncInProgress = useRef(false)
  
  // Sync when navigating between pages
  useEffect(() => {
    if (pathname !== lastPath.current && lastPath.current !== '') {
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
    const interval = setInterval(() => {
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

/**
 * AUTO DATA SYNC - Bidirectional sync between localStorage and Supabase
 * 
 * ✅ Syncs localStorage → Supabase (saves work)
 * ✅ Syncs Supabase → localStorage (restores work on new device/browser)
 * 
 * NO CHANGES to survey pages required - it works with existing localStorage keys.
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'

// All data keys to sync
const DATA_KEYS = [
  'firmographics_data',
  'general_benefits_data',
  'current_support_data',
  'cross_dimensional_data',
  'employee-impact-assessment_data',
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
]

// All completion flags
const COMPLETE_KEYS = [
  'firmographics_complete',
  'auth_completed',
  'general_benefits_complete',
  'current_support_complete',
  'cross_dimensional_complete',
  'employee-impact-assessment_complete',
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
]

// Meta keys for user info
const META_KEYS = [
  'login_company_name',
  'login_email',
  'login_first_name',
  'login_last_name',
  'login_application_id',
  'auth_email',
]

/**
 * Load data FROM Supabase INTO localStorage
 * Called once on mount if localStorage appears empty
 */
async function loadFromSupabase(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      console.log('📥 No user - skipping load from Supabase')
      return false
    }

    console.log('📥 Loading data from Supabase for:', user.email)

    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('email', user.email.toLowerCase())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📥 No existing assessment found - new user')
        return true // Not an error, just no data yet
      }
      throw error
    }

    if (!assessment) {
      console.log('📥 No assessment data')
      return true
    }

    console.log('📥 Found assessment, populating localStorage...')

    // Populate data keys
    DATA_KEYS.forEach(key => {
      const value = assessment[key as keyof typeof assessment]
      if (value && typeof value === 'object' && Object.keys(value).length > 0) {
        localStorage.setItem(key, JSON.stringify(value))
        console.log(`  ✓ Loaded ${key}`)
      }
    })

    // Populate completion flags
    COMPLETE_KEYS.forEach(key => {
      const value = assessment[key as keyof typeof assessment]
      if (value === true) {
        localStorage.setItem(key, 'true')
        console.log(`  ✓ Loaded ${key}: true`)
      }
    })

    // Populate meta keys from assessment
    if (assessment.company_name) {
      localStorage.setItem('login_company_name', assessment.company_name)
    }
    if (assessment.email) {
      localStorage.setItem('login_email', assessment.email)
      localStorage.setItem('auth_email', assessment.email)
    }
    if (assessment.app_id) {
      localStorage.setItem('login_application_id', assessment.app_id)
    }

    // Populate from firmographics_data
    const firmo = assessment.firmographics_data || {}
    if (firmo.firstName) {
      localStorage.setItem('login_first_name', firmo.firstName)
    }
    if (firmo.lastName) {
      localStorage.setItem('login_last_name', firmo.lastName)
    }

    console.log('📥 Load from Supabase complete!')
    return true
  } catch (error) {
    console.error('📥 Load from Supabase failed:', error)
    return false
  }
}

/**
 * Check if localStorage has any survey data
 */
function hasLocalData(): boolean {
  // Check for any data key with content
  for (const key of DATA_KEYS) {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (Object.keys(parsed).length > 0) {
          return true
        }
      } catch {}
    }
  }
  return false
}

/**
 * Collect all survey data from localStorage
 */
function collectAllSurveyData() {
  const updateData: Record<string, any> = {}
  
  console.log('🔍 Scanning localStorage for survey data...')
  
  // Collect data
  DATA_KEYS.forEach(key => {
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
  COMPLETE_KEYS.forEach(key => {
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
 * Sync all localStorage data TO Supabase
 */
async function syncToSupabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('⛔️ No Supabase user - skipping sync')
      return
    }
    
    const updateData = collectAllSurveyData()
    
    if (Object.keys(updateData).length === 0) {
      console.log('⛔️ No data to sync')
      return
    }
    
    console.log(`💾 Syncing ${Object.keys(updateData).length} items to Supabase...`)
    
    updateData.updated_at = new Date().toISOString()
    
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
 * Add to root layout to enable automatic bidirectional syncing
 */
export default function AutoDataSync() {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  const syncInProgress = useRef(false)
  const [initialized, setInitialized] = useState(false)
  
  // ========== NEW: Load from Supabase on mount if localStorage is empty ==========
  useEffect(() => {
    const initializeData = async () => {
      // Check if we already initialized this session
      const alreadyLoaded = sessionStorage.getItem('supabase_data_loaded')
      
      if (alreadyLoaded === 'true') {
        console.log('📥 Already loaded from Supabase this session')
        setInitialized(true)
        return
      }
      
      // Check if localStorage has data
      if (hasLocalData()) {
        console.log('📥 LocalStorage has data - skipping Supabase load')
        sessionStorage.setItem('supabase_data_loaded', 'true')
        setInitialized(true)
        return
      }
      
      // No local data - try to load from Supabase
      console.log('📥 LocalStorage empty - loading from Supabase...')
      const success = await loadFromSupabase()
      
      if (success) {
        sessionStorage.setItem('supabase_data_loaded', 'true')
      }
      
      setInitialized(true)
    }
    
    initializeData()
  }, [])
  
  // Sync when navigating between pages
  useEffect(() => {
    if (!initialized) return
    
    if (pathname !== lastPath.current && lastPath.current !== '') {
      console.log('🔄 Route changed - triggering sync')
      if (!syncInProgress.current) {
        syncInProgress.current = true
        syncToSupabase().finally(() => {
          syncInProgress.current = false
        })
      }
    }
    lastPath.current = pathname
  }, [pathname, initialized])
  
  // Sync every 30 seconds
  useEffect(() => {
    if (!initialized) return
    
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
  }, [initialized])
  
  // Sync before page unload
  useEffect(() => {
    if (!initialized) return
    
    const handleBeforeUnload = () => {
      console.log('💨 Page closing - final sync')
      const data = collectAllSurveyData()
      if (Object.keys(data).length > 0) {
        syncToSupabase()
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [initialized])
  
  return null
}

/**
 * WHAT THIS DOES:
 * 
 * 1. ON PAGE LOAD (new device/browser):
 *    - Checks if localStorage is empty
 *    - If empty, loads ALL data from Supabase
 *    - Populates localStorage so survey sections work
 * 
 * 2. WHILE USER WORKS:
 *    - Syncs localStorage → Supabase every 30 seconds
 *    - Syncs on page navigation
 *    - Syncs before browser closes
 * 
 * This means users can:
 *    ✅ Start survey on laptop
 *    ✅ Continue on phone
 *    ✅ Finish on tablet
 *    ✅ All progress preserved!
 */

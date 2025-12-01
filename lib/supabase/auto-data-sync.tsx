/**
 * AUTO DATA SYNC - Bidirectional sync between localStorage and Supabase
 * 
 * ✅ Syncs localStorage → Supabase (saves work)
 * ✅ Syncs Supabase → localStorage (restores work on new device/browser)
 * ✅ BLOCKS page rendering until data is loaded (fixes redirect issue)
 * 
 * NO CHANGES to survey pages required - it works with existing localStorage keys.
 */

'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
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

/**
 * Load data FROM Supabase INTO localStorage
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
        return true
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

    // Populate meta keys
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
    if (firmo.firstName) localStorage.setItem('login_first_name', firmo.firstName)
    if (firmo.lastName) localStorage.setItem('login_last_name', firmo.lastName)

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
  for (const key of DATA_KEYS) {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (Object.keys(parsed).length > 0) return true
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
  
  DATA_KEYS.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (Object.keys(parsed).length > 0) {
          updateData[key] = parsed
        }
      } catch {}
    }
  })
  
  COMPLETE_KEYS.forEach(key => {
    const value = localStorage.getItem(key)
    if (value === 'true') updateData[key] = true
  })
  
  const companyName = localStorage.getItem('login_company_name')
  if (companyName) updateData.company_name = companyName
  
  return updateData
}

/**
 * Sync all localStorage data TO Supabase
 */
async function syncToSupabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const updateData = collectAllSurveyData()
    if (Object.keys(updateData).length === 0) return
    
    updateData.updated_at = new Date().toISOString()
    
    const { error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('❌ Sync error:', error.message)
    } else {
      console.log('✅ Sync to Supabase successful')
    }
  } catch (error) {
    console.error('❌ Sync failed:', error)
  }
}

/**
 * Auto Data Sync Component
 * 
 * IMPORTANT: This component BLOCKS rendering until data is loaded from Supabase.
 * This ensures redirect logic sees the correct data in localStorage.
 */
export default function AutoDataSync({ children }: { children?: ReactNode }) {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  const syncInProgress = useRef(false)
  const [loading, setLoading] = useState(true)
  
  // Load from Supabase on mount if localStorage is empty
  useEffect(() => {
    const initializeData = async () => {
      const alreadyLoaded = sessionStorage.getItem('supabase_data_loaded')
      
      if (alreadyLoaded === 'true') {
        console.log('📥 Already loaded this session')
        setLoading(false)
        return
      }
      
      if (hasLocalData()) {
        console.log('📥 LocalStorage has data - skipping load')
        sessionStorage.setItem('supabase_data_loaded', 'true')
        setLoading(false)
        return
      }
      
      console.log('📥 Loading from Supabase...')
      await loadFromSupabase()
      sessionStorage.setItem('supabase_data_loaded', 'true')
      setLoading(false)
    }
    
    initializeData()
  }, [])
  
  // Sync on route change
  useEffect(() => {
    if (loading) return
    if (pathname !== lastPath.current && lastPath.current !== '') {
      if (!syncInProgress.current) {
        syncInProgress.current = true
        syncToSupabase().finally(() => { syncInProgress.current = false })
      }
    }
    lastPath.current = pathname
  }, [pathname, loading])
  
  // Sync every 30 seconds
  useEffect(() => {
    if (loading) return
    const interval = setInterval(() => {
      if (!syncInProgress.current) {
        syncInProgress.current = true
        syncToSupabase().finally(() => { syncInProgress.current = false })
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [loading])
  
  // Sync before unload
  useEffect(() => {
    if (loading) return
    const handleUnload = () => syncToSupabase()
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [loading])
  
  // ========== SHOW LOADING SCREEN UNTIL DATA IS READY ==========
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        flexDirection: 'column'
      }}>
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 24 24"
          style={{ 
            animation: 'spin 1s linear infinite',
            color: '#7c3aed',
            marginBottom: '16px'
          }}
        >
          <circle 
            cx="12" cy="12" r="10" 
            stroke="currentColor" 
            strokeWidth="4" 
            fill="none"
            opacity="0.25"
          />
          <path 
            fill="currentColor" 
            opacity="0.75"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
          />
        </svg>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#6b7280', fontWeight: 500, margin: 0 }}>Loading your progress...</p>
      </div>
    )
  }
  
  // Render children if provided (for wrapper usage)
  return children ? <>{children}</> : null
}

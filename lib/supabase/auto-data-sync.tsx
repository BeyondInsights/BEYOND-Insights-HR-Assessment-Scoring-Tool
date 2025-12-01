/**
 * AUTO DATA SYNC - Bidirectional sync between localStorage and Supabase
 * 
 * ✅ Syncs localStorage → Supabase (saves work)
 * ✅ Syncs Supabase → localStorage (restores work on new device/browser)
 * ✅ BLOCKS page rendering until data is loaded (fixes redirect issue)
 * ✅ Syncs payment status, survey_id, and ALL completion flags
 * 
 * NO CHANGES to survey pages required - it works with existing localStorage keys.
 */

'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'

// All JSONB data keys to sync (these are objects)
const DATA_KEYS = [
  'firmographics_data',
  'general_benefits_data',
  'current_support_data',
  'cross_dimensional_data',
  'employee_impact_data',  // Supabase column name (underscore)
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
]

// Alternative key names used in localStorage (hyphenated version)
const LOCAL_STORAGE_ALIASES: Record<string, string> = {
  'employee_impact_data': 'employee-impact-assessment_data',
  'employee_impact_complete': 'employee-impact-assessment_complete',
}

// All completion flags (booleans in Supabase)
const COMPLETE_KEYS = [
  'firmographics_complete',
  'auth_completed',
  'general_benefits_complete',
  'current_support_complete',
  'cross_dimensional_complete',
  'employee_impact_complete',  // Supabase column name
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
]

// Payment and auth keys (critical for dashboard display!)
const PAYMENT_KEYS = [
  'payment_completed',
  'payment_method',
  'payment_date',
  'payment_amount',
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

    console.log('📥 Found assessment, populating localStorage...', assessment)

    // ========== POPULATE DATA KEYS (JSONB objects) ==========
    DATA_KEYS.forEach(key => {
      const value = assessment[key as keyof typeof assessment]
      if (value && typeof value === 'object' && Object.keys(value).length > 0) {
        // Check if this key has a localStorage alias (e.g., employee_impact_data → employee-impact-assessment_data)
        const localKey = LOCAL_STORAGE_ALIASES[key] || key
        localStorage.setItem(localKey, JSON.stringify(value))
        console.log(`  ✓ Loaded ${localKey}`)
      }
    })

    // ========== POPULATE COMPLETION FLAGS (booleans) ==========
    COMPLETE_KEYS.forEach(key => {
      const value = assessment[key as keyof typeof assessment]
      if (value === true) {
        // Check if this key has a localStorage alias
        const localKey = LOCAL_STORAGE_ALIASES[key] || key
        localStorage.setItem(localKey, 'true')
        console.log(`  ✓ Loaded ${localKey}: true`)
      }
    })

    // ========== POPULATE PAYMENT KEYS (CRITICAL!) ==========
    PAYMENT_KEYS.forEach(key => {
      const value = assessment[key as keyof typeof assessment]
      if (value !== null && value !== undefined) {
        if (typeof value === 'boolean') {
          localStorage.setItem(key, value ? 'true' : 'false')
        } else {
          localStorage.setItem(key, String(value))
        }
        console.log(`  ✓ Loaded ${key}: ${value}`)
      }
    })

    // ========== POPULATE META KEYS ==========
    if (assessment.company_name) {
      localStorage.setItem('login_company_name', assessment.company_name)
      console.log('  ✓ Loaded company_name:', assessment.company_name)
    }
    if (assessment.email) {
      localStorage.setItem('login_email', assessment.email)
      localStorage.setItem('auth_email', assessment.email)
      console.log('  ✓ Loaded email:', assessment.email)
    }
    if (assessment.app_id) {
      localStorage.setItem('login_application_id', assessment.app_id)
      localStorage.setItem('survey_id', assessment.app_id)  // CRITICAL for founding partner check!
      console.log('  ✓ Loaded app_id/survey_id:', assessment.app_id)
    }

    // ========== POPULATE FROM FIRMOGRAPHICS_DATA ==========
    const firmo = assessment.firmographics_data || {}
    if (firmo.firstName) {
      localStorage.setItem('login_first_name', firmo.firstName)
    }
    if (firmo.lastName) {
      localStorage.setItem('login_last_name', firmo.lastName)
    }

    // ========== SET AUTH_COMPLETED if we have data ==========
    // If user has firmographics, they completed auth
    if (assessment.firmographics_complete || (firmo && Object.keys(firmo).length > 0)) {
      localStorage.setItem('auth_completed', 'true')
      console.log('  ✓ Set auth_completed: true')
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
  // Check for firmographics as primary indicator
  const firmo = localStorage.getItem('firmographics_data')
  if (firmo) {
    try {
      const parsed = JSON.parse(firmo)
      if (Object.keys(parsed).length > 0) return true
    } catch {}
  }
  
  // Also check for auth_completed flag
  if (localStorage.getItem('auth_completed') === 'true') {
    return true
  }
  
  return false
}

/**
 * Collect all survey data from localStorage for syncing TO Supabase
 */
function collectAllSurveyData() {
  const updateData: Record<string, any> = {}
  
  // Collect JSONB data
  DATA_KEYS.forEach(key => {
    // Check both the direct key and any alias
    const localKey = LOCAL_STORAGE_ALIASES[key] || key
    const value = localStorage.getItem(localKey) || localStorage.getItem(key)
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (Object.keys(parsed).length > 0) {
          updateData[key] = parsed  // Use Supabase column name
        }
      } catch {}
    }
  })
  
  // Collect completion flags
  COMPLETE_KEYS.forEach(key => {
    const localKey = LOCAL_STORAGE_ALIASES[key] || key
    const value = localStorage.getItem(localKey) || localStorage.getItem(key)
    if (value === 'true') {
      updateData[key] = true  // Use Supabase column name
    }
  })
  
  // Collect payment keys
  PAYMENT_KEYS.forEach(key => {
    const value = localStorage.getItem(key)
    if (value !== null) {
      if (value === 'true' || value === 'false') {
        updateData[key] = value === 'true'
      } else {
        updateData[key] = value
      }
    }
  })
  
  // Collect company name
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
    
    // Try to update by user_id first, then by email
    let { error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('user_id', user.id)
    
    if (error) {
      // Fallback: try by email
      const result = await supabase
        .from('assessments')
        .update(updateData)
        .eq('email', user.email?.toLowerCase())
      
      error = result.error
    }
    
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

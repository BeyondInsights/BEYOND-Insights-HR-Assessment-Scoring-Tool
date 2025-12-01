/**
 * AUTO DATA SYNC - Bidirectional sync between localStorage and Supabase
 * 
 * ✅ ALWAYS loads payment status from Supabase (critical for unlocking)
 * ✅ Syncs localStorage → Supabase (saves work)
 * ✅ Syncs Supabase → localStorage (restores work on new device/browser)
 * ✅ BLOCKS page rendering until data is loaded
 */

'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'

// All JSONB data keys to sync
const DATA_KEYS = [
  'firmographics_data',
  'general_benefits_data',
  'current_support_data',
  'cross_dimensional_data',
  'employee_impact_data',
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
]

// All completion flags
const COMPLETE_KEYS = [
  'firmographics_complete',
  'auth_completed',
  'general_benefits_complete',
  'current_support_complete',
  'cross_dimensional_complete',
  'employee_impact_complete',
  ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
]

/**
 * ALWAYS load critical data from Supabase (payment, completion flags)
 * This runs every time, not just when localStorage is empty
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
      console.error('📥 Supabase error:', error)
      throw error
    }

    if (!assessment) {
      console.log('📥 No assessment data')
      return true
    }

    console.log('📥 Found assessment:', assessment.app_id)

    // ========== ALWAYS LOAD PAYMENT STATUS (CRITICAL!) ==========
    if (assessment.payment_completed === true) {
      localStorage.setItem('payment_completed', 'true')
      console.log('  ✓ PAYMENT COMPLETED: true')
    }
    if (assessment.payment_method) {
      localStorage.setItem('payment_method', assessment.payment_method)
      console.log('  ✓ Payment method:', assessment.payment_method)
    }

    // ========== ALWAYS LOAD SURVEY ID (for Founding Partner check) ==========
    if (assessment.app_id) {
      localStorage.setItem('survey_id', assessment.app_id)
      localStorage.setItem('login_application_id', assessment.app_id)
      console.log('  ✓ Survey ID:', assessment.app_id)
    }

    // ========== ALWAYS LOAD AUTH STATUS ==========
    if (assessment.email) {
      localStorage.setItem('auth_email', assessment.email)
      localStorage.setItem('login_email', assessment.email)
      localStorage.setItem('auth_completed', 'true')
      console.log('  ✓ Auth email:', assessment.email)
    }

    // ========== LOAD ALL COMPLETION FLAGS ==========
    COMPLETE_KEYS.forEach(key => {
      const value = assessment[key as keyof typeof assessment]
      if (value === true) {
        // Handle the employee impact key name difference
        let localKey = key
        if (key === 'employee_impact_complete') {
          localKey = 'employee-impact-assessment_complete'
        }
        localStorage.setItem(localKey, 'true')
        console.log(`  ✓ ${localKey}: true`)
      }
    })

    // ========== LOAD JSONB DATA (only if localStorage is empty for that key) ==========
    DATA_KEYS.forEach(key => {
      const value = assessment[key as keyof typeof assessment]
      if (value && typeof value === 'object' && Object.keys(value).length > 0) {
        // Handle the employee impact key name difference
        let localKey = key
        if (key === 'employee_impact_data') {
          localKey = 'employee-impact-assessment_data'
        }
        
        // Only overwrite if localStorage is empty for this key
        const existing = localStorage.getItem(localKey)
        if (!existing || existing === '{}') {
          localStorage.setItem(localKey, JSON.stringify(value))
          console.log(`  ✓ Loaded ${localKey}`)
        }
      }
    })

    // ========== LOAD META DATA ==========
    if (assessment.company_name) {
      localStorage.setItem('login_company_name', assessment.company_name)
    }
    
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
 * Collect all survey data from localStorage for syncing TO Supabase
 */
function collectAllSurveyData() {
  const updateData: Record<string, any> = {}
  
  // Collect JSONB data
  DATA_KEYS.forEach(key => {
    let localKey = key
    if (key === 'employee_impact_data') {
      localKey = 'employee-impact-assessment_data'
    }
    
    const value = localStorage.getItem(localKey)
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
    let localKey = key
    if (key === 'employee_impact_complete') {
      localKey = 'employee-impact-assessment_complete'
    }
    
    const value = localStorage.getItem(localKey)
    if (value === 'true') {
      updateData[key] = true
    }
  })
  
  // Collect payment status
  const paymentCompleted = localStorage.getItem('payment_completed')
  if (paymentCompleted === 'true') {
    updateData.payment_completed = true
  }
  const paymentMethod = localStorage.getItem('payment_method')
  if (paymentMethod) {
    updateData.payment_method = paymentMethod
  }
  
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
    
    // Try update by email (more reliable)
    const { error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq('email', user.email?.toLowerCase())
    
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
 */
export default function AutoDataSync({ children }: { children?: ReactNode }) {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  const syncInProgress = useRef(false)
  const [loading, setLoading] = useState(true)
  
  // ALWAYS load from Supabase on mount (payment status is critical)
  useEffect(() => {
    const initializeData = async () => {
      const alreadyLoaded = sessionStorage.getItem('supabase_data_loaded_v2')
      
      if (alreadyLoaded === 'true') {
        console.log('📥 Already loaded this session')
        setLoading(false)
        return
      }
      
      // ALWAYS load from Supabase - don't skip!
      console.log('📥 Loading from Supabase...')
      await loadFromSupabase()
      sessionStorage.setItem('supabase_data_loaded_v2', 'true')
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
  
  // Loading screen
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
  
  return children ? <>{children}</> : null
}

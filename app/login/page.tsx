/* eslint-disable @next/next/no-img-element */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authenticateUser, getCurrentUser } from '@/lib/supabase/auth'
import { formatAppId } from '@/lib/supabase/utils'
import { supabase } from '@/lib/supabase/client'
import { isFoundingPartner } from '@/lib/founding-partners'
import { isSharedFP, loadSharedFPData } from '@/lib/supabase/fp-shared-storage'
import { loadUserDataFromSupabase } from '@/lib/supabase/load-data-from-supabase'
import { startHydration, endHydration, setStoredVersion, clearDirty, normalizeSurveyId } from '@/lib/supabase/auto-data-sync'
import Footer from '@/components/Footer'

// ============================================
// LOAD USER DATA BY APP_ID - Works for ANY user with data in assessments table
// This replaces the old hardcoded COMPD_USER_IDS list
// ============================================

async function checkAndLoadUserByAppId(surveyId: string, email: string): Promise<{ found: boolean; authCompleted: boolean }> {
  const exact = surveyId?.trim() || ''
  const normalized = surveyId?.replace(/-/g, '').toUpperCase() || ''
  const normalizedEmail = email?.toLowerCase().trim() || ''
  
  try {
    console.log('📥 Checking for existing user by app_id:', exact, 'or', normalized)
    
    // Try BOTH exact and normalized - covers all legacy data formats
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .or(`app_id.eq.${exact},app_id.eq.${normalized},survey_id.eq.${exact},survey_id.eq.${normalized}`)
      .maybeSingle()
    
    if (error) {
      console.error('Error checking user by app_id:', error)
      return { found: false, authCompleted: false }
    }
    
    if (!data) {
      console.log('No existing record found for app_id:', normalized)
      return { found: false, authCompleted: false }
    }
    
    // Verify email matches (security check)
    const dbEmail = (data.email || '').toLowerCase().trim()
    if (dbEmail && normalizedEmail && dbEmail !== normalizedEmail) {
      console.error('Email mismatch - possible unauthorized access attempt')
      console.error(`  DB email: ${dbEmail}, Provided: ${normalizedEmail}`)
      return { found: false, authCompleted: false }
    }
    
    console.log('✅ Found existing record, populating localStorage...')
    
    // Calculate this BEFORE hydration so it's available after
    const inferredAuthComplete = data.auth_completed || 
      data.survey_submitted || 
      (data.firmographics_complete && data.general_benefits_complete && data.current_support_complete && data.dimension1_complete)
    
    // START HYDRATION - prevents auto-sync from marking these writes as "dirty"
    startHydration()
    
    try {
      // Load DATA fields
      if (data.firmographics_data) localStorage.setItem('firmographics_data', JSON.stringify(data.firmographics_data))
      if (data.general_benefits_data) localStorage.setItem('general_benefits_data', JSON.stringify(data.general_benefits_data))
      if (data.current_support_data) localStorage.setItem('current_support_data', JSON.stringify(data.current_support_data))
      if (data.cross_dimensional_data) localStorage.setItem('cross_dimensional_data', JSON.stringify(data.cross_dimensional_data))
      if (data.employee_impact_data) localStorage.setItem('employee-impact-assessment_data', JSON.stringify(data.employee_impact_data))
      for (let i = 1; i <= 13; i++) {
        const dimData = data[`dimension${i}_data`]
        if (dimData) localStorage.setItem(`dimension${i}_data`, JSON.stringify(dimData))
      }
      if (data.company_name) localStorage.setItem('login_company_name', data.company_name)
    
      // Load COMPLETION FLAGS
      if (inferredAuthComplete) {
        localStorage.setItem('auth_completed', 'true')
        console.log('  ✓ Set auth_completed: true (inferred:', !data.auth_completed, ')')
      } else {
        localStorage.removeItem('auth_completed')
      }
      if (data.firmographics_complete) localStorage.setItem('firmographics_complete', 'true')
      if (data.general_benefits_complete) localStorage.setItem('general_benefits_complete', 'true')
      if (data.current_support_complete) localStorage.setItem('current_support_complete', 'true')
      if (data.cross_dimensional_complete) localStorage.setItem('cross_dimensional_complete', 'true')
      if (data.employee_impact_complete) localStorage.setItem('employee-impact-assessment_complete', 'true')
      for (let i = 1; i <= 13; i++) {
        if (data[`dimension${i}_complete`]) localStorage.setItem(`dimension${i}_complete`, 'true')
      }
    
      // Also store payment info if present
      if (data.payment_completed) localStorage.setItem('payment_completed', 'true')
      if (data.payment_method) localStorage.setItem('payment_method', data.payment_method)
    
      // ============================================
      // EMPLOYEE SURVEY OPT-IN & SUBMISSION STATUS
      // Critical to prevent re-asking the question!
      // ============================================
      if (data.employee_survey_opt_in !== null && data.employee_survey_opt_in !== undefined) {
        localStorage.setItem('employee_survey_opt_in', String(data.employee_survey_opt_in))
        console.log('  ✓ Set employee_survey_opt_in:', data.employee_survey_opt_in)
      }
      if (data.survey_submitted) {
        localStorage.setItem('survey_fully_submitted', 'true')
        localStorage.setItem('assessment_completion_shown', 'true')
        console.log('  ✓ Set survey submission flags')
      }
    
      // Invoice data
      if (data.invoice_data) {
        localStorage.setItem('invoice_data', JSON.stringify(data.invoice_data))
        console.log('  ✓ Set invoice_data')
      }
      if (data.invoice_number) {
        localStorage.setItem('current_invoice_number', data.invoice_number)
      }
    
      // First/last name from firmographics
      if (data.firmographics_data) {
        const firmo = data.firmographics_data
        if (firmo.firstName) localStorage.setItem('login_first_name', firmo.firstName)
        if (firmo.lastName) localStorage.setItem('login_last_name', firmo.lastName)
        if (firmo.title) localStorage.setItem('login_title', firmo.title)
      }
    
    } finally {
      // END HYDRATION - re-enable dirty tracking
      endHydration()
      // Set version to match server (prevents false conflict)
      if (data.version) {
        setStoredVersion(data.version)
      }
      // Clear any dirty flag (we just loaded fresh from server)
      clearDirty()
    }
    
    console.log('✅ User data loaded successfully from Supabase')
    return { found: true, authCompleted: inferredAuthComplete }
    
  } catch (error) {
    console.error('Error in checkAndLoadUserByAppId:', error)
    return { found: false, authCompleted: false }
  }
}

// Legacy function name for backwards compatibility
async function loadCompdUserData(surveyId: string): Promise<boolean> {
  const result = await checkAndLoadUserByAppId(surveyId, '')
  return result.found
}

// Legacy check - now always returns false since we check DB directly
function isCompdUser(surveyId: string): boolean {
  return false // No longer use hardcoded list
}
// ============================================

// Helper function to clear localStorage but preserve Supabase auth tokens
const clearLocalStoragePreserveAuth = () => {
  const supabaseKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('sb-') || key.startsWith('supabase'))) {
      supabaseKeys.push(key)
    }
  }
  const preserved: Record<string, string> = {}
  supabaseKeys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) preserved[key] = value
  })
  localStorage.clear()
  Object.entries(preserved).forEach(([key, value]) => {
    localStorage.setItem(key, value)
  })
  console.log('Cleared localStorage but preserved', supabaseKeys.length, 'Supabase auth keys')
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [surveyId, setSurveyId] = useState('')
  const [isNewUser, setIsNewUser] = useState(true)
  const [errors, setErrors] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [generatedAppId, setGeneratedAppId] = useState('')
  const [showAppId, setShowAppId] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors('')
    setSuccessMessage('')
    setGeneratedAppId('')
    setShowAppId(false)
    
    // Validation
    if (!email.trim()) {
      setErrors('Please enter your email address')
      setLoading(false)
      return
    }
    if (!email.includes('@')) {
      setErrors('Please enter a valid email address')
      setLoading(false)
      return
    }
    if (!isNewUser && !surveyId.trim()) {
      setErrors('Please enter your Survey ID')
      setLoading(false)
      return
    }

    const trimmedSurveyId = surveyId.trim().toUpperCase()

    // ============================================
    // CLEAR OLD USER DATA ONLY IF DIFFERENT USER
    // ============================================
    const currentEmail = (email || '').toLowerCase().trim()
    const lastUserEmail = (localStorage.getItem('last_user_email') || '').toLowerCase().trim()
    const currentStoredSurveyId = localStorage.getItem('survey_id') || ''

    // Clear data if EITHER email OR survey_id is different
    // IMPORTANT: Normalize survey IDs before comparing (remove dashes, uppercase)
    // This handles cases like CAC-260210-48518EB vs CAC26021048518EB
    const emailChanged = lastUserEmail && currentEmail && lastUserEmail !== currentEmail
    const surveyIdChanged = !isNewUser && currentStoredSurveyId && trimmedSurveyId && 
      normalizeSurveyId(currentStoredSurveyId) !== normalizeSurveyId(trimmedSurveyId)

    if (emailChanged || surveyIdChanged) {
      console.log('Different user/survey logging in - clearing old data')
      if (emailChanged) console.log(`  Email changed: ${lastUserEmail} → ${currentEmail}`)
      if (surveyIdChanged) console.log(`  Survey ID changed: ${currentStoredSurveyId} → ${trimmedSurveyId}`)
      clearLocalStoragePreserveAuth()
      localStorage.setItem('auth_email', currentEmail)
      localStorage.setItem('last_user_email', currentEmail)
    } else if (currentEmail && !lastUserEmail) {
      localStorage.setItem('last_user_email', currentEmail)
      console.log('First login - setting last_user_email')
    } else {
      console.log('Same user returning - keeping all data')
    }
    // ============================================

    // ============================================
    // CHECK FOR ANY RETURNING USER BY APP_ID
    // This checks the database for any user with matching app_id + email
    // Works for comp'd users, regular users, anyone in the assessments table
    // ============================================
    if (!isNewUser && !isFoundingPartner(trimmedSurveyId) && !isSharedFP(trimmedSurveyId)) {
      console.log('🔍 Checking database for returning user:', trimmedSurveyId)
      
      setSuccessMessage('Checking your progress...')
      const result = await checkAndLoadUserByAppId(trimmedSurveyId, email)
      
      if (result.found) {
        console.log('✅ Found existing user in database!')
        
        // Store login info
        localStorage.setItem('login_email', email)
        localStorage.setItem('auth_email', email)
        localStorage.setItem('survey_id', trimmedSurveyId)
        localStorage.setItem('user_authenticated', 'true')
        localStorage.setItem('last_user_email', email)
        localStorage.setItem('login_Survey_id', trimmedSurveyId)
        
        if (result.authCompleted) {
          setSuccessMessage('✅ Welcome back! Redirecting to dashboard...')
          setTimeout(() => router.push('/dashboard'), 1500)
        } else {
          setSuccessMessage('✅ Found your progress! Redirecting...')
          setTimeout(() => router.push('/letter'), 1500)
        }
        
        setLoading(false)
        return
      }
      // If not found, continue to other checks (Supabase auth, etc.)
      console.log('No existing record found, continuing to standard auth flow...')
    }
    // ============================================

    // ============================================
    // CHECK FOR SHARED FP (uses fp_shared_assessments table)
    // ============================================
    if (!isNewUser && isSharedFP(trimmedSurveyId)) {
      console.log('🏪 Shared FP detected:', trimmedSurveyId)
      
      // Store login info
      localStorage.setItem('login_email', email)
      localStorage.setItem('auth_email', email)
      localStorage.setItem('survey_id', trimmedSurveyId)
      localStorage.setItem('user_authenticated', 'true')
      localStorage.setItem('last_user_email', email)
      localStorage.setItem('login_Survey_id', trimmedSurveyId)
      
      // Load shared data from Supabase
      setSuccessMessage('Loading your team\'s progress...')
      const loaded = await loadSharedFPData(trimmedSurveyId)
      
      // Check if auth completed
      const authCompleted = localStorage.getItem('auth_completed') === 'true'
      
      if (authCompleted) {
        setSuccessMessage('✅ Welcome back! Redirecting to dashboard...')
        setTimeout(() => router.push('/dashboard'), 1500)
      } else {
        setSuccessMessage('✅ Found existing progress! Redirecting...')
        setTimeout(() => router.push('/letter'), 1500)
      }
      setLoading(false)
      return
    }
    // ============================================

    // ============================================
    // CHECK FOR REGULAR FOUNDING PARTNER
    // ============================================
    if (!isNewUser && isFoundingPartner(trimmedSurveyId)) {
      console.log('Founding Partner ID detected:', trimmedSurveyId)
      
      // Set localStorage first
      localStorage.setItem('login_email', email)
      localStorage.setItem('auth_email', email)
      localStorage.setItem('survey_id', trimmedSurveyId)
      localStorage.setItem('user_authenticated', 'true')
      localStorage.setItem('last_user_email', email)
      localStorage.setItem('login_Survey_id', trimmedSurveyId)
      
      // Check if Supabase record exists and create/load accordingly
      setSuccessMessage('Checking your progress...')
      
      try {
        // Import company name function
        const { getFPCompanyName } = await import('@/lib/founding-partners')
        const companyName = getFPCompanyName(trimmedSurveyId)
        
        // Check for existing record by survey_id - try exact first, then normalized
        const normalizedId = trimmedSurveyId.replace(/-/g, '').toUpperCase()
        
        // Try exact survey_id first (most common for FPs)
        let existing = null
        const { data: exactMatch } = await supabase
          .from('assessments')
          .select('*')
          .eq('survey_id', trimmedSurveyId)
          .maybeSingle()
        
        if (exactMatch) {
          existing = exactMatch
          console.log('Found FP by exact survey_id:', trimmedSurveyId)
        } else {
          // Try app_id with normalized version
          const { data: normalizedMatch } = await supabase
            .from('assessments')
            .select('*')
            .eq('app_id', normalizedId)
            .maybeSingle()
          
          if (normalizedMatch) {
            existing = normalizedMatch
            console.log('Found FP by normalized app_id:', normalizedId)
          }
        }
        
        if (existing) {
          // Load existing data to localStorage
          console.log('Found existing FP record - loading ALL data and completion flags')
          console.log('DB record keys:', Object.keys(existing))
          console.log('firmographics_data exists:', !!existing.firmographics_data)
          console.log('dimension1_data exists:', !!existing.dimension1_data)
          
          // START HYDRATION - prevents auto-sync from marking these writes as "dirty"
          startHydration()
          
          try {
            // Load DATA fields
            if (existing.firmographics_data) {
              localStorage.setItem('firmographics_data', JSON.stringify(existing.firmographics_data))
              console.log('  ✓ Set firmographics_data')
            }
            if (existing.general_benefits_data) {
              localStorage.setItem('general_benefits_data', JSON.stringify(existing.general_benefits_data))
              console.log('  ✓ Set general_benefits_data')
            }
            if (existing.current_support_data) {
              localStorage.setItem('current_support_data', JSON.stringify(existing.current_support_data))
              console.log('  ✓ Set current_support_data')
            }
            if (existing.cross_dimensional_data) {
              localStorage.setItem('cross_dimensional_data', JSON.stringify(existing.cross_dimensional_data))
              console.log('  ✓ Set cross_dimensional_data')
            }
            if (existing.employee_impact_data) {
              localStorage.setItem('employee-impact-assessment_data', JSON.stringify(existing.employee_impact_data))
              console.log('  ✓ Set employee_impact_data')
            }
            for (let i = 1; i <= 13; i++) {
              const dimData = existing[`dimension${i}_data`]
              if (dimData) localStorage.setItem(`dimension${i}_data`, JSON.stringify(dimData))
            }
            if (existing.company_name) localStorage.setItem('login_company_name', existing.company_name)
            
            // Load COMPLETION FLAGS
            if (existing.auth_completed) {
              localStorage.setItem('auth_completed', 'true')
            } else {
              localStorage.removeItem('auth_completed')
            }
            if (existing.firmographics_complete) localStorage.setItem('firmographics_complete', 'true')
            if (existing.general_benefits_complete) localStorage.setItem('general_benefits_complete', 'true')
            if (existing.current_support_complete) localStorage.setItem('current_support_complete', 'true')
            if (existing.cross_dimensional_complete) localStorage.setItem('cross_dimensional_complete', 'true')
            if (existing.employee_impact_complete) localStorage.setItem('employee-impact-assessment_complete', 'true')
            for (let i = 1; i <= 13; i++) {
              if (existing[`dimension${i}_complete`]) localStorage.setItem(`dimension${i}_complete`, 'true')
            }
            
            // ============================================
            // EMPLOYEE SURVEY OPT-IN & SUBMISSION STATUS (FP)
            // ============================================
            if (existing.employee_survey_opt_in !== null && existing.employee_survey_opt_in !== undefined) {
              localStorage.setItem('employee_survey_opt_in', String(existing.employee_survey_opt_in))
              console.log('  ✓ Set employee_survey_opt_in:', existing.employee_survey_opt_in)
            }
            if (existing.survey_submitted) {
              localStorage.setItem('survey_fully_submitted', 'true')
              localStorage.setItem('assessment_completion_shown', 'true')
              console.log('  ✓ Set survey submission flags')
            }
            
            // Invoice data (FP)
            if (existing.invoice_data) {
              localStorage.setItem('invoice_data', JSON.stringify(existing.invoice_data))
              console.log('  ✓ Set invoice_data')
            }
            if (existing.invoice_number) {
              localStorage.setItem('current_invoice_number', existing.invoice_number)
            }
            
            // First/last name from firmographics (FP)
            if (existing.firmographics_data) {
              const firmo = existing.firmographics_data
              if (firmo.firstName) localStorage.setItem('login_first_name', firmo.firstName)
              if (firmo.lastName) localStorage.setItem('login_last_name', firmo.lastName)
              if (firmo.title) localStorage.setItem('login_title', firmo.title)
            }
          } finally {
            // END HYDRATION - re-enable dirty tracking
            endHydration()
          }
          
          console.log('✅ Loaded all FP data and completion flags from Supabase')
          
          // Route based on whether they've completed authorization
          if (existing.auth_completed) {
            setSuccessMessage('✅ Welcome back! Redirecting to dashboard...')
            setTimeout(() => {
              router.push('/dashboard')
            }, 1500)
          } else {
            setSuccessMessage('✅ Found your progress! Redirecting...')
            setTimeout(() => {
              router.push('/letter')
            }, 1500)
          }
        } else {
          // Create new FP record
          console.log('Creating new FP record in Supabase')
          const { error } = await supabase
            .from('assessments')
            .insert({
              survey_id: trimmedSurveyId,
              app_id: trimmedSurveyId,
              email: email.toLowerCase(),
              company_name: companyName || 'Founding Partner',
              is_founding_partner: true,
              payment_completed: true,
              payment_method: 'FP Comp',
              payment_amount: 1250.00,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (error) {
            console.error('Error creating FP record:', error)
          } else {
            console.log('FP record created successfully')
          }
          if (companyName) localStorage.setItem('login_company_name', companyName)
          setSuccessMessage('✅ Founding Partner access confirmed! Redirecting...')
          setTimeout(() => {
            // Check if somehow already has auth_completed (edge case)
            const authDone = localStorage.getItem('auth_completed') === 'true'
            router.push(authDone ? '/dashboard' : '/letter')
          }, 1500)
        }
      } catch (err) {
        console.error('Error handling FP login:', err)
        // On error, check if they've already done auth
        const authDone = localStorage.getItem('auth_completed') === 'true'
        setSuccessMessage('✅ Founding Partner access confirmed! Redirecting...')
        setTimeout(() => {
          router.push(authDone ? '/dashboard' : '/letter')
        }, 1500)
      }
      
      setLoading(false)
      return
    }
    // ============================================

    try {
      const result = await authenticateUser(
        currentEmail,
        isNewUser ? undefined : surveyId.trim().replace(/-/g, '')
      )

      if (result.mode === 'error') {
        setErrors(result.message)
      } else {
        // ============================================
        // CLEAR OLD DATA FOR NEW USERS (preserve Supabase auth)
        // ============================================
        if (result.mode === 'new') {
          console.log('New user account - clearing old localStorage data (preserving auth)')
          clearLocalStoragePreserveAuth()
          localStorage.setItem('auth_email', currentEmail)
          localStorage.setItem('login_email', email)
        }
        // ============================================
        
        // Store email in localStorage
        localStorage.setItem('login_email', email)
        localStorage.setItem('auth_email', email)
        localStorage.setItem('user_authenticated', 'true')
        localStorage.setItem('last_user_email', email)
        
        // ============================================
        // FIX: SET BOTH survey_id AND login_Survey_id FOR ALL USERS
        // ============================================
        if (!isNewUser) {
          // Keep original format - normalization is only for comparison
          const userSurveyId = surveyId.trim().toUpperCase()
          localStorage.setItem('survey_id', userSurveyId)
          localStorage.setItem('login_Survey_id', userSurveyId)
          console.log('[LOGIN] Set survey_id for returning user:', userSurveyId)
        }
        // ============================================
        
        // For existing/returning users
        if (result.mode === 'existing' && !result.needsVerification) {
          const user = await getCurrentUser()
          if (user) {
            // CRITICAL: Load all user data from Supabase into localStorage
            console.log('[LOGIN] Loading returning user data from Supabase...')
            await loadUserDataFromSupabase()
            
            const { data: assessment } = await supabase
              .from('assessments')
              .select('auth_completed')
              .eq('user_id', user.id)
              .single()
            
            setSuccessMessage(result.message)
            setTimeout(() => {
              // Check BOTH Supabase AND localStorage for auth_completed
              const dbAuthCompleted = assessment?.auth_completed === true
              const localAuthCompleted = localStorage.getItem('auth_completed') === 'true'
              
              if (dbAuthCompleted || localAuthCompleted) {
                router.push('/dashboard')
              } else {
                router.push('/letter')
              }
            }, 1000)
          }
        } else if (result.mode === 'new') {
          // New user - show App ID and set bypass flag
          setSuccessMessage('Account created successfully!')
          if (result.appId) {
            setGeneratedAppId(result.appId)
            setShowAppId(true)
            localStorage.setItem('survey_id', result.appId)
            localStorage.setItem('login_Survey_id', result.appId)
            localStorage.setItem('new_user_just_created', 'true')
            console.log('[LOGIN] Set survey_id for new user:', result.appId)
          }
        }
      }
    } catch (err) {
      setErrors('An unexpected error occurred. Please try again.')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProceedToSurvey = () => {
    localStorage.setItem('user_authenticated', 'true')
    // If auth already completed (returning user), go to dashboard
    const authDone = localStorage.getItem('auth_completed') === 'true'
    router.push(authDone ? '/dashboard' : '/letter')
  }
    
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-orange-50 flex flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            {/* Header with badge and title */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex-shrink-0">
                <img
                  src="/best-companies-2026-logo.png"
                  alt="Best Companies Award Logo"
                  className="h-40 sm:h-48 lg:h-56 w-auto"
                />
              </div>
              
              <div className="flex-1">
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#F37021] leading-snug">
                  Welcome to the
                </p>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#F37021] leading-snug">
                  Best Companies for<br />
                  Working with Cancer Survey
                </h1>
              </div>
            </div>

            {/* Generated App ID Display */}
            {showAppId && generatedAppId && (
              <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 text-lg mb-2">
                      ✅ You're All Set!
                    </p>
                    <p className="text-sm text-green-800 mb-3 font-semibold">
                      Your unique Survey ID:
                    </p>
                    <div className="bg-white p-4 rounded-lg border-2 border-green-400 mb-4">
                      <p className="text-2xl font-bold text-center text-green-900 font-mono tracking-wider">
                        {formatAppId(generatedAppId)}
                      </p>
                    </div>
                    
                    <div className="mb-4 p-4 border-2 rounded-lg" style={{ backgroundColor: '#C7EAFB', borderColor: '#a8d7f0' }}>
                      <p className="text-sm text-slate-900 font-semibold mb-2">
                        🔐 Important - Save This ID!
                      </p>
                      <p className="text-sm text-slate-800">
                        You can start your Survey right now and work at your own pace. Your progress is automatically saved, so you can stop and return anytime. Just use your email and this Survey ID to pick up exactly where you left off.
                      </p>
                    </div>

                    <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded">
                      <p className="text-xs text-amber-900">
                        <strong>💡 Pro Tip:</strong> Write down your Survey ID or take a screenshot. You'll need it to access your Survey from any device.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleProceedToSurvey}
                      className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg transform hover:scale-105"
                    >
                      Begin Survey Now →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message for returning users */}
            {successMessage && !showAppId && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errors && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800">{errors}</p>
                </div>
              </div>
            )}

            {/* Only show form if App ID hasn't been generated */}
            {!showAppId && (
              <>
                {/* Toggle: New User vs Returning User */}
                <div className="flex gap-2 mb-8 bg-orange-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewUser(true)
                      setErrors('')
                      setSuccessMessage('')
                    }}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                      isNewUser 
                        ? 'bg-white text-slate-900 shadow-md' 
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    New User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewUser(false)
                      setErrors('')
                      setSuccessMessage('')
                    }}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                      !isNewUser 
                        ? 'bg-white text-slate-900 shadow-md' 
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Returning User
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      required
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-[#F37021] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                    />
                  </div>

                  {/* Survey ID Input (for returning users) */}
                  {!isNewUser && (
                    <div>
                      <label htmlFor="surveyId" className="block text-sm font-semibold text-slate-800 mb-2">
                        Survey ID *
                      </label>
                      <input
                        type="text"
                        id="surveyId"
                        value={surveyId}
                        onChange={(e) => setSurveyId(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg font-mono text-lg focus:border-[#F37021] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                        placeholder="CAC-251027-001AB"
                        maxLength={20}
                      />
                      <p className="text-xs text-slate-600 mt-2">
                        Enter your Survey ID (with or without dashes)
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white py-3.5 rounded-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      isNewUser ? 'Start Survey' : 'Continue Survey'
                    )}
                  </button>
                </form>

                {/* Help Text */}
                <div 
                  className="mt-6 space-y-3 text-sm text-slate-800 p-4 rounded-lg border-2"
                  style={{ backgroundColor: '#C7EAFB', borderColor: '#a8d7f0' }}
                >
                  {isNewUser ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-[#F37021]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-bold text-slate-900">New Users - Here's How It Works:</p>
                      </div>
                      <ol className="space-y-2 ml-2">
                        <li className="flex items-start">
                          <span className="font-bold text-[#F37021] mr-2">1.</span>
                          <span>Enter your email and click "Start Survey"</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold text-[#F37021] mr-2">2.</span>
                          <span>You'll receive a unique Survey ID - save it!</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold text-[#F37021] mr-2">3.</span>
                          <span>Begin your Survey right away</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold text-[#F37021] mr-2">4.</span>
                          <span>Your Survey progress saves automatically - stop anytime and come back later</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold text-[#F37021] mr-2">5.</span>
                          <span>To return: Use the "Returning User" option with your email and Survey ID</span>
                        </li>
                      </ol>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-[#F37021]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="font-bold text-slate-900">Welcome Back!</p>
                      </div>
                      <p className="mb-3">
                        To continue your Survey, enter the email address you used when you started, along with your Survey ID.
                      </p>
                      <p className="text-sm bg-white/60 border border-blue-300 rounded p-3">
                        <strong>💾 Don't worry -</strong> All your progress has been saved. You'll pick up exactly where you left off!
                      </p>
                    </div>
                  )}
                  <div className="pt-3 border-t-2" style={{ borderColor: '#a8d7f0' }}>
                    <p className="flex items-start gap-2 text-xs text-slate-700">
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Secure & Private:</strong> Your data is encrypted and protected. Only you can access your Survey using your email and Survey ID combination.</span>
                    </p>
                  </div>
                </div>

                {/* Forgot Survey ID Section */}
                <div className="mt-8 pt-6 border-t border-amber-200 text-center">
                  <p className="text-sm text-slate-700 mb-3">
                    Lost your Survey ID?
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-survey-id')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find My Survey ID →
                  </button>
                </div>
              </>
            )}

            {/* CAC logo */}
            <div className="flex justify-center mt-12">
              <img
                src="/cancer-careers-logo.png"
                alt="Cancer and Careers Logo"
                className="h-12 sm:h-16 lg:h-20 w-auto"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

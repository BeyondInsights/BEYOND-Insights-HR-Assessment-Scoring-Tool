/* eslint-disable @next/next/no-img-element */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authenticateUser, getCurrentUser } from '@/lib/supabase/auth'
import { formatAppId } from '@/lib/supabase/utils'
import { supabase } from '@/lib/supabase/client'
import { isFoundingPartner } from '@/lib/founding-partners'
import Footer from '@/components/Footer'

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

    // ============================================
    // CLEAR OLD USER DATA ONLY IF DIFFERENT USER
    // ============================================
    const currentEmail = (email || '').toLowerCase().trim()
    const lastUserEmail = (localStorage.getItem('last_user_email') || '').toLowerCase().trim()

    if (lastUserEmail && currentEmail && lastUserEmail !== currentEmail) {
      console.log('Different user logging in - clearing old data')
      const emailToKeep = currentEmail
      localStorage.clear()
      localStorage.setItem('auth_email', emailToKeep)
      localStorage.setItem('last_user_email', emailToKeep)
    } else if (currentEmail && !lastUserEmail) {
      localStorage.setItem('last_user_email', currentEmail)
      console.log('First login - setting last_user_email')
    } else {
      console.log('Same user returning - keeping all data')
    }
    // ============================================

    // ============================================
    // CHECK FOR FOUNDING PARTNER ID FIRST
    // ============================================
    if (!isNewUser && isFoundingPartner(surveyId.trim())) {
      console.log('Founding Partner ID detected:', surveyId.trim())
      
      localStorage.setItem('login_email', email)
      localStorage.setItem('auth_email', email)
      localStorage.setItem('survey_id', surveyId.trim())
      localStorage.setItem('user_authenticated', 'true')
      localStorage.setItem('last_user_email', email)
      localStorage.setItem('login_Survey_id', surveyId.trim())
      
      // ✅ QUERY SUPABASE FOR FOUNDING PARTNER DATA (by app_id)
      try {
        const { data: assessment } = await supabase
          .from('assessments')
          .select('*')
          .eq('app_id', surveyId.trim())
          .single()
        
        if (assessment && assessment.firmographics_complete) {
          console.log('✅ Founding Partner data found in Supabase - restoring to localStorage')
          
          // ✅ RESTORE ALL DATA FROM SUPABASE TO LOCALSTORAGE (same as regular users)
          localStorage.setItem('auth_completed', 'true')
          localStorage.setItem('payment_completed', 'true') // FPs are pre-paid
          
          // Restore company info
          if (assessment.company_name) localStorage.setItem('login_company_name', assessment.company_name)
          
          // Restore all survey data
          if (assessment.firmographics_data) {
            localStorage.setItem('firmographics_data', JSON.stringify(assessment.firmographics_data))
          }
          if (assessment.firmographics_complete) {
            localStorage.setItem('firmographics_complete', 'true')
          }
          
          if (assessment.general_benefits_data) {
            localStorage.setItem('general_benefits_data', JSON.stringify(assessment.general_benefits_data))
          }
          if (assessment.general_benefits_complete) {
            localStorage.setItem('general_benefits_complete', 'true')
          }
          
          if (assessment.current_support_data) {
            localStorage.setItem('current_support_data', JSON.stringify(assessment.current_support_data))
          }
          if (assessment.current_support_complete) {
            localStorage.setItem('current_support_complete', 'true')
          }
          
          // Restore all 13 dimensions
          for (let i = 1; i <= 13; i++) {
            const dataKey = `dimension${i}_data`
            const completeKey = `dimension${i}_complete`
            
            if (assessment[dataKey]) {
              localStorage.setItem(dataKey, JSON.stringify(assessment[dataKey]))
            }
            if (assessment[completeKey]) {
              localStorage.setItem(completeKey, 'true')
            }
          }
          
          // Restore cross-dimensional and employee impact
          if (assessment.cross_dimensional_data) {
            localStorage.setItem('cross_dimensional_data', JSON.stringify(assessment.cross_dimensional_data))
          }
          if (assessment.cross_dimensional_complete) {
            localStorage.setItem('cross_dimensional_complete', 'true')
          }
          
          if (assessment.employee_impact_data) {
            localStorage.setItem('employee-impact-assessment_data', JSON.stringify(assessment.employee_impact_data))
          }
          if (assessment.employee_impact_complete) {
            localStorage.setItem('employee-impact-assessment_complete', 'true')
          }
          
          console.log('✅ All Founding Partner data restored to localStorage')
          
          setSuccessMessage('✅ Welcome back! Redirecting to your dashboard...')
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        } else {
          // FP exists but hasn't completed onboarding yet
          console.log('📋 Founding Partner needs to complete onboarding - going to letter')
          setSuccessMessage('✅ Founding Partner access confirmed! Redirecting...')
          setTimeout(() => {
            router.push('/letter')
          }, 1500)
        }
      } catch (error) {
        console.error('Error loading FP data:', error)
        // Fallback - go to letter if we can't load data
        setSuccessMessage('✅ Founding Partner access confirmed! Redirecting...')
        setTimeout(() => {
          router.push('/letter')
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
        // CLEAR OLD DATA FOR NEW USERS
        // ============================================
        if (result.mode === 'new') {
          console.log('New user account created')
          // DON'T clear localStorage - it contains the Supabase session!
        }
        // ============================================
        
        // Store email in localStorage
        localStorage.setItem('login_email', email)
        localStorage.setItem('auth_email', email)
        localStorage.setItem('user_authenticated', 'true')
        localStorage.setItem('last_user_email', email)
        
        if (!isNewUser) {
          localStorage.setItem('login_Survey_id', surveyId)
        }
        
        // ✅ FOR EXISTING/RETURNING USERS - RESTORE ALL DATA AND GO TO DASHBOARD
        if (result.mode === 'existing' && !result.needsVerification) {
          const user = await getCurrentUser()
          if (user) {
            // ✅ CRITICAL: Restore ALL survey data from Supabase to localStorage
            const { data: assessment } = await supabase
              .from('assessments')
              .select('*')
              .eq('user_id', user.id)
              .single()
            
            if (assessment) {
              console.log('🔄 Restoring all survey data to localStorage...')
              
              // Restore completion flags
              if (assessment.auth_completed) localStorage.setItem('auth_completed', 'true')
              if (assessment.payment_completed) localStorage.setItem('payment_completed', 'true')
              if (assessment.payment_method) localStorage.setItem('payment_method', assessment.payment_method)
              
              // ✅ RESTORE SURVEY SUBMISSION FLAGS
              if (assessment.survey_submitted) {
                localStorage.setItem('assessment_completion_shown', 'true')
                localStorage.setItem('survey_fully_submitted', 'true')
              }
              if (assessment.employee_survey_opt_in !== null && assessment.employee_survey_opt_in !== undefined) {
                localStorage.setItem('employee_survey_opt_in', assessment.employee_survey_opt_in.toString())
              }
              
              // Restore company info
              if (assessment.company_name) localStorage.setItem('login_company_name', assessment.company_name)
              
              // Restore all survey data
              if (assessment.firmographics_data) {
                localStorage.setItem('firmographics_data', JSON.stringify(assessment.firmographics_data))
              }
              if (assessment.firmographics_complete) {
                localStorage.setItem('firmographics_complete', 'true')
              }
              
              if (assessment.general_benefits_data) {
                localStorage.setItem('general_benefits_data', JSON.stringify(assessment.general_benefits_data))
              }
              if (assessment.general_benefits_complete) {
                localStorage.setItem('general_benefits_complete', 'true')
              }
              
              if (assessment.current_support_data) {
                localStorage.setItem('current_support_data', JSON.stringify(assessment.current_support_data))
              }
              if (assessment.current_support_complete) {
                localStorage.setItem('current_support_complete', 'true')
              }
              
              // Restore all 13 dimensions
              for (let i = 1; i <= 13; i++) {
                const dataKey = `dimension${i}_data`
                const completeKey = `dimension${i}_complete`
                
                if (assessment[dataKey]) {
                  localStorage.setItem(dataKey, JSON.stringify(assessment[dataKey]))
                }
                if (assessment[completeKey]) {
                  localStorage.setItem(completeKey, 'true')
                }
              }
              
              // Restore cross-dimensional and employee impact
              if (assessment['cross_dimensional_data']) {
                localStorage.setItem('cross_dimensional_data', JSON.stringify(assessment['cross_dimensional_data']))
              }
              if (assessment['cross_dimensional_complete']) {
                localStorage.setItem('cross_dimensional_complete', 'true')
              }
              
              if (assessment.employee_impact_data) {
                localStorage.setItem('employee-impact-assessment_data', JSON.stringify(assessment.employee_impact_data))
              }
              if (assessment.employee_impact_complete) {
                localStorage.setItem('employee-impact-assessment_complete', 'true')
              }
              
              console.log('✅ All survey data restored to localStorage')
            }
            
            setSuccessMessage('✅ Welcome back! Redirecting to your dashboard...')
            setTimeout(() => {
              router.push('/dashboard')
            }, 1000)
          }
        } else if (result.mode === 'new') {
          // New user - show App ID and set bypass flag
          setSuccessMessage('Account created successfully!')
          if (result.appId) {
            setGeneratedAppId(result.appId)
            setShowAppId(true)
            localStorage.setItem('login_Survey_id', result.appId)
            localStorage.setItem('new_user_just_created', 'true')
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
    // Keep all authentication flags set for new user
    localStorage.setItem('user_authenticated', 'true')
    localStorage.setItem('new_user_just_created', 'true')  // Keep this flag
    console.log('🚀 New user proceeding to survey')
    router.push('/letter')
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
                        🔑 Important - Save This ID!
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
                        maxLength={25}
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

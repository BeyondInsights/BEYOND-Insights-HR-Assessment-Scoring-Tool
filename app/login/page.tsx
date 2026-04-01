/* eslint-disable @next/next/no-img-element */
'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authenticateUser, getCurrentUser } from '@/lib/supabase/auth'
import { formatAppId } from '@/lib/supabase/utils'
import { supabase } from '@/lib/supabase/client'
import { isFoundingPartner } from '@/lib/founding-partners'
import { isSharedFP } from '@/lib/supabase/fp-shared-storage'
import { useAssessmentContext } from '@/lib/assessment-context'
import Footer from '@/components/Footer'

// ============================================
// LOAD USER DATA BY APP_ID - Works for ANY user with data in assessments table
// Returns the DB record so the caller can populate context
// ============================================

async function checkAndLoadUserByAppId(surveyId: string, email: string): Promise<{ found: boolean; authCompleted: boolean; record: any | null }> {
  const exact = surveyId?.trim() || ''
  const normalized = surveyId?.replace(/-/g, '').toUpperCase() || ''
  const normalizedEmail = email?.toLowerCase().trim() || ''

  try {
    console.log('[Login] Checking for existing user by app_id:', exact, 'or', normalized)

    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .or(`app_id.eq.${exact},app_id.eq.${normalized},survey_id.eq.${exact},survey_id.eq.${normalized}`)
      .maybeSingle()

    if (error) {
      console.error('Error checking user by app_id:', error)
      return { found: false, authCompleted: false, record: null }
    }

    if (!data) {
      console.log('No existing record found for app_id:', normalized)
      return { found: false, authCompleted: false, record: null }
    }

    // Verify email matches (security check)
    const dbEmail = (data.email || '').toLowerCase().trim()
    if (dbEmail && normalizedEmail && dbEmail !== normalizedEmail) {
      console.error('Email mismatch - possible unauthorized access attempt')
      return { found: false, authCompleted: false, record: null }
    }

    const inferredAuthComplete = data.auth_completed ||
      data.survey_submitted ||
      (data.firmographics_complete && data.general_benefits_complete && data.current_support_complete && data.dimension1_complete)

    console.log('[Login] Found existing record in Supabase')
    return { found: true, authCompleted: !!inferredAuthComplete, record: data }

  } catch (error) {
    console.error('Error in checkAndLoadUserByAppId:', error)
    return { found: false, authCompleted: false, record: null }
  }
}

// ASSESSMENT_WINDOW_CLOSED — Set to false to re-enable login functionality
const ASSESSMENT_WINDOW_CLOSED = false

type Step = 'select' | 'new' | 'returning'
type ReturningVariant = 'continue' | 'review'

export default function LoginPage() {
  const router = useRouter()
  const ctx = useAssessmentContext()

  // Welcome overlay
  const [showWelcome, setShowWelcome] = useState(true)
  const [welcomeFading, setWelcomeFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setWelcomeFading(true), 2000)
    const hideTimer = setTimeout(() => setShowWelcome(false), 2700)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  // Step flow
  const [step, setStep] = useState<Step>('new')
  const [returningVariant, setReturningVariant] = useState<ReturningVariant>('continue')

  // Form state
  const [email, setEmail] = useState('')
  const [surveyId, setSurveyId] = useState('')
  const [errors, setErrors] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [generatedAppId, setGeneratedAppId] = useState('')
  const [showAppId, setShowAppId] = useState(false)
  const [copied, setCopied] = useState(false)

  // Safety net: email already exists
  const [emailExistsWarning, setEmailExistsWarning] = useState(false)
  const [existingSurveyId, setExistingSurveyId] = useState('')
  const [checkingEmail, setCheckingEmail] = useState(false)

  const resetForm = useCallback(() => {
    setEmail('')
    setSurveyId('')
    setErrors('')
    setSuccessMessage('')
    setGeneratedAppId('')
    setShowAppId(false)
    setEmailExistsWarning(false)
    setExistingSurveyId('')
  }, [])

  const goToStep = useCallback((newStep: Step, variant?: ReturningVariant) => {
    resetForm()
    setStep(newStep)
    if (variant) setReturningVariant(variant)
  }, [resetForm])

  // Safety net: check if email already exists (for new user flow)
  const checkEmailExists = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck.includes('@')) return
    setCheckingEmail(true)
    try {
      const { data } = await supabase
        .from('assessments')
        .select('email, survey_id')
        .ilike('email', emailToCheck.trim())
        .limit(1)

      if (data && data.length > 0) {
        setEmailExistsWarning(true)
        setExistingSurveyId(data[0].survey_id || '')
      } else {
        setEmailExistsWarning(false)
        setExistingSurveyId('')
      }
    } catch {
      // Silently fail — don't block registration
    } finally {
      setCheckingEmail(false)
    }
  }, [])

  // Determine isNewUser from step for the handleSubmit logic
  const isNewUser = step === 'new'

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
    const currentEmail = (email || '').toLowerCase().trim()

    // Clear context for any new login
    ctx.clearAll()

    // ============================================
    // CHECK FOR ANY RETURNING USER BY APP_ID
    // ============================================
    if (!isNewUser && !isFoundingPartner(trimmedSurveyId) && !isSharedFP(trimmedSurveyId)) {
      console.log('[Login] Checking database for returning user:', trimmedSurveyId)

      setSuccessMessage('Checking your progress...')
      const result = await checkAndLoadUserByAppId(trimmedSurveyId, email)

      if (result.found && result.record) {
        console.log('[Login] Found existing user in database!')

        ctx.setFullRecord(result.record)
        ctx.setEmail(currentEmail)
        ctx.setSurveyId(trimmedSurveyId)

        if (result.authCompleted) {
          setSuccessMessage('Welcome back! Redirecting to dashboard...')
          setTimeout(() => router.push('/dashboard'), 1500)
        } else {
          setSuccessMessage('Found your progress! Redirecting...')
          setTimeout(() => router.push('/letter'), 1500)
        }

        setLoading(false)
        return
      }
      console.log('No existing record found, continuing to standard auth flow...')
    }
    // ============================================

    // ============================================
    // CHECK FOR SHARED FP
    // ============================================
    if (!isNewUser && isSharedFP(trimmedSurveyId)) {
      console.log('[Login] Shared FP detected:', trimmedSurveyId)

      ctx.setSurveyId(trimmedSurveyId)
      ctx.setEmail(currentEmail)

      setSuccessMessage('Loading your team\'s progress...')
      await ctx.loadFromSupabase(trimmedSurveyId)

      if (ctx.authCompleted) {
        setSuccessMessage('Welcome back! Redirecting to dashboard...')
        setTimeout(() => router.push('/dashboard'), 1500)
      } else {
        setSuccessMessage('Found existing progress! Redirecting...')
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
      console.log('[Login] Founding Partner ID detected:', trimmedSurveyId)

      ctx.setSurveyId(trimmedSurveyId)
      ctx.setEmail(currentEmail)
      ctx.setUserType('fp')

      setSuccessMessage('Checking your progress...')

      try {
        const { getFPCompanyName } = await import('@/lib/founding-partners')
        const fpCompanyName = getFPCompanyName(trimmedSurveyId)

        const normalizedId = trimmedSurveyId.replace(/-/g, '').toUpperCase()
        let existing = null
        const { data: exactMatch } = await supabase
          .from('assessments')
          .select('*')
          .eq('survey_id', trimmedSurveyId)
          .maybeSingle()

        if (exactMatch) {
          existing = exactMatch
        } else {
          const { data: normalizedMatch } = await supabase
            .from('assessments')
            .select('*')
            .eq('app_id', normalizedId)
            .maybeSingle()
          if (normalizedMatch) existing = normalizedMatch
        }

        if (existing) {
          ctx.setFullRecord(existing)

          if (existing.auth_completed) {
            setSuccessMessage('Welcome back! Redirecting to dashboard...')
            setTimeout(() => router.push('/dashboard'), 1500)
          } else {
            setSuccessMessage('Found your progress! Redirecting...')
            setTimeout(() => router.push('/letter'), 1500)
          }
        } else {
          console.log('[Login] Creating new FP record in Supabase')
          const { data: newRecord, error } = await supabase
            .from('assessments')
            .insert({
              survey_id: trimmedSurveyId,
              app_id: trimmedSurveyId,
              email: email.toLowerCase(),
              company_name: fpCompanyName || 'Founding Partner',
              is_founding_partner: true,
              payment_completed: true,
              payment_method: 'FP Comp',
              payment_amount: 1250.00,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (error) {
            console.error('Error creating FP record:', error)
          } else if (newRecord) {
            ctx.setFullRecord(newRecord)
          }
          if (fpCompanyName) ctx.setCompanyName(fpCompanyName)
          ctx.setPaymentCompleted(true)
          ctx.setPaymentMethod('FP Comp')

          setSuccessMessage('Founding Partner access confirmed! Redirecting...')
          setTimeout(() => router.push('/letter'), 1500)
        }
      } catch (err) {
        console.error('Error handling FP login:', err)
        setSuccessMessage('Founding Partner access confirmed! Redirecting...')
        setTimeout(() => router.push(ctx.authCompleted ? '/dashboard' : '/letter'), 1500)
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
        ctx.setEmail(currentEmail)
        ctx.setUserType('regular')

        if (!isNewUser) {
          const userSurveyId = surveyId.trim().toUpperCase()
          ctx.setSurveyId(userSurveyId)
        }

        if (result.mode === 'existing' && !result.needsVerification) {
          const user = await getCurrentUser()
          if (user) {
            console.log('[Login] Loading returning user data from Supabase...')

            const { data: assessment } = await supabase
              .from('assessments')
              .select('*')
              .eq('user_id', user.id)
              .single()

            if (assessment) {
              ctx.setFullRecord(assessment)
            }

            setSuccessMessage(result.message)
            setTimeout(() => {
              const dbAuthCompleted = assessment?.auth_completed === true
              if (dbAuthCompleted || ctx.authCompleted) {
                router.push('/dashboard')
              } else {
                router.push('/letter')
              }
            }, 1000)
          }
        } else if (result.mode === 'new') {
          setSuccessMessage('Account created successfully!')
          if (result.appId) {
            setGeneratedAppId(result.appId)
            setShowAppId(true)
            // Load the full record so context has version, user_id, etc.
            const user = await getCurrentUser()
            if (user) {
              const { data: newAssessment } = await supabase
                .from('assessments')
                .select('*')
                .eq('user_id', user.id)
                .single()
              if (newAssessment) {
                ctx.setFullRecord(newAssessment)
                console.log('[Login] Loaded full record for new user, version:', newAssessment.version)
              }
            }
            // Ensure surveyId is set even if fullRecord didn't have it
            ctx.setSurveyId(result.appId)
            console.log('[Login] Set survey_id for new user:', result.appId)
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
    router.push(ctx.authCompleted ? '/dashboard' : '/letter')
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-orange-50 flex flex-col">
      {/* Welcome Overlay */}
      {showWelcome && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-start pt-[12vh] bg-white transition-opacity duration-700 ${
            welcomeFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="text-center px-6">
            <img
              src="/best-companies-2026-logo.png"
              alt="Best Companies Award Logo"
              className="h-40 sm:h-52 w-auto mx-auto mb-6"
            />
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F37021] leading-tight">
              Welcome to the<br />
              Best Companies for Working with Cancer Initiative
            </h2>
            <p className="text-base text-slate-600 mt-4 max-w-md mx-auto leading-relaxed">
              Thank you for your commitment to supporting employees facing cancer and other serious health conditions.
            </p>
            <p className="text-sm text-slate-400 mt-6">
              A Cancer and Careers Initiative
            </p>
          </div>
        </div>
      )}

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-5">
                <img
                  src="/best-companies-2026-logo.png"
                  alt="Best Companies Award Logo"
                  className="h-32 sm:h-40 w-auto"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F37021] leading-tight">
                The Best Companies for<br />
                Working with Cancer Initiative
              </h1>
              <p className="text-base sm:text-lg text-slate-800 mt-4 max-w-lg mx-auto leading-relaxed font-medium italic">
                Recognizing organizations that excel in supporting employees facing cancer or other serious health conditions.
              </p>
            </div>

            {/* ASSESSMENT_WINDOW_CLOSED — Banner replaces login form when assessment is closed */}
            {ASSESSMENT_WINDOW_CLOSED ? (
              <div className="py-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 text-center">
                  2026 Survey Window Closed
                </h2>
                <div className="space-y-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                  <p>
                    Thank you to all organizations that participated in the 2026 survey.
                  </p>
                  <p>
                    Companies selected for this year&apos;s Best Companies for Working with Cancer will be notified the week of March 9th.
                  </p>
                  <p>
                    Check back the week of March 23rd for the public announcement of recognized companies.
                  </p>
                  <p>
                    Information about the 2027 survey cycle, including the application window and eligibility details, will be announced later this year.
                  </p>
                </div>
                <p className="mt-6 text-sm text-slate-500">
                  If you completed the 2026 survey and have questions about your submission, please contact{' '}
                  <a href="mailto:cacbestcompanies@cew.org" className="text-blue-600 hover:text-blue-800 underline">cacbestcompanies@cew.org</a>.
                </p>
              </div>
            ) : (
            /* ASSESSMENT_WINDOW_CLOSED — Everything below is the active login flow. Set ASSESSMENT_WINDOW_CLOSED = true to disable. */
            <>

            {/* Value Proposition */}
            <div className="mb-8 text-center border-t border-slate-200 pt-6">
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
                Participating employers help set the standard for workplace support, gain valuable benchmarking insights into their policies, programs, and culture, and if certified, will be featured in the 2027 Best Companies for Working with Cancer Index.
              </p>
            </div>

            {/* Toggle: New User vs Returning User */}
            <div className="flex gap-2 mb-8 bg-orange-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  goToStep('new')
                }}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  step === 'new'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                New User
              </button>
              <button
                type="button"
                onClick={() => {
                  goToStep('returning', 'continue')
                }}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  step === 'returning'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Returning User
              </button>
            </div>

            {/* ============================================ */}
            {/* NEW USER FORM                                */}
            {/* ============================================ */}
            {step === 'new' && (
              <div className="animate-fadeIn">
                {/* Generated App ID Display */}
                {showAppId && generatedAppId ? (
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-semibold text-green-900 text-lg mb-2">
                          You&apos;re All Set!
                        </p>
                        <p className="text-sm text-green-800 mb-3 font-semibold">
                          Your unique Survey ID:
                        </p>
                        <div className="bg-white p-4 rounded-lg border-2 border-green-400 mb-4">
                          <p className="text-2xl font-bold text-center text-green-900 font-mono tracking-wider">
                            {formatAppId(generatedAppId)}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(formatAppId(generatedAppId)).then(() => {
                                setCopied(true)
                                setTimeout(() => setCopied(false), 2000)
                              })
                            }}
                            className="mt-3 mx-auto flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                          >
                            {copied ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Survey ID
                              </>
                            )}
                          </button>
                        </div>

                        <div className="mb-4 p-4 border-2 rounded-lg" style={{ backgroundColor: '#C7EAFB', borderColor: '#a8d7f0' }}>
                          <p className="text-sm text-slate-900 font-semibold mb-2">
                            Important - Save This ID!
                          </p>
                          <p className="text-sm text-slate-800">
                            You can start your survey right now and work at your own pace. Your progress is automatically saved, so you can stop and return anytime. Just use your email and this Survey ID to pick up exactly where you left off.
                          </p>
                        </div>

                        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded">
                          <p className="text-xs text-amber-900">
                            <strong>Pro Tip:</strong> Write down your Survey ID or take a screenshot. You&apos;ll need it to access your survey from any device.
                          </p>
                        </div>

                        <button
                          onClick={handleProceedToSurvey}
                          className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
                        >
                          Begin Survey Now
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Success Message */}
                    {successMessage && (
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

                    {/* Safety net: email already exists warning */}
                    {emailExistsWarning && (
                      <div className="mb-6 p-5 bg-amber-50 border-2 border-amber-300 rounded-xl">
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div className="flex-1">
                            <p className="font-semibold text-amber-900 mb-1">
                              This email is already associated with an existing survey.
                            </p>
                            <p className="text-sm text-amber-800 mb-3">
                              If you previously started the survey, you don&apos;t need to register again. Use your existing Survey ID to continue.
                            </p>
                            <button
                              type="button"
                              onClick={() => goToStep('returning', 'continue')}
                              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors"
                            >
                              Switch to Returning User Login
                            </button>
                            <p className="text-xs text-amber-700 mt-3">
                              If you&apos;re registering a different survey for the same organization, please contact{' '}
                              <a href="mailto:cacbestcompanies@cew.org" className="underline">cacbestcompanies@cew.org</a>.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            setEmailExistsWarning(false)
                          }}
                          onBlur={(e) => {
                            if (e.target.value.includes('@')) {
                              checkEmailExists(e.target.value)
                            }
                          }}
                          placeholder="your.email@company.com"
                          required
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-[#F37021] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                        />
                        {checkingEmail && (
                          <p className="text-xs text-slate-400 mt-1">Checking...</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading || emailExistsWarning}
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
                          'Register & Begin'
                        )}
                      </button>
                    </form>

                    {/* How it works */}
                    <div
                      className="mt-6 p-4 rounded-lg border-2 text-sm text-slate-800"
                      style={{ backgroundColor: '#C7EAFB', borderColor: '#a8d7f0' }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-[#F37021]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-bold text-slate-900">Here&apos;s How It Works:</p>
                      </div>
                      <ol className="space-y-2 ml-2">
                        <li className="flex items-start">
                          <span className="font-bold text-[#F37021] mr-2">1.</span>
                          <span>Enter your email and click &quot;Register &amp; Begin&quot;</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold text-[#F37021] mr-2">2.</span>
                          <span>You&apos;ll receive a unique Survey ID — save it!</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold text-[#F37021] mr-2">3.</span>
                          <span>Begin your survey right away</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold text-[#F37021] mr-2">4.</span>
                          <span>Your progress saves automatically — stop anytime and come back later</span>
                        </li>
                      </ol>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* RETURNING USER FORM                          */}
            {/* ============================================ */}
            {step === 'returning' && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  Welcome Back
                </h2>
                <p className="text-slate-600 mb-6">
                  Enter the email address and Survey ID you received when you first registered. Your progress is saved automatically &mdash; you&apos;ll pick up right where you left off.
                </p>

                {/* Success Message */}
                {successMessage && (
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

                <form onSubmit={handleSubmit} className="space-y-6">
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
                      placeholder="e.g., CAC-251202-73411EF"
                      maxLength={20}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Enter your Survey ID (with or without dashes)
                    </p>
                  </div>

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
                      'Continue Survey'
                    )}
                  </button>
                </form>

                {/* Help text */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-600">
                    Can&apos;t find your Survey ID? Check your registration confirmation email, or contact{' '}
                    <a href="mailto:cacbestcompanies@cew.org" className="text-blue-600 hover:text-blue-800 underline font-medium">
                      cacbestcompanies@cew.org
                    </a>{' '}
                    for assistance.
                  </p>
                </div>

                {/* Forgot Survey ID link */}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-survey-id')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find My Survey ID
                  </button>
                </div>
              </div>
            )}

            </>
            /* ASSESSMENT_WINDOW_CLOSED — End of active login flow */
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

      {/* Fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { FP_COMPANY_MAP, isFoundingPartner } from '@/lib/founding-partners'
import Footer from '@/components/Footer'

function FPRegisterContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get('code') || ''
  
  const [consent, setConsent] = useState<'pending' | 'yes' | 'no'>('pending')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    title: '',
  })
  const [loading, setLoading] = useState(true)  // Start true - checking existing registration
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const companyName = FP_COMPANY_MAP[code] || ''
  const isValidCode = isFoundingPartner(code)

  // ============================================
  // CRITICAL: Clear stale localStorage data when survey_id changes
  // This prevents cross-contamination between different companies
  // ============================================
  const clearStaleLocalStorageData = () => {
    const currentStoredId = localStorage.getItem('survey_id')
    
    // If there's existing data for a DIFFERENT survey_id, clear it all
    if (currentStoredId && currentStoredId !== code) {
      console.log(`🧹 FP-REGISTER: Clearing stale data from previous session`)
      console.log(`   Previous survey_id: ${currentStoredId}`)
      console.log(`   New survey_id: ${code}`)
      
      // Clear all survey data keys
      const dataKeysToClear = [
        'firmographics_data',
        'general_benefits_data',
        'current_support_data',
        'cross_dimensional_data',
        'employee-impact-assessment_data',
        ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
      ]
      
      // Clear all completion flags
      const completeKeysToClear = [
        'firmographics_complete',
        'general_benefits_complete',
        'current_support_complete',
        'cross_dimensional_complete',
        'employee-impact-assessment_complete',
        ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
      ]
      
      // Clear auth/login keys that might carry over
      const authKeysToClear = [
        'survey_id',
        'login_Survey_id',
        'login_email',
        'auth_email',
        'login_company_name',
        'login_first_name',
        'login_last_name',
        'login_title',
        'user_authenticated',
        'auth_completed',
        'payment_completed',
        'payment_method',
        'last_user_email',
      ]
      
      const allKeysToClear = [...dataKeysToClear, ...completeKeysToClear, ...authKeysToClear]
      
      let clearedCount = 0
      allKeysToClear.forEach(key => {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key)
          clearedCount++
        }
      })
      
      console.log(`🧹 FP-REGISTER: Cleared ${clearedCount} localStorage keys to prevent cross-contamination`)
      return true // Data was cleared
    }
    
    return false // No stale data to clear
  }
  // ============================================

  // ============================================
  // CHECK FOR EXISTING REGISTRATION ON LOAD
  // ============================================
  useEffect(() => {
    const checkExistingRegistration = async () => {
      if (!isValidCode) {
        setLoading(false)
        return
      }

      // CRITICAL: Clear any stale data from a different survey FIRST
      clearStaleLocalStorageData()

      try {
        // Check if this FP code already has contact info registered
        // IMPORTANT: Fetch ALL survey data, not just email/firmographics
        const { data: existing } = await supabase
          .from('assessments')
          .select('*')  // Get ALL fields to restore full survey state
          .eq('survey_id', code)
          .maybeSingle()

        if (existing?.email && existing?.firmographics_data?.firstName) {
          // Already registered - auto-login and redirect to dashboard
          console.log('Existing registration found - loading all survey data and redirecting to dashboard')
          
          const firmData = existing.firmographics_data as any
          
          // ============================================
          // LOAD AUTH/LOGIN INFO
          // ============================================
          localStorage.setItem('login_email', existing.email)
          localStorage.setItem('auth_email', existing.email)
          localStorage.setItem('survey_id', code)
          localStorage.setItem('login_Survey_id', code)
          localStorage.setItem('user_authenticated', 'true')
          localStorage.setItem('last_user_email', existing.email)
          localStorage.setItem('login_company_name', existing.company_name || companyName || 'Founding Partner')
          localStorage.setItem('login_first_name', firmData.firstName || '')
          localStorage.setItem('login_last_name', firmData.lastName || '')
          localStorage.setItem('login_title', firmData.title || '')
          localStorage.setItem('auth_completed', 'true')
          localStorage.setItem('payment_completed', 'true')
          
          // ============================================
          // LOAD ALL SURVEY DATA FROM SUPABASE
          // ============================================
          console.log('[FP-REGISTER] Loading all survey data into localStorage...')
          
          // Load survey data fields
          const dataFields = [
            { db: 'firmographics_data', local: 'firmographics_data' },
            { db: 'general_benefits_data', local: 'general_benefits_data' },
            { db: 'current_support_data', local: 'current_support_data' },
            { db: 'cross_dimensional_data', local: 'cross_dimensional_data' },
            { db: 'employee_impact_data', local: 'employee-impact-assessment_data' },  // Different names!
            { db: 'dimension1_data', local: 'dimension1_data' },
            { db: 'dimension2_data', local: 'dimension2_data' },
            { db: 'dimension3_data', local: 'dimension3_data' },
            { db: 'dimension4_data', local: 'dimension4_data' },
            { db: 'dimension5_data', local: 'dimension5_data' },
            { db: 'dimension6_data', local: 'dimension6_data' },
            { db: 'dimension7_data', local: 'dimension7_data' },
            { db: 'dimension8_data', local: 'dimension8_data' },
            { db: 'dimension9_data', local: 'dimension9_data' },
            { db: 'dimension10_data', local: 'dimension10_data' },
            { db: 'dimension11_data', local: 'dimension11_data' },
            { db: 'dimension12_data', local: 'dimension12_data' },
            { db: 'dimension13_data', local: 'dimension13_data' },
          ]
          
          dataFields.forEach(({ db, local }) => {
            const value = existing[db]
            if (value && typeof value === 'object' && Object.keys(value).length > 0) {
              localStorage.setItem(local, JSON.stringify(value))
              console.log(`  ✓ Loaded ${db} → ${local}`)
            }
          })
          
          // Load completion flags
          const completeFields = [
            { db: 'firmographics_complete', local: 'firmographics_complete' },
            { db: 'general_benefits_complete', local: 'general_benefits_complete' },
            { db: 'current_support_complete', local: 'current_support_complete' },
            { db: 'cross_dimensional_complete', local: 'cross_dimensional_complete' },
            { db: 'employee_impact_complete', local: 'employee-impact-assessment_complete' },  // Different names!
            { db: 'dimension1_complete', local: 'dimension1_complete' },
            { db: 'dimension2_complete', local: 'dimension2_complete' },
            { db: 'dimension3_complete', local: 'dimension3_complete' },
            { db: 'dimension4_complete', local: 'dimension4_complete' },
            { db: 'dimension5_complete', local: 'dimension5_complete' },
            { db: 'dimension6_complete', local: 'dimension6_complete' },
            { db: 'dimension7_complete', local: 'dimension7_complete' },
            { db: 'dimension8_complete', local: 'dimension8_complete' },
            { db: 'dimension9_complete', local: 'dimension9_complete' },
            { db: 'dimension10_complete', local: 'dimension10_complete' },
            { db: 'dimension11_complete', local: 'dimension11_complete' },
            { db: 'dimension12_complete', local: 'dimension12_complete' },
            { db: 'dimension13_complete', local: 'dimension13_complete' },
          ]
          
          completeFields.forEach(({ db, local }) => {
            if (existing[db] === true) {
              localStorage.setItem(local, 'true')
              console.log(`  ✓ Loaded ${db} → ${local}: true`)
            }
          })
          
          // Load payment info
          if (existing.payment_method) {
            localStorage.setItem('payment_method', existing.payment_method)
          }
          
          console.log('[FP-REGISTER] ✅ All survey data loaded successfully!')
          
          router.push('/dashboard')
          return
        }
      } catch (err) {
        console.error('Error checking registration:', err)
      }
      
      setLoading(false)
    }

    checkExistingRegistration()
  }, [code, isValidCode, companyName, router])
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields')
      setSubmitting(false)
      return
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      setSubmitting(false)
      return
    }

    try {
      // Check if this FP code already has a record (without contact info)
      const { data: existing } = await supabase
        .from('assessments')
        .select('id, firmographics_data')
        .eq('survey_id', code)
        .maybeSingle()

      const displayCompanyName = companyName || 'Founding Partner'

      if (existing) {
        // Merge existing firmographics with new contact info
        const existingFirmographics = existing.firmographics_data || {}
        const mergedFirmographics = {
          ...existingFirmographics,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          title: formData.title.trim(),
          companyName: displayCompanyName,
          contactConsent: true,
          consentDate: new Date().toISOString(),
          registeredAt: new Date().toISOString(),
        }
        
        // Update existing record
        const { error: updateError } = await supabase
          .from('assessments')
          .update({
            email: formData.email.toLowerCase().trim(),
            company_name: displayCompanyName,
            firmographics_data: mergedFirmographics,
            is_founding_partner: true,
            updated_at: new Date().toISOString(),
          })
          .eq('survey_id', code)

        if (updateError) throw updateError
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('assessments')
          .insert({
            email: formData.email.toLowerCase().trim(),
            survey_id: code,
            app_id: code,
            company_name: displayCompanyName,
            is_founding_partner: true,
            payment_completed: true,
            payment_method: 'Founding Partner - Fee Waived',
            firmographics_data: {
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              title: formData.title.trim(),
              companyName: displayCompanyName,
              contactConsent: true,
              consentDate: new Date().toISOString(),
              registeredAt: new Date().toISOString(),
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) throw insertError
      }

      // ============================================
      // CRITICAL: Clear ALL survey data before setting new session
      // This prevents auto-sync from picking up stale data
      // ============================================
      console.log('🧹 FP-REGISTER: Clearing any remaining survey data before new session...')
      const dataKeysToClear = [
        'firmographics_data',
        'general_benefits_data',
        'current_support_data',
        'cross_dimensional_data',
        'employee-impact-assessment_data',
        ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
      ]
      const completeKeysToClear = [
        'firmographics_complete',
        'general_benefits_complete',
        'current_support_complete',
        'cross_dimensional_complete',
        'employee-impact-assessment_complete',
        ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
      ]
      ;[...dataKeysToClear, ...completeKeysToClear].forEach(key => {
        localStorage.removeItem(key)
      })
      // ============================================

      // Auto-login and redirect
      localStorage.setItem('login_email', formData.email.toLowerCase().trim())
      localStorage.setItem('auth_email', formData.email.toLowerCase().trim())
      localStorage.setItem('survey_id', code)
      localStorage.setItem('login_Survey_id', code)
      localStorage.setItem('user_authenticated', 'true')
      localStorage.setItem('last_user_email', formData.email.toLowerCase().trim())
      localStorage.setItem('login_company_name', displayCompanyName)
      localStorage.setItem('login_first_name', formData.firstName.trim())
      localStorage.setItem('login_last_name', formData.lastName.trim())
      localStorage.setItem('login_title', formData.title.trim())
      localStorage.setItem('auth_completed', 'true')
      localStorage.setItem('payment_completed', 'true')
      
      router.push('/dashboard')
      
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
      setSubmitting(false)
    }
  }

  // Handle "No consent" - still let them access dashboard
  const handleNoConsent = () => {
    // Clear any stale data first
    console.log('🧹 FP-REGISTER: Clearing any stale data (no consent flow)...')
    const dataKeysToClear = [
      'firmographics_data',
      'general_benefits_data',
      'current_support_data',
      'cross_dimensional_data',
      'employee-impact-assessment_data',
      ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
    ]
    const completeKeysToClear = [
      'firmographics_complete',
      'general_benefits_complete',
      'current_support_complete',
      'cross_dimensional_complete',
      'employee-impact-assessment_complete',
      ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
    ]
    const currentStoredId = localStorage.getItem('survey_id')
    if (currentStoredId && currentStoredId !== code) {
      ;[...dataKeysToClear, ...completeKeysToClear].forEach(key => {
        localStorage.removeItem(key)
      })
    }
    
    localStorage.setItem('survey_id', code)
    localStorage.setItem('login_Survey_id', code)
    localStorage.setItem('user_authenticated', 'true')
    localStorage.setItem('login_company_name', companyName || 'Founding Partner')
    localStorage.setItem('auth_completed', 'true')
    localStorage.setItem('payment_completed', 'true')
    
    router.push('/dashboard')
  }

  // Loading state - checking for existing registration
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Checking registration...</p>
        </div>
      </div>
    )
  }

  // Invalid code screen
  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-orange-50 flex flex-col">
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl">
            <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Registration Link</h1>
              <p className="text-gray-600 mb-6">
                This registration link is invalid or has expired. Please contact your Cancer and Careers representative for a valid link.
              </p>
              <a
                href="mailto:support@cancerandcareers.org"
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Main page with consent + form
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-orange-50 flex flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <img
                src="/best-companies-2026-logo.png"
                alt="Best Companies Award Logo"
                className="h-24 w-auto mx-auto mb-6"
              />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Founding Partner Registration</h1>
              
              {/* Company Display */}
              {companyName && (
                <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl">
                  <p className="text-sm text-gray-600">Registering for:</p>
                  <p className="text-xl font-bold text-orange-600">{companyName}</p>
                </div>
              )}
            </div>

            {/* Consent Request - Initial View */}
            {consent === 'pending' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <h3 className="font-bold text-blue-900 mb-2">Contact Information Request</h3>
                      <p className="text-sm text-blue-800 mb-3">
                        We would like to add your contact information (<strong>name</strong>, <strong>email address</strong>, and <strong>title</strong>) to the Best Companies for Working with Cancer Initiative database.
                      </p>
                      <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <span className="inline-block w-5 h-5 bg-green-100 rounded-full text-center mr-2">🔒</span>
                          This information will remain <strong>confidential</strong> and only be used to contact you regarding the Best Companies for Working with Cancer Initiative.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 italic text-center">
                  As this is sensitive information, we ask that you consent to having this information added to the database.
                </p>

                <div className="space-y-3">
                  <p className="font-semibold text-gray-900 text-center">Do you consent to provide your contact information?</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setConsent('yes')}
                      className="p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-green-500 hover:bg-green-50 transition-all group"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-900">Yes, I consent</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setConsent('no')}
                      className="p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50 transition-all group"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-900">No, I do not consent</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Form - Shows after consent */}
            {consent === 'yes' && (
              <>
                {/* Consent confirmed badge */}
                <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">Consent provided - Please enter your details below</span>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                        placeholder="First name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                      placeholder="your.name@company.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Job Title <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                      placeholder="e.g., HR Director"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setConsent('pending')}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving & Redirecting...
                        </span>
                      ) : (
                        'Complete Registration & View Dashboard →'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* No Consent - Show option to continue anyway */}
            {consent === 'no' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">No Problem!</h2>
                  <p className="text-gray-600 mb-6">
                    We respect your decision. You can still access your survey dashboard as a Founding Partner.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-700 mb-2">Your Survey ID:</p>
                  <p className="text-2xl font-bold font-mono text-orange-600 tracking-wider">{code}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setConsent('pending')}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                  >
                    ← Go Back
                  </button>
                  <button
                    onClick={handleNoConsent}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
                  >
                    Continue to Dashboard →
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Note */}
            <p className="mt-6 text-xs text-gray-500 text-center">
              Your information is kept confidential and will only be used to contact you regarding the Best Companies for Working with Cancer Initiative.
            </p>

            {/* CAC Logo */}
            <div className="flex justify-center mt-8">
              <img
                src="/cancer-careers-logo.png"
                alt="Cancer and Careers Logo"
                className="h-12 w-auto"
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function FPRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-orange-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <FPRegisterContent />
    </Suspense>
  )
}

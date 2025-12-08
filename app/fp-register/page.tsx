'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Footer from '@/components/Footer'

// Map FP codes to company names
const FP_COMPANY_MAP: Record<string, string> = {
  'FP-HR-410734': 'Google (Alphabet)',
  'FP-HR-554736': 'Haymarket',
  'FP-HR-267233': 'ICBC-AXA Life',
  'FP-HR-602569': 'Lloyds Bank (Group)',
  'FP-HR-708691': 'Memorial',
  'FP-HR-982631': 'Merck',
  'FP-HR-405810': 'Nestlé',
  'FP-HR-532408': 'Pfizer',
  'FP-HR-087371': 'Publicis',
  'FP-HR-740095': 'Sanofi',
  'FP-HR-316326': 'Stellantis',
  'FP-HR-385190': "L'Oréal",
  'FP-HR-394644': 'Ford Motor',
  'FP-HR-847263': 'Citi',
  'FP-HR-519842': 'Haleon',
  'FP-HR-376491': 'Mars',
  'FP-HR-628157': 'Renault',
  // Test accounts - remove after testing
  'TEST-FP-001': 'Test Company (Internal Review)',
  'TEST-FP-002': 'Test Company (Client Review)',
}

function FPRegisterContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code') || ''
  
  const [consent, setConsent] = useState<'pending' | 'yes' | 'no'>('pending')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    title: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const companyName = FP_COMPANY_MAP[code] || ''
  const isValidCode = !!companyName

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      // Check if this FP code already has a registration
      const { data: existing } = await supabase
        .from('assessments')
        .select('id, email')
        .eq('survey_id', code)
        .single()

      if (existing) {
        // Update existing record with contact info
        const { error: updateError } = await supabase
          .from('assessments')
          .update({
            email: formData.email.toLowerCase().trim(),
            company_name: companyName,
            firmographics_data: {
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              title: formData.title.trim(),
              companyName: companyName,
              contactConsent: true,
              consentDate: new Date().toISOString(),
              registeredAt: new Date().toISOString(),
            },
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
            company_name: companyName,
            is_founding_partner: true,
            payment_completed: true,
            payment_method: 'Founding Partner - Fee Waived',
            firmographics_data: {
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              title: formData.title.trim(),
              companyName: companyName,
              contactConsent: true,
              consentDate: new Date().toISOString(),
              registeredAt: new Date().toISOString(),
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) throw insertError
      }

      setSuccess(true)
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
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

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-orange-50 flex flex-col">
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl">
            <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Registration Complete!</h1>
              <p className="text-gray-600 mb-6">
                Thank you for registering as a Founding Partner. Your contact information has been saved.
              </p>
              
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
                <p className="text-sm text-gray-700 mb-2">Your Survey ID:</p>
                <p className="text-2xl font-bold font-mono text-orange-600 tracking-wider">{code}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-800">
                  <strong>Next Steps:</strong> Use this Survey ID along with your email address to log in and complete the Best Companies for Working with Cancer survey.
                </p>
              </div>

              <a
                href="/"
                className="inline-block px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                Go to Survey Login →
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Declined consent screen
  if (consent === 'no') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-orange-50 flex flex-col">
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl">
            <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">No Problem!</h1>
              <p className="text-gray-600 mb-6">
                We respect your decision. You can still participate in the Best Companies for Working with Cancer survey as a Founding Partner.
              </p>
              
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
                <p className="text-sm text-gray-700 mb-2">Your Survey ID:</p>
                <p className="text-2xl font-bold font-mono text-orange-600 tracking-wider">{code}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-800">
                  <strong>To access the survey:</strong> Go to the login page and select "Returning User". Enter any email address and the Survey ID above to begin.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setConsent('pending')}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  ← Go Back
                </button>
                <a
                  href="/"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  Go to Survey Login →
                </a>
              </div>
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
                className="h-32 w-auto mx-auto mb-6"
              />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Founding Partner Registration
              </h1>
            </div>

            {/* Company Badge */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-4 mb-8 text-center">
              <p className="text-sm text-gray-600 mb-1">Registering for:</p>
              <p className="text-xl font-bold text-orange-600">{companyName}</p>
            </div>

            {/* Consent Section - Always visible when pending */}
            {consent === 'pending' && (
              <div className="mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-base text-blue-900 font-bold">
                      Contact Information Request
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4">
                    We would like to add your contact information (<strong>name</strong>, <strong>email address</strong>, and <strong>title</strong>) to the Best Companies for Working with Cancer Initiative database.
                  </p>
                  
                  <div className="flex items-start gap-2 mb-4 p-3 bg-white/60 rounded-lg border border-blue-100">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-700">
                      This information will remain <strong>confidential</strong> and only be used to contact you regarding the Best Companies for Working with Cancer Initiative.
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-600 italic">
                    As this is sensitive information, we ask that you consent to having this information added to the database.
                  </p>
                </div>

                <p className="text-base font-semibold text-gray-900 mb-4 text-center">
                  Do you consent to provide your contact information?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            )}

            {/* Contact Form - Only shows after consent */}
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
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        'Complete Registration'
                      )}
                    </button>
                  </div>
                </form>
              </>
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

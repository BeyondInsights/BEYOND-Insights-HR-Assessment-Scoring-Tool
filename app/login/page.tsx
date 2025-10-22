/* eslint-disable @next/next/no-img-element */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authenticateUser } from '@/lib/supabase/auth'
import { sendAppIdReminder } from '@/lib/supabase/appIdReminder'
import { formatAppId } from '@/lib/supabase/utils'
import Footer from '@/components/Footer'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [isNewUser, setIsNewUser] = useState(true)
  const [errors, setErrors] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [generatedAppId, setGeneratedAppId] = useState('')
  
  // Forgot App ID states
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [reminderEmail, setReminderEmail] = useState('')
  const [reminderMessage, setReminderMessage] = useState('')
  const [reminderLoading, setReminderLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors('')
    setSuccessMessage('')
    setGeneratedAppId('')
    
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
    if (!isNewUser && !applicationId.trim()) {
      setErrors('Please enter your Application ID')
      setLoading(false)
      return
    }

    try {
      const result = await authenticateUser(
        email.trim(),
        isNewUser ? undefined : applicationId.trim().replace(/-/g, '')
      )

      if (result.mode === 'error') {
        setErrors(result.message)
      } else {
        // Store email in localStorage
        localStorage.setItem('login_email', email)
        localStorage.setItem('auth_email', email)
        
        if (!isNewUser) {
          localStorage.setItem('login_application_id', applicationId)
        }
        
        // If existing user and no verification needed, redirect immediately!
        if (result.mode === 'existing' && !result.needsVerification) {
          setSuccessMessage(result.message)
          // Wait 1 second to show success message, then redirect
          setTimeout(() => {
            router.push('/authorization')
          }, 1000)
        } else {
          // New user - needs verification
          setSuccessMessage(result.message)
          
          // Show generated App ID for new users
          if (result.mode === 'new' && result.appId) {
            setGeneratedAppId(result.appId)
            localStorage.setItem('login_application_id', result.appId)
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

  const handleSendReminder = async () => {
    if (!reminderEmail.trim() || !reminderEmail.includes('@')) {
      setReminderMessage('Please enter a valid email address')
      return
    }

    setReminderLoading(true)
    setReminderMessage('')

    const result = await sendAppIdReminder(reminderEmail)
    
    setReminderMessage(result.message)
    setReminderLoading(false)

    if (result.success) {
      setTimeout(() => {
        setShowReminderForm(false)
        setReminderEmail('')
        setReminderMessage('')
      }, 5000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50 flex flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl relative">
          {/* Award badge */}
          <div className="flex justify-center -mt-16 mb-[-1rem]">
            <div className="bg-white rounded-full p-3 shadow-lg">
              <img
                src="/best-companies-2026-logo.png"
                alt="Best Companies Award Logo"
                className="h-28 sm:h-36 lg:h-40 w-auto"
              />
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-center text-gray-900 leading-snug mb-3">
              Welcome to the<br />
              <span className="text-orange-600">
                Best Companies for<br />
                Working with Cancer Index
              </span><br />
              Assessment
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Enter your information to access the assessment
            </p>

            {/* Generated App ID Display */}
            {generatedAppId && (
              <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 mb-2">
                      Account Created Successfully!
                    </p>
                    <p className="text-sm text-green-800 mb-3">
                      Your Application ID is:
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-green-300">
                      <p className="text-2xl font-bold text-center text-green-900 font-mono tracking-wider">
                        {formatAppId(generatedAppId)}
                      </p>
                    </div>
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        <strong>⚠️ Save this ID!</strong> You'll need it to access your assessment from other devices. Check your email for a verification link.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && !generatedAppId && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      {successMessage.includes('Redirecting') ? 'Success!' : 'Check Your Email'}
                    </p>
                    <p className="text-sm text-blue-800">
                      {successMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errors && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm">{errors}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewUser(true)
                    setApplicationId('')
                    setErrors('')
                  }}
                  className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                    isNewUser 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  New Users
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewUser(false)
                    setErrors('')
                  }}
                  className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                    !isNewUser 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Returning Users
                </button>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="your.email@company.com"
                />
              </div>

              {/* Application ID - Only show if returning user */}
              {!isNewUser && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Application ID from CAC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value.toUpperCase())}
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="CAC-251022-001AB"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter your Application ID (with or without dashes)
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#007B9E' }}
                className="w-full text-white py-3.5 rounded-lg font-semibold hover:opacity-90 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                  isNewUser ? 'Start Assessment' : 'Continue to Assessment'
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 space-y-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {isNewUser ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-semibold text-gray-900">For New Users:</p>
                  </div>
                  <p className="mb-2">
                    Enter your email address and click "Start Assessment". We will:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Create a unique Application ID for you</li>
                    <li>Send you a secure verification link to your email</li>
                    <li>Once verified, you can begin your assessment</li>
                  </ul>
                  <div className="mt-3 flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Important: Save your Application ID! You'll need it to access your assessment from other devices.</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="font-semibold text-gray-900">For Returning Users:</p>
                  </div>
                  <p className="mb-2">
                    Enter both your email address and Application ID (shown below), then click "Continue to Assessment".
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    You'll be logged in instantly - no need to wait for an email!
                  </p>
                </div>
              )}
              <div className="pt-3 border-t border-gray-300">
                <p className="flex items-center gap-1.5 text-xs text-gray-600">
                  <svg className="w-4 h-4 text-teal-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Security:</span> Your data is encrypted and private. We use secure magic links for authentication - no passwords needed!
                </p>
              </div>
            </div>

            {/* Forgot App ID Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              {!showReminderForm ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Can't find your Application ID?
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowReminderForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email me my Application ID
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Retrieve Your Application ID
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Enter your email and we'll send you your Application ID along with a link to continue your assessment.
                  </p>
                  
                  <div className="space-y-3">
                    <input
                      type="email"
                      value={reminderEmail}
                      onChange={(e) => setReminderEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      disabled={reminderLoading}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    
                    {reminderMessage && (
                      <div className={`p-3 rounded-lg text-sm ${
                        reminderMessage.includes('sent') 
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        {reminderMessage}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSendReminder}
                        disabled={reminderLoading}
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reminderLoading ? 'Sending...' : 'Send Reminder'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowReminderForm(false)
                          setReminderEmail('')
                          setReminderMessage('')
                        }}
                        disabled={reminderLoading}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

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

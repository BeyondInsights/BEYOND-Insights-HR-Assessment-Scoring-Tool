/* eslint-disable @next/next/no-img-element */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authenticateUser } from '@/lib/supabase/auth'
import { formatAppId } from '@/lib/supabase/utils'
import { supabase } from '@/lib/supabase/client'
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
  const [showAppId, setShowAppId] = useState(false)
  
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
  localStorage.setItem('user_authenticated', 'true')
  
  if (!isNewUser) {
    localStorage.setItem('login_application_id', applicationId)
  }
  
  // For existing/returning users - check letter status before redirecting
  if (result.mode === 'existing' && !result.needsVerification) {
    // Check if they've seen the letter
    const user = await getCurrentUser()
    if (user) {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('letter_viewed')
        .eq('user_id', user.id)
        .single()
      
      setSuccessMessage(result.message)
      setTimeout(() => {
        // Send to letter if not viewed, otherwise skip to authorization
        router.push(!assessment?.letter_viewed ? '/letter' : '/authorization')
      }, 1000)
    }
  } else if (result.mode === 'new') {
    // New user - show App ID and let them proceed to letter
    setSuccessMessage('Account created successfully!')
    if (result.appId) {
      setGeneratedAppId(result.appId)
      setShowAppId(true)
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

  const handleProceedToAssessment = () => {
  localStorage.setItem('user_authenticated', 'true')
  localStorage.setItem('auth_completed', 'true')
  router.push('/letter')  // Changed from /authorization
}

  const handleSendReminder = async () => {
    if (!reminderEmail.trim() || !reminderEmail.includes('@')) {
      setReminderMessage('Please enter a valid email address')
      return
    }

    setReminderLoading(true)
    setReminderMessage('')

    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('app_id')
        .eq('email', reminderEmail.toLowerCase().trim())
        .single()

      if (error || !data) {
        setReminderMessage('No account found with that email address')
        setReminderLoading(false)
        return
      }

      const formattedId = formatAppId(data.app_id)
      setReminderMessage(`Your Application ID is: ${formattedId}`)
      setReminderLoading(false)
    } catch (err) {
      setReminderMessage('Error retrieving Application ID. Please try again.')
      setReminderLoading(false)
    }
  }
    
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50 flex flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
  <div className="w-full max-w-3xl">
    {/* Login Card */}
    <div className="bg-white rounded-2xl shadow-2xl p-10">
      {/* Header with badge and title side by side */}
      <div className="flex items-center justify-center gap-6 mb-8">
        {/* Award badge on the left */}
        <div className="flex-shrink-0">
          <img
            src="/best-companies-2026-logo.png"
            alt="Best Companies Award Logo"
            className="h-32 sm:h-36 lg:h-40 w-auto"
          />
        </div>
        
        {/* Title on the right */}
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-snug">
            Welcome to the<br />
            <span className="text-orange-600">
              Best Companies for<br />
              Working with Cancer Index
            </span><br />
            Assessment
          </h2>
        </div>
      </div>
      
      <p className="text-center text-gray-600 mb-8">
        Enter your information to begin or continue your assessment
      </p>

            {/* Generated App ID Display - Only show AFTER account creation */}
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
                      Your unique Application ID:
                    </p>
                    <div className="bg-white p-4 rounded-lg border-2 border-green-400 mb-4">
                      <p className="text-2xl font-bold text-center text-green-900 font-mono tracking-wider">
                        {formatAppId(generatedAppId)}
                      </p>
                    </div>
                    
                    <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                      <p className="text-sm text-blue-900 font-semibold mb-2">
                        📝 Important - Save This ID!
                      </p>
                      <p className="text-sm text-blue-800">
                        You can start your assessment right now and work at your own pace. Your progress is automatically saved, so you can stop and return anytime. Just use your email and this Application ID to pick up exactly where you left off.
                      </p>
                    </div>

                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                      <p className="text-xs text-yellow-900">
                        <strong>💡 Pro Tip:</strong> Write down your Application ID or take a screenshot. You'll need it to access your assessment from any device.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleProceedToAssessment}
                      className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg transform hover:scale-105"
                    >
                      Begin Assessment Now →
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
                <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewUser(true)
                      setErrors('')
                      setSuccessMessage('')
                    }}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      isNewUser 
                        ? 'bg-white text-orange-600 shadow-md' 
                        : 'text-gray-600 hover:text-gray-900'
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
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      !isNewUser 
                        ? 'bg-white text-orange-600 shadow-md' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Returning User
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                    />
                  </div>

                  {/* App ID Input (for returning users) */}
                  {!isNewUser && (
                    <div>
                      <label htmlFor="applicationId" className="block text-sm font-semibold text-gray-700 mb-2">
                        Application ID *
                      </label>
                      <input
                        type="text"
                        id="applicationId"
                        value={applicationId}
                        onChange={(e) => setApplicationId(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-mono text-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                        placeholder="CAC-251027-001AB"
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
                      isNewUser ? 'Start Assessment' : 'Continue Assessment'
                    )}
                  </button>
                </form>

                {/* Help Text */}
                <div className="mt-6 space-y-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {isNewUser ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-bold text-gray-900">New Users - Here's How It Works:</p>
                      </div>
                      <ol className="space-y-2 ml-2">
                        <li className="flex items-start">
                          <span className="font-bold text-orange-600 mr-2">1.</span>
                          <span>Enter your email and click "Start Assessment"</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold text-orange-600 mr-2">2.</span>
                          <span>You'll receive a unique Application ID - save it!</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold text-orange-600 mr-2">3.</span>
                          <span>Begin your assessment right away</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold text-orange-600 mr-2">4.</span>
                          <span>Your progress saves automatically - stop anytime and come back later</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-bold text-orange-600 mr-2">5.</span>
                          <span>To return: Use the "Returning User" option with your email and Application ID</span>
                        </li>
                      </ol>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="font-bold text-gray-900">Welcome Back!</p>
                      </div>
                      <p className="mb-3">
                        To continue your assessment, enter the email address you used when you started, along with your Application ID.
                      </p>
                      <p className="text-sm bg-blue-50 border border-blue-200 rounded p-3">
                        <strong>💾 Don't worry -</strong> All your progress has been saved. You'll pick up exactly where you left off!
                      </p>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-300">
                    <p className="flex items-start gap-2 text-xs text-gray-600">
                      <svg className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Secure & Private:</strong> Your data is encrypted and protected. Only you can access your assessment using your email and Application ID combination.</span>
                    </p>
                  </div>
                </div>

                {/* Forgot App ID Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  {!showReminderForm ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-3">
                        Lost your Application ID?
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowReminderForm(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send my Application ID to my email
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Retrieve Your Application ID
                      </h3>
                      <p className="text-xs text-gray-600 mb-4">
                        Enter the email address you used when you started, and we'll send you your Application ID.
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
                            {reminderLoading ? 'Sending...' : 'Send My ID'}
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

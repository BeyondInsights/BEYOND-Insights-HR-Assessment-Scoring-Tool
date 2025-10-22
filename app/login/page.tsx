'use client'
import { useState } from 'react'
import { authenticateUser } from '@/lib/supabase/auth'
import { formatAppId } from '@/lib/supabase/utils'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [appId, setAppId] = useState('')
  const [isNewUser, setIsNewUser] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [generatedAppId, setGeneratedAppId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    setGeneratedAppId('')

    try {
      const result = await authenticateUser(
        email.trim(),
        isNewUser ? undefined : appId.trim().replace(/-/g, '')
      )

      if (result.mode === 'error') {
        setError(result.message)
      } else {
        // Store email for later use
        localStorage.setItem('login_email', email.trim())
        
        setMessage(result.message)
        
        // Show app_id prominently for new users
        if (result.mode === 'new' && result.appId) {
          setGeneratedAppId(result.appId)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Cancer Assessment
              </h1>
              <p className="text-gray-600">
                Employer Support Index
              </p>
            </div>

            {/* Toggle: New vs Returning */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setIsNewUser(true)
                  setMessage('')
                  setError('')
                  setAppId('')
                }}
                className={`flex-1 py-2.5 rounded-md font-medium transition-all ${
                  isNewUser
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                New Assessment
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsNewUser(false)
                  setMessage('')
                  setError('')
                  setGeneratedAppId('')
                }}
                className={`flex-1 py-2.5 rounded-md font-medium transition-all ${
                  !isNewUser
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Continue Assessment
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="your.email@company.com"
                />
              </div>

              {/* App ID Input (for returning users) */}
              {!isNewUser && (
                <div>
                  <label htmlFor="appId" className="block text-sm font-medium text-gray-700 mb-2">
                    Application ID
                  </label>
                  <input
                    id="appId"
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value.toUpperCase())}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="CAC-251022-001AB"
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter your Application ID (with or without dashes)
                  </p>
                </div>
              )}

              {/* Success Message - App ID Display */}
              {generatedAppId && (
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
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
                          <strong>⚠️ Save this ID!</strong> You'll need it to access your assessment from other devices.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {message && !generatedAppId && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-800">{message}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="space-y-3 text-xs text-gray-600">
                <p>
                  <strong className="text-gray-900">New Users:</strong> Enter your email to start. 
                  We'll send you a verification link and create your Application ID.
                </p>
                <p>
                  <strong className="text-gray-900">Returning Users:</strong> Enter your email and 
                  Application ID to continue where you left off.
                </p>
                <p className="pt-2 text-gray-500">
                  🔒 Your data is secure and private. We use magic links for authentication - no passwords needed!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

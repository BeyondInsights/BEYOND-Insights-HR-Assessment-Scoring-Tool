/* eslint-disable @next/next/no-img-element */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authenticateUser } from '@/lib/supabase/auth'
import { formatAppId } from '@/lib/supabase/utils'
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

    const currentEmail = email.toLowerCase().trim()

    // Check for Founding Partner
    if (!isNewUser && isFoundingPartner(surveyId.trim())) {
      localStorage.setItem('login_email', email)
      localStorage.setItem('auth_email', email)
      localStorage.setItem('survey_id', surveyId.trim())
      localStorage.setItem('user_authenticated', 'true')
      localStorage.setItem('login_Survey_id', surveyId.trim())
      
      setSuccessMessage('Founding Partner access confirmed! Redirecting...')
      setTimeout(() => router.push('/letter'), 1500)
      setLoading(false)
      return
    }

    try {
      const result = await authenticateUser(
        currentEmail,
        isNewUser ? undefined : surveyId.trim().replace(/-/g, '')
      )

      if (result.mode === 'error') {
        setErrors(result.message)
      } else {
        localStorage.setItem('login_email', email)
        localStorage.setItem('auth_email', email)
        localStorage.setItem('user_authenticated', 'true')
        
        if (!isNewUser) {
          localStorage.setItem('login_Survey_id', surveyId)
        }
        
        if (result.mode === 'existing') {
          setSuccessMessage(result.message)
          setTimeout(() => router.push('/dashboard'), 1000)
        } else if (result.mode === 'new') {
          setSuccessMessage('Account created successfully!')
          if (result.appId) {
            setGeneratedAppId(result.appId)
            setShowAppId(true)
            localStorage.setItem('login_Survey_id', result.appId)
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
    router.push('/letter')
  }
    
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-orange-50 flex flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-2xl shadow-2xl p-10">
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

            {showAppId && generatedAppId && (
              <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 text-lg mb-2">
                      You're All Set!
                    </p>
                    <p className="text-sm text-green-800 mb-3 font-semibold">
                      Your unique Survey ID:
                    </p>
                    <div className="bg-white p-4 rounded-lg border-2 border-green-400 mb-4">
                      <p className="text-2xl font-bold text-center text-green-900 font-mono tracking-wider">
                        {formatAppId(generatedAppId)}
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
            )}

            {successMessage && !showAppId && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            {errors && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-sm text-red-800">{errors}</p>
              </div>
            )}

            {!showAppId && (
              <>
                <div className="flex gap-2 mb-8 bg-orange-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => { setIsNewUser(true); setErrors(''); setSuccessMessage(''); }}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                      isNewUser ? 'bg-white text-slate-900 shadow-md' : 'text-slate-700'
                    }`}
                  >
                    New User
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsNewUser(false); setErrors(''); setSuccessMessage(''); }}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                      !isNewUser ? 'bg-white text-slate-900 shadow-md' : 'text-slate-700'
                    }`}
                  >
                    Returning User
                  </button>
                </div>

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
                      required
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-[#F37021] focus:ring-2 focus:ring-orange-100 outline-none"
                    />
                  </div>

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
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg font-mono text-lg"
                        maxLength={20}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white py-3.5 rounded-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 shadow-lg"
                  >
                    {loading ? 'Processing...' : (isNewUser ? 'Start Survey' : 'Continue Survey')}
                  </button>
                </form>
              </>
            )}

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

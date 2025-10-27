'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('assessments')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Database check error:', checkError)
        throw new Error(`Database check failed: ${checkError.message}`)
      }

      if (existingUser) {
        // Returning user
        localStorage.setItem('login_email', email.toLowerCase())
        localStorage.setItem('login_company_name', existingUser.company_name || companyName)
        localStorage.setItem('user_id', existingUser.id)
        localStorage.setItem('app_id', existingUser.app_id)
        
        router.push('/dashboard')
      } else {
        // New user - generate app_id
        const { data: appIdData, error: appIdError } = await supabase
          .rpc('generate_app_id')

        if (appIdError || !appIdData) {
          console.error('App ID generation error:', appIdError)
          throw new Error('Failed to generate Application ID')
        }

        // Create new assessment
        const { data: newUser, error: insertError } = await supabase
          .from('assessments')
          .insert({
            email: email.toLowerCase(),
            company_name: companyName,
            app_id: appIdData,
            status: 'in_progress',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (insertError) {
          console.error('Insert error:', insertError)
          throw new Error(`Failed to create account: ${insertError.message}`)
        }

        if (!newUser) {
          throw new Error('Failed to create account: No data returned')
        }

        localStorage.setItem('login_email', email.toLowerCase())
        localStorage.setItem('login_company_name', companyName)
        localStorage.setItem('user_id', newUser.id)
        localStorage.setItem('app_id', newUser.app_id)
        
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to initialize assessment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-purple-600 to-orange-500 p-8">
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-full p-4 shadow-lg">
                <img 
                  src="/cancer-careers-logo.png" 
                  alt="Cancer and Careers"
                  className="h-16 w-auto"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white text-center mb-2">
              Best Companies Assessment
            </h1>
            <p className="text-purple-100 text-center text-sm">
              Enter your information to begin or continue your assessment
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company Name"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                      <p className="text-xs text-red-600 mt-1">Check the browser console for more details.</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Continue to Assessment'
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-xs text-gray-700 text-center leading-relaxed">
                <span className="font-semibold text-purple-700">New users</span> will be registered automatically. 
                <span className="font-semibold text-orange-600"> Returning users</span> will continue where they left off.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">© 2025 Cancer and Careers</p>
        </div>
      </div>
    </div>
  )
}

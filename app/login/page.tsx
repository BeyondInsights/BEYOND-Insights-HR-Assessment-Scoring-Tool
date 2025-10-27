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
        .from('survey_responses')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine for new users
        throw new Error(`Database check failed: ${checkError.message}`)
      }

      if (existingUser) {
        // Returning user - load their data
        localStorage.setItem('login_email', email.toLowerCase())
        localStorage.setItem('login_company_name', existingUser.company_name || companyName)
        localStorage.setItem('user_id', existingUser.id)
        
        // Load their survey data if it exists
        if (existingUser.survey_data) {
          // Restore all their saved data to localStorage
          const surveyData = existingUser.survey_data
          Object.keys(surveyData).forEach(key => {
            localStorage.setItem(key, JSON.stringify(surveyData[key]))
          })
        }
        
        router.push('/dashboard')
      } else {
        // New user - create record
        const { data: newUser, error: insertError } = await supabase
          .from('survey_responses')
          .insert({
            email: email.toLowerCase(),
            company_name: companyName,
            survey_data: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (insertError) {
          throw new Error(`Failed to create account: ${insertError.message}`)
        }

        if (!newUser) {
          throw new Error('Failed to create account: No data returned')
        }

        // Save to localStorage
        localStorage.setItem('login_email', email.toLowerCase())
        localStorage.setItem('login_company_name', companyName)
        localStorage.setItem('user_id', newUser.id)
        
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/cancer-careers-logo.png" 
                alt="Cancer and Careers" 
                className="h-16"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Best Companies Assessment
            </h1>
            <p className="text-gray-600">
              Enter your information to begin or continue your assessment
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="your.email@company.com"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                id="companyName"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Your Company Name"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Continue to Assessment'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New users will be registered automatically. Returning users will continue where they left off.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2025 Cancer and Careers</p>
        </div>
      </div>
    </div>
  )
}

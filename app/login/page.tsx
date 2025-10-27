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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom, #f3e8ff, #ffffff)' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="flex flex-col items-center mb-8">
            <img 
              src="/cancer-careers-logo.png" 
              alt="Cancer and Careers"
              className="h-16 mb-6"
            />
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
              Best Companies Assessment
            </h1>
            <p className="text-gray-600 text-center">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company Name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
                <p className="text-xs text-gray-600 mt-1">Check the browser console for more details.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
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

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">© 2025 Cancer and Careers</p>
        </div>
      </div>
    </div>
  )
}

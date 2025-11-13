'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Mail, CheckCircle, ArrowLeft, Copy } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase/client'

export default function ForgotSurveyIdPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [surveyId, setSurveyId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Looking up email:', email)
      
      const { data: assessment, error: dbError } = await supabase
        .from('assessments')
        .select('app_id, company_name, email')
        .eq('email', email.toLowerCase().trim())
        .single()

      console.log('Database response:', { assessment, dbError })

      if (dbError) {
        console.error('Database error:', dbError)
        setError(`Database error: ${dbError.message}`)
        setLoading(false)
        return
      }

      if (!assessment) {
        setError('No assessment found for this email address.')
        setLoading(false)
        return
      }

      // Log the lookup for analytics
      try {
        await supabase
          .from('survey_id_requests')
          .insert({
            email: email.toLowerCase().trim(),
            survey_id: assessment.app_id,
            company_name: assessment.company_name,
            requested_at: new Date().toISOString(),
            status: 'displayed'
          })
      } catch (logError) {
        console.log('Logging error (non-critical):', logError)
      }
      
      setSurveyId(assessment.app_id)
      setCompanyName(assessment.company_name)
      setLoading(false)

    } catch (err) {
      console.error('Unexpected error:', err)
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(surveyId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (surveyId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        <Header />
        
        <main className="max-w-2xl mx-auto px-6 py-16 flex-1">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Survey ID Found!
              </h1>
              <p className="text-gray-600">
                Here's your Survey ID for {companyName}
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-500 rounded-xl p-8 mb-6">
              <p className="text-sm text-gray-600 text-center mb-2">Your Survey ID:</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-bold text-orange-600 font-mono tracking-wider">
                  {surveyId}
                </p>
                <button
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className={`w-6 h-6 ${copied ? 'text-green-600' : 'text-orange-600'}`} />
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 text-center mt-2">
                  ✓ Copied to clipboard!
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">How to Use Your Survey ID:</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="font-bold mr-2">1.</span>
                  <span>Click the button below to go to the login page</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">2.</span>
                  <span>Enter your Survey ID and email address</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">3.</span>
                  <span>Access your assessment dashboard</span>
                </li>
              </ol>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all"
              >
                Go to Login →
              </button>
              
              <button
                onClick={() => {
                  setSurveyId('')
                  setCompanyName('')
                  setEmail('')
                }}
                className="w-full px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Look Up Another Survey ID
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                <strong>Tip:</strong> Save this Survey ID in a safe place so you don't lose it again!
              </p>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      
      <main className="max-w-2xl mx-auto px-6 py-16 flex-1">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <Search className="w-10 h-10 text-orange-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Forgot Survey ID?</h1>
              <p className="text-gray-600">We'll look it up for you instantly</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Enter the email address you used to register. We'll show you your Survey ID immediately.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="your.email@company.com"
                />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Looking up...' : 'Find My Survey ID'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/login')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </button>
          </div>

          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Need help?</strong>
            </p>
            <p className="text-sm text-gray-600">
              Contact us at{' '}
              <a href="mailto:cacbestcompanies@cew.org" className="text-orange-600 hover:underline">
                cacbestcompanies@cew.org
              </a>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

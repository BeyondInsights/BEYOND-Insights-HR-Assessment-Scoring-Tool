'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase/client'

export default function ForgotSurveyIdPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('survey_id, company_name, email')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (assessment) {
        await supabase
          .from('survey_id_requests')
          .insert({
            email: email.toLowerCase().trim(),
            survey_id: assessment.survey_id,
            company_name: assessment.company_name,
            requested_at: new Date().toISOString(),
            status: 'pending'
          })
        
        setSubmitted(true)
      } else {
        setError('No assessment found for this email address.')
      }
    } catch (err) {
      setError('An error occurred. Please contact support.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-16 flex-1">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Request Received</h1>
            <p className="text-lg text-gray-700 mb-6">
              Our team will email your Survey ID to:
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="font-mono text-lg text-blue-900">{email}</p>
            </div>
            <p className="text-gray-600 mb-8">
              You should receive it within 1 business day.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
            >
              Return to Login
            </button>
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
              <p className="text-gray-600">We'll help you retrieve it</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Enter your email and we'll send your Survey ID within 1 business day.
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
              className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Request Survey ID'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <button
              onClick={() => router.push('/login')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

### **STEP 6: Scroll down and click "Commit changes"**

### **STEP 7: Wait for Netlify to deploy (2-3 minutes)**

---

## **DONE!**

Your folder structure will be:
```
app/
└── forgot-survey-id/
    └── page.tsx

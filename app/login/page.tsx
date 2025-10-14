/* eslint-disable @next/next/no-img-element */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import { ExternalLink, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    applicationId: ''
  })
  const [errors, setErrors] = useState('')
  const [showRequestIdMessage, setShowRequestIdMessage] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.email.trim()) {
      setErrors('Please enter your email address')
      return
    }
    if (!formData.email.includes('@')) {
      setErrors('Please enter a valid email address')
      return
    }
    if (!formData.applicationId.trim()) {
      setErrors('Please enter your Application ID from CAC')
      return
    }

    // Store login info in localStorage
    localStorage.setItem('login_email', formData.email)
    localStorage.setItem('login_application_id', formData.applicationId)
    localStorage.setItem('auth_email', formData.email) // For compatibility
    
    // Route to authorization page
    router.push('/authorization')
  }

  const handleRequestApplicationId = () => {
    window.open('https://www.cancerandcareers.org', '_blank')
    setShowRequestIdMessage(true)
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

            {errors && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors}</p>
              </div>
            )}

            {showRequestIdMessage && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Request Submitted
                    </p>
                    <p className="text-sm text-blue-800">
                      Return to this page once you receive your Application ID via email (typically within 1-2 business days).
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="your.email@company.com"
                />
              </div>

              {/* Application ID */}
              <div className="pt-2 border-t border-gray-200">
                <label className="block text-sm font-medium mb-2">
                  Application ID from CAC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.applicationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, applicationId: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
                  placeholder="e.g., CAC-2025-001234"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Provided by Cancer and Careers in your invitation email
                </p>
              </div>

              {/* Don't have Application ID? */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Don't have an Application ID yet?
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  Request one from Cancer and Careers and return to this page once received.
                </p>
                <button
                  type="button"
                  onClick={handleRequestApplicationId}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-orange-300 text-gray-700 rounded-lg font-semibold hover:bg-orange-50 hover:border-orange-400 transition-all text-sm"
                >
                  Request Application ID
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all"
              >
                Continue to Assessment
              </button>
            </form>

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

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function NotAuthorizedPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const storedEmail = localStorage.getItem('login_email') || ''
    const storedAppId = localStorage.getItem('login_application_id') || ''
    setEmail(storedEmail)
    setApplicationId(storedAppId)
  }, [])

  const assessmentLink = typeof window !== 'undefined' ? window.location.origin : ''

  const emailMessage = `Hello,

I received an invitation to complete the Best Companies for Working with Cancer Index Assessment, but I am not authorized to provide this information on behalf of our organization.

Could you please complete this assessment as you have the appropriate authorization and access to our benefits information?

Assessment Link: ${assessmentLink}
Application ID: ${applicationId}

The assessment requires someone with:
- Direct responsibility for benefits design and administration
- Access to all necessary benefits documentation and policies
- Decision-making authority for employee benefits

Thank you for your assistance.

Best regards`

  const handleSendEmail = (recipientEmail: string) => {
    const subject = encodeURIComponent('Request: Complete Cancer & Careers Assessment')
    const body = encodeURIComponent(emailMessage)
    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(emailMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-10 flex-1">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Alert Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-orange-600" />
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Authorization Required
          </h1>
          <p className="text-lg text-gray-700 text-center mb-8">
            This assessment requires someone who is authorized to provide information about your organization's benefits and policies.
          </p>

          {/* What's Needed Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-3">Who Should Complete This Assessment?</h3>
            <p className="text-sm text-gray-700 mb-3">
              Someone in your organization with:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                Direct responsibility for benefits design and administration
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                Access to all necessary benefits documentation and policies
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                Decision-making authority for employee benefits
              </li>
            </ul>
            <p className="text-sm text-gray-600 mt-3 italic">
              Common roles: CHRO, HR Director, Benefits Director, Benefits Manager
            </p>
          </div>

          {/* Share Options */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Share Assessment Information</h2>
            
            {/* Email Option */}
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-start mb-4">
                <Mail className="w-6 h-6 text-orange-600 mr-3 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Send via Email</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter the email address of the authorized person in your organization
                  </p>
                  <input
                    type="email"
                    placeholder="authorized.person@yourcompany.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-3"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        handleSendEmail(e.currentTarget.value)
                      }
                    }}
                    id="emailInput"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('emailInput') as HTMLInputElement
                      if (input.value) {
                        handleSendEmail(input.value)
                      }
                    }}
                    className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all"
                  >
                    Open Email to Send
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Opens your email client with a pre-filled message
                  </p>
                </div>
              </div>
            </div>

            {/* Copy Message Option */}
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-start">
                <Copy className="w-6 h-6 text-blue-600 mr-3 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Copy Message</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Copy the message and share it however you prefer (Slack, Teams, etc.)
                  </p>
                  <button
                    onClick={handleCopyMessage}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy Message to Clipboard
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Message */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2">MESSAGE PREVIEW:</p>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
              {emailMessage}
            </pre>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/authorization')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Authorization
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

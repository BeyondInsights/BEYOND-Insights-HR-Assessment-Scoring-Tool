'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LetterPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1">
        <div className="bg-white rounded-xl shadow-lg">
          {/* Header Banner - Changed to orange */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-xl px-8 py-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
              Best Companies for Working with Cancer
            </h1>
            <p className="text-orange-100 text-center mt-2">
              2026 Employer Index Assessment
            </p>
          </div>

          <div className="p-8 md:p-12">
            {/* Letter Content */}
            <div className="prose max-w-none">
              <p className="text-lg leading-relaxed mb-6">
                Thank you for taking this important step to evaluate your organization's support for <strong>employees managing cancer and other serious health conditions</strong>.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 my-6">
                <p className="text-blue-900 font-semibold mb-2">What This Assessment Provides</p>
                <p className="text-blue-800">
                  This comprehensive assessment will evaluate your current programs across 13 key dimensions of workplace support. Upon completion, you'll receive:
                </p>
                <ul className="mt-3 space-y-2 text-blue-800">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">✓</span>
                    <span>A detailed analysis of your organization's current support offerings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">✓</span>
                    <span>Insights into how your programs align with best practices</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">✓</span>
                    <span>Opportunities to enhance your support for employees facing health challenges</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">✓</span>
                    <span>Eligibility consideration for the Best Companies recognition</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">✓</span>
                    <span><strong>Recognition badge for use in marketing, recruitment, and communications</strong></span>
                  </li>
                </ul>
              </div>

              <p className="mb-6">
                Organizations that meet the criteria will be recognized in the inaugural Best Companies for Working with Cancer Index and will have the opportunity to work with Cancer and Careers to further strengthen their support programs.
              </p>

              {/* Before You Begin */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Before You Begin
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>Have your benefits documentation and policy materials readily available</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>The assessment covers programs across HR, Benefits, Leave Management, and Wellness</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>You may need to confer with colleagues who can provide details on specific programs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>You may pause and return at any time - all progress is automatically saved</span>
                  </li>
                </ul>
              </div>

              {/* Assessment Scope */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-orange-900 font-semibold mb-2">Assessment Scope</p>
                <p className="text-orange-800 text-sm">
                  You'll be evaluating support across 13 dimensions including medical leave, insurance coverage, manager preparedness, workplace accommodations, caregiver support, and more. The assessment focuses on programs available to employees with cancer, serious illnesses, and chronic conditions requiring ongoing care.
                </p>
              </div>

              {/* Time & Privacy */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-900">
                    <strong>Time Required:</strong><br/>
                    20-25 minutes to complete
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-900">
                    <strong>Confidentiality:</strong><br/>
                    Individual responses remain private
                  </p>
                </div>
              </div>

              {/* Signature */}
              <div className="mb-8">
                <p className="mb-2">Best regards,</p>
                <div className="ml-4">
                  <p className="font-bold text-lg">Rebecca V. Nellis</p>
                  <p className="text-gray-600">Chief Mission Officer</p>
                  <p className="text-gray-600">Cancer and Careers</p>
                </div>
              </div>

              {/* Ready to Begin */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ready}
                    onChange={(e) => setReady(e.target.checked)}
                    className="mt-1 mr-3 h-5 w-5 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-gray-700 group-hover:text-gray-900 select-none">
                    I understand this assessment will evaluate our current support programs and am ready to proceed
                  </span>
                </label>
              </div>

              {/* Begin Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => ready && router.push('/survey/authorization')}
                  disabled={!ready}
                  className={`px-12 py-4 rounded-lg font-bold text-lg transition-all transform ${
                    ready
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:-translate-y-0.5'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {ready ? 'Begin Assessment →' : 'Please acknowledge to continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

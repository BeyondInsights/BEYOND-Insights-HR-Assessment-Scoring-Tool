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
          {/* Header Banner */}
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

  {/* Why This Matters */}
<div className="bg-purple-50 border-l-4 border-purple-600 p-6 my-6">
  <p className="text-purple-900 font-semibold mb-2">Why This Program Matters</p>
  <p className="text-purple-800 mb-3">
    The need for workplace support has never been more critical:
  </p>
  <ul className="text-purple-800 space-y-2 mb-3">
    <li className="flex items-start">
      <span className="text-purple-600 mr-2">•</span>
      <span><strong>40%</strong> of adults will be diagnosed with cancer in their lifetime</span>
    </li>
    <li className="flex items-start">
      <span className="text-purple-600 mr-2">•</span>
      <span><strong>42%</strong> of those diagnosed are in their prime working years (ages 20-64)</span>
    </li>
    <li className="flex items-start">
      <span className="text-purple-600 mr-2">•</span>
      <span>Of the 163 million adults currently employed, <strong>16-17%</strong> will receive a diagnosis during their career</span>
    </li>
  </ul>
  <p className="text-purple-800">
    This assessment helps organizations understand their current capabilities and identify opportunities to better support this significant portion of their workforce, ultimately improving retention, productivity, and workplace culture.
  </p>
</div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 my-6">
                <p className="text-blue-900 font-semibold mb-2">What This Assessment Provides</p>
                <p className="text-blue-800">
                  This comprehensive assessment evaluates your programs across 13 key dimensions. Benefits include:
                </p>
                <ul className="mt-3 space-y-2 text-blue-800">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">✓</span>
                    <span>Detailed analysis of your organization's current support offerings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">✓</span>
                    <span>Benchmarking against emerging best practices</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">✓</span>
                    <span>Actionable recommendations for program enhancement</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">✓</span>
                    <span>For organizations meeting criteria: Recognition in the Best Companies Index and use of the recognition badge in marketing and recruitment materials</span>
                  </li>
                </ul>
              </div>

              {/* Process & Requirements */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Assessment Process
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">1.</span>
                    <span><strong>Initial Information:</strong> Provide basic organizational details</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">2.</span>
                    <span><strong>Application Fee:</strong> $1,250 assessment fee (payment options will be provided before beginning the full assessment)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">3.</span>
                    <span><strong>Complete Assessment:</strong> Evaluate your programs across 13 dimensions (20-25 minutes + time to confer with colleagues)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">4.</span>
                    <span><strong>Documentation:</strong> Upload supporting materials upon completion to verify programs</span>
                  </li>
                </ul>
              </div>

              {/* What You'll Need */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-orange-900 font-semibold mb-2">What You'll Need</p>
                <p className="text-orange-800 text-sm mb-2">
                  Have these materials ready for reference during the assessment:
                </p>
                <ul className="text-orange-800 text-sm space-y-1">
                  <li>• Benefits documentation and policy materials</li>
                  <li>• Leave and accommodation policies</li>
                  <li>• Manager training materials (if applicable)</li>
                </ul>
              </div>

              {/* Time & Privacy */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-900">
                    <strong>Investment:</strong><br/>
                    $1,250 application fee<br/>
                    <span className="text-sm">Payment arrangements available</span>
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-900">
                    <strong>Confidentiality:</strong><br/>
                    Individual responses remain private<br/>
                    <span className="text-sm">Analysis by BEYOND Insights, an independent research and insights firm</span>
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
                    I understand the assessment process, including the $1,250 application fee and documentation requirements, and am ready to begin
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
                  {ready ? 'Continue to Initial Information →' : 'Please acknowledge to continue'}
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

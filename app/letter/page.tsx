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
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-xl px-8 py-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
              Welcome to the Best Companies for Working with Cancer Initiative
            </h1>
            <p className="text-purple-100 text-center mt-2">
              2026 Employer Index Assessment
            </p>
          </div>

          <div className="p-8 md:p-12">
            {/* Letter Content */}
            <div className="prose max-w-none">
              <p className="text-lg leading-relaxed mb-6">
                On behalf of Cancer and Careers, I want to personally thank you for participating in this comprehensive study examining workplace benefits and programs for <strong>employees managing cancer and other serious health conditions</strong>.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 my-6">
                <p className="text-blue-900 font-semibold mb-2">Your Role in Shaping the Future</p>
                <p className="text-blue-800">
                  As a participating organization, you are playing a vital role in shaping the future of workplace support for employees. Your input will help establish our <strong>Best Companies for Working with Cancer Index</strong>—a groundbreaking annual recognition that identifies employers who demonstrate excellence in supporting team members through critical health challenges.
                </p>
              </div>

              <p className="mb-6">
                We know your time is valuable, and we've designed this assessment to be as efficient as possible while capturing the depth of information needed to create meaningful standards.
              </p>

              {/* Helpful Tips */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Helpful Tips Before You Begin
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>Please have your organization's current benefits documentation readily available for reference</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>This assessment should be completed by someone directly involved in your organization's benefits policies and programs, or someone authorized to provide this information</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>You may need to consult with colleagues from Benefits, Compensation, or other HR functions to provide complete responses</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>Your progress will be saved automatically, and you can return to complete unfinished sections before submitting</span>
                  </li>
                </ul>
              </div>

              {/* Time Estimate */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-orange-900">
                  <strong>Estimated completion time:</strong> 20 minutes (plus additional time as needed to collect/confirm requested information)
                </p>
              </div>

              {/* Privacy Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                <p className="text-green-900 text-sm">
                  <strong>Privacy & Confidentiality:</strong> All responses are collected and analyzed exclusively by BEYOND Insights, an independent research company. No individual responses will be shared publicly or with any Working with Cancer Initiative members.
                </p>
              </div>

              <p className="mb-6">
                Thank you again for your leadership in creating better workplaces for employees managing cancer and other serious health conditions.
              </p>

              {/* Signature */}
              <div className="mb-8">
                <p className="mb-2">With gratitude,</p>
                <div className="ml-4">
                  <p className="font-bold text-lg">Rebecca V. Nellis</p>
                  <p className="text-gray-600">Chief Mission Officer</p>
                  <p className="text-gray-600">Cancer and Careers</p>
                  <p className="text-sm text-gray-500 mt-2">CAC • CEW Foundation</p>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ready}
                    onChange={(e) => setReady(e.target.checked)}
                    className="mt-1 mr-3 h-5 w-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-gray-700 group-hover:text-gray-900 select-none">
                    I have read this welcome message, understand the assessment requirements, and am ready to begin
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
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:shadow-lg hover:-translate-y-0.5'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {ready ? 'Begin Assessment →' : 'Please acknowledge above to continue'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Cancer and Careers • Best Companies for Working with Cancer Initiative</p>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

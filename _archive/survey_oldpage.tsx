'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function SurveyPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const userId = sessionStorage.getItem('userId')
    if (!userId) {
      router.push('/')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {/* Header with Orange accent */}
      <header className="bg-white shadow-sm border-b-2 border-orange-500">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Logos */}
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-gray-800">Working with Cancer</span>
                <span className="text-gray-400">×</span>
                <span className="text-2xl font-bold text-orange-500">Cancer+Careers</span>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Exit Survey
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-gray-100 h-2">
        <div className="bg-orange-500 h-2 transition-all" style={{ width: '25%' }}></div>
      </div>

      {/* Survey Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <span className="text-sm text-orange-600 font-semibold">SECTION 1 OF 8</span>
            <h2 className="text-2xl font-bold mt-2">Current Organizational Approach</h2>
          </div>
          
          {/* Sample Question with Orange accent */}
          <div className="space-y-6">
            <div className="border-l-4 border-orange-400 pl-4 py-2">
              <h3 className="font-semibold mb-4 text-gray-900">
                Which best describes your organization's current approach to supporting employees managing cancer or other serious health conditions?
              </h3>
              <div className="space-y-3">
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:bg-blue-50 cursor-pointer transition-all">
                  <input type="radio" name="q1" className="mt-1 mr-3 text-orange-500" />
                  <div>
                    <span className="font-medium">No formal approach</span>
                    <p className="text-sm text-gray-600 mt-1">Handle case-by-case</p>
                  </div>
                </label>
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:bg-blue-50 cursor-pointer transition-all">
                  <input type="radio" name="q1" className="mt-1 mr-3 text-orange-500" />
                  <div>
                    <span className="font-medium">Developing approach</span>
                    <p className="text-sm text-gray-600 mt-1">Currently building our programs</p>
                  </div>
                </label>
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:bg-blue-50 cursor-pointer transition-all">
                  <input type="radio" name="q1" className="mt-1 mr-3 text-orange-500" />
                  <div>
                    <span className="font-medium">Moderate support</span>
                    <p className="text-sm text-gray-600 mt-1">Some programs beyond legal requirements</p>
                  </div>
                </label>
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:bg-blue-50 cursor-pointer transition-all">
                  <input type="radio" name="q1" className="mt-1 mr-3 text-orange-500" />
                  <div>
                    <span className="font-medium">Comprehensive support</span>
                    <p className="text-sm text-gray-600 mt-1">Extensive programs well beyond legal requirements</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
              ← Previous
            </button>
            <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
              Next Question &rarr;
            </button>
          </div>
        </div>
        
        {/* Powered By Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 mb-2">Survey Powered by</p>
          <div className="flex justify-center items-center space-x-2">
            <span className="text-sm font-semibold text-purple-700">BEYOND Insights</span>
          </div>
        </div>
      </div>
    </div>
  )
}
<button 
  onClick={() => setShowGuidelines(!showGuidelines)}
  className="text-sm text-blue-600 underline"
>
  Guidelines for Multi-Country Organizations
</button>

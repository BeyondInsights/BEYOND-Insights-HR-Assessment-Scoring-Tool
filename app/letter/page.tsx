'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase/client'

export default function LetterPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login') // or wherever your login page is
      }
    }
    checkAuth()
  }, [router])

  const handleContinue = async () => {
    if (!ready) return
    
    setLoading(true)
    
    try {
      // Mark letter as viewed in database
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from('assessments')
          .update({ letter_viewed: true })
          .eq('user_id', user.id)
        
        // Redirect to authorization/firmographics page
        router.push('/authorization')
      }
    } catch (error) {
      console.error('Error updating letter status:', error)
    } finally {
      setLoading(false)
    }
  }

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
              2026 Employer Index Survey
            </p>
          </div>

          <div className="p-8 md:p-12">
            {/* Letter Content */}
            <div className="prose max-w-none text-gray-900">
              <p className="text-base leading-relaxed mb-6 text-gray-900">
                On behalf of Cancer and Careers, I want to personally thank you for participating in this comprehensive survey examining workplace benefits and programs for employees managing cancer and other serious health conditions.
              </p>

              <p className="text-base leading-relaxed mb-6 text-gray-900">
                By participating, your organization will gain <strong>valuable proprietary benchmarking insights</strong> to guide internal strategies and strengthen support for employees facing serious health conditions. Your input will contribute to establishing the first-ever <strong>Best Companies for Working with Cancer Index</strong> — a groundbreaking new resource that helps organizations understand how their programs compare within and across industries and identify best practices to initiate or expand.
              </p>
              
              <p className="text-base leading-relaxed mb-6 text-gray-900">
                The Index will also highlight organizations that exemplify excellence in workplace support.
              </p>

              <p className="text-base leading-relaxed mb-6 text-gray-900">
                This <strong>20-minute survey</strong> is designed to be as efficient as possible while capturing the depth of information needed to understand the landscape and identify meaningful standards.
              </p>

              <p className="text-base font-semibold mb-3">Helpful Tips Before You Begin:</p>
              <ul className="text-base leading-relaxed space-y-2 mb-6 ml-6 list-disc">
                <li>Please have your organization's current benefits documentation readily available for reference</li>
                <li>This survey should be completed by someone directly involved in your organization's benefits policies and programs, or someone authorized to provide this information</li>
                <li>You may need to consult with colleagues from Benefits, Compensation, or other HR functions to provide complete responses</li>
                <li>Your progress will be saved automatically, and you can return to complete or review any section before submitting</li>
              </ul>

              <p className="text-base leading-relaxed mb-8">
                All responses will be collected and analyzed by <strong>BEYOND Insights</strong>, an independent research firm. Individual responses will only be accessible to BEYOND Insights and Cancer and Careers for analysis purposes and will not be shared publicly.
              </p>

              <p className="text-base leading-relaxed mb-6 text-gray-900">
                Thank you again for your leadership in creating better workplaces for employees managing cancer and other serious health conditions.
              </p>

              {/* Signature */}
              <div className="mb-8">
                <p className="mb-2">With gratitude,</p>
                <div className="ml-4">
                  <p className="font-bold text-base">Rebecca V. Nellis</p>
                  <p className="text-gray-600 text-sm">Chief Mission Officer</p>
                  <p className="text-gray-600 text-sm">Cancer and Careers</p>
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
                    I understand the survey process and am ready to begin
                  </span>
                </label>
              </div>

              {/* Begin Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleContinue}
                  disabled={!ready || loading}
                  className={`px-12 py-4 rounded-lg font-bold text-lg transition-all transform ${
                    ready && !loading
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:-translate-y-0.5'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white opacity-50 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    'Processing...'
                  ) : ready ? (
                    'Continue to Survey →'
                  ) : (
                    'Please acknowledge to continue'
                  )}
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

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

  useEffect(() => {
    const checkAuth = async () => {
      const surveyId = localStorage.getItem('survey_id') || ''
      const { isFoundingPartner } = await import('@/lib/founding-partners')
      
      if (isFoundingPartner(surveyId)) {
        return
      }
      
      const userAuthenticated = localStorage.getItem('user_authenticated') === 'true'
      if (!userAuthenticated) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  const handleContinue = async () => {
    if (!ready) return
    
    setLoading(true)
    
    try {
      const surveyId = localStorage.getItem('survey_id') || ''
      const { isFoundingPartner } = await import('@/lib/founding-partners')
      
      if (isFoundingPartner(surveyId)) {
        router.push('/authorization')
        return
      }
      
      // Try to save to Supabase but don't block
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('assessments')
            .update({ letter_viewed: true })
            .eq('user_id', user.id)
        }
      } catch (error) {
        console.error('Error updating letter:', error)
      }
      
      router.push('/authorization')
    } catch (error) {
      console.error('Error:', error)
      router.push('/authorization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1">
        <div className="bg-white rounded-xl shadow-lg">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-xl px-8 py-6 flex items-center justify-between gap-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              2026 Best Companies for<br />Working with Cancer Initiative
            </h1>
            <img
              src="/best-companies-2026-logo.png"
              alt="Best Companies Award Logo"
              className="h-24 sm:h-28 lg:h-32 w-auto flex-shrink-0"
            />
          </div>

          <div className="p-8 md:p-12">
            <div className="prose max-w-none">
              <p className="text-base mb-6">
                On behalf of Cancer and Careers, I want to personally thank you for participating in this comprehensive survey examining workplace benefits and programs for employees managing cancer and other serious health conditions.
              </p>

              <p className="text-base mb-6">
                By participating, your organization will gain valuable proprietary benchmarking insights to guide internal strategies and strengthen support for employees facing serious health conditions.
              </p>

              <p className="text-base font-semibold mb-3">Helpful Tips Before You Begin:</p>
              <ul className="text-base space-y-2 mb-6 ml-6 list-disc">
                <li>Please have your organization's current benefits documentation readily available</li>
                <li>This survey should be completed by someone directly involved in benefits policies</li>
                <li>Your progress will be saved automatically</li>
              </ul>

              <p className="text-base mb-8">
                All responses will be collected and analyzed by BEYOND Insights, an independent research firm.
              </p>

              <div className="mb-8">
                <p className="mb-2">With gratitude,</p>
                <div className="ml-4">
                  <p className="font-bold">Rebecca V. Nellis</p>
                  <p className="text-gray-600 text-sm">Chief Mission Officer</p>
                  <p className="text-gray-600 text-sm">Cancer and Careers</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ready}
                    onChange={(e) => setReady(e.target.checked)}
                    className="mt-1 mr-3 h-5 w-5 text-orange-600 rounded cursor-pointer"
                  />
                  <span>I understand the survey process and am ready to begin</span>
                </label>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={handleContinue}
                  disabled={!ready || loading}
                  className={`px-12 py-4 rounded-lg font-bold text-lg ${
                    ready && !loading
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white opacity-50 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Processing...' : ready ? 'Continue to Survey' : 'Please acknowledge to continue'}
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

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, FileText, Award, Building2, AlertTriangle, Info } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getUserAssessment } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { useAssessmentContext } from '@/lib/assessment-context'

export default function PaymentPage() {
  const router = useRouter()
  const ctx = useAssessmentContext()
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)

  // ========================================
  // TESTING MODE - CHANGE THIS ONE LINE TO TOGGLE
  // ========================================
  const TESTING_MODE = false  // ← Set to false for production
  
  // Testing mode handler - simulates payment completion
  const handleTestingModePayment = (method: 'card' | 'ach' | 'invoice') => {
    if (!TESTING_MODE) return false; // Do nothing if not in testing mode

    console.log(`[TESTING MODE] Simulating ${method} payment...`)

    // Simulate payment completion

    ctx.setPaymentCompleted(true)
    ctx.setPaymentMethod(method)
    ctx.setPaymentDate(new Date().toISOString())

    // Redirect to dashboard
    router.push('/dashboard')
    return true; // Indicates testing mode handled it
  }
  
  useEffect(() => {
  const checkPaymentStatus = async () => {
    try {
      // Check context first
      if (ctx.paymentCompleted) {
        console.log('Payment found in context - redirecting')
        window.location.replace('/dashboard')
        return
      }

      // Check Supabase by surveyId (reliable — tied to current survey, not auth session)
      const sid = ctx.surveyId
      if (sid) {
        const normalized = sid.replace(/-/g, '').toUpperCase()
        const { data } = await supabase
          .from('assessments')
          .select('payment_completed')
          .or(`app_id.eq.${sid},app_id.eq.${normalized},survey_id.eq.${sid},survey_id.eq.${normalized}`)
          .maybeSingle()

        if (data?.payment_completed) {
          console.log('Payment found in Supabase - redirecting')
          ctx.setPaymentCompleted(true)
          window.location.replace('/dashboard')
          return
        }
      }

      // No payment found - show payment page
      console.log('No payment found - showing payment options')
      setCompanyName(ctx.companyName || 'Your Organization')
      setLoading(false)

    } catch (error) {
      console.error('Error checking payment status:', error)
      setCompanyName(ctx.companyName || 'Your Organization')
      setLoading(false)
    }
  }

  checkPaymentStatus()
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])


  // Show loading state while checking payment status
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        <Header />
        <main className="max-w-5xl mx-auto px-6 py-10 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      {/* TESTING MODE BANNER - Only shows when TESTING_MODE = true */}
      {TESTING_MODE && (
        <div className="bg-red-600 text-white text-center py-3 px-4 sticky top-0 z-50">
          <p className="text-sm font-bold">
            ⚠️ TESTING MODE ACTIVE - All payments simulated for review purposes (Change TESTING_MODE to false for production)
          </p>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-10 flex-1">
        <div className="text-center mb-8">
          <Award className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Survey Payment
          </h1>
          <p className="text-lg text-gray-600">
            Complete your registration to begin your survey
          </p>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto text-center mt-2 mb-6">
            Your one-time participation fee supports the research, analysis, and expert reporting that powers the Index. Every participating organization receives a personalized benchmarking report with actionable recommendations — giving your team clear insight into how your workplace cancer support compares and where to focus next.
          </p>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-xl p-6 mb-8 border-2 border-gray-200">
          <div className="flex items-center">
            <Building2 className="w-6 h-6 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Organization</p>
              <p className="text-lg font-semibold">{companyName}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">One-Time Participation Fee</span>
              <span className="text-2xl font-bold text-gray-900">$1,250</span>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">What&apos;s Included</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <div>
                <p className="text-sm font-bold text-slate-800">Personalized Benchmarking Report</p>
                <p className="text-xs text-slate-500">Detailed analysis of your organization across all 13 dimensions of workplace cancer support</p>
              </div>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <div>
                <p className="text-sm font-bold text-slate-800">Peer Comparison Insights</p>
                <p className="text-xs text-slate-500">See how your programs compare to other participating organizations</p>
              </div>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <div>
                <p className="text-sm font-bold text-slate-800">Actionable Recommendations</p>
                <p className="text-xs text-slate-500">Prioritized, research-backed recommendations tailored to your results</p>
              </div>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <div>
                <p className="text-sm font-bold text-slate-800">Index Recognition Eligibility</p>
                <p className="text-xs text-slate-500">Organizations meeting the threshold earn recognition as a Best Company for Working with Cancer</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Select Your Payment Method
        </h2>
        <p className="text-gray-600 mb-6">Choose how you'd like to complete your payment</p>

        {/* Payment Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Online Payment - RECOMMENDED */}
          <button
            onClick={() => {
              // TESTING MODE CHECK - Added for testing
              if (handleTestingModePayment('card')) return;
              
              // PRODUCTION CODE - Your existing Zeffy navigation
              router.push('/payment/zeffy')
            }}
            className="relative p-6 rounded-xl border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all text-left group"
          >
            <div className="absolute top-4 right-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              RECOMMENDED
            </div>
            <CreditCard className="w-12 h-12 text-orange-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pay Online</h3>
            <p className="text-gray-700 mb-4">
              Credit Card or Bank Transfer (ACH)
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Immediate access with credit card
              </li>
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                ACH bank transfer available
              </li>
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Secure payment processing
              </li>
            </ul>
            <div className="text-orange-600 font-semibold group-hover:underline">
              Continue with Online Payment →
            </div>
          </button>

          {/* Invoice - Alternative Option - NOW WITH IMMEDIATE ACCESS */}
          <button
            onClick={() => {
              // TESTING MODE CHECK
              if (handleTestingModePayment('invoice')) return;
              
              // PRODUCTION CODE - Navigate to invoice page to collect info
              router.push('/payment/invoice')
            }}
            className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg transition-all text-left group"
          >
            <FileText className="w-12 h-12 text-gray-600 mb-4 group-hover:text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Invoice</h3>
            <p className="text-gray-700 mb-4">
              Begin survey immediately, invoice follows
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-blue-600 mr-2">✓</span>
                Start survey right away
              </li>
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-blue-600 mr-2">✓</span>
                Invoice sent within 1 business day
              </li>
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-blue-600 mr-2">✓</span>
                Net 30 payment terms
              </li>
            </ul>
            
            <div className="text-gray-600 font-semibold group-hover:text-blue-600 group-hover:underline">
              Request Invoice & Begin →
            </div>
          </button>
        </div>

        {/* Invoice Information Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-8">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">About Invoice Payment</h3>
              <p className="text-sm text-blue-800 mb-2">
                Selecting invoice payment grants you immediate access to begin your survey. An invoice will be sent within one business day, with payment due within 30 days. Your benchmarking report will be delivered upon completion of the survey.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-10">
          <button
            type="button"
            onClick={() => router.push('/authorization')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            ← Back
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, FileText, Award, Building2, AlertTriangle, Info } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getUserAssessment } from '@/lib/supabase/auth'

export default function PaymentPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)

  // ========================================
  // TESTING MODE - CHANGE THIS ONE LINE TO TOGGLE
  // ========================================
  const TESTING_MODE = true  // ← Set to false for production
  
  // Testing mode handler - simulates payment completion
  const handleTestingModePayment = (method: 'card' | 'ach' | 'invoice') => {
    if (!TESTING_MODE) return false; // Do nothing if not in testing mode
    
    console.log(`[TESTING MODE] Simulating ${method} payment...`)
    
    // Simulate payment completion
    localStorage.setItem('payment_completed', 'true')
    localStorage.setItem('payment_method', method)
    localStorage.setItem('payment_date', new Date().toISOString())
    
    // Redirect to dashboard
    router.push('/dashboard')
    return true; // Indicates testing mode handled it
  }
  // ========================================

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Check if payment already completed
        const assessment = await getUserAssessment()
        
        if (assessment?.payment_completed) {
          // Already paid - redirect to dashboard
          console.log('Payment already completed, redirecting to dashboard...')
          router.push('/dashboard')
          return
        }
        
        // Not paid yet - load company name and show payment options
        const name = localStorage.getItem('login_company_name') || 'Your Organization'
        setCompanyName(name)
        setLoading(false)
      } catch (error) {
        console.error('Error checking payment status:', error)
        // On error, still show payment page
        const name = localStorage.getItem('login_company_name') || 'Your Organization'
        setCompanyName(name)
        setLoading(false)
      }
    }
    
    checkPaymentStatus()
  }, [router])

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
            Complete payment to begin your survey
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
              <span className="text-gray-600">Survey Fee</span>
              <span className="text-2xl font-bold text-gray-900">$1,250</span>
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

          {/* Invoice - Alternative Option */}
          <button
            onClick={() => {
              // TESTING MODE CHECK - Added for testing
              if (handleTestingModePayment('invoice')) return;
              
              // PRODUCTION CODE - Your existing invoice navigation
              router.push('/payment/invoice')
            }}
            className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg transition-all text-left group"
          >
            <FileText className="w-12 h-12 text-gray-600 mb-4 group-hover:text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Invoice</h3>
            <p className="text-gray-700 mb-4">
              Available if unable to use credit card or bank transfer
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-blue-600 mr-2">✓</span>
                Net 30 days payment terms
              </li>
            </ul>
            
            <div className="text-gray-600 font-semibold group-hover:text-blue-600 group-hover:underline">
              Request Invoice →
            </div>
          </button>
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

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle, Award, Building2, CreditCard, Loader2, AlertCircle } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getCurrentUser } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

export default function ZeffyPaymentPage() {
  const router = useRouter()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error' | null>(null)
  const [companyData, setCompanyData] = useState({
    name: '',
    contactName: ''
  })
  
  // UPDATED: Dynamic URL with parameters instead of constant
  const [zeffyUrl, setZeffyUrl] = useState('')

  useEffect(() => {
    const name = localStorage.getItem('login_company_name') || 'Your Organization'
    const firstName = localStorage.getItem('login_first_name') || ''
    const lastName = localStorage.getItem('login_last_name') || ''
    const email = localStorage.getItem('auth_email') || ''
    const surveyId = localStorage.getItem('survey_id') || 
                     localStorage.getItem('application_id') || 
                     `TEMP-${Date.now()}`
    
    setCompanyData({
      name,
      contactName: `${firstName} ${lastName}`
    })
    
    // UPDATED: Build Zeffy URL with parameters for tracking
    const baseUrl = 'https://www.zeffy.com/en-US/ticketing/best-companies-for-working-with-cancer'
    const params = new URLSearchParams({
      survey_id: surveyId,
      source: 'assessment_app',
      company: name,
      email: email
    })
    
    setZeffyUrl(`${baseUrl}?${params.toString()}`)
  }, [])

  const handleOpenPayment = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setShowPaymentModal(true)
    }, 500)
  }

  const handleCloseModal = () => {
    setShowPaymentModal(false)
    setTimeout(() => setPaymentStatus(null), 300)
  }

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Listen for payment completion from Zeffy
      if (event.origin === 'https://www.zeffy.com') {
        if (event.data.type === 'payment_complete' || event.data.status === 'success') {
          setPaymentStatus('success')
          
          // Determine payment method from event data if available
          const method = event.data.payment_method || 'card' // Default to card
          
          // Set payment status in localStorage
          localStorage.setItem('payment_completed', 'true')
          localStorage.setItem('payment_method', method)
          localStorage.setItem('payment_date', new Date().toISOString())
          
          // ALSO save to database
          try {
            const user = await getCurrentUser()
            if (user) {
              await supabase
                .from('assessments')
                .update({
                  payment_completed: true,
                  payment_method: method,
                  payment_date: new Date().toISOString()
                })
                .eq('user_id', user.id)
            }
          } catch (error) {
            console.error('Error saving payment to database:', error)
          }
          
          setTimeout(() => {
            handleCloseModal()
            router.push('/payment/success')
          }, 2000)
        }
      }
    }

    if (showPaymentModal) {
      window.addEventListener('message', handleMessage)
      return () => window.removeEventListener('message', handleMessage)
    }
  }, [showPaymentModal, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-10 flex-1">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center mb-6">
            <Award className="w-12 h-12 text-indigo-600 mr-4" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Complete Your Survey Payment
              </h2>
            </div>
          </div>

          {/* Company Info Summary */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Organization</p>
                  <p className="font-medium">{companyData.name}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-medium">{companyData.contactName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Survey Type</p>
                <p className="font-medium">Best Companies Index</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Survey Fee</p>
                <p className="font-medium text-2xl text-gray-900">$1,250</p>
              </div>
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-900 mb-1">Important: Credit Card Strongly Recommended</p>
                <p className="text-sm text-orange-800 mb-2">
                  While both credit card and ACH (bank transfer) options are available, <strong>credit card payment is strongly preferred</strong>.
                </p>
                <ul className="text-sm text-orange-800 space-y-1 ml-4">
                  <li>• <strong>Credit Card:</strong> Immediate processing and instant access</li>
                  <li>• <strong>ACH Transfer:</strong> 3-5 business day processing delay, though you will stil have immediate access to survey</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Benefits List */}
          <div className="bg-white/50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Your Survey Fee Includes:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-700">
                  Comprehensive evaluation across 13 dimensions of workplace support
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-700">
                  Proprietary benchmarking insights and recommendations
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-700">
                  Eligibility for Best Companies Index recognition
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-700">
                  Certification badge and marketing materials (if qualified)
                </span>
              </li>
            </ul>
          </div>

          {/* Important Payment Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Important Payment Information:</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <div>
                  <strong>Tax Deductibility:</strong> This $1,250 payment is a <strong>professional service fee</strong> for survey access and certification services. <strong>It is NOT a tax-deductible charitable donation.</strong>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <div>
                  <strong>Optional Platform Tip:</strong> The payment form includes an optional tip to support Zeffy's platform. This tip is <strong>entirely optional</strong> and separate from your survey fee. You can change it to "Other" and enter <strong>$0</strong> if you prefer.
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleOpenPayment}
              disabled={isLoading || !zeffyUrl}
              className="flex-1 bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold 
                       hover:bg-indigo-700 transition-colors disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading Payment Form...
                </>
              ) : !zeffyUrl ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceed to Secure Payment
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/payment')}
              className="px-8 py-4 border border-gray-300 rounded-lg font-semibold 
                       hover:bg-gray-50 transition-colors"
            >
              Back to Payment Options
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-4 text-center">
            🔒 Secure payment processing
          </p>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center 
                      justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[95vh] 
                        flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 
                          bg-gradient-to-r from-indigo-50 to-blue-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Survey Payment
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {companyData.name}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 
                         rounded-lg hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Success Message */}
            {paymentStatus === 'success' && (
              <div className="bg-green-50 border-b border-green-200 p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    Payment successful! Redirecting...
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method Reminder */}
            <div className="bg-orange-50 border-b border-orange-200 p-4">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-orange-900">
                  <strong>Reminder:</strong> Select <strong>credit card</strong> for immediate survey access. ACH transfers require 3-5 business days processing.
                </p>
              </div>
            </div>

            {/* Zeffy Tip Reminder */}
            <div className="bg-blue-50 border-b border-blue-200 p-4">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-blue-900">
                  <strong>Note:</strong> The payment form includes an optional tip to Zeffy. You can change this to "Other" and enter <strong>$0</strong> - it's entirely optional and separate from your $1,250 survey fee.
                </p>
              </div>
            </div>

            {/* Iframe - UPDATED to use dynamic URL */}
            <div className="flex-1 overflow-hidden relative bg-gray-50">
              {zeffyUrl ? (
                <iframe
                  src={zeffyUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  title="Payment Form"
                  allow="payment"
                  sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Need help? Contact info@cancerandcareers.org
              </p>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 
                         rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

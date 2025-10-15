'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle, Award, Building2, CreditCard, Loader2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function CreditCardPaymentPage() {
  const router = useRouter()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error' | null>(null)
  const [companyData, setCompanyData] = useState({
    name: '',
    contactName: ''
  })
  
  const GIFTSMART_FORM_URL = "https://fundraise.givesmart.com/form/AdWILw?vid=1m2tbw"

  useEffect(() => {
    const name = localStorage.getItem('login_company_name') || 'Your Organization'
    const firstName = localStorage.getItem('login_first_name') || ''
    const lastName = localStorage.getItem('login_last_name') || ''
    
    setCompanyData({
      name,
      contactName: `${firstName} ${lastName}`
    })
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
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === 'https://fundraise.givesmart.com') {
        if (event.data.type === 'payment_complete') {
          setPaymentStatus('success')
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
                Complete Your Certification Payment
              </h2>
            </div>
          </div>

          {/* Company Info Summary */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Summary</h3>
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
                <p className="text-sm text-gray-500">Application Type</p>
                <p className="font-medium">Standard Certification</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Certification Fee</p>
                <p className="font-medium text-2xl text-gray-900">$1,250</p>
              </div>
            </div>
          </div>

          {/* Benefits List */}
          <div className="bg-white/50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Your Certification Includes:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-700">
                  Official "Best Companies for Working with Cancer" designation
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-700">
                  Digital badge and certificate for your website and materials
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-700">
                  Inclusion in the official directory of certified employers
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-700">
                  Press release and marketing toolkit
                </span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleOpenPayment}
              disabled={isLoading}
              className="flex-1 bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold 
                       hover:bg-indigo-700 transition-colors disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading Payment Form...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay with Credit Card
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
            🔒 Secure payment processing powered by GiveSmart
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
                  Certification Payment
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

            {/* Iframe */}
            <div className="flex-1 overflow-hidden relative bg-gray-50">
              <iframe
                src={GIFTSMART_FORM_URL}
                className="absolute inset-0 w-full h-full border-0"
                title="Payment Form"
                allow="payment"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Need help? Contact support@cancerandcareers.org
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

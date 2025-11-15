'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Award, Building2, CreditCard, Loader2, Info } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ZeffyPaymentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [companyData, setCompanyData] = useState({
    name: '',
    contactName: ''
  })
  
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
    
    const baseUrl = 'https://www.zeffy.com/en-US/ticketing/test-620'
    const params = new URLSearchParams({
      survey_id: surveyId,
      source: 'assessment_app',
      company: name,
      email: email
    })
    
    setZeffyUrl(`${baseUrl}?${params.toString()}`)
  }, [])

  const handleOpenPayment = () => {
    if (!zeffyUrl) {
      alert('Payment URL not ready. Please try again.');
      return;
    }
    
    setIsLoading(true);
    
    // Open Zeffy in a new window
    const paymentWindow = window.open(
      zeffyUrl,
      'zeffy_payment',
      'width=900,height=900,menubar=no,toolbar=no,location=no,scrollbars=yes'
    );
    
    setIsLoading(false);
    
    if (!paymentWindow) {
      alert('Please allow popups to complete payment. Check your browser\'s popup blocker.');
      return;
    }
    
    /// Monitor when payment window closes
  const checkWindow = setInterval(() => {
  if (paymentWindow.closed) {
    clearInterval(checkWindow);
    console.log('Payment window closed - checking payment status');
    
    // Check if payment was completed
    const paymentCompleted = localStorage.getItem('payment_completed') === 'true';
    
    if (paymentCompleted) {
      console.log('Payment detected - redirecting to dashboard');
      router.push('/dashboard');  // ✅ Go to dashboard
    } else {
      console.log('Payment not detected - staying on payment page');
      // User closed window without completing - stay here
    }
  }
}, 1000);

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
                <p className="font-medium">Best Companies Initiative</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Survey Fee</p>
                <p className="font-medium text-2xl text-gray-900">$1,250</p>
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
                  Proprietary benchmarking insights and recommendations
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-700">
                  Comprehensive evaluation across 13 dimensions of workplace support
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-700">
                  Eligibility for Best Companies Initiative recognition
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span className="text-gray-700">
                  If certified, option to license the <strong>Best Companies for Working with Cancer</strong> seal
                </span>
              </li>
            </ul>
          </div>

          {/* Payment Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Payment Information
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <div>
                  <strong>Tax Deductibility:</strong> While Cancer and Careers / CEW Foundation is a 501(c)(3) charitable organization and donations are tax-deductible, this $1,250 payment is a <strong>professional service fee</strong> for survey access, analysis, and certification services, and is therefore <strong>not tax-deductible as a charitable contribution</strong>.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <div>
                  <strong>Payment Methods:</strong> Both credit card and ACH (bank transfer) options are available. Credit card provides immediate confirmation, while ACH transfers typically process within 1-2 business days.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <div>
                  <strong>Platform Tip:</strong> The payment form includes an optional tip to support Zeffy's platform, which is free for nonprofits. This is entirely optional and separate from your survey fee—you may adjust or remove it as you prefer.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <div>
                  <strong>New Window:</strong> Payment will open in a new window. After completing payment, you'll be automatically redirected back to your dashboard.
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
                  Opening Payment Window...
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
            🔒 Secure payment processing • Payment opens in new window
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

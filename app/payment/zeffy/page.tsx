'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Award, Building2, CreditCard, Loader2, Info, CheckCircle } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAssessmentContext } from '@/lib/assessment-context'

export default function ZeffyPaymentPage() {
  const router = useRouter()
  const ctx = useAssessmentContext()
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [companyData, setCompanyData] = useState({
    name: '',
    contactName: ''
  })
  
  const [zeffyUrl, setZeffyUrl] = useState('')

  useEffect(() => {
    const name = ctx.companyName || 'Your Organization'
    const firstName = ctx.loginFirstName || ''
    const lastName = ctx.loginLastName || ''
    const email = ctx.email || ''
    const surveyId = ctx.surveyId || `TEMP-${Date.now()}`
    
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

  const markPaymentComplete = async () => {
    // Update context state (for UI)
    ctx.setPaymentCompleted(true)
    ctx.setPaymentMethod('card')
    ctx.setPaymentDate(new Date().toISOString())

    // Call sync function DIRECTLY with payment data.
    // Can't use ctx.saveToSupabase() because React batches the setState calls
    // above — the callback's closure still has paymentCompleted=false and
    // won't include payment_completed in the payload.
    const sid = ctx.surveyId || sessionStorage.getItem('current_survey_id') || ''
    if (!sid) return false
    const normalized = sid.replace(/-/g, '').toUpperCase()

    try {
      const response = await fetch('/.netlify/functions/sync-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: sid,
          fallbackSurveyId: sid,
          fallbackAppId: normalized,
          userType: ctx.userType || 'regular',
          source: 'autosync',
          expectedVersion: ctx.version || undefined,
          data: {
            payment_completed: true,
            payment_method: 'card',
            payment_date: new Date().toISOString()
          }
        })
      })
      const result = await response.json()
      if (!result.success) {
        console.error('Payment sync failed:', result.error)
        // Retry with corrected version if version mismatch
        if (result.actualVersion || result.currentVersion) {
          const retryVersion = result.actualVersion || result.currentVersion
          const retry = await fetch('/.netlify/functions/sync-assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              survey_id: sid,
              fallbackSurveyId: sid,
              fallbackAppId: normalized,
              userType: ctx.userType || 'regular',
              source: 'autosync',
              expectedVersion: retryVersion,
              data: {
                payment_completed: true,
                payment_method: 'card',
                payment_date: new Date().toISOString()
              }
            })
          })
          const retryResult = await retry.json()
          if (!retryResult.success) {
            console.error('Payment sync retry failed:', retryResult.error)
            return false
          }
        } else {
          return false
        }
      }
      // Reload from Supabase to get correct version + all data
      await ctx.loadFromSupabase(sid)
      return true
    } catch (err) {
      console.error('Error saving payment:', err)
      return false
    }
  }

  const handleOpenPayment = () => {
    if (!zeffyUrl) {
      alert('Payment URL not ready. Please try again.');
      return;
    }

    setIsLoading(true);

    // Store surveyId in a cookie (works when domains match)
    const sid = ctx.surveyId;
    if (sid) {
      document.cookie = `payment_survey_id=${encodeURIComponent(sid)}; path=/; max-age=3600; SameSite=Lax`;
    }

    // Listen for postMessage from the success page (works cross-origin)
    let paymentConfirmed = false
    const messageHandler = async (event: MessageEvent) => {
      if (event.data?.type === 'payment-completed' && !paymentConfirmed) {
        paymentConfirmed = true
        console.log('Payment confirmed via postMessage from success page')
        window.removeEventListener('message', messageHandler)
        await markPaymentComplete()
        router.push('/dashboard')
      }
    }
    window.addEventListener('message', messageHandler)

    // Open Zeffy in a new window
    const paymentWindow = window.open(
      zeffyUrl,
      'zeffy_payment',
      'width=900,height=900,menubar=no,toolbar=no,location=no,scrollbars=yes'
    );

    setIsLoading(false);

    if (!paymentWindow) {
      alert('Please allow popups to complete payment. Check your browser\'s popup blocker.');
      window.removeEventListener('message', messageHandler)
      return;
    }

    // Monitor when payment window closes — poll Supabase as backup
    const checkWindow = setInterval(async () => {
      if (paymentWindow.closed) {
        clearInterval(checkWindow);
        if (paymentConfirmed) return; // Already handled via postMessage

        console.log('Payment window closed - polling Supabase for payment status');

        const sid = ctx.surveyId;
        if (!sid) {
          console.log('No surveyId in context - cannot check payment');
          window.removeEventListener('message', messageHandler)
          return;
        }

        const normalized = sid.replace(/-/g, '').toUpperCase();
        const { supabase: sb } = await import('@/lib/supabase/client');

        // Poll up to 10 times (10 seconds)
        for (let attempt = 0; attempt < 10; attempt++) {
          if (paymentConfirmed) return; // postMessage came in during polling

          const { data } = await sb
            .from('assessments')
            .select('payment_completed')
            .or(`app_id.eq.${sid},app_id.eq.${normalized},survey_id.eq.${sid},survey_id.eq.${normalized}`)
            .maybeSingle();

          if (data?.payment_completed) {
            console.log(`Payment confirmed in Supabase (attempt ${attempt + 1}) - redirecting`);
            paymentConfirmed = true
            window.removeEventListener('message', messageHandler)
            await ctx.loadFromSupabase(sid);
            router.push('/dashboard');
            return;
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Neither postMessage nor polling confirmed payment
        console.log('Payment not confirmed after 10 attempts');
        window.removeEventListener('message', messageHandler)
        setShowPaymentConfirm(true)
      }
    }, 1000);
}

  const handleRecheckPayment = async () => {
    setIsLoading(true)
    const sid = ctx.surveyId || sessionStorage.getItem('current_survey_id') || ''
    if (!sid) { setIsLoading(false); return }
    const normalized = sid.replace(/-/g, '').toUpperCase()
    const { supabase: sb } = await import('@/lib/supabase/client')
    const { data } = await sb
      .from('assessments')
      .select('payment_completed')
      .or(`app_id.eq.${sid},app_id.eq.${normalized},survey_id.eq.${sid},survey_id.eq.${normalized}`)
      .maybeSingle()
    if (data?.payment_completed) {
      await ctx.loadFromSupabase(sid)
      router.push('/dashboard')
      return
    }
    setIsLoading(false)
    alert('Payment not yet detected. If you just completed payment, please wait a moment and try again.')
  }

  if (showPaymentConfirm) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-16 flex-1">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Info className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Verification</h2>
            <p className="text-gray-600 mb-6">We weren&apos;t able to automatically confirm your payment status.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6 text-left">
              <p className="text-sm text-blue-800 mb-2"><strong>If you completed payment:</strong> Click &ldquo;Check Payment Status&rdquo; below. It may take a moment for your payment to be processed.</p>
              <p className="text-sm text-blue-800"><strong>If you did not complete payment:</strong> Click &ldquo;Try Payment Again&rdquo; to return to the payment window.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRecheckPayment}
                disabled={isLoading}
                className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Checking...' : 'Check Payment Status'}
              </button>
              <button
                onClick={() => setShowPaymentConfirm(false)}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Try Payment Again
              </button>
              <button
                onClick={() => router.push('/payment')}
                className="px-8 py-4 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Back to Payment Options
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

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

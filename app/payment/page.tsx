'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, FileText, Award, Building2, Landmark } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PaymentPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    const name = localStorage.getItem('login_company_name') || 'Your Organization'
    setCompanyName(name)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-10 flex-1">
        <div className="text-center mb-8">
          <Award className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Payment for Application / Certification
          </h1>
          <p className="text-lg text-gray-600">
            Complete your certification by selecting a payment method
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
              <span className="text-gray-600">Certification Fee</span>
              <span className="text-2xl font-bold text-gray-900">$1,200</span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Select Your Payment Method
        </h2>
        <p className="text-gray-600 mb-6">Choose how you'd like to complete your payment</p>

        {/* Payment Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Credit Card - RECOMMENDED */}
          <button
            onClick={() => router.push('/payment/credit-card')}
            className="relative p-6 rounded-xl border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all text-left group"
          >
            <div className="absolute top-4 right-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              RECOMMENDED
            </div>
            <CreditCard className="w-12 h-12 text-orange-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Credit Card</h3>
            <p className="text-gray-700 mb-4">
              Pay now and get instant access to your certification
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Immediate processing
              </li>
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Secure payment via GiveSmart
              </li>
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Instant certification access
              </li>
            </ul>
            <div className="text-orange-600 font-semibold group-hover:underline">
              Continue with Credit Card →
            </div>
          </button>

          {/* ACH / Bank Transfer */}
          <button
            onClick={() => router.push('/payment/stripe')}
            className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg transition-all text-left group"
          >
            <Landmark className="w-12 h-12 text-gray-600 mb-4 group-hover:text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">ACH / Bank Transfer</h3>
            <p className="text-gray-700 mb-4">
              Pay directly from your bank account
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-blue-600 mr-2">✓</span>
                Lower processing fees
              </li>
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-blue-600 mr-2">✓</span>
                Secure via Stripe
              </li>
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-blue-600 mr-2">✓</span>
                2-3 business days processing
              </li>
            </ul>
            <div className="text-gray-600 font-semibold group-hover:text-blue-600 group-hover:underline">
              Continue with ACH →
            </div>
          </button>

          {/* Invoice */}
          <button
            onClick={() => router.push('/payment/invoice')}
            className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg transition-all text-left group"
          >
            <FileText className="w-12 h-12 text-gray-600 mb-4 group-hover:text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Invoice</h3>
            <p className="text-gray-700 mb-4">
              Get an invoice to process through your accounting department
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-blue-600 mr-2">✓</span>
                Download or email invoice
              </li>
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-blue-600 mr-2">✓</span>
                Net 14 days payment terms
              </li>
              <li className="text-sm text-gray-600 flex items-center">
                <span className="text-blue-600 mr-2">✓</span>
                Certification / Score available after payment received
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

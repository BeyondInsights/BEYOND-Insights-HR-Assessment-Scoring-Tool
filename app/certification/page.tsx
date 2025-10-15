// app/certification/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award, CheckCircle, CreditCard, Building, FileText, Star, AlertCircle } from 'lucide-react';

export default function CertificationPage() {
  const router = useRouter();
  const [step, setStep] = useState<'eligibility' | 'payment-method'>('eligibility');
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    contactName: ''
  });

  useEffect(() => {
    // Load company data from localStorage
    const company = localStorage.getItem('auth_company_name') || 'Your Organization';
    const email = localStorage.getItem('auth_email') || '';
    const contactName = localStorage.getItem('auth_contact_name') || '';
    
    setCompanyData({ name: company, email, contactName });

    // Check if they've already paid
    if (localStorage.getItem('payment_completed') === 'true') {
      router.push('/dashboard');
    }
  }, [router]);

  const handlePaymentMethodSelect = (method: 'card' | 'ach' | 'invoice') => {
    // Store selected method
    localStorage.setItem('selected_payment_method', method);
    
    if (method === 'invoice') {
      router.push('/payment/invoice');
    } else {
      router.push('/payment/stripe');
    }
  };

  // Eligibility Screen
  if (step === 'eligibility') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <Award className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Congratulations! You're Eligible for Certification
            </h1>
            <p className="text-lg text-gray-600">
              {companyData.name} qualifies for Best Companies for Working with Cancer certification
            </p>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            {/* Application Summary */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Application Summary
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Organization</p>
                    <p className="font-semibold text-gray-900">{companyData.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Certification Status</p>
                    <p className="font-semibold text-green-600">Eligible ✓</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Application Type</p>
                    <p className="font-semibold text-gray-900">Standard Certification</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-xl mt-1">💰</span>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Certification Fee</p>
                    <p className="font-semibold text-gray-900">$1,250</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Your Certification Includes:
              </h3>
              
              <div className="space-y-3">
                {[
                  'Official "Best Companies for Working with Cancer" designation',
                  'Digital badge and certificate for your website and materials',
                  'Inclusion in the official directory of certified employers',
                  'Press release and marketing toolkit'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setStep('payment-method')}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Complete Certification Application
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-4 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Save for Later
              </button>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Payment Required to Begin Assessment
                </p>
                <p className="text-sm text-blue-700">
                  To ensure commitment and quality, payment must be completed before beginning your certification assessment. You'll gain immediate access to all assessment sections after payment confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment Method Selection
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Payment Method
          </h1>
          <p className="text-gray-600">
            Choose how you'd like to pay for your certification application
          </p>
        </div>

        {/* Amount Display */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 text-center">
          <p className="text-sm text-gray-600 mb-1">Certification Fee</p>
          <p className="text-4xl font-bold text-green-600">$1,250</p>
          <p className="text-sm text-gray-500 mt-2">One-time annual certification fee</p>
        </div>

        {/* Payment Method Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Credit Card - PREFERRED */}
          <button
            onClick={() => handlePaymentMethodSelect('card')}
            className="relative bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-500 text-left group"
          >
            {/* Preferred Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
              <Star className="w-3 h-3 fill-current" />
              PREFERRED
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Credit Card</h3>
              <p className="text-sm text-gray-600 mb-4">
                Instant processing via secure Stripe payment
              </p>
              <div className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Immediate access
              </div>
            </div>
          </button>

          {/* ACH Transfer */}
          <button
            onClick={() => handlePaymentMethodSelect('ach')}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-500 text-left group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <Building className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Bank Transfer (ACH)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Direct bank transfer via Stripe
              </p>
              <div className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" />
                3-5 business days
              </div>
            </div>
          </button>

          {/* Invoice */}
          <button
            onClick={() => handlePaymentMethodSelect('invoice')}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-500 text-left group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Invoice (Net 30)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Request invoice for accounting department
              </p>
              <div className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" />
                Access after payment received
              </div>
            </div>
          </button>
        </div>

        {/* Why Credit Card Recommended */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>💡 Why we recommend credit card:</strong> Credit card payments are processed instantly and securely through Stripe, allowing you to begin your assessment immediately. ACH and invoice payments may delay your assessment access by 3-30 days.
          </p>
        </div>

        {/* Back Button */}
        <button
          onClick={() => setStep('eligibility')}
          className="w-full px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

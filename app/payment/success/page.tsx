// app/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Award, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [paymentInfo, setPaymentInfo] = useState({
    method: '',
    date: '',
    transactionId: ''
  });

 useEffect(() => {
  const method = localStorage.getItem('payment_method') || 'card';
  const date = localStorage.getItem('payment_date') || new Date().toISOString();
  const txnId = `TXN-${Date.now()}`;
  
  // Map payment method to display name
  let methodDisplay = 'Credit Card';
  if (method === 'ach') {
    methodDisplay = 'ACH Transfer';
  } else if (method === 'invoice') {
    methodDisplay = 'Invoice';
  } else if (method === 'card') {
    methodDisplay = 'Credit Card';
  }
  
  setPaymentInfo({
    method: methodDisplay,
    date: new Date(date).toLocaleDateString(),
    transactionId: txnId
  });
}, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Your certification application payment has been processed
          </p>
          
          <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
            <Award className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-700">You can now begin your assessment</span>
          </div>
        </div>

        {/* Payment Details Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Confirmation</h2>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
              <p className="font-mono text-sm font-semibold">{paymentInfo.transactionId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
              <p className="font-semibold text-green-600 text-lg">$1,200.00</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Payment Method</p>
              <p className="font-semibold">{paymentInfo.method}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Date</p>
              <p className="font-semibold">{paymentInfo.date}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Confirmation Email Sent:</strong> A receipt has been sent to your email address. You can access it anytime from your dashboard.
            </p>
          </div>

          {/* What's Next */}
          <div className="border-t pt-6">
            <h3 className="font-bold text-gray-900 mb-4">What's Next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Complete Your Assessment</p>
                  <p className="text-sm text-gray-600">All assessment sections are now unlocked and ready for you to complete</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Review & Submit</p>
                  <p className="text-sm text-gray-600">Your progress saves automatically - complete sections at your own pace</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Receive Certification</p>
                  <p className="text-sm text-gray-600">After review (5-7 business days), receive your official certification and materials</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-3"
        >
          Go to Dashboard & Start Assessment
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? Contact us at{' '}
          <a href="mailto:support@cancerandcareers.org" className="text-blue-600 hover:underline">
            support@cancerandcareers.org
          </a>
        </p>
      </div>
    </div>
  );
}

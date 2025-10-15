// app/payment/stripe/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Building, Lock, CheckCircle } from 'lucide-react';

export default function StripePaymentPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    // Load data
    const method = localStorage.getItem('selected_payment_method') as 'card' | 'ach' || 'card';
    const company = localStorage.getItem('auth_company_name') || 'Your Organization';
    const email = localStorage.getItem('auth_email') || '';
    
    setPaymentMethod(method);
    setCompanyData({ name: company, email });
  }, []);

  // Simulate payment completion (replace with real Stripe integration)
  const handlePaymentSuccess = () => {
  setIsProcessing(true);
  
  // Simulate processing time
  setTimeout(() => {
    localStorage.setItem('payment_completed', 'true');
    localStorage.setItem('payment_date', new Date().toISOString());
    localStorage.setItem('payment_method', 'ach')
    
    router.push('/payment/success');
  }, 2000);
};

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 animate-pulse">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Processing Payment...
          </h2>
          
          <p className="text-gray-600 mb-6">
            Please wait while we securely process your payment through Stripe.
          </p>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
          
          <p className="text-sm text-gray-500">
            Do not refresh or close this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Secure Payment - {paymentMethod === 'card' ? 'Credit Card' : 'Bank Transfer'}
          </h1>
          <p className="text-gray-600">
            Complete your payment securely through Stripe
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Amount Display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
            <p className="text-3xl font-bold text-green-600">$1,250</p>
            <p className="text-sm text-gray-500 mt-2">
              {companyData.name} - Certification Fee
            </p>
          </div>

          {/* Stripe iframe placeholder */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50 min-h-[400px] flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              {paymentMethod === 'card' ? (
                <CreditCard className="w-8 h-8 text-blue-600" />
              ) : (
                <Building className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h3 className="font-bold text-xl mb-2">Stripe Payment Form</h3>
            <p className="text-gray-600 mb-4 max-w-md">
              When Stripe is connected, this area will display the secure Stripe {paymentMethod === 'card' ? 'card payment' : 'ACH'} form in an iframe.
            </p>
            <div className="bg-white rounded-lg p-4 border border-gray-200 max-w-md">
              <p className="text-sm text-gray-700 mb-2"><strong>Implementation Notes:</strong></p>
              <code className="text-xs text-blue-600 block mb-2">
                {paymentMethod === 'card' 
                  ? '// Use Stripe Checkout or Stripe Elements for cards'
                  : '// Use Stripe ACH Debit payment method'}
              </code>
              <p className="text-xs text-gray-600 mb-4">
                The Stripe form will be embedded here as an iframe for secure, PCI-compliant payment collection.
              </p>
              
              {/* Demo Button */}
              <button
                onClick={handlePaymentSuccess}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
              >
                [DEMO] Simulate Successful Payment
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-4 mb-6">
            <Lock className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Secure Payment Processing
              </p>
              <p className="text-xs text-gray-600">
                Your payment information is encrypted and processed securely through Stripe. We never store your complete payment details. All transactions are PCI DSS compliant.
              </p>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.push('/payment')}
            className="w-full px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            ← Change Payment Method
          </button>
        </div>

        {/* Stripe Logo/Badge */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-semibold">Stripe</span> - Industry-leading payment security
          </p>
        </div>
      </div>
    </div>
  );
}

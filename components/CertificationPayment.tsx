// components/CertificationPayment.tsx
"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Award, Building2, CreditCard, Loader2 } from "lucide-react";

interface CertificationPaymentProps {
  companyData?: {
    name?: string;
    email?: string;
    contactName?: string;
    industry?: string;
    size?: string;
  };
  score?: number;
  isEligible?: boolean;
}

export default function CertificationPayment({ 
  companyData = {},
  score = 85,
  isEligible = true 
}: CertificationPaymentProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  
  // GiftSmart form URL - replace with your production form when ready
  const GIFTSMART_FORM_URL = "https://fundraise.givesmart.com/form/AdWILw?vid=1m2tbw";
  
  // Get data from localStorage if not passed as props
  useEffect(() => {
    if (!companyData.name) {
      const storedData = localStorage.getItem('firmographics_data');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        companyData.name = parsed.companyName;
        companyData.contactName = parsed.contactName;
        companyData.industry = parsed.industry;
        companyData.size = parsed.companySize;
      }
    }
  }, []);

  const handleOpenPayment = () => {
    setIsLoading(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setIsLoading(false);
      setShowPaymentModal(true);
    }, 500);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    // Reset status after closing
    setTimeout(() => setPaymentStatus(null), 300);
  };

  // Listen for potential postMessage from GiftSmart (future enhancement)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from GiftSmart domain
      if (event.origin === 'https://fundraise.givesmart.com') {
        if (event.data.type === 'payment_complete') {
          setPaymentStatus('success');
          // Auto-close after success
          setTimeout(() => {
            handleCloseModal();
            // Redirect to success page or show success message
            window.location.href = '/certification/success';
          }, 2000);
        }
      }
    };

    if (showPaymentModal) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [showPaymentModal]);

  if (!isEligible) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-1 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Not Yet Eligible for Certification
              </h3>
              <p className="mt-2 text-gray-700">
                Your organization needs a score of 70 or higher to be eligible for certification. 
                Your current score is {score}.
              </p>
              <p className="mt-2 text-gray-700">
                Please review your assessment responses and improve your workplace cancer support 
                programs to qualify.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Certification CTA Section */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center mb-6">
            <Award className="w-12 h-12 text-indigo-600 mr-4" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Congratulations! You're Eligible for Certification
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
        <p className="font-medium">{companyData.name || 'Your Organization'}</p>
      </div>
    </div>
    <div>
      <p className="text-sm text-gray-500">Certification Status</p>
      <p className="font-medium text-green-600">Eligible ✓</p>
    </div>
    <div>
      <p className="text-sm text-gray-500">Application Type</p>
      <p className="font-medium">Standard Certification</p>
    </div>
    <div>
      <p className="text-sm text-gray-500">Certification Fee</p>
      <p className="font-medium">$1,200</p>
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

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
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
                  Complete Certification Application
                </>
              )}
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-8 py-4 border border-gray-300 rounded-lg font-semibold 
                       hover:bg-gray-50 transition-colors"
            >
              Save for Later
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-4 text-center">
            🔒 Secure payment processing powered by GiveSmart
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center 
                      justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[95vh] 
                        flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 
                          bg-gradient-to-r from-indigo-50 to-blue-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Certification Application Payment
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Best Companies for Working with Cancer • {companyData.name}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 
                         rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Payment Status Messages */}
            {paymentStatus === 'success' && (
              <div className="bg-green-50 border-b border-green-200 p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    Payment successful! Redirecting to your certification details...
                  </span>
                </div>
              </div>
            )}

            {/* Iframe Container */}
            <div className="flex-1 overflow-hidden relative bg-gray-50">
              <iframe
                src={GIFTSMART_FORM_URL}
                className="absolute inset-0 w-full h-full border-0"
                title="Certification Application Payment Form"
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
                onClick={handleCloseModal}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 
                         rounded hover:bg-gray-200 transition-colors"
              >
                Cancel Application
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

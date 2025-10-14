// app/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Award, ArrowRight } from 'lucide-react';
const handleDownloadReceipt = () => {
  // Create simple HTML receipt
  const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 700px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #ff6b35;
    }
    .header h1 {
      color: #ff6b35;
      margin: 0;
    }
    .checkmark {
      font-size: 60px;
      color: #10b981;
      margin-bottom: 10px;
    }
    .details {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e5e5;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #666;
      font-size: 14px;
    }
    .value {
      font-weight: bold;
      font-size: 14px;
    }
    .amount {
      font-size: 24px;
      color: #10b981;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e5e5;
      color: #666;
      font-size: 12px;
    }
    .next-steps {
      background: #eff6ff;
      border: 2px solid #3b82f6;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .next-steps h3 {
      color: #1e40af;
      margin-top: 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="checkmark">✓</div>
    <h1>Payment Receipt</h1>
    <p>Best Companies for Working with Cancer Index Assessment</p>
  </div>

  <div class="details">
    <div class="detail-row">
      <span class="label">Transaction ID</span>
      <span class="value">${paymentInfo.transactionId}</span>
    </div>
    <div class="detail-row">
      <span class="label">Date</span>
      <span class="value">${paymentInfo.date}</span>
    </div>
    <div class="detail-row">
      <span class="label">Payment Method</span>
      <span class="value">${paymentInfo.method}</span>
    </div>
    <div class="detail-row">
      <span class="label">Amount Paid</span>
      <span class="value amount">$1,200.00</span>
    </div>
  </div>

  <div class="next-steps">
    <h3>What's Next?</h3>
    <p><strong>1. Complete Your Assessment</strong><br>
    All assessment sections are now unlocked and ready for completion.</p>
    
    <p><strong>2. Review & Submit</strong><br>
    Your progress saves automatically - complete sections at your own pace.</p>
    
    <p><strong>3. Receive Certification</strong><br>
    After review (5-7 business days), receive your official certification and materials.</p>
  </div>

  <div class="footer">
    <p><strong>Cancer and Careers</strong></p>
    <p>75 Maiden Lane, Suite 501 | New York, NY 10038</p>
    <p>www.cancerandcareers.org | info@cancerandcareers.org</p>
    <p style="margin-top: 20px;">Thank you for your commitment to supporting employees with cancer!</p>
  </div>
</body>
</html>
  `;

  // Create and download
  const blob = new Blob([receiptHTML], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Payment-Receipt-${paymentInfo.transactionId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
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
    <strong>Payment Confirmation:</strong> Your payment has been processed. You can now access the full assessment from your dashboard.
  </p>
</div>
  {/* Download Receipt Button - ADD THIS */}
  <button
    onClick={handleDownloadReceipt}
    className="w-full px-6 py-3 bg-gray-100 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
  >
    <FileText className="w-5 h-5" />
    Download Payment Receipt (PDF)
  </button>
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

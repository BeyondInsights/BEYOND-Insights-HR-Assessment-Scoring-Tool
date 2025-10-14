// app/payment/invoice/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';

export default function InvoicePaymentPage() {
  const router = useRouter();
  const [poNumber, setPoNumber] = useState('');
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    const company = localStorage.getItem('auth_company_name') || 'Your Organization';
    const email = localStorage.getItem('auth_email') || '';
    setCompanyData({ name: company, email, address: '123 Business St, Suite 100, City, State 12345' });
  }, []);

  const handleGenerateInvoice = () => {
    // Store invoice request
    localStorage.setItem('invoice_requested', 'true');
    localStorage.setItem('invoice_po_number', poNumber);
    localStorage.setItem('invoice_date', new Date().toISOString());
    
    setInvoiceGenerated(true);
  };

  const handleDownloadInvoice = () => {
    // In production, this would trigger actual PDF download
    alert('Invoice PDF would download here. In production, this will generate and download a PDF invoice.');
    console.log('Downloading invoice with PO#:', poNumber);
  };

  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  if (invoiceGenerated) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Invoice Generated!
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Your invoice is ready. Download it and submit to your accounting department for payment processing.
            </p>

            {/* Invoice Details Box */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-bold mb-4">Invoice Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Number:</span>
                  <span className="font-semibold font-mono">INV-{Date.now()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date Issued:</span>
                  <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-semibold">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
                {poNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">PO Number:</span>
                    <span className="font-semibold">{poNumber}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Amount Due:</span>
                  <span className="font-bold text-green-600 text-lg">$1,200.00</span>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadInvoice}
              className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-3 mb-4"
            >
              <Download className="w-5 h-5" />
              Download Invoice PDF
            </button>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-blue-900 mb-2">Next Steps:</p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Download the invoice PDF above</li>
                <li>Submit to your accounting department for payment</li>
                <li>Payment should reference invoice number INV-{Date.now()}</li>
                <li>Once payment is received, you'll be notified and can begin your assessment</li>
              </ol>
            </div>

            {/* Wire Transfer Info */}
            <details className="text-left bg-gray-50 rounded-lg p-4 mb-6">
              <summary className="font-semibold cursor-pointer text-sm">
                Payment Instructions (Wire Transfer/Check)
              </summary>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-semibold mb-1">Wire Transfer:</p>
                  <p className="font-mono text-xs">
                    Bank: [Bank Name]<br/>
                    Account Name: Cancer and Careers / CEW Foundation<br/>
                    Account: [Account Number]<br/>
                    Routing: [Routing Number]<br/>
                    Reference: INV-{Date.now()}
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Check Payment:</p>
                  <p className="text-xs">
                    Make checks payable to: <strong>Cancer and Careers / CEW Foundation</strong><br/>
                    Mail to: [Mailing Address]<br/>
                    Include invoice number on check memo
                  </p>
                </div>
              </div>
            </details>

            {/* Assessment Access Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    Assessment Access
                  </p>
                  <p className="text-xs text-amber-700">
                    You can explore the dashboard now, but assessment sections will be unlocked after we receive your payment. We'll notify you at {companyData.email} when payment is confirmed.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleReturnToDashboard}
              className="w-full px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Go to Dashboard
            </button>

            <p className="text-xs text-gray-500 mt-4">
              A copy of this invoice has been sent to {companyData.email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Request Invoice
          </h1>
          <p className="text-gray-600">
            Provide your purchase order information
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Amount Display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Invoice Amount</p>
            <p className="text-3xl font-bold text-green-600">$1,200.00</p>
            <p className="text-sm text-gray-500 mt-2">Payment Terms: Net 30 Days</p>
          </div>

          {/* Invoice Details */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Bill To</p>
              <p className="font-semibold">{companyData.name}</p>
              <p className="text-sm text-gray-600">{companyData.address}</p>
              <p className="text-sm text-gray-600">{companyData.email}</p>
            </div>
          </div>

          {/* PO Number Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Purchase Order Number (Optional)
            </label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="PO-2025-001234"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">
              If your accounting department requires a PO number, enter it here. It will appear on the invoice.
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Assessment Access After Payment
                </p>
                <p className="text-xs text-amber-700">
                  Assessment sections will be unlocked after we receive your payment. Payment is due within 30 days of invoice date. You can explore the dashboard structure before payment is received.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/certification')}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={handleGenerateInvoice}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
            >
              Generate Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

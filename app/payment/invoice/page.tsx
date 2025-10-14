'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Building2, MapPin, Download, Loader2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function InvoicePaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companyData, setCompanyData] = useState({
    companyName: '',
    contactName: '',
    title: ''
  })
  const [formData, setFormData] = useState({
    poNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  })

  useEffect(() => {
    const companyName = localStorage.getItem('login_company_name') || ''
    const firstName = localStorage.getItem('login_first_name') || ''
    const lastName = localStorage.getItem('login_last_name') || ''
    const title = localStorage.getItem('login_title') || ''
    
    setCompanyData({
      companyName,
      contactName: `${firstName} ${lastName}`,
      title
    })
  }, [])

  const handleDownloadInvoice = () => {
    if (!formData.addressLine1 || !formData.city || !formData.state || !formData.zipCode || !formData.country) {
      alert('Please fill in all required address fields')
      return
    }

    setLoading(true)

    // Save invoice data
    const invoiceData = {
      ...companyData,
      ...formData,
      invoiceNumber: `INV-${Date.now()}`,
      invoiceDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      amount: 1200
    }
    localStorage.setItem('invoice_data', JSON.stringify(invoiceData))

    // Generate and download invoice
    setTimeout(() => {
      generateInvoiceHTML(invoiceData)
      setLoading(false)
      
      // Grant access to dashboard
      localStorage.setItem('payment_completed', 'invoice')
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    }, 1000)
  }

  const generateInvoiceHTML = (data: any) => {
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #ff6b35;
    }
    .logo-section {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .logo-box {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
      color: #ff6b35;
    }
    .invoice-details {
      text-align: right;
    }
    .invoice-details h1 {
      margin: 0 0 10px 0;
      color: #ff6b35;
      font-size: 32px;
    }
    .invoice-details p {
      margin: 5px 0;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #333;
      font-size: 16px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    .info-box {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #333;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 15px 12px;
      border-bottom: 1px solid #ddd;
    }
    .total-row {
      background: #f5f5f5;
      font-weight: bold;
      font-size: 18px;
    }
    .total-row td {
      border-bottom: none;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .payment-terms {
      background: #fff8f0;
      border: 2px solid #ff6b35;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .payment-terms h3 {
      color: #ff6b35;
      margin-top: 0;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="logo-box">CANCER + CAREERS</div>
      <div class="logo-box">BEST COMPANIES FOR<br>WORKING WITH CANCER</div>
    </div>
    <div class="invoice-details">
      <h1>INVOICE</h1>
      <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
      <p><strong>Invoice Date:</strong> ${data.invoiceDate}</p>
      <p><strong>Due Date:</strong> ${data.dueDate}</p>
      <p><strong>Payment Terms:</strong> Net 14</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h2>From</h2>
      <p><strong>Cancer and Careers</strong></p>
      <p>75 Maiden Lane, Suite 501</p>
      <p>New York, NY 10038</p>
      <p>United States</p>
      <p>Email: info@cancerandcareers.org</p>
    </div>
    <div class="info-box">
      <h2>Bill To</h2>
      <p><strong>${data.companyName}</strong></p>
      <p>${data.contactName}</p>
      <p>${data.title}</p>
      <p>${data.addressLine1}</p>
      ${data.addressLine2 ? `<p>${data.addressLine2}</p>` : ''}
      <p>${data.city}, ${data.state} ${data.zipCode}</p>
      <p>${data.country}</p>
      ${data.poNumber ? `<p><strong>PO #:</strong> ${data.poNumber}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: right; width: 150px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Application / Certification Fee</strong><br>
          <span style="color: #666; font-size: 14px;">
            Best Companies for Working with Cancer Index - Standard Certification
          </span>
        </td>
        <td style="text-align: right;">$1,200.00</td>
      </tr>
      <tr class="total-row">
        <td style="text-align: right;">TOTAL DUE:</td>
        <td style="text-align: right;">$1,200.00</td>
      </tr>
    </tbody>
  </table>

  <div class="payment-terms">
    <h3>Payment Terms & Instructions</h3>
    <p><strong>Payment is due within 14 days of invoice date.</strong></p>
    <p style="margin-top: 15px;"><strong>Payment Methods:</strong></p>
    <ul>
      <li>Check payable to: Cancer and Careers</li>
      <li>Wire Transfer: Contact info@cancerandcareers.org for details</li>
      <li>ACH: Contact info@cancerandcareers.org for details</li>
    </ul>
    <p style="margin-top: 15px;">
      Please include invoice number <strong>${data.invoiceNumber}</strong> with your payment.
    </p>
  </div>

  <div class="footer">
    <p>Thank you for your commitment to supporting employees with cancer!</p>
    <p>Cancer and Careers | www.cancerandcareers.org | info@cancerandcareers.org</p>
  </div>
</body>
</html>
    `

    // Create and download the invoice
    const blob = new Blob([invoiceHTML], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice-${data.invoiceNumber}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-10 flex-1">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <FileText className="w-10 h-10 text-orange-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request Invoice</h1>
              <p className="text-gray-600">Download your certification invoice</p>
            </div>
          </div>

          {/* Company Info (Pre-filled) */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Company Name</p>
                <p className="font-medium">{companyData.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact Person</p>
                <p className="font-medium">{companyData.contactName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Title</p>
                <p className="font-medium">{companyData.title}</p>
              </div>
            </div>
          </div>

          {/* Invoice Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleDownloadInvoice(); }}>
            {/* PO Number */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Purchase Order Number (Optional)
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="PO-123456"
              />
            </div>

            {/* Billing Address */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-gray-600" />
                Billing Address
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Suite 100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      State / Province <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      ZIP / Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="10001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Application / Certification Fee</span>
                <span className="text-2xl font-bold text-gray-900">$1,200.00</span>
              </div>
              <p className="text-sm text-gray-600">Payment Terms: Net 14 Days</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Invoice...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Invoice & Continue to Dashboard
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/payment')}
                className="px-8 py-4 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Payment Options
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

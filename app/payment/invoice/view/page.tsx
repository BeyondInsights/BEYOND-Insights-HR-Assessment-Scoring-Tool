'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Download, CheckCircle, Mail } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function InvoiceViewPage() {
  const router = useRouter()
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const sendInvoiceEmail = async () => {
  setEmailSending(true)
  
  try {
    const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email')
    const firstName = localStorage.getItem('login_first_name')
    const lastName = localStorage.getItem('login_last_name')
    const name = `${firstName} ${lastName}`.trim() || 'Valued Partner'
    
    const invoiceUrl = `${window.location.origin}/payment/invoice/view`
    const dashboardUrl = `${window.location.origin}/dashboard`
    
    const response = await fetch('/api/send-invoice-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, invoiceUrl, dashboardUrl })
    })
    
    if (!response.ok) {
      throw new Error('Failed to send email')
    }
    
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 5000)
  } catch (error) {
    console.error('Error sending email:', error)
    alert('Failed to send email. Please try again or contact support.')
  } finally {
    setEmailSending(false)
  }
}
  
  useEffect(() => {
    // Check if user has invoice data
    const invoiceDataStr = localStorage.getItem('invoice_data')
    const paymentMethod = localStorage.getItem('payment_method')
    
    if (!invoiceDataStr || paymentMethod !== 'invoice') {
      // No invoice data or not invoice payment - redirect
      router.push('/dashboard')
      return
    }

    try {
      const data = JSON.parse(invoiceDataStr)
      setInvoiceData(data)
    } catch (error) {
      console.error('Error loading invoice:', error)
      router.push('/dashboard')
      return
    }

    // Load jsPDF library
    if (!document.querySelector('script[src*="jspdf"]')) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.async = true
      script.onload = () => setScriptLoaded(true)
      script.onerror = () => {
        console.error('Failed to load jsPDF')
        setScriptLoaded(false)
      }
      document.body.appendChild(script)
    } else {
      setScriptLoaded(true)
    }

    setLoading(false)
  }, [router])

  const downloadInvoice = async () => {
    if (!scriptLoaded || !invoiceData) {
      alert('PDF library is still loading. Please try again in a moment.')
      return
    }

    setDownloading(true)

    try {
      const { jsPDF } = (window as any).jspdf
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 20

      // Try to add logos, but continue if they fail
      try {
        const cacImg = new Image()
        cacImg.crossOrigin = 'anonymous'
        cacImg.src = '/cancer-careers-logo.png'
        await new Promise((resolve) => {
          cacImg.onload = resolve
          setTimeout(resolve, 1000)
        })
        if (cacImg.complete) {
          doc.addImage(cacImg, 'PNG', 20, yPos, 50, 18)
        }

        const bcImg = new Image()
        bcImg.crossOrigin = 'anonymous'
        bcImg.src = '/best-companies-2026-logo.png'
        await new Promise((resolve) => {
          bcImg.onload = resolve
          setTimeout(resolve, 1000)
        })
        if (bcImg.complete) {
          const logoWidth = 30
          const centerX = (pageWidth - logoWidth) / 2
          doc.addImage(bcImg, 'PNG', centerX, yPos, logoWidth, 30)
        }
      } catch (logoError) {
        console.warn('Logos failed to load, continuing without them')
        doc.setFontSize(10)
        doc.setTextColor(255, 107, 53)
        doc.text('CANCER + CAREERS', 20, yPos)
        doc.text('BEST COMPANIES', pageWidth / 2, yPos + 5, { align: 'center' })
      }

      // Invoice header (right side)
      doc.setFontSize(28)
      doc.setTextColor(255, 107, 53)
      doc.text('INVOICE', pageWidth - 20, yPos + 5, { align: 'right' })
      
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      yPos += 15
      doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, pageWidth - 20, yPos, { align: 'right' })
      yPos += 6
      doc.text(`Invoice Date: ${invoiceData.invoiceDate}`, pageWidth - 20, yPos, { align: 'right' })
      yPos += 6
      doc.text(`Due Date: ${invoiceData.dueDate}`, pageWidth - 20, yPos, { align: 'right' })
      yPos += 6
      doc.text('Payment Terms: Net 30', pageWidth - 20, yPos, { align: 'right' })

      // Line separator
      yPos = 60
      doc.setDrawColor(255, 107, 53)
      doc.setLineWidth(1)
      doc.line(20, yPos, pageWidth - 20, yPos)

      // From and Bill To sections
      yPos += 10
      
      // From section (left)
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text('From', 20, yPos)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      yPos += 6
      doc.text('Cancer and Careers', 20, yPos)
      yPos += 5
      doc.text('250 W. 57th Street, Suite 918', 20, yPos)
      yPos += 5
      doc.text('New York, NY 10107', 20, yPos)
      yPos += 5
      doc.text('United States', 20, yPos)
      yPos += 5
      doc.text('Email: cacbestcompanies@cew.org', 20, yPos)

      // Bill To section (right)
      let rightYPos = 70
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text('Bill To', pageWidth / 2 + 10, rightYPos)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      rightYPos += 6
      doc.text(invoiceData.companyName, pageWidth / 2 + 10, rightYPos)
      rightYPos += 5
      doc.text(invoiceData.contactName, pageWidth / 2 + 10, rightYPos)
      rightYPos += 5
      doc.text(invoiceData.title, pageWidth / 2 + 10, rightYPos)
      rightYPos += 5
      doc.text(invoiceData.addressLine1, pageWidth / 2 + 10, rightYPos)
      if (invoiceData.addressLine2) {
        rightYPos += 5
        doc.text(invoiceData.addressLine2, pageWidth / 2 + 10, rightYPos)
      }
      rightYPos += 5
      doc.text(`${invoiceData.city}, ${invoiceData.state} ${invoiceData.zipCode}`, pageWidth / 2 + 10, rightYPos)
      rightYPos += 5
      doc.text(invoiceData.country, pageWidth / 2 + 10, rightYPos)
      
      if (invoiceData.applicationId) {
        rightYPos += 5
        doc.setFont(undefined, 'bold')
        doc.text(`Application ID: ${invoiceData.applicationId}`, pageWidth / 2 + 10, rightYPos)
        doc.setFont(undefined, 'normal')
      }
      
      if (invoiceData.poNumber) {
        rightYPos += 5
        doc.setFont(undefined, 'bold')
        doc.text(`PO #: ${invoiceData.poNumber}`, pageWidth / 2 + 10, rightYPos)
        doc.setFont(undefined, 'normal')
      }

      // Table header
      yPos = Math.max(yPos, rightYPos) + 15
      doc.setFillColor(51, 51, 51)
      doc.rect(20, yPos, pageWidth - 40, 10, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, 'bold')
      doc.text('Description', 25, yPos + 7)
      doc.text('Amount', pageWidth - 25, yPos + 7, { align: 'right' })

      // Table content
      yPos += 15
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'bold')
      doc.text('Survey Fee', 25, yPos)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      yPos += 5
      doc.text('Best Companies for Working with Cancer Index', 25, yPos)
      
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text('$1,250.00', pageWidth - 25, yPos - 5, { align: 'right' })

      // Total row
      yPos += 10
      doc.setDrawColor(200, 200, 200)
      doc.line(20, yPos, pageWidth - 20, yPos)
      yPos += 8
      doc.setFillColor(245, 245, 245)
      doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F')
      doc.setFont(undefined, 'bold')
      doc.setFontSize(12)
      doc.text('TOTAL DUE:', pageWidth / 2, yPos + 2, { align: 'right' })
      doc.text('$1,250.00', pageWidth - 25, yPos + 2, { align: 'right' })

      // Payment Terms box
      yPos += 20
      doc.setDrawColor(255, 107, 53)
      doc.setLineWidth(0.5)
      doc.rect(20, yPos, pageWidth - 40, 88)
      
      doc.setFontSize(11)
      doc.setTextColor(255, 107, 53)
      doc.setFont(undefined, 'bold')
      yPos += 7
      doc.text('Payment Terms & Instructions', 25, yPos)
      
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'bold')
      yPos += 7
      doc.text('Payment is due within 30 days of invoice date.', 25, yPos)
      
      doc.setFont(undefined, 'normal')
      yPos += 7
      doc.text('Payment Methods:', 25, yPos)
      doc.setFontSize(9)
      yPos += 5
      doc.text('• Check payable to: Cosmetic Executive Women Foundation, LTD', 30, yPos)
      yPos += 4
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('  Mail to: 250 W. 57th Street, Suite 918, New York, NY 10107', 30, yPos)
      
      // ACH Transfer Details
      yPos += 6
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'bold')
      doc.text('• ACH Transfer (Domestic US Bank Transfer):', 30, yPos)
      doc.setFont(undefined, 'normal')
      yPos += 4
      doc.text('Account Name: Cosmetic Executive Women Foundation, LTD', 35, yPos)
      yPos += 4
      doc.text('Bank: Bank of America', 35, yPos)
      yPos += 4
      doc.text('ACH Routing Number: 021000322', 35, yPos)
      yPos += 4
      doc.text('Account Number: 483043533766', 35, yPos)
      yPos += 4
      doc.text(`Reference: ${invoiceData.invoiceNumber}`, 35, yPos)
      
      // Wire Transfer Details
      yPos += 6
      doc.setFont(undefined, 'bold')
      doc.text('• Wire Transfer (Domestic & International):', 30, yPos)
      doc.setFont(undefined, 'normal')
      yPos += 4
      doc.text('Wire Routing Number: 026009593', 35, yPos)
      yPos += 4
      doc.text('SWIFT Code: BOFAUS3N', 35, yPos)
      yPos += 4
      doc.text('Bank Address: One Bryant Park, 36th Floor, New York, NY 10036', 35, yPos)
      yPos += 4
      doc.text(`Reference: ${invoiceData.invoiceNumber}`, 35, yPos)
      
      // Contact & Instructions
      yPos += 5
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Please include the invoice number in your payment reference. Questions: cacbestcompanies@cew.org', 30, yPos)

      // Footer
      yPos = doc.internal.pageSize.getHeight() - 20
      doc.setDrawColor(200, 200, 200)
      doc.line(20, yPos, pageWidth - 20, yPos)
      yPos += 5
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text('Thank you for your commitment to supporting employees with cancer!', pageWidth / 2, yPos, { align: 'center' })
      yPos += 5
      doc.text('Cancer and Careers | www.cancerandcareers.org | cacbestcompanies@cew.org', pageWidth / 2, yPos, { align: 'center' })

      // Save the PDF
      doc.save(`Invoice-${invoiceData.invoiceNumber}.pdf`)
      
      setDownloading(false)
    } catch (error) {
      console.error('Error generating invoice:', error)
      alert('Error generating invoice. Please contact support at cacbestcompanies@cew.org')
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        <Header />
        <main className="max-w-5xl mx-auto px-6 py-10 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!invoiceData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-10 flex-1">
        {/* Success Banner */}
        <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-2">
                Invoice Generated Successfully
              </h3>
              <p className="text-green-800">
                Your invoice has been generated and you have immediate access to begin your survey. 
                Payment is due within 30 days.
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
  <div className="flex items-center">
    <FileText className="w-8 h-8 text-orange-600 mr-3" />
    <h1 className="text-2xl font-bold text-gray-900">Your Invoice</h1>
  </div>
  <div className="flex gap-3">
    <button
      onClick={sendInvoiceEmail}
      disabled={emailSending}
      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Mail className="w-5 h-5" />
      {emailSending ? 'Sending...' : emailSent ? 'Email Sent!' : 'Email Invoice to Me'}
    </button>
    <button
      onClick={downloadInvoice}
      disabled={!scriptLoaded || downloading}
      className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-5 h-5" />
      {downloading ? 'Generating PDF...' : 'Download Invoice PDF'}
    </button>
  </div>
</div>

{emailSent && (
  <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
    <p className="text-sm text-green-800">
      ✓ Invoice link sent to your email! Check your inbox.
    </p>
  </div>
)}
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">INVOICE DETAILS</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Invoice Number</p>
                    <p className="font-mono font-semibold text-gray-900">{invoiceData.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Invoice Date</p>
                    <p className="font-medium text-gray-900">{invoiceData.invoiceDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className="font-medium text-gray-900">{invoiceData.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment Terms</p>
                    <p className="font-medium text-gray-900">Net 30</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">BILL TO</h3>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{invoiceData.companyName}</p>
                  <p className="text-gray-700">{invoiceData.contactName}</p>
                  <p className="text-gray-700">{invoiceData.title}</p>
                  <p className="text-gray-700">{invoiceData.addressLine1}</p>
                  {invoiceData.addressLine2 && (
                    <p className="text-gray-700">{invoiceData.addressLine2}</p>
                  )}
                  <p className="text-gray-700">
                    {invoiceData.city}, {invoiceData.state} {invoiceData.zipCode}
                  </p>
                  <p className="text-gray-700">{invoiceData.country}</p>
                  {invoiceData.applicationId && (
                    <p className="text-gray-700 mt-2">
                      <span className="font-semibold">Application ID:</span> {invoiceData.applicationId}
                    </p>
                  )}
                  {invoiceData.poNumber && (
                    <p className="text-gray-700">
                      <span className="font-semibold">PO #:</span> {invoiceData.poNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Amount Due */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Survey Fee</p>
                  <p className="text-xs text-gray-500">Best Companies for Working with Cancer Index</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">$1,250.00</p>
              </div>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <p className="text-sm text-orange-900">
                <strong>📧 Invoice Download:</strong> You can download it anytime using the button above.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
<div>
  <button
    onClick={() => router.push('/dashboard')}
    className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
  >
    Return to Dashboard →
  </button>
</div>
      </main>

      <Footer />
    </div>
  )
}

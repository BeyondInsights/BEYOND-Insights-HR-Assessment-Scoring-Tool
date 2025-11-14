'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Download, Loader2, ArrowLeft, Mail } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function InvoiceViewPage() {
  const router = useRouter()
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // Get invoice ID from URL after component mounts
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    
    // Load invoice data from localStorage
    const storedData = localStorage.getItem('invoice_data')
    if (storedData) {
      const data = JSON.parse(storedData)
      // If no ID in URL, just show the stored invoice
      // If ID in URL, verify it matches
      if (!id || data.invoiceNumber === id) {
        setInvoiceData(data)
        setInvoiceId(data.invoiceNumber || id)
      }
    }

    // Load jsPDF
    if (!document.querySelector('script[src*="jspdf"]')) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.async = true
      script.onload = () => {
        setScriptLoaded(true)
        setLoading(false)
      }
      document.body.appendChild(script)
    } else {
      setScriptLoaded(true)
      setLoading(false)
    }
  }, [])

  const generatePDFBase64 = async () => {
    if (!invoiceData || !scriptLoaded) return ''

    const { jsPDF } = (window as any).jspdf
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let yPos = 20

    // Try to add the Cancer + Careers logo
    try {
      const cacImg = new Image()
      cacImg.crossOrigin = 'anonymous'
      cacImg.src = '/cancer-careers-logo.png'
      
      await new Promise((resolve, reject) => {
        cacImg.onload = resolve
        cacImg.onerror = reject
        setTimeout(reject, 500)
      })
      
      if (cacImg.complete && cacImg.naturalWidth > 0) {
        doc.addImage(cacImg, 'PNG', 20, yPos, 45, 16, undefined, 'FAST')
      }
    } catch (logoError) {
      doc.setFontSize(14)
      doc.setTextColor(255, 107, 53)
      doc.setFont(undefined, 'bold')
      doc.text('CANCER + CAREERS', 20, yPos + 10)
    }
  
    // Invoice header
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

    // From section
    yPos += 10
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

    // Bill To section
    let rightYPos = 70
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('Bill To', pageWidth / 2 + 10, rightYPos)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    rightYPos += 6
    doc.text(invoiceData.companyName || 'BEYOND Insights', pageWidth / 2 + 10, rightYPos)
    rightYPos += 5
    doc.text(invoiceData.contactName, pageWidth / 2 + 10, rightYPos)
    if (invoiceData.title) {
      rightYPos += 5
      doc.text(invoiceData.title, pageWidth / 2 + 10, rightYPos)
    }
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

    // Table
    yPos = Math.max(yPos, rightYPos) + 15
    doc.setFillColor(51, 51, 51)
    doc.rect(20, yPos, pageWidth - 40, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.text('Description', 25, yPos + 7)
    doc.text('Amount', pageWidth - 25, yPos + 7, { align: 'right' })

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

    // Total
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

    // Payment Terms box with all details
    yPos += 20
    doc.setDrawColor(255, 107, 53)
    doc.setLineWidth(0.5)
    doc.rect(20, yPos, pageWidth - 40, 92)
    
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
    
    // Wire Transfer Details - UPDATED with Account Number
    yPos += 6
    doc.setFont(undefined, 'bold')
    doc.text('• Wire Transfer (Domestic & International):', 30, yPos)
    doc.setFont(undefined, 'normal')
    yPos += 4
    doc.text('Account Number: 483043533766', 35, yPos)
    yPos += 4
    doc.text('Wire Routing Number: 026009593', 35, yPos)
    yPos += 4
    doc.text('SWIFT Code: BOFAUS3N', 35, yPos)
    yPos += 4
    doc.text('Bank Address: One Bryant Park, 36th Floor, New York, NY 10036', 35, yPos)
    yPos += 4
    doc.text(`Reference: ${invoiceData.invoiceNumber}`, 35, yPos)
    
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

    // Return base64 only (no save)
    return doc.output('datauristring', { compress: true }).split(',')[1]
  }

  const generateAndDownloadPDF = async () => {
    const base64 = await generatePDFBase64()
    
    // Convert base64 back to blob for download
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice-${invoiceData.invoiceNumber}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-orange-600" />
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
            <p className="text-gray-600 mb-6">
              This invoice may have expired or the link is invalid.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
            >
              Go to Dashboard
            </button>
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
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Invoice #{invoiceData.invoiceNumber}</h1>
                <p className="opacity-90">Cancer and Careers Best Companies Index</p>
              </div>
              <FileText className="w-16 h-16 opacity-20" />
            </div>
          </div>

          {/* Invoice Details */}
          <div className="p-8">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="font-semibold text-gray-900 mb-4">Bill To:</h2>
                <div className="text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">{invoiceData.companyName}</p>
                  <p>{invoiceData.contactName}</p>
                  <p>{invoiceData.title}</p>
                  <p>{invoiceData.addressLine1}</p>
                  {invoiceData.addressLine2 && <p>{invoiceData.addressLine2}</p>}
                  <p>{invoiceData.city}, {invoiceData.state} {invoiceData.zipCode}</p>
                  <p>{invoiceData.country}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Invoice Date:</span>
                    <p className="font-medium">{invoiceData.invoiceDate}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Due Date:</span>
                    <p className="font-medium">{invoiceData.dueDate}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount Due:</span>
                    <p className="text-3xl font-bold text-orange-600 mt-1">$1,250.00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="border rounded-lg overflow-hidden mb-8">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-6 py-4">
                      <p className="font-medium">Survey Fee</p>
                      <p className="text-sm text-gray-500">Best Companies for Working with Cancer Index</p>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">$1,250.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Actions - ALL THREE BUTTONS */}
            <div className="flex gap-4">
              <button
                onClick={generateAndDownloadPDF}
                className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Download PDF Invoice
              </button>
              
              <button
                onClick={async () => {
                  const contactEmail = localStorage.getItem('login_email') || ''
                  const pdfBase64 = await generatePDFBase64()
                  
                  const emailResponse = await fetch('/api/send-invoice-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: contactEmail,
                      name: invoiceData.contactName,
                      invoiceUrl: window.location.href,
                      dashboardUrl: `${window.location.origin}/dashboard`,
                      invoicePdfBase64: pdfBase64,
                    }),
                  })
                  
                  if (emailResponse.ok) {
                    alert('Invoice has been emailed to ' + contactEmail)
                  } else {
                    alert('Failed to send email. Please try again.')
                  }
                }}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
              >
                <Mail className="w-5 h-5 mr-2" />
                Email Invoice to Me
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
            </div>

            {/* Payment Instructions */}
            <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-amber-900 mb-2">Payment Instructions</h3>
              <p className="text-sm text-amber-800">
                Payment is due within 30 days. Please reference invoice #{invoiceData.invoiceNumber} with your payment.
                For payment options, see the downloaded invoice or contact cacbestcompanies@cew.org
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

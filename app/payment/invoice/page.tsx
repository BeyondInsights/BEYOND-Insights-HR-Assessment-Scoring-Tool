'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Building2, MapPin, Download, Loader2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getCurrentUser } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

export default function InvoicePaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [companyData, setCompanyData] = useState({
    companyName: '',
    contactName: '',
    title: '',
    applicationId: ''
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
    try {
      const companyName = localStorage.getItem('login_company_name') || ''
      const firstName = localStorage.getItem('login_first_name') || ''
      const lastName = localStorage.getItem('login_last_name') || ''
      const title = localStorage.getItem('login_title') || ''
      const applicationId = localStorage.getItem('login_application_id') || ''
      
      setCompanyData({
        companyName,
        contactName: `${firstName} ${lastName}`,
        title,
        applicationId
      })

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
    } catch (error) {
      console.error('Error in useEffect:', error)
    }
  }, [])

  const handleDownloadInvoice = async () => {
    if (!formData.addressLine1 || !formData.city || !formData.state || !formData.zipCode || !formData.country) {
      alert('Please fill in all required address fields')
      return
    }

    if (!scriptLoaded) {
      alert('PDF library is still loading. Please try again in a moment.')
      return
    }

    setLoading(true)

    try {
      // Save invoice data
      const invoiceData = {
        ...companyData,
        ...formData,
        invoiceNumber: `INV-${Date.now()}`,
        invoiceDate: new Date().toLocaleDateString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), // Changed to 30 days
        amount: 1250
      }
      localStorage.setItem('invoice_data', JSON.stringify(invoiceData))

      // Generate PDF
      await generateInvoicePDF(invoiceData)
      
      // Grant immediate access to dashboard with invoice payment
      localStorage.setItem('payment_method', 'invoice');
      localStorage.setItem('payment_completed', 'true');  // ✅ CHANGED TO TRUE - grants immediate access
      localStorage.setItem('payment_date', new Date().toISOString());

      // ALSO save to database
      try {
        const user = await getCurrentUser()
        if (user) {
          await supabase
  .from('assessments')
  .update({
    payment_completed: true,  // ✅ CHANGED TO TRUE - grants immediate access
    payment_method: 'invoice',
    payment_date: new Date().toISOString()
  })
  .eq('user_id', user.id)
        }
      } catch (error) {
        console.error('Error saving payment to database:', error)
      }
      
      setLoading(false)
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error generating invoice:', error)
      alert('There was an error generating the invoice. Please try again.')
      setLoading(false)
    }
  }

  const generateInvoicePDF = async (data: any) => {
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
          setTimeout(resolve, 1000) // Timeout after 1 second
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
        // Add text fallback
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
      doc.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - 20, yPos, { align: 'right' })
      yPos += 6
      doc.text(`Invoice Date: ${data.invoiceDate}`, pageWidth - 20, yPos, { align: 'right' })
      yPos += 6
      doc.text(`Due Date: ${data.dueDate}`, pageWidth - 20, yPos, { align: 'right' })
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
      doc.text(data.companyName, pageWidth / 2 + 10, rightYPos)
      rightYPos += 5
      doc.text(data.contactName, pageWidth / 2 + 10, rightYPos)
      rightYPos += 5
      doc.text(data.title, pageWidth / 2 + 10, rightYPos)
      rightYPos += 5
      doc.text(data.addressLine1, pageWidth / 2 + 10, rightYPos)
      if (data.addressLine2) {
        rightYPos += 5
        doc.text(data.addressLine2, pageWidth / 2 + 10, rightYPos)
      }
      rightYPos += 5
      doc.text(`${data.city}, ${data.state} ${data.zipCode}`, pageWidth / 2 + 10, rightYPos)
      rightYPos += 5
      doc.text(data.country, pageWidth / 2 + 10, rightYPos)
      
      // Application ID
      if (data.applicationId) {
        rightYPos += 5
        doc.setFont(undefined, 'bold')
        doc.text(`Application ID: ${data.applicationId}`, pageWidth / 2 + 10, rightYPos)
        doc.setFont(undefined, 'normal')
      }
      
      if (data.poNumber) {
        rightYPos += 5
        doc.setFont(undefined, 'bold')
        doc.text(`PO #: ${data.poNumber}`, pageWidth / 2 + 10, rightYPos)
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
      doc.text('Assessment Fee', 25, yPos)
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

      // Payment Terms box - Ends right after payment instructions
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
      doc.text('• Check payable to: Cosmetic Executive Women, Foundation, LTD', 30, yPos)
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
      doc.text('Account Name: Cosmetic Executive Women, Foundation, LTD', 35, yPos)
      yPos += 4
      doc.text('Bank: Bank of America', 35, yPos)
      yPos += 4
      doc.text('ACH Routing Number: 021000322', 35, yPos)
      yPos += 4
      doc.text('Account Number: 483043533766', 35, yPos)
      yPos += 4
      doc.text(`Reference: ${data.invoiceNumber}`, 35, yPos)
      
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
      doc.text(`Reference: ${data.invoiceNumber}`, 35, yPos)
      
      // Contact & Instructions - LAST LINE IN BOX
      yPos += 5
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Please include the invoice number in your payment reference. Questions: cacbestcompanies@cew.org', 30, yPos)

      // Move past the orange box before adding footer
      yPos += 15

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
      doc.save(`Invoice-${data.invoiceNumber}.pdf`)
    } catch (error) {
      console.error('Error in PDF generation:', error)
      throw error
    }
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
              <p className="text-gray-600">For organizations requiring internal payment processing</p>
            </div>
          </div>

          {/* Updated Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 font-semibold mb-2">
              You'll receive immediate access to begin your survey
            </p>
            <p className="text-sm text-blue-900">
              Your invoice will download automatically. Results will be provided upon receipt of payment within 30 days.
            </p>
          </div>

          {/* Company Info (Pre-filled) - COMPACT LAYOUT */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Company Name</p>
                <p className="font-medium">{companyData.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact Person</p>
                <p className="font-medium">{companyData.contactName}</p>
                <p className="text-sm text-gray-500 mt-2">Title</p>
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
                      State / Province / Region <span className="text-red-500">*</span>
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
                <span className="text-gray-700">Assessment Fee</span>
                <span className="text-2xl font-bold text-gray-900">$1,250.00</span>
              </div>
              <p className="text-sm text-gray-600">Payment Terms: Net 30 Days</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading || !scriptLoaded}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Invoice...
                  </>
                ) : !scriptLoaded ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading PDF Library...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Invoice & Begin Survey
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

'use client'
import { useRouter, usePathname } from 'next/navigation'
import { FileText, Download, Receipt } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [showInvoiceButton, setShowInvoiceButton] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  
  // Check if user paid via invoice
  useEffect(() => {
  if (typeof window !== 'undefined') {
    const currentEmail = localStorage.getItem('auth_email')
    const lastUserEmail = localStorage.getItem('last_user_email')
    
    // If different user, clear payment data
    if (lastUserEmail && lastUserEmail !== currentEmail) {
      console.log('Different user in header - hiding invoice button')
      setShowInvoiceButton(false)
      return
    }
    
    const paymentMethod = localStorage.getItem('payment_method')
    const isInvoice = paymentMethod === 'invoice'
    setShowInvoiceButton(isInvoice)
      
      // Load jsPDF library if needed
      if (isInvoice && !document.querySelector('script[src*="jspdf"]')) {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        script.async = true
        script.onload = () => setScriptLoaded(true)
        script.onerror = () => {
          console.error('Failed to load jsPDF')
          setScriptLoaded(false)
        }
        document.body.appendChild(script)
      } else if (isInvoice) {
        setScriptLoaded(true)
      }
    }
  }, [])
  
  const downloadInvoice = async () => {
    if (!scriptLoaded) {
      alert('PDF library is still loading. Please try again in a moment.')
      return
    }

    try {
      // Load invoice data from localStorage
      const invoiceDataStr = localStorage.getItem('invoice_data')
      if (!invoiceDataStr) {
        alert('Invoice data not found. Please contact support.')
        return
      }

      const data = JSON.parse(invoiceDataStr)
      
      // Generate PDF using the same function as invoice payment page
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
      
      // Contact & Instructions
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
      console.error('Error generating invoice:', error)
      alert('Error generating invoice. Please contact support at cacbestcompanies@cew.org')
    }
  }
  
  // Hide Back to Dashboard on Dashboard, Letter, and Authorization pages
  const showBack = !['/dashboard', '/letter', '/authorization'].includes(pathname)
  const onPrintPage = pathname === '/survey/print'
  const goPrintView = () => router.push('/survey/print')
  
  return (
    <header className="shadow-md">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 gap-4">
          {/* Left: Empty space for balance */}
          <div className="flex-1"></div>
          
          {/* Center: CAC Logo - Larger and Centered */}
          <div className="flex-1 flex justify-center">
            <img
              src="/cancer-careers-logo.png"
              alt="Cancer and Careers Logo"
              className="h-14 sm:h-18 lg:h-22 w-auto"
            />
          </div>
          
          {/* Right: Stacked buttons with equal width */}
          <div className="flex-1 flex justify-end">
            <div className="flex flex-col gap-2 w-64">
              <button
                onClick={() => router.push('/company-profile')}
                className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-gray-800 transition text-sm w-full"
                title="View your company profile"
              >
                <FileText className="w-4 h-4" />
                Review Your Company Profile
              </button>
              
              {!onPrintPage && (
                <button
                  onClick={goPrintView}
                  className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-gray-800 transition text-sm w-full"
                  title="Open printable full survey"
                >
                  <Download className="w-4 h-4" />
                  Review / Download Survey
                </button>
              )}
              
              {showInvoiceButton && (
                <button
                  onClick={downloadInvoice}
                  disabled={!scriptLoaded}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-green-700 transition text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download your invoice"
                >
                  <Receipt className="w-4 h-4" />
                  {scriptLoaded ? 'Download Invoice' : 'Loading...'}
                </button>
              )}
              
              {showBack && !onPrintPage && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-black text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-gray-800 transition text-sm w-full"
                  title="Back to Dashboard"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="h-2 bg-orange-600" />
    </header>
  )
}

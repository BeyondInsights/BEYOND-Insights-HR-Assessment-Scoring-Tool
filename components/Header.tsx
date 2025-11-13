'use client'
import { useRouter, usePathname } from 'next/navigation'
import { FileText, Download, Receipt } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [showInvoiceButton, setShowInvoiceButton] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  
  // Check if user paid via invoice
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const paymentMethod = localStorage.getItem('payment_method')
      const isInvoice = paymentMethod === 'invoice'
      setShowInvoiceButton(isInvoice)
      
      if (isInvoice) {
        // Load invoice data
        const companyName = localStorage.getItem('login_company_name') || ''
        const email = localStorage.getItem('auth_email') || ''
        const firstName = localStorage.getItem('login_first_name') || ''
        const lastName = localStorage.getItem('login_last_name') || ''
        const appId = localStorage.getItem('login_application_id') || ''
        const paymentDate = localStorage.getItem('payment_date') || new Date().toISOString()
        
        setInvoiceData({
          companyName,
          email,
          firstName,
          lastName,
          appId,
          paymentDate
        })
      }
    }
  }, [])
  
  const downloadInvoice = async () => {
    if (!invoiceData) return
    
    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf')
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      
      // Header - Cancer and Careers branding
      doc.setFillColor(107, 44, 145) // Purple #6B2C91
      doc.rect(0, 0, pageWidth, 35, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('INVOICE', pageWidth / 2, 20, { align: 'center' })
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Best Companies for Working with Cancer: Employer Index', pageWidth / 2, 28, { align: 'center' })
      
      // Reset text color for body
      doc.setTextColor(0, 0, 0)
      
      // Invoice details section
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('BILL TO:', 20, 50)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(invoiceData.companyName, 20, 58)
      if (invoiceData.firstName || invoiceData.lastName) {
        doc.text(`${invoiceData.firstName} ${invoiceData.lastName}`.trim(), 20, 65)
      }
      doc.text(invoiceData.email, 20, 72)
      
      // Invoice number and date (right side)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Invoice Number:', pageWidth - 80, 50)
      doc.text('Invoice Date:', pageWidth - 80, 58)
      doc.text('Payment Terms:', pageWidth - 80, 66)
      
      doc.setFont('helvetica', 'normal')
      doc.text(invoiceData.appId || 'INV-001', pageWidth - 20, 50, { align: 'right' })
      doc.text(new Date(invoiceData.paymentDate).toLocaleDateString(), pageWidth - 20, 58, { align: 'right' })
      doc.text('Net 14', pageWidth - 20, 66, { align: 'right' })
      
      // Line items table
      const tableTop = 90
      
      // Table header
      doc.setFillColor(240, 240, 240)
      doc.rect(20, tableTop, pageWidth - 40, 10, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Description', 25, tableTop + 7)
      doc.text('Amount', pageWidth - 25, tableTop + 7, { align: 'right' })
      
      // Table row
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const rowY = tableTop + 18
      doc.text('Best Companies for Working with Cancer: Employer Index', 25, rowY)
      doc.text('Assessment Fee', 25, rowY + 5)
      doc.text('$1,250.00', pageWidth - 25, rowY, { align: 'right' })
      
      // Subtotal line
      doc.line(20, rowY + 15, pageWidth - 20, rowY + 15)
      
      // Subtotal
      doc.setFont('helvetica', 'bold')
      doc.text('Subtotal:', pageWidth - 60, rowY + 25)
      doc.text('$1,250.00', pageWidth - 25, rowY + 25, { align: 'right' })
      
      // Total
      doc.setFontSize(12)
      doc.setFillColor(107, 44, 145)
      doc.rect(pageWidth - 90, rowY + 30, 70, 12, 'F')
      doc.setTextColor(255, 255, 255)
      doc.text('TOTAL DUE:', pageWidth - 85, rowY + 38)
      doc.text('$1,250.00', pageWidth - 25, rowY + 38, { align: 'right' })
      
      // Reset text color
      doc.setTextColor(0, 0, 0)
      
      // Payment instructions
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Payment Instructions:', 20, rowY + 60)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Payment is due within 14 days of invoice date.', 20, rowY + 68)
      doc.text('Please reference your Invoice Number when making payment.', 20, rowY + 75)
      
      doc.setFont('helvetica', 'bold')
      doc.text('Make checks payable to:', 20, rowY + 85)
      doc.setFont('helvetica', 'normal')
      doc.text('CEW Foundation', 20, rowY + 92)
      
      doc.setFont('helvetica', 'bold')
      doc.text('Mail to:', 20, rowY + 102)
      doc.setFont('helvetica', 'normal')
      doc.text('Cancer and Careers', 20, rowY + 109)
      doc.text('c/o CEW Foundation', 20, rowY + 116)
      doc.text('[Address Line 1]', 20, rowY + 123)
      doc.text('[Address Line 2]', 20, rowY + 130)
      
      // Footer
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Questions? Contact us at cacbestcompanies@cew.org', pageWidth / 2, pageHeight - 15, { align: 'center' })
      doc.text('Thank you for your participation in the Best Companies for Working with Cancer initiative.', pageWidth / 2, pageHeight - 10, { align: 'center' })
      
      // Save the PDF
      const fileName = `Invoice_${invoiceData.appId}_${invoiceData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('Error generating invoice:', error)
      alert('Error generating invoice. Please contact support.')
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
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-green-700 transition text-sm w-full"
                  title="Download your invoice"
                >
                  <Receipt className="w-4 h-4" />
                  Download Invoice
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

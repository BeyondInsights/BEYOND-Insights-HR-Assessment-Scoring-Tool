'use client'
import { useRouter, usePathname } from 'next/navigation'
import { FileText, Download, Receipt } from 'lucide-react'
import { useState, useEffect } from 'react'
import SyncStatusIndicator from './SyncStatusIndicator'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [showInvoiceButton, setShowInvoiceButton] = useState(false)
  
  // Check if user paid via invoice - WITH NUCLEAR USER VERIFICATION
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentEmail = localStorage.getItem('auth_email')
      const paymentMethod = localStorage.getItem('payment_method')
      const lastUserEmail = localStorage.getItem('last_user_email')
      
      // NUCLEAR OPTION: If there's a last user email and it doesn't match current, NUKE everything payment-related
      if (lastUserEmail && currentEmail && lastUserEmail !== currentEmail) {
        console.log('🧹 Header detected different user - clearing payment data')
        localStorage.removeItem('payment_method')
        localStorage.removeItem('payment_completed')
        localStorage.removeItem('payment_date')
        localStorage.removeItem('invoice_data')
        setShowInvoiceButton(false)
        return
      }
      
      // Only show if payment method is invoice AND there's a current user
      const isInvoice = paymentMethod === 'invoice' && currentEmail
      setShowInvoiceButton(isInvoice)
    }
  }, [])
  
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
          
          {/* Right: Sync status + Stacked buttons */}
          <div className="flex-1 flex justify-end">
            <div className="flex flex-col gap-2 w-64">
              {/* Sync Status Indicator */}
              <div className="flex justify-end mb-1">
                <SyncStatusIndicator />
              </div>
              
              <button
                onClick={() => router.push('/company-profile')}
                className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-gray-800 transition text-sm w-full"
                title="View your saved survey responses"
              >
                <FileText className="w-4 h-4" />
                Review / Download My Responses
              </button>
              
              {!onPrintPage && (
                <button
                  onClick={goPrintView}
                  className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-gray-800 transition text-sm w-full"
                  title="View blank survey questions for reference"
                >
                  <Download className="w-4 h-4" />
                  Review / Download Survey Questions
                </button>
              )}
              
              {showInvoiceButton && (
  <button
    onClick={() => router.push('/payment/invoice/view')}
    className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-green-700 transition text-sm w-full"
    title="View and download your invoice"
  >
    <Receipt className="w-4 h-4" />
    View Invoice
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

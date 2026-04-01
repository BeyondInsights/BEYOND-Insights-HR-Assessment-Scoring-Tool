'use client'
import { useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { FileText, Download, Receipt, AlertCircle } from 'lucide-react'
import { useAssessmentContext } from '@/lib/assessment-context'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const ctx = useAssessmentContext()

  const showInvoiceButton = ctx.paymentMethod === 'invoice' && !!ctx.email

  // Count unsure responses across all 13 dimensions
  const unsureCount = useMemo(() => {
    let count = 0
    for (let i = 1; i <= 13; i++) {
      const data = ctx.getSectionData(`dimension${i}`)
      if (!data) continue
      const grid = data[`d${i}a`]
      if (!grid || typeof grid !== 'object') continue
      Object.values(grid).forEach((status) => {
        if (typeof status === 'string' && status.toLowerCase().includes('unsure')) count++
      })
    }
    return count
  }, [ctx])
  
  // Hide Back to Dashboard on Dashboard, Letter, and Authorization pages
  const showBack = !['/dashboard', '/letter', '/authorization'].includes(pathname)
  const onPrintPage = pathname === '/survey/print'
  const goPrintView = () => router.push('/survey/print')
  
  return (
    <header className="shadow-md">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2 gap-4">
          {/* Left: CAC Logo */}
          <div className="flex-shrink-0">
            <img
              src="/cancer-careers-logo.png"
              alt="Cancer and Careers Logo"
              className="h-12 w-auto"
            />
          </div>
          
          {/* Right: Buttons in a row + Sync indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/company-profile')}
              className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-800 transition text-xs whitespace-nowrap"
              title="View your saved survey responses"
            >
              <FileText className="w-3.5 h-3.5" />
              My Responses
            </button>

            {unsureCount > 0 && pathname !== '/survey/review-unsure' && (
              <button
                onClick={() => router.push('/survey/review-unsure')}
                className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-2 rounded-lg font-medium shadow-sm hover:bg-purple-700 transition text-xs whitespace-nowrap"
                title="Review and update elements marked as Unsure"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Unsure ({unsureCount})
              </button>
            )}

            {!onPrintPage && (
              <button
                onClick={goPrintView}
                className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-800 transition text-xs whitespace-nowrap"
                title="View blank survey questions for reference"
              >
                <Download className="w-3.5 h-3.5" />
                Survey Questions
              </button>
            )}
            
            {showInvoiceButton && (
              <button
                onClick={() => router.push('/payment/invoice/view')}
                className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg font-medium shadow-sm hover:bg-green-700 transition text-xs whitespace-nowrap"
                title="View and download your invoice"
              >
                <Receipt className="w-3.5 h-3.5" />
                Invoice
              </button>
            )}
            
            {showBack && !onPrintPage && (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-3 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-700 transition text-xs whitespace-nowrap"
                title="Back to Dashboard"
              >
                Dashboard
              </button>
            )}
            
            {/* Save Status */}
            {ctx.isSaving && (
              <div className="border-l border-gray-300 pl-3 ml-1 text-xs text-blue-600">
                Saving...
              </div>
            )}
            {ctx.lastSaveError && !ctx.isSaving && (
              <div className="border-l border-gray-300 pl-3 ml-1 text-xs text-amber-600">
                Save failed
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="h-1.5 bg-orange-600" />
    </header>
  )
}

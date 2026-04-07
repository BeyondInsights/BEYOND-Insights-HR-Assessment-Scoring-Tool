'use client'
import { useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { FileText, Download, Receipt, AlertCircle, List } from 'lucide-react'
import { useAssessmentContext } from '@/lib/assessment-context'

const SCALE_DEFINITIONS = [
  { label: 'In Place', color: '#0D9488', desc: 'This program, policy, or practice is currently active and available to employees.' },
  { label: 'In Development', color: '#2563EB', desc: 'A formal plan exists and resources have been allocated to implement this within the next 12\u201318 months.' },
  { label: 'Under Review', color: '#D97706', desc: 'Actively evaluating the feasibility, cost, or design of this program. No implementation timeline yet, but it is on leadership\u2019s radar.' },
  { label: 'Open to Exploring', color: '#8B5CF6', desc: 'Had not considered this, but learning about it has sparked interest. Open to reviewing whether this could work for your organization.' },
  { label: 'Not Planned', color: '#64748B', desc: 'Considered this and determined it is not feasible or appropriate for your organization at this time.' },
  { label: 'Unsure', color: '#9CA3AF', desc: 'Don\u2019t have enough information to answer this accurately. Flags the item for internal follow-up.' },
]

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const ctx = useAssessmentContext()
  const [showScale, setShowScale] = useState(false)

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
    <>
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

              <button
                onClick={() => setShowScale(true)}
                className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-800 transition text-xs whitespace-nowrap"
                title="View response scale definitions"
              >
                <List className="w-3.5 h-3.5" />
                Response Scale
              </button>

              {/* Temporarily hidden — will re-enable when review flow is needed
              {unsureCount > 0 && pathname !== '/survey/review-unsure' && (
                <button
                  onClick={() => router.push('/survey/review-unsure')}
                  className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-2 rounded-lg font-medium shadow-sm hover:bg-purple-700 transition text-xs whitespace-nowrap"
                  title="Review items marked as Unsure or flagged for team review"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Items to Review ({unsureCount})
                </button>
              )}
              */}


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

      {/* Response Scale Overlay */}
      {showScale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowScale(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Response Scale</h2>
              <button
                onClick={() => setShowScale(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                For each element in a dimension, select the option that best reflects your organization&apos;s current status.
              </p>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                {SCALE_DEFINITIONS.map(opt => (
                  <div key={opt.label} className="flex items-start gap-3 px-4 py-3">
                    <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: opt.color }} />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                      <p className="text-xs text-gray-600 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowScale(false)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

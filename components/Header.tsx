'use client'
import { useRouter, usePathname } from 'next/navigation'
import { FileText, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()

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

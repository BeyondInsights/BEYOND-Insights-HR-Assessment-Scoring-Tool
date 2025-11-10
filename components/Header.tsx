'use client'
import { useRouter, usePathname } from 'next/navigation'
import { RotateCcw, FileText, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()

  // Hide Back to Dashboard on Dashboard, Letter, and Authorization pages
  const showBack = !['/dashboard', '/letter', '/authorization'].includes(pathname)
  const onPrintPage = pathname === '/survey/print'

  const handleReset = async () => {
    if (confirm('Clear all data and restart? This will delete your local data AND your database record, and log you out. This cannot be undone.')) {
      try {
        // Get email before clearing localStorage
        const email = localStorage.getItem('login_email')
        
        // Delete from Supabase if we have an email
        if (email) {
          const supabase = createClient()
          const { error } = await supabase
            .from('survey_responses')
            .delete()
            .eq('email', email)
          
          if (error) {
            console.error('Error deleting from database:', error)
            // Continue with local clear even if DB delete fails
          } else {
            console.log('Successfully deleted database record for:', email)
          }
        }
        
        // Clear all local storage
        localStorage.clear()
        sessionStorage.clear()
        
        // Redirect to home
        window.location.href = '/'
      } catch (error) {
        console.error('Error during reset:', error)
        // Still clear local storage even if there's an error
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/'
      }
    }
  }

  const goPrintView = () => router.push('/survey/print')

  return (
    <header className="shadow-md">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 gap-3">
          {/* Left: Reset + Profile + Back */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg font-semibold shadow-sm hover:bg-red-700 transition text-sm"
              title="Reset all data (including database)"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={() => router.push('/company-profile')}
              className="flex items-center gap-2 bg-purple-700 text-white px-3 py-2 rounded-lg font-semibold shadow-sm hover:bg-purple-800 transition text-sm"
              title="View your company profile"
            >
              <FileText className="w-4 h-4" />
              Review Your Company Profile
            </button>
            {showBack ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-orange-700 transition text-sm"
                title="Back to Dashboard"
              >
                Back to Dashboard
              </button>
            ) : (
              <div className="w-40" /> // spacer keeps logos centered
            )}
          </div>

{/* Center: Award logo */}
<div className="flex-1 flex justify-center">
  <img
    src="/best-companies-2026-logo.png"
    alt="Best Companies for Working with Cancer Award Logo"
    className="h-16 sm:h-24 lg:h-28 w-auto drop-shadow-md"
  />
</div>

          {/* Right: CAC logo + Print/Download */}
          <div className="flex items-center gap-3">
            {!onPrintPage && (
              <button
                onClick={goPrintView}
                className="flex items-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-lg font-semibold shadow-sm hover:bg-slate-900 transition text-sm"
                title="Open printable full survey"
              >
                <Download className="w-4 h-4" />
                Review / Download Survey
              </button>
            )}
            <img
              src="/cancer-careers-logo.png"
              alt="Cancer and Careers Logo"
              className="h-10 sm:h-14 lg:h-16 w-auto"
            />
          </div>
        </div>
      </div>
      <div className="h-2 bg-orange-600" />
    </header>
  )
}

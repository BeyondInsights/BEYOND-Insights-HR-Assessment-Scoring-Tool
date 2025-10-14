'use client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Header() {
  const router = useRouter()

  const handleReset = () => {
    if (confirm('Clear all data and restart? This will log you out and cannot be undone.')) {
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    }
  }

  return (
    <header className="bg-white border-b-4 border-orange-500 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left side - Reset button (only in development) */}
        <div className="flex items-center gap-4">
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg font-semibold hover:bg-red-700 transition-colors"
              title="Reset all data and start over"
            >
              🔄 Reset
            </button>
          )}
        </div>

        {/* Center - Logos */}
        <div className="flex items-center gap-8">
          <img
            src="/best-companies-2026-logo.png"
            alt="Best Companies Award"
            className="h-16 w-auto"
          />
          <img
            src="/cancer-careers-logo.png"
            alt="Cancer and Careers"
            className="h-12 w-auto"
          />
        </div>

        {/* Right side - Empty for balance */}
        <div className="w-24"></div>
      </div>
    </header>
  )
}

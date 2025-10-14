'use client'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'

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
        {/* Left - Reset Button */}
        <div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg font-semibold hover:bg-red-700 transition-colors"
            title="Reset all data and start over"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Center - Logos */}
        <div className="flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
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

        {/* Right - Empty for balance */}
        <div></div>
      </div>
    </header>
  )
}

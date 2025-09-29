/* eslint-disable @next/next/no-img-element */
'use client'
import { useRouter } from 'next/navigation'

export default function Header({ showBack = false, showProgress = false, overallProgress = 0 }) {
  const router = useRouter()

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      {/* Left: Back link (optional) and logos */}
      <div className="flex items-center space-x-4">
        {showBack && (
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-blue-600 hover:underline"
          >
            â† Dashboard
          </button>
        )}
        <img
          src="/best-companies-2026-logo.png"
          alt="2026 Best Companies for Working with Cancer"
          className="h-12 w-auto"
        />
      </div>

      {/* Right: Progress bar, tagline, and logo */}
      <div className="flex items-center space-x-6">
        {showProgress && (
          <div className="w-48">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-bold text-orange-500">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}
        <div className="text-sm text-gray-600 text-right">
          Support for Employees Managing Cancer<br />
          or Other Serious Health Conditions Assessment
        </div>
        <img
          src="/cancer-careers-logo.png"
          alt="Cancer and Careers"
          className="h-12 w-auto"
        />
      </div>
      </div>
    </header>
  )
}


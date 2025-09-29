/* eslint-disable @next/next/no-img-element */
'use client'
import { useRouter, usePathname } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()

  // Hide Back to Dashboard on Dashboard, Letter, and Authorization pages
  const showBack = !['/dashboard', '/letter', '/authorization'].includes(pathname)

  return (
    <header className="shadow-md">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          {/* Left: Back button */}
          {showBack ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-orange-700 transition"
            >
              â† Back to Dashboard
            </button>
          ) : (
            <div className="w-40" /> // spacer keeps logos centered
          )}

          {/* Center: Award logo */}
          <div className="flex-1 flex justify-center">
            <img
              src="/best-companies-2026-logo.png"
              alt="Best Companies for Working with Cancer Award Logo"
              className="h-14 sm:h-20 lg:h-24 w-auto drop-shadow-md"
            />
          </div>

          {/* Right: CAC logo */}
          <div className="flex justify-end">
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


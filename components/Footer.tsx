/* eslint-disable @next/next/no-img-element */
'use client'
import ProgressBar from './ProgressBar'

export default function Footer({ overallProgress = 0 }) {
  return (
    <footer className="bg-gray-50 border-t py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
        {/* Left: Powered by BEYOND Insights */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Powered by</span>
          <img
            src="/BI_LOGO_FINAL.png"
            alt="BEYOND Insights Logo"
            className="h-10 sm:h-12 w-auto"
          />
        </div>

        {/* Center: Progress bar */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-md">
            <ProgressBar progress={overallProgress} />
          </div>
        </div>

        {/* Right: placeholder for balance (could add Â© or leave empty) */}
        <div className="w-24" />
      </div>
    </footer>
  )
}


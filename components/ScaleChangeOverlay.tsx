'use client'

import { useState, useEffect } from 'react'

const SESSION_KEY = 'scale_change_overlay_dismissed'

/**
 * One-time overlay explaining the 2026 → 2027 response scale changes.
 * Shows once per session when a returning user first opens a dimension page.
 * Only renders if the dimension already has grid data (i.e., migrated from 2026).
 */
export default function ScaleChangeOverlay({ hasExistingData }: { hasExistingData: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!hasExistingData) return
    const dismissed = sessionStorage.getItem(SESSION_KEY)
    if (!dismissed) {
      setShow(true)
    }
  }, [hasExistingData])

  if (!show) return null

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setShow(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Updated Response Scale for 2027
          </h2>
          <p className="text-sm text-slate-600 mb-5">
            We have updated the response options for the dimension elements in 2027. The table below shows how your 2026 responses were converted to the new 2027 scale.
          </p>

          {/* Scale mapping table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-700 border-b border-r border-slate-200">2026 Scale</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-700 border-b border-slate-200">2027 Scale</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100">Currently Offer</td>
                  <td className="px-4 py-2.5 font-medium text-emerald-700">In Place</td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100">In Active Planning / Development</td>
                  <td className="px-4 py-2.5 font-medium text-blue-700">In Development</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100">Assessing Feasibility</td>
                  <td className="px-4 py-2.5 font-medium text-amber-700">Under Review</td>
                </tr>
                <tr className="border-b border-slate-100 bg-amber-50/50">
                  <td className="px-4 py-2.5 text-slate-400 italic border-r border-slate-100">(No equivalent in 2026)</td>
                  <td className="px-4 py-2.5 font-medium text-orange-600">Open to Exploring <span className="text-xs font-normal text-orange-500 ml-1">NEW</span></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100">Not Able to Offer</td>
                  <td className="px-4 py-2.5 font-medium text-slate-600">Not Planned</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100">Unsure</td>
                  <td className="px-4 py-2.5 font-medium text-slate-500">Unsure</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Note about new option */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Please note:</span> We added a new response option in 2027 — <span className="font-semibold">Open to Exploring</span> — for programs your organization had not previously considered but may be open to reviewing. Please adjust any element responses based on changes your organization may have introduced since you completed the 2026 survey, or if you feel a different scale point may be more appropriate.
            </p>
          </div>

          {/* Dismiss button */}
          <div className="flex justify-end">
            <button
              onClick={handleDismiss}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got It — Review My Responses
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

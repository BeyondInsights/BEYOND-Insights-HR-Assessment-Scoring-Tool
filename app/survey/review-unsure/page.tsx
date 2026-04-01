'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAssessmentContext } from '@/lib/assessment-context'

const DIMENSION_NAMES = [
  'Medical Leave & Flexibility',
  'Insurance & Financial Protection',
  'Manager Preparedness & Capability',
  'Specialized Resources',
  'Workplace Accommodations & Modifications',
  'Culture & Psychological Safety',
  'Career Continuity & Advancement',
  'Work Continuation and Resumption',
  'Executive Commitment & Resources',
  'Caregiver & Family Support',
  'Prevention, Wellness & Legal Compliance',
  'Continuous Improvement & Outcomes',
  'Communication & Awareness',
]

const STATUS_OPTIONS = [
  'In Place',
  'In Development',
  'Under Review',
  'Open to Exploring',
  'Not Planned',
  'Unsure',
]

const STATUS_COLORS: Record<string, string> = {
  'in place': '#0D9488',
  'in development': '#2563EB',
  'under review': '#D97706',
  'open to exploring': '#8B5CF6',
  'not planned': '#64748B',
  'unsure': '#9CA3AF',
}

function getStatusColor(status: string): string {
  const lower = status.toLowerCase()
  if (lower === 'in place') return STATUS_COLORS['in place']
  if (lower === 'in development') return STATUS_COLORS['in development']
  if (lower === 'under review') return STATUS_COLORS['under review']
  if (lower === 'open to exploring') return STATUS_COLORS['open to exploring']
  if (lower === 'not planned') return STATUS_COLORS['not planned']
  if (lower.includes('unsure')) return STATUS_COLORS['unsure']
  return STATUS_COLORS['not planned']
}

interface UnsureItem {
  dimensionNumber: number
  dimensionName: string
  elementName: string
  gridKey: string
}

export default function ReviewUnsurePage() {
  const router = useRouter()
  const ctx = useAssessmentContext()
  const [unsureItems, setUnsureItems] = useState<UnsureItem[]>([])
  const [editingElement, setEditingElement] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Scan all dimensions for "Unsure" responses
  useEffect(() => {
    const items: UnsureItem[] = []
    for (let i = 1; i <= 13; i++) {
      const data = ctx.getSectionData(`dimension${i}`)
      if (!data) continue
      const gridKey = `d${i}a`
      const grid = data[gridKey]
      if (!grid || typeof grid !== 'object') continue
      Object.entries(grid).forEach(([elementName, status]) => {
        if (typeof status === 'string' && status.toLowerCase().includes('unsure')) {
          items.push({
            dimensionNumber: i,
            dimensionName: DIMENSION_NAMES[i - 1],
            elementName,
            gridKey,
          })
        }
      })
    }
    setUnsureItems(items)
  }, [ctx])

  const handleStatusChange = (item: UnsureItem, newStatus: string) => {
    const data = ctx.getSectionData(`dimension${item.dimensionNumber}`)
    if (!data) return
    const grid = { ...data[item.gridKey] }
    grid[item.elementName] = newStatus
    ctx.setSectionData(`dimension${item.dimensionNumber}`, { ...data, [item.gridKey]: grid })

    // Remove from unsure list if no longer unsure
    if (!newStatus.toLowerCase().includes('unsure')) {
      setUnsureItems(prev => prev.filter(u =>
        !(u.dimensionNumber === item.dimensionNumber && u.elementName === item.elementName)
      ))
    }
    setTimeout(() => setEditingElement(null), 200)
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setSaveMessage('')
    // Save all dimensions that had unsure items
    const dimsToSave = new Set(unsureItems.map(u => u.dimensionNumber))
    // Also save dims that were just changed (they may have been removed from unsureItems)
    for (let i = 1; i <= 13; i++) {
      const data = ctx.getSectionData(`dimension${i}`)
      if (data) dimsToSave.add(i)
    }
    let success = true
    for (const dimNum of dimsToSave) {
      const result = await ctx.saveToSupabase(`dimension${dimNum}`)
      if (!result) success = false
    }
    setSaving(false)
    if (success) {
      setSaveMessage('All changes saved successfully.')
      setTimeout(() => setSaveMessage(''), 3000)
    } else {
      setSaveMessage('Some changes could not be saved. Please try again.')
    }
  }

  const handleSaveAndReturn = async () => {
    await handleSaveAll()
    router.push('/dashboard')
  }

  // Unique key for editing
  const editKey = (item: UnsureItem) => `${item.dimensionNumber}-${item.elementName}`

  // Group by dimension
  const grouped = unsureItems.reduce<Record<number, UnsureItem[]>>((acc, item) => {
    if (!acc[item.dimensionNumber]) acc[item.dimensionNumber] = []
    acc[item.dimensionNumber].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Review Unsure Responses</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Below are all elements you marked as &quot;Unsure&quot; across the 13 dimensions.
            Click any element to update your response.
          </p>
        </div>

        {unsureItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">No Unsure Responses</h2>
            <p className="text-sm text-slate-600">
              You have no elements marked as &quot;Unsure&quot; across any dimension.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Summary count */}
            <div className="mb-5 flex items-center gap-2 text-sm text-slate-600">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: STATUS_COLORS['unsure'] }}
              />
              <span>
                <strong className="text-slate-800">{unsureItems.length}</strong> element{unsureItems.length !== 1 ? 's' : ''} marked
                as Unsure across <strong className="text-slate-800">{Object.keys(grouped).length}</strong> dimension{Object.keys(grouped).length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Grouped by dimension */}
            <div className="space-y-6">
              {Object.entries(grouped)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([dimNum, items]) => (
                  <div key={dimNum} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                      <h2 className="text-sm font-semibold text-slate-800">
                        <span className="text-slate-400 mr-1.5">Dimension {dimNum}:</span>
                        {items[0].dimensionName}
                      </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {items.map(item => {
                        const key = editKey(item)
                        const isEditing = editingElement === key

                        return (
                          <div key={key}>
                            <div
                              onClick={() => setEditingElement(isEditing ? null : key)}
                              className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                                isEditing ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                              }`}
                            >
                              <div
                                className="w-0.5 min-h-[32px] self-stretch rounded-full flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: STATUS_COLORS['unsure'] }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-slate-800 leading-snug">{item.elementName}</span>
                              </div>
                              <span
                                className="text-xs font-medium flex-shrink-0 mt-0.5"
                                style={{ color: STATUS_COLORS['unsure'] }}
                              >
                                Unsure
                              </span>
                            </div>

                            {isEditing && (
                              <div className="px-5 pb-3 bg-slate-50 border-t border-slate-100">
                                <p className="text-xs text-slate-500 mb-2 pt-2">Select a new response:</p>
                                <div className="space-y-0.5">
                                  {STATUS_OPTIONS.filter(o => !o.toLowerCase().includes('unsure')).map(option => {
                                    const optionColor = getStatusColor(option)
                                    return (
                                      <label
                                        key={option}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-white/70"
                                      >
                                        <div
                                          className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                          style={{ borderColor: '#CBD5E1' }}
                                        />
                                        <span className="text-sm text-slate-600">{option}</span>
                                        <input
                                          type="radio"
                                          name={`status-${key}`}
                                          checked={false}
                                          onChange={() => handleStatusChange(item, option)}
                                          className="sr-only"
                                        />
                                      </label>
                                    )
                                  })}
                                  {/* Keep as Unsure option */}
                                  <label
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors bg-white shadow-sm"
                                  >
                                    <div
                                      className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                      style={{ borderColor: STATUS_COLORS['unsure'] }}
                                    >
                                      <div
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: STATUS_COLORS['unsure'] }}
                                      />
                                    </div>
                                    <span className="text-sm text-slate-900 font-medium">Unsure</span>
                                    <input
                                      type="radio"
                                      name={`status-${key}`}
                                      checked={true}
                                      onChange={() => setEditingElement(null)}
                                      className="sr-only"
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>

            {/* Save message */}
            {saveMessage && (
              <div className={`mt-4 text-sm text-center ${saveMessage.includes('success') ? 'text-green-600' : 'text-amber-600'}`}>
                {saveMessage}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-8 space-y-3">
              <button
                onClick={handleSaveAndReturn}
                disabled={saving}
                className="w-full flex items-center justify-between px-5 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 text-left"
              >
                <div>
                  <p className="text-sm font-medium">
                    {saving ? 'Saving...' : 'Save & return to dashboard'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All changes will be saved to your survey
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

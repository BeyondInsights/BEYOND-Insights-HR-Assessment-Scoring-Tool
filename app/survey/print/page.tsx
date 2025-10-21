'use client'

import React, { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Import all schemas from the index file
import {
  firmographicsSchema,
  generalBenefitsSchema,
  currentSupportSchema,
  d1Schema,
  d2Schema,
  d3Schema,
  d4Schema,
  d5Schema,
  d6Schema,
  d7Schema,
  d8Schema,
  d9Schema,
  d10Schema,
  d11Schema,
  d12Schema,
  d13Schema,
  crossDimensionalSchema,
  employeeImpactSchema
} from '../schemas'

const DIMENSION_TITLES: { [key: number]: string } = {
  1: 'Medical Leave & Flexibility',
  2: 'Insurance & Financial Protection',
  3: 'Manager Preparedness & Capability',
  4: 'Navigation & Expert Resources',
  5: 'Workplace Accommodations',
  6: 'Culture & Psychological Safety',
  7: 'Career Continuity & Advancement',
  8: 'Work Continuation & Resumption',
  9: 'Executive Commitment & Resources',
  10: 'Caregiver & Family Support',
  11: 'Prevention, Wellness & Legal Compliance',
  12: 'Continuous Improvement & Outcomes',
  13: 'Communication & Awareness'
}

const SECTION_COLORS = {
  firmographics: { from: '#9333ea', to: '#7e22ce' },
  general: { from: '#4f46e5', to: '#4338ca' },
  current: { from: '#ec4899', to: '#db2777' },
  dimensions: { from: '#2563eb', to: '#1d4ed8' },
  cross: { from: '#059669', to: '#047857' },
  impact: { from: '#ea580c', to: '#c2410c' }
}

const ALL_DIMENSION_SCHEMAS = [
  d1Schema, d2Schema, d3Schema, d4Schema, d5Schema, d6Schema,
  d7Schema, d8Schema, d9Schema, d10Schema, d11Schema, d12Schema, d13Schema
]

export default function PrintPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [companyName, setCompanyName] = useState('Your Company')
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    const name = localStorage.getItem('login_company_name') || 
                 localStorage.getItem('companyName') || 
                 'Your Organization'
    setCompanyName(name)
    
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
  }, [])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {}
    ALL_DIMENSION_SCHEMAS.forEach((_, idx) => {
      allExpanded[`dim-${idx}`] = true
    })
    allExpanded['firmographics'] = true
    allExpanded['general'] = true
    allExpanded['current'] = true
    allExpanded['cross'] = true
    allExpanded['impact'] = true
    setExpandedSections(allExpanded)
  }

  const collapseAll = () => {
    setExpandedSections({})
  }

  const handlePrint = () => {
    expandAll()
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handleDownload = () => {
    expandAll()
    setTimeout(() => {
      const printWindow = window.open('', '', 'width=800,height=600')
      if (printWindow) {
        const content = document.documentElement.outerHTML
        printWindow.document.write(content)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    }, 100)
  }

  const renderField = (fieldKey: string, field: any) => {
    if (!field) return null

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'date':
        return (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label}
            </label>
            {field.required && <span className="text-red-500 ml-1">*</span>}
            {field.instruction && (
              <p className="text-xs text-gray-600 italic mb-3">{field.instruction}</p>
            )}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-3">
              <div className="h-6 border-b border-gray-200"></div>
            </div>
          </div>
        )

      case 'textarea':
        return (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label}
            </label>
            {field.instruction && (
              <p className="text-xs text-gray-600 italic mb-3">{field.instruction}</p>
            )}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-6 border-b border-gray-200 mb-2 last:mb-0"></div>
              ))}
            </div>
          </div>
        )

      case 'select':
        const selectTwoColumn = field.options?.length > 6
        return (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label}
            </label>
            {field.instruction && (
              <p className="text-xs text-gray-600 italic mb-3">{field.instruction}</p>
            )}
            <div className={selectTwoColumn ? "grid grid-cols-2 gap-2" : "space-y-2"}>
              {field.options?.map((opt: string) => (
                <label key={opt} className="flex items-center p-3 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer">
                  <input type="radio" name={fieldKey} className="mr-3" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'checkbox':
        const isTwoColumn = field.options?.length > 6
        return (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label}
            </label>
            {field.instruction && (
              <p className="text-xs text-gray-600 italic mb-3">{field.instruction}</p>
            )}
            <div className={isTwoColumn ? "grid grid-cols-2 gap-2" : "space-y-2"}>
              {field.options?.map((opt: string) => (
                <label key={opt} className="flex items-start p-3 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 mr-3" />
                  <span className="text-sm">{opt === 'Other' ? 'Other: _____________' : opt}</span>
                </label>
              ))}
            </div>
            {field.hasNone && (
              <label className="flex items-center mt-3 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="mr-2" />
                <span>None of the above</span>
              </label>
            )}
          </div>
        )

      case 'multiselect':
        return (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label}
            </label>
            {field.instruction && (
              <p className="text-xs text-gray-600 italic mb-3">{field.instruction}</p>
            )}
            {field.helperText && (
              <p className="text-xs text-gray-500 mb-2">{field.helperText}</p>
            )}
            <div className="space-y-2">
              {field.options?.map((opt: string) => (
                <label key={opt} className="flex items-start p-3 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 mr-3" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'categorized':
        return (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label}
            </label>
            {field.instruction && (
              <p className="text-xs text-gray-600 italic mb-3">{field.instruction}</p>
            )}
            <div className="space-y-4">
              {field.categories?.map((cat: any) => (
                <div key={cat.name} className="bg-white border border-gray-300 rounded-lg p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-md inline-block mb-3">
                    {cat.name}
                  </h4>
                  <div className="space-y-2">
                    {cat.options.map((opt: string) => (
                      <label key={opt} className="flex items-start">
                        <input type="checkbox" className="mt-0.5 mr-3" />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'grid':
        // For dimension grids, reverse the order to go negative to positive
        // For other grids, keep the original order
        let orderedOptions = field.statusOptions || field.responseOptions || []
        
        // Check if this is a dimension impact scale (contains "Impact" in options)
        const isImpactScale = orderedOptions.some((opt: string) => opt.includes('Impact'))
        
        if (isImpactScale) {
          // Reverse to go from negative to positive
          orderedOptions = orderedOptions.slice().reverse()
        }
        
        return (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label}
            </label>
            {field.instruction && (
              <p className="text-xs text-gray-600 italic mb-3">{field.instruction}</p>
            )}
            <div className="overflow-x-auto mt-3 border border-gray-300 rounded-lg">
              <table className="w-full border-collapse text-sm bg-white">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <tr>
                    <th className="text-left text-white font-semibold p-3 border-r border-blue-500">
                      {field.programs ? 'Program' : 'Item'}
                    </th>
                    {orderedOptions.map((opt: string) => (
                      <th key={opt} className="text-center text-white font-semibold p-3 min-w-[120px]">{opt}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(field.programs || field.items)?.map((item: string, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-3 font-medium text-gray-700 border-r border-gray-200">{item}</td>
                      {orderedOptions.map((opt: string) => (
                        <td key={opt} className="text-center p-3">
                          <input type="radio" name={`grid-${fieldKey}-${idx}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-gray-300">
        <div className="mb-3">
          <img src="/best-companies-2026-logo.png" alt="Best Companies" className="h-12 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Best Companies for Working with Cancer</h1>
        <p className="text-base text-gray-600 mb-2">2026 Employer Index Survey</p>
        <p className="text-sm text-gray-500">{companyName} • {currentDate}</p>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Action Bar - Screen Only */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 print:hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Survey Print Preview</h1>
              <p className="text-gray-600">Review and download the complete survey questionnaire</p>
            </div>
            <div className="flex gap-2">
              <button onClick={expandAll} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm">
                Expand All
              </button>
              <button onClick={collapseAll} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm">
                Collapse All
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg p-4 mb-6 flex gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-blue-900 mb-1">How to Download as PDF</div>
              <p className="text-blue-800 text-sm">
                Click "Download PDF" to open your browser's print dialog. Select "Save as PDF" as the destination 
                to save the complete survey. All sections will be automatically expanded for printing.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleDownload} className="flex-1 min-w-[200px] px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>Download Full Survey PDF</span>
            </button>
            
            <button onClick={handlePrint} className="flex-1 min-w-[200px] px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print to Printer</span>
            </button>
            
            <button onClick={() => window.location.href = '/dashboard'} className="flex-1 min-w-[200px] px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
              <span>← Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Survey Sections */}
        <div className="space-y-4">
          {/* Section 1: Firmographics */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('firmographics')}
              className="w-full p-5 text-white flex items-center justify-between hover:opacity-90 cursor-pointer print:hidden"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.firmographics.from} 0%, ${SECTION_COLORS.firmographics.to} 100%)` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">Company & Contact Information</span>
              </div>
              <svg className={`w-5 h-5 transition-transform ${expandedSections['firmographics'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block p-5 text-white" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.firmographics.from} 0%, ${SECTION_COLORS.firmographics.to} 100%)` }}>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">Company & Contact Information</span>
              </div>
            </div>
            {(expandedSections['firmographics'] || false) && (
              <div className="p-6 bg-gray-50">
                {Object.entries(firmographicsSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: General Benefits */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('general')}
              className="w-full p-5 text-white flex items-center justify-between hover:opacity-90 cursor-pointer print:hidden"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.general.from} 0%, ${SECTION_COLORS.general.to} 100%)` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">General Employee Benefits</span>
              </div>
              <svg className={`w-5 h-5 transition-transform ${expandedSections['general'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block p-5 text-white" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.general.from} 0%, ${SECTION_COLORS.general.to} 100%)` }}>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">General Employee Benefits</span>
              </div>
            </div>
            {(expandedSections['general'] || false) && (
              <div className="p-6 bg-gray-50">
                {Object.entries(generalBenefitsSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Current Support */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('current')}
              className="w-full p-5 text-white flex items-center justify-between hover:opacity-90 cursor-pointer print:hidden"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.current.from} 0%, ${SECTION_COLORS.current.to} 100%)` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">Current Support for Serious Medical Conditions</span>
              </div>
              <svg className={`w-5 h-5 transition-transform ${expandedSections['current'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block p-5 text-white" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.current.from} 0%, ${SECTION_COLORS.current.to} 100%)` }}>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">Current Support for Serious Medical Conditions</span>
              </div>
            </div>
            {(expandedSections['current'] || false) && (
              <div className="p-6 bg-gray-50">
                {Object.entries(currentSupportSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4 Header - KEEP THE NUMBER HERE */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 border-l-4 border-blue-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-blue-600">4</div>
              <h2 className="text-xl font-bold text-gray-900">13 Dimensions of Support</h2>
            </div>
          </div>

          {/* 13 Dimensions - KEEP NUMBERS HERE */}
          {ALL_DIMENSION_SCHEMAS.map((schema, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection(`dim-${idx}`)}
                className="w-full p-5 text-white flex items-center justify-between hover:opacity-90 cursor-pointer print:hidden"
                style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.dimensions.from} 0%, ${SECTION_COLORS.dimensions.to} 100%)` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">{idx + 1}</div>
                  <span className="text-lg font-semibold">{DIMENSION_TITLES[idx + 1]}</span>
                </div>
                <svg className={`w-5 h-5 transition-transform ${expandedSections[`dim-${idx}`] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="hidden print:block p-5 text-white" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.dimensions.from} 0%, ${SECTION_COLORS.dimensions.to} 100%)` }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">{idx + 1}</div>
                  <span className="text-lg font-semibold">{DIMENSION_TITLES[idx + 1]}</span>
                </div>
              </div>
              {(expandedSections[`dim-${idx}`] || false) && (
                <div className="p-6 bg-gray-50">
                  {Object.entries(schema).map(([key, field]) => (
                    <div key={key}>{renderField(key, field)}</div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Section 5: Cross-Dimensional */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('cross')}
              className="w-full p-5 text-white flex items-center justify-between hover:opacity-90 cursor-pointer print:hidden"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.cross.from} 0%, ${SECTION_COLORS.cross.to} 100%)` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">Cross-Dimensional Assessment</span>
              </div>
              <svg className={`w-5 h-5 transition-transform ${expandedSections['cross'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block p-5 text-white" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.cross.from} 0%, ${SECTION_COLORS.cross.to} 100%)` }}>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">Cross-Dimensional Assessment</span>
              </div>
            </div>
            {(expandedSections['cross'] || false) && (
              <div className="p-6 bg-gray-50">
                {Object.entries(crossDimensionalSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Employee Impact */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('impact')}
              className="w-full p-5 text-white flex items-center justify-between hover:opacity-90 cursor-pointer print:hidden"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.impact.from} 0%, ${SECTION_COLORS.impact.to} 100%)` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">Employee Impact & ROI Assessment</span>
              </div>
              <svg className={`w-5 h-5 transition-transform ${expandedSections['impact'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block p-5 text-white" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.impact.from} 0%, ${SECTION_COLORS.impact.to} 100%)` }}>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">Employee Impact & ROI Assessment</span>
              </div>
            </div>
            {(expandedSections['impact'] || false) && (
              <div className="p-6 bg-gray-50">
                {Object.entries(employeeImpactSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  )
}

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'  // ADD THIS LINE
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

const ALL_DIMENSION_SCHEMAS = [
  d1Schema, d2Schema, d3Schema, d4Schema, d5Schema, d6Schema,
  d7Schema, d8Schema, d9Schema, d10Schema, d11Schema, d12Schema, d13Schema
]

export default function PrintPage() {
  const router = useRouter()  // ADD THIS LINE
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
      // Clone the document and clean it up
      const printContent = document.querySelector('main')?.cloneNode(true) as HTMLElement
      if (!printContent) return
      
      // Remove all print:hidden elements
      printContent.querySelectorAll('.print\\:hidden').forEach(el => el.remove())
      printContent.querySelectorAll('button').forEach(el => el.remove())
      
      // Create clean HTML document
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Survey - ${companyName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: letter; margin: 0.5in; }
    @media print {
      .no-print { display: none !important; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
  </style>
</head>
<body class="bg-white">
  <div class="max-w-5xl mx-auto p-8">
    <div class="text-center mb-6 pb-4 border-b border-gray-300">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Best Companies for Working with Cancer</h1>
      <p class="text-base text-gray-600">2026 Employer Index Survey</p>
      <p class="text-sm text-gray-500 mt-2">${companyName} • ${currentDate}</p>
    </div>
    ${printContent.innerHTML}
  </div>
</body>
</html>`
      
      // Trigger download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `survey-${companyName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
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
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.instruction && (
              <p className="text-xs text-gray-600 italic mb-3">{field.instruction}</p>
            )}
            <div className="bg-white border border-gray-300 rounded p-3">
              <div className="h-5 border-b border-gray-200"></div>
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
            <div className="bg-white border border-gray-300 rounded p-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-5 border-b border-gray-200 mb-2 last:mb-0"></div>
              ))}
            </div>
          </div>
        )

      case 'select':
        const selectTwoColumn = field.options?.length > 8
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
                <label key={opt} className="flex items-center p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name={fieldKey} className="mr-2" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'checkbox':
        const isTwoColumn = field.options?.length > 8
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
                <label key={opt} className="flex items-start p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 mr-2" />
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
        const multiTwoColumn = field.options?.length > 8
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
            <div className={multiTwoColumn ? "grid grid-cols-2 gap-2" : "space-y-2"}>
              {field.options?.map((opt: string) => (
                <label key={opt} className="flex items-start p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 mr-2" />
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
            <div className="space-y-3">
              {field.categories?.map((cat: any) => (
                <div key={cat.name} className="bg-white border border-gray-200 rounded-lg p-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                    {cat.name}
                  </h4>
                  <div className="space-y-1">
                    {cat.options.map((opt: string) => (
                      <label key={opt} className="flex items-start pl-2">
                        <input type="checkbox" className="mt-0.5 mr-2" />
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
        // Use exact options from schema
        let gridOptions = field.statusOptions || field.responseOptions || field.scale || []
        const gridItems = field.programs || field.items || field.elements || []
        
        // Check if this is a dimension grid by looking for typical dimension scale options
        const isDimensionGrid = gridOptions.some(opt => 
          opt.includes('Not able to offer') || 
          opt.includes('Currently offer') ||
          opt.includes('Assessing feasibility')
        )
        
        // If it's a dimension grid and the order is wrong (Currently offer is first), reverse it
        if (isDimensionGrid && gridOptions[0] && gridOptions[0].includes('Currently')) {
          gridOptions = [...gridOptions].reverse()
        }
        
        return (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label}
            </label>
            {field.instruction && (
              <p className="text-xs text-gray-600 italic mb-3">{field.instruction}</p>
            )}
            <div className="overflow-x-auto mt-3 border border-gray-200 rounded">
              <table className="w-full border-collapse text-sm bg-white">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-gray-700 font-medium p-2 border-r border-gray-200 text-xs">
                      {field.programs ? 'Program' : field.items ? 'Item' : 'Element'}
                    </th>
                    {gridOptions.map((opt: string) => (
                      <th key={opt} className="text-center text-gray-600 font-normal p-1 text-xs min-w-[80px]">
                        {opt}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridItems.map((item: string, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2 text-gray-700 text-xs border-r border-gray-200">{item}</td>
                      {gridOptions.map((opt: string) => (
                        <td key={opt} className="text-center p-1">
                          <input type="radio" name={`grid-${fieldKey}-${idx}`} className="w-3 h-3" />
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
    <div className="min-h-screen bg-white print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-4 pb-3 border-b border-gray-300">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Best Companies for Working with Cancer</h1>
        <p className="text-sm text-gray-600">2026 Employer Index Survey</p>
        <p className="text-xs text-gray-500 mt-1">{companyName} • {currentDate}</p>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">
 {/* Action Bar - Screen Only */}
<div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 print:hidden">
  <div className="flex justify-between items-start mb-3">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Survey Print Preview</h1>
      <p className="text-sm text-gray-600">Review and download the complete survey questionnaire</p>
    </div>
    <div className="flex gap-2">
      <button 
        onClick={() => router.push('/dashboard')} 
        className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </button>
      <button onClick={expandAll} className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50">
        Expand All
      </button>
      <button onClick={collapseAll} className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50">
        Collapse All
      </button>
      <button onClick={handleDownload} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        Download Survey
      </button>
    </div>
  </div>
  
  <div className="bg-blue-50 border border-blue-200 rounded p-3">
    <p className="text-sm text-blue-800">
      Click "Download" to save as HTML file. All sections will be automatically expanded for printing.
    </p>
  </div>
</div>
  
  <div className="bg-blue-50 border border-blue-200 rounded p-3">
    <p className="text-sm text-blue-800">
      Click "Download" to save as HTML file. All sections will be automatically expanded for printing.
    </p>
  </div>
</div>
      
        {/* Survey Sections */}
        <div className="space-y-3">
          {/* Section 1: Firmographics */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('firmographics')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer print:hidden border-l-4 border-purple-500"
            >
              <span className="text-base font-semibold text-gray-800">Company & Contact Information</span>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections['firmographics'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block p-4 border-l-4 border-purple-500 bg-gray-50">
              <span className="text-base font-semibold text-gray-800">Company & Contact Information</span>
            </div>
            {(expandedSections['firmographics'] || false) && (
              <div className="p-5 bg-white border-t border-gray-200">
                {Object.entries(firmographicsSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: General Benefits */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('general')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer print:hidden border-l-4 border-indigo-500"
            >
              <span className="text-base font-semibold text-gray-800">General Employee Benefits</span>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections['general'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block p-4 border-l-4 border-indigo-500 bg-gray-50">
              <span className="text-base font-semibold text-gray-800">General Employee Benefits</span>
            </div>
            {(expandedSections['general'] || false) && (
              <div className="p-5 bg-white border-t border-gray-200">
                {Object.entries(generalBenefitsSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Current Support */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('current')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer print:hidden border-l-4 border-pink-500"
            >
              <span className="text-base font-semibold text-gray-800">Current Support for Serious Medical Conditions</span>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections['current'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block p-4 border-l-4 border-pink-500 bg-gray-50">
              <span className="text-base font-semibold text-gray-800">Current Support for Serious Medical Conditions</span>
            </div>
            {(expandedSections['current'] || false) && (
              <div className="p-5 bg-white border-t border-gray-200">
                {Object.entries(currentSupportSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4 Header - NO NUMBER */}
          <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
            <h2 className="text-lg font-bold text-gray-900">13 Dimensions of Support</h2>
          </div>

          {/* 13 Dimensions - INDENTED */}
          <div className="ml-4">
            {ALL_DIMENSION_SCHEMAS.map((schema, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-2">
                <button
                  onClick={() => toggleSection(`dim-${idx}`)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer print:hidden border-l-4 border-blue-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-blue-50 rounded flex items-center justify-center font-semibold text-blue-600 text-sm">{idx + 1}</div>
                    <span className="text-base font-semibold text-gray-800">{DIMENSION_TITLES[idx + 1]}</span>
                  </div>
                  <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections[`dim-${idx}`] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="hidden print:block p-4 border-l-4 border-blue-500 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-blue-50 rounded flex items-center justify-center font-semibold text-blue-600 text-sm">{idx + 1}</div>
                    <span className="text-base font-semibold text-gray-800">{DIMENSION_TITLES[idx + 1]}</span>
                  </div>
                </div>
                {(expandedSections[`dim-${idx}`] || false) && (
                  <div className="p-5 bg-white border-t border-gray-200">
                    {Object.entries(schema).map(([key, field]) => (
                      <div key={key}>{renderField(key, field)}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Section 5: Cross-Dimensional */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('cross')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer print:hidden border-l-4 border-green-500"
            >
              <span className="text-base font-semibold text-gray-800">Cross-Dimensional Assessment</span>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections['cross'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block p-4 border-l-4 border-green-500 bg-gray-50">
              <span className="text-base font-semibold text-gray-800">Cross-Dimensional Assessment</span>
            </div>
            {(expandedSections['cross'] || false) && (
              <div className="p-5 bg-white border-t border-gray-200">
                {Object.entries(crossDimensionalSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Employee Impact */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('impact')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer print:hidden border-l-4 border-orange-500"
            >
              <span className="text-base font-semibold text-gray-800">Employee Impact & ROI Assessment</span>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections['impact'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block p-4 border-l-4 border-orange-500 bg-gray-50">
              <span className="text-base font-semibold text-gray-800">Employee Impact & ROI Assessment</span>
            </div>
            {(expandedSections['impact'] || false) && (
              <div className="p-5 bg-white border-t border-gray-200">
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

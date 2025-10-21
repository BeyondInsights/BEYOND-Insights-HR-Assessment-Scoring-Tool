'use client'

import React, { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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

const DIMENSION_TITLES = {
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
  firmographics: { from: '#9333ea', to: '#7e22ce', text: 'purple' },
  general: { from: '#4f46e5', to: '#4338ca', text: 'indigo' },
  current: { from: '#ec4899', to: '#db2777', text: 'pink' },
  dimensions: { from: '#2563eb', to: '#1d4ed8', text: 'blue' },
  cross: { from: '#059669', to: '#047857', text: 'green' },
  impact: { from: '#ea580c', to: '#c2410c', text: 'orange' }
}

const ALL_DIMENSION_SCHEMAS = [
  d1Schema, d2Schema, d3Schema, d4Schema, d5Schema, d6Schema,
  d7Schema, d8Schema, d9Schema, d10Schema, d11Schema, d12Schema, d13Schema
]

export default function PrintSurveyPage() {
  const [companyName, setCompanyName] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

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
    setTimeout(() => window.print(), 100)
  }

  const renderField = (fieldKey: string, field: any) => {
    if (!field) return null

    const shouldUseTwoColumns = (field.options?.length || 0) >= 6

    switch (field.type) {
      case 'text':
      case 'textarea':
        return (
          <div className="mb-6 p-5 bg-white rounded-lg border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {field.label}
            </label>
            {field.maxLength && (
              <div className="text-xs text-gray-500 mb-2">Maximum {field.maxLength} characters</div>
            )}
            <div className="bg-gray-50 border border-gray-300 rounded-md p-3">
              <div className="border-b border-gray-300 pb-2 mb-2"></div>
              <div className="border-b border-gray-300 pb-2 mb-2"></div>
              {field.type === 'textarea' && (
                <>
                  <div className="border-b border-gray-300 pb-2 mb-2"></div>
                  <div className="border-b border-gray-300 pb-2"></div>
                </>
              )}
            </div>
            {field.hasNone && (
              <label className="flex items-center mt-3 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" className="mr-2" />
                <span>No additional information</span>
              </label>
            )}
          </div>
        )

      case 'select':
        return (
          <div className="mb-6 p-5 bg-white rounded-lg border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-2">{field.label}</label>
            <div className="text-xs text-gray-500 italic mb-3">(Select ONE)</div>
            <div className={shouldUseTwoColumns ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
              {field.options?.map((opt: string, i: number) => (
                <label key={i} className="flex items-center p-3 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer">
                  <input type="radio" name={fieldKey} className="mr-2" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
              {field.hasOther && (
                <label className="flex items-center p-3 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer">
                  <input type="radio" name={fieldKey} className="mr-2" />
                  <span className="text-sm">Other: _________________</span>
                </label>
              )}
            </div>
          </div>
        )

      case 'multiselect':
        return (
          <div className="mb-6 p-5 bg-white rounded-lg border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-2">{field.label}</label>
            <div className="text-xs text-gray-500 italic mb-3">(Select ALL that apply)</div>
            {field.categories ? (
              <div className="space-y-4">
                {Object.entries(field.categories).map(([category, items]: [string, any]) => (
                  <div key={category} className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-bold text-xs uppercase tracking-wider text-blue-800 bg-blue-100 px-3 py-1 rounded mb-3 inline-block">
                      {category}
                    </div>
                    <div className={shouldUseTwoColumns ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
                      {items.map((item: string, i: number) => (
                        <label key={i} className="flex items-center p-3 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={shouldUseTwoColumns ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
                {field.options?.map((opt: string, i: number) => (
                  <label key={i} className="flex items-center p-3 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
                {field.hasOther && (
                  <label className="flex items-center p-3 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Other: _________________</span>
                  </label>
                )}
              </div>
            )}
          </div>
        )

      case 'grid':
        return (
          <div className="mb-6 p-5 bg-white rounded-lg border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-2">{field.label}</label>
            <div className="text-xs text-gray-500 italic mb-3">(Select ONE for each row)</div>
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-white text-sm font-semibold">
                      {field.programs ? 'Program' : 'Item'}
                    </th>
                    {(field.statusOptions || field.responseOptions)?.map((opt: string) => (
                      <th key={opt} className="px-3 py-3 text-white text-xs text-center min-w-[100px]">
                        {opt}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(field.programs || field.items)?.map((item: string, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 font-medium text-sm text-gray-700">
                        {item}
                      </td>
                      {(field.statusOptions || field.responseOptions)?.map((opt: string) => (
                        <td key={opt} className="px-3 py-3 text-center">
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="print:hidden">
        <Header />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center py-6 border-b-2 border-gray-300 mb-6">
        <img src="/best-companies-2026-logo.png" alt="Best Companies" className="h-12 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">Best Companies for Working with Cancer</h1>
        <p className="text-base text-gray-600 mt-1">2026 Employer Index Survey</p>
        <p className="text-sm text-gray-500 mt-1">{companyName} • {currentDate}</p>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Action Bar - Screen Only */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 print:hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Survey Print Preview</h1>
              <p className="text-gray-600 text-sm mt-1">Review and download the complete survey questionnaire</p>
            </div>
            <div className="flex gap-2">
              <button onClick={expandAll} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Expand All
              </button>
              <button onClick={collapseAll} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Collapse All
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
            <div className="flex">
              <div className="ml-2">
                <p className="text-sm font-medium text-blue-800">How to Download as PDF</p>
                <p className="text-xs text-blue-700 mt-1">
                  Click "Download PDF" to open your browser's print dialog. Select "Save as PDF" as the destination 
                  to save the complete survey. All sections will be automatically expanded for printing.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handlePrint} className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>Download Full Survey PDF</span>
            </button>
            
            <button onClick={handlePrint} className="px-5 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print to Printer</span>
            </button>
            
            <button onClick={() => window.location.href = '/dashboard'} className="px-5 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
              <span>← Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Survey Sections */}
        <div className="space-y-4">
          {/* Section 1: Firmographics */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => toggleSection('firmographics')}
              className="w-full p-4 text-left text-white flex items-center justify-between hover:opacity-90 print:cursor-default"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.firmographics.from} 0%, ${SECTION_COLORS.firmographics.to} 100%)` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                  1
                </div>
                <span className="text-lg font-semibold">Company & Contact Information</span>
              </div>
              <svg className={`w-5 h-5 transform transition-transform print:hidden ${expandedSections['firmographics'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="print:hidden" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.firmographics.from} 0%, ${SECTION_COLORS.firmographics.to} 100%)` }}>
              <div className="p-4 text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                  1
                </div>
                <span className="text-lg font-semibold">Company & Contact Information</span>
              </div>
            </div>
            {(expandedSections['firmographics']) && (
              <div className="p-5 bg-gray-50 print:block">
                {Object.entries(firmographicsSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: General Benefits */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => toggleSection('general')}
              className="w-full p-4 text-left text-white flex items-center justify-between hover:opacity-90 print:cursor-default"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.general.from} 0%, ${SECTION_COLORS.general.to} 100%)` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                  2
                </div>
                <span className="text-lg font-semibold">General Employee Benefits</span>
              </div>
              <svg className={`w-5 h-5 transform transition-transform print:hidden ${expandedSections['general'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.general.from} 0%, ${SECTION_COLORS.general.to} 100%)` }}>
              <div className="p-4 text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                  2
                </div>
                <span className="text-lg font-semibold">General Employee Benefits</span>
              </div>
            </div>
            {(expandedSections['general']) && (
              <div className="p-5 bg-gray-50 print:block">
                {Object.entries(generalBenefitsSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Current Support */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => toggleSection('current')}
              className="w-full p-4 text-left text-white flex items-center justify-between hover:opacity-90 print:cursor-default"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.current.from} 0%, ${SECTION_COLORS.current.to} 100%)` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                  3
                </div>
                <span className="text-lg font-semibold">Current Support for Serious Medical Conditions</span>
              </div>
              <svg className={`w-5 h-5 transform transition-transform print:hidden ${expandedSections['current'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.current.from} 0%, ${SECTION_COLORS.current.to} 100%)` }}>
              <div className="p-4 text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                  3
                </div>
                <span className="text-lg font-semibold">Current Support for Serious Medical Conditions</span>
              </div>
            </div>
            {(expandedSections['current']) && (
              <div className="p-5 bg-gray-50 print:block">
                {Object.entries(currentSupportSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4 Header */}
          <div className="bg-white rounded-lg shadow p-4 mt-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                4
              </div>
              <h2 className="text-xl font-bold text-gray-800">13 Dimensions of Support</h2>
            </div>
          </div>

          {/* 13 Dimensions */}
          {ALL_DIMENSION_SCHEMAS.map((schema, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => toggleSection(`dim-${idx}`)}
                className="w-full p-4 text-left text-white flex items-center justify-between hover:opacity-90 print:cursor-default"
                style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.dimensions.from} 0%, ${SECTION_COLORS.dimensions.to} 100%)` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-lg font-semibold">{DIMENSION_TITLES[idx + 1]}</span>
                </div>
                <svg className={`w-5 h-5 transform transition-transform print:hidden ${expandedSections[`dim-${idx}`] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="hidden print:block" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.dimensions.from} 0%, ${SECTION_COLORS.dimensions.to} 100%)` }}>
                <div className="p-4 text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-lg font-semibold">{DIMENSION_TITLES[idx + 1]}</span>
                </div>
              </div>
              {(expandedSections[`dim-${idx}`]) && (
                <div className="p-5 bg-gray-50 print:block">
                  {Object.entries(schema).map(([key, field]) => (
                    <div key={key}>{renderField(key, field)}</div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Section 5: Cross-Dimensional */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => toggleSection('cross')}
              className="w-full p-4 text-left text-white flex items-center justify-between hover:opacity-90 print:cursor-default"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.cross.from} 0%, ${SECTION_COLORS.cross.to} 100%)` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                  5
                </div>
                <span className="text-lg font-semibold">Cross-Dimensional Assessment</span>
              </div>
              <svg className={`w-5 h-5 transform transition-transform print:hidden ${expandedSections['cross'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.cross.from} 0%, ${SECTION_COLORS.cross.to} 100%)` }}>
              <div className="p-4 text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                  5
                </div>
                <span className="text-lg font-semibold">Cross-Dimensional Assessment</span>
              </div>
            </div>
            {(expandedSections['cross']) && (
              <div className="p-5 bg-gray-50 print:block">
                {Object.entries(crossDimensionalSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Employee Impact */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => toggleSection('impact')}
              className="w-full p-4 text-left text-white flex items-center justify-between hover:opacity-90 print:cursor-default"
              style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.impact.from} 0%, ${SECTION_COLORS.impact.to} 100%)` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                  6
                </div>
                <span className="text-lg font-semibold">Employee Impact & ROI Assessment</span>
              </div>
              <svg className={`w-5 h-5 transform transition-transform print:hidden ${expandedSections['impact'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block" style={{ background: `linear-gradient(135deg, ${SECTION_COLORS.impact.from} 0%, ${SECTION_COLORS.impact.to} 100%)` }}>
              <div className="p-4 text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-25 rounded-lg flex items-center justify-center font-bold">
                  6
                </div>
                <span className="text-lg font-semibold">Employee Impact & ROI Assessment</span>
              </div>
            </div>
            {(expandedSections['impact']) && (
              <div className="p-5 bg-gray-50 print:block">
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

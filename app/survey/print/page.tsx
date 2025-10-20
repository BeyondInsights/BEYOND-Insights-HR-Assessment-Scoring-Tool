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

    switch (field.type) {
      case 'text':
      case 'textarea':
        return (
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="font-medium text-gray-900 mb-2">{field.label}</div>
            {field.maxLength && (
              <div className="text-xs text-gray-500 mb-2">(Maximum {field.maxLength} characters)</div>
            )}
            <div className="border border-gray-300 rounded-lg p-3 min-h-[60px] bg-gray-50"></div>
            {field.hasNone && (
              <label className="flex items-center mt-2 text-sm text-gray-600">
                <input type="checkbox" className="mr-2" />
                No additional information
              </label>
            )}
          </div>
        )

      case 'select':
        return (
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="font-medium text-gray-900 mb-3">{field.label}</div>
            <div className="space-y-2">
              {field.options?.map((opt: string, i: number) => (
                <label key={i} className="flex items-start text-sm text-gray-700 hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name={fieldKey} className="mt-0.5 mr-3" />
                  <span>{opt}</span>
                </label>
              ))}
              {field.hasOther && (
                <label className="flex items-start text-sm text-gray-700 hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name={fieldKey} className="mt-0.5 mr-3" />
                  <span>Other: _______________________</span>
                </label>
              )}
            </div>
          </div>
        )

      case 'multiselect':
        return (
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="font-medium text-gray-900 mb-2">{field.label}</div>
            <div className="text-xs text-gray-500 mb-3">(Select all that apply)</div>
            <div className="space-y-2">
              {field.categories ? (
                Object.entries(field.categories).map(([category, items]: [string, any]) => (
                  <div key={category} className="mb-4">
                    <div className="font-semibold text-sm text-blue-700 uppercase tracking-wide mb-2 bg-blue-50 px-3 py-1 rounded">
                      {category}
                    </div>
                    <div className="ml-4 space-y-2">
                      {items.map((item: string, i: number) => (
                        <label key={i} className="flex items-start text-sm text-gray-700 hover:bg-gray-50 p-2 rounded">
                          <input type="checkbox" className="mt-0.5 mr-3" />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                field.options?.map((opt: string, i: number) => (
                  <label key={i} className="flex items-start text-sm text-gray-700 hover:bg-gray-50 p-2 rounded">
                    <input type="checkbox" className="mt-0.5 mr-3" />
                    <span>{opt}</span>
                  </label>
                ))
              )}
              {field.hasOther && (
                <label className="flex items-start text-sm text-gray-700 hover:bg-gray-50 p-2 rounded">
                  <input type="checkbox" className="mt-0.5 mr-3" />
                  <span>Other: _______________________</span>
                </label>
              )}
            </div>
          </div>
        )

      case 'grid':
        return (
          <div className="mb-6 overflow-x-auto">
            <div className="font-medium text-gray-900 mb-3">{field.label}</div>
            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <th className="border border-blue-700 p-3 text-left text-white text-xs font-semibold">
                    {field.programs ? 'Program' : 'Item'}
                  </th>
                  {(field.statusOptions || field.responseOptions)?.map((opt: string) => (
                    <th key={opt} className="border border-blue-700 p-2 text-center text-white text-xs font-medium min-w-[100px]">
                      {opt}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(field.programs || field.items)?.map((item: string, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 p-3 text-sm">{item}</td>
                    {(field.statusOptions || field.responseOptions)?.map((opt: string) => (
                      <td key={opt} className="border border-gray-300 p-2 text-center">
                        <input type="radio" name={`grid-${fieldKey}-${idx}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="print:hidden">
        <Header />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-gray-300">
        <img src="/best-companies-2026-logo.png" alt="Best Companies" className="h-16 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">Best Companies for Working with Cancer</h1>
        <p className="text-lg text-gray-700">2026 Employer Index Survey</p>
        <p className="text-sm text-gray-600 mt-2">{companyName} • {currentDate}</p>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Action Bar */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6 print:hidden">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Survey Print Preview</h1>
            <div className="flex gap-2">
              <button onClick={expandAll} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Expand All
              </button>
              <button onClick={collapseAll} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Collapse All
              </button>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button onClick={handlePrint} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Full Survey
            </button>
            <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Survey Sections */}
        <div className="space-y-6">
          {/* Firmographics */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none print:border print:border-gray-300">
            <button
              onClick={() => toggleSection('firmographics')}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white flex justify-between items-center print:hidden"
            >
              <span className="text-lg font-semibold">Section 1: Company & Contact Information</span>
              <svg className={`w-5 h-5 transform transition-transform ${expandedSections['firmographics'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <span className="text-lg font-semibold">Section 1: Company & Contact Information</span>
            </div>
            {(expandedSections['firmographics'] || false) && (
              <div className="p-6 print:block">
                {Object.entries(firmographicsSchema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            )}
          </div>

          {/* 13 Dimensions */}
          {ALL_DIMENSION_SCHEMAS.map((schema, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
              <button
                onClick={() => toggleSection(`dim-${idx}`)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center print:hidden"
              >
                <span className="text-lg font-semibold">
                  Dimension {idx + 1}: {DIMENSION_TITLES[idx + 1]}
                </span>
                <svg className={`w-5 h-5 transform transition-transform ${expandedSections[`dim-${idx}`] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="hidden print:block px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <span className="text-lg font-semibold">
                  Dimension {idx + 1}: {DIMENSION_TITLES[idx + 1]}
                </span>
              </div>
              {(expandedSections[`dim-${idx}`] || false) && (
                <div className="p-6 print:block">
                  {Object.entries(schema).map(([key, field]) => (
                    <div key={key}>{renderField(key, field)}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>

      <style jsx>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }
          
          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}

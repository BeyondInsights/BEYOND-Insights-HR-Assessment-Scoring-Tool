'use client'

import React, { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Import all schemas from their individual files - SAME DIRECTORY
import firmographicsSchema from './schemas/firmographics'
import generalBenefitsSchema from './schemas/general-benefits'
import currentSupportSchema from './schemas/current-support'
import d1Schema from './schemas/d1-medical-leave'
import d2Schema from './schemas/d2-insurance'
import d3Schema from './schemas/d3-manager'
import d4Schema from './schemas/d4-navigation'
import d5Schema from './schemas/d5-accommodations'
import d6Schema from './schemas/d6-culture'
import d7Schema from './schemas/d7-career'
import d8Schema from './schemas/d8-work-continuation'
import d9Schema from './schemas/d9-executive'
import d10Schema from './schemas/d10-caregiver'
import d11Schema from './schemas/d11-prevention'
import d12Schema from './schemas/d12-continuous'
import d13Schema from './schemas/d13-communication'
import crossDimensionalSchema from './schemas/cross-dimensional'
import employeeImpactSchema from './schemas/employee-impact'

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

    // Expand all by default
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

  const handleDownloadPDF = () => {
    expandAll()
    setTimeout(() => {
      const printContent = document.getElementById('print-content')
      if (printContent) {
        window.print()
      }
    }, 100)
  }

  // Render individual questions based on schema structure
  const renderQuestion = (question: any) => {
    if (!question) return null

    const { id, label, type, options, note, instruction } = question

    switch (type) {
      case 'open':
      case 'text':
        return (
          <div key={id} className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {label}
            </label>
            {note && <p className="text-xs text-gray-500 italic mb-2">{note}</p>}
            <div className="w-full p-3 border-2 border-gray-200 rounded-lg bg-white min-h-[44px]">
              <div className="h-5 border-b border-gray-300"></div>
            </div>
          </div>
        )

      case 'single':
      case 'select':
        return (
          <div key={id} className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {label}
            </label>
            <p className="text-xs text-gray-500 italic mb-2">(Select ONE)</p>
            {note && <p className="text-xs text-gray-500 mb-2">{note}</p>}
            <div className="space-y-2">
              {options?.map((option: string, idx: number) => (
                <label key={idx} className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <input type="radio" name={id} className="mt-0.5 mr-3" />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'multi':
      case 'multiselect':
        return (
          <div key={id} className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {label}
            </label>
            <p className="text-xs text-gray-500 italic mb-2">(Select ALL that apply)</p>
            {note && <p className="text-xs text-gray-500 mb-2">{note}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {options?.map((option: string, idx: number) => (
                <label key={idx} className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <input type="checkbox" className="mt-0.5 mr-3" />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'scale':
        return (
          <div key={id} className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {label}
            </label>
            <p className="text-xs text-gray-500 italic mb-2">(Select ONE)</p>
            <div className="space-y-2">
              {options?.map((option: string, idx: number) => (
                <label key={idx} className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <input type="radio" name={id} className="mt-0.5 mr-3" />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Render dimension grid (main question for dimensions)
  const renderDimensionGrid = (schema: any) => {
    if (!schema || !schema.supportOptions || !schema.scale) return null

    return (
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-800 mb-2">
          {schema.intro}
        </p>
        <p className="text-sm text-gray-600 mb-4">
          {schema.questionText || 'For each option below, select ONE status.'}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                <th className="text-left p-3 text-white font-semibold text-sm min-w-[300px]">
                  Support Option
                </th>
                {schema.scale.map((status: string, idx: number) => (
                  <th key={idx} className="text-center p-3 text-white font-semibold text-sm min-w-[140px]">
                    {status}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schema.supportOptions.map((option: string, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-3 text-sm font-medium text-gray-700 border-b border-gray-200">
                    {option}
                  </td>
                  {schema.scale.map((status: string, statusIdx: number) => (
                    <td key={statusIdx} className="p-3 text-center border-b border-gray-200">
                      <input type="radio" name={`d${schema.number}-${idx}`} className="w-4 h-4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Render section questions
  const renderSectionQuestions = (schema: any) => {
    if (!schema) return null

    // Check if it's a regular section with questions array
    if (schema.questions && Array.isArray(schema.questions)) {
      return schema.questions.map((q: any) => renderQuestion(q))
    }
    
    // Check if it's a dimension schema with grid + followUps
    if (schema.supportOptions && schema.scale) {
      return (
        <>
          {renderDimensionGrid(schema)}
          {schema.followUps && schema.followUps.map((q: any) => renderQuestion(q))}
        </>
      )
    }

    return null
  }

  return (
    <div id="print-content" className="min-h-screen bg-gray-50 print:bg-white">
      {/* Screen Header */}
      <div className="print:hidden">
        <Header />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8 pb-6 border-b-2 border-gray-300">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Best Companies for Working with Cancer</h1>
        <p className="text-lg text-gray-600">2026 Employer Index Survey</p>
        <p className="text-sm text-gray-500 mt-2">{companyName} • {currentDate}</p>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200 print:hidden">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Survey Print Preview</h1>
              <p className="text-gray-600 mt-1">Complete survey questionnaire with all questions</p>
            </div>
            <div className="flex gap-2">
              <button onClick={expandAll} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Expand All
              </button>
              <button onClick={collapseAll} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Collapse All
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-900">Download Instructions</p>
                <p className="text-sm text-blue-800">
                  Click "Download PDF" to open print dialog. Select "Save as PDF" as destination.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleDownloadPDF} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Download PDF
            </button>
            
            <button onClick={handlePrint} className="px-6 py-3 bg-white text-gray-700 font-semibold border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            
            <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-3 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Survey Sections */}
        <div className="space-y-4">
          {/* Section 1: Firmographics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('firmographics')}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 print:hidden flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">1</span>
                <span className="text-lg font-semibold">Company & Contact Information</span>
              </div>
              <svg className={`w-5 h-5 transition-transform ${expandedSections['firmographics'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">1</span>
                <span className="text-lg font-semibold">Company & Contact Information</span>
              </div>
            </div>
            {expandedSections['firmographics'] && (
              <div className="p-6 bg-gray-50">
                {renderSectionQuestions(firmographicsSchema)}
              </div>
            )}
          </div>

          {/* Section 2: General Benefits */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('general')}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 print:hidden flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">2</span>
                <span className="text-lg font-semibold">General Employee Benefits</span>
              </div>
              <svg className={`w-5 h-5 transition-transform ${expandedSections['general'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">2</span>
                <span className="text-lg font-semibold">General Employee Benefits</span>
              </div>
            </div>
            {expandedSections['general'] && (
              <div className="p-6 bg-gray-50">
                {renderSectionQuestions(generalBenefitsSchema)}
              </div>
            )}
          </div>

          {/* Section 3: Current Support */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('current')}
              className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-pink-700 text-white hover:from-pink-700 hover:to-pink-800 print:hidden flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">3</span>
                <span className="text-lg font-semibold">Current Support for Serious Medical Conditions</span>
              </div>
              <svg className={`w-5 h-5 transition-transform ${expandedSections['current'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block px-6 py-4 bg-gradient-to-r from-pink-600 to-pink-700 text-white">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">3</span>
                <span className="text-lg font-semibold">Current Support for Serious Medical Conditions</span>
              </div>
            </div>
            {expandedSections['current'] && (
              <div className="p-6 bg-gray-50">
                {renderSectionQuestions(currentSupportSchema)}
              </div>
            )}
          </div>

          {/* Section 4: 13 Dimensions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-600">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">4</span>
              <h2 className="text-xl font-bold text-gray-900">13 Dimensions of Support</h2>
            </div>
          </div>

          {/* All 13 Dimensions */}
          {ALL_DIMENSION_SCHEMAS.map((schema, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection(`dim-${idx}`)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 print:hidden flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">{idx + 1}</span>
                  <span className="text-lg font-semibold">{DIMENSION_TITLES[idx + 1]}</span>
                </div>
                <svg className={`w-5 h-5 transition-transform ${expandedSections[`dim-${idx}`] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="hidden print:block px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">{idx + 1}</span>
                  <span className="text-lg font-semibold">{DIMENSION_TITLES[idx + 1]}</span>
                </div>
              </div>
              {expandedSections[`dim-${idx}`] && (
                <div className="p-6 bg-gray-50">
                  {renderSectionQuestions(schema)}
                </div>
              )}
            </div>
          ))}

          {/* Section 5: Cross-Dimensional */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('cross')}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 print:hidden flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">5</span>
                <span className="text-lg font-semibold">Cross-Dimensional Assessment</span>
              </div>
              <svg className={`w-5 h-5 transition-transform ${expandedSections['cross'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">5</span>
                <span className="text-lg font-semibold">Cross-Dimensional Assessment</span>
              </div>
            </div>
            {expandedSections['cross'] && (
              <div className="p-6 bg-gray-50">
                {renderSectionQuestions(crossDimensionalSchema)}
              </div>
            )}
          </div>

          {/* Section 6: Employee Impact */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection('impact')}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800 print:hidden flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">6</span>
                <span className="text-lg font-semibold">Employee Impact & ROI Assessment</span>
              </div>
              <svg className={`w-5 h-5 transition-transform ${expandedSections['impact'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden print:block px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">6</span>
                <span className="text-lg font-semibold">Employee Impact & ROI Assessment</span>
              </div>
            </div>
            {expandedSections['impact'] && (
              <div className="p-6 bg-gray-50">
                {renderSectionQuestions(employeeImpactSchema)}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Screen Footer */}
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  )
}

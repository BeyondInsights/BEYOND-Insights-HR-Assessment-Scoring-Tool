'use client'

import React, { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Import all schemas
import { firmographicsSchema } from '@/app/survey/schemas/firmographics'
import { generalBenefitsSchema } from '@/app/survey/schemas/general-benefits'
import { currentSupportSchema } from '@/app/survey/schemas/current-support'
import { d1Schema } from '@/app/survey/schemas/dimensions/d1-medical-leave'
import { d2Schema } from '@/app/survey/schemas/dimensions/d2-insurance'
import { d3Schema } from '@/app/survey/schemas/dimensions/d3-manager'
import { d4Schema } from '@/app/survey/schemas/dimensions/d4-navigation'
import { d5Schema } from '@/app/survey/schemas/dimensions/d5-accommodations'
import { d6Schema } from '@/app/survey/schemas/dimensions/d6-culture'
import { d7Schema } from '@/app/survey/schemas/dimensions/d7-career'
import { d8Schema } from '@/app/survey/schemas/dimensions/d8-work-continuation'
import { d9Schema } from '@/app/survey/schemas/dimensions/d9-executive'
import { d10Schema } from '@/app/survey/schemas/dimensions/d10-caregiver'
import { d11Schema } from '@/app/survey/schemas/dimensions/d11-prevention'
import { d12Schema } from '@/app/survey/schemas/dimensions/d12-continuous'
import { d13Schema } from '@/app/survey/schemas/dimensions/d13-communication'
import { crossDimensionalSchema } from '@/app/survey/schemas/cross-dimensional'
import { employeeImpactSchema } from '@/app/survey/schemas/employee-impact'

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

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    // This would generate a PDF or link to pre-made PDF
    alert('PDF download will be implemented with your PDF generation library')
  }

  // Render different field types
  const renderField = (fieldKey: string, field: any) => {
    switch (field.type) {
      case 'text':
      case 'textarea':
        return (
          <div className="mb-4">
            <div className="font-medium text-sm mb-1">{field.label}</div>
            {field.maxLength && (
              <div className="text-xs text-gray-500">(Max {field.maxLength} characters)</div>
            )}
            <div className="border-b border-gray-300 h-12 mt-2"></div>
            {field.hasNone && (
              <div className="mt-1 text-xs">☐ No additional information</div>
            )}
          </div>
        )

      case 'select':
        return (
          <div className="mb-4">
            <div className="font-medium text-sm mb-2">{field.label}</div>
            <div className="ml-4 space-y-1 text-xs">
              {field.options.map((opt: string, i: number) => (
                <div key={i}>○ {opt}</div>
              ))}
              {field.hasOther && <div>○ Other: _______________</div>}
            </div>
          </div>
        )

      case 'multiselect':
        return (
          <div className="mb-4">
            <div className="font-medium text-sm mb-1">{field.label}</div>
            <div className="text-xs text-gray-500">(Select all that apply)</div>
            <div className="ml-4 space-y-1 text-xs mt-2">
              {field.categories ? (
                // Handle categorized multiselect (like D11.1)
                Object.entries(field.categories).map(([category, items]: [string, any]) => (
                  <div key={category} className="mb-3">
                    <div className="font-semibold text-xs uppercase text-blue-600 mb-1">
                      {category}
                    </div>
                    {items.map((item: string, i: number) => (
                      <div key={i} className="ml-4">☐ {item}</div>
                    ))}
                  </div>
                ))
              ) : (
                // Regular multiselect
                field.options.map((opt: string, i: number) => (
                  <div key={i}>☐ {opt}</div>
                ))
              )}
              {field.hasOther && <div>☐ Other: _______________</div>}
            </div>
          </div>
        )

      case 'grid':
        return (
          <div className="mb-6">
            <div className="font-medium text-sm mb-2">{field.label}</div>
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-1 text-left">
                    {field.programs ? 'Program' : 'Item'}
                  </th>
                  {(field.statusOptions || field.responseOptions).map((opt: string) => (
                    <th key={opt} className="border border-gray-300 p-1 text-center text-[9px]">
                      {opt}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(field.programs || field.items).map((item: string, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 p-1 text-[10px]">{item}</td>
                    {(field.statusOptions || field.responseOptions).map((opt: string) => (
                      <td key={opt} className="border border-gray-300 p-1 text-center">○</td>
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
      {/* Header - hidden when printing */}
      <div className="print:hidden">
        <Header />
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">Best Companies for Working with Cancer</h1>
        <p className="text-sm">2026 Employer Index Survey - Complete Version</p>
        <p className="text-xs text-gray-600 mt-1">{companyName} • {currentDate}</p>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6 print:hidden">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Download/Print Full Survey
          </h1>
          <div className="flex gap-4">
            <button onClick={handlePrint} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Print Survey
            </button>
            <button onClick={handleDownloadPDF} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Download PDF
            </button>
            <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Survey Content */}
        <div className="bg-white rounded-lg shadow-sm print:shadow-none space-y-8">
          
          {/* Section 1: Firmographics */}
          <div className="p-6 border-b break-inside-avoid">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Section 1: Company & Contact Information
            </h2>
            {Object.entries(firmographicsSchema).map(([key, field]) => (
              <div key={key}>{renderField(key, field)}</div>
            ))}
          </div>

          {/* Section 2: General Benefits */}
          <div className="p-6 border-b break-inside-avoid">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Section 2: General Employee Benefits
            </h2>
            {Object.entries(generalBenefitsSchema).map(([key, field]) => (
              <div key={key}>{renderField(key, field)}</div>
            ))}
          </div>

          {/* Section 3: Current Support */}
          <div className="p-6 border-b break-inside-avoid">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Section 3: Current Support for Serious Medical Conditions
            </h2>
            {Object.entries(currentSupportSchema).map(([key, field]) => (
              <div key={key}>{renderField(key, field)}</div>
            ))}
          </div>

          {/* Section 4: 13 Dimensions */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Section 4: 13 Dimensions of Support
            </h2>
            
            {ALL_DIMENSION_SCHEMAS.map((schema, idx) => (
              <div key={idx} className="mb-8 break-inside-avoid">
                <h3 className="text-base font-bold text-blue-900 mb-4">
                  Dimension {idx + 1}: {DIMENSION_TITLES[idx + 1]}
                </h3>
                {Object.entries(schema).map(([key, field]) => (
                  <div key={key}>{renderField(key, field)}</div>
                ))}
              </div>
            ))}
          </div>

          {/* Section 5: Cross-Dimensional */}
          <div className="p-6 border-b break-inside-avoid">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Section 5: Cross-Dimensional Assessment
            </h2>
            {Object.entries(crossDimensionalSchema).map(([key, field]) => (
              <div key={key}>{renderField(key, field)}</div>
            ))}
          </div>

          {/* Section 6: Employee Impact */}
          <div className="p-6 break-inside-avoid">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Section 6: Employee Impact & ROI Assessment
            </h2>
            {Object.entries(employeeImpactSchema).map(([key, field]) => (
              <div key={key}>{renderField(key, field)}</div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Cancer and Careers • Best Companies for Working with Cancer Initiative
        </div>
      </main>

      {/* Footer - hidden when printing */}
      <div className="print:hidden">
        <Footer />
      </div>

      {/* Print styles */}
      <style jsx>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}

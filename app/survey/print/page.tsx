'use client'

import React, { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Import your schema files (adjust paths as needed)
// For now, I'll include the schema inline for the working example

export default function PrintSurveyPage() {
  const [companyName, setCompanyName] = useState('')
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    // Get company name from localStorage
    const name = localStorage.getItem('login_company_name') || 
                 localStorage.getItem('companyName') || 
                 'Your Organization'
    setCompanyName(name)
    
    // Set current date
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadWord = () => {
    // This would link to your actual Word document
    window.open('/survey-template.docx', '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - hidden when printing */}
      <div className="print:hidden">
        <Header />
      </div>

      {/* Print Header - only shows when printing */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">Best Companies for Working with Cancer</h1>
        <p className="text-lg">2026 Employer Index Survey</p>
        <p className="text-sm text-gray-600 mt-2">{companyName} • {currentDate}</p>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Action Buttons - hidden when printing */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6 print:hidden">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Download/Print Full Survey
          </h1>
          <p className="text-gray-600 mb-6">
            Download or print the complete survey with all questions and response options.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Survey
            </button>
            <button
              onClick={handleDownloadWord}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Word Document
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Survey Content */}
        <div className="bg-white rounded-lg shadow-sm print:shadow-none">
          {/* Section 1: Firmographics */}
          <div className="p-6 border-b break-inside-avoid">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Section 1: Company & Contact Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name*
                </label>
                <div className="border-b border-gray-300 h-8"></div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name*
                </label>
                <div className="border-b border-gray-300 h-8"></div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Global Employee Size*
                </label>
                <div className="ml-4 space-y-1 text-sm">
                  {['Under 500', '500-999', '1,000-4,999', '5,000-9,999', 
                    '10,000-24,999', '25,000-49,999', '50,000-99,999', '100,000+'].map(opt => (
                    <div key={opt}>○ {opt}</div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Headquarters Location (Country)*
                </label>
                <div className="ml-4 space-y-1 text-sm">
                  <select className="text-sm text-gray-600">
                    <option>Select Country...</option>
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>Germany</option>
                    <option>France</option>
                    <option>Australia</option>
                    <option>Japan</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Countries with Employee Presence*
                </label>
                <div className="ml-4 space-y-1 text-sm">
                  {['No other countries - headquarters only', '2-5 countries', 
                    '6-10 countries', '11-25 countries', '26-50 countries', 
                    '51-100 countries', 'More than 100 countries'].map(opt => (
                    <div key={opt}>○ {opt}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: General Benefits */}
          <div className="p-6 border-b break-inside-avoid">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Section 2: General Employee Benefits
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Benefits Currently Offered (Select all that apply)
              </label>
              <div className="ml-4 space-y-1 text-sm">
                {['Medical/health insurance', 'Dental insurance', 'Vision insurance',
                  'Prescription drug coverage', 'Mental health coverage', 'Life insurance',
                  'Short-term disability', 'Long-term disability'].map(opt => (
                  <div key={opt}>☐ {opt}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Current Support */}
          <div className="p-6 border-b break-inside-avoid">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Section 3: Current Support for Serious Medical Conditions
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Approach to Supporting Employees with Serious Medical Conditions
              </label>
              <div className="ml-4 space-y-1 text-sm">
                {['No formal approach - handled case by case',
                  'Manager discretion with HR guidance',
                  'Standardized process with some flexibility',
                  'Formal program with defined benefits',
                  'Comprehensive integrated support system'].map(opt => (
                  <div key={opt}>○ {opt}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Dimensions Grid Example */}
          <div className="p-6 break-inside-avoid">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Section 4: 13 Dimensions of Support
            </h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Dimension 1: Medical Leave & Flexibility
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                For each program below, indicate your organization's current status:
              </p>
              
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Program</th>
                    <th className="border border-gray-300 p-2 text-center">Currently offer</th>
                    <th className="border border-gray-300 p-2 text-center">In planning</th>
                    <th className="border border-gray-300 p-2 text-center">Assessing</th>
                    <th className="border border-gray-300 p-2 text-center">Not able</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2">
                      Paid medical leave beyond requirements
                    </td>
                    <td className="border border-gray-300 p-2 text-center">○</td>
                    <td className="border border-gray-300 p-2 text-center">○</td>
                    <td className="border border-gray-300 p-2 text-center">○</td>
                    <td className="border border-gray-300 p-2 text-center">○</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2">
                      Flexible work hours during treatment
                    </td>
                    <td className="border border-gray-300 p-2 text-center">○</td>
                    <td className="border border-gray-300 p-2 text-center">○</td>
                    <td className="border border-gray-300 p-2 text-center">○</td>
                    <td className="border border-gray-300 p-2 text-center">○</td>
                  </tr>
                  {/* Add more rows as needed */}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Page break notice */}
        <div className="mt-8 text-center text-sm text-gray-500 print:hidden">
          <p>The full survey contains all 13 dimensions and approximately 200 questions.</p>
          <p>Use the Print or Download buttons above to get the complete version.</p>
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
          
          table {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { Upload, Award } from 'lucide-react'

export default function CompletionPage() {
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}')
    if (firmo?.companyName) setCompanyName(firmo.companyName)
    
    const savedEmail = localStorage.getItem('auth_email') || ''
    setEmail(savedEmail)
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileNames = Array.from(files).map(f => f.name)
      setUploadedFiles(prev => [...prev, ...fileNames])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <img src="/cancer-careers-logo.png" alt="Cancer and Careers" className="h-12 w-auto" />
            <img src="/best-companies-2026-logo.png" alt="Best Companies Award" className="h-14 w-auto" />
          </div>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-purple-600 to-blue-600"></div>
          
          <div className="p-8 sm:p-12">
            {/* Thank you heading */}
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Thank You
            </h1>
            
            <p className="text-xl text-gray-700 mb-2">
              Assessment Complete
            </p>

            {companyName && (
              <p className="text-lg text-gray-600 mb-8">
                {companyName}
              </p>
            )}

            <div className="w-16 h-px bg-gray-300 mb-8"></div>

            {/* Main message */}
            <div className="space-y-4 mb-10 text-gray-700">
              <p className="text-base leading-relaxed">
                We know how valuable your time is, and we deeply appreciate your commitment to this important work.
              </p>
              
              <p className="text-base leading-relaxed">
                Your thoughtful responses provide essential insights into your organization's current support landscape and will help identify meaningful opportunities to enhance care for employees navigating cancer and other serious health conditions.
              </p>
            </div>

            {/* Documentation Upload Section */}
            <div className="bg-gray-50 rounded-lg p-8 mb-8 border border-gray-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Supporting Documentation</h2>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    To verify the workplace support options available to employees managing cancer and other serious health conditions, please upload relevant supporting documentation.
                  </p>
                  <p className="text-xs text-gray-600 mb-4">
                    Examples: benefit summaries, policy documents, program guidelines, employee handbooks, or other materials that confirm available support.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                  <div className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Documents
                  </div>
                </label>
                
                {uploadedFiles.length > 0 && (
                  <div className="w-full bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Uploaded files:</p>
                    <ul className="space-y-1">
                      {uploadedFiles.map((file, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {file}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Badge & Marketing Section */}
            <div className="bg-amber-50 rounded-lg p-8 mb-8 border border-amber-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <img src="/best-companies-2026-logo.png" alt="Best Companies Award" className="h-16 w-auto" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Recognition & Marketing Materials</h2>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Organizations that meet or exceed our benchmark standards will be eligible to receive the <strong>Best Companies for Working with Cancer</strong> certification badge and access to marketing materials.
                  </p>
                  <p className="text-xs text-gray-600">
                    If your organization qualifies, we'll provide comprehensive guidelines for using the certification badge in your recruiting materials, website, and employee communications, along with supporting marketing assets.
                  </p>
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div className="bg-blue-50 rounded-lg p-8 mb-8 border border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What Happens Next</h2>
              
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                A member of the Cancer and Careers team will carefully review your assessment and supporting documentation, then reach out to you at{' '}
                <span className="font-semibold text-blue-700">{email}</span>{' '}
                within the next 7 to 10 business days.
              </p>
              
              <p className="text-sm text-gray-700 leading-relaxed">
                We'll discuss your results, answer any questions, and collaborate with you to explore meaningful next steps for your organization.
              </p>
            </div>

            {/* Info note */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> You can return to this page anytime from your dashboard to review next steps and upload additional documentation.
              </p>
            </div>
                
            {/* Action button */}
            <div className="flex justify-center">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>

            {/* Footer note */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600">
                We're honored to partner with you on this important work.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Page footer */}
      <div className="max-w-4xl mx-auto px-6 py-8 text-center">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} Cancer and Careers & CEW Foundation
        </p>
        <p className="text-xs text-gray-500 mt-1">
          All responses collected and analyzed by BEYOND Insights, LLC
        </p>
      </div>
    </div>
  )
}

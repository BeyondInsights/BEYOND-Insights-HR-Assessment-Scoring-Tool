'use client'
import { useEffect, useState } from 'react'
import { Award, Users, CheckCircle2 } from 'lucide-react'

export default function CompletionPage() {
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [employeeSurveyOptIn, setEmployeeSurveyOptIn] = useState<boolean | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}')
    if (firmo?.companyName) setCompanyName(firmo.companyName)
    
    const savedEmail = localStorage.getItem('auth_email') || ''
    setEmail(savedEmail)

    // Check if they already made a selection
    const existingOptIn = localStorage.getItem('employee_survey_opt_in')
    if (existingOptIn !== null) {
      setEmployeeSurveyOptIn(existingOptIn === 'true')
    }
  }, [])

  const handleOptInChange = (value: boolean) => {
    setEmployeeSurveyOptIn(value)
    setShowValidation(false)
    
    // Save to localStorage
    localStorage.setItem('employee_survey_opt_in', value.toString())
    if (value) {
      localStorage.setItem('employee_survey_opt_in_date', new Date().toISOString())
    } else {
      localStorage.removeItem('employee_survey_opt_in_date')
    }
  }

  const handleContinue = () => {
    if (employeeSurveyOptIn === null) {
      setShowValidation(true)
      // Scroll to the opt-in section
      document.getElementById('employee-survey-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    window.location.href = '/dashboard'
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
              Survey Complete
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

            {/* Optional Employee Survey Section - REQUIRED */}
            <div 
              id="employee-survey-section"
              className={`rounded-lg p-8 mb-8 border-2 transition-all ${
                showValidation && employeeSurveyOptIn === null
                  ? 'bg-red-50 border-red-400 animate-pulse'
                  : 'bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200'
              }`}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    Optional Employee Survey
                    <span className="ml-2 text-red-600 text-lg">*</span>
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Your survey fee includes the option to deploy an employee survey to evaluate perceptions of your company programs and benefits, and identify opportunities for enhancements.
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    If interested, our independent research provider, <strong>BEYOND Insights</strong>, will provide a unique survey link which can be sent internally to your employees. Upon completion, BEYOND Insights will provide a detailed report and analysis.
                  </p>
                  <p className="text-xs text-gray-600 mb-6">
                    <strong>Privacy Note:</strong> Responses will be reported in aggregate and no individual data will be shared.
                  </p>
                </div>
              </div>

              {/* Required selection */}
              <div className={`bg-white rounded-lg p-6 border-2 ${
                showValidation && employeeSurveyOptIn === null
                  ? 'border-red-500'
                  : 'border-teal-300'
              }`}>
                <div className="mb-4">
                  <p className="text-base font-bold text-gray-900 mb-4">
                    Would {companyName || 'your organization'} like to participate in the optional employee survey?
                    <span className="ml-2 text-red-600">*</span>
                  </p>
                  
                  {showValidation && employeeSurveyOptIn === null && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-lg">
                      <p className="text-sm font-semibold text-red-800">
                        Please select an option to continue
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {/* Yes Option */}
                    <label className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      employeeSurveyOptIn === true
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-300 bg-white hover:border-teal-400'
                    }`}>
                      <input
                        type="radio"
                        name="employee_survey"
                        checked={employeeSurveyOptIn === true}
                        onChange={() => handleOptInChange(true)}
                        className="mt-1 w-5 h-5 text-teal-600 border-gray-300 focus:ring-teal-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="text-base font-semibold text-gray-900 block mb-1">
                          Yes, we're interested
                        </span>
                        <p className="text-sm text-gray-600">
                          BEYOND Insights will reach out to coordinate the employee survey and provide you with a unique survey link and implementation guidance.
                        </p>
                      </div>
                    </label>

                    {/* No Option */}
                    <label className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      employeeSurveyOptIn === false
                        ? 'border-gray-600 bg-gray-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="employee_survey"
                        checked={employeeSurveyOptIn === false}
                        onChange={() => handleOptInChange(false)}
                        className="mt-1 w-5 h-5 text-gray-600 border-gray-300 focus:ring-gray-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="text-base font-semibold text-gray-900 block mb-1">
                          No, not at this time
                        </span>
                        <p className="text-sm text-gray-600">
                          You can update this preference later from your dashboard if you change your mind.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Confirmation message when Yes is selected */}
                {employeeSurveyOptIn === true && (
                  <div className="mt-4 flex items-start gap-3 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-teal-900 mb-1">
                        Excellent! Here's what happens next:
                      </p>
                      <ul className="text-sm text-teal-800 space-y-1 list-disc list-inside">
                        <li>BEYOND Insights will contact you at <span className="font-medium">{email}</span></li>
                        <li>You'll receive a unique survey link to distribute to your employees</li>
                        <li>Upon completion, you'll receive a comprehensive analysis report</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact info */}
              <div className="mt-4 text-xs text-gray-600 text-center">
                Questions? Contact <a href="mailto:cacbestcompanies@cew.org" className="text-teal-700 hover:text-teal-800 font-medium underline">cacbestcompanies@cew.org</a>
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
                A member of the Cancer and Careers team will carefully review your survey, then reach out to you at{' '}
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
                <strong>Note:</strong> You can return to this page anytime from your dashboard to review next steps or update your employee survey preference.
              </p>
            </div>
                
            {/* Action button */}
            <div className="flex justify-center">
              <button
                onClick={handleContinue}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  employeeSurveyOptIn === null
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
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

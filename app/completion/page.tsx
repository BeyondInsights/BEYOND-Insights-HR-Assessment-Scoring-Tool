'use client'
import { useEffect, useState } from 'react'
import { Award, Users, CheckCircle2, Calendar, BarChart3, Bell, FileText } from 'lucide-react'

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
              Thank You!
            </h1>
            
            <p className="text-xl text-gray-700 mb-2">
              Survey Successfully Submitted
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
                You have successfully submitted your company's survey responses for the <strong>Cancer and Careers Best Companies for Working With Cancer Initiative</strong>. By participating, your organization is playing a vital role in shaping the future of workplace support for employees managing cancer and other serious health conditions.
              </p>
              
              <p className="text-base leading-relaxed">
                Your participation will truly impact workplaces for those impacted by cancer or other serious health conditions.
              </p>
            </div>

            {/* Dashboard Access */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    You may download your submitted responses at any time by visiting your dashboard. All your survey data is securely saved and accessible whenever you need it.
                  </p>
                </div>
              </div>
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

            {/* Timeline - What Happens Next */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 mb-8 border border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-blue-600" />
                What Happens Next?
              </h2>
              
              <div className="space-y-5">
                {/* Survey Close */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Survey Close: January 23, 2026</h3>
                    <p className="text-sm text-gray-700">
                      BEYOND Insights will conduct and finalize analysis following the close of the survey.
                    </p>
                  </div>
                </div>

{/* Index Release */}
<div className="flex items-start gap-4">
  <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
    2
  </div>
  <div className="flex-1">
    <h3 className="font-semibold text-gray-900 mb-1">Initiative Release</h3>
    <p className="text-sm text-gray-700">
      The Cancer and Careers 2026 Best Companies for Working With Cancer Initiative release is scheduled to be announced in early March, 2026.
    </p>
  </div>
</div>
                {/* Notification */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Certification Notification</h3>
                    <p className="text-sm text-gray-700">
                      Certified companies will be notified 2 weeks prior to public announcement, and marketing materials will be distributed.
                    </p>
                  </div>
                </div>

                {/* Benchmarking Reports */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Benchmarking Reports: Distributed March 2026</h3>
                    <div className="bg-white border border-teal-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600">
                        <strong>Please Note:</strong> Benchmarking Reports are included with the survey fee. All reports are completely confidential and shared back only to the participating company. No individual data is shared with the public or any other participating company.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
     
            {/* Action button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={handleContinue}
                className={`px-8 py-4 rounded-lg font-semibold transition-colors text-lg ${
                  employeeSurveyOptIn === null
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                Continue to Dashboard
              </button>
            </div>

            {/* Closing Message */}
            <div className="border-t border-gray-200 pt-8 mb-8">
              <p className="text-base text-gray-700 text-center mb-4">
                Thank you again for participating. Your responses will improve workplaces for all employees. 
              </p>
              <p className="text-base font-semibold text-gray-900 text-center">
                With appreciation,<br />
                The Cancer and Careers Team
              </p>
            </div>

            {/* Resources Section */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3 text-center">Additional Resources</h3>
              <div className="space-y-2 text-sm text-center">
                <div>
                  <a 
                    href="https://www.cancerandcareers.org/en/employers/best-companies" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 font-medium underline"
                  >
                    Learn more about the Best Companies for Working With Cancer Initiative
                  </a>
                </div>
                <div className="text-gray-600">
                  Questions? Email:{' '}
                  <a href="mailto:cacbestcompanies@cew.org" className="text-purple-600 hover:text-purple-700 font-medium underline">
                    cacbestcompanies@cew.org
                  </a>
                </div>
              </div>
            </div>

            {/* CAC Logo at Bottom */}
            <div className="flex justify-center pt-6 border-t border-gray-200">
              <img 
                src="/cancer-careers-logo.png" 
                alt="Cancer and Careers" 
                className="h-16 w-auto opacity-80"
              />
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

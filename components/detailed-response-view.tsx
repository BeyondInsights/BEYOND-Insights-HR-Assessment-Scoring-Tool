'use client'

import Image from 'next/image'

interface DetailedViewProps {
  assessment: any
  onClose: () => void
}

const sectionNames: Record<string, string> = {
  firmographics_complete: 'Company Firmographics',
  general_benefits_complete: 'General Benefits',
  current_support_complete: 'Current Support Programs',
  dimension1_complete: 'Medical Leave & Flexibility',
  dimension2_complete: 'Insurance & Financial Protection',
  dimension3_complete: 'Manager Preparedness & Capability',
  dimension4_complete: 'Navigation & Expert Resources',
  dimension5_complete: 'Workplace Accommodations',
  dimension6_complete: 'Culture & Psychological Safety',
  dimension7_complete: 'Career Continuity & Advancement',
  dimension8_complete: 'Work Continuation & Resumption',
  dimension9_complete: 'Executive Commitment & Resources',
  dimension10_complete: 'Caregiver & Family Support',
  dimension11_complete: 'Prevention, Wellness & Legal Compliance',
  dimension12_complete: 'Continuous Improvement & Outcomes',
  dimension13_complete: 'Communication & Awareness',
  cross_dimensional_complete: 'Cross-Dimensional Assessment',
  'employee-impact-assessment_complete': 'Employee Impact Assessment'
}

export default function DetailedResponseView({ assessment, onClose }: DetailedViewProps) {
  const sections = Object.entries(sectionNames).map(([key, name]) => ({
    key,
    name,
    completed: assessment[key as keyof typeof assessment] === true
  }))

  const completedSections = sections.filter(s => s.completed).length
  const totalSections = sections.length
  const completionPercentage = Math.round((completedSections / totalSections) * 100)

  // Get firmographics data
  const firmographics = assessment.firmographics_data || {}

  // Get the survey ID for profile link
  const surveyId = assessment.app_id || assessment.survey_id || ''

  // Open company profile in new tab (admin version)
  const openProfile = () => {
    const profileUrl = `/admin/profile/${surveyId}`
    window.open(profileUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with BI Logo */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg p-2">
              <Image 
                src="/BI_LOGO_FINAL.png" 
                alt="Beyond Insights" 
                width={140} 
                height={42}
                className="h-8 w-auto"
              />
            </div>
            <div className="border-l border-white/30 pl-4">
              <p className="text-blue-100 text-sm">Survey ID</p>
              <p className="font-semibold">{surveyId || 'N/A'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Company Information Section */}
          <div className="mb-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Company Information</h3>
              {surveyId && (
                <button
                  onClick={openProfile}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Full Profile
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Company Name</p>
                <p className="font-semibold text-gray-900">{assessment.company_name || firmographics.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Industry</p>
                <p className="font-semibold text-gray-900">{firmographics.c2 || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Company Revenue</p>
                <p className="font-semibold text-gray-900">
                  {/* Check c4 first (Excel import), then c5 (app version) - skip if c4 is array (corrupted data) */}
                  {(firmographics.c4 && !Array.isArray(firmographics.c4) ? firmographics.c4 : null) || firmographics.c5 || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Headquarters</p>
                <p className="font-semibold text-gray-900">{firmographics.s9 || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide"># Countries w/ Presence</p>
                <p className="font-semibold text-gray-900">{firmographics.s9a || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Employees</p>
                <p className="font-semibold text-gray-900">{firmographics.s8 || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Benefits Eligibility</p>
                <p className="font-semibold text-gray-900">{firmographics.c3 || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mb-6 bg-blue-50 rounded-lg p-5 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Contact Person</p>
                <p className="font-semibold text-gray-900">
                  {firmographics.firstName || ''} {firmographics.lastName || ''}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <p className="font-semibold text-gray-900 break-all">{assessment.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Title</p>
                <p className="font-semibold text-gray-900">
                  {/* Check title, titleOther for "Other" case, then s5 as fallback for FPs */}
                  {(firmographics.title && firmographics.title.toLowerCase() !== 'other' 
                    ? firmographics.title 
                    : firmographics.titleOther || firmographics.title_other || firmographics.title) 
                    || firmographics.s5 
                    || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Level</p>
                <p className="font-semibold text-gray-900">{firmographics.s5 || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-sm font-semibold text-green-900 mb-1">Completion Status</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-green-700">{completionPercentage}%</p>
                <p className="text-sm text-green-600">Complete</p>
              </div>
              <p className="text-sm text-green-600 mt-1">
                {completedSections} of {totalSections} sections
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">Timeline</h3>
              <p className="text-sm text-purple-700">
                Started: {new Date(assessment.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-purple-700 mt-1">
                Last Active: {new Date(assessment.updated_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-purple-600 mt-1">
                {assessment.daysInProgress} days in progress
              </p>
            </div>

            {/* User Type Badge */}
            <div className={`rounded-lg p-4 border ${
              assessment.isFoundingPartner 
                ? 'bg-purple-50 border-purple-300' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Participant Type</h3>
              {assessment.isFoundingPartner ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="font-bold text-purple-700">Founding Partner</p>
                    <p className="text-sm text-purple-600">No payment required</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-blue-700">Standard Participant</p>
                  <p className="text-sm text-blue-600">$1,250 fee</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info - Only for Non-Founding Partners */}
          {!assessment.isFoundingPartner && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Payment Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`font-semibold ${assessment.payment_completed ? 'text-green-600' : 'text-red-600'}`}>
                    {assessment.payment_completed ? '✓ Paid' : '✗ Unpaid'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Method</p>
                  <p className="font-semibold text-gray-900">
                    {assessment.payment_method || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-semibold text-gray-900">
                    ${(assessment.payment_amount || 1250).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section Completion Status */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Survey Section Status</h3>
            <div className="space-y-2">
              {sections.map(section => (
                <div
                  key={section.key}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    section.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      section.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {section.completed ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">–</span>
                      )}
                    </div>
                    <span className={`font-medium ${
                      section.completed ? 'text-green-900' : 'text-gray-700'
                    }`}>
                      {section.name}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    section.completed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {section.completed ? 'Completed' : 'Incomplete'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-3">
          {surveyId && (
            <button
              onClick={openProfile}
              className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-semibold"
            >
              View Full Profile
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

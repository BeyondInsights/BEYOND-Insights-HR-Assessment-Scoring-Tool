'use client'

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{assessment.company_name || 'N/A'}</h2>
            <p className="text-blue-100 text-sm mt-1">Survey ID: {assessment.survey_id}</p>
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
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Contact Person</h3>
              <p className="text-lg font-bold text-blue-700">
                {assessment.firmographics_data?.firstName || ''} {assessment.firmographics_data?.lastName || ''}
              </p>
              <p className="text-sm text-blue-600 mt-1">{assessment.email}</p>
            </div>

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
          </div>

          {/* Payment Info - Only for Non-Founding Partners */}
          {!assessment.isFoundingPartner && (
            <div className="mb-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
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

          {/* Founding Partner Badge */}
          {assessment.isFoundingPartner && (
            <div className="mb-8 bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <div>
                  <h3 className="text-lg font-bold text-purple-900">Founding Partner</h3>
                  <p className="text-sm text-purple-700">No payment required</p>
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

          {/* Progress Summary */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Progress Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Authorization & Firmographics</span>
                <span className={`font-semibold ${assessment.auth_completed ? 'text-green-600' : 'text-gray-400'}`}>
                  {assessment.auth_completed ? '✓ Complete' : '○ Incomplete'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Survey Sections</span>
                <span className="font-semibold text-blue-600">
                  {completedSections} / {totalSections} Complete
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Overall Progress</span>
                <span className="font-semibold text-purple-600">
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
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

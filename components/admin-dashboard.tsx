'use client'

import { useState, useEffect } from 'react'
import { isFoundingPartner } from '@/lib/founding-partners'
import DetailedResponseView from './detailed-response-view'
import { generateInvoicePDF, downloadInvoicePDF, type InvoiceData } from '@/lib/invoice-generator'

interface Assessment {
  id: string
  user_id: string
  email: string
  survey_id: string
  company_name: string | null
  created_at: string
  updated_at: string
  payment_completed: boolean
  payment_method: string | null
  payment_date?: string
  payment_amount?: number
  auth_completed: boolean
  letter_viewed: boolean
  firmographics_data: any
  general_benefits_data: any
  current_support_data: any
  dimension1_data: any
  dimension2_data: any
  dimension3_data: any
  dimension4_data: any
  dimension5_data: any
  dimension6_data: any
  dimension7_data: any
  dimension8_data: any
  dimension9_data: any
  dimension10_data: any
  dimension11_data: any
  dimension12_data: any
  dimension13_data: any
  cross_dimensional_data: any
  employee_impact_data: any
  employee_survey_opt_in: boolean | null
  firmographics_complete: boolean
  general_benefits_complete: boolean
  current_support_complete: boolean
  dimension1_complete: boolean
  dimension2_complete: boolean
  dimension3_complete: boolean
  dimension4_complete: boolean
  dimension5_complete: boolean
  dimension6_complete: boolean
  dimension7_complete: boolean
  dimension8_complete: boolean
  dimension9_complete: boolean
  dimension10_complete: boolean
  dimension11_complete: boolean
  dimension12_complete: boolean
  dimension13_complete: boolean
  cross_dimensional_complete: boolean
  employee_impact_complete: boolean
}

interface ProcessedAssessment extends Assessment {
  isFoundingPartner: boolean
  status: string
  completionPercentage: number
  sectionsCompleted: number
  totalSections: number
  daysInProgress: number
}

export default function AdminDashboard() {
  const [assessments, setAssessments] = useState<ProcessedAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedAssessment, setSelectedAssessment] = useState<ProcessedAssessment | null>(null)
  
  // Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceAssessment, setInvoiceAssessment] = useState<ProcessedAssessment | null>(null)

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      // Get admin email from sessionStorage
      const authData = sessionStorage.getItem('adminAuth')
      if (!authData) {
        console.error('No admin auth found')
        setLoading(false)
        return
      }
      
      const { email: adminEmail } = JSON.parse(authData)
      
      // Fetch via API route (uses service role key server-side)
      const response = await fetch('/api/admin/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminEmail }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch assessments')
      }
      
      const { assessments: data } = await response.json()

      const processed = (data || []).map((assessment: Assessment) => {
        const isFP = isFoundingPartner(assessment.survey_id)
        
        // 🐛 DEBUG: Log FP check results
        if (assessment.company_name?.toLowerCase().includes('merck') || 
            assessment.company_name?.toLowerCase().includes('google') ||
            assessment.company_name?.toLowerCase().includes('pfizer') ||
            assessment.company_name?.toLowerCase().includes('maven')) {
          console.log('🔍 FP Check:', {
            company: assessment.company_name,
            surveyId: assessment.survey_id,
            isFoundingPartner: isFP,
            paymentMethod: assessment.payment_method
          })
        }
        
        const completionFlags = [
          assessment.auth_completed,
          assessment.firmographics_complete,
          assessment.general_benefits_complete,
          assessment.current_support_complete,
          assessment.dimension1_complete,
          assessment.dimension2_complete,
          assessment.dimension3_complete,
          assessment.dimension4_complete,
          assessment.dimension5_complete,
          assessment.dimension6_complete,
          assessment.dimension7_complete,
          assessment.dimension8_complete,
          assessment.dimension9_complete,
          assessment.dimension10_complete,
          assessment.dimension11_complete,
          assessment.dimension12_complete,
          assessment.dimension13_complete,
          assessment.cross_dimensional_complete,
          assessment.employee_impact_complete,
        ]
        const sectionsCompleted = completionFlags.filter(Boolean).length
        const totalSections = 19
        const completionPercentage = Math.round((sectionsCompleted / totalSections) * 100)
        
        let status = 'Not Started'
        if (completionPercentage >= 100) status = 'Completed'
        else if (completionPercentage > 0) status = 'In Progress'

        const daysInProgress = Math.floor(
          (new Date().getTime() - new Date(assessment.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        return {
          ...assessment,
          isFoundingPartner: isFP,
          status,
          completionPercentage,
          sectionsCompleted,
          totalSections,
          daysInProgress,
        }
      })

      setAssessments(processed)
    } catch (error) {
      console.error('Error fetching assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle invoice viewing
  const handleViewInvoice = async (assessment: ProcessedAssessment) => {
    setInvoiceAssessment(assessment)
    setShowInvoiceModal(true)
  }

  // Handle invoice download
  const handleDownloadInvoice = async () => {
    if (!invoiceAssessment) return

    const firm = invoiceAssessment.firmographics_data || {}
    
    const invoiceData: InvoiceData = {
      invoiceNumber: invoiceAssessment.survey_id || invoiceAssessment.id,
      invoiceDate: invoiceAssessment.payment_date 
        ? new Date(invoiceAssessment.payment_date).toLocaleDateString('en-US')
        : new Date(invoiceAssessment.created_at).toLocaleDateString('en-US'),
      dueDate: invoiceAssessment.payment_date 
        ? new Date(new Date(invoiceAssessment.payment_date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US')
        : new Date(new Date(invoiceAssessment.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
      companyName: invoiceAssessment.company_name || firm.companyName || 'Company',
      contactName: `${firm.firstName || ''} ${firm.lastName || ''}`.trim() || 'Contact',
      title: firm.title || firm.titleOther || undefined,
      addressLine1: firm.addressLine1 || '123 Main St',
      addressLine2: firm.addressLine2 || undefined,
      city: firm.city || 'City',
      state: firm.state || 'State',
      zipCode: firm.zipCode || '00000',
      email: invoiceAssessment.email || '',
      lineItems: [
        {
          description: '2026 Best Companies for Working with Cancer Index - Annual Assessment Fee',
          quantity: 1,
          unitPrice: 1250.00,
          total: 1250.00
        }
      ],
      subtotal: 1250.00,
      total: 1250.00,
      notes: 'Thank you for participating in the Best Companies for Working with Cancer Index.'
    }

    await downloadInvoicePDF(invoiceData)
    setShowInvoiceModal(false)
    setInvoiceAssessment(null)
  }

  // Filter assessments
  const filteredAssessments = assessments.filter(assessment => {
    // Search filter
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      (assessment.company_name?.toLowerCase().includes(searchLower)) ||
      (assessment.email?.toLowerCase().includes(searchLower)) ||
      (assessment.survey_id?.toLowerCase().includes(searchLower))

    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && assessment.status === 'Completed') ||
      (statusFilter === 'in-progress' && assessment.status === 'In Progress') ||
      (statusFilter === 'not-started' && assessment.status === 'Not Started')

    // Type filter
    const matchesType = typeFilter === 'all' ||
      (typeFilter === 'founding' && assessment.isFoundingPartner) ||
      (typeFilter === 'standard' && !assessment.isFoundingPartner)

    return matchesSearch && matchesStatus && matchesType
  })

  // Calculate stats
  const foundingPartners = assessments.filter(a => a.isFoundingPartner)
  const standardParticipants = assessments.filter(a => !a.isFoundingPartner)
  const completedCount = assessments.filter(a => a.status === 'Completed').length
  const totalRevenue = assessments
    .filter(a => a.payment_completed && !a.isFoundingPartner)
    .reduce((sum, a) => sum + (a.payment_amount || 1250), 0)
  const avgCompletion = assessments.length > 0 
    ? Math.round(assessments.reduce((sum, a) => sum + a.completionPercentage, 0) / assessments.length)
    : 0
  const avgDaysToComplete = assessments.filter(a => a.status === 'Completed').length > 0
    ? Math.round(
        assessments
          .filter(a => a.status === 'Completed')
          .reduce((sum, a) => sum + a.daysInProgress, 0) / 
        assessments.filter(a => a.status === 'Completed').length
      )
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-16 w-16 text-purple-600 mx-auto mb-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Fetching assessment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-10" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Survey Administration Dashboard</h1>
        <p className="text-gray-600">Best Companies for Working with Cancer Initiative - 2026</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">FOUNDING PARTNERS</span>
            <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="text-3xl font-bold">{foundingPartners.length}</div>
          <p className="text-sm opacity-75">{foundingPartners.filter(a => a.status === 'Completed').length} completed</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">STANDARD PARTICIPANTS</span>
            <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <div className="text-3xl font-bold">{standardParticipants.length}</div>
          <p className="text-sm opacity-75">{standardParticipants.filter(a => a.status === 'Completed').length} completed</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">TOTAL REVENUE</span>
            <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-3xl font-bold">${(totalRevenue / 1000).toFixed(1)}K</div>
          <p className="text-sm opacity-75">{standardParticipants.filter(a => a.payment_completed).length} paid • {foundingPartners.length} FP sponsored</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">AVG COMPLETION</span>
            <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-3xl font-bold">{avgCompletion}%</div>
          <p className="text-sm opacity-75">Avg {avgDaysToComplete} days to complete</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Search</label>
            <input
              type="text"
              placeholder="Company, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="not-started">Not Started</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Types</option>
              <option value="founding">Founding Partners</option>
              <option value="standard">Standard Participants</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredAssessments.length}</span> of <span className="font-semibold">{assessments.length}</span> responses
          </p>
          <button
            onClick={() => {
              // Export to Excel functionality
              const headers = ['Company', 'Email', 'Survey ID', 'Type', 'Status', 'Progress', 'Payment', 'Started']
              const rows = filteredAssessments.map(a => [
                a.company_name || 'N/A',
                a.email,
                a.survey_id,
                a.isFoundingPartner ? 'Founding Partner' : 'Standard',
                a.status,
                `${a.completionPercentage}%`,
                a.isFoundingPartner ? 'FP Comp' : (a.payment_completed ? 'Paid' : 'Unpaid'),
                new Date(a.created_at).toLocaleDateString()
              ])
              
              const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
              const blob = new Blob([csvContent], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `assessments-export-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
          >
            Export to Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Started</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAssessments.map((assessment) => (
              <tr key={assessment.id} className="hover:bg-gray-50 transition">
                {/* Company */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      assessment.isFoundingPartner ? 'bg-purple-600' : 'bg-blue-600'
                    }`}>
                      {(assessment.company_name || assessment.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{assessment.company_name || 'No company name'}</p>
                      <p className="text-xs text-gray-500">{assessment.email}</p>
                      <p className="text-xs text-gray-400 font-mono truncate">{assessment.survey_id}</p>
                    </div>
                  </div>
                </td>

                {/* Type */}
                <td className="px-4 py-3">
                  {assessment.isFoundingPartner ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Founding
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Standard
                    </span>
                  )}
                </td>

                {/* Payment */}
                <td className="px-4 py-3">
                  {assessment.isFoundingPartner ? (
                    <span className="text-xs font-medium text-purple-700">FP Comp</span>
                  ) : assessment.payment_completed ? (
                    <span className="text-xs font-medium text-green-700">
                      Paid - {assessment.payment_method || 'invoice'}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-red-700">Unpaid</span>
                  )}
                </td>

                {/* Progress */}
                <td className="px-4 py-3">
                  <div className="w-48">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${
                        assessment.status === 'Completed' ? 'text-green-700' :
                        assessment.status === 'In Progress' ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {assessment.status}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">{assessment.completionPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          assessment.completionPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${assessment.completionPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{assessment.sectionsCompleted}/{assessment.totalSections} sections</p>
                  </div>
                </td>

                {/* Started */}
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm text-gray-900">
                      {new Date(assessment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500">{assessment.daysInProgress}d ago</p>
                  </div>
                </td>

                {/* Action */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 items-center">
                    <button
                      onClick={() => setSelectedAssessment(assessment)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition w-full"
                    >
                      View Details
                    </button>
                    
                    {assessment.payment_completed && assessment.payment_method === 'invoice' && (
                      <button
                        onClick={() => handleViewInvoice(assessment)}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition w-full flex items-center justify-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Invoice
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAssessments.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No responses found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedAssessment && (
        <DetailedResponseView
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}

      {/* INVOICE MODAL */}
      {showInvoiceModal && invoiceAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Company Invoice</h2>
              <button
                onClick={() => {
                  setShowInvoiceModal(false)
                  setInvoiceAssessment(null)
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Invoice Available</h3>
                <p className="text-gray-600 mb-1">
                  {invoiceAssessment.company_name}
                </p>
                <p className="text-sm text-gray-500">
                  Invoice #{invoiceAssessment.survey_id || invoiceAssessment.id}
                </p>
                {invoiceAssessment.payment_date && (
                  <p className="text-sm text-gray-500">
                    Date: {new Date(invoiceAssessment.payment_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadInvoice}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Invoice PDF
                </button>

                <p className="text-center text-sm text-gray-500">
                  This is the official invoice that was generated during payment.
                </p>
              </div>
            </div>

            <div className="border-t p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setShowInvoiceModal(false)
                  setInvoiceAssessment(null)
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

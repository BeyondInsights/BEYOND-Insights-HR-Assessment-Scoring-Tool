'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { isFoundingPartner } from '@/lib/founding-partners'
import * as XLSX from 'xlsx'
import DetailedResponseView from './detailed-response-view'
import { generateInvoicePDF, downloadInvoicePDF, type InvoiceData } from '@/lib/invoice-generator'

interface AssessmentData {
  id: string
  user_id: string
  email: string
  company_name: string
  survey_id: string
  payment_completed: boolean
  payment_method?: string
  payment_amount?: number
  payment_date?: string
  auth_completed: boolean
  letter_viewed: boolean
  created_at: string
  updated_at: string
  
  // Contact info from firmographics
  firmographics_data?: {
    firstName?: string
    lastName?: string
    companyName?: string
    title?: string
    titleOther?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    poNumber?: string
  }
  
  // Section completion flags
  firmographics_complete?: boolean
  general_benefits_complete?: boolean
  current_support_complete?: boolean
  dimension1_complete?: boolean
  dimension2_complete?: boolean
  dimension3_complete?: boolean
  dimension4_complete?: boolean
  dimension5_complete?: boolean
  dimension6_complete?: boolean
  dimension7_complete?: boolean
  dimension8_complete?: boolean
  dimension9_complete?: boolean
  dimension10_complete?: boolean
  dimension11_complete?: boolean
  dimension12_complete?: boolean
  dimension13_complete?: boolean
  cross_dimensional_complete?: boolean
  'employee-impact-assessment_complete'?: boolean
  
  // Computed fields
  isFoundingPartner?: boolean
  status?: string
  completionPercentage?: number
  daysInProgress?: number
  sectionsCompleted?: number
  totalSections?: number
}

export default function AdminDashboard() {
  const [assessments, setAssessments] = useState<AssessmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('updated_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentData | null>(null)
  
  // Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceAssessment, setInvoiceAssessment] = useState<AssessmentData | null>(null)

  // Fetch all assessment data from Supabase
  useEffect(() => {
    fetchAssessments()
    
    // Set up real-time updates
    const subscription = supabase
      .channel('assessments_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assessments' },
        (payload) => {
          console.log('Real-time update:', payload)
          fetchAssessments()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Process data to add computed fields
      const processedData = (data || []).map(assessment => {
        const isFP = isFoundingPartner(assessment.survey_id || '')
        
        // Count completed sections
        const sectionFlags = [
          'firmographics_complete',
          'general_benefits_complete',
          'current_support_complete',
          'dimension1_complete',
          'dimension2_complete',
          'dimension3_complete',
          'dimension4_complete',
          'dimension5_complete',
          'dimension6_complete',
          'dimension7_complete',
          'dimension8_complete',
          'dimension9_complete',
          'dimension10_complete',
          'dimension11_complete',
          'dimension12_complete',
          'dimension13_complete',
          'cross_dimensional_complete',
          'employee-impact-assessment_complete'
        ]
        
        const sectionsCompleted = sectionFlags.filter(flag => 
          assessment[flag as keyof typeof assessment] === true
        ).length
        
        const totalSections = sectionFlags.length
        const completionPercentage = Math.round((sectionsCompleted / totalSections) * 100)
        
        // Determine status
        let status = 'Not Started'
        if (sectionsCompleted === totalSections) {
          status = 'Completed'
        } else if (sectionsCompleted > 0 || assessment.auth_completed) {
          status = 'In Progress'
        }
        
        // Calculate days in progress
        const startDate = new Date(assessment.created_at)
        const now = new Date()
        const daysInProgress = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

        return {
          ...assessment,
          isFoundingPartner: isFP,
          status,
          completionPercentage,
          daysInProgress,
          sectionsCompleted,
          totalSections
        }
      })

      setAssessments(processedData)
    } catch (error) {
      console.error('Error fetching assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle invoice viewing
  const handleViewInvoice = (assessment: AssessmentData) => {
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
      state: firm.state || 'ST',
      zipCode: firm.zipCode || '00000',
      country: firm.country || 'United States',
      poNumber: firm.poNumber || undefined,
      isFoundingPartner: isFoundingPartner(invoiceAssessment.survey_id || '')
    }

    await downloadInvoicePDF(invoiceData)
  }

  // Calculate metrics
  const metrics = {
    foundingPartnersStarted: assessments.filter(a => a.isFoundingPartner && a.auth_completed).length,
    foundingPartnersCompleted: assessments.filter(a => a.isFoundingPartner && a.status === 'Completed').length,
    standardStarted: assessments.filter(a => !a.isFoundingPartner && a.auth_completed).length,
    standardCompleted: assessments.filter(a => !a.isFoundingPartner && a.status === 'Completed').length,
    totalRevenue: assessments
      .filter(a => !a.isFoundingPartner && a.payment_completed)
      .reduce((sum, a) => sum + (a.payment_amount || 1250), 0),
    averageCompletion: assessments.length > 0 ? Math.round(
      assessments.reduce((sum, a) => sum + (a.completionPercentage || 0), 0) / assessments.length
    ) : 0,
    averageDaysToComplete: assessments.filter(a => a.status === 'Completed').length > 0 ? Math.round(
      assessments
        .filter(a => a.status === 'Completed')
        .reduce((sum, a) => sum + (a.daysInProgress || 0), 0) / 
        assessments.filter(a => a.status === 'Completed').length
    ) : 0
  }

  // Filter and sort data
  const filteredAssessments = assessments
    .filter(a => {
      const matchesSearch = 
        a.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.firmographics_data?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.firmographics_data?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || a.status === filterStatus
      
      const matchesType = 
        filterType === 'all' || 
        (filterType === 'founding' && a.isFoundingPartner) ||
        (filterType === 'standard' && !a.isFoundingPartner)
      
      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
      const aVal = a[sortField as keyof AssessmentData]
      const bVal = b[sortField as keyof AssessmentData]
      
      if (aVal === undefined || bVal === undefined) return 0
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDirection === 'asc' ? comparison : -comparison
    })

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredAssessments.map(a => ({
      'Survey ID': a.survey_id,
      'Company': a.company_name,
      'Contact Name': `${a.firmographics_data?.firstName || ''} ${a.firmographics_data?.lastName || ''}`.trim(),
      'Email': a.email,
      'Type': a.isFoundingPartner ? 'Founding Partner' : 'Standard',
      'Payment Status': a.isFoundingPartner ? 'N/A' : (a.payment_completed ? 'Paid' : 'Unpaid'),
      'Payment Method': a.payment_method || 'N/A',
      'Status': a.status,
      'Completion %': a.completionPercentage,
      'Sections Completed': `${a.sectionsCompleted}/${a.totalSections}`,
      'Days in Progress': a.daysInProgress,
      'Started': new Date(a.created_at).toLocaleDateString(),
      'Last Updated': new Date(a.updated_at).toLocaleDateString()
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Assessments')
    XLSX.writeFile(wb, `assessment-data-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading assessment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/BI_LOGO_FINAL.png" alt="BEYOND Insights" width={180} height={54} />
              <div className="h-8 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('adminAuth')
                window.location.href = '/admin/login'
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Founding Partners Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Founding Partners</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {metrics.foundingPartnersCompleted}/{metrics.foundingPartnersStarted}
                </p>
                <p className="text-xs text-gray-500 mt-1">Completed/Started</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Standard Participants Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Standard</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {metrics.standardCompleted}/{metrics.standardStarted}
                </p>
                <p className="text-xs text-gray-500 mt-1">Completed/Started</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${metrics.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">From paid assessments</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Completion Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Avg. Completion</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.averageCompletion}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.averageDaysToComplete > 0 ? `~${metrics.averageDaysToComplete} days` : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by company, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="founding">Founding Partners</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>

          {/* Results count and export */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredAssessments.length}</span> of <span className="font-semibold">{assessments.length}</span> responses
            </p>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    {/* Company */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assessment.company_name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {assessment.survey_id}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {assessment.firmographics_data?.firstName} {assessment.firmographics_data?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {assessment.email}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assessment.isFoundingPartner ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Founding Partner
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Standard
                        </span>
                      )}
                    </td>

                    {/* Payment */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assessment.isFoundingPartner ? (
                        <span className="text-xs text-gray-500">N/A (FP)</span>
                      ) : assessment.payment_completed ? (
                        <div>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Paid
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {assessment.payment_method || 'Unknown'}
                          </div>
                        </div>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Unpaid
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        assessment.status === 'Completed' 
                          ? 'bg-green-100 text-green-800'
                          : assessment.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assessment.status}
                      </span>
                    </td>

                    {/* Progress */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${assessment.completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {assessment.completionPercentage}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {assessment.sectionsCompleted}/{assessment.totalSections} sections
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        Started: {new Date(assessment.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Updated: {new Date(assessment.updated_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({assessment.daysInProgress} days)
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedAssessment(assessment)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium text-left"
                        >
                          View Details →
                        </button>
                        
                        {assessment.payment_completed && assessment.payment_method === 'invoice' && (
                          <button
                            onClick={() => handleViewInvoice(assessment)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium text-left flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { isFoundingPartner } from '@/lib/founding-partners'
import * as XLSX from 'xlsx'
import DetailedResponseView from './detailed-response-view'

interface AssessmentData {
  id: string
  user_id: string
  email: string
  company_name: string
  survey_id: string
  payment_completed: boolean
  payment_method?: string
  payment_amount?: number
  auth_completed: boolean
  letter_viewed: boolean
  created_at: string
  updated_at: string
  
  // Contact info from firmographics
  firmographics_data?: {
    firstName?: string
    lastName?: string
    companyName?: string
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

  // Calculate metrics
  const metrics = {
    foundingPartnersStarted: assessments.filter(a => a.isFoundingPartner && a.auth_completed).length,
    foundingPartnersCompleted: assessments.filter(a => a.isFoundingPartner && a.status === 'Completed').length,
    standardStarted: assessments.filter(a => !a.isFoundingPartner && a.auth_completed).length,
    standardCompleted: assessments.filter(a => !a.isFoundingPartner && a.status === 'Completed').length,
    
    // ✅ FIXED: Include FP fees in revenue (comp'd by sponsors)
    totalRevenue: 
      // Standard paid surveys
      assessments
        .filter(a => !a.isFoundingPartner && a.payment_completed)
        .reduce((sum, a) => sum + (a.payment_amount || 1250), 0) +
      // FP surveys (fees comp'd but count toward total)
      assessments
        .filter(a => a.isFoundingPartner && a.status === 'Completed')
        .length * 1250,
    
    // Count of paying customers
    paidSurveyCount: assessments.filter(a => !a.isFoundingPartner && a.payment_completed).length,
    
    // Count of FP comp'd fees
    fpCompedCount: assessments.filter(a => a.isFoundingPartner && a.status === 'Completed').length,
    
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
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredAssessments.map(a => ({
      'Company': a.company_name || 'N/A',
      'Contact Name': `${a.firmographics_data?.firstName || ''} ${a.firmographics_data?.lastName || ''}`.trim(),
      'Email': a.email,
      'Survey ID': a.survey_id || 'N/A',
      'User Type': a.isFoundingPartner ? 'Founding Partner' : 'Standard',
      'Status': a.status,
      'Completion': `${a.completionPercentage}%`,
      'Payment Amount': a.isFoundingPartner ? '$0 (FP)' : `$${(a.payment_amount || 1250).toLocaleString()}`,
      'Payment Status': a.isFoundingPartner ? 'N/A (FP)' : a.payment_completed ? 'Paid' : 'Unpaid',
      'Payment Method': a.isFoundingPartner ? 'N/A' : (a.payment_method || 'N/A'),
      'Firmographics': a.firmographics_complete ? '✓' : '✗',
      'General Benefits': a.general_benefits_complete ? '✓' : '✗',
      'Current Support': a.current_support_complete ? '✓' : '✗',
      'Dimension 1': a.dimension1_complete ? '✓' : '✗',
      'Dimension 2': a.dimension2_complete ? '✓' : '✗',
      'Dimension 3': a.dimension3_complete ? '✓' : '✗',
      'Dimension 4': a.dimension4_complete ? '✓' : '✗',
      'Dimension 5': a.dimension5_complete ? '✓' : '✗',
      'Dimension 6': a.dimension6_complete ? '✓' : '✗',
      'Dimension 7': a.dimension7_complete ? '✓' : '✗',
      'Dimension 8': a.dimension8_complete ? '✓' : '✗',
      'Dimension 9': a.dimension9_complete ? '✓' : '✗',
      'Dimension 10': a.dimension10_complete ? '✓' : '✗',
      'Dimension 11': a.dimension11_complete ? '✓' : '✗',
      'Dimension 12': a.dimension12_complete ? '✓' : '✗',
      'Dimension 13': a.dimension13_complete ? '✓' : '✗',
      'Cross-Dimensional': a.cross_dimensional_complete ? '✓' : '✗',
      'Employee Impact': a['employee-impact-assessment_complete'] ? '✓' : '✗',
      'Sections Completed': `${a.sectionsCompleted}/${a.totalSections}`,
      'Days in Progress': a.daysInProgress,
      'Started': new Date(a.created_at).toLocaleDateString(),
      'Last Updated': new Date(a.updated_at).toLocaleDateString()
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Assessment Responses')
    XLSX.writeFile(wb, `assessment-responses-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <img 
              src="/BI_LOGO_FINAL.png" 
              alt="BEYOND Insights" 
              className="h-14 w-auto"
            />
            <div className="h-12 w-px bg-gradient-to-b from-gray-300 to-transparent" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Survey Administration Dashboard</h1>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Best Companies for Working with Cancer Initiative - 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Founding Partners */}
        <div className="relative bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-6 text-white overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">Founding Partners</h3>
              <svg className="w-6 h-6 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold">{metrics.foundingPartnersStarted}</p>
                <p className="text-sm opacity-80">started</p>
              </div>
              <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold">{metrics.foundingPartnersCompleted}</p>
                  <p className="text-sm opacity-80">completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Standard Participants */}
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">Standard Participants</h3>
                <svg className="w-6 h-6 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold">{metrics.standardStarted}</p>
                <p className="text-sm opacity-80">started</p>
              </div>
              <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold">{metrics.standardCompleted}</p>
                  <p className="text-sm opacity-80">completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="relative bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-6 text-white overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">Total Revenue</h3>
                <svg className="w-6 h-6 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-4xl font-bold">${(metrics.totalRevenue / 1000).toFixed(1)}K</p>
              <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                <div className="space-y-1">
                  <p className="text-sm opacity-90">
                    {metrics.paidSurveyCount} paid surveys
                  </p>
                  {metrics.fpCompedCount > 0 && (
                    <p className="text-sm opacity-75">
                      + {metrics.fpCompedCount} FP sponsored
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Completion Stats */}
          <div className="relative bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl shadow-lg p-6 text-white overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">Avg Completion</h3>
                <svg className="w-6 h-6 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-4xl font-bold">{metrics.averageCompletion}%</p>
              <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                <p className="text-sm opacity-90">
                  Avg {metrics.averageDaysToComplete} days to complete
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </label>
              <input
                type="text"
                placeholder="Company, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              >
                <option value="all">All Types</option>
                <option value="founding">Founding Partners</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>

          {/* Results count and export */}
          <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-300">
            <p className="text-sm text-gray-700 font-medium">
              Showing <span className="font-bold text-blue-600">{filteredAssessments.length}</span> of <span className="font-bold text-gray-900">{assessments.length}</span> responses
            </p>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-150 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full ">
              <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-indigo-200">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Company / Contact
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredAssessments.map((assessment, idx) => (
                  <tr key={assessment.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-150 group">
                    {/* Company & Contact */}
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${
                          assessment.isFoundingPartner 
                            ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                            : 'bg-gradient-to-br from-blue-500 to-blue-700'
                        }`}>
                          {(assessment.company_name || 'N/A').substring(0, 2).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate">
                            {assessment.company_name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {assessment.firmographics_data?.firstName} {assessment.firmographics_data?.lastName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {assessment.email}
                          </div>
                          <div className="text-xs text-gray-400 truncate font-mono">
                            {assessment.survey_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-2 py-2 text-center">
                      {assessment.isFoundingPartner ? (
                        <span className="inline-flex items-center justify-center w-10 h-6 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full">
                          <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-10 h-6 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full">
                          <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </td>

                    {/* Payment */}
                    <td className="px-2 py-2 text-center">
                      {assessment.isFoundingPartner ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 border border-purple-200 rounded text-xs font-semibold text-purple-700">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Sponsor
                        </span>
                      ) : assessment.payment_completed ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 border border-green-200 rounded text-xs font-semibold text-green-700">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 border border-red-200 rounded text-xs font-semibold text-red-700">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Unpaid
                        </span>
                      )}
                    </td>

                    {/* Progress */}
                    <td className="px-2 py-2">
                      <div className="space-y-0.5 max-w-[200px]">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${
                            assessment.status === 'Completed' ? 'text-green-600' :
                            assessment.status === 'In Progress' ? 'text-blue-600' :
                            'text-gray-500'
                          }`}>
                            {assessment.status}
                          </span>
                          <span className="text-xs font-semibold text-gray-700">
                            {assessment.completionPercentage}%
                          </span>
                        </div>
                        <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                              assessment.completionPercentage === 100 
                                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                : 'bg-gradient-to-r from-blue-400 to-blue-600'
                            }`}
                            style={{ width: `${assessment.completionPercentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {assessment.sectionsCompleted}/{assessment.totalSections} sections
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-2 py-2 text-center">
                      <div className="text-xs font-medium text-gray-900">
                        {new Date(assessment.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {assessment.daysInProgress}d ago
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => setSelectedAssessment(assessment)}
                        className="inline-flex items-center justify-center px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-150"
                      >
                        View
                      </button>
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

      {/* Detailed View Modal */}
      {selectedAssessment && (
        <DetailedResponseView
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}
    </div>
  )
}

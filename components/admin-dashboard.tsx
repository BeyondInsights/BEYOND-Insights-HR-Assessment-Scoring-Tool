'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
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
  is_multi_country?: boolean
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

// ============================================
// AGGREGATE STATS TYPES
// ============================================
interface AggregateStats {
  totalAssessments: number
  foundingPartners: number
  regularUsers: number
  completedSurveys: number
  inProgress: number
  notStarted: number
  paymentCompleted: number
  paymentPending: number
  multiCountry: number
  singleCountry: number
  avgProgress: number
  sectionCompletion: {
    firmographics: number
    generalBenefits: number
    currentSupport: number
    dimensions: number[]
    crossDimensional: number
    employeeImpact: number
  }
  industryBreakdown: Record<string, number>
  companySizeBreakdown: Record<string, number>
  revenueBreakdown: Record<string, number>
  levelBreakdown: Record<string, number>
  countryBreakdown: Record<string, number>
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function parseJsonField(data: any, field: string): string {
  if (!data) return 'Not provided'
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return parsed[field] || 'Not provided'
  } catch {
    return 'Not provided'
  }
}

function calculateAggregates(assessments: ProcessedAssessment[]): AggregateStats {
  const stats: AggregateStats = {
    totalAssessments: assessments.length,
    foundingPartners: 0,
    regularUsers: 0,
    completedSurveys: 0,
    inProgress: 0,
    notStarted: 0,
    paymentCompleted: 0,
    paymentPending: 0,
    multiCountry: 0,
    singleCountry: 0,
    avgProgress: 0,
    sectionCompletion: {
      firmographics: 0,
      generalBenefits: 0,
      currentSupport: 0,
      dimensions: Array(13).fill(0),
      crossDimensional: 0,
      employeeImpact: 0,
    },
    industryBreakdown: {},
    companySizeBreakdown: {},
    revenueBreakdown: {},
    levelBreakdown: {},
    countryBreakdown: {},
  }

  let totalProgress = 0

  assessments.forEach((a) => {
    // User type counts
    if (a.isFoundingPartner) {
      stats.foundingPartners++
    } else {
      stats.regularUsers++
    }

    // Status counts
    if (a.status === 'Completed') {
      stats.completedSurveys++
    } else if (a.status === 'In Progress') {
      stats.inProgress++
    } else {
      stats.notStarted++
    }

    // Payment counts
    if (a.payment_completed || a.isFoundingPartner) {
      stats.paymentCompleted++
    } else {
      stats.paymentPending++
    }

    // Multi-country
    if (a.is_multi_country) {
      stats.multiCountry++
    } else {
      stats.singleCountry++
    }

    // Progress
    totalProgress += a.completionPercentage || 0

    // Section completion
    if (a.firmographics_complete) stats.sectionCompletion.firmographics++
    if (a.general_benefits_complete) stats.sectionCompletion.generalBenefits++
    if (a.current_support_complete) stats.sectionCompletion.currentSupport++
    if (a.dimension1_complete) stats.sectionCompletion.dimensions[0]++
    if (a.dimension2_complete) stats.sectionCompletion.dimensions[1]++
    if (a.dimension3_complete) stats.sectionCompletion.dimensions[2]++
    if (a.dimension4_complete) stats.sectionCompletion.dimensions[3]++
    if (a.dimension5_complete) stats.sectionCompletion.dimensions[4]++
    if (a.dimension6_complete) stats.sectionCompletion.dimensions[5]++
    if (a.dimension7_complete) stats.sectionCompletion.dimensions[6]++
    if (a.dimension8_complete) stats.sectionCompletion.dimensions[7]++
    if (a.dimension9_complete) stats.sectionCompletion.dimensions[8]++
    if (a.dimension10_complete) stats.sectionCompletion.dimensions[9]++
    if (a.dimension11_complete) stats.sectionCompletion.dimensions[10]++
    if (a.dimension12_complete) stats.sectionCompletion.dimensions[11]++
    if (a.dimension13_complete) stats.sectionCompletion.dimensions[12]++
    if (a.cross_dimensional_complete) stats.sectionCompletion.crossDimensional++
    if (a.employee_impact_complete) stats.sectionCompletion.employeeImpact++

    // Firmographics breakdowns
    if (a.firmographics_data) {
      const industry = parseJsonField(a.firmographics_data, 'c2')
      if (industry !== 'Not provided') {
        stats.industryBreakdown[industry] = (stats.industryBreakdown[industry] || 0) + 1
      }

      const size = parseJsonField(a.firmographics_data, 's8')
      if (size !== 'Not provided') {
        stats.companySizeBreakdown[size] = (stats.companySizeBreakdown[size] || 0) + 1
      }

      const revenue = parseJsonField(a.firmographics_data, 'c5')
      if (revenue !== 'Not provided') {
        stats.revenueBreakdown[revenue] = (stats.revenueBreakdown[revenue] || 0) + 1
      }

      const level = parseJsonField(a.firmographics_data, 's5')
      if (level !== 'Not provided') {
        stats.levelBreakdown[level] = (stats.levelBreakdown[level] || 0) + 1
      }

      const country = parseJsonField(a.firmographics_data, 's9')
      if (country !== 'Not provided') {
        stats.countryBreakdown[country] = (stats.countryBreakdown[country] || 0) + 1
      }
    }
  })

  stats.avgProgress = assessments.length > 0 ? Math.round(totalProgress / assessments.length) : 0

  return stats
}

// ============================================
// SUB-COMPONENTS FOR ANALYTICS VIEW
// ============================================
function ProgressBar({ label, value, total, color = 'orange' }: { 
  label: string
  value: number
  total: number
  color?: string 
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0
  
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700 truncate mr-2">{label}</span>
        <span className="text-gray-500 whitespace-nowrap">{value}/{total} ({percentage}%)</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color === 'orange' ? '#F37021' : color === 'green' ? '#22c55e' : '#3b82f6'
          }}
        />
      </div>
    </div>
  )
}

function DataTable({ 
  title, 
  data, 
  total 
}: { 
  title: string
  data: Record<string, number>
  total: number
}) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1])
  
  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-bold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {sorted.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-700 truncate max-w-[180px]" title={key}>{key}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{value}</span>
              <span className="text-xs text-gray-500 w-10 text-right">
                {Math.round((value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsStatCard({ 
  label, 
  value, 
  subValue, 
  color = 'blue',
}: { 
  label: string
  value: string | number
  subValue?: string
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  }

  return (
    <div className={`rounded-xl border-2 p-4 ${colorClasses[color]}`}>
      <span className="text-xs font-medium opacity-80 uppercase tracking-wide">{label}</span>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subValue && <p className="text-xs opacity-70 mt-0.5">{subValue}</p>}
    </div>
  )
}

// ============================================
// ANALYTICS VIEW COMPONENT
// ============================================
function AnalyticsView({ assessments }: { assessments: ProcessedAssessment[] }) {
  const stats = calculateAggregates(assessments)
  
  const dimensionNames = [
    'Medical Leave & Flexibility',
    'Insurance & Financial Protection',
    'Manager Preparedness',
    'Navigation & Expert Resources',
    'Workplace Accommodations',
    'Culture & Psychological Safety',
    'Career Continuity',
    'Work Continuation & Resumption',
    'Executive Commitment',
    'Caregiver & Family Support',
    'Prevention & Wellness',
    'Continuous Improvement',
    'Communication & Awareness',
  ]

  const handleExportCSV = () => {
    const lines: string[] = []
    
    lines.push('Metric,Value')
    lines.push(`Total Assessments,${stats.totalAssessments}`)
    lines.push(`Founding Partners,${stats.foundingPartners}`)
    lines.push(`Regular Users,${stats.regularUsers}`)
    lines.push(`Completed Surveys,${stats.completedSurveys}`)
    lines.push(`In Progress,${stats.inProgress}`)
    lines.push(`Not Started,${stats.notStarted}`)
    lines.push(`Payment Completed,${stats.paymentCompleted}`)
    lines.push(`Payment Pending,${stats.paymentPending}`)
    lines.push(`Multi-Country,${stats.multiCountry}`)
    lines.push(`Average Progress,${stats.avgProgress}%`)
    lines.push('')
    lines.push('Section,Completed,Percentage')
    lines.push(`Firmographics,${stats.sectionCompletion.firmographics},${Math.round((stats.sectionCompletion.firmographics / stats.totalAssessments) * 100)}%`)
    lines.push(`General Benefits,${stats.sectionCompletion.generalBenefits},${Math.round((stats.sectionCompletion.generalBenefits / stats.totalAssessments) * 100)}%`)
    lines.push(`Current Support,${stats.sectionCompletion.currentSupport},${Math.round((stats.sectionCompletion.currentSupport / stats.totalAssessments) * 100)}%`)
    
    stats.sectionCompletion.dimensions.forEach((count, idx) => {
      lines.push(`Dimension ${idx + 1}: ${dimensionNames[idx]},${count},${Math.round((count / stats.totalAssessments) * 100)}%`)
    })
    
    lines.push(`Cross-Dimensional,${stats.sectionCompletion.crossDimensional},${Math.round((stats.sectionCompletion.crossDimensional / stats.totalAssessments) * 100)}%`)
    lines.push(`Employee Impact,${stats.sectionCompletion.employeeImpact},${Math.round((stats.sectionCompletion.employeeImpact / stats.totalAssessments) * 100)}%`)
    
    lines.push('')
    lines.push('Industry Breakdown')
    lines.push('Industry,Count,Percentage')
    Object.entries(stats.industryBreakdown).sort((a, b) => b[1] - a[1]).forEach(([industry, count]) => {
      lines.push(`"${industry}",${count},${Math.round((count / stats.totalAssessments) * 100)}%`)
    })
    
    lines.push('')
    lines.push('Company Size Breakdown')
    lines.push('Size,Count,Percentage')
    Object.entries(stats.companySizeBreakdown).sort((a, b) => b[1] - a[1]).forEach(([size, count]) => {
      lines.push(`"${size}",${count},${Math.round((count / stats.totalAssessments) * 100)}%`)
    })
    
    lines.push('')
    lines.push('Revenue Breakdown')
    lines.push('Revenue,Count,Percentage')
    Object.entries(stats.revenueBreakdown).sort((a, b) => b[1] - a[1]).forEach(([revenue, count]) => {
      lines.push(`"${revenue}",${count},${Math.round((count / stats.totalAssessments) * 100)}%`)
    })

    const content = lines.join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `survey-analytics-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleExportJSON = () => {
    const content = JSON.stringify(stats, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `survey-analytics-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <AnalyticsStatCard
          label="Total Assessments"
          value={stats.totalAssessments}
          color="blue"
        />
        <AnalyticsStatCard
          label="Founding Partners"
          value={stats.foundingPartners}
          subValue={`${Math.round((stats.foundingPartners / stats.totalAssessments) * 100)}% of total`}
          color="purple"
        />
        <AnalyticsStatCard
          label="Regular Users"
          value={stats.regularUsers}
          color="teal"
        />
        <AnalyticsStatCard
          label="Completed"
          value={stats.completedSurveys}
          subValue={`${Math.round((stats.completedSurveys / stats.totalAssessments) * 100)}% rate`}
          color="green"
        />
        <AnalyticsStatCard
          label="In Progress"
          value={stats.inProgress}
          color="orange"
        />
        <AnalyticsStatCard
          label="Not Started"
          value={stats.notStarted}
          color="red"
        />
      </div>

      {/* Payment & Org Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AnalyticsStatCard
          label="Payment Completed"
          value={stats.paymentCompleted}
          subValue={`$${(stats.paymentCompleted * 1250).toLocaleString()}`}
          color="green"
        />
        <AnalyticsStatCard
          label="Payment Pending"
          value={stats.paymentPending}
          color="orange"
        />
        <AnalyticsStatCard
          label="Multi-Country"
          value={stats.multiCountry}
          color="blue"
        />
        <AnalyticsStatCard
          label="Single Country"
          value={stats.singleCountry}
          color="teal"
        />
      </div>

      {/* Section Completion Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Section Completion Rates</h3>
        
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Core Sections</h4>
            <ProgressBar 
              label="Firmographics" 
              value={stats.sectionCompletion.firmographics} 
              total={stats.totalAssessments}
            />
            <ProgressBar 
              label="General Benefits" 
              value={stats.sectionCompletion.generalBenefits} 
              total={stats.totalAssessments}
            />
            <ProgressBar 
              label="Current Support" 
              value={stats.sectionCompletion.currentSupport} 
              total={stats.totalAssessments}
            />
            <ProgressBar 
              label="Cross-Dimensional" 
              value={stats.sectionCompletion.crossDimensional} 
              total={stats.totalAssessments}
            />
            <ProgressBar 
              label="Employee Impact" 
              value={stats.sectionCompletion.employeeImpact} 
              total={stats.totalAssessments}
            />
          </div>
          
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">13 Dimensions</h4>
            <div className="max-h-56 overflow-y-auto pr-2">
              {dimensionNames.map((name, idx) => (
                <ProgressBar 
                  key={idx}
                  label={`D${idx + 1}: ${name}`} 
                  value={stats.sectionCompletion.dimensions[idx]} 
                  total={stats.totalAssessments}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Tables */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DataTable 
          title="Industry Breakdown" 
          data={stats.industryBreakdown} 
          total={stats.totalAssessments}
        />
        <DataTable 
          title="Company Size" 
          data={stats.companySizeBreakdown} 
          total={stats.totalAssessments}
        />
        <DataTable 
          title="Annual Revenue" 
          data={stats.revenueBreakdown} 
          total={stats.totalAssessments}
        />
        <DataTable 
          title="Respondent Level" 
          data={stats.levelBreakdown} 
          total={stats.totalAssessments}
        />
        <DataTable 
          title="HQ Country" 
          data={stats.countryBreakdown} 
          total={stats.totalAssessments}
        />
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-bold text-gray-900 mb-3">Export Analytics Data</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Summary (CSV)
          </button>
          <button 
            onClick={handleExportJSON}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Full Data (JSON)
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================
export default function AdminDashboard() {
  const [assessments, setAssessments] = useState<ProcessedAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedAssessment, setSelectedAssessment] = useState<ProcessedAssessment | null>(null)
  
  // TAB STATE - "responses" or "analytics"
  const [activeTab, setActiveTab] = useState<'responses' | 'analytics'>('responses')
  
  // Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceAssessment, setInvoiceAssessment] = useState<ProcessedAssessment | null>(null)

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const processed = (data || []).map((assessment: Assessment) => {
        const isFP = isFoundingPartner(assessment.survey_id)
        
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
      state: firm.state || 'ST',
      zipCode: firm.zipCode || '00000',
      country: firm.country || 'United States',
      poNumber: firm.poNumber || undefined,
      isFoundingPartner: isFoundingPartner(invoiceAssessment.survey_id || '')
    }

    await downloadInvoicePDF(invoiceData)
  }

  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch =
      !searchTerm ||
      a.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.survey_id?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && a.status === 'Completed') ||
      (statusFilter === 'in-progress' && a.status === 'In Progress') ||
      (statusFilter === 'not-started' && a.status === 'Not Started')

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'founding' && a.isFoundingPartner) ||
      (typeFilter === 'standard' && !a.isFoundingPartner)

    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    foundingStarted: assessments.filter((a) => a.isFoundingPartner).length,
    foundingCompleted: assessments.filter((a) => a.isFoundingPartner && a.completionPercentage >= 100).length,
    standardStarted: assessments.filter((a) => !a.isFoundingPartner).length,
    standardCompleted: assessments.filter((a) => !a.isFoundingPartner && a.completionPercentage >= 100).length,
    totalRevenue: assessments.reduce((sum, a) => {
      if (a.isFoundingPartner) return sum + 1250
      if (a.payment_completed) return sum + 1250
      return sum
    }, 0),
    paidSurveys: assessments.filter((a) => !a.isFoundingPartner && a.payment_completed).length,
    fpSponsored: assessments.filter((a) => a.isFoundingPartner).length,
    avgCompletion: Math.round(
      assessments.reduce((sum, a) => sum + a.completionPercentage, 0) / (assessments.length || 1)
    ),
    avgDays: Math.round(
      assessments.filter((a) => a.completionPercentage >= 100)
        .reduce((sum, a) => sum + a.daysInProgress, 0) /
        (assessments.filter((a) => a.completionPercentage >= 100).length || 1)
    ),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 text-sm">Loading assessment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <img src="/BI_LOGO_FINAL.png" alt="Beyond Insights" className="h-10" />
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Survey Administration Dashboard</h1>
              <p className="text-sm text-gray-600">Best Companies for Working with Cancer Initiative - 2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Founding Partners</p>
              <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.foundingStarted}</p>
            <p className="text-sm opacity-90">{stats.foundingCompleted} completed</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Standard Participants</p>
              <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.standardStarted}</p>
            <p className="text-sm opacity-90">{stats.standardCompleted} completed</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Total Revenue</p>
              <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-3xl font-bold mb-1">${(stats.totalRevenue / 1000).toFixed(1)}K</p>
            <p className="text-sm opacity-90">{stats.paidSurveys} paid • {stats.fpSponsored} FP sponsored</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Avg Completion</p>
              <svg className="w-5 h-5 opacity-75" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.avgCompletion}%</p>
            <p className="text-sm opacity-90">Avg {stats.avgDays} days to complete</p>
          </div>
        </div>

        {/* TAB TOGGLE */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('responses')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'responses'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Responses
                </span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* CONDITIONAL CONTENT BASED ON TAB */}
        {activeTab === 'responses' ? (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SEARCH</label>
                  <input
                    type="text"
                    placeholder="Company, name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">STATUS</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="not-started">Not Started</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">TYPE</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="founding">Founding Partners</option>
                    <option value="standard">Standard Participants</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredAssessments.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{assessments.length}</span> responses
                </p>
                <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">
                  Export to Excel
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Started</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAssessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-gray-50 transition">
                      {/* Company */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                            assessment.isFoundingPartner ? 'bg-purple-600' : 'bg-blue-600'
                          }`}>
                            {(assessment.company_name || 'NA').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{assessment.company_name || 'N/A'}</p>
                            <p className="text-xs text-gray-600 truncate">{assessment.firmographics_data?.firstName} {assessment.firmographics_data?.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{assessment.email}</p>
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
          </>
        ) : (
          /* ANALYTICS TAB CONTENT */
          <AnalyticsView assessments={assessments} />
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

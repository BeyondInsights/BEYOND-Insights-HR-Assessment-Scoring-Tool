'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { generateCompleteReport } from '@/lib/report-generator'

interface Assessment {
  survey_id: string
  company_name: string
  email: string
  created_at: string
  dimension1_data?: any
  dimension2_data?: any
  dimension3_data?: any
  dimension4_data?: any
  dimension5_data?: any
  dimension6_data?: any
  dimension7_data?: any
  dimension8_data?: any
  dimension9_data?: any
  dimension10_data?: any
  dimension11_data?: any
  dimension12_data?: any
  dimension13_data?: any
}

export default function AdminReportsPage() {
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([])
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [report, setReport] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'fp' | 'standard'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Load all assessments on mount
  useEffect(() => {
    loadAssessments()
  }, [])

  // Apply filters when data or filter changes
  useEffect(() => {
    applyFilters()
  }, [allAssessments, filter, searchTerm])

  const loadAssessments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .not('company_name', 'is', null)  // Only get assessments with company names
        .order('created_at', { ascending: false })

      if (error) throw error
      setAllAssessments(data || [])
    } catch (error) {
      console.error('Error loading assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allAssessments]

    // Filter by type
    if (filter === 'fp') {
      filtered = filtered.filter(a => a.survey_id?.startsWith('FP-HR-'))
    } else if (filter === 'standard') {
      filtered = filtered.filter(a => !a.survey_id?.startsWith('FP-HR-'))
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(a => 
        a.company_name?.toLowerCase().includes(term) ||
        a.survey_id?.toLowerCase().includes(term) ||
        a.email?.toLowerCase().includes(term)
      )
    }

    setFilteredAssessments(filtered)
  }

  const handleSelectCompany = async (assessment: Assessment) => {
    setGenerating(true)
    setSelectedAssessment(assessment)
    
    try {
      const generatedReport = generateCompleteReport(assessment)
      setReport(generatedReport)
    } catch (error) {
      console.error('Error generating report:', error)
      setReport('Error generating report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const downloadReport = (format: 'md' | 'txt') => {
    if (!selectedAssessment || !report) return
    
    const blob = new Blob([report], { type: format === 'md' ? 'text/markdown' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedAssessment.company_name.replace(/[^a-z0-9]/gi, '_')}_Dimension_Report.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAllReports = async () => {
    if (filteredAssessments.length === 0) return
    
    setGenerating(true)
    
    try {
      for (const assessment of filteredAssessments) {
        const generatedReport = generateCompleteReport(assessment)
        const blob = new Blob([generatedReport], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${assessment.company_name.replace(/[^a-z0-9]/gi, '_')}_Dimension_Report.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('Error generating all reports:', error)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = () => {
    if (!report) return
    navigator.clipboard.writeText(report)
    alert('Report copied to clipboard!')
  }

  // Count assessments by type
  const fpCount = allAssessments.filter(a => a.survey_id?.startsWith('FP-HR-')).length
  const standardCount = allAssessments.filter(a => !a.survey_id?.startsWith('FP-HR-')).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading assessments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dimension Reports</h1>
              <p className="text-gray-600 mt-2">
                Generate comprehensive dimension reports for all survey respondents
              </p>
            </div>
            <button
              onClick={downloadAllReports}
              disabled={generating || filteredAssessments.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {generating ? 'Generating...' : `📥 Download All ${filteredAssessments.length} Reports`}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Total Assessments</div>
              <div className="text-3xl font-bold text-gray-900">{allAssessments.length}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-4">
              <div className="text-sm text-purple-700 mb-1 font-medium">Founding Partners</div>
              <div className="text-3xl font-bold text-purple-900">{fpCount}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-4">
              <div className="text-sm text-blue-700 mb-1 font-medium">Standard Respondents</div>
              <div className="text-3xl font-bold text-blue-900">{standardCount}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  Companies ({filteredAssessments.length})
                </h2>
                
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setFilter('all')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All ({allAssessments.length})
                  </button>
                  <button
                    onClick={() => setFilter('fp')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'fp'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    FP ({fpCount})
                  </button>
                  <button
                    onClick={() => setFilter('standard')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'standard'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Standard ({standardCount})
                  </button>
                </div>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredAssessments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No assessments found</p>
                  </div>
                ) : (
                  filteredAssessments.map((assessment) => {
                    const isFP = assessment.survey_id?.startsWith('FP-HR-')
                    return (
                      <button
                        key={assessment.survey_id}
                        onClick={() => handleSelectCompany(assessment)}
                        className={`w-full text-left p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                          selectedAssessment?.survey_id === assessment.survey_id
                            ? 'bg-blue-100 border-l-4 border-l-blue-600'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {assessment.company_name}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {assessment.survey_id}
                            </div>
                          </div>
                          {isFP && (
                            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                              FP
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Report Preview */}
          <div className="lg:col-span-2">
            {!selectedAssessment ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Company</h3>
                <p className="text-gray-600">Choose a company from the list to generate their dimension report</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Header with actions */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedAssessment.company_name}
                        {selectedAssessment.survey_id?.startsWith('FP-HR-') && (
                          <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded">
                            Founding Partner
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Survey ID: {selectedAssessment.survey_id}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        disabled={generating}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        title="Copy to clipboard"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => downloadReport('md')}
                        disabled={generating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        ⬇️ .md
                      </button>
                      <button
                        onClick={() => downloadReport('txt')}
                        disabled={generating}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        ⬇️ .txt
                      </button>
                    </div>
                  </div>
                </div>

                {/* Report content */}
                <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {generating ? (
                    <div className="text-center py-12">
                      <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="text-gray-600">Generating report...</p>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                      {report}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

const sectionData = [
  { name: 'Company & Contact Information', route: '/survey/firmographics', key: 'firmographics' },
  { name: 'General Employee Benefits', route: '/survey/general-benefits', key: 'general' },
  { name: 'Current Support for Serious Medical Conditions', route: '/survey/current-support', key: 'current' }
]

const dimensionData = [
  { num: 1, name: 'Medical Leave & Flexibility', route: '/survey/dimensions/1' },
  { num: 2, name: 'Insurance & Financial Protection', route: '/survey/dimensions/2' },
  { num: 3, name: 'Manager Preparedness & Capability', route: '/survey/dimensions/3' },
  { num: 4, name: 'Navigation & Expert Resources', route: '/survey/dimensions/4' },
  { num: 5, name: 'Workplace Accommodations', route: '/survey/dimensions/5' },
  { num: 6, name: 'Culture & Psychological Safety', route: '/survey/dimensions/6' },
  { num: 7, name: 'Career Continuity & Advancement', route: '/survey/dimensions/7' },
  { num: 8, name: 'Work Continuation & Resumption', route: '/survey/dimensions/8' },
  { num: 9, name: 'Executive Commitment & Resources', route: '/survey/dimensions/9' },
  { num: 10, name: 'Caregiver & Family Support', route: '/survey/dimensions/10' },
  { num: 11, name: 'Prevention, Wellness & Legal Compliance', route: '/survey/dimensions/11' },
  { num: 12, name: 'Continuous Improvement & Outcomes', route: '/survey/dimensions/12' },
  { num: 13, name: 'Communication & Awareness', route: '/survey/dimensions/13' }
]

const additionalSections = [
  { name: 'Cross-Dimensional Assessment', route: '/survey/cross-dimensional-assessment', key: 'cross' },
  { name: 'Employee Impact Assessment', route: '/survey/employee-impact-assessment', key: 'impact' }
]

export default function Dashboard() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [appId, setAppId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [sectionProgress, setSectionProgress] = useState({
    firmographics: 0,
    general: 0,
    current: 0
  })
  const [dimensionProgress, setDimensionProgress] = useState<number[]>(Array(13).fill(0))
  const [crossProgress, setCrossProgress] = useState(0)
  const [impactProgress, setImpactProgress] = useState(0)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          console.log('No session found, redirecting to login')
          router.push('/')
          return
        }

        // Session exists - get user data
        const userEmail = session.user.email || localStorage.getItem('login_email') || ''
        setEmail(userEmail)

        // Get assessment data from Supabase
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (assessmentError) {
          console.error('Error fetching assessment:', assessmentError)
          // If no assessment found, might be new user - stay on dashboard
          setIsLoading(false)
          return
        }

        if (assessment) {
          setCompanyName(assessment.company_name || '')
          setAppId(assessment.app_id || '')
          setPaymentCompleted(assessment.payment_completed || false)

          // Calculate progress from database data
          // Firmographics
          const firmProg = assessment.firmographics_complete ? 100 : 
            (assessment.firmographics_data ? calculateProgress(assessment.firmographics_data) : 0)
          
          // General benefits
          const genProg = assessment.general_benefits_complete ? 100 :
            (assessment.general_benefits_data ? calculateProgress(assessment.general_benefits_data) : 0)
          
          // Current support
          const curProg = assessment.current_support_complete ? 100 :
            (assessment.current_support_data ? calculateProgress(assessment.current_support_data) : 0)

          setSectionProgress({
            firmographics: firmProg,
            general: genProg,
            current: curProg
          })

          // Dimensions
          const dimProgress = []
          for (let i = 1; i <= 13; i++) {
            const complete = assessment[`dimension${i}_complete`]
            const data = assessment[`dimension${i}_data`]
            dimProgress.push(complete ? 100 : (data ? calculateProgress(data) : 0))
          }
          setDimensionProgress(dimProgress)

          // Cross-dimensional
          const crossProg = assessment.cross_dimensional_complete ? 100 :
            (assessment.cross_dimensional_data ? calculateProgress(assessment.cross_dimensional_data) : 0)
          setCrossProgress(crossProg)

          // Employee impact
          const impactProg = assessment.employee_impact_complete ? 100 :
            (assessment.employee_impact_data ? calculateProgress(assessment.employee_impact_data) : 0)
          setImpactProgress(impactProg)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/')
      }
    }

    checkAuth()
  }, [router])

  const calculateProgress = (data: any): number => {
    if (!data || typeof data !== 'object') return 0
    const keys = Object.keys(data)
    if (keys.length === 0) return 0
    const filled = keys.filter(k => {
      const val = data[k]
      return val !== null && val !== undefined && val !== ''
    }).length
    return Math.round((filled / keys.length) * 100)
  }

  const overallProgress = () => {
    const stage1 = (sectionProgress.firmographics + sectionProgress.general + sectionProgress.current) / 3
    const stage2 = dimensionProgress.reduce((a, b) => a + b, 0) / 13
    const stage3 = (crossProgress + impactProgress) / 2
    return Math.round((stage1 + stage2 + stage3) / 3)
  }

  const handleSectionClick = (route: string) => {
    router.push(route)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-purple-600">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Dashboard</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{email}</span>
            {companyName && (
              <>
                <span className="hidden sm:inline">•</span>
                <span>{companyName}</span>
              </>
            )}
            {appId && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  App ID: {appId}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Overall Progress</h2>
              <p className="text-purple-100 text-sm">Complete all sections to finish your assessment</p>
            </div>
            <div className="w-32 h-32">
              <CircularProgressbar
                value={overallProgress()}
                text={`${overallProgress()}%`}
                styles={buildStyles({
                  textSize: '24px',
                  pathColor: '#fff',
                  textColor: '#fff',
                  trailColor: 'rgba(255,255,255,0.2)'
                })}
              />
            </div>
          </div>
        </div>

        {/* Stage 1: Core Assessment Sections */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
              Stage 1
            </span>
            Core Assessment Sections
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {sectionData.map((section) => (
              <div
                key={section.key}
                onClick={() => handleSectionClick(section.route)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-500 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex-1">{section.name}</h3>
                  <div className="w-16 h-16 ml-4">
                    <CircularProgressbar
                      value={sectionProgress[section.key as keyof typeof sectionProgress]}
                      text={`${sectionProgress[section.key as keyof typeof sectionProgress]}%`}
                      styles={buildStyles({
                        textSize: '20px',
                        pathColor: '#9333ea',
                        textColor: '#9333ea',
                        trailColor: '#e9d5ff'
                      })}
                    />
                  </div>
                </div>
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium text-sm">
                  {sectionProgress[section.key as keyof typeof sectionProgress] === 100 ? 'Review' : 'Continue'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stage 2: 13 Dimensions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              Stage 2
            </span>
            13 Dimensions of Support
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dimensionData.map((dim, idx) => (
              <div
                key={dim.num}
                onClick={() => handleSectionClick(dim.route)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-blue-600 font-bold text-sm mb-1">Dimension {dim.num}</div>
                    <h3 className="font-semibold text-gray-900 text-sm">{dim.name}</h3>
                  </div>
                  <div className="w-14 h-14 ml-4">
                    <CircularProgressbar
                      value={dimensionProgress[idx]}
                      text={`${dimensionProgress[idx]}%`}
                      styles={buildStyles({
                        textSize: '22px',
                        pathColor: '#2563eb',
                        textColor: '#2563eb',
                        trailColor: '#dbeafe'
                      })}
                    />
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                  {dimensionProgress[idx] === 100 ? 'Review' : 'Continue'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stage 3: Additional Assessments */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
              Stage 3
            </span>
            Additional Assessments
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {additionalSections.map((section) => {
              const progress = section.key === 'cross' ? crossProgress : impactProgress
              return (
                <div
                  key={section.key}
                  onClick={() => handleSectionClick(section.route)}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-orange-500 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex-1">{section.name}</h3>
                    <div className="w-16 h-16 ml-4">
                      <CircularProgressbar
                        value={progress}
                        text={`${progress}%`}
                        styles={buildStyles({
                          textSize: '20px',
                          pathColor: '#ea580c',
                          textColor: '#ea580c',
                          trailColor: '#fed7aa'
                        })}
                      />
                    </div>
                  </div>
                  <button className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition font-medium text-sm">
                    {progress === 100 ? 'Review' : 'Continue'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

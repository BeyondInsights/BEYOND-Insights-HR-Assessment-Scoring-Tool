'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [currentStep, setCurrentStep] = useState('login')
  const [authData, setAuthData] = useState({
    email: '',
    accessCode: '',
    hasProgram: '',
    programName: ''
  })
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [sectionProgress, setSectionProgress] = useState({
    firmographics: 0,
    general: 0,
    current: 0
  })
  const [firmographicsData, setFirmographicsData] = useState({})
  
  // Calculate overall progress
  const overallProgress = Math.round(
    (sectionProgress.firmographics + sectionProgress.general + sectionProgress.current) / 3
  )
  const [readLetter, setReadLetter] = useState(false)

  // SVG Icons as components
  const icons = {
    building: (
      <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    briefcase: (
      <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    users: (
      <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    clock: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    shield: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    chart: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    navigation: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    home: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    ),
    heart: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    star: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    refresh: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    family: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    scale: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    trending: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    megaphone: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    )
  }

  // Header Component with Progress Bar
  const Header = ({ showProgress = false }) => (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <img 
            src="/best-companies-2026-logo.png" 
            alt="2026 Best Companies for Working with Cancer" 
            className="h-16 w-auto"
          />
          <div className="flex items-center space-x-6">
            {showProgress && (
              <div className="w-48">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Progress</span>
                  <span className="text-xs font-bold text-orange-500">{overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="text-sm text-gray-600 text-right">
              Support for Employees Managing Cancer<br/>
              or Other Serious Health Conditions Assessment
            </div>
            <img 
              src="/cancer-careers-logo.png" 
              alt="Cancer and Careers" 
              className="h-16 w-auto"
            />
          </div>
        </div>
      </div>
    </header>
  )

  // Powered By Footer Component
  const PoweredBy = () => (
    <div className="mt-12 pt-8 border-t text-center">
      <p className="text-xs text-gray-500 mb-2">Assessment Powered by</p>
      <img 
        src="/BI_LOGO_FINAL.png" 
        alt="BEYOND Insights" 
        className="mx-auto opacity-70 hover:opacity-100 transition-opacity"
        style={{ width: '120px', height: '40px' }}
      />
    </div>
  )

  // Letter Page Component
  const LetterPage = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          {/* Logo Section - Just the 2026 Badge */}
          <div className="flex justify-center mb-8">
            <img 
              src="/best-companies-2026-logo.png" 
              alt="2026 Best Companies for Working with Cancer" 
              className="h-48 w-auto"
            />
          </div>

          <div className="prose prose-lg max-w-none">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
              Welcome to the Cancer and Careers Workplace Support Assessment
            </h1>

            <p className="mb-6">
              On behalf of Cancer and Careers, thank you for taking this important step toward evaluating and strengthening your organization's support for employees managing cancer and other serious health conditions.
            </p>

            <p className="mb-6">
              As a leader committed to workplace excellence, your participation in this assessment demonstrates your organization's dedication to creating a supportive environment for all employees facing health challenges.
            </p>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-6 my-6">
              <h3 className="font-bold mb-3">About This Assessment:</h3>
              <p className="mb-3">This comprehensive tool evaluates your organization across 13 key dimensions of workplace support. Your responses will:</p>
              <ul className="list-disc ml-6 space-y-2 text-sm">
                <li>Generate a customized scorecard showing your current strengths and opportunities</li>
                <li>Determine eligibility for the Best Companies for Working with Cancer Index</li>
                <li>Provide actionable recommendations for enhancing your programs</li>
                <li>Connect you with resources to advance your support initiatives</li>
              </ul>
            </div>

            <div className="my-6">
              <h3 className="font-bold mb-3">Creating a Realistic Picture:</h3>
              <p className="mb-4">
                We recognize that all organizations face real constraints - budget limitations, competing priorities, and varying regulations. No organization excels in every dimension, and that's expected. What matters is understanding your current state and identifying strategic opportunities for improvement.
              </p>
              <p className="mb-4">
                Throughout the assessment, please provide honest responses about what your organization currently offers, not aspirational goals. This candid approach ensures meaningful benchmarks and actionable insights.
              </p>
            </div>

            <div className="my-6">
              <h3 className="font-bold mb-3">Flexible Completion Options:</h3>
              <ul className="list-disc ml-6 space-y-2">
                <li>Save your progress at any point and return later</li>
                <li>Complete sections in any order that works for you</li>
                <li>View your completion status across all dimensions</li>
                <li>Collaborate with colleagues by sharing access as needed</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                The assessment typically takes 15-20 minutes total, but can be completed across multiple sessions.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-6">
              <h3 className="font-bold mb-2">Your Privacy:</h3>
              <p className="text-sm">
                All responses are confidential and analyzed by BEYOND Insights, our independent research partner. Individual organizational data will never be shared publicly without explicit permission.
              </p>
            </div>

            <p className="mb-4 text-center font-medium">
              Thank you for your commitment to supporting employees through their cancer journey and beyond.
            </p>

            <p className="mb-8 text-center">
              <strong>With gratitude,</strong>
            </p>

            <div className="text-center mb-8">
              <img 
                src="/rebecca-signature.png" 
                alt="Rebecca Nellis" 
                className="mx-auto mb-2 h-16"
                onError={(e) => {
                  e.target.style.display = 'none';
                  document.getElementById('text-signature').style.display = 'block';
                }}
              />
              <div id="text-signature" style={{display: 'none'}}>
                <p className="font-script text-2xl text-gray-700 mb-2">Rebecca Nellis</p>
              </div>
              <p className="font-semibold text-gray-900">Rebecca Nellis</p>
              <p className="text-sm text-gray-600">Executive Director<br />Cancer and Careers</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={readLetter}
                onChange={(e) => setReadLetter(e.target.checked)}
                className="mt-1 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500 border-gray-300"
              />
              <span className="text-gray-700 group-hover:text-gray-900">
                I have read the information above and am ready to begin the assessment
              </span>
            </label>

            <div className={`transition-all duration-300 ${readLetter ? 'mt-6 opacity-100' : 'mt-0 opacity-0 pointer-events-none'}`}>
              <button
                onClick={() => setCurrentStep('authorization')}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all"
              >
                Start Assessment &rarr;
              </button>
            </div>
          </div>
          
          <PoweredBy />
        </div>
      </main>
    </div>
  )

  // Dashboard Page Component with Enhanced Visuals
  const DashboardPage = () => {
    // Load saved progress from localStorage on mount
    const savedFirmographics = JSON.parse(localStorage.getItem('firmographics_data') || '{}')
    const savedGeneral = JSON.parse(localStorage.getItem('general_data') || '{}')
    const savedCurrent = JSON.parse(localStorage.getItem('current_data') || '{}')
    
    // Calculate progress for each section
    const calculateFirmographicsProgress = () => {
      let completed = 0
      if (savedFirmographics.companyName) completed++
      if (savedFirmographics.f1) completed++
      if (savedFirmographics.f2) completed++
      if (savedFirmographics.f3?.length > 0) completed++
      if (savedFirmographics.f4) completed++
      if (savedFirmographics.f5) completed++
      if (savedFirmographics.f6) completed++
      if (savedFirmographics.f7) completed++
      return Math.round((completed / 8) * 100)
    }

    const sections = [
      { 
        id: 'firmographics', 
        title: 'Firmographics', 
        questions: 8, 
        completion: calculateFirmographicsProgress(), 
        icon: icons.building 
      },
      { 
        id: 'general', 
        title: 'General Employee Benefits', 
        questions: 3, 
        completion: 0, 
        icon: icons.briefcase 
      },
      { 
        id: 'current', 
        title: 'Current Support for Employees with Cancer', 
        questions: 10, 
        completion: 0, 
        icon: icons.users 
      }
    ]

    const dimensions = [
      { title: 'Medical Leave & Flexibility', completion: 0, icon: icons.clock },
      { title: 'Insurance & Financial Protection', completion: 0, icon: icons.shield },
      { title: 'Manager Preparedness & Capability', completion: 0, icon: icons.users },
      { title: 'Navigation & Expert Resources', completion: 0, icon: icons.navigation },
      { title: 'Workplace Accommodations', completion: 0, icon: icons.home },
      { title: 'Culture & Psychological Safety', completion: 0, icon: icons.heart },
      { title: 'Career Continuity & Advancement', completion: 0, icon: icons.chart },
      { title: 'Return-to-Work Excellence', completion: 0, icon: icons.refresh },
      { title: 'Executive Commitment & Resources', completion: 0, icon: icons.star },
      { title: 'Caregiver & Family Support', completion: 0, icon: icons.family },
      { title: 'Prevention, Wellness & Legal Compliance', completion: 0, icon: icons.scale },
      { title: 'Continuous Improvement & Outcomes', completion: 0, icon: icons.trending },
      { title: 'Communication & Awareness', completion: 0, icon: icons.megaphone }
    ]
    
    const handleSectionClick = (sectionId) => {
      if (sectionId === 'firmographics') {
        setCurrentStep('firmographics')
      } else if (sectionId === 'general') {
        setCurrentStep('general')
      } else if (sectionId === 'current') {
        setCurrentStep('current')
      }
      // Add other section handlers as needed
    }

    // Update section progress in state
    useEffect(() => {
      const firmProgress = calculateFirmographicsProgress()
      setSectionProgress(prev => ({ ...prev, firmographics: firmProgress }))
    }, [])

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header showProgress={true} />
        
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8 flex items-center space-x-4">
            <img 
              src="/best-companies-2026-logo.png" 
              alt="2026 Best Companies for Working with Cancer" 
              className="h-24 w-auto"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assessment Dashboard</h1>
              <p className="text-gray-600">Welcome back, {authData.email}</p>
              {savedFirmographics.companyName && (
                <p className="text-lg font-semibold text-gray-800">{savedFirmographics.companyName}</p>
              )}
            </div>
          </div>

          {/* Instructions Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">How to Complete Your Assessment</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong className="text-gray-900">Flexible completion:</strong> Complete sections in any order that works best for you. Click on any section below to begin or continue where you left off.
              </p>
              <p>
                <strong className="text-gray-900">Save and return anytime:</strong> Your progress is automatically saved after each question. You can pause at any point and return later - you'll always come back to this dashboard to choose which section to work on next.
              </p>
              <p>
                <strong className="text-gray-900">Track your progress:</strong> Each section shows your completion percentage. Once you've finished all sections, you'll be able to access your complete assessment results and recommendations.
              </p>
            </div>
          </div>
          
          {/* Main Sections */}
          <div className="grid gap-3 mb-6">
            {sections.map((section) => (
              <div 
                key={section.id} 
                onClick={() => handleSectionClick(section.id)}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex">
                  <div className={`w-1.5 ${section.completion === 100 ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="transform group-hover:scale-110 transition-transform">
                          {section.icon}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-500 transition-colors">
                            {section.title}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {section.completion === 100 ? 'Completed' : `${section.questions} questions`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-gray-200"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 28}`}
                              strokeDashoffset={`${2 * Math.PI * 28 * (1 - section.completion / 100)}`}
                              className={`${section.completion === 100 ? 'text-green-500' : 'text-orange-500'} transition-all duration-500`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {section.completion === 100 ? (
                              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-sm font-bold text-gray-900">{section.completion}%</span>
                            )}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 13 Dimensions */}
          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">13 Dimensions of Support</h2>
            <div className="grid gap-3">
              {dimensions.map((dim, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex">
                    <div className="w-1.5 bg-teal-500"></div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="transform group-hover:scale-110 transition-transform text-teal-600">
                            {dim.icon}
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                              {dim.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              Available after initial sections
                            </p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 transform -rotate-90">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-gray-200"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 28}`}
                                strokeDashoffset={`${2 * Math.PI * 28 * (1 - dim.completion / 100)}`}
                                className="text-teal-500 transition-all duration-500"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-700">{dim.completion}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <PoweredBy />
        </main>
      </div>
    )
  }

  // Authorization Page Component - FIXED
  const AuthorizationPage = () => {
    const [isAuthorized, setIsAuthorized] = useState('')
    const [authorizationTypes, setAuthorizationTypes] = useState({
      directResponsibility: false,
      accessToDocs: false,
      designatedByLeadership: false,
      worksWithBenefits: false,
      decisionMaking: false,
      other: false
    })
    const [otherText, setOtherText] = useState('')

    const handleAuthTypeToggle = (type) => {
      setAuthorizationTypes(prev => ({
        ...prev,
        [type]: !prev[type]
      }))
    }

    const handleContinue = () => {
      if (isAuthorized === 'no') {
        alert('Thank you for your interest. Only authorized representatives can complete this assessment.')
        return
      }
      
      setCurrentStep('dashboard')
    }

    const hasSelectedAuthType = Object.values(authorizationTypes).some(value => value === true)
    const canContinue = isAuthorized === 'yes' && hasSelectedAuthType

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">AUTHORIZATION CONFIRMATION</h1>
              <div className="h-1 w-32 bg-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Welcome, {authData.email}</p>
            </div>
            
            <div className="space-y-8">
              {/* AU1 Question */}
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <span className="text-lg font-bold text-gray-900">AU1.</span>
                  <p className="text-base text-gray-700 leading-relaxed">
                    I confirm that I am authorized to provide information about my organization's employee benefits, programs, and policies on behalf of my employer. 
                    <span className="block text-sm font-semibold text-gray-600 mt-1">(Select ONE)</span>
                  </p>
                </div>
                
                <div className="space-y-3 ml-8">
                  <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                    <input 
                      type="radio"
                      name="authorized"
                      value="yes"
                      checked={isAuthorized === 'yes'}
                      onChange={(e) => setIsAuthorized(e.target.value)}
                      className="mt-0.5 w-5 h-5 text-orange-500 focus:ring-2 focus:ring-orange-500"
                    />
                    <span className={`${isAuthorized === 'yes' ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                      Yes, I am authorized to complete this survey on behalf of my organization
                    </span>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all">
                    <input 
                      type="radio"
                      name="authorized"
                      value="no"
                      checked={isAuthorized === 'no'}
                      onChange={(e) => setIsAuthorized(e.target.value)}
                      className="mt-0.5 w-5 h-5 text-orange-500 focus:ring-2 focus:ring-orange-500"
                    />
                    <span className={`${isAuthorized === 'no' ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                      No, I should not be completing this survey [THANK AND END]
                    </span>
                  </label>
                </div>
              </div>

              {/* AU2 Question - Only shows if Yes selected */}
              {isAuthorized === 'yes' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-start space-x-2">
                    <span className="text-lg font-bold text-gray-900">AU2.</span>
                    <p className="text-base text-gray-700 leading-relaxed">
                      Which of the following best describes your authorization to complete this survey?
                      <span className="block text-sm font-semibold text-gray-600 mt-1">(Select ALL that apply)</span>
                    </p>
                  </div>
                  
                  <div className="space-y-3 ml-8">
                    <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <input 
                        type="checkbox"
                        checked={authorizationTypes.directResponsibility}
                        onChange={() => handleAuthTypeToggle('directResponsibility')}
                        className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${authorizationTypes.directResponsibility ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                        I have direct responsibility for benefits design and administration
                      </span>
                    </label>
                    
                    <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <input 
                        type="checkbox"
                        checked={authorizationTypes.accessToDocs}
                        onChange={() => handleAuthTypeToggle('accessToDocs')}
                        className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${authorizationTypes.accessToDocs ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                        I have access to all necessary benefits documentation and policies
                      </span>
                    </label>
                    
                    <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <input 
                        type="checkbox"
                        checked={authorizationTypes.designatedByLeadership}
                        onChange={() => handleAuthTypeToggle('designatedByLeadership')}
                        className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${authorizationTypes.designatedByLeadership ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                        I have been designated by leadership to complete this survey
                      </span>
                    </label>
                    
                    <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <input 
                        type="checkbox"
                        checked={authorizationTypes.worksWithBenefits}
                        onChange={() => handleAuthTypeToggle('worksWithBenefits')}
                        className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${authorizationTypes.worksWithBenefits ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                        I work closely with benefits policies and have comprehensive knowledge of our programs
                      </span>
                    </label>
                    
                    <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <input 
                        type="checkbox"
                        checked={authorizationTypes.decisionMaking}
                        onChange={() => handleAuthTypeToggle('decisionMaking')}
                        className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${authorizationTypes.decisionMaking ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                        I have decision-making authority for employee benefits
                      </span>
                    </label>
                    
                    <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <input 
                        type="checkbox"
                        checked={authorizationTypes.other}
                        onChange={() => handleAuthTypeToggle('other')}
                        className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${authorizationTypes.other ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                        Other (specify):
                      </span>
                    </label>
                    
                    {authorizationTypes.other && (
                      <input 
                        type="text"
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        className="ml-8 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 animate-fadeIn"
                        placeholder="Please specify..."
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Error message for No selection */}
              {isAuthorized === 'no' && (
                <div className="animate-fadeIn bg-red-50 border-2 border-red-200 rounded-lg p-6">
                  <p className="text-base text-red-700 font-medium">
                    Thank you for your interest. This assessment is designed for authorized representatives who have comprehensive knowledge of their organization's benefits and policies.
                  </p>
                </div>
              )}

              {/* Continue Button */}
              <div className="pt-6">
                <button
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 transform hover:-translate-y-0.5 disabled:transform-none transition-all shadow-lg"
                >
                  {isAuthorized === 'no' ? 'Exit Survey' : 'Continue to Dashboard &rarr;'}
                </button>
              </div>
            </div>
            
            <PoweredBy />
          </div>
        </main>
      </div>
    )
  }

  // Add CSS for animations
  if (typeof document !== 'undefined' && !document.querySelector('#custom-styles')) {
    const style = document.createElement('style')
    style.id = 'custom-styles'
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
      }
    `
    document.head.appendChild(style)
  }

  // Login Page Component
  const LoginPage = () => {
    const [localEmail, setLocalEmail] = useState('')
    const [localAccessCode, setLocalAccessCode] = useState('')
    
    const handleLogin = (e) => {
      e.preventDefault()
      // Store email and access code for later use
      setAuthData(prev => ({ ...prev, email: localEmail, accessCode: localAccessCode }))
      setLoginData({ email: localEmail, accessCode: localAccessCode })
      setCurrentStep('letter')
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-2xl p-8">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <img 
                  src="/best-companies-2026-logo.png" 
                  alt="2026 Best Companies for Working with Cancer" 
                  className="h-32 w-auto"
                />
              </div>
              
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                Welcome to the Assessment
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Enter your credentials to begin
              </p>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="your@company.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Code
                    <span className="text-xs font-normal text-gray-500 ml-1">(provided by Cancer and Careers)</span>
                  </label>
                  <input
                    type="text"
                    value={localAccessCode}
                    onChange={(e) => setLocalAccessCode(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter access code"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all"
                >
                  Begin Assessment
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  By proceeding, you confirm you are authorized to provide information about your organization's benefits
                </p>
              </div>
            </div>
            
            <PoweredBy />
          </div>
        </div>
      </div>
    )
  }

  // Firmographics Page Component
  const FirmographicsPage = () => {
    const [answers, setAnswers] = useState({
      companyName: firmographicsData.companyName || '',
      f1: firmographicsData.f1 || '',
      f1_other: firmographicsData.f1_other || '',
      f2: firmographicsData.f2 || '',
      f2_other: firmographicsData.f2_other || '',
      f3: firmographicsData.f3 || [],
      f4: firmographicsData.f4 || '',
      f5: firmographicsData.f5 || '',
      f6: firmographicsData.f6 || '',
      f6_other_latin: firmographicsData.f6_other_latin || '',
      f6_other_europe: firmographicsData.f6_other_europe || '',
      f6_other_middle_east: firmographicsData.f6_other_middle_east || '',
      f6_other_africa: firmographicsData.f6_other_africa || '',
      f6_other_asia: firmographicsData.f6_other_asia || '',
      f7: firmographicsData.f7 || ''
    })

    const [errors, setErrors] = useState({})

    // Country options for F6
    const countryOptions = {
      'North America': [
        'United States',
        'Canada',
        'Mexico'
      ],
      'Latin America & Caribbean': [
        'Brazil',
        'Argentina',
        'Chile',
        'Colombia',
        'Other Latin American / Caribbean country (specify)'
      ],
      'Europe': [
        'United Kingdom',
        'Germany',
        'France',
        'Netherlands',
        'Switzerland',
        'Italy',
        'Spain',
        'Sweden',
        'Other European country (specify)'
      ],
      'Middle East & Africa': [
        'United Arab Emirates',
        'Saudi Arabia',
        'Israel',
        'South Africa',
        'Nigeria',
        'Kenya',
        'Egypt',
        'Other Middle Eastern country (specify)',
        'Other African country (specify)'
      ],
      'Asia Pacific': [
        'China',
        'Japan',
        'India',
        'Singapore',
        'Australia',
        'South Korea',
        'Other Asia Pacific country (specify)'
      ]
    }

    // Calculate section progress
    const calculateProgress = (data) => {
      const totalFields = 8 // company name + F1-F7
      let completed = 0
      if (data.companyName) completed++
      if (data.f1) completed++
      if (data.f2) completed++
      if (data.f3 && data.f3.length > 0) completed++
      if (data.f4) completed++
      if (data.f5) completed++
      if (data.f6) completed++
      if (data.f7) completed++
      return Math.round((completed / totalFields) * 100)
    }

    const handleRadioChange = (question, value) => {
      setAnswers(prev => ({ ...prev, [question]: value }))
      setErrors(prev => ({ ...prev, [question]: '' }))
    }

    const handleCheckboxChange = (question, value) => {
      setAnswers(prev => {
        if (value === 'None of these') {
          return { ...prev, [question]: prev[question].includes(value) ? [] : [value] }
        } else {
          const filtered = prev[question].filter(v => v !== 'None of these')
          return {
            ...prev,
            [question]: prev[question].includes(value) 
              ? filtered.filter(v => v !== value)
              : [...filtered, value]
          }
        }
      })
      setErrors(prev => ({ ...prev, [question]: '' }))
    }

    const handleTextChange = (field, value) => {
      setAnswers(prev => ({ ...prev, [field]: value }))
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const handleNext = () => {
      const newErrors = {}
      
      if (!answers.companyName.trim()) {
        newErrors.companyName = 'Company name is required'
      }
      if (!answers.f1) {
        newErrors.f1 = 'Please select your job function'
      }
      if (answers.f1 === 'Some other function (specify):' && !answers.f1_other.trim()) {
        newErrors.f1_other = 'Please specify your job function'
      }
      if (!answers.f2) {
        newErrors.f2 = 'Please select your level'
      }
      if (answers.f2 === 'Other level (specify):' && !answers.f2_other.trim()) {
        newErrors.f2_other = 'Please specify your level'
      }
      if (answers.f3.length === 0) {
        newErrors.f3 = 'Please select at least one area of responsibility'
      }
      if (!answers.f4) {
        newErrors.f4 = 'Please select your level of influence'
      }
      if (!answers.f5) {
        newErrors.f5 = 'Please select number of employees'
      }
      if (!answers.f6) {
        newErrors.f6 = 'Please select headquarters location'
      }
      if (!answers.f7) {
        newErrors.f7 = 'Please select number of countries'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        const firstErrorField = Object.keys(newErrors)[0]
        document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      // Check for disqualifying answers - REMOVED for this phase
      // Just save data and update progress
      setFirmographicsData(answers)
      localStorage.setItem('firmographics_data', JSON.stringify(answers))
      const progress = calculateProgress(answers)
      setSectionProgress(prev => ({ ...prev, firmographics: progress }))
      setCurrentStep('dashboard')
    }

    const f2Options = [
      'C-level executive (CHRO, CPO)',
      'Executive/Senior Vice President',
      'Vice President',
      'Director',
      'Senior Manager',
      'Manager',
      'HR Generalist',
      'Benefits Specialist / Coordinator',
      'HR Specialist / Coordinator',
      'HR Assistant / Administrative',
      'Other level (specify):'
    ]

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header showProgress={true} />
        
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <button 
              onClick={() => setCurrentStep('dashboard')}
              className="text-orange-500 hover:text-orange-600 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Firmographics</h1>
            <div className="h-1 w-24 bg-orange-500 mb-8"></div>

            <div className="space-y-10">
              {/* Company Name */}
              <div className="space-y-4" id="companyName">
                <div className="flex items-start space-x-2">
                  <span className="text-lg font-bold text-red-500">*</span>
                  <p className="text-base text-gray-700 leading-relaxed">
                    Organization Name
                  </p>
                </div>
                <div className="ml-8">
                  <input 
                    type="text"
                    value={answers.companyName}
                    onChange={(e) => handleTextChange('companyName', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.companyName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your organization's name"
                  />
                  {errors.companyName && (
                    <p className="mt-2 text-sm text-red-600">{errors.companyName}</p>
                  )}
                </div>
              </div>

              {/* F1 - Job Function */}
              <div className="space-y-4" id="f1">
                <div className="flex items-start space-x-2">
                  <span className="text-lg font-bold text-gray-900">F1.</span>
                  <p className="text-base text-gray-700 leading-relaxed">
                    Which best describes your primary job function?
                    <span className="block text-sm font-semibold text-gray-600 mt-1">(Select ONE)</span>
                  </p>
                </div>
                
                <div className="space-y-3 ml-8">
                  {[
                    'Human Resources',
                    'Benefits / Compensation',
                    'People & Culture',
                    'Talent Management',
                    'Some other function (specify):'
                  ].map((option) => (
                    <label key={option} className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <input 
                        type="radio"
                        name="f1"
                        value={option}
                        checked={answers.f1 === option}
                        onChange={(e) => handleRadioChange('f1', e.target.value)}
                        className="mt-0.5 w-5 h-5 text-orange-500 focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${answers.f1 === option ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                        {option}
                      </span>
                    </label>
                  ))}
                  {answers.f1 === 'Some other function (specify):' && (
                    <input 
                      type="text"
                      value={answers.f1_other}
                      onChange={(e) => handleTextChange('f1_other', e.target.value)}
                      className={`ml-8 w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 animate-fadeIn ${
                        errors.f1_other ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Please specify..."
                    />
                  )}
                  {errors.f1 && (
                    <p className="mt-2 text-sm text-red-600">{errors.f1}</p>
                  )}
                </div>
              </div>

              {/* F2 - Level */}
              <div className="space-y-4" id="f2">
                <div className="flex items-start space-x-2">
                  <span className="text-lg font-bold text-gray-900">F2.</span>
                  <p className="text-base text-gray-700 leading-relaxed">
                    What is your current level within the organization?
                    <span className="block text-sm font-semibold text-gray-600 mt-1">(Select ONE)</span>
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-3 ml-8">
                  {f2Options.map((option) => (
                    <label key={option} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <input 
                        type="radio"
                        name="f2"
                        value={option}
                        checked={answers.f2 === option}
                        onChange={(e) => handleRadioChange('f2', e.target.value)}
                        className="w-5 h-5 text-orange-500 focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${answers.f2 === option ? 'text-orange-600 font-semibold' : 'text-gray-700'} text-sm`}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
                {answers.f2 === 'Other level (specify):' && (
                  <input 
                    type="text"
                    value={answers.f2_other}
                    onChange={(e) => handleTextChange('f2_other', e.target.value)}
                    className={`ml-8 w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 animate-fadeIn ${
                      errors.f2_other ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Please specify your level..."
                  />
                )}
                {errors.f2 && (
                  <p className="mt-2 text-sm text-red-600 ml-8">{errors.f2}</p>
                )}
              </div>

              {/* F3 - Areas of Responsibility */}
              <div className="space-y-4" id="f3">
                <div className="flex items-start space-x-2">
                  <span className="text-lg font-bold text-gray-900">F3.</span>
                  <p className="text-base text-gray-700 leading-relaxed">
                    Which areas fall under your responsibility or influence?
                    <span className="block text-sm font-semibold text-gray-600 mt-1">(Select ALL that apply)</span>
                  </p>
                </div>
                
                <div className="space-y-3 ml-8">
                  {[
                    'Employee benefits selection / updates',
                    'Leave policies (FMLA, STD, LTD)',
                    'Employee health & wellness programs',
                    'Workplace accommodations and adjustments',
                    'Manager training & development',
                    'Employee assistance programs (EAP)',
                    'Workers\' compensation',
                    'Organizational culture initiatives',
                    'Wellness initiatives',
                    'Flexible work arrangements',
                    'None of these'
                  ].map((option) => (
                    <label key={option} className={`flex items-start space-x-3 cursor-pointer p-4 rounded-lg border ${
                      option === 'None of these' ? 'border-red-200 hover:border-red-300 hover:bg-red-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    } transition-all`}>
                      <input 
                        type="checkbox"
                        checked={answers.f3.includes(option)}
                        onChange={() => handleCheckboxChange('f3', option)}
                        className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${answers.f3.includes(option) ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                        {option}
                      </span>
                    </label>
                  ))}
                  {errors.f3 && (
                    <p className="mt-2 text-sm text-red-600">{errors.f3}</p>
                  )}
                </div>
              </div>

              {/* F4 - Influence Level */}
              <div className="space-y-4" id="f4">
                <div className="flex items-start space-x-2">
                  <span className="text-lg font-bold text-gray-900">F4.</span>
                  <p className="text-base text-gray-700 leading-relaxed">
                    How much influence do you have on employee benefits decisions?
                    <span className="block text-sm font-semibold text-gray-600 mt-1">(Select ONE)</span>
                  </p>
                </div>
                
                <div className="space-y-3 ml-8">
                  {[
                    'Primary decision maker',
                    'Part of decision-making team',
                    'Make recommendations that are usually adopted',
                    'Provide input but limited influence',
                    'No influence'
                  ].map((option) => (
                    <label key={option} className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <input 
                        type="radio"
                        name="f4"
                        value={option}
                        checked={answers.f4 === option}
                        onChange={(e) => handleRadioChange('f4', e.target.value)}
                        className="mt-0.5 w-5 h-5 text-orange-500 focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${answers.f4 === option ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                        {option}
                      </span>
                    </label>
                  ))}
                  {errors.f4 && (
                    <p className="mt-2 text-sm text-red-600">{errors.f4}</p>
                  )}
                </div>
              </div>

              {/* F5 - Company Size */}
              <div className="space-y-4" id="f5">
                <div className="flex items-start space-x-2">
                  <span className="text-lg font-bold text-gray-900">F5.</span>
                  <p className="text-base text-gray-700 leading-relaxed">
                    Approximately how many total employees work at your organization (all locations)?
                    <span className="block text-sm font-semibold text-gray-600 mt-1">(Select ONE)</span>
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-3 ml-8">
                  {[
                    'Fewer than 100',
                    '100-249',
                    '250-499',
                    '500-999',
                    '1,000-2,499',
                    '2,500-4,999',
                    '5,000-9,999',
                    '10,000-24,999',
                    '25,000-49,999',
                    '50,000+'
                  ].map((option) => (
                    <label key={option} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <input 
                        type="radio"
                        name="f5"
                        value={option}
                        checked={answers.f5 === option}
                        onChange={(e) => handleRadioChange('f5', e.target.value)}
                        className="w-5 h-5 text-orange-500 focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${answers.f5 === option ? 'text-orange-600 font-semibold' : 'text-gray-700'} text-sm`}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.f5 && (
                  <p className="mt-2 text-sm text-red-600 ml-8">{errors.f5}</p>
                )}
              </div>

              {/* F6 - Headquarters Location */}
              <div className="space-y-4" id="f6">
                <div className="flex items-start space-x-2">
                  <span className="text-lg font-bold text-gray-900">F6.</span>
                  <p className="text-base text-gray-700 leading-relaxed">
                    In which country is your organization's headquarters located?
                    <span className="block text-sm font-semibold text-gray-600 mt-1">(Select ONE)</span>
                  </p>
                </div>
                
                <div className="space-y-6 ml-8">
                  {Object.entries(countryOptions).map(([region, countries]) => (
                    <div key={region}>
                      <h4 className="font-semibold text-gray-800 mb-3">{region}</h4>
                      <div className="grid md:grid-cols-2 gap-2 ml-4">
                        {countries.map((country) => (
                          <label key={country} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                            <input 
                              type="radio"
                              name="f6"
                              value={country}
                              checked={answers.f6 === country}
                              onChange={(e) => handleRadioChange('f6', e.target.value)}
                              className="w-4 h-4 text-orange-500 focus:ring-2 focus:ring-orange-500"
                            />
                            <span className={`${answers.f6 === country ? 'text-orange-600 font-semibold' : 'text-gray-700'} text-sm`}>
                              {country}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Other country text inputs */}
                  {answers.f6 === 'Other Latin American / Caribbean country (specify)' && (
                    <input 
                      type="text"
                      value={answers.f6_other_latin}
                      onChange={(e) => handleTextChange('f6_other_latin', e.target.value)}
                      className="ml-4 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 animate-fadeIn"
                      placeholder="Please specify country..."
                    />
                  )}
                  {answers.f6 === 'Other European country (specify)' && (
                    <input 
                      type="text"
                      value={answers.f6_other_europe}
                      onChange={(e) => handleTextChange('f6_other_europe', e.target.value)}
                      className="ml-4 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 animate-fadeIn"
                      placeholder="Please specify country..."
                    />
                  )}
                  {answers.f6 === 'Other Middle Eastern country (specify)' && (
                    <input 
                      type="text"
                      value={answers.f6_other_middle_east}
                      onChange={(e) => handleTextChange('f6_other_middle_east', e.target.value)}
                      className="ml-4 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 animate-fadeIn"
                      placeholder="Please specify country..."
                    />
                  )}
                  {answers.f6 === 'Other African country (specify)' && (
                    <input 
                      type="text"
                      value={answers.f6_other_africa}
                      onChange={(e) => handleTextChange('f6_other_africa', e.target.value)}
                      className="ml-4 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 animate-fadeIn"
                      placeholder="Please specify country..."
                    />
                  )}
                  {answers.f6 === 'Other Asia Pacific country (specify)' && (
                    <input 
                      type="text"
                      value={answers.f6_other_asia}
                      onChange={(e) => handleTextChange('f6_other_asia', e.target.value)}
                      className="ml-4 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 animate-fadeIn"
                      placeholder="Please specify country..."
                    />
                  )}
                  {errors.f6 && (
                    <p className="mt-2 text-sm text-red-600">{errors.f6}</p>
                  )}
                </div>
              </div>

              {/* F7 - Number of Countries */}
              <div className="space-y-4" id="f7">
                <div className="flex items-start space-x-2">
                  <span className="text-lg font-bold text-gray-900">F7.</span>
                  <p className="text-base text-gray-700 leading-relaxed">
                    Besides your headquarters location, in how many other countries does your organization have offices or operations?
                    <span className="block text-sm font-semibold text-gray-600 mt-1">(Select ONE)</span>
                    <span className="block text-sm italic text-gray-500 mt-1">Your best estimate is fine</span>
                  </p>
                </div>
                
                <div className="space-y-3 ml-8">
                  {[
                    'No other countries - headquarters only',
                    '1 to 2 other countries',
                    '3 to 4 other countries',
                    '5 to 9 other countries',
                    '10 to 19 other countries',
                    '20 to 49 other countries',
                    '50 or more countries'
                  ].map((option) => (
                    <label key={option} className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <input 
                        type="radio"
                        name="f7"
                        value={option}
                        checked={answers.f7 === option}
                        onChange={(e) => handleRadioChange('f7', e.target.value)}
                        className="mt-0.5 w-5 h-5 text-orange-500 focus:ring-2 focus:ring-orange-500"
                      />
                      <span className={`${answers.f7 === option ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                        {option}
                      </span>
                    </label>
                  ))}
                  {errors.f7 && (
                    <p className="mt-2 text-sm text-red-600">{errors.f7}</p>
                  )}
                </div>
              </div>

              {/* Multi-country Guidelines - Show if they have operations in other countries */}
              {answers.f7 && answers.f7 !== 'No other countries - headquarters only' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 animate-fadeIn">
                  <h3 className="font-bold text-lg text-blue-900 mb-3">GUIDELINES FOR MULTI-COUNTRY ORGANIZATIONS:</h3>
                  <p className="text-sm text-blue-800 mb-4">
                    We recognize the complexity of reporting on programs that vary across countries. To keep this survey manageable while capturing meaningful differences, we've structured questions in two ways:
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-blue-900">Why we distinguish between US and other markets for select questions:</h4>
                      <p className="text-sm text-blue-800">Healthcare and leave policies function fundamentally differently across countries. In the US, employers typically provide primary healthcare coverage and paid leave, while other countries often have robust national healthcare and statutory leave requirements.</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-900">Most questions ask for your global approach</h4>
                      <p className="text-sm text-blue-800">These cover universal areas like manager training, navigation services, or communication methods that can be standardized across markets.</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-900">Select questions distinguish between US and other markets</h4>
                      <p className="text-sm text-blue-800">These appear only where healthcare systems or legal requirements create meaningful differences:</p>
                      <ul className="list-disc ml-5 text-sm text-blue-800 mt-2">
                        <li>Medical leave policies (FMLA vs. statutory sick leave)</li>
                        <li>Disability insurance (employer-provided vs. government)</li>
                        <li>Health insurance continuation during leave</li>
                        <li>Job protection beyond legal requirements</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-900">How to respond when programs vary:</h4>
                      <ul className="list-disc ml-5 text-sm text-blue-800 space-y-1">
                        <li>Report on benefits available to 80%+ of employees in each category</li>
                        <li>If you have a global standard policy, report that standard</li>
                        <li>For "beyond legal requirements" questions, calculate based on what you provide above the minimum in each market</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8">
                <button
                  onClick={() => setCurrentStep('dashboard')}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-all"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all"
                >
                  Save & Continue &rarr;
                </button>
              </div>
            </div>
          </div>

          <PoweredBy />
        </main>
      </div>
    )
  }

  // General Benefits Page Component
  const GeneralBenefitsPage = () => {
    const [answers, setAnswers] = useState({
      gb1: [],
      gb2: '',
      gb3: []
    })
    const [errors, setErrors] = useState({})
    const [showGb2, setShowGb2] = useState(false)

    // Save data to localStorage whenever answers change
    useEffect(() => {
      localStorage.setItem('general_data', JSON.stringify(answers))
    }, [answers])

    // Check if user is in US only (no other countries)
    const isUSOnly = firmographicsData.f6 === 'United States' && 
                     firmographicsData.f7 === 'No other countries - headquarters only'

    // Auto-fill GB2 if US only
    useEffect(() => {
      if (isUSOnly) {
        setAnswers(prev => ({ ...prev, gb2: '0' }))
      } else {
        setShowGb2(true)
      }
    }, [isUSOnly])

    const standardBenefits = [
      'Health insurance (Employer-provided or supplemental to national coverage)',
      'Dental insurance (Employer-provided or supplemental to national coverage)',
      'Vision insurance (Employer-provided or supplemental to national coverage)',
      'Life insurance',
      'Short-term disability (or temporary incapacity benefits)',
      'Long-term disability (or income protection)',
      'Paid time off (PTO/vacation)',
      'Sick days (separate from PTO and legally mandated sick leave)'
    ]

    const leaveFlexibilityPrograms = [
      'Paid family/medical leave beyond legal requirements',
      'Flexible work schedules',
      'Remote work options',
      'Job sharing programs',
      'Phased retirement',
      'Sabbatical programs',
      'Dedicated caregiver leave (separate from family leave)'
    ]

    const wellnessSupportPrograms = [
      'Employee assistance program (EAP)',
      'Physical wellness programs (fitness, nutrition, ergonomics)',
      'Mental wellness programs (stress management, mindfulness, resilience)',
      'On-site health services',
      'Mental health resources (therapy, counseling)',
      'Caregiving support resources',
      'Tailored support programs for employees managing cancer or other serious health conditions'
    ]

    const financialLegalAssistance = [
      'Financial counseling/planning',
      'Student loan assistance',
      'Identity theft protection',
      'Legal assistance/services (will preparation, family law, medical directives)'
    ]

    const careNavigationServices = [
      'Care coordination for complex conditions',
      'Second opinion services or facilitation',
      'Specialized treatment center networks',
      'Travel support for specialized care',
      'Clinical guidance and navigation',
      'Medication access and affordability programs'
    ]

    const allBenefits = [
      { category: 'STANDARD BENEFITS', items: standardBenefits },
      { category: 'LEAVE & FLEXIBILITY PROGRAMS', items: leaveFlexibilityPrograms },
      { category: 'WELLNESS & SUPPORT PROGRAMS', items: wellnessSupportPrograms },
      { category: 'FINANCIAL & LEGAL ASSISTANCE', items: financialLegalAssistance },
      { category: 'CARE NAVIGATION & SUPPORT SERVICES', items: careNavigationServices }
    ]

    const handleBenefitToggle = (benefit) => {
      setAnswers(prev => ({
        ...prev,
        gb1: prev.gb1.includes(benefit) 
          ? prev.gb1.filter(b => b !== benefit)
          : [...prev.gb1, benefit]
      }))
      setErrors(prev => ({ ...prev, gb1: '' }))
    }

    const handleGb3Toggle = (benefit) => {
      if (benefit === 'None of these') {
        setAnswers(prev => ({
          ...prev,
          gb3: prev.gb3.includes(benefit) ? [] : ['None of these']
        }))
      } else {
        setAnswers(prev => ({
          ...prev,
          gb3: prev.gb3.includes(benefit) 
            ? prev.gb3.filter(b => b !== benefit)
            : [...prev.gb3.filter(b => b !== 'None of these'), benefit]
        }))
      }
    }

    const handleNext = () => {
      const newErrors = {}
      
      if (answers.gb1.length === 0) {
        newErrors.gb1 = 'Please select at least one benefit your organization provides'
      }

      if (showGb2 && (!answers.gb2 || answers.gb2.trim() === '')) {
        newErrors.gb2 = 'Please enter the percentage or indicate if unknown'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      // Calculate progress
      const progress = 100 // All 3 questions answered
      setSectionProgress(prev => ({ ...prev, general: progress }))
      setCurrentStep('dashboard')
    }

    // Get unselected benefits for GB3
    const unselectedBenefits = allBenefits.map(category => ({
      ...category,
      items: category.items.filter(item => !answers.gb1.includes(item))
    })).filter(category => category.items.length > 0)

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header showProgress={true} />
        
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <button 
              onClick={() => setCurrentStep('dashboard')}
              className="text-orange-500 hover:text-orange-600 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">General Employee Benefits</h1>
            <div className="h-1 w-24 bg-orange-500 mb-8"></div>

            <div className="space-y-10">
              {/* GB1 - Current Benefits */}
              <div className="space-y-4" id="gb1">
                <div className="flex items-start space-x-2">
                  <span className="text-lg font-bold text-gray-900">GB1.</span>
                  <div>
                    <p className="text-base text-gray-700 leading-relaxed">
                      Now, we'd like to understand the types of benefits and programs your organization currently offers employees.
                    </p>
                    <p className="text-base text-gray-700 leading-relaxed mt-2">
                      Please indicate which of the following your organization provides:
                      <span className="block text-sm font-semibold text-gray-600 mt-1">(Select ALL that apply)</span>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-8 ml-8">
                  {allBenefits.map((category, idx) => (
                    <div key={idx}>
                      <h3 className="font-bold text-gray-800 mb-3">{category.category}</h3>
                      <div className="space-y-2 ml-4">
                        {category.items.map((benefit) => (
                          <label 
                            key={benefit} 
                            className={`flex items-start space-x-3 cursor-pointer p-3 rounded-lg border ${
                              benefit.includes('cancer or other serious health conditions') 
                                ? 'border-orange-300 bg-orange-50 hover:bg-orange-100' 
                                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                            } transition-all`}
                          >
                            <input 
                              type="checkbox"
                              checked={answers.gb1.includes(benefit)}
                              onChange={() => handleBenefitToggle(benefit)}
                              className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                            />
                            <span className={`${answers.gb1.includes(benefit) ? 'text-orange-600 font-medium' : 'text-gray-700'} text-sm`}>
                              {benefit}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {errors.gb1 && (
                    <p className="mt-2 text-sm text-red-600">{errors.gb1}</p>
                  )}
                </div>
              </div>

              {/* GB2 - Healthcare Access */}
              {showGb2 && (
                <div className="space-y-4" id="gb2">
                  <div className="flex items-start space-x-2">
                    <span className="text-lg font-bold text-gray-900">GB2.</span>
                    <div>
                      <p className="text-base text-gray-700 leading-relaxed">
                        What percentage of your employees have access to <strong>healthcare through national or government systems</strong> 
                        (rather than employer-provided insurance)?
                      </p>
                      <p className="text-sm italic text-gray-600 mt-1">
                        For multi-country organizations, provide your best estimate across all locations
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-8 max-w-md">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={answers.gb2}
                        onChange={(e) => {
                          setAnswers(prev => ({ ...prev, gb2: e.target.value }))
                          setErrors(prev => ({ ...prev, gb2: '' }))
                        }}
                        className={`w-32 px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          errors.gb2 ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="0-100"
                      />
                      <span className="text-gray-700">% access to healthcare through national or government systems</span>
                    </div>
                    {errors.gb2 && (
                      <p className="mt-2 text-sm text-red-600">{errors.gb2}</p>
                    )}
                  </div>
                </div>
              )}

              {/* GB3 - Future Plans */}
              <div className="space-y-4" id="gb3">
                <div className="flex items-start space-x-2">
                  <span className="text-lg font-bold text-gray-900">GB3.</span>
                  <div>
                    <p className="text-base text-gray-700 leading-relaxed">
                      <strong>Over the next 2 years</strong>, which, if any of the following programs does your organization <strong>plan to roll out</strong>?
                      <span className="block text-sm font-semibold text-gray-600 mt-1">(Select ALL that apply)</span>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-8 ml-8">
                  {unselectedBenefits.map((category, idx) => (
                    <div key={idx}>
                      <h3 className="font-bold text-gray-800 mb-3">{category.category}</h3>
                      <div className="space-y-2 ml-4">
                        {category.items.map((benefit) => (
                          <label 
                            key={benefit} 
                            className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all"
                          >
                            <input 
                              type="checkbox"
                              checked={answers.gb3.includes(benefit)}
                              onChange={() => handleGb3Toggle(benefit)}
                              className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                            />
                            <span className={`${answers.gb3.includes(benefit) ? 'text-orange-600 font-medium' : 'text-gray-700'} text-sm`}>
                              {benefit}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                    <input 
                      type="checkbox"
                      checked={answers.gb3.includes('None of these')}
                      onChange={() => handleGb3Toggle('None of these')}
                      className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                    />
                    <span className={`${answers.gb3.includes('None of these') ? 'text-orange-600 font-medium' : 'text-gray-700'} text-sm`}>
                      None of these
                    </span>
                  </label>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8">
                <button
                  onClick={() => setCurrentStep('dashboard')}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-all"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all"
                >
                  Save & Continue &rarr;
                </button>
              </div>
            </div>
          </div>

          <PoweredBy />
        </main>
      </div>
    )
  }
  switch (currentStep) {
    case 'login':
      return <LoginPage />
    case 'letter':
      return <LetterPage />
    case 'authorization':
      return <AuthorizationPage />
    case 'dashboard':
      return <DashboardPage />
    case 'firmographics':
      return <FirmographicsPage />
    case 'general':
      return <GeneralBenefitsPage />
    case 'current':
      return <CurrentSupportPage />
    default:
      return <LoginPage />
  }
}

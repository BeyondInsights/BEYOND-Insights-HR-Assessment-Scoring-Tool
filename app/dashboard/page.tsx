// app/dashboard/page.tsx - Updated with payment gating and NO certification button
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import ProgressCircle from '@/components/ProgressCircle'
import { Lock, CheckCircle, CreditCard } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [dimensionProgress, setDimensionProgress] = useState(new Array(13).fill(0))
  const [sectionProgress, setSectionProgress] = useState({
    firmographics: 0,
    general: 0,
    current: 0,
  })

useEffect(() => {
  if (typeof window === 'undefined') return
  
  // Check authentication
  const authCompleted = localStorage.getItem('auth_completed') === 'true';
  if (!authCompleted) {
    router.push('/authorization');
    return;
  }
  
  const handleFocus = () => {
    calculateProgress();
  };
  window.addEventListener("focus", handleFocus);
  
  const calculateProgress = () => {
    const savedEmail = localStorage.getItem('auth_email') || ''
    setEmail(savedEmail)
    
    // Check payment status and method
    const paymentStatus = localStorage.getItem('payment_completed')
    const paymentMethod = localStorage.getItem('payment_method')
    
    // Allow access if ANY payment method was selected
    setPaymentCompleted(paymentStatus === 'true' || paymentStatus === 'invoice')
    
    const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}')
    if (firmo?.companyName) setCompanyName(firmo.companyName)
    
     
      const general = JSON.parse(localStorage.getItem('general-benefits_data') || '{}')
      const current = JSON.parse(localStorage.getItem('current-support_data') || '{}')
      
      const firmRequired = ['s1','s2','s3','s4a','s4b','s5','s6','s7','s8','s9a','c2','c3','c4','c5','c6']
      const genRequired = ['cb1_standard', 'cb1_leave', 'cb1_wellness', 'cb1_financial', 'cb1_navigation', 'cb1a', 'cb2b']
      const curRequired = ['cb3a','cb3b','cb3c','cb3d','or1','or2a','or2b','or3','or5a','or6']

      // Check completion flags
      const firmComplete = localStorage.getItem('firmographics_complete') === 'true'
      const genComplete = localStorage.getItem('general_benefits_complete') === 'true'
      const curComplete = localStorage.getItem('current_support_complete') === 'true'
      
      // Check dimension completions with partial progress
      const dimProgress = []
      for (let i = 1; i <= 13; i++) {
        const dimData = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}')
        const complete = localStorage.getItem(`dimension${i}_complete`) === 'true'
        if (complete) {
          dimProgress.push(100)
        } else {
          const keys = Object.keys(dimData).length
          dimProgress.push(keys > 0 ? Math.min(90, keys * 5) : 0)
        }
      }
      setDimensionProgress(dimProgress)
      
      // Calculate progress for each section
      let firmProg = 0;
      let genProg = 0;
      let curProg = 0;
      
      // Firmographics progress
      if (firmComplete) {
        firmProg = 100;
      } else {
        const firmCount = firmRequired.filter(field => {
          if (field === 's6' || field === 'c4') {
            return Array.isArray(firmo[field]) && firmo[field].length > 0;
          }
          return firmo[field] && firmo[field] !== '';
        }).length;
        firmProg = Math.round((firmCount / firmRequired.length) * 100);
      }
      
      // General benefits progress
      if (genComplete) {
        genProg = 100;
      } else {
        const genCount = genRequired.filter(field => {
          if (field.startsWith('cb1') && field !== 'cb1a') {
            return Array.isArray(general[field]) && general[field].length > 0;
          }
          return general[field] !== undefined && general[field] !== '';
        }).length;
        genProg = Math.round((genCount / genRequired.length) * 100);
      }
      
      // Current support progress  
      if (curComplete) {
        curProg = 100;
      } else {
        const curCount = curRequired.filter(field => current[field] && current[field] !== '').length;
        curProg = Math.round((curCount / curRequired.length) * 100);
      }
      
      setSectionProgress({
        firmographics: firmProg,
        general: genProg,
        current: curProg,
      });

      // Check if everything is 100% complete
      const allComplete = firmProg === 100 && genProg === 100 && curProg === 100 && 
                          dimProgress.every(p => p === 100);
      
      if (allComplete && !localStorage.getItem('assessment_completion_shown')) {
        localStorage.setItem('assessment_completion_shown', 'true');
        router.push('/completion');
      }
    }
    
    calculateProgress();
    
    return () => window.removeEventListener("focus", handleFocus);
  }, [router])

  const overallProgress = Math.round(
    (sectionProgress.firmographics + sectionProgress.general + sectionProgress.current) / 3
  )

  const sections = [
    { id: 'firmographics', title: 'Company Profile', questions: 15, completion: sectionProgress.firmographics },
    { id: 'general-benefits', title: 'General Employee Benefits', questions: 25, completion: sectionProgress.general },
    { id: 'current-support', title: 'Current Support for Employees Managing Cancer', questions: 20, completion: sectionProgress.current },
  ]

  const dimensions = [
    'Medical Leave & Flexibility','Insurance & Financial Protection','Manager Preparedness & Capability','Navigation & Expert Resources',
    'Workplace Accommodations','Culture & Psychological Safety','Career Continuity & Advancement','Return-to-Work Excellence',
    'Executive Commitment & Resources','Caregiver & Family Support','Prevention, Wellness & Legal Compliance','Continuous Improvement & Outcomes','Communication & Awareness',
  ]

  const allCoreDone =
    sectionProgress.firmographics === 100 &&
    sectionProgress.general === 100 &&
    sectionProgress.current === 100

  const handleSectionClick = (sectionId: string) => {
    if (!paymentCompleted) {
      return;
    }
    router.push(`/survey/${sectionId}`)
  }

  const handleDimensionClick = (idx: number) => {
    if (!paymentCompleted) {
      return;
    }
    if (allCoreDone || idx === 0 || idx === 1) {
    router.push(`/survey/dimensions/${idx+1}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-10 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assessment Dashboard</h1>

          {email && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg px-5 py-3">
              <p className="text-lg sm:text-xl font-semibold text-gray-900">
                Welcome back, <span className="text-orange-600">{email}</span>
              </p>
            </div>
          )}

          {companyName && (
            <p className="mt-2 text-lg font-medium text-gray-800">{companyName}</p>
          )}
        </div>

        {/* Payment Status Banner */}
{!paymentCompleted && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-lg">
    <div className="flex items-start">
      <Lock className="w-6 h-6 text-yellow-600 mr-3 mt-1" />
      <div className="flex-1">
        <h3 className="text-lg font-bold text-yellow-900 mb-2">
          Payment Required to Begin Assessment
        </h3>
        <p className="text-yellow-800 mb-4">
          Complete your application payment to unlock all assessment sections. You can review the dashboard structure, but assessment sections will remain locked until payment is received.
        </p>
        <button
          onClick={() => router.push('/payment')}
          className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
        >
          <CreditCard className="w-5 h-5 mr-2" />
          Complete Payment ($1,200)
        </button>
      </div>
    </div>
  </div>
)}

{paymentCompleted && (() => {
  const paymentMethod = localStorage.getItem('payment_method')
  const isInvoice = paymentMethod === 'invoice'
  
  return (
    <div className={`border-l-4 p-6 mb-8 rounded-lg ${
      isInvoice ? 'bg-blue-50 border-blue-400' : 'bg-green-50 border-green-400'
    }`}>
      <div className="flex items-start">
        {isInvoice ? (
          <CreditCard className="w-6 h-6 text-blue-600 mr-3 mt-1" />
        ) : (
          <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-1" />
        )}
        <div className="flex-1">
          <h3 className={`text-lg font-bold mb-2 ${
            isInvoice ? 'text-blue-900' : 'text-green-900'
          }`}>
            Payment Method: {isInvoice ? 'Invoice (Payment Pending)' : 
              paymentMethod === 'card' ? 'Credit Card' : 
              paymentMethod === 'ach' ? 'ACH Transfer' : 'Processed'}
          </h3>
          <p className={isInvoice ? 'text-blue-800' : 'text-green-800'}>
            {isInvoice 
              ? 'Your invoice has been generated. You can continue working on your assessment while we process your payment. Payment is due within 14 days.'
              : 'Transaction completed successfully. Your payment has been processed and you have full access to complete your assessment.'
            }
          </p>
          {!isInvoice && (
            <p className="text-sm text-gray-600 mt-2">
              Payment Date: {new Date(localStorage.getItem('payment_date') || Date.now()).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
})()}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">How this works</h2>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
            <li>Start in any order. Your work saves automatically on every change.</li>
            <li>Stop anytime - you can return here and resume where you left off.</li>
            <li>Progress meters reflect partial completion - you can re-enter completed sections to review/edit.</li>
          </ul>
        </div>

        {/* Core Sections */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {sections.map((s) => {
           const isLocked = false // Always allow access if they've completed payment (any method)
            
            return (
              <div
                key={s.id}
                role="button"
                tabIndex={isLocked ? -1 : 0}
                onClick={() => handleSectionClick(s.id)}
                onKeyDown={(e) => !isLocked && e.key === 'Enter' && handleSectionClick(s.id)}
                className={`rounded-xl border-2 p-6 flex justify-between items-center shadow-sm transition-all duration-300 
                  ${isLocked 
                    ? 'cursor-not-allowed opacity-60 bg-gray-100 border-gray-300' 
                    : `cursor-pointer transform hover:scale-105 bg-gradient-to-br from-white to-gray-50 hover:bg-blue-50 hover:shadow-md ${
                        s.completion === 100 ? "border-green-400" : s.completion > 0 ? "border-orange-400" : "border-gray-200"
                      }`
                  }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-md font-semibold text-gray-900">{s.title}</h3>
                    {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                  </div>
                  <p className="text-xs text-gray-600">
                    {isLocked ? (
                      'Payment required'
                    ) : s.completion === 100 ? (
                      "Completed"
                    ) : (
                      `${s.questions} questions | ${s.completion}%`
                    )}
                  </p>
                </div>
                <ProgressCircle completion={isLocked ? 0 : s.completion} />
              </div>
            );
          })}
        </div>

        {/* Dimensions */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6 rounded-lg">
          <h3 className="text-lg font-bold text-blue-900 mb-3">13 Dimensions of Support</h3>
          <p className="text-gray-700 mb-3">The following explores <strong>13 dimensions of support for employees managing cancer or other serious health conditions</strong>. We'd like to understand where your organization currently focuses its efforts.</p>
          <p className="text-gray-700 mb-3"><strong>Each organization's journey is unique</strong> - some dimensions may be well-developed while others are emerging or not yet a priority.</p>
          <div className="bg-white p-4 rounded mt-3">
            <p className="text-sm font-semibold mb-2">As you review each dimension, keep in mind:</p>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-600">
              <li>No organization excels in all areas</li>
              <li>Resource constraints mean making strategic choices</li>
              <li>"Not able to offer" is a common response</li>
              <li>Some items represent aspirational best practices few have achieved</li>
            </ul>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-4">13 Dimensions of Support</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dimensions.map((dim, idx) => {
  const isLocked = !paymentCompleted;
  const canAccess = allCoreDone || idx === 0 || idx === 1;  // Add || idx === #
  const isClickable = !isLocked && canAccess;
            
            return (
              <div
                key={dim}
                role="button"
                tabIndex={isClickable ? 0 : -1}
                onClick={() => handleDimensionClick(idx)}
                onKeyDown={(e) => isClickable && e.key === 'Enter' && handleDimensionClick(idx)}
                className={`rounded-xl border-2 p-6 flex justify-between items-center shadow-sm transition-all duration-300
                  ${isLocked || !canAccess
                    ? 'cursor-not-allowed bg-gray-100 border-gray-200 opacity-60'
                    : 'cursor-pointer bg-white hover:bg-blue-50 hover:shadow-md border-gray-200 transform hover:scale-105'
                  }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-800">{dim}</h3>
                    {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                  </div>
                  <p className="text-xs text-gray-500">
                    {isLocked ? (
                      'Payment required'
                    ) : dimensionProgress[idx] === 100 ? (
                      'Completed'
                    ) : canAccess ? (
                      'Click to begin'
                    ) : (
                      'Complete all 3 core sections first'
                    )}
                  </p>
                </div>
                <ProgressCircle completion={isLocked ? 0 : (dimensionProgress[idx] || 0)} />
              </div>
            );
          })}
        </div>

      </main>
   
      <Footer overallProgress={paymentCompleted ? overallProgress : 0} />
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import ProgressCircle from '@/components/ProgressCircle';

import { percentComplete } from '@/lib/progress'

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [sectionProgress, setSectionProgress] = useState({
    firmographics: 0,
    general: 0,
    current: 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedEmail = localStorage.getItem('auth_email') || ''
    setEmail(savedEmail)

    const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}')
    if (firmo?.companyName) setCompanyName(firmo.companyName)

    const general = JSON.parse(localStorage.getItem('general_data') || '{}')
    const current = JSON.parse(localStorage.getItem('current_data') || '{}')

    const firmRequired = ['s1','s2','s3','s4a','s4b','s5',['s6','array'],'s7','s8','s9a','c2','c3','c4',['c4a','array'],['c5','array'],'c6']
    const genRequired  = [['gb1','array'],'gb2',['gb3','array']]
    const curRequired  = [['cs1a','array'],['cs2a','array'],['cs3a','array']]

    setSectionProgress({
      firmographics: percentComplete(firmo, firmRequired),
      general:       percentComplete(general, genRequired),
      current:       percentComplete(current, curRequired),
    })
  }, [])

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

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">How this works</h2>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
            <li>Start in any order. Your work saves automatically on every change.</li>
            <li>Stop anytime ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â youÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ll return here and resume where you left off.</li>
            <li>Progress meters reflect partial completion ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â you can re-enter completed sections to review/edit.</li>
          </ul>
        </div>

        {/* Core Sections */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {sections.map((s, idx) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/survey/${s.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && router.push(`/survey/${s.id}`)}
              className={`rounded-xl border-2 p-6 flex justify-between items-center cursor-pointer shadow-sm transition-all duration-150
                ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-blue-50 hover:shadow-md border-gray-200`}
            >
              <div>
                <h3 className="text-md font-semibold text-gray-900">{s.title}</h3>
                <p className="text-xs text-gray-600">
                  {s.completion === 100 ? 'Completed' : `${s.questions} questions | ${s.completion}%`}
                </p>
              </div>
              <ProgressCircle completion={s.completion} />
            </div>
          ))}
        </div>

        {/* Dimensions */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">13 Dimensions of Support</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dimensions.map((dim, idx) => (
            <div
              key={dim}
              role="button"
              tabIndex={0}
              onClick={() => { if (allCoreDone) router.push(`/survey/dimensions/${idx+1}`) }}
              onKeyDown={(e) => { if (allCoreDone && e.key==='Enter') router.push(`/survey/dimensions/${idx+1}`) }}
              className={`rounded-xl border-2 p-6 flex justify-between items-center shadow-sm transition-all duration-150
                ${allCoreDone
                  ? 'cursor-pointer bg-white hover:bg-blue-50 hover:shadow-md border-gray-200'
                  : 'cursor-not-allowed bg-gray-100 border-gray-200 opacity-60'}`}
            >
              <div>
                <h3 className="text-base font-semibold text-gray-800">{dim}</h3>
                <p className="text-xs text-gray-500">
                  {allCoreDone ? 'Click to begin' : 'Available after completing all 3 sections'}
                </p>
              </div>
              <ProgressCircle completion={0} />
            </div>
          ))}
        </div>
      </main>

      <Footer overallProgress={overallProgress} />
    </div>
  )
}




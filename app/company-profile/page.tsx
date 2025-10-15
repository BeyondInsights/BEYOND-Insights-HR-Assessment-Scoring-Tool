'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// CAC Brand Colors
const COLORS = {
  purple: '#6B2C91',
  orange: '#F97316', 
  teal: '#14B8A6',
  gray: { dark: '#1F2937', medium: '#6B7280', light: '#E5E7EB', bg: '#F9FAFB' }
};

export default function CompanyProfile() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load all data from localStorage
    const firmographics = JSON.parse(localStorage.getItem('firmographics_data') || '{}')
    const general = JSON.parse(localStorage.getItem('general-benefits_data') || '{}')
    const current = JSON.parse(localStorage.getItem('current-support_data') || '{}')
    
    const dimensions = []
    for (let i = 1; i <= 13; i++) {
      const dimData = JSON.parse(localStorage.getItem(`dimension${i}_data`) || '{}')
      if (Object.keys(dimData).length > 0) {
        dimensions.push({ number: i, data: dimData })
      }
    }

    const crossDimensional = JSON.parse(localStorage.getItem('cross-dimensional_data') || '{}')
    const employeeImpact = JSON.parse(localStorage.getItem('employee-impact_data') || '{}')

    setProfile({
      companyName: firmographics.companyName || firmographics.s8 || 'Your Organization',
      email: localStorage.getItem('auth_email') || '',
      firmographics,
      general,
      current,
      dimensions,
      crossDimensional,
      employeeImpact
    })
    setLoading(false)
  }, [])

  const handlePrint = () => window.print()
  
  const handleDownload = () => {
    let report = `COMPANY PROFILE REPORT - ${profile.companyName}\n`
    report += `Generated: ${new Date().toLocaleDateString()}\n\n`
    report += `${'='.repeat(80)}\n\n`
    
    // Add all sections
    report += `ORGANIZATION PROFILE\n${'-'.repeat(80)}\n`
    Object.entries(profile.firmographics).forEach(([key, value]) => {
      if (value) report += `${key}: ${JSON.stringify(value)}\n`
    })
    report += `\n`
    
    if (Object.keys(profile.general).length > 0) {
      report += `GENERAL BENEFITS\n${'-'.repeat(80)}\n`
      Object.entries(profile.general).forEach(([key, value]) => {
        if (value) report += `${key}: ${JSON.stringify(value)}\n`
      })
      report += `\n`
    }
    
    profile.dimensions.forEach((dim: any) => {
      report += `DIMENSION ${dim.number}\n${'-'.repeat(80)}\n`
      Object.entries(dim.data).forEach(([key, value]) => {
        if (value) report += `${key}: ${JSON.stringify(value)}\n`
      })
      report += `\n`
    })
    
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile.companyName.replace(/\s+/g, '_')}_Detailed_Profile.txt`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-700 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your comprehensive profile...</p>
        </div>
      </div>
    )
  }

  const dimensionNames = {
    1: "Medical Leave & Flexibility",
    2: "Insurance & Financial Protection",
    3: "Manager Preparedness & Capability",
    4: "Navigation & Expert Resources",
    5: "Workplace Accommodations",
    6: "Culture & Psychological Safety",
    7: "Career Continuity & Advancement",
    8: "Return-to-Work Excellence",
    9: "Executive Commitment & Resources",
    10: "Caregiver & Family Support",
    11: "Prevention, Wellness & Legal Compliance",
    12: "Continuous Improvement & Outcomes",
    13: "Communication & Awareness"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar - Hidden when printing */}
      <div className="print:hidden bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            ← Back to Dashboard
          </button>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all flex items-center gap-2"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 font-semibold transition-all flex items-center gap-2"
            >
              📥 Download
            </button>
          </div>
        </div>
      </div>

      {/* Header with Logo */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white py-12 print:py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{profile.companyName}</h1>
              <p className="text-xl text-purple-100">Comprehensive Workplace Support Profile</p>
              <p className="text-sm text-purple-200 mt-2">Generated: {new Date().toLocaleDateString()}</p>
              {profile.email && <p className="text-sm text-purple-200">Contact: {profile.email}</p>}
            </div>
            <img 
              src="/cancer-careers-logo.png" 
              alt="Cancer and Careers Logo" 
              className="h-16 lg:h-20 w-auto"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 print:py-4">
        
        {/* Organization Profile / Firmographics */}
        <Section title="Organization Profile" icon="🏢" color={COLORS.purple}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.firmographics.s1 && <DetailItem label="Birth Year" value={profile.firmographics.s1} />}
            {profile.firmographics.s2 && <DetailItem label="Gender Identity" value={profile.firmographics.s2} />}
            {profile.firmographics.s3 && <DetailItem label="Department" value={profile.firmographics.s3} />}
            {profile.firmographics.s4 && <DetailItem label="Primary Job Function" value={profile.firmographics.s4} />}
            {profile.firmographics.s5 && <DetailItem label="Current Level" value={profile.firmographics.s5} />}
            {profile.firmographics.s6 && <DetailItem label="Areas of Responsibility" value={profile.firmographics.s6} />}
            {profile.firmographics.s7 && <DetailItem label="Influence on Benefits" value={profile.firmographics.s7} />}
            {profile.firmographics.s8 && <DetailItem label="Organization Size" value={profile.firmographics.s8} />}
            {profile.firmographics.s9 && <DetailItem label="Headquarters Location" value={profile.firmographics.s9} />}
            {profile.firmographics.s9a && <DetailItem label="Other Countries" value={profile.firmographics.s9a} />}
            {profile.firmographics.c2 && <DetailItem label="Industry" value={profile.firmographics.c2} />}
            {profile.firmographics.c3 && <DetailItem label="Excluded Employee Groups" value={profile.firmographics.c3} />}
            {profile.firmographics.c4 && <DetailItem label="Annual Revenue" value={profile.firmographics.c4} />}
            {profile.firmographics.c5 && <DetailItem label="Healthcare Access" value={profile.firmographics.c5} />}
            {profile.firmographics.c6 && <DetailItem label="Remote/Hybrid Policy" value={profile.firmographics.c6} />}
          </div>
        </Section>

        {/* General Employee Benefits */}
        {Object.keys(profile.general).length > 0 && (
          <Section title="General Employee Benefits" icon="💼" color={COLORS.teal}>
            {Object.entries(profile.general).map(([key, value]: [string, any]) => {
              if (!value) return null
              
              if (Array.isArray(value)) {
                return (
                  <div key={key} className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-3">{formatKey(key)}</h4>
                    <div className="flex flex-wrap gap-2">
                      {value.map((item, idx) => (
                        <span key={idx} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm border border-teal-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              }
              
              return <DetailItem key={key} label={formatKey(key)} value={value} />
            })}
          </Section>
        )}

        {/* Current Support */}
        {Object.keys(profile.current).length > 0 && (
          <Section title="Current Support for Employees Managing Cancer" icon="🛡️" color={COLORS.orange}>
            {Object.entries(profile.current).map(([key, value]: [string, any]) => {
              if (!value) return null
              
              if (Array.isArray(value)) {
                return (
                  <div key={key} className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-3">{formatKey(key)}</h4>
                    <div className="flex flex-wrap gap-2">
                      {value.map((item, idx) => (
                        <span key={idx} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              }
              
              return <DetailItem key={key} label={formatKey(key)} value={value} />
            })}
          </Section>
        )}

        {/* 13 Dimensions of Support */}
        {profile.dimensions.map((dim: any) => (
          <Section 
            key={dim.number}
            title={`Dimension ${dim.number}: ${dimensionNames[dim.number as keyof typeof dimensionNames]}`}
            icon="📊"
            color={COLORS.purple}
          >
            <div className="space-y-4">
              {Object.entries(dim.data).map(([key, value]: [string, any]) => {
                if (!value) return null
                
                // Handle likert scales
                if (typeof value === 'string' && ['offer', 'plan', 'do not plan', 'not applicable'].some(v => value.toLowerCase().includes(v))) {
                  return (
                    <div key={key} className="flex items-start justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-700 flex-1">{formatKey(key)}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getLikertColor(value)}`}>
                        {value}
                      </span>
                    </div>
                  )
                }
                
                // Handle arrays
                if (Array.isArray(value)) {
                  return (
                    <div key={key} className="mb-4">
                      <h5 className="font-semibold text-gray-800 mb-2">{formatKey(key)}</h5>
                      <div className="flex flex-wrap gap-2">
                        {value.map((item, idx) => (
                          <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                }
                
                // Handle text responses
                return <DetailItem key={key} label={formatKey(key)} value={value} />
              })}
            </div>
          </Section>
        ))}

        {/* Cross-Dimensional Assessment */}
        {Object.keys(profile.crossDimensional).length > 0 && (
          <Section title="Cross-Dimensional Assessment" icon="🔗" color={COLORS.teal}>
            {Object.entries(profile.crossDimensional).map(([key, value]: [string, any]) => {
              if (!value) return null
              return <DetailItem key={key} label={formatKey(key)} value={value} />
            })}
          </Section>
        )}

        {/* Employee Impact Assessment */}
        {Object.keys(profile.employeeImpact).length > 0 && (
          <Section title="Employee Impact Assessment" icon="👥" color={COLORS.orange}>
            {Object.entries(profile.employeeImpact).map(([key, value]: [string, any]) => {
              if (!value) return null
              return <DetailItem key={key} label={formatKey(key)} value={value} />
            })}
          </Section>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t-2 border-gray-200 text-center text-sm text-gray-600 print:mt-8">
          <p className="font-semibold">Best Companies for Working with Cancer: Employer Index</p>
          <p className="mt-2">© {new Date().getFullYear()} Cancer and Careers & CEW Foundation</p>
          <p className="mt-1 text-xs">All responses collected and analyzed by BEYOND Insights, LLC</p>
        </div>
      </div>

      <style jsx>{`
        @media print {
          @page { 
            margin: 0.75in; 
            size: letter;
          }
          body { 
            print-color-adjust: exact; 
            -webkit-print-color-adjust: exact; 
          }
        }
      `}</style>
    </div>
  )
}

function Section({ title, icon, color, children }: { title: string, icon: string, color: string, children: React.ReactNode }) {
  return (
    <div className="mb-8 print:break-inside-avoid">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b-4" style={{ borderColor: color }}>
        <span className="text-3xl">{icon}</span>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-100">
        {children}
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string, value: any }) {
  const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
  
  return (
    <div className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
      <dt className="text-sm font-semibold text-gray-600 mb-1">{label}</dt>
      <dd className="text-base text-gray-900 whitespace-pre-wrap">{displayValue}</dd>
    </div>
  )
}

function formatKey(key: string): string {
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

function getLikertColor(value: string): string {
  const v = value.toLowerCase()
  if (v.includes('offer consistently') || v.includes('currently offer')) return 'bg-green-100 text-green-800 border border-green-300'
  if (v.includes('offer in at least one') || v.includes('offer to eligible')) return 'bg-blue-100 text-blue-800 border border-blue-300'
  if (v.includes('plan to offer')) return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
  if (v.includes('do not plan')) return 'bg-gray-100 text-gray-800 border border-gray-300'
  if (v.includes('not applicable')) return 'bg-gray-50 text-gray-600 border border-gray-200'
  return 'bg-purple-100 text-purple-800 border border-purple-300'
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

/** Card component mimicking the Company Profile styling */
function Card({
  selected,
  children,
  onClick,
}: {
  selected: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border-2 cursor-pointer shadow-sm ${
        selected
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <p className={`font-medium ${selected ? 'text-orange-600' : 'text-gray-800'}`}>
        {children}
      </p>
    </div>
  )
}

export default function AuthorizationPage() {
  const router = useRouter()
  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    title: '',
    titleOther: ''
  })
  const [au1, setAu1] = useState<string>('')
  const [au2, setAu2] = useState<string[]>([])
  const [other, setOther] = useState<string>('')
  const [errors, setErrors] = useState('')

  useEffect(() => {
    const email = localStorage.getItem('login_email')
    if (!email) {
      router.push('/')
      return
    }
  }, [router])

  const toggleAu2 = (option: string) => {
    setAu2((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    )
  }

  const canContinue = 
    companyInfo.companyName.trim() &&
    companyInfo.firstName.trim() &&
    companyInfo.lastName.trim() &&
    (companyInfo.title !== 'Other' ? companyInfo.title.trim() : (companyInfo.titleOther?.trim() || '')) &&
    au1 === 'Yes' && 
    au2.length > 0

  const handleContinue = () => {
    if (!companyInfo.companyName.trim()) {
      setErrors('Please enter your company name')
      return
    }
    if (!companyInfo.firstName.trim()) {
      setErrors('Please enter your first name')
      return
    }
    if (!companyInfo.lastName.trim()) {
      setErrors('Please enter your last name')
      return
    }
    if (!companyInfo.title.trim()) {
      setErrors('Please select your title')
      return
    }
    if (companyInfo.title === 'Other' && !companyInfo.titleOther?.trim()) {
      setErrors('Please specify your title')
      return
    }
    if (au1 !== 'Yes') {
      setErrors('You must be authorized to complete this assessment')
      return
    }
    if (au2.length === 0) {
      setErrors('Please select at least one authorization description')
      return
    }

    if (canContinue) {
      localStorage.setItem('login_company_name', companyInfo.companyName)
      localStorage.setItem('login_first_name', companyInfo.firstName)
      localStorage.setItem('login_last_name', companyInfo.lastName)
      
      const titleToStore = companyInfo.title === 'Other' ? companyInfo.titleOther : companyInfo.title
      localStorage.setItem('login_title', titleToStore || '')
      
      localStorage.setItem('authorization', JSON.stringify({ au1, au2, other }))
      localStorage.setItem('auth_completed', 'true')
      
      router.push('/payment')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-10 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization & Authorization</h1>
        <p className="text-base text-gray-600 mb-6">
          Please provide your organization details and confirm your authorization to complete this assessment.
        </p>

        {errors && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errors}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Organization Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyInfo.companyName}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, companyName: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter company name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyInfo.firstName}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyInfo.lastName}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <select
                value={companyInfo.title}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select your title</option>
                <option value="Chief Human Resources Officer (CHRO)">Chief Human Resources Officer (CHRO)</option>
                <option value="VP of Human Resources">VP of Human Resources</option>
                <option value="Director of Human Resources">Director of Human Resources</option>
                <option value="HR Director">HR Director</option>
                <option value="HR Manager">HR Manager</option>
                <option value="HR Business Partner">HR Business Partner</option>
                <option value="VP of Benefits">VP of Benefits</option>
                <option value="Director of Benefits">Director of Benefits</option>
                <option value="Benefits Manager">Benefits Manager</option>
                <option value="Benefits Administrator">Benefits Administrator</option>
                <option value="Compensation and Benefits Manager">Compensation and Benefits Manager</option>
                <option value="Director of Total Rewards">Director of Total Rewards</option>
                <option value="Total Rewards Manager">Total Rewards Manager</option>
                <option value="Employee Benefits Specialist">Employee Benefits Specialist</option>
                <option value="Director of People Operations">Director of People Operations</option>
                <option value="People Operations Manager">People Operations Manager</option>
                <option value="Talent Management Director">Talent Management Director</option>
                <option value="Other">Other</option>
              </select>
              
              {companyInfo.title === 'Other' && (
                <input
                  type="text"
                  value={companyInfo.titleOther || ''}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, titleOther: e.target.value }))}
                  className="w-full mt-3 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Please specify your title"
                />
              )}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Are you <span className="text-blue-700 font-bold">authorized</span> to provide information on behalf of your organization?
        </h2>
        <p className="text-base text-gray-600 mb-4">(Select ONE)</p>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mt-6 mb-8">
          <Card selected={au1 === 'Yes'} onClick={() => setAu1('Yes')}>
            Yes, I am authorized
          </Card>
          <Card selected={au1 === 'No'} onClick={() => setAu1('No')}>
            No, I am not authorized
          </Card>
        </div>

        {au1 === 'Yes' && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Which of the following best describes your{' '}
              <span className="text-blue-700 font-bold">authorization</span>?
            </h2>
            <p className="text-base text-gray-600 mb-6">(Select ALL that apply)</p>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mt-6 mb-8">
              {[
                'I have direct responsibility for benefits design and administration',
                'I have access to all necessary benefits documentation and policies',
                'I have been designated by leadership to complete this assessment',
                'I work closely with benefits policies and have comprehensive knowledge',
                'I have decision-making authority for employee benefits',
                'Other (please specify)',
              ].map((option) => (
                <Card
                  key={option}
                  selected={au2.includes(option)}
                  onClick={() => toggleAu2(option)}
                >
                  {option}
                </Card>
              ))}
            </div>
            {au2.includes('Other (please specify)') && (
              <input
                type="text"
                value={other}
                onChange={(e) => setOther(e.target.value)}
                className="w-full mt-2 px-4 py-3 border-2 rounded-lg"
                placeholder="Please specify…"
              />
            )}
          </div>
        )}

        <div className="flex justify-between mt-10">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className={`px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold ${
              canContinue
                ? 'hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Continue →
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}

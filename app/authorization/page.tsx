'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { isAuthenticated, getUserAssessment } from '@/lib/supabase/auth'
import { isFoundingPartner } from '@/lib/founding-partners'
import { supabase } from '@/lib/supabase/client'
import Footer from '@/components/Footer'
import Header from '@/components/Header'

function Card({
  selected,
  children,
  onClick,
  hasError = false,
}: {
  selected: boolean
  children: React.ReactNode
  onClick: () => void
  hasError?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border-2 cursor-pointer shadow-sm transition-all ${
        hasError
          ? 'border-red-500 bg-red-50'
          : selected
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <p className={`font-medium ${
        hasError
          ? 'text-red-600'
          : selected 
          ? 'text-orange-600' 
          : 'text-gray-900'
      }`}>
        {children}
      </p>
    </div>
  )
}

function AuthorizationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  
  const [loading, setLoading] = useState(true)
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
  
  const [touched, setTouched] = useState({
    companyName: false,
    firstName: false,
    lastName: false,
    title: false,
    titleOther: false,
    au1: false,
    au2: false,
  })

  useEffect(() => {
    const checkAuth = async () => {
      // ============================================
      // FOUNDING PARTNER CHECK - SKIP SUPABASE
      // ============================================
      const surveyId = localStorage.getItem('survey_id') || ''
      const { isFoundingPartner } = await import('@/lib/founding-partners')
      
      if (isFoundingPartner(surveyId)) {
        console.log('Founding Partner - skipping Supabase auth')
        localStorage.setItem('auth_completed', 'true')
        setLoading(false)
        return
      }
      // ============================================
      
      // ============================================
      // NEW USER BYPASS - Just created account
      // ============================================
      const justCreated = localStorage.getItem('new_user_just_created') === 'true'
      const hasAuthFlag = localStorage.getItem('user_authenticated') === 'true'
      
      if (justCreated || hasAuthFlag) {
        console.log('New user or authenticated - bypassing auth check')
        localStorage.removeItem('new_user_just_created')
        setLoading(false)
        return
      }
      // ============================================
      
      // Check if user is authenticated with Supabase (ONLY for returning users)
      const authenticated = await isAuthenticated()
      
      if (!authenticated) {
        console.log('Not authenticated - redirecting to login')
        const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
        router.push(`/${redirectParam}`)
        return
      }

      // ============================================
      // CLEAR OLD USER DATA ONLY IF TRULY DIFFERENT USER
      // ============================================
      const currentEmail = (localStorage.getItem('auth_email') || '').toLowerCase().trim()
      const lastUserEmail = (localStorage.getItem('last_user_email') || '').toLowerCase().trim()
      
      if (lastUserEmail && currentEmail && lastUserEmail !== currentEmail) {
        console.log('Different user logging in - clearing old data')
        const emailToKeep = currentEmail
        localStorage.clear()
        localStorage.setItem('auth_email', emailToKeep || '')
        localStorage.setItem('last_user_email', emailToKeep || '')
      } else if (currentEmail && !lastUserEmail) {
        localStorage.setItem('last_user_email', currentEmail)
        console.log('First login - setting last_user_email')
      } else {
        console.log('Same user returning - keeping all data')
      }
      // ============================================

      // Load existing data if any
      try {
        const assessment = await getUserAssessment()
        if (assessment) {
          const authData = assessment.firmographics_data as any
          if (authData) {
            if (authData.companyName) setCompanyInfo(prev => ({ ...prev, companyName: authData.companyName }))
            if (authData.firstName) setCompanyInfo(prev => ({ ...prev, firstName: authData.firstName }))
            if (authData.lastName) setCompanyInfo(prev => ({ ...prev, lastName: authData.lastName }))
            if (authData.title) setCompanyInfo(prev => ({ ...prev, title: authData.title }))
            if (authData.titleOther) setCompanyInfo(prev => ({ ...prev, titleOther: authData.titleOther }))
            if (authData.au1) setAu1(authData.au1)
            if (authData.au2) setAu2(authData.au2)
            if (authData.other) setOther(authData.other)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, redirect])
  
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const toggleAu2 = (option: string) => {
    setTouched(prev => ({ ...prev, au2: true }))
    setAu2((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    )
  }

  const isCompanyNameValid = companyInfo.companyName.trim().length > 0
  const isFirstNameValid = companyInfo.firstName.trim().length > 0
  const isLastNameValid = companyInfo.lastName.trim().length > 0
  const isTitleValid = companyInfo.title.trim().length > 0
  const isTitleOtherValid = companyInfo.title !== 'Other' || (companyInfo.titleOther?.trim().length || 0) > 0
  const isAu1Valid = au1 === 'Yes'
  const isAu2Valid = au2.length > 0

  const canContinue = 
    isCompanyNameValid &&
    isFirstNameValid &&
    isLastNameValid &&
    isTitleValid &&
    isTitleOtherValid &&
    isAu1Valid && 
    isAu2Valid

  const handleContinue = async () => {
    setTouched({
      companyName: true,
      firstName: true,
      lastName: true,
      title: true,
      titleOther: true,
      au1: true,
      au2: true,
    })
    
    if (!isCompanyNameValid) {
      setErrors('Please enter your company name')
      return
    }
    if (!isFirstNameValid) {
      setErrors('Please enter your first name')
      return
    }
    if (!isLastNameValid) {
      setErrors('Please enter your last name')
      return
    }
    if (!isTitleValid) {
      setErrors('Please select your title')
      return
    }
    if (!isTitleOtherValid) {
      setErrors('Please specify your title')
      return
    }
    if (!isAu1Valid) {
      setErrors('You must be authorized to complete this survey')
      return
    }
    if (!isAu2Valid) {
      setErrors('Please select at least one authorization description')
      return
    }

    if (canContinue) {
      const currentEmail = (localStorage.getItem('auth_email') || '').toLowerCase().trim()
      const titleToStore = companyInfo.title === 'Other' ? companyInfo.titleOther : companyInfo.title

      localStorage.setItem('login_company_name', companyInfo.companyName)
      localStorage.setItem('login_first_name', companyInfo.firstName)
      localStorage.setItem('login_last_name', companyInfo.lastName)
      localStorage.setItem('login_title', titleToStore || '')
      localStorage.setItem('authorization', JSON.stringify({ au1, au2, other }))
      localStorage.setItem('auth_completed', 'true')
      localStorage.setItem('last_user_email', currentEmail || '')

      // ============================================
      // CHECK IF FOUNDING PARTNER
      // ============================================
      const surveyId = localStorage.getItem('survey_id') || ''
      const { isFoundingPartner } = await import('@/lib/founding-partners')
      
      if (isFoundingPartner(surveyId)) {
        console.log('Founding Partner - going straight to dashboard')
        router.push('/dashboard')
        return
      }
      // ============================================

      // REGULAR USERS - Save to Supabase and check payment
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/')
          return
        }

        // BUILD COMPLETE DATA OBJECT WITH ALL ANSWERS
        const authorizationData = {
          companyName: companyInfo.companyName,
          firstName: companyInfo.firstName,
          lastName: companyInfo.lastName,
          title: titleToStore,
          au1,
          au2,
          other
        }

        console.log('💾 Saving authorization data to Supabase:', authorizationData)

        // SAVE BOTH DATA AND FLAG
        const { error } = await supabase
          .from('assessments')
          .update({
            company_name: companyInfo.companyName,
            firmographics_data: authorizationData,  // ✅ ACTUAL ANSWERS
            auth_completed: true,                    // ✅ COMPLETION FLAG
            firmographics_complete: true,            // ✅ SECTION FLAG
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        console.log('✅ Save result:', error ? 'ERROR' : 'SUCCESS')
        if (error) {
          console.error('❌ Supabase error:', error)
        }

        if (error) {
          console.error('Error saving:', error)
          setErrors('Failed to save. Please try again.')
          return
        }
        
        // Check payment status from BOTH Supabase AND localStorage
        const assessment = await getUserAssessment()
        const localPaymentComplete = localStorage.getItem('payment_completed') === 'true'

        if (assessment?.payment_completed || localPaymentComplete) {
          console.log('Payment confirmed - redirecting to dashboard')
          router.push('/dashboard')
        } else {
          console.log('Payment not found - redirecting to payment page')
          router.push('/payment')
        }
      } catch (error) {
        console.error('Error:', error)
        setErrors('An error occurred. Please try again.')
      }
    }
  }
 
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-900">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-10 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization & Authorization</h1>
        <p className="text-base text-gray-900 mb-6">
          Please provide your organization details and confirm your authorization to complete this survey.
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
                onBlur={() => handleBlur('companyName')}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 transition-colors ${
                  touched.companyName && !isCompanyNameValid
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-orange-500'
                }`}
                placeholder="Enter company name"
              />
              {touched.companyName && !isCompanyNameValid && (
                <p className="text-red-600 text-sm mt-1">Company name is required</p>
              )}
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
                  onBlur={() => handleBlur('firstName')}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 transition-colors ${
                    touched.firstName && !isFirstNameValid
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:border-orange-500'
                  }`}
                  placeholder="First name"
                />
                {touched.firstName && !isFirstNameValid && (
                  <p className="text-red-600 text-sm mt-1">First name is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyInfo.lastName}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  onBlur={() => handleBlur('lastName')}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 transition-colors ${
                    touched.lastName && !isLastNameValid
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:border-orange-500'
                  }`}
                  placeholder="Last name"
                />
                {touched.lastName && !isLastNameValid && (
                  <p className="text-red-600 text-sm mt-1">Last name is required</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <select
                value={companyInfo.title}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, title: e.target.value }))}
                onBlur={() => handleBlur('title')}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 transition-colors ${
                  touched.title && !isTitleValid
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-orange-500'
                }`}
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
              {touched.title && !isTitleValid && (
                <p className="text-red-600 text-sm mt-1">Title is required</p>
              )}
              
              {companyInfo.title === 'Other' && (
                <>
                  <input
                    type="text"
                    value={companyInfo.titleOther || ''}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, titleOther: e.target.value }))}
                    onBlur={() => handleBlur('titleOther')}
                    className={`w-full mt-3 px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 transition-colors ${
                      touched.titleOther && !isTitleOtherValid
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-orange-500'
                    }`}
                    placeholder="Please specify your title"
                  />
                  {touched.titleOther && !isTitleOtherValid && (
                    <p className="text-red-600 text-sm mt-1">Please specify your title</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Are you <span className="text-blue-700 font-bold">authorized</span> to provide information on behalf of your organization?
        </h2>
        <p className="text-base text-gray-900 mb-4">(Select ONE)</p>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mt-6 mb-8">
          <Card 
            selected={au1 === 'Yes'} 
            onClick={() => {
              setTouched(prev => ({ ...prev, au1: true }))
              setAu1('Yes')
            }}
            hasError={touched.au1 && !isAu1Valid}
          >
            Yes, I am authorized
          </Card>
          <Card 
            selected={au1 === 'No'} 
            onClick={() => {
              setAu1('No')
              router.push('/not-authorized')
            }}
          >
            No, I am not authorized
          </Card>
        </div>
        {touched.au1 && !isAu1Valid && (
          <p className="text-red-600 text-sm mt-2 -mt-6 mb-6">You must be authorized to complete this survey</p>
        )}

        {au1 === 'Yes' && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Which of the following best describes your{' '}
              <span className="text-blue-700 font-bold">authorization</span>?
            </h2>
            <p className="text-base text-gray-900 mb-6">(Select ALL that apply)</p>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mt-6 mb-8">
              {[
                'I have direct responsibility for benefits design and administration',
                'I have access to all necessary benefits documentation and policies',
                'I have been designated by leadership to complete this survey',
                'I work closely with benefits policies and have comprehensive knowledge',
                'I have decision-making authority for employee benefits',
                'Other (please specify)',
              ].map((option) => (
                <Card
                  key={option}
                  selected={au2.includes(option)}
                  onClick={() => toggleAu2(option)}
                  hasError={touched.au2 && !isAu2Valid}
                >
                  {option}
                </Card>
              ))}
            </div>
            {touched.au2 && !isAu2Valid && (
              <p className="text-red-600 text-sm -mt-6 mb-6">Please select at least one authorization description</p>
            )}
            {au2.includes('Other (please specify)') && (
              <input
                type="text"
                value={other}
                onChange={(e) => setOther(e.target.value)}
                className="w-full mt-2 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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

export default function AuthorizationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-900">Loading...</p>
        </div>
      </div>
    }>
      <AuthorizationContent />
    </Suspense>
  )
}

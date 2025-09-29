'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../.@/components/Header'
import Footer from '../.@/components/Footer'

function OptionCard({ selected, children, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border-2 cursor-pointer shadow-sm text-base ${
        selected
          ? 'border-orange-500 bg-orange-50 text-orange-700'
          : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      {children}
    </div>
  )
}

export default function GeneralBenefitsPage() {
  const router = useRouter()

  // Determine if CB1a should be skipped (US-only organizations)
  const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}')
  const isUSOnly =
    firmo.hqCountry === 'United States' &&
    firmo.otherCountries === 'No other countries - headquarters only'

  // Answers state
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const [percentNational, setPercentNational] = useState('')
  const [futurePrograms, setFuturePrograms] = useState<string[]>([])
  const [otherFuture, setOtherFuture] = useState('')
  const [step, setStep] = useState(0)

  // Load saved answers on mount; always reset to step 0
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('general_data') || '{}')
    if (saved) {
      setSelectedPrograms(saved.selectedPrograms || [])
      setPercentNational(saved.percentNational || '')
      setFuturePrograms(saved.futurePrograms || [])
      setOtherFuture(saved.otherFuture || '')
    }
    setStep(0)
  }, [])

  // Persist answers on any change
  useEffect(() => {
    localStorage.setItem(
      'general_data',
      JSON.stringify({
        selectedPrograms,
        percentNational,
        futurePrograms,
        otherFuture,
      })
    )
  }, [selectedPrograms, percentNational, futurePrograms, otherFuture])

  // Toggle selection helpers
  const toggleSelected = (opt: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    )
  }

  const toggleFuture = (opt: string) => {
    setFuturePrograms((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    )
  }

  // Final save (marks complete)
  const handleSubmit = () => {
    localStorage.setItem(
      'general_data',
      JSON.stringify({
        selectedPrograms,
        percentNational,
        futurePrograms,
        otherFuture,
        complete: true,
      })
    )
    router.push('/dashboard')
  }

  // Program categories
  const standard = [
    'Health insurance (Employer-provided or supplemental to national coverage)',
    'Dental insurance (Employer-provided or supplemental to national coverage)',
    'Vision insurance (Employer-provided or supplemental to national coverage)',
    'Life insurance',
    'Short-term disability (or temporary incapacity benefits)',
    'Long-term disability (or income protection)',
    'Paid time off (PTO/vacation)',
    'Sick days (separate from PTO and legally mandated sick leave)',
  ]
  const leaveFlex = [
    'Paid family/medical leave beyond legal requirements',
    'Flexible work schedules',
    'Remote work options',
    'Job sharing programs',
    'Phased retirement',
    'Sabbatical programs',
    'Dedicated caregiver leave (separate from family leave)',
  ]
  const wellnessSupport = [
    'Employee assistance program (EAP)',
    'Physical wellness programs (fitness, nutrition, ergonomics)',
    'Mental wellness programs (stress management, mindfulness, resilience)',
    'On-site health services',
    'Mental health resources (therapy, counseling)',
    'Caregiving support resources',
    'Tailored support programs for employees managing cancer or other serious health conditions',
  ]
  const financialLegal = [
    'Financial counseling/planning',
    'Student loan assistance',
    'Identity theft protection',
    'Legal assistance/services (will preparation, family law, medical directives)',
  ]
  const careNav = [
    'Care coordination for complex conditions',
    'Second opinion services or facilitation',
    'Specialized treatment center networks',
    'Travel support for specialized care',
    'Clinical guidance and navigation',
    'Medication access and affordability programs',
  ]
  const allPrograms = [...standard, ...leaveFlex, ...wellnessSupport, ...financialLegal, ...careNav]

  // Step definitions
  const categorySteps = [
    { title: 'Standard Benefits', items: standard },
    { title: 'Leave & Flexibility Programs', items: leaveFlex },
    { title: 'Wellness & Support Programs', items: wellnessSupport },
    { title: 'Financial & Legal Assistance', items: financialLegal },
    { title: 'Care Navigation & Support Services', items: careNav },
  ]

  const showPercentStep = !isUSOnly && step === categorySteps.length
  const showFutureStep = step === categorySteps.length + (isUSOnly ? 0 : 1)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header showBack />
      <main className="max-w-5xl mx-auto p-6 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">General Employee Benefits</h1>

        {step < categorySteps.length && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              CB1. Please indicate which of the following your organization provides:
            </h2>
            <h3 className="font-semibold text-blue-700">{categorySteps[step].title}</h3>
            <p className="text-sm text-gray-600 mb-2">(Select ALL that apply)</p>
            <div className="grid md:grid-cols-2 gap-3">
              {categorySteps[step].items.map((opt) => (
                <OptionCard
                  key={opt}
                  selected={selectedPrograms.includes(opt)}
                  onClick={() => toggleSelected(opt)}
                >
                  {opt}
                </OptionCard>
              ))}
            </div>
          </div>
        )}

        {showPercentStep && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              CB1a. What percentage of your employees have access to healthcare through national or government systems (rather than employer-provided insurance)?
            </h2>
            <p className="text-sm text-gray-600">
              For multi-country organizations, provide your best estimate across all locations.
            </p>
            <input
              type="number"
              value={percentNational}
              onChange={(e) => setPercentNational(e.target.value)}
              className="w-32 px-3 py-2 border-2 border-gray-300 rounded-md"
              placeholder="%"
            />
          </div>
        )}

        {showFutureStep && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              CB2b. Over the next 2 years, which, if any, of the following programs does your organization plan to roll out?
            </h2>
            <p className="text-sm text-gray-600 mb-2">(Select ALL that apply)</p>
            <div className="grid md:grid-cols-2 gap-3">
              {allPrograms.map((opt) => (
                <OptionCard
                  key={opt}
                  selected={futurePrograms.includes(opt)}
                  onClick={() => toggleFuture(opt)}
                >
                  {opt}
                </OptionCard>
              ))}
              <OptionCard
                selected={futurePrograms.includes('None of these')}
                onClick={() => toggleFuture('None of these')}
              >
                None of these
              </OptionCard>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {step > 0 ? (
            <button onClick={() => setStep((prev) => prev - 1)} className="px-6 py-2 border rounded-md">
              Back
            </button>
          ) : (
            <div />
          )}

          {step < categorySteps.length - 1 ? (
            <button
              onClick={() => setStep((prev) => prev + 1)}
              className="px-8 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Next â†’
            </button>
          ) : step === categorySteps.length - 1 ? (
            <button
              onClick={() => setStep((prev) => prev + 1)}
              className="px-8 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Next â†’
            </button>
          ) : showPercentStep && !showFutureStep ? (
            <button
              onClick={() => setStep((prev) => prev + 1)}
              className="px-8 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Next â†’
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Save & Return to Dashboard
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}


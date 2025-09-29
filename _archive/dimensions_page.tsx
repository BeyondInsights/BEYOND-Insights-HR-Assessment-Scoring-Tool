'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import OptionButton from '@/components/OptionButton'
import MultiOptionButton from '@/components/MultiOptionButton'
import { loadFromStorage, saveToStorage } from '@/lib/storage'

export default function DimensionsPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<any>(() =>
    loadFromStorage('dimensions_data', {})
  )

  useEffect(() => {
    saveToStorage('dimensions_data', answers)
  }, [answers])

  const setField = (key: string, val: any) =>
    setAnswers((prev: any) => ({ ...prev, [key]: val }))

  const toggleMulti = (key: string, val: string) =>
    setAnswers((prev: any) => {
      const arr = Array.isArray(prev[key]) ? prev[key] : []
      if (arr.includes(val)) return { ...prev, [key]: arr.filter((v: string) => v !== val) }
      return { ...prev, [key]: [...arr, val] }
    })

  // ✅ Validation
  const validateStep = (step: number) => {
    switch (step) {
      case 1: if (!answers.d1 || answers.d1.length === 0) return "Please select at least one Medical Leave & Flexibility program."; return null
      case 2: if (!answers.d2 || answers.d2.length === 0) return "Please select at least one Insurance & Financial Protection benefit."; return null
      default: return null
    }
  }

  const handleNext = () => {
    const error = validateStep(step)
    if (error) {
      alert(error)
      return
    }
    setStep(step + 1)
  }

  const back = () => setStep((s) => s - 1)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-10 flex-1">
        <h1 className="text-2xl font-bold mb-8">Dimensions of Support</h1>

        {/* STEP 1: Medical Leave & Flexibility */}
        {step === 1 && (
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Which <span className="text-blue-700 font-bold">Medical Leave & Flexibility</span> programs does your organization provide?
            </h2>
            <p className="text-sm text-gray-600 mb-4">(Select ALL that apply)</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[
                'Paid sick leave',
                'Paid family/medical leave beyond legal requirements',
                'Job-protected leave beyond legal minimums',
                'Flexible return-to-work options',
                'Phased return-to-work',
                'Sabbatical programs',
                'Other (specify)'
              ].map(opt => (
                <MultiOptionButton
                  key={opt}
                  field="d1"
                  value={opt}
                  selected={answers.d1?.includes(opt)}
                  onClick={() => toggleMulti('d1', opt)}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Insurance & Financial Protection */}
        {step === 2 && (
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Which <span className="text-blue-700 font-bold">Insurance & Financial Protection</span> benefits are available?
            </h2>
            <p className="text-sm text-gray-600 mb-4">(Select ALL that apply)</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[
                'Health insurance',
                'Dental insurance',
                'Vision insurance',
                'Life insurance',
                'Short-term disability insurance',
                'Long-term disability insurance',
                'Critical illness insurance',
                'Accident insurance',
                'Other (specify)'
              ].map(opt => (
                <MultiOptionButton
                  key={opt}
                  field="d2"
                  value={opt}
                  selected={answers.d2?.includes(opt)}
                  onClick={() => toggleMulti('d2', opt)}
                />
              ))}
            </div>
          </div>
        )}

        {/* FINAL STEP */}
        {step === 3 && (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              You’ve completed the first 2 <span className="text-blue-700 font-bold">Dimensions of Support</span>.
            </h2>
            <p className="text-gray-700 mb-10">
              Click below to save your answers and return to the dashboard.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition"
            >
              Save & Continue &rarr;
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          {step > 1 ? (
            <button onClick={back} className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition">
              Back
            </button>
          ) : (
            <button onClick={() => router.push('/dashboard')} className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition">
              Back to Dashboard
            </button>
          )}
          {step < 3 && (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition"
            >
              Next &rarr;
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

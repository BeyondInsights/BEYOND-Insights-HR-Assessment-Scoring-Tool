'use client'
import { useState } from 'react'
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
  const [au1, setAu1] = useState<string>('')        // Yes/No answer
  const [au2, setAu2] = useState<string[]>([])      // Selected options
  const [other, setOther] = useState<string>('')    // Free text for "Other"

  // Toggle function for AU2 checkboxes
  const toggleAu2 = (option: string) => {
    setAu2((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    )
  }

  const canContinue = au1 === 'Yes' && au2.length > 0

  const handleContinue = () => {
    if (canContinue) {
      localStorage.setItem('authorization', JSON.stringify({ au1, au2, other }))
      router.push('/payment')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-10 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Authorization</h1>
        <p className="text-base text-gray-600 mb-6">
          Please confirm your role and authorization to complete this assessment.
        </p>

        {/* AU1: Confirm authorization */}
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

        {/* AU2: Describe authorization (only if AU1 = Yes) */}
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
                placeholder="Please specify:"
              />
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-10">
          <button
            onClick={() => router.push('/letter')}
            className="px-6 py-2 border rounded-lg"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold ${
              canContinue
                ? 'hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Continue ’
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}

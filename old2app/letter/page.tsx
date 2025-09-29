'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import InfoBox from '@/components/InfoBox'

export default function LetterPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-3xl font-bold text-center mb-6">Welcome to the Workplace Support Assessment</h1>

          <p className="mb-4">
            On behalf of Cancer and Careers, thank you for participating in this comprehensive assessment examining
            workplace benefits and programs for <strong>employees managing cancer and other serious health conditions</strong>.
          </p>

          <InfoBox title="What This Assessment Captures">
            <p>
              Support your organization provides for employees managing cancer or other serious health conditions
              requiring time away for treatment, workplace adjustments, or ongoing support.
            </p>
          </InfoBox>

          <InfoBox title="Helpful Tips Before You Begin" color="blue">
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Have your organizationâ€™s current benefits documentation available for reference.</li>
              <li>Assessment should be completed by someone authorized to provide this information.</li>
              <li>You may need to consult with colleagues from Benefits, Compensation, or HR to complete responses.</li>
              <li>Your progress saves automatically &mdash; you can pause and return later.</li>
            </ul>
          </InfoBox>

          <p className="mb-4">
            <strong>Estimated completion time:</strong> 20 minutes (plus additional time as needed to collect / confirm requested information).
          </p>

          <p className="mb-8">With gratitude,</p>
          <p className="font-bold">Rebecca Nellis</p>
          <p className="text-sm text-gray-600 mb-6">Executive Director, Cancer and Careers</p>

          {/* Agreement */}
          <div className="bg-gray-50 rounded-lg p-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={ready}
                onChange={(e) => setReady(e.target.checked)}
                className="mt-1 mr-3 h-5 w-5 text-orange-500 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">
                I have read this welcome message and am ready to begin the assessment
              </span>
            </label>
          </div>

          {/* Begin Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => ready && router.push('/authorization')}
              disabled={!ready}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                ready
                  ? 'bg-orange-500 text-white hover:bg-orange-600 transform hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Begin Assessment &rarr;
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}


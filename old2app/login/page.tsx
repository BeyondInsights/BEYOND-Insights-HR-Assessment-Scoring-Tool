/* eslint-disable @next/next/no-img-element */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [accessCode, setAccessCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('auth_email', email)
    localStorage.setItem('auth_code', accessCode)
    router.push('/letter')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50 flex flex-col">
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-lg sm:max-w-xl relative">
          {/* Award badge */}
          <div className="flex justify-center -mt-24 mb-[-2rem]">
            <div className="bg-white rounded-full p-3 shadow-lg">
              <img
                src="/best-companies-2026-logo.png"
                alt="Best Companies Award Logo"
                className="h-28 sm:h-36 lg:h-40 w-auto"
              />
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-center text-gray-900 leading-snug mb-3">
              Welcome to the<br />
              <span className="text-orange-600">
                Best Companies for Working with Cancer Index
              </span><br />
              Assessment
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Enter your credentials to begin
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="your@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Access Code <span className="text-xs text-gray-500 ml-1">(provided by Cancer and Careers)</span>
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter access code"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all"
              >
                Begin &rarr;
              </button>
            </form>

            {/* CAC logo */}
            <div className="flex justify-center mt-12">
              <img
                src="/cancer-careers-logo.png"
                alt="Cancer and Careers Logo"
                className="h-12 sm:h-16 lg:h-20 w-auto"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
	



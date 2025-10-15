// app/completion/page.tsx - Enhanced
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

export default function CompletionPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get company info
    const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}')
    if (firmo?.companyName) setCompanyName(firmo.companyName)
    
    const savedEmail = localStorage.getItem('auth_email') || ''
    setEmail(savedEmail)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50 relative overflow-hidden">
      <Header />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 animate-float-slow">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="35" fill="#FF6B35" opacity="0.15"/>
            <circle cx="40" cy="40" r="20" fill="#FF6B35" opacity="0.25"/>
            <circle cx="40" cy="40" r="10" fill="#FF6B35" opacity="0.4"/>
          </svg>
        </div>
        
        <div className="absolute top-40 right-20 animate-float-delayed">
          <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
            <path d="M35 5 L42 28 L65 35 L42 42 L35 65 L28 42 L5 35 L28 28 Z" fill="#4F46E5" opacity="0.2"/>
          </svg>
        </div>

        <div className="absolute bottom-40 left-1/4 animate-float">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <rect x="15" y="15" width="30" height="30" fill="#10B981" opacity="0.2" transform="rotate(45 30 30)"/>
          </svg>
        </div>

        <div className="absolute top-1/3 right-10 animate-float-slow">
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="25" r="20" stroke="#8B5CF6" strokeWidth="2" fill="none" opacity="0.3"/>
            <circle cx="25" cy="25" r="12" fill="#8B5CF6" opacity="0.2"/>
          </svg>
        </div>
      </div>
      
      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        <div className="relative">
          {/* Main content card */}
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all">
            {/* Decorative header stripe with shimmer effect */}
            <div className="h-4 bg-gradient-to-r from-purple-600 via-blue-600 to-orange-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
            
            <div className="p-8 sm:p-12">
              {/* Large animated checkmark SVG */}
              <div className="flex justify-center mb-10">
                <div className="relative">
                  <svg width="160" height="160" viewBox="0 0 160 160" fill="none" className="animate-scale-in">
                    {/* Outer glow circles */}
                    <circle cx="80" cy="80" r="75" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.15"/>
                    <circle cx="80" cy="80" r="65" stroke="#10B981" strokeWidth="3" fill="none" opacity="0.25"/>
                    
                    {/* Main circle with gradient */}
                    <defs>
                      <radialGradient id="checkGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#059669" stopOpacity="1"/>
                      </radialGradient>
                    </defs>
                    <circle cx="80" cy="80" r="50" fill="url(#checkGradient)" className="animate-pulse-slow"/>
                    
                    {/* Checkmark with stroke animation */}
                    <path 
                      d="M55 80 L70 95 L105 60" 
                      stroke="white" 
                      strokeWidth="7" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      fill="none"
                      className="animate-draw-check"
                    />
                  </svg>
                  
                  {/* Radiating celebration lines */}
                  <div className="absolute inset-0 animate-spin-slow">
                    <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
                      <line x1="80" y1="5" x2="80" y2="20" stroke="#10B981" strokeWidth="3" opacity="0.5"/>
                      <line x1="130" y1="30" x2="120" y2="40" stroke="#10B981" strokeWidth="3" opacity="0.5"/>
                      <line x1="155" y1="80" x2="140" y2="80" stroke="#10B981" strokeWidth="3" opacity="0.5"/>
                      <line x1="130" y1="130" x2="120" y2="120" stroke="#10B981" strokeWidth="3" opacity="0.5"/>
                      <line x1="80" y1="155" x2="80" y2="140" stroke="#10B981" strokeWidth="3" opacity="0.5"/>
                      <line x1="30" y1="130" x2="40" y2="120" stroke="#10B981" strokeWidth="3" opacity="0.5"/>
                      <line x1="5" y1="80" x2="20" y2="80" stroke="#10B981" strokeWidth="3" opacity="0.5"/>
                      <line x1="30" y1="30" x2="40" y2="40" stroke="#10B981" strokeWidth="3" opacity="0.5"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Congratulations heading with gradient */}
              <h1 className="text-4xl sm:text-6xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-orange-600 bg-clip-text text-transparent animate-fade-in">
                Congratulations!
              </h1>
              
              <p className="text-xl sm:text-3xl text-center text-gray-700 font-semibold mb-6 animate-fade-in-delay">
                Assessment Complete
              </p>

              {companyName && (
                <p className="text-lg sm:text-2xl text-center text-gray-600 mb-8 font-medium animate-fade-in-delay-2">
                  {companyName}
                </p>
              )}

              {/* Elegant divider */}
              <div className="flex items-center justify-center my-10">
                <div className="flex items-center space-x-2">
                  <div className="h-px bg-gradient-to-r from-transparent to-gray-300 w-20 sm:w-32"></div>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="3" fill="#9CA3AF"/>
                  </svg>
                  <div className="h-px bg-gradient-to-l from-transparent to-gray-300 w-20 sm:w-32"></div>
                </div>
              </div>

              {/* Thank you message */}
              <div className="max-w-3xl mx-auto space-y-6 mb-10">
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-center">
                  Thank you for your dedication and commitment to building a more supportive workplace for employees navigating cancer and other serious health conditions.
                </p>
                
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-center">
                  Your thoughtful responses provide valuable insights into your organization's current support landscape and will help identify meaningful opportunities to enhance care for employees during their most challenging times.
                </p>

                {/* Next steps card */}
                <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50 rounded-2xl p-8 mt-10 border border-gray-200 shadow-lg">
                  <div className="flex justify-center mb-6">
                    <svg width="70" height="70" viewBox="0 0 70 70" className="animate-bounce-slow" fill="none">
                      <circle cx="35" cy="35" r="33" fill="#4F46E5" opacity="0.1"/>
                      <circle cx="35" cy="35" r="25" fill="#4F46E5" opacity="0.15"/>
                      <path d="M35 15 L40 28 L53 32 L43 42 L45 55 L35 48 L25 55 L27 42 L17 32 L30 28 Z" fill="#4F46E5" opacity="0.8"/>
                    </svg>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 text-center">What Happens Next?</h2>
                  
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-center mb-4">
                    A member of the Cancer and Careers team will carefully review your assessment and reach out to you at{' '}
                    <span className="font-semibold text-blue-600 break-all">{email}</span>{' '}
                    within the next few business days.
                  </p>
                  
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-center">
                    We'll discuss your results, answer any questions, and collaborate with you to explore meaningful next steps for your organization.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  Return to Dashboard
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow hover:shadow-lg transform hover:scale-105 active:scale-95"
                >
                  Print Summary
                </button>
              </div>

              {/* Footer note with heart accent */}
              <div className="flex items-center justify-center gap-2 mt-12">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="animate-pulse-slow">
                  <path d="M10 17.5L2.5 10C0.833 8.333 0.833 5.667 2.5 4C4.167 2.333 6.833 2.333 8.5 4L10 5.5L11.5 4C13.167 2.333 15.833 2.333 17.5 4C19.167 5.667 19.167 8.333 17.5 10L10 17.5Z" fill="#F59E0B" opacity="0.8"/>
                </svg>
                <p className="text-sm text-gray-600">
                  We're honored to partner with you on this important journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(5deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-35px) rotate(-5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(3deg); }
        }
        
        @keyframes scale-in {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.98); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes draw-check {
          0% { stroke-dasharray: 0 100; }
          100% { stroke-dasharray: 100 0; }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 7s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 9s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite 1.5s;
        }
        
        .animate-scale-in {
          animation: scale-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 25s linear infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-draw-check {
          stroke-dasharray: 100;
          animation: draw-check 0.6s ease-out 0.4s forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out 0.3s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.5s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delay-2 {
          animation: fade-in 0.8s ease-out 0.7s forwards;
          opacity: 0;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        @media print {
          .no-print { display: none; }
        }
      `}</style>
    </div>
  )
}

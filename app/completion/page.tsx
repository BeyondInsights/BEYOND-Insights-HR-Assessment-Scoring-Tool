// app/completion/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Upload, Award } from 'lucide-react'

export default function CompletionPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get company info
    const firmo = JSON.parse(localStorage.getItem('firmographics_data') || '{}')
    if (firmo?.companyName) setCompanyName(firmo.companyName)
    
    const savedEmail = localStorage.getItem('auth_email') || ''
    setEmail(savedEmail)
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileNames = Array.from(files).map(f => f.name)
      setUploadedFiles(prev => [...prev, ...fileNames])
      // In production, you would upload these files to your server here
    }
  }

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
      </div>
      
      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        <div className="relative">
          {/* Main content card */}
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Decorative header stripe */}
            <div className="h-4 bg-gradient-to-r from-purple-600 via-blue-600 to-orange-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
            
            <div className="p-8 sm:p-12">
              {/* Large animated celebration icon */}
              <div className="flex justify-center mb-10">
                <div className="relative">
                  {/* Trophy/Award SVG */}
                  <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="animate-scale-in">
                    {/* Trophy base */}
                    <rect x="50" y="110" width="40" height="8" rx="2" fill="#D97706" opacity="0.8"/>
                    <rect x="45" y="118" width="50" height="6" rx="2" fill="#D97706" opacity="0.6"/>
                    
                    {/* Trophy stem */}
                    <rect x="65" y="95" width="10" height="15" fill="#FCD34D"/>
                    
                    {/* Trophy cup */}
                    <path d="M 45 95 Q 45 70 45 60 L 55 45 L 85 45 L 95 60 Q 95 70 95 95 Z" fill="#FBBF24"/>
                    <ellipse cx="70" cy="95" rx="25" ry="8" fill="#F59E0B"/>
                    
                    {/* Left handle */}
                    <path d="M 45 60 Q 30 60 30 70 Q 30 80 45 80" stroke="#FBBF24" strokeWidth="6" fill="none"/>
                    
                    {/* Right handle */}
                    <path d="M 95 60 Q 110 60 110 70 Q 110 80 95 80" stroke="#FBBF24" strokeWidth="6" fill="none"/>
                    
                    {/* Stars around trophy */}
                    <g className="animate-pulse-slow">
                      <path d="M 70 25 L 73 33 L 82 33 L 75 38 L 78 46 L 70 41 L 62 46 L 65 38 L 58 33 L 67 33 Z" fill="#4F46E5" opacity="0.7"/>
                      <path d="M 25 50 L 27 55 L 32 55 L 28 58 L 30 63 L 25 60 L 20 63 L 22 58 L 18 55 L 23 55 Z" fill="#10B981" opacity="0.6"/>
                      <path d="M 115 50 L 117 55 L 122 55 L 118 58 L 120 63 L 115 60 L 110 63 L 112 58 L 108 55 L 113 55 Z" fill="#FF6B35" opacity="0.6"/>
                    </g>
                    
                    {/* Shine effect */}
                    <ellipse cx="60" cy="65" rx="8" ry="15" fill="white" opacity="0.3"/>
                  </svg>
                </div>
              </div>

              {/* Congratulations heading */}
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

                {/* Documentation Upload Section */}
                <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 rounded-2xl p-8 mt-10 border border-gray-200 shadow-lg">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 text-center">Supporting Documentation</h2>
                  
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-center mb-6">
                    To verify the workplace support options available to employees managing cancer and other serious health conditions, please upload relevant supporting documentation.
                  </p>
                  
                  <p className="text-sm text-gray-600 text-center mb-6">
                    Examples: benefit summaries, policy documents, program guidelines, employee handbooks, or other materials that confirm available support.
                  </p>

                  <div className="flex flex-col items-center gap-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      />
                      <div className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Upload Documents
                      </div>
                    </label>
                    
                    {uploadedFiles.length > 0 && (
                      <div className="w-full bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Uploaded files:</p>
                        <ul className="space-y-1">
                          {uploadedFiles.map((file, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge & Marketing Section */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 mt-8 border border-amber-200 shadow-lg">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                      <Award className="w-8 h-8 text-amber-600" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 text-center">Recognition & Marketing Materials</h2>
                  
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-center mb-4">
                    Organizations that meet or exceed our benchmark standards will be eligible to receive the <strong>Best Companies for Working with Cancer</strong> certification badge and access to marketing materials.
                  </p>
                  
                  <p className="text-sm text-gray-600 text-center">
                    If your organization qualifies, we'll provide comprehensive guidelines for using the certification badge in your recruiting materials, website, and employee communications, along with supporting marketing assets.
                  </p>
                </div>

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
                    A member of the Cancer and Careers team will carefully review your assessment and supporting documentation, then reach out to you at{' '}
                    <span className="font-semibold text-blue-600 break-all">{email}</span>{' '}
                    within the next few business days.
                  </p>
                  
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed text-center">
                    We'll discuss your results, answer any questions, and collaborate with you to explore meaningful next steps for your organization.
                  </p>
                </div>
              </div>

              {/* Info note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
                  <p className="text-sm text-blue-900">
                    💡 You can return to this page anytime from your dashboard to review next steps and upload additional documentation.
                  </p>
                </div>
                
  {/* Action button */}
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-lg"
                >
                  Return to Dashboard
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
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
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
      `}</style>
    </div>
  )
}

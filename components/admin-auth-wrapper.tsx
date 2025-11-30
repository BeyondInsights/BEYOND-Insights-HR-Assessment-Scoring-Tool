'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AdminAuthWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('No user found - redirecting to home')
        router.push('/')
        return
      }

      // ============================================
      // ADMIN EMAIL WHITELIST - ADD YOUR EMAILS HERE
      // ============================================
      const adminEmails = [
        'john.bekier@beyondinsights.com',
        'andy.borinstein@beyondinsights.com',
        // Add CAC admin emails below:
        'admin@cancerandcareers.org',
      ]

      const userEmail = (user.email || '').toLowerCase()
      
      if (adminEmails.includes(userEmail)) {
        console.log('Admin access granted:', userEmail)
        setIsAdmin(true)
      } else {
        console.log('Unauthorized access attempt:', userEmail)
        router.push('/')
      }
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-16 w-16 text-blue-600 mx-auto mb-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Admin Access</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}

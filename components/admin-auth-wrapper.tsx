'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Admin email whitelist - keep in sync with admin/login/page.tsx
const ADMIN_EMAILS = [
  'andy.borinstein@beyondinsights.com',
  'john.bekier@beyondinsights.com',
  'leslie.hutchings@gmail.com',
  'barbara.deal@publicisgroupe.com',
]

// Session timeout (8 hours in milliseconds)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000

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

  const checkAdminAccess = () => {
    try {
      // Check sessionStorage for admin auth
      const authData = sessionStorage.getItem('adminAuth')
      
      if (!authData) {
        console.log('No admin session - redirecting to login')
        router.push('/admin/login')
        return
      }

      const { email, timestamp } = JSON.parse(authData)

      // Check if session has expired
      if (Date.now() - timestamp > SESSION_TIMEOUT) {
        console.log('Admin session expired')
        sessionStorage.removeItem('adminAuth')
        router.push('/admin/login')
        return
      }

      // Verify email is still in whitelist
      if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
        console.log('Email no longer authorized:', email)
        sessionStorage.removeItem('adminAuth')
        router.push('/admin/login')
        return
      }

      console.log('Admin access granted:', email)
      setIsAdmin(true)
    } catch (error) {
      console.error('Auth error:', error)
      sessionStorage.removeItem('adminAuth')
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-16 w-16 text-purple-600 mx-auto mb-6" viewBox="0 0 24 24">
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

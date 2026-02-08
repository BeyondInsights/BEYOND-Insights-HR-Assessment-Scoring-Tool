'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Session timeout warning (shown 15 minutes before expiry)
const SESSION_WARNING_MS = 15 * 60 * 1000

interface AdminAuthData {
  email: string
  role: 'super_admin' | 'admin'
  name: string
  expiresAt: number
  warnAt: number
}

export default function AdminAuthWrapper({ 
  children,
  requiredRole,
}: { 
  children: React.ReactNode
  requiredRole?: 'super_admin' | 'admin'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authData, setAuthData] = useState<AdminAuthData | null>(null)
  const [showExpiryWarning, setShowExpiryWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  const logout = useCallback(async () => {
    try {
      const sessionToken = sessionStorage.getItem('adminSessionToken')
      if (sessionToken) {
        await fetch('/.netlify/functions/admin-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout', sessionToken }),
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      sessionStorage.removeItem('adminSessionToken')
      sessionStorage.removeItem('adminAuth')
      router.push('/admin/login')
    }
  }, [router])

  const verifySession = useCallback(async () => {
    try {
      const sessionToken = sessionStorage.getItem('adminSessionToken')
      const authDataStr = sessionStorage.getItem('adminAuth')

      if (!sessionToken || !authDataStr) {
        router.push('/admin/login')
        return
      }

      // Verify with server
      const response = await fetch('/.netlify/functions/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', sessionToken }),
      })

      const data = await response.json()

      if (!data.valid) {
        console.log('Session invalid:', data.error)
        sessionStorage.removeItem('adminSessionToken')
        sessionStorage.removeItem('adminAuth')
        router.push('/admin/login')
        return
      }

      // Check role authorization
      if (requiredRole === 'super_admin' && data.role !== 'super_admin') {
        console.log('Insufficient permissions')
        router.push('/not-authorized')
        return
      }

      const auth: AdminAuthData = {
        email: data.email,
        role: data.role,
        name: data.name,
        expiresAt: data.expiresAt,
        warnAt: data.warnAt,
      }

      setAuthData(auth)
      setIsAuthorized(true)

    } catch (error) {
      console.error('Session verification error:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }, [router, requiredRole])

  // Initial session check
  useEffect(() => {
    verifySession()
  }, [verifySession])

  // Session expiry warning timer
  useEffect(() => {
    if (!authData) return

    const checkExpiry = () => {
      const now = Date.now()
      const remaining = authData.expiresAt - now

      if (remaining <= 0) {
        // Session expired
        logout()
        return
      }

      if (remaining <= SESSION_WARNING_MS) {
        setShowExpiryWarning(true)
        const minutes = Math.floor(remaining / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
    }

    // Check immediately and then every second
    checkExpiry()
    const interval = setInterval(checkExpiry, 1000)

    return () => clearInterval(interval)
  }, [authData, logout])

  // Re-verify session every 5 minutes
  useEffect(() => {
    if (!isAuthorized) return

    const interval = setInterval(() => {
      verifySession()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthorized, verifySession])

  // Loading state
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

  // Not authorized
  if (!isAuthorized) {
    return null
  }

  return (
    <>
      {/* Session Expiry Warning Banner */}
      {showExpiryWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="font-semibold">Session expiring in {timeRemaining}</span>
                <span className="ml-2 text-amber-100">Your work will be saved, but you&apos;ll need to log in again.</span>
              </div>
            </div>
            <button
              onClick={() => {
                // Refresh session by re-logging in
                router.push('/admin/login')
              }}
              className="px-4 py-1.5 bg-white text-amber-600 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
            >
              Extend Session
            </button>
          </div>
        </div>
      )}

      {/* Main content with padding if warning is shown */}
      <div className={showExpiryWarning ? 'pt-14' : ''}>
        {children}
      </div>
    </>
  )
}

// Export auth data hook for use in components
export function useAdminAuth() {
  const [authData, setAuthData] = useState<AdminAuthData | null>(null)

  useEffect(() => {
    const authStr = sessionStorage.getItem('adminAuth')
    if (authStr) {
      try {
        setAuthData(JSON.parse(authStr))
      } catch (e) {
        console.error('Failed to parse auth data:', e)
      }
    }
  }, [])

  return authData
}

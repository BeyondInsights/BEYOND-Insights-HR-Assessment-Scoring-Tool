/**
 * SYNC CONFLICT BANNER
 * 
 * Shows a banner when a version conflict is detected.
 * User can click to reload from server.
 */

'use client'

import { useEffect, useState } from 'react'
import { resolveConflictFromServer, hasConflict } from '@/lib/supabase/auto-data-sync'

export default function SyncConflictBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  
  useEffect(() => {
    // Check on mount
    if (hasConflict()) {
      setShowBanner(true)
    }
    
    // Listen for conflict events
    const handleConflict = () => {
      setShowBanner(true)
    }
    
    const handleResolved = () => {
      setShowBanner(false)
    }
    
    window.addEventListener('sync-conflict', handleConflict)
    window.addEventListener('sync-conflict-resolved', handleResolved)
    
    return () => {
      window.removeEventListener('sync-conflict', handleConflict)
      window.removeEventListener('sync-conflict-resolved', handleResolved)
    }
  }, [])
  
  const handleReload = async () => {
    setIsReloading(true)
    const success = await resolveConflictFromServer()
    if (success) {
      // Reload the page to get fresh data from server
      window.location.reload()
    } else {
      setIsReloading(false)
      alert('Failed to reload from server. Please try again.')
    }
  }
  
  const handleDismiss = () => {
    setShowBanner(false)
  }
  
  if (!showBanner) return null
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg 
            className="w-6 h-6 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <div>
            <p className="font-semibold">A newer version of your data exists on the server</p>
            <p className="text-sm text-amber-100">
              Your changes could not be saved. Reload to get the latest version.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            disabled={isReloading}
            className="bg-white text-amber-600 px-4 py-2 rounded font-semibold hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReloading ? 'Reloading...' : 'Reload from Server'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-amber-100 hover:text-white p-2"
            title="Dismiss (not recommended)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

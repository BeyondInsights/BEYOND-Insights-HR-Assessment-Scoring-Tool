'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { isDirty, hasConflict, forceSyncNow, resolveConflictFromServer } from '@/lib/supabase/auto-data-sync'

/**
 * SyncStatusIndicator - Shows sync status in header
 * 
 * States:
 * - Saved (green): Everything synced
 * - Saving (spinner): Sync in progress  
 * - Needs save (orange): Has unsaved changes, clickable to retry
 * - Conflict (orange): Server has newer version, clickable to reload
 */

type SyncState = 'saved' | 'saving' | 'needs-save' | 'conflict'

export default function SyncStatusIndicator() {
  const [state, setState] = useState<SyncState>('saved')
  const [errorCount, setErrorCount] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)

  // Check current state from sync module
  const checkState = useCallback(() => {
    if (hasConflict()) {
      setState('conflict')
    } else if (isDirty()) {
      setState('needs-save')
    } else {
      setState('saved')
    }
  }, [])

  // Listen for sync events
  useEffect(() => {
    const handleSyncStart = () => {
      setState('saving')
    }

    const handleSyncSuccess = () => {
      setState('saved')
      setErrorCount(0)
    }

    const handleSyncError = () => {
      setState('needs-save')
      setErrorCount(prev => prev + 1)
    }

    const handleSyncConflict = () => {
      setState('conflict')
    }

    window.addEventListener('sync-start', handleSyncStart)
    window.addEventListener('sync-success', handleSyncSuccess)
    window.addEventListener('sync-error', handleSyncError)
    window.addEventListener('sync-conflict', handleSyncConflict)
    window.addEventListener('sync-conflict-resolved', () => {
      setState('saved')
      setErrorCount(0)
    })

    // Check initial state
    checkState()

    // Periodic state check (every 5 seconds)
    const interval = setInterval(checkState, 5000)

    return () => {
      window.removeEventListener('sync-start', handleSyncStart)
      window.removeEventListener('sync-success', handleSyncSuccess)
      window.removeEventListener('sync-error', handleSyncError)
      window.removeEventListener('sync-conflict', handleSyncConflict)
      clearInterval(interval)
    }
  }, [checkState])

  // Handle click actions
  const handleClick = async () => {
    if (state === 'needs-save') {
      setState('saving')
      const success = await forceSyncNow()
      if (success) {
        setState('saved')
        setErrorCount(0)
      } else {
        setState('needs-save')
        setErrorCount(prev => prev + 1)
      }
    } else if (state === 'conflict') {
      setState('saving')
      const resolved = await resolveConflictFromServer()
      if (resolved) {
        // Reload page to get fresh server data
        window.location.reload()
      } else {
        setState('conflict')
      }
    }
  }

  // Determine visual properties
  const getStateConfig = () => {
    switch (state) {
      case 'saved':
        return {
          dot: 'bg-green-500',
          text: 'Saved',
          tooltip: 'Your responses are saved',
          clickable: false
        }
      case 'saving':
        return {
          dot: 'bg-blue-500 animate-pulse',
          text: 'Saving...',
          tooltip: 'Saving your responses',
          clickable: false
        }
      case 'needs-save':
        return {
          dot: 'bg-orange-500',
          text: errorCount >= 3 ? 'Check connection' : 'Tap to save',
          tooltip: errorCount >= 3 
            ? 'Having trouble saving. Check your internet connection.' 
            : 'You have unsaved changes. Tap to save now.',
          clickable: true
        }
      case 'conflict':
        return {
          dot: 'bg-orange-500',
          text: 'Tap to reload',
          tooltip: 'A newer version exists on the server. Tap to reload.',
          clickable: true
        }
    }
  }

  const config = getStateConfig()

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={config.clickable ? handleClick : undefined}
        disabled={!config.clickable && state !== 'saving'}
        className={`
          flex items-center gap-1.5 px-2 py-1 rounded text-xs
          ${config.clickable 
            ? 'cursor-pointer hover:bg-gray-100 transition-colors' 
            : 'cursor-default'
          }
          ${state === 'saving' ? 'opacity-70' : ''}
        `}
        aria-label={config.tooltip}
      >
        {/* Status dot or spinner */}
        {state === 'saving' ? (
          <svg 
            className="w-3 h-3 animate-spin text-blue-500" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        )}
        
        {/* Status text */}
        <span className={`
          font-medium
          ${state === 'saved' ? 'text-green-700' : ''}
          ${state === 'saving' ? 'text-blue-600' : ''}
          ${state === 'needs-save' || state === 'conflict' ? 'text-orange-600' : ''}
        `}>
          {config.text}
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-1 z-50">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {config.tooltip}
          </div>
        </div>
      )}
    </div>
  )
}

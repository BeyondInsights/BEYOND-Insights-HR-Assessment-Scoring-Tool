/**
 * SYNC CONFLICT HANDLER - SILENT AUTO-RESOLVE
 * 
 * When a version conflict is detected:
 * 1. Silently refresh from server
 * 2. Retry the sync once
 * 3. If still failing, just log it (server wins)
 * 
 * NO SCARY BANNERS. EVER.
 */

'use client'

import { useEffect } from 'react'
import { resolveConflictFromServer, hasConflict } from '@/lib/supabase/auto-data-sync'

export default function SyncConflictBanner() {
  useEffect(() => {
    // Check on mount - if there's a conflict, auto-resolve it
    if (hasConflict()) {
      console.log('[SyncConflict] Conflict detected on mount, auto-resolving...')
      resolveConflictFromServer().then(success => {
        if (success) {
          console.log('[SyncConflict] ✅ Auto-resolved successfully')
        } else {
          console.log('[SyncConflict] Could not auto-resolve, server data is authoritative')
        }
      })
    }
    
    // Listen for conflict events - auto-resolve silently
    const handleConflict = () => {
      console.log('[SyncConflict] Conflict event received, auto-resolving...')
      resolveConflictFromServer().then(success => {
        if (success) {
          console.log('[SyncConflict] ✅ Auto-resolved successfully')
        } else {
          console.log('[SyncConflict] Could not auto-resolve, server data is authoritative')
        }
      })
    }
    
    window.addEventListener('sync-conflict', handleConflict)
    
    return () => {
      window.removeEventListener('sync-conflict', handleConflict)
    }
  }, [])
  
  // Return nothing - no visible UI
  return null
}

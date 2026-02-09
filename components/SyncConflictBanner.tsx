/**
 * SYNC CONFLICT HANDLER - SILENT AUTO-RESOLVE (only when safe)
 * 
 * When a version conflict is detected:
 * - If NOT dirty (no unsynced local changes): auto-resolve silently
 * - If dirty (user has unsynced work): do NOT auto-resolve, let indicator show
 * 
 * NO SCARY BANNERS. EVER.
 */

'use client'

import { useEffect } from 'react'
import { resolveConflictFromServer, hasConflict, isDirty } from '@/lib/supabase/auto-data-sync'

export default function SyncConflictBanner() {
  useEffect(() => {
    // Check on mount - if there's a conflict and NOT dirty, auto-resolve
    if (hasConflict() && !isDirty()) {
      console.log('[SyncConflict] Conflict detected on mount (not dirty), auto-resolving...')
      resolveConflictFromServer().then(success => {
        if (success) {
          console.log('[SyncConflict] ✅ Auto-resolved successfully')
        } else {
          console.log('[SyncConflict] Could not auto-resolve, server data is authoritative')
        }
      })
    } else if (hasConflict() && isDirty()) {
      console.log('[SyncConflict] Conflict detected but user has dirty changes - NOT auto-resolving')
      // Let SyncStatusIndicator show "Tap to reload" or similar
    }
    
    // Listen for conflict events - only auto-resolve if not dirty
    const handleConflict = () => {
      if (!isDirty()) {
        console.log('[SyncConflict] Conflict event received (not dirty), auto-resolving...')
        resolveConflictFromServer().then(success => {
          if (success) {
            console.log('[SyncConflict] ✅ Auto-resolved successfully')
          } else {
            console.log('[SyncConflict] Could not auto-resolve, server data is authoritative')
          }
        })
      } else {
        console.log('[SyncConflict] Conflict event received but user has dirty changes - NOT auto-resolving')
      }
    }
    
    window.addEventListener('sync-conflict', handleConflict)
    
    return () => {
      window.removeEventListener('sync-conflict', handleConflict)
    }
  }, [])
  
  // Return nothing - no visible UI
  return null
}

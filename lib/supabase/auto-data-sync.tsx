'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

// ============================================
// CONFIGURATION
// ============================================

const SYNC_DEBOUNCE_MS = 300;
const RETRY_INTERVAL_MS = 15000; // 15 seconds
const MAX_RETRIES = 5;
const PENDING_OPS_KEY = 'pending_sync_ops';
const LAST_SYNC_HASH_KEY = 'last_sync_hash';

// Data keys to sync
const DATA_KEYS = [
  'firmographics_data',
  'general_benefits_data',
  'current_support_data',
  'cross_dimensional_data',
  'employee-impact-assessment_data',
  'dimension1_data', 'dimension2_data', 'dimension3_data', 'dimension4_data',
  'dimension5_data', 'dimension6_data', 'dimension7_data', 'dimension8_data',
  'dimension9_data', 'dimension10_data', 'dimension11_data', 'dimension12_data',
  'dimension13_data',
];

// Map localStorage keys to database columns
const DB_COLUMN_MAP: Record<string, string> = {
  'firmographics_data': 'firmographics_data',
  'general_benefits_data': 'general_benefits_data',
  'current_support_data': 'current_support_data',
  'cross_dimensional_data': 'cross_dimensional_data',
  'employee-impact-assessment_data': 'employee_impact_data',
  'dimension1_data': 'dimension1_data',
  'dimension2_data': 'dimension2_data',
  'dimension3_data': 'dimension3_data',
  'dimension4_data': 'dimension4_data',
  'dimension5_data': 'dimension5_data',
  'dimension6_data': 'dimension6_data',
  'dimension7_data': 'dimension7_data',
  'dimension8_data': 'dimension8_data',
  'dimension9_data': 'dimension9_data',
  'dimension10_data': 'dimension10_data',
  'dimension11_data': 'dimension11_data',
  'dimension12_data': 'dimension12_data',
  'dimension13_data': 'dimension13_data',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Stable JSON stringify - sorts keys recursively for consistent hashing
 */
function stableStringify(obj: any): string {
  if (obj === null || obj === undefined) return String(obj);
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

/**
 * Simple hash for change detection
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Get survey ID from localStorage
 */
function getSurveyId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('survey_id') || localStorage.getItem('login_Survey_id');
}

/**
 * Check if user is a Founding Partner
 */
function isFP(surveyId: string): boolean {
  return surveyId.startsWith('FP-');
}

// ============================================
// PENDING OPERATIONS QUEUE
// ============================================

interface PendingOp {
  surveyId: string;
  data: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

function getPendingOps(): PendingOp[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PENDING_OPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePendingOps(ops: PendingOp[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(ops));
  } catch (e) {
    console.error('[AutoSync] Failed to save pending ops:', e);
  }
}

function addPendingOp(surveyId: string, data: Record<string, any>): void {
  const ops = getPendingOps();
  // Replace existing op for same survey or add new
  const existingIdx = ops.findIndex(op => op.surveyId === surveyId);
  const newOp: PendingOp = {
    surveyId,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  };
  if (existingIdx >= 0) {
    ops[existingIdx] = newOp;
  } else {
    ops.push(newOp);
  }
  savePendingOps(ops);
}

function removePendingOp(surveyId: string): void {
  const ops = getPendingOps().filter(op => op.surveyId !== surveyId);
  savePendingOps(ops);
}

function incrementRetryCount(surveyId: string): void {
  const ops = getPendingOps();
  const op = ops.find(o => o.surveyId === surveyId);
  if (op) {
    op.retryCount++;
    savePendingOps(ops);
  }
}

// ============================================
// SYNC FUNCTIONS
// ============================================

/**
 * Collect all survey data from localStorage
 */
function collectSurveyData(): Record<string, any> {
  const data: Record<string, any> = {};
  
  for (const localKey of DATA_KEYS) {
    const value = localStorage.getItem(localKey);
    if (value) {
      try {
        const dbColumn = DB_COLUMN_MAP[localKey] || localKey;
        data[dbColumn] = JSON.parse(value);
      } catch {
        // Skip invalid JSON
      }
    }
  }
  
  // Also collect completion flags
  for (const localKey of DATA_KEYS) {
    const completeKey = localKey.replace('_data', '_complete');
    const value = localStorage.getItem(completeKey);
    if (value === 'true') {
      const dbColumn = (DB_COLUMN_MAP[localKey] || localKey).replace('_data', '_complete');
      data[dbColumn] = true;
    }
  }
  
  return data;
}

/**
 * Compute hash of current data for change detection
 */
function computeDataHash(): string {
  const data = collectSurveyData();
  return hashString(stableStringify(data));
}

/**
 * Check if data has changed since last sync
 */
function hasDataChanged(): boolean {
  const currentHash = computeDataHash();
  const lastHash = localStorage.getItem(LAST_SYNC_HASH_KEY);
  return currentHash !== lastHash;
}

/**
 * Update the last sync hash
 */
function updateSyncHash(): void {
  const hash = computeDataHash();
  localStorage.setItem(LAST_SYNC_HASH_KEY, hash);
}

/**
 * Reset the sync hash to force next sync
 */
function resetSyncHash(): void {
  localStorage.removeItem(LAST_SYNC_HASH_KEY);
}

/**
 * Sync to Supabase via Netlify function (preferred)
 */
async function syncViaNetlifyFunction(surveyId: string, data: Record<string, any>): Promise<boolean> {
  try {
    const response = await fetch('/.netlify/functions/sync-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surveyId, data, timestamp: Date.now() }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[AutoSync] Netlify function error:', error);
      return false;
    }
    
    const result = await response.json();
    console.log('[AutoSync] Synced via Netlify function:', result);
    return true;
  } catch (e) {
    console.error('[AutoSync] Netlify function failed:', e);
    return false;
  }
}

/**
 * Sync directly to Supabase (fallback)
 */
async function syncDirectToSupabase(surveyId: string, data: Record<string, any>): Promise<boolean> {
  try {
    const matchColumn = isFP(surveyId) ? 'survey_id' : 'app_id';
    const updateData = { ...data, updated_at: new Date().toISOString() };
    
    const { error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq(matchColumn, surveyId);
    
    if (error) {
      console.error('[AutoSync] Direct Supabase error:', error);
      return false;
    }
    
    console.log('[AutoSync] Synced directly to Supabase');
    return true;
  } catch (e) {
    console.error('[AutoSync] Direct Supabase failed:', e);
    return false;
  }
}

/**
 * Main sync function with fallback
 */
async function performSync(force: boolean = false): Promise<boolean> {
  const surveyId = getSurveyId();
  if (!surveyId) {
    console.log('[AutoSync] No survey ID, skipping sync');
    return false;
  }
  
  // Check if data changed (unless forced)
  if (!force && !hasDataChanged()) {
    console.log('[AutoSync] No changes detected, skipping sync');
    return true;
  }
  
  const data = collectSurveyData();
  if (Object.keys(data).length === 0) {
    console.log('[AutoSync] No data to sync');
    return true;
  }
  
  console.log('[AutoSync] Syncing data for', surveyId, '- Force:', force);
  
  // Try Netlify function first
  let success = await syncViaNetlifyFunction(surveyId, data);
  
  // Fallback to direct Supabase if Netlify function fails
  if (!success) {
    console.log('[AutoSync] Falling back to direct Supabase');
    success = await syncDirectToSupabase(surveyId, data);
  }
  
  if (success) {
    updateSyncHash();
    removePendingOp(surveyId);
    console.log('[AutoSync] Sync successful');
  } else {
    // Add to pending queue for retry
    addPendingOp(surveyId, data);
    console.warn('[AutoSync] Sync failed, added to pending queue');
  }
  
  return success;
}

/**
 * Process pending operations queue
 */
async function processPendingOps(): Promise<void> {
  const ops = getPendingOps();
  if (ops.length === 0) return;
  
  console.log('[AutoSync] Processing', ops.length, 'pending operations');
  
  for (const op of ops) {
    if (op.retryCount >= MAX_RETRIES) {
      console.warn('[AutoSync] Max retries exceeded for', op.surveyId);
      continue;
    }
    
    const success = await syncViaNetlifyFunction(op.surveyId, op.data) ||
                    await syncDirectToSupabase(op.surveyId, op.data);
    
    if (success) {
      removePendingOp(op.surveyId);
      console.log('[AutoSync] Pending op succeeded for', op.surveyId);
    } else {
      incrementRetryCount(op.surveyId);
    }
  }
}

/**
 * Emergency sync using sendBeacon (for page unload)
 * Uses Netlify function which is more reliable than direct Supabase
 */
function emergencySync(): void {
  const surveyId = getSurveyId();
  if (!surveyId) return;
  
  const data = collectSurveyData();
  if (Object.keys(data).length === 0) return;
  
  const payload = JSON.stringify({ surveyId, data, timestamp: Date.now() });
  
  // Try sendBeacon to Netlify function (most reliable for unload)
  const beaconSent = navigator.sendBeacon(
    '/.netlify/functions/sync-assessment',
    new Blob([payload], { type: 'application/json' })
  );
  
  if (beaconSent) {
    console.log('[AutoSync] Emergency beacon sent');
  } else {
    // Fallback: keepalive fetch
    fetch('/.netlify/functions/sync-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Last resort: add to pending queue
      addPendingOp(surveyId, data);
    });
  }
}

// ============================================
// REACT COMPONENT
// ============================================

export default function AutoDataSync() {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const retryInterval = useRef<NodeJS.Timeout | null>(null);
  const isSyncing = useRef(false);

  // Debounced sync
  const debouncedSync = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(async () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      await performSync(false);
      isSyncing.current = false;
    }, SYNC_DEBOUNCE_MS);
  }, []);

  // Force sync (bypasses change detection)
  const forceSyncNow = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    resetSyncHash(); // Ensure it actually syncs
    await performSync(true);
    isSyncing.current = false;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // === STORAGE CHANGE LISTENER ===
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && DATA_KEYS.some(k => e.key?.includes(k.replace('_data', '')))) {
        debouncedSync();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // === LOCAL STORAGE INTERCEPT ===
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key: string, value: string) {
      originalSetItem(key, value);
      if (DATA_KEYS.some(k => key.includes(k.replace('_data', '')))) {
        debouncedSync();
      }
    };

    // === PAGE VISIBILITY ===
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User is leaving - try normal sync first, then emergency
        performSync(true).catch(() => emergencySync());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // === PAGE UNLOAD ===
    const handleBeforeUnload = () => {
      emergencySync();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handlePageHide = () => {
      emergencySync();
    };
    window.addEventListener('pagehide', handlePageHide);

    // === PERIODIC SYNC & RETRY ===
    retryInterval.current = setInterval(() => {
      // Sync any changes
      performSync(false);
      // Retry any failed operations
      processPendingOps();
    }, RETRY_INTERVAL_MS);

    // === INITIAL LOAD ===
    // Process any pending ops from previous session
    setTimeout(() => {
      processPendingOps();
    }, 2000);

    // === EXPOSE FORCE SYNC GLOBALLY ===
    (window as any).forceSyncNow = forceSyncNow;
    (window as any).checkPendingOps = () => {
      const ops = getPendingOps();
      console.log('[AutoSync] Pending operations:', ops);
      return ops;
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (retryInterval.current) clearInterval(retryInterval.current);
    };
  }, [debouncedSync, forceSyncNow]);

  // This component renders nothing
  return null;
}

// Export for use elsewhere
export { performSync, forceSyncNow, getPendingOps, processPendingOps };

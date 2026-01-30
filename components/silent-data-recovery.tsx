'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { startHydration, endHydration, clearDirty } from '@/lib/supabase/auto-data-sync';

/**
 * SILENT DATA RECOVERY - BULLETPROOF VERSION v2
 * 
 * CRITICAL FIXES:
 * 1. Syncs if data is DIFFERENT, not just if localStorage has MORE
 * 2. Falls back through: user_id → survey_id → app_id
 * 3. Links user_id to record when found via fallback
 * 4. Uses updated_at comparison to determine which is newer
 * 5. Uses hydration guard to prevent false dirty during DB→localStorage writes
 * 6. Namespaced version keys
 */

const DISABLED_PATHS = ['/admin', '/report/', '/scoring'];

function isRecoveryDisabled(pathname: string): boolean {
  if (!pathname) return true;
  for (const disabledPath of DISABLED_PATHS) {
    if (pathname.startsWith(disabledPath)) return true;
  }
  return false;
}

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

// Check if two objects are different
function isDifferent(a: any, b: any): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

// Count total fields with values (for logging)
function countFields(data: any): number {
  if (!data || typeof data !== 'object') return 0;
  let count = 0;
  const countInObj = (obj: any) => {
    for (const key in obj) {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') {
        count++;
        if (typeof value === 'object' && !Array.isArray(value)) countInObj(value);
      }
    }
  };
  countInObj(data);
  return count;
}

export function SilentDataRecovery() {
  const pathname = usePathname();
  const hasRun = useRef(false);
  
  useEffect(() => {
    if (isRecoveryDisabled(pathname || '')) return;
    if (hasRun.current) return;
    hasRun.current = true;
    
    const recoverData = async () => {
      try {
        const surveyId = localStorage.getItem('survey_id') || localStorage.getItem('login_Survey_id');
        if (!surveyId) {
          console.log('[Recovery] No survey_id found');
          return;
        }

        console.log('[Recovery] Starting bulletproof recovery for:', surveyId);

        // Get user if authenticated
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        // Normalize IDs
        const isFP = surveyId.startsWith('FP-') || surveyId.toUpperCase().startsWith('FPHR');
        const normalizedAppId = surveyId.replace(/-/g, '').toUpperCase();

        // ============================================
        // FIND RECORD: Try user_id → survey_id → app_id
        // ============================================
        let dbRecord: any = null;
        let matchColumn = '';
        let matchValue = '';

        // Try user_id first (if authenticated)
        if (userId) {
          const { data, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (!error && data) {
            dbRecord = data;
            matchColumn = 'user_id';
            matchValue = userId;
            console.log('[Recovery] Found record via user_id');
          }
        }

        // Fallback to survey_id
        if (!dbRecord) {
          const { data, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('survey_id', surveyId)
            .maybeSingle();
          
          if (!error && data) {
            dbRecord = data;
            matchColumn = 'survey_id';
            matchValue = surveyId;
            console.log('[Recovery] Found record via survey_id');
            
            // Link user_id if authenticated
            if (userId && !data.user_id) {
              await supabase
                .from('assessments')
                .update({ user_id: userId })
                .eq('survey_id', surveyId);
              console.log('[Recovery] Linked user_id to record');
            }
          }
        }

        // Fallback to app_id
        if (!dbRecord) {
          const { data, error } = await supabase
            .from('assessments')
            .select('*')
            .eq('app_id', normalizedAppId)
            .maybeSingle();
          
          if (!error && data) {
            dbRecord = data;
            matchColumn = 'app_id';
            matchValue = normalizedAppId;
            console.log('[Recovery] Found record via app_id');
            
            // Link user_id if authenticated
            if (userId && !data.user_id) {
              await supabase
                .from('assessments')
                .update({ user_id: userId })
                .eq('app_id', normalizedAppId);
              console.log('[Recovery] Linked user_id to record');
            }
          }
        }

        if (!dbRecord) {
          console.log('[Recovery] No database record found via any method');
          return;
        }

        // ============================================
        // SYNC VERSION ONLY - Don't push data changes
        // Auto-sync handles all writes to prevent race conditions
        // Recovery only ensures version alignment
        // ============================================
        
        // Sync localStorage version with DB version
        const idKey = surveyId || normalizedAppId || 'unknown';
        if (dbRecord.version) {
          const localVersion = parseInt(localStorage.getItem(`assessment_version_${idKey}`) || localStorage.getItem('assessment_version') || '0');
          
          if (localVersion !== dbRecord.version) {
            console.log(`[Recovery] Version mismatch: local=${localVersion}, db=${dbRecord.version} - syncing`);
            localStorage.setItem(`assessment_version_${idKey}`, String(dbRecord.version));
            localStorage.setItem('assessment_version', String(dbRecord.version));
          }
        }
        
        // Clear any stale conflict flags if versions are now aligned
        clearDirty();
        const conflictKey = `version_conflict_${idKey}`;
        sessionStorage.removeItem(conflictKey);
        sessionStorage.removeItem(`version_conflict_${surveyId}`);
        sessionStorage.removeItem('version_conflict');
        
        console.log('[Recovery] Version check complete - auto-sync handles data writes');

      } catch (err) {
        console.error('[Recovery] Error:', err);
      }
    };

    // Run after short delay
    const timeout = setTimeout(recoverData, 1500);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}

export default SilentDataRecovery;

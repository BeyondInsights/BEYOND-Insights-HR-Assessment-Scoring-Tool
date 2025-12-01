'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

/**
 * SurveyDataSync Layout
 * 
 * Wraps all survey pages and ensures localStorage is populated from Supabase
 * before any section component renders. This means:
 * - User can log in from ANY device/browser
 * - Their data is automatically loaded from Supabase
 * - Existing section components work unchanged (still read from localStorage)
 * 
 * USAGE: Wrap your survey layout with this component
 * 
 * In app/survey/layout.tsx (or wherever your survey routes are):
 * 
 *   import SurveyDataSync from '@/components/survey-data-sync';
 *   
 *   export default function SurveyLayout({ children }) {
 *     return <SurveyDataSync>{children}</SurveyDataSync>;
 *   }
 */

// All the localStorage keys used by the survey
const DATA_KEYS = [
  'firmographics_data',
  'general_benefits_data',
  'current_support_data',
  'dimension1_data',
  'dimension2_data',
  'dimension3_data',
  'dimension4_data',
  'dimension5_data',
  'dimension6_data',
  'dimension7_data',
  'dimension8_data',
  'dimension9_data',
  'dimension10_data',
  'dimension11_data',
  'dimension12_data',
  'dimension13_data',
  'cross_dimensional_data',
  'employee_impact_data',
  // Also sync completion flags
  'firmographics_complete',
  'general_benefits_complete',
  'current_support_complete',
  'dimension1_complete',
  'dimension2_complete',
  'dimension3_complete',
  'dimension4_complete',
  'dimension5_complete',
  'dimension6_complete',
  'dimension7_complete',
  'dimension8_complete',
  'dimension9_complete',
  'dimension10_complete',
  'dimension11_complete',
  'dimension12_complete',
  'dimension13_complete',
  'cross_dimensional_complete',
  'employee_impact_complete',
];

// Additional login/meta keys to sync
const META_KEYS = [
  'login_company_name',
  'login_email',
  'login_first_name',
  'login_last_name',
  'login_application_id',
  'auth_email',
];

export default function SurveyDataSync({ children }: { children: React.ReactNode }) {
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    syncDataFromSupabase();
  }, []);

  const syncDataFromSupabase = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        console.log('SurveyDataSync: No user logged in');
        setSyncing(false);
        return;
      }

      // Check if we already have data locally (quick check on one key)
      const hasLocalData = localStorage.getItem('firmographics_data');
      const syncFlag = sessionStorage.getItem('supabase_synced');
      
      // If we already synced this session and have local data, skip
      if (hasLocalData && syncFlag === 'true') {
        console.log('SurveyDataSync: Already synced this session');
        setSyncing(false);
        return;
      }

      console.log('SurveyDataSync: Fetching data for', user.email);

      // Fetch assessment from Supabase
      const { data: assessment, error: fetchError } = await supabase
        .from('assessments')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .single();

      if (fetchError) {
        // No assessment found is OK - user might be new
        if (fetchError.code === 'PGRST116') {
          console.log('SurveyDataSync: No existing assessment found');
          sessionStorage.setItem('supabase_synced', 'true');
          setSyncing(false);
          return;
        }
        throw fetchError;
      }

      if (!assessment) {
        console.log('SurveyDataSync: No assessment data');
        setSyncing(false);
        return;
      }

      console.log('SurveyDataSync: Syncing data to localStorage');

      // Sync all data keys
      DATA_KEYS.forEach(key => {
        const value = assessment[key as keyof typeof assessment];
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            localStorage.setItem(key, JSON.stringify(value));
          } else if (typeof value === 'boolean') {
            localStorage.setItem(key, value.toString());
          } else {
            localStorage.setItem(key, String(value));
          }
        }
      });

      // Sync meta keys from firmographics_data
      const firmo = assessment.firmographics_data || {};
      if (assessment.company_name) {
        localStorage.setItem('login_company_name', assessment.company_name);
      }
      if (assessment.email) {
        localStorage.setItem('login_email', assessment.email);
        localStorage.setItem('auth_email', assessment.email);
      }
      if (firmo.firstName) {
        localStorage.setItem('login_first_name', firmo.firstName);
      }
      if (firmo.lastName) {
        localStorage.setItem('login_last_name', firmo.lastName);
      }
      if (assessment.app_id) {
        localStorage.setItem('login_application_id', assessment.app_id);
      }

      // Mark as synced for this session
      sessionStorage.setItem('supabase_synced', 'true');
      
      console.log('SurveyDataSync: Complete!');
    } catch (err: any) {
      console.error('SurveyDataSync error:', err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Show loading while syncing
  if (syncing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 font-medium">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Show error if sync failed (but still render children)
  if (error) {
    console.warn('SurveyDataSync: Continuing despite error:', error);
  }

  return <>{children}</>;
}

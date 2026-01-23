'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

/**
 * SILENT DATA RECOVERY COMPONENT
 * 
 * Add this to your layout.tsx or any page that FPs visit.
 * It will automatically check if localStorage has data that should be synced
 * and push it to Supabase WITHOUT any user interaction required.
 * 
 * Usage: Just import and add <SilentDataRecovery /> to your layout
 */

const DATA_KEYS = [
  'firmographics_data',
  'general_benefits_data', 
  'current_support_data',
  'cross_dimensional_data',
  'employee-impact-assessment_data',
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

function countPrograms(data: any): number {
  let count = 0;
  
  const countInObject = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
      const value = obj[key];
      if (value === 'Currently offer' || value === 'Currently use' || value === 'Currently measure / track') {
        count++;
      } else if (typeof value === 'object') {
        countInObject(value);
      }
    }
  };
  
  countInObject(data);
  return count;
}

export function SilentDataRecovery() {
  useEffect(() => {
    const recoverData = async () => {
      try {
        // Get survey ID
        const surveyId = localStorage.getItem('survey_id') || localStorage.getItem('login_Survey_id');
        if (!surveyId) return;

        console.log('[Recovery] Checking for recoverable data for survey:', surveyId);

        // Determine if FP or regular user
        const isFP = surveyId.startsWith('FP-');
        const matchColumn = isFP ? 'survey_id' : 'app_id';

        // Fetch current database state
        const { data: dbRecord, error: fetchError } = await supabase
          .from('assessments')
          .select('*')
          .eq(matchColumn, surveyId)
          .single();

        if (fetchError || !dbRecord) {
          console.log('[Recovery] No database record found');
          return;
        }

        // Collect localStorage data and compare
        const updates: Record<string, any> = {};
        let localProgramCount = 0;
        let dbProgramCount = 0;

        for (const localKey of DATA_KEYS) {
          const localValue = localStorage.getItem(localKey);
          if (!localValue) continue;

          try {
            const localData = JSON.parse(localValue);
            const dbColumn = DB_COLUMN_MAP[localKey];
            const dbData = dbRecord[dbColumn];

            const localCount = countPrograms(localData);
            const dbCount = countPrograms(dbData);

            localProgramCount += localCount;
            dbProgramCount += dbCount;

            // If localStorage has MORE programs, use it
            if (localCount > dbCount) {
              console.log(`[Recovery] ${localKey}: localStorage has ${localCount} programs vs DB ${dbCount} - will sync`);
              updates[dbColumn] = localData;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }

        // If we found data to recover, push it
        if (Object.keys(updates).length > 0) {
          console.log(`[Recovery] RECOVERING DATA: localStorage has ${localProgramCount} total programs vs DB ${dbProgramCount}`);
          console.log('[Recovery] Updates to apply:', Object.keys(updates));

          updates.updated_at = new Date().toISOString();

          const { error: updateError } = await supabase
            .from('assessments')
            .update(updates)
            .eq(matchColumn, surveyId);

          if (updateError) {
            console.error('[Recovery] Failed to recover data:', updateError);
          } else {
            console.log('[Recovery] SUCCESS - Data recovered and synced to Supabase');
            
            // Log to a recovery audit table if it exists
            try {
              await supabase
                .from('recovery_log')
                .insert({
                  survey_id: surveyId,
                  recovered_at: new Date().toISOString(),
                  fields_recovered: Object.keys(updates),
                  local_program_count: localProgramCount,
                  db_program_count: dbProgramCount,
                });
            } catch (e) {
              // Recovery log table may not exist, that's fine
            }
          }
        } else {
          console.log('[Recovery] No data to recover - localStorage matches or is subset of DB');
        }
      } catch (err) {
        console.error('[Recovery] Error during recovery check:', err);
      }
    };

    // Run recovery check after a short delay to let page load
    const timeout = setTimeout(recoverData, 2000);
    return () => clearTimeout(timeout);
  }, []);

  // This component renders nothing
  return null;
}

export default SilentDataRecovery;

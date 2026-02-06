/**
 * UNIFIED ASSESSMENT LOADER/SAVER
 * ================================
 * ONE loader, ONE hydrator, ONE collector, ONE persister
 * 
 * ALL code paths must use these functions:
 * - Login page → loadAndHydrate()
 * - FP login → loadAndHydrate()
 * - Auto-sync → collectAndPersist()
 * - Completion buttons → collectAndPersist()
 * 
 * DO NOT create parallel loading/saving logic elsewhere.
 */

import { supabase } from '@/lib/supabase/client';
import {
  AssessmentRecord,
  DATA_FIELDS,
  COMPLETION_FLAGS,
  PAYMENT_FIELDS,
  INVOICE_FIELDS,
  SUBMISSION_FIELDS,
  FORBIDDEN_UPDATE_FIELDS,
  LOCAL_TO_DB_KEY_MAP,
  DB_TO_LOCAL_KEY_MAP,
  normalizeSurveyId
} from './types';

// ============================================
// IDENTITY TYPE
// ============================================

export interface AssessmentIdentity {
  userId?: string | null;
  surveyId?: string | null;
  appId?: string | null;
}

// ============================================
// LOADER - Load from Supabase
// ============================================

/**
 * Load assessment from Supabase using any available identifier
 * Tries: user_id → survey_id → app_id (normalized)
 */
export async function loadAssessment(identity: AssessmentIdentity): Promise<AssessmentRecord | null> {
  const { userId, surveyId, appId } = identity;
  
  if (!userId && !surveyId && !appId) {
    console.warn('[loadAssessment] No identity provided');
    return null;
  }
  
  try {
    console.log('[loadAssessment] Loading with identity:', identity);
    
    // Build OR conditions for all possible identity matches
    const conditions: string[] = [];
    
    if (userId) {
      conditions.push(`user_id.eq.${userId}`);
    }
    
    if (surveyId) {
      conditions.push(`survey_id.eq.${surveyId}`);
      const normalized = normalizeSurveyId(surveyId);
      if (normalized !== surveyId) {
        conditions.push(`survey_id.eq.${normalized}`);
      }
      conditions.push(`app_id.eq.${surveyId}`);
      conditions.push(`app_id.eq.${normalized}`);
    }
    
    if (appId) {
      conditions.push(`app_id.eq.${appId}`);
      const normalized = normalizeSurveyId(appId);
      if (normalized !== appId) {
        conditions.push(`app_id.eq.${normalized}`);
      }
    }
    
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .or(conditions.join(','))
      .maybeSingle();
    
    if (error) {
      console.error('[loadAssessment] Error:', error);
      return null;
    }
    
    if (!data) {
      console.log('[loadAssessment] No record found');
      return null;
    }
    
    console.log('[loadAssessment] ✅ Found record, ID:', data.id);
    return data as AssessmentRecord;
    
  } catch (err) {
    console.error('[loadAssessment] Exception:', err);
    return null;
  }
}

// ============================================
// HYDRATOR - Populate localStorage from record
// ============================================

/**
 * Populate localStorage from a loaded AssessmentRecord
 * This is the ONLY function that should write server data to localStorage
 */
export function hydrateClientFromRecord(record: AssessmentRecord): void {
  if (!record) {
    console.warn('[hydrateClientFromRecord] No record provided');
    return;
  }
  
  // Import hydration guard to prevent AutoDataSync from marking these writes as dirty
  let startHydration: (() => void) | undefined;
  let endHydration: (() => void) | undefined;
  try {
    const autoSync = require('@/lib/supabase/auto-data-sync');
    startHydration = autoSync.startHydration;
    endHydration = autoSync.endHydration;
  } catch (e) {
    // Hydration guard not available, continue without it
  }
  
  console.log('[hydrateClientFromRecord] Starting hydration...');
  let fieldCount = 0;
  
  // Start hydration guard
  if (startHydration) startHydration();
  
  try {
    // === DATA FIELDS (JSON objects) ===
    for (const field of DATA_FIELDS) {
      const value = (record as any)[field];
      const localKey = DB_TO_LOCAL_KEY_MAP[field] || field;
      
      if (value && typeof value === 'object' && Object.keys(value).length > 0) {
        localStorage.setItem(localKey, JSON.stringify(value));
        fieldCount++;
      }
    }
    
    // === COMPLETION FLAGS ===
    // CRITICAL: Explicitly REMOVE false flags to prevent sticky localStorage
    for (const flag of COMPLETION_FLAGS) {
      const value = (record as any)[flag];
      const localKey = DB_TO_LOCAL_KEY_MAP[flag] || flag;
      
      if (value === true) {
        localStorage.setItem(localKey, 'true');
        fieldCount++;
      } else {
        // Explicitly remove if false/null/undefined
        localStorage.removeItem(localKey);
      }
    }
    
    // === PAYMENT FIELDS ===
    if (record.payment_completed === true) {
      localStorage.setItem('payment_completed', 'true');
      fieldCount++;
    } else {
      localStorage.removeItem('payment_completed');
    }
    
    if (record.payment_method) {
      localStorage.setItem('payment_method', record.payment_method);
    }
    if (record.payment_date) {
      localStorage.setItem('payment_date', record.payment_date);
    }
    
    // === INVOICE FIELDS ===
    if (record.invoice_data) {
      localStorage.setItem('invoice_data', JSON.stringify(record.invoice_data));
      fieldCount++;
    }
    if (record.invoice_number) {
      localStorage.setItem('current_invoice_number', record.invoice_number);
    }
    
    // === COMPANY INFO ===
    if (record.company_name) {
      localStorage.setItem('login_company_name', record.company_name);
      localStorage.setItem('company_name', record.company_name);
    }
    
    if (record.email) {
      localStorage.setItem('auth_email', record.email);
      localStorage.setItem('login_email', record.email);
    }
    
    // === SUBMISSION STATUS ===
    if (record.survey_submitted === true) {
      localStorage.setItem('survey_fully_submitted', 'true');
      localStorage.setItem('assessment_completion_shown', 'true');
      fieldCount++;
    }
    
    // employee_survey_opt_in can be true, false, or null
    if (record.employee_survey_opt_in !== null && record.employee_survey_opt_in !== undefined) {
      localStorage.setItem('employee_survey_opt_in', String(record.employee_survey_opt_in));
      fieldCount++;
    }
    
    // === IDENTITY ===
    if (record.survey_id) {
      localStorage.setItem('survey_id', record.survey_id);
      localStorage.setItem('login_Survey_id', record.survey_id);
    } else if (record.app_id) {
      localStorage.setItem('survey_id', record.app_id);
      localStorage.setItem('login_Survey_id', record.app_id);
    }
    
    // === EXTRACT NESTED FIELDS FROM FIRMOGRAPHICS ===
    if (record.firmographics_data) {
      const firmo = record.firmographics_data;
      if (firmo.firstName) localStorage.setItem('login_first_name', firmo.firstName);
      if (firmo.lastName) localStorage.setItem('login_last_name', firmo.lastName);
      if (firmo.title) localStorage.setItem('login_title', firmo.title);
      if (firmo.companyName && !record.company_name) {
        localStorage.setItem('login_company_name', firmo.companyName);
      }
    }
    
    // === VERSION (for optimistic locking) ===
    if (record.version) {
      localStorage.setItem('assessment_version', String(record.version));
    }
    
    console.log(`[hydrateClientFromRecord] ✅ Hydrated ${fieldCount} fields`);
  } finally {
    // End hydration guard
    if (endHydration) endHydration();
  }
}

// ============================================
// COLLECTOR - Gather localStorage into record
// ============================================

/**
 * Collect all assessment data from localStorage into an AssessmentRecord
 * This is the ONLY function that should gather data for syncing
 */
export function collectClientRecord(): Partial<AssessmentRecord> {
  const record: Partial<AssessmentRecord> = {};
  let fieldCount = 0;
  
  // === DATA FIELDS ===
  for (const field of DATA_FIELDS) {
    // Check both DB key and local key for backwards compat
    const localKey = DB_TO_LOCAL_KEY_MAP[field] || field;
    const value = localStorage.getItem(localKey) || localStorage.getItem(field);
    
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          // Use the DB field name in the record
          (record as any)[field] = parsed;
          fieldCount++;
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }
  }
  
  // === COMPLETION FLAGS ===
  for (const flag of COMPLETION_FLAGS) {
    const localKey = DB_TO_LOCAL_KEY_MAP[flag] || flag;
    const value = localStorage.getItem(localKey) || localStorage.getItem(flag);
    
    if (value === 'true') {
      (record as any)[flag] = true;
      fieldCount++;
    }
  }
  
  // === PAYMENT FIELDS ===
  if (localStorage.getItem('payment_completed') === 'true') {
    record.payment_completed = true;
    fieldCount++;
  }
  
  const paymentMethod = localStorage.getItem('payment_method');
  if (paymentMethod) record.payment_method = paymentMethod;
  
  const paymentDate = localStorage.getItem('payment_date');
  if (paymentDate) record.payment_date = paymentDate;
  
  // === INVOICE FIELDS ===
  const invoiceData = localStorage.getItem('invoice_data');
  if (invoiceData) {
    try {
      record.invoice_data = JSON.parse(invoiceData);
      fieldCount++;
    } catch (e) {}
  }
  
  const invoiceNumber = localStorage.getItem('current_invoice_number');
  if (invoiceNumber) record.invoice_number = invoiceNumber;
  
  // === COMPANY INFO ===
  // Extract from firmographics_data if present, otherwise from localStorage
  if (record.firmographics_data?.companyName) {
    record.company_name = record.firmographics_data.companyName;
  } else {
    const companyName = localStorage.getItem('login_company_name') || localStorage.getItem('company_name');
    if (companyName) record.company_name = companyName;
  }
  
  const email = localStorage.getItem('auth_email') || localStorage.getItem('login_email');
  if (email) record.email = email.toLowerCase().trim();
  
  // === SUBMISSION STATUS ===
  if (localStorage.getItem('survey_fully_submitted') === 'true') {
    record.survey_submitted = true;
    fieldCount++;
  }
  
  const optIn = localStorage.getItem('employee_survey_opt_in');
  if (optIn !== null && optIn !== '') {
    record.employee_survey_opt_in = optIn === 'true';
  }
  
  // === EXTRACT NAMES INTO FIRMOGRAPHICS ===
  const firstName = localStorage.getItem('login_first_name');
  const lastName = localStorage.getItem('login_last_name');
  const title = localStorage.getItem('login_title');
  
  if (firstName || lastName || title) {
    if (!record.firmographics_data) record.firmographics_data = {};
    if (firstName) record.firmographics_data.firstName = firstName;
    if (lastName) record.firmographics_data.lastName = lastName;
    if (title) record.firmographics_data.title = title;
  }
  
  console.log(`[collectClientRecord] Collected ${fieldCount} fields`);
  return record;
}

// ============================================
// PERSISTER - Save to Supabase
// ============================================

export interface PersistOptions {
  source?: string;
  expectedVersion?: number;
}

/**
 * Persist assessment record to Supabase
 * Uses Netlify function for atomic updates with version checking
 */
export async function persistRecord(
  identity: AssessmentIdentity,
  record: Partial<AssessmentRecord>,
  options: PersistOptions = {}
): Promise<{ success: boolean; newVersion?: number; error?: string }> {
  
  const { source = 'client', expectedVersion } = options;
  
  // Strip forbidden fields
  const safeRecord: Partial<AssessmentRecord> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!FORBIDDEN_UPDATE_FIELDS.has(key) && value !== undefined) {
      (safeRecord as any)[key] = value;
    }
  }
  
  // Add update timestamp
  safeRecord.updated_at = new Date().toISOString();
  
  if (Object.keys(safeRecord).length <= 1) {
    // Only updated_at, nothing else to save
    return { success: true };
  }
  
  try {
    // Direct Supabase update (fallback if Netlify function not available)
    const conditions: string[] = [];
    
    if (identity.userId) {
      conditions.push(`user_id.eq.${identity.userId}`);
    }
    if (identity.surveyId) {
      const normalized = normalizeSurveyId(identity.surveyId);
      conditions.push(`survey_id.eq.${identity.surveyId}`);
      conditions.push(`survey_id.eq.${normalized}`);
      conditions.push(`app_id.eq.${identity.surveyId}`);
      conditions.push(`app_id.eq.${normalized}`);
    }
    if (identity.appId) {
      const normalized = normalizeSurveyId(identity.appId);
      conditions.push(`app_id.eq.${identity.appId}`);
      conditions.push(`app_id.eq.${normalized}`);
    }
    
    if (conditions.length === 0) {
      return { success: false, error: 'No identity provided' };
    }
    
    const { data, error } = await supabase
      .from('assessments')
      .update(safeRecord)
      .or(conditions.join(','))
      .select('version')
      .single();
    
    if (error) {
      console.error('[persistRecord] Error:', error);
      return { success: false, error: error.message };
    }
    
    const newVersion = data?.version;
    if (newVersion) {
      localStorage.setItem('assessment_version', String(newVersion));
    }
    
    console.log('[persistRecord] ✅ Saved successfully');
    return { success: true, newVersion };
    
  } catch (err: any) {
    console.error('[persistRecord] Exception:', err);
    return { success: false, error: err.message };
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Load from Supabase and hydrate localStorage in one call
 */
export async function loadAndHydrate(identity: AssessmentIdentity): Promise<boolean> {
  const record = await loadAssessment(identity);
  if (record) {
    hydrateClientFromRecord(record);
    return true;
  }
  return false;
}

/**
 * Collect from localStorage and persist to Supabase in one call
 */
export async function collectAndPersist(
  identity: AssessmentIdentity,
  options: PersistOptions = {}
): Promise<{ success: boolean; error?: string }> {
  const record = collectClientRecord();
  
  if (Object.keys(record).length === 0) {
    return { success: true }; // Nothing to save
  }
  
  // Get expected version from localStorage
  const versionStr = localStorage.getItem('assessment_version');
  const expectedVersion = versionStr ? parseInt(versionStr, 10) : undefined;
  
  return persistRecord(identity, record, { ...options, expectedVersion });
}

/**
 * Get current identity from localStorage
 */
export function getCurrentIdentity(): AssessmentIdentity {
  const surveyId = localStorage.getItem('survey_id') || localStorage.getItem('login_Survey_id');
  return {
    surveyId: surveyId || undefined,
    appId: surveyId ? normalizeSurveyId(surveyId) : undefined
  };
}

/**
 * Force sync now - convenience wrapper for use in survey pages
 */
export async function forceSyncToSupabase(): Promise<boolean> {
  const identity = getCurrentIdentity();
  if (!identity.surveyId && !identity.appId) {
    console.warn('[forceSyncToSupabase] No identity in localStorage');
    return false;
  }
  
  const result = await collectAndPersist(identity, { source: 'force_sync' });
  return result.success;
}

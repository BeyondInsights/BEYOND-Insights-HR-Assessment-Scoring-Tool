/**
 * ASSESSMENT MODULE INDEX
 * =======================
 * Single entry point for all assessment operations
 * 
 * Usage:
 * import { loadAndHydrate, collectAndPersist, forceSyncToSupabase } from '@/lib/assessment';
 */

// Types
export type { AssessmentRecord, AssessmentIdentity, PersistOptions } from './unified-sync';

// Field lists (for reference/testing)
export {
  DATA_FIELDS,
  COMPLETION_FLAGS,
  PAYMENT_FIELDS,
  INVOICE_FIELDS,
  SUBMISSION_FIELDS,
  IDENTITY_FIELDS,
  FORBIDDEN_UPDATE_FIELDS,
  LOCAL_TO_DB_KEY_MAP,
  DB_TO_LOCAL_KEY_MAP,
  normalizeSurveyId,
  getAllDataFields,
  getAllCompletionFlags,
  getLocalStorageKey,
  getSupabaseField
} from './types';

// Core functions
export {
  loadAssessment,
  hydrateClientFromRecord,
  collectClientRecord,
  persistRecord,
  loadAndHydrate,
  collectAndPersist,
  getCurrentIdentity,
  forceSyncToSupabase
} from './unified-sync';

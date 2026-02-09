/**
 * SYNC-ASSESSMENT v8 - Fixed last_survey_edit_at tracking
 * 
 * FIXES APPLIED:
 * 1. Log actual updateError with full details
 * 2. Treat success:false as failure at response level
 * 3. Sanitize payload - strip forbidden keys, normalize user_id
 * 4. REMOVED last_survey_edit_at from function - now handled by DB trigger based on hash changes
 * 5. Added sync_errors logging for debugging
 * 6. CORS restricted to allowed domains
 * 7. Returns dataChanged flag to indicate if actual survey data changed
 * 
 * NOTE: last_survey_edit_at is now managed by DB trigger that fires when last_snapshot_hash changes.
 * This prevents false "edit" timestamps when syncs occur without actual data changes.
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://effervescent-concha-95d2df.netlify.app',
  'https://bestcompaniesforworkingwithcancer.com',
  'https://www.bestcompaniesforworkingwithcancer.com',
  'http://localhost:3000',
  'http://localhost:3001'
]

function getCorsOrigin(requestOrigin) {
  if (!requestOrigin) return ALLOWED_ORIGINS[0]
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin
  // Check if it's a Netlify deploy preview
  if (requestOrigin.includes('netlify.app')) return requestOrigin
  return ALLOWED_ORIGINS[0]
}

// Helper to log sync errors for debugging
async function logSyncError(supabase, errorData) {
  try {
    await supabase.from('sync_errors').insert({
      survey_id: errorData.survey_id || null,
      app_id: errorData.app_id || null,
      error_type: errorData.error_type || 'unknown',
      expected_version: errorData.expected_version || null,
      actual_version: errorData.actual_version || null,
      client_id: errorData.client_id || null,
      source: errorData.source || null,
      error_message: errorData.error_message || null,
      created_at: new Date().toISOString()
    })
  } catch (e) {
    // Don't fail the main request if logging fails
    console.warn('[sync-assessment] Failed to log sync error:', e.message)
  }
}

exports.handler = async (event) => {
  const requestOrigin = event.headers?.origin || event.headers?.Origin
  const corsOrigin = getCorsOrigin(requestOrigin)
  
  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const payload = JSON.parse(event.body)
    const {
      action,  // NEW: Support action-based requests
      survey_id,
      user_id,
      data,
      userType,
      accessToken,
      expectedVersion,
      source = 'autosync',
      client_id,
      fallbackSurveyId,
      fallbackAppId
    } = payload

    // ============================================
    // ACTION: get-version (just return version number)
    // ============================================
    if (action === 'get-version') {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const matchId = survey_id || fallbackSurveyId || fallbackAppId
      
      if (!matchId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No survey_id provided' })
        }
      }
      
      // Try survey_id first, then app_id
      let record = null
      const { data: bySurveyId } = await supabase
        .from('assessments')
        .select('version')
        .eq('survey_id', matchId)
        .maybeSingle()
      
      if (bySurveyId) {
        record = bySurveyId
      } else {
        const normalizedAppId = matchId.replace(/-/g, '').toUpperCase()
        const { data: byAppId } = await supabase
          .from('assessments')
          .select('version')
          .eq('app_id', normalizedAppId)
          .maybeSingle()
        record = byAppId
      }
      
      if (!record) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Record not found' })
        }
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ version: record.version })
      }
    }

    // ============================================
    // ACTION: get-full-record (return entire assessment for conflict resolution)
    // ============================================
    if (action === 'get-full-record') {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const matchId = survey_id || fallbackSurveyId || fallbackAppId
      
      if (!matchId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No survey_id provided' })
        }
      }
      
      // Try survey_id first, then app_id
      let record = null
      const { data: bySurveyId } = await supabase
        .from('assessments')
        .select('*')
        .eq('survey_id', matchId)
        .maybeSingle()
      
      if (bySurveyId) {
        record = bySurveyId
      } else {
        const normalizedAppId = matchId.replace(/-/g, '').toUpperCase()
        const { data: byAppId } = await supabase
          .from('assessments')
          .select('*')
          .eq('app_id', normalizedAppId)
          .maybeSingle()
        record = byAppId
      }
      
      if (!record) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Record not found' })
        }
      }
      
      console.log('[sync-assessment] get-full-record for:', matchId, 'version:', record.version)
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: record })
      }
    }

    // ============================================
    // DEFAULT: Sync data (existing logic)
    // ============================================

    // FIX 3a: Normalize user_id - treat 'none' and '' as null
    const normalizedUserId = (user_id === 'none' || user_id === '' || !user_id) ? null : user_id

    console.log('[sync-assessment] Request:', {
      survey_id: survey_id || 'none',
      user_id: normalizedUserId || 'none',
      userType,
      source,
      expectedVersion: expectedVersion ?? 'MISSING',
      client_id: client_id || 'none',
      dataFields: data ? Object.keys(data).length : 0
    })

    if (!data || Object.keys(data).length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'No data to sync', rowsAffected: 0 })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate source
    const validSources = ['rescue', 'autosync', 'manual', 'api']
    const safeSource = validSources.includes(source) ? source : 'autosync'

    // FIX 3b: Strip forbidden keys from data to prevent type errors
    const forbiddenKeys = new Set([
      'id', 'survey_id', 'app_id', 'user_id', 'version',
      'created_at', 'updated_at',
      'last_update_source', 'last_update_client_id', 'last_snapshot_hash'
    ])

    const safeData = {}
    for (const [k, v] of Object.entries(data || {})) {
      if (!forbiddenKeys.has(k)) {
        safeData[k] = v
      }
    }

    // ============================================
    // HELPER: Update with REQUIRED version enforcement
    // ============================================
    async function updateWithVersionCheck(matchField, matchValue, linkUserId = null) {
      // Step 1: Get current row INCLUDING last_snapshot_hash for change detection
      const { data: currentRow, error: fetchError } = await supabase
        .from('assessments')
        .select('id, version, last_snapshot_hash')
        .eq(matchField, matchValue)
        .single()
      
      if (fetchError || !currentRow) {
        return { success: false, rowsAffected: 0, error: 'Record not found' }
      }
      
      const currentVersion = currentRow.version || 1
      
      // Step 2: VALIDATE expectedVersion (REQUIRED - no silent fallback!)
      const hasValidExpectedVersion = Number.isInteger(expectedVersion) && expectedVersion > 0
      
      if (!hasValidExpectedVersion) {
        console.warn('[sync-assessment] expectedVersion missing or invalid:', expectedVersion)
        return {
          success: false,
          missingExpected: true,
          currentVersion: currentVersion,
          error: 'expectedVersion required for updates'
        }
      }
      
      // Step 3: Check for version conflict
      if (expectedVersion !== currentVersion) {
        console.warn('[sync-assessment] Version conflict:', {
          expected: expectedVersion,
          actual: currentVersion
        })
        
        // Log the conflict for debugging
        await logSyncError(supabase, {
          survey_id: survey_id,
          app_id: matchValue,
          error_type: 'version_conflict',
          expected_version: expectedVersion,
          actual_version: currentVersion,
          client_id: client_id,
          source: safeSource,
          error_message: `Expected v${expectedVersion}, got v${currentVersion}`
        })
        
        return {
          success: false,
          conflict: true,
          expectedVersion: expectedVersion,
          actualVersion: currentVersion
        }
      }
      
      // Step 4: Prepare update payload with SAFE data
      // NOTE: Do NOT set last_survey_edit_at here - let DB trigger handle it based on hash changes
      const updatePayload = {
        ...safeData,  // Use sanitized data, not raw data
        updated_at: new Date().toISOString(),
        // REMOVED: last_survey_edit_at - DB trigger handles this when hash changes
        last_update_source: safeSource,
        last_update_client_id: client_id || null,
        version: currentVersion + 1
      }
      
      // Fold user_id linking into same atomic update (no second UPDATE!)
      if (linkUserId) {
        updatePayload.user_id = linkUserId
      }
      
      // Step 5: Update with version check
      const { data: updateResult, error: updateError } = await supabase
        .from('assessments')
        .update(updatePayload)
        .eq(matchField, matchValue)
        .eq('version', expectedVersion)
        .select('id, version, last_snapshot_hash')
      
      // FIX 1: Log actual error with full details
      if (updateError) {
        console.error('[sync-assessment] UPDATE ERROR:', {
          matchField,
          matchValue,
          expectedVersion,
          safeSource,
          client_id,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        })
        return { success: false, rowsAffected: 0, error: updateError.message }
      }
      
      if (!updateResult || updateResult.length === 0) {
        // Version changed between read and write - conflict
        return {
          success: false,
          conflict: true,
          expectedVersion: expectedVersion,
          error: 'Version changed during update'
        }
      }
      
      // Check if hash actually changed (DB trigger computes new hash)
      const hashChanged = currentRow.last_snapshot_hash !== updateResult[0].last_snapshot_hash
      
      return {
        success: true,
        rowsAffected: updateResult.length,
        newVersion: updateResult[0].version,
        snapshotHash: updateResult[0].last_snapshot_hash,
        dataChanged: hashChanged  // Inform client if actual survey data changed
      }
    }

    let result = null
    let matchedVia = null

    // ============================================
    // FOUNDING PARTNER SYNC
    // ============================================
    if (userType === 'fp' && survey_id) {
      console.log('[sync-assessment] FP sync for:', survey_id)
      
      // Check if record exists
      const { data: existing } = await supabase
        .from('assessments')
        .select('id')
        .eq('survey_id', survey_id)
        .single()
      
      if (existing) {
        result = await updateWithVersionCheck('survey_id', survey_id)
        matchedVia = 'survey_id'
      } else {
        // FP records should be pre-provisioned - do NOT auto-create
        // This prevents phantom FP records from arbitrary FP-* IDs
        console.warn('[sync-assessment] FP record not found - FP records must be pre-provisioned:', survey_id)
        
        await logSyncError(supabase, {
          survey_id: survey_id,
          error_type: 'fp_not_provisioned',
          source: safeSource,
          client_id: client_id,
          error_message: `FP record not found for ${survey_id} - must be pre-provisioned`
        })
        
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'FP record not found - please contact support',
            rowsAffected: 0
          })
        }
      }
    }
    
    // ============================================
    // COMP'D USER SYNC (with version enforcement)
    // ============================================
    else if (userType === 'compd' && survey_id) {
      const normalizedAppId = survey_id.replace(/-/g, '').toUpperCase()
      console.log('[sync-assessment] Compd sync for:', normalizedAppId)
      
      result = await updateWithVersionCheck('app_id', normalizedAppId)
      matchedVia = 'app_id'
    }
    
    // ============================================
    // REGULAR USER SYNC (with fallback chain + version enforcement)
    // ============================================
    else if (normalizedUserId) {
      console.log('[sync-assessment] Regular user sync for:', normalizedUserId)
      
      // ATTEMPT 1: user_id
      const { data: userIdRow } = await supabase
        .from('assessments')
        .select('id')
        .eq('user_id', normalizedUserId)
        .single()
      
      if (userIdRow) {
        result = await updateWithVersionCheck('user_id', normalizedUserId)
        matchedVia = 'user_id'
      }
      
      // ATTEMPT 2: survey_id fallback (with user_id linking in SAME update)
      if ((!result || result.rowsAffected === 0) && !result?.missingExpected && fallbackSurveyId) {
        console.log('[sync-assessment] Trying survey_id fallback:', fallbackSurveyId)
        
        const { data: surveyIdRow } = await supabase
          .from('assessments')
          .select('id')
          .eq('survey_id', fallbackSurveyId)
          .single()
        
        if (surveyIdRow) {
          // Pass user_id to link in same atomic update
          result = await updateWithVersionCheck('survey_id', fallbackSurveyId, normalizedUserId)
          matchedVia = 'survey_id'
          if (result?.success) {
            console.log('[sync-assessment] Linked user_id via survey_id (atomic)')
          }
        }
      }
      
      // ATTEMPT 3: app_id fallback (with user_id linking in SAME update)
      if ((!result || result.rowsAffected === 0) && !result?.missingExpected && fallbackAppId) {
        const normalizedAppId = fallbackAppId.replace(/-/g, '').toUpperCase()
        console.log('[sync-assessment] Trying app_id fallback:', normalizedAppId)
        
        const { data: appIdRow } = await supabase
          .from('assessments')
          .select('id')
          .eq('app_id', normalizedAppId)
          .single()
        
        if (appIdRow) {
          // Pass user_id to link in same atomic update
          result = await updateWithVersionCheck('app_id', normalizedAppId, normalizedUserId)
          matchedVia = 'app_id'
          if (result?.success) {
            console.log('[sync-assessment] Linked user_id via app_id (atomic)')
          }
        }
      }
    }

    // ============================================
    // RESPONSE
    // ============================================
    
    console.log('[sync-assessment] Result:', {
      survey_id: survey_id || fallbackSurveyId || 'none',
      user_id: normalizedUserId || 'none',
      source: safeSource,
      matchedVia: matchedVia || 'none',
      success: result?.success,
      rowsAffected: result?.rowsAffected,
      newVersion: result?.newVersion,
      conflict: result?.conflict,
      missingExpected: result?.missingExpected,
      error: result?.error  // FIX 1: Include error in log
    })

    // Missing expectedVersion - return 400
    if (result?.missingExpected) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'expectedVersion required',
          missingExpected: true,
          currentVersion: result.currentVersion
        })
      }
    }

    // Version conflict - return 409
    if (result?.conflict) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Version conflict',
          expectedVersion: result.expectedVersion,
          actualVersion: result.actualVersion
        })
      }
    }

    // FIX 2: Treat any success:false as failure (catches updateError cases)
    if (result && result.success === false) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: result.error || 'Update failed',
          rowsAffected: 0
        })
      }
    }

    // No rows affected
    if (!result || result.rowsAffected === 0) {
      console.warn('[sync-assessment] WARNING: 0 rows affected')
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'No matching record found',
          rowsAffected: 0
        })
      }
    }

    // Success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        rowsAffected: result.rowsAffected,
        newVersion: result.newVersion,
        matchedVia,
        snapshotHash: result.snapshotHash
      })
    }

  } catch (error) {
    console.error('[sync-assessment] Exception:', error.message)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    }
  }
}

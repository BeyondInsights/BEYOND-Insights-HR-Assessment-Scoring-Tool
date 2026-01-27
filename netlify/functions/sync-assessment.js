/**
 * SYNC-ASSESSMENT v4 - Final fixes per ChatGPT review
 * 
 * FIXES APPLIED:
 * 1. expectedVersion is REQUIRED for updates (no silent fallback)
 * 2. Returns 400 if expectedVersion missing/invalid
 * 3. user_id linking folded into same atomic update (no second UPDATE)
 * 4. All paths enforce version check + return proper errors
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
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

    console.log('[sync-assessment] Request:', {
      survey_id: survey_id || 'none',
      user_id: user_id || 'none',
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

    // ============================================
    // HELPER: Update with REQUIRED version enforcement
    // ============================================
    async function updateWithVersionCheck(matchField, matchValue, linkUserId = null) {
      // Step 1: Get current row
      const { data: currentRow, error: fetchError } = await supabase
        .from('assessments')
        .select('id, version')
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
        return {
          success: false,
          conflict: true,
          expectedVersion: expectedVersion,
          actualVersion: currentVersion
        }
      }
      
      // Step 4: Prepare update payload (include user_id if linking)
      const updatePayload = {
        ...data,
        updated_at: new Date().toISOString(),
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
      
      if (updateError) {
        return { success: false, error: updateError.message }
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
      
      return {
        success: true,
        rowsAffected: updateResult.length,
        newVersion: updateResult[0].version,
        snapshotHash: updateResult[0].last_snapshot_hash
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
        // Insert new FP record (no version check needed for INSERT)
        console.log('[sync-assessment] Creating new FP record')
        const insertPayload = {
          survey_id,
          app_id: survey_id,
          is_founding_partner: true,
          payment_completed: true,
          payment_method: 'FP Comp',
          payment_amount: 1250.00,
          version: 1,
          ...data,
          updated_at: new Date().toISOString(),
          last_update_source: safeSource,
          last_update_client_id: client_id || null
        }
        
        const { data: insertResult, error: insertError } = await supabase
          .from('assessments')
          .insert(insertPayload)
          .select('id, version')
        
        if (insertError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: insertError.message })
          }
        }
        
        result = { success: true, rowsAffected: 1, newVersion: 1 }
        matchedVia = 'insert'
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
    else if (user_id) {
      console.log('[sync-assessment] Regular user sync for:', user_id)
      
      // ATTEMPT 1: user_id
      const { data: userIdRow } = await supabase
        .from('assessments')
        .select('id')
        .eq('user_id', user_id)
        .single()
      
      if (userIdRow) {
        result = await updateWithVersionCheck('user_id', user_id)
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
          result = await updateWithVersionCheck('survey_id', fallbackSurveyId, user_id)
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
          result = await updateWithVersionCheck('app_id', normalizedAppId, user_id)
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
      user_id: user_id || 'none',
      source: safeSource,
      matchedVia: matchedVia || 'none',
      success: result?.success,
      rowsAffected: result?.rowsAffected,
      newVersion: result?.newVersion,
      conflict: result?.conflict,
      missingExpected: result?.missingExpected
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

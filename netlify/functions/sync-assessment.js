// netlify/functions/sync-assessment.js
// 
// Secure assessment sync with service role.
// - CORS restricted to known origins
// - Access token required for regular users
// - Server owns updated_at
// - *** COMPANY VERIFICATION to prevent cross-contamination ***
//

const { createClient } = require('@supabase/supabase-js');

// ============================================
// CORS - Restrict to known origins
// ============================================
const ALLOWED_ORIGINS = new Set([
  'https://effervescent-concha-95d2df.netlify.app',
  'https://bestcompaniesindex.com',
  'https://www.bestcompaniesindex.com',
  'http://localhost:3000', // dev
]);

function getCorsHeaders(event) {
  const origin = event.headers.origin || event.headers.Origin || '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) 
    ? origin 
    : 'https://effervescent-concha-95d2df.netlify.app';
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function json(statusCode, obj, event) {
  return {
    statusCode,
    headers: { 
      'Content-Type': 'application/json',
      ...getCorsHeaders(event),
    },
    body: JSON.stringify(obj),
  };
}

// Validate UUID format
function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ============================================
// COMPANY VERIFICATION
// Checks if incoming data's company matches existing record
// ============================================
async function verifyCompanyMatch(supabase, matchColumn, matchValue, incomingData) {
  // Skip verification if no firmographics data in the update
  if (!incomingData.firmographics_data) {
    return { valid: true };
  }
  
  // Get incoming company name
  const incomingCompanyName = incomingData.firmographics_data?.companyName || 
                              incomingData.firmographics_data?.company_name || '';
  
  if (!incomingCompanyName) {
    return { valid: true }; // No company name to verify
  }
  
  // Fetch existing record
  const { data: existing, error } = await supabase
    .from('assessments')
    .select('company_name, firmographics_data')
    .eq(matchColumn, matchValue)
    .maybeSingle();
  
  if (error) {
    console.error('[sync-assessment] Error fetching existing record:', error.message);
    return { valid: true }; // Allow on error (fail open for existing functionality)
  }
  
  if (!existing) {
    return { valid: true }; // No existing record, this is a new insert
  }
  
  // Get existing company name
  const existingCompanyName = existing.company_name || 
                              existing.firmographics_data?.companyName ||
                              existing.firmographics_data?.company_name || '';
  
  if (!existingCompanyName) {
    return { valid: true }; // No existing company name to compare against
  }
  
  // Normalize for comparison
  const normalizeCompany = (name) => {
    return (name || '')
      .toLowerCase()
      .trim()
      .replace(/['']/g, "'")  // Normalize apostrophes
      .replace(/\s+/g, ' ');  // Normalize whitespace
  };
  
  const normalizedIncoming = normalizeCompany(incomingCompanyName);
  const normalizedExisting = normalizeCompany(existingCompanyName);
  
  // Check for match (exact or substring)
  const isMatch = normalizedIncoming === normalizedExisting ||
                  normalizedIncoming.includes(normalizedExisting) ||
                  normalizedExisting.includes(normalizedIncoming);
  
  if (!isMatch) {
    console.error(`[sync-assessment] COMPANY MISMATCH DETECTED!`);
    console.error(`  Existing company: "${existingCompanyName}"`);
    console.error(`  Incoming company: "${incomingCompanyName}"`);
    console.error(`  Survey ID: ${matchValue}`);
    return { 
      valid: false, 
      existingCompany: existingCompanyName,
      incomingCompany: incomingCompanyName,
      reason: 'Company name mismatch - possible cross-contamination'
    };
  }
  
  return { valid: true };
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' }, event);
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return json(500, { error: 'Server configuration error' }, event);
    }

    // Parse request body
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (e) {
      return json(400, { error: 'Invalid JSON body' }, event);
    }

    const { surveyId, data, accessToken, fallbackSurveyId, fallbackAppId } = payload;

    if (!surveyId) {
      return json(400, { error: 'Missing surveyId' }, event);
    }

    if (!data || typeof data !== 'object') {
      return json(400, { error: 'Missing or invalid data object' }, event);
    }

    // ============================================
    // DETERMINE MATCH COLUMN AND VALIDATE AUTH
    // ============================================
    
    let matchColumn;
    let matchValue = surveyId;

    // FP users: surveyId starts with FP-
    if (surveyId.startsWith('FP-') || surveyId.toUpperCase().startsWith('FPHR')) {
      matchColumn = 'survey_id';
      // Normalize FP IDs
      if (!surveyId.startsWith('FP-')) {
        matchValue = 'FP-' + surveyId.replace(/^FPHR/i, 'HR');
      }
    }
    // Regular authenticated users: surveyId is a UUID (user.id)
    else if (isUUID(surveyId)) {
      matchColumn = 'user_id';
      
      // REQUIRE access token for regular users
      if (!accessToken) {
        return json(401, { error: 'Authentication required for this user type' }, event);
      }
      
      // Validate the access token
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
      const { data: userData, error: authError } = await supabaseAuth.auth.getUser(accessToken);
      
      if (authError || !userData?.user) {
        console.error('Auth validation failed:', authError?.message);
        return json(401, { error: 'Invalid or expired access token' }, event);
      }
      
      // CRITICAL: Ensure the token belongs to the user they claim to be
      if (userData.user.id !== surveyId) {
        console.error('User ID mismatch:', userData.user.id, '!==', surveyId);
        return json(403, { error: 'Access token does not match surveyId' }, event);
      }
    }
    // Comp'd users or other app_id based users
    else {
      matchColumn = 'app_id';
      matchValue = surveyId.replace(/-/g, '').toUpperCase();
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // *** COMPANY VERIFICATION - ANTI-CONTAMINATION CHECK ***
    // ============================================
    const companyCheck = await verifyCompanyMatch(supabase, matchColumn, matchValue, data);
    
    if (!companyCheck.valid) {
      console.error(`[sync-assessment] REJECTING CONTAMINATED SYNC for ${matchValue}`);
      return json(409, { 
        error: 'Company mismatch detected',
        reason: companyCheck.reason,
        existingCompany: companyCheck.existingCompany,
        incomingCompany: companyCheck.incomingCompany,
        action: 'rejected'
      }, event);
    }

    // ============================================
    // BUILD UPDATE DATA - Server owns updated_at
    // ============================================
    
    // Remove client-side updated_at if present (server owns this)
    const { updated_at: _ignored, ...cleanData } = data;
    
    const updateData = {
      ...cleanData,
      updated_at: new Date().toISOString(), // Server sets this
    };

    // ============================================
    // UPSERT: Try update first, insert if no rows affected
    // ============================================
    
    const { data: updateResult, error: updateError } = await supabase
      .from('assessments')
      .update(updateData)
      .eq(matchColumn, matchValue)
      .select('id, updated_at, company_name');

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return json(500, { 
        error: 'Database update failed', 
        details: updateError.message,
        code: updateError.code 
      }, event);
    }

    // If no rows updated, try fallbacks before inserting
    if (!updateResult || updateResult.length === 0) {
      
      // ============================================
      // FALLBACK LOGIC: When user_id match fails, try survey_id then app_id
      // ============================================
      if (matchColumn === 'user_id') {
        console.log(`[sync-assessment] user_id matched 0 rows, trying fallbacks...`);
        
        // Fallback 1: Try survey_id
        if (fallbackSurveyId) {
          console.log(`[sync-assessment] Trying fallback survey_id: ${fallbackSurveyId}`);
          const { data: surveyResult, error: surveyError } = await supabase
            .from('assessments')
            .update(updateData)
            .eq('survey_id', fallbackSurveyId)
            .select('id, updated_at, company_name');
          
          if (!surveyError && surveyResult && surveyResult.length > 0) {
            // SUCCESS! Link user_id for future syncs
            await supabase
              .from('assessments')
              .update({ user_id: matchValue })
              .eq('survey_id', fallbackSurveyId);
            console.log(`[sync-assessment] Success via survey_id fallback! Linked user_id ${matchValue}`);
            return json(200, { 
              ok: true, 
              surveyId: fallbackSurveyId,
              updatedAt: surveyResult[0]?.updated_at,
              recordId: surveyResult[0]?.id,
              action: 'update_via_survey_id_fallback',
              linkedUserId: matchValue
            }, event);
          }
        }
        
        // Fallback 2: Try app_id
        if (fallbackAppId) {
          const normalizedAppId = fallbackAppId.replace(/-/g, '').toUpperCase();
          console.log(`[sync-assessment] Trying fallback app_id: ${normalizedAppId}`);
          const { data: appResult, error: appError } = await supabase
            .from('assessments')
            .update(updateData)
            .eq('app_id', normalizedAppId)
            .select('id, updated_at, company_name');
          
          if (!appError && appResult && appResult.length > 0) {
            // SUCCESS! Link user_id for future syncs
            await supabase
              .from('assessments')
              .update({ user_id: matchValue })
              .eq('app_id', normalizedAppId);
            console.log(`[sync-assessment] Success via app_id fallback! Linked user_id ${matchValue}`);
            return json(200, { 
              ok: true, 
              surveyId: normalizedAppId,
              updatedAt: appResult[0]?.updated_at,
              recordId: appResult[0]?.id,
              action: 'update_via_app_id_fallback',
              linkedUserId: matchValue
            }, event);
          }
        }
        
        console.log(`[sync-assessment] All fallbacks failed for user_id ${matchValue}`);
      }
      
      // No fallbacks worked (or not applicable) - try insert
      console.log(`[sync-assessment] No existing record for ${matchColumn}=${matchValue}, inserting...`);
      
      const insertData = {
        [matchColumn]: matchValue,
        ...updateData,
      };
      
      // Add fields based on user type
      if (matchColumn === 'survey_id' && (surveyId.startsWith('FP-') || surveyId.toUpperCase().startsWith('FPHR'))) {
        insertData.app_id = surveyId;
        insertData.is_founding_partner = true;
        insertData.payment_completed = true;
        insertData.payment_method = 'FP Comp';
        insertData.payment_amount = 1250.00;
      } else if (matchColumn === 'app_id') {
        insertData.survey_id = matchValue;
      }
      
      const { data: insertResult, error: insertError } = await supabase
        .from('assessments')
        .insert(insertData)
        .select('id, updated_at');
      
      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return json(500, { 
          error: 'Database insert failed', 
          details: insertError.message,
          code: insertError.code 
        }, event);
      }
      
      console.log(`[sync-assessment] Inserted new record for ${matchValue}`);
      return json(200, { 
        ok: true, 
        surveyId: matchValue,
        updatedAt: insertResult?.[0]?.updated_at,
        recordId: insertResult?.[0]?.id,
        action: 'insert'
      }, event);
    }

    console.log(`[sync-assessment] Updated ${matchValue} (company: ${updateResult[0]?.company_name || 'N/A'})`);
    return json(200, { 
      ok: true, 
      surveyId: matchValue,
      updatedAt: updateResult[0]?.updated_at,
      recordId: updateResult[0]?.id,
      action: 'update'
    }, event);

  } catch (err) {
    console.error('Sync function error:', err);
    return json(500, { error: 'Internal server error', details: String(err.message || err) }, event);
  }
};

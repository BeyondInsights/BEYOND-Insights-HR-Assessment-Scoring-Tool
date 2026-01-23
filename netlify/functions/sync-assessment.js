// netlify/functions/sync-assessment.js
// 
// Secure assessment sync with service role.
// - CORS restricted to known origins
// - Access token required for regular users
// - Server owns updated_at
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

    const { surveyId, data, accessToken } = payload;

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
    if (surveyId.startsWith('FP-')) {
      matchColumn = 'survey_id';
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
      .select('id, updated_at');

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return json(500, { 
        error: 'Database update failed', 
        details: updateError.message,
        code: updateError.code 
      }, event);
    }

    // If no rows updated, insert new record
    if (!updateResult || updateResult.length === 0) {
      console.log(`[sync-assessment] No existing record for ${matchColumn}=${matchValue}, inserting...`);
      
      const insertData = {
        [matchColumn]: matchValue,
        ...updateData,
      };
      
      // Add fields based on user type
      if (matchColumn === 'survey_id' && surveyId.startsWith('FP-')) {
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

    console.log(`[sync-assessment] Updated ${matchValue}`);
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

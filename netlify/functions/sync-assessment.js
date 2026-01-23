// netlify/functions/sync-assessment.js
// 
// Receives assessment data from the client and writes to Supabase using service role.
// This is more reliable than client-side Supabase calls, especially during page unload.
//

const { createClient } = require('@supabase/supabase-js');

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return json(500, { error: 'Server configuration error' });
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (e) {
      return json(400, { error: 'Invalid JSON body' });
    }

    const { surveyId, data, timestamp } = payload;

    if (!surveyId) {
      return json(400, { error: 'Missing surveyId' });
    }

    if (!data || typeof data !== 'object') {
      return json(400, { error: 'Missing or invalid data object' });
    }

    // Determine if FP (survey_id) or regular user (app_id)
    const isFP = surveyId.startsWith('FP-');
    const matchColumn = isFP ? 'survey_id' : 'app_id';

    // Build update object
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    // Perform upsert
    const { data: result, error } = await supabase
      .from('assessments')
      .update(updateData)
      .eq(matchColumn, surveyId)
      .select('id, updated_at')
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return json(500, { 
        error: 'Database update failed', 
        details: error.message,
        code: error.code 
      });
    }

    console.log(`[sync-assessment] Updated ${surveyId} at ${result.updated_at}`);

    return json(200, { 
      ok: true, 
      surveyId,
      updatedAt: result.updated_at,
      recordId: result.id
    });

  } catch (err) {
    console.error('Sync function error:', err);
    return json(500, { error: 'Internal server error', details: String(err.message || err) });
  }
};

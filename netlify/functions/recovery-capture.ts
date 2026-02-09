/**
 * RECOVERY-CAPTURE Netlify Function
 * 
 * Captures localStorage data for recovery incidents.
 * Uses service role to bypass RLS.
 * 
 * Security:
 * - Allowlist of survey IDs
 * - JWT verification (optional but recommended)
 * - Size limits
 */

import { createClient } from '@supabase/supabase-js';

// Only these survey IDs can use recovery capture
const ALLOWED_SURVEY_IDS = ['FP-421967'];

// Max payload size (1MB)
const MAX_PAYLOAD_SIZE = 1000000;

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function handler(event: any) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Tighten to your domain in production
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  // Check service key exists
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    return { statusCode: 500, headers, body: 'Server configuration error' };
  }

  // Size check
  if (event.body && event.body.length > MAX_PAYLOAD_SIZE) {
    return { statusCode: 413, headers, body: 'Payload too large' };
  }

  try {
    const payload = JSON.parse(event.body);

    // Validate survey_id exists
    if (!payload.survey_id) {
      return { statusCode: 400, headers, body: 'Missing survey_id' };
    }

    // Allowlist check
    if (!ALLOWED_SURVEY_IDS.includes(payload.survey_id)) {
      console.log('Recovery capture rejected - survey_id not in allowlist:', payload.survey_id);
      return { statusCode: 403, headers, body: 'Survey ID not authorized for recovery' };
    }

    // Optional: JWT verification
    // If Authorization header present, verify the user
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    let verifiedUserId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
      
      try {
        const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
        if (user && !error) {
          verifiedUserId = user.id;
          console.log('Recovery capture - verified user:', user.email);
        }
      } catch (e) {
        // JWT verification failed, but we still allow if survey_id is in allowlist
        console.log('JWT verification failed, proceeding with allowlist only');
      }
    }

    // Create service-role client for DB write
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if recovery_captures table exists, if not use audit_logs or assessments.notes
    const captureRecord = {
      survey_id: payload.survey_id,
      captured_at: payload.captured_at || new Date().toISOString(),
      source: 'auto-sync-recovery',
      user_agent: payload.user_agent || null,
      verified_user_id: verifiedUserId,
      payload: payload.localStorage_data,
      created_at: new Date().toISOString()
    };

    // Try recovery_captures table first
    let { error } = await supabase.from('recovery_captures').insert(captureRecord);

    if (error) {
      console.log('recovery_captures insert failed, trying assessments.notes backup:', error.message);
      
      // Fallback: store in assessments.notes field
      const notesBackup = JSON.stringify({
        recovery_capture: true,
        captured_at: captureRecord.captured_at,
        data_keys: Object.keys(payload.localStorage_data || {}),
        // Store truncated payload in notes (max 10KB for safety)
        payload_preview: JSON.stringify(payload.localStorage_data).substring(0, 10000)
      });

      const { error: notesError } = await supabase
        .from('assessments')
        .update({ 
          notes: notesBackup,
          last_update_source: 'recovery_capture'
        })
        .eq('survey_id', payload.survey_id);

      if (notesError) {
        console.error('Both recovery methods failed:', notesError);
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ 
            success: false, 
            error: 'Failed to store recovery data',
            details: notesError.message
          }) 
        };
      }

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ 
          success: true, 
          method: 'assessments.notes',
          message: 'Recovery data stored in assessments.notes'
        }) 
      };
    }

    console.log('Recovery capture successful for:', payload.survey_id);
    
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        success: true, 
        method: 'recovery_captures',
        message: 'Recovery data captured'
      }) 
    };

  } catch (e: any) {
    console.error('Recovery capture error:', e);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: e.message || 'Unknown error' }) 
    };
  }
}

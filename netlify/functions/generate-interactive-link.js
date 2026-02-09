// netlify/functions/generate-interactive-link.js
// SECURED VERSION - Requires admin authentication
// Generates and saves public_token/public_password for interactive report links

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Allowed origins - no wildcard!
const ALLOWED_ORIGINS = [
  'https://effervescent-concha-95d2df.netlify.app',
  'https://bestcompaniesforworkingwithcancer.com',
  'https://www.bestcompaniesforworkingwithcancer.com',
  'http://localhost:3000'
];

function getCorsOrigin(requestOrigin) {
  if (!requestOrigin) return ALLOWED_ORIGINS[0];
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  // Allow any netlify.app subdomain for previews
  if (requestOrigin.includes('netlify.app')) return requestOrigin;
  return ALLOWED_ORIGINS[0];
}

// Validate admin session
async function validateAdminSession(supabase, sessionToken) {
  if (!sessionToken) return null;
  
  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('email, role, expires_at')
    .eq('session_token', sessionToken)
    .single();
  
  if (error || !session) return null;
  
  // Check if expired
  if (new Date(session.expires_at) < new Date()) {
    return null;
  }
  
  return session;
}

exports.handler = async (event) => {
  const requestOrigin = event.headers?.origin || event.headers?.Origin;
  const corsOrigin = getCorsOrigin(requestOrigin);
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { assessmentId, adminSession } = JSON.parse(event.body || '{}');

    if (!assessmentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing assessmentId' }),
      };
    }

    // Initialize Supabase with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ============================================
    // ADMIN AUTHENTICATION REQUIRED
    // ============================================
    const session = await validateAdminSession(supabase, adminSession);
    
    if (!session) {
      console.log('[generate-interactive-link] Unauthorized attempt - no valid session');
      
      // Log the unauthorized attempt
      await supabase.from('admin_audit_log').insert({
        event_type: 'unauthorized_link_generation',
        user_email: 'unknown',
        ip_address: event.headers?.['x-forwarded-for'] || event.headers?.['client-ip'] || 'unknown',
        details: { assessmentId, reason: 'No valid admin session' },
        user_agent: event.headers?.['user-agent'] || 'unknown'
      });
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Admin authentication required' }),
      };
    }

    // Check if assessment exists and already has a token
    const { data: existing, error: fetchError } = await supabase
      .from('assessments')
      .select('id, public_token, public_password, company_name, survey_id')
      .eq('id', assessmentId)
      .single();

    if (fetchError || !existing) {
      console.error('[generate-interactive-link] Assessment not found:', assessmentId);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Assessment not found' }),
      };
    }

    // If token already exists, return it
    if (existing.public_token && existing.public_password) {
      console.log(`[generate-interactive-link] Returning existing token for ${existing.company_name} (by ${session.email})`);
      
      // Log the access
      await supabase.from('admin_audit_log').insert({
        event_type: 'link_retrieved',
        user_email: session.email,
        ip_address: event.headers?.['x-forwarded-for'] || event.headers?.['client-ip'] || 'unknown',
        details: { assessmentId, companyName: existing.company_name, surveyId: existing.survey_id },
        user_agent: event.headers?.['user-agent'] || 'unknown'
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token: existing.public_token,
          password: existing.public_password,
          companyName: existing.company_name,
          surveyId: existing.survey_id,
          isExisting: true,
        }),
      };
    }

    // ============================================
    // GENERATE SECURE TOKEN & PASSWORD
    // ============================================
    // 256-bit token (32 bytes = 64 hex chars) - much stronger than before
    const token = crypto.randomBytes(32).toString('hex');
    // 8 character password (more entropy)
    const password = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Save to database
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        public_token: token,
        public_password: password,
        public_link_created_at: new Date().toISOString(),
        public_link_created_by: session.email
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('[generate-interactive-link] Error saving token:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to save link', details: updateError.message }),
      };
    }

    console.log(`[generate-interactive-link] Generated new token for ${existing.company_name} (by ${session.email})`);

    // Log the generation
    await supabase.from('admin_audit_log').insert({
      event_type: 'link_generated',
      user_email: session.email,
      ip_address: event.headers?.['x-forwarded-for'] || event.headers?.['client-ip'] || 'unknown',
      details: { assessmentId, companyName: existing.company_name, surveyId: existing.survey_id },
      user_agent: event.headers?.['user-agent'] || 'unknown'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        password,
        companyName: existing.company_name,
        surveyId: existing.survey_id,
        isExisting: false,
      }),
    };

  } catch (err) {
    console.error('[generate-interactive-link] Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', details: err.message }),
    };
  }
};

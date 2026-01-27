// netlify/functions/get-assessment-by-token.js
// Fetches assessment metadata by public_token using service role key to bypass RLS
// SECURITY: Does NOT return public_password - password verification happens via verify-report-password.js

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Handle CORS preflight FIRST (before method validation)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  // Allow both GET and POST for flexibility
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  try {
    // Get token from query params (GET) or body (POST)
    let token;
    if (event.httpMethod === 'GET') {
      token = event.queryStringParameters?.token;
    } else {
      const body = JSON.parse(event.body || '{}');
      token = body.token;
    }

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing token parameter' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Find assessment by public_token - only return minimal metadata
    // SECURITY: Do NOT return public_password here
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, company_name, survey_id, public_token, public_link_created_at')
      .eq('public_token', token)
      .single();

    if (assessmentError || !assessment) {
      console.error('Assessment not found for token:', token, assessmentError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Report not found or link has expired' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Return only metadata needed for the password screen
    // Full report data is fetched via get-public-report.js AFTER password verification
    return {
      statusCode: 200,
      body: JSON.stringify({
        found: true,
        companyName: assessment.company_name,
        surveyId: assessment.survey_id,
        passwordRequired: true,
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };

  } catch (err) {
    console.error('Error in get-assessment-by-token:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', details: err.message }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};

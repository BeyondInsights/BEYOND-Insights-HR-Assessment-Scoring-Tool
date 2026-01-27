// netlify/functions/get-assessment-by-token.js
// Fetches assessment data by public_token using service role key to bypass RLS
// This is needed because the public report page cannot query directly due to RLS policies

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
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

  // Handle CORS preflight
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

    // Find assessment by public_token
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
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

    // Also fetch all assessments for benchmarking (needed by the report page)
    const { data: allAssessments, error: allError } = await supabase
      .from('assessments')
      .select('*');

    if (allError) {
      console.error('Error fetching all assessments:', allError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        assessment,
        allAssessments: allAssessments || [],
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

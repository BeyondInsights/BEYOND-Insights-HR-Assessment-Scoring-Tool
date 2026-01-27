// netlify/functions/verify-report-password.js
// Verifies password for public report access - SERVER-SIDE validation

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Handle CORS preflight FIRST
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  try {
    const { token, password } = JSON.parse(event.body || '{}');

    if (!token || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing token or password' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Find assessment with this token
    const { data, error } = await supabase
      .from('assessments')
      .select('id, public_password, company_name, survey_id')
      .eq('public_token', token)
      .single();

    if (error || !data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Report not found or link has expired' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Verify password (case-sensitive comparison)
    if (data.public_password !== password) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Incorrect password' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Password correct - return assessment ID for data loading
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        assessmentId: data.id,
        surveyId: data.survey_id,
        companyName: data.company_name
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };

  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};

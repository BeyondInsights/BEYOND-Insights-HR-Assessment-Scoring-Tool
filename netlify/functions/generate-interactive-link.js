// netlify/functions/generate-interactive-link.js
// Generates and saves public_token/public_password for interactive report links
// Uses service role key to bypass RLS for the UPDATE operation

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Handle CORS preflight FIRST (before method validation)
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
    const { assessmentId } = JSON.parse(event.body || '{}');

    if (!assessmentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing assessmentId' }),
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

    // First, check if assessment exists and already has a token
    const { data: existing, error: fetchError } = await supabase
      .from('assessments')
      .select('id, public_token, public_password, company_name, survey_id')
      .eq('id', assessmentId)
      .single();

    if (fetchError || !existing) {
      console.error('Assessment not found:', assessmentId, fetchError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Assessment not found' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // If token already exists, return it
    if (existing.public_token && existing.public_password) {
      console.log('Returning existing token for:', existing.company_name);
      return {
        statusCode: 200,
        body: JSON.stringify({
          token: existing.public_token,
          password: existing.public_password,
          companyName: existing.company_name,
          surveyId: existing.survey_id,
          isExisting: true,
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Generate new token and password
    // Use crypto for better randomness in Node.js
    const crypto = require('crypto');
    const token = crypto.randomBytes(8).toString('hex'); // 16 character hex string
    const password = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 character password

    // Save to database
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        public_token: token,
        public_password: password,
        public_link_created_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Error saving token:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save link', details: updateError.message }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    console.log('Generated new token for:', existing.company_name, 'token:', token);

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        password,
        companyName: existing.company_name,
        surveyId: existing.survey_id,
        isExisting: false,
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };

  } catch (err) {
    console.error('Error in generate-interactive-link:', err);
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

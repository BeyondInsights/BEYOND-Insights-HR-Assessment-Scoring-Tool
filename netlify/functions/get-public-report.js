// netlify/functions/get-public-report.js
// Loads report data for authenticated public access

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const { assessmentId, surveyId } = JSON.parse(event.body || '{}');

    if (!assessmentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing assessmentId' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Load assessment data
    const { data: company, error: companyError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (companyError || !company) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Assessment not found' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Load dimension scores
    const { data: scores } = await supabase
      .from('assessment_scores')
      .select('*')
      .eq('assessment_id', assessmentId);

    // Load benchmarks
    const { data: benchmarks } = await supabase
      .from('benchmarks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Load element details
    const { data: elementDetails } = await supabase
      .from('element_details')
      .select('*')
      .eq('survey_id', surveyId || company.survey_id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        company,
        scores: scores || [],
        benchmarks,
        elementDetails: elementDetails || []
      }),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};

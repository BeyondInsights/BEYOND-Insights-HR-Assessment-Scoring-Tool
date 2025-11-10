import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: assessment } = await supabase
      .from('assessments')
      .select('survey_id, company_name, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!assessment) {
      return new Response(
        JSON.stringify({ error: 'No assessment found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }

    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: email }], subject: 'Your Survey ID' }],
        from: { email: 'support@beyondinsights.com', name: 'BEYOND Insights' },
        content: [{
          type: 'text/html',
          value: `<h1>Your Survey ID: ${assessment.survey_id}</h1><p>Company: ${assessment.company_name}</p>`
        }]
      })
    })

    if (!emailResponse.ok) throw new Error('Email failed')

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
})

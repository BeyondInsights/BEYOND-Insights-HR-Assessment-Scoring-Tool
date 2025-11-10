// supabase/functions/send-survey-id/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RequestBody {
  email: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json() as RequestBody
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Look up user by email
    const { data: assessment, error: lookupError } = await supabase
      .from('assessments')
      .select('survey_id, company_name, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (lookupError || !assessment) {
      return new Response(
        JSON.stringify({ error: 'No assessment found for this email address' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log the request
    await supabase
      .from('survey_id_requests')
      .insert({
        email: email.toLowerCase().trim(),
        survey_id: assessment.survey_id,
        company_name: assessment.company_name,
        requested_at: new Date().toISOString(),
        status: 'sending'
      })

    // Send email via SendGrid
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: email.toLowerCase().trim() }],
          subject: 'Your Survey ID - Best Companies for Working with Cancer Index'
        }],
        from: {
          email: 'support@beyondinsights.com',
          name: 'BEYOND Insights Support'
        },
        reply_to: {
          email: 'info@cancerandcareers.org',
          name: 'Cancer and Careers'
        },
        content: [{
          type: 'text/html',
          value: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(to right, #ff6b35, #ff8c61);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .survey-id-box {
      background: #f3f4f6;
      border: 2px solid #ff6b35;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
      border-radius: 8px;
    }
    .survey-id {
      font-size: 24px;
      font-weight: bold;
      color: #ff6b35;
      font-family: monospace;
      letter-spacing: 2px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(to right, #ff6b35, #ff8c61);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-radius: 0 0 8px 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your Survey ID</h1>
    <p>Best Companies for Working with Cancer Index</p>
  </div>
  
  <div class="content">
    <p>Hello,</p>
    
    <p>Thank you for your request. Your Survey ID has been retrieved from our system.</p>
    
    <div class="survey-id-box">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Your Survey ID:</p>
      <div class="survey-id">${assessment.survey_id}</div>
    </div>
    
    <p><strong>Company:</strong> ${assessment.company_name}</p>
    
    <p>Use this Survey ID to log in to your assessment dashboard:</p>
    
    <div style="text-align: center;">
      <a href="https://effervescent-concha-95d2df.netlify.app/login" class="button">
        Return to Assessment →
      </a>
    </div>
    
    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <strong>Need help?</strong><br>
      Contact us at <a href="mailto:info@cancerandcareers.org">info@cancerandcareers.org</a>
    </p>
  </div>
  
  <div class="footer">
    <p><strong>BEYOND Insights</strong> | Cancer and Careers</p>
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
          `
        }]
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('SendGrid error:', errorText)
      
      // Update status to failed
      await supabase
        .from('survey_id_requests')
        .update({ status: 'failed' })
        .eq('email', email.toLowerCase().trim())
        .eq('status', 'sending')
      
      throw new Error('Failed to send email')
    }

    // Update status to sent
    await supabase
      .from('survey_id_requests')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'sending')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Survey ID sent successfully' 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while sending the email',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// FILE: /supabase/functions/send-app-id-reminder/index.ts
// This is a Supabase Edge Function that sends the App ID reminder email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { email, appId, companyName } = await req.json()

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Best Companies <noreply@cancerandcareers.org>',
        to: [email],
        subject: 'Your Application ID - Best Companies for Working with Cancer',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7A34A3;">Your Application ID</h2>
            
            <p>Hello${companyName ? ` from ${companyName}` : ''},</p>
            
            <p>You requested your Application ID for the Best Companies for Working with Cancer employer assessment.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">Your Application ID:</p>
              <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #111827; font-family: monospace; letter-spacing: 2px;">
                ${appId}
              </p>
            </div>
            
            <p>
              <a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://your-app.netlify.app'}" 
                 style="display: inline-block; background: #7A34A3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Continue Your Assessment
              </a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you didn't request this email, please ignore it.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            
            <p style="color: #9ca3af; font-size: 12px;">
              Best Companies for Working with Cancer<br />
              Cancer and Careers
            </p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

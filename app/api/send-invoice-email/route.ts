import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, name, invoiceUrl, dashboardUrl } = await request.json()

    const { data, error } = await resend.emails.send({
      from: 'Cancer and Careers <invoices@notifications.beyondinsights.com>',
      to: [email],
      subject: 'Cancer and Careers: Invoice Confirmation and Dashboard Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://www.cancerandcareers.org/sites/default/files/cac-logo.png" alt="Cancer and Careers" style="height: 60px;">
          </div>
          
          <p>Dear ${name},</p>
          
          <p>Thank you for participating in the Cancer and Careers Best Companies for Working With Cancer initiative!</p>
          
          <p style="margin: 25px 0;">
            <a href="${invoiceUrl}" style="display: inline-block; padding: 12px 30px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Click here to download your invoice
            </a>
          </p>
          
          <p>Please submit payment within 30 days. Note that payment must be complete to receive your benchmarking report and consideration for the 2026 Cancer and Careers Best Companies for Working With Cancer Index.</p>
          
          <p style="margin: 25px 0;">
            You may continue with the survey by <a href="${dashboardUrl}" style="color: #F37021; text-decoration: none; font-weight: bold;">logging into your survey dashboard here</a>. Please submit your survey responses by <strong>January 23, 2026</strong>.
          </p>
          
          <p>Thank you for taking part in this important initiative. By participating, your organization is playing a vital role in shaping the future of workplace support for employees.</p>
          
          <p style="margin-top: 30px;">
            With appreciation,<br>
            <strong>The Cancer and Careers Team</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #6b7280;">
            For any questions, contact <a href="mailto:cacbestcompanies@cew.org" style="color: #F37021;">cacbestcompanies@cew.org</a>
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Email send error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

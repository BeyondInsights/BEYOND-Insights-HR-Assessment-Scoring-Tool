import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, name, invoiceUrl, dashboardUrl, invoicePdfBase64 } = await request.json()
    
    // Create attachments array if we have the PDF
    const attachments = invoicePdfBase64 ? [{
      filename: `CAC-Invoice-${new Date().toISOString().split('T')[0]}.pdf`,
      content: invoicePdfBase64,
    }] : []

    const { data, error } = await resend.emails.send({
      from: 'Cancer and Careers <invoices@notifications.beyondinsights.com>',
      to: [email],
      subject: 'Your CAC Best Companies Initiative Invoice & Survey Access',
      attachments,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
          
          <!-- Main Container -->
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                
                <!-- Email Card -->
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background-color: #ffffff; padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                 <img src="https://i.imgur.com/3KIzUDO.png" 
                   alt="Cancer and Careers" 
                   style="display: block; margin: 0 auto;">
                      <h1 style="color: #1a1a1a; font-size: 22px; font-weight: 600; margin: 25px 0 10px 0; letter-spacing: -0.5px;">
                        Best Companies for Working with Cancer
                      </h1>
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                        2026 Initiative
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Welcome Message -->
                  <tr>
                    <td style="padding: 35px 40px 25px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                        ${name && name.trim() ? `Dear ${name},` : 'Hello,'}
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 15px 0 0 0;">
                        Thank you for participating in the <strong>Cancer and Careers Best Companies for Working With Cancer</strong> Initiative. 
                        Your organization's commitment to this Initiative demonstrates leadership in workplace support.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Invoice Section -->
                  <tr>
                    <td style="padding: 0 40px;">
                      <table role="presentation" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;">
                        <tr>
                          <td style="padding: 20px;">
                            <table role="presentation" style="width: 100%;">
                              <tr>
                                <td style="vertical-align: top; width: 40px;">
                                  <!-- Document Icon SVG -->
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B2C91" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                  </svg>
                                </td>
                                <td style="padding-left: 15px;">
                                  <h3 style="color: #1a1a1a; font-size: 17px; font-weight: 600; margin: 0 0 8px 0;">
                                    Invoice Attached
                                  </h3>
                                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 15px 0;">
                                    Your invoice has been attached to this email as a PDF document. 
                                    You may also access it online for your records.
                                  </p>
                                  <a href="${invoiceUrl}" 
                                     style="display: inline-block; padding: 10px 20px; background-color: #6B2C91; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                                    View Invoice Online
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Payment Terms -->
                  <tr>
                    <td style="padding: 25px 40px;">
                      <table role="presentation" style="width: 100%; background-color: #fef8f1; border-left: 3px solid #FF6B35; padding: 15px;">
                        <tr>
                          <td style="padding-left: 20px;">
                            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">
                              Payment Terms
                            </p>
                            <p style="color: #78350f; font-size: 14px; margin: 8px 0 0 0; line-height: 1.5;">
                              Payment is due within 30 days. Full payment is required to receive your benchmarking report 
                              and consideration for the 2026 Cancer and Careers Best Companies for Working With Cancer Initiative.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Survey Dashboard Access -->
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <table role="presentation" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;">
                        <tr>
                          <td style="padding: 20px;">
                            <table role="presentation" style="width: 100%;">
                              <tr>
                                <td style="vertical-align: top; width: 40px;">
                                  <!-- Dashboard Icon SVG -->
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A896" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="3" y1="9" x2="21" y2="9"></line>
                                    <line x1="9" y1="21" x2="9" y2="9"></line>
                                  </svg>
                                </td>
                                <td style="padding-left: 15px;">
                                  <h3 style="color: #1a1a1a; font-size: 17px; font-weight: 600; margin: 0 0 8px 0;">
                                    Complete Your Survey
                                  </h3>
                                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 15px 0;">
                                    Access your personalized dashboard to continue with the survey questions.
                                  </p>
                                  <a href="${dashboardUrl}" 
                                     style="display: inline-block; padding: 10px 20px; background-color: #00A896; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                                    Access Survey Dashboard
                                  </a>
                                  <p style="color: #991b1b; font-size: 13px; margin: 15px 0 0 0; font-weight: 500;">
                                    Submission Deadline: January 23, 2026
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Closing -->
                  <tr>
                    <td style="padding: 20px 40px 35px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0;">
                        Thank you again for participating. 
                        Your responses will improve workplaces for all employees. 
                      </p>
                      <p style="color: #1a1a1a; font-size: 15px; margin: 25px 0 0 0;">
                        With appreciation,
                      </p>
                      <p style="color: #1a1a1a; font-size: 15px; margin: 5px 0 0 0;">
                        <strong>The Cancer and Careers Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 25px 40px;">
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">
                              For questions or assistance, please contact:
                            </p>
                            <a href="mailto:cacbestcompanies@cew.org" 
                               style="color: #6B2C91; text-decoration: none; font-weight: 600; font-size: 14px;">
                              cacbestcompanies@cew.org
                            </a>
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                              <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.5;">
                                © ${new Date().getFullYear()} Cancer and Careers. All rights reserved.<br>
                                A program of Cancer and Work & Employment | Powered by BEYOND Insights
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                </table>
                
              </td>
            </tr>
          </table>
          
        </body>
        </html>
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

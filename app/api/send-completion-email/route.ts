import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      name, 
      companyName,
      employeeSurveyOptIn,
      dashboardUrl 
    } = await request.json()

    const { data, error } = await resend.emails.send({
      from: 'Cancer and Careers <survey@notifications.beyondinsights.com>',
      to: [email],
      subject: 'Thank You - Survey Successfully Submitted',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
          
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Purple accent bar -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6B2C91 0%, #4A90E2 100%); height: 4px; padding: 0;"></td>
                  </tr>
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #ffffff; padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                      <img src="https://i.imgur.com/3KIzUDO.png" 
                           alt="Cancer and Careers" 
                           style="display: block; margin: 0 auto; max-width: 200px;">
                      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 30px 0 10px 0;">
                        Thank You!
                      </h1>
                      <p style="color: #6B2C91; font-size: 16px; margin: 0; font-weight: 600;">
                        Survey Successfully Submitted
                      </p>
                      ${companyName ? `
                        <p style="color: #6b7280; font-size: 15px; margin: 15px 0 0 0;">
                          ${companyName}
                        </p>
                      ` : ''}
                    </td>
                  </tr>
                  
                  <!-- Main Message -->
                  <tr>
                    <td style="padding: 35px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                        ${name && name.trim() ? `Dear ${name},` : 'Hello,'}
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                        You have successfully submitted your company's survey responses for the <strong>Cancer and Careers Best Companies for Working With Cancer Initiative</strong>. By participating, your organization is playing a vital role in shaping the future of workplace support for employees managing cancer and other serious health conditions.
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 15px 0 0 0;">
                        Your participation will truly impact workplaces for those impacted by cancer or other serious health conditions.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Dashboard Access -->
                  <tr>
                    <td style="padding: 0 40px 25px;">
                      <table role="presentation" style="width: 100%; background-color: #f3e8ff; border-left: 3px solid #6B2C91; border-radius: 8px;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #4c1d95; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
                              📄 Dashboard Access
                            </p>
                            <p style="color: #5b21b6; font-size: 14px; margin: 0; line-height: 1.5;">
                              You may download your submitted responses at any time by visiting your dashboard. All your survey data is securely saved and accessible whenever you need it.
                            </p>
                            <a href="${dashboardUrl}" 
                               style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #6B2C91; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                              Access Dashboard
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  ${employeeSurveyOptIn !== null ? `
                  <!-- Employee Survey Status -->
                  <tr>
                    <td style="padding: 0 40px 25px;">
                      <table role="presentation" style="width: 100%; background-color: ${employeeSurveyOptIn ? '#d1fae5' : '#f3f4f6'}; border-left: 3px solid ${employeeSurveyOptIn ? '#10b981' : '#6b7280'}; border-radius: 8px;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: ${employeeSurveyOptIn ? '#065f46' : '#374151'}; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
                              ${employeeSurveyOptIn ? '✅ Employee Survey - Opted In' : 'Employee Survey - Not Selected'}
                            </p>
                            <p style="color: ${employeeSurveyOptIn ? '#047857' : '#4b5563'}; font-size: 14px; margin: 0; line-height: 1.5;">
                              ${employeeSurveyOptIn 
                                ? 'BEYOND Insights will contact you at this email address to provide your unique employee survey link and setup details.' 
                                : 'You can update this preference later from your dashboard if you change your mind.'}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ''}
                  
                  <!-- Timeline -->
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <h2 style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
                        📅 What Happens Next?
                      </h2>
                      
                      <!-- Step 1 -->
                      <table role="presentation" style="width: 100%; margin-bottom: 15px;">
                        <tr>
                          <td style="vertical-align: top; width: 40px;">
                            <div style="width: 32px; height: 32px; background-color: #4A90E2; border-radius: 50%; color: #ffffff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 32px;">
                              1
                            </div>
                          </td>
                          <td style="padding-left: 15px;">
                            <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 5px 0;">
                              Survey Close: January 23, 2026
                            </p>
                            <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.5;">
                              BEYOND Insights will conduct and finalize analysis following the close of the survey.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Step 2 -->
                      <table role="presentation" style="width: 100%; margin-bottom: 15px;">
                        <tr>
                          <td style="vertical-align: top; width: 40px;">
                            <div style="width: 32px; height: 32px; background-color: #6B2C91; border-radius: 50%; color: #ffffff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 32px;">
                              2
                            </div>
                          </td>
                          <td style="padding-left: 15px;">
                            <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 5px 0;">
                              Initiative Release
                            </p>
                            <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.5;">
                              The Cancer and Careers 2026 Best Companies for Working With Cancer Initiative release is scheduled to be announced in early March, 2026.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Step 3 -->
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="vertical-align: top; width: 40px;">
                            <div style="width: 32px; height: 32px; background-color: #00A896; border-radius: 50%; color: #ffffff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 32px;">
                              3
                            </div>
                          </td>
                          <td style="padding-left: 15px;">
                            <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 5px 0;">
                              Benchmarking Reports: Distributed March 2026
                            </p>
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; line-height: 1.5;">
                              Benchmarking Reports are included with the survey fee. All reports are completely confidential and shared back only to the participating company.
                            </p>
                            <p style="color: #dc2626; font-size: 13px; margin: 0; font-weight: 500; font-style: italic;">
                              No individual data is shared with the public or any other participating company.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Closing -->
                  <tr>
                    <td style="padding: 20px 40px 35px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0;">
                        Thank you again for participating. Your responses will improve workplaces for all employees.
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
                                A program of CEW Foundation | Powered by BEYOND Insights
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
      console.error('Completion email send error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to send completion email' },
      { status: 500 }
    )
  }
}

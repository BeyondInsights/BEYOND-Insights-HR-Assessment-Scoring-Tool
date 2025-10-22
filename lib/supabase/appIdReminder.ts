import { supabase } from './client'

export interface AppIdReminderResult {
  success: boolean
  message: string
}

/**
 * Send App ID reminder email to user
 */
export async function sendAppIdReminder(email: string): Promise<AppIdReminderResult> {
  try {
    // Look up all assessments for this email
    const { data: assessments, error: fetchError } = await supabase
      .from('assessments')
      .select('app_id, created_at, status')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching assessments:', fetchError)
      return {
        success: false,
        message: 'Failed to look up Application ID. Please try again.'
      }
    }

    if (!assessments || assessments.length === 0) {
      return {
        success: false,
        message: 'No assessment found with this email address. Please check your email or start a new assessment.'
      }
    }

    // Get the most recent assessment
    const latestAssessment = assessments[0]

    // Send magic link (which will also serve as reminder)
    const { error: emailError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          app_id: latestAssessment.app_id,
          is_reminder: true
        }
      }
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      return {
        success: false,
        message: 'Failed to send reminder email. Please try again.'
      }
    }

    return {
      success: true,
      message: `We've sent an email to ${email} with your Application ID and a link to continue your assessment.`
    }
  } catch (error) {
    console.error('App ID reminder error:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Format App ID with dashes for display
 */
export function formatAppIdForDisplay(appId: string): string {
  if (appId.length !== 13) return appId
  return `${appId.slice(0, 3)}-${appId.slice(3, 9)}-${appId.slice(9)}`
}

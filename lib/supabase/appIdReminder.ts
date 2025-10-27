// FILE: /lib/supabase/appIdReminder.ts

import { supabase } from './client'

export async function sendAppIdReminder(email: string) {
  try {
    // 1. Look up the user's App ID
    const { data, error } = await supabase
      .from('assessments')
      .select('app_id, company_name')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !data) {
      return {
        success: false,
        message: 'No account found with that email address'
      }
    }

    // 2. Send email with App ID via Supabase Edge Function
    const { error: emailError } = await supabase.functions.invoke('send-app-id-reminder', {
      body: {
        email: email.toLowerCase().trim(),
        appId: data.app_id,
        companyName: data.company_name || ''
      }
    })

    if (emailError) {
      console.error('Email error:', emailError)
      return {
        success: false,
        message: 'Error sending email. Please try again or contact support.'
      }
    }

    return {
      success: true,
      message: 'Your Application ID has been sent to your email address'
    }
  } catch (err) {
    console.error('Error:', err)
    return {
      success: false,
      message: 'An error occurred. Please try again.'
    }
  }
}









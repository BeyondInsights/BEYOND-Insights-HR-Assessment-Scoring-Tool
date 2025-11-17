import { supabase } from './client'
import { generateAppId, isValidEmail } from './utils'

export interface AuthResult {
  mode: 'new' | 'existing' | 'error'
  needsVerification: boolean
  message: string
  appId?: string
  error?: string
}

export async function authenticateUser(
  email: string,
  surveyId?: string
): Promise<AuthResult> {
  try {
    if (!isValidEmail(email)) {
      return {
        mode: 'error',
        needsVerification: false,
        message: 'Please enter a valid email address',
        error: 'Invalid email format'
      }
    }

    // NEW USER - No survey ID provided
    if (!surveyId) {
      const appId = generateAppId()
      const tempPassword = appId  // Use Survey ID as password

      console.log('[AUTH] Creating new user account...')
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            app_id: appId
          }
        }
      })

      if (signUpError) {
        console.error('[AUTH] Signup error:', signUpError)
        return {
          mode: 'error',
          needsVerification: false,
          message: 'Unable to create account. Please try again.',
          error: signUpError.message
        }
      }

      if (authData.user) {
        const { error: insertError } = await supabase
          .from('assessments')
          .insert({
            user_id: authData.user.id,
            email,
            app_id: appId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('[AUTH] Assessment insert error:', insertError)
        }

        console.log('[AUTH] Signing in new user to establish session...')
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: tempPassword
        })

        if (signInError) {
          console.error('[AUTH] Auto sign-in error:', signInError)
        } else {
          console.log('[AUTH] Session established successfully!')
        }

        return {
          mode: 'new',
          needsVerification: false,
          message: 'Account created successfully!',
          appId
        }
      }
    }
// EXISTING USER - Survey ID provided
if (surveyId) {
  const cleanSurveyId = surveyId.replace(/-/g, '')
  
  console.log('[AUTH] Looking up existing user')
  
  const { data: assessments, error: queryError } = await supabase
    .from('assessments')
    .select('*')
    .eq('app_id', cleanSurveyId)
    .limit(1)

  if (queryError) {
    console.error('[AUTH] Query error:', queryError)
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Unable to verify Survey ID. Please try again.',
      error: queryError.message
    }
  }

  if (!assessments || assessments.length === 0) {
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Survey ID not found. Please check and try again.',
      error: 'Survey ID not found'
    }
  }

  const assessment = assessments[0]
  
  if (assessment.email.toLowerCase() !== email.toLowerCase()) {
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Email does not match Survey ID. Please check and try again.',
      error: 'Email mismatch'
    }
  }

  // ============================================
  // FIX: Generate new password and update user
  // ============================================
  const newPassword = Math.random().toString(36).slice(-12) + 'Aa1!'
  
  console.log('[AUTH] Resetting password for returning user')
  
  // First, sign in as admin to update the password
  const { data: { user: adminUser }, error: adminError } = await supabase.auth.admin.getUserById(assessment.user_id)
  
  if (adminError || !adminUser) {
    console.log('[AUTH] Could not find user, will recreate')
    // User doesn't exist in auth - create them
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: newPassword
    })

    if (signUpError) {
      console.error('[AUTH] Re-signup error:', signUpError)
      return {
        mode: 'error',
        needsVerification: false,
        message: 'Unable to access account. Please try again.',
        error: signUpError.message
      }
    }

    if (authData.user) {
      // Update assessment with new user_id
      await supabase
        .from('assessments')
        .update({ user_id: authData.user.id })
        .eq('app_id', cleanSurveyId)
    }
  } else {
    // User exists - update their password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      assessment.user_id,
      { password: newPassword }
    )
    
    if (updateError) {
      console.error('[AUTH] Password update error:', updateError)
    }
  }
  
  // Sign in with Survey ID as password
const { error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password: cleanSurveyId  // Use Survey ID as password
})

if (signInError) {
  console.error('[AUTH] Sign-in error:', signInError)
  return {
    mode: 'error',
    needsVerification: false,
    message: 'Unable to sign in. Please try again.',
    error: signInError.message
  }
}

console.log('[AUTH] Returning user signed in successfully')

return {
  mode: 'existing',
  needsVerification: false,
  message: 'Welcome back! Redirecting to your survey...'
}
}

    return {
      mode: 'error',
      needsVerification: false,
      message: 'Authentication failed. Please try again.',
      error: 'Unknown authentication state'
    }

  } catch (error) {
    console.error('[AUTH] Unexpected error:', error)
    return {
      mode: 'error',
      needsVerification: false,
      message: 'An unexpected error occurred. Please try again.',
      error: String(error)
    }
  }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserAssessment() {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('[AUTH] Error fetching assessment:', error)
    return null
  }

  return data
}

export async function isAuthenticated(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

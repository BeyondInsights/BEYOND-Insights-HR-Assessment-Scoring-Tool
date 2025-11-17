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

    // Check for bypass flags (new user just created)
    const bypassAuth = localStorage.getItem('bypass_supabase_auth') === 'true'
    const userAuthenticated = localStorage.getItem('user_authenticated') === 'true'
    
    if (bypassAuth && userAuthenticated) {
      console.log('[AUTH] Bypass flags detected - allowing through')
      return {
        mode: 'new',
        needsVerification: false,
        message: 'Account created successfully!'
      }
    }

    // NEW USER - No survey ID provided
    if (!surveyId) {
      const appId = generateAppId()
      const tempPassword = Math.random().toString(36).slice(-12)

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

      const tempPassword = Math.random().toString(36).slice(-12)
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: tempPassword
      })

      if (signInError) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: tempPassword
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
          await supabase
            .from('assessments')
            .update({ user_id: authData.user.id })
            .eq('app_id', cleanSurveyId)
        }
      }

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
  // Check for bypass flags first (new user)
  const bypassAuth = localStorage.getItem('bypass_supabase_auth') === 'true'
  const userAuthenticated = localStorage.getItem('user_authenticated') === 'true'
  
  if (bypassAuth && userAuthenticated) {
    console.log('[AUTH] Bypass authentication - new user')
    return true
  }

  // Check Supabase auth
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

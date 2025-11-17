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

      console.log('[AUTH] Creating new user account...')
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: appId,  // USE SURVEY ID AS PASSWORD
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
          password: appId  // USE SURVEY ID AS PASSWORD
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
  
  console.log('[AUTH] Attempting sign-in with Survey ID as password')
  
  // TRY TO SIGN IN FIRST (this will work if user exists)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password: cleanSurveyId
  })

  if (signInError) {
    console.error('[AUTH] Sign-in failed:', signInError)
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Invalid email or Survey ID. Please check and try again.',
      error: signInError.message
    }
  }

  if (signInData.user) {
    console.log('[AUTH] Sign-in successful!')
    
    // NOW WE CAN QUERY (authenticated)
    const { data: assessment, error: queryError } = await supabase
      .from('assessments')
      .select('app_id')
      .eq('user_id', signInData.user.id)
      .single()

    if (queryError || assessment?.app_id !== cleanSurveyId) {
      console.error('[AUTH] Survey ID mismatch')
      await supabase.auth.signOut()
      return {
        mode: 'error',
        needsVerification: false,
        message: 'Survey ID does not match this account.',
        error: 'Survey ID mismatch'
      }
    }

    return {
      mode: 'existing',
      needsVerification: false,
      message: 'Welcome back! Redirecting to your survey...'
    }
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

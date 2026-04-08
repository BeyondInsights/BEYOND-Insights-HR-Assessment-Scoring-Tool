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

    const normalizedEmail = email.toLowerCase().trim()

    // NEW USER - No survey ID provided
    if (!surveyId) {
      // ============================================
      // CHECK FOR EXISTING FP RECORD FIRST
      // ============================================
      console.log('[AUTH] Checking for existing FP record with email:', normalizedEmail)
      
      const { data: existingFP } = await supabase
        .from('assessments')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('is_founding_partner', true)
        .single()

      if (existingFP) {
        console.log('[AUTH] Found existing FP record! Linking auth user to it...')
        
        // Create auth user with FP's survey ID as password
        const fpSurveyId = existingFP.app_id || existingFP.survey_id
        
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: fpSurveyId.replace(/-/g, ''),
          options: {
            data: {
              app_id: fpSurveyId
            }
          }
        })

        if (signUpError) {
          console.error('[AUTH] FP signup error:', signUpError)
          // If user already exists, try to sign in
          if (signUpError.message.includes('already registered')) {
            return {
              mode: 'error',
              needsVerification: false,
              message: 'This email is already registered. Please use "Returning User" with your Survey ID.',
              error: signUpError.message
            }
          }
          return {
            mode: 'error',
            needsVerification: false,
            message: 'Unable to create account. Please try again.',
            error: signUpError.message
          }
        }

        if (authData.user) {
          // UPDATE the existing FP record with the new auth user_id
          const { error: updateError } = await supabase
            .from('assessments')
            .update({
              user_id: authData.user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingFP.id)

          if (updateError) {
            console.error('[AUTH] Error linking FP record:', updateError)
          } else {
            console.log('[AUTH] Successfully linked auth user to FP record!')
          }

          // Sign in to establish session
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: fpSurveyId.replace(/-/g, '')
          })

          return {
            mode: 'new',
            needsVerification: false,
            message: 'Founding Partner account activated!',
            appId: fpSurveyId
          }
        }
      }
      // ============================================
      // END FP CHECK - Continue with normal new user flow
      // ============================================

      // Check if email already has an assessment (returning user without survey ID)
      const { data: existingAssessment } = await supabase
        .from('assessments')
        .select('app_id, survey_id')
        .eq('email', normalizedEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingAssessment) {
        const existingSurveyId = existingAssessment.app_id || existingAssessment.survey_id
        console.log('[AUTH] Email already has an assessment - directing to returning user flow')
        return {
          mode: 'error',
          needsVerification: false,
          message: `This email already has a survey in progress. Please use "Returning User" with your Survey ID: ${existingSurveyId}`,
          error: 'Email already registered'
        }
      }

      const appId = generateAppId()

      console.log('[AUTH] Creating new user account...')

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
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
        // Sign in FIRST to establish session — insert needs auth for RLS
        console.log('[AUTH] Signing in new user to establish session...')
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: appId
        })

        if (signInError) {
          console.error('[AUTH] Auto sign-in error:', signInError)
        } else {
          console.log('[AUTH] Session established successfully!')
        }

        // Now insert with active auth session (RLS allows authenticated inserts)
        const { error: insertError } = await supabase
          .from('assessments')
          .insert({
            user_id: authData.user.id,
            email: normalizedEmail,
            app_id: appId,
            survey_id: appId,
            survey_year: 2027,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('[AUTH] Assessment insert error:', insertError)
          // Fallback: try creating via sync function (uses service role key)
          console.log('[AUTH] Trying insert via sync function as fallback...')
          try {
            const resp = await fetch('/.netlify/functions/sync-assessment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'create-record',
                survey_id: appId,
                user_id: authData.user.id,
                email: normalizedEmail
              })
            })
            const result = await resp.json()
            if (result.success) {
              console.log('[AUTH] Record created via sync function')
            } else {
              console.error('[AUTH] Sync function create failed:', result.error)
            }
          } catch (e) {
            console.error('[AUTH] Sync function fallback error:', e)
          }
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

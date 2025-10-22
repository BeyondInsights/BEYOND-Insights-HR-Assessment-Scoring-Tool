import { supabase } from './client'
import { generateAppId, isValidEmail } from './utils'

export interface AuthResult {
  mode: 'new' | 'existing' | 'error'
  needsVerification: boolean
  message: string
  appId?: string
  error?: string
}

/**
 * Main authentication function
 * Handles both new users and returning users
 */
export async function authenticateUser(
  email: string,
  appId?: string
): Promise<AuthResult> {
  try {
    // Validate email format
    if (!isValidEmail(email)) {
      return {
        mode: 'error',
        needsVerification: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL'
      }
    }

    // If app_id provided, handle existing user
    if (appId) {
      return await handleExistingUser(email, appId)
    } else {
      return await handleNewUser(email)
    }
  } catch (error) {
    console.error('Auth error:', error)
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Authentication failed. Please try again.',
      error: 'AUTH_ERROR'
    }
  }
}

/**
 * Handle existing user authentication
 */
async function handleExistingUser(
  email: string,
  appId: string
): Promise<AuthResult> {
  // Check if assessment exists with this app_id
  const { data: assessment, error: fetchError } = await supabase
    .from('assessments')
    .select('user_id, email')
    .eq('app_id', appId)
    .single()

  if (fetchError || !assessment) {
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Application ID not found. Please check and try again.',
      error: 'APP_ID_NOT_FOUND'
    }
  }

  // Verify email matches
  if (assessment.email.toLowerCase() !== email.toLowerCase()) {
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Email does not match this Application ID.',
      error: 'EMAIL_MISMATCH'
    }
  }

  // Send magic link
  const { error: authError } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    }
  })

  if (authError) {
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Failed to send verification email. Please try again.',
      error: 'SEND_EMAIL_FAILED'
    }
  }

  return {
    mode: 'existing',
    needsVerification: true,
    message: 'Check your email! We sent you a link to continue your assessment.',
    appId: appId
  }
}

/**
 * Handle new user registration
 */
async function handleNewUser(email: string): Promise<AuthResult> {
  console.log('handleNewUser called for:', email)
  
  // Generate unique app_id
  const newAppId = await generateUniqueAppId()
  console.log('Generated unique App ID:', newAppId)

  // Create auth user with magic link
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: Math.random().toString(36).slice(-12) + 'Aa1!', // Random secure password
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: {
        app_id: newAppId
      }
    }
  })

  console.log('Signup result:', { authData, authError })

  if (authError || !authData.user) {
    console.error('Signup error:', authError)
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Failed to create account. Please try again.',
      error: 'CREATE_ACCOUNT_FAILED'
    }
  }

  // Create assessment record
  const { error: assessmentError } = await supabase
    .from('assessments')
    .insert({
      user_id: authData.user.id,
      email: email,
      app_id: newAppId,
      status: 'in_progress'
    })

  console.log('Assessment insert result:', assessmentError)

  if (assessmentError) {
    console.error('Assessment creation error:', assessmentError)
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Failed to initialize assessment. Please try again.',
      error: 'CREATE_ASSESSMENT_FAILED'
    }
  }

  return {
    mode: 'new',
    needsVerification: true,
    message: `Account created! Your Application ID is: ${newAppId}. Check your email to verify and continue.`,
    appId: newAppId
  }
}

/**
 * Generate unique app_id
 */
async function generateUniqueAppId(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const appId = generateAppId()

    // Check if app_id already exists
    const { data } = await supabase
      .from('assessments')
      .select('app_id')
      .eq('app_id', appId)
      .single()

    if (!data) {
      return appId // Unique app_id found
    }

    attempts++
  }

  throw new Error('Failed to generate unique app_id')
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Sign out user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get user's assessment data
 */
export async function getUserAssessment() {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

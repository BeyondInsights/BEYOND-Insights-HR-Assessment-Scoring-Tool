import { supabase } from '../supabase'
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
  appId?: string
): Promise<AuthResult> {
  try {
    if (!isValidEmail(email)) {
      return {
        mode: 'error',
        needsVerification: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL'
      }
    }

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

async function handleExistingUser(email: string, appId: string): Promise<AuthResult> {
  console.log('=== handleExistingUser START ===')
  console.log('Email:', email)
  console.log('App ID:', appId)
  
  // Check if assessment exists with this app_id
  const { data: assessment, error: fetchError } = await supabase
    .from('assessments')
    .select('user_id, email')
    .eq('app_id', appId)
    .single()

  console.log('Assessment data:', assessment)
  console.log('Fetch error:', fetchError)

  if (fetchError || !assessment) {
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Application ID not found.',
      error: 'APP_ID_NOT_FOUND'
    }
  }

  if (assessment.email.toLowerCase() !== email.toLowerCase()) {
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Email does not match this Application ID.',
      error: 'EMAIL_MISMATCH'
    }
  }

  console.log('Attempting signInWithPassword...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: appId
  })

  console.log('Auth data:', authData)
  console.log('Auth error:', authError)

  if (authError) {
    return {
      mode: 'error',
      needsVerification: false,
      message: `Authentication failed: ${authError.message}`,
      error: 'AUTH_FAILED'
    }
  }

  return {
    mode: 'existing',
    needsVerification: false,
    message: 'Login successful!',
    appId: appId
  }
}

async function handleNewUser(email: string): Promise<AuthResult> {
  const newAppId = await generateUniqueAppId()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: newAppId,
    options: {
      data: { app_id: newAppId }
    }
  })

  if (authError || !authData.user) {
    return {
      mode: 'error',
      needsVerification: false,
      message: 'Failed to create account.',
      error: 'CREATE_ACCOUNT_FAILED'
    }
  }

  await supabase
    .from('assessments')
    .insert({
      user_id: authData.user.id,
      email: email,
      app_id: newAppId,
      status: 'in_progress'
    })

  return {
    mode: 'new',
    needsVerification: false,
    message: 'Account created successfully!',
    appId: newAppId
  }
}

async function generateUniqueAppId(): Promise<string> {
  let attempts = 0
  while (attempts < 10) {
    const appId = generateAppId()
    const { data } = await supabase
      .from('assessments')
      .select('app_id')
      .eq('app_id', appId)
      .single()
    if (!data) return appId
    attempts++
  }
  throw new Error('Failed to generate unique app_id')
}

// ✅ FIXED - Now checks bypass flags first
export async function isAuthenticated(): Promise<boolean> {
  // Check bypass flags first (for new users and Founding Partners)
  if (typeof window !== 'undefined') {
    const hasAuthFlag = localStorage.getItem('user_authenticated') === 'true'
    const justCreated = localStorage.getItem('new_user_just_created') === 'true'
    if (hasAuthFlag || justCreated) {
      console.log('✅ Authenticated via bypass flag')
      return true
    }
  }
  
  // Then check Supabase session
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  await supabase.auth.signOut()
  // Clear bypass flags on sign out
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_authenticated')
    localStorage.removeItem('new_user_just_created')
  }
}

export async function getUserAssessment() {
  const user = await getCurrentUser()
  if (!user) return null
  const { data } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', user.id)
    .single()
  return data
}

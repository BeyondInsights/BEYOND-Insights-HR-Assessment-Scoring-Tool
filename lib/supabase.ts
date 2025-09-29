/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface SurveyUser {
  id: string
  email: string
  organization_name: string
  access_code: string
  first_name?: string
  last_name?: string
  job_title?: string
  is_active: boolean
  last_login?: Date
  created_at: Date
}

export interface SurveyResponse {
  id: string
  user_id: string
  survey_version: string
  survey_data: any
  current_page?: string
  completion_percentage: number
  is_complete: boolean
  started_at: Date
  last_saved_at: Date
  completed_at?: Date
  time_spent_seconds: number
}

// Auth helper functions
export async function authenticateUser(email: string, accessCode: string) {
  try {
    const { data, error } = await supabase
      .from('survey_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('access_code', accessCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error) throw error
    
    // Update last login
    if (data) {
      await supabase
        .from('survey_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id)
    }

    return { user: data, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

// Survey response functions
export async function saveSurveyResponse(
  userId: string, 
  surveyData: any, 
  currentPage: string,
  completionPercentage: number,
  isComplete: boolean = false
) {
  try {
    // Check if response exists
    const { data: existing } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      // Update existing response
      const { data, error } = await supabase
        .from('survey_responses')
        .update({
          survey_data: surveyData,
          current_page: currentPage,
          completion_percentage: completionPercentage,
          is_complete: isComplete,
          last_saved_at: new Date().toISOString(),
          completed_at: isComplete ? new Date().toISOString() : null
        })
        .eq('user_id', userId)
        .select()
        .single()

      return { data, error }
    } else {
      // Create new response
      const { data, error } = await supabase
        .from('survey_responses')
        .insert({
          user_id: userId,
          survey_data: surveyData,
          current_page: currentPage,
          completion_percentage: completionPercentage,
          is_complete: isComplete
        })
        .select()
        .single()

      return { data, error }
    }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getSurveyResponse(userId: string) {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('user_id', userId)
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Real-time subscription for dashboard
export function subscribeToResponses(callback: (payload: any) => void) {
  return supabase
    .channel('survey_responses')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'survey_responses' 
      }, 
      callback
    )
    .subscribe()
}

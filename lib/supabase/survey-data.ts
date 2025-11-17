/**
 * Survey Data Storage Helper Functions
 * 
 * CRITICAL: Every survey page MUST use these functions to save data to Supabase.
 * Saving only flags without data means ALL answers are lost.
 */

import { supabase } from './client'

/**
 * Save a survey section to Supabase
 * 
 * @param userId - The user's Supabase auth ID
 * @param sectionName - Name of the section (e.g., 'firmographics', 'general_benefits', 'dimension1')
 * @param data - Complete object containing ALL answers from that section
 * @param additionalFields - Optional additional fields to update (e.g., company_name)
 * 
 * @example
 * await saveSurveySection(user.id, 'firmographics', {
 *   companyName: "Acme Corp",
 *   firstName: "John",
 *   lastName: "Smith",
 *   title: "HR Director",
 *   au1: "Yes",
 *   au2: ["Option 1", "Option 2"]
 * })
 */
export async function saveSurveySection(
  userId: string,
  sectionName: string,
  data: any,
  additionalFields: Record<string, any> = {}
) {
  console.log(`💾 Saving ${sectionName} data:`, data)
  
  const updateObject = {
    [`${sectionName}_data`]: data,          // The actual answers
    [`${sectionName}_complete`]: true,      // Completion flag
    updated_at: new Date().toISOString(),
    ...additionalFields
  }
  
  const { error } = await supabase
    .from('assessments')
    .update(updateObject)
    .eq('user_id', userId)
  
  if (error) {
    console.error(`❌ Error saving ${sectionName}:`, error)
    throw new Error(`Failed to save ${sectionName} data: ${error.message}`)
  }
  
  console.log(`✅ Successfully saved ${sectionName}`)
  return { success: true }
}

/**
 * Load existing survey data for a section
 * 
 * @param userId - The user's Supabase auth ID  
 * @param sectionName - Name of the section to load
 * @returns The data object or null if not found
 */
export async function loadSurveySection(
  userId: string,
  sectionName: string
) {
  const { data, error } = await supabase
    .from('assessments')
    .select(`${sectionName}_data, ${sectionName}_complete`)
    .eq('user_id', userId)
    .single()
  
  if (error) {
    console.error(`❌ Error loading ${sectionName}:`, error)
    return null
  }
  
  return data?.[`${sectionName}_data`] || null
}

/**
 * Update progress tracking
 * 
 * @param userId - The user's Supabase auth ID
 * @param sectionName - Name of the section just completed
 * @param timeSpent - Time spent in seconds (optional)
 */
export async function updateProgress(
  userId: string,
  sectionName: string,
  timeSpent?: number
) {
  const updateData: any = {
    last_section_visited: sectionName,
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  if (timeSpent) {
    updateData[`${sectionName}_time_seconds`] = timeSpent
  }
  
  const { error } = await supabase
    .from('assessments')
    .update(updateData)
    .eq('user_id', userId)
  
  if (error) {
    console.error('❌ Error updating progress:', error)
  }
}

/**
 * Get complete assessment including all data
 */
export async function getCompleteAssessment(userId: string) {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    console.error('❌ Error loading assessment:', error)
    return null
  }
  
  return data
}

/**
 * EXAMPLE USAGE IN SURVEY PAGES:
 * 
 * // 1. At the top of your page component:
 * import { saveSurveySection, loadSurveySection } from '@/lib/supabase/survey-data'
 * 
 * // 2. When loading existing data:
 * useEffect(() => {
 *   const loadData = async () => {
 *     const existingData = await loadSurveySection(user.id, 'general_benefits')
 *     if (existingData) {
 *       setCb1(existingData.cb1 || [])
 *       setCb1a(existingData.cb1a || '')
 *       setCb2b(existingData.cb2b || [])
 *     }
 *   }
 *   loadData()
 * }, [])
 * 
 * // 3. When saving (on Continue button):
 * const handleContinue = async () => {
 *   const benefitsData = {
 *     cb1: selectedBenefits,
 *     cb1a: percentageNationalHealthcare,
 *     cb2b: plannedBenefits,
 *     // Include EVERY answer from this page
 *   }
 *   
 *   try {
 *     await saveSurveySection(user.id, 'general_benefits', benefitsData)
 *     router.push('/next-page')
 *   } catch (error) {
 *     setErrors('Failed to save. Please try again.')
 *   }
 * }
 */

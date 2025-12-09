/**
 * FP Shared Storage Utility
 * 
 * Handles shared assessment storage for Founding Partners who need
 * multiple people to collaborate on the same survey.
 * 
 * Currently enabled for: Best Buy (FP-392847)
 */

import { supabase } from './client'

// Survey IDs that use shared storage
const SHARED_FP_IDS = ['FP-392847']  // Best Buy

/**
 * Check if this survey ID uses shared storage
 */
export function isSharedFP(surveyId: string): boolean {
  return SHARED_FP_IDS.includes(surveyId?.toUpperCase?.() || surveyId)
}

/**
 * Load shared FP assessment data from Supabase
 * Also populates localStorage for survey pages to read
 */
export async function loadSharedFPData(surveyId: string): Promise<boolean> {
  if (!isSharedFP(surveyId)) return false
  
  try {
    console.log('📥 Loading shared FP data for:', surveyId)
    
    const { data, error } = await supabase
      .from('fp_shared_assessments')
      .select('*')
      .eq('survey_id', surveyId)
      .single()
    
    if (error) {
      console.error('Error loading shared FP data:', error)
      return false
    }
    
    if (!data) {
      console.log('No existing shared data found')
      return false
    }
    
    console.log('✅ Found shared FP data, populating localStorage...')
    
    // Populate localStorage with data from Supabase
    const dataFields = [
      'firmographics_data',
      'general_benefits_data',
      'current_support_data',
      'cross_dimensional_data',
      'employee_impact_data',
      ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
    ]
    
    dataFields.forEach(field => {
      if (data[field] && Object.keys(data[field]).length > 0) {
        // Handle the employee_impact naming difference
        const localKey = field === 'employee_impact_data' 
          ? 'employee-impact-assessment_data' 
          : field
        localStorage.setItem(localKey, JSON.stringify(data[field]))
        console.log(`  ✓ Loaded ${localKey}`)
      }
    })
    
    // Populate completion flags
    const completeFields = [
      'firmographics_complete',
      'auth_completed',
      'general_benefits_complete',
      'current_support_complete',
      'cross_dimensional_complete',
      'employee_impact_complete',
      ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
    ]
    
    completeFields.forEach(field => {
      if (data[field] === true) {
        const localKey = field === 'employee_impact_complete'
          ? 'employee-impact-assessment_complete'
          : field
        localStorage.setItem(localKey, 'true')
        console.log(`  ✓ Loaded ${localKey}: true`)
      }
    })
    
    // Set company name
    if (data.company_name) {
      localStorage.setItem('login_company_name', data.company_name)
    }
    
    console.log('✅ Shared FP data loaded successfully')
    return true
    
  } catch (error) {
    console.error('Error in loadSharedFPData:', error)
    return false
  }
}

/**
 * Save localStorage data to shared FP Supabase record
 */
export async function saveSharedFPData(surveyId: string, editedBy?: string): Promise<boolean> {
  if (!isSharedFP(surveyId)) return false
  
  try {
    console.log('📤 Saving shared FP data for:', surveyId)
    
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    
    if (editedBy) {
      updateData.last_edited_by = editedBy
    }
    
    // Collect data fields from localStorage
    const dataMapping = [
      { local: 'firmographics_data', db: 'firmographics_data' },
      { local: 'general_benefits_data', db: 'general_benefits_data' },
      { local: 'current_support_data', db: 'current_support_data' },
      { local: 'cross_dimensional_data', db: 'cross_dimensional_data' },
      { local: 'employee-impact-assessment_data', db: 'employee_impact_data' },
      ...Array.from({length: 13}, (_, i) => ({
        local: `dimension${i+1}_data`,
        db: `dimension${i+1}_data`
      }))
    ]
    
    dataMapping.forEach(({ local, db }) => {
      const value = localStorage.getItem(local)
      if (value) {
        try {
          const parsed = JSON.parse(value)
          if (Object.keys(parsed).length > 0) {
            updateData[db] = parsed
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    })
    
    // Collect completion flags
    const completeMapping = [
      { local: 'firmographics_complete', db: 'firmographics_complete' },
      { local: 'auth_completed', db: 'auth_completed' },
      { local: 'general_benefits_complete', db: 'general_benefits_complete' },
      { local: 'current_support_complete', db: 'current_support_complete' },
      { local: 'cross_dimensional_complete', db: 'cross_dimensional_complete' },
      { local: 'employee-impact-assessment_complete', db: 'employee_impact_complete' },
      ...Array.from({length: 13}, (_, i) => ({
        local: `dimension${i+1}_complete`,
        db: `dimension${i+1}_complete`
      }))
    ]
    
    completeMapping.forEach(({ local, db }) => {
      if (localStorage.getItem(local) === 'true') {
        updateData[db] = true
      }
    })
    
    // Company name
    const companyName = localStorage.getItem('login_company_name')
    if (companyName) {
      updateData.company_name = companyName
    }
    
    console.log(`📤 Syncing ${Object.keys(updateData).length} fields...`)
    
    const { error } = await supabase
      .from('fp_shared_assessments')
      .update(updateData)
      .eq('survey_id', surveyId)
    
    if (error) {
      console.error('Error saving shared FP data:', error)
      return false
    }
    
    console.log('✅ Shared FP data saved successfully')
    return true
    
  } catch (error) {
    console.error('Error in saveSharedFPData:', error)
    return false
  }
}

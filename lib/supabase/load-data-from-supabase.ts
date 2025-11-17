import { supabase } from '@/lib/supabase/client'

export async function loadUserDataFromSupabase(): Promise<boolean> {
  try {
    console.log('[LOAD] Loading user data from Supabase...')
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('[LOAD] No authenticated user')
      return false
    }
    
    // Get their assessment record
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      console.error('[LOAD] Error fetching assessment:', error)
      return false
    }
    
    if (!assessment) {
      console.log('[LOAD] No assessment found')
      return false
    }
    
    console.log('[LOAD] Assessment found, loading data into localStorage...')
    
    // Load company info
    if (assessment.company_name) {
      localStorage.setItem('login_company_name', assessment.company_name)
      console.log('  ✓ Loaded company_name')
    }
    
    if (assessment.app_id) {
      localStorage.setItem('survey_id', assessment.app_id)
      localStorage.setItem('login_Survey_id', assessment.app_id)
      console.log('  ✓ Loaded survey_id:', assessment.app_id)
    }
    
    // Load all survey data
    const dataFields = [
      'firmographics_data',
      'general_benefits_data',
      'current_support_data',
      'cross_dimensional_data',
      'employee_impact_data',
      ...Array.from({length: 13}, (_, i) => `dimension${i+1}_data`)
    ]
    
    dataFields.forEach(field => {
      if (assessment[field] && typeof assessment[field] === 'object') {
        localStorage.setItem(field, JSON.stringify(assessment[field]))
        console.log(`  ✓ Loaded ${field}`)
      }
    })
    
    // Load all completion flags
    const completeFields = [
      'firmographics_complete',
      'auth_completed',
      'general_benefits_complete',
      'current_support_complete',
      'cross_dimensional_complete',
      'employee_impact_complete',
      'payment_completed',
      ...Array.from({length: 13}, (_, i) => `dimension${i+1}_complete`)
    ]
    
    completeFields.forEach(field => {
      if (assessment[field] === true) {
        localStorage.setItem(field, 'true')
        console.log(`  ✓ Loaded ${field}: true`)
      }
    })
    
    // Load payment info
    if (assessment.payment_method) {
      localStorage.setItem('payment_method', assessment.payment_method)
      localStorage.setItem('payment_completed', 'true')
      console.log('  ✓ Loaded payment info')
    }
    
    console.log('[LOAD] ✅ All data loaded successfully!')
    return true
    
  } catch (error) {
    console.error('[LOAD] Unexpected error:', error)
    return false
  }
}

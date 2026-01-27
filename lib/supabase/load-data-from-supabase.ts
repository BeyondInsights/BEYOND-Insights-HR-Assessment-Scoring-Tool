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
    
    // Get survey_id from localStorage for fallback lookup
    const surveyId = localStorage.getItem('survey_id') || localStorage.getItem('login_Survey_id') || ''
    const normalizedAppId = surveyId.replace(/-/g, '').toUpperCase()
    
    console.log('[LOAD] Looking for assessment...')
    console.log('  user_id:', user.id)
    console.log('  survey_id:', surveyId || 'none')
    console.log('  app_id:', normalizedAppId || 'none')
    
    let assessment: any = null
    let matchColumn = ''
    let matchValue = ''
    
    // ============================================
    // ATTEMPT 1: Try user_id
    // ============================================
    {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (!error && data) {
        assessment = data
        matchColumn = 'user_id'
        matchValue = user.id
        console.log('[LOAD] Found via user_id')
      }
    }
    
    // ============================================
    // ATTEMPT 2: FALLBACK to survey_id
    // ============================================
    if (!assessment && surveyId) {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('survey_id', surveyId)
        .maybeSingle()
      
      if (!error && data) {
        assessment = data
        matchColumn = 'survey_id'
        matchValue = surveyId
        console.log('[LOAD] Found via survey_id fallback')
        
        // CRITICAL: Link user_id to this record for future syncs
        if (!data.user_id) {
          console.log('[LOAD] Linking user_id to record...')
          await supabase
            .from('assessments')
            .update({ user_id: user.id })
            .eq('survey_id', surveyId)
          console.log('[LOAD] ✓ user_id linked!')
        }
      }
    }
    
    // ============================================
    // ATTEMPT 3: FALLBACK to app_id
    // ============================================
    if (!assessment && normalizedAppId) {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('app_id', normalizedAppId)
        .maybeSingle()
      
      if (!error && data) {
        assessment = data
        matchColumn = 'app_id'
        matchValue = normalizedAppId
        console.log('[LOAD] Found via app_id fallback')
        
        // CRITICAL: Link user_id to this record for future syncs
        if (!data.user_id) {
          console.log('[LOAD] Linking user_id to record...')
          await supabase
            .from('assessments')
            .update({ user_id: user.id })
            .eq('app_id', normalizedAppId)
          console.log('[LOAD] ✓ user_id linked!')
        }
      }
    }
    
    // ============================================
    // NO RECORD FOUND
    // ============================================
    if (!assessment) {
      console.log('[LOAD] No assessment found via any method')
      return false
    }
    
    console.log('[LOAD] Assessment found via', matchColumn, '- loading data into localStorage...')
    
    // Load company info
    if (assessment.company_name) {
      localStorage.setItem('login_company_name', assessment.company_name)
      localStorage.setItem('company_name', assessment.company_name)
      console.log('  ✓ Loaded company_name:', assessment.company_name)
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
        // Handle employee-impact-assessment naming mismatch
        const localKey = field === 'employee_impact_data' ? 'employee-impact-assessment_data' : field
        localStorage.setItem(localKey, JSON.stringify(assessment[field]))
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
        // Handle employee-impact-assessment naming mismatch
        const localKey = field === 'employee_impact_complete' ? 'employee-impact-assessment_complete' : field
        localStorage.setItem(localKey, 'true')
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

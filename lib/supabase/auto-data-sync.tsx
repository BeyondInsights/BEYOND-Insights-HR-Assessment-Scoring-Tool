/**
 * AUTOMATIC DATA SYNC - NO MANUAL EDITS REQUIRED
 * 
 * This automatically syncs ALL localStorage data to Supabase
 * without needing to edit every survey page.
 * 
 * Just add this ONE component to your root layout.
 */

'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from './client'

/**
 * Maps localStorage keys to Supabase columns
 */
const STORAGE_TO_SUPABASE_MAP: Record<string, { column: string; dataKey: string }> = {
  // Authorization data
  'login_company_name': { column: 'company_name', dataKey: 'firmographics' },
  'login_first_name': { column: 'firmographics_data', dataKey: 'firmographics' },
  'login_last_name': { column: 'firmographics_data', dataKey: 'firmographics' },
  'login_title': { column: 'firmographics_data', dataKey: 'firmographics' },
  'authorization': { column: 'firmographics_data', dataKey: 'firmographics' },
  
  // Survey sections - map to their respective data columns
  'general_benefits': { column: 'general_benefits_data', dataKey: 'general_benefits' },
  'current_support': { column: 'current_support_data', dataKey: 'current_support' },
  'dimension_1': { column: 'dimension1_data', dataKey: 'dimension1' },
  'dimension_2': { column: 'dimension2_data', dataKey: 'dimension2' },
  'dimension_3': { column: 'dimension3_data', dataKey: 'dimension3' },
  'dimension_4': { column: 'dimension4_data', dataKey: 'dimension4' },
  'dimension_5': { column: 'dimension5_data', dataKey: 'dimension5' },
  'dimension_6': { column: 'dimension6_data', dataKey: 'dimension6' },
  'dimension_7': { column: 'dimension7_data', dataKey: 'dimension7' },
  'dimension_8': { column: 'dimension8_data', dataKey: 'dimension8' },
  'dimension_9': { column: 'dimension9_data', dataKey: 'dimension9' },
  'dimension_10': { column: 'dimension10_data', dataKey: 'dimension10' },
  'dimension_11': { column: 'dimension11_data', dataKey: 'dimension11' },
  'dimension_12': { column: 'dimension12_data', dataKey: 'dimension12' },
  'dimension_13': { column: 'dimension13_data', dataKey: 'dimension13' },
  'cross_dimensional': { column: 'cross_dimensional_data', dataKey: 'cross_dimensional' },
  'employee_impact': { column: 'employee_impact_data', dataKey: 'employee_impact' },
}

/**
 * Collects all relevant data from localStorage
 */
function collectLocalStorageData() {
  const data: Record<string, any> = {}
  
  // Group data by section
  const sections: Record<string, any> = {
    firmographics: {},
    general_benefits: {},
    current_support: {},
  }
  
  // Collect firmographics
  const companyName = localStorage.getItem('login_company_name')
  const firstName = localStorage.getItem('login_first_name')
  const lastName = localStorage.getItem('login_last_name')
  const title = localStorage.getItem('login_title')
  const authStr = localStorage.getItem('authorization')
  
  if (companyName || firstName || lastName || title || authStr) {
    sections.firmographics = {
      companyName: companyName || '',
      firstName: firstName || '',
      lastName: lastName || '',
      title: title || '',
      ...(authStr ? JSON.parse(authStr) : {})
    }
    data.company_name = companyName
    data.firmographics_data = sections.firmographics
    data.firmographics_complete = true
    data.auth_completed = true
  }
  
  // Collect all other survey sections from localStorage
  Object.keys(localStorage).forEach(key => {
    // Look for keys like "survey_cb1", "survey_or1", "survey_d1a", etc.
    if (key.startsWith('survey_')) {
      const questionKey = key.replace('survey_', '')
      const value = localStorage.getItem(key)
      
      if (value) {
        try {
          const parsed = JSON.parse(value)
          
          // Determine which section this belongs to
          if (questionKey.startsWith('cb')) {
            sections.general_benefits[questionKey] = parsed
          } else if (questionKey.startsWith('or')) {
            sections.current_support[questionKey] = parsed
          } else if (questionKey.startsWith('d1')) {
            if (!sections.dimension1) sections.dimension1 = {}
            sections.dimension1[questionKey] = parsed
          } else if (questionKey.startsWith('d2')) {
            if (!sections.dimension2) sections.dimension2 = {}
            sections.dimension2[questionKey] = parsed
          } else if (questionKey.startsWith('d3')) {
            if (!sections.dimension3) sections.dimension3 = {}
            sections.dimension3[questionKey] = parsed
          } else if (questionKey.startsWith('d4')) {
            if (!sections.dimension4) sections.dimension4 = {}
            sections.dimension4[questionKey] = parsed
          } else if (questionKey.startsWith('d5')) {
            if (!sections.dimension5) sections.dimension5 = {}
            sections.dimension5[questionKey] = parsed
          } else if (questionKey.startsWith('d6')) {
            if (!sections.dimension6) sections.dimension6 = {}
            sections.dimension6[questionKey] = parsed
          } else if (questionKey.startsWith('d7')) {
            if (!sections.dimension7) sections.dimension7 = {}
            sections.dimension7[questionKey] = parsed
          } else if (questionKey.startsWith('d8')) {
            if (!sections.dimension8) sections.dimension8 = {}
            sections.dimension8[questionKey] = parsed
          } else if (questionKey.startsWith('d9')) {
            if (!sections.dimension9) sections.dimension9 = {}
            sections.dimension9[questionKey] = parsed
          } else if (questionKey.startsWith('d10')) {
            if (!sections.dimension10) sections.dimension10 = {}
            sections.dimension10[questionKey] = parsed
          } else if (questionKey.startsWith('d11')) {
            if (!sections.dimension11) sections.dimension11 = {}
            sections.dimension11[questionKey] = parsed
          } else if (questionKey.startsWith('d12')) {
            if (!sections.dimension12) sections.dimension12 = {}
            sections.dimension12[questionKey] = parsed
          } else if (questionKey.startsWith('d13')) {
            if (!sections.dimension13) sections.dimension13 = {}
            sections.dimension13[questionKey] = parsed
          } else if (questionKey.startsWith('cd')) {
            if (!sections.cross_dimensional) sections.cross_dimensional = {}
            sections.cross_dimensional[questionKey] = parsed
          } else if (questionKey.startsWith('ei')) {
            if (!sections.employee_impact) sections.employee_impact = {}
            sections.employee_impact[questionKey] = parsed
          }
        } catch (e) {
          // If not JSON, store as string
          sections.general_benefits[questionKey] = value
        }
      }
    }
  })
  
  // Add section data to update object
  if (Object.keys(sections.general_benefits).length > 0) {
    data.general_benefits_data = sections.general_benefits
    data.general_benefits_complete = true
  }
  if (Object.keys(sections.current_support).length > 0) {
    data.current_support_data = sections.current_support
    data.current_support_complete = true
  }
  if (sections.dimension1 && Object.keys(sections.dimension1).length > 0) {
    data.dimension1_data = sections.dimension1
    data.dimension1_complete = true
  }
  if (sections.dimension2 && Object.keys(sections.dimension2).length > 0) {
    data.dimension2_data = sections.dimension2
    data.dimension2_complete = true
  }
  if (sections.dimension3 && Object.keys(sections.dimension3).length > 0) {
    data.dimension3_data = sections.dimension3
    data.dimension3_complete = true
  }
  if (sections.dimension4 && Object.keys(sections.dimension4).length > 0) {
    data.dimension4_data = sections.dimension4
    data.dimension4_complete = true
  }
  if (sections.dimension5 && Object.keys(sections.dimension5).length > 0) {
    data.dimension5_data = sections.dimension5
    data.dimension5_complete = true
  }
  if (sections.dimension6 && Object.keys(sections.dimension6).length > 0) {
    data.dimension6_data = sections.dimension6
    data.dimension6_complete = true
  }
  if (sections.dimension7 && Object.keys(sections.dimension7).length > 0) {
    data.dimension7_data = sections.dimension7
    data.dimension7_complete = true
  }
  if (sections.dimension8 && Object.keys(sections.dimension8).length > 0) {
    data.dimension8_data = sections.dimension8
    data.dimension8_complete = true
  }
  if (sections.dimension9 && Object.keys(sections.dimension9).length > 0) {
    data.dimension9_data = sections.dimension9
    data.dimension9_complete = true
  }
  if (sections.dimension10 && Object.keys(sections.dimension10).length > 0) {
    data.dimension10_data = sections.dimension10
    data.dimension10_complete = true
  }
  if (sections.dimension11 && Object.keys(sections.dimension11).length > 0) {
    data.dimension11_data = sections.dimension11
    data.dimension11_complete = true
  }
  if (sections.dimension12 && Object.keys(sections.dimension12).length > 0) {
    data.dimension12_data = sections.dimension12
    data.dimension12_complete = true
  }
  if (sections.dimension13 && Object.keys(sections.dimension13).length > 0) {
    data.dimension13_data = sections.dimension13
    data.dimension13_complete = true
  }
  if (sections.cross_dimensional && Object.keys(sections.cross_dimensional).length > 0) {
    data.cross_dimensional_data = sections.cross_dimensional
    data.cross_dimensional_complete = true
  }
  if (sections.employee_impact && Object.keys(sections.employee_impact).length > 0) {
    data.employee_impact_data = sections.employee_impact
    data.employee_impact_complete = true
  }
  
  return data
}

/**
 * Sync localStorage to Supabase
 */
async function syncToSupabase() {
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('⏭️ No user - skipping sync')
    return
  }
  
  // Check if this is a Founding Partner (skip Supabase)
  const surveyId = localStorage.getItem('survey_id') || ''
  const { isFoundingPartner } = await import('@/lib/founding-partners')
  if (isFoundingPartner(surveyId)) {
    console.log('⏭️ Founding Partner - skipping Supabase sync')
    return
  }
  
  // Collect all data
  const data = collectLocalStorageData()
  
  if (Object.keys(data).length === 0) {
    console.log('⏭️ No data to sync')
    return
  }
  
  console.log('💾 Auto-syncing to Supabase:', Object.keys(data))
  
  // Update Supabase
  const { error } = await supabase
    .from('assessments')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
  
  if (error) {
    console.error('❌ Auto-sync error:', error)
  } else {
    console.log('✅ Auto-sync successful')
  }
}

/**
 * Auto Data Sync Component
 * Add this to your root layout to enable automatic syncing
 */
export default function AutoDataSync() {
  const pathname = usePathname()
  const lastPath = useRef<string>('')
  
  // Sync on route change
  useEffect(() => {
    if (pathname !== lastPath.current && lastPath.current !== '') {
      console.log('📍 Route changed - triggering auto-sync')
      syncToSupabase()
    }
    lastPath.current = pathname
  }, [pathname])
  
  // Sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Periodic sync triggered')
      syncToSupabase()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Sync before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('👋 Page closing - final sync')
      syncToSupabase()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  return null
}

/**
 * USAGE:
 * 
 * In your root layout.tsx:
 * 
 * import AutoDataSync from '@/lib/supabase/auto-data-sync'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AutoDataSync />
 *         {children}
 *       </body>
 *     </html>
 *   )
 * }
 * 
 * That's it! Now ALL localStorage data automatically syncs to Supabase:
 * - When the user navigates to a new page
 * - Every 30 seconds
 * - Before the browser closes
 * 
 * NO manual edits to survey pages required!
 */

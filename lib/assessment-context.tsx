'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

// ============================================
// TYPES
// ============================================

// All section keys that have _data and _complete columns in Supabase
const SECTION_KEYS = [
  'firmographics',
  'general_benefits',
  'current_support',
  'dimension1', 'dimension2', 'dimension3', 'dimension4',
  'dimension5', 'dimension6', 'dimension7', 'dimension8',
  'dimension9', 'dimension10', 'dimension11', 'dimension12', 'dimension13',
  'cross_dimensional',
  'employee_impact',
] as const

type SectionKey = typeof SECTION_KEYS[number]

// Map from user-facing key names to Supabase column names
// (handles the employee-impact-assessment → employee_impact mismatch)
const SECTION_TO_DB_DATA: Record<string, string> = {
  'firmographics': 'firmographics_data',
  'general_benefits': 'general_benefits_data',
  'current_support': 'current_support_data',
  'cross_dimensional': 'cross_dimensional_data',
  'employee_impact': 'employee_impact_data',
}
for (let i = 1; i <= 13; i++) {
  SECTION_TO_DB_DATA[`dimension${i}`] = `dimension${i}_data`
}

const SECTION_TO_DB_COMPLETE: Record<string, string> = {
  'firmographics': 'firmographics_complete',
  'general_benefits': 'general_benefits_complete',
  'current_support': 'current_support_complete',
  'cross_dimensional': 'cross_dimensional_complete',
  'employee_impact': 'employee_impact_complete',
}
for (let i = 1; i <= 13; i++) {
  SECTION_TO_DB_COMPLETE[`dimension${i}`] = `dimension${i}_complete`
}

// Aliases so survey pages can use their existing key names
const SECTION_ALIASES: Record<string, string> = {
  'general-benefits': 'general_benefits',
  'current-support': 'current_support',
  'cross-dimensional': 'cross_dimensional',
  'employee-impact-assessment': 'employee_impact',
  'employee-impact': 'employee_impact',
  'cross_dimensional_data': 'cross_dimensional',
  'employee_impact_data': 'employee_impact',
}

function resolveSection(section: string): string {
  return SECTION_ALIASES[section] || section
}

interface AssessmentContextType {
  // Identity
  surveyId: string | null
  email: string | null
  companyName: string | null
  version: number
  userType: 'fp' | 'regular' | 'compd' | null

  // Auth/flow state
  authCompleted: boolean
  paymentCompleted: boolean
  paymentMethod: string | null
  paymentDate: string | null
  surveySubmitted: boolean
  employeeSurveyOptIn: boolean | null
  employeeSurveyOptInDate: string | null

  // Section data access
  getSectionData: (section: string) => Record<string, any> | null
  getSectionComplete: (section: string) => boolean

  // Section data mutation
  setSectionData: (section: string, data: Record<string, any>) => void
  setSectionComplete: (section: string, complete: boolean) => void

  // Supabase operations
  saveToSupabase: (section?: string) => Promise<boolean>
  loadFromSupabase: (surveyId: string) => Promise<boolean>

  // Full record setter (used on login)
  setFullRecord: (record: any) => void

  // Status
  isDirty: boolean
  isSaving: boolean
  lastSaveError: string | null
  isLoaded: boolean

  // Auth/identity setters
  setSurveyId: (id: string) => void
  setEmail: (email: string) => void
  setCompanyName: (name: string) => void
  setAuthCompleted: (v: boolean) => void
  setPaymentCompleted: (v: boolean) => void
  setPaymentMethod: (v: string) => void
  setPaymentDate: (v: string) => void
  setUserType: (v: 'fp' | 'regular' | 'compd' | null) => void
  setSurveySubmitted: (v: boolean) => void
  setEmployeeSurveyOptIn: (v: boolean | null) => void
  setEmployeeSurveyOptInDate: (v: string | null) => void

  // Login metadata (first name, last name, title)
  loginFirstName: string | null
  loginLastName: string | null
  loginTitle: string | null
  setLoginFirstName: (v: string) => void
  setLoginLastName: (v: string) => void
  setLoginTitle: (v: string) => void

  // Clear all data (logout)
  clearAll: () => void
}

const AssessmentContext = createContext<AssessmentContextType | null>(null)

export function useAssessmentContext(): AssessmentContextType {
  const ctx = useContext(AssessmentContext)
  if (!ctx) {
    throw new Error('useAssessmentContext must be used within an AssessmentProvider')
  }
  return ctx
}

// ============================================
// PROVIDER
// ============================================

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  // Identity
  const [surveyId, setSurveyId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [version, setVersion] = useState<number>(0)
  const [userType, setUserType] = useState<'fp' | 'regular' | 'compd' | null>(null)

  // Auth/flow
  const [authCompleted, setAuthCompleted] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [paymentDate, setPaymentDate] = useState<string | null>(null)
  const [surveySubmitted, setSurveySubmitted] = useState(false)
  const [employeeSurveyOptIn, setEmployeeSurveyOptIn] = useState<boolean | null>(null)
  const [employeeSurveyOptInDate, setEmployeeSurveyOptInDate] = useState<string | null>(null)

  // Login metadata
  const [loginFirstName, setLoginFirstName] = useState<string | null>(null)
  const [loginLastName, setLoginLastName] = useState<string | null>(null)
  const [loginTitle, setLoginTitle] = useState<string | null>(null)

  // Section data — stored in a single map for simplicity
  const [sectionData, setSectionDataMap] = useState<Record<string, Record<string, any> | null>>({})
  const [sectionComplete, setSectionCompleteMap] = useState<Record<string, boolean>>({})

  // Status
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaveError, setLastSaveError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Refs for auto-save interval
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const surveyIdRef = useRef<string | null>(null)
  const versionRef = useRef<number>(0)

  // Keep refs in sync
  useEffect(() => { dirtyRef.current = isDirty }, [isDirty])
  useEffect(() => { surveyIdRef.current = surveyId }, [surveyId])
  useEffect(() => { versionRef.current = version }, [version])

  // ============================================
  // SECTION DATA ACCESS
  // ============================================

  const getSectionData = useCallback((section: string): Record<string, any> | null => {
    const resolved = resolveSection(section)
    return sectionData[resolved] || null
  }, [sectionData])

  const getSectionComplete = useCallback((section: string): boolean => {
    const resolved = resolveSection(section)
    return sectionComplete[resolved] || false
  }, [sectionComplete])

  // ============================================
  // SECTION DATA MUTATION
  // ============================================

  const setSectionData = useCallback((section: string, data: Record<string, any>) => {
    const resolved = resolveSection(section)
    setSectionDataMap(prev => ({ ...prev, [resolved]: data }))
    setIsDirty(true)
    dirtyRef.current = true
  }, [])

  const setSectionComplete = useCallback((section: string, complete: boolean) => {
    const resolved = resolveSection(section)
    setSectionCompleteMap(prev => ({ ...prev, [resolved]: complete }))
    setIsDirty(true)
    dirtyRef.current = true
  }, [])

  // ============================================
  // SAVE TO SUPABASE (via Netlify function)
  // ============================================

  const saveToSupabase = useCallback(async (section?: string): Promise<boolean> => {
    const sid = surveyIdRef.current
    if (!sid) {
      console.warn('[AssessmentContext] No surveyId — cannot save')
      return false
    }

    if (savingRef.current) {
      console.log('[AssessmentContext] Save already in progress, skipping')
      return false
    }

    savingRef.current = true
    setIsSaving(true)
    setLastSaveError(null)

    try {
      // Build the data payload from current state
      const payload: Record<string, any> = {}

      if (section) {
        // Save just one section
        const resolved = resolveSection(section)
        const dbDataKey = SECTION_TO_DB_DATA[resolved]
        const dbCompleteKey = SECTION_TO_DB_COMPLETE[resolved]
        if (dbDataKey && sectionData[resolved]) {
          payload[dbDataKey] = sectionData[resolved]
        }
        if (dbCompleteKey && sectionComplete[resolved]) {
          payload[dbCompleteKey] = true
        }
      } else {
        // Save all sections that have data
        for (const key of SECTION_KEYS) {
          const dbDataKey = SECTION_TO_DB_DATA[key]
          const dbCompleteKey = SECTION_TO_DB_COMPLETE[key]
          if (dbDataKey && sectionData[key]) {
            payload[dbDataKey] = sectionData[key]
          }
          if (dbCompleteKey && sectionComplete[key]) {
            payload[dbCompleteKey] = true
          }
        }
      }

      // Add metadata
      if (companyName) payload.company_name = companyName
      if (email) payload.email = email.toLowerCase().trim()
      if (authCompleted) payload.auth_completed = true
      if (paymentCompleted) payload.payment_completed = true
      if (paymentMethod) payload.payment_method = paymentMethod
      if (paymentDate) payload.payment_date = paymentDate
      if (surveySubmitted) payload.survey_submitted = true
      if (employeeSurveyOptIn !== null) payload.employee_survey_opt_in = employeeSurveyOptIn
      if (employeeSurveyOptInDate) payload.employee_survey_opt_in_date = employeeSurveyOptInDate

      // Add first name, last name, title to firmographics_data if present
      if (loginFirstName || loginLastName || loginTitle) {
        if (!payload.firmographics_data) {
          payload.firmographics_data = sectionData['firmographics'] || {}
        }
        if (loginFirstName) payload.firmographics_data.firstName = loginFirstName
        if (loginLastName) payload.firmographics_data.lastName = loginLastName
        if (loginTitle) payload.firmographics_data.title = loginTitle
      }

      // Extract company name from firmographics if not set
      if (!payload.company_name && payload.firmographics_data?.companyName) {
        payload.company_name = payload.firmographics_data.companyName
      }

      if (Object.keys(payload).length === 0) {
        savingRef.current = false
        setIsSaving(false)
        setIsDirty(false)
        dirtyRef.current = false
        return true
      }

      // Determine user type for sync
      const currentUserType = userType || 'compd'
      const normalizedId = sid.replace(/-/g, '').toUpperCase()

      // Get session for regular users
      let accessToken = ''
      let userId = ''
      if (currentUserType === 'regular') {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session) {
          accessToken = sessionData.session.access_token
          userId = sessionData.session.user.id
        }
      }

      const syncPayload: Record<string, any> = {
        user_id: userId || '',
        data: payload,
        userType: currentUserType,
        accessToken,
        source: 'autosync',
        expectedVersion: versionRef.current > 0 ? versionRef.current : undefined,
        survey_id: sid,
        fallbackSurveyId: sid,
        fallbackAppId: normalizedId,
      }

      const response = await fetch('/.netlify/functions/sync-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify(syncPayload),
      })

      const result = await response.json()

      // Handle missing expectedVersion — fetch from server and retry
      if (response.status === 400 && result.missingExpected && result.currentVersion) {
        setVersion(result.currentVersion)
        versionRef.current = result.currentVersion
        savingRef.current = false
        setIsSaving(false)
        // Retry with correct version
        return saveToSupabase(section)
      }

      // Handle version conflict — update version and retry once
      if (response.status === 409 && result.actualVersion) {
        setVersion(result.actualVersion)
        versionRef.current = result.actualVersion
        savingRef.current = false
        setIsSaving(false)
        return saveToSupabase(section)
      }

      if (!response.ok || result.success === false) {
        const errMsg = result.error || 'Save failed'
        console.error('[AssessmentContext] Save failed:', errMsg)
        setLastSaveError(errMsg)
        savingRef.current = false
        setIsSaving(false)
        return false
      }

      // Success
      if (result.newVersion) {
        setVersion(result.newVersion)
        versionRef.current = result.newVersion
      }
      setIsDirty(false)
      dirtyRef.current = false
      setLastSaveError(null)
      savingRef.current = false
      setIsSaving(false)

      // Dispatch event for any UI components that want to show save status
      window.dispatchEvent(new CustomEvent('assessment-saved'))

      return true
    } catch (err: any) {
      console.error('[AssessmentContext] Save exception:', err)
      setLastSaveError(err.message || 'Save failed')
      savingRef.current = false
      setIsSaving(false)
      return false
    }
  }, [sectionData, sectionComplete, companyName, email, authCompleted, paymentCompleted,
      paymentMethod, paymentDate, userType, surveySubmitted, employeeSurveyOptIn,
      employeeSurveyOptInDate, loginFirstName, loginLastName, loginTitle])

  // ============================================
  // LOAD FROM SUPABASE
  // ============================================

  const loadFromSupabase = useCallback(async (sid: string): Promise<boolean> => {
    const normalized = sid.replace(/-/g, '').toUpperCase()

    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .or(`app_id.eq.${sid},app_id.eq.${normalized},survey_id.eq.${sid},survey_id.eq.${normalized}`)
        .maybeSingle()

      if (error || !data) {
        console.log('[AssessmentContext] No record found for:', sid)
        return false
      }

      setFullRecordFromDB(data)
      return true
    } catch (err) {
      console.error('[AssessmentContext] Load error:', err)
      return false
    }
  }, [])

  // ============================================
  // SET FULL RECORD (from Supabase row)
  // ============================================

  const setFullRecordFromDB = useCallback((record: any) => {
    // Identity
    setSurveyId(record.survey_id || record.app_id || null)
    setEmail(record.email || null)
    setCompanyName(record.company_name || null)
    setVersion(record.version || 1)
    versionRef.current = record.version || 1

    // Auth/flow
    const inferredAuthComplete = record.auth_completed ||
      record.survey_submitted ||
      (record.firmographics_complete && record.general_benefits_complete &&
       record.current_support_complete && record.dimension1_complete)
    setAuthCompleted(!!inferredAuthComplete)
    setPaymentCompleted(!!record.payment_completed)
    setPaymentMethod(record.payment_method || null)
    setPaymentDate(record.payment_date || null)
    setSurveySubmitted(!!record.survey_submitted)
    if (record.employee_survey_opt_in !== null && record.employee_survey_opt_in !== undefined) {
      setEmployeeSurveyOptIn(record.employee_survey_opt_in)
    }
    if (record.employee_survey_opt_in_date) {
      setEmployeeSurveyOptInDate(record.employee_survey_opt_in_date)
    }

    // Determine user type
    if (record.survey_id?.startsWith('FP-')) {
      setUserType('fp')
    } else if (record.user_id) {
      setUserType('regular')
    } else {
      setUserType('compd')
    }

    // Login metadata from firmographics
    if (record.firmographics_data) {
      setLoginFirstName(record.firmographics_data.firstName || null)
      setLoginLastName(record.firmographics_data.lastName || null)
      setLoginTitle(record.firmographics_data.title || null)
    }

    // Section data
    const newData: Record<string, Record<string, any> | null> = {}
    const newComplete: Record<string, boolean> = {}

    newData.firmographics = record.firmographics_data || null
    newData.general_benefits = record.general_benefits_data || null
    newData.current_support = record.current_support_data || null
    newData.cross_dimensional = record.cross_dimensional_data || null
    newData.employee_impact = record.employee_impact_data || null

    newComplete.firmographics = !!record.firmographics_complete
    newComplete.general_benefits = !!record.general_benefits_complete
    newComplete.current_support = !!record.current_support_complete
    newComplete.cross_dimensional = !!record.cross_dimensional_complete
    newComplete.employee_impact = !!record.employee_impact_complete

    for (let i = 1; i <= 13; i++) {
      newData[`dimension${i}`] = record[`dimension${i}_data`] || null
      newComplete[`dimension${i}`] = !!record[`dimension${i}_complete`]
    }

    setSectionDataMap(newData)
    setSectionCompleteMap(newComplete)
    setIsLoaded(true)
    setIsDirty(false)
    dirtyRef.current = false

    // Store survey ID in sessionStorage for page refresh recovery
    if (record.survey_id || record.app_id) {
      sessionStorage.setItem('current_survey_id', record.survey_id || record.app_id)
    }
  }, [])

  // Expose setFullRecord that takes a raw DB record
  const setFullRecord = useCallback((record: any) => {
    setFullRecordFromDB(record)
  }, [setFullRecordFromDB])

  // ============================================
  // CLEAR ALL (logout)
  // ============================================

  const clearAll = useCallback(() => {
    setSurveyId(null)
    setEmail(null)
    setCompanyName(null)
    setVersion(0)
    setUserType(null)
    setAuthCompleted(false)
    setPaymentCompleted(false)
    setPaymentMethod(null)
    setPaymentDate(null)
    setSurveySubmitted(false)
    setEmployeeSurveyOptIn(null)
    setEmployeeSurveyOptInDate(null)
    setLoginFirstName(null)
    setLoginLastName(null)
    setLoginTitle(null)
    setSectionDataMap({})
    setSectionCompleteMap({})
    setIsLoaded(false)
    setIsDirty(false)
    setLastSaveError(null)
    dirtyRef.current = false
    versionRef.current = 0
    sessionStorage.removeItem('current_survey_id')
  }, [])

  // ============================================
  // AUTO-SAVE TIMER (every 30 seconds if dirty)
  // ============================================

  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current && !savingRef.current && surveyIdRef.current) {
        console.log('[AssessmentContext] Auto-save triggered')
        saveToSupabase()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [saveToSupabase])

  // ============================================
  // VISIBILITY CHANGE — save when tab becomes hidden
  // ============================================

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && dirtyRef.current && !savingRef.current && surveyIdRef.current) {
        console.log('[AssessmentContext] Visibility change — saving')
        saveToSupabase()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [saveToSupabase])

  // ============================================
  // BEFORE UNLOAD — warn if unsaved changes
  // ============================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault()
        // Try a last-ditch save
        if (surveyIdRef.current) {
          navigator.sendBeacon(
            '/.netlify/functions/sync-assessment',
            JSON.stringify({
              survey_id: surveyIdRef.current,
              data: {},  // beacon has size limits, so just trigger a version bump
              userType: 'compd',
              source: 'beacon',
            })
          )
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // ============================================
  // SESSION STORAGE RECOVERY — re-fetch on page refresh
  // ============================================

  useEffect(() => {
    if (!surveyId && !isLoaded) {
      const savedId = sessionStorage.getItem('current_survey_id')
      if (savedId) {
        console.log('[AssessmentContext] Recovering from sessionStorage:', savedId)
        loadFromSupabase(savedId)
      }
    }
  }, [surveyId, isLoaded, loadFromSupabase])

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: AssessmentContextType = {
    surveyId, email, companyName, version, userType,
    authCompleted, paymentCompleted, paymentMethod, paymentDate,
    surveySubmitted, employeeSurveyOptIn, employeeSurveyOptInDate,
    getSectionData, getSectionComplete,
    setSectionData, setSectionComplete,
    saveToSupabase, loadFromSupabase, setFullRecord,
    isDirty, isSaving, lastSaveError, isLoaded,
    setSurveyId, setEmail, setCompanyName,
    setAuthCompleted, setPaymentCompleted, setPaymentMethod, setPaymentDate,
    setUserType, setSurveySubmitted, setEmployeeSurveyOptIn, setEmployeeSurveyOptInDate,
    loginFirstName, loginLastName, loginTitle,
    setLoginFirstName, setLoginLastName, setLoginTitle,
    clearAll,
  }

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  )
}

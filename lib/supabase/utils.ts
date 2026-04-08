// Survey cycle year: the CAC prefix uses the survey index year, not calendar year.
// e.g. the 2027 survey cycle (which runs during calendar year 2026-2027) uses CAC27.
const SURVEY_CYCLE_YEAR = 27

export function generateAppId(): string {
  const date = new Date()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  
  const sequence = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const random = chars.charAt(Math.floor(Math.random() * chars.length)) +
                 chars.charAt(Math.floor(Math.random() * chars.length))
  
  return `CAC${SURVEY_CYCLE_YEAR}${mm}${dd}${sequence}${random}`
}

export function formatAppId(appId: string): string {
  // Remove any existing dashes first
  const cleanId = appId.replace(/-/g, '')
  
  // Should be 16 characters: CAC (3) + YYMMDD (6) + sequence (5) + letters (2)
  if (cleanId.length !== 16) return appId
  
  // Format as: CAC-251022-81410SA
  return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 9)}-${cleanId.slice(9)}`
}

export function isValidAppId(appId: string): boolean {
  // Remove dashes for validation
  const cleanId = appId.replace(/-/g, '')
  
  // CAC + 6 digits (date) + 5 digits (sequence) + 2 letters = 16 chars
  const regex = /^CAC\d{11}[A-Z]{2}$/
  return regex.test(cleanId)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

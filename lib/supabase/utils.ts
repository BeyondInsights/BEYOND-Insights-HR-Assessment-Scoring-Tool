export function generateAppId(): string {
  const date = new Date()
  const yy = date.getFullYear().toString().slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  
  const sequence = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const random = chars.charAt(Math.floor(Math.random() * chars.length)) +
                 chars.charAt(Math.floor(Math.random() * chars.length))
  
  return `CAC${yy}${mm}${dd}${sequence}${random}`
}

export function formatAppId(appId: string): string {
  if (appId.length !== 13) return appId
  return `${appId.slice(0, 3)}-${appId.slice(3, 9)}-${appId.slice(9)}`
}

export function isValidAppId(appId: string): boolean {
  const regex = /^CAC\d{6}[A-Z0-9]{5}$/
  return regex.test(appId)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

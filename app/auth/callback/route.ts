import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('=== AUTH CALLBACK START ===')
  console.log('Request URL:', requestUrl.href)
  console.log('Code present:', !!code)

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Exchange error:', exchangeError)
    
    // Check if user has viewed the letter
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('User:', user?.id)
    console.log('User error:', userError)
    
    if (user) {
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('letter_viewed, email')
        .eq('user_id', user.id)
        .single()
      
      console.log('Assessment data:', assessment)
      console.log('Assessment error:', assessmentError)
      console.log('Letter viewed:', assessment?.letter_viewed)
      
      // First-time user - send to letter
      if (!assessment?.letter_viewed) {
        console.log('🔀 REDIRECTING TO /letter')
        return NextResponse.redirect(`${requestUrl.origin}/letter`)
      }
      
      console.log('✅ Letter already viewed, going to dashboard')
    }
  }

  // Returning user - go straight to dashboard
  console.log('🔀 REDIRECTING TO /dashboard')
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}

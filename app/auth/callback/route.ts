import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
    
    // Check if user has viewed the letter
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('letter_viewed')
        .eq('user_id', user.id)
        .single()
      
      console.log('Assessment data:', assessment) // Debug log
      
      // First-time user - send to letter
      if (!assessment?.letter_viewed) {
        console.log('Redirecting to /letter') // Debug log
        return NextResponse.redirect(`${requestUrl.origin}/letter`)
      }
    }
  }

  // Returning user - go straight to dashboard
  console.log('Redirecting to /dashboard') // Debug log
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}

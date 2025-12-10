import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Admin email whitelist - keep in sync with admin-auth-wrapper.tsx
const ADMIN_EMAILS = [
  'andy.borinstein@beyondinsights.com',
  'john.bekier@beyondinsights.com',
  'leslie.hutchings@gmail.com',
  'barbara.deal@publicisgroupe.com',
]

export async function POST(request: Request) {
  try {
    // Get admin email from request body
    const { adminEmail } = await request.json()
    
    // Verify admin email
    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch all assessments
    const { data, error } = await supabaseAdmin
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assessments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assessments: data })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

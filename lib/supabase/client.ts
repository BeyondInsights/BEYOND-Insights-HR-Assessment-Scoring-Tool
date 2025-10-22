import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lfyctufmiqytyfvrwhnf.supabase.co'
const supabaseAnonKey = 'sb_publishable_pJqw4HWgNXXMq7GYboI7g0_9tUocjyb'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

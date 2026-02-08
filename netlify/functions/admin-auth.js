// netlify/functions/admin-auth.js
// ============================================
// SERVER-SIDE ADMIN AUTHENTICATION
// No credentials are ever sent to the browser
// ============================================

const crypto = require('crypto');

// Admin users are stored in Netlify environment variable ADMIN_USERS
// Format: JSON object with email as key
// {
//   "email@example.com": {
//     "passwordHash": "sha256 hash of password",
//     "role": "super_admin" | "admin",
//     "name": "Display Name"
//   }
// }

// Helper to hash passwords (use this to generate hashes for env var)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate secure session token
function generateSessionToken() {
  return crypto.randomBytes(48).toString('hex');
}

// Supabase client for audit logging
const { createClient } = require('@supabase/supabase-js');

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Log authentication events
async function logAuthEvent(eventType, email, ip, userAgent, details = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.log('Audit log (no Supabase):', { eventType, email, ip, details });
    return;
  }
  
  try {
    await supabase.from('admin_audit_log').insert({
      event_type: eventType,
      user_email: email || 'unknown',
      ip_address: ip,
      user_agent: userAgent,
      details: details,
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Get client info for logging
  const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   event.headers['client-ip'] || 
                   'unknown';
  const userAgent = event.headers['user-agent'] || 'unknown';

  try {
    const { email, password, action } = JSON.parse(event.body || '{}');

    // ============================================
    // ACTION: LOGIN
    // ============================================
    if (action === 'login') {
      if (!email || !password) {
        await logAuthEvent('login_failed', email, clientIP, userAgent, { reason: 'missing_credentials' });
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Email and password are required' }),
        };
      }

      // Get admin users from environment variable
      let adminUsers = {};
      try {
        adminUsers = JSON.parse(process.env.ADMIN_USERS || '{}');
      } catch (e) {
        console.error('Failed to parse ADMIN_USERS env var:', e);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Server configuration error' }),
        };
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = adminUsers[normalizedEmail];

      // Check if user exists (generic error to prevent enumeration)
      if (!user) {
        await logAuthEvent('login_failed', normalizedEmail, clientIP, userAgent, { reason: 'user_not_found' });
        
        // Add small delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid email or password' }),
        };
      }

      // Verify password
      const providedHash = hashPassword(password);
      if (providedHash !== user.passwordHash) {
        await logAuthEvent('login_failed', normalizedEmail, clientIP, userAgent, { reason: 'wrong_password' });
        
        // Add small delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid email or password' }),
        };
      }

      // Generate session
      const sessionToken = generateSessionToken();
      const expiresAt = Date.now() + (8 * 60 * 60 * 1000); // 8 hours

      // Store session server-side (in Supabase)
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase.from('admin_sessions').upsert({
          email: normalizedEmail,
          session_token: sessionToken,
          expires_at: new Date(expiresAt).toISOString(),
          ip_address: clientIP,
          user_agent: userAgent,
          created_at: new Date().toISOString(),
        }, { onConflict: 'email' });
      }

      // Log successful login
      await logAuthEvent('login_success', normalizedEmail, clientIP, userAgent, { role: user.role });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          sessionToken,
          role: user.role,
          name: user.name || normalizedEmail.split('@')[0],
          expiresAt,
          // Warning time: 15 minutes before expiry
          warnAt: expiresAt - (15 * 60 * 1000),
        }),
      };
    }

    // ============================================
    // ACTION: VERIFY SESSION
    // ============================================
    if (action === 'verify') {
      const { sessionToken } = JSON.parse(event.body || '{}');
      
      if (!sessionToken) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valid: false, error: 'No session token' }),
        };
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        // Fallback: can't verify without Supabase
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valid: false, error: 'Server configuration error' }),
        };
      }

      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .single();

      if (error || !session) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valid: false, error: 'Invalid session' }),
        };
      }

      // Check if expired
      if (new Date(session.expires_at) < new Date()) {
        // Clean up expired session
        await supabase.from('admin_sessions').delete().eq('session_token', sessionToken);
        
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valid: false, error: 'Session expired' }),
        };
      }

      // Get user role
      let adminUsers = {};
      try {
        adminUsers = JSON.parse(process.env.ADMIN_USERS || '{}');
      } catch (e) {
        console.error('Failed to parse ADMIN_USERS:', e);
      }
      
      const user = adminUsers[session.email];

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valid: true,
          email: session.email,
          role: user?.role || 'admin',
          name: user?.name || session.email.split('@')[0],
          expiresAt: new Date(session.expires_at).getTime(),
          warnAt: new Date(session.expires_at).getTime() - (15 * 60 * 1000),
        }),
      };
    }

    // ============================================
    // ACTION: LOGOUT
    // ============================================
    if (action === 'logout') {
      const { sessionToken } = JSON.parse(event.body || '{}');
      
      if (sessionToken) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          // Get email for logging before deleting
          const { data: session } = await supabase
            .from('admin_sessions')
            .select('email')
            .eq('session_token', sessionToken)
            .single();
          
          if (session) {
            await logAuthEvent('logout', session.email, clientIP, userAgent, {});
          }
          
          await supabase.from('admin_sessions').delete().eq('session_token', sessionToken);
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      };
    }

    // Unknown action
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unknown action' }),
    };

  } catch (error) {
    console.error('Admin auth error:', error);
    await logAuthEvent('auth_error', 'unknown', clientIP, userAgent, { error: error.message });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Authentication failed' }),
    };
  }
};

// ============================================
// UTILITY: Generate password hash
// Run this locally to generate hashes for ADMIN_USERS env var:
// node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PASSWORD').digest('hex'))"
// ============================================

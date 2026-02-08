#!/usr/bin/env node
/**
 * Password Hash Generator for BEYOND Insights Admin Users
 * 
 * Usage:
 *   node generate-password-hash.js "YourPassword123!"
 * 
 * Then copy the hash into your ADMIN_USERS environment variable.
 */

const crypto = require('crypto');

const password = process.argv[2];

if (!password) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║          BEYOND Insights Password Hash Generator               ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  node generate-password-hash.js "YourPassword123!"

Example:
  node generate-password-hash.js "SecureAdminPass!"
  
The output hash should be used in the ADMIN_USERS environment variable.
`);
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    Password Hash Generated                      ║
╚════════════════════════════════════════════════════════════════╝

Password: ${password.substring(0, 3)}${'*'.repeat(password.length - 3)}
Hash:     ${hash}

Add this to your ADMIN_USERS Netlify environment variable:

{
  "user@example.com": {
    "passwordHash": "${hash}",
    "role": "super_admin",
    "name": "User Name"
  }
}

⚠️  SECURITY REMINDERS:
• Never share or commit the actual password
• Use different passwords for different admin users
• Use strong passwords (12+ chars, mixed case, numbers, symbols)
• Rotate passwords periodically
`);

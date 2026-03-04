'use client';

import { useSecurityProtections } from '@/lib/useSecurityProtections';

/**
 * Client component wrapper that activates security protections.
 * Drop this into any server component layout to apply protections
 * across all child pages without modifying each page individually.
 */
export default function SecurityProtection() {
  useSecurityProtections();
  return null;
}

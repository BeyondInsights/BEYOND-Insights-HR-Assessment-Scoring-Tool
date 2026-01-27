/**
 * TAB LOCK - Cross-tab protection with TTL
 * Drop-in from ChatGPT review
 */

type LockRecord = { tabId: string; ts: number };

/**
 * Get or create a stable tab ID (stored in sessionStorage)
 */
export function getOrCreateTabId(key = "rescue_tab_id"): string {
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;

  // Prefer crypto randomness if available
  const rand =
    globalThis.crypto?.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      : String(Math.random()).slice(2);

  const id = `tab_${Date.now()}_${rand}`;
  sessionStorage.setItem(key, id);
  return id;
}

/**
 * Acquire a cross-tab lock using localStorage with TTL
 * Returns true if lock acquired, false if another tab holds it
 */
export function acquireRescueLock(
  lockKey: string,
  tabId: string,
  ttlMs = 30_000
): boolean {
  const now = Date.now();

  try {
    const raw = localStorage.getItem(lockKey);
    if (raw) {
      const rec = JSON.parse(raw) as LockRecord;
      const isExpired = !rec?.ts || now - rec.ts > ttlMs;
      const isMine = rec?.tabId === tabId;

      if (!isExpired && !isMine) return false;
    }

    localStorage.setItem(lockKey, JSON.stringify({ tabId, ts: now } as LockRecord));
    return true;
  } catch {
    // If localStorage is blocked, fail safe: allow (but you lose cross-tab protection)
    return true;
  }
}

/**
 * Refresh the lock TTL (call periodically during long operations)
 */
export function refreshRescueLock(lockKey: string, tabId: string): void {
  try {
    localStorage.setItem(lockKey, JSON.stringify({ tabId, ts: Date.now() } as LockRecord));
  } catch {
    /* ignore */
  }
}

/**
 * Release the lock (only if we own it)
 */
export function releaseRescueLock(lockKey: string, tabId: string): void {
  try {
    const raw = localStorage.getItem(lockKey);
    if (!raw) return;
    const rec = JSON.parse(raw) as LockRecord;
    if (rec?.tabId === tabId) localStorage.removeItem(lockKey);
  } catch {
    /* ignore */
  }
}

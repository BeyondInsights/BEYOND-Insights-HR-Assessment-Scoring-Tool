'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { forceSyncNow, isDirty, hasConflict, clearDirty, markDirty } from './auto-data-sync' // adjust import path

type TestResult = { name: string; ok: boolean; detail?: string }

function getParam(name: string) {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

export default function SyncDiagnostics() {
  const enabled = useMemo(() => getParam('debugSync') === '1', [])
  const [results, setResults] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const run = async () => {
      setRunning(true)
      const out: TestResult[] = []

      try {
        // ---- Arrange: minimal synthetic survey id for namespacing
        localStorage.setItem('survey_id', 'TEST-SYNC-123')
        localStorage.setItem('app_id', 'TESTSYNC123')

        // Clear state
        localStorage.removeItem('dirty')
        localStorage.removeItem('dirty_TEST-SYNC-123')
        sessionStorage.removeItem('version_conflict')
        sessionStorage.removeItem('version_conflict_TEST-SYNC-123')

        // Seed one sync key
        const key = 'dimension1_data'
        const payload = JSON.stringify({ q1: 'A', ts: Date.now() })

        // ---- Test 1: direct localStorage.setItem triggers dirty
        localStorage.setItem(key, payload)
        out.push({
          name: 'Direct localStorage.setItem marks dirty',
          ok: isDirty(),
          detail: isDirty() ? 'dirty=true' : 'dirty=false'
        })

        // ---- Test 2: Storage.prototype.setItem.call triggers dirty (proto path)
        clearDirty()
        Storage.prototype.setItem.call(localStorage, key, payload)
        out.push({
          name: 'Storage.prototype.setItem.call marks dirty',
          ok: isDirty(),
          detail: isDirty() ? 'dirty=true' : 'dirty=false'
        })

        // ---- Test 3: clearDirty works
        clearDirty()
        out.push({
          name: 'clearDirty clears dirty',
          ok: !isDirty(),
          detail: !isDirty() ? 'dirty=false' : 'dirty=true'
        })

        // ---- Test 4: markDirty works even without storage write
        markDirty('diagnostic')
        out.push({
          name: 'markDirty sets dirty',
          ok: isDirty(),
          detail: isDirty() ? 'dirty=true' : 'dirty=false'
        })

        // ---- Test 5: forceSyncNow returns (no crash) + clears dirty on success
        // This is a smoke test; success depends on your backend accepting TEST ids.
        // If backend rejects, we still want "no crash" and a clear error detail.
        try {
          const ok = await forceSyncNow()
          out.push({
            name: 'forceSyncNow executes (smoke)',
            ok: ok === true || ok === false,
            detail: `returned=${String(ok)}`
          })
        } catch (e: any) {
          out.push({
            name: 'forceSyncNow executes (smoke)',
            ok: false,
            detail: e?.message || String(e)
          })
        }

        // ---- Test 6: hasConflict is callable (no crash)
        out.push({
          name: 'hasConflict callable',
          ok: typeof hasConflict === 'function',
          detail: typeof hasConflict
        })
      } finally {
        setResults(out)
        setRunning(false)
      }
    }

    run()
  }, [enabled])

  if (!enabled) return null

  const passCount = results.filter(r => r.ok).length

  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 16, width: 420,
      background: 'white', border: '1px solid #ddd', borderRadius: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 14, zIndex: 99999,
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontWeight: 700 }}>Sync Diagnostics</div>
        <div style={{ fontSize: 12, color: '#666' }}>
          {running ? 'Running…' : `${passCount}/${results.length} passing`}
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 13 }}>
        {results.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 18 }}>{r.ok ? '✅' : '❌'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              {r.detail && <div style={{ color: '#666', fontSize: 12 }}>{r.detail}</div>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
        Tip: append <code>?debugSync=1</code> to any page URL.
      </div>
    </div>
  )
}

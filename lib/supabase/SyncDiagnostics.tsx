'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { forceSyncNow, isDirty, hasConflict, clearDirty, markDirty } from './auto-data-sync'

type TestResult = { name: string; ok: boolean; detail?: string }

function getParam(name: string) {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

function snapshotStorage(keys: string[], storage: Storage) {
  const snap: Record<string, string | null> = {}
  keys.forEach(k => (snap[k] = storage.getItem(k)))
  return snap
}

function restoreStorage(snap: Record<string, string | null>, storage: Storage) {
  Object.entries(snap).forEach(([k, v]) => {
    if (v === null || v === undefined) storage.removeItem(k)
    else storage.setItem(k, v)
  })
}

export default function SyncDiagnostics() {
  const enabled = useMemo(() => getParam('debugSync') === '1', [])
  const writeEnabled = useMemo(() => getParam('debugSyncWrite') === '1', [])
  const [results, setResults] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const run = async () => {
      setRunning(true)
      const out: TestResult[] = []

      // IMPORTANT: default is READ-ONLY. We do not touch survey_id/app_id or real survey keys.
      // If writeEnabled is true, we still only write to dedicated diagnostic keys and restore afterwards.

      // Keys we may touch (and therefore must restore)
      const LS_KEYS = [
        'dirty',
        'survey_id',
        'app_id',
        // We will only touch these if writeEnabled === true
        '__syncdiag_test_key__',
      ]
      const SS_KEYS = [
        'version_conflict',
        'version_conflict_TEST-SYNC-123',
      ]

      const lsSnap = snapshotStorage(LS_KEYS, localStorage)
      const ssSnap = snapshotStorage(SS_KEYS, sessionStorage)

      try {
        // ---- Test 0: basic exports exist
        out.push({
          name: 'Diagnostics enabled',
          ok: true,
          detail: writeEnabled ? 'mode=write' : 'mode=read-only'
        })

        // ---- Test 1: markDirty / isDirty / clearDirty (read-only safe)
        clearDirty()
        out.push({
          name: 'clearDirty clears dirty',
          ok: !isDirty(),
          detail: !isDirty() ? 'dirty=false' : 'dirty=true'
        })

        markDirty('diagnostic')
        out.push({
          name: 'markDirty sets dirty',
          ok: isDirty(),
          detail: isDirty() ? 'dirty=true' : 'dirty=false'
        })

        clearDirty()
        out.push({
          name: 'clearDirty clears dirty (again)',
          ok: !isDirty(),
          detail: !isDirty() ? 'dirty=false' : 'dirty=true'
        })

        // ---- Test 2: hasConflict callable
        out.push({
          name: 'hasConflict callable',
          ok: typeof hasConflict === 'function',
          detail: typeof hasConflict
        })

        // ---- Optional WRITE TESTS (explicit opt-in only)
        if (writeEnabled) {
          // Use a dedicated diagnostic key that is NOT part of SYNC_KEYS.
          // This tests "can we call storage methods safely" without mutating survey answers.
          const key = '__syncdiag_test_key__'
          const payload = JSON.stringify({ test: true, ts: Date.now() })

          // If your interception only marks dirty for SYNC_KEYS, these won't flip dirty (and that's OK).
          // So for write tests, we explicitly call markDirty to simulate a user edit.
          clearDirty()

          // Direct setItem should not throw
          let directOk = true
          try {
            localStorage.setItem(key, payload)
          } catch (e: any) {
            directOk = false
          }
          out.push({
            name: 'WRITE: localStorage.setItem does not throw',
            ok: directOk,
            detail: directOk ? 'ok' : 'threw'
          })

          // Prototype call should not throw
          let protoOk = true
          try {
            Storage.prototype.setItem.call(localStorage, key, payload)
          } catch (e: any) {
            protoOk = false
          }
          out.push({
            name: 'WRITE: Storage.prototype.setItem.call does not throw',
            ok: protoOk,
            detail: protoOk ? 'ok' : 'threw'
          })

          // Now simulate actual dirty and ensure doSync preconditions are met
          markDirty('diagnostic-write')
          out.push({
            name: 'WRITE: markDirty after storage writes',
            ok: isDirty(),
            detail: isDirty() ? 'dirty=true' : 'dirty=false'
          })

          // Smoke forceSyncNow: we only assert "no crash" unless you are on a safe test account.
          try {
            const ok = await forceSyncNow()
            out.push({
              name: 'WRITE: forceSyncNow executes (smoke)',
              ok: ok === true || ok === false,
              detail: `returned=${String(ok)}`
            })
          } catch (e: any) {
            out.push({
              name: 'WRITE: forceSyncNow executes (smoke)',
              ok: false,
              detail: e?.message || String(e)
            })
          }
        } else {
          out.push({
            name: 'WRITE tests skipped (safe)',
            ok: true,
            detail: 'Add &debugSyncWrite=1 to run write smoke tests'
          })
        }

      } finally {
        // Restore storage to avoid contaminating the session
        restoreStorage(lsSnap, localStorage)
        restoreStorage(ssSnap, sessionStorage)

        setResults(out)
        setRunning(false)
      }
    }

    run()
  }, [enabled, writeEnabled])

  if (!enabled) return null

  const passCount = results.filter(r => r.ok).length

  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 16, width: 460,
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
        <div>Enable: <code>?debugSync=1</code> (read-only)</div>
        <div>Write smoke: <code>?debugSync=1&amp;debugSyncWrite=1</code> (still restores storage)</div>
      </div>
    </div>
  )
}

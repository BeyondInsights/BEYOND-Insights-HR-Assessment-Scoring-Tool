/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'

export default function SavedToast() {
  const [ts, setTs] = useState<number | null>(null)
  useEffect(() => {
    const onSaved = (e: any) => setTs(e?.detail?.ts ?? Date.now())
    window.addEventListener('saved:toast', onSaved)
    return () => window.removeEventListener('saved:toast', onSaved)
  }, [])
  if (!ts) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 transition-all duration-200">
      <div className="rounded-full bg-white/95 backdrop-blur px-4 py-2 shadow-lg border border-emerald-200">
        <span className="text-emerald-700 font-medium">Saved âœ“</span>
      </div>
    </div>
  )
}


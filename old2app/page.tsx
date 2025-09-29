"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Root redirect to /login (no UI) */
export default function Page() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/login")
  }, [router])

  return null
}

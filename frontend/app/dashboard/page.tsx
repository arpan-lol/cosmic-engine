'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const jwt = searchParams.get('jwt')
    if (jwt) {
      localStorage.setItem('jwt_token', jwt)
      const cleanUrl = '/dashboard/sessions'
      router.replace(cleanUrl)
    } else {
      router.replace('/dashboard/sessions')
    }
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Loading...</h2>
        <p className="text-muted-foreground mt-2">Please wait</p>
      </div>
    </div>
  )
}

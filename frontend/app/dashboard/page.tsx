'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/sessions')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}

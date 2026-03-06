import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'

export default async function HomePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt')?.value

  if (token) {
    redirect('/dashboard')
  }

  return <LandingPage />
}

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt')?.value

  if (token) {
    redirect('/dashboard')
  }

  redirect('/auth/login')
}

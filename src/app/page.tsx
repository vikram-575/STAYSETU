import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth-session'

export default async function HomePage() {
  const user = await getAuthenticatedUser()

  if (!user) redirect('/login')
  redirect('/dashboard')
}

import { redirect } from 'next/navigation'

export default function AdminRentingRedirect() {
  redirect('/admin?mode=renting')
}

import { redirect } from 'next/navigation'

export default function AdminErpRedirect() {
  redirect('/admin?mode=erp')
}

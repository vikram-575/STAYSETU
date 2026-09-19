import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'
import { ExpensesClientView } from '@/components/dashboard/expenses-client-view'

interface Props {
  searchParams: Promise<{
    category?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function ExpensesPage({ searchParams }: Props) {
  const params = await searchParams
  const selectedCat = params.category || 'all'

  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()
  const orgId = await resolveEffectiveOrgId(user)

  let expenses: any[] = []

  if (orgId && isValidUUID(orgId)) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', orgId)
        .order('expense_date', { ascending: false })
        .limit(300)

      if (!error && data) {
        expenses = data
      }
    } catch (err) {
      console.error('Failed fetching expenses:', err)
    }
  }

  return (
    <ExpensesClientView
      initialExpenses={expenses}
      initialCategory={selectedCat}
    />
  )
}

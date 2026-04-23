import { SettingsClient } from '@/components/settings/SettingsClient'
import { createServerClient } from '@/lib/supabase/server'
import { getRelanceDelays } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const [accountsRes, delays] = await Promise.all([
    supabase
      .from('email_accounts')
      .select('id, label, email, signature')
      .order('created_at', { ascending: true }),
    getRelanceDelays().catch(() => ({ delaiEnvoye: 7, delaiOuvert: 3 })),
  ])

  const accounts = accountsRes.data ?? []

  return (
    <div className="flex flex-col flex-1">
      <SettingsClient accounts={accounts} delays={delays} />
    </div>
  )
}

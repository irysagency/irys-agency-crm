import { GmailConnect } from '@/components/settings/GmailConnect'
import { GmailImport } from '@/components/settings/GmailImport'
import { TrackingStatus } from '@/components/settings/TrackingStatus'
import { createServerClient } from '@/lib/supabase/server'
import { getRelanceDelays } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const [accountsRes, delays] = await Promise.all([
    supabase
      .from('email_accounts')
      .select('id, label, email')
      .order('created_at', { ascending: true }),
    getRelanceDelays().catch(() => ({ delaiEnvoye: 7, delaiOuvert: 3 })),
  ])

  const accounts = accountsRes.data ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Paramètres</h1>
        <p className="text-sm text-text-secondary mt-1">Configuration du CRM</p>
      </div>
      <div className="max-w-xl space-y-4">
        <GmailConnect accounts={accounts} />
        <GmailImport accounts={accounts} />
        <TrackingStatus delaiEnvoye={delays.delaiEnvoye} delaiOuvert={delays.delaiOuvert} />
      </div>
    </div>
  )
}

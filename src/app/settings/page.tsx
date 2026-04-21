import { createServerClient } from '@/lib/supabase/server'
import { GmailConnect } from '@/components/settings/GmailConnect'
import { TrackingStatus } from '@/components/settings/TrackingStatus'

export const dynamic = 'force-dynamic'

async function getSettings() {
  try {
    const supabase = createServerClient()
    const [accountsRes, delayRes] = await Promise.all([
      supabase.from('email_accounts').select('id, label, email').order('created_at', { ascending: true }),
      supabase.from('app_settings').select('value').eq('key', 'relance_delai_jours').single(),
    ])
    return {
      accounts: accountsRes.data ?? [],
      delaiJours: parseInt(delayRes.data?.value ?? '4', 10) || 4,
    }
  } catch {
    return { accounts: [], delaiJours: 4 }
  }
}

export default async function SettingsPage() {
  const { accounts, delaiJours } = await getSettings()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Paramètres</h1>
        <p className="text-sm text-text-secondary mt-1">Configuration du CRM</p>
      </div>
      <div className="max-w-xl space-y-4">
        <GmailConnect accounts={accounts} />
        <TrackingStatus delaiJours={delaiJours} />
      </div>
    </div>
  )
}

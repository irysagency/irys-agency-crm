import { createServerClient } from '@/lib/supabase/server'
import { GmailConnect } from '@/components/settings/GmailConnect'
import { TrackingStatus } from '@/components/settings/TrackingStatus'

export const dynamic = 'force-dynamic'

async function getSettings() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['gmail_access_token', 'relance_delai_jours'])

  const map = Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
  return {
    isGmailConnected: Boolean(map['gmail_access_token']),
    delaiJours: parseInt(map['relance_delai_jours'] ?? '4', 10) || 4,
  }
}

export default async function SettingsPage() {
  const { isGmailConnected, delaiJours } = await getSettings()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Paramètres</h1>
        <p className="text-sm text-text-secondary mt-1">Configuration du CRM</p>
      </div>
      <div className="max-w-xl space-y-4">
        <GmailConnect isConnected={isGmailConnected} />
        <TrackingStatus delaiJours={delaiJours} />
      </div>
    </div>
  )
}

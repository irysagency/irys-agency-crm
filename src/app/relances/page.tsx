import { getRelances, getSendersForProspects } from '@/lib/supabase/queries'
import { RelancesList } from '@/components/relances/RelancesList'

export const dynamic = 'force-dynamic'

export default async function RelancesPage() {
  let prospects: Awaited<ReturnType<typeof getRelances>> = []
  try {
    prospects = await getRelances()
  } catch {
    // Supabase indisponible — affiche liste vide
  }

  const senderMap = await getSendersForProspects(prospects.map(p => p.id))
  const senders: Record<string, { label: string; email: string | null }> = {}
  senderMap.forEach((v, k) => { senders[k] = v })

  return (
    <div className="flex flex-col flex-1">
      <RelancesList initialProspects={prospects} senders={senders} />
    </div>
  )
}

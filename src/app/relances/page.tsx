import { getRelances } from '@/lib/supabase/queries'
import { RelancesList } from '@/components/relances/RelancesList'

export const dynamic = 'force-dynamic'

export default async function RelancesPage() {
  const prospects = await getRelances()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Relances</h1>
        <p className="text-sm text-text-secondary mt-1">
          {prospects.length} prospect{prospects.length !== 1 ? 's' : ''} à relancer
        </p>
      </div>
      <RelancesList initialProspects={prospects} />
    </div>
  )
}

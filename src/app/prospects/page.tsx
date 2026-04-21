import { getProspects } from '@/lib/supabase/queries'
import { KanbanBoard } from '@/components/prospects/KanbanBoard'

export const dynamic = 'force-dynamic'

export default async function ProspectsPage() {
  let prospects: Awaited<ReturnType<typeof getProspects>> = []
  try {
    prospects = await getProspects()
  } catch {
    // Supabase indisponible — affiche un kanban vide
  }
  return <KanbanBoard initialProspects={prospects} />
}

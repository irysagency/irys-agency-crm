import { getProspects } from '@/lib/supabase/queries'
import { KanbanBoard } from '@/components/prospects/KanbanBoard'

export default async function ProspectsPage() {
  const prospects = await getProspects()
  return <KanbanBoard initialProspects={prospects} />
}

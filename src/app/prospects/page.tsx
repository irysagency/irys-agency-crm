import { getProspects } from '@/lib/supabase/queries'
import { KanbanBoard } from '@/components/prospects/KanbanBoard'

export const dynamic = 'force-dynamic'

export default async function ProspectsPage() {
  const prospects = await getProspects()
  return <KanbanBoard initialProspects={prospects} />
}

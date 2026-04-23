import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { STATUTS } from '@/types'
import type { StatutType } from '@/types'

const VALID_STATUTS = new Set(STATUTS.map(s => s.key))

export const dynamic = 'force-dynamic'

interface BulkPatchBody {
  ids: string[]
  statut: StatutType
}

export async function PATCH(request: NextRequest) {
  let body: BulkPatchBody
  try {
    body = await request.json() as BulkPatchBody
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const { ids, statut } = body
  if (!Array.isArray(ids) || ids.length === 0 || !statut) {
    return NextResponse.json({ error: 'ids et statut requis' }, { status: 400 })
  }
  if (!VALID_STATUTS.has(statut)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .update({ statut, derniere_action: new Date().toISOString() })
    .in('id', ids)
    .select('id, statut')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ updated: data?.length ?? 0 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { NicheType, StatutType } from '@/types'

export const dynamic = 'force-dynamic'

interface PatchBody {
  nom?: string
  niche?: NicheType
  statut?: StatutType
  email?: string | null
  whatsapp?: string | null
  instagram?: string | null
  youtube?: string | null
  linkedin?: string | null
  notes?: string | null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: PatchBody
  try {
    body = await request.json() as PatchBody
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  // Nettoyer les champs string vides → null
  const update: Record<string, unknown> = {}
  const stringFields = ['nom', 'email', 'whatsapp', 'instagram', 'youtube', 'linkedin', 'notes'] as const
  for (const f of stringFields) {
    if (f in body) update[f] = (body[f] as string)?.trim() || null
  }
  if (body.niche)  update.niche  = body.niche
  if (body.statut) { update.statut = body.statut; update.derniere_action = new Date().toISOString() }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

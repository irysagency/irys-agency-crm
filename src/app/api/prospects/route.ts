import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { NicheType, SourceType } from '@/types'

export const dynamic = 'force-dynamic'

interface CreateProspectBody {
  nom: string
  niche: NicheType
  source?: SourceType
  email?: string
  instagram?: string
  youtube?: string
  linkedin?: string
  whatsapp?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  let body: CreateProspectBody
  try {
    body = await request.json() as CreateProspectBody
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const { nom, niche, source, email, instagram, youtube, linkedin, whatsapp, notes } = body

  if (!nom?.trim() || !niche) {
    return NextResponse.json({ error: 'Nom et niche sont obligatoires' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .insert({
      nom: nom.trim(),
      niche,
      source: source ?? 'email',
      email: email?.trim() || null,
      instagram: instagram?.trim() || null,
      youtube: youtube?.trim() || null,
      linkedin: linkedin?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      notes: notes?.trim() || null,
      statut: 'a_contacter',
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

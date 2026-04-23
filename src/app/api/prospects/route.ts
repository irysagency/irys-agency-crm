import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { NICHES } from '@/types'
import type { NicheType } from '@/types'

export const dynamic = 'force-dynamic'

interface CreateProspectBody {
  nom: string
  niche: NicheType
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

  const { nom, niche, email, instagram, youtube, linkedin, whatsapp, notes } = body

  // Validation
  if (!nom?.trim()) {
    return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 })
  }
  if (nom.trim().length > 200) {
    return NextResponse.json({ error: 'Le nom ne peut pas dépasser 200 caractères' }, { status: 400 })
  }
  if (!niche || !(NICHES as readonly string[]).includes(niche)) {
    return NextResponse.json({ error: `La niche est invalide. Valeurs acceptées : ${NICHES.join(', ')}` }, { status: 400 })
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (email?.trim() && !emailRegex.test(email.trim())) {
    return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
  }
  if (instagram?.trim() && instagram.trim().length > 100) {
    return NextResponse.json({ error: 'Instagram ne peut pas dépasser 100 caractères' }, { status: 400 })
  }
  const urlRegex = /^https?:\/\//
  if (youtube?.trim() && !urlRegex.test(youtube.trim())) {
    return NextResponse.json({ error: 'YouTube doit commencer par http:// ou https://' }, { status: 400 })
  }
  if (linkedin?.trim() && !urlRegex.test(linkedin.trim())) {
    return NextResponse.json({ error: 'LinkedIn doit commencer par http:// ou https://' }, { status: 400 })
  }
  if (whatsapp?.trim() && whatsapp.trim().length > 30) {
    return NextResponse.json({ error: 'WhatsApp ne peut pas dépasser 30 caractères' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .insert({
      nom: nom.trim(),
      niche,
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

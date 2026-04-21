import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { NicheType } from '@/types'

export const dynamic = 'force-dynamic'

interface N8NLeadPayload {
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
  // Vérification du token Bearer
  const authHeader = request.headers.get('Authorization')
  const expectedToken = process.env.N8N_WEBHOOK_SECRET

  if (!expectedToken) {
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 })
  }
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let body: N8NLeadPayload
  try {
    body = await request.json() as N8NLeadPayload
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { nom, niche, email, instagram, youtube, linkedin, whatsapp, notes } = body

  if (!nom?.trim() || !niche) {
    return NextResponse.json({ error: 'nom et niche sont requis' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .insert({
      nom: nom.trim(),
      niche,
      email:     email?.trim()     || null,
      instagram: instagram?.trim() || null,
      youtube:   youtube?.trim()   || null,
      linkedin:  linkedin?.trim()  || null,
      whatsapp:  whatsapp?.trim()  || null,
      notes:     notes?.trim()     || null,
      statut: 'a_contacter',
      derniere_action: new Date().toISOString(),
    })
    .select('id, nom, statut')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, prospect: data }, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { NICHES, type NicheType } from '@/types'
import { CRM_ERRORS } from '@/lib/errors'

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

function cleanStr(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length > 0 ? t : null
}

export async function POST(request: NextRequest) {
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

  const nom = cleanStr(body.nom)
  if (!nom) {
    return NextResponse.json({ error: 'nom requis' }, { status: 400 })
  }
  if (!body.niche || !NICHES.includes(body.niche)) {
    return NextResponse.json(
      { error: `${CRM_ERRORS.INVALID_NICHE}. Accepté: ${NICHES.join(', ')}` },
      { status: 400 }
    )
  }

  const email = cleanStr(body.email)
  const instagram = cleanStr(body.instagram)
  const youtube = cleanStr(body.youtube)
  const linkedin = cleanStr(body.linkedin)
  const whatsapp = cleanStr(body.whatsapp)
  const notes = cleanStr(body.notes)

  const supabase = createServerClient()

  if (email) {
    const { data: dup } = await supabase
      .from('prospects').select('id').eq('email', email).maybeSingle()
    if (dup?.id) {
      return NextResponse.json(
        { deduplicated: true, prospect_id: dup.id, reason: 'email' },
        { status: 200 }
      )
    }
  }
  if (instagram) {
    const { data: dup } = await supabase
      .from('prospects').select('id').eq('instagram', instagram).maybeSingle()
    if (dup?.id) {
      return NextResponse.json(
        { deduplicated: true, prospect_id: dup.id, reason: 'instagram' },
        { status: 200 }
      )
    }
  }

  const { data, error } = await supabase
    .from('prospects')
    .insert({
      nom, niche: body.niche, email, instagram, youtube, linkedin, whatsapp, notes,
      statut: 'a_contacter',
      derniere_action: new Date().toISOString(),
    })
    .select('id, nom, statut')
    .single()

  if (error) {
    return NextResponse.json({ error: CRM_ERRORS.SUPABASE_ERROR }, { status: 500 })
  }

  return NextResponse.json({ success: true, prospect: data }, { status: 201 })
}

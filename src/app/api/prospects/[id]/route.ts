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
  canal_contact?: 'email' | 'instagram' | 'whatsapp' | 'autre' | null
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

  // Validation des champs URL et pseudo dans le corps du PATCH
  const urlRegex = /^https?:\/\//
  if (body.youtube != null && body.youtube.trim() !== '' && !urlRegex.test(body.youtube.trim())) {
    return NextResponse.json({ error: 'YouTube doit commencer par http:// ou https://' }, { status: 400 })
  }
  if (body.linkedin != null && body.linkedin.trim() !== '' && !urlRegex.test(body.linkedin.trim())) {
    return NextResponse.json({ error: 'LinkedIn doit commencer par http:// ou https://' }, { status: 400 })
  }
  // instagram accepte un @pseudo ou une URL
  if (body.instagram != null && body.instagram.trim() !== '') {
    const ig = body.instagram.trim()
    if (ig.startsWith('http') && !urlRegex.test(ig)) {
      return NextResponse.json({ error: 'Instagram URL doit commencer par http:// ou https://' }, { status: 400 })
    }
  }

  // Nettoyer les champs string vides → null
  const update: Record<string, unknown> = {}
  const stringFields = ['nom', 'email', 'whatsapp', 'instagram', 'youtube', 'linkedin', 'notes'] as const
  for (const f of stringFields) {
    if (f in body) update[f] = (body[f] as string)?.trim() || null
  }
  if (body.niche)  update.niche  = body.niche
  if ('canal_contact' in body) update.canal_contact = body.canal_contact ?? null
  if (body.statut) {
    update.statut = body.statut
    update.derniere_action = new Date().toISOString()

    // Append to etapes history (column may not exist yet — ignore error)
    try {
      const supabaseForFetch = createServerClient()
      const { data: current, error: fetchErr } = await supabaseForFetch
        .from('prospects')
        .select('etapes')
        .eq('id', id)
        .single()
      if (!fetchErr) {
        const etapes: Array<{ statut: string; date: string }> = (current?.etapes as Array<{ statut: string; date: string }> | null) ?? []
        etapes.push({ statut: body.statut, date: new Date().toISOString() })
        update.etapes = etapes
      }
    } catch { /* migration pending */ }
  }

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

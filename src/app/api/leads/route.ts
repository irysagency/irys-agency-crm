import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { NICHES, type NicheType } from '@/types'

export const dynamic = 'force-dynamic'

function checkApiKey(request: NextRequest): boolean {
  const key = request.headers.get('x-api-key')
  const expected = process.env.LEADS_API_KEY
  if (!expected) return false
  return key === expected
}

const NICHE_MAP: Record<string, NicheType> = {
  'tech': 'Tech & IA',
  'ia': 'Tech & IA',
  'ai': 'Tech & IA',
  'finance': 'Finance & Wealth',
  'wealth': 'Finance & Wealth',
  'argent': 'Finance & Wealth',
  'productivit': 'Productivité & Second Brain',
  'second brain': 'Productivité & Second Brain',
  'entrepreneur': 'Entrepreneur',
  'business': 'Entrepreneur',
  'marketing': 'Marketing & Vente',
  'vente': 'Marketing & Vente',
  'sales': 'Marketing & Vente',
  'creator': 'Creator Economy',
  'créateur': 'Creator Economy',
  'ecommerce': 'Ecommerce',
  'e-commerce': 'Ecommerce',
  'make money': 'Make Money & Trends',
  'trends': 'Make Money & Trends',
}

function mapNiche(raw: string): NicheType {
  const lower = raw.toLowerCase()
  for (const [key, val] of Object.entries(NICHE_MAP)) {
    if (lower.includes(key)) return val
  }
  // Exact match avec les NicheType
  const exact = NICHES.find(n => n.toLowerCase() === lower)
  if (exact) return exact
  return 'Entrepreneur' // fallback
}

export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('youtube')
    .not('youtube', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // N8N compare "channel_url" vs "url_chaine" — retourner le bon format
  return NextResponse.json((data ?? []).map(r => ({ url_chaine: r.youtube })))
}

export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  let body: Record<string, string>
  try {
    body = await request.json() as Record<string, string>
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const nom = body.nom_chaine?.trim()
  const youtube = body.url_chaine?.trim()

  if (!nom || !youtube) {
    return NextResponse.json({ error: 'nom_chaine et url_chaine requis' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Dedup par url_chaine
  const { data: existing } = await supabase
    .from('prospects').select('id').eq('youtube', youtube).maybeSingle()
  if (existing?.id) {
    return NextResponse.json({ deduplicated: true, prospect_id: existing.id }, { status: 200 })
  }

  const niche = mapNiche(body.niche ?? '')
  const nbAbonnes = body.nb_abonnes ?? ''
  const analyseIa = body.analyse_ia ?? ''
  const notes = `[LEAD OS] ${nbAbonnes} abonnés\n\n${analyseIa}`.trim()

  const { data, error } = await supabase
    .from('prospects')
    .insert({
      nom,
      youtube,
      niche,
      notes: notes || null,
      statut: 'a_contacter',
      derniere_action: new Date().toISOString(),
      etapes: [],
      canal_contact: null,
    })
    .select('id, nom, statut')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, prospect: data }, { status: 201 })
}

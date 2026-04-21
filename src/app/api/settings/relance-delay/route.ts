import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Body { delaiJours: number }

export async function POST(request: NextRequest) {
  let body: Body
  try {
    body = await request.json() as Body
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const { delaiJours } = body
  if (!Number.isInteger(delaiJours) || delaiJours < 1 || delaiJours > 30) {
    return NextResponse.json({ error: 'Valeur invalide (1–30)' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'relance_delai_jours', value: String(delaiJours) })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

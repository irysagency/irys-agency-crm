import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { StatutType } from '@/types'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: { statut?: StatutType; notes?: string }
  try {
    body = await request.json() as { statut?: StatutType; notes?: string }
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .update(body)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('email_accounts')
    .select('id, label, email, signature')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const { id, signature } = await request.json() as { id: string; signature: string }
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase.from('email_accounts').update({ signature }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase.from('email_accounts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

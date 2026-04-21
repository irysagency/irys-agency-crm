import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  const { id } = await request.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase.from('email_accounts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

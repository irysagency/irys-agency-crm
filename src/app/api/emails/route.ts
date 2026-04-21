import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const prospectId = request.nextUrl.searchParams.get('prospectId')
  if (!prospectId) return NextResponse.json({ error: 'prospectId manquant' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .eq('prospect_id', prospectId)
    .order('envoye_le', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

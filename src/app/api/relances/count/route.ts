import { NextResponse } from 'next/server'
import { getRelances } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const relances = await getRelances()
    return NextResponse.json({ count: relances.length })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getRelanceDelays, setRelanceDelay } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const delays = await getRelanceDelays()
    return NextResponse.json(delays)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

interface PatchBody {
  delaiEnvoye?: number
  delaiOuvert?: number
}

function isValidDelay(n: unknown): n is number {
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 30
}

export async function POST(request: NextRequest) {
  let body: PatchBody
  try {
    body = await request.json() as PatchBody
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const hasEnvoye = body.delaiEnvoye !== undefined
  const hasOuvert = body.delaiOuvert !== undefined
  if (!hasEnvoye && !hasOuvert) {
    return NextResponse.json({ error: 'Au moins un délai requis' }, { status: 400 })
  }
  if (hasEnvoye && !isValidDelay(body.delaiEnvoye)) {
    return NextResponse.json({ error: 'delaiEnvoye invalide (1-30)' }, { status: 400 })
  }
  if (hasOuvert && !isValidDelay(body.delaiOuvert)) {
    return NextResponse.json({ error: 'delaiOuvert invalide (1-30)' }, { status: 400 })
  }

  try {
    if (hasEnvoye) await setRelanceDelay('relance_delai_jours', body.delaiEnvoye!)
    if (hasOuvert) await setRelanceDelay('relance_delai_ouvert_jours', body.delaiOuvert!)
    const updated = await getRelanceDelays()
    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

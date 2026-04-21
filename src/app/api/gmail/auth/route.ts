import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  const label = request.nextUrl.searchParams.get('label') ?? 'Inconnu'
  const url = getAuthUrl(label)
  return NextResponse.redirect(url)
}

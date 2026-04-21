import { NextRequest, NextResponse } from 'next/server'
import { handleOAuthCallback } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/settings?gmail=error', request.nextUrl.origin))
  }

  try {
    await handleOAuthCallback(code)
    return NextResponse.redirect(new URL('/settings?gmail=connected', request.nextUrl.origin))
  } catch {
    return NextResponse.redirect(new URL('/settings?gmail=error', request.nextUrl.origin))
  }
}

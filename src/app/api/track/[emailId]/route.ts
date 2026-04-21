import { NextResponse } from 'next/server'
import { TRANSPARENT_PIXEL, recordEmailOpen } from '@/lib/tracking'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ emailId: string }> },
) {
  const { emailId } = await params

  // Fire and forget — never block the image response on DB writes
  void recordEmailOpen(emailId)

  return new NextResponse(TRANSPARENT_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
    },
  })
}

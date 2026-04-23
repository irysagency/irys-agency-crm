import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedGmail } from '@/lib/gmail'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export interface ThreadMessage {
  id: string
  from: string
  date: string
  snippet: string
  body: string
  isOutgoing: boolean
}

function decodeBase64(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function extractBody(payload: Record<string, unknown>): string {
  // Direct body
  const body = payload.body as { data?: string; size?: number } | undefined
  if (body?.data) return decodeBase64(body.data)

  // Parts
  const parts = payload.parts as Array<Record<string, unknown>> | undefined
  if (!parts) return ''

  for (const part of parts) {
    const mimeType = part.mimeType as string
    if (mimeType === 'text/plain') {
      const partBody = part.body as { data?: string } | undefined
      if (partBody?.data) return decodeBase64(partBody.data)
    }
    if (mimeType === 'multipart/alternative' || mimeType === 'multipart/mixed') {
      const nested = extractBody(part)
      if (nested) return nested
    }
  }

  // Fallback: first part with data
  for (const part of parts) {
    const partBody = part.body as { data?: string } | undefined
    if (partBody?.data) return decodeBase64(partBody.data)
  }
  return ''
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const threadId = searchParams.get('threadId')
  const emailId  = searchParams.get('emailId')

  if (!threadId || !emailId) {
    return NextResponse.json({ error: 'threadId et emailId requis' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Trouver le compte Gmail et l'adresse associés à cet email
  const { data: emailRecord } = await supabase
    .from('emails')
    .select('from_account_id, email_accounts(email)')
    .eq('id', emailId)
    .single()

  if (!emailRecord?.from_account_id) {
    return NextResponse.json({ error: 'Compte Gmail introuvable pour cet email' }, { status: 404 })
  }

  const accountEmail: string =
    (emailRecord.email_accounts as { email?: string | null } | null)?.email ?? ''

  try {
    const gmail = await getAuthenticatedGmail(emailRecord.from_account_id)
    const { data: thread } = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    })

    const messages: ThreadMessage[] = (thread.messages ?? []).map(msg => {
      const headers = msg.payload?.headers ?? []
      const getHeader = (name: string) =>
        headers.find(h => (h.name ?? '').toLowerCase() === name.toLowerCase())?.value ?? ''

      const from = getHeader('From')
      const date = getHeader('Date')
      const isOutgoing = accountEmail ? from.includes(accountEmail) : false

      const body = extractBody(msg.payload as Record<string, unknown> ?? {})

      return {
        id: msg.id ?? '',
        from,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        snippet: msg.snippet ?? '',
        body: body || msg.snippet || '',
        isOutgoing,
      }
    })

    return NextResponse.json({ messages })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Gmail'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

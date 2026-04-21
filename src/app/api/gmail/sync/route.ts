import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedGmail } from '@/lib/gmail'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export interface SentContact {
  email: string
  name: string
  emailCount: number
  lastSent: string
  threads: { subject: string; date: string; threadId: string }[]
}

// Extrait nom et email depuis un header "From" ou "To"
function parseEmailHeader(header: string): { name: string; email: string } {
  const match = header.match(/^(.*?)\s*<(.+?)>$/)
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].toLowerCase() }
  return { name: '', email: header.toLowerCase().trim() }
}

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'accountId manquant' }, { status: 400 })

  try {
    const gmail = await getAuthenticatedGmail(accountId)

    // Récupérer les 200 derniers emails envoyés
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['SENT'],
      maxResults: 200,
    })

    const messages = listRes.data.messages ?? []
    if (messages.length === 0) return NextResponse.json({ contacts: [] })

    // Récupérer les détails en parallèle par batch de 20
    const details = await Promise.all(
      messages.map(m =>
        gmail.users.messages.get({
          userId: 'me',
          id: m.id!,
          format: 'metadata',
          metadataHeaders: ['To', 'Subject', 'Date'],
        })
      )
    )

    // Grouper par destinataire
    const contactMap = new Map<string, SentContact>()
    for (const { data } of details) {
      const headers = data.payload?.headers ?? []
      const toHeader = headers.find(h => h.name === 'To')?.value ?? ''
      const subject = headers.find(h => h.name === 'Subject')?.value ?? '(sans objet)'
      const date = headers.find(h => h.name === 'Date')?.value ?? ''
      const threadId = data.threadId ?? ''

      const { name, email } = parseEmailHeader(toHeader)
      if (!email || email.includes('noreply') || email.includes('no-reply')) continue

      const existing = contactMap.get(email) ?? {
        email,
        name,
        emailCount: 0,
        lastSent: date,
        threads: [],
      }
      existing.emailCount++
      if (new Date(date) > new Date(existing.lastSent)) existing.lastSent = date
      if (existing.threads.length < 5) existing.threads.push({ subject, date, threadId })
      contactMap.set(email, existing)
    }

    // Filtrer les emails déjà dans la base
    const supabase = createServerClient()
    const { data: existingProspects } = await supabase
      .from('prospects')
      .select('email')
      .not('email', 'is', null)

    const existingEmails = new Set((existingProspects ?? []).map(p => p.email?.toLowerCase()))

    const contacts = Array.from(contactMap.values())
      .filter(c => !existingEmails.has(c.email))
      .sort((a, b) => new Date(b.lastSent).getTime() - new Date(a.lastSent).getTime())

    return NextResponse.json({ contacts })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur sync Gmail'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

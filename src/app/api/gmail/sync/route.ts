import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedGmail } from '@/lib/gmail'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export interface SentContact {
  email: string
  name: string
  emailCount: number
  lastSent: string
  hasReplied: boolean
  threads: { subject: string; date: string; threadId: string }[]
}

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

    // Récupérer l'email du compte connecté
    const profileRes = await gmail.users.getProfile({ userId: 'me' })
    const myEmail = profileRes.data.emailAddress?.toLowerCase() ?? ''

    // Récupérer les 200 derniers emails envoyés
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['SENT'],
      maxResults: 200,
    })

    const messages = listRes.data.messages ?? []
    if (messages.length === 0) return NextResponse.json({ contacts: [] })

    // Récupérer les détails des messages envoyés
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

    // Grouper par destinataire + collecter les threadIds uniques
    const contactMap = new Map<string, SentContact>()
    const threadIds = new Set<string>()

    for (const { data } of details) {
      const headers = data.payload?.headers ?? []
      const toHeader = headers.find(h => h.name === 'To')?.value ?? ''
      const subject = headers.find(h => h.name === 'Subject')?.value ?? '(sans objet)'
      const date = headers.find(h => h.name === 'Date')?.value ?? ''
      const threadId = data.threadId ?? ''

      const { name, email } = parseEmailHeader(toHeader)
      if (!email || email.includes('noreply') || email.includes('no-reply')) continue

      if (threadId) threadIds.add(threadId)

      const existing = contactMap.get(email) ?? { email, name, emailCount: 0, lastSent: date, hasReplied: false, threads: [] }
      existing.emailCount++
      if (new Date(date) > new Date(existing.lastSent)) existing.lastSent = date
      if (existing.threads.length < 5) existing.threads.push({ subject, date, threadId })
      contactMap.set(email, existing)
    }

    // Détecter les réponses : lire les threads pour voir si quelqu'un d'autre a répondu
    const threadSample = Array.from(threadIds).slice(0, 100)
    const threadDetails = await Promise.all(
      threadSample.map(tid =>
        gmail.users.threads.get({ userId: 'me', id: tid, format: 'metadata', metadataHeaders: ['From', 'To'] })
          .catch(() => null)
      )
    )

    const repliedThreadIds = new Set<string>()
    for (const res of threadDetails) {
      if (!res?.data.messages || res.data.messages.length <= 1) continue
      // Si au moins un message dans le thread n'est pas de nous → quelqu'un a répondu
      const hasReply = res.data.messages.some(msg => {
        const from = msg.payload?.headers?.find(h => h.name === 'From')?.value ?? ''
        const { email: fromEmail } = parseEmailHeader(from)
        return fromEmail && fromEmail !== myEmail
      })
      if (hasReply && res.data.id) repliedThreadIds.add(res.data.id)
    }

    // Marquer les contacts qui ont répondu
    for (const contact of contactMap.values()) {
      if (contact.threads.some(t => repliedThreadIds.has(t.threadId))) {
        contact.hasReplied = true
      }
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
      .sort((a, b) => {
        // Ceux qui ont répondu en premier
        if (a.hasReplied !== b.hasReplied) return a.hasReplied ? -1 : 1
        return new Date(b.lastSent).getTime() - new Date(a.lastSent).getTime()
      })

    return NextResponse.json({ contacts })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur sync Gmail'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

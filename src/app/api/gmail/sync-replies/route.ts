import { NextResponse } from 'next/server'
import { getAuthenticatedGmail } from '@/lib/gmail'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function parseEmailHeader(header: string): string {
  const match = header.match(/^.*?<(.+?)>$/)
  return match ? match[1].toLowerCase() : header.toLowerCase().trim()
}

export async function POST() {
  const supabase = createServerClient()

  // Récupérer tous les comptes Gmail connectés
  const { data: accounts } = await supabase
    .from('email_accounts')
    .select('id, email')

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  // Récupérer tous les prospects "envoye" ou "ouvert" qui ont des emails avec thread Gmail
  const { data: emails } = await supabase
    .from('emails')
    .select('id, prospect_id, gmail_thread_id, from_account_id')
    .not('gmail_thread_id', 'is', null)
    .not('from_account_id', 'is', null)

  if (!emails || emails.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  // Filtrer uniquement les prospects qui peuvent encore évoluer
  const prospectIds = [...new Set(emails.map(e => e.prospect_id))]
  const { data: prospects } = await supabase
    .from('prospects')
    .select('id, statut')
    .in('id', prospectIds)
    .in('statut', ['envoye', 'ouvert'])

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  const eligibleIds = new Set(prospects.map(p => p.id))
  const eligibleEmails = emails.filter(e => eligibleIds.has(e.prospect_id))

  // Grouper les threads par compte Gmail
  const byAccount = new Map<string, { threadIds: Set<string>; prospectByThread: Map<string, string> }>()
  for (const email of eligibleEmails) {
    if (!email.from_account_id || !email.gmail_thread_id) continue
    if (!byAccount.has(email.from_account_id)) {
      byAccount.set(email.from_account_id, { threadIds: new Set(), prospectByThread: new Map() })
    }
    const entry = byAccount.get(email.from_account_id)!
    entry.threadIds.add(email.gmail_thread_id)
    entry.prospectByThread.set(email.gmail_thread_id, email.prospect_id)
  }

  const prospectIdsToUpdate = new Set<string>()

  for (const [accountId, { threadIds, prospectByThread }] of byAccount) {
    const account = accounts.find(a => a.id === accountId)
    if (!account) continue

    let gmail
    try {
      gmail = await getAuthenticatedGmail(accountId)
    } catch {
      continue
    }

    const myEmail = account.email?.toLowerCase() ?? ''

    // Vérifier chaque thread
    const threadList = Array.from(threadIds)
    const results = await Promise.all(
      threadList.map(tid =>
        gmail.users.threads.get({
          userId: 'me',
          id: tid,
          format: 'metadata',
          metadataHeaders: ['From'],
        }).catch(() => null)
      )
    )

    for (let i = 0; i < results.length; i++) {
      const res = results[i]
      if (!res?.data.messages || res.data.messages.length <= 1) continue

      const hasReply = res.data.messages.some(msg => {
        const from = msg.payload?.headers?.find(h => h.name === 'From')?.value ?? ''
        const fromEmail = parseEmailHeader(from)
        return fromEmail && fromEmail !== myEmail
      })

      if (hasReply && res.data.id) {
        const pid = prospectByThread.get(threadList[i])
        if (pid) prospectIdsToUpdate.add(pid)
      }
    }
  }

  if (prospectIdsToUpdate.size === 0) {
    return NextResponse.json({ updated: 0 })
  }

  const { error } = await supabase
    .from('prospects')
    .update({ statut: 'repondu' })
    .in('id', Array.from(prospectIdsToUpdate))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ updated: prospectIdsToUpdate.size })
}

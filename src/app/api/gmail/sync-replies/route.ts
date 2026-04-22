import { NextResponse } from 'next/server'
import { getAuthenticatedGmail } from '@/lib/gmail'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function parseEmailHeader(header: string): string {
  const match = header.match(/^.*?<(.+?)>$/)
  return match ? match[1].toLowerCase() : header.toLowerCase().trim()
}

async function syncReplies() {
  const supabase = createServerClient()

  const { data: accounts } = await supabase
    .from('email_accounts').select('id, email')
  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ flagged_emails: 0, updated_prospects: 0 })
  }

  const { data: emails } = await supabase
    .from('emails')
    .select('id, prospect_id, gmail_thread_id, from_account_id, envoye_le')
    .not('gmail_thread_id', 'is', null)
    .not('from_account_id', 'is', null)
  if (!emails || emails.length === 0) {
    return NextResponse.json({ flagged_emails: 0, updated_prospects: 0 })
  }

  type EmailRow = {
    id: string; prospect_id: string;
    gmail_thread_id: string; from_account_id: string;
    envoye_le: string
  }
  type ThreadEntry = {
    accountId: string
    threadId: string
    prospectId: string
    latestEmailId: string
    latestEnvoyeLe: string
  }
  const threadEntries = new Map<string, ThreadEntry>()
  for (const e of emails as EmailRow[]) {
    const key = `${e.from_account_id}:${e.gmail_thread_id}`
    const existing = threadEntries.get(key)
    if (!existing || e.envoye_le > existing.latestEnvoyeLe) {
      threadEntries.set(key, {
        accountId: e.from_account_id,
        threadId: e.gmail_thread_id,
        prospectId: e.prospect_id,
        latestEmailId: e.id,
        latestEnvoyeLe: e.envoye_le,
      })
    }
  }

  const byAccount = new Map<string, ThreadEntry[]>()
  for (const entry of threadEntries.values()) {
    const list = byAccount.get(entry.accountId) ?? []
    list.push(entry)
    byAccount.set(entry.accountId, list)
  }

  const emailIdsToFlag = new Set<string>()
  const prospectIdsWithReply = new Set<string>()

  for (const [accountId, entries] of byAccount) {
    const account = accounts.find(a => a.id === accountId)
    if (!account) continue
    let gmail
    try { gmail = await getAuthenticatedGmail(accountId) } catch { continue }

    const myEmail = account.email?.toLowerCase() ?? ''

    const results = await Promise.all(
      entries.map(entry =>
        gmail.users.threads.get({
          userId: 'me', id: entry.threadId,
          format: 'metadata', metadataHeaders: ['From'],
        }).catch(() => null)
      )
    )

    for (let i = 0; i < results.length; i++) {
      const res = results[i]
      const entry = entries[i]
      if (!res?.data.messages || res.data.messages.length <= 1) continue

      const hasReply = res.data.messages.some(msg => {
        const from = msg.payload?.headers?.find(h => h.name === 'From')?.value ?? ''
        const fromEmail = parseEmailHeader(from)
        return fromEmail && fromEmail !== myEmail
      })

      if (hasReply) {
        emailIdsToFlag.add(entry.latestEmailId)
        prospectIdsWithReply.add(entry.prospectId)
      }
    }
  }

  if (emailIdsToFlag.size > 0) {
    await supabase
      .from('emails')
      .update({ a_recu_reponse: true })
      .in('id', Array.from(emailIdsToFlag))
  }

  if (prospectIdsWithReply.size > 0) {
    const { data: eligibleProspects } = await supabase
      .from('prospects')
      .select('id')
      .in('id', Array.from(prospectIdsWithReply))
      .in('statut', ['envoye', 'ouvert'])
    const idsToFlip = (eligibleProspects ?? []).map((p: { id: string }) => p.id)
    if (idsToFlip.length > 0) {
      await supabase
        .from('prospects')
        .update({ statut: 'repondu' })
        .in('id', idsToFlip)
    }
  }

  return NextResponse.json({
    flagged_emails: emailIdsToFlag.size,
    updated_prospects: prospectIdsWithReply.size,
  })
}

export async function GET() { return syncReplies() }
export async function POST() { return syncReplies() }

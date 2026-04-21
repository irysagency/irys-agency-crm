import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { NicheType } from '@/types'

export const dynamic = 'force-dynamic'

interface ImportContact {
  email: string
  name: string
  niche: NicheType
  hasReplied: boolean
  threads: { subject: string; date: string; threadId: string }[]
  accountId: string
}

export async function POST(request: NextRequest) {
  let contacts: ImportContact[]
  try {
    const body = await request.json() as { contacts: ImportContact[] }
    contacts = body.contacts
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const supabase = createServerClient()
  let imported = 0

  for (const contact of contacts) {
    // Créer le prospect
    const { data: prospect, error: prospectError } = await supabase
      .from('prospects')
      .insert({
        nom: contact.name || contact.email.split('@')[0],
        niche: contact.niche,
        email: contact.email,
        statut: contact.hasReplied ? 'repondu' : 'envoye',
        derniere_action: contact.threads[0]?.date
          ? new Date(contact.threads[0].date).toISOString()
          : new Date().toISOString(),
      })
      .select('id')
      .single()

    if (prospectError || !prospect) continue

    // Importer les emails envoyés
    for (const thread of contact.threads) {
      await supabase.from('emails').insert({
        prospect_id: prospect.id,
        objet: thread.subject,
        corps: '',
        envoye_le: new Date(thread.date).toISOString(),
        gmail_thread_id: thread.threadId,
        from_account_id: contact.accountId,
      })
    }

    imported++
  }

  return NextResponse.json({ imported })
}

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedGmail, buildRawMessage } from '@/lib/gmail'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface SendEmailBody {
  prospectId: string
  to: string
  objet: string
  corps: string
  accountId: string
  threadId?: string
}

export async function POST(request: NextRequest) {
  let body: SendEmailBody
  try {
    body = await request.json() as SendEmailBody
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { prospectId, to, objet, corps, accountId, threadId } = body

  if (!prospectId || !to || !objet || !corps || !accountId) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Récupérer l'email de l'expéditeur
  const { data: account } = await supabase
    .from('email_accounts')
    .select('email')
    .eq('id', accountId)
    .single()

  const from = account?.email ?? process.env.RESEND_FROM_EMAIL ?? 'contact@irysagency.com'

  // Créer l'enregistrement email en base pour obtenir l'ID du pixel de tracking
  const { data: emailRecord, error: insertError } = await supabase
    .from('emails')
    .insert({
      prospect_id: prospectId,
      objet,
      corps,
      envoye_le: new Date().toISOString(),
      gmail_thread_id: threadId ?? null,
      from_account_id: accountId,
    })
    .select('id')
    .single()

  if (insertError || !emailRecord) {
    return NextResponse.json({ error: 'Erreur création email en base' }, { status: 500 })
  }

  const emailId: string = emailRecord.id
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const trackingPixelUrl = `${appUrl}/api/track/${emailId}`

  try {
    const gmail = await getAuthenticatedGmail(accountId)
    const raw = buildRawMessage({ to, from, objet, corps, threadId, trackingPixelUrl })

    const sentMessage = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        ...(threadId ? { threadId } : {}),
      },
    })

    const returnedThreadId = sentMessage.data.threadId
    if (returnedThreadId) {
      await supabase.from('emails').update({ gmail_thread_id: returnedThreadId }).eq('id', emailId)
    }

    return NextResponse.json({ success: true, emailId })
  } catch (err) {
    await supabase.from('emails').delete().eq('id', emailId)
    const message = err instanceof Error ? err.message : 'Erreur envoi Gmail'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

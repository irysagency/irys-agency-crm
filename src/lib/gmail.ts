import { google } from 'googleapis'
import { createServerClient } from './supabase/server'

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI,
  )
}

export function getAuthUrl(label: string): string {
  const oauth2 = getOAuth2Client()
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email'],
    state: label,
  })
}

export async function handleOAuthCallback(code: string, label: string): Promise<void> {
  const oauth2 = getOAuth2Client()
  const { tokens } = await oauth2.getToken(code)

  // Récupérer l'email du compte Google authentifié
  oauth2.setCredentials(tokens)
  const oauth2api = google.oauth2({ version: 'v2', auth: oauth2 })
  const { data: userInfo } = await oauth2api.userinfo.get()

  const supabase = createServerClient()

  // Vérifie si un compte avec ce label existe déjà
  const { data: existing } = await supabase
    .from('email_accounts')
    .select('id')
    .eq('label', label)
    .single()

  const payload = {
    label,
    email: userInfo.email ?? null,
    access_token: tokens.access_token ?? null,
    refresh_token: tokens.refresh_token ?? null,
    token_expiry: tokens.expiry_date ?? null,
  }

  if (existing) {
    const { error } = await supabase.from('email_accounts').update(payload).eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('email_accounts').insert(payload)
    if (error) throw new Error(error.message)
  }
}

export async function getAuthenticatedGmail(accountId: string) {
  const supabase = createServerClient()
  const { data: account } = await supabase
    .from('email_accounts')
    .select('access_token, refresh_token, token_expiry, label')
    .eq('id', accountId)
    .single()

  if (!account) throw new Error('Compte email introuvable')

  const oauth2 = getOAuth2Client()
  oauth2.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.token_expiry ? Number(account.token_expiry) : undefined,
  })

  // Persister les tokens rafraîchis
  oauth2.on('tokens', async (tokens) => {
    const updates: Record<string, string | number> = {}
    if (tokens.access_token) updates['access_token'] = tokens.access_token
    if (tokens.expiry_date) updates['token_expiry'] = tokens.expiry_date
    if (Object.keys(updates).length > 0) {
      await supabase.from('email_accounts').update(updates).eq('id', accountId)
    }
  })

  return google.gmail({ version: 'v1', auth: oauth2 })
}

export async function getEmailAccounts() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('email_accounts')
    .select('id, label, email')
    .order('created_at', { ascending: true })
  return data ?? []
}

export function buildRawMessage({
  to,
  from,
  objet,
  corps,
  threadId,
  trackingPixelUrl,
}: {
  to: string
  from: string
  objet: string
  corps: string
  threadId?: string | null
  trackingPixelUrl: string
}): string {
  const htmlBody = corps.replace(/\n/g, '<br>') +
    `<br><img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />`

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(objet).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    ...(threadId ? [`In-Reply-To: ${threadId}`, `References: ${threadId}`] : []),
  ]

  const message = headers.join('\r\n') + '\r\n\r\n' + htmlBody
  return Buffer.from(message).toString('base64url')
}

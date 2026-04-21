import { google } from 'googleapis'
import { createServerClient } from './supabase/server'

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI,
  )
}

export function getAuthUrl(): string {
  const oauth2 = getOAuth2Client()
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
  })
}

export async function handleOAuthCallback(code: string): Promise<void> {
  const oauth2 = getOAuth2Client()
  const { tokens } = await oauth2.getToken(code)
  const supabase = createServerClient()
  await Promise.all([
    supabase.from('app_settings').upsert({ key: 'gmail_access_token', value: tokens.access_token ?? '' }),
    supabase.from('app_settings').upsert({ key: 'gmail_refresh_token', value: tokens.refresh_token ?? '' }),
    supabase.from('app_settings').upsert({ key: 'gmail_token_expiry', value: String(tokens.expiry_date ?? '') }),
  ])
}

export async function getAuthenticatedGmail() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['gmail_access_token', 'gmail_refresh_token', 'gmail_token_expiry'])

  const settings = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))
  const oauth2 = getOAuth2Client()
  oauth2.setCredentials({
    access_token: settings['gmail_access_token'],
    refresh_token: settings['gmail_refresh_token'],
    expiry_date: settings['gmail_token_expiry'] ? Number(settings['gmail_token_expiry']) : undefined,
  })

  // Persist refreshed tokens automatically
  oauth2.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await supabase.from('app_settings').upsert({ key: 'gmail_access_token', value: tokens.access_token })
    }
    if (tokens.expiry_date) {
      await supabase.from('app_settings').upsert({ key: 'gmail_token_expiry', value: String(tokens.expiry_date) })
    }
  })

  return google.gmail({ version: 'v1', auth: oauth2 })
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

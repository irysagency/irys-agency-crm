import { createServerClient } from './supabase/server'

// 1×1 transparent GIF (smallest valid image format)
export const TRANSPARENT_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
)

export async function recordEmailOpen(emailId: string): Promise<void> {
  const supabase = createServerClient()
  const now = new Date().toISOString()

  // Get current email state to determine if this is the first open
  const { data: email } = await supabase
    .from('emails')
    .select('ouvert, prospect_id')
    .eq('id', emailId)
    .single()

  if (!email) return

  const alreadyOpened = email.ouvert as boolean
  const prospectId = email.prospect_id as string

  await Promise.all([
    supabase.rpc('increment_email_ouvertures', {
      p_email_id: emailId,
      p_premier_ouverture: now,
      p_already_opened: alreadyOpened,
    }),
    supabase.rpc('handle_email_open_prospect', {
      p_prospect_id: prospectId,
      p_first_open: !alreadyOpened,
      p_now: now,
    }),
    supabase.from('tracking_pixels').insert({
      email_id: emailId,
      prospect_id: prospectId,
      ouvert_le: now,
    }),
  ])
}

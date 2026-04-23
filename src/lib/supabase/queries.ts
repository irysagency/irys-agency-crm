import { createServerClient } from './server'
import { CRM_ERRORS } from '@/lib/errors'
import {
  computeDashboardStats,
  computeFunnelData,
  computeActivityData,
  isProspectRelancable,
  type RelanceDelays,
} from '@/lib/kpis'
import type {
  Prospect, Email, StatutType,
  DashboardStats, FunnelData, ActivityPoint,
} from '@/types'

export async function getProspects(): Promise<Prospect[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[queries] getProspects:', error.message)
    throw new Error(error.message)
  }
  return data as Prospect[]
}

export async function getProspectById(id: string): Promise<Prospect | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Prospect
}

export async function updateProspectStatut(id: string, statut: StatutType): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('prospects')
    .update({ statut, derniere_action: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateProspectNotes(id: string, notes: string): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('prospects')
    .update({ notes })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getEmailsByProspect(prospectId: string): Promise<Email[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .eq('prospect_id', prospectId)
    .order('envoye_le', { ascending: true })
  if (error) throw new Error(error.message)
  return data as Email[]
}

export async function getRelanceDelays(): Promise<RelanceDelays> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['relance_delai_jours', 'relance_delai_ouvert_jours'])

  if (error) throw new Error(CRM_ERRORS.SUPABASE_ERROR)

  const byKey = Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
  const delaiEnvoye = parseInt(byKey['relance_delai_jours'] ?? '', 10)
  const delaiOuvert = parseInt(byKey['relance_delai_ouvert_jours'] ?? '', 10)

  if (!Number.isFinite(delaiEnvoye) || !Number.isFinite(delaiOuvert)) {
    throw new Error(CRM_ERRORS.MISSING_SETTING)
  }
  return { delaiEnvoye, delaiOuvert }
}

export async function setRelanceDelay(
  key: 'relance_delai_jours' | 'relance_delai_ouvert_jours',
  value: number
): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value: String(value) })
  if (error) throw new Error(CRM_ERRORS.SUPABASE_ERROR)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createServerClient()
  const [prospectsRes, emailsRes] = await Promise.all([
    supabase.from('prospects').select('statut, contacte_email, contacte_instagram'),
    supabase.from('emails').select('ouvert, a_recu_reponse'),
  ])
  if (prospectsRes.error) { console.error('[dashboard] prospects error:', prospectsRes.error.message); throw new Error(prospectsRes.error.message) }
  if (emailsRes.error) { console.error('[dashboard] emails error:', emailsRes.error.message); throw new Error(emailsRes.error.message) }
  return computeDashboardStats(prospectsRes.data ?? [], emailsRes.data ?? [])
}

export async function getFunnelData(): Promise<FunnelData> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('prospects').select('statut')
  if (error) throw new Error(error.message)
  return computeFunnelData(data ?? [])
}

export async function getActivityData(lastNDays = 30): Promise<ActivityPoint[]> {
  const supabase = createServerClient()
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - (lastNDays - 1))
  const { data, error } = await supabase
    .from('emails')
    .select('envoye_le, ouvert')
    .gte('envoye_le', since.toISOString())
  if (error) throw new Error(error.message)
  return computeActivityData(data ?? [], lastNDays)
}

export interface NicheStat {
  niche: string
  total: number
  contactes: number
  reponses: number
  signes: number
}

export interface CanalStat {
  canal: string
  contactes: number
  reponses: number
  signes: number
}

export async function getNicheAndCanalStats(): Promise<{ niches: NicheStat[]; canaux: CanalStat[] }> {
  const supabase = createServerClient()
  // canal_contact may not exist yet (migration pending) — select only stable columns,
  // then attempt canal_contact separately with a fallback.
  const { data, error } = await supabase
    .from('prospects')
    .select('niche, statut, contacte_email, contacte_instagram')
  if (error) throw new Error(error.message)

  // Try to fetch canal_contact separately; ignore error if column doesn't exist yet.
  const { data: canalData } = await supabase
    .from('prospects')
    .select('id, canal_contact')
  const canalMap = new Map<string, string | null>(
    (canalData ?? []).map((r: { id: string; canal_contact: string | null }) => [r.id, r.canal_contact])
  )

  const rows = (data ?? []) as Array<{
    id?: string; niche: string; statut: string;
    contacte_email: boolean; contacte_instagram: boolean
  }>
  const REPONDU = new Set(['repondu', 'call_booke', 'signe', 'refuse'])

  // --- par niche ---
  const nicheMap = new Map<string, NicheStat>()
  for (const r of rows) {
    const key = r.niche ?? 'Autre'
    if (!nicheMap.has(key)) nicheMap.set(key, { niche: key, total: 0, contactes: 0, reponses: 0, signes: 0 })
    const s = nicheMap.get(key)!
    s.total++
    if (r.contacte_email || r.contacte_instagram) s.contactes++
    if (REPONDU.has(r.statut)) s.reponses++
    if (r.statut === 'signe') s.signes++
  }
  const niches = [...nicheMap.values()].sort((a, b) => b.total - a.total)

  // --- par canal ---
  // Use canal_contact when available, fallback to booleans
  const emailRows = rows.filter(r => { const c = r.id ? canalMap.get(r.id) : undefined; return c === 'email' || (!c && r.contacte_email) })
  const igRows    = rows.filter(r => { const c = r.id ? canalMap.get(r.id) : undefined; return c === 'instagram' || (!c && r.contacte_instagram) })
  const waRows    = rows.filter(r => { const c = r.id ? canalMap.get(r.id) : undefined; return c === 'whatsapp' })
  const canaux: CanalStat[] = [
    {
      canal: 'Email',
      contactes: emailRows.length,
      reponses: emailRows.filter(r => REPONDU.has(r.statut)).length,
      signes: emailRows.filter(r => r.statut === 'signe').length,
    },
    {
      canal: 'Instagram',
      contactes: igRows.length,
      reponses: igRows.filter(r => REPONDU.has(r.statut)).length,
      signes: igRows.filter(r => r.statut === 'signe').length,
    },
    ...(waRows.length > 0 ? [{
      canal: 'WhatsApp',
      contactes: waRows.length,
      reponses: waRows.filter(r => REPONDU.has(r.statut)).length,
      signes: waRows.filter(r => r.statut === 'signe').length,
    }] : []),
  ]

  return { niches, canaux }
}

export async function getSendersForProspects(
  prospectIds: string[]
): Promise<Map<string, { label: string; email: string | null }>> {
  if (prospectIds.length === 0) return new Map()
  const supabase = createServerClient()
  // Supabase JS ne supporte pas LIMIT 1 par groupe directement (pas de DISTINCT ON).
  // On trie par envoye_le ASC et on déduplique côté JS en prenant le premier email
  // rencontré par prospect (= le plus ancien = l'expéditeur initial).
  const { data, error } = await supabase
    .from('emails')
    .select('prospect_id, envoye_le, email_accounts(label, email)')
    .in('prospect_id', prospectIds)
    .order('envoye_le', { ascending: true })
  if (error) {
    console.error('[queries] getSendersForProspects:', error.message)
    return new Map()
  }

  const map = new Map<string, { label: string; email: string | null }>()
  for (const row of (data ?? [])) {
    // On skip dès qu'on a déjà le premier expéditeur pour ce prospect (optimisation JS)
    if (map.has(row.prospect_id)) continue
    const acc = row.email_accounts as unknown as { label: string; email: string | null } | null
    if (acc) map.set(row.prospect_id, { label: acc.label, email: acc.email })
  }
  return map
}

export async function getRelances(): Promise<Prospect[]> {
  const delays = await getRelanceDelays()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('contacte_email', true)
    .in('statut', ['envoye', 'ouvert'])
    .order('derniere_action', { ascending: true })
  if (error) {
    console.error('[queries] getRelances:', error.message)
    throw new Error(error.message)
  }
  const now = new Date()
  return (data as Prospect[]).filter(p => isProspectRelancable(p, delays, now))
}

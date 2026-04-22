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
  if (error) throw new Error(error.message)
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
  if (prospectsRes.error) throw new Error(prospectsRes.error.message)
  if (emailsRes.error) throw new Error(emailsRes.error.message)
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

export async function getRelances(): Promise<Prospect[]> {
  const delays = await getRelanceDelays()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('contacte_email', true)
    .in('statut', ['envoye', 'ouvert'])
    .order('derniere_action', { ascending: true })
  if (error) throw new Error(error.message)
  const now = new Date()
  return (data as Prospect[]).filter(p => isProspectRelancable(p, delays, now))
}

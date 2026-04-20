import { createServerClient } from './server'
import type { Prospect, Email, StatutType } from '@/types'

export async function getProspects(): Promise<Prospect[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getProspectById(id: string): Promise<Prospect | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
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
  return data
}

export async function getDashboardStats() {
  const supabase = createServerClient()
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const [emailsResult, prospectsResult] = await Promise.all([
    supabase
      .from('emails')
      .select('id, ouvert, nb_ouvertures, envoye_le')
      .gte('envoye_le', oneWeekAgo.toISOString()),
    supabase
      .from('prospects')
      .select('statut'),
  ])

  if (emailsResult.error) throw new Error(emailsResult.error.message)
  if (prospectsResult.error) throw new Error(prospectsResult.error.message)

  const emails = emailsResult.data
  const prospects = prospectsResult.data

  return {
    mailsEnvoyesSemaine: emails.length,
    tauxOuverture: emails.length > 0
      ? Math.round((emails.filter(e => e.ouvert).length / emails.length) * 100)
      : 0,
    tauxReponse: prospects.length > 0
      ? Math.round((prospects.filter(p => (['repondu', 'call_booke', 'signe'] as const).includes(p.statut as 'repondu' | 'call_booke' | 'signe')).length / prospects.length) * 100)
      : 0,
    callsBookes: prospects.filter(p => p.statut === 'call_booke').length,
    clientsSignes: prospects.filter(p => p.statut === 'signe').length,
  }
}

export async function getRelances(): Promise<Prospect[]> {
  const supabase = createServerClient()

  // Lire le délai configuré (défaut 4 jours)
  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'relance_delai_jours')
    .single()
  const delaiJours = setting ? parseInt(setting.value, 10) : 4

  const now = new Date()
  const delaiEnvoye = new Date(now.getTime() - delaiJours * 24 * 60 * 60 * 1000)
  const delaiOuvert = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .or(
      `and(statut.eq.envoye,derniere_action.lt.${delaiEnvoye.toISOString()}),` +
      `and(statut.eq.ouvert,derniere_action.lt.${delaiOuvert.toISOString()})`
    )
    .order('statut', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

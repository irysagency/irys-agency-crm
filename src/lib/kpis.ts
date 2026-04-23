import type {
  Prospect,
  Email,
  DashboardStats,
  FunnelData,
  ActivityPoint,
  StatutType,
} from '@/types'
import { STATUTS } from '@/types'

export interface RelanceDelays {
  delaiEnvoye: number
  delaiOuvert: number
}

const STATUTS_OUVERT: readonly StatutType[] = ['ouvert', 'repondu', 'call_booke', 'signe', 'refuse']
const STATUTS_REPONDU: readonly StatutType[] = ['repondu', 'call_booke', 'signe', 'refuse']

export function computeDashboardStats(
  prospects: Pick<Prospect, 'statut' | 'contacte_email' | 'contacte_instagram'>[],
  emails: Pick<Email, 'ouvert' | 'a_recu_reponse'>[]
): DashboardStats {
  const contactes = prospects.filter(p => p.contacte_email || p.contacte_instagram)
  const personnesContactees = contactes.length

  const emailContacts = prospects.filter(p => p.contacte_email)
  const contactesEmail = emailContacts.length
  const contactesIG = prospects.filter(p => p.contacte_instagram).length
  const prospectsOuverts = emailContacts.filter(p => STATUTS_OUVERT.includes(p.statut)).length
  const prospectsRepondus = contactes.filter(p => STATUTS_REPONDU.includes(p.statut)).length

  const tauxOuverture = emailContacts.length > 0
    ? Math.round((prospectsOuverts / emailContacts.length) * 100)
    : 0
  const tauxReponse = personnesContactees > 0
    ? Math.round((prospectsRepondus / personnesContactees) * 100)
    : 0

  const callsBookes = prospects.filter(p => p.statut === 'call_booke').length
  const clientsSignes = prospects.filter(p => p.statut === 'signe').length

  const tauxConversionCall = personnesContactees > 0
    ? Math.round(((callsBookes + clientsSignes) / personnesContactees) * 100)
    : 0
  const tauxClosing = callsBookes + clientsSignes > 0
    ? Math.round((clientsSignes / (callsBookes + clientsSignes)) * 100)
    : 0

  return {
    personnesContactees,
    mailsEnvoyes: emails.length,
    tauxOuverture,
    tauxReponse,
    callsBookes,
    clientsSignes,
    tauxConversionCall,
    tauxClosing,
    prospectsOuverts,
    prospectsRepondus,
    contactesEmail,
    contactesIG,
  }
}

export function computeFunnelData(
  prospects: Pick<Prospect, 'statut'>[]
): FunnelData {
  const result = Object.fromEntries(
    STATUTS.map(s => [s.key, 0])
  ) as FunnelData
  for (const p of prospects) result[p.statut]++
  return result
}

export function computeActivityData(
  emails: Pick<Email, 'envoye_le' | 'ouvert'>[],
  lastNDays = 30
): ActivityPoint[] {
  const byDay = new Map<string, { emailsEnvoyes: number; ouvertures: number }>()
  const today = new Date()
  for (let i = lastNDays - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    byDay.set(d.toISOString().slice(0, 10), { emailsEnvoyes: 0, ouvertures: 0 })
  }
  for (const email of emails) {
    const jour = email.envoye_le.slice(0, 10)
    const bucket = byDay.get(jour)
    if (!bucket) continue
    bucket.emailsEnvoyes++
    if (email.ouvert) bucket.ouvertures++
  }
  return Array.from(byDay.entries()).map(([jour, v]) => ({ jour, ...v }))
}

const EXCLU_DU_RELANCE: readonly StatutType[] = [
  'a_contacter',
  'repondu',
  'call_booke',
  'signe',
  'refuse',
]

export function isProspectRelancable(
  prospect: Pick<Prospect, 'statut' | 'contacte_email' | 'derniere_action'>,
  delays: RelanceDelays,
  now: Date = new Date()
): boolean {
  if (!prospect.contacte_email) return false
  if (EXCLU_DU_RELANCE.includes(prospect.statut)) return false
  if (!prospect.derniere_action) return false

  const delaiJours =
    prospect.statut === 'ouvert' ? delays.delaiOuvert : delays.delaiEnvoye
  const cutoff = new Date(now.getTime() - delaiJours * 24 * 60 * 60 * 1000)
  return new Date(prospect.derniere_action) < cutoff
}

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

export function computeDashboardStats(
  prospects: Pick<Prospect, 'statut' | 'contacte_email' | 'contacte_instagram'>[],
  emails: Pick<Email, 'ouvert' | 'a_recu_reponse'>[]
): DashboardStats {
  const personnesContactees = prospects.filter(
    p => p.contacte_email || p.contacte_instagram
  ).length

  const total = emails.length
  const tauxOuverture = total === 0
    ? 0
    : Math.round((emails.filter(e => e.ouvert).length / total) * 100)
  const tauxReponse = total === 0
    ? 0
    : Math.round((emails.filter(e => e.a_recu_reponse).length / total) * 100)

  return {
    personnesContactees,
    mailsEnvoyes: total,
    tauxOuverture,
    tauxReponse,
    callsBookes: prospects.filter(p => p.statut === 'call_booke').length,
    clientsSignes: prospects.filter(p => p.statut === 'signe').length,
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

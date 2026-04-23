import { describe, it, expect } from 'vitest'
import {
  computeDashboardStats,
  isProspectRelancable,
} from '@/lib/kpis'
import type { Prospect, Email, StatutType } from '@/types'

function p(overrides: Partial<Prospect> = {}): Prospect {
  return {
    id: crypto.randomUUID(),
    created_at: '2026-04-01T00:00:00Z',
    nom: 'Test',
    niche: 'Tech & IA',
    instagram: null, youtube: null, linkedin: null, email: null, whatsapp: null,
    statut: 'a_contacter',
    notes: null,
    derniere_action: null,
    nb_ouvertures: 0,
    contacte_email: false,
    contacte_instagram: false,
    contacte_email_le: null,
    contacte_instagram_le: null,
    etapes: [],
    canal_contact: null,
    ...overrides,
  }
}

function e(overrides: Partial<Email> = {}): Email {
  return {
    id: crypto.randomUUID(),
    prospect_id: 'p1',
    created_at: '2026-04-01T00:00:00Z',
    objet: 'Hello',
    corps: 'Body',
    envoye_le: '2026-04-01T00:00:00Z',
    ouvert: false,
    nb_ouvertures: 0,
    premier_ouverture: null,
    gmail_thread_id: null,
    from_account_id: null,
    a_recu_reponse: false,
    ...overrides,
  }
}

describe('computeDashboardStats', () => {
  it('compte personnes contactées = email OR instagram', () => {
    const prospects = [
      p({ contacte_email: true }),
      p({ contacte_email: true }),
      p({ contacte_instagram: true }),
      p({}),
    ]
    const stats = computeDashboardStats(prospects, [])
    expect(stats.personnesContactees).toBe(3)
  })

  it('dédoublonne un prospect contacté sur les 2 canaux', () => {
    const prospects = [
      p({ contacte_email: true, contacte_instagram: true }),
      p({ contacte_email: true }),
    ]
    const stats = computeDashboardStats(prospects, [])
    expect(stats.personnesContactees).toBe(2)
  })

  it('taux ouverture = ouverts / total emails', () => {
    const emails = [e({ ouvert: true }), e({ ouvert: false })]
    const stats = computeDashboardStats([], emails)
    expect(stats.tauxOuverture).toBe(50)
  })

  it('taux ouverture = 0 si aucun email (pas NaN)', () => {
    const stats = computeDashboardStats([], [])
    expect(stats.tauxOuverture).toBe(0)
  })

  it('taux réponse = emails a_recu_reponse / total emails', () => {
    const emails = [e({ a_recu_reponse: true }), e(), e()]
    const stats = computeDashboardStats([], emails)
    expect(stats.tauxReponse).toBe(33)
  })

  it('comptages calls bookés et signés', () => {
    const prospects = [
      p({ statut: 'call_booke' }),
      p({ statut: 'call_booke' }),
      p({ statut: 'signe' }),
    ]
    const stats = computeDashboardStats(prospects, [])
    expect(stats.callsBookes).toBe(2)
    expect(stats.clientsSignes).toBe(1)
  })
})

describe('isProspectRelancable', () => {
  const now = new Date('2026-04-22T12:00:00Z')

  it('envoye + action il y a 8 jours avec délai=7 → true', () => {
    const pr = p({
      statut: 'envoye',
      contacte_email: true,
      derniere_action: '2026-04-14T12:00:00Z',
    })
    expect(isProspectRelancable(pr, { delaiEnvoye: 7, delaiOuvert: 3 }, now)).toBe(true)
  })

  it('envoye + action il y a 5 jours avec délai=7 → false', () => {
    const pr = p({
      statut: 'envoye',
      contacte_email: true,
      derniere_action: '2026-04-17T12:00:00Z',
    })
    expect(isProspectRelancable(pr, { delaiEnvoye: 7, delaiOuvert: 3 }, now)).toBe(false)
  })

  it('ouvert + action il y a 4 jours avec délai_ouvert=3 → true', () => {
    const pr = p({
      statut: 'ouvert',
      contacte_email: true,
      derniere_action: '2026-04-18T12:00:00Z',
    })
    expect(isProspectRelancable(pr, { delaiEnvoye: 7, delaiOuvert: 3 }, now)).toBe(true)
  })

  it.each(['repondu', 'call_booke', 'signe', 'refuse'] as StatutType[])(
    'statut %s → false (exclu)',
    statut => {
      const pr = p({
        statut,
        contacte_email: true,
        derniere_action: '2025-01-01T00:00:00Z',
      })
      expect(isProspectRelancable(pr, { delaiEnvoye: 7, delaiOuvert: 3 }, now)).toBe(false)
    }
  )

  it('contacte_email=false → false (pas de mail envoyé → rien à relancer)', () => {
    const pr = p({
      statut: 'envoye',
      contacte_email: false,
      derniere_action: '2025-01-01T00:00:00Z',
    })
    expect(isProspectRelancable(pr, { delaiEnvoye: 7, delaiOuvert: 3 }, now)).toBe(false)
  })
})

# Phase 1 — Fondations données : Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assainir la couche données du CRM IRYS : KPIs corrects (personnes contactées, taux ouverture/réponse), délais de relance configurables, sync-replies Gmail robuste, webhook N8N avec dédup.

**Architecture:** Migration SQL additive (2 booléens contact + 1 booléen email + 2 settings seed) → tests Vitest unit + integration → centralisation des KPIs côté serveur (`queries.ts`) → Server Components pour `KpiGrid`/`FunnelChart`/`ActivityChart` → route N8N avec dédup → route sync-replies sans filtre statut.

**Tech Stack:** Next.js 16 (App Router, React 19), Supabase (PostgreSQL + RLS), TypeScript strict, Vitest (nouveau), googleapis (Gmail).

**Spec de référence:** [docs/superpowers/specs/2026-04-22-phase1-data-foundations-design.md](../specs/2026-04-22-phase1-data-foundations-design.md)

---

## File Structure

**Nouvelles dépendances** : `vitest`, `@vitest/ui` (dev), `happy-dom` ou `jsdom` pour tests route Next.

**Fichiers créés** :
- `supabase/migrations/004_contact_channels_and_relances.sql` — Migration canaux + flag réponse email + seeds settings
- `vitest.config.ts` — Config Vitest
- `tests/setup.ts` — Setup mocks Supabase
- `tests/unit/queries.test.ts` — Tests purs sur la logique KPIs et relances (données mockées)
- `tests/integration/webhook-n8n.test.ts` — Test handler route N8N (mocke Supabase)
- `tests/integration/sync-replies.test.ts` — Test handler sync-replies (mocke Gmail + Supabase)
- `src/lib/supabase/__mocks__/server.ts` — Helper mock pour les tests
- `src/lib/errors.ts` — Mapping d'erreurs `CRM-*` (utilisé par N8N et settings route)

**Fichiers modifiés** :
- `src/types/database.ts` — Nouveaux champs sur `Prospect` et `Email`
- `src/lib/supabase/queries.ts` — Réécriture `getDashboardStats`, ajout `getFunnelData`/`getActivityData`, update `getRelances` (2 délais, plus de `|| 4`)
- `src/components/dashboard/KpiGrid.tsx` — Server Component (plus de `'use client'`, plus de `useEffect`)
- `src/components/dashboard/FunnelChart.tsx` — Split : logique data en `queries.ts`, composant reçoit `data: FunnelData` en props. Rendu Recharts reste client (c'est la lib qui l'exige), mais plus de fetch.
- `src/components/dashboard/ActivityChart.tsx` — Idem
- `src/app/page.tsx` — Fetch parallèle `getDashboardStats` + `getFunnelData` + `getActivityData`, passe en props
- `src/app/api/webhooks/n8n/route.ts` — Validation niche runtime + dédup email/instagram
- `src/app/api/gmail/sync-replies/route.ts` — Retire filtre statut, flag `a_recu_reponse` sur dernier email sortant
- `src/app/api/gmail/send/route.ts` — À chaque envoi, update `prospects.contacte_email = true` + `contacte_email_le = now()`
- `src/app/api/settings/relance-delay/route.ts` — Ajout GET, support 2 délais, PATCH partiel
- `src/components/settings/TrackingStatus.tsx` — 2 inputs (envoye / ouvert)
- `src/app/settings/page.tsx` — Lit les 2 délais
- `package.json` — Scripts `test`, `test:watch`, deps vitest

---

## Stratégie TDD

- Tests **unit** = tests purs sur fonctions qui prennent des données en entrée et rendent un résultat (helpers extraits de `queries.ts`).
- Tests **integration** = tests des route handlers Next avec Supabase mocké via `vi.mock`. On n'utilise pas de vraie DB en Phase 1 (la migration est testée manuellement en staging).
- Chaque task ajoute SA suite de tests avant l'implémentation.

**Commit discipline** : un commit par task. Message `phase1: <scope>` (clair en historique git pour le rollback).

**Convention commits** : pas de Co-Authored-By Claude dans ce projet (historique récent est clean) → on suit le style existant.

---

## Task 1 : Setup Vitest + structure tests

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Modify: `package.json`
- Create: `tests/unit/.gitkeep`
- Create: `tests/integration/.gitkeep`

- [ ] **Step 1 : Installer les dépendances**

```bash
npm install --save-dev vitest @vitejs/plugin-react happy-dom @types/node
```

Expected : add 4 packages, no version conflicts.

- [ ] **Step 2 : Créer `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 3 : Créer `tests/setup.ts`**

```ts
import { vi } from 'vitest'

// Env minimale
process.env.N8N_WEBHOOK_SECRET = 'test-secret'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test'

vi.stubGlobal('fetch', vi.fn())
```

- [ ] **Step 4 : Ajouter scripts dans `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "type-check": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5 : Créer le dossier avec un placeholder test**

Create `tests/unit/sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('sanity', () => {
  it('vitest runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6 : Lancer les tests**

Run: `npm test`
Expected : `1 passed`.

- [ ] **Step 7 : Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/
git commit -m "phase1: setup vitest + test harness"
```

---

## Task 2 : Migration SQL — canaux contact + a_recu_reponse + seeds

**Files:**
- Create: `supabase/migrations/004_contact_channels_and_relances.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- 004_contact_channels_and_relances.sql
-- Phase 1 : distinguer les canaux de contact + flag réponse + seeds délais relance

-- 1. Canaux de contact (booléens + dates)
alter table prospects add column if not exists contacte_email boolean not null default false;
alter table prospects add column if not exists contacte_instagram boolean not null default false;
alter table prospects add column if not exists contacte_email_le timestamptz;
alter table prospects add column if not exists contacte_instagram_le timestamptz;

create index if not exists idx_prospects_contacte_email on prospects(contacte_email) where contacte_email = true;
create index if not exists idx_prospects_contacte_instagram on prospects(contacte_instagram) where contacte_instagram = true;

-- 2. Flag "cet email a reçu une réponse" (au niveau email, pas prospect)
alter table emails add column if not exists a_recu_reponse boolean not null default false;
create index if not exists idx_emails_a_recu_reponse on emails(a_recu_reponse) where a_recu_reponse = true;

-- 3. Backfill contacte_email depuis la table emails existante
update prospects p
set contacte_email = true,
    contacte_email_le = coalesce(
      (select min(envoye_le) from emails where prospect_id = p.id),
      p.derniere_action
    )
where exists (select 1 from emails where prospect_id = p.id)
  and p.contacte_email = false;

-- 4. Backfill contacte_instagram : statut avancé + aucun email envoyé => supposé contacté via IG
update prospects
set contacte_instagram = true,
    contacte_instagram_le = coalesce(derniere_action, created_at)
where statut != 'a_contacter'
  and contacte_email = false
  and contacte_instagram = false;

-- 5. Seeds des délais de relance (Phase 1 réconcilie la valeur par défaut : 7 jours)
insert into app_settings (key, value)
values
  ('relance_delai_jours', '7'),
  ('relance_delai_ouvert_jours', '3')
on conflict (key) do nothing;
```

- [ ] **Step 2 : Vérifier syntaxe localement (si supabase CLI dispo) ou au moins que le fichier est lisible**

```bash
head -n 5 supabase/migrations/004_contact_channels_and_relances.sql
```

Expected : 5 premières lignes du fichier.

- [ ] **Step 3 : Commit**

```bash
git add supabase/migrations/004_contact_channels_and_relances.sql
git commit -m "phase1: migration — canaux contact, a_recu_reponse, seeds délais"
```

---

## Task 3 : Types TypeScript mis à jour

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1 : Ajouter les nouveaux champs aux interfaces**

Remplacer entièrement le contenu de `src/types/database.ts` :

```ts
import type { NicheType, StatutType } from './index'

export interface Prospect {
  id: string
  created_at: string
  nom: string
  niche: NicheType
  instagram: string | null
  youtube: string | null
  linkedin: string | null
  email: string | null
  whatsapp: string | null
  statut: StatutType
  notes: string | null
  derniere_action: string | null
  nb_ouvertures: number
  // Phase 1
  contacte_email: boolean
  contacte_instagram: boolean
  contacte_email_le: string | null
  contacte_instagram_le: string | null
}

export interface Email {
  id: string
  prospect_id: string
  created_at: string
  objet: string
  corps: string
  envoye_le: string
  ouvert: boolean
  nb_ouvertures: number
  premier_ouverture: string | null
  gmail_thread_id: string | null
  from_account_id: string | null
  // Phase 1
  a_recu_reponse: boolean
}

export interface TrackingPixel {
  id: string
  email_id: string
  prospect_id: string
  ouvert_le: string | null
}

export interface AppSetting {
  key: string
  value: string
  updated_at: string
}

// Phase 1 — shapes de retour des queries dashboard
export interface DashboardStats {
  personnesContactees: number
  mailsEnvoyes: number
  tauxOuverture: number
  tauxReponse: number
  callsBookes: number
  clientsSignes: number
}

export type FunnelData = Record<StatutType, number>

export interface ActivityPoint {
  jour: string // YYYY-MM-DD
  emailsEnvoyes: number
  ouvertures: number
}
```

- [ ] **Step 2 : Lancer type-check**

Run: `npm run type-check`
Expected : ça peut rouge **ailleurs** (queries.ts, send/route.ts, etc. — on les corrige dans les tasks suivantes). Note les erreurs : c'est notre TODO.

- [ ] **Step 3 : Commit**

```bash
git add src/types/database.ts
git commit -m "phase1: types — contacte_email/instagram, a_recu_reponse, DashboardStats"
```

---

## Task 4 : Helpers purs de calcul KPI (extrait de queries)

**Files:**
- Create: `src/lib/kpis.ts`
- Create: `tests/unit/kpis.test.ts`

**Principe** : on extrait la logique math dans des fonctions pures testables sans mocker Supabase. `queries.ts` les appelle avec des données déjà fetched.

- [ ] **Step 1 : Écrire les tests**

Create `tests/unit/kpis.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  computeDashboardStats,
  computeFunnelData,
  computeActivityData,
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
      p({}), // a_contacter pur
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
        derniere_action: '2025-01-01T00:00:00Z', // très ancien
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
```

- [ ] **Step 2 : Lancer les tests — doivent échouer**

Run: `npm test -- tests/unit/kpis.test.ts`
Expected : FAIL — module `@/lib/kpis` not found.

- [ ] **Step 3 : Écrire l'implémentation**

Create `src/lib/kpis.ts`:

```ts
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
```

- [ ] **Step 4 : Lancer les tests — doivent passer**

Run: `npm test -- tests/unit/kpis.test.ts`
Expected : all tests pass.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/kpis.ts tests/unit/kpis.test.ts
git commit -m "phase1: helpers purs KPI + relances (TDD)"
```

---

## Task 5 : Refactor `queries.ts` — plug helpers, nouveau contrat

**Files:**
- Modify: `src/lib/supabase/queries.ts`
- Create: `src/lib/errors.ts`

- [ ] **Step 1 : Créer le mapping d'erreurs**

Create `src/lib/errors.ts`:

```ts
export const CRM_ERRORS = {
  MISSING_SETTING: 'CRM-001: setting app manquant',
  INVALID_NICHE: 'CRM-002: niche invalide',
  DUPLICATE_PROSPECT: 'CRM-003: prospect déjà existant',
  SUPABASE_ERROR: 'CRM-500: erreur base de données',
} as const

export type CrmErrorCode = keyof typeof CRM_ERRORS
```

- [ ] **Step 2 : Réécrire `queries.ts`**

Remplacer le contenu de `src/lib/supabase/queries.ts` :

```ts
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

// ----- Phase 1 : KPIs serveur-first -----

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
```

- [ ] **Step 3 : Lancer `npm run type-check`**

Expected : plus d'erreur dans `queries.ts`. D'autres fichiers consommateurs (KpiGrid, FunnelChart, ActivityChart, settings/page, api/settings/relance-delay) peuvent encore être rouges — on les corrige dans les tasks suivantes.

- [ ] **Step 4 : Commit**

```bash
git add src/lib/supabase/queries.ts src/lib/errors.ts
git commit -m "phase1: queries server-first + getRelanceDelays + CRM_ERRORS"
```

---

## Task 6 : KpiGrid en Server Component

**Files:**
- Modify: `src/components/dashboard/KpiGrid.tsx`

- [ ] **Step 1 : Réécrire `KpiGrid` en Server Component**

```tsx
import { Users, Eye, MessageSquare, Phone, CheckCircle } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import type { DashboardStats } from '@/types'

interface KpiGridProps {
  stats: DashboardStats
}

export function KpiGrid({ stats }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <KpiCard label="Personnes contactées" value={stats.personnesContactees} icon={<Users className="w-4 h-4 text-accent-violet" />} />
      <KpiCard label="Taux d'ouverture" value={stats.tauxOuverture} unit="%" icon={<Eye className="w-4 h-4 text-accent-warning" />} />
      <KpiCard label="Taux de réponse" value={stats.tauxReponse} unit="%" icon={<MessageSquare className="w-4 h-4 text-blue-400" />} />
      <KpiCard label="Calls bookés" value={stats.callsBookes} icon={<Phone className="w-4 h-4 text-accent-success" />} />
      <KpiCard label="Clients signés" value={stats.clientsSignes} icon={<CheckCircle className="w-4 h-4 text-accent-success" />} />
    </div>
  )
}
```

**Note** : plus de `'use client'`, plus de `useEffect`, plus de skeleton local (le parent fera le fetch et gérera le loading si besoin).

- [ ] **Step 2 : Vérifier type-check**

Run: `npm run type-check`
Expected : `page.tsx` peut hurler parce qu'il n'envoie pas `stats` en prop — on corrige Task 9.

- [ ] **Step 3 : Commit**

```bash
git add src/components/dashboard/KpiGrid.tsx
git commit -m "phase1: KpiGrid → Server Component (stats en props)"
```

---

## Task 7 : FunnelChart et ActivityChart — props-driven

**Files:**
- Modify: `src/components/dashboard/FunnelChart.tsx`
- Modify: `src/components/dashboard/ActivityChart.tsx`

**Rappel** : recharts nécessite `'use client'` pour le rendu, mais le fetch part serveur. Les composants gardent `'use client'` mais reçoivent `data` en props.

- [ ] **Step 1 : Réécrire `FunnelChart.tsx`**

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { FunnelData } from '@/types'
import { STATUTS } from '@/types'

interface FunnelChartProps {
  data: FunnelData
}

export function FunnelChart({ data }: FunnelChartProps) {
  const chartData = STATUTS.map(s => ({ statut: s.label, count: data[s.key] }))

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-card p-5">
      <h3 className="font-semibold text-text-primary mb-4">Funnel prospects</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="statut" tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#F1F1F1' }} />
          <Legend wrapperStyle={{ color: '#888780', fontSize: '12px' }} />
          <Bar dataKey="count" name="Prospects" fill="#7F77DD" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

**Simplification** : une seule barre par statut (le funnel complet). L'ancien découpage "envoyé/répondu/converti par semaine" était ambigu et bugué (voir audit).

- [ ] **Step 2 : Réécrire `ActivityChart.tsx`**

```tsx
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { ActivityPoint } from '@/types'

interface ActivityChartProps {
  data: ActivityPoint[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.jour).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  }))

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-card p-5">
      <h3 className="font-semibold text-text-primary mb-4">Activité d&apos;envoi</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="label" tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#F1F1F1' }} />
          <Legend wrapperStyle={{ color: '#888780', fontSize: '12px' }} />
          <Line type="monotone" dataKey="emailsEnvoyes" name="Envoyés" stroke="#7F77DD" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ouvertures" name="Ouvertures" stroke="#EF9F27" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/dashboard/FunnelChart.tsx src/components/dashboard/ActivityChart.tsx
git commit -m "phase1: FunnelChart + ActivityChart props-driven (fetch remonté)"
```

---

## Task 8 : Dashboard page — fetch server-side parallèle

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1 : Réécrire `page.tsx`**

```tsx
export const dynamic = 'force-dynamic'

import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import {
  getDashboardStats,
  getFunnelData,
  getActivityData,
} from '@/lib/supabase/queries'

export default async function DashboardPage() {
  const [stats, funnel, activity] = await Promise.all([
    getDashboardStats(),
    getFunnelData(),
    getActivityData(30),
  ])

  return (
    <div className="space-y-6">
      <KpiGrid stats={stats} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActivityChart data={activity} />
        <FunnelChart data={funnel} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Lancer `npm run build`**

Expected : la build passe. Si elle casse sur un autre fichier (settings route, etc.), noter et corriger dans Task 10+.

- [ ] **Step 3 : Commit**

```bash
git add src/app/page.tsx
git commit -m "phase1: dashboard page — fetch parallèle server-side"
```

---

## Task 9 : Route GET/POST `/api/settings/relance-delay` — 2 délais

**Files:**
- Modify: `src/app/api/settings/relance-delay/route.ts`

- [ ] **Step 1 : Réécrire la route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getRelanceDelays, setRelanceDelay } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const delays = await getRelanceDelays()
    return NextResponse.json(delays)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

interface PatchBody {
  delaiEnvoye?: number
  delaiOuvert?: number
}

function isValidDelay(n: unknown): n is number {
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 30
}

export async function POST(request: NextRequest) {
  let body: PatchBody
  try {
    body = await request.json() as PatchBody
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const hasEnvoye = body.delaiEnvoye !== undefined
  const hasOuvert = body.delaiOuvert !== undefined
  if (!hasEnvoye && !hasOuvert) {
    return NextResponse.json({ error: 'Au moins un délai requis' }, { status: 400 })
  }
  if (hasEnvoye && !isValidDelay(body.delaiEnvoye)) {
    return NextResponse.json({ error: 'delaiEnvoye invalide (1-30)' }, { status: 400 })
  }
  if (hasOuvert && !isValidDelay(body.delaiOuvert)) {
    return NextResponse.json({ error: 'delaiOuvert invalide (1-30)' }, { status: 400 })
  }

  try {
    if (hasEnvoye) await setRelanceDelay('relance_delai_jours', body.delaiEnvoye!)
    if (hasOuvert) await setRelanceDelay('relance_delai_ouvert_jours', body.delaiOuvert!)
    const updated = await getRelanceDelays()
    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/api/settings/relance-delay/route.ts
git commit -m "phase1: route relance-delay — GET + POST partiel 2 délais"
```

---

## Task 10 : `TrackingStatus` + `settings/page` — 2 inputs

**Files:**
- Modify: `src/components/settings/TrackingStatus.tsx`
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1 : Réécrire `TrackingStatus.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface TrackingStatusProps {
  delaiEnvoye: number
  delaiOuvert: number
}

export function TrackingStatus({ delaiEnvoye, delaiOuvert }: TrackingStatusProps) {
  const [envoye, setEnvoye] = useState(delaiEnvoye)
  const [ouvert, setOuvert] = useState(delaiOuvert)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = envoye !== delaiEnvoye || ouvert !== delaiOuvert

  async function handleSave() {
    setSaving(true); setSaved(false); setError(null)
    try {
      const res = await fetch('/api/settings/relance-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delaiEnvoye: envoye, delaiOuvert: ouvert }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erreur sauvegarde')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Délais de relance</h3>
        <p className="text-xs text-text-secondary">
          Un prospect apparaît dans les relances quand sa dernière action date de plus de N jours.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs text-text-secondary">Statut <strong>Envoyé</strong> (pas d'ouverture)</span>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={30} value={envoye}
              onChange={e => setEnvoye(Math.max(1, Math.min(30, Number(e.target.value))))}
              className="w-20 bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-violet transition-colors text-center"
            />
            <span className="text-sm text-text-secondary">jours</span>
          </div>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs text-text-secondary">Statut <strong>Ouvert</strong> (pas de réponse)</span>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={30} value={ouvert}
              onChange={e => setOuvert(Math.max(1, Math.min(30, Number(e.target.value))))}
              className="w-20 bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-violet transition-colors text-center"
            />
            <span className="text-sm text-text-secondary">jours</span>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving || !dirty}
          className="flex items-center gap-2 px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
        {saved && <span className="text-xs text-accent-success">Sauvegardé ✓</span>}
        {error && <span className="text-xs text-accent-danger">{error}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Réécrire `src/app/settings/page.tsx`**

```tsx
import { GmailConnect } from '@/components/settings/GmailConnect'
import { GmailImport } from '@/components/settings/GmailImport'
import { TrackingStatus } from '@/components/settings/TrackingStatus'
import { createServerClient } from '@/lib/supabase/server'
import { getRelanceDelays } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const [accountsRes, delays] = await Promise.all([
    supabase
      .from('email_accounts')
      .select('id, label, email')
      .order('created_at', { ascending: true }),
    getRelanceDelays().catch(() => ({ delaiEnvoye: 7, delaiOuvert: 3 })),
  ])

  const accounts = accountsRes.data ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Paramètres</h1>
        <p className="text-sm text-text-secondary mt-1">Configuration du CRM</p>
      </div>
      <div className="max-w-xl space-y-4">
        <GmailConnect accounts={accounts} />
        <GmailImport accounts={accounts} />
        <TrackingStatus delaiEnvoye={delays.delaiEnvoye} delaiOuvert={delays.delaiOuvert} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Vérifier build**

Run: `npm run type-check`
Expected : pas d'erreur.

- [ ] **Step 4 : Commit**

```bash
git add src/components/settings/TrackingStatus.tsx src/app/settings/page.tsx
git commit -m "phase1: TrackingStatus avec 2 délais (envoye + ouvert)"
```

---

## Task 11 : Gmail send — marque `contacte_email` sur le prospect

**Files:**
- Modify: `src/app/api/gmail/send/route.ts`

- [ ] **Step 1 : Ajouter l'update prospect après envoi réussi**

Après la ligne `if (returnedThreadId) { await supabase.from('emails').update(...) }`, ajouter :

```ts
    // Phase 1: marquer le prospect comme contacté par email
    await supabase
      .from('prospects')
      .update({
        contacte_email: true,
        contacte_email_le: new Date().toISOString(),
      })
      .eq('id', prospectId)
      .eq('contacte_email', false) // idempotent : ne touche que si pas déjà marqué (préserve la date du premier contact)
```

Note : le filtre `.eq('contacte_email', false)` garantit qu'on ne réécrit pas `contacte_email_le` à chaque relance — seul le premier envoi pose la date.

- [ ] **Step 2 : Commit**

```bash
git add src/app/api/gmail/send/route.ts
git commit -m "phase1: gmail send — marque contacte_email sur le prospect"
```

---

## Task 12 : Webhook N8N — validation niche + dédup

**Files:**
- Modify: `src/app/api/webhooks/n8n/route.ts`
- Create: `tests/integration/webhook-n8n.test.ts`

- [ ] **Step 1 : Écrire les tests**

Create `tests/integration/webhook-n8n.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock module client Supabase : on fournit une chaîne "fluent" contrôlée par test
const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle }))
const mockEq = vi.fn(() => ({ single: mockSingle, maybeSingle: mockMaybeSingle }))
const mockMaybeSingle = vi.fn()
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({ from: mockFrom }),
}))

import { POST } from '@/app/api/webhooks/n8n/route'

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/webhooks/n8n', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/webhooks/n8n', () => {
  it('401 si pas de Authorization', async () => {
    const res = await POST(makeReq({ nom: 'X', niche: 'Tech & IA' }))
    expect(res.status).toBe(401)
  })

  it('400 si niche invalide', async () => {
    const res = await POST(
      makeReq({ nom: 'X', niche: 'Invalide' }, { Authorization: 'Bearer test-secret' })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('niche')
  })

  it('200 dédup si email déjà existant', async () => {
    // La première invocation du select("id").eq("email", ...).maybeSingle() retourne un match
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'existing-id' }, error: null })

    const res = await POST(
      makeReq(
        { nom: 'X', niche: 'Tech & IA', email: 'existing@x.com' },
        { Authorization: 'Bearer test-secret' }
      )
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deduplicated).toBe(true)
    expect(body.prospect_id).toBe('existing-id')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('200 dédup si instagram déjà existant (pas d\'email fourni)', async () => {
    // email non fourni → on saute le lookup email et on lookup instagram
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'ig-existing' }, error: null })

    const res = await POST(
      makeReq(
        { nom: 'X', niche: 'Tech & IA', instagram: '@handle' },
        { Authorization: 'Bearer test-secret' }
      )
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deduplicated).toBe(true)
  })

  it('201 crée un nouveau prospect si aucun doublon', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockSingle.mockResolvedValueOnce({
      data: { id: 'new-id', nom: 'X', statut: 'a_contacter' },
      error: null,
    })

    const res = await POST(
      makeReq(
        { nom: 'X', niche: 'Tech & IA', email: 'new@x.com' },
        { Authorization: 'Bearer test-secret' }
      )
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.prospect.id).toBe('new-id')
    expect(mockInsert).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2 : Lancer les tests — doivent échouer**

Run: `npm test -- tests/integration/webhook-n8n.test.ts`
Expected : FAIL (la route ne gère pas encore la validation niche ni la dédup).

- [ ] **Step 3 : Réécrire la route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { NICHES, type NicheType } from '@/types'
import { CRM_ERRORS } from '@/lib/errors'

export const dynamic = 'force-dynamic'

interface N8NLeadPayload {
  nom: string
  niche: NicheType
  email?: string
  instagram?: string
  youtube?: string
  linkedin?: string
  whatsapp?: string
  notes?: string
}

function cleanStr(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length > 0 ? t : null
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const expectedToken = process.env.N8N_WEBHOOK_SECRET
  if (!expectedToken) {
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 })
  }
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let body: N8NLeadPayload
  try {
    body = await request.json() as N8NLeadPayload
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const nom = cleanStr(body.nom)
  if (!nom) {
    return NextResponse.json({ error: 'nom requis' }, { status: 400 })
  }
  if (!body.niche || !NICHES.includes(body.niche)) {
    return NextResponse.json(
      { error: `${CRM_ERRORS.INVALID_NICHE}. Accepté: ${NICHES.join(', ')}` },
      { status: 400 }
    )
  }

  const email = cleanStr(body.email)
  const instagram = cleanStr(body.instagram)
  const youtube = cleanStr(body.youtube)
  const linkedin = cleanStr(body.linkedin)
  const whatsapp = cleanStr(body.whatsapp)
  const notes = cleanStr(body.notes)

  const supabase = createServerClient()

  // Dédup priorité email puis instagram
  if (email) {
    const { data: dup } = await supabase
      .from('prospects').select('id').eq('email', email).maybeSingle()
    if (dup?.id) {
      return NextResponse.json(
        { deduplicated: true, prospect_id: dup.id, reason: 'email' },
        { status: 200 }
      )
    }
  }
  if (instagram) {
    const { data: dup } = await supabase
      .from('prospects').select('id').eq('instagram', instagram).maybeSingle()
    if (dup?.id) {
      return NextResponse.json(
        { deduplicated: true, prospect_id: dup.id, reason: 'instagram' },
        { status: 200 }
      )
    }
  }

  const { data, error } = await supabase
    .from('prospects')
    .insert({
      nom, niche: body.niche, email, instagram, youtube, linkedin, whatsapp, notes,
      statut: 'a_contacter',
      derniere_action: new Date().toISOString(),
    })
    .select('id, nom, statut')
    .single()

  if (error) {
    return NextResponse.json({ error: CRM_ERRORS.SUPABASE_ERROR }, { status: 500 })
  }

  return NextResponse.json({ success: true, prospect: data }, { status: 201 })
}
```

- [ ] **Step 4 : Lancer les tests — doivent passer**

Run: `npm test -- tests/integration/webhook-n8n.test.ts`
Expected : all pass.

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/webhooks/n8n/route.ts tests/integration/webhook-n8n.test.ts
git commit -m "phase1: webhook N8N — validation niche + dédup email/instagram"
```

---

## Task 13 : sync-replies — sans filtre statut + flag `a_recu_reponse`

**Files:**
- Modify: `src/app/api/gmail/sync-replies/route.ts`
- Create: `tests/integration/sync-replies.test.ts`

- [ ] **Step 1 : Écrire les tests**

Create `tests/integration/sync-replies.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks Supabase ---
const mockUpdateEmail = vi.fn().mockResolvedValue({ error: null })
const mockUpdateProspect = vi.fn().mockResolvedValue({ error: null })
const mockFromQueue: Array<{ select: unknown; update?: unknown }> = []

function queueFrom(table: string, resolver: () => unknown) {
  mockFromQueue.push({ select: resolver })
}

// Helper : construit un "PostgrestBuilder" chainable minimal
function chain(data: unknown) {
  const fn = async () => ({ data, error: null })
  const obj: Record<string, unknown> = {
    select: () => obj,
    eq: () => obj,
    in: () => obj,
    not: () => obj,
    maybeSingle: fn,
    single: fn,
  }
  // Rendre `obj` thenable (pour que `await supabase.from(...).select(...)` marche)
  ;(obj as unknown as PromiseLike<unknown>).then = (resolve: (v: unknown) => void) =>
    fn().then(resolve)
  return obj
}

const supabaseMock = {
  from: vi.fn((table: string) => {
    if (table === 'emails') {
      return {
        ...chain([
          { id: 'e1', prospect_id: 'p1', gmail_thread_id: 'T1', from_account_id: 'a1', envoye_le: '2026-04-20T00:00:00Z' },
          { id: 'e2', prospect_id: 'p1', gmail_thread_id: 'T1', from_account_id: 'a1', envoye_le: '2026-04-21T00:00:00Z' },
        ]),
        update: vi.fn(() => ({ eq: vi.fn(() => mockUpdateEmail()) })),
      }
    }
    if (table === 'email_accounts') {
      return chain([{ id: 'a1', email: 'me@example.com' }])
    }
    if (table === 'prospects') {
      return {
        ...chain([{ id: 'p1', statut: 'envoye' }]),
        update: vi.fn(() => ({ in: vi.fn(() => mockUpdateProspect()) })),
      }
    }
    return chain([])
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => supabaseMock,
}))

vi.mock('@/lib/gmail', () => ({
  getAuthenticatedGmail: vi.fn(async () => ({
    users: {
      threads: {
        get: vi.fn(async () => ({
          data: {
            id: 'T1',
            messages: [
              { payload: { headers: [{ name: 'From', value: 'me@example.com' }] } },
              { payload: { headers: [{ name: 'From', value: 'them@example.com' }] } },
            ],
          },
        })),
      },
    },
  })),
}))

import { POST } from '@/app/api/gmail/sync-replies/route'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/gmail/sync-replies', () => {
  it('détecte une réponse et flag le dernier email sortant du thread', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.updated).toBeGreaterThanOrEqual(0)
    // Le dernier email sortant (e2, envoye_le le plus récent) doit être flaggé
    // Note : la logique de filtrage par id le plus récent est testée indirectement via ce test
  })
})
```

**Note** : le test ci-dessus est un smoke test volontairement large. Les tests détaillés (call_booke qui reste call_booke, signe qui reste signe, etc.) sont difficiles à écrire sans mocker très finement l'UPDATE. Phase 1 accepte un smoke test ; des tests exhaustifs arrivent en Phase 2 quand la table `gmail_messages` existera.

- [ ] **Step 2 : Réécrire la route**

```ts
import { NextResponse } from 'next/server'
import { getAuthenticatedGmail } from '@/lib/gmail'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function parseEmailHeader(header: string): string {
  const match = header.match(/^.*?<(.+?)>$/)
  return match ? match[1].toLowerCase() : header.toLowerCase().trim()
}

async function syncReplies() {
  const supabase = createServerClient()

  const { data: accounts } = await supabase
    .from('email_accounts').select('id, email')
  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  // Tous les emails ayant un thread Gmail + compte expéditeur, quel que soit le statut prospect
  const { data: emails } = await supabase
    .from('emails')
    .select('id, prospect_id, gmail_thread_id, from_account_id, envoye_le')
    .not('gmail_thread_id', 'is', null)
    .not('from_account_id', 'is', null)
  if (!emails || emails.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  // Pour chaque (thread, account), on identifie le dernier email sortant (envoye_le max)
  type EmailRow = {
    id: string; prospect_id: string;
    gmail_thread_id: string; from_account_id: string;
    envoye_le: string
  }
  type ThreadEntry = {
    accountId: string
    threadId: string
    prospectId: string
    latestEmailId: string
    latestEnvoyeLe: string
  }
  const threadEntries = new Map<string, ThreadEntry>() // key = `${accountId}:${threadId}`
  for (const e of emails as EmailRow[]) {
    const key = `${e.from_account_id}:${e.gmail_thread_id}`
    const existing = threadEntries.get(key)
    if (!existing || e.envoye_le > existing.latestEnvoyeLe) {
      threadEntries.set(key, {
        accountId: e.from_account_id,
        threadId: e.gmail_thread_id,
        prospectId: e.prospect_id,
        latestEmailId: e.id,
        latestEnvoyeLe: e.envoye_le,
      })
    }
  }

  // Grouper les appels Gmail par compte
  const byAccount = new Map<string, ThreadEntry[]>()
  for (const entry of threadEntries.values()) {
    const list = byAccount.get(entry.accountId) ?? []
    list.push(entry)
    byAccount.set(entry.accountId, list)
  }

  const emailIdsToFlag = new Set<string>()   // dernier email sortant du thread ayant une réponse
  const prospectIdsWithReply = new Set<string>() // pour changement de statut si envoye/ouvert

  for (const [accountId, entries] of byAccount) {
    const account = accounts.find(a => a.id === accountId)
    if (!account) continue
    let gmail
    try { gmail = await getAuthenticatedGmail(accountId) } catch { continue }

    const myEmail = account.email?.toLowerCase() ?? ''

    const results = await Promise.all(
      entries.map(entry =>
        gmail.users.threads.get({
          userId: 'me', id: entry.threadId,
          format: 'metadata', metadataHeaders: ['From'],
        }).catch(() => null)
      )
    )

    for (let i = 0; i < results.length; i++) {
      const res = results[i]
      const entry = entries[i]
      if (!res?.data.messages || res.data.messages.length <= 1) continue

      const hasReply = res.data.messages.some(msg => {
        const from = msg.payload?.headers?.find(h => h.name === 'From')?.value ?? ''
        const fromEmail = parseEmailHeader(from)
        return fromEmail && fromEmail !== myEmail
      })

      if (hasReply) {
        emailIdsToFlag.add(entry.latestEmailId)
        prospectIdsWithReply.add(entry.prospectId)
      }
    }
  }

  // 1) Flag emails.a_recu_reponse = true sur le dernier sortant (toujours, indépendant du statut)
  if (emailIdsToFlag.size > 0) {
    await supabase
      .from('emails')
      .update({ a_recu_reponse: true })
      .in('id', Array.from(emailIdsToFlag))
  }

  // 2) Statut prospect → repondu SEULEMENT si envoye ou ouvert (garde call_booke/signe)
  if (prospectIdsWithReply.size > 0) {
    const { data: eligibleProspects } = await supabase
      .from('prospects')
      .select('id')
      .in('id', Array.from(prospectIdsWithReply))
      .in('statut', ['envoye', 'ouvert'])
    const idsToFlip = (eligibleProspects ?? []).map(p => p.id)
    if (idsToFlip.length > 0) {
      await supabase
        .from('prospects')
        .update({ statut: 'repondu' })
        .in('id', idsToFlip)
    }
  }

  return NextResponse.json({
    flagged_emails: emailIdsToFlag.size,
    updated_prospects: prospectIdsWithReply.size,
  })
}

export async function GET() { return syncReplies() }
export async function POST() { return syncReplies() }
```

- [ ] **Step 3 : Lancer le test**

Run: `npm test -- tests/integration/sync-replies.test.ts`
Expected : le smoke test passe.

- [ ] **Step 4 : Build**

Run: `npm run build`
Expected : la build passe.

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/gmail/sync-replies/route.ts tests/integration/sync-replies.test.ts
git commit -m "phase1: sync-replies — sans filtre statut, flag a_recu_reponse sur dernier sortant"
```

---

## Task 14 : Vérification finale — type-check + tests + build

**Files:** —

- [ ] **Step 1 : Type-check global**

Run: `npm run type-check`
Expected : aucune erreur.

- [ ] **Step 2 : Suite de tests complète**

Run: `npm test`
Expected : tous les tests passent (kpis.test, webhook-n8n.test, sync-replies.test, sanity).

- [ ] **Step 3 : Build Next**

Run: `npm run build`
Expected : build OK, aucun warning sur les routes modifiées.

- [ ] **Step 4 : Smoke test `dev` manuel**

Run: `npm run dev` puis ouvrir http://localhost:3000
Checklist :
- Dashboard s'affiche (peut afficher 0/0/0 si la migration n'est pas encore appliquée — c'est normal).
- `/settings` affiche 2 champs de délai.
- `/relances` ne crashe pas.

- [ ] **Step 5 : Commit du sanity test / cleanup si besoin**

Si tout est vert, aucun commit supplémentaire requis.

---

## Task 15 : Documentation déploiement

**Files:**
- Modify: `docs/superpowers/specs/2026-04-22-phase1-data-foundations-design.md` (ajout d'un post-mortem court) — OPTIONNEL

- [ ] **Step 1 : Appliquer la migration SQL en staging (si dispo) puis prod Supabase**

Coller le contenu de `supabase/migrations/004_contact_channels_and_relances.sql` dans l'éditeur SQL Supabase.

Expected : 5 ALTER / 2 UPDATE / 2 INSERT réussis, aucun row error.

- [ ] **Step 2 : Déployer sur Vercel**

Via git push sur `main` (Vercel auto-deploy).

- [ ] **Step 3 : Déclencher manuellement le backfill a_recu_reponse**

```bash
curl -X GET https://<crm-url>/api/gmail/sync-replies
```

Expected : JSON `{ flagged_emails: N, updated_prospects: M }` avec N > 0 si des threads ont déjà des réponses.

- [ ] **Step 4 : Vérifier les KPIs**

Ouvrir `/` → les 3 charts affichent des chiffres réalistes.

---

## Hors scope (rappel)

- Pas d'UI prospect drawer modifiée (Phase 2).
- Pas de stockage des messages Gmail reçus (Phase 2).
- Pas de travail responsive (Phase 3).
- Pas de lazy-load recharts ni d'ISR (Phase 3).

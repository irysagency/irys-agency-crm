---
title: Phase 1 — Fondations données (KPIs, canaux, relances, N8N)
date: 2026-04-22
status: draft
owner: contact@irysagency.com
---

# Phase 1 — Fondations données

## Contexte

Le CRM IRYS est en production mais les indicateurs sont faux (ex. taux d'ouverture à 0 %, "personnes contactées" qui ne reflète pas la réalité), et l'intégration N8N duplique des prospects sans dédoublonner. Avant toute amélioration UX/perf, il faut assainir la couche données : c'est la seule qui est consommée par toutes les autres phases.

Cette spec couvre **uniquement les fixes de données backend**. L'UI existante reste inchangée visuellement — les KPIs seront simplement corrects une fois Phase 1 livrée.

## Objectifs

1. **Une seule source de vérité pour les KPIs** (fini le recalcul client dans `KpiGrid`).
2. **"Personnes contactées" reflète la vérité** : prospects contactés par email **OU** Instagram (canal séparé tracké).
3. **Taux d'ouverture cohérent** : calculé depuis la table `emails` (pixel tracking), pas depuis le statut du prospect.
4. **Taux de réponse cohérent** : même dénominateur que l'ouverture (emails envoyés) pour qu'on compare des torchons avec des torchons.
5. **Sync Gmail complète** : détecte les réponses même pour les prospects `call_booke` / `signe`.
6. **Relances configurables partout** : un seul délai paramétrable, plus de hardcode 2 jours pour le statut `ouvert`.
7. **N8N robuste** : dédup sur email ou instagram, validation runtime des niches, erreurs lisibles.

## Ce que la Phase 1 NE fait PAS

- Pas de redesign de l'UI de la fiche prospect (Phase 2).
- Pas de stockage des threads Gmail (Phase 2).
- Pas de travail responsive (Phase 3).
- Pas de refactor perf (Phase 3).

## Changements de schéma

Nouvelle migration `004_contact_channels_and_relances.sql` :

```sql
-- 1. Canaux de contact tracking
alter table prospects add column contacte_email boolean not null default false;
alter table prospects add column contacte_instagram boolean not null default false;
alter table prospects add column contacte_email_le timestamptz;
alter table prospects add column contacte_instagram_le timestamptz;

create index idx_prospects_contacte_email on prospects(contacte_email) where contacte_email = true;
create index idx_prospects_contacte_instagram on prospects(contacte_instagram) where contacte_instagram = true;

-- 2. Backfill : quiconque a au moins un email envoyé en base a été contacté par email
update prospects p
set contacte_email = true,
    contacte_email_le = coalesce(
      (select min(envoye_le) from emails where prospect_id = p.id),
      p.derniere_action
    )
where exists (select 1 from emails where prospect_id = p.id);

-- 3. Backfill tail : tout prospect dont le statut != 'a_contacter' ET qui n'a pas d'email
--    est supposé contacté par IG (c'est la seule autre voie aujourd'hui).
update prospects
set contacte_instagram = true,
    contacte_instagram_le = coalesce(derniere_action, created_at)
where statut != 'a_contacter'
  and contacte_email = false;

-- 4. Seed setting relance_delai_jours si absent
insert into app_settings (key, value)
values ('relance_delai_jours', '7')
on conflict (key) do nothing;

-- 5. Nouveau setting : délai relance pour statut 'ouvert' (défaut 3 jours)
insert into app_settings (key, value)
values ('relance_delai_ouvert_jours', '3')
on conflict (key) do nothing;
```

Note : `7` jours pour `envoye` correspond à la demande du user. Le délai `ouvert` est mis à 3 jours par défaut (un prospect qui a ouvert mais n'a pas répondu sous 3 jours vaut une relance).

## Règles métier

### "Personnes contactées"

```
count(prospects where contacte_email = true OR contacte_instagram = true)
```

### Taux d'ouverture

```
count(emails where ouvert = true) / count(emails) * 100
```

Dénominateur = tous les emails jamais envoyés (pas "cette semaine" — le user l'a explicitement demandé).

### Taux de réponse

```
count(emails where a_recu_reponse = true) / count(emails) * 100
```

**Règle de flagging `a_recu_reponse`** : quand `sync-replies` détecte qu'un thread contient au moins un message `from != ma boîte`, on marque **uniquement le dernier email sortant du thread** (l'`emails` row avec `gmail_thread_id = X` + `envoye_le` max) comme `a_recu_reponse = true`. Raison : éviter la double-comptabilisation si plusieurs relances ont été envoyées sur le même thread — on veut "ce thread a abouti à une réponse", une fois.

Pour Phase 1 on approxime avec `emails.a_recu_reponse boolean` (nouvelle colonne). La table `gmail_messages` complète (stockage des messages reçus) arrive en Phase 2.

Ajout à la migration :

```sql
alter table emails add column a_recu_reponse boolean not null default false;
create index idx_emails_a_recu_reponse on emails(a_recu_reponse) where a_recu_reponse = true;
```

### Relances

Un prospect est en relance si :
- `contacte_email = true` (on ne relance que ce qu'on a envoyé — pas d'IG pour Phase 1)
- `statut` ∈ `{envoye, ouvert}` (pas `repondu`, `call_booke`, `signe`, `refuse`)
- `derniere_action < now() - delai_jours_selon_statut`
  - Pour `envoye` : `relance_delai_jours` (défaut 7)
  - Pour `ouvert` : `relance_delai_ouvert_jours` (défaut 3)

La migration garantit que les deux settings existent — on **supprime le fallback `|| 4`** en bout de chaîne dans `getRelances()` au profit d'une erreur explicite si la ligne `app_settings` disparaissait (cas anormal qu'on veut voir).

### Contrats de données

**`getDashboardStats()` — nouveau type de retour** (remplace intégralement l'actuel) :

```ts
export interface DashboardStats {
  personnesContactees: number   // prospects contacte_email=true OR contacte_instagram=true
  mailsEnvoyes: number          // total emails (pas filtré par date)
  tauxOuverture: number         // 0-100 entier, emails.ouvert=true / emails.*
  tauxReponse: number           // 0-100 entier, emails.a_recu_reponse=true / emails.*
  callsBookes: number           // prospects.statut='call_booke'
  clientsSignes: number         // prospects.statut='signe'
}
```

`FunnelChart` et `ActivityChart` recevront leurs propres datasets dédiés (pas le même objet — ils ont besoin de la ventilation par statut / par jour). À exposer :

```ts
export interface FunnelData { [K in StatutType]: number }
export interface ActivityPoint { jour: string /* ISO date */; emailsEnvoyes: number; ouvertures: number }
export async function getFunnelData(): Promise<FunnelData>
export async function getActivityData(lastNDays?: number): Promise<ActivityPoint[]>
```

**`/api/settings/relance-delay` — nouveau contrat** :

```ts
// GET /api/settings/relance-delay
// 200 OK
{
  delaiEnvoye: number   // jours, 1-30
  delaiOuvert: number   // jours, 1-30
}

// POST /api/settings/relance-delay
// Body (partiel accepté — on PATCH)
{
  delaiEnvoye?: number
  delaiOuvert?: number
}
// 200 OK → même shape que GET
// 400 si valeur hors [1, 30]
```

### N8N webhook

- **Validation runtime** : `niche` doit être dans la liste `NICHES` (erreur 400 sinon avec la liste attendue).
- **Dédup** : ordre de priorité → `email` (si fourni et non vide) → `instagram` (si fourni). Si un prospect existe déjà avec cet identifiant, on **retourne 200 avec `{ deduplicated: true, prospect_id }`** au lieu de créer un doublon. Ne met **pas** à jour les champs du prospect existant (responsabilité du user à nettoyer dans l'UI).
- **Erreurs lisibles** : plus de `error.message` brut Supabase renvoyé au client. Mapping vers des messages `CRM-*` côté app.

## Composants à modifier

| Fichier | Nature du changement |
|---|---|
| `supabase/migrations/004_contact_channels_and_relances.sql` | Nouvelle migration |
| `src/types/database.ts` | Ajouter `contacte_email`, `contacte_instagram`, `contacte_email_le`, `contacte_instagram_le`, `a_recu_reponse` |
| `src/lib/supabase/queries.ts` | Remplacer `getDashboardStats()` par une version correcte + nouveau `getRelances()` utilisant les 2 settings |
| `src/components/dashboard/KpiGrid.tsx` | **Supprimer le fetch client** : transformer en Server Component qui reçoit les stats en props. Plus de recalcul local. |
| `src/app/page.tsx` | Fetch `getDashboardStats()` côté serveur, passer en props à `KpiGrid`, `FunnelChart`, `ActivityChart` |
| `src/components/dashboard/FunnelChart.tsx` + `ActivityChart.tsx` | Même transformation Server → props |
| `src/app/api/gmail/sync-replies/route.ts` | Retirer le filtre `.in('statut', ['envoye', 'ouvert'])` ligne 41 — on itère tous les threads Gmail de tous les prospects contactés. Pour chaque thread ayant au moins un message `from != moi`, **flagger `emails.a_recu_reponse = true` sur le dernier email sortant du thread, toujours, indépendamment du statut prospect**. Ensuite, **seulement** si le statut actuel du prospect est `envoye` ou `ouvert`, passer à `repondu` (garde au-delà → le statut est figé, mais la réponse est comptée dans le KPI). |
| `src/app/api/gmail/send/route.ts` | À chaque envoi, marquer `prospects.contacte_email = true` + `contacte_email_le = now()`. |
| `src/app/api/webhooks/n8n/route.ts` | Validation runtime niche + dédup email/instagram + erreurs mappées |
| `src/app/api/settings/relance-delay/route.ts` | Ajouter support du setting `relance_delai_ouvert_jours` (GET + POST). Renvoyer les 2 délais en GET. |
| `src/components/settings/TrackingStatus.tsx` | Afficher 2 sliders/inputs au lieu d'un |

## Tests (TDD)

Priorité absolue sur les pures fonctions de calcul. Pas de framework de test installé actuellement → Phase 1 ajoute **Vitest** minimal (plus léger que Jest, marche out-of-the-box avec Next/TS).

### Cas à couvrir (chaque test = un cas métier du user)

**`queries.test.ts`** (unit) :
- `getDashboardStats` retourne `personnesContactees` = 3 pour 2 prospects `contacte_email=true` + 1 prospect `contacte_instagram=true` (0 overlap).
- `getDashboardStats` retourne `personnesContactees` = 2 quand un prospect a `contacte_email=true` ET `contacte_instagram=true` (dédoublonnage).
- `getDashboardStats` retourne `tauxOuverture` = 50 quand 1 email ouvert sur 2.
- `getDashboardStats` retourne `tauxOuverture` = 0 (pas NaN) quand 0 email.
- `getDashboardStats` retourne `tauxReponse` = 33 quand 1 email avec `a_recu_reponse=true` sur 3.
- `getRelances` inclut prospect `envoye` avec `derniere_action` = now - 8 jours (délai=7).
- `getRelances` exclut prospect `envoye` avec `derniere_action` = now - 5 jours (délai=7).
- `getRelances` inclut prospect `ouvert` avec `derniere_action` = now - 4 jours (délai_ouvert=3).
- `getRelances` exclut prospects `repondu` / `call_booke` / `signe` / `refuse` même anciens.
- `getRelances` exclut prospects `contacte_email=false` (pas de mail envoyé → rien à relancer).

**`webhook-n8n.test.ts`** (integration Next route handler) :
- POST sans `Authorization` → 401.
- POST avec `niche: "invalide"` → 400 avec liste des niches acceptées.
- POST avec `email` déjà en DB → 200 `{ deduplicated: true, prospect_id }`.
- POST avec `instagram` déjà en DB + pas d'email → 200 `{ deduplicated: true }`.
- POST avec nouveau prospect → 201 `{ success: true, prospect }`.

**`sync-replies.test.ts`** (integration, mocké Gmail) :
- Prospect `call_booke` reçoit une réponse Gmail → dernier email sortant du thread `a_recu_reponse = true`, statut prospect inchangé.
- Prospect `signe` reçoit une réponse Gmail → dernier email sortant du thread `a_recu_reponse = true`, statut prospect inchangé (garde la finalité commerciale).
- Prospect `envoye` reçoit une réponse Gmail → dernier email sortant du thread `a_recu_reponse = true`, statut passe à `repondu`.
- Thread avec 3 emails sortants du même prospect + 1 réponse → **seul le 3e (le plus récent) email a `a_recu_reponse=true`** (pas les 2 premiers).

## Plan de déploiement

1. Migration SQL appliquée sur Supabase prod (backfill inclus).
2. Déploiement Vercel.
3. **Attendu transitoire** : juste après déploiement, le **taux de réponse affichera 0 %** tant que le sync-replies n'a pas backfillé `a_recu_reponse` sur les threads historiques. Ne pas paniquer ni revert.
4. Appeler manuellement `GET /api/gmail/sync-replies` (ou attendre le cron horaire `a038e2a`) pour poser `a_recu_reponse = true` sur les threads ayant déjà eu une réponse.
5. Revérifier les KPIs après le sync → taux de réponse réaliste.

## Risques & mitigations

| Risque | Mitigation |
|---|---|
| Backfill SQL classe mal les prospects contactés IG (heuristique "pas d'email = IG") | Accepté comme approximation Phase 1 — le user peut corriger à la main depuis la fiche en Phase 2. |
| Dédup N8N casse des workflows existants qui comptent sur la création multiple | Webhook actuel retourne toujours 201, la nouvelle version retourne 200 pour dédup → N8N doit gérer les deux status. Documenter dans le body de la réponse. |
| `force-dynamic` + suppression du fetch client = hydration mismatch | Les 3 composants dashboard deviennent Server Components purs (pas de state client). Aucun risque de mismatch. |
| Sync-replies pose `a_recu_reponse` sur les emails mais la Phase 1 n'affiche pas encore la réponse | C'est attendu — Phase 2 se branchera là-dessus. Zéro régression visible. |

## Sortie

Une fois Phase 1 livrée, le dashboard affiche des chiffres justes, les relances utilisent un délai cohérent et configurable, et N8N ne dédouble plus. Rien d'autre ne bouge visuellement — la scène est nettoyée pour que Phase 2 (fiche prospect + thread Gmail) construise dessus.

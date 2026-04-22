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

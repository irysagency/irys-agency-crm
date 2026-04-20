-- Activer UUID
create extension if not exists "uuid-ossp";

-- Enum niches
create type niche_type as enum (
  'Tech & IA',
  'Finance & Wealth',
  'Productivité & Second Brain',
  'Entrepreneur',
  'Marketing & Vente',
  'Creator Economy',
  'Ecommerce',
  'Make Money & Trends'
);

-- Enum statuts
create type statut_type as enum (
  'a_contacter',
  'envoye',
  'ouvert',
  'repondu',
  'call_booke',
  'signe',
  'refuse'
);

-- Table prospects
create table prospects (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  nom text not null,
  niche niche_type not null,
  instagram text,
  youtube text,
  linkedin text,
  email text,
  whatsapp text,
  statut statut_type not null default 'a_contacter',
  notes text,
  derniere_action timestamptz,
  nb_ouvertures integer not null default 0
);

-- Table emails
create table emails (
  id uuid primary key default uuid_generate_v4(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  created_at timestamptz default now(),
  objet text not null,
  corps text not null,
  envoye_le timestamptz default now(),
  ouvert boolean not null default false,
  nb_ouvertures integer not null default 0,
  premier_ouverture timestamptz,
  gmail_thread_id text
);

-- Table tracking pixels
create table tracking_pixels (
  id uuid primary key default uuid_generate_v4(),
  email_id uuid not null references emails(id) on delete cascade,
  prospect_id uuid not null references prospects(id) on delete cascade,
  ouvert_le timestamptz default now()
);

-- Table settings applicatives
create table app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Indexes
create index idx_prospects_statut on prospects(statut);
create index idx_prospects_niche on prospects(niche);
create index idx_emails_prospect_id on emails(prospect_id);
create index idx_tracking_email_id on tracking_pixels(email_id);
create index idx_tracking_prospect_id on tracking_pixels(prospect_id);

-- RLS : ENABLE avant CREATE POLICY (obligatoire dans Supabase)
alter table prospects enable row level security;
alter table emails enable row level security;
alter table tracking_pixels enable row level security;
alter table app_settings enable row level security;

create policy "Service role has full access to prospects"
  on prospects for all using (true) with check (true);

create policy "Service role has full access to emails"
  on emails for all using (true) with check (true);

create policy "Service role has full access to tracking_pixels"
  on tracking_pixels for all using (true) with check (true);

create policy "Service role has full access to app_settings"
  on app_settings for all using (true) with check (true);

-- Fonctions RPC pour incréments atomiques (évite race conditions)
create or replace function increment_email_ouvertures(
  p_email_id uuid,
  p_premier_ouverture timestamptz,
  p_already_opened boolean
) returns void language plpgsql as $$
begin
  update emails set
    ouvert = true,
    nb_ouvertures = nb_ouvertures + 1,
    premier_ouverture = case when not p_already_opened then p_premier_ouverture else premier_ouverture end
  where id = p_email_id;
end;
$$;

create or replace function handle_email_open_prospect(
  p_prospect_id uuid,
  p_first_open boolean,
  p_now timestamptz
) returns void language plpgsql as $$
begin
  if p_first_open then
    update prospects set
      statut = 'ouvert',
      nb_ouvertures = nb_ouvertures + 1,
      derniere_action = p_now
    where id = p_prospect_id and statut = 'envoye';
  else
    update prospects set nb_ouvertures = nb_ouvertures + 1
    where id = p_prospect_id;
  end if;
end;
$$;

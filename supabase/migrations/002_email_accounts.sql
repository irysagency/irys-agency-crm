-- Table des comptes Gmail connectés
create table email_accounts (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  label text not null,
  email text,
  access_token text,
  refresh_token text,
  token_expiry bigint
);

alter table email_accounts enable row level security;
create policy "Service role has full access to email_accounts"
  on email_accounts for all using (true) with check (true);

-- Lier chaque email envoyé à un compte
alter table emails add column if not exists from_account_id uuid references email_accounts(id) on delete set null;

create index idx_email_accounts_label on email_accounts(label);

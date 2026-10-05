-- Metadata only. Solana/Meteora is the source of truth for chain state. Never store secrets.
create table if not exists users (wallet text primary key, created_at timestamptz default now());
create table if not exists market_configs (
  id uuid primary key default gen_random_uuid(), owner text not null, name text not null,
  category text not null, definition jsonb not null, config_address text, created_at timestamptz default now());
create table if not exists presets (
  id uuid primary key default gen_random_uuid(), owner text not null, name text not null, description text,
  category text not null, tags text[] default '{}', is_public boolean default true,
  price_sol numeric default 0, usage_count int default 0, definition jsonb not null, created_at timestamptz default now());
create table if not exists launches (
  id uuid primary key default gen_random_uuid(), creator text not null, name text not null, symbol text not null,
  category text not null, image_url text, base_mint text not null, pool_address text not null unique,
  config_address text not null, quote text not null, network text not null, created_at timestamptz default now());
create table if not exists transactions (
  signature text primary key, pool_address text not null, wallet text not null, side text not null,
  created_at timestamptz default now());
alter table presets enable row level security; alter table launches enable row level security;
alter table market_configs enable row level security; alter table transactions enable row level security;
alter table users enable row level security;
create policy "public read presets" on presets for select using (is_public);
create policy "public read launches" on launches for select using (true);
create policy "insert launches" on launches for insert with check (true);
create policy "insert presets" on presets for insert with check (true);
create policy "read configs" on market_configs for select using (true);
create policy "insert configs" on market_configs for insert with check (true);
create policy "read tx" on transactions for select using (true);
create policy "insert tx" on transactions for insert with check (true);
-- MVP policies are permissive; tighten with wallet-signature auth before mainnet.

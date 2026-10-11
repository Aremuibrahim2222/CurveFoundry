-- Run once in Supabase SQL Editor. Public bucket for token images + metadata JSON.
insert into storage.buckets (id, name, public) values ('token-meta', 'token-meta', true) on conflict (id) do nothing;
create policy "public read token-meta" on storage.objects for select using (bucket_id = 'token-meta');
create policy "public upload token-meta" on storage.objects for insert with check (bucket_id = 'token-meta');

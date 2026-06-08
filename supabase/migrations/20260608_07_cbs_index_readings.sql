-- F2 / Deel C2 (Fase 6): CBS GWW-inputprijsindex metingen
-- Additief + idempotent.

create table if not exists public.cbs_index_readings (
  id uuid primary key default gen_random_uuid(),
  datum text not null,                 -- CBS-periode, bv. '2026M03'
  waarde numeric(10,2) not null,       -- indexwaarde
  categorie text not null,             -- bv. '4211b' (gesloten verharding)
  fetched_at timestamptz not null default now(),
  unique (datum, categorie)
);

comment on table public.cbs_index_readings is 'CBS dataset 84538NED GWW-inputprijsindex (Fase 6).';

alter table public.cbs_index_readings enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cbs_index_readings' and policyname='Allow all access to cbs_index_readings') then
    create policy "Allow all access to cbs_index_readings" on public.cbs_index_readings for all using (true) with check (true);
  end if;
end $$;

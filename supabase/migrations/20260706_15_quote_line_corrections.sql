-- B3: quote_line_corrections — elke handmatige correctie vastgelegd bij
-- verzenden (diff gegenereerd vs. verstuurd). Leersignaal voor de loop.
--
-- Puur additief: één nieuwe tabel + één nieuwe (nullable) kolom op de in B1
-- aangemaakte tabel quote_generation_runs. Geen wijzigingen aan bestaande
-- tabellen van vóór dit uitvoerplan. RLS: alleen service-role, zelfde
-- afsluiting als quote_generation_runs. Toepassen via de SQL-editor.

-- Snapshot van de gegenereerde regels (incl. rij-ids na persist), zodat de
-- verzendflow kan diffen tegen wat er oorspronkelijk gegenereerd is.
alter table public.quote_generation_runs
  add column if not exists generated_lines jsonb;

create table if not exists public.quote_line_corrections (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  quote_id          uuid not null references public.quotes(id) on delete cascade,
  generation_run_id uuid references public.quote_generation_runs(id) on delete set null,
  correction_type   text not null check (correction_type in
    ('line_added','line_removed','quantity_changed','price_changed',
     'description_changed','section_changed','extraction_corrected')),
  line_description  text,
  old_value         jsonb,
  new_value         jsonb
);

create index if not exists quote_line_corrections_quote_id_idx
  on public.quote_line_corrections (quote_id);

create index if not exists quote_line_corrections_run_id_idx
  on public.quote_line_corrections (generation_run_id);

alter table public.quote_line_corrections enable row level security;

-- Geen policies voor anon/authenticated: alleen de service-role (server)
-- leest en schrijft deze tabel.

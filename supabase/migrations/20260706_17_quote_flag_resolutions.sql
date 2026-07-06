-- C2.1: quote_flag_resolutions — expliciete oplos-acties voor blocking flags.
--
-- De send-route weigert (422) zolang de jongste generation run van een offerte
-- blocking flags heeft zonder oplos-actie. Eén rij = één bewust opgeloste flag
-- (wanneer + welke); dit is zelf leerdata over hoe vaak vlaggen handmatig
-- worden afgehandeld. Resolutie matcht op run + code + message: dezelfde code
-- voor een andere post blijft blokkeren.
--
-- Puur additief. RLS conform quote_generation_runs (migratie 14): alleen de
-- service-role leest en schrijft. Toepassen via de SQL-editor.

create table if not exists public.quote_flag_resolutions (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  quote_id          uuid not null references public.quotes(id) on delete cascade,
  generation_run_id uuid not null references public.quote_generation_runs(id) on delete cascade,
  flag_code         text not null,
  flag_message      text not null,
  -- Wie heeft opgelost — nu altijd de eigenaar (single-user admin), kolom
  -- alvast aanwezig voor als er meer gebruikers komen.
  resolved_by       text,
  unique (generation_run_id, flag_code, flag_message)
);

create index if not exists quote_flag_resolutions_quote_id_idx
  on public.quote_flag_resolutions (quote_id);

alter table public.quote_flag_resolutions enable row level security;

-- Geen policies voor anon/authenticated: alleen de service-role (server)
-- leest en schrijft deze tabel. Zelfde afsluiting als quote_generation_runs.

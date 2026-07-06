-- B1: quote_generation_runs — elke AI-generatie gelogd (leerdata + golden set).
--
-- Puur additief: één nieuwe tabel, geen ALTER op bestaande tabellen.
-- RLS conform het bestaande patroon (zie 20260608_12_learned_prices_rls.sql):
-- de server schrijft via de service-role en omzeilt RLS; de anon key kan er
-- niet bij. Toepassen via de SQL-editor in het Supabase-dashboard.

create table if not exists public.quote_generation_runs (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  -- Nullable: gekoppeld ná persist; een run zonder persist heeft geen quote.
  quote_id       uuid references public.quotes(id) on delete set null,
  -- De letterlijke schouwnotities zoals ingevoerd.
  notes_raw      text not null,
  -- Volledige structured output van Laag 1 (AIUnderstandingResult).
  ai_output      jsonb not null,
  model          text not null,
  prompt_version text not null,
  confidence     numeric,
  -- QuoteFlag[]: { code, severity, message } per vlag (A3).
  flags          jsonb not null default '[]'::jsonb,
  -- De PipelineConfig (method, layout, uurtarief, dagafronding, btw).
  config         jsonb not null,
  duration_ms    integer
);

create index if not exists quote_generation_runs_quote_id_idx
  on public.quote_generation_runs (quote_id);

create index if not exists quote_generation_runs_created_at_idx
  on public.quote_generation_runs (created_at);

alter table public.quote_generation_runs enable row level security;

-- Geen policies voor anon/authenticated: alleen de service-role (server)
-- leest en schrijft deze tabel. Zelfde afsluiting als learned_prices.

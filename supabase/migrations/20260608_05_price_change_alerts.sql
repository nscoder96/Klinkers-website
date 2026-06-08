-- F2 / Deel C: marktprijs-signalering
-- Additief + idempotent. Geld = DECIMAL(19,4) (consistent met snapshot-keuze).

create table if not exists public.price_change_alerts (
  id uuid primary key default gen_random_uuid(),
  pricing_item_id uuid references public.pricing(id),
  old_price numeric(19,4),
  new_price numeric(19,4),
  pct_change numeric(7,2),
  source text not null default 'manual',     -- 'manual' | 'cbs_index'
  detected_at timestamptz not null default now(),
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  affected_draft_quotes jsonb not null default '[]'::jsonb
);

comment on table public.price_change_alerts is 'Prijswijzigingen die review vragen (Deel C2). Bron handmatig of CBS-index.';

create index if not exists idx_price_alerts_open on public.price_change_alerts (acknowledged_at) where acknowledged_at is null;

alter table public.price_change_alerts enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='price_change_alerts' and policyname='Allow all access to price_change_alerts') then
    create policy "Allow all access to price_change_alerts" on public.price_change_alerts for all using (true) with check (true);
  end if;
end $$;

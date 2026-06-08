-- F2 / Deel B2+B5: append-only audittrail voor offertes
-- Additief + idempotent.

create table if not exists public.quote_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  event_type text not null,            -- 'created' | 'line_modified' | 'sent' | 'approved' | ...
  actor_id uuid,
  occurred_at timestamptz not null default now(),
  before_state jsonb,
  after_state jsonb
);

comment on table public.quote_events is 'Append-only audittrail (Deel B5). Niet muteren of verwijderen.';

create index if not exists idx_quote_events_quote on public.quote_events (quote_id, occurred_at);

alter table public.quote_events enable row level security;
do $$ begin
  -- Append-only: insert + select toegestaan, geen update/delete policy.
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='quote_events' and policyname='Allow insert quote_events') then
    create policy "Allow insert quote_events" on public.quote_events for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='quote_events' and policyname='Allow select quote_events') then
    create policy "Allow select quote_events" on public.quote_events for select using (true);
  end if;
end $$;

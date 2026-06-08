-- F2 / Deel B2: BTW-tarieven per regel
-- Additief + idempotent. Geldwaarden n.v.t. (rate_pct = fractie).

create table if not exists public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  rate_pct numeric(5,4) not null,                 -- 0.2100 = 21%
  applies_to_category text not null default 'all' -- 'arbeid' | 'materiaal' | 'all'
    check (applies_to_category in ('arbeid','materiaal','all')),
  effective_from date not null default current_date,
  effective_until date,
  created_at timestamptz not null default now()
);

comment on table public.tax_rates is 'BTW-tarieven (NL). rate_pct als fractie, bijv. 0.2100.';

alter table public.tax_rates enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tax_rates' and policyname='Allow all access to tax_rates') then
    create policy "Allow all access to tax_rates" on public.tax_rates for all using (true) with check (true);
  end if;
end $$;

-- Seed NL-tarieven (idempotent op unieke naam)
insert into public.tax_rates (name, rate_pct, applies_to_category) values
  ('BTW Hoog 21%', 0.2100, 'all'),
  ('BTW Laag 9%', 0.0900, 'arbeid'),
  ('BTW Vrijgesteld', 0.0000, 'all')
on conflict (name) do nothing;

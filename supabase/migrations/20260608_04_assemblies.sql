-- F2 / Deel B2+B3: assembly-templates (werk-templates die uitklappen in regels)
-- Additief + idempotent.

create table if not exists public.assemblies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  trigger_category text,            -- bv. 'bestrating_gebakken'
  trigger_action text,              -- 'nieuw' | 'vervangen' | 'herstraten' | 'verwijderen'
  unit text not null default 'm2',  -- 'm2' | 'm1' | 'stuk' | 'm3'
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.assemblies is 'Werk-templates (Deel B3). Activering klapt uit in assembly_components.';

create table if not exists public.assembly_components (
  id uuid primary key default gen_random_uuid(),
  assembly_id uuid not null references public.assemblies(id) on delete cascade,
  pricing_item_id uuid references public.pricing(id),  -- nullable: anders match op naam
  item_name_match text,                                -- naam-lookup als pricing_item_id leeg
  component_type text not null                         -- 'arbeid' | 'materiaal' | 'materieel'
    check (component_type in ('arbeid','materiaal','materieel')),
  quantity_per_unit numeric(12,4) not null default 1,  -- hoeveelheid per 1 eenheid input
  quantity_formula text,                               -- bv. 'qty * zanddikte_cm / 100 * 1.10'
  is_optional boolean not null default false,
  flag_when_missing text,                              -- bv. '⚠️ Zanddikte controleren'
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on column public.assembly_components.quantity_formula is 'Conversieformule (Deel A2). Variabelen: qty, afgraafdiepte_cm, zanddikte_cm.';

create index if not exists idx_assembly_components_assembly on public.assembly_components (assembly_id, sort_order);

-- FK van quote_line_items.assembly_id -> assemblies.id (kolom uit migration 03)
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_schema='public' and table_name='quote_line_items' and constraint_name='quote_line_items_assembly_id_fkey'
  ) then
    alter table public.quote_line_items
      add constraint quote_line_items_assembly_id_fkey
      foreign key (assembly_id) references public.assemblies(id);
  end if;
end $$;

alter table public.assemblies enable row level security;
alter table public.assembly_components enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='assemblies' and policyname='Allow all access to assemblies') then
    create policy "Allow all access to assemblies" on public.assemblies for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='assembly_components' and policyname='Allow all access to assembly_components') then
    create policy "Allow all access to assembly_components" on public.assembly_components for all using (true) with check (true);
  end if;
end $$;

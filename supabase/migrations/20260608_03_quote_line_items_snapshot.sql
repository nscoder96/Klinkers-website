-- F2 / Deel B1+B2: bevroren prijs-snapshot + per-regel BTW + assembly-uitklap
-- Additief + idempotent. Geld = DECIMAL(19,4).

alter table public.quote_line_items add column if not exists unit_price_snapshot numeric(19,4);
alter table public.quote_line_items add column if not exists description_snapshot text;
alter table public.quote_line_items add column if not exists tax_rate_id uuid references public.tax_rates(id);
alter table public.quote_line_items add column if not exists parent_line_id uuid references public.quote_line_items(id) on delete cascade;
alter table public.quote_line_items add column if not exists assembly_id uuid;  -- FK toegevoegd in 20260608_04
alter table public.quote_line_items add column if not exists is_visible_on_pdf boolean not null default true;

comment on column public.quote_line_items.unit_price_snapshot is 'Bevroren eenheidsprijs bij aanmaken (Deel B1). Nooit live-join na aanmaken.';
comment on column public.quote_line_items.parent_line_id is 'Voor assembly-uitklap: child verwijst naar parent-regel.';

create index if not exists idx_qli_parent on public.quote_line_items (parent_line_id);

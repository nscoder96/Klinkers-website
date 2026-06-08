-- F5 / Security: RLS aanzetten op learned_prices (advisor level=critical).
-- learned_prices heeft geen eigen tenant-kolom; scope via de gekoppelde pricing-rij
-- (tenant_id NULL = gedeelde default, anders eigen tenant). Service-role (server)
-- omzeilt RLS, dus de app-pipeline blijft werken; alleen de anon key wordt afgesloten.

alter table public.learned_prices enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='learned_prices' and policyname='learned_prices tenant scope') then
    create policy "learned_prices tenant scope" on public.learned_prices for all
      using (exists (
        select 1 from public.pricing p
        where p.id = learned_prices.pricing_id
          and (p.tenant_id is null or p.tenant_id = auth.uid())
      ))
      with check (exists (
        select 1 from public.pricing p
        where p.id = learned_prices.pricing_id
          and (p.tenant_id is null or p.tenant_id = auth.uid())
      ));
  end if;
end $$;

-- C1: Prijsmatching exact-of-flag.
--
-- assembly_components.pricing_item_id (kolom bestaat al sinds migratie 04,
-- incl. FK naar pricing) wordt de expliciete prijs-koppeling. De code slaat
-- naam-matching volledig over voor componenten met deze koppeling; de
-- substring-fallback in de code is vervallen. Deze migratie vult de kolom
-- voor alle geseede componenten op basis van de huidige item_name_match
-- (exact, case-insensitief, getrimd).
--
-- Idempotent: alleen rijen waar de koppeling nog leeg is.
-- Componenten met item_name_match = null (vrije materiaalkeuze van de klant,
-- opgelost via token-overlap op de materiaalvoorkeur) blijven bewust ongekoppeld.

update public.assembly_components ac
set pricing_item_id = (
  select p.id
  from public.pricing p
  where p.is_active
    and lower(trim(p.item_name)) = lower(trim(ac.item_name_match))
  order by (p.tenant_id is null) desc, p.created_at asc
  limit 1
)
where ac.item_name_match is not null
  and ac.pricing_item_id is null;

-- Controle (hoort 0 rijen op te leveren): elke rij hieronder is een component
-- mét match-naam maar zónder prijs-koppeling. Zo'n component krijgt bij
-- generatie een blocking MISSING_PRICE-flag — bewust geen stille gok. Los op
-- door de prijsregel aan te maken/activeren en deze migratie opnieuw te draaien.
select ac.id, a.name as assembly, ac.item_name_match, ac.component_type, ac.sort_order
from public.assembly_components ac
join public.assemblies a on a.id = ac.assembly_id
where ac.item_name_match is not null
  and ac.pricing_item_id is null
order by a.name, ac.sort_order;

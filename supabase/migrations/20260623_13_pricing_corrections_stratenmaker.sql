-- 2026-06-23: Prijscorrecties op basis van domeinkennis stratenmaker (Niek)
-- Reeds live uitgevoerd via REST API. Dit bestand documenteert de wijzigingen
-- zodat ze bij een fresh seed ook correct zijn.

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Prijstabel (pricing)
-- ────────────────────────────────────────────────────────────────────────────

-- 1a. Straatzand: losgestoord ipv big bag, marktprijs €50/m³
update public.pricing
set item_name             = 'Straatzand losgestoord',
    selling_price_min     = 40,
    selling_price_default = 50,
    selling_price_max     = 65,
    cost_price            = 40.00
where item_name = 'Straatzand big bag incl. levering'
  and source    = 'market_research'
  and tenant_id is null;

-- 1b. Opsluitband arbeid: verwijder 'incl. beton' uit label (beton zit in het werk, niet in de naam)
update public.pricing
set item_name = 'Opsluitbanden stellen'
where item_name = 'Opsluitband stellen incl. beton'
  and source    = 'market_research'
  and tenant_id is null;

-- 1c. Voegzand: marktprijs €20/zak (was €7)
update public.pricing
set selling_price_min     = 15,
    selling_price_default = 20,
    selling_price_max     = 25,
    cost_price            = 16.00
where item_name = 'Voegzand zak 25 kg'
  and source    = 'market_research'
  and tenant_id is null;

-- 1d. Opsluitbanden materiaal toevoegen (standaard tuinwerk = 5/15 cm, zwaarder werk = 10/20 cm)
insert into public.pricing
  (category, item_name, item_type, unit, cost_price,
   selling_price_min, selling_price_default, selling_price_max,
   is_active, ai_generated, source, valid_from, tenant_id)
values
  ('opsluitwerk', 'Opsluitbanden 5/15 cm',  'materiaal', 'm¹', 5.60,  5,  7, 10, true, false, 'market_research', current_date, null),
  ('opsluitwerk', 'Opsluitbanden 10/20 cm', 'materiaal', 'm¹', 8.80,  8, 11, 15, true, false, 'market_research', current_date, null)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Assembly components
-- ────────────────────────────────────────────────────────────────────────────

-- 2a. Straatzand naam synchroniseren in alle assemblies
update public.assembly_components
set item_name_match = 'Straatzand losgestoord'
where item_name_match = 'Straatzand big bag incl. levering';

-- 2b. Opsluitband arbeid naam synchroniseren
update public.assembly_components
set item_name_match = 'Opsluitbanden stellen'
where item_name_match = 'Opsluitband stellen incl. beton';

-- 2c. Voegzand formule: 1 zak per 5 m² (onderzoek: 5-10 kg/m², zak 25 kg → ≈5 m² per zak)
--     sort_order 9 = bestrating_nieuw, sort_order 6 = herstraten
update public.assembly_components
set quantity_formula = 'greatest(ceil(qty / 5.0), 1)'
where item_name_match = 'Voegzand zak 25 kg'
  and sort_order in (6, 9);

-- 2d. Null-slot sort_order 10 in bestrating_nieuw koppelen aan opsluitbanden materiaal
update public.assembly_components
set item_name_match = 'Opsluitbanden 5/15 cm'
where assembly_id = (select id from public.assemblies where name = 'bestrating_nieuw')
  and item_name_match is null
  and component_type = 'materiaal'
  and sort_order = 10;

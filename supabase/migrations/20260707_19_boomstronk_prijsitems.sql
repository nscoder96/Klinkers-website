-- R2.2: prijsitems voor boomstronken rooien (stuks-werk), bewust ZONDER prijs.
--
-- De eigenaar kent zijn vaste stukprijzen nog niet: een regel zonder prijs
-- krijgt bij gebruik de blocking flag MISSING_PRICE, zodat de prijs per
-- offerte bewust handmatig ingevuld wordt tot de vaste prijzen bekend zijn.
-- Dan vult hij ze hier (via Prijzenbeheer) één keer in.
--
-- Bewust GEEN assembly: de assembly-matching werkt op categorie+actie, en
-- 'plantvakken verwijderen' en 'boomstronken rooien' zijn allebei
-- beplanting/verwijderen — een stuks-template zou dan ook op m²-werk vuren.
-- De template-route voor dit soort werk loopt via het AI-regelvoorstel (R2.3).
--
-- Toepassen via de SQL-editor.

insert into public.pricing
  (category, item_name, item_type, unit, is_active, ai_generated, source, valid_from, tenant_id)
values
  ('beplanting', 'Boomstronk rooien (klein)',  'arbeid', 'stuk', true, false, 'handmatig', current_date, null),
  ('beplanting', 'Boomstronk rooien (middel)', 'arbeid', 'stuk', true, false, 'handmatig', current_date, null),
  ('beplanting', 'Boomstronk rooien (groot)',  'arbeid', 'stuk', true, false, 'handmatig', current_date, null)
on conflict do nothing;

-- Controle: hoort 3 rijen te tonen, alle zonder verkoopprijs.
select item_name, unit, selling_price_default
from public.pricing
where item_name like 'Boomstronk rooien%'
order by item_name;

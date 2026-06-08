-- F4 / Deel A3: stratenmaker-prijzen seeden (idempotent, euro's, tenant_id NULL = gedeeld)
-- 2 correcties t.o.v. A3-default (Fase 0A prijsvalidatie):
--   Betonklinkers/koppelstones default €18 -> €15; Straatzand big bag default €115 -> €105.
-- cost_price = round(default * 0.80, 2). valid_from = vandaag. source = 'market_research'.

with seed(category, item_name, item_type, unit, smin, sdef, smax) as (values
  -- materiaal: bestrating
  ('bestrating_beton',   'Betonklinkers / koppelstones',        'materiaal', 'm²', 10, 15, 25),
  ('bestrating_gebakken','Gebakken klinkers waalformaat',       'materiaal', 'm²', 30, 45, 60),
  ('bestrating_gebakken','Gebakken klinkers dikformaat',        'materiaal', 'm²', 40, 55, 70),
  ('bestrating_gebakken','Waaltjes',                            'materiaal', 'm²', 20, 32, 45),
  ('bestrating_beton',   'Betonstraatstenen 30x30',             'materiaal', 'm²', 8,  14, 20),
  ('bestrating_beton',   'Flagstones beton',                    'materiaal', 'm²', 20, 30, 40),
  ('bestrating_sier',    'Sierbestrating',                      'materiaal', 'm²', 30, 45, 60),
  ('bestrating_natuur',  'Natuursteen graniet/basalt',          'materiaal', 'm²', 40, 60, 80),
  -- materiaal: fundering / zand
  ('fundering',          'Menggranulaat 0/32 incl. levering',   'materiaal', 'm³', 30, 40, 50),
  ('fundering',          'Straatzand big bag incl. levering',   'materiaal', 'm³', 95, 105, 125),
  ('fundering',          'Voegzand zak 25 kg',                  'materiaal', 'zak', 5, 7, 10),
  -- arbeid
  ('bestrating_gebakken','Legarbeid klinkers simpel (halfsteens)','arbeid', 'm²', 12, 16, 20),
  ('bestrating_gebakken','Legarbeid klinkers complex (visgraat)', 'arbeid', 'm²', 18, 24, 30),
  ('bestrating_beton',   'Legarbeid tegels / flagstones',       'arbeid', 'm²', 14, 20, 28),
  ('bestrating_sier',    'Legarbeid sierbestrating',            'arbeid', 'm²', 25, 35, 50),
  ('grondwerk',          'Afgraven + afvoeren grond',           'arbeid', 'm²', 8,  12, 18),
  ('fundering',          'Zandbed egaliseren + afreien',        'arbeid', 'm²', 3,  5,  8),
  ('fundering',          'Aantrillen',                          'arbeid', 'm²', 2,  3,  5),
  ('fundering',          'Invegen / voegen',                    'arbeid', 'm²', 2,  3,  5),
  ('opsluitwerk',        'Opsluitband stellen incl. beton',     'arbeid', 'm¹', 8,  11, 15),
  ('grondwerk',          'Afvoer puin / oud materiaal',         'arbeid', 'm²', 10, 15, 25),
  ('overig',             'Uurtarief ZZP-stratenmaker',          'arbeid', 'uur', 70, 85, 100),
  -- materieel (dagprijzen huur / stuk)
  ('materieel',          'Trilplaat huur',                      'materieel', 'dag', 20, 35, 45),
  ('materieel',          'Minigraver 1-1,7 ton huur',           'materieel', 'dag', 90, 115, 135),
  ('materieel',          'Steenknipper huur',                   'materieel', 'dag', 25, 35, 50),
  ('materieel',          'Container 10 m³',                     'materieel', 'stuk', 220, 280, 360),
  ('materieel',          'Container 6 m³',                      'materieel', 'stuk', 160, 200, 260),
  -- forfaitaire posten
  ('overig',             'Voorrijkosten',                       'arbeid', 'opdracht', 50, 75, 120),
  ('overig',             'Kolkaansluiting',                     'arbeid', 'stuk', 80, 120, 180),
  ('overig',             'Drainagegoot plaatsen',               'arbeid', 'opdracht', 150, 280, 500)
)
-- idempotent: verwijder eerdere market_research-seed van deze namen, dan opnieuw invoegen
, del as (
  delete from public.pricing p
  using seed s
  where p.source = 'market_research' and p.item_name = s.item_name
  returning 1
)
insert into public.pricing
  (category, item_name, item_type, unit, cost_price,
   selling_price_min, selling_price_default, selling_price_max,
   is_active, ai_generated, source, valid_from, tenant_id)
select s.category, s.item_name, s.item_type, s.unit,
       round(s.sdef * 0.80, 2),
       s.smin, s.sdef, s.smax,
       true, false, 'market_research', current_date, null
from seed s;

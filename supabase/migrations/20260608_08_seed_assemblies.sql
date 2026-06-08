-- F3 / Deel B3: assembly-templates seeden (idempotent)
-- Formules uit Deel A2. Variabelen: qty (m²), afgraafdiepte_cm, zanddikte_cm.
-- item_name_match koppelt aan pricing.item_name (geseed in F4).

insert into public.assemblies (name, description, trigger_category, trigger_action, unit) values
  ('bestrating_nieuw', 'Nieuwe bestrating aanleggen incl. grondwerk, zandbed, leggen, voegen, opsluiten', 'bestrating', 'nieuw,vervangen', 'm2'),
  ('herstraten', 'Bestaande bestrating opnemen, zandbed corrigeren en terugleggen (geen nieuw straatmateriaal)', 'bestrating', 'herstraten', 'm2'),
  ('grondwerk_afgraven', 'Grond afgraven en afvoeren incl. container', 'grondwerk', 'nieuw,verwijderen', 'm2'),
  ('verwijderen_bestrating', 'Bestaande bestrating opbreken en afvoeren incl. container', 'bestrating', 'verwijderen', 'm2')
on conflict (name) do nothing;

-- Schoon herseeden van componenten (idempotent)
delete from public.assembly_components
where assembly_id in (select id from public.assemblies
  where name in ('bestrating_nieuw','herstraten','grondwerk_afgraven','verwijderen_bestrating'));

-- ===== bestrating_nieuw =====
insert into public.assembly_components
  (assembly_id, item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
select a.id, v.item_name_match, v.component_type, v.quantity_formula, v.is_optional, v.flag_when_missing, v.sort_order
from public.assemblies a
cross join (values
  ('Afgraven + afvoeren grond',          'arbeid',   'qty * afgraafdiepte_cm / 100',  true,  '⚠️ Afgraafdiepte niet opgegeven — controleer voor berekening', 1),
  ('Straatzand big bag incl. levering',  'materiaal','qty * zanddikte_cm / 100 * 1.10', false, '⚠️ Zanddikte niet opgegeven — minimaal 8 cm, controleer', 2),
  ('Zandbed egaliseren + afreien',       'arbeid',   'qty * 1.0',                     false, null, 3),
  (null,                                 'materiaal','qty * 1.05',                    false, null, 4),  -- gekozen klinkers/tegels (+5% snijverlies)
  ('Legarbeid klinkers simpel (halfsteens)','arbeid','qty * 1.0',                     false, null, 5),
  ('Aantrillen',                         'arbeid',   'qty * 1.0',                     false, null, 6),
  ('Invegen / voegen',                   'arbeid',   'qty * 1.0',                     false, null, 7),
  ('Voegzand zak 25 kg',                 'materiaal','qty * 1.0',                     false, null, 8),
  (null,                                 'materiaal','(sqrt(qty) * 4) * 1.1',         false, null, 9),  -- opsluitbanden materiaal (omtrekschatting)
  ('Opsluitband stellen incl. beton',    'arbeid',   '(sqrt(qty) * 4) * 1.1',         false, null, 10)
) as v(item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
where a.name = 'bestrating_nieuw';

-- ===== herstraten (NOOIT materiaalkosten voor de stenen zelf) =====
insert into public.assembly_components
  (assembly_id, item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
select a.id, v.item_name_match, v.component_type, v.quantity_formula, v.is_optional, v.flag_when_missing, v.sort_order
from public.assemblies a
cross join (values
  ('Zandbed egaliseren + afreien',      'arbeid',   'qty * 1.0',    false, null, 1),  -- klinkers opnemen + egaliseren
  ('Straatzand big bag incl. levering', 'materiaal','qty * 0.055',  false, null, 2),  -- klein volume correctiezand
  ('Legarbeid klinkers simpel (halfsteens)','arbeid','qty * 1.0',   false, null, 3),  -- terugleggen
  ('Aantrillen',                        'arbeid',   'qty * 1.0',    false, null, 4),
  ('Invegen / voegen',                  'arbeid',   'qty * 1.0',    false, null, 5),
  ('Voegzand zak 25 kg',                'materiaal','qty * 1.0',    false, null, 6)
) as v(item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
where a.name = 'herstraten';

-- ===== grondwerk_afgraven =====
insert into public.assembly_components
  (assembly_id, item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
select a.id, v.item_name_match, v.component_type, v.quantity_formula, v.is_optional, v.flag_when_missing, v.sort_order
from public.assemblies a
cross join (values
  ('Afgraven + afvoeren grond', 'arbeid',   'qty * 1.0',                          false, null, 1),
  ('Container 10 m³',           'materieel','greatest(ceil(qty * 0.25 * 1.25 / 10), 1)', false, null, 2)
) as v(item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
where a.name = 'grondwerk_afgraven';

-- ===== verwijderen_bestrating =====
insert into public.assembly_components
  (assembly_id, item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
select a.id, v.item_name_match, v.component_type, v.quantity_formula, v.is_optional, v.flag_when_missing, v.sort_order
from public.assemblies a
cross join (values
  ('Afvoer puin / oud materiaal', 'arbeid',   'qty * 1.0',                          false, null, 1),  -- opbreken bestrating
  ('Afvoer puin / oud materiaal', 'arbeid',   'qty * 1.0',                          false, null, 2),  -- afvoer puin
  ('Container 10 m³',             'materieel','greatest(ceil(qty * 0.15 * 1.25 / 10), 1)', false, null, 3)
) as v(item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
where a.name = 'verwijderen_bestrating';

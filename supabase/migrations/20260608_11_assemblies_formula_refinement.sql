-- F5: assembly-formules consistent maken met de code-evaluator (afgeleide variabelen).
-- Reden (zie F5-IMPLEMENTATIE.md): de spec was intern inconsistent —
--   opsluitband 'sqrt(qty)*4' vs Fase 9 Test 1 exacte omtrek '(L+B)*2'.
-- Oplossing: engine levert perimeter_m (exact als L×B bekend, anders sqrt(area)*4)
--   en cunet_m3 (afgraafvolume). Formules verwijzen daarnaar. Idempotent.

delete from public.assembly_components
where assembly_id in (select id from public.assemblies
  where name in ('bestrating_nieuw','herstraten','grondwerk_afgraven','verwijderen_bestrating'));

-- bestrating_nieuw
insert into public.assembly_components
  (assembly_id, item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
select a.id, v.* from public.assemblies a
cross join (values
  ('Afgraven + afvoeren grond',           'arbeid',   'qty * 1.0',                        false, null, 1),
  ('Container 10 m³',                     'materieel','greatest(ceil(cunet_m3 * 1.25 / 10), 1)', true, '⚠️ Afgraafdiepte niet opgegeven — controleer voor berekening', 2),
  ('Straatzand big bag incl. levering',   'materiaal','qty * zanddikte_cm / 100 * 1.10',  false, '⚠️ Zanddikte niet opgegeven — minimaal 8 cm, controleer', 3),
  ('Zandbed egaliseren + afreien',        'arbeid',   'qty * 1.0',                        false, null, 4),
  (null,                                  'materiaal','qty * 1.05',                       false, null, 5),
  ('Legarbeid klinkers simpel (halfsteens)','arbeid', 'qty * 1.0',                        false, null, 6),
  ('Aantrillen',                          'arbeid',   'qty * 1.0',                        false, null, 7),
  ('Invegen / voegen',                    'arbeid',   'qty * 1.0',                        false, null, 8),
  ('Voegzand zak 25 kg',                  'materiaal','qty * 1.0',                        false, null, 9),
  (null,                                  'materiaal','perimeter_m * 1.1',                false, null, 10),
  ('Opsluitband stellen incl. beton',     'arbeid',   'perimeter_m * 1.1',                false, null, 11)
) as v(item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
where a.name = 'bestrating_nieuw';

-- herstraten (NOOIT materiaalkosten voor de stenen zelf)
insert into public.assembly_components
  (assembly_id, item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
select a.id, v.* from public.assemblies a
cross join (values
  ('Zandbed egaliseren + afreien',      'arbeid',   'qty * 1.0',    false, null, 1),
  ('Straatzand big bag incl. levering', 'materiaal','qty * 0.055',  false, null, 2),
  ('Legarbeid klinkers simpel (halfsteens)','arbeid','qty * 1.0',   false, null, 3),
  ('Aantrillen',                        'arbeid',   'qty * 1.0',    false, null, 4),
  ('Invegen / voegen',                  'arbeid',   'qty * 1.0',    false, null, 5),
  ('Voegzand zak 25 kg',                'materiaal','qty * 1.0',    false, null, 6)
) as v(item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
where a.name = 'herstraten';

-- grondwerk_afgraven
insert into public.assembly_components
  (assembly_id, item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
select a.id, v.* from public.assemblies a
cross join (values
  ('Afgraven + afvoeren grond', 'arbeid',   'qty * 1.0',                                  false, null, 1),
  ('Container 10 m³',           'materieel','greatest(ceil(cunet_m3 * 1.25 / 10), 1)',    false, '⚠️ Afgraafdiepte niet opgegeven — controleer voor berekening', 2)
) as v(item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
where a.name = 'grondwerk_afgraven';

-- verwijderen_bestrating (opbreek-volume, los van invoer-diepte)
insert into public.assembly_components
  (assembly_id, item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
select a.id, v.* from public.assemblies a
cross join (values
  ('Afvoer puin / oud materiaal', 'arbeid',   'qty * 1.0',                                false, null, 1),
  ('Afvoer puin / oud materiaal', 'arbeid',   'qty * 1.0',                                false, null, 2),
  ('Container 10 m³',             'materieel','greatest(ceil(qty * 0.15 * 1.25 / 10), 1)', false, null, 3)
) as v(item_name_match, component_type, quantity_formula, is_optional, flag_when_missing, sort_order)
where a.name = 'verwijderen_bestrating';

-- C3: labor_norms — urennormen uit de database i.p.v. hardcoded in de prompt.
--
-- De Laag 1-prompt bouwt het normenblok per aanroep uit deze tabel op; een
-- normwijziging is direct zichtbaar zonder deploy. Geen actieve normen of
-- tabel onbereikbaar = generatie geweigerd (fail hard, geen ingebakken
-- terugval). De seed hieronder reproduceert het oude hardcoded blok exact
-- (golden-test in labor-norms.test.ts bewaakt dit).
--
-- display_text: vrije weergavetekst i.p.v. "X uur per Y" (bv. de regel
-- "Grond afvoeren (met kraan): meegerekend in afgraven").
-- source: 'handmatig' nu; 'geleerd' komt pas met de learning-loop (Blok D).
--
-- RLS: alleen service-role (beheer loopt via /api/admin/labor-norms).
-- Toepassen via de SQL-editor in het Supabase-dashboard.

create table if not exists public.labor_norms (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  work_type_key  text not null unique,
  label          text not null,
  category       text not null,
  unit           text not null,
  hours_per_unit numeric(8,3),
  basis_qty      numeric(8,2) not null default 1,
  display_text   text,
  sort_order     integer not null default 0,
  source         text not null default 'handmatig'
    check (source in ('handmatig','geleerd')),
  is_active      boolean not null default true,
  -- Een norm heeft óf uren óf een vrije weergavetekst.
  check (hours_per_unit is not null or display_text is not null)
);

create index if not exists labor_norms_active_sort_idx
  on public.labor_norms (is_active, sort_order);

alter table public.labor_norms enable row level security;

-- Geen policies voor anon/authenticated: alleen de service-role (server).

-- Seed: exact de normen zoals ze tot C3 hardcoded in de prompt stonden.
insert into public.labor_norms
  (work_type_key, label, category, unit, hours_per_unit, basis_qty, display_text, sort_order)
values
  ('klinkers-herstraten',        'Klinkers herstraten',                 'Herstraten/herleggen',     'm²',    1.0,  10, null, 10),
  ('tegels-herstraten',          'Tegels herstraten',                   'Herstraten/herleggen',     'm²',    0.75, 10, null, 20),
  ('kleine-formaten-herstraten', 'Kleine formaten (mozaïek, kasseien)', 'Herstraten/herleggen',     'm²',    2.0,  10, null, 30),
  ('klinkers-nieuw',             'Klinkers nieuw leggen (incl. zandbed)','Nieuw straatwerk',        'm²',    1.5,  10, null, 40),
  ('tegels-nieuw',               'Tegels nieuw leggen (incl. zandbed)', 'Nieuw straatwerk',         'm²',    1.25, 10, null, 50),
  ('oprit-klinkers',             'Oprit klinkers aanleggen',            'Nieuw straatwerk',         'm²',    2.0,  10, null, 60),
  ('grond-afgraven',             'Grond afgraven (10-20cm)',            'Grondwerk',                'm²',    0.5,  10, null, 70),
  ('grond-afvoeren',             'Grond afvoeren (met kraan)',          'Grondwerk',                'm²',    null, 10, 'meegerekend in afgraven', 80),
  ('ophogen-zand',               'Ophogen/aanvullen zand',              'Grondwerk',                'm²',    0.5,  10, null, 90),
  ('aantrillen',                 'Aantrillen',                          'Grondwerk',                'm²',    0.3,  10, null, 100),
  ('opsluitbanden-plaatsen',     'Opsluitbanden plaatsen',              'Opsluitbanden',            'meter', 1.0,  10, null, 110),
  ('betonpalen-zetten',          'Betonpalen zetten',                   'Schutting/erfafscheiding', 'palen', 1.5,  10, null, 120),
  ('schuttingdelen-plaatsen',    'Schuttingdelen plaatsen',             'Schutting/erfafscheiding', 'meter', 0.5,  1,  null, 130),
  ('schutting-compleet',         'Schutting compleet',                  'Schutting/erfafscheiding', 'meter', 1.0,  1,  null, 140),
  ('graszoden-leggen',           'Graszoden leggen',                    'Gazon',                    'm²',    0.5,  10, null, 150),
  ('grond-voorbereiden-gazon',   'Grond voorbereiden voor gazon',       'Gazon',                    'm²',    0.75, 10, null, 160),
  ('struiken-klein',             'Struiken planten (klein)',            'Beplanting',               'stuks', 0.5,  5,  null, 170),
  ('struiken-groot',             'Struiken planten (groot)',            'Beplanting',               'stuk',  0.5,  1,  null, 180),
  ('border-aanleggen',           'Border aanleggen',                    'Beplanting',               'm²',    1.0,  5,  null, 190),
  ('composiet-vlonder',          'Composiet vlonder plaatsen',          'Vlonders',                 'm²',    1.5,  5,  null, 200),
  ('houten-vlonder',             'Houten vlonder plaatsen',             'Vlonders',                 'm²',    1.0,  5,  null, 210),
  ('fundering-vlonder',          'Fundering vlonder (steunpunten)',     'Vlonders',                 'punten',1.0,  5,  null, 220),
  ('schutting-slopen',           'Schutting slopen',                    'Demontage/verwijdering',   'meter', 0.5,  1,  null, 230),
  ('bestrating-uitbreken',       'Bestrating uitbreken + afvoeren',     'Demontage/verwijdering',   'm²',    0.5,  10, null, 240),
  ('boom-rooien-klein',          'Boom rooien (klein)',                 'Demontage/verwijdering',   'stuk',  1.0,  1,  null, 250)
on conflict (work_type_key) do nothing;

-- Controle: hoort 25 actieve normen op te leveren.
select count(*) as actieve_normen from public.labor_norms where is_active;

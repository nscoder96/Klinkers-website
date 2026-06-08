-- F4: pricing.category check uitbreiden met stratenmaker-categorieën (additief, unie met bestaand)
alter table public.pricing drop constraint if exists pricing_category_check;
alter table public.pricing add constraint pricing_category_check check (
  category = any (array[
    -- bestaand (hoveniers)
    'grondwerk','bestrating','erfafscheiding','vlonders','gazon','beplanting',
    'overkappingen','waterwerken','verlichting','overig',
    -- nieuw (stratenmaker, Fase 5)
    'fundering','bestrating_gebakken','bestrating_beton','bestrating_sier',
    'bestrating_natuur','opsluitwerk','materieel'
  ])
);

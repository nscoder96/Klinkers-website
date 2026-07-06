# UITVOERPLAN — Offertegenerator consolidatie & voorbereiding leerdata

Doel van deze slag: één pipeline, elke generatie en elke correctie gelogd, stille foutbronnen dicht. Daarna maakt de eigenaar 25 tot 40 echte offertes; die vormen de golden set en het eerste leersignaal. De learning-loop zelf wordt pas herschreven als die data bestaat.

## Werkwijze (voor Claude Code)

Werk taak voor taak, in de gegeven volgorde. Na elke taak: draai `npx vitest run`, alle tests moeten groen zijn, en maak één commit met de taaknaam. Ga nooit door naar de volgende taak als het acceptatiecriterium van de huidige niet aantoonbaar gehaald is. Verzin nooit prijzen, defaults of afmetingen; onzekerheid wordt altijd een flag. Geld blijft in centen. Verwijder oude code pas nadat de vervanging getest is.

## Invarianten (mogen nooit sneuvelen)

De AI-laag genereert nooit prijzen of hoeveelheden die niet in de notities staan. De rekenlag (assemblies, formules, pricing) bevat geen AI-beslissingen. Een offerte met blocking flags kan niet verstuurd worden. Prijzen op een offerte zijn snapshots in centen. Geen fuzzy match zonder flag.

---

## Blok A — Consolidatie (vandaag, prioriteit 1)

### Taak A1: Eén generatie-endpoint

Maak `/api/admin/quote/generate-v2` het enige generatiepad. Integreer de uren-prijsmethode uit `hours-pricing.service.ts` als volwaardige `method: "uren"` binnen de pipeline, zodat de functionaliteit van de analyze-v2 flow (uren per werkitem, dagafronding) beschikbaar is via de pipeline-config. De v2-urenschatting per werkitem wordt input voor de arbeidregels, geen parallel systeem.

Vaste werking (geen instelling): dagafronding bij methode uren gebeurt één keer over het offertetotaal — eerst alle uren van alle secties optellen, dan afronden op hele werkdagen; het verschil staat als aparte dagafrondingsregel op de laatste sectie met arbeid. En `persistQuote` berekent offerte- en sectietotalen uit dezelfde regels die als line-items opgeslagen worden, zodat het opgeslagen totaal bij elke methode exact de som van de opgeslagen regels is.

Acceptatie: de UI op `/admin/offertes/nieuw` roept alleen nog `generate-v2` aan. Een testnotitie levert via beide prijsmethodes (uitgesplitst en uren) een consistente offerte: identieke materiaalregels en flags, en totale kosten in dezelfde orde. De arbeidsregel zelf verschilt bewust qua opbouw (uren rekent via uren × tarief × dagafronding, uitgesplitst per m²) — forceer geen kunstmatige gelijkheid tussen de twee arbeidsopbouwen. Verificatie: `npx vitest run` groen plus een handmatige rooktest met drie voorbeeldnotities.

### Taak A2: Dode routes verwijderen

Verwijder `/api/admin/analyze-notes`, `/api/admin/analyze-steps`, `/api/admin/generate-quote` en de UI-splitsing tussen `offertes/nieuw` en `offertes/nieuw-v2` (één pagina blijft over). Controleer eerst met grep dat niets in `src/` er nog naar verwijst, inclusief de demo-omgeving (`src/app/demo/offerte/[id]/page.tsx` verwijst naar analyze-notes; migreer die aanroep eerst).

Acceptatie: `grep -rn "analyze-notes\|analyze-steps\|generate-quote" src/` levert nul treffers buiten eventuele migratiedocumentatie. Build slaagt: `npm run build`.

### Taak A3: Gestructureerde flag-codes

Vervang de tekstfragment-matching in `BLOCKING_FLAG_MARKERS` (quote-pipeline.service.ts) door een flag-object: `{ code, severity, message }` met codes als `MISSING_DEPTH`, `MISSING_SAND_THICKNESS`, `MISSING_PRICE`, `UNMATCHED_ACTIVITY`, `MISSING_DIMENSIONS`, `WEAK_MATERIAL_MATCH`, `DISTRIBUTION_OUT_OF_NORM` en severity `blocking | warning | info`. `hasBlockingFlags` kijkt alleen naar severity. Berichten blijven Nederlands en zijn puur presentatie.

Acceptatie: geen enkele plek in de code bepaalt blocking-gedrag op basis van een substring in een berichttekst. Bestaande tests aangepast en groen, plus nieuwe tests die per code het blocking-gedrag vastleggen.

### Taak A4: ensureLead repareren

In `generate-v2/route.ts`: vervang de `.or()` filterstring-constructie door twee losse `.eq()` queries (eerst e-mail, dan telefoon) zodat gebruikersinvoer nooit in een PostgREST-filterexpressie terechtkomt. Pas op béide matchpaden (e-mail én telefoon) een naamvergelijking toe (case-insensitief, getrimd): wijkt de naam af, maak dan een nieuwe lead aan in plaats van de offerte aan de bestaande te hangen. Een gedeeld zakelijk e-mailadres met een andere contactpersoon is hetzelfde risico als een gedeeld telefoonnummer.

Acceptatie: unittest met een e-mailadres dat een komma en haakjes bevat slaagt zonder filterfout; tests met gedeeld telefoonnummer respectievelijk gedeeld e-mailadres en een afwijkende naam maken elk een nieuwe lead.

---

## Blok B — Logging vóór de eerste echte offerte (vandaag, prioriteit 2)

Dit blok moet af voordat de 25 tot 40 offertes gemaakt worden. Zonder dit blok leveren die offertes geen leerdata en geen golden set op.

### Taak B1: Migratie `quote_generation_runs`

Nieuwe Supabase-migratie. Kolommen: `id`, `created_at`, `quote_id` (nullable, gekoppeld na persist), `notes_raw` (de letterlijke schouwnotities), `ai_output` (jsonb, volledige structured output), `model` (string), `prompt_version` (string), `confidence` (numeric), `flags` (jsonb), `config` (jsonb, de PipelineConfig), `duration_ms` (int). RLS conform de bestaande tabellen.

Acceptatie: migratie draait schoon op een verse database, `generate-v2` schrijft bij elke aanroep één rij weg (ook bij een run zonder persist), en de route faalt niet als het wegschrijven van de logrij mislukt (log-fout is niet-blokkerend, zelfde patroon als learning.service).

### Taak B2: Promptversie vastleggen

Voeg een `PROMPT_VERSION` constante toe aan `ai-understanding.service.ts` (start op `"2026-07-06.1"`), meegeschreven in elke generation run. Elke inhoudelijke promptwijziging hoogt de versie op. Pin het model expliciet en log het mee.

Acceptatie: elke rij in `quote_generation_runs` bevat model én promptversie; een test verifieert dat de constante bestaat en niet leeg is.

### Taak B3: Correcties vastleggen bij verzenden

Nieuwe migratie `quote_line_corrections`: `id`, `created_at`, `quote_id`, `generation_run_id`, `correction_type` (`line_added | line_removed | quantity_changed | price_changed | description_changed | section_changed`), `line_description`, `old_value` (jsonb), `new_value` (jsonb). Bouw in de verzendflow (`send-email` route of de plek waar de offertestatus definitief wordt) een diff tussen de oorspronkelijk gegenereerde regels (uit de generation run) en de regels op het moment van verzenden, en schrijf per verschil één rij weg.

Acceptatie: integratietest: genereer een offerte, wijzig één hoeveelheid en verwijder één regel via de bestaande edit-endpoints, verstuur, en verifieer dat er exact twee correctierijen staan met correcte old/new waardes.

---

## Blok C — Stille foutbronnen dicht (vandaag/morgen, prioriteit 3)

### Taak C1: Prijsmatching exact-of-flag

Migratie: voeg `pricing_id` (uuid, FK naar pricing) toe aan `assembly_components` en vul die voor alle geseede componenten op basis van de huidige `item_name_match`. Pas `assembly-expansion.service.ts` aan: componenten met `pricing_id` slaan de naam-matching volledig over. De substring-fallback in `findPricing` vervalt; geen match wordt `MISSING_PRICE` (blocking). Alleen de vrije materiaalvoorkeur van de klant blijft via token-overlap lopen, maar krijgt bij een zwakke match (minder dan twee overlappende significante tokens) de flag `WEAK_MATERIAL_MATCH` (warning) met de gekozen prijsregel erbij, zodat de review het ziet.

Acceptatie: test die aantoont dat "Legarbeid klinkers simpel" nooit per ongeluk "Legarbeid klinkers complex" matcht; test dat een ontbrekende pricing_id-koppeling een blocking flag geeft in plaats van een gok.

### Taak C2: Bevestigingsstap na extractie

In de UI: na de AI-analyse en vóór de prijsberekening een compacte bevestigingsweergave in gewone taal per activiteit (type, actie, afmetingen, materiaal, afgraafdiepte, zanddikte, opsluitbanden), met per activiteit de mogelijkheid om te corrigeren of te verwijderen, en een knop "Klopt, bereken". Ontbrekende verplichte waardes staan rood aangemerkt en zijn ter plekke invulbaar. Elke handmatige correctie in deze stap wordt óók als correctierij gelogd (type `extraction_corrected`, voeg toe aan het enum van B3).

Acceptatie: rooktest met een notitie waarin de afgraafdiepte ontbreekt: de stap toont het rood, invullen werkt, en de correctie staat in `quote_line_corrections`.

### Taak C3: Urennormen naar de database

Migratie `labor_norms`: `work_type_key`, `unit`, `hours_per_unit`, `basis_qty` (bv. 10 voor "per 10 m²"), `source` (`handmatig | geleerd`), `is_active`. Seed met de waardes die nu hardcoded in de v2-prompt staan. De prompt wordt dynamisch opgebouwd uit deze tabel. Simpele beheer-UI onder instellingen (hergebruik het patroon van de prijzen-pagina).

Acceptatie: een normwijziging in de database is zichtbaar in de eerstvolgende AI-aanroep zonder deploy; test op de promptbuilder die verifieert dat alle actieve normen in de prompt landen.

---

## Blok D — Na de 25 tot 40 offertes (bewust NIET nu)

Niet bouwen voordat de data er is: de herschreven learning-loop (alleen `user_adjusted` en `hours_actual`, recency-weging, outlier-filtering), het nacalculatiescherm, de prijs-per-m² sanity check (heeft historie nodig), `material_aliases` gevuld vanuit de correctiedata, en het eval-script over de golden set. De golden set zelf ontstaat vanzelf: elke rij in `quote_generation_runs` plus de bijbehorende correcties is één golden-set item (input, AI-output, gewenste output).

## Definitie van klaar voor de hele slag

Eén generatie-endpoint, nul verwijzingen naar de oude routes, alle flags op codes, elke generatie gelogd met model en promptversie, elke correctie gelogd bij bevestiging en bij verzenden, geen enkele stille prijsmatch, en `npx vitest run` plus `npm run build` groen. Daarna is elke offerte die de eigenaar maakt automatisch trainingsdata.

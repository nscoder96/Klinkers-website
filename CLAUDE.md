# Invarianten offertegenerator (nooit schenden)
- De AI-laag genereert NOOIT prijzen of hoeveelheden die niet in de notities staan.
- De rekenlag (assemblies, formules, pricing) bevat GEEN AI-beslissingen.
- Geld is altijd in centen (zie src/lib/money.ts).
- Onzekerheid wordt altijd een flag, nooit een stille default of fuzzy gok.
- Een offerte met blocking flags kan niet verstuurd worden.
- Faal hard, gok nooit.

# Werkwijze
- UITVOERPLAN.md is afgerond (2026-07-07) — de actuele stand en openstaande taken
  staan in PROJECT_STATUS.md; lees die bij sessiestart.
- Na elke taak: npx vitest run moet groen zijn, dan één commit met de taaknaam.
- Verwijder oude code pas nadat de vervanging getest is.
- Ga nooit door naar de volgende taak zonder dat het acceptatiecriterium aantoonbaar gehaald is.

# Vaste regels (na het uitvoerplan)
- Migraties: SQL-bestand in supabase/migrations/ klaarzetten; Niek voert ze ZELF uit
  via de Supabase SQL-editor. De database is productie — er is geen staging.
- Elke inhoudelijke promptwijziging: PROMPT_VERSION ophogen (ai-understanding.service.ts).
- Leerdata-tabellen (quote_generation_runs, quote_line_corrections,
  quote_flag_resolutions) zijn heilig — testrommel altijd opruimen.
- Er kunnen meerdere Claude-sessies in deze map werken: stage selectief
  (nooit `git add -A`) en let op de Next dev-lock (één dev-server per map).
- Push naar main = productie-deploy (Vercel-project klinkersenconl → www.klinkersenco.nl).

# PROJECT_STATUS — Klinkers & Co offerte-tool

**Laatste update:** 2026-07-07 (avond) · alles hieronder is live op productie (www.klinkersenco.nl)

## Waar het project staat

Het volledige UITVOERPLAN (consolidatie + leerdata) is **afgerond en live**, plus twee
bugfix-rondes (R1/R2) uit de eerste echte gebruikssessie. Elke offerte die nu gemaakt
wordt is automatisch leerdata: generation run + extractie-correcties + stap 3-correcties
+ verzend-correcties. De learning-loop zelf (Blok D) is bewust nog niet gebouwd — die
wacht op de eerste 25–40 echte offertes.

- Laatste commit: `1877208` (main). Tests: 336 groen. Migraties 14 t/m 19 zijn op
  productie toegepast.
- Prompt-versie Laag 1: `2026-07-07.2` (urennormen uit `labor_norms` + anti-dubbeltelling).

## Wat er sinds het UITVOERPLAN bij is gekomen (R1/R2, 2026-07-07)

- **Opslaan-wat-je-ziet**: "Opslaan als concept" bewaart exact de stap 3-staat
  (incl. zelfgebouwde secties/regels) en logt het verschil met de AI-generatie als
  correctierijen (`diffGeneratedVsEdited`, source_key `p-{sectie}-{regel}`).
- Stap 2 (bevestigen): omschrijving bewerkbaar, veld "Aantal (stuks)", count telt als
  geldige maat. Stap 3: sectietitels bewerkbaar, regeltype-badge klikbaar (A/M/E).
- Stuks-keten: `count` loopt door mapper → pipeline → sectietitel "(N stuks)";
  stuks-assemblies eisen een aantal (anders MISSING_DIMENSIONS).
- Prijsitems "Boomstronk rooien (klein/middel/groot)" staan zonder prijs in de
  bibliotheek → gebruik geeft blocking MISSING_PRICE tot Niek prijst (migratie 19).

## Openstaand (in volgorde)

1. **AI-regelvoorstel bij onbekend werk** — ontwerp goedgekeurd door Niek 2026-07-07:
   aparte AI-aanroep voor unmatched activiteiten; conceptregels zónder prijzen
   (→ MISSING_PRICE blijft blokkeren); nieuwe warning-flag `AI_PROPOSED_LINES` + badge;
   voorstel gelogd op de run; eigen promptversie. Eén migratie (voorstel-kolom op
   `quote_generation_runs`). UNMATCHED_ACTIVITY vervalt voor secties mét voorstel.
2. **Feedback-veldje in de editor** → `feedback_log`-tabel (quote_id, run_id, tekst) —
   Niek logt tot die tijd observaties per offertenummer in platte tekst.
3. **Uren-veld in de bevestigingsstap** (nu alleen afmetingen; bij MISSING_LABOR_NORM
   moet je terug naar stap 1 of methode wisselen).
4. **RESEND_API_KEY** in Vercel + .env.local — tot die tijd is mailen gesimuleerd
   (status/leerdata kloppen wél; klantlink `/offerte/[token]` en PDF werken volledig).
5. **Vercel opschonen**: 5 projecten hangen aan deze repo; alleen `klinkersenconl`
   serveert het domein; `klinkers-website` en `-wu41` falen al maanden op elke build.
6. **Test-Supabase** opzetten vóór er meer gebruikers komen (staat ook in
   `Klinkers & Co/memory/next-actions.md`).
7. **Blok D** (learning-loop, nacalculatie, eval) — pas ná de 25–40 offertes.

## Vaste werkafspraken (gelden altijd)

- Migraties als SQL-bestand in `supabase/migrations/`; **Niek voert ze zelf uit** via de
  Supabase SQL-editor (er is geen staging — de database is productie).
- Elke inhoudelijke promptwijziging → `PROMPT_VERSION` ophogen (ai-understanding.service).
- Leerdata-tabellen (`quote_generation_runs`, `quote_line_corrections`,
  `quote_flag_resolutions`) zijn heilig: testrommel altijd opruimen.
- Er werken soms meerdere Claude-sessies in deze map: **stage selectief** (nooit
  `git add -A`) en let op de Next dev-lock (één dev-server per map).
- Push naar `main` = productie-deploy via Vercel (project klinkersenconl).

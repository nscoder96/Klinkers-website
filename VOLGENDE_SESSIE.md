# Volgende Sessie — AI-regelvoorstel bouwen (R2.3)

**Datum opgesteld:** 2026-07-07 · zie PROJECT_STATUS.md voor de volledige stand

---

## Startbericht voor de volgende sessie

> "Lees CLAUDE.md en PROJECT_STATUS.md in klinkers-co-app. Het UITVOERPLAN en de
> rondes R1/R2 zijn af en live. Bouw nu het AI-regelvoorstel bij onbekend werk —
> het ontwerp staat onder 'Openstaand punt 1' in PROJECT_STATUS.md en is door mij
> goedgekeurd. Werkwijze zoals altijd: TDD, migratie klaarzetten (ik voer hem zelf
> uit), commit per taak, main = productie."

---

## Kern van het goedgekeurde ontwerp (R2.3)

- Alleen voor activiteiten zonder template (nu: lege sectie "handmatig opbouwen").
- Tweede AI-aanroep stelt conceptregels voor: omschrijving, type (arbeid/materiaal/
  materieel), hoeveelheid + eenheid. Hoeveelheden alleen herleidbaar uit de notitie;
  anders 1 + "controleer"-label. Geen aannames.
- **Nooit prijzen** → elke voorgestelde regel draagt automatisch blocking MISSING_PRICE.
  De rekenlaag blijft AI-vrij: het voorstel gaat niet door assemblies/prijsmatching.
- Sectie herkenbaar: nieuwe warning-flag `AI_PROPOSED_LINES` + badge in stap 3;
  UNMATCHED_ACTIVITY vervalt voor secties mét voorstel (de prijsblokkade dekt de gate).
- Voorstel gelogd op de generation run (nieuwe jsonb-kolom, migratie 20);
  eigen mini-prompt met eigen versienummer, mee-gelogd per run.
- Niek's aanpassingen op het voorstel lopen vanzelf via de bestaande stap 3-diff —
  zo groeit de correctiedata waaruit later echte templates geseed worden
  (eerste kandidaat: boomstronken rooien).

## Daarna (kleinere klussen, in volgorde)

1. Feedback-veldje in de editor (`feedback_log`-tabel: quote_id, run_id, tekst).
2. Uren-veld in de bevestigingsstap (voor MISSING_LABOR_NORM-gevallen bij methode uren).
3. Vercel opschonen: 4 overbodige projecten weg, alleen `klinkersenconl` houden.
4. RESEND_API_KEY instellen (Vercel + .env.local) zodra Niek echt wil mailen.

## Observaties uit de eerste echte offerte-sessie (nog niet opgepakt)

- AI plakte de afgraafdiepte van het bestratingswerk óók op de plantvakken-activiteit
  (onschuldig — beplanting matcht geen bestratings-template — maar ruis; kandidaat
  voor een latere promptaanscherping).
- Niek logt bevindingen per offertenummer (OFF-…) in platte tekst en plakt ze in de
  chat na elke paar offertes; format: `OFF-nummer · stap · wat je zag · wat je verwachtte`.

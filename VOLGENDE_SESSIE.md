# Volgende Sessie — AI Denkproces + Baseline Commit

**Datum opgesteld:** 2026-06-23  
**Prioriteit:** HOOG — systeem werkt bijna goed, AI-context is de laatste zwakke schakel

---

## Startbericht voor morgen

Typ dit in de chat om direct verder te gaan:

> "Ik was gisteren bezig met de Klinkers & Co offerte-tool. Lees CLAUDE.md en VOLGENDE_SESSIE.md. Alle bugfixes zijn gedaan (afgraven, zand, opsluitbanden, AI-context). Nu wil ik stap voor stap testen of het denkproces van de AI goed gaat, en daarna alles committen als nieuwe baseline."

---

## Wat al gedaan is (deze sessie)

- ✅ Afmetingen verplicht in sectietitels (`formatDimensionSuffix`, `formatSectionTitle`)
- ✅ Rode validatiebanner in Stap 2 als afmetingen ontbreken
- ✅ Afgraven: overgeslagen als `afgraafdiepte_cm` niet is opgegeven (stil, geen flag)
- ✅ Zand: overgeslagen als `zanddikte_cm` niet is opgegeven (stil, geen flag)
- ✅ Zand m³: afgerond naar halve kuip (`Math.ceil(x * 2) / 2`)
- ✅ Opsluitbanden: AI berekent `opsluiting_lengte_m` uit "links en rechts" etc.
- ✅ AI-prompt: context-koppeling — opsluitbanden bij terras horen bij terras, niet los
- ✅ Alle 234 tests groen, 0 TypeScript-fouten

---

## Wat morgen moet

### Stap 1 — Volledige testrun met de standaard testnotitie

Start de dev server als die niet draait:
```
cd klinkers-co-app && npm run dev
```

Ga naar http://localhost:3000/admin/offertes/nieuw-v2 en voer deze notitie in:

```
Oprit 6×12 m, opsluitbanden links en rechts, klinkers waalformaat antraciet.
Terras achtertuin 5×4 m herstraten, opsluitbanden rondom herstellen, ophogen 15 cm straatzand.
```

**Wat er CORRECT uit moet komen (per sectie):**

**Sectie 1: Oprit klinkers waalformaat antraciet 6×12 m (72 m²)**
- Geen afgraven (niet vermeld)
- Geen container (geen afgraafdiepte)
- Geen straatzand (geen zanddikte)
- Zandbed egaliseren ✓
- Klinkers waalformaat antraciet ✓ (72 × 1,05 = 75,6 m²)
- Legarbeid ✓
- Aantrillen, invegen, voegzand ✓
- Opsluitbanden: 2×12 + 6 = 30 m (AI berekend via `opsluiting_lengte_m`)
- Sectietitel: `Oprit klinkers waalformaat antraciet 6×12 m (72 m²)`

**Sectie 2: Terras achtertuin 5×4 m (20 m²) — herstraten**
- Geen nieuw steenmateriaal (herstraten = eigen stenen)
- Straatzand: 20 × 0,15 × 1,10 = 3,5 m³ → afgerond naar 3,5 m³ (15 cm ophogen)
- Legarbeid, aantrillen, invegen, voegzand ✓
- Opsluitbanden: omtrek (2×5 + 2×4) = 18 m (rondom)
- Sectietitel: `Terras achtertuin 5×4 m (20 m²)`

**Wat er NIET mag zijn:**
- ❌ Losse activiteit "Opsluitbanden herstellen" apart
- ❌ Afgraven in een van de secties
- ❌ Flag "Afgraafdiepte niet opgegeven" of "Zanddikte niet opgegeven"

---

### Stap 2 — Als er afwijkingen zijn

Kijk in de Stap 2-analyse welke activiteiten de AI heeft aangemaakt. Als er iets mis is:

**Mogelijke problemen en oorzaken:**

| Probleem | Oorzaak | Fix |
|----------|---------|-----|
| Opsluitbanden als losse activiteit | AI-prompt context-koppeling werkt niet volledig | Prompt aanscherpen in `ai-understanding.service.ts` |
| Afgraven verschijnt toch | Assembly-component heeft geen "afgraven" in naam → skip werkt niet | Check `isAfgraafComponent` naam-check in `assembly-expansion.service.ts` |
| Zand verschijnt toch | zanddikte_cm wordt toch ingevuld door de AI | AI-prompt aanscherpen in de Gouda-extractie-sectie |
| Opsluitbanden lengte klopt niet | AI berekent `opsluiting_lengte_m` verkeerd | Check schema-output in Stap 2 UI |

---

### Stap 3 — Git commit als nieuwe baseline

**Alleen na een succesvolle test.** Voer dan uit:

```bash
cd "/Users/niek/Desktop/Klinkers & Co/Klinkers & Co (Antrophic)"
git add -A
git status
# Check de bestanden, dan:
git commit -m "feat: afmetingen verplicht, skip-logica afgraven/zand, AI context-koppeling

- Afmetingen in sectietitels (formatDimensionSuffix + formatSectionTitle)
- Rode validatiebanner als afmetingen ontbreken in AI-analyse
- Assembly: afgraven en zand stil overgeslagen als niet vermeld
- Zand m³: afgerond naar halve kuip (ceil naar 0.5)
- AI: opsluiting_lengte_m berekend uit zijde-aanduiding (links/rechts)
- AI-prompt: context-koppeling (opsluitbanden horen bij bestratingsactiviteit)
- Alle 234 tests groen, 0 TypeScript-fouten"
```

---

### Stap 4 — Daarna verder met het offerte-proces

Na de baseline-commit zijn dit de volgende prioriteiten (in volgorde):

1. **Offerte PDF genereren** — er is al een `@react-pdf/renderer` in de stack maar dit is nog niet gebouwd voor de v2-pipeline
2. **Offerte opslaan** — de gegenereerde offerte moet in Supabase worden opgeslagen
3. **Offerte verzenden** — e-mail naar klant met link
4. **Opsluitbanden type kiezen** — 5/15 cm vs 10/20 cm instellen per sectie

---

## Technische referentie

### Kernbestanden van de v2-pipeline

| Bestand | Wat het doet |
|---------|-------------|
| `src/lib/services/ai-understanding.service.ts` | AI-prompt + Claude API call |
| `src/lib/schemas/ai-understanding.schema.ts` | Zod schema voor AI-output |
| `src/lib/assembly/assembly-expansion.service.ts` | Klapt assembly uit naar geprijsde regels |
| `src/lib/pipeline/quote-pipeline.service.ts` | Knoopt alles aan elkaar |
| `src/lib/pipeline/activity-mapper.ts` | Vertaalt AI-output naar pipeline-activiteiten |
| `src/lib/services/quote-structure.service.ts` | Sectietitels + totalen |
| `src/app/api/admin/quote/generate-v2/route.ts` | API endpoint |
| `src/app/admin/offertes/nieuw-v2/page.tsx` | UI (3 stappen) |

### Tests draaien

```bash
cd "/Users/niek/Desktop/Klinkers & Co/Klinkers & Co (Antrophic)/klinkers-co-app"
npm test
# Of specifieke test:
npx vitest run src/lib/assembly/__tests__/assembly-expansion.test.ts
```

### Dev server

```bash
cd "/Users/niek/Desktop/Klinkers & Co/Klinkers & Co (Antrophic)/klinkers-co-app"
npm run dev
# → http://localhost:3000/admin/offertes/nieuw-v2
```

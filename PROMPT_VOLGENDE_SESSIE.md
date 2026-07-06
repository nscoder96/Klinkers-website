# Prompt voor volgende Claude Code sessie

Kopieer onderstaande tekst als eerste bericht naar Claude Code.

---

We werken aan de Klinkers & Co offerte-tool (Next.js 16, TypeScript, Supabase, Tailwind v4).
Lees eerst `VOLGENDE_SESSIE.md` in de root van de app voor de volledige context.

De enige taak voor deze sessie is:

**Afmetingen verplicht in elke sectietitel van de offerte.**

Niek's eis (letterlijk): "Afmetingen zijn enorm belangrijk voor de controle van het geheel. Die moeten altijd in de titel staan. En er moet altijd worden gevraagd als die niet worden gegeven in de notitie. Er moeten altijd lengte en breedte worden gegeven."

Wat er concreet moet veranderen:

1. `src/lib/schemas/ai-understanding.schema.ts` — voeg `missing_dimensions: z.boolean()` toe aan ActivitySchema
2. `src/lib/services/ai-understanding.service.ts` — voeg een harde regel toe aan UNDERSTANDING_PROMPT: afmetingen zijn VERPLICHT voor elk bestratings-, pad-, terras-, of opritonderdeel; als ze ontbreken, zet `missing_dimensions: true`
3. `src/lib/services/quote-structure.service.ts` — sectietitels moeten altijd afmetingen bevatten in het formaat "Omschrijving — actie 5×3 m (15 m²)" of "28 m²" of "[AFMETINGEN ONTBREKEN]"
4. `src/app/admin/offertes/nieuw-v2/page.tsx` — toon een validatie-banner na de AI-analyse als één of meer activiteiten `missing_dimensions: true` hebben, zodat de gebruiker het kan corrigeren vóór hij doorgaat

Voer `/plan` uit voordat je code schrijft (meer dan 3 bestanden).
Test na implementatie met:
- Een notitie MÉT afmetingen → titels correct
- Een notitie ZONDER afmetingen → waarschuwing zichtbaar

Aanvullende context die nu al in de database staat:
- Opsluitbanden 5/15 cm (€7/m¹) zit al automatisch in de assembly voor bestrating_nieuw
- Straatzand is 'Straatzand losgestoort' @ €50/m³
- Voegzand is €20/zak, 1 zak per 5 m²

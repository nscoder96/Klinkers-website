/**
 * Activiteit-consolidatie (F5 — robuustheid op echte AI-output).
 *
 * De AI splitst een bestratingsklus in de praktijk vaak op in losse activiteiten
 * die eigenlijk ONDERDELEN van één klus zijn: "afgraven 20cm" wordt een eigen
 * grondwerk-activiteit, "opsluitbanden rondom" een eigen (oppervlakteloze)
 * bestrating-activiteit. Dat leidt tot dubbel werk, lege secties en valse
 * Gouda-vlaggen.
 *
 * Deze pure stap repareert dat vóór de assembly-firing:
 *   1. Een grondwerk/afgraven-activiteit waarvan het oppervlak overeenkomt met
 *      een bestrating-aanleg wordt erin gevouwen: de afgraafdiepte verhuist naar
 *      de bestratingsactiviteit (die assembly doet zelf het afgraven + container),
 *      en de losse grondwerk-activiteit vervalt.
 *   2. Losse component-activiteiten zonder oppervlak (opsluitbanden, aantrillen,
 *      voegen…) vervallen — ze zitten al in de bestrating-assembly.
 *
 * Idempotent op al-schone invoer (één bestratingsactiviteit, geen losse
 * grondwerk-/componentregels): dan verandert er niets.
 */

import { mapToTriggerCategory } from "../assembly/assembly-firing.service";
import type { PipelineActivity } from "./quote-pipeline.service";

const PAVING_TRIGGER = "bestrating";
const GRONDWERK_TRIGGER = "grondwerk";
const ANCHOR_ACTIONS = ["nieuw", "vervangen"];

/** Trefwoorden die wijzen op een los ONDERDEEL i.p.v. een eigen klus. */
const COMPONENT_KEYWORDS = [
  "opsluitband",
  "trottoirband",
  "aantrillen",
  "invegen",
  "inveeg",
  "voegen",
  "afreien",
  "afschot",
];

const norm = (s: string): string => s.toLowerCase();

/** Een bestrating-aanleg met oppervlak = "anchor" waar onderdelen in horen. */
function isAnchor(a: PipelineActivity): boolean {
  return (
    mapToTriggerCategory(a.type) === PAVING_TRIGGER &&
    ANCHOR_ACTIONS.includes(norm(a.action)) &&
    a.area_m2 > 0
  );
}

/** Oppervlakken matchen als ze < 1 m² óf < 5% verschillen (zelfde vlak). */
function areaMatches(a: number, b: number): boolean {
  const diff = Math.abs(a - b);
  return diff < Math.max(1, 0.05 * Math.max(a, b));
}

/**
 * Consolideert losse onderdelen in hun bestratingsactiviteit.
 *
 * @param activities - genormaliseerde activiteiten (na activity-mapper)
 * @returns nieuwe lijst; anchors kunnen een overgenomen afgraafdiepte hebben
 */
export function consolidatePavingActivities(
  activities: PipelineActivity[]
): PipelineActivity[] {
  const anchors = activities.filter(isAnchor);
  if (anchors.length === 0) return activities;

  // Werk met kopieën van de anchors zodat we onveranderlijk afgraafdiepte invullen.
  const state = new Map<PipelineActivity, PipelineActivity>(
    anchors.map((a) => [a, { ...a }])
  );
  const dropped = new Set<PipelineActivity>();

  // 1) Afgraven/grondwerk dat bij een bestrating-aanleg hoort → invouwen.
  for (const g of activities) {
    const isGrondwerk =
      mapToTriggerCategory(g.type) === GRONDWERK_TRIGGER &&
      g.area_m2 > 0 &&
      g.afgraafdiepte_cm != null;
    if (!isGrondwerk) continue;

    const match = anchors.find((a) => areaMatches(state.get(a)!.area_m2, g.area_m2));
    if (!match) continue; // los grondwerk zonder bestrating erbovenop → behouden

    const cur = state.get(match)!;
    if (cur.afgraafdiepte_cm == null) {
      state.set(match, { ...cur, afgraafdiepte_cm: g.afgraafdiepte_cm });
    }
    dropped.add(g);
  }

  // 2) Losse component-activiteiten zonder oppervlak → verwijderen.
  for (const a of activities) {
    if (dropped.has(a) || isAnchor(a)) continue;
    if (a.area_m2 > 0) continue;
    const d = norm(a.description);
    if (COMPONENT_KEYWORDS.some((k) => d.includes(k))) dropped.add(a);
  }

  return activities
    .filter((a) => !dropped.has(a))
    .map((a) => state.get(a) ?? a);
}

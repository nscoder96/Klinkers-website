/**
 * Garden Element Rules
 *
 * Hardcoded rule definitions for validating and correcting work breakdowns.
 * These encode domain knowledge about how garden elements interact:
 * - What's included in what (prevent double-counting)
 * - What conflicts with what (logical impossibilities)
 * - What requires what (missing dependencies)
 * - How quantities interact (calculation corrections)
 *
 * Source: CONFLICT_MATRIX_TUINELEMENTEN.md, TUINELEMENTEN_OPBOUW.md
 */

import {
  InclusionRule,
  ExclusionRule,
  DependencyRule,
  CalculationRule,
} from "./types";

/**
 * INCLUSIE-regels: Parent activity already contains child activity.
 * If both are present as separate items, the child should be removed.
 */
export const INCLUSION_RULES: InclusionRule[] = [
  // Ophogen & Grondwerk
  {
    id: "INC-001",
    parent_activity: "ophogen",
    included_activity: "zandbed",
    condition: "ophooghoogte >= 0.05",
    message: "Zandbed zit al in ophogen (bovenste 5cm is straatzand)",
  },
  {
    id: "INC-002",
    parent_activity: "ophogen",
    included_activity: "egaliseren",
    condition: "ophooghoogte >= 0.05",
    message: "Egaliseren is onderdeel van ophogen",
  },
  {
    id: "INC-003",
    parent_activity: "ophogen",
    included_activity: "verdichten",
    message: "Verdichten is onderdeel van ophogen (per laag)",
  },
  {
    id: "INC-004",
    parent_activity: "ophogen",
    included_activity: "teelaarde",
    condition: "ophooghoogte >= 0.10 en doel = gazon",
    message: "Teelaarde is de bovenste 12-15cm van ophogen voor gazon",
  },
  {
    id: "INC-005",
    parent_activity: "ophogen",
    included_activity: "tuinaarde",
    condition: "ophooghoogte >= 0.15 en doel = borders",
    message: "Tuinaarde is de bovenste 20cm van ophogen voor borders",
  },
  // Bestrating
  {
    id: "INC-010",
    parent_activity: "bestrating",
    included_activity: "invoegen",
    condition: "voegtype = zandvoeg",
    message: "Invoegen met straatzand is standaard inbegrepen bij bestrating leggen",
  },
  {
    id: "INC-011",
    parent_activity: "bestrating",
    included_activity: "aantrillen",
    message: "Aantrillen is standaard inbegrepen bij bestrating leggen",
  },
  {
    id: "INC-012",
    parent_activity: "bestrating",
    included_activity: "afschot",
    message: "Afschot controleren is onderdeel van het legproces",
  },
  // Gazon
  {
    id: "INC-020",
    parent_activity: "gazon",
    included_activity: "egaliseren",
    message: "Egaliseren zit in de prijs van gazon aanleggen",
  },
  {
    id: "INC-021",
    parent_activity: "gazon",
    included_activity: "aandrukken",
    message: "Aandrukken/walsen is onderdeel van gazon leggen",
  },
  {
    id: "INC-022",
    parent_activity: "gazon",
    included_activity: "frezen",
    condition: "methode = inzaaien",
    message: "Frezen zaaibed is onderdeel van gazon inzaaien",
  },
  // Erfafscheiding
  {
    id: "INC-030",
    parent_activity: "schutting",
    included_activity: "paalgaten",
    message: "Paalgaten graven zit in de prijs van schutting plaatsen",
  },
  {
    id: "INC-031",
    parent_activity: "schutting",
    included_activity: "palen stellen",
    message: "Palen stellen is onderdeel van schutting plaatsen",
  },
  {
    id: "INC-032",
    parent_activity: "schutting",
    included_activity: "schermen ophangen",
    message: "Schermen ophangen is onderdeel van schutting plaatsen",
  },
  // Beplanting
  {
    id: "INC-040",
    parent_activity: "boom planten",
    included_activity: "plantgat",
    message: "Plantgat graven zit in de prijs van boom planten",
  },
  {
    id: "INC-041",
    parent_activity: "boom planten",
    included_activity: "aanvullen",
    message: "Aanvullen met tuinaarde is onderdeel van boom planten",
  },
  {
    id: "INC-042",
    parent_activity: "haag planten",
    included_activity: "plantsleuf",
    message: "Plantsleuf graven zit in de prijs van haag planten",
  },
  {
    id: "INC-043",
    parent_activity: "haag planten",
    included_activity: "bemesting",
    message: "Startbemesting is onderdeel van haag planten",
  },
  {
    id: "INC-044",
    parent_activity: "heester planten",
    included_activity: "plantgat",
    message: "Plantgat graven zit in de prijs van heester planten",
  },
  {
    id: "INC-045",
    parent_activity: "border",
    included_activity: "grondverbetering",
    message: "Grondverbetering zit in de prijs van border aanleggen",
  },
  // Vlonders & Constructies
  {
    id: "INC-050",
    parent_activity: "vlonder",
    included_activity: "onderconstructie",
    message: "Onderconstructie is onderdeel van vlonder leggen",
  },
  {
    id: "INC-051",
    parent_activity: "vlonder",
    included_activity: "planken bevestigen",
    message: "Planken bevestigen is onderdeel van vlonder leggen",
  },
  {
    id: "INC-052",
    parent_activity: "overkapping",
    included_activity: "staanders",
    message: "Staanders monteren is onderdeel van overkapping plaatsen",
  },
  {
    id: "INC-053",
    parent_activity: "overkapping",
    included_activity: "dakconstructie",
    message: "Dakconstructie is onderdeel van overkapping plaatsen",
  },
  // Waterwerken
  {
    id: "INC-060",
    parent_activity: "drainage",
    included_activity: "sleuf graven",
    message: "Sleuf graven zit in de prijs van drainage aanleggen",
  },
  // Grondafvoer
  {
    id: "INC-070",
    parent_activity: "grondafvoer",
    included_activity: "laden",
    message: "Laden is onderdeel van grondafvoer",
  },
  {
    id: "INC-071",
    parent_activity: "grondafvoer",
    included_activity: "transport",
    message: "Transport is onderdeel van grondafvoer",
  },
  // Grind
  {
    id: "INC-080",
    parent_activity: "grind",
    included_activity: "egaliseren ondergrond",
    message: "Egaliseren ondergrond zit in grind aanbrengen",
  },
  {
    id: "INC-081",
    parent_activity: "grind",
    included_activity: "verdichten ondergrond",
    message: "Verdichten ondergrond zit in grind aanbrengen",
  },
];

/**
 * EXCLUSIE-regels: Two activities that cannot coexist in the same scope.
 * These generate warnings when both are detected.
 */
export const EXCLUSION_RULES: ExclusionRule[] = [
  // Absolute exclusions - surface types
  {
    id: "EXC-001",
    activity_a: "bestrating",
    activity_b: "gazon",
    scope: "zelfde_oppervlak",
    type: "absoluut",
    message: "Bestrating en gazon kunnen niet op hetzelfde oppervlak",
  },
  {
    id: "EXC-002",
    activity_a: "bestrating",
    activity_b: "vlonder",
    scope: "zelfde_oppervlak",
    type: "absoluut",
    message: "Bestrating en vlonder kunnen niet op hetzelfde oppervlak",
  },
  {
    id: "EXC-003",
    activity_a: "bestrating",
    activity_b: "grind",
    scope: "zelfde_oppervlak",
    type: "absoluut",
    message: "Bestrating en grind kunnen niet op hetzelfde oppervlak",
  },
  {
    id: "EXC-004",
    activity_a: "gazon",
    activity_b: "vlonder",
    scope: "zelfde_oppervlak",
    type: "absoluut",
    message: "Gazon en vlonder kunnen niet op hetzelfde oppervlak",
  },
  {
    id: "EXC-005",
    activity_a: "gazon",
    activity_b: "grind",
    scope: "zelfde_oppervlak",
    type: "absoluut",
    message: "Gazon en grind kunnen niet op hetzelfde oppervlak",
  },
  {
    id: "EXC-006",
    activity_a: "vlonder",
    activity_b: "grind",
    scope: "zelfde_oppervlak",
    type: "absoluut",
    message: "Vlonder en grind kunnen niet op hetzelfde oppervlak",
  },
  {
    id: "EXC-007",
    activity_a: "bestrating",
    activity_b: "vijver",
    scope: "zelfde_oppervlak",
    type: "absoluut",
    message: "Bestrating en vijver kunnen niet op hetzelfde oppervlak",
  },
  {
    id: "EXC-008",
    activity_a: "gazon",
    activity_b: "vijver",
    scope: "zelfde_oppervlak",
    type: "absoluut",
    message: "Gazon en vijver kunnen niet op hetzelfde oppervlak",
  },
  {
    id: "EXC-009",
    activity_a: "gazon",
    activity_b: "kunstgras",
    scope: "zelfde_oppervlak",
    type: "absoluut",
    message: "Echt gazon en kunstgras kunnen niet op hetzelfde oppervlak",
  },
  // Line-based exclusions
  {
    id: "EXC-020",
    activity_a: "schutting",
    activity_b: "schutting",
    scope: "zelfde_lijn",
    type: "absoluut",
    message: "Niet twee schuttingen op dezelfde lijn",
  },
  {
    id: "EXC-021",
    activity_a: "haag",
    activity_b: "haag",
    scope: "zelfde_lijn",
    type: "absoluut",
    message: "Niet twee hagen op dezelfde lijn",
  },
  // Location-based exclusions
  {
    id: "EXC-030",
    activity_a: "tuinhuis",
    activity_b: "overkapping",
    scope: "zelfde_locatie",
    type: "absoluut",
    message: "Tuinhuis en overkapping kunnen niet op exact dezelfde locatie",
  },
  // Conditional exclusions
  {
    id: "EXC-040",
    activity_a: "schutting",
    activity_b: "haag",
    scope: "zelfde_lijn",
    type: "conditioneel",
    message: "Schutting en haag op dezelfde lijn is ongebruikelijk (haag kan VOOR schutting)",
  },
];

/**
 * AFHANKELIJKHEIDS-regels: Activity A requires activity B.
 * When auto_add is true, B will be automatically added if missing.
 */
export const DEPENDENCY_RULES: DependencyRule[] = [
  // Bestrating dependencies
  {
    id: "DEP-001",
    activity: "bestrating",
    requires: "opsluitbanden",
    requires_category: "bestrating",
    requires_line_type: "materiaal",
    requires_unit: "meter",
    condition: "TENZIJ aansluitend_muur_of_schutting",
    auto_add: true,
    message: "Bestrating vereist opsluitbanden (tenzij muur/schutting als rand dient)",
  },
  {
    id: "DEP-002",
    activity: "grind",
    requires: "worteldoek",
    requires_category: "bestrating",
    requires_line_type: "materiaal",
    requires_unit: "m2",
    auto_add: true,
    message: "Grind/split vereist worteldoek eronder",
  },
  {
    id: "DEP-003",
    activity: "grind",
    requires: "randafwerking",
    requires_category: "bestrating",
    requires_line_type: "materiaal",
    requires_unit: "meter",
    auto_add: true,
    message: "Grind moet begrensd worden met randafwerking",
  },
  // Overkapping/constructie dependencies
  {
    id: "DEP-010",
    activity: "overkapping",
    requires: "poeren",
    requires_category: "overkappingen",
    requires_line_type: "materiaal",
    requires_unit: "stuk",
    auto_add: true,
    message: "Overkapping vereist fundering (poeren)",
  },
  {
    id: "DEP-011",
    activity: "overkapping",
    requires: "hemelwaterafvoer",
    requires_category: "overkappingen",
    requires_line_type: "materiaal",
    requires_unit: "stuk",
    auto_add: true,
    message: "Overkapping vereist hemelwaterafvoer (goot + pijp)",
  },
  {
    id: "DEP-012",
    activity: "pergola",
    requires: "poeren",
    requires_category: "overkappingen",
    requires_line_type: "materiaal",
    requires_unit: "stuk",
    auto_add: true,
    message: "Pergola vereist fundering (poeren)",
  },
  {
    id: "DEP-013",
    activity: "vlonder",
    requires: "poeren",
    requires_category: "vlonders",
    requires_line_type: "materiaal",
    requires_unit: "stuk",
    auto_add: true,
    message: "Vlonder vereist fundering (betonpoeren of terrasdragers)",
  },
  {
    id: "DEP-014",
    activity: "tuinhuis",
    requires: "fundering",
    requires_category: "overkappingen",
    requires_line_type: "materiaal",
    requires_unit: "stuk",
    auto_add: true,
    message: "Tuinhuis vereist fundering (betonplaten of gestort)",
  },
  {
    id: "DEP-015",
    activity: "carport",
    requires: "poeren",
    requires_category: "overkappingen",
    requires_line_type: "materiaal",
    requires_unit: "stuk",
    auto_add: true,
    message: "Carport vereist fundering (poeren)",
  },
  // Beplanting dependencies
  {
    id: "DEP-020",
    activity: "klimplant",
    requires: "klimsteun",
    requires_category: "beplanting",
    requires_line_type: "materiaal",
    requires_unit: "stuk",
    auto_add: true,
    message: "Klimplant vereist klimsteun/trellis",
  },
  {
    id: "DEP-021",
    activity: "leiboom",
    requires: "leiframe",
    requires_category: "beplanting",
    requires_line_type: "materiaal",
    requires_unit: "stuk",
    auto_add: true,
    message: "Leiboom vereist leiframe/draden",
  },
  // Waterwerken dependencies
  {
    id: "DEP-030",
    activity: "vijver",
    requires: "vijvervlies",
    requires_category: "waterwerken",
    requires_line_type: "materiaal",
    requires_unit: "m2",
    condition: "type = folie",
    auto_add: true,
    message: "Folievijver vereist vijvervlies onder de folie",
  },
  {
    id: "DEP-031",
    activity: "drainage",
    requires: "afvoerpunt",
    requires_category: "waterwerken",
    requires_line_type: "materiaal",
    requires_unit: "stuk",
    auto_add: true,
    message: "Drainage vereist een afvoerpunt (infiltratiekrat of aansluiting)",
  },
  // Erfafscheiding dependencies
  {
    id: "DEP-040",
    activity: "schutting",
    requires: "betonplaat",
    requires_category: "erfafscheiding",
    requires_line_type: "materiaal",
    requires_unit: "stuk",
    condition: "type = beton",
    auto_add: false,
    message: "Betonschutting vereist betononderplaat (beschermt hout tegen vocht)",
  },
];

/**
 * BEREKENING-regels: How quantities interact between activities.
 * These correct volumes/quantities when activities combine.
 */
export const CALCULATION_RULES: CalculationRule[] = [
  {
    id: "CALC-001",
    trigger: "ophogen + bestrating",
    formula: "ophoogzand = (ophooghoogte - 0.05) * oppervlak",
    affects: "ophoogzand_volume",
    message: "Ophoogzand gecorrigeerd: bovenste 5cm is straatzand (zandbed)",
  },
  {
    id: "CALC-002",
    trigger: "ophogen + gazon",
    formula: "ophoogzand = max(0, (ophooghoogte - 0.12)) * oppervlak",
    affects: "ophoogzand_volume",
    message: "Ophoogzand gecorrigeerd: bovenste 12cm is teelaarde",
  },
  {
    id: "CALC-003",
    trigger: "ophogen + borders",
    formula: "ophoogzand = max(0, (ophooghoogte - 0.20)) * oppervlak",
    affects: "ophoogzand_volume",
    message: "Ophoogzand gecorrigeerd: bovenste 20cm is tuinaarde",
  },
  {
    id: "CALC-004",
    trigger: "ontgraven + afvoer",
    formula: "afvoer_volume = ontgraaf_volume * 1.3",
    affects: "grondafvoer_volume",
    message: "Grondafvoer gecorrigeerd met uitzettingsfactor 1.3 (grond zet 30% uit)",
  },
  {
    id: "CALC-005",
    trigger: "ophogen + fundering",
    formula: "ophoogzand = max(0, (ophooghoogte - funderings_dikte - 0.05)) * oppervlak",
    affects: "ophoogzand_volume",
    message: "Ophoogzand gecorrigeerd: fundering vervangt deel van ophogen",
  },
];

/**
 * TOP-20 kernregels voor AI prompt verrijking.
 * These are the most impactful rules that the AI should already know about
 * during initial analysis to produce better output.
 */
export const TOP_20_RULES_FOR_PROMPT = `
## Kernregels voor offerte-validatie (TOP 20)

1. Ophogen BEVAT zandbed - Nooit apart berekenen bij ophogen >=5cm
2. Ophogen BEVAT egaliseren - Nooit apart berekenen bij ophogen
3. Ophogen voor gazon BEVAT teelaarde - Bovenste 12cm IS teelaarde
4. Gazon aanleggen BEVAT egaliseren - Staat in de prijs
5. Bestrating BEVAT invoegen (zandvoeg) - Standaard inbegrepen
6. Schutting plaatsen BEVAT paalgaten - Standaard inbegrepen
7. Boom planten BEVAT plantgat - Standaard inbegrepen
8. Bestrating VEREIST opsluitbanden - Tenzij muur/schutting als rand
9. Oprit VEREIST fundering (puingranulaat) - Altijd
10. Overkapping VEREIST poeren (fundering) - Altijd bij vrijstaand
11. Overkapping VEREIST hemelwaterafvoer - Water moet ergens heen
12. Vlonder VEREIST fundering (poeren) - Balken mogen niet op grond
13. Grond weg = 1x afvoer - NIET dubbel berekenen bij meerdere grondwerken
14. Grond uitzet 30% - Bij afvoer-volume berekening
15. Opsluitband: trek muur/schutting-zijden af - Niet rondom als rand er al is
16. Fundering VERVANGT deel ophogen - Niet optellen
17. Vlonder IS het terras - Geen bestrating eronder
18. Grind VEREIST worteldoek - Standaard erbij
19. Klimplant VEREIST klimsteun - Altijd meenemen
20. Haag planten BEVAT plantsleuf - Standaard inbegrepen

## Conflictregels
- Bestrating + gazon op zelfde m2 = ONMOGELIJK
- Bestrating + vlonder op zelfde m2 = ONMOGELIJK
- Gazon + grind op zelfde m2 = ONMOGELIJK
- 2x schutting op zelfde lijn = ONMOGELIJK
- Vlonder + bestrating eronder = FOUT (vlonder IS het terras)
`.trim();

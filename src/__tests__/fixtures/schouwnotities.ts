/**
 * Test Fixtures for Schouwnotities
 *
 * Comprehensive examples covering all categories, dimensions, and actions
 * for testing the AI Understanding layer.
 */

/**
 * DIMENSION_EXAMPLES
 *
 * Tests for different dimension patterns found in Dutch schouwnotities.
 * Covers area (m2), linear (meters), count, cubic, and approximate patterns.
 */
export const DIMENSION_EXAMPLES = {
  /** Area with m2 notation */
  area_m2: "Terras 40m2",

  /** Area with Dutch comma decimal notation */
  area_comma: "Tuin 15,5m2",

  /** Length × Width with 'x' notation */
  length_width: "Voortuin 8x12m",

  /** Length × Width with Dutch 'bij' word */
  length_bij: "Tuin 8 bij 12 meter",

  /** Linear meters (standard notation) */
  linear_meters: "Schutting 20 meter",

  /** Linear with 'strekkende meter' (Dutch landscaping term) */
  linear_strekkende: "Opsluitbanden 25 strekkende meter",

  /** Count with number */
  count_number: "3 bomen planten",

  /** Count with Dutch word (tests word-to-number parsing) */
  count_word: "vijf struiken",

  /** Cubic meters (volume) */
  cubic: "5m3 grond afvoeren",

  /** Approximate range with tilde */
  approximate: "Ongeveer 35-40m2",

  /** Range with 'tussen de' phrase */
  range: "Tussen de 30 en 35 meter",
} as const;

/**
 * CATEGORY_EXAMPLES
 *
 * Example text for each of the 10 work categories.
 * Tests category detection and classification.
 */
export const CATEGORY_EXAMPLES = {
  /** Grondwerk - Excavation, soil work, leveling */
  grondwerk: "Grond afgraven 20cm diep, 50m2",

  /** Bestrating - Paving, tiles, klinkers */
  bestrating: "Terras 40m2 tegels leggen",

  /** Erfafscheiding - Fencing, hedges, boundaries */
  erfafscheiding: "Schutting 12m vervangen",

  /** Vlonders - Decking, wooden platforms */
  vlonders: "Houten vlonder 3x4m",

  /** Gazon - Lawn work, grass */
  gazon: "Gazon 50m2 aanleggen met graszoden",

  /** Beplanting - Planting, gardens, shrubs */
  beplanting: "Haag planten 15 meter, 3 sierbomen",

  /** Overkappingen - Pergolas, carports, roofing */
  overkappingen: "Pergola 4x3m plaatsen",

  /** Waterwerken - Ponds, drainage, irrigation */
  waterwerken: "Vijver aanleggen 2x3m",

  /** Verlichting - Lighting installation */
  verlichting: "Tuinverlichting 8 spots plaatsen",

  /** Overig - Other/miscellaneous */
  overig: "Tuinmeubilair leveren en plaatsen",
} as const;

/**
 * ACTION_EXAMPLES
 *
 * Example text for each of the 5 action types.
 * Tests action detection and classification.
 */
export const ACTION_EXAMPLES = {
  /** Nieuw - New installation */
  nieuw: "Nieuwe klinkers leggen 30m2",

  /** Herstraten - Re-laying existing materials (no new materials needed) */
  herstraten: "Bestaande tegels opnieuw leggen 40m2",

  /** Vervangen - Replace old with new */
  vervangen: "Oude schutting eruit, nieuwe erin 15m",

  /** Verwijderen - Removal only */
  verwijderen: "Schutting afbreken en afvoeren 10m",

  /** Repareren - Repair existing (minimal materials) */
  repareren: "Schutting repareren, losse planken vervangen",
} as const;

/**
 * FULL_SCHOUWNOTITIE_EXAMPLES
 *
 * Complete multi-category schouwnotities examples.
 * Tests end-to-end AI Understanding parsing.
 */
export const FULL_SCHOUWNOTITIE_EXAMPLES = [
  {
    name: "Simple - Single category terras",
    text: `
Schouwing tuin familie Jansen
Adres: Dorpsstraat 12, Houten

Achturtuin:
- Bestaand terras 6x4m is versleten
- Nieuwe klinkers leggen, antraciet
- Fundering controleren, eventueel herstellen
- Opsluitbanden plaatsen rondom terras (20 meter)
    `,
    expectedCategories: ["bestrating"],
    expectedActions: ["nieuw"],
    expectedDimensions: {
      area: 24, // 6x4
      length: 20, // opsluitbanden
    },
  },
  {
    name: "Medium - Terras + Schutting (2 categories)",
    text: `
Offerte aanvraag Familie de Vries
Locatie: Tuinlaan 45, Utrecht

Werkzaamheden:
1. Terras achtertuin
   - 40m2 keramische tegels leggen
   - Fundering: 20cm zand, 20cm puin
   - Afschot naar tuin

2. Schutting zijtuin
   - Bestaande schutting 15m vervangen
   - Nieuwe 21-planks schutting 180cm hoog
   - Betonpalen plaatsen
    `,
    expectedCategories: ["bestrating", "erfafscheiding"],
    expectedActions: ["nieuw", "vervangen"],
    expectedDimensions: {
      area: 40,
      length: 15,
      height: 1.8,
    },
  },
  {
    name: "Complex - Full renovation (5+ categories)",
    text: `
Complete tuinrenovatie Familie Bakker
Adres: Hoofdstraat 78, Nieuwegein

Voortuin:
- Bestaande bestrating verwijderen en afvoeren (25m2)
- Grond afgraven 30cm diep voor nieuwe fundering
- Oprit 18m2 nieuwe betonklinkers grijs
- Borders 12 meter met opsluitbanden
- Haag planten langs straatkant (8 meter, 16 planten)

Achtertuin:
- Terras 35m2 keramische tegels
- Gazon aanleggen 60m2 met graszoden
- 3 sierbomen planten
- Vijver aanleggen 2x3m met vijverfolie
- Tuinverlichting: 6 spots langs pad, 2 spots bij terras
- Pergola plaatsen 3x4m

Afvoer:
- 8m3 puin afvoeren
    `,
    expectedCategories: [
      "bestrating",
      "grondwerk",
      "beplanting",
      "gazon",
      "waterwerken",
      "verlichting",
      "overkappingen",
    ],
    expectedActions: ["nieuw", "verwijderen"],
    expectedDimensions: {
      area: 53, // 18 + 35
      length: 20, // 12 + 8
      count: 19, // 16 + 3
    },
  },
  {
    name: "Herstraten - Re-laying work (arbeid only, no materials)",
    text: `
Herstraten oprit Familie Hendriks
Locatie: Parallelweg 23, Houten

Werkzaamheden:
- Bestaande klinkers oprit opnemen (30m2)
- Zandbed vernieuwen en verdichten
- Klinkers herstraten (zelfde klinkers gebruiken)
- Voegen met zand

Materialen:
- Klant heeft eigen klinkers (hergebruik)
- Alleen zand en voegzand leveren
    `,
    expectedCategories: ["bestrating"],
    expectedActions: ["herstraten"],
    expectedDimensions: {
      area: 30,
    },
    expectedMaterialsBehavior: "arbeid-heavy", // Mostly labor, minimal materials
  },
  {
    name: "Mixed - Combination herstraten + nieuw",
    text: `
Tuin renovatie deels Familie Peters
Adres: Kerkstraat 56, De Meern

Terras:
- Bestaand terras 20m2 herstraten (tegels hergebruiken)
- Uitbreiding terras 15m2 met nieuwe tegels (zelfde soort)

Borders:
- Bestaande borders 10m repareren (losse stenen terug)
- Nieuwe borders 8m aanleggen

Opsluitbanden:
- Bestaande banden 12m vervangen
    `,
    expectedCategories: ["bestrating"],
    expectedActions: ["herstraten", "nieuw", "repareren", "vervangen"],
    expectedDimensions: {
      area: 35, // 20 + 15
      length: 30, // 10 + 8 + 12
    },
    expectedMaterialsBehavior: "mixed", // Some herstraten (arbeid), some nieuw (materials)
  },
];

/**
 * Type exports for type safety in tests
 */
export type DimensionExampleKey = keyof typeof DIMENSION_EXAMPLES;
export type CategoryExampleKey = keyof typeof CATEGORY_EXAMPLES;
export type ActionExampleKey = keyof typeof ACTION_EXAMPLES;
export type FullSchouwnotitieExample = (typeof FULL_SCHOUWNOTITIE_EXAMPLES)[number];

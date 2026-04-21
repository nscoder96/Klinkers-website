export type PatroonType = 'recht' | 'halfsteens' | 'visgraat' | 'rond';
export type GrondtypeType = 'zand' | 'klei' | 'veen';
export type BereikbaarheidType = 'goed' | 'matig' | 'slecht';

export const SNIJVERLIES: Record<PatroonType, number> = {
  recht: 0.06,
  halfsteens: 0.06,
  visgraat: 0.12,
  rond: 0.20,
};

export const FUNDERINGSDIEPTE: Record<GrondtypeType, number> = {
  zand: 0.15,
  klei: 0.35,
  veen: 0.40,
};

const VERDICHTINGSFACTOR = 1.25;
const ZWELFACTOR = 1.25;
const OPSLUITBANDEN_VERLIES = 1.05;

const ARBEIDSFACTOR: Record<PatroonType, number> = {
  recht: 1.0,
  halfsteens: 1.0,
  visgraat: 1.3,
  rond: 1.4,
};

const BEREIKBAARHEIDSFACTOR: Record<BereikbaarheidType, number> = {
  goed: 1.0,
  matig: 1.2,
  slecht: 1.35,
};

export function berekenSnijverlies(areaNetto: number, patroon: PatroonType): number {
  return areaNetto * (1 + SNIJVERLIES[patroon]);
}

export function berekenFunderingVolume(area: number, grondtype: GrondtypeType): number {
  const diepte = FUNDERINGSDIEPTE[grondtype];
  return area * diepte * VERDICHTINGSFACTOR;
}

export function berekenGrondafvoer(area: number, diepteTotaal: number): number {
  return area * diepteTotaal * ZWELFACTOR;
}

export function berekenArbeidsfactor(patroon: PatroonType): number {
  return ARBEIDSFACTOR[patroon];
}

export function berekenBereikbaarheidsfactor(bereikbaarheid: BereikbaarheidType): number {
  return BEREIKBAARHEIDSFACTOR[bereikbaarheid];
}

export function berekenOpsluitbanden(lengte: number, breedte: number): number {
  const omtrek = 2 * (lengte + breedte);
  return omtrek * OPSLUITBANDEN_VERLIES;
}

export function genereerNormenTekst(
  patroon: PatroonType,
  grondtype: GrondtypeType,
  bereikbaarheid: BereikbaarheidType
): string {
  const snijverliesPercent = Math.round(SNIJVERLIES[patroon] * 100);
  const funderingsCm = Math.round(FUNDERINGSDIEPTE[grondtype] * 100);
  const arbeidsfactor = ARBEIDSFACTOR[patroon];
  const bereikbaarheidsfactor = BEREIKBAARHEIDSFACTOR[bereikbaarheid];

  return `
CONTEXT VAN DEZE KLUS:
- Patroon: ${patroon} → snijverlies: +${snijverliesPercent}% op m² bestrating (bestelvolume = m² × ${1 + SNIJVERLIES[patroon]})
- Grondtype: ${grondtype} → funderingsdiepte: ${funderingsCm}cm (i.p.v. standaard 15cm)
- Bereikbaarheid: ${bereikbaarheid} → arbeidsfactor: ×${bereikbaarheidsfactor} op alle arbeidsuren
- Arbeidsfactor patroon: ×${arbeidsfactor} op legwerk (visgraat is langzamer dan recht)

BEREKENNORMEN (verplicht toepassen):
- Snijverlies bestrating: m² × ${(1 + SNIJVERLIES[patroon]).toFixed(2)} = bestelvolume
- Fundering puingranulaat: m² × ${FUNDERINGSDIEPTE[grondtype]}m × ${VERDICHTINGSFACTOR} (verdichting) = m³ bestellen
- Grondafvoer: m² × (funderingsdiepte + zandbed + steendikte) × ${ZWELFACTOR} (zwelling) = m³
- Opsluitbanden: 2 × (lengte + breedte) × ${OPSLUITBANDEN_VERLIES} = strekkende meters
- Zandbed: m² × 0.05m = m³
- Arbeid leggen: basistijd × ${arbeidsfactor} (patroon) × ${bereikbaarheidsfactor} (bereikbaarheid)
`;
}

/**
 * Quote Calculator - Berekent automatisch materialen en arbeid
 * op basis van werkzaamheden en variabelen.
 */

export interface QuoteItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
  isAutoCalculated: boolean;
}

export interface QuoteSection {
  name: string;
  items: QuoteItem[];
  subtotal: number;
}

export interface AnalyzedWork {
  type: 'sloopwerk' | 'bestrating' | 'schutting' | 'grondwerk' | 'beplanting' | 'overig';
  description: string;
  variables: Record<string, number | string | boolean>;
}

export interface QuoteCalculationInput {
  werkzaamheden: AnalyzedWork[];
  answers: Record<string, number | string | boolean>;
}

// Standaard prijzen (kunnen later uit database komen)
const PRIJZEN = {
  // Sloopwerk
  sloop_tegels_m2: 12,
  sloop_schutting_m: 8,
  sloop_boom_stuk: 185,
  sloop_stronk_frezen: 100,
  puinafvoer_m3: 45,

  // Bestrating
  straten_arbeid_m2: 18,
  stratzand_m3: 45,
  inveegzand_m2: 0.75,
  opsluitbanden_m: 22,
  opsluitbanden_arbeid_m: 8,

  // Schutting
  schuttingdeel_180: 45,
  schuttingdeel_200: 55,
  paal_hardhout: 55,
  lbeslag_set: 10,
  snelbeton_zak: 6.50,
  poortdeur: 185,
  poortbeslag: 45,
  schutting_arbeid_sectie: 35,

  // Grondwerk
  grondafvoer_m3: 35,
  ophoogzand_m3: 40,
};

/**
 * Bereken sloopwerk items
 */
function berekenSloopwerk(work: AnalyzedWork, answers: Record<string, any>): QuoteItem[] {
  const items: QuoteItem[] = [];
  const vars = { ...work.variables, ...answers };

  // Tegels verwijderen
  if (vars.tegels_m2 && Number(vars.tegels_m2) > 0) {
    const m2 = Number(vars.tegels_m2);
    items.push({
      description: 'Bestaande tegels verwijderen',
      quantity: m2,
      unit: 'm²',
      unitPrice: PRIJZEN.sloop_tegels_m2,
      total: m2 * PRIJZEN.sloop_tegels_m2,
      category: 'sloopwerk',
      isAutoCalculated: true,
    });
  }

  // Schutting verwijderen
  if (vars.schutting_verwijderen_m && Number(vars.schutting_verwijderen_m) > 0) {
    const m = Number(vars.schutting_verwijderen_m);
    items.push({
      description: 'Oude schutting verwijderen',
      quantity: m,
      unit: 'm',
      unitPrice: PRIJZEN.sloop_schutting_m,
      total: m * PRIJZEN.sloop_schutting_m,
      category: 'sloopwerk',
      isAutoCalculated: true,
    });
  }

  // Boom verwijderen
  if (vars.bomen_verwijderen && Number(vars.bomen_verwijderen) > 0) {
    const aantal = Number(vars.bomen_verwijderen);
    items.push({
      description: 'Boom verwijderen',
      quantity: aantal,
      unit: 'stuk',
      unitPrice: PRIJZEN.sloop_boom_stuk,
      total: aantal * PRIJZEN.sloop_boom_stuk,
      category: 'sloopwerk',
      isAutoCalculated: true,
    });

    // Stronk frezen indien ja
    if (vars.stronk_frezen === true || vars.stronk_frezen === 'ja') {
      items.push({
        description: 'Boomstronk frezen',
        quantity: aantal,
        unit: 'stuk',
        unitPrice: PRIJZEN.sloop_stronk_frezen,
        total: aantal * PRIJZEN.sloop_stronk_frezen,
        category: 'sloopwerk',
        isAutoCalculated: true,
      });
    }
  }

  // Puinafvoer
  if (vars.puin_afvoeren === true || vars.puin_afvoeren === 'ja') {
    // Schat puin: tegels = 0.08m³ per m², schutting = 0.1m³ per m
    let puinM3 = 0;
    if (vars.tegels_m2) puinM3 += Number(vars.tegels_m2) * 0.08;
    if (vars.schutting_verwijderen_m) puinM3 += Number(vars.schutting_verwijderen_m) * 0.1;
    puinM3 = Math.ceil(puinM3);

    if (puinM3 > 0) {
      items.push({
        description: 'Puinafvoer',
        quantity: puinM3,
        unit: 'm³',
        unitPrice: PRIJZEN.puinafvoer_m3,
        total: puinM3 * PRIJZEN.puinafvoer_m3,
        category: 'sloopwerk',
        isAutoCalculated: true,
      });
    }
  }

  return items;
}

/**
 * Bereken bestrating items
 */
function berekenBestrating(work: AnalyzedWork, answers: Record<string, any>): QuoteItem[] {
  const items: QuoteItem[] = [];
  const vars = { ...work.variables, ...answers };

  const m2 = Number(vars.oppervlakte_m2) || 0;
  if (m2 <= 0) return items;

  // Tegels/klinkers (als wij leveren)
  if (vars.materiaal_type && vars.materiaal_prijs_m2) {
    items.push({
      description: `${vars.materiaal_type}`,
      quantity: m2,
      unit: 'm²',
      unitPrice: Number(vars.materiaal_prijs_m2),
      total: m2 * Number(vars.materiaal_prijs_m2),
      category: 'bestrating',
      isAutoCalculated: true,
    });
  }

  // Straten arbeid
  items.push({
    description: 'Straten arbeid',
    quantity: m2,
    unit: 'm²',
    unitPrice: PRIJZEN.straten_arbeid_m2,
    total: m2 * PRIJZEN.straten_arbeid_m2,
    category: 'bestrating',
    isAutoCalculated: true,
  });

  // Stratzand (0.05 m³ per m²)
  const zandM3 = Math.ceil(m2 * 0.05 * 10) / 10; // 1 decimaal
  items.push({
    description: 'Stratzand',
    quantity: zandM3,
    unit: 'm³',
    unitPrice: PRIJZEN.stratzand_m3,
    total: zandM3 * PRIJZEN.stratzand_m3,
    category: 'bestrating',
    isAutoCalculated: true,
  });

  // Inveegzand
  items.push({
    description: 'Inveegzand',
    quantity: m2,
    unit: 'm²',
    unitPrice: PRIJZEN.inveegzand_m2,
    total: m2 * PRIJZEN.inveegzand_m2,
    category: 'bestrating',
    isAutoCalculated: true,
  });

  // Opsluitbanden
  if (vars.opsluitbanden_m && Number(vars.opsluitbanden_m) > 0) {
    const opsluitM = Number(vars.opsluitbanden_m);
    items.push({
      description: 'Opsluitbanden',
      quantity: opsluitM,
      unit: 'm¹',
      unitPrice: PRIJZEN.opsluitbanden_m,
      total: opsluitM * PRIJZEN.opsluitbanden_m,
      category: 'bestrating',
      isAutoCalculated: true,
    });
    items.push({
      description: 'Opsluitbanden zetten',
      quantity: opsluitM,
      unit: 'm¹',
      unitPrice: PRIJZEN.opsluitbanden_arbeid_m,
      total: opsluitM * PRIJZEN.opsluitbanden_arbeid_m,
      category: 'bestrating',
      isAutoCalculated: true,
    });
  }

  // Grondafvoer
  if (vars.grond_afvoeren === true || vars.grond_afvoeren === 'ja') {
    const diepte = Number(vars.afgraaf_diepte_cm) || 30;
    const grondM3 = Math.ceil(m2 * (diepte / 100) * 10) / 10;
    items.push({
      description: 'Grondafvoer',
      quantity: grondM3,
      unit: 'm³',
      unitPrice: PRIJZEN.grondafvoer_m3,
      total: grondM3 * PRIJZEN.grondafvoer_m3,
      category: 'bestrating',
      isAutoCalculated: true,
    });
  }

  return items;
}

/**
 * Bereken schutting items
 */
function berekenSchutting(work: AnalyzedWork, answers: Record<string, any>): QuoteItem[] {
  const items: QuoteItem[] = [];
  const vars = { ...work.variables, ...answers };

  const meters = Number(vars.lengte_m) || 0;
  if (meters <= 0) return items;

  const hoogte = Number(vars.hoogte_cm) || 180;
  const secties = Math.ceil(meters / 1.8);
  const aantalPoorten = Number(vars.aantal_poorten) || 0;
  const palen = secties + 1 + (aantalPoorten * 2);

  // Schuttingdelen
  const prijsPerDeel = hoogte >= 200 ? PRIJZEN.schuttingdeel_200 : PRIJZEN.schuttingdeel_180;
  items.push({
    description: `Schuttingdeel ${hoogte}cm`,
    quantity: secties,
    unit: 'stuk',
    unitPrice: prijsPerDeel,
    total: secties * prijsPerDeel,
    category: 'schutting',
    isAutoCalculated: true,
  });

  // Palen
  items.push({
    description: 'Hardhouten paal',
    quantity: palen,
    unit: 'stuk',
    unitPrice: PRIJZEN.paal_hardhout,
    total: palen * PRIJZEN.paal_hardhout,
    category: 'schutting',
    isAutoCalculated: true,
  });

  // Beslag
  items.push({
    description: 'L-beslag set (4 per sectie)',
    quantity: secties,
    unit: 'set',
    unitPrice: PRIJZEN.lbeslag_set,
    total: secties * PRIJZEN.lbeslag_set,
    category: 'schutting',
    isAutoCalculated: true,
  });

  // Beton voor palen
  const betonZakken = Math.ceil(palen * 0.5);
  items.push({
    description: 'Snelbeton',
    quantity: betonZakken,
    unit: 'zak',
    unitPrice: PRIJZEN.snelbeton_zak,
    total: betonZakken * PRIJZEN.snelbeton_zak,
    category: 'schutting',
    isAutoCalculated: true,
  });

  // Poorten
  if (aantalPoorten > 0) {
    items.push({
      description: 'Looppoort',
      quantity: aantalPoorten,
      unit: 'stuk',
      unitPrice: PRIJZEN.poortdeur,
      total: aantalPoorten * PRIJZEN.poortdeur,
      category: 'schutting',
      isAutoCalculated: true,
    });
    items.push({
      description: 'Poortbeslag set',
      quantity: aantalPoorten,
      unit: 'set',
      unitPrice: PRIJZEN.poortbeslag,
      total: aantalPoorten * PRIJZEN.poortbeslag,
      category: 'schutting',
      isAutoCalculated: true,
    });
  }

  // Arbeid
  items.push({
    description: 'Plaatsen schutting',
    quantity: secties,
    unit: 'sectie',
    unitPrice: PRIJZEN.schutting_arbeid_sectie,
    total: secties * PRIJZEN.schutting_arbeid_sectie,
    category: 'schutting',
    isAutoCalculated: true,
  });

  return items;
}

/**
 * Hoofd berekeningsfunctie
 */
export function calculateQuote(input: QuoteCalculationInput): QuoteSection[] {
  const sections: QuoteSection[] = [];

  for (const work of input.werkzaamheden) {
    let items: QuoteItem[] = [];

    switch (work.type) {
      case 'sloopwerk':
        items = berekenSloopwerk(work, input.answers);
        break;
      case 'bestrating':
        items = berekenBestrating(work, input.answers);
        break;
      case 'schutting':
        items = berekenSchutting(work, input.answers);
        break;
      // Meer types kunnen hier toegevoegd worden
    }

    if (items.length > 0) {
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      sections.push({
        name: work.type.charAt(0).toUpperCase() + work.type.slice(1),
        items,
        subtotal,
      });
    }
  }

  return sections;
}

/**
 * Bereken totalen
 */
export function calculateTotals(sections: QuoteSection[]) {
  const subtotal = sections.reduce((sum, section) => sum + section.subtotal, 0);
  const btwPercentage = 21;
  const btwAmount = subtotal * (btwPercentage / 100);
  const total = subtotal + btwAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    btwPercentage,
    btwAmount: Math.round(btwAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

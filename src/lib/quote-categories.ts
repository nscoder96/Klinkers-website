// Vaste categorieën voor offertes - in de juiste volgorde
export const QUOTE_CATEGORIES = [
  { id: 'grondwerk', label: 'Grondwerk', icon: 'Shovel', color: 'from-amber-500 to-yellow-600' },
  { id: 'bestrating', label: 'Bestrating', icon: 'Grid3X3', color: 'from-slate-500 to-slate-700' },
  { id: 'erfafscheiding', label: 'Erfafscheiding', icon: 'Fence', color: 'from-orange-500 to-amber-600' },
  { id: 'vlonders', label: 'Vlonders & Terrassen', icon: 'LayoutGrid', color: 'from-yellow-600 to-orange-600' },
  { id: 'gazon', label: 'Gazon', icon: 'Leaf', color: 'from-green-500 to-emerald-600' },
  { id: 'beplanting', label: 'Beplanting', icon: 'TreeDeciduous', color: 'from-emerald-500 to-teal-600' },
  { id: 'overkappingen', label: 'Overkappingen', icon: 'Home', color: 'from-indigo-500 to-purple-600' },
  { id: 'waterwerken', label: 'Waterwerken', icon: 'Droplets', color: 'from-blue-500 to-cyan-600' },
  { id: 'verlichting', label: 'Verlichting & Irrigatie', icon: 'Lightbulb', color: 'from-yellow-400 to-amber-500' },
  { id: 'overig', label: 'Overig', icon: 'MoreHorizontal', color: 'from-gray-400 to-gray-600' },
] as const;

export type QuoteCategoryId = typeof QUOTE_CATEGORIES[number]['id'];

export function getCategoryById(id: string) {
  return QUOTE_CATEGORIES.find(c => c.id === id);
}

export function getCategoryLabel(id: string) {
  return getCategoryById(id)?.label || id;
}

export function getCategoryColor(id: string) {
  return getCategoryById(id)?.color || 'from-gray-400 to-gray-600';
}

// Standaard uurtarieven per categorie
export const DEFAULT_HOURLY_RATES: Record<QuoteCategoryId, number> = {
  grondwerk: 50,
  bestrating: 55,
  erfafscheiding: 55,
  vlonders: 55,
  gazon: 50,
  beplanting: 50,
  overkappingen: 60,
  waterwerken: 55,
  verlichting: 55,
  overig: 50,
};

// Veelvoorkomende werkzaamheden per categorie voor quick-add
export const COMMON_ACTIVITIES: Record<QuoteCategoryId, Array<{
  name: string;
  unit: string;
  defaultPrice: number;
  dependencies?: string[];
}>> = {
  grondwerk: [
    { name: 'Afgraven', unit: 'm²', defaultPrice: 8 },
    { name: 'Grond afvoeren', unit: 'm³', defaultPrice: 45 },
    { name: 'Ophogen met zand', unit: 'm³', defaultPrice: 35 },
    { name: 'Egaliseren', unit: 'm²', defaultPrice: 5 },
  ],
  bestrating: [
    { name: 'Betontegels 60×60 leggen', unit: 'm²', defaultPrice: 55, dependencies: ['Zandbed', 'Opsluitbanden'] },
    { name: 'Klinkers dikformaat leggen', unit: 'm²', defaultPrice: 65, dependencies: ['Zandbed', 'Opsluitbanden'] },
    { name: 'Opsluitbanden plaatsen', unit: 'm¹', defaultPrice: 18 },
    { name: 'Straatzand aanbrengen', unit: 'ton', defaultPrice: 45 },
    { name: 'Oude bestrating verwijderen', unit: 'm²', defaultPrice: 12 },
  ],
  erfafscheiding: [
    { name: 'Schutting hardhout 180cm', unit: 'm¹', defaultPrice: 145, dependencies: ['Betonpalen', 'Snelbeton'] },
    { name: 'Schutting douglas 180cm', unit: 'm¹', defaultPrice: 95, dependencies: ['Betonpalen', 'Snelbeton'] },
    { name: 'Betonpalen plaatsen', unit: 'stuk', defaultPrice: 45 },
    { name: 'Tuinpoort enkel', unit: 'stuk', defaultPrice: 350 },
    { name: 'Oude schutting afvoeren', unit: 'm¹', defaultPrice: 15 },
  ],
  vlonders: [
    { name: 'Vlonder hardhout leggen', unit: 'm²', defaultPrice: 175, dependencies: ['Onderconstructie', 'Fundatie'] },
    { name: 'Vlonder composiet leggen', unit: 'm²', defaultPrice: 165, dependencies: ['Onderconstructie', 'Fundatie'] },
    { name: 'Onderconstructie maken', unit: 'm²', defaultPrice: 35 },
    { name: 'Fundatietegels plaatsen', unit: 'stuk', defaultPrice: 15 },
  ],
  gazon: [
    { name: 'Graszoden leggen', unit: 'm²', defaultPrice: 18, dependencies: ['Egaliseren', 'Bodemverbetering'] },
    { name: 'Kunstgras leggen', unit: 'm²', defaultPrice: 55, dependencies: ['Egaliseren', 'Stabilisatiedoek'] },
    { name: 'Gazon egaliseren', unit: 'm²', defaultPrice: 6 },
    { name: 'Oud gras verwijderen', unit: 'm²', defaultPrice: 4 },
  ],
  beplanting: [
    { name: 'Haag planten (per m¹)', unit: 'm¹', defaultPrice: 35, dependencies: ['Plantgeul graven'] },
    { name: 'Borders beplanten', unit: 'm²', defaultPrice: 45 },
    { name: 'Sierboom planten', unit: 'stuk', defaultPrice: 85, dependencies: ['Plantgat graven'] },
    { name: 'Haagplanten (taxus)', unit: 'stuk', defaultPrice: 12 },
    { name: 'Haagplanten (beuk)', unit: 'stuk', defaultPrice: 5 },
  ],
  overkappingen: [
    { name: 'Overkapping op maat', unit: 'm²', defaultPrice: 350 },
    { name: 'Pergola plaatsen', unit: 'stuk', defaultPrice: 1500 },
  ],
  waterwerken: [
    { name: 'Vijver aanleggen', unit: 'm²', defaultPrice: 125 },
    { name: 'Vijverpomp plaatsen', unit: 'stuk', defaultPrice: 350 },
  ],
  verlichting: [
    { name: 'Tuinspot plaatsen', unit: 'stuk', defaultPrice: 95 },
    { name: 'Bekabeling leggen', unit: 'm¹', defaultPrice: 12 },
    { name: 'Irrigatiesysteem', unit: 'm²', defaultPrice: 25 },
  ],
  overig: [
    { name: 'Voorrijkosten', unit: 'stuk', defaultPrice: 35 },
    { name: 'Klein materiaal', unit: 'stuk', defaultPrice: 0 },
    { name: 'Afvalcontainer 3m³', unit: 'stuk', defaultPrice: 175 },
  ],
};

// Afhankelijkheden - als je X doet, moet je meestal ook Y doen
export const ACTIVITY_DEPENDENCIES: Record<string, {
  triggers: string[];
  question?: string;
  autoAdd?: boolean;
}> = {
  'bestrating': {
    triggers: ['Zandbed aanbrengen', 'Opsluitbanden plaatsen', 'Aftrillen', 'Invoegen'],
    autoAdd: true,
  },
  'ophogen': {
    triggers: ['Ophoogzand aanbrengen', 'Verdichten'],
    autoAdd: true,
  },
  'schutting': {
    triggers: ['Betonpalen plaatsen', 'Snelbeton', 'Afdeklat'],
    autoAdd: true,
  },
  'vlonder': {
    triggers: ['Worteldoek', 'Fundatietegels', 'Onderconstructie'],
    autoAdd: true,
  },
  'haag': {
    triggers: ['Plantgeul graven', 'Grondverbetering'],
    autoAdd: true,
  },
  'boom': {
    triggers: ['Plantgat graven'],
    autoAdd: true,
  },
  'oude_bestrating': {
    triggers: ['Oude bestrating verwijderen', 'Afvoer bestrating'],
    question: 'Ligt er bestaande bestrating?',
  },
  'grondafvoer': {
    triggers: ['Grond afvoeren'],
    question: 'Moet grond worden afgevoerd?',
  },
  'drainage': {
    triggers: ['Drainage aanleggen'],
    question: 'Is drainage nodig?',
  },
};

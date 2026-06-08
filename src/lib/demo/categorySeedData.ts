/**
 * Category Seed Data for Demo Environment
 *
 * Contains work categories, materials, questions, and calculation rules
 * for the intelligent quote builder system.
 */

// ============================================
// WORK CATEGORIES
// ============================================
export const demoWorkCategories = [
  {
    id: 'cat-sloop',
    name: 'Sloopwerk / Uitbreken',
    slug: 'sloopwerk',
    description: 'Bestaande materialen verwijderen en afvoeren',
    icon: 'Hammer',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'cat-grondwerk',
    name: 'Grondwerk / Ophogen',
    slug: 'grondwerk',
    description: 'Grond verplaatsen, ophogen, of afgraven',
    icon: 'Mountain',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'cat-bestrating',
    name: 'Bestrating / Straatwerk',
    slug: 'bestrating',
    description: 'Tegels, klinkers, en andere verharding leggen',
    icon: 'LayoutGrid',
    display_order: 3,
    is_active: true,
  },
  {
    id: 'cat-schutting',
    name: 'Schutting / Erfafscheiding',
    slug: 'schutting',
    description: 'Houten schuttingen en hekwerken plaatsen',
    icon: 'Fence',
    display_order: 4,
    is_active: true,
  },
  {
    id: 'cat-overkapping',
    name: 'Overkapping',
    slug: 'overkapping',
    description: 'Terrasoverkappingen en pergola\'s',
    icon: 'Home',
    display_order: 5,
    is_active: true,
  },
  {
    id: 'cat-beplanting',
    name: 'Beplanting / Tuinaanleg',
    slug: 'beplanting',
    description: 'Planten, bomen, gazon en borders',
    icon: 'TreePine',
    display_order: 6,
    is_active: true,
  },
  {
    id: 'cat-overig',
    name: 'Overig',
    slug: 'overig',
    description: 'Overige werkzaamheden',
    icon: 'MoreHorizontal',
    display_order: 99,
    is_active: true,
  },
];

// ============================================
// CATEGORY QUESTIONS
// ============================================
export const demoCategoryQuestions = [
  // --- SCHUTTING QUESTIONS ---
  {
    id: 'q-schutting-poort',
    category_id: 'cat-schutting',
    question_text: 'Komt er een poortdeur in de schutting?',
    question_type: 'boolean',
    options: null,
    default_value: 'false',
    variable_name: 'has_gate',
    display_order: 1,
    is_required: false,
    help_text: 'Een poortdeur vereist extra palen en beslag',
  },
  {
    id: 'q-schutting-poort-aantal',
    category_id: 'cat-schutting',
    question_text: 'Hoeveel poortdeuren?',
    question_type: 'number',
    options: null,
    default_value: '1',
    variable_name: 'gate_count',
    display_order: 2,
    is_required: false,
    help_text: 'Aantal poortdeuren in de schutting',
  },
  {
    id: 'q-schutting-bovenlat',
    category_id: 'cat-schutting',
    question_text: 'Komt er een bovenlat op de schutting?',
    question_type: 'boolean',
    options: null,
    default_value: 'false',
    variable_name: 'has_top_rail',
    display_order: 3,
    is_required: false,
    help_text: 'Een afsluitende lat aan de bovenkant voor een nettere afwerking',
  },
  {
    id: 'q-schutting-onderplank',
    category_id: 'cat-schutting',
    question_text: 'Moet er een onderplank komen?',
    question_type: 'boolean',
    options: null,
    default_value: 'false',
    variable_name: 'has_bottom_board',
    display_order: 4,
    is_required: false,
    help_text: 'Een betonnen of houten plank aan de onderkant tegen vocht',
  },
  {
    id: 'q-schutting-beton',
    category_id: 'cat-schutting',
    question_text: 'Palen in beton zetten?',
    question_type: 'boolean',
    options: null,
    default_value: 'true',
    variable_name: 'concrete_posts',
    display_order: 5,
    is_required: false,
    help_text: 'Voor extra stevigheid worden palen in beton gezet',
  },

  // --- BESTRATING QUESTIONS ---
  {
    id: 'q-bestrating-speci',
    category_id: 'cat-bestrating',
    question_text: 'Is er speci nodig?',
    question_type: 'boolean',
    options: null,
    default_value: 'false',
    variable_name: 'needs_mortar',
    display_order: 1,
    is_required: false,
    help_text: 'Voor grotere tegels of hellingen kan speci nodig zijn',
  },
  {
    id: 'q-bestrating-zaag',
    category_id: 'cat-bestrating',
    question_text: 'Hoeveel zaagmeters zijn er nodig?',
    question_type: 'number',
    options: null,
    default_value: '0',
    variable_name: 'saw_meters',
    display_order: 2,
    is_required: false,
    help_text: 'Aantal meters dat gezaagd moet worden langs randen',
  },
  {
    id: 'q-bestrating-patroon',
    category_id: 'cat-bestrating',
    question_text: 'Welk legpatroon?',
    question_type: 'select',
    options: JSON.stringify(['Halfsteens verband', 'Keperverband', 'Blokverband', 'Elleboogverband', 'Anders']),
    default_value: 'Halfsteens verband',
    variable_name: 'pattern',
    display_order: 3,
    is_required: false,
    help_text: 'Het patroon waarin de stenen gelegd worden',
  },
  {
    id: 'q-bestrating-opsluit',
    category_id: 'cat-bestrating',
    question_text: 'Zijn er opsluitbanden nodig?',
    question_type: 'boolean',
    options: null,
    default_value: 'true',
    variable_name: 'needs_edging',
    display_order: 4,
    is_required: false,
    help_text: 'Opsluitbanden rondom de bestrating',
  },
  {
    id: 'q-bestrating-opsluit-meters',
    category_id: 'cat-bestrating',
    question_text: 'Hoeveel meter opsluitbanden?',
    question_type: 'number',
    options: null,
    default_value: '0',
    variable_name: 'edging_meters',
    display_order: 5,
    is_required: false,
    help_text: 'Totale lengte opsluitbanden in meters',
  },

  // --- GRONDWERK QUESTIONS ---
  {
    id: 'q-grondwerk-afvoer',
    category_id: 'cat-grondwerk',
    question_text: 'Moet de grond afgevoerd worden?',
    question_type: 'boolean',
    options: null,
    default_value: 'true',
    variable_name: 'remove_soil',
    display_order: 1,
    is_required: false,
    help_text: 'Grond afvoeren naar depot of elders in de tuin verwerken',
  },
  {
    id: 'q-grondwerk-diepte',
    category_id: 'cat-grondwerk',
    question_text: 'Hoeveel cm diep ontgraven?',
    question_type: 'number',
    options: null,
    default_value: '30',
    variable_name: 'dig_depth',
    display_order: 2,
    is_required: false,
    help_text: 'Standaard 30cm voor bestrating (fundering + tegels)',
  },

  // --- SLOOPWERK QUESTIONS ---
  {
    id: 'q-sloop-afvoer',
    category_id: 'cat-sloop',
    question_text: 'Moet het sloopafval afgevoerd worden?',
    question_type: 'boolean',
    options: null,
    default_value: 'true',
    variable_name: 'remove_debris',
    display_order: 1,
    is_required: false,
    help_text: 'Inclusief transport naar milieustraat of container',
  },
  {
    id: 'q-sloop-type',
    category_id: 'cat-sloop',
    question_text: 'Wat voor materiaal wordt gesloopt?',
    question_type: 'select',
    options: JSON.stringify(['Bestaande bestrating', 'Oude schutting', 'Betonwerk', 'Gemengd puin', 'Anders']),
    default_value: 'Bestaande bestrating',
    variable_name: 'demolition_type',
    display_order: 2,
    is_required: false,
    help_text: 'Type materiaal bepaalt afvoerkosten',
  },
];

// ============================================
// CATEGORY MATERIALS
// ============================================
export const demoCategoryMaterials = [
  // --- SCHUTTING BASE MATERIALS ---
  {
    id: 'mat-schutting-delen',
    category_id: 'cat-schutting',
    pricing_id: null, // Will be linked to pricing table
    material_type: 'base',
    is_required: true,
    default_quantity: null,
    quantity_formula: '{sections}',
    display_order: 1,
    notes: 'Aantal schuttingdelen, elk 180cm breed',
    material_name: 'Schuttingdeel 180x180cm', // For seed matching
    material_unit: 'stuk',
    material_price: 45.00,
  },
  {
    id: 'mat-schutting-palen',
    category_id: 'cat-schutting',
    pricing_id: null,
    material_type: 'base',
    is_required: true,
    default_quantity: null,
    quantity_formula: '{sections} + 1',
    display_order: 2,
    notes: 'Hardhouten palen 60x60mm, 250cm lang (1/3 grond, 2/3 boven)',
    material_name: 'Hardhouten paal 60x60mm 250cm',
    material_unit: 'stuk',
    material_price: 55.00,
  },
  {
    id: 'mat-schutting-lbeslag',
    category_id: 'cat-schutting',
    pricing_id: null,
    material_type: 'base',
    is_required: true,
    default_quantity: null,
    quantity_formula: '{sections} * 4',
    display_order: 3,
    notes: '4 stuks L-beslag per schuttingdeel voor bevestiging',
    material_name: 'L-beslag verzinkt',
    material_unit: 'stuk',
    material_price: 2.50,
  },
  {
    id: 'mat-schutting-schroeven',
    category_id: 'cat-schutting',
    pricing_id: null,
    material_type: 'base',
    is_required: true,
    default_quantity: null,
    quantity_formula: 'Math.ceil({sections} * 4 * 2 / 50)',
    display_order: 4,
    notes: '2 schroeven per L-beslag, zakjes van 50 stuks',
    material_name: 'Schroeven RVS zakje 50st',
    material_unit: 'zakje',
    material_price: 8.00,
  },

  // --- SCHUTTING EXTRA MATERIALS ---
  {
    id: 'mat-schutting-bovenlat',
    category_id: 'cat-schutting',
    pricing_id: null,
    material_type: 'extra',
    is_required: false,
    default_quantity: null,
    quantity_formula: 'Math.ceil({sections} * 1.8 / 4)',
    display_order: 10,
    notes: 'Bovenlat in lengtes van 4 meter, alleen indien gevraagd',
    material_name: 'Bovenlat hardhout 4m',
    material_unit: 'stuk',
    material_price: 35.00,
  },
  {
    id: 'mat-schutting-onderplank',
    category_id: 'cat-schutting',
    pricing_id: null,
    material_type: 'extra',
    is_required: false,
    default_quantity: null,
    quantity_formula: 'Math.ceil({sections} * 1.8 / 2)',
    display_order: 11,
    notes: 'Onderplank beton in lengtes van 2 meter',
    material_name: 'Onderplank beton 200x25x3.5cm',
    material_unit: 'stuk',
    material_price: 18.00,
  },
  {
    id: 'mat-schutting-beton',
    category_id: 'cat-schutting',
    pricing_id: null,
    material_type: 'extra',
    is_required: false,
    default_quantity: null,
    quantity_formula: '({sections} + 1) * 0.5',
    display_order: 12,
    notes: 'Snelbeton voor palen, 0.5 zak per paal',
    material_name: 'Snelbeton 25kg',
    material_unit: 'zak',
    material_price: 6.50,
  },

  // --- BESTRATING BASE MATERIALS ---
  {
    id: 'mat-bestrating-inveegzand',
    category_id: 'cat-bestrating',
    pricing_id: null,
    material_type: 'base',
    is_required: true,
    default_quantity: null,
    quantity_formula: '{area} * 5',
    display_order: 1,
    notes: 'Inveegzand: 5kg per m²',
    material_name: 'Inveegzand 25kg',
    material_unit: 'kg',
    material_price: 0.50,
  },
  {
    id: 'mat-bestrating-zand',
    category_id: 'cat-bestrating',
    pricing_id: null,
    material_type: 'base',
    is_required: true,
    default_quantity: null,
    quantity_formula: '{area} * 0.05',
    display_order: 2,
    notes: 'Stratzand/legzand: 5cm laag = 0.05 m³ per m²',
    material_name: 'Stratzand m³',
    material_unit: 'm³',
    material_price: 45.00,
  },
  {
    id: 'mat-bestrating-opsluit',
    category_id: 'cat-bestrating',
    pricing_id: null,
    material_type: 'base',
    is_required: false,
    default_quantity: null,
    quantity_formula: '{edging_meters}',
    display_order: 3,
    notes: 'Opsluitbanden per strekkende meter',
    material_name: 'Opsluitband 100x20x6cm',
    material_unit: 'm¹',
    material_price: 22.00,
  },

  // --- BESTRATING EXTRA MATERIALS ---
  {
    id: 'mat-bestrating-speci',
    category_id: 'cat-bestrating',
    pricing_id: null,
    material_type: 'extra',
    is_required: false,
    default_quantity: null,
    quantity_formula: '{area} * 25',
    display_order: 10,
    notes: 'Speci: 25kg per m² indien nodig',
    material_name: 'Speci droog 25kg',
    material_unit: 'kg',
    material_price: 0.35,
  },
  {
    id: 'mat-bestrating-zaagwerk',
    category_id: 'cat-bestrating',
    pricing_id: null,
    material_type: 'extra',
    is_required: false,
    default_quantity: null,
    quantity_formula: '{saw_meters}',
    display_order: 11,
    notes: 'Zaagwerk per strekkende meter',
    material_name: 'Zaagwerk straatwerk',
    material_unit: 'm¹',
    material_price: 15.00,
  },

  // --- GRONDWERK MATERIALS ---
  {
    id: 'mat-grondwerk-afvoer',
    category_id: 'cat-grondwerk',
    pricing_id: null,
    material_type: 'base',
    is_required: false,
    default_quantity: null,
    quantity_formula: '{area} * ({dig_depth} / 100)',
    display_order: 1,
    notes: 'Grondafvoer in m³ (oppervlakte × diepte)',
    material_name: 'Grondafvoer incl. transport',
    material_unit: 'm³',
    material_price: 35.00,
  },
  {
    id: 'mat-grondwerk-ophoog',
    category_id: 'cat-grondwerk',
    pricing_id: null,
    material_type: 'extra',
    is_required: false,
    default_quantity: null,
    quantity_formula: '{area} * 0.1',
    display_order: 2,
    notes: 'Ophoogzand indien ophogen nodig is (10cm laag)',
    material_name: 'Ophoogzand m³',
    material_unit: 'm³',
    material_price: 40.00,
  },

  // --- SLOOPWERK MATERIALS ---
  {
    id: 'mat-sloop-afvoer',
    category_id: 'cat-sloop',
    pricing_id: null,
    material_type: 'base',
    is_required: false,
    default_quantity: null,
    quantity_formula: '{area} * 0.1',
    display_order: 1,
    notes: 'Sloopafval afvoer in m³',
    material_name: 'Puinafvoer gemengd',
    material_unit: 'm³',
    material_price: 45.00,
  },
];

// ============================================
// CATEGORY RULES
// ============================================
export const demoCategoryRules = [
  // --- SCHUTTING RULES ---
  {
    id: 'rule-schutting-poort-palen',
    category_id: 'cat-schutting',
    rule_name: 'Extra palen voor poort',
    description: 'Voeg 2 extra palen toe per poortdeur voor stevigheid',
    trigger_condition: null,
    pricing_id: null, // Will be linked
    quantity_formula: '{gate_count} * 2',
    condition_formula: '{has_gate} == true',
    display_order: 1,
    is_active: true,
    material_name: 'Hardhouten paal 60x60mm 250cm',
  },
  {
    id: 'rule-schutting-poort-beslag',
    category_id: 'cat-schutting',
    rule_name: 'Poortscharnieren en slot',
    description: 'Scharnieren en slot set per poortdeur',
    trigger_condition: null,
    pricing_id: null,
    quantity_formula: '{gate_count}',
    condition_formula: '{has_gate} == true',
    display_order: 2,
    is_active: true,
    material_name: 'Poortbeslag set',
  },
  {
    id: 'rule-schutting-poort',
    category_id: 'cat-schutting',
    rule_name: 'Poortdeur',
    description: 'Houten poortdeur met frame',
    trigger_condition: null,
    pricing_id: null,
    quantity_formula: '{gate_count}',
    condition_formula: '{has_gate} == true',
    display_order: 3,
    is_active: true,
    material_name: 'Poortdeur hardhout 100x180cm',
  },
  {
    id: 'rule-schutting-bovenlat',
    category_id: 'cat-schutting',
    rule_name: 'Bovenlat toevoegen',
    description: 'Bovenlat over de schutting indien gevraagd',
    trigger_condition: null,
    pricing_id: null,
    quantity_formula: 'Math.ceil({sections} * 1.8 / 4)',
    condition_formula: '{has_top_rail} == true',
    display_order: 4,
    is_active: true,
    material_name: 'Bovenlat hardhout 4m',
  },
  {
    id: 'rule-schutting-onderplank',
    category_id: 'cat-schutting',
    rule_name: 'Onderplank toevoegen',
    description: 'Betonnen onderplank tegen vocht',
    trigger_condition: null,
    pricing_id: null,
    quantity_formula: 'Math.ceil({sections} * 1.8 / 2)',
    condition_formula: '{has_bottom_board} == true',
    display_order: 5,
    is_active: true,
    material_name: 'Onderplank beton 200x25x3.5cm',
  },
  {
    id: 'rule-schutting-beton',
    category_id: 'cat-schutting',
    rule_name: 'Beton voor palen',
    description: 'Snelbeton voor het zetten van palen',
    trigger_condition: null,
    pricing_id: null,
    quantity_formula: 'Math.ceil(({sections} + 1) * 0.5)',
    condition_formula: '{concrete_posts} == true',
    display_order: 6,
    is_active: true,
    material_name: 'Snelbeton 25kg',
  },

  // --- BESTRATING RULES ---
  {
    id: 'rule-bestrating-speci',
    category_id: 'cat-bestrating',
    rule_name: 'Speci voor leggen',
    description: 'Droge speci voor tegels indien nodig',
    trigger_condition: null,
    pricing_id: null,
    quantity_formula: '{area} * 25',
    condition_formula: '{needs_mortar} == true',
    display_order: 1,
    is_active: true,
    material_name: 'Speci droog 25kg',
  },
  {
    id: 'rule-bestrating-zaag',
    category_id: 'cat-bestrating',
    rule_name: 'Zaagwerk',
    description: 'Zaagwerk per strekkende meter',
    trigger_condition: null,
    pricing_id: null,
    quantity_formula: '{saw_meters}',
    condition_formula: '{saw_meters} > 0',
    display_order: 2,
    is_active: true,
    material_name: 'Zaagwerk straatwerk',
  },
  {
    id: 'rule-bestrating-opsluit',
    category_id: 'cat-bestrating',
    rule_name: 'Opsluitbanden',
    description: 'Opsluitbanden rondom de bestrating',
    trigger_condition: null,
    pricing_id: null,
    quantity_formula: '{edging_meters}',
    condition_formula: '{needs_edging} == true && {edging_meters} > 0',
    display_order: 3,
    is_active: true,
    material_name: 'Opsluitband 100x20x6cm',
  },

  // --- GRONDWERK RULES ---
  {
    id: 'rule-grondwerk-afvoer',
    category_id: 'cat-grondwerk',
    rule_name: 'Grondafvoer',
    description: 'Grond afvoeren naar depot',
    trigger_condition: null,
    pricing_id: null,
    quantity_formula: '{area} * ({dig_depth} / 100)',
    condition_formula: '{remove_soil} == true',
    display_order: 1,
    is_active: true,
    material_name: 'Grondafvoer incl. transport',
  },

  // --- SLOOPWERK RULES ---
  {
    id: 'rule-sloop-afvoer',
    category_id: 'cat-sloop',
    rule_name: 'Puinafvoer',
    description: 'Sloopafval afvoeren',
    trigger_condition: null,
    pricing_id: null,
    quantity_formula: '{area} * 0.1',
    condition_formula: '{remove_debris} == true',
    display_order: 1,
    is_active: true,
    material_name: 'Puinafvoer gemengd',
  },
];

// Helper to get all materials that need to be added to pricing table
export function getRequiredPricingItems(): Array<{
  category: string;
  item_name: string;
  unit: string;
  cost_price_default: number;
  selling_price_default: number;
}> {
  const items = new Map<string, {
    category: string;
    item_name: string;
    unit: string;
    cost_price_default: number;
    selling_price_default: number;
  }>();

  // Add from materials
  demoCategoryMaterials.forEach(mat => {
    if (mat.material_name && !items.has(mat.material_name)) {
      items.set(mat.material_name, {
        category: 'afscheiding', // Default, will be overridden based on category
        item_name: mat.material_name,
        unit: mat.material_unit || 'stuk',
        cost_price_default: (mat.material_price || 0) * 0.7,
        selling_price_default: mat.material_price || 0,
      });
    }
  });

  // Add from rules (for items like poortdeur that aren't in base materials)
  demoCategoryRules.forEach(rule => {
    if (rule.material_name && !items.has(rule.material_name)) {
      items.set(rule.material_name, {
        category: 'afscheiding',
        item_name: rule.material_name,
        unit: 'stuk',
        cost_price_default: 0,
        selling_price_default: 0,
      });
    }
  });

  return Array.from(items.values());
}

// Export types
export interface WorkCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

export interface CategoryQuestion {
  id: string;
  category_id: string;
  question_text: string;
  question_type: 'boolean' | 'number' | 'select' | 'text';
  options: string | null;
  default_value: string;
  variable_name: string;
  display_order: number;
  is_required: boolean;
  help_text: string;
}

export interface CategoryMaterial {
  id: string;
  category_id: string;
  pricing_id: string | null;
  material_type: 'base' | 'extra';
  is_required: boolean;
  default_quantity: number | null;
  quantity_formula: string | null;
  display_order: number;
  notes: string;
  material_name?: string;
  material_unit?: string;
  material_price?: number;
}

export interface CategoryRule {
  id: string;
  category_id: string;
  rule_name: string;
  description: string;
  trigger_condition: string | null;
  pricing_id: string | null;
  quantity_formula: string;
  condition_formula: string | null;
  display_order: number;
  is_active: boolean;
  material_name?: string;
}

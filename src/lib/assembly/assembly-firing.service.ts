/**
 * Assembly-firing (Laag 2 — welke assembly vuurt per activiteit).
 *
 * Puur: gegeven een activiteit-categorie + actie, kies de juiste assembly door
 * te matchen op `trigger_category` + `trigger_action`. `trigger_action` kan een
 * comma-lijst zijn ("nieuw,vervangen"). Selecteert alleen — genereert niets.
 *
 * Categorie-mapping: stratenmaker-(sub)categorieën worden teruggebracht naar de
 * brede triggercategorie ('bestrating' | 'grondwerk') waarop assemblies zijn
 * geregistreerd. De volledige enum-rewrite hangt aan Laag 1 + V1/V2-consolidatie;
 * deze mapping-laag overbrugt dat zonder de schema's nu te breken.
 */

export interface Assembly {
  id: string;
  name: string;
  trigger_category: string | null;
  trigger_action: string | null;
  unit: string;
  is_active?: boolean;
}

/**
 * Stratenmaker-(sub)categorie → brede assembly-triggercategorie.
 * Wat hier niet in staat (brede categorieën, 'overig', hovenierscategorieën)
 * wordt ongewijzigd teruggegeven en matcht dus alleen op exacte naam.
 */
const CATEGORY_TO_TRIGGER: Record<string, string> = {
  bestrating_gebakken: "bestrating",
  bestrating_beton: "bestrating",
  bestrating_sier: "bestrating",
  bestrating_natuur: "bestrating",
  opsluitwerk: "bestrating",
  fundering: "grondwerk",
};

const norm = (s: string): string => s.toLowerCase().trim();

/**
 * Brengt een categorie uit Laag 1 terug naar de triggercategorie waarop
 * assemblies geregistreerd staan. Onbekend → genormaliseerd, ongewijzigd.
 */
export function mapToTriggerCategory(category: string): string {
  const key = norm(category);
  return CATEGORY_TO_TRIGGER[key] ?? key;
}

/** Splitst een (mogelijk comma-gescheiden) trigger_action in losse acties. */
function actionList(triggerAction: string | null): string[] {
  if (!triggerAction) return [];
  return triggerAction
    .split(",")
    .map(norm)
    .filter(Boolean);
}

/** Of een assembly vuurt voor de gegeven triggercategorie + actie. */
function matches(
  assembly: Assembly,
  triggerCategory: string,
  action: string
): boolean {
  if (assembly.is_active === false) return false;

  // Geen trigger_category = vuurt voor elke categorie (catch-all).
  const catOk =
    assembly.trigger_category == null ||
    norm(assembly.trigger_category) === triggerCategory;

  // Geen trigger_action = vuurt voor elke actie.
  const actions = actionList(assembly.trigger_action);
  const actOk = actions.length === 0 || actions.includes(norm(action));

  return catOk && actOk;
}

/** Hoe specifiek een trigger is — meer ingevulde velden = specifieker. */
function specificity(a: Assembly): number {
  return (a.trigger_category ? 1 : 0) + (a.trigger_action ? 1 : 0);
}

/**
 * Kiest de assembly die vuurt voor (categorie, actie). Null = geen match; de
 * activiteit valt dan terug op handmatige/los-regel-afhandeling.
 *
 * Bij meerdere matches wint de meest specifieke trigger (zowel categorie- als
 * actie-trigger ingevuld), daarna de eerste in de aangeleverde volgorde.
 */
export function selectAssembly(
  category: string,
  action: string,
  assemblies: Assembly[]
): Assembly | null {
  const triggerCategory = mapToTriggerCategory(category);
  const candidates = assemblies.filter((a) =>
    matches(a, triggerCategory, action)
  );

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  return [...candidates].sort(
    (a, b) => specificity(b) - specificity(a)
  )[0];
}

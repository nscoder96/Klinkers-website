export interface NewPricingItemPromptInput {
  /** Huidige (net gecommitte) omschrijving van de offerteregel */
  description: string;
  /** Gekoppeld bibliotheek-item, of null bij een losse regel */
  pricingId: string | null;
  /** item_name van het gekoppelde bibliotheek-item; null als de koppeling niet opgezocht kan worden */
  linkedItemName: string | null;
  /** Is er voor deze regel + omschrijving al gevraagd? */
  alreadyAsked: boolean;
}

const PLACEHOLDER_DESCRIPTIONS = ['nieuw item'];

export function normalizeItemName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Bepaalt of de "is dit een nieuw item voor de prijsbibliotheek?"-vraag moet
 * verschijnen nadat de omschrijving van een offerteregel is aangepast.
 */
export function shouldPromptNewPricingItem(input: NewPricingItemPromptInput): boolean {
  const description = normalizeItemName(input.description);

  if (!description || input.alreadyAsked) return false;
  if (PLACEHOLDER_DESCRIPTIONS.includes(description)) return false;

  if (!input.pricingId) return true;

  // Koppeling bestaat maar is niet op te zoeken (bibliotheek niet geladen):
  // dan kunnen we niet weten of de naam afwijkt — niet vragen.
  if (input.linkedItemName === null) return false;

  return description !== normalizeItemName(input.linkedItemName);
}

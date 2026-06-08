/**
 * Money helpers — reken in hele eurocenten (integer), nooit met losse floats.
 *
 * Analogie: behandel geld als knikkers, niet als water. Je kunt knikkers exact
 * tellen; water (floats) lekt altijd een beetje weg bij optellen/vermenigvuldigen.
 *
 * Regel (Deel B1 / kwaliteitseis): alle berekeningen in centen. Converteer pas
 * naar euro's bij weergave (fromCents / formatEuros).
 */

export type Cents = number;

/** Euro's (bv. 18.5) → hele centen (1850). */
export function toCents(euros: number): Cents {
  if (typeof euros !== "number" || !Number.isFinite(euros)) {
    throw new Error(`toCents: ongeldig bedrag: ${euros}`);
  }
  return Math.round(euros * 100);
}

/** Hele centen (1850) → euro's (18.5). */
export function fromCents(cents: Cents): number {
  if (!Number.isInteger(cents)) {
    throw new Error(`fromCents: centen moeten een geheel getal zijn, kreeg: ${cents}`);
  }
  return cents / 100;
}

/** Eenheidsprijs (centen) × hoeveelheid (mag fractioneel) → centen, afgerond. */
export function multiplyCents(unitCents: Cents, quantity: number): Cents {
  if (!Number.isInteger(unitCents)) {
    throw new Error(`multiplyCents: unitCents moet integer centen zijn, kreeg: ${unitCents}`);
  }
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    throw new Error(`multiplyCents: ongeldige hoeveelheid: ${quantity}`);
  }
  return Math.round(unitCents * quantity);
}

/** Som van centen-bedragen. */
export function sumCents(values: Cents[]): Cents {
  return values.reduce((acc, v) => {
    if (!Number.isInteger(v)) {
      throw new Error(`sumCents: alle waarden moeten integer centen zijn, kreeg: ${v}`);
    }
    return acc + v;
  }, 0);
}

/**
 * BTW/percentage van een basisbedrag.
 * @param baseCents basisbedrag in centen
 * @param rate fractie, bv. 0.21 voor 21%
 */
export function pctOfCents(baseCents: Cents, rate: number): Cents {
  if (!Number.isInteger(baseCents)) {
    throw new Error(`pctOfCents: baseCents moet integer centen zijn, kreeg: ${baseCents}`);
  }
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    throw new Error(`pctOfCents: ongeldig tarief: ${rate}`);
  }
  return Math.round(baseCents * rate);
}

/** Centen → NL-geformatteerde euro-string, bv. "€ 1.850,00". */
export function formatEuros(cents: Cents): string {
  const euros = fromCents(Math.round(cents));
  return `€ ${euros.toLocaleString("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

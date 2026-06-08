/**
 * Assembly formula-evaluator (Deel A2 / B3).
 *
 * Evalueert de `quantity_formula` van een assembly_component met kale
 * variabelenamen (qty, zanddikte_cm, ...) en een whitelist van functies
 * (sqrt, ceil, greatest, ...). Bewust een ANDER dialect dan
 * `formula-parser.ts` (dat {variabele}-syntax gebruikt voor work_rules).
 *
 * Veilig: alleen ge-whiteliste identifiers mogen voorkomen; al het andere
 * (haakjes, cijfers, operatoren) wordt op tekenniveau gevalideerd vóór eval.
 */

export interface AssemblyVars {
  [name: string]: number;
}

/** Toegestane functies (naam → implementatie). `greatest`/`least` = SQL-stijl. */
const ALLOWED_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sqrt: Math.sqrt,
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
  greatest: Math.max,
  least: Math.min,
};

/**
 * Evalueert een formule tegen variabelen. Gooit bij onbekende identifiers,
 * ongeldige tekens of een niet-numeriek resultaat (faal hard, gok nooit).
 */
export function evaluateAssemblyFormula(
  formula: string | null | undefined,
  vars: AssemblyVars
): number {
  if (formula == null || typeof formula !== "string" || formula.trim() === "") {
    throw new Error("evaluateAssemblyFormula: lege formule");
  }
  const expr = formula.trim();

  const identifiers = expr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? [];
  const fnNames = Object.keys(ALLOWED_FUNCTIONS);

  for (const id of identifiers) {
    if (!(id in vars) && !fnNames.includes(id)) {
      throw new Error(
        `Onbekende variabele/functie in formule "${formula}": "${id}"`
      );
    }
  }

  // Verwijder alle identifiers; wat overblijft mag alleen veilige tekens zijn.
  const stripped = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, "");
  if (!/^[\d\s+\-*/().,]*$/.test(stripped)) {
    throw new Error(`Ongeldige tekens in formule "${formula}"`);
  }

  const varNames = Object.keys(vars);
  const argNames = [...fnNames, ...varNames];
  const argValues = [
    ...fnNames.map((n) => ALLOWED_FUNCTIONS[n]),
    ...varNames.map((n) => vars[n]),
  ];

  let result: unknown;
  try {
    // Sandbox: alleen ge-whiteliste args zitten in scope.
    result = new Function(
      ...argNames,
      `"use strict"; return (${expr});`
    )(...argValues);
  } catch (error) {
    throw new Error(
      `Fout bij evalueren formule "${formula}": ${(error as Error).message}`
    );
  }

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error(`Formule "${formula}" gaf geen geldig getal: ${result}`);
  }
  return result;
}

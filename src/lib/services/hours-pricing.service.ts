/**
 * Hours Pricing Service (A4)
 *
 * Berekent arbeidskosten op basis van uren × uurtarief.
 * Rondt af naar volledige dagen (altijd naar boven = ceil).
 *
 * Formule: ceil(totaal_uren / min_uren_per_dag) × min_uren_per_dag × uurtarief
 *
 * Voorbeeld:
 *   25.5 uur geschat
 *   → 4 dagen (ceil(25.5/8) = ceil(3.19) = 4)
 *   → 32 factureerbare uren (4 × 8)
 *   → €2.720 arbeidskosten (32 × €85)
 */

import type { WorkBreakdownV2, WorkSectionV2 } from "../schemas/work-breakdown-v2.schema";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SectionHours {
  section_name: string;
  estimated_hours: number;
}

export interface HoursPricingResult {
  /** Totale geschatte uren zoals ingevuld in werkitems */
  estimated_hours: number;
  /** Factureerbare uren na afronding op dagbasis */
  billable_hours: number;
  /** Aantal werkdagen */
  days: number;
  /** Totale arbeidskosten (billable_hours × uurtarief) */
  labor_cost: number;
  /** Uurtarief dat gebruikt is */
  hourly_rate: number;
  /** Uren per sectie voor overzicht */
  breakdown_per_section: SectionHours[];
}

export interface HoursPricingConfig {
  /** Uurtarief in euro's (default: 85) */
  hourly_rate?: number;
  /** Minimum uren per dag voor afrondingsregel (default: 8) */
  min_hours_per_day?: number;
  /** Afrondingsrichting (default: 'ceil') */
  day_rounding?: "ceil" | "round" | "floor";
}

// ─────────────────────────────────────────────────────────────────────────────
// Implementatie
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<HoursPricingConfig> = {
  hourly_rate: 85,
  min_hours_per_day: 8,
  day_rounding: "ceil",
};

/**
 * Bereken arbeidskosten uit een v2 werkopsplitsing.
 */
export function calculateHoursPricing(
  breakdown: WorkBreakdownV2,
  config: HoursPricingConfig = {}
): HoursPricingResult {
  const { hourly_rate, min_hours_per_day, day_rounding } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const sectionHours: SectionHours[] = [];

  // Voorbereidend werk
  const prepHours = sumSectionHours(breakdown.preparatory);
  if (prepHours > 0) {
    sectionHours.push({
      section_name: breakdown.preparatory.name,
      estimated_hours: prepHours,
    });
  }

  // Per gebied
  for (const area of breakdown.areas) {
    const hours = sumSectionHours(area);
    if (hours > 0) {
      sectionHours.push({ section_name: area.name, estimated_hours: hours });
    }
  }

  const estimated_hours = sectionHours.reduce(
    (acc, s) => acc + s.estimated_hours,
    0
  );

  const raw_days = estimated_hours / min_hours_per_day;
  const days = applyRounding(raw_days, day_rounding);
  const billable_hours = days * min_hours_per_day;
  const labor_cost = billable_hours * hourly_rate;

  return {
    estimated_hours,
    billable_hours,
    days,
    labor_cost,
    hourly_rate,
    breakdown_per_section: sectionHours,
  };
}

/**
 * Snel bereken op basis van losse urentotaal (bijv. na handmatige aanpassing).
 */
export function calculateFromHours(
  total_hours: number,
  config: HoursPricingConfig = {}
): Omit<HoursPricingResult, "breakdown_per_section"> {
  const { hourly_rate, min_hours_per_day, day_rounding } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const raw_days = total_hours / min_hours_per_day;
  const days = applyRounding(raw_days, day_rounding);
  const billable_hours = days * min_hours_per_day;
  const labor_cost = billable_hours * hourly_rate;

  return {
    estimated_hours: total_hours,
    billable_hours,
    days,
    labor_cost,
    hourly_rate,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function sumSectionHours(section: WorkSectionV2): number {
  return section.items.reduce((acc, item) => acc + item.hours_estimated, 0);
}

function applyRounding(
  value: number,
  rounding: "ceil" | "round" | "floor"
): number {
  if (value <= 0) return 0;
  switch (rounding) {
    case "ceil":
      return Math.ceil(value);
    case "round":
      return Math.round(value);
    case "floor":
      return Math.floor(value);
  }
}

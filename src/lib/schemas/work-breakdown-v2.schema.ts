/**
 * Work Breakdown v2 Schema — Nieuwe Pipeline
 *
 * Output contract voor de v2 AI Understanding service.
 * In plaats van categorieën werkt v2 met fysieke gebieden (voor/achter/oprit).
 *
 * Kernwijzigingen t.o.v. v1:
 * - Secties = gebieden (voor, achter, oprit) i.p.v. categorieën
 * - Uren in plaats van eenheidsprijzen
 * - material_flag: 'bestaand' | 'nieuw' | 'geen' per item
 * - Materialen geaggregeerd onderaan (niet per werk-item)
 * - work_type_key voor leerdata
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const MaterialFlagEnum = z.enum(["bestaand", "nieuw", "geen"]);
export type MaterialFlag = z.infer<typeof MaterialFlagEnum>;

// ─────────────────────────────────────────────────────────────────────────────
// Werk-item (binnen een sectie)
// ─────────────────────────────────────────────────────────────────────────────

export const WorkItemV2Schema = z.object({
  description: z
    .string()
    .describe("Beschrijving van het werkitem, bijv. 'Herstraten 18m²'"),

  hours_estimated: z
    .number()
    .min(0)
    .describe("Geschatte uren voor dit werkitem door een 2-mans koppel"),

  material_flag: MaterialFlagEnum.describe(
    "bestaand = klant hergebruikt eigen materiaal (alleen arbeid); " +
      "nieuw = nieuw materiaal inkopen; " +
      "geen = geen materiaal nodig voor dit werkitem"
  ),

  material_qty: z
    .number()
    .optional()
    .describe("Hoeveelheid materiaal (bijv. 25 bij 'stuks opsluitbanden')"),

  material_unit: z
    .string()
    .optional()
    .describe("Eenheid van materiaal: 'm2', 'm3', 'stuks', 'meter', 'liter'"),

  material_desc: z
    .string()
    .optional()
    .describe("Beschrijving van het materiaal, bijv. 'Opsluitbanden 5/15 cm'"),

  work_type_key: z
    .string()
    .describe(
      "Machine-leesbare sleutel voor leerdata, bijv. 'herstraten', 'grond_voorbereiden', 'schutting_plaatsen'"
    ),
});

export type WorkItemV2 = z.infer<typeof WorkItemV2Schema>;

// ─────────────────────────────────────────────────────────────────────────────
// Werk-sectie (één fysiek gebied of fase)
// ─────────────────────────────────────────────────────────────────────────────

export const WorkSectionV2Schema = z.object({
  name: z
    .string()
    .describe(
      "Naam van het gebied of fase, bijv. 'Voortuin', 'Achtertuin', 'Oprit', 'Voorbereidend werk'"
    ),

  items: z.array(WorkItemV2Schema).describe("Werkitems in dit gebied"),
});

export type WorkSectionV2 = z.infer<typeof WorkSectionV2Schema>;

// ─────────────────────────────────────────────────────────────────────────────
// Geaggregeerd materiaal (onderaan, los van werkitems)
// ─────────────────────────────────────────────────────────────────────────────

export const AggregatedMaterialSchema = z.object({
  material_desc: z.string().describe("Beschrijving materiaal"),
  material_qty: z.number().describe("Totale hoeveelheid"),
  material_unit: z.string().describe("Eenheid"),
  source_items: z
    .array(z.string())
    .describe("Beschrijvingen van werkitems die dit materiaal genereerden"),
});

export type AggregatedMaterial = z.infer<typeof AggregatedMaterialSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Compleet v2 resultaat
// ─────────────────────────────────────────────────────────────────────────────

export const WorkBreakdownV2Schema = z.object({
  preparatory: WorkSectionV2Schema.describe(
    "Voorbereidend werk dat geldt voor het hele project (uitgraven, afvoeren, materiaal rijden)"
  ),

  areas: z
    .array(WorkSectionV2Schema)
    .describe("Één sectie per herkend fysiek gebied (voor, achter, oprit, etc.)"),

  materials: z
    .array(AggregatedMaterialSchema)
    .describe(
      "Alle benodigde nieuwe materialen geaggregeerd — alleen items met material_flag='nieuw'"
    ),

  project_summary: z
    .string()
    .describe("Korte samenvatting van het totale project in 1-2 zinnen"),

  total_hours_estimated: z
    .number()
    .describe("Totale geschatte uren (som van alle werkitems)"),
});

export type WorkBreakdownV2 = z.infer<typeof WorkBreakdownV2Schema>;

/**
 * Activity-mapper (F5 V1/V2 — Laag 1 → pipeline).
 *
 * Normaliseert de AI-activiteiten (`AIUnderstandingResult`) naar de
 * `PipelineActivity`-vorm die `runQuotePipeline` verwacht: leidt het oppervlak
 * af, en kiest de materiaalvoorkeur uit de genoemde materialen of de
 * omschrijving. Puur en testbaar.
 */

import type { Activity } from "../schemas/ai-understanding.schema";
import type { PipelineActivity } from "./quote-pipeline.service";

/** Leidt het oppervlak (m²) af uit de gedetecteerde afmetingen. */
function deriveArea(d: Activity["dimensions"]): number {
  if (d.area != null && d.area > 0) return d.area;
  if (d.length != null && d.width != null) return d.length * d.width;
  return 0;
}

/**
 * Kiest de materiaalvoorkeur: het eerste genoemde materiaal (= het bestratingsmateriaal).
 * Opsluitbanden, voegzand etc. worden al gedekt door vaste assembly-componenten;
 * alleen het hoofdmateriaal (klinkers, tegels, kasseien) gaat naar materialPreference.
 */
function deriveMaterialPreference(activity: Activity): string | undefined {
  if (activity.materials_mentioned.length > 0) {
    return activity.materials_mentioned[0];
  }
  return activity.description || undefined;
}

/** Mapt één AI-activiteit naar een pipeline-activiteit. */
export function toPipelineActivity(activity: Activity): PipelineActivity {
  const d = activity.dimensions;
  return {
    type: activity.type,
    action: activity.action,
    description: activity.description,
    area_m2: deriveArea(d),
    length_m: d.length,
    width_m: d.width,
    afgraafdiepte_cm: d.afgraafdiepte_cm,
    zanddikte_cm: d.zanddikte_cm,
    opsluiting_lengte_m: d.opsluiting_lengte_m,
    materialPreference: deriveMaterialPreference(activity),
  };
}

/** Mapt alle activiteiten uit een AI-resultaat. */
export function toPipelineActivities(activities: Activity[]): PipelineActivity[] {
  return activities.map(toPipelineActivity);
}

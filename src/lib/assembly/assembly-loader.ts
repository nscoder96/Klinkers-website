/**
 * Assembly-loader (Laag 2 — DB → engine-vorm).
 *
 * Laadt actieve assemblies + hun componenten uit Supabase en mapt ze naar de
 * vormen die `selectAssembly` (firing) en `expandAssembly` (expansie) verwachten.
 * De groepering/mapping zit in een pure helper (`groupComponents`) zodat ze
 * zonder DB getest kan worden; de DB-fetch is een dunne schil eromheen.
 */

import { createServerClient } from "../supabase/client";
import { Assembly } from "./assembly-firing.service";
import { AssemblyComponent } from "./assembly-expansion.service";

/** Rij uit `public.assemblies`. */
export interface AssemblyRow {
  id: string;
  name: string;
  trigger_category: string | null;
  trigger_action: string | null;
  unit: string;
  is_active: boolean;
}

/** Rij uit `public.assembly_components`. */
export interface AssemblyComponentRow {
  id: string;
  assembly_id: string;
  pricing_item_id: string | null;
  item_name_match: string | null;
  component_type: "arbeid" | "materiaal" | "materieel";
  quantity_per_unit: number;
  quantity_formula: string | null;
  is_optional: boolean;
  flag_when_missing: string | null;
  sort_order: number;
}

/** Een assembly met zijn componenten in engine-vorm, klaar voor expansie. */
export interface AssemblyWithComponents extends Assembly {
  components: AssemblyComponent[];
}

/** Mapt één DB-componentrij naar de engine-vorm (`AssemblyComponent`). */
function toComponent(row: AssemblyComponentRow): AssemblyComponent {
  return {
    item_name_match: row.item_name_match,
    component_type: row.component_type,
    quantity_formula: row.quantity_formula,
    quantity_per_unit: row.quantity_per_unit,
    is_optional: row.is_optional,
    flag_when_missing: row.flag_when_missing,
    sort_order: row.sort_order,
  };
}

/**
 * Pure groepering: koppelt componenten aan hun assembly en sorteert ze op
 * `sort_order`. Een assembly zonder componenten krijgt een lege lijst.
 */
export function groupComponents(
  assemblies: AssemblyRow[],
  components: AssemblyComponentRow[]
): AssemblyWithComponents[] {
  return assemblies.map((a) => ({
    id: a.id,
    name: a.name,
    trigger_category: a.trigger_category,
    trigger_action: a.trigger_action,
    unit: a.unit,
    is_active: a.is_active,
    components: components
      .filter((c) => c.assembly_id === a.id)
      .sort((x, y) => x.sort_order - y.sort_order)
      .map(toComponent),
  }));
}

/**
 * Laadt alle actieve assemblies + componenten uit de database.
 * Geeft een lege lijst terug als Supabase niet geconfigureerd is of de query
 * faalt (de aanroeper valt dan terug op handmatige afhandeling).
 */
export async function loadActiveAssemblies(): Promise<AssemblyWithComponents[]> {
  const supabase = createServerClient();
  if (!supabase) {
    console.warn("loadActiveAssemblies: Supabase niet geconfigureerd");
    return [];
  }

  const { data: assemblies, error: aErr } = await supabase
    .from("assemblies")
    .select("*")
    .eq("is_active", true);

  if (aErr || !assemblies) {
    console.warn("loadActiveAssemblies: kon assemblies niet laden:", aErr?.message);
    return [];
  }

  const ids = assemblies.map((a) => a.id);
  if (ids.length === 0) return [];

  const { data: components, error: cErr } = await supabase
    .from("assembly_components")
    .select("*")
    .in("assembly_id", ids);

  if (cErr || !components) {
    console.warn("loadActiveAssemblies: kon componenten niet laden:", cErr?.message);
    return [];
  }

  return groupComponents(
    assemblies as AssemblyRow[],
    components as AssemblyComponentRow[]
  );
}

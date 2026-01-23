/**
 * Rules Engine Types
 *
 * TypeScript interfaces for the garden element rules engine.
 * These define the structure of rules that validate and correct
 * work breakdowns before pricing.
 */

/**
 * Inclusion rule: Activity A already contains sub-activity B.
 * If both are present, B should be removed to prevent double-counting.
 *
 * Example: "ophogen_bestrating" includes "zandbed" when height >= 5cm
 */
export interface InclusionRule {
  id: string;
  parent_activity: string;
  included_activity: string;
  condition?: string;
  message: string;
}

/**
 * Exclusion rule: Activities A and B cannot coexist in the same scope.
 *
 * Example: "bestrating" and "gazon" cannot exist on the same surface
 */
export interface ExclusionRule {
  id: string;
  activity_a: string;
  activity_b: string;
  scope: "zelfde_oppervlak" | "zelfde_lijn" | "zelfde_locatie";
  type: "absoluut" | "conditioneel";
  message: string;
}

/**
 * Dependency rule: Activity A requires activity B.
 * If B is missing, it should be auto-added or a warning generated.
 *
 * Example: "bestrating" requires "opsluitbanden" unless adjacent to wall/fence
 */
export interface DependencyRule {
  id: string;
  activity: string;
  requires: string;
  requires_category: string;
  requires_line_type: "arbeid" | "materiaal";
  requires_unit: string;
  condition?: string;
  auto_add: boolean;
  message: string;
}

/**
 * Calculation rule: When activities interact, quantities need correction.
 *
 * Example: ophoogzand volume = (height - 0.05) * area when combined with bestrating
 */
export interface CalculationRule {
  id: string;
  trigger: string;
  formula: string;
  affects: string;
  message: string;
}

/**
 * A single correction applied by the rules engine.
 * Forms the audit trail for explainability.
 */
export interface RuleApplication {
  rule_id: string;
  rule_type: "inclusie" | "exclusie" | "afhankelijkheid" | "berekening";
  action: "removed" | "added" | "modified" | "warning";
  item_description: string;
  message: string;
}

/**
 * Result of running the rules engine on a work breakdown.
 * Contains the corrected items plus a complete audit trail.
 */
export interface RulesResult {
  items: import("../schemas/work-breakdown.schema").WorkItem[];
  activity_map: Record<string, import("../schemas/work-breakdown.schema").ActivityMetadata>;
  applied_rules: RuleApplication[];
  warnings: RuleApplication[];
  summary: string;
}

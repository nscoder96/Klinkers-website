/**
 * Rules Engine Service (Layer 2.5)
 *
 * Validates and corrects work breakdowns using domain-specific rules.
 * Positioned between Business Logic (Layer 2) and Pricing (Layer 3).
 *
 * Responsibilities:
 * 1. Remove items already included in parent activities (prevent double-counting)
 * 2. Detect conflicting items (logical impossibilities)
 * 3. Add missing required dependencies
 * 4. Produce an audit trail explaining every correction
 *
 * CRITICAL: This service NEVER generates prices.
 * It only adjusts items and quantities.
 */

import { WorkItem, WorkCategory, Unit, ActivityMetadata } from "../schemas/work-breakdown.schema";
import {
  RulesResult,
  RuleApplication,
  InclusionRule,
  DependencyRule,
} from "./types";
import {
  INCLUSION_RULES,
  EXCLUSION_RULES,
  DEPENDENCY_RULES,
} from "./garden-element-rules";

/**
 * Normalize a description for matching against rule keywords.
 * Strips "Arbeid: " prefix and lowercases.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/^arbeid:\s*/i, "").trim();
}

/**
 * Check if a work item's description matches a rule's activity keyword.
 * Uses substring matching to handle variations in descriptions.
 */
function matchesActivity(item: WorkItem, activityKeyword: string): boolean {
  const desc = normalize(item.description);
  const keyword = activityKeyword.toLowerCase();

  // Check if description contains the keyword or vice versa
  return desc.includes(keyword) || keyword.includes(desc);
}

/**
 * Check if a work item matches a category-based activity keyword.
 * First checks description, then falls back to category matching.
 */
function matchesActivityOrCategory(
  item: WorkItem,
  activityKeyword: string
): boolean {
  if (matchesActivity(item, activityKeyword)) return true;

  // Map keywords to categories for broader matching
  const keywordToCategory: Record<string, WorkCategory> = {
    bestrating: "bestrating",
    gazon: "gazon",
    vlonder: "vlonders",
    grind: "bestrating",
    schutting: "erfafscheiding",
    haag: "erfafscheiding",
    overkapping: "overkappingen",
    pergola: "overkappingen",
    tuinhuis: "overkappingen",
    carport: "overkappingen",
    vijver: "waterwerken",
    drainage: "waterwerken",
    klimplant: "beplanting",
    leiboom: "beplanting",
    boom: "beplanting",
    border: "beplanting",
    heester: "beplanting",
    ophogen: "grondwerk",
    ontgraven: "grondwerk",
  };

  const mappedCategory = keywordToCategory[activityKeyword.toLowerCase()];
  if (mappedCategory && item.category === mappedCategory) {
    // Only match on category if the description is close enough
    const desc = normalize(item.description);
    const keyword = activityKeyword.toLowerCase();
    // Check for partial overlap
    const keywordParts = keyword.split(/[\s_]+/);
    return keywordParts.some((part) => part.length > 3 && desc.includes(part));
  }

  return false;
}

/**
 * Apply inclusion rules: Remove items that are already included in parent activities.
 *
 * Example: If "ophogen" is present AND "zandbed" is present as separate items,
 * the "zandbed" item is removed because it's already part of ophogen.
 */
function applyInclusionRules(
  items: WorkItem[],
  rules: InclusionRule[]
): { items: WorkItem[]; applied: RuleApplication[] } {
  const applied: RuleApplication[] = [];
  let filteredItems = [...items];

  for (const rule of rules) {
    // Check if parent activity exists
    const hasParent = filteredItems.some((item) =>
      matchesActivityOrCategory(item, rule.parent_activity)
    );
    if (!hasParent) continue;

    // Find and remove included activities that shouldn't be separate
    const toRemove: number[] = [];
    for (let i = 0; i < filteredItems.length; i++) {
      const item = filteredItems[i];
      if (matchesActivity(item, rule.included_activity)) {
        toRemove.push(i);
        applied.push({
          rule_id: rule.id,
          rule_type: "inclusie",
          action: "removed",
          item_description: item.description,
          message: rule.message,
        });
      }
    }

    // Remove items in reverse order to preserve indices
    for (const idx of toRemove.reverse()) {
      filteredItems.splice(idx, 1);
    }
  }

  return { items: filteredItems, applied };
}

/**
 * Apply exclusion rules: Detect items that logically conflict.
 *
 * Since we don't have location data, we only flag conflicts between
 * items of the same surface-type categories. These produce warnings
 * rather than automatic removals.
 */
function applyExclusionRules(
  items: WorkItem[]
): { items: WorkItem[]; warnings: RuleApplication[] } {
  const warnings: RuleApplication[] = [];

  for (const rule of EXCLUSION_RULES) {
    const matchA = items.some((item) =>
      matchesActivityOrCategory(item, rule.activity_a)
    );
    const matchB = items.some((item) =>
      matchesActivityOrCategory(item, rule.activity_b)
    );

    if (matchA && matchB) {
      // For "same type" exclusions (e.g., two schuttingen), check if there
      // are actually two different items matching the same keyword
      if (rule.activity_a === rule.activity_b) {
        const matches = items.filter((item) =>
          matchesActivityOrCategory(item, rule.activity_a)
        );
        if (matches.length < 2) continue;
      }

      warnings.push({
        rule_id: rule.id,
        rule_type: "exclusie",
        action: "warning",
        item_description: `${rule.activity_a} + ${rule.activity_b}`,
        message: rule.message,
      });
    }
  }

  return { items, warnings };
}

/**
 * Apply dependency rules: Add missing required items.
 *
 * When an activity requires a dependency (e.g., bestrating requires opsluitbanden)
 * and that dependency is not already present, add it automatically.
 */
function applyDependencyRules(
  items: WorkItem[],
  rules: DependencyRule[]
): { items: WorkItem[]; applied: RuleApplication[] } {
  const applied: RuleApplication[] = [];
  const newItems: WorkItem[] = [];

  for (const rule of rules) {
    if (!rule.auto_add) continue;

    // Check if the triggering activity exists
    const hasTrigger = items.some((item) =>
      matchesActivityOrCategory(item, rule.activity)
    );
    if (!hasTrigger) continue;

    // Check if the required item already exists
    const hasRequired = items.some(
      (item) => matchesActivity(item, rule.requires)
    ) || newItems.some(
      (item) => matchesActivity(item, rule.requires)
    );
    if (hasRequired) continue;

    // Find the triggering item to inherit quantity from
    const triggerItem = items.find((item) =>
      matchesActivityOrCategory(item, rule.activity)
    );

    // Auto-add the missing dependency
    const newItem: WorkItem = {
      id: crypto.randomUUID(),
      category: rule.requires_category as WorkCategory,
      description: rule.requires,
      line_type: rule.requires_line_type,
      quantity: estimateQuantity(rule, triggerItem),
      unit: rule.requires_unit as Unit,
      source_activity_id: triggerItem?.source_activity_id,
      is_herstraten: false,
    };

    newItems.push(newItem);
    applied.push({
      rule_id: rule.id,
      rule_type: "afhankelijkheid",
      action: "added",
      item_description: rule.requires,
      message: rule.message,
    });
  }

  return { items: [...items, ...newItems], applied };
}

/**
 * Estimate a reasonable quantity for an auto-added dependency item.
 * Uses the trigger item's quantity as a basis.
 */
function estimateQuantity(
  rule: DependencyRule,
  triggerItem: WorkItem | undefined
): number {
  if (!triggerItem) return 1;

  // For "stuk" items (poeren, hemelwaterafvoer), estimate count
  if (rule.requires_unit === "stuk") {
    switch (rule.requires) {
      case "poeren": {
        // Estimate 4-6 poeren based on area
        if (triggerItem.unit === "m2") {
          return Math.max(4, Math.ceil(triggerItem.quantity / 2));
        }
        return 4;
      }
      case "hemelwaterafvoer":
      case "afvoerpunt":
      case "fundering":
      case "klimsteun":
      case "leiframe":
      case "vijvervlies":
        return 1;
      default:
        return 1;
    }
  }

  // For "meter" items (opsluitbanden, randafwerking), derive from area
  if (rule.requires_unit === "meter") {
    if (triggerItem.unit === "m2" && triggerItem.quantity > 0) {
      // Estimate perimeter from area (assume roughly square)
      const side = Math.sqrt(triggerItem.quantity);
      return Math.ceil(side * 4);
    }
    if (triggerItem.unit === "meter") {
      return triggerItem.quantity;
    }
    return 1;
  }

  // For "m2" items (worteldoek), match the trigger's area
  if (rule.requires_unit === "m2") {
    if (triggerItem.unit === "m2") {
      return triggerItem.quantity;
    }
    return 1;
  }

  return triggerItem.quantity;
}

/**
 * Main entry point: Validate and correct a work breakdown.
 *
 * Applies all rule types in order:
 * 1. Inclusion rules (remove duplicates)
 * 2. Exclusion rules (detect conflicts)
 * 3. Dependency rules (add missing items)
 *
 * Returns corrected items with full audit trail.
 */
export function validateWorkBreakdown(
  items: WorkItem[],
  activityMap: Record<string, ActivityMetadata> = {}
): RulesResult {
  const allApplied: RuleApplication[] = [];
  const allWarnings: RuleApplication[] = [];

  // Step 1: Apply inclusion rules (remove items already included in parent)
  const inclusionResult = applyInclusionRules(items, INCLUSION_RULES);
  allApplied.push(...inclusionResult.applied);

  // Step 2: Apply exclusion rules (detect conflicts)
  const exclusionResult = applyExclusionRules(inclusionResult.items);
  allWarnings.push(...exclusionResult.warnings);

  // Step 3: Apply dependency rules (add missing required items)
  const dependencyResult = applyDependencyRules(
    exclusionResult.items,
    DEPENDENCY_RULES
  );
  allApplied.push(...dependencyResult.applied);

  // Generate summary
  const removedCount = allApplied.filter((a) => a.action === "removed").length;
  const addedCount = allApplied.filter((a) => a.action === "added").length;
  const warningCount = allWarnings.length;

  let summary = "Regelengine validatie: ";
  const parts: string[] = [];
  if (removedCount > 0)
    parts.push(`${removedCount} dubbele items verwijderd`);
  if (addedCount > 0)
    parts.push(`${addedCount} ontbrekende items toegevoegd`);
  if (warningCount > 0)
    parts.push(`${warningCount} waarschuwingen`);
  if (parts.length === 0) parts.push("geen correcties nodig");
  summary += parts.join(", ") + ".";

  return {
    items: dependencyResult.items,
    activity_map: activityMap,
    applied_rules: allApplied,
    warnings: allWarnings,
    summary,
  };
}

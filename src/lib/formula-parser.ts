/**
 * Formula Parser for Quote Calculations
 *
 * Supports simple mathematical expressions with variables.
 * Variables are denoted with curly braces: {variable_name}
 *
 * Supported operators: +, -, *, /, (, )
 * Supported functions: Math.ceil, Math.floor, Math.round, Math.max, Math.min
 *
 * Examples:
 * - "{sections} + 1" => If sections = 7, result = 8 (posts for fence)
 * - "{sections} * 4" => If sections = 7, result = 28 (L-brackets)
 * - "{area} * 5" => If area = 35, result = 175 (kg sand per m²)
 */

export interface FormulaVariables {
  [key: string]: number | boolean;
}

/**
 * Evaluates a simple mathematical formula with variable substitution.
 *
 * @param formula - The formula string with {variable} placeholders
 * @param variables - Object containing variable values
 * @returns The calculated result as a number
 * @throws Error if formula is invalid or contains disallowed operations
 */
export function evaluateFormula(formula: string, variables: FormulaVariables): number {
  if (!formula || typeof formula !== 'string') {
    return 0;
  }

  let expression = formula.trim();

  // Replace all variables with their values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    // Convert booleans to numbers (true = 1, false = 0)
    const numValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
    expression = expression.replace(regex, String(numValue));
  }

  // Check if there are any unreplaced variables
  const unreplacedVars = expression.match(/\{[^}]+\}/g);
  if (unreplacedVars) {
    console.warn(`Formula contains undefined variables: ${unreplacedVars.join(', ')}`);
    // Replace undefined variables with 0
    expression = expression.replace(/\{[^}]+\}/g, '0');
  }

  // Validate the expression - only allow safe characters
  // Allow: digits, operators, parentheses, decimal points, spaces, and Math functions
  const safePattern = /^[\d\s+\-*/().]+$/;

  // Remove Math function calls for validation, then check
  const withoutMath = expression
    .replace(/Math\.ceil/g, '')
    .replace(/Math\.floor/g, '')
    .replace(/Math\.round/g, '')
    .replace(/Math\.max/g, '')
    .replace(/Math\.min/g, '');

  if (!safePattern.test(withoutMath)) {
    throw new Error(`Invalid formula: contains disallowed characters in "${formula}"`);
  }

  try {
    // Use Function constructor for sandboxed evaluation
    // Only provide Math as a safe global
    const result = new Function('Math', `"use strict"; return (${expression})`)(Math);

    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      return 0;
    }

    return result;
  } catch (error) {
    console.error(`Error evaluating formula "${formula}":`, error);
    return 0;
  }
}

/**
 * Checks if a condition formula evaluates to true.
 *
 * @param condition - The condition string (e.g., "{has_gate} == true")
 * @param variables - Object containing variable values
 * @returns Boolean result of the condition
 */
export function evaluateCondition(condition: string | undefined | null, variables: FormulaVariables): boolean {
  if (!condition || typeof condition !== 'string') {
    return true; // No condition means always apply
  }

  let expression = condition.trim();

  // Replace all variables with their values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    if (typeof value === 'boolean') {
      expression = expression.replace(regex, String(value));
    } else {
      expression = expression.replace(regex, String(value));
    }
  }

  // Check for unreplaced variables
  const unreplacedVars = expression.match(/\{[^}]+\}/g);
  if (unreplacedVars) {
    // If condition references undefined variables, return false
    return false;
  }

  // Validate - only allow safe comparison patterns
  const safeConditionPattern = /^[\d\s+\-*/().=!<>&|true false]+$/i;
  if (!safeConditionPattern.test(expression)) {
    console.error(`Invalid condition: "${condition}"`);
    return false;
  }

  try {
    const result = new Function(`"use strict"; return (${expression})`)();
    return Boolean(result);
  } catch (error) {
    console.error(`Error evaluating condition "${condition}":`, error);
    return false;
  }
}

/**
 * Parses a formula to extract required variable names.
 *
 * @param formula - The formula string
 * @returns Array of variable names found in the formula
 */
export function extractVariables(formula: string): string[] {
  if (!formula) return [];

  const matches = formula.match(/\{([^}]+)\}/g);
  if (!matches) return [];

  // Remove duplicates and return
  return [...new Set(matches.map(m => m.slice(1, -1)))];
}

/**
 * Validates a formula syntax without evaluating it.
 *
 * @param formula - The formula to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateFormula(formula: string): { isValid: boolean; error?: string } {
  if (!formula || typeof formula !== 'string') {
    return { isValid: false, error: 'Formule is leeg' };
  }

  // Replace variables with placeholder numbers for syntax check
  const testExpression = formula.replace(/\{[^}]+\}/g, '1');

  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of testExpression) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return { isValid: false, error: 'Ongeldige haakjes: te veel sluitende haakjes' };
    }
  }
  if (parenCount !== 0) {
    return { isValid: false, error: 'Ongeldige haakjes: niet alle haakjes zijn gesloten' };
  }

  // Try to evaluate with test values
  try {
    const safePattern = /^[\d\s+\-*/().]+$/;
    const withoutMath = testExpression
      .replace(/Math\.ceil/g, '')
      .replace(/Math\.floor/g, '')
      .replace(/Math\.round/g, '')
      .replace(/Math\.max/g, '')
      .replace(/Math\.min/g, '');

    if (!safePattern.test(withoutMath)) {
      return { isValid: false, error: 'Formule bevat ongeldige tekens' };
    }

    new Function('Math', `"use strict"; return (${testExpression})`)(Math);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Ongeldige formule syntax' };
  }
}

// Re-export types for convenience
export type { FormulaVariables as Variables };

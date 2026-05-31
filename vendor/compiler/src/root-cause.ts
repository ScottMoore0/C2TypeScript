/**
 * Phase 9.7-9.8: Root cause analysis.
 * Given a divergent function, traces down to the exact expression
 * that produces the wrong value.
 */

import type { TraceDivergence } from "./trace-diff.js";

export interface RootCause {
  /** The AST node kind at the divergence point */
  nodeKind: string;
  /** The operand types involved */
  operandTypes: string[];
  /** The operator (if applicable) */
  operator?: string;
  /** What went wrong */
  symptom: string;
  /** Expected value from C++ */
  expectedValue: string;
  /** Actual value from TypeScript */
  actualValue: string;
  /** Line number in the generated TypeScript */
  line: number;
  /** The function where the divergence occurs */
  func: string;
}

/**
 * Diagnose a divergence by analyzing the expected and actual values.
 * Returns a root cause with enough information to look up a fix.
 */
export function diagnoseFromDivergence(div: TraceDivergence): RootCause {
  const expected = div.cppEntry?.value ?? "";
  const actual = div.tsEntry?.value ?? "";
  const func = div.cppEntry?.func ?? div.tsEntry?.func ?? "unknown";

  // Detect common symptom patterns from value comparison
  const symptom = classifySymptom(expected, actual);

  return {
    nodeKind: inferNodeKind(symptom),
    operandTypes: inferOperandTypes(expected, actual),
    operator: inferOperator(symptom),
    symptom,
    expectedValue: expected,
    actualValue: actual,
    line: div.traceIndex, // approximate — would need source mapping for exact line
    func,
  };
}

/**
 * Classify the symptom from expected vs actual values.
 */
function classifySymptom(expected: string, actual: string): string {
  const expNum = Number(expected);
  const actNum = Number(actual);

  if (!isNaN(expNum) && !isNaN(actNum)) {
    // Both are numbers
    if (Number.isInteger(expNum) && !Number.isInteger(actNum)) {
      return "float_instead_of_int";
    }
    if (expNum === (actNum | 0) && actNum !== expNum) {
      return "int_overflow_signed";
    }
    if (expNum === (actNum >>> 0) && actNum !== expNum) {
      return "int_overflow_unsigned";
    }
    if (Math.abs(expNum - actNum) === 1) {
      return "off_by_one";
    }
    if (expNum === Math.trunc(actNum) && actNum !== expNum) {
      return "float_to_int_truncation";
    }
    if (expNum === -actNum) {
      return "sign_error";
    }
    if ((expNum === 1 && actual === "true") || (expNum === 0 && actual === "false")) {
      return "boolean_to_int";
    }
    return "numeric_mismatch";
  }

  if (expected === "true" || expected === "false" || actual === "true" || actual === "false") {
    return "boolean_mismatch";
  }

  if (expected === "undefined" || actual === "undefined") {
    return "missing_initialization";
  }

  if (expected === "null" || actual === "null") {
    return "null_mismatch";
  }

  if (expected === "" && actual !== "") {
    return "extra_output";
  }

  if (expected !== "" && actual === "") {
    return "missing_output";
  }

  return "unknown";
}

/**
 * Infer the likely AST node kind from the symptom.
 */
function inferNodeKind(symptom: string): string {
  const map: Record<string, string> = {
    float_instead_of_int: "BinaryOperator",
    int_overflow_signed: "BinaryOperator",
    int_overflow_unsigned: "BinaryOperator",
    off_by_one: "ArraySubscriptExpr",
    float_to_int_truncation: "ImplicitCastExpr",
    sign_error: "UnaryOperator",
    boolean_to_int: "ImplicitCastExpr",
    boolean_mismatch: "BinaryOperator",
    missing_initialization: "VarDecl",
    null_mismatch: "DeclRefExpr",
    numeric_mismatch: "BinaryOperator",
  };
  return map[symptom] ?? "Unknown";
}

/**
 * Infer operand types from the values.
 */
function inferOperandTypes(expected: string, actual: string): string[] {
  const types: string[] = [];
  for (const v of [expected, actual]) {
    const n = Number(v);
    if (!isNaN(n)) {
      types.push(Number.isInteger(n) ? "int" : "double");
    } else if (v === "true" || v === "false") {
      types.push("bool");
    } else {
      types.push("unknown");
    }
  }
  return types;
}

/**
 * Infer the likely operator from the symptom.
 */
function inferOperator(symptom: string): string | undefined {
  const map: Record<string, string> = {
    float_instead_of_int: "/",
    int_overflow_signed: "+",
    int_overflow_unsigned: "+",
    sign_error: "-",
  };
  return map[symptom];
}

import type { ComparisonMode } from "../config/types.js";

export interface TextDifference {
  index: number;
  line: number;
  column: number;
  expectedFragment: string;
  actualFragment: string;
}

export interface ComparisonCheckResult {
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  difference?: TextDifference;
  message?: string;
}

export interface ComparisonResult {
  mode: ComparisonMode;
  passed: boolean;
  checks: ComparisonCheckResult[];
  firstDifference?: TextDifference;
}

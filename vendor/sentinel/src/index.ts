// Sentinel — Oracle + Self-Healing Loop
export { runProgram, compareOutput, compareOutputWithTolerance, type RunResult, type CompareResult } from "./oracle.js";
export { applyFixes, simpleFix, selfHealLoop, BUILTIN_FIXES, type Fix, type FixResult } from "./fix-engine.js";

// Advanced comparators
export {
  type ComparisonResult,
  compareExact, compareNormalized, compareBinary,
  compareExitCode, compareStderr, compareFloatTolerance,
  comparePerformance, compareUnorderedLines
} from "./comparators.js";

/**
 * Phase L3: Regression test generator.
 * Auto-generates minimal test cases from discovered fixes.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { FixPattern } from "./fix-pattern-db.js";

export interface GeneratedTest {
  name: string;
  cppCode: string;
  expectedTsCode: string;
  expectedOutput: string;
}

/**
 * Generate a minimal C++ test case that triggers a fix pattern.
 */
export function generateTestCase(pattern: FixPattern): GeneratedTest | null {
  const generators: Record<string, () => GeneratedTest> = {
    "integer_truncation": () => ({
      name: `fix_int_div_${pattern.id}`,
      cppCode: `#include <cstdio>\nint main() { int x = 5 / 2; printf("%d\\n", x); return 0; }`,
      expectedTsCode: `const x = Math.trunc(5 / 2); console.log(x);`,
      expectedOutput: "2",
    }),
    "unsigned_wrap": () => ({
      name: `fix_unsigned_${pattern.id}`,
      cppCode: `#include <cstdio>\n#include <cstdint>\nint main() { uint32_t x = 0xFFFFFFFF; x += 1; printf("%u\\n", x); return 0; }`,
      expectedTsCode: `let x = 0xFFFFFFFF; x = (x + 1) >>> 0; console.log(x);`,
      expectedOutput: "0",
    }),
    "signed_wrap": () => ({
      name: `fix_signed_${pattern.id}`,
      cppCode: `#include <cstdio>\n#include <climits>\nint main() { int x = INT_MAX; x += 1; printf("%d\\n", x); return 0; }`,
      expectedTsCode: `let x = 2147483647; x = (x + 1) | 0; console.log(x);`,
      expectedOutput: "-2147483648",
    }),
    "struct_clone": () => ({
      name: `fix_struct_copy_${pattern.id}`,
      cppCode: `#include <cstdio>\nstruct Point { int x, y; };\nint main() { Point a = {1,2}; Point b = a; b.x = 10; printf("%d %d\\n", a.x, b.x); return 0; }`,
      expectedTsCode: `class Point { x = 0; y = 0; }\nconst a = Object.assign(new Point(), {x:1,y:2});\nconst b = structuredClone(a); b.x = 10;\nconsole.log(a.x, b.x);`,
      expectedOutput: "1 10",
    }),
    "boolean_to_int": () => ({
      name: `fix_bool_int_${pattern.id}`,
      cppCode: `#include <cstdio>\nint main() { bool b = true; int x = b + 5; printf("%d\\n", x); return 0; }`,
      expectedTsCode: `const b = true; const x = Number(b) + 5; console.log(x);`,
      expectedOutput: "6",
    }),
  };

  const gen = generators[pattern.fixType];
  return gen ? gen() : null;
}

/**
 * Write generated tests to disk.
 */
export function writeTests(tests: GeneratedTest[], testDir: string): number {
  const dir = join(testDir, "auto");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let written = 0;
  for (const test of tests) {
    if (!test) continue;
    const cppPath = join(dir, `${test.name}.cpp`);
    const tsPath = join(dir, `${test.name}.expected.ts`);
    const outPath = join(dir, `${test.name}.expected.out`);

    writeFileSync(cppPath, test.cppCode);
    writeFileSync(tsPath, test.expectedTsCode);
    writeFileSync(outPath, test.expectedOutput);
    written++;
  }

  return written;
}

/**
 * Generate and write tests for all patterns in the database.
 */
export function generateAllTests(testDir: string): number {
  const { loadPatterns } = require("./fix-pattern-db.js");
  const patterns = loadPatterns();
  const tests = patterns.map(generateTestCase).filter(Boolean);
  return writeTests(tests as GeneratedTest[], testDir);
}

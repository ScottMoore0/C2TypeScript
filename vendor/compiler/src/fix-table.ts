/**
 * fix-table.ts - Central registry for code fixes/transforms
 */

export interface Diagnosis {
  nodeKind: string;       // e.g., "BinaryOperator"
  operandTypes: string[]; // e.g., ["int", "int"]
  operator?: string;      // e.g., "/"
  symptom: string;        // e.g., "float_instead_of_int"
  expectedValue?: string;
  actualValue?: string;
  line: number;
}

export interface Fix {
  name: string;
  pattern: (d: Diagnosis) => boolean;
  transform: (code: string, line: number) => string;
  description: string;
}

export class FixTable {
  private fixes: Fix[] = [];

  register(fix: Fix): void {
    this.fixes.push(fix);
  }

  lookup(diagnosis: Diagnosis): Fix | null {
    for (const fix of this.fixes) {
      if (fix.pattern(diagnosis)) {
        return fix;
      }
    }
    return null;
  }

  apply(fix: Fix, code: string, line: number): string {
    return fix.transform(code, line);
  }

  getAllFixes(): Fix[] {
    return [...this.fixes];
  }
}

export function createFixTable(): FixTable {
  return new FixTable();
}

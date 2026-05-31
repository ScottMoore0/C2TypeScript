/**
 * Phase 12.5: Progress reporter for self-correction.
 */

export class ProgressReporter {
  private startTime = Date.now();
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  phase(name: string): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.error(`[${elapsed}s] ${name}`);
  }

  file(name: string, status: string): void {
    console.error(`  ${status === "OK" ? "[OK]  " : status === "FAIL" ? "[FAIL]" : "[SKIP]"} ${name}`);
  }

  fix(iteration: number, description: string): void {
    if (this.verbose) {
      console.error(`    fix #${iteration}: ${description}`);
    }
  }

  summary(results: { total: number; passed: number; failed: number; fixed: number }): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.error(`\nCompleted in ${elapsed}s: ${results.passed}/${results.total} passed, ${results.fixed} auto-fixed, ${results.failed} failed`);
  }
}

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export interface TestCommand {
  name: string;
  command: string;
  args: string[];
  workingDir: string;
}

export function detectTestSuite(projectDir: string): TestCommand[] {
  const tests: TestCommand[] = [];

  // CMake: parse add_test() from CMakeLists.txt
  const cmakePath = join(projectDir, 'CMakeLists.txt');
  if (existsSync(cmakePath)) {
    const cmake = readFileSync(cmakePath, 'utf-8');
    const testRegex = /add_test\s*\(\s*NAME\s+(\S+)\s+COMMAND\s+(.+?)\)/g;
    let m;
    while ((m = testRegex.exec(cmake)) !== null) {
      const parts = m[2].trim().split(/\s+/);
      tests.push({ name: m[1], command: parts[0], args: parts.slice(1), workingDir: projectDir });
    }
    // Also check for simple add_test(name command ...) form
    const simpleTestRegex = /add_test\s*\(\s*(\S+)\s+(.+?)\)/g;
    while ((m = simpleTestRegex.exec(cmake)) !== null) {
      const parts = m[2].trim().split(/\s+/);
      tests.push({ name: m[1], command: parts[0], args: parts.slice(1), workingDir: projectDir });
    }
  }

  // Makefile: look for 'check' or 'test' target
  const makefilePath = join(projectDir, 'Makefile');
  if (existsSync(makefilePath)) {
    const makefile = readFileSync(makefilePath, 'utf-8');
    if (/^(check|test)\s*:/m.test(makefile)) {
      tests.push({ name: 'make-check', command: 'make', args: ['check'], workingDir: projectDir });
    }
  }

  // test.sh or run_tests.sh
  for (const scriptName of ['test.sh', 'run_tests.sh', 'tests/run.sh']) {
    const scriptPath = join(projectDir, scriptName);
    if (existsSync(scriptPath)) {
      tests.push({ name: scriptName, command: 'bash', args: [scriptPath], workingDir: projectDir });
    }
  }

  // tests/ directory with individual test files
  const testsDir = join(projectDir, 'tests');
  if (existsSync(testsDir)) {
    try {
      const entries = readdirSync(testsDir);
      for (const entry of entries) {
        if (entry.match(/^test_.*\.(c|cpp)$/) || entry.match(/.*_test\.(c|cpp)$/)) {
          tests.push({ name: entry, command: 'gcc', args: [join(testsDir, entry), '-o', '/dev/null'], workingDir: projectDir });
        }
      }
    } catch {}
  }

  return tests;
}

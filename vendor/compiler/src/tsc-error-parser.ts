import { spawnSync } from "child_process";

export interface TscError {
  file: string;
  line: number;
  col: number;
  code: number;
  message: string;
}

const ERROR_PATTERN = /^(.+?)\((\d+),(\d+)\):\s+error\s+TS(\d+):\s+(.+)$/;

export function runTsc(projectDir: string): TscError[] {
  const result = spawnSync("npx", ["tsc", "--noEmit", "--pretty", "false"], {
    cwd: projectDir,
    shell: true,
    encoding: "utf-8",
    timeout: 60_000,
  });

  const output = (result.stdout || "") + "\n" + (result.stderr || "");
  const errors: TscError[] = [];

  for (const line of output.split(/\r?\n/)) {
    const m = line.match(ERROR_PATTERN);
    if (m) {
      errors.push({
        file: m[1],
        line: parseInt(m[2], 10),
        col: parseInt(m[3], 10),
        code: parseInt(m[4], 10),
        message: m[5],
      });
    }
  }

  errors.sort((a, b) => {
    const fc = a.file.localeCompare(b.file);
    if (fc !== 0) return fc;
    return a.line - b.line;
  });

  return errors;
}

export function groupByFile(errors: TscError[]): Map<string, TscError[]> {
  const map = new Map<string, TscError[]>();
  for (const err of errors) {
    let list = map.get(err.file);
    if (!list) {
      list = [];
      map.set(err.file, list);
    }
    list.push(err);
  }
  return map;
}

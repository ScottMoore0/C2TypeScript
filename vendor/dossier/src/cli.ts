import { handleIngest } from "./commands/ingest.js";
import { handleListTus } from "./commands/list-tus.js";
import { handleValidate } from "./commands/validate.js";
import { renderHelp } from "./help.js";
import { DOSSIER_VERSION } from "./version.js";

export interface CliResult {
  exitCode: number;
  output: string;
}

const KNOWN_COMMANDS = new Set([
  "ingest",
  "show",
  "list-tus",
  "validate",
  "graph"
]);

export async function runCli(argv: string[]): Promise<CliResult> {
  if (argv.length === 0 || argv.includes("--help")) {
    return { exitCode: 0, output: renderHelp() };
  }
  if (argv.includes("--version")) {
    return { exitCode: 0, output: DOSSIER_VERSION };
  }

  const first = argv[0]!;
  const rest = argv.slice(1);

  switch (first) {
    case "ingest":
      return handleIngest(rest);
    case "validate":
      return handleValidate(rest);
    case "list-tus":
      return handleListTus(rest);
    case "show":
    case "graph":
      return {
        exitCode: 2,
        output: `Command '${first}' is not yet implemented in the 0.1.0 skeleton.`
      };
    default:
      if (KNOWN_COMMANDS.has(first)) {
        return {
          exitCode: 2,
          output: `Command '${first}' is not yet implemented in the 0.1.0 skeleton.`
        };
      }
      return {
        exitCode: 1,
        output: `Unknown arguments: ${argv.join(" ")}\n\n${renderHelp()}`
      };
  }
}

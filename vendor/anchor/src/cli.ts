import { handleInspect } from "./commands/inspect.js";
import { handleListRegions } from "./commands/list-regions.js";
import { handleLookup } from "./commands/lookup.js";
import { handleVerify } from "./commands/verify.js";
import { renderHelp } from "./help.js";
import { ANCHOR_VERSION } from "./version.js";

export interface CliResult {
  exitCode: number;
  output: string;
}

export async function runCli(argv: string[]): Promise<CliResult> {
  if (argv.length === 0 || argv.includes("--help")) {
    return { exitCode: 0, output: renderHelp() };
  }
  if (argv.includes("--version")) {
    return { exitCode: 0, output: ANCHOR_VERSION };
  }

  const first = argv[0]!;
  const rest = argv.slice(1);

  switch (first) {
    case "inspect":
      return handleInspect(rest);
    case "lookup":
      return handleLookup(rest);
    case "verify":
      return handleVerify(rest);
    case "list-regions":
      return handleListRegions(rest);
    case "diff":
      return {
        exitCode: 2,
        output: `Command '${first}' is not yet implemented in the 0.1.0 skeleton.`
      };
    default:
      return {
        exitCode: 1,
        output: `Unknown arguments: ${argv.join(" ")}\n\n${renderHelp()}`
      };
  }
}

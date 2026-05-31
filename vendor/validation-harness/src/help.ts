export function renderHelp(): string {
  return [
    "validation-harness",
    "",
    "Usage:",
    "  validation-harness [--help] [--version]",
    "  validation-harness list [--config path] [--id value] [--tag value] [--suite value] [--language value]",
    "  validation-harness run [--config path] [--id value] [--tag value] [--suite value] [--language value] [--concurrency value]",
    "  validation-harness compare --run-id value [--against-run-id value] [--config path] [--ci]",
    "  validation-harness show --run-id value --fixture value [--config path] [--json]",
    "  validation-harness report [--run-id value] [--config path] [--json] [--html] [--artifact-dir path]",
    "",
    "Commands:",
    "  --help       Show this help text",
    "  --version    Show the harness version",
    "  list         List discovered fixtures",
    "  run          Execute selected fixtures and persist a run result",
    "  compare      Compare one stored run against a previous stored run",
    "  show         Show one stored fixture result",
    "  report       Show a stored run summary"
  ].join("\n");
}

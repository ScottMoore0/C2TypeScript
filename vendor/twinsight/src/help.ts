export function renderHelp(): string {
  return [
    "twinsight",
    "",
    "Usage:",
    "  twinsight [--help] [--version]",
    "  twinsight list [--config path] [--id value] [--tag value] [--suite value] [--language value]",
    "  twinsight run [--config path] [--id value] [--tag value] [--suite value] [--language value] [--concurrency value]",
    "  twinsight compare --run-id value [--against-run-id value] [--config path] [--ci]",
    "  twinsight show --run-id value --fixture value [--config path] [--json]",
    "  twinsight report [--run-id value] [--config path] [--json] [--html] [--artifact-dir path]",
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

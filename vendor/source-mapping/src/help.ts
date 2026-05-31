export function renderHelp(): string {
  return [
    "source-mapping",
    "",
    "Source maps and AI-amendability tooling for translation pipelines.",
    "The forensics layer that traces translated output back to its source.",
    "",
    "Usage:",
    "  source-mapping [--help] [--version]",
    "  source-mapping inspect <map>",
    "  source-mapping lookup <map> --target <file:line:col>",
    "  source-mapping lookup <map> --source <file:line:col>",
    "  source-mapping lookup <map> --region <region-id>",
    "  source-mapping verify <map>",
    "  source-mapping diff <map-a> <map-b>",
    "  source-mapping list-regions <map> [--format text|json]",
    "",
    "Commands:",
    "  --help          Show this help text",
    "  --version       Show the Anchor version",
    "  inspect         Pretty-print a summary of a SourceMap",
    "  lookup          Walk a SourceMap from one position to its mapped counterpart",
    "  verify          Validate a stored SourceMap against the schema",
    "  diff            Structurally diff two SourceMaps",
    "  list-regions    List every region in a SourceMap by id and span"
  ].join("\n");
}

export function renderHelp(): string {
  return [
    "anchor",
    "",
    "Source maps and AI-amendability tooling for translation pipelines.",
    "The forensics layer that traces translated output back to its source.",
    "",
    "Usage:",
    "  anchor [--help] [--version]",
    "  anchor inspect <map>",
    "  anchor lookup <map> --target <file:line:col>",
    "  anchor lookup <map> --source <file:line:col>",
    "  anchor lookup <map> --region <region-id>",
    "  anchor verify <map>",
    "  anchor diff <map-a> <map-b>",
    "  anchor list-regions <map> [--format text|json]",
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

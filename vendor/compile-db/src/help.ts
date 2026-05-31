export function renderHelp(): string {
  return [
    "compile-db",
    "",
    "Ingest and normalise the real build context of C/C++ projects.",
    "",
    "Usage:",
    "  compile-db [--help] [--version]",
    "  compile-db ingest <project-path> [--output path]",
    "  compile-db show --tu <source-file> [--config path]",
    "  compile-db list-tus [--config path]",
    "  compile-db validate <build-context-file>",
    "  compile-db graph --tu <source-file> [--format dot]",
    "",
    "Commands:",
    "  --help       Show this help text",
    "  --version    Show the Dossier version",
    "  ingest       Ingest a C/C++ project and emit a normalised BuildContext",
    "  show         Show details for one translation unit",
    "  list-tus     List all translation units in a stored BuildContext",
    "  validate     Validate a stored BuildContext against the schema",
    "  graph        Emit an include graph for one translation unit"
  ].join("\n");
}

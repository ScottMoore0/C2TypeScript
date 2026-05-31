export function renderHelp(): string {
  return [
    "dossier",
    "",
    "Ingest and normalise the real build context of C/C++ projects.",
    "",
    "Usage:",
    "  dossier [--help] [--version]",
    "  dossier ingest <project-path> [--output path]",
    "  dossier show --tu <source-file> [--config path]",
    "  dossier list-tus [--config path]",
    "  dossier validate <build-context-file>",
    "  dossier graph --tu <source-file> [--format dot]",
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

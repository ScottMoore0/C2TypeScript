import type { ExtensionsRecord } from "./extensions.js";

// CD-6: Macro value canonicalization.
//
// Rules (binding):
//   - Values are stored in compiler-canonical form (post `-dM -E`)
//   - Leading and trailing whitespace are trimmed
//   - Internal whitespace runs are collapsed to a single space
//   - Backslash-newline continuations are resolved to a single line
//   - Function-like macros store `parameters: string[]` separately from `value`
//   - Object-like macros with no body store `value: ""`, never undefined
//   - Variadic macros use `"..."` as the final parameter name

export type MacroKind = "object" | "function";
export type MacroOrigin = "builtin" | "cli" | "header";

export interface MacroDefinition {
  name: string;
  kind: MacroKind;
  parameters?: readonly string[];
  value: string;
  origin: MacroOrigin;
  extensions?: ExtensionsRecord;
}

export interface MacroEnvironment {
  // Keyed by macro name. Dossier uses a map rather than an array so that
  // downstream tools can do O(1) lookup by name, and so that canonical JSON
  // serialisation naturally alpha-orders the definitions.
  definitions: Record<string, MacroDefinition>;
  extensions?: ExtensionsRecord;
}

export function canonicalizeMacroValue(value: string): string {
  // Resolve line continuations first (backslash-newline -> single space).
  const unCont = value.replace(/\\\r?\n/g, " ");
  // Collapse internal whitespace runs.
  const collapsed = unCont.replace(/\s+/g, " ");
  // Trim leading/trailing whitespace.
  return collapsed.trim();
}

export function makeObjectMacro(
  name: string,
  rawValue: string,
  origin: MacroOrigin = "header"
): MacroDefinition {
  return {
    name,
    kind: "object",
    value: canonicalizeMacroValue(rawValue),
    origin
  };
}

export function makeFunctionMacro(
  name: string,
  parameters: readonly string[],
  rawValue: string,
  origin: MacroOrigin = "header"
): MacroDefinition {
  return {
    name,
    kind: "function",
    parameters: [...parameters],
    value: canonicalizeMacroValue(rawValue),
    origin
  };
}

// Parse a -D<body> CLI flag body into a MacroDefinition. The body is either
// "NAME" (object macro with empty value) or "NAME=value" (object macro with
// the given value). CLI flags never define function-like macros - that
// would require quoting parentheses through the shell and is not supported.
export function parseDefineBody(
  body: string,
  origin: MacroOrigin = "cli"
): MacroDefinition {
  const eq = body.indexOf("=");
  if (eq === -1) {
    return {
      name: body,
      kind: "object",
      value: "",
      origin
    };
  }
  return {
    name: body.slice(0, eq),
    kind: "object",
    value: canonicalizeMacroValue(body.slice(eq + 1)),
    origin
  };
}

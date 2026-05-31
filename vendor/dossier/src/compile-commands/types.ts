// DS-021-seed: a minimal, pre-canonicalization representation of a compile_commands.json
// entry. Paths are kept verbatim from the source file; CD-1 canonicalization happens
// in a later phase. The `arguments` field is always an array even when the source used
// the `command` string form (the tokeniser splits it for us).

export interface CompileCommandEntry {
  file: string;
  directory: string;
  arguments: string[];
  output?: string;
}

// DS-023-seed: a raw, unordered, pre-canonicalization bucket for parsed compiler flags.
// This is the intermediate form produced directly from an arguments array. CD-8 and
// CD-12 later transform this into the canonical FlagSet used by downstream tooling.

export type IncludeKind = "I" | "isystem" | "iquote" | "idirafter";

export interface IncludeFlag {
  kind: IncludeKind;
  path: string;
}

export interface DefineFlag {
  name: string;
  value?: string;
}

export interface RawFlagSet {
  includes: IncludeFlag[];
  defines: DefineFlag[];
  undefines: string[];
  standard?: string;
  warnings: string[];
  features: string[];
  optimization?: string;
  targetTriple?: string;
  archOptions: string[];
  dependencyFileTarget?: string;
  other: string[];
}

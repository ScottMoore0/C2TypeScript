import { CompileCommandError } from "../errors.js";
import { tokenizeShellCommand } from "./tokenize.js";
import type { CompileCommandEntry } from "./types.js";

const UTF8_BOM = "\uFEFF";

// DS-040/041/044/046/047/048: parse an LLVM-style compile_commands.json blob into
// normalised entries. Paths are kept verbatim at this layer (no canonicalization -
// that happens later, gated on CD-1). The parser is deliberately strict about JSON:
// trailing commas and JSON5 extensions are rejected with a clear error, because
// compile_commands.json is an LLVM standard with a strict JSON spec.

export function parseCompileCommandsJson(text: string): CompileCommandEntry[] {
  const stripped = text.startsWith(UTF8_BOM) ? text.slice(1) : text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CompileCommandError(
      `Failed to parse compile_commands.json: ${message}`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new CompileCommandError(
      "compile_commands.json must be a JSON array at the top level"
    );
  }

  return parsed.map((entry, index) => normaliseEntry(entry, index));
}

function normaliseEntry(raw: unknown, index: number): CompileCommandEntry {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new CompileCommandError(
      `compile_commands[${index}] must be an object`
    );
  }
  const obj = raw as Record<string, unknown>;

  const file = obj.file;
  if (typeof file !== "string" || file.length === 0) {
    throw new CompileCommandError(
      `compile_commands[${index}].file must be a non-empty string`
    );
  }

  const directory = obj.directory;
  if (typeof directory !== "string" || directory.length === 0) {
    throw new CompileCommandError(
      `compile_commands[${index}].directory must be a non-empty string`
    );
  }

  const commandField = obj.command;
  const argumentsField = obj.arguments;

  let argv: string[];
  if (Array.isArray(argumentsField)) {
    argv = argumentsField.map((arg, argIndex) => {
      if (typeof arg !== "string") {
        throw new CompileCommandError(
          `compile_commands[${index}].arguments[${argIndex}] must be a string`
        );
      }
      return arg;
    });
  } else if (typeof commandField === "string") {
    argv = tokenizeShellCommand(commandField);
  } else {
    throw new CompileCommandError(
      `compile_commands[${index}] must provide either 'arguments' (array of string) or 'command' (string)`
    );
  }

  if (argv.length === 0) {
    throw new CompileCommandError(
      `compile_commands[${index}] resolved to an empty argv`
    );
  }

  const entry: CompileCommandEntry = {
    file,
    directory,
    arguments: argv
  };

  if (typeof obj.output === "string" && obj.output.length > 0) {
    entry.output = obj.output;
  }

  return entry;
}

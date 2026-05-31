import type { DefineFlag, IncludeFlag, IncludeKind, RawFlagSet } from "./types.js";

// DS-050..DS-057: parse a compiler argv into a RawFlagSet.
//
// Operates on a pre-tokenised argv (the output of parseCompileCommandsJson).
// The first argument is the compiler driver itself (e.g. "/usr/bin/gcc") and is
// NOT included in the flag set - callers who need it can grab argv[0] separately.
//
// The parser is GCC/Clang-flavoured. MSVC cl.exe uses a completely different flag
// syntax and is handled by a separate module in a later phase.

const GLUED_INCLUDE_KINDS: readonly { prefix: string; kind: IncludeKind }[] = [
  { prefix: "-I", kind: "I" }
];

const SPACED_INCLUDE_KINDS: readonly { flag: string; kind: IncludeKind }[] = [
  { flag: "-I", kind: "I" },
  { flag: "-isystem", kind: "isystem" },
  { flag: "-iquote", kind: "iquote" },
  { flag: "-idirafter", kind: "idirafter" }
];

export function parseCompilerFlags(argv: readonly string[]): RawFlagSet {
  const flags: RawFlagSet = {
    includes: [],
    defines: [],
    undefines: [],
    warnings: [],
    features: [],
    archOptions: [],
    other: []
  };

  // Skip the compiler driver itself.
  let i = 1;
  while (i < argv.length) {
    const arg = argv[i]!;

    // DS-050/051: include path flags (both glued and spaced forms).
    const includeMatch = matchInclude(argv, i);
    if (includeMatch) {
      flags.includes.push(includeMatch.flag);
      i += includeMatch.consumed;
      continue;
    }

    // DS-052: -D<name>[=<value>]
    if (arg.startsWith("-D")) {
      const body = arg === "-D" ? argv[++i] : arg.slice(2);
      if (typeof body === "string" && body.length > 0) {
        flags.defines.push(parseDefineBody(body));
      }
      i++;
      continue;
    }

    // DS-053: -U<name>
    if (arg.startsWith("-U")) {
      const body = arg === "-U" ? argv[++i] : arg.slice(2);
      if (typeof body === "string" && body.length > 0) {
        flags.undefines.push(body);
      }
      i++;
      continue;
    }

    // DS-054: -std=<standard>
    if (arg.startsWith("-std=")) {
      flags.standard = arg.slice("-std=".length);
      i++;
      continue;
    }

    // DS-055: -W<warning-body>
    if (arg.startsWith("-W") && arg.length > 2) {
      flags.warnings.push(arg.slice(2));
      i++;
      continue;
    }

    // DS-056: -f<feature>
    if (arg.startsWith("-f") && arg.length > 2) {
      flags.features.push(arg.slice(2));
      i++;
      continue;
    }

    // DS-057: -O<level>
    if (arg.startsWith("-O") && arg.length > 1) {
      flags.optimization = arg.slice(2) || "1";
      i++;
      continue;
    }

    // DS-058: -target <triple> or --target=<triple>
    if (arg === "-target" && i + 1 < argv.length) {
      flags.targetTriple = argv[i + 1];
      i += 2;
      continue;
    }
    if (arg.startsWith("--target=")) {
      flags.targetTriple = arg.slice("--target=".length);
      i++;
      continue;
    }

    // DS-059: -m<arch-option> (e.g. -m64, -march=native, -mtune=generic)
    if (arg.startsWith("-m") && arg.length > 2) {
      flags.archOptions.push(arg.slice(2));
      i++;
      continue;
    }

    // DS-060: -MD / -MMD / -MF <path> / -MT <target>
    if (arg === "-MD" || arg === "-MMD" || arg === "-MP") {
      flags.other.push(arg);
      i++;
      continue;
    }
    if (arg === "-MF" || arg === "-MT" || arg === "-MQ") {
      if (i + 1 < argv.length) {
        if (arg === "-MF") {
          flags.dependencyFileTarget = argv[i + 1];
        }
        i += 2;
        continue;
      }
    }

    // Unclassified - accumulate verbatim.
    flags.other.push(arg);
    i++;
  }

  return flags;
}

function matchInclude(
  argv: readonly string[],
  i: number
): { flag: IncludeFlag; consumed: number } | null {
  const arg = argv[i]!;

  for (const spaced of SPACED_INCLUDE_KINDS) {
    if (arg === spaced.flag) {
      const next = argv[i + 1];
      if (typeof next === "string" && next.length > 0) {
        return {
          flag: { kind: spaced.kind, path: next },
          consumed: 2
        };
      }
      return null;
    }
  }

  for (const glued of GLUED_INCLUDE_KINDS) {
    if (arg.startsWith(glued.prefix) && arg.length > glued.prefix.length) {
      return {
        flag: { kind: glued.kind, path: arg.slice(glued.prefix.length) },
        consumed: 1
      };
    }
  }

  return null;
}

function parseDefineBody(body: string): DefineFlag {
  const eq = body.indexOf("=");
  if (eq === -1) {
    return { name: body };
  }
  return {
    name: body.slice(0, eq),
    value: body.slice(eq + 1)
  };
}

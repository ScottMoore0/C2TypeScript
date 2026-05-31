// NC-6: C-linker-style symbol resolution.
// Implements C17 §6.2.2 linkage semantics:
//   - External linkage: definitions across TUs merge; strong beats weak.
//   - Internal linkage (static): each TU has its own independent entity.
//   - Weak symbols (GCC __attribute__((weak))): a weak definition is used
//     only if no strong definition of the same name exists across TUs.
//
// Reference:
//   C17 §6.2.2 "Linkages of identifiers" paragraph 3 — identifiers declared
//   with the storage-class specifier `static` at file scope have internal
//   linkage, so the same identifier in two translation units denotes two
//   distinct entities.

/** Linkage of a definition. */
export type Linkage = "strong" | "weak";

/**
 * Storage class keywords that affect linkage. We track `inline` for
 * completeness (inline definitions have complex ODR-like semantics in C17
 * §6.7.4) but treat them as extern for linkage unless paired with `static`.
 */
export type StorageClass = "extern" | "static" | "auto" | "register" | "inline";

/** A definition of a symbol in a translation unit. */
export interface SymbolEntry {
  /** Symbol name as it appears in the source. */
  name: string;
  /** Translation unit that defines this symbol (e.g., file path or TU id). */
  tu: string;
  /** Linkage strength. Defaults to "strong". */
  linkage?: Linkage;
  /** Storage class. Defaults to "extern" (external linkage). */
  storageClass?: StorageClass;
  /** Optional payload — any consumer-specific metadata. */
  meta?: unknown;
}

/** Normalise an entry so linkage/storageClass have concrete values. */
function normalise(e: SymbolEntry): Required<Pick<SymbolEntry, "linkage" | "storageClass">> & SymbolEntry {
  return {
    ...e,
    linkage: e.linkage ?? "strong",
    storageClass: e.storageClass ?? "extern",
  };
}

/**
 * Given all definitions of a single name across TUs, return the one the C
 * linker would pick. Assumes all inputs share the same `name`.
 *
 * Rules (C17 + GCC weak extension):
 *   1. If ≥ 1 strong definition exists → return the first strong.
 *   2. Else if ≥ 1 weak definition exists → return the first weak.
 *   3. Else → undefined (no definitions to choose from).
 */
export function resolveWeak(symbols: SymbolEntry[]): SymbolEntry | undefined {
  if (symbols.length === 0) return undefined;
  const firstStrong = symbols.find(s => (s.linkage ?? "strong") === "strong");
  if (firstStrong) return firstStrong;
  const firstWeak = symbols.find(s => s.linkage === "weak");
  return firstWeak;
}

/**
 * De-duplicate a flat list of symbol entries according to C linkage rules.
 *
 * For each name:
 *   - `static` definitions (internal linkage) are kept PER-TU and renamed
 *     with a TU-derived prefix so they cannot collide. The rename is applied
 *     to the returned entry's `name` field; callers that care about the
 *     original source name can recover it from the entry's `tu` + suffix.
 *   - Non-static (extern/inline/auto/register) definitions are unified
 *     across TUs via `resolveWeak`, yielding a single canonical entry.
 *   - `static` in one TU does NOT collide with `extern` of the same name
 *     in another TU — they are independent entities.
 */
export function dedupeStaticSymbols(symbols: SymbolEntry[]): SymbolEntry[] {
  // Partition by name.
  const byName = new Map<string, SymbolEntry[]>();
  for (const s of symbols) {
    if (!byName.has(s.name)) byName.set(s.name, []);
    byName.get(s.name)!.push(s);
  }

  const out: SymbolEntry[] = [];

  for (const [name, entries] of byName) {
    // Split static vs extern-like entries.
    const statics: SymbolEntry[] = [];
    const externs: SymbolEntry[] = [];
    for (const e of entries) {
      const sc = e.storageClass ?? "extern";
      if (sc === "static") statics.push(e);
      else externs.push(e);
    }

    // Each static keeps its own identity; rename to avoid collision.
    for (const s of statics) {
      out.push({ ...s, name: mangleStatic(name, s.tu) });
    }

    // Non-static defs are unified across TUs by linkage rules.
    if (externs.length > 0) {
      const chosen = resolveWeak(externs);
      if (chosen) out.push(chosen);
    }
  }

  return out;
}

/** Build a TU-prefixed internal name for a static symbol. */
export function mangleStatic(name: string, tu: string): string {
  // Strip path separators and extension to form a stable suffix.
  const slash = Math.max(tu.lastIndexOf("/"), tu.lastIndexOf("\\"));
  const base = (slash >= 0 ? tu.substring(slash + 1) : tu).replace(/\.[^.]+$/, "");
  const safe = base.replace(/[^A-Za-z0-9_]/g, "_");
  return `${name}_tu_${safe}`;
}

/**
 * High-level pipeline combining dedup + weak resolution.
 *
 * Returns:
 *   - resolved:   final chosen definition per unique (name, TU-for-static) pair
 *   - weakSet:    names that resolved to a weak definition (for isWeakSymbol)
 *   - undefinedNames: names referenced via inputs with NO usable definition
 *     (empty here; populated by the caller from the reference side).
 */
export interface ResolveResult {
  resolved: SymbolEntry[];
  weakNames: Set<string>;
}

/**
 * Resolve a set of symbol definitions across TUs. This is the integration
 * entry point: it applies static dedup first (so per-TU statics are separated)
 * and weak resolution to the remaining extern definitions.
 */
export function resolveSymbols(symbols: SymbolEntry[]): ResolveResult {
  const resolved = dedupeStaticSymbols(symbols);

  // Track which resolved non-static entries came from a weak pick.
  // We re-partition extern defs by original name to detect this.
  const byName = new Map<string, SymbolEntry[]>();
  for (const s of symbols) {
    const sc = s.storageClass ?? "extern";
    if (sc === "static") continue;
    if (!byName.has(s.name)) byName.set(s.name, []);
    byName.get(s.name)!.push(s);
  }

  const weakNames = new Set<string>();
  for (const [name, entries] of byName) {
    const chosen = resolveWeak(entries);
    if (chosen && (chosen.linkage ?? "strong") === "weak") {
      weakNames.add(name);
    }
  }

  return { resolved, weakNames };
}

/**
 * Create an `isWeakSymbol` predicate bound to a resolved result. Returns a
 * function consumers can use to check whether a given external symbol was
 * satisfied by a weak definition.
 */
export function makeIsWeakSymbol(result: ResolveResult): (name: string) => boolean {
  return (name: string) => result.weakNames.has(name);
}

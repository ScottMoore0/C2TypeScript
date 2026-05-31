// Mirage POSIX <dlfcn.h> — dynamic library loader (registry-backed).
//
// IEEE Std 1003.1-2017 <dlfcn.h>:
//   void *dlopen(const char *file, int mode);   // open shared object
//   void *dlsym (void *handle, const char *name); // resolve symbol
//   int   dlclose(void *handle);                 // 0 on success
//   char *dlerror(void);                         // last error, NULL after read
//
// BRIDGE: dlfcn-registry — JavaScript modules are statically linked at
// translation time, so we cannot truly load a shared object at runtime. This
// module exposes a registry shim: a host program (or pre-translation glue)
// calls register(name, exportsObj) to wire a TS module under a logical
// "library name"; dlopen(name) then returns that registered handle.
//
// Flag bits RTLD_LAZY / RTLD_NOW / RTLD_GLOBAL / RTLD_LOCAL / RTLD_NODELETE
// are accepted but ignored — JS has no separable lazy/eager binding step.
//
// dlerror() follows POSIX semantics: returns the most recent error string and
// clears it (subsequent calls return null until another call fails). This
// matches the per-thread error pointer described in IEEE Std 1003.1-2017.
//
// dlopen(NULL, ...) returns a handle to the "main executable"; we model this
// as an exports object that is the host's globalThis, so dlsym(handle, name)
// against it can resolve top-level translated functions.

/** RTLD_* flag values from IEEE Std 1003.1-2017 <dlfcn.h>. Values are
 *  platform-defined; these match common Linux/glibc values. The runtime
 *  ignores the bits — they are exported only so translated branches like
 *  `dlopen(p, RTLD_NOW | RTLD_GLOBAL)` type-check and round-trip. */
export const RTLD_LAZY = 0x0001;
export const RTLD_NOW = 0x0002;
export const RTLD_NOLOAD = 0x0004;
export const RTLD_GLOBAL = 0x0100;
export const RTLD_LOCAL = 0x0000;
export const RTLD_NODELETE = 0x1000;

/** RTLD_DEFAULT — pseudo-handle for the main executable's symbol set
 *  (POSIX). We use null because dlsym(null, name) routes through globalThis. */
export const RTLD_DEFAULT: unknown = null;
/** RTLD_NEXT — the "next" object in the load order. Single-namespace
 *  fallback to RTLD_DEFAULT in this registry-backed runtime. */
export const RTLD_NEXT: unknown = -1;

/** Opaque dlfcn handle — POSIX `void*` returned by dlopen, consumed by
 *  dlsym/dlclose. Carries a reference to the registered exports object plus
 *  the logical name (for diagnostics). */
export interface DlHandle {
  readonly __dlfcn: true;
  readonly name: string | null;
  readonly exports: Record<string, unknown>;
}

interface DlfcnState {
  registry: Map<string, Record<string, unknown>>;
  lastError: string | null;
}

const _state: DlfcnState = {
  registry: new Map(),
  lastError: null,
};

/** Register a TS module's exports object under a logical library name. The
 *  name is what translated C code will pass to dlopen(). Multiple registrations
 *  under the same name overwrite — this matches the Linux glibc behaviour of
 *  re-dlopen returning the same handle. */
export function register(name: string, exportsObj: Record<string, unknown>): void {
  _state.registry.set(name, exportsObj);
}

/** Remove a previously-registered library. Subsequent dlopen(name) calls will
 *  fail with a recorded error retrievable via dlerror(). */
export function unregister(name: string): void {
  _state.registry.delete(name);
}

/** Reset the registry and the last-error slot. Test-only. */
export function _reset(): void {
  _state.registry.clear();
  _state.lastError = null;
}

/** POSIX dlopen(file, mode). Returns a handle on success, null on failure
 *  (caller should consult dlerror). The mode flags are accepted but ignored. */
export function dlopen(file: string | null, _mode: number): DlHandle | null {
  if (file === null) {
    _state.lastError = null;
    // Main-executable handle: exports == globalThis. dlsym against this
    // resolves any top-level translated function name.
    return {
      __dlfcn: true,
      name: null,
      exports: globalThis as unknown as Record<string, unknown>,
    };
  }
  // Try exact name first, then strip ".so"/".so.N"/".dylib"/".dll".
  let mod = _state.registry.get(file);
  if (mod === undefined) {
    const stripped = file.replace(/\.(so(?:\.[0-9]+)*|dylib|dll)$/i, "");
    if (stripped !== file) mod = _state.registry.get(stripped);
  }
  if (mod === undefined) {
    _state.lastError =
      file +
      ": cannot open shared object: not registered (call posix-runtime.dlfcn.register(name, exports) first)";
    return null;
  }
  _state.lastError = null;
  return { __dlfcn: true, name: file, exports: mod };
}

/** POSIX dlsym(handle, name). Returns the value of the named symbol in the
 *  handle's exports map, or null on miss. The miss is recorded as an error
 *  retrievable via dlerror(). */
export function dlsym(handle: DlHandle | null, name: string): unknown {
  if (handle === null || handle === undefined) {
    _state.lastError = "dlsym: handle is NULL";
    return null;
  }
  const v = handle.exports?.[name];
  if (v === undefined || v === null) {
    _state.lastError = "undefined symbol: " + name;
    return null;
  }
  _state.lastError = null;
  return v;
}

/** POSIX dlclose(handle). Always returns 0 success in this runtime — there
 *  is no real release path; registry entries persist for re-open. */
export function dlclose(_handle: DlHandle | null): number {
  _state.lastError = null;
  return 0;
}

/** POSIX dlerror(). Returns the most recent error string and clears it.
 *  Subsequent calls without an intervening failure return null. */
export function dlerror(): string | null {
  const e = _state.lastError;
  _state.lastError = null;
  return e;
}

// BRIDGE: dlfcn-registry — translator-emitted plug-in registration entry.
//
// The translator's `--plugins=name:path,...` flag emits a preamble of the
// form:
//
//   import * as __plugin_NAME from "<path>";
//   __cpp_register_plugin("NAME", __plugin_NAME);
//
// at the top of the program entry point. Each `__cpp_register_plugin(name,
// module)` call wires a TS module under a logical "library name" that the
// translated C code can later open with `dlopen(name)`. This closes the
// real-world cross-cutting blocker for OpenSSL ENGINE / mbedTLS PSA driver
// registration / nginx dynamic modules where the C source uses
// dlopen("plugin.so") + dlsym("plugin_init") at runtime — modules cannot
// be loaded dynamically in JS, but a translate-time manifest can pre-bind
// every plug-in the program needs.
//
// The function is also installed on `globalThis` so that emitted preambles
// can call it without an `import` statement (matching the convention used
// for `__cpp_*` runtime hooks elsewhere in the translator).

/** Register a TS module under a logical plug-in name. Equivalent to
 *  `register(name, module)` but exposed under the canonical translator
 *  hook name `__cpp_register_plugin` and installed on globalThis so the
 *  translator-emitted preamble can call it at module init. */
export function __cpp_register_plugin(
  name: string,
  module: Record<string, unknown> | { default?: Record<string, unknown> },
): void {
  // Tolerate both a "namespace import" object (every export becomes a key)
  // and a single-default-export module by collapsing the default into the
  // top level. The translator emits `import * as foo from "..."` so the
  // namespace shape is the common case; default-export collapse handles
  // hand-written plug-ins authored in CommonJS-default style.
  const ns = module as Record<string, unknown>;
  const exports: Record<string, unknown> =
    ns && typeof ns === "object" && ns.default && typeof ns.default === "object"
      ? { ...(ns.default as Record<string, unknown>), ...ns }
      : ns;
  _state.registry.set(name, exports);
}

// Install on globalThis so the translator's emitted preamble can call it
// without importing dlfcn. Use defineProperty + non-enumerable so this
// doesn't show up in for/in iteration of globalThis.
try {
  const g = globalThis as unknown as Record<string, unknown>;
  if (typeof g["__cpp_register_plugin"] !== "function") {
    Object.defineProperty(g, "__cpp_register_plugin", {
      value: __cpp_register_plugin,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
} catch {
  // Sandboxed globalThis (rare); plug-in preamble must `import` directly.
}

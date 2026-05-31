/**
 * S_sys4: Pre-Translation Codebase Audit Tool.
 *
 * Parses all source files with Clang and reports:
 * 1. Foreign function calls (not defined in project, not in stdlib/POSIX)
 * 2. Entry point classification (batch, blocking-event-loop, server-loop, library-event-loop)
 * 3. File paths accessed (string literals passed to fopen, open, SDL_LoadBMP, etc.)
 * 4. Cross-language bridges (lua_*, luaL_*, tolua_* calls)
 * 5. Summary of coverage gaps
 */

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const CLANG = process.env.CLANG_PATH ?? "C:/Program Files/LLVM/bin/clang";

// ═══════════════════════════════════════════════
// Known standard library / POSIX function names
// ═══════════════════════════════════════════════

const C_STDLIB_FUNCTIONS = new Set([
  // stdio.h
  "printf", "fprintf", "sprintf", "snprintf", "scanf", "fscanf", "sscanf",
  "fopen", "fclose", "fread", "fwrite", "fseek", "ftell", "rewind", "feof",
  "ferror", "fflush", "fgets", "fputs", "fgetc", "fputc", "getc", "putc",
  "getchar", "putchar", "puts", "gets", "ungetc", "perror", "remove", "rename",
  "tmpfile", "tmpnam", "setbuf", "setvbuf", "vprintf", "vfprintf", "vsprintf",
  "vsnprintf", "vfscanf", "vscanf", "vsscanf", "freopen", "clearerr",
  // stdlib.h
  "malloc", "calloc", "realloc", "free", "abort", "exit", "atexit", "at_quick_exit",
  "quick_exit", "_Exit", "getenv", "system", "atoi", "atof", "atol", "atoll",
  "strtol", "strtoll", "strtoul", "strtoull", "strtof", "strtod", "strtold",
  "rand", "srand", "abs", "labs", "llabs", "div", "ldiv", "lldiv",
  "bsearch", "qsort", "mblen", "mbtowc", "wctomb", "mbstowcs", "wcstombs",
  // string.h
  "memcpy", "memmove", "memset", "memcmp", "memchr",
  "strcpy", "strncpy", "strcat", "strncat", "strcmp", "strncmp",
  "strchr", "strrchr", "strstr", "strtok", "strlen", "strerror", "strpbrk",
  "strspn", "strcspn", "strcoll", "strxfrm",
  // math.h
  "sin", "cos", "tan", "asin", "acos", "atan", "atan2",
  "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
  "exp", "exp2", "expm1", "log", "log2", "log10", "log1p",
  "pow", "sqrt", "cbrt", "hypot", "fabs", "fmod", "remainder",
  "ceil", "floor", "round", "trunc", "nearbyint", "rint",
  "fmin", "fmax", "fdim", "fma",
  "copysign", "nan", "nanf", "nextafter", "nexttoward",
  "isnan", "isinf", "isfinite", "isnormal", "fpclassify", "signbit",
  "sinf", "cosf", "tanf", "asinf", "acosf", "atanf", "atan2f",
  "sinhf", "coshf", "tanhf", "expf", "exp2f", "logf", "log2f", "log10f",
  "powf", "sqrtf", "cbrtf", "fabsf", "fmodf", "ceilf", "floorf", "roundf",
  "truncf", "fminf", "fmaxf",
  // ctype.h
  "isdigit", "isalpha", "isalnum", "isspace", "isupper", "islower",
  "isprint", "ispunct", "iscntrl", "isgraph", "isxdigit", "toupper", "tolower",
  // time.h
  "time", "clock", "difftime", "mktime", "asctime", "ctime", "gmtime",
  "localtime", "strftime", "clock_gettime", "timespec_get",
  // signal.h
  "signal", "raise",
  // setjmp.h
  "setjmp", "longjmp",
  // stdarg.h (macros, but sometimes appear as calls)
  "va_start", "va_end", "va_arg", "va_copy",
  // assert.h
  "assert",
  // errno (not a function but sometimes referenced)
  // locale.h
  "setlocale", "localeconv",
  // wchar.h
  "wprintf", "swprintf", "fwprintf", "wscanf", "fwscanf", "swscanf",
  "wcscpy", "wcsncpy", "wcscat", "wcsncat", "wcscmp", "wcsncmp",
  "wcschr", "wcsrchr", "wcsstr", "wcstok", "wcslen", "wmemcpy", "wmemmove",
  "wmemset", "wmemcmp", "wmemchr", "wcsftime", "wcstol", "wcstod",
  // C++ specific
  "operator new", "operator delete", "__cxa_throw", "__cxa_begin_catch",
  "__cxa_end_catch", "__cxa_rethrow", "__cxa_allocate_exception",
]);

const POSIX_FUNCTIONS = new Set([
  // unistd.h
  "fork", "exec", "execv", "execve", "execvp", "execl", "execlp", "_exit",
  "pipe", "dup", "dup2", "close", "read", "write", "lseek",
  "getpid", "getppid", "getuid", "getgid", "geteuid", "getegid",
  "chdir", "getcwd", "chown", "chmod", "link", "unlink", "symlink",
  "readlink", "rmdir", "mkdir", "access", "alarm", "pause", "sleep", "usleep",
  "isatty", "ttyname", "sysconf", "pathconf", "fpathconf", "truncate", "ftruncate",
  // sys/stat.h
  "stat", "fstat", "lstat", "mknod", "mkfifo",
  // fcntl.h
  "open", "creat", "fcntl",
  // sys/socket.h
  "socket", "bind", "listen", "accept", "connect", "send", "recv",
  "sendto", "recvfrom", "setsockopt", "getsockopt", "shutdown",
  "getaddrinfo", "freeaddrinfo", "getnameinfo",
  "gethostbyname", "gethostbyaddr", "inet_addr", "inet_ntoa",
  "inet_pton", "inet_ntop", "htons", "htonl", "ntohs", "ntohl",
  // sys/select.h
  "select", "pselect",
  // sys/epoll.h
  "epoll_create", "epoll_create1", "epoll_ctl", "epoll_wait",
  // sys/wait.h
  "wait", "waitpid",
  // sys/mman.h — POSIX.1-2017 §3
  "mmap", "munmap", "mprotect", "msync", "madvise", "posix_madvise",
  "mlock", "munlock",
  // pthread.h
  "pthread_create", "pthread_join", "pthread_detach", "pthread_exit",
  "pthread_mutex_init", "pthread_mutex_destroy", "pthread_mutex_lock",
  "pthread_mutex_unlock", "pthread_mutex_trylock", "pthread_mutex_timedlock",
  "pthread_cond_init", "pthread_cond_destroy", "pthread_cond_wait",
  "pthread_cond_signal", "pthread_cond_broadcast", "pthread_cond_timedwait",
  "pthread_rwlock_init", "pthread_rwlock_destroy", "pthread_rwlock_rdlock",
  "pthread_rwlock_wrlock", "pthread_rwlock_unlock",
  "pthread_rwlock_tryrdlock", "pthread_rwlock_trywrlock",
  "pthread_rwlock_timedrdlock", "pthread_rwlock_timedwrlock",
  "pthread_barrier_init", "pthread_barrier_destroy", "pthread_barrier_wait",
  "pthread_spin_init", "pthread_spin_destroy",
  "pthread_spin_lock", "pthread_spin_unlock", "pthread_spin_trylock",
  "pthread_key_create", "pthread_setspecific", "pthread_getspecific",
  // POSIX.1-2017 §3 pthread_attr_* thread attribute objects
  "pthread_attr_init", "pthread_attr_destroy",
  "pthread_attr_getstacksize", "pthread_attr_setstacksize",
  "pthread_attr_getdetachstate", "pthread_attr_setdetachstate",
  "pthread_attr_getguardsize", "pthread_attr_setguardsize",
  "pthread_attr_getschedpolicy", "pthread_attr_setschedpolicy",
  "pthread_attr_getschedparam", "pthread_attr_setschedparam",
  "pthread_attr_getinheritsched", "pthread_attr_setinheritsched",
  "pthread_attr_getscope", "pthread_attr_setscope",
  "pthread_self", "pthread_equal", "pthread_once",
  // POSIX.1-2017 §3 + §2.9.5 thread cancellation
  "pthread_cancel", "pthread_setcancelstate", "pthread_setcanceltype",
  "pthread_testcancel",
  // POSIX.1-2017 §3 [signal.h] per-thread signal handling
  "pthread_kill", "pthread_sigmask",
  // POSIX.1-2017 §3 pthread_atfork + per-thread scheduling
  "pthread_atfork",
  "pthread_setschedparam", "pthread_getschedparam", "pthread_setschedprio",
  // POSIX.1-2017 §3 [sched.h] sched_yield (process/thread yield).
  "sched_yield",
  // glibc/musl (non-POSIX) pthread_yield (deprecated synonym for
  // sched_yield) + pthread_setname_np / pthread_getname_np thread-name
  // primitives.
  "pthread_yield", "pthread_setname_np", "pthread_getname_np",
  // dirent.h
  "opendir", "readdir", "closedir", "rewinddir",
  // dlfcn.h
  "dlopen", "dlclose", "dlsym", "dlerror",
  // sys/ioctl.h
  "ioctl",
  // poll.h
  "poll",
  // semaphore.h
  "sem_init", "sem_destroy", "sem_wait", "sem_post", "sem_trywait",
  "sem_timedwait", "sem_getvalue",
  "sem_open", "sem_close", "sem_unlink",
  // signal.h (POSIX extensions)
  "sigaction", "sigprocmask", "sigemptyset", "sigfillset", "sigaddset",
  "sigdelset", "sigismember", "kill", "sigwait",
  // POSIX.1-2017 §3 [signal.h] per-thread signal handling (also in pthread.h)
  "pthread_kill", "pthread_sigmask",
]);

// GCC/Clang builtins
const BUILTIN_FUNCTIONS = new Set([
  "__builtin_expect", "__builtin_clz", "__builtin_ctz", "__builtin_popcount",
  "__builtin_bswap16", "__builtin_bswap32", "__builtin_bswap64",
  "__builtin_ffs", "__builtin_parity", "__builtin_abs", "__builtin_labs",
  "__builtin_llabs", "__builtin_memcmp", "__builtin_memcpy", "__builtin_memset",
  "__builtin_trap", "__builtin_unreachable", "__builtin_inf", "__builtin_huge_val",
  "__builtin_huge_valf", "__builtin_nan", "__builtin_nanf",
  "__builtin_return_address", "__builtin_frame_address",
  "__builtin_va_start", "__builtin_va_end", "__builtin_va_copy",
  "__builtin_constant_p", "__builtin_types_compatible_p",
  "__builtin_offsetof", "__builtin_prefetch",
  "__atomic_load", "__atomic_load_n", "__atomic_store", "__atomic_store_n",
  "__atomic_exchange", "__atomic_exchange_n",
  "__atomic_compare_exchange_strong", "__atomic_compare_exchange_weak",
  "__atomic_add_fetch", "__atomic_sub_fetch", "__atomic_fetch_add", "__atomic_fetch_sub",
  "__atomic_fetch_and", "__atomic_fetch_or", "__atomic_fetch_xor",
  "__atomic_thread_fence", "__atomic_signal_fence",
  "__sync_fetch_and_add", "__sync_fetch_and_sub",
  "__sync_val_compare_and_swap", "__sync_bool_compare_and_swap",
  "__sync_synchronize",
]);

// Functions whose arguments may contain file paths
const FILE_ACCESS_FUNCTIONS = new Set([
  "fopen", "freopen", "open", "creat", "access", "stat", "lstat",
  "remove", "rename", "unlink", "mkdir", "rmdir", "chdir",
  "dlopen", "opendir", "readlink", "symlink", "link",
  // SDL/media
  "SDL_LoadBMP", "SDL_LoadBMP_RW", "IMG_Load", "IMG_LoadTexture",
  "Mix_LoadWAV", "Mix_LoadMUS", "TTF_OpenFont",
  "SDL_RWFromFile", "SDL_LoadWAV",
  // general
  "LoadLibrary", "LoadLibraryA", "LoadLibraryW",
  "CreateFileA", "CreateFileW",
]);

// Library event loop functions
const LIBRARY_EVENT_LOOP_FUNCTIONS = new Set([
  "SDL_MainLoop", "gtk_main", "gtk_main_quit",
  "glutMainLoop", "glfwPollEvents", "glfwSwapBuffers",
  "QApplication::exec", "app.exec", "XNextEvent",
  "CFRunLoopRun", "dispatch_main",
  "uv_run", "ev_run", "event_base_dispatch",
]);

// ═══════════════════════════════════════════════
// AST Walking
// ═══════════════════════════════════════════════

interface AuditResult {
  foreignFunctions: Map<string, ForeignFunctionInfo>;
  entryPointClass: string;
  entryPointDetails: string;
  filePathsAccessed: FilePathAccess[];
  crossLanguageBridges: CrossLanguageBridge[];
  definedFunctions: Set<string>;
  calledFunctions: Set<string>;
}

interface ForeignFunctionInfo {
  name: string;
  callCount: number;
  calledFrom: string[];
  headerHint: string;
  hasShimInDatabase: boolean;
  hasShimInLoop: boolean;
}

interface FilePathAccess {
  functionName: string;
  filePath: string;
  sourceLocation: string;
}

interface CrossLanguageBridge {
  functionName: string;
  category: "lua_api" | "luaL_api" | "tolua" | "sol" | "other";
  callCount: number;
}

function dumpAST(sourceFile: string, extraFlags: string[] = []): any {
  const isC = sourceFile.endsWith(".c");
  const clangBin = isC ? `"${CLANG}"` : `"${CLANG}++"`;
  const langFlags = isC ? "" : "-std=c++17";
  const flagStr = [langFlags, ...extraFlags].filter(Boolean).join(" ");

  try {
    const ast = execSync(
      `${clangBin} ${flagStr} -Xclang -ast-dump=json -fsyntax-only "${sourceFile.replace(/\\/g, '/')}"`,
      { encoding: "utf-8", maxBuffer: 500 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] }
    );
    return JSON.parse(ast);
  } catch (e: any) {
    const stdout = e.stdout ?? "";
    if (stdout && stdout.length > 100) {
      try { return JSON.parse(stdout); } catch { /* fall through */ }
    }
    return null;
  }
}

/** Recursively collect all function definitions and calls from the AST */
function walkAST(
  node: any,
  sourceFile: string,
  definedFunctions: Set<string>,
  calledFunctions: Set<string>,
  callDetails: Map<string, { count: number; callers: Set<string> }>,
  filePathAccesses: FilePathAccess[],
  crossLanguageBridges: Map<string, CrossLanguageBridge>,
  currentFunction: string
): void {
  if (!node || typeof node !== "object") return;

  const kind = node.kind;

  // Track function definitions
  if (kind === "FunctionDecl" && node.name && node.inner) {
    // Only count as defined if it has a body (CompoundStmt in inner)
    const hasBody = node.inner?.some((c: any) => c.kind === "CompoundStmt");
    if (hasBody) {
      definedFunctions.add(node.name);
    }
    currentFunction = node.name;
  }

  // Track method definitions
  if (kind === "CXXMethodDecl" && node.name && node.inner) {
    const hasBody = node.inner?.some((c: any) => c.kind === "CompoundStmt");
    if (hasBody) {
      definedFunctions.add(node.name);
    }
    currentFunction = node.name;
  }

  // Track function calls
  if (kind === "CallExpr" || kind === "CXXMemberCallExpr") {
    const calleeName = extractCalleeName(node);
    if (calleeName) {
      calledFunctions.add(calleeName);
      if (!callDetails.has(calleeName)) {
        callDetails.set(calleeName, { count: 0, callers: new Set() });
      }
      const detail = callDetails.get(calleeName)!;
      detail.count++;
      if (currentFunction) detail.callers.add(currentFunction);

      // Check for file path access
      if (FILE_ACCESS_FUNCTIONS.has(calleeName)) {
        const pathArg = extractFirstStringArg(node);
        if (pathArg) {
          filePathAccesses.push({
            functionName: calleeName,
            filePath: pathArg,
            sourceLocation: node.loc?.file ? `${basename(node.loc.file)}:${node.loc.line}` : sourceFile,
          });
        }
      }

      // Check for cross-language bridges
      if (calleeName.startsWith("lua_") || calleeName.startsWith("luaL_") ||
          calleeName.startsWith("tolua_") || calleeName.startsWith("sol_")) {
        let category: CrossLanguageBridge["category"] = "other";
        if (calleeName.startsWith("lua_")) category = "lua_api";
        else if (calleeName.startsWith("luaL_")) category = "luaL_api";
        else if (calleeName.startsWith("tolua_")) category = "tolua";
        else if (calleeName.startsWith("sol_")) category = "sol";

        if (!crossLanguageBridges.has(calleeName)) {
          crossLanguageBridges.set(calleeName, { functionName: calleeName, category, callCount: 0 });
        }
        crossLanguageBridges.get(calleeName)!.callCount++;
      }
    }
  }

  // Recurse into children
  if (node.inner) {
    for (const child of node.inner) {
      walkAST(child, sourceFile, definedFunctions, calledFunctions, callDetails,
              filePathAccesses, crossLanguageBridges, currentFunction);
    }
  }
}

function extractCalleeName(callExpr: any): string | null {
  if (!callExpr.inner || callExpr.inner.length === 0) return null;

  const callee = callExpr.inner[0];

  // Direct function reference
  if (callee.kind === "ImplicitCastExpr" && callee.inner?.[0]?.kind === "DeclRefExpr") {
    return callee.inner[0].referencedDecl?.name ?? null;
  }
  if (callee.kind === "DeclRefExpr") {
    return callee.referencedDecl?.name ?? null;
  }

  // Member expression (method call)
  if (callee.kind === "MemberExpr") {
    return callee.name ?? null;
  }

  // Unresolved lookup (template calls)
  if (callee.kind === "UnresolvedLookupExpr") {
    return callee.name ?? null;
  }

  return null;
}

function extractFirstStringArg(callExpr: any): string | null {
  // Arguments start at index 1 (index 0 is the callee)
  if (!callExpr.inner || callExpr.inner.length < 2) return null;

  for (let i = 1; i < callExpr.inner.length; i++) {
    const arg = callExpr.inner[i];
    const strLit = findStringLiteral(arg);
    if (strLit) return strLit;
  }
  return null;
}

function findStringLiteral(node: any): string | null {
  if (!node) return null;
  if (node.kind === "StringLiteral") return node.value ?? null;
  if (node.kind === "ImplicitCastExpr" && node.inner) {
    for (const child of node.inner) {
      const s = findStringLiteral(child);
      if (s) return s;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════
// Entry Point Classification
// ═══════════════════════════════════════════════

function classifyEntryPoint(root: any): { classification: string; details: string } {
  // Find main function
  const mainDecl = findMainFunction(root);
  if (!mainDecl) {
    return { classification: "no-main", details: "No main() function found — likely a library" };
  }

  const body = mainDecl.inner?.find((c: any) => c.kind === "CompoundStmt");
  if (!body) {
    return { classification: "batch", details: "main() has no body" };
  }

  // Flatten all nodes in main's body
  const allNodes: any[] = [];
  collectNodes(body, allNodes);

  // Check for library event loop calls
  const callNames = new Set<string>();
  for (const n of allNodes) {
    if (n.kind === "CallExpr" || n.kind === "CXXMemberCallExpr") {
      const name = extractCalleeName(n);
      if (name) callNames.add(name);
    }
  }

  for (const fn of LIBRARY_EVENT_LOOP_FUNCTIONS) {
    if (callNames.has(fn)) {
      return {
        classification: "library-event-loop",
        details: `main() calls ${fn} — framework manages the event loop`,
      };
    }
  }

  // Check for infinite loop patterns
  const hasInfiniteLoop = allNodes.some(n => {
    if (n.kind === "WhileStmt") {
      // while(true) or while(1)
      const cond = n.inner?.[0];
      if (isAlwaysTrueCondition(cond)) return true;
    }
    if (n.kind === "ForStmt") {
      // for(;;) — no condition
      if (!n.inner?.[1] || n.inner[1].kind === "NullStmt") return true;
      if (isAlwaysTrueCondition(n.inner[1])) return true;
    }
    return false;
  });

  if (hasInfiniteLoop) {
    // Check if it's a server loop (accept/recv/poll inside) or render loop (render/update/draw)
    const hasNetworkCalls = callNames.has("accept") || callNames.has("recv") ||
      callNames.has("recvfrom") || callNames.has("poll") || callNames.has("select") ||
      callNames.has("epoll_wait");
    const hasRenderCalls = callNames.has("SDL_RenderPresent") || callNames.has("SDL_UpdateWindowSurface") ||
      callNames.has("glSwapBuffers") || callNames.has("glfwSwapBuffers") ||
      callNames.has("SDL_Flip") || callNames.has("SDL_GL_SwapWindow") ||
      callNames.has("SDL_RenderClear") || callNames.has("SDL_PollEvent");

    if (hasNetworkCalls) {
      return {
        classification: "server-loop",
        details: `main() has infinite loop with network calls: ${[...callNames].filter(n =>
          ["accept", "recv", "recvfrom", "poll", "select", "epoll_wait"].includes(n)).join(", ")}`,
      };
    }
    if (hasRenderCalls) {
      return {
        classification: "blocking-event-loop",
        details: `main() has infinite loop with render/event calls: ${[...callNames].filter(n =>
          n.startsWith("SDL_") || n.startsWith("gl") || n.startsWith("glfw")).join(", ")}`,
      };
    }
    return {
      classification: "blocking-event-loop",
      details: "main() has infinite loop (generic — may need requestAnimationFrame conversion)",
    };
  }

  return { classification: "batch", details: "main() returns — standard batch program" };
}

function findMainFunction(node: any): any {
  if (!node) return null;
  if (node.kind === "FunctionDecl" && node.name === "main") return node;
  if (node.inner) {
    for (const child of node.inner) {
      const found = findMainFunction(child);
      if (found) return found;
    }
  }
  return null;
}

function collectNodes(node: any, out: any[]): void {
  if (!node) return;
  out.push(node);
  if (node.inner) {
    for (const child of node.inner) collectNodes(child, out);
  }
}

function isAlwaysTrueCondition(cond: any): boolean {
  if (!cond) return false;
  // CXXBoolLiteralExpr with value true
  if (cond.kind === "CXXBoolLiteralExpr" && cond.value === true) return true;
  // IntegerLiteral with non-zero value
  if (cond.kind === "IntegerLiteral" && cond.value !== "0") return true;
  // Implicit cast wrapping either of the above
  if (cond.kind === "ImplicitCastExpr" && cond.inner?.[0]) {
    return isAlwaysTrueCondition(cond.inner[0]);
  }
  return false;
}

// ═══════════════════════════════════════════════
// Shim Coverage Check
// ═══════════════════════════════════════════════

let _shimDatabaseNames: Set<string> | null = null;
let _shimLoopNames: Set<string> | null = null;

function getShimDatabaseNames(): Set<string> {
  if (_shimDatabaseNames) return _shimDatabaseNames;
  _shimDatabaseNames = new Set<string>();
  try {
    const { getAllShims } = require("./shim-database.js");
    for (const shim of getAllShims()) {
      _shimDatabaseNames.add(shim.cFunction);
    }
  } catch {
    // If shim-database isn't built yet, parse the source directly
    try {
      const shimSrc = readFileSync(join(__dirname, "shim-database.ts"), "utf-8");
      const matches = shimSrc.matchAll(/cFunction:\s*"([^"]+)"/g);
      for (const m of matches) _shimDatabaseNames.add(m[1]);
    } catch { /* empty */ }
  }
  return _shimDatabaseNames;
}

function getShimLoopNames(): Set<string> {
  if (_shimLoopNames) return _shimLoopNames;
  _shimLoopNames = new Set<string>();
  try {
    // Parse self-modifying-loop.ts for injected function names
    const loopSrc = readFileSync(join(__dirname, "self-modifying-loop.ts"), "utf-8");
    // Pattern: function NAME( in the shim injection code
    const matches = loopSrc.matchAll(/function (\w+)\(/g);
    // Filter to only the shimmed functions (not internal helpers)
    for (const m of matches) {
      const name = m[1];
      // Skip internal helpers and test functions
      if (name.startsWith("_") || name === "translate" || name === "translateFile" ||
          name === "translateLua" || name === "translateAndVerify" ||
          name === "translateAndVerifyMultiFile" || name === "runC" ||
          name === "runC_MultiFile" || name === "runLua" || name === "runTS" ||
          name === "addMultiFileImports") continue;
      _shimLoopNames.add(name);
    }
  } catch { /* empty */ }
  return _shimLoopNames;
}

// ═══════════════════════════════════════════════
// Main Audit Function
// ═══════════════════════════════════════════════

export interface AuditReport {
  projectDir: string;
  sourceFiles: string[];
  foreignFunctions: ForeignFunctionInfo[];
  entryPointClassification: string;
  entryPointDetails: string;
  filePathsAccessed: FilePathAccess[];
  crossLanguageBridges: CrossLanguageBridge[];
  summary: AuditSummary;
}

interface AuditSummary {
  totalFunctionsCalled: number;
  definedInProject: number;
  standardLibrary: number;
  posix: number;
  builtins: number;
  shimmedInDatabase: number;
  shimmedInLoop: number;
  foreign: number;
  foreignNeedingAttention: string[];
  luaBridgeFunctionCount: number;
  filePathCount: number;
}

export function runAudit(projectDir: string): AuditReport {
  // Collect source files
  const sourceFiles: string[] = [];
  const headerFiles: string[] = [];

  function scan(dir: string): void {
    try {
      for (const entry of readdirSync(dir)) {
        if ([".git", "node_modules", "build", "dist", "_generated", "_ts_output"].includes(entry)) continue;
        const full = join(dir, entry);
        try {
          const st = statSync(full);
          if (st.isDirectory()) scan(full);
          else if (/\.(c|cpp|cc|cxx)$/i.test(entry)) sourceFiles.push(full);
          else if (/\.(h|hpp|hxx)$/i.test(entry)) headerFiles.push(full);
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }
  scan(projectDir);

  if (sourceFiles.length === 0) {
    return {
      projectDir,
      sourceFiles: [],
      foreignFunctions: [],
      entryPointClassification: "no-source",
      entryPointDetails: "No C/C++ source files found",
      filePathsAccessed: [],
      crossLanguageBridges: [],
      summary: {
        totalFunctionsCalled: 0, definedInProject: 0, standardLibrary: 0,
        posix: 0, builtins: 0, shimmedInDatabase: 0, shimmedInLoop: 0,
        foreign: 0, foreignNeedingAttention: [], luaBridgeFunctionCount: 0,
        filePathCount: 0,
      },
    };
  }

  // Parse all source files
  const definedFunctions = new Set<string>();
  const calledFunctions = new Set<string>();
  const callDetails = new Map<string, { count: number; callers: Set<string> }>();
  const filePathAccesses: FilePathAccess[] = [];
  const crossLanguageBridges = new Map<string, CrossLanguageBridge>();
  let entryPointClass = "no-main";
  let entryPointDetails = "No main() function found";

  // Build include flags for project headers
  const includeDirs = new Set<string>();
  includeDirs.add(projectDir);
  for (const h of headerFiles) {
    const dir = join(h, "..");
    includeDirs.add(dir);
  }
  const includeFlags = [...includeDirs].map(d => `-I"${d.replace(/\\/g, "/")}"`);

  for (const file of sourceFiles) {
    console.log(`  Parsing: ${basename(file)}...`);
    const root = dumpAST(file, includeFlags);
    if (!root) {
      console.log(`    WARNING: Failed to parse ${basename(file)}`);
      continue;
    }

    walkAST(root, file, definedFunctions, calledFunctions, callDetails,
            filePathAccesses, crossLanguageBridges, "");

    // Classify entry point from the file that contains main
    const mainResult = classifyEntryPoint(root);
    if (mainResult.classification !== "no-main") {
      entryPointClass = mainResult.classification;
      entryPointDetails = mainResult.details;
    }
  }

  // Also scan header files for function definitions (inline functions)
  for (const h of headerFiles) {
    try {
      const content = readFileSync(h, "utf-8");
      // Quick regex scan for function definitions in headers
      const funcDefRegex = /(?:static\s+)?(?:inline\s+)?(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*\{/g;
      let m;
      while ((m = funcDefRegex.exec(content)) !== null) {
        if (m[1] && m[1] !== "if" && m[1] !== "while" && m[1] !== "for" && m[1] !== "switch") {
          definedFunctions.add(m[1]);
        }
      }
    } catch { /* skip */ }
  }

  // Partition called functions
  const shimDbNames = getShimDatabaseNames();
  const shimLoopNames = getShimLoopNames();

  const foreignFunctions = new Map<string, ForeignFunctionInfo>();
  let stdlibCount = 0, posixCount = 0, builtinCount = 0, definedCount = 0;
  let shimDbCount = 0, shimLoopCount = 0;

  for (const fname of calledFunctions) {
    const detail = callDetails.get(fname)!;

    if (definedFunctions.has(fname)) {
      definedCount++;
      continue;
    }

    if (C_STDLIB_FUNCTIONS.has(fname)) {
      stdlibCount++;
      continue;
    }

    if (POSIX_FUNCTIONS.has(fname)) {
      posixCount++;
      continue;
    }

    if (BUILTIN_FUNCTIONS.has(fname)) {
      builtinCount++;
      continue;
    }

    // It's foreign — check shim coverage
    const hasShimDb = shimDbNames.has(fname);
    const hasShimLoop = shimLoopNames.has(fname);

    if (hasShimDb) shimDbCount++;
    if (hasShimLoop) shimLoopCount++;

    foreignFunctions.set(fname, {
      name: fname,
      callCount: detail.count,
      calledFrom: [...detail.callers],
      headerHint: guessHeader(fname),
      hasShimInDatabase: hasShimDb,
      hasShimInLoop: hasShimLoop,
    });
  }

  const foreignList = [...foreignFunctions.values()].sort((a, b) => b.callCount - a.callCount);
  const needingAttention = foreignList
    .filter(f => !f.hasShimInDatabase && !f.hasShimInLoop)
    .map(f => f.name);

  const report: AuditReport = {
    projectDir,
    sourceFiles,
    foreignFunctions: foreignList,
    entryPointClassification: entryPointClass,
    entryPointDetails,
    filePathsAccessed: filePathAccesses,
    crossLanguageBridges: [...crossLanguageBridges.values()].sort((a, b) => b.callCount - a.callCount),
    summary: {
      totalFunctionsCalled: calledFunctions.size,
      definedInProject: definedCount,
      standardLibrary: stdlibCount,
      posix: posixCount,
      builtins: builtinCount,
      shimmedInDatabase: shimDbCount,
      shimmedInLoop: shimLoopCount,
      foreign: foreignFunctions.size,
      foreignNeedingAttention: needingAttention,
      luaBridgeFunctionCount: crossLanguageBridges.size,
      filePathCount: filePathAccesses.length,
    },
  };

  return report;
}

function guessHeader(funcName: string): string {
  // SDL
  if (funcName.startsWith("SDL_")) return "<SDL2/SDL.h>";
  if (funcName.startsWith("IMG_")) return "<SDL2/SDL_image.h>";
  if (funcName.startsWith("Mix_")) return "<SDL2/SDL_mixer.h>";
  if (funcName.startsWith("TTF_")) return "<SDL2/SDL_ttf.h>";
  // OpenGL
  if (funcName.startsWith("gl") && funcName[2] === funcName[2]?.toUpperCase()) return "<GL/gl.h>";
  if (funcName.startsWith("glfw")) return "<GLFW/glfw3.h>";
  if (funcName.startsWith("glut")) return "<GL/glut.h>";
  // Lua
  if (funcName.startsWith("lua_")) return "<lua.h>";
  if (funcName.startsWith("luaL_")) return "<lauxlib.h>";
  if (funcName.startsWith("tolua_")) return "<tolua++.h>";
  // GTK
  if (funcName.startsWith("gtk_") || funcName.startsWith("g_") || funcName.startsWith("gdk_")) return "<gtk/gtk.h>";
  // Qt
  if (funcName.startsWith("Q")) return "<Qt>";
  // Windows
  if (funcName.startsWith("Create") || funcName.startsWith("Get") || funcName.startsWith("Set") ||
      funcName.endsWith("A") || funcName.endsWith("W")) {
    if (funcName.includes("File") || funcName.includes("Handle") || funcName.includes("Thread") ||
        funcName.includes("Window") || funcName.includes("Process")) return "<windows.h>";
  }
  // curl
  if (funcName.startsWith("curl_")) return "<curl/curl.h>";
  // zlib
  if (funcName.startsWith("deflate") || funcName.startsWith("inflate") ||
      funcName === "compress" || funcName === "uncompress") return "<zlib.h>";
  // OpenSSL
  if (funcName.startsWith("SSL_") || funcName.startsWith("EVP_") ||
      funcName.startsWith("BIO_")) return "<openssl/ssl.h>";

  return "<unknown>";
}

// ═══════════════════════════════════════════════
// Report Printer
// ═══════════════════════════════════════════════

export function printAuditReport(report: AuditReport): void {
  const sep = "=".repeat(60);

  console.log(`\n${sep}`);
  console.log(`  PRE-TRANSLATION AUDIT REPORT`);
  console.log(`  Project: ${report.projectDir}`);
  console.log(`  Source files: ${report.sourceFiles.length}`);
  console.log(sep);

  // 1. Entry Point Classification
  console.log(`\n--- 1. ENTRY POINT CLASSIFICATION ---`);
  console.log(`  Type: ${report.entryPointClassification}`);
  console.log(`  Details: ${report.entryPointDetails}`);

  // 2. Function Call Summary
  const s = report.summary;
  console.log(`\n--- 2. FUNCTION CALL ANALYSIS ---`);
  console.log(`  Total unique functions called: ${s.totalFunctionsCalled}`);
  console.log(`  Defined in project:           ${s.definedInProject}`);
  console.log(`  C standard library:           ${s.standardLibrary}`);
  console.log(`  POSIX:                        ${s.posix}`);
  console.log(`  Compiler builtins:            ${s.builtins}`);
  console.log(`  Foreign (external):           ${s.foreign}`);
  console.log(`    - Shimmed in shim-database: ${s.shimmedInDatabase}`);
  console.log(`    - Shimmed in self-mod loop: ${s.shimmedInLoop}`);
  console.log(`    - NEEDING ATTENTION:        ${s.foreignNeedingAttention.length}`);

  // 3. Foreign Functions Detail
  if (report.foreignFunctions.length > 0) {
    console.log(`\n--- 3. FOREIGN FUNCTIONS ---`);
    for (const f of report.foreignFunctions) {
      const status = f.hasShimInDatabase ? "[shim-db]" :
                     f.hasShimInLoop ? "[loop-shim]" : "[NO SHIM]";
      console.log(`  ${status} ${f.name} (${f.callCount} calls, header: ${f.headerHint})`);
      if (f.calledFrom.length > 0 && f.calledFrom.length <= 5) {
        console.log(`    Called from: ${f.calledFrom.join(", ")}`);
      } else if (f.calledFrom.length > 5) {
        console.log(`    Called from: ${f.calledFrom.slice(0, 5).join(", ")} (+${f.calledFrom.length - 5} more)`);
      }
    }
  }

  // 4. File Paths Accessed
  if (report.filePathsAccessed.length > 0) {
    console.log(`\n--- 4. FILE PATHS ACCESSED ---`);
    for (const fp of report.filePathsAccessed) {
      console.log(`  ${fp.functionName}("${fp.filePath}") at ${fp.sourceLocation}`);
    }
  } else {
    console.log(`\n--- 4. FILE PATHS ACCESSED ---`);
    console.log(`  None detected (no string literals passed to file I/O functions)`);
  }

  // 5. Cross-Language Bridges
  if (report.crossLanguageBridges.length > 0) {
    console.log(`\n--- 5. CROSS-LANGUAGE BRIDGES ---`);
    console.log(`  Lua binding functions: ${report.crossLanguageBridges.length}`);
    for (const b of report.crossLanguageBridges) {
      console.log(`  [${b.category}] ${b.functionName} (${b.callCount} calls)`);
    }
  } else {
    console.log(`\n--- 5. CROSS-LANGUAGE BRIDGES ---`);
    console.log(`  None detected`);
  }

  // 6. Summary & Recommendations
  console.log(`\n--- 6. SUMMARY & RECOMMENDATIONS ---`);

  if (s.foreignNeedingAttention.length === 0 && s.foreign === 0) {
    console.log(`  [OK] All called functions are either project-defined or standard library.`);
    console.log(`  Translation should proceed without foreign function issues.`);
  } else if (s.foreignNeedingAttention.length === 0) {
    console.log(`  [OK] All foreign functions have shims available.`);
    console.log(`  Translation can use existing shim infrastructure.`);
  } else {
    console.log(`  [ATTENTION] ${s.foreignNeedingAttention.length} foreign function(s) have no shim:`);
    for (const name of s.foreignNeedingAttention.slice(0, 20)) {
      console.log(`    - ${name}`);
    }
    if (s.foreignNeedingAttention.length > 20) {
      console.log(`    ... and ${s.foreignNeedingAttention.length - 20} more`);
    }
    console.log(`  These will need shims in shim-database.ts or manual handling.`);
  }

  if (report.entryPointClassification === "blocking-event-loop" ||
      report.entryPointClassification === "server-loop") {
    console.log(`  [NOTE] Entry point is ${report.entryPointClassification}.`);
    console.log(`  The main loop will need conversion to async/requestAnimationFrame.`);
  }

  if (report.crossLanguageBridges.length > 0) {
    console.log(`  [NOTE] ${report.crossLanguageBridges.length} Lua binding functions detected.`);
    console.log(`  The Lua bridge layer will need TypeScript equivalents.`);
  }

  if (report.filePathsAccessed.length > 0) {
    console.log(`  [NOTE] ${report.filePathsAccessed.length} file path(s) need packaging for browser/Node.`);
  }

  console.log(`\n${sep}\n`);
}

// ═══════════════════════════════════════════════
// CLI Entry Point
// ═══════════════════════════════════════════════

export function runAuditCLI(projectDir: string): number {
  if (!existsSync(projectDir)) {
    console.error(`Error: directory '${projectDir}' does not exist`);
    return 1;
  }

  console.log(`Running pre-translation audit on: ${projectDir}`);
  const report = runAudit(projectDir);
  printAuditReport(report);
  return 0;
}

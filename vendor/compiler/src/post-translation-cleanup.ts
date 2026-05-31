/**
 * Post-translation cleanup pass.
 * Fixes common patterns that the emitter produces which are valid tsc
 * but invalid esbuild/tsx (stricter parser).
 *
 * Runs on every translated file before bootstrap generation.
 * Generic — works for any project, not just Stratagus.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Clean up a single TypeScript file.
 * Returns the number of fixes applied.
 */
export function cleanupTranslatedFile(code: string): { code: string; fixes: number } {
  let fixes = 0;

  // Fix 1: Remove duplicate let _refN declarations (from reference parameter boxing)
  const declaredRefs = new Set<string>();
  const lines = code.split("\n");
  const cleanedLines: string[] = [];
  for (const line of lines) {
    const refMatch = line.match(/^(\s*)let (_ref\d+) = /);
    if (refMatch) {
      if (declaredRefs.has(refMatch[2])) {
        // Duplicate — change to assignment without let
        cleanedLines.push(line.replace(/^(\s*)let (_ref\d+)/, "$1$2"));
        fixes++;
        continue;
      }
      declaredRefs.add(refMatch[2]);
    }
    cleanedLines.push(line);
  }
  code = cleanedLines.join("\n");

  // Fix 2: Remove duplicate variable declarations (let X declared twice)
  const declaredVars = new Set<string>();
  const lines2 = code.split("\n");
  const cleanedLines2: string[] = [];
  for (const line of lines2) {
    const varMatch = line.match(/^(\s*)let (\w+)(:\s*\w+)?\s*=/);
    if (varMatch && !line.includes("for (")) {
      const name = varMatch[2];
      if (declaredVars.has(name) && name !== "i" && name !== "j" && name !== "k") {
        // Duplicate — change let to assignment
        cleanedLines2.push(line.replace(/^(\s*)let (\w+)/, "$1$2"));
        fixes++;
        continue;
      }
      declaredVars.add(name);
    }
    cleanedLines2.push(line);
  }
  code = cleanedLines2.join("\n");

  // Fix 3: Replace C++ types in type annotations that slipped through
  code = code.replace(/: bool\b/g, ": boolean");
  code = code.replace(/: FILE\b/g, ": any");
  code = code.replace(/: lua_State\b/g, ": any");
  code = code.replace(/: size_t\b/g, ": number");
  code = code.replace(/: uint32_t\b/g, ": number");
  code = code.replace(/: int32_t\b/g, ": number");
  code = code.replace(/: uint64_t\b/g, ": number");
  code = code.replace(/: int64_t\b/g, ": number");
  code = code.replace(/: uint16_t\b/g, ": number");
  code = code.replace(/: int16_t\b/g, ": number");
  code = code.replace(/: uint8_t\b/g, ": number");
  code = code.replace(/: int8_t\b/g, ": number");
  code = code.replace(/: unsigned\b/g, ": number");

  // POSIX numeric types
  code = code.replace(/: pid_t\b/g, ": number");
  code = code.replace(/: off_t\b/g, ": number");
  code = code.replace(/: mode_t\b/g, ": number");
  code = code.replace(/: uid_t\b/g, ": number");
  code = code.replace(/: gid_t\b/g, ": number");
  code = code.replace(/: time_t\b/g, ": number");
  code = code.replace(/: clock_t\b/g, ": number");
  code = code.replace(/: socklen_t\b/g, ": number");
  code = code.replace(/: in_addr_t\b/g, ": number");
  code = code.replace(/: in_port_t\b/g, ": number");
  code = code.replace(/: nfds_t\b/g, ": number");
  code = code.replace(/: ssize_t\b/g, ": number");
  code = code.replace(/: dev_t\b/g, ": number");
  code = code.replace(/: ino_t\b/g, ": number");
  code = code.replace(/: nlink_t\b/g, ": number");
  code = code.replace(/: blksize_t\b/g, ": number");
  code = code.replace(/: blkcnt_t\b/g, ": number");
  code = code.replace(/: key_t\b/g, ": number");
  code = code.replace(/: id_t\b/g, ": number");
  code = code.replace(/: suseconds_t\b/g, ": number");
  code = code.replace(/: useconds_t\b/g, ": number");
  code = code.replace(/: rlim_t\b/g, ": number");
  code = code.replace(/: cc_t\b/g, ": number");
  code = code.replace(/: speed_t\b/g, ": number");
  code = code.replace(/: tcflag_t\b/g, ": number");
  code = code.replace(/: wint_t\b/g, ": number");
  code = code.replace(/: wchar_t\b/g, ": number");
  code = code.replace(/: sig_atomic_t\b/g, ": number");
  code = code.replace(/: intmax_t\b/g, ": number");
  code = code.replace(/: uintmax_t\b/g, ": number");

  // POSIX opaque types
  code = code.replace(/: va_list\b/g, ": any[]");
  code = code.replace(/: jmp_buf\b/g, ": any");
  code = code.replace(/: sigjmp_buf\b/g, ": any");
  code = code.replace(/: sigset_t\b/g, ": any");
  code = code.replace(/: pthread_t\b/g, ": any");
  code = code.replace(/: pthread_mutex_t\b/g, ": any");
  code = code.replace(/: pthread_cond_t\b/g, ": any");
  code = code.replace(/: pthread_attr_t\b/g, ": any");
  code = code.replace(/: sem_t\b/g, ": any");
  code = code.replace(/: DIR\b/g, ": any");
  code = code.replace(/: regex_t\b/g, ": any");
  code = code.replace(/: regmatch_t\b/g, ": any");
  code = code.replace(/: pthread_rwlock_t\b/g, ": any");
  code = code.replace(/: pthread_key_t\b/g, ": any");
  code = code.replace(/: pthread_mutexattr_t\b/g, ": any");
  code = code.replace(/: pthread_condattr_t\b/g, ": any");
  code = code.replace(/: glob_t\b/g, ": any");
  code = code.replace(/: iconv_t\b/g, ": any");
  code = code.replace(/: mbstate_t\b/g, ": any");
  code = code.replace(/: fpos_t\b/g, ": any");
  code = code.replace(/: div_t\b/g, ": any");
  code = code.replace(/: ldiv_t\b/g, ": any");
  code = code.replace(/: lldiv_t\b/g, ": any");
  code = code.replace(/: imaxdiv_t\b/g, ": any");
  code = code.replace(/: struct_tm\b/g, ": any");

  // Fix 4: Replace C++ pointer syntax in types (T * → T)
  code = code.replace(/ \*\)/g, ")");
  code = code.replace(/ \*,/g, ",");
  code = code.replace(/ \*;/g, ";");
  code = code.replace(/ \*>/g, ">");

  // Fix 5: Replace std:: types
  code = code.replace(/\bstd::string\b/g, "string");
  code = code.replace(/\bstd::string_view\b/g, "string");
  code = code.replace(/\bstd::wstring\b/g, "string");
  code = code.replace(/\bstd::u16string\b/g, "string");
  code = code.replace(/\bstd::u32string\b/g, "string");
  code = code.replace(/\bstd::vector\b/g, "Array");
  code = code.replace(/\bstd::array\b/g, "Array");
  code = code.replace(/\bstd::deque\b/g, "Array");
  code = code.replace(/\bstd::list\b/g, "Array");
  code = code.replace(/\bstd::forward_list\b/g, "Array");
  code = code.replace(/\bstd::span\b/g, "Array");
  code = code.replace(/\bstd::map\b/g, "Map");
  code = code.replace(/\bstd::unordered_map\b/g, "Map");
  code = code.replace(/\bstd::set\b/g, "Set");
  code = code.replace(/\bstd::unordered_set\b/g, "Set");
  code = code.replace(/\bstd::pair\b/g, "any");
  code = code.replace(/\bstd::tuple\b/g, "any");
  code = code.replace(/\bstd::function\b/g, "Function");
  code = code.replace(/\bstd::variant\b/g, "any");
  code = code.replace(/\bstd::any\b/g, "any");
  code = code.replace(/\bstd::optional\b/g, "any");
  code = code.replace(/\bstd::bitset\b/g, "number");
  code = code.replace(/\bstd::complex\b/g, "any");
  code = code.replace(/\bstd::atomic\b/g, "any");
  code = code.replace(/\bstd::mutex\b/g, "any");
  code = code.replace(/\bstd::recursive_mutex\b/g, "any");
  code = code.replace(/\bstd::thread\b/g, "any");
  code = code.replace(/\bstd::promise\b/g, "Promise");
  code = code.replace(/\bstd::future\b/g, "Promise");
  code = code.replace(/\bstd::condition_variable\b/g, "any");
  code = code.replace(/\bstd::queue\b/g, "Array");
  code = code.replace(/\bstd::priority_queue\b/g, "Array");
  code = code.replace(/\bstd::stack\b/g, "Array");
  code = code.replace(/\bstd::chrono::seconds\b/g, "number");
  code = code.replace(/\bstd::chrono::milliseconds\b/g, "number");
  code = code.replace(/\bstd::chrono::microseconds\b/g, "number");
  code = code.replace(/\bstd::chrono::nanoseconds\b/g, "number");
  code = code.replace(/\bstd::chrono::minutes\b/g, "number");
  code = code.replace(/\bstd::chrono::hours\b/g, "number");
  code = code.replace(/\bstd::chrono::duration\b/g, "number");
  code = code.replace(/\bstd::chrono::time_point\b/g, "number");
  code = code.replace(/\bstd::chrono::steady_clock\b/g, "any");
  code = code.replace(/\bstd::chrono::system_clock\b/g, "any");
  code = code.replace(/\bstd::chrono::high_resolution_clock\b/g, "any");
  code = code.replace(/\bstd::__cxx11::/g, "");
  code = code.replace(/__gnu_cxx::/g, "");
  code = code.replace(/\bbasic_string_view\b/g, "string");
  code = code.replace(/\bstd::unique_ptr\b/g, "any");
  code = code.replace(/\bstd::shared_ptr\b/g, "any");
  code = code.replace(/\bstd::weak_ptr\b/g, "any");

  // Fix 5b: C++ const pointer parameter types → any
  code = code.replace(/const_\w+_\*const/g, "any");
  code = code.replace(/const_\w+_\*/g, "any");
  code = code.replace(/const_\w+_&/g, "any");
  // Fix 5c: Smart pointer array constructors
  code = code.replace(/new std_unique_ptr_\w+\[\]\(\)/g, "new Array()");
  code = code.replace(/new std_\w+\[\]\(\)/g, "new Array()");
  // Fix 5d: Empty range-for (already handled in emitter, but catch any that slip through)
  code = code.replace(/for \(const \w+ of \/\* range \*\/\)\s*\{[^}]*\}/g, "/* empty range-for */");

  // Fix 5e: STL container method transforms

  // std::set / std::unordered_set methods (now Set in TS)
  code = code.replace(/\.insert\(([^)]+)\)/g, '.add($1)');
  code = code.replace(/\.erase\(([^)]+)\)/g, '.delete($1)');
  code = code.replace(/\.count\(([^)]+)\)/g, '(.has($1) ? 1 : 0)');
  code = code.replace(/\.find\(([^)]+)\)\s*!=\s*\.\s*end\(\)/g, '.has($1)');
  // C++20 §22.4: m.find(k) != m.end() / m.find(k) == m.end() when emitter routed
  // via .get(): .get(k) !== null / === null. Also strip vestigial `.has(k) !== null`.
  code = code.replace(/(\w+)\.find\(([^)]+)\)\s*!==?\s*\1\.end\(\)/g, '$1.has($2)');
  code = code.replace(/(\w+)\.find\(([^)]+)\)\s*===?\s*\1\.end\(\)/g, '!$1.has($2)');
  code = code.replace(/(\w+)\.get\(([^)]+)\)\s*!==?\s*null/g, '$1.has($2)');
  code = code.replace(/(\w+)\.get\(([^)]+)\)\s*===?\s*null/g, '!$1.has($2)');
  code = code.replace(/([A-Za-z_]\w*\.has\([^()]+\))\s*!==?\s*null/g, '$1');
  code = code.replace(/([A-Za-z_]\w*\.has\([^()]+\))\s*===?\s*null/g, '!$1');

  // std::map / std::unordered_map methods (now Map in TS)
  // .insert({key, val}) or .insert(make_pair(key, val)) → .set(key, val)
  code = code.replace(/\.insert\(\s*\{\s*([^,]+),\s*([^}]+)\}\s*\)/g, '.set($1, $2)');
  code = code.replace(/\.insert\(\s*make_pair\(\s*([^,]+),\s*([^)]+)\)\s*\)/g, '.set($1, $2)');
  code = code.replace(/\.at\(([^)]+)\)/g, '.get($1)');

  // std::deque / std::list methods (now Array in TS)
  code = code.replace(/\.push_front\(([^)]+)\)/g, '.unshift($1)');
  code = code.replace(/\.pop_front\(\)/g, '.shift()');
  code = code.replace(/\.push_back\(([^)]+)\)/g, '.push($1)');
  code = code.replace(/\.pop_back\(\)/g, '.pop()');

  // std::string methods
  // .substr(pos, len) → .substring(pos, pos + len)
  code = code.replace(/\.substr\((\w+),\s*(\w+)\)/g, '.substring($1, $1 + $2)');
  // .find(str) → .indexOf(str) — but not .find(x) != .end() which was handled above
  code = code.replace(/\.find\(([^)]+)\)(?!\s*!=)/g, '.indexOf($1)');
  code = code.replace(/\.rfind\(([^)]+)\)/g, '.lastIndexOf($1)');
  // .c_str() → strip (TS strings don't need this)
  code = code.replace(/\.c_str\(\)/g, '');
  // .empty() → (.length === 0)
  code = code.replace(/\.empty\(\)/g, '.length === 0');
  // .append(str) → .concat(str) (or += but concat is safer as expression)
  code = code.replace(/\.append\(([^)]+)\)/g, '.concat($1)');

  // Fix 5f: C++ algorithm/utility function transforms
  // std::clamp
  code = code.replace(/std::clamp\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, 'Math.min(Math.max($1, $2), $3)');
  // std::exchange
  code = code.replace(/std::exchange\(([^,]+),\s*([^)]+)\)/g, '((() => { const __old = $1; $1 = $2; return __old; })())');
  // std::from_chars
  code = code.replace(/std::from_chars\([^)]+\)/g, '/* from_chars */ 0');
  // std::to_chars
  code = code.replace(/std::to_chars\([^)]+\)/g, '/* to_chars */ 0');
  // std::format
  code = code.replace(/std::format\(([^)]+)\)/g, 'printf_format($1)');
  // std::ranges:: methods
  code = code.replace(/std::ranges::sort\((\w+)\)/g, '$1.sort()');
  code = code.replace(/std::ranges::find\((\w+),\s*([^)]+)\)/g, '$1.find(v => v === $2)');
  code = code.replace(/std::ranges::for_each\((\w+),\s*([^)]+)\)/g, '$1.forEach($2)');
  code = code.replace(/std::ranges::transform\((\w+),\s*([^,]+),\s*([^)]+)\)/g, '$1.map($3)');
  code = code.replace(/std::ranges::count_if\((\w+),\s*([^)]+)\)/g, '$1.filter($2).length');
  code = code.replace(/std::ranges::any_of\((\w+),\s*([^)]+)\)/g, '$1.some($2)');
  code = code.replace(/std::ranges::all_of\((\w+),\s*([^)]+)\)/g, '$1.every($2)');

  // Fix 6: Replace C++ template casts in expressions
  code = code.replace(/<unsigned>/g, "");
  code = code.replace(/<int>/g, "");
  code = code.replace(/<bool>/g, "");
  code = code.replace(/<char>/g, "");

  // Fix 7: Replace operator calls that leaked through
  code = code.replace(/\.operator basic_string_view\(\)/g, '.toString()');
  code = code.replace(/\.operator bool\(\)/g, '? true : false');
  code = code.replace(/\.operator->\(\)/g, '');
  code = code.replace(/operator->\(/g, '(');
  code = code.replace(/\.operator\s*\(\)/g, '()');

  // Fix 8: UNHANDLED expressions in code positions → undefined
  code = code.replace(/\/\* UNHANDLED EXPR: \w+ \*\//g, "undefined");
  code = code.replace(/\/\* UNHANDLED: \w+ \*\//g, "");

  // Fix 8b: Invalid assignment targets (undefined on left of =)
  code = code.replace(/^\s*undefined\([^)]*\)\s*=\s*.+;/gm, "/* unresolved assignment */");
  code = code.replace(/^\s*undefined\s*=\s*.+;/gm, "/* unresolved assignment */");
  code = code.replace(/^\s*undefined\.\w+\s*=\s*.+;/gm, "/* unresolved assignment */");

  // Fix 8c: C++ array type in annotations: any[8] → any[]
  code = code.replace(/: any\[\d+\]/g, ": any[]");
  code = code.replace(/: number\[\d+\]/g, ": number[]");

  // Fix 8d: C++ class names in type annotations (Foo::Bar → any)
  code = code.replace(/: \w+::\w+/g, ": any");

  // Fix 8e: case with bare identifier (case Unit: → case "Unit":)
  code = code.replace(/case ([A-Z]\w+):/g, 'case "$1":');

  // Fix 8f: Orphaned code after SYNTAX_FIX comments
  // When a function signature is commented out but its body remains,
  // wrap the orphaned body in a dead function
  code = code.replace(
    /^\/\/ SYNTAX_FIX:.*function\b.*\n((?:(?!^function |^class |^export |^import |^\/\/ SYNTAX_FIX:).*\n)*)/gm,
    "/* orphaned function body removed */\n"
  );

  // Fix 8g: Bare field declarations outside class (name: Type = value)
  // These come from class methods emitted at file scope
  code = code.replace(/^  (\w+): \w+ = .+;$/gm, "  let $1: any;");

  // Fix 8h: Import reassignment (cannot assign to import)
  // Pattern: imported_name = value; → let local_name = value;
  const importedNames = new Set<string>();
  for (const m of code.matchAll(/import \{([^}]+)\}/g)) {
    for (const name of m[1].split(",")) {
      importedNames.add(name.trim());
    }
  }
  const reassignLines = code.split("\n");
  for (let i = 0; i < reassignLines.length; i++) {
    const assignMatch = reassignLines[i].match(/^\s*(\w+)\s*=[^=]/);
    if (assignMatch && importedNames.has(assignMatch[1])) {
      reassignLines[i] = reassignLines[i].replace(assignMatch[1], `_local_${assignMatch[1]}`);
      fixes++;
    }
  }
  code = reassignLines.join("\n");
  code = code.replace(/\/\* UNHANDLED DECL\/STMT: \w+ \*\//g, "/* unhandled */");

  // Fix 9: RecoveryExpr → undefined
  code = code.replace(/\/\* recovery \*\//g, "");

  // Fix 10: Multiple constructors in a class (TS only allows one)
  // Keep only the last constructor
  const classConstructorPattern = /^(\s*)constructor\(/gm;
  let match;
  const constructorLines: number[] = [];
  const codeLines = code.split("\n");
  let inClass = false;
  let classDepth = 0;
  let lastCtorStart = -1;
  const ctorStarts: number[] = [];

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    if (line.match(/^\s*class\s/)) inClass = true;
    if (inClass) {
      if (line.trim().startsWith("constructor(")) {
        ctorStarts.push(i);
      }
    }
  }

  // If multiple constructors in same class, comment out all but last
  if (ctorStarts.length > 1) {
    // Simple heuristic: comment out earlier constructors
    for (let c = 0; c < ctorStarts.length - 1; c++) {
      const start = ctorStarts[c];
      let depth = 0;
      for (let i = start; i < codeLines.length; i++) {
        depth += (codeLines[i].match(/\{/g) || []).length;
        depth -= (codeLines[i].match(/\}/g) || []).length;
        codeLines[i] = "// DUP_CTOR: " + codeLines[i];
        if (depth === 0 && i > start) break;
      }
      fixes++;
    }
    code = codeLines.join("\n");
  }

  // Fix 11: const reassignment — change const to let for variables that get reassigned
  const constVars = new Map<string, number>(); // name → line number of declaration
  const reassignedConsts = new Set<string>();
  const allLines = code.split("\n");
  for (let i = 0; i < allLines.length; i++) {
    const constMatch = allLines[i].match(/^\s*const (\w+)\s*[=:]/);
    if (constMatch) constVars.set(constMatch[1], i);
    // Check for reassignment
    const assignMatch = allLines[i].match(/^\s*(\w+)\s*=[^=]/);
    if (assignMatch && constVars.has(assignMatch[1]) && constVars.get(assignMatch[1])! < i) {
      reassignedConsts.add(assignMatch[1]);
    }
  }
  for (const name of reassignedConsts) {
    const lineNum = constVars.get(name)!;
    allLines[lineNum] = allLines[lineNum].replace(`const ${name}`, `let ${name}`);
    fixes++;
  }
  code = allLines.join("\n");

  // Fix 12: Legacy octal escapes — replace \0 in strings with \\0
  code = code.replace(/(?<!\\)\\0(?![0-9x])/g, "\\\\0");

  // Fix 13: Detect char array index-write loops and add .join('') hints
  code = code.replace(
    /(\w+)\[(\w+)\+\+\]\s*=\s*(?:String\.fromCharCode\(|'[^']*')/g,
    (match, buf, idx) => {
      return `${match} /* char-array-build: use ${buf}.join('') for string */`;
    }
  );

  // Fix 14: Auto-convert char-array-build variables to strings at usage points
  // Find variables marked with /* char-array-build: use BUF.join('') for string */
  const charBuildVars = new Set<string>();
  const charBuildRegex = /\/\* char-array-build: use (\w+)\.join/g;
  let cbm;
  while ((cbm = charBuildRegex.exec(code)) !== null) {
    charBuildVars.add(cbm[1]);
  }

  for (const varName of charBuildVars) {
    // When passed to printf/puts/console.log: add .join('')
    code = code.replace(
      new RegExp(`(printf|puts|fputs|console\\.log)\\(([^)]*\\b${varName}\\b)`, 'g'),
      (match, func, args) => `${func}(${args.replace(new RegExp(`\\b${varName}\\b`), `${varName}.join('')`)}`
    );
    // When concatenated with string: add .join('')
    code = code.replace(
      new RegExp(`(\\+\\s*)\\b${varName}\\b(?!\\.join)`, 'g'),
      `$1${varName}.join('')`
    );
    // When compared with string: add .join('')
    code = code.replace(
      new RegExp(`\\b${varName}\\b\\s*(===|==|!==|!=)\\s*"`, 'g'),
      `${varName}.join('') $1 "`
    );
    // When returned from function: add .join('')
    code = code.replace(
      new RegExp(`return\\s+\\b${varName}\\b\\s*;`, 'g'),
      `return ${varName}.join('');`
    );
  }

  // Fix 15: pointer post-increment assignment — ptr++ = expr → ptr[ptrIdx++] = expr
  {
    const ptrIncAssign = /(\w+)\+\+\s*=\s*/g;
    const ptrVars = new Set<string>();
    let pim;
    while ((pim = ptrIncAssign.exec(code)) !== null) {
      ptrVars.add(pim[1]);
    }

    for (const varName of ptrVars) {
      // Replace ptr++ = expr with ptr[ptrIdx++] = expr
      const re = new RegExp(`\\b${varName}\\+\\+\\s*=`, 'g');
      code = code.replace(re, `${varName}[${varName}Idx++] =`);

      // Replace ptr-- = expr similarly
      const reDec = new RegExp(`\\b${varName}--\\s*=`, 'g');
      code = code.replace(reDec, `${varName}[${varName}Idx--] =`);

      // Also fix standalone ptr++ on RHS when it should be ptr[ptrIdx++]
      code = code.replace(new RegExp(`=\\s*${varName}\\+\\+\\s*;`, 'g'), `= ${varName}[${varName}Idx++];`);

      // Add index variable declarations at function scope
      code = code.replace(
        new RegExp(`(let\\s+${varName}\\s*[=;])`, 'g'),
        `let ${varName}Idx = 0;\n  $1`
      );
      fixes++;
    }
  }

  // Fix 16: reserved word variable names
  {
    const reservedWords = ['null', 'undefined', 'void', 'delete', 'typeof', 'instanceof',
      'in', 'of', 'super', 'this', 'new', 'class', 'yield', 'await', 'debugger',
      'with', 'enum', 'arguments', 'eval'];
    for (const word of reservedWords) {
      // let null = ... → let _null = ...
      if (code.includes(`let ${word} =`) || code.includes(`const ${word} =`) || code.includes(`var ${word} =`)) {
        code = code.replace(new RegExp(`\\blet\\s+${word}\\s*=`, 'g'), `let _${word} =`);
        code = code.replace(new RegExp(`\\bconst\\s+${word}\\s*=`, 'g'), `const _${word} =`);
        code = code.replace(new RegExp(`\\bvar\\s+${word}\\s*=`, 'g'), `var _${word} =`);
        fixes++;
      }
    }
  }

  return { code, fixes };
}

/**
 * Run cleanup on all .ts files in a directory.
 */
export function cleanupProject(projectDir: string): { filesFixed: number; totalFixes: number } {
  let filesFixed = 0;
  let totalFixes = 0;

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === "dist" || entry === "shims" || entry === "runtime") continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith(".ts") || entry.endsWith(".d.ts")) continue;

      const original = readFileSync(full, "utf-8");
      const { code, fixes } = cleanupTranslatedFile(original);
      if (fixes > 0) {
        writeFileSync(full, code);
        filesFixed++;
        totalFixes += fixes;
      }
    }
  }

  walk(projectDir);
  return { filesFixed, totalFixes };
}

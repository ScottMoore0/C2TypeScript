/**
 * Phase 19.3: TypeScript compilation error fixers.
 * Each function takes code + classified error → returns fixed code.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";

export interface ClassifiedError {
  category: string;
  errorCode: number;
  file: string;
  line: number;
  col: number;
  message: string;
  data: {
    name?: string;
    fromType?: string;
    toType?: string;
    suggestion?: string;
    modulePath?: string;
  };
}

/** Map of known symbol → file that defines it (populated during project scan) */
let symbolMap = new Map<string, string>();

export function setSymbolMap(map: Map<string, string>): void {
  symbolMap = map;
}

/**
 * Apply a fix for a classified tsc error. Returns the modified code,
 * or the original code if no fix is applicable.
 */
export function applyTscFix(code: string, error: ClassifiedError): string {
  switch (error.category) {
    case "missing_name": return fixMissingName(code, error);
    case "missing_export": return fixMissingExport(code, error);
    case "missing_module": return fixMissingModule(code, error);
    case "type_mismatch": return fixTypeMismatch(code, error);
    case "missing_property": return fixMissingProperty(code, error);
    case "argument_mismatch": return fixArgumentMismatch(code, error);
    case "typo_suggestion": return fixTypo(code, error);
    case "argument_count": return fixArgumentCount(code, error);
    case "possibly_undefined": return fixPossiblyUndefined(code, error);
    case "implicit_any": return fixImplicitAny(code, error);
    case "syntax_error": return fixSyntaxError(code, error);
    case "duplicate_decl": return fixDuplicateDecl(code, error);
    default: return code;
  }
}

function fixMissingName(code: string, error: ClassifiedError): string {
  const name = error.data.name;
  if (!name) return code;

  // Check if symbol is in another file
  const sourceFile = symbolMap.get(name);
  if (sourceFile) {
    const rel = relative(dirname(error.file), sourceFile).replace(/\\/g, "/").replace(/\.ts$/, ".js");
    const importPath = rel.startsWith(".") ? rel : "./" + rel;
    return `import { ${name} } from "${importPath}";\n` + code;
  }

  // Check if it's a well-known shim function
  const shimMap: Record<string, string> = {
    // --- C stdio ---
    printf: "../shims/cstdio", puts: "../shims/cstdio", putchar: "../shims/cstdio",
    sprintf: "../shims/cstdio", snprintf: "../shims/cstdio", fprintf: "../shims/cstdio",
    sscanf: "../shims/cstdio",
    fopen: "../shims/cstdio", fclose: "../shims/cstdio", fread: "../shims/cstdio",
    fwrite: "../shims/cstdio", fseek: "../shims/cstdio", ftell: "../shims/cstdio",
    feof: "../shims/cstdio", rewind: "../shims/cstdio", fgets: "../shims/cstdio",
    fputs: "../shims/cstdio", fflush: "../shims/cstdio", remove: "../shims/cstdio",
    rename: "../shims/cstdio",

    // --- C string ---
    strlen: "../shims/cstring", strcmp: "../shims/cstring", strcpy: "../shims/cstring",
    strncpy: "../shims/cstring", strcat: "../shims/cstring", strncat: "../shims/cstring",
    strchr: "../shims/cstring", strrchr: "../shims/cstring", strstr: "../shims/cstring",
    memcpy: "../shims/cstring", memset: "../shims/cstring", memcmp: "../shims/cstring",
    memmove: "../shims/cstring",

    // --- C stdlib ---
    malloc: "../shims/cstdlib", calloc: "../shims/cstdlib", realloc: "../shims/cstdlib",
    free: "../shims/cstdlib", atoi: "../shims/cstdlib", atol: "../shims/cstdlib",
    atof: "../shims/cstdlib", strtol: "../shims/cstdlib", strtod: "../shims/cstdlib",
    abs: "../shims/cstdlib", exit: "../shims/cstdlib", atexit: "../shims/cstdlib",
    getenv: "../shims/cstdlib", system: "../shims/cstdlib", rand: "../shims/cstdlib",
    srand: "../shims/cstdlib", qsort: "../shims/cstdlib", bsearch: "../shims/cstdlib",

    // --- C math ---
    sqrt: "../shims/cmath", sin: "../shims/cmath", cos: "../shims/cmath",
    tan: "../shims/cmath", asin: "../shims/cmath", acos: "../shims/cmath",
    atan: "../shims/cmath", atan2: "../shims/cmath", exp: "../shims/cmath",
    log: "../shims/cmath", log10: "../shims/cmath", pow: "../shims/cmath",
    ceil: "../shims/cmath", floor: "../shims/cmath", fabs: "../shims/cmath",
    fmod: "../shims/cmath",

    // --- SDL2 video/rendering ---
    SDL_Init: "../shims/sdl2_browser", SDL_Quit: "../shims/sdl2_browser",
    SDL_CreateWindow: "../shims/sdl2_browser", SDL_DestroyWindow: "../shims/sdl2_browser",
    SDL_CreateRenderer: "../shims/sdl2_browser", SDL_DestroyRenderer: "../shims/sdl2_browser",
    SDL_SetRenderDrawColor: "../shims/sdl2_browser", SDL_RenderClear: "../shims/sdl2_browser",
    SDL_RenderPresent: "../shims/sdl2_browser", SDL_RenderDrawLine: "../shims/sdl2_browser",
    SDL_RenderDrawRect: "../shims/sdl2_browser", SDL_RenderFillRect: "../shims/sdl2_browser",
    SDL_RenderCopy: "../shims/sdl2_browser", SDL_CreateTextureFromSurface: "../shims/sdl2_browser",
    SDL_FreeSurface: "../shims/sdl2_browser", SDL_DestroyTexture: "../shims/sdl2_browser",
    SDL_GetWindowSize: "../shims/sdl2_browser", SDL_Delay: "../shims/sdl2_browser",
    SDL_GetTicks: "../shims/sdl2_browser", SDL_LoadBMP: "../shims/sdl2_browser",
    SDL_MapRGB: "../shims/sdl2_browser", SDL_SetColorKey: "../shims/sdl2_browser",
    SDL_CreateRGBSurface: "../shims/sdl2_browser", SDL_BlitSurface: "../shims/sdl2_browser",
    SDL_FillRect: "../shims/sdl2_browser", SDL_SetWindowTitle: "../shims/sdl2_browser",
    SDL_ShowWindow: "../shims/sdl2_browser", SDL_HideWindow: "../shims/sdl2_browser",
    SDL_GetWindowSurface: "../shims/sdl2_browser", SDL_UpdateWindowSurface: "../shims/sdl2_browser",
    SDL_SetRenderDrawBlendMode: "../shims/sdl2_browser", SDL_RenderSetLogicalSize: "../shims/sdl2_browser",
    SDL_CreateTexture: "../shims/sdl2_browser", SDL_SetTextureBlendMode: "../shims/sdl2_browser",
    SDL_SetTextureColorMod: "../shims/sdl2_browser", SDL_LockTexture: "../shims/sdl2_browser",
    SDL_UnlockTexture: "../shims/sdl2_browser", SDL_RenderCopyEx: "../shims/sdl2_browser",
    SDL_GetRendererInfo: "../shims/sdl2_browser", SDL_GetWindowFlags: "../shims/sdl2_browser",

    // --- SDL2 events/input ---
    SDL_PollEvent: "../shims/sdl2_events_browser",
    SDL_PushEvent: "../shims/sdl2_events_browser",
    SDL_WaitEvent: "../shims/sdl2_events_browser",
    SDL_GetKeyboardState: "../shims/sdl2_events_browser",
    SDL_GetMouseState: "../shims/sdl2_events_browser",
    SDL_WarpMouseInWindow: "../shims/sdl2_events_browser",
    SDL_ShowCursor: "../shims/sdl2_events_browser",
    SDL_SetRelativeMouseMode: "../shims/sdl2_events_browser",
    SDL_GetRelativeMouseState: "../shims/sdl2_events_browser",
    SDL_StartTextInput: "../shims/sdl2_events_browser",
    SDL_StopTextInput: "../shims/sdl2_events_browser",

    // --- SDL2_mixer ---
    Mix_OpenAudio: "../shims/sdl2_mixer_browser",
    Mix_CloseAudio: "../shims/sdl2_mixer_browser",
    Mix_LoadWAV: "../shims/sdl2_mixer_browser",
    Mix_FreeChunk: "../shims/sdl2_mixer_browser",
    Mix_PlayChannel: "../shims/sdl2_mixer_browser",
    Mix_HaltChannel: "../shims/sdl2_mixer_browser",
    Mix_Volume: "../shims/sdl2_mixer_browser",
    Mix_LoadMUS: "../shims/sdl2_mixer_browser",
    Mix_FreeMusic: "../shims/sdl2_mixer_browser",
    Mix_PlayMusic: "../shims/sdl2_mixer_browser",
    Mix_HaltMusic: "../shims/sdl2_mixer_browser",
    Mix_PauseMusic: "../shims/sdl2_mixer_browser",
    Mix_ResumeMusic: "../shims/sdl2_mixer_browser",
    Mix_VolumeMusic: "../shims/sdl2_mixer_browser",
    Mix_Playing: "../shims/sdl2_mixer_browser",
    Mix_PlayingMusic: "../shims/sdl2_mixer_browser",

    // --- Lua C API ---
    lua_pushinteger: "../shims/lua", lua_pushnumber: "../shims/lua",
    lua_pushstring: "../shims/lua", lua_pushboolean: "../shims/lua",
    lua_pushnil: "../shims/lua", lua_tointeger: "../shims/lua",
    lua_tonumber: "../shims/lua", lua_tostring: "../shims/lua",
    lua_toboolean: "../shims/lua", lua_gettop: "../shims/lua",
    lua_settop: "../shims/lua", lua_pop: "../shims/lua",
    lua_getglobal: "../shims/lua", lua_setglobal: "../shims/lua",
    lua_register: "../shims/lua", lua_pcall: "../shims/lua",
    lua_type: "../shims/lua", lua_isnil: "../shims/lua",
    lua_isnumber: "../shims/lua", lua_isstring: "../shims/lua",
    luaL_newstate: "../shims/lua", luaL_openlibs: "../shims/lua",
    luaL_dostring: "../shims/lua", luaL_dofile: "../shims/lua",
    luaL_error: "../shims/lua", lua_close: "../shims/lua",
    lua_newstate: "../shims/lua",
  };
  if (shimMap[name]) {
    return `import { ${name} } from "${shimMap[name]}.js";\n` + code;
  }

  // Last resort: declare as any
  return `declare const ${name}: any;\n` + code;
}

function fixMissingExport(code: string, error: ClassifiedError): string {
  // Add export to the target declaration in the file that should export it
  const name = error.data.name;
  if (!name) return code;
  return code.replace(new RegExp(`^(function\\s+${name}|class\\s+${name}|const\\s+${name}|let\\s+${name})`, "m"), `export $1`);
}

function fixMissingModule(code: string, error: ClassifiedError): string {
  const mod = error.data.modulePath;
  if (!mod) return code;
  // Try alternative extensions
  const line = code.split("\n")[error.line - 1] ?? "";
  if (line.includes(mod)) {
    // Try removing .js extension or adding it
    const fixed = mod.endsWith(".js") ? mod.slice(0, -3) : mod + ".js";
    return code.replace(mod, fixed);
  }
  // Comment out the broken import
  const lines = code.split("\n");
  if (error.line > 0 && error.line <= lines.length) {
    lines[error.line - 1] = "// " + lines[error.line - 1];
  }
  return lines.join("\n");
}

function fixTypeMismatch(code: string, error: ClassifiedError): string {
  const lines = code.split("\n");
  if (error.line > 0 && error.line <= lines.length) {
    // Add 'as any' to the right side of the assignment
    lines[error.line - 1] = lines[error.line - 1].replace(/= (.+);$/, "= ($1) as any;");
  }
  return lines.join("\n");
}

function fixMissingProperty(code: string, error: ClassifiedError): string {
  const lines = code.split("\n");
  if (error.line > 0 && error.line <= lines.length) {
    const prop = error.data.name ?? "";
    // Add 'as any' before the property access
    const line = lines[error.line - 1];
    lines[error.line - 1] = line.replace(/(\w+)\.(\w+)/g, (match, obj, p) => {
      if (p === prop) return `(${obj} as any).${p}`;
      return match;
    });
  }
  return lines.join("\n");
}

function fixArgumentMismatch(code: string, error: ClassifiedError): string {
  const lines = code.split("\n");
  if (error.line > 0 && error.line <= lines.length) {
    // Wrap the problematic argument in 'as any'
    lines[error.line - 1] = lines[error.line - 1].replace(/\(([^)]+)\)/, (match, args) => {
      return `(${args} as any)`;
    });
  }
  return lines.join("\n");
}

function fixTypo(code: string, error: ClassifiedError): string {
  const name = error.data.name;
  const suggestion = error.data.suggestion;
  if (name && suggestion) {
    return code.replace(new RegExp(`\\b${name}\\b`, "g"), suggestion);
  }
  return code;
}

function fixArgumentCount(code: string, error: ClassifiedError): string {
  // Can't easily fix without more context — add 'as any' cast
  return code;
}

function fixPossiblyUndefined(code: string, error: ClassifiedError): string {
  const lines = code.split("\n");
  if (error.line > 0 && error.line <= lines.length) {
    // Add non-null assertion (!) before the property access
    lines[error.line - 1] = lines[error.line - 1].replace(/(\w+)(\.|\[)/, "$1!$2");
  }
  return lines.join("\n");
}

function fixImplicitAny(code: string, error: ClassifiedError): string {
  const lines = code.split("\n");
  if (error.line > 0 && error.line <= lines.length) {
    const param = error.data.name ?? "";
    if (param) {
      lines[error.line - 1] = lines[error.line - 1].replace(
        new RegExp(`\\b${param}\\b(?!:)`), `${param}: any`
      );
    }
  }
  return lines.join("\n");
}

function fixSyntaxError(code: string, error: ClassifiedError): string {
  const lines = code.split("\n");
  if (error.line > 0 && error.line <= lines.length) {
    lines[error.line - 1] = "// SYNTAX ERROR: " + lines[error.line - 1];
  }
  return lines.join("\n");
}

function fixDuplicateDecl(code: string, error: ClassifiedError): string {
  const name = error.data.name;
  if (!name) return code;
  const lines = code.split("\n");
  if (error.line > 0 && error.line <= lines.length) {
    const line = lines[error.line - 1];
    if (line.includes(`let ${name}`) || line.includes(`const ${name}`) || line.includes(`function ${name}`)) {
      lines[error.line - 1] = "// DUPLICATE: " + line;
    }
  }
  return lines.join("\n");
}

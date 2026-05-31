export type ProgramCategory = 'cli' | 'interactive_sdl' | 'server' | 'file_processor' | 'lua_scripted';

export interface InputProfile {
  category: ProgramCategory;
  usesStdin: boolean;
  usesSDL: boolean;
  usesSockets: boolean;
  usesFiles: string[];
  usesLua: boolean;
  registeredLuaFunctions: string[];
}

const SDL_FUNCTIONS = ['SDL_PollEvent', 'SDL_WaitEvent'];
const STDIN_FUNCTIONS = ['scanf', 'fgets', 'getchar', 'cin', 'getline', 'gets'];
const SOCKET_FUNCTIONS = ['socket', 'bind', 'listen', 'accept', 'connect'];
const LUA_REGISTER = 'lua_register';

function walkAST(node: any, visitor: (n: any) => void): void {
  if (!node || typeof node !== 'object') return;
  visitor(node);
  if (Array.isArray(node)) {
    for (const child of node) walkAST(child, visitor);
  } else {
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue;
      walkAST(node[key], visitor);
    }
  }
}

function detectFromAST(ast: any, profile: InputProfile): void {
  walkAST(ast, (node) => {
    const name: string | undefined =
      node.kind === 'CallExpr' && node.callee?.name ? node.callee.name :
      node.kind === 'DeclRefExpr' && node.name ? node.name :
      node.name && typeof node.name === 'string' ? node.name :
      undefined;
    if (!name) return;

    if (SDL_FUNCTIONS.includes(name)) profile.usesSDL = true;
    if (STDIN_FUNCTIONS.includes(name)) profile.usesStdin = true;
    if (SOCKET_FUNCTIONS.includes(name)) profile.usesSockets = true;

    if (name === 'fopen' && node.args) {
      const fileArg = node.args[0];
      if (fileArg && typeof fileArg.value === 'string') {
        profile.usesFiles.push(fileArg.value);
      }
    }

    if (name === LUA_REGISTER) {
      profile.usesLua = true;
      if (node.args && node.args.length >= 3) {
        const nameArg = node.args[1];
        if (nameArg && typeof nameArg.value === 'string') {
          profile.registeredLuaFunctions.push(nameArg.value);
        }
      }
    }
  });
}

function detectFromSource(source: string, profile: InputProfile): void {
  if (/\bSDL_PollEvent\b|\bSDL_WaitEvent\b/.test(source)) profile.usesSDL = true;
  if (/\bscanf\b|\bfgets\b|\bgetchar\b|\bcin\b|\bgetline\b|\bgets\b/.test(source)) profile.usesStdin = true;
  if (/\bsocket\s*\(|\bbind\s*\(|\blisten\s*\(|\baccept\s*\(|\bconnect\s*\(/.test(source)) profile.usesSockets = true;

  const fopenMatches = source.matchAll(/\bfopen\s*\(\s*"([^"]+)"/g);
  for (const m of fopenMatches) profile.usesFiles.push(m[1]);

  const luaRegMatches = source.matchAll(/\blua_register\s*\([^,]+,\s*"([^"]+)"/g);
  for (const m of luaRegMatches) {
    profile.usesLua = true;
    profile.registeredLuaFunctions.push(m[1]);
  }
}

export function detectInputMechanisms(astOrSource: any): InputProfile {
  const profile: InputProfile = {
    category: 'cli',
    usesStdin: false,
    usesSDL: false,
    usesSockets: false,
    usesFiles: [],
    usesLua: false,
    registeredLuaFunctions: [],
  };

  if (typeof astOrSource === 'string') {
    detectFromSource(astOrSource, profile);
  } else {
    detectFromAST(astOrSource, profile);
  }

  if (profile.usesSDL) profile.category = 'interactive_sdl';
  else if (profile.usesSockets) profile.category = 'server';
  else if (profile.usesLua) profile.category = 'lua_scripted';
  else if (profile.usesFiles.length > 0) profile.category = 'file_processor';

  return profile;
}

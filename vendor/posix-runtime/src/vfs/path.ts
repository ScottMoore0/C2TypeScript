// MC-1: POSIX-style path utilities.
// All paths in Mirage use forward slashes. Absolute paths start with "/".

/** Normalize a path: resolve ".", "..", collapse multiple slashes. */
export function normalize(p: string): string {
  if (p.length === 0) return ".";
  const isAbsolute = p.startsWith("/");
  const parts = p.split("/").filter(s => s.length > 0 && s !== ".");
  const resolved: string[] = [];

  for (const part of parts) {
    if (part === "..") {
      if (resolved.length > 0 && resolved[resolved.length - 1] !== "..") {
        resolved.pop();
      } else if (!isAbsolute) {
        resolved.push("..");
      }
    } else {
      resolved.push(part);
    }
  }

  let result = resolved.join("/");
  if (isAbsolute) result = "/" + result;
  return result || (isAbsolute ? "/" : ".");
}

/** Join path segments. */
export function join(...parts: string[]): string {
  return normalize(parts.filter(p => p.length > 0).join("/"));
}

/** Get the directory part of a path. */
export function dirname(p: string): string {
  const norm = normalize(p);
  const lastSlash = norm.lastIndexOf("/");
  if (lastSlash === -1) return ".";
  if (lastSlash === 0) return "/";
  return norm.substring(0, lastSlash);
}

/** Get the filename part of a path. */
export function basename(p: string, ext?: string): string {
  const norm = normalize(p);
  const lastSlash = norm.lastIndexOf("/");
  const name = lastSlash === -1 ? norm : norm.substring(lastSlash + 1);
  if (ext && name.endsWith(ext)) return name.substring(0, name.length - ext.length);
  return name;
}

/** Get the file extension (including the dot). */
export function extname(p: string): string {
  const name = basename(p);
  const dotIdx = name.lastIndexOf(".");
  if (dotIdx <= 0) return "";
  return name.substring(dotIdx);
}

/** Check if a path is absolute. */
export function isAbsolute(p: string): boolean {
  return p.startsWith("/");
}

/** Resolve a path relative to a base directory. */
export function resolve(base: string, p: string): string {
  if (isAbsolute(p)) return normalize(p);
  return normalize(base + "/" + p);
}

/** Split a path into its directory components. */
export function split(p: string): string[] {
  return normalize(p).split("/").filter(s => s.length > 0);
}

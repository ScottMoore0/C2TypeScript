// MC-4: Environment variables and working directory.
// POSIX: getenv, setenv, unsetenv, getcwd, chdir.

export class Environment {
  private vars = new Map<string, string>();
  private _cwd: string = "/";

  constructor(initial?: Record<string, string>) {
    if (initial) {
      for (const [k, v] of Object.entries(initial)) {
        this.vars.set(k, v);
      }
    }
  }

  /** Get an environment variable. Returns undefined if not set.
   *  POSIX IEEE Std 1003.1-2017 §getenv. */
  getenv(name: string): string | undefined {
    return this.vars.get(name);
  }

  /** Alias of getenv for callers that prefer Map-style .get(). */
  get(name: string): string | undefined {
    return this.vars.get(name);
  }

  /** Set an environment variable.
   *  POSIX IEEE Std 1003.1-2017 §setenv. */
  setenv(name: string, value: string): void {
    this.vars.set(name, value);
  }

  /** Alias of setenv for callers that prefer Map-style .set(). */
  set(name: string, value: string): void {
    this.vars.set(name, value);
  }

  /** Check whether an environment variable is currently defined. */
  has(name: string): boolean {
    return this.vars.has(name);
  }

  /** Unset an environment variable.
   *  POSIX IEEE Std 1003.1-2017 §unsetenv. */
  unsetenv(name: string): void {
    this.vars.delete(name);
  }

  /** Get all environment variables as a record. */
  getAll(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of this.vars) result[k] = v;
    return result;
  }

  /** Get the current working directory. */
  get cwd(): string {
    return this._cwd;
  }

  /** Change the current working directory. */
  chdir(path: string): void {
    // Normalize: ensure it starts with "/" and has no trailing slash (except root).
    let norm = path.startsWith("/") ? path : this._cwd + "/" + path;
    // Simple normalization.
    const parts = norm.split("/").filter(s => s.length > 0);
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === "..") { resolved.pop(); }
      else if (part !== ".") { resolved.push(part); }
    }
    this._cwd = "/" + resolved.join("/");
  }

  /** Resolve a potentially relative path against cwd. */
  resolve(path: string): string {
    if (path.startsWith("/")) return path;
    const base = this._cwd.endsWith("/") ? this._cwd : this._cwd + "/";
    return base + path;
  }
}

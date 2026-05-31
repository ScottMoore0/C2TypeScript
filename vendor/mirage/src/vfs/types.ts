// MC-2: VFS node types.

export type NodeType = "file" | "directory";

export interface FileStat {
  type: NodeType;
  size: number;
  created: number;   // timestamp ms (POSIX st_ctime, IEEE Std 1003.1-2017 §<sys/stat.h>)
  modified: number;   // timestamp ms (POSIX st_mtime)
  /** Alias of `modified` matching POSIX st_mtime field name. */
  mtime?: number;
  mode: number;       // POSIX permission bits (default 0o644 file, 0o755 dir)
}

export interface VfsNode {
  type: NodeType;
  name: string;
  stat: FileStat;
}

export interface VfsFile extends VfsNode {
  type: "file";
  data: Uint8Array;
}

export interface VfsDirectory extends VfsNode {
  type: "directory";
  children: Map<string, VfsFile | VfsDirectory>;
}

export function makeFile(name: string, data: Uint8Array = new Uint8Array(0), now: number = Date.now()): VfsFile {
  return {
    type: "file",
    name,
    data,
    stat: { type: "file", size: data.length, created: now, modified: now, mtime: now, mode: 0o644 }
  };
}

export function makeDirectory(name: string, now: number = Date.now()): VfsDirectory {
  return {
    type: "directory",
    name,
    children: new Map(),
    stat: { type: "directory", size: 0, created: now, modified: now, mtime: now, mode: 0o755 }
  };
}

export type ArtifactKind =
  | "baseline-stdout"
  | "baseline-stderr"
  | "translated-stdout"
  | "translated-stderr"
  | "generated-file"
  | "output-file"
  | "browser-log"
  | "browser-events";

export interface ArtifactRecord {
  kind: ArtifactKind;
  label: string;
  absolutePath: string;
  relativePath: string;
}

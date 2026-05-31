import type { CorpusConfig } from "../config/types.js";

export interface CorpusRecord {
  name: string;
  description?: string;
  fixtureIds: string[];
  tags: string[];
  languages: string[];
  projects: string[];
  config: CorpusConfig;
}

import type { CorpusConfig } from "../config/types.js";
import type { FixtureRecord } from "../fixtures/types.js";
import type { CorpusRecord } from "./types.js";

function uniqueSorted(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))].sort();
}

function projectNameForFixture(fixture: FixtureRecord): string {
  return fixture.id.split("-")[0] ?? fixture.id;
}

export function discoverCorpora(configs: CorpusConfig[] = [], fixtures: FixtureRecord[] = []): CorpusRecord[] {
  return configs
    .map((config) => ({
      name: config.name,
      description: config.description,
      fixtureIds: uniqueSorted(config.fixtureIds),
      tags: uniqueSorted(config.tags),
      languages: uniqueSorted(config.languages?.map((value) => value.toLowerCase())),
      projects: uniqueSorted(config.projects),
      config
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((record) => {
      const derivedFixtureIds = new Set(record.fixtureIds);
      const hasDerivedSelectors =
        record.tags.length > 0 || record.languages.length > 0 || record.projects.length > 0;

      if (hasDerivedSelectors) {
        for (const fixture of fixtures) {
          const project = projectNameForFixture(fixture);
          const tagMatch = record.tags.length === 0 || fixture.tags.some((tag) => record.tags.includes(tag));
          const languageMatch = record.languages.length === 0 || record.languages.includes(fixture.language.toLowerCase());
          const projectMatch = record.projects.length === 0 || record.projects.includes(project);

          if (tagMatch && languageMatch && projectMatch) {
            derivedFixtureIds.add(fixture.id);
          }
        }
      }

      return {
        ...record,
        fixtureIds: [...derivedFixtureIds].sort()
      };
    });
}

export function expandCorpusFixtureIds(corpora: CorpusRecord[], selectedCorpora: string[] = []): string[] {
  const wanted = new Set(selectedCorpora.map((value) => value.trim()).filter(Boolean));
  if (wanted.size === 0) {
    return [];
  }

  const ids = new Set<string>();
  for (const corpus of corpora) {
    if (!wanted.has(corpus.name)) {
      continue;
    }
    for (const fixtureId of corpus.fixtureIds) {
      ids.add(fixtureId);
    }
  }
  return [...ids].sort();
}

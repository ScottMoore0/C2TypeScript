import { dirname, isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { ValidationHarnessConfig } from "../config/types.js";
import type { BrowserLauncher } from "./launcher.js";

export class BrowserLauncherLoadError extends Error {}

// Resolves a config-declared browser launcher module to a runtime BrowserLauncher.
// Returns undefined when no launcher is configured — the CLI silently skips the
// browser path in that case. The module path is resolved relative to the config
// file's directory so config files can ship alongside their launcher factories.
export async function loadBrowserLauncher(
  config: ValidationHarnessConfig,
  configPath: string
): Promise<BrowserLauncher | undefined> {
  const browserConfig = config.browser;
  if (!browserConfig?.launcherModule) {
    return undefined;
  }

  const configDir = dirname(resolve(configPath));
  const absolutePath = isAbsolute(browserConfig.launcherModule)
    ? browserConfig.launcherModule
    : resolve(configDir, browserConfig.launcherModule);
  const moduleUrl = pathToFileURL(absolutePath).href;

  let mod: Record<string, unknown>;
  try {
    mod = (await import(moduleUrl)) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new BrowserLauncherLoadError(
      `Failed to load browser launcher module at ${absolutePath}: ${message}`
    );
  }

  const exportName = browserConfig.launcherExport ?? "default";
  const factory = mod[exportName];
  if (typeof factory !== "function") {
    throw new BrowserLauncherLoadError(
      `Browser launcher module at ${absolutePath} does not export a function named "${exportName}"`
    );
  }

  let launcher: unknown;
  try {
    launcher = await (factory as (cfg: ValidationHarnessConfig) => unknown)(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new BrowserLauncherLoadError(
      `Browser launcher factory at ${absolutePath} threw: ${message}`
    );
  }

  if (
    !launcher ||
    typeof launcher !== "object" ||
    typeof (launcher as { launch?: unknown }).launch !== "function"
  ) {
    throw new BrowserLauncherLoadError(
      `Browser launcher factory at ${absolutePath} did not return a BrowserLauncher (missing launch method)`
    );
  }

  return launcher as BrowserLauncher;
}

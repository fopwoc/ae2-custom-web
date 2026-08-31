import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

import {
  IconManifestIndex,
  iconManifestSchema,
} from "@ae2-terminal/icon-manifest";

export type IconPackLoadResult =
  | { state: "disabled" }
  | { state: "loaded"; entries: number; generatedAt: string }
  | { state: "unavailable"; reason: string };

export class IconPackStore {
  readonly #directory: string | null;
  #index: IconManifestIndex | null = null;
  #pathsByHash = new Map<string, string>();

  constructor(directory: string | null) {
    this.#directory = directory;
  }

  async load(): Promise<IconPackLoadResult> {
    this.#index = null;
    this.#pathsByHash = new Map();
    if (!this.#directory) return { state: "disabled" };

    try {
      const root = resolve(this.#directory);
      const parsed = iconManifestSchema.safeParse(
        JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8")),
      );
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        const location = first?.path.join(".") || "manifest";
        throw new Error(
          `Invalid icon manifest (${parsed.error.issues.length} issues; first at ${location}: ${first?.message ?? "invalid value"})`,
        );
      }
      const manifest = parsed.data;
      const index = new IconManifestIndex(manifest);
      const paths = new Map<string, string>();

      for (const entry of manifest.entries) {
        const hash = /^icons\/[0-9a-f]{2}\/([0-9a-f]{64})\.png$/.exec(
          entry.png,
        )?.[1];
        if (!hash || paths.has(hash)) continue;
        const path = resolve(root, entry.png);
        if (!isInside(root, path)) {
          throw new Error(
            `Icon path escapes the configured pack: ${entry.png}`,
          );
        }
        paths.set(hash, path);
      }

      this.#index = index;
      this.#pathsByHash = paths;
      return {
        state: "loaded",
        entries: manifest.entries.length,
        generatedAt: manifest.generatedAt,
      };
    } catch (cause) {
      return {
        state: "unavailable",
        reason: cause instanceof Error ? cause.message : String(cause),
      };
    }
  }

  resolveIconUrl(legacyId: string, displayName?: string): string | undefined {
    const hash = this.#index?.iconHash(legacyId, displayName);
    return hash ? `/icons/${hash}.png` : undefined;
  }

  resolveFluidIconUrl(
    fluidId: string,
    displayName: string,
  ): string | undefined {
    const hash = this.#index?.fluidIconHash(fluidId, displayName);
    return hash ? `/icons/${hash}.png` : undefined;
  }

  async readIcon(hash: string): Promise<Uint8Array | null> {
    const path = this.#pathsByHash.get(hash);
    if (!path || !this.#index?.hasHash(hash)) return null;
    try {
      return await readFile(path);
    } catch {
      return null;
    }
  }
}

function isInside(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

import type { IconManifest } from "./contracts.js";

const hashFromPath = /^icons\/[0-9a-f]{2}\/([0-9a-f]{64})\.png$/;

export class IconManifestIndex {
  readonly #byLegacyId = new Map<string, string>();
  readonly #knownHashes = new Set<string>();

  constructor(manifest: IconManifest) {
    for (const entry of manifest.entries) {
      const hash = hashFromPath.exec(entry.png)?.[1];
      if (!hash) continue;
      this.#knownHashes.add(hash);
      if (!this.#byLegacyId.has(entry.legacyId)) {
        this.#byLegacyId.set(entry.legacyId, hash);
      }
    }
  }

  iconHash(legacyId: string): string | undefined {
    return this.#byLegacyId.get(legacyId);
  }

  hasHash(hash: string): boolean {
    return this.#knownHashes.has(hash);
  }
}

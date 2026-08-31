import type { IconManifest } from "./contracts.js";

const hashFromPath = /^icons\/[0-9a-f]{2}\/([0-9a-f]{64})\.png$/;

export class IconManifestIndex {
  readonly #byLegacyId = new Map<string, string>();
  readonly #byDisplayName = new Map<string, string>();
  readonly #ambiguousDisplayNames = new Set<string>();
  readonly #knownHashes = new Set<string>();

  constructor(manifest: IconManifest) {
    for (const entry of manifest.entries) {
      const hash = hashFromPath.exec(entry.png)?.[1];
      if (!hash) continue;
      this.#knownHashes.add(hash);
      if (!this.#byLegacyId.has(entry.legacyId)) {
        this.#byLegacyId.set(entry.legacyId, hash);
      }
      this.#addDisplayName(entry.displayName, hash);
    }
  }

  iconHash(legacyId: string, displayName?: string): string | undefined {
    return (
      this.#byLegacyId.get(legacyId) ??
      (displayName
        ? this.#byDisplayName.get(normalizeDisplayName(displayName))
        : undefined)
    );
  }

  hasHash(hash: string): boolean {
    return this.#knownHashes.has(hash);
  }

  #addDisplayName(displayName: string, hash: string): void {
    const normalized = normalizeDisplayName(displayName);
    if (!normalized || this.#ambiguousDisplayNames.has(normalized)) return;
    const existing = this.#byDisplayName.get(normalized);
    if (existing && existing !== hash) {
      this.#byDisplayName.delete(normalized);
      this.#ambiguousDisplayNames.add(normalized);
      return;
    }
    this.#byDisplayName.set(normalized, hash);
  }
}

function normalizeDisplayName(value: string): string {
  return value.replace(/§./g, "").trim().toLocaleLowerCase("en-US");
}

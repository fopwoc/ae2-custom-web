import type { IconManifest } from "./contracts.js";

const hashFromPath = /^icons\/[0-9a-f]{2}\/([0-9a-f]{64})\.png$/;

type FluidIconCandidate = {
  hash: string;
  legacyId: string;
  priority: number;
};

export class IconManifestIndex {
  readonly #byLegacyId = new Map<string, string>();
  readonly #byDisplayName = new Map<string, string>();
  readonly #ambiguousDisplayNames = new Set<string>();
  readonly #byFluidId = new Map<string, string>();
  readonly #byFluidName = new Map<string, FluidIconCandidate>();
  readonly #knownHashes = new Set<string>();

  constructor(manifest: IconManifest) {
    for (const entry of manifest.entries) {
      const hash = hashFromPath.exec(entry.png)?.[1];
      if (!hash) continue;
      this.#knownHashes.add(hash);
      if (entry.kind === "fluid") {
        this.#addFluid(entry.fluidId, entry.displayName, hash);
      } else {
        if (!this.#byLegacyId.has(entry.legacyId)) {
          this.#byLegacyId.set(entry.legacyId, hash);
        }
        this.#addDisplayName(entry.displayName, hash);
        this.#addFluidAliases(entry.legacyId, entry.displayName, hash);
      }
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

  fluidIconHash(fluidId: string, displayName: string): string | undefined {
    const exact = this.#byFluidId.get(normalizeFluidId(fluidId));
    if (exact) return exact;

    for (const candidate of [displayName, humanizeFluidId(fluidId)]) {
      const displayHash = this.#byDisplayName.get(
        normalizeDisplayName(candidate),
      );
      if (displayHash) return displayHash;

      const fluidIcon = this.#byFluidName.get(normalizeFluidName(candidate));
      if (fluidIcon) return fluidIcon.hash;
    }
    return undefined;
  }

  #addFluid(fluidId: string, displayName: string, hash: string): void {
    const normalizedId = normalizeFluidId(fluidId);
    if (!this.#byFluidId.has(normalizedId)) {
      this.#byFluidId.set(normalizedId, hash);
    }
    const candidate = {
      hash,
      legacyId: `fluid:${normalizedId}`,
      priority: 3,
    };
    this.#addFluidName(displayName, candidate);
    this.#addFluidName(humanizeFluidId(fluidId), candidate);
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

  #addFluidAliases(legacyId: string, displayName: string, hash: string): void {
    const name = cleanDisplayName(displayName);
    if (!/\s+cell$/i.test(name)) return;

    const cellContents = name.replace(/\s+cell$/i, "").trim();
    const aliases = [cellContents];
    if (!/^liquid\s+/i.test(cellContents)) {
      aliases.push(`Liquid ${cellContents}`);
    }
    if (/\s+rubber$/i.test(cellContents)) {
      const withoutRubber = cellContents.replace(/\s+rubber$/i, "").trim();
      aliases.push(withoutRubber, `Liquid ${withoutRubber}`);
    }

    for (const alias of aliases) {
      const candidate = {
        hash,
        legacyId,
        priority: fluidCellPriority(legacyId),
      };
      this.#addFluidName(alias, candidate);
    }
  }

  #addFluidName(name: string, candidate: FluidIconCandidate): void {
    const normalized = normalizeFluidName(name);
    if (!normalized) return;
    const existing = this.#byFluidName.get(normalized);
    if (!existing || preferredFluidIcon(candidate, existing)) {
      this.#byFluidName.set(normalized, candidate);
    }
  }
}

function normalizeDisplayName(value: string): string {
  return cleanDisplayName(value).toLocaleLowerCase("en-US");
}

function normalizeFluidName(value: string): string {
  return normalizeDisplayName(value).replace(/[^a-z0-9]+/g, "");
}

function cleanDisplayName(value: string): string {
  return value.replace(/§./g, "").trim();
}

function humanizeFluidId(fluidId: string): string {
  return fluidId.replace(/[._-]+/g, " ");
}

function normalizeFluidId(fluidId: string): string {
  return fluidId.trim().toLocaleLowerCase("en-US");
}

function fluidCellPriority(legacyId: string): number {
  const normalized = legacyId.toLocaleLowerCase("en-US");
  if (normalized.startsWith("gregtech:") || normalized.startsWith("bartworks:"))
    return 2;
  return 1;
}

function preferredFluidIcon(
  candidate: FluidIconCandidate,
  existing: FluidIconCandidate,
): boolean {
  return (
    candidate.priority > existing.priority ||
    (candidate.priority === existing.priority &&
      candidate.legacyId.localeCompare(existing.legacyId, "en-US") < 0)
  );
}

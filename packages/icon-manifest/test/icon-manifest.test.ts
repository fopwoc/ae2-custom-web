import { describe, expect, it } from "vitest";

import { IconManifestIndex, iconManifestSchema } from "../src/index.js";

const firstHash = "a".repeat(64);
const secondHash = "b".repeat(64);

function manifest() {
  return {
    schema: "ae2-icons/v1",
    generatedAt: "2026-08-31T12:00:00Z",
    environment: {
      minecraft: "1.7.10",
      iconSize: 64,
      modsSha256: "c".repeat(64),
      mods: ["NotEnoughItems@2.8.125-GTNH"],
      resourcePacks: [],
    },
    entries: [
      {
        kind: "item",
        registry: "minecraft:iron_ingot",
        damage: 0,
        nbtHash: null,
        legacyId: "minecraft:iron_ingot:0",
        displayName: "Iron Ingot",
        png: `icons/aa/${firstHash}.png`,
      },
    ],
    failures: [],
  };
}

describe("icon manifest", () => {
  it("parses a versioned exporter manifest", () => {
    expect(iconManifestSchema.parse(manifest()).entries).toHaveLength(1);
  });

  it("accepts an omitted NBT hash for ordinary item stacks", () => {
    const value = manifest();
    Reflect.deleteProperty(value.entries[0]!, "nbtHash");

    expect(iconManifestSchema.parse(value).entries[0]?.nbtHash).toBeUndefined();
  });

  it("rejects paths outside the content-addressed icon tree", () => {
    const invalid = manifest();
    invalid.entries[0]!.png = "../secret.png";
    expect(iconManifestSchema.safeParse(invalid).success).toBe(false);
  });

  it("uses the first exported variant for a legacy AE2 item id", () => {
    const value = iconManifestSchema.parse(manifest());
    value.entries.push({
      ...value.entries[0]!,
      nbtHash: "d".repeat(64),
      png: `icons/bb/${secondHash}.png`,
    });
    const index = new IconManifestIndex(iconManifestSchema.parse(value));

    expect(index.iconHash("minecraft:iron_ingot:0")).toBe(firstHash);
    expect(index.hasHash(secondHash)).toBe(true);
  });

  it("falls back to a uniquely exported display name", () => {
    const index = new IconManifestIndex(iconManifestSchema.parse(manifest()));

    expect(index.iconHash("unknown:item:0", "§fIron Ingot")).toBe(firstHash);
  });
});

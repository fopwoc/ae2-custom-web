import { describe, expect, it } from "vitest";

import { IconManifestIndex, iconManifestSchema } from "../src/index.js";

const firstHash = "a".repeat(64);
const secondHash = "b".repeat(64);
const fluidHashes = {
  sodium: "b".repeat(64),
  steam: "c".repeat(64),
  hssg: "d".repeat(64),
  silicone: "e".repeat(64),
  solderingAlloy: "f".repeat(64),
  ammoniumNitrate: "1".repeat(64),
};

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
    const entry = iconManifestSchema.parse(value).entries[0];

    expect(entry?.kind).toBe("item");
    expect(entry?.kind === "item" ? entry.nbtHash : null).toBeUndefined();
  });

  it("rejects paths outside the content-addressed icon tree", () => {
    const invalid = manifest();
    invalid.entries[0]!.png = "../secret.png";
    expect(iconManifestSchema.safeParse(invalid).success).toBe(false);
  });

  it("uses the first exported variant for a legacy AE2 item id", () => {
    const value = iconManifestSchema.parse(manifest());
    const firstEntry = value.entries[0];
    if (!firstEntry || firstEntry.kind !== "item") {
      throw new Error("Expected the item fixture to parse as an item entry");
    }
    value.entries.push({
      ...firstEntry,
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

  it.each([
    ["liquid_sodium", "Liquid Sodium", fluidHashes.sodium],
    ["steam", "Steam", fluidHashes.steam],
    ["molten.hssg", "Molten HSS-G", fluidHashes.hssg],
    ["molten.silicone", "Molten Silicone", fluidHashes.silicone],
    [
      "molten.solderingalloy",
      "Molten Soldering Alloy",
      fluidHashes.solderingAlloy,
    ],
    [
      "ammonium nitrate solution",
      "Ammonium Nitrate Solution",
      fluidHashes.ammoniumNitrate,
    ],
  ])(
    "resolves the GTNH fluid %s through its exported cell",
    (fluidId, displayName, expectedHash) => {
      const value = manifest();
      value.entries.push(
        fluidCell("gregtech:sodium_cell:0", "Sodium Cell", fluidHashes.sodium),
        fluidCell("ic2:steam_cell:0", "Steam Cell", fluidHashes.steam),
        fluidCell(
          "gregtech:hssg_cell:0",
          "Molten HSS-G Cell",
          fluidHashes.hssg,
        ),
        fluidCell(
          "gregtech:silicone_cell:0",
          "Molten Silicone Rubber Cell",
          fluidHashes.silicone,
        ),
        fluidCell(
          "gregtech:soldering_alloy_cell:0",
          "Molten Soldering Alloy Cell",
          fluidHashes.solderingAlloy,
        ),
        fluidCell(
          "bartworks:ammonium_nitrate_solution_cell:0",
          "Ammonium Nitrate Solution Cell",
          fluidHashes.ammoniumNitrate,
        ),
      );
      const index = new IconManifestIndex(iconManifestSchema.parse(value));

      expect(index.fluidIconHash(fluidId, displayName)).toBe(expectedHash);
    },
  );

  it("prefers the GTNH-native cell when several mods export the same fluid", () => {
    const value = manifest();
    value.entries.push(
      fluidCell("ic2:steam_cell:0", "Steam Cell", firstHash),
      fluidCell("gregtech:steam_cell:0", "Steam Cell", secondHash),
    );
    const index = new IconManifestIndex(iconManifestSchema.parse(value));

    expect(index.fluidIconHash("steam", "Steam")).toBe(secondHash);
  });

  it("prefers a first-class fluid icon over its cell fallback", () => {
    const value = {
      ...manifest(),
      entries: [
        ...manifest().entries,
        fluidCell(
          "bartworks:ammonium_nitrate_solution_cell:0",
          "Ammonium Nitrate Solution Cell",
          firstHash,
        ),
        {
          kind: "fluid",
          fluidId: "ammonium nitrate solution",
          displayName: "Ammonium Nitrate Solution",
          png: `icons/bb/${secondHash}.png`,
        },
      ],
    };
    const parsed = iconManifestSchema.parse(value);
    const index = new IconManifestIndex(parsed);

    expect(
      index.fluidIconHash(
        "ammonium nitrate solution",
        "Ammonium Nitrate Solution",
      ),
    ).toBe(secondHash);
  });
});

function fluidCell(legacyId: string, displayName: string, hash: string) {
  return {
    ...manifest().entries[0]!,
    registry: legacyId.slice(0, legacyId.lastIndexOf(":")),
    legacyId,
    displayName,
    png: `icons/${hash.slice(0, 2)}/${hash}.png`,
  };
}

import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { IconPackStore } from "./IconPackStore";

const hash = "a".repeat(64);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("IconPackStore", () => {
  it("loads declared icons and does not expose unknown hashes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ae2-icons-"));
    temporaryDirectories.push(directory);
    await mkdir(join(directory, "icons", "aa"), { recursive: true });
    await writeFile(join(directory, "icons", "aa", `${hash}.png`), "png");
    await writeFile(
      join(directory, "manifest.json"),
      JSON.stringify(manifest()),
    );
    const store = new IconPackStore(directory);

    await expect(store.load()).resolves.toMatchObject({ state: "loaded" });
    expect(store.resolveIconUrl("minecraft:iron_ingot:0")).toBe(
      `/icons/${hash}.png`,
    );
    await expect(store.readIcon(hash)).resolves.toEqual(
      expect.objectContaining({ byteLength: 3 }),
    );
    await expect(store.readIcon("b".repeat(64))).resolves.toBeNull();
  });

  it("degrades to unavailable when the manifest is invalid", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ae2-icons-"));
    temporaryDirectories.push(directory);
    await writeFile(join(directory, "manifest.json"), "{}");
    const store = new IconPackStore(directory);

    await expect(store.load()).resolves.toMatchObject({ state: "unavailable" });
    expect(store.resolveIconUrl("minecraft:iron_ingot:0")).toBeUndefined();
  });
});

function manifest() {
  return {
    schema: "ae2-icons/v1",
    generatedAt: "2026-08-31T12:00:00Z",
    environment: {
      minecraft: "1.7.10",
      iconSize: 64,
      modsSha256: "c".repeat(64),
      mods: [],
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
        png: `icons/aa/${hash}.png`,
      },
    ],
    failures: [],
  };
}

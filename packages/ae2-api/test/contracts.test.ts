import { describe, expect, it } from "vitest";

import { itemSchema, networkSchema } from "../src/contracts.js";

describe("AE2 contracts", () => {
  it("accepts the pinned GTNH network response shape", () => {
    expect(
      networkSchema.parse({
        key: 42,
        cpuCount: 3,
        owner: "Player",
        isOwned: true,
        isTrackingEnabled: false,
      }),
    ).toMatchObject({ key: 42, cpuCount: 3 });
  });

  it("rejects unsafe non-integer crafting hashes", () => {
    expect(() =>
      itemSchema.parse({
        hashcode: 4.2,
        itemid: "minecraft:stone",
        itemname: "Stone",
        quantity: 1,
        craftable: false,
      }),
    ).toThrow();
  });
});

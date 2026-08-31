import { describe, expect, it } from "vitest";

import { inventoryResourceKind } from "./resource-kind";

describe("inventoryResourceKind", () => {
  it.each([
    "liquid_sodium",
    "steam",
    "molten.hssg",
    "molten.silicone",
    "molten.solderingalloy",
    "ammonium nitrate solution",
    "ae2fc:fluid_drop:0",
  ])("recognizes the GTNH fluid identity %s", (itemid) => {
    expect(inventoryResourceKind({ itemid })).toBe("fluid");
  });

  it("keeps the BartWorks solution cell as an item", () => {
    expect(
      inventoryResourceKind({
        itemid: "bartworks:gt.bwMetaGeneratedcell:11036",
      }),
    ).toBe("item");
  });
});

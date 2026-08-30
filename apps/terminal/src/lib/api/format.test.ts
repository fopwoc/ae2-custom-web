import { describe, expect, it } from "vitest";

import { formatDuration, itemNamespace } from "./format";

describe("terminal formatting", () => {
  it.each([
    [0, "0s"],
    [59_900, "59s"],
    [61_000, "1m 1s"],
    [3_661_000, "1h 1m"],
  ])("formats %i milliseconds as %s", (value, expected) => {
    expect(formatDuration(value)).toBe(expected);
  });

  it("extracts an item namespace with a fallback", () => {
    expect(itemNamespace("appliedenergistics2:item.ItemMultiMaterial")).toBe(
      "appliedenergistics2",
    );
    expect(itemNamespace("unqualified-item")).toBe("item");
  });
});

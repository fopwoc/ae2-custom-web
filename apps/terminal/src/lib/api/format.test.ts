import { describe, expect, it } from "vitest";

import {
  formatCompactAmount,
  formatDuration,
  itemNamespace,
  parseCompactAmount,
} from "./format";

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

  it.each([
    [999, "999"],
    [1_250, "1.25k"],
    [40_000_000, "40m"],
    [-2_500_000_000, "−2.5b"],
  ])("formats %i as compact terminal amount %s", (value, expected) => {
    expect(formatCompactAmount(value)).toBe(expected);
  });

  it.each([
    ["1", 1],
    ["20k", 20_000],
    ["40M", 40_000_000],
    ["1.5b", 1_500_000_000],
    ["0", null],
    ["ten", null],
  ])("parses terminal amount %s", (value, expected) => {
    expect(parseCompactAmount(value)).toBe(expected);
  });
});

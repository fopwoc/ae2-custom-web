export type InventoryResourceKind = "item" | "fluid";

const fluidDropItemId = "ae2fc:fluid_drop:0";

export function inventoryResourceKind(item: {
  itemid: string;
}): InventoryResourceKind {
  return item.itemid === fluidDropItemId || !item.itemid.includes(":")
    ? "fluid"
    : "item";
}

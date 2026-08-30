import { z } from "zod";

export const sessionSchema = z.object({
  token: z.string().min(1),
  username: z.string().min(1),
  isAdmin: z.boolean(),
  isOutdated: z.boolean(),
});

export const genericStackSchema = z.object({
  itemid: z.string(),
  itemname: z.string(),
  quantity: z.number().int(),
});

export const networkSchema = z.object({
  key: z.number().int(),
  cpuCount: z.number().int().nonnegative(),
  owner: z.string(),
  isOwned: z.boolean(),
  isTrackingEnabled: z.boolean(),
});

export const itemSchema = z.object({
  hashcode: z.number().int(),
  itemid: z.string(),
  itemname: z.string(),
  quantity: z.number().int(),
  craftable: z.boolean(),
});

export const cpuSummarySchema = z.object({
  isBusy: z.boolean(),
  finalOutput: genericStackSchema.nullish(),
  availableStorage: z.number().int().nonnegative(),
  usedStorage: z.number().int().nonnegative(),
  coProcessors: z.number().int().nonnegative(),
  hasTrackingInfo: z.boolean(),
  timeStarted: z.number().int(),
});

export const cpuIngredientSchema = z.object({
  itemid: z.string(),
  itemname: z.string(),
  active: z.number().int(),
  pending: z.number().int(),
  stored: z.number().int(),
  timeSpentCrafting: z.number(),
  craftedTotal: z.number(),
  shareInCraftingTime: z.number(),
  shareInCraftingTimeCombined: z.number(),
  craftsPerSec: z.number(),
});

export const cpuDetailSchema = z.object({
  size: z.number().int().nonnegative(),
  isBusy: z.boolean(),
  finalOutput: genericStackSchema.nullish(),
  items: z.array(cpuIngredientSchema).nullish(),
  hasTrackingInfo: z.boolean(),
  timeStarted: z.number(),
  timeElapsed: z.number(),
});

export const craftPlanReferenceSchema = z.object({
  jobID: z.number().int(),
});

export const craftPlanItemSchema = z.object({
  itemid: z.string(),
  itemname: z.string(),
  stored: z.number().int(),
  requested: z.number().int(),
  missing: z.number().int(),
  steps: z.number().int(),
  usedPercent: z.number(),
});

export const craftPlanSchema = z.object({
  isDone: z.boolean(),
  isSimulating: z.boolean(),
  bytesTotal: z.number().int(),
  plan: z.array(craftPlanItemSchema).nullish(),
});

export const activitySummarySchema = z.object({
  timeStarted: z.number().int(),
  timeDone: z.number().int(),
  wasCancelled: z.boolean(),
  finalOutput: genericStackSchema,
  id: z.number().int(),
});

export const timingSchema = z.object({
  started: z.number().int(),
  ended: z.number().int(),
});

export const dimensionalCoordinatesSchema = z
  .object({
    dimid: z.union([z.string(), z.number()]).optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    z: z.number().optional(),
  })
  .passthrough();

export const trackedItemSchema = z.object({
  itemid: z.string(),
  itemname: z.string(),
  timeSpentOn: z.number(),
  craftedTotal: z.number(),
  shareInCraftingTime: z.number(),
  shareInCraftingTimeCombined: z.number(),
  craftsPerSec: z.number(),
  timings: z.array(timingSchema),
});

export const trackedInterfaceSchema = z.object({
  name: z.string(),
  timings: z.array(timingSchema),
  timingsCombined: z.number(),
  location: z.array(dimensionalCoordinatesSchema),
});

export const activityDetailSchema = z.object({
  finalOutput: genericStackSchema,
  timeStarted: z.number().int(),
  timeDone: z.number().int(),
  wasCancelled: z.boolean(),
  items: z.array(trackedItemSchema),
  interfaceShare: z.array(trackedInterfaceSchema),
});

export const gridSettingsSchema = z.object({
  isTracked: z.boolean(),
});

export type Session = z.infer<typeof sessionSchema>;
export type GenericStack = z.infer<typeof genericStackSchema>;
export type Network = z.infer<typeof networkSchema>;
export type Item = z.infer<typeof itemSchema>;
export type CpuSummary = z.infer<typeof cpuSummarySchema>;
export type CpuDetail = z.infer<typeof cpuDetailSchema>;
export type CpuIngredient = z.infer<typeof cpuIngredientSchema>;
export type CraftPlanReference = z.infer<typeof craftPlanReferenceSchema>;
export type CraftPlan = z.infer<typeof craftPlanSchema>;
export type CraftPlanItem = z.infer<typeof craftPlanItemSchema>;
export type ActivitySummary = z.infer<typeof activitySummarySchema>;
export type ActivityDetail = z.infer<typeof activityDetailSchema>;
export type GridSettings = z.infer<typeof gridSettingsSchema>;

import { z } from "zod";

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);
const iconPathSchema = z
  .string()
  .regex(/^icons\/([0-9a-f]{2})\/\1[0-9a-f]{62}\.png$/);

export const iconManifestEntrySchema = z
  .object({
    kind: z.literal("item"),
    registry: z.string().min(3),
    damage: z.number().int(),
    nbtHash: sha256Schema.nullable().optional(),
    legacyId: z.string().min(5),
    displayName: z.string(),
    png: iconPathSchema,
  })
  .strict();

export const iconExportFailureSchema = z
  .object({
    legacyId: z.string().nullable(),
    displayName: z.string(),
    reason: z.string(),
  })
  .strict();

export const iconManifestSchema = z
  .object({
    schema: z.literal("ae2-icons/v1"),
    generatedAt: z.iso.datetime({ offset: true }),
    environment: z
      .object({
        minecraft: z.literal("1.7.10"),
        iconSize: z.number().int().positive(),
        modsSha256: sha256Schema,
        mods: z.array(z.string()),
        resourcePacks: z.array(z.string()),
      })
      .strict(),
    entries: z.array(iconManifestEntrySchema),
    failures: z.array(iconExportFailureSchema),
  })
  .strict();

export type IconManifest = z.infer<typeof iconManifestSchema>;
export type IconManifestEntry = z.infer<typeof iconManifestEntrySchema>;

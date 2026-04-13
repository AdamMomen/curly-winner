import { z } from "zod";

import { cellAddressSchema } from "./ast";

const cellValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const verificationDiffSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("value_mismatch"),
    sheetName: z.string().min(1),
    address: cellAddressSchema,
    expected: cellValueSchema,
    actual: cellValueSchema,
  }),
  z.object({
    kind: z.literal("missing_in_reconstructed"),
    sheetName: z.string().min(1),
    address: cellAddressSchema,
    expected: cellValueSchema,
  }),
  z.object({
    kind: z.literal("missing_in_original"),
    sheetName: z.string().min(1),
    address: cellAddressSchema,
    actual: cellValueSchema,
  }),
]);

export const verificationResultSchema = z.object({
  ok: z.boolean(),
  diffs: z.array(verificationDiffSchema),
});

import { z } from "zod";

import { cellAddressSchema } from "./ast";

const cellValueSchema = z.union([z.string(), z.number(), z.boolean()]);
const cellTypeSchema = z.enum(["string", "number", "boolean", "formula"]);

export const verificationDiffSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("sheet_count_mismatch"),
    expected: z.number().int().nonnegative(),
    actual: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal("sheet_name_mismatch"),
    index: z.number().int().nonnegative(),
    expected: z.string(),
    actual: z.string(),
  }),
  z.object({
    kind: z.literal("missing_sheet_in_reconstructed"),
    index: z.number().int().nonnegative(),
    sheetName: z.string(),
  }),
  z.object({
    kind: z.literal("extra_sheet_in_reconstructed"),
    index: z.number().int().nonnegative(),
    sheetName: z.string(),
  }),
  z.object({
    kind: z.literal("cell_type_mismatch"),
    sheetName: z.string().min(1),
    address: cellAddressSchema,
    expectedType: cellTypeSchema,
    actualType: cellTypeSchema,
  }),
  z.object({
    kind: z.literal("formula_mismatch"),
    sheetName: z.string().min(1),
    address: cellAddressSchema,
    expectedFormula: z.string().min(1),
    actualFormula: z.string().min(1),
  }),
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
    expectedFormula: z.string().min(1).optional(),
  }),
  z.object({
    kind: z.literal("missing_in_original"),
    sheetName: z.string().min(1),
    address: cellAddressSchema,
    actual: cellValueSchema,
    actualFormula: z.string().min(1).optional(),
  }),
]);

export const verificationResultSchema = z.object({
  ok: z.boolean(),
  diffs: z.array(verificationDiffSchema),
  summary: z.string().min(1),
});

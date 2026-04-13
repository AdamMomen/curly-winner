import { z } from "zod";

/** A1 notation: column letters + row (1-based), no `$`. */
export const cellAddressSchema = z
  .string()
  .regex(/^[A-Z]+[1-9][0-9]*$/, "Expected Excel A1 address (e.g. B2, AA10)");

export const cellSchema = z.discriminatedUnion("type", [
  z.object({
    address: cellAddressSchema,
    type: z.literal("string"),
    value: z.string(),
  }),
  z.object({
    address: cellAddressSchema,
    type: z.literal("number"),
    value: z.number().finite(),
  }),
  z.object({
    address: cellAddressSchema,
    type: z.literal("boolean"),
    value: z.boolean(),
  }),
]);

export const sheetSchema = z
  .object({
    name: z.string().min(1, "Sheet name is required"),
    cells: z.record(z.string(), cellSchema),
  })
  .superRefine((sheet, ctx) => {
    for (const [key, cell] of Object.entries(sheet.cells)) {
      if (key !== cell.address) {
        ctx.addIssue({
          code: "custom",
          message: `Cell key "${key}" must equal cell.address "${cell.address}"`,
          path: ["cells", key],
        });
      }
    }
  });

export const workbookSchema = z.object({
  sheets: z.array(sheetSchema).min(1, "Workbook must have at least one sheet"),
});

export type WorkbookParsed = z.infer<typeof workbookSchema>;

/** Workbook acceptable for XLSXDSL1 encoding (zero sheets allowed). */
export const workbookEncodeSchema = z.object({
  sheets: z.array(sheetSchema),
});

export type WorkbookEncodeInput = z.infer<typeof workbookEncodeSchema>;

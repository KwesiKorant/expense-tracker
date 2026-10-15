import { z } from "zod";

/**
 * Validates monetary decimal precision: positive, max 2 decimal places, <= 9,999,999,999.99
 */
const monetaryAmountSchema = z
  .union([z.number(), z.string()])
  .transform((val, ctx) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount must be a valid numeric value.",
      });
      return z.NEVER;
    }
    return num;
  })
  .refine((val) => val > 0, {
    message: "Amount must be greater than zero.",
  })
  .refine((val) => val <= 9999999999.99, {
    message: "Amount cannot exceed 9,999,999,999.99.",
  })
  .refine(
    (val) => {
      // Check for at most 2 decimal places without floating-point artifacts
      const str = val.toString();
      if (!str.includes(".")) return true;
      const decimals = str.split(".")[1];
      return decimals.length <= 2;
    },
    {
      message: "Amount cannot have more than 2 decimal places.",
    }
  );

/**
 * Validates ISO-8601 date string or Date object
 */
const dateSchema = z
  .union([z.string(), z.date()])
  .transform((val, ctx) => {
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date format. Must be a valid ISO-8601 date.",
      });
      return z.NEVER;
    }
    return d;
  });

/**
 * Schema for creating a new transaction (Strictly stripped of unmapped keys)
 */
export const createTransactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"], {
      message: "Type must be either INCOME or EXPENSE.",
    }),
    amount: monetaryAmountSchema,
    categoryId: z.string().min(1, "Category ID is required."),
    date: dateSchema,
    description: z
      .string()
      .min(1, "Description cannot be empty.")
      .max(255, "Description cannot exceed 255 characters.")
      .trim(),
  })
  .strip();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

/**
 * Schema for updating an existing transaction
 */
export const updateTransactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    amount: monetaryAmountSchema.optional(),
    categoryId: z.string().min(1).optional(),
    date: dateSchema.optional(),
    description: z.string().min(1).max(255).trim().optional(),
  })
  .strip()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided for update." }
  );

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

/**
 * Schema for querying and paginating transactions
 */
export const queryTransactionsSchema = z
  .object({
    page: z
      .string()
      .optional()
      .default("1")
      .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
    limit: z
      .string()
      .optional()
      .default("10")
      .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 10))),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    categoryId: z.string().optional(),
    search: z.string().trim().optional(),
    startDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined))
      .refine((val) => val === undefined || !isNaN(val.getTime()), {
        message: "Invalid startDate format.",
      }),
    endDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined))
      .refine((val) => val === undefined || !isNaN(val.getTime()), {
        message: "Invalid endDate format.",
      }),
    isArchived: z
      .union([z.string(), z.boolean()])
      .optional()
      .default(false)
      .transform((val) => val === true || val === "true"),
  })
  .strip();

export type QueryTransactionsInput = z.infer<typeof queryTransactionsSchema>;

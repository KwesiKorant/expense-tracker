import { z } from "zod";

export const createCategorySchema = z
  .object({
    name: z
      .string()
      .min(2, "Category name must be at least 2 characters.")
      .max(50, "Category name cannot exceed 50 characters.")
      .trim(),
    type: z.enum(["INCOME", "EXPENSE"], {
      message: "Type must be either INCOME or EXPENSE.",
    }),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid 6-character hex code.")
      .default("#6366f1")
      .optional(),
    icon: z
      .string()
      .max(30, "Icon name cannot exceed 30 characters.")
      .default("tag")
      .optional(),
  })
  .strip();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

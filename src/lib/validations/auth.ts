import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .email("A valid email address is required.")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password cannot exceed 128 characters."),
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name cannot exceed 100 characters.")
      .trim(),
    defaultCurrency: z
      .string()
      .length(3, "Currency code must be 3 letters (e.g. USD, EUR, GHS).")
      .default("USD")
      .optional(),
  })
  .strip();

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z
      .string()
      .email("A valid email address is required.")
      .toLowerCase()
      .trim(),
    password: z.string().min(1, "Password is required."),
  })
  .strip();

export type LoginInput = z.infer<typeof loginSchema>;

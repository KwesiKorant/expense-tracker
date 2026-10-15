import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import type { RateLimitResult } from "./rate-limiter";

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export interface ApiResponseOptions {
  status?: number;
  rateLimit?: RateLimitResult;
  headers?: Record<string, string>;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorEnvelope {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Low-level JSON response generator with injected security & rate limit headers
 */
export function jsonResponse<T>(body: T, options: ApiResponseOptions = {}): NextResponse {
  const { status = 200, rateLimit, headers = {} } = options;
  const responseHeaders = new Headers();

  // Inject canonical Arc-AA security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    responseHeaders.set(key, value);
  }

  // Inject custom caller headers
  for (const [key, value] of Object.entries(headers)) {
    responseHeaders.set(key, value);
  }

  // Inject rate limiting telemetry headers
  if (rateLimit) {
    responseHeaders.set("X-RateLimit-Limit", rateLimit.limit.toString());
    responseHeaders.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
    if (rateLimit.retryAfterSeconds !== undefined) {
      responseHeaders.set("Retry-After", rateLimit.retryAfterSeconds.toString());
    }
  }

  return NextResponse.json(body, { status, headers: responseHeaders });
}

/**
 * Standardized success response envelope
 */
export function successResponse<T>(
  data: T,
  message?: string,
  options: ApiResponseOptions = {}
): NextResponse {
  const body: ApiSuccessEnvelope<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
  return jsonResponse(body, options);
}

/**
 * Standardized error response envelope
 */
export function errorResponse(
  error: string,
  message: string,
  status: number = 400,
  details?: unknown,
  options: Omit<ApiResponseOptions, "status"> = {}
): NextResponse {
  const body: ApiErrorEnvelope = {
    success: false,
    error,
    message,
    ...(details !== undefined ? { details } : {}),
  };
  return jsonResponse(body, { ...options, status });
}

/**
 * Automatic error classifier mapping Zod, Prisma, and runtime exceptions
 */
export function handleApiError(
  err: unknown,
  defaultMessage: string = "An unexpected server error occurred.",
  options: ApiResponseOptions = {}
): NextResponse {
  // 1. Zod schema validation errors (GATE 2)
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return errorResponse(
      "VALIDATION_ERROR",
      issues.length > 0 ? issues[0].message : "Invalid request payload format.",
      400,
      issues,
      options
    );
  }

  // 2. Prisma database exceptions
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = Array.isArray(err.meta?.target)
          ? err.meta?.target.join(", ")
          : (err.meta?.target as string) || "field";
        return errorResponse(
          "CONFLICT",
          `A record with this ${target} already exists.`,
          409,
          err.meta,
          options
        );
      }
      case "P2025":
        return errorResponse(
          "NOT_FOUND",
          "The requested record could not be found or has been removed.",
          404,
          undefined,
          options
        );
      case "P2003":
        return errorResponse(
          "FOREIGN_KEY_FAILED",
          "Referenced relation not found or invalid foreign key.",
          400,
          err.meta,
          options
        );
      default:
        console.error(`[Prisma Database Error ${err.code}]:`, err.message);
        return errorResponse(
          "DATABASE_ERROR",
          "Database operation failed.",
          500,
          undefined,
          options
        );
    }
  }

  // 3. Syntax errors (e.g. malformed JSON request body)
  if (err instanceof SyntaxError && "body" in err) {
    return errorResponse("MALFORMED_JSON", "Invalid JSON payload provided.", 400, undefined, options);
  }

  // 4. Custom Error or unhandled exceptions
  console.error("[Unhandled API Error]:", err);
  const errorMessage =
    process.env.NODE_ENV === "development" && err instanceof Error
      ? err.message
      : defaultMessage;

  return errorResponse("INTERNAL_SERVER_ERROR", errorMessage, 500, undefined, options);
}

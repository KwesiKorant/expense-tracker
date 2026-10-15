export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export type RateLimitType = "read" | "mutation" | "auth" | "export";

const RATE_CONFIGS: Record<RateLimitType, { limit: number; windowMs: number }> = {
  read: { limit: 60, windowMs: 60 * 1000 },       // 60 requests / minute
  mutation: { limit: 20, windowMs: 60 * 1000 },   // 20 requests / minute
  auth: { limit: 5, windowMs: 15 * 60 * 1000 },   // 5 requests / 15 minutes
  export: { limit: 10, windowMs: 60 * 1000 },     // 10 requests / minute
};

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic memory purge of expired IP records (every 5 minutes)
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Prevent keeping Node.js process alive if idling
  if (timer.unref) {
    timer.unref();
  }
}

/**
 * Extracts remote client IP from headers, prioritizing X-Forwarded-For
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Evaluates sliding-window rate limit for a given request and action type
 */
export function checkRateLimit(
  req: Request,
  type: RateLimitType = "read",
  customLimit?: number,
  customWindowMs?: number
): RateLimitResult {
  const ip = getClientIp(req);
  const config = RATE_CONFIGS[type];
  const limit = customLimit ?? config.limit;
  const windowMs = customWindowMs ?? config.windowMs;

  const key = `${ip}:${type}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: resetTime,
    };
  }

  if (record.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: record.resetTime,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    limit,
    remaining: limit - record.count,
    resetAt: record.resetTime,
  };
}

/**
 * Reset memory store (used in test runners)
 */
export function _resetRateLimitStore(): void {
  rateLimitStore.clear();
}

import { NextResponse } from "next/server";

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  ok: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

type Bucket = {
  hits: number[];
};

declare global {
  // eslint-disable-next-line no-var
  var __rbRateLimitStore: Map<string, Bucket> | undefined;
}

const store = global.__rbRateLimitStore ?? new Map<string, Bucket>();
global.__rbRateLimitStore = store;

function nowMs() {
  return Date.now();
}

function pruneHits(hits: number[], windowMs: number, currentMs: number) {
  const minTs = currentMs - windowMs;
  while (hits.length > 0 && hits[0] < minTs) {
    hits.shift();
  }
}

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const currentMs = nowMs();
  const existing = store.get(key) ?? { hits: [] };
  pruneHits(existing.hits, config.windowMs, currentMs);

  if (existing.hits.length >= config.limit) {
    const oldestInWindow = existing.hits[0] ?? currentMs;
    const retryAfterMs = Math.max(0, oldestInWindow + config.windowMs - currentMs);
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      remaining: 0
    };
  }

  existing.hits.push(currentMs);
  store.set(key, existing);
  return {
    ok: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, config.limit - existing.hits.length)
  };
}

export function tooManyRequests(retryAfterSeconds: number, message = "Too many requests. Please try again later.") {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds)
      }
    }
  );
}

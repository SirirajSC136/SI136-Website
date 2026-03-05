/**
 * In-memory sliding-window rate limiter.
 *
 * State is per-process — intentionally ephemeral on serverless cold starts,
 * which is acceptable for abuse prevention (not billing-critical enforcement).
 *
 * Usage:
 *   const limiter = createRateLimiter("quiz-attempt", { windowMs: 60_000, maxRequests: 10 });
 *   const result = limiter.check(user.uid);
 *   if (!result.allowed) throw new HttpError(429, "Too many requests", "rate_limited");
 */

type RateLimitConfig = {
    /** Time window in milliseconds */
    windowMs: number;
    /** Maximum allowed requests within the window */
    maxRequests: number;
};

type RateLimitResult = {
    allowed: boolean;
    /** Milliseconds until the oldest request expires (useful for Retry-After header) */
    retryAfterMs: number;
};

const stores = new Map<string, { map: Map<string, number[]>; windowMs: number }>();

function getStore(name: string, windowMs: number): Map<string, number[]> {
    let entry = stores.get(name);
    if (!entry) {
        entry = { map: new Map(), windowMs };
        stores.set(name, entry);
    }
    return entry.map;
}

// Periodically prune stale keys every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupScheduled = false;

function scheduleCleanup() {
    if (cleanupScheduled) return;
    cleanupScheduled = true;
    setInterval(() => {
        const now = Date.now();
        for (const [, entry] of stores) {
            for (const [key, timestamps] of entry.map) {
                const fresh = timestamps.filter((t) => t > now - entry.windowMs);
                if (fresh.length === 0) {
                    entry.map.delete(key);
                } else {
                    entry.map.set(key, fresh);
                }
            }
        }
    }, CLEANUP_INTERVAL_MS).unref();
}

export function createRateLimiter(
    name: string,
    config: RateLimitConfig
): { check: (key: string) => RateLimitResult } {
    const store = getStore(name, config.windowMs);
    scheduleCleanup();

    return {
        check(key: string): RateLimitResult {
            const now = Date.now();
            const windowStart = now - config.windowMs;

            // Prune timestamps outside the current window
            const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

            if (timestamps.length >= config.maxRequests) {
                const oldest = timestamps[0];
                return {
                    allowed: false,
                    retryAfterMs: oldest + config.windowMs - now,
                };
            }

            timestamps.push(now);
            store.set(key, timestamps);
            return { allowed: true, retryAfterMs: 0 };
        },
    };
}

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, maxAttempts: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) return false;
  return bucket.count >= maxAttempts;
}

export function recordAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
}

/**
 * Increment a count-bucket and report whether the caller is now OVER the limit.
 * Unlike recordAttempt (failure-only), this is for throttling a sustained
 * volume of requests (e.g. public analytics events) from one key/IP.
 */
export function consumeRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

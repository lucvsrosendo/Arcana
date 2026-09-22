const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

const cleanupMemoryBuckets = (now: number) => {
  if (memoryBuckets.size <= 1_000) {
    return;
  }

  for (const [key, bucket] of memoryBuckets) {
    if (now > bucket.resetAt) {
      memoryBuckets.delete(key);
    }
  }
};

const checkMemoryRateLimit = (clientKey: string) => {
  const now = Date.now();
  cleanupMemoryBuckets(now);

  const bucket = memoryBuckets.get(clientKey);

  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
};

const checkUpstashRateLimit = async (clientKey: string) => {
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) {
    return checkMemoryRateLimit(clientKey);
  }

  const windowKey = `tarot:chat:${clientKey}:${Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS)}`;

  const response = await fetch(`${url}/incr/${encodeURIComponent(windowKey)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    return checkMemoryRateLimit(clientKey);
  }

  const payload = await response.json();
  const count = typeof payload.result === "number" ? payload.result : 1;

  if (count === 1) {
    await fetch(`${url}/pexpire/${encodeURIComponent(windowKey)}/${RATE_LIMIT_WINDOW_MS}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  return count > RATE_LIMIT_MAX_REQUESTS;
};

export const getClientKey = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
};

export const isRateLimited = async (request: Request) => {
  const clientKey = getClientKey(request);
  return checkUpstashRateLimit(clientKey);
};

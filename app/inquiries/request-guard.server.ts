const rateLimitWindowMs = 10 * 60 * 1000;
const maxRequestsPerWindow = 5;
const maxTrackedClients = 5_000;

type RateLimitRecord = {
  startedAt: number;
  count: number;
};

const rateLimitRecords = new Map<string, RateLimitRecord>();

function requestClientKey(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  const address = forwardedFor || realIp || "unknown";
  return address.slice(0, 128);
}

function discardExpiredRecords(now: number) {
  for (const [key, record] of rateLimitRecords) {
    if (now - record.startedAt >= rateLimitWindowMs) rateLimitRecords.delete(key);
  }

  if (rateLimitRecords.size > maxTrackedClients) rateLimitRecords.clear();
}

export type InquiryRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * A deliberately small, instance-local guard for the disabled/test intake.
 * Production abuse protection must be backed by platform rate limiting before
 * public intake is ever enabled.
 */
export function takeInquiryRateLimit(headers: Headers, now = Date.now()): InquiryRateLimitResult {
  discardExpiredRecords(now);

  const key = requestClientKey(headers);
  const current = rateLimitRecords.get(key);
  if (!current || now - current.startedAt >= rateLimitWindowMs) {
    rateLimitRecords.set(key, { startedAt: now, count: 1 });
    return { allowed: true };
  }

  if (current.count >= maxRequestsPerWindow) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((rateLimitWindowMs - (now - current.startedAt)) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true };
}

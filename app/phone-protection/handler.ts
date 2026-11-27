export type PhoneConfig = {
  phone: string;
  secret: string;
  allowedHosts: string[];
};
export function phoneConfiguration(environment: Record<string, string | undefined>): PhoneConfig | null {
  const phone = environment.CONTACT_PHONE_NUMBER?.trim();
  const secret = environment.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const allowedHosts = (environment.PHONE_REVEAL_ALLOWED_HOSTS ?? "").split(",").map(host => host.trim().toLowerCase()).filter(Boolean);
  if (environment.PHONE_REVEAL_ENABLED !== "true" || environment.VERCEL !== "1" || environment.NODE_ENV !== "production" ||
      !phone || !/^0\d{1,2}-\d{3,4}-\d{4}$/.test(phone) || !secret || !siteKey || !allowedHosts.length ||
      allowedHosts.some(host => !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(host)) ||
      /^[123]x0{10,}/.test(secret) || /^[123]x0{10,}/.test(siteKey)) return null;
  return { phone, secret, allowedHosts };
}
type RateResult = { rateLimited: boolean; error?: string };
type Dependencies = {
  config: () => PhoneConfig | null;
  limit: (request: Request) => Promise<RateResult>;
  verify: (token: string, secret: string, request: Request) => Promise<unknown>;
  now?: () => number;
};

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};
function reply(status: number, error: string, extra: Record<string, string> = {}) {
  return Response.json({ error }, { status, headers: { ...headers, ...extra } });
}

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        throw new Error("size");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } finally {
    reader.releaseLock();
  }
}

export function createPhoneHandler(dependencies: Dependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return reply(405, "method_not_allowed", { Allow: "POST" });
    const config = dependencies.config();
    if (!config) return reply(503, "temporarily_unavailable");
    const url = new URL(request.url);
    if (url.protocol !== "https:" || !config.allowedHosts.includes(url.hostname) ||
        request.headers.get("origin") !== url.origin ||
        (request.headers.has("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin")) {
      return reply(403, "request_not_allowed");
    }
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return reply(415, "json_required");
    }
    if (Number(request.headers.get("content-length")) > 4096) return reply(413, "body_too_large");

    // A shared Vercel counter is checked before reading/verifying attacker input.
    try {
      const limited = await dependencies.limit(request);
      if (!limited || typeof limited.rateLimited !== "boolean") return reply(503, "temporarily_unavailable");
      if (limited.error === "not-found") return reply(503, "temporarily_unavailable");
      if (limited.rateLimited || limited.error === "blocked") return reply(429, "too_many_requests", { "Retry-After": "600" });
      if (limited.error) return reply(503, "temporarily_unavailable");
    } catch {
      return reply(503, "temporarily_unavailable");
    }

    let payload: unknown;
    try {
      payload = await readBody(request);
    } catch (error) {
      return reply(error instanceof Error && error.message === "size" ? 413 : 400, "invalid_request");
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return reply(400, "invalid_request");
    const token = (payload as Record<string, unknown>).token;
    if (typeof token !== "string" || !token.length || token.length > 2048 || token.trim() !== token) {
      return reply(400, "verification_required");
    }
    try {
      const result = await dependencies.verify(token, config.secret, request);
      if (!result || typeof result !== "object") return reply(403, "verification_failed");
      const value = result as Record<string, unknown>;
      const challengeTime = typeof value.challenge_ts === "string" ? Date.parse(value.challenge_ts) : NaN;
      const age = (dependencies.now ?? Date.now)() - challengeTime;
      if (value.success !== true || value.hostname !== url.hostname ||
          value.action !== "reveal-phone" || !Number.isFinite(age) || age < -30_000 || age > 300_000) {
        return reply(403, "verification_failed");
      }
    } catch {
      return reply(503, "temporarily_unavailable");
    }
    // No cookies, redirects, logging or caching of the revealed number.
    return Response.json({ phone: config.phone }, { headers });
  };
}


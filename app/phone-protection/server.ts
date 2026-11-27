import "server-only";
import { isIP } from "node:net";
import { checkRateLimit } from "@vercel/firewall";
import { phoneConfiguration, vercelProtectionCookie } from "./handler";

export function phoneConfig() {
  const config = phoneConfiguration(process.env);
  if (!config && process.env.VERCEL_ENV === "preview") console.warn("phone_reveal_configuration_unavailable");
  return config;
}

export async function phoneRateLimit(request: Request) {
  // Only trust Vercel's overwritten platform header; never accept a client key.
  const ip = request.headers.get("x-real-ip");
  if (process.env.VERCEL !== "1" || !ip || !isIP(ip)) {
    if (process.env.VERCEL_ENV === "preview") console.warn("phone_reveal_platform_context_unavailable");
    throw new Error("unavailable");
  }
  const url = new URL(request.url);
  // The SDK calls this same host. Pass only Vercel's deployment protection cookie,
  // never membership cookies or Authorization, to keep protected previews usable.
  const cookie = vercelProtectionCookie(request.headers.get("cookie"));
  const rateRequest = new Request(request.url, {
    headers: { host: url.host, "x-real-ip": ip, ...(cookie ? { cookie } : {}) },
  });
  try {
    return await checkRateLimit("edulab-phone-reveal", { request: rateRequest, timeout: 5000 });
  } catch (error) {
    if (process.env.VERCEL_ENV === "preview") {
      const status = error instanceof Error ? /response status '[^']+': (\d{3})/.exec(error.message)?.[1] : undefined;
      console.warn(`phone_reveal_rate_limit_unavailable:${status ?? "connection"}`);
    }
    throw new Error("unavailable");
  }
}

export async function verifyPhoneToken(token: string, secret: string, request: Request) {
  const body = new URLSearchParams({ secret, response: token });
  const ip = request.headers.get("x-real-ip");
  if (ip && isIP(ip)) body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("unavailable");
  return response.json() as Promise<unknown>;
}


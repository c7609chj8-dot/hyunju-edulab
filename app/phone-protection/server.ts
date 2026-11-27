import "server-only";
import { isIP } from "node:net";
import { checkRateLimit } from "@vercel/firewall";
import { phoneConfiguration } from "./handler";

export function phoneConfig() {
  return phoneConfiguration(process.env);
}

export async function phoneRateLimit(request: Request) {
  // Only trust Vercel's overwritten platform header; never accept a client key.
  const ip = request.headers.get("x-real-ip");
  if (process.env.VERCEL !== "1" || !ip || !isIP(ip)) throw new Error("unavailable");
  const url = new URL(request.url);
  // Do not forward user cookies or authorization to the rate-limit service.
  const rateRequest = new Request(request.url, {
    headers: { host: url.host, "x-real-ip": ip },
  });
  return checkRateLimit("edulab-phone-reveal", { request: rateRequest, timeout: 5000 });
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


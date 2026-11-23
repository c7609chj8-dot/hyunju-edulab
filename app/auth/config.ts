export const membershipPolicyVersion = "2026-11-23";
export function authConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.AUTH_SITE_URL);
}
export function authSiteUrl() {
  return new URL(process.env.AUTH_SITE_URL || "https://hyunju-edulab.vercel.app").origin;
}

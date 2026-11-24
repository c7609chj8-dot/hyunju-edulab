export const membershipPolicyVersion = "2026-11-23.2";
// Enable only after the enrollment migration is explicitly approved and applied.
export function membershipEnrollmentEnabled() {
  return process.env.MEMBERSHIP_ENROLLMENT_ENABLED === "true";
}
export function authConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.AUTH_SITE_URL);
}
export function authSiteUrl() {
  return new URL(process.env.AUTH_SITE_URL || "https://hyunju-edulab.vercel.app").origin;
}

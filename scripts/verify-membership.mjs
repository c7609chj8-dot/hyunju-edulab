import assert from "node:assert/strict";
import { createServerClient } from "@supabase/ssr";

// Explicit disposable fixtures in hyunju-edulab-test only; never use real accounts.
const base = process.env.MEMBERSHIP_TEST_BASE_URL || "http://127.0.0.1:3012";
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, "kkyzrmehndryxzbdomvx.supabase.co");
assert.ok(process.env.MEMBERSHIP_TEST_PASSWORD);
const jars = [];
for (const [kind, email] of [["member", "codex-member-live@example.invalid"], ["administrator", "codex-admin-live@example.invalid"]]) {
  const jar = new Map();
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (values) => values.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: process.env.MEMBERSHIP_TEST_PASSWORD });
  assert.ifError(error);
  const { data: profiles, error: profileError } = await client.from("member_profiles").select("user_id").in("user_id", ["20000000-0000-4000-8000-000000000001", "20000000-0000-4000-8000-000000000002"]);
  assert.ifError(profileError);
  assert.equal(profiles.length, kind === "member" ? 1 : 2);
  const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
  const account = await fetch(`${base}/account`, { headers: { cookie }, redirect: "manual" });
  assert.equal(account.status, 200);
  assert.match(account.headers.get("cache-control"), /no-store/);
  const admin = await fetch(`${base}/admin/members`, { headers: { cookie }, redirect: "manual" });
  const html = await admin.text();
  assert.equal(admin.status, 200);
  assert.ok(html.includes(kind === "member" ? "접근 권한이 없습니다" : "검색 결과"));
  if (kind === "member") assert.ok(!html.includes("codex-admin-live@example.invalid"));
  if (kind === "administrator") {
    const search = await fetch(`${base}/admin/members?q=codex-member-live`, { headers: { cookie } });
    assert.ok((await search.text()).includes("codex-member-live@example.invalid"));
  }
  jars.push({ client });
  console.log(`${kind}: sign-in, RLS isolation, account page and administrator route passed`);
}
const anonymous = await fetch(`${base}/admin/members`, { redirect: "manual" });
assert.ok([303,307,308].includes(anonymous.status));
assert.ok(anonymous.headers.get("location").endsWith("/login"));
for (const { client } of jars) assert.ifError((await client.auth.signOut()).error);
console.log("anonymous redirect and test-session logout passed; no credentials printed");

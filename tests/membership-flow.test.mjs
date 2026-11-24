import test from "node:test";
import assert from "node:assert/strict";
import { memberDetails, signupFailure, submitEnrollment, submitLogin, submitSignup } from "../app/auth/membership-flow.ts";
import { validateEnrollment } from "../app/signup/validation.ts";
import { membershipEnrollmentEnabled } from "../app/auth/config.ts";

const user = { id: "61000000-0000-4000-8000-000000000001", email_confirmed_at: "2026-11-24T00:00:00Z", is_anonymous: false };
function loginClient(profile, options = {}) {
  let signedOut = false;
  return {
    client: {
      auth: {
        signInWithPassword: async () => ({ data: { user: options.user ?? user }, error: options.authError ?? null }),
        signOut: async () => { signedOut = true; return { error: null }; },
      },
      from(table) {
        assert.equal(table, "member_profiles");
        return { select: () => ({ eq: (key, id) => { assert.equal(key, "user_id"); assert.equal(id, user.id); return { maybeSingle: async () => ({ data: profile, error: options.profileError ?? null }) }; } }) };
      },
    },
    signedOut: () => signedOut,
  };
}
function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: " 검증 회원 ", email: " member@example.invalid ", password: " preserved password ", confirmPassword: " preserved password ", username: " MEMBER_01 ", address: " 검증용 주소 ", phone: "010-1234-5678", ageConfirmed: "on", privacyConsent: "on", overseasConsent: "on", ...overrides })) data.set(key, value);
  return data;
}

test("enrollment validates profile and consent without requiring credentials again", () => {
  assert.deepEqual(validateEnrollment(form({ email: "", password: "", confirmPassword: "" })), {});
  assert.deepEqual(Object.keys(validateEnrollment(form({ name: " ", privacyConsent: "" }))), ["name", "privacyConsent"]);
  assert.ok(validateEnrollment(form({ username: "bad", phone: "abc", address: "가".repeat(301) })).username);
  assert.ok(validateEnrollment(form({ ageConfirmed: "" })).ageConfirmed);
  assert.ok(validateEnrollment(form({ overseasConsent: "" })).overseasConsent);
});

test("only permitted profile fields survive normalization", () => {
  assert.deepEqual(memberDetails(form({ user_id: "victim", role: "administrator" })), {
    full_name: "검증 회원", username: "member_01", address: "검증용 주소", phone: "01012345678",
  });
});

test("signup sends normalized metadata and preserves significant password spaces", async () => {
  let sent;
  const result = await submitSignup({ auth: { signUp: async (input) => { sent = input; return { data: { session: null }, error: null }; } } }, form({ role: "administrator" }), "https://example.invalid", "policy-test");
  assert.equal(result.status, "success");
  assert.equal(sent.email, "member@example.invalid");
  assert.equal(sent.password, " preserved password ");
  assert.equal(sent.options.emailRedirectTo, "https://example.invalid/auth/callback");
  assert.equal(sent.options.data.phone, "01012345678");
  assert.equal(sent.options.data.membership_policy_version, "policy-test");
  for (const key of ["password", "confirmPassword", "user_id", "role"]) assert.equal(key in sent.options.data, false);
  assert.equal(JSON.stringify(result).includes("preserved password"), false);
});

test("signup does not claim that a duplicate/obfuscated account is newly created", async () => {
  const result = await submitSignup({ auth: { signUp: async () => ({ data: { session: null, user: { identities: [] } }, error: null }) } }, form(), "https://example.invalid", "policy-test");
  assert.match(result.message, /이미 계정이 있다면 로그인/u);
  assert.match(result.message, /가입 가능한 주소라면/u);
});

test("provider failures produce useful messages without raw provider details", () => {
  assert.match(signupFailure({ status: 429 }).message, /요청이 많습니다/u);
  assert.match(signupFailure({ code: "email_address_not_authorized" }).message, /허용된 주소/u);
  assert.ok(signupFailure({ code: "email_address_invalid" }).errors.email);
  assert.ok(signupFailure({ code: "weak_password" }).errors.password);
  assert.match(signupFailure({ code: "unexpected_failure" }).message, /이미 사용 중일 수/u);
  assert.equal(JSON.stringify(signupFailure({ code: "private-error", message: "secret SQL" })).includes("secret SQL"), false);
});

test("verified account without a profile reaches enrollment without losing its session", async () => {
  const fixture = loginClient(null);
  assert.deepEqual(await submitLogin(fixture.client, "member@example.invalid", "dummy-password", "/admin"), { destination: "/account/enroll" });
  assert.equal(fixture.signedOut(), false);
});

test("active members keep their account/admin destination and external redirects are rejected", async () => {
  const fixture = loginClient({ account_status: "active" });
  for (const [requested, expected] of [["/admin", "/admin"], ["/account", "/account"], ["https://attacker.invalid", "/account"]]) {
    assert.deepEqual(await submitLogin(fixture.client, "member@example.invalid", "dummy-password", requested), { destination: expected });
  }
  assert.equal(fixture.signedOut(), false);
});

test("suspended members and database failures do not enter account or enrollment", async () => {
  for (const fixture of [loginClient({ account_status: "suspended" }), loginClient(null, { profileError: { code: "XX000" } }), loginClient(null, { user: { ...user, email_confirmed_at: null } })]) {
    const result = await submitLogin(fixture.client, "member@example.invalid", "dummy-password", "/account");
    assert.equal(result.state.status, "error");
    assert.equal(result.destination, undefined);
    assert.equal(fixture.signedOut(), true);
  }
});

test("wrong credentials do not query membership or report a redirect", async () => {
  const fixture = loginClient(null, { authError: { code: "invalid_credentials", status: 400 } });
  fixture.client.from = () => { throw Error("Membership query must not run"); };
  assert.equal((await submitLogin(fixture.client, "member@example.invalid", "dummy-password", "/admin")).state.status, "error");
});

test("enrollment requires a live verified nonanonymous user before RPC", async () => {
  for (const account of [null, { ...user, email_confirmed_at: null }, { ...user, is_anonymous: true }]) {
    const result = await submitEnrollment({ auth: { getUser: async () => ({ data: { user: account }, error: null }) }, rpc: () => { throw Error("RPC must not run"); } }, form(), "policy-test");
    assert.equal(result.status, "error");
  }
  const result = await submitEnrollment({ auth: { getUser: async () => ({ data: { user }, error: { message: "bad token" } }) }, rpc: () => { throw Error("RPC must not run"); } }, form(), "policy-test");
  assert.equal(result.status, "error");
});

test("enrollment RPC cannot receive forged identity, email, password or role", async () => {
  let sent;
  const result = await submitEnrollment({ auth: { getUser: async () => ({ data: { user }, error: null }) }, rpc: async (name, input) => { sent = { name, input }; return { data: user.id, error: null }; } }, form({ user_id: "victim", email: "victim@example.invalid", role: "administrator", username: " ", address: " ", phone: " " }), "policy-test");
  assert.equal(result.status, "success");
  assert.deepEqual(sent, { name: "enroll_current_member", input: { p_full_name: "검증 회원", p_username: null, p_address: null, p_phone: null, p_policy_version: "policy-test", p_privacy_consent: true, p_overseas_consent: true, p_age_confirmed: true } });
});

test("consent values are not silently forced on in the enrollment RPC", async () => {
  let sent;
  await submitEnrollment({ auth: { getUser: async () => ({ data: { user }, error: null }) }, rpc: async (_name, input) => { sent = input; return { data: null, error: { code: "23514" } }; } }, form({ privacyConsent: "", overseasConsent: "", ageConfirmed: "" }), "policy-test");
  assert.equal(sent.p_privacy_consent, false);
  assert.equal(sent.p_overseas_consent, false);
  assert.equal(sent.p_age_confirmed, false);
});

test("enrollment handles duplicate usernames, unavailable RPC and access denial", async () => {
  for (const [code, pattern] of [["23505", /아이디/u], ["PGRST202", /완료하지 못했습니다/u], ["42501", /이용 상태/u]]) {
    const result = await submitEnrollment({ auth: { getUser: async () => ({ data: { user }, error: null }) }, rpc: async () => ({ data: null, error: { code, message: "private SQL" } }) }, form(), "policy-test");
    assert.equal(result.status, "error");
    assert.match(result.message, pattern);
    assert.equal(JSON.stringify(result).includes("private SQL"), false);
    if (code === "23505") assert.ok(result.errors.username);
  }
});

test("enrollment does not report success for missing or mismatched identity", async () => {
  for (const id of [null, "another-user"]) {
    const result = await submitEnrollment({ auth: { getUser: async () => ({ data: { user }, error: null }) }, rpc: async () => ({ data: id, error: null }) }, form(), "policy-test");
    assert.equal(result.status, "error");
  }
});

test("existing-account enrollment stays disabled unless explicitly enabled", () => {
  const original = process.env.MEMBERSHIP_ENROLLMENT_ENABLED;
  try {
    for (const value of [undefined, "false", "1", "TRUE"]) {
      if (value === undefined) delete process.env.MEMBERSHIP_ENROLLMENT_ENABLED;
      else process.env.MEMBERSHIP_ENROLLMENT_ENABLED = value;
      assert.equal(membershipEnrollmentEnabled(), false);
    }
    process.env.MEMBERSHIP_ENROLLMENT_ENABLED = "true";
    assert.equal(membershipEnrollmentEnabled(), true);
  } finally {
    if (original === undefined) delete process.env.MEMBERSHIP_ENROLLMENT_ENABLED;
    else process.env.MEMBERSHIP_ENROLLMENT_ENABLED = original;
  }
});

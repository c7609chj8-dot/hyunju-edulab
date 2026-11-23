import test from "node:test";
import assert from "node:assert/strict";
import { validateSignup as validateSignupPreview } from "../app/signup/validation.ts";

function data(overrides = {}) {
  const values = { name: "홍길동", email: "sample@example.com", password: "example password", confirmPassword: "example password", ageConfirmed: "on", privacyConsent: "on", overseasConsent: "on", ...overrides };
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

test("valid example data passes without returning credentials", () => {
  assert.deepEqual(validateSignupPreview(data()), {});
});
test("empty submission identifies every required field", () => {
  assert.equal(Object.keys(validateSignupPreview(new FormData())).length, 7);
});
test("rejects blank name, malformed email and missing consent", () => {
  const errors = validateSignupPreview(data({ name: "  ", email: "sample@", privacyConsent: "" }));
  assert.deepEqual(Object.keys(errors), ["name", "email", "privacyConsent"]);
});
test("password boundaries and all-space passwords are enforced", () => {
  for (const password of ["a".repeat(11), "a".repeat(129), " ".repeat(12)]) {
    assert.ok(validateSignupPreview(data({ password, confirmPassword: password })).password);
  }
  for (const password of ["a".repeat(12), "a".repeat(128)]) {
    assert.deepEqual(validateSignupPreview(data({ password, confirmPassword: password })), {});
  }
});
test("password confirmation preserves significant spaces", () => {
  assert.ok(validateSignupPreview(data({ password: " example password", confirmPassword: "example password" })).confirmPassword);
});
test("normalizes only surrounding name and email whitespace", () => {
  assert.deepEqual(validateSignupPreview(data({ name: " 홍길동 ", email: " sample@example.com " })), {});
});
test("file values cannot bypass string field validation", () => {
  const form = data();
  form.set("name", new Blob(["sample"]), "sample.txt");
  assert.ok(validateSignupPreview(form).name);
});
test("age and overseas consent must be individually checked", () => {
  assert.ok(validateSignupPreview(data({ ageConfirmed: "" })).ageConfirmed);
  assert.ok(validateSignupPreview(data({ overseasConsent: "" })).overseasConsent);
});
test("optional membership fields accept valid values and reject malformed input", () => {
  assert.deepEqual(validateSignupPreview(data({ username: "member_01", address: "검증 주소", phone: "010-1234-5678" })), {});
  assert.ok(validateSignupPreview(data({ username: "a" })).username);
  assert.ok(validateSignupPreview(data({ phone: "abc010" })).phone);
  assert.ok(validateSignupPreview(data({ address: "a".repeat(301) })).address);
});

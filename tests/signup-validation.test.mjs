import test from "node:test";
import assert from "node:assert/strict";
import { validateSignupPreview } from "../app/signup/validation.ts";

function data(overrides = {}) {
  const values = { name: "홍길동", email: "sample@example.com", password: "example password", confirmPassword: "example password", previewAcknowledged: "on", ...overrides };
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

test("valid example data passes without returning credentials", () => {
  assert.deepEqual(validateSignupPreview(data()), {});
});
test("empty submission identifies every required field", () => {
  assert.equal(Object.keys(validateSignupPreview(new FormData())).length, 5);
});
test("rejects blank name, malformed email and missing acknowledgment", () => {
  const errors = validateSignupPreview(data({ name: "  ", email: "sample@", previewAcknowledged: "" }));
  assert.deepEqual(Object.keys(errors), ["name", "email", "previewAcknowledged"]);
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

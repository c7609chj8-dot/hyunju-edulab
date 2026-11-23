import test from "node:test";
import assert from "node:assert/strict";
import { memberPage, memberSearch, memberSearchFilter } from "../app/admin/members/search.ts";

test("search retains Korean names and email characters", () => {
  assert.equal(memberSearch("  홍길동 sample+test@example.com  "), "홍길동 sample+test@example.com");
});
test("query syntax cannot add PostgREST filter branches", () => {
  const filter = memberSearchFilter("x),user_id.neq.(null),email.ilike.%");
  assert.equal(filter.split(",").length, 2);
  assert.ok(!filter.includes("("));
  assert.equal(memberSearch(["a", "b"]), "");
});
test("wildcards are escaped and search length is bounded", () => {
  assert.ok(memberSearchFilter("sample_name").includes("sample\\_name"));
  assert.equal(memberSearch("a".repeat(100)).length, 80);
});
test("pagination rejects invalid and unbounded input", () => {
  for (const input of [undefined, "-1", "Infinity", "1e3", "99999", ["2"]]) assert.equal(memberPage(input), 1);
  assert.equal(memberPage("2"), 2);
  assert.equal(memberPage("9999"), 1000);
});

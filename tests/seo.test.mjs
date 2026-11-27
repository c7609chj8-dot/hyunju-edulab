import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { canonicalUrl, pageMetadata, searchVerification, websiteStructuredData, instructorStructuredData, breadcrumbStructuredData, serializeStructuredData } from "../app/seo.ts";
import { programs } from "../app/programs.ts";

test("canonical and social URLs use the primary domain without query or fragment", () => {
  assert.equal(canonicalUrl("/education/ai?campaign=test#lesson"), "https://hyunjulab.com/education/ai");
  for (const path of ["https://example.com", "//example.com", "/\\\\example.com"]) assert.throws(() => canonicalUrl(path));
  const metadata = pageMetadata("/education/ai", "AI 활용교육", "교육 소개");
  assert.equal(metadata.alternates.canonical, "https://hyunjulab.com/education/ai");
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  assert.equal(metadata.twitter.images[0], "https://hyunjulab.com/images/school-safety-class.jpg");
});

test("verification metadata is optional and uses actual provided tokens", () => {
  assert.equal(searchVerification({}), undefined);
  assert.equal(searchVerification({ GOOGLE_SITE_VERIFICATION: "  " }), undefined);
  assert.deepEqual(searchVerification({ GOOGLE_SITE_VERIFICATION: " google-token ", NAVER_SITE_VERIFICATION: " naver-token " }), {
    google: "google-token", other: { "naver-site-verification": "naver-token" },
  });
});

test("production indexes public education pages and excludes account and inquiry routes", () => {
  const moduleUrl = new URL("../app/seo.ts", import.meta.url).href;
  const script = `const {pageMetadata}=await import(${JSON.stringify(moduleUrl)}); console.log(JSON.stringify(["/","/education/ai","/admin/login","/account","/signup","/login","/contact","/education?draft=1"].map(p=>pageMetadata(p,"title","description").robots.index)));`;
  for (const [vercelEnvironment, expected] of [
    ["production", [true,true,false,false,false,false,false,true]],
    ["preview", Array(8).fill(false)],
    ["development", Array(8).fill(false)],
  ]) {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      env: { ...process.env, NODE_ENV: "production", VERCEL_ENV: vercelEnvironment }, encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), expected);
  }
});

test("structured data matches the public site and safely embeds arbitrary text", () => {
  assert.equal(websiteStructuredData().url, "https://hyunjulab.com/");
  assert.equal(websiteStructuredData().name, "현주에듀랩");
  assert.equal(instructorStructuredData().name, "최현주");
  const breadcrumbs = breadcrumbStructuredData([{name:"홈",path:"/"},{name:"교육 프로그램",path:"/education"}]);
  assert.deepEqual(breadcrumbs.itemListElement.map(item => item.position), [1,2]);
  assert.equal(breadcrumbs.itemListElement[1].item, "https://hyunjulab.com/education");
  const value = {name: "</script><script>alert(1)</script>"};
  const encoded = serializeStructuredData(value);
  assert.equal(encoded.includes("<"), false);
  assert.deepEqual(JSON.parse(encoded), value);
});

test("each public education program has distinct metadata and visible descriptive copy", () => {
  assert.equal(programs.length, 4);
  assert.equal(new Set(programs.map(program => program.searchTitle)).size, programs.length);
  for (const program of programs) {
    assert.ok(program.searchTitle.endsWith(" | 현주에듀랩"));
    assert.ok(program.searchDescription.length > 30);
    assert.equal(new URL(canonicalUrl("/education/" + program.slug)).hostname, "hyunjulab.com");
  }
});

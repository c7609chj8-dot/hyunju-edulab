import assert from "node:assert/strict";
import test from "node:test";
import { createPhoneHandler, phoneConfiguration, vercelProtectionCookie } from "../app/phone-protection/handler.ts";

test("only a bounded Vercel protection JWT can reach the same-host limiter", () => {
  assert.equal(vercelProtectionCookie("sb-session=private; _vercel_jwt=header.payload.signature; unrelated=private"), "_vercel_jwt=header.payload.signature");
  for (const value of [null, "sb-session=private", "fake_vercel_jwt=header.payload.signature", "_vercel_jwt=", "_vercel_jwt=malformed", "_vercel_jwt=header.payload.signature\r\nAuthorization: private", "_vercel_jwt=" + "a".repeat(8192) + ".b.c"]) {
    assert.equal(vercelProtectionCookie(value), undefined);
  }
});

const fakePhone = "010-0000-0000";
const now = Date.parse("2026-11-27T12:00:00Z");
const goodConfig = { phone: fakePhone, secret: "private-test-fixture", allowedHosts: ["site.example"] };
function request(body = { token: "valid-fixture" }, headers = {}, url = "https://site.example/api/contact-phone") {
  return new Request(url, { method: "POST", headers: { origin: "https://site.example", "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
}
function setup(overrides = {}) {
  let calls = 0, limits = 0;
  const handler = createPhoneHandler({
    config: () => goodConfig, now: () => now,
    limit: async () => { limits++; return { rateLimited: false }; },
    verify: async () => { calls++; return { success: true, hostname: "site.example", action: "reveal-phone", challenge_ts: new Date(now - 1000).toISOString() }; },
    ...overrides,
  });
  return { handler, calls: () => calls, limits: () => limits };
}
async function assertBlocked(response, status) {
  assert.equal(response.status, status);
  const text = await response.text();
  assert.equal(text.includes(fakePhone), false);
  assert.equal(text.includes("valid-fixture"), false);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
}

test("phone configuration is disabled unless all server protections are configured", () => {
  const values = { NODE_ENV: "production", VERCEL: "1", PHONE_REVEAL_ENABLED: "true", CONTACT_PHONE_NUMBER: fakePhone, TURNSTILE_SECRET_KEY: "private-key", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "public-key", PHONE_REVEAL_ALLOWED_HOSTS: "site.example" };
  assert.equal(phoneConfiguration(values).phone, fakePhone);
  for (const key of Object.keys(values)) assert.equal(phoneConfiguration({ ...values, [key]: "" }), null, key);
  for (const key of ["TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY"]) {
    assert.equal(phoneConfiguration({ ...values, [key]: "1x00000000000000000000AA" }), null);
  }
  assert.equal(phoneConfiguration({ ...values, PHONE_REVEAL_ALLOWED_HOSTS: "*.example" }), null);
  assert.equal(phoneConfiguration({ ...values, CONTACT_PHONE_NUMBER: "unusable" }), null);
});

test("GET, missing configuration, cross-site and forged hosts never reveal phone", async () => {
  const normal = setup();
  await assertBlocked(await normal.handler(new Request("https://site.example/api/contact-phone")), 405);
  await assertBlocked(await setup({config:()=>null}).handler(request()), 503);
  for (const r of [
    request(undefined, {origin:"https://attacker.example"}),
    request(undefined, {"sec-fetch-site":"cross-site"}),
    request(undefined, {origin:"null"}),
    request(undefined, {}, "https://attacker.example/api/contact-phone"),
    request(undefined, {origin:"http://site.example"}, "http://site.example/api/contact-phone"),
    new Request("https://site.example/api/contact-phone", {method:"POST",headers:{"content-type":"application/json"},body:'{}'}),
  ]) await assertBlocked(await normal.handler(r), 403);
  assert.equal(normal.calls(), 0);
  assert.equal(normal.limits(), 0);
});

test("shared rate limit errors, absent rules and timeouts fail closed", async () => {
  for (const limit of [
    async()=>({rateLimited:false,error:"not-found"}),
    async()=>{throw new Error("network")},
    async()=>({rateLimited:false,error:"unknown"}),
  ]) {
    const s=setup({limit}); await assertBlocked(await s.handler(request()),503); assert.equal(s.calls(),0);
  }
  for (const limit of [async()=>({rateLimited:true}),async()=>({rateLimited:true,error:"blocked"})]) {
    const s=setup({limit}); const response=await s.handler(request());
    assert.equal(response.headers.get("retry-after"),"600");
    await assertBlocked(response,429); assert.equal(s.calls(),0);
  }
});

test("repeated requests are stopped by the shared counter before token verification", async () => {
  let counter=0;
  const s=setup({limit:async()=>({rateLimited:++counter>5})});
  for(let i=0;i<5;i++) assert.equal((await s.handler(request())).status,200);
  await assertBlocked(await s.handler(request()),429);
  assert.equal(s.calls(),5);
});

test("unsupported, malformed, missing and oversized bodies are rejected", async () => {
  const s=setup();
  await assertBlocked(await s.handler(request({},{"content-type":"text/plain"})),415);
  await assertBlocked(await s.handler(request({},{"content-length":"9000"})),413);
  for(const body of [null,[],{}, {token:""},{token:1},{token:" "+ "x"},{token:"x".repeat(2049)}]) {
    const response=await s.handler(request(body));
    assert.ok([400].includes(response.status)); assert.equal((await response.text()).includes(fakePhone),false);
  }
  const malformed=new Request("https://site.example/api/contact-phone",{method:"POST",headers:{origin:"https://site.example","content-type":"application/json"},body:"{"});
  await assertBlocked(await s.handler(malformed),400);
  const oversized=new Request("https://site.example/api/contact-phone",{method:"POST",headers:{origin:"https://site.example","content-type":"application/json"},body:"x".repeat(5000)});
  await assertBlocked(await s.handler(oversized),413);
  assert.equal(s.calls(),0);
});

test("forged, expired, future, reused and wrong-purpose tokens cannot reveal phone", async () => {
  const base={success:true,hostname:"site.example",action:"reveal-phone",challenge_ts:new Date(now).toISOString()};
  for(const result of [
    null, {}, {...base,success:false,"error-codes":["timeout-or-duplicate"]},
    {...base,success:"true"}, {...base,hostname:"attacker.example"}, {...base,action:"login"},
    {...base,challenge_ts:"invalid"}, {...base,challenge_ts:new Date(now-301000).toISOString()},
    {...base,challenge_ts:new Date(now+31000).toISOString()},
  ]) await assertBlocked(await setup({verify:async()=>result}).handler(request()),403);
});

test("verifier failures reveal no values and successful verification uses the server secret", async () => {
  await assertBlocked(await setup({verify:async()=>{throw new Error("upstream");}}).handler(request()),503);
  const s=setup({verify:async(token,secret)=>{
    assert.equal(token,"valid-fixture"); assert.equal(secret,goodConfig.secret);
    return {success:true,hostname:"site.example",action:"reveal-phone",challenge_ts:new Date(now).toISOString()};
  }});
  const response=await s.handler(request());
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{phone:fakePhone});
  assert.match(response.headers.get("cache-control"),/private, no-store/);
  assert.equal(response.headers.get("vercel-cdn-cache-control"),"no-store");
  assert.equal(response.headers.get("x-robots-tag"),"noindex, nofollow");
});


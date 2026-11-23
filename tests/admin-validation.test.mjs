import test from "node:test";
import assert from "node:assert/strict";
import { memberUpdateInput } from "../app/admin/validation.ts";
const defaults={id:"30000000-0000-4000-8000-000000000001",revision:"1",full_name:"검증 회원",username:"member_01",address:"검증 주소",phone:"010-1234-5678",account_status:"active"};
function input(values={}) { const form=new FormData(); for(const [key,value] of Object.entries({...defaults,...values})) form.set(key,value); return memberUpdateInput(form); }
test("valid profile is normalized without touching identity or roles",()=>{const result=input();assert.equal(result.valid,true);assert.equal(result.update.phone,"01012345678");assert.ok(!("user_id" in result.update));assert.ok(!("is_active" in result.update));});
test("rejects malformed identifiers and stale revision formats",()=>{for(const values of [{id:"not-uuid"},{revision:"0"},{revision:"1e2"},{revision:"2147483647"}]) assert.equal(input(values).valid,false);});
test("validates state, address, name and contact fields",()=>{for(const values of [{full_name:" "},{username:"a"},{username:"admin@site"},{phone:"abc01012345678"},{address:"a".repeat(301)},{account_status:"administrator"}]) assert.equal(input(values).valid,false);});
test("empty optional data becomes null and the revision remains explicit",()=>{const result=input({username:"",phone:"",address:"",revision:"4"});assert.equal(result.valid,true);assert.equal(result.revision,4);assert.equal(result.update.address,null);});

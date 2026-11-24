"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "./server";
import { authConfigured, authSiteUrl, membershipEnrollmentEnabled, membershipPolicyVersion } from "./config";
import { validateEnrollment, validateSignup } from "../signup/validation";
import { submitEnrollment, submitLogin, submitSignup } from "./membership-flow";
import type { AuthState } from "./state";

export async function signup(_previous: AuthState, data: FormData): Promise<AuthState> {
  if (!authConfigured()) return { status: "error", message: "회원가입 서비스를 준비 중입니다." };
  const errors = validateSignup(data);
  if (Object.keys(errors).length) return { status: "error", message: "입력 내용과 동의를 확인해 주세요.", errors };
  try {
    const client = await createAuthClient();
    return await submitSignup(client, data, authSiteUrl(), membershipPolicyVersion);
  } catch {
    return { status: "error", message: "인증 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function enrollMembership(_previous: AuthState, data: FormData): Promise<AuthState> {
  if (!authConfigured() || !membershipEnrollmentEnabled()) return { status: "error", message: "홈페이지 회원 등록 기능을 준비 중입니다. 운영자에게 문의해 주세요." };
  const errors = validateEnrollment(data);
  if (Object.keys(errors).length) return { status: "error", message: "입력 내용과 동의를 확인해 주세요.", errors };
  try {
    const client = await createAuthClient();
    const result = await submitEnrollment(client, data, membershipPolicyVersion);
    if (result.status !== "success") return result;
  } catch {
    return { status: "error", message: "인증 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  redirect("/account");
}

export async function login(_previous: AuthState, data: FormData): Promise<AuthState> {
  if (!authConfigured()) return { status: "error", message: "로그인 서비스를 준비 중입니다." };
  const email = typeof data.get("email") === "string" ? String(data.get("email")).trim() : "";
  const password = typeof data.get("password") === "string" ? String(data.get("password")) : "";
  if (!email || email.length > 254 || !password || password.length > 128) return { status: "error", message: "이메일과 비밀번호를 확인해 주세요." };
  let destination: string;
  try {
    const client = await createAuthClient();
    const result = await submitLogin(client, email, password, data.get("destination"));
    if (result.state) return result.state;
    destination = result.destination;
  } catch { return { status: "error", message: "인증 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." }; }
  redirect(destination);
}

export async function logout() {
  if (authConfigured()) {
    const client = await createAuthClient();
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) redirect("/account?error=logout");
  }
  redirect("/login");
}

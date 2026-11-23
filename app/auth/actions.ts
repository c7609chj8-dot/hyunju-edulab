"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "./server";
import { authConfigured, authSiteUrl, membershipPolicyVersion } from "./config";
import { validateSignup } from "../signup/validation";
import type { AuthState } from "./state";

export async function signup(_previous: AuthState, data: FormData): Promise<AuthState> {
  if (!authConfigured()) return { status: "error", message: "회원가입 서비스를 준비 중입니다." };
  const errors = validateSignup(data);
  if (Object.keys(errors).length) return { status: "error", message: "입력 내용과 동의를 확인해 주세요.", errors };
  const optionalText = (key: string) => typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";
  try {
    const client = await createAuthClient();
    const { data: result, error } = await client.auth.signUp({
      email: String(data.get("email")).trim(), password: String(data.get("password")),
      options: {
        emailRedirectTo: `${authSiteUrl()}/auth/callback`,
        data: { membership_app: "hyunju-edulab", full_name: String(data.get("name")).trim(), username: optionalText("username").toLowerCase(), address: optionalText("address"), phone: optionalText("phone").replace(/[-\s]/gu, ""), membership_policy_version: membershipPolicyVersion, privacy_consent: true, overseas_consent: true, age_14_or_older: true },
      },
    });
    if (error) {
      if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") return { status: "error", message: "요청이 많습니다. 잠시 후 다시 시도해 주세요." };
      if (error.code === "email_address_not_authorized" || error.code === "email_address_invalid") return { status: "error", message: "현재 테스트용 인증 메일을 보낼 수 없는 주소입니다. 일반 회원가입은 메일 발송 설정 후 이용할 수 있습니다." };
      return { status: "error", message: "회원가입을 처리하지 못했습니다. 이메일과 비밀번호를 확인하거나 잠시 후 다시 시도해 주세요." };
    }
    return { status: "success", message: result.session ? "가입 처리가 완료됐습니다. 내 계정으로 이동해 주세요." : "가입 가능한 주소라면 인증 메일이 발송됩니다. 같은 브라우저에서 메일의 인증 링크를 열어 주세요. 이미 가입했다면 로그인해 주세요." };
  } catch {
    return { status: "error", message: "인증 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function login(_previous: AuthState, data: FormData): Promise<AuthState> {
  if (!authConfigured()) return { status: "error", message: "로그인 서비스를 준비 중입니다." };
  const email = typeof data.get("email") === "string" ? String(data.get("email")).trim() : "";
  const password = typeof data.get("password") === "string" ? String(data.get("password")) : "";
  if (!email || email.length > 254 || !password || password.length > 128) return { status: "error", message: "이메일과 비밀번호를 확인해 주세요." };
  try {
    const client = await createAuthClient();
    const { data: signedIn, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { status: "error", message: error.status === 429 ? "요청이 많습니다. 잠시 후 다시 시도해 주세요." : "이메일·비밀번호가 올바르지 않거나 이메일 인증이 완료되지 않았습니다." };
    const membership = await client.from("member_profiles").select("account_status").eq("user_id", signedIn.user.id).maybeSingle();
    if (membership.error || !membership.data || membership.data.account_status !== "active") {
      await client.auth.signOut({ scope: "local" });
      return { status: "error", message: membership.error ? "회원 정보 연결을 확인해 주세요." : membership.data ? "이용 정지된 계정입니다. 운영자에게 문의해 주세요." : "이 홈페이지의 회원 등록 정보를 확인할 수 없습니다. 운영자에게 문의해 주세요." };
    }
  } catch { return { status: "error", message: "인증 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." }; }
  redirect(data.get("destination") === "/admin" ? "/admin" : "/account");
}

export async function logout() {
  if (authConfigured()) {
    const client = await createAuthClient();
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) redirect("/account?error=logout");
  }
  redirect("/login");
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthState } from "./state";

type Failure = { code?: string; status?: number };
type MemberDetails = { full_name: string; username: string; address: string; phone: string };
type LoginResult = { state: AuthState; destination?: never } | { destination: "/account" | "/admin" | "/account/enroll"; state?: never };

export function memberDetails(data: FormData): MemberDetails {
  const read = (key: string) => typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";
  return {
    full_name: read("name"),
    username: read("username").toLowerCase(),
    address: read("address"),
    phone: read("phone").replace(/[-\s]/gu, ""),
  };
}

export function signupFailure(error: Failure): AuthState {
  if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return { status: "error", message: "요청이 많습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (error.code === "email_address_not_authorized") {
    return { status: "error", message: "현재 인증 메일 발송이 허용된 주소로만 가입할 수 있습니다. 운영자에게 문의해 주세요." };
  }
  if (error.code === "email_address_invalid" || error.code === "email_address_not_valid") {
    return { status: "error", message: "사용할 수 있는 이메일 주소를 입력해 주세요.", errors: { email: "이메일 주소를 확인해 주세요." } };
  }
  if (error.code === "weak_password") {
    return { status: "error", message: "더 안전한 비밀번호를 입력해 주세요.", errors: { password: "다른 사이트에서 사용하지 않는 비밀번호로 변경해 주세요." } };
  }
  // Auth intentionally hides the underlying trigger/constraint error.
  if (error.code === "unexpected_failure" || error.code === "database_error") {
    return { status: "error", message: "회원정보를 저장하지 못했습니다. 선택한 회원 아이디가 이미 사용 중일 수 있습니다. 다른 아이디로 시도하거나 운영자에게 문의해 주세요." };
  }
  return { status: "error", message: "회원가입을 처리하지 못했습니다. 이메일과 비밀번호를 확인하거나 잠시 후 다시 시도해 주세요." };
}

// Validation must run in the Server Action before calling either write flow.
export async function submitSignup(client: Pick<SupabaseClient, "auth">, data: FormData, siteUrl: string, policyVersion: string): Promise<AuthState> {
  const { data: result, error } = await client.auth.signUp({
    email: String(data.get("email")).trim(),
    password: String(data.get("password")),
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: { ...memberDetails(data), membership_app: "hyunju-edulab", membership_policy_version: policyVersion, privacy_consent: true, overseas_consent: true, age_14_or_older: true },
    },
  });
  if (error) return signupFailure(error);
  return {
    status: "success",
    message: result.session
      ? "가입 처리가 완료됐습니다. 내 계정으로 이동해 주세요."
      : "가입 가능한 주소라면 인증 메일이 발송됩니다. 같은 브라우저에서 인증 링크를 열어 주세요. 이미 계정이 있다면 로그인 후 홈페이지 회원 등록을 확인해 주세요.",
  };
}

export async function submitLogin(client: Pick<SupabaseClient, "auth" | "from">, email: string, password: string, destination: unknown): Promise<LoginResult> {
  const { data: signedIn, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { state: { status: "error", message: error.status === 429 ? "요청이 많습니다. 잠시 후 다시 시도해 주세요." : "이메일·비밀번호가 올바르지 않거나 이메일 인증이 완료되지 않았습니다." } };
  if (!signedIn.user.email_confirmed_at || signedIn.user.is_anonymous) {
    await client.auth.signOut({ scope: "local" });
    return { state: { status: "error", message: "이메일 인증을 마친 계정으로 로그인해 주세요." } };
  }
  const membership = await client.from("member_profiles").select("account_status").eq("user_id", signedIn.user.id).maybeSingle();
  if (membership.error || (membership.data && membership.data.account_status !== "active")) {
    await client.auth.signOut({ scope: "local" });
    return { state: { status: "error", message: membership.error ? "회원 정보 연결을 확인해 주세요." : "이용 정지된 계정입니다. 운영자에게 문의해 주세요." } };
  }
  if (!membership.data) return { destination: "/account/enroll" };
  return { destination: destination === "/admin" ? "/admin" : "/account" };
}

export async function submitEnrollment(client: Pick<SupabaseClient, "auth" | "rpc">, data: FormData, policyVersion: string): Promise<AuthState> {
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user || !user.email_confirmed_at || user.is_anonymous) {
    return { status: "error", message: "이메일 인증을 마친 계정으로 다시 로그인해 주세요." };
  }
  const details = memberDetails(data);
  // The DB function derives the identity/email itself; no form-supplied ID or role.
  const { data: enrolledId, error } = await client.rpc("enroll_current_member", {
    p_full_name: details.full_name,
    p_username: details.username || null,
    p_address: details.address || null,
    p_phone: details.phone || null,
    p_policy_version: policyVersion,
    p_privacy_consent: data.get("privacyConsent") === "on",
    p_overseas_consent: data.get("overseasConsent") === "on",
    p_age_confirmed: data.get("ageConfirmed") === "on",
  });
  if (error) {
    if (error.code === "23505") return { status: "error", message: "다른 회원 아이디를 입력해 주세요.", errors: { username: "이미 사용 중인 아이디입니다." } };
    if (error.code === "42501") return { status: "error", message: "계정의 이메일 인증과 이용 상태를 확인해 주세요. 운영자에게 문의해 주세요." };
    return { status: "error", message: "홈페이지 회원 등록을 완료하지 못했습니다. 잠시 후 다시 시도하거나 운영자에게 문의해 주세요." };
  }
  if (enrolledId !== user.id) return { status: "error", message: "회원 등록 결과를 확인하지 못했습니다. 운영자에게 문의해 주세요." };
  return { status: "success", message: "홈페이지 회원 등록이 완료됐습니다." };
}

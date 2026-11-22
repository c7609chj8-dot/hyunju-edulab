import type { Metadata } from "next";
import { getSupabasePublicConfig } from "../../lib/supabase/config";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "관리자 로그인 | 현주에듀랩",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/admin/inquiries";
  const configured = Boolean(getSupabasePublicConfig());

  return (
    <section className="shell section content-page admin-page">
      <p className="eyebrow">ADMIN</p>
      <h1>관리자 로그인</h1>
      {configured ? (
        <LoginForm nextPath={nextPath} />
      ) : (
        <p className="contact-preview">테스트용 Supabase 인증 설정이 완료되면 대표 계정으로 로그인할 수 있습니다.</p>
      )}
    </section>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

function safeNextPath(value: string) {
  return value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin/inquiries";
}

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setErrorMessage("관리자 인증 설정이 아직 완료되지 않았습니다.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage("로그인 정보를 확인해 주세요.");
      setIsSubmitting(false);
      return;
    }

    window.location.assign(safeNextPath(nextPath));
  }

  return (
    <form className="contact-form" onSubmit={signIn}>
      <label htmlFor="admin-email">이메일</label>
      <input id="admin-email" name="email" type="email" autoComplete="username" required />
      <label htmlFor="admin-password">비밀번호</label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" required />
      <button className="button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "로그인 중…" : "관리자 로그인"}
      </button>
      <p className="contact-status" role="status">{errorMessage}</p>
    </form>
  );
}

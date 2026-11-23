"use client";
import { useActionState } from "react";
import { login } from "../auth/actions";
import { initialAuthState } from "../auth/state";
import styles from "../signup/signup.module.css";

export default function LoginForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(login, initialAuthState);
  return (
    <form action={action}>
      <fieldset className={styles.form} disabled={!enabled || pending}>
        <legend className={styles.legend}>로그인 정보 입력</legend>
        <div className={styles.field}><label htmlFor="login-email">이메일</label><input id="login-email" name="email" type="email" autoComplete="username" autoCapitalize="none" maxLength={254} required /></div>
        <div className={styles.field}><label htmlFor="login-password">비밀번호</label><input id="login-password" name="password" type="password" autoComplete="current-password" maxLength={128} required /></div>
        <button className="button" type="submit">{pending ? "로그인 중…" : "로그인"}</button>
      </fieldset>
      <p className={styles.error} role="status" aria-live="polite">{state.message}</p>
    </form>
  );
}

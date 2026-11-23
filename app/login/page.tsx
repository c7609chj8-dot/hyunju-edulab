import Link from "next/link";
import { authConfigured } from "../auth/config";
import { pageMetadata } from "../seo";
import LoginForm from "./login-form";
import styles from "../signup/signup.module.css";

export const metadata = pageMetadata("/login", "로그인 | 현주에듀랩", "회원 로그인", false);
export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <section className="shell section content-page"><div className={styles.card} style={{ maxWidth: "30rem", marginInline: "auto" }}>
      <p className="eyebrow">MEMBERSHIP</p><h1>로그인</h1><p className={styles.note}>가입한 이메일과 비밀번호로 로그인해 주세요.</p>
      {!authConfigured() ? <p className={styles.notice}>로그인 연결 설정을 준비 중입니다.</p> : null}
      {error === "confirmation" ? <p role="alert" className={styles.error}>인증 링크가 만료됐거나 유효하지 않습니다. 가입할 때 사용한 브라우저에서 열었는지 확인해 주세요.</p> : null}
      <LoginForm enabled={authConfigured()} /><p className={styles.help}>아직 회원이 아니신가요? <Link href="/signup">회원가입</Link></p>
    </div></section>
  );
}

import Link from "next/link";
import LoginForm from "../../login/login-form";
import { authConfigured } from "../../auth/config";
import styles from "../../signup/signup.module.css";

export const metadata = { title: "관리자 로그인 | 현주에듀랩", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminLoginPage() {
  return <section className="shell section content-page"><div className={styles.card} style={{ maxWidth: "30rem", marginInline: "auto" }}><p className="eyebrow">ADMINISTRATION</p><h1>관리자 로그인</h1><p className={styles.note}>승인된 관리자의 이메일과 비밀번호로 로그인해 주세요.</p>{!authConfigured() ? <p role="alert">인증 서비스 연결 설정을 준비 중입니다.</p> : null}<LoginForm enabled={authConfigured()} destination="/admin" /><p className={styles.help}>일반 회원은 <Link href="/login">회원 로그인</Link>을 이용해 주세요.</p></div></section>;
}

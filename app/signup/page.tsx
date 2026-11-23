import Link from "next/link";
import { pageMetadata } from "../seo";
import SignupForm from "./signup-form";
import styles from "./signup.module.css";
import { authConfigured } from "../auth/config";

export const metadata = pageMetadata("/signup", "회원가입 | 현주에듀랩", "이메일 인증으로 회원가입할 수 있습니다.", false);
export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <section className={`shell section ${styles.page}`}>
      <div className={styles.intro}>
        <p className="eyebrow">MEMBERSHIP</p>
        <h1>배움의 시작을<br />함께 준비해요.</h1>
        <p className="page-lead">안전과 AI 활용 교육에 관심 있는 분들을 위한 회원가입 화면입니다.</p>
        <p className={styles.note}>이메일 인증 후 로그인할 수 있습니다. 현재는 테스트 운영 중이며, 인증 메일 수신이 허용된 이메일로 가입할 수 있습니다.</p>
        <Link href="/education" className={styles.backLink}>교육 프로그램 먼저 살펴보기 →</Link>
      </div>
      <div className={styles.card}>
        <h2>회원가입</h2>
        <p id="signup-notice" className={styles.notice}>
          {authConfigured() ? "가입 정보는 Supabase 인증 서비스에 저장됩니다. 이메일 인증을 완료한 후 로그인해 주세요. 별도 메일 발송 서비스 설정 전에는 일반 방문자의 가입이 제한될 수 있습니다." : "회원가입 연결 설정을 준비 중입니다. 현재는 가입할 수 없습니다."}
        </p>
        <SignupForm enabled={authConfigured()} />
      </div>
    </section>
  );
}

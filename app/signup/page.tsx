import Link from "next/link";
import { pageMetadata } from "../seo";
import SignupForm from "./signup-form";
import styles from "./signup.module.css";

export const metadata = pageMetadata("/signup", "회원가입 | 현주에듀랩", "회원가입 정보 입력 확인 화면입니다. 현재 계정은 생성되지 않습니다.", false);

export default function SignupPage() {
  return (
    <section className={`shell section ${styles.page}`}>
      <div className={styles.intro}>
        <p className="eyebrow">MEMBERSHIP</p>
        <h1>배움의 시작을<br />함께 준비해요.</h1>
        <p className="page-lead">안전과 AI 활용 교육에 관심 있는 분들을 위한 회원가입 화면입니다.</p>
        <p className={styles.note}>회원 서비스는 준비 중입니다. 현재는 입력 형식만 확인할 수 있습니다.</p>
        <Link href="/education" className={styles.backLink}>교육 프로그램 먼저 살펴보기 →</Link>
      </div>
      <div className={styles.card}>
        <h2>회원가입</h2>
        <p id="signup-preview" className={styles.notice}>
          입력 확인용 화면입니다. 실제 개인정보와 사용 중인 비밀번호 대신 예시 정보를 입력해 주세요.
          입력 내용은 서버로 전송하거나 저장하지 않으며, 계정은 생성되지 않습니다.
        </p>
        <SignupForm />
      </div>
    </section>
  );
}

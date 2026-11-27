import PhoneReveal from "../../phone-reveal";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "../../auth/access";
import { logout } from "../../auth/actions";
import { membershipEnrollmentEnabled } from "../../auth/config";
import { pageMetadata } from "../../seo";
import SignupForm from "../../signup/signup-form";
import styles from "../../signup/signup.module.css";

export const metadata = pageMetadata("/account/enroll", "홈페이지 회원 등록 | 현주에듀랩", "기존 인증 계정의 홈페이지 회원 등록", false);
export const dynamic = "force-dynamic";

export default async function EnrollmentPage() {
  const { client, user } = await requireVerifiedUser();
  const profile = await client.from("member_profiles").select("account_status").eq("user_id", user.id).maybeSingle();
  if (profile.data?.account_status === "active") redirect("/account");
  const suspended = Boolean(profile.data && profile.data.account_status !== "active");
  const enabled = membershipEnrollmentEnabled() && !profile.error && !suspended;
  return (
    <section className="shell section content-page">
      <div className={styles.card} style={{ maxWidth: "38rem", marginInline: "auto" }}>
        <p className="eyebrow">MEMBERSHIP</p><h1>홈페이지 회원 등록</h1>
        <p className={styles.note}>이메일 인증은 완료됐습니다. 이 홈페이지 이용을 위한 회원정보와 동의를 입력해 주세요.</p>
        <p>로그인 이메일: {user.email}</p>
        <p id="signup-notice" className={styles.notice}>
          {suspended ? "이용 정지된 계정입니다. 운영자에게 문의해 주세요."
            : profile.error ? "회원 정보를 확인하지 못했습니다. 잠시 후 다시 확인해 주세요."
            : enabled ? "기존 인증 계정에 홈페이지 회원정보만 추가합니다. 비밀번호와 다른 서비스의 정보는 변경하지 않습니다."
            : "홈페이지 회원 등록 기능을 준비 중입니다. 등록이 필요하면 운영자에게 문의해 주세요."}
        </p>
        <SignupForm enabled={enabled} mode="enroll" />
        <form action={logout} className="section-action"><button className="button" type="submit">다른 계정으로 로그인</button></form>
        <p className={styles.help}>운영자 문의: <PhoneReveal /></p>
      </div>
    </section>
  );
}

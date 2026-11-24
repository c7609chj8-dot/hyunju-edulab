import Link from "next/link";
import { administrationAccess } from "../access";
import AdminAccessNotice from "../access-notice";
import styles from "../admin.module.css";

export const metadata = { title: "관리자 센터 | 현주에듀랩" };
export default async function AdminPage() {
  const access = await administrationAccess();
  if (access.kind !== "allowed") return <AdminAccessNotice reason={access.kind} />;
  const counts = await Promise.all([
    access.client.from("member_profiles").select("user_id", { head: true, count: "exact" }),
    access.client.from("member_profiles").select("user_id", { head: true, count: "exact" }).eq("account_status", "active"),
    access.client.from("member_profiles").select("user_id", { head: true, count: "exact" }).eq("account_status", "suspended"),
  ]);
  return <section className="section content-page"><p className="eyebrow">ADMINISTRATION</p><h1>관리자 대시보드</h1><p className="page-lead">회원 정보와 이용 상태를 관리하고 접수된 문의를 확인합니다.</p>{counts.some(r => r.error) ? <p role="alert">회원 현황을 불러오지 못했습니다.</p> : <div className={styles.cards}>{["전체 회원", "이용 중", "이용 정지"].map((label,i) => <div className={styles.card} key={label}>{label}<strong>{counts[i].count ?? 0}명</strong></div>)}</div>}<div className={styles.dashboardActions}><Link className="button" href="/admin/members">회원 목록 관리</Link><Link className="button" href="/admin/inquiries">문의 목록 관리</Link></div><p className="section-action">비밀번호 원문은 조회할 수 없습니다. 계정의 이용 정지는 이 홈페이지에 적용됩니다.</p></section>;
}

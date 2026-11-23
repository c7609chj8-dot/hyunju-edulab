import Link from "next/link";
import { notFound } from "next/navigation";
import { administrationAccess } from "../../../access";
import AdminAccessNotice from "../../../access-notice";
import MemberEditor from "../../../member-editor";
import { validMemberId } from "../../../validation";
import styles from "../../../admin.module.css";

export const metadata = { title: "회원 상세 관리 | 현주에듀랩" };
export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await administrationAccess();
  if (access.kind!=="allowed") return <AdminAccessNotice reason={access.kind} />;
  const { id } = await params;
  if (!validMemberId(id)) notFound();
  const [profileResult, roleResult, history] = await Promise.all([
    access.client.from("member_profiles").select("user_id,full_name,username,email,address,phone,account_status,revision,email_confirmed_at,created_at").eq("user_id",id).maybeSingle(),
    access.client.from("member_administrators").select("is_active").eq("user_id",id).maybeSingle(),
    access.client.from("member_account_audit_logs").select("id,changed_fields,previous_status,next_status,created_at").eq("target_user_id",id).order("created_at",{ascending:false}).limit(10),
  ]);
  if (profileResult.error || roleResult.error) return <p role="alert">회원 정보를 불러오지 못했습니다.</p>;
  const profile=profileResult.data;
  if (!profile) notFound();
  const labels: Record<string,string> = { full_name:"이름",username:"아이디",address:"주소",phone:"전화번호",account_status:"이용 상태" };
  return <section className={`section content-page ${styles.detail}`}><p className="eyebrow">MEMBER ACCOUNT</p><h1>회원 상세 관리</h1><dl><dt>이메일</dt><dd>{profile.email}</dd><dt>이메일 인증</dt><dd>{profile.email_confirmed_at ? "완료" : "대기"}</dd><dt>가입일</dt><dd>{new Date(profile.created_at).toLocaleDateString("ko-KR",{timeZone:"Asia/Seoul"})}</dd></dl><MemberEditor profile={profile} isAdministrator={Boolean(roleResult.data?.is_active)} /><section className={styles.history}><h2>최근 변경 기록</h2>{history.error ? <p role="alert">변경 기록을 불러오지 못했습니다.</p> : <ul>{history.data?.length ? history.data.map(item=><li key={item.id}>{new Date(item.created_at).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})} · {item.changed_fields.map((field:string)=>labels[field] ?? "회원 정보").join(", ")}</li>) : <li>변경 기록이 없습니다.</li>}</ul>}</section><Link href="/admin/members">회원 목록으로 돌아가기</Link></section>;
}

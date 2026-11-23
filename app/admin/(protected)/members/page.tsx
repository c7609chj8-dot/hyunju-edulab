import Link from "next/link";
import { administrationAccess } from "../../access";
import AdminAccessNotice from "../../access-notice";
import { pageMetadata } from "../../../seo";
import { memberPage, memberSearch, memberSearchFilter, membersPerPage } from "../../members/search";
import styles from "../../members/members.module.css";

export const metadata = pageMetadata("/admin/members", "회원 관리 | 현주에듀랩", "관리자 전용 회원 목록", false);
export const dynamic = "force-dynamic";
export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const access = await administrationAccess();
  if (access.kind !== "allowed") return <AdminAccessNotice reason={access.kind} />;
  const { client } = access;
  const params = await searchParams;
  const q = memberSearch(params.q);
  const page = memberPage(params.page);
  let query = client.from("member_profiles").select("user_id,full_name,username,email,account_status,created_at", { count: "exact" }).order("created_at", { ascending: false }).order("user_id");
  if (q) query = query.or(memberSearchFilter(q));
  const { data, count, error } = await query.range((page - 1) * membersPerPage, page * membersPerPage - 1);
  const pageHref = (p: number) => `/admin/members?${new URLSearchParams({ q, page: String(p) })}`;
  return (
    <section className="section content-page">
      <p className="eyebrow">ADMINISTRATION</p><h1>회원 관리</h1><p className="page-lead">회원을 검색하고 상세 화면에서 회원 정보와 이용 상태를 관리합니다.</p>
      <form className={styles.search} method="get"><label htmlFor="member-query">이름·아이디·이메일 검색</label><div><input id="member-query" name="q" defaultValue={q} maxLength={80} /><button className="button" type="submit">검색</button></div></form>
      {error ? <p role="alert">회원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : <>
        <p className="section-action">검색 결과 {count ?? 0}명 · {page}페이지</p>
        <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="회원 목록 가로 스크롤"><table className={styles.table}>
          <caption className={styles.caption}>관리자 전용 회원 목록</caption>
          <thead><tr><th scope="col">이름</th><th scope="col">아이디</th><th scope="col">이메일</th><th scope="col">이용 상태</th><th scope="col">관리</th></tr></thead>
          <tbody>{data?.length ? data.map((member) => <tr key={member.user_id}><td>{member.full_name}</td><td>{member.username ?? "미등록"}</td><td>{member.email}</td><td>{member.account_status === "active" ? "이용 중" : "이용 정지"}</td><td><Link className="program-link" href={`/admin/members/${member.user_id}`} aria-label={`${member.full_name} 회원 상세 관리`}>상세 관리</Link></td></tr>) : <tr><td colSpan={5}>조건에 맞는 회원이 없습니다.</td></tr>}</tbody>
        </table></div>
        <nav className={styles.pagination} aria-label="회원 목록 페이지">{page > 1 ? <Link href={pageHref(page - 1)}>이전 페이지</Link> : null}{page * membersPerPage < (count ?? 0) ? <Link href={pageHref(page + 1)}>다음 페이지</Link> : null}</nav>
      </>}
      <p className={styles.help}>회원 정보 수정과 이용 상태 변경은 기록됩니다. 관리자 권한 부여·회수와 실제 인증 계정 삭제는 Supabase 관리 콘솔에서 처리합니다.</p><Link href="/admin">대시보드로 돌아가기</Link>
    </section>
  );
}

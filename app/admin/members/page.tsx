import Link from "next/link";
import { memberAdministrator } from "../../auth/access";
import { pageMetadata } from "../../seo";
import { memberPage, memberSearch, memberSearchFilter, membersPerPage } from "./search";
import styles from "./members.module.css";

export const metadata = pageMetadata("/admin/members", "회원 관리 | 현주에듀랩", "관리자 전용 회원 목록", false);
export const dynamic = "force-dynamic";
export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }) {
  const { client, isAdministrator } = await memberAdministrator();
  if (!isAdministrator) return <section className="shell section content-page"><h1>접근 권한이 없습니다</h1><p className="page-lead">승인된 관리자만 회원 정보를 조회할 수 있습니다.</p><Link href="/account">내 계정으로 돌아가기</Link></section>;
  const params = await searchParams;
  const q = memberSearch(params.q);
  const page = memberPage(params.page);
  let query = client.from("member_profiles").select("user_id,full_name,email,email_confirmed_at,created_at", { count: "exact" }).order("created_at", { ascending: false }).order("user_id");
  if (q) query = query.or(memberSearchFilter(q));
  const { data, count, error } = await query.range((page - 1) * membersPerPage, page * membersPerPage - 1);
  const pageHref = (p: number) => `/admin/members?${new URLSearchParams({ q, page: String(p) })}`;
  return (
    <section className="shell section content-page">
      <p className="eyebrow">ADMINISTRATION</p><h1>회원 관리</h1><p className="page-lead">가입 회원의 이름·이메일·가입일과 인증 상태를 확인합니다.</p>
      <form className={styles.search} method="get"><label htmlFor="member-query">이름 또는 이메일 검색</label><div><input id="member-query" name="q" defaultValue={q} maxLength={80} /><button className="button" type="submit">검색</button></div></form>
      {error ? <p role="alert">회원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : <>
        <p className="section-action">검색 결과 {count ?? 0}명 · {page}페이지</p>
        <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="회원 목록 가로 스크롤"><table className={styles.table}>
          <caption className={styles.caption}>관리자 전용 회원 목록</caption>
          <thead><tr><th scope="col">이름</th><th scope="col">이메일</th><th scope="col">가입일</th><th scope="col">이메일 인증</th></tr></thead>
          <tbody>{data?.length ? data.map((member) => <tr key={member.user_id}><td>{member.full_name}</td><td>{member.email}</td><td>{new Date(member.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</td><td>{member.email_confirmed_at ? "완료" : "대기"}</td></tr>) : <tr><td colSpan={4}>조건에 맞는 회원이 없습니다.</td></tr>}</tbody>
        </table></div>
        <nav className={styles.pagination} aria-label="회원 목록 페이지">{page > 1 ? <Link href={pageHref(page - 1)}>이전 페이지</Link> : null}{page * membersPerPage < (count ?? 0) ? <Link href={pageHref(page + 1)}>다음 페이지</Link> : null}</nav>
      </>}
      <p className={styles.help}>회원정보는 계정 운영 목적으로만 확인해 주세요. 권한 변경·이용 정지·탈퇴 처리는 현재 Supabase 관리 콘솔에서 수행합니다.</p><Link href="/account">내 계정으로 돌아가기</Link>
    </section>
  );
}

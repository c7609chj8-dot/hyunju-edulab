import Link from "next/link";
import { memberAdministrator } from "../auth/access";
import { logout } from "../auth/actions";
import { pageMetadata } from "../seo";

export const metadata = pageMetadata("/account", "내 계정 | 현주에듀랩", "회원 계정 정보", false);
export const dynamic = "force-dynamic";
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { client, user, isAdministrator } = await memberAdministrator();
  const { data: profile, error } = await client.from("member_profiles").select("full_name,username,address,phone,created_at").eq("user_id", user.id).single();
  const params = await searchParams;
  return (
    <section className="shell section content-page">
      <p className="eyebrow">MY ACCOUNT</p><h1>내 계정</h1><p className="page-lead">이메일 인증을 마친 회원 계정입니다.</p>
      {error ? <p role="alert">회원 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p> : <p>{profile.full_name}님, 반갑습니다.</p>}
      <p>이메일: {user.email}</p>
      {profile ? <><p>회원 아이디: {profile.username ?? "미등록"}</p><p>주소: {profile.address ?? "미등록"}</p><p>전화번호: {profile.phone ?? "미등록"}</p></> : null}
      {isAdministrator ? <p className="section-action"><Link className="button" href="/admin">관리자 센터</Link></p> : null}
      {params.error === "logout" ? <p role="alert">로그아웃에 실패했습니다. 다시 시도해 주세요.</p> : null}
      <form action={logout} className="section-action"><button className="button" type="submit">로그아웃</button></form>
      <p className="section-action">회원정보 열람·정정·탈퇴 요청: <a href="tel:01072592558">010-7259-2558</a></p>
    </section>
  );
}

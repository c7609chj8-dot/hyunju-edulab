import Link from "next/link";
export default function AdminAccessNotice({ reason }: { reason: "forbidden" | "unavailable" }) {
  return <section className="shell section content-page"><h1>{reason === "forbidden" ? "관리자 권한이 필요합니다" : "회원 관리 연결을 확인해 주세요"}</h1><p className="page-lead">{reason === "forbidden" ? "승인된 활성 관리자 계정만 이용할 수 있습니다." : "인증 서비스 또는 회원 테이블에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요."}</p><Link href="/admin/login">관리자 로그인</Link> · <Link href="/">홈으로</Link></section>;
}

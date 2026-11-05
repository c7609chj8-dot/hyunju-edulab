import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell section content-page">
      <p className="eyebrow">404</p>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p className="page-lead">주소를 확인하거나 아래 링크에서 찾으려는 페이지를 다시 선택해 주세요.</p>
      <div className="flex flex-wrap items-center gap-4">
        <Link className="button" href="/">홈으로 돌아가기</Link>
        <Link className="program-link inline-flex min-h-11 items-center" href="/materials">교육자료실로 이동</Link>
      </div>
    </section>
  );
}

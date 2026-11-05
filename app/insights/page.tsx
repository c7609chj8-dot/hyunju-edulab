import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "소식·정보 | 현주에듀랩",
  description: "현주에듀랩의 홈페이지 구축과 교육자료 안내를 확인하세요.",
};

export default function InsightsPage() {
  return (
    <section className="shell section content-page">
      <p className="eyebrow">INSIGHTS</p>
      <h1>소식·정보</h1>
      <p className="page-lead">홈페이지 이용 안내와 교육자료 준비 소식을 전합니다.</p>
      <ul className="program-grid program-grid-detailed">
        <li>
          <p className="eyebrow">이용 안내</p>
          <h2>문의 화면 사용 안내</h2>
          <p>강의, 교육자료 제작, 디지털 서비스 문의 유형과 필수 입력 항목을 확인할 수 있습니다. 예시 정보로 입력 형식을 확인해 보세요.</p>
          <Link className="program-link section-action inline-block" href="/contact">문의 화면 보기</Link>
        </li>
        <li>
          <p className="eyebrow">자료 소식</p>
          <h2>초등 교육자료 2종 소개</h2>
          <p>탄소중립·자원순환과 교통안전의 학습 목표와 활동 예시를 자료실에 정리했습니다. 자료는 제목이나 주제로 검색할 수 있습니다.</p>
          <Link className="program-link section-action inline-block" href="/materials">자료 목록 보기</Link>
        </li>
      </ul>
    </section>
  );
}

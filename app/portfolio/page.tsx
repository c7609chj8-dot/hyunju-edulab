import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "포트폴리오 | 현주에듀랩",
  description: "현주에듀랩 홈페이지 구축과 초등 교육자료 준비 사례를 소개합니다.",
};

export default function PortfolioPage() {
  return (
    <section className="shell section content-page">
      <p className="eyebrow">PORTFOLIO</p>
      <h1>포트폴리오</h1>
      <p className="page-lead">현주에듀랩이 진행 중인 홈페이지 구축과 교육자료 준비 사례입니다.</p>
      <ul className="program-grid program-grid-detailed">
        <li>
          <p className="eyebrow">홈페이지 구축</p>
          <h2>현주에듀랩 홈페이지</h2>
          <dl className="program-details">
            <dt>과제</dt>
            <dd>방문자가 교육 프로그램, 자료, 문의 화면을 쉽게 찾을 수 있도록 구성합니다.</dd>
            <dt>구현</dt>
            <dd>공통 메뉴를 만들고, 홈에서 프로그램 상세와 문의 화면으로 이동할 수 있게 연결했습니다.</dd>
            <dt>현재 상태</dt>
            <dd>프런트엔드 화면을 구축했습니다. 문의 화면은 입력 형식 확인 단계입니다.</dd>
          </dl>
          <Link className="program-link section-action inline-block" href="/education">교육 프로그램 보기</Link>
        </li>
        <li>
          <p className="eyebrow">교육자료 준비</p>
          <h2>초등 환경·교통안전 자료</h2>
          <dl className="program-details">
            <dt>과제</dt>
            <dd>교사가 수업에 활용할 주제와 활동을 빠르게 파악할 수 있도록 정리합니다.</dd>
            <dt>구현</dt>
            <dd>자원순환과 교통안전 자료에 학습 목표와 수업 활동 예시를 담았습니다.</dd>
            <dt>현재 상태</dt>
            <dd>자료 2종의 소개를 확인할 수 있습니다. 원본은 공개 검토 단계입니다.</dd>
          </dl>
          <Link className="program-link section-action inline-block" href="/materials">교육자료실 보기</Link>
        </li>
      </ul>
    </section>
  );
}

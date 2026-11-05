import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "강사 소개 | 현주에듀랩",
  description: "현주에듀랩의 교육 방식과 전문 분야를 소개합니다.",
};

export default function AboutPage() {
  return (
    <article className="shell section content-page">
      <p className="eyebrow">ABOUT</p>
      <h1>강사 소개</h1>
      <p className="page-lead">
        현주에듀랩은 안전관리와 교육 운영의 현장 경험을 바탕으로 안전·환경·AI 활용 교육을 설계합니다.
      </p>
      <section className="content-section">
        <h2>교육 방식</h2>
        <p>현장에서 마주칠 수 있는 상황을 먼저 살펴보고, 참여자가 직접 판단하고 연습하는 활동을 구성합니다.</p>
      </section>
      <section className="content-section">
        <h2>전문 분야</h2>
        <ul className="topic-list">
          <li>안전관리와 위험성평가</li>
          <li>학교안전과 환경교육 운영</li>
          <li>수업 준비와 업무에 적용하는 AI 활용</li>
        </ul>
      </section>
      <Link className="button" href="/education">교육 프로그램 보기</Link>
    </article>
  );
}

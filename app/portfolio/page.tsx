import type { Metadata } from "next";
import Link from "next/link";
import { portfolioCases } from "./cases";

export const metadata: Metadata = {
  title: "포트폴리오 | 현주에듀랩",
  description: "현주에듀랩 홈페이지 구축과 초등 교육자료 준비 사례의 작업 내용, 결과와 현재 공개 범위를 소개합니다.",
};

export default function PortfolioPage() {
  return (
    <article className="shell section content-page">
      <p className="eyebrow">PORTFOLIO</p>
      <h1>포트폴리오</h1>
      <p className="page-lead">교육을 준비하고 연결하는 과정을 소개합니다.</p>
      <p className="materials-note">현재 공개한 사례는 홈페이지 구축과 교육자료 준비 과정입니다. 실제 강의 운영 실적과 구분해 안내합니다.</p>
      <ul className="program-grid program-grid-detailed section-action">
        {portfolioCases.map((item) => (
          <li key={item.slug} id={item.slug}>
            <p className="eyebrow">{item.category}</p>
            <h2><Link className="program-link" href={`/portfolio/${item.slug}`}>{item.title}</Link></h2>
            <p className="case-status">{item.status}</p>
            <p>{item.summary}</p>
            <dl className="program-details">
              <dt>대상</dt><dd>{item.audience}</dd>
              <dt>현재 결과</dt><dd>{item.result}</dd>
            </dl>
            <Link className="program-link section-action inline-flex min-h-11 items-center" href={`/portfolio/${item.slug}`}>{item.category} 상세 보기</Link>
          </li>
        ))}
      </ul>
      <section className="about-section" aria-labelledby="portfolio-next-title">
        <h2 id="portfolio-next-title">교육 의뢰를 준비하고 계신가요?</h2>
        <p>전문 분야와 교육 프로그램을 살펴보고 대상과 필요한 주제를 정리해보세요.</p>
        <div className="about-actions section-action">
          <Link className="program-link inline-flex min-h-11 items-center" href="/about">강사 소개 보기</Link>
          <Link className="button" href="/contact">강의 의뢰</Link>
        </div>
      </section>
    </article>
  );
}

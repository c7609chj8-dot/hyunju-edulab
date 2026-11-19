import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { portfolioCases } from "../cases";

type CasePageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return portfolioCases.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: CasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = portfolioCases.find((entry) => entry.slug === slug);
  if (!item) notFound();
  return { title: `${item.title} 사례 | 현주에듀랩`, description: item.summary };
}

export default async function CasePage({ params }: CasePageProps) {
  const { slug } = await params;
  const item = portfolioCases.find((entry) => entry.slug === slug);
  if (!item) notFound();

  return (
    <article className="shell section content-page case-detail">
      <Link className="program-link inline-flex min-h-11 items-center" href={`/portfolio#${item.slug}`}>포트폴리오 목록으로</Link>
      <p className="eyebrow section-action">{item.category}</p>
      <h1>{item.title}</h1>
      <p className="case-status">{item.status}</p>
      <p className="page-lead">{item.summary}</p>
      <section className="content-section" aria-labelledby="case-goal">
        <h2 id="case-goal">대상과 목표</h2>
        <p className="program-audience">{item.audience}</p>
        <p>{item.goal}</p>
      </section>
      <section className="content-section" aria-labelledby="case-activities">
        <h2 id="case-activities">진행한 작업</h2>
        <ul className="topic-list">{item.activities.map((activity) => <li key={activity}>{activity}</li>)}</ul>
      </section>
      <section className="content-section" aria-labelledby="case-result">
        <h2 id="case-result">결과와 현재 범위</h2>
        <p>{item.result}</p>
        <p className="materials-note">{item.limitation}</p>
      </section>
      <section className="content-section" aria-labelledby="case-related">
        <h2 id="case-related">관련 페이지에서 확인하기</h2>
        <ul className="case-links">{item.links.map(({ href, label }) => (
          <li key={href}><Link className="program-link inline-flex min-h-11 items-center" href={href}>{label}</Link></li>
        ))}</ul>
      </section>
      <div className="about-actions section-action">
        <Link className="button" href="/contact">강의 의뢰</Link>
        <Link className="program-link inline-flex min-h-11 items-center" href="/about">강사 소개 보기</Link>
      </div>
    </article>
  );
}

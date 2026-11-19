import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { programs } from "../../programs";

type ProgramPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return programs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProgramPageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = programs.find((item) => item.slug === slug);
  if (!program) notFound();
  return { title: `${program.name} 교육 | 현주에듀랩`, description: `${program.audience}를 위한 교육입니다. ${program.detail}` };
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;
  const program = programs.find((item) => item.slug === slug);
  if (!program) notFound();

  return (
    <article className="shell section content-page">
      <Link className="program-link inline-flex min-h-11 items-center" href={`/education#${program.slug}`}>교육 프로그램 목록으로</Link>
      <p className="eyebrow section-action">PROGRAM</p>
      <h1>{program.name}</h1>
      <p className="page-lead">{program.detail}</p>
      <p className="program-audience">{program.audience}</p>
      <p className="materials-note">아래는 교육 구성 예시입니다. 교육 시간·차시·인원·비용과 제공 자료는 대상과 기관의 여건에 맞춰 사전 협의합니다.</p>
      <div className="about-actions section-action">
        <Link className="button" href={`/contact?program=${program.slug}`}>이 교육 강의 의뢰</Link>
        <Link className="program-link inline-flex min-h-11 items-center" href="/about">강사 소개 보기</Link>
      </div>
      <section className="about-section" aria-labelledby="program-objectives">
        <h2 id="program-objectives">학습 목표</h2>
        <ul className="topic-list">{program.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
      </section>
      <section className="about-section" aria-labelledby="program-outline">
        <h2 id="program-outline">교육 흐름 예시</h2>
        <ol className="teaching-steps">{program.outline.map((step) => <li key={step}>{step}</li>)}</ol>
      </section>
      <section className="about-section" aria-labelledby="program-activity">
        <h2 id="program-activity">참여 활동과 정리</h2>
        <p>{program.activity}</p>
        <p>{program.outcome}</p>
      </section>
      <section className="about-section" aria-labelledby="program-preparation">
        <h2 id="program-preparation">의뢰 전 준비사항</h2>
        <p>{program.preparation}</p>
      </section>
      <section className="about-section" aria-labelledby="program-faq">
        <h2 id="program-faq">자주 묻는 질문</h2>
        <div className="program-faq">
          <details><summary>교육 시간과 차시는 정해져 있나요?</summary><p>희망 일정과 참여자의 수준에 맞춰 협의합니다. 이 페이지의 교육 흐름은 확정된 시간표가 아닙니다.</p></details>
          <details><summary>기관 상황에 맞게 주제를 조정할 수 있나요?</summary><p>교육 대상, 필요한 주제와 실습 환경을 바탕으로 구성과 준비사항을 사전에 협의합니다.</p></details>
          <details><summary>여기서 바로 신청이 완료되나요?</summary><p>현재 강의 의뢰 화면은 입력 확인용입니다. 입력 내용은 전송·저장되지 않으며 실제 접수 기능은 준비 중입니다.</p></details>
        </div>
      </section>
      <section className="about-section" aria-labelledby="program-related">
        <h2 id="program-related">관련 정보</h2>
        <ul className="case-links">{program.relatedLinks.map(({ href, label }) => <li key={href}><Link className="program-link inline-flex min-h-11 items-center" href={href}>{label}</Link></li>)}</ul>
      </section>
    </article>
  );
}

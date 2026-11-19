import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { materials } from "../catalog";
import { Suspense } from "react";
import MaterialsBackLink from "../materials-back-link";

type MaterialPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return materials.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: MaterialPageProps): Promise<Metadata> {
  const { slug } = await params;
  const material = materials.find((item) => item.slug === slug);
  if (!material) notFound();

  return {
    title: `${material.title} | 현주에듀랩`,
    description: material.description,
  };
}

export default async function MaterialPage({ params }: MaterialPageProps) {
  const { slug } = await params;
  const material = materials.find((item) => item.slug === slug);
  if (!material) notFound();

  return (
    <article className="shell section content-page">
      <Suspense fallback={<Link className="program-link" href="/materials">교육자료실 목록으로</Link>}><MaterialsBackLink /></Suspense>
      <p className="eyebrow section-action">{material.category} · {material.audience}</p>
      <h1>{material.title}</h1>
      <p className="page-lead">{material.description}</p>
      <dl className="program-details content-section">
        <dt>교육 대상</dt><dd>{material.audience}</dd>
        <dt>제공 형식</dt><dd>웹 소개 · 학습 목표와 활동 예시</dd>
        <dt>공개 상태</dt><dd>소개 공개 · 원본 미제공</dd>
      </dl>
      <section className="content-section">
        <h2>학습 목표</h2>
        <ul className="topic-list">
          {material.objectives.map((objective) => <li key={objective}>{objective}</li>)}
        </ul>
      </section>
      <section className="content-section">
        <h2>수업 활동 예시</h2>
        <p>{material.activity}</p>
      </section>
      <section className="content-section" aria-labelledby="material-usage">
        <h2 id="material-usage">자료 이용 안내</h2>
        <p className="materials-note">원본 파일은 현재 제공하지 않습니다. 원본의 이용 범위·재배포 조건은 공개 검토 후 안내합니다.</p>
      </section>
      <Link className="button" href={`/education/${material.programSlug}`}>관련 교육 프로그램 보기</Link>
    </article>
  );
}

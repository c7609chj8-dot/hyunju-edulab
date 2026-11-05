import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { materials } from "../catalog";

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
      <Link className="program-link" href="/materials">교육자료실 목록으로</Link>
      <p className="eyebrow section-action">{material.category} · {material.audience}</p>
      <h1>{material.title}</h1>
      <p className="page-lead">{material.description}</p>
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
      <p className="materials-note">자료 소개용 화면입니다. 원본 파일은 공개 권한 검토 후 제공할 예정입니다.</p>
    </article>
  );
}

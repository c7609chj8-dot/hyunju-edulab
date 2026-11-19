import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { programs } from "../programs";
import { teachingApproach } from "../teaching-approach";

export const metadata: Metadata = {
  title: "강사 소개 | 현주에듀랩",
  description: "안전·환경·AI 교육을 설계하는 현주에듀랩의 전문 분야와 교육 철학, 현장 수업 방식을 소개합니다.",
};

export default function AboutPage() {
  return (
    <article className="shell section content-page">
      <div className="about-intro">
        <div>
          <p className="eyebrow">INSTRUCTOR</p>
          <h1>강사 소개</h1>
          <p className="page-lead">
            현주에듀랩은 안전관리와 교육 운영의 현장 경험을 바탕으로 안전·환경·AI 활용 교육을 설계합니다.
          </p>
          <p>학교·교육기관·기업의 대상과 상황을 살펴보고, 배운 내용을 직접 연습하는 수업을 구성합니다.</p>
          <div className="about-actions section-action">
            <Link className="button" href="/contact">강의 의뢰</Link>
            <Link className="program-link inline-flex min-h-11 items-center" href="/education">교육 프로그램 보기</Link>
          </div>
        </div>
        <figure className="about-photo">
          <Image
            src="/images/school-safety-class.jpg"
            alt="교실에서 학생들과 안전 상황을 살펴보는 교육 현장"
            fill
            sizes="(min-width: 896px) 550px, 90vw"
          />
          <figcaption>학생들과 함께하는 안전교육</figcaption>
        </figure>
      </div>
      <section className="about-section" aria-labelledby="expertise-title">
        <p className="eyebrow">EXPERTISE</p>
        <h2 id="expertise-title">전문 분야</h2>
        <p className="section-description">안전관리와 위험성평가, 학교안전과 환경교육, 수업 준비와 업무에 적용하는 AI 활용을 다룹니다.</p>
        <ul className="program-grid program-grid-detailed">
          {programs.map(({ slug, name, detail, audience }) => (
            <li key={slug}>
              <p className="program-audience">{audience}</p>
              <h3><Link className="program-link" href={`/education#${slug}`}>{name}</Link></h3>
              <p>{detail}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="about-section" aria-labelledby="philosophy-title">
        <p className="eyebrow">APPROACH</p>
        <h2 id="philosophy-title">교육 철학</h2>
        <p className="section-description">현장에서 마주칠 수 있는 상황을 먼저 살펴보고, 참여자가 직접 판단하고 연습하는 활동을 구성합니다.</p>
        <ol className="teaching-steps">
          {teachingApproach.map(({ title, description }) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="about-section" aria-labelledby="related-title">
        <h2 id="related-title">자료와 진행 사례</h2>
        <p>교육자료의 학습 목표와 활동 예시, 현재 진행 중인 자료 준비·홈페이지 구축 과정을 살펴보세요.</p>
        <div className="about-actions section-action">
          <Link className="program-link inline-flex min-h-11 items-center" href="/materials">교육자료 살펴보기</Link>
          <Link className="program-link inline-flex min-h-11 items-center" href="/portfolio">진행 사례 보기</Link>
        </div>
      </section>
    </article>
  );
}

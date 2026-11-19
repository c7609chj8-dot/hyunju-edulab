import Link from "next/link";
import Image from "next/image";
import { programs } from "./programs";
import { teachingApproach } from "./teaching-approach";
import { pageMetadata } from "./seo";

export const metadata = pageMetadata("/", "현주에듀랩 | 안전·환경·AI 교육", "학교·교육기관·기업을 위한 안전·환경·AI 활용 교육. 대상에 맞는 프로그램과 강사 소개, 교육자료를 살펴보세요.");

export default function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="shell hero-inner">
          <div>
            <p className="eyebrow">학교·교육기관·기업을 위한 교육</p>
            <h1 id="hero-title" className="hero-title">
              <span>안전·환경·AI,</span>
              현장에서 익히는 교육
            </h1>
            <p className="hero-description">학교 안전부터 자원순환, AI 활용까지.<br />대상과 현장에 맞춰 직접 참여하고 적용하는 교육을 설계합니다.</p>
            <div className="hero-actions">
              <Link className="button" href="/contact">강의 의뢰</Link>
              <Link className="button button-outline" href="/education">교육 프로그램 보기</Link>
            </div>
            <Link className="hero-link" href="/about">강사 소개 보기</Link>
            <p className="hero-slogan">현장의 경험을 AI로 연결하고,<br />교육의 가치를 미래로 확장하다.</p>
          </div>
          <div className="hero-photos">
            <figure className="hero-photo hero-photo-main">
              <Image
                src="/images/school-safety-class.jpg"
                alt="교실에서 학생들과 함께 진행하는 안전교육 현장"
                fill
                sizes="(min-width: 896px) 550px, (min-width: 576px) 85vw, 90vw"
                preload
              />
              <figcaption>학생들과 함께하는 안전교육</figcaption>
            </figure>
            <figure className="hero-photo hero-photo-workshop">
              <Image
                src="/images/ai-workshop.jpg"
                alt="참여자들이 노트북으로 실습하는 AI 활용교육 현장"
                fill
                sizes="(min-width: 896px) 320px, 58vw"
              />
              <figcaption>직접 익히는 AI 활용교육</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section id="programs" className="shell section" aria-labelledby="programs-title">
        <p className="eyebrow">PROGRAMS</p>
        <h2 id="programs-title">대상에 맞는 교육을 찾아보세요</h2>
        <p className="section-description">교육 대상과 활동 예시를 살펴보고 필요한 프로그램을 선택하세요.</p>
        <ul className="program-grid program-grid-detailed">
          {programs.map(({ slug, name, detail, audience, activity }) => (
            <li key={slug}>
              <p className="program-audience">{audience}</p>
              <h3><Link className="program-link" href={`/education#${slug}`}>{name}</Link></h3>
              <p>{detail}</p>
              <dl className="program-details">
                <dt>활동 예시</dt>
                <dd>{activity}</dd>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-about" aria-labelledby="instructor-title">
        <div className="shell section home-about-inner">
          <div>
            <p className="eyebrow">INSTRUCTOR</p>
            <h2 id="instructor-title">강사와 교육 방식</h2>
            <p>안전관리와 교육 운영의 현장 경험을 바탕으로, 참여자가 직접 판단하고 연습하는 수업을 구성합니다.</p>
            <Link className="button section-action" href="/about">강사 소개 보기</Link>
          </div>
          <ol className="teaching-steps">
            {teachingApproach.map(({ title, description }) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="shell section" aria-labelledby="cases-title">
        <p className="eyebrow">PROJECTS</p>
        <h2 id="cases-title">진행 사례</h2>
        <p className="section-description">교육자료 준비와 홈페이지 구축 과정을 소개합니다.</p>
        <ul className="program-grid program-grid-detailed">
          <li>
            <p className="eyebrow">교육자료 준비</p>
            <h3>초등 환경·교통안전 자료</h3>
            <p>자원순환과 교통안전의 학습 목표와 활동 예시를 정리했습니다. 원본 자료는 공개 검토 단계입니다.</p>
            <Link className="program-link section-action inline-flex min-h-11 items-center" href="/portfolio#teaching-materials">자료 준비 사례 보기</Link>
          </li>
          <li>
            <p className="eyebrow">홈페이지 구축</p>
            <h3>현주에듀랩 홈페이지</h3>
            <p>교육 프로그램과 자료 검색, 문의 화면을 연결했습니다. 문의 화면은 입력 형식 확인 단계입니다.</p>
            <Link className="program-link section-action inline-flex min-h-11 items-center" href="/portfolio#website">홈페이지 구축 사례 보기</Link>
          </li>
        </ul>
      </section>

      <section id="materials" className="materials">
        <div className="shell section">
          <p className="eyebrow">MATERIALS</p>
          <h2>교육자료 공개 준비</h2>
          <p>초등 탄소중립·자원순환과 교통안전 자료를 검토하고 있습니다.</p>
          <Link className="button section-action" href="/materials">교육자료실 보기</Link>
        </div>
      </section>
    </>
  );
}

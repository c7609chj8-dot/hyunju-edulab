import Image from "next/image";
import Link from "next/link";
import { digitalServices } from "./digital/services";
import { programs } from "./programs";
import { pageMetadata } from "./seo";
import { teachingApproach } from "./teaching-approach";
import { siteContact } from "./site-contact";
import HeroGallery from "./hero-gallery";

export const metadata = pageMetadata("/", "현주에듀랩 | 안전교육·AI 활용교육", "학교안전교육·건설산업안전교육·환경교육·AI 활용교육. 최현주 강사가 학교·교육기관·기업의 현장에 맞는 참여형 교육을 설계합니다.");

const learningPrinciples = [
  "안전·환경·AI를 한 흐름으로 연결",
  "대상과 현장에 맞춘 참여형 수업 설계",
  "배운 내용을 바로 적용할 수 있는 활동 구성",
];

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="shell home-hero-layout">
        <div className="home-hero-content">
          <p className="home-kicker">HYUNJU EDU LAB · FIELD LEARNING</p>
          <h1 id="hero-title">
            현장의 질문을,
            <span>오늘의 배움으로 연결합니다.</span>
          </h1>
          <p className="home-hero-copy">
            학교·교육기관·기업을 위한 안전교육과 AI 활용교육. 최현주 강사가 대상과 현장에 맞는 참여형 수업을 설계합니다.
          </p>
          <div className="home-hero-actions">
            <a className="home-primary-button" href={siteContact.phoneHref}>전화 상담 <span aria-hidden="true">→</span></a>
            <Link className="home-text-link" href="/contact">강의 문의 안내 <span aria-hidden="true">→</span></Link>
            <Link className="home-text-link" href="/education">교육 프로그램 보기 <span aria-hidden="true">↗</span></Link>
            <Link className="home-text-link" href="/signup">회원가입 <span aria-hidden="true">→</span></Link>
          </div>
          <p className="home-hero-caption">현장의 경험을 AI로 연결하고, 교육의 가치를 미래로 확장합니다.</p>
        </div>
        <HeroGallery />
        </div>
      </section>

      <section className="home-principles" aria-label="현주에듀랩 교육 원칙">
        <div className="shell home-principles-inner">
          <p>LEARNING WITH PURPOSE</p>
          <ul>
            {learningPrinciples.map((principle, index) => (
              <li key={principle}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {principle}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="programs" className="home-programs section" aria-labelledby="programs-title">
        <div className="shell">
          <div className="home-section-heading">
            <p className="home-kicker">EDUCATION PROGRAMS</p>
            <h2 id="programs-title">대상에 맞는 주제를<br />현장 언어로 풀어냅니다.</h2>
            <p>교육의 목표와 참여자의 상황을 먼저 살피고, 실제 행동으로 이어지는 활동을 구성합니다.</p>
          </div>
          <ul className="home-program-grid">
            {programs.map(({ slug, name, detail, audience, activity }, index) => (
              <li key={slug}>
                <Link href={`/education/${slug}`} className="home-program-card">
                  <span className="home-card-number">{String(index + 1).padStart(2, "0")}</span>
                  <p className="home-card-audience">{audience}</p>
                  <h3>{name}</h3>
                  <p>{detail}</p>
                  <span className="home-card-activity">{activity}</span>
                  <span className="home-card-arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link className="home-outline-button" href="/education">교육 프로그램 전체 보기 <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="home-learning-lab" aria-labelledby="learning-lab-title">
        <div className="shell home-learning-lab-inner">
          <div className="home-learning-lab-copy">
            <p className="home-kicker">LEARNING LAB</p>
            <h2 id="learning-lab-title">배움이 끝난 뒤,<br />현장에서 바로 쓸 수 있도록.</h2>
            <p>강의실 안의 이해가 실제 생활과 업무의 판단으로 이어지도록, 관찰·토의·실습의 순서를 설계합니다.</p>
            <Link className="home-dark-link" href="/about">강사와 교육 방식 보기 <span aria-hidden="true">→</span></Link>
          </div>
          <ol className="home-approach-list">
            {teachingApproach.map(({ title, description }, index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-studio section" aria-labelledby="studio-title">
        <div className="shell home-studio-grid">
          <figure className="home-studio-image">
            <Image
              src="/images/ai-workshop.jpg"
              alt="참여자들이 노트북으로 실습하는 AI 활용교육 현장"
              fill
              sizes="(min-width: 960px) 50vw, 100vw"
            />
            <figcaption>직접 해보며 익히는 AI 활용교육</figcaption>
          </figure>
          <div className="home-studio-copy">
            <p className="home-kicker">DIGITAL PRACTICE</p>
            <h2 id="studio-title">교육의 경험을<br />디지털 도구로 넓힙니다.</h2>
            <p>수업 준비, 자료 구성, 반복되는 교육 업무까지. 필요한 범위를 함께 확인하고 적용 가능한 방식부터 제안합니다.</p>
            <div className="home-studio-links">
              {digitalServices.map(({ slug, title, description }) => (
                <Link key={slug} href="/digital">
                  <span>{title}</span>
                  <small>{description}</small>
                  <b aria-hidden="true">↗</b>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-resources" aria-labelledby="resources-title">
        <div className="shell home-resources-inner">
          <div>
            <p className="home-kicker">OPEN RESOURCES</p>
            <h2 id="resources-title">수업을 준비하는<br />과정도 함께 나눕니다.</h2>
          </div>
          <div className="home-resource-cards">
            <Link href="/materials" className="home-resource-card">
              <span>01</span>
              <h3>교육자료실</h3>
              <p>탄소중립·자원순환과 교통안전 자료의 학습 목표와 활동 예시를 살펴보세요.</p>
              <b aria-hidden="true">→</b>
            </Link>
            <Link href="/portfolio" className="home-resource-card">
              <span>02</span>
              <h3>진행 사례</h3>
              <p>교육자료와 홈페이지를 준비하며 검토하고 있는 과정을 투명하게 소개합니다.</p>
              <b aria-hidden="true">→</b>
            </Link>
          </div>
        </div>
      </section>

      <section className="home-contact-cta" aria-labelledby="contact-cta-title">
        <div className="shell">
          <p className="home-kicker">LET&apos;S TALK</p>
          <h2 id="contact-cta-title">다음 교육의 시작을<br />함께 준비해 보세요.</h2>
          <p>교육 대상과 주제, 희망 일정을 전화로 알려주세요. 수업 방식과 준비 사항을 함께 살펴보겠습니다.</p>
          <a className="home-primary-button" href={siteContact.phoneHref}>전화 상담 <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </div>
  );
}

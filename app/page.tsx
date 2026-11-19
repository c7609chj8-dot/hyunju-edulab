import Link from "next/link";
import Image from "next/image";
import { programs } from "./programs";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="shell hero-inner">
          <div>
            <p className="eyebrow">학교·교육기관·기업을 위한 교육</p>
            <h1>현장의 경험을 AI로 연결하고,<br className="desktop-break" /> 교육의 가치를 미래로 확장하다.</h1>
            <p className="hero-description">현주에듀랩은 안전·환경·AI를 주제로 현장에서 적용할 수 있는 교육을 설계합니다.</p>
            <Link className="button" href="/contact">강의 문의</Link>
            <a className="hero-link" href="#programs">교육 분야 보기</a>
            <Link className="hero-link" href="/about">강사 소개</Link>
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

      <section id="programs" className="shell section">
        <p className="eyebrow">PROGRAMS</p>
        <h2>교육 분야</h2>
        <ul className="program-grid">
          {programs.map(({ slug, name, detail }) => (
            <li key={slug}>
              <h3><Link className="program-link" href={`/education#${slug}`}>{name}</Link></h3>
              <p>{detail}</p>
            </li>
          ))}
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

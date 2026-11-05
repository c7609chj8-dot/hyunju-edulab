import Link from "next/link";
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
          <div className="hero-art" aria-hidden="true">
            <svg viewBox="0 0 420 310" fill="none">
              <rect x="46" y="35" width="328" height="240" rx="24" fill="#193a53" stroke="#365b70" />
              <path d="M74 90h272M74 155h272M74 220h272M114 64v182M210 64v182M306 64v182" stroke="#365b70" />
              <path d="M210 130c-31-23-66-28-100-14v87c34-12 69-7 100 14 31-21 66-26 100-14v-87c-34-14-69-9-100 14Z" fill="#102840" stroke="#ecf6f7" strokeWidth="3" strokeLinejoin="round" />
              <path d="M210 130v87M134 145c15-3 31 0 48 9m-48 15c15-3 31 0 48 9" stroke="#94abb8" strokeWidth="3" strokeLinecap="round" />
              <path d="m241 164 12 12 26-30" stroke="#7ee2ca" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="346" cy="90" r="5" fill="#7ee2ca" />
              <circle cx="74" cy="220" r="5" fill="#7ee2ca" />
            </svg>
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

import { pageMetadata } from "../seo";
import Link from "next/link";
import Image from "next/image";
import { programs } from "../programs";
import { teachingApproach } from "../teaching-approach";

export const metadata = pageMetadata("/about", "최현주 강사 소개 | 현주에듀랩", "최현주 강사의 안전교육 운영 경력과 AI·산업안전 관련 자격, 실습 중심 교육 방식을 소개합니다.");

const experience = [
  {
    period: "2022년부터",
    role: "㈜한국안전교육 대표이사",
    description: "기관 운영과 교육·기술·기능계 강의",
  },
  {
    period: "2018~2021년",
    role: "㈜한국안전진단 부장",
    description: "안전교육 총괄",
  },
  {
    period: "1996~2018년",
    role: "제조·산업 현장 실무",
    description: "생산·자재·위험물 관리와 안전관리 업무, 위험성평가",
  },
];

const qualifications = [
  "AI 활용지도사 1급",
  "산업안전기사",
  "위험물산업기사",
  "환경기능사",
  "에너지관리기능사",
  "탄소중립환경지도사 1급",
];

export default function AboutPage() {
  return (
    <article className="shell section content-page">
      <div className="about-intro">
        <div>
          <p className="eyebrow">INSTRUCTOR</p>
          <h1>강사 소개</h1>
          <p className="instructor-name">최현주</p>
          <p className="instructor-role">㈜한국안전교육 대표이사 · AI 활용지도사 1급</p>
          <p className="page-lead">
            제조·산업 현장과 안전교육 운영 경험을 바탕으로, 현장의 지식을 안전·환경·AI 실습교육으로 연결합니다.
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
      <section className="about-section" aria-labelledby="experience-title">
        <p className="eyebrow">EXPERIENCE</p>
        <h2 id="experience-title">주요 경력</h2>
        <ul className="experience-list">
          {experience.map(({ period, role, description }) => (
            <li key={period}>
              <p className="program-audience">{period}</p>
              <h3>{role}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="about-section" aria-labelledby="qualifications-title">
        <p className="eyebrow">QUALIFICATIONS</p>
        <h2 id="qualifications-title">관련 자격</h2>
        <ul className="qualification-list">
          {qualifications.map((qualification) => <li key={qualification}>{qualification}</li>)}
        </ul>
      </section>
      <section className="about-section" aria-labelledby="learning-title">
        <h2 id="learning-title">AI·디지털 학습 이력</h2>
        <ul className="topic-list">
          <li>ChatGPT API 활용을 위한 파이썬 코딩 교육 이수</li>
          <li>비전공자를 위한 자바스크립트 웹개발 입문 교육 이수</li>
          <li>SNS 마케팅과 네이버 스마트스토어 관리 교육 이수</li>
        </ul>
      </section>
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

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "디지털 서비스 | 현주에듀랩",
  description: "교육기관과 강사를 위한 AI 활용교육, 홈페이지 제작, 업무자동화의 적용 예시를 소개합니다.",
};

const services = [
  {
    title: "AI 활용교육",
    description: "강사와 교육 담당자가 수업 준비와 문서 작성에 AI를 활용하는 방법을 실습합니다.",
    example: "수업 활동지 초안을 만들고, 사실관계와 학습 대상에 맞는 표현을 점검합니다.",
  },
  {
    title: "홈페이지 제작",
    description: "교육 프로그램과 기관 정보를 정리하고, 방문자가 필요한 안내와 문의 화면을 쉽게 찾도록 구성합니다.",
    example: "강사 소개, 교육 과정, 자료실을 한곳에 모아 모바일에서도 확인할 수 있게 합니다.",
  },
  {
    title: "교육기관 업무자동화",
    description: "반복되는 신청 정리, 일정 안내, 보고서 작성 업무를 살펴보고 자동화할 범위를 정합니다.",
    example: "교육 신청을 하나의 표로 모아 담당자가 누락 항목과 처리 상태를 확인할 수 있게 합니다.",
  },
];

export default function DigitalPage() {
  return (
    <section className="shell section content-page">
      <p className="eyebrow">DIGITAL SERVICES</p>
      <h1>디지털 서비스</h1>
      <p className="page-lead">교육기관과 강사의 수업 준비, 홈페이지 운영, 반복 업무에 적용할 수 있는 서비스를 소개합니다.</p>
      <ul className="program-grid program-grid-detailed service-grid">
        {services.map(({ title, description, example }) => (
          <li key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
            <dl className="program-details">
              <dt>적용 예시</dt>
              <dd>{example}</dd>
            </dl>
          </li>
        ))}
      </ul>
      <div className="section-action">
        <p>문의할 때 필요한 작업과 현재 사용 중인 도구를 함께 알려주세요.</p>
        <Link className="button section-action" href="/contact">디지털 서비스 문의</Link>
      </div>
    </section>
  );
}

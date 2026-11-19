import { pageMetadata } from "../seo";
import Link from "next/link";
import { digitalServices } from "./services";

export const metadata = pageMetadata("/digital", "디지털 서비스 | 현주에듀랩", "교육기관과 강사를 위한 AI 활용교육, 홈페이지 제작, 업무자동화의 적용 예시를 소개합니다.");

export default function DigitalPage() {
  return (
    <section className="shell section content-page">
      <p className="eyebrow">DIGITAL SERVICES</p>
      <h1>디지털 서비스</h1>
      <p className="page-lead">교육기관과 강사의 수업 준비, 홈페이지 운영, 반복 업무에 적용할 수 있는 서비스를 소개합니다.</p>
      <p className="materials-note">아래는 적용 범위와 결과물 예시입니다. 일정·비용·제공 범위는 요구사항을 확인한 뒤 협의합니다.</p>
      <ul className="program-grid program-grid-detailed service-grid section-action">
        {digitalServices.map((service) => (
          <li key={service.slug} id={service.slug}>
            <p className="program-audience">{service.audience}</p>
            <h2>{service.title}</h2>
            <p>{service.description}</p>
            <dl className="program-details">
              <dt>적용 예시</dt>
              <dd>{service.example}</dd>
              <dt>협의할 결과물 예시</dt><dd>{service.deliverable}</dd>
              <dt>준비할 정보</dt><dd>{service.preparation}</dd>
              <dt>사전 확인 범위</dt><dd>{service.boundary}</dd>
            </dl>
            <div className="about-actions section-action">
              <Link className="button" href={`/contact?service=${service.slug}`}>{service.title} 의뢰</Link>
              <Link className="program-link inline-flex min-h-11 items-center" href={service.relatedHref}>{service.relatedLabel}</Link>
            </div>
          </li>
        ))}
      </ul>
      <section className="about-section" aria-labelledby="digital-process">
        <h2 id="digital-process">진행 절차</h2>
        <ol className="teaching-steps">
          <li><h3>목표와 현재 환경 확인</h3><p>필요한 작업과 사용 도구, 공개 가능한 자료를 정리합니다.</p></li>
          <li><h3>범위와 조건 협의</h3><p>결과물·일정·비용·담당 역할과 검수 기준을 확인합니다.</p></li>
          <li><h3>예시 검토 후 적용</h3><p>시안이나 실습 결과를 확인하고, 합의한 범위에서 수정·적용합니다.</p></li>
        </ol>
      </section>
      <section className="about-section" aria-labelledby="digital-faq">
        <h2 id="digital-faq">의뢰 전 확인사항</h2>
        <div className="program-faq">
          <details><summary>개인정보가 포함된 자료를 보내야 하나요?</summary><p>초기 범위 검토에는 개인정보를 제거한 예시만 준비해 주세요. 비밀번호나 서비스 비밀키는 문의 내용에 입력하지 마세요.</p></details>
          <details><summary>유료 도구나 운영 비용도 포함되나요?</summary><p>도구 구독·도메인·호스팅·외부 연동 비용과 유지관리 범위는 사전 협의 항목입니다.</p></details>
          <details><summary>의뢰 버튼을 누르면 접수되나요?</summary><p>선택한 서비스의 문의 유형을 표시하는 입력 확인 화면으로 이동합니다. 현재 입력 내용은 전송·저장되지 않으며 실제 접수는 준비 중입니다.</p></details>
        </div>
      </section>
      <div className="section-action">
        <p>문의할 때 필요한 작업과 현재 사용 중인 도구를 함께 알려주세요.</p>
        <Link className="button section-action" href="/contact">디지털 서비스 문의</Link>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { programs } from "../programs";

export const metadata: Metadata = {
  title: "교육 프로그램 | 현주에듀랩",
  description: "건설·산업안전, 학교안전, 환경, AI 활용 교육의 대상과 활동 예시를 확인하세요.",
};

export default function EducationPage() {
  return (
    <section className="shell section content-page">
      <p className="eyebrow">PROGRAMS</p>
      <h1>교육 프로그램</h1>
      <p className="page-lead">학교·교육기관·기업에서 활용할 수 있는 교육 분야와 활동 예시입니다.</p>
      <ul className="program-grid program-grid-detailed">
        {programs.map(({ slug, name, detail, audience, activity }) => (
          <li key={slug} id={slug}>
            <h2>{name}</h2>
            <p>{detail}</p>
            <dl className="program-details">
              <dt>교육 대상</dt>
              <dd>{audience}</dd>
              <dt>활동 예시</dt>
              <dd>{activity}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

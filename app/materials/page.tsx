import type { Metadata } from "next";
import MaterialsSearch from "./materials-search";

export const metadata: Metadata = {
  title: "교육자료실 | 현주에듀랩",
  description: "현주에듀랩의 탄소중립·자원순환 및 교통안전 교육자료를 살펴보세요.",
};

export default function MaterialsPage() {
  return (
    <section className="shell section content-page">
      <p className="eyebrow">MATERIALS</p>
      <h1>교육자료실</h1>
      <p className="page-lead">안전과 환경 수업에 활용할 교육자료를 주제별로 살펴보세요.</p>
      <p className="materials-note">현재는 자료 소개용 샘플 목록입니다. 원본은 공개 검토를 거쳐 제공할 예정입니다.</p>
      <MaterialsSearch />
    </section>
  );
}

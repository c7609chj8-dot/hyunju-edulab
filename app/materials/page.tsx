import { pageMetadata } from "../seo";
import MaterialsSearch from "./materials-search";
import { Suspense } from "react";

export const metadata = pageMetadata("/materials", "교육자료실 | 현주에듀랩", "현주에듀랩의 탄소중립·자원순환 및 교통안전 교육자료를 살펴보세요.");

export default function MaterialsPage() {
  return (
    <section className="shell section content-page">
      <p className="eyebrow">MATERIALS</p>
      <h1>교육자료실</h1>
      <p className="page-lead">안전과 환경 수업에 활용할 교육자료를 주제별로 살펴보세요.</p>
      <p className="materials-note">현재는 자료 소개용 목록입니다. 학습 목표와 활동 예시를 확인할 수 있으며, 원본 파일은 제공하지 않습니다.</p>
      <Suspense fallback={<p role="status">교육자료 검색을 준비하고 있습니다.</p>}><MaterialsSearch /></Suspense>
    </section>
  );
}

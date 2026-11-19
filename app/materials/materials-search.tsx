"use client";

import Link from "next/link";
import { useRef } from "react";
import { useSearchParams } from "next/navigation";
import { materials } from "./catalog";
import { materialCategories, materialSearchSuffix, readMaterialSearch } from "./search-params";

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

export default function MaterialsSearch() {
  const params = useSearchParams();
  const { query, category } = readMaterialSearch(params);
  const searchInput = useRef<HTMLInputElement>(null);
  function updateSearch(nextQuery: string, nextCategory: string, push = false) {
    const url = `/materials${materialSearchSuffix(nextQuery, nextCategory)}`;
    if (push) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }
  const terms = query.trim().split(/\s+/).map(normalize).filter(Boolean);
  const results = materials.filter((material) => {
    if (category && material.categoryId !== category) return false;
    const fields = [material.title, material.category, material.audience, material.description, ...material.topics].map(normalize);
    return terms.every((term) => fields.some((field) => field.includes(term)));
  });

  return (
    <>
      <div role="search" aria-label="교육자료 검색" className="materials-search">
        <label htmlFor="materials-query">교육자료 검색</label>
        <input
          id="materials-query"
          ref={searchInput}
          type="search"
          value={query}
          maxLength={100}
          aria-describedby="materials-search-help"
          onChange={(event) => updateSearch(event.target.value, category)}
          placeholder="예: 교통안전, 자원순환"
        />
        <button
          type="button"
          disabled={!query && !category}
          onClick={() => {
            updateSearch("", "", true);
            searchInput.current?.focus();
          }}
        >
          초기화
        </button>
        <label htmlFor="materials-category">교육 분야</label>
        <select id="materials-category" value={category} onChange={(event) => updateSearch(query, event.target.value, true)}>
          <option value="">전체 분야</option>
          {materialCategories.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <p id="materials-search-help" className="materials-help">검색어와 분야를 함께 적용합니다. 현재 주소를 복사하면 검색 조건을 공유할 수 있습니다. 검색어에 개인정보를 입력하지 마세요.</p>
      <p className="materials-count" role="status">검색 결과 {results.length}건</p>
      {results.length > 0 ? (
        <ul className="program-grid program-grid-detailed">
          {results.map(({ slug, title, category: categoryLabel, audience, description }) => (
            <li key={slug}>
              <p className="eyebrow">{categoryLabel} · {audience}</p>
              <h2><Link className="program-link" href={`/materials/${slug}${materialSearchSuffix(query, category)}`}>{title}</Link></h2>
              <p>{description}</p>
              <p className="case-status">웹 소개 공개 · 원본 미제공</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="materials-note">검색어와 일치하는 자료가 없습니다. 다른 주제나 키워드로 검색해 보세요.</p>
      )}
    </>
  );
}

"use client";

import { useRef, useState } from "react";
import { materials } from "./catalog";

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

export default function MaterialsSearch() {
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const terms = query.trim().split(/\s+/).map(normalize).filter(Boolean);
  const results = materials.filter(({ title, category, audience, description, topics }) => {
    const fields = [title, category, audience, description, ...topics].map(normalize);
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
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 교통안전, 자원순환"
        />
        <button
          type="button"
          disabled={!query}
          onClick={() => {
            setQuery("");
            searchInput.current?.focus();
          }}
        >
          초기화
        </button>
      </div>
      <p className="materials-count" role="status">검색 결과 {results.length}건</p>
      {results.length > 0 ? (
        <ul className="program-grid program-grid-detailed">
          {results.map(({ slug, title, category, audience, description }) => (
            <li key={slug}>
              <p className="eyebrow">{category} · {audience}</p>
              <h2>{title}</h2>
              <p>{description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="materials-note">검색어와 일치하는 자료가 없습니다. 다른 주제나 키워드로 검색해 보세요.</p>
      )}
    </>
  );
}

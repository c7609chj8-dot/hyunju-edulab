"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { materialSearchSuffix, readMaterialSearch } from "./search-params";

export default function MaterialsBackLink() {
  const { query, category } = readMaterialSearch(useSearchParams());
  return <Link className="program-link inline-flex min-h-11 items-center" href={`/materials${materialSearchSuffix(query, category)}`}>교육자료실 목록으로</Link>;
}

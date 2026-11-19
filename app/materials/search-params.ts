export const materialCategories = [
  { value: "environment", label: "환경교육" },
  { value: "school-safety", label: "학교안전" },
];

type SearchValues = { getAll(name: string): string[] };

export function readMaterialSearch(params: SearchValues) {
  const queries = params.getAll("q");
  const categories = params.getAll("category");
  const query = queries.length === 1 ? queries[0].slice(0, 100) : "";
  const category = categories.length === 1 && materialCategories.some((item) => item.value === categories[0]) ? categories[0] : "";
  return { query, category };
}

export function materialSearchSuffix(query: string, category: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  return params.size ? `?${params}` : "";
}

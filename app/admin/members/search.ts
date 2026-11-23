export const membersPerPage = 25;
export function memberSearch(input: unknown) {
  return typeof input === "string" ? input.normalize("NFKC").replace(/[^\p{L}\p{N}@._+\- ]/gu, "").trim().slice(0, 80) : "";
}
export function memberPage(input: unknown) {
  if (typeof input !== "string" || !/^\d{1,4}$/u.test(input)) return 1;
  return Math.max(1, Math.min(1000, Number(input)));
}
export function memberSearchFilter(input: string) {
  const escaped = memberSearch(input).replace(/[%_\\]/gu, "\\$&");
  return `full_name.ilike.%${escaped}%,username.ilike.%${escaped}%,email.ilike.%${escaped}%`;
}

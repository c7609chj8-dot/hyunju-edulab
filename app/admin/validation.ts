export type MemberEditState = { status: "idle" | "error" | "success"; message: string; revision?: number };
export const initialMemberEditState: MemberEditState = { status: "idle", message: "" };
export function validMemberId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/iu.test(value);
}
export function memberUpdateInput(data: FormData) {
  const read = (name: string) => typeof data.get(name) === "string" ? String(data.get(name)).trim() : "";
  const id = read("id"), revision = read("revision");
  const full_name = read("full_name"), username = read("username").toLowerCase();
  const address = read("address"), phone = read("phone").replace(/[-\s]/gu, ""), account_status = read("account_status");
  if (!validMemberId(id) || !/^\d{1,10}$/u.test(revision) || Number(revision)<1 || Number(revision)>=2147483647) return { valid: false as const, message: "대상 회원 정보를 새로고침한 후 다시 시도해 주세요." };
  if (!full_name || full_name.length>80) return { valid: false as const, message: "이름을 1~80자로 입력해 주세요." };
  if (username && !/^[a-z][a-z0-9_]{3,19}$/u.test(username)) return { valid: false as const, message: "아이디는 영문 소문자로 시작하는 4~20자 영문·숫자·밑줄로 입력해 주세요." };
  if (address.length>300 || (phone && !/^0[0-9]{8,10}$/u.test(phone))) return { valid: false as const, message: "주소는 300자 이내, 전화번호는 0으로 시작하는 9~11자리로 입력해 주세요." };
  if (account_status!=="active" && account_status!=="suspended") return { valid: false as const, message: "이용 상태를 확인해 주세요." };
  return { valid: true as const, id, revision: Number(revision), update: { full_name, username: username || null, address: address || null, phone: phone || null, account_status } };
}

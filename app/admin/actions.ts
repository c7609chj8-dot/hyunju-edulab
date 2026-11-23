"use server";
import { revalidatePath } from "next/cache";
import { administrationAccess } from "./access";
import { memberUpdateInput, type MemberEditState } from "./validation";

export async function updateMember(_previous: MemberEditState, data: FormData): Promise<MemberEditState> {
  const access = await administrationAccess();
  if (access.kind!=="allowed") return { status: "error", message: "활성 관리자 권한과 DB 연결을 확인해 주세요." };
  const input = memberUpdateInput(data);
  if (!input.valid) return { status: "error", message: input.message };
  const { data: updated, error } = await access.client.from("member_profiles").update(input.update).eq("user_id", input.id).eq("revision", input.revision).select("revision").maybeSingle();
  if (error) return { status: "error", message: error.code==="23505" ? "이미 사용 중인 아이디입니다." : error.code==="P0001" ? "관리자 계정은 이 화면에서 이용 정지할 수 없습니다." : "저장하지 못했습니다. 입력값과 관리자 권한을 확인해 주세요." };
  if (!updated) return { status: "error", message: "회원 정보가 변경됐거나 대상이 없습니다. 새로고침 후 다시 확인해 주세요." };
  revalidatePath("/admin"); revalidatePath("/admin/members"); revalidatePath(`/admin/members/${input.id}`); revalidatePath("/account");
  return { status: "success", message: "회원 정보를 저장했습니다.", revision: updated.revision };
}

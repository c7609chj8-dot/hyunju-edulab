"use server";

import { revalidatePath } from "next/cache";
import { administrationAccess } from "../access";
import { prepareInquiryStatusChange } from "../../inquiries/workflow";

export type InquiryStatusState = { kind: "idle" | "error" | "success"; message: string };

export async function changeInquiryStatus(
  _state: InquiryStatusState,
  form: FormData,
): Promise<InquiryStatusState> {
  const access = await administrationAccess();
  if (access.kind !== "allowed") {
    return { kind: "error", message: "활성 관리자 권한과 DB 연결을 확인해 주세요." };
  }

  const revision = form.get("revision");
  const expectedRevision = typeof revision === "string" && /^\d{1,10}$/u.test(revision)
    && Number(revision) < 2147483647 ? Number(revision) : 0;
  const prepared = prepareInquiryStatusChange({
    access: { allowed: true, authUserId: access.user.id, role: "administrator" },
    inquiryId: form.get("id"),
    currentStatus: form.get("currentStatus"),
    nextStatus: form.get("nextStatus"),
    expectedRevision,
  });
  if (!prepared.valid) {
    return { kind: "error", message: "현재 상태에서 변경할 수 있는 상태를 선택해 주세요." };
  }

  const { inquiryId, transition } = prepared.change;
  const { data, error } = await access.client.rpc("change_inquiry_status", {
    inquiry_id: inquiryId,
    expected_revision: prepared.change.expectedRevision,
    expected_status: transition.previousStatus,
    next_status: transition.nextStatus,
  });
  if (error) {
    return { kind: "error", message: "상태를 변경하지 못했습니다. 관리자 권한을 확인하고 다시 시도해 주세요." };
  }
  if (data !== true) {
    return { kind: "error", message: "문의 정보가 변경됐거나 삭제되었습니다. 새로고침 후 다시 시도해 주세요." };
  }

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return { kind: "success", message: "문의 상태를 변경했습니다." };
}

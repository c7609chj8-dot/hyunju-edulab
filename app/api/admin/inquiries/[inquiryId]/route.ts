import { NextResponse } from "next/server";
import { getInquiryAdministratorAccess } from "../../../../lib/supabase/admin";
import { createSupabaseAdminClient } from "../../../../lib/supabase/server";
import { isInquiryStatus } from "../../../../inquiries/workflow";

const responseHeaders = { "Cache-Control": "no-store" };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export const runtime = "nodejs";

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: responseHeaders });
}

function isPositiveRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

function sameOriginOrNoOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

type StatusChangeResponse = {
  outcome: "updated" | "forbidden" | "not_found" | "revision_conflict" | "same_status" | "invalid_transition";
  status: string | null;
  revision: number | null;
};

function parseStatusChangeResponse(value: unknown): StatusChangeResponse | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;

  const record = candidate as Record<string, unknown>;
  const validOutcome = ["updated", "forbidden", "not_found", "revision_conflict", "same_status", "invalid_transition"];
  if (!validOutcome.includes(String(record.outcome))) return null;
  if (record.status !== null && typeof record.status !== "string") return null;
  if (record.revision !== null && typeof record.revision !== "number") return null;

  return {
    outcome: record.outcome as StatusChangeResponse["outcome"],
    status: record.status as string | null,
    revision: record.revision as number | null,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ inquiryId: string }> },
) {
  if (!sameOriginOrNoOrigin(request)) {
    return json({ error: "invalid_origin", message: "요청 출처를 확인할 수 없습니다." }, 403);
  }

  const access = await getInquiryAdministratorAccess();
  if (!access.allowed) {
    if (access.status === 401) return json({ error: "unauthenticated", message: "로그인이 필요합니다." }, 401);
    if (access.status === 403) return json({ error: "forbidden", message: "관리자 권한이 필요합니다." }, 403);
    return json({ error: "admin_not_configured", message: "관리자 설정이 완료되지 않았습니다." }, 503);
  }

  const { inquiryId } = await context.params;
  if (!uuidPattern.test(inquiryId)) {
    return json({ error: "invalid_inquiry", message: "문의 식별자가 올바르지 않습니다." }, 400);
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return json({ error: "unsupported_media_type", message: "JSON 요청만 처리할 수 있습니다." }, 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json", message: "요청 형식이 올바르지 않습니다." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "invalid_status_change", message: "상태 변경 요청이 올바르지 않습니다." }, 400);
  }

  const payload = body as Record<string, unknown>;
  if (!isInquiryStatus(payload.status) || !isPositiveRevision(payload.revision)) {
    return json({ error: "invalid_status_change", message: "상태 또는 버전을 확인해 주세요." }, 400);
  }

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return json({ error: "admin_not_configured", message: "관리자 설정이 완료되지 않았습니다." }, 503);

  const { data, error } = await adminClient.rpc("change_inquiry_status", {
    p_inquiry_id: inquiryId.toLowerCase(),
    p_actor_user_id: access.authUserId,
    p_expected_revision: payload.revision,
    p_next_status: payload.status,
    p_request_id: crypto.randomUUID(),
  });

  if (error) {
    console.error("[admin/inquiries] status update failed", { code: error.code ?? "unknown" });
    return json({ error: "status_update_failed", message: "상태를 저장하지 못했습니다." }, 503);
  }

  const result = parseStatusChangeResponse(data);
  if (!result) {
    console.error("[admin/inquiries] status update returned an unexpected result");
    return json({ error: "status_update_failed", message: "상태를 저장하지 못했습니다." }, 503);
  }

  if (result.outcome === "updated" && result.status && isInquiryStatus(result.status) && result.revision) {
    return json({ status: result.status, revision: result.revision }, 200);
  }

  if (result.outcome === "not_found") return json({ error: "not_found", message: "문의를 찾을 수 없습니다." }, 404);
  if (result.outcome === "forbidden") return json({ error: "forbidden", message: "관리자 권한이 필요합니다." }, 403);
  if (result.outcome === "revision_conflict") {
    return json({ error: "revision_conflict", message: "목록이 변경되었습니다. 새로고침한 뒤 다시 시도해 주세요." }, 409);
  }

  return json({ error: "invalid_transition", message: "허용되지 않은 상태 변경입니다." }, 409);
}

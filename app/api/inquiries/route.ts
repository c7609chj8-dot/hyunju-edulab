import { createHash, randomInt, randomUUID } from "node:crypto";
import { createNewInquiryPersistencePlan } from "../../inquiries/persistence.server";
import { createInquiryStore } from "../../inquiries/store.server";
import { NextResponse } from "next/server";
import { validateIdempotencyKey } from "../../inquiries/idempotency";
import { getInquiryRetentionPolicy } from "../../inquiries/retention.server";
import { validateInquirySubmission } from "../../inquiries/validation";

const inquiryNumberAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

const responseHeaders = { "Cache-Control": "no-store" };

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: responseHeaders });
}

function unavailable() {
  return json(
    { error: "inquiry_backend_not_configured", message: "문의 접수 서비스는 아직 준비 중입니다." },
    503,
  );
}

export async function POST(request: Request) {
  if (process.env.INQUIRY_API_ENABLED !== "true") return unavailable();

  const retentionPolicy = getInquiryRetentionPolicy();
  if (!retentionPolicy.ready) return unavailable();

  const idempotency = validateIdempotencyKey(request.headers.get("idempotency-key"));
  if (!idempotency.valid) {
    return json(
      {
        error: "invalid_idempotency_key",
        field: "idempotencyKey",
        message: idempotency.message,
      },
      400,
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("application/json")) {
    return json({ error: "unsupported_media_type", message: "JSON 요청만 처리할 수 있습니다." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 12_000) {
    return json({ error: "payload_too_large", message: "요청 내용이 너무 큽니다." }, 413);
  }

  const requestId = randomUUID();
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    console.error("[inquiries] rejected malformed JSON", { requestId });
    return json({ error: "invalid_json", message: "요청 형식이 올바르지 않습니다." }, 400);
  }

  const validation = validateInquirySubmission(payload, {
    expectedPrivacyPolicyVersion: retentionPolicy.policy.privacyPolicyVersion,
  });
  if (!validation.valid) {
    return json({ error: "invalid_inquiry", fields: validation.errors }, 400);
  }

  const { privacyConsentedAt, ...normalizedSubmission } = validation.data;
  const inquiryNumber = "HJ-" + Array.from(
    { length: 12 },
    () => inquiryNumberAlphabet[randomInt(inquiryNumberAlphabet.length)],
  ).join("");
  const persistence = createNewInquiryPersistencePlan({
    submission: validation.data,
    inquiryId: randomUUID(),
    inquiryNumber,
    idempotencyKeyHash: sha256(idempotency.key),
    requestFingerprint: sha256(JSON.stringify(normalizedSubmission)),
    receivedAt: new Date(privacyConsentedAt),
    retentionPolicy: retentionPolicy.policy,
  });
  if (!persistence.valid) return unavailable();

  try {
    const store = createInquiryStore();
    if (!store) return unavailable();

    const result = await store.saveNewInquiry(persistence.plan);
    if (result.outcome === "idempotency_conflict") {
      return json(
        { error: "idempotency_conflict", message: "같은 접수 키로 다른 문의를 보낼 수 없습니다." },
        409,
      );
    }

    return json(result, result.outcome === "created" ? 201 : 200);
  } catch {
    console.error("[inquiries] storage failed", { requestId });
    return unavailable();
  }
}

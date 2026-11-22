import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../lib/supabase/server";
import {
  createInquiryId,
  createInquiryNumber,
  createInquiryRequestFingerprint,
  hashInquiryValue,
} from "../../inquiries/identifiers.server";
import { validateIdempotencyKey } from "../../inquiries/idempotency";
import { createNewInquiryPersistencePlan } from "../../inquiries/persistence.server";
import { takeInquiryRateLimit } from "../../inquiries/request-guard.server";
import { getInquiryRetentionPolicy } from "../../inquiries/retention.server";
import { validateInquirySubmission } from "../../inquiries/validation";

const responseHeaders = { "Cache-Control": "no-store" };
const maxPayloadBytes = 12_000;
const maximumPersistenceAttempts = 3;

export const runtime = "nodejs";

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { ...responseHeaders, ...headers },
  });
}

function unavailable() {
  return json(
    { error: "inquiry_backend_not_configured", message: "문의 접수 서비스는 아직 준비 중입니다." },
    503,
  );
}

type StoredInquiryResponse = {
  outcome: "created" | "replayed" | "idempotency_conflict";
  inquiry_number: string | null;
  created_at: string | null;
};

function parseStoredInquiryResponse(value: unknown): StoredInquiryResponse | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;

  const record = candidate as Record<string, unknown>;
  const outcome = record.outcome;
  const inquiryNumber = record.inquiry_number;
  const createdAt = record.created_at;
  if (
    (outcome !== "created" && outcome !== "replayed" && outcome !== "idempotency_conflict")
    || (inquiryNumber !== null && typeof inquiryNumber !== "string")
    || (createdAt !== null && typeof createdAt !== "string")
  ) {
    return null;
  }

  return { outcome, inquiry_number: inquiryNumber, created_at: createdAt };
}

export async function POST(request: Request) {
  if (process.env.INQUIRY_API_ENABLED !== "true") return unavailable();

  const retentionPolicy = getInquiryRetentionPolicy();
  if (!retentionPolicy.ready) return unavailable();

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) return unavailable();

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

  const rateLimit = takeInquiryRateLimit(request.headers);
  if (!rateLimit.allowed) {
    return json(
      { error: "too_many_requests", message: "잠시 후 다시 시도해 주세요." },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("application/json")) {
    return json({ error: "unsupported_media_type", message: "JSON 요청만 처리할 수 있습니다." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxPayloadBytes) {
    return json({ error: "payload_too_large", message: "요청 내용이 너무 큽니다." }, 413);
  }

  const requestId = crypto.randomUUID();
  let rawPayload: string;
  try {
    rawPayload = await request.text();
  } catch {
    console.error("[inquiries] rejected unreadable request body", { requestId });
    return json({ error: "invalid_json", message: "요청 형식이 올바르지 않습니다." }, 400);
  }

  if (new TextEncoder().encode(rawPayload).byteLength > maxPayloadBytes) {
    return json({ error: "payload_too_large", message: "요청 내용이 너무 큽니다." }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawPayload);
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

  const requestFingerprint = createInquiryRequestFingerprint(validation.data);
  const idempotencyKeyHash = hashInquiryValue(idempotency.key);
  const receivedAt = new Date();

  for (let attempt = 1; attempt <= maximumPersistenceAttempts; attempt += 1) {
    const persistence = createNewInquiryPersistencePlan({
      submission: validation.data,
      inquiryId: createInquiryId(),
      inquiryNumber: createInquiryNumber(),
      idempotencyKeyHash,
      requestFingerprint,
      receivedAt,
      retentionPolicy: retentionPolicy.policy,
    });

    if (!persistence.valid) {
      console.error("[inquiries] could not create persistence plan", { requestId, reason: persistence.reason });
      return unavailable();
    }

    const inquiry = persistence.plan.inquiry;
    const { data, error } = await adminClient.rpc("create_inquiry", {
      p_id: inquiry.id,
      p_inquiry_number: inquiry.inquiryNumber,
      p_idempotency_key_hash: inquiry.idempotencyKeyHash,
      p_request_fingerprint: inquiry.requestFingerprint,
      p_program_slug: inquiry.programSlug,
      p_category: inquiry.inquiryType,
      p_sender_name: inquiry.senderName,
      p_sender_contact: inquiry.senderContact,
      p_sender_email: inquiry.senderEmail,
      p_message: inquiry.message,
      p_privacy_policy_version: inquiry.privacyPolicyVersion,
      p_privacy_consented_at: inquiry.privacyConsentedAt,
      p_retention_due_at: inquiry.retentionDueAt,
      p_created_at: inquiry.createdAt,
    });

    if (error) {
      if (error.code === "23505" && attempt < maximumPersistenceAttempts) continue;

      console.error("[inquiries] storage failed", { requestId, code: error.code ?? "unknown" });
      return unavailable();
    }

    const saved = parseStoredInquiryResponse(data);
    if (!saved) {
      console.error("[inquiries] storage returned an unexpected result", { requestId });
      return unavailable();
    }

    if (saved.outcome === "idempotency_conflict") {
      return json(
        {
          error: "idempotency_conflict",
          message: "동일한 중복 방지 키로 다른 요청을 처리할 수 없습니다.",
        },
        409,
      );
    }

    if (!saved.inquiry_number || !saved.created_at) {
      console.error("[inquiries] storage returned an incomplete result", { requestId });
      return unavailable();
    }

    return json(
      {
        outcome: saved.outcome,
        inquiryNumber: saved.inquiry_number,
        receivedAt: saved.created_at,
      },
      saved.outcome === "created" ? 201 : 200,
    );
  }

  console.error("[inquiries] persistence collision retry limit reached", { requestId });
  return unavailable();
}
